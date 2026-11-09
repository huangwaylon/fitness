#!/usr/bin/env python3
"""Build every food dataset into food-data/out/ from local inputs (stdlib only, no network).

How to rebuild (from the repo root; then `cd app && npm run food:data` copies out/ into app/static/food/)
  python3 -I food-data/scripts/build.py all            # rebuild everything, validate, then swap into out/
  python3 -I food-data/scripts/build.py check          # rebuild into a temp dir, validate, byte-compare with out/
  python3 -I food-data/scripts/build.py <target> ...   # one or more targets (verify.json and index.json too)
  python3 -I food-data/scripts/build.py all --out DIR  # write somewhere else (e.g. /tmp/x) instead of out/
Targets: mext dishes eatout maff_kyodo takatsuki kurume toyonaka kumagaya tokyo_hokeniryo jbfd off verify index
Inputs: food-data/raw/ or $FOOD_RAW (raw downloads, gitignored; fetch them with food-data/scripts/fetch.py) and
food-data/data_src/ (hand-authored recipes, popular list, frozen alias + weight-change tables). Targets whose raw
inputs are missing are skipped and their current out/ file is reused (an error when out/ has none). `check`
without out/ only builds and validates.
Output is deterministic: inputs are read in sorted order, dicts keyed by id are sorted, no timestamps;
index.json "version" is a hash of all generated files. Recipe datasets do not ship `ingredients`.
Order matters only through dependencies, which build.py resolves itself (school-lunch adult portions use
dishes/eatout/kurume/mext; verify uses every dataset + jbfd + the MEXT-USDA table; index hashes everything).
Tests: python3 -I -m unittest discover -s food-data/scripts/tests   (fast, no network, no raw inputs)
"""
import collections, functools, glob, hashlib, os, re, shutil, statistics, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
from lib import (MEXT_XLSX, NUTS, OUT, RAW, ROOT, SRC, cat_guess, kata2hira, kcal_int, load_json,  # noqa: E402
                 nutrients, per100, read_csv, split_portion, tidy, write_json)

MEXT_URL = 'https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html'


def fail(msg):
    raise SystemExit('ERROR: ' + msg)


# ---------------------------------------------------------------- MEXT
def build_mext(b):
    import mext_names
    return mext_names.build(b.mext_rows)


# ---------------------------------------------------------------- dishes / eatout (hand-written recipes in data_src)
def load_recipes(sub, list_key, key):
    """Records of data_src/<sub>/*.json (files starting with '_' excluded); keys and names must be unique."""
    recs, keys, names = [], set(), set()
    for path in sorted(glob.glob(os.path.join(SRC, sub, '[!_]*.json'))):
        for r in load_json(path)[list_key]:
            if any(k not in r for k in (key, 'name', 'cat', 'ing')) or r[key] in keys or r['name'] in names \
                    or r['cat'] not in lib.CATS:
                fail('%s: missing field, duplicate key/name or bad cat: %s' % (sub, r.get(key, r.get('name'))))
            keys.add(r[key])
            names.add(r['name'])
            recs.append(r)
    return recs


def recipe_item(src, key, rec, refs, foods, popular, stack=()):
    """Item from rec['ing'] = [[食品番号 | "water", g] | ["@ref", factor]] (refs: name -> ingredient list).
    -> (item without portions/note, total grams, {食品番号: grams})."""
    def expand(ing, stack):
        out = []
        for ent in ing:
            if not isinstance(ent, list) or len(ent) < 2 or not isinstance(ent[1], (int, float)) or ent[1] <= 0:
                fail('%s: bad ingredient %r' % (key, ent))
            ref, amount = ent[0], ent[1]
            if ref.startswith('@'):
                if ref[1:] not in refs:
                    fail('%s: unknown include %s' % (key, ref))
                if ref[1:] in stack:
                    fail('include cycle: %s' % ' -> '.join(stack + (ref[1:],)))
                out += [(no, g * amount) for no, g in expand(refs[ref[1:]], stack + (ref[1:],))]
            elif ref != 'water' and ref not in foods:
                fail('%s: MEXT food number %s not found' % (key, ref))
            else:
                out.append((ref, float(amount)))
        return out

    merged = {}
    for no, g in expand(rec['ing'], stack):
        merged[no] = merged.get(no, 0.0) + g
    per, total = per100(list(merged.items()), foods)
    it = {'id': src + ':' + key, 'name': rec['name']}
    for k in ('en', 'aliases'):
        if rec.get(k):
            it[k] = rec[k]
    if rec['name'] in popular:
        it['pop'] = popular[rec['name']]
    it['cat'] = rec['cat']
    it.update(nutrients(per))
    return it, total, merged


def build_dishes(b):
    """{"dishes": [{id, name, cat, ing (refs: other dishes), aliases?, en?, serving? (default 1人前),
    pieces? (adds 1個), portions?, note?}]}."""
    foods, popular = b.foods, lib.load_popular('dishes')
    dishes = load_recipes('dishes', 'dishes', 'id')
    refs = {d['id']: d['ing'] for d in dishes}
    items = []
    for d in dishes:
        it, total, _ = recipe_item('dishes', d['id'], d, refs, foods, popular, (d['id'],))
        it['portions'] = [{'label': d.get('serving', '1人前'), 'g': int(round(total))}]
        if d.get('pieces'):
            it['portions'].append({'label': '1個', 'g': round(total / d['pieces'], 1)})
        it['portions'] += d.get('portions', [])
        if d.get('note'):
            it['note'] = d['note']
        items.append(it)
    return {'source': 'dishes', 'label': '家庭料理・定食（レシピから算出）',
            'attribution': '日本食品標準成分表（八訂）増補2023年をもとに算出（レシピは独自）',
            'license': '公共データ利用規約1.0 / CC BY 4.0 compatible（成分値）。レシピ・分量は本プロジェクト独自（一部 農林水産省「うちの郷土料理」を参考）',
            'url': MEXT_URL, 'items': items}


EATOUT_NOTE = '一般的な推定値（成分表から独自レシピで算出）。店舗・商品により異なります'
TYPICAL_NOTE = '成分表に収載のない食品を含むため、一般的な市販品の目安値で算出。商品により異なります'


# MEXT values that are unmeasured ("-") but known, filled only inside the eat-out recipes (foods.json keeps MEXT's):
# 本格焼酎 is a distilled spirit, which carries no salt (焼酎甲類, ウイスキー, 泡盛: 0).
RECIPE_FILL = {'16015': {'salt': 0.0}}


def load_typical():
    """data_src/eatout/_typical.json: {"foods": {key: {name, kcal, p, f, c, salt, note}}} -> {"typ:<key>": food}.
    Typical per-100 g values for foods MEXT does not list (protein powder, Greek yogurt ...)."""
    path = os.path.join(SRC, 'eatout', '_typical.json')
    if not os.path.exists(path):
        return {}
    out = {}
    for k, v in load_json(path)['foods'].items():
        if any(not isinstance(v.get(n), (int, float)) or v[n] < 0 for n in NUTS) or not v.get('note'):
            fail('_typical.json: %s needs %s and a note' % (k, '/'.join(NUTS)))
        out['typ:' + k] = v
    return out


