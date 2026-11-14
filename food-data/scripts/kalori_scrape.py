#!/usr/bin/env python3
"""kalori.jp chain menus -> shard-N.jsonl.gz (docs/food-data.md "Kalori"): a sharded, throttled, incremental scraper
(stdlib only) run by .github/workflows/kalori-scrape.yml, its output kalori_convert.py's input.

Usage (from the repo root): python3 -I food-data/scripts/kalori_scrape.py <command> ...
  canary                   the shops index, a listing, a product with 推定 badges and a drink page still parse
  sitemap --out F          the sitemap's ja product lastmods -> F, {"shop/id": lastmod}
  shard N --shards 20 --total-rate R --budget-minutes M --since ISO --sitemap F --state state-N.json
        --data shard-N.jsonl.gz [--only-shops a,b] [--max-requests K] [--refetch-before ISO] [--recheck-no-nutrition]
  coverage --dir D --sitemap F --out coverage.json [--since ISO] [--strict]
  compact --dir D --out DIR    one line a product (its latest), at its first line's place; D may hold the old
                               scraper's shard-N.jsonl + state/shard-N.json
  diff --old DIR --new DIR --out diff.json
The base URL is $KALORI_BASE (a fake site in the tests), else https://kalori.jp.

A shard owns the shops with crc32(slug) % shards == N. A run: the shops index (shops, their categories); the
in-shard canary (a product this shard holds with a table must still show one); discovery of each shop not
discovered since --since (its listing pages until a 404, the ids checked against the stated 全N品, re-walked up to
MAX_PASSES on a mismatch); then the product pages `wanted` says: new, a changed sitemap lastmod, listed flipped, an
older parser, a retryable failure, --refetch-before, or (--recheck-no-nutrition) a final no-nutrition. A product
held but in neither its (whole) listing nor the sitemap gets a gone line: its last record, listed false, gone true;
so does one whose page is a 404 (once: asked again on a new lastmod), and every product of a shop off the index whose
listing is a 404 (the shop removed). A product that stops giving a record (a final no-nutrition, failed for good)
keeps its last one and isn't asked again at that lastmod.

--data is gzip JSONL (plain without .gz), append-only, one line a fetch (record v2): {shop, id, url, lastmod,
fetched_at, parser, listed, name, shop_name, shop_category, genre, ended, image_id, table, nutrients:
{kcal|p|f|c|sugar|fiber|salt: {v, est}} (only the rows shown), gone?}. Each save rewrites it (temp + rename); one
cut off by a kill is rewritten from its whole lines on load. Per product
the latest fetched_at wins (the later line on a tie), as in kalori_convert.read_rows. --state: {"shops": {slug:
discovery}, "products": {"slug/id": a failure or a final no-nutrition}, "meta": {index, owned, since}}.

A page without the table: its kcal in the title is layout drift (nothing recorded); else values in the JSON-LD or the
meta description (the site hides an all-zero table: 0 kcal teas) make a record with `table: false` and every est
true; else a final no-nutrition, its title kept.

Exit codes: 0 done, or the budget or --max-requests reached (resumed next run); 1 a crash, or coverage incomplete
(--strict) or broken; 2 MAX_429 HTTP 429s; 3 MAX_NET_ERRORS network errors in a row; 4 layout drift (the canary, a
listing page 1 without a product link, DRIFT_STREAK drift pages in a row, no record in the first FIRST_FETCHES pages):
this run's failure and no-nutrition marks undone; 5 more new no-nutrition marks than max(25, 2% of the fetches),
undone; 6 a diff over its limits. A shard's state and data are saved whatever stops it (signals too).
"""
import argparse, glob, gzip, json, os, re, shutil, signal, sys, time, urllib.error, urllib.request, zlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

CANONICAL = 'https://kalori.jp'
UA = 'Mozilla/5.0 (compatible; personal-poller; +https://github.com/huangwaylon/fitness)'
SHARDS = 20
MAX_429 = int(os.environ.get('MAX_429', '3'))
MAX_ATTEMPTS = int(os.environ.get('MAX_ATTEMPTS', '3'))
MAX_PASSES = int(os.environ.get('MAX_PASSES', '3'))
MAX_NET_ERRORS = int(os.environ.get('MAX_NET_ERRORS', '10'))
MAX_PAGES = 500
REDISCOVER_H = 24       # without --since: a shop's listing walked again after this
DRIFT_STREAK = 5        # pages in a row with kcal in the title and no table
FIRST_FETCHES = 30      # product pages (200s) a run may answer without one record
NO_NUTRITION_MIN, NO_NUTRITION_SHARE = 25, 0.02   # new no-nutrition marks a run: over max(25, 2% of fetches)
# Bump when parsing changes: failures and no-nutrition marks from an older parser are retried; records too when the
# change alters what a page with a table gives (then RECORDS_FROM = PARSER_VERSION). 3: values of table-less pages.
PARSER_VERSION = 3
RECORDS_FROM = 2        # records from this parser on stand; a line without `parser` is 2's (the test repo's scraper)
NO_NUTRITION = 'no nutrition published'
MAX_CHANGED, MAX_MISSING = 0.15, 0.05   # diff: the share of old products with changed values / gone or missing
# canary pages (a 404 one is skipped: the product ended, not drift): a product with 推定 badges, a drink
CANARY_LISTING = 'fujisoba'
CANARY_EST = ('fujisoba', '2764908')
CANARY_DRINK = ('starbucks', '3106035')

LDJSON = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
TITLE = re.compile(r'<title>(.*?)</title>', re.S)
META_DESC = re.compile(r'<meta name="description" content="([^"]*)"')
EXPECTED = re.compile(r'全([\d,]+)品')
SHOP_LINK = re.compile(r'href="/ja/shops/([^/"]+)/products/"')
SHOP_SECTION = re.compile(r'data-shop-category-section="([^"]+)"')
PRODUCT_PATH = re.compile(r'/ja/shops/([^/]+)/products/(\d+)/$')
LISTING_PRODUCT_LINK = re.compile(r'/ja/shops/([^/"]+)/products/(\d+)/')
PAGE_LINK = re.compile(r'/products/page/(\d+)/')
ROW = re.compile(r'>\s*(カロリー|タンパク質|脂質|炭水化物|糖質|食物繊維|塩分)\s*<(.*?)(?:kcal|g)\s*<', re.S)
ROW_KEY = {'カロリー': 'kcal', 'タンパク質': 'p', '脂質': 'f', '炭水化物': 'c', '糖質': 'sugar', '食物繊維': 'fiber',
           '塩分': 'salt'}
EST_BADGE = 'title="AIによる推定値"'   # the similar-products cards' badge says 推定値です: not matched
GENRE = re.compile(r'href="/ja/shops/[^/"]+/products/\?genre=([a-z0-9-]+)"')
IMAGE_ID = re.compile(r'/generated/(?:g/)?(\d+)\.webp$')
NUM = re.compile(r'-?\d+(?:\.\d+)?')
KCAL_IN_TITLE = re.compile(r'\d[\d,.]*\s*kcal')
# the page's own values lead the description (a similar product's follow, in brackets)
META_VALUES = re.compile(r'栄養成分(?:情報)?。([\d.]+)kcal、P([\d.]+)g、F([\d.]+)g、C([\d.]+)g')
LD_VALUES = re.compile(r'カロリー([\d.]+)kcal、タンパク質([\d.]+)g、脂質([\d.]+)g、炭水化物([\d.]+)g')
SODIUM_PER_SALT_G = 393.4   # mg of sodium in 1 g of salt
SITEMAP_NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def ts(s):
    """An ISO time (Z or an offset; a bare date is midnight UTC) as epoch seconds."""
    d = datetime.fromisoformat(str(s).replace('Z', '+00:00'))
    return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)).timestamp()


