"""Kalori's chain menus (kalori.jp) -> kalori.json (docs/food-data.md "Kalori"): build.py's `kalori` target, a lazy
secondary dataset shipped like products.json. Never in verify.json (its values are estimates or per serving).

Input: the shard-*.jsonl files of https://github.com/huangwaylon/test (data/products/, fetched into raw/kalori/ by
`fetch.py kalori`), append-only, one product fetch a line. Only format v2 lines (with `nutrients`) count; per product
(shop, id) the latest `fetched_at` wins.

Run alone to see the counts (from the repo root; stdlib only):
  python3 -I food-data/scripts/kalori_convert.py <dir or shard files> [--off products.json] [--out file]
--out (and build.py) refuse a partial input (`partial`) unless KALORI_ALLOW_PARTIAL=1.

Values are per serving (one 1食 portion of a nominal 100 g); a nutrient the page doesn't show is unknown (null;
fibre absent), never 0. Names are cleaned (tidy, uncoded, unsuffixed, short). A row is dropped with no name or kcal,
values over the custom-food limits (kcal 5000, nutrients 500 g, fibre 100 g: lib.validate), kcal far from Atwater
(implausible), the same product as an Open Food Facts one (the same name and the shop as its brand: its label per
100 g wins; the same name by another maker is another food), a near-duplicate (the shop's same name but for width or
spaces: the current, latest, higher-id one stays) or a name over 60 characters that, cut short, meets another.
A product the page says may be discontinued (`ended`) or the shop's listing no longer shows (`listed: false`) stays,
marked `ended: true` and `pop: -1` (ranked under the current menu).

What every item would carry is left to the app's loader (db.ts withJan, for `source: kalori`): `sv: true`, the one
1食 portion and `brand` (its shop's name, the header's `shops`); 53.8k items are 9.9 MB, not 14 (parsed in the phone's
worker, and each weekly refresh a blob in git).
"""
import argparse, glob, json, math, os, re, sys, unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIASES = os.path.join(ROOT, 'data_src', 'kalori_shops.json')

NAME_MAX = 60        # contract/food.ts FOOD_NAME_CHARS
KCAL_MAX = 5000      # contract/food.ts CUSTOM.kcalMax (per serving)
NUTRIENT_MAX = 500   # CUSTOM.nutrientMax
FIB_MAX = 100        # lib.validate's fib limit
# the fewest items a whole fetch gives: the site lists ~54,000 products, ~53,800 after the drops; under it (or with one of
# our shops empty) the shards are partial, and the file isn't written unless PARTIAL_ENV=1 (a local or partial run)
ITEMS_MIN = 45000
PARTIAL_ENV = 'KALORI_ALLOW_PARTIAL'
# what every item would carry, left to the app's loader (db.ts withJan): never in the file
LOADER_KEYS = ('brand', 'sv', 'portions')
META = {'source': 'kalori', 'label': 'kalori.jp（チェーン店のメニュー）',
        'attribution': 'kalori.jp（各社の公表値と kalori.jp の AI 推定値）', 'license': 'kalori.jp 利用規約',
        'url': 'https://kalori.jp'}

# Kalori's common_genre -> our category (app/src/lib/art.ts FOOD_CAT); see cat_of for the rest
GENRE_CAT = {
    'noodle': '麺', 'pasta': '麺', 'set-meal': '丼・定食', 'rice-bowl': '丼・定食', 'sushi': '寿司', 'onigiri': '主食',
    'bento': '主食', 'curry': '主食', 'pizza': '主食', 'bread': 'パン', 'pastry': 'パン', 'sandwich': 'パン', 'burger': 'パン',
    'pork': '肉', 'beef': '肉', 'chicken': '肉', 'steak': '肉', 'fried-chicken': '肉', 'fish': '魚介', 'seafood': '魚介',
    'egg-dish': '卵', 'tofu': '大豆・豆', 'gyoza': '主菜', 'tempura': '主菜', 'salad': '副菜', 'soup': '汁物',
    'snack': '菓子・デザート', 'dessert': '菓子・デザート', 'cake': '菓子・デザート', 'ice-cream': '菓子・デザート',
    'alcohol': '酒', 'soft-drink': '飲料', 'tea': '飲料', 'coffee': '飲料', 'juice': '飲料', 'smoothie': '飲料'}