def build_eatout(b):
    """{"items": [{key, name, cat, ing (refs: data_src/eatout/_components.json; "typ:<key>" = _typical.json),
    unit?, portions?: [[label, multiplier]], aliases?, en?, note?}]}."""
    typical = load_typical()
    foods, popular = dict(b.foods, **typical), lib.load_popular('eatout')
    for no, fill in ((no, fill) for no, fill in RECIPE_FILL.items() if no in foods):
        foods[no] = dict(foods[no], **{n: v for n, v in fill.items() if foods[no][n] is None})
    comps = load_json(os.path.join(SRC, 'eatout', '_components.json'))['components']
    refs = {k: c['ing'] for k, c in comps.items()}
    items = []
    for rec in load_recipes('eatout', 'items', 'key'):
        it, total, merged = recipe_item('eatout', rec['key'], rec, refs, foods, popular)
        it['portions'] = [{'label': rec.get('unit', '1人前'), 'g': round(total)}] + \
            [{'label': lab, 'g': round(total * m)} for lab, m in rec.get('portions', [])]
        typ = [typical[k]['note'] for k in sorted(merged) if k in typical]
        base = TYPICAL_NOTE if typ else EATOUT_NOTE
        notes = ([rec['note']] if rec.get('note') else []) + typ
        it['note'] = '。'.join(notes + [base])
        if 'water' in merged:
            it['note'] += '（水・氷 %dg を含む）' % round(merged['water'])
        items.append(it)
    return {'source': 'eatout', 'label': '外食・コンビニ（一般的な推定値）',
            'attribution': '日本食品標準成分表（八訂）増補2023年をもとに算出（推定値・レシピは独自）',
            'license': '公共データ利用規約1.0 / CC BY 4.0 compatible（成分値の出典: 文部科学省）',
            'url': MEXT_URL, 'items': items}


# ---------------------------------------------------------------- MAFF 郷土料理 / 高槻市 recipes (free text)
def build_maff_kyodo(b):
    import recipes_text as RT
    d = os.path.join(RAW, 'maff_kyodo')
    return RT.build(RT.parse_maff(d), 'maff_kyodo', b.foods, b.cook_gain, RT.maff_english_names(os.path.join(d, 'en')))


def build_takatsuki(b):
    import recipes_text as RT
    recs = RT.parse_takatsuki(os.path.join(RAW, 'muni_takatsuki', 'gakkokyusyokurecipi.csv'))
    return RT.build(recs, 'takatsuki', b.foods, b.cook_gain)


# ---------------------------------------------------------------- 久留米市 料理の栄養価一覧
KURUME_CAT = {'ごはん': '主食', '麺': '麺', 'パン': 'パン', '果物': '果物', '菓子': '菓子・デザート', '軽食': '主食',
              '芋料理': '副菜', '卵料理': '主菜', '大豆・大豆製品料理': '主菜'}


def kurume_cat(kind, name):
    if kind == 'ごはん':
        if '丼' in name or 'カレー' in name or 'ライス' in name and 'ハヤシ' in name:
            return '丼・定食'
        if '寿司' in name or 'ずし' in name:
            return '寿司'
    if kind in KURUME_CAT:
        return KURUME_CAT[kind]
    if kind.startswith('汁物'):
        return '汁物'
    if kind.startswith('野菜料理'):
        return '副菜'
    if kind.startswith('肉料理') or kind.startswith('魚料理'):
        return '主菜'
    return 'その他'


def build_kurume(b):
    """Per-serving values (成分表2010) -> per 100 g using the listed ingredient grams (water excluded by the
    source) + water absorbed by dry rice/pasta/dried foods. Seasonings, drinks, dairy, raw fruit are skipped."""
    items = []
    for i, r in enumerate(read_csv(os.path.join(RAW, 'muni_kurume', 'ryori_eiyouka.csv'), rows=True)[1:], 1):
        kind, full = r[0].strip(), r[1].strip()
        if not full or kind in ('調味料', '飲み物', '乳製品') or (kind == '果物' and 'コンポート' not in full):
            continue
        vals = [float(x) for x in r[2:7]]
        ings = [(r[j].strip(), float(r[j + 1])) for j in range(8, 48, 2) if j + 1 < len(r) and r[j].strip() and r[j + 1].strip()]
        w = sum(g for _, g in ings)
        liquid = sum(g for n, g in ings if 'だし' in n or '水' == n or 'スープ' in n)
        rice = sum(g for n, g in ings if n.startswith('米・') or n.startswith('もち米'))
        if rice:
            w += max(0.0, rice * 1.1 - liquid)
        for n, g in ings:
            for k, fx in lib.DRY_EXTRA:
                if k in n and ('乾' in n or k in ('押麦', 'ひじき', 'かんぴょう', '切干', '凍り豆腐', 'カットわかめ', 'はるさめ')):
                    w += g * fx
                    break
        if kind.startswith('汁物'):   # soup rows list no dashi/water: same floor as school soups
            w = max(w, 150.0)
        if w <= 0:
            continue
        name, plabel = split_portion(full)
        k = 100.0 / w
        it = {'id': 'kurume:%03d' % i, 'name': name, 'cat': kurume_cat(kind, full),
              **nutrients({n: v * k for n, v in zip(NUTS, vals)}),
              'portions': [{'label': plabel or '1人前', 'g': round(w) if w >= 10 else round(w, 1)}],
              'note': '成分表2010ベースの1人前値を材料重量で100g当たりに換算'}
        if full != name:
            it['full'] = full
        if lib.KATA_ONLY.fullmatch(name):
            it['aliases'] = [kata2hira(name)]
        items.append(it)
    return {'source': 'kurume', 'label': '久留米市 料理の栄養価一覧',
            'attribution': '出典：久留米市「料理の栄養価一覧」（BODIKオープンデータ, CC BY 2.1 JP）を加工して作成（1人前値を100g当たりに換算）',
            'license': 'CC BY 2.1 JP',
            'url': 'https://data.bodik.jp/dataset/402036_0009100_00005', 'items': items}


# ---------------------------------------------------------------- 東京都島しょ保健所 簡単レシピ
def build_tokyo_hokeniryo(b):
    """Official per-serving values (csv_<id>.csv, cp932) / serving weight estimated in data_src."""
    items = []
    for r in load_json(os.path.join(SRC, 'tokyo_hokeniryo_recipes.json'))['recipes']:
        rows = read_csv(os.path.join(RAW, 'tokyo_hokeniryo', 'csv_%s.csv' % r['csv']), rows=True)
        vals = [float(x) for x in rows[1][:5]]
        kcal, salt, k = vals[0], vals[4], 100.0 / r['g']
        it = {'id': 'tokyo_hokeniryo:' + r['csv'], 'name': r['name'], 'cat': r['cat'],
              **nutrients({n: v * k for n, v in zip(NUTS, vals)}),
              'portions': [{'label': '1人前', 'g': r['g']}],
              'note': '東京都島しょ保健所の公式栄養価（1人分 %d kcal・食塩%.1f g）を推定重量で100g当たりに換算' % (kcal, salt)}
        if r.get('aliases'):
            it['aliases'] = r['aliases']
        items.append(it)
    return {'source': 'tokyo_hokeniryo', 'label': '東京都 一人でもできる簡単レシピ（島しょ保健所）',
            'attribution': '出典：東京都保健医療局（島しょ保健所）「一人でもできる簡単レシピ」（東京都オープンデータカタログ, CC BY）を加工して作成',
            'license': 'CC BY（東京都オープンデータカタログ表示）',
            'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000055d0000000467', 'items': items}


# ---------------------------------------------------------------- school lunch (自治体標準データセット 学校給食献立情報)
LUNCH_COLS = {'name': ['料理名称'], 'lid': ['料理ID'], 'date': ['提供年月日'], 'g': ['分量', '分量（g）'],
              'kcal': ['エネルギー', 'エネルギー（kcal）'], 'p': ['たんぱく質', 'たんぱく質（g）'], 'f': ['脂質', '脂質（g）'],
              'c': ['炭水化物', '炭水化物（g）'], 'salt': ['食塩相当量', '食塩相当量（g）'], 'fib': ['食物繊維', '食物繊維（g）'],
              'fid': ['食品番号', '食品ID']}