def key_of(shop, pid):
    return '%s/%s' % (shop, pid)


# ---------- parsing ----------
def parse_shops_index(html):
    """Shop slugs linked from /ja/shops/, in order."""
    return list(dict.fromkeys(SHOP_LINK.findall(html)))


def parse_shop_categories(html):
    """{slug: Kalori's shop category}: the index groups shops under data-shop-category-section."""
    secs = [(m.start(), m.group(1)) for m in SHOP_SECTION.finditer(html)] + [(len(html), None)]
    out = {}
    for (a, cat), (b, _) in zip(secs, secs[1:]):
        for slug in SHOP_LINK.findall(html[a:b]):
            out.setdefault(slug, cat)
    return out


def parse_listing(html, slug):
    """(the stated total 全N品 or None, the shop's product ids linked, the highest page linked). Every same-shop link
    counts (the ItemList JSON-LD stops at 20 of 24; page 1's popular items are harmless: the union is checked)."""
    m = TITLE.search(html)
    exp = EXPECTED.search(m.group(1)) if m else None
    ids = {pid for s, pid in LISTING_PRODUCT_LINK.findall(html) if s == slug}
    return (int(exp.group(1).replace(',', '')) if exp else None, ids,
            max((int(p) for p in PAGE_LINK.findall(html)), default=1))


def _num(s):
    m = NUM.search(str(s or ''))
    return float(m.group(0)) if m else None


def parse_nutrient_table(html):
    """{key: (shown value or None, 推定 badge?)} for the rows the page shows. The table starts at its first カロリー row
    (not at この商品: the chart legend before it says it, an ended page doesn't)."""
    first = next((m.start() for m in ROW.finditer(html) if m.group(1) == 'カロリー'), None)
    if first is None:
        return {}
    rows = {}
    for m in ROW.finditer(html[first - 1:first + 8000]):
        key = ROW_KEY[m.group(1)]
        if key not in rows:
            vals = NUM.findall(re.sub(r'<[^>]+>', ' ', m.group(2)))
            rows[key] = (float(vals[-1]) if vals else None, EST_BADGE in m.group(2))
    return rows


def menu_item(html):
    """The MenuItem (or Product) JSON-LD block, None without one."""
    for m in LDJSON.finditer(html):
        try:
            b = json.loads(m.group(1))
        except ValueError:
            continue
        if isinstance(b, dict) and b.get('@type') in ('MenuItem', 'Product'):
            return b
    return None


def title_of(html):
    m = TITLE.search(html)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''


def tableless_values(html, item):
    """{kcal, p, f, c} a page without a table still states (the JSON-LD nutrition, its description, the meta
    description), None when none does. Not fibre or salt: the JSON-LD says 0 for the ones it lacks."""
    nut = (item or {}).get('nutrition') or {}
    ld = [_num(nut.get(k)) for k in ('calories', 'proteinContent', 'fatContent', 'carbohydrateContent')]
    if ld[0] is not None:
        return {k: v for k, v in zip(('kcal', 'p', 'f', 'c'), ld) if v is not None}
    m = LD_VALUES.search(str((item or {}).get('description') or ''))
    if not m:
        d = META_DESC.search(html)
        m = d and META_VALUES.search(d.group(1))
    return dict(zip(('kcal', 'p', 'f', 'c'), (float(x) for x in m.groups()))) if m else None


def product_fields(html, item, rows=None):
    """A record's page fields: name, shop_name, genre, ended, image_id, table, nutrients. nutrients: the rows shown,
    each {v, est}, the value the JSON-LD's (exact; salt from sodium mg) unless it has none or disagrees; without a
    table the tableless_values, all est."""
    rows = parse_nutrient_table(html) if rows is None else rows
    nut = item.get('nutrition') or {}
    nutrients = {}
    if rows:
        ld = {'kcal': _num(nut.get('calories')), 'p': _num(nut.get('proteinContent')),
              'f': _num(nut.get('fatContent')), 'c': _num(nut.get('carbohydrateContent')),
              'fiber': _num(nut.get('fiberContent'))}
        sodium = _num(nut.get('sodiumContent'))
        if sodium is not None:
            ld['salt'] = round(sodium / SODIUM_PER_SALT_G, 2)
        for k, (shown, est) in rows.items():
            v = ld.get(k)
            if v is None or (k == 'salt' and shown is not None and abs(v - shown) > 0.06):
                v = shown
            if v is not None:
                nutrients[k] = {'v': v, 'est': est}
    else:
        nutrients = {k: {'v': v, 'est': True} for k, v in (tableless_values(html, item) or {}).items()}
    g = GENRE.search(html)
    img = IMAGE_ID.search(str(item.get('image') or ''))
    return {'name': (item.get('name') or '').strip(), 'shop_name': item.get('menuAddOn'),
            'genre': g.group(1) if g else None, 'ended': '販売終了' in title_of(html),
            'image_id': int(img.group(1)) if img else None, 'table': bool(rows), 'nutrients': nutrients}


def classify(html):
    """A product page: ('record', fields) | ('drift', why) | ('no_nutrition', title) | ('failed', why)."""
    rows = parse_nutrient_table(html)
    item = menu_item(html)
    title = title_of(html)
    if rows and 'kcal' in rows:
        return ('record', product_fields(html, item, rows)) if item else ('drift', 'a table, no MenuItem JSON-LD')
    if KCAL_IN_TITLE.search(title):
        return 'drift', 'kcal in the title, no table'
    if item is None:
        return 'failed', '200 without MenuItem JSON-LD'
    fields = product_fields(html, item, {})
    return ('record', fields) if 'kcal' in fields['nutrients'] else ('no_nutrition', title[:80])


def parse_sitemap(xml_bytes):
    """(child sitemap URLs, {(slug, id): lastmod} of its ja product URLs) of a sitemap or sitemap index."""
    root = ET.fromstring(xml_bytes)
    kids = [loc.text.strip() for loc in root.findall('s:sitemap/s:loc', SITEMAP_NS)]
    out = {}
    for u in root.findall('s:url', SITEMAP_NS):
        loc = u.findtext('s:loc', default='', namespaces=SITEMAP_NS).strip()
        m = PRODUCT_PATH.search(loc)
        if m and '/ja/' in loc:
            out[(m.group(1), m.group(2))] = (u.findtext('s:lastmod', default='', namespaces=SITEMAP_NS) or '').strip()
    return kids, out


# ---------- files ----------
def _dump_map(d):
    return '{\n' + ',\n'.join('%s:%s' % (json.dumps(k), json.dumps(v, ensure_ascii=False, sort_keys=True,
                                                                    separators=(',', ':')))
                              for k, v in sorted(d.items())) + '\n}'


