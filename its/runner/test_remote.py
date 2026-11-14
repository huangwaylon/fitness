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
import contextlib
import io
import json
import tempfile
import re
import os
import signal
import subprocess
import sys
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
import restart

HERE = os.path.dirname(os.path.abspath(__file__))
ITS_DIR = os.path.dirname(HERE)
TOKEN = 'runner-token-Zq81xT'
NEXT_MONTH_DAY = (T._TARGET_MONTH + timedelta(days=40)).replace(day=5).isoformat()
LATER_MONTH_DAY = (T._TARGET_MONTH + timedelta(days=75)).replace(day=5).isoformat()
FENCE_AT = remote.LEASE_SEC - remote.FENCE_MARGIN_SEC   # seconds after a renewal that the fence closes


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
        self.max_bookings = 500  # the record's cap: past it, 507
        self.silent_ids = False  # an old Worker: a known id is ignored (200) whatever its content
        self.restarts_left = None  # a preflight's restartsLeft (None: an older Worker's, absent)
        self.delay = 0             # seconds each HTTP answer waits (serve_model: a slow Worker)

    def ms(self):
        return int(self.clock() * 1000)

    def config(self, run_id, must_hold=False):
        """A RunnerConfig. `must_hold` (a report's answer, as the Worker's runnerConfig): a run without the lease is
        told lease_lost even when nobody else holds it."""
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
        elif must_hold and (not self.lease or self.lease['holder'] != run_id):
            reason = 'lease_lost'
        acks = [s for (r, s) in self.events if r == run_id]
        c = {'settings': json.loads(json.dumps(self.settings)), 'bookings': [dict(b) for b in self.bookings],
             'lease': dict(self.lease) if self.lease else None, 'stop': reason is not None,
             'stopReason': reason, 'ackSeq': max(acks, default=0)}
        if not run_id and self.restarts_left is not None:
            c['restartsLeft'] = self.restarts_left
        return c

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
            if len(json.dumps(body, ensure_ascii=False).encode()) > 64 * 1024:
                return 413, {'error': 'too_large'}
            if u.path == '/runner/report' and len(body['events']) > 100:
                return 400, {'error': 'events'}
            if u.path == '/runner/report' and any('date' in e and not re.match(r'\d{4}-\d{2}-\d{2}\Z', e['date'])
                                                  for e in body['events']):
                return 400, {'ok': False, 'error': 'bad_report_event'}   # the Worker refuses the whole report
            if u.path == '/runner/bookings' and any(not re.match(r'\d{4}-\d{2}-\d{2}\Z', str(b.get('date'))) for b in body):
                return 400, {'ok': False, 'error': 'bad_booking'}   # the Worker's parseBookings: refused whole
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
                return 200, self.config(rid, must_hold=True)
            if method == 'POST' and u.path == '/runner/bookings':
                have = {b['id']: b for b in self.bookings}
                same = lambda a, b: all(a.get(k) == b.get(k) for k in ('kind', 'date', 'hotel', 'runId', 'number'))
                if not self.silent_ids and any(b['id'] in have and not same(have[b['id']], b) for b in body):
                    return 409, {'ok': False, 'error': 'id_conflict'}
                full = False
                for b in body:
                    if b['id'] in have:
                        continue
                    if len(self.bookings) >= self.max_bookings:
                        full = True
                        continue
                    self.bookings.append(dict(b, at=now))
                    have[b['id']] = b
                if full:   # what fit is kept; the answer is the bare refusal (the real Worker's)
                    return 507, {'ok': False, 'error': 'record_full'}
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
            if model.delay:
                time.sleep(model.delay)
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


# ── the in-job restart (restart.py) ──────────────────────────────────

class FakeChild:
    def __init__(self, code, on_wait=None):
        self.code, self.on_wait, self.signals = code, on_wait, []

    def wait(self):
        if self.on_wait:
            self.on_wait(self)
        return self.code

    def send_signal(self, s):
        self.signals.append(s)


def _supervisor(codes, clock, deadline=None, runs=None, on_wait=None, reported=True):
    """A restart.Supervisor over scripted exits (`codes`, in order), a scripted preflight (`runs`: True/False per ask,
    or a reason code meaning no, then True), and the test's clock; each child answers a report first (`reported`: it
    touches the marker) unless told not to; `spawned` the envs each start got, `lines` the public lines."""
    spawned, lines, asks = [], [], list(runs or [])
    marker = os.path.join(tempfile.mkdtemp(), 'reported')

    def child_wait(c):
        if reported:
            open(marker, 'w').close()
        if on_wait:
            on_wait(c)

    def spawn(cmd, env):
        spawned.append((list(cmd), env.get('ITS_RESTART')))
        return FakeChild(codes[len(spawned) - 1], child_wait)

    def preflight():
        go = asks.pop(0) if asks else True
        return (200, 'none', True) if go is True else (200, go if isinstance(go, str) else 'paused', False)

    cmd = ['xvfb-run', 'python', 'main.py', '--remote', '--deadline', '1']
    sup = restart.Supervisor(cmd, deadline or clock() + 3600 * 5, spawn=spawn, preflight=preflight, clock=clock,
                             sleep=clock.advance, public=lambda ev, **f: lines.append(logs.format_public(ev, f)[0]),
                             env={'X': '1'}, reported_file=marker)
    return sup, spawned, lines


def test_restart_crashes_with_cap_and_backoff():
    """A crash (any exit but 0 and 2) is restarted, the same command (so the same deadline), ITS_RESTART=n; at most
    RESTARTS, each after its backoff, with a preflight before it and every minute of it; then the last code."""
    clock = Clock()
    t0 = clock()
    starts = []
    sup, spawned, lines = _supervisor([1] * 7, clock, on_wait=lambda c: starts.append(clock() - t0))
    code = sup.run()
    check('restart: the cap: 1 + RESTARTS processes, then the crash\'s code', code == 1 and len(spawned) == 6, str(spawned))
    check('restart: the same command each time, ITS_RESTART counting',
          all(c == spawned[0][0] for c, _ in spawned) and [n for _, n in spawned] == [None, '1', '2', '3', '4', '5'])
    gaps = [b - a for a, b in zip(starts, starts[1:])]
    check('restart: backoff 15, 30, 60, 120, 300 s', gaps == [15, 30, 60, 120, 300], str(gaps))
    check('restart: public lines are codes and counts', lines[0] == 'its restart exit=1 n=1 secs=15'
          and lines[-1] == 'its restart exit=1 n=5 ok=0 why=cap' and not any('dropped' in ln for ln in lines), str(lines))
    for code in (-9, 137, 3):
        sup, spawned, _ = _supervisor([code, 0], Clock())
        check(f'restart: exit {code} (a kill, an OOM) restarted; then a clean end', sup.run() == 0 and len(spawned) == 2)


def test_restart_only_a_process_that_got_going():
    """A startup crash (no answered report, under MIN_RUN_SEC) is not restarted: it would crash again, a solve each
    time; one that ran MIN_RUN_SEC is, report or not. The first wait is at least the site's 15-s floor."""
    sup, spawned, lines = _supervisor([1, 0], Clock(), reported=False)
    check('restart: a startup crash is not restarted', sup.run() == 1 and len(spawned) == 1
          and lines[-1] == 'its restart exit=1 n=0 ok=0 why=startup', str(lines))
    clock = Clock()
    sup, spawned, _ = _supervisor([1, 0], clock, reported=False, on_wait=lambda c: clock.advance(restart.MIN_RUN_SEC))
    check('restart: one that ran MIN_RUN_SEC is', sup.run() == 0 and len(spawned) == 2)
    sup, spawned, _ = _supervisor([1, 1, 0], Clock())
    seen, inner = [], sup.spawn
    sup.spawn = lambda cmd, env: (seen.append(os.path.exists(sup.reported_file)), inner(cmd, env))[1]
    check('restart: the marker is removed before each start (each process must report again)',
          sup.run() == 0 and seen == [False, False, False], str(seen))
    check('restart: the first wait is at least the scan floor', min(restart.BACKOFF_SEC) >= bh.MIN_RETRY_DELAY
          and restart.SCAN_FLOOR_SEC == bh.MIN_RETRY_DELAY)
    holder = {}
    clock = Clock()
    sup, spawned, lines = _supervisor([1], clock)
    real_spawn = sup.spawn

    def racing_spawn(cmd, env):
        child = real_spawn(cmd, env)
        sup.on_signal(15)   # the signal lands while the child starts, before run() has it as self.child
        holder['child'] = child
        return child
    sup.spawn = racing_spawn
    check('restart: a signal during the start reaches the child (once at least), no restart',
          sup.run() == 1 and holder['child'].signals[:1] == [15] and len(spawned) == 1, str(holder['child'].signals))


def test_restart_never_after_a_clean_end_a_stop_or_the_deadline():
    for code in (0, 2):
        sup, spawned, lines = _supervisor([code, 0], Clock())
        check(f'restart: exit {code} is never restarted', sup.run() == code and len(spawned) == 1, str(lines))
    sup, spawned, lines = _supervisor([1, 0], Clock(), runs=[False])
    check('restart: a stop (the preflight says not to run) before the backoff: none', sup.run() == 1 and len(spawned) == 1
          and lines[-1] == 'its restart exit=1 n=1 ok=0 status=200 why=paused', str(lines))
    clock = Clock()
    T_, F_ = True, False
    sup, spawned, lines = _supervisor([1] * 5 + [0], clock, runs=[T_, T_, T_, T_, T_, T_, T_, T_, T_, T_, F_])
    t0 = clock()
    check('restart: a 停止 during a backoff ends it at that minute\'s preflight (60 s into the 300)', sup.run() == 1
          and len(spawned) == 5 and clock() - t0 == 15 + 30 + 60 + 120 + 60, f'{len(spawned)} {clock() - t0}')
    clock = Clock()
    sup, spawned, lines = _supervisor([1, 1], clock, deadline=clock() + restart.MIN_LEFT_SEC + 20)
    check('restart: none whose backoff ends within MIN_LEFT_SEC of the deadline', sup.run() == 1 and len(spawned) == 2
          and lines[-1] == 'its restart exit=1 n=1 ok=0 why=deadline', str(lines))
    clock = Clock()
    holder = {}
    sup, spawned, lines = _supervisor([1, 1], clock, on_wait=lambda c: holder['sup'].on_signal(15))
    holder['sup'] = sup
    check('restart: the step cancelled (SIGTERM passed on): no restart', sup.run() == 1 and len(spawned) == 1
          and lines[-1] == 'its restart exit=1 n=0 ok=0 why=signal', str(lines))
    sup, spawned, lines = _supervisor([1, 1, 0], Clock(), runs=[True, True, 'restart_cap'])
    check('restart: the day\'s restarts spent (the Worker\'s restart_cap): none', sup.run() == 1 and len(spawned) == 2
          and lines[-1] == 'its restart exit=1 n=2 ok=0 status=200 why=restart_cap', str(lines))
    with contextlib.redirect_stderr(io.StringIO()):
        refused = (restart.main(['100', 'python', 'main.py', '--remote', '--deadline', '200']),
                   restart.main(['100', 'python', 'main.py', '--remote']))
    check('restart: the CLI refuses a command whose deadline differs from its own (never extended)', refused == (2, 2))


def test_restart_for_real(tmpdir):
    """restart.Supervisor with its real spawn and preflight: a child that crashes once is started again with
    ITS_RESTART=1 after the Worker (a fake, over HTTP) said run."""
    model = WorkerModel()
    srv = serve_model(model)
    marks = os.path.join(tmpdir, 'starts')
    marker = os.path.join(tmpdir, 'reported')
    leftover = os.path.join(tmpdir, 'leftover')
    child = ('import os, subprocess, sys\n'
             f'open({marks!r}, "a").write((os.environ.get("ITS_RESTART") or "-") + "\\n")\n'
             f'open({marker!r}, "w").close()\n'
             f'first = len(open({marks!r}).read().split()) == 1\n'
             f'if first: open({leftover!r}, "w").write(str(subprocess.Popen(["sleep", "60"]).pid))\n'
             'sys.exit(1 if first else 0)\n')
    saved_env, saved_backoff = dict(os.environ), restart.BACKOFF_SEC
    try:
        os.environ.update(ITS_WORKER_URL=f'http://127.0.0.1:{srv.server_port}', ITS_RUNNER_TOKEN=TOKEN)
        for k in ('HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy'):
            os.environ.pop(k, None)
        restart.BACKOFF_SEC = (0,) * restart.RESTARTS
        lines = []
        sup = restart.Supervisor([sys.executable, '-c', child, '--deadline', '1'], time.time() + 3600,
                                 public=lambda ev, **f: lines.append(logs.format_public(ev, f)[0]), reported_file=marker)
        code = sup.run()
    finally:
        os.environ.clear()
        os.environ.update(saved_env)
        restart.BACKOFF_SEC = saved_backoff
        srv.shutdown()
    check('restart (real): crashed once, restarted with ITS_RESTART=1, then a clean end',
          code == 0 and open(marks).read().split() == ['-', '1'], open(marks).read())
    pid = int(open(leftover).read())

    def gone():
        try:
            os.kill(pid, 0)
            return False
        except ProcessLookupError:
            return True
    check('restart (real): the crashed child\'s group killed before the restart (no leftover of the run)',
          T._wait_for(gone, timeout=5))
    check('restart (real): the Worker was asked first (a preflight: no run id)',
          ('GET', '/runner/config', {}) in model.calls, str(model.calls))
    check('restart (real): its public lines', lines == ['its restart exit=1 n=1 secs=0', 'its restart exit=0 n=1 ok=0 why=clean'],
          str(lines))


