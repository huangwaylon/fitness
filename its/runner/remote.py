"""The runner's side of the its-bot Worker: claim, settings, reports, the bookings record, the lease fence.

The contract is app/src/lib/its/contract.ts (RunnerReport, RunnerConfig, BookingInput, ClaimInput, LEASE_SEC,
REPORT_EVERY_SEC), mirrored here by hand; test_remote.py checks this side against its/contract-example.json. Stdlib
only (urllib): the runner must still hold and record a room without pydoll.

`Remote` is the run's state. `on_event` is book_hotels' `_event_sink`: it counts scans, failures and solves, turns
holds and outcomes into booking entries and events, and keeps `available`/`filtered` to changes of a date's offered
set. `hold_gate` (book_hotels' `_hold_gate`) and `commit_gate` (confirm_booking's `_commit_gate`) are the fence:

- **No new hold and no Chrome commit unless `now < lease.until − 60 s`**, read from the lease itself (FENCE_MARGIN_SEC).
  Only a claim or a report answer extends it (the Worker renews the lease there); a /runner/bookings answer can close
  it (someone else's lease) but never reopen it. A runner cut off from the Worker that long may have been replaced;
  two runners booking is the failure this exists for.
- **No new hold while a booking entry is unsynced and the Worker has been unreachable > 2 min**, or at once while the
  Worker refuses entries because its record is full (507): the Worker's record is what stops the next run applying
  again for what this one holds.
- **A `confirming` entry must be acknowledged before Chrome's 申込する** (stage 'apply'), so the record shows an
  application may exist even if this runner dies mid-commit.
- No new hold once `no_new_holds` is set (a stop, a ban) or the deadline has passed.

An entry the Worker refuses (409 `id_conflict`: the id is in the record with other content, or an answer whose record
holds other content under our id, number included; 400: not a valid entry) is a bug, never an ack: it stays queued
(unsynced, in the reports' count), is logged HUMAN NEEDED and reported as a human_needed event once (`id_conflict`,
`bad_booking`), and is retried on its own with each report (`conflicts` keeps it out of the batch, which the Worker
refuses whole: one at a time, the rest still land). A 507 `record_full` keeps the entries queued too.

Booking entries are queued and sent at once (the control loop is woken) and again with every report until the Worker
answers with them in its record. Events carry a per-run `seq`; the Worker's `ackSeq` drops what it has. Every answer
is a RunnerConfig: its settings are applied (`on_settings`) when they are newer (`updatedAt`: answers from two threads
can arrive out of order), its bookings seed holds.json (a hotel held for a date is never applied for again, whichever
run held it), its lease (from a claim or a report) renews the fence. The nights with a `confirmed` entry (the record's,
and this run's own at once) go to `on_done` (book_hotels.set_done_dates): no longer scanned, held or confirmed again.
The settings are taken tolerantly (`search`, the allow-list, optional; any whole interval from the floor) and the
report says which it applied (`settingsAt`), so an older or a newer Worker both work.

Never logs the token. Dates and hotel names go to the Worker (members only) and the private log, never `logs.public`.
"""
import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

LEASE_SEC = 300
REPORT_EVERY_SEC = 30
FENCE_MARGIN_SEC = 60         # no hold or commit within this of the lease's end
UNSYNCED_OUTAGE_SEC = 120
CLAIM_WAIT_SEC = 6 * 60
CLAIM_RETRY_SEC = 15
CLAIM_LOG_EVERY_SEC = 60      # an unreachable Worker during the claim's wait: one line (private + public) a minute
INTERVALS_SEC = (15, 30, 60, 120, 300)   # the contract's choices; any whole interval >= INTERVAL_FLOOR_SEC is taken
INTERVAL_FLOOR_SEC = INTERVALS_SEC[0]    # the scan's floor (book_hotels.MIN_RETRY_DELAY): the Worker validates the rest
HOLD_SEC = 30 * 60                       # the site's hold: a hold's mail must be followed within this
GUESTS_MIN, GUESTS_MAX = 1, 6
# The contract's LIMITS (the Worker's bounds on a request; test_remote reads contract.ts to check this copy).
LIMITS = {'body': 64 * 1024, 'bookingsPerPost': 50, 'eventsPerReport': 100, 'seenPerReport': 300, 'eventHotel': 2000,
          'detail': 200, 'number': 40, 'steps': 30}