def write_state(path, state):
    """Atomic; one shop or product a line (diffable)."""
    text = '{' + ',\n'.join('"%s":%s' % (name, _dump_map(state[name])) for name in sorted(state)) + '}\n'
    with open(path + '.tmp', 'w', encoding='utf-8') as fh:
        fh.write(text)
    os.replace(path + '.tmp', path)


def read_state(path):
    st = {}
    if os.path.exists(path):
        with open(path, encoding='utf-8') as fh:
            st = json.load(fh)
    for k in ('shops', 'products', 'meta'):
        st.setdefault(k, {})
    return st


def read_lines(path, clean=None):
    """[(raw line, record or None)] of a shard file, gzip (.gz: members concatenated) or plain; None: a line that
    doesn't parse. A gzip cut short (a killed run) keeps what decodes; `clean` (a list) gets False then."""
    out = []
    if not os.path.exists(path):
        return out
    fh = gzip.open(path, 'rt', encoding='utf-8') if path.endswith('.gz') else open(path, encoding='utf-8')
    try:
        for line in fh:
            line = line.rstrip('\n')
            if line.strip():
                try:
                    r = json.loads(line)
                except ValueError:
                    r = None
                out.append((line, r if isinstance(r, dict) else None))
    except (EOFError, OSError, zlib.error):
        if clean is not None:
            clean.append(False)
    finally:
        fh.close()
    return out


def write_lines(path, lines):
    """The whole shard file, atomic (a temp file renamed): never a cut member, never a line twice."""
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    data = ''.join(l + '\n' for l in lines).encode('utf-8')
    with open(path + '.tmp', 'wb') as fh:
        fh.write(gzip.compress(data, mtime=0) if path.endswith('.gz') else data)
    os.replace(path + '.tmp', path)


def is_v2(r):
    return r is not None and isinstance(r.get('nutrients'), dict) and bool(r.get('shop')) and r.get('id') is not None


def latest(lines):
    """{(shop, id): index of its winning line}: the latest fetched_at, the later line on a tie (read_rows' rule)."""
    win = {}
    for i, (_, r) in enumerate(lines):
        if is_v2(r):
            k = (r['shop'], str(r['id']))
            if k not in win or str(r.get('fetched_at') or '') >= str(lines[win[k]][1].get('fetched_at') or ''):
                win[k] = i
    return win


def shard_paths(d):
    """{n: shard file} in d: shard-N.jsonl.gz, else shard-N.jsonl."""
    out = {}
    for p in glob.glob(os.path.join(d, 'shard-*.jsonl')) + glob.glob(os.path.join(d, 'shard-*.jsonl.gz')):
        m = re.match(r'shard-(\d+)\.jsonl(\.gz)?$', os.path.basename(p))
        if m and (int(m.group(1)) not in out or m.group(2)):
            out[int(m.group(1))] = p
    return dict(sorted(out.items()))


def state_file(d, n):
    """state-N.json in d, else the old scraper's state/shard-N.json; None without either."""
    for p in (os.path.join(d, 'state-%d.json' % n), os.path.join(d, 'state', 'shard-%d.json' % n)):
        if os.path.exists(p):
            return p
    return None


def read_dataset(d):
    """{(shop, id): winning record} over d's shard files."""
    out = {}
    for p in shard_paths(d).values():
        lines = read_lines(p)
        for k, i in latest(lines).items():
            out[k] = lines[i][1]
    return out


def load_sitemap_file(path):
    with open(path, encoding='utf-8') as fh:
        return {tuple(k.split('/', 1)): v for k, v in json.load(fh).items()}


def write_sitemap_file(path, sm):
    text = '{\n' + ',\n'.join('%s:%s' % (json.dumps(key_of(*k)), json.dumps(v)) for k, v in sorted(sm.items()))
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(text + '\n}\n')


# ---------- HTTP ----------
class Stop(Exception):
    def __init__(self, reason, code=0):
        super().__init__(reason)
        self.reason, self.code = reason, code


class Http:
    """GETs one per `interval` s at most, within the time budget and the request cap, 429 and network limits."""

    def __init__(self, base, interval=0.0, budget_s=None, max_requests=None, log=print):
        self.base, self.interval, self.max_requests, self.log = base.rstrip('/'), interval, max_requests, log
        self.deadline = None if budget_s is None else time.monotonic() + budget_s
        self.next_at = 0.0
        self.n = self.n429 = self.net_streak = 0

    def get(self, path):
        """(status, text), None on a network error; raises Stop on the budget, the cap or a limit."""
        if self.deadline is not None and time.monotonic() > self.deadline:
            raise Stop('time budget')
        if self.max_requests is not None and self.n >= self.max_requests:
            raise Stop('request limit')
        wait = self.next_at - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        self.next_at = max(time.monotonic(), self.next_at) + self.interval
        self.n += 1
        url = path if path.startswith('http') else self.base + path
        headers = {}
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60) as r:
                status, body = r.status, r.read()
        except urllib.error.HTTPError as e:
            with e:
                status, body, headers = e.code, e.read(), e.headers
        except (urllib.error.URLError, OSError) as e:
            self.net_streak += 1
            self.log('  net error %s: %s' % (url, type(e).__name__))
            if self.net_streak >= MAX_NET_ERRORS:
                raise Stop('%d network errors in a row' % self.net_streak, 3)
            return None
        self.net_streak = 0
        if status == 429:
            self.n429 += 1
            self.log('  HTTP 429 (%d/%d) %s Retry-After=%s after %d requests' % (
                self.n429, MAX_429, url, headers.get('Retry-After'), self.n))
            if self.n429 >= MAX_429:
                raise Stop('%d HTTP 429 responses' % self.n429, 2)
            try:
                delay = float(headers.get('Retry-After', '30'))
            except ValueError:
                delay = 30.0
            time.sleep(min(max(delay, 0), 120))
            self.next_at = time.monotonic() + self.interval
            if self.deadline is not None and time.monotonic() > self.deadline:
                raise Stop('time budget')
        return status, body.decode('utf-8', 'replace')

    def sitemap(self):
        """{(slug, id): lastmod} from sitemap-index.xml and its children (one on kalori.jp read off the base)."""
        r = self.get('/sitemap-index.xml')
        if r is None or r[0] != 200:
            raise OSError('sitemap index: %s' % (r and r[0]))
        kids, out = parse_sitemap(r[1].encode('utf-8'))
        for loc in kids:
            r = self.get(self.base + loc[len(CANONICAL):] if loc.startswith(CANONICAL) else loc)
            if r is None or r[0] != 200:
                raise OSError('sitemap %s: %s' % (loc, r and r[0]))
            out.update(parse_sitemap(r[1].encode('utf-8'))[1])
        return out


def listing_path(slug, page=1):
    return '/ja/shops/%s/products/' % slug + ('page/%d/' % page if page > 1 else '')


def product_path(slug, pid):
    return '/ja/shops/%s/products/%s/' % (slug, pid)


def base_url():
    return (os.environ.get('KALORI_BASE') or CANONICAL).rstrip('/')


def owner(slug, shards=SHARDS):
    return zlib.crc32(slug.encode()) % shards