def test_a_restarted_process_is_the_same_run():
    """The process restarted in its job: the same run id re-claims its own lease (no takeover), its seq goes on past
    the record's (so its events aren't dropped as acknowledged and its entry ids don't conflict), the dead process's
    open confirming blocks the night, its holds with no outcome get a human_needed run_ended."""
    clock = Clock()
    model = WorkerModel(clock)
    first = make_remote(model, clock, run_id='55-1', seed_hold=lambda *a: None)
    first.claim(wait=0)
    first.event('run_start', detail='schedule')
    first.on_event('hold', {'date': TARGET, 'hotel': NAGU})
    first.on_event('hold', {'date': NEXT_MONTH_DAY, 'hotel': RESOL})
    first.record('confirming', NEXT_MONTH_DAY, RESOL)
    first.report()
    acked = first.seq
    first.event('error', detail='x')   # queued, never sent: the process dies
    clock.advance(40)
    second = make_remote(model, clock, run_id='55-1', seed_hold=lambda *a: None)
    cfg, why = second.claim(wait=0)
    check('restart: the same run re-claims its own live lease', cfg is not None and model.lease['holder'] == '55-1', why)
    check('restart: seq goes on from the record\'s', second.seq == acked, f'{second.seq} vs {acked}')
    second.event('run_start', detail='restart')
    n = second.orphaned_holds(cfg)
    second.on_event('hold', {'date': IDLE_DAY, 'hotel': NIKKO})
    second.report()
    check('restart: its events land (none dropped as acknowledged)',
          [e['detail'] for e in model.kinds('run_start')] == ['schedule', 'restart'], str(model.kinds('run_start')))
    check('restart: its entries land (no id conflict)', not second.unsynced and not second.conflicts
          and len(model.booked('hold')) == 3, str(second.unsynced))
    check('restart: the dead process\'s open confirming blocks its night', NEXT_MONTH_DAY in second.done)
    check('restart: the dead process\'s holds with no outcome: human_needed run_ended, once each',
          n == 2 and sorted((e['date'], e['detail']) for e in model.kinds('human_needed'))
          == sorted([(TARGET, 'run_ended'), (NEXT_MONTH_DAY, 'run_ended')]), str(model.kinds('human_needed')))
    clock.advance(remote.HOLD_SEC)
    third = make_remote(model, clock, run_id='55-1', seed_hold=lambda *a: None)
    cfg, _ = third.claim(wait=0)
    check('restart: a hold older than HOLD_SEC has lapsed: nothing to tell', third.orphaned_holds(cfg) == 0)


def test_signal_drains_as_a_stop(tmpdir):
    """SIGTERM/SIGINT (a cancel, a timeout; restart.py passes it on): no new hold at once, run_end within
    SIGNAL_DRAIN_SEC, the lease released, exit 0; twice (the group's and the forwarded one) is one stop. The first
    answered report touches the restart marker."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, run_id='77-1', seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    marker = os.path.join(tmpdir, 'reported')
    run = M.RemoteRun(rem, sup, deadline=clock() + 3600, clock=clock, reported_file=marker)
    try:
        sup.start()
        check('signal: running before', run.tick() is None and not run.draining)
        check('signal: the first answered report touches the marker', os.path.exists(marker))
        run.on_signal(signal.SIGINT)
        run.on_signal(signal.SIGTERM)
        check('signal: idempotent (the first kept), the loop woken', run.signalled == signal.SIGINT and rem.urgent.is_set())
        sup.busy = lambda: 1   # a leg in flight: waited for SIGNAL_DRAIN_SEC at most
        check('signal: a stop\'s drain, no new hold at once', run.tick() is None and run.draining
              and run.end_detail == 'signal' and rem.hold_gate() == (False, 'signal'), str(rem.hold_gate()))
        clock.advance(M.SIGNAL_DRAIN_SEC)
        out = run.tick()
    finally:
        _cleanup(sup)
    check('signal: run_end within SIGNAL_DRAIN_SEC, the lease released', out == 'signal'
          and [e.get('detail') for e in model.kinds('run_end')] == ['signal'] and model.lease is None,
          f"{out} {model.kinds('run_end')} {model.lease}")


def test_orphaned_holds_told_once_per_job(tmpdir):
    """A second restart doesn't tell the same orphaned hold again (the ids told are kept in the state dir)."""
    clock = Clock()
    model = WorkerModel(clock)
    path = os.path.join(tmpdir, 'orphans.json')
    first = make_remote(model, clock, run_id='56-1', seed_hold=lambda *a: None)
    first.claim(wait=0)
    first.on_event('hold', {'date': TARGET, 'hotel': NAGU})
    first.report()
    told = []
    for _ in range(2):
        clock.advance(60)
        again = make_remote(model, clock, run_id='56-1', seed_hold=lambda *a: None, orphans_path=path)
        cfg, _w = again.claim(wait=0)
        told.append(again.orphaned_holds(cfg))
        again.report()
    check('orphans: told by the first restart only', told == [1, 0] and len(model.kinds('human_needed')) == 1, str(told))
    # an event the Worker never acked isn't kept as told: the next restart tells it again
    clock.advance(60)
    path2 = os.path.join(tmpdir, 'orphans2.json')
    lost = make_remote(model, clock, run_id='56-1', seed_hold=lambda *a: None, orphans_path=path2)
    cfg, _w = lost.claim(wait=0)
    model.down = True
    n_lost = lost.orphaned_holds(cfg)
    lost.report()
    model.down = False
    after = make_remote(model, clock, run_id='56-1', seed_hold=lambda *a: None, orphans_path=path2)
    cfg, _w = after.claim(wait=0)
    check('orphans: kept as told only once acked', n_lost == 1 and not os.path.exists(path2)
          and after.orphaned_holds(cfg) == 1)


def test_preflight_restart_cap():
    """The Worker's restartsLeft 0 (the Tokyo day's in-job restarts spent): the preflight says run=0, restart_cap
    (no restart, no new run, no handoff); absent (an older Worker) or left: as before."""
    model = WorkerModel()
    client = ModelClient(model)
    check('preflight: no restartsLeft (an older Worker): run', remote.preflight(client) == (200, 'none', True))
    model.restarts_left = 3
    check('preflight: some left: run', remote.preflight(client) == (200, 'none', True))
    model.restarts_left = 0
    check('preflight: none left: restart_cap, run=0', remote.preflight(client) == (200, 'restart_cap', False))
    model.settings['paused'] = True
    check('preflight: a stop still says why', remote.preflight(client) == (200, 'paused', False))

def test_signal_stop_is_bounded_on_a_slow_worker():
    """The signal's stop takes SIGNAL_TOTAL_SEC at most when the Worker answers slowly (or not at all): every call cut
    to what's left, run_end best effort (the lease lapses otherwise)."""
    model = WorkerModel()
    srv = serve_model(model)
    try:
        rem = remote.Remote(remote.Client(f'http://127.0.0.1:{srv.server_port}', TOKEN), '78-1', 'actions')
        rem.claim(wait=0)
        sup = idle_supervisor()
        run = M.RemoteRun(rem, sup, deadline=time.time() + 3600)
        run.raise_on_signal = True
        model.delay = 30
        raised = False
        try:
            run.on_signal(signal.SIGTERM)
        except M.SignalStop:
            raised = True
        run.on_signal(signal.SIGINT)   # the second delivery: nothing (no raise)
        check('signal: SignalStop at once, no new hold or 申込する', raised and rem.hold_gate() == (False, 'signal')
              and rem.commit_gate(TARGET, NAGU, 'apply') == (False, 'run_ended'))
        t0 = time.monotonic()
        out = run.stop_on_signal()
        took = time.monotonic() - t0
    finally:
        model.delay = 0
        _cleanup(sup)
        srv.shutdown()
    check('signal: stopped within SIGNAL_TOTAL_SEC on a slow Worker', out == 'signal' and took <= M.SIGNAL_TOTAL_SEC + 0.5,
          f'{out} {took:.1f}s')


