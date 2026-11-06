#!/usr/bin/env python3
"""ごはん's generated food pictures (docs/food-data.md "Pictures"): one picture per visual concept (a table row, `key`),
drawn by Z-Image-Turbo from a hand-written description, checked twice against reference photos, packed into sprite
sheets in app/static/food-img/.

  python3 -I food-data/images/fi.py propose <phase>      # draft rows for a phase's items -> $RAW/work/propose-<phase>.json
  python3 -I food-data/images/fi.py refs [keys]          # candidate reference photos per row (Commons, Wikidata, Wikipedia, MAFF)
  python3 -I food-data/images/fi.py refsheet <out> keys  # a contact sheet of a row's candidates, to vet them by eye
  <mflux python> food-data/images/fi.py gen [keys]       # generate what is due (a fixed seed per key and roll), cached
  python3 -I food-data/images/fi.py verify [keys]        # the vision check (qwen via ollama) against the vetted refs
  python3 -I food-data/images/fi.py checksheet <out> keys  # generated beside refs, for the second (by-eye) check
  python3 -I food-data/images/fi.py status               # per row: refs, rolls, verdicts, shipped
  python3 -I food-data/images/fi.py pack                 # paper-even, webp, sheets + index.json into app/static/food-img/

Committed here: the table (table/*.json: rows {key, ja, desc, items, refs, why}), the verdict log (verdicts.jsonl) and the
slots (slots.json: a key's sheet cell, append-only so a shipped sheet never changes). Everything else (reference
photos, generated images, sheets for review) lives in $FOOD_IMG_RAW (default ~/food-images-raw), never in the repo:
reference photos are look-only. Downloads are untrusted: nothing is run from them. Python with PIL (pack, sheets) and
the mflux tool's Python (gen) are the only non-stdlib parts.
"""
import binascii, hashlib, io, json, os, re, subprocess, sys, time, unicodedata, urllib.parse, zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
APP_FOOD = REPO / 'app' / 'static' / 'food'
OUT = REPO / 'app' / 'static' / 'food-img'
SRC = REPO / 'food-data' / 'data_src'
RAW = Path(os.environ.get('FOOD_IMG_RAW', '~/food-images-raw')).expanduser()
MAIN = Path(os.environ.get('FOOD_MAIN', '/Users/waylonhuang/Documents/other/fitness'))  # the main checkout's raw/ (MAFF photos)
VERDICTS = HERE / 'verdicts.jsonl'
SLOTS = HERE / 'slots.json'
UA = 'island-fund-food-refs/1.0 (private app; look-only reference photos)'

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
# The checks run only when asked (FI_CHECKS=1: verify and checksheet's rows need 2 vetted references).
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
        yield d['file'], json.loads((APP_FOOD / d['file']).read_text())['items']


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


def state(row, vs):
    """A row's pipeline state: ('gen', roll) to generate, then ('ship', roll). The checks (verify, then the by-eye review
    of a checksheet) are optional for now (the user, 2026-11-06): a row ships unchecked (index `checked: false`) until a
    check has logged a verdict on it; from then its verdicts decide: ('verify', roll), ('review', roll), ('ship', roll)
    or ('tile', why) after MAX_ROLL re-rolls. Only verdicts on the row's current description count."""
    h = desc_hash(row)
    mine = [v for v in vs.get(row['key'], []) if v.get('h') == h]
    roll = 0
    while True:
        q = [v for v in mine if v['roll'] == roll and v['check'] == 'qwen']
        r = [v for v in mine if v['roll'] == roll and v['check'] == 'eye']
        if not gen_path(row, roll).exists() and not q and not r:
            return ('gen', roll)
        if not mine:
            return ('ship', roll)
        if CHECKS and len(vetted_refs(row)) < 2:
            return ('tile', 'fewer than 2 vetted references')
        if not q and not r:
            return ('verify', roll) if CHECKS else ('ship', roll)
        qv = q[-1]['verdict'] if q else 'unsure'
        if qv in ('pass', 'unsure'):
            if not r:
                return ('review', roll) if CHECKS else ('ship', roll)
            if r[-1]['verdict'] == 'pass':
                return ('ship', roll)
        # a wrong food, a fixable flaw, or the eye check's no: the next roll, at most MAX_ROLL re-rolls
        if roll >= MAX_ROLL:
            return ('tile', f'roll {roll}: {(r or q)[-1].get("why", "")}'[:120])
        roll += 1