# MEXT food groups with fibre (cereals, potatoes, pulses, nuts, vegetables, fruit, mushrooms, seaweed): a blank 食物繊維
# cell of theirs is unknown, of any other group none (Kumagaya leaves meat, milk, oil and seasoning rows blank)
PLANT_GROUPS = ('01', '02', '04', '05', '06', '07', '08', '09')
LUNCH_SKIP_BASE = r'牛乳|ごはん|玄米入りごはん|.*パン.*|.*ふりかけ.*|.*ソース|ソース ?クラス.*|.*(?<!シュー)クリーム|チルドチョコ|.*ドレッシング|タルタルソース|ミルククリーム|.*ジャム.*|.*マーガリン.*'
LUNCH = {
    # fid_is_mext: 食品番号 column is the MEXT 食品番号 (Kumagaya's 食品ID are city-local codes, e.g. 01192 = its
    # たけのこごはん premix), files: in priority order (first occurrence of a cleaned name wins)
    'toyonaka': {
        'meta': {'source': 'toyonaka', 'label': '豊中市 学校給食献立（料理別栄養価）',
                 'attribution': '出典：豊中市「豊中市小中学校給食献立情報」（BODIKオープンデータ, CC BY 4.0）を加工して作成（料理ごとに集計し100g当たりに換算）',
                 'license': 'CC BY 4.0', 'url': 'https://data.bodik.jp/dataset/272035_school_lunch'},
        'files': lambda: [os.path.join(RAW, 'muni_toyonaka_chu', '272035_school_lunch_chugakko.csv'),
                          os.path.join(RAW, 'muni_toyonaka', '272035_school_lunch_syogakko.csv')],
        'skip': '^(' + LUNCH_SKIP_BASE + ')$', 'fid_is_mext': True,
        'level': lambda path: ('中学生', 180.0) if 'chugakko' in path else ('小学3・4年', 160.0),
    },
    'kumagaya': {
        'meta': {'source': 'kumagaya', 'label': '熊谷市 学校給食献立（料理別栄養価）',
                 'attribution': '出典：熊谷市「学校給食献立情報」（埼玉県オープンデータポータル）を加工して作成（料理ごとに集計し100g当たりに換算）',
                 'license': '公共データ利用規約第1.0版（PDL1.0）', 'url': 'https://opendata.pref.saitama.lg.jp/datasets/3144'},
        # newest fiscal month first (file names carry the date); reverse-sorted for a fixed, documented order
        'files': lambda: sorted(glob.glob(os.path.join(RAW, 'muni2_kumagaya', '*.csv')), reverse=True),
        'skip': r'^(.*の汁|.*ラーメンスープ|.*めんの汁|.*そばの汁|' + LUNCH_SKIP_BASE + ')$', 'fid_is_mext': False,
        'level': lambda path: (None, 180.0),
    },
}


def lunch_clean(n):
    n = n.replace('　', ' ').strip()
    while True:
        m = re.match(r'^(★|☆|[(（](?:後期|前期|揚|焼|蒸|煮)[)）]|[(（]\s*\d+\s*(?:㏄|cc|ｃｃ|ml)\s*[)）])\s*', n)
        if not m:
            break
        n = n[m.end():]
    n = re.sub(r'(?<=[ァ-ヶ])－(?=[ァ-ヶ])', 'ー', re.sub(r'[①-⑳]', '', n))   # ス－プ (U+FF0D) -> スープ
    n = re.sub(r'[(（](?:蒸|揚|焼|ミニ|直送|小袋|大|小|中|個包装|小献)[)）]', '', n)
    n = re.sub(r'[（(][^（）()]*(?:\d|[０-９]|クラス|小献|個数|重量|容器|常温|冷凍|カット|後期|前期)[^（）()]*[）)]', '', n)
    n = re.sub(r'\s*[0-9０-９１-９]+\s*(こ|個|本|枚)$', '', n)
    return re.sub(r'\s+', ' ', n).strip()


def lunch_rows(path):
    rows = read_csv(path)
    cols = {k: next((c for c in cands if c in rows[0]), None) for k, cands in LUNCH_COLS.items()}
    return [{k: r.get(c) or '' for k, c in cols.items()} for r in rows]


def lunch_fid(x):
    x = re.sub(r'\D', '', (x or '').strip())
    return x.zfill(5) if 3 <= len(x) <= 5 else ''


def row_per100(r):
    g = lib.fnum(r['g'], 0.0)
    return {k: lib.fnum(r[k], 0.0) * 100.0 / g for k in ('kcal', 'p', 'f', 'c')} if g > 0 else None


def is_dry_grain(r):
    """Raw rice / dry noodles listed at raw weight (Kumagaya: ごはん 100 g = 359 kcal). Carbohydrate is not used:
    Kumagaya leaves it blank in older files."""
    v = row_per100(r)
    return bool(v) and 280 <= v['kcal'] <= 420 and v['p'] <= 15 and v['f'] <= 6


STAPLE_DISH = re.compile(r'ごはん|ご飯|めし|飯|おこわ|赤飯|ピラフ|ライス|チャーハン|炒飯|丼|うどん|そば|めん|麺|ラーメン|パスタ|'
                         r'スパゲ|マカロニ|ナポリタン|ほうとう|ビーフン|おにぎり|むすび|カレー|ハヤシ|ビビンバ|ちらし|寿司|すし|'
                         r'ずし|リゾット|ドリア|雑炊|かゆ|粥|パエリア')
# raw MEXT id whose cooking gain applies to a dry staple row, by dish name (default: 精白米 炊き 210 %)
DRY_GAIN_ID = [('うどん|ほうとう|きしめん', '01041'), ('そうめん|ひやむぎ|にゅうめん', '01043'), ('そば', '01129'),
               ('ラーメン|中華めん|中華麺|焼きそば|焼そば|ちゃんぽん|タンメン|担々麺|タンタン', '01050'),
               ('スパゲ|パスタ|マカロニ|ナポリタン', '01063')]


def dry_gain(name, gain):
    for pat, fid in DRY_GAIN_ID:
        if re.search(pat, name):
            return gain[fid]
    return gain['01083']


def component_name(name):
    """School menus serve rice/noodles as separate rows: a 〜丼 / 〜カレー / 〜うどん row without any staple
    ingredient is only the topping/sauce/soup. -> (display name, category) or None if it is a complete dish."""
    m = re.match(r'^(.*?)((?:[（(][^（）()]*[）)])*)$', name)
    base, tail = m.group(1), m.group(2)
    if re.search(r'(丼|どんぶり|ライス|ピラフ|ごはん|ご飯|飯)$', base) and not re.search(r'(カレー|ハヤシ)ライス$', base):
        return base + 'の具' + tail, '主菜'
    def note(word):   # '夏野菜カレー（トマト入り）' -> '夏野菜カレー（トマト入り・ごはんなし）'
        return '%s（%s・%s）' % (base, tail[1:-1], word) if re.fullmatch(r'（[^（）]*）', tail) else base + '（%s）' % word + tail
    if re.search(r'(カレー|ハヤシ)(ライス)?$', base):
        base = re.sub(r'ライス$', '', base)
        return note('ごはんなし'), '主菜'
    if re.search(r'(うどん|そば|ラーメン|めん|メン|麺|ビーフン|ちゃんぽん|ほうとう|カレー南蛮)(の?(汁|じる|スープ))?$', base) \
            and 'ちりめん' not in base:
        topping = re.search(r'皿うどん|焼きそば|焼そば|あんかけ|ソース|ナポリタン|炒め', base)
        return note('めんなし'), '主菜' if topping else '汁物'
    return None


