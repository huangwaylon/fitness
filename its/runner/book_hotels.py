#!/usr/bin/env python3
"""Booking engine — scans calendar months and takes a hold on every available date.

Reads the calendar URL from calendar_url_cache.txt each cycle and never solves a
CAPTCHA; main.py's URL monitor does that. Ends at the hold — confirm_booking's worker
turns it into a reservation.

Seams for the remote runner (main.py --remote, remote.py), each a no-op when unset (the local bot, the tests):

- `apply_settings(s)` installs the Worker's settings by reassigning the module globals the flow reads at call time
  (TARGET_DATES, SKIP_HOTELS/_SKIP_NORM, SEARCH_HOTELS/_SEARCH_NORM, PRIORITY_HOTELS/_PRIORITY_NORM, RETRY_DELAY,
  NUM_GUESTS, AUTO_CONFIRM) — exactly what test_its's Env does. The confirm gate (`confirm_allowed`) reads the live
  AUTO_CONFIRM. With `search` (the allow-list) only the facilities named there are eligible; without it, every one not
  skipped (`is_eligible`).
- `set_done_dates(dates)`: the nights with a `confirmed` booking in the Worker's record. They are not scanned, take no
  new hold, and no second facility is confirmed for them (`still_wanted`, `night_done`).
- `_hold_gate()` → `(ok, why)` (via `hold_allowed()`) is asked before a scan spawns booking threads, before each
  hotel's steps 3-6, and immediately before step 7 (the hold): the lease, the run's deadline and an unsynced record can
  refuse a new hold. A closed gate costs no request beyond the scan's own (steps 3-6 every cycle per hotel and date
  would be the request storm that gets an IP banned). Each check also re-asks `still_wanted(date, hotel)`: a date
  removed, a hotel skipped or switched off, or the night confirmed, mid-chain, stops that chain.
- `notify(kind, **fields)` reports what happened (scan, fail, offered, hold, human_needed, ban, …) to `_event_sink`;
  it never raises into the flow.
- `scan_and_book_month` takes its dates as a list or a callable, read every cycle, so a date added or removed in the
  app reaches a running scanner.
"""
import subprocess, re, urllib.parse, os, json, tempfile, threading, time
import contextlib
import html as _html
import unicodedata
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, date, timedelta, timezone

from config import (
    CALENDAR_URL_CACHE, EMAIL, NUM_GUESTS, TARGET_DATES,
    HOLDS_FILE, RETRY_DELAY, CURL_MAX_ATTEMPTS, SKIP_HOTELS,
    DEBUG_DIR, USER_AGENT_CACHE, BROWSER_HEADERS, ACCEPT, ACCEPT_LANGUAGE,
    FALLBACK_USER_AGENT, PRIORITY_HOTELS,
    CURL_RETRY_BACKOFF, CURL_RETRY_BACKOFF_MAX, CURL_TIMEOUT,
    BOOK_MAX_ATTEMPTS, BOOK_RETRY_DELAY,
    SCAN_BACKOFF_MAX, SCAN_JITTER,
    SCAN_REUSE_SESSION, SCAN_REUSE_MAX_FAILURES,
    AUTO_CONFIRM, AUTO_CONFIRM_MIN_DAYS,
    DEBUG_DUMP_INTERVAL, DEBUG_DUMP_KEEP,
)

SITE = 'https://as.its-kenpo.or.jp'
_LOOPBACK = ('127.0.0.1', 'localhost', '::1')


def _base_url(value):
    """`(base, refused)`: the site, or `ITS_BASE_URL` when it names a loopback server (an integration run against
    FakeITS). Anything else is refused, never followed: an override pointing somewhere else is a mistake, and the
    caller exits rather than fall back to the real site (main.py)."""
    if not value:
        return SITE, None
    try:
        u = urllib.parse.urlsplit(value.strip())
        host = u.hostname
    except ValueError:
        return SITE, value
    if u.scheme in ('http', 'https') and host in _LOOPBACK and u.path in ('', '/') and not u.query:
        return value.strip().rstrip('/'), None
    return SITE, value


# The site, or a loopback fake (`ITS_BASE_URL`). BASE_REFUSED is an override that wasn't honoured (main.py logs it, in
# the private log only, and exits).
BASE, BASE_REFUSED = _base_url(os.environ.get('ITS_BASE_URL'))

# ANSI colors
R = '\033[91m'   # red
G = '\033[92m'   # green
Y = '\033[93m'   # yellow
C = '\033[96m'   # cyan
B = '\033[1m'    # bold
X = '\033[0m'    # reset


_log_handler = None  # main() routes this to stdout + LOG_FILE

# The remote runner's seams (module docstring). Both replaceable, both None for the local bot and the tests.
_event_sink = None   # (kind, fields) -> None
_hold_gate = None    # () -> (ok, why)


def notify(kind, **fields):
    """Tell the runner something happened. Never raises: it sits inside booking threads and the scan loop, and a
    report that could not be queued must not cost a hold."""
    sink = _event_sink
    if sink is None:
        return
    try:
        sink(kind, fields)
    except Exception as e:
        log(f"{R}event sink failed on {kind}: {e!r}{X}")


def hold_allowed(target_date=None, hotel_name=None):
    """`(ok, why)` from `_hold_gate`, failing closed: an exception there refuses the hold. With a date (and a hotel),
    `still_wanted` first: the settings may have changed since the scan saw the date."""
    if target_date is not None and not still_wanted(target_date, hotel_name):
        return False, 'not_wanted'
    gate = _hold_gate
    if gate is None:
        return True, ''
    try:
        return gate()
    except Exception as e:
        return False, f'hold gate raised {e!r}'


def still_wanted(target_date, hotel_name=None):
    """The date is still a target with no confirmed booking (DONE_DATES), and the hotel (if given) eligible
    (`is_eligible`: searched and not skipped), in the settings as they are now."""
    return (target_date in TARGET_DATES and target_date not in DONE_DATES
            and (hotel_name is None or is_eligible(hotel_name)))


def night_done(target_date):
    """A night with a `confirmed` booking in the Worker's record (one booking a night): not scanned, no new hold,
    and no second facility confirmed for it (confirm_booking's gate)."""
    return target_date in DONE_DATES


def set_done_dates(dates):
    """Install the nights that have a `confirmed` booking (remote.Remote's `on_done`). True when the set changed."""
    global DONE_DATES
    new = frozenset(d for d in dates if isinstance(d, str) and _ISO_DATE.match(d))
    if new == DONE_DATES:
        return False
    DONE_DATES = new
    return True


# The scan interval's floor, whatever the settings say: the ~24 h IP bans come from the poll rate (its/SITE.md §2).
MIN_RETRY_DELAY = 15