def checked(row, vs):
    """Whether a shipped row passed both checks (else it ships unchecked)."""
    st, roll = state(row, vs)
    h = desc_hash(row)
    mine = [v for v in vs.get(row['key'], []) if v.get('h') == h and v['roll'] == roll]
    return st == 'ship' and any(v['check'] == 'eye' and v['verdict'] == 'pass' for v in mine)


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

def _get(url, tries=5, binary=False):
    for t in range(tries):
        time.sleep(1.0 + 2.0 * t)  # Wikimedia rate-limits bursts: space requests, back off on a refusal
        r = subprocess.run(['curl', '-sS', '-L', '-m', '40', '-A', UA, '-w', '\n%{http_code}', url], capture_output=True)
        body, _, code = r.stdout.rpartition(b'\n')
        if code == b'200' and body:
            return body if binary else json.loads(body)
        if code in (b'404', b'400'):
            break
    return None


def _api(host, **params):
    return _get(f'https://{host}/w/api.php?' + urllib.parse.urlencode({'format': 'json', 'formatversion': 2, **params})) or {}


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


def cmd_refs(keys=None):
    """Candidate photos per row -> $RAW/refs/<key>/c<n>.jpg + cand.json (resumable: a row with cand.json is done, unless
    its table hints changed)."""
    names, wp = _wd_index()
    byid = items_by_id()
    rows = [r for r in table() if not keys or r['key'] in keys]
    for row in rows:
        d = RAW / 'refs' / row['key']
        meta = d / 'cand.json'
        hint = json.dumps([row.get('qid'), row.get('wiki'), row.get('search'), row.get('maff')], ensure_ascii=False)
        if meta.exists() and json.loads(meta.read_text()).get('hint') == hint:
            continue
        d.mkdir(parents=True, exist_ok=True)
        qids, titles = _lookups(row, names, wp, byid)
        files = []  # (origin, Commons file title or a MAFF photo path)
        ents = _api('www.wikidata.org', action='wbgetentities', ids='|'.join(qids), props='claims|sitelinks').get('entities', {}) if qids else {}
        cats = []
        for q in qids:
            e = ents.get(q, {})
            for c in e.get('claims', {}).get('P18', [])[:2]:
                files.append(('wikidata', 'File:' + c['mainsnak']['datavalue']['value']))
            for c in e.get('claims', {}).get('P373', [])[:1]:
                cats.append(c['mainsnak']['datavalue']['value'])
            for site, host in (('jawiki', 'ja.wikipedia.org'), ('enwiki', 'en.wikipedia.org')):
                t = e.get('sitelinks', {}).get(site, {}).get('title')
                if t and (host, t) not in titles:
                    titles.append((host, t))
        titles = [t if isinstance(t, tuple) else ('ja.wikipedia.org', t) for t in titles]
        extract = ''
        for host, t in titles[:4]:
            pg = _api(host, action='query', prop='pageimages|extracts', titles=t, piprop='name', exintro=1, explaintext=1,
                      exsentences=3, redirects=1).get('query', {}).get('pages', [{}])[0]
            if pg.get('pageimage'):
                files.append((host.split('.')[0] + 'wiki', 'File:' + pg['pageimage']))
            if host.startswith('ja') and not extract:
                extract = pg.get('extract', '')[:400]
            # the page's other photos (a dish article's lead image is often the only one)
            ims = _api(host, action='query', prop='images', titles=t, imlimit=12, redirects=1).get('query', {}).get('pages', [{}])[0]
            for im in ims.get('images', [])[:12]:
                ti = im['title'].replace('ファイル:', 'File:')
                if re.search(r'\.(jpe?g|JPE?G)$', ti) and not re.search(r'(?i)map|logo|flag|icon|symbol|commons-', ti):
                    files.append((host.split('.')[0] + 'wiki-page', ti))
        for c in cats:
            ms = _api('commons.wikimedia.org', action='query', list='categorymembers', cmtitle='Category:' + c, cmtype='file',
                      cmlimit=10).get('query', {}).get('categorymembers', [])
            files += [('commons-cat', m['title']) for m in ms if re.search(r'(?i)\.jpe?g$', m['title'])][:6]
        for q in row.get('search', [row['ja']]):
            ps = _api('commons.wikimedia.org', action='query', list='search', srnamespace=6, srlimit=6, srsearch=q + ' filetype:bitmap').get('query', {}).get('search', [])
            files += [('commons-search', p['title']) for p in ps if re.search(r'(?i)\.jpe?g$', p['title'])]
        seen, uniq = set(), []
        for o, f in files:
            f = f.replace(' ', '_')
            if f not in seen:
                seen.add(f)
                uniq.append((o, f))
        uniq = uniq[:int(row.get('ncand', 10))]
        cand = []
        if uniq:
            info = _api('commons.wikimedia.org', action='query', prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=330,
                        iiextmetadatafilter='Artist|LicenseShortName', titles='|'.join(f for _, f in uniq)).get('query', {}).get('pages', [])
            byt = {p['title'].replace(' ', '_'): p for p in info}
            for n, (o, f) in enumerate(uniq):
                ii = (byt.get(f) or {}).get('imageinfo', [{}])[0]
                if not ii.get('thumburl'):
                    continue
                p = d / f'c{n}.jpg'
                if not p.exists():
                    b = _get(ii['thumburl'], binary=True)
                    if not b or not b[:3] == b'\xff\xd8\xff':
                        continue
                    p.write_bytes(b)
                cand.append({'n': n, 'origin': o, 'file': f, 'page': ii.get('descriptionurl', '')})
        for n, m in enumerate(row.get('maff', []), start=100):  # MAFF うちの郷土料理 photos (the main checkout's raw/, look-only)
            src = MAIN / 'food-data' / 'raw' / 'maff_photos' / f'{m}.jpg'
            if src.exists():
                (d / f'c{n}.jpg').write_bytes(src.read_bytes())
                cand.append({'n': n, 'origin': 'maff', 'file': m, 'page': f'maff:{m}'})
        meta.write_text(json.dumps({'hint': hint, 'qids': qids, 'titles': titles, 'extract': extract, 'cand': cand}, ensure_ascii=False, indent=1))
        print(row['key'], row['ja'], len(cand), 'candidates', flush=True)


