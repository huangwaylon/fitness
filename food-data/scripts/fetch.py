#!/usr/bin/env python3
"""Network downloads for the build inputs (stdlib only; build.py never touches the network). Run by hand to
refresh a source, then `python3 -I food-data/scripts/build.py all`.
Usage (from the repo root): python3 -I food-data/scripts/fetch.py <step> [arg]
Steps (raw files go to food-data/raw/<dir>/ or $FOOD_RAW/<dir>/, gitignored and treated as untrusted data):
  off-csv [dump.csv.gz]  Open Food Facts CSV dump (~1 GB gz, streamed), Japan rows only -> off/off_jp.jsonl
  off-api [sort]         OFF search API pages 1-10 (add product_name_ja/en) -> off/pages_<sort>/page_NNNN.json
  maff                   MAFF うちの郷土料理 area + recipe pages -> maff_kyodo/{area,menu}/
  maff-en                MAFF English prefecture pages + item pages of recipes not listed there -> maff_kyodo/en/
  bodik                  BODIK CKAN CSVs: Toyonaka, Takatsuki, Kurume -> muni_*/
  tokyo                  東京都 簡単レシピ CSVs listed in data_src/tokyo_hokeniryo_recipes.json -> tokyo_hokeniryo/
  jbfd                   jbfd + jbfd-correspondence-table CSVs (GitHub, CC0) -> reliab_github/
  kalori [tag]           kalori.jp menus: the release KALORI_TAG's kalori-data.tar.gz, checked -> kalori/shard-N.jsonl
  aliases                Wikidata + ja.wikipedia readings of the dish names in out/ -> data_src/aliases_*.json
  weight-change          MEXT 表12 重量変化率 from the ebook PDF (needs `pdftotext`) -> data_src/mext_weight_change.json
Manual downloads (no stable URL): MEXT 八訂増補2023 Excel + ebook PDF (mext/main_2023_ch2.xlsx, main_2023_ebook.pdf;
https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html) and 熊谷市 学校給食献立 CSVs (muni2_kumagaya/;
https://opendata.pref.saitama.lg.jp/datasets/3144 and the earlier-year datasets linked there).
"""
import csv, gzip, hashlib, io, json, os, re, subprocess, sys, tarfile, time, urllib.error, urllib.parse, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

UA = 'CalorieTrackerJP-data/0.2 (static Japanese calorie app; offline build)'
RAW, SRC = lib.RAW, lib.SRC


def get(url, data=None, timeout=60, tries=3, accept=None):
    """GET/POST with retries; raises on final failure (a silent empty result would shrink the dataset)."""
    headers = {'User-Agent': UA}
    if accept:
        headers['Accept'] = accept
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=timeout) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError) as e:
            if i == tries - 1:
                raise SystemExit('fetch failed: %s (%s)' % (url, e))
            time.sleep(5 * (i + 1))


def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + '.tmp', 'wb') as f:
        f.write(data)
    os.replace(path + '.tmp', path)


def fetch_to(url, path, delay=0.7):
    """Download unless already present (resumable)."""
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return open(path, 'rb').read()
    data = get(url)
    save(path, data)
    time.sleep(delay)
    return data


# ---------------------------------------------------------------- Open Food Facts
OFF_CSV = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz'
OFF_KEEP = ['code', 'product_name', 'generic_name', 'brands', 'categories_tags', 'serving_size', 'serving_quantity',
            'product_quantity', 'quantity', 'last_modified_t', 'countries_tags', 'unique_scans_n', 'completeness']
OFF_NUTR = ['energy-kcal_100g', 'energy-kj_100g', 'energy_100g', 'proteins_100g', 'fat_100g', 'carbohydrates_100g',
            'salt_100g', 'sodium_100g']


