"""Shared helpers for the data pipeline (stdlib only, no network)."""
import csv, io, json, math, os, re, unicodedata, zipfile
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                        # food-data/
# untrusted downloads (data only, never code; gitignored): food-data/raw/, or $FOOD_RAW
RAW = os.path.abspath(os.environ.get('FOOD_RAW') or os.path.join(ROOT, 'raw'))
SRC = os.path.join(ROOT, 'data_src')                # hand-authored / frozen source data
OUT = os.path.join(ROOT, 'out')                     # build output (gitignored); app/ copies it with npm run food:data
MEXT_XLSX = os.path.join(RAW, 'mext', 'main_2023_ch2.xlsx')

NUTS = ('kcal', 'p', 'f', 'c', 'salt')
# optional per 100 g, written only when known: fibre (MEXT 食物繊維総量) and alcohol (drinks only: tidy)
EXTRA = ('fib', 'alc')
ALL_NUTS = NUTS + EXTRA
CATS = ('主食', '麺', '丼・定食', '主菜', '副菜', '汁物', '寿司', 'パン', '肉', '魚介', '卵', '大豆・豆', '野菜', '果物',
        'きのこ', '海藻', '乳製品', '菓子・デザート', '飲料', '酒', '調味料', '油脂', 'ナッツ・種', 'いも', 'コンビニ',
        '外食', 'その他')
META_KEYS = ('source', 'label', 'attribution', 'license', 'url')
ITEM_KEYS = {'id', 'name', 'full', 'en', 'aliases', 'cat', 'kcal', 'p', 'f', 'c', 'salt', 'fib', 'alc', 'portions', 'jan',
             'brand', 'note', 'pop', 'vg', 'st'}


# ---------------------------------------------------------------- numbers
def r1(x):
    """One decimal, round-half-up (the +1e-9 absorbs binary noise such as 0.15 -> 0.1499999)."""
    return None if x is None else round(x + 1e-9, 1)


def kcal_int(x):
    """Integer kcal, round-half-up."""
    return None if x is None else int(math.floor(x + 0.5 + 1e-9))


def fnum(x, default=None):
    """Lenient float for CSV cells ('1,234', '', None -> default)."""
    try:
        v = float(str(x).replace(',', '').strip())
    except (TypeError, ValueError):
        return default
    return v if math.isfinite(v) else default


