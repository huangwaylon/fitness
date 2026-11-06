"""Free-text recipes -> per-100 g dishes: MAFF「うちの郷土料理」(maff_kyodo) and 高槻市 学校給食レシピ (takatsuki).

Each ingredient line is mapped to a MEXT food (maff_ingredients.py) and converted to grams (spoon/cup/piece
standards). Water/broth weight is counted only for soups/nabe and doughs; dashi materials (昆布・煮干し) are excluded;
dry rice/noodles/dried foods gain water per MEXT 表12; deep-fry oil = 10 % of the fried components.
Recipes are kept only if every non-negligible ingredient was mapped and quantified (unmapped mass <= 5 %).
"""
import html, os, re, unicodedata

import maff_ingredients as MI
from lib import ALL_NUTS, SOUP_WORDS, cat_guess, nutrients, read_csv

EXTRA_GAIN = {'05034': 1.0, '05044': 1.0, '09017': 0.0, '01151': 0.8}  # dry peanuts simmered ~x2 etc. (estimates)


# ---------------------------------------------------------------- parsers (raw files are data only)
def _clean(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()


def parse_maff_page(text, fname):
    m = re.search(r'<span class="pref">([^<]+)</span></h[23]>\s*<h2 class="tit06"><span class="name">([^<]+)</span>', text)
    if not m:
        return None
    r = {'file': fname, 'pref': _clean(m.group(1)), 'title': _clean(m.group(2))}
    m = re.search(r'<a href="(https://www\.maff\.go\.jp/e/[^"]+)">English', text)
    r['en_url'] = m.group(1) if m else None

    def sect(name):
        m = re.search(r'<span class="pref">' + name + r'</span>.*?<p[^>]*>(.*?)</p>', text, re.S)
        return _clean(m.group(1)) if m else None
    r['region'] = sect('主な伝承地域')
    groups = []
    for m in re.finditer(r'<h2 class="tit05[^"]*">(材料[^<]*)</h2>(.*?)(?=<h2 class="tit05|<div class="section|$)', text, re.S):
        items = []
        for li in re.finditer(r'<ul class="list">(.*?)</ul>', m.group(2), re.S):
            cells = [_clean(x) for x in re.findall(r'<li[^>]*>(.*?)</li>', li.group(1), re.S)]
            if cells:
                items.append(cells)
        groups.append({'head': _clean(m.group(1)), 'items': items})
    r['materials'] = groups
    return r


def _read(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def parse_maff(root):
    """raw/maff_kyodo/menu/*.html -> recipe dicts (sorted by file name)."""
    d = os.path.join(root, 'menu')
    out = []
    for f in sorted(os.listdir(d)):
        if f.endswith('.html'):
            r = parse_maff_page(_read(os.path.join(d, f)), f)
            if r:
                out.append(r)
    return out


def maff_english_names(endir):
    """MAFF English site: recipe id -> English name (prefecture list pages + item_<id>.html titles)."""
    en = {}
    if not os.path.isdir(endir):
        return en
    for f in sorted(os.listdir(endir)):
        t = _read(os.path.join(endir, f))
        for m in re.finditer(r'<a href="\.\./\.\./(\d+)/index\.html">.*?<h5>(.*?)</h5>', t, re.S):
            en[m.group(1)] = html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).strip()
        mi = re.match(r'item_(\d+)\.html$', f)
        mt = re.search(r'<h1>(.*?)\s*[｜|]\s*Our Regional Cuisines', t)
        if mi and mt:
            en[mi.group(1)] = html.unescape(re.sub(r'<[^>]+>', '', mt.group(1))).strip()
    return en


TAKATSUKI_CAT = {'ご飯物': '主食', '汁物': '汁物', '麺類': '麺', 'デザート': '菓子・デザート'}


def parse_takatsuki(path):
    """高槻市 学校給食レシピ CSV (cp932): one recipe per row, ingredients in 材料* columns ('name amount')."""
    rows = read_csv(path, rows=True)
    h = rows[0]
    out = []
    for r in rows[1:]:
        if len(r) < 8 or not r[4].strip():
            continue
        items = []
        for i, col in enumerate(h):
            if col.startswith('材料') and i < len(r) and r[i].strip():
                parts = re.split(r'[　 ]+', r[i].strip(), maxsplit=1)
                name, amt = parts[0], unicodedata.normalize('NFKC', parts[1] if len(parts) > 1 else '')
                amt = re.sub(r'(\d+)分の(\d+)', lambda m: '%s/%s' % (m.group(2), m.group(1)), amt)
                amt = amt.replace('こ', '個') if re.search(r'\d個?こ$|\dこ', amt) else amt
                items.append([re.sub(r'^[（(][A-ZＡ-Ｚ][)）]', '', name), amt])
        title = re.sub(r'（([^）]*)）$', lambda m: '（%s）' % m.group(1) if re.fullmatch(r'[ァ-ヶー・]+', m.group(1)) else '',
                       r[4].strip())
        rec = {'file': 'r%02d' % int(r[3]), 'title': title, 'pref': '', 'kind': r[5].strip(),
               'materials': [{'head': r[6].strip(), 'items': items}]}
        if r[5].strip() in TAKATSUKI_CAT:
            rec['cat'] = TAKATSUKI_CAT[r[5].strip()]
        out.append(rec)
    return out


# ---------------------------------------------------------------- recipe -> nutrients
DEFAULT_PORTION = {'主食': 250, '丼・定食': 400, '麺': 450, '汁物': 250, '主菜': 150, '副菜': 80, '寿司': 250, '菓子・デザート': 60, 'パン': 80}
SKIP_TITLE = re.compile(r'干しいも|干し芋|ほしいも|切り干しいも|漬|なれずし|熟鮓|塩辛|干物|ぬか|糠|佃煮|つくだ煮|ひしお|味噌$|みそ$|酒$|甘酒|茶$|たれ$|タレ$|だし$|ごしょう|こしょう|胡椒')
DOUGH = re.compile(r'焼き|焼|もち|餅|だんご|団子|まんじゅう|饅頭|うどん|そば|すいとん|もんじゃ|お好み|ほうとう|おやき|ちまき|ういろう|ようかん|羊羹|かん$|寒天|よせ|豆腐')
FRYTITLE = re.compile(r'揚|フライ|ふらい|天ぷら|てんぷら|天麩羅|コロッケ|カツ|かつ丼|唐揚|からあげ|竜田|ザンギ|ざんぎ|フリッター|かき揚|がんも|メンチ')


# ごはん, 精白米, もち, ゆでうどん/そば/中華めん/そうめん, スパゲッティ: a dish's staple (適量 of one -> unknown weight)
STAPLE_IDS = {'01088', '01083', '01117', '01039', '01128', '01048', '01044', '01064', '01038', '01127'}
MAX_BATCH_G = 10000   # a recipe's cooked weight, and a serving's; above them, a bulk recipe (see compute)
MAX_SERVING_G = 1500


def servings_of(head):
    """'4人分' -> (4, None); '2〜3人分' -> (2.5, None); '10個分' -> (None, (10, '個'))."""
    h = MI.norm(head)
    m = re.search(r'(\d+)\s*[~〜～\-]\s*(\d+)\s*人', h)
    if m:
        return (int(m.group(1)) + int(m.group(2))) / 2, None
    m = re.search(r'(\d+)\s*人', h)
    if m:
        return float(m.group(1)), None
    m = re.search(r'(\d+)\s*(個|本|枚|切れ|串|皿|杯|食|尾|合|升|cm)', h)
    return (None, (float(m.group(1)), m.group(2))) if m else (None, None)


def add_food(tot, food, g):
    for k in ALL_NUTS:
        tot[k] += (food.get(k) or 0) * g / 100


def compute(rec, foods, gain):
    """-> (nutrient totals, cooked weight, vinegared rice?) or None if an ingredient cannot be quantified."""
    title = rec['title']
    soup = any(k in title for k in SOUP_WORDS) and 'カレー' not in title
    tot = dict.fromkeys(ALL_NUTS, 0.0)
    weight = flour_w = plain_water = fry_base = dry_soy = 0.0
    fry = has_rice = has_vin = salt_unknown = False
    unmapped = []   # grams of ingredients with no MEXT match (None = amount unknown)
    for g in rec['materials']:
        for cells in g['items']:
            name = cells[0].strip()
            amt = cells[1].strip() if len(cells) > 1 else ''
            if not name or name.startswith('※') or re.match(r'^[<＜【\[].*[>＞】\]]$', name):
                continue
            # header-like lines ('たれ', '(A)') without amount
            if not amt and re.fullmatch(r'[(（]?[A-Za-zＡ-Ｚａ-ｚ①-⑳ア-ンあ-ん]{0,6}[)）]?', MI.norm(name)):
                continue
            ent = MI.match(name)
            if ent is None:
                if not re.search(r'(の葉|竹|楊枝|串)$', MI.norm(re.sub(r'[(（].*?[)）]', '', name))):
                    g_ = MI.grams(amt, None) if amt else 0.0
                    if g_ is None or g_ > 1.0:
                        unmapped.append(g_)
                continue
            if ent['flag'] == 'nonfood' or ent['kind'] == 'none':
                continue
            gr = MI.grams(amt, ent) if amt else 0.0
            if gr is None:
                if ent['flag'] == 'dashi_mat' or (ent['flag'] == 'liquid' and not soup):
                    continue
                return None
            if ent['flag'] == 'fry' or (ent['id'] == '14006' and gr == 0 and FRYTITLE.search(title)):
                fry = True
                continue
            if ent['flag'] == 'dashi_mat' and \
                    not any(MI.norm(k) in MI.norm(title) for k in ('昆布', 'こぶ', '煮干', 'にぼし', 'いりこ', 'かつお', '鰹')):
                continue
            if gr == 0:
                nn = MI.norm(name)
                stem = re.sub(r'[(（【].*?[)）】]|\(.*$', '', nn)[:3]
                if '好み' not in amt and (ent['id'] in STAPLE_IDS or
                                         (ent['id'][:2] in ('10', '11') and len(stem) >= 2 and stem in MI.norm(title))):
                    return None   # the staple or the dish's own fish/meat 適量 (タレかつ丼's ごはん): its weight is unknown
                    # (an optional one, 「お好みで」, is left out: 水炊き's しめ)
                if ent['kind'] in ('salt', 'soy', 'miso'):
                    salt_unknown = True
                continue
            fid, nn = ent['id'], MI.norm(name)
            if '用' in nn and ent['kind'] in ('vinegar', 'salt', 'soy', 'sake', 'mirin', 'sugar') and \
                    not re.search(r'すし飯|寿司飯|酢飯|ご飯|飯用|ごはん|たれ用|かけ', nn):
                gr *= 0.15  # curing/marinating liquid or salt mostly discarded (〜用合わせ酢, 塩切用塩)
            if ent['flag'] == 'liquid':
                if fid != '__water' and fid in foods:
                    add_food(tot, foods[fid], gr)
                if soup:
                    weight += gr
                elif fid == '__water':
                    plain_water += gr
                continue
            if fid not in foods:
                return None
            add_food(tot, foods[fid], gr)
            w = gr + gr * gain[fid] if fid in gain else gr
            if ent['kind'] in ('flour', 'starch') or fid in ('09027', '09049', '09028', '01120', '01114', '01121',
                                                            '01158', '01015', '01018', '01020', '01122'):
                flour_w += gr
            dry_soy += gr if fid in ('04023', '04025') else 0.0
            has_rice = has_rice or fid in ('01083', '01088', '01151')
            has_vin = has_vin or fid in ('17016', '17101')
            weight += w
            if fid not in ('01083', '01088', '01151', '01080', '01006') and ent['kind'] not in (
                    'soy', 'mirin', 'sake', 'vinegar', 'sugar', 'salt', 'miso', 'paste', 'oil', 'water', 'honey', 'powder'):
                fry_base += w
    if not soup and plain_water and flour_w > 0 and (flour_w >= 0.3 * max(weight, 1) or DOUGH.search(title)
                                                     or cat_guess(title) == '菓子・デザート'):
        weight += min(plain_water, flour_w * 12)  # batter/dough/an water stays in the product (dango, manju, monja)
    if fry and not soup:
        oil = fry_base * 0.10  # ~10% oil uptake on the fried (non-rice, non-sauce) components
        add_food(tot, foods['14006'], oil)
        weight += oil
    um_mass = sum(x or 0 for x in unmapped)
    if unmapped and (None in unmapped or um_mass > 0.05 * max(weight + um_mass, 1)):
        return None
    srv, piece = servings_of(rec['materials'][0]['head'] if rec['materials'] else '')
    n = srv or (piece[0] if piece and piece[1] not in ('合', '升', 'cm') else None)
    if (weight / n > MAX_SERVING_G) if n else weight > MAX_BATCH_G:
        return None   # a bulk recipe (あらの姿煮: a 10 kg fish as 1尾 = 100 g, 12.6 kg of sake), or whole pieces read for
        # slices (くじら汁's 寒大根 10個, 2.3 kg a serving): its pieces' weights are guesses
    if '豆腐' in title and dry_soy >= 0.3 * weight:
        return None   # tofu made from dry soybeans (菜豆腐): the curd's yield is not modelled
    if salt_unknown and tot['salt'] < 0.001 * weight:
        tot['salt'] = None   # its seasoning 適量 (どんこ汁's 味噌): unknown, not salt-free
    return tot, weight, has_rice and has_vin


PROFILES = {   # source -> (note, dataset meta)
    'maff_kyodo': (
        lambda rec: '%sの郷土料理%s。材料から成分表で推計' % (rec['pref'], '（%s）' % rec['region'] if rec.get('region') else ''),
        {'source': 'maff_kyodo', 'label': '農林水産省「うちの郷土料理」（栄養価は成分表から推計）',
         'attribution': '出典：農林水産省「うちの郷土料理」(https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/) のレシピと解説を加工して作成（説明文は本アプリ独自）。栄養価は日本食品標準成分表（八訂）増補2023年から算出した推計値',
         'license': '公共データ利用規約（第1.0版）PDL1.0 / CC BY 4.0 compatible（MEXT成分表: 同上）',
         'url': 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/'}),
    'takatsuki': (
        lambda rec: '高槻市 学校給食レシピ（%s）。材料から日本食品標準成分表（八訂）増補2023年で推計' % (rec.get('kind') or ''),
        {'source': 'takatsuki', 'label': '高槻市 学校給食レシピ（栄養価は成分表から推計）',
         'attribution': '出典：高槻市「学校給食レシピ」（BODIKオープンデータ, CC BY 4.0）を加工して作成。栄養価は日本食品標準成分表（八訂）増補2023年から算出した推計値',
         'license': 'CC BY 4.0（MEXT成分表: 公共データ利用規約1.0）',
         'url': 'https://data.bodik.jp/dataset/272078_gakkokyusyoku'}),
}


_KANA_READING = re.compile(r'^[ぁ-ゖァ-ヺー・\s　()（）]+$')


def split_title(title):
    """A recipe title's names and its reading, the trailing bracket: 「えびみそ汁（えびみそしる）」. A reading may hold a
    bracket of its own when the name does (「味噌汁（麦味噌）（みそしる（むぎみそ)）」 → みそしる・むぎみそ; kana only, then),
    which a flat match missed, leaving the reading in the name."""
    t = title.rstrip()
    if not t.endswith((')', '）')):
        return title, ''
    depth = 0
    for i in range(len(t) - 1, -1, -1):
        depth += t[i] in ')）'
        depth -= t[i] in '(（'
        if not depth:
            break
    inner = t[i + 1:-1]
    if depth or not t[:i].strip() or (re.search(r'[()（）]', inner) and not _KANA_READING.match(inner)):
        return title, ''
    nested = re.findall(r'[(（]([^()（）]*)[)）]', inner)   # the bracket's reading as an alias of its own
    return t[:i], '・'.join([re.sub(r'[(（][^()（）]*[)）]', '', inner)] + nested)


def build(recs, source, foods, gain, en_names={}):
    note, meta = PROFILES[source]
    gain = dict(gain, **EXTRA_GAIN)
    items = []
    for rec in recs:
        title = rec['title']
        names_part, reading = split_title(title)
        names = [x.strip() for x in re.split(r'[／/]', names_part) if x.strip()]
        readings = [x.strip() for x in re.split(r'[／/・]', reading) if x.strip()]
        head = rec['materials'][0]['head'] if rec['materials'] else ''
        if not any(g['items'] for g in rec['materials']) or SKIP_TITLE.search(names_part) or \
                re.search(r'樽|容器|甕|かめ', head):   # no materials / pickle, preserve, condiment
            continue
        r = compute(rec, foods, gain)
        if r is None or r[1] < 30:
            continue
        tot, w, sushi_rice = r
        per = {k: None if v is None else v * 100 / w for k, v in tot.items()}
        if not (5 <= per['kcal'] <= 650) or (per['salt'] or 0) > 5:
            continue
        cat = cat_guess(names[0] + ' ' + names_part)
        if sushi_rice and cat in ('主菜', '主食', '副菜') and re.search(r'すし|寿司|ずし|鮨|巻', names_part):
            cat = '寿司'
        if cat == '主菜' and per['p'] < 5 and not rec.get('cat'):
            cat = '副菜'
        if cat in ('主菜', '副菜') and per['c'] >= 45 and per['p'] < 9 and not rec.get('cat'):
            cat = '菓子・デザート'
        srv, piece = servings_of(head)
        if srv:
            portions = [{'label': '1人前', 'g': round(w / srv)}]
        elif piece and piece[0] > 0 and piece[1] not in ('合', '升', 'cm'):
            portions = [{'label': '1' + piece[1], 'g': round(w / piece[0])}]
        else:
            portions = [{'label': '1人前（目安）', 'g': DEFAULT_PORTION.get(cat, 150)}]
        g0 = portions[0]['g']
        is_srv = portions[0]['label'].startswith('1人前')
        big = (per['kcal'] * g0 / 100 > 900 or (g0 > 500 and cat not in ('汁物', '麺', '丼・定食'))) if is_srv else g0 > 400
        d = 50 if re.search(r'煮豆|黒豆|甘露煮|豆煮|きんとん', names_part) else DEFAULT_PORTION.get(cat, 150)
        if big and d < g0:
            portions = [{'label': '1人前（目安）', 'g': d},
                        {'label': 'レシピ記載の1人分' if is_srv else portions[0]['label'], 'g': g0}]
        elif cat == '菓子・デザート' and g0 > 300:
            portions = [{'label': '1個（目安）', 'g': 60}]
        elif g0 > 700 or g0 < 15:
            portions = [{'label': '1人前（目安）', 'g': DEFAULT_PORTION.get(cat, 150)}]
        portions = portions[:1] + [p for p in portions[1:] if p['g'] <= 1500]   # すしこ's 「1個」: an 18 L barrel
        if portions[0]['g'] < 5:
            continue
        aliases = []
        for a in names[1:] + readings:
            if a not in aliases and a != names[0]:
                aliases.append(a)
        it = {'id': meta['source'] + ':' + rec['file'].rsplit('.', 1)[0], 'name': names[0],
              'full': '%s（%s）' % (names_part.strip(), rec['pref']) if rec.get('pref') else names_part.strip()}
        if aliases:
            it['aliases'] = aliases
        it['cat'] = rec.get('cat') or cat
        it.update(nutrients(per))
        it['portions'] = portions
        it['note'] = note(rec)
        mm = re.search(r'/search_menu/(\d+)/', rec.get('en_url') or '')
        if mm and mm.group(1) in en_names:
            it['en'] = en_names[mm.group(1)]
        items.append(it)
    return dict(meta, items=items)
