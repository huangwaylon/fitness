#!/usr/bin/env python3
"""Kalori's refresh status (docs/food-data.md "Kalori": the automatic merge, the status): the gates an update must
pass to merge itself, and status.json, which the app's bots tab (メニュー) reads from the `kalori-status` branch. stdlib
only, no network: the workflows fetch and push (.github/scripts/kalori-status.sh runs every write subcommand on the
current status.json, `--prev`, and pushes `--out`).

Usage (from the repo root): python3 -I food-data/scripts/kalori_status.py <command> ...
  gates --diff diff.json --coverage coverage.json --new kalori.json --old kalori.json [--convert convert.json]
        [--prev status.json] --tests-ok 0|1 [--flags allow_big_diff,...] --out gates.json
        the bands (below; the env's KALORI_BAND_* etc. override each) -> gates.json {ok, reasons, rows, ...}; the
        table (markdown) on stdout
  running --prev P --out S --run-id N --run-url U --event E --round N --started-at ISO|ms --shards-done N
  final   --prev P --out S (the run's flags) --result published|held|failed|running|cancelled [--reasons a,b]
          [--diff F] [--coverage F] [--gates F] [--fetch-py F --kalori F] [--merge-sha S] [--merge-pr U]
          [--deploy D] [--alert-text T] [--pr-url U]
  deploy  --prev P --out S --sha S --deploy ok|failed|reverted [--reason R --alert-text T --run-url U]
          [--fetch-py F --kalori F]   a dispatched deploy's outcome (.github/scripts/kalori-deploy.sh)
  decide  --runs runs.json (--sha S --since T | --prev P) [--limit-min N] [--reran ID] [--also S,S]   the deploy's
          next step from the dispatched runs (the REST API's workflow_runs) -> {action: none|wait|ok|revert|rerun|failed}
  watch   --runs runs.json [--prev P]   late / stuck from kalori-scrape's runs (gh run list's JSON) -> {reasons, text};
          with --prev also a `running` status 8 h old with no run (stuck)
  late|alert --prev P --out S --reasons a,b --alert-text T --run-url U   an alert (kalori-watch.yml, a job failing)
  undo    --prev P --out S --tag T [--fetch-py F --kalori F]   a merge reverted by hand: not accepted
Every write takes --now ms (the tests) and --repo owner/name (the release URL).
"""
import argparse, json, os, re, statistics, sys, time
from datetime import datetime, timedelta, timezone

SHARDS = 20
HISTORY = 12   # status.json's history: the newest runs, newest last
# The bands, shares of the accepted release's current products (diff.json's products_old). kalori-scrape.yml's
# update-merge job sets each in its env (the reasons there); these defaults mirror it, for the status and the tests.
BANDS = {'added': 0.025, 'gone': 0.015, 'values': 0.01, 'est': 0.005, 'ended': 0.01, 'renamed': 0.01, 'items': 0.02}
SHOPS_LOST, SHOPS_NEW = 2, 10
DROPS_SLACK = 0.005          # a converter drop reason may grow by this share of the items over the accepted release's
ADAPT_MIN, ADAPT_LAST, ADAPT_X = 4, 8, 3   # with 4+ merged runs: a band is max(fixed, 3 x the median of the last 8)
ADAPT_CAP = 2                # ... and at most 2 x the fixed band (a drifting history never opens the gate wide)
LATE_DAYS, STUCK_DAYS = 8, 2
RUNNING_H = 8                # the watch: a `running` status 8 h old, no run
# The deploy's check (kalori-deploy.sh): the runs of pages.yml and food-data.yml that kalori-scrape.yml's status job
# dispatched (main's tip then: merge.sha or a later commit holding it, `also`); it waits 70 min for them, 70 more after
# a re-run (kalori-scrape.yml's deploy-check, 150 min at most), the watch's backstop takes a merge still pending after
# 160 min (its age: run.endedAt, the status job's write just before the dispatch). Both are idempotent: the same runs
# give the same outcome, a revert already on main is not redone, status.json's write is the same.
DEPLOY_WF = {'pages': ('.github/workflows/pages.yml', 'Deploy UI'), 'food': ('.github/workflows/food-data.yml', 'Food data checks')}
CHECK_MIN, BACKSTOP_MIN = 70, 160
SKEW_MS = 120000             # a run created up to 2 min before `since` still counts (the runner's clock vs GitHub's)
WATCHED = ('deploy_failed', 'reverted')   # the watch's reasons: a later write about the same merge keeps them
# band -> (diff.json's totals key, history's key: the adaptive bands; None: fixed only)
KEYS = {'added': ('added', 'added'), 'gone': ('gone', 'gone'), 'values': ('values_changed', 'valuesChanged'),
        'est': ('est_changed', None), 'ended': ('ended_changed', 'endedChanged'), 'renamed': ('renamed', None)}
