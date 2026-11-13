# The ITS booker

A bot that watches the 関東ITS健保 保養所 booking site (as.its-kenpo.or.jp) for a vacancy on the nights we want, takes
the site's 30-minute hold the moment one opens, and (optionally) finishes the emailed 申込 leg. Two members configure
it from the app: 設定 → 保養所ボット (dates, facilities, interval, 開始 / 停止, and its health). Not part of the game:
it only shares the Cloudflare account with the relay and the gym bot.

Two halves:

- **`its-bot`** (`its/worker/`): `https://its-bot.island-fund-relay.workers.dev`, one Worker and one SQLite-backed
  Durable Object (`ItsBot`), Workers Free. It holds the settings and the record, tells the runner what to do, and
  computes the page's verdict. `MODE` (wrangler.toml) is `on` or `off` (the stop switch; it starts `off`).
- **The runner** (`its/runner/`): the Python booker (curl scans + headed Chrome for Turnstile), run on GitHub Actions
  (`.github/workflows/its-runner.yml`, every 30 min and on 開始), bounded to ~5.5 h a run.

The contract between the three (page, Worker, runner) is `app/src/lib/its/contract.ts`; both languages test against
`its/contract-example.json` and `its/norm-cases.json`. The site's own behaviour is `its/SITE.md`.

## Product rules

- **Never two runners.** One lease (`LEASE_SEC` 300 s), renewed by every report; a runner that hasn't renewed within
  240 s takes no hold and files no application. The workflow runs only with the repo variable
  `ITS_RUNNER_ENABLED = 1`, and `concurrency: its-runner` queues a second job.
- **A hold is forever.** A facility held for a date is never applied for again (the bookings record, append-only on the
  Worker; nothing is ever edited or deleted early). `confirming` is written before Chrome's 申込する: no ack, no commit.
- **Auto-confirm** only for stays `AUTO_CONFIRM_MIN_DAYS` (11) or more away (free cancellation ends at D−10); off by
  default. Off: the hold is taken and the site's mail is finished by hand.
- **Skipping wins over priority**; names compare after `normName` (NFKC, no spaces, lower case) on both sides.
- **15 s is the floor** between scans: the site's ~24 h IP bans come from the request rate.
- **Members only.** The page needs a member's key (KEY_A, KEY_B); the guest's never reaches this Worker. Dates and
  facility names are private: in the record and Workers Logs, never in the public Actions log.
- **開始 / 停止 apply at once**, outside the page's draft; a stop reaches a running runner at its next report (≤ 30 s)
  and it exits at the next safe point (never mid-booking).

## How it works

```
 app 保養所ボット ─ GET /its/status, PUT /its/settings, POST /its/run (member key) ─▶ its-bot ─▶ DO ItsBot
                                                                                       │  ▲
                                         開始: workflow_dispatch (GH_DISPATCH_TOKEN) ◀─┘  │
 Actions its-runner.yml ─ GET /runner/config (preflight), POST /runner/claim, /runner/report every 30 s,
                          POST /runner/bookings (ITS_RUNNER_TOKEN) ──────────────────────────┘
```

| File | Role |
|---|---|
| `worker/src/index.ts` | The routes (below): auth, CORS, body cap (64 KB) and checks, one RPC per request, the refusal logs |
| `worker/src/bot.ts` | `ItsBot`: the record in memory (one storage read at start), one batched put per change, the log lines |
| `worker/src/rules.ts` | The lease, the events' rings, bookings, seen names, RunnerConfig and the verdict |
| `worker/src/validate.ts`, `dispatch.ts`, `env.ts` | The runner's bodies, GitHub's dispatch, bindings and secrets |