# all 31 of Kalori's shop categories; a category only for a genre-less item, and only where the shop's kind says what
# it is (a yakiniku shop's ホットココア isn't 肉, a supermarket's rice isn't コンビニ): else None, その他
SHOP_CAT = {
    'ramen': '麺', 'udon': '麺', 'soba': '麺', 'sushi': '寿司', 'gyudon': '丼・定食', 'teishoku': '丼・定食', 'bread': 'パン',
    'sweets': '菓子・デザート', 'confectionery': '菓子・デザート', **dict.fromkeys((
        'convenience supermarket bento cafe curry indian pizza okonomiyaki yakiniku yakitori tonkatsu karaage hamburg '
        'tempura chinese korean nabe italian fastfood family izakaya other-restaurant').split())}
SWEETS_SHOPS = ('sweets', 'confectionery')
# names that say what an item is: alcohol (never 飲料 or 汁物, never Atwater-checked), then drinks and sweets for a
# genre-less item. 酒 but not 甘酒, 酒蒸し, 酒かす, 酒場, 酒漬け; ハイ only ending a word (緑茶ハイ, not ハイビスカス);
# ノンアル and ハイボールテイスト aren't.
ALCOHOL = re.compile(r'ビール|ハイボール|サワー(?!クリーム)|(?<!甘)酒(?!蒸|粕|かす|盗|場|漬)|ワイン(?!ビネガー|煮)|ストロング'
                     r'|ハイ(?=$|[\s（(＜<【［])')
NON_ALCOHOL = re.compile(r'ノンアル|オールフリー|テイスト')
NAME_CAT = [(re.compile(r'ケーキ|パフェ|プリン|クレープ|ゼリー|アイスクリーム|ソフトクリーム|ジェラート'), '菓子・デザート'),
            (re.compile(r'ドリンク|ジュース|コーヒー|ティー|ラテ|ココア|ミルク|ソーダ|(?<!喫)茶(?!碗|漬|そば|蕎麦)'), '飲料'),
            (re.compile(r'アイス'), '菓子・デザート')]
# a pastry in a cafe that's a sweet, not bread (a sweets shop's pastries all are)
SWEET_PASTRY = re.compile(r'タルト|ケーキ|ブラウニー|マシュマロ|クッキー|マカロン|ワッフル')

# Variants: a trailing size / milk part, in brackets (カフェ モカ（Tall・豆乳）) or after a space (牛丼 並盛). Each word's rank
# picks the group's default (lowest first: the regular size, plain milk).
SIZES = ['並盛', '並', 'レギュラー', 'R', 'Tall', 'M', 'Mサイズ', '中', 'ジャストサイズ', 'Short', 'S', 'Sサイズ', '小',
         '小盛', 'ミニ', 'ハーフ', 'Grande', 'L', 'Lサイズ', 'LL', 'XL', '大', '大盛', 'あたま大盛', 'Venti', '特盛', '超特盛',
         'メガ', 'ジャンボ']
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


def val(r, k):
    """nutrients[k]'s value, None when the page doesn't show it."""
    n = r['nutrients'].get(k)
    return num(n.get('v')) if isinstance(n, dict) else None


def is_est(r, k):
    n = r['nutrients'].get(k)
    return isinstance(n, dict) and val(r, k) is not None and n.get('est') is True


def est_of(r):
    """'e': kcal estimated; 'p': official kcal, an estimated P, F or C; 's': official kcal and P/F/C, an estimated fibre
    or salt; None: all official."""
    if is_est(r, 'kcal'):
        return 'e'
    if any(is_est(r, k) for k in ('p', 'f', 'c')):
        return 'p'
    return 's' if any(is_est(r, k) for k in ('fiber', 'salt')) else None


