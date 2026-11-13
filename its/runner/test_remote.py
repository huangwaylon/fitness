#!/usr/bin/env python3
"""The remote runner's tests: remote.py, logs.py and main.py's control loop, hermetic.

test_its.py covers the booking flow; this file covers what --remote adds, against the same FakeITS (imported from
test_its) and a fake its-bot Worker (`WorkerModel`: the lease, the record, acks, stop), called in process through
`ModelClient` or over localhost HTTP. Clocks are injected (`Clock`), the control loop is driven one `tick()` at a time,
and nothing reaches ITS, the real Worker, IMAP or Chrome: the emailed leg and the solve are stubbed as test_its does.

The redaction test runs the real `main.py --remote` in a subprocess (`--child`) through a hold, a stubbed
confirmation, a no-mail leg, a thread exception and a 503 ban, then greps everything it wrote to fd 1/2 for every
form of the dates, the hotel names, the session token, cookies, the applicant's fields, the mailbox, the booking
number and the runner token. The private log must have them (the flow ran); the public stream must not.

    python3 test_remote.py            # all
    python3 test_remote.py -v lease   # a subset, with the flow's logging
"""
import json
import os
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
from datetime import timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import test_its as T
from test_its import check, STATE, NAGU, RESOL, NIKKO, TARGET, TARGET_LIMITED, IDLE_DAY, S_TOKEN
import book_hotels as bh
import confirm_booking as cb
import logs
import main as M
import remote

HERE = os.path.dirname(os.path.abspath(__file__))
ITS_DIR = os.path.dirname(HERE)
TOKEN = 'runner-token-Zq81xT'
NEXT_MONTH_DAY = (T._TARGET_MONTH + timedelta(days=40)).replace(day=5).isoformat()
LATER_MONTH_DAY = (T._TARGET_MONTH + timedelta(days=75)).replace(day=5).isoformat()


# ── a fake Worker ────────────────────────────────────────────────────

class Clock:
    def __init__(self, t=1_800_000_000.0):
        self.t = t

    def __call__(self):
        return self.t

    def advance(self, s):
        self.t += s


def settings(**kw):
    s = {'v': 1, 'paused': False, 'intervalSec': 15, 'dates': [TARGET], 'guests': 2, 'skip': [],
         'priority': ['NAGU'], 'autoConfirm': False, 'updatedAt': 1, 'updatedBy': 'A'}
    s.update(kw)
    return s


class WorkerModel:
    """The its-bot Worker's runner routes, as FINAL.md and the contract describe them, in memory."""

    def __init__(self, clock=time.time, **kw):
        self.lock = threading.Lock()
        self.clock = clock
        self.settings = settings(**kw)
        self.mode_off = False
        self.bookings = []
        self.lease = None
        self.events = {}         # (runId, seq) -> event
        self.reports = []
        self.calls = []
        self.down = False        # answer 503
        self.garble = False      # answer 200 with a body that isn't a RunnerConfig

    def ms(self):
        return int(self.clock() * 1000)

    def config(self, run_id):
        now = self.ms()
        reason = None
        if self.mode_off:
            reason = 'mode_off'
        elif self.settings['paused']:
            reason = 'paused'
        elif not self.settings['dates']:
            reason = 'no_dates'
        elif self.lease and self.lease['holder'] != run_id and self.lease['until'] > now:
            reason = 'lease_lost'
        acks = [s for (r, s) in self.events if r == run_id]
        return {'settings': json.loads(json.dumps(self.settings)), 'bookings': [dict(b) for b in self.bookings],
                'lease': dict(self.lease) if self.lease else None, 'stop': reason is not None,
                'stopReason': reason, 'ackSeq': max(acks, default=0)}

    def handle(self, method, path, body, auth):
        with self.lock:
            u = urllib.parse.urlsplit(path)
            q = dict(urllib.parse.parse_qsl(u.query))
            self.calls.append((method, u.path, q))
            if self.down:
                return 503, {'error': 'down'}
            if auth != f'Bearer {TOKEN}':
                return 401, {'error': 'unauthorized'}
            if self.garble:
                return 200, {'settings': 'nope'}
            now = self.ms()
            if method == 'POST' and u.path == '/runner/claim':
                rid = body['runId']
                if self.lease is None or self.lease['until'] <= now or self.lease['holder'] == rid:
                    self.lease = {'holder': rid, 'host': body['host'], 'until': now + remote.LEASE_SEC * 1000}
                    return 200, {'ok': True, 'lease': dict(self.lease), 'config': self.config(rid)}
                return 200, {'ok': False, 'lease': dict(self.lease)}
            if method == 'POST' and u.path == '/runner/report':
                rid = body['runId']
                self.reports.append(body)
                ended = False
                for e in body['events']:
                    self.events.setdefault((rid, e['seq']), dict(e, runId=rid, t=now))
                    ended = ended or e['kind'] == 'run_end'
                if self.lease and self.lease['holder'] == rid:
                    self.lease = None if ended else dict(self.lease, until=now + remote.LEASE_SEC * 1000)
                return 200, self.config(rid)
            if method == 'POST' and u.path == '/runner/bookings':
                have = {b['id'] for b in self.bookings}
                for b in body:
                    if b['id'] not in have:
                        self.bookings.append(dict(b, at=now))
                return 200, self.config(q.get('runId', ''))
            if method == 'GET' and u.path == '/runner/config':
                return 200, self.config(q.get('runId', ''))
            return 404, {'error': 'not_found'}

    def kinds(self, kind):
        with self.lock:
            return [e for e in self.events.values() if e['kind'] == kind]

    def booked(self, kind):
        with self.lock:
            return [b for b in self.bookings if b['kind'] == kind]