REASON = {'renamed': 'band_values'}   # (the shared reason codes have no band_renamed: a rename is a changed value)
HELD = {'diff_gate', 'main_moved', 'tests'}   # with band_*: a person's look, nothing broken (a failed update-build
# test holds the merge, as its run and history say: held)
LATE = {'late', 'stuck'}
TEXT = {'drift': 'kalori.jp changed its pages (layout drift)', 'nonut': 'the no-nutrition cap', 'crash': 'a crash',
        'limits': "shards still at the site's limits or lost", 'incomplete': 'coverage incomplete, no round left',
        'publish': 'publishing failed', 'update': 'the update failed', 'diff_gate': 'the diff gate (exit 6)',
        'band_added': 'too many added', 'band_gone': 'too many gone', 'band_values': 'too many values changed or renamed',
        'band_est': 'too many estimate flags changed', 'band_ended': 'too many ended changed',
'band_items': 'the item count moved too much',
        'band_shops': 'shops lost or new past the band', 'band_drops': 'converter drops grew',
        'tests': 'the tests failed', 'main_moved': 'main changed the food files meanwhile',
        'deploy_failed': 'the deploy failed', 'reverted': 'Food data checks failed: reverted',
        'late': 'no scheduled refresh in 8 days', 'stuck': 'a refresh running for 2+ days'}


def env_num(name, default):
    v = os.environ.get(name, '')
    return float(v) if v.strip() else default


def bands_from_env():
    b = {k: env_num('KALORI_BAND_' + k.upper(), v) for k, v in BANDS.items()}
    return b, {'lost': int(env_num('KALORI_SHOPS_LOST', SHOPS_LOST)), 'new': int(env_num('KALORI_SHOPS_NEW', SHOPS_NEW)),
               'drops': env_num('KALORI_DROPS_SLACK', DROPS_SLACK)}


def summary(doc):
    """{items, shops: set, ended} of a kalori.json."""
    items = doc.get('items') or []
    return {'items': len(items), 'shops': set(doc.get('shops') or {}),
            'ended': sum(1 for it in items if isinstance(it, dict) and it.get('ended'))}


def merged(history):
    return [h for h in history or [] if isinstance(h, dict) and h.get('result') == 'merged']


def adapted(fixed, hkey, history, base):
    """max(fixed, 3 x the median count of the last 8 merged runs, as a share of base), with 4+ merged runs."""
    runs = merged(history)
    if hkey is None or len(runs) < ADAPT_MIN or not base:
        return fixed, False
    vals = [h.get(hkey) for h in runs[-ADAPT_LAST:] if isinstance(h.get(hkey), (int, float))]
    if len(vals) < ADAPT_MIN:
        return fixed, False
    a = min(ADAPT_X * statistics.median(vals) / base, ADAPT_CAP * fixed)
    return (a, True) if a > fixed else (fixed, False)


