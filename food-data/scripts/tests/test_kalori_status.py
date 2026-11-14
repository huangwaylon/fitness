"""kalori_status.py: the gates of Kalori's automatic merge, status.json for each verdict, the watch, and
.github/scripts/kalori-status.sh writing it to a local bare repo (git). No network.
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import json, os, shutil, subprocess, sys, tempfile, unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import kalori_status as S  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
NOW = int(datetime(2026, 11, 18, 3, 0, tzinfo=timezone.utc).timestamp() * 1000)   # a Wednesday
DAY = 86400000


def diff(**kw):
    t = {'products_old': 10000, 'products_new': 10050, 'added': 60, 'gone': 10, 'renamed': 5, 'values_changed': 20,
         'est_changed': 3, 'ended_changed': 15}
    t.update(kw)
    return {'totals': t}


def cov(complete=True):
    return {'summary': {'complete': complete, 'shops': {'tracked': 448}, 'products': {
        'fetched': 54000, 'discovered': 54100, 'no_nutrition': 12, 'failed': 0}}}


def kal(n, shops=('a', 'b', 'c'), ended=0):
    return {'items': n, 'shops': set(shops), 'ended': ended}


def gates(**kw):
    a = dict(diff=diff(), coverage=cov(), new=kal(10050), old=kal(10000), convert={'dropped': {'no_kcal': 40}},
             prev={'dataset': {'dropped': {'no_kcal': 30}}}, tests_ok=True)
    a.update(kw)
    return S.gates(**a)


class Gates(unittest.TestCase):
    def test_a_normal_week_merges(self):
        g = gates()
        self.assertTrue(g['ok'], g['reasons'])
        self.assertEqual(g['itemsDelta'], 50)
        self.assertEqual(g['dropped'], {'no_kcal': 40})
        self.assertIn('Within every band', S.gates_markdown(g))

    def test_each_band(self):
        cases = {'band_added': dict(diff=diff(added=251)), 'band_gone': dict(diff=diff(gone=151)),
                 'band_values': dict(diff=diff(values_changed=101)), 'band_est': dict(diff=diff(est_changed=51)),
                 'band_ended': dict(diff=diff(ended_changed=101)), 'band_items': dict(new=kal(10201)),
                 'tests': dict(tests_ok=False), 'incomplete': dict(coverage=cov(False)),
                 'diff_gate': dict(flags=['allow_big_diff']),
                 'band_drops': dict(convert={'dropped': {'no_kcal': 30 + 51}})}
        for reason, kw in cases.items():
            with self.subTest(reason):
                g = gates(**kw)
                self.assertFalse(g['ok'])
                self.assertEqual(g['reasons'], [reason])
                self.assertIn('**HELD**', S.gates_markdown(g))
        # (renamed has no code of its own: band_values)
        self.assertEqual(gates(diff=diff(renamed=101))['reasons'], ['band_values'])
        # exactly at a band: in
        self.assertTrue(gates(diff=diff(added=250, gone=150, values_changed=100))['ok'])
        self.assertTrue(gates(new=kal(9800))['ok'])
        self.assertFalse(gates(new=kal(9799))['ok'])

    def test_shops(self):
        self.assertTrue(gates(new=kal(10050, shops=('c',)))['ok'])           # 2 lost
        g = gates(new=kal(10050, shops=()))
        self.assertEqual((g['reasons'], g['shopsLost']), (['band_shops'], ['a', 'b', 'c']))
        many = tuple('s%d' % i for i in range(11))
        self.assertEqual(gates(new=kal(10050, shops=('a', 'b', 'c') + many))['reasons'], ['band_shops'])

    def test_drops_skipped_without_the_previous(self):
        g = gates(prev={}, convert={'dropped': {'no_kcal': 5000}})
        self.assertTrue(g['ok'])
        self.assertIn('skipped', ' '.join(g['notes']))
        self.assertIn('skipped', S.gates_markdown(g))
        self.assertTrue(gates(convert=None)['ok'])

    def test_no_diff_is_held(self):
        g = gates(diff={})
        self.assertFalse(g['ok'])
        self.assertIn('band_added', g['reasons'])

    def test_adaptive_bands(self):
        hist = [{'result': 'merged', 'added': 400, 'gone': 0, 'valuesChanged': 0, 'endedChanged': 0}] * 3
        self.assertEqual(gates(diff=diff(added=500), prev={'history': hist})['reasons'], ['band_added'])   # 3: fixed
        hist = hist + [{'result': 'held', 'added': 9999}, {'result': 'merged', 'added': 300, 'gone': 0,
                                                            'valuesChanged': 0, 'endedChanged': 0}]
        g = gates(diff=diff(added=450), prev={'history': hist})   # 4 merged: max(2.5 %, 3 x 400 / 10000 = 12 %), cap 5 %
        self.assertTrue(g['ok'], g['reasons'])
        row = next(r for r in g['rows'] if r['key'] == 'added')
        self.assertAlmostEqual(row['limit'], 0.05)
        self.assertEqual(gates(diff=diff(added=501), prev={'history': hist})['reasons'], ['band_added'])
        self.assertIn('adaptive', row['note'])
        self.assertEqual(next(r for r in g['rows'] if r['key'] == 'gone')['limit'], S.BANDS['gone'])   # never lower

    def test_env_overrides(self):
        os.environ['KALORI_BAND_ADDED'] = '0.5'
        try:
            b, extra = S.bands_from_env()
        finally:
            del os.environ['KALORI_BAND_ADDED']
        self.assertEqual((b['added'], b['gone'], extra['lost']), (0.5, S.BANDS['gone'], S.SHOPS_LOST))


class Args:
    def __init__(self, **kw):
        self.__dict__.update(run_id='7', run_url='https://x/runs/7', event='schedule', round='1', started_at=NOW - 3600000,
                             shards_done='20', repo='o/r', alert_text='', fetch_py=None, kalori=None, reasons='', tag='',
                             diff='', coverage='', gates='', merge_sha='', merge_pr='', deploy='', pr_url='', result='published',
                             sha='', reason='')
        self.__dict__.update(kw)


class Status(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.d)
        self.files = {}
        for name, doc in {'diff': diff(), 'coverage': cov(), 'gates': gates()}.items():
            p = os.path.join(self.d, name + '.json')
            with open(p, 'w') as fh:
                json.dump(doc, fh, default=sorted)
            self.files[name] = p
        self.fetch_py = os.path.join(self.d, 'fetch.py')
        with open(self.fetch_py, 'w') as fh:
            fh.write("X = 1\nKALORI_TAG = 'kalori-2026-11-18'\n")
        self.kalori = os.path.join(self.d, 'kalori.json')
        with open(self.kalori, 'w') as fh:
            json.dump({'items': [{'id': 1}, {'id': 2, 'ended': True}], 'shops': {'a': {}}}, fh)

    def final(self, prev=None, **kw):
        return S.final(prev or {}, Args(fetch_py=self.fetch_py, kalori=self.kalori, **kw), NOW)

    def test_next_run(self):
        nxt = datetime.fromtimestamp(S.next_run(NOW) / 1000, timezone.utc)
        self.assertEqual((nxt.weekday(), nxt.hour, nxt.minute, nxt.day), (1, 17, 41, 24))
        tue = int(datetime(2026, 11, 17, 17, 40, tzinfo=timezone.utc).timestamp() * 1000)
        self.assertEqual(datetime.fromtimestamp(S.next_run(tue) / 1000, timezone.utc).day, 17)

    def test_running(self):
        s = S.running({'history': [{'t': 1}], 'alert': {'text': 'x', 'since': 5}}, Args(round='3', shards_done='14'), NOW)
        self.assertEqual((s['verdict'], s['run']['result'], s['run']['round'], s['run']['shardsDone']), ('running', 'running', 3, 14))
        self.assertEqual((s['run']['endedAt'], s['run']['shardsTotal'], s['history'], s['alert']['since']), (None, 20, [{'t': 1}], 5))
        self.assertEqual(s['v'], 1)

    def test_healthy(self):
        prev = {'alert': {'text': 'old', 'since': 1}, 'history': [{'t': i, 'result': 'merged'} for i in range(12)]}
        s = self.final(prev, merge_sha='abc', deploy='pending', tag='kalori-2026-11-18', **{k: v for k, v in self.files.items()})
        self.assertEqual((s['verdict'], s['reasons'], s['alert']), ('healthy', [], None))
        self.assertEqual(s['merge'], {'sha': 'abc', 'deploy': 'pending', 'pr': None})
        self.assertEqual(s['dataset'], {'tag': 'kalori-2026-11-18', 'date': '2026-11-18', 'url': 'https://github.com/o/r/releases/tag/kalori-2026-11-18',
                                        'items': 2, 'shops': 1, 'ended': 1, 'dropped': {'no_kcal': 40}})
        self.assertEqual(len(s['history']), 12)
        h = s['history'][-1]
        self.assertEqual((h['result'], h['tag'], h['added'], h['valuesChanged'], h['ms']), ('merged', 'kalori-2026-11-18', 60, 20, 3600000))
        self.assertEqual(s['diff']['itemsDelta'], 50)
        self.assertEqual(s['diff']['shares']['added'], 0.006)
        self.assertEqual(s['diff']['limits'], {'added': 0.025, 'gone': 0.015, 'valuesChanged': 0.01, 'estChanged': 0.005})
        self.assertEqual(s['coverage'], {'complete': True, 'fetched': 54000, 'discovered': 54100, 'shopsTracked': 448,
                                         'noNutrition': 12, 'failed': 0})
        self.assertEqual(s['run']['endedAt'], NOW)

    def test_held(self):
        s = self.final({'alert': {'text': 'x', 'since': 9}}, result='held', reasons='band_added,tests', merge_pr='https://pr/1',
                       deploy='held', tag='kalori-2026-11-18', diff=self.files['diff'])
        self.assertEqual((s['verdict'], s['reasons']), ('failing', ['band_added', 'tests']))   # tests: failing, not held
        s = self.final({}, result='held', reasons='band_added', merge_pr='https://pr/1', deploy='held', diff=self.files['diff'])
        self.assertEqual(s['verdict'], 'held')
        self.assertEqual(s['alert'], {'text': 'too many added', 'since': NOW, 'runUrl': 'https://x/runs/7',
                                      'prUrl': 'https://pr/1', 'issueUrl': None})
        self.assertEqual(s['merge'], {'sha': None, 'deploy': 'held', 'pr': 'https://pr/1'})
        self.assertEqual(s['history'][-1]['result'], 'held')
        self.assertEqual(self.final({}, result='held', reasons='main_moved')['verdict'], 'held')
        self.assertEqual(self.final({}, result='held', reasons='diff_gate')['verdict'], 'held')

    def test_failing_keeps_the_alert_since_and_the_last_merge(self):
        prev = {'alert': {'text': 'x', 'since': 9}, 'merge': {'sha': 'old', 'deploy': 'ok', 'pr': None},
                'diff': {'added': 1}, 'dataset': {'tag': 'kalori-2026-11-18', 'dropped': {'a': 1}}}
        s = self.final(prev, result='failed', reasons='drift', alert_text='canary: layout drift (exit 4)')
        self.assertEqual((s['verdict'], s['alert']['text'], s['alert']['since']), ('failing', 'canary: layout drift (exit 4)', 9))
        self.assertEqual((s['merge']['sha'], s['diff'], s['dataset']['dropped']), ('old', {'added': 1}, {'a': 1}))
        self.assertEqual(s['history'][-1]['result'], 'failed')

    def test_a_round_retried_and_a_cancelled_run(self):
        s = self.final({'alert': {'text': 'x', 'since': 9}}, result='running', shards_done='17')
        self.assertEqual((s['verdict'], s['run']['result'], s['history'], s['alert']['since']), ('running', 'running', [], 9))
        s = self.final({}, result='cancelled')
        self.assertEqual((s['verdict'], s['run']['result'], s['history']), ('none', 'cancelled', []))

    def test_deploy(self):
        prev = {'verdict': 'healthy', 'reasons': [], 'merge': {'sha': 'abc', 'deploy': 'pending', 'pr': None},
                'dataset': {'tag': 'kalori-2026-11-18'}, 'history': [{'result': 'merged', 'tag': 'kalori-2026-11-18'}]}
        s = S.deploy(prev, Args(sha='abc', deploy='ok'), NOW)
        self.assertEqual((s['merge']['deploy'], s['verdict'], s['alert']), ('ok', 'healthy', None))
        s = S.deploy(prev, Args(sha='abc', deploy='failed', reason='deploy_failed'), NOW)
        self.assertEqual((s['merge']['deploy'], s['verdict'], s['reasons']), ('failed', 'failing', ['deploy_failed']))
        self.assertTrue(s['alert']['text'])
        s2 = S.deploy(s, Args(sha='abc', deploy='ok'), NOW)   # re-run by hand later, green
        self.assertEqual((s2['verdict'], s2['reasons'], s2['alert']), ('healthy', [], None))
        r = S.deploy(prev, Args(sha='abc', deploy='reverted', reason='reverted', fetch_py=self.fetch_py, kalori=self.kalori), NOW)
        self.assertEqual((r['merge']['deploy'], r['verdict'], r['history'][-1]['result']), ('reverted', 'failing', 'failed'))
        self.assertEqual(S.deploy(r, Args(sha='abc', deploy='ok'), NOW)['merge']['deploy'], 'reverted')   # a late green
        other = S.deploy(prev, Args(sha='zzz', deploy='ok'), NOW)
        self.assertEqual(other['merge']['sha'], 'abc')
        held = dict(prev, merge={'sha': None, 'deploy': 'held', 'pr': 'p'})   # a later run held: an old merge's news
        self.assertEqual(S.deploy(held, Args(sha='abc', deploy='ok'), NOW)['merge'], held['merge'])

    def test_final_never_undoes_the_watch(self):
        # the watch reverted merge abc; a re-run status job writing abc's final again keeps it
        prev = {'verdict': 'failing', 'reasons': ['reverted'], 'merge': {'sha': 'abc', 'deploy': 'reverted', 'pr': None},
                'alert': {'text': 'reverted', 'since': 5}}
        s = self.final(prev, merge_sha='abc', deploy='pending', tag='kalori-2026-11-18')
        self.assertEqual((s['verdict'], s['reasons'], s['merge']['deploy'], s['alert']['text'], s['alert']['since']),
                         ('failing', ['reverted'], 'reverted', 'reverted', 5))
        ok = dict(prev, verdict='healthy', reasons=[], alert=None, merge={'sha': 'abc', 'deploy': 'ok', 'pr': None})
        self.assertEqual(self.final(ok, merge_sha='abc', deploy='pending')['merge']['deploy'], 'ok')
        s = self.final(prev, merge_sha='new', deploy='pending')   # another merge: its own
        self.assertEqual((s['verdict'], s['reasons'], s['merge']['deploy'], s['alert']), ('healthy', [], 'pending', None))

    def test_watch_the_status(self):
        runs = [{'event': 'schedule', 'status': 'completed', 'createdAt': '2026-11-17T17:41:00Z'}]
        pending = {'merge': {'sha': 'abc', 'deploy': 'pending'}, 'run': {'endedAt': NOW - 4 * 3600000}}
        self.assertEqual(S.watch(runs, NOW, pending)['reasons'], ['deploy_failed'])
        self.assertEqual(S.watch(runs, NOW, dict(pending, run={'endedAt': NOW - 3600000}))['reasons'], [])
        running = {'verdict': 'running', 'at': NOW - 9 * 3600000}
        self.assertEqual(S.watch(runs, NOW, running)['reasons'], ['stuck'])
        busy = runs + [{'event': 'workflow_dispatch', 'status': 'in_progress', 'createdAt': '2026-11-18T01:00:00Z'}]
        self.assertEqual(S.watch(busy, NOW, running)['reasons'], [])
        self.assertEqual(S.watch(runs, NOW, dict(running, at=NOW - 3600000))['reasons'], [])

    def test_undo_and_alert(self):
        prev = {'verdict': 'healthy', 'merge': {'sha': 'abc', 'deploy': 'ok', 'pr': None},
                'dataset': {'tag': 'kalori-2026-11-18'}, 'history': [{'result': 'merged', 'tag': 'kalori-2026-11-18'}]}
        s = S.undo(prev, Args(tag='kalori-2026-11-18', fetch_py=self.fetch_py, kalori=self.kalori), NOW)
        self.assertEqual((s['history'][-1]['result'], s['merge']['deploy']), ('failed', 'reverted'))
        s = S.late(prev, Args(reasons='update', alert_text='update-merge failed'), NOW)
        self.assertEqual((s['verdict'], s['reasons'], s['alert']['text']), ('failing', ['update'], 'update-merge failed'))

    def test_watch(self):
        runs = [{'event': 'schedule', 'status': 'completed', 'createdAt': '2026-11-10T17:41:00Z'},
                {'event': 'workflow_dispatch', 'status': 'completed', 'createdAt': '2026-11-17T00:00:00Z'}]
        self.assertEqual(S.watch(runs, NOW)['reasons'], [])
        self.assertEqual(S.watch(runs, NOW + 2 * DAY)['reasons'], ['late'])
        self.assertEqual(S.watch([], NOW)['reasons'], ['late'])
        stuck = runs + [{'event': 'workflow_dispatch', 'status': 'in_progress', 'createdAt': '2026-11-15T00:00:00Z', 'url': 'u'}]
        w = S.watch(stuck, NOW)
        self.assertEqual(w['reasons'], ['stuck'])
        self.assertIn('2026-11-15', w['text'])

    def test_late(self):
        s = S.late({'verdict': 'healthy', 'reasons': []}, Args(reasons='late', alert_text='no run'), NOW)
        self.assertEqual((s['verdict'], s['reasons'], s['alert']['text']), ('late', ['late'], 'no run'))
        s = S.late({'verdict': 'held', 'reasons': ['band_added']}, Args(reasons='late'), NOW)
        self.assertEqual((s['verdict'], s['reasons']), ('held', ['band_added', 'late']))

    def test_cli(self):
        out = os.path.join(self.d, 'status.json')
        S.main(['final', '--out', out, '--now', str(NOW), '--run-id', '9', '--result', 'published', '--merge-sha', 'abc',
                '--diff', self.files['diff'], '--coverage', self.files['coverage'], '--gates', self.files['gates'],
                '--fetch-py', self.fetch_py, '--kalori', self.kalori, '--deploy', 'pending'])
        with open(out) as fh:
            s = json.load(fh)
        self.assertEqual(set(s), {'v', 'at', 'verdict', 'reasons', 'run', 'next', 'dataset', 'diff', 'coverage', 'merge',
                                  'alert', 'history'})
        self.assertEqual(set(s['run']), {'id', 'url', 'event', 'round', 'result', 'startedAt', 'endedAt', 'shardsDone', 'shardsTotal'})
        self.assertEqual(s['verdict'], 'healthy')


FOOD = os.path.join(ROOT, 'app', 'static', 'food')


@unittest.skipUnless(os.path.isfile(os.path.join(FOOD, 'index.json')) and shutil.which('jq') and shutil.which('bash'),
                     "the app's food files (not in food-data.yml's checkout), jq, bash")
class IndexAsFoodDataTs(unittest.TestCase):
    """update-merge's index.json check (.github/scripts/kalori-index.sh) and its own shipping (kalori-ship.mjs) agree
    with app/scripts/food-data.ts: on the committed files, which food-data.ts wrote, byte for byte."""
    def setUp(self):
        self.d = os.path.join(tempfile.mkdtemp(), 'food')
        self.addCleanup(shutil.rmtree, os.path.dirname(self.d))
        shutil.copytree(FOOD, self.d)

    def check(self, index):
        return subprocess.run(['bash', os.path.join(ROOT, '.github', 'scripts', 'kalori-index.sh'), self.d, index],
                              capture_output=True).returncode

    def test_index(self):
        self.assertEqual(self.check(os.path.join(FOOD, 'index.json')), 0)
        with open(os.path.join(self.d, 'kalori.json'), 'ab') as fh:
            fh.write(b' ')
        self.assertEqual(self.check(os.path.join(FOOD, 'index.json')), 1)

    def test_kalori_entry_is_food_data_ts(self):
        ts = os.path.join(ROOT, 'app', 'scripts', 'food-data.ts')
        if not os.path.isfile(ts):
            self.skipTest('no app/scripts/food-data.ts')
        with open(ts, encoding='utf-8') as fh:
            want = "const KALORI = { file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true };"
            self.assertIn(want, fh.read())
        with open(os.path.join(ROOT, '.github', 'scripts', 'kalori-ship.mjs'), encoding='utf-8') as fh:
            self.assertIn(want, fh.read())

    @unittest.skipUnless(shutil.which('node'), 'node')
    def test_ship(self):
        src = os.path.join(os.path.dirname(self.d), 'converted.json')
        with open(os.path.join(FOOD, 'kalori.json'), encoding='utf-8') as fh, open(src, 'w', encoding='utf-8') as out:
            json.dump(json.load(fh), out, ensure_ascii=False, separators=(',', ':'))   # Python's bytes, as the converter's
        subprocess.run(['node', os.path.join(ROOT, '.github', 'scripts', 'kalori-ship.mjs'), src, self.d], check=True)
        for f in ('kalori.json', 'index.json'):
            with open(os.path.join(self.d, f), 'rb') as a, open(os.path.join(FOOD, f), 'rb') as b:
                self.assertTrue(a.read() == b.read(), f)


@unittest.skipUnless(shutil.which('git') and shutil.which('bash'), 'git and bash')
class StatusBranch(unittest.TestCase):
    """kalori-status.sh against a local bare repo: the orphan branch made, then one commit replaced each write."""
    def test_writes(self):
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d)
        remote = os.path.join(d, 'r.git')
        subprocess.run(['git', 'init', '-q', '--bare', remote], check=True)
        env = dict(os.environ, KALORI_STATUS_REMOTE=remote, GH_REPO='o/r')
        sh = os.path.join(ROOT, '.github', 'scripts', 'kalori-status.sh')
        run = lambda *a: subprocess.run(['bash', sh, *a], env=env, check=True, capture_output=True, text=True).stdout
        self.assertEqual(json.loads(run('get')), {})
        run('running', '--run-id', '1', '--now', str(NOW))
        run('final', '--run-id', '1', '--result', 'failed', '--reasons', 'crash', '--now', str(NOW + 1))
        s = json.loads(run('get'))
        self.assertEqual((s['verdict'], s['run']['id'], len(s['history'])), ('failing', 1, 1))
        log = subprocess.run(['git', '--git-dir', remote, 'log', '--format=%s', 'kalori-status'], check=True,
                             capture_output=True, text=True).stdout.split('\n')
        self.assertEqual(log[0], 'Kalori status: final')
        self.assertEqual(len([x for x in log if x]), 1)
        files = subprocess.run(['git', '--git-dir', remote, 'ls-tree', '--name-only', 'kalori-status'], check=True,
                               capture_output=True, text=True).stdout.split()
        self.assertEqual(files, ['status.json'])


if __name__ == '__main__':
    unittest.main()
