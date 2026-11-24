# The ITS booker

Watches the 関東ITS健保 保養所 booking site (as.its-kenpo.or.jp) for a vacancy on the wanted nights, takes the site's
30-minute hold the moment one opens, and optionally files the emailed 申込 leg. Members configure it in ボット → 保養所.

- **`its-bot`** (`its/worker/`, `https://its-bot.island-fund-relay.workers.dev`): a Worker and a SQLite-backed Durable
  Object (`ItsBot`), Workers Free: settings, the record, the runner's orders, the verdict. `MODE` (wrangler.toml):
  `on` or `off` (the stop switch).
- **The runner** (`its/runner/`, [runner/README.md](runner/README.md)): Python on GitHub Actions
  (`.github/workflows/its-runner.yml`), ~5.5 h a run, checked out from main (a change is live at the next run).

Contract: `app/src/lib/its/contract.ts`; both languages test against `its/contract-example.json` and
`its/norm-cases.json`; each side treats a missing field as before. The site itself: [SITE.md](SITE.md).

## Product rules

- **Never two runners.** One lease (`LEASE_SEC` 300 s), renewed by every report; a runner not renewed within 240 s
  takes no hold and files nothing. The workflow needs the repo variable `ITS_RUNNER_ENABLED = 1`;
  `concurrency: its-runner` allows one running and one pending job.
- **A hold is forever.** Bookings are append-only; a facility held for a date is never applied for again.
  `confirming` is acknowledged before Chrome's 申込する.
- **Auto-confirm** (通知 → 自動で確定, off by default) only `AUTO_CONFIRM_MIN_DAYS` (11) or more ahead (free
  cancellation ends at D−10); otherwise the hold is finished by hand from the site's mail.
- **Only switched-on facilities**: `settings.search` is the allow-list (探す); **skipping wins** over it and priority;
  names compare after `normName`. Not-yet-offered facilities: `app/src/lib/its/roster.ts`.
- **A night with 予約確定 is done** (予約済み); otherwise every eligible facility with a room is held.
- **15 s floor** between scans (SITE.md §2: the IP ban).
- **Members change, the guest looks**: KEY_C reads `/its/status` and its own `/its/push/*`; 401 on `/its/settings`
  and `/its/run`. Dates and facility names never reach the public Actions log.
- **開始 / 停止 apply at once**; the runner sees a stop at its next report (≤ 30 s), exiting at a safe point.

## How it works

