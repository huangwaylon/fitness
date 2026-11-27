#!/usr/bin/env python3
"""ごはん's generated food pictures (docs/food-data.md "Pictures"): one picture per visual concept (a table row, `key`),
drawn by Z-Image-Turbo from a hand-written description, checked by Claude against vetted reference photos, packed into sprite
sheets in app/static/food-img/.

  python3 -I food-data/images/fi.py propose <phase>      # draft rows for a phase's items -> $RAW/work/propose-<phase>.json
  python3 -I food-data/images/fi.py refs [keys]          # candidate reference photos per row (Commons, Wikidata, Wikipedia, MAFF)
  python3 -I food-data/images/fi.py refsheet <out> keys  # a contact sheet of rows' candidates, to vet them by eye
  python3 -I food-data/images/fi.py vet <json>           # record the vetting: [{key, ok: [n, ...], why?}] -> the rows' refs
  <mflux python> food-data/images/fi.py gen [keys]       # generate what is due (a fixed seed per key and roll), cached
  <PIL python> food-data/images/fi.py checksheets <out> [keys]  # every generated image beside its refs, for the Claude check
  python3 -I food-data/images/fi.py claude <json>        # log the check's verdicts (claude2: a second opinion, it wins)
  python3 -I food-data/images/fi.py status               # per row: refs, rolls, verdicts, shipped
  python3 -I food-data/images/fi.py pack                 # paper-even, webp, sheets + index.json into app/static/food-img/
  python3 -I food-data/images/fi.py split <lines> <dest>  # items that look different get their own row (or join another's)

Committed here: the table (table/*.json: rows {key, ja, desc, items, refs, vet, why}; a row without items, `cat` instead, is
a products-only subcategory picture), the product rules (products.txt, pmatch.py: a product's picture from its name,
brand and Open Food Facts tags; pack reads the tags from $FOOD_RAW/off), the verdict log (verdicts.jsonl) and the slots (slots.json: a key's sheet cell, append-only so a shipped sheet
never changes). Everything else (reference
photos, generated images, sheets for review) lives in $FOOD_IMG_RAW (default ~/food-images-raw), never in the repo:
reference photos are look-only. Downloads are untrusted: nothing is run from them. Python with PIL (pack, sheets) and
the mflux tool's Python (gen) are the only non-stdlib parts.

gen: PROMPT / PROMPT_V with the row's desc, seed crc32(key) % 100000 + roll, STEPS steps at GEN_PX (~15-50 s an image
on a shared GPU), cached in $FOOD_IMG_RAW/gen/ (a re-run skips what exists: resumable). A failed check re-rolls at most
MAX_ROLL times; the wrong food (fallback) is the tile, rolls spent on flaws ship the last (a near miss). pack: the background evened to PAPER (a per-channel gain from the
border's median), webp sheets: thumbnails T_COLS x T_COLS cells of T_PX (q T_QUALITY) per search neighbourhood
(FAMILY, else the category), details D_COLS x D_COLS of D_PX (q QUALITY) per category, popular items first; a product
uses its picture's cell in its own neighbourhood, else a cell in a product sheet (p-*); names carry the content hash.
"""
import binascii, hashlib, io, json, os, re, subprocess, sys, threading, time, unicodedata, urllib.parse, zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # pmatch (python -I leaves the script's own folder off the path)
sys.path.insert(1, str(HERE.parent / 'scripts'))
from lib import shipped_items  # noqa: E402  (a shipped file's items: by column)
REPO = HERE.parents[1]
APP_FOOD = REPO / 'app' / 'static' / 'food'
OUT = REPO / 'app' / 'static' / 'food-img'
SRC = REPO / 'food-data' / 'data_src'
RAW = Path(os.environ.get('FOOD_IMG_RAW', '~/food-images-raw')).expanduser()
MAIN = Path(os.environ.get('FOOD_MAIN', '/Users/waylonhuang/Documents/other/fitness'))  # the main checkout's raw/ (MAFF photos)
VERDICTS = Path(os.environ.get('FI_VERDICTS', HERE / 'verdicts.jsonl'))  # FI_VERDICTS: one file per machine (merged after), or a scratch copy
SLOTS = HERE / 'slots.json'
UA = 'island-fund-food-refs/1.1 (https://github.com/huangwaylon/fitness; look-only reference photos for a private app) curl/8'  # with a contact: Wikimedia throttles anonymous UAs hard

# The prompt (style "cw": coloured pencil and watercolour on the app's paper). Changing it changes every image: bump
# PROMPT_V, which is part of the seed's cache path and of every verdict.
PROMPT_V = 1
PROMPT = ("A hand-drawn illustration in coloured pencil and soft watercolour of {desc}. Seen in three-quarter view from "
          "about 45 degrees above, the food fills the middle of the picture with a little margin, clean confident outlines "
          "in warm brown pencil, soft watercolour washes, true-to-life food colours, a soft warm shadow underneath. The whole "
          "background is flat plain warm beige kraft paper, colour #F5E4BC, with nothing else in frame: no table, no cloth, "
          "no chopsticks, no garnish that is not described, no text, no border.")
GEN_PX, STEPS, MAX_ROLL = 512, 9, 2
# The weights' quantisation: 4 since 2026-11-06 (half the memory, faster on the shared GPU, the same look in a probe);
# the first ~260 images were q8. Each image's settings are in its sidecar (<png>.json).
QUANT = int(os.environ.get('FI_QUANT', 4))
# The checks gate shipping only when asked (FI_CHECKS=1: an unchecked row waits for its check, else ships unchecked).
CHECKS = os.environ.get('FI_CHECKS') == '1'


def seed(key, roll):
    return zlib.crc32(key.encode()) % 100000 + roll


def gen_path(row, roll):
    """A row's generated image: its key, its description's hash (a new description is a new image) and the roll."""
    return RAW / 'gen' / f'v{PROMPT_V}' / f'{row["key"]}-{desc_hash(row)}-r{roll}.png'


# ---------- data

def datasets():
    idx = json.loads((APP_FOOD / 'index.json').read_text())
    for d in idx['datasets']:
        if d.get('lazy'):
            continue  # packaged products: category tiles only
        yield d['file'], shipped_items(json.loads((APP_FOOD / d['file']).read_text()))


def items_by_id():
    return {it['id']: it for _, its in datasets() for it in its}


def table():
    rows = []
    for p in sorted((HERE / 'table').glob('*.json')):
        for r in json.loads(p.read_text()):
            r['_file'] = p.name
            rows.append(r)
    return rows


def verdicts():
    """key -> list of verdict records (in log order)."""
    out = {}
    if VERDICTS.exists():
        for line in VERDICTS.read_text().splitlines():
            if line.strip():
                v = json.loads(line)
                out.setdefault(v['key'], []).append(v)
    return out


def log_verdict(rec):
    with VERDICTS.open('a') as f:
        f.write(json.dumps(rec, ensure_ascii=False, sort_keys=True) + '\n')


def desc_hash(row):
    return hashlib.sha256(f'{PROMPT_V}\0{row["desc"]}'.encode()).hexdigest()[:10]


def verdict_at(mine, roll):
    """The verdict on a roll: the second opinion's (claude2) if it has one, else the first check's (claude); None if
    neither has looked."""
    for check in ('claude2', 'claude'):
        v = [x for x in mine if x['roll'] == roll and x['check'] == check]
        if v:
            return v[-1]
    return None


def state(row, vs):
    """A row's pipeline state: ('gen', roll) to generate, ('check', roll) for a Claude check (only with FI_CHECKS=1:
    otherwise an unchecked row ships, index `checked: false`, the user 2026-11-06), ('ship', roll), or ('tile', why).
    A roll's verdict (verdict_at): pass ships it; reroll draws the next roll (at most MAX_ROLL re-rolls); fallback (the
    wrong food) is the tile. Rolls spent on rerolls only (the right food with a flaw: a cut, peel, shape) ship the last
    roll, a near miss (the user 2026-11-27: a recognisable picture beats the tile). Only verdicts on the row's current
    description count."""
    h = desc_hash(row)
    mine = [v for v in vs.get(row['key'], []) if v.get('h') == h]
    roll = 0
    while True:
        v = verdict_at(mine, roll)
        if v is None:
            if not gen_path(row, roll).exists():
                return ('gen', roll)
            return ('check', roll) if CHECKS else ('ship', roll)
        if v['verdict'] == 'pass':
            return ('ship', roll)
        if v['verdict'] == 'fallback':
            return ('tile', f'roll {roll}: {v.get("why", "")}'[:120])
        if roll >= MAX_ROLL:
            return ('ship', roll)  # a near miss
        roll += 1