def test_commit_refused_once_stopping():
    """Once a stop or a signal is set no new `confirming` (and so no Chrome 申込する) starts; the deadline's drain still
    files what it holds; the 確認 stage of a leg already applying goes on."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    rem.no_new_holds = 'time_up'
    check('commit: the deadline\'s drain still applies', rem.commit_gate(TARGET, NAGU, 'apply') == (True, ''))
    for why in ('paused', 'signal', 'lease_lost'):
        rem.no_new_holds = why
        n = len(model.booked('confirming'))
        check(f'commit: {why}: no new 申込する, no confirming written',
              rem.commit_gate(TARGET, RESOL, 'apply') == (False, 'run_ended') and len(model.booked('confirming')) == n)
    check('commit: a leg past 申込する still confirms', rem.commit_gate(TARGET, NAGU, 'confirm') == (True, ''))


FAKE_XVFB = """#!/bin/sh
# like xvfb-run: a shell that runs the command in the foreground and passes no signal on
"$@"
"""


def test_signal_reaches_main_through_bash_and_a_wrapper(tmpdir):
    """The Run step for real: bash execs restart.py, which runs a shell wrapper (xvfb-run's stand-in) around the real
    `main.py --remote`; GitHub's SIGINT to the step's process reaches main.py (restart.py signals the child's process
    group), which drains and reports run_end (the lease released) before GitHub's kill (~10 s)."""
    model = WorkerModel()
    srv = serve_model(model)
    fake = os.path.join(tmpdir, 'fake-xvfb')
    with open(fake, 'w') as f:
        f.write(FAKE_XVFB)
    os.chmod(fake, 0o755)
    deadline = str(int(time.time()) + 3600)
    env = {'PATH': os.environ.get('PATH', ''), 'HOME': tmpdir, 'NO_PROXY': '127.0.0.1,localhost',
           'no_proxy': '127.0.0.1,localhost', 'PYTHONDONTWRITEBYTECODE': '1',
           'ITS_STATE_DIR': os.path.join(tmpdir, 'state'), 'ITS_BASE_URL': 'http://127.0.0.1:9',
           'ITS_WORKER_URL': f'http://127.0.0.1:{srv.server_port}', 'ITS_RUNNER_TOKEN': TOKEN,
           'GITHUB_ACTIONS': 'true', 'GITHUB_RUN_ID': '4343', 'GITHUB_RUN_ATTEMPT': '1'}
    script = (f'exec {sys.executable} restart.py "{deadline}" {fake} {sys.executable} test_remote.py --signal-child '
              f'--deadline "{deadline}"')
    proc = subprocess.Popen(['bash', '-c', script], cwd=HERE, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        up = T._wait_for(lambda: any(r['runId'] == '4343-1' for r in model.reports), timeout=30)
        log_path = os.path.join(tmpdir, 'state', 'its_booking.log')
        check('signal (real): main.py up and reporting under restart.py', up,
              open(log_path).read()[-1500:] if not up and os.path.exists(log_path) else '')
        t0 = time.monotonic()
        proc.send_signal(signal.SIGINT)
        out, err = proc.communicate(timeout=20)
        took = time.monotonic() - t0
    except subprocess.TimeoutExpired:
        proc.kill()
        out, err = proc.communicate()
        took = 99
    finally:
        srv.shutdown()
    ends = [e.get('detail') for e in model.kinds('run_end')]
    check('signal (real): main.py drained: run_end signal, the lease released, within GitHub\'s 10 s',
          ends == ['signal'] and model.lease is None and took < 10, f'{ends} {model.lease} {took:.1f}s')
    public = out.decode('utf-8', 'replace')
    check('signal (real): restarted nothing', public.count('its start ') == 1 and 'secs=' not in public, public[-500:])


def signal_child_main(argv):
    """The subprocess of test_signal_reaches_main_through_bash_and_a_wrapper: the real main.main, nothing scanned."""
    real = M.Supervisor
    M.Supervisor = lambda: real(scan_target=_idle, url_target=_idle, confirm_target=_idle)
    remote.REPORT_EVERY_SEC = 0.3
    return M.main(argv)

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
    scan_keys = set().union(*(set(e) for e in want['scansLog']))
    check('contract: scansLog entries are ScanEntry', rep['scansLog'] and all(
        {'t', 'ok', 'ms', 'avail'} <= set(e) <= scan_keys for e in rep['scansLog']), str(rep['scansLog']))
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


def test_contract_limits_parity():
    """remote.py's copy of the contract's LIMITS, MAX_SITE_NAME, LEASE_SEC, REPORT_EVERY_SEC, the arrays and lastSpot's
    values, read out of app/src/lib/its/contract.ts."""
    import re
    import chrome
    path = os.path.join(os.path.dirname(ITS_DIR), 'app', 'src', 'lib', 'its', 'contract.ts')
    with open(path, encoding='utf-8') as f:
        ts = f.read()

    def num(expr):   # `64 * 1024`, `300`, `15_000`
        out = 1
        for part in expr.replace('_', '').split('*'):
            out *= int(part)
        return out

    def const(name):
        m = re.search(rf'export const {name} = ([0-9_ *]+);', ts)
        return num(m.group(1)) if m else None
    m = re.search(r'export const LIMITS = \{([^}]*)\}', ts)
    limits = {k: num(v) for k, v in re.findall(r'(\w+): ([0-9_ *]+)', m.group(1))} if m else None
    check('limits parity: LIMITS', limits == remote.LIMITS, f'{limits} vs {remote.LIMITS}')
    for name, mine in (('MAX_SITE_NAME', remote.SITE_NAME_MAX), ('LEASE_SEC', remote.LEASE_SEC),
                       ('REPORT_EVERY_SEC', remote.REPORT_EVERY_SEC), ('GUESTS_MIN', remote.GUESTS_MIN),
                       ('GUESTS_MAX', remote.GUESTS_MAX),
                       ('AUTO_CONFIRM_MIN_DAYS', bh.AUTO_CONFIRM_MIN_DAYS), ('HOLD_SEC', remote.HOLD_SEC),
                       ('SCANS_PER_REPORT', remote.SCANS_PER_REPORT)):
        check(f'limits parity: {name}', const(name) == mine, f'{const(name)} vs {mine}')

    def strings(name):   # `export const X: readonly T[] = ['a', 'b'];` or `[...] as const;`
        m = re.search(rf'export const {name}\b[^=]*= \[([^\]]*)\]', ts)
        return tuple(re.findall(r"'([^']*)'", m.group(1))) if m else None
    m = re.search(r'export const INTERVALS_SEC = \[([^\]]*)\]', ts)
    check('arrays parity: INTERVALS_SEC', m and tuple(int(x) for x in m.group(1).split(',')) == remote.INTERVALS_SEC,
          m and m.group(1))
    check('arrays parity: the interval floor is the scan\'s', remote.INTERVAL_FLOOR_SEC == bh.MIN_RETRY_DELAY
          == min(remote.INTERVALS_SEC))
    for name, mine in (('BOOKING_KINDS', remote.BOOKING_KINDS), ('EVENT_KINDS', remote.EVENT_KINDS),
                       ('IMPORTANT_EVENTS', remote.IMPORTANT_EVENTS), ('PHASES', remote.PHASES),
                       ('HOSTS', remote.HOSTS)):
        check(f'arrays parity: {name}', strings(name) == mine, f'{strings(name)} vs {mine}')
    check('arrays parity: the runner sends only kinds the contract has, never the Worker\'s own',
          set(remote.SENT_EVENT_KINDS) <= set(remote.EVENT_KINDS) and 'prev_unclean' not in remote.SENT_EVENT_KINDS)
    m = re.search(r"stopReason: ((?:'[a-z_]+' \| )+)null;", ts)
    check('arrays parity: stopReason', m and tuple(re.findall(r"'([a-z_]+)'", m.group(1))) == remote.STOP_REASONS,
          m and m.group(1))
    m = re.search(r"lastSpot: ((?:'[a-z_]+' \| )+)null", ts)
    spots = {chrome._checkbox_spot({'x': 0, 'y': 0, 'width': 960, 'height': 65}, a)[2] for a in (1, 2)}
    check('arrays parity: lastSpot, and chrome clicks only those spots',
          m and tuple(re.findall(r"'([a-z_]+)'", m.group(1))) == remote.SPOTS and spots == set(remote.SPOTS),
          f'{m and m.group(1)} vs {remote.SPOTS}, {spots}')
    m = re.search(r'const ID_RE = /\^(.*)\$/;', ts)
    check('arrays parity: ID_RE', m and m.group(1) + r'\Z' == remote._ID_RE.pattern, f'{m and m.group(1)} vs '
          f'{remote._ID_RE.pattern}')
    m = re.search(r'const BAD_CHARS = /(.*)/;', ts)
    js = re.compile(re.sub(r'\\u([0-9a-fA-F]{4})', lambda u: re.escape(chr(int(u.group(1), 16))), m.group(1))) \
        if m else None
    differ = [hex(c) for c in range(0x10000) if js and bool(js.match(chr(c))) != bool(remote._BAD_CHARS.match(chr(c)))]
    check('arrays parity: BAD_CHARS (every BMP code point)', js is not None and differ == [], str(differ[:5]))
    check('limits parity: what we send fits', remote.BODY_MAX < remote.LIMITS['body']
          and remote.EVENTS_PER_REPORT <= remote.LIMITS['eventsPerReport']
          and remote.OFFERED_MAX <= remote.LIMITS['eventHotel'])


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
    clock.advance(FENCE_AT + 1)
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
    """The gate is asked before a hotel's steps 3-6: closed, nothing is held and no step of the chain is sent (only the
    date's session and hotel list, which the booking thread opened before it)."""
    with T.Env(port), T.CapturedLog() as log:
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        clock.advance(FENCE_AT + 5)
        with Hooks(rem):
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('gate-flow: nothing held', booked == [], str(booked))
        check('gate-flow: no step 3-7 sent', all(STATE.count(p) == 0 for p in (
            'apply_service_select', 'check_apply_service_coma', 'empty_new', 'empty_create')), str(STATE.hits))
        check('gate-flow: one hotel list, no retry', STATE.count('service_group_select') == 1, str(STATE.hits))
        check('gate-flow: said why', log.saw('Not applying for') and log.saw('lease_stale'))
        check('gate-flow: counted once', rem.counts['gate_closed'] == 1, str(rem.counts))

    # Opened while steps 3-6 run, closed by step 7: still refused at the hold itself.
    with T.Env(port), T.CapturedLog() as log:
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        STATE.hotels = [(7, NAGU)]
        STATE.hooks['POST /apply/empty_new'] = lambda: clock.advance(FENCE_AT + 5)
        with Hooks(rem):
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('gate-flow: a gate closing mid-chain refuses step 7', booked == [] and STATE.count('empty_create') == 0)
        check('gate-flow: said so at the hold', log.saw('Not taking a hold'))


def test_closed_gate_sends_no_booking_requests(port):
    """R3: a closed gate in the scan loop spawns no booking thread: every cycle is the scan's own request, never
    steps 1-6 per hotel and date (that rate is how the IP gets banned)."""
    with T.Env(port):
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        clock.advance(FENCE_AT + 5)   # the lease stale: the gate closed
        bh.TARGET_DATES = [TARGET, TARGET_LIMITED]
        stop = threading.Event()
        with Hooks(rem):
            t = threading.Thread(target=bh.scan_and_book_month, args=(T.MONTH, M._month_dates(T.MONTH), 'GATE'),
                                 kwargs={'stop_event': stop}, daemon=True)
            t.start()
            try:
                T._wait_for(lambda: STATE.count('POST /calendar_apply/calendar_select') >= 4)
            finally:
                stop.set()
                t.join(10)
        navs = STATE.count('POST /calendar_apply/calendar_select')
        others = [h for h in STATE.hits if 'calendar_select' not in h]
        check('storm: cycles ran, the dates were seen available', navs >= 4 and rem.available_now == 2, str(navs))
        check('storm: no booking request at all while closed', others == [], str(others[:5]))
        check('storm: the refusals counted per cycle', rem.counts['gate_closed'] >= 3, str(rem.counts))


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
                      and [e['detail'] for e in model.kinds('human_needed')] == ['confirming_unacked'],
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


def test_report_fits_the_workers_limits():
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    for i in range(300):
        rem.on_event('offered', {'date': TARGET, 'names': [f'施設{i}-{j}' * 4 for j in range(30)], 'eligible': [1]})
    rem.error('step with spaces', 'x', 'Not An Id!')
    for i in range(40):
        rem.error(f'step{i}', 503, 'http_503')
    rep = rem._fit(rem.build_report())
    size = len(json.dumps(rep, ensure_ascii=False).encode())
    check('limits: the report is under the body cap', size <= remote.BODY_MAX, str(size))
    check('limits: events wait rather than overflow', 0 < len(rep['events']) <= remote.EVENTS_PER_REPORT)
    check('limits: an offered list is capped', all(len(e.get('hotel', '')) <= remote.OFFERED_MAX for e in rep['events']))
    check('limits: steps capped, odd ones renamed', len(rep['failuresByStep']) <= remote.STEPS_MAX
          and 'unknown' in rep['failuresByStep'] and 'other' in rep['failuresByStep'], str(len(rep['failuresByStep'])))
    check('limits: a bad status is null', rem.last_by_step['unknown'] == (None, 'error'), str(rem.last_by_step['unknown']))
    check('limits: the Worker took it', rem.report() is not None and len(model.reports) == 1)
    long_name = 'ホテル' * 50   # 150 characters: over MAX_NAME, within a booking's 200
    bid = rem.record('hold', TARGET, long_name + '\u202e', number='9' * 99)
    b = rem.unsynced[bid]
    check('limits: a booking hotel is never cut to MAX_NAME (C4)', b['hotel'] == long_name, str(len(b['hotel'])))
    check('limits: a booking number capped', len(b['number']) == 40)
    check('limits: only past the contract\'s 200', len(rem.unsynced[rem.record('hold', TARGET, 'X' * 300)]['hotel'])
          == remote.SITE_NAME_MAX)
    fresh = make_remote(model, clock, run_id='run-seen', seed_hold=lambda *a: None)
    fresh.on_event('offered', {'date': TARGET_LIMITED, 'names': [long_name], 'eligible': []})
    check('limits: a seen name is never cut either', fresh.seen == {long_name}, str(fresh.seen))
    rem.on_event('hold', {'date': TARGET, 'hotel': long_name})
    rem.post_bookings()
    check('limits: the full name reaches the record', [x['hotel'] for x in model.booked('hold')][-1:] == [long_name])


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


def test_run_id_is_per_attempt():
    """R1: a re-run (same GITHUB_RUN_ID, the next attempt) is a different run: its booking ids and event seqs can't be
    taken for the first attempt's."""
    env = {'GITHUB_ACTIONS': 'true', 'GITHUB_RUN_ID': '424242', 'GITHUB_RUN_ATTEMPT': '2',
           'GITHUB_REPOSITORY': 'huangwaylon/fitness'}
    rid, url, host = M.run_identity(env)
    check('run id: id-attempt', rid == '424242-2' and host == 'actions', rid)
    check('run id: the link is the attempt', url == 'https://github.com/huangwaylon/fitness/actions/runs/424242/attempts/2',
          str(url))
    check('run id: attempt 1 by default', M.run_identity(dict(env, GITHUB_RUN_ATTEMPT=''))[0] == '424242-1')
    check('run id: a run id that is not a number is not used',
          M.run_identity(dict(env, GITHUB_RUN_ID='x y'), clock=lambda: 7)[0] == 'local-7')
    check('run id: local', M.run_identity({}, clock=lambda: 5) == ('local-5', None, 'local'))

    clock = Clock()
    model = WorkerModel(clock)
    first = make_remote(model, clock, run_id='424242-1', seed_hold=lambda *a: None)
    first.claim(wait=0)
    first.on_event('hold', {'date': TARGET, 'hotel': NAGU})
    first.event('run_end', detail='time_up')
    first.report()
    again = make_remote(model, clock, run_id=rid, seed_hold=lambda *a: None)
    again.claim(wait=0)
    again.on_event('hold', {'date': TARGET, 'hotel': RESOL})
    again.report()
    check('run id: the re-run\'s hold is recorded, not dropped as a duplicate',
          [b['hotel'] for b in model.booked('hold')] == [NAGU, RESOL], str(model.bookings))
    check('run id: and its events too', [e['hotel'] for e in model.kinds('hold')] == [NAGU, RESOL])


def test_fence_reads_the_lease_itself():
    """R2: the fence is `now < lease.until − 60`; only a claim or a report answer extends it, a /runner/bookings
    answer never reopens it."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    clock.advance(FENCE_AT - 1)
    check('fence2: open until 60 s before the lease ends', rem.lease_fresh())
    clock.advance(2)
    check('fence2: closed at until − 60', not rem.lease_fresh() and rem.hold_gate() == (False, 'lease_stale'))
    # The Worker says the lease is ours and long (as if renewed): a bookings answer still doesn't reopen the fence.
    model.lease = dict(model.lease, until=model.ms() + 3_600_000)
    rem.on_event('hold', {'date': TARGET, 'hotel': NAGU})
    check('fence2: the bookings answer arrived', rem.post_bookings() and rem.unsynced == {})
    check('fence2: and the fence stays closed', rem.hold_gate() == (False, 'lease_stale'), str(rem.hold_gate()))
    rem.report()
    check('fence2: a report answer renews it', rem.hold_gate() == (True, ''), str(rem.hold_gate()))
    check('fence2: to the lease\'s own end', abs(rem.lease_until - model.lease['until'] / 1000) < 1e-6)
    model.lease = {'holder': 'other', 'host': 'actions', 'until': model.ms() + 600_000}
    rem.on_event('hold', {'date': TARGET, 'hotel': RESOL})
    rem.post_bookings()
    check('fence2: a bookings answer naming another holder closes it', rem.hold_gate() == (False, 'lease_stale'))


def test_hold_gate_checks_the_deadline():
    """R14: past the deadline the gate refuses by itself, without waiting for the control loop's tick."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, deadline=clock() + 100, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    check('deadline: open before it', rem.hold_gate() == (True, ''))
    clock.advance(100)
    check('deadline: refused at it, no tick needed', rem.hold_gate() == (False, 'time_up'), str(rem.hold_gate()))


def test_settings_are_applied_newest_first():
    """R7: two threads' answers can cross; an older answer's settings never replace newer ones."""
    clock = Clock()
    model = WorkerModel(clock)
    applied = []
    rem = make_remote(model, clock, on_settings=lambda s: applied.append(s['updatedAt']), seed_hold=lambda *a: None)
    rem.claim(wait=0)
    old = model.config(rem.run_id)
    model.settings.update(dates=[TARGET, TARGET_LIMITED], updatedAt=2)
    new = model.config(rem.run_id)
    rem.absorb(new)
    rem.absorb(old)
    check('order: the older answer after the newer is ignored', applied == [1, 2] and rem.settings['updatedAt'] == 2,
          str(applied))
    model.settings.update(paused=True)
    rem.absorb(model.config(rem.run_id))
    check('order: same stamp (paused moved): no reapply needed but no harm', rem.settings['updatedAt'] == 2)

    # Interleaved: the slow on_settings of an older answer can't land after a newer one.
    gate = threading.Event()
    seen = []

    def slow(s):
        if s['updatedAt'] == 3:
            gate.wait(5)
        seen.append(s['updatedAt'])
    rem2 = make_remote(model, clock, run_id='run-x', on_settings=slow, seed_hold=lambda *a: None)
    model.settings.update(updatedAt=3)
    c3 = model.config('run-x')
    model.settings.update(updatedAt=4)
    c4 = model.config('run-x')
    t = threading.Thread(target=rem2.absorb, args=(c3,))
    t.start()
    t2 = threading.Thread(target=rem2.absorb, args=(c4,))
    t2.start()
    gate.set()
    t.join(5)
    t2.join(5)
    check('order: under the lock, the newest is applied last', seen[-1] == 4 and rem2.settings['updatedAt'] == 4,
          str(seen))


def test_id_conflict_is_a_bug_not_an_ack(port):
    """W1: the Worker refuses a post whole when an id it has comes with other content (409 id_conflict). Never an ack:
    kept queued and retried alone, HUMAN NEEDED and one human_needed event; the rest of the batch still lands; a
    `confirming` refused that way never reaches Chrome."""
    with T.Env(port, confirm=True, applicant=dict(T.APPLICANT_FIXTURE)), T.CapturedLog() as log:
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock, run_id='run-c', log=bh.log)
        rem.claim(wait=0)
        # The record already has run-c:2 (a different stay): the next entries collide with it.
        model.bookings.append({'id': 'run-c:2', 'kind': 'hold', 'date': TARGET_LIMITED, 'hotel': NIKKO,
                               'runId': 'run-c', 'at': 1})
        rem.seeded.add('run-c:2')
        rem.record('hold', TARGET, NAGU)       # run-c:1
        rem.seq = 1
        rem.record('hold', TARGET, RESOL)      # run-c:2: the record has another stay under it
        rem.record('hold', TARGET, NIKKO)      # run-c:3
        rem.post_bookings()
        ids = [b['id'] for b in model.bookings]
        check('conflict: the batch was split: the good entries landed', ids == ['run-c:2', 'run-c:1', 'run-c:3'],
              str(ids))
        check('conflict: the conflicting one still queued, not acked', rem.conflicts == {'run-c:2'}
              and list(rem.unsynced) == ['run-c:2'], f'{rem.conflicts} {rem.unsynced}')
        check('conflict: HUMAN NEEDED in the log', log.saw('HUMAN NEEDED') and log.saw('id conflict'))
        rem.report()
        check('conflict: a human_needed event', [e.get('detail') for e in model.kinds('human_needed')] == ['id_conflict'],
              str(model.kinds('human_needed')))
        check('conflict: counted as unsynced in the report', model.reports[-1]['unsynced'] == 1)
        posts = lambda: len([c for c in model.calls if c[1] == '/runner/bookings'])
        check('conflict: the batch, then each alone; with the report, the conflict alone again', posts() == 5,
              str(posts()))
        rem.report()
        check('conflict: told once', len(model.kinds('human_needed')) == 1 and rem.counts['human_needed'] == 1)
        check('conflict: never in the record as ours', all(b['hotel'] != RESOL for b in model.bookings))
        # A person fixes the record: the retry lands and is acknowledged.
        model.bookings = [b for b in model.bookings if b['id'] != 'run-c:2']
        rem.report()
        check('conflict: the record fixed: acknowledged', rem.unsynced == {} and rem.conflicts == set()
              and any(b['hotel'] == RESOL for b in model.bookings), f'{rem.unsynced} {rem.conflicts}')

        # A `confirming` whose id collides: the commit gate must not take it for an ack.
        rem.seq = 9
        model.bookings.append({'id': 'run-c:10', 'kind': 'hold', 'date': TARGET_LIMITED, 'hotel': NIKKO,
                               'runId': 'run-c', 'at': 1})
        rem.seeded.add('run-c:10')
        check('conflict: the commit gate refuses', rem.commit_gate(TARGET, NAGU, 'apply') == (False, 'confirming_unacked'))

    # An old Worker answering 200 and ignoring the id: the record's entry differs, so still no ack.
    clock = Clock()
    model = WorkerModel(clock)
    model.silent_ids = True
    rem = make_remote(model, clock, run_id='run-d', seed_hold=lambda *a: None)
    rem.claim(wait=0)
    model.bookings.append({'id': 'run-d:1', 'kind': 'hold', 'date': TARGET_LIMITED, 'hotel': NIKKO, 'runId': 'run-d',
                           'at': 1})
    rem.record('hold', TARGET, NAGU)
    rem.post_bookings()
    check('conflict: a 200 whose record differs is not an ack either', 'run-d:1' in rem.conflicts, str(rem.conflicts))


def test_full_record_closes_the_gate():
    """W4: a 507 (the record full) keeps the entries unsynced and closes the hold gate at once, though the Worker is
    reachable; taken again, it opens."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    model.max_bookings = 0
    rem.on_event('hold', {'date': TARGET, 'hotel': NAGU})
    rem.report()
    check('full: still unsynced', len(rem.unsynced) == 1, str(rem.unsynced))
    check('full: the gate closed at once', rem.hold_gate() == (False, 'record_full'), str(rem.hold_gate()))
    check('full: the Worker is not counted as down', rem.outage_sec() == 0)
    check('full: an error event', [e.get('detail') for e in model.kinds('error')] == ['record_full'],
          str(model.kinds('error')))
    check('full: lastError', rem.last_by_step.get('bookings') == (507, 'record_full'), str(rem.last_by_step))
    rem.report()
    check('full: told once', len(model.kinds('error')) == 1)
    model.max_bookings = 500
    rem.report()
    check('full: taken: synced and open', rem.unsynced == {} and rem.hold_gate() == (True, ''), str(rem.hold_gate()))


def test_lease_lost_while_free_is_claimed_again():
    """R11: a Worker outage longer than the lease leaves it expired (or gone): the report answer says lease_lost, and
    the run claims it again at once instead of ending. Someone else's live lease still ends it."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    try:
        run.tick()
        model.lease = None     # gone while we couldn't reach the Worker: the next report's answer says lease_lost
        clock.advance(remote.REPORT_EVERY_SEC)
        check('reclaim: not draining', run.tick() is None and not run.draining, str(run.end_detail))
        check('reclaim: the answer did say lease_lost', model.reports and rem.config['stop'] is False)
        check('reclaim: the lease is ours again', model.lease and model.lease['holder'] == rem.run_id, str(model.lease))
        check('reclaim: the gate open', rem.hold_gate() == (True, ''), str(rem.hold_gate()))

        model.lease = {'holder': 'other', 'host': 'local', 'until': model.ms() + 600_000}
        clock.advance(remote.REPORT_EVERY_SEC)
        run.tick()
        check('reclaim: someone else\'s live lease: drain', run.draining and run.end_detail == 'lease_lost',
              str(run.end_detail))
        check('reclaim: claimed once only', run.reclaims == 1, str(run.reclaims))
    finally:
        _cleanup(sup)


def test_worker_lost_ends_the_run():
    """R15: no good answer for WORKER_LOST_SEC: run_end detail worker_lost, exit 1."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    try:
        run.tick()
        model.down = True
        clock.advance(M.WORKER_LOST_SEC + 1)
        with bh._booking_in_flight():
            run.tick()
            check('lost: draining as worker_lost', run.draining and run.end_detail == 'worker_lost',
                  str(run.end_detail))
        model.down = False
        clock.advance(1)
        check('lost: ends worker_lost', run.tick() == 'worker_lost')
        check('lost: the run_end says so', [e.get('detail') for e in model.kinds('run_end')] == ['worker_lost'],
              str(model.kinds('run_end')))
    finally:
        _cleanup(sup)


def test_summary_counts_refusals():
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    run = M.RemoteRun(rem, idle_supervisor(), clock=clock)
    lines = []
    saved = logs.public
    logs.public = lambda event, **f: lines.append(logs.format_public(event, f)[0])
    try:
        rem.on_event('hold_refused', {'why': 'lease_stale'})
        rem.on_event('hold_refused', {'why': 'lease_stale'})
        run.summary(clock())
        run.finish()
    finally:
        logs.public = saved
    check('gate_closed: in the summary', any(ln.startswith('its summary') and ' gate_closed=2' in ln for ln in lines),
          str(lines))
    check('gate_closed: in run_end', any(ln.startswith('its run_end') and ' gate_closed=2' in ln for ln in lines),
          str(lines))
    check('gate_closed: the old name gone', not any(' refused=' in ln for ln in lines), str(lines))


def test_month_labels_unique_across_years():
    sup = idle_supervisor()
    saved = bh.TARGET_DATES
    try:
        a, b = (T._TARGET_MONTH.replace(day=5), T._TARGET_MONTH.replace(year=T._TARGET_MONTH.year + 1, day=5))
        bh.TARGET_DATES = [a.isoformat(), b.isoformat()]
        sup.start()
        names = sorted(w.name for w, _ in sup.scanners.values())
        check('labels: two scanners, two names', len(set(names)) == 2, str(names))
        check('labels: MON + yy', M.month_label('2026-12') == 'DEC26' and M.month_label('2027-12') == 'DEC27')
    finally:
        _cleanup(sup)
        bh.TARGET_DATES = saved


def test_preflight_lets_a_lingering_lease_through(tmpdir):
    """R5: the workflow's preflight skips the job only for paused, MODE off or no dates. Another run's lease (one
    that is ending, say) goes on to main.py's claim, which waits for it."""
    clock = Clock()
    model = WorkerModel(clock)
    client = ModelClient(model)
    check('preflight: running', remote.preflight(client) == (200, 'none', True), str(remote.preflight(client)))
    model.lease = {'holder': 'old-run', 'host': 'actions', 'until': model.ms() + 200_000}
    check('preflight: a lingering lease still runs', remote.preflight(client) == (200, 'lease_lost', True),
          str(remote.preflight(client)))
    model.settings['paused'] = True
    check('preflight: paused skips', remote.preflight(client) == (200, 'paused', False))
    model.settings['paused'] = False
    model.settings['dates'] = []
    check('preflight: no dates skips', remote.preflight(client)[1:] == ('no_dates', False))
    model.mode_off = True
    check('preflight: MODE off skips', remote.preflight(client)[1:] == ('mode_off', False))
    model.garble = True
    check('preflight: a garbled answer is an error', remote.preflight(client)[1:] == ('bad_answer', False))

    # The CLI the workflow runs, over localhost: one line of codes, run= in $GITHUB_OUTPUT.
    model = WorkerModel()
    model.lease = {'holder': 'old-run', 'host': 'actions', 'until': model.ms() + 200_000}
    srv = serve_model(model)
    out = os.path.join(tmpdir, 'gh_output')
    try:
        env = {'PATH': os.environ.get('PATH', ''), 'NO_PROXY': '127.0.0.1', 'no_proxy': '127.0.0.1',
               'ITS_WORKER_URL': f'http://127.0.0.1:{srv.server_port}', 'ITS_RUNNER_TOKEN': TOKEN,
               'GITHUB_OUTPUT': out}
        r = subprocess.run([sys.executable, 'remote.py', 'preflight'], cwd=HERE, env=env, capture_output=True,
                           text=True, timeout=30)
        check('preflight-cli: exit 0', r.returncode == 0, r.stdout + r.stderr)
        check('preflight-cli: one line of codes', r.stdout.strip() == 'preflight: worker=200 reason=lease_lost run=1',
              r.stdout)
        with open(out) as f:
            check('preflight-cli: run=1 for the next steps', f.read() == 'run=1\n')
        r = subprocess.run([sys.executable, 'remote.py', 'preflight'], cwd=HERE, env=dict(env, ITS_RUNNER_TOKEN='x'),
                           capture_output=True, text=True, timeout=30)
        check('preflight-cli: a refused token fails the job', r.returncode == 1 and 'run=0' in r.stdout, r.stdout)
        check('preflight-cli: never prints the settings', TARGET not in r.stdout and NAGU not in r.stdout)
    finally:
        srv.shutdown()


def test_base_url_refused_ends_the_run(tmpdir):
    """R12: an ITS_BASE_URL that isn't loopback: the run doesn't start (exit 2), the private log says why, and the
    real site is never contacted instead."""
    state = os.path.join(tmpdir, 'state-base')
    env = {'PATH': os.environ.get('PATH', ''), 'HOME': tmpdir, 'ITS_STATE_DIR': state,
           'ITS_BASE_URL': 'https://example.com', 'ITS_RUNNER_TOKEN': TOKEN, 'ITS_WORKER_URL': 'http://127.0.0.1:1',
           'GITHUB_ACTIONS': 'true', 'PYTHONDONTWRITEBYTECODE': '1'}
    r = subprocess.run([sys.executable, 'main.py', '--remote', '--deadline', str(time.time() + 60)], cwd=HERE,
                       env=env, capture_output=True, text=True, timeout=60)
    check('base-run: exit 2', r.returncode == 2, r.stdout[-300:])
    check('base-run: public says why, as a code', 'its run_end' in r.stdout and 'reason=base_url' in r.stdout
          and 'example.com' not in r.stdout, r.stdout)
    with open(os.path.join(state, 'its_booking.log'), encoding='utf-8') as f:
        check('base-run: the private log names it', 'ITS_BASE_URL' in f.read())


def test_chrome_is_spawned_without_pipes():
    """R8: pydoll's default process creator pipes Chrome's stdout/stderr and never reads them. chrome.launch installs
    `spawn` as the process manager's process_creator (pydoll 2.22's hook), which inherits fd 1/2 (the private log once
    logs.setup ran). Checked with stand-in pydoll modules: CI has no pydoll."""
    import types
    import chrome

    class PM:
        def __init__(self, process_creator=None):
            self.process_creator = process_creator

    class Opts:
        def __init__(self):
            self.arguments = []

        def add_argument(self, a):
            self.arguments.append(a)

    class Chrome:
        def __init__(self, options=None):
            self.options = options
            self._browser_process_manager = PM()

    mods = {'pydoll': types.ModuleType('pydoll'), 'pydoll.browser': types.ModuleType('pydoll.browser'),
            'pydoll.browser.chromium': types.ModuleType('pydoll.browser.chromium'),
            'pydoll.browser.chromium.chrome': types.ModuleType('pydoll.browser.chromium.chrome'),
            'pydoll.browser.options': types.ModuleType('pydoll.browser.options'),
            'pydoll.browser.managers': types.ModuleType('pydoll.browser.managers')}
    mods['pydoll.browser.chromium.chrome'].Chrome = Chrome
    mods['pydoll.browser.options'].ChromiumOptions = Opts
    mods['pydoll.browser.managers'].BrowserProcessManager = PM
    saved = {k: sys.modules.get(k) for k in mods}
    sys.modules.update(mods)
    try:
        b = chrome.launch()
    finally:
        for k, v in saved.items():
            if v is None:
                sys.modules.pop(k, None)
            else:
                sys.modules[k] = v
    check('spawn: the process creator is ours', b._browser_process_manager.process_creator is chrome.spawn)
    check('spawn: the flags kept', '--no-sandbox' in b.options.arguments and '--lang=ja-JP' in b.options.arguments)

    # Before logs.setup (a local run): no pipe either, nothing to fill.
    p = chrome.spawn([sys.executable, '-c', 'import sys; sys.stdout.write("x" * 300000); '
                      'sys.stderr.write("y" * 300000)'])
    check('spawn: a chatty child never blocks on a pipe', p.wait(timeout=30) == 0 and p.stdout is None
          and p.stderr is None)


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
    assert bh.BASE == cb.BASE == base, (bh.BASE, cb.BASE)   # from ITS_BASE_URL: loopback, so honoured
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
        # Chrome's own output, through the process creator chrome.launch installs: a lot of it, with secrets in it.
        noisy = (f'import sys\nfor i in range(3000): print("CHROME-NOISE {TARGET} {NAGU} s={S_TOKEN}"); '
                 f'print("[ERROR:gpu] {CHILD_MAILBOX}", file=sys.stderr)')
        chrome.spawn([sys.executable, '-c', noisy]).wait(timeout=30)
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
    model = WorkerModel(dates=[TARGET, TARGET_LIMITED], autoConfirm=True)
    srv = serve_model(model)
    state = os.path.join(tmpdir, 'state')
    env = {
        'PATH': os.environ.get('PATH', ''), 'HOME': tmpdir, 'NO_PROXY': '127.0.0.1,localhost',
        'no_proxy': '127.0.0.1,localhost', 'PYTHONDONTWRITEBYTECODE': '1',
        'ITS_STATE_DIR': state, 'ITS_BASE_URL': f'http://127.0.0.1:{port}', 'GITHUB_RUN_ATTEMPT': '3', 'ITS_WORKER_URL': f'http://127.0.0.1:{srv.server_port}', 'ITS_RUNNER_TOKEN': TOKEN,
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
        # Two nights: one confirmed (its first hold took the only link; the rest of that night is never filed) and the
        # other night's holds failed (no mail), then the ban.
        settled = T._wait_for(lambda: len(model.booked('confirmed')) == 1 and len(model.booked('failed')) >= 1
                              and {b['date'] for b in model.booked('failed')}.isdisjoint(
                                  b['date'] for b in model.booked('confirmed')), timeout=60)
        check('redaction: the child held, confirmed one night, gave up on the other', settled,
              str([(b['kind'], b['date'][-2:]) for b in model.bookings]))
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
    check('redaction: the run id is the attempt\'s', {b['runId'] for b in model.bookings} == {'424242-3'},
          str({b['runId'] for b in model.bookings}))
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
                          ('hold',), ('confirmed', 'n=1'), ('human_needed', 'detail=no_mail'),
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
               CHILD_MAILBOX, '@', CHILD_PASSWORD, TOKEN, NUMBER, 'Bearer', 'CHROME-NOISE', 'ERROR:gpu'}
    banned |= {v for v in CHILD_APPLICANT.values() if len(v) >= 2}
    leaks = sorted(b for b in banned if b in text)
    check('redaction: no date, hotel, token, cookie, applicant field, mailbox or number in public', leaks == [],
          f'{leaks} in: {[ln for ln in lines if any(b in ln for b in leaks)][:4]}')

    with open(os.path.join(state, 'its_booking.log'), encoding='utf-8', errors='replace') as f:
        private = f.read()
    for want in (TARGET, NAGU, 'HELD + MAIL SENT', NUMBER, 'Traceback', 'RuntimeError: boom', S_TOKEN,
                 'CHROME-NOISE', '[ERROR:gpu]'):
        check(f'redaction: the private log has {want!r} (the flow ran, nothing lost)', want in private)
    mode = os.stat(os.path.join(state, 'its_booking.log')).st_mode & 0o777
    check('redaction: the private log is 0600', mode == 0o600, oct(mode))


# ── runner ───────────────────────────────────────────────────────────

def test_names_counted_in_utf16_units():
    """The Worker and the contract count a name's length in UTF-16 units (JS `length`): an astral character is 2, so
    150 𠮷 are 300 units, over SITE_NAME_MAX; the runner caps in units too, never splitting a character."""
    big = '\U00020BB7'   # 𠮷
    check('units: astral is 2', remote._units(big * 3) == 6 and remote._units('あa') == 2)
    t = remote._text(big * 150, remote.SITE_NAME_MAX)
    check('units: capped at 200 units', t == big * 100 and remote._units(t) == 200, str(remote._units(t or '')))
    t = remote._text('a' + big * 150, remote.SITE_NAME_MAX)
    check('units: no half character', t == 'a' + big * 99 and remote._units(t) == 199, str(remote._units(t or '')))
    check('units: short names untouched', remote._text(f' {big}館 ', 10) == f'{big}館')
    check('units: a lone surrogate counts 1', remote._units('\ud800x') == 2)
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    rem.on_event('hold', {'date': TARGET, 'hotel': big * 150 + '館'})
    rem.on_event('scan', {'names': [big * 120]})
    rem.post_bookings()
    hotel = model.bookings[0]['hotel'] if model.bookings else ''
    check('units: a booking\'s hotel within MAX_SITE_NAME units', 0 < remote._units(hotel) <= 200, str(len(hotel)))
    check('units: seen names within MAX_SITE_NAME units', all(remote._units(n) <= 200 for n in rem.seen),
          str([remote._units(n) for n in rem.seen]))


def test_older_bookings_answer_does_not_undo_a_stop():
    """開始 / 停止 don't move settings.updatedAt: a /runner/bookings answer that left before 停止 and lands after the
    report that said paused must not clear the stop. Only claim and report answers set stop."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    try:
        run.tick()
        check('order-stop: running', not run.draining)
        before = model.config(rem.run_id)      # the confirm worker's bookings answer, built before 停止
        model.settings['paused'] = True        # 停止: updatedAt unchanged
        rem.report()                           # the control loop's report: stop paused
        check('order-stop: the report said paused', rem.config['stop'] and rem.config['stopReason'] == 'paused')
        model.bookings.append({'id': 'x:1', 'kind': 'hold', 'date': TARGET, 'hotel': NAGU, 'runId': 'x'})
        seeded = []
        rem.seed_hold = lambda d, h: seeded.append((d, h))
        rem.absorb(dict(before, bookings=[dict(b) for b in model.bookings]))   # the older answer lands now
        check('order-stop: the older answer kept the stop', rem.config['stop'] and rem.config['stopReason'] == 'paused',
              str((rem.config['stop'], rem.config['stopReason'])))
        check('order-stop: its bookings still taken', seeded == [(TARGET, NAGU)], str(seeded))
        clock.advance(1)                       # no report due: the tick decides on what it has
        run.tick()
        check('order-stop: drains as paused', run.draining and run.end_detail == 'paused', str(run.end_detail))
        # and the other way: a bookings answer saying stop doesn't start a drain either (the next report does)
        rem2 = make_remote(model, clock, run_id='run-2', seed_hold=lambda *a: None)
        model.settings['paused'] = False
        model.lease = None
        rem2.claim(wait=0)
        model.settings['paused'] = True
        rem2.absorb(model.config(rem2.run_id))
        check('order-stop: a bookings answer sets no stop', rem2.config['stop'] is False)
        rem2.report()
        check('order-stop: the next report does', rem2.config['stop'] is True)
    finally:
        _cleanup(sup)


def test_reclaim_that_says_stop_drains_with_its_reason():
    """A re-claim after lease_lost whose own answer says stop (停止 meanwhile): the drain is that reason, not
    lease_lost."""
    clock = Clock()
    model = WorkerModel(clock)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    handle = model.handle

    def paused_at_claim(method, path, body, auth):
        if path == '/runner/claim':
            model.settings['paused'] = True
        return handle(method, path, body, auth)
    try:
        run.tick()
        model.lease = None
        model.handle = paused_at_claim
        clock.advance(remote.REPORT_EVERY_SEC)
        end = run.tick()   # nothing in flight: the drain ends in the same tick
        check('reclaim-stop: claimed again', run.reclaims == 1 and model.calls.count(('POST', '/runner/claim', {})) == 2)
        check('reclaim-stop: drains as paused', end == 'paused' and run.end_detail == 'paused', str(run.end_detail))
        check('reclaim-stop: the run_end says so', [e.get('detail') for e in model.kinds('run_end')] == ['paused'],
              str(model.kinds('run_end')))
    finally:
        _cleanup(sup)


def test_claim_logs_an_unreachable_worker():
    """The claim's wait (≤ CLAIM_WAIT_SEC) with the Worker down: each failed attempt counted, a line a minute to the
    private log and a public code, not silence until it gives up."""
    clock = Clock()
    model = WorkerModel(clock)
    model.down = True
    private, public = [], []
    rem = make_remote(model, clock, seed_hold=lambda *a: None, log=private.append,
                      public=lambda event, **f: public.append(logs.format_public(event, f)[0]))

    def sleep(s):
        clock.advance(s)
    cfg, why = rem.claim(sleep=sleep)
    attempts = sum(1 for c in model.calls if c[1] == '/runner/claim')
    minutes = remote.CLAIM_WAIT_SEC // remote.CLAIM_LOG_EVERY_SEC
    check('claim-log: gave up unreachable', cfg is None and why == 'unreachable', why)
    check('claim-log: many attempts', attempts > minutes + 2, str(attempts))
    check('claim-log: a private line a minute', minutes <= len(private) <= minutes + 1, str(private))
    check('claim-log: the first attempt logged', private and 'attempt 1;' in private[0], str(private[:1]))
    check('claim-log: public codes alongside', len(public) == len(private)
          and all(ln.startswith('its claim_retry') and 'status=503' in ln and 'cls=http_503' in ln for ln in public),
          str(public))
    check('claim-log: nothing dropped, no token', all('dropped' not in ln and TOKEN not in ln for ln in public + private))
    check('claim-log: each attempt counted', rem.failures_by_step.get('worker') == attempts, str(rem.failures_by_step))


# ── round 2: the allow-list, a confirmed night, the record's refusals ──

SETTINGS_KEYS = ('TARGET_DATES', 'SKIP_HOTELS', '_SKIP_NORM', 'SEARCH_HOTELS', '_SEARCH_NORM', 'PRIORITY_HOTELS',
                 '_PRIORITY_NORM', 'RETRY_DELAY', 'NUM_GUESTS', 'AUTO_CONFIRM', 'DONE_DATES')


def test_allow_list(port):
    """The allow-list: with `search` only the facilities named there are applied for (normName exact; skip still wins);
    without it, the skip-list rule; an older Worker's answer (no `search`) and a newer one both parse."""
    check('allow: settings without search parse', remote.parse_settings(settings()) is not None)
    check('allow: search null parses', remote.parse_settings(settings(search=None)) is not None)
    check('allow: a list parses', remote.parse_settings(settings(search=[NAGU])) is not None)
    check('allow: a garbled search is refused', remote.parse_settings(settings(search=NAGU)) is None
          and remote.parse_settings(settings(search=[1])) is None)
    with T.Env(port), T.CapturedLog() as log:
        bh.apply_settings(settings(search=['NAGU　勝浦', RESOL], skip=[RESOL]))
        bh.RETRY_DELAY = 0.05
        check('allow: searched, by normName', bh.is_searched(NAGU) and not bh.is_searched(NIKKO))
        check('allow: skip wins over search', not bh.is_eligible(RESOL) and bh.is_eligible(NAGU))
        _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('allow: only the searched, unskipped one is applied for', booked == [NAGU], str(booked))
        check('allow: a step 3 only for NAGU', STATE.count('apply_service_select') == 1, str(STATE.hits))
    with T.Env(port):
        bh.apply_settings(settings(search=[], skip=[RESOL]))
        bh.RETRY_DELAY = 0.05
        with T.CapturedLog() as log:
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('allow: an empty allow-list applies for nothing', booked == [] and STATE.count('empty_create') == 0)
        check('allow: the log says why', log.saw(f'{NIKKO} (not searched)') and log.saw(f'{RESOL} (skip list)'))
    with T.Env(port):
        bh.apply_settings(settings(search=[NAGU]))
        changed = bh.apply_settings(settings(skip=[NIKKO]))   # an older Worker: no search key
        bh.RETRY_DELAY = 0.05
        check('allow: no search: the allow-list is gone', bh.SEARCH_HOTELS is None and 'SEARCH_HOTELS' in changed)
        _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('allow: no search: every one not skipped', booked == [NAGU, RESOL], str(booked))
    with T.Env(port):
        # Switched off mid-chain: the next hotel's gate check stops it.
        bh.apply_settings(settings(search=[NAGU, RESOL, NIKKO]))
        bh.RETRY_DELAY = 0.05
        STATE.hooks['POST /apply/empty_new'] = lambda: bh.apply_settings(settings(search=[NAGU]))
        _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
        check('allow: switched off mid-chain is not applied for', booked == [NAGU], str(booked))


def test_interval_any_whole_seconds_from_the_floor():
    """The Worker validates the interval; the runner takes any whole one from the floor up (a choice added to the
    contract must not make every answer garbled), never under it."""
    check('interval: 45 s parses', remote.parse_settings(settings(intervalSec=45)) is not None)
    check('interval: 600 s parses', remote.parse_settings(settings(intervalSec=600)) is not None)
    for bad in (10, 14, 15.5, True, '30', None):
        check(f'interval: {bad!r} refused', remote.parse_settings(settings(intervalSec=bad)) is None)


def test_a_confirmed_night_is_not_scanned(port):
    """One booking a night: a night with a `confirmed` entry in the Worker's record (any run's) is no longer scanned, held or
    confirmed again; a month with no other night stops its scanner. The record's other kinds don't count."""
    saved = {k: getattr(bh, k) for k in SETTINGS_KEYS}
    try:
        clock = Clock()
        model = WorkerModel(clock, dates=[TARGET, TARGET_LIMITED, NEXT_MONTH_DAY])
        model.bookings = [
            {'id': 'old:1', 'kind': 'confirmed', 'date': TARGET, 'hotel': NAGU, 'number': '1', 'at': 1, 'runId': 'old'},
            {'id': 'old:2', 'kind': 'hold', 'date': TARGET_LIMITED, 'hotel': NAGU, 'at': 1, 'runId': 'old'},
            {'id': 'old:3', 'kind': 'confirmed', 'date': NEXT_MONTH_DAY, 'hotel': RESOL, 'number': '2', 'at': 1,
             'runId': 'old'}]
        done = []
        rem = make_remote(model, clock, on_settings=bh.apply_settings, seed_hold=lambda *a: None,
                          on_done=lambda d: (done.append(d), bh.set_done_dates(d)))
        rem.claim(wait=0)
        check('done: the confirmed nights, from the record', bh.DONE_DATES == {TARGET, NEXT_MONTH_DAY},
              str(bh.DONE_DATES))
        check('done: a scanner never reads them', M._month_dates(T.MONTH)() == [TARGET_LIMITED])
        sup = idle_supervisor()
        try:
            sup.start()
            check('done: a month with no night left has no scanner', sorted(sup.scanners) == [T.MONTH],
                  str(sorted(sup.scanners)))
        finally:
            _cleanup(sup)
        check('done: still_wanted says no', not bh.still_wanted(TARGET) and not bh.still_wanted(TARGET, RESOL)
              and bh.still_wanted(TARGET_LIMITED, RESOL))
        rem.report()
        check('done: handed on once per change at most', all(d == done[0] for d in done), str(done))
    finally:
        for k, v in saved.items():
            setattr(bh, k, v)

    with T.Env(port):
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock, on_done=bh.set_done_dates)
        rem.claim(wait=0)
        bh.TARGET_DATES = [TARGET, TARGET_LIMITED]
        with Hooks(rem):
            rem.on_event('confirmed', {'date': TARGET, 'hotel': NAGU, 'number': '9'})
            check('done: this run\'s own confirmation counts at once', bh.night_done(TARGET), str(bh.DONE_DATES))
            stop = threading.Event()
            t = threading.Thread(target=bh.scan_and_book_month, args=(T.MONTH, M._month_dates(T.MONTH), 'DONE'),
                                 kwargs={'stop_event': stop}, daemon=True)
            t.start()
            try:
                held = T._wait_for(lambda: len(bh.get_booked_hotels(TARGET_LIMITED)) == 3)
            finally:
                stop.set()
                t.join(10)
        check('done: the other night still booked', held, str(bh.get_booked_hotels(TARGET_LIMITED)))
        check('done: nothing for the confirmed night', bh.get_booked_hotels(TARGET) == []
              and not any(TARGET in (f.get('join_time'), f.get('apply[join_time]')) for _p, f in STATE.posts),
              str(bh.get_booked_hotels(TARGET)))


