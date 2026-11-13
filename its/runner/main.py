#!/usr/bin/env python3
"""Entry point — one scanner per target month, a URL monitor, a confirm worker.

Scanners only take holds; they never trigger a CAPTCHA. The URL monitor is the only
thing that can re-mint a session and solves synchronously in its own thread, which is
what prevents overlapping solves without a lock. The supervisor restarts any of them and
reconciles the scanners with the current dates: a month added starts one, a month gone
stops its own (`stop_event`), and each scanner reads its month's dates every cycle.

Two modes:

- **local** (default): config.py's settings, runs until interrupted, logs to stdout and
  LOG_FILE as it always did.
- **`--remote`** (required on Actions): settings, the bookings record and the lease come
  from the its-bot Worker (remote.py); stdout is the private log (logs.py) and only
  `logs.public` lines reach the Actions log. `--deadline <epoch>` bounds the run: no new
  hold after it, a drain of up to DRAIN_SEC, a final `run_end` report, exit 0. A stop from
  the Worker (paused, MODE off, no dates, the lease lost) and a 503 ban end it the same
  way; a lease lost while nobody else holds it is claimed again first (a Worker outage
  longer than the lease must not end the run). The run id is `GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT`
  (a re-run is a new run: its events and entries must not collide with the first attempt's).

`--check` validates `.env` instead of booking anything — the site checks those values
mid-hold with a contested slot on the line, so check them at your desk.

    python3 main.py
    python3 main.py --check
    python3 main.py --remote --deadline 1794561000
"""
import argparse
import asyncio
import os
import re
import subprocess
import sys
import threading
import time
import unicodedata
from datetime import date, datetime

import chrome
import config
from config import (
    URL_CHECK_INTERVAL, URL_REFRESH_INTERVAL, LOG_FILE,
    LOG_MAX_BYTES, LOG_BACKUPS, EMAIL,
)
import book_hotels
import confirm_booking
import logs
import remote
from book_hotels import R, G, Y, C, B, X
from book_hotels import log as url_log

DIM = '\033[2m'

_ANSI_RE = re.compile(r'\033\[[0-9;]*m')

MONTH_ABBR = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

# How often the supervisor (a local run's watchdog) checks every worker thread and the scanners' months.
WATCHDOG_INTERVAL = 30

# A bounded run's drain after its deadline (holds stop at the deadline; FINAL: +320 → +335 min).
DRAIN_SEC = 15 * 60
# A ban ends the run quickly: every request from this IP fails for ~24 h, so only the in-flight work is waited for.
BAN_DRAIN_SEC = 120
# Without a good answer from the Worker this long, the run ends (`run_end detail=worker_lost`, exit 1; the fence
# already stopped holds a minute before the lease ran out).
WORKER_LOST_SEC = 15 * 60
# The public summary's cadence.
SUMMARY_EVERY_SEC = 300
# The same failing step is printed publicly at most this often.
PUBLIC_ERROR_EVERY_SEC = 60


def check_cached_url():
    """`(url, confirmed_valid)`: `(url, True)` on 200; `(url, False)` on 5xx or a
    connection failure, where the session is assumed still valid; `(None, False)` when
    there is no cached URL or the session expired."""
    url = book_hotels._read_cached_url()
    if not url:
        return None, False
    try:
        r = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '10']
            + book_hotels.header_args() + [url],
            capture_output=True, text=True, timeout=30,
        )
        status = r.stdout.strip()
    except Exception as e:
        # A local failure to run curl says nothing about the token, and discarding a
        # working URL over it would force a needless solve.
        url_log(f"{Y}URL check: could not run curl ({e!r}), will retry{X}")
        return url, False
    if status == '200':
        url_log(f"{C}URL check: valid (200){X}")
        return url, True
    if not status or status == '000' or status.startswith('5'):
        url_log(f"{Y}URL check: server error ({status}), will retry{X}")
        return url, False
    url_log(f"{Y}URL check: session invalid ({status}){X}")
    return None, False


