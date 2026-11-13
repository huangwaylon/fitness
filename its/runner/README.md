# The ITS runner

The Python booker behind 設定 → 保養所ボット (its/README.md has the whole system: the its-bot Worker, the app page, the
contract). It polls the ITS facility calendar (as.its-kenpo.or.jp) for vacancies on the target dates and, when one
appears, drives the 空き照会申込 flow over curl. Cloudflare Turnstile guards the entry, so a real Chrome solves it and
curl replays the resulting `s=` session token until it expires.

**`../SITE.md` is the single record of what the site does**: published rules, cutoffs, the request chain, the
applicant-form traps, the 503 IP ban, the Turnstile click. None of it is recoverable from the code; read it before
changing a request or an extractor. Each module's docstrings carry its own reasons; this file is the map. Three facts
govern the design, and are law:

- **`send_complete` is not a reservation.** `book_hotels.py` ends there (a hold plus a dispatched mail) and hands the
  hold to the **confirm worker**, which runs the emailed leg (申込する → 確認) off-thread and serially. Only that yields
  a 申込受付番号 and 予約確定.
- **curl reads the applicant form; only Chrome commits it.** `POST /apply/confirm` is refused for the *client*, not the
  request (curl 0 for 3, Chrome 2 for 2), so `chrome.submit` is the only committer. Without `pydoll-python`, or if
  Chrome fails, a booking still ends with the hold taken and the mail sent, and the log says `HUMAN NEEDED`. That
  measurement was taken behind an intercepting proxy: check whether it reproduces off one before restoring a curl path
  (SITE.md §5).
- **The bot does not track the 30-minute hold, deliberately.** A second application at a facility we already hold is
  refused with 「空き部屋がございません」, so a taken hold removes itself from what we are offered. Do not reintroduce
  hold accounting.

## Running

```bash
python3 main.py --remote --deadline <epoch>   # Actions (its-runner.yml): the Worker's settings, bounded, public-safe logs
python3 main.py                               # local: config.py's settings, forever, the full log on stdout
python3 main.py --check                       # preflight: .env, IMAP, the confirmation gate
python3 remote.py preflight                   # the workflow's first step: GET /runner/config, run=0|1
python3 chrome.py                             # solve only; writes the s= cache
```