def is_alcohol(name, cat=None):
    return cat == '酒' or bool(ALCOHOL.search(name) and not NON_ALCOHOL.search(name))


def cat_of(r, name):
    """The item's genre's category (a pastry in a sweets shop or a sweet one in a cafe: 菓子・デザート; an alcohol in a
    drink or soup genre: 酒); a genre-less one's (missing, 'other'): its name's (alcohol, sweets, drinks), else its shop
    kind's where that says it (SHOP_CAT), else その他."""
    genre, kind = r.get('genre'), r.get('shop_category')
    cat = GENRE_CAT.get(genre)
    if genre == 'pastry' and (kind in SWEETS_SHOPS or kind == 'cafe' and SWEET_PASTRY.search(name)):
        return '菓子・デザート'
    if cat in (None, '飲料', '汁物') and is_alcohol(name):
        return '酒'
    if cat:
        return cat
    return next((c for pat, c in NAME_CAT if pat.search(name)), None) or SHOP_CAT.get(kind) or 'その他'


def implausible(r, name, cat):
    """kcal against Atwater (4P + 9F + 4C), all three shown: off by over half and 50 kcal is a source error (幸楽苑's
    メガたんめん at 47 kcal for 2,000). Alcohol is exempt (7 kcal/g of its own)."""
    p, f, c = (val(r, k) for k in ('p', 'f', 'c'))
    if None in (p, f, c) or is_alcohol(name, cat):
        return False
    atw, kcal = 4 * p + 9 * f + 4 * c, val(r, 'kcal')
    # (and 0 kcal over 10 kcal of protein and fat: くら寿司's チキンサラダ at 0 kcal for 3.5/2 g; a 0 kcal jelly or
    # zero drink whose carbs are fibre or sweetener, 寒天ゼリー at 6 g, is a real zero)
    return abs(kcal - atw) > max(atw / 2, 50) or kcal <= 0 and 4 * p + 9 * f >= 10


# Name cleanup, from the real names: half-width kana (ﾈｷﾞ), newlines and doubled spaces, a trailing " /"; then, each
# only where two items' names wouldn't meet (ビッグボーイ's TO エビフライ is its takeout one, beside the eat-in エビフライ):
# a shop's leading order code (LEAD_CODES), a ※ note (a bracketed (※2) anywhere, a trailing ※ソース別売 with no space
# or unclosed bracket after it) or a trailing price (（税込4,378円）, 12,000円, S：180円 -> S), a long name's tail.
HALF_KANA = re.compile('[\uff61-\uff9f]+')
# each shop's order codes, a letter one only before a space, or for the takeout TO before 【 or Japanese (the shops whose
# names start so in the data; another shop's TOマト, M&M's stay)
TAKEOUT = r'TO(?=[ \u3000【]|[^\x00-\x7f])'
LEAD_CODES = {'bigboy': TAKEOUT, 'flying-garden': TAKEOUT, 'ringerhut': TAKEOUT, 'ikari-super': r'(?:【\d+】)+|[ＳＯM][ \u3000]',
              'cozy-corner': r'(?:【\d+】)+'}
LEAD_CODE = {shop: re.compile(r'^(?:%s)[ \u3000]*' % p) for shop, p in LEAD_CODES.items()}
SPACES = re.compile(r'[ \u3000]*[\t\r\n]+[ \u3000]*|[ \u3000]{2,}')  # a line break with its spaces: one space
TRAIL_SLASH = re.compile(r'[ \u3000]*/$')
NOTE = re.compile(r'[ \u3000]*(?:[（(]※[^（()）]*[)）]|※(?:[^\s（()）]|[（(][^（()）]*[)）])*$)')
PRICE = re.compile(r'[ \u3000]*(?:[（(]税込[\d,]+円[)）]|[:：]?[\d,]+円)$')


def tidy(name):
    """A name with the lossless cleanup; never empty."""
    s = HALF_KANA.sub(lambda m: unicodedata.normalize('NFKC', m.group()), name)
    return TRAIL_SLASH.sub('', SPACES.sub(' ', s).strip()).strip() or name.strip()