def url_monitor(stop_event=None):
    """Monitor the calendar URL cache and solve the CAPTCHA when needed. Runs until
    `stop_event` (forever without one), re-solving proactively every URL_REFRESH_INTERVAL
    even when the URL still works; the solve is synchronous, which is what blocks a second
    one without a lock. Each solve is reported (`solving`, then `solve` with its seconds
    and spot)."""
    stop_event = stop_event or threading.Event()
    last_solve = time.time()
    while not stop_event.is_set():
        try:
            url, confirmed = check_cached_url()
            due_for_refresh = time.time() - last_solve >= URL_REFRESH_INTERVAL

            if url and (not due_for_refresh or not confirmed):
                stop_event.wait(URL_CHECK_INTERVAL)
                continue

            if url:
                # A proactive refresh replaces a working token, and a booking carries
                # the old one across a ~10-request chain. A repair is never deferred.
                active = book_hotels.active_bookings()
                if active:
                    url_log(f"{Y}Proactive refresh deferred "
                            f"({active} booking(s) in flight){X}")
                    stop_event.wait(URL_CHECK_INTERVAL)
                    continue
                url_log(f"{Y}Proactive refresh "
                        f"({int(time.time() - last_solve)}s since last solve)...{X}")
            else:
                url_log(f"{B}URL invalid or missing, solving CAPTCHA...{X}")

            book_hotels.notify('solving')
            try:
                new_url = asyncio.run(chrome.get_calendar_url())
                info = chrome.last_solve
                if new_url:
                    last_solve = time.time()
                    url_log(f"{G}New URL saved — {new_url}{X}")
                    book_hotels.notify('solve', ok=True, secs=info.get('secs'), spot=info.get('spot'))
                    continue
                if info.get('secs') is None:
                    # Chrome was busy filing an application: deferred, not a failed solve.
                    book_hotels.notify('solve', ok=None)
                else:
                    url_log(f"{R}CAPTCHA solve failed, will retry next cycle{X}")
                    book_hotels.notify('solve', ok=False, secs=info.get('secs'), cls='no_token')
            except Exception as e:
                url_log(f"{R}CAPTCHA solve error: {e!r}{X}")
                book_hotels.notify('solve', ok=False, cls=type(e).__name__.lower()[:40])
            if url:  # Had a valid URL; reset the timer to avoid spamming retries
                last_solve = time.time()

        except Exception as e:
            # The only thread that can re-solve the CAPTCHA; the watchdog would
            # restart it, but not losing it is cheaper.
            url_log(f"{R}URL monitor error: {e!r}{X}")

        stop_event.wait(URL_CHECK_INTERVAL)


def _rotate_log():
    """Roll LOG_FILE over past LOG_MAX_BYTES, keeping LOG_BACKUPS. At startup rather
    than mid-write, so no log handler needs a lock."""
    try:
        if not os.path.exists(LOG_FILE) or os.path.getsize(LOG_FILE) < LOG_MAX_BYTES:
            return
        for i in range(LOG_BACKUPS - 1, 0, -1):
            src, dst = f'{LOG_FILE}.{i}', f'{LOG_FILE}.{i + 1}'
            if os.path.exists(src):
                os.replace(src, dst)
        os.replace(LOG_FILE, f'{LOG_FILE}.1')
    except OSError as e:
        print(f'Could not rotate {LOG_FILE}: {e}', file=sys.stderr)


class _Worker:
    """A named restartable daemon thread. main() never joins any of them, so a thread
    that dies leaves the process short one scanner — or with nothing that can re-mint a
    session, or nothing that confirms a hold. All invisible without a watchdog."""

    def __init__(self, name, target, args=(), kwargs=None):
        self.name, self.target, self.args = name, target, args
        self.kwargs = kwargs or {}
        self.thread = None
        self.restarts = 0

    def start(self):
        self.thread = threading.Thread(target=self.target, args=self.args, kwargs=self.kwargs,
                                       name=self.name, daemon=True)
        self.thread.start()

    def ensure_alive(self):
        if self.thread is not None and self.thread.is_alive():
            return False
        self.restarts += 1
        self.start()
        return True


def month_label(month):
    """`DEC26` for 2026-12: unique across years (two Decembers are two scanners, two log tags)."""
    return f'{MONTH_ABBR[int(month[5:7])]}{month[2:4]}'


def _month_dates(month):
    """The scanner's dates callable: its month's dates in the current settings."""
    return lambda: [d for d in book_hotels.TARGET_DATES if d[:7] == month]