# ---------- shard ----------
class Shard:
    def __init__(self, http, n, shards, state, data, sitemap=None, since=None, recheck=False, refetch_before=None,
                 only=None, log=print):
        self.http, self.n, self.shards, self.log = http, n, shards, log
        self.state_path, self.data_path = state, data
        self.sitemap, self.since, self.recheck, self.refetch_before = sitemap, since, recheck, refetch_before
        self.only = only
        self.state = read_state(state)
        self.shops, self.failures = self.state['shops'], self.state['products']
        self.failures0 = json.loads(json.dumps(self.failures))   # restored on a drift: no poisoned state
        clean = []
        lines = read_lines(data, clean)
        if clean:   # a cut-off gzip member (a killed run): rewritten from the lines that decoded
            lines = [(l, r) for l, r in lines if r is not None]
            write_lines(data, [l for l, _ in lines])
            log('WARNING: %s was cut off; rewritten with its %d whole lines' % (data, len(lines)))
        self.lines = [l for l, _ in lines]
        self.have = {key_of(*k): lines[i][1] for k, i in latest(lines).items()}
        self.order = list(dict.fromkeys(key_of(r['shop'], r['id']) for _, r in lines if is_v2(r)))
        self.pending = []    # records not yet in self.lines
        self.new_nonut = {}  # key -> the entry it replaced (None: none)
        self.drift = self.answered = 0
        self.dirty = False
        self.index = set()
        self.counts = {'fetched': 0, 'ok': 0, 'failed': 0, 'no_nutrition': 0, 'gone': 0, 'drift': 0}

    def save(self):
        # the whole file rewritten (temp + rename; ~4k lines, a few MB: cheap every 25 fetches): a stop or a kill
        # mid-save leaves the last whole copy, and the next save writes every line once
        if self.pending or self.dirty:
            pend, self.pending = self.pending, []
            self.lines += [json.dumps(r, ensure_ascii=False) for r in pend]
            self.dirty = True
            write_lines(self.data_path, self.lines)
            self.dirty = False
        os.makedirs(os.path.dirname(os.path.abspath(self.state_path)), exist_ok=True)
        write_state(self.state_path, self.state)

    def append(self, rec):
        self.pending.append(rec)
        self.have[key_of(rec['shop'], rec['id'])] = rec

    def undo_marks(self):
        """This run's failure and no-nutrition entries undone (a drift or the cap: they say nothing true)."""
        self.failures.clear()
        self.failures.update(self.failures0)

    # discovery
    def needs_discovery(self, slug):
        sh = self.shops.get(slug, {})
        if sh.get('gone_at'):   # a removed shop: walked again only once back on the index
            if slug not in self.index:
                return False
            sh.pop('gone_at')
            return True
        if sh.get('crawl') or 'ids' not in sh:
            return True
        if self.since:
            return ts(sh['discovered_at']) < ts(self.since)
        return time.time() - ts(sh['discovered_at']) >= REDISCOVER_H * 3600

    def discover(self, slug):
        prev = json.loads(json.dumps(self.shops.get(slug, {})))
        sh = self.shops.setdefault(slug, {})
        c = sh.get('crawl') or {'ids': [], 'next_page': 1, 'pass': 1, 'expected': None}
        sh['crawl'] = c
        ids = set(c['ids'])
        while True:
            page = c['next_page']
            if page > MAX_PAGES:   # an explicit error coverage reports, walked again next run
                sh.pop('crawl', None)
                sh['error'] = 'more than %d pages' % MAX_PAGES
                return
            r = self.http.get(listing_path(slug, page))
            if r is not None and r[0] == 404 and page == 1 and self.index and slug not in self.index:
                self.remove_shop(slug)
                return
            if r is None or (r[0] != 200 and not (r[0] == 404 and page > 1)):
                sh['error'] = 'network error' if r is None else 'HTTP %d on page %d' % (r[0], page)
                c['ids'] = sorted(ids)
                return   # crawl progress kept; resumed next run
            if r[0] == 200:
                expected, found, _ = parse_listing(r[1], slug)
                if page == 1 and not found and (expected is None or expected > 0):
                    self.shops[slug] = prev
                    raise Stop('layout drift: listing %s gives no product link (total %s)' % (slug, expected), 4)
                if page == 1 or c['expected'] is None:
                    c['expected'] = expected
                ids |= found
                c['next_page'], c['ids'] = page + 1, sorted(ids)
                continue
            expected = c['expected']
            if expected is None or len(ids) == expected or c['pass'] >= MAX_PASSES:
                old = set(sh.get('ids', []))
                sh.pop('crawl', None)
                sh.pop('error', None)
                sh.update(expected=expected, ids=sorted(ids), passes=c['pass'], discovered_at=now(), pages=page - 1,
                          removed=sorted(old - ids) if old else [])
                self.log('  %s: expected=%s found=%d pages=%d passes=%d%s' % (
                    slug, expected, len(ids), page - 1, c['pass'], '' if len(ids) == expected else '  MISMATCH'))
                return
            c['pass'] += 1   # the listing shifted mid-walk: walk it again, union
            c['next_page'] = 1

    def remove_shop(self, slug):
        """Off the index and its listing a 404: the shop left the site; its products gone, once."""
        sh = self.shops[slug]
        sh.pop('crawl', None)
        sh.pop('error', None)
        sh.setdefault('gone_at', now())
        for key, rec in sorted(self.have.items()):
            if rec['shop'] == slug and not rec.get('gone'):
                self.mark_gone(key)
        self.log('  %s: left the site (off the index, listing 404)' % slug)

    # which products
    def before(self, at):
        return bool(self.refetch_before and at) and ts(at) < ts(self.refetch_before)

    def wanted(self, key, lastmod, listed):
        """Whether to fetch the product page now (the module docstring)."""
        rec, f = self.have.get(key), self.failures.get(key)
        moved = lambda held: bool(lastmod) and held != lastmod
        if rec is not None:
            if self.before(rec.get('fetched_at')):
                return True
            if rec.get('gone'):   # back in its listing, unless its page 404ed while listed (f['gone'])
                return moved(rec.get('lastmod')) or listed and not (f or {}).get('gone')
            # it stopped giving a record: a final no-nutrition, or failed for good, at this lastmod
            if f and f.get('parser', 1) >= PARSER_VERSION and f.get('lastmod') == lastmod and (
                    f.get('status') == NO_NUTRITION and not self.recheck
                    or f.get('status') != NO_NUTRITION and f.get('attempts', 0) >= MAX_ATTEMPTS):
                return self.before(f.get('checked_at'))
            if f and f.get('status') == NO_NUTRITION and self.recheck:
                return True
            return (rec.get('parser', 2) < RECORDS_FROM or moved(rec.get('lastmod'))
                    or rec.get('listed') is not listed or bool(f) and f.get('attempts', 0) < MAX_ATTEMPTS)
        if f is None or self.before(f.get('checked_at')):
            return True
        if f.get('status') == NO_NUTRITION:
            return self.recheck or f.get('parser', 1) < PARSER_VERSION or moved(f.get('lastmod'))
        if f.get('parser', 1) < PARSER_VERSION:
            return True   # failed under an older parser: once more with this one
        return not (f.get('attempts', 0) >= MAX_ATTEMPTS and f.get('lastmod') == lastmod)

    def record(self, slug, pid, lastmod, listed, fields):
        return {'shop': slug, 'id': pid, 'url': CANONICAL + product_path(slug, pid), 'lastmod': lastmod,
                'fetched_at': now(), 'parser': PARSER_VERSION, 'listed': listed, 'name': fields['name'],
                'shop_name': fields['shop_name'], 'shop_category': self.shops.get(slug, {}).get('category'),
                'genre': fields['genre'], 'ended': fields['ended'], 'image_id': fields['image_id'],
                'table': fields['table'], 'nutrients': fields['nutrients']}

    def mark_gone(self, key, lastmod=None):
        """A gone line: the last record, listed false, gone true, now; at the lastmod its 404 was seen at."""
        rec = {k: v for k, v in self.have[key].items() if k != 'item'}
        rec.update(listed=False, gone=True, fetched_at=now())
        if lastmod:
            rec['lastmod'] = lastmod
        self.append(rec)
        self.counts['gone'] += 1

    def fetch(self, slug, pid, lastmod, listed):
        key = key_of(slug, pid)
        r = self.http.get(product_path(slug, pid))
        self.counts['fetched'] += 1
        prev = self.failures.get(key)
        if r is not None and r[0] == 200:
            self.answered += 1
            kind, what = classify(r[1])
            if kind == 'record':
                self.drift = 0
                self.append(self.record(slug, pid, lastmod, listed, what))
                self.failures.pop(key, None)
                self.counts['ok'] += 1
                return
            if self.counts['ok'] == 0 and self.answered >= FIRST_FETCHES:
                raise Stop('layout drift: no record in the first %d product pages' % self.answered, 4)
            if kind == 'drift':   # never recorded: the parser's fault, not the product's
                self.drift += 1
                self.counts['drift'] += 1
                self.log('  drift %s: %s' % (key, what))
                if self.drift >= DRIFT_STREAK:
                    raise Stop('layout drift: %d pages in a row (%s)' % (self.drift, what), 4)
                return
            self.drift = 0
            if kind == 'no_nutrition':
                self.failures[key] = {'status': NO_NUTRITION, 'attempts': MAX_ATTEMPTS, 'checked_at': now(),
                                      'lastmod': lastmod, 'parser': PARSER_VERSION, 'title': what}
                if (prev or {}).get('status') != NO_NUTRITION:
                    self.new_nonut[key] = prev
                self.counts['no_nutrition'] += 1
                cap = max(NO_NUTRITION_MIN, NO_NUTRITION_SHARE * self.counts['fetched'])
                if len(self.new_nonut) > cap and (self.counts['ok'] or self.answered >= FIRST_FETCHES):
                    for k, p in self.new_nonut.items():
                        if p is None:
                            self.failures.pop(k, None)
                        else:
                            self.failures[k] = p
                    raise Stop('%d new no-nutrition marks (over %d), undone' % (len(self.new_nonut), cap), 5)
                return
            status = what
        elif r is not None and r[0] in (404, 410):   # final: gone (held) or missing; asked again on a new lastmod
            if key in self.have and not self.have[key].get('gone'):
                self.mark_gone(key, lastmod)
            self.failures[key] = {'status': r[0], 'gone': True, 'attempts': MAX_ATTEMPTS, 'parser': PARSER_VERSION,
                                  'checked_at': now(), 'lastmod': lastmod}
            return
        else:
            status = 'network error' if r is None else r[0]
        transient = r is None or r[0] == 429   # says nothing about the product: its attempts kept
        self.failures[key] = {'status': status, 'parser': PARSER_VERSION, 'checked_at': now(), 'lastmod': lastmod,
                              'attempts': (prev or {}).get('attempts', 0) + (0 if transient else 1)}
        self.counts['failed'] += 1

    def canary(self):
        """This shard's first-held products with a table (up to 3 asked): the first that answers must show one."""
        asked = 0
        for key in self.order:
            rec = self.have.get(key)
            if rec is None or rec.get('table') is False or rec.get('gone') or rec.get('ended') \
                    or rec.get('listed') is False:
                continue
            asked += 1
            r = self.http.get(product_path(rec['shop'], rec['id']))
            if r is not None and r[0] == 200:
                if 'kcal' not in parse_nutrient_table(r[1]) or menu_item(r[1]) is None:
                    raise Stop('layout drift: the canary %s shows no nutrient table' % key, 4)
                return key
            if asked >= 3:
                break
        return None

    def run(self):
        sm = self.sitemap
        if sm is None:
            try:
                sm = self.http.sitemap()
                self.log('sitemap: %d ja product urls' % len(sm))
            except (OSError, ET.ParseError) as e:   # lastmods are hints; coverage never rests on them
                self.log('sitemap unavailable (%s); lastmods ignored' % e)
        index, cats = [], {}
        for _ in range(MAX_429):   # a 429 asked again (the third: exit 2)
            r = self.http.get('/ja/shops/')
            if r is None or r[0] != 429:
                break
        if r is not None and r[0] == 200:
            index, cats = parse_shops_index(r[1]), parse_shop_categories(r[1])
        self.index = set(index)
        if not index:
            self.log('WARNING: shops index unreadable; the shops in state only')
        owned = sorted(s for s in set(index) | set(self.shops) if owner(s, self.shards) == self.n)
        if self.only:
            owned = [s for s in owned if s in self.only]
        if not owned:
            raise Stop('no shops owned (index unreadable, no state)', 1)
        for slug in owned:
            if slug in cats:
                self.shops.setdefault(slug, {})['category'] = cats[slug]
        if index and not self.only:
            self.state['meta'].update(index=len(index), owned=[s for s in index if owner(s, self.shards) == self.n])
        if self.since:
            self.state['meta']['since'] = self.since
        self.log('shard %d/%d: %d shops, %.3f req/s' % (self.n, self.shards, len(owned),
                                                         1 / self.http.interval if self.http.interval else 0))
        self.log('canary: %s' % (self.canary() or 'none (no product with a table held yet)'))
        for slug in owned:
            if self.needs_discovery(slug):
                self.discover(slug)
                self.save()
        todo, listed = [], set()
        owned = [s for s in owned if not self.shops.get(s, {}).get('gone_at')]
        whole = {s for s in owned if 'ids' in self.shops.get(s, {}) and not self.shops[s].get('crawl')
                 and self.shops[s].get('expected') == len(self.shops[s]['ids'])}
        for slug in owned:
            for pid in self.shops.get(slug, {}).get('ids', []):
                listed.add(key_of(slug, pid))
                lastmod = (sm or {}).get((slug, pid), '')
                if self.wanted(key_of(slug, pid), lastmod, True):
                    todo.append((slug, pid, lastmod, True))
        # in the sitemap, not in a whole listing: discontinued (販売終了かも？), fetched as unlisted
        for (slug, pid), lastmod in sorted((sm or {}).items()):
            if slug in whole and key_of(slug, pid) not in listed and self.wanted(key_of(slug, pid), lastmod, False):
                todo.append((slug, pid, lastmod, False))
        # held, in neither: gone (with no sitemap to ask, its page is asked: a 404 is gone)
        for key, rec in sorted(self.have.items()):
            if rec['shop'] in whole and key not in listed and not rec.get('gone') \
                    and (sm is None or (rec['shop'], str(rec['id'])) not in sm):
                if sm is not None:
                    self.mark_gone(key)
                elif rec.get('listed') is not False:
                    todo.append((rec['shop'], str(rec['id']), rec.get('lastmod') or '', False))
        self.log('products to fetch: %d' % len(todo))
        for i, t in enumerate(todo, 1):
            self.fetch(*t)
            if i % 25 == 0:
                self.save()