The tests, from the repo root (a substring selects, `-v` shows the flow's log):

```bash
cd its/runner && python3 test_its.py && python3 test_remote.py
```

Run them as scripts from this directory; not `python3 -I` (isolated mode drops the script's directory from the import
path, so `import book_hotels` fails).

`ITS_BASE_URL` points the flow at a stand-in for the site, **loopback only** (`http://127.0.0.1:<port>`, `localhost`,
`[::1]`: an integration run against FakeITS and `wrangler dev --local`); any other value is refused and the run exits 2
(logged privately), never falling back to the real site.

Everything but `chrome.py` is stdlib + curl; `chrome.py` needs `pydoll-python` (requirements.txt, hashed), imported
inside the functions that use it so the rest runs without it. Runtime needs the `curl` binary and `pgrep`; on Linux,
Google Chrome under `xvfb-run` and `fonts-noto-cjk`. Python 3.10+ (CI and Actions: 3.12).

## Modules

| File | Role |
|---|---|
| `config.py` | Tuning (intervals, timeouts, the HTTP fingerprint, the confirm floor) and, for a local run only, the booking settings; secrets from the environment only |
| `main.py` | Orchestration: the URL monitor, the `Supervisor` (one scanner per month, the watchdog), `RemoteRun` (the `--remote` control loop), `--check` |
| `book_hotels.py` | The curl layer, the scan and the hold; `apply_settings`, `_hold_gate`, `notify` (the seams below) |
| `confirm_booking.py` | The hold queue and the emailed leg; `_commit_gate`, `imap_check` |
| `chrome.py` | The one Chrome: the Turnstile solve and the filing leg |
| `remote.py` | The Worker client and the run's state: claim, reports, the bookings queue, the lease fence |
| `logs.py` | The private log (fd 1/2) and the allowlisted public line |
| `test_its.py`, `test_remote.py` | The booking flow against FakeITS; the remote runner against FakeITS and a fake Worker |

`book_hotels.log()` is the one line formatter for the whole program (`main.py` imports it as `url_log`).

Booking and confirming are **decoupled**: a booking thread takes the hold, records it, enqueues it and returns; one
confirm worker drains that queue serially (two holds in the same second used to consume the same `c=` link). The URL
monitor solves **synchronously in its own thread**, which is what prevents overlapping solves; a *proactive* refresh is
deferred while a booking is in flight (one `s=` token carries a ~10-request chain), a *repair* never is.

### `book_hotels.py` invariants

- `is_available()` matches `empty` **and** `a_little`; `_month_rendered()` gates the month nav on the response
  *shape*, and both the scanner and `_open_calendar_session` use it.
- `_is_session_dead()` is a 302 to `/service_category/index`; `_is_retryable()` excludes 302.
- `curl()` never raises (a transport failure is `(0, '', None)`); headers are merged in Python, never appended.
- `_load_bookings()` returns `(data, ok)` and a write is **refused** while `ok` is False; `save_booking(..., path=)`
  stays a parameter.
- Hotel names match after `_norm_hotel` (unescape, NFKC, whitespace removed, casefold) on both sides; the contract's
  `normName` agrees (its/norm-cases.json). Anything on neither list is eligible; skipping wins over priority.
- **The hold** (`empty_create`) is the point of no return; the email POST is the only request sent with
  `retry=False`. **Nothing releases a hold**; there is deliberately no retry cooldown (config.py).
- **Request volume is the dominant operational risk**: the 503 セキュリティアラート is a ~24 h IP ban and every recorded
  one hit the scanner's `calendar_get`. `RETRY_DELAY` never goes under `MIN_RETRY_DELAY` (15 s), whatever the settings.
- Debug dumps are written verbatim (cookies, `s=`, and on the emailed leg the applicant's 記号/番号/カナ氏名/生年月日):
  they live only in the state dir.

### `confirm_booking.py` and `chrome.py`

Holds pair **oldest-to-oldest** with unclaimed links, legs run one at a time; no mail within `CONFIRM_MAIL_TIMEOUT`
drops the hold with `HUMAN NEEDED`. `confirm_allowed()` (AUTO_CONFIRM and the 11-day floor: free cancellation ends at
D−10) is checked at enqueue, before Chrome, and again on the 申込内容確認画面; **`unmapped` non-empty never submits**;
every non-confirmed outcome logs `HUMAN NEEDED`. `chrome.submit()` is the only thing that can file an application; the
solve runs under `CAPTCHA_TIMEOUT` and never caches a URL without `calendar_select`; the two are serialised by
`hold()`. The Turnstile click is the centred box's checkbox first (`x + w/2 − 150 + 22`), the left edge second
(SITE.md §6).

## The remote runner (`--remote`)

Settings, the bookings record and the lease are the its-bot Worker's (`ITS_WORKER_URL`, Bearer `ITS_RUNNER_TOKEN`;
contract: app/src/lib/its/contract.ts, mirrored by hand in remote.py). The seams, each a no-op for a local run:

- **Settings.** Every Worker answer is a RunnerConfig; a changed `settings` goes through `book_hotels.apply_settings`,
  which reassigns the globals the flow reads at call time (dates, skip, priority, interval, guests, auto-confirm). The
  supervisor starts and stops month scanners to match; each scanner reads its month's dates every cycle. Turning
  auto-confirm off stops a queued leg before Chrome (the gate reads the live value).
- **The record.** Holds, `confirming`, `confirmed` (with the number) and `failed` entries are queued, sent at once and
  retried with every report until the Worker has them. The Worker's record seeds `holds.json` at start (a hotel held
  for a date is never applied for again, whichever run held it).
- **The fence.** No new hold and no Chrome commit unless `now < lease.until − 60 s`, read from the lease in the last
  claim or report answer (a bookings answer can close it, never reopen it); no new hold while an entry is unsynced and
  the Worker has been unreachable > 2 min, or at once while it answers 507 `record_full`; a `confirming` entry must be
  acknowledged before Chrome's 申込する. A closed gate sends nothing: it is asked before a scan spawns booking threads,
  before each hotel's steps 3-6 and at step 7, each time with the live settings (a date removed or a hotel skipped
  mid-chain stops it, and the commit gate re-checks the same). An id conflict (409 `id_conflict`, or a record holding
  other content under our id) is never an ack: the entry stays queued and is retried alone, `HUMAN NEEDED`, one
  `human_needed` event.
- **Identity and dates.** The run id is `GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT` (a re-run is a new run; its link is the
  attempt's). Every date decision (days left, the 11-day floor, past dates) is Tokyo's (`book_hotels.tokyo_today`,
  zoneinfo with a fixed UTC+9 fallback), whatever the runner's clock; the workflow also sets `TZ`.
- **Bounded.** `--deadline`: no new hold after it, drain (bookings in flight, the confirm queue, Chrome) up to 15 min,
  `human_needed` for a hold < 30 min old that never confirmed, `run_end`, exit 0. The Worker's `stop` (paused, MODE
  off, no dates, the lease lost) drains the same way, except a `lease_lost` while nobody holds the lease (released or
  expired during an outage): the run claims it once, at once, and goes on if granted. A 503 ban drains for 2 min
  (`run_end detail=ban`: the next run has a new IP); a Worker silent for 15 min ends the run (`run_end
  detail=worker_lost`, exit 1). The workflow's preflight skips the job only for paused, MODE off or no dates; another
  run's lease goes on to the claim, which waits for it.