class Supervisor:
    """The fixed workers (URL monitor, confirm worker) plus one scanner per month of the current future dates.

    `reconcile()` is the watchdog: it starts a scanner for a new month, stops the scanner of a month no longer
    wanted (its stop_event; a booking it spawned finishes), and restarts any thread that died. `scan_target` is
    replaceable for the tests."""

    def __init__(self, scan_target=None, url_target=None, confirm_target=None):
        self.scan_target = scan_target or book_hotels.scan_and_book_month
        self.url_stop = threading.Event()
        self.confirm_stop = threading.Event()
        self.fixed = [_Worker('url-monitor', url_target or url_monitor, kwargs={'stop_event': self.url_stop}),
                      _Worker('confirm', confirm_target or confirm_booking.worker,
                              kwargs={'stop_event': self.confirm_stop})]
        self.scanners = {}     # month -> (_Worker, stop_event)
        self.stopped = False

    def wanted_months(self):
        if self.stopped:
            return set()
        return {d[:7] for d in book_hotels._future_dates(book_hotels.TARGET_DATES)}

    def start(self):
        for w in self.fixed:
            w.start()
        self.reconcile()

    def reconcile(self):
        want = self.wanted_months()
        for month in sorted(want - set(self.scanners)):
            stop = threading.Event()
            label = month_label(month)
            w = _Worker(f'scan-{label}', self.scan_target, (month, _month_dates(month), label),
                        {'stop_event': stop})
            self.scanners[month] = (w, stop)
            w.start()
            url_log(f"{B}Scanner started for {month}{X}")
        for month in sorted(set(self.scanners) - want):
            w, stop = self.scanners.pop(month)
            stop.set()
            url_log(f"{Y}Scanner for {month} stopped{X}")
        workers = [w for w, _ in self.scanners.values()]
        if not self.stopped:
            workers = self.fixed + workers
        else:
            workers = self.fixed[1:] + workers   # the URL monitor stays stopped while draining
        for w in workers:
            try:
                if w.ensure_alive():
                    url_log(f"{R}Worker '{w.name}' died - restarted "
                            f"(restart #{w.restarts}){X}")
            except Exception as e:
                url_log(f"{R}Watchdog could not restart '{w.name}': {e!r}{X}")

    def stop_scanning(self):
        """Drain: no scanner, no solve; the confirm worker keeps going until the queue is empty."""
        self.stopped = True
        self.url_stop.set()
        self.reconcile()

    def busy(self):
        """Work that must not be cut off: a booking chain, a hold waiting for its leg, Chrome in use."""
        return (book_hotels.active_bookings() + confirm_booking.pending_count()
                + (1 if chrome._lock.locked() else 0))

    def restarts(self):
        return sum(w.restarts for w in self.fixed) + sum(w.restarts for w, _ in self.scanners.values())



# ── Environment check (`main.py --check`) ────────────────────────────
#
# The ITS site validates every value here at the moment it matters least:
# mid booking, inside a 30-minute hold, with a contested slot on the line.
# Check them at your desk instead.

_problems = []


def _pad(text, width):
    """Left-justify by display width, not character count: 記号 occupies four
    columns for two characters, so `str.ljust` leaves the output ragged."""
    cells = sum(2 if unicodedata.east_asian_width(c) in 'WF' else 1 for c in text)
    return text + ' ' * max(0, width - cells)


def _report(label, value, ok, detail=''):
    mark = f'{G}ok{X}' if ok else f'{R}FAIL{X}'
    print(f'  [{mark}] {_pad(label, 24)} {value}'
          + (f'  {DIM}{detail}{X}' if detail else ''))
    if not ok:
        _problems.append(f'{label}: {detail or "not set"}')


# Full-width katakana, plus the long vowel mark and the middle dot used in names.
_KATAKANA = re.compile(r'\A[ァ-ヺー・　 ]+\Z')
_HIRAGANA = re.compile(r'[ぁ-ゖ]')
_KANJI = re.compile(r'[一-鿿]')