def apply_settings(s):
    """Install the Worker's ItsSettings (app/src/lib/its/contract.ts) as this module's globals.

    The flow reads them at call time, so the next scan cycle, booking and confirm gate see the change; a booking chain
    already past its hotel list keeps the guest count it started with. Normalised sets are built before they are
    assigned, so a reader sees the old or the new one, never half. Returns the names that changed (for the log)."""
    global TARGET_DATES, SKIP_HOTELS, _SKIP_NORM, PRIORITY_HOTELS, _PRIORITY_NORM, SEARCH_HOTELS, _SEARCH_NORM
    global RETRY_DELAY, NUM_GUESTS, AUTO_CONFIRM
    dates = sorted({d for d in s['dates'] if isinstance(d, str) and _ISO_DATE.match(d)})
    skip = [n for n in s['skip'] if isinstance(n, str)]
    # The settings' priority (the app's old ★) is let be: every facility alike, in the site's order (the app sends [])
    pri = []
    # The allow-list: absent (an older Worker, or settings saved before it) keeps the skip-list rule.
    search = s.get('search')
    search = None if not isinstance(search, list) else [n for n in search if isinstance(n, str)]
    new = {
        'TARGET_DATES': dates,
        'SKIP_HOTELS': skip,
        'SEARCH_HOTELS': search,
        'PRIORITY_HOTELS': pri,
        'RETRY_DELAY': max(MIN_RETRY_DELAY, int(s['intervalSec'])),
        'NUM_GUESTS': str(int(s['guests'])),
        'AUTO_CONFIRM': s['autoConfirm'] is True,
    }
    changed = [k for k, v in new.items() if globals()[k] != v]
    skip_norm = frozenset(_norm_hotel(n) for n in skip if _norm_hotel(n))
    pri_norm = tuple(_norm_hotel(p) for p in pri if _norm_hotel(p))
    search_norm = None if search is None else frozenset(_norm_hotel(n) for n in search if _norm_hotel(n))
    SKIP_HOTELS, _SKIP_NORM = skip, skip_norm
    SEARCH_HOTELS, _SEARCH_NORM = search, search_norm
    PRIORITY_HOTELS, _PRIORITY_NORM = pri, pri_norm
    TARGET_DATES = dates
    RETRY_DELAY = new['RETRY_DELAY']
    NUM_GUESTS = new['NUM_GUESTS']
    AUTO_CONFIRM = new['AUTO_CONFIRM']
    return changed

def log(msg):
    """Reserve red for what is actually wrong: 「空き部屋がございません」 is an ordinary lost
    race, so it is yellow with no dump. Each line starts with its ISO time and UTC offset
    (2026-11-13T17:32:19+09:00): the private log is read beside the Worker's records and the Actions log, in other
    zones."""
    ts = datetime.now().astimezone().isoformat(timespec='seconds')
    formatted = f'{ts} {msg}'
    if _log_handler:
        _log_handler(formatted)
    else:
        print(formatted, flush=True)


# Thread-safe holds access
_bookings_lock = threading.Lock()

# main.py's URL monitor reads this to defer a *proactive* CAPTCHA refresh: a booking
# carries one `s=` token across a ~10-request chain.
_active_lock = threading.Lock()
_active_bookings = 0


def active_bookings():
    with _active_lock:
        return _active_bookings


@contextlib.contextmanager
def _booking_in_flight():
    global _active_bookings
    with _active_lock:
        _active_bookings += 1
    try:
        yield
    finally:
        with _active_lock:
            _active_bookings -= 1


@contextlib.contextmanager
def session_jar(prefix):
    """Yield `(cookie_file, c)` — a private cookie jar and a `curl` bound to it.

    One jar per thread, never shared: all five Rails/ALB cookies must survive a whole
    chain (its/SITE.md §4). The jar is handed back too, because a scanner truncates
    it after a failure to force a fresh session.
    """
    fd, path = tempfile.mkstemp(suffix='.txt', prefix=prefix)
    os.close(fd)
    try:
        yield path, lambda m, u, d=None, h=None, retry=True: curl(path, m, u, d, h, retry)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _read_cached_url():
    """The current calendar URL, or None. Never raises: a scanner's loop body has no
    `except` around this, so an OSError would kill that month permanently."""
    try:
        with open(CALENDAR_URL_CACHE) as f:
            url = f.read().strip()
        return url or None
    except OSError:
        return None


def _load_bookings(path):
    """`(bookings, ok)`; `ok` is False when the contents are unknown.

    Never treat `not ok` as "nothing is booked" — a bad read returning {} plus a
    normal save rewrites the file with only the new entry. Losing one record risks a
    duplicate attempt; losing the file risks duplicating everything. Assumes
    `_bookings_lock` is held.
    """
    if not os.path.exists(path):
        return {}, True
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.loads(f.read().strip() or '{}')
    except (OSError, ValueError, UnicodeDecodeError) as e:
        log(f"{R}Warning: could not read {path}: {e}{X}")
        return {}, False
    if not isinstance(data, dict):
        log(f"{R}Warning: could not read {path}: not a JSON object{X}")
        return {}, False
    return data, True


def save_booking(date_str, hotel_name, path=None):
    """Record a hold or a reservation. Thread-safe, atomic, never destructive.

    `path` defaults to HOLDS_FILE; `confirm_booking` passes RESERVATIONS_FILE. A
    parameter, not a swapped global — both files are written concurrently.
    """
    path = path or HOLDS_FILE
    with _bookings_lock:
        bookings, ok = _load_bookings(path)
        if not ok:
            log(f"{R}BOOKED {hotel_name} for {date_str} but {path} could "
                f"not be read — not recording, refusing to overwrite it{X}")
            return
        if hotel_name in bookings.get(date_str, []):
            return
        bookings.setdefault(date_str, []).append(hotel_name)
        try:
            _write_bookings(bookings, path)
        except OSError as e:
            # It succeeded on the site, so this must not raise into the booking
            # thread and abort the remaining hotels.
            log(f"{R}BOOKED but failed to record {hotel_name} for {date_str}: {e}{X}")


