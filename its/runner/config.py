"""Settings for the ITS booker (README.md).

Two kinds. **Tuning** (intervals, timeouts, the HTTP fingerprint, the confirm gate's floor) is fixed here. **The
booking settings** (TARGET_DATES, SKIP_HOTELS, PRIORITY_HOTELS, RETRY_DELAY, NUM_GUESTS, AUTO_CONFIRM) are this file's
for a local run only: `main.py --remote` (Actions) takes them from the its-bot Worker and installs them with
`book_hotels.apply_settings()`, which is also how a change made in the app reaches a running scanner.

State (the `s=` cache, holds/reservations, the log, debug dumps) lives in STATE_DIR: `ITS_STATE_DIR`, default
`state/` beside this file (gitignored). Everything there is credential-bearing; on Actions it is uploaded only
age-encrypted.
"""
import os
import re

# ── Paths ────────────────────────────────────────────────────────────
_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_dotenv(path):
    """Read `KEY=value` lines from `path` into the environment.

    Done here, not left to `source .env`: forgetting to source it fails silently,
    with mail going to a mailbox nobody reads. A real env var wins, but only a
    *non-empty* one — an exported-but-empty value is a placeholder, and `setdefault`
    would let one stale `export ITS_KIGOU=` shadow the file forever.

    `export `, quotes, comments and blank lines are tolerated so a shell can source
    the same file.
    """
    try:
        with open(path, encoding='utf-8') as f:
            lines = f.readlines()
    except OSError:
        return
    for raw in lines:
        line = raw.strip().lstrip('﻿')
        if not line or line.startswith('#'):
            continue
        if line.startswith('export '):
            line = line[len('export '):].lstrip()
        key, sep, value = line.partition('=')
        if not sep:
            continue
        key = key.strip()
        value = value.strip()
        quoted = len(value) >= 2 and value[0] == value[-1] and value[0] in '"\''
        if quoted:
            value = value[1:-1]
        else:
            # Only a whitespace-introduced comment, so a value containing '#'
            # survives; `ITS_ZIP=1000001  # note` must not set the whole string.
            value = re.split(r'\s#', value, maxsplit=1)[0].rstrip()
        if not os.environ.get(key):
            os.environ[key] = value


_load_dotenv(os.path.join(_DIR, '.env'))

STATE_DIR = os.environ.get('ITS_STATE_DIR') or os.path.join(_DIR, 'state')
CALENDAR_URL_CACHE = os.path.join(STATE_DIR, 'calendar_url_cache.txt')
HOLDS_FILE = os.path.join(STATE_DIR, 'holds.json')
LOG_FILE = os.path.join(STATE_DIR, 'its_booking.log')
DEBUG_DIR = os.path.join(STATE_DIR, 'debug_responses')
USER_AGENT_CACHE = os.path.join(STATE_DIR, 'chrome_user_agent.txt')

# ── Booking settings ─────────────────────────────────────────────────
# Stays to look for (the night of arrival), YYYY-MM-DD. Empty here: the Worker supplies them (the app's ボット → 保養所);
# fill it only for a local run without --remote.
TARGET_DATES = []
NUM_GUESTS = '2'

# ── Network tuning ───────────────────────────────────────────────────
RETRY_DELAY = 15          # seconds between scan retry attempts
CURL_MAX_ATTEMPTS = 3     # max attempts per curl request (1 = no retry)
URL_CHECK_INTERVAL = 60   # seconds between URL validity checks
URL_REFRESH_INTERVAL = 1800  # seconds between proactive URL refreshes

# Doubling delay before a curl retry. Must be non-zero: retrying a 503 in the same
# millisecond never once helped.
CURL_RETRY_BACKOFF = 0.5
CURL_RETRY_BACKOFF_MAX = 8.0
# curl's --max-time. subprocess.run gets this plus a margin, so a curl ignoring its
# deadline cannot wedge a thread.
CURL_TIMEOUT = 30

# A date just seen available is worth more than one request, so a transient failure
# retries the whole date on a fresh session rather than waiting a scan cycle.
BOOK_MAX_ATTEMPTS = 3
BOOK_RETRY_DELAY = 2.0    # seconds before re-attempting a date

# A csrf/`s` pair is valid for the life of the session (its/SITE.md §4), so the
# calendar GET that mints it is skippable — halving the steady-state scan to one
# request. Self-limiting: rejection is detected by response *shape*, tokens are
# re-minted in the same cycle, and reuse switches off after this many rejections.
SCAN_REUSE_SESSION = True
SCAN_REUSE_MAX_FAILURES = 3

# Consecutive failures multiply RETRY_DELAY up to this ceiling.
SCAN_BACKOFF_MAX = 300
# Random 0..N s per sleep; without it the per-month scanners arrive as a burst.
SCAN_JITTER = 1