def gates(diff, coverage, new, old, convert=None, prev=None, tests_ok=False, flags=(), bands=None, extra=None):
    """The gates of an automatic merge, from trusted inputs only (the report job's diff.json and coverage.json; the
    new and old kalori.json; the converter's report as update-merge re-ran it). -> {ok, reasons, rows, notes, ...}."""
    bands = dict(BANDS, **(bands or {}))
    extra = dict({'lost': SHOPS_LOST, 'new': SHOPS_NEW, 'drops': DROPS_SLACK}, **(extra or {}))
    prev = prev or {}
    t = (diff or {}).get('totals') or {}
    base = t.get('products_old') or 0
    rows, reasons, notes = [], [], []

    def row(key, label, value, limit, ok, reason, shown=None, note=''):
        rows.append({'key': key, 'label': label, 'value': value, 'limit': limit, 'ok': bool(ok),
                     'shown': shown if shown is not None else str(value), 'note': note})
        if not ok and reason not in reasons:
            reasons.append(reason)

    for key, (tkey, hkey) in KEYS.items():
        n = t.get(tkey)
        limit, adapt = adapted(bands[key], hkey, prev.get('history'), base)
        share = n / base if isinstance(n, int) and base else None
        row(key, tkey.replace('_', ' '), n, limit, share is not None and share <= limit, REASON.get(key, 'band_' + key),
            '%s (%.2f%%)' % (n, share * 100) if share is not None else 'unknown',
            'adaptive: 3x the median of the last %d merged, at most %dx' % (ADAPT_LAST, ADAPT_CAP) if adapt else '')
    d_items = new['items'] - old['items']
    share = abs(d_items) / base if base else None
    row('items', 'items in kalori.json', d_items, bands['items'], share is not None and share <= bands['items'],
        'band_items', '%d → %d (%+d, %.2f%%)' % (old['items'], new['items'], d_items, (share or 0) * 100))
    lost, gained = sorted(old['shops'] - new['shops']), sorted(new['shops'] - old['shops'])
    row('shops', 'shops lost · new', [len(lost), len(gained)], [extra['lost'], extra['new']],
        len(lost) <= extra['lost'] and len(gained) <= extra['new'], 'band_shops',
        '%d · %d' % (len(lost), len(gained)), ', '.join(['-' + s for s in lost[:5]] + ['+' + s for s in gained[:5]]))
    drops = (convert or {}).get('dropped')
    pdrops = (prev.get('dataset') or {}).get('dropped')
    if not isinstance(drops, dict):
        notes.append('converter drops: no report, the check skipped')
    elif not isinstance(pdrops, dict):
        notes.append("converter drops: the accepted release's are not in status.json yet, the check skipped")
    else:
        slack = extra['drops'] * new['items']
        over = {k: v for k, v in drops.items() if isinstance(v, (int, float)) and v > (pdrops.get(k) or 0) + slack}
        row('drops', 'converter drops', drops, 'previous + %d' % round(slack), not over, 'band_drops',
            ', '.join('%s %s' % kv for kv in drops.items()) or 'none',
            'over: ' + ', '.join('%s %d (was %d)' % (k, v, pdrops.get(k) or 0) for k, v in over.items()) if over else '')
    row('tests', 'tests (update-build)', bool(tests_ok), True, tests_ok, 'tests', 'pass' if tests_ok else 'FAIL')
    complete = bool(((coverage or {}).get('summary') or {}).get('complete'))
    row('coverage', 'coverage complete', complete, True, complete, 'incomplete', str(complete).lower())
    flags = [f for f in flags if f]
    row('flags', 'a default run', not flags, True, not flags, 'diff_gate', ', '.join(flags) or 'yes')
    return {'ok': not reasons, 'reasons': reasons, 'rows': rows, 'notes': notes, 'base': base,
            'items': new['items'], 'itemsOld': old['items'], 'itemsDelta': d_items, 'shops': len(new['shops']),
            'ended': new['ended'], 'shopsLost': lost, 'shopsNew': gained, 'dropped': drops if isinstance(drops, dict) else None,
            'limits': {r['key']: r['limit'] for r in rows if r['key'] in KEYS or r['key'] == 'items'}}


def gates_markdown(g):
    def lim(r):
        if r['key'] in KEYS or r['key'] == 'items':
            return '≤ %.2f%%' % (r['limit'] * 100)
        if r['key'] == 'shops':
            return '≤ %d · ≤ %d' % tuple(r['limit'])
        return str(r['limit']) if not isinstance(r['limit'], bool) else 'required'
    md = ['| gate | value | band | |', '|---|---|---|---|']
    for r in g['rows']:
        md.append('| %s | %s | %s | %s%s |' % (r['label'], r['shown'], lim(r), 'ok' if r['ok'] else '**HELD**',
                                              ' (%s)' % r['note'] if r['note'] else ''))
    md += ['', 'Within every band: merged automatically.' if g['ok'] else
           'Held: %s (docs/ops/runbook.md "Refresh Kalori").' % ', '.join(g['reasons'])]
    md += ['- ' + n for n in g['notes']]
    return '\n'.join(md) + '\n'


# ---------- status.json ----------
def ms(v):
    """ms epoch from ms, s or an ISO date; None from nothing."""
    if v in (None, ''):
        return None
    if isinstance(v, (int, float)) or re.fullmatch(r'\d+', str(v)):
        v = int(v)
        return v if v > 10 ** 11 else v * 1000
    return int(datetime.fromisoformat(str(v).replace('Z', '+00:00')).timestamp() * 1000)


