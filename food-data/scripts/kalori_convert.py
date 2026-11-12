"""Kalori's chain menus (kalori.jp) -> out/private/kalori.json (docs/food-data.md "Kalori"): members only, served by the
relay from Workers KV (GET /food/kalori), never in git or on Pages. Not a build.py target: no verify.json, no index.

Run (from the repo root; stdlib only):
  python3 -I food-data/scripts/kalori_convert.py <items.jsonl> [--shops shops.csv] [--off products.json] [--out file]
Then relay/scripts/kalori-put.sh uploads the file.

Values are per serving (`sv`, one 1食 portion of a nominal 100 g); a row is dropped with no name or kcal, a name over
60 characters, values over the custom-food limits (kcal 5000, nutrients 500 g), or the same product as an Open Food
Facts one (the same name and the shop as its brand: its label per 100 g wins; the same name by another maker is another
food).
"""
import argparse, csv, json, math, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIASES = os.path.join(ROOT, 'data_src', 'kalori_shops.json')
OUT = os.path.join(ROOT, 'out', 'private', 'kalori.json')
OFF = os.path.join(os.path.dirname(ROOT), 'app', 'static', 'food', 'products.json')

NAME_MAX = 60        # contract/food.ts FOOD_NAME_CHARS
KCAL_MAX = 5000      # contract/food.ts CUSTOM.kcalMax (per serving)
NUTRIENT_MAX = 500   # CUSTOM.nutrientMax
PORTIONS = [{'label': '1食', 'g': 100}]
META = {'source': 'kalori', 'label': 'kalori.jp（チェーン店のメニュー）',
        'attribution': 'kalori.jp（各社の公表値と kalori.jp の AI 推定値）', 'license': 'kalori.jp 利用規約',
        'url': 'https://kalori.jp'}

# Kalori's common_genre -> our category (app/src/lib/art.ts FOOD_CAT); then the shop's kind; else その他
GENRE_CAT = {
    'noodle': '麺', 'pasta': '麺', 'set-meal': '丼・定食', 'rice-bowl': '丼・定食', 'sushi': '寿司', 'onigiri': '主食',
    'bento': '主食', 'curry': '主食', 'pizza': '主食', 'bread': 'パン', 'pastry': 'パン', 'sandwich': 'パン', 'burger': 'パン',
    'pork': '肉', 'beef': '肉', 'chicken': '肉', 'steak': '肉', 'fried-chicken': '肉', 'fish': '魚介', 'seafood': '魚介',
    'egg-dish': '卵', 'tofu': '大豆・豆', 'gyoza': '主菜', 'tempura': '主菜', 'salad': '副菜', 'soup': '汁物',
    'snack': '菓子・デザート', 'dessert': '菓子・デザート', 'cake': '菓子・デザート', 'ice-cream': '菓子・デザート',
    'alcohol': '酒', 'soft-drink': '飲料', 'tea': '飲料', 'coffee': '飲料', 'juice': '飲料', 'smoothie': '飲料',
    'other': 'その他'}
SHOP_CAT = {
    'sushi': '寿司', 'ramen': '麺', 'udon': '麺', 'soba': '麺', 'gyudon': '丼・定食', 'teishoku': '丼・定食',
    'bread': 'パン', 'sweets': '菓子・デザート', 'confectionery': '菓子・デザート', 'curry': '主食', 'pizza': '主食',
    'yakiniku': '肉', 'yakitori': '肉', 'tonkatsu': '肉', 'karaage': '肉', 'tempura': '主菜', 'convenience': 'コンビニ'}

# Variants: a trailing size / milk part, in brackets (カフェ モカ（Tall・豆乳）) or after a space (牛丼 並盛). Each word's rank
# picks the group's default (lowest first: the regular size, plain milk).
SIZES = ['並盛', '並', 'レギュラー', 'R', 'Tall', 'M', 'Mサイズ', '中', 'ジャストサイズ', 'Short', 'S', 'Sサイズ', '小',
         '小盛', 'ミニ', 'ハーフ', 'Grande', 'L', 'Lサイズ', '大', '大盛', 'あたま大盛', 'Venti', '特盛', '超特盛', 'メガ']
