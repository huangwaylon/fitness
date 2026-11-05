# Observability: logs, metrics, alerts

DRAFT for review (2026-11-05). What the app and the relay log, where it goes, how to read it, what it costs.

## Goals
- Root-cause an issue after the fact: what a phone did, what the relay answered, how long it took, which build.
- Errors are never the first thing dropped; logging never costs a frame; the record never pays for it.
- Within the Workers Free plan, with room to spare. Nothing personal: no keys, health values, food names, free text, IPs.

## Pieces
| Piece | Holds | Retention | Read with |
|---|---|---|---|
| **The log** (`IslandLog`, a third SQLite Durable Object, `LOG`) | structured events from the phones (`src c`) and the relay (`src r`) | 30 days (its alarm prunes daily) | `npm run logs` (signed `/admin` op `logs`) |
| **Workers Logs** (`[observability]`, head sampling 1.0) | every Worker / DO invocation's own trace + `console.*` (JSON lines) | 3 days (Free: 200k/day) | dashboard → Workers → Logs, `npx wrangler tail` |
| **`/health`** | the last hour's and 6 hours' error counts (numbers only) | — | `health.yml` (opens an issue on a spike) |

Not used: Logpush (paid); Workers Analytics Engine (free, 3 months, but its SQL API needs an account API token with
Analytics read on every reader and in CI; the log's ~2k events a day don't need it); the record's own SQLite (a
restore of the record would roll back the logs of the very incident; the dump would carry them).