def near_miss(row, vs):
    """Whether a shipped row ships a near miss (its last roll's verdict a reroll, rolls spent)."""
    st, roll = state(row, vs)
    h = desc_hash(row)
    v = verdict_at([v for v in vs.get(row['key'], []) if v.get('h') == h], roll) if st == 'ship' else None
    return bool(v) and v['verdict'] == 'reroll'


def checked(row, vs):
    """Whether a shipped row passed a check (else it ships unchecked)."""
    st, roll = state(row, vs)
    h = desc_hash(row)
    return st == 'ship' and verdict_at([v for v in vs.get(row['key'], []) if v.get('h') == h], roll) is not None


def vetted_refs(row):
    return [r for r in row.get('refs', []) if r.get('ok')]


# ---------- propose: draft rows for a phase

SIZE_Q = re.compile(r'^(小盛|並盛|大盛|特盛|並|大|小|中|ミニ|ハーフ|[SMLsml]サイズ|1人前|店|外食|自家製|居酒屋|定食屋|洋食|グラス|'
                    r'ファストフード|ペットボトル|紙パック|缶|小皿|[\d.]+(個|本|枚|切れ|貫|尾|皿|杯|人前|合|玉|ピース|袋|片|種|品|g))$')


def _hira(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def vnorm(name):
    """A name's visual key: size and count qualifiers, look-alike MEXT variants and punctuation dropped."""
    s = unicodedata.normalize('NFKC', name)

    def br(m):
        parts = [p for p in re.split(r'[・、 ]', m.group(1)) if p]
        return '' if parts and all(SIZE_Q.match(p) for p in parts) else m.group(0)
    s = re.sub(r'\(([^()]*)\)', br, s)
    for a, b in (('脂身つき', ''), ('脂身なし', ''), ('皮下脂肪なし', ''), ('和牛', '牛'), ('国産牛', '牛'), ('輸入牛', '牛'),
                 ('天然', ''), ('養殖', ''), ('(くろまぐろ)', ''), ('ー', '')):
        s = s.replace(a, b)
    s = re.sub(r'\(\s*\)', '', s)
    return _hira(re.sub(r'[\s・,、()（）]', '', s)).lower()


def phase_items(phase):
    """(id, item) of a phase, in a stable order. 1: popular MEXT, our dishes and eat-out, the obscure MEXT ingredients
    (named in table/*.json by id once chosen); 2: MAFF; 3: the school lunches and the rest of MEXT."""
    out = []
    for f, its in datasets():
        src = f.removesuffix('.json')
        for it in its:
            if phase == 1 and (src in ('dishes', 'eatout') or (src == 'foods' and it.get('pop'))):
                out.append(it)
            elif phase == 2 and src == 'extra_maff_kyodo':
                out.append(it)
            elif phase == 3 and src not in ('dishes', 'eatout', 'extra_maff_kyodo'):
                out.append(it)
    return out


def ingredients():
    """dish id -> [mext id, g] from the recipes (build-time only, never shipped)."""
    out = {}
    comps = json.loads((SRC / 'eatout' / '_components.json').read_text())['components']

    def expand(ing, k=1.0):
        for row in ing:
            a, g = row[0], row[1]
            if a.startswith('@'):
                if a[1:] in comps:
                    yield from expand(comps[a[1:]]['ing'], k * g)
            else:
                yield a, g * k
    for p in sorted((SRC / 'dishes').glob('[0-9]*.json')):
        for d in json.loads(p.read_text())['dishes']:
            out[f'dishes:{d["id"]}'] = list(expand(d['ing']))
    for p in sorted((SRC / 'eatout').glob('[0-9]*.json')):
        for d in json.loads(p.read_text())['items']:
            out[f'eatout:{d["key"]}'] = list(expand(d['ing']))
    return out


def cmd_propose(phase):
    phase = int(phase)
    have = {i for r in table() for i in r['items']}
    groups = {}
    for it in phase_items(phase):
        if it['id'] in have:
            continue
        groups.setdefault(vnorm(it['name']), []).append(it)
    ing = ingredients()
    byid = items_by_id()
    rows = []
    for k, its in groups.items():
        ids = [i['id'] for i in its]
        top = sorted(((g, a) for i in ids for a, g in ing.get(i, [])), reverse=True)
        names = []
        for g, a in top:
            n = byid.get(f'mext:{a}', {}).get('name', a)
            if n not in names:
                names.append(n)
        rows.append({'key': ids[0].replace(':', '-'), 'ja': its[0]['name'], 'en': its[0].get('en', ''),
                     'cat': its[0]['cat'], 'items': ids, 'names': sorted({i['name'] for i in its}),
                     'full': its[0].get('full', ''), 'ing': names[:8]})
    p = RAW / 'work' / f'propose-{phase}.json'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(rows, ensure_ascii=False, indent=0))
    print(f'{len(rows)} rows for {sum(len(r["items"]) for r in rows)} items -> {p}')


# ---------- references

# Wikimedia's API etiquette: our UA, a call started at most every API_GAP (maxlag), up to 50 ids / titles a call; a
# refusal (429 / 503 / maxlag) waits its Retry-After, else backs off. Answers are cached in $RAW/refs/_cache (a re-run
# asks nothing twice). Thumbnails come from upload.wikimedia.org (thumb.wikimedia.org, imageinfo's host since 2026-11,
# is blocked here: the same path is served by upload.), one started every DL_GAP: a thumbnail not in their cache is
# rendered, and they allow an address ~10 at once, then ~1 every 2 s (measured 2026-11-25).
API_GAP = float(os.environ.get('FI_API_GAP', 0.5))
DL_GAP = float(os.environ.get('FI_DL_GAP', 2.0))
DL_PAR, NCAND, MIN_FOUND, CHUNK = 4, 8, 4, 200  # thumbnails in flight; candidates a row (its `ncand` overrides); rows a pass
CACHE = RAW / 'refs' / '_cache'
_last_api, _api_lock, _last_dl, _dl_lock = [0.0], threading.Lock(), [0.0], threading.Lock()
API_PAR = 2  # list calls (one a category / search) in flight: at most one started every API_GAP


def _get(url, tries=5, binary=False):
    for t in range(tries):
        r = subprocess.run(['curl', '-sS', '-L', '-m', '40', '-A', UA, '-w', '\n%{http_code} %header{retry-after}', url], capture_output=True)
        body, _, tail = r.stdout.rpartition(b'\n')
        code, _, after = tail.decode(errors='replace').partition(' ')
        if code == '200' and body:
            if binary:
                return body
            j = json.loads(body)
            if j.get('error', {}).get('code') != 'maxlag':
                return j
        elif code.startswith('4') and code != '429':
            return None
        print(f'refs: {code or "no answer"}, waiting: {url[:100]}', file=sys.stderr, flush=True)
        time.sleep(min(60.0, float(after) if after.strip().isdigit() else 2.0 * 2 ** t))
    return None


def _pace(last, lock, gap):
    with lock:
        time.sleep(max(0.0, last[0] + gap - time.time()))
        last[0] = time.time()


def _api(host, **params):
    _pace(_last_api, _api_lock, API_GAP)
    return _get(f'https://{host}/w/api.php?' + urllib.parse.urlencode({'format': 'json', 'formatversion': 2, 'maxlag': 5, **params})) or {}


def _api_all(host, **params):
    """Every continuation of a query: the responses' `query` parts, in order."""
    cont = {}
    while True:
        j = _api(host, **params, **cont)
        yield j.get('query', {})
        if 'continue' not in j:
            return
        cont = j['continue']


def _resolved(q, asked):
    """asked title -> the title it resolved to (normalized, then redirects)."""
    m = {}
    for k in ('normalized', 'redirects'):
        for x in q.get(k, []):
            m[x['from']] = x['to']
    out = {}
    for t in asked:
        r = t
        for _ in range(3):
            r = m.get(r, r)
        out[t] = r
    return out