`its/worker/src/`: `index.ts` (routes, auth, CORS, 64 KB body cap, the cron's `scheduled`), `bot.ts` (`ItsBot`: record
in memory, one put per change), `rules.ts` (lease, events, bookings, verdict, the watchdog's decision), `validate.ts`,
`dispatch.ts` (GitHub dispatch, run lists, cancel), `env.ts`, `ghApp.ts` (the relay keeps a copy), `push.ts`,
`webpush.ts` (RFC 8291/8292).

| Route | Who | |
|---|---|---|
| `GET /health` | anyone | `{ok, mode, sha}` |
| `GET /health/its` | `ITS_HEALTH_TOKEN` | `ItsHealth`: codes, counts, `dispatches` (a public workflow reads it) |
| `GET /its/status` | key A/B/C | `ItsStatus` (`?day=1` adds `X-Bot-Day`) |
| `PUT /its/settings` | key A/B | `ItsSettingsInput`; 409 + current status if `baseUpdatedAt` is stale |
| `POST /its/run` | key A/B | `{action: 'start' \| 'stop'}`; start clears `paused` and dispatches |
| `POST /its/push/subscribe`, `/unsubscribe`, `/test` | key A/B/C | Push below |
| `GET /runner/config[?runId=]` | `ITS_RUNNER_TOKEN` | `RunnerConfig`; without `runId` the preflight |
| `POST /runner/claim` | runner | `ClaimReply`; taking an unreleased lease logs `prev_unclean` |
| `POST /runner/report` | runner | renews the lease; `run_end` releases it |
| `POST /runner/bookings[?runId=]` | runner | ≤ 50 entries; same id + content = retry, else 409 `id_conflict`; full 507 |

Page auth: relay/src/auth.ts's check, CORS for `ALLOWED_ORIGINS` and localhost, `private, no-store`, `X-Request-Id`
echoed and logged as `rid=`. Tokens compared in constant time. Run ids `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`.

- **Record** (one DO key each): `settings`, `bookings` (pruned `BOOKINGS_KEEP_DAYS` = 60 after the stay; 500 max),
  `runner`, `lease`, `dispatch`, `control`, `events` (two rings of `EVENTS_KEPT` = 40: routine, and important),
  `seen` (300 names), `acks`, `scanned`, `restarts`, `preflight`, `minutes`, `subs`, `pushq`, `pushlog`, `watch`.
- **開始's dispatch**: `workflow_dispatch` of its-runner.yml on main, recorded before asking (204 ok, 0 no answer).
  None while MODE is off, with no date, while a lease's run works, or within 2 min of an unanswered one.
- **The cron's dispatches** (`dispatch.ts` `dueHealth`): health.yml, its-health.yml, places-pull.yml at :15/:45;
  its-health.yml at :00/:30 too while active; places-details.yml 18:30 UTC; kalori-scrape.yml Tue from 18:41 UTC;
  e2e-flake-hunt.yml from 19:30 UTC once a day. Results: `/health/its`'s `dispatches` (`st`, `by: app|pat`).
- **Logs** (Workers Logs 3 days, `npx wrangler tail`): `its <op> key=value`, `its refused status= why= path=`. No
  keys or tokens.

## Watchdog

GitHub drops most scheduled ticks, so three layers keep a runner alive:

- **In-job restart** (`its/runner/restart.py`): a non-zero exit (not 2) after a report or 5 min restarts main.py, same
  run id and deadline, ≤ 5 times (15, 30, 60, 120, 300 s). `RESTART_DAY_CAP` (20) a Tokyo day, then `restart_cap`:
  nothing restarts or hands off until Tokyo midnight, the watchdog only pushes; 開始 allows one more run. SIGTERM /
  SIGINT (a cancel) stop main.py at once, `run_end` within 6 s; a dead process's open `confirming` blocks its night.
- **Handoff**: as the run job ends, its `Hand off?` step asks the preflight; if the bot should still run and the run
  lasted `ITS_HANDOFF_AFTER_MIN` (60), the `handoff` job (`actions: write`, no secret) runs `gh workflow run
  its-runner.yml --ref main` with GITHUB_TOKEN, unless another run is queued or in progress. A cancel hands off nothing.
- **Alarm + cron**: each report re-arms the DO alarm 90 s out (it also drains the push outbox); the `*/5 * * * *` cron
  is the backstop. Nothing heard and no run on its way: an incident, a dispatch (not while GitHub lists one
  unfinished); backoff 10/20/40/60 min, `WATCH_DAY_CAP` (12) a day. A hung run (lease expired, 18 min silent) is
  cancelled, then replaced.
- **The push**: one `runner_silent` per phone at 15 min, 2 failed recoveries, the cap, or a 3rd incident in 2 h.
- Logs: `npx wrangler tail --search "its watchdog"`. Daily counts go to the relay's 03:00 `cron.backup`.

## Push

Opt-in Web Push per phone (docs/decisions.md "No notifications": the exception); the site's mail stays the backstop.
`its/worker/src/push.ts` maps report events to notices (one Topic per stay, so a later one replaces the earlier):
`hold` (auto-confirm will finish it), `human_needed` 要対応 (by about the hold's end, skipped ≤ 120 s left) or 要確認
(may be filed: `MAYBE_FILED_DETAILS`), not sent for `NOT_BOOKED_DETAILS`, `confirmed` (予約確定), `runner_silent`.

**Routes**: `subscribe {endpoint, keys, lang}` (web.push.apple.com or fcm.googleapis.com only; 4 per member; dropped
after 30 days unrefreshed), `unsubscribe`, `test` (1 per `PUSH_TEST_EVERY_SEC`). 503 `push_off` without VAPID.
**Sending**: the alarm drains `pushq`; 404/410 deletes, 401/403 `config` (logged with Apple's reason), 429/5xx retry
to the TTL. Diagnose: `npx wrangler tail --search "its push"`; `BadJwtToken` = the key halves don't match.

**Keys**: VAPID. In `its/worker/`: `npm run vapid:keys -- ~/.config/its-bot/vapid-private` prints `VAPID_PUBLIC=…`
(commit it in wrangler.toml) and writes the private half; `npx wrangler secret put VAPID_PRIVATE <` that file;
deploy. The relay uses the same pair (docs/todo.md "Reminders"): rotate both Workers back to back (relay with and
without `--env test`). Hand check after push changes: テスト通知 on macOS Safari and each iPhone's Home Screen app.

## Secrets

Worker: `npx wrangler secret put <NAME>` in `its/worker/`. Actions: `gh secret set <NAME> --env its`.

| Name | Where | Value |
|---|---|---|
| `KEY_A`, `KEY_B`, `KEY_C` | Worker | The relay's person keys; KEY_C optional |
| `ITS_RUNNER_TOKEN` | Worker + `its` env | `openssl rand -hex 32`, same on both |
| `GH_APP_ID`, `GH_APP_INSTALLATION_ID`, `GH_APP_KEY_ITS` | Worker | GitHub App below |
| `ITS_HEALTH_TOKEN` | Worker + repo secret | `openssl rand -hex 32` (repo-level, not `its` env) |
| `VAPID_PRIVATE` | Worker | Push "Keys" |
| `ITS_IMAP_USER`, `ITS_IMAP_APP_PASSWORD` | `its` env | Gmail account and app password |
| `ITS_KIGOU`, `ITS_BANGOU`, `ITS_KANA_SEI`/`MEI`, … (config.py `REQUIRED`) | `its` env | Applicant fields (its-runner.yml); an empty one stops a run before any hold |
| `ITS_LOG_RECIPIENT` | `its` env variable | age public key for the private log |
| `ITS_RUNNER_ENABLED` | repo variable | `1` enables the workflow |

Rotate `ITS_RUNNER_TOKEN` as **停止 → both → 開始** (between them the runner gets 401s); KEY_* and
`ITS_HEALTH_TOKEN` back to back; applicant and IMAP secrets apply at the next run.

### GitHub App

its-bot's own GitHub identity, shared with the relay's backup; each Worker has its own key and narrows tokens
(`GH_NARROW`: `actions: write` on `fitness`). A failed mint logs `gh-app mint failed` and sends nothing (the schedule starts runs). Setup: create
the App (Actions and Contents read/write, webhook off), install on `fitness` and `fitness-archive`, convert the key with
`openssl pkcs8 -topk8 -nocrypt`, `secret put` the three. Check: `/health/its` `dispatches.*.by` is `app`.

## Develop and deploy

```sh
cd its/worker && npm ci
npm run check && npm run knip && npm test   # CI: .github/workflows/its.yml
npm run deploy                              # clean tree at a commit on origin/main
curl -s https://its-bot.island-fund-relay.workers.dev/health
```

Tests mock `cloudflare:workers` (`test/setup.ts`), no network. Local end to end: `npx wrangler dev --local --port
8799 --var MODE:on` with a `.dev.vars`, then the runner with `ITS_WORKER_URL` and `ITS_BASE_URL` (FakeITS). Roll
back: `npx wrangler deployments list`, `npx wrangler rollback <version-id>`.

## Operations

- **Look**: ボット → 保養所, or `GET /its/status` with `$KEY_A`.
- **Investigate a run**: `cd its/worker && npm run its:logs -- <run>[-<attempt>]`: the Worker's events and bookings
  plus the decrypted private log, one Tokyo-time timeline; then `rm -rf /tmp/its-logs-<run>` (it holds credentials).
- **Stop**: 停止; the runner exits within ~30 s plus any booking in flight.
- **Stop everything**: `npm run deploy -- --var MODE:off`, commit `MODE = "off"`, `gh variable delete
  ITS_RUNNER_ENABLED`. A run that won't stop: `gh run cancel <id>`, then check the mail for a hold it left. Back:
  `MODE = "on"` deployed, `gh variable set ITS_RUNNER_ENABLED --body 1`, 開始.
- **Back up / restore**: `curl -fsS -H "Authorization: Bearer $KEY_A" $URL/its/status > its-record.json`. Restore:
  `PUT /its/settings` (`baseUpdatedAt` = the live `settings.updatedAt`), then the bookings in chunks of ≤ 50 with
  `curl -fsS -X POST -H "Authorization: Bearer $RT" --data-binary @chunk.json $URL/runner/bookings` (ids kept: a
  re-run adds nothing), then 開始 or 停止 per `settings.paused`. The relay's 03:00 backup keeps it nightly
  (`its-YYYY-MM-DD.json.age`, docs/ops/runbook.md §6). A hold in Gmail the record lacks: seed it the same way.

## Investigating

**Gmail is the ground truth**: the site mails every hold (申込手続きのご案内) and every 予約確定. A page's request:
`npx wrangler tail --search rid=<id>` (the phone's `its.fail` carries the `rid`). **The alert**: its-health.yml
(dispatched by the cron above; its own `23,53 * * * *` schedule the backstop; inert without the `ITS_HEALTH_TOKEN`
repo secret) keeps one `its-alert` issue open on `late` / `failing`, `human_needed`, `dispatch_failed`,
`mail_failing`, `settings_stale` or `unsynced` for 30+ min, or `health_unreachable` (two failed reads), and closes
it when healthy. The watchdog's `runner_silent` push is the faster alert. The verdict is the first of the contract's `REASONS`. **Outcome codes**: runner/README.md
"Outcome codes".

| Reason | Do |
|---|---|
| `restart_cap` | its:logs on the crashing run; 開始 for one more |
| `dispatch_failed` | The App's install and permissions (GitHub App above) |
| `never_ran`, `runner_silent` | `ITS_RUNNER_ENABLED`, the `its` secrets, `wrangler tail --search "its watchdog"`; `gh workflow run its-runner.yml --ref main` |
| `banned` | Nothing (~24 h on that IP); recurring: a longer interval |
| `scan_failing`, `solve_failing` | its:logs and saved HTML (SITE.md, SITE.md §6) |
| `unsynced` | `its refused … path=/runner/bookings` (409, 507) |
| `human_needed` | Finish or cancel from the mail before the hold lapses |
| `mail_failing` | `ITS_IMAP_APP_PASSWORD`, Gmail's security alerts |
| `settings_stale` | 停止 → 開始 (a fresh run) |
| `prev_unclean` event | A claim took over an unreleased lease: its:logs on that run; Gmail for a hold it left |

## Quotas

Workers Free, account-wide: [observability "Account-wide"](../docs/ops/observability.md#account-wide). A runner all
day: ~3,200 Worker requests, ~6,000 DO requests, ~6,500 rows written, ~2,900 alarm writes; the cron 288 a day.