def off_csv(src=None):
    """Stream-filter the CSV dump for countries_tags en:japan (redirects to an S3 host that must be reachable)."""
    raw = open(src, 'rb') if src else urllib.request.urlopen(urllib.request.Request(OFF_CSV, headers={'User-Agent': UA}),
                                                             timeout=300)
    csv.field_size_limit(1 << 30)
    rd = csv.DictReader(io.TextIOWrapper(gzip.GzipFile(fileobj=raw), encoding='utf-8', errors='replace', newline=''),
                        delimiter='\t', quoting=csv.QUOTE_NONE)
    out_p = os.path.join(RAW, 'off', 'off_jp.jsonl')
    os.makedirs(os.path.dirname(out_p), exist_ok=True)
    n = kept = 0
    with open(out_p + '.tmp', 'w', encoding='utf-8') as out:
        for row in rd:
            n += 1
            if 'en:japan' not in (row.get('countries_tags') or '').split(','):
                continue
            o = {k: row.get(k) or None for k in OFF_KEEP}
            o['categories_tags'] = [t for t in (row.get('categories_tags') or '').split(',') if t]
            o['countries_tags'] = [t for t in (row.get('countries_tags') or '').split(',') if t]
            o['nutriments'] = {k: row[k] for k in OFF_NUTR if row.get(k)}
            lm = o.get('last_modified_t')
            o['last_modified_t'] = int(lm) if lm and lm.isdigit() else 0
            out.write(json.dumps(o, ensure_ascii=False) + '\n')
            kept += 1
    os.replace(out_p + '.tmp', out_p)
    print('scanned', n, 'kept', kept, '->', out_p)


OFF_API = 'https://world.openfoodfacts.org/api/v2/search'
OFF_FIELDS = ('code,product_name,product_name_ja,product_name_en,generic_name_ja,brands,categories_tags,nutriments,'
              'serving_size,serving_quantity,product_quantity,product_quantity_unit,quantity,lang,last_modified_t')


def off_api(sort='popularity_key'):
    """sort: popularity_key, created_t, last_modified_t or completeness. Anonymous clients get pages 1-10 only and
    10 searches/min/IP: one request per 6.5 s. Pages already on disk are skipped."""
    d = os.path.join(RAW, 'off', 'pages_' + sort)
    for page in range(1, 11):
        p = os.path.join(d, 'page_%04d.json' % page)
        if os.path.exists(p):
            continue
        q = urllib.parse.urlencode({'countries_tags_en': 'japan', 'fields': OFF_FIELDS, 'page_size': 100,
                                    'page': page, 'sort_by': sort})
        j = json.loads(get(OFF_API + '?' + q, timeout=120, tries=5, accept='application/json'))
        if not j.get('products'):
            break
        save(p, json.dumps(j, ensure_ascii=False).encode('utf-8'))
        print('page', page, len(j['products']))
        if page * 100 >= j.get('count', 0):
            break
        time.sleep(6.5)


# ---------------------------------------------------------------- MAFF うちの郷土料理 (PDL1.0)
MAFF = 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/'
PREFS = ('hokkaido aomori iwate miyagi akita yamagata fukushima ibaraki tochigi gunma saitama chiba tokyo kanagawa '
         'niigata toyama ishikawa fukui yamanasi nagano gifu shizuoka aichi mie shiga kyoto osaka hyogo nara wakayama '
         'tottori shimane okayama hiroshima yamaguchi tokushima kagawa ehime kochi fukuoka saga nagasaki kumamoto oita '
         'miyazaki kagoshima okinawa').split()


def maff():
    d = os.path.join(RAW, 'maff_kyodo')
    menus = set()
    for p in PREFS:
        h = fetch_to(MAFF + 'area/%s.html' % p, os.path.join(d, 'area', p + '.html')).decode('utf-8', 'replace')
        menus.update(re.findall(r'href="\.\./menu/([0-9a-z_]+\.html)"', h))
    for m in sorted(menus):
        fetch_to(MAFF + 'menu/' + m, os.path.join(d, 'menu', m))
    print(len(menus), 'recipe pages')