def next_run(now):
    """The next scheduled run: Wednesday 02:41 JST, Tuesday 17:41 UTC (kalori-scrape.yml's cron)."""
    dt = datetime.fromtimestamp(now / 1000, timezone.utc)
    c = (dt + timedelta(days=(1 - dt.weekday()) % 7)).replace(hour=17, minute=41, second=0, microsecond=0)
    if c <= dt:
        c += timedelta(days=7)
    return int(c.timestamp() * 1000)


def verdict_of(result, reasons):
    rs = set(reasons)
    if rs & LATE and not rs - LATE:
        return 'late'
    if any(r not in HELD and not r.startswith('band_') for r in rs - LATE):
        return 'failing'
    if rs:
        return 'held'
    return {'running': 'running', 'published': 'healthy'}.get(result, 'none')


def carry(prev, now):
    prev = prev if isinstance(prev, dict) else {}
    hist = [h for h in prev.get('history') or [] if isinstance(h, dict)][-HISTORY:]
    return {'v': 1, 'at': now, 'verdict': prev.get('verdict') or 'none', 'reasons': list(prev.get('reasons') or []),
            'run': prev.get('run'), 'next': next_run(now), 'dataset': prev.get('dataset'), 'diff': prev.get('diff'),
            'coverage': prev.get('coverage'), 'merge': prev.get('merge'), 'alert': prev.get('alert'), 'history': hist}


def alert_of(prev_alert, text, run_url, pr_url, now):
    """{text, since, runUrl, prUrl}; since: when the alert began (kept while one stays up, whatever its text)."""
    if not text:
        return None
    since = prev_alert.get('since') if isinstance(prev_alert, dict) and prev_alert.get('since') else now
    return {'text': text, 'since': since, 'runUrl': run_url or None, 'prUrl': pr_url or None, 'issueUrl': None}


def alert_text(reasons):
    return '; '.join(TEXT.get(r, r) for r in reasons)


def run_of(a, result, now, started=None):
    return {'id': int(a.run_id), 'url': a.run_url, 'event': a.event, 'round': int(a.round or 1), 'result': result,
            'startedAt': ms(a.started_at) or started or now, 'endedAt': None if result == 'running' else now,
            'shardsDone': int(a.shards_done or 0), 'shardsTotal': SHARDS}


def diff_block(diff, g, limits=None):
    t = (diff or {}).get('totals')
    if not t:
        return None
    base = t.get('products_old') or 0
    sh = lambda k: round(t.get(k, 0) / base, 5)
    lim = (g or {}).get('limits') or limits or {}
    lk = lambda k: lim.get(k, BANDS[k])
    out = {'added': t.get('added', 0), 'gone': t.get('gone', 0), 'renamed': t.get('renamed', 0),
            'valuesChanged': t.get('values_changed', 0), 'estChanged': t.get('est_changed', 0),
            'endedChanged': t.get('ended_changed', 0),
            'itemsDelta': g['itemsDelta'] if g else t.get('products_new', 0) - base,
            # no base (products_old 0 or missing): no shares at all, never a fake 0.0
            'shares': {'added': sh('added'), 'gone': sh('gone'), 'valuesChanged': sh('values_changed'),
                       'estChanged': sh('est_changed')} if base else {},
            'limits': {'added': lk('added'), 'gone': lk('gone'), 'valuesChanged': lk('values'),
                       'estChanged': lk('est')}}
    if g:
        out['tripped'] = tripped(g, base)
    return out


def tripped(g, base):
    """The band rows the gates failed, in row order: {code, key, share, limit} (share and limit null for shops and
    drops; share null without a base). The app names only these (not every band within its limit)."""
    out = []
    for r in g.get('rows') or []:
        key = r.get('key')
        if r.get('ok') or not (key in KEYS or key in ('items', 'shops', 'drops')):
            continue
        share = limit = None
        if key in KEYS or key == 'items':
            v = r.get('value')
            share = round(abs(v) / base, 5) if isinstance(v, (int, float)) and not isinstance(v, bool) and base else None
            limit = r.get('limit')
        out.append({'code': REASON.get(key, 'band_' + key), 'key': key, 'share': share, 'limit': limit})
    return out


def coverage_block(cov):
    s = (cov or {}).get('summary')
    if not s:
        return None
    p, sh = s.get('products') or {}, s.get('shops') or {}
    return {'complete': bool(s.get('complete')), 'fetched': p.get('fetched', 0), 'discovered': p.get('discovered', 0),
            'shopsTracked': sh.get('tracked', 0), 'noNutrition': p.get('no_nutrition', 0), 'failed': p.get('failed', 0)}