# ---------- contact sheets (PIL)

def _font(px):
    from PIL import ImageFont
    return ImageFont.truetype('/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc', px)


def _thumb(p, px):
    from PIL import Image
    im = Image.open(p).convert('RGB')
    im.thumbnail((px, px))
    return im


def cmd_refsheet(out, *keys):
    """Rows of candidates (c<n> labelled) for vetting: the row's ja, its items' names and the ja.wikipedia lead."""
    from PIL import Image, ImageDraw
    rows = {r['key']: r for r in table()}
    keys = [k for k in keys if k in rows]
    PX, W = 150, 8
    sheet = Image.new('RGB', (230 + W * (PX + 6), len(keys) * (PX + 26)), (250, 246, 236))
    dr = ImageDraw.Draw(sheet)
    f, fs = _font(14), _font(11)
    for i, k in enumerate(keys):
        y = i * (PX + 26)
        m = json.loads((RAW / 'refs' / k / 'cand.json').read_text())
        dr.text((6, y + 4), rows[k]['ja'][:14], fill=(40, 30, 20), font=f)
        dr.text((6, y + 24), k[:28], fill=(120, 100, 80), font=fs)
        for j, c in enumerate(m['cand'][:W]):
            x = 230 + j * (PX + 6)
            try:
                sheet.paste(_thumb(RAW / 'refs' / k / f'c{c["n"]}.jpg', PX), (x, y + 20))
            except Exception:
                continue
            dr.text((x, y + 3), f'c{c["n"]} {c["origin"][:14]}', fill=(150, 40, 40), font=fs)
        dr.line((0, y + PX + 24, sheet.width, y + PX + 24), fill=(200, 190, 170))
    sheet.save(out)
    print(out, sheet.size)