def thumb_url(u):
    return re.sub(r'^https://thumb\.wikimedia\.org/', 'https://upload.wikimedia.org/', u).split('?')[0]


class _Cache:
    """One JSON dict a kind (entities, pages-<host>, cats, search, imageinfo), saved after each pass."""
    def __init__(self, kind):
        self.p = CACHE / f'{kind}.json'
        self.d = json.loads(self.p.read_text()) if self.p.exists() else {}

    def missing(self, keys):
        return [k for k in dict.fromkeys(keys) if k not in self.d]

    def save(self):
        CACHE.mkdir(parents=True, exist_ok=True)
        tmp = self.p.with_suffix('.tmp')
        tmp.write_text(json.dumps(self.d, ensure_ascii=False))
        tmp.rename(self.p)


def _fill_entities(c, qids):
    """qid -> {p18, p373, jawiki, enwiki}."""
    want = c.missing(qids)
    for i in range(0, len(want), 50):
        part = want[i:i + 50]
        ents = _api('www.wikidata.org', action='wbgetentities', ids='|'.join(part), props='claims|sitelinks',
                    sitefilter='jawiki|enwiki', maxlag=60).get('entities')  # Wikidata's lag is its query service's: often > 5 s
        if ents is None:
            continue  # refused: asked again next run
        for q in part:
            e, cl = ents.get(q, {}), ents.get(q, {}).get('claims', {})
            val = lambda p, n: [x['mainsnak']['datavalue']['value'] for x in cl.get(p, [])[:n] if 'datavalue' in x['mainsnak']]
            c.d[q] = {'p18': val('P18', 2), 'p373': val('P373', 1),
                      **{s: e.get('sitelinks', {}).get(s, {}).get('title') for s in ('jawiki', 'enwiki')}}


def _fill_pages(c, host, titles):
    """title -> {img: its page image, ext: its lead (ja only), ims: its other files (the first 12 by name)}."""
    want = c.missing(titles)
    ja = host.startswith('ja')
    for i in range(0, len(want), 20):  # extracts: at most 20 pages a call
        part = want[i:i + 20]
        got, res = {}, {}
        params = dict(action='query', titles='|'.join(part), redirects=1, prop='pageimages|images' + ('|extracts' if ja else ''),
                      piprop='name', imlimit='max')
        if ja:
            params.update(exintro=1, explaintext=1, exsentences=3, exlimit=20)
        ok = False
        for q in _api_all(host, **params):
            ok = ok or bool(q)
            res.update(_resolved(q, part))
            for pg in q.get('pages', []):
                g = got.setdefault(pg['title'], {'img': None, 'ext': '', 'ims': []})
                g['img'] = g['img'] or pg.get('pageimage')
                g['ext'] = g['ext'] or pg.get('extract', '')[:400]
                g['ims'] += [im['title'] for im in pg.get('images', [])]
        if not ok:
            continue
        for t in part:
            g = got.get(res.get(t, t), {'img': None, 'ext': '', 'ims': []})
            c.d[t] = {**g, 'ims': sorted(set(g['ims']))[:12]}


def _fill_lists(c, keys, **params):
    """a category or a search -> its files' titles (list=categorymembers / search)."""
    from concurrent.futures import ThreadPoolExecutor
    ask = lambda k: _api('commons.wikimedia.org', action='query', **{kk: v.format(k) if isinstance(v, str) else v for kk, v in params.items()})
    want = c.missing(keys)
    with ThreadPoolExecutor(API_PAR) as pool:
        for k, q in zip(want, pool.map(ask, want)):
            if 'query' in q:
                c.d[k] = [m['title'] for m in q['query'].get(params['list'], [])]


def _fill_imageinfo(c, files):
    """Commons file title (underscored) -> [thumbnail url, description page] or None (not on Commons)."""
    want = c.missing(files)
    for i in range(0, len(want), 50):
        part = want[i:i + 50]
        q = _api('commons.wikimedia.org', action='query', prop='imageinfo', iiprop='url', iiurlwidth=330, titles='|'.join(part)).get('query')
        if q is None:
            continue
        res = _resolved(q, part)
        pages = {p['title']: p for p in q.get('pages', [])}
        for f in part:
            ii = (pages.get(res[f]) or {}).get('imageinfo', [{}])[0]
            c.d[f] = [thumb_url(ii['thumburl']), ii.get('descriptionurl', '')] if ii.get('thumburl') else None


def _row_files(row, qids, titles, searches, C):
    """A row's candidate files, best first: Wikidata's image, each page's lead image and other photos, the Commons
    category's photos, the Commons searches'; unique, at most NCAND."""
    files = [('wikidata', 'File:' + f) for q in qids for f in C['entities'].d.get(q, {}).get('p18', [])]
    for host, t in titles[:4]:
        pg = C['pages-' + host].d.get(t, {})
        wiki = host.split('.')[0] + 'wiki'
        if pg.get('img'):
            files.append((wiki, 'File:' + pg['img']))
        for ti in pg.get('ims', []):
            ti = ti.replace('ファイル:', 'File:')
            if re.search(r'\.(jpe?g|JPE?G)$', ti) and not re.search(r'(?i)map|logo|flag|icon|symbol|commons-', ti):
                files.append((wiki + '-page', ti))
    for cat in _row_cats(qids, C):
        files += [('commons-cat', m) for m in C['cats'].d.get(cat, []) if re.search(r'(?i)\.jpe?g$', m)][:6]
    for s in searches:
        files += [('commons-search', m) for m in C['search'].d.get(s, []) if re.search(r'(?i)\.jpe?g$', m)]
    seen, uniq = set(), []
    for o, f in files:
        f = f.replace(' ', '_')
        if f not in seen:
            seen.add(f)
            uniq.append((o, f))
    return uniq[:int(row.get('ncand', NCAND))]


def _searches(row, byid):
    """A row's Commons searches: its `search` hints, else its name, then (asked only while the rest found under
    MIN_FOUND photos) its English name (the first item's `en`, else the description's head when short: "Rice bran oil:
    clear pale ..." -> "Rice bran oil") and its name's first word (MEXT's "あけび 生" -> "あけび")."""
    if row.get('search'):
        return row['search']
    en = next((byid.get(i, {}).get('en') for i in row['items'] if byid.get(i, {}).get('en')), '')
    if not en:
        head = re.split(r'[:,]', row['desc'], maxsplit=1)[0]
        en = head if len(head.split()) <= 6 else ''
    en = re.sub(r'^(a|an|the) ', '', re.sub(r'\s*\(.*?\)', '', en).strip(), flags=re.I)
    base = re.split(r'[ 　（(]', row['ja'])[0]
    return list(dict.fromkeys([row['ja']] + [x for x in (en, base) if x]))


def _row_cats(qids, C):
    return [c for q in qids for c in C['entities'].d.get(q, {}).get('p373', [])]


def _row_titles(row, qids, titles, C):
    out = [('ja.wikipedia.org', t) for t in titles]
    for q in qids:
        e = C['entities'].d.get(q, {})
        for site, host in (('jawiki', 'ja.wikipedia.org'), ('enwiki', 'en.wikipedia.org')):
            if e.get(site):
                out.append((host, e[site]))
    return list(dict.fromkeys(out))


def _download(job):
    p, url = job
    _pace(_last_dl, _dl_lock, DL_GAP)
    b = _get(url, tries=6, binary=True)
    if b and b[:3] == b'\xff\xd8\xff':
        tmp = p.with_suffix('.part')
        tmp.write_bytes(b)
        tmp.rename(p)