MILKS = ['ミルク', '牛乳', '低脂肪乳', '無脂肪乳', '豆乳', 'アーモンドミルク', 'オーツミルク', 'ブレベ']
RANK = {w: (0, i) for i, w in enumerate(SIZES)} | {w: (1, i) for i, w in enumerate(MILKS)}
BRACKET = re.compile(r'^(.+?)\s*[（(]([^（()）]+)[)）]$')
SPACED = re.compile(r'^(.+?)[ 　]+(\S+)$')
# katakana spellings of the English sizes, as search aliases (トール, グランデ)
KANA = {'Short': 'ショート', 'Tall': 'トール', 'Grande': 'グランデ', 'Venti': 'ベンティ'}
KANA_RE = re.compile(r'\b(%s)\b' % '|'.join(KANA))


def num(x):
    """A finite number or None."""
    return x if isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) else None


def r1(x):
    return None if x is None else round(x + 1e-9, 1)


def est_of(r):
    """'e': kcal estimated (or no flags: a ranking board's row), 'p': official kcal with estimated PFC, None: official."""
    cal, pfc = r.get('isCalEstimated'), r.get('isPfcEstimated')
    if cal is None and pfc is None or cal:
        return 'e'
    return 'p' if pfc else None


def variant_of(name):
    """(stem, state, rank) for a name ending in size / milk words, else None."""
    for pat, sep in ((BRACKET, '・'), (SPACED, None)):
        m = pat.match(name)
        if not m:
            continue
        words = m.group(2).split(sep) if sep else [m.group(2)]
        if all(w in RANK for w in words) and len({RANK[w][0] for w in words}) == len(words):
            rank = tuple(min((RANK[w][1] for w in words if RANK[w][0] == axis), default=0) for axis in (0, 1))
            return m.group(1).strip(), m.group(2), rank
    return None


def group_variants(items):
    """`vg` (the group's default item's id) and `st` (its state chip) on a shop's items that differ only in their
    trailing size / milk words: 2+ items in distinct states. The default: the regular size, plain milk."""
    groups = {}
    for it in items:
        v = variant_of(it['name'])
        if v:
            groups.setdefault((it['shop'], v[0]), []).append((v[2], v[1], it))
    for g in groups.values():
        if len(g) < 2 or len({st for _, st, _ in g}) < len(g):
            continue
        g.sort(key=lambda x: (x[0], x[2]['kcal']))
        for _, st, it in g:
            it['vg'], it['st'] = g[0][2]['id'], st


def read_jsonl(path):
    with open(path, encoding='utf-8') as fh:
        return [json.loads(line) for line in fh if line.strip()]


def read_shops(path):
    """{shop id: Japanese name} from shops.csv (the items' own shop_name wins)."""
    if not path or not os.path.exists(path):
        return {}
    with open(path, encoding='utf-8', newline='') as fh:
        return {r['shop_id']: r.get('ja') or r.get('name') or r['shop_id'] for r in csv.DictReader(fh)}


def read_aliases(path=ALIASES):
    with open(path, encoding='utf-8') as fh:
        doc = json.load(fh)
    return {k: v for k, v in doc.items() if not k.startswith('_')}


def norm(s):
    """A name or brand to compare: NFKC, lower case, no spaces or dashes or ・."""
    return re.sub(r'[\s\-・]', '', unicodedata.normalize('NFKC', s or '').lower())


def off_names(path):
    """{OFF product name: its brands (norm)}."""
    out = {}
    if not path or not os.path.exists(path):
        return out
    with open(path, encoding='utf-8') as fh:
        for it in json.load(fh)['items']:
            out.setdefault(it['name'], set()).add(norm(it.get('brand')))
    return out


def same_maker(brands, words):
    """Whether an OFF brand names the shop (either holds the other; 3+ characters, so 'co' names nobody)."""
    return any(len(b) >= 3 and len(w) >= 3 and (b in w or w in b) for b in brands for w in words)


def item_of(r, shop_name, cat):
    it = {'id': 'kal:%s' % r['id'], 'name': r['name'].strip(), 'brand': shop_name, 'shop': r['shop_id'], 'cat': cat,
          'kcal': int(math.floor(num(r['cal']) + 0.5))}
    for k in ('p', 'f', 'c'):
        it[k] = r1(num(r.get(k)))
    for src, k in (('salt', 'salt'), ('fiber', 'fib')):
        if num(r.get(src)) is not None:
            it[k] = r1(num(r[src]))
    est = est_of(r)
    if est:
        it['est'] = est
    gen = r.get('aiImageGenerationId')
    if isinstance(gen, int) and not isinstance(gen, bool) and gen > 0 and r.get('aiImageStatus') in (None, 'completed'):
        it['img'] = gen
    it['sv'] = True
    it['portions'] = [dict(p) for p in PORTIONS]
    if KANA_RE.search(it['name']):
        it['aliases'] = [KANA_RE.sub(lambda m: KANA[m.group(1)], it['name'])]
    return it


