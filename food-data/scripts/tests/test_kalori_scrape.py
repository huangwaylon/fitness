"""kalori_scrape.py: the parsers on trimmed real pages (fixtures/kalori/), wanted, compact, diff, coverage, the exit
codes, and a fake kalori.jp (a local http.server serving fixture-derived pages) crawled, re-crawled, changed and
drifted. No network. Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests

Fixtures (kalori.jp, 2026-11-14), scripts, styles, classes and most of the page around the parts read cut away:
shops_index (3 category sections), listing_p1 / listing_last / listing_404 (名代富士そば, 25 products on 2 pages),
product_normal (推定 badges), product_drink (スターバックス, no badges), product_ended (販売終了かも？),
product_zero (a 0 kcal tea: no table, values in the JSON-LD and meta); product_nonut is derived, a real tea page with
its values taken out: none of the 9 old no-nutrition pages checked shows nothing at all.
"""
import contextlib, gzip, io, json, os, re, shutil, signal, sys, tempfile, threading, unittest, urllib.error
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import kalori_scrape as K  # noqa: E402

FIX = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures', 'kalori')


def fixture(name):
    with open(os.path.join(FIX, name), encoding='utf-8') as fh:
        return fh.read()


def without_table(html):
    """The nutrient rows gone (a layout drift)."""
    return re.sub(r'<div> <div> <span> カロリー.*?塩分.*?</div> </div>', '', html, count=1, flags=re.S)


class Parsers(unittest.TestCase):
    def test_shops_index(self):
        h = fixture('shops_index.html')
        self.assertEqual(len(K.parse_shops_index(h)), 12)
        cats = K.parse_shop_categories(h)
        self.assertEqual(cats['seven-eleven'], 'convenience')
        self.assertEqual(cats['kaldi'], 'supermarket')
        self.assertEqual(cats['sukiya'], 'gyudon')

    def test_listings(self):
        exp, ids, pages = K.parse_listing(fixture('listing_p1.html'), 'fujisoba')
        self.assertEqual((exp, len(ids), pages), (25, 25, 2))
        exp, ids, _ = K.parse_listing(fixture('listing_last.html'), 'fujisoba')
        self.assertEqual((exp, ids), (25, {'2764924'}))
        self.assertEqual(K.parse_listing(fixture('listing_404.html'), 'fujisoba')[:2], (None, set()))
        self.assertEqual(K.parse_listing(fixture('listing_p1.html'), 'other')[1], set())

    def test_normal_with_badges(self):
        kind, f = K.classify(fixture('product_normal.html'))
        self.assertEqual(kind, 'record')
        self.assertEqual({k: n['v'] for k, n in f['nutrients'].items()},
                         {'kcal': 310.0, 'p': 11.5, 'f': 1.8, 'c': 62.0, 'sugar': 58.0, 'fiber': 4.0, 'salt': 4.5})
        self.assertTrue(all(n['est'] for n in f['nutrients'].values()))
        self.assertEqual((f['name'], f['shop_name'], f['genre'], f['image_id'], f['ended'], f['table']),
                         ('かけそば(うどん)', '名代富士そば', 'noodle', 29258, False, True))

    def test_drink(self):
        kind, f = K.classify(fixture('product_drink.html'))
        self.assertEqual(kind, 'record')
        self.assertFalse(any(n['est'] for n in f['nutrients'].values()))
        self.assertEqual(f['nutrients']['kcal']['v'], 368.0)
        self.assertEqual(f['nutrients']['salt']['v'], 0.7)   # 275 mg sodium / 393.4
        self.assertEqual(f['genre'], 'coffee')

    def test_ended(self):
        kind, f = K.classify(fixture('product_ended.html'))
        self.assertEqual(kind, 'record')
        self.assertTrue(f['ended'])
        self.assertEqual(f['nutrients']['kcal']['v'], 486.0)

    def test_zero_kcal_without_table(self):
        kind, f = K.classify(fixture('product_zero.html'))
        self.assertEqual(kind, 'record')
        self.assertFalse(f['table'])
        self.assertEqual(f['nutrients'], {k: {'v': 0.0, 'est': True} for k in ('kcal', 'p', 'f', 'c')})
        # no JSON-LD nutrition: its description, then the meta description (not the similar product's values)
        h = re.sub(r',"nutrition":\{[^{}]*\}', '', fixture('product_zero.html'))
        self.assertEqual(K.classify(h)[1]['nutrients']['kcal'], {'v': 0.0, 'est': True})
        h = h.replace('。カロリー0kcal、タンパク質0g、脂質0g、炭水化物0g。', '。')
        self.assertEqual(K.classify(h)[0], 'record')
        h = h.replace('の栄養成分情報。0.0kcal、P0.0g、F0.0g、C0.0g。', 'の栄養成分情報。')
        self.assertEqual(K.classify(h)[0], 'no_nutrition')

    def test_tableless_value_missing(self):
        h = fixture('product_zero.html').replace('"proteinContent":"0 g",', '')
        self.assertEqual(sorted(K.classify(h)[1]['nutrients']), ['c', 'f', 'kcal'])   # no {'v': None}

    def test_true_no_nutrition(self):
        kind, title = K.classify(fixture('product_nonut.html'))
        self.assertEqual(kind, 'no_nutrition')
        self.assertIn('ウーロン茶', title)

    def test_drift(self):
        h = without_table(fixture('product_normal.html'))
        self.assertEqual(K.parse_nutrient_table(h), {})
        self.assertEqual(K.classify(h)[0], 'drift')   # kcal in the title, no table
        self.assertEqual(K.classify(re.sub(r'<script type="application/ld\+json">.*?</script>', '',
                                           fixture('product_normal.html'), flags=re.S))[0], 'drift')
        self.assertEqual(K.classify('<html><title>x</title></html>')[0], 'failed')

    def test_sitemap(self):
        kids, urls = K.parse_sitemap(b'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap>'
                                     b'<loc>https://kalori.jp/s-1.xml</loc></sitemap></sitemapindex>')
        self.assertEqual((kids, urls), (['https://kalori.jp/s-1.xml'], {}))
        _, urls = K.parse_sitemap(
            b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://kalori.jp/ja/shops/a/'
            b'products/1/</loc><lastmod>2026-01-01</lastmod></url><url><loc>https://kalori.jp/en/shops/a/products/1/'
            b'</loc></url><url><loc>https://kalori.jp/ja/shops/a/products/</loc></url></urlset>')
        self.assertEqual(urls, {('a', '1'): '2026-01-01'})