def blank_null(rs, tot, share=0.2):
    """A dish's rows leave some cells blank (Kumagaya's older files: 食塩相当量 and 炭水化物 of whole rows). A blank is
    a zero only where the row needs none: salt, in a row with no protein (oil, sugar); carbohydrate, in a row whose
    energy protein and fat explain. When rows with a telling blank hold >= `share` of the dish's kcal, the nutrient is
    unknown (None), not 0 (さわらの西京焼 salt 0, いかフライ C 0.5); salt only when the rest adds up to none. So are P/F/C when a row's protein and fat alone
    exceed its energy (a typo: ホッケみりん干し 40 g, 47 kcal, P 14.6). Fibre is unknown when plant rows (PLANT_GROUPS) with
    a blank cell hold >= `share` of the kcal, or every cell is blank (no column)."""
    kcal = tot['kcal'] or 0
    if kcal <= 0:
        return
    def v(r, k):
        return lib.fnum(r[k], 0.0)
    def blank(r, k):
        return not (r[k] or '').strip()
    salt_gap = sum(v(r, 'kcal') for r in rs if blank(r, 'salt') and v(r, 'p') >= 1)
    c_gap = sum(v(r, 'kcal') for r in rs if blank(r, 'c') and v(r, 'kcal') >= 10
                and 4 * v(r, 'p') + 9 * v(r, 'f') < 0.8 * v(r, 'kcal'))
    typo = sum(v(r, 'kcal') for r in rs if 4 * v(r, 'p') + 9 * v(r, 'f') > 1.3 * v(r, 'kcal') + 5)
    if salt_gap >= share * kcal and (tot['salt'] or 0) < 0.05:   # partial blanks (a miso soup's tofu) stay counted
        tot['salt'] = None
    if c_gap >= share * kcal and tot['c'] is not None:
        tot['c'] = None
    if tot.get('fib') is not None:
        fib_gap = sum(v(r, 'kcal') for r in rs if blank(r, 'fib') and lunch_fid(r['fid'])[:2] in PLANT_GROUPS)
        if fib_gap >= share * kcal or all(blank(r, 'fib') for r in rs):
            tot['fib'] = None
    if typo >= 0.1 * kcal or any(4 * v(r, 'p') + 9 * v(r, 'f') > 1.3 * v(r, 'kcal') + 5 and v(r, 'p') >= 3 for r in rs):
        tot.update(p=None, f=None, c=None)


def build_lunch(b, city):
    """Rows (one ingredient each: raw g + nutrients) summed per 料理ID -> one school serving. Weight = raw sum +
    water gained by raw rice/dry noodles (MEXT 表12; by 食品番号, or by composition for city-local codes); soups:
    max(sum, stated cc or 160/180 g). A 丼/カレー/麺 row without rice/noodles is renamed 〜の具 / 〜（ごはんなし）/
    〜（めんなし）. Physically impossible rows are dropped. First occurrence of a cleaned name wins."""
    prof, gain = LUNCH[city], b.cook_gain
    skip = re.compile(prof['skip'])
    dishes, used, dropped = {}, set(), set()
    for path in prof['files']():
        level, soup_g = prof['level'](path)
        rows, by = lunch_rows(path), {}
        # a few files number every row as its own 料理ID (Kumagaya 2024-09): group those by dish name instead
        per_row = len({(r['lid'], r['date']) for r in rows}) > 0.9 * len(rows)
        for r in rows:
            by.setdefault((r['name'] if per_row else r['lid'], r['date']), []).append(r)
        for (_, date), rs in by.items():
            raw, lid = rs[0]['name'] or '', rs[0]['lid']
            name = lunch_clean(raw)
            if not name or skip.match(name) or name in dishes:
                continue
            raw_w = w = sum(lib.fnum(r['g'], 0.0) for r in rs)
            tot = {k: sum(lib.fnum(r[k], 0.0) for r in rs) for k in NUTS + ('fib',)}
            if w < 5 or tot['kcal'] <= 0:
                continue
            if prof['fid_is_mext']:
                w += sum(lib.fnum(r['g'], 0.0) * gain[lunch_fid(r['fid'])] for r in rs if lunch_fid(r['fid']) in gain)
            elif STAPLE_DISH.search(name):   # city-local food codes: detect raw-weight staples by composition
                w += sum(lib.fnum(r['g'], 0.0) * dry_gain(name, gain) for r in rs
                         if is_dry_grain(r) and lib.fnum(r['g'], 0.0) >= 0.2 * raw_w)
            cat = '主菜' if re.search(r'の具([（(].*)?$', name) else cat_guess(name)
            # rice/noodles/bread = a MEXT group 01 food code (Kumagaya's local codes keep the group prefix)
            staple = any(lunch_fid(r['fid'])[:2] == '01' and lib.fnum(r['g'], 0.0) >= 0.05 * raw_w for r in rs)
            comp = None if staple else component_name(name)
            if comp:
                name, cat = comp
                if name in dishes:
                    continue
            m = re.search(r'[(（]\s*(\d+)\s*(?:㏄|cc|ｃｃ|ml)', raw)
            if m:
                w = max(w, float(m.group(1)))
            elif any(k in name for k in lib.SOUP_WORDS) and 'カレー' not in name:
                w = max(w, soup_g)
            k = 100.0 / w
            if 4 * tot['p'] + 9 * tot['f'] + 4 * tot['c'] < 0.6 * tot['kcal']:   # blank nutrient cells, not zeros
                tot.update(p=None, f=None, c=None)
            blank_null(rs, tot)
            fat = (tot['f'] or 0) * k
            if sum(tot[n] or 0 for n in 'pfc') * k > 105 or tot['kcal'] * k > 4 * (100 - fat) + 9 * fat + 30 \
                    or (cat in ('副菜', '汁物') and tot['kcal'] * k > 250):
                # physically impossible per 100 g, or a side dish/soup denser than 250 kcal/100 g (dry weight entered)
                dropped.add(name)
                continue
            iid, n_ = '%s:%s' % (city, lid), 2
            while iid in used:
                iid, n_ = '%s:%s-%d' % (city, lid, n_), n_ + 1
            used.add(iid)
            label = '給食1人分（%s）' % level if level else '給食1人分'
            it = {'id': iid, 'name': name, 'cat': cat, **nutrients({n: v if v is None else v * k for n, v in tot.items()}),
                  'portions': [{'label': label, 'g': round(w)}],
                  'note': '学校給食献立（%s）の食材合計から推計' % date}
            if raw.strip() != name:
                it['full'] = raw.strip()
            if lib.KATA_ONLY.fullmatch(name):
                it['aliases'] = [kata2hira(name)]
            dishes[name] = it
    items = list(dishes.values())
    b.reports[city + '_dropped'] = sorted(dropped - set(dishes))
    adult_portions(b, city, items)
    return dict(prof['meta'], items=items)


# MEXT foods that are dishes (group 18 調理済み流通食品) or staples dishes are compared with
MEXT_DISH_STAPLES = ('01088', '01168', '01039', '01064', '01048', '01026')


def dish_entries(b, sources):
    """[(source, item)] for name-level matching: recipe/dish datasets + MEXT prepared foods and staples."""
    out = [(s, it) for s in sources if s != 'mext' for it in b.get(s)['items']]
    if 'mext' in sources:
        out += [('mext', it) for it in b.get('mext')['items']
                if it['id'][5:7] == '18' or it['id'][5:] in MEXT_DISH_STAPLES]
    return out


ADULT_REFS = ('dishes', 'eatout', 'kurume', 'mext')
SERVING_LABEL = re.compile(r'人前|皿|杯|食|盛')   # MEXT portions like '1個' are pieces, not servings
DEFAULT_ADULT_RATIO = 1.3   # adult/school portion overall 1.2-1.4
STAPLE_ADULT_RATIO = 1.2    # 主食 without its own measured ratio (the city-wide one is driven by small mains)


