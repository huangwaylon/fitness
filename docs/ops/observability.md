# Observability: the log, its reader, the alert

What the phones and the relay log, where it goes, how to read it, and what the relay costs against the Free plan
([Request budget](#request-budget)). Why: [decisions](../decisions.md). Code: `app/src/lib/contract/log.ts` (the schema),
`app/src/lib/sync/log.ts` (the phone), `relay/src/log.ts` · `logRoute.ts` · `reqMeta.ts` · `logObject.ts` (the relay),
`relay/scripts/logs.ts` (the reader).

## Pieces
| Piece | Holds | Kept | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, the relay's third SQLite Durable Object, binding `LOG`) | the phones' events (`src c`) and the relay's own (`src r`) | 30 days | `npm run logs` (the signed `/admin` op `logs`) |
| **Workers Logs** (`[observability]`, sampling 1, no invocation logs) | the relay's `console` lines: an error's class, the weather's fetch | 3 days | dashboard → Workers → island-fund-relay → Logs; `npx wrangler tail` |
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
| `build`, `os` | the app's version (`2026-11-05.ef93d8b`), the device in a word (`ios27.1`) |
| `d` | the payload: **only the registry's fields for that event, each of its kind** (a number, a boolean, a closed set, a short token never 16+ letters and digits in a row; `js.error`'s scrubbed `msg` and `stack`), enforced by the relay |

### What we log
Each event's fields, kinds and closed sets are the registry's (`contract/log.ts`); in short:

| Event | Level | Fields | When |
|---|---|---|---|
| `app.open` | info | `nav`, `route`, `pwa`, `w`, `h`, `dpr`, `crashed`, `lt`, `q`/`qAgeS` (the write queue), `coldS` (a fresh load's seconds since the app was last hidden: a background kill when short) | each load |
| `app.ready` | info | `ms` (navigation start → the 3D island loaded), `route` | once a load |
| `app.show` | info | `awayS`, `route` | shown again |
| `app.reload` | info | `why` (update, chunk) | the app reloads itself |
| `perf.frames` | info | `p50`, `p95`, `fps`, `long`, `drawFps`, `hz`, `mode`, `when` | 10 s after ready; again after 10 min away |
| `perf.sheet` | info | `sheet`; ms from the tap to `chunk` (the dialog shown), `content` (ready: 300 ms quiet after the opening), `anim`, `late`; `long`, `slow`, `first`, `kept` | each sheet's first opening a load; a fifth of the rest |
| `perf.boot` | info | ms from navigation to `mount`, `first`, `loaded`, `shown`; the longest frames (`long`, `draw`, `appear`), `steps`, `progs`, the fields' source, `sw`, `warm`, `net`; the steps by what held them (`sLink`/`msLink` programs, `sModels`/`msModels`, `sCards`/`msCards`: how many, their wall ms), `stepMs` their frames' own | once a load, 1 s after the island is whole (world3d/boot.ts) |
| `perf.back` | info | `perf.boot`'s marks from the mount, for the first return from a room | once a load (world3d/boot.ts) |
| `perf.rest` | info | a second at rest: `fps`, `shadows`, `wakes`; `calls`, `tris` a frame, `dpr`, `camZ`, `sm`; `full` (% of frames at the full rate), `why1`-`why3` its top reasons with `w1`-`w3` (% of frames); `pts`, `pm` (the point lights, their mask: `?points=`, `?pointmask=1`) | once a load, after 15 s untouched (world3d/rest.ts) |
| `perf.drag` | info | the first drag's pixel-ratio swaps: `onSet`, `offSet` (ms), `onFrame`, `offFrame` (its first frame's CPU), `cpu` (p50), `sm` | once a load (world3d/drag.ts) |
| `js.error` | error (warn while leaving) | `kind`, `msg`, `stack` (4 frames), `src`, `n` (folded repeats), `leaving`, `route` | `error`, `unhandledrejection` |
| `api.fail` / `api.ok` | warn / info (10 % sampled) | `action`, `err`, `http`, `ms`, `tries`; `r` | a `/api` call |
| `auth.lost` | warn | `from` (refresh, flush, ws), `code` | the key was refused (→ pairing) |
| `sync.fail` | info offline / warn | `err`, `cached` | a refresh failed |
| `queue.retry` / `queue.drop` | warn / error | `type`, `err`, `tries` | the write queue backs off (1st and every 5th) / drops an event |
| `queue.poison` / `queue.split` | error / warn | `type`, `err`, `tries` / `n`, `err` | the write queue sets an event aside (kept: [backend](../backend.md#write-queue)) / halves a batch refused whole |
| `ws.open` / `ws.close` / `ws.park` | info / info / warn | `ms`, `retries`; `code`, `secs`, `welcomed`, `why` (hidden, offline, stale, late/stuck, rekey, stop, closed), `quiet`, `rtt`; `code` | the live socket, every socket's end |
| `ws.unacked` | warn | `kind`, `tries` | a kept intent dropped: its ack never came on a socket that answered, 4 tries (sync/live.ts) |
| `gl.lost` | warn | `where`, `restored` | WebGL context lost / back |
| `chunk.fail` | warn | | a chunk failed to load |
| `storage.fail` | warn | `store`, `kind` | storage refused a write |
| `storage.persist` | info | `ok`, `was`, `useMb`, `quotaMb` | the installed app asked to keep its storage (once, after a sync) |
| `storage.use` | info | `useMb`, `quotaMb`, `persisted` | once a Tokyo day, after a sync (sync/persist.ts) |
| `use` | info | counters `sheet:`, `ev:`, `route:`, `act:`, `swallow:<tag>` (a failure the app went on without: quiet.ts) | summed, one a flush |
| `log.drop` | warn | `n`, `why` (cap, full, day, pending) | the phone's log dropped events |
| `mic.env` / `mic.perm` / `mic.duplex` / `mic.stt` | info | the mic probe's numbers and closed sets ([kikimimi-mic.md](../kikimimi-mic.md) "The probe"). **Never heard text, a device label or a sentence** | 設定's mic test, on its send |
| `req` (relay) | info; warn refused; error `unavailable` | `action`, `st`, `ms`, `inB`, `outB`, `n`, `rej`, `dup`, `why` (the first refusal's rule), ingest's counts, `pg`, `rw`, `rr`, `exc`, `kh` (a refused key's first 4 hex of its SHA-256) | every `/api` request |
| `room.close` / `room.full` | info / warn | `code`, `secs`, `socks`, `rw` (the room's storage rows written since it last said, on `ws.hello` too; kept with its `marks`) | the live room |
| `ws.hello` (relay) | info | `v` (the protocol version), `build` (the app's, from the hello), `rep` (that device's sockets it replaced, the others told nothing); who | each welcomed hello: which phone speaks what (`report`'s *Live hellos*) |
| `store.corrupt` (relay) | warn | `where` (the fold: spend, board, food, tally, shop, decor) | a stored row of the record that isn't a JSON object, skipped by that fold (store.ts `rowRec`), once a request a place |
| `cron.wx` | info; warn failed | `ok`, `fetched`, `fail`, `hours`, `age`, `ms` | a weather fetch (the cron at :15 and :45 when one is due) |
| `cron.backup` | info; warn `no_token`; error failed | `ok`, `st` (ok, no_token, empty, github, epoch, an error's class), `step`, `http`, `kB` (the file), `rawkB` (the dump before gzip), row counts, ms per step, `force` | the record's daily dump ([runbook §6](runbook.md#6-backups)) |
| `cron.compact` | info | `dates`, `deleted`, `more`, `metrics`, `ms` | the record's compaction (off: COMPACT_CRON) |
| `admin` | info | `op`, `st` | each signed admin op (an audit) |
| `log.cap` | warn | `bucket` | a day's cap reached (once) |
| `stt` (relay) | info; warn refused or failed | `ms`, `inB` (the WAV's bytes), `model` (turbo), `ok`, `err` (off, too_large, bad_request, capped, ai) | each keyed `POST /stt` (sttRoute.ts): never the audio or its text |

**Never logged:** keys (or a piece of one), health values, food names, board text, names, e-mails, URLs (their query
or fragment: `#key=`), IP addresses, user agents (only `os`), the record's `detail` / ingest `warnings` text (they
name values). A `js.error` message is scrubbed, in order: a URL → `<url>`, an e-mail → `<email>`, a query or fragment
cut, 16+ letters and digits → `<id>`, quoted text → `"…"` (unless it reads as code: `'e.stats().fps'`), `{…}` /
`[…]`, non-ASCII → `…`, numbers → `#`, 120 characters; a stack is its top four frames as `fn@file:line:col` (the
file's base name). Residual risk: unquoted ASCII words in a thrown message (the app's own have none). The tests:
`contract/log.test.ts` (canaries in every field), `relay/test/log.test.ts` ("privacy": none of a key, a weight, a
food's name, a note in any stored row), `sync/log.test.ts`, `e2e/log.spec.ts` (`E2E_TEST_RELAY=1`: read back with
`npm run logs -- --test --sid …`).

**Who reads it:** only the signed `/admin` ops (`logs`, `logstats`, `logpurge`), whose secret derives from both member
keys: the operator. No phone reads the log, the guest's events included. `/health/log` gives counts only, with its
own token. Retention 30 days; `npm run logs -- purge --before … [--person A]` deletes sooner.

## The phone (`sync/log.ts`)
- `log()` only pushes onto a bounded ring (no I/O, never in the render loop; the frames sample is its own 5 s of rAF
  once a load), which keeps the trail before each error; per-session and per-day caps, what's dropped counted
  (`log.drop`). The ring's size, the caps, the persisting and the flush timings: `sync/log.ts`'s header.
- Persisted to `localStorage` (`island.log`) when idle and at once when the page goes; read back on the next load. On
  a quota error the log goes first, never the app's data.
- Flushed in batches (`keepalive` when hidden), each stored until the relay acks its id (a re-sent one is a `dup`); a
  capped day (`closed`): errors only until midnight UTC.
- Off in the demo and under automation (`navigator.webdriver`, unless `?log=on`). Unpaired, events wait for a key;
  pairing as someone else clears them.
- `/api` requests carry `rid` (per request) and `sid` (per load) in the body; the relay logs them on `req` and echoes
  `X-Request-Id`.

## The relay
- `POST /log` (the Worker, `logRoute.ts`): origin, size (64 KB), **the key checked before any request to the object**
  (a stranger's flood never spends Durable Object requests), and a role whose day is capped is answered by the Worker
  until midnight; then the text to `IslandLog.ingest`. `LOG_OFF=1` (a var): acked, nothing kept.
- `/api`: the Worker times the record's answer (`storeRoute.ts`: the round trip to the object, its queue and its
  work); the record returns a small `meta` (`reqMeta.ts`) and the Worker sends a `req` event by RPC in
  `ctx.waitUntil`, never in the reply's path.
- The room (`room.close`, `room.full`, `ws.hello`), the cron (`cron.wx`, `cron.compact`, `cron.backup`) and the admin
  ops (`admin`) send theirs the same way, best effort.
- **Caps** (UTC day, `LOG_CAPS`: per role and the relay, 8,000 in all, the hard guard on the account's rows written;
  counted in memory, written within `CAPS_SAVE_MS`): over a cap, dropped, `log.cap` once. The tables and the
  retention: `relay/src/log.ts`'s header.
- `POST /stt` (`sttRoute.ts`, its caps and off switch: [kikimimi-mic.md](../kikimimi-mic.md) "The relay endpoint"):
  nothing of the audio or its text kept.
- **Tables:** `log` (primary key `id`, no other index), `batches`, `caps`.
- **Retention:** the object's daily alarm: events older than 30 days, batch ids and caps older than 2 days.

## Reading
From `relay/`; the keys from `KEY_A`/`KEY_B`, `KEYS_FILE`, else `~/.config/island-fund/keys` (production) or
`.smoke-keys` (`--test`). Times are `90m`, `2h`, `7d`, an ISO time, or ms; printed in Tokyo time.
```sh
npm run logs -- --since 2h --level warn                    # newest last; --limit 200 (≤ 1000)
npm run logs -- --since 1d --event js.error --person A     # an event, or a prefix: --event api. / --event js.*
npm run logs -- --rid 0ny9a14zf0                           # one request, the phone's side and the relay's
npm run logs -- --sid ra3im9x4q5                           # one app session, start to end
npm run logs -- --src relay --event req --since 6h --json  # raw rows
npm run logs -- report --since 7d                          # errors by fingerprint, /api p50/p95 by action, refusals by rule,
                                                           # the phones' view, sync, socket closes, load and frames, builds, usage
npm run logs -- stats                                      # the alert's numbers
npm run logs -- --test ...                                 # the test relay
```

### Investigating (a checklist)
1. `npm run logs -- stats`: errors in the last 1 h / 6 h, `unavailable` answers, caps, the oldest event, today's (UTC)
   rows written by object (`rowsLog`, `rowsStore`, `rowsRoom`: how each is counted, `relay/src/log.ts`'s header) and
   `rowsPct` of the Free plan's 100k (the alert warns past 50 %; `report` prints the record's by action).
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
`health.yml` (every 6 hours and on demand) reads `/health/log` with the `HEALTH_TOKEN` secret (a Worker secret and a
repo secret: counts only) and opens one GitHub issue labelled `alert` (or comments on the open one when the state
changes) when, in the last 6 hours, errors > 20 (not counting errors while leaving), the relay answered `unavailable`
> 5 times, a cap was reached, the day's events passed 50 % of the cap, the day's rows written passed 50 % of the Free
plan's 100k (`rowsPct`), the oldest event is older than 32 days (the prune is dead), or no record backup has been
good in 48 h (`backupH`, `backupSt`: the last run's `st`); it closes the issue on a green run. The issue holds counts
and a link here, never a message. A failing `/health` still fails the job (GitHub's e-mail).
Set up once: `openssl rand -hex 32` → `npx wrangler secret put HEALTH_TOKEN` (and `--env test`) and
`gh secret set HEALTH_TOKEN`.

## Costs
### The log (Free plan)
| | Free limit | The log adds (typical / worst) |
|---|---|---|
| Worker requests | 100k/day | ~100 `/log` / ~1k |
| DO requests | 100k/day | ~1,100 (a `req` RPC each `/api`, the `/log` batches, room closes) / ~9k |
| Rows written (an index row counts; a delete counts) | 100k/day | ~4k (an insert, a cap row a write; the prune 30 days later) / ~20k |
| Rows read | 5M/day | queries only: a day's report ~2k, 30 days ~60k |
| Storage | 5 GB | ~250 B an event: ~0.5 MB a day, ~15 MB for 30 days |
| Worker CPU | 10 ms/request | `/log`: one JSON.parse of ≤ 64 KB for the key; `/api`: one more RPC in the background |
| Workers Logs | 200k/day, 3 days | a few hundred lines |
| Workers AI (`/stt`) | 10k neurons/day | whisper-large-v3-turbo, ~47 neurons an audio minute: the probe a few; the cap (300 × ≤ 10 s a person) ~2.3k |
| The phone | — | `log()` ~µs; a flush: one JSON.stringify of ≤ 32 KB and one fetch; a persist ≤ 24 KB, debounced |

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
| The log (above) | ~600 RPCs, ~60 batches | ~60 | ~700 | ~10 | ~2,000 (queries) | ~2,500 |
| **Total** | | **~630 (0.6 %)** | **~1,650 (1.7 %)** | **~380 (2.9 %)** | **~22,000 (0.4 %)** | **~7,050 (7 %)** |

Duration is the binding limit and stays under a tenth of it with the island ten times busier; nothing is sent per
frame. Compaction, were it on, adds ~8,000 rows written on a Wednesday.
