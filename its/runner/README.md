# The ITS runner

The Python booker behind ボット → 保養所 (the system: [../README.md](../README.md)): curl polls the calendar and drives
空き照会申込; a real Chrome solves Turnstile and curl replays its `s=` token.

**[../SITE.md](../SITE.md) is the record of what the site does** (rules, request chain, form traps, the 503 IP ban,
the Turnstile click); read it before changing a request or an extractor. Three laws:

- **`send_complete` is not a reservation.** `book_hotels.py` ends at the hold plus the mail and hands it to the
  **confirm worker**, which runs the emailed leg (申込する → 確認) serially. Only that yields a 申込受付番号.
- **curl reads the applicant form; only Chrome commits it** (SITE.md §5). `chrome.submit` is the only committer;
  without `pydoll-python` or on a Chrome failure the hold stays taken and the log says `HUMAN NEEDED`.
- **The 30-minute hold is not tracked, deliberately**: the site refuses a second application at a facility we hold
  (「空き部屋がございません」). Do not add hold accounting.

## Running

```bash
python3 main.py --remote --deadline <epoch>   # the Worker's settings, bounded, public-safe logs
python3 main.py                               # local: config.py's settings, forever, full log on stdout
python3 check_env.py                          # preflight: .env, IMAP, the confirmation gate
python3 remote.py preflight                   # the workflow's first step: GET /runner/config, run=0|1
python3 chrome.py                             # solve only; writes the s= cache
cd its/runner && python3 test_its.py && python3 test_remote.py   # tests (a substring selects, -v logs)
```

Run tests as scripts here, not `python3 -I`. `ITS_BASE_URL` (loopback only, else exit 2) points at a stand-in.
Stdlib + curl; `chrome.py` needs `pydoll-python` (requirements.txt, imported lazily); on Linux Google Chrome under
`xvfb-run` and `fonts-noto-cjk`. Python 3.10+.

## Modules

| File | Role |
|---|---|
| `config.py` | Tuning (checked at import), the HTTP fingerprint, a local run's settings |
| `main.py` | URL monitor, `Supervisor` (one scanner per month, a watchdog), `RemoteRun` (`--remote`) |
| `book_hotels.py` | The curl layer, scan and hold; `apply_settings`, `_hold_gate`, `notify`; `log()` formats every line |
| `confirm_booking.py` | The hold queue and the emailed leg; `_commit_gate`, `imap_check` |
| `chrome.py` | The one Chrome: Turnstile solve and the filing leg |
| `remote.py` | Worker client: claim, reports, bookings queue, the lease fence |
| `restart.py` | The Run step's wrapper: crash restarts, same deadline and run id (../README.md "Watchdog") |
| `logs.py` | The private log (fd 1/2) and the allowlisted public line |

A booking thread takes the hold and enqueues it; one confirm worker drains the queue (no shared `c=` link). The URL
monitor solves in its own thread; a proactive refresh waits for a booking in flight, a repair never does.

**Invariants** (`book_hotels.py`): `is_available()` matches `empty` and `a_little`; `_is_retryable()` excludes 302;
`curl()` never raises; no bookings write after a failed `_load_bookings()`; names compare after `_norm_hotel`; the
email POST is the only `retry=False` request; `RETRY_DELAY` ≥ `MIN_RETRY_DELAY` (15 s); debug dumps hold credentials
and stay in the state dir.

**Confirming**: holds pair oldest-to-oldest with unclaimed links; no mail within `CONFIRM_MAIL_TIMEOUT` drops the hold
with `HUMAN NEEDED`. `confirm_allowed()` (AUTO_CONFIRM and the 11-day floor) is checked at enqueue and again on the
申込内容確認画面; non-empty `unmapped` never submits. The Turnstile click: centred checkbox first, left edge second
(SITE.md §6).

## The remote runner (`--remote`)

The its-bot Worker (`remote.DEFAULT_URL`, `ITS_WORKER_URL` overrides; Bearer `ITS_RUNNER_TOKEN`) owns settings,
bookings and the lease; remote.py mirrors app/src/lib/its/contract.ts by hand. Each seam is a no-op locally.

- **Settings** arrive with every RunnerConfig (`book_hotels.apply_settings`; reported as `settingsAt`).
- **One booking a night**: a `confirmed` or open `confirming` night is not scanned, held or filed again.
- **The record**: hold, `confirming`, `confirmed`, `failed` entries are resent until acknowledged.
- **The fence**: no new hold or commit within 60 s of the lease's end, or while an entry is unsynced and the Worker
  unreachable > 2 min; `confirming` is acknowledged before 申込する.
- **Bounded**: `--deadline`, a drain ≤ 15 min, `run_end`; a stop, a ban or a silent Worker ends it. Run id
  `GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT`; dates are Tokyo's. **Reports** every 30 s and after each hold or outcome.
- **Outcome codes** (lastError's `cls`, `solve_failed` and `human_needed` details): lower-case codes from
  `confirm_booking.outcome_code` and chrome.py; the app's list is contract.ts's `HUMAN_NEEDED_DETAILS`.

## Logs

The Actions log is public: fd 1/2 go to `$ITS_STATE_DIR/its_booking.log` (0600, everything), and only
`logs.public(event, **fields)` (allowlisted names, ints or codes) reaches stdout. At the job's end the state dir is
age-encrypted to `ITS_LOG_RECIPIENT` and uploaded (14 days): `scripts/fetch-logs.sh <run>[-<attempt>]` decrypts it
(or `npm run its:logs`, ../README.md "Operations"); `rm -rf` the copy after.

## The workflow (its-runner.yml)

Starts: the previous run's `handoff` job, 開始, the watchdog, and the `7,37 * * * *` schedule (../README.md
"Watchdog"). The `gate` job ends a scheduled tick while another run younger than `ITS_SKIP_YOUNGER_MIN` (290) is in
progress. The `run` job (concurrency `its-runner`): preflight, install, `main.py --remote --deadline START +
ITS_RUN_MIN` (320 min) under `restart.py`, drain ≤ 15 min, inside the step's 345 and the job's 350 (test_remote
checks the nesting). The alert (its-health.yml): ../README.md "Investigating".

## State

`config.STATE_DIR` (`ITS_STATE_DIR`; default `state/`, gitignored; Actions `$RUNNER_TEMP/its-state`, never cached):
`calendar_url_cache.txt` (the `s=` token, a live credential), `chrome_user_agent.txt`, `its_booking.log`,
`debug_responses/`, `holds.json` (`{date: [hotel]}`) and `reservations.json` (`{date: ["hotel\t申込受付番号"]}`: real
liabilities). The Worker's record outlives a run; the state dir does not.

## Tests

Stdlib-only, offline, no pydoll (CI: its.yml). `FakeITS` replays the real markup; `/apply/confirm` is a tripwire (curl
must never reach it); drive the stubbed emailed leg with `drain_once()`. `test_remote.py` adds a fake Worker: contract
parity, the fence, workflow timings, and **redaction** (the real `main.py --remote`'s stdout grepped for private data).

## Configuration

Documented in `config.py`. Secrets from the environment only (`.env` locally, the `its` environment on Actions; names
in ../README.md "Secrets"). `Origin`, `Sec-Fetch-*`, `sec-ch-ua`, `Accept-Encoding` are deliberately not sent; a
mobile UA or non-Japanese `Accept-Language` risks a template that breaks the extractors.