def cmd_refs(keys=None):
    """Candidate photos per row -> $RAW/refs/<key>/c<n>.jpg + cand.json (resumable: a row with cand.json is done, unless
    its table hints changed). Rows go CHUNK at a pass: the API's answers for the pass's rows (batched), then their
    thumbnails (downloaded while the next pass asks the API), then their cand.json."""
    from concurrent.futures import ThreadPoolExecutor, wait
    names, wp = _wd_index()
    byid = items_by_id()
    C = {k: _Cache(k) for k in ('entities', 'pages-ja.wikipedia.org', 'pages-en.wikipedia.org', 'cats', 'search', 'imageinfo')}
    hint = lambda row: json.dumps([row.get('qid'), row.get('wiki'), row.get('search'), row.get('maff')], ensure_ascii=False)
    todo = []
    for row in table():
        meta = RAW / 'refs' / row['key'] / 'cand.json'
        if (not keys or row['key'] in keys) and not (meta.exists() and json.loads(meta.read_text()).get('hint') == hint(row)):
            todo.append(row)
    print(f'refs: {len(todo)} rows to fetch', flush=True)
    pool, pending, t0 = ThreadPoolExecutor(DL_PAR), None, time.time()

    def finish(batch, futs):
        wait(futs)
        for row, d, uniq, info, qids, titles, extract in batch:
            if any(f not in info for _, f in uniq) or any(q not in C['entities'].d for q in qids):
                print(row['key'], 'refused: next run', flush=True)
                continue
            cand = [{'n': n, 'origin': o, 'file': f, 'page': info[f][1]} for n, (o, f) in enumerate(uniq)
                    if info.get(f) and (d / f'c{n}.jpg').exists()]
            for n, m in enumerate(row.get('maff', []), start=100):  # MAFF うちの郷土料理 photos (the main checkout's raw/, look-only)
                src = MAIN / 'food-data' / 'raw' / 'maff_photos' / f'{m}.jpg'
                if src.exists():
                    (d / f'c{n}.jpg').write_bytes(src.read_bytes())
                    cand.append({'n': n, 'origin': 'maff', 'file': m, 'page': f'maff:{m}'})
            (d / 'cand.json').write_text(json.dumps({'hint': hint(row), 'qids': qids, 'titles': titles, 'extract': extract, 'cand': cand},
                                                    ensure_ascii=False, indent=1))
            print(row['key'], row['ja'], len(cand), 'candidates', flush=True)

    for i in range(0, len(todo), CHUNK):
        rows = todo[i:i + CHUNK]
        look = [_lookups(r, names, wp, byid) for r in rows]
        _fill_entities(C['entities'], [q for qs, _ in look for q in qs])
        tl = [_row_titles(r, qs, ts, C) for r, (qs, ts) in zip(rows, look)]
        for host in ('ja.wikipedia.org', 'en.wikipedia.org'):
            _fill_pages(C['pages-' + host], host, [t for ts in tl for h, t in ts[:4] if h == host])
        _fill_lists(C['cats'], [c for qs, _ in look for c in _row_cats(qs, C)], list='categorymembers', cmtitle='Category:{}',
                    cmtype='file', cmlimit=10)
        srs = [_searches(r, byid) for r in rows]
        ask = lambda: _fill_lists(C['search'], [s for ss in srs for s in ss], list='search', srnamespace=6, srlimit=6,
                                  srsearch='{} filetype:bitmap')
        srs = [ss if r.get('search') else ss[:1] for r, ss in zip(rows, srs)]
        ask()
        uniqs = [_row_files(r, qs, ts, ss, C) for r, (qs, _), ts, ss in zip(rows, look, tl, srs)]
        for n in (2, 3):  # the fallbacks, one at a time
            full = [_searches(r, byid) for r in rows]
            srs = [ss if r.get('search') or len(u) >= MIN_FOUND else f[:n] for r, ss, u, f in zip(rows, srs, uniqs, full)]
            ask()
            uniqs = [_row_files(r, qs, ts, ss, C) for r, (qs, _), ts, ss in zip(rows, look, tl, srs)]
        _fill_imageinfo(C['imageinfo'], [f for u in uniqs for _, f in u])
        for c in C.values():
            c.save()
        if os.environ.get('FI_REFS_API') == '1':  # the API's answers only (cached), e.g. on a machine the API serves faster
            print(f'refs: pass {i // CHUNK + 1}: {i + len(rows)}/{len(todo)} rows asked, {time.time() - t0:.0f} s', flush=True)
            continue
        info = C['imageinfo'].d
        batch, jobs = [], []
        for r, (qs, _), ts, uniq in zip(rows, look, tl, uniqs):
            d = RAW / 'refs' / r['key']
            d.mkdir(parents=True, exist_ok=True)
            ext = next((C['pages-ja.wikipedia.org'].d.get(t, {}).get('ext') for h, t in ts[:4] if h.startswith('ja')
                        and C['pages-ja.wikipedia.org'].d.get(t, {}).get('ext')), '')
            batch.append((r, d, uniq, info, qs, [list(t) for t in ts], ext))
            jobs += [(d / f'c{n}.jpg', info[f][0]) for n, (_, f) in enumerate(uniq) if info.get(f) and not (d / f'c{n}.jpg').exists()]
        if pending:
            finish(*pending)
        pending = (batch, [pool.submit(_download, j) for j in jobs])
        print(f'refs: pass {i // CHUNK + 1}: {i + len(rows)}/{len(todo)} rows, {time.time() - t0:.0f} s', flush=True)
    if pending:
        finish(*pending)
    pool.shutdown()


def _wd_index():
    names = json.loads((SRC / 'aliases_wikidata.json').read_text())['names']
    wp = json.loads((SRC / 'aliases_wikipedia.json').read_text())['names']
    return names, wp


def _lookups(row, names, wp, byid):
    """A row's QIDs and ja.wikipedia titles, from the frozen alias tables (exact names: the row's, its items' and their
    base names) plus the row's own `qid` / `wiki` hints."""
    qids, titles = list(row.get('qid', [])), list(row.get('wiki', []))
    cands = [row['ja']]
    for i in row['items']:
        it = byid.get(i, {})
        n = it.get('name', '')
        cands += [n, re.sub(r'（.*?）|\(.*?\)', '', n).strip(), n.split(' ')[0]]
    for c in cands:
        if c in names and names[c]['qid'] not in qids:
            qids.append(names[c]['qid'])
        if c in wp and wp[c]['wp'] not in titles:
            titles.append(wp[c]['wp'])
    return qids[:3], titles[:3]


# ---------- contact sheets (PIL)

def _font(px):
    from PIL import ImageFont
    return ImageFont.truetype('/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc', px)


def _thumb(p, px):
    from PIL import Image
    im = Image.open(p).convert('RGB')
    im.thumbnail((px, px))
    return im


def _wrap(dr, text, font, width, lines):
    """text cut into at most `lines` lines of at most `width` px."""
    out, cur = [], ''
    for ch in text:
        if dr.textlength(cur + ch, font=font) > width:
            out.append(cur)
            cur = ch.lstrip()
        else:
            cur += ch
    return (out + [cur])[:lines]