def dataset_of(fetch_py, kalori, repo, prev_ds=None, dropped=None):
    """The accepted dataset: main's KALORI_TAG and kalori.json (dropped: the converter's, this run's when it merged,
    else kept from the status while the tag is the same)."""
    with open(fetch_py, encoding='utf-8') as fh:
        m = re.search(r"^KALORI_TAG = '(kalori-[0-9a-z-]+)'$", fh.read(), re.M)
    if not m:
        raise SystemExit('kalori_status: no KALORI_TAG in %s' % fetch_py)
    tag = m.group(1)
    with open(kalori, encoding='utf-8') as fh:
        s = summary(json.load(fh))
    d = re.match(r'kalori-(\d{4}-\d{2}-\d{2})', tag)
    ds = {'tag': tag, 'date': d.group(1) if d else None, 'url': 'https://github.com/%s/releases/tag/%s' % (repo, tag),
          'items': s['items'], 'shops': len(s['shops']), 'ended': s['ended']}
    if isinstance(dropped, dict):
        ds['dropped'] = dropped
    elif isinstance(prev_ds, dict) and prev_ds.get('tag') == tag and isinstance(prev_ds.get('dropped'), dict):
        ds['dropped'] = prev_ds['dropped']
    return ds


def load(path, default=None):
    if not path:
        return default
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except (OSError, ValueError) as e:
        print('kalori_status: %s unreadable (%s)' % (path, e), file=sys.stderr)
        return default


def running(prev, a, now):
    s = carry(prev, now)
    s.update(verdict='running', reasons=[], run=run_of(a, 'running', now))
    return s


def final(prev, a, now):
    s = carry(prev, now)
    reasons = [r for r in (a.reasons or '').split(',') if r]
    diff, cov, g = load(a.diff), load(a.coverage), load(a.gates)
    started = ((prev or {}).get('run') or {}).get('startedAt') if ((prev or {}).get('run') or {}).get('id') == int(a.run_id) else None
    s['run'] = run_of(a, a.result, now, started)
    s['reasons'] = reasons
    s['verdict'] = verdict_of(a.result, reasons)
    if a.result == 'cancelled':
        s['verdict'] = 'none'
    s['diff'] = diff_block(diff, g) or s['diff']
    s['coverage'] = coverage_block(cov) or s['coverage']
    if a.fetch_py and a.kalori:
        s['dataset'] = dataset_of(a.fetch_py, a.kalori, a.repo, s['dataset'], g and a.merge_sha and g.get('dropped'))
    pm = (prev or {}).get('merge') if isinstance((prev or {}).get('merge'), dict) else {}
    same = bool(a.merge_sha) and pm.get('sha') == a.merge_sha
    if a.merge_sha or a.merge_pr or a.deploy:
        s['merge'] = {'sha': a.merge_sha or None, 'deploy': a.deploy or None, 'pr': a.merge_pr or None}
    if same:   # the watch already wrote about this merge (a re-run status job): its outcome and alert stay
        if pm.get('deploy') in ('ok', 'failed', 'reverted'):
            s['merge']['deploy'] = pm['deploy']
        kept = [r for r in (prev.get('reasons') or []) if r in WATCHED and r not in reasons]
        if kept:
            reasons = reasons + kept
            s['reasons'], s['verdict'] = reasons, verdict_of(a.result, reasons)
            if not a.alert_text and isinstance(prev.get('alert'), dict):
                a.alert_text = prev['alert'].get('text') or ''
    if reasons:
        s['alert'] = alert_of(s['alert'], a.alert_text or alert_text(reasons), a.run_url, a.merge_pr or a.pr_url, now)
    elif s['verdict'] == 'healthy':
        s['alert'] = None
    hres = {'published': 'merged' if a.merge_sha else 'none', 'held': 'held', 'failed': 'failed'}.get(a.result)
    if hres:
        t = (diff or {}).get('totals') or {}
        s['history'] = (s['history'] + [{
            't': now, 'result': hres, 'tag': a.tag or None, 'added': t.get('added', 0), 'gone': t.get('gone', 0),
            'valuesChanged': t.get('values_changed', 0), 'endedChanged': t.get('ended_changed', 0),
            'ms': max(0, now - s['run']['startedAt']), 'runUrl': a.run_url}])[-HISTORY:]
    return s