# Hard ceiling on one solve: it occupies the one thread that can re-mint a session,
# so an untimed Chrome hang stops all booking behind a healthy-looking process.
CAPTCHA_TIMEOUT = 180

# The Turnstile solve (chrome.py): attempts, each waiting up to TURNSTILE_TOKEN_SEC for the token (polled every
# TURNSTILE_POLL_SEC) then reloading; SOLVE_PAUSES are the fixed waits on the homepage, the captcha page and after 次へ.
# All of it must fit inside CAPTCHA_TIMEOUT (checked below), or the timeout cuts the last attempt short every time.
TURNSTILE_ATTEMPTS = 3
TURNSTILE_TOKEN_SEC = 30
TURNSTILE_POLL_SEC = 2
TURNSTILE_RELOAD_PAUSE = 5
SOLVE_PAUSES = (3, 5, 5)
# The filing leg's fixed waits: the emailed link's page, after 申込する, after 確認 (inside BROWSER_CONFIRM_TIMEOUT).
LEG_PAUSES = (3, 6, 8)
# How long a solve or a leg waits for the one Chrome (chrome.hold): a whole solve plus its teardown.
CHROME_WAIT_SEC = 210
# Each half of a failure's evidence (the page's HTML, a screenshot): a hung Chrome must not hold the leg up further.
EVIDENCE_TIMEOUT = 10

# **No per-hotel retry cooldown, deliberately.** One existed against a claimed
# ~2,000 requests / 30 min; the logs show the longest real run is three consecutive
# cycles, under 20 requests. Repetition is bounded by SKIP_HOTELS, the holds.json
# filter, the per-call `attempted` set and the site's own refusal. All three recorded
# IP bans hit the scanner's calendar_get, so volume risk lives in RETRY_DELAY.

# ── Emailed confirmation ─────────────────────────────────────────────
# Run the emailed leg. Its last POST is the first irreversible, money-bearing action
# in this program. Off for a local run unless you mean it (the Worker's autoConfirm decides on Actions).
AUTO_CONFIRM = False

# Never complete an application for a stay nearer than this. Free web cancellation
# ends at D−10; from D−9 it costs 50% and is phone-only. 11 rather than 10 leaves a
# whole further day to cancel free — margin for clock skew and a near-midnight
# application. Nearer dates are still held and mailed, for a human to finish.
AUTO_CONFIRM_MIN_DAYS = 11

CONFIRM_MAIL_TIMEOUT = 180     # give up on a hold's mail this long after the hold
CONFIRM_POLL_INTERVAL = 10     # worker cycle; one IMAP trip serves the whole queue

# The emailed leg is filed in real Chrome, always (why: its/SITE.md §5). Needs `pydoll-python`; without it the hold
# and mail still stand and the log asks for a human.
BROWSER_CONFIRM_TIMEOUT = 240  # Chrome can hang, and a room is held meanwhile


def _check_timings():
    """The Chrome budgets nest: every solve attempt inside CAPTCHA_TIMEOUT, a solve inside the wait for Chrome, the
    leg's fixed pauses well inside its budget. Raised at import, so a bad edit fails every test and every run at once."""
    solve = TURNSTILE_ATTEMPTS * (TURNSTILE_TOKEN_SEC + TURNSTILE_RELOAD_PAUSE) + sum(SOLVE_PAUSES)
    problems = [what for what, ok in (
        (f'the solve ({solve} s) must fit in CAPTCHA_TIMEOUT ({CAPTCHA_TIMEOUT} s)', solve < CAPTCHA_TIMEOUT),
        ('CHROME_WAIT_SEC must outlast CAPTCHA_TIMEOUT', CHROME_WAIT_SEC > CAPTCHA_TIMEOUT),
        ('TURNSTILE_POLL_SEC must be under TURNSTILE_TOKEN_SEC', 0 < TURNSTILE_POLL_SEC < TURNSTILE_TOKEN_SEC),
        ('TURNSTILE_ATTEMPTS must be at least 1', TURNSTILE_ATTEMPTS >= 1),
        ('the leg\'s pauses must leave most of BROWSER_CONFIRM_TIMEOUT', 2 * sum(LEG_PAUSES) < BROWSER_CONFIRM_TIMEOUT),
        ('EVIDENCE_TIMEOUT must be short', 0 < EVIDENCE_TIMEOUT <= 30),
    ) if not ok]
    if problems:
        raise ValueError('config.py: ' + '; '.join(problems))


_check_timings()

# ── Secrets, from the environment only ───────────────────────────────
# Never hard-coded, never in a tracked file: this history is on a public remote.
# 記号/番号/カナ氏名/生年月日 are 資格認証のキー, so they are also redacted from dumps.
IMAP_HOST = os.environ.get('ITS_IMAP_HOST', 'imap.gmail.com')
IMAP_PORT = int(os.environ.get('ITS_IMAP_PORT', '993'))
IMAP_USER = os.environ.get('ITS_IMAP_USER', '')
# Google shows app passwords in groups of four; the spaces are cosmetic and IMAP
# rejects them.
IMAP_APP_PASSWORD = os.environ.get('ITS_IMAP_APP_PASSWORD', '').replace(' ', '')
MAIL_FROM = os.environ.get('ITS_MAIL_FROM', 'noreply@mail.its-kenpo.or.jp')

