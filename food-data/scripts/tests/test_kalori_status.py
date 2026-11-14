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
        self.assertEqual((s['verdict'], s['reasons']), ('held', ['band_added', 'tests']))   # tests: held, as the run says
        s = self.final({}, result='held', reasons='tests', deploy='held')   # b9a479f28: tests alone held the merge
        self.assertEqual((s['verdict'], s['run']['result'], s['history'][-1]['result']), ('held', 'held', 'held'))
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
        self.assertEqual(S.watch(runs, NOW, pending)['reasons'], [])   # a pending deploy: the backstop's (decide)
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


# 2026-11-14: the auto merge 9e0becb55's status.json stuck at pending (no workflow_run for the token's dispatches) and
# its two dispatched runs, both green (the API's workflow_runs, trimmed)
SHA = '9e0becb55886b0b8b19a4bfea5789b2698ced2f1'
ENDED = 1794641575024   # 07:32:55Z, the status job's write just before the dispatch
TODAY = {'v': 1, 'at': ENDED, 'verdict': 'healthy', 'reasons': [], 'alert': None, 'history': [],
         'run': {'id': 43571075376, 'event': 'workflow_dispatch', 'result': 'published', 'endedAt': ENDED},
         'merge': {'sha': SHA, 'deploy': 'pending', 'pr': None}}


def wf_run(name, conclusion='success', status='completed', attempt=1, created='2026-11-14T07:32:57Z', sha=SHA,
           event='workflow_dispatch', id=1):
    path = {'Deploy UI': '.github/workflows/pages.yml', 'Food data checks': '.github/workflows/food-data.yml'}[name]
    return {'id': id, 'name': name, 'path': path, 'event': event, 'head_sha': sha, 'status': status,
            'conclusion': conclusion if status == 'completed' else None, 'run_attempt': attempt, 'created_at': created,
            'html_url': 'https://github.com/o/r/actions/runs/%d' % id}


TODAY_RUNS = [wf_run('Food data checks', created='2026-11-14T07:32:59Z', id=43571616841),
              wf_run('Deploy UI', id=43571614893)]
MIN = 60000