def rec(shop, pid, at='2026-11-01T00:00:00+00:00', lastmod='L1', kcal=100.0, **kw):
    r = {'shop': shop, 'id': str(pid), 'url': 'u', 'lastmod': lastmod, 'fetched_at': at, 'parser': K.PARSER_VERSION,
         'listed': True, 'name': 'n%s' % pid, 'shop_name': 's', 'shop_category': None, 'genre': None, 'ended': False,
         'image_id': None, 'table': True, 'nutrients': {'kcal': {'v': kcal, 'est': False}, 'p': {'v': 1.0, 'est': False}}}
    r.update(kw)
    return r


def write_lines(path, lines):
    op = gzip.open if path.endswith('.gz') else open
    with op(path, 'wt', encoding='utf-8') as fh:
        fh.write(''.join((x if isinstance(x, str) else json.dumps(x, ensure_ascii=False)) + '\n' for x in lines))


class Wanted(unittest.TestCase):
    def shard(self, **kw):
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d)
        return K.Shard(K.Http('http://127.0.0.1:9'), 0, 1, os.path.join(d, 's.json'), os.path.join(d, 'd.jsonl.gz'),
                       **kw)

    def test_decisions(self):
        sh = self.shard()
        self.assertTrue(sh.wanted('a/1', 'L1', True))                        # new
        sh.have['a/1'] = rec('a', 1)
        self.assertFalse(sh.wanted('a/1', 'L1', True))                       # held, unchanged
        self.assertFalse(sh.wanted('a/1', '', True))                         # no lastmod to compare
        self.assertTrue(sh.wanted('a/1', 'L2', True))                        # lastmod changed
        self.assertTrue(sh.wanted('a/1', 'L1', False))                       # left its listing
        sh.have['a/2'] = rec('a', 2, parser=1)
        self.assertTrue(sh.wanted('a/2', 'L1', True))                        # an older parser's record
        sh.have['a/3'] = {k: v for k, v in rec('a', 3).items() if k != 'parser'}
        self.assertFalse(sh.wanted('a/3', 'L1', True))                       # the test repo's lines stand
        sh.have['a/4'] = rec('a', 4, gone=True, listed=False)
        self.assertFalse(sh.wanted('a/4', 'L1', False))                      # gone stays gone
        self.assertTrue(sh.wanted('a/4', 'L1', True))                        # back in its listing
        sh.failures['a/5'] = {'status': 500, 'attempts': 1, 'lastmod': 'L1', 'parser': K.PARSER_VERSION}
        self.assertTrue(sh.wanted('a/5', 'L1', True))                        # retryable failure
        sh.failures['a/5']['attempts'] = K.MAX_ATTEMPTS
        self.assertFalse(sh.wanted('a/5', 'L1', True))                       # failed for good
        self.assertTrue(sh.wanted('a/5', 'L2', True))                        # ... until its lastmod moves
        sh.failures['a/5']['parser'] = K.PARSER_VERSION - 1
        self.assertTrue(sh.wanted('a/5', 'L1', True))                        # ... or the parser does
        nonut = {'status': K.NO_NUTRITION, 'attempts': K.MAX_ATTEMPTS, 'lastmod': 'L1', 'parser': K.PARSER_VERSION,
                 'checked_at': '2026-11-01T00:00:00+00:00'}
        sh.failures['a/6'] = dict(nonut)
        self.assertFalse(sh.wanted('a/6', 'L1', True))                       # final no-nutrition
        self.assertTrue(sh.wanted('a/6', 'L2', True))
        sh.failures['a/7'] = dict(nonut, parser=2)
        self.assertTrue(sh.wanted('a/7', 'L1', True))                        # marked before the 0 kcal rule

    def test_record_then_no_record(self):
        sh = self.shard()
        sh.have['a/1'] = rec('a', 1)
        sh.failures['a/1'] = {'status': K.NO_NUTRITION, 'attempts': 3, 'lastmod': 'L2', 'parser': K.PARSER_VERSION}
        self.assertFalse(sh.wanted('a/1', 'L2', True))                       # turned no-nutrition at this lastmod
        self.assertTrue(sh.wanted('a/1', 'L3', True))
        sh.failures['a/1'] = {'status': 500, 'attempts': 1, 'lastmod': 'L2', 'parser': K.PARSER_VERSION}
        self.assertTrue(sh.wanted('a/1', 'L2', True))                        # failing: retried
        sh.failures['a/1']['attempts'] = K.MAX_ATTEMPTS
        self.assertFalse(sh.wanted('a/1', 'L2', True))                       # failed for good at this lastmod
        sh.have['a/2'] = rec('a', 2, gone=True, listed=False)
        sh.failures['a/2'] = {'status': 404, 'gone': True, 'attempts': 3, 'lastmod': 'L1', 'parser': K.PARSER_VERSION}
        self.assertFalse(sh.wanted('a/2', 'L1', True))                       # listed, its page a 404: once
        self.assertTrue(sh.wanted('a/2', 'L2', True))
        sh.failures['a/3'] = dict(sh.failures['a/2'])
        self.assertFalse(sh.wanted('a/3', 'L1', False))                      # a sitemap-only 404, never held
        sh = self.shard(recheck=True)
        sh.have['a/1'] = rec('a', 1)
        sh.failures['a/1'] = {'status': K.NO_NUTRITION, 'attempts': 3, 'lastmod': 'L2', 'parser': K.PARSER_VERSION}
        self.assertTrue(sh.wanted('a/1', 'L2', True))

    def test_switches(self):
        sh = self.shard(recheck=True, refetch_before='2026-11-10')
        sh.failures['a/6'] = {'status': K.NO_NUTRITION, 'attempts': 3, 'lastmod': 'L1', 'parser': K.PARSER_VERSION,
                              'checked_at': '2026-11-12T00:00:00+00:00'}
        self.assertTrue(sh.wanted('a/6', 'L1', True))                        # --recheck-no-nutrition
        sh.have['a/1'] = rec('a', 1, at='2026-11-09T00:00:00+00:00')
        sh.have['a/2'] = rec('a', 2, at='2026-11-11T00:00:00Z')
        self.assertTrue(sh.wanted('a/1', 'L1', True))                        # --refetch-before
        self.assertFalse(sh.wanted('a/2', 'L1', True))