def test_second_facility_never_filed_for_a_confirmed_night(port):
    """One booking a night: two holds for one night with auto-confirm on, the ★ one confirmed first; the
    other's leg never reaches Chrome's 申込する (its link claimed, never followed), no human_needed for it, a public
    skip_confirmed_night; and the commit gate refuses a night confirmed meanwhile."""
    with T.Env(port, confirm=True, applicant=dict(T.APPLICANT_FIXTURE)), T.CapturedLog() as log:
        clock = Clock()
        model = WorkerModel(clock, autoConfirm=True)
        printed = []
        rem = make_remote(model, clock, on_done=bh.set_done_dates,
                          public=lambda event, **f: printed.append((event, f)))
        rem.claim(wait=0)
        first = f'{bh.BASE}/apply/new?c=' + 'a' * 36
        second = f'{bh.BASE}/apply/new?c=' + 'b' * 36
        cb._mail_source = lambda _since: [f'ご案内 {first} ', f'ご案内 {second} ']
        STATE.hotels = [(8, RESOL), (7, NAGU)]
        with Hooks(rem):
            _, booked = bh.book_all_hotels_for_date(TARGET, 'TEST')
            check('one-a-night: both held, ★ first', booked == [NAGU, RESOL] and cb.pending_count() == 2, str(booked))
            cb.drain_once()
        check('one-a-night: Chrome handed one form only', len(STATE.browser_calls) == 1, str(len(STATE.browser_calls)))
        check('one-a-night: the ★ one filed', STATE.browser_calls[0]['link'] == first)
        check('one-a-night: the queue is empty', cb.pending_count() == 0)
        check('one-a-night: both links claimed (the second can\'t go to another hold)', len(cb._claimed) == 2)
        rem.report()
        kinds = [(b['kind'], b['hotel']) for b in model.bookings]
        check('one-a-night: no confirming for the second', kinds == [('hold', NAGU), ('hold', RESOL),
                                                                     ('confirming', NAGU), ('confirmed', NAGU)], str(kinds))
        check('one-a-night: nobody asked to act', model.kinds('human_needed') == [] and rem.unresolved_holds() == 0)
        check('one-a-night: said so privately', log.saw('already has a confirmed booking'))
        check('one-a-night: a public count', ('skip_confirmed_night', {'n': 1}) in printed, str(printed))
        bh.set_done_dates([TARGET_LIMITED])
        check('one-a-night: the commit gate refuses a night confirmed meanwhile',
              cb._gate(TARGET_LIMITED, NAGU, 'confirm') == (False, 'night_confirmed'))