class ModelClient:
    """remote.Client's interface, straight into a WorkerModel (bodies JSON round-tripped, as the wire would)."""

    def __init__(self, model, token=TOKEN):
        self.model, self.token = model, token

    def call(self, method, path, body=None):
        wire = None if body is None else json.loads(json.dumps(body))
        status, obj = self.model.handle(method, path, wire, f'Bearer {self.token}')
        return status, json.loads(json.dumps(obj))


def serve_model(model):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _do(self, method):
            n = int(self.headers.get('Content-Length') or 0)
            raw = self.rfile.read(n) if n else b''
            try:
                body = json.loads(raw) if raw else None
            except ValueError:
                body = None
            status, obj = model.handle(method, self.path, body, self.headers.get('Authorization', ''))
            out = json.dumps(obj).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(out)))
            self.end_headers()
            self.wfile.write(out)

        def do_GET(self):
            self._do('GET')

        def do_POST(self):
            self._do('POST')

    srv = ThreadingHTTPServer(('127.0.0.1', 0), H)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def make_remote(model, clock, run_id='run-1', **kw):
    kw.setdefault('seed_hold', bh.save_booking)
    return remote.Remote(ModelClient(model), run_id, 'actions', 'abc12345', None, clock=clock, **kw)


# ── a FakeITS that can ban ───────────────────────────────────────────

BAN = {'on': False}
BAN_PAGE = ('<html><head><title>セキュリティアラート</title></head><body>'
            'アクセス過多のため、このIPアドレスからのアクセスを約24時間制限しています。</body></html>')


class Handler(T.Handler):
    def _dispatch(self, method):
        if BAN['on']:
            STATE.record(f'{method} {self.path}')
            if method == 'POST':
                self._form()
            return self._send(503, BAN_PAGE)
        return super()._dispatch(method)


def _idle(*_a, stop_event=None, **_k):
    stop_event.wait()


def idle_supervisor():
    """A Supervisor whose threads only wait: the reconcile logic without scanning anything."""
    return M.Supervisor(scan_target=_idle, url_target=_idle, confirm_target=_idle)


def _cleanup(sup):
    sup.stopped = True
    sup.url_stop.set()
    sup.confirm_stop.set()
    for _w, stop in sup.scanners.values():
        stop.set()


class Hooks:
    """Install a Remote's gates into book_hotels/confirm_booking, and take them out again."""

    def __init__(self, rem):
        self.rem = rem

    def __enter__(self):
        self.saved = (bh._event_sink, bh._hold_gate, cb._commit_gate)
        bh._event_sink, bh._hold_gate, cb._commit_gate = self.rem.on_event, self.rem.hold_gate, self.rem.commit_gate
        return self

    def __exit__(self, *exc):
        bh._event_sink, bh._hold_gate, cb._commit_gate = self.saved
        return False


# ── tests ────────────────────────────────────────────────────────────

def test_contract_parity():
    """Both fixtures: the example messages parse, the runner's own messages have the contract's shape, and
    _norm_hotel agrees with every norm case."""
    with open(os.path.join(ITS_DIR, 'contract-example.json'), encoding='utf-8') as f:
        ex = json.load(f)
    with open(os.path.join(ITS_DIR, 'norm-cases.json'), encoding='utf-8') as f:
        cases = json.load(f)['cases']

    check('contract: the example RunnerConfig parses', remote.parse_config(ex['config']) is not None)
    check('contract: the example settings parse', remote.parse_settings(ex['config']['settings']) is not None)
    check('contract: the example BookingInput parses', remote.parse_booking(ex['bookingInput']) is not None)
    for b in ex['config']['bookings']:
        check('contract: the example BookingEntry parses', remote.parse_booking(b) is not None)
    garbled = dict(ex['config'], ackSeq='4')
    check('contract: a garbled RunnerConfig is refused', remote.parse_config(garbled) is None)
    check('contract: settings with a 10 s interval are refused',
          remote.parse_settings(dict(ex['config']['settings'], intervalSec=10)) is None)

    clock = Clock(ex['report']['startedAt'] / 1000)
    model = WorkerModel(clock)
    rem = make_remote(model, clock, run_id=ex['claimInput']['runId'], seed_hold=lambda *a: None)
    rem.claim(wait=0)
    claim_body = {'runId': rem.run_id, 'host': rem.host}
    check('contract: ClaimInput keys', set(claim_body) == set(ex['claimInput']), str(claim_body))
    rem.on_event('scan', {'ok': True, 'available': [TARGET]})
    rem.on_event('fail', {'step': 'calendar_get', 'status': 0, 'cls': 'timeout'})
    rem.on_event('solve', {'ok': True, 'secs': 19.0, 'spot': 'centre'})
    rem.on_event('hold', {'date': '2026-11-22', 'hotel': 'NAGU 勝浦'})
    rem.on_event('offered', {'date': '2026-11-22', 'names': ['NAGU 勝浦'], 'eligible': []})
    rep = rem.build_report()
    want = ex['report']
    check('contract: RunnerReport keys', set(rep) == set(want), str(set(rep) ^ set(want)))
    for k, v in want.items():
        if v is not None and rep[k] is not None:
            check(f'contract: RunnerReport.{k} type', type(rep[k]) is type(v) or
                  (isinstance(v, (int, float)) and isinstance(rep[k], (int, float))), f'{rep[k]!r} vs {v!r}')
    check('contract: solves keys', set(rep['solves']) == set(want['solves']), str(rep['solves']))
    check('contract: lastError keys', set(rep['lastError']) == set(want['lastError']), str(rep['lastError']))
    ev_keys = {'seq', 'kind', 'date', 'hotel', 'detail'}
    check('contract: events are EventInput', all(set(e) <= ev_keys and 'seq' in e for e in rep['events']),
          str(rep['events']))
    kinds = {'run_start', 'run_end', 'available', 'filtered', 'hold', 'confirmed', 'human_needed', 'ban',
             'solve_failed', 'error'}
    check('contract: event kinds are the contract\'s', {e['kind'] for e in rep['events']} <= kinds)
    b = next(iter(rem.unsynced.values()))
    check('contract: BookingInput keys', set(b) <= set(ex['bookingInput']) | {'number'}
          and set(ex['bookingInput']) <= set(b), str(b))
    check('contract: a booking id is runId:seq', b['id'].startswith(rem.run_id + ':'), b['id'])

    saved = {k: getattr(bh, k) for k in ('TARGET_DATES', 'SKIP_HOTELS', '_SKIP_NORM', 'PRIORITY_HOTELS',
                                         '_PRIORITY_NORM', 'RETRY_DELAY', 'NUM_GUESTS', 'AUTO_CONFIRM')}
    try:
        bh.apply_settings(ex['config']['settings'])
        check('contract: settings applied: dates', bh.TARGET_DATES == ex['config']['settings']['dates'])
        check('contract: settings applied: guests as the form string', bh.NUM_GUESTS == '2')
        check('contract: settings applied: skip matches by normName', bh.is_skipped('ゆふいん山水館'))
        check('contract: settings applied: auto-confirm off', bh.AUTO_CONFIRM is False)
    finally:
        for k, v in saved.items():
            setattr(bh, k, v)

    for c in cases:
        got = bh._norm_hotel(c['in'])
        check(f'norm-cases: {c["why"]}', got == c['out'], f'{got!r} != {c["out"]!r}')


