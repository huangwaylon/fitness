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
≤ 20,000 characters as JSON (a `wnote`'s 140,000; past either `too_large`); each field's exact bounds are its
`contract/` module's. The record checks shapes (and a spend's item and price, `SHOP` in `contract/rules.ts`); wallet
cover is a read-time rule in the model. **Ops with a sender's clock** (`decor`, `board`, `food*`, `pack*`, `wtask`…:
`at` in ms on the relay's clock) are refused more than a day past the record's (`AHEAD_MS`), which no later edit could
beat. **Latest op only:** the per-id ops below keep one row a slot, a stale op or anything after a removal is acked as
`duplicate`, and a removal's row is kept for good.

| type | data | Rules |
|---|---|---|
| `spend` | `{spendId, item, bells}` | `spendId` 1–128 chars; `item` `snack` with `bells` 40, or `dinner` with `bells` 70 |
| `spend_void` | `{spendId}` | from either person; refused when it names no `spend` row; a second void of the same buy is a `duplicate`; the model takes the first after the spend |
| `harvest` | `{week}` | a week key; counts only for the harvest open at the time |
| `find` | `{kind, id}` | the shared ずかん's scenery: `kind` ∈ `FIND_KINDS` (`fish` · `bug` · `sea` · `fossil` · `shell` · `fragment`, and a balloon's present: `item` · `recipe`), `id` a catalog id (the lists are the client's, so they grow without a relay deploy). Never ベル |
| `tally` | `{date, counts}` | one person's counts of one Tokyo day ([Tally](#tally), `contract/tally.ts`): `date` neither after tomorrow nor more than `TALLY_PAST_DAYS` (35) before it; `counts` 1–300 keys `kind:id` (a find's, or `goods:<id>`: a pick-up with no ずかん page) → 1–999. Never ベル |
| `pack_chk` | `{trip, id, at, v}` | one person's tick of a trip's item (`v` 1/0): slot `pack_chk\|<trip>\|<id>\|<sender>`, the latest `at`; a tick of a removed or unknown op-made item is acknowledged and dropped; ≤ 300 a trip and person |
| `pack_reset` | `{trip, at}` | one person's 「リセット」: their ticks no later than `at` read as off. Slot `pack_reset\|<trip>\|<sender>` |
| `trip_note` | `{trip, at, v}` | a trip's private values ([travel.md](travel.md#private-values): booking refs, names; the guide's `{p:key}` tokens), never in the repo: ≤ 64 keys → a clean line each, the whole note at once. Slot `trip_note\|<trip>`, the latest `at`, then who |
| `wdone` | `{id, at, v, imported?}` | a wedding task's tick, shared: slot `wdone\|<id>`, the latest `at`, then who |
| `wconf` | `{k, at, v, imported?}` | one wedding setting: `p1` / `p2` (names), `date`, `time` (`HH:MM`), `venue`, `tz`, each `''` to clear, or `cats` (`[]`: the starter list). Slot `wconf\|<k>` |

The other types, below. The wedding types are the members' only; `trip_note` too (the guest's are `forbidden`).