def uncoded(name, shop):
    """A tidy name without its shop's leading order code; never empty."""
    pat = LEAD_CODE.get(shop)
    return pat.sub('', name).strip() or name if pat else name


def unsuffixed(name):
    """A tidy name without its ※ notes and trailing prices; never empty."""
    s = name
    while True:
        t = PRICE.sub('', NOTE.sub('', s)).strip()
        if t == s or not t:
            return s
        s = t


def short(name):
    """A name over NAME_MAX cut before its last bracket, else comma, else space, that leaves 10+ characters, else at
    NAME_MAX (IKEA's ..., オーツ＆キャラメル レインフォレスト・アライアンス認証, 240 g: not at ", 240")."""
    if len(name) <= NAME_MAX:
        return name
    for marks in ('（(【［《〈＜<「', ',、', ' \u3000'):
        cuts = [i for i, ch in enumerate(name[:NAME_MAX + 1]) if ch in marks and i >= 10]
        if cuts:
            return name[:cuts[-1]].rstrip(' \u3000,、・')
    return name[:NAME_MAX].rstrip()


def dup_key(name):
    """Names that differ only in full / half width or spaces are the same."""
    return re.sub(r'\s', '', unicodedata.normalize('NFKC', name))


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
    trailing size / milk words: 2+ items in distinct states. The default: a current item, the regular size, plain milk."""
    groups = {}
    for it in items:
        v = variant_of(it['name'])
        if v:
            groups.setdefault((it['shop'], v[0]), []).append((v[2], v[1], it))
    for g in groups.values():
        if len(g) < 2 or len({st for _, st, _ in g}) < len(g):
            continue
        g.sort(key=lambda x: ('ended' in x[2], x[0], x[2]['kcal']))
        for _, st, it in g:
            it['vg'], it['st'] = g[0][2]['id'], st


def shard_files(paths):
    """The shard files named, a directory standing for its shard-*.jsonl."""
    out = []
    for p in paths:
        out += sorted(glob.glob(os.path.join(p, 'shard-*.jsonl'))) if os.path.isdir(p) else [p]
    return out


def read_rows(paths):
    """(rows, report): each product's latest v2 line (one with `nutrients`), in file order of first sight. v1 lines
    and lines that don't parse (a half-written last line) are counted and skipped."""
    latest, rep = {}, {'lines': 0, 'v1': 0, 'bad': 0}
    for path in shard_files(paths):
        with open(path, encoding='utf-8') as fh:
            for line in fh:
                if not line.strip():
                    continue
                rep['lines'] += 1
                try:
                    r = json.loads(line)
                except ValueError:
                    rep['bad'] += 1
                    continue
                if not isinstance(r, dict) or not isinstance(r.get('nutrients'), dict):
                    rep['v1'] += 1
                    continue
                key = (r.get('shop'), r.get('id'))
                if key not in latest or str(r.get('fetched_at') or '') >= str(latest[key].get('fetched_at') or ''):
                    latest[key] = r
    rep['products'] = len(latest)
    return list(latest.values()), rep


def norm(s):
    """A name or brand to compare: NFKC, lower case, no spaces or dashes or ・."""
    return re.sub(r'[\s\-・]', '', unicodedata.normalize('NFKC', s or '').lower())


def off_names(items):
    """{OFF product name: its brands (norm)} from products.json's items."""
    out = {}
    for it in items:
        out.setdefault(it['name'], set()).add(norm(it.get('brand')))
    return out


def same_maker(brands, words):
    """Whether an OFF brand names the shop (either holds the other; 3+ characters, so 'co' names nobody)."""
    return any(len(b) >= 3 and len(w) >= 3 and (b in w or w in b) for b in brands for w in words)