def test_public_log_allowlist():
    line, dropped = logs.format_public('summary', {
        'scans': 12, 'secs': 19.04, 'phase': 'scanning', 'cls': 'http_503', 'exc': 'KeyError', 'ok': True,
        'date': TARGET, 'hotel': NAGU, 'url': f'https://x/?s={S_TOKEN}', 'step': TARGET, 'detail': NAGU,
        'status': '503', 'secs_bad': 1, 'n': float('nan'), 'fail_calendar_get': 3, 'ok_age_s': float('inf'),
    })
    check('public: counts, seconds and codes pass', 'scans=12' in line and 'secs=19.0' in line
          and 'phase=scanning' in line and 'cls=http_503' in line and 'exc=KeyError' in line and 'ok=1' in line
          and 'fail_calendar_get=3' in line, line)
    for bad in (TARGET, NAGU, S_TOKEN, '?s=', 'https', "'503'"):
        check(f'public: {bad!r} never printed', bad not in line, line)
    check('public: the rejects are counted', 'dropped=9' in line, line)
    check('public: rejected names reported, not values', TARGET not in ' '.join(dropped), str(dropped))
    check('public: an event name that is not a code', logs.format_public(TARGET, {})[0] == 'its bad_event')
    check('public: a code may not start with a digit',
          logs.format_public('x', {'detail': '2026-12-05'})[0] == 'its x dropped=1')
    check('public: thread kind stops at the first non-letter',
          logs._thread_kind(threading.Thread(name=f'scan-{TARGET}')) == 'scan')


def test_claim_waits_for_an_expired_lease():
    clock = Clock()
    model = WorkerModel(clock)
    model.lease = {'holder': 'old-run', 'host': 'actions', 'until': model.ms() + 100_000}
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    slept = []

    def sleep(s):
        slept.append(s)
        clock.advance(s)

    cfg, why = rem.claim(sleep=sleep)
    check('claim: waited for the old lease to expire, then got it', cfg is not None and why == '', why)
    check('claim: waited about 100 s', 90 <= sum(slept) <= 120, str(sum(slept)))

    model.lease = {'holder': 'other', 'host': 'local', 'until': model.ms() + 3_600_000}
    rem2 = make_remote(model, clock, run_id='run-2', seed_hold=lambda *a: None)
    slept.clear()
    cfg, why = rem2.claim(sleep=sleep)
    check('claim: gives up after CLAIM_WAIT_SEC with lease_lost', cfg is None and why == 'lease_lost', why)
    check('claim: gave up within the wait', sum(slept) <= remote.CLAIM_WAIT_SEC, str(sum(slept)))

    model.down = True
    rem3 = make_remote(model, clock, run_id='run-3', seed_hold=lambda *a: None)
    cfg, why = rem3.claim(sleep=sleep)
    check('claim: an unreachable Worker is not a stale config', cfg is None and why == 'unreachable', why)


def test_lease_fencing():
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    check('fence: open after the claim', rem.hold_gate() == (True, ''), str(rem.hold_gate()))
    check('fence: a commit allowed (confirm stage)', rem.commit_gate(TARGET, NAGU, 'confirm') == (True, ''))
    clock.advance(remote.FENCE_SEC + 1)
    check('fence: no new hold once the lease is older than LEASE_SEC − 60 s',
          rem.hold_gate() == (False, 'lease_stale'), str(rem.hold_gate()))
    check('fence: no commit either', rem.commit_gate(TARGET, NAGU, 'apply') == (False, 'lease_stale'))
    rem.report()
    check('fence: a report renews it', rem.hold_gate() == (True, ''), str(rem.hold_gate()))

    # Someone else took the lease (an operator's local run, say): closed at once, and told to stop.
    model.lease = {'holder': 'intruder', 'host': 'local', 'until': model.ms() + 600_000}
    cfg = rem.report()
    check('fence: another holder closes it immediately', rem.hold_gate() == (False, 'lease_stale'))
    check('fence: and the answer says stop, lease_lost', cfg['stop'] and cfg['stopReason'] == 'lease_lost',
          str(cfg and cfg['stopReason']))
    check('fence: a commit is refused', rem.commit_gate(TARGET, NAGU, 'confirm')[0] is False)


