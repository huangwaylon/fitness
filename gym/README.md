# The gym bot

A LINE bot that posts in a LINE group when a 💪 パーソナルトレーニング or 🧘 マシンピラティス slot opens at ELEMENT
戸越銀座店 (the gym's hacomono booking site), for a few Japanese-speaking friends. Not part of the game: it only shares
the Cloudflare account with the relay.

`https://gym-bot.island-fund-relay.workers.dev`: one Worker and one SQLite-backed Durable Object (`GymBot`), Workers
Free. `MODE` (wrangler.toml) is `bot`; `off` is the stop switch (LINE's events answered 200 and ignored, the alarm
checks nothing and sets no next alarm, the app's `/gym/act` refused 503 `mode_off`).

## Product rules

- **Japanese, short, natural.** Every user-facing string is in `src/messages.ts`; logs, code and docs are English.
  LINE shows plain text: `・` for list items, a card's first line is its bold title, no walls of text, no link buttons.
- **Buttons first.** Everything is done by tapping cards (or in the app's ボット → ジム, below). The only text read is
  メニュー (めにゅー, menu) or a mention of the bot, which shows the menu; other chat in the group is ignored.
- **Never silent.** An invalid choice gets a short 🤔 hint and the card keeps working; an unexpected error gets 😕.
- **Answers are replies**, seen by the whole group: a change says who made it. Replies are free; pushes (alerts,
  the site notices) count toward LINE's quota.
- **Old cards keep working**: the postback data (`a=any&d=2026-10-07`) never changes shape; a tap for a day that has
  passed gets a hint.
- **Each slot time is announced once** (the day and start, whichever program; every program open then is named). A
  failed push is retried each check with the same `X-Line-Retry-Key`, so LINE drops a copy that did arrive.

Each day has at most one rule (`src/store.ts`):

| Rule | Label | Means |
|---|---|---|
| any | 🔔 終日 | Any open slot |
| skip | 🔕 通知オフ | None that day |
| `[start, end]` | ⏰ 12:00〜14:00 | Slots that start and end inside it (on the half hour; the end suggested an hour on) |
| none | ⏰ or 💤 | ⏰ 12:00〜13:00（ふだん） (`DEFAULT_WINDOW`) for the next 4 days (`DAYS_TO_CHECK`), else 💤 not checked yet |

Why 4 days: 予約は同時に3件まで (the gym takes 3 reservations at a time), so a few near days at lunch are the usual;
further days wait for a setting.

- **⏳ check from** a date and time: the day is ignored until then (e.g. Friday from Tuesday 18:00, when an earlier
  booking is over: 3 at a time). Kept between 🔔 and ⏰, cleared by 🔕; set on a 🔕 or 💤 day it gives the day ⏰
  12:00〜13:00. One rule (the contract's `fromRefusal`): in the future, from today up to the day itself, and on the day
  before its window's last slot starts (🔔: 21:30), else a hint (it would never find one). LINE's picker runs from the
  next minute to the day's 21:29; the app offers half hours on a start day and a time.
- **🧹 reset** clears a day's rule, ⏳ and announced times, so its open slots alert again (shown only when there's
  something to clear).
- **🔎 check now**: once a minute for everyone (LINE and the app share it), refused while stopped or while a check
  runs; lists everything open, and the times it lists aren't announced later. The app's 🔎 is a peek: it marks nothing
  announced, so the next alarm still alerts the group.
- **🔧 チェック設定**: the interval (10, 15, 30 or 60 minutes; 15 at first) and stop/restart.
- Days are picked from 🗓️ buttons, one bubble per week, 25 days ahead (the gym publishes about 4 weeks). Past days,
  passed ⏳ times and announced times that have started are dropped at each check.

## How it works

| File | Role |
|---|---|
| `src/index.ts` | The routes (below), MODE's dispatch, `/status`'s 60 s cache |
| `src/bot.ts` | `GymBot`: the state, the checks on its alarm, pushes (with a retry key), what `/status` reads |
| `src/status.ts` | `/status`'s payload and its verdict |
| `src/ui.ts`, `actions.ts`, `line.ts` | The cards and taps, what the buttons and the app do (one path: `apply`), LINE's API |
| `src/store.ts`, `hacomono.ts`, `messages.ts` | The rules per day, the gym API, every user-facing string |
| `src/time.ts`, `config.ts`, `env.ts` | Tokyo days and clock times, fixed settings, bindings and secrets |
| `app/src/lib/gym/contract.ts` | Shared with the app: the fixed rules, `/gym/config`'s and `/gym/act`'s shapes, Tokyo time |

| Route | |
|---|---|
| `POST /line/webhook` | LINE's webhook: 403 without a valid `X-Line-Signature`; 200 at once, the events handled after |
| `GET /status` | The runner's health (below), for the app's ボット → ジム; public, any origin |
| `GET /gym/config` | 📋 設定を見る's answer (below), members only: `Authorization: Bearer <KEY_A or KEY_B>` (else 401), the app's origin (`ALLOWED_ORIGINS`, localhost, or none; else 403), `private, no-store` |
| `POST /gym/act` | The app's change or 🔎 (below): the same key and origin, a JSON body of at most 2 KB (else 413); 503 `mode_off` unless `MODE` is `bot` |
| `GET`, `PUT /gym/state` | The state, exported or imported (`Authorization: Bearer <GYM_TOKEN>`); PUT takes only a valid version-3 state (else 400) |
| `GET /health` | `{ok, mode, sha}` |

- **Checks**: each alarm checks both programs (2–5 s apart, today to the last checked day; nothing when no day is
  checked) and sets the next: the interval ±15%, or after a fully failed check a backoff (doubling, at least a 429's
  `Retry-After`, at most 120 min). `SITE_DOWN` is pushed after 3 failed checks in a row, `SITE_BACK` once the site
  answers. Stopped (⏸️) = no alarm; restarting checks at once, a new interval counts from the last check. If no alarm
  is set (and the checks aren't stopped), an hourly cron (:07), a tap or a `/gym/state` call sets one (log: `no next
  check was set: checking now`).
- **State**: DO storage. `state` is the rules and settings (version 3); `runtime` holds failures in a row, the
  notice sent, a failed push's retry key, the last checks and what `/status` shows. A saved state that can't be read
  is kept as `state.bad` and the bot starts empty (log: `could not read the saved state`). `GET /gym/state` is the
  backup.
- **Status**: a verdict with every reason that applies (rules in `status.ts`), the last and next check, the last
  success and error, failures in a row, LINE's quota and whether its webhook points here, and the last day's checks
  (at most 150, the app's 直近12時間 strip: alarm or 🔎, a code per program, open and new counts, the push). Public
  on purpose: totals and codes only, never names, IDs, the group, the days' settings, slot times or error text. It
  reads the object's memory only; LINE's facts are read by the alarm after a push, and hourly. The Worker keeps the
  answer 60 s, so a flood costs Worker requests, not the object's.
- **Config**: `/gym/config` is what 📋 設定を見る answers in the group, for members only (it names the days'
  settings, which `/status` never does): its parts (`messages.ts` `StatusView`: the title, each day's date, rule, ⏳
  and `soft` (🔕 or 💤: nothing announced), the trouble notice, the closing line) as the same functions word them, the
  interval, stopped or not, the last and next check, and `text`, LINE's reply verbatim (`actions.ts` `config`; one
  test drives both). Read from memory, never kept. Logs `config read by=A`, `config refused 401 unauthorized` (log
  level; warn: 403 origin, 405 method, 401 `no_keys`), or `config failed <ErrName>` (500, with CORS).
- **The app** (`POST /gym/act`, the contract's `ActInput`): `{a: any|skip|reset|unfrom, d, base?}`, `{a: range, d, s,
  e, base?}`, `{a: from, d, at, base?}` (`at` a clock time on `d`, or an instant: the app sends one), `{a: interval, m}`, `{a: pause|resume|check}`, and
  the calendar's bulk form `{a, days: [{d, base?}]}` (all or nothing). The bot reads it into the same actions as the
  taps (`actions.ts` `parseAction` → `apply`), so the rules and the words are LINE's. Answers `{ok: true, changed,
  reply, config}` (🔎 also `lines`, `partial`, `slots`); refusals `{ok: false, error, hint?}` with LINE's hint, each
  code's status in the contract's `ACT_STATUS` (a 409 `stale` with `config`, a 429 `cooldown` with `Retry-After`),
  with CORS. The page sends its acts one at a time. `base` is a day's setting (rule and ⏳, not the announced times)
  as a short hash (each `/gym/config` row's): a 409 `stale` only when that day changed since; the interval and
  stop/restart are absolute; LINE's taps stay last-writer-wins. A change made in the app leaves the same state, 📋
  and `/gym/config` as the same tap on LINE (worker.test runs each kind both ways); the group is never told of it.
  The app's own list of its changes is `runtime.changes`: the latest per day and per check setting (🔕, 🧹, 🔕 on a
  day is one 🔕), at most 12, newest first. Names: `NAME_A` / `NAME_B` (secrets), else メンバーA / B. `/gym/config`
  adds the calendar's 25 `rows` (`{day, rule, usual, from, announced, resettable, base}`), `defaultDays`,
  `intervals`, `checkReadyAt`, `checking` and `changes`. Logs:
  `act by=A a=any d=… changed=1 rid=…` a day, `changed … (by web A)`, `act by=A a=… refused <code>` (log level),
  `act refused 401|403|405|413|503 …` (warn).
- **Logs**: `tap from …`, `changed 2026-11-03: default -> 12:00-13:00 (by …)`, `check: 2 open, 1 new, 0 errors
  (through …)`, every warning: Workers Logs, 3 days (dashboard → Workers → gym-bot → Logs), or live with
  `npx wrangler tail`.

## Secrets

`npx wrangler secret put <NAME>` from `gym/`; never in this public repo. Cloudflare can't show them again: the
coordinator keeps a copy in `~/.config/gym-bot/secrets.env`.

| Name | Value |
|---|---|
| `LINE_CHANNEL_TOKEN`, `LINE_CHANNEL_SECRET` | LINE Developers Console → the channel (Messaging API, Basic settings) |
| `LINE_GROUP_ID` | The group. Empty: another group's events log `LINE_GROUP_ID=…` (how it's found), alerts wait |
| `GYM_TOKEN` | `openssl rand -hex 32`, for `/gym/state` |
| `KEY_A`, `KEY_B` | The members' person keys, copied from the relay's, for `/gym/config` and `/gym/act` (never the guest's `KEY_C`) |
| `NAME_A`, `NAME_B` | Optional: the members' names in the app's list of its changes; unset: メンバーA / B |

## Develop and deploy

```sh
npm ci
npm run check && npm run knip && npm test   # CI runs these for gym/** (.github/workflows/gym.yml)
npm run deploy                              # a clean gym/ at a commit on origin/main
curl -s https://gym-bot.island-fund-relay.workers.dev/health   # {"ok":true,"mode":"bot","sha":<the commit>}
```

Tests run on Node with `cloudflare:workers` mocked, no network. The account is pinned in wrangler.toml (the relay's).
A deploy keeps the state and the alarm. A contract change (`app/src/lib/gym/contract.ts`): the Worker first, then the
app (the page reads an older Worker's answers, not the other way round). `NAME_A` / `NAME_B` are put once
(`npx wrangler secret put NAME_A`), before the deploy that should show them.

## Operations

`$URL` = `https://gym-bot.island-fund-relay.workers.dev`; `$GYM_TOKEN`, `$LINE_CHANNEL_TOKEN` from the secrets copy.

- **Look**: the app's ボット → ジム (the calendar of the 25 days, the controls; under 動作状況 the verdict, the
  直近12時間 strip of the checks and the facts; up to a minute old), or `curl -s $URL/status`. Details:
  `npx wrangler tail`. In the group, 📋 設定を見る shows the last and next check.
- **Stop everything** (alerts gone wrong): `npm run deploy -- --var MODE:off` from a clean main, then commit
  `MODE = "off"`: LINE's taps are ignored and the app's changes and 🔎 refused (503 `mode_off`; the page still shows
  the settings). Back on: `MODE = "bot"`, deploy, then `curl -fsS -H "Authorization: Bearer $GYM_TOKEN" $URL/gym/state`
  to set the first alarm.
- **Back up or edit the state**: `curl -fsS -H "Authorization: Bearer $GYM_TOKEN" $URL/gym/state > state.json`;
  back with `curl -fsS -X PUT -H "Authorization: Bearer $GYM_TOKEN" --data-binary @state.json $URL/gym/state`.
- **Point LINE here** (the webhook must be `$URL/line/webhook`): LINE Developers Console, or
  `curl -fsS -X PUT -H "Authorization: Bearer $LINE_CHANNEL_TOKEN" -H 'Content-Type: application/json'
  -d "{\"endpoint\":\"$URL/line/webhook\"}" https://api.line.me/v2/bot/channel/webhook/endpoint` (one line).

## Diagnose

The verdict is the first reason that applies (`/status`'s `reasons`, in this order):

| Reason | Verdict | Means | Do |
|---|---|---|---|
| `mode_off` | off | Deployed with `MODE = "off"` | Back on (Operations) |
| `paused` | stopped | ⏸️ in the group's 🔧 チェック設定 | ▶️ チェックを再開 in LINE |
| `no_alarm` | broken | No next check scheduled | The hourly cron sets one (or `GET /gym/state` now); if it recurs, `wrangler tail` for why |
| `no_group` | broken | `LINE_GROUP_ID` unset | Put the secret |
| `webhook_wrong` | broken | LINE's webhook isn't `$URL/line/webhook` or is inactive (taps go nowhere) | Point LINE here |
| `overdue` | late | 5+ min past the next check | Usually passes; if it stays, `wrangler tail` |
| `site_failing` | failing (3+), else degraded | Whole checks failing: the codes say how (`timeout`, `rate_limited`, `http_5xx`, …) | Wait: it backs off and warns the group; `http_4xx` or `empty` for long may mean the gym's API changed (`hacomono.ts`) |
| `program_failing` | degraded | One program failed in the last check | Usually passes |
| `push_retry` | degraded | An alert or notice didn't reach LINE; retried each check | LINE status; a 429 in the logs = the month's quota is used up |
| `quota_high` | degraded | 80%+ of the month's LINE pushes used | Fewer days or a longer interval until the 1st |

## Quotas

- LINE free plan: 200 pushed messages a month, each counted once per group member. Alerts and notices are pushes;
  answers to taps are free.
- Workers Free: 100,000 requests a day; Durable Objects 100,000 requests, 13,000 GB-s and 100,000 rows written a day,
  account-wide, shared with the relay; 5 cron triggers an account (the relay 2, this 1). A check every 15 minutes is
  ~100 alarms and ~100 rows a day, the cron 24 requests.
- The gym site: 2 requests a check, browser User-Agent and Referer, backoff on failures.