# Must be the mailbox IMAP reads, or the confirmation link lands out of reach. No default: an address in this file
# would be in a public repo.
EMAIL = os.environ.get('ITS_EMAIL') or IMAP_USER

APPLICANT = {
    'kigou': os.environ.get('ITS_KIGOU', ''),
    'bangou': os.environ.get('ITS_BANGOU', ''),
    'kana_sei': os.environ.get('ITS_KANA_SEI', ''),
    'kana_mei': os.environ.get('ITS_KANA_MEI', ''),
    # The live form has ONE 「カナ氏名」 box. Blank here derives "SEI　MEI".
    'kana_name': os.environ.get('ITS_KANA_NAME', ''),
    'name_sei': os.environ.get('ITS_NAME_SEI', ''),
    'name_mei': os.environ.get('ITS_NAME_MEI', ''),
    'birth': os.environ.get('ITS_BIRTH', ''),
    'sex': os.environ.get('ITS_SEX', ''),
    'zokugara': os.environ.get('ITS_ZOKUGARA', ''),
    'tel': os.environ.get('ITS_TEL', ''),
    # 事業所名, asked for by name (apply[office_name]).
    'office': os.environ.get('ITS_OFFICE_NAME', ''),
    'zip': os.environ.get('ITS_ZIP', ''),
    # 都道府県, matched against the dropdown by label, e.g. 東京都.
    'state': os.environ.get('ITS_STATE', ''),
    'addr': os.environ.get('ITS_ADDR', ''),
}

RESERVATIONS_FILE = os.path.join(STATE_DIR, 'reservations.json')

# ── Debug dumps ──────────────────────────────────────────────────────
# Throttled and pruned, so a failure repeating every cycle cannot fill the disk.
DEBUG_DUMP_INTERVAL = 300   # seconds between dumps of the same label+step
DEBUG_DUMP_KEEP = 400       # max files retained in DEBUG_DIR

# ── Logging ──────────────────────────────────────────────────────────
# Every scan cycle logs, so a healthy day is ~4,100 "no dates available" lines and
# rotation is what bounds that.
LOG_MAX_BYTES = 32 * 1024 * 1024   # rotate the log past this size
LOG_BACKUPS = 3                    # keep this many rotated logs

# ── HTTP fingerprint ─────────────────────────────────────────────────
# On, curl replays carry the UA of the Chrome that solved the CAPTCHA; off, they
# identify as curl/8.x — an obvious mid-session client switch.
#
# Deliberately NOT sent: `Origin` (absent = Rails skips its origin check),
# `Sec-Fetch-*` / `sec-ch-ua` (one static value must contradict one of the two
# request classes we make), `Accept-Encoding` (no brotli/zstd here, and a decode
# failure yields an empty body). The TLS fingerprint is still curl's, so a browser UA
# is a UA/TLS mismatch.
BROWSER_HEADERS = True
ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
ACCEPT_LANGUAGE = 'ja-JP,ja;q=0.9'
# Used only until the first CAPTCHA solve records Chrome's real UA.
FALLBACK_USER_AGENT = (
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
)

# ── Facilities (a local run only) ────────────────────────────────────
# On Actions these are the Worker's settings (the app's 施設 list: 探す = settings.search, the skip list; its
# priority is ignored: no facility ranked). The roster, every facility the site may offer with its group, kind, cutoff and the site's exact spelling, has
# ONE home: app/src/lib/its/roster.ts. This is a short local list, not a copy of it.
#
# PRIORITY_HOTELS: substrings attempted first, in this order, matched ignoring case and spacing ('NAGU' catches
# "NAGU 勝浦"). About the race, not preference: hotels are booked one after another at ~10 requests each.
PRIORITY_HOTELS = [
    'NAGU',
]

# SKIP_HOTELS: never applied for. Normalized (book_hotels._norm_hotel: entities, NFKC, whitespace, case) and compared
# for **exact membership**, not a substring: a name spelled differently from the site's never matches, and an unmatched
# skip entry books a hotel meant to be skipped (the site says 「グランドメルキュール伊勢志摩」 where its roster page says
# 「グランドメルキュール 伊勢志摩リゾート＆スパ」; roster.ts `verified` marks the spellings read off the site). Skipping
# wins over priority. Copy names from roster.ts or from a 「Found N hotels: …」 line in the log.
SKIP_HOTELS = [
    'ホテルハーヴェスト　スキージャム勝山',   # on no roster; kept so a re-contract cannot book it
]