def _check_applicant():
    print(f'\n{DIM}申込代表者 (from 保険証等){X}')
    a = config.APPLICANT

    for key, label in (('kigou', '記号 (ITS_KIGOU)'), ('bangou', '番号 (ITS_BANGOU)')):
        v = a[key]
        # Length is safe to show; the value itself is an identity credential.
        _report(label, f'{len(v)} chars' if v else '(empty)', bool(v),
               'required — on the front of the card')

    for key, label in (('kana_sei', 'カナ姓 (ITS_KANA_SEI)'),
                       ('kana_mei', 'カナ名 (ITS_KANA_MEI)')):
        v = a[key]
        if not v:
            _report(label, '(empty)', False, 'required, katakana')
        elif _HIRAGANA.search(v):
            _report(label, f'{len(v)} chars', False, 'looks like hiragana, not katakana')
        elif _KANJI.search(v):
            _report(label, f'{len(v)} chars', False, 'looks like kanji — this field wants カナ')
        elif not _KATAKANA.match(v):
            _report(label, f'{len(v)} chars', False,
                   'not full-width katakana (half-width ﾊﾝｶｸ will not match either)')
        else:
            _report(label, f'{len(v)} chars katakana', True)

    v = a['birth']
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', v or ''):
        _report('生年月日 (ITS_BIRTH)', v or '(empty)', False, 'must be YYYY-MM-DD')
    else:
        try:
            born = date.fromisoformat(v)
        except ValueError:
            _report('生年月日 (ITS_BIRTH)', v, False, 'not a real date')
        else:
            age = (date.today() - born).days // 365
            plausible = 0 < age < 120
            _report('生年月日 (ITS_BIRTH)', v, plausible,
                   f'age {age}' if plausible else f'implausible age {age}')

    v = a['sex']
    _report('性別 (ITS_SEX)', v or '(empty)', v in ('男', '女'), "must be 男 or 女")

    v = a['zokugara']
    _report('続柄 (ITS_ZOKUGARA)', v or '(empty)', bool(v),
           '本人 for the insured member')

    v = a['tel']
    digits = re.sub(r'\D', '', v or '')
    _report('電話番号 (ITS_TEL)', v or '(empty)', 10 <= len(digits) <= 11,
           f'{len(digits)} digits — expected 10 or 11')

    optional = [k for k in ('name_sei', 'name_mei', 'zip', 'addr') if a[k]]
    print(f'  {DIM}optional set: {", ".join(optional) or "none"} '
          f'(only used if the form asks){X}')


def _check_mail_config():
    print(f'\n{DIM}Gmail{X}')
    user = config.IMAP_USER
    _report('ITS_IMAP_USER', user or '(empty)', '@' in user, 'must be the mailbox we read')

    pw = config.IMAP_APP_PASSWORD
    if not pw:
        _report('ITS_IMAP_APP_PASSWORD', '(empty)', False,
               'https://myaccount.google.com/apppasswords')
    else:
        _report('ITS_IMAP_APP_PASSWORD', f'{len(pw)} chars', len(pw) == 16,
               'Google app passwords are 16 characters'
               if len(pw) != 16 else 'spaces stripped automatically')

    same = config.EMAIL == user and bool(user)
    _report('EMAIL submitted to ITS', config.EMAIL, same,
           '' if same else (f'differs from the mailbox we poll '
                            f'({user or "unset"}) — the confirmation link would '
                            f'be delivered out of reach'))
    print(f'  {DIM}expecting mail from {config.MAIL_FROM}{X}')


def _check_imap_login():
    print(f'\n{DIM}IMAP connection{X}')
    if not (config.IMAP_USER and config.IMAP_APP_PASSWORD):
        _report('login', 'skipped', False, 'user or app password missing')
        return
    import imaplib
    try:
        with imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT, timeout=20) as m:
            try:
                m.login(config.IMAP_USER, config.IMAP_APP_PASSWORD)
            except imaplib.IMAP4.error as e:
                msg = str(e)
                hint = 'wrong app password, or 2-Step Verification is off'
                if 'Application-specific password required' in msg:
                    hint = ('this account requires an app password — a normal '
                            'account password will not work')
                elif 'Invalid credentials' in msg:
                    hint = 'invalid credentials — regenerate the app password'
                _report('login', 'rejected', False, hint)
                return
            _report('login', config.IMAP_USER, True)

            # All Mail, not INBOX: a filter or Google's own classifier can put the
            # confirmation somewhere else, and losing the 30-minute hold to a
            # mailbox-selection detail would be an absurd way to lose a room.
            box = '"[Gmail]/All Mail"'
            typ, _ = m.select(box, readonly=True)
            if typ != 'OK':
                box = 'INBOX'
                typ, _ = m.select(box, readonly=True)
            _report('mailbox', box.strip('"'), typ == 'OK',
                   '' if typ == 'OK' else 'could not select a mailbox')

    except OSError as e:
        _report('connection', f'{config.IMAP_HOST}:{config.IMAP_PORT}', False,
               f'{type(e).__name__}: {e} — IMAP disabled, or the network blocks 993')