def test_hold_refused_by_the_gate_in_the_flow(port):
    """book_one_hotel asks the gate right before step 7: refused, nothing is held, nothing reaches empty_create."""
    with T.Env(port), T.CapturedLog() as log:
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        clock.advance(remote.FENCE_SEC + 5)
        with Hooks(rem):
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('gate-flow: nothing held', booked == [], str(booked))
        check('gate-flow: step 7 never sent', STATE.count('empty_create') == 0, str(STATE.count('empty_create')))
        check('gate-flow: said why', log.saw('Not taking a hold') and log.saw('lease_stale'))
        check('gate-flow: counted', rem.counts['refused'] == 3, str(rem.counts))


def test_worker_outage(port):
    """A hold while the Worker is down: queued, retried with each report, and no new hold once unsynced and the
    outage passes 2 minutes. Recovery sends it and opens the gate."""
    with T.Env(port):
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        model.down = True
        rem.on_event('hold', {'date': TARGET, 'hotel': NAGU})
        rem.report()
        check('outage: the hold is queued, not lost', len(rem.unsynced) == 1, str(rem.unsynced))
        clock.advance(60)
        rem.report()
        check('outage: under 2 min, holds still allowed', rem.hold_gate() == (True, ''), str(rem.hold_gate()))
        clock.advance(70)
        rem.report()
        check('outage: past 2 min with an unsynced hold, refused',
              rem.hold_gate() == (False, 'bookings_unsynced'), str(rem.hold_gate()))
        with Hooks(rem):
            STATE.hotels = [(8, RESOL)]
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('outage: the flow takes no new hold', booked == [] and STATE.count('empty_create') == 0)
        n_reports = len([c for c in model.calls if c[1] == '/runner/bookings'])
        check('outage: the queue was retried with each report', n_reports >= 3, str(n_reports))
        model.down = False
        rem.report()
        check('outage: recovered, the hold reached the record', [b['hotel'] for b in model.booked('hold')] == [NAGU])
        check('outage: nothing left unsynced', rem.unsynced == {}, str(rem.unsynced))
        check('outage: the hold event arrived once', len(model.kinds('hold')) == 1)
        check('outage: the gate is open again', rem.hold_gate() == (True, ''), str(rem.hold_gate()))
        check('outage: the bookings call carried ?runId=',
              all(c[2].get('runId') == rem.run_id for c in model.calls if c[1] == '/runner/bookings'))
        check('outage: the failures are reported by step', rem.failures_by_step.get('worker', 0) >= 4,
              str(rem.failures_by_step))