class Compact(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.d)

    def test_first_place_latest_line_idempotent(self):
        src, out, out2 = (os.path.join(self.d, x) for x in ('src', 'out', 'out2'))
        os.makedirs(os.path.join(src, 'state'))
        write_lines(os.path.join(src, 'shard-0.jsonl'), [
            {'shop': 'a', 'id': '9', 'item': {'name': 'v1 line'}},
            dict(rec('a', 2), item={'@type': 'MenuItem'}),
            rec('a', 1),
            rec('a', 2, at='2026-11-02T00:00:00+00:00', kcal=200.0),
            '{"half a line',
            rec('a', 1, at='2026-10-01T00:00:00+00:00', kcal=50.0)])   # older, though later in the file
        with open(os.path.join(src, 'state', 'shard-0.json'), 'w') as fh:
            fh.write('{"products":{}, "shops":{}}\n')
        got = K.compact(src, out, log=lambda m: None)
        self.assertEqual(got, (6, 2, 2))
        with open(os.path.join(out, 'shard-0.jsonl'), encoding='utf-8') as fh:
            lines = [json.loads(l) for l in fh]
        self.assertEqual([(r['id'], r['nutrients']['kcal']['v']) for r in lines], [('2', 200.0), ('1', 100.0)])
        self.assertFalse(any('item' in r for r in lines))
        with open(os.path.join(out, 'state-0.json')) as fh:
            self.assertEqual(fh.read(), '{"products":{}, "shops":{}}\n')   # verbatim
        K.compact(out, out2, log=lambda m: None)
        for f in ('shard-0.jsonl', 'state-0.json'):
            with open(os.path.join(out, f), 'rb') as a, open(os.path.join(out2, f), 'rb') as b:
                self.assertEqual(a.read(), b.read())

    def test_gzip_members(self):
        p = os.path.join(self.d, 'shard-3.jsonl.gz')
        write_lines(p, [rec('a', 1)])
        with gzip.open(p, 'ab') as fh:
            fh.write((json.dumps(rec('a', 1, at='2026-11-03T00:00:00+00:00', kcal=5.0)) + '\n').encode())
        with open(p, 'ab') as fh:
            fh.write(gzip.compress(b'{"shop": "a", "id": "2"')[:-8])   # a member cut short: a killed run
        self.assertEqual(len(K.read_lines(p)), 2)
        self.assertEqual(K.read_dataset(self.d)[('a', '1')]['nutrients']['kcal']['v'], 5.0)


class Files(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.d)
        self.data = os.path.join(self.d, 'shard-0.jsonl.gz')

    def shard(self):
        return K.Shard(K.Http('http://127.0.0.1:9'), 0, 1, os.path.join(self.d, 's.json'), self.data,
                       log=lambda m: None)

    def test_cut_member_repaired(self):
        write_lines(self.data, [rec('a', 1), rec('a', 2)])
        with open(self.data, 'ab') as fh:   # a member a kill cut off
            fh.write(gzip.compress((json.dumps(rec('a', 3)) + '\n' + json.dumps(rec('a', 4)) + '\n').encode())[:-30])
        sh = self.shard()
        sh.append(rec('a', 5))
        sh.save()
        clean = []
        got = K.read_lines(self.data, clean)
        self.assertEqual(clean, [])
        self.assertTrue(all(r is not None for _, r in got))
        self.assertEqual([r['id'] for _, r in got][:2] + [got[-1][1]['id']], ['1', '2', '5'])
        self.assertEqual(len({r['id'] for _, r in got}), len(got))

    def test_stop_mid_save_once(self):
        sh = self.shard()
        sh.append(rec('a', 1))
        sh.append(rec('a', 2))
        real, calls = os.replace, []

        def flaky(a, b):
            calls.append(a)
            if len(calls) == 1:
                raise K.Stop('signal 15', 130)
            real(a, b)
        with mock.patch.object(K.os, 'replace', flaky):
            with self.assertRaises(K.Stop):
                sh.save()
            sh.save()   # run_shard's finally
        sh.save()
        self.assertEqual([r['id'] for _, r in K.read_lines(self.data)], ['1', '2'])