def maff_en():
    import recipes_text
    d = os.path.join(RAW, 'maff_kyodo')
    for p in PREFS:
        fetch_to('https://www.maff.go.jp/e/policies/market/k_ryouri/search_menu/pref/%s/index.html' % p,
                 os.path.join(d, 'en', p + '.html'))
    have = recipes_text.maff_english_names(os.path.join(d, 'en'))
    for r in recipes_text.parse_maff(d):
        m = re.search(r'/search_menu/(\d+)/', r.get('en_url') or '')
        if m and m.group(1) not in have:
            fetch_to(r['en_url'], os.path.join(d, 'en', 'item_%s.html' % m.group(1)))


# ---------------------------------------------------------------- municipal open data
BODIK = [  # (CKAN dataset id, resource-name regex, target dir)
    ('272035_school_lunch', r'syogakko', 'muni_toyonaka'), ('272035_school_lunch', r'chugakko', 'muni_toyonaka_chu'),
    ('272078_gakkokyusyoku', r'gakkokyusyokurecipi', 'muni_takatsuki'),
    ('402036_0009100_00005', r'ryori_eiyouka', 'muni_kurume'),
]


def bodik():
    for ds, pat, sub in BODIK:
        meta = json.loads(get('https://data.bodik.jp/api/3/action/package_show?id=' + ds))
        for res in meta['result']['resources']:
            url = res.get('url') or ''
            name = os.path.basename(urllib.parse.urlparse(url).path)
            if re.search(pat, name) and name.lower().endswith('.csv'):
                fetch_to(url, os.path.join(RAW, sub, name))
                print(sub, name)


def tokyo():
    base = 'https://www.opendata.metro.tokyo.lg.jp/fukushihoken/R3/'
    for r in lib.load_json(os.path.join(SRC, 'tokyo_hokeniryo_recipes.json'))['recipes']:
        fetch_to(base + r['csv'] + '.csv', os.path.join(RAW, 'tokyo_hokeniryo', 'csv_%s.csv' % r['csv']))


def jbfd():
    gh = 'https://raw.githubusercontent.com/shnkgw-rincom/'
    for repo, f, sub in (('jbfd', 'jbfd_boxes_v0.1.csv', 'jbfd'),
                         ('jbfd-correspondence-table', 'correspondence_v0.1.csv', 'jbfd_corr')):
        save(os.path.join(RAW, 'reliab_github', sub, f), get(gh + repo + '/main/data/' + f))


# Kalori's data: a release of this repo (.github/workflows/kalori-scrape.yml), pinned so each shipped kalori.json has one
# immutable input; bump it to refresh (docs/ops/runbook.md "Refresh Kalori").
KALORI_TAG = 'kalori-2026-11-14'
KALORI_URL = 'https://github.com/huangwaylon/fitness/releases/download/%s/%s'
KALORI_TAR = 'kalori-data.tar.gz'
KALORI_SHARD = re.compile(r'^shards/(shard-\d{1,2}\.jsonl)$')


def kalori_unpack(tar_bytes, sums, dest):
    """The release's tarball, checked against its SHA256SUMS and its coverage.json (complete), its
    shards/shard-N.jsonl written to dest (the old ones removed first). Returns {shard file: lines}."""
    want = next((ln.split()[0] for ln in sums.decode('utf-8').splitlines()
                 if ln.split()[1:] and ln.split()[-1].lstrip('*') == KALORI_TAR), None)
    if not want:
        raise SystemExit('kalori: %s not in SHA256SUMS' % KALORI_TAR)
    if hashlib.sha256(tar_bytes).hexdigest() != want.lower():
        raise SystemExit('kalori: %s does not match SHA256SUMS' % KALORI_TAR)
    shards, cov = {}, None
    with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode='r:gz') as tf:
        for m in tf.getmembers():   # by name, never extractall: an archive is untrusted data
            name = m.name[2:] if m.name.startswith('./') else m.name
            hit = KALORI_SHARD.match(name)
            if m.isfile() and (hit or name == 'coverage.json'):
                data = tf.extractfile(m).read()
                if hit:
                    shards[hit.group(1)] = data
                else:
                    cov = json.loads(data)
    summary = (cov or {}).get('summary', cov or {})
    if summary.get('complete') is not True:
        raise SystemExit('kalori: the release\'s coverage.json is not complete; refusing it')
    if not shards:
        raise SystemExit('kalori: no shards/shard-N.jsonl in %s' % KALORI_TAR)
    os.makedirs(dest, exist_ok=True)
    for f in os.listdir(dest):
        if re.match(r'^shard-\d+\.jsonl(\.tmp)?$', f):
            os.remove(os.path.join(dest, f))
    for f, data in shards.items():
        save(os.path.join(dest, f), data)
    return {f: shards[f].count(b'\n') for f in sorted(shards)}