def _check_gate():
    print(f'\n{DIM}Confirmation gate{X}')
    bh = book_hotels
    print(f'  AUTO_CONFIRM={config.AUTO_CONFIRM}  '
          f'AUTO_CONFIRM_MIN_DAYS={config.AUTO_CONFIRM_MIN_DAYS}')
    if not config.TARGET_DATES:
        print(f'  {Y}TARGET_DATES is empty{X}')
    for d in sorted(config.TARGET_DATES):
        left = bh.days_until(d)
        ok, _why = bh.confirm_allowed(d)
        if left is not None and left < 0:
            verdict = f'{DIM}past{X}'
        elif ok:
            verdict = f'{G}auto-confirm{X}'
        else:
            verdict = f'{Y}hold+email only, human confirms{X}'
        print(f'    {d}  {str(left) + "d":>5}  {verdict}')



def check_env():
    """Validate .env before it matters — the site checks these mid-hold, with a
    contested slot on the line. Prints no secrets. Returns a process exit code."""
    print(f'\nITS booker — environment check  {DIM}(no secrets printed){X}')
    _check_mail_config()
    _check_applicant()
    _check_imap_login()
    _check_gate()

    print()
    if _problems:
        print(f'{R}{len(_problems)} problem(s) to fix:{X}')
        for p in _problems:
            print(f'  - {p}')
        return 1
    print(f'{G}Ready.{X}')
    return 0



