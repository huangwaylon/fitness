"""The runner's side of the its-bot Worker: claim, settings, reports, the bookings record, the lease fence.

The contract is app/src/lib/its/contract.ts (RunnerReport, RunnerConfig, BookingInput, ClaimInput, LEASE_SEC,
REPORT_EVERY_SEC), mirrored here by hand; test_remote.py checks this side against its/contract-example.json. Stdlib
only (urllib): the runner must still hold and record a room without pydoll.

`Remote` is the run's state. `on_event` is book_hotels' `_event_sink`: it counts scans, failures and solves, turns
holds and outcomes into booking entries and events, and keeps `available`/`filtered` to changes of a date's offered
set. `hold_gate` (book_hotels' `_hold_gate`) and `commit_gate` (confirm_booking's `_commit_gate`) are the fence:

- **No new hold and no Chrome commit unless the lease was renewed within LEASE_SEC − 60 s** (FENCE_SEC). A runner cut
  off from the Worker for that long may have been replaced; two runners booking is the failure this exists for.
- **No new hold while a booking entry is unsynced and the Worker has been unreachable > 2 min**: the Worker's record
  is what stops the next run applying again for what this one holds.
- **A `confirming` entry must be acknowledged before Chrome's 申込する** (stage 'apply'), so the record shows an
  application may exist even if this runner dies mid-commit.
- No new hold once `no_new_holds` is set (the deadline, a stop, a ban).

Booking entries are queued and sent at once (the control loop is woken) and again with every report until the Worker
answers with them in its record. Events carry a per-run `seq`; the Worker's `ackSeq` drops what it has. Every answer
is a RunnerConfig: its settings are applied (`on_settings`), its bookings seed holds.json (a hotel held for a date is
never applied for again, whichever run held it), its lease renews the fence.

Never logs the token. Dates and hotel names go to the Worker (members only) and the private log, never `logs.public`.
"""
import json
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

LEASE_SEC = 300
REPORT_EVERY_SEC = 30
FENCE_SEC = LEASE_SEC - 60
UNSYNCED_OUTAGE_SEC = 120
CLAIM_WAIT_SEC = 6 * 60
CLAIM_RETRY_SEC = 15
INTERVALS_SEC = (15, 30, 60, 120, 300)
GUESTS_MIN, GUESTS_MAX = 1, 6
EVENTS_PER_REPORT = 40
EVENTS_QUEUED_MAX = 400
IMPORTANT_EVENTS = ('hold', 'confirmed', 'human_needed', 'ban')
SEEN_MAX = 300
DETAIL_MAX = 200
HOLD_UNRESOLVED_SEC = 30 * 60    # a hold younger than this at the end of a run, never confirmed: human_needed
BOOKING_KINDS = ('hold', 'confirming', 'confirmed', 'failed')
STOP_REASONS = ('paused', 'mode_off', 'no_dates', 'lease_lost')
DEFAULT_URL = 'https://its-bot.island-fund-relay.workers.dev'