NAME_MAX = 80                # the contract's MAX_NAME: a priority substring
SITE_NAME_MAX = 200          # MAX_SITE_NAME: a facility name as the site serves it (a booking's, a seen one), never cut
# What the runner sends, inside those (a request over them is a 400, retried forever).
BODY_MAX = LIMITS['body'] - 4096     # bytes, with room for the JSON around what _fit measures
BOOKINGS_PER_POST = LIMITS['bookingsPerPost']
EVENTS_PER_REPORT = 40               # per report; the rest wait for the next
SEEN_MAX = LIMITS['seenPerReport']
DETAIL_MAX = LIMITS['detail']
STEPS_MAX = LIMITS['steps']
OFFERED_MAX = 600                    # an `available` event's joined names (≤ LIMITS.eventHotel)
NUMBER_MAX = LIMITS['number']
EVENTS_QUEUED_MAX = 400
SCANS_PER_REPORT = 30                # the contract's scansLog cap: one entry per scan cycle, the newest kept
# The contract's arrays (test_remote checks each against contract.ts). `prev_unclean` is the Worker's own event (a claim
# that took over an unreleased lease): known, never sent by a runner (SENT_EVENT_KINDS).
IMPORTANT_EVENTS = ('hold', 'confirmed', 'human_needed', 'ban', 'prev_unclean')
EVENT_KINDS = ('run_start', 'run_end', 'available', 'filtered', 'hold', 'confirmed', 'human_needed', 'ban',
               'solve_failed', 'error', 'prev_unclean')
SENT_EVENT_KINDS = tuple(k for k in EVENT_KINDS if k != 'prev_unclean')
PHASES = ('starting', 'solving', 'scanning', 'draining', 'stopping')
HOSTS = ('actions', 'local')
HOLD_UNRESOLVED_SEC = HOLD_SEC   # a hold younger than this at the end of a run, never confirmed: human_needed
BOOKING_KINDS = ('hold', 'confirming', 'confirmed', 'failed')
STOP_REASONS = ('paused', 'mode_off', 'no_dates', 'lease_lost')
DEFAULT_URL = 'https://its-bot.island-fund-relay.workers.dev'

# A refusal of an entry, not of the call: 409 id_conflict, 400 (bad_booking and the like).
REFUSED_ENTRY = (400, 409)

_BAD_CHARS = re.compile('[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]')
_ID_RE = re.compile(r'[A-Za-z0-9._:-]{1,64}\Z')


def _units(s):
    """A string's length as the Worker and the contract count it (JavaScript's `length`): UTF-16 code units, so an
    astral character (𠮷, an emoji) is 2."""
    return len(s.encode('utf-16-le', 'surrogatepass')) // 2


def _text(s, limit):
    """A name or detail as the Worker accepts it: no controls or bidi overrides, trimmed, capped at `limit` UTF-16
    units (whole code points); None if empty."""
    if s is None:
        return None
    s = _BAD_CHARS.sub('', str(s)).strip()
    if _units(s) > limit:
        n = 0
        for i, c in enumerate(s):
            n += 2 if ord(c) > 0xFFFF else 1
            if n > limit:
                s = s[:i].rstrip()
                break
    return s or None


def _id(s, default):
    return s if isinstance(s, str) and _ID_RE.match(s) else default


