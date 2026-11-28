# Observability: the log, its reader, the alert

What the phones and the relay log, how to read it, and what the relay costs against the Free plan. Code:
`app/src/lib/contract/log.ts` (schema, registry), `app/src/lib/sync/log.ts` (phone), `relay/src/log.ts` · `logRoute.ts`
· `reqMeta.ts` · `logObject.ts` (relay), `relay/scripts/logs.ts` (reader).

## Pieces
| Piece | Holds | Kept | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, binding `LOG`) | phone events (`src c`) and the relay's (`src r`) | 30 days | `npm run logs` (signed `/admin` op `logs`) |
| **Workers Logs** (no invocation logs) | the relay's `console` lines | 3 days | dashboard; `npx wrangler tail` |
| **`/health/log`** (`HEALTH_TOKEN`) | counts only | — | `health.yml` ([The alert](#the-alert)) |

Not used: Logpush, Analytics Engine, the record's SQLite, invocation logs ([decisions](../decisions.md)).

## The event
`POST /log` (text/plain JSON, `keepalive` when leaving): `{v: 1, key, b, s, build, os, es: [{t, l, e, q, r?, d}]}`.
Stored: `id`, `ct` (phone clock), `lvl` (0 debug · 1 info · 2 warn · 3 error), `ev` (a registry name, else dropped),
`src`, `role` (from the key; the key is never kept), `sid` (session), `rid` (request, joins `api.*` to the relay's
`req`), `q`, `build`, `os`, `d` (only the registry's fields, enforced by the relay).

**What we log:** every event, level and field is in `LOG_EVENTS` (`contract/log.ts`). Names `area.verb` /
`area.noun`, never renamed. Error = lost data or a bug; warn = degraded or refused; info = lifecycle and samples; debug
= polls. An ok path is sampled (`api.ok`) or a daily summary; routine failures `swallow:<name>`, user actions
`act:<name>` counters.

**Never logged:** keys, health values, food names, board text, names, e-mails, URL queries or fragments, IPs, user
agents, the record's `detail` / `warnings`. `js.error` messages scrubbed (120 chars), stacks four frames. Tests:
`contract/log.test.ts`, `relay/test/log.test.ts` ("privacy"), `sync/log.test.ts`, `e2e/log.spec.ts`. Only the signed
`/admin` ops (`logs`, `logstats`, `logpurge`) read the log.

## The phone
`sync/log.ts`: a bounded ring persisted to `island.log`; caps per session and UTC day (`DAY_MAX` 900), drops counted
(`log.drop`). Batches kept until acked: errors flush in 5 s, warnings 30 s, info at hide (`keepalive`). Errors carry
`sheet`. Off in the demo and under automation (unless `?log=on`). `/api` requests carry `rid` and `sid`.

## The relay
- `POST /log`: origin, size and key checked before the object; a capped role answered by the Worker till midnight UTC.
  `LOG_OFF=1`: acked, nothing kept.
- `/api` requests log as `req` (`reqMeta.ts`; not a keyless `health`); `admin` ops that change or export; refusals
  `room.refused` / `admin.refused`, ≤ a line a minute.
- Recovered failures: warn `do.error`; a cron's or job's: error (a job's once a day), scrubbed `msg`; a lost alarm
  `do.alarm`. `cron.backup` carries the App's mint failure and the bots' counts. `dv` joins `ws.hello`, `room.*`,
  `ws.close`. `cron.places`: a pull's change or refusal. `cf.usage`: Jobs' usage read failing or well again.
- **Nightly jobs** (`nightly.ts`): ledger check, the money check (`fin.check`, an error on a drift; `finDrift`), link
  sweep, prunes; one `cron.nightly`; `/health/log` `nightlyH`.
- **Caps** (UTC day, `LOG_CAPS`, 8,000 total): over one, dropped, `log.cap` once. Retention: `relay/src/log.ts` header.

## Reading
From `relay/`; keys from `KEYS_FILE` or `~/.config/island-fund/keys` (`.smoke-keys` with `--test`). Times `90m`, `2h`,
`7d`, ISO or ms; printed in Tokyo time. Over ~50k rows read needs `--force`.
```sh
npm run logs -- --since 2h --level warn                    # newest last; --limit 200 (≤ 1000)
npm run logs -- --since 1d --event js.error --person A     # an event or a prefix (--event api.)
npm run logs -- --rid <rid>                                # one request; --sid <sid>: one session
npm run logs -- report --since 1d [--os ios]               # the summary (--help: all options)
npm run logs -- stats                                      # the alert's numbers
npm run logs -- purge --before … [--person A]              # delete before 30 days
```
**Investigating:** `stats` (incl. `rowsPct`, `rowsReadPct`), then `report --since 1d` (what fails, for whom, since
which build), then `--level warn`, `--sid`, `--rid`; live `npx wrangler tail`. Off switch: `LOG_OFF = "1"` in
`[vars]`, deploy. Keep `--since` to a day: a report reads every row of its window.

## The alert
`health.yml` ([runbook §0](runbook.md#0-scheduled-work), §2) reads `/health/log` and opens `alert` when, in the last
6 h: errors > 20, `unavailable` > 5, a cap reached, the day's events > 50 % of the cap, rows written or read > 50 % of
the Free plan's, the oldest event > 32 days, no backup or nightly in 30 h (`backupH`, `nightlyH`), the list unpulled
3 h (`placesH`), the money check drifted (`finDrift`), or the relay, record or site down. A green run closes it. Token: `openssl rand -hex 32` → `npx
wrangler secret put HEALTH_TOKEN` (and `--env test`), `gh secret set HEALTH_TOKEN`.

## Costs
### The rows-read budget (the account's 5M a day)
Past 5M every Durable Object throws until midnight UTC (the phones go offline). Heavy readers: long log scans, the
record, smokes against the test copy (same quota: keep it to a few rows).
- **The guard** (log.ts `reads`, `SHED_PCT` 60; test copy `READS_SHED_PCT` 10): past it the optional admin ops get
  **429 `budget`** (all but storeObject.ts `ESSENTIAL_OPS`), the places tick waits, `/health/log` skips its scan
  (`shed`). `logs` also stops past `LOG_READS_MAX` (1M). Phones' `/api`, ingest and the room are never refused.
- Per object: GraphQL `durableObjectsPeriodicGroups` (never print the token). At a glance: ボット → Jobs → **Daily
  limits (Cloudflare)** (the relay with `CF_ANALYTICS_TOKEN`, 10 min cached; amber 60 %, red 85 %: [bots.md](../bots.md)).

### The rows-written budget (the account's 100k a day)
An `events` row writes ~8 rows (row, index entries, `ids`, a replaced slot); **a new index writes a row per existing
row** (budget a migration); an editor session ~6k an hour; places-details ~3.5k a run.
- **The guard** (log.ts `writes`, `WRITE_SHED_PCT` 80; test copy `WRITES_SHED_PCT` 20): past it (the account's count
  from Cloudflare every 10 min, else the log's own) the log keeps only errors and optional writing admin ops get **429
  `budget`**; `/health/log` says `wshed`. Phones' writes go on.

### Request budget
Free plan, daily: 100k Worker requests; 100k DO requests (a WebSocket connect is one, incoming messages 20:1), 13,000
GB-s (hibernated free), 5M rows read, 100k written, 5 GB. A generous day for three:

| Source | Worker req | DO req | DO GB-s | Rows read | Rows written |
|---|---|---|---|---|---|
| Sockets (2 × 60 shows) | 120 | 120 | ~150 | | |
| Liveness (auto-answered heartbeat) | 0 | ≤ 36 | ~60 | | |
| Intents (~2,000) and nudges | 0 | 100 | ~100 | | ~2,000 |
| Snapshots (~300) | 300 | 300 | ~30 | ~3,000 | |
| `events` writes (~100 batches) | 100 | 200 | ~10 | ~1,000 | ~1,000 |
| Shortcut ingests (~50) | 50 | 100 | ~5 | ~15,000 | ~1,500 |
| Weather tick (48) | 0 | ~96 | ~10 | | ~48 |
| The log (~150 batches, a `req` per `/api`) | ~150 | ~790 | ~10 | ~2,000 | ~2,500 |
| 英語すごろく online (an hour) | 0 | ~30 | ~250 | ~50 | ~260 |
| **Total** | **~720 (0.7 %)** | **~1,770 (1.8 %)** | **~630 (4.8 %)** | **~22,050 (0.4 %)** | **~7,310 (7 %)** |

### Account-wide
Shared by relay, relay-test, gym-bot and its-bot; 5 cron triggers, 4 used. A day: gym-bot ~110 Worker req, ~120 DO
req, ~100 rows written ([gym/README](../../gym/README.md#quotas)); its-bot with a runner all day ~3,500, ~6,000,
~6,500 + ~2,900 alarm writes ([its/README](../../its/README.md#quotas)). Busiest measured day: ~7k Worker, ~21k DO
requests, ~38k of 100k rows written.