def kalori(tag=KALORI_TAG):
    """The pinned release's shards, whole each time (a newer release replaces them all)."""
    sums = get(KALORI_URL % (tag, 'SHA256SUMS'))
    tar_bytes = get(KALORI_URL % (tag, KALORI_TAR), timeout=300)
    dest = os.path.join(RAW, 'kalori')
    for f, n in kalori_unpack(tar_bytes, sums, dest).items():
        print(f, n, 'lines')
    print(tag, '->', dest)


# ---------------------------------------------------------------- aliases (frozen in data_src/)
def dish_names():
    """Base names (parentheticals stripped) of every non-MEXT, non-OFF, non-Kalori item in out/."""
    names = []
    for f in sorted(os.listdir(lib.OUT)):
        if f.endswith('.json') and f not in ('foods.json', 'products.json', 'kalori.json', 'index.json', 'verify.json'):
            for it in lib.load_json(os.path.join(lib.OUT, f)).get('items', []):
                n = re.sub(r'\s.*$', '', re.sub(r'[（(][^）)]*[）)]', '', it['name']).strip())
                if 1 < len(n) <= 15 and n not in names:
                    names.append(n)
    return names


def cached(cache, key, fetch):
    p = os.path.join(cache, hashlib.sha1(key.encode()).hexdigest() + '.json')
    if not os.path.exists(p):
        save(p, fetch())
        time.sleep(1.0)
    return lib.load_json(p)