def deploy(prev, a, now):
    s = carry(prev, now)
    m = s['merge'] if isinstance(s['merge'], dict) else {}
    if m.get('sha') != a.sha:
        print('kalori_status: status.json is about %s, not %s: the merge left as it is' % (m.get('sha'), a.sha), file=sys.stderr)
    elif a.deploy == 'ok' and m.get('deploy') == 'reverted':
        print('kalori_status: already reverted: the deploy stays "reverted"', file=sys.stderr)
    else:
        s['merge'] = {'sha': a.sha, 'deploy': a.deploy, 'pr': m.get('pr')}
    if a.deploy == 'ok' and 'deploy_failed' in s['reasons'] and m.get('sha') == a.sha and s['merge']['deploy'] == 'ok':
        s['reasons'] = [r for r in s['reasons'] if r != 'deploy_failed']   # a later green deploy of the same merge
        s['verdict'] = verdict_of((s['run'] or {}).get('result') or 'published', s['reasons'])
        if not s['reasons']:
            s['alert'] = None
    if a.reason:
        s['reasons'] = [r for r in s['reasons'] if r not in ('deploy_failed', 'reverted')] + [a.reason]
        s['verdict'] = verdict_of((s['run'] or {}).get('result'), s['reasons'])
        s['alert'] = alert_of(s['alert'], a.alert_text or alert_text([a.reason]), a.run_url, m.get('pr'), now)
    if a.deploy == 'reverted':
        tag = (s['dataset'] or {}).get('tag')
        for h in reversed(s['history']):   # a reverted merge never counts as accepted (the adaptive bands)
            if h.get('result') == 'merged' and h.get('tag') == tag:
                h['result'] = 'failed'
                break
    if a.fetch_py and a.kalori:
        s['dataset'] = dataset_of(a.fetch_py, a.kalori, a.repo, s['dataset'])
    return s


def watch(runs, now, prev=None, late_days=LATE_DAYS, stuck_days=STUCK_DAYS):
    """late: the newest finished refresh over 8 days old (or none): a completed scheduled run, or the status's own last
    run and history (a dispatched refresh counts too; a smoke run never writes the status); stuck: a run not completed
    after 2 days, or a `running` status 8 h old with no run unfinished (a pending deploy: decide, the backstop)."""
    reasons, why = [], []
    prev = prev or {}
    sched = [r for r in runs if r.get('event') == 'schedule' and r.get('status') == 'completed']
    seen = [ms(r.get('createdAt')) for r in sched]
    run = prev.get('run') or {}
    if run.get('result') in ('published', 'held', 'failed'):
        seen.append(ms(run.get('endedAt')) or ms(run.get('startedAt')))
    seen += [ms(h.get('t')) for h in prev.get('history') or [] if isinstance(h, dict)]
    last = max((x for x in seen if x), default=None)
    if last is None or now - last > late_days * 86400000:
        reasons.append('late')
        why.append('the last scheduled refresh: %s' % (
            datetime.fromtimestamp(last / 1000, timezone.utc).strftime('%Y-%m-%d') if last else 'none'))
    open_runs = [r for r in runs if r.get('status') != 'completed']
    old = [r for r in open_runs if now - (ms(r.get('createdAt')) or now) > stuck_days * 86400000]
    if old:
        reasons.append('stuck')
        why.append('running since %s: %s' % (min(r.get('createdAt') for r in old), old[0].get('url')))
    elif prev.get('verdict') == 'running' and not open_runs and now - (prev.get('at') or now) > RUNNING_H * 3600000:
        reasons.append('stuck')
        why.append('the status says running, but no run is (its status job never wrote)')
    return {'reasons': reasons, 'text': '; '.join(alert_text([r]) + ' (%s)' % w for r, w in zip(reasons, why))}


def matching(runs, path, heads, since):
    """The workflow_dispatch runs of the workflow at `path` on one of `heads` created since `since` (ms)."""
    return [r for r in runs if isinstance(r, dict) and r.get('path') == path and r.get('head_sha') in heads
            and r.get('event') == 'workflow_dispatch' and (ms(r.get('created_at')) or 0) >= since - SKEW_MS]


def dispatched(runs, path, heads, since):
    """The newest of them, else None."""
    return max(matching(runs, path, heads, since), key=lambda r: ms(r['created_at']), default=None)


