# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the live room and the client's sync. The contract (tables, row
tuples, replies, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the client;
the relay imports only `app/src/lib/contract/` (`deps.test.ts` "the relay boundary"). Operating it:
[runbook](ops/runbook.md); log and costs: [observability](ops/observability.md).

## Overview
The record is an append-only log with slots (a later row of a slot replaces the earlier). `IslandStore` is its only
reader and writer: it authenticates, checks shapes, stamps `at` and appends. No server-side economy: the client caches
the rows and derives every number on read. User actions are `event` rows sent through a persisted queue; health data
comes from each phone's Shortcut (`ingest`).

One Worker (`relay/src/index.ts`), three SQLite Durable Objects: `ROOM` (`IslandRoom`), `STORE` (`IslandStore`), `LOG`
(`IslandLog`). Routes: `/api`, `/room`, `/health`, `/health/log`, `/admin`, `/log`, `/stt`
([speech-test.md](speech-test.md)), `/grade` ([sugoroku.md](sugoroku.md#speaking)), `/hiking`, `/img[/<id>]` (マイ食品
pictures), `/jobs`, `/share`, `/places*`, `/api/push*` (`relay/src/pushRoute.ts`). Workers AI routes take a person's
key and count spend per UTC day (`STT_DAY_MAX`, `GRADE_DAY_MAX`; `STT_OFF` / `GRADE_OFF` `"1"` turns one off).

<a id="tabs"></a>
## Tables
`at`: the record's time, ISO 8601 UTC with ms, strictly increasing. Dates: `YYYY-MM-DD` (Tokyo).

| Table | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`: `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit (never the body or key); 60 days |

Only `metrics` and `events` sync. The others: [The record](#the-record) "Where".

## Events
Exactly `EVENT_TYPES`; anything else or a bad shape is `bad_request`. `data` ≤ 20,000 chars as JSON (`wnote` 140,000,
`hike_trk` 60,000), else `too_large`. Fields, bounds and merge: the type's `contract/` module; shapes:
`contract/record.ts`. Ops stamped with the sender's clock (`decor`, `board`, `food*`, `pack*`, `w*`) are refused past
`AHEAD_MS` (a day) ahead. Per-id ops keep the latest only: a stale op is acked `duplicate`; a removal's row goes after
60 days (`contract/tomb.ts`). Only `spend`, `spend_void` and `harvest` touch ベル.

| type | module | doc / note |
|---|---|---|
| `spend`, `spend_void`, `harvest` | `rules.ts`, `record.ts` | the ベル wallet; a buy's `day` ≤ 14 days back |
| `pref` | `record.ts`, `goals.ts`, `profile.ts` | [below](#pref) |
| `find` | `api.ts FIND_KINDS` | the shared ずかん's first finds |
| `tally`, `tally_back` | `tally.ts` | <a id="tally"></a>a person's day of catches, each count the larger (`mergeTally`); give-back after a lost race |
| `island` | `island.ts` | a person's part of a [Shared world](#shared-world) day, yesterday to tomorrow |
| `decor`, `room_save` | `decor.ts`, `tent.ts`, `layout.ts`, `roomSave.ts` | [Decorating](design.md#decorating), [The tent](design.md#the-tent), [layout](island-layout.md#ops-the-record-and-the-relay) |
| `board` | `board.ts` | [board.md](board.md) |
| `food*` | `food.ts` | [food-data.md](food-data.md); own entries only, recipes/custom foods shared |
| `sell`, `buy`, `buy_starts`, `sg_reward` | `shop.ts`, `stock.ts` | [The shop](design.md#the-shop); `pocket short` / `wallet short` |
| `shop_adjust` | `shop.ts adjustOf` | <a id="shop-adjust"></a>admin-only かいがら correction `{v, note}` (`record.ts adjust`); undone by −v |
| `farm`, `wet`, `farm_water` | `farm.ts` | [farming.md](farming.md#rules-the-records); `wet` from the weather cron |
| `listen`, `eflag`, `eflag_done` | `listen.ts`, `eflag.ts` | [english.md](english.md#progress); `listen` private (`rowsFor`) |
| `inbody` | `bodyEst.ts` | admin-only InBody sheet (`record.ts inbody`) |
| `pack*`, `trip_note` | `pack.ts` | [travel.md](travel.md#packing-list-relay), [private values](travel.md#private-values) |
| `wtask`, `wdone`, `wconf`, `wnote` | `wedding.ts` | [wedding.md](wedding.md#the-record-relay) |
| `todo` | `todo.ts` | [todo.md](todo.md) |
| `hike`, `hike_trk`, `hike_start` | `hike.ts`, `hikeStart.ts` | [hiking.md](hiking.md) |
| `check` | `checks.ts` | [daily checks](design.md#daily-checks) |

<a id="pref"></a>**`pref`** `{key, value, person?}` (`PREF_KEYS`): cosmetic (`locale`, `villager*`, `look`,
`menu*`, `tentFavs`); goals (`goals.ts` GOALS; each person's own, naming another is `forbidden`); the profile (`sex`,
`birth`, [design](design.md#profile)): shared by all three and **locked** (refused; a change is a code change);
island-wide `weatherMode`, `seasonLook`. **A new event type, pref key or field deploys the relay first**: the record
refuses what it doesn't know.

### The look
Each avatar ([players.md](players.md), `contract/look.ts`): `look` (unset = いつもの) and `savedLooks` (≤ 20), read
part by part so a broken field falls back alone.

## API
`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, JSON text (`text/plain` from a page: no
preflight), `{key, action, ...}`. Always HTTP 200: `{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈
`unauthorized` · `forbidden` · `bad_request` · `too_large` · `busy` · `unavailable`. Body ≤ `MAX_BODY_CHARS` (1 MB).

| `action` | Request | Reply |
|---|---|---|
| `ingest` | Shortcut fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?, wallets?}` (a repeated `id` is a duplicate: retries are safe) |
| `events` | `events: [{id, type, data, group?}]` (≤ `EVENTS_MAX`, group ≤ `GROUP_MAX`) | `{ok, results, wallets?}` |
| `snapshot` | `since?`, `page?` (≤ `SNAPSHOT_PAGE_MAX`), `after?` | `{ok, me, now, rev, rows, next?, wallets?, ledgers?}` |
| `uploads` / `whoami` / `health` | (`health`: no key) | last 20 audit rows / `{me, build}` / `{build}` |

<a id="groups"></a>A **group** (the shop's 全部, a room's change) commits all or none (`detail: 'group'`).
**Keys:** `KEY_A`, `KEY_B`, `KEY_C` (the guest, `G`), compared in constant time. **Rate:** `RATE_PER_MINUTE` (120) a
key, then `busy`; snapshot pages `PAGES_PER_MINUTE`. `storeRoute.ts keyGate` refuses keyless calls before the Durable
Object. <a id="revision"></a>**Revision:** `rev` is the epoch (`e1`, `e2`, …), changed by a restore or `record.ts
rev`; a new `rev` or `me` makes the client drop its cache (never the queue) and refetch.

## Ingest
`relay/src/parse.ts` (header: fields, bounds, steps = max of phone and Watch): newline-joined Text lists, a line per
day ([shortcut §1](ops/shortcut-health-sync.md#1-what-the-shortcut-sends)). Bad lines skipped with a warning, a list
of the wrong length dropped. **Latest wins:** a row is appended when the value changes for (person, date, metric); a
`0` for a past day over a higher value is **held** (`metrics_held`, never served) until promoted (`held`, `promote`:
[runbook §9](ops/runbook.md#9-the-record)). All-zero activity is read as a day without the Watch
([decisions](decisions.md#no-watch-days)).

<a id="client-sync"></a>
## Client sync
`lib/sync/` (storage, transport, queue, cache, socket) and `lib/store/` (`live.ts`, `view.ts`, `synced.svelte.ts`).
`sync/storage.ts` registers every `island.*` key; `sync/transport.ts` `post()` never throws. `sync/cache.ts` keeps
rows in IndexedDB segments; `fetchPages` applies a refresh atomically; `model/snapshot.ts` merges by natural key.

### Compaction
`model/compact.ts` drops from the phone's cache what the model can no longer read (`model/compactKeep.ts` for
`metrics`), replaced tallies and food ops, and removals past 60 days. The record keeps every Health row.

### Write queue
`sync/queue.ts` (header, constants): `island.queue`, sent in order in `events` batches, halved when refused whole. A
failing event is set aside after `PARK_AFTER` (`queue.poison`, never dropped); held events (`holdMs`, the undo window)
are skipped; `bad_request` / `too_large` drop with a message; `unauthorized` → pairing; others back off
(`backoffMs`). Acked rows live in `island.acked` until a snapshot holds them. `store/view.ts composeModel` shows queued
events at once, stamped after the newest server row; かいがら is the cached [ledger](#the-ledger) plus unsent rows.

<a id="live-sync"></a>
### When it syncs
Launch, show (≤ every 30 s), a sync tap, `online`, and the relay's `changed` ([Push](#push)): flush, then fetch. A
`welcome` whose `rec {at, rev}` is cached only flushes, unless the pill says offline (then it fetches, which clears it).
Failed fetches retry per `FAIL_RETRY_MS`. A request in flight across a hide (iOS freezes it) is aborted when the page
is back and, if a read or `events`, sent again at once (`transport.ts` `AGAIN_ON_RESUME`); a timeout while hidden is
`offline`, on screen `unavailable` (`api.fail err=timeout`). The socket always offers its ticket; without a known
person it waits. One socket per device
and tab (`dev`; 4002 replaces it). Ops merge commutatively per id.

<a id="the-record"></a>
## The record
- **Where:** `relay/src/store.ts` (`StoreCore`, runtime-free: the API, ingest, events) in `IslandStore`
  (`storeObject.ts`), with its parts: `storeBase.ts` (clock, meta, row writes), `storeRows.ts` (reads by `at`),
  `storeBooks.ts` (per-feature op rules, decor caps), `storeShop.ts` (stored ledger, wallets, field), `storeDump.ts`
  (load, dump). Tables (`storeSchema.ts`): `SCHEMA` (`metrics`, `events`, `ids`, `uploads`, `meta`, `metrics_latest`,
  `metrics_held`, `ledger`, `ledger_log`, `places`, `share*`, push and image tables); `MIGRATIONS` only append.
- **Rules** (`app/src/lib/contract/record.ts`): an event id once, forever; slots (`eventSlot`, `decorAccept`, …);
  shop prices in `contract/shopCheck.ts` (relay only). Running checks for the shop, field and decor caps:
  `shopcheck` / `decorcheck`.
- **`since`** uses the `at` index; out-of-order rows are `late` (`LATE_MARGIN_MS`).
- **Admin:** `POST /admin`, signed with a secret derived from `KEY_A:KEY_B` (`relay/src/sign.ts`, 5-minute window,
  `restore` / `rev` / `logpurge` once per signature); `PLACES_KEY` signs `PLACES_OPS` only. Ops:
  [runbook §9](ops/runbook.md#9-the-record).
- **Health rows:** every `metrics` row is kept forever (`keepMetrics` refuses any statement that would drop one).
- <a id="the-ledger"></a><a id="the-wallet"></a>**The stored ledger** (`relay/src/ledger.ts`, `contract/ledger.ts`):
  rows per person and part (`hp` かいがら + pocket, `w` pieces, `g` games, `z` ずかん; `F|field` plots) with `seq`,
  stepped by each op in its transaction, never below 0; `ledger_log` 60 days; `ledgercheck` at 03:00.
- **Snapshot size:** a year of three is ~50–100k rows (3–6 MB): paged.
- **Restore:** `/api` is `unavailable` until the restart; a new epoch. Backups: [runbook §6](ops/runbook.md#6-backups).

## Live relay
Presence while the app is open; intents only, never data of record (decisions: *Live relay on Cloudflare*).
`IslandRoom` (`relay/src/room.ts`) at `wss://island-fund-relay.island-fund-relay.workers.dev/room`; the test copy
`island-fund-relay-test`. `GET /health` → `{ok, v, versions, sha, t, wx, cronAt}`.
- **Admission:** `ALLOWED_ORIGINS` (and localhost), subprotocol `island-v1` plus an HMAC ticket (`contract/ticket.ts`,
  `auth.ts admission`). Then `hello {key, since?, beat?, dev?, …}` → `welcome {me, peer, t, rec?, here, gone?, …}`.
- **Close codes:** 4001 bad key, 4002 replaced, 4003 no hello (`HELLO_MS`), 4004 unknown `v`
  ([decisions](decisions.md#relay-versions-side-by-side)); the phone's 4000 ping lost, 4010 no welcome.
- **Protocol:** `app/src/lib/contract/live-protocol.ts` (every message and bound). Shared-world intents are kept for the
  day; `highfive` ([decisions](decisions.md#a-high-five-goes-over-the-relay-only)), `music`
  ([sound-sync.md](sound-sync.md)) and the rest are presence. An intent with `c` gets `ack {c, t, ok}` after its write.
- **Heartbeat** `{"v":3,"kind":"hb"}`, answered without waking the room (`setWebSocketAutoResponse`); silence past
  `SILENT_MS` closes. Per-socket token bucket: `relay/src/bucket.ts`.
- **Client:** `app/src/lib/sync/live.ts` (outbox until `ack`, `serverNow()`).
- **Measured:** [perf.md](ops/perf.md) "Measuring". Cost: [budget](ops/observability.md#request-budget).

## The real weather
Tokyo's sky by the hour ([design](design.md#weather)): `relay/src/weather.ts` fetches Open-Meteo (JMA models, `WX_LAT`
/ `WX_LON`, no key, CC BY 4.0) on the :15/:45 cron or a hello; 12 hours back, 36 ahead (`live-protocol.ts Wx`), a bad
answer never replaces a good one (`wx-fail`). Phones get `wx` over the room (`sync/wx.ts`, cached `island.wx`); no phone
calls a weather API and weather is never written to the record. `/health`'s `wx {at, src, age, hours, fails}`; admin
op `wx`. Tests: `relay/test/weather.test.ts`, `e2e/realweather.spec.ts`.

## Saved places
行きたい場所 (`relay/src/places.ts`, `contract/places.ts`): the record's `places` table, the only copy. Google blocks
Cloudflare, so `places-pull.yml` reads `PLACES_LIST` into admin `places_ingest`. Categories (`PLACE_CATS`): rules,
then Workers AI each cron tick. Reads: `GET /places[?since=<ver>]`, `/places/pics?id=` ([places](places.md#details)),
`/places/status`. Operating: [runbook](ops/runbook.md#saved-places).

## The guest
A third player, `KEY_C` (unset = none), who `G` ([design](design.md#the-guest), [decisions](decisions.md#the-guest)).
One rule (`contract/guest.ts`): no body data in (`rowsFor`: no weight, body fat, BMI, lean, `inbody`, からだ goals;
`ingest` and `uploads` `forbidden`) and no からだ goal written (`guestMayWrite`). Its ベル wallet earns nothing. Members
draw its villager as `third` (`ui-state/cast.ts`). Tests: `guest.test.ts`, `e2e/guest.spec.ts`.

## Ambient life
What the island does on its own is decided per 10-second Tokyo slot from date, slot and shared world, so every phone
agrees without a message (decisions: *Ambient life from the clock*). `app/src/lib/components/island/ambient.ts` (pure;
`slotAt`, `slotRand`, `villagerBeats`, `crittersAt`), `ambientPlan.ts` (positions), `ambientClock.ts relayOffset`;
checked by `ambient.test.ts`.

## Shared world
Every phone shows the same island ([design](design.md#shared-world)): [Ambient life](#ambient-life) plus intents over
the relay, kept by the room for the day (`RING_MAX`, claims apart) and folded into a `WorldDay` (`sync/world-day.ts`;
first claim wins, `claimOf`). A lost race takes the catch back (`store/actions.ts lostRace`, `tally_back`). Store:
`store/world.svelte.ts`; record row: `island` (`sendIslandDay`). Villagers: each phone moves its own
(`island/villagerSync.ts`), a gone phone's stays put ([decisions](decisions.md#a-villager-stays-where-it-was-left)).
**Sleep** ([design](design.md#sleep)): offline person, sleeping villager (`GRACE_MS`). Test mode: tabs over a
BroadcastChannel (`sync/live-local.ts`, [testing](ops/testing.md#test-mode)).

## Push
After a write that added rows the record tells the room, which sends `changed {what, who, at, rev, sid?, calm?, t}` to
every socket (the guest only what it may see); the phone refreshes after `PUSH_GATHER_MS` (`store/live.ts`). Web Push
for やること is separate: `contract/push.ts`, `relay/src/pusher.ts`, `VAPID_PUBLIC` + secret `VAPID_PRIVATE`.

## Service worker
`app/src/service-worker/` (rules and every cache's bound: `caches.ts`). Registered late (`lib/ui-state/swLate.ts`) so
the precache never competes with the island's models; a running page takes a deploy only when hidden, unless
`contract/compat.ts COMPAT` says incompatible (a worker change must serve the previous build's page, else bump it).
Navigations serve the cached shell and check the network in the background (`checkShell`). On activate the worker
keeps `SHELLS_KEPT` older shells and drops from them every hashed file the current one holds (`dedupeShells`). Each
cache is bounded in `caches.ts`: the Cache API holds the shells, audio, food data, English, offline areas and fonts; IndexedDB
(`blobCache.ts`, fewer Cache Storage entries make a cold worker's first read fast) holds the models, art, map tiles,
photos, ごはん's pictures and 保存した場所's (an older phone's Cache API copies move over after a launch ends; e2e reads
them via `e2e/swFiles.ts`). A carried feature chunk (English, すごろく, the wedding board, MapLibre) fetched from the
network gives up after 10 s with no answer (`netFallback.ts fetchWithin`, `NO_COPY_WAIT_MS`).
Offline: what was shown once reads offline (`e2e/offline.spec.ts`); precache list `scripts/load-budget.ts` `PRECACHE`;
saved map areas `lib/offline/plan.ts` ([design](design.md#offline-maps)).

## Tests
`relay/test/` (node:sqlite); the app's queue, cache, sync and store tests; `GOLDEN_UPDATE=1`; `npm run bench`
([perf.md](ops/perf.md) "Budgets").