def test_an_unknown_outcome_blocks_the_night(port):
    """A leg that may have filed (no_completion, submit_unknown: 確認 may have been pressed) leaves its `confirming` open
    (no `failed`) and the night counts as booked: the next facility's leg for it never reaches Chrome. A definite
    non-booking (room_taken) does not: the next one is filed. Another run's open `confirming` in the record blocks the
    night from the claim on; one followed by `failed`, or this run's own leg in flight, doesn't."""
    for first, blocked in (('no_completion', True), ('submit_unknown', True), ('room_taken', False)):
        with T.Env(port, confirm=True, applicant=dict(T.APPLICANT_FIXTURE)):
            clock = Clock()
            model = WorkerModel(clock, autoConfirm=True)
            rem = make_remote(model, clock, on_done=bh.set_done_dates)
            rem.claim(wait=0)
            links = [f'{bh.BASE}/apply/new?c=' + c * 36 for c in 'ab']
            cb._mail_source = lambda _since: [f'ご案内 {u} ' for u in links]
            answers = iter([('failed', first), ('confirmed', '777')])
            STATE.browser_result = lambda: next(answers)
            STATE.hotels = [(8, RESOL), (7, NAGU)]
            with Hooks(rem):
                bh.book_all_hotels_for_date(TARGET, 'TEST')
                cb.drain_once()
            rem.report()
            kinds = [(b['kind'], b['hotel']) for b in model.bookings]
            if blocked:
                check(f'unknown-{first}: the second never handed to Chrome', len(STATE.browser_calls) == 1,
                      str(len(STATE.browser_calls)))
                check(f'unknown-{first}: confirming left open, no failed', kinds == [
                    ('hold', NAGU), ('hold', RESOL), ('confirming', NAGU)], str(kinds))
                check(f'unknown-{first}: the night is done', bh.night_done(TARGET) and TARGET in rem.done)
                check(f'unknown-{first}: a human_needed with the code',
                      [e['detail'] for e in model.kinds('human_needed')] == [first], str(model.kinds('human_needed')))
            else:
                check(f'definite-{first}: the next facility is filed', len(STATE.browser_calls) == 2
                      and ('confirmed', RESOL) in kinds and ('failed', NAGU) in kinds, str(kinds))

    def done_after_claim(bookings, run_id='run-x'):
        saved = bh.DONE_DATES
        try:
            clock = Clock()
            model = WorkerModel(clock)
            model.bookings = bookings
            rem = make_remote(model, clock, run_id=run_id, seed_hold=lambda *a: None, on_done=bh.set_done_dates)
            rem.claim(wait=0)
            return set(rem.done)
        finally:
            bh.DONE_DATES = saved
    hold = {'id': 'old:1', 'kind': 'hold', 'date': TARGET, 'hotel': NAGU, 'at': 1, 'runId': 'old'}
    conf = dict(hold, id='old:2', kind='confirming')
    fail = dict(hold, id='old:3', kind='failed')
    check('record: another run\'s open confirming blocks the night', done_after_claim([hold, conf]) == {TARGET})
    check('record: one followed by failed doesn\'t', done_after_claim([hold, conf, fail]) == set())
    check('record: this run\'s from before a restart blocks it too (that process\'s leg may have filed)', done_after_claim(
        [dict(hold, id='run-x:1', runId='run-x'), dict(conf, id='run-x:2', runId='run-x')]) == {TARGET})