<a id="pref"></a>**`pref`** `{key, value, person?}`:
- Cosmetic: `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (a roster id), the look ([The look](#the-look)).
- Goals, one key per charted metric, each one's range, grid and history the registry's (`contract/goals.ts` GOALS,
  `isGoalValue`). **Per day:** `stepsGoal`, `moveGoal`, `exerciseGoal`, `standGoal`, each with an optional `day` (the
  phone's Tokyo day, taken within a day of `at`'s: `contract/record.ts goalDay`). **Latest only** (or null):
  `goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`, and the meal log's `kcalGoal`, `proteinGoal`, `fatGoal`,
  `carbsGoal`, `saltGoal`, `fibreGoal`, `alcoholGoal`.
- The profile (`contract/profile.ts`, [design](design.md#profile)): `sex` (`m`/`f`), `birth` (from 1900-01-01 to 10
  years before the record's Tokyo day), `bmiStd` (`asia`/`who`). Private (`rowsFor`): a member's reaches the two
  members only, the guest's the guest only.
- Island-wide: `weatherMode` and `seasonLook` ([The real weather](#the-real-weather)).

<a id="tally_back"></a>**`tally_back`** `{date, counts}` (`contract/tally.ts backCovered`): what one person gives back
of a day's tally, a claim race lost after that `tally` reached the record ([Shared world](#shared-world)). A tally's
rules (counts only grow, `mergeTally`), kept only while that day's tally covers every count (else `tally short`). The
pocket and the ずかん's counts are the tallies less these (`model/tally.ts tallyTotals`). A catch already sold when
given back **costs its かいがら** (`contract/shop.ts shopLedger`, `owedOf`: what the uncovered units fetched, their
sells' average) until a later catch of the species covers it; the wallet may read below 0.

<a id="island"></a>**`island`** `{date, taken, puts, shakes, watered, wishes, at?}` ([Shared world](#shared-world),
`contract/island.ts`, never ベル): one person's part of one Tokyo day: what they picked up, dug, pulled, opened or caught
(`catch:<id>`), put down, shook loose, watered and wished, and where their villager stands. One row per person and
day; the replacing row keeps what only grows of the one it replaces (`mergeIslandDay`: wishes, watering, the held
spot), its `taken`, `puts` and `shakes` its own (leaving a claim out gives back a lost race). Sent only once this
session's fetch folded the record's rows in (`week.current`), so a row rebuilt before them can't erase claims.

<a id="decor"></a>**`decor`** `{id, at, item, x, z, f, p}` or `{id, at, rm: true}` (`contract/decor.ts`): a piece's
whole state or its removal, anyone's. The model merges by id (`decorLayout`: a removal beats everything, else the
latest `at`, then G over B over A).
- **The decorations** ([Decorating](design.md#decorating)): `item` one of the ten, `f` the facing 0–3, `p` when first
  placed; at most 30 (`decor full`).
- **The rooms** ([The tent](design.md#the-tent), `contract/tent.ts`): `sc: 't'` (うめ's `'u'`, the guest's `'v'`),
  `item` a piece's code (`f…`) on a tile 0–7; the wallpaper and floor `dtentwall` / `dtentfloor`, the size `dtentsize`
  (`s4` / `s6` / `s8`; none: 8; never removed); 60 pieces a room (`tent full`). **A light's switch** `{sc, id, at,
  lt}` is a slot of its own (`decor\|<sc>\|<id>\|l`), kept while the room holds the piece, never counted, so a move
  and a switch made at once both stand.
- **The island's layout** ([island-layout.md](island-layout.md#ops-the-record-and-the-relay), `contract/layout.ts`):
  `sc` `o` (an object), `c` (a terrain chunk), `r` (a reset: the record drops the ops it voids), `h` (a home's look).
  The outdoors are anyone's, a home's look and room its owner's (`scopeMayWrite`); at most 1,500 objects standing
  (`layout full`). A kind `k` is any lower-case token (a phone ignores one it doesn't know): no relay deploy.

<a id="board"></a>**`board`** `{id, at, p, t}` or `{id, at, rm: true}` ([board.md](board.md), `contract/board.ts`):
a note's whole text or its removal. `t` is cleaned by the record as on the phone (`cleanText`: NFC, `\n` breaks, no
control or bidi characters, ≤ 4 lines, ≤ 100 code points). Anyone posts; an edit only by its author, a removal by
anyone (`boardMayWrite`). At most 50 notes (a new one past them drops the oldest by `p`). No live intent (a note is
past the room's 256 bytes): the record's notice brings it to every open phone (`boardFold`).

<a id="food"></a>**The meal log** (ごはん, `contract/food.ts`): each op an entry's whole state or its removal. Anyone
logs their own; only the owner edits or removes (`foodAccept`). Everyone sees every meal; the phones fold by the same
rules (`model/food.ts`; `deps.test.ts` keeps it out of the economy).
- **`food`** `{id, at, d, m, g, f}`: the Tokyo day eaten, the meal (`b` 朝 · `l` 昼 · `d` 夕 · `s` 間食), grams, and
  `f` the food per 100 g as logged: `{id, n, k, p, fa, c, s, fi?, al?, u?, sv?}`, a nutrient null when unknown,
  `sv: true` a serving of no known weight. Fold: `foodFold`. An edit on one of the owner's phones before it fetched a
  later edit from another is a `duplicate`, shown until the re-read after the ack (1.5 s).
- **`food_repeat`** `{id, at, m, it, w, from, to?, sk?}` (いつもの): a meal on the weekdays of mask `w` from `from` to
  `to`, skipping `sk`, read into each day on the phone (`model/food.ts foodDay`). A change of items or weekdays is a
  new repeat from tomorrow plus the old one's end naming it in `nx`. **A skipped day stays skipped** (`repeatAccept`
  carries a held op's `sk` into the kept one). Fold: `foodRepeatFold`.
- **`food_recipe`** `{id, at, n, sv, it}` (マイレシピ) and **`food_custom`** `{id, at, n, u, g?, k, p, fa, c, s}` (マイ食品,
  one serving, no denser than a food: `customDensityOk`): anyone logs anyone's, as an ordinary `food` entry whose `f`
  is `recipeSnap` / `customSnap`, so editing either never changes a meal logged from it.

<a id="shop"></a>**The shop** ([The shop](design.md#the-shop), `contract/shop.ts`): no slot; the guest's too; never ベル. The
phones fold by the same rules (`shopLedger`, `model/shop.ts`): a kept row counts whatever the tallies read now, a
queued one only when the ledger covers it.
- **`sell`** `{species, n, v}`: `n` (1–999) of one species from the sender's pocket (`contract/pocket.ts`); `v` the
  かいがら it fetched, at most `n` × its price (`contract/shopPrices.ts`, `npm run shop:prices`), kept as sold.
  **The pocket is derived**: the tallies' catches less give-backs and sells; past it, `pocket short`.
- **`buy`** `{item, price, d}`: a room's piece at exactly its price from the stock of Tokyo day `d` (yesterday, today
  or tomorrow; `contract/stock.ts` stockOf). **かいがら are derived**: Σ sells' `v` − Σ buys' `price` (less what
  give-backs owe); past them `wallet short`; a piece already owned is refused too.

<a id="listen"></a>**`listen`** `{d, g, gm?, u?, l?, tm?, lv, n, ms, p?, r}` ([kikimimi.md](kikimimi.md),
`contract/listen.ts`): one ききみみ game's answers of the sender's (the day, game, unit and lesson, stage, players,
length, `r` the answers `[id, ok, pick, rp]`). Written once at the results; a retry is a duplicate by its id. Folded on
the phone only (`kikimimi/progress.ts`, `srs.ts`). **Private** (`rowsFor`): its owner gets it whole, everyone else only
`{d, g, n, ms}`, plus `{u, stamped: 1}` when it stamps its unit (`stampsUnit`, derived at each read).

<a id="pack"></a>**`pack`** `{trip, id, at, kind, ord, name, cat?, note?, icon?, by?}` or `{trip, id, at, rm: true}`
([travel.md](travel.md#packing-list-relay), `contract/pack.ts`): a category (`kind: 'cat'`) or an item, its whole
state or its removal (which drops its ticks); any `trip` token (a new trip needs no deploy). Slot
`pack\|<trip>\|<id>`: the latest `at`, then G over B over A. Members change any id; the guest only its own (`by`), and
a category only while every item in it is its own. 300 items standing a trip (`pack full`).

<a id="wedding"></a>**The wedding board** ([wedding.md](wedding.md#the-record-relay), `contract/wedding.ts`):
- **`wtask`** `{id, at, c, title, cat, due?, start?, parent?, del?, imported?}` or `{id, at, rm: true}`: a task or
  subtask (`parent`, refused unless held as a top-level task), `del` soft-deleted. Slot `wtask\|<id>`, the latest `at`,
  then who; a purge beats everything and drops the task's tick. At most 2,000 rows (`wedding full`).
- **`wnote`** `{at, md, base?, imported?}`: markdown kept as sent; `base` the `at` it was edited from. A save whose
  `base` isn't the held note's keeps the replaced note beside it (`was: {at, md, who}`) until a save from the new one.
  `imported: true` only on the admin's `load`.

**Finds:** the client sends a `find` only the first time anyone finds that `kind:id` (a race only adds a duplicate
the model folds away). `findsView` (`model/finds.ts`) keeps the first per `kind:id` (its Tokyo date and finder).

<a id="tally"></a>**Tally:** every catch and pick-up adds one to the phone's tally of the day (`store/actions.ts`
recordFind, recordGoods), sent whole, held a minute. The record keeps one row per person and day, each count the
larger of the two (`mergeTally`: a lower one is a stale send and never takes back a catch a sale counted); the phones
fold the same way (`model/tally.ts dayTallies`) and the next tally starts from the day's latest row.

**Subjects and new keys:** `person` (`A`/`B`, whose goal; absent = the sender) is allowed only on the goal prefs
(`contract/api.ts` GOAL_PREF_KEYS) and the profile's (PROFILE_PREF_KEYS); either member sets either member's
(`eventSubject`); the row's `person` column is always the sender. **A new event type, pref key or field deploys the
relay first**: the record refuses what it doesn't know, and an older app ignores such a row. There are no health-data
events ([design.md](design.md#health-data)).

### The look
Each person's avatar (`app/design/avatar/customization.md` §4, `contract/look.ts`): an NH human player from parts, or
their roster villager. Two prefs, the sender's own, one slot each, checked whole (`lookPrefOk`, `savedLooksOk`):
- `look`: `{kind: 'player', look}`, `{kind: 'villager'}` or null. Null or unset is **いつもの**, the default look:
  code (`DEFAULT_LOOKS`: `design/avatar/render/outfits/a.json`, `b.json`; the guest's its villager), never stored.
  `savedLooks`: the コーデ, at most 20 of `{id, name, look}`.
- A player `look` (v 1): `hair`, `eye`, `mouth` (part ids), `hairColor`, `eyeColor`, `skin` (`#rrggbb`), `mouthFrame`,
  `cheek`, `nose`, and `top`, `bottom`, `socks`, `shoes`, `glasses`, `ornament` (a part id or null), `hat` (optional);
  no other key. A part id is its slot's dump folder family (`PlayerHair…`, `TopsTex…`); a one-piece top has no bottom;
  only the closet's part table's ids pass (`usePartTable`).
