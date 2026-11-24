# Observability: the log, its reader, the alert

What the phones and the relay log, where it goes, how to read it, and what the relay costs against the Free plan
([Request budget](#request-budget)). Why: [decisions](../decisions.md). Code: `app/src/lib/contract/log.ts` (the schema),
`app/src/lib/sync/log.ts` (the phone), `relay/src/log.ts` · `logRoute.ts` · `reqMeta.ts` · `logObject.ts` (the relay),
`relay/scripts/logs.ts` (the reader).

## Pieces
| Piece | Holds | Kept | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, the relay's third SQLite Durable Object, binding `LOG`) | the phones' events (`src c`) and the relay's own (`src r`) | 30 days | `npm run logs` (the signed `/admin` op `logs`) |
| **Workers Logs** (`[observability]`, sampling 1, no invocation logs) | the relay's `console` lines (failures by class) | 3 days | dashboard → Workers → island-fund-relay → Logs; `npx wrangler tail` |
| **`/health/log`** (with `HEALTH_TOKEN`) | the log's counts (errors, warnings, `unavailable`, caps, oldest) | — | `.github/workflows/health.yml` (opens an issue on a spike) |

Not used: Logpush (paid); Analytics Engine (an account token everywhere); the record's SQLite (a restore rolls the log
back); invocation logs (IPs, headers).

## The event (`contract/log.ts`, `LOG_V = 1`)
A phone sends batches to `POST /log` (text/plain JSON, a simple request, `keepalive` when the page is going):
`{v: 1, key, b, s, build, os, es: [{t, l, e, q, r?, d}]}`. The relay stores, per event:

| Column | What |
|---|---|
| `id` | the receipt time's key (ms × 1000 + a counter): the primary key, so a time range needs no index |
| `ct` | the phone's clock (ms), kept only within a day of the relay's |
| `lvl` | 0 debug · 1 info · 2 warn · 3 error |
| `ev` | the event's name (the registry's; anything else is dropped) |
| `src`, `role` | `c` a phone / `r` the relay; `A` · `B` · `G` from the key (the key itself is never kept) |
| `sid`, `rid`, `q` | the app session's id (random, per load), a request's id (`api.*` ↔ the relay's `req`), the event's number in its session |
| `build`, `os` | the app's version (`2026-11-05.ef93d8b`), the device in a word (`ios18.7`, `macos`): from the UA string, which Safari 26 froze, so iOS 26 and 27 both say `ios18.7` (kept as is: no feature sniffing) |
| `d` | the payload: **only the registry's fields for that event, each of its kind** (a number, a boolean, a closed set, a short token never 16+ letters and digits in a row; `js.error`'s scrubbed `msg` and `stack`), enforced by the relay |

### What we log
Every event, its level, fields, kinds and when it is logged: the registry, `app/src/lib/contract/log.ts` `LOG_EVENTS`.
ごはん's counters (how, never what): `act:food.add.<row|open|recent|amount|custom|recipe|quick|copy>`, `act:food.unadd`,
`trip.amount`, `edit`, `remove`, `fresh`, `search.none`, `tab.chart`; the scanner's `act:scan.*` ([food-data.md](../food-data.md#barcodes));
the catalog's load times `perf.food`; the health sheet opened on ごはん is `perf.sheet` / `sheet:` `food`.
English Study's: `act:english.<review.start|review.done|end.leave|history.open|history.again>` beside `cc`, `phrase.*`,
`deck.*` ([english.md](../english.md)); 体重のペース's `act:health.pace.shown` (never its verdict), once a sheet opening.
Failures gone on from: `offline.save` (counts only); `swallow:map.tiles.<places|trip|hike>[.off]` (the
basemap down, once a map), `trip.load`, `hike.track`, `hike.net`, `places.payload`; `act:boot.rescue` (the watchdog's
reload). The service worker's (`service-worker/counts.ts`: `act:sw.push`, `sw.click`, `sw.install`, `swallow:sw.*`),
taken by the page at its start and each show.
トレイル's in-hike map (what was used, never where: no position, no distance): `act:hike.start`, `resume`, `end`, `undoEnd` (終了 taken back),
`offroute` (each time the banner shows), `fork` (each fork the card shows), `compass.denied` / `compass.unsupported`,
`compass.calib` (once a session), `loc.denied`, `wake.on`, `wake.lost` (let go by the system while shown).