def test_imap_rechecked_while_failing():
    """A failed mailbox check is tried again every IMAP_RECHECK_SEC while auto-confirm is on (cheap: the login only),
    so one transient failure doesn't hold mailOk (the Worker's mail_failing) false until the next hold; once it
    passes, no more checks."""
    clock = Clock()
    model = WorkerModel(clock, autoConfirm=True)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    answers = iter([(False, 'timeouterror'), (True, '')])
    calls = []
    saved = cb.imap_check
    cb.imap_check = lambda: (calls.append(clock()), next(answers))[1]
    try:
        run.tick()
        check('recheck: checked at start, failing', len(calls) == 1 and rem.mail_ok is False)
        clock.advance(M.IMAP_RECHECK_SEC - 1)
        run.tick()
        check('recheck: not before IMAP_RECHECK_SEC', len(calls) == 1)
        clock.advance(1)
        run.tick()
        check('recheck: again after it, and mailOk back', len(calls) == 2 and rem.mail_ok is True, str(calls))
        clock.advance(M.IMAP_RECHECK_SEC * 3)
        run.tick()
        check('recheck: none while it passes', len(calls) == 2)
        check('recheck: the report says so', model.reports[-1].get('mailOk') is True)
    finally:
        cb.imap_check = saved
        _cleanup(sup)


def test_a_refused_entry_is_set_aside(port):
    """A 400 on /runner/bookings is the entry's, not an outage: the batch is split, the bad one set aside (unsynced,
    retried alone, HUMAN NEEDED, one human_needed bad_booking), the rest land, the gate stays open."""
    with T.CapturedLog() as log:
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock, run_id='run-e', seed_hold=lambda *a: None, log=bh.log)
        rem.claim(wait=0)
        rem.record('hold', TARGET, NAGU)        # run-e:1
        rem.record('hold', 'not-a-date', RESOL)   # run-e:2: the Worker refuses it (isDate)
        rem.record('hold', TARGET, NIKKO)       # run-e:3
        rem.post_bookings()
        ids = [b['id'] for b in model.bookings]
        check('400: the good entries landed', ids == ['run-e:1', 'run-e:3'], str(ids))
        check('400: the bad one set aside', list(rem.unsynced) == ['run-e:2'] and rem.conflicts == {'run-e:2'})
        check('400: not an outage', rem.outage_sec() == 0 and rem.hold_gate() == (True, ''), str(rem.hold_gate()))
        check('400: HUMAN NEEDED', log.saw('HUMAN NEEDED') and log.saw('as invalid'))
        check('400: the report with its human_needed still lands (no bad date in the event)',
              rem.report() is not None and rem.report() is not None, str(rem.last_by_step))
        check('400: one human_needed', [e.get('detail') for e in model.kinds('human_needed')] == ['bad_booking']
              and 'date' not in model.kinds('human_needed')[0], str(model.kinds('human_needed')))
        check('400: lastError', rem.last_by_step.get('bookings') == (400, 'bad_booking'), str(rem.last_by_step))
        check('400: in the reports\' unsynced', model.reports[-1]['unsynced'] == 1)


def test_an_ack_must_carry_our_number():
    """`_same_entry` compares the 申込受付番号: the record holding our id with another number is not our entry."""
    clock = Clock()
    model = WorkerModel(clock)
    model.silent_ids = True   # answers 200 whatever the content under a known id
    rem = make_remote(model, clock, run_id='run-f', seed_hold=lambda *a: None)
    rem.claim(wait=0)
    model.bookings.append({'id': 'run-f:1', 'kind': 'confirmed', 'date': TARGET, 'hotel': NAGU, 'number': '111',
                           'runId': 'run-f', 'at': 1})
    rem.record('confirmed', TARGET, NAGU, number='222')
    rem.post_bookings()
    check('number: not an ack', 'run-f:1' in rem.unsynced and 'run-f:1' in rem.conflicts, str(rem.unsynced))


def test_report_carries_the_applied_settings_stamp():
    """`settingsAt`: the applied settings' updatedAt (the Worker's settings_stale); an older Worker ignores it."""
    clock = Clock()
    model = WorkerModel(clock)
    model.settings['updatedAt'] = 1234
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    check('settingsAt: null before any settings', rem.build_report()['settingsAt'] is None)
    rem.claim(wait=0)
    check('settingsAt: the applied stamp', rem.build_report()['settingsAt'] == 1234)
    model.settings['updatedAt'] = 5678
    rem.report()
    check('settingsAt: follows the newest applied', rem.build_report()['settingsAt'] == 5678)


# ── round 2: outcome codes, private evidence, the mailbox, the scan history ──

class FakeTab:
    """A pydoll tab, scripted: `page` is the HTML now; the 申込する / 確認 clicks move it to `after_apply` /
    `after_confirm`; `hang` names a step that never answers (the budget's timeout), `boom` one that raises."""

    def __init__(self, page='<html>top</html>', after_apply='', after_confirm='', url='', hang=None, boom=None,
                 fill_ok=True):
        self.page, self.after_apply, self.after_confirm, self.url = page, after_apply, after_confirm, url
        self.hang, self.boom, self.fill_ok = hang, boom, fill_ok
        self.shots = []

    async def _step(self, name):
        import asyncio
        if self.boom == name:
            raise RuntimeError(f'cdp {name} failed')
        if self.hang == name:
            await asyncio.Event().wait()

    async def go_to(self, url, timeout=30):
        await self._step('go_to')

    async def refresh(self):
        pass

    async def find(self, **_k):
        return None   # no Turnstile widget: every attempt fails

    @property
    def current_url(self):
        async def get():
            return self.url
        return get()

    async def execute_script(self, script):
        wrap = lambda v: {'result': {'result': {'value': v}}}
        if 'outerHTML' in script:
            return wrap(self.page)
        if 'navigator.userAgent' in script:
            return wrap('Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0.0.0')
        if 'Object.entries(V)' in script:
            return wrap(json.dumps({'ok': 2 if self.fill_ok else 1, 'bad': [] if self.fill_ok else ['x:rejected']}))
        if "includes('申込する')" in script:
            await self._step('apply')
            self.page = self.after_apply
            return wrap('clicked')
        if "['確認', '確定']" in script:
            await self._step('confirm')
            self.page = self.after_confirm
            return wrap('clicked' if self.after_confirm is not None else 'missing')
        return wrap('')

    async def take_screenshot(self, path=None, **_k):
        self.shots.append(path)
        with open(path, 'wb') as f:
            f.write(b'\x89PNG fake')


