# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the live room, and the client's sync. The contract (tables, row
tuples, reply shapes, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the
client. The relay imports from the app only `app/src/lib/contract/` (`record.ts`, `live-protocol.ts`, `log.ts`, the
ops' shapes), which reaches only itself, `types.ts` and `random.ts` (`deps.test.ts` "the relay boundary"). Operating
it: [runbook](ops/runbook.md); its log and costs: [observability](ops/observability.md).

## Overview

The record is an append-only log with slots (a later tally of the same day replaces the earlier one, and so on): the
relay's `IslandStore` ([The record](#the-record)) is its only reader and writer. It authenticates, validates shapes,
stamps `at` and appends; no server-side economy or config: the client caches the rows and derives every number on
read. User actions are `event` rows sent through a persisted queue and shown at once; health data comes from each
phone's Shortcut (`ingest`). Backups: point-in-time recovery and the dump ([runbook §6](ops/runbook.md#6-backups)).

The relay is one Worker with three SQLite-backed Durable Objects (`relay/wrangler.toml`): `ROOM` (`IslandRoom`:
[Live relay](#live-relay)), `STORE` (`IslandStore`, the record) and `LOG` (`IslandLog`:
[observability](ops/observability.md)); it also serves `/stt`, ききみみ's recogniser ([kikimimi-mic.md](kikimimi-mic.md)).

<a id="tabs"></a>
## Tables

The record's tables ([The record](#the-record) "Where"). `at` is the record's time, ISO 8601 UTC with milliseconds,
strictly increasing (all rows of one ingest share it). Dates are `YYYY-MM-DD` (Tokyo).

| Table | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit: `ok` / `partial` / `error`, size, warnings and the body's shape (never the body or key); 60 days |

`metrics` and `events` are synced to the client; `uploads` only by the `uploads` action.

## Events
Exactly the types in `EVENT_TYPES`; another type or a bad shape is refused with `bad_request`. `data` is an object,
≤ 20,000 characters as JSON (a `wnote`'s 140,000; past either `too_large`); each field's exact bounds and each op's
merge are its `contract/` module's (header and constants). The record checks shapes (and a spend's item and price,
`SHOP` in `contract/rules.ts`); wallet cover is a read-time rule in the model. **Ops with a sender's clock** (`decor`,
`board`, `food*`, `pack*`, `wtask`…: `at` in ms on the relay's clock) are refused more than a day past the record's
(`AHEAD_MS`), which no later edit could beat. **Latest op only:** the per-id ops keep one row a slot, a stale op or
anything after a removal is acked as `duplicate`, and a removal's row is kept for good.

| type | data | Meaning |
|---|---|---|
| `spend` | `{spendId, item, bells}` | a buy with ベル: `snack` 40 or `dinner` 70 |
| `spend_void` | `{spendId}` | either person's undo of a `spend` (the first after it counts; a second is a `duplicate`) |
| `harvest` | `{week}` | a week's harvest, counted only while it's open |
| `find` | `{kind, id}` | the shared ずかん's first find of `kind:id` (`FIND_KINDS`; ids the client's catalog, no relay deploy). Never ベル |
| `tally` | `{date, counts}` | one person's counts of one Tokyo day ([Tally](#tally), `contract/tally.ts`; `TALLY_PAST_DAYS`). Never ベル |
| `pack_chk` | `{trip, id, at, v}` | one person's tick of a trip's item (`contract/pack.ts`) |
| `pack_reset` | `{trip, at}` | one person's 「リセット」 of their ticks |
| `trip_note` | `{trip, at, v}` | a trip's private values ([travel.md](travel.md#private-values)), never in the repo |
| `wdone` | `{id, at, v, imported?}` | a wedding task's tick, shared |
| `wconf` | `{k, at, v, imported?}` | one wedding setting (`WCONF_KEYS`) |

The other types, below. The wedding types are the members' only; `trip_note` too (the guest's are `forbidden`).

