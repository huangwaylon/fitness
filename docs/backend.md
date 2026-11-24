# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the live room, and the client's sync. The contract (tables, row
tuples, reply shapes, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the
client. The relay imports from the app only `app/src/lib/contract/`, which reaches only itself, `types.ts` and
`random.ts` (`deps.test.ts` "the relay boundary"). Operating it: [runbook](ops/runbook.md); its log and costs:
[observability](ops/observability.md).

## Overview

The record is an append-only log with slots (a later row of the same slot replaces the earlier): the relay's
`IslandStore` ([The record](#the-record)) is its only reader and writer. It authenticates, validates shapes, stamps
`at` and appends; no server-side economy or config: the client caches the rows and derives every number on read. User
actions are `event` rows sent through a persisted queue and shown at once; health data comes from each phone's
Shortcut (`ingest`).

One Worker, three SQLite-backed Durable Objects (`relay/wrangler.toml`): `ROOM` (`IslandRoom`: [Live
relay](#live-relay)), `STORE` (`IslandStore`) and `LOG` (`IslandLog`: [observability](ops/observability.md)).

<a id="tabs"></a>
## Tables

`at` is the record's time, ISO 8601 UTC with milliseconds, strictly increasing (all rows of one ingest share it).
Dates are `YYYY-MM-DD` (Tokyo).

| Table | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit (`ok` / `partial` / `error`, warnings, the body's shape, never the body or key); 60 days |

`metrics` and `events` are synced to the client; `uploads` only by the `uploads` action. The record's other tables:
[The record](#the-record) "Where".

## Events
Exactly the types in `EVENT_TYPES`; another type or a bad shape is `bad_request`. `data` is an object, ≤ 20,000
characters as JSON (a `wnote`'s 140,000, a `hike_trk`'s 60,000; past it `too_large`). Each type's fields, bounds,
caps and merge are its `contract/` module's (header and constants); the record checks shapes (`contract/record.ts`), and wallet cover is a
read-time rule in the model. **Ops with a sender's clock** (`decor`, `board`, `food*`, `pack*`, `w*`: `at` in ms on the
relay's clock) are refused more than a day past the record's (`AHEAD_MS`), which no later edit could beat. **Latest op
only:** the per-id ops keep one row a slot; a stale op or anything after a removal is acked as `duplicate`. A
removal's row is kept 60 days by its `at`, then deleted at 03:00 (`tombPrune`; its id stays known; an outdoor object's
and a packing seed item's kept for good: `contract/tomb.ts`); an op on an empty slot whose item is older than 59 days
(its `at`, or its id's time) is a `duplicate` (`lateOp`), and a snapshot whose `since` predates a pruned removal gets
`rev` + `~t`, so the phone refetches everything. **Never ベル:** everything but `spend`, `spend_void` and `harvest`.

| type | module | what |
|---|---|---|
| `spend` / `spend_void` | `rules.ts`, `record.ts spendOf` | a buy from the sender's wallet at `shopPrice`, `day` up to 14 days back; either person's undo (the first counts) |
| `harvest` | `record.ts` | a week's harvest, counted only while it's open |
| `pref` | `record.ts`, `goals.ts`, `profile.ts`, `look.ts` | one setting (below) |
| `find` | `api.ts FIND_KINDS` | the shared ずかん's first find of `kind:id` (ids the client's catalog: no relay deploy), sent only the first time anyone finds it (`model/finds.ts`) |
| `tally` | `tally.ts` | <a id="tally"></a>one person's day of catches and pick-ups, sent whole, held a minute; one row per person and day, each count the larger (`mergeTally`; `TALLY_PAST_DAYS`) |
| `tally_back` | `tally.ts backCovered` | what one person gives back of a day's tally: a claim race lost after the tally went ([Shared world](#shared-world)); a catch already sold **costs its かいがら** (`shop.ts owedOf`) till a later catch covers it |
| `island` | `island.ts` | one person's part of one day of the [Shared world](#shared-world) (`mergeIslandDay`), sent only once this session's fetch folded the record in (`week.current`), so a row rebuilt before them can't erase claims; yesterday to tomorrow only (older deleted at 03:00: `islandPrune`) |
| `decor` | `decor.ts` | a piece's whole state or its removal, anyone's: the decorations ([Decorating](design.md#decorating), `DECOR_MAX`) |
| `decor` (`sc` `t` / `u` / `v`) | `tent.ts` | a room's piece, wallpaper, floor, size ([The tent](design.md#the-tent), `TENT_MAX`); a light's switch a slot of its own |
| `decor` (layout) | `layout.ts` | the island's layout ([island-layout.md](island-layout.md#ops-the-record-and-the-relay)): a home's look its owner's (`scopeMayWrite`); any lower-case kind passes |
| `room_save` | `roomSave.ts` | a room's saved arrangement in slot 1–3 ([design](design.md#the-tent) "Saved arrangements"), or emptied |
| `board` | `board.ts` | a note or its removal ([board.md](board.md)) |
| `food`, `food_repeat`, `food_recipe`, `food_custom` | `food.ts` | the meal log ([food-data.md](food-data.md)): owner-only edits (`foodAccept`), recipes and custom foods anyone's, removed by their creator (`sharedAccept`); いつもの's skipped day stays skipped (`repeatAccept`); both log as `food` snapshots |
| `sell`, `buy`, `buy_starts` | `shop.ts`, `stock.ts` | [The shop](design.md#the-shop), no slot, the guest's too; pocket, かいがら derived (`shopLedger`), past them `pocket short` / `wallet short`; a buy's day ≤ 35 days old, never which pieces a stock holds (phones': `shop/stock.ts`) |
| `sg_reward` | `shop.ts rewardOf` | [英語すごろく](sugoroku.md)'s かいがら for a game, anyone's (the guest's too): `{g, v, to, d}`, `v` 1–1000 each, `to` a unique set of A/B/G, `d` ≤ the record's day, ≤ 35 days old; a row of **each recipient's** ledger (`rowConcerns`), added as a sale's (never ベル); a game pays each once, no daily cap; kept while it pays one of them, else `reward paid` (no toast) |
| `shop_adjust` | `shop.ts adjustOf` | <a id="shop-adjust"></a>the admin's correction of one person's かいがら: `{v, note}`, `v` whole, 0 < \|v\| ≤ 100,000, `note` 1–80 chars; never a phone's (`validEventData`), only `record.ts adjust` or `walletset`; folds as `shells += v`; undone by another of −v ([the ledger](#the-ledger)). An older build ignores the type, so the relay ships first |
| `farm`, `wet`, `farm_water` | `farm.ts` | [farming.md](farming.md#rules-the-records): ops judged against the field and the pocket (`farmStep`); `wet` the record's own, from the weather cron (`wetTick`); `farm_water` too |
| `listen` | `listen.ts` | English Study's clip (`gm` 'tv', [english.md](english.md#progress)): finished (`f`) or part-way; **private** (`rowsFor`): whole to its owner, a summary to the others (`{d, g, ms, gm, f?}`) |
| `eflag`, `eflag_done` | `eflag.ts` | [English Study's flags](english.md#flags): anyone's flag, a member's review of one; seen by all |
| `inbody` | `bodyEst.ts` | an InBody sheet `{date, muscle_kg, smm_kg}`: the admin's (`record.ts inbody`), slot per person and day |
| `pack`, `pack_chk`, `pack_reset`, `trip_note` | `pack.ts` | the packing list ([travel.md](travel.md#packing-list-relay)): items anyone's, ticks each person's; `trip_note` a trip's [private values](travel.md#private-values), never in the repo |
| `wtask`, `wdone`, `wconf`, `wnote` | `wedding.ts` | [the wedding board](wedding.md#the-record-relay) |
| `todo` | `todo.ts` | [やること](todo.md), anyone's; due, reminder ([Reminders](todo.md#reminders)) |
| `hike`, `hike_trk` | `hike.ts` | [トレイル](hiking.md)'s own hikes, anyone's; one track, gone with it; YAMAP links read by `POST /hiking` (`hikeRoute.ts`, no write) |
| `hike_start` | `hikeStart.ts` | a trail's [start time](hiking.md#start-time) `{slug, hm}` ('H:MM' or null: the plan's), anyone's; a slot per slug, the latest to arrive |
| `check` | `checks.ts` | [the daily checks](design.md#daily-checks): a member's own, a slot per sender, day and check |


<a id="pref"></a>**`pref`** `{key, value, person?}`:
- Cosmetic: `locale`, `villagerName`, `villager`, the look ([The look](#the-look)), `menuOrder`,
  `menuHidden` (`menu.ts`), `tentFavs` (`tent.ts`).
- Goals, one key per charted metric (`goals.ts` GOALS). **Per day:** `stepsGoal`, `moveGoal`, `exerciseGoal`,
  `standGoal`, each with an optional `day` (`goalDay`). **Latest only** (or null): the からだ goals and the meal log's.
  `goalWeightFrom` (a day or null): the pace's start, set once. **Each person's own** (the user, 2026-11-24): a
  goal naming another is `forbidden` (`not your goal`); older rows stay.
- The profile (`profile.ts`, [design](design.md#profile)): `sex`, `birth`. **Shared by all three** (`rowsFor`):
  each person's reaches every phone; a row naming anyone else (the guest's sent by a member) reaches none.
  **Locked:** the record refuses every profile pref (`forbidden`, `profile locked`): a change is a code change.
  A `load` too: it skips a `pref` of a key not in `PREF_KEYS` and a profile row whose slot
  holds one (`refused` in its reply, logged `load refused`); an empty slot, restored.
- Island-wide: `weatherMode` and `seasonLook` ([The real weather](#the-real-weather)).

**Subjects and new keys:** `person` (whose goal; absent = the sender) only on the goal and profile prefs
(`eventSubject`); the row's `person` column is always the sender. **A new event type, pref key or field deploys the
relay first**: the record refuses what it doesn't know, and an older app ignores such a row. There are no health-data
events ([design.md](design.md#health-data)).

### The look
Each person's avatar ([players.md](players.md), `contract/look.ts`): an NH human player from parts, or their roster
villager. Two prefs, the sender's own, neither private: `look` (null or unset is **いつもの**, `DEFAULT_LOOKS`, never
stored) and `savedLooks` (the コーデ, ≤ 20). **Reading** (`resolveLook`, `readSavedLooks`) goes part by part, so an
unknown or broken field falls back alone.

## API
`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `forbidden` · `bad_request` · `too_large` ·
`busy` · `unavailable`. Body cap `MAX_BODY_CHARS`.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?, wallets?}`: a repeated `id` is acked as a duplicate before any check, so retries are safe |
| `events` | `events: [{id, type, data, group?}, …]` (≤ `EVENTS_MAX`; a group ≤ `GROUP_MAX`) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}], wallets?}`: each as `event` would, in order, `at` its stored row's |
| `snapshot` | `since?` (the max `at` cached); `page?` (≤ `SNAPSHOT_PAGE_MAX` rows), `after?` (the last page's `next`) | `{ok, me, now, rev, rows:{metrics, events}, next?, wallets?}`: compact arrays in column order, rows with `at > since`, paged in (at, table, seq) order while `next` comes |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build}` (the deployed commit, as `/health`'s `sha`; `dev` unstamped) |

**`wallets`** ([The ledger](#the-ledger)): `{A?: {h, seq}, B?, G?}`, everyone's. On a first fetch and on
a page with rows (a poll with nothing new reads nothing); on an ack, the wallets its ledger events may have moved
(the sender's for a tally, give-back, shop or field event, kept or refused; each recipient's for an `sg_reward`).

<a id="groups"></a>**Groups:** the events of one `group` (the shop's 全部, a room's whole change) are all or none in one
transaction: a piece already owned is refused `owned` alone, any other refusal rolls the lot back (`detail: 'group'`);
a retry of a kept group is all duplicates.

## Auth and limits
- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time. `KEY_A` and `KEY_B` also derive the secret that signs
  `/admin` (never `KEY_C`; `relay/src/sign.ts`: the derivation, the headers, the 5-minute window): a rotation
  updates the admin tools' keys file too ([runbook §3](ops/runbook.md#3-rotate-a-key)). `PLACES_KEY` signs
  the places pull's (`PLACES_OPS` only, each signature once, audited `by: places`).
- **Rate limit:** `RATE_PER_MINUTE` (120) requests per key a minute, in the record's memory; over it, `busy`. A
  snapshot's later pages have their own `PAGES_PER_MINUTE`.

## Record state
The `meta` table keeps `last_at` (the next `at` is max(now, `last_at` + 1 ms)) and `rev`. A Durable Object runs one
request at a time and each write is one SQLite transaction, so a snapshot never sees half of one; an ack is sent only
after its commit.

## Revision
`rev` is the record's epoch (`e1`, `e2`, …), changed only when the record is rebuilt (a restore, or `node
scripts/record.ts rev`). A new epoch, and a `load` that added rows, send `changed`. A `snapshot` whose `rev` or `me`
differs from the cache's makes the client drop the cache (never the unsent queue) and fetch everything. Nothing edits
the record by hand.

## Ingest
`relay/src/parse.ts` (its header: the fields, the bounds, the steps' max of two devices, body fat as a fraction):
newline-joined Text lists, one line per day ([shortcut §1](ops/shortcut-health-sync.md#1-what-the-shortcut-sends)).
A bad line is skipped with a warning, a list of the wrong length dropped; a body with none of the fields is
`bad_request`. **A date repeated** in `dates` (a time-zone change) keeps an activity metric's largest, a weigh-in's
last. A run whose write throws still leaves an `error` audit row and answers `unavailable`. Body metrics never earn.

**Latest wins:** a row is appended whenever a value differs from the last for (person, date, metric). One exception: a
`0` for a **past** Tokyo day whose latest row is above 0 is **held, not appended** (a run that read nothing, Health
locked, would rewrite the history): kept in `metrics_held`, never served; the admin promotes a real correction
(`record.ts held`, `promote`: [runbook §9](ops/runbook.md#9-the-record)). The model reads a day's latest row; a locked
week as of its lock (Wednesday 04:00).

**A day without the Watch:** its `0` is stored as sent; the model reads it as no data for Move, Exercise and Stand
(`model/health.ts activityOn`, [decisions](decisions.md#no-watch-days)). An empty line writes no row (`skipped`).

## Client sync
`lib/sync/` (storage, transport, pairing, queue, cache, the live socket) and `lib/store/` (the week store, actions,
`live.ts`, `view.ts`, `synced.svelte.ts`, the demo backend, loaded only in test mode).

### Storage keys
`sync/storage.ts` registers every key (the live `island.*`, the demo's `island-demo.*`). If storage fails the data
lives in memory for the session, with a banner once. Pairing as another person clears the cache, queue and acked list.
`sync/transport.ts` `post()` never throws (network failure `offline`; timeout, non-2xx or non-JSON `unavailable`).

### Snapshot cache
`sync/cache.ts`: the rows in IndexedDB (else in memory), in **segments** so a save rewrites only what changed;
anything unexpected reads as no cache (a full fetch). A refresh fetches `SNAPSHOT_PAGE` pages after `since` and applies
them together (`fetchPages`: a failed page leaves the cache as it was, a new epoch between pages starts over). The merge
(`model/snapshot.ts`) dedupes by natural key and orders by `at`; rows that only append fold over the last State
(`model/state.ts foldRows`). Overlapping refreshes share one request; a reply after a re-pair is dropped.

### Compaction
On each merge `model/compact.ts` drops the `metrics` rows of locked weeks the model can no longer read
(`model/compactKeep.ts`), a replaced `tally`, the `food*` ops the fold no longer reads (`model/food.ts
foldedAway`), and a removal past 60 days with its slot's earlier rows (`expiredRemovals`). The record keeps every Health row ([The record](#the-record) "Health rows").

### Write queue
`sync/queue.ts` (its header and constants): events in `island.queue`, sent in order until acked, in `events` requests
answered by id; a request refused whole (or HTTP 413) is halved, one event alone so refused is set aside.

- **Paced** (`store/live.ts SEND_PACE_MS`): a send right after a flush waits for one trailing flush. **Day rows** (`tally`,
  `island`): a newer row of the same day replaces the queued ones.
- **Set aside** (`parked`, `PARK_AFTER`): an event the record keeps failing stops blocking, is logged `queue.poison`
  and is never dropped; a sync tap tries it again. Unsent 2 minutes past its hold, it shows on the sync chip and in 設定.
- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back;
  `replaceHeld` swaps its data (its id kept, never once tried); a later event on the same spend never overtakes it.
  A group goes once none of it is held, in one request.
- **Replies:** acked → `island.acked` (in the view until a snapshot holds it); `bad_request` / `too_large` → dropped
  with a message (an older relay's too: runbook §8's guard); `unauthorized` → pairing; other errors keep it
  and all after it (`backoffMs`). Retried on a sync tap, a show, the socket's welcome (≤ once per 30 s), `online`.
- **Hidden:** the held day rows go at once, `keepalive` (a phone locked), even mid-flush (its batch again), as a flush.

### Optimistic view
`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. Recomputed on every change and each minute
(not while hidden). The `food*` rows stay raw (`model/state.ts` RAW_EVENTS) till the food sheet parses them.
- **かいがら, the pocket, the pieces, the ずかん's counts** (`model/shop.ts shopView`, `model/tally.ts zukanTotals`):
  [the stored ledger](#the-ledger)'s parts the cache keeps (each part's highest `seq`: `sync/wallets.ts`) plus this
  phone's **unsent** rows (shop, tally, field) stepped as the record will (`contract/ledger.ts`); a reply without
  `ledgers` (an older relay): the fold, the wallets' `h`. A queued buy refused `wallet short`: its own toast.

<a id="live-sync"></a>
### When it syncs
On launch (after painting from the cache), becoming visible (≤ every 30 s), a sync tap, `online`, and the relay's
`changed` ([Push](#push)); each refresh flushes the queue, then fetches (waits: `store/live.ts`'s constants). A launch,
a show or `online` waits briefly for the `welcome`: when the cache has its `rec {at, rev}` and is recent, it only
flushes (after a failed fetch, `online` fetches). Every welcome whose `rec` is past the cache fetches
(`e2e/live-sync.spec.ts`). An ack's stored row (its `at`) goes into the cache at once; only a duplicate's ack is
followed by a re-read. A failed fetch with the socket up is retried after 10 s, 30 s, then every 60 s (`FAIL_RETRY_MS`).

**One device, one socket:** each hello names the device and tab (`dev`) and replaces only that tab's earlier socket
(4002); the person's other devices hear their decor ops live, and only the writing page skips its own `changed`
(`sid`). **Two tabs** of one browser are two devices; the synced stores (`store/synced.svelte.ts`) merge storage
before they write and fold the other tab's writes from their `storage` events.

**Conflicts:** every op merges commutatively per id (`at`, then who); two layout pieces moved onto one tile at once
are settled by the later op's phone ([island-layout.md](island-layout.md#ops-the-record-and-the-relay) "Two edits on
one tile").

<a id="the-record"></a>
## The record
- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime; its header: the clock, ids, slots, the
  shop's cover, `since`) in `IslandStore` (`idFromName('record')`, `storeObject.ts`). Tables (`SCHEMA`): `metrics`,
  `events`, `ids` (every event id ever accepted), `uploads`, `meta` (`last_at`, `rev`, `schema_v`, the running
  ledgers), `metrics_latest`, `metrics_held` ([Ingest](#ingest) "Latest wins"), `share*` ([travel](travel.md)).
- **Schema:** `SCHEMA` (`IF NOT EXISTS`), then `MIGRATIONS`, each step and its mark one transaction; a change is a new
  step at the end, never an edit of one that shipped.
- **The Worker's gate** (`storeRoute.ts keyGate`): the origin, method, size and a person's key in the body (a bounded
  scan, not a parse), else `unauthorized` there, so a stranger never costs a Durable Object request.
- **Rules** (`app/src/lib/contract/record.ts`): the shape checks (`validEventData`; the shop's prices in
  `contract/shopCheck.ts validEvent`, the relay's only, so they stay off the phones' first load); an event id once,
  forever; **slots**, a later event of a slot replacing it (`eventSlot`, and the per-id ops' `decorAccept`,
  `foodAccept`, …); a pref the model ignores takes no slot.
- **Running checks:** the shop's against each person's [stored ledger](#the-ledger) and the
  field (meta `farm|g<growDays>r<regrowDays>`: a growth-rule change folds it again by itself, with the full fold, as
  does a start that finds another relay's copy: a rollback's); `shopcheck {fix?}` compares it with the full fold. A
  decor op's against its own slots and the caps' counts (meta `decor_live`; `decorcheck {fix?}`); a reset drops the
  voided rows (`dropVoided`).
- **`since`:** from the `at` index; a row that arrived out of `at` order (an import's) is `late`, and a poll returns
  late rows too (`LATE_MARGIN_MS`).
- **Admin:** `POST /admin`, signed (the secret above; a `restore`, `rev` or `logpurge` taken once
  per signature, `admin_seen`). Its ops: [runbook §9](ops/runbook.md#9-the-record) (`load` by the same rules,
  idempotent: `test/restore.test.ts`).
- **Push-driven:** after a write the object tells the room ([Push](#push)), which keeps the last `rec {at, rev}` for
  each `welcome`.
- **Health rows:** every `metrics` row is kept, never compacted or pruned.
- <a id="the-ledger"></a><a id="the-wallet"></a>**The stored ledger** (`ledger.ts`, `contract/ledger.ts`, since 11-24):
  `ledger` rows per person and part (`hp` かいがら + pocket, `w` pieces with their time, `g` games, `z` the ずかん
  totals; `F|field` the field's plots, a reply's `field`), each with `seq`, `at`; judged and stepped by each op in its transaction (seeded from the rows' fold at a
  person's first), never below 0, never folded again; a give-back after a sale owes nothing. `ledger_log`: each op,
  かいがら before/after, 60 days. Replies' `ledgers`: a snapshot's parts changed since (all at first, the last page),
  an ack's moved; `wallets` (`hp` h, seq + 10⁶) for older builds. 03:00 `ledgercheck`: the log's chain, the fold. `ledger_retire` (its confirm, no drift): the shop's and farm rows and tallies past 36 days go
  (ids kept), a new epoch; then the 03:00 prune keeps new shop rows 2 days, as do the phones' caches. Tests: `ledger.test.ts`.
- **Snapshot size:** a year of three people is ~50–100k rows (~3–6 MB of JSON): paged.
- **A restore** (`restore {bookmark}`): every `/api` request is `unavailable` until the restart, so no write is acked
  and then dropped; a new epoch. Backups: [runbook §6](ops/runbook.md#6-backups).

## Live relay
Presence between the phones while the app is open (decisions: *Live relay on Cloudflare*). The room carries intents,
never data of record: the record still catches an offline phone up.

- **Where:** `relay/` (its own package): a Worker (`src/index.ts`) and `IslandRoom` (`idFromName('island')`,
  `src/room.ts`) at `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy,
  `island-fund-relay-test`, with its own secrets, for the smoke test. `GET /health` → `{ok, v, versions, sha, t, wx}`
  (`sha`: the deployed commit); `POST /api`, `/admin`, `/log` ([observability](ops/observability.md)); Workers AI,
  a person's key only, spend counted a day: `POST /stt` ([speech-test.md](speech-test.md)), `POST /grade`
  ([sugoroku.md](sugoroku.md#speaking)).
- **Admission:** `/room` upgrades only from `ALLOWED_ORIGINS` and localhost, with the subprotocols `island-v1` and a
  short-lived HMAC ticket under the person's key (`contract/ticket.ts`, `auth.ts admission`), else 403; a ticketed
  hello must be that person's. A phone clock over 5 minutes off has no live socket.
- **Auth:** the first message is `hello {key, since?, beat?, dev?, b?, pr?, sv?}`; the room compares the key in constant time
  and answers `welcome {me, peer, t, rec?, here, gone?, hb?, mine?}` (`rec`: the record's last change; `gone`: when
  each person's last socket closed; `mine`: another device of mine is here).
- **Close codes:** 4001 bad key, 4002 replaced by the same device's newer socket, 4003 no hello within `HELLO_MS`,
  4004 an unknown `v` (a bump: [decisions](decisions.md#relay-versions-side-by-side)). The phone's: 4000 a ping
  unanswered, 4010 no welcome within `WELCOME_MS`.
- **Protocol** (`app/src/lib/contract/live-protocol.ts`: both sides' parsers, each field's bounds): JSON, `LIVE_VS`, ≤
  `MAX_BYTES` (a `replay` ≤ `REPLAY_BYTES`). Client intents:
  - The shared world's, kept for the day ([Shared world](#shared-world)): `walk`, `act`, `catch`, `world`, `pick`,
    `put`, `shake`, `decor`.
  - Presence only: `drag`, `tent`, `fish`, `say`; `highfive`, held a day for an away recipient
    ([decisions](decisions.md#a-high-five-goes-over-the-relay-only)); `music` ([sound-sync.md](sound-sync.md)); `saved`,
    `ping` → `pong`, `got`.

  Relay-only: `changed`, `wx`, `presence {who, on, re?}`, `ver {who, b?, pr?, sv?}`, `replay {es}`, `ack`, `busy`. The room stamps its own `who` and
  `t` (strictly increasing) and relays to the others; a `decor` op also to the sender's other devices.
- **Acks:** an intent may carry `c`; the room answers `ack {c, t, ok}` (`ok` false: the world refused it, a claim
  already made) after its write (an ack is durable). A resend of a kept or recently acked intent is acked again, never
  relayed twice.
- **Heartbeat:** `{"v":3,"kind":"hb"}`, answered by the runtime (`setWebSocketAutoResponse`), so it never wakes the
  room. A hello with `beat: true` beats after 20 s of silence; the room closes a socket silent for `SILENT_MS`
  (`sweepSilent`, its alarm following it), stamped gone at its last beat.
- **Rejoins, older pages:** `room.ts Pres`, `sync/live.ts onRejoin`; `live-protocol.ts LIVE_REV`, `ui-state/peerVer.ts`.
- **Limits:** a token bucket per socket (`relay/src/bucket.ts`); beyond it messages are dropped, a numbered intent
  hears `busy`. **Replay:** a hello with `since` gets the day's newer changes after the welcome.
- **Cost:** hibernation: an idle socket keeps no object in memory ([budget](ops/observability.md#request-budget)).
- **Client** (`app/src/lib/sync/live.ts`, `liveRelay()`: its header and constants): one socket while visible and
  online, parked after 4001/4002/4004 until shown again; the clock from the shortest recent ping (`serverNow()`); what
  the room keeps waits in the outbox (localStorage) for its `ack`, resent after a reconnect, dropped after 4 tries.
- **Measured:** the relay's latencies, in [perf.md](ops/perf.md) "Measuring".
- **Tests:** `relay/test/`; the app's `live-protocol`, `live`, `live-room` (the real room), `store/push` tests.

## The real weather
Tokyo's sky by the hour for the island ([design](design.md#weather); decisions: *Weather from Tokyo, by the hour*).
`relay/src/weather.ts` (its header and constants: the fetch's timing, the hours kept, the locks, the dead bands, the
backoff), `weatherTick` (`relay/src/index.ts`, the cron at :15 and :45, and a hello when due; the test copy has no
cron), the phones' `sync/wx.ts` and `world/weather.ts` `realWeatherAt`.

- **Source:** Open-Meteo's forecast, JMA's models (`models=jma_seamless`), for one point (`wrangler.toml` `WX_LAT` /
  `WX_LON`). No key, CC BY 4.0, credited in 設定; no phone calls a weather API. JMA gives no snow, fog or thunder codes
  for Tokyo: snow comes by temperature.
- **The timeline** (`live-protocol.ts Wx`): a sky an hour, 12 back (the rainbow looks back) and 36 ahead, the foggy
  hours and the day's high (しずえ's news); the response checked strictly, so bad data never replaces good. An hour
  that has begun keeps its sky, so a phone that cached it shows the same as one online. A failure keeps the timeline
  and logs `wx-fail <why>`.
- **To the phones:** `wx` after the welcome (while the timeline serves) and on each `rev`; cached as `island.wx`. In
  ほんもの mode (`pref weatherMode`) the hour's sky is the timeline's while it serves, else the seeded day's; winter's
  snow, the fine event nights, fog, aurora and rainbow are the phone's rules. `pref seasonLook` (設定 → 季節):
  `{event, season, weather, tod}` or `null` (自動). Weather is never written to the record; only the mode is.
- **Ops:** `GET /health` → `wx {at, src, age, hours, fails}`; the signed `/admin` op `wx` refreshes, puts a fixture in
  (the smoke test) or reports.
- **Tests:** `relay/test/weather.test.ts` (recorded responses against golden timelines), `room.test.ts`; the app's
  `island/realWeather.test.ts`; `e2e/realweather.spec.ts`; `npm run smoke`.

## Saved places
行きたい場所: the shared Maps list. `relay/src/places.ts`, `contract/places.ts`, the record's `places` table
(MIGRATIONS 8, 9; dumped), the only copy.

- **The list** (`PLACES_LIST`): read only by `places-pull.yml` on GitHub Actions (runbook §9; Google blocks
  Cloudflare): the newest 50 a run, the whole once in 20 h, into admin `places_ingest`. `POST /places/sync`: the status. Keyed by the cid; refused: a short answer, > 1 % without coordinates, a full read dropping
  > 20 %.
- **Categories** (`PLACE_CATS`): rules (~43 %), then Workers AI (the `/grade` model; names and
  areas), 2 × 25 each cron tick (:15/:45).
- **Hours**: OSM's Overpass, from GitHub Actions (`places-pull.yml`, `record.ts places-osm`: it refuses Cloudflare);
  matched within 60 m by name (`nameSim`; a miss clears it); `opening_hours`' common forms as periods.
- **API:** `GET /places[?since=<ver>]` (any key): columnar (~200 KB br), a delta its rows and `gone`;
  the same for every key. `GET /places/status`.

## The guest
A third player (2026-11-24; [design](design.md#the-guest), [decisions](decisions.md#the-guest)): one key, `KEY_C`
(unset = no guest), who `G`, every rule everyone's but (`contract/guest.ts`):

- **No body data in** (`rowsFor`): the guest's snapshot and deltas carry the activity metrics only (no weight, body
  fat, BMI, lean mass), no InBody sheet (`inbody`) and no からだ goal (`goalWeight` … `goalSmm`, `goalWeightFrom`).
  Its `ingest` and `uploads` (the members' Health) are `forbidden`.
- **Writes** (`guestMayWrite`): anything by the record's usual rules but a からだ goal (`forbidden`; the queue drops
  it). Its ベル wallet earns none (no Health data), so a buy of its is never covered (`model/bells.ts walletAt`); the
  harvest's ceremony is the members' wallets' (its tap counts for nothing). Rows are `person = G` (merge order A < B < G).
- **The room:** the same as a member's. `peer` is the partner for a member and either member for the guest; a
  high-five names whom it is for (`to`). Of the members' notices it hears an event's, an ingest's only when it brought
  activity rows (`notify(n, guest)`), and a new epoch's; its welcome's `rec` is the room's `recG` (`index.ts Marks`).
- **The phones:** a member's draws the guest's villager as a third actor (`ui-state/cast.ts`: `mine`, `partner`,
  `third`; on the guest's phone `third` is B); the guest's phone guards what it sends by the same rules.
- **Tests:** `guest.test.ts` (relay, contract), `e2e/guest.spec.ts`; `npm run smoke` with `KEY_C`.

## Ambient life
What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug) is
decided per 10-second slot of the Tokyo day from the date, the slot and the shared world, so every phone computes the
same island without a message (decisions: *Ambient life from the clock*). `app/src/lib/components/island/ambient.ts`
(pure; its header: the odds, the reach); `motion/idleLife.svelte.ts` and the critters play it.

- **Clock:** `slotAt(ms, offset)` on the island's clock (`clock.ts now()`: a `?date=` preview moves the slots) plus the
  relay's offset (`ambientClock.ts relayOffset`). A slot plays `DECIDE_MS` after it starts (an intent sent before it
  is in).
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")`; species by the sky at the
  slot's start (`weather.ts yieldSkyAt`).
- **Villagers** (`villagerBeats`): one beat a slot (an idle move, an outing, one out at a time, or a chat or dance for
  two free ones). A sleeper is never free; one whose person is here, or the guest's, makes no outings. **Visitor:** `beat(r)` (`visitorLife.ts`), skipped while it speaks.
- **Positions** (`ambientPlan.ts`): a villager no phone moves (woken, its person away) and the visitor
  (`strollTrack`) stand where shared inputs put them, synced every slot, played or not; day scores once settled.
- **Critters** (`spawnsIn`, `crittersAt`): chained per 10-minute block, so a phone opening mid-stay finds the ones
  still there; id `<kind>:<slot>`.
- **Agreement:** the same inputs give the same slot (`ambient.test.ts`); phones differ only where their inputs do (a
  clock past the margin, the camera). What a person does by hand plays on their phone; its outcome is shared.

## Shared world
Every phone shows the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*;
the look: [design](design.md#shared-world)): what comes by itself is [Ambient life](#ambient-life); what a person does
is a small intent over the relay, kept by the room for the day, folded by every phone into the same day.

- **The day** (`sync/world-day.ts`, pure): a `WorldDay` folded from the day's intents in the relay's order: claims,
  puts, shakes, watered cells, wishes, each person's last walk. First wins: the relay drops a later claim. Claim ids:
  `live-protocol.ts claimOf`.
- **A race lost:** what my claim put in my pocket comes out again (`world.lost` → `store/actions.ts lostRace`), with
  「〇〇が さきに とったよ」: from the held or queued tally, or by a `tally_back` once it went. Today's counted claims
  are kept (`island.counted`), so this works after a reload. **A refused claim** (`ack {ok: false}`) is a race lost
  the same way.
- **The store** (`store/world.svelte.ts`, `world`): today's day in localStorage (`island.world`); `share(intent)` folds
  my change (refused when someone already has it) and sends it at once; `on(fn)` the others'.
- **The room** (`relay/src/room.ts`): the last `RING_MAX` changes and each person's last `walk` in one storage value
  (`ring`); the day's claims and each tree's last nest apart (`day`), so neither a trimmed ring nor a hibernation lets
  a claim be made twice (`NEST_GAP_MS`). [英語すごろく](sugoroku.md#online)'s moves (`sg`) are kept apart from the
  ring, a row each (`sg:<game>:<i>`, `sg:<game>:e`), folded into the game's row (`sg:<game>`) every 32 and at its end;
  read only when a hello, move or view needs them. Moves in order, the first of each `i` only (else `ack {ok: false}`),
  nothing past the earliest end; sent to the game's seats only. Replayed at hello after `since`, and the hello's own
  game (`sg: {g, n}`) from move `n` whatever `since` (midnight); a game goes 2 days after its last move, past 12 the
  one left longest.
- **Test mode** (`sync/live-local.ts`, [testing](ops/testing.md#test-mode)): the players are tabs of one browser (`?demo`, `&as=B`, `as=G`), a
  BroadcastChannel the room, so the two-player e2e run without a network.
- **The record's day row** (`island` event, `store/actions.ts sendIslandDay`): my part of the day, sent whole when it
  grows, held 2 minutes; the store folds in today's, yesterday's watering and the wishes for the mornings to come
  (`applyRow`).
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each phone moves its
  own villager; every walk and put goes as the walk itself on the relay's clock, and the partner's phone plays it from
  the same start: a small gap walked off, a bigger one glided (`JUMP_U`, `GLIDE_MS`), never a jump in view. A phone
  gone leaves its villager where it stood, across days ([decisions](decisions.md#a-villager-stays-where-it-was-left)).
- **Sleep** ([design](design.md#sleep)): a villager sleeps while its person is offline (`ui-state/presence.ts`
  `GRACE_MS`). A wake is `act {act: wake, id, at}`, kept in the day (`playWake`); Gulliver's is `world {op: woke, id:
  gulliver}`.
- **The decorations** (`store/decor.svelte.ts`): each change one `decor` op, to the relay at once and to the record's
  queue, merged by id; my op's `at` on the relay's clock.
- **Checked** (`e2e/sync-harness.spec.ts`; against the test relay with `RELAY_E2E=1`): after a scripted session every
  phone, a late one too, has the same canonical day (`world-day.ts canonical`), decorations and villager points;
  `world-day.test.ts` adds conflicts, a dropped socket and a late join on the real `RoomCore`.

## Push
While the app is on screen, a change to the record reaches the other phones in well under a second (decisions: *Push
through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches up a phone that missed it.

- **Record → room:** after a write that added rows (never a duplicate, refusal or read), the record calls the room
  (an RPC, after its commit) with `{what: 'ingest'|'event', who, at, rev, sid?}`. `npm run smoke` times an ingest →
  `changed`.
- **Relay → phones:** `changed {what, who, at, rev, sid?, calm?, t}` to every socket, the writer's too (a
  Shortcut upload reaches its own phone), the guest's only of what it may see; the last mark is the welcomes' `rec`.
- **The nudge:** after an ack the phone sends `saved {}`, relayed like any intent, until a `changed` has reached it
  this session.
- **Client** (`store/live.ts`): `onChange` → one `refresh({fresh: true})` after `PUSH_GATHER_MS`, skipped when the
  cache has it and for this page's own `event` (`sid`); my other devices' wait till they pause (`MINE_WAIT_MS`), so the
  editor's burst of writes from the Mac is a few fetches, and so does a partner's `calm` run (only events the island
  doesn't draw: live-protocol.ts CALM_EVENTS, the meal log, `listen`, packing, the wedding board; `CALM_WAIT_MS` 10 s).

## Service worker
`app/src/service-worker/` (pure rules and every cache's bound in `caches.ts`).

- **Notifications** (opt-in: 保養所 and やること, [decisions](decisions.md#no-notifications); `notify.ts`): `push`
  shows the sender's title, body and `tag` at once, nothing fetched first; `notificationclick` focuses a window (`{k:
  'open', to, list?, item?}`) or opens `?open=…` (`bots/open.svelte.ts`). One subscription, `lib/push/phone.ts`'s.

- **Registration:** by the app (`lib/ui-state/swLate.ts`) once the 3D island has its models in or can't draw (30 s at
  the latest), so a first visit's precache never competes with them; the page then posts its resource timings' URLs
  (`warm`) and the worker keeps their models and art from the HTTP cache (`caches.ts warmable`).
- **Install:** once the launch beside it is over (`launchDone`: the worker in control says so, 6 s at most), precaches
  the built JS/CSS and `caches.ts precachable` (the rest on first use): the hashed chunks all or nothing, the static
  files by content hash (`installStatics`). Chunks import each other by a stable key (the import map), so a deploy
  refetches only the chunks that changed.
- **Activate:** keeps the current shell, the newest older one and each open page's (`staleCaches`: each page says its
  build, `live`; one not said yet: the newest older alone, `SHELLS_UNSURE`), the runtime caches and the saved areas;
  deletes the rest, and font slices no style sheet names (`staleFonts`); an older shell no page runs goes once this one
  is whole (`dropOlder`). No event of the old worker's waits on a bounded cache's index write (`bounded.ts`).
- **Navigations** (`caches.ts checkShell`): with this version's shell cached, that shell at once, every chunk its own;
  the network's page (the navigation preload's) read in the background (`CHECK_MS`) only to learn the deployed build:
  another (`new`, taken at the next hide), this one (`same`), late (`cache`; offline none); none (`skip`) within
  `FRESH_MS` of `__fresh` (perf.boot `shell`, asked of the worker at the report: `net`). No shell of this version yet:
  network first, the newest older shell offline or after 3 s (`fromOlder`; never `caches.match`: the oldest).
- **Boot watchdog** (`ui-state/bootWatch.ts`, inline, its CSP hash: `scripts/headers.ts`): a page an older worker
  booted from the network (`shell` net, till 11-21) that doesn't start reloads once at `?shell=cache`. Goes once no
  perf.boot says `net` for a week (perf.md W4).
- **Newer worker, older page:** a deploy's worker claims the running page as it installs; the page takes the build at
  its next hide. A worker change must serve the previous build's page (messages, cache names, fetch rules), else bump
  `COMPAT`.
- **Updates** (`ui-state/update.ts` header, `reload.ts`): a running page takes a deploy only as it is hidden with
  nothing open, but for an incompatible build (version.json `compat` past `contract/compat.ts COMPAT`: bump it for a
  protocol or stored-shape change); once a version a session. `e2e/sw-update.spec.ts`.
- **Packs** (the players'): fetched whole (Pages answers a Range with the whole file), one fetch at a
  time a URL (`fetchShared`).

| Cache | Holds | Rule |
|---|---|---|
| IDB `island-files` room | models, players' parts, packs (`blobCache.ts`) | cache-first, outlives builds; a file's older `?v=` dropped at once, a `.pak` unused `PAK_UNUSED_MS` (7 d) or any other file `ROOM_UNUSED_MS` (14 d) dropped, then LRU past `ROOM_CAP_BYTES` or `ROOM_CAP_N` (1,000), never one used within 3 d (`roomEvict`; at most `EVICT_MAX` deletes a write, `bounded.ts`) |
| IDB art | villagers', critters', finds', ground's and decor's art | LRU by bytes and count (`artEvict`) |
| `island-audio-v1` | sounds and music | cache-first, never revalidated, an LRU per class |
| `island-food-v2`, `island-food-img-v1` | the food data, ごはん's pictures ([food-data.md](food-data.md#pictures)) | cache-first by version, `index.json` network first, LRU by bytes and count (`foodImgEvict`) |
| `island-english-v1` | English Study's banks ([english.md](english.md#data)) | cache-first (the name carries the version), never precached; a clip's older versions dropped, then the first stored past 400 (`englishEvict`) |
| `island-photos-v1` | photos | stale-while-revalidate once a day old (`swrFetch`), `PHOTO_CAP_BYTES`; a failed one is the paper placeholder (`ui/photoFallback.ts`) |
| `island-tiles-v1` | OpenFreeMap, USGS, GSI tiles | stale-while-revalidate past `TILE_FRESH_MS`, bounded by bytes and count (`bytesEvict`); fetched by the page (`components/map/tiles.ts`: WebKit's worker doesn't see MapLibre's worker's fetches) |
| `island-offline-<id>` | a saved map area and its manifest | kept until deleted on the phone |
| `island-map-meta-v1` | OpenFreeMap's TileJSON | network first past an hour, never evicted |
| `island-fonts-v1` | the map's font slices | cache-first, outlives builds; files no style sheet names dropped (`staleFonts`) |

IndexedDB: `island` (the record cache, `sync/cache.ts`), `island-tex` (processed textures, `world3d/texCache.ts`) and
`island-fields` (the ground's fields, `layout/fieldsCache.ts`).

Fonts and art are cache-first; other GETs: this version's cache, the older shells, the network. The relay is
cross-origin and always live.

- **Offline:** what a phone has shown once reads offline; nothing is prefetched unasked (`e2e/offline.spec.ts`
  checks each kind). Precached (`scripts/load-budget.ts` `PRECACHE`): the app's six font files
  (`PRECACHED_FONTS`), each trip's cover and the trail tracks. MapLibre and what a phone may
  never open (vite.config.ts `feature-names`) go into this version's shell when first loaded and are carried on by each
  install (`carryPlan`); offline they import only if a shell holds them (`components/map/cached.ts`), else
  オフラインです. The installed app asks `navigator.storage.persist()` once, after its first good sync
  (`sync/persist.ts`).
- **Saved areas** ([design](design.md#offline-maps)): `lib/offline/plan.ts` (pure) sizes an area by measured means per
  source and zoom (offline-measure.ts `--full` at the `probes` tag; within ±20 %, plan.test); `lib/offline/save.ts`
  fetches it with a manifest, resumable (「一部のみ」); caps `OFM_MAX_TILES`, `OFM_MAX_BYTES`, `TOTAL_CAP_BYTES`;
  `island.offlineAreas` mirrors the manifests, so an area Safari evicted shows 「消えました」.

## Tests
`relay/test/` (the record on node:sqlite); the app's queue
(`queue-batch.test.ts`), cache, sync and store tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and `npm run bench` for the model at year-3 volume
([perf.md](ops/perf.md) "Budgets").