def item_of(r, name, cat):
    it = {'id': 'kal:%s' % r['id'], 'name': name, 'shop': r['shop'], 'cat': cat,
          'kcal': int(math.floor(val(r, 'kcal') + 0.5))}
    for k in ('p', 'f', 'c', 'salt'):
        it[k] = r1(val(r, k))
    if val(r, 'fiber') is not None:
        it['fib'] = r1(val(r, 'fiber'))
    est = est_of(r)
    if est is None and (r.get('ended') or r.get('listed') is False):
        est = 'e'  # a 販売終了かも page shows no 推定 badges at all: its values' status is unknown, so never 'official'
    if est:
        it['est'] = est
    img = r.get('image_id')
    if isinstance(img, int) and not isinstance(img, bool) and img > 0:
        it['img'] = img
    if KANA_RE.search(it['name']):
        it['aliases'] = [KANA_RE.sub(lambda m: KANA[m.group(1)], it['name'])]
    if r.get('ended') is True or r.get('listed') is False:
        it['ended'], it['pop'] = True, -1
    return it


def better(r):
    """The key of the near-duplicate kept: a current one, then the latest lastmod, then the higher id."""
    i = str(r.get('id'))
    return (r.get('ended') is not True and r.get('listed') is not False, str(r.get('lastmod') or ''),
            (int(i), '') if i.isdigit() else (-1, i))


def read_shops(path=ALIASES):
    """({shop: our aliases}, {shop: our display name}) from data_src/kalori_shops.json: a shop's value is its aliases,
    or {name, aliases?}."""
    with open(path, encoding='utf-8') as fh:
        doc = json.load(fh)
    doc = {k: v for k, v in doc.items() if not k.startswith('_')}
    aliases = {k: v if isinstance(v, list) else v.get('aliases', []) for k, v in doc.items()}
    return {k: v for k, v in aliases.items() if v}, {k: v['name'] for k, v in doc.items() if isinstance(v, dict)}


def read_aliases(path=ALIASES):
    return read_shops(path)[0]


def convert(rows, aliases=None, off=None, names=None):
    """(dataset, report): rows = read_rows's (format v2), aliases / names = our shop aliases / display names
    (read_shops), off = off_names."""
    aliases, off, our_names = aliases or {}, off or {}, names or {}
    drop = {'no_values': 0, 'long_name': 0, 'range': 0, 'implausible': 0, 'off_product': 0, 'duplicate': 0,
            'near_duplicate': 0}
    kept, seen, unknown, shop_names = {}, set(), {}, {}
    for r in rows:
        raw = (r.get('name') or '').strip()
        if not raw or val(r, 'kcal') is None or not r.get('shop') or r.get('id') in (None, ''):
            drop['no_values'] += 1
            continue
        name = tidy(raw)
        vals = [val(r, k) for k in ('p', 'f', 'c', 'salt', 'fiber')]
        if not 0 <= val(r, 'kcal') <= KCAL_MAX or any(v is not None and not 0 <= v <= NUTRIENT_MAX for v in vals) \
                or (vals[4] or 0) > FIB_MAX:
            drop['range'] += 1
            continue
        for field, known in (('genre', GENRE_CAT), ('shop_category', SHOP_CAT)):
            if r.get(field) not in (None, 'other') and r[field] not in known:   # 'other': as if none
                unknown.setdefault('%s:%s' % (field, r[field]), 0)
                unknown['%s:%s' % (field, r[field])] += 1
        cat = cat_of(r, name)
        if implausible(r, name, cat):
            drop['implausible'] += 1
            continue
        shop_name = (r.get('shop_name') or '').strip() or r['shop']
        if any(n in off and same_maker(off[n], {norm(w) for w in [shop_name, *aliases.get(r['shop'], [])]})
               for n in {raw, name}):
            drop['off_product'] += 1
            continue
        if r['id'] in seen:
            drop['duplicate'] += 1
            continue
        seen.add(r['id'])
        key = (r['shop'], dup_key(name))
        if key in kept:
            drop['near_duplicate'] += 1
            if better(r) <= better(kept[key][0]):
                continue
        kept[key] = (r, name, cat)
        shop_names[r['shop']] = shop_name
    # the lossy steps (an order code, a trailing note or price, a long name's tail), each only where no names would meet
    final = {}
    for (shop, _), (r, name, cat) in kept.items():
        final[(shop, r['id'])] = [r, name, cat]
    for cut in (uncoded, unsuffixed, short):
        cuts = {k: cut(v[1], k[0]) if cut is uncoded else cut(v[1]) for k, v in final.items()}
        taken = Counter((k[0], dup_key(name)) for k, name in cuts.items())
        for k, v in final.items():
            if taken[(k[0], dup_key(cuts[k]))] == 1:
                v[1] = cuts[k]
    items, renamed = [], 0
    for r, name, cat in final.values():
        if len(name) > NAME_MAX:
            drop['long_name'] += 1
            continue
        items.append(item_of(r, name, cat))
        renamed += name != r['name'].strip()
    group_variants(items)
    items.sort(key=lambda it: (it['shop'], it['id']))
    shops = {it['shop'] for it in items}
    header = {s: {'name': our_names.get(s) or shop_names[s], **({'aliases': aliases[s]} if aliases.get(s) else {})}
              for s in sorted(shops)}
    report = {'items': len(items), 'shops': len(header), 'dropped': drop,
              'est': {k or 'official': sum(it.get('est') == k for it in items) for k in ('e', 'p', 's', None)},
              'cats': dict(sorted(Counter(it['cat'] for it in items).items(), key=lambda kv: -kv[1])),
              'ended': sum('ended' in it for it in items), 'other_cat': sum(it['cat'] == 'その他' for it in items),
              'renamed': renamed,
              'img': sum('img' in it for it in items), 'grouped': sum('vg' in it for it in items),
              'unknown_kinds': dict(sorted(unknown.items())),
              'unknown_alias_shops': sorted((set(aliases) | set(our_names)) - shops)}
    return {**META, 'shops': header, 'items': items}, report