class RemoteRun:
    """The control loop of a `--remote` run, one `tick()` at a time (the tests drive it with an injected clock).

    Each tick: report when due (REPORT_EVERY_SEC, or at once after an urgent event), then decide. Running: a ban,
    the Worker's `stop`, the deadline or a lost Worker starts the drain (no new hold, scanners and the URL monitor
    stopped, the confirm worker left to finish); else reconcile the scanners. Draining: when nothing is in flight or
    the drain's time is up, `finish()`: human_needed for young unconfirmed holds, `run_end`, a last report."""

    def __init__(self, rem, sup, deadline=None, clock=time.time):
        self.rem, self.sup, self.deadline, self.clock = rem, sup, deadline, clock
        self.draining = False
        self.end_detail = None
        self.drain_until = None
        self.last_report = None
        self.last_summary = clock()
        self.printed = {}          # step -> (failures printed, when)
        self.phase_printed = None
        self.auto_seen = False     # autoConfirm was on at the last tick (the IMAP check runs when it turns on)
        self.reclaims = 0

    def begin_drain(self, detail, until):
        if self.draining:
            self.drain_until = min(self.drain_until, until)
            return
        self.draining, self.end_detail, self.drain_until = True, detail, until
        with self.rem.lock:
            self.rem.no_new_holds = self.rem.no_new_holds or detail
        self.sup.stop_scanning()
        url_log(f"{Y}Draining ({detail}): no new holds; {self.sup.busy()} in flight{X}")
        logs.public('drain', reason=detail, active=self.sup.busy(),
                    left_min=round(max(0.0, until - self.clock()) / 60, 1))

    def _reclaimed(self, cfg, now):
        """A `lease_lost` stop while nobody else holds the lease (it expired during a Worker outage, or was dropped):
        claim it once, at once, before draining. True when that got it back."""
        lease = cfg.get('lease')
        if cfg.get('stopReason') != 'lease_lost' or (lease and lease['until'] > now * 1000):
            return False
        got, why = self.rem.claim(wait=0)
        self.reclaims += 1
        url_log(f"{G if got else Y}Lease lost while free: claimed again {'(ok)' if got else f'({why})'}{X}")
        logs.public('claim', ok=int(got is not None), why=why or None, reclaim=self.reclaims)
        return got is not None and not got['stop']

    def check_imap(self):
        ok, cls = confirm_booking.imap_check()
        url_log(f"{G if ok else R}IMAP login check: {'ok' if ok else cls}{X}")
        logs.public('imap', ok=int(ok), cls=cls or None)
        if not ok:
            self.rem.error('imap', None, cls)
            self.rem.event('error', detail=f'imap_{cls}'[:40], urgent=True)

    def tick(self):
        rem, now = self.rem, self.clock()
        if rem.urgent.is_set() or self.last_report is None or now - self.last_report >= remote.REPORT_EVERY_SEC:
            self.last_report = now
            rem.report()
        cfg = rem.config
        settings = rem.settings or {}

        if not self.draining:
            if rem.banned:
                self.begin_drain('ban', now + BAN_DRAIN_SEC)
            elif cfg is not None and cfg['stop'] and not self._reclaimed(cfg, now):
                cfg = rem.config   # a re-claim's answer (when it got one) says why it stops now, not the lease_lost
                cap = now + DRAIN_SEC if self.deadline is None else min(now, self.deadline) + DRAIN_SEC
                self.begin_drain(cfg['stopReason'] or 'paused', cap)
            elif self.deadline is not None and now >= self.deadline:
                self.begin_drain('time_up', self.deadline + DRAIN_SEC)
            elif rem.contact_at is not None and now - rem.contact_at > WORKER_LOST_SEC:
                self.begin_drain('worker_lost', now + BAN_DRAIN_SEC)
        elif rem.banned and self.end_detail != 'ban':
            self.drain_until = min(self.drain_until, now + BAN_DRAIN_SEC)

        if self.draining:
            rem.phase = 'draining' if self.end_detail == 'time_up' else 'stopping'
        else:
            rem.phase = 'solving' if rem.solving else 'scanning' if rem.scans else 'starting'
            auto = settings.get('autoConfirm') is True
            if auto and not self.auto_seen:
                self.check_imap()
            self.auto_seen = auto
        if rem.phase != self.phase_printed:
            self.phase_printed = rem.phase
            logs.public('phase', name=rem.phase)

        self.sup.reconcile()
        self._public_errors(now)
        if now - self.last_summary >= SUMMARY_EVERY_SEC:
            self.last_summary = now
            self.summary(now)

        if self.draining and (self.sup.busy() == 0 or now >= self.drain_until):
            return self.finish()
        return None

    def finish(self):
        rem = self.rem
        busy = self.sup.busy()
        if busy:
            url_log(f"{R}Drain time is up with {busy} still in flight{X}")
        young = rem.unresolved_holds()
        rem.event('run_end', detail=self.end_detail)
        rem.phase = 'stopping'
        cfg = rem.report()
        if cfg is None or rem.events:
            cfg = rem.report()   # one retry: the run_end is what releases the lease
        self.summary(self.clock())
        logs.public('run_end', detail=self.end_detail, active=busy, human=young, ok=int(cfg is not None),
                    unsynced=len(rem.unsynced), gate_closed=rem.counts['gate_closed'])
        return self.end_detail

    def _public_errors(self, now):
        rem = self.rem
        with rem.lock:
            counts = dict(rem.failures_by_step)
            last = dict(rem.last_by_step)
        for step, n in counts.items():
            shown, at = self.printed.get(step, (0, None))
            if n > shown and (at is None or now - at >= PUBLIC_ERROR_EVERY_SEC):
                status, cls = last.get(step, (None, None))
                self.printed[step] = (n, now)
                logs.public('error', step=step, n=n - shown, status=status, cls=cls)

    def summary(self, now):
        rem = self.rem
        with rem.lock:
            fails = {f'fail_{k}': v for k, v in rem.failures_by_step.items()}
            logs.public(
                'summary', phase=rem.phase, uptime_min=round((now - rem.started_at) / 60, 1),
                scans=rem.scans, scan_fail=rem.scan_failures,
                ok_age_s=None if rem.last_ok_at is None else round(now - rem.last_ok_at / 1000, 1),
                avail=rem.available_now, holds=rem.counts['hold'], confirmed=rem.counts['confirmed'],
                human=rem.counts['human_needed'], gate_closed=rem.counts['gate_closed'], solves_ok=rem.solves['ok'],
                solves_failed=rem.solves['failed'], unsynced=len(rem.unsynced),
                events=len(rem.events), worker=rem.last_status,
                outage_s=round(rem.outage_sec(), 1), restarts=self.sup.restarts(), active=self.sup.busy(),
                **fails)


