# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the live room and the client's sync. The contract (tables, rows,
replies, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the client; the relay
imports only `app/src/lib/contract/` (`deps.test.ts`). Parts and routes: [architecture](architecture.md); operating:
[runbook](ops/runbook.md); log and costs: [observability](ops/observability.md).

## Overview
An append-only log with slots (a later row replaces the earlier). `IslandStore` alone reads and writes it:
authenticates, checks shapes, stamps `at`, appends; the client derives every number. Actions are `event` rows from a
persisted queue; health data comes from each phone's Shortcut (`ingest`).
Workers AI routes have day caps (`STT_DAY_MAX`, `GRADE_DAY_MAX`; `STT_OFF` / `GRADE_OFF` `"1"` turns one off).

<a id="tabs"></a>
## Tables
`at`: ISO 8601 UTC with ms, strictly increasing; dates `YYYY-MM-DD` (Tokyo). Only `metrics` and `events` sync.

| Table | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`: `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit (never the body or key); 60 days |

## Events
Exactly `EVENT_TYPES` (else `bad_request`); `data` ≤ 20,000 chars (`wnote` 140,000, `hike_trk` 60,000), else
`too_large`. Fields, bounds and merge: the type's `contract/` module; shapes `contract/record.ts`. Ops on the sender's
clock (`decor`, `board`, `food*`, `pack*`, `w*`) are refused past `AHEAD_MS` (a day) ahead. Per-id ops keep the latest:
a stale one is acked `duplicate`; a removal's row goes after 60 days (`contract/tomb.ts`). Only `spend`, `spend_void`
and `harvest` touch ベル.