def run_shard(a, log=print):
    http = Http(base_url(), a.shards / a.total_rate, a.budget_minutes * 60 if a.budget_minutes else None,
                a.max_requests, log)
    sm = load_sitemap_file(a.sitemap) if a.sitemap and os.path.exists(a.sitemap) else None
    sh = Shard(http, a.n, a.shards, a.state, a.data, sm, a.since, a.recheck_no_nutrition, a.refetch_before,
               {s for s in (a.only_shops or '').split(',') if s}, log)
    code, reason = 0, 'done'
    try:
        sh.run()
    except Stop as e:
        code, reason = e.code, e.reason
        if code == 4:
            sh.undo_marks()
    except Exception:
        import traceback
        traceback.print_exc()
        code, reason = 1, 'crash'
    finally:
        sh.save()   # whatever stopped it
    log('stopped: %s; requests=%d 429s=%d %s exit=%d' % (reason, http.n, http.n429, sh.counts, code))
    return code


# ---------- canary ----------
def check_canary(http, log=print):
    """0 when the index (shops in categories), a listing (a total, links), a product with 推定 badges and a drink's
    table parse; 4 (drift) or 3 (network) else. A canary product gone (404) is skipped, not drift."""
    def page(path):
        r = http.get(path)
        if r is None:
            raise Stop('network error on %s' % path, 3)
        return r
    status, html = page('/ja/shops/')
    shops, cats = parse_shops_index(html), parse_shop_categories(html)
    if status != 200 or len(shops) < 2 or not cats:
        log('canary: shops index (HTTP %d): %d shops, %d in categories' % (status, len(shops), len(cats)))
        return 4
    slug = CANARY_LISTING if CANARY_LISTING in shops else shops[0]
    status, html = page(listing_path(slug))
    expected, ids, _ = parse_listing(html, slug) if status == 200 else (None, set(), 1)
    if not expected or not ids:
        log('canary: listing %s (HTTP %d): total %s, %d ids' % (slug, status, expected, len(ids)))
        return 4
    checked = []
    for (s, pid), need_est in ((CANARY_EST, True), (CANARY_DRINK, False)):
        status, html = page(product_path(s, pid))
        if status == 404:
            log('canary: %s/%s gone (404), skipped' % (s, pid))
            continue
        kind, what = classify(html) if status == 200 else ('failed', 'HTTP %d' % status)
        if kind != 'record' or not what['table'] or need_est and not any(n['est'] for n in what['nutrients'].values()):
            log('canary: %s/%s: %s' % (s, pid, what if kind != 'record' else 'no table or no 推定 badge'))
            return 4
        checked.append('%s/%s %s kcal' % (s, pid, what['nutrients']['kcal']['v']))
    if not checked:
        log('canary: both canary products gone; update CANARY_EST / CANARY_DRINK')
        return 4
    log('canary ok: %d shops, %s 全%d品, %s' % (len(shops), slug, expected, ', '.join(checked)))
    return 0