def _write_bookings(bookings, path):
    """Write atomically — same directory, fsync, rename. `open(..., 'w')` truncates
    first, and this record is the only thing preventing duplicate applications."""
    d = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=d, prefix='.holds_', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(bookings, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def get_booked_hotels(date_str):
    with _bookings_lock:
        return _load_bookings(HOLDS_FILE)[0].get(date_str, [])


class Response(str):
    """The response body with its own headers attached — a plain `str` to every call
    site, so `_dump_debug` gets *this* body's headers without widening the tuple that
    17 call sites unpack."""
    __slots__ = ('headers', 'location', 'request')

    def __new__(cls, body, headers='', location=None, request=''):
        obj = super().__new__(cls, body)
        obj.headers = headers
        obj.location = location
        obj.request = request
        return obj


# Chrome's real user agent, recorded by chrome.py at each solve.
_ua_lock = threading.Lock()
_ua_cache = (None, None)  # ((path, mtime), user_agent)

# A UA must name a desktop platform: a mobile one can make the site serve a
# different template, breaking the markup-exact extractors and SKIP_HOTELS matching.
_UA_PLATFORMS = ('Macintosh', 'Windows NT', 'X11')


def _user_agent():
    """The UA of the Chrome that minted the current session token.

    Re-read when chrome.py rewrites the file, so it cannot drift out of sync with
    its session. Never raises: callers sit outside curl()'s try, so an exception would
    kill a scanner or the URL monitor.
    """
    global _ua_cache
    with _ua_lock:
        try:
            key = (USER_AGENT_CACHE, os.path.getmtime(USER_AGENT_CACHE))
            if _ua_cache[0] == key:
                return _ua_cache[1]
            with open(USER_AGENT_CACHE, encoding='utf-8', errors='replace') as f:
                raw = f.read()
        except Exception:
            return FALLBACK_USER_AGENT
        # First line only: this value is spliced into a curl -H flag, so an
        # interior newline would inject an arbitrary extra header.
        ua = (raw.splitlines() or [''])[0].strip()
        if not ua or not any(p in ua for p in _UA_PLATFORMS):
            return FALLBACK_USER_AGENT  # deliberately not cached
        _ua_cache = (key, ua)
        return ua


def _merge_headers(headers):
    """Merge per-call headers over the browser defaults.

    In Python, not by appending `-H`: curl emits every header it is given, so a
    default plus a per-call `Accept` sends both and lets the server pick.
    Case-insensitive, so a case variant cannot duplicate a line either.
    """
    merged = {}
    if BROWSER_HEADERS:
        merged['User-Agent'] = _user_agent()
        merged['Accept'] = ACCEPT
        merged['Accept-Language'] = ACCEPT_LANGUAGE
    for k, v in (headers or {}).items():
        if v is None:
            continue  # ex() found no match; `X-CSRF-Token: None` would 422
        for existing in [e for e in merged if e.lower() == k.lower()]:
            del merged[existing]
        merged[k] = v
    return merged


def header_args(headers=None):
    args = []
    for k, v in _merge_headers(headers).items():
        args.extend(['-H', f'{k}: {v}'])
    return args


def _is_retryable(status):
    """True for statuses worth sending again: 5xx and 0 (transport failure) are load,
    429 is explicit rate limiting, any other 4xx is a rejection. 302 is deliberately
    excluded — it is either flow progress or a dead session, and `_is_session_dead`
    tells those apart."""
    return status in (0, 429) or status >= 500


def curl(cookie_file, method, url, data=None, headers=None, retry=True):
    """One HTTP request via curl. Returns `(status, Response, location)`.

    `retry=False` disables the retry loop for a request that must never be repeated.
    Retrying is safe for anything that only reads or navigates.
    """
    cmd = ['curl', '-s', '-c', cookie_file, '-b', cookie_file,
           '-D', '/dev/stderr', '--max-redirs', '0', '--max-time', str(CURL_TIMEOUT)]
    if method == 'POST':
        cmd.extend(['-X', 'POST'])
    cmd.extend(header_args(headers))
    if data:
        # `ex()` yields None when it found nothing; a browser would submit an empty
        # value, and a missing token here is the real cause of whatever follows.
        missing = [k for k, v in data.items() if v is None]
        if missing:
            log(f"  {Y}{method} {url.split('?')[0]}: no value extracted for "
                f"{', '.join(missing)}{X}")
        for k, v in data.items():
            cmd.extend(['--data-urlencode', f'{k}={"" if v is None else v}'])
    cmd.append(url)
    attempts = max(1, CURL_MAX_ATTEMPTS) if retry else 1
    status, body, hdrs = 0, '', ''
    for attempt in range(attempts):
        try:
            r = subprocess.run(cmd, capture_output=True, text=True,
                               timeout=CURL_TIMEOUT + 10)
        except Exception as e:
            # Must not kill a scanner: the scan loop has no except around this.
            status, body, hdrs = 0, '', ''
            log(f"  {R}curl {method} raised: {e}{X}")
        else:
            body = r.stdout
            hdrs = r.stderr
            st = re.findall(r'HTTP/\S+ (\d+)', hdrs)
            status = int(st[-1]) if st else 0
        if not _is_retryable(status) or attempt + 1 == attempts:
            break
        # `Retry-After` wins when the server states a figure.
        delay = min(CURL_RETRY_BACKOFF * (2 ** attempt), CURL_RETRY_BACKOFF_MAX)
        delay = max(delay, _retry_after(hdrs))
        log(f"  {Y}curl {method} failed ({status}), retrying in {delay:.1f}s...{X}")
        time.sleep(delay)
    loc = re.search(r'location: (.+)', hdrs, re.IGNORECASE)
    location = loc.group(1).strip() if loc else None
    if is_ban(status, body):
        log(f"  {B}{R}503 セキュリティアラート: this IP is banned for ~24 h (its/SITE.md §2){X}")
        notify('ban')
    return status, Response(body, hdrs, location, f'{method} {url}'), location


# The ~24-hour IP ban's page (its/SITE.md §2): a 503 titled セキュリティアラート, not site load.
_BAN_TEXT = 'セキュリティアラート'


def is_ban(status, body):
    return status == 503 and _BAN_TEXT in (body or '')


def error_class(status, location=None, body=''):
    """A short code for a failed response, for the reports: transport, session_dead, ban, http_<status>, or shape (a
    200 that wasn't what the step needed)."""
    if status == 0:
        return 'transport'
    if _is_session_dead(status, location):
        return 'session_dead'
    if is_ban(status, body):
        return 'ban'
    if status == 200:
        return 'shape'
    return f'http_{status}'


def _retry_after(hdrs):
    """Seconds from a `Retry-After` header, capped — the site may name a figure
    longer than the slot will survive. 0 if absent."""
    m = re.search(r'^retry-after:\s*(\d+)\s*$', hdrs or '', re.IGNORECASE | re.MULTILINE)
    if not m:
        return 0.0
    return min(float(m.group(1)), CURL_RETRY_BACKOFF_MAX)


def ex(html, pat):
    m = re.search(pat, html)
    return m.group(1) if m else None


# Named once because they are markup-exact: a template change is then a one-line
# fix rather than a hunt through six identical literals.
_AUTH_RE = r'name="authenticity_token" value="(.*?)"'
_CSRF_RE = r'csrf-token.*?content="(.*?)"'
_S_RE = r'name="s" id="s" value="(.*?)"'

# Every AJAX request the site expects as Rails-UJS. All four are required: without
# X-Requested-With the server answers HTML or a redirect instead of JavaScript.
def _ajax(csrf, referer):
    return {'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-Token': csrf,
            'Accept': 'text/javascript, application/javascript, */*; q=0.01',
            'Referer': referer}


def _follow(c, s, body, loc):
    """Follow a 302 by hand. Returns `(status, body, via)`, where `via` is the
    redirect itself — a dump taken after the follow-up GET would record the wrong
    response's headers."""
    if s == 302 and loc:
        return (*c('GET', loc)[:2], body)
    return s, body, None


def _headers_section(resp):
    """The `# request` / `# body` preamble plus the response's headers."""
    return (f'# request: {getattr(resp, "request", "") or "(unknown)"}\n'
            f'# body: {len(str(resp).encode("utf-8", "replace"))} bytes\n\n'
            f'{(getattr(resp, "headers", "") or "").strip() or "(no headers captured)"}\n')


def _dump_debug(label, step, status, body, via=None, throttle=True):
    """Save an unexpected HTTP response for later debugging.

    The headers are the diagnostic payload: whether a 302 carries `x-runtime` (Rails
    made it) or not (Apache/ALB/WAF did), whether `content-length` is 0 by intent or
    truncated, whether `set-cookie` re-issued the session. `via` is the response
    *before* a redirect was followed.

    **Dumps are written verbatim**, so they hold live session cookies, `s=` tokens and
    — on 申込内容確認画面 — the applicant's 記号/番号/カナ氏名/生年月日. `debug_responses/`
    is gitignored; treat it as credential-bearing and do not paste one anywhere.
    """
    notify('fail', step=step, status=status,
           cls=error_class(status, getattr(via if via is not None else body, 'location', None), str(body)))
    try:
        if throttle and not _dump_allowed(label, step):
            return
        os.makedirs(DEBUG_DIR, exist_ok=True)
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_label = re.sub(r'[^\w.\-]+', '_', label)
        # Second-resolution timestamps plus parallel dates means two dumps can land
        # in the same second; without the counter one silently overwrites the other.
        stem = os.path.join(
            DEBUG_DIR, f'{ts}_{_dump_seq()}_{safe_label}_{step}_status{status}')
        # A 0-byte body is the common case for these failures and its `.html` is
        # pure noise; the headers file records the size either way.
        if str(body):
            with open(stem + '.html', 'w', encoding='utf-8') as f:
                f.write(str(body))
        with open(stem + '.headers.txt', 'w', encoding='utf-8') as f:
            f.write(_headers_section(body))
            if via is not None:
                f.write('\n# ── preceding response (the redirect that led here) ──\n')
                f.write(_headers_section(via))
        loc = getattr(via if via is not None else body, 'location', None) or''
        log(f"  {Y}Debug response saved: {os.path.basename(stem)}"
            f" — location: {loc or '(none)'}{X}")
        _prune_debug_dir()
    except Exception as e:
        log(f"  {R}Failed to save debug response: {e}{X}")


_dump_lock = threading.Lock()
_dump_last = {}   # (label, step) -> monotonic time of last dump
_dump_counter = 0


def _dump_seq():
    """A short per-process counter, to keep same-second filenames distinct."""
    global _dump_counter
    with _dump_lock:
        _dump_counter += 1
        return f'{_dump_counter:04d}'


def _dump_allowed(label, step):
    """True at most once per DEBUG_DUMP_INTERVAL per label+step. Keyed on elapsed time,
    not status, so an upstream flapping between two statuses cannot dump every cycle."""
    now = time.monotonic()
    with _dump_lock:
        key = (label, step)
        if now - _dump_last.get(key, float('-inf')) < DEBUG_DUMP_INTERVAL:
            return False
        _dump_last[key] = now
        # Unbounded growth would otherwise be one entry per (date, hotel, step)
        # for the lifetime of the process.
        if len(_dump_last) > 2000:
            cutoff = now - DEBUG_DUMP_INTERVAL
            for k in [k for k, t in _dump_last.items() if t < cutoff and k != key]:
                del _dump_last[k]
        return True


def _prune_debug_dir():
    """Keep DEBUG_DIR to DEBUG_DUMP_KEEP files, oldest deleted first."""
    try:
        entries = []
        with os.scandir(DEBUG_DIR) as it:
            for e in it:
                if e.is_file():
                    entries.append((e.stat().st_mtime, e.path))
        if len(entries) <= DEBUG_DUMP_KEEP:
            return
        entries.sort()
        for _, path in entries[:len(entries) - DEBUG_DUMP_KEEP]:
            try:
                os.unlink(path)
            except OSError:
                pass
    except OSError:
        pass


# ── Hotel name matching ─────────────────────────────────────────────
# Names arrive HTML-escaped and mix full-width (U+3000) with ordinary spaces, so raw
# equality lets a skip entry silently miss — and an unmatched skip name books a hotel
# meant to be skipped. Normalizing both sides removes the whole class.

def _norm_hotel(name):
    """Casefold, unescape entities, NFKC-fold, and collapse all whitespace.

    NFKC is what makes a *visually identical* name match. 鳴子温泉　湯元　吉祥 is served
    with 祥 as U+FA1A CJK COMPATIBILITY IDEOGRAPH, not U+7965, so the skip entry typed
    from the roster missed it and the hotel was applied for and confirmed
    (reservations.json 2026-09-22). Compatibility ideographs are singleton
    decompositions, so folding either side to NFKC collapses the pair. The same trap is
    loaded in 館 (U+FA2C), 都 (U+FA26), 六 (U+F9D1), 彩 (U+FA84), 紀 (U+2F96A),
    志/摩 (U+2F89E/U+2F8C3) and 蓼 (U+F9C2), all present in current skip entries.
    NFKC also folds half-width katakana and full-width ASCII, which can only widen a
    match; whitespace differences are collapsed anyway.
    """
    return re.sub(
        r'\s+', '',
        unicodedata.normalize('NFKC', _html.unescape(name or ''))).casefold()


_SKIP_NORM = frozenset(_norm_hotel(n) for n in SKIP_HOTELS if _norm_hotel(n))
_PRIORITY_NORM = tuple(_norm_hotel(p) for p in PRIORITY_HOTELS if _norm_hotel(p))
# The allow-list (the Worker's settings.search): None = none, every facility not skipped is eligible (a local run, an
# older Worker). DONE_DATES: the nights with a confirmed booking in the record (set_done_dates).
SEARCH_HOTELS = None
_SEARCH_NORM = None
DONE_DATES = frozenset()


def order_hotels(hotels):
    """Sort (id, name) pairs so PRIORITY_HOTELS come first, in configured order.

    Hotels book sequentially at ~10 requests each, so this is the difference between
    attempting NAGU at once and a minute later behind five others. Stable, so the rest
    keep the site's order; unmatched names rank last.
    """
    def rank(name):
        n = _norm_hotel(name)
        return next((i for i, p in enumerate(_PRIORITY_NORM) if p in n),
                    len(_PRIORITY_NORM))
    return sorted(hotels, key=lambda h: rank(h[1]))


def is_skipped(name):
    return _norm_hotel(name) in _SKIP_NORM


def is_searched(name):
    """On the allow-list (settings.search, exact after _norm_hotel), or no allow-list at all (the skip-list rule)."""
    allow = _SEARCH_NORM
    return allow is None or _norm_hotel(name) in allow


def is_eligible(name):
    """May be applied for: searched and not skipped (skipping wins when a name is on both)."""
    return is_searched(name) and not is_skipped(name)


def _date_css_class(body, date):
    return ex(body, rf'class=\\"([^"\\]*)\\\"[^>]*data-join-time=\\"{date}\\"') or ''


# Calendar cell classes: `empty` (○) and `a_little` (few left) are both clickable
# and both applicable for; `full` and `over` are not. Matching `empty` alone
# silently skipped every limited-availability date — the slots most likely to still
# be open were the ones being ignored. See its/SITE.md §4.
_AVAILABLE_CLASSES = ('empty', 'a_little')


def is_available(css_class):
    """True if a calendar cell's CSS class marks the date as bookable."""
    return any(c in (css_class or '') for c in _AVAILABLE_CLASSES)


# The site's "no vacant rooms in the specified facility" page. It has no booking
# form, so without this check it is indistinguishable from a broken extractor.
_NO_ROOMS_TEXT = '空き部屋がございません'

# Path every expired-session redirect lands on: a stale `s=` token answers 302,
# 0 bytes, `Location: /service_category/index`. The largest failure class on disk.
_SESSION_DEAD_PATH = '/service_category/index'


def _is_session_dead(status, location):
    return status == 302 and _SESSION_DEAD_PATH in (location or '')


def book_one_hotel(tag, c, target_date, s_param, auth, hotel_id, hotel_name, guests=None):
    """Book a single hotel for a date. Steps 3-9. Returns True on success.

    `guests` is the chain's guest count, read once (`book_all_hotels_for_date`): steps 6 and 7 must send the same one
    even if the settings change between them."""
    label = f"{target_date}_{hotel_name}"
    guests = NUM_GUESTS if guests is None else guests

    def fail(msg, step, s, body, via=None):
        """Report a step that could not proceed, dump the response, give up."""
        log(f"{tag}   {R}{msg}{X}")
        _dump_debug(label, step, s, body, via)
        return False

    # STEP 3: Select hotel
    log(f"{tag} {C}Booking: {hotel_name}{X}")
    s, body, _ = c('POST', BASE + '/calendar_apply/apply_service_select',
        {'utf8': '\u2713', 'authenticity_token': auth, 'empty': '',
         'join_time': target_date, 's': s_param, 'service_group_id': hotel_id})
    services = re.findall(r'data-apply-service-id="(\d+)".*?>(.*?)</a>', body)
    if not services:
        return fail(f'No services for {hotel_name}', 'step3_service_select', s, body)
    auth = ex(body, _AUTH_RE)

    # STEP 4: Select service (302)
    service_id = services[0][0]
    s, body, loc = c('POST', BASE + '/calendar_apply/check_apply_service_coma',
        {'utf8': '\u2713', 'authenticity_token': auth,
         'join_time': target_date, 's': s_param, 'apply_service_id': service_id})
    if not loc or 'empty_new' not in loc:
        return fail('Step 4 redirect failed', 'step4_check_coma', s, body)

    # STEP 5: Load booking form
    referer_url = loc
    s, body, _ = c('GET', loc)
    csrf = ex(body, _CSRF_RE)
    auth = ex(body, _AUTH_RE)
    form_action = ex(body, r'action="(/apply/empty_create\?s=[^"]+)"')
    coma_s = ex(body, r"coma_search\('([^']+)'\)")
    if not form_action or not coma_s:
        # The no-vacant-rooms page has no booking form, so it lands here. An ordinary
        # lost race, not a fault, so no red lines and no dump.
        if _NO_ROOMS_TEXT in body:
            log(f"{tag}   {Y}No rooms left at {hotel_name} (site reports facility full){X}")
            return False
        missing = [p for p, v in [('form_action', form_action), ('coma_s', coma_s),
                   ('csrf', csrf), ('auth', auth)] if not v]
        title = ex(body, r'<title>(.*?)</title>') or '(no title)'
        snippet = re.sub(r'<[^>]+>', '', body)[:200].strip()
        log(f"{tag}   {R}Missing form params on booking page (status {s}, missing: {', '.join(missing)}){X}")
        log(f"{tag}   {R}  url: {loc}{X}")
        log(f"{tag}   {R}  title: {title}{X}")
        log(f"{tag}   {R}  snippet: {snippet}{X}")
        _dump_debug(label, 'step5_booking_form', s, body)
        return False

    # STEP 6: Search rooms
    s, body, _ = c('POST',
        BASE + '/apply/empty_new?s=' + urllib.parse.quote(coma_s, safe=''),
        {'utf8': '\u2713', 'authenticity_token': auth,
         'apply[join_time]': target_date, 'apply[night_count]': '1',
         'apply[stay_persons]': guests, 'apply[hope_rooms]': '1'},
        _ajax(csrf, referer_url))
    if 'service_category' in body:
        return fail('Session expired at room search', 'step6_room_search', s, body)
    rooms = re.findall(r'name=\\"apply\[coma\[(\d+)\]\]\\".*?value=\\"(\d+)\\"', body)
    guid = ex(body, r'apply_session_guid.*?value=\\"([^"\\]+)\\"')
    if not rooms:
        return fail('No rooms available', 'step6_no_rooms', s, body)
    log(f"{tag}   {C}{len(rooms)} rooms -> selecting room{X}")

    # STEP 7: the hold, and the point of no return — nothing here can release one.
    # The site then refuses a second application at the same facility, so no code
    # has to track the hold itself. The runner's gate is asked here, as late as it can
    # be: a lease lost or a deadline passed while steps 3-6 ran still refuses.
    ok, why = hold_allowed(target_date, hotel_name)
    if not ok:
        log(f"{tag}   {Y}Not taking a hold on {hotel_name}: {why}{X}")
        notify('hold_refused', why=why)
        return False
    room_id = rooms[0][0]
    s, body, loc = c('POST', BASE + form_action,
        {'utf8': '\u2713', 'authenticity_token': auth,
         'apply[join_time]': target_date, 'apply[night_count]': '1',
         'apply[stay_persons]': guests, 'apply[hope_rooms]': '1',
         'apply_session_guid': guid, f'apply[coma[{room_id}]]': room_id},
        {'Referer': referer_url})
    s, body, via = _follow(c, s, body, loc)

    # STEP 8: Agree to rules
    if '\u540c\u610f' not in body:
        return fail('Not on rules page', 'step8_rules', s, body, via)
    auth = ex(body, _AUTH_RE)
    form_act = ex(body, r'<form[^>]*action="([^"]*)"[^>]*method="post"')
    # The hidden `s` is mandatory even though the action carries no `s` query param;
    # omit it and the server drops the session. Send no `commit`: 同意する is a button.
    s_rule = ex(body, r'name="s"[^>]*value="([^"]*)"')
    if not form_act:
        return fail('Missing rules form action', 'step8_rules_form', s, body)
    post_data = {'utf8': '\u2713', 'authenticity_token': auth}
    if s_rule:
        post_data['s'] = s_rule
    s, body, loc = c('POST', BASE + form_act, post_data)
    s, body, via = _follow(c, s, body, loc)

    # STEP 9: Submit email
    if 'email' not in body.lower():
        return fail('Not on email page', 'step9_email_page', s, body, via)
    auth = ex(body, _AUTH_RE)
    form_act = ex(body, r'<form[^>]*action="([^"]*)"[^>]*method="post"')
    token_field = ex(body, r'name="__token__"[^>]*value="([^"]*)"')
    if not form_act:
        return fail('Missing email form action', 'step9_email_form', s, body)
    post_data = {
        'utf8': '\u2713', 'authenticity_token': auth,
        'email': EMAIL, 'commit': '\u9001\u4fe1',
    }
    if token_field:
        post_data['__token__'] = token_field
    # Dispatches the confirmation email — 「メール送信を完了しました」, not a reservation.
    # Never repeat it: it consumes `__token__` and sends mail, and `--max-time` can
    # expire after the server accepted it. Steps 3-8 only navigate, so they retry.
    s, body, loc = c('POST', BASE + form_act, post_data, retry=False)
    if s == 0:
        log(f"{tag}   {R}Email submit got no response: outcome unknown, not "
            f"retrying ({hotel_name} may already have been applied for){X}")
        return False
    s, body, via = _follow(c, s, body, loc)

    if 'send_complete' in body:
        # Not a reservation: this is 「メール送信を完了しました」. The room is held and
        # the site has emailed a link that still has to be followed. holds.json
        # records the *hold*.
        log(f"{tag}   {B}{G}HELD + MAIL SENT: {hotel_name}{X}")
        save_booking(target_date, hotel_name)
        notify('hold', date=target_date, hotel=hotel_name)
        _queue_confirmation(target_date, hotel_name, tag)
        return True

    return fail('Final page not send_complete', 'step9_final', s, body, via)


def _queue_confirmation(target_date, hotel_name, tag):
    """Hand the emailed leg to the confirm worker and return immediately.

    Deliberately not run here: two holds taken in the same second used to race for
    the same confirmation mail and both took the same `c=` link, filing one
    application against an unknown date and wasting the other hold.

    Imported lazily because `confirm_booking` imports this module, and it must never
    be able to stop a booking thread — a hold plus a sent mail is worth keeping, so
    every failure here is logged and swallowed.
    """
    allowed, code, why = confirm_allowed(target_date)
    if not allowed:
        log(f"{tag}   {Y}Not completing {hotel_name} for {target_date}: {why}{X}")
        log(f"{tag}   {B}{Y}HUMAN NEEDED: the room is held and the mail to {EMAIL} "
            f"is sent. Open its link and finish it now.{X}")
        notify('human_needed', date=target_date, hotel=hotel_name, detail=code)
        return
    try:
        import confirm_booking
        depth = confirm_booking.enqueue(target_date, hotel_name)
    except Exception as e:
        log(f"{tag}   {R}Cannot queue the confirmation ({e!r}); {hotel_name} needs "
            f"a human to finish from the mail{X}")
        notify('human_needed', date=target_date, hotel=hotel_name, detail='queue_failed')
        return
    log(f"{tag}   {C}Queued for confirmation ({depth} pending){X}")


def _calendar_select(c, csrf, s_param, month_first_day, referer):
    """POST the month-nav AJAX. One response carries every date in that month."""
    return c('POST', BASE + '/calendar_apply/calendar_select',
             {'join_date': month_first_day, 's': s_param},
             _ajax(csrf, referer))


def _month_rendered(status, body):
    """True when a month-nav response actually carries a calendar.

    Status alone is insufficient: under `protect_from_forgery with: :null_session` a
    rejected CSRF token is not a 422 \u2014 it runs with an empty session and can return
    200 with no date cells. Trusting the status reports "no dates available" forever
    while looking healthy.
    """
    return status == 200 and 'data-join-time' in body


def _open_calendar_session(c, cookie_file, url, target_date, tag, label,
                           check_availability=True):
    """Start a clean session on the calendar, positioned on target_date's month.

    Returns `(outcome, auth, s_param)` where outcome is one of:
      'ok'           \u2014 session live, month in view
      'retry'        \u2014 transient: 5xx, transport failure, or a dead session
      'unavailable'  \u2014 the date is genuinely not open for application
      'failed'       \u2014 a response that repeating will not fix
    """
    open(cookie_file, 'w').close()  # fresh cookie jar

    s, body, loc = c('GET', url)
    if s != 200:
        if _is_retryable(s) or _is_session_dead(s, loc):
            log(f"{tag} {Y}calendar GET {s}, will retry{X}")
            return 'retry', None, None
        log(f"{tag} {Y}calendar GET returned {s}{X}")
        _dump_debug(label, 'calendar_get', s, body)
        return 'failed', None, None

    csrf = ex(body, _CSRF_RE)
    auth = ex(body, _AUTH_RE)
    s_param = ex(body, _S_RE)

    if f'data-join-time="{target_date}"' in body:
        return 'ok', auth, s_param

    target_ym = f"{target_date[:4]}-{target_date[5:7]}-01"
    s_nav, body_nav, loc_nav = _calendar_select(c, csrf, s_param, target_ym, url)
    # Gated on the response *shape*, not the status \u2014 see _month_rendered. A
    # null-session 200 read as 'unavailable' is the one answer that suppresses the
    # retry this needs.
    if not _month_rendered(s_nav, body_nav):
        if s_nav == 200 or _is_retryable(s_nav) or _is_session_dead(s_nav, loc_nav):
            log(f"{tag} {Y}month nav {s_nav} with no calendar, will retry{X}")
            return 'retry', None, None
        log(f"{tag} {Y}month nav returned {s_nav}{X}")
        _dump_debug(label, 'calendar_select', s_nav, body_nav)
        return 'failed', None, None

    if check_availability:
        cell = _date_css_class(body_nav, target_date)
        if not is_available(cell):
            log(f"{tag} {Y}date not available (class: {cell or 'no cell found'}){X}")
            return 'unavailable', None, None

    return 'ok', auth, s_param


def _select_date(c, target_date, auth, s_param, tag, label):
    """POST service_group_select. Returns `(outcome, hotels, auth)`.

    This produces the single largest failure class on disk: a 302 to
    /service_category/index with an empty body. That is a dead session, and worth
    another attempt on a fresh one rather than costing the slot.
    """
    s, body, loc = c('POST', BASE + '/calendar_apply/service_group_select',
        {'utf8': '\u2713', 'authenticity_token': auth,
         'join_time': target_date, 's': s_param})
    if s != 200:
        _dump_debug(label, 'service_group_select', s, body)
        if _is_retryable(s) or _is_session_dead(s, loc):
            log(f"{tag} {Y}date select {s} "
                f"({'session expired' if _is_session_dead(s, loc) else 'transient'}),"
                f" will retry{X}")
            return 'retry', [], None
        log(f"{tag} {Y}date select returned {s}{X}")
        return 'failed', [], None

    all_hotels = [(gid, _html.unescape(name)) for gid, name in
                  re.findall(r'data-service-group-id="(\d+)".*?>(.*?)</a>', body)]
    if not all_hotels:
        log(f"{tag} {Y}no hotels listed (status 200){X}")
        _dump_debug(label, 'service_group_select', s, body)
        return 'failed', [], None
    return 'ok', all_hotels, ex(body, _AUTH_RE)


def book_all_hotels_for_date(target_date, label):
    """Hold every eligible hotel for one date, retrying transient failures.

    Returns (date, list_of_held_hotels). Retries cover only the setup requests: once a
    hotel is under way it either completes or is left alone, so nothing is applied for
    twice.
    """
    tag = f"[{label}]"
    booked = []
    attempted = set()
    guests = NUM_GUESTS   # once per chain (book_one_hotel)

    with _booking_in_flight():
        for attempt in range(1, max(1, BOOK_MAX_ATTEMPTS) + 1):
            if attempt > 1:
                log(f"{tag} {C}retry {attempt}/{BOOK_MAX_ATTEMPTS} on a fresh session{X}")
                time.sleep(BOOK_RETRY_DELAY)
            outcome = _book_date_once(target_date, label, tag, booked, attempted, guests)
            if outcome != 'retry':
                break
        else:
            log(f"{tag} {R}gave up on {target_date} after {BOOK_MAX_ATTEMPTS} attempts{X}")

    return target_date, booked


def _book_date_once(target_date, label, tag, booked, attempted, guests=None):
    """One full pass over a date's hotels. Returns an outcome string.

    `booked` is appended to in place and `attempted` records hotels already
    tried, so a retry resumes rather than re-applying for what it already sent.
    The hold gate is asked before each hotel's requests: closed, the pass ends
    ('done', no retry) without sending them; a hotel skipped meanwhile is passed over.
    """
    url = _read_cached_url()
    if not url:
        return 'failed'

    with session_jar(f'cookies_{target_date}_') as (cookie_file, c):
        outcome, auth, s_param = _open_calendar_session(
            c, cookie_file, url, target_date, tag, label)
        if outcome != 'ok':
            return outcome

        outcome, all_hotels, auth = _select_date(
            c, target_date, auth, s_param, tag, label)
        if outcome != 'ok':
            return outcome

        log(f"{tag} {C}Found {len(all_hotels)} hotels: "
            f"{', '.join(n for _, n in all_hotels)}{X}")

        seen = {_norm_hotel(n) for n in get_booked_hotels(target_date)}
        seen |= {_norm_hotel(n) for n in attempted}
        hotels, filtered = [], []
        for gid, name in all_hotels:
            if is_skipped(name):
                filtered.append(f'{name} (skip list)')
            elif not is_searched(name):
                filtered.append(f'{name} (not searched)')
            elif _norm_hotel(name) in seen:
                filtered.append(f'{name} (already booked/attempted)')
            else:
                hotels.append((gid, name))
        hotels = order_hotels(hotels)
        notify('offered', date=target_date, names=[n for _, n in all_hotels],
               eligible=[n for _, n in hotels])

        if not hotels:
            log(f"{tag} {Y}All hotels filtered out ({'; '.join(filtered)}){X}")
            return 'done'

        log(f"{tag} {C}{len(hotels)} to book (priority first): "
            f"{', '.join(n for _, n in hotels)}{X}")

        for i, (hotel_id, hotel_name) in enumerate(hotels):
            ok, why = hold_allowed(target_date, hotel_name)
            if not ok:
                log(f"{tag} {Y}Not applying for {hotel_name}: {why}{X}")
                notify('hold_refused', why=why)
                if why == 'not_wanted' and still_wanted(target_date):
                    continue   # this hotel was skipped meanwhile; the next may still be wanted
                return 'done'
            if i > 0:
                # Fresh session per hotel; report a failure up so the outer loop can
                # retry the hotels not yet reached.
                outcome, auth, s_param = _open_calendar_session(
                    c, cookie_file, url, target_date, tag, label,
                    check_availability=False)
                if outcome != 'ok':
                    return outcome
                outcome, _relisted, auth = _select_date(
                    c, target_date, auth, s_param, tag, label)
                if outcome != 'ok':
                    return outcome

            attempted.add(hotel_name)
            if book_one_hotel(tag, c, target_date, s_param, auth,
                              hotel_id, hotel_name, guests):
                booked.append(hotel_name)
                log(f"{tag} {B}{G}=== Total HELD for {target_date}: "
                    f"{len(booked)} ({', '.join(booked)}){X}")

        return 'done'


def _ms_since(t0):
    return int((time.monotonic() - t0) * 1000)


def _future_dates(target_dates):
    """Drop dates that have already passed — the site marks those cells `over`,
    so polling them asks forever about something that cannot happen."""
    today = tokyo_today().isoformat()
    return [d for d in target_dates if d >= today]


_ISO_DATE = re.compile(r'\A\d{4}-\d{2}-\d{2}\Z')


def _tokyo_tz():
    """Asia/Tokyo; a fixed UTC+9 if the tzdata isn't there (Japan has no DST, so they agree)."""
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo('Asia/Tokyo')
    except Exception:
        return timezone(timedelta(hours=9), 'JST')


TOKYO = _tokyo_tz()
# The clock the dates are read from; replaceable for the tests.
_now = time.time


def tokyo_today():
    """Today in Tokyo. Every date here is the site's (and the contract's `tokyoToday`): on Actions the runner's clock is
    UTC, nine hours behind, so `date.today()` would call 00:30 JST on D−10 D−11 and pass the free-cancellation gate."""
    return datetime.fromtimestamp(_now(), TOKYO).date()


def days_until(target_date, today=None):
    """Whole days from `today` (default: Tokyo's) to `target_date`, or None if it will not parse.

    Strictly `YYYY-MM-DD`: `date.fromisoformat` also takes `20260905` and week dates
    since 3.11, and a safety gate should not widen because the stdlib did. None rather
    than a raise or a guess — every caller reads it as "do not commit", and a silent 0
    would read as "today".
    """
    if not isinstance(target_date, str) or not _ISO_DATE.match(target_date):
        return None
    try:
        target = date.fromisoformat(target_date)
    except ValueError:
        return None
    return (target - (today or tokyo_today())).days


def confirm_allowed(target_date, today=None):
    """`(allowed, code, why)` — may the application for this date be *completed*? `code` is the refusal as the
    human_needed detail (`auto_off`, else `near_date`; '' when allowed), `why` the prose for the log.

    Completing means 予約確定, with a real cancellation liability. Free web cancellation
    ends at D−10, so anything nearer is left for a person. Gates the final POSTs only:
    the hold and the mail still happen, which is what lets a human finish by hand.

    Fails closed — wrongly committing costs a non-refundable booking, wrongly refusing
    costs one slot. An unreadable date or floor is refused as `near_date`: a person decides.
    """
    if not AUTO_CONFIRM:
        return False, 'auto_off', 'AUTO_CONFIRM is off'

    left = days_until(target_date, today)
    if left is None:
        return False, 'near_date', f'cannot read a date out of {target_date!r}'

    try:
        minimum = int(AUTO_CONFIRM_MIN_DAYS)
    except (TypeError, ValueError):
        return False, 'near_date', f'AUTO_CONFIRM_MIN_DAYS is not a number: {AUTO_CONFIRM_MIN_DAYS!r}'
    if minimum < 0:
        return False, 'near_date', f'AUTO_CONFIRM_MIN_DAYS is negative: {minimum}'

    if left < minimum:
        return False, 'near_date', (f'{target_date} is {left} day(s) away, inside the '
                       f'{minimum}-day floor — free cancellation ends at D-10, '
                       f'so a person has to decide on this one')
    return True, '', ''


def scan_and_book_month(month_str, target_dates, label, stop_event=None):
    """Scan a month's calendar forever, spawning a booking thread per available date.

    `target_dates` is a list, or a callable returning the month's current dates, called every cycle (the remote
    runner's settings change under a running scanner). Each cycle that reads the calendar reports
    `notify('scan', ok=…, ms=…)` (with `available`, or the failure's `code`); a failed read also reports `fail` with its
    step.

    One `calendar_select` POST covers every target date in the month; the calendar GET
    that mints the csrf/s pair is skipped while a cached pair works, so the
    steady-state cycle is one request.

    The whole loop body is guarded — this is the only thing scanning this month, it is
    a daemon, and main() never joins it, so an escaping exception would stop the month
    silently. `stop_event` stops it: the Supervisor's for a month gone from the dates, a test's so a finished
    test's scanner cannot book into the next one's fixtures.
    """
    tag = f"[{label}]"
    month_ym = f"{month_str}-01"
    # An Event nobody sets makes `.wait(n)` behave exactly like `time.sleep(n)`, so
    # production needs no second code path to wake early on a stop request.
    stop_event = stop_event or threading.Event()

    with session_jar(f'cookies_scan_{month_str}_') as (cookie_file, c):

        def mint_tokens(url, attempt):
            """GET the calendar for a fresh (csrf, s) pair. None if the GET failed.

            The request session reuse exists to avoid, and the most failure-prone in
            the program: most dumps are a 503 here, and a 503 is how the 24-hour ban
            presents.
            """
            t0 = time.monotonic()
            st, bd, lc = c('GET', url)
            if st != 200:
                # Only after a failure: truncating every cycle asked for a brand-new
                # session ~4,300 times a day, discarding a working one each time.
                if _is_session_dead(st, lc) or _is_retryable(st):
                    open(cookie_file, 'w').close()
                log(f"{tag} {Y}[{attempt}] URL returned {st}, waiting...{X}")
                cls = error_class(st, lc, bd)
                notify('fail', step='calendar_get', status=st, cls=cls)
                notify('scan', ok=False, code=cls, ms=_ms_since(t0))
                return None
            return ex(bd, _CSRF_RE), ex(bd, _S_RE)

        nav_ms = [0]   # the last calendar_select's duration (the scan's per-cycle history)

        def nav_month(tokens, url):
            csrf, s_param = tokens
            t0 = time.monotonic()
            try:
                return _calendar_select(c, csrf, s_param, month_ym, url)
            finally:
                nav_ms[0] = _ms_since(t0)

        attempt = 0
        failures = 0          # consecutive failed cycles, drives the backoff
        tokens = None         # cached (csrf, s_param) for the live session
        tokens_url = None     # the URL they were minted from
        reuse = SCAN_REUSE_SESSION
        reuse_failures = 0    # consecutive rejections of a cached pair
        while not stop_event.is_set():
            attempt += 1
            if attempt > 1:
                # Back off while the site is unhappy, and jitter always: the
                # per-month scanners otherwise settle into lockstep and arrive
                # as a burst.
                delay = min(RETRY_DELAY * (2 ** min(failures, 8)), SCAN_BACKOFF_MAX)
                stop_event.wait(delay + random.uniform(0, SCAN_JITTER))
                if stop_event.is_set():
                    break

            try:
                dates = _future_dates(target_dates() if callable(target_dates) else target_dates)
                if not dates:
                    log(f"{tag} {Y}all target dates are in the past, idle{X}")
                    stop_event.wait(SCAN_BACKOFF_MAX)
                    continue

                url = _read_cached_url()
                if not url:
                    log(f"{tag} {Y}[{attempt}] no URL available, waiting...{X}")
                    failures += 1
                    continue

                if url != tokens_url:
                    # A re-solved CAPTCHA means a new token and a new session.
                    tokens, tokens_url = None, url

                s_nav = 0
                body_nav = ''
                if tokens is not None:
                    s_nav, body_nav, _ = nav_month(tokens, url)
                    if _month_rendered(s_nav, body_nav):
                        reuse_failures = 0
                    else:
                        # Re-mint in this same cycle, and do not charge `failures`:
                        # a token reaching the end of its session is expected, and
                        # letting it drive the backoff would walk the poll interval
                        # up to SCAN_BACKOFF_MAX and stop finding anything.
                        reuse_failures += 1
                        log(f"{tag} {Y}[{attempt}] cached session rejected "
                            f"({s_nav}), re-minting{X}")
                        open(cookie_file, 'w').close()
                        tokens = None
                        if reuse_failures >= max(1, SCAN_REUSE_MAX_FAILURES):
                            reuse = False
                            log(f"{tag} {Y}session reuse disabled after "
                                f"{reuse_failures} rejections; back to a "
                                f"calendar GET per cycle{X}")

                if tokens is None:
                    tokens = mint_tokens(url, attempt)
                    if tokens is None:
                        failures += 1
                        continue
                    s_nav, body_nav, _ = nav_month(tokens, url)

                if not _month_rendered(s_nav, body_nav):
                    # Fresh tokens and still no calendar. Without this the scan says
                    # "no dates available" forever while the URL monitor's plain GET
                    # still returns 200, so no re-solve ever fires.
                    log(f"{tag} {Y}[{attempt}] month nav returned {s_nav}, waiting...{X}")
                    open(cookie_file, 'w').close()
                    tokens = None
                    _dump_debug(label, 'calendar_select', s_nav, body_nav)
                    notify('scan', ok=False, code=error_class(s_nav, None, body_nav), ms=nav_ms[0])
                    failures += 1
                    continue

                if not reuse:
                    tokens = None   # re-mint every cycle

                failures = 0

                available = [td for td in dates
                             if is_available(_date_css_class(body_nav, td))]
                notify('scan', ok=True, available=available, ms=nav_ms[0])

                if not available:
                    log(f"{tag} {Y}[{attempt}] no dates available "
                        f"({len(dates)} checked), waiting...{X}")
                    continue

                log(f"{tag} {C}[{attempt}] {len(available)}/{len(dates)} dates "
                    f"available: {', '.join(d[5:] for d in available)}{X}")

                # A closed hold gate (the lease, the deadline, an unsynced record) spawns nothing: steps 3-6 per
                # hotel every cycle would be requests for a hold that can't be taken.
                ok, why = hold_allowed()
                if not ok:
                    log(f"{tag} {Y}[{attempt}] not booking: {why}{X}")
                    notify('hold_refused', why=why)
                    continue

                # BOOK: Spawn parallel threads, one per available date
                with ThreadPoolExecutor(max_workers=len(available)) as pool:
                    futures = {pool.submit(book_all_hotels_for_date, td,
                                           f"{label} {td[5:]}"): td
                               for td in available}
                    for future in as_completed(futures):
                        try:
                            td, booked_list = future.result()
                        except Exception as e:
                            log(f"{tag} {R}Booking thread for "
                                f"{futures[future]} failed: {e!r}{X}")
                            continue
                        if booked_list:
                            log(f"{tag} {G}Held for {td}: "
                                f"{', '.join(booked_list)}{X}")

            except Exception as e:
                failures += 1
                log(f"{tag} {R}[{attempt}] scan cycle error: {e!r}{X}")
