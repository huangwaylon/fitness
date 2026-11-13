# The ITS booker

A bot that watches the 関東ITS健保 保養所 booking site (as.its-kenpo.or.jp) for a vacancy on the nights we want, takes
the site's 30-minute hold the moment one opens, and (optionally) finishes the emailed 申込 leg. Two members configure
it from the app: ボット → 保養所 (dates, facilities, interval, 開始 / 停止, and its health). Not part of the game:
it only shares the Cloudflare account with the relay and the gym bot.

Two halves:

- **`its-bot`** (`its/worker/`): `https://its-bot.island-fund-relay.workers.dev`, one Worker and one SQLite-backed
  Durable Object (`ItsBot`), Workers Free. It holds the settings and the record, tells the runner what to do, and
  computes the page's verdict. `MODE` (wrangler.toml) is `on` or `off` (the stop switch).
- **The runner** (`its/runner/`, [its README](runner/README.md)): the Python booker (curl scans + headed Chrome for
  Turnstile), run on GitHub Actions (`.github/workflows/its-runner.yml`, every 30 min and on 開始), bounded to ~5.5 h
  a run. Every run checks out main: a runner change is live at the next run, so the three pieces stay compatible in
  any landing order (an older page, runner or Worker leaves out the newer fields; each side treats a missing field as
  before).

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
- **New facilities are not searched until a member switches them on**: `settings.search` is the allow-list (the
  page's 探す); a facility is eligible when it's in `search` and not in `skip`. A stored record without `search`: every
  facility not skipped. A PUT without `search` keeps the saved list. A facility the page lists before the site offers
  it: `app/src/lib/its/roster.ts` (its region, roster kind and cutoff); a name the site offers joins `seen` by itself.
  **Skipping wins** over priority and `search`; names compare after `normName` (NFKC, no spaces, lower case).
- **A night with 予約確定 is done**: once the record has a `confirmed` entry for a date, the runner looks for that
  night no more (the date stays in `dates` till a member removes it; the page says 予約済み). Every other eligible
  facility with a room is still held (one 1-night stay per date).
- **15 s is the floor** between scans: the site's ~24 h IP bans come from the request rate.
- **Members only.** The page needs a member's key (KEY_A, KEY_B); the guest's never reaches this Worker. Dates and
  facility names are private: in the record and Workers Logs, never in the public Actions log.
- **開始 / 停止 apply at once**, outside the page's draft; a stop reaches a running runner at its next report (≤ 30 s)
  and it exits at the next safe point (never mid-booking).

## How it works

```
 app 保養所 ─ GET /its/status, PUT /its/settings, POST /its/run (member key) ─▶ its-bot ─▶ DO ItsBot
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
| `worker/src/push.ts`, `webpush.ts` | Web Push (Push below): what's sent when, the messages, the outcomes; RFC 8291/8292 with WebCrypto |

| Route | Who | |
|---|---|---|
| `GET /health` | anyone | `{ok, mode, sha}` |
| `GET /health/its` | alerting | `Bearer <ITS_HEALTH_TOKEN>` → `ItsHealth` `{verdict, reasons, lastSeenAgeSec, phase, unsynced, unsyncedAgeSec, lastPreflightAgeSec}`: codes and counts, never a date, facility or name (its-health.yml, a public repo's workflow, reads it) |
| `GET /its/status` | member | `ItsStatus`: verdict, reasons, settings, last report, lease, dispatch, control, bookings, events, seen, lastPreflight, recentMinutes (the last hour's reads per minute, ≤ 60: the strip's), push |
| `PUT /its/settings` | member | `ItsSettingsInput` (the contract's `parseSettingsInput`); 409 with the bare current `ItsStatus` as the body if `baseUpdatedAt` isn't the current `updatedAt` |
| `POST /its/run` | member | `{action: 'start' \| 'stop'}`; start clears `paused` and dispatches a run (below); answers the status |
| `POST /its/push/subscribe`, `/unsubscribe`, `/test` | member | Web Push (Push below) → `{ok, push}` |
| `GET /runner/config[?runId=]` | runner | `RunnerConfig`: without `runId`, the workflow's preflight (`stop` → the job ends in seconds; its time is the status's `lastPreflight`) |
| `POST /runner/claim` | runner | `{runId, host}` → `ClaimReply` (the lease when free, expired or already this run's; taking over another run's unreleased lease records `prev_unclean`) |
| `POST /runner/report` | runner | `RunnerReport` → `RunnerConfig`; the holder's renews the lease, a `run_end` event releases it |
| `POST /runner/bookings[?runId=]` | runner | `BookingInput[]` (≤ 50) → `RunnerConfig`; a known id with the same content is a retry, ignored; with other content 409 `id_conflict` (nothing kept); the record full 507 `record_full` |

Members: `Authorization: Bearer <KEY_A|KEY_B>` (relay/src/auth.ts's check), CORS for `ALLOWED_ORIGINS` (the Pages
origin) and localhost, preflight answered, `Cache-Control: private, no-store`; another origin is 403, a wrong or the
guest's key 401. A page's `X-Request-Id` (an id: `ID_RE`; else the Worker makes one up, `w-` + 8 hex) is echoed and
exposed, and every log line of that request says `rid=…`. Runner: `Bearer <ITS_RUNNER_TOKEN>`, alerting `Bearer
<ITS_HEALTH_TOKEN>`, both compared in constant time. Errors are `{ok: false, error}`. Run ids are
`${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` (a re-run is a new run) or a local id; `?runId=` names the asking run.
The bounds (body, entries, names, ids) are the contract's `LIMITS`, `MAX_SITE_NAME`, `ID_RE`.

- **Record** (DO storage, one key each): `settings`, `bookings` (append-only; pruned only `BOOKINGS_KEEP_DAYS` = 60
  days after the stay; at 500 entries new ones are refused, 507), `runner` (the holder's last report + the Worker's
  `lastSeen`, when it saw `lastOkAt` / `solves.lastOkAt` move, and since when the run has reported unsynced entries),
  `lease`, `dispatch`, `control` (the last 開始 / 停止: who, when), `events` (two rings of `EVENTS_KEPT` = 40: routine,
  and hold / confirmed / human_needed / ban / prev_unclean, so routine ones never evict those; `prev_unclean` is the
  Worker's own, seq 0, its `detail` the run whose lease was taken over), `seen` (facility names, the newest 300; a
  known name's time is rewritten at most daily), `acks` (the highest event seq per run, the newest 20 runs: a retried
  report adds nothing twice), `preflight` (the last one's time), `minutes` (the reports' calendar reads per minute of
  their own time, the last 60), `subs`, `pushq`, `pushlog` (Push below). Times are the Worker's receive time; the
  verdict compares only those. A change is one put, then memory (a failed put acknowledges nothing).
- **Lease**: a report from the holder renews it, also after it expired if nobody claimed it (`its lease
  renewed_late`); a released lease (`run_end`) is granted only by a claim.
- **開始's dispatch**: `POST api.github.com/repos/huangwaylon/fitness/actions/workflows/its-runner.yml/dispatches`
  `{ref: 'main'}`, recorded as `dispatch: {at, ok, status}` (204 = accepted, 0 = no answer; `status: null, ok: true` =
  no token set, nothing sent: the schedule starts a run). Nothing is sent while MODE is off, without a date, while a run
  is scanning, or within 2 min of a dispatch no report has followed (`dispatch=skip_recent`); the dispatch is recorded
  before GitHub is asked, so a double tap sends one.
- **Verdict**: computed on each status read from the Worker's clock (no cron, no alarm), every reason that applies in
  the contract's `REASONS` order, the verdict the first's (Investigating below).
- **Logs** (Workers Logs, 3 days: dashboard → Workers → its-bot → Logs, or `npx wrangler tail`): one line per request,
  `its <op> key=value …` (`its status …`, the page's poll, at debug; `its settings by=B dates=2 … search=40 rid=…`,
  `its claim run=… ok=1`, `its report run=… phase=scanning …`, `its event hold … date=… hotel=…`); every refusal
  `its refused status= why= method= path=` (`rid=` a page's, `run=` a runner's); `its bookings refused record_full`
  at error. Never a key or token; dates and names are fine (the logs are private). Invocation logs off.

## Push

Web Push to the members' phones, opt-in per phone from ボット → 保養所 (docs/decisions.md "No notifications": its
one exception). The site's mail stays the backstop: Focus, Sleep or a dead battery can hold a push back.

**What's sent when** (`worker/src/push.ts`, from the events a report adds; never raw bookings, never problems: those
are its-health's issue). One stay's notifications share a Topic and tag (base64url(SHA-256(`date|hotel`))[:32]), so a
later one replaces the earlier; each is sent once per hold / stay whichever run reports it.

| Event | When | Title · body (ja; en from the subscription's `lang`) | Urgency, TTL |
|---|---|---|---|
| `hold` | auto-confirm on and the stay ≥ 11 days away (the bot finishes it) | 仮押さえしました · NAGU 勝浦・11/22(日)・自動で確定します | normal, till the hold lapses |
| `human_needed` | a hold that waits for a person (any detail but those below: `near_date`, `auto_off`, `no_mail`, `unmapped`, `fill_rejected`, `lease_stale`, `leg_error`, …) while it lasts: the stay's earliest hold within 30 min | 仮押さえ・要対応 · NAGU 勝浦・11/22(日)・16:05ごろまでにメールから申込 | high, what's left; ≤ 120 s left: not sent (`push skip expired`) |
| `human_needed` that may be filed (`maybe_filed`) | the stay has an open `confirming` (no later `confirmed` / `failed` in the bookings: a leg may be filing it), whatever the detail; or the detail is `submit_unknown`, `no_completion`, `link_used` or `chrome_*`; with or without a live hold | 仮押さえ・要確認 · NAGU 勝浦・11/22(日)・申込済みの可能性：メールとサイトで確認 | high, 1 day |
| `human_needed` `room_taken`, `hold_expired`, `not_wanted` | a definite non-booking, or a hold nobody wants (no open `confirming`) | not sent (`push skip not_booked`) | |
| `confirmed` | 予約確定 | 予約が確定しました · NAGU 勝浦・11/22(日)・申込受付番号 A1234567 | normal, 1 day |

A hold the bot won't finish pushes only its `human_needed` (one notification per hold). A notice never says
「メールから申込」 when the application may already be filed: that one is `maybe_filed`. The 要対応 deadline is an estimate
(「ごろ」, "by about"): the Worker's receive time of the stay's first hold + HOLD_SEC, not the site's own clock. The
detail lists are the contract's (`NOT_BOOKED_DETAILS`, `MAYBE_FILED_DETAILS`, `MAYBE_FILED_PREFIXES`,
`HUMAN_NEEDED_DETAILS`). Times are Tokyo's; titles and bodies are written here, so an older service worker shows a
newer kind. The decrypted message is the contract's `ItsPushPayload` (≤ 3000 bytes).

**Routes** (member key, CORS, `POST`; answer `{ok: true, push}`, the status's `push`):
`/its/push/subscribe {endpoint, keys: {p256dh, auth}, lang}` (the endpoint `https://web.push.apple.com/…` or
`fcm.googleapis.com` (desktop dev) exactly: default port, no userinfo or IP, ≤ 512; p256dh must be a P-256 point;
unique: re-subscribing refreshes it, another member's moves; 4 per member, a fifth replaces the least recently
refreshed; not refreshed in 30 days: dropped; the page refreshes weekly), `/its/push/unsubscribe {endpoint}` (the
caller's own only; ok either way), `/its/push/test {endpoint}` (the caller's own only, else 404 `not_subscribed`; sent
at once, the outcome in `push.lastOutcome`; 1 per 5 s per endpoint (`PUSH_TEST_EVERY_SEC`), no daily cap, else 429
`rate_limited`; the page's button counts the 5 s down).
Refusals: 400 `bad_push_endpoint` / `bad_push_keys` / `bad_push_lang`, 503 `push_off` (no VAPID key).
`ItsStatus.push`: `{A, B, vapidPublic, lastSentAt, lastOutcome: {at, kind, code, status, reason?}}`: counts and codes,
never an endpoint (a capability URL) or its hash; `vapidPublic` is the key the page subscribes with.

**Sending**: a report's notices go into the outbox (`pushq`, one entry per notice × live subscription) in the report's
one put, then `setAlarm(now)`; the alarm sends what's due concurrently (10 s timeout each) and sets itself again for
the next retry. The runner's report never waits for or fails on a push.

| Answer | Outcome | Then |
|---|---|---|
| 201, 202 | `ok` | `lastOk`, `lastSentAt` |
| 404, 410 | `gone` | the subscription deleted (the phone re-subscribes at its next refresh) |
| 401, 403 | `config` | kept, not retried; Apple's `reason` logged (error) and in `lastOutcome` |
| 400, 413 | `bug` | dropped, logged (error) |
| 429, 5xx, no answer | `retry` | 30 s, doubling to 15 min (a longer Retry-After honoured), until its TTL; then `gave_up` (`expired`) |

**Keys**: VAPID (RFC 8292, ES256, `sub` `https://island-fund.pages.dev`, the JWT reused an hour per push service, 12 h
expiry). Turning push on, from `its/worker/`: `npm run vapid:keys -- ~/.config/its-bot/vapid-private` prints
`VAPID_PUBLIC=…` and writes the private part (mode 600, never printed; it never overwrites a file); put `VAPID_PUBLIC`
in wrangler.toml's `[vars]` and commit it (public; committing deploys nothing), then `npx wrangler secret put
VAPID_PRIVATE < ~/.config/its-bot/vapid-private` and `npm run deploy`; `/its/status`'s `push.vapidPublic` is the key.
**Rotating**: the same steps with a new file, the `secret put` and the deploy back to back (between them the live
Worker signs with the new private half under the old public key: Apple answers 403, those pushes dropped as
`config`). The phones see `push.vapidPublic` change and re-subscribe at their next refresh; until then their pushes are
refused the same way.

**Logs**: `its push queued kind=… id=<run>:<seq> urgency=… ttl=… subs=…`, one `its push kind=… id=… ep=<6 hex of the
endpoint's SHA-256> who=A status=201 ms=180 outcome=ok` per attempt (`reason=` on a refusal), `its push skip <why>`,
`gave_up`, `expired`, `dropped why=…`, `subscribe`, `unsubscribe`, `test refused …`. Never an endpoint, a key or a
message's text.

| `lastOutcome` / log | Means | Do |
|---|---|---|
| `config` 403 `BadJwtToken` | Apple refused the JWT: `VAPID_PRIVATE` doesn't match `VAPID_PUBLIC`, or the phones subscribed with another key | Check both halves came from one `vapid:keys` run; redeploy; the phones re-subscribe (or turn 通知 off and on) |
| `config` 403 `BadAuthorizationHeader`, 401 | A malformed header, a clock far off | `npx wrangler tail`; this is a bug if it persists |
| `config` 403 `BadWebPushTopic` / `bug` 400 | A header Apple rejects | A bug: the log line's `kind`, then the code |
| `gone` | The phone dropped the subscription (app removed, permission revoked, Safari reset) | Nothing: it re-subscribes when 通知 is on again |
| `retry` / `gave_up` | Apple slow or unreachable | Nothing; the site's mail is the backstop |
| `push skip no_vapid`, `push_off` (503) | No key set | Set the pair (above) |

**The hand check** after a deploy that touches push (Playwright's WebKit has no push service):
1. macOS Safari, the site, ボット → 保養所 → 通知 on → テスト通知: a notification within seconds; `npx wrangler tail
   --search "its push"` shows `status=201 outcome=ok` (`403 reason=BadJwtToken`: the pair's halves don't match).
2. Each iPhone, the Home Screen app (a Safari tab can't subscribe): 通知 on, テスト通知, the locked screen shows it; a
   tap opens 保養所.
3. The next real hold: the notification on both phones (`its push queued kind=… subs=…`).

## Secrets

Never in this public repo; the coordinator keeps a copy. The Worker's: `npx wrangler secret put <NAME>` from
`its/worker/`. Actions': `gh secret set <NAME> --env its` (the `its` environment, main only), except where noted.

| Name | Where | Value |
|---|---|---|
| `KEY_A`, `KEY_B` | Worker | The members' keys, **copied from the relay's** (`~/.config/island-fund/keys`) |
| `ITS_RUNNER_TOKEN` | Worker + `its` env | `openssl rand -hex 32`, the same value on both |
| `GH_DISPATCH_TOKEN` | Worker | Optional. A fine-grained PAT: repository `huangwaylon/fitness` only, permission Actions: read and write. Unset: 開始 sends nothing and the next scheduled run (≤ 30 min) starts |
| `ITS_HEALTH_TOKEN` | Worker + **repo** secret | `openssl rand -hex 32`, the same value on both: `gh secret set ITS_HEALTH_TOKEN` (a repository secret, not the `its` environment's: its-health.yml has no environment). Unset on the Worker: `/health/its` is 401 `no_health_token` |
| `ITS_IMAP_USER`, `ITS_IMAP_APP_PASSWORD` | `its` env | The Gmail account the site mails and its app password (the confirm leg reads the 申込 mail) |
| `ITS_EMAIL` | `its` env | The applicant's mail address on the form (default: the IMAP user) |
| `ITS_KIGOU`, `ITS_BANGOU`, `ITS_KANA_*`, `ITS_NAME_*`, `ITS_BIRTH`, `ITS_SEX`, `ITS_ZOKUGARA`, `ITS_TEL`, … | `its` env | The applicant, every field the form asks (the full list: its-runner.yml's run step) |
| `ITS_LOG_RECIPIENT` | `its` env **variable** | The age public key the private log is encrypted to (the relay's `ARCHIVE_RECIPIENT`; its secret half is `~/.config/island-fund/archive-age.key`, for fetch-logs.sh) |
| `ITS_RUNNER_ENABLED` | repo variable | `1`: the workflow may run (`gh variable delete ITS_RUNNER_ENABLED`: no job starts) |
| `VAPID_PRIVATE` | Worker | Web Push's private key (Push below; `npm run vapid:keys`). Its public half is the `VAPID_PUBLIC` var in wrangler.toml, not a secret. Either unset or a placeholder: push is off |

Rotating a token shared by two places (`ITS_RUNNER_TOKEN`, `KEY_A`/`KEY_B`, `ITS_HEALTH_TOKEN`): **停止 → change both →
開始** (a run between the two changes would be refused: 401s, `runner_silent`). The applicant's and the IMAP secrets
apply at the next run.

## Develop and deploy

```sh
cd its/worker
npm ci
npm run check && npm run knip && npm test   # CI runs these (.github/workflows/its.yml)
npm run deploy                              # a clean its/worker/ at a commit on origin/main
curl -s https://its-bot.island-fund-relay.workers.dev/health   # {"ok":true,"mode":"on","sha":<the commit>}
curl -s -H "Authorization: Bearer $ITS_HEALTH_TOKEN" https://its-bot.island-fund-relay.workers.dev/health/its
```

Tests run on Node with `cloudflare:workers` mocked (test/setup.ts), a fake storage that counts its calls, the clock
pinned, fetch stubbed: no network.

Locally, end to end (nothing deployed, no Cloudflare account touched; `.dev.vars` and `.wrangler/` are gitignored):

```sh
cd its/worker
printf 'ITS_RUNNER_TOKEN=dev\nKEY_A=%s\n' "$(openssl rand -hex 32)" > .dev.vars
WRANGLER_SEND_METRICS=false npx wrangler dev --local --port 8799 --var MODE:on   # the DO's storage in .wrangler/
# another shell: settings + 開始 with KEY_A (PUT /its/settings, POST /its/run), then the runner against it and FakeITS
cd its/runner && ITS_WORKER_URL=http://127.0.0.1:8799 ITS_RUNNER_TOKEN=dev \
  ITS_BASE_URL=http://127.0.0.1:<FakeITS port> python3 main.py --remote --deadline $(( $(date +%s) + 600 ))
```

The Worker imports `app/src/lib/its/contract.ts` and `relay/src/auth.ts`, so a checkout needs `its/`,
`app/src/lib/its`, `app/src/lib/contract` and `relay/src/auth.ts`. A deploy keeps the record.

## Operations

`$URL` = `https://its-bot.island-fund-relay.workers.dev`; `$KEY_A` from `~/.config/island-fund/keys`; `$RT` = the
runner token.

- **Look**: the app's ボット → 保養所, or `curl -s -H "Authorization: Bearer $KEY_A" $URL/its/status | jq
  '{verdict, reasons, runner: .runner | {phase, lastSeen, scans, scanFailures, lastError}}'`. Details: `npx wrangler
  tail`; the run's public log on Actions (counts and codes only; the private log is its encrypted artifact).
- **Investigate a run**: `cd its/worker && npm run its:logs -- <run>[-<attempt>]`: the Worker's events and bookings of
  that run and its decrypted private log in one Tokyo-time timeline; then `rm -rf /tmp/its-logs-<run>` (it holds
  credentials). The checklist: Investigating below.
- **Stop** (normal): 停止 on the page. The runner exits within ~30 s plus any booking in flight.
- **Stop everything**: `npm run deploy -- --var MODE:off` from a clean main, then commit `MODE = "off"` (every
  runner is told `mode_off`, 開始 dispatches nothing); and `gh variable delete ITS_RUNNER_ENABLED` (no job starts at
  all). A run that won't stop: `gh run cancel <id>`, then look for a hold it left (the site's mail). Back on: `MODE =
  "on"` deployed, `gh variable set ITS_RUNNER_ENABLED --body 1`, 開始.
- **Back up the record**: `curl -fsS -H "Authorization: Bearer $KEY_A" $URL/its/status > its-record.json` (settings,
  bookings, events, seen). Restore or seed: the settings with `PUT /its/settings` (`baseUpdatedAt` = the
  current status's `settings.updatedAt`), then the bookings in chunks of ≤ 50 with `curl -fsS -X POST -H
  "Authorization: Bearer $RT" --data-binary @chunk.json $URL/runner/bookings` (ids kept, so a re-run adds nothing;
  `at` becomes the restore time).

## Investigating

**Gmail is the ground truth**: the site mails every hold (「申込手続きのご案内」) and every 予約確定; when the record and
the mail disagree, the mail is what happened. A run in one timeline: `npm run its:logs` (Operations), then `rm -rf`
the decrypted copy. A page's request: `npx wrangler tail --search rid=<id>` (the phone's `its.fail` has the `rid`).

The verdict is the first reason that applies (`reasons`, in this order). `starting`, `never_ran`, `runner_silent`,
`dispatch_failed`, `scan_failing`, `solve_failing`, `mail_failing` and `settings_stale` count only while it should run
(MODE on, not stopped, a date). its-health.yml (every 30 min, `GET /health/its`: codes only) keeps one `its-alert` issue
open on `late` / `failing`, `human_needed`, `dispatch_failed`, `mail_failing`, `settings_stale` or `unsynced` for 30+
min (and `/health/its` failing twice in a row), and closes it when healthy.

| Reason · seen | Verdict | Means | Do |
|---|---|---|---|
| `mode_off` | off | Deployed with `MODE = "off"` | Back on (Operations) |
| `paused` | stopped | 停止 on the page | 開始 |
| `no_dates` | idle | No date today or later | Add a date |
| `dispatch_failed` | degraded | 開始's dispatch was refused (`dispatch.status`: 401/403 = the PAT expired or lacks Actions write, 404 = the workflow file, 422 = not on main, 0 = no answer); the schedule still starts a run | Renew `GH_DISPATCH_TOKEN`; meanwhile wait ≤ 30 min |
| `starting` | starting | Dispatched, no report yet (≤ 10 min) | Wait; Actions shows the queued job |
| `never_ran` | late | No runner has ever reported | `ITS_RUNNER_ENABLED`, the `its` environment's secrets, the workflow's runs on Actions |
| `runner_silent` | late | No report for 45 min | Actions: the last runs (failed? cancelled? the preflight's `stop`?), `lastPreflightAgeSec` (is the schedule asking?); `wrangler tail` for `its refused status=401` (a token changed on one side only) |
| `banned` | failing | The last run hit the 503 セキュリティアラート (~24 h on that IP); clears at the next good scan | Nothing: the next run has a new IP. Recurring: a longer interval |
| `scan_failing` | failing | 3+ failed calendar reads in a row (`runner.lastError`: step, status, class) | its:logs for the failing step and its saved HTML / screenshot: the site changed (SITE.md); `session_dead` for long = the Turnstile solve |
| `solve_failing` | degraded | The last 3 Turnstile solves failed | The run's public log (`solve` lines, spot, secs); SITE.md §6 |
| `unsynced` | degraded | The runner holds booking entries the Worker hasn't acknowledged (no new hold meanwhile) | `wrangler tail` for `its refused … path=/runner/bookings` (409 `id_conflict`, 507 `record_full`: back up the record, Operations); it retries each report |
| `human_needed` | degraded | A stay needs a person (within 24 h, no later 予約確定): a failed 申込 leg, a `human_needed` event (`events` say why), a `confirming` with no outcome after 10 min, or a hold < 30 min old the runner won't finish | Finish or cancel it from the site's mail before the hold lapses (`HOLD_SEC`) |
| `mail_failing` | degraded | Auto-confirm is on and the runner's last IMAP check failed (`runner.lastError` step `imap`: `auth_failed`, `web_login_required`, …): holds wait for a person | The Gmail app password (`ITS_IMAP_APP_PASSWORD`), Gmail's security alerts; meanwhile finish holds by hand |
| `settings_stale` | degraded | The run holding the lease still applies settings older than the saved ones two minutes (`SETTINGS_STALE_SEC`) after a save (`runner.settingsAt` < `settings.updatedAt`) | its:logs on the run (its reports, a parse refusal of the settings); 停止 → 開始 starts a fresh run |
| `prev_unclean` event (`took_over=<run>`) | | A claim took over a lease the run in `detail` never released: it was cancelled or died mid-run | its:logs on that run; Gmail for a hold or 申込 it left |
| A hold in Gmail the record lacks | | The record missed it | its:logs on the run of the time (`confirming` written? `unsynced`?); seed it (Operations) so it's never applied for again |
| Cancelled its-runner runs | | A scheduled run queued behind a running one (`concurrency: its-runner`), replaced by a newer one | Noise, unless every run is cancelled |
| A push that never arrived | | Not sent, refused, or held back by the phone | `wrangler tail --search "its push"`: `queued`? a `skip` says why not; the attempt's `status=` / `outcome=`, the status's `push.lastOutcome` (Push's table); Focus or Sleep: the mail is the backstop |

## Quotas

Workers Free, account-wide (relay, relay-test, gym-bot and this): 100,000 Worker and 100,000 DO requests, 100,000 rows
written a day. This Worker with a runner all day (a report every 30 s, the preflights, the page's polls): ~3,200
requests and ~6,500 rows written; stopped, 48 preflights. The busiest day measured, every script: ~7k, ~19k and ~35k.