def run_canary(a, log=print):
    return check_canary(Http(base_url(), 3.0 if base_url() == CANONICAL else 0.0, log=log), log)


def run_sitemap(a, log=print):
    try:
        sm = Http(base_url(), 1.0 if base_url() == CANONICAL else 0.0, log=log).sitemap()
    except (OSError, ET.ParseError) as e:
        log('sitemap: %s' % e)
        return 3
    write_sitemap_file(a.out, sm)
    log('sitemap: %d ja product urls -> %s' % (len(sm), a.out))
    return 0


# ---------- compact ----------
def compact_lines(lines):
    """The winning record of each product, at its first line's place, without `item`, one JSON line each."""
    win, first = latest(lines), {}
    for i, (_, r) in enumerate(lines):
        if is_v2(r):
            first.setdefault((r['shop'], str(r['id'])), i)
    out = []
    for k in sorted(first, key=first.get):
        out.append(json.dumps({f: v for f, v in lines[win[k]][1].items() if f != 'item'}, ensure_ascii=False))
    return out


def compact(d, out_dir, log=print):
    """d's shards -> out_dir/shard-N.jsonl (plain), its states copied verbatim (the old state/shard-N.json as
    state-N.json). -> (lines read, lines written, v1 or unparseable dropped)."""
    os.makedirs(out_dir, exist_ok=True)
    tot = [0, 0, 0]
    for n, p in shard_paths(d).items():
        lines = read_lines(p)
        keep = compact_lines(lines)
        dst = os.path.join(out_dir, 'shard-%d.jsonl' % n)
        with open(dst + '.tmp', 'w', encoding='utf-8') as fh:
            fh.write(''.join(l + '\n' for l in keep))
        os.replace(dst + '.tmp', dst)
        got = (len(lines), len(keep), sum(not is_v2(r) for _, r in lines))
        tot = [x + y for x, y in zip(tot, got)]
        log('%s: %d lines -> %d (%d v1 or unparseable dropped)' % (os.path.basename(p), *got))
    for n in range(max(list(shard_paths(d)) + [SHARDS - 1]) + 1):
        src = state_file(d, n)
        dst = os.path.join(out_dir, 'state-%d.json' % n)
        if src and os.path.abspath(src) != os.path.abspath(dst):
            shutil.copyfile(src, dst)
    log('compact: %d lines -> %d products (%d dropped)' % tuple(tot))
    return tuple(tot)


def run_compact(a, log=print):
    compact(a.dir, a.out, log)
    return 0