def _log_sink(to_file):
    """book_hotels' log handler: plain text to stdout, and to LOG_FILE when stdout isn't already it."""
    log_file = open(LOG_FILE, 'a', encoding='utf-8') if to_file else None

    def sink(msg):
        plain = _ANSI_RE.sub('', msg)
        print(plain, flush=True)
        if log_file is not None:
            try:
                log_file.write(plain + '\n')
                log_file.flush()
            except OSError:
                pass  # a full disk must not take down a booking thread
    return sink


def _apply_settings(s):
    changed = book_hotels.apply_settings(s)
    if not changed:
        return
    dates = book_hotels.TARGET_DATES
    url_log(f"{B}Settings applied ({', '.join(changed)}): dates {', '.join(dates) or '(none)'}; "
            f"interval {book_hotels.RETRY_DELAY}s; guests {book_hotels.NUM_GUESTS}; "
            f"auto-confirm {'on' if book_hotels.AUTO_CONFIRM else 'off'}; "
            f"priority {', '.join(book_hotels.PRIORITY_HOTELS) or '(none)'}; "
            f"{len(book_hotels.SKIP_HOTELS)} skipped{X}")
    logs.public('settings', dates=len(dates), months=len({d[:7] for d in dates}),
                skip=len(book_hotels.SKIP_HOTELS), pri=len(book_hotels.PRIORITY_HOTELS),
                interval=book_hotels.RETRY_DELAY, guests=int(book_hotels.NUM_GUESTS),
                auto=int(book_hotels.AUTO_CONFIRM))


def _secrets():
    return [os.environ.get('ITS_RUNNER_TOKEN', ''), config.IMAP_APP_PASSWORD, config.IMAP_USER, config.EMAIL,
            *config.APPLICANT.values()]


_RUN_NUM = re.compile(r'[0-9]{1,20}\Z')


def run_identity(env, clock=time.time):
    """`(run_id, run_url, host)`. On Actions `GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT`: a re-run keeps the run id, and an
    id reused would make its events and booking entries duplicates of the first attempt's. Elsewhere `local-<epoch>`."""
    rid, attempt = env.get('GITHUB_RUN_ID') or '', env.get('GITHUB_RUN_ATTEMPT') or '1'
    if env.get('GITHUB_ACTIONS') != 'true' or not _RUN_NUM.match(rid) or not _RUN_NUM.match(attempt):
        return f'local-{int(clock())}', None, 'local' if env.get('GITHUB_ACTIONS') != 'true' else 'actions'
    url = None
    if env.get('GITHUB_REPOSITORY'):
        url = (f"{env.get('GITHUB_SERVER_URL', 'https://github.com')}/{env['GITHUB_REPOSITORY']}"
               f"/actions/runs/{rid}/attempts/{attempt}")
    return f'{rid}-{attempt}', url, 'actions'