class Decide(unittest.TestCase):
    """The deploy's next step (kalori-deploy.sh: kalori-scrape.yml's deploy-check, kalori-watch.yml's backstop)."""
    def d(self, runs, after=5, **kw):
        return S.decide(runs, SHA, ENDED, ENDED + after * MIN, **kw)

    def test_both_green(self):
        r = self.d(TODAY_RUNS)
        self.assertEqual((r['action'], r['id'], r['sha']), ('ok', 43571614893, SHA))

    def test_food_data_failed_reverts_first(self):
        runs = [wf_run('Food data checks', 'failure', id=2), wf_run('Deploy UI', status='in_progress', id=3)]
        self.assertEqual((self.d(runs)['action'], self.d(runs)['id']), ('revert', 2))
        runs = [wf_run('Food data checks', 'timed_out', id=2), wf_run('Deploy UI', 'failure', id=3)]
        self.assertEqual(self.d(runs)['action'], 'revert')
        self.assertEqual(self.d([wf_run('Food data checks', 'cancelled', id=2)])['action'], 'failed')

    def test_deploy_failed_reruns_once(self):
        food = wf_run('Food data checks', id=2)
        r = self.d([food, wf_run('Deploy UI', 'failure', id=3)])
        self.assertEqual((r['action'], r['id']), ('rerun', 3))
        self.assertEqual(self.d([food, wf_run('Deploy UI', 'failure', id=3)], reran=3)['action'], 'wait')  # not begun
        self.assertEqual(self.d([food, wf_run('Deploy UI', 'failure', id=3)], reran='3')['action'], 'wait')
        self.assertEqual(self.d([food, wf_run('Deploy UI', status='in_progress', attempt=2, id=3)], reran=3)['action'], 'wait')
        self.assertEqual(self.d([food, wf_run('Deploy UI', 'failure', attempt=2, id=3)], reran=3)['action'], 'failed')
        self.assertEqual(self.d([food, wf_run('Deploy UI', attempt=2, id=3)], reran=3)['action'], 'ok')

    def test_waits_then_dispatch_not_seen(self):
        self.assertEqual(self.d([], after=10)['action'], 'wait')
        self.assertEqual(self.d([wf_run('Deploy UI', status='queued')])['action'], 'wait')
        r = self.d([wf_run('Deploy UI', status='in_progress')], after=71)
        self.assertEqual(r['action'], 'failed')
        self.assertIn('dispatch not seen: no Food data checks run', r['why'])
        self.assertEqual(self.d([wf_run('Deploy UI', status='in_progress'), wf_run('Food data checks')], after=200)['action'], 'wait')
        self.assertEqual(self.d([], after=71, limit_min=80)['action'], 'wait')

    def test_only_the_dispatched_runs_of_the_sha(self):
        food = wf_run('Food data checks', id=2)
        for other in (wf_run('Deploy UI', 'failure', sha='0' * 40), wf_run('Deploy UI', 'failure', event='push'),
                      wf_run('Deploy UI', 'failure', created='2026-11-14T07:20:00Z')):   # before the dispatch
            self.assertEqual(self.d([food, other, wf_run('Deploy UI', id=3)])['action'], 'ok')
        # the newest run counts (a later dispatch by hand, green)
        runs = [food, wf_run('Deploy UI', 'failure', attempt=2, id=3), wf_run('Deploy UI', created='2026-11-14T08:30:00Z', id=4)]
        self.assertEqual(self.d(runs)['id'], 4)
        # (within the clock's slack: a run a minute before `since` counts)
        self.assertEqual(self.d([food, wf_run('Deploy UI', created='2026-11-14T07:32:00Z')])['action'], 'ok')

    def test_a_later_head_holding_the_sha(self):   # `--ref main` dispatches main's tip: a push between gives a later head
        later = 'f' * 40
        runs = [wf_run('Food data checks', id=2, sha=later), wf_run('Deploy UI', id=3, sha=later)]
        self.assertEqual(self.d(runs)['action'], 'wait')
        self.assertEqual(self.d(runs, after=71)['action'], 'failed')
        self.assertEqual(self.d(runs, also=[later, ''])['action'], 'ok')
        self.assertEqual(S.decide_pending(TODAY, runs, ENDED + 161 * MIN, also=[later])['action'], 'ok')

    def test_revert_cancels_the_unfinished_deploys(self):
        later = 'f' * 40
        runs = [wf_run('Food data checks', 'failure', id=2), wf_run('Deploy UI', status='in_progress', id=3),
                wf_run('Deploy UI', status='queued', attempt=2, id=4, sha=later), wf_run('Deploy UI', id=5),
                wf_run('Deploy UI', status='queued', id=6, sha='0' * 40)]
        r = self.d(runs, also=[later])
        self.assertEqual((r['action'], r['cancel']), ('revert', [3, 4]))
        self.assertNotIn('cancel', self.d(TODAY_RUNS))

    def test_backstop_resolves_todays_pending(self):
        self.assertEqual(S.decide_pending(TODAY, TODAY_RUNS, ENDED + 150 * MIN)['action'], 'none')   # deploy-check's yet
        r = S.decide_pending(TODAY, TODAY_RUNS, ENDED + 161 * MIN)
        self.assertEqual((r['action'], r['sha']), ('ok', SHA))
        s = S.deploy(TODAY, Args(sha=SHA, deploy='ok', run_url=r['url']), ENDED + 161 * MIN)
        self.assertEqual((s['merge'], s['verdict'], s['alert']), ({'sha': SHA, 'deploy': 'ok', 'pr': None}, 'healthy', None))
        self.assertEqual(S.decide_pending(s, TODAY_RUNS, ENDED + 161 * MIN)['action'], 'none')   # resolved: left alone
        self.assertEqual(S.decide_pending(TODAY, [], ENDED + 161 * MIN)['action'], 'failed')      # nothing dispatched
        self.assertEqual(S.decide_pending({}, TODAY_RUNS, ENDED + 161 * MIN)['action'], 'none')

    def test_cli(self):
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d)
        runs, st = os.path.join(d, 'runs.json'), os.path.join(d, 'status.json')
        for p, doc in ((runs, TODAY_RUNS), (st, TODAY)):
            with open(p, 'w') as fh:
                json.dump(doc, fh)
        cli = lambda *a: json.loads(subprocess.run([sys.executable, '-I', S.__file__, 'decide', '--runs', runs, *a], check=True,
                                                   capture_output=True, text=True).stdout)
        self.assertEqual(cli('--prev', st, '--now', str(ENDED + 161 * MIN))['action'], 'ok')
        self.assertEqual(cli('--sha', SHA, '--since', '2026-11-14T07:32:55Z', '--now', str(ENDED + MIN))['action'], 'ok')


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


