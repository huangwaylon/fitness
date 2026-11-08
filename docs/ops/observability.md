# Observability: the log, its reader, the alert

What the phones and the relay log, where it goes, how to read it, what it costs. The decisions and why:
[decisions](../decisions.md#logging-and-observability-2026-11-05). Code: `app/src/lib/contract/log.ts` (the schema),
`app/src/lib/sync/log.ts` (the phone), `relay/src/log.ts` · `logRoute.ts` · `reqMeta.ts` · `logObject.ts` (the relay),
`relay/scripts/logs.ts` (the reader).

## Pieces
| Piece | Holds | Kept | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, the relay's third SQLite Durable Object, binding `LOG`) | the phones' events (`src c`) and the relay's own (`src r`) | 30 days | `npm run logs` (the signed `/admin` op `logs`) |
| **Workers Logs** (`[observability]`, sampling 1, no invocation logs) | the relay's `console` lines: an error's class, the weather's fetch | 3 days | dashboard → Workers → island-fund-relay → Logs; `npx wrangler tail` |
| **`/health/log`** (with `HEALTH_TOKEN`) | the log's counts (errors in 1 h / 6 h, warnings, `unavailable` answers, caps, oldest) | — | `.github/workflows/health.yml` (opens an issue on a spike) |

Not used: Logpush (paid); Workers Analytics Engine (free, 3 months, but its SQL API needs an account API token on
every reader and in CI, and the log's few thousand events a day don't need it); the record's own SQLite (a restore
of the record would roll back the logs of the very incident, and the dump would carry them); Workers Logs' invocation
logs (each request's IP, headers and place).

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
| `d` | the payload: **only the registry's fields for that event, each of its kind** (a number within ±1e7, rounded to 0.1; a boolean; a value from a closed set; a token: ≤ 40 of `[A-Za-z0-9_.:/-]`, never 16+ letters and digits in a row; `js.error`'s scrubbed `msg` and `stack`). Enforced by the relay whatever a phone sends. |