class Diff(unittest.TestCase):
    def test_counts_and_limits(self):
        old = {('a', str(i)): rec('a', i) for i in range(100)}
        new = dict(old)
        new[('a', '0')] = rec('a', 0, kcal=100.5)                   # within 1%
        new[('a', '1')] = rec('a', 1, kcal=120.0)
        new[('a', '2')] = rec('a', 2, name='x')
        new[('a', '3')] = rec('a', 3, gone=True, listed=False)
        del new[('a', '4')]
        new[('b', '1')] = rec('b', 1)
        new[('a', '5')] = rec('a', 5, ended=True)
        new[('a', '6')] = rec('a', 6, nutrients={'kcal': {'v': 100.0, 'est': True}, 'p': {'v': 1.0, 'est': False}})
        df = K.diff(old, new)
        self.assertEqual(df['totals'], {'products_old': 100, 'products_new': 99, 'added': 1, 'gone': 2, 'renamed': 1,
                                        'values_changed': 1, 'est_changed': 1, 'ended_changed': 2})
        self.assertFalse(df['too_big'])
        self.assertEqual(df['shops']['b']['added'], 1)
        for i in range(10, 16):
            del new[('a', str(i))]
        self.assertTrue(K.diff(old, new)['too_big'])                # 8% gone
        new = {k: rec(*k, kcal=1.0) for k in old}
        self.assertTrue(K.diff(old, new)['too_big'])                # every value
        self.assertFalse(K.diff({}, new)['too_big'])                # the first release

    def test_cli(self):
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d)
        for sub, kcal in (('o', 100.0), ('n', 300.0)):
            os.makedirs(os.path.join(d, sub))
            write_lines(os.path.join(d, sub, 'shard-0.jsonl'), [rec('a', 1, kcal=kcal)])
        out = os.path.join(d, 'diff.json')
        code = K.main(['diff', '--old', os.path.join(d, 'o'), '--new', os.path.join(d, 'n'), '--out', out],
                      log=lambda m: None)
        self.assertEqual(code, 6)
        with open(out) as fh:
            self.assertEqual(json.load(fh)['totals']['values_changed'], 1)


class Coverage(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.d)
        self.state = {'shops': {'a': {'expected': 2, 'ids': ['1', '2'], 'discovered_at': '2026-11-10T00:00:00+00:00'}},
                      'products': {'a/2': {'status': K.NO_NUTRITION, 'attempts': 3, 'lastmod': 'L2', 'parser': 3}},
                      'meta': {'owned': ['a']}}
        self.lines = [rec('a', 1, lastmod='L1'), rec('a', 3, lastmod='L3', listed=False)]
        self.sm = {('a', '1'): 'L1', ('a', '2'): 'L2', ('a', '3'): 'L3'}

    def cov(self, since='2026-11-09T00:00:00Z', shards=1):
        K.write_state(os.path.join(self.d, 'state-0.json'), self.state)
        write_lines(os.path.join(self.d, 'shard-0.jsonl.gz'), self.lines)
        return K.coverage(self.d, self.sm, since, shards)['summary']

    def test_complete(self):
        s = self.cov()
        self.assertTrue(s['complete'], s)
        self.assertEqual((s['products']['fetched'], s['products']['discovered'], s['shops']['tracked']), (1, 2, 1))

    def test_incomplete(self):
        self.assertFalse(self.cov(since='2026-11-11T00:00:00Z')['complete'])          # discovered before since
        self.sm[('a', '1')] = 'L9'
        self.assertFalse(self.cov()['complete'])                                       # lastmod not the sitemap's
        self.sm[('a', '1')] = 'L1'
        self.sm[('a', '4')] = 'L4'
        self.assertFalse(self.cov()['complete'])                                       # sitemap-only, not fetched
        del self.sm[('a', '4')]
        self.state['meta']['owned'].append('b')
        self.assertFalse(self.cov()['complete'])                                       # an index shop untracked
        self.state['meta']['owned'].remove('b')
        self.state['shops']['a']['expected'] = 3
        s = self.cov()
        self.assertFalse(s['complete'])
        self.assertTrue(s['errors'])                                                   # a count mismatch: an error
        self.state['shops']['a']['expected'] = 2
        self.assertFalse(self.cov(shards=2)['complete'])                               # a shard's state missing

    def test_resolved(self):
        self.lines[0] = rec('a', 1, lastmod='L0')    # a record, then a final no-nutrition at the current lastmod
        self.state['products']['a/1'] = {'status': K.NO_NUTRITION, 'attempts': 3, 'lastmod': 'L1', 'parser': 3}
        self.lines[1] = rec('a', 3, lastmod='L3', listed=False, gone=True)   # sitemap-only, its page a 404
        self.state['shops']['b'] = {'expected': 1, 'ids': ['1'], 'discovered_at': '2026-01-01T00:00:00+00:00',
                                    'gone_at': '2026-11-10T00:00:00+00:00'}   # left the site
        s = self.cov()
        self.assertTrue(s['complete'], s)
        self.assertEqual((s['products']['stale_final'], s['products']['sitemap_only_pending']), (1, 0))
        self.assertTrue(s['warnings'])
        self.state['products']['a/1'] = {'status': 500, 'attempts': 3, 'lastmod': 'L1', 'parser': 3}
        self.assertTrue(self.cov()['complete'])                                       # failed for good, held
        self.state['products']['a/1']['attempts'] = 1
        self.assertFalse(self.cov()['complete'])                                      # still being retried
        self.state['products']['a/1']['attempts'] = 3
        self.state['shops']['c'] = {'error': 'more than 500 pages'}
        s = self.cov()
        self.assertFalse(s['complete'])
        self.assertIn('over 500 listing pages', ' '.join(s['errors']))

    def test_cli_strict_and_run_json(self):
        self.cov()
        for n in range(1, K.SHARDS):
            K.write_state(os.path.join(self.d, 'state-%d.json' % n), {'shops': {}, 'products': {}, 'meta': {}})
        with open(os.path.join(self.d, 'run.json'), 'w') as fh:
            json.dump({'since': '2026-11-11T00:00:00Z'}, fh)
        sm = os.path.join(self.d, 'sitemap.json')
        K.write_sitemap_file(sm, self.sm)
        out = os.path.join(self.d, 'coverage.json')
        args = ['coverage', '--dir', self.d, '--sitemap', sm, '--out', out]
        with mock.patch.dict(os.environ, {'GITHUB_STEP_SUMMARY': ''}):
            self.assertEqual(K.main(args, log=lambda m: None), 0)               # incomplete, not --strict
            self.assertEqual(K.main(args + ['--strict'], log=lambda m: None), 1)
            self.assertEqual(K.main(args + ['--strict', '--since', '2026-11-01'], log=lambda m: None), 0)
        with open(out) as fh:
            self.assertTrue(json.load(fh)['summary']['complete'])


