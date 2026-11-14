# Observability: the log, its reader, the alert

What the phones and the relay log, where it goes, how to read it, and what the relay costs against the Free plan
([Request budget](#request-budget)). Why: [decisions](../decisions.md). Code: `app/src/lib/contract/log.ts` (the schema),
`app/src/lib/sync/log.ts` (the phone), `relay/src/log.ts` · `logRoute.ts` · `reqMeta.ts` · `logObject.ts` (the relay),
`relay/scripts/logs.ts` (the reader).

## Pieces
| Piece | Holds | Kept | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, the relay's third SQLite Durable Object, binding `LOG`) | the phones' events (`src c`) and the relay's own (`src r`) | 30 days | `npm run logs` (the signed `/admin` op `logs`) |
| **Workers Logs** (`[observability]`, sampling 1, no invocation logs) | the relay's `console` lines: failures by class (the ok paths say nothing: the log has them) | 3 days | dashboard → Workers → island-fund-relay → Logs; `npx wrangler tail` |
| **`/health/log`** (with `HEALTH_TOKEN`) | the log's counts (errors in 1 h / 6 h, warnings, `unavailable` answers, caps, oldest) | — | `.github/workflows/health.yml` (opens an issue on a spike) |

Not used: Logpush (paid); Workers Analytics Engine (its SQL API needs an account token everywhere); the record's own
SQLite (a restore would roll back the incident's logs); Workers Logs' invocation logs (each request's IP and headers).

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
Each event's fields, kinds and closed sets are the registry's (`contract/log.ts`); in short:

| Event | Level | Fields | When |
|---|---|---|---|
| `app.open` | info | `nav`, `route`, `pwa`, `w`, `h`, `dpr`, `lt`, `q`/`qAgeS` (the write queue), `coldS` (a fresh load's seconds since the app was last hidden: a background kill, or a swipe closed, when short), `vis` (the page hidden or shown as it loaded), `hr`/`hrS` (the load is the app's own reload at a hide, a deploy taken out of sight, that many s after it) | each load |
| `app.ready` | info | `ms` (navigation start → the 3D island loaded), `route` | once a load |
| `app.show` | info | `awayS`, `route` | shown again |
| `app.reload` | info | `why` (update: a deploy taken as the app hid; launch: older builds only; chunk; stale: a build this one can't work with, version.json `compat`; mic; other) | the app reloads itself |
| `perf.frames` | info | `p50`, `p95`, `fps`, `long`, `drawFps`, `hz`, `mode`, `when` | 10 s after ready; again after 10 min away |
| `perf.sheet` | info | `sheet`; ms from the tap to `chunk` (the dialog shown), `content` (300 ms quiet after opening), `anim`, `late`; `long`, `slow`, `first`, `kept` | each sheet's first opening a load; a fifth of the rest |
| `perf.boot` | info | the launch's marks (`mount` → `shown`, `data`), its longest frames and steps by what held them, `fields`, `sw`, `warm`, `net`, `shell` (`net` a deploy's page from the network, `same` the cache confirmed by the race, `skip` the cache with no race, `cache` the network late or offline), `raceMs` (the race's ms: its cost; `ask`/`held`: older builds) (world3d/boot.ts BootReport; the registry has them all) | once a load, 1 s after the island is whole (world3d/boot.ts) |
| `perf.back` | info | `perf.boot`'s marks (but `draw`) for the first return from a room | once a load (world3d/boot.ts) |
| `perf.rest` | info | the rest since the last show (every second 2 s+ untouched): `s`, `fps`, `wakes`, `calls`, `tris`, `full` (% of frames at the full rate) and its top reasons (`why1`-`why3`), `pts`/`pm` (point lights, their mask: on unless `?pointmask=0`) | at each hide, or the island going, with 3 s+ of rest (world3d/rest.ts) |
| `js.error` | error (warn while leaving) | `kind`, `msg`, `stack` (4 frames), `src` (`file:line`, or the catcher's tag: `live`, `world`, `synced.<store>`, `bus.<event>`, `snapshot`), `n` (folded repeats), `leaving`, `route`, `sheet` | `error`, `unhandledrejection`, a caught bug (quiet.ts); ≤ 5 a message a session; an import cut off by leaving or by a `chunk.fail`: `swallow:import.*` |
| `api.fail` / `api.ok` | warn / info (10 % sampled) | `action`, `err`, `http`, `ms`, `tries`, `sheet` (fail); `r` | a `/api` call |
| `keyed.fail` | info unreached / warn | `ep` (stt, gym, other), `why` (refused, failed, unreached, timeout), `http`, `n` (its repeats folded), `sheet` | a members-only call failed (keyed.ts), once an incident |
| `its.fail` | info offline, rate_limited, not_subscribed / warn | `op` (status, settings, run, push_subscribe, push_unsubscribe, push_test), `err` (the its-bot Worker's error code, or offline, timeout, json, no_key), `rid`, `http`, `ms` | a ボット → 保養所 call failed (lib/its/client.ts) |
| `gym.fail` | info offline or an expected refusal / warn | `op` (status, act), `err` (the gym bot's code: stale, cooldown, …; or offline, timeout, http, json, no_key), `rid` (`act` only: a public /status takes no header of ours), `http`, `ms` | a read of /status (lib/gym/status.ts) or a POST /gym/act (lib/gym/config.ts) failed; /gym/config is `keyed.fail` `gym` |
| `kalori.fail` | info offline / warn | `op` (status), `err` (offline, http, json), `http`, `ms` | a read of ボット's メニュー status.json (raw.githubusercontent.com, lib/kalori/status.ts) failed |
| `its.push` | warn | `step` (permission, ready, subscribe, unsubscribe), `err` (the error's name) | 保養所's 通知 failed in the browser (lib/its/push.ts; never the endpoint) |
| `auth.lost` | warn | `from` (refresh, flush, ws), `code` | the key was refused (→ pairing) |
| `sync.fail` | info offline / warn | `err`, `cached`, `sheet` | a refresh failed (what threw: a `js.error` from `snapshot`) |
| `queue.retry` / `queue.drop` | warn / error | `type`, `err`, `tries` | the write queue backs off (1st and every 5th) / drops an event |
| `queue.poison` / `queue.split` | error / warn | `type`, `err`, `tries` / `n`, `err` | the write queue sets an event aside (kept: [backend](../backend.md#write-queue)) / halves a batch refused whole |
| `ws.open` / `ws.close` / `ws.park` | info / info / warn | `ms`, `retries`; `code`, `secs`, `welcomed`, `why` (hidden, offline, stale, late/stuck, rekey, stop, closed), `quiet`, `rtt`, and once welcomed `v` (its hello's protocol: which phone speaks what), `openMs`, `retries`; `code` | a welcome after failed tries (a first try's says it on its close), every socket's end |
| `ws.unacked` | warn | `kind`, `tries` | a kept intent dropped: its ack never came on a socket that answered, 4 tries (sync/live.ts) |
| `gl.lost` | warn | `where` (island, tent, shop, museum, map), `restored`, `sheet` | WebGL context lost / back |
| `chunk.fail` | warn | `file` (the chunk's base name: Chrome's error names it, Safari's doesn't), `n` (its repeats folded), `sheet` | a chunk failed to load, once an incident (not while the page is leaving: pagehide, the app's own reload) |
| `storage.fail` | warn | `store`, `kind` | storage refused a write |
| `storage.persist` | info | `ok`, `was`, `useMb`, `quotaMb` | the installed app asked to keep its storage (once, after a sync) |
| `storage.use` | info | `useMb`, `quotaMb`, `persisted`; each cache's MB (`shell`, `room`, `listen`, `art`, `photos`, `tiles`, `foodImg`, `food`, `fonts`, `audio`, `other`) and `stt` (the recogniser kept: sync/cacheSizes.ts) | once a Tokyo day, after a sync (sync/persist.ts) |
| `use` | info | counters `sheet:<id>` (a stable id: the sheet's `timed` or `name`, never its title), `route:`, `act:`, `swallow:<tag>` (a failure the app went on without: quiet.ts; e.g. `model.load`, `map.error`, `kiki.chunk`, `food.load` / `food.gaveup`) | summed, one a flush |
| `log.drop` | warn | `n` (events), `why` (cap, full, day, pending) | the phone's log dropped events |
| `mic.env` / `mic.perm` / `mic.duplex` / `mic.stt` | info | the mic probe's numbers and closed sets ([kikimimi-mic.md](../kikimimi-mic.md) "The probe"). **Never heard text, a device label or a sentence** | 設定's mic test, on its send |
| `req` (relay) | info; warn refused; error `unavailable` | `action`, `st`, `ms`, `inB`, `outB`, `n`, `rej`, `dup`, `why` (the first refusal's rule), ingest's counts, `pg`, `rw`, `rr`, `exc`, `kh` (a refused key's first 4 hex of its SHA-256; its `action`, `rid`, `sid` read from the body: which caller) | every `/api` request |
| `room.close` / `room.full` | info / warn | `code` (`CLOSE.replaced`: a hello replaced the device's old socket), `secs`, `socks`, `rw` (the room's storage rows written since it last said; kept with its `marks`) | the live room |
| `do.error` (relay) | error | `where` (ws.message, backup, compact), `name` (the class), `msg` | a Durable Object call that threw, caught |
| `store.corrupt` (relay) | warn | `where` (the fold: spend, board, food, tally, shop, decor, pack) | a stored row of the record that isn't a JSON object, skipped by that fold (store.ts `rowRec`), once a request a place |
| `cron.wx` | info; warn failed | `ok`, `fetched`, `fail`, `hours`, `age`, `fails` (since the last good one), `ms` | a failed weather fetch; the weather's health once a Tokyo day (00:15) |
| `cron.backup` | info; warn `no_token`; error failed | `ok`, `st` (ok, no_token, empty, github, epoch, an error's class), `step`, `http`, `kB` (the file), `rawkB` (the dump before gzip), row counts, ms per step, `force` | the record's daily dump ([runbook §6](runbook.md#6-backups)) |
| `cron.compact` | info | `dates`, `deleted`, `more`, `metrics`, `ms` | the record's compaction (off: COMPACT_CRON) |
| `admin` | info; warn refused | `op`, `st` | each signed admin op that changes or exports (an audit); a read (`logs`, `logstats`, `counts`, `held`, a check without `fix`) only when it fails |
| `log.cap` | warn | `bucket` | a day's cap reached (once) |
| `stt` (relay) | info; warn refused or failed | `ms`, `inB` (the WAV's bytes), `model` (turbo), `ok`, `err` (off, too_large, bad_request, capped, ai) | each keyed `POST /stt` (sttRoute.ts): never the audio or its text |

### Naming and levels
- Names are `area.verb` / `area.noun` (app, perf, api, sync, queue, ws, gl, chunk, storage, mic, log, cron, room, admin,
  …); `use`, `req`, `admin`, `stt` stay bare (a live name is never renamed: the history reads it).
- error: the app lost something or a bug threw; warn: degraded but recovered, or a refusal; info: lifecycle and
  samples; debug: polls (ITS's 15 s status).
- An ok path logs only sampled (`api.ok`) or as a daily summary (`cron.wx`); a routine failure is a `swallow:` counter,
  one that needs fields an event. The registry (`contract/log.ts`) and this table are checked against each other
  (`contract/log.test.ts`).

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
  per-session and per-day caps, drops counted (`log.drop`). Sizes, caps and timings: `sync/log.ts`'s header.
- Persisted to `localStorage` (`island.log`) when idle and when the page goes; on a quota error the log goes first,
  never the app's data.
- Flushed in batches, each kept until the relay acks its id; when hidden, every unacked batch at once with `keepalive`
  (≤ 60 KB). Past three unacked, the newest takes more of the ring, else the ring waits. A capped day (the relay's):
  errors only until midnight UTC.
- An error event (`js.error`, `chunk.fail`, `gl.lost`, `api.fail`, `sync.fail`) carries `sheet`, the topmost open timed
  sheet (Sheet.svelte's `timed`), and `js.error` the route.
- Off in the demo and under automation (`navigator.webdriver`, unless `?log=on`). Unpaired, events wait for a key;
  pairing as someone else clears them.
- `/api` requests carry `rid` (per request) and `sid` (per load) in the body; the relay logs them on `req` and echoes
  `X-Request-Id`.

## The relay
- `POST /log` (`logRoute.ts`): origin, size, **the key checked before any request to the object** (a stranger's flood
  spends no Durable Object requests), a capped role answered by the Worker until midnight; then `IslandLog.ingest`.
  `LOG_OFF=1` (a var): acked, nothing kept.
- `/api`: the Worker times the record's answer (`storeRoute.ts`); the record returns a small `meta` (`reqMeta.ts`) and
  the Worker sends a `req` event by RPC in `ctx.waitUntil`, off the reply's path. The room, the cron and the admin ops
  send theirs the same way, best effort.
- **Caps** (UTC day, `LOG_CAPS`: 8,000 in all, the hard guard on the account's rows written): over a cap, dropped,
  `log.cap` once. Tables (`log`, keyed by `id`, no other index; `batches`; `caps`) and retention (events 30 days, batch
  ids and caps 2): `relay/src/log.ts`'s header.
- `POST /stt` ([kikimimi-mic.md](../kikimimi-mic.md) "The relay endpoint"): nothing of the audio or its text kept.

## Reading
From `relay/`; the keys from `KEY_A`/`KEY_B`, `KEYS_FILE`, else `~/.config/island-fund/keys` (production) or
`.smoke-keys` (`--test`). Times are `90m`, `2h`, `7d`, an ISO time, or ms; printed in Tokyo time.
```sh
npm run logs -- --since 2h --level warn                    # newest last; --limit 200 (≤ 1000)
npm run logs -- --since 1d --event js.error --person A     # an event, or a prefix: --event api. / --event js.*
npm run logs -- --rid 0ny9a14zf0                           # one request, the phone's side and the relay's
npm run logs -- --sid ra3im9x4q5                           # one app session, start to end
npm run logs -- --src relay --event req --since 6h --json  # raw rows
npm run logs -- report --since 7d                          # errors by fingerprint, warnings by event, /api p50/p95 by action,
                                                           # refusals, the phones' view, sync, socket closes, load and frames
                                                           # (phones only), the newest 10 builds, live protocol, usage
npm run logs -- report --os ios                            # the phones only (--os: a prefix of `os`); --help: all options
npm run logs -- stats                                      # the alert's numbers
npm run logs -- --test ...                                 # the test relay
```

**Did a deploy taken at a hide reload out of sight?** `npm run logs -- --since 3d --event app.open --json`: a load with
`hr: true` and `vis: "hidden"` ran while the app was away; `vis: "visible"` with a long `hrS` ran only as the player came
back (iOS froze it), the same as a reload under the player. **The launch race's cost:** `--event perf.boot`, `raceMs`
by `shell` (`same` and `net` paid it, `skip` and `cache` didn't), and `first`/`shown` against the weeks before.


### Investigating (a checklist)
1. `npm run logs -- stats`: errors in 1 h / 6 h, `unavailable` answers, caps, the oldest event, today's (UTC) rows
   written per object (`rowsLog`, `rowsStore`, `rowsRoom`) and `rowsPct` of the Free plan's 100k.
2. `npm run logs -- report --since 1d`: what fails, for whom, since which build.
3. `npm run logs -- --since 6h --level warn`, then `--sid` of a session in trouble (its whole story) and `--rid` of a
   failed request (the relay's `req`: its status, rule, time).
4. The relay live: `npx wrangler tail`; the dashboard's Workers Logs (3 days).
5. The Free plan's use: dashboard → Workers & Pages → the relay's Metrics (requests), Durable Objects (rows
   written/read against 100k / 5M a day).
6. Off switch: `LOG_OFF = "1"` in `wrangler.toml` `[vars]` and deploy (`STT_OFF = "1"` for `/stt`).
   The mic probe's results: `npm run logs -- --event mic. --since 1d --json` and `--event stt`.
7. Close the alert's issue with the cause.

## The alert
`health.yml` (an hourly cron, which GitHub runs best effort: often ~4 a day; and on demand) reads `/health/log` with the `HEALTH_TOKEN` secret and opens one issue
labelled `alert` (or comments on the open one when its reasons change, not their counts) when, in the last 6 hours, errors > 20 (not
counting errors while leaving), `unavailable` > 5, a cap was reached, the day's events passed 50 % of the cap, the
day's rows written passed 50 % of the Free plan's (`rowsPct`), the oldest event is over 32 days (the prune is dead), or
no record backup has been good in 48 h; a green run closes it. The issue holds counts, never a message. A failing
`/health` fails the job.
Set up once: `openssl rand -hex 32` → `npx wrangler secret put HEALTH_TOKEN` (and `--env test`) and
`gh secret set HEALTH_TOKEN`.

## ITS investigating
The ITS booker's record, logs, alert reasons and what to do are its own: [its/README.md](../../its/README.md)
"Investigating" (one run's timeline: `npm run its:logs -- <run>` in `its/worker/`; Gmail is the ground truth).

## Costs
### The log (Free plan)
Its requests and rows are the Request budget's "The log" row. Besides: storage ~250 B an event (~15 MB for 30 days);
Worker CPU one JSON.parse of ≤ 64 KB a `/log`; Workers Logs a few hundred lines of 200k a day; Workers AI (`/stt`)
~47 neurons an audio minute of 10k a day (the cap ~2.3k); on the phone, `log()` ~µs and a flush one stringify of
≤ 32 KB and one fetch.

### Request budget
The whole relay against the Free plan's daily limits: Workers 100,000 requests; Durable Objects 100,000 requests (a
WebSocket connect is one, incoming messages count 20:1, outgoing are free), 13,000 GB-s of duration (an idle
hibernatable object isn't billed), 5 M rows read, 100,000 rows written, 5 GB storage. A generous day for two phones and
the guest:

| Source | Count/day | Worker req | DO req | DO GB-s | Rows read | Rows written |
|---|---|---|---|---|---|---|
| Sockets (each show of the app) | 2 × 60 | 120 | 120 | ~150 (10 s awake each, 128 MB) | | |
| Liveness (a quiet socket's 20 s heartbeat, answered without waking the room; a 5-min clock ping) | 720 | 0 | ≤ 36 | ~60 | | |
| Intents kept for the day (the room's ring), nudges | ~2,000 | 0 | 100 | ~100 | | ~2,000 |
| Record reads: snapshots (~5 rows each; a full one the whole record) | ~300 | 300 | 300 | ~30 | ~3,000 (+ the record per full fetch) | |
| Record writes: `events` batches (~100 events) and their notice to the room | ~100 | 100 | 200 | ~10 | ~1,000 (ids, slots, decor) | ~1,000 (a row, its id, its indexes, `last_at`) |
| Shortcut ingests (2 phones, ~24 runs each; ≤ ~260 latest rows read for 32 days) | ~50 | 50 | 100 | ~5 | ~15,000 | ~1,500 |
| The real weather (the cron's room tick at :15 and :45, a fetch ~30 min after a good one, a `wx` on change) | 48 ticks, ~48 fetches | 0 | 48 | ~10 | | ~48 (one storage key) |
| The log (`/log` batches, a `req` RPC each `/api`, room closes) | ~600 RPCs, ~60 batches | ~60 | ~700 | ~10 | ~2,000 (queries) | ~2,500 |
| **Total** | | **~630 (0.6 %)** | **~1,650 (1.7 %)** | **~380 (2.9 %)** | **~22,000 (0.4 %)** | **~7,050 (7 %)** |

Duration is the binding limit and stays under a tenth of it with the island ten times busier; nothing is sent per
frame. Compaction, were it on, adds ~8,000 rows written on a Wednesday.