- **Reports** every 30 s (at once after a hold, confirmed, human_needed, ban): phase, scans, failures by step, the last
  error (step, status, class), solves (count, seconds, spot), `available`/`filtered` only when a date's offered set
  changes, the names seen. IMAP login is checked at start (and when auto-confirm turns on); a failure is an `error`
  event.

## Logs

The Actions log is public. `logs.setup()` points fd 1/2 at `$ITS_STATE_DIR/its_booking.log` (0600): the verbose log
(dates, hotels, steps, statuses, URLs), tracebacks, curl's and Chrome's output (`chrome.spawn`, the process manager's `process_creator`: Chrome inherits fd
1/2; pydoll's default pipes, never read, could fill and stall it). The only way to the real stdout is
`logs.public(event, **fields)`: field names from an allowlist, values ints, seconds or lower-case codes, so no date,
hotel, URL, token, number or name can pass (a reject is dropped and counted). Public lines: `start`, `claim`,
`settings` (counts), `phase`, `solve ok secs spot`, `hold n`, `confirmed n`, `human_needed detail`, `error step n
status cls` (a step at most once a minute), `summary` every 5 min (with `refused`: holds the gate refused), `drain`,
`run_end`. Uncaught exceptions: the
traceback private, `error step=uncaught exc=KeyError` public. Secrets are `::add-mask::`ed at start.

At the job's end the state dir is tar'd (its warnings silenced: they name files) and age-encrypted to `ITS_LOG_RECIPIENT` (the relay's `ARCHIVE_RECIPIENT`);
only the `.age` is uploaded (3 days); no recipient or a failed encryption uploads nothing. On the Mac:
`scripts/fetch-logs.sh <run-id>` downloads and decrypts it into /tmp/its-logs-<run-id>.

## State

`config.STATE_DIR` (`ITS_STATE_DIR`, default `state/` here, gitignored; on Actions `$RUNNER_TEMP/its-state`, never
cached): `calendar_url_cache.txt` (the `s=` token, a live credential), `chrome_user_agent.txt`, `its_booking.log`,
`debug_responses/`, `holds.json` (`{date: [hotel]}`: holds, not reservations, but the only thing preventing duplicate
applications within a run) and `reservations.json` (`{date: ["hotel\t申込受付番号"]}`: real cancellation liabilities).
The Worker's record outlives a run; the state dir does not.

## Tests

Both suites are stdlib-only, never touch ITS, the Worker, IMAP or Chrome, and run in CI (its.yml) without pydoll.
`FakeITS` replays the real markup **including the escaped quotes AJAX responses arrive in**, injects the production
failures, serves an `empty` and an `a_little` date, and `/apply/confirm` is a **tripwire** (anything reaching it means
curl regressed into committing). Tests are discovered, arguments injected by name (`port`, `tmpdir`); `Env` restores
every module setting by reflection; every date the flow sees is derived from today. The emailed leg stays stubbed and
Chrome is never launched: drive the worker with `drain_once()`.

`test_remote.py` adds a fake Worker (the lease, the record, acks, stop) and an injected clock: contract parity with
its/contract-example.json, its/norm-cases.json and contract.ts's LIMITS, the claim's wait, lease fencing (from the
lease itself), re-run ids, Tokyo dates, a closed gate sending nothing, settings changed mid-chain, answers out of order,
id conflicts and a full record, the re-claim, the preflight, a Worker outage, hot reload, the confirming ack, the bounded run, stop, the ban, the IMAP check, the Worker's size limits, and **redaction**: the real
`main.py --remote` in a subprocess through holds, a stubbed confirmation, two no-mail legs, a thread exception and a
ban, its fd 1/2 grepped for every form of the dates, the hotel names, `s=`, csrf, cookies, the applicant's fields, the
mailbox, the booking number and the token. The tests bind 127.0.0.1; they clear proxy settings for loopback.

## Configuration (`config.py`)

Every setting is documented at its definition. Secrets come from the environment only (`.env` beside config.py for a
local run, gitignored; the `its` environment's secrets on Actions): `ITS_IMAP_USER`, `ITS_IMAP_APP_PASSWORD`,
`ITS_EMAIL` (default: the IMAP user; there is no other default), the applicant's `ITS_*`, and `ITS_RUNNER_TOKEN`.
`Origin`, `Sec-Fetch-*`, `sec-ch-ua` and `Accept-Encoding` are **deliberately not sent**; a mobile UA or a
non-Japanese `Accept-Language` risks a different template that breaks the extractors and the skip matching.