def cmd_checksheet(out, *keys):
    """The second check: per row, the generated image (its current roll) beside two vetted references, at 256 px."""
    from PIL import Image, ImageDraw
    rows = {r['key']: r for r in table()}
    vs = verdicts()
    keys = [k for k in keys if k in rows]
    PX = 256
    cols = 2
    cw = 3 * PX + 40
    sheet = Image.new('RGB', (cols * cw, ((len(keys) + cols - 1) // cols) * (PX + 30)), (250, 246, 236))
    dr = ImageDraw.Draw(sheet)
    f = _font(15)
    for i, k in enumerate(keys):
        r = rows[k]
        st, roll = state(r, vs)
        x0, y = (i % cols) * cw, (i // cols) * (PX + 30)
        dr.text((x0 + 6, y + 4), f'{i + 1}. {r["ja"]}  [{k}] r{roll}', fill=(40, 30, 20), font=f)
        g = gen_path(r, roll if isinstance(roll, int) else 0)
        if g.exists():
            sheet.paste(_thumb(g, PX), (x0 + 6, y + 26))
        refs = vetted_refs(r)[:2]
        for j, ref in enumerate(refs):
            sheet.paste(_thumb(RAW / 'refs' / k / f'c{ref["n"]}.jpg', PX), (x0 + 16 + (j + 1) * PX, y + 26))
    sheet.save(out)
    print(out, sheet.size)


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
        due.sort(key=lambda d: -max(pop.get(i, 0) for i in d[0]['items']))  # the popular first (a stable sort: then table order)
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


# ---------- the vision check (qwen via ollama)

VMODEL = os.environ.get('VMODEL', 'qwen3.8:27b-q8_0')
VPROMPT = """You are checking a food illustration for a Japanese nutrition app before it ships. Accuracy matters more than beauty.
Food: {ja}. Expected look: {desc}
Images 1-{n} are REFERENCE PHOTOS of this food from independent sources (they may show it plated or styled differently).
Image {last} is the CANDIDATE generated illustration (a drawing style is fine).
Judge only the CANDIDATE: is it the right food (right dish, plant part, cut or product, not a lookalike), the right state
(raw / dried / cooked as named), plausible colours, and is the main subject recognisable?
Answer JSON: {{"same_food": true|false, "state_ok": true|false, "issues": "<short>",
"verdict": "pass" | "reroll" | "fallback"}}  (reroll = right idea but a clear flaw; fallback = wrong food or you cannot tell)."""


def _b64(p, px=448):
    import base64
    from PIL import Image
    im = Image.open(p).convert('RGB')
    im.thumbnail((px, px))
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=85)
    return base64.b64encode(b.getvalue()).decode()


def cmd_verify(keys=None):
    import urllib.request
    vs = verdicts()
    for r in table():
        if keys and r['key'] not in keys:
            continue
        st, roll = state(r, vs)
        if st != 'verify':
            continue
        refs = [RAW / 'refs' / r['key'] / f'c{x["n"]}.jpg' for x in vetted_refs(r)[:3]]
        body = dict(model=VMODEL, stream=False, think=False, format='json', options=dict(temperature=0, seed=1),
                    prompt=VPROMPT.format(n=len(refs), last=len(refs) + 1, ja=r['ja'], desc=r['desc']),
                    images=[_b64(p) for p in refs] + [_b64(gen_path(r, roll))])
        t = time.time()
        res = json.loads(urllib.request.urlopen(urllib.request.Request('http://localhost:11434/api/generate', json.dumps(body).encode(),
                                                                       {'Content-Type': 'application/json'}), timeout=900).read())
        try:
            a = json.loads(res['response'])
        except ValueError:
            a = {'verdict': 'unsure', 'issues': 'unparsable answer'}
        v = a.get('verdict')
        verdict = 'pass' if v == 'pass' and a.get('same_food') else 'wrong' if a.get('same_food') is False or v == 'fallback' else 'reroll' if v == 'reroll' else 'unsure'
        rec = {'key': r['key'], 'roll': roll, 'h': desc_hash(r), 'check': 'qwen', 'verdict': verdict, 'why': a.get('issues', '')[:200],
               'model': VMODEL, 's': round(time.time() - t, 1)}
        log_verdict(rec)
        vs.setdefault(r['key'], []).append(rec)
        print(json.dumps(rec, ensure_ascii=False), flush=True)


def cmd_eye(path):
    """Log the second check's verdicts: a JSON file [{key, verdict: pass|fail, why}] (the roll and description are the
    row's current ones)."""
    vs = verdicts()
    rows = {r['key']: r for r in table()}
    for a in json.loads(Path(path).read_text()):
        r = rows[a['key']]
        st, roll = state(r, vs)
        if st != 'review':
            print('skip (not under review):', a['key'], st, roll)
            continue
        rec = {'key': a['key'], 'roll': roll, 'h': desc_hash(r), 'check': 'eye', 'verdict': a['verdict'], 'why': a.get('why', '')[:200],
               'model': a.get('by', 'claude')}
        log_verdict(rec)
        vs.setdefault(a['key'], []).append(rec)


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
T_PX, T_COLS, T_PER = 128, 10, 100  # thumbnails (48 / 40 px at 3x): 10 x 10 a sheet
D_PX, D_COLS, D_PER = 384, 5, 25    # the amount picture (160 px): one at a time, so bigger sheets (fewer files)
QUALITY = 72
# Thumbnail sheets are per search neighbourhood, so a search's rows touch few: a row whose name holds a common search
# word sits with that word's family (カレー: the curry rice, udon, bread and roux together), the rest with its first item's
# category (BUCKET). Detail sheets go by category only. First match wins (牛乳 before 牛, 巻き寿司 before 納豆).
FAMILY = [('curry', 'カレー'), ('sushi', '寿司 軍艦 手巻 鉄火巻 かっぱ巻 かんぴょう巻 納豆巻 太巻 恵方巻 ネギトロ巻 サラダ巻'),
          ('ramen', 'ラーメン 中華めん 中華そば つけ麺 担々麺 ちゃんぽん'), ('udon', 'うどん'), ('soba', 'そば'),
          ('pasta', 'スパゲッティ パスタ マカロニ ナポリタン カルボナーラ ペペロンチーノ ボンゴレ'), ('onigiri', 'おにぎり むすび'),
          ('don', '丼'), ('rice', 'ごはん ご飯 かゆ 粥 めし'), ('bread', 'パン トースト サンド'), ('milk', '牛乳'),
          ('egg', '卵 たまご 玉子 エッグ オムレツ'), ('tofu', '豆腐 厚揚げ 油揚げ がんもどき'), ('natto', '納豆'),
          ('pork', '豚 ポーク とんかつ ハム ベーコン ウインナー ソーセージ'), ('chicken', '鶏 チキン 唐揚げ から揚げ 焼き鳥 ささみ 手羽'),
          ('beef', '牛 ビーフ ステーキ 焼肉'), ('salmon', '鮭 さけ サーモン'), ('tuna', 'まぐろ ツナ'), ('saba', 'さば'),
          ('shrimp', 'えび エビ'), ('miso', '味噌汁 みそ汁'), ('soup', '汁 スープ'), ('salad', 'サラダ'), ('cheese', 'チーズ'),
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


def family_of(row, byid):
    """A row's thumbnail neighbourhood: its search word's family, else its first item's category."""
    names = [row['ja']] + [byid[i]['name'] for i in row['items'] if i in byid]
    for fam, words in FAMILY:
        if any(w in n for n in names[:1] for w in words.split()):
            return fam
    return BUCKET.get(byid[row['items'][0]]['cat'], 'other')


def cmd_pack():
    from PIL import Image
    vs = verdicts()
    byid = items_by_id()
    rows = [r for r in table() if state(r, vs)[0] == 'ship']
    slots = json.loads(SLOTS.read_text()) if SLOTS.exists() else {}
    slots = slots if set(slots) <= {'t', 'd'} else {}  # (the first layout, one map for both: laid out again)
    slots.setdefault('t', {})
    slots.setdefault('d', {})
    # new keys join their bucket's end, popular first, then by name: a full sheet never changes
    new = [r for r in rows if not any(r['key'] in ks for ks in slots['t'].values())]
    new.sort(key=lambda r: (-max(byid.get(i, {}).get('pop', 0) for i in r['items']), r['ja']))
    for r in new:
        slots['t'].setdefault(family_of(r, byid), []).append(r['key'])
        slots['d'].setdefault(BUCKET.get(byid[r['items'][0]]['cat'], 'other'), []).append(r['key'])
    SLOTS.write_text(json.dumps(slots, ensure_ascii=False, indent=0, sort_keys=True) + '\n')
    ship = {r['key']: r for r in rows}
    OUT.mkdir(parents=True, exist_ok=True)
    keep, sheets, cells = set(), [], {}
    for px, cols, per, tag in ((T_PX, T_COLS, T_PER, 't'), (D_PX, D_COLS, D_PER, 'd')):
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
                    cells.setdefault(k, {})[tag] = (len(sheets), x, y)
                buf = io.BytesIO()
                sh.save(buf, 'WEBP', quality=QUALITY, method=6)
                b2 = buf.getvalue()
                name = f'{tag}-{b}-{n // per}-{hashlib.sha256(b2).hexdigest()[:8]}.webp'
                if not (OUT / name).exists():
                    (OUT / name).write_bytes(b2)
                keep.add(name)
                sheets.append(name)
    keys = sorted(cells)
    kidx = {k: i for i, k in enumerate(keys)}
    index = {'v': 1, 't': T_PX, 'd': D_PX, 'sheets': sheets,
             'keys': [[*cells[k]['t'], *cells[k]['d']] for k in keys],
             'ids': {i: kidx[k] for k in keys for i in sorted(ship[k]['items']) if i in byid}}
    (OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':'), sort_keys=True))
    for p in OUT.glob('*.webp'):
        if p.name not in keep:
            p.unlink()
    shipped = [{'key': k, 'ja': ship[k]['ja'], 'desc': ship[k]['desc'], 'items': ship[k]['items'], 'roll': state(ship[k], vs)[1],
                'seed': seed(k, state(ship[k], vs)[1]), 'prompt': desc_hash(ship[k]), 'model': model_of(gen_path(ship[k], state(ship[k], vs)[1])),
                'checked': checked(ship[k], vs)} for k in keys]
    (HERE / 'shipped.json').write_text(json.dumps(shipped, ensure_ascii=False, indent=0) + '\n')
    total = sum((OUT / n).stat().st_size for n in keep)
    print(f'pack: {len(keys)} pictures for {len(index["ids"])} items, {len(sheets)} sheets, {total / 1e6:.2f} MB')


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
    if cmd in ('gen', 'verify', 'refs'):
        globals()['cmd_' + cmd](set(args[0].split(',')) if args else None)
    else:
        globals()['cmd_' + cmd](*args)