def errors(doc):
    """What the shipped file must hold beyond lib.validate (the app's FoodSnap limits); [] when sound."""
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
        if any(k in it for k in LOADER_KEYS):
            errs.append("%s: brand, sv or portions (the loader's)" % i)
    errs += ['%s: vg names no item' % it['id'] for it in doc['items'] if 'vg' in it and it['vg'] not in ids]
    return errs


def partial(report, env=os.environ):
    """Why the dataset looks partial (one of our shops, data_src/kalori_shops.json, with no items; under ITEMS_MIN
    items), None when whole or PARTIAL_ENV=1."""
    why = (['no items for %s' % ', '.join(report['unknown_alias_shops'])] if report['unknown_alias_shops'] else []) + \
        (['%d items, under %d' % (report['items'], ITEMS_MIN)] if report['items'] < ITEMS_MIN else [])
    if why and env.get(PARTIAL_ENV) != '1':
        return 'kalori: partial input (%s); fetch all shards, or %s=1 to write it anyway' % ('; '.join(why), PARTIAL_ENV)
    return None


def build(paths, off_items=()):
    """(dataset, report) from the shard files (or their directory) and products.json's items."""
    rows, read = read_rows(paths)
    aliases, names = read_shops()
    doc, report = convert(rows, aliases, off_names(off_items), names)
    return doc, {'read': read, **report}


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('paths', nargs='+', help='raw/kalori/ or shard-*.jsonl files')
    ap.add_argument('--off', help="products.json whose names win (build.py uses its own)")
    ap.add_argument('--out', help='write the dataset here too (build.py writes out/kalori.json)')
    a = ap.parse_args(argv)
    off = []
    if a.off and os.path.exists(a.off):
        with open(a.off, encoding='utf-8') as fh:
            off = json.load(fh)['items']
    doc, report = build(a.paths, off)
    errs = errors(doc)
    if errs:
        sys.exit('kalori: %d problems, e.g. %s' % (len(errs), errs[:5]))
    why = a.out and partial(report)
    if why:
        sys.exit(why)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, 'w', encoding='utf-8') as fh:
            fh.write(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1:])