# ---------------------------------------------------------------- text
def kata2hira(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


KATA_ONLY = re.compile(r'[ァ-ヶー・]+')


# ---------------------------------------------------------------- xlsx (stdlib reader)
_M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
_R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def _si_text(si):
    """Text of a shared/inline string: plain <t> plus rich-text runs <r><t>; <rPh> furigana runs are skipped."""
    out = []
    for child in si:
        if child.tag == _M + 't':
            out.append(child.text or '')
        elif child.tag == _M + 'r':
            out.extend(t.text or '' for t in child.findall(_M + 't'))
    return ''.join(out)


def _col(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def xlsx_rows(path, sheet):
    """{row number: {0-based column: text}} for the named sheet. Newlines/tabs become spaces."""
    with zipfile.ZipFile(path) as z:
        ss = [_si_text(si) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(_M + 'si')]
        rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        rid = next(s.get(_R + 'id') for s in ET.fromstring(z.read('xl/workbook.xml')).find(_M + 'sheets')
                   if s.get('name') == sheet)
        root = ET.fromstring(z.read('xl/' + rels[rid].lstrip('/').removeprefix('xl/')))
    rows = {}
    for row in root.iter(_M + 'row'):
        vals = {}
        for c in row.findall(_M + 'c'):
            v = c.find(_M + 'v')
            val = '' if v is None else ss[int(v.text)] if c.get('t') == 's' else v.text or ''
            vals[_col(c.get('r'))] = re.sub(r'[\r\n\t]', ' ', val)
        rows[int(row.get('r'))] = vals
    return rows


# ---------------------------------------------------------------- MEXT 八訂増補2023 (sheet 表全体)
MEXT_CODES = {'ENERC_KCAL': 'kcal', 'PROT-': 'p', 'FAT-': 'f', 'CHOCDF-': 'c', 'NACL_EQ': 'salt', 'FIB-': 'fib', 'ALC': 'alc'}


def mext_num(s):
    """MEXT cell -> float. Markers: 'Tr'/'(Tr)' -> 0, '(1.2)' (estimated) -> 1.2, '-'/'' -> None; a footnote mark
    ('14.0†': 還元水あめ's fibre, by another method) is dropped."""
    s = s.strip().rstrip('†')
    if s in ('', '-'):
        return None
    return 0.0 if s in ('Tr', '(Tr)') else float(s.strip('()'))


def mext_rows(path=MEXT_XLSX):
    """Raw MEXT rows: dicts with group/id/idx/name/note + every INFOODS code of header row 12 (strings)."""
    rows = xlsx_rows(path, '表全体')
    code_col = {}
    for ci, v in sorted(rows[12].items()):
        v = v.strip()
        if v and re.fullmatch(r'[A-Z][A-Z0-9_\-]*', v) and v not in code_col:
            code_col[v] = ci
    missing = set(MEXT_CODES) - set(code_col)
    if missing:
        raise SystemExit('MEXT header row 12: missing %s' % sorted(missing))
    note_col = max(ci for ci, v in rows[2].items() if '備' in v)
    out = []
    for rn in sorted(rows):
        r = rows[rn]
        fid = r.get(1, '').strip()
        if rn < 13 or not re.fullmatch(r'\d{5}', fid):
            continue
        d = {'group': r.get(0, '').strip(), 'id': fid, 'idx': r.get(2, '').strip(), 'name': r.get(3, ''),
             'note': r.get(note_col, '').strip()}
        for code, ci in code_col.items():
            d[code] = r.get(ci, '').strip()
        out.append(d)
    return out


def mext_foods(rows):
    """{食品番号: {name, kcal, p, f, c, salt, fib, alc}} with parsed numbers (for recipe sums)."""
    out = {}
    for r in rows:
        rec = {'name': re.sub(r'\s+', ' ', r['name'].replace('　', ' ')).strip()}
        for code, k in MEXT_CODES.items():
            rec[k] = mext_num(r[code])
        out[r['id']] = rec
    return out


# ---------------------------------------------------------------- CSV + data_src loaders
def read_csv(path, rows=False):
    """utf-8 (BOM) or cp932 CSV -> list of dicts (or lists with rows=True)."""
    with open(path, 'rb') as f:
        b = f.read()
    try:
        t = b.decode('utf-8-sig')
    except UnicodeDecodeError:
        t = b.decode('cp932')
    f = io.StringIO(t, newline='')
    return list(csv.reader(f)) if rows else list(csv.DictReader(f))


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def load_popular(section):
    """data_src/popular.json: {"dishes": {"3": [names], "2": [...]}} -> {name: pop}."""
    t = load_json(os.path.join(SRC, 'popular.json')).get(section, {})
    return {name: int(pop) for pop, names in t.items() for name in names}


def load_cook_gain():
    """raw MEXT id -> extra weight factor gained when boiled/cooked/rehydrated (MEXT 表12; gains only)."""
    gain = {}
    for x in load_json(os.path.join(SRC, 'mext_weight_change.json'))['items']:
        if x.get('raw_id') and x['rate'] > 100 and x['method'] in ('ゆで', '炊き', '水戻し', '水煮'):
            gain[x['raw_id']] = max(gain.get(x['raw_id'], 0), x['rate'] / 100.0 - 1)
    return gain


# ---------------------------------------------------------------- recipe helpers
SOUP_WORDS = ('汁', 'スープ', 'ポトフ', '吸い', 'ポタージュ', 'シチュー', 'ちゃんこ', '鍋', '雑煮', 'けんちん', 'すいとん',
              'ほうとう', 'おでん', '椀', 'チャウダー', 'ミネストローネ', 'チゲ')
# (substring of an ingredient name, extra weight factor gained by cooking/rehydration); MEXT 表12 重量変化率
DRY_EXTRA = [('押麦', 1.8), ('マカロニ', 1.2), ('スパゲッティ', 1.2), ('ひじき', 8.9), ('乾ししいたけ', 4.7),
             ('干ししいたけ', 4.7), ('かんぴょう', 4.3), ('切干', 4.6), ('切り干', 4.6), ('はるさめ', 3.1), ('春雨', 3.1),
             ('凍り豆腐', 3.3), ('高野豆腐', 3.3), ('カットわかめ', 9.0), ('乾燥わかめ', 4.9), ('干しそば', 1.6),
             ('干しうどん', 1.4), ('そうめん', 1.7), ('ひやむぎ', 1.7)]


def _has(n, words):
    return any(k in n for k in words)


def cat_guess(n):
    """Category of a dish from its Japanese name (recipe/school-lunch sources)."""
    if 'ゼリーフライ' in n:                       # 行田/熊谷 local おから croquette, not a jelly
        return '副菜'
    n = n.replace('ちりめん', '縮緬').replace('ずしょう', 'ず醤')   # ちりめんじゃこ is not 麺, ゆずしょうゆ not 寿司
    if _has(n, ('寿司', 'すし', 'ずし', '鮨', '巻き寿司', '太巻', '細巻', '鉄火巻', 'かっぱ巻')) and \
            not _has(n, ('春巻', '巻き揚げ', '昆布巻', 'こぶ巻', '伊達巻', '卵巻')):
        return '寿司'
    if _has(n, ('丼', 'どんぶり', 'カレーライス', 'ハヤシ', 'オムライス')):
        return '丼・定食'
    if _has(n, ('そば', 'うどん', 'ラーメン', 'めん', '麺', 'パスタ', 'スパゲ', 'マカロニ', 'ほうとう', 'そうめん', 'ちゃんぽん',
                '焼きそば', 'ビーフン', '冷麦', 'きしめん')):
        return '麺'
    if '回鍋' not in n and _has(n, SOUP_WORDS):
        return '汁物'
    if _has(n, ('肉団子', '肉だんご', 'ミートボール', 'つみれ', '魚団子', 'ぎょうざ', '餃子', 'しゅうまい', '焼売', 'シュウマイ', '春巻',
                'フライ', 'コロッケ', '天ぷら', 'かき揚', 'カツ', '唐揚', 'からあげ')):
        return '主菜'
    if re.match(r'^(給食用)?(ベビー|プロセス|スライス)?チーズ([0-9０-９鉄（(].*)?$', n) or 'ヨーグルト' in n:
        return '乳製品'
    if not _has(n, ('煮', 'すき焼', 'サラダ', '和え', 'あえ')) and _has(n, ('チョコ', 'マドレーヌ', 'ガトー', 'デニッシュ', 'ペストリー',
                                                                       '五家宝', 'ドーナツ', 'ワッフル', 'クレープ', 'ババロア',
                                                                       '餅', 'もち', 'だんご', '団子', '饅頭', 'まんじゅう', '羊羹', 'ようかん', 'ゼリー', 'プリン', 'ケーキ', 'おはぎ', 'ぼたもち',
                'せんべい', '煎餅', '菓子', 'かりんとう', '飴', 'わらび', 'ういろう', 'きんとん', 'しるこ', 'ぜんざい', 'クッキー', 'タルト',
                'カステラ', 'もなか', '大福', 'まき', 'ちまき', 'おこし', 'フルーツ', 'ポンチ', 'ムース', '寒天')):
        return '菓子・デザート'
    if _has(n, ('ご飯', 'ごはん', 'めし', '飯', 'おこわ', '赤飯', '雑炊', 'かゆ', '粥', 'ライス', 'ピラフ', 'チャーハン', 'おにぎり',
                'むすび', 'パエリア')):
        return '主食'
    if _has(n, ('パン', 'サンド', 'トースト', 'ピザ', 'クロワッサン')):
        return 'パン'
    if _has(n, ('和え', 'あえ', 'サラダ')):   # ツナサラダ, いかの酢味噌和え: still a side dish
        return '副菜'
    if _has(n, ('漬', 'なます', 'おひたし', 'お浸し', '浸し', '酢の物', 'きんぴら', 'ナムル', 'ソテー', '煮豆', 'ひじき', '切干',
                '炒め物')) and not _has(n, ('肉', '魚', 'さば', 'いわし', 'さんま', '鶏', '豚', '牛', 'ぶり', 'ブリ',
                                                        'さけ', '鮭', 'サケ', 'サバ', 'あじ', 'アジ', 'まぐろ', 'たら',
                                                        'さわら', 'いか', 'イカ', 'えび', 'エビ', 'ツナ')):
        return '副菜'
    return '主菜'


def split_portion(name):
    """'焼き餃子（5個）' -> ('焼き餃子', '5個'); non-quantity parentheticals are kept in the name."""
    m = re.match(r'^(.*)（([^（）]*)）$', name)
    if m and re.search(r'[0-9０-９１-９]|杯|個|枚|本|切れ|尾|匹|皿|人前', m.group(2)):
        return m.group(1).strip(), m.group(2).strip()
    return name, None


def per100(parts, foods):
    """parts = [(食品番号 | 'water', grams)] -> ({nutrient: value per 100 g}, total grams), fibre and alcohol too.
    A nutrient is None only when every non-water ingredient lacks it; otherwise missing values count as 0."""
    total = sum(g for _, g in parts)
    out = {}
    for n in ALL_NUTS:
        vals = [(foods[fid].get(n), g) for fid, g in parts if fid != 'water']
        if vals and all(v is None for v, _ in vals):
            out[n] = None
        else:
            out[n] = sum((v or 0.0) * g for v, g in vals) / total if total else None
    return out, total


def nutrients(per):
    """Rounded item fields from a per-100 g dict: the five always (None: unknown), fibre and alcohol only when known."""
    out = {n: kcal_int(per[n]) if n == 'kcal' else r1(per[n]) for n in NUTS}
    out.update({n: r1(per[n]) for n in EXTRA if per.get(n) is not None})
    return out


# ---------------------------------------------------------------- aliases (Wikidata CC0 / Wikipedia readings)
_JP = re.compile(r'^[ぁ-ゖァ-ヺー・々〆一-龥]+$')
_KANA = re.compile(r'^[ぁ-ゖァ-ヺー・ ]+$')
MAX_ALIAS_ADD = 8


class Aliases:
    """Exact-label matches only (alt-label matches often point to a broader concept, e.g. 白和え -> 和え物)."""

    def __init__(self):
        self.wd = load_json(os.path.join(SRC, 'aliases_wikidata.json'))['names']
        self.wp = load_json(os.path.join(SRC, 'aliases_wikipedia.json'))['names']

    def candidates(self, name):
        out = []
        rec = self.wd.get(name)
        if rec and rec.get('label') == name:
            for r in rec.get('reading', []):
                out += [r, kata2hira(r)]
            for a in rec.get('aliases', []):
                if len(a) <= len(name) + 1 and _JP.match(a) and not re.search(r'流し|打ち|風$', a):
                    out.append(a)
            en = rec.get('en')
            if en and re.fullmatch(r"[A-Za-zāēīōūĀĒĪŌŪ' \-]{2,30}", en):
                out.append(en.lower())
        w = self.wp.get(name)
        if w and w.get('reading') and _KANA.match(w['reading']):
            out += [w['reading'], kata2hira(w['reading'])]
        res = []
        for c in out:
            c = c.strip()
            if c and c != name and c not in res:
                res.append(c)
        return res

    def enrich(self, item):
        """Append up to MAX_ALIAS_ADD readings / short variants / romanized names for the base name."""
        base = re.sub(r'[（(][^）)]*[）)]', '', item.get('name', '')).strip()
        cands = self.candidates(base)
        if cands:
            al = item.get('aliases') or []
            have = set(al) | {item.get('name'), item.get('full'), (item.get('en') or '').lower()}
            add = [c for c in cands[:MAX_ALIAS_ADD] if c not in have]
            if add:
                item['aliases'] = al + add


DRINK_CATS = ('酒',)


def tidy(item):
    """Drop aliases equal to the name, duplicate aliases and empty alias lists; alcohol off anything but a drink (a
    dish's or a seasoning's みりん or 料理酒 mostly cooks off, and would read as drinking: docs/food-data.md)."""
    if item.get('cat') not in DRINK_CATS:
        item.pop('alc', None)
    if 'aliases' in item:
        seen, al = {item['name']}, []
        for a in item['aliases']:
            if a and a not in seen:
                seen.add(a)
                al.append(a)
        if al:
            item['aliases'] = al
        else:
            del item['aliases']
    return item


# ---------------------------------------------------------------- schema validation
def validate(doc, kind='dataset'):
    """Errors (list of str) for a dataset doc ({source,label,attribution,license,url,items}) or a jan shard."""
    errs = []
    if kind == 'shard':
        for code, it in doc.items():
            if not re.fullmatch(r'\d{8}|\d{13}', code) or it.get('jan') != code:
                errs.append('bad shard key %s' % code)
            errs += _item_errors(it, 'off')
        return errs
    for k in META_KEYS:
        if not isinstance(doc.get(k), str) or not doc[k]:
            errs.append('missing ' + k)
    ids = set()
    for it in doc.get('items', []):
        if it.get('id') in ids:
            errs.append('dup id %s' % it.get('id'))
        ids.add(it.get('id'))
        errs += _item_errors(it, doc.get('source'))
    if not doc.get('items'):
        errs.append('no items')
    return errs


def _item_errors(it, source):
    e = []
    iid = it.get('id')
    if not isinstance(iid, str) or not iid.startswith('%s:' % source):
        e.append('bad id prefix %s' % iid)
    extra = set(it) - ITEM_KEYS
    if extra:
        e.append('%s: unknown keys %s' % (iid, sorted(extra)))
    if not isinstance(it.get('name'), str) or not it['name']:
        e.append('%s: no name' % iid)
    if it.get('cat') not in CATS:
        e.append('%s: bad cat %s' % (iid, it.get('cat')))
    if not isinstance(it.get('kcal'), int) or isinstance(it.get('kcal'), bool) or it['kcal'] < 0:
        e.append('%s: kcal not a non-negative int' % iid)
    for k in ('p', 'f', 'c', 'salt'):
        v = it.get(k, 'missing')
        if v is not None and (isinstance(v, bool) or not isinstance(v, (int, float)) or v < 0):
            e.append('%s: bad %s' % (iid, k))
    for k in EXTRA:   # optional: absent when unknown, else 0-100 g per 100 g (the app's snapshot limits)
        v = it.get(k)
        if k in it and (isinstance(v, bool) or not isinstance(v, (int, float)) or not 0 <= v <= 100):
            e.append('%s: bad %s' % (iid, k))
    if 'alc' in it and it.get('cat') not in DRINK_CATS:
        e.append('%s: alc on a non-drink' % iid)
    al = it.get('aliases')
    if al is not None and (not isinstance(al, list) or not al or not all(isinstance(a, str) and a for a in al)
                           or it.get('name') in al):
        e.append('%s: bad aliases' % iid)
    por = it.get('portions')
    if por is not None and (not isinstance(por, list) or not por):
        e.append('%s: empty portions' % iid)
    for p in por or []:
        if not (isinstance(p, dict) and isinstance(p.get('label'), str) and p['label']
                and isinstance(p.get('g'), (int, float)) and p['g'] > 0):
            e.append('%s: bad portion %r' % (iid, p))
    if 'pop' in it and it['pop'] not in (1, 2, 3):
        e.append('%s: bad pop' % iid)
    if 'jan' in it and not re.fullmatch(r'\d{8}|\d{13}', str(it['jan'])):
        e.append('%s: bad jan' % iid)
    return e


# ---------------------------------------------------------------- JSON writing
def dumps(obj):
    """Compact, UTF-8, deterministic (insertion order of the builders; maps keyed by id are pre-sorted)."""
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n'


def write_json(path, obj):
    """Atomic write (temp file + os.replace) so readers never see a half-written file."""
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as f:
        f.write(dumps(obj))
    os.replace(tmp, path)


# ---------------------------------------------------------------- barcodes
def norm_jan(code):
    """Canonical barcode key: EAN-13/JAN (13 digits) or EAN-8. 12-digit UPC-A is zero-padded to 13 and a
    14-digit GTIN with a leading 0 is trimmed to 13. Anything else (UPC-E, GTIN-14 packs, a wrong GS1 check digit,
    junk) -> None."""
    code = str(code or '').strip()
    if not code.isdigit():
        return None
    if len(code) == 12:
        code = '0' + code
    elif len(code) == 14 and code.startswith('0'):
        code = code[1:]
    if len(code) not in (8, 13):
        return None
    total = sum(int(d) * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(code[:-1])))
    return code if (10 - total % 10) % 10 == int(code[-1]) else None   # GS1 check digit, as core/jan.js


def shard_key(code):
    """Barcode shard file name: last 3 digits (near-uniform; unchanged by UPC-A zero padding)."""
    return code[-3:]


# ---------------------------------------------------------------- cross-source grouping (verify.json)
_REPL = [('味噌', 'みそ'), ('玉子', '卵'), ('茄子', 'なす'), ('人参', 'にんじん'), ('葱', 'ねぎ'), ('南瓜', 'かぼちゃ'),
         ('牛蒡', 'ごぼう'), ('蒟蒻', 'こんにゃく'), ('竹輪', 'ちくわ'), ('胡麻', 'ごま'), ('唐揚げ', 'から揚げ'),
         ('唐揚', 'から揚げ'), ('焼き', '焼'), ('揚げ', '揚'), ('和え', '和'), ('漬け', '漬'), ('炒め', '炒'),
         ('煮付け', '煮つけ'), ('麻婆', 'まーぼー'), ('餃子', 'ぎょうざ'), ('焼売', 'しゅうまい'), ('焼賣', 'しゅうまい'),
         ('饂飩', 'うどん'), ('蕎麦', 'そば'), ('鮭', 'さけ'), ('鯖', 'さば'), ('鰤', 'ぶり'), ('鰯', 'いわし'),
         ('烏賊', 'いか'), ('海老', 'えび'), ('蛸', 'たこ'), ('豆腐', 'とうふ'), ('御飯', 'ごはん'), ('ご飯', 'ごはん'),
         ('鶏肉', 'とり'), ('鶏', 'とり'), ('若鶏', 'とり'), ('ほうれん草', 'ほうれんそう'), ('大根', 'だいこん'),
         ('白菜', 'はくさい'), ('ハンバーグステーキ', 'ハンバーグ')]
_REPL = [(unicodedata.normalize('NFKC', a).lower(), b) for a, b in _REPL]
_BRACKETS = re.compile(r'[（(［\[【〈「『]([^）)\]］】〉」』]*)[）)\]］】〉」』]')
_KEEP = re.compile(r'のみ|なし|冷凍|揚げる前|粉末|乾|ルウ|生地')
_JUNK = re.compile(r'[\s・･、,.。~〜\-－ー―_＿/／!！?？☆★◎○●◇◆♪①-⑳⑴-⒇0-9０-９]+')


def name_key(s):
    """Normalised dish key: NFKC, lower, kana/kanji variants unified, qualifiers in brackets dropped unless they
    change the food (ルウのみ, ごはんなし, 冷凍, 乾 ...), digits+units and punctuation removed, katakana -> hiragana."""
    s = unicodedata.normalize('NFKC', s or '').lower()
    s = _BRACKETS.sub(lambda m: m.group(0) if _KEEP.search(m.group(1)) else '', s)
    s = re.sub(r'\d+\s*(cc|ml|g|個|本|切|枚|杯)', '', s)
    for a, b in _REPL:
        s = s.replace(a, b)
    return _JUNK.sub('', kata2hira(s)).replace('ー', '')


def agree(n, v, ref):
    """Per-100 g agreement: kcal ±max(15 %, 10 kcal); salt ±max(30 %, 0.3 g); p/f/c ±max(25 %, 2 g)."""
    if v is None or ref is None:
        return None
    d = abs(v - ref)
    if n == 'kcal':
        return d <= max(0.15 * ref, 10)
    if n == 'salt':
        return d <= max(0.30 * ref, 0.3)
    return d <= max(0.25 * ref, 2.0)


def group_by_name(entries, anchors):
    """entries = [(source, item)]. Items with the same name_key form a group; a key equal to an alias of exactly
    one group whose members include an `anchors` source joins that group (aliases with brackets, or whose key is
    part of the anchor's own key, are ignored). Returns lists of entry indices, sorted."""
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    keys = [name_key(it['name']) for _, it in entries]
    for k in keys:
        find(k)
    alias_roots = {}
    for (src, it), k in zip(entries, keys):
        if src in anchors:
            for a in it.get('aliases') or []:
                ak = name_key(a)
                # 「親子丼（海鮮）」 or a broader term (キャラメル for キャラメルラテ) names a different food
                if not _BRACKETS.search(a) and ak and not (ak != k and ak in k):
                    alias_roots.setdefault(ak, set()).add(find(k))
    for k in sorted(set(keys)):
        roots = alias_roots.get(k)
        if roots and len(roots) == 1:
            r = find(next(iter(roots)))
            if r != find(k):
                parent[find(k)] = r
    groups = {}
    for i, k in enumerate(keys):
        groups.setdefault(find(k), []).append(i)
    return [groups[r] for r in sorted(groups)]