# ---------- the fake site ----------
PER_PAGE = 2


class Site:
    """A mutable kalori.jp: shops {slug: (category, [ids])}, products {(slug, id): {kind, name, kcal, lastmod}}, the
    sitemap's extra (unlisted) products, drift (product pages without the table), hits (paths asked)."""

    def __init__(self):
        self.shops = {}
        self.products = {}
        self.unlisted = set()
        self.drift = False
        self.status = None   # every answer's status (429 tests)
        self.queue = []      # the next answers' statuses, then normal ones
        self.retry_after = '0'
        self.no_links = False
        self.hits = []
        idx = fixture('shops_index.html')
        a = idx.index('<section')
        self.index_head, self.index_tail = idx[:a], '</main></body></html>\n'
        lst = re.sub(r'<a href="/ja/shops/fujisoba/products/\d+/">[^<]*</a>', '', fixture('listing_p1.html'))
        self.listing = re.sub(r'<a href="/ja/shops/fujisoba/products/page/\d+/"[^>]*>.*?</a>', '', lst, flags=re.S)
        self.normal, self.zero, self.nonut = (fixture('product_%s.html' % k) for k in ('normal', 'zero', 'nonut'))
        self.missing = fixture('listing_404.html')

    def index(self):
        secs = {}
        for slug, (cat, _) in sorted(self.shops.items()):
            secs.setdefault(cat, []).append('<a href="/ja/shops/%s/products/"> <span>%s</span> </a>' % (slug, slug))
        return self.index_head + ''.join(
            '<section id="shop-cat-%s" data-shop-category-section="%s"> <div> <h3>%s</h3> </div> <div> %s </div>'
            ' </section>' % (c, c, c, ''.join(links)) for c, links in secs.items()) + self.index_tail

    def listing_page(self, slug, page):
        ids = self.shops[slug][1]
        chunk = ids[(page - 1) * PER_PAGE:page * PER_PAGE]
        if page > 1 and not chunk:
            return None
        cards = ''.join('<div><a href="/ja/shops/%s/products/%s/">%s</a></div>' % (slug, i, self.products[(slug, i)]
                                                                                  ['name']) for i in chunk)
        if page * PER_PAGE < len(ids):
            cards += '<a href="/ja/shops/%s/products/page/%d/">次へ</a>' % (slug, page + 1)
        h = self.listing.replace('全25品', '全%d品' % len(ids)).replace('fujisoba', slug)
        i = h.find('<h2>')
        return h if i < 0 or self.no_links else h[:i] + cards + h[i:]

    def product(self, slug, pid):
        p = self.products.get((slug, pid))
        if p is None:
            return None
        if p['kind'] in ('zero', 'nonut'):
            return (self.zero if p['kind'] == 'zero' else self.nonut).replace('kaldi', slug)
        head, body = self.normal.split('</head>', 1)
        body = body.replace('かけそば(うどん)', p['name']).replace('fujisoba', slug)
        body = body.replace('<span> 310 kcal </span>', '<span> %d kcal </span>' % p['kcal'])
        if self.drift:
            body = without_table(body)
        head = re.sub(r'<title>.*?</title>', '<title>%s %dkcal｜カロリー・栄養成分 | 名代富士そば</title>' % (
            p['name'], p['kcal']), head)
        m = re.search(r'<script type="application/ld\+json">(\{[^<]*"MenuItem".*?)</script>', head, re.S)
        item = json.loads(m.group(1))
        item.update(name=p['name'], url='https://kalori.jp/ja/shops/%s/products/%s/' % (slug, pid))
        item['nutrition']['calories'] = '%d kcal' % p['kcal']
        head = head[:m.start(1)] + json.dumps(item, ensure_ascii=False) + head[m.end(1):]
        return head + '</head>' + body

    def sitemap(self, child):
        if not child:
            return ('<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap>'
                    '<loc>https://kalori.jp/sitemap-0.xml</loc></sitemap></sitemapindex>')
        keys = [(s, i) for s, (_, ids) in self.shops.items() for i in ids] + sorted(self.unlisted)
        return '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(
            '<url><loc>https://kalori.jp/ja/shops/%s/products/%s/</loc><lastmod>%s</lastmod></url>' % (
                s, i, self.products[(s, i)]['lastmod']) for s, i in keys) + '</urlset>'

    def answer(self, path):
        self.hits.append(path)
        if self.queue:
            return self.queue.pop(0), 'slow down'
        if self.status:
            return self.status, 'slow down'
        if path == '/ja/shops/':
            return 200, self.index()
        if path in ('/sitemap-index.xml', '/sitemap-0.xml'):
            return 200, self.sitemap(path != '/sitemap-index.xml')
        m = re.match(r'^/ja/shops/([^/]+)/products/(?:page/(\d+)/)?$', path)
        if m and m.group(1) in self.shops:
            h = self.listing_page(m.group(1), int(m.group(2) or 1))
            return (200, h) if h else (404, self.missing)
        m = re.match(r'^/ja/shops/([^/]+)/products/(\d+)/$', path)
        p = m and self.products.get((m.group(1), m.group(2)))
        if p and p.get('status'):
            return p['status'], 'oops'   # 404: a dead page, 500: a broken one
        h = m and self.product(m.group(1), m.group(2))
        return (200, h) if h else (404, self.missing)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        status, body = self.server.site.answer(self.path)
        data = body.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        if status == 429:
            self.send_header('Retry-After', self.server.site.retry_after)
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):
        pass