def adult_portions(b, city, items):
    """Default portion = the adult portion of the same dish in dishes/eatout/kurume/MEXT (median), else the school
    portion x the adult/school ratio measured on the matched dishes of this city (per category, n >= 5; else
    city-wide; 主食 1.2; else 1.3; at most 1.3 for a school serving >= 200 g), rounded to 10 g. The school serving
    stays as the second portion."""
    entries = dish_entries(b, ADULT_REFS) + [(city, it) for it in items]
    ref_g = {}
    for idx in lib.group_by_name(entries, ('dishes', 'eatout', 'mext')):
        adult = [entries[i][1]['portions'][0]['g'] for i in idx if entries[i][0] in ADULT_REFS
                 and entries[i][1].get('portions') and entries[i][1]['portions'][0]['g'] != 100
                 and (entries[i][0] != 'mext' or SERVING_LABEL.search(entries[i][1]['portions'][0]['label']))]
        if adult:
            for i in idx:
                if entries[i][0] == city:
                    ref_g[entries[i][1]['id']] = round(statistics.median(adult), 1)
    for it in items:   # a matched adult serving < 0.4x or > 4x the school serving is a different kind of serving
        if it['id'] in ref_g and not 0.4 <= ref_g[it['id']] / it['portions'][0]['g'] <= 4:
            del ref_g[it['id']]
    ratios = {}
    for it in items:
        if it['id'] in ref_g:
            r = ref_g[it['id']] / it['portions'][0]['g']
            ratios.setdefault(it['cat'], []).append(r)
            ratios.setdefault('*', []).append(r)
    ratio = {c: statistics.median(v) for c, v in ratios.items() if len(v) >= 5}
    b.reports['%s_adult_ratio' % city] = {c: (round(v, 2), len(ratios[c])) for c, v in sorted(ratio.items())}
    for it in items:
        school = it['portions'][0]
        if it['id'] in ref_g:
            adult = {'label': '1人前（目安）', 'g': int(round(ref_g[it['id']]))}
        else:
            f = ratio.get(it['cat']) or (STAPLE_ADULT_RATIO if it['cat'] == '主食' else ratio.get('*', DEFAULT_ADULT_RATIO))
            if school['g'] >= 200:   # the measured 主菜 ratio comes from small mains (60 g hamburg vs 150 g)
                f = min(f, DEFAULT_ADULT_RATIO)
            adult = {'label': '1人前（目安・給食量から換算）', 'g': max(10, int(round(school['g'] * f / 10.0)) * 10)}
        it['portions'] = [adult, school]


# ---------------------------------------------------------------- jbfd (CC0): market food types not in MEXT
JBFD_CSV = os.path.join(RAW, 'reliab_github', 'jbfd', 'jbfd_boxes_v0.1.csv')
CORR_CSV = os.path.join(RAW, 'reliab_github', 'jbfd_corr', 'correspondence_v0.1.csv')
JBFD_CATS = [  # first match wins (box names are Japanese food-type names)
    (r'飲料|ジュース|ドリンク|茶$|コーヒー|オーツミルク|^水$', '飲料'), (r'ヨーグルト', '乳製品'),
    (r'お菓子|菓子$', '菓子・デザート'), (r'ごはん類|がゆ', '主食'),
    (r'香味油|オイル漬', '油脂'), (r'サラダ|酢の物|和え物|煮物|昆布巻|茶わんむし', '副菜'),
    (r'パン粉焼|惣菜|おでん|角煮|春巻|カツ|フライ|揚げ物|天ぷら|煮付け|アクアパッツァ|アヒージョ|鍋|ハヤシ|肉巻|味付け|'
     r'漬け魚|焼鳥|チキン|フレーク|切身|ムール貝|シーフード|練り製品|鶏肉|竜田', '主菜'),
    (r'調味|ソース|だし|ソルト|シーズニング|ペースト|シロップ|酢|ねり梅|ルウ|の素|スプレッド|ジャム|製菓材料', '調味料'),
    (r'パン|トルティーヤ|ホットク|クレープ', 'パン'),
    (r'菓子|ケーキ|タルト|大福|モンブラン|チュロス|ファッジ|わらび餅|団子|ラスク|バー$|きんとん|ドッグ|クルトン|チップス|'
     r'飴がけ|おつまみ|珍味|燻製', '菓子・デザート'),
    (r'麺|めん|うどん|フォー', '麺'),
    (r'ごはん|がゆ|グラノーラ|雑穀|チャーハン|ライスバーガー|ピザ|ドリア|ビビンバ|トッポッキ|ちらし寿司', '主食'),
    (r'スープ', '汁物'), (r'ナッツ|アーモンド', 'ナッツ・種'), (r'ビーンズ|煮豆', '大豆・豆'), (r'海藻', '海藻'),
    (r'果実|フルーツ', '果物'), (r'野菜|パプリカ', '野菜'),
]


JBFD_COLS = ('energy_kcal', 'protein_g', 'fat_g', 'carbohydrate_g', 'salt_equiv_g')


def jbfd_rows():
    return [r for r in read_csv(JBFD_CSV) if r.get('box_id')]


def build_jbfd(b):
    """Q boxes of jbfd v0.1 (food types with no MEXT item, e.g. カット野菜ミックス, ゼリー飲料, ミックスナッツ): mean label
    values per 100 g of >= 3 private-brand products. Residual boxes (その他…, セット) and names already covered by
    another dataset are left out. P boxes (= a MEXT item) are used for verification only (verify.json)."""
    have = set()
    for name in [s for s in DISH_SOURCES if s != 'jbfd']:
        for it in b.get(name)['items']:
            have.update(lib.name_key(x) for x in [it['name']] + (it.get('aliases') or []))
    items = []
    for r in sorted(jbfd_rows(), key=lambda r: r['box_id']):
        n = int(lib.fnum(r['energy_kcal_n'], 0))
        if r['box_type'] != 'Q' or r['residual_q'] != '0' or n < 3 or lib.name_key(r['box_name_ja']) in have:
            continue
        name = r['box_name_ja']
        cat = next((c for pat, c in JBFD_CATS if re.search(pat, name)), 'その他')
        sd = lib.fnum(r['energy_kcal_sd'])
        if sd is not None and sd > 0.5 * max(lib.fnum(r['energy_kcal_mean'], 0), 20):   # incoherent mix (powder + drink)
            continue
        vals = {n: lib.fnum(r[col + '_mean']) for n, col in zip(NUTS, JBFD_COLS)}
        if None not in (vals['p'], vals['f'], vals['c']) and vals['kcal'] > 2 * (4 * vals['p'] + 9 * vals['f'] + 4 * vals['c']) + 30:
            continue   # means of different label bases (レギュラーコーヒー粉: 337 kcal with P/F/C of the brewed cup)
        it = {'id': 'jbfd:' + r['box_id'], 'name': name, 'cat': cat,
              **nutrients(vals), 'portions': [{'label': '100g', 'g': 100}],
              'note': '市販のプライベートブランド商品%d品の栄養成分表示（100gあたり）の平均%s。商品により異なります' % (
                  n, '（エネルギーの標準偏差 %d kcal）' % kcal_int(sd) if sd is not None else '')}
        items.append(it)
    return {'source': 'jbfd', 'label': '市販品の平均値（JBFD 日本の市販食品データベース）',
            'attribution': 'Nakagawa & Yamamoto, Japan Branded Food Database (JBFD) v0.1, RinCOM（CC0 1.0）。小売3社のPB商品の表示値の平均',
            'license': 'CC0 1.0', 'url': 'https://github.com/shnkgw-rincom/jbfd', 'items': items}


# ---------------------------------------------------------------- Open Food Facts
def build_off(b):
    import off
    doc, b.shards, b.reports['off'] = off.build(os.path.join(RAW, 'off'))
    return doc


# ---------------------------------------------------------------- verify.json (cross-source confirmation)
# Values are keyed by dataset source; n counts independent families. Our recipe sets (dishes, eatout and the MAFF /
# Takatsuki recipes we convert with MEXT values) are one family; MEXT, each city, JBFD and USDA are their own.
FAMILY = {'eatout': 'dishes', 'maff_kyodo': 'dishes', 'takatsuki': 'dishes'}
SPREAD_MAX = 1.5   # a confirmed group's kept values lie within 1.5x of each other
USDA_META = {'label': '米国農務省 FoodData Central（MEXT対応表経由）', 'license': 'CC0 1.0 / Public Domain',
             'url': 'https://fdc.nal.usda.gov/',
             'attribution': 'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central。対応表: Nakagawa & '
                            'Yamamoto, Japan–US Food Composition Correspondence Table v0.1（CC0 1.0）'}
DISH_SOURCES = ('dishes', 'eatout', 'maff_kyodo', 'kurume', 'toyonaka', 'kumagaya', 'takatsuki', 'tokyo_hokeniryo', 'jbfd', 'mext')