| type | module | doc / note |
|---|---|---|
| `spend`, `spend_void`, `harvest` | `rules.ts`, `record.ts` | the ベル wallet; a buy's `day` ≤ 14 days back |
| `pref` | `record.ts`, `goals.ts`, `profile.ts` | [below](#pref) |
| `find` | `api.ts FIND_KINDS` | the shared ずかん's first finds |
| `tally`, `tally_back` | `tally.ts` | <a id="tally"></a>a day's catches, each count the larger (`mergeTally`); give-back after a lost race |
| `island` | `island.ts` | a person's part of a [Shared world](#shared-world) day, yesterday to tomorrow |
| `decor`, `room_save` | `decor.ts`, `tent.ts`, `roomSave.ts` | [layout](island-layout.md#ops-the-record-and-the-relay), [The tent](design.md#the-tent) |
| `board` | `board.ts` | [board.md](board.md) |
| `food*` | `food.ts` | [food-data.md](food-data.md); own entries only, recipes/custom foods shared |
| `sell`, `buy`, `buy_starts`, `sg_reward` | `shop.ts`, `stock.ts` | [The shop](design.md#the-shop); `pocket short` / `wallet short` |
| `shop_adjust` | `shop.ts adjustOf` | <a id="shop-adjust"></a>admin-only かいがら correction `{v, note}` (`record.ts adjust`); undone by −v |
| `farm`, `wet` | `farm.ts`, `wet.ts` | [farming.md](farming.md#rules-the-records); `wet` from the weather cron |
| `listen`, `eflag`, `eflag_done` | `listen.ts`, `eflag.ts` | [english.md](english.md#progress); `listen` private (`rowsFor`) |
| `inbody` | `bodyEst.ts` | admin-only InBody sheet (`record.ts inbody`) |
| `pack*`, `trip_note` | `pack.ts` | [travel.md](travel.md#packing-list-relay), [private values](travel.md#private-values) |
| `wtask`, `wdone`, `wconf`, `wnote` | `wedding.ts` | [wedding.md](wedding.md#the-record-relay) |
| `todo` | `todo.ts` | [todo.md](todo.md) |
| `hike`, `hike_trk`, `hike_start` | `hike.ts`, `hikeStart.ts` | [hiking.md](hiking.md) |
| `check` | `checks.ts` | [daily checks](design.md#daily-checks) |

<a id="pref"></a>**`pref`** `{key, value, person?}` (`PREF_KEYS`): cosmetic (`locale`, `villager*`, `look`, `menu*`,
`tentFavs`); goals (`goals.ts` GOALS; each person's own, else `forbidden`); the profile (`sex`, `birth`,
[design](design.md#profile)), **locked**; island-wide `weatherMode`, `seasonLook`. A new type, key or field deploys the
relay first. **The look** ([players.md](players.md), `contract/look.ts`): `look` (unset = いつもの) and `savedLooks`
(≤ 20), read part by part so a broken field falls back alone.

## API
`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, `text/plain` JSON (no preflight), `{key, action,
...}`. Always HTTP 200: `{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `forbidden` ·
`bad_request` · `too_large` · `busy` · `unavailable`. Body ≤ `MAX_BODY_CHARS` (1 MB).

| `action` | Request | Reply |
|---|---|---|
| `ingest` | Shortcut fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?, wallets?, ledgers?, field?}` (a repeated `id` is a duplicate) |
| `events` | `events: [{id, type, data, group?}]` (≤ `EVENTS_MAX`, group ≤ `GROUP_MAX`) | `{ok, results, wallets?, ledgers?, field?}` |
| `snapshot` | `since?`, `fseq?`, `page?` (≤ `SNAPSHOT_PAGE_MAX`), `after?` | `{ok, me, now, rev, rows, next?, wallets?, ledgers?, field?}` |
| `uploads` / `whoami` / `health` | (`health`: no key) | last 20 audit rows / `{me, build}` / `{build}` |

<a id="groups"></a>A **group** (the shop's 全部, a room's change) commits all or none (`detail: 'group'`). **Keys:**
`KEY_A`, `KEY_B`, `KEY_C` (guest `G`), constant-time; `storeRoute.ts keyGate` refuses keyless calls before the object.
**Rate:** `RATE_PER_MINUTE` (120) a key, then `busy`; snapshot pages `PAGES_PER_MINUTE`. <a id="revision"></a>
**Revision:** `rev`, the epoch (`e1`, …), changes on a restore or `record.ts rev`; a new `rev` or `me` drops the
client's cache (never the queue).

## Ingest
`relay/src/parse.ts` (header: fields, bounds, steps = max of phone and Watch), a line per day
([shortcut §1](ops/shortcut-health-sync.md#1-what-the-shortcut-sends)). **Latest wins:** a row is appended when
(person, date, metric) changes value; a `0` for a past day over a higher value is **held** (`metrics_held`) until
promoted ([runbook §9](ops/runbook.md#9-the-record)). All-zero activity = no Watch ([decisions](decisions.md#no-watch-days)).

## Client sync
`lib/sync/` and `lib/store/`: `storage.ts` registers every `island.*` key; `transport.ts post()` never throws;
`cache.ts` keeps rows in IndexedDB segments (`fetchPages` atomic); `model/snapshot.ts` merges by natural key.

### Compaction
`model/compact.ts` drops from the phone's cache what the model no longer reads (`compactKeep.ts`) and removals past
60 days; the record keeps every Health row.

### Write queue
`sync/queue.ts` (header): `island.queue`, sent in order in `events` batches, halved when the relay refuses the whole
batch. An event failing `PARK_AFTER` times is parked (`queue.poison`, counted on the sync pill, never dropped); held
events (`holdMs`, undo) wait; `bad_request` / `too_large` drop with a message; `unauthorized` → pairing; others back
off. `store/view.ts composeModel` shows queued events at once; かいがら is the cached [ledger](#the-ledger) plus unsent rows.

<a id="live-sync"></a>
### When it syncs
Launch, show (≤ every 30 s), a sync tap, `online`, and the relay's `changed` ([Push](#push)): flush, then fetch (a
`welcome` whose `rec` is cached only flushes). Failed fetches retry (`FAIL_RETRY_MS`); a request caught by a hide is
resent on return (`AGAIN_ON_RESUME`). One socket per device and tab (4002 replaces it).

<a id="the-record"></a>
## The record
- **Where:** `relay/src/store.ts` (`StoreCore`) in `IslandStore` (`storeObject.ts`), split into `store*.ts`; tables
  `storeSchema.ts SCHEMA`, `MIGRATIONS` only append.
- **Rules** (`contract/record.ts`): an event id once, forever; slots (`eventSlot`, …); shop prices
  `contract/shopCheck.ts`; out-of-order rows `late` (`LATE_MARGIN_MS`).
- **Admin:** `POST /admin`, signed with a secret derived from `KEY_A:KEY_B` (`sign.ts`, 5-minute window, `restore` /
  `rev` / `logpurge` once per signature); `PLACES_KEY` signs `PLACES_OPS` only. Ops: [runbook §9](ops/runbook.md#9-the-record).
- **Health rows** are kept forever (`keepMetrics` refuses any statement that would drop one).
- <a id="the-ledger"></a><a id="the-wallet"></a>**The stored ledger** (`relay/src/ledger.ts`, `contract/ledger.ts`):
  rows per person and part (`hp` かいがら + pocket, `w` pieces, `g` games, `z` ずかん; `F|field` plots) with `seq`,
  stepped by each op in its transaction, never below 0; `ledger_log` 60 days; `ledgercheck` at 03:00. `F|field` is the
  fold of the `farm` rows (meta `farm|t6h` names the rules), sent when changed or `seq` ≠ the phone's `fseq`, and with
  every `farm` ack. A refused `farm` says its first op's reason; dropped ops log `farm.refused`.
- **Snapshot size:** a year of three is ~50–100k rows (3–6 MB): paged.
- **Restore:** `/api` is `unavailable` until the restart; a new epoch ([runbook §6](ops/runbook.md#6-backups)).

## Live relay
Presence while the app is open; intents only, never the record. `IslandRoom` (`relay/src/room.ts`) at `/room`;
`GET /health` → `{ok, v, versions, sha, t, wx, cronAt}`.
- **Admission:** `ALLOWED_ORIGINS`, subprotocol `island-v1` plus an HMAC ticket (`contract/ticket.ts`); `hello {key,
  since?, beat?, dev?, …}` → `welcome {me, peer, t, rec?, here, gone?, …}`.
- **Close codes:** 4001 bad key, 4002 replaced, 4003 no hello, 4004 unknown `v`
  ([decisions](decisions.md#relay-versions-side-by-side)); the phone's 4000 ping lost, 4010 no welcome.
- **Protocol:** `contract/live-protocol.ts`; shared-world intents kept for the day, the rest presence; an intent with
  `c` gets `ack {c, t, ok}` after its write. Heartbeat auto-answered without waking the room (`SILENT_MS`); per-socket
  token bucket. Client `sync/live.ts`.
- **Measured:** [perf.md](ops/perf.md) "Measuring". Cost: [budget](ops/observability.md#request-budget).

## The real weather
`relay/src/weather.ts` ([design](design.md#weather)): Open-Meteo (JMA, `WX_LAT` / `WX_LON`, no key, CC BY 4.0) on the
:15/:45 cron or a hello; 12 h back, 36 ahead; a bad answer never replaces a good one (`wx-fail`). Phones get `wx` over
the room (`sync/wx.ts`), never from the record; admin op `wx`. Tests: `relay/test/weather.test.ts`, `e2e/realweather.spec.ts`.

## Saved places
`relay/src/places.ts`, `contract/places.ts`: the `places` table, the only copy, filled by `places-pull.yml` through admin
`places_ingest` (Google blocks Cloudflare); categories (`PLACE_CATS`) by rules, then Workers AI each tick. Reads `GET
/places[?since=<ver>]`, `/places/pics?id=` ([places](places.md#details)), `/places/status`. Operating:
[runbook](ops/runbook.md#saved-places).

## The guest
A third player, `KEY_C` (unset = none), who `G` ([decisions](decisions.md#the-guest)). One rule (`contract/guest.ts`):
no body data out (`rowsFor`: weight, body fat, BMI, lean, `inbody`, からだ goals) or in (`ingest`, `uploads`
`forbidden`; `guestMayWrite`). Its ベル wallet earns nothing. Members draw its villager as `third`
(`ui-state/cast.ts`). Tests: `guest.test.ts`, `e2e/guest.spec.ts`.

## Ambient life
Decided per 10-second Tokyo slot from date, slot and shared world, so every phone agrees without a message
(`components/island/ambient.ts`: `slotAt`, `slotRand`, `villagerBeats`, `crittersAt`; `ambientClock.ts relayOffset`).

## Shared world
Every phone shows the same island ([design](design.md#shared-world)): [Ambient life](#ambient-life) plus intents the
room keeps for the day (`RING_MAX`), folded into a `WorldDay` (`sync/world-day.ts`; first claim wins). A lost race gives
the catch back (`lostRace`, `tally_back`); record row `island`. Each phone moves its own villager
(`island/villagerSync.ts`). **Sleep** ([design](design.md#sleep)): offline person, sleeping villager (`GRACE_MS`).
Test mode: tabs over a BroadcastChannel.

## Push
A write that added rows makes the room send `changed {what, who, at, rev, …}` to every socket (the guest only what it
may see); the phone refreshes after `PUSH_GATHER_MS`. Web Push for やること: `relay/src/pusher.ts`, `VAPID_PUBLIC` +
secret `VAPID_PRIVATE`.

## Service worker
`app/src/service-worker/` (rules, cache bounds: `caches.ts`), registered late (`swLate.ts`). A page takes a deploy only
at a safe moment (`ui-state/update.ts`): back after 5 min away, before its first touch, nothing in hand; on a `COMPAT`
break or a lost chunk also as it hides. A worker change must serve the previous build's page. Deploys keep older
builds' hashed files 3 days (`scripts/deploy-keep.ts`). Navigations serve the cached shell, checked behind
(`checkShell`; `SHELLS_KEPT`). Cache API: shells, audio, food data, English, offline areas, fonts; IndexedDB
(`blobCache.ts`): models, art, tiles, photos. A feature chunk gives up on the network after 10 s (`netFallback.ts`).
What was shown once reads offline (`e2e/offline.spec.ts`); precache `scripts/load-budget.ts PRECACHE`.

## Tests
`relay/test/` (node:sqlite); the app's queue, cache, sync and store tests; `GOLDEN_UPDATE=1`; `npm run bench`
([perf.md](ops/perf.md) "Budgets").