class FakeSite(unittest.TestCase):
    def setUp(self):
        self.site = Site()
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.server.site = self.site
        threading.Thread(target=self.server.serve_forever, args=(0.05,), daemon=True).start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.d)
        env = mock.patch.dict(os.environ, {'KALORI_BASE': 'http://127.0.0.1:%d' % self.server.server_port})
        env.start()
        self.addCleanup(env.stop)
        self.state, self.data = os.path.join(self.d, 'state-0.json'), os.path.join(self.d, 'shard-0.jsonl.gz')
        self.log = []

    def add(self, slug, pid, kind='normal', kcal=500, lastmod='2026-10-01T00:00:00Z', listed=True, cat='gyudon'):
        self.site.products[(slug, pid)] = {'kind': kind, 'name': '品%s' % pid, 'kcal': kcal, 'lastmod': lastmod}
        if listed:
            self.site.shops.setdefault(slug, (cat, []))[1].append(pid)
        else:
            self.site.unlisted.add((slug, pid))

    def menu(self):
        for pid in ('101', '102', '103', '104', '105'):
            self.add('tako-ya', pid, kcal=int(pid) * 5)
        self.add('tako-ya', '106', listed=False)   # sitemap only: discontinued
        self.add('mame-cafe', '201', kcal=250, cat='convenience')
        self.add('mame-cafe', '202', kind='zero', cat='convenience')
        self.add('mame-cafe', '203', kind='nonut', cat='convenience')

    def scrape(self, *extra, state=None, data=None):
        self.site.hits = []
        since = (datetime.now(timezone.utc) + timedelta(seconds=1)).isoformat(timespec='seconds')   # after the last run
        args = ['shard', '0', '--shards', '1', '--total-rate', '1000', '--since', since, '--state',
                state or self.state, '--data', data or self.data, *extra]
        return K.main(args, log=self.log.append)

    def lines(self, data=None):
        return [r for _, r in K.read_lines(data or self.data)]

    def failures(self):
        return K.read_state(self.state)['products']

    def product_hits(self):
        return [h for h in self.site.hits if re.search(r'/products/\d+/$', h)]

    def compacted(self, name):
        out = os.path.join(self.d, name)
        src = os.path.join(self.d, 'src-' + name)
        os.makedirs(src)
        shutil.copy(self.data, src)
        shutil.copy(self.state, src)
        K.compact(src, out, log=lambda m: None)
        with open(os.path.join(out, 'shard-0.jsonl'), 'rb') as fh:
            return out, fh.read()

    def test_crawl_recrawl_change_drift(self):
        self.menu()
        # 1. the first crawl
        self.assertEqual(self.scrape(), 0, self.log)
        got = {r['id']: r for r in self.lines()}
        self.assertEqual(sorted(got), ['101', '102', '103', '104', '105', '106', '201', '202'])
        self.assertEqual(got['102']['nutrients']['kcal'], {'v': 510.0, 'est': True})
        self.assertEqual((got['202']['table'], got['202']['nutrients']['kcal']), (False, {'v': 0.0, 'est': True}))
        self.assertFalse(got['106']['listed'])
        self.assertEqual((got['101']['shop_category'], got['201']['shop_category']), ('gyudon', 'convenience'))
        self.assertTrue(all(r['parser'] == K.PARSER_VERSION and r['url'].startswith(K.CANONICAL) for r in got.values()))
        self.assertEqual(self.failures()['mame-cafe/203']['status'], K.NO_NUTRITION)
        self.assertIn('ウーロン茶', self.failures()['mame-cafe/203']['title'])
        sm = os.path.join(self.d, 'sitemap.json')
        self.assertEqual(K.main(['sitemap', '--out', sm], log=self.log.append), 0)
        cov_dir = os.path.join(self.d, 'cov')
        os.makedirs(cov_dir)
        shutil.copy(self.data, cov_dir)
        shutil.copy(self.state, cov_dir)
        cov = K.coverage(cov_dir, K.load_sitemap_file(sm), None, shards=1)['summary']
        self.assertTrue(cov['complete'], cov)
        out1, c1 = self.compacted('c1')

        # 2. nothing changed: nothing appended, one request a page (the canary the only product page)
        with open(self.data, 'rb') as fh:
            before = fh.read()
        self.assertEqual(self.scrape(), 0, self.log)
        with open(self.data, 'rb') as fh:
            self.assertEqual(fh.read(), before)
        self.assertEqual(len(self.product_hits()), 1)
        self.assertEqual(self.compacted('c2')[1], c1)

        # 3. the site changes: 102 new values (its lastmod moved), 104 off its listing and the sitemap, 204 new;
        # tako-ya lists 4, mame-cafe 4
        self.site.products[('tako-ya', '102')].update(kcal=999, lastmod='2026-11-13T00:00:00Z')
        self.site.shops['tako-ya'][1].remove('104')
        self.add('mame-cafe', '204', kcal=300, cat='convenience')
        n = len(self.lines())
        self.assertEqual(self.scrape(), 0, self.log)
        new = self.lines()[n:]
        self.assertEqual(sorted(r['id'] for r in new), ['102', '104', '204'])
        by = {r['id']: r for r in new}
        self.assertEqual(by['102']['nutrients']['kcal']['v'], 999.0)
        self.assertEqual(by['102']['lastmod'], '2026-11-13T00:00:00Z')
        self.assertEqual((by['104']['gone'], by['104']['listed'], by['104']['nutrients']),
                         (True, False, got['104']['nutrients']))
        hits = self.product_hits()   # the canary, then each changed product once
        self.assertEqual(sorted(hits[1:]), ['/ja/shops/mame-cafe/products/204/', '/ja/shops/tako-ya/products/102/'])
        out3, c3 = self.compacted('c3')
        rows = [json.loads(l) for l in c3.decode().splitlines()]
        self.assertEqual([r['id'] for r in rows], ['201', '202', '101', '102', '103', '104', '105', '106', '204'])
        df = K.diff(K.read_dataset(out1), K.read_dataset(out3))
        self.assertEqual({k: df['totals'][k] for k in ('added', 'gone', 'values_changed')},
                         {'added': 1, 'gone': 1, 'values_changed': 1})
        self.assertEqual(self.scrape(), 0, self.log)   # and settled again
        self.assertEqual(len(self.lines()), n + 3)

        # 4. a layout drift: the product pages lose the table -> 4, nothing recorded, no mark
        self.site.drift = True
        self.site.products[('tako-ya', '101')]['lastmod'] = '2026-11-14T00:00:00Z'
        fails, n = self.failures(), len(self.lines())
        self.assertEqual(self.scrape(), 4, self.log)
        self.assertEqual(self.failures(), fails)
        self.assertEqual(len(self.lines()), n)

    def test_drift_without_a_canary(self):
        """A first crawl of a drifted site: DRIFT_STREAK drift pages in a row -> 4, nothing marked."""
        self.menu()
        self.site.drift = True
        self.assertEqual(self.scrape('--only-shops', 'tako-ya'), 4, self.log)
        self.assertEqual(self.failures(), {})
        self.assertEqual(self.lines(), [])
        # the pages losing their titles' kcal too (no values anywhere): no record in FIRST_FETCHES -> 4, unmarked
        for pid in range(300, 340):
            self.add('nashi', str(pid), kind='nonut', cat='convenience')
        os.remove(self.state)
        self.assertEqual(self.scrape('--only-shops', 'nashi'), 4, self.log)
        self.assertEqual(self.failures(), {})

    def cover(self):
        sm = os.path.join(self.d, 'sitemap.json')
        K.main(['sitemap', '--out', sm], log=self.log.append)
        d = os.path.join(self.d, 'cov')
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d)
        shutil.copy(self.data, d)
        shutil.copy(self.state, d)
        return K.coverage(d, K.load_sitemap_file(sm), None, shards=1)['summary']

    def move(self, slug, pid, **kw):
        self.site.products[(slug, pid)].update(lastmod='2026-11-14T00:00:00Z', **kw)

    def settled(self):
        """A run that asks no product page but the canary, appends nothing."""
        n = len(self.lines())
        self.assertEqual(self.scrape(), 0, self.log)
        self.assertLessEqual(len(self.product_hits()), 1, self.product_hits())
        self.assertEqual(len(self.lines()), n)

    def test_record_turns_no_nutrition_or_fails(self):
        self.menu()
        self.assertEqual(self.scrape(), 0, self.log)
        self.move('tako-ya', '101', kind='nonut')
        self.move('tako-ya', '103', status=500)
        for _ in range(K.MAX_ATTEMPTS):
            self.assertEqual(self.scrape(), 0, self.log)
            self.assertIn('/ja/shops/tako-ya/products/103/', self.product_hits())
        f = self.failures()
        self.assertEqual((f['tako-ya/101']['status'], f['tako-ya/103']['attempts']), (K.NO_NUTRITION, K.MAX_ATTEMPTS))
        self.settled()
        cov = self.cover()
        self.assertTrue(cov['complete'], cov)
        self.assertEqual(cov['products']['stale_final'], 2)

    def test_404_pages(self):
        self.menu()
        self.add('tako-ya', '107', listed=False)
        self.site.products[('tako-ya', '107')]['status'] = 404   # sitemap-only, never a page
        self.assertEqual(self.scrape(), 0, self.log)
        self.move('tako-ya', '106', status=404)   # sitemap-only, held
        self.move('tako-ya', '105', status=404)   # listed, held
        n = len(self.lines())
        self.assertEqual(self.scrape(), 0, self.log)
        new = self.lines()[n:]
        self.assertEqual(sorted((r['id'], r['gone'], r['listed']) for r in new),
                         [('105', True, False), ('106', True, False)])
        self.settled()
        cov = self.cover()
        self.assertTrue(cov['complete'], cov)
        self.assertEqual(cov['products']['sitemap_only_pending'], 0)

    def test_removed_shop(self):
        self.menu()
        self.assertEqual(self.scrape(), 0, self.log)
        del self.site.shops['mame-cafe']   # off the index, its listing a 404, off the sitemap
        n = len(self.lines())
        self.assertEqual(self.scrape(), 0, self.log)
        self.assertEqual(sorted((r['id'], r['gone']) for r in self.lines()[n:]), [('201', True), ('202', True)])
        self.assertIn('gone_at', K.read_state(self.state)['shops']['mame-cafe'])
        self.settled()
        cov = self.cover()
        self.assertTrue(cov['complete'], cov)
        self.add('mame-cafe', '205', cat='convenience')   # back
        self.assertEqual(self.scrape(), 0, self.log)
        self.assertEqual(self.lines()[-1]['id'], '205')

    def test_drift_after_records(self):
        """With data held but no canary to ask: 5 drift pages in a row, then no record in the first 30 -> 4."""
        self.menu()
        for pid in range(300, 335):
            self.add('nashi', str(pid), cat='convenience')
        self.assertEqual(self.scrape(), 0, self.log)
        fails, n = self.failures(), len(self.lines())
        with mock.patch.object(K.Shard, 'canary', return_value=None):
            self.site.drift = True
            for pid in ('101', '102', '103', '104', '105'):
                self.move('tako-ya', pid)
            self.assertEqual(self.scrape('--only-shops', 'tako-ya'), 4, self.log)
            self.assertEqual((self.failures(), len(self.lines())), (fails, n))
            for pid in range(300, 335):
                self.move('nashi', str(pid), kind='nonut')
            self.assertEqual(self.scrape('--only-shops', 'nashi'), 4, self.log)
            self.assertEqual((self.failures(), len(self.lines())), (fails, n))
            self.assertIn('first 30', self.log[-1])

    def test_retry_after(self):
        self.menu()
        self.site.queue, self.site.retry_after = [429], '7'
        slept = []
        http = K.Http(os.environ['KALORI_BASE'], log=self.log.append)
        with mock.patch.object(K.time, 'sleep', slept.append):
            self.assertEqual(http.get('/ja/shops/')[0], 429)
            self.assertEqual(http.get('/ja/shops/')[0], 200)
        self.assertEqual(slept, [7.0])
        self.site.queue = [429]
        http = K.Http(os.environ['KALORI_BASE'], budget_s=60, log=self.log.append)
        late = lambda s: setattr(http, 'deadline', K.time.monotonic() - 1)   # the budget ends during the wait
        with mock.patch.object(K.time, 'sleep', late), self.assertRaises(K.Stop) as e:
            http.get('/ja/shops/')
        self.assertEqual(e.exception.reason, 'time budget')

    def test_listing_without_links(self):
        self.menu()
        self.site.no_links = True   # the stated total still there, the link markup changed
        self.assertEqual(self.scrape(), 4, self.log)
        self.assertEqual(self.site.hits.count('/ja/shops/mame-cafe/products/'), 1)

    def test_listing_drift(self):
        self.menu()
        self.site.listing = '<html><title>x</title></html>'
        self.assertEqual(self.scrape(), 4, self.log)
        self.assertNotIn('ids', K.read_state(self.state)['shops'].get('mame-cafe', {}))

    def test_no_nutrition_cap(self):
        self.add('mame-cafe', '201', cat='convenience')
        for pid in ('202', '203', '204'):
            self.add('mame-cafe', pid, kind='nonut', cat='convenience')
        with mock.patch.object(K, 'NO_NUTRITION_MIN', 1):
            self.assertEqual(self.scrape(), 5, self.log)
        self.assertEqual([k for k, f in self.failures().items() if f['status'] == K.NO_NUTRITION], [])
        self.assertEqual([r['id'] for r in self.lines()], ['201'])   # the record kept

    def test_429(self):
        self.menu()
        self.site.status = 429
        self.assertEqual(self.scrape(), 2, self.log)
        self.assertTrue(os.path.exists(self.state))

    def test_network(self):
        self.menu()
        with mock.patch.object(K, 'MAX_NET_ERRORS', 2), \
                mock.patch.object(K.urllib.request, 'urlopen', side_effect=urllib.error.URLError('down')):
            self.assertEqual(self.scrape(), 3, self.log)
        self.assertTrue(os.path.exists(self.state))

    def test_crash_and_signal_save_state(self):
        self.menu()
        with mock.patch.object(K.Shard, 'canary', side_effect=ValueError('boom')), \
                contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(self.scrape(), 1)
        self.assertTrue(os.path.exists(self.state))
        os.remove(self.state)
        with mock.patch.object(K.Shard, 'canary', side_effect=lambda: os.kill(os.getpid(), signal.SIGTERM)):
            self.assertEqual(self.scrape(), 130)
        self.assertIn('tako-ya', K.read_state(self.state)['shops'])
        self.assertIs(signal.getsignal(signal.SIGTERM), signal.SIG_DFL)

    def test_budget_and_cap_resume(self):
        self.menu()
        self.assertEqual(self.scrape('--max-requests', '6'), 0, self.log)
        self.assertEqual(self.scrape(), 0, self.log)
        self.assertEqual(sorted(r['id'] for r in self.lines()),
                         ['101', '102', '103', '104', '105', '106', '201', '202'])

    def test_canary(self):
        idx = fixture('shops_index.html').replace('</section>', '<a href="/ja/shops/fujisoba/products/">x</a></section>', 1)
        pages = {'/ja/shops/': idx, '/ja/shops/fujisoba/products/': fixture('listing_p1.html'),
                 '/ja/shops/fujisoba/products/2764908/': fixture('product_normal.html'),
                 '/ja/shops/starbucks/products/3106035/': fixture('product_drink.html')}
        self.site.answer = lambda p: (200, pages[p]) if p in pages else (404, '')
        self.assertEqual(K.main(['canary'], log=self.log.append), 0, self.log)
        pages['/ja/shops/starbucks/products/3106035/'] = without_table(fixture('product_drink.html'))
        self.assertEqual(K.main(['canary'], log=self.log.append), 4)
        pages['/ja/shops/starbucks/products/3106035/'] = fixture('product_drink.html')
        pages['/ja/shops/fujisoba/products/2764908/'] = fixture('product_drink.html')   # no 推定 badge
        self.assertEqual(K.main(['canary'], log=self.log.append), 4)
        del pages['/ja/shops/fujisoba/products/2764908/']   # gone: skipped
        self.assertEqual(K.main(['canary'], log=self.log.append), 0)


class Import(unittest.TestCase):
    def test_no_side_effects(self):
        self.assertIs(signal.getsignal(signal.SIGINT), signal.default_int_handler)
        self.assertEqual(K.UA, 'Mozilla/5.0 (compatible; personal-poller; +https://github.com/huangwaylon/fitness)')


if __name__ == '__main__':
    unittest.main()