def mext_second_sources(b):
    """MEXT 食品番号 -> {source: kcal/100 g} from jbfd P boxes (label means, >= 2 products) and the MEXT-USDA
    correspondence table (only pairs that agree on kcal after fixing kJ entered as kcal; disagreeing pairs are
    mostly LLM pairing / food-state errors). School-lunch ingredient rows are MEXT values, so they are not used."""
    mext = {it['id'][5:]: it for it in b.get('mext')['items']}
    out = {}
    for r in jbfd_rows():
        k = lib.fnum(r['energy_kcal_mean'])
        if r['box_type'] == 'P' and r['jfct_code'].zfill(5) in mext and k is not None and lib.fnum(r['energy_kcal_n'], 0) >= 2:
            out.setdefault(r['jfct_code'].zfill(5), {})['jbfd'] = k
    for r in read_csv(CORR_CSV):
        fid, k = str(r['food_id']).zfill(5), lib.fnum(r['us_energy_kcal'])
        p, f, c = (lib.fnum(r[x]) for x in ('us_protein', 'us_fat', 'us_carb'))
        if fid not in mext or k is None:
            continue
        if None not in (p, f, c):
            atw = 4 * p + 9 * f + 4 * c
            if atw > 5 and k > 1.8 * atw and abs(k / 4.184 - atw) <= 0.3 * atw + 5:
                k = k / 4.184
        if lib.agree('kcal', k, mext[fid]['kcal']):
            out.setdefault(fid, {})['usda'] = k
    return out


def verify_group(vals, ref=None):
    """vals = [(source, item id or None for a second value, kcal)]. The reference is `ref` or the value that the
    most families agree with (then the most values; ties: sorted order). Values that disagree with it are left out.
    -> (n, {source: median kcal}, kept item ids) or None when < 2 sources remain. n = agreeing families, 1 when
    the kept values spread more than SPREAD_MAX."""
    def fam(vs):
        return len({FAMILY.get(s, s) for s, _, _ in vs})
    vals = sorted((v for v in vals if v[2] is not None), key=lambda v: (v[0], v[1] or '', v[2]))
    if ref is None:
        ref = max(vals, key=lambda r: (fam([v for v in vals if lib.agree('kcal', v[2], r[2])]),
                                       sum(lib.agree('kcal', v[2], r[2]) for v in vals)))[2] if vals else None
    keep = [v for v in vals if lib.agree('kcal', v[2], ref)]
    per = {}
    for s, _, k in keep:
        per.setdefault(s, []).append(k)
    if len(per) < 2:
        return None
    ks = [k for _, _, k in keep]
    n = fam(keep) if min(ks) > 0 and max(ks) <= SPREAD_MAX * min(ks) else 1
    return n, {s: kcal_int(statistics.median(v)) for s, v in sorted(per.items())}, [i for _, i, _ in keep if i]


def build_verify(b):
    """Groups of items that describe the same food in >= 2 sources, with each source's kcal/100 g.
    Dish level: same normalised name (lib.name_key, alias linking). Food level: a MEXT food + its jbfd/USDA values
    (reference = MEXT). Only values agreeing with the reference (±15 % / 10 kcal) are kept. n >= 2 = confirmed."""
    entries = dish_entries(b, DISH_SOURCES)
    second = mext_second_sources(b)
    groups, by_id, done = [], {}, set()

    def add(vals, ref=None):
        g = verify_group(vals, ref)
        if g:
            groups.append({'n': g[0], 'kcal': g[1]})
            for iid in g[2]:
                by_id[iid] = len(groups) - 1
            done.update(g[2])

    for idx in lib.group_by_name(entries, ('dishes', 'eatout', 'mext')):
        vals = [(entries[i][0], entries[i][1]['id'], entries[i][1]['kcal']) for i in idx]
        for i in idx:
            if entries[i][0] == 'mext':
                vals += [(o, None, v) for o, v in second.get(entries[i][1]['id'][5:], {}).items()
                         if o not in {s for s, _, _ in vals}]
        add(vals)
    for it in b.get('mext')['items']:
        if it['id'] not in done and it['id'][5:] in second:
            add([('mext', it['id'], it['kcal'])] + [(o, None, v) for o, v in sorted(second[it['id'][5:]].items())],
                it['kcal'])
    used = sorted({o for g in groups for o in g['kcal']})
    meta = {o: USDA_META if o == 'usda' else {k: b.get(o)[k] for k in ('label', 'license', 'url', 'attribution')}
            for o in used}
    return {'sources': meta, 'groups': groups, 'byId': {k: by_id[k] for k in sorted(by_id)}}


def verify_stats(v):
    n = [g['n'] for g in v['groups']]
    cover = {}
    for iid, gi in v['byId'].items():
        cover.setdefault(iid.split(':')[0], [0, 0])[0 if v['groups'][gi]['n'] >= 2 else 1] += 1
    return {'groups': len(n), 'n>=2': sum(x >= 2 for x in n), 'n>=3': sum(x >= 3 for x in n),
            'n>=4': sum(x >= 4 for x in n), 'items': len(v['byId']),
            'items_confirmed': sum(1 for gi in v['byId'].values() if v['groups'][gi]['n'] >= 2),
            'by_source(confirmed,unconfirmed)': dict(sorted(cover.items()))}


# ---------------------------------------------------------------- index.json
BADGE = {'mext': 'MEXT', 'dishes': '料理', 'eatout': '外食', 'maff_kyodo': '郷土', 'toyonaka': '給食', 'kumagaya': '給食',
         'takatsuki': '給食', 'kurume': '久留米', 'tokyo_hokeniryo': '東京都', 'jbfd': '市販品', 'off': '商品'}
PRIMARY = {'mext', 'dishes', 'eatout'}
LAZY = {'off'}


def build_index(dirs):
    """dirs: directories to look files up in, first hit wins (staging dir, then out/ for skipped targets).
    version = first 12 hex of sha256 over every generated file (name + bytes), so it changes with any data."""
    def find(rel):
        return next((os.path.join(d, rel) for d in dirs if os.path.exists(os.path.join(d, rel))), None)
    h = hashlib.sha256()
    files = [TARGETS[n][1] for n in TARGETS] + ['verify.json']
    jan = find('jan')
    if jan:
        files += ['jan/' + f for f in sorted(os.listdir(jan)) if f.endswith('.json')]
    for rel in files:
        p = find(rel)
        if p:
            h.update(rel.encode() + b'\0')
            with open(p, 'rb') as f:
                h.update(f.read())
    return {'version': h.hexdigest()[:12],
            'datasets': [{'file': TARGETS[n][1], 'source': n, 'badge': BADGE[n], 'secondary': n not in PRIMARY,
                          'lazy': n in LAZY} for n in TARGETS if find(TARGETS[n][1])]}


# ---------------------------------------------------------------- 「これは…」 lines (data_src/descriptions.json)
DESC_TARGETS = ('mext', 'dishes', 'eatout', 'maff_kyodo')
# what a line must not say: a health claim, or what a food does for the body (docs/food-data.md "Descriptions")
DESC_BANNED = re.compile(r'効果|効能|予防|改善|健康|美容|美肌|ダイエット|免疫|血圧|血糖|痩せ|やせる|デトックス|体に良い|'
                         r'体にいい|栄養満点|栄養豊富|疲労回復|整腸|老化|若返')
MEXT_TOKEN = re.compile(r'［[^］]*］|（[^）]*）|＜[^＞]*＞|[^\s　［（＜]+')


DESC_GENERIC = {'漬物', '加工品', '缶詰', '果実飲料', '水煮缶詰', 'つくだ煮'}