# ---------- coverage ----------
def coverage(d, sitemap=None, since=None, shards=SHARDS, max_attempts=MAX_ATTEMPTS):
    """{summary, shops}: summary.complete when every shard's state is there; every shop on the index the shards saw
    (else in their state) is tracked, discovered at/after `since` and holds its stated total; every listed product
    and every sitemap-only one of a tracked shop is fetched (not gone) at the sitemap's lastmod, or a final
    no-nutrition; nothing failed for good. Errors (missing states, a count mismatch, a permanent failure, a sitemap
    shop untracked) also make it incomplete; pending work alone is progress."""
    errors, warnings, shops, fails, index, missing = [], [], {}, {}, [], []
    for n in range(shards):
        p = state_file(d, n)
        if p is None:
            missing.append(n)
            continue
        st = read_state(p)
        shops.update(st['shops'])
        fails.update(st['products'])
        index += st['meta'].get('owned') or list(st['shops'])
    if missing:
        errors.append('no state for shards %s' % missing)
    recs = {key_of(*k): r for k, r in read_dataset(d).items()}
    sm = {key_of(*k): v for k, v in (sitemap or {}).items()}
    def held(k):
        """'ok' a record at the sitemap's lastmod; 'gone' a gone record or a 404 page (resolved); 'no_nutrition';
        'stale_final' a record, then a final no-nutrition or failure at the current lastmod (resolved, a warning);
        'failed' for good without a record; 'stale' a record at an older lastmod; None not yet."""
        r, f = recs.get(k), fails.get(k, {})
        cur = lambda lm: not (k in sm and sm[k] and lm != sm[k])
        if r is not None and cur(r.get('lastmod')):
            return 'gone' if r.get('gone') else 'ok'
        final = f.get('status') == NO_NUTRITION or f.get('attempts', 0) >= max_attempts
        if final and cur(f.get('lastmod')):
            if f.get('gone'):
                return 'gone'
            if r is not None:
                return 'stale_final'
            return 'no_nutrition' if f.get('status') == NO_NUTRITION else 'failed'
        return 'stale' if r is not None else None

    rows, per = {}, {}
    tot = {'fetched': 0, 'discovered': 0, 'stated': 0, 'no_nutrition': 0, 'pending': 0, 'stale': 0, 'failed': 0,
           'stale_final': 0, 'gone_listed': 0}
    listed = set()
    for slug in sorted(set(shops) | set(index)):
        sh = shops.get(slug)
        if sh is None:
            st = 'untracked'
        elif sh.get('gone_at'):
            st = 'removed'
        elif str(sh.get('error') or '').startswith('more than'):
            st = 'too_many_pages'
        elif sh.get('crawl') or 'ids' not in sh:
            st = 'discovering'
        elif sh.get('expected') is None or sh['expected'] != len(sh['ids']):
            st = 'count_mismatch'
        elif since and ts(sh['discovered_at']) < ts(since):
            st = 'stale'
        else:
            st = 'whole'
        row = {'status': st, 'expected': (sh or {}).get('expected'), 'discovered': len((sh or {}).get('ids', [])),
               'fetched': 0, 'pending': 0, 'failed': 0}
        for pid in [] if st == 'removed' else (sh or {}).get('ids', []):
            k = key_of(slug, pid)
            listed.add(k)
            h = held(k)
            row['fetched'] += h == 'ok'
            tot['no_nutrition'] += h == 'no_nutrition'
            tot['stale_final'] += h == 'stale_final'
            tot['gone_listed'] += h == 'gone'
            row['pending'] += h in (None, 'stale')
            tot['stale'] += h == 'stale'
            row['failed'] += h == 'failed'
        if st == 'whole' and (row['pending'] or row['failed']):
            row['status'] = 'failed' if row['failed'] else 'fetching'
        per[row['status']] = per.get(row['status'], 0) + 1
        rows[slug] = row
        tot['fetched'] += row['fetched']
        tot['discovered'] += row['discovered']
        tot['stated'] += row['expected'] or 0
        tot['pending'] += row['pending']
        tot['failed'] += row['failed']
    mismatch = [s for s, r in rows.items() if r['status'] == 'count_mismatch']
    if mismatch:
        errors.append('%d shops whose ids differ from the stated total: %s' % (len(mismatch), ', '.join(
            '%s (%d/%s)' % (s, rows[s]['discovered'], rows[s]['expected']) for s in mismatch[:10])))
    if tot['failed']:
        errors.append('%d listed products failed for good' % tot['failed'])
    big = [s for s, r in rows.items() if r['status'] == 'too_many_pages']
    if big:
        errors.append('%d shops with over %d listing pages: %s' % (len(big), MAX_PAGES, ', '.join(big[:10])))
    if tot['stale_final']:
        warnings.append('%d products held at an older record: their page now gives none (no nutrition, or failed '
                        'for good)' % tot['stale_final'])
    if tot['gone_listed']:
        warnings.append('%d listed products whose page is a 404 (marked gone)' % tot['gone_listed'])
    so = {'count': 0, 'fetched': 0, 'pending': 0, 'failed': 0}
    untracked = set()
    for k in sm:
        slug = k.split('/', 1)[0]
        if slug not in shops:
            untracked.add(slug)
        elif k not in listed:
            h = held(k)
            so['count'] += 1
            so['pending' if h in (None, 'stale') else 'failed' if h == 'failed' else 'fetched'] += 1
    if so['failed']:
        errors.append('%d sitemap-only products failed for good' % so['failed'])
    if untracked:
        errors.append('%d shops in the sitemap, not on the index: %s' % (len(untracked), ', '.join(sorted(untracked)[:10])))
    if sitemap is None:
        warnings.append('no sitemap: lastmods and sitemap-only products not checked')
    n_gone = sum(1 for r in recs.values() if r.get('gone'))
    complete = not errors and set(per) <= {'whole', 'removed'} and not so['pending']
    summary = {'complete': complete, 'since': since, 'generated_at': now(),
               'shops': {'tracked': len(shops), 'on_index': len(set(index)), **per},
               'products': {**tot, 'records': len(recs), 'gone': n_gone,
                            'sitemap': None if sitemap is None else len(sitemap), 'sitemap_only': so['count'],
                            'sitemap_only_fetched': so['fetched'], 'sitemap_only_pending': so['pending']},
               'errors': errors, 'warnings': warnings}
    return {'summary': summary, 'shops': {s: r for s, r in rows.items() if r['status'] not in ('whole', 'removed')}}


def coverage_markdown(cov):
    s = cov['summary']
    p, sh = s['products'], s['shops']
    md = ['## kalori.jp coverage: %s' % ('COMPLETE' if s['complete'] else 'ERRORS' if s['errors'] else 'IN PROGRESS'),
          '', '- Shops: %d tracked (%d on the index): %s' % (sh['tracked'], sh['on_index'], ', '.join(
              '%d %s' % (v, k) for k, v in sorted(sh.items()) if k not in ('tracked', 'on_index'))),
          '- Products: %d fetched / %d discovered / %d stated; %d no nutrition, %d pending, %d failed, %d gone' % (
              p['fetched'], p['discovered'], p['stated'], p['no_nutrition'], p['pending'], p['failed'], p['gone']),
          '- Sitemap: %s' % ('not checked' if p['sitemap'] is None else '%d product urls, %d sitemap-only (%d fetched)'
                              % (p['sitemap'], p['sitemap_only'], p['sitemap_only_fetched'])), '']
    for title, xs in (('Errors', s['errors']), ('Warnings', s['warnings'])):
        if xs:
            md += ['### ' + title] + ['- ' + x for x in xs] + ['']
    if cov['shops']:
        md += ['### Shops not whole (first 40)', '', '| shop | status | expected | discovered | fetched | pending | '
               'failed |', '|---|---|---|---|---|---|---|']
        for slug, r in sorted(cov['shops'].items(), key=lambda kv: kv[1]['status'])[:40]:
            md.append('| %s | %s | %s | %d | %d | %d | %d |' % (slug, r['status'], r['expected'], r['discovered'],
                                                                r['fetched'], r['pending'], r['failed']))
    return '\n'.join(md) + '\n'