def convert(rows, shops=None, aliases=None, off=None):
    """(dataset, report): rows as kalori.py export writes them."""
    shops, aliases, off = shops or {}, aliases or {}, off or {}
    drop = {'no_values': 0, 'long_name': 0, 'range': 0, 'off_product': 0, 'duplicate': 0}
    items, seen = [], set()
    for r in rows:
        name = (r.get('name') or '').strip()
        if not name or num(r.get('cal')) is None or not r.get('shop_id') or r.get('id') is None:
            drop['no_values'] += 1
            continue
        if len(name) > NAME_MAX:
            drop['long_name'] += 1
            continue
        vals = [num(r.get(k)) for k in ('p', 'f', 'c', 'salt', 'fiber')]
        if not 0 <= num(r['cal']) <= KCAL_MAX or any(v is not None and not 0 <= v <= NUTRIENT_MAX for v in vals):
            drop['range'] += 1
            continue
        shop_name = (r.get('shop_name') or '').strip() or shops.get(r['shop_id']) or r['shop_id']
        if name in off and same_maker(off[name], {norm(w) for w in [shop_name, *aliases.get(r['shop_id'], [])]}):
            drop['off_product'] += 1
            continue
        if r['id'] in seen:
            drop['duplicate'] += 1
            continue
        seen.add(r['id'])
        cat = GENRE_CAT.get(r.get('common_genre')) or SHOP_CAT.get(r.get('shop_category')) or 'その他'
        items.append(item_of(r, shop_name, cat))
    group_variants(items)
    items.sort(key=lambda it: (it['shop'], it['id']))
    names = {}
    for it in items:
        names.setdefault(it['shop'], it['brand'])
    header = {s: {'name': n, **({'aliases': aliases[s]} if aliases.get(s) else {})} for s, n in sorted(names.items())}
    report = {'items': len(items), 'shops': len(header), 'dropped': drop,
              'est': {k: sum(it.get('est') == k for it in items) for k in ('e', 'p')},
              'img': sum('img' in it for it in items), 'grouped': sum('vg' in it for it in items),
              'unknown_alias_shops': sorted(set(aliases) - set(names))}
    return {**META, 'shops': header, 'items': items}, report


def errors(doc):
    """What a served file must hold (the app's FoodSnap limits); [] when sound."""
    errs, ids = [], set()
    for it in doc['items']:
        i = it.get('id')
        if not isinstance(i, str) or not i.startswith('kal:') or i in ids:
            errs.append('%s: bad or repeated id' % i)
        ids.add(i)
        if not it.get('name') or len(it['name']) > NAME_MAX or it.get('shop') not in doc['shops']:
            errs.append('%s: name or shop' % i)
        if not isinstance(it.get('kcal'), int) or not 0 <= it['kcal'] <= KCAL_MAX:
            errs.append('%s: kcal' % i)
        if any(it.get(k) is not None and not 0 <= it[k] <= NUTRIENT_MAX for k in ('p', 'f', 'c', 'salt', 'fib')):
            errs.append('%s: nutrient' % i)
        if it.get('sv') is not True or it.get('portions') != PORTIONS:
            errs.append('%s: serving' % i)
    errs += ['%s: vg names no item' % it['id'] for it in doc['items'] if 'vg' in it and it['vg'] not in ids]
    return errs


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('items')
    ap.add_argument('--shops', help='shops.csv (default: beside items.jsonl)')
    ap.add_argument('--off', default=OFF, help='products.json whose names win (default: app/static/food/)')
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args(argv)
    shops = read_shops(a.shops or os.path.join(os.path.dirname(a.items), 'shops.csv'))
    doc, report = convert(read_jsonl(a.items), shops, read_aliases(), off_names(a.off))
    errs = errors(doc)
    if errs:
        sys.exit('kalori: %d problems, e.g. %s' % (len(errs), errs[:5]))
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    body = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    with open(a.out, 'w', encoding='utf-8') as fh:
        fh.write(body)
    report['bytes'] = len(body.encode('utf-8'))
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1:])
