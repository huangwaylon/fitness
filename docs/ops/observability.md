# Observability: the log, its reader, the alert

What the phones and the relay log, how to read it, and what the relay costs against the Free plan. Code:
`app/src/lib/contract/log.ts` (schema and registry), `app/src/lib/sync/log.ts` (phone), `relay/src/log.ts` ·
`logRoute.ts` · `reqMeta.ts` · `logObject.ts` (relay), `relay/scripts/logs.ts` (reader).

## Pieces
| Piece | Holds | Kept | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, binding `LOG`) | phone events (`src c`) and the relay's (`src r`) | 30 days | `npm run logs` (signed `/admin` op `logs`) |
| **Workers Logs** (`[observability]`, no invocation logs) | the relay's `console` lines | 3 days | dashboard → Workers → island-fund-relay → Logs; `npx wrangler tail` |
| **`/health/log`** (`HEALTH_TOKEN`) | counts only | — | `.github/workflows/health.yml` ([The alert](#the-alert)) |

Not used: Logpush (paid), Analytics Engine, the record's SQLite (a restore would roll the log back), invocation logs
(IPs, headers).

## The event
`POST /log` (text/plain JSON, `keepalive` when leaving): `{v: 1, key, b, s, build, os, es: [{t, l, e, q, r?, d}]}`.
Stored per event: `id` (receipt time key), `ct` (phone clock, kept within a day), `lvl` (0 debug · 1 info · 2 warn ·
3 error), `ev` (a registry name, else dropped), `src`, `role` (`A`/`B`/`G` from the key; the key is never kept),
`sid` (session), `rid` (request, joins `api.*` to the relay's `req`), `q`, `build`, `os` (from the UA; Safari 26+
reports `ios18.7`), `d` (only the registry's fields, each of its kind, enforced by the relay).

**What we log:** every event, level and field is in `LOG_EVENTS` (`app/src/lib/contract/log.ts`), the one place to
look. Names are `area.verb` / `area.noun`; a live name is never renamed. Levels: error = lost data or a bug; warn =
degraded or refused; info = lifecycle and samples; debug = polls. An ok path logs sampled (`api.ok`) or as a daily
summary; a routine failure is a `swallow:<name>` counter, a user action an `act:<name>` counter.

**Never logged:** keys, health values, food names, board text, names, e-mails, URL queries or fragments, IPs, user
agents, the record's `detail` / `warnings` text. `js.error` messages are scrubbed (`contract/log.ts`, 120 chars) and
stacks cut to four frames. Tests: `contract/log.test.ts`, `relay/test/log.test.ts` ("privacy"), `sync/log.test.ts`,
`e2e/log.spec.ts` (`E2E_TEST_RELAY=1`). Only the signed `/admin` ops (`logs`, `logstats`, `logpurge`) read the log.

## The phone
`sync/log.ts`: `log()` pushes onto a bounded ring (no I/O), persisted to `island.log`; caps per session and per UTC day
(`DAY_MAX` 900, under the relay's 1,000), drops counted (`log.drop`). Batches are kept until acked: errors flush in
5 s, warnings 30 s, info at hide; on hide every unacked batch goes with `keepalive`. Error events carry `sheet` (the
topmost open sheet). Off in the demo and under automation (`navigator.webdriver`, unless `?log=on`). `/api` requests
carry `rid` and `sid`; the relay echoes `X-Request-Id`.

## The relay
- `POST /log` (`logRoute.ts`): origin, size and **key checked before the object** (a flood spends no DO requests); a
  capped role is answered by the Worker until midnight UTC. `LOG_OFF=1`: acked, nothing kept.
- `/api`: the Worker logs each request's `meta` as `req` (`reqMeta.ts`, `ctx.waitUntil`; not a keyless ok `health`).
  `admin`: ops that change or export (`rw`/`rr`, `ms`, `via`). Worker refusals: `room.refused` / `admin.refused`, ≤ a
  line a minute.
- Recovered failures are a warn `do.error`, a cron call's or job's an error (a job's once a day), each with a scrubbed
  `msg`; a lost alarm `do.alarm`. `cron.backup` carries the App's mint failure and the bots' day-before counts.
- `dv` (a hello's device) joins `ws.hello`, `room.*` and the phone's `ws.close`.
- `cron.places` (`places.ts`): a pull's change or refusal ([runbook](runbook.md#saved-places)).
- **Nightly jobs** (`nightly.ts`, [runbook §0](runbook.md#0-scheduled-work)): ledger check, link sweep, prunes; one
  `cron.nightly` a day; `/health/log` reports `nightlyH` (-1 never).
- **Caps** (UTC day, `LOG_CAPS`, 8,000 total): over one, dropped, `log.cap` once. Tables and retention:
  `relay/src/log.ts`'s header.

## Reading
From `relay/`; keys: `KEY_A`/`KEY_B`, `KEYS_FILE`, else `~/.config/island-fund/keys` (`.smoke-keys` with `--test`).
Times: `90m`, `2h`, `7d`, ISO or ms; printed in Tokyo time. Over ~50k rows read needs `--force`.
```sh
npm run logs -- --since 2h --level warn                    # newest last; --limit 200 (≤ 1000)
npm run logs -- --since 1d --event js.error --person A     # an event or a prefix (--event api.)
npm run logs -- --rid 0ny9a14zf0                           # one request, phone and relay
npm run logs -- --sid ra3im9x4q5                           # one app session
npm run logs -- --src relay --event req --since 6h --json  # raw rows
npm run logs -- report --since 7d [--os ios]               # the summary (--help: all options)
npm run logs -- stats                                      # the alert's numbers
npm run logs -- purge --before … [--person A]              # delete before 30 days
```

### Investigating (a checklist)
1. `npm run logs -- stats`: the alert's numbers; today's rows written (`rowsPct` of 100k) and read (`rowsReadPct` of 5M).
2. `npm run logs -- report --since 1d`: what fails, for whom, since which build.
3. `--since 6h --level warn`, then `--sid` of a session in trouble and `--rid` of a failed request.
4. Live: `npx wrangler tail`; plan usage: the dashboard's Metrics.
5. Off switch: `LOG_OFF = "1"` in `wrangler.toml` `[vars]`, deploy.

## The alert
`health.yml` ([runbook §0](runbook.md#0-scheduled-work), §2) reads `/health/log` with `HEALTH_TOKEN` and opens the
`alert` issue when, in the last 6 hours: errors > 20, `unavailable` > 5, a cap reached, the day's events > 50 % of the
cap, rows written or read > 50 % of the Free plan's, the oldest event > 32 days, no backup or nightly job in 30 h
(`backupH`, `nightlyH`), the list unpulled 3 h (`placesH`), or the relay, record or site down. A green run closes it.
Set up: `openssl rand -hex 32` → `npx wrangler secret put HEALTH_TOKEN` (and `--env test`) and `gh secret set
HEALTH_TOKEN`.

## Costs
### Request budget
Free plan, daily: Workers 100k requests; Durable Objects 100k requests (a WebSocket connect is one, incoming messages
20:1, outgoing free), 13,000 GB-s duration (hibernated objects free), 5M rows read, 100k written, 5 GB storage. A
generous day for two phones and the guest:

| Source | Worker req | DO req | DO GB-s | Rows read | Rows written |
|---|---|---|---|---|---|
| Sockets (2 × 60 shows) | 120 | 120 | ~150 | | |
| Liveness (heartbeat, answered without waking) | 0 | ≤ 36 | ~60 | | |
| Intents (~2,000) and nudges | 0 | 100 | ~100 | | ~2,000 |
| Snapshots (~300) | 300 | 300 | ~30 | ~3,000 | |
| `events` writes (~100 batches) | 100 | 200 | ~10 | ~1,000 | ~1,000 |
| Shortcut ingests (~50) | 50 | 100 | ~5 | ~15,000 | ~1,500 |
| Weather tick (48) | 0 | ~96 | ~10 | | ~48 |
| The log (~150 batches, a `req` per `/api`) | ~150 | ~790 | ~10 | ~2,000 | ~2,500 |
| 英語すごろく online (an hour's game) | 0 | ~30 | ~250 | ~50 | ~260 |
| **Total** | **~720 (0.7 %)** | **~1,770 (1.8 %)** | **~630 (4.8 %)** | **~22,050 (0.4 %)** | **~7,310 (7 %)** |

Duration binds first; nothing is sent per frame.

### Account-wide
The limits are the account's, shared by relay, relay-test, gym-bot and its-bot; 5 cron triggers, 4 used (relay 2,
gym-bot 1, its-bot 1). A day: relay as above; gym-bot ~110 Worker req, ~120 DO req, ~100 rows written
([gym/README](../../gym/README.md#quotas)); its-bot with a runner all day ~3,500, ~6,000, ~6,500 + ~2,900 alarm writes
([its/README](../../its/README.md#quotas)). Busiest measured day, projected with today's its-bot: ~7k Worker, ~21k DO
requests, ~38k rows written of 100k.