class FakeBrowser:
    def __init__(self, tab):
        self.tab = tab

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def start(self):
        return self.tab

    async def stop(self):
        pass


class FakeChrome:
    """chrome.py with `launch` giving FakeBrowser(tab), no pauses, no minimise, no reaping (it would SIGKILL a real
    Chrome on this machine), its caches in `tmpdir`, and bh.DEBUG_DIR there too."""

    def __init__(self, tmpdir, tab, **timeouts):
        import chrome
        self.c, self.tab, self.tmpdir, self.timeouts = chrome, tab, tmpdir, timeouts

    def __enter__(self):
        c = self.c
        names = ('launch', '_pause', 'minimise', '_kill_stray_chrome', 'USER_AGENT_CACHE', 'CALENDAR_URL_CACHE',
                 'CAPTCHA_TIMEOUT', 'BROWSER_CONFIRM_TIMEOUT', 'solve_turnstile', '_click_turnstile_checkbox')
        self.saved = {k: getattr(c, k) for k in names}
        self.saved_debug = bh.DEBUG_DIR

        async def nothing(*_a, **_k):
            return None
        c.launch = lambda: FakeBrowser(self.tab)
        c._pause, c.minimise, c._kill_stray_chrome = nothing, nothing, lambda: None

        async def no_token(_tab, _attempt=1):
            return None, 'centre'   # the click needs pydoll's input commands; here it never yields a token
        c._click_turnstile_checkbox = no_token
        c.USER_AGENT_CACHE = os.path.join(self.tmpdir, 'ua.txt')
        c.CALENDAR_URL_CACHE = os.path.join(self.tmpdir, 'url.txt')
        for k, v in self.timeouts.items():
            setattr(c, k, v)
        bh.DEBUG_DIR = os.path.join(self.tmpdir, 'debug')
        return self

    def __exit__(self, *exc):
        for k, v in self.saved.items():
            setattr(self.c, k, v)
        bh.DEBUG_DIR = self.saved_debug
        return False

    def evidence(self):
        d = bh.DEBUG_DIR
        return sorted(os.listdir(d)) if os.path.isdir(d) else []


def test_solve_outcome_codes_and_evidence(tmpdir):
    """A failed solve says which way it failed (`unsolved`, `no_calendar`, `chrome_<exc>`, `timeout`) and leaves the
    page's HTML and a screenshot in the private debug dir, the timeout's too (taken as it is cancelled)."""
    import asyncio
    import chrome
    cases = (('unsolved', FakeTab(url='https://x/calendar_apply'), {}, False),
             ('no_calendar', FakeTab(url='https://x/elsewhere'), {}, True),
             ('chrome_runtimeerror', FakeTab(boom='go_to'), {}, False),
             ('timeout', FakeTab(hang='go_to'), {'CAPTCHA_TIMEOUT': 0.2}, False))
    for i, (code, tab, timeouts, solved) in enumerate(cases):
        with FakeChrome(os.path.join(tmpdir, f'solve-{i}'), tab, **timeouts) as fc:
            os.makedirs(fc.tmpdir)
            if solved:
                async def token(_tab):
                    return 'tok'
                chrome.solve_turnstile = token
            out = asyncio.run(chrome.get_calendar_url())
            ev = fc.evidence()
            check(f'solve-{code}: no URL, the code', out is None and chrome.last_solve['cls'] == code,
                  f'{out!r} {chrome.last_solve}')
            check(f'solve-{code}: HTML and a screenshot kept',
                  any(f.endswith(f'_solve_{code}.html') for f in ev) and any(f.endswith(f'_solve_{code}.png') for f in ev),
                  str(ev))
    with FakeChrome(os.path.join(tmpdir, 'solve-ok'), FakeTab(url='https://x/calendar_apply/calendar_select?s=1')) as fc:
        os.makedirs(fc.tmpdir)

        async def token(_tab):
            return 'tok'
        chrome.solve_turnstile = token
        out = asyncio.run(chrome.get_calendar_url())
        check('solve-ok: the URL, no code, no evidence', out and chrome.last_solve['cls'] is None and fc.evidence() == [],
              f'{out!r} {chrome.last_solve} {fc.evidence()}')
    clock = Clock()
    rem = make_remote(WorkerModel(clock), clock, seed_hold=lambda *a: None)
    rem.on_event('solve', {'ok': False, 'secs': 3.0, 'cls': 'no_calendar'})
    rem.on_event('solve', {'ok': False, 'secs': 3.0})
    check('solve: the code reaches lastError and the event', rem.last_by_step['solve'] == (None, 'unsolved')
          and [e['detail'] for e in rem.events] == ['no_calendar', 'unsolved'], str(rem.events))


def test_leg_outcome_codes_and_evidence(tmpdir):
    """The filing leg's codes, and evidence for every failure after 申込する (none before it: nothing was sent)."""
    import chrome
    form = '<html><form>apply</form></html>'
    confirm = '<html>申込内容確認</html>'
    done = '<html>申込完了 申込受付番号 ABCD1234</html>'
    allow = lambda: (True, '')
    cases = (
        ('confirmed', FakeTab(form, confirm, done), {}, 'confirmed', 'ABCD1234', False),
        ('expired', FakeTab('<html>ご利用のURLは無効となりました</html>'), {}, 'failed', 'hold_expired', False),
        ('taken', FakeTab('<html>空き部屋がございません</html>'), {}, 'failed', 'room_taken', False),
        ('fill', FakeTab(form, fill_ok=False), {}, 'deferred', 'fill_rejected', False),
        ('screen', FakeTab(form, '<html>something else</html>'), {}, 'failed', 'no_confirm_screen', True),
        ('taken-late', FakeTab(form, '<html>空き部屋がございません</html>'), {}, 'failed', 'room_taken', True),
        ('no-button', FakeTab(form, confirm, None), {}, 'failed', 'no_confirm_button', True),
        ('no-completion', FakeTab(form, confirm, '<html>?</html>'), {}, 'failed', 'no_completion', True),
        ('unknown', FakeTab(form, confirm, done, hang='confirm'), {'BROWSER_CONFIRM_TIMEOUT': 0.3}, 'failed',
         'submit_unknown', True),
        ('early-timeout', FakeTab(form, hang='go_to'), {'BROWSER_CONFIRM_TIMEOUT': 0.3}, 'failed', 'leg_timeout', False),
        ('raise', FakeTab(form, confirm, done, boom='confirm'), {}, 'failed', 'chrome_runtimeerror', True),
    )
    lines = []
    for i, (name, tab, timeouts, status, detail, kept) in enumerate(cases):
        with FakeChrome(os.path.join(tmpdir, f'leg-{i}'), tab, **timeouts) as fc:
            os.makedirs(fc.tmpdir)
            got = chrome.submit('https://x/apply/new?c=1', {'a': '1', 'b': '2'}, lines.append, '[MAIL 12-05]', allow)
            ev = fc.evidence()
            check(f'leg-{name}: {status} {detail}', got == (status, detail), str(got))
            check(f'leg-{name}: evidence {"kept" if kept else "none"}',
                  (any(f.endswith(f'_{detail}.html') for f in ev) and any(f.endswith(f'_{detail}.png') for f in ev))
                  if kept else ev == [], str(ev))
    check('leg: the unknown outcome says to check the mailbox', any('outcome UNKNOWN' in ln for ln in lines))
    for status, detail, code in (('failed', 'hold_expired', 'hold_expired'),
                                 ('deferred', 'confirming_unacked', 'confirming_unacked'), ('deferred', 'auto_off', 'auto_off'),
                                 ('deferred', 'commit gate raised Boom()', 'leg_deferred'), ('failed', None, 'leg_failed')):
        check(f'leg: human_needed detail {code}', cb.outcome_code(status, detail) == code, cb.outcome_code(status, detail))
    # The gate hands back confirm_allowed's code itself, never prose to re-read.
    saved = (bh.AUTO_CONFIRM, bh.AUTO_CONFIRM_MIN_DAYS, bh.TARGET_DATES, cb._commit_gate)
    far, near = ((bh.tokyo_today() + timedelta(days=n)).isoformat() for n in (40, 3))
    try:
        cb._commit_gate = None
        for auto, day, targets, code in ((False, far, [far], 'auto_off'), (True, near, [near], 'near_date'),
                                         (True, far, [], 'not_wanted'), (True, far, [far], '')):
            bh.AUTO_CONFIRM, bh.AUTO_CONFIRM_MIN_DAYS, bh.TARGET_DATES = auto, 11, targets
            got = cb._gate(day, NAGU, 'apply')
            check(f'leg: the gate says {code or "yes"}', got == (code == '', code), str(got))
    finally:
        bh.AUTO_CONFIRM, bh.AUTO_CONFIRM_MIN_DAYS, bh.TARGET_DATES, cb._commit_gate = saved


def test_imap_codes_and_mail_ok(port):
    """IMAP failures are named (`web_login_required`, `auth_failed`, a lower-cased class), a mid-leg one is a
    `fail step=imap`, and every mailbox trip (the run-start check too) sets the reports' mailOk."""
    import imaplib
    import socket
    check('imap: web login', cb.imap_cls(imaplib.IMAP4.error(
        b'[ALERT] Please log in via your web browser: https://support.google.com/mail (Failure)')) == 'web_login_required')
    check('imap: webalert', cb.imap_cls(imaplib.IMAP4.error('[WEBALERT https://x] Web login required')) ==
          'web_login_required')
    check('imap: auth', cb.imap_cls(imaplib.IMAP4.error(b'[AUTHENTICATIONFAILED] Invalid credentials')) == 'auth_failed')
    check('imap: a class, lower-cased', cb.imap_cls(socket.timeout('t')) == 'timeouterror'
          and cb.imap_cls(socket.gaierror(8, 'x')) == 'gaierror', cb.imap_cls(socket.timeout('t')))

    class Box:
        mode = 'ok'

        def __init__(self, *a, **k):
            if Box.mode == 'down':
                raise ConnectionRefusedError(61, 'refused')

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def login(self, *a):
            if Box.mode == 'bad':
                raise imaplib.IMAP4.error(b'[AUTHENTICATIONFAILED] Invalid credentials (Failure)')

        def select(self, *a, **k):
            return 'OK', [b'1']

        def search(self, *a):
            return 'OK', [b'']

    saved = (imaplib.IMAP4_SSL, cb.IMAP_USER, cb.IMAP_APP_PASSWORD)
    with T.Env(port, confirm=True, applicant=dict(T.APPLICANT_FIXTURE)):
        clock = Clock()
        rem = make_remote(WorkerModel(clock), clock)
        rem.claim(wait=0)
        imaplib.IMAP4_SSL, cb.IMAP_USER, cb.IMAP_APP_PASSWORD = Box, 'u@example.com', 'p' * 16
        cb._mail_source = None
        try:
            with Hooks(rem):
                check('mailOk: none before any check', rem.build_report()['mailOk'] is None)
                for mode, ok, cls in (('bad', False, 'auth_failed'), ('ok', True, None), ('down', False,
                                                                                       'connectionrefusederror')):
                    Box.mode = mode
                    cb._imap_messages(0)
                    check(f'mailOk: a {mode} trip', rem.build_report()['mailOk'] is ok, str(rem.mail_ok))
                    if cls:
                        check(f'mailOk: {mode}: fail step=imap {cls}', rem.last_by_step.get('imap') == (None, cls),
                              str(rem.last_by_step))
                Box.mode = 'bad'
                check('imap_check: auth_failed', cb.imap_check() == (False, 'auth_failed'))
        finally:
            imaplib.IMAP4_SSL, cb.IMAP_USER, cb.IMAP_APP_PASSWORD = saved
    clock = Clock()
    model = WorkerModel(clock, autoConfirm=True)
    rem = make_remote(model, clock, seed_hold=lambda *a: None)
    rem.claim(wait=0)
    sup = idle_supervisor()
    run = M.RemoteRun(rem, sup, clock=clock)
    saved = cb.imap_check
    cb.imap_check = lambda: (False, 'web_login_required')
    try:
        run.tick()
        clock.advance(remote.REPORT_EVERY_SEC)
        run.tick()
        check('mailOk: the run-start check reaches the report', model.reports[-1].get('mailOk') is False,
              str(model.reports[-1].get('mailOk')))
    finally:
        cb.imap_check = saved
        _cleanup(sup)


def test_private_log_lines():
    """Private lines carry an ISO time with its offset; every event is logged privately with its seq."""
    lines = []
    saved = bh._log_handler
    bh._log_handler = lines.append
    try:
        bh.log('hello')
        clock = Clock()
        rem = make_remote(WorkerModel(clock), clock, seed_hold=lambda *a: None, log=bh.log)
        rem.event('error', detail='imap_auth_failed')
        rem.on_event('hold', {'date': TARGET, 'hotel': NAGU})
    finally:
        bh._log_handler = saved
    check('log: ISO time with offset', re.match(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2} hello\Z',
                                                lines[0]) is not None, lines[0])
    check('log: an event with its seq', any(ln.endswith('event seq=1 kind=error detail=imap_auth_failed') for ln in lines),
          str(lines))
    check('log: the hold event names the stay (private)', any(f'kind=hold date={TARGET} hotel={NAGU}' in ln
                                                              for ln in lines), str(lines))