@unittest.skipUnless(shutil.which('git') and shutil.which('bash') and shutil.which('jq'), 'git, bash and jq')
class DeployScript(unittest.TestCase):
    """kalori-deploy.sh backstop in a scratch repo (its scripts copied; origin and the status branch a local bare repo;
    gh a stub that answers the runs and logs the rest)."""
    def setUp(self):
        self.d = d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d)
        self.origin, self.work, self.log = os.path.join(d, 'o.git'), os.path.join(d, 'w'), os.path.join(d, 'gh.log')
        self.runs, binp = os.path.join(d, 'runs.json'), os.path.join(d, 'bin')
        os.makedirs(binp)
        with open(os.path.join(binp, 'gh'), 'w') as fh:
            fh.write('#!/usr/bin/env bash\necho "$*" >> "$GH_LOG"\ncase "$1 $2" in\n'
                     '  "api "*/runs/[0-9]*) echo "${GH_ATTEMPT:-1}" ;;\n  "api "*) cat "$GH_RUNS" ;;\n'
                     '  "run rerun") exit "${GH_RERUN_RC:-0}" ;;\nesac\n')
        os.chmod(os.path.join(binp, 'gh'), 0o755)
        self.env = dict(os.environ, PATH=binp + os.pathsep + os.environ['PATH'], GH_REPO='o/r', GH_LOG=self.log,
                        GH_RUNS=self.runs, KALORI_STATUS_REMOTE=self.origin, KALORI_DEPLOY_POLL='0', KALORI_NOW=str(ENDED + 161 * MIN),
                        GIT_CONFIG_GLOBAL=os.devnull, GIT_CONFIG_NOSYSTEM='1')
        for k in ('GITHUB_RUN_ID', 'GH_TOKEN'):
            self.env.pop(k, None)
        self.git('init', '-q', '--bare', '-b', 'main', self.origin, cwd=d)
        shutil.copytree(os.path.join(ROOT, '.github', 'scripts'), os.path.join(self.work, '.github', 'scripts'))
        os.makedirs(os.path.join(self.work, 'food-data', 'scripts'))
        os.makedirs(os.path.join(self.work, 'app', 'static', 'food'))
        shutil.copy(S.__file__, os.path.join(self.work, 'food-data', 'scripts'))
        self.git('init', '-q', '-b', 'main')
        self.git('remote', 'add', 'origin', self.origin)
        self.commit('kalori-2026-11-07', 1, 'base', 'Me')

    def git(self, *a, cwd=None):
        return subprocess.run(['git', *a], cwd=cwd or self.work, env=self.env, check=True, capture_output=True,
                              text=True).stdout.strip()

    def commit(self, tag, n, msg, who):
        with open(os.path.join(self.work, 'food-data', 'scripts', 'fetch.py'), 'w') as fh:
            fh.write("KALORI_TAG = '%s'\n" % tag)
        with open(os.path.join(self.work, 'app', 'static', 'food', 'kalori.json'), 'w') as fh:
            json.dump({'items': [{'id': i} for i in range(n)], 'shops': {'a': {}}}, fh)
        self.git('add', '-A')
        mail = '41898282+github-actions[bot]@users.noreply.github.com' if who == 'github-actions[bot]' else 'me@x'
        self.git('-c', 'user.name=' + who, '-c', 'user.email=' + mail, 'commit', '-q', '-m', msg)
        self.git('push', '-q', 'origin', 'HEAD:refs/heads/main')
        return self.git('rev-parse', 'HEAD')

    def setup(self, runs_of, who='github-actions[bot]'):
        sha = self.commit('kalori-2026-11-14-2', 3, 'Kalori: kalori-2026-11-14-2 (auto)', who)
        self.pending(sha)
        with open(self.runs, 'w') as fh:
            json.dump([dict(r, head_sha=sha) for r in runs_of], fh)
        return sha

    def pending(self, sha):
        st = os.path.join(self.d, 'status.json')
        with open(st, 'w') as fh:
            json.dump(dict(TODAY, merge={'sha': sha, 'deploy': 'pending', 'pr': None}), fh)
        blob = self.git('hash-object', '-w', st)
        tree = subprocess.run(['git', 'mktree'], cwd=self.work, input='100644 blob %s\tstatus.json\n' % blob, check=True,
                              capture_output=True, text=True).stdout.strip()
        c = self.git('-c', 'user.name=t', '-c', 'user.email=t@x', 'commit-tree', tree, '-m', 'seed')
        self.git('push', '-q', '-f', 'origin', c + ':refs/heads/kalori-status')

    def backstop(self, *cmd):
        p = subprocess.run(['bash', os.path.join(self.work, '.github', 'scripts', 'kalori-deploy.sh'), *(cmd or ['backstop'])],
                           env=self.env, capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        return json.loads(self.git('show', 'origin/kalori-status:status.json') if not self.git('fetch', '-q', 'origin')
                          else '{}')

    def gh_log(self):
        with open(self.log) as fh:
            return fh.read()

    def test_todays_pending_resolves_ok(self):
        sha = self.setup(TODAY_RUNS)
        s = self.backstop()
        self.assertEqual((s['merge']['deploy'], s['merge']['sha'], s['verdict']), ('ok', sha, 'healthy'))
        self.assertNotIn('workflow run', self.gh_log())

    def test_check(self):   # kalori-scrape.yml's deploy-check: the same outcome, at once when the runs are done
        sha = self.setup(TODAY_RUNS)
        self.assertEqual(self.backstop('check', sha, '2026-11-14T07:32:55Z')['merge']['deploy'], 'ok')

    def test_food_data_failed_reverts_once(self):
        sha = self.setup([wf_run('Food data checks', 'failure', id=2), wf_run('Deploy UI', id=3)])
        s = self.backstop()
        self.assertEqual((s['merge']['deploy'], s['reasons'], s['dataset']['tag'], s['dataset']['items']),
                         ('reverted', ['reverted'], 'kalori-2026-11-07', 1))
        self.assertEqual(self.git('log', '-1', '--format=%s', 'origin/main'), 'Revert "Kalori: kalori-2026-11-14-2 (auto)"')
        self.assertIn('workflow run pages.yml --ref main', self.gh_log())
        self.pending(sha)   # again (a second pass, the other job): no second revert
        self.assertEqual(self.backstop()['merge']['deploy'], 'reverted')
        self.assertEqual(self.git('rev-list', '--count', sha + '..origin/main'), '1')

    def test_a_revert_that_conflicts_fails(self):   # the job fails (its failure step writes deploy_failed)
        sha = self.setup([wf_run('Food data checks', 'failure', id=2)])
        self.commit('kalori-2026-11-14-3', 5, 'later', 'Me')
        p = subprocess.run(['bash', os.path.join(self.work, '.github', 'scripts', 'kalori-deploy.sh'), 'backstop'],
                           env=self.env, capture_output=True, text=True)
        self.assertNotEqual(p.returncode, 0)
        self.assertNotIn('workflow run', self.gh_log())
        self.git('fetch', '-q', 'origin')
        self.assertEqual(json.loads(self.git('show', 'origin/kalori-status:status.json'))['merge']['deploy'], 'pending')
        self.assertEqual(self.git('rev-list', '--count', sha + '..origin/main'), '1')

    def test_a_later_head_counts(self):   # a push between the merge and the dispatch: the runs on main's newer tip
        sha = self.setup([])
        later = self.commit('kalori-2026-11-14-2', 4, 'a later push', 'Me')
        with open(self.runs, 'w') as fh:
            json.dump([wf_run('Food data checks', sha=later, id=2), wf_run('Deploy UI', sha=later, id=3),
                       wf_run('Deploy UI', 'failure', sha='0' * 40, id=4)], fh)
        self.git('reset', '-q', '--hard', sha)   # (the checkout: older than main, the later head fetched)
        s = self.backstop()
        self.assertEqual((s['merge']['deploy'], s['merge']['sha']), ('ok', sha))

    def test_revert_cancels_the_deploys_first(self):
        self.setup([wf_run('Food data checks', 'failure', id=2), wf_run('Deploy UI', status='in_progress', attempt=2, id=3)])
        self.assertEqual(self.backstop()['merge']['deploy'], 'reverted')
        log = self.gh_log()
        self.assertIn('run cancel 3', log)
        self.assertLess(log.rindex('run cancel 3'), log.index('workflow run pages.yml'))   # again before the dispatch
        self.assertEqual(log.count('run cancel 3'), 2)

    def test_a_refused_rerun_fails_at_once(self):
        self.setup([wf_run('Food data checks', id=2), wf_run('Deploy UI', 'failure', id=3)])
        self.env.update(GH_RERUN_RC='1')
        s = self.backstop()
        self.assertEqual((s['merge']['deploy'], s['reasons']), ('failed', ['deploy_failed']))
        self.assertIn('refused', s['alert']['text'])
        with open(self.runs) as fh:
            self.pending(json.load(fh)[0]['head_sha'])
        self.env.update(GH_ATTEMPT='2')   # refused as begun elsewhere: left pending
        self.assertEqual(self.backstop()['merge']['deploy'], 'pending')

    def test_check_refused_rerun_returns(self):
        sha = self.setup([wf_run('Food data checks', id=2), wf_run('Deploy UI', 'failure', id=3)])
        self.env.update(GH_RERUN_RC='1')
        self.assertEqual(self.backstop('check', sha, '2026-11-14T07:32:55Z')['merge']['deploy'], 'failed')

    def test_not_the_bots_commit_is_left(self):
        sha = self.setup([wf_run('Food data checks', 'failure', id=2)], who='Me')
        s = self.backstop()
        self.assertEqual((s['merge']['deploy'], s['reasons']), ('failed', ['deploy_failed']))
        self.assertEqual(self.git('rev-parse', 'origin/main'), sha)

    def test_deploy_failed_reruns(self):
        self.setup([wf_run('Food data checks', id=2), wf_run('Deploy UI', 'failure', id=3)])
        self.assertEqual(self.backstop()['merge']['deploy'], 'pending')
        self.assertIn('run rerun 3 --failed', self.gh_log())


if __name__ == '__main__':
    unittest.main()


class LateCountsAnyRefresh(unittest.TestCase):
    """late counts the status's own last run and history, not only scheduled runs (the first week has none)."""
    def test_dispatched_refresh_is_not_late(self):
        now = NOW
        prev = {'run': {'result': 'published', 'endedAt': now - 3600000}, 'history': [{'t': now - 3600000}]}
        self.assertEqual(S.watch([], now, prev)['reasons'], [])

    def test_nothing_for_8_days_is_late(self):
        now = NOW
        prev = {'run': {'result': 'published', 'endedAt': now - 9 * 86400000}, 'history': []}
        self.assertEqual(S.watch([], now, prev)['reasons'], ['late'])

    def test_clear_restores_the_verdict(self):
        prev = {'v': 1, 'at': NOW, 'verdict': 'late', 'reasons': ['late'], 'alert': {'text': 'x', 'since': NOW},
                'run': {'result': 'published'}, 'history': []}
        s = S.clear(prev, None, NOW + 1)
        self.assertEqual((s['verdict'], s['reasons'], s['alert']), ('healthy', [], None))

    def test_clear_keeps_a_held_reason(self):
        prev = {'v': 1, 'at': NOW, 'verdict': 'held', 'reasons': ['band_gone', 'late'], 'alert': {'text': 'x', 'since': NOW},
                'run': {'result': 'held'}, 'history': []}
        s = S.clear(prev, None, NOW + 1)
        self.assertEqual((s['verdict'], s['reasons']), ('held', ['band_gone']))
        self.assertIsNotNone(s['alert'])


class Tripped(unittest.TestCase):
    """diff.tripped: the bands the gates failed (the app names only these), from the gate rows."""
    def block(self, **kw):
        d = diff(**kw.pop('totals', {}))
        return S.diff_block(d, gates(diff=d, **kw))

    def test_only_the_failed_rows(self):
        b = self.block(totals={'gone': 151})   # gone over, values within
        self.assertEqual(b['tripped'], [{'code': 'band_gone', 'key': 'gone', 'share': 0.0151, 'limit': 0.015}])
        self.assertEqual(self.block()['tripped'], [])   # merged: none
        self.assertNotIn('tripped', S.diff_block(diff(), None))   # no gates: not written

    def test_renamed_is_band_values_and_counts_are_shareless(self):
        b = self.block(totals={'renamed': 101}, new=kal(10050, shops=()), tests_ok=False)
        self.assertEqual(b['tripped'], [{'code': 'band_values', 'key': 'renamed', 'share': 0.0101, 'limit': 0.01},
                                        {'code': 'band_shops', 'key': 'shops', 'share': None, 'limit': None}])
        b = self.block(new=kal(9700))   # items: |delta| / base
        self.assertEqual(b['tripped'], [{'code': 'band_items', 'key': 'items', 'share': 0.03, 'limit': 0.02}])

    def test_no_base_no_shares(self):
        b = self.block(totals={'products_old': 0})
        self.assertEqual(b['shares'], {})
        self.assertTrue(b['tripped'])
        self.assertTrue(all(t['share'] is None for t in b['tripped']))
        self.assertEqual(b['limits']['gone'], 0.015)

    def test_final_writes_it(self):
        d = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, d)
        files = {}
        for name, doc in {'diff': diff(gone=151), 'gates': gates(diff=diff(gone=151))}.items():
            files[name] = os.path.join(d, name + '.json')
            with open(files[name], 'w') as fh:
                json.dump(doc, fh, default=sorted)
        s = S.final({}, Args(result='held', reasons='band_gone', **files), NOW)
        self.assertEqual((s['verdict'], [t['code'] for t in s['diff']['tripped']]), ('held', ['band_gone']))
        self.assertEqual(S.carry(s, NOW)['diff']['tripped'], s['diff']['tripped'])