- **Reading** (`resolveLook`, `readSavedLooks`): part by part, so a field missing, broken or unknown (a newer app's)
  is いつもの's for that field alone; the stored row is kept as it is. Neither pref is private.

## API

`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `forbidden` · `bad_request` · `too_large` ·
`busy` · `unavailable`. Body cap 1,000,000 characters.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate before any check (a retry whose time rules have lapsed, a buy days on, is never refused), so retries are safe |
| `events` | `events: [{id, type, data, group?}, …]` (≤ 50) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}]}`: each kept in order as `event` would, `at` its stored row's; one whose write throws is `unavailable` alone. A `group` ([below](#groups)) is all or none |
| `snapshot` | `since?` (ISO: the max `at` cached); `page?` (1–10,000 rows), `after?` (the last page's `next`) | `{ok, me, now, rev, rows:{metrics, events}, next?}`: compact arrays in column order, rows with `at > since`. With `page`, at most that many rows in (at, table, seq) order and `next` (a cursor) while there are more: the pages together are the whole reply. Without `page`, every row at once (the log's `req` says `pg` 0) |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows, newest first |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build: 'relay-2'}` |

<a id="groups"></a>**Groups:** side-by-side events of one `group` (the shop's 全部: one `buy` a piece) are all or none
in one transaction: a piece the sender owns already is refused `owned` alone, any other refusal rolls the lot back
(the rest `detail: 'group'`), a throw makes them all `unavailable`; a retry of a kept group is all duplicates. A bad
`since`, `page` or `after` (or `after` without `page`) is `bad_request`; an unknown action too.

## Auth and limits

- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time; a key that isn't 32–128 hex characters is refused before any comparison.
  `KEY_A` and `KEY_B` also derive the server-to-server secret that signs `/notify` and `/admin` (never `KEY_C`): a
  rotation updates the admin tools' keys file too ([runbook §3](ops/runbook.md#3-rotate-a-key)).
- **Rate limit:** 120 requests per key per minute (in the record's memory); over it, `busy`. A snapshot's later pages
  (`page` with `after`) have their own 600 a minute.

## Record state

The record's `meta` table keeps `last_at` (the next `at` is max(now, `last_at` + 1 ms)) and `rev`. A Durable Object
runs one request at a time and each write is one SQLite transaction, so a snapshot never sees half of one; an ack is
sent only after its transaction committed.

## Revision

`rev` is the record's epoch (`e1`, `e2`, …): it changes only when the record is rebuilt (a restore, its new epoch ~5 s
after the restart; or `node scripts/record.ts rev`). A new epoch, and a `load` that added rows, send `changed`. A
`snapshot` whose `rev` or `me` differs from the cache's makes the client drop the cache (never the unsent queue) and
fetch everything. Locked weeks' earnings are memoised per `rev`. Nothing edits the record by hand.

## Ingest

`relay/src/parse.ts`: newline-joined Text lists, one line per day, each optional (the fields and what each is stored
as: [shortcut §1](ops/shortcut-health-sync.md#1-what-the-shortcut-sends)); other fields are ignored. A list whose
length differs from `dates` is dropped with a warning; an unreadable line, an activity value above `METRIC_BOUNDS`, a
weight outside 20–300 kg or a body value outside `BODY_BOUNDS` is skipped (out of bounds: with a warning). A body with
none of the fields is `bad_request` (audited as `error`). **A date repeated** in `dates` (a time-zone change) keeps an
activity metric's largest, a weigh-in's last line (`dates: N repeat a date`). A run whose write throws still leaves an
`error` audit row (`not saved: <class>`, after the rollback) and answers `unavailable`.

**Body metrics:** aligned to `dates` like `weight`, one decimal, never earn; body fat ≤ 1 without a `%` is ×100.

**Steps:** Find Health Samples sums every source, so the Shortcut sends each device's list, filtered by Source, and a
day's steps are max(`steps`, `steps_watch`) (close to Health's own merge; a day unreadable in one list takes the
other). Without `steps_watch`, `steps` is stored as sent.

**Latest wins:** a row is appended whenever a value differs from the last row for (person, date, metric), lower or
higher, never the same value twice. One exception: a `0` for a **past** Tokyo day whose latest row is above 0 is
**held, not appended** (`N past zeros held`: a run that read nothing, Health locked, would rewrite the history). It
goes to `metrics_held` (first and last seen, how many times, `promoted`), never served, in every dump and load; the
admin promotes a real correction (`record.ts held`, `promote`: [runbook §9](ops/runbook.md#9-the-record)). The model
reads a day's latest row; a locked week as of its lock (Wednesday 04:00).

**A day without the Watch:** Fill Missing sends `0` for a day without samples, stored as sent; the model reads such a
day as no data for Move, Exercise and Stand (`model/health.ts activityOn`, [decisions](decisions.md#no-watch-days)).
An empty line (the Shortcut's optional step 8d) writes no row, counted under `skipped`.

## Client sync

`lib/sync/` (storage, transport, pairing, queue, cache, the live socket) and `lib/store/` (the week store, actions,
`live.ts`, `view.ts`, `synced.svelte.ts`, the demo backend, loaded only with `?demo`).

### Storage keys

`sync/storage.ts` registers every key: live `island.key`, `island.me`, `island.queue`, `island.acked`, `island.sentAt`;
the demo's `island-demo.*` (never a live key); per device `island.device` (its id, made once: the hello's `dev`),
`island.sound`, `island.locale` (so an English launch loads its strings before the first paint) and `island.wx` (the
last weather timeline). If storage fails the data lives in memory for the session, with a banner once. Pairing as
another person clears the cache, queue and acked list. `sync/transport.ts` `post()` never throws (20 s timeout;
network failure = `offline`; timeout, non-2xx or non-JSON = `unavailable`).

### Snapshot cache

`sync/cache.ts`: `{me, rows, since, rev, rowsAt, skewMs, fetchedAt}` in IndexedDB (database `island`; in memory if
unavailable): a `meta` record (all but the rows) and the rows in **segments**, 1,000 a record per table
(`seg:<table>:<key>`, listed in the meta); a save rewrites only the segments from the first change, with the meta in
one transaction. A listed segment missing, or anything else in the store, reads as no cache (a full fetch).
- **A refresh** posts `snapshot` with `since` and `page` (4,000 rows), fetching each page after the last one's `next`
  and applying them together at the end (`fetchPages`: a page that fails leaves the cache as it was, a new epoch
  between pages starts over; only a runaway's 100,000 rows stop it).
- **The merge** (`model/snapshot.ts`): deduped by natural key, ordered by `at`; an empty poll keeps the same rows
  object (nothing re-reduces); rows that only append are folded over the last State (`model/state.ts foldRows`).
  Overlapping refreshes share one request; a `fresh` caller waits for one more after any in flight; a reply landing
  after a re-pair is dropped.

### Compaction

On each merge `model/compact.ts` drops the `metrics` rows of locked weeks the model can no longer read (per person,
date and metric the latest at the lock and the latest overall stay; weight the newest per day): ~90 % go, the views
unchanged. The rule is the contract's (`contract/compact.ts compactKeep`, `weekLockMs` = the model's `finalMs`). A
replaced `tally` goes too, and a `food`, `food_recipe` or `food_custom` op the fold no longer reads (`model/food.ts
foldedAway`; every `food_repeat` stays). The record keeps every Health row ([The record](#the-record) "Compaction").

### Write queue

`sync/queue.ts`: events in `island.queue`, sent in order until acked; the queue and the acked list are read and written
once a batch. What may go now goes in one `events` request (≤ 50 events, ≤ 900,000 characters; in queue order, the
holds and subjects below kept), answered by id. A request refused whole (`too_large`, `bad_request`) is halved and
sent again at once; one event alone so refused, or too large to send at all, is set aside.

- **Paced** (`store/live.ts SEND_PACE_MS`, 600 ms): a send within 600 ms of the last flush's start waits for one
  trailing flush that takes everything gathered; the first after a quiet spell goes at once, and a batch short of
  full ends the flush (`flush({paced})`). An editor burst of 125 ops a minute is ~100 requests, none `busy` (was one
  per op, past the record's 120 a minute a person). Hidden, the keepalive flush doesn't wait.

- **Day rows** (`tally`, `island`): a newer row of the same day replaces the queued ones (not in flight) in the first
  one's place.
- **Set aside** (`parked`): an event the record fails (`unavailable`) 30 times (`PARK_AFTER`, ~2 h) is kept and shown
  but no longer sent or blocking (later events on its subject wait with it); logged `queue.poison`; a sync tap
  (`unpark`) tries it again. Never dropped.
- **Unsent:** online, a write 2 minutes past its hold (`unsentStuck`) shows on the sync chip 「おくれて いない きろく {n} ·
  タップで おくる」 and in 設定 「未送信 {n}件（最終送信 {time}）」 (`island.sentAt`) with 送信: a tap sends them all.
  Offline, the sync pill counts the taps waiting.
- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back, `holdEvent`
  moves its time. **Subjects:** a later event on the same spend (its `spend_void`) never overtakes a held one.
- **Groups** (`group`, the shop's 全部): none goes while any of it is held; then all of it side by side in one request
  (a batch's end never cuts one). A buy refused `owned` is dropped without the toast.
- **Replies:** acked (`ok` or `duplicate`) → into `island.acked` (in the view until a snapshot holds the id, at most
  5 minutes), out of the queue. `bad_request` / `too_large` → dropped with a message; `unauthorized` → pairing; other
  errors keep it and all after it, backing off 1 s, 2 s, 4 s … ≤ 5 min, ±20 %.
- **Retry now:** `online`, a sync tap, the re-read after an ack, becoming visible and the socket's welcome (iOS often
  skips `online`) send backed-off events at once, at most once per 30 s.
- **Hidden:** on hide and `pagehide` the day rows still in their hold (a tally's 60 s, an island day's 120 s) go at
  once in `keepalive` requests (≤ 63 KiB each, under the browser's 64 KiB), so a phone locked right after a catch
  doesn't leave the partner behind. A buy's undo window keeps its time.

### Optimistic view

`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. The store recomputes on every change and
each minute (not while hidden).