def _same_entry(have, sent):
    """The record's entry is the one we sent (an ack), not another under the same id."""
    return all(have.get(k) == sent.get(k) for k in ('kind', 'date', 'hotel', 'runId', 'number'))


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
    """An ItsSettings, or None if it isn't one (a garbled answer must not become the settings). Tolerant of what the
    Worker may add: any whole interval from the floor up (the Worker holds it to the contract's choices), and the
    allow-list `search` optional (absent or null: the skip-list rule)."""
    if not isinstance(s, dict) or s.get('v') != 1:
        return None
    ok = (isinstance(s.get('paused'), bool) and _is_int(s.get('intervalSec')) and s['intervalSec'] >= INTERVAL_FLOOR_SEC
          and _strs(s.get('dates')) and _is_int(s.get('guests')) and GUESTS_MIN <= s['guests'] <= GUESTS_MAX
          and _strs(s.get('skip')) and _strs(s.get('priority')) and isinstance(s.get('autoConfirm'), bool)
          and (s.get('search') is None or _strs(s['search'])))
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
                 clock=time.time, on_settings=None, seed_hold=None, on_done=None, log=None, public=None):
        self.client = client
        self.run_id, self.host, self.sha, self.run_url = run_id, host, sha, run_url
        self.clock = clock
        self.on_settings = on_settings or (lambda s: None)
        self.seed_hold = seed_hold or (lambda date, hotel: None)
        self.on_done = on_done or (lambda dates: None)   # nights with a confirmed booking (book_hotels.set_done_dates)
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
        self.conflicts = set()            # unsynced ids the Worker refused as an id conflict: sent one at a time
        self.record_full = False          # the last bookings post was a 507: the Worker's record takes no more
        self.seeded = set()               # booking ids already written to holds.json
        self.confirmed_here = set()       # nights this run confirmed (before the record has them)
        self.done = frozenset()           # nights with a confirmed booking: the record's and this run's
        self.config = None
        self.settings = None
        self._settings_lock = threading.Lock()   # one answer's settings applied at a time, the newest only

        self.lease_until = None           # epoch s: our lease's end, from the last claim/report answer
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
        self.counts = {'hold': 0, 'confirmed': 0, 'human_needed': 0, 'gate_closed': 0, 'skipped': 0}
        self.mail_ok = None               # the last IMAP check: True, False, None (none yet): the reports' mailOk
        self.scans_log = []               # ScanEntry per scan cycle, not yet acknowledged (SCANS_PER_REPORT newest)
        self._scan_n = 0                  # their running number (which ones a report's answer acknowledges)

    def _ms(self, t=None):
        return int((self.clock() if t is None else t) * 1000)

    # ── events and the record ──

    def event(self, kind, date=None, hotel=None, detail=None, urgent=False):
        with self.lock:
            self.seq += 1
            e = {'seq': self.seq, 'kind': kind}
            hotel, detail = _text(hotel, OFFERED_MAX), _text(detail, DETAIL_MAX)
            if date:
                e['date'] = date
            if hotel:
                e['hotel'] = hotel
            if detail:
                e['detail'] = detail
            self.events.append(e)
            self.log('event ' + ' '.join(f'{k}={v}' for k, v in e.items()))   # private: the record's seq, for the timeline
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
            b = {'id': bid, 'kind': kind, 'date': date, 'hotel': _text(hotel, SITE_NAME_MAX) or '?', 'runId': self.run_id}
            number = _text(number, NUMBER_MAX)
            if number:
                b['number'] = number
            self.unsynced[bid] = b
        self.urgent.set()
        return bid

    def error(self, step, status=None, cls='error'):
        step, cls = _id(step, 'unknown'), _id(cls, 'error')
        if not (_is_int(status) and 0 <= status < 1000):
            status = None
        with self.lock:
            if step not in self.failures_by_step and len(self.failures_by_step) >= STEPS_MAX - 1:
                step = 'other'
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
                self._log_scan(f)
            elif kind == 'imap':
                self.mail_ok = bool(f.get('ok'))
            elif kind == 'fail':
                self.error(f.get('step') or 'unknown', f.get('status'), f.get('cls') or 'error')
            elif kind == 'offered':
                names = [t for t in (_text(n, SITE_NAME_MAX) for n in f.get('names') or []) if t]
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
                self.confirmed_here.add(date)
                self.record('confirmed', date, hotel, number=f.get('number') or None)
                self.event('confirmed', date, hotel, f.get('number') or None, urgent=True)
                self.public('confirmed', n=self.counts['confirmed'])
            elif kind == 'skipped':
                # a hold whose night was confirmed meanwhile (at another facility): left to lapse, never filed
                self.resolved.add((date, hotel))
                self.counts['skipped'] += 1
                self.public('skip_confirmed_night', n=self.counts['skipped'])
            elif kind == 'human_needed':
                self.counts['human_needed'] += 1
                self.resolved.add((date, hotel))
                if f.get('failed'):
                    self.record('failed', date, hotel)
                self.event('human_needed', date, hotel, f.get('detail'), urgent=True)
                self.public('human_needed', n=self.counts['human_needed'], detail=f.get('detail'))
            elif kind == 'hold_refused':
                # each time the hold gate said no: once per scan cycle while it stays closed, plus a booking thread's
                # own asks (a count of closed-gate answers, not of holds lost)
                self.counts['gate_closed'] += 1
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
                if f.get('ok') is None:
                    pass   # deferred (Chrome busy filing): neither a solve nor a failure
                elif f.get('ok'):
                    self.solves['ok'] += 1
                    self.solves['lastOkAt'] = self._ms()
                    self.solves['lastSecs'] = f.get('secs')
                    self.solves['lastSpot'] = f.get('spot') if f.get('spot') in ('centre', 'left') else None
                    self.public('solve', ok=1, secs=f.get('secs'), spot=self.solves['lastSpot'])
                else:
                    self.solves['failed'] += 1
                    cls = _id(f.get('cls'), 'unsolved')
                    self.error('solve', None, cls)
                    self.event('solve_failed', detail=cls)
                    self.public('solve', ok=0, secs=f.get('secs'), cls=cls)
        if kind == 'confirmed':
            self._done_changed()   # at once: a second hold for this night queued behind it must not be filed

    def _log_scan(self, f):
        """One ScanEntry for the page's hour strip (codes and counts only: the dates stay out of it). Under the lock."""
        self._scan_n += 1
        e = {'n': self._scan_n, 't': self.last_scan_at, 'ok': bool(f.get('ok')),
             'ms': f['ms'] if _is_int(f.get('ms')) and f['ms'] >= 0 else 0,
             'avail': len(f.get('available') or []) if f.get('ok') else 0}
        if not e['ok']:
            e['code'] = _id(f.get('code'), 'error')
        self.scans_log.append(e)
        del self.scans_log[:-SCANS_PER_REPORT]   # a long outage keeps the newest

    def unresolved_holds(self):
        """Holds this run took < 30 min ago with no outcome: each gets a human_needed (the run is ending)."""
        now = self.clock()
        with self.lock:
            out = [k for k, t in self.holds.items() if k not in self.resolved and now - t < HOLD_UNRESOLVED_SEC]
        for date, hotel in out:
            self.on_event('human_needed', {'date': date, 'hotel': hotel, 'detail': 'run_ended'})
        return len(out)

    # ── the fence ──

    def lease_fresh(self):
        """True while our lease has more than FENCE_MARGIN_SEC to run."""
        with self.lock:
            return self.lease_until is not None and self.clock() < self.lease_until - FENCE_MARGIN_SEC

    def outage_sec(self):
        with self.lock:
            return 0.0 if self.outage_since is None else self.clock() - self.outage_since

    def hold_gate(self):
        with self.lock:
            if self.no_new_holds:
                return False, self.no_new_holds
            if self.deadline is not None and self.clock() >= self.deadline:
                return False, 'time_up'
            if not self.lease_fresh():
                return False, 'lease_stale'
            if self.unsynced and self.record_full:
                return False, 'record_full'
            if self.unsynced and self.outage_sec() > UNSYNCED_OUTAGE_SEC:
                return False, 'bookings_unsynced'
        return True, ''

    def commit_gate(self, date, hotel, stage):
        if not self.lease_fresh():
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

    def absorb(self, cfg, renew=False):
        """Take a RunnerConfig: contact, lease, acks, settings, the record. `renew`: a claim's or a report's answer,
        whose lease may extend the fence and whose `stop` is taken; any other answer's can only close the fence, and
        leaves `stop` as the last claim or report said."""
        with self.lock:
            now = self.clock()
            self.contact_at, self.outage_since, self.last_status = now, None, 200
            lease = cfg.get('lease')
            if not (lease and lease['holder'] == self.run_id):
                # Someone else's (or none): the fence closes now, not at our lease's end.
                self.lease_until = None
            elif renew:
                self.lease_until = max(self.lease_until or 0, lease['until'] / 1000)
            # Only a claim's or a report's answer says whether to stop: 開始 / 停止 don't move settings.updatedAt, so an
            # older /runner/bookings answer (the confirm worker's, sent before a 停止) could otherwise undo a newer stop.
            if renew or self.config is None:
                self.config = cfg
            else:
                self.config = dict(cfg, stop=self.config['stop'], stopReason=self.config['stopReason'])
            self.ack_seq = max(self.ack_seq, cfg['ackSeq'])
            self.events = [e for e in self.events if e['seq'] > self.ack_seq]
            have = {b['id']: b for b in cfg['bookings']}
            clash = []
            for bid in [i for i in self.unsynced if i in have]:
                if _same_entry(have[bid], self.unsynced[bid]):
                    del self.unsynced[bid]
                    self.conflicts.discard(bid)
                else:
                    clash.append(self.unsynced[bid])   # the record has this id with other content: not an ack
            fresh = [b for b in cfg['bookings'] if b['id'] not in self.seeded]
            self.seeded.update(b['id'] for b in fresh)
            self.done |= {b['date'] for b in cfg['bookings'] if b['kind'] == 'confirmed'}
        for b in clash:
            self._conflict(b, {'error': 'record_differs'})
        for b in fresh:
            self.seed_hold(b['date'], b['hotel'])
        self._take_settings(cfg['settings'])
        self._done_changed()

    def _done_changed(self):
        """Hand the nights with a confirmed booking (the record's, and this run's own before the record has them) to
        `on_done`. Only grows within a run: a confirmed entry stays in the record until its stay is long past."""
        with self.lock:
            self.done |= self.confirmed_here
            done = self.done
        self.on_done(done)

    def _take_settings(self, s):
        """Apply an answer's settings unless an answer with newer ones (a later `updatedAt`) was applied already:
        the control loop and the confirm worker both talk to the Worker, and their answers can cross. Equal stamps differ
        at most in `paused` and in past dates dropped, so either is fine."""
        with self._settings_lock:
            with self.lock:
                stamp = s.get('updatedAt') or 0
                cur = (self.settings or {}).get('updatedAt') or 0
                if self.settings is not None and (stamp < cur or s == self.settings):
                    return
                self.settings = s
            self.on_settings(s)

    def _call_config(self, method, path, body=None, renew=False):
        status, obj = self.client.call(method, path, body)
        cfg = parse_config(obj) if status == 200 else None
        if cfg is None:
            self._failed(status, 'bad_answer' if status == 200 else None)
            return None
        self.absorb(cfg, renew)
        return cfg

    def claim(self, wait=None, sleep=None):
        """POST /runner/claim until granted or CLAIM_WAIT_SEC passes. `(config, why)`: why is '' when granted, else
        'lease_lost' (someone else's lease didn't expire) or 'unreachable'."""
        sleep = sleep or time.sleep
        until = self.clock() + (CLAIM_WAIT_SEC if wait is None else wait)
        why = 'unreachable'
        failed, logged_at = 0, None
        while True:
            status, obj = self.client.call('POST', '/runner/claim', {'runId': self.run_id, 'host': self.host})
            reply = parse_claim(obj) if status == 200 else None
            if reply and reply['ok']:
                self.absorb(reply['config'], renew=True)
                return reply['config'], ''
            if reply:
                why = 'lease_lost'
                self.log(f"claim refused: the lease is held until {reply['lease']['until']}")
            else:
                cls = 'bad_answer' if status == 200 else 'transport' if status == 0 else f'http_{status}'
                self._failed(status, cls)
                failed += 1
                now = self.clock()
                if logged_at is None or now - logged_at >= CLAIM_LOG_EVERY_SEC:
                    logged_at = now
                    self.log(f"claim: no answer from the Worker (status {status}, {cls}), attempt {failed}; "
                             f"retrying for {max(0, round(until - now))} s more")
                    self.public('claim_retry', n=failed, status=status, cls=cls)
            if self.clock() + CLAIM_RETRY_SEC > until:
                return None, why
            sleep(CLAIM_RETRY_SEC)

    def post_bookings(self):
        """Send the unsynced entries; True when none is left. Entries set aside (an id conflict, an entry the Worker
        refuses as invalid) go one at a time (the Worker refuses a batch whole), so they can't hold the others back."""
        with self.lock:
            batch = [b for i, b in self.unsynced.items() if i not in self.conflicts][:BOOKINGS_PER_POST]
            alone = [b for i, b in self.unsynced.items() if i in self.conflicts]
        status = self._post(batch) if batch else 200
        if status in REFUSED_ENTRY:
            # Which entry? One at a time: the refused one is found, the rest still reach the record.
            alone = batch + alone if len(batch) > 1 else alone
        for b in alone:
            if self._post([b]) not in (200,) + REFUSED_ENTRY:
                break
        with self.lock:
            return not self.unsynced

    def _post(self, batch):
        """POST one batch; the status. 200 absorbs the answer; a 409 or a 400 for one entry sets it aside
        (`_conflict`); 507 marks the record full (the hold gate closes while anything is unsynced); anything else is a
        failed call."""
        # ?runId= so the answer carries this run's ackSeq and lease (the Worker's, not the body's).
        status, obj = self.client.call(
            'POST', '/runner/bookings?runId=' + urllib.parse.quote(self.run_id, safe=''), batch)
        cfg = parse_config(obj)
        if status == 200 and cfg is not None:
            with self.lock:
                self.record_full = False
            self.absorb(cfg)
            return 200
        if status in REFUSED_ENTRY:
            # A refusal, not an outage: the Worker answered. post_bookings splits a batch; one entry is set aside.
            with self.lock:
                self.contact_at, self.outage_since, self.last_status = self.clock(), None, status
            if len(batch) == 1:
                self._conflict(batch[0], obj, status)
            return status
        if status == 507:
            with self.lock:
                first = not self.record_full
                self.record_full = True
                self.last_status = 507
            self.error('bookings', 507, 'record_full')
            if first:
                self.log(f"HUMAN NEEDED: the Worker's record is full (507): {len(batch)} entr(ies) not recorded; "
                         f"no new hold until it takes them")
                self.event('error', detail='record_full', urgent=True)
            return 507
        self._failed(status, 'bad_answer' if status == 200 else None)
        return status

    def _conflict(self, b, answer, status=409):
        """The Worker refuses this entry: 409 (it has the id with other content: a bug, ids are `runId:seq` and the run
        id unique per attempt) or 400 (not a valid entry: a bug too). Never an ack. Kept queued (unsynced, sent alone from
        now on, so the rest still land), told to a person once."""
        with self.lock:
            if b['id'] not in self.unsynced or b['id'] in self.conflicts:
                return
            self.conflicts.add(b['id'])
            self.counts['human_needed'] += 1
        why = answer.get('error') if isinstance(answer, dict) and isinstance(answer.get('error'), str) else '?'
        code = 'bad_booking' if status == 400 else 'id_conflict'
        self.error('bookings', status, code)
        self.log(f"HUMAN NEEDED: the Worker refused booking {b['id']} ({b['kind']} {b['date']} {b['hotel']}) "
                 f"as {'invalid' if status == 400 else 'an id conflict'} ({status} {why[:40]}): not in the record; "
                 f"check it against the site and the mailbox")
        self.event('human_needed', b['date'], b['hotel'], code, urgent=True)
        self.public('human_needed', n=self.counts['human_needed'], detail=code)

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
                # the applied settings' updatedAt (the Worker's settings_stale; an older Worker ignores it)
                'settingsAt': (self.settings or {}).get('updatedAt'),
                'mailOk': self.mail_ok,
                'scansLog': [{k: v for k, v in e.items() if k != 'n'} for e in self.scans_log],
                'events': [dict(e) for e in self.events[:EVENTS_PER_REPORT]],
                'seen': sorted(self.seen)[:SEEN_MAX],
            }

    @staticmethod
    def _fit(rep):
        """Trim a report under BODY_MAX: the newest events wait for the next report, then the seen names go."""
        def size():
            return len(json.dumps(rep, ensure_ascii=False).encode('utf-8'))
        while size() > BODY_MAX and rep['events']:
            rep['events'].pop()
        while size() > BODY_MAX and rep['seen']:
            del rep['seen'][len(rep['seen']) // 2:]
        return rep

    def report(self):
        """Bookings first (they gate holds), then the heartbeat. The RunnerConfig, or None. A report answered drops the
        scan entries it carried."""
        self.urgent.clear()
        self.post_bookings()
        with self.lock:
            sent = self.scans_log[-1]['n'] if self.scans_log else 0
        cfg = self._call_config('POST', '/runner/report', self._fit(self.build_report()), renew=True)
        if cfg is not None:
            with self.lock:
                self.scans_log = [e for e in self.scans_log if e['n'] > sent]
        return cfg


# ── the workflow's preflight ─────────────────────────────────────────

# The stops that end a job before anything is installed. `lease_lost` isn't one: the lease may be a finished or dying
# run's, and main.py's claim waits for it (CLAIM_WAIT_SEC) instead of skipping a whole half-hour slot.
PREFLIGHT_SKIP = ('paused', 'mode_off', 'no_dates')


def preflight(client):
    """GET /runner/config without a run id (no claim): `(status, reason, run)`. `reason` is a code ('none' when not
    stopped; 'bad_answer'/'unreachable' when there is no RunnerConfig), `run` whether the job should go on."""
    status, obj = client.call('GET', '/runner/config')
    cfg = parse_config(obj) if status == 200 else None
    if cfg is None:
        return status, ('bad_answer' if status == 200 else 'unreachable'), False
    if not cfg['stop']:
        return status, 'none', True
    reason = cfg['stopReason'] or 'other'
    return status, reason, reason not in PREFLIGHT_SKIP + ('other',)


def preflight_main(env):
    """its-runner.yml's first step: prints one line of codes (never the settings), writes `run=0|1` to $GITHUB_OUTPUT,
    exits 1 when the Worker gave no RunnerConfig."""
    client = Client(env.get('ITS_WORKER_URL') or DEFAULT_URL, env.get('ITS_RUNNER_TOKEN', ''))
    status, reason, run = preflight(client)
    print(f'preflight: worker={status} reason={reason} run={int(run)}', flush=True)
    out = env.get('GITHUB_OUTPUT')
    if out:
        with open(out, 'a', encoding='utf-8') as f:
            f.write(f'run={int(run)}\n')
    if reason in ('bad_answer', 'unreachable'):
        print(f'::error::preflight: no RunnerConfig from the Worker (status {status})', flush=True)
        return 1
    return 0


if __name__ == '__main__':
    import os
    import sys
    if sys.argv[1:] != ['preflight']:
        raise SystemExit('usage: python3 remote.py preflight')
    raise SystemExit(preflight_main(os.environ))