<a id="pref"></a>**`pref`** `{key, value, person?}`:
- Cosmetic: `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (a roster id), the look ([The look](#the-look)).
- Goals, one key per charted metric (`contract/goals.ts` GOALS: range, grid, history). **Per day:** `stepsGoal`,
  `moveGoal`, `exerciseGoal`, `standGoal`, each with an optional `day` (`contract/record.ts goalDay`). **Latest only**
  (or null): the からだ goals and the meal log's.
- The profile (`contract/profile.ts`, [design](design.md#profile)): `sex`, `birth`, `bmiStd`. **Private**
  (`rowsFor`): a member's reaches the two members only, the guest's the guest only.
- Island-wide: `weatherMode` and `seasonLook` ([The real weather](#the-real-weather)).

<a id="tally_back"></a>**`tally_back`** `{date, counts}` (`contract/tally.ts backCovered`): what one person gives back
of a day's tally, a claim race lost after that `tally` reached the record ([Shared world](#shared-world)). A catch
already sold when given back **costs its かいがら** (`contract/shop.ts owedOf`) until a later catch covers it; the
wallet may read below 0.

<a id="island"></a>**`island`** `{date, taken, puts, shakes, watered, wishes, at?}` (`contract/island.ts`, never ベル):
one person's part of one Tokyo day of the [Shared world](#shared-world), one row per person and day (`mergeIslandDay`).
Sent only once this session's fetch folded the record's rows in (`week.current`), so a row rebuilt before them can't
erase claims.

<a id="decor"></a>**`decor`** `{id, at, item, x, z, f, p}` or `{id, at, rm: true}` (`contract/decor.ts`): a piece's
whole state or its removal, anyone's.
- **The decorations** ([Decorating](design.md#decorating)): at most `DECOR_MAX` (`decor full`).
- **The rooms** ([The tent](design.md#the-tent), `contract/tent.ts`): `sc` `t` / `u` / `v`, a piece on a tile, the
  wallpaper, floor and size, anyone's in any room (2026-11-10); 60 pieces a room (`tent full`). **A light's switch** is a slot of its own, so a move and a
  switch made at once both stand.
- **The island's layout** ([island-layout.md](island-layout.md#ops-the-record-and-the-relay), `contract/layout.ts`):
  objects, terrain chunks, resets and a home's look; the outdoors and the rooms anyone's, a home's look its owner's (`scopeMayWrite`); at
  most `LAYOUT_MAX` objects (`layout full`). Any lower-case kind passes: no relay deploy.

<a id="board"></a>**`board`** `{id, at, p, t}` or `{id, at, rm: true}` ([board.md](board.md), `contract/board.ts`):
a note's whole text (`cleanText`) or its removal; edits by its author, removals by anyone (`boardMayWrite`),
`BOARD_MAX` kept. No live intent: the record's notice brings it to every open phone (`boardFold`).

<a id="food"></a>**The meal log** (ごはん, `contract/food.ts`): each op an entry's whole state or its removal; anyone
logs their own, only the owner edits or removes (`foodAccept`); everyone sees every meal.
- **`food`** `{id, at, d, m, g, f}`: the day, the meal, grams and the food per 100 g as logged (`foodFold`).
- **`food_repeat`** `{id, at, m, it, w, from, to?, sk?}` (いつもの): a meal on chosen weekdays, read into each day on
  the phone (`model/food.ts foodDay`). **A skipped day stays skipped** (`repeatAccept`).
- **`food_recipe`** (マイレシピ) and **`food_custom`** (マイ食品): anyone logs anyone's, as an ordinary `food` whose
  `f` is a snapshot (`recipeSnap` / `customSnap`).

<a id="shop"></a>**The shop** ([The shop](design.md#the-shop), `contract/shop.ts`): no slot; the guest's too; never ベル;
the phones fold by the same rules (`shopLedger`).
- **`sell`** `{species, n, v}`: from the sender's pocket at its price (`contract/shopPrices.ts`).
  **The pocket is derived**: the tallies' catches less give-backs and sells; past it, `pocket short`.
- **`buy`** `{item, price, d}`: a room's piece from day `d`'s stock (`contract/stock.ts`). **かいがら are derived**:
  sells' `v` less buys' `price` (less what give-backs owe); past them `wallet short`.

<a id="listen"></a>**`listen`** `{d, g, gm?, u?, l?, tm?, lv, n, ms, p?, r}` ([kikimimi.md](kikimimi.md),
`contract/listen.ts`): one ききみみ game's answers of the sender's, written once at the results. **Private**
(`rowsFor`): whole to its owner, a summary to everyone else (`stampsUnit`).

<a id="pack"></a>**`pack`** `{trip, id, at, kind, ord, name, …}` or `{trip, id, at, rm: true}`
([travel.md](travel.md#packing-list-relay), `contract/pack.ts`): a category or an item, any `trip` token; the guest
changes only its own; `PACK_MAX` items a trip (`pack full`).

<a id="wedding"></a>**The wedding board** ([wedding.md](wedding.md#the-record-relay), `contract/wedding.ts`):
**`wtask`** a task or subtask (`WTASK_MAX`: `wedding full`), **`wnote`** the shared markdown, a save from an older base
kept beside the new one (`was`).

**Finds:** the client sends a `find` only the first time anyone finds that `kind:id`; `findsView` (`model/finds.ts`)
keeps the first per `kind:id`.

<a id="tally"></a>**Tally:** every catch and pick-up adds one to the phone's day tally (`store/actions.ts`), sent
whole, held a minute. One row per person and day, each count the larger of the two (`mergeTally`), the phones the
same (`model/tally.ts dayTallies`).

**Subjects and new keys:** `person` (whose goal; absent = the sender) only on the goal and profile prefs
(`GOAL_PREF_KEYS`, `PROFILE_PREF_KEYS`; `eventSubject`); the row's `person` column is always the sender. **A new event
type, pref key or field deploys the relay first**: the record refuses what it doesn't know, and an older app ignores
such a row. There are no health-data events ([design.md](design.md#health-data)).

### The look
Each person's avatar (`app/design/avatar/customization.md` §4, `contract/look.ts`: the fields, checks and reading):
an NH human player from parts, or their roster villager. Two prefs, the sender's own, one slot each: `look` (null or
unset is **いつもの**, `DEFAULT_LOOKS` in code, never stored) and `savedLooks` (the コーデ, ≤ 20). **Reading**
(`resolveLook`, `readSavedLooks`) goes part by part, so an unknown or broken field is いつもの's alone. Neither is
private.

## API
`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `forbidden` · `bad_request` · `too_large` ·
`busy` · `unavailable`. Body cap 1,000,000 characters (`MAX_BODY_CHARS`).

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate before any check, so retries are safe |
| `events` | `events: [{id, type, data, group?}, …]` (≤ 50) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}]}`: each as `event` would, in order, `at` its stored row's; a `group` ([below](#groups)) is all or none |
| `snapshot` | `since?` (the max `at` cached); `page?` (1–10,000 rows), `after?` (the last page's `next`) | `{ok, me, now, rev, rows:{metrics, events}, next?}`: compact arrays in column order, rows with `at > since`, paged in (at, table, seq) order while `next` comes |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build: 'relay-2'}` |