def test_garbled_answer_is_not_settings():
    clock = Clock()
    model = WorkerModel(clock)
    applied = []
    rem = make_remote(model, clock, on_settings=applied.append, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    model.garble = True
    check('garbled: no config', rem.report() is None)
    check('garbled: the settings were applied once, from the claim', len(applied) == 1, str(len(applied)))
    check('garbled: counted as a Worker failure', rem.last_by_step.get('worker') == (200, 'bad_answer'),
          str(rem.last_by_step))


def test_holds_seeded_from_the_record(port):
    """A hotel the Worker's record holds for a date (any run, any kind) is never applied for again."""
    with T.Env(port) as env:
        clock = Clock()
        model = WorkerModel(clock)
        model.bookings = [{'id': 'old:1', 'kind': 'hold', 'date': TARGET, 'hotel': NAGU, 'at': 1, 'runId': 'old'},
                          {'id': 'old:2', 'kind': 'confirmed', 'date': TARGET, 'hotel': NIKKO, 'number': 'n',
                           'at': 2, 'runId': 'old'}]
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        check('seed: holds.json has the record', env.bookings() == {TARGET: [NAGU, NIKKO]}, str(env.bookings()))
        with Hooks(rem):
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('seed: only the hotel nobody held is applied for', booked == [RESOL], str(booked))


def test_change_only_events():
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    for _ in range(3):
        rem.on_event('offered', {'date': TARGET, 'names': [NAGU, RESOL], 'eligible': [NAGU]})
    rem.on_event('offered', {'date': TARGET, 'names': [RESOL, NAGU], 'eligible': [RESOL]})
    kinds = [e['kind'] for e in rem.events]
    check('events: one available per offered set (order ignored)', kinds == ['available'], str(kinds))
    rem.on_event('offered', {'date': TARGET, 'names': [NAGU], 'eligible': []})
    rem.on_event('offered', {'date': TARGET, 'names': [NAGU], 'eligible': []})
    rem.on_event('offered', {'date': TARGET_LIMITED, 'names': [NAGU], 'eligible': []})
    kinds = [(e['kind'], e.get('date')) for e in rem.events]
    check('events: filtered once per set, per date',
          kinds == [('available', TARGET), ('filtered', TARGET), ('filtered', TARGET_LIMITED)], str(kinds))
    check('events: the names offered, joined', rem.events[0]['hotel'] == f'{NAGU} / {RESOL}', rem.events[0]['hotel'])
    check('events: seen collects the names', rem.seen == {NAGU, RESOL}, str(rem.seen))


def test_hot_reload(port):
    """Settings from a report reach the running bot: months start and stop scanners, a scanner reads its dates each
    cycle, a skip change applies to the next booking, and auto-confirm turned off after a hold was queued keeps
    Chrome away."""
    saved = {k: getattr(bh, k) for k in ('TARGET_DATES', 'SKIP_HOTELS', '_SKIP_NORM', 'PRIORITY_HOTELS',
                                         '_PRIORITY_NORM', 'RETRY_DELAY', 'NUM_GUESTS', 'AUTO_CONFIRM')}
    sup = idle_supervisor()
    try:
        bh.apply_settings(settings(dates=[TARGET, NEXT_MONTH_DAY]))
        sup.start()
        check('reload: a scanner per month', sorted(sup.scanners) == sorted({TARGET[:7], NEXT_MONTH_DAY[:7]}),
              str(sorted(sup.scanners)))
        first = sup.scanners[TARGET[:7]][1]
        bh.apply_settings(settings(dates=[NEXT_MONTH_DAY, LATER_MONTH_DAY]))
        sup.reconcile()
        check('reload: a month removed stops its scanner', first.is_set())
        check('reload: a month added starts one',
              sorted(sup.scanners) == sorted({NEXT_MONTH_DAY[:7], LATER_MONTH_DAY[:7]}), str(sorted(sup.scanners)))
        dates_fn = sup.scanners[NEXT_MONTH_DAY[:7]][0].args[1]
        bh.apply_settings(settings(dates=[NEXT_MONTH_DAY, f'{NEXT_MONTH_DAY[:7]}-20', LATER_MONTH_DAY]))
        check("reload: a scanner's dates are read live", dates_fn() == [NEXT_MONTH_DAY, f'{NEXT_MONTH_DAY[:7]}-20'],
              str(dates_fn()))
        changed = bh.apply_settings(settings(dates=[NEXT_MONTH_DAY], intervalSec=60, guests=3))
        check('reload: apply_settings reports what changed',
              set(changed) == {'TARGET_DATES', 'RETRY_DELAY', 'NUM_GUESTS'}, str(changed))
        check('reload: the interval and guests', bh.RETRY_DELAY == 60 and bh.NUM_GUESTS == '3')
    finally:
        _cleanup(sup)
        for k, v in saved.items():
            setattr(bh, k, v)

    with T.Env(port) as env:
        # A real scanner given the callable: the date it books appears only after it started.
        bh.TARGET_DATES = [IDLE_DAY]
        stop = threading.Event()
        t = threading.Thread(target=bh.scan_and_book_month, args=(T.MONTH, M._month_dates(T.MONTH), 'LIVE'),
                             kwargs={'stop_event': stop}, daemon=True)
        t.start()
        try:
            T._wait_for(lambda: STATE.count('POST /calendar_apply/calendar_select') >= 2)
            check('reload: nothing booked for the idle date', env.bookings() == {})
            bh.TARGET_DATES = [IDLE_DAY, TARGET]
            booked = T._wait_for(lambda: len(env.bookings().get(TARGET, [])) == 3)
            check('reload: the added date was scanned and booked', booked, str(env.bookings()))
        finally:
            stop.set()
            t.join(10)

    with T.Env(port):
        bh.apply_settings(settings(skip=[NAGU]))
        bh.RETRY_DELAY = 0.05
        _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('reload: a skip change applies to the next booking', booked == [RESOL, NIKKO], str(booked))

    with T.Env(port, confirm=True, applicant=dict(T.APPLICANT_FIXTURE)):
        STATE.hotels = [(7, NAGU)]
        _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('reload: held and queued while auto-confirm was on', booked == [NAGU] and cb.pending_count() == 1)
        bh.apply_settings(settings(autoConfirm=False))
        cb.drain_once()
        check('reload: auto-confirm off after the enqueue: Chrome never handed the form',
              STATE.browser_calls == [], str(len(STATE.browser_calls)))
        check('reload: the tripwire untouched', STATE.filed == [] and STATE.confirmed == [])


def test_commit_needs_the_confirming_ack(port):
    """No ack for the `confirming` entry, no 申込する: the Worker down means the leg is deferred to a person."""
    for down in (True, False):
        with T.Env(port, confirm=True, applicant=dict(T.APPLICANT_FIXTURE)):
            clock = Clock()
            model = WorkerModel(clock)
            rem = make_remote(model, clock)
            rem.claim(wait=0)
            model.down = down
            with Hooks(rem):
                STATE.hotels = [(7, NAGU)]
                bh.book_all_hotels_for_date(TARGET, 'TEST')
                cb.drain_once()
            model.down = False
            rem.report()
            if down:
                check('ack: Worker down: Chrome never handed the form', STATE.browser_calls == [])
                check('ack: a failed entry and a human_needed for the hold',
                      [b['kind'] for b in model.bookings] == ['hold', 'confirming', 'failed']
                      and [e['detail'] for e in model.kinds('human_needed')] == ['leg_deferred'],
                      f'{[b["kind"] for b in model.bookings]} {model.kinds("human_needed")}')
            else:
                check('ack: acknowledged: filed once', len(STATE.browser_calls) == 1)
                check('ack: hold, confirming, confirmed in the record',
                      [b['kind'] for b in model.bookings] == ['hold', 'confirming', 'confirmed'],
                      str([b['kind'] for b in model.bookings]))
                check('ack: the number on the confirmed entry', model.booked('confirmed')[0].get('number') == '12345678')
                check('ack: a confirmed event', len(model.kinds('confirmed')) == 1)


def test_bounded_run():
    """The deadline: no new hold, the scanners and the URL monitor stopped, the in-flight booking waited for, then a
    final report with run_end (the lease released) and a human_needed for a young hold that never confirmed."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, deadline=clock() + 600, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    cb._pending.clear()
    saved = bh.TARGET_DATES
    bh.TARGET_DATES = [TARGET]
    sup = idle_supervisor()
    sup.start()
    run = M.RemoteRun(rem, sup, deadline=rem.deadline, clock=clock)
    try:
        check('bounded: running', run.tick() is None and rem.phase == 'starting', rem.phase)
        rem.on_event('scan', {'ok': True, 'available': []})
        clock.advance(500)
        rem.on_event('hold', {'date': TARGET, 'hotel': NAGU})
        check('bounded: scanning', run.tick() is None and rem.phase == 'scanning', rem.phase)
        clock.advance(101)
        with bh._booking_in_flight():
            check('bounded: past the deadline with a booking in flight: still draining', run.tick() is None)
            check('bounded: phase draining', rem.phase == 'draining', rem.phase)
            check('bounded: no new hold', rem.hold_gate() == (False, 'time_up'), str(rem.hold_gate()))
            check('bounded: scanners stopped', sup.scanners == {} and sup.url_stop.is_set())
            clock.advance(60)
            check('bounded: still waiting for it', run.tick() is None)
        clock.advance(1)
        check('bounded: the booking done, the run ends', run.tick() == 'time_up')
        check('bounded: run_end reached the Worker', [e.get('detail') for e in model.kinds('run_end')] == ['time_up'])
        check('bounded: the lease released', model.lease is None, str(model.lease))
        check('bounded: the young hold asks for a person',
              [(e['hotel'], e['detail']) for e in model.kinds('human_needed')] == [(NAGU, 'run_ended')])
        check('bounded: the last report says stopping', model.reports[-1]['phase'] == 'stopping')
        check('bounded: deadline in the reports (ms)', model.reports[-1]['deadline'] == int(rem.deadline * 1000))
    finally:
        _cleanup(sup)
        bh.TARGET_DATES = saved

    # A booking that never finishes: the drain's cap ends the run anyway.
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, deadline=clock() + 10, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, deadline=rem.deadline, clock=clock)
    try:
        with bh._booking_in_flight():
            clock.advance(11)
            check('bounded-cap: draining', run.tick() is None)
            clock.advance(M.DRAIN_SEC)
            check('bounded-cap: ends at deadline + DRAIN_SEC with work in flight', run.tick() == 'time_up')
    finally:
        _cleanup(sup)


def test_stop_from_the_worker():
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    try:
        check('stop: running', run.tick() is None)
        model.settings['paused'] = True
        clock.advance(remote.REPORT_EVERY_SEC)
        check('stop: paused ends the run at the next report', run.tick() == 'paused')
        check('stop: run_end paused', [e.get('detail') for e in model.kinds('run_end')] == ['paused'])
    finally:
        _cleanup(sup)


def test_ban_exit(port):
    """A 503 セキュリティアラート: the ban event at once, holds stop, the run ends with run_end detail=ban."""
    with T.Env(port):
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        sup = idle_supervisor()
        run = M.RemoteRun(rem, sup, clock=clock)
        try:
            run.tick()
            BAN['on'] = True
            with Hooks(rem):
                _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
            check('ban: nothing booked', booked == [])
            check('ban: flagged', rem.banned and rem.hold_gate() == (False, 'ban'), str(rem.hold_gate()))
            check('ban: urgent', rem.urgent.is_set())
            check('ban: the run ends', run.tick() == 'ban')
            check('ban: one ban event', len(model.kinds('ban')) == 1, str(model.kinds('ban')))
            check('ban: run_end ban', [e.get('detail') for e in model.kinds('run_end')] == ['ban'])
            check('ban: lastError says ban', rem.last_error['cls'] == 'ban', str(rem.last_error))
        finally:
            BAN['on'] = False
            _cleanup(sup)


def test_imap_check_when_auto_confirm():
    clock = Clock()
    model = WorkerModel(clock, autoConfirm=True)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    saved = cb.imap_check
    calls = []
    cb.imap_check = lambda: (calls.append(1), (False, 'login_rejected'))[1]
    try:
        run.tick()
        run.tick()
        check('imap: checked once while on', len(calls) == 1, str(calls))
        clock.advance(remote.REPORT_EVERY_SEC)
        run.tick()
        check('imap: an error event', [e.get('detail') for e in model.kinds('error')] == ['imap_login_rejected'],
              str(model.kinds('error')))
        check('imap: lastError step imap', rem.last_error['step'] == 'imap', str(rem.last_error))
    finally:
        cb.imap_check = saved
        _cleanup(sup)


def test_turnstile_click_spot():
    import chrome
    wide = {'x': 100, 'y': 200, 'width': 960, 'height': 65}
    check('spot: first the centred box\'s checkbox (x + w/2 − 150 + 22)',
          chrome._checkbox_spot(wide, 1) == (100 + 480 - 150 + 22, 232, 'centre'), str(chrome._checkbox_spot(wide, 1)))
    check('spot: second the left edge (x + 28)', chrome._checkbox_spot(wide, 2) == (128, 232, 'left'))
    check('spot: third centred again', chrome._checkbox_spot(wide, 3)[2] == 'centre')
    narrow = {'x': 10, 'y': 0, 'width': 300, 'height': 65}
    check('spot: a 300 px container is the box itself', chrome._checkbox_spot(narrow, 1)[0] == 32)
    tiny = {'x': 10, 'y': 0, 'width': 120, 'height': 65}
    check('spot: never left of the container', chrome._checkbox_spot(tiny, 1)[0] == 32)


def test_client_over_http():
    model = WorkerModel()
    srv = serve_model(model)
    try:
        base = f'http://127.0.0.1:{srv.server_port}'
        status, obj = remote.Client(base, TOKEN).call('GET', '/runner/config?runId=x')
        check('client: 200 and a RunnerConfig', status == 200 and remote.parse_config(obj) is not None, str(status))
        status, obj = remote.Client(base, 'wrong').call('GET', '/runner/config')
        check('client: 401 is a status, not a raise', status == 401, str(status))
        status, obj = remote.Client('http://127.0.0.1:1', TOKEN, timeout=2).call('GET', '/runner/config')
        check('client: unreachable is (0, None)', (status, obj) == (0, None), str(status))
    finally:
        srv.shutdown()


# ── the redaction test: the real main.py --remote in a subprocess ────

CHILD_APPLICANT = {
    'ITS_KIGOU': 'KG7731', 'ITS_BANGOU': 'BG4410', 'ITS_OFFICE_NAME': 'Zylophone Kabushiki',
    'ITS_KANA_SEI': 'ヤマダ', 'ITS_KANA_MEI': 'タロウ', 'ITS_BIRTH': '2000-04-05', 'ITS_SEX': '女',
    'ITS_ZOKUGARA': '本人', 'ITS_TEL': '09087654321', 'ITS_ZIP': '1000001', 'ITS_STATE': '東京都',
    'ITS_ADDR': 'テスト区9-8-7',
}
CHILD_MAILBOX = 'runner-probe@example.com'
CHILD_PASSWORD = 'abcdwxyzabcdwxyz'
NUMBER = '12345678'


def child_main(its_port):
    """The subprocess: main.py --remote against the FakeITS and the fake Worker, with test_its's stubs."""
    import chrome

    base = f'http://127.0.0.1:{its_port}'
    bh.BASE = cb.BASE = base
    bh.CURL_MAX_ATTEMPTS, bh.CURL_RETRY_BACKOFF, bh.SCAN_JITTER, bh.SCAN_BACKOFF_MAX = 1, 0.01, 0, 0.2
    bh.BOOK_RETRY_DELAY, bh.DEBUG_DUMP_INTERVAL = 0.01, 0
    cb.CONFIRM_POLL_INTERVAL, cb.CONFIRM_MAIL_TIMEOUT = 0.05, 1.0
    remote.REPORT_EVERY_SEC = 0.3
    M.URL_CHECK_INTERVAL, M.SUMMARY_EVERY_SEC, M.BAN_DRAIN_SEC, M.PUBLIC_ERROR_EVERY_SEC = 0.2, 0.5, 10, 0
    real_apply = bh.apply_settings

    def fast_apply(s):
        changed = real_apply(s)
        bh.RETRY_DELAY = 0.1      # the 15 s floor is the real site's; this one is ours
        return changed
    bh.apply_settings = fast_apply

    url = f'{base}/calendar_apply/calendar_select?s={S_TOKEN}'

    def boom():
        raise RuntimeError(f'boom {TARGET} {NAGU} s={S_TOKEN} {CHILD_MAILBOX}')

    async def solve():
        with open(bh.CALENDAR_URL_CACHE, 'w') as f:
            f.write(url + '\n')
        chrome.last_solve.update(secs=1.5, spot='centre')
        bh.log(f'Calendar URL obtained — {url}')
        # A thread dying with secrets in its message, once logs.setup() has run (the solve is after it). Named like
        # a scanner, with a date in the name.
        threading.Thread(target=boom, name=f'scan-{TARGET}', daemon=True).start()
        return url
    chrome.get_calendar_url = solve
    link = f'{base}/apply/new?c={T.FAKE_APPLY_C}'
    cb._mail_source = lambda _since: [f'手続きのご案内\n{link}\n']

    def browser(link_, values, log_, tag_, allow_commit):
        log_(f'{tag_} stub browser got {sorted(values.items())}')
        ok, why = allow_commit()
        return ('confirmed', NUMBER) if ok else ('deferred', why)
    cb._browser_submit = browser
    cb.imap_check = lambda: (False, 'login_rejected')
    return M.main(['--remote', '--deadline', str(time.time() + 90)])


def test_redaction_subprocess(port, tmpdir):
    model = WorkerModel(dates=[TARGET], autoConfirm=True)
    srv = serve_model(model)
    state = os.path.join(tmpdir, 'state')
    env = {
        'PATH': os.environ.get('PATH', ''), 'HOME': tmpdir, 'NO_PROXY': '127.0.0.1,localhost',
        'no_proxy': '127.0.0.1,localhost', 'PYTHONDONTWRITEBYTECODE': '1',
        'ITS_STATE_DIR': state, 'ITS_WORKER_URL': f'http://127.0.0.1:{srv.server_port}', 'ITS_RUNNER_TOKEN': TOKEN,
        'ITS_IMAP_USER': CHILD_MAILBOX, 'ITS_EMAIL': CHILD_MAILBOX, 'ITS_IMAP_APP_PASSWORD': CHILD_PASSWORD,
        'GITHUB_ACTIONS': 'true', 'GITHUB_RUN_ID': '424242', 'GITHUB_REPOSITORY': 'huangwaylon/fitness',
        'GITHUB_SHA': 'abcdef0123456789', 'GITHUB_EVENT_NAME': 'schedule', **CHILD_APPLICANT,
    }
    STATE.hits.clear()
    STATE.fail_once.clear()
    STATE.hotels = [(7, NAGU), (8, RESOL), (9, NIKKO)]
    STATE.no_rooms.clear()
    STATE.applicant_mode = 'ok'
    proc = subprocess.Popen([sys.executable, os.path.join(HERE, 'test_remote.py'), '--child', str(port)],
                            cwd=HERE, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out = err = b''
    try:
        # One confirmed (the first hold took the only link) and two failed (no mail), then the ban.
        settled = T._wait_for(lambda: len(model.booked('confirmed')) == 1 and len(model.booked('failed')) == 2,
                              timeout=60)
        check('redaction: the child held, confirmed one, gave up on two', settled,
              str([b['kind'] for b in model.bookings]))
        BAN['on'] = True
        out, err = proc.communicate(timeout=60)
    except subprocess.TimeoutExpired:
        proc.kill()
        out, err = proc.communicate()
        check('redaction: the child exited', False)
    finally:
        BAN['on'] = False
        srv.shutdown()
    public = out.decode('utf-8', 'replace')
    check('redaction: exit 0 after the ban', proc.returncode == 0, f'{proc.returncode} {public[-400:]}')
    check('redaction: nothing on stderr (fd 2 is the private log)', err == b'', err[:300].decode('utf-8', 'replace'))
    masks = [ln for ln in public.splitlines() if ln.startswith('::add-mask::')]
    check('redaction: the runner token masked', f'::add-mask::{TOKEN}' in masks)
    check('redaction: the app password masked', f'::add-mask::{CHILD_PASSWORD}' in masks)
    lines = [ln for ln in public.splitlines() if not ln.startswith('::add-mask::')]
    check('redaction: every public line is an its line', all(ln.startswith('its ') for ln in lines),
          str([ln for ln in lines if not ln.startswith('its ')][:3]))
    text = '\n'.join(lines)
    def has(event, *pairs):
        return any(ln.split(' ')[1:2] == [event] and all(p in ln.split(' ') for p in pairs) for ln in lines)
    for event, *pairs in (('claim', 'ok=1'), ('phase', 'name=scanning'), ('solve', 'ok=1', 'spot=centre'),
                          ('hold', 'n=3'), ('confirmed', 'n=1'), ('human_needed', 'detail=no_mail'),
                          ('imap', 'ok=0', 'cls=login_rejected'), ('ban',), ('summary',),
                          ('error', 'step=thread', 'thread=scan', 'exc=RuntimeError'),
                          ('run_end', 'detail=ban')):
        check(f'redaction: public has its {event} {" ".join(pairs)}', has(event, *pairs))

    def forms(d):
        y, m, dd = d.split('-')
        return {d, d[5:], y + m + dd, f'{int(m)}/{int(dd)}', f'{m}/{dd}', f'{int(m)}月{int(dd)}日', f'{y}/{m}/{dd}'}
    banned = set()
    for d in (TARGET, TARGET_LIMITED, CHILD_APPLICANT['ITS_BIRTH']):
        banned |= forms(d)
    # (Not a bare 's=' or 'c=': `secs=` and `exc=` contain them. The tokens themselves, and their query forms.)
    banned |= {NAGU, 'NAGU', 'nagu', RESOL, NIKKO, '勝浦', S_TOKEN, '?s=', '&s=', 'csrf', 'authenticity',
               '_src_session', 'Cookie', 'cookie', T.FAKE_APPLY_C, '?c=', 'http:', 'https', '://', '127.0.0.1',
               CHILD_MAILBOX, '@', CHILD_PASSWORD, TOKEN, NUMBER, 'Bearer'}
    banned |= {v for v in CHILD_APPLICANT.values() if len(v) >= 2}
    leaks = sorted(b for b in banned if b in text)
    check('redaction: no date, hotel, token, cookie, applicant field, mailbox or number in public', leaks == [],
          f'{leaks} in: {[ln for ln in lines if any(b in ln for b in leaks)][:4]}')

    with open(os.path.join(state, 'its_booking.log'), encoding='utf-8', errors='replace') as f:
        private = f.read()
    for want in (TARGET, NAGU, 'HELD + MAIL SENT', NUMBER, 'Traceback', 'RuntimeError: boom', S_TOKEN):
        check(f'redaction: the private log has {want!r} (the flow ran, nothing lost)', want in private)
    mode = os.stat(os.path.join(state, 'its_booking.log')).st_mode & 0o777
    check('redaction: the private log is 0600', mode == 0o600, oct(mode))


# ── runner ───────────────────────────────────────────────────────────

def main_(argv=()):
    verbose = '-v' in argv
    names = [a for a in argv if not a.startswith('-')]
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    bh._log_handler = None if verbose else (lambda _m: None)
    if not verbose:
        logs._pub = open(os.devnull, 'w')   # the in-process runs' public lines (the child's are read for real)
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith('test_') and callable(f) and (not names or any(k in n for k in names))]
    if not tests:
        raise SystemExit(f'no tests matched {names}')
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            available = {'port': srv.server_port, 'tmpdir': tmpdir}
            for name, fn in tests:
                wanted = fn.__code__.co_varnames[:fn.__code__.co_argcount]
                fn(**{k: v for k, v in available.items() if k in wanted})
    finally:
        bh._log_handler = None
        srv.shutdown()
    print()
    if T.FAILURES:
        print(f'{len(T.FAILURES)} FAILED:')
        for f in T.FAILURES:
            print(f'  - {f}')
        raise SystemExit(1)
    print(f'all checks passed ({len(tests)} tests)')


if __name__ == '__main__':
    if sys.argv[1:2] == ['--child']:
        sys.exit(child_main(int(sys.argv[2])))
    main_(sys.argv[1:])