### What we log
| Event | Level | Fields | When |
|---|---|---|---|
| `app.open` | info | `nav`, `route`, `pwa`, `w`, `h`, `dpr`, `crashed` (the last load died while shown), `lt` (long-frame API there), `q`/`qAgeS` (the write queue) | each load |
| `app.ready` | info | `ms` (navigation start → the 3D island loaded), `route` | once a load |
| `app.show` | info | `awayS`, `route` | shown again |
| `app.reload` | info | `why` (update, chunk) | the app reloads itself |
| `perf.frames` | info | `p50`, `p95` (ms), `fps`, `long` (> 50 ms), `drawFps` (the island's own), `hz`, `mode`, `when` | 10 s after ready (5 s of rAF); again after 10 min away |
| `perf.sheet` | info | `sheet` (food, health, travel, wedding, hiking, kikimimi, panel, zukan, settings), ms from the tap: `chunk` (its code in, the dialog shown), `content` (the last change inside it), `anim` (the open animation's end); `long` (the longest frame), `slow` (frames over 33 ms), `first` (its first opening this load), `kept` (shown again from a kept mount) | each sheet's first opening a load; a fifth of the rest |
| `perf.boot` | info | ms since the navigation's start: `mount` (the island's, after the ground's fields), `first` (its first frame), `loaded` (the models in), `shown` (the island whole: nothing held back); frame lengths (ms): `long` (the longest display frame, first frame to 1 s after shown), `draw` (the engine's longest), `appear` (the engine's longest from loaded to shown), `steps` (frames from loaded to shown); `progs`, `fieldsMs` and `fields` (cache, worker, main), `sw` (ctl, none, no: the service worker at launch), `warm` (every model from a cache), `net` (models over the network) | once a load, 1 s after the island is whole; none if the page was hidden meanwhile (world3d/boot.ts) |
| `js.error` | error (warn while leaving) | `kind`, `msg`, `stack` (4 frames), `src`, `n` (folded repeats), `leaving`, `route` | `error`, `unhandledrejection` |
| `api.fail` / `api.ok` | warn / info (10 % sampled) | `action`, `err`, `http`, `ms`, `tries`; `r` | a `/api` call |
| `auth.lost` | warn | `from` (refresh, flush, ws), `code` | the key was refused (→ pairing) |
| `sync.fail` | info offline / warn | `err`, `cached` | a refresh failed |
| `queue.retry` / `queue.drop` | warn / error | `type`, `err`, `tries` | the write queue backs off (1st and every 5th) / drops an event |
| `ws.open` / `ws.close` / `ws.park` | info / info / warn | `ms`, `retries`; `code`, `secs`, `welcomed`, `why`, `quiet`, `rtt`; `code` | the live socket. `ws.close` for every socket's end (2026-11-07; before, only the relay's or the network's and 4000 / 4010): `why` `hidden`, `offline`, `stale` (4000: no answer to a probe), `late` / `stuck` (4010: no welcome in time), `rekey`, `stop` (the phone's own, 1000) or `closed` (the relay or the network); `quiet` s since it last heard anything; `rtt` its shortest ping round trip (ms) |
| `ws.unacked` | warn | `kind`, `tries` | a kept intent dropped: its ack never came on a socket that answered, 4 tries (sync/live.ts) |
| `gl.lost` | warn | `where`, `restored` | WebGL context lost / back |
| `chunk.fail` | warn | | a chunk failed to load |
| `storage.fail` | warn | `store`, `kind` | storage refused a write |
| `storage.persist` | info | `ok`, `was`, `useMb`, `quotaMb` | the installed app asked to keep its storage (once, after a sync) |
| `use` | info | counters `sheet:<i18n key>`, `ev:<event type>`, `route:<route>` | summed, one a flush |
| `log.drop` | warn | `n`, `why` (cap, full, day, pending) | the phone's log dropped events |
| `mic.env` / `mic.perm` / `mic.duplex` / `mic.stt` | info | the mic probe's numbers and closed sets (docs/kikimimi-mic.md §1.1): the page's capabilities; the permission (`st`, `ms`, `again`, `asked`, `ec`, `sr`, `inp`); per earphone route the bleed (dB), round trip (ms), loudness and restore; per recogniser and step its `ms`, `mb`, `audS`, `wer` (%, computed on the phone), `ok`, `err`. **Never heard text, a device label or a sentence** | せってい's 「マイク診断（テスト）」, on 「結果を送信」 |
| `req` (relay) | info; warn refused; error `unavailable` | `action`, `st` (ok or the error code), `ms` (the Worker's wall time), `inB`, `outB`, `n`, `rej`, `dup`, `why` (the first refusal's rule: `buy.pocket_short`, `spend_void.no_such_spend`, `ingest.parse`), ingest's `m` (added), `sk` (skipped), `w` (warnings: a count); a snapshot's `pg` (its page size; 0: unpaged, an app from before paging); `exc` (a thrown class) | every `/api` request: the Shortcut's ingests, rate-limit hits (`busy`), validation refusals |
| `room.close` / `room.full` | info / warn | `code`, `secs`, `socks` | the live room |
| `ws.hello` (relay) | info | `v` (the protocol version), `build` (the app's, from the hello; none before 2026-11-05), `rep` (2026-11-07: that person's sockets it replaced, the others told nothing); who | each welcomed hello: which phone speaks what (`report`'s *Live hellos*) |
| `store.corrupt` (relay) | warn | `where` (the fold: spend, board, food, tally, shop, decor) | a stored row of the record that isn't a JSON object, skipped by that fold (store.ts `rowRec`), once a request a place |
| `cron.wx` | info; warn failed | `ok`, `fetched`, `fail`, `hours`, `age`, `ms` | a weather fetch (the cron at :15, :45) |
| `cron.compact` | info | `dates`, `deleted`, `more`, `metrics`, `ms` | the record's compaction (the cron at 04:15 Tokyo when COMPACT_CRON=1, on hold; `more`: a backlog left for the next day; a failure is `do.error` `where: compact`) |
| `admin` | info | `op`, `st` | each signed admin op (an audit) |
| `log.cap` | warn | `bucket` | a day's cap reached (once) |
| `stt` (relay) | info; warn refused or failed | `ms`, `inB` (the WAV's bytes), `model` (turbo), `ok`, `err` (off, too_large, bad_request, capped, ai) | each keyed `POST /stt` (sttRoute.ts): never the audio or its text |

**Never logged:** keys (or a piece of one), health values, food names, board text, names, e-mails, URLs (their query
or fragment: `#key=`), IP addresses, user agents (only `os`), the record's `detail` / ingest `warnings` text (they
name values). A `js.error` message is scrubbed, in order: a URL → `<url>`, an e-mail → `<email>`, a query or fragment
cut, 16+ letters and digits → `<id>`, quoted text → `"…"` (unless it reads as code: `'e.stats().fps'`), `{…}` /
`[…]`, non-ASCII → `…`, numbers → `#`, 120 characters; a stack is its top four frames as `fn@file:line:col` (the
file's base name). Residual risk: unquoted ASCII words in a thrown message (the app's own messages have none). The
tests: `contract/log.test.ts` (the scrubbers, every field of every event filled with canaries), `relay/test/log.test.ts`
("privacy": every event, every field and failing `/api` requests carrying a key, weights, a food's name, a board note,
`#key=`: none of it in any stored row), `sync/log.test.ts` (the key only in the batch's `key` field), and
`e2e/log.spec.ts` (a forced error on a paired phone reaches the relay's real code, scrubbed; with
`E2E_TEST_RELAY=1` it goes to the test relay and is read back with `npm run logs -- --test --sid …`).

**Who reads it:** only the signed `/admin` ops (`logs`, `logstats`, `logpurge`), whose secret derives from both member
keys: the operator. No phone reads the log, the guest's events included. `/health/log` gives counts only, with its
own token. Retention 30 days; `npm run logs -- purge --before … [--person A]` deletes sooner.

## The phone (`sync/log.ts`)
- `log()` only pushes onto a ring: no I/O, no JSON beyond the payload's check, never in the render loop (the frames
  sample is its own rAF loop of 5 s, once a load). The ring: 300 events, evicting the oldest of the lowest level
  first (debug, info, warn), keeping the 15 before each error; caps: 600 a session (50 errors; a repeated message
  folds into `n`), 1,500 a day on the phone; dropped ones counted (`log.drop`).
- Persisted to `localStorage` (`island.log`, ≤ 24 KB: errors and warnings first, then the newest 100) 2 s after a
  change and at once when hidden, on `pagehide` and before the app reloads itself; read back on the next load (its
  events go as a batch of their own session). On a quota error the log's key goes first, never the user's data.
- Flushed 30 s after the first event (5 s after an error), at 50 events, and when hidden (`fetch` with `keepalive`,
  one batch ≤ 32 KB in flight). A batch stays stored until the relay acks its id; a re-sent one is a `dup`. Failure:
  backoff 5 s → 5 min; offline: until `online`. A capped day (`closed`): errors only until midnight UTC.
- Off in the demo and under automation (`navigator.webdriver`, unless `?log=on`). Unpaired, events wait for a key;
  pairing as someone else clears them.
- `/api` requests carry `rid` (per request) and `sid` (per load) in the body; the relay logs them on `req` and echoes
  `X-Request-Id`.

## The relay
- `POST /log` (the Worker, `logRoute.ts`): origin, size (64 KB), **the key checked before any request to the object**
  (a stranger's flood never spends Durable Object requests), and a role whose day is capped is answered by the Worker
  until midnight; then the text to `IslandLog.ingest` (parsing on the object's budget). `LOG_OFF=1` (a var): acked,
  nothing kept.
- `/api`: the Worker times the record's answer (wall time: in a Worker the clock moves only across I/O, so it is the
  round trip to the object, its queue and its work); the record returns its reply with a small `meta`
  (`reqMeta.ts`: enums and counts) and the Worker sends a `req` event by RPC in `ctx.waitUntil`, never in the reply's
  path. An object still on the old code (no `apiMeta`, the seconds after a deploy) is asked the plain way.
- The room (`room.close`, `room.full`, `ws.hello`), the cron (`cron.wx`, `cron.compact`) and the admin ops (`admin`) send theirs the same way,
  best effort.
- **Caps** (UTC day, `caps` table, one row written per write): phones 1,000 info/warn and 200 errors per role; the
  relay 4,000 and 500; 8,000 in all (the hard guard on the account's rows written). Over a cap: dropped, `log.cap`
  once.
- `POST /stt` (`sttRoute.ts`): a person's key in `Authorization`, a WAV ≤ 340 KB to Workers AI and the text back;
  nothing of either kept. A role's calls a UTC day: `STT_DAY_MAX` (300, the `caps` table's `stt:<role>` rows, not
  in `all`), then 429. Off: `STT_OFF = "1"` in `[vars]` and deploy (503).
- **Tables:** `log` (primary key `id`, no other index), `batches (b, ts)` (two days), `caps (day, bucket, n)`.
- **Retention:** the object's alarm, daily: events older than 30 days (5,000 a chunk, 4 chunks; a backlog goes on
  hourly), batch ids and caps older than 2 days.

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
1. `npm run logs -- stats`: errors in the last 1 h / 6 h, `unavailable` answers, caps, the oldest event.
2. `npm run logs -- report --since 1d`: what fails, for whom, since which build.
3. `npm run logs -- --since 6h --level warn`, then `--sid` of a session in trouble (its whole story) and `--rid` of a
   failed request (the relay's `req`: its status, rule, time).
4. The relay live: `npx wrangler tail`; the dashboard's Workers Logs (3 days).
5. The Free plan's use: dashboard → Workers & Pages → the relay's Metrics (requests), Durable Objects (rows
   written/read against 100k / 5M a day).
6. Off switch: `LOG_OFF = "1"` in `wrangler.toml` `[vars]` and deploy (`STT_OFF = "1"` for `/stt`).
   The mic probe's results (pending: the user's run on both phones): `npm run logs -- --event mic. --since 1d --json` and `--event stt`.
7. Close the alert's issue with the cause.

## The alert
`health.yml` (every 6 hours and on demand) reads `/health/log` with the `HEALTH_TOKEN` secret (a Worker secret and a
repo secret: counts only) and opens one GitHub issue labelled `alert` (or comments on the open one when the state
changes) when, in the last 6 hours, errors > 20 (not counting errors while leaving), the relay answered `unavailable`
> 5 times, a cap was reached, the day's events passed 50 % of the cap, or the oldest event is older than 32 days (the
prune is dead); it closes the issue on a green run. The issue holds counts and a link here, never a message (the repo
is public). A failing `/health` still fails the job (GitHub's e-mail). Scheduled workflows stop after 60 days without
a commit in a public repo: re-enable it in Actions.
Set up once (done 2026-11-05): `openssl rand -hex 32` → `npx wrangler secret put HEALTH_TOKEN` (and `--env test`) and
`gh secret set HEALTH_TOKEN`.

## Costs (Free plan, developers.cloudflare.com, checked 2026-11-05)
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