def test_scan_history(port):
    """One ScanEntry per scan cycle (t, ok, ms, avail; a failure's code), codes and counts only; sent with each report
    and dropped once a report is answered; the newest SCANS_PER_REPORT kept through an outage."""
    with T.Env(port):
        clock = Clock()
        model = WorkerModel(clock)
        rem = make_remote(model, clock)
        rem.claim(wait=0)
        bh.TARGET_DATES = [TARGET, IDLE_DAY]
        STATE.fail_once['/calendar_apply/calendar_select'] = [503]
        with Hooks(rem):
            t, stop = T._run_scanner(T.MONTH, M._month_dates(T.MONTH), 'HIST')
            try:
                T._wait_for(lambda: len([e for e in rem.scans_log if e['ok']]) >= 2)
            finally:
                stop.set()
                t.join(10)
        log = list(rem.scans_log)
        bad = [e for e in log if not e['ok']]
        good = [e for e in log if e['ok']]
        check('scans: a failed cycle has its code', bad and bad[0]['code'] == 'http_503' and bad[0]['avail'] == 0,
              str(bad))
        check('scans: a good cycle counts the dates showing vacancies', good and good[0]['avail'] == 1, str(good))
        check('scans: ms are whole milliseconds', all(isinstance(e['ms'], int) and e['ms'] >= 0 for e in log), str(log))
        check('scans: codes and counts only', all(set(e) <= {'n', 't', 'ok', 'ms', 'avail', 'code'} for e in log)
              and TARGET not in json.dumps(log), str(log))
        rem.report()
        sent = model.reports[-1]['scansLog']
        check('scans: sent with the report', len(sent) == len(log) and 'n' not in sent[0], str(sent[:2]))
        check('scans: dropped once acknowledged', rem.scans_log == [], str(rem.scans_log))
        model.down = True
        for i in range(remote.SCANS_PER_REPORT + 12):
            rem.on_event('scan', {'ok': True, 'available': [], 'ms': i})
            rem.report()
        check('scans: an outage keeps the newest 30', len(rem.scans_log) == remote.SCANS_PER_REPORT
              and rem.scans_log[-1]['ms'] == remote.SCANS_PER_REPORT + 11, str(len(rem.scans_log)))
        model.down = False
        rem.on_event('scan', {'ok': False, 'code': 'Not A Code!', 'ms': -3})
        rem.report()
        check('scans: the backlog sent at once, capped', len(model.reports[-1]['scansLog']) == remote.SCANS_PER_REPORT
              and model.reports[-1]['scansLog'][-1] == {'t': model.reports[-1]['lastScanAt'], 'ok': False, 'ms': 0,
                                                         'avail': 0, 'code': 'error'}, str(model.reports[-1]['scansLog'][-1]))


def test_workflow_timings():
    """its-runner.yml's timings nest (parsed by hand: the stdlib has no YAML): the last hold ITS_RUN_MIN after the
    start, plus main.py's drain and a margin, inside the Run step's timeout, inside the job's; the Worker's LATE_AFTER
    longer than the schedule's period; the gate skips ticks while a run younger than ITS_RUN_MIN − one period is in
    progress, the run job alone holds the concurrency group; a run that lasted ITS_HANDOFF_AFTER_MIN hands off (the
    handoff job alone may dispatch); its.yml runs on a change to it; its-health.yml is inert without its secret and
    reads no other."""
    root = os.path.dirname(ITS_DIR)
    wf = lambda name: open(os.path.join(root, '.github', 'workflows', name), encoding='utf-8').read()
    y = wf('its-runner.yml')
    num = lambda pat, text=y: int(re.search(pat, text, re.M).group(1))
    run_min, skip_min = num(r'^  ITS_RUN_MIN: (\d+)'), num(r'^  ITS_SKIP_YOUNGER_MIN: (\d+)')
    jobs = re.split(r'^  (?=[a-z]+:\n)', y.split('\njobs:\n', 1)[1], flags=re.M)
    job = {j.split(':', 1)[0]: j for j in jobs if j.strip()}
    job_timeout = num(r'^    timeout-minutes: (\d+)', job['run'])
    step = job['run'].split('- name: Run\n', 1)[1].split('\n      - ', 1)[0]
    step_timeout = num(r'^        timeout-minutes: (\d+)', step)
    drain_min = M.DRAIN_SEC / 60
    check('workflow: run + drain + 5 < the Run step\'s timeout < the job\'s',
          run_min + drain_min + 5 < step_timeout < job_timeout, f'{run_min} + {drain_min} + 5, {step_timeout}, {job_timeout}')
    check('workflow: the deadline is ITS_RUN_MIN from the start', 'deadline=$((START + ITS_RUN_MIN * 60))' in step)
    run_line = next(ln.strip() for ln in step.splitlines() if 'main.py' in ln)
    check('workflow: restart.py runs main.py, both with the one deadline (a restart never extends it)',
          run_line.startswith('exec python restart.py "$deadline" xvfb-run ') and run_line.endswith(
              'python main.py --remote --deadline "$deadline"') and step.count('main.py') == 1, run_line)
    check('workflow: the restarts fit the step: their backoffs end MIN_LEFT before the deadline, then one drain',
          restart.MIN_LEFT_SEC > 0 and sum(restart.BACKOFF_SEC) < run_min * 60 and restart.RESTARTS == 5
          and restart.BACKOFF_SEC == (15, 30, 60, 120, 300))
    minutes = sorted(int(m) for m in re.search(r"cron: '([0-9,]+) \* \* \* \*'", y).group(1).split(','))
    period = min((b - a) % 60 or 60 for a, b in zip(minutes, minutes[1:] + minutes[:1]))
    ts = open(os.path.join(root, 'app', 'src', 'lib', 'its', 'contract.ts'), encoding='utf-8').read()
    late = num(r'export const LATE_AFTER_SEC = (\d+) \* 60;', ts)
    check('workflow: LATE_AFTER is longer than the schedule\'s period', late > period, f'{late} vs {period}')
    check('workflow: the gate skips only while the next tick is not the last of a run',
          0 < skip_min == run_min - period, f'{skip_min} vs {run_min} − {period}')
    check('workflow: the gate has no concurrency; the run job holds the group',
          not re.search(r'^ +concurrency:', job['gate'], re.M) and 'group: its-runner' in job['run'] and 'needs: gate' in job['run']
          and "needs.gate.outputs.go == '1'" in job['run'] and '\nconcurrency' not in y)
    check('workflow: the gate asks for a schedule only, and goes when it cannot ask',
          'if [ "$GITHUB_EVENT_NAME" != schedule ]' in job['gate'] and "''|*[!0-9]*) echo \"go=1\"" in job['gate'])
    check('workflow: the private log kept 14 days', 'retention-days: 14' in y)
    hand, handoff_min = job['handoff'], num(r'^  ITS_HANDOFF_AFTER_MIN: (\d+)')
    nxt = job['run'].split('- name: Hand off?\n', 1)[1].split('\n      - ', 1)[0]
    check('workflow: only the handoff job may dispatch (actions: write), with no secret or environment',
          'actions: write' in hand and 'secrets.' not in hand and 'environment:' not in hand
          and 'actions: write' not in job['run'] and 'actions: write' not in job['gate'] and '\npermissions:\n  contents: read\n\n' in y)
    check('workflow: the handoff dispatches main after the run job, unless cancelled, the run said no, or another run is unfinished',
          'needs: run' in hand and "!cancelled() && needs.run.outputs.handoff == '1'" in hand
          and 'gh workflow run its-runner.yml -R "$GITHUB_REPOSITORY" --ref main' in hand
          and hand.index('gh run list') < hand.index('gh workflow run') and 'select(.databaseId != $GITHUB_RUN_ID)' in hand
          and 'for s in queued pending waiting requested in_progress' in hand
          and 'handoff: ${{ steps.next.outputs.run }}' in job['run'] and not re.search(r'^ +concurrency:', hand, re.M))
    check('workflow: a run hands off only after ITS_HANDOFF_AFTER_MIN, never after a cancel, and when the preflight says run',
          "if: ${{ !cancelled() && steps.pre.outputs.run == '1' }}" in nxt and '-lt "$ITS_HANDOFF_AFTER_MIN" ]' in nxt
          and 'python3 remote.py preflight || true' in nxt and 'id: next' in nxt and 0 < handoff_min < run_min)
    its = wf('its.yml')
    check('workflow: its.yml runs on a change to the runner\'s workflows, pushed or in a PR (one list)',
          its.count("- '.github/workflows/its-runner.yml'") == 1
          and its.count("- '.github/workflows/its-health.yml'") == 1 and 'paths: &paths\n' in its and its.count('paths: *paths\n') == 1)
    check('workflow: the Worker URL is remote.DEFAULT_URL (no ITS_WORKER_URL set)', 'ITS_WORKER_URL' not in y)
    h = wf('its-health.yml')
    check('health: asks remote.DEFAULT_URL', f'{remote.DEFAULT_URL}/health/its' in h)
    check('health: inert without its secret (before any request)',
          h.index('if [ -z "$ITS_HEALTH_TOKEN" ]') < h.index('curl ') and 'exit 0; fi' in h)
    check('health: no other secret, no environment', re.findall(r'secrets\.(\w+)', h) == ['ITS_HEALTH_TOKEN']
          and 'environment:' not in h)
    check('health: every field held to a code or a number before it is printed',
          'test("^[a-z_]{1,40}$")' in h and 'rm -f h.json' in h and h.index('rm -f h.json') < h.index('echo "$s"'))
    check('health: one its-alert issue, closed when healthy', 'gh issue create --label its-alert' in h
          and 'gh issue close' in h)


FAKE_CURL = """#!/bin/sh
# the test's curl: -o FILE gets $FAKE_BODY (if set), stdout the code; logs that it ran
echo curl >> "$FAKE_LOG"
out=
while [ $# -gt 0 ]; do [ "$1" = -o ] && out=$2; shift; done
[ -n "$FAKE_BODY" ] && [ -n "$out" ] && printf '%s' "$FAKE_BODY" > "$out"
printf '%s' "$FAKE_CODE"
[ "$FAKE_CODE" = 000 ] && exit 7
exit 0
"""
FAKE_GH = """#!/bin/sh
# the test's gh: answers run list / issue list from the env, logs every write
case "$1 $2" in
  "run list") printf '%s\\n' "$FAKE_PREV" ;;
  "issue list") printf '%s\\n' "$FAKE_OPEN" ;;
  "issue view") printf '%s\\n' "$FAKE_LAST" ;;
  *) printf '%s\\n' "$*" >> "$FAKE_LOG" ;;
esac
"""


def test_health_alert_script(tmpdir):
    """its-health.yml's step, run for real with bash and jq against a fake curl and gh: inert without its secret, red
    on one failure, the alert (health_unreachable) on the second in a row, codes only in what it posts, closed when
    healthy."""
    import shutil
    import stat
    if not (shutil.which('bash') and shutil.which('jq')):
        check('health-script: bash and jq present (skipped)', True)
        return
    y = open(os.path.join(os.path.dirname(ITS_DIR), '.github', 'workflows', 'its-health.yml'), encoding='utf-8').read()
    block = y.split('        run: |\n', 1)[1]
    script = '\n'.join(ln[10:] for ln in block.split('\n'))
    d = os.path.join(tmpdir, 'health-bin')
    os.makedirs(d, exist_ok=True)
    for name, text in (('curl', FAKE_CURL), ('gh', FAKE_GH)):
        p = os.path.join(d, name)
        with open(p, 'w') as f:
            f.write(text)
        os.chmod(p, os.stat(p).st_mode | stat.S_IXUSR)

    def run(token='t0ken', code='200', body='', prev='', open_=''):
        log = os.path.join(tmpdir, 'health.log')
        open(log, 'w').close()
        env = {'PATH': d + os.pathsep + os.environ.get('PATH', ''), 'ITS_HEALTH_TOKEN': token, 'FAKE_CODE': code,
               'FAKE_BODY': body, 'FAKE_PREV': prev, 'FAKE_OPEN': open_, 'FAKE_LAST': '', 'FAKE_LOG': log,
               'GITHUB_RUN_ID': '555', 'GITHUB_SERVER_URL': 'https://github.com', 'GITHUB_REPOSITORY': 'o/r'}
        r = subprocess.run(['bash', '-e', '-c', script], cwd=tmpdir, env=env, capture_output=True, text=True,
                           timeout=60)
        return r.returncode, r.stdout + r.stderr, open(log).read()
    healthy = json.dumps({'verdict': 'healthy', 'reasons': [], 'lastSeenAgeSec': 5, 'phase': 'scanning',
                          'unsynced': 0, 'unsyncedAgeSec': None, 'lastPreflightAgeSec': 60})
    code, out, log = run(token='')
    check('health-script: no secret: green, no request', code == 0 and 'curl' not in log, out + log)
    code, out, log = run(code='000', prev='success')
    check('health-script: one failure: red, no issue', code == 1 and 'issue create' not in log, out + log)
    code, out, log = run(code='503', prev='failure')
    check('health-script: the second in a row: the alert', code == 1
          and 'issue create --label its-alert --title ITS alert: health_unreachable' in log, out + log)
    code, out, log = run(code='503', prev='failure', open_='12')
    check('health-script: an open alert gets a comment', code == 1 and 'issue comment 12' in log, out + log)
    bad = json.dumps({'verdict': 'degraded', 'reasons': ['human_needed', TARGET], 'lastSeenAgeSec': 5,
                      'phase': 'scanning', 'unsynced': 0, 'hotel': NAGU})
    code, out, log = run(body=bad)
    check('health-script: human_needed opens it, codes only', code == 0 and 'ITS alert: human_needed' in log
          and TARGET not in out + log and NAGU not in out + log, out + log)
    code, out, log = run(body=healthy, open_='12')
    check('health-script: healthy closes it', code == 0 and 'issue close 12' in log, out + log)


if __name__ == '__main__':
    if sys.argv[1:2] == ['--child']:
        sys.exit(child_main(int(sys.argv[2])))
    if sys.argv[1:2] == ['--signal-child']:
        sys.exit(signal_child_main(['--remote'] + sys.argv[2:]))
    T.main_(sys.argv[1:], Handler, globals())