def mext_desc_key(group, name):
    """A MEXT official name as description-key tokens: its group, then the name's tokens without the leading ＜類＞ /
    （類） class marks ('＜魚類＞（さけ・ます類）しろさけ イクラ' -> ['10', 'しろさけ', 'イクラ']; ［…］ and （…） are tokens).
    A generic first token keeps its class, as a name: '（なす類）漬物 しば漬' -> ['06', 'なす', '漬物', 'しば漬']."""
    toks, cls = MEXT_TOKEN.findall(name), None
    while toks and toks[0][0] in '＜（':
        t = toks.pop(0)
        cls = t if t[0] == '（' else cls
    if cls and toks and toks[0] in DESC_GENERIC:
        toks.insert(0, re.sub('類$', '', cls[1:-1]))
    return [group] + toks


# the hand-authored per-item lines: field -> (file in data_src, max length)
LINE_FILES = {'desc': ('descriptions.json', lib.DESC_MAX), 'gloss': ('glosses.json', lib.GLOSS_MAX)}


def desc_errors(doc, field='desc'):
    """Problems in a descriptions (or glosses) doc: {"_…": comment, target: {key: {"d": line, "src": [source, ...]}}}.
    A line is one short sentence, no final 。 and no health claim, backed by at least two independent sources (`src`:
    build-time only, never shipped); "d": "" means none (also a narrower key's way to drop a broader one's line). A
    gloss (an everyday name) is Japanese only: no Latin letters, no punctuation."""
    limit = LINE_FILES[field][1]
    errs = []
    for t, lines in doc.items():
        if t.startswith('_'):
            continue
        if t not in DESC_TARGETS or not isinstance(lines, dict):
            errs.append('unknown section %s' % t)
            continue
        for k, e in lines.items():
            if t == 'mext' and not re.fullmatch(r'\d\d( \S+)+', k):
                errs.append('mext key %r: not "<group> <token> ..."' % k)
            v, src = (e.get('d'), e.get('src')) if isinstance(e, dict) else (None, None)
            if not isinstance(v, str) or len(v) > limit or v != v.strip() or re.search(r'[\n。]$|[\n\ufffd]', v) \
                    or DESC_BANNED.search(v) or set(e) - {'d', 'src'} \
                    or field == 'gloss' and re.search(r'[A-Za-zＡ-Ｚａ-ｚ\s。、,.]', v):
                errs.append('%s %s: bad line %r' % (t, k, e))
            elif v and (not isinstance(src, list) or len(set(src)) < 2
                        or not all(isinstance(x, str) and x.strip() for x in src)):
                errs.append('%s %s: a line needs two sources' % (t, k))
    return errs


def load_descriptions(path=None, field='desc'):
    """{target: {key: line}} from data_src/descriptions.json or glosses.json (every target present, maybe empty; the
    sources dropped)."""
    path = path or os.path.join(SRC, LINE_FILES[field][0])
    doc = load_json(path) if os.path.exists(path) else {}
    errs = desc_errors(doc, field)
    if errs:
        fail('%s: %s' % (os.path.basename(path), '; '.join(errs[:10])))
    return {t: {k: e['d'] for k, e in doc.get(t, {}).items()} for t in DESC_TARGETS}


def attach_desc(items, lines, mext_keys=None, field='desc'):
    """Set each item's `desc` (or `field`) from `lines`: by its local id, or (mext_keys: item id -> key tokens) the longest key
    matching the start of a food's tokens, '*' standing for any one token (of keys as long, the one with fewer '*'
    wins, then the first in the file). -> the keys that matched no item."""
    used = set()
    keys = sorted(((k.split(' '), k) for k in lines), key=lambda x: (-len(x[0]), x[0].count('*'))) if mext_keys is not None else None
    for it in items:
        local = it['id'].split(':', 1)[1]
        if keys is None:
            k = local if local in lines else None
        else:
            toks = mext_keys[local]
            k = next((key for ks, key in keys if len(ks) <= len(toks)
                      and all(a == '*' or a == b for a, b in zip(ks, toks))), None)
        if k is not None:
            used.add(k)
            if lines[k]:
                it[field] = lines[k]
    return sorted(set(lines) - used)


# ================================================================ driver
MX = 'mext/main_2023_ch2.xlsx'
# target -> (builder, output file, required raw inputs relative to RAW)
TARGETS = {
    'mext': (build_mext, 'foods.json', [MX]),
    'dishes': (build_dishes, 'dishes.json', [MX]),
    'eatout': (build_eatout, 'eatout.json', [MX]),
    'maff_kyodo': (build_maff_kyodo, 'extra_maff_kyodo.json', [MX, 'maff_kyodo/menu']),
    'takatsuki': (build_takatsuki, 'extra_takatsuki.json',
                  [MX, 'muni_takatsuki/gakkokyusyokurecipi.csv']),
    'kurume': (build_kurume, 'extra_kurume.json', ['muni_kurume/ryori_eiyouka.csv']),
    'toyonaka': (lambda b: build_lunch(b, 'toyonaka'), 'extra_toyonaka.json', LUNCH['toyonaka']['files']()),
    'kumagaya': (lambda b: build_lunch(b, 'kumagaya'), 'extra_kumagaya.json', ['muni2_kumagaya']),
    'tokyo_hokeniryo': (build_tokyo_hokeniryo, 'extra_tokyo_hokeniryo.json', ['tokyo_hokeniryo']),
    'jbfd': (build_jbfd, 'jbfd.json', [JBFD_CSV]),
    'off': (build_off, 'products.json', ['off/off_jp.jsonl']),
}
# Our recipe sets, in the order a shared name stays plain; the word that tells a later one apart (MAFF: its prefecture)
SAME_NAME = ['dishes', 'eatout', 'maff_kyodo', 'takatsuki']
SAME_NAME_WORD = {'eatout': 'お店', 'takatsuki': '給食'}


def pref_of(it):
    """A MAFF dish's prefecture, the last bracket of its `full` (「いとこ煮／にざい（富山県）」 → 富山県)."""
    m = re.search(r'（([^（）]+)）$', it.get('full') or '')
    if not m:
        fail('%s: no prefecture in its full name' % it['id'])
    return m.group(1)


def qualified(name, word):
    """焼き餃子（6個） + お店 → 焼き餃子（6個・お店）; 雑煮 + 三重県 → 雑煮（三重県）."""
    return name[:-1] + '・' + word + '）' if name.endswith('）') else '%s（%s）' % (name, word)


# A school lunch named after a story (読書 menus: 「かさこじぞう」の恩返し味噌汁, ごんぎつねのみそ汁): pop -1, a tier under
# the plain dishes (search.ts POP_WEIGHT)
STORY = re.compile(r'「[^」]+」|ごんぎつね')
NO_ALIAS_ENRICH = {'mext', 'off'}   # foods.json aliases are curated; OFF names are brand product names
VERIFY_INPUTS = [JBFD_CSV, CORR_CSV, MEXT_XLSX]