### Naming and levels
- Names are `area.verb` / `area.noun` (app, perf, api, sync, queue, ws, gl, chunk, storage, log, cron, room, admin,
  …); `use`, `req`, `admin` stay bare (a live name is never renamed: the history reads it).
- error: the app lost something or a bug threw; warn: degraded but recovered, or a refusal; info: lifecycle and
  samples; debug: polls (ITS's 15 s status).
- An ok path logs only sampled (`api.ok`) or as a daily summary (`cron.wx`); a routine failure is a `swallow:` counter,
  one that needs fields an event.

**Never logged:** keys (or a piece of one), health values, food names, board text, names, e-mails, URLs' queries or
fragments (`#key=`), IP addresses, user agents (only `os`), the record's `detail` / ingest `warnings` text. A
`js.error` message is scrubbed (URLs, e-mails, ids, quoted text, non-ASCII and numbers replaced, 120 characters; the
rules: `contract/log.ts`); a stack is its top four `fn@file:line:col`. Residual risk: unquoted ASCII words in a thrown
message. The tests: `contract/log.test.ts` (canaries in every field), `relay/test/log.test.ts` ("privacy"),
`sync/log.test.ts`, `e2e/log.spec.ts` (`E2E_TEST_RELAY=1`; read back with `npm run logs -- --test --sid …`).

**Who reads it:** only the signed `/admin` ops (`logs`, `logstats`, `logpurge`): the operator. No phone reads the log;
`/health/log` gives counts only, with its own token. `npm run logs -- purge --before … [--person A]` deletes sooner
than the 30 days.

## The phone (`sync/log.ts`)
- `log()` only pushes onto a bounded ring (no I/O, never per frame), which keeps the trail before each error;
  per-session and per-UTC-day caps (900: under the relay's 1,000), drops counted (`log.drop`).
- Persisted to `localStorage` (`island.log`) when idle and as the page goes; full, the log goes first.
- Batches, each kept until the relay acks its id: an error's in 5 s, a warning's in 30 s, info waits for the hide
  (≤ 5 min). Hidden: every unacked batch at once with `keepalive` (≤ 60 KB), one in flight too.
  Past three unacked, the newest takes more of the ring. A capped day (the relay's): errors only until midnight UTC.
- An error event (`js.error`, `chunk.fail`, `gl.lost`, `api.fail`, `sync.fail`) carries `sheet`, the topmost open
  sheet (Sheet.svelte's `timed`, else its `name`'s first word: `shop`, `tent`, `sugoroku`), and `js.error` the route.
  A hide is one line: `ws.close` (`visS`), else `app.hide`. perf.boot leaves out fields at `BOOT_DEFAULTS`.
- A route's crash behind +error.svelte (Kit catches it): `js.error` from `src` `kit` (src/hooks.client.ts); Kit's own (a 404)
  counts `route:<status>`.
- Off in the demo and under automation (`navigator.webdriver`, unless `?log=on`). Unpaired, events wait for a key.
- `/api` requests carry `rid` (per request) and `sid` (per load) in the body; the relay logs them on `req` and echoes
  `X-Request-Id`.

## The relay
- `POST /log` (`logRoute.ts`): origin, size, **the key checked before the object** (a flood spends no DO requests), a
  capped role answered by the Worker till midnight; then `IslandLog.ingest`. `LOG_OFF=1`: acked, nothing kept.
- `/api`: the Worker times the record's answer and sends its `meta` (`reqMeta.ts`) as `req` in `ctx.waitUntil` (not
  a keyless `health` that answered ok). `admin`: an op that changes or exports (a read, `places_ingest`: only failing),
  `rw`/`rr`, `ms`, `via` (the tool: `record:dump`). Refused by the Worker (a socket's origin, upgrade, ticket;
  `/admin`'s shape, size, signature): `room.refused` / `admin.refused`, counted, ≤ a line a minute.
- A failure the relay gets over (notify, remind, imggc, restored, a hello's alarm or weather): a warn `do.error`; a
  cron call's or job's an error (a job's once a day); each with its scrubbed `msg`. A lost alarm: `do.alarm`.
  `cron.backup`: the App's failed mint (`appErr`, `appHttp`), the bots' day-before counts (`its*`, `gym*`).
- `dv` (a hello's device) joins `ws.hello`, `room.*` and the phone's `ws.close`.
- `cron.places` (`places.ts`): a pull's change (info) or refused answer (error: [runbook](runbook.md#saved-places));
  the cron's on a change of state only (`cronLog`: categoriser failing, list 6 h old: warn).
- **Nightly jobs** (`nightly.ts`, runbook §0): the ledgers' check, the link sweep, the prunes (2k rows a run; from the
  first tick after the night's backup: a failing one grows `nightlyH` too). One `cron.nightly` a day. `/health/log`: `nightlyH` (-1 never), `nightly`.
- **Caps** (UTC day, `LOG_CAPS`: 8,000 in all, guarding the rows written): over one, dropped, `log.cap` once. Tables
  and retention (events 30 days): `relay/src/log.ts`'s header.

## Reading
From `relay/`; keys: `KEY_A`/`KEY_B`, `KEYS_FILE`, else `~/.config/island-fund/keys` (`.smoke-keys` with `--test`).
Times: `90m`, `2h`, `7d`, ISO, or ms; printed in Tokyo time. Over ~50k rows read: needs `--force`.
```sh
npm run logs -- --since 2h --level warn                    # newest last; --limit 200 (≤ 1000)
npm run logs -- --since 1d --event js.error --person A     # an event, or a prefix: --event api. / --event js.*
npm run logs -- --rid 0ny9a14zf0                           # one request, the phone's side and the relay's
npm run logs -- --sid ra3im9x4q5                           # one app session, start to end
npm run logs -- --src relay --event req --since 6h --json  # raw rows
npm run logs -- report --since 7d                          # errors, warnings, /api by action, refusals, admin ops, the
                                                           # phones' view, sync, sockets, load and frames, builds, protocol,
                                                           # reloads, swallowed, usage
npm run logs -- report --os ios                            # the phones only (--os: a prefix of `os`); --help: all options
npm run logs -- stats                                      # the alert's numbers
npm run logs -- --test ...                                 # the test relay
```

**Phones disagree on the players:** `where.change`, `ws.close`'s counts; the room's `ws.hello`,
`room.shut`, `room.drop`; `swallow:live.parse.*`.
**What a reload out of sight cost:** the report's `reloaded out of sight` row (perf.resume: from the page's front to the
island whole); **a phone stuck on an old build:** its `Stuck on an old build?` line (sw.installFail, `shell` new). **Did a deploy taken at a hide reload out of sight?** `--event app.open`: `hr: true` and `vis: "hidden"` ran while away;
`vis: "visible"` with a long `hrS` only as the player came back (iOS froze it). **The launch race's cost:** `--event perf.boot`: `raceMs` by `shell`, the worker's steps `swUp` to `swAns` (`pre`: all of them; each field: the registry). **Entering a room:** `--event perf.room`. **WebP fallbacks:** the report's `KTX2 fallbacks` line; `swallow:ktx2.fail` / `ktx2.off`.


### Investigating (a checklist)
1. `npm run logs -- stats`: the alert's numbers; today's (UTC) rows written by object (`rowsLog`, `rowsStore`,
   `rowsRoom`; `rowsPct` of 100k) and read (`readLog`, `readStore`; `rowsReadPct` of 5M).
2. `npm run logs -- report --since 1d`: what fails, for whom, since which build.
3. `npm run logs -- --since 6h --level warn`, then `--sid` of a session in trouble (its whole story) and `--rid` of a
   failed request (the relay's `req`: its status, rule, time).
4. The relay live: `npx wrangler tail`. The plan's use: the dashboard's Metrics, Durable Objects.
5. Off switch: `LOG_OFF = "1"` in `wrangler.toml` `[vars]` and deploy.

## The alert
`health.yml` ([runbook §0](runbook.md#0-scheduled-work), §2) reads `/health/log` with the `HEALTH_TOKEN` secret and
opens the `alert` issue (a change of its reasons, not their counts, comments on it) when, in the last 6 hours, errors >
20 (not while leaving), `unavailable` > 5, a cap was reached, the day's events passed 50 % of the cap, the day's rows
written or read passed 50 % of the Free plan's (`rowsPct`, `rowsReadPct`), the oldest event is over 32 days, no backup
or a nightly job in 30 h (`backupH`, `nightlyH`), the list 3 h unpulled (`placesH`), a heartbeat 2 h old or the relay,
the record or the site down (red too); a green run closes it. Counts, never a message.
Set up once: `openssl rand -hex 32` → `npx wrangler secret put HEALTH_TOKEN` (and `--env test`) and
`gh secret set HEALTH_TOKEN`.

## Costs
### The log (Free plan)
The Request budget's "The log" row, and ~250 B stored an event (~15 MB in 30 days); a `/log` one JSON.parse
(≤ 64 KB); on the phone, `log()` ~µs, a flush one stringify and a fetch.

### Request budget
The whole relay against the Free plan's daily limits: Workers 100k requests; Durable Objects 100k requests (a
WebSocket connect is one, incoming messages count 20:1, outgoing are free), 13,000 GB-s of duration (an idle
hibernatable object isn't billed), 5M rows read, 100k rows written, 5 GB storage. A generous day for two phones and
the guest:

| Source | Count/day | Worker req | DO req | DO GB-s | Rows read | Rows written |
|---|---|---|---|---|---|---|
| Sockets (each show of the app) | 2 × 60 | 120 | 120 | ~150 (10 s awake each, 128 MB) | | |
| Liveness (a quiet socket's 20 s heartbeat, answered without waking the room; a 5-min clock ping) | 720 | 0 | ≤ 36 | ~60 | | |
| Intents kept for the day (the room's ring), nudges | ~2,000 | 0 | 100 | ~100 | | ~2,000 |
| Record reads: snapshots (~5 rows each; a full one the whole record) | ~300 | 300 | 300 | ~30 | ~3,000 (+ the record per full fetch) | |
| Record writes: `events` batches (~100 events) and their notice to the room | ~100 | 100 | 200 | ~10 | ~1,000 (ids, slots, decor) | ~1,000 (a row, its id, its indexes, `last_at`) |
| Shortcut ingests (2 phones, ~24 runs each; ≤ ~260 latest rows read for 32 days) | ~50 | 50 | 100 | ~5 | ~15,000 | ~1,500 |
| The real weather (the :15/:45 tick, runbook §0: a fetch ~30 min after a good one, a `wx` on change, wet days) | 48 ticks, ~48 fetches | 0 | ~96 | ~10 | | ~48 (one storage key) |
| The log (`/log` batches: 50–230 a phone a day measured, now ~one a show; a `req` RPC each `/api`) | ~600 RPCs, ~150 batches | ~150 | ~790 | ~10 | ~2,000 (queries) | ~2,500 |
| 英語すごろく online (an hour's game: ~250 moves, the turn's view on change and every 30 s unchanged) | 1 game | 0 | ~30 | ~250 (awake while turns are played) | ~50 (a hello's or a move's wake) | ~260 (a row a move, a fold each 32) |
| **Total** | | **~720 (0.7 %)** | **~1,770 (1.8 %)** | **~630 (4.8 %)** | **~22,050 (0.4 %)** | **~7,310 (7 %)** |

Duration binds first: under a tenth of it with the island ten times busier; nothing is sent per frame.

### Account-wide
The Free plan's limits are the account's, shared by every Worker (relay, relay-test, gym-bot, its-bot); 5 cron
triggers, 4 used (relay 2, gym-bot 1, its-bot 1). A day:

| Worker | Worker req | DO req | Rows written |
|---|---|---|---|
| relay (the table above) | ~720 | ~1,770 | ~7,310 |
| gym-bot (a check every 15 min: [gym/README](../../gym/README.md#quotas)) | ~110 | ~120 | ~100 |
| its-bot, a runner all day ([its/README](../../its/README.md#quotas)) | ~3,500 | ~6,000 | ~6,500 (+ ~2,900 alarm writes) |

The busiest day measured (GraphQL, every script, before its-bot's watchdog and alarm): 3,618 Worker requests,
15,487 DO requests, 28,900 rows written; with a day of today's its-bot, ~7k, ~21k, ~38k of 100k.