## The event (contract/log.ts, `LOG_V = 1`)
`{ t, l, e, r?, d? }` in a batch `{ v, key, b, s, build, os, pwa, es: [...] }`:
- `t` client ms (the relay clamps to ±1 day of its own clock and keeps both: `ts` its receipt, `ct` the phone's);
- `l` level 0 debug · 1 info · 2 warn · 3 error; `e` the event name (a registry: unknown names are refused);
- `s` the session id (random, per app load), `b` the batch id (dedupe), `r` a request id (`api.*`: the one sent in
  the `/api` body and echoed in `X-Request-Id`, so a phone's failure joins the relay's `req` row);
- `d` the payload: only the registry's fields for that event, each a number (finite, rounded), a boolean, or an
  enum string (`[A-Za-z0-9_.:/-]{1,40}`); `js.error`'s `msg` and `stack` scrubbed (below). Anything else is dropped
  by the relay, whatever the phone sent.
- the caller's role `A` / `B` / `G` from the key, set by the relay (never the key).

### Events
| Event | Level | Payload | When |
|---|---|---|---|
| `app.open` | info | `nav` (navigate/reload/back_forward), `route`, `pwa`, `w`, `h`, `dpr` | each load |
| `app.ready` | info | `ms` (navigation start → the 3D island's first frame), `route` | once a load |
| `app.show` / `app.hide` | info | `awayS` / `shownS` | visibility changes |
| `perf.frames` | info | `p50`, `p95`, `fps`, `long` (>50 ms), `drawFps`, `mode`, `heapMb` (Chrome only) | 10 s after ready, 5 s of rAF; again on a show after ≥ 10 min |
| `js.error` | error | `kind` (error/rejection), `msg`, `stack`, `src`, `n` (repeats folded) | window `error`, `unhandledrejection` |
| `api.fail` | warn | `action`, `err`, `http`, `ms` | a `/api` call that didn't answer ok |
| `api.ok` | info, 10 % sampled | `action`, `ms` | a `/api` call that did |
| `queue.retry` / `queue.drop` | warn / error | `type`, `err`, `tries`, `n` | the write queue backs off / drops (never sendable) |
| `sync.fail` | warn | `err`, `cached` | a refresh that failed |
| `ws.open` / `ws.close` / `ws.park` | info / info / warn | `ms`, `retries`; `code`, `shownS`, `clean` | the live socket |
| `use` | info | counters: `sheet:<i18n key>`, `ev:<event type>`, `route:<route>` | folded per flush |
| `log.drop` | warn | `n`, `why` (cap/full) | the logger dropped events |
| relay `req` | info / warn / error | `action`, `st` (ok or the error code), `ms`, `inB`, `outB`, `n`, `rej`, `why` (the first refusal's rule), ingest's `m`, `sk`, `w` | every `/api` request (rate-limit hits: `st busy`) |
| relay `room.close` / `room.full` | info / warn | `code`, `secs` | the live room |
| relay `cron.wx` | info / warn | `ok`, `fail`, `hours`, `ms` | a weather fetch |
| relay `do.error` | error | `where`, `name` | a caught exception in an object |
| relay `admin` | info | `op` | each signed admin op (an audit) |
| relay `log.cap` | warn | `src`, `role` | a day's cap reached (once) |

### Scrubbing (`js.error`)
`msg`: digits → `#`, quoted strings → `"…"`, non-ASCII runs → `…`, 32+ hex → `<hex>`, 160 chars. `stack`: the
top 4 frames as `fn@file:line:col` (the file's basename: hashed chunks). The relay scrubs again. A message is the
error's fingerprint (numbers out, so the same bug groups).

## The phone (sync/log.ts)
- `log(e, d, level)` only pushes onto a ring (no I/O, no JSON): **300 events**, evicting the oldest of the lowest
  level first (debug, info, warn; an error only when the ring is all errors). Per session: 600 events, 50 errors (the
  same message folds into `n`). Per device and day: 1,500.
- Persisted to `localStorage` (`island.log`) when idle (`requestIdleCallback`, a timeout on Safari) and synchronously on
  `pagehide`/hidden; read back at load, so a crash or a kill loses nothing written.
- Flushed: 30 s after the first event (5 s after an error), at 50 events, and on hidden (`fetch` with `keepalive`,
  ≤ 32 KB a batch); a batch stays stored until the relay acks its id (`b`), so a killed page re-sends it next load and
  the relay drops the repeat. Failure: backoff 5 s → 5 min; offline: wait for `online`.
- Not in the demo, not under automation (unless `?log=on`), not unpaired (kept until paired, then sent).
- Nothing runs in the render loop: frame samples are the one 5 s rAF sampler, off the 3D engine.

## The relay
- `POST /log` (Worker): origin, method, ≤ 64 KB, then the text to `IslandLog.ingest` (parsing on the object's budget).
  It checks the key (role), the version, each event against the registry, the caps, and the batch id (seen in 2 days:
  `{ok, dup}`). Replies `{ok, kept, dropped}`.
- `/api` (Worker): times the record's answer, which returns its reply and a small `meta` (action, role, status, the
  refusals' rules: enums only, counts) → one `req` event via `ctx.waitUntil` to the log (never in the reply's path).
- The room, the cron, the admin ops: their events go to the log by RPC, best effort.
- **Caps (UTC day, the object's):** phones 1,000 info/warn + 200 error per role; the relay 4,000 `req`/other + 500
  error. Over a cap: dropped and counted (`log.cap` once). Worst case ~7k events a day.
- **Storage:** `log (seq, ts, ct, lvl, ev, src, role, sid, rid, build, d)` with one index `(ts)`; `batches (b, ts)`.
  ~250 bytes an event: ~2k events a day typical is ~0.5 MB a day, 15 MB for 30 days.
- **Retention:** the alarm runs daily: events older than 30 days, batch ids older than 2 days, 20k at a time.

## Reading
```sh
cd relay
KEYS_FILE=~/.config/island-fund/keys npm run logs -- --since 2h --level warn
npm run logs -- --since 1d --event js.error --person A        # (keys as above)
npm run logs -- --rid <id>  |  --sid <id>                       # one request, one session, both sides
npm run logs -- report --since 7d                               # errors by fingerprint, p50/p95 per action, per build
npm run logs -- --test ...                                      # the test relay (KEYS_FILE=.smoke-keys)
```
## Alerts
`/health` adds `log: {e1h, e6h, w6h}` (counts only). `health.yml` (every 6 h) opens a GitHub issue labelled `alert`
(or comments on the open one) when `e6h` > 20 or the relay's own `req` errors (`unavailable`) > 5; the issue says
counts only and points here.

## Costs (Free plan, verified on developers.cloudflare.com 2026-11-05)
| | Free limit | The log adds (typical / worst) |
|---|---|---|
| Worker requests | 100k/day | ~60 `/log` / ~300 |
| DO requests | 100k/day | ~1,100 (a `req` RPC each `/api`, `/log`) / ~5k |
| Rows written (each index row counts, deletes too) | 100k/day | ~8k / ~28k |
| Rows read | 5M/day | queries: a day's scan ~2k |
| Storage | 5 GB | ~15 MB |
| Worker CPU | 10 ms/request | `/log`: none parsed in the Worker; `/api`: one RPC more |
| Workers Logs | 200k/day, 3 days | ~5k |