class Builder:
    """Builds targets on demand (memoized). A target whose raw inputs are missing falls back to out/."""

    def __init__(self):
        self.docs, self.skipped, self.reports, self.shards = {}, [], {}, None

    @functools.cached_property
    def mext_rows(self):
        return lib.mext_rows(MEXT_XLSX)

    @functools.cached_property
    def foods(self):
        return lib.mext_foods(self.mext_rows)

    @functools.cached_property
    def cook_gain(self):
        return lib.load_cook_gain()

    @functools.cached_property
    def aliases(self):
        return lib.Aliases()

    @functools.cached_property
    def descriptions(self):
        return {f: load_descriptions(field=f) for f in LINE_FILES}

    def get(self, name):
        if name not in self.docs:
            fn, fname, inputs = TARGETS[name]
            if not all(os.path.exists(os.path.join(RAW, p)) for p in inputs):
                self.skipped.append(name)
                self.docs[name] = load_json(previous(fname, name))
            else:
                doc = fn(self)
                for it in doc['items']:
                    if name not in NO_ALIAS_ENRICH:
                        self.aliases.enrich(it)
                    tidy(it)
                if name in DESC_TARGETS:
                    mk = {r['id']: mext_desc_key(r['group'], r['name']) for r in self.mext_rows} if name == 'mext' else None
                    for f, (fname_, _) in LINE_FILES.items():
                        unused = attach_desc(doc['items'], self.descriptions[f][name], mk, f)
                        if unused:
                            fail('%s %s: keys matching no item: %s' % (fname_, name, ', '.join(unused[:10])))
                if name in SAME_NAME:
                    self.qualify(name, doc)
                if name not in NO_ALIAS_ENRICH:
                    for it in doc['items']:
                        if STORY.search(it['name']) and 'pop' not in it:
                            it['pop'] = -1
                self.docs[name] = doc
        return self.docs[name]

    def qualify(self, name, doc):
        """Our recipe sets (one family, docs/food-data.md) never show two rows alike with different kcal: a name a set
        before it holds at another kcal is qualified by what differs (お店, 給食; at the same kcal the search shows one).
        A MAFF dish sharing its name with any of them, or another MAFF dish, takes its prefecture."""
        taken = collections.defaultdict(list)
        for n in SAME_NAME[:SAME_NAME.index(name)]:
            for it in self.get(n)['items']:
                taken[it['name']].append(it['kcal'])
        mine = collections.Counter(it['name'] for it in doc['items'])
        for it in doc['items']:
            if name == 'maff_kyodo' and (it['name'] in taken or mine[it['name']] > 1):
                it['name'] = qualified(it['name'], pref_of(it))
            elif any(k != it['kcal'] for k in taken[it['name']]):
                it['name'] = qualified(it['name'], SAME_NAME_WORD[name])


def previous(rel, name):
    """out/<rel>, the last build's file, for a target skipped for lack of raw inputs."""
    p = os.path.join(OUT, rel)
    if not os.path.exists(p):
        fail('%s: raw inputs missing in %s and no previous build in %s' % (name, RAW, os.path.relpath(p)))
    return p


def write_outputs(b, names, out):
    """Validate every target (shipped files of skipped targets too) and write the built ones into `out`;
    returns {file: errors}."""
    problems = {}

    def check(rel, errs):
        if errs:
            problems[rel] = errs
    for name in names:
        doc, fname = b.get(name), TARGETS[name][1]
        check(fname, lib.validate(doc))
        if name in b.skipped:
            if name == 'off':
                for p in sorted(glob.glob(os.path.join(previous('jan', name), '*.json'))):
                    check('jan/' + os.path.basename(p), lib.validate(load_json(p), 'shard'))
            continue
        write_json(os.path.join(out, fname), doc)
        if name == 'off':
            for k, shard in b.shards.items():
                check('jan/%s.json' % k, lib.validate(shard, 'shard'))
                write_json(os.path.join(out, 'jan', k + '.json'), shard)
    return problems


def check_verify(v, b):
    kcal = {it['id']: it['kcal'] for n in TARGETS if n != 'off' for it in b.get(n)['items']}
    errs = ['group %d: <2 sources, bad n or spread' % i for i, g in enumerate(v['groups'])
            if len(g['kcal']) < 2 or not 0 <= g['n'] <= len(g['kcal']) or set(g['kcal']) - set(v['sources'])
            or g['n'] >= 2 and max(g['kcal'].values()) > SPREAD_MAX * min(g['kcal'].values())]
    errs += ['source %s: missing label/license/url/attribution' % o for o, m in v['sources'].items()
             if sorted(m) != ['attribution', 'label', 'license', 'url'] or not all(m.values())]
    errs += ['byId %s: unknown item or group' % k for k, gi in v['byId'].items()
             if k not in kcal or not 0 <= gi < len(v['groups'])]
    errs += ['byId %s: own source value disagrees with the item' % k for k, gi in v['byId'].items()
             if k in kcal and 0 <= gi < len(v['groups'])
             and not lib.agree('kcal', kcal[k], v['groups'][gi]['kcal'].get(k.split(':')[0]))]
    return errs


def main(argv):
    out = OUT
    if '--out' in argv:
        i = argv.index('--out')
        out, argv = os.path.abspath(argv[i + 1]), argv[:i] + argv[i + 2:]
    names = argv or ['all']
    full = names in (['all'], ['check'])
    if full:
        targets, extra = list(TARGETS), ['verify', 'index']
    else:
        bad = [n for n in names if n not in TARGETS and n not in ('verify', 'index')]
        if bad:
            fail('unknown target(s) %s; choose from %s verify index, all, check' % (bad, ' '.join(TARGETS)))
        targets = [n for n in names if n in TARGETS]
        # verify.json references dataset ids, index.json hashes every file: rebuild them with what they depend on
        want = set(names) | ({'verify'} if set(targets) & set(DISH_SOURCES) else set())
        extra = [n for n in ('verify', 'index') if n in want or n == 'index' and (targets or 'verify' in want)]
    b = Builder()
    stage = tempfile.mkdtemp(prefix='.build-', dir=ROOT)
    try:
        problems = write_outputs(b, targets, stage)
        for n in targets:
            if n in b.skipped and full:   # keep the shipped file so the staged set is complete
                shutil.copy2(previous(TARGETS[n][1], n), stage)
                if n == 'off':
                    shutil.copytree(previous('jan', n), os.path.join(stage, 'jan'))
        if 'verify' in extra:
            if all(os.path.exists(p) for p in VERIFY_INPUTS):
                v = build_verify(b)
                problems.update({'verify.json': e for e in [check_verify(v, b)] if e})
                write_json(os.path.join(stage, 'verify.json'), v)
                b.reports['verify'] = verify_stats(v)
            else:
                b.skipped.append('verify')
                if full:
                    shutil.copy2(previous('verify.json', 'verify'), stage)
        if 'index' in extra:
            write_json(os.path.join(stage, 'index.json'), build_index([stage, out]))
        for f, errs in sorted(problems.items()):
            print('INVALID %s: %s' % (f, '; '.join(errs[:5])))
        for n in targets:
            if n not in b.skipped:
                print('built %-16s %6d items' % (n, len(b.get(n)['items'])))
        for k, v in sorted(b.reports.items()):
            print('  %s: %s' % (k, v))
        if b.skipped:
            print('skipped (raw inputs missing; out/ file kept):', ' '.join(b.skipped))
        if problems:
            return 1
        if names == ['check']:
            if not os.path.isdir(OUT):
                print('check: OK, a fresh build validates (no out/ to compare with)')
                return 0
            return compare(stage, OUT)
        install(stage, out)
        return 0
    finally:
        shutil.rmtree(stage, ignore_errors=True)


def install(stage, dest):
    os.makedirs(dest, exist_ok=True)
    for f in sorted(os.listdir(stage)):
        src = os.path.join(stage, f)
        if f == 'jan':
            old = os.path.join(dest, 'jan')
            trash = old + '.old'
            shutil.rmtree(trash, ignore_errors=True)
            if os.path.exists(old):
                os.replace(old, trash)
            os.replace(src, old)
            shutil.rmtree(trash, ignore_errors=True)
        else:
            os.replace(src, os.path.join(dest, f))
    print('installed into', os.path.relpath(dest))


def compare(stage, dest):
    diffs = 0
    for dirpath, _, files in os.walk(stage):
        for f in sorted(files):
            p = os.path.join(dirpath, f)
            rel = os.path.relpath(p, stage)
            q = os.path.join(dest, rel)
            if not os.path.exists(q) or open(p, 'rb').read() != open(q, 'rb').read():
                diffs += 1
                if diffs <= 20:
                    print('DIFF', rel)
    for sub in ('', 'jan'):   # files in out/ that a fresh build does not produce (removed targets, old shards)
        sd, dd = os.path.join(stage, sub), os.path.join(dest, sub)
        if os.path.isdir(sd) and os.path.isdir(dd):
            extra = sorted(set(os.listdir(dd)) - set(os.listdir(sd)))
            if extra:
                diffs += len(extra)
                print('STALE in out/%s: %d (e.g. %s)' % (sub, len(extra), extra[:3]))
    print('check: %s' % ('OK, out/ matches a fresh build' if not diffs else '%d file(s) differ' % diffs))
    return 1 if diffs else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