| Route | Who | |
|---|---|---|
| `GET /health` | anyone | `{ok, mode, sha}` |
| `GET /its/status` | member | `ItsStatus`: verdict, reasons, settings, last report, lease, dispatch, bookings, events, seen |
| `PUT /its/settings` | member | `ItsSettingsInput` (the contract's `parseSettingsInput`); 409 + the status if `baseUpdatedAt` isn't the current `updatedAt` |
| `POST /its/run` | member | `{action: 'start' \| 'stop'}`; start clears `paused` and dispatches a run (below); answers the status |
| `GET /runner/config[?runId=]` | runner | `RunnerConfig`: the workflow's preflight (`stop` → the job ends in seconds) |
| `POST /runner/claim` | runner | `{runId, host}` → `ClaimReply` (the lease when free, expired or already this run's) |
| `POST /runner/report` | runner | `RunnerReport` → `RunnerConfig`; the holder's renews the lease, a `run_end` event releases it |
| `POST /runner/bookings[?runId=]` | runner | `BookingInput[]` (≤ 50) → `RunnerConfig`; a known id is a retry, ignored |

Members: `Authorization: Bearer <KEY_A|KEY_B>` (relay/src/auth.ts's check), CORS for `ALLOWED_ORIGINS` (the Pages
origin) and localhost, preflight answered, `Cache-Control: private, no-store`; another origin is 403, a wrong or the
guest's key 401. Runner: `Bearer <ITS_RUNNER_TOKEN>`, compared in constant time. Errors are `{ok: false, error}`.

- **Record** (DO storage, one key each): `settings`, `bookings` (append-only; pruned only `BOOKINGS_KEEP_DAYS` = 60
  days after the stay; at 500 entries new ones are refused with an error log), `runner` (the holder's last report +
  the Worker's `lastSeen`), `lease`, `dispatch`, `events` (two rings of `EVENTS_KEPT` = 40: routine, and hold /
  confirmed / human_needed / ban, so routine ones never evict those), `seen` (facility names, the newest 300), `acks`
  (the highest event seq per run: a retried report adds nothing twice). Times are the Worker's receive time.
- **開始's dispatch**: `POST api.github.com/repos/huangwaylon/fitness/actions/workflows/its-runner.yml/dispatches`
  `{ref: 'main'}`, recorded as `dispatch: {at, ok, status}` (204 = accepted, 0 = no answer; `status: null, ok: true` =
  no token set, nothing sent: the schedule starts a run). Nothing is sent while MODE is off, without a date, while a run
  is scanning, or within 2 min of a dispatch no report has followed.
- **Verdict**: computed on each status read from the Worker's clock (no cron, no alarm), every reason that applies in
  the contract's `REASONS` order, the verdict the first's (Diagnose below).
- **Logs** (Workers Logs, 3 days: dashboard → Workers → its-bot → Logs, or `npx wrangler tail`): one line per request
  class, `its status by=A verdict=…`, `its settings by=B dates=2 skip=12 pri=1 int=15 …`, `its run start by=A
  dispatch=204`, `its claim run=… ok=1`, `its report run=… phase=scanning scans=… fail=0 ev=1/2 lease=renewed stop=0`,
  `its event hold … date=… hotel=…`, `its booking confirmed id=…`; every refusal `its refused <status> <why> <route>`.
  Never a key or token; dates and names are fine (the logs are private). Invocation logs off.

## Runner

See `its/runner/README.md`.

## Secrets

`npx wrangler secret put <NAME>` from `its/worker/`; never in this public repo. The coordinator keeps a copy.

| Name | Value |
|---|---|
| `KEY_A`, `KEY_B` | The members' keys, **copied from the relay's** (`~/.config/island-fund/keys`). Rotating them: put the new ones on both the relay and here |
| `ITS_RUNNER_TOKEN` | `openssl rand -hex 32`; the same value in the repo's `its` environment (Actions) |
| `GH_DISPATCH_TOKEN` | Optional. A fine-grained PAT: repository `huangwaylon/fitness` only, permission Actions: read and write. Unset: 開始 sends nothing and the next scheduled run (≤ 30 min) starts |

## Develop and deploy

```sh
cd its/worker
npm ci
npm run check && npm run knip && npm test   # CI runs these (.github/workflows/its.yml)
npm run deploy                              # a clean its/worker/ at a commit on origin/main
curl -s https://its-bot.island-fund-relay.workers.dev/health   # {"ok":true,"mode":"off","sha":<the commit>}
```

Tests run on Node with `cloudflare:workers` mocked (test/setup.ts), a fake storage that counts its calls, the clock
pinned, fetch stubbed: no network. The Worker imports `app/src/lib/its/contract.ts` and `relay/src/auth.ts`, so a
checkout needs `its/`, `app/src/lib/its`, `app/src/lib/contract` and `relay/src/auth.ts`. A deploy keeps the record.

## Operations

`$URL` = `https://its-bot.island-fund-relay.workers.dev`; `$KEY_A` from `~/.config/island-fund/keys`; `$RT` = the
runner token.

- **Look**: the app's 設定 → 保養所ボット, or `curl -s -H "Authorization: Bearer $KEY_A" $URL/its/status | jq
  '{verdict, reasons, runner: .runner | {phase, lastSeen, scans, scanFailures, lastError}}'`. Details: `npx wrangler
  tail`; the run's public log on Actions (counts and codes only; the private log is its encrypted artifact).
- **Stop** (normal): 停止 on the page. The runner exits within ~30 s plus any booking in flight.
- **Stop everything**: `npm run deploy -- --var MODE:off` from a clean main, then commit `MODE = "off"` (every
  runner is told `mode_off`, 開始 dispatches nothing); and `gh variable delete ITS_RUNNER_ENABLED` (no job starts at
  all). A run that won't stop: `gh run cancel <id>`, then look for a hold it left (the site's mail). Back on: `MODE =
  "on"` deployed, `gh variable set ITS_RUNNER_ENABLED --body 1`, 開始.
- **Back up the record**: `curl -fsS -H "Authorization: Bearer $KEY_A" $URL/its/status > its-record.json` (settings,
  bookings, events, seen). Restore or seed (the cutover): the settings with `PUT /its/settings` (`baseUpdatedAt` = the
  current status's `settings.updatedAt`), then the bookings in chunks of ≤ 50 with `curl -fsS -X POST -H
  "Authorization: Bearer $RT" --data-binary @chunk.json $URL/runner/bookings` (ids kept, so a re-run adds nothing;
  `at` becomes the restore time).

## Diagnose

The verdict is the first reason that applies (`reasons`, in this order). `starting`, `never_ran`, `runner_silent`,
`dispatch_failed`, `scan_failing` and `solve_failing` count only while it should run (MODE on, not stopped, a date).

| Reason | Verdict | Means | Do |
|---|---|---|---|
| `mode_off` | off | Deployed with `MODE = "off"` | Back on (Operations) |
| `paused` | stopped | 停止 on the page | 開始 |
| `no_dates` | idle | No date today or later | Add a date |
| `dispatch_failed` | degraded | 開始's dispatch was refused (`dispatch.status`: 401/403 = the PAT expired or lacks Actions write, 404 = the workflow file, 422 = not on main, 0 = no answer); the schedule still starts a run | Renew `GH_DISPATCH_TOKEN`; meanwhile wait ≤ 30 min |
| `starting` | starting | Dispatched, no report yet (≤ 10 min) | Wait; Actions shows the queued job |
| `never_ran` | late | No runner has ever reported | `ITS_RUNNER_ENABLED`, the `its` environment's secrets, the workflow's runs on Actions |
| `runner_silent` | late | No report for 45 min | Actions: the last run's log (cancelled? failed preflight?), `wrangler tail` for `its refused 401` (token mismatch) |
| `banned` | failing | The last run hit the 503 セキュリティアラート (~24 h on that IP); clears at the next good scan | Nothing: the next run has a new IP. Recurring: a longer interval |
| `scan_failing` | failing | 3+ failed calendar reads in a row (`runner.lastError`: step, status, class) | Usually the site; `session_dead` for long = the Turnstile solve |
| `solve_failing` | degraded | The last 3 Turnstile solves failed | The run's public log (`solve` lines, spot, secs); SITE.md §6 |
| `unsynced` | degraded | The runner holds booking entries the Worker hasn't acknowledged (no new hold meanwhile) | `wrangler tail` for `its refused … /runner/bookings`; it retries each report |
| `human_needed` | degraded | A hold or a failed 申込 leg needs a person (within 24 h, no later 予約確定 for that stay): `events` say why (`near_date`, `auto_off`, `no_mail`, `leg_failed`, …) | Finish or cancel it from the site's mail before the 30-min hold lapses |

## Quotas

Workers Free, account-wide (relay, relay-test, gym-bot and this): 100,000 Worker requests a day; Durable Objects
100,000 requests, 100,000 rows written, 5,000,000 rows read and 13,000 GB-s a day; Workers Logs 200,000 lines a day.

Measured with Cloudflare's GraphQL analytics (2026-11-05 … 11-12, UTC days, every script on the account):

| A day | Worker requests | DO requests | Rows written | Rows read | DO GB-s |
|---|---|---|---|---|---|
| Busiest (11-10) | 3,618 | 15,487 | 28,900 | 767,635 | 819 |
| Typical (11-12) | 827 | 2,685 | 5,627 | 66,429 | 622 |

(The relay's 20 s heartbeat is answered by the runtime's WebSocket auto-response, which never wakes a room, so it
barely shows here; its DO requests are the rooms' messages. gym-bot is ~110 Worker and ~120 DO requests a day, ~1,800 s
of alarm wall time.)

This Worker, while a runner runs all day: a report every 30 s = 2,880 Worker + 2,880 DO requests, ~2 rows written each
(runner, lease; events/acks/seen only when they change) ≈ 6,000 rows; plus 48 preflights, a claim per run, and the
page's polls (15 s while the page is open and a runner is active: 240 an hour of viewing). About **3,200 requests and
6,500 rows written a day**, a few GB-s (each request is milliseconds; storage is read once per object start), ~3,500
log lines. Even on the busiest day so far that totals ~7k of 100k Worker requests, ~19k of 100k DO requests and ~35k
of 100k rows written. Stopped: the preflight only (48 a day).