**The meal log costs the island nothing.** `reduce` keeps the `food*` rows raw (`model/state.ts` RAW_EVENTS); only the
food sheet parses them (memoised per row). `npm run bench` (year 3): poll + 1 row → view 3–4 ms, 2–3 ms without.

<a id="live-sync"></a>
### When it syncs

On launch (after painting from the cache), on becoming visible (≤ every 30 s), a sync tap, `online`, and whenever the
relay says the record changed ([Push](#push)). Each refresh flushes the queue, then fetches.
- **Not when current:** on launch and on becoming visible the phone waits up to 2 s for the `welcome`, whose `rec
  {at, rev}` is the record's last change the room heard of; when the cache has it and was fetched within 15 minutes,
  it only flushes the queue.
- **On every welcome** a `rec` past the cache fetches (once per mark: a guest's filtered snapshot never reaches it), so
  a change made while the socket was down is fetched at once (`e2e/live-sync.spec.ts`).
- **After an ack:** the record answers each event with its stored row's `at`, and that row goes into the cache at once
  (`since` unmoved); only an ack without a row (a duplicate) is followed by a `fresh` re-read 1.5 s later.

**One device, one socket:** each hello says the device and the tab (`dev`: `island.device` + `island.tab`, the tab's in
sessionStorage, `sync/live.ts deviceId`) and replaces only that tab's earlier socket (4002: a reload's ghost), never
the person's other devices' or tabs'. Those hear the person's decor ops live
(the Mac's editor on the phone's island; `welcome.mine` and a `presence` of my own `who` say whether one is there),
and only the writing page skips its own `changed` (`sid`). A hello without `dev` replaces only those without it and
hears none of its person's own ops.

**Two tabs:** two tabs (or a PWA and a Safari tab) of one browser are two devices to the room (2026-11-10: they shared
a `dev`, and the second's hello left the first deaf). The synced stores (`store/synced.svelte.ts`: the decorations, the rooms, the
layout) merge what's in storage before they write and fold the other tab's writes as their `storage` events land.

**Conflicts:** every op merges commutatively per id (`at`, then who); two layout pieces moved onto one tile at once
are settled by the later op's phone ([island-layout.md](island-layout.md#ops-the-record-and-the-relay) "Two edits on
one tile").

<a id="the-record"></a>
## The record

- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime) in `IslandStore` (`idFromName('record')`,
  `storeObject.ts`). Tables: `metrics` (`seq`, `at`, `person`, `date`, `metric`, `value` REAL, `late`; unique (person,
  date, metric, at), index on `at`), `events` (`seq`, `id` unique, `at`, `person`, `type`, `data`, `slot` unique,
  `late`; indexes on `at` and `type`), `ids` (every event id ever accepted), `uploads`, `meta` (`last_at`, `rev`,
  `schema_v`, the running ledgers below), `metrics_latest` (each day's latest value per person and metric, kept in
  each `metrics` row's transaction), `metrics_held` ([Ingest](#ingest) "Latest wins").
- **Schema:** `SCHEMA` (`IF NOT EXISTS`), then `MIGRATIONS`, run once each on the object's start, each step and its
  mark (`meta.schema_v`) one transaction; a change is a new step at the end, never an edit of one that shipped.
- **The Worker's gate:** the origin, method and size, and a person's key in the body (`storeRoute.ts keyGate`: a
  bounded scan for a top-level `"key": "<hex>"`, not a parse; a keyless body only ≤ 512 characters, for `health`),
  else `unauthorized` there, so a stranger never costs a Durable Object request; the object checks the key again.
- **Rules** (`app/src/lib/contract/record.ts`): the shape checks (`validEventData`); `at` one per ingest, one per
  event; an event id once, forever (`ids`: a late retry of a replaced event is still a duplicate, acked before any
  other check); **slots**, a later event of a slot replacing it: a tally and an island day per sender and day, a
  cosmetic pref or a latest-only goal per subject, a daily goal per subject and Tokyo day (`goalDay`, `dailyGoalOn`),
  and the per-id ops of [Events](#events) (`decorAccept`, `tentAccept`, `boardAccept`, `foodAccept`, …). A pref the
  model ignores takes no slot; a `highfive` event is acked and kept nowhere.
- **The shop's check** (`shopTarget`): against each person's running ledger (meta `shop|<who>`: per species tallied,
  given back, sold and fetched; かいがら, owed, the pieces), kept in the same transaction as each tally, give-back, sell
  and buy (`shopNote`, by the fold's own step `contract/shop.ts shopStep`), folded from the rows when absent (after a
  `load`); the admin's `shopcheck {fix?}` compares it with the full fold.
- **A decor op's check** (`decorTarget`): only its own slots' rows (the piece's, its light switch's, the layout's
  reset) and the caps' counts (meta `decor_live`, `decorNote`; recounted after a reset or a load; `decorcheck {fix?}`).
  A reset drops the voided object and chunk rows by their slots' range and `at` (`dropVoided`).
- **Ingest:** `relay/src/parse.ts`, the audit row (`relay/src/audit.ts`), each day's latest value from
  `metrics_latest`. `relay/test/ingest-golden.test.ts`: a week of both phones' real body shapes against a golden.
- **`since`:** from the `at` index (an empty poll reads one row). A row that arrived out of `at` order (an import's)
  is marked `late`, and a poll also returns late rows that arrived after `since` − 10 s.
- **Admin:** `POST /admin`, signed like `/notify` ([Push](#push) "Auth"; the Worker verifies the signature and its
  5-minute window before the object, else 401; a `restore`, `rev` or `logpurge` is taken once per signature,
  `admin_seen`). Its ops ([runbook §9](ops/runbook.md#9-the-record)): counts, bookmarks, restore, a new epoch, a paged
  dump, the compaction, `held` / `promote`, `shopcheck`, `decorcheck`, the log's (on its own object), the weather, and
  `load`: rows with their `at`, by the same rules, idempotent; a slot's row kept unless the one it holds beats it (a
  dump holds each slot's latest only: `test/restore.test.ts`).
- **Push-driven:** after a write the object tells the room ([Push](#push); a failed call tried once more), which keeps
  the last `rec {at, rev}` for each `welcome`.
- **Compaction** (`store.ts compact`): the phones' rule (`contract/compact.ts`) on the record's `metrics`. **It is off:
  every Health row is kept.** The cron runs it (04:15 Tokyo) only with `COMPACT_CRON=1`, unset
  (`relay/test/compact.test.ts` fails while it is set anywhere); the admin's `compact` needs `confirm:
  'delete-health-history'`. When run: a date at a time, ≤ 5,000 deletes a run, no new epoch.
- **Snapshot size:** a year of three people is ~50–100k rows, ~3–6 MB of JSON (each Shortcut run appends each changed
  value of its 32 days), so the snapshot is paged ([API](#api)), 4,000 rows a page ([Snapshot cache](#snapshot-cache));
  `compact.test.ts`'s synthetic year: 49,215 rows, 5.16 MB.
- **A restore** (`restore {bookmark}`): every `/api` request is `unavailable` (retried, never acked) from before the
  bookmark is set until the restart, so no write is acked and then dropped; the restored record starts a new epoch.
- **Backups:** point-in-time recovery (30 days, on the Free plan) and `dump` / `load`: [runbook §9](ops/runbook.md#9-the-record).

## Live relay

Presence between the phones while they have the app open (decisions: *Live relay on Cloudflare*). The room carries
intents, never data of record: the record still catches an offline phone up.

- **Where:** `relay/` (its own package): a Worker (`src/index.ts`) and `IslandRoom` (`idFromName('island')`,
  `src/room.ts`). Production `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy,
  `island-fund-relay-test`, with its own secrets, for the smoke test. `GET /health` → `{ok, v, versions, t, wx}`
  (`wx`, asked of the room at most once a minute: [The real weather](#the-real-weather)); `POST /api`, `/admin`,
  `/notify` ([Push](#push)), `/log` ([observability](ops/observability.md)), `/stt`.
- **Admission:** `/room` upgrades only from `ALLOWED_ORIGINS` (`https://island-fund.pages.dev`) and
  `http://localhost|127.0.0.1`, else 403. The origin only keeps other sites out; the key is the auth.
- **Tickets** (`contract/ticket.ts`, `auth.ts admission`): a paired phone opens each socket with the subprotocols
  `island-v1` and `tk.<who>.<exp base 36>.<HMAC-SHA256 under the person's key>` (`exp` ≤ 10 minutes ahead of the
  relay's clock; the phones make it for 5). The Worker checks it first: bad or stale, 403; good, marked with its person
  (`X-Island-Ticket`, set only by the Worker), its hello must be that person's (else 4001) and it is never let go to
  make room for another. A ticketless socket is refused too (2026-11-10: every build since 11-05 sends one; it cost
  the room a request and a hello's alarm). A phone whose two ticketed sockets fail tries one without
  (`island.liveTicket`), which the 403 sends back to tickets; a phone clock over 5 minutes off has no live socket.
- **Auth:** the first message is `hello {key, since?, build?, beat?, dev?}` (`build` logged as `ws.hello`; `dev` the
  device: [One device, one socket](#live-sync)). The room compares the key in constant time with `KEY_A`/`KEY_B`/`KEY_C`
  and answers `welcome {me, peer, t, rec?, here, gone?, hb?, mine?}` (`rec`: the record's last change; `here`: everyone
  else here; `gone`: when each person's last socket closed; `mine`: another device of mine is here), or closes 4001.
  No hello within 12 s: 4003. A second socket of the same device replaces the first (4002, no presence flicker); at
  most 4 wait for their hello (a new one lets the oldest go: 4003, `room.full`).
- **Protocol** (`app/src/lib/contract/live-protocol.ts`, both sides' parsers): JSON, `v: 3` (`LIVE_VS`), ≤ 256 bytes
  (an intent ~60–100; a `replay` ≤ 16,000). Client intents, each field's bounds the module's:
  - The shared world's ([Shared world](#shared-world)): `walk {to, at?, from?, via?, s?, ms?, f?}` (the very walk, on
    the relay's clock; integers within `WORLD_X` × `WORLD_Z`), `act`, `catch`, `world {op, id}` (`watered`, `wished`,
    `woke`), `pick`, `put`, `shake`, and `decor` (the record's op: kept for the day; an `at` a day ahead refused).
  - Presence only: `drag` (a piece under the finger), `tent` (my villager in a room: `sc` `u` / `v` another home, `m`
    the museum, `s` the shop), `fish {ph, …}` (`cast`, `nibble`, `bite`, `reel`, `off`; again when someone comes),
    `say {text, sc?}` ([Villager taps](design.md#villager-taps); `cleanSay`; one a second a person), and ききみみ's
    `quiz` and `play` (never kept, replayed, acked or written: [kikimimi-engine.md](kikimimi-engine.md#the-play-wire)).
  - `highfive {at}`: numbered; with the recipient away the room holds the last one per (sender, recipient) until their
    `got {at}` after their next welcome, or a day ([decisions](decisions.md#a-high-five-goes-over-the-relay-only)).
  - `music {src, at, song?, ms?, pc?}` ([sound-sync.md](sound-sync.md)): numbered and acked, never in the ring; the
    room keeps the last record per source (`newerMusic`), refuses a stale or finished one (`ack ok: false`) and sends
    the live ones after each welcome.
  - `saved {}` ([Push](#push)), `ping {c}` → `pong {c, t}`, `got {at}`.

  Relay-only: `changed`, `wx`, `presence {who, on}`, `replay {es}`, `ack`, `busy`. The room drops any client-sent
  `who`/`t`, stamps its own (`t` strictly increasing) and relays to the others; a `decor` op also to the sender's
  other devices.
- **Numbered intents and acks:** an intent may carry `c`, the phone's sequence number for the day; the room answers
  `ack {c, t, ok}` (`ok` false when the world refused it: a claim already made, a nest too soon, a walk older than the
  one it keeps). A resend of a kept intent, or of one of its last 64 acked (`acked`, in storage), is acked again, never
  relayed or kept twice. It relays before it writes the day, and acks after the write (an ack is durable).
- **Heartbeat:** `{"v":3,"kind":"hb"}` → `{"v":3,"kind":"hb","t":0}` (`HB_PING` / `HB_PONG`), answered by the runtime
  (`setWebSocketAutoResponse`): it never wakes the room or bills duration; `hb: true` in the welcome says so.
  **Ghosts:** a hello with `beat: true` sends something after 20 s of silence; the room closes such a socket silent
  for 60 s (4003 `silent`, its person gone for the others: `sweepSilent`), stamped gone at its last beat, so the
  partner's grace runs from when the phone went (was from the sweep, up to ~90 s later).
- **Versions:** an unknown `v` closes 4004 and the client waits for a reload; a bump ships as decisions.md
  [Relay versions side by side](decisions.md#relay-versions-side-by-side) says (`npm run logs -- report`, *Live hellos*).
- **Limits:** per socket a token bucket of 20, refilled 20/s; beyond it messages are dropped, and a numbered intent
  hears `busy {c, t}` (resent later). `ping`, `got` and the heartbeat never wait on the bucket.
- **Replay:** a hello with `since` (`island.liveSince`) gets the day's newer changes after the welcome, mine too, in
  `replay {es}` messages of ≤ 16,000 bytes, in the room's order ([Shared world](#shared-world)).
- **Cost:** the Hibernation API (`ctx.acceptWebSocket`): an idle socket keeps no object in memory
  ([budget](ops/observability.md#request-budget)).
- **Client** (`app/src/lib/sync/live.ts`, `liveRelay()`: one socket for the app): connected while visible and online,
  reconnecting with backoff (1 s doubling to 15 s, ±25 %); after 4001/4002/4004 it waits until the page is shown again.
  - **Clock:** pings at welcome and +2 s; the offset is the shortest round trip's of the last 8 (`serverNow()`), kept
    across reloads (`island.liveOffset`, trusted 6 hours, never when the device clock went back), so a stamp before the
    first welcome is on the relay's clock too. The shared world's Tokyo day is `world.now()`'s, never the device's.
  - **Liveness:** a socket quiet for 20 s is probed (the heartbeat, or a ping at most 5 minutes apart for the clock);
    nothing within 10 s gives it up (4000) and opens a new one; `pageshow` and `focus` probe too. The welcome is due
    within 10 s (else 4010), and a socket still opening 4 s after the app comes back is replaced.
  - **The outbox:** what the room keeps (`isStored`) goes even with the partner away, numbered, and waits in an outbox
    (≤ 120, a walk replacing the one before; full, the oldest layout op goes first) until its `ack`; after a reconnect
    it goes again (12 at once, then one every 60 ms; another day's dropped). Kept in localStorage
    (`island.liveOutbox`, under the person key's hash; two tabs merge it), so an intent made offline survives a kill;
    a send the socket's buffer turns away goes as it drains, in order. An ack is due
    within 5 s: overdue, the socket is probed and it goes again (the wait doubling to 60 s), dropped after 4 tries
    (`ws.unacked`: a catch is still in the record's day row). Acks reach `onAck`'s subscribers; an `ok: false` is a
    race lost ([Shared world](#shared-world) "A race lost"). A layout op sent with someone there is numbered too
    (`isLayoutIntent`): acked, never kept, so a save of 40 ops past the bucket is resent.
  - `send(intent)` is a no-op returning false unless welcomed and, for what the room doesn't keep, someone is there;
    it never throws or blocks. `on()`, `onStatus()` `{connected, me, peer}`; `LIVE_URL`, overridable by
    `VITE_LIVE_URL` (empty = off); `metrics()`: messages, bytes, resends, acks' round trips, what's waiting.
- **Measured:** the relay's latencies, in [perf.md](ops/perf.md) "Measuring".
- **Tests:** `relay/test/` (keys, origins, the bucket, the room, the notify secret; `cd relay && npm test`, also
  `.github/workflows/relay.yml`); `live-protocol.test.ts`, `live.test.ts`, `live-room.test.ts` (the client against
  the real room) and `store/push.test.ts` in the app's vitest.

## The real weather

Tokyo's sky by the hour for the island ([design](design.md#weather); decisions: *Weather from Tokyo, by the hour*).
`relay/src/weather.ts` (pure but for its fetch), `IslandRoom.weatherTick` (`relay/src/index.ts`), the phones'
`sync/wx.ts` and `island/weather.ts` `realWeatherAt`.

- **Source:** Open-Meteo's forecast, JMA's models (`/v1/forecast?models=jma_seamless`, hourly `weather_code`,
  `precipitation`, `cloud_cover`, `visibility`, `temperature_2m`; `past_hours=13`, `forecast_hours=36`), for one fixed
  point (`wrangler.toml` `WX_LAT` / `WX_LON`: central Tokyo). No key, CC BY 4.0, credited in 設定; no phone calls a
  weather API. JMA's model gives no snow, fog or thunder codes for Tokyo: snow comes by temperature.
- **When:** the Worker's cron at :15 and :45 calls `weatherTick` (48 wakes a day; `*/15` woke the room 96 times). A fetch is due 30 minutes after a good one, or past :45 with
  none since (the next hour locked before it begins; `weather.ts due`): about 48 a day; a hello fetches too when due
  (the test copy has no cron). One at a time, a 5 s timeout; a failure keeps the timeline, logs `wx-fail <why>` and
  backs off 30 min, 1 h, then 2 h.
- **The timeline** (storage `wx`): `{h0, s, fx?, hi?, at, src, rev}`: `h0` the first hour (hours since the epoch, UTC),
  `s` a letter an hour (`c` fine, `o` cloudy, `r` rain, `h` a downpour, `s` snow) for the 12 hours before now (the
  rainbow looks back) and the next 36, `fx` the foggy hours, `hi` `[tokyoDay, °C]` the day's high (しずえ's news), `at`
  the fetch time, `src` `om` or `fx` (an admin fixture), `rev` bumped when an hour a phone holds would read otherwise.
  The response is checked strictly, so bad data never replaces good.
- **The mapping** (`weather.ts`): dead bands on the hour before's sky (wet from 0.5 mm/h or a rain code, kept down to
  0.2; snow by a snow code or wet at ≤ 1 °C, kept up to 2 °C; fog under 1 km while dry); a lone hour between two alike
  is theirs.
- **Locks:** an hour that has begun (and the next, after a fetch past :45) keeps its sky, so a phone that cached it
  shows the same as one online.
- **To the phones:** `wx` after the welcome (while the timeline serves: fetched within 36 h and covering the hour) and
  on each `rev`; ≤ ~190 bytes, cached as `island.wx`.
- **The phones:** in ほんもの mode (`pref weatherMode`, slot `pref|island|weatherMode`, the last anyone set) the hour's
  sky is the timeline's while it serves, else the seeded day's; winter's snow, the event nights held fine, the seeded
  fog and aurora and the rainbow are the phone's rules (pure, by the date).
- **The island's look** (`pref seasonLook`, 設定 → 季節): `{event, season, weather, tod}` (each `[a-z0-9-]{1,24}` or
  null) or `null` (自動), slot `pref|island|seasonLook`; a phone reads the values it knows.
- **Ops:** `GET /health` → `wx {at, src, age (min), hours (ahead), fails}`; the signed `/admin` op `wx`:
  `{refresh: true}` fetches now, `{s, fx?}` puts a fixture in (the smoke test), `{}` says how it is. Weather is never
  written to the record; only the mode is.
- **Tests:** `relay/test/weather.test.ts` (recorded Open-Meteo responses against golden timelines, a fake fetch and a
  fixed clock), `room.test.ts`; the app's `island/realWeather.test.ts`; `e2e/realweather.spec.ts`; `npm run smoke`.

## The guest

A third person, a visitor rather than a member ([design](design.md#the-guest), [decisions](decisions.md#the-guest)):
one key, `KEY_C` (unset = no guest), who `G`. The economy, the members' goals and real-world records, the Health
ingest, the trees, きろく, けんこう and ふたりでぜんぶ stay A + B.

- **What it sees** (`contract/guest.ts guestRows` via `rowsFor`, on every snapshot of the guest's key): the members'
  activity (`steps`, `exercise_min`, `move_kcal`, `stand_min`), every event but the からだ goals (the registry's `body`
  group) and a member's profile; its own `listen` rows whole and the members' as summaries. Never a からだ row
  (`weight`, `body_fat_pct`, `bmi`, `lean_kg`). A member's snapshot never carries the guest's profile.
- **What it writes** (`guestMayWrite`): everything on the island a member writes, by the same rules (`find`, `tally`,
  `tally_back`, `island`, any `decor` op but another's home, `board`, `sell`, `buy`, `pack` on its own ids, its own
  `pack_chk` / `pack_reset`, its own meals, repeats, recipes and custom foods, `listen`, its own cosmetic prefs, the
  meal log's goals, its profile, `weatherMode`, `seasonLook`). Not `spend`, `spend_void`, `harvest`, a member's or an
  activity / からだ goal, a `trip_note`, the wedding board, `ingest` or `uploads`: `forbidden` (the queue drops it).
  Its rows are `person = G` (the merge order A < B < G).
- **The room:** the guest sends anything a member does; a scoped `decor` op of another's home is refused for anyone
  (`scopeMaySend`). `peer` stays the partner for a member and either member for the guest; a high-five names whom it
  is for (`to`).
- **Push:** its own `changed` notices reach every phone; of the members' it hears an event's, an ingest's only when it
  brought activity rows (`notify(n, guest)`), and a new epoch's; its welcome's `rec` is the room's `recG` (both marks in the room's one `marks` key, with its rows
  written: `index.ts Marks`).
- **The phones:** a member's draws the guest's villager as a third actor (`ui-state/cast.ts`: `mine`, `partner`,
  `third`; on the guest's phone `third` is B); the guest's phone guards what it sends by the same rules (`week.send`
  by `guestMayWrite`).
- **Tests:** `relay/test/guest.test.ts`, `contract/guest.test.ts`, `model/guest.test.ts`, `e2e/guest.spec.ts`,
  `e2e/island-edit.spec.ts`; `npm run smoke` with `KEY_C`.

## Ambient life

What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug
coming by) is decided per 10-second slot of the Tokyo day from the date, the slot and the shared world (decisions:
*Ambient life from the clock*). `app/src/lib/components/island/ambient.ts` (pure, `ambient.test.ts`); idle life and
the critters play it.

- **Clock:** `slotAt(ms, offset)` → `{date, slot, into, hour, month}`, 8,640 slots a day. `ms` is the island's clock
  (`clock.ts now()`: a `?date=` preview moves the slots), `offset` the relay's clock minus the device's
  (`ambientClock.ts relayOffset`, 0 before any welcome). A slot plays `DECIDE_MS` (500 ms) after it starts, when an
  intent sent before the start has reached the partner.
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")`, kinds `villager`, `visitor`,
  `host`, `critter:<channel>`; species from `pickFish`, `pickFresh`, `pickDive`, `pickBug` by the sky at the slot's
  start (`weather.ts yieldSkyAt`). Engine-proof: integer world points, squared distances, plain string order.
- **Villagers** (`villagerBeats(world, date, slot)`, from each villager's `at`, `home`, `free`, `lastIntent`,
  `wander.ts pois`, the phase and both day scores): one beat a slot, an idle move from `IDLE_POOL`, an outing of 1–3
  stops within 600u (30 % of slots, one villager out at a time; `avatar.ts outing`), or a chat or a dance for two free
  villagers (a dance only with both scores ≥ 70). A sleeper is never free. A villager whose person has the island open
  makes small moves but no outings, left alone 12 slots after its person's last walk (`held`). The guest's villager
  joins while awake, with no outing and no tree shaking.
- **Visitor:** `Visitor.svelte beat(r)` runs `visitorLife.ts pickAct`, `pickEmote` and `strollSpots` on the slot's
  `visitor` PRNG; a phone whose visitor is speaking skips it.
- **Critters** (`spawnsIn(date, slot, coasts)`, `crittersAt`): per channel (the front beach's `sea` and its `bubbles`,
  odds `BUBBLE_ODDS`; one per coast stretch `sea1`…, `island/coast.ts coasts()`; one per fresh water; two bugs, `bug`
  and `bug2`, the second's spot off the first's, `bugRivals`) a slot brings one with odds 0.9 once the last one's stay
  is over, staying 4–5 slots (bubbles 3, a bug 2), chained per 10-minute block, so a phone opening mid-stay finds the
  ones still there. Where each is comes from its seed (`critterPath.ts`, `legAt`), never a camera. Its id is
  `<kind>:<slot>` (`fresh:<water>:<slot>`, `fish:c<k>:<slot>`, the second bug's `bug:l2:<slot>`).
- **Agreement and its limits:** the same inputs give the same slot (tested with shuffled inputs and skewed clocks).
  Phones differ only where their inputs do: a clock offset past the margin, a walk within ~20 ms of a boundary, a local
  skip (a sheet, a reaction playing), the camera. What a person does by hand (a bite plan, a dive's chase, a balloon's
  flight, a shooting star, the visitor's lines, sounds) plays on their phone; its outcome is shared.

## Shared world

Every phone shows the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*;
what it looks like: [design](design.md#shared-world)): what comes by itself is [Ambient life](#ambient-life); what a
person does is a small intent over the relay, kept by the room for the day, folded by every phone into the same day.

- **The day** (`sync/world-day.ts`, pure, `world-day.test.ts`): a `WorldDay` folded from the day's intents in the
  relay's order: claims (`catch:<id>`, `pick:<id>`: who got it, what, how, where), puts, the shakes in order, watered
  cells, wishes, each person's last walk. First wins: the relay drops a later claim, so a partner's claim of something
  I claimed too replaces mine. Claimed: a critter's catch or escape at the tap (`catch {what, id, at, how}`), a bug out
  of a bush, the rock or a villager (a `put`, `bug:<id>:<bush|rock|flea>`), a tree's shake and what it left (`br:`,
  `co:`, a dangling bug `dg:`, the wasps `ws:`), the day's things on the ground and fallen goal fruit (`pick`,
  `fr:<person>:<fruit>`), a balloon's present.
- **A race lost:** what my claim put in my pocket comes out again (`world.lost` → `store/actions.ts lostRace`), with
  「〇〇が さきに とったよ」. A catch still in the held or queued tally is sent again one less; one whose tally went is
  given back by a `tally_back` ([Events](#events)). Today's counted claims are kept (`island.counted`), so this works
  after a reload or a kill. **A refused claim** (`ack {ok: false}`) is a race lost the same way. A claim in the day is
  gone on every phone (`lying`, `takenIds`) and can't be made twice.
- **The store** (`store/world.svelte.ts`, `world`): today's day, kept in localStorage (`island.world`; the demo's per
  tab); `share(intent)` folds my change (refused when someone already has it) and sends it at once (never behind the
  record's hold); `on(fn)` the others', `live` when it happened in the last 12 s (the island plays it). Written once a
  burst.
- **The room** (`relay/src/room.ts`): today's world (Tokyo's day on the relay clock; a new day starts with only each
  person's last walk): the last 400 changes (past that, the oldest that claims nothing and isn't a walk goes, then the
  oldest claim) and each person's last `walk`, in one storage value (`ring`). The day's claims and each tree's last
  nest are kept apart (`day`, `DayIndex`), so neither a trimmed ring nor a hibernation lets a claim be made twice; a
  second nest from a tree within the hour is refused (`NEST_GAP_MS`). A page's first hello asks from Tokyo midnight
  (or the kept `since`).
- **The demo** (`sync/live-local.ts`): the players are tabs of one browser (`?demo`, `?demo&as=B`, `as=G`); a
  BroadcastChannel carries the intents and the sending tab plays the room's rules on a log in localStorage
  (`island-demo.relay`), so the two-player e2e run without a network.
- **The record's day row** (`island` event, `store/actions.ts sendIslandDay`): my part of the day (`rowOf`), sent
  whole when it grows, held 2 minutes, only once this session's fetch has folded the record's rows in. The model keeps
  each person's latest (`state.islandDays`); the store folds in today's (what the relay didn't bring), yesterday's
  watering (today's hybrids) and the wishes for the mornings to come (`applyRow`). A shake's `at` is its identity on
  every phone.
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each phone moves
  its own villager; every walk and put goes as the very walk (`walk {to, from, via, s, ms, f}`, `s` on the relay's
  clock). The partner's phone plays it from the same start: late, from where it is by now (`along`); a gap ≤ 160u is
  walked off within the walk's time, a bigger one glides (≤ 1.5 s); never a jump in view. A walk under way is said
  again every 5 s while someone is here. A phone gone leaves its villager where it last stood, across days
  ([decisions](decisions.md#a-villager-stays-where-it-was-left)); back, it says where it stands after its welcome.
- **Sleep** ([design](design.md#sleep)): a villager sleeps while its person is offline: not in `here`, its `gone` (the
  room's clock) over 45 s ago (`ui-state/presence.ts`). A wake is `act {act: wake, id: <whose>, at}`, kept in the day,
  so every phone wakes it till `at` + 60 s (`playWake`); Gulliver's is `world {op: woke, id: gulliver}`.
- **The decorations** (`store/decor.svelte.ts` on the `Synced` base): each change is one `decor` op, to the relay at
  once (kept in the day's ring) and to the record's queue; merged by id (`contract/decor.ts`), kept in localStorage
  (`island.decor`); my op's `at` is on the relay's clock, after the op it replaces.
- **Checked** (`e2e/sync-harness.spec.ts`): two players run a scripted session (walks, a pick-up, a catch, a present,
  watering, a shake, a wish, decorations, both grabbing one thing at once), then both phones (and a third opening
  later) must have the same canonical day (`world-day.ts canonical`, `hash`), decorations and villager points. On the
  demo's tabs in CI; against the test relay with `RELAY_E2E=1 … --workers=1`. `world-day.test.ts` runs a 40-change
  session with conflicts, a dropped socket and a late join on the real `RoomCore`.

## Push

While the app is on screen, a change to the record reaches the other phones in well under a second (decisions: *Push
through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches up a phone that missed it.

- **Record → room:** after a write that added `metrics` or `events` rows (never a duplicate, a refusal or a read), the
  record calls the room (an RPC, after its commit) with `{what: 'ingest'|'event', who, at, rev, sid?}`. `POST /notify`
  (signed, below) takes the same notice from a server (`npm run smoke` uses it).
- **Auth:** the notify secret is HMAC-SHA256(key `"<KEY_A>:<KEY_B>"` trimmed and lower-cased,
  `island-relay-notify/1`), derived by both servers; a phone holds only its own key, so it can't sign. Rotating a key
  rotates it ([runbook §3](ops/runbook.md#3-rotate-a-key)); the same secret signs `/admin`. Each POST carries
  `X-Island-Time` (ms) and `X-Island-Sig` = HMAC-SHA256(secret, `"<time>.<body>"`), hex; the relay refuses a signature
  more than 5 minutes off (401), a body over 256 bytes (413) or a bad notice (400), and answers 204 with
  `X-Island-Heard: <sockets>` (`relay/src/notify.ts`).
- **Relay → phones:** `changed {what, who, at, rev, sid?, t}` to every authenticated socket, the writer's too (a
  Shortcut upload reaches its own phone), the guest's only of what it may see; the last mark is the welcomes' `rec`.
- **The nudge:** after an ack the phone sends `saved {}`, relayed like any intent, until a `changed` has reached it
  this session.
- **Client** (`store/live.ts`): `onChange` → one `refresh({fresh: true})` 300 ms later (changes together make one),
  skipped when the cache has it and for this page's own `event` (`sid`; my other devices' are fetched).

## Notifications

None ([decisions](decisions.md#no-notifications); `e2e/no-notify.spec.ts`: nothing asks, subscribes or calls `/push`).

## Service worker

`app/src/service-worker/` (pure rules in `caches.ts`). No `push` or `notificationclick` handler.

- **Registration:** by the app, not Kit (`kit.serviceWorker.register = false`; `lib/ui-state/swLate.ts`): once the 3D
  island has its models in (Island3D's `loaded()`) or can't draw; off the island 2 s after the window's load; on the
  island 30 s after the start at the latest, so a first visit's precache never competes with three.js and the models.
- **Install:** precaches the built JS/CSS and the static files `caches.ts precachable` keeps (not the rarer font
  slices, audio, the art manifest, the app icons, art beyond the defaults, the food data and pictures, the guides'
  photos, MapLibre or ききみみ's parts: those on first use). The hashed chunks are all or nothing (`addAll`, an older
  shell's copy where it has one); the static files go by content hash (`caches.ts installStatics`, hashes from
  `vite.config.ts swPrecacheOnly`), copied from an older shell or fetched `no-cache`, each on its own.
  (An install after a deploy measured: sw-measure.ts at the `probes` tag.)
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it) and the runtime caches; deletes the rest.
- **Navigations:** this version's cached shell at once (installed with its chunks, so the HTML matches them;
  `caches.ts isShellOf`); every deploy changes the worker, which the browser checks on each navigation. No shell of
  this version yet: network first, an older version's shell offline or after 3 s.
- **Updates:** Kit's `_app/version.json` check (on focus and on coming back to the front) sets `updated`; the layout
  waits for the new build's worker (`ui-state/reload.ts newWorker`: it installs, skips waiting and claims the page) and
  reloads once nothing is open. Never on a timer; a failed install reloads nothing. `e2e/sw-update.spec.ts`
  (`scripts/serve-build.ts /__e2e/deploy` stands in for a deploy).
- **Packs** (the players' and ききみみ's): fetched whole (Pages answers a Range with the whole file), one fetch at a
  time a URL (`caches.ts fetchShared`: two pages share it); an old slice (`?s=`) left in a cache goes at once.
- **Room cache** (`island-room-v1`: the rooms' and the 3D island's models, the players' parts and packs, the
  villagers' models): cache-first on first use, outliving builds (`caches.ts roomEvict`, `__room-index`): a file's
  older `?v=` goes at once, then past 40 MB the least recently used, never one used within 3 days.
- **Art cache** (`island-villagers-v1`: the villagers', critters', finds', ground's and decor's art on first use):
  past 30 MB the least recently used, never one used within a day (`ART_CAP_BYTES`, `__art-index`).
- **Listen cache** (`island-listen-v1`: `/audio/listen/<pack>.<hash>.pak`, [kikimimi.md](kikimimi.md) "Audio"): cache
  first, never revalidated, outliving builds; a Range request passes to the network. `listenEvict`: a pack's older
  version once unused for 10 minutes, then past 30 MB the least recently used, never one used in the last 10 minutes.
- **STT cache** (`island-stt-v1`, [kikimimi-mic.md "Hosting and the service worker"](kikimimi-mic.md#hosting-and-the-service-worker)):
  the whisper model and its ONNX runtime under `/stt/` (~70 MB) and its worker (`vite.config.ts stt-names`), filled by
  the page after the mic opt-in (`lib/mic/models.ts ensureStt`); the worker serves `/stt/` from it, never stores.
- **Offline:** what a phone has shown once reads offline; nothing is prefetched unasked. `e2e/offline.spec.ts`
  (Chromium, the worker on) checks each kind below.
  - *Precached* (`scripts/load-budget.ts` ≤ 3 MB): the Zen Maru Gothic slices holding ~99 % of the app's characters
    and Fredoka's Latin (`caches.ts PRECACHED_FONT_SLICES`; the rest on first use, `island-fonts-v1`), each trip's
    cover and the trail tracks.
  - *Photos* (`island-photos-v1`: the rest of `travel/` and `hiking/` and the wedding's banner): kept on first view,
    stale-while-revalidate once a day old (`caches.ts swrFetch`, `x-island-stored`), bounded at 20 MB. A photo that
    can't load is the paper placeholder (`ui/photoFallback.ts`).
  - *MapLibre* (its chunk, worker, CSS and engines) and *ききみみ's parts* (`levels/parts/<part>.json`'s chunks,
    `vite.config.ts kiki-part-names`): into this version's shell the first time they load, carried on by each install
    (`caches.ts carried`, `carryPlan`). Offline the maps import MapLibre only if a shell holds it
    (`travel/map/cached.ts`: Safari keeps a failed import for the page's life), and `pool.ts` a part only if a shell
    holds it; a game never played says オフラインです (`chunkQueue.ts`).
  - *Tiles* (`island-tiles-v1`: OpenFreeMap, `basemap.nationalmap.gov`, `cyberjapandata.gsi.go.jp`, all CORS-open):
    stale-while-revalidate past 14 days, bounded at 60 MB (`bytesEvict`, `__tile-index`); OpenFreeMap's keyed without
    the week's build (`tileKey`). Fetched by the page (`travel/map/tiles.ts`: WebKit's worker doesn't see MapLibre's
    worker's fetches), served by `index.ts serveTile`, the saved areas first. The TileJSON (`island-map-meta-v1`): the
    copy within an hour, else the network within 2.5 s, else the copy.
  - *Saved areas* ([design](design.md#offline-maps)): `lib/offline/plan.ts` (pure) sizes an area's tiles by measured
    means per source and zoom (offline-measure.ts `--full` at the `probes` tag, never in CI; within ±20 %, plan.test);
    `lib/offline/save.ts` fetches them (OpenFreeMap 4 at a time, USGS and GSI 2 with 150 ms after each; header
    `x-island-save`) into `island-offline-<id>` with the TileJSON and a manifest. Resumable; a failed tile tried 3 more
    passes, then `done: false` (「一部のみ」). An OpenFreeMap area keeps its week's build (更新 starts it again, offered
    past 30 days). Before it starts: online, ≤ 3,000 tiles and ≤ 50 MB an area, all areas ≤ 150 MB
    (`TOTAL_CAP_BYTES`), free storage ≥ 1.2× the plan. `island.offlineAreas` mirrors the manifests, so an area Safari
    evicted shows 「消えました」; `activate` never deletes an `island-offline-*` cache (`isSavedArea`).
  - *Storage kept:* the installed app asks `navigator.storage.persist()` once, after its first sync that worked
    (`sync/persist.ts`), and logs `storage.persist`.
- **Runtime:** fonts and art cache-first on first use. Audio (`island-audio-v1`) cache-first, never revalidated (each
  URL carries its hash, `lib/sound/manifest.ts`; `/audio/*` immutable, `scripts/headers.ts`), an LRU per class (3 music
  files, K.K.'s 2, 8 of the rest). The food data (`/food/*.json`, `island-food-v1`) cache-first by `?v=`; `index.json`
  from the network within 2.5 s, else the cached copy, a newer one replacing it only once every file it names is
  cached. ごはん's pictures (`/food-img/`, `island-food-img-v1`, [food-data.md](food-data.md#pictures)): the sheets
  cache-first, `index.json` network first, a new index dropping the sheets it no longer names; past 40 MB the least
recently used sheets go (`foodImgEvict`, `__food-img-index`). Other GETs: this
  version's cache, the previous one, the network. The relay is cross-origin and always live.

## Tests

`relay/test/store.test.ts`, `store-route.test.ts`, `ingest-golden.test.ts` (the record on node:sqlite),
`parse.test.ts`, `restore.test.ts`, `compact.test.ts`; the app's queue (`queue-batch.test.ts`), cache, sync and store
tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and `npm run bench` for the model at year-3 volume.