def aliases():
    names = dish_names()
    # Wikipedia: title, English langlink and the lead-sentence kana reading 「見出し（よみ）」
    api, cache, res = 'https://ja.wikipedia.org/w/api.php', os.path.join(RAW, 'wikipedia'), {}
    for i in range(0, len(names), 20):
        batch = names[i:i + 20]
        q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'formatversion': 2, 'redirects': 1,
                                    'titles': '|'.join(batch), 'prop': 'langlinks|pageprops|extracts', 'lllang': 'en',
                                    'lllimit': 'max', 'ppprop': 'disambiguation', 'exintro': 1, 'explaintext': 1,
                                    'exsentences': 1, 'exlimit': 20})
        qd = cached(cache, q, lambda: get(api + '?' + q)).get('query', {})
        norm = {x['from']: x['to'] for x in qd.get('normalized', [])}
        redir = {x['from']: x['to'] for x in qd.get('redirects', [])}
        pages = {p['title']: p for p in qd.get('pages', [])}
        for n in batch:
            t = redir.get(norm.get(n, n), norm.get(n, n))
            p = pages.get(t)
            if not p or p.get('missing') or 'disambiguation' in (p.get('pageprops') or {}):
                continue
            ent = {'wp': p['title']}
            if p.get('langlinks'):
                ent['en'] = p['langlinks'][0].get('title')
            m = re.match(r'^[^（(]{1,30}[（(]([ぁ-ゖァ-ヺー・、\s]+)[、,）)]', p.get('extract') or '')
            if m:
                ent['reading' if p['title'] == n else 'wp_reading'] = m.group(1).split('、')[0].strip()
            if p['title'] != n:
                ent['alias'] = p['title']
            res[n] = ent
    lib.write_json(os.path.join(SRC, 'aliases_wikipedia.json'), {
        'source': 'wikipedia_ja', 'license': 'CC BY-SA 4.0 (Wikipedia); titles/readings are short factual data',
        'attribution': 'ウィキペディア日本語版（https://ja.wikipedia.org/）の記事名・読み・英語版リンクから作成', 'names': res})
    # Wikidata: food items only (P31/P279* Q2095) whose ja label or alias is one of the names
    ep, cache = 'https://query.wikidata.org/sparql', os.path.join(RAW, 'wikidata')

    def sparql(q):
        return cached(cache, q, lambda: get(ep, data=urllib.parse.urlencode({'query': q}).encode(), timeout=180,
                                            accept='application/sparql-results+json'))['results']['bindings']

    def val(b, k):
        return b[k]['value'] if k in b else ''
    food = {val(b, 'c').rsplit('/', 1)[1] for b in sparql('SELECT ?c WHERE { ?c wdt:P279* wd:Q2095 }')}
    # query text kept byte-identical to the original script so raw/wikidata/ cache entries stay valid
    fields = '''?item (GROUP_CONCAT(DISTINCT ?cls; separator="|") AS ?classes) (SAMPLE(?jl) AS ?jlabel)
  (GROUP_CONCAT(DISTINCT ?kana; separator="|") AS ?kanas) (SAMPLE(?el) AS ?elabel)
  (GROUP_CONCAT(DISTINCT ?ja_alt; separator="|") AS ?jalts)'''
    opt = '''
  { ?item wdt:P31 ?cls } UNION { ?item wdt:P279 ?cls }
  OPTIONAL { ?item rdfs:label ?jl FILTER(LANG(?jl) = "ja") }
  OPTIONAL { ?item wdt:P1814 ?kana }
  OPTIONAL { ?item rdfs:label ?el FILTER(LANG(?el) = "en") }
  OPTIONAL { ?item skos:altLabel ?ja_alt FILTER(LANG(?ja_alt) = "ja") }'''
    items, by_name = {}, {}

    def ingest(rows, keyed):
        for b in rows:
            qid = val(b, 'item').rsplit('/', 1)[1]
            if not {c.rsplit('/', 1)[1] for c in val(b, 'classes').split('|') if c} & food:
                continue
            rec = items.setdefault(qid, {'qid': qid, 'label': val(b, 'jlabel'), 'reading': [], 'en': val(b, 'elabel') or None,
                                         'aliases': []})
            rec['reading'] += [k for k in val(b, 'kanas').split('|') if k and k not in rec['reading']]
            rec['aliases'] += [a for a in val(b, 'jalts').split('|') if a and a not in rec['aliases'] and a != rec['label']]
            if keyed:
                by_name.setdefault(val(b, 'n'), []).append(qid)
    for i in range(0, len(names), 80):
        lits = ' '.join('"%s"@ja' % n.replace('\\', '').replace('"', '') for n in names[i:i + 80])
        ingest(sparql('SELECT ?n %s WHERE { VALUES ?n { %s } { ?item rdfs:label ?n } UNION { ?item skos:altLabel ?n } %s } '
                      'GROUP BY ?n ?item' % (fields, lits, opt)), True)
    for cond in ('?item wdt:P2012 wd:Q5287 .', '?item wdt:P495 wd:Q17 . ?item wdt:P31/wdt:P279* wd:Q746549 .'):
        ingest(sparql('SELECT %s WHERE { %s %s } GROUP BY ?item' % (fields, cond, opt)), False)   # Japanese cuisine
    out = {}
    for n, qids in by_name.items():   # prefer the item whose ja label equals the name
        out[n] = {k: v for k, v in items[sorted(set(qids), key=lambda x: (items[x]['label'] != n, x))[0]].items() if v}
    for rec in items.values():
        if rec['label'] and re.search(r'[一-龥ぁ-ゖァ-ヺ]', rec['label']):
            out.setdefault(rec['label'], {k: v for k, v in rec.items() if v})
    out = dict(sorted(out.items()))
    lib.write_json(os.path.join(SRC, 'aliases_wikidata.json'), {
        'source': 'wikidata', 'license': 'CC0 1.0 (Wikidata)', 'url': 'https://www.wikidata.org/',
        'note': 'reading = P1814 (kana); en = English label; aliases = Japanese alternative labels. Food items only.',
        'names': out})
    print(len(res), 'wikipedia names;', len(out), 'wikidata names')


