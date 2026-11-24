# The gym bot

A LINE bot that posts in a LINE group when a パーソナルトレーニング or マシンピラティス slot opens at ELEMENT 戸越銀座店
(the gym's hacomono booking site). Not part of the game.

`https://gym-bot.island-fund-relay.workers.dev`: a Worker and a SQLite-backed Durable Object (`GymBot`), Workers
Free. `MODE` (wrangler.toml) `bot`; `off` stops it (LINE events ignored, no checks, `/gym/act` 503 `mode_off`).

## Product rules

- **Japanese, short, plain text**, all in `src/messages.ts`; logs and code are English.
- **Buttons first.** The menu: 📱 アプリで設定 (link, first), 🗓️ 設定を変える, 📋 設定を見る. The only text read is
  メニュー (めにゅー, menu) or a mention of the bot; other chat is ignored. **Never silent**: a bad choice gets a 🤔
  hint, an error 😕.
- **Answers are replies** (free, saying who changed what); pushes count against LINE's quota.
- **Old cards keep working**: postback data (`a=any&d=…`) never changes shape.
- **Each slot time is announced once**; a failed push retries each check with the same `X-Line-Retry-Key`.

Each day has at most one rule (`src/store.ts`):

| Rule | Label | Means |
|---|---|---|
| any | 🔔 終日 | Any open slot |
| skip | 🔕 通知オフ | None that day |
| `[start, end]` | ⏰ 12:00〜14:00 | Slots inside it (half hours) |
| none | 🔕, ⏰ or 💤 | Weekend: off; else ⏰ `DEFAULT_WINDOW` (12:00〜13:00) for the next `DAYS_TO_CHECK` (4) days; else 💤 |

Why 4 days: the gym allows 3 reservations at a time.

- **⏳ check from** a time: the day is ignored until then (bounds: the contract's `fromRefusal`); 🔕 clears it.
- **🧹 reset** clears a day's rule, ⏳ and announced times, so its open slots alert again.
- **🔎 check now**: once a minute for everyone (`CHECK_COOLDOWN_MS`), lists everything open; LINE's marks the times
  announced, the app's is a peek (marks nothing).
- **📱 アプリで設定** opens `${APP_URL}/gym#<LINK_KEY>` in LINE's browser (docs/bots.md): the same `/gym/config` and
  `/gym/act`. `LINK_KEY` acts as member A (`via=link`, listed as ジムボット), gym settings only, never the relay's
  record. Unset: no button. Rotating it breaks old cards' links (メニュー brings a new card).
- **🔧 チェック設定**: interval (`INTERVALS` 10, 15, 30, 60 min; 15 at first) and stop/restart.
- Days: 🗓️ cards, 25 days ahead.

## How it works

`gym/src/`: `index.ts` (routes, `/status`'s 60 s cache, the cron), `bot.ts` (`GymBot`: state, alarm checks, pushes),
`status.ts` (verdict), `ui.ts`, `actions.ts` (one path: `apply`), `line.ts`, `store.ts` (day rules), `hacomono.ts`
(the gym API), `messages.ts`, `time.ts`, `config.ts`, `env.ts`. Shared with the app: `app/src/lib/gym/contract.ts`.

| Route | |
|---|---|
| `POST /line/webhook` | 403 without a valid `X-Line-Signature`; 200 at once, events handled after |
| `GET /status` | Health for ボット → ジム; public, codes and totals only |
| `GET /gym/config` | 📋's content: Bearer KEY_A / KEY_B / KEY_C / `LINK_KEY` (else 401), `ALLOWED_ORIGINS` or localhost (else 403) |
| `POST /gym/act` | The app's change or 🔎: a member key (guest 401), same origin, JSON ≤ 2 KB (else 413) |
| `GET`, `PUT /gym/state` | Export / import (Bearer `GYM_TOKEN`); PUT takes only a valid version-3 state |
| `GET /health` | `{ok, mode, sha}` |

- **Checks**: each alarm checks both programs, today to the last checked day, then sets the next: the interval ±15%,
  or after a failed check a backoff (doubling, ≥ a 429's `Retry-After`, ≤ `MAX_BACKOFF_MINUTES` 120). `SITE_DOWN` is
  pushed after 3 failed checks, `SITE_BACK` on recovery. The hourly cron (`7 * * * *`), a tap or a `/gym/state` call
  sets a missing alarm.
- **State** (DO): `state` (version 3), `runtime` (failures, retry key, recent checks, `changes`); unreadable: kept as
  `state.bad`, the bot starts empty.
- **The app** (`POST /gym/act`, the contract's `ActInput`, incl. a bulk `{a, days}`): parsed into the same actions
  as taps (`parseAction` → `apply`). Refusals `{ok: false, error, hint?}`, statuses in `ACT_STATUS` (409 `stale`:
  the day's `base` hash changed; 429 `cooldown`). `runtime.changes`: the last `CHANGES_KEPT` (12), named `NAME_A` /
  `NAME_B`. Contract change: Worker first, then the app.
- **Logs** (`npx wrangler tail`): a member is `u:` + 4 hex of their ID's hash, never a LINE ID or name. Daily counts
  ride `GET /gym/state`'s `X-Bot-Day` into the relay's 03:00 `cron.backup`.

## Secrets

`npx wrangler secret put <NAME>` from `gym/`; a copy in `~/.config/gym-bot/secrets.env`.

| Name | Value |
|---|---|
| `LINE_CHANNEL_TOKEN`, `LINE_CHANNEL_SECRET` | LINE Developers Console (Messaging API). Rotate: reissue, `secret put` at once (no deploy), update the copy |
| `LINE_GROUP_ID` | The group. Unset: other groups' events log their ID (how to find it); alerts wait |
| `GYM_TOKEN` | `openssl rand -hex 32`, for `/gym/state`; the relay holds the same value (nightly backup) |
| `KEY_A`, `KEY_B`, `KEY_C` | The relay's person keys; KEY_C (guest, optional) reads `/gym/config` only |
| `LINK_KEY` | `openssl rand -hex 32`: the 📱 link's key |
| `NAME_A`, `NAME_B` | Optional: names in the app's change list |

## Develop and deploy

```sh
cd gym && npm ci
npm run check && npm run knip && npm test   # CI: .github/workflows/gym.yml
npm run deploy                              # clean gym/ at a commit on origin/main
curl -s https://gym-bot.island-fund-relay.workers.dev/health   # {"ok":true,"mode":"bot","sha":…}
```

**Deploy** keeps the state and alarm. Tests mock `cloudflare:workers`. The Worker imports `app/src/lib/gym/contract.ts`, `app/src/lib/contract/` and `relay/src/{auth,body}.ts` (gym.yml's
paths). Roll back: `npx wrangler deployments list`, `npx wrangler rollback <version-id>`.

## Operations

`$URL` = the Worker; tokens from the secrets copy.

- **Look**: ボット → ジム, `curl -s $URL/status`, `npx wrangler tail`. Alerts: ボット's dot
  ([bots.md](../docs/bots.md)), health.yml's `gym-alert` issue, `SITE_DOWN` in the group.
- **Stop everything**: `npm run deploy -- --var MODE:off`, commit `MODE = "off"`. Back: `MODE = "bot"`, deploy, then
  `curl -fsS -H "Authorization: Bearer $GYM_TOKEN" $URL/gym/state` to set the first alarm.
- **Back up / edit**: `curl -fsS -H "Authorization: Bearer $GYM_TOKEN" $URL/gym/state > state.json`; restore with
  `-X PUT --data-binary @state.json`. Nightly copy: `gym-YYYY-MM-DD.json.age` (docs/ops/runbook.md §6); rotating
  `GYM_TOKEN` means `secret put` in `relay/` too.
- **Point LINE here**: webhook `$URL/line/webhook` (LINE Developers Console, or `PUT
  https://api.line.me/v2/bot/channel/webhook/endpoint` with `{"endpoint": …}`).

## Diagnose

The verdict is the first reason that applies (`/status`'s `reasons`, in this order):

| Reason | Verdict | Means | Do |
|---|---|---|---|
| `mode_off` | off | Deployed with `MODE = "off"` | Back on (Operations) |
| `paused` | stopped | ⏸️ in 🔧 | ▶️ チェックを再開 |
| `no_alarm` | broken | No next check | The cron sets one (or `GET /gym/state`); recurring: `wrangler tail` |
| `no_group` | broken | `LINE_GROUP_ID` unset | Put the secret |
| `webhook_wrong` | broken | LINE's webhook isn't `$URL/line/webhook` | Point LINE here |
| `overdue` | late | 5+ min past the next check | Usually passes |
| `site_failing` | failing (3+), else degraded | Checks failing (codes say how) | Wait; `http_4xx` / `empty` for long: API changed (`hacomono.ts`) |
| `program_failing` | degraded | One program failed | Usually passes |
| `push_retry` | degraded | A push didn't reach LINE | A 429 = the month's quota |
| `quota_high` | degraded | 80%+ of the month's pushes | Fewer days or a longer interval |

## Quotas

- LINE free plan: 200 pushes a month, each counted per group member; replies are free.
- Workers Free, account-wide: [observability "Account-wide"](../docs/ops/observability.md#account-wide) (1 cron
  trigger). Every 15 min: ~100 alarms and ~100 rows a day, the cron 24 requests.
- The gym site: 2 requests a check, backoff on failure.