<a id="groups"></a>**Groups:** side-by-side events of one `group` (the shop's 全部) are all or none in one
transaction: a piece already owned is refused `owned` alone, any other refusal rolls the lot back (`detail: 'group'`);
a retry of a kept group is all duplicates. A bad `since`, `page` or `after` is `bad_request`; an unknown action too.

## Auth and limits
- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time. `KEY_A` and `KEY_B` also derive the secret that signs `/notify` and
  `/admin` (never `KEY_C`): a rotation updates the admin tools' keys file too ([runbook §3](ops/runbook.md#3-rotate-a-key)).
- **Rate limit:** 120 requests per key per minute (in the record's memory); over it, `busy`. A snapshot's later pages
  have their own 600 a minute.

## Record state
The record's `meta` table keeps `last_at` (the next `at` is max(now, `last_at` + 1 ms)) and `rev`. A Durable Object
runs one request at a time and each write is one SQLite transaction, so a snapshot never sees half of one; an ack is
sent only after its transaction committed.

## Revision
`rev` is the record's epoch (`e1`, `e2`, …): it changes only when the record is rebuilt (a restore, or `node
scripts/record.ts rev`). A new epoch, and a `load` that added rows, send `changed`. A `snapshot` whose `rev` or `me`
differs from the cache's makes the client drop the cache (never the unsent queue) and fetch everything. Nothing edits
the record by hand.

## Ingest
`relay/src/parse.ts` (its header: the fields, the bounds, body fat as a fraction): newline-joined Text lists, one line
per day ([shortcut §1](ops/shortcut-health-sync.md#1-what-the-shortcut-sends)). An unreadable or out-of-bounds line is
skipped (with a warning), a list of the wrong length dropped; a body with none of the fields is `bad_request`.
**A date repeated** in `dates` (a time-zone change) keeps an activity metric's largest, a weigh-in's last line. A run whose
write throws still leaves an `error` audit row and answers `unavailable`.

**Body metrics:** aligned to `dates` like `weight`, one decimal, never earn.

**Steps:** a day's steps are max(`steps`, `steps_watch`), each device's own list (close to Health's own merge).

**Latest wins:** a row is appended whenever a value differs from the last row for (person, date, metric), never the
same value twice. One exception: a `0` for a **past** Tokyo day whose latest row is above 0 is **held, not appended**
(a run that read nothing, Health locked, would rewrite the history): kept in `metrics_held`, never served; the admin
promotes a real correction (`record.ts held`, `promote`: [runbook §9](ops/runbook.md#9-the-record)). The model reads a
day's latest row; a locked week as of its lock (Wednesday 04:00).

**A day without the Watch:** a `0` for a day without samples is stored as sent; the model reads it as no data for
Move, Exercise and Stand (`model/health.ts activityOn`, [decisions](decisions.md#no-watch-days)). An empty line writes
no row (`skipped`).

## Client sync
`lib/sync/` (storage, transport, pairing, queue, cache, the live socket) and `lib/store/` (the week store, actions,
`live.ts`, `view.ts`, `synced.svelte.ts`, the demo backend, loaded only with `?demo`).

### Storage keys
`sync/storage.ts` registers every key (the live `island.*`, the demo's `island-demo.*`, never a live key; per device
`island.device`, `island.sound`, `island.locale`, `island.wx`). If storage fails the data lives in memory for the
session, with a banner once. Pairing as another person clears the cache, queue and acked list. `sync/transport.ts`
`post()` never throws (network failure `offline`; timeout, non-2xx or non-JSON `unavailable`).

### Snapshot cache
`sync/cache.ts`: the rows in IndexedDB (in memory if unavailable), kept in **segments** so a save rewrites only what
changed; anything unexpected in the store reads as no cache (a full fetch).
- **A refresh** posts `snapshot` with `since` and a `page` (4,000 rows), fetching each page after the last one's `next`
  and applying them together (`fetchPages`: a page that fails leaves the cache as it was, a new epoch between pages
  starts over).
- **The merge** (`model/snapshot.ts`): deduped by natural key, ordered by `at`; rows that only append are folded over
  the last State (`model/state.ts foldRows`). Overlapping refreshes share one request; a reply after a re-pair is
  dropped.

### Compaction
On each merge `model/compact.ts` drops the `metrics` rows of locked weeks the model can no longer read (~90 % go, the
views unchanged; the rule is the contract's, `contract/compact.ts compactKeep`), a replaced `tally`, and the `food*`
ops the fold no longer reads (`model/food.ts foldedAway`). The record keeps every Health row
([The record](#the-record) "Compaction").

### Write queue
`sync/queue.ts`: events in `island.queue`, sent in order until acked, in `events` requests (≤ 50 events, ≤ 900,000
characters) answered by id; a request refused whole is halved and sent again, one event alone so refused is set aside.

- **Paced** (`store/live.ts SEND_PACE_MS`): a send right after the last flush waits for one trailing flush that takes
  everything gathered, so an editor burst is a few requests, never `busy`.
- **Day rows** (`tally`, `island`): a newer row of the same day replaces the queued ones (not in flight).
- **Set aside** (`parked`, `PARK_AFTER`): an event the record keeps failing is kept and shown but no longer sent or
  blocking; logged `queue.poison`; a sync tap (`unpark`) tries it again. Never dropped.
- **Unsent:** online, a write 2 minutes past its hold (`unsentStuck`) shows on the sync chip and in 設定 with 送信.
- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back.
  **Subjects:** a later event on the same spend never overtakes a held one.
- **Groups** (`group`): none goes while any of it is held; then all of it in one request.
- **Replies:** acked (`ok` or `duplicate`) → into `island.acked` (in the view until a snapshot holds the id), out of the
  queue. `bad_request` / `too_large` → dropped with a message; `unauthorized` → pairing; other errors keep it and all
  after it, backing off to 5 min.
- **Retry now:** `online`, a sync tap, becoming visible and the socket's welcome (iOS often skips `online`), at most
  once per 30 s.
- **Hidden:** on hide the day rows still in their hold go at once in `keepalive` requests (under the browser's 64 KiB),
  so a phone locked right after a catch doesn't leave the partner behind.

### Optimistic view
`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. The store recomputes on every change and
each minute (not while hidden).

**The meal log costs the island nothing.** `reduce` keeps the `food*` rows raw (`model/state.ts` RAW_EVENTS); only the
food sheet parses them (memoised per row).

<a id="live-sync"></a>
### When it syncs
On launch (after painting from the cache), on becoming visible (≤ every 30 s), a sync tap, `online`, and whenever the
relay says the record changed ([Push](#push)). Each refresh flushes the queue, then fetches.
- **Not when current:** on launch and on becoming visible the phone waits up to 2 s for the `welcome`, whose `rec
  {at, rev}` is the record's last change the room heard of; when the cache has it and was fetched within 15 minutes,
  it only flushes the queue.
- **On every welcome** a `rec` past the cache fetches, so a change made while the socket was down is fetched at once
  (`e2e/live-sync.spec.ts`).
- **After an ack:** the record answers each event with its stored row's `at`, and that row goes into the cache at once;
  only an ack without a row (a duplicate) is followed by a re-read 1.5 s later.

**One device, one socket:** each hello names the device and the tab (`dev`, `sync/live.ts deviceId`) and replaces only
that tab's earlier socket (4002), never the person's other devices' or tabs'. Those hear the person's decor ops live
(the Mac's editor on the phone's island), and only the writing page skips its own `changed` (`sid`).

**Two tabs:** two tabs (or a PWA and a Safari tab) of one browser are two devices to the room. The synced stores
(`store/synced.svelte.ts`: the decorations, the rooms, the layout) merge what's in storage before they write and fold
the other tab's writes as their `storage` events land.

**Conflicts:** every op merges commutatively per id (`at`, then who); two layout pieces moved onto one tile at once
are settled by the later op's phone ([island-layout.md](island-layout.md#ops-the-record-and-the-relay) "Two edits on
one tile").

<a id="the-record"></a>
## The record
- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime; its header: the clock, ids, slots, the
  shop's cover, `since`) in `IslandStore` (`idFromName('record')`, `storeObject.ts`). Tables: `metrics`, `events`,
  `ids` (every event id ever accepted), `uploads`, `meta` (`last_at`, `rev`, `schema_v`, the running ledgers),
  `metrics_latest` (each day's latest value), `metrics_held` ([Ingest](#ingest) "Latest wins"); the columns and
  indexes are `SCHEMA`.
- **Schema:** `SCHEMA` (`IF NOT EXISTS`), then `MIGRATIONS`, each step and its mark one transaction; a change is a new
  step at the end, never an edit of one that shipped.
- **The Worker's gate:** the origin, method and size, and a person's key in the body (`storeRoute.ts keyGate`, a
  bounded scan, not a parse), else `unauthorized` there, so a stranger never costs a Durable Object request.
- **Rules** (`app/src/lib/contract/record.ts`): the shape checks (`validEventData`); `at` one per ingest, one per
  event; an event id once, forever; **slots**, a later event of a slot replacing it (`eventSlot`, and the per-id ops'
  `decorAccept`, `foodAccept`, …). A pref the model ignores takes no slot; a `highfive` event is acked and kept nowhere.
- **The shop's check** (`shopTarget`): against each person's running ledger (meta `shop|<who>`, kept with each tally,
  give-back, sell and buy by the fold's own step, `contract/shop.ts shopStep`); `shopcheck {fix?}` compares it with
  the full fold.
- **A decor op's check** (`decorTarget`): only its own slots' rows and the caps' counts (meta `decor_live`;
  `decorcheck {fix?}`); a reset drops the voided rows (`dropVoided`).
- **Ingest:** `relay/src/parse.ts`, the audit row (`relay/src/audit.ts`), each day's latest value from
  `metrics_latest`; `relay/test/ingest-golden.test.ts` against a golden.
- **`since`:** from the `at` index; a row that arrived out of `at` order (an import's) is `late`, and a poll returns
  late rows too (`LATE_MARGIN_MS`).
- **Admin:** `POST /admin`, signed like `/notify` ([Push](#push) "Auth"; a `restore`, `rev` or `logpurge` taken once
  per signature, `admin_seen`). Its ops: [runbook §9](ops/runbook.md#9-the-record) (`load` by the same rules,
  idempotent: `test/restore.test.ts`).
- **Push-driven:** after a write the object tells the room ([Push](#push)), which keeps the last `rec {at, rev}` for
  each `welcome`.
- **Compaction** (`store.ts compact`): the phones' rule on the record's `metrics`. **It is off: every Health row is
  kept.** The cron runs it only with `COMPACT_CRON=1`, unset (`relay/test/compact.test.ts` fails while it is set); the
  admin's `compact` needs `confirm: 'delete-health-history'`.
- **Snapshot size:** a year of three people is ~50–100k rows, ~3–6 MB of JSON, so the snapshot is paged ([API](#api)),
  4,000 rows a page ([Snapshot cache](#snapshot-cache)).
- **A restore** (`restore {bookmark}`): every `/api` request is `unavailable` until the restart, so no write is acked
  and then dropped; the restored record starts a new epoch.
- **Backups:** point-in-time recovery (30 days, on the Free plan) and `dump` / `load`: [runbook §9](ops/runbook.md#9-the-record).

## Live relay
Presence between the phones while they have the app open (decisions: *Live relay on Cloudflare*). The room carries
intents, never data of record: the record still catches an offline phone up.

- **Where:** `relay/` (its own package): a Worker (`src/index.ts`) and `IslandRoom` (`idFromName('island')`,
  `src/room.ts`). Production `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy,
  `island-fund-relay-test`, with its own secrets, for the smoke test. `GET /health` → `{ok, v, versions, t, wx}`;
  `POST /api`, `/admin`, `/notify` ([Push](#push)), `/log` ([observability](ops/observability.md)), `/stt`.
- **Admission:** `/room` upgrades only from `ALLOWED_ORIGINS` (`https://island-fund.pages.dev`) and
  `http://localhost|127.0.0.1`, else 403. The origin only keeps other sites out; the key is the auth.
- **Tickets** (`contract/ticket.ts`, `auth.ts admission`): each socket opens with the subprotocols `island-v1` and a
  short-lived HMAC ticket under the person's key; the Worker checks it first (bad or stale, 403; a ticketless socket
  too), and a ticketed hello must be that person's. A phone clock over 5 minutes off has no live socket.
- **Auth:** the first message is `hello {key, since?, build?, beat?, dev?}`; the room compares the key in constant time
  and answers `welcome {me, peer, t, rec?, here, gone?, hb?, mine?}` (`rec`: the record's last change; `here`: everyone
  else here; `gone`: when each person's last socket closed; `mine`: another device of mine is here), or closes 4001.
  No hello within 12 s: 4003; a second socket of the same device replaces the first (4002).
- **Protocol** (`app/src/lib/contract/live-protocol.ts`, both sides' parsers and each field's bounds): JSON, `v: 3`
  (`LIVE_VS`), ≤ 256 bytes (a `replay` ≤ 16,000). Client intents:
  - The shared world's ([Shared world](#shared-world)): `walk` (the very walk, on the relay's clock), `act`, `catch`,
    `world {op, id}`, `pick`, `put`, `shake`, and `decor` (the record's op, kept for the day).
  - Presence only: `drag`, `tent` (my villager in a room), `fish {ph, …}`, `say {text, sc?}`
    ([Villager taps](design.md#villager-taps)), and ききみみ's `quiz` and `play`
    ([kikimimi-engine.md](kikimimi-engine.md#the-play-wire)).
  - `highfive {at}`: held for an away recipient until their `got {at}`, or a day
    ([decisions](decisions.md#a-high-five-goes-over-the-relay-only)).
  - `music {src, at, song?, ms?, pc?}` ([sound-sync.md](sound-sync.md)): the room keeps the last record per source
    (`newerMusic`) and sends the live ones after each welcome.
  - `saved {}` ([Push](#push)), `ping {c}` → `pong {c, t}`, `got {at}`.

  Relay-only: `changed`, `wx`, `presence {who, on}`, `replay {es}`, `ack`, `busy`. The room drops any client-sent
  `who`/`t`, stamps its own (`t` strictly increasing) and relays to the others; a `decor` op also to the sender's
  other devices.
- **Numbered intents and acks:** an intent may carry `c`; the room answers `ack {c, t, ok}` (`ok` false when the world
  refused it: a claim already made). A resend of a kept or recently acked intent is acked again, never relayed twice.
  It relays before it writes the day, and acks after the write (an ack is durable).
- **Heartbeat:** `{"v":3,"kind":"hb"}`, answered by the runtime (`setWebSocketAutoResponse`): it never wakes the room.
  **Ghosts:** a hello with `beat: true` beats after 20 s of silence; the room closes a socket silent for 60 s
  (`sweepSilent`), stamped gone at its last beat.
- **Versions:** an unknown `v` closes 4004 and the client waits for a reload; a bump ships as
  [Relay versions side by side](decisions.md#relay-versions-side-by-side) says.
- **Limits:** a token bucket per socket (20, 20/s); beyond it messages are dropped, a numbered intent hears `busy`.
- **Replay:** a hello with `since` gets the day's newer changes after the welcome, in `replay {es}` messages.
- **Cost:** the Hibernation API: an idle socket keeps no object in memory ([budget](ops/observability.md#request-budget)).
- **Client** (`app/src/lib/sync/live.ts`, `liveRelay()`: one socket for the app; its constants: backoff, pings,
  liveness, the outbox): connected while visible and online, reconnecting with backoff; after 4001/4002/4004 it waits
  until the page is shown again.
  - **Clock:** the offset from the shortest of the last pings' round trips (`serverNow()`), kept across reloads
    (`island.liveOffset`), so a stamp before the first welcome is on the relay's clock too. The shared world's Tokyo
    day is `world.now()`'s, never the device's.
  - **Liveness:** a quiet socket is probed and given up (4000) when nothing answers; the welcome is due within 10 s.
  - **The outbox:** what the room keeps (`isStored`) goes even with the partner away and waits until its `ack`,
    resent after a reconnect, kept in localStorage (`island.liveOutbox`), so an intent made offline survives a kill;
    dropped after 4 tries (`ws.unacked`: a catch is still in the record's day row). An `ok: false` is a race lost
    ([Shared world](#shared-world) "A race lost").
  - `send(intent)` is a no-op returning false unless welcomed and, for what the room doesn't keep, someone is there;
    it never throws or blocks. `LIVE_URL`, overridable by `VITE_LIVE_URL` (empty = off).
- **Measured:** the relay's latencies, in [perf.md](ops/perf.md) "Measuring".
- **Tests:** `relay/test/` (`cd relay && npm test`, also `.github/workflows/relay.yml`); `live-protocol.test.ts`,
  `live.test.ts`, `live-room.test.ts` (the client against the real room) and `store/push.test.ts` in the app's vitest.

## The real weather
Tokyo's sky by the hour for the island ([design](design.md#weather); decisions: *Weather from Tokyo, by the hour*).
`relay/src/weather.ts` (pure but for its fetch; its header and constants: the hours kept, the dead bands, the
backoff), `IslandRoom.weatherTick` (`relay/src/index.ts`), the phones' `sync/wx.ts` and `island/weather.ts`
`realWeatherAt`.

- **Source:** Open-Meteo's forecast, JMA's models (`models=jma_seamless`), for one fixed point (`wrangler.toml`
  `WX_LAT` / `WX_LON`: central Tokyo). No key, CC BY 4.0, credited in 設定; no phone calls a weather API. JMA's model
  gives no snow, fog or thunder codes for Tokyo: snow comes by temperature.
- **When:** the Worker's cron at :15 and :45 calls `weatherTick`; a fetch is due 30 minutes after a good one, or past
  :45 with none since (`weather.ts due`): about 48 a day; a hello fetches too when due (the test copy has no cron). A
  failure keeps the timeline, logs `wx-fail <why>` and backs off.
- **The timeline** (storage `wx`; its fields: `live-protocol.ts Wx`): a letter of sky an hour for the 12 hours before
  now (the rainbow looks back) and the next 36, the foggy hours and the day's high (しずえ's news). The response is
  checked strictly, so bad data never replaces good.
- **The mapping** (`weather.ts mapHour`): dead bands on the hour before's sky (rain, snow by temperature, fog), so the
  sky doesn't flicker; a lone hour between two alike is theirs.
- **Locks:** an hour that has begun (and the next, after a fetch past :45) keeps its sky, so a phone that cached it
  shows the same as one online.
- **To the phones:** `wx` after the welcome (while the timeline serves: fetched within 36 h and covering the hour) and
  on each `rev`; cached as `island.wx`.
- **The phones:** in ほんもの mode (`pref weatherMode`, the last anyone set) the hour's sky is the timeline's while it
  serves, else the seeded day's; winter's snow, the event nights held fine, the seeded fog and aurora and the rainbow
  are the phone's rules (pure, by the date).
- **The island's look** (`pref seasonLook`, 設定 → 季節): `{event, season, weather, tod}` (each a token or null) or
  `null` (自動); a phone reads the values it knows.
- **Ops:** `GET /health` → `wx {at, src, age (min), hours (ahead), fails}`, asked of the room at most once a minute;
  the signed `/admin` op `wx`: `{refresh: true}` fetches now, `{s, fx?}` puts a fixture in (the smoke test), `{}` says
  how it is. Weather is never written to the record; only the mode is.
- **Tests:** `relay/test/weather.test.ts` (recorded Open-Meteo responses against golden timelines), `room.test.ts`;
  the app's `island/realWeather.test.ts`; `e2e/realweather.spec.ts`; `npm run smoke`.

## The guest
A third person, a visitor rather than a member ([design](design.md#the-guest), [decisions](decisions.md#the-guest)):
one key, `KEY_C` (unset = no guest), who `G`. The economy, the members' goals and real-world records, the Health
ingest, the trees, きろく, けんこう and ふたりでぜんぶ stay A + B.

- **What it sees** (`contract/guest.ts guestRows` via `rowsFor`): the members' activity, every event but the からだ
  goals and a member's profile; its own `listen` rows whole and the members' as summaries. Never a からだ row. A
  member's snapshot never carries the guest's profile.
- **What it writes** (`guestMayWrite`): everything on the island a member writes, by the same rules, and its own meals,
  prefs, profile and pack items. Not `spend`, `spend_void`, `harvest`, a member's or an activity / からだ goal, a
  `trip_note`, the wedding board, `ingest` or `uploads`: `forbidden` (the queue drops it). Its rows are `person = G`
  (the merge order A < B < G).
- **The room:** the guest sends anything a member does; a `decor` op of another's home's look is refused for anyone,
  every home's room is anyone's (`scopeMaySend`, 2026-11-10). `peer` stays the partner for a member and either member for the guest; a high-five names whom it
  is for (`to`).
- **Push:** its own `changed` notices reach every phone; of the members' it hears an event's, an ingest's only when it
  brought activity rows (`notify(n, guest)`), and a new epoch's; its welcome's `rec` is the room's `recG`
  (`index.ts Marks`).
- **The phones:** a member's draws the guest's villager as a third actor (`ui-state/cast.ts`: `mine`, `partner`,
  `third`; on the guest's phone `third` is B); the guest's phone guards what it sends by the same rules.
- **Tests:** `relay/test/guest.test.ts`, `contract/guest.test.ts`, `model/guest.test.ts`, `e2e/guest.spec.ts`,
  `e2e/island-edit.spec.ts`; `npm run smoke` with `KEY_C`.

## Ambient life
What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug
coming by) is decided per 10-second slot of the Tokyo day from the date, the slot and the shared world (decisions:
*Ambient life from the clock*). `app/src/lib/components/island/ambient.ts` (pure, `ambient.test.ts`; its header and
constants: the odds, the reach, the stays); idle life and the critters play it.

- **Clock:** `slotAt(ms, offset)`, 8,640 slots a day, on the island's clock (`clock.ts now()`: a `?date=` preview moves
  the slots) plus the relay's offset (`ambientClock.ts relayOffset`). A slot plays `DECIDE_MS` after it starts, when an
  intent sent before the start has reached the partner.
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")`; species by the sky at the
  slot's start (`weather.ts yieldSkyAt`).
- **Villagers** (`villagerBeats`): one beat a slot, an idle move from `IDLE_POOL`, an outing (one villager out at a
  time; `avatar.ts outing`), or a chat or a dance for two free villagers. A sleeper is never free; a villager whose
  person has the island open makes small moves but no outings (`held`). The guest's villager joins while awake, with
  no outing and no tree shaking.
- **Visitor:** `Visitor.svelte beat(r)` runs `visitorLife.ts pickAct`, `pickEmote` and `strollSpots` on the slot's
  `visitor` PRNG; a phone whose visitor is speaking skips it.
- **Critters** (`spawnsIn(date, slot, coasts)`, `crittersAt`): per channel (the front beach's sea and bubbles, a coast
  stretch each, each fresh water, two bugs) a slot brings one once the last one's stay is over, chained per 10-minute
  block, so a phone opening mid-stay finds the ones still there. Where each is comes from its seed
  (`critterPath.ts`), never a camera; its id is `<kind>:<slot>`.
- **Agreement and its limits:** the same inputs give the same slot (tested with shuffled inputs and skewed clocks).
  Phones differ only where their inputs do: a clock offset past the margin, a walk within ~20 ms of a boundary, a local
  skip (a sheet, a reaction playing), the camera. What a person does by hand (a bite plan, a dive's chase, a balloon's
  flight, a shooting star, the visitor's lines, sounds) plays on their phone; its outcome is shared.

## Shared world
Every phone shows the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*;
what it looks like: [design](design.md#shared-world)): what comes by itself is [Ambient life](#ambient-life); what a
person does is a small intent over the relay, kept by the room for the day, folded by every phone into the same day.

- **The day** (`sync/world-day.ts`, pure, `world-day.test.ts`): a `WorldDay` folded from the day's intents in the
  relay's order: claims (who got what, how, where), puts, shakes, watered cells, wishes, each person's last walk.
  First wins: the relay drops a later claim, so a partner's claim of something I claimed too replaces mine. The claim
  ids (`catch:`, `pick:`, `bug:`, `br:`, `fr:`…) are `live-protocol.ts claimOf`'s.
- **A race lost:** what my claim put in my pocket comes out again (`world.lost` → `store/actions.ts lostRace`), with
  「〇〇が さきに とったよ」: from the held or queued tally, or by a `tally_back` ([Events](#events)) once it went.
  Today's counted claims are kept (`island.counted`), so this works after a reload. **A refused claim** (`ack {ok:
  false}`) is a race lost the same way.
- **The store** (`store/world.svelte.ts`, `world`): today's day in localStorage (`island.world`); `share(intent)` folds
  my change (refused when someone already has it) and sends it at once; `on(fn)` the others'.
- **The room** (`relay/src/room.ts`): today's world on the relay's clock: the last `RING_MAX` changes and each person's
  last `walk`, in one storage value (`ring`). The day's claims and each tree's last nest are kept apart (`day`), so
  neither a trimmed ring nor a hibernation lets a claim be made twice (`NEST_GAP_MS`).
- **The demo** (`sync/live-local.ts`): the players are tabs of one browser (`?demo`, `?demo&as=B`, `as=G`); a
  BroadcastChannel carries the intents and the sending tab plays the room's rules (`island-demo.relay`), so the
  two-player e2e run without a network.
- **The record's day row** (`island` event, `store/actions.ts sendIslandDay`): my part of the day, sent whole when it
  grows, held 2 minutes, only once this session's fetch has folded the record's rows in; the store folds in today's,
  yesterday's watering and the wishes for the mornings to come (`applyRow`).
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each phone moves its
  own villager; every walk and put goes as the very walk on the relay's clock. The partner's phone plays it from the
  same start, late from where it is by now: a small gap walked off, a bigger one glided (`JUMP_U`, `GLIDE_MS`), never
  a jump in view. A phone gone leaves its villager where it last stood, across days
  ([decisions](decisions.md#a-villager-stays-where-it-was-left)).
- **Sleep** ([design](design.md#sleep)): a villager sleeps while its person is offline (`ui-state/presence.ts`
  `GRACE_MS`). A wake is `act {act: wake, id, at}`, kept in the day, so every phone wakes it (`playWake`); Gulliver's
  is `world {op: woke, id: gulliver}`.
- **The decorations** (`store/decor.svelte.ts`): each change is one `decor` op, to the relay at once and to the
  record's queue, merged by id (`contract/decor.ts`); my op's `at` is on the relay's clock.
- **Checked** (`e2e/sync-harness.spec.ts`): two players run a scripted session, then both phones (and a third opening
  later) must have the same canonical day (`world-day.ts canonical`, `hash`), decorations and villager points. On the
  demo's tabs in CI; against the test relay with `RELAY_E2E=1 … --workers=1`. `world-day.test.ts` runs a session with
  conflicts, a dropped socket and a late join on the real `RoomCore`.

## Push
While the app is on screen, a change to the record reaches the other phones in well under a second (decisions: *Push
through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches up a phone that missed it.

- **Record → room:** after a write that added rows (never a duplicate, a refusal or a read), the record calls the room
  (an RPC, after its commit) with `{what: 'ingest'|'event', who, at, rev, sid?}`. `POST /notify` (signed, below) takes
  the same notice from a server (`npm run smoke` uses it).
- **Auth:** the notify secret is derived from `KEY_A` and `KEY_B` by both servers (`relay/src/notify.ts`: the
  derivation, the headers, the 5-minute window); a phone holds only its own key, so it can't sign. Rotating a key
  rotates it ([runbook §3](ops/runbook.md#3-rotate-a-key)); the same secret signs `/admin`.
- **Relay → phones:** `changed {what, who, at, rev, sid?, t}` to every authenticated socket, the writer's too (a
  Shortcut upload reaches its own phone), the guest's only of what it may see; the last mark is the welcomes' `rec`.
- **The nudge:** after an ack the phone sends `saved {}`, relayed like any intent, until a `changed` has reached it
  this session.
- **Client** (`store/live.ts`): `onChange` → one `refresh({fresh: true})` 300 ms later (changes together make one),
  skipped when the cache has it and for this page's own `event` (`sid`; my other devices' are fetched).

## Notifications

None ([decisions](decisions.md#no-notifications); `e2e/no-notify.spec.ts`: nothing asks, subscribes or calls `/push`).

## Service worker
`app/src/service-worker/` (pure rules and every cache's bound in `caches.ts`). No `push` or `notificationclick` handler.

- **Registration:** by the app, not Kit (`kit.serviceWorker.register = false`; `lib/ui-state/swLate.ts`): once the 3D
  island has its models in or can't draw (30 s at the latest), off the island after the window's load, so a first
  visit's precache never competes with three.js and the models.
- **Install:** precaches the built JS/CSS and the static files `caches.ts precachable` keeps (the rest on first use:
  `index.ts`'s header). The hashed chunks are all or nothing (`addAll`, an older shell's copy where it has one); the
  static files go by content hash (`caches.ts installStatics`, `vite.config.ts swPrecacheOnly`), each on its own.
  (An install after a deploy measured: sw-measure.ts at the `probes` tag.)
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it), the runtime caches and the saved areas; deletes the rest.
- **Navigations:** this version's cached shell at once (`caches.ts isShellOf`); every deploy changes the worker, which
  the browser checks on each navigation. No shell of this version yet: network first, an older shell offline or after
  3 s.
- **Updates:** Kit's `_app/version.json` check sets `updated`; the layout waits for the new build's worker
  (`ui-state/reload.ts newWorker`) and reloads once nothing is open. Never on a timer; a failed install reloads
  nothing. `e2e/sw-update.spec.ts` (`scripts/serve-build.ts /__e2e/deploy` stands in for a deploy).
- **Packs** (the players' and ききみみ's): fetched whole (Pages answers a Range with the whole file), one fetch at a
  time a URL (`caches.ts fetchShared`).
- **Room cache** (`island-room-v1`: the models, the players' parts and packs): cache-first, outliving builds, a file's
  older `?v=` dropped at once, then least recently used past `ROOM_CAP_BYTES` (`roomEvict`).
- **Art cache** (`island-villagers-v1`: the villagers', critters', finds', ground's and decor's art): least recently
  used past `ART_CAP_BYTES`.
- **Listen cache** (`island-listen-v1`, [kikimimi.md](kikimimi.md) "Audio"): cache first, never revalidated, outliving
  builds; a Range request passes to the network; `listenEvict`.
- **STT cache** (`island-stt-v1`, [kikimimi-mic.md "Hosting and the service worker"](kikimimi-mic.md#hosting-and-the-service-worker)):
  the whisper model and runtime under `/stt/`, filled by the page after the mic opt-in (`lib/mic/models.ts
  ensureStt`); the worker serves `/stt/` from it, never stores.
- **Offline:** what a phone has shown once reads offline; nothing is prefetched unasked. `e2e/offline.spec.ts`
  (Chromium, the worker on) checks each kind:
  - *Precached* (`scripts/load-budget.ts` ≤ 3 MB): the common font slices (`PRECACHED_FONT_SLICES`), each trip's cover
    and the trail tracks.
  - *Photos* (`island-photos-v1`): stale-while-revalidate once a day old (`swrFetch`), bounded (`PHOTO_CAP_BYTES`); one
    that can't load is the paper placeholder (`ui/photoFallback.ts`).
  - *MapLibre* and *ききみみ's parts*: into this version's shell the first time they load, carried on by each install
    (`caches.ts carryPlan`); offline they import only if a shell holds them (`travel/map/cached.ts`, `pool.ts`), and a
    game never played says オフラインです.
  - *Tiles* (`island-tiles-v1`: OpenFreeMap, USGS, GSI): stale-while-revalidate past `TILE_FRESH_MS`, bounded
    (`bytesEvict`), fetched by the page (`travel/map/tiles.ts`: WebKit's worker doesn't see MapLibre's worker's
    fetches), the saved areas first.
  - *Saved areas* ([design](design.md#offline-maps)): `lib/offline/plan.ts` (pure) sizes an area's tiles by measured
    means per source and zoom (offline-measure.ts `--full` at the `probes` tag, never in CI; within ±20 %, plan.test);
    `lib/offline/save.ts` fetches them into `island-offline-<id>` with a manifest, resumable (「一部のみ」 when some
    failed). Caps: `OFM_MAX_TILES`, `OFM_MAX_BYTES` an area, `TOTAL_CAP_BYTES` in all; `island.offlineAreas` mirrors the
    manifests, so an area Safari evicted shows 「消えました」.
  - *Storage kept:* the installed app asks `navigator.storage.persist()` once, after its first sync that worked
    (`sync/persist.ts`).
- **Runtime:** fonts and art cache-first. Audio (`island-audio-v1`) cache-first, never revalidated, an LRU per class
  (`caches.ts`'s audio note). The food data (`island-food-v1`) and ごはん's pictures (`island-food-img-v1`,
  [food-data.md](food-data.md#pictures), `foodImgEvict`): cache-first by version, `index.json` from the network first.
  Other GETs: this version's cache, the previous one, the network. The relay is cross-origin and always live.

## Tests
`relay/test/store.test.ts`, `store-route.test.ts`, `ingest-golden.test.ts` (the record on node:sqlite),
`parse.test.ts`, `restore.test.ts`, `compact.test.ts`; the app's queue (`queue-batch.test.ts`), cache, sync and store
tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and `npm run bench` for the model at year-3 volume
([perf.md](ops/perf.md) "Budgets").