# ---------------------------------------------------------------- MEXT 表12 weight change (frozen in data_src/)
def weight_change():
    """Rows '<食品番号> <name> <method> ... <rate>' of 表12 in `pdftotext -layout` output; raw_id = the 生/乾 item
    with the same name stem (heuristic; rice paired by hand)."""
    txt = subprocess.run(['pdftotext', '-layout', os.path.join(RAW, 'mext', 'main_2023_ebook.pdf'), '-'],
                         check=True, capture_output=True).stdout.decode('utf-8')
    lines = txt.split('\n')
    start = next(i for i, l in enumerate(lines) if l.lstrip('\x0c ').startswith('表12') and '重量変化率' in l)
    mext = lib.mext_foods(lib.mext_rows())
    by_name = {}
    for k, v in mext.items():
        by_name.setdefault(v['name'], k)
    items = {}
    for l in lines[start:]:
        m = re.match(r'^(\d{5})\s+(.*)$', l)
        if not m or m.group(1) in items or m.group(1) not in mext:
            continue
        fid, rest = m.groups()
        toks, rm = rest.split(), re.search(r'\(?(\d+(?:\.\d+)?)\)?\s*$', rest)
        if not rm or len(toks) < 3 or not 5 <= float(rm.group(1)) <= 1500:
            continue
        rate = float(rm.group(1))
        method = {'油いた': '油いため', '水さら': '水さらし'}.get(toks[1], toks[1])
        parts, raw = mext[fid]['name'].split(' '), None
        for cut in (1, 2):
            if len(parts) > cut:
                raw = next((by_name[' '.join(parts[:-cut]) + ' ' + w] for w in ('生', '乾', '乾燥', '干し', '素干し')
                            if ' '.join(parts[:-cut]) + ' ' + w in by_name), None)
                if raw:
                    break
        items[fid] = {'id': fid, 'name': mext[fid]['name'], 'method': method, 'rate': int(rate) if rate == int(rate) else rate,
                      'raw_id': raw, 'raw_name': mext[raw]['name'] if raw else None}
    for cooked, rawid in (('01088', '01083'), ('01085', '01080'), ('01168', '01083')):
        if cooked in items and not items[cooked]['raw_id']:
            items[cooked].update(raw_id=rawid, raw_name=mext[rawid]['name'])
    lib.write_json(os.path.join(SRC, 'mext_weight_change.json'), {
        'source': 'mext_weight_change', 'label': '日本食品標準成分表（八訂）増補2023年 表12 調理方法の概要および重量変化率表',
        'attribution': '日本食品標準成分表（八訂）増補2023年から引用（表12を加工して作成）',
        'license': '公共データ利用規約1.0 / CC BY 4.0 compatible', 'url': 'https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html',
        'note': 'rate = 調理後重量 / 調理前重量 x100 (%). raw_id paired heuristically by name; null if not found.',
        'items': list(items.values())})
    print(len(items), 'items')


STEPS = {'off-csv': off_csv, 'off-api': off_api, 'maff': maff, 'maff-en': maff_en, 'bodik': bodik, 'tokyo': tokyo,
         'jbfd': jbfd, 'kalori': kalori, 'aliases': aliases, 'weight-change': weight_change}

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in STEPS:
        print(__doc__)
        sys.exit(2)
    STEPS[sys.argv[1]](*sys.argv[2:])