def run_coverage(a, log=print):
    since = a.since
    run_json = os.path.join(a.dir, 'run.json')
    if not since and os.path.exists(run_json):
        with open(run_json, encoding='utf-8') as fh:
            since = json.load(fh).get('since')
    cov = coverage(a.dir, load_sitemap_file(a.sitemap) if a.sitemap else None, since)
    if a.out:
        with open(a.out, 'w', encoding='utf-8') as fh:
            fh.write(json.dumps(cov, ensure_ascii=False, indent=1, sort_keys=True) + '\n')
    text = coverage_markdown(cov)
    log(text)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as fh:
            fh.write(text)
    return 1 if cov['summary']['errors'] or (a.strict and not cov['summary']['complete']) else 0


# ---------- diff ----------
def _v(r, k):
    n = r['nutrients'].get(k)
    return n.get('v') if isinstance(n, dict) else None


def _est(r):
    return sorted((k, bool(n.get('est'))) for k, n in r['nutrients'].items() if isinstance(n, dict))


def changed(a, b):
    """Beyond 1% (or shown on one side only)."""
    if a is None or b is None:
        return (a is None) != (b is None)
    return abs(a - b) > 0.01 * max(abs(a), abs(b))


DIFF_KINDS = ('added', 'gone', 'renamed', 'values_changed', 'est_changed', 'ended_changed')


def diff(old, new):
    """{totals, shops, examples} from one dataset (read_dataset) to the next. gone: in the old one (and not gone
    there), gone or missing in the new one; the shares are of the old one's current products."""
    cur = lambda d: {k for k, r in d.items() if not r.get('gone')}
    o_cur, n_cur = cur(old), cur(new)
    out = {k: [] for k in DIFF_KINDS}
    for k in sorted(set(old) | set(new)):
        o, n = old.get(k), new.get(k)
        if k in n_cur and k not in old:
            out['added'].append(k)
        if k in o_cur and k not in n_cur:
            out['gone'].append(k)
        if o is None or n is None:
            continue
        if (o.get('name') or '').strip() != (n.get('name') or '').strip():
            out['renamed'].append(k)
        if any(changed(_v(o, x), _v(n, x)) for x in ('kcal', 'p', 'f', 'c')):
            out['values_changed'].append(k)
        if _est(o) != _est(n) or (o.get('table') is False) != (n.get('table') is False):
            out['est_changed'].append(k)
        if (o.get('ended') is True, o.get('listed') is False) != (n.get('ended') is True, n.get('listed') is False):
            out['ended_changed'].append(k)
    shops = {}
    for kind in DIFF_KINDS:
        for shop, _ in out[kind]:
            shops.setdefault(shop, dict.fromkeys(DIFF_KINDS, 0))[kind] += 1
    base = len(o_cur)
    totals = {'products_old': base, 'products_new': len(n_cur), **{k: len(v) for k, v in out.items()}}
    share = {'values_changed': len(out['values_changed']) / base if base else 0.0,
             'gone': len(out['gone']) / base if base else 0.0}
    big = share['values_changed'] > MAX_CHANGED or share['gone'] > MAX_MISSING
    return {'totals': totals, 'share': share, 'too_big': big, 'limits': {'values_changed': MAX_CHANGED,
                                                                       'gone': MAX_MISSING},
            'shops': dict(sorted(shops.items())), 'examples': {k: [key_of(*x) for x in v[:20]] for k, v in out.items()}}


def diff_markdown(df):
    t, sh = df['totals'], df['share']
    md = ['## kalori.jp data diff%s' % (': OVER THE LIMITS' if df['too_big'] else ''), '',
          '- Products: %d -> %d' % (t['products_old'], t['products_new']),
          '- ' + ', '.join('%s %d' % (k, t[k]) for k in DIFF_KINDS),
          '- Values changed: %.1f%% (limit %d%%); gone or missing: %.1f%% (limit %d%%)' % (
              sh['values_changed'] * 100, MAX_CHANGED * 100, sh['gone'] * 100, MAX_MISSING * 100), '']
    md += ['- %s, e.g. %s' % (k, ', '.join(v[:5])) for k, v in df['examples'].items() if v]
    if df['shops']:
        md += ['', '| shop | ' + ' | '.join(DIFF_KINDS) + ' |', '|---' * (len(DIFF_KINDS) + 1) + '|']
        for s, c in sorted(df['shops'].items(), key=lambda kv: -sum(kv[1].values()))[:30]:
            md.append('| %s | %s |' % (s, ' | '.join(str(c[k]) for k in DIFF_KINDS)))
    return '\n'.join(md) + '\n'


def run_diff(a, log=print):
    df = diff(read_dataset(a.old), read_dataset(a.new))
    if a.out:
        with open(a.out, 'w', encoding='utf-8') as fh:
            fh.write(json.dumps(df, ensure_ascii=False, indent=1) + '\n')
    log(diff_markdown(df))
    return 6 if df['too_big'] else 0


# ---------- main ----------
def parser():
    ap = argparse.ArgumentParser(prog='kalori_scrape.py', description=__doc__.split('\n')[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('canary')
    s = sub.add_parser('sitemap')
    s.add_argument('--out', required=True)
    s = sub.add_parser('shard')
    s.add_argument('n', type=int)
    s.add_argument('--shards', type=int, default=SHARDS)
    s.add_argument('--total-rate', type=float, default=1.0, help='requests/s over all the shards')
    s.add_argument('--budget-minutes', type=float)
    s.add_argument('--since', help="ISO: this refresh's start; shops discovered before it are walked again")
    s.add_argument('--sitemap', help="the sitemap command's file (else fetched)")
    s.add_argument('--state', required=True)
    s.add_argument('--data', required=True, help='shard-N.jsonl.gz (gzip JSONL; plain without .gz)')
    s.add_argument('--only-shops', help='slug,slug: only these')
    s.add_argument('--max-requests', type=int)
    s.add_argument('--refetch-before', help='ISO: products fetched or checked before it again')
    s.add_argument('--recheck-no-nutrition', action='store_true')
    s = sub.add_parser('coverage')
    s.add_argument('--dir', required=True)
    s.add_argument('--sitemap')
    s.add_argument('--out')
    s.add_argument('--since', help="ISO (default: the dir's run.json since)")
    s.add_argument('--strict', action='store_true', help='exit 1 when incomplete too')
    s = sub.add_parser('compact')
    s.add_argument('--dir', required=True)
    s.add_argument('--out', required=True)
    s = sub.add_parser('diff')
    s.add_argument('--old', required=True)
    s.add_argument('--new', required=True)
    s.add_argument('--out')
    return ap


def main(argv, log=print):
    a = parser().parse_args(argv)
    if a.cmd == 'shard' and not (0 <= a.n < a.shards and a.total_rate > 0):
        parser().error('need 0 <= N < --shards and --total-rate > 0')
    run = {'canary': run_canary, 'sitemap': run_sitemap, 'shard': run_shard, 'coverage': run_coverage,
           'compact': run_compact, 'diff': run_diff}[a.cmd]

    def on_signal(signum, _frame):   # GitHub cancels with SIGINT/SIGTERM: a stop like any, the shard saved
        raise Stop('signal %d' % signum, 130)

    old = {s: signal.signal(s, on_signal) for s in (signal.SIGINT, signal.SIGTERM)}
    try:
        return run(a, log)
    except Stop as e:
        log('stopped: %s' % e.reason)
        return e.code
    finally:
        for s, h in old.items():
            signal.signal(s, h)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:], lambda m: print(m, flush=True)))