class Client:
    """JSON over HTTPS with the runner's Bearer token. `call` never raises: `(status, obj)`, status 0 on a transport
    failure, obj None when the body isn't JSON."""

    def __init__(self, base, token, timeout=20, opener=None):
        self.base = base.rstrip('/')
        self._token = token
        self.timeout = timeout
        self._open = opener or urllib.request.urlopen

    def call(self, method, path, body=None):
        data = None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(self.base + path, data=data, method=method, headers={
            'Authorization': f'Bearer {self._token}',
            'Content-Type': 'application/json',
            'User-Agent': 'its-runner',
        })
        try:
            with self._open(req, timeout=self.timeout) as r:
                status, raw = r.status, r.read(1 << 20)
        except urllib.error.HTTPError as e:
            status, raw = e.code, (e.read(1 << 16) if e.fp else b'')
        except Exception:
            return 0, None
        try:
            return status, json.loads(raw.decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            return status, None


# ── the contract's shapes ────────────────────────────────────────────

def _is_int(x):
    return isinstance(x, int) and not isinstance(x, bool)


def _strs(x):
    return isinstance(x, list) and all(isinstance(s, str) for s in x)


def parse_settings(s):
    """An ItsSettings, or None if it isn't one (a garbled answer must not become the settings)."""
    if not isinstance(s, dict) or s.get('v') != 1:
        return None
    ok = (isinstance(s.get('paused'), bool) and s.get('intervalSec') in INTERVALS_SEC
          and _strs(s.get('dates')) and _is_int(s.get('guests')) and GUESTS_MIN <= s['guests'] <= GUESTS_MAX
          and _strs(s.get('skip')) and _strs(s.get('priority')) and isinstance(s.get('autoConfirm'), bool))
    return s if ok else None


def parse_booking(b):
    if not isinstance(b, dict):
        return None
    ok = (isinstance(b.get('id'), str) and b.get('kind') in BOOKING_KINDS and isinstance(b.get('date'), str)
          and isinstance(b.get('hotel'), str) and isinstance(b.get('runId'), str)
          and ('number' not in b or isinstance(b['number'], str)))
    return b if ok else None


def parse_lease(x):
    if x is None:
        return None
    if isinstance(x, dict) and isinstance(x.get('holder'), str) and x.get('host') in ('actions', 'local') \
            and isinstance(x.get('until'), (int, float)):
        return x
    return False


def parse_config(c):
    """A RunnerConfig, or None."""
    if not isinstance(c, dict) or parse_settings(c.get('settings')) is None:
        return None
    if not isinstance(c.get('bookings'), list) or any(parse_booking(b) is None for b in c['bookings']):
        return None
    if parse_lease(c.get('lease')) is False or not isinstance(c.get('stop'), bool):
        return None
    if c.get('stopReason') not in STOP_REASONS + (None,) or not _is_int(c.get('ackSeq')):
        return None
    return c


def parse_claim(c):
    """A ClaimReply, or None."""
    if not isinstance(c, dict) or not isinstance(c.get('ok'), bool) or not parse_lease(c.get('lease')):
        return None
    if c['ok'] and parse_config(c.get('config')) is None:
        return None
    return c


class Remote:
    """One run's link to the Worker (module docstring). Thread-safe: booking threads, the confirm worker and the
    URL monitor call `on_event` and the gates while the control loop reports."""

    def __init__(self, client, run_id, host='actions', sha=None, run_url=None, deadline=None,
                 clock=time.time, on_settings=None, seed_hold=None, log=None, public=None):
        self.client = client
        self.run_id, self.host, self.sha, self.run_url = run_id, host, sha, run_url
        self.clock = clock
        self.on_settings = on_settings or (lambda s: None)
        self.seed_hold = seed_hold or (lambda date, hotel: None)
        self.log = log or (lambda msg: None)
        self.public = public or (lambda event, **fields: None)   # logs.public: counts and codes only
        self.lock = threading.RLock()
        self.urgent = threading.Event()   # wakes the control loop: report now
        self.started_at = clock()
        self.deadline = deadline          # epoch s: no new holds after it

        self.seq = 0
        self.events = []                  # EventInput with seq, not yet acknowledged
        self.ack_seq = 0
        self.unsynced = {}                # id -> BookingInput, insertion-ordered
        self.seeded = set()               # booking ids already written to holds.json
        self.config = None
        self.settings = None

        self.lease_ok_at = None           # when the Worker last confirmed this run holds the lease
        self.contact_at = None            # last good answer
        self.outage_since = None          # first failed call since the last good answer
        self.last_status = None           # the last call's HTTP status (0: transport)

        self.phase = 'starting'
        self.solving = False
        self.no_new_holds = None          # a reason code once holds stop (deadline, stopping, ban)
        self.banned = False
        self.scans = 0
        self.scan_failures = 0            # consecutive
        self.last_scan_at = None
        self.last_ok_at = None
        self.available_now = 0            # target dates available at the last good read
        self.solves = {'ok': 0, 'failed': 0, 'lastOkAt': None, 'lastSecs': None, 'lastSpot': None}
        self.failures_by_step = {}
        self.last_by_step = {}            # step -> (status, cls) of its latest failure
        self.last_error = None
        self.seen = set()
        self.offered = {}                 # date -> frozenset of names offered (change detection)
        self.holds = {}                   # (date, hotel) -> when held, this run
        self.resolved = set()             # (date, hotel) with a known outcome
        self.counts = {'hold': 0, 'confirmed': 0, 'human_needed': 0, 'refused': 0}

    def _ms(self, t=None):
        return int((self.clock() if t is None else t) * 1000)

    # ── events and the record ──

    def event(self, kind, date=None, hotel=None, detail=None, urgent=False):
        with self.lock:
            self.seq += 1
            e = {'seq': self.seq, 'kind': kind}
            if date:
                e['date'] = date
            if hotel:
                e['hotel'] = hotel
            if detail:
                e['detail'] = str(detail)[:DETAIL_MAX]
            self.events.append(e)
            if len(self.events) > EVENTS_QUEUED_MAX:
                # A long outage: drop the oldest routine event, never an important one.
                drop = next((x for x in self.events if x['kind'] not in IMPORTANT_EVENTS), None)
                if drop is not None:
                    self.events.remove(drop)
        if urgent:
            self.urgent.set()
        return e['seq']

    def record(self, kind, date, hotel, number=None):
        """Queue a BookingInput; the control loop sends it at once. Returns its id."""
        with self.lock:
            self.seq += 1
            bid = f'{self.run_id}:{self.seq}'
            b = {'id': bid, 'kind': kind, 'date': date, 'hotel': hotel, 'runId': self.run_id}
            if number:
                b['number'] = number
            self.unsynced[bid] = b
        self.urgent.set()
        return bid

    def error(self, step, status=None, cls='error'):
        with self.lock:
            self.failures_by_step[step] = self.failures_by_step.get(step, 0) + 1
            self.last_error = {'at': self._ms(), 'step': step, 'status': status, 'cls': cls}
            self.last_by_step[step] = (status, cls)

    def on_event(self, kind, f):
        """book_hotels' `_event_sink`."""
        date, hotel = f.get('date'), f.get('hotel')
        with self.lock:
            if kind == 'scan':
                self.scans += 1
                self.last_scan_at = self._ms()
                if f.get('ok'):
                    self.scan_failures = 0
                    self.last_ok_at = self.last_scan_at
                    self.available_now = len(f.get('available') or [])
                else:
                    self.scan_failures += 1
            elif kind == 'fail':
                self.error(f.get('step') or 'unknown', f.get('status'), f.get('cls') or 'error')
            elif kind == 'offered':
                names = [n for n in f.get('names') or [] if isinstance(n, str)]
                for n in names:
                    if len(self.seen) < SEEN_MAX:
                        self.seen.add(n)
                key = frozenset(names)
                if names and self.offered.get(date) != key:
                    self.offered[date] = key
                    self.event('available' if f.get('eligible') else 'filtered', date, ' / '.join(names))
            elif kind == 'hold':
                self.counts['hold'] += 1
                self.holds[(date, hotel)] = self.clock()
                self.record('hold', date, hotel)
                self.event('hold', date, hotel, urgent=True)
                self.public('hold', n=self.counts['hold'])
            elif kind == 'confirmed':
                self.counts['confirmed'] += 1
                self.resolved.add((date, hotel))
                self.record('confirmed', date, hotel, number=f.get('number') or None)
                self.event('confirmed', date, hotel, f.get('number') or None, urgent=True)
                self.public('confirmed', n=self.counts['confirmed'])
            elif kind == 'human_needed':
                self.counts['human_needed'] += 1
                self.resolved.add((date, hotel))
                if f.get('failed'):
                    self.record('failed', date, hotel)
                self.event('human_needed', date, hotel, f.get('detail'), urgent=True)
                self.public('human_needed', n=self.counts['human_needed'], detail=f.get('detail'))
            elif kind == 'hold_refused':
                self.counts['refused'] += 1
            elif kind == 'ban':
                if not self.banned:
                    self.banned = True
                    self.no_new_holds = 'ban'
                    self.error('scan', 503, 'ban')
                    self.event('ban', urgent=True)
                    self.public('ban')
            elif kind == 'solving':
                self.solving = True
            elif kind == 'solve':
                self.solving = False
                if f.get('ok'):
                    self.solves['ok'] += 1
                    self.solves['lastOkAt'] = self._ms()
                    self.solves['lastSecs'] = f.get('secs')
                    self.solves['lastSpot'] = f.get('spot') if f.get('spot') in ('centre', 'left') else None
                    self.public('solve', ok=1, secs=f.get('secs'), spot=self.solves['lastSpot'])
                else:
                    self.solves['failed'] += 1
                    self.error('solve', None, f.get('cls') or 'no_token')
                    self.event('solve_failed', detail=f.get('cls') or 'no_token')
                    self.public('solve', ok=0, secs=f.get('secs'), cls=f.get('cls') or 'no_token')

    def unresolved_holds(self):
        """Holds this run took < 30 min ago with no outcome: each gets a human_needed (the run is ending)."""
        now = self.clock()
        with self.lock:
            out = [k for k, t in self.holds.items() if k not in self.resolved and now - t < HOLD_UNRESOLVED_SEC]
        for date, hotel in out:
            self.on_event('human_needed', {'date': date, 'hotel': hotel, 'detail': 'run_ended'})
        return len(out)

    # ── the fence ──

    def fenced(self):
        """True while the lease was renewed within FENCE_SEC."""
        with self.lock:
            return self.lease_ok_at is not None and self.clock() - self.lease_ok_at <= FENCE_SEC

    def outage_sec(self):
        with self.lock:
            return 0.0 if self.outage_since is None else self.clock() - self.outage_since

    def hold_gate(self):
        with self.lock:
            if self.no_new_holds:
                return False, self.no_new_holds
            if not self.fenced():
                return False, 'lease_stale'
            if self.unsynced and self.outage_sec() > UNSYNCED_OUTAGE_SEC:
                return False, 'bookings_unsynced'
        return True, ''

    def commit_gate(self, date, hotel, stage):
        if not self.fenced():
            return False, 'lease_stale'
        if stage != 'apply':
            return True, ''
        bid = self.record('confirming', date, hotel)
        self.post_bookings()
        with self.lock:
            acked = bid not in self.unsynced
        return (True, '') if acked else (False, 'confirming_unacked')

    # ── talking to the Worker ──

    def _failed(self, status, cls=None):
        with self.lock:
            self.last_status = status
            if self.outage_since is None:
                self.outage_since = self.clock()
        self.error('worker', status, cls or ('transport' if status == 0 else f'http_{status}'))

    def absorb(self, cfg):
        """Take a RunnerConfig: contact, lease, acks, settings, the record."""
        with self.lock:
            now = self.clock()
            self.contact_at, self.outage_since, self.last_status = now, None, 200
            lease = cfg.get('lease')
            if lease and lease['holder'] == self.run_id and lease['until'] > self._ms(now):
                self.lease_ok_at = now
            else:
                # Someone else's (or none): the fence closes now, not FENCE_SEC later.
                self.lease_ok_at = None
            self.config = cfg
            self.ack_seq = max(self.ack_seq, cfg['ackSeq'])
            self.events = [e for e in self.events if e['seq'] > self.ack_seq]
            have = {b['id'] for b in cfg['bookings']}
            for bid in [i for i in self.unsynced if i in have]:
                del self.unsynced[bid]
            fresh = [b for b in cfg['bookings'] if b['id'] not in self.seeded]
            self.seeded.update(b['id'] for b in fresh)
            changed = self.settings != cfg['settings']
            self.settings = cfg['settings']
        for b in fresh:
            self.seed_hold(b['date'], b['hotel'])
        if changed:
            self.on_settings(cfg['settings'])

    def _call_config(self, method, path, body=None):
        status, obj = self.client.call(method, path, body)
        cfg = parse_config(obj) if status == 200 else None
        if cfg is None:
            self._failed(status, 'bad_answer' if status == 200 else None)
            return None
        self.absorb(cfg)
        return cfg

    def claim(self, wait=None, sleep=None):
        """POST /runner/claim until granted or CLAIM_WAIT_SEC passes. `(config, why)`: why is '' when granted, else
        'lease_lost' (someone else's lease didn't expire) or 'unreachable'."""
        sleep = sleep or time.sleep
        until = self.clock() + (CLAIM_WAIT_SEC if wait is None else wait)
        why = 'unreachable'
        while True:
            status, obj = self.client.call('POST', '/runner/claim', {'runId': self.run_id, 'host': self.host})
            reply = parse_claim(obj) if status == 200 else None
            if reply and reply['ok']:
                self.absorb(reply['config'])
                return reply['config'], ''
            if reply:
                why = 'lease_lost'
                self.log(f"claim refused: the lease is held until {reply['lease']['until']}")
            else:
                self._failed(status, 'bad_answer' if status == 200 else None)
            if self.clock() + CLAIM_RETRY_SEC > until:
                return None, why
            sleep(CLAIM_RETRY_SEC)

    def post_bookings(self):
        """Send the unsynced entries; True when none is left."""
        with self.lock:
            batch = list(self.unsynced.values())
        if not batch:
            return True
        # ?runId= so the answer carries this run's ackSeq and lease (the Worker's, not the body's).
        self._call_config('POST', '/runner/bookings?runId=' + urllib.parse.quote(self.run_id, safe=''), batch)
        with self.lock:
            return not self.unsynced

    def build_report(self):
        with self.lock:
            return {
                'v': 1, 'runId': self.run_id, 'runUrl': self.run_url, 'sha': self.sha, 'host': self.host,
                'startedAt': self._ms(self.started_at),
                'deadline': None if self.deadline is None else self._ms(self.deadline),
                'phase': self.phase, 'scans': self.scans, 'scanFailures': self.scan_failures,
                'lastScanAt': self.last_scan_at, 'lastOkAt': self.last_ok_at,
                'solves': dict(self.solves), 'failuresByStep': dict(self.failures_by_step),
                'lastError': dict(self.last_error) if self.last_error else None,
                'unsynced': len(self.unsynced),
                'events': [dict(e) for e in self.events[:EVENTS_PER_REPORT]],
                'seen': sorted(self.seen)[:SEEN_MAX],
            }

    def report(self):
        """Bookings first (they gate holds), then the heartbeat. The RunnerConfig, or None."""
        self.urgent.clear()
        self.post_bookings()
        return self._call_config('POST', '/runner/report', self.build_report())