def cmd_refsheet(out, *keys):
    """Rows of candidates for vetting (fi.py vet): the row's ja, key and items' names, then its candidates, each
    labelled c<n> in a box at a size a vision model reads (a sheet of 12 rows is ~1,320 x 1,690 px)."""
    from PIL import Image, ImageDraw
    rows = {r['key']: r for r in table()}
    byid = items_by_id()
    keys = [k for k in keys if k in rows]
    PX, W, L, RH = 128, 8, 260, 140
    sheet = Image.new('RGB', (L + W * (PX + 4), len(keys) * RH), (250, 246, 236))
    dr = ImageDraw.Draw(sheet)
    f, fk, fs, fl = _font(17), _font(12), _font(12), _font(18)
    for i, k in enumerate(keys):
        y, r = i * RH, rows[k]
        m = json.loads((RAW / 'refs' / k / 'cand.json').read_text())
        ty = y + 4
        for line in _wrap(dr, r['ja'], f, L - 12, 2):
            dr.text((6, ty), line, fill=(40, 30, 20), font=f)
            ty += 21
        dr.text((6, ty), k, fill=(30, 70, 140), font=fk)
        ty += 16
        names = ' / '.join(dict.fromkeys(byid.get(it, {}).get('name', it) for it in r.get('items', []))) or r.get('cat', '')
        for line in _wrap(dr, names, fs, L - 12, (y + RH - ty - 4) // 15):
            dr.text((6, ty), line, fill=(110, 90, 70), font=fs)
            ty += 15
        for j, c in enumerate(m['cand'][:W]):
            x = L + j * (PX + 4)
            try:
                sheet.paste(_thumb(RAW / 'refs' / k / f'c{c["n"]}.jpg', PX), (x, y + 6))
            except Exception:
                pass
            label = f'c{c["n"]}'
            dr.rectangle((x, y + 6, x + dr.textlength(label, font=fl) + 8, y + 30), fill=(150, 30, 30))
            dr.text((x + 4, y + 8), label, fill=(255, 255, 255), font=fl)
        dr.line((0, y + RH - 2, sheet.width, y + RH - 2), fill=(170, 150, 120), width=2)
    sheet.save(out)
    print(out, sheet.size)


def _vetted(k, ok):
    """A row's vetted refs from candidate numbers ({n, origin, file, page, ok: true} as in cand.json), or an error."""
    meta = RAW / 'refs' / str(k) / 'cand.json'
    if not isinstance(ok, list) or not all(isinstance(n, int) for n in ok):
        return None, f'{k}: ok must be a list of candidate numbers'
    if ok and not meta.exists():
        return None, f'{k}: no cand.json'
    cand = {c['n']: c for c in json.loads(meta.read_text())['cand']} if meta.exists() else {}
    miss = [n for n in ok if n not in cand]
    if miss:
        return None, f'{k}: c{miss} not in cand.json'
    return [{**{f: cand[n][f] for f in ('n', 'origin', 'file', 'page')}, 'ok': True} for n in dict.fromkeys(ok)], None


def _table_files():
    files = {p: json.loads(p.read_text()) for p in sorted((HERE / 'table').glob('*.json'))}
    return files, {r['key']: r for rs in files.values() for r in rs}


def _write_table(files):
    for p, rs in files.items():
        p.write_text(json.dumps(rs, ensure_ascii=False, indent=1) + '\n')


def cmd_vet(path):
    """Record the vetting of a row's candidates (a refsheet by eye): a JSON file [{key, ok: [n, ...], why?}] -> the row's
    `refs` = its vetted candidates as in cand.json ({n, origin, file, page, ok: true}); `ok: []` records "none fits"
    (refs: [], unlike an unvetted row's missing refs), `why` lands in the row's `vet`. A later answer for a key
    replaces the earlier one (idempotent). Refused whole, nothing written, if a key isn't in the table or an n isn't
    in its cand.json."""
    files, rows = _table_files()
    todo, bad = [], []
    for a in json.loads(Path(path).read_text()):
        k = a.get('key')
        refs, err = _vetted(k, a.get('ok')) if k in rows else (None, f'{k}: not in the table')
        if err:
            bad.append(err)
        else:
            todo.append((rows[k], refs, a.get('why', '')))
    if bad:
        sys.exit('vet: refused, nothing written:\n  ' + '\n  '.join(bad))
    for r, refs, why in todo:
        r['refs'] = refs
        if why:
            r['vet'] = why[:200]
        else:
            r.pop('vet', None)
    _write_table(files)
    print(f'vet: {len(todo)} rows, {sum(len(v) >= 2 for _, v, _ in todo)} with 2+ vetted references')


def _cands(k, limit):
    """A row's candidate numbers whose photo downloaded, in cand.json order."""
    meta = RAW / 'refs' / k / 'cand.json'
    cand = json.loads(meta.read_text())['cand'] if meta.exists() else []
    return [c['n'] for c in cand if (RAW / 'refs' / k / f'c{c["n"]}.jpg').exists()][:limit]


def cmd_checksheets(out, *keys):
    """The Claude check's sheets (fi.py claude): every row with a generated image (or `keys`), its current roll beside
    its vetted refs (up to 2) or, unvetted, up to 5 candidates labelled c<n>; 6 rows a sheet, ~1,120 x 1,560 px (a
    vision model downsizes beyond 1,568). Rows without any candidate last, 8 a sheet (4 x 2, the image alone).
    -> <out>/sheets/s-NNNN.png, <out>/manifest.json [{sheet, keys}], <out>/rows.jsonl (what a checker reads beside)."""
    from PIL import Image, ImageDraw
    out = Path(out)
    (out / 'sheets').mkdir(parents=True, exist_ok=True)
    vs, byid = verdicts(), items_by_id()
    rows = [r for r in table() if not keys or r['key'] in keys]
    info, skipped = {}, 0
    for r in rows:
        st, roll = state(r, vs)
        if not isinstance(roll, int) or not gen_path(r, roll).exists():
            skipped += 1
            continue
        k = r['key']
        cand = _cands(k, 5)
        info[k] = dict(key=k, ja=r['ja'], desc=r['desc'], roll=roll, state=st,
                       items=list(dict.fromkeys(byid.get(i, {}).get('name', i) for i in r.get('items', []))) or [r.get('cat', '')],
                       vetted=[x['n'] for x in vetted_refs(r)] if 'refs' in r else None, cand=cand, nocand=not cand)
    with_c = [k for k in info if not info[k]['nocand']]
    no_c = [k for k in info if info[k]['nocand']]
    f, fk, fl = _font(20), _font(15), _font(18)
    BG, INK, KEY = (250, 246, 236), (40, 30, 20), (30, 70, 140)

    def label(dr, x, y, text, fill):
        dr.rectangle((x, y, x + dr.textlength(text, font=fl) + 8, y + 24), fill=fill)
        dr.text((x + 4, y + 2), text, fill=(255, 255, 255), font=fl)

    def head(dr, x, y, n, i, width, wide):
        tag = 'NO REFS' if i['nocand'] else 'UNVETTED' if i['vetted'] is None else f'vetted: {len(i["vetted"])}'
        tf = f if wide else fk
        ty = y if wide else y + 27
        dr.text((x + width - dr.textlength(tag, font=tf), ty), tag, fill=(150, 30, 30) if i['vetted'] is None else (30, 110, 50), font=tf)
        t = _wrap(dr, f'{n}. {i["ja"]}', f, width * 0.6 if wide else width, 1)[0]
        dr.text((x, y), t, fill=INK, font=f)
        kx, ky = (x + dr.textlength(t, font=f) + 14, y + 4) if wide else (x, y + 27)
        rest = x + width - dr.textlength(tag, font=tf) - 12 - kx
        dr.text((kx, ky), _wrap(dr, f'r{i["roll"]}  {i["key"]}', fk, rest, 1)[0], fill=KEY, font=fk)

    def paste(sheet, p, x, y, px):
        im = _thumb(p, px)
        sheet.paste(im, (x + (px - im.width) // 2, y + (px - im.height) // 2))

    G, C, HD, PER = 222, 170, 32, 6  # 6 x 260 px: under 1,568
    W, RH = 12 + G + 12 + 5 * (C + 4) + 8, HD + G + 6
    manifest, n = [], 0
    for s0 in range(0, len(with_c), PER):
        ks = with_c[s0:s0 + PER]
        sheet = Image.new('RGB', (W, len(ks) * RH), BG)
        dr = ImageDraw.Draw(sheet)
        for j, k in enumerate(ks):
            i, y = info[k], j * RH
            head(dr, 12, y + 4, j + 1, i, W - 24, True)
            paste(sheet, gen_path({'key': k, 'desc': i['desc']}, i['roll']), 12, y + HD, G)
            label(dr, 12, y + HD, 'GENERATED', (60, 60, 60))
            x = 12 + G + 12
            if i['vetted'] is not None:
                for m in i['vetted'][:2]:
                    paste(sheet, RAW / 'refs' / k / f'c{m}.jpg', x, y + HD, G)
                    label(dr, x, y + HD, f'ref c{m}', (30, 110, 50))
                    x += G + 8
            else:
                for m in i['cand']:
                    paste(sheet, RAW / 'refs' / k / f'c{m}.jpg', x, y + HD + (G - C) // 2, C)
                    label(dr, x, y + HD + (G - C) // 2, f'c{m}', (150, 30, 30))
                    x += C + 4
            dr.line((0, y + RH - 2, W, y + RH - 2), fill=(170, 150, 120), width=2)
        n += 1
        sheet.save(out / 'sheets' / f's-{n:04d}.png')
        manifest.append({'sheet': f's-{n:04d}.png', 'keys': ks})
    P, COLS = 340, 4
    for s0 in range(0, len(no_c), 8):
        ks = no_c[s0:s0 + 8]
        cw, ch = P + 24, 50 + P + 12
        sheet = Image.new('RGB', (COLS * cw, ((len(ks) + COLS - 1) // COLS) * ch), BG)
        dr = ImageDraw.Draw(sheet)
        for j, k in enumerate(ks):
            i, x, y = info[k], (j % COLS) * cw + 12, (j // COLS) * ch
            head(dr, x, y + 4, j + 1, i, P, False)
            paste(sheet, gen_path({'key': k, 'desc': i['desc']}, i['roll']), x, y + 50, P)
        n += 1
        sheet.save(out / 'sheets' / f's-{n:04d}.png')
        manifest.append({'sheet': f's-{n:04d}.png', 'keys': ks})
    for m in manifest:
        for k in m['keys']:
            info[k]['sheet'] = m['sheet']
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0) + '\n')
    (out / 'rows.jsonl').write_text(''.join(json.dumps(info[k], ensure_ascii=False) + '\n' for m in manifest for k in m['keys']))
    print(f'checksheets: {n} sheets ({len(with_c)} rows with candidates, {len(no_c)} without), {skipped} rows not drawn yet')


# ---------- generation (the mflux tool's Python)

def cmd_gen(keys=None):
    from mflux.models.z_image.variants.z_image import ZImage
    from mflux.models.common.config.model_config import ModelConfig
    model = None
    while True:
        vs = verdicts()
        due = [(r, s[1]) for r in table() if (not keys or r['key'] in keys) for s in [state(r, vs)] if s[0] == 'gen']
        pop = {i: it.get('pop', 0) for i, it in items_by_id().items()}
        due = [(r, roll) for r, roll in due if not gen_path(r, roll).exists()]
        due.sort(key=lambda d: -max([pop.get(i, 0) for i in d[0]['items']] or [0]))  # the popular first (a stable sort: then table order)
        due = due[:20]  # then re-read the table
        if not due:
            if os.environ.get('FI_WATCH') != '1':
                break
            time.sleep(60)  # FI_WATCH=1: keep the model loaded and pick up rows as they are written
            continue
        if model is None:
            model = ZImage(model_config=ModelConfig.z_image_turbo(), quantize=QUANT)
        for r, roll in due:
            p = gen_path(r, roll)
            p.parent.mkdir(parents=True, exist_ok=True)
            t = time.time()
            img = model.generate_image(seed=seed(r['key'], roll), prompt=PROMPT.format(desc=r['desc']), num_inference_steps=STEPS,
                                       width=GEN_PX, height=GEN_PX)
            tmp = p.with_suffix('.tmp.png')
            img.save(path=str(tmp))
            tmp.rename(p)
            p.with_suffix('.json').write_text(json.dumps({'quant': QUANT, 'steps': STEPS, 'px': GEN_PX, 'seed': seed(r['key'], roll), 'prompt_v': PROMPT_V}))
            print(f'gen {r["key"]} r{roll} {time.time() - t:.1f}s', flush=True)
            time.sleep(float(os.environ.get("FI_PAUSE", 0)))  # FI_PAUSE: seconds of rest after each image (a shared machine)


# ---------- the check (Claude, by eye over checksheets)

VERDICT, STRENGTH = ('pass', 'reroll', 'fallback'), ('strong', 'medium', 'weak')


def cmd_claude(path, check='claude'):
    """Log Claude's verdicts on generated images (a checksheet by eye): a JSON file [{key, verdict: pass|reroll|fallback,
    strength: strong|medium|weak (2+ good refs, 1, none), why, by, refs_ok?: [n, ...], roll?}]. The roll defaults to the
    row's current one (claude2, the second opinion: the roll the first check judged). refs_ok on a row not vetted yet
    records its vetted refs as `vet` does. A repeated answer is a no-op; a changed one is logged after (the last
    counts). Refused whole, nothing written, on a bad key, verdict, strength, candidate or a roll never drawn."""
    vs = verdicts()
    files, rows = _table_files()
    todo, bad, refs = [], [], {}
    for a in json.loads(Path(path).read_text()):
        k = a.get('key')
        r = rows.get(k)
        if r is None:
            bad.append(f'{k}: not in the table')
            continue
        h = desc_hash(r)
        mine = [v for v in vs.get(k, []) if v.get('h') == h]
        same = [v for v in mine if v['check'] == check and all(v.get(f) == a.get(f) for f in ('verdict', 'strength'))
                and v.get('why') == str(a.get('why', ''))[:200] and v['roll'] == a.get('roll', v['roll'])]
        if same:
            continue  # logged already (a batch file applied again: its rows' state may have moved on since)
        first = [v['roll'] for v in mine if v['check'] == 'claude']
        roll = a.get('roll', first[-1] if check == 'claude2' and first else state(r, vs)[1])
        if a.get('verdict') not in VERDICT or a.get('strength') not in STRENGTH:
            bad.append(f'{k}: verdict must be one of {VERDICT}, strength one of {STRENGTH}')
        elif not isinstance(roll, int) or not gen_path(r, roll).exists():
            bad.append(f'{k}: no generated image for roll {roll}')
        else:
            if 'refs_ok' in a and 'refs' not in r:
                refs[k], err = _vetted(k, a['refs_ok'])
                if err:
                    bad.append(err)
                    continue
            todo.append({'key': k, 'roll': roll, 'h': h, 'check': check, 'verdict': a['verdict'], 'strength': a['strength'],
                         'why': str(a.get('why', ''))[:200], 'model': a.get('by', 'claude')})
    if bad:
        sys.exit(f'{check}: refused, nothing written:\n  ' + '\n  '.join(bad))
    for k, rs in refs.items():
        rows[k]['refs'] = rs
        rows[k]['vet'] = 'vetted in the Claude check'
    if refs:
        _write_table(files)
    for rec in todo:
        log_verdict(rec)
    print(f'{check}: {len(todo)} verdicts logged, {len(refs)} rows vetted')


def cmd_claude2(path):
    cmd_claude(path, 'claude2')


def cmd_status(*keys):
    vs = verdicts()
    from collections import Counter
    c = Counter()
    for r in table():
        st = state(r, vs)
        c[st[0]] += 1
        if keys and (r['key'] in keys or 'all' in keys):
            print(r['key'], r['ja'], st)
    print(dict(c))


# ---------- pack: the shipped rows into sprite sheets (PIL; webp via PIL's libwebp, fixed settings)

PAPER = (0xF5, 0xE4, 0xBC)  # --c-paper
T_PX = 128  # thumbnails (48 / 40 px at 3x)
T_COLS = int(os.environ.get('FI_TCOLS', 4))  # 4 x 4 a sheet (10 x 10 until 2026-11-08: a search downloaded ~250 KB; now ~100)
T_PER = T_COLS * T_COLS
T_QUALITY = int(os.environ.get('FI_TQ', 65))  # at 48 px on screen the same as 72, ~8 % smaller
D_PX, D_COLS, D_PER = 384, 3, 3 * 3  # the amount picture (160 px): 3 x 3 (1,152 px, ~5.3 MB decoded), opened one at a time
D_V = 3  # the detail layout's version: a change lays the detail sheets out again (5 x 5 until 2026-11-07, 2 x 2 till static/'s 15,000-file cap)
QUALITY = 72
# Thumbnail sheets are per search neighbourhood, so a search's rows touch few: a row whose name holds a common search
# word sits with that word's family, the rest with its first item's category (BUCKET). Dish-type words rank before
# ingredient words (チキンサラダ is a salad, 卵スープ a soup, 鮭おにぎり an onigiri), then the more specific ingredient
# (牛乳 before 牛); first match wins. Detail sheets go by category only. FAMILY_V: a change lays the sheets out again.
FAMILY_V = 4  # 4: the first ingredient word in the name wins (トマトと卵: トマト); 3: スープ apart from the 汁 (the MAFF 汁 had put スープ's top 20 on 5 sheets)
FAMILY = [('curry', 'カレー'), ('sushi', '寿司 軍艦 手巻 鉄火巻 かっぱ巻 かんぴょう巻 納豆巻 太巻 恵方巻 ネギトロ巻 サラダ巻'),
          ('salad', 'サラダ'), ('ramen', 'ラーメン 中華めん 中華そば つけ麺 担々麺 ちゃんぽん'), ('udon', 'うどん'), ('soba', 'そば'),
          ('pasta', 'スパゲッティ パスタ マカロニ ナポリタン カルボナーラ ペペロンチーノ ボンゴレ'), ('onigiri', 'おにぎり むすび'),
          ('don', '丼'), ('miso', '味噌汁 みそ汁'), ('soup', 'スープ ポタージュ'), ('jiru', '汁'), ('bread', 'パン トースト サンド'),
          ('rice', 'ごはん ご飯 かゆ 粥 めし'), ('milk', '牛乳'),
          ('egg', '卵 たまご 玉子 エッグ オムレツ'), ('tofu', '豆腐 厚揚げ 油揚げ がんもどき'), ('natto', '納豆'),
          ('pork', '豚 ポーク とんかつ ハム ベーコン ウインナー ソーセージ'), ('chicken', '鶏 チキン 唐揚げ から揚げ 焼き鳥 ささみ 手羽'),
          ('beef', '牛 ビーフ ステーキ 焼肉'), ('salmon', '鮭 さけ サーモン'), ('tuna', 'まぐろ ツナ'), ('saba', 'さば'),
          ('shrimp', 'えび エビ'), ('cheese', 'チーズ'),
          ('yogurt', 'ヨーグルト'), ('cabbage', 'キャベツ'), ('tomato', 'トマト'), ('onion', 'たまねぎ 玉ねぎ'), ('carrot', 'にんじん'),
          ('apple', 'りんご'), ('banana', 'バナナ'), ('beer', 'ビール')]
BUCKET = {'主食': 'rice', '麺': 'noodle', '丼・定食': 'don', '主菜': 'main', '副菜': 'side', '汁物': 'soup', '寿司': 'sushi',
          'パン': 'bread', '肉': 'meat', '魚介': 'fish', '卵': 'egg', '大豆・豆': 'soy', '野菜': 'veg', '果物': 'fruit',
          'きのこ': 'veg', '海藻': 'veg', '乳製品': 'dairy', '菓子・デザート': 'sweet', '飲料': 'drink', '酒': 'drink',
          '調味料': 'season', '油脂': 'season', 'ナッツ・種': 'soy', 'いも': 'veg', 'コンビニ': 'konbini', '外食': 'eatout', 'その他': 'other'}


def paper_even(im):
    """The background to the paper colour: a per-channel gain from the border's median."""
    import statistics
    from PIL import Image
    w, h = im.size
    px = [im.getpixel((x, y)) for x in range(0, w, 8) for y in (2, h - 3)] + [im.getpixel((x, y)) for y in range(0, h, 8) for x in (2, w - 3)]
    med = [max(1, statistics.median(c[i] for c in px)) for i in range(3)]
    return Image.merge('RGB', [ch.point(lambda v, g=PAPER[i] / med[i]: min(255, round(v * g))) for i, ch in enumerate(im.convert('RGB').split())])


def model_of(png):
    """An image's generator settings, from its sidecar (none: the first images, q8)."""
    side = png.with_suffix('.json')
    c = json.loads(side.read_text()) if side.exists() else {'quant': 8, 'steps': 9, 'px': 512}
    return f"Z-Image-Turbo q{c['quant']} {c['steps']} steps {c['px']}px"


def family_of(row, byid, other=None):
    """A row's thumbnail neighbourhood: a dish-type word's family (FAMILY up to 'milk', in order), else the ingredient
    word that comes first in the name (トマトと卵の炒め物: トマト; 鶏肉とトマトの煮込み: 鶏), else its first item's category."""
    name = row['ja']
    dish = [f for f, _ in FAMILY][:[f for f, _ in FAMILY].index('milk')]
    for fam, words in FAMILY:
        if fam in dish and any(w in name for w in words.split()):
            return fam
    hits = [(name.find(w), i, fam) for i, (fam, words) in enumerate(FAMILY) if fam not in dish for w in words.split() if w in name]
    if hits:
        return min(hits)[2]
    return other or BUCKET.get(cat_of(row, byid), 'other')


def cat_of(row, byid):
    """A row's category: its first item's, or its own `cat` (a subcategory picture, products only)."""
    return byid[row['items'][0]]['cat'] if row['items'] else row['cat']


# ---------- products: a generic picture of the same food (pmatch.py, products.txt; never a package)

PRODUCTS = HERE / 'products.txt'
# the raw Open Food Facts download (gitignored, never shipped): the products' category tags and generic names
OFF_RAW = Path(os.environ.get('FOOD_RAW', MAIN / 'food-data' / 'raw')).expanduser() / 'off'


def product_rules(rows=None, byid=None):
    """pmatch.Rules over products.txt, the catalog words and the pictures' categories (rows: those that ship)."""
    import pmatch
    byid = byid or items_by_id()
    rows = rows if rows is not None else table()
    return pmatch.Rules(PRODUCTS.read_text(), pmatch.catalog_words(rows, lambda r: cat_of(r, byid), byid),
                        {r['key']: cat_of(r, byid) for r in rows})


def product_pictures(rows=None, byid=None):
    """off id -> picture row key, for the products matched with confidence (pmatch.CONFIDENT)."""
    import pmatch
    if not (OFF_RAW / 'off_jp.jsonl').exists():
        sys.exit(f'products: no {OFF_RAW}/off_jp.jsonl (set FOOD_RAW to the raw downloads)')
    rules, off = product_rules(rows, byid), pmatch.load_off(OFF_RAW)
    idx = json.loads((APP_FOOD / 'index.json').read_text())
    out = {}
    for d in idx['datasets']:
        if d['source'] == 'off':  # the packaged products (Kalori's chain menus keep their tiles)
            for it in shipped_items(json.loads((APP_FOOD / d['file']).read_text())):
                tags, generic = off.get(it['id'], ((), ''))
                k, conf, _ = rules.match(it['name'], it['cat'], it.get('brand', ''), tags, generic)
                if k and conf >= pmatch.CONFIDENT:
                    out[it['id']] = k
    return out


def cmd_pack():
    from PIL import Image
    vs = verdicts()
    byid = items_by_id()
    rows = [r for r in table() if state(r, vs)[0] == 'ship']
    slots = json.loads(SLOTS.read_text()) if SLOTS.exists() else {}
    if slots.get('v') != FAMILY_V:  # another family ranking (or the first layout): the thumbnails laid out again
        old = slots if set(slots) <= {'t', 'd', 'p', 'v', 'dv'} else {}
        slots = {'v': FAMILY_V, 'd': old.get('d', {}), 'dv': old.get('dv')}
    if slots.get('dv') != D_V:
        slots['d'], slots['dv'] = {}, D_V
    for tag in 'tdp':
        slots.setdefault(tag, {})
    # products' pictures (products.txt): their own thumbnail sheets per search neighbourhood, the most used first, so a
    # search's products touch few sheets (the same picture's generic cell sits with the generic foods)
    shipping = {r['key']: r for r in rows}
    prodmap = {i: k for i, k in product_pictures(rows, byid).items() if k in shipping}
    # a product's sheet: its own name's search neighbourhood (たまねぎドレッシング with the onions), else its picture's
    pnames = {it['id']: it['name'] for d in json.loads((APP_FOOD / 'index.json').read_text())['datasets'] if d['source'] == 'off'
              for it in shipped_items(json.loads((APP_FOOD / d['file']).read_text()))}
    pfam = {i: family_of({'ja': pnames[i], 'items': []}, byid, family_of(shipping[k], byid)) for i, k in prodmap.items()}
    # a picture whose generic cell is in that neighbourhood already serves the product from there
    pfam = {i: f for i, f in pfam.items() if f != family_of(shipping[prodmap[i]], byid) or not shipping[prodmap[i]]['items']}
    uses = {}
    for i, f in pfam.items():
        uses[(f, prodmap[i])] = uses.get((f, prodmap[i]), 0) + 1
    # new keys join their bucket's end, popular first, then by name: a full sheet never changes
    rows_by_pop = sorted(rows, key=lambda r: (-max([byid.get(i, {}).get('pop', 0) for i in r['items']] or [0]), r['ja']))
    for tag, place, want in (('t', lambda r: family_of(r, byid), lambda r: r['items']),
                             ('d', lambda r: BUCKET.get(cat_of(r, byid), 'other'), lambda r: True),
                             ):
        placed = {k for ks in slots[tag].values() for k in ks}
        for r in rows_by_pop:
            if r['key'] not in placed and want(r):
                slots[tag].setdefault(place(r), []).append(r['key'])
    for (fam, k), n in sorted(uses.items(), key=lambda u: (-u[1], u[0])):  # the most used first
        if k not in slots['p'].get(fam, []):
            slots['p'].setdefault(fam, []).append(k)
    SLOTS.write_text(json.dumps(slots, ensure_ascii=False, indent=0, sort_keys=True) + '\n')
    ship = {r['key']: r for r in rows}
    OUT.mkdir(parents=True, exist_ok=True)
    keep, sheets, cells = set(), [], {}
    for px, cols, per, tag in ((T_PX, T_COLS, T_PER, 't'), (D_PX, D_COLS, D_PER, 'd'), (T_PX, T_COLS, T_PER, 'p')):
        for b in sorted(slots[tag]):
            for n in range(0, len(slots[tag][b]), per):
                part = slots[tag][b][n:n + per]  # a key gone to the tile leaves its cell empty
                if not any(k in ship for k in part):
                    continue
                rows_n = (len(part) + cols - 1) // cols
                sh = Image.new('RGB', (cols * px, rows_n * px), PAPER)
                for i, k in enumerate(part):
                    if k not in ship:
                        continue
                    im = paper_even(Image.open(gen_path(ship[k], state(ship[k], vs)[1]))).resize((px, px), Image.LANCZOS)
                    x, y = (i % cols) * px, (i // cols) * px
                    sh.paste(im, (x, y))
                    cells.setdefault(k, {})[tag if tag != 'p' else ('p', b)] = (len(sheets), x, y)
                buf = io.BytesIO()
                sh.save(buf, 'WEBP', quality=QUALITY if tag == 'd' else T_QUALITY, method=6)
                b2 = buf.getvalue()
                name = f'{tag}-{b}-{n // per}-{hashlib.sha256(b2).hexdigest()[:8]}.webp'
                if not (OUT / name).exists():
                    (OUT / name).write_bytes(b2)
                keep.add(name)
                sheets.append(name)
    keys = sorted(k for k in cells if 't' in cells[k])
    pkeys = sorted((c[1], k) for k in cells for c in cells[k] if isinstance(c, tuple))
    kidx = {k: i for i, k in enumerate(keys)}
    pidx = {fk: len(keys) + i for i, fk in enumerate(pkeys)}
    ids = {i: kidx[k] for k in keys for i in sorted(ship[k]['items']) if i in byid}
    prod = {i: pidx[(pfam[i], k)] if i in pfam else kidx[k] for i, k in sorted(prodmap.items())}
    index = {'v': 1, 't': T_PX, 'd': D_PX, 'sheets': sheets,
             'keys': [[*cells[k]['t'], *cells[k]['d']] for k in keys] + [[*cells[k][('p', f)], *cells[k]['d']] for f, k in pkeys],
             'ids': {**ids, **prod}}
    (OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':'), sort_keys=True))
    for p in OUT.glob('*.webp'):
        if p.name not in keep:
            p.unlink()
    shipped = [{'key': k, 'ja': ship[k]['ja'], 'desc': ship[k]['desc'], 'items': ship[k]['items'], 'roll': state(ship[k], vs)[1],
                'seed': seed(k, state(ship[k], vs)[1]), 'prompt': desc_hash(ship[k]), 'model': model_of(gen_path(ship[k], state(ship[k], vs)[1])),
                'checked': checked(ship[k], vs), 'near': near_miss(ship[k], vs)} for k in sorted(set(keys) | {k for _, k in pkeys})]
    (HERE / 'shipped.json').write_text(json.dumps(shipped, ensure_ascii=False, indent=0) + '\n')
    total = sum((OUT / n).stat().st_size for n in keep)
    print(f'pack: {len(keys)} pictures for {len(ids)} foods and {len(prod)} products, {len(sheets)} sheets, {total / 1e6:.2f} MB')


def _mend(name, byname):
    """A name whose characters came through broken (U+FFFD runs): the one draft name it can only be, else as is."""
    if '\ufffd' not in name:
        return name
    pat = re.compile('^' + '.{1,2}'.join(re.escape(p) for p in re.split('\ufffd+', name)) + '$')
    hits = [n for n in byname if pat.match(n)]
    return hits[0] if len(hits) == 1 else name


def cmd_rows(src, dest, phase='1'):
    """Hand-written descriptions ("name|name... = description" lines) into table rows (dest: table/<dest>.json,
    appended): a row takes every item of the listed names' draft groups (propose); names already in the table are
    skipped, an unknown name fails."""
    prop = json.loads((RAW / 'work' / f'propose-{phase}.json').read_text())
    byname = {}
    for r in prop:
        for n in r['names']:
            byname.setdefault(n, r)
    have = {i for r in table() for i in r['items']}
    p = HERE / 'table' / f'{dest}.json'
    rows = json.loads(p.read_text()) if p.exists() else []
    bad = []
    for line in Path(src).read_bytes().decode('utf-8', 'replace').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        names, desc = (x.strip() for x in line.split(' = ', 1))
        if '\ufffd' in desc:
            sys.exit(f'a broken character: {line[:40]}')
        names = [_mend(n, byname) for n in names.split('|')]
        miss = [n for n in names if n not in byname]
        if miss:
            bad += miss
            continue
        items = []
        for n in names:
            items += [i for i in byname[n]['items'] if i not in items and i not in have]
        if not items:
            continue
        have.update(items)
        rows.append({'key': items[0].replace(':', '-'), 'ja': names[0], 'desc': desc, 'items': items})
    if bad:
        sys.exit(f'unknown names: {bad}')
    p.write_text(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
    print(f'{p.name}: {len(rows)} rows')


def cmd_split(src, dest):
    """Items that look different from their row's picture get their own ("id|id = name :: description" lines; dest:
    table/<dest>.json, appended), or join another row's ("id|id = @key"): the ids leave their rows (a row keeps its key:
    its key item never moves) and form a new row keyed by the first id. An unknown id, a key item or an id in two lines
    fails."""
    files = {p: json.loads(p.read_text()) for p in sorted((HERE / 'table').glob('*.json'))}
    owner = {i: (p, r) for p, rs in files.items() for r in rs for i in r['items']}
    keys = {r['key'] for rs in files.values() for r in rs}
    p = HERE / 'table' / f'{dest}.json'
    new = files.setdefault(p, [])
    bad, seen = [], set()
    for line in Path(src).read_text().splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        ids, rest = (x.strip() for x in line.split(' = ', 1))
        ids = ids.split('|')
        to = next((r for rs in files.values() for r in rs if '@' + r['key'] == rest), None)  # `= @key`: join that row
        miss = [i for i in ids if i not in owner or i in seen or owner[i][1]['key'] == i.replace(':', '-')]
        if miss or (to is None and (rest.startswith('@') or ids[0].replace(':', '-') in keys)):
            bad += miss or ids[:1]
            continue
        for i in ids:
            seen.add(i)
            owner[i][1]['items'].remove(i)
        if to is not None:
            to['items'] += ids
            continue
        ja, desc = (x.strip() for x in rest.split(' :: ', 1))
        new.append({'key': ids[0].replace(':', '-'), 'ja': ja, 'desc': desc, 'items': ids})
        keys.add(new[-1]['key'])
    if bad:
        sys.exit(f'unknown, key or repeated ids: {bad}')
    for q, rs in files.items():
        q.write_text(json.dumps(rs, ensure_ascii=False, indent=1) + '\n')
    print(f'{p.name}: {len(new)} rows')


def cmd_attach(phase):
    """A phase's items whose visual key (vnorm) is an existing row's join that row (the same dish in another source
    shares its picture): appended to the row's items in its table file."""
    byid = items_by_id()
    files, owner = {}, {}
    for p in sorted((HERE / 'table').glob('*.json')):
        files[p] = json.loads(p.read_text())
        for r in files[p]:
            for i in r['items']:
                if i in byid:
                    owner.setdefault(vnorm(byid[i]['name']), r)
    have = {i for rs in files.values() for r in rs for i in r['items']}
    n = 0
    for it in phase_items(int(phase)):
        r = owner.get(vnorm(it['name']))
        if r is not None and it['id'] not in have:
            r['items'].append(it['id'])
            have.add(it['id'])
            n += 1
    for p, rs in files.items():
        p.write_text(json.dumps(rs, ensure_ascii=False, indent=1) + '\n')
    print(f'attach: {n} items of phase {phase} joined existing rows')


if __name__ == '__main__':
    cmd, *args = sys.argv[1:] or ['status']
    if cmd in ('gen', 'refs'):
        globals()['cmd_' + cmd](set(args[0].split(',')) if args else None)
    else:
        globals()['cmd_' + cmd](*args)