def decide(runs, sha, since, now, limit_min=CHECK_MIN, reran=None, also=()):
    """The deploy's next step, in order: Food data checks failed -> revert, first cancelling Deploy UI's unfinished
    runs of it (`cancel`; another end: failed); Deploy UI not green -> rerun its failed jobs once (`reran`: that run's
    id, the re-run asked and not begun yet: wait), then failed; both green -> ok; a run not seen `limit_min` after
    `since` -> failed; else wait. A run counts on sha or on `also` (later commits holding it: `gh workflow run --ref
    main` dispatches main's tip)."""
    heads = {sha, *[h for h in also if h]}
    got = {k: dispatched(runs, path, heads, since) for k, (path, _) in DEPLOY_WF.items()}
    p, f = got['pages'], got['food']
    done = lambda r: bool(r) and r.get('status') == 'completed'
    out = lambda action, why='', run=None: {'action': action, 'why': why, 'url': (run or {}).get('html_url'),
                                            'id': (run or {}).get('id'), 'sha': sha}
    if done(f) and f.get('conclusion') != 'success':
        if f.get('conclusion') in ('failure', 'timed_out'):
            return dict(out('revert', 'Food data checks failed on the Kalori merge', f), cancel=sorted(
                r['id'] for r in matching(runs, DEPLOY_WF['pages'][0], heads, since) if r.get('status') != 'completed'))
        return out('failed', 'Food data checks ended %s on the Kalori merge' % f.get('conclusion'), f)
    if done(p) and p.get('conclusion') != 'success':
        if (p.get('run_attempt') or 1) <= 1:
            return out('wait', 'the re-run of Deploy UI starting', p) if reran and str(reran) == str(p.get('id')) else \
                out('rerun', 'Deploy UI ended %s: its failed jobs re-run once' % p.get('conclusion'), p)
        return out('failed', 'the deploy of the Kalori merge failed twice', p)
    if done(p) and done(f):
        return out('ok', 'Deploy UI and Food data checks green', p)
    missing = [DEPLOY_WF[k][1] for k, r in got.items() if not r]
    if missing and now - since > limit_min * 60000:
        return out('failed', 'dispatch not seen: no %s run on %s after %d min' % (' or '.join(missing), sha[:9], limit_min))
    return out('wait', 'waiting for %s' % ', '.join(DEPLOY_WF[k][1] for k, r in got.items() if not done(r)))


def decide_pending(prev, runs, now, limit_min=BACKSTOP_MIN, also=()):
    """The watch's backstop: status.json's merge still pending `limit_min` after its write -> decide on it."""
    m, run = (prev or {}).get('merge') or {}, (prev or {}).get('run') or {}
    since = run.get('endedAt')
    if not (m.get('sha') and m.get('deploy') == 'pending' and since):
        return {'action': 'none', 'why': 'no merge pending', 'url': None, 'id': None, 'sha': m.get('sha')}
    if now - since <= limit_min * 60000:
        return {'action': 'none', 'why': 'pending under %d min: the deploy-check job has it' % limit_min, 'url': None,
                'id': None, 'sha': m['sha']}
    return decide(runs, m['sha'], since, now, limit_min, also=also)


def late(prev, a, now):
    """An alert with these reasons (`late` and `alert` alike): kept with a held or failing status's own."""
    s = carry(prev, now)
    reasons = [r for r in (a.reasons or '').split(',') if r]
    keep = [r for r in s['reasons'] if r not in reasons] if s['verdict'] not in ('healthy', 'running', 'none') else []
    s['reasons'] = keep + reasons
    s['verdict'] = verdict_of((s['run'] or {}).get('result'), s['reasons'])
    s['alert'] = alert_of(s['alert'], a.alert_text or alert_text(reasons), a.run_url, None, now)
    return s


def clear(prev, a, now):
    """The watch found nothing late or stuck: an earlier late/stuck reason (and its alert) goes, the verdict back to
    the last run's (a held or failing status keeps its own reasons)."""
    s = carry(prev, now)
    keep = [r for r in s['reasons'] if r not in LATE]
    if keep == s['reasons']:
        return s
    s['reasons'] = keep
    s['verdict'] = verdict_of((s.get('run') or {}).get('result'), keep)
    if not keep:
        s['alert'] = None
    return s


