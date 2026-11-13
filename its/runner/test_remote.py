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
import re
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
    want = dict(ex['report'], **ex['reportNewer'])   # the runner sends the newer fields (an older Worker ignores them)
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
    """remote.py's copy of the contract's LIMITS, MAX_NAME, MAX_SITE_NAME, LEASE_SEC and REPORT_EVERY_SEC, read out
    of app/src/lib/its/contract.ts."""
    import re
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
    for name, mine in (('MAX_NAME', remote.NAME_MAX), ('MAX_SITE_NAME', remote.SITE_NAME_MAX),
                       ('LEASE_SEC', remote.LEASE_SEC), ('REPORT_EVERY_SEC', remote.REPORT_EVERY_SEC),
                       ('GUESTS_MIN', remote.GUESTS_MIN), ('GUESTS_MAX', remote.GUESTS_MAX),
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
    """Decision 2: with `search` only the facilities named there are applied for (normName exact; skip still wins);
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
    """Decision 1: a night with a `confirmed` entry in the Worker's record (any run's) is no longer scanned, held or
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
    """Decision 1 + the coordinator: two holds for one night with auto-confirm on, the ★ one confirmed first; the
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
    for status, detail, code in (('failed', 'hold_expired', 'hold_expired'), ('deferred', 'confirming_unacked',
                                 'confirming_unacked'), ('deferred', 'AUTO_CONFIRM is off', 'auto_off'),
                                 ('deferred', 'not_wanted: the date was removed', 'not_wanted'),
                                 ('deferred', '2026-12-05 is 9 day(s) away, inside', 'near_date'),
                                 ('failed', 'commit gate raised Boom()', 'leg_failed'), ('failed', None, 'leg_failed')):
        check(f'leg: human_needed detail {code}', cb.outcome_code(status, detail) == code, cb.outcome_code(status, detail))


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