def run_remote(deadline=None, clock=time.time, wait=None):
    """A `--remote` run (module docstring). Returns the exit code: 0 for every orderly end (time up, stopped,
    banned, the lease someone else's), 1 for an error (the Worker unreachable or lost), 2 for a missing token or an
    ITS_BASE_URL that isn't loopback."""
    _rotate_log()
    logs.setup(LOG_FILE)
    logs.mask(_secrets())
    book_hotels._log_handler = _log_sink(to_file=False)
    env = os.environ
    url_log(f'\n=== Remote session started {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} ===')
    on_actions = env.get('GITHUB_ACTIONS') == 'true'
    run_id, run_url, host = run_identity(env, clock)
    origin = ('dispatch' if env.get('GITHUB_EVENT_NAME') == 'workflow_dispatch' else 'schedule') \
        if on_actions else 'local'
    logs.public('start', host=host, origin=origin,
                left_min=None if deadline is None else round((deadline - clock()) / 60, 1))
    if book_hotels.BASE_REFUSED:
        url_log(f"{R}ITS_BASE_URL={book_hotels.BASE_REFUSED!r} refused: only a loopback server (127.0.0.1, "
                f"localhost, ::1) may stand in for the site; not running{X}")
        logs.public('run_end', detail='error', reason='base_url', exit=2)
        return 2
    token = env.get('ITS_RUNNER_TOKEN', '')
    if not token:
        url_log(f"{R}ITS_RUNNER_TOKEN is not set{X}")
        logs.public('run_end', detail='error', reason='no_token', exit=2)
        return 2
    sha = (env.get('GITHUB_SHA') or '')[:8] or None
    rem = remote.Remote(remote.Client(env.get('ITS_WORKER_URL') or remote.DEFAULT_URL, token), run_id, host,
                        sha, run_url, deadline=deadline, clock=clock, on_settings=_apply_settings,
                        seed_hold=book_hotels.save_booking, log=url_log, public=logs.public)
    book_hotels._event_sink = rem.on_event
    book_hotels._hold_gate = rem.hold_gate
    confirm_booking._commit_gate = rem.commit_gate

    t0 = clock()
    cfg, why = rem.claim(sleep=wait)
    logs.public('claim', ok=int(cfg is not None), waited_s=round(clock() - t0, 1), why=why or None,
                worker=rem.last_status)
    if cfg is None:
        url_log(f"{R}No lease ({why}); not running{X}")
        logs.public('run_end', detail=why, exit=0 if why == 'lease_lost' else 1)
        return 0 if why == 'lease_lost' else 1
    url_log(f"{B}ITS BOOKING SYSTEM (remote, run {run_id}){X}  Email: {EMAIL or '(unset)'}")
    rem.event('run_start', detail=origin)

    sup = Supervisor()
    run = RemoteRun(rem, sup, deadline, clock)
    if not cfg['stop']:
        sup.start()
    sleep = wait or (lambda s: rem.urgent.wait(s))
    while True:
        try:
            detail = run.tick()
        except Exception as e:
            url_log(f"{R}Control loop error: {e!r}{X}")
            logs.public('error', step='control', exc=type(e).__name__)
            detail = None
        if detail is not None:
            break
        sleep(2)
    return 1 if detail == 'worker_lost' else 0


def run_local():
    """The bot as it always ran on the Mac: config.py's settings, forever."""
    _rotate_log()
    book_hotels._log_handler = _log_sink(to_file=True)
    if book_hotels.BASE_REFUSED:
        url_log(f"{R}ITS_BASE_URL={book_hotels.BASE_REFUSED!r} refused: loopback only; not running{X}")
        return 2
    url_log(f'\n=== Session started {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} ===')
    url_log("=" * 60)
    url_log(f"{B}ITS BOOKING SYSTEM{X}")
    url_log(f"Email: {EMAIL}")
    url_log(f"Dates: {', '.join(book_hotels.TARGET_DATES)}")
    url_log(f"Priority hotels: {', '.join(book_hotels.PRIORITY_HOTELS) or '(none)'}")
    url_log("=" * 60)
    sup = Supervisor()
    sup.start()
    url_log(f"{C}Supervisor started ({len(sup.scanners)} scanners, {WATCHDOG_INTERVAL}s watchdog){X}")
    try:
        while True:
            time.sleep(WATCHDOG_INTERVAL)
            sup.reconcile()
    except KeyboardInterrupt:
        pass
    print(f"{Y}Interrupted, exiting.{X}")


def main(argv=None):
    p = argparse.ArgumentParser(description='The ITS booker (README.md).')
    p.add_argument('--check', action='store_true', help='validate .env and exit')
    p.add_argument('--remote', action='store_true', help="the its-bot Worker's settings (required on Actions)")
    p.add_argument('--deadline', type=float, default=None,
                   help='epoch seconds: no new hold after it, then drain and exit')
    args = p.parse_args(argv)
    if args.check:
        return check_env()
    os.makedirs(config.STATE_DIR, exist_ok=True)
    if os.environ.get('GITHUB_ACTIONS') == 'true' and not args.remote:
        print('main.py: --remote is required on Actions (config.py settings are for a local run)', file=sys.stderr)
        return 2
    if args.remote:
        return run_remote(args.deadline)
    if args.deadline is not None:
        print('main.py: --deadline needs --remote', file=sys.stderr)
        return 2
    return run_local() or 0


if __name__ == '__main__':
    sys.exit(main())
