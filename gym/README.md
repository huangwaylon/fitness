# The gym bot

A LINE bot that posts in a LINE group when a 💪 パーソナルトレーニング or 🧘 マシンピラティス slot opens at ELEMENT
戸越銀座店 (the gym's hacomono booking site), for a small group of Japanese-speaking friends. Not part of the game: it
only shares the Cloudflare account with the relay. It is a TypeScript port of the Python bot in
[huangwaylon/gym](https://github.com/huangwaylon/gym) (its `CLAUDE.md` is the product and domain reference: rules per
day, ⏳, 🧹, alerts once per start time, the notices; every Japanese string here is copied from its `messages.py`).

Address: `https://gym-bot.island-fund-relay.workers.dev`. One Worker, one SQLite-backed Durable Object (`GymBot`),
Workers Free. LINE's webhook comes straight here, so nothing needs a tunnel or a machine left on.

`MODE` (wrangler.toml) is `off` until the cut-over: LINE's events are answered 200 and ignored, and the alarm checks
nothing and sets no next alarm, so the Worker never checks while the Mac's bot does (two checkers would alert twice).
`bot`: this Worker answers the taps, checks the gym and pushes alerts.

## How it works

| File | Role |
|---|---|
| `src/index.ts` | The Worker's routes (below), MODE's dispatch |
| `src/bot.ts` | `GymBot` (Python `gymbot.py`): state, `runCheck`, `pollOnce`, the alarm, push with a retry key, RPC for the Worker |
| `src/ui.ts`, `actions.ts`, `line.ts` | The cards and taps, what the buttons do, LINE's API and signature check |
| `src/store.ts`, `hacomono.ts`, `messages.ts` | The rules per day, the gym API, every user-facing string |
| `src/time.ts`, `config.ts`, `env.ts` | Tokyo days and clock times, fixed settings, bindings and secrets |

| Route | |
|---|---|
| `POST /line/webhook` | LINE's webhook; 403 without a valid `X-Line-Signature`; always 200 at once, the events handled after |
| `GET`, `PUT /gym/state` | Export or import the state (`Authorization: Bearer <GYM_TOKEN>`, else 401). PUT answers 400 `{ok: false, error}` for anything but a valid version-3 state |
| `GET /health` | `{ok, mode, sha}` |

- **Checks** (MODE `bot`): the alarm replaces Python's `poll_forever`. Each alarm runs `pollOnce` (one check: both
  programs 2–5 s apart, from today to the last checked day; nothing when no day is checked) and sets the next alarm:
  the interval ±15%, or the backoff when every program failed (doubling, at least a 429's `Retry-After`, capped at
  120 min). `SITE_DOWN` after 3 failed checks in a row, `SITE_BACK` once it answers. Stopped (⏸️) = no alarm.
  `wake()` (a settings change): restarted → check now; new interval → from the last check. Every tap and every
  `/gym/state` call makes sure an alarm is set (that's how the first one starts after the switch).
- **State**: DO storage, key `state` = the Python `state.json`, byte-for-byte (version 3), so it moves between the two
  unchanged; key `runtime` = what Python kept in memory (failures in a row, notice sent, the failed push's retry key,
  last checks), so an eviction loses nothing. A saved state that can't be read is kept under `state.bad` and the bot
  starts empty (log: `could not read the saved state`). No git backup: `GET /gym/state` is the backup.
- **Logs**: the same lines as the Python bot (`tap from …`, `changed 2026-11-03: default -> 12:00-13:00 (by …)`,
  `check: 2 open, 1 new, 0 errors (through …)`), in Workers Logs for 3 days (dashboard → Workers → gym-bot → Logs)
  or live with `npx wrangler tail`.

## Secrets

Never in this public repo. `npx wrangler secret put <NAME>` from `gym/`:

| Name | Value |
|---|---|
| `LINE_CHANNEL_TOKEN`, `LINE_CHANNEL_SECRET` | The Mac's `.env` (LINE Developers Console → the channel) |
| `LINE_GROUP_ID` | The Mac's `.env`. Empty: other groups' events log `LINE_GROUP_ID=…`, alerts wait |
| `GYM_TOKEN` | `openssl rand -hex 32`, for `/gym/state`; a copy in the Mac's `.env` |

## Develop and deploy

```sh
npm ci
npm run check && npm run knip && npm test   # CI runs these for gym/** (.github/workflows/gym.yml)
npm run deploy                              # production: a clean gym/ at a commit on origin/main
curl -s https://gym-bot.island-fund-relay.workers.dev/health   # {"ok":true,"mode":…,"sha":<the commit>}
```

The account is pinned in wrangler.toml (the relay's). Tests run on Node with `cloudflare:workers` mocked; no network.

## Cutting over

One step from the Python bot on the Mac (`~/gymbot` on mbp2, still on ngrok) to this Worker; taps in the few minutes
between go unanswered. `$URL` = `https://gym-bot.island-fund-relay.workers.dev`, `$GYM_TOKEN` and
`$LINE_CHANNEL_TOKEN` as in Secrets (all in the Mac's `.env`).

1. With the four secrets put and MODE `off` deployed, `/health` says `"mode":"off"`.
2. Stop the Mac's bot for good, keeping the plist for a rollback (a bootout alone restarts it at the next login):
   `launchctl bootout gui/$(id -u)/local.gymbot && mv ~/Library/LaunchAgents/local.gymbot.plist ~/gymbot/`
3. Import its settings: `curl -fsS -X PUT -H "Authorization: Bearer $GYM_TOKEN" --data-binary @$HOME/gymbot/state.json $URL/gym/state` → `{"ok":true}`.
4. `MODE = "bot"` in wrangler.toml, commit, push, `npm run deploy`; `/health` says `"mode":"bot"`.
5. Point LINE's webhook here:
   `curl -fsS -X PUT -H "Authorization: Bearer $LINE_CHANNEL_TOKEN" -H 'Content-Type: application/json' -d "{\"endpoint\":\"$URL/line/webhook\"}" https://api.line.me/v2/bot/channel/webhook/endpoint`
6. Start the checks: `curl -fsS -H "Authorization: Bearer $GYM_TOKEN" $URL/gym/state` (shows the imported state and
   sets the first alarm). In the group: メニュー → 📋 設定を見る shows the days and the next check;
   `npx wrangler tail` shows `check: …` every interval.

**Rollback to the Mac.**
1. `MODE = "off"` and deploy (in a hurry, from a clean main: `npm run deploy -- --var MODE:off`, then commit the
   change). The Worker stops checking at its next alarm.
2. Carry the settings back: `curl -fsS -H "Authorization: Bearer $GYM_TOKEN" $URL/gym/state > ~/gymbot/state.json`.
3. Start the Mac's bot: `mv ~/gymbot/local.gymbot.plist ~/Library/LaunchAgents/ && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/local.gymbot.plist`.
   At startup it registers its ngrok address with LINE again, so the webhook follows; メニュー answers from the Mac.

## Quotas

- LINE free plan: 200 pushed messages a month, each counted once per group member. Alerts and the site notices
  are pushes; answers to taps are free. A 429 on a push = the month's quota is used up (logged; the alert is retried
  each check).
- Workers Free: 100,000 requests a day; Durable Objects 100,000 requests and 13,000 GB-s a day. A check every 15
  minutes is ~100 alarms a day of a few seconds each, taps a handful: far inside.
- The gym site: 2 requests a check, browser User-Agent and Referer, backoff on failures.