class VerdictKeepsTheRun(unittest.TestCase):
    """deploy() and late() recompute the verdict with the run's own result: emptied reasons go back to its verdict."""
    def test_deploy_reverted_then_ok(self):
        prev = {'verdict': 'healthy', 'reasons': [], 'run': {'result': 'published'},
                'merge': {'sha': 'abc', 'deploy': 'pending', 'pr': None}, 'dataset': {'tag': 't'},
                'history': [{'result': 'merged', 'tag': 't'}]}
        r = S.deploy(prev, Args(sha='abc', deploy='reverted', reason='reverted'), NOW)
        self.assertEqual((r['verdict'], r['run']['result'], r['history'][-1]['result']), ('failing', 'published', 'failed'))
        f = S.deploy(prev, Args(sha='abc', deploy='failed', reason='deploy_failed'), NOW)
        ok = S.deploy(f, Args(sha='abc', deploy='ok'), NOW)
        self.assertEqual((ok['verdict'], ok['reasons'], ok['run']['result']), ('healthy', [], 'published'))

    def test_late_then_clear(self):
        prev = {'verdict': 'healthy', 'reasons': [], 'run': {'result': 'published'}, 'history': []}
        s = S.late(prev, Args(reasons='late'), NOW)
        self.assertEqual((s['verdict'], s['run']['result']), ('late', 'published'))
        self.assertEqual(S.clear(s, None, NOW)['verdict'], 'healthy')
        held = {'verdict': 'held', 'reasons': ['tests'], 'run': {'result': 'held'}, 'history': []}
        s = S.late(held, Args(reasons='late'), NOW)
        self.assertEqual((s['verdict'], s['reasons']), ('held', ['tests', 'late']))
        self.assertEqual(S.clear(s, None, NOW)['verdict'], 'held')