def undo(prev, a, now):
    """A merge undone by hand (docs/ops/runbook.md "Refresh Kalori"): its history entry no longer counts as accepted
    (the adaptive bands), the merge marked reverted, the dataset main's again."""
    s = carry(prev, now)
    for h in s['history']:
        if h.get('result') == 'merged' and h.get('tag') == a.tag:
            h['result'] = 'failed'
    if isinstance(s['merge'], dict) and s['merge'].get('sha') and (s['dataset'] or {}).get('tag') == a.tag:
        s['merge'] = dict(s['merge'], deploy='reverted')
    if a.fetch_py and a.kalori:
        s['dataset'] = dataset_of(a.fetch_py, a.kalori, a.repo, s['dataset'])
    return s


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    g = sub.add_parser('gates')
    g.add_argument('--diff', required=True)
    g.add_argument('--coverage', required=True)
    g.add_argument('--new', required=True)
    g.add_argument('--old', required=True)
    g.add_argument('--convert')
    g.add_argument('--prev')
    g.add_argument('--tests-ok', default='0')
    g.add_argument('--flags', default='')
    g.add_argument('--out', required=True)
    w = sub.add_parser('watch')
    w.add_argument('--runs', required=True)
    w.add_argument('--now', type=int)
    w.add_argument('--prev')
    d = sub.add_parser('decide')
    d.add_argument('--runs', required=True)
    d.add_argument('--sha')
    d.add_argument('--since')
    d.add_argument('--prev')
    d.add_argument('--limit-min', type=int)
    d.add_argument('--reran', default='')
    d.add_argument('--also', default='', help='later commits holding the sha, comma-separated')
    d.add_argument('--now', type=int)
    for name in ('running', 'final', 'deploy', 'late', 'alert', 'clear', 'undo'):
        p = sub.add_parser(name)
        p.add_argument('--prev')
        p.add_argument('--out', required=True)
        p.add_argument('--now', type=int)
        p.add_argument('--repo', default=os.environ.get('GH_REPO', 'huangwaylon/fitness'))
        p.add_argument('--run-url', default='')
        p.add_argument('--alert-text', default='')
        p.add_argument('--fetch-py')
        p.add_argument('--kalori')
        if name in ('running', 'final'):
            p.add_argument('--run-id', required=True)
            p.add_argument('--event', default='schedule')
            p.add_argument('--round', default='1')
            p.add_argument('--started-at', default='')
            p.add_argument('--shards-done', default='0')
        if name == 'final':
            p.add_argument('--result', required=True,
                           choices=('published', 'held', 'failed', 'running', 'cancelled'))
            p.add_argument('--reasons', default='')
            p.add_argument('--tag', default='')
            for f in ('--diff', '--coverage', '--gates', '--merge-sha', '--merge-pr', '--deploy', '--pr-url'):
                p.add_argument(f, default='')
        if name == 'deploy':
            p.add_argument('--sha', required=True)
            p.add_argument('--deploy', required=True, choices=('ok', 'failed', 'reverted'))
            p.add_argument('--reason', default='', choices=('', 'deploy_failed', 'reverted'))
        if name in ('late', 'alert'):
            p.add_argument('--reasons', required=True)
        if name == 'undo':
            p.add_argument('--tag', required=True)
    a = ap.parse_args(argv)
    now = getattr(a, 'now', None) or int(time.time() * 1000)

    if a.cmd == 'gates':
        bands, extra = bands_from_env()
        new, old = summary(load(a.new, {})), summary(load(a.old, {}))
        res = gates(load(a.diff, {}), load(a.coverage, {}), new, old, load(a.convert), load(a.prev, {}),
                    a.tests_ok == '1', a.flags.split(','), bands, extra)
        with open(a.out, 'w', encoding='utf-8') as fh:
            json.dump(res, fh, ensure_ascii=False, indent=1)
        print(gates_markdown(res), end='')
        return 0
    if a.cmd == 'watch':
        print(json.dumps(watch(load(a.runs, []), now, load(a.prev, {}) or {}), ensure_ascii=False))
        return 0
    if a.cmd == 'decide':
        runs = load(a.runs, [])
        if a.prev:
            res = decide_pending(load(a.prev, {}) or {}, runs, now, a.limit_min or BACKSTOP_MIN, a.also.split(','))
        elif a.sha and a.since:
            res = decide(runs, a.sha, ms(a.since), now, a.limit_min or CHECK_MIN, a.reran or None, a.also.split(','))
        else:
            ap.error('decide: --prev, or --sha and --since')
        print(json.dumps(res, ensure_ascii=False))
        return 0
    prev = load(a.prev, {}) or {}
    s = {'running': running, 'final': final, 'deploy': deploy, 'late': late, 'alert': late, 'clear': clear,
         'undo': undo}[a.cmd](prev, a, now)
    with open(a.out, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(s, ensure_ascii=False, indent=1) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
