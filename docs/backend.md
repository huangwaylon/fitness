# Island Fund: backend

The record (a Durable Object's SQLite on the relay), the live room, and the client's sync. The contract (tables, row
tuples, reply shapes, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the
client. The relay imports from the app only `app/src/lib/contract/` (the record's rules `record.ts`, the room's wire
`live-protocol.ts`, the log's schema `log.ts`, the ops' shapes), and the contract reaches only itself, `types.ts` and
`random.ts` (`deps.test.ts` "the relay boundary"). Operating it: [runbook](ops/runbook.md); its log and costs:
[observability](ops/observability.md).

## Overview

The record is an append-only log with slots (a later tally of the same day replaces the earlier one, and so on): the
relay's `IslandStore` ([The record](#the-record)) is its only reader and writer. It authenticates, validates shapes,
stamps `at` and appends; there is no server-side economy and no config: the client caches the rows and derives every
number on read. User actions are `event` rows sent through a persisted queue and shown at once; health data comes from
each phone's Shortcut (`ingest`). Nothing is exported; the backups are point-in-time recovery and the dump
([runbook §6](ops/runbook.md#6-backups)).

The relay is one Worker with three SQLite-backed Durable Objects (`relay/wrangler.toml`): `ROOM` (`IslandRoom`, the
live room: [Live relay](#live-relay)), `STORE` (`IslandStore`, the record) and `LOG` (`IslandLog`, the log:
[observability](ops/observability.md)). It also serves `/stt`, ききみみ's server-side recogniser
([kikimimi-mic.md](kikimimi-mic.md)).

<a id="tabs"></a>
## Tables

The record's tables ([The record](#the-record) "Where"). `at` is the record's time, ISO 8601 UTC with milliseconds,
strictly increasing (all rows of one ingest share it). Dates are `YYYY-MM-DD` (Tokyo).

| Table | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit: `ok` / `partial` / `error`, size, warnings and the body's shape (never the body or key); 60 days |

`metrics` and `events` are synced to the client; `uploads` is read only by the `uploads` action.

## Events

Exactly the types in `EVENT_TYPES`; another type or a bad shape is refused with `bad_request`. `data` is an object,
≤ 20,000 characters as JSON (a `wnote`'s 140,000; past either `too_large`). The record checks shapes (and a spend's
item and price, `SHOP` in `contract/rules.ts`); wallet cover is a read-time rule in the model, which ignores an invalid
row. **Ops with a sender's clock** (`decor`, `board`, `food*`, `pack*`, `wtask`…: `at` in ms on the relay's clock) are
refused when more than a day past the record's (`AHEAD_MS`): a clock far ahead would stamp an op no later edit could
beat. **Latest op only:** the per-id ops below keep one row a slot (an older row deleted as the new one is appended), a
stale op or anything after a removal is acknowledged as `duplicate`, and a removal's row is kept for good so nothing
brings the item back.

| type | data | Rules |
|---|---|---|
| `spend` | `{spendId, item, bells}` | `spendId` 1–128 chars; `item` `snack` with `bells` 40, or `dinner` with `bells` 70 |
| `spend_void` | `{spendId}` | from either person; refused when it names no `spend` row; a second void of the same buy is a `duplicate`; the model takes the first after the spend |
| `harvest` | `{week}` | a week key; counts only for the harvest open at the time |
| `pref` | `{key, value, person?}` | `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (roster id), the look (`look`, `savedLooks`: [below](#the-look)), and the goals: one key per charted metric, its range, grid, direction and history in the registry (`contract/goals.ts` GOALS, `isGoalValue`). A day keeps its own: `stepsGoal` (1,000–30,000 in 500s), `moveGoal` (100–2,000), `exerciseGoal` (5–300 min in 5s), `standGoal` (10–600 min in 10s), each with an optional `day` (the phone's Tokyo day it was set on), the day it applies from when within a day of `at`'s (`contract/record.ts goalDay`; else `at`'s), so a goal set at 23:59 that arrives after midnight is that day's. The latest only (or null): `goalWeight` (20–300 kg), `goalBodyFat` (3–60 %), `goalBmi` (15–40), `goalLean` (10–150 kg), each one decimal, and the meal log's `kcalGoal` (1,000–5,000 in 50s), `proteinGoal`, `fatGoal`, `carbsGoal`, `saltGoal`, `fibreGoal`, `alcoholGoal` (g, `contract/goals.ts`). The profile (`contract/profile.ts`, [design](design.md#profile)): `sex` (`m`/`f`), `birth` (a real date from 1900-01-01 to 10 years before the record's Tokyo day), `bmiStd` (`asia`/`who`); private: a member's reach the two members only, the guest's the guest only (`rowsFor`). The island-wide `weatherMode` and `seasonLook` ([The real weather](#the-real-weather)) |
| `find` | `{kind, id}` | the island's scenery for the shared ずかん: `kind` ∈ `fish` · `bug` · `sea` · `fossil` · `shell` · `fragment` · `item` · `recipe` (`FIND_KINDS`; the last two: a balloon's present), `id` a catalog id (`[a-z][a-z0-9-]{0,47}`; the lists live in the client, so they grow without a relay deploy). Never ベル |
| `tally` | `{date, counts}` | one person's counts of one Tokyo day for the ずかん's 「×12」 and the pocket (`contract/tally.ts`): `date` a real date neither after tomorrow (the record's Tokyo date) nor more than 35 days before it (`TALLY_PAST_DAYS`: a phone offline for weeks still sends its catches, but no key can mint stock for an old day), `counts` 1–300 keys `kind:id` (a find's kind and id, or `goods:<id>`: a pick-up with no ずかん page) → whole 1–999. One row per person and day: [Tally](#tally). Never ベル |
| `tally_back` | `{date, counts}` | what one person gives back of one day's tally (`contract/tally.ts backCovered`): a claim race lost after the day's `tally` reached the record ([Shared world](#shared-world)). A tally's shape and date rules; its counts only grow (`mergeTally`), and the record keeps it only while that day's tally covers every count (else `bad_request`, `tally short`). The pocket and the ずかん's counts are the tallies less these (`model/tally.ts tallyTotals`). A catch already sold when it is given back **costs its かいがら**: the shared fold (`contract/shop.ts shopLedger`, `owedOf`) takes off what the uncovered units fetched (their sells' average), so the record's check and every phone agree; a later catch of the species covers the sale again. The wallet may read below 0 when the かいがら were spent first |
| `island` | `{date, taken, puts, shakes, watered, wishes, at?}` | one person's part of one Tokyo day's shared island ([Shared world](#shared-world), `contract/island.ts`): ids picked up, dug, pulled or opened and the critters caught as `catch:<id>` (≤ 400 together), things put down `[id, what, x, z]` (≤ 60), shakes that left something `[tree, drop, at]` (≤ 120), flowers watered (`fl:<x>:<z>`, ≤ 40), wishes by the morning they bring a fragment, where their villager stands (`[x, z]` within the plan); `date` not after tomorrow. One row per person and day; the replacing row keeps what only grows of the one it replaces (`mergeIslandDay`: each morning's wishes their max, both rows' watering, the held spot when none is sent), its `taken`, `puts` and `shakes` its own (leaving a claim out is how a phone gives back a lost race). A phone sends its row only once the record's rows were folded in from a fetch this session (`week.current`), so a row rebuilt before them can't erase claims. Never ベル |
| `decor` | `{id, at, item, x, z, f, p}` or `{id, at, rm: true}` | the island's decorations ([Decorating](design.md#decorating), `contract/decor.ts`): an item's whole state (`item` one of the ten, `x` −40…430 and `z` −30…1040, `f` the facing 0–3, `p` when first placed) or its removal. Either person, any item; at most 30 items (`decor full`). The model merges by id (`decorLayout`: a removal beats everything, else the latest `at`, then B over A). **The tent's** ([The tent](design.md#the-tent), `contract/tent.ts`) are the same ops with `sc: 't'`: `item` a piece's code (`f…`), `x`, `z` its back-left tile 0–7; the wallpaper and floor are `dtentwall` / `dtentfloor` and the room's size `dtentsize` (`item` `s4` / `s6` / `s8`, NH's main rooms; none: 8; never removed); うめ's and the guest's rooms `sc: 'u'` / `'v'`; 60 pieces a room (`tent full`). **A light's switch** `{sc, id, at, lt}` (`lt` 1/0) is a slot of its own beside its piece's (`decor\|<sc>\|<id>\|l`), kept only while the room holds the piece, never counted toward the cap, so a move and a switch made at once both stand. **The island's layout** ([island-layout.md](island-layout.md#ops-the-record-and-the-relay), `contract/layout.ts`) is `sc` `o` (an object), `c` (a terrain chunk), `r` (a reset: the record drops the ops it voids) and `h` (a home's look): the outdoors anyone's (the guest's too), a home's look and room its owner's (`scopeMayWrite`); at most 1,500 objects standing (`layout full`; removals uncounted); an object's kind `k` is any lower-case token (the kinds are the app's, `layout/catalog.ts`; a phone ignores a kind it doesn't know), so a new kind needs no relay deploy |
| `board` | `{id, at, p, t}` or `{id, at, rm: true}` | the bulletin board ([board.md](board.md), `contract/board.ts`): a note's whole text `t` (`p` when first posted; `id` `b` + 6–24 of `[0-9a-z]`) or its removal. `t` is plain text cleaned by the record as on the phone (`cleanText`: NFC, `\n` breaks, no control or bidi characters, ≤ 4 lines, ≤ 100 code points; nothing left: `bad_request`). Anyone posts (the guest too); an edit only by its author, a removal by anyone (`boardMayWrite`, else `forbidden`). Slot `board\|<id>`; at most 50 notes (a new one past them drops the oldest by `p`). No live intent (a note is past the room's 256 bytes): the record's notice brings it to every open phone (`boardFold` on the phones) |
| `food` | `{id, at, d, m, g, f}` or `{id, at, rm: true}` | the meal log (ごはん, `contract/food.ts`): an entry's whole state or its removal. `id` `f` + 6–24 of `[0-9a-z]`; `d` the Tokyo day eaten (not after tomorrow); `m` the meal `b` 朝 · `l` 昼 · `d` 夕 · `s` 間食; `g` grams 0.1–5,000; `f` the food per 100 g as logged (a snapshot: a data refresh never rewrites a meal): `{id, n, k, p, fa, c, s, fi?, al?, u?, sv?}`, `id` its catalog id (≤ 64; `custom:`, `recipe:` or `quick:` prefixed for the kinds below and a typed-in quick entry), `n` its name (`cleanLine`, ≤ 60 code points), `k` kcal 0–950, `p` `fa` `c` `s` protein, fat, carbs, salt in g (0–100 or null: unknown), `fi` `al` fibre and alcohol (kept only when known), `u` the portion label (≤ 20), `sv: true` a serving of no known weight (`k` and the nutrients one serving's, `g` a nominal 100 a serving). Anyone logs their own (the guest too); only the owner edits or removes it (`foodAccept`, else `forbidden`). Slot `food\|<id>`. A known limit: an edit made on one of the owner's phones before it fetched a later edit from another is older than the one held, so it's a `duplicate`, shown until the re-read after the ack (1.5 s). Everyone sees every meal; the phones fold by the same rules (`foodFold`, `model/food.ts`). Never ベル (`deps.test.ts`) |
| `food_repeat` | `{id, at, m, it, w, from, to?, sk?}` or `{id, at, rm: true}` | a recurring meal (いつもの): one person's meal on chosen weekdays from a day on. `id` `r` + 6–24; `it` 1–20 of `{g, f}` (as a `food` op's); `w` the weekday mask 1–127 (bit 0 Monday); `from` its first day (not after tomorrow), `to` its last (absent: open-ended), `sk` the days it skips (≤ 400); `nx` (sent only) the repeat this op's end is followed by, refused (`no such repeat`) unless held, set, of the same owner. Its days' items aren't rows: every phone reads them into each day (`model/food.ts foodDay`, ids `<repeat id>:<index>`). A change of items or weekdays is a new repeat from tomorrow plus the old one's end naming it in `nx`, so a past day never changes. Owner-only, `food`'s rules, but **a skipped day stays skipped** (`repeatAccept`: a held op's `sk` carried into the kept one, a stale op adding skips stored with them), so a day made ordinary on one phone never shows twice beside an end made on another. Fold: `foodRepeatFold` |
| `food_recipe` | `{id, at, n, sv, it}` or `{id, at, rm: true}` | a recipe (マイレシピ): `id` `c` + 6–24; `n` its name (`cleanLine`, ≤ 30); `sv` servings 1–20; `it` 1–30 ingredients `{g, f}`. Owner-only, `food`'s rules. Anyone logs anyone's: a logged recipe is an ordinary `food` entry whose `f` is the recipe per 100 g (`recipeSnap`, `u` 「1人前」 = its grams / `sv`; with an ingredient of no known weight, one serving's values with `sv: true`), so editing the recipe never changes a meal logged from it |
| `food_custom` | `{id, at, n, u, g?, k, p, fa, c, s}` or `{id, at, rm: true}` | a custom food (マイ食品), one serving: `id` `m` + 6–24; `n` (≤ 30) and `u` the serving's label (≤ 20), `cleanLine`; `g` its grams 0.1–5,000, absent when unknown; `k` kcal 0–5,000; the nutrients 0–500 g or null, `fi` `al` kept when known. With `g`, no denser than a food (`customDensityOk`). Owner-only, `food`'s rules. A logged one is a `food` entry whose `f` is `customSnap` (per 100 g, or the serving with `sv: true`); it is a recipe's ingredient like any food |
| `sell` | `{species, n, v}` | the shop ([The shop](design.md#the-shop), `contract/shop.ts`): the sender sells `n` (1–999) of one species from their pocket (`species` a tally key of the pocket's kinds, `contract/pocket.ts`; never a present's `item`/`recipe`), `v` the かいがら it fetched: at most `n` × its price (`contract/shopPrices.ts`: NH's sell price ÷ 20, at least 3; `npm run shop:prices`), kept so a later price list never rewrites a sale. **The pocket is derived**: the sender's tallies' catches less their give-backs and sells; a sell past it is refused (`pocket short`). No slot. The guest's too. Never ベル |
| `buy` | `{item, price, d}` | the shop: the sender buys a room's piece (`item` `f…`, tent/items.json) at exactly its price (NH's buy price ÷ 20) from the stock of Tokyo day `d` (the record's yesterday, today or tomorrow). Which pieces a day's stock holds hangs on the island's finds (`contract/stock.ts` stockOf), so the record checks the price and the day, not the piece's place in it (the phones offer only the stock). **かいがら are derived**: Σ sells' `v` − Σ buys' `price` (less what give-backs owe); a buy past them is refused (`wallet short`), and so is a piece already owned. No slot. The phones fold the same rows by the same rules (`shopLedger`, model/shop.ts): a kept row counts whatever the tallies read now; a queued one only when the ledger covers it |
| `listen` | `{d, g, gm?, u?, l?, tm?, lv, n, ms, p?, r}` | one ききみみ game's answers of the sender's ([kikimimi.md](kikimimi.md), `contract/listen.ts`): `d` the Tokyo day (not after tomorrow), `g` the game id (`[a-z0-9]{4,12}`), `gm` which game (`[a-z][a-z0-9]{1,7}`, absent the quiz), `u` its unit (`[a-z0-9-]{1,12}`), `l` the unit's lesson 1–5 (only with `u`), `tm` the team's first-listen rights in a co-op lesson 0–6 (only with `l`), `lv` the stage 1–8, `n` the players 1–3, `ms` its length 0–3,600,000, `p` only `1` (にがて れんしゅう), `r` 1–12 answers `[id, ok, pick, rp]` (an item id, 0/1, the choice −1…4095, replays 0–99; `[]` only for `gm` `story`); no other key. Written once at the results; a retry is a duplicate by its id. **Private** (`rowsFor`): its owner gets it whole, everyone else only `{d, g, n, ms}`, plus `{u, stamped: 1}` when it stamps its unit (`stampsUnit`, derived at each read). Folded on the phone only (kikimimi/progress.ts, srs.ts), never by the economy |
| `pack` | `{trip, id, at, kind, ord, name, cat?, note?, icon?, by?}` or `{trip, id, at, rm: true}` | a trip's packing list ([travel.md](travel.md#packing-list-relay), `contract/pack.ts`): a category (`kind: 'cat'`, `icon` ≤ 32 chars) or an item in `cat`, its whole state or its removal (which drops its ticks). `trip` `[a-z0-9-]{1,24}` (a new trip needs no deploy); `id` a seed id `[a-z][a-z0-9-]{0,31}` or one an op made, `_` + 6–24 (its creator's: `by`, else `pack owner`); `ord` \|ord\| ≤ 1e9; `name` / `note` `{ja?, en?}`, one clean line each (≤ 80 / 120). Slot `pack\|<trip>\|<id>`: the latest `at`, then G over B over A. Members change any id; the guest only its own, and a category only while every item in it is its own. 300 items standing a trip (`pack full`) |
| `pack_chk` | `{trip, id, at, v}` | one person's tick of a trip's item (`v` 1/0): slot `pack_chk\|<trip>\|<id>\|<sender>`, the latest `at`; a tick of a removed or unknown op-made item is acknowledged and dropped; ≤ 300 a trip and person |
| `pack_reset` | `{trip, at}` | one person's 「リセット」: their ticks no later than `at` read as off. Slot `pack_reset\|<trip>\|<sender>` |
| `trip_note` | `{trip, at, v}` | a trip's private values ([travel.md](travel.md#private-values): booking refs, names; the guide's `{p:key}` tokens), never in the repo: ≤ 64 keys `[A-Za-z0-9_-]{1,40}` → one clean line ≤ 500 chars. The whole note at once, by a member (or the admin's `load`). Slot `trip_note\|<trip>`, the latest `at`, then who |
| `wtask` | `{id, at, c, title, cat, due?, start?, parent?, del?, imported?}` or `{id, at, rm: true}` | the wedding board's task or subtask ([wedding.md](wedding.md#the-record-relay), `contract/wedding.ts`): its whole state or a purge. `id` `[A-Za-z0-9_-]{1,64}`; `c` its creation (ms: the order); `title` 1–500, `cat` 0–40 code points, clean lines; `due` / `start` real dates; `parent` a subtask's task, refused (`wedding parent`) unless held as a top-level task; `del` soft-deleted (ms). Slot `wtask\|<id>`, the latest `at`, then who; a purge beats everything and drops the task's tick. At most 2,000 rows (`wedding full`). `imported: true` (all four types) only on the admin's load ([wedding.md](wedding.md#migration)) |
| `wdone` | `{id, at, v, imported?}` | a wedding task's tick, shared: slot `wdone\|<id>`, the latest `at`, then who |
| `wconf` | `{k, at, v, imported?}` | one wedding setting: `p1` / `p2` (names ≤ 40), `date`, `time` (`HH:MM`), `venue` (≤ 200), `tz`, each `''` to clear, or `cats` (≤ 30 categories, 1–40 each; `[]`: the starter list). Slot `wconf\|<k>` |
| `wnote` | `{at, md, base?, imported?}` (kept with `was?`) | the wedding board's note, markdown ≤ 64,000 chars kept as sent; `base` the `at` it was edited from. Slot `wnote`. A save whose `base` isn't the held note's is kept with the replaced note beside it (`was: {at, md, who}`, the record's own), so the phones show both until a save from the new one; one losing on `at` is restamped the held `at` + 1 and kept the same way |

The wedding types are the members' only; `trip_note` too (the guest's are `forbidden`).

**Finds:** the client sends a `find` only the first time either person finds that `kind:id` (the model holds queued
events too; a race between the phones only adds a duplicate the model folds away). `findsView` (`model/finds.ts`)
keeps the first find per `kind:id` across everyone (its Tokyo date and finder); the economy never imports it.

<a id="tally"></a>**Tally:** every catch and pick-up adds one to the phone's tally of the day (`store/actions.ts`
recordFind, recordGoods), sent as the day's whole tally, held a minute (a busy minute is one request). The record keeps
one row per person and day: the new row replaces the older one, each count the larger of the two (`mergeTally`: a
day's counts only grow, so a lower one is a stale send and never takes back a catch a sale counted). The phones fold
each person's rows of a day the same way (`model/tally.ts dayTallies`). The next tally starts from the day's latest
row, so a send never lowers a count.

**Subjects and new keys:** `person` (`A`/`B`, whose goal; absent = the sender) is allowed only on the goal prefs
(`contract/api.ts` GOAL_PREF_KEYS) and the profile's (PROFILE_PREF_KEYS); either member sets either member's
(`eventSubject`). The row's `person` column is always the sender. **A new event type, pref key or field deploys the
relay first**: the record refuses what it doesn't know (`bad_request`), and an app from before it ignores such a row.
There are no health-data events: Apple Health is the source of truth ([design.md](design.md#health-data)).

### The look
Each person's avatar (`app/design/avatar/customization.md` §4, `contract/look.ts`): an NH human player assembled
from parts, or their roster villager. Two prefs, the sender's own (a `person` on them is `bad_request`), one slot each
per person, checked whole by the record (`lookPrefOk`, `savedLooksOk`):
- `look`: `{kind: 'player', look}`, `{kind: 'villager'}` or null. Null or unset is **いつもの**, the default look, which
  is code (`DEFAULT_LOOKS`: A's and B's players, `design/avatar/render/outfits/a.json`, `b.json`; the guest's its
  villager) and never stored.
- `savedLooks`: the コーデ, at most 20 of `{id, name, look}` (`id` 8 of `[a-z0-9]`, `name` 1–12 code points).
- A player `look` (v 1): `hair`, `eye`, `mouth` (part ids), `hairColor`, `eyeColor`, `skin` (`#rrggbb`), `mouthFrame`
  (0–8), `cheek`, `nose` (0–2), and `top`, `bottom`, `socks`, `shoes`, `glasses`, `ornament` (a part id or null),
  `hat` (optional); no other key. A part id is its slot's dump folder family (`PlayerHair…`, `TopsTex…`, …), ≤ 40
  letters and digits; a one-piece top has no bottom. Once the closet's part table exists (`usePartTable`), only its
  ids pass.
- **Reading** (`resolveLook`, `readSavedLooks`): part by part, so a field missing, broken or unknown (a newer app's)
  is いつもの's for that field alone; the stored row is kept as it is. All clothing is free; neither pref is private.

## API

`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `forbidden` · `bad_request` · `too_large` ·
`busy` · `unavailable`. Body cap 1,000,000 characters.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate before any check (a retry whose time rules have lapsed, a buy days on, is never refused), so retries are safe |
| `events` | `events: [{id, type, data}, …]` (≤ 50) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}]}`: each kept in order as `event` would, `at` its stored row's; one whose write throws is `{id, ok: false, error: 'unavailable'}` alone, the others go on |
| `snapshot` | `since?` (ISO: the max `at` cached); `page?` (1–10,000 rows), `after?` (the last page's `next`) | `{ok, me, now, rev, rows:{metrics, events}, next?}`: compact arrays in column order, rows with `at > since`. With `page`, at most that many rows in (at, table, seq) order and `next` (a cursor) while there are more: the pages together are the whole reply. Without `page`, every row at once (the log's `req` says `pg` 0 for such a request) |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows, newest first |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build: 'relay-2'}` |

An unreadable `since`, a `page` out of range, an `after` that isn't a cursor (or one without `page`) is
`bad_request`; an unknown action too.

## Auth and limits

- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time; a key that isn't 32–128 hex characters is refused before any comparison.
  `KEY_A` and `KEY_B` also derive the server-to-server secret that signs `/notify` and `/admin` (never `KEY_C`): a
  rotation updates the admin tools' keys file too ([runbook §3](ops/runbook.md#3-rotate-a-key)).
- **Rate limit:** 120 requests per key per minute (in the record's memory); over it, `busy`. A snapshot's later pages
  (`page` with `after`) have their own 600 a minute.

## Record state

The record keeps its clock and revision in its `meta` table: `last_at` (the next `at` is max(now, `last_at` + 1 ms))
and `rev` ([Revision](#revision)). A Durable Object runs one request at a time and each write is one SQLite
transaction, so a snapshot never sees half of one; an ack is sent only after its transaction committed.

## Revision

`rev` is the record's epoch (`e1`, `e2`, …): it changes only when the record is rebuilt (a restore: the room, told
before the restart, has the restored record start a new epoch ~5 s later; or `node scripts/record.ts rev`). A new
epoch, and a `load` that added rows, send `changed` so the open phones refetch at once. A `snapshot` whose `rev` or
`me` differs from the cache's makes the client drop the cache (never the unsent queue) and fetch everything. Locked
weeks' earnings are memoised per `rev`. Nothing edits the record by hand.

## Ingest

`relay/src/parse.ts`: newline-joined Text lists, one line per day, each optional: `dates` (Shortcuts' date text,
English or Japanese; only the day is used), `steps` (the iPhone's), `steps_watch` (the Apple Watch's),
`exercise_minutes` (→ `exercise_min`), `calories` (→ `move_kcal`), `stand_minutes` (→ `stand_min`), `weight` (kg;
0 = none), `body_fat_percentage` (→ `body_fat_pct`; 0 = none), `body_mass_index` (→ `bmi`; 0 = none),
`lean_body_mass` (→ `lean_kg`, kg; 0 = none). Other fields are ignored. A list whose length differs from `dates` is
dropped with a warning; an unreadable line, an activity value above `METRIC_BOUNDS`, a weight outside 20–300 kg or a
body value outside `BODY_BOUNDS` (body fat 2–70 %, BMI 10–60, lean 10–150 kg) is skipped (out of bounds: with a
warning). A body with none of the fields is `bad_request` (audited as `error`). **A date repeated** in `dates` (a
time-zone change) keeps one value a day and metric: an activity metric's largest, a weigh-in's last line, with a
`dates: N repeat a date` warning. A run whose write throws still leaves an `error` audit row (`not saved: <class>`,
written after the rollback) and answers `unavailable`. The Shortcut: [shortcut-health-sync.md](ops/shortcut-health-sync.md).

**Body metrics:** aligned to `dates` like `weight`, one decimal, latest wins, never earn. Body fat may come as a
fraction (`0.223`) or a percent (`22.3`, `22.3%`): a value ≤ 1 without a `%` is ×100. Lean body mass is in kg (Health's
mass unit must be kg).

**Steps:** Find Health Samples sums every source, so the iPhone's and the Watch's steps would count twice. The Shortcut
sends each device's list, filtered by Source, and a day's steps are max(`steps`, `steps_watch`) (close to Health's own
merge; a day unreadable in one list takes the other). Without `steps_watch`, `steps` is stored as sent.

**Latest wins:** Apple Health is the source of truth, so a row is appended whenever a value differs from the last row
for (person, date, metric), lower or higher; the same value is never appended twice. One exception: a `0` for a
**past** Tokyo day whose latest row is above 0 is **held, not appended** (the audit's `N past zeros held`): a run that
read nothing (Health locked, Fill Missing sending 0 for every day) would otherwise rewrite the history. Every Health
value is kept: the held one goes to `metrics_held` (person, date, metric, value; first and last seen, how many times,
`promoted`), never served to a phone, in every dump and taken back by a load; a real correction is promoted by the
admin (`record.ts held`, `promote`: [runbook §9](ops/runbook.md#9-the-record)). The model reads a day's latest row; a
locked week reads it as of its lock (Wednesday 04:00), so a later sync never moves locked earnings.

**A day without the Watch:** Fill Missing sends `0` for a day Health has no samples, so a day the Watch wasn't worn
is stored as Move 0, Exercise 0, Stand 0: real rows, kept as sent. The model reads such a day (all three 0 or absent)
as no data for those three (`model/health.ts activityOn`, [design.md](design.md#kenkou)); steps stay. An empty line
(the Shortcut's optional step 8d) writes no row, counted under `skipped`.

## Client sync

`lib/sync/` (storage, transport, pairing, queue, cache, the live socket) and `lib/store/` (the week store, actions,
`live.ts`, `view.ts`, the synced stores' base `synced.svelte.ts`, and the demo backend, loaded only with `?demo`).

### Storage keys

`sync/storage.ts` registers every key: live `island.key`, `island.me`, `island.queue`, `island.acked`, `island.sentAt`;
the demo `island-demo.*` (it can never touch a live key); per device `island.sound`, `island.locale` (the language
last shown, so an English launch loads its strings before the first paint) and `island.wx` (the last real-weather
timeline, for opening offline). If storage fails (full, private mode) the data lives in memory for the session and a
banner says so once. Pairing as a different person clears the cache, queue and acked list. `sync/transport.ts`
`post()` never throws (20 s timeout; network failure = `offline`; timeout, non-2xx or non-JSON = `unavailable`).

### Snapshot cache

`sync/cache.ts`: `{me, rows, since, rev, rowsAt, skewMs, fetchedAt}` in IndexedDB (database `island`; in memory if
unavailable): a `meta` record (all but the rows, written on every refresh) and the rows in **segments**, each table's
rows in order, 1,000 a record (`seg:<table>:<key>`, listed in the meta). A save rewrites only the segments from the
first change (on a poll, the last partly filled one). The meta and the segments it lists go in one transaction; a
listed segment missing reads as no cache (a full fetch), anything else in the store reads as no cache and the next save
clears it. A refresh posts `snapshot` with `since` and `page` (4,000 rows), fetching each page after the last one's
`next` and applying them together at the end (`fetchPages`: a page that fails leaves the cache as it was, a new epoch
between pages starts over; no cap on the pages, since every Health row is kept: only a runaway's 100,000 stop it), then
merges (`model/snapshot.ts`: deduped by natural key, ordered by `at`; an empty poll keeps the same rows object, so
nothing re-reduces; a poll whose rows only append in `at` order is folded over the last State, `model/state.ts
foldRows`, the same State a whole reduce gives), records the server clock skew and saves. Overlapping refreshes share
one request; a `fresh` caller waits for one more after any in flight. A reply that lands after pairing again is
dropped.

### Compaction

On each merge `model/compact.ts` drops the `metrics` rows of locked weeks the model can no longer read: per (person,
date, metric) the latest row at the lock and the latest overall stay; per person the newest row; weight the newest
row per day. Views are unchanged; ~90 % of rows go. The rule is the contract's (`contract/compact.ts compactKeep`,
`weekLockMs` = the model's `finalMs`, checked equal). A `tally` replaced by a later one of the same day goes too, and
so does a `food`, `food_recipe` or `food_custom` op the fold no longer reads (`model/food.ts foldedAway`); every
`food_repeat` op stays (its fold takes every op's skipped days). **The record keeps every Health row** (its own
compaction is off: [The record](#the-record) "Compaction"), so a cold fetch brings the whole history and the phone's
cache compacts it.

### Write queue

`sync/queue.ts`: events in `island.queue`, sent in order until acked. Everything that may go now goes in one `events`
request (≤ 50 events and ≤ 900,000 characters, under the record's 1,000,000 body cap; in queue order, the holds and
subjects below kept), each answered by id. A request refused whole (`too_large`, `bad_request`) is halved and sent again
at once; one event alone so refused, or too large to send at all, is set aside.

- **Day rows** (`tally`, `island`): a newer row of the same day replaces the queued ones (not in flight) in the first
  one's place: a day's tally only grows and an island day is sent whole.
- **Set aside** (`parked`): an event the record fails (`unavailable`: its write threw) 30 times (`PARK_AFTER`, ~2 h) is
  kept and shown but no longer sent, and no longer blocks the queue (later events on its subject wait with it). Logged
  `queue.poison`; a sync tap (`unpark`) tries it again. Never dropped.
- **Unsent:** online, once a write has waited 2 minutes past its hold (backed off, set aside or blocked:
  `unsentStuck`), the island's sync chip says 「おくれて いない きろく {n} · タップで おくる」 and 設定 「未送信 {n}件（最終送信
  {time}）」 (`island.sentAt`: the last ack) with 送信; a tap sends them all, the set-aside ones too. Offline, the sync
  pill counts the taps waiting to go.
- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back, `holdEvent`
  moves its time.
- **Subjects:** a later event on the same spend (its `spend_void`) never overtakes a held one.
- **Replies:** acked (`ok` or `duplicate`) → into `island.acked`, then out of the queue; acked events stay in the view
  until a snapshot holds their id (given up 5 minutes after the ack). `bad_request` / `too_large` → dropped with a
  message. `unauthorized` → pairing. Other errors keep the event and all after it, with backoff 1 s, 2 s, 4 s … ≤ 5
  min, ±20 %.
- **Retry now:** the `online` event, a sync tap, the re-read after an ack, becoming visible and the socket's welcome
  (iOS often skips `online` after a suspend) send backed-off events at once, at most once per 30 s.
- **Hidden:** on `visibilitychange` to hidden and `pagehide`, the day rows still in their hold (a tally's 60 s, an
  island day's 120 s) go at once in `keepalive` requests (≤ 63 KiB of UTF-8 each, the browser's 64 KiB less the
  envelope; an event bigger than that alone waits for the next flush, the rest go past it), so a phone locked right
  after a catch doesn't leave the partner behind. A buy's undo window keeps its time.

### Optimistic view

`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. The store recomputes on every change and
each minute (not while hidden).

**The meal log costs the island nothing.** `reduce` keeps the `food*` rows raw (`model/state.ts` RAW_EVENTS: unparsed,
one lookup a row), so a change's reduce is the same with or without them; only the food sheet parses them (memoised
per row, folded from the last fold when the rows extend it). `npm run bench` (3 people × ~10 meals a day, year 3):
poll + 1 row → view 3–4 ms with the meal log, 2–3 ms without.

<a id="live-sync"></a>
### When it syncs

On launch (after painting from the cache), when the app becomes visible (≤ every 30 s), on a sync tap, on `online`,
and while the app is on screen whenever the relay says the record changed ([Push](#push)). Each refresh flushes the
queue, then fetches. **Not when current:** on launch and on becoming visible the phone waits up to 2 s for the relay's
`welcome`, whose `rec {at, rev}` is the record's last change the room heard of; when the cache has it (same `rev`,
`at` ≤ `since`) and was fetched within 15 minutes, it only flushes the queue. **On every welcome** (each reconnect)
the phone compares its `rec` with the cache: past the cache, it fetches (once per mark, so a guest's filtered snapshot
that never reaches the mark can't fetch at each reconnect), so a change made while the socket was down is fetched at
once (`e2e/live-sync.spec.ts`). **After an ack:** the record answers each event with its stored row's `at`, and that
row goes into the cache at once (`since` unmoved); only an ack without a row (a duplicate) is followed by a `fresh`
re-read 1.5 s later.

**Two tabs:** two tabs (or a PWA and a Safari tab) of one phone share its localStorage, and the second's hello replaces
the first's socket (4002). The synced stores (`store/synced.svelte.ts`: the decorations, the rooms, the layout; a
commutative merge of every op's winning entry) merge what's in storage before they write, never writing a stale whole
map over the other tab's ops, and fold the other tab's writes as their `storage` events land.

**Conflicts:** every op merges commutatively per id (last writer wins: `at`, then who), so the phones always agree;
two edits of different things that clash are settled by one phone: a layout piece moved onto one the partner moved to
the same tile at once moves off, by the later op's phone ([island-layout.md](island-layout.md#ops-the-record-and-the-relay)
"Two edits on one tile").

<a id="the-record"></a>
## The record

- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime), in its own Durable Object, `IslandStore`
  (`idFromName('record')`, `storeObject.ts`). Tables: `metrics` (`seq`, `at`, `person`, `date`, `metric`, `value`
  REAL, `late`; unique (person, date, metric, at), index on `at`), `events` (`seq`, `id` unique, `at`, `person`,
  `type`, `data`, `slot` unique, `late`; indexes on `at` and `type`), `ids` (every event id ever accepted), `uploads`
  (the ingest audit), `meta` (`last_at`, `rev`, `schema_v`, the running ledgers below), `metrics_latest` (each
  person's day's latest value per metric, kept in the same transaction as each `metrics` row), `metrics_held` (the
  held zeros: [Ingest](#ingest) "Latest wins").
- **Schema:** `SCHEMA` (the base tables, `IF NOT EXISTS`), then `MIGRATIONS`, an ordered list run once each on the
  object's start, each step and its mark (`meta.schema_v`; the admin `counts` says it) one transaction. A new table or
  index is a new step at the end, never an edit of one that shipped; a step adding a derived table fills it.
- **The Worker's gate:** it checks the origin, method and size, and that the body carries a person's key
  (`storeRoute.ts keyGate`: a bounded scan for a top-level `"key": "<hex>"`, not a parse; a keyless body goes on only
  when ≤ 512 characters, for `health`), else `unauthorized` there, so a stranger's body never costs a Durable Object
  request; the object parses, checks the key again and answers. CORS for the allowed origins.
- **Rules** (`app/src/lib/contract/record.ts`): the shape checks (`validEventData`); `at` = max(now, last + 1 ms), one
  per ingest, one per event; an event id once, forever (`ids`: a late retry of a replaced event is still a duplicate,
  and it is acknowledged before any other check); **slots**, a later event of a slot replacing it: a tally and an
  island day per sender and day, a cosmetic pref or a latest-only goal per subject, a daily goal per subject and Tokyo
  day (`goalDay`; the goal in force on each past day stays: `dailyGoalOn`), and the per-id ops of [Events](#events)
  (`decorAccept`, `tentAccept`, `boardAccept`, `foodAccept`, …). A pref the model ignores takes no slot. A `highfive`
  event (high-fives go over the room) is acknowledged and kept nowhere.
- **The shop's check** (a `sell` or `buy`, `shopTarget`): against each person's running ledger (meta `shop|<who>`:
  their tallies' totals less the give-backs, sold and fetched per species, かいがら, owed, the pieces), kept in the same
  transaction as each tally, give-back, sell and buy (`shopNote`, by the fold's own step `contract/shop.ts shopStep`),
  never their history. Folded from the rows when absent (after a `load`); the admin's `shopcheck {fix?}` compares each
  ledger with the full fold.
- **A decor op's check** (`decorTarget`): reads only its own slots' rows (the piece's, its light switch's, the
  layout's reset) and the caps' counts (meta `decor_live`, kept by every decor op, `decorNote`; recounted after a
  reset or a load; the admin's `decorcheck {fix?}` compares). A reset drops the voided object and chunk rows by their
  slots' range and `at` (`dropVoided`).
- **Ingest:** `relay/src/parse.ts` and the audit row (`relay/src/audit.ts`); a day's latest value read from
  `metrics_latest` over the body's days, never the history. `relay/test/ingest-golden.test.ts` runs a week of both
  phones' real Shortcut body shapes (made-up values) against a recorded golden (`fixtures/ingest-golden.json`).
- **`since`:** answered from the `at` index; an empty poll reads one row. A row that arrived out of `at` order (an
  import's) is marked `late` with its arrival time, and a poll also returns late rows that arrived after `since` −
  10 s, so no phone misses one.
- **Admin:** `POST /admin`, signed like `/notify` ([Push](#push) "Auth"; the Worker refuses a missing or malformed
  signature or a time outside the 5-minute window with 401 before the object; a `restore`, `rev` or `logpurge` is
  taken once per signature, table `admin_seen`). The record tool's ops (`{op}`, [runbook §9](ops/runbook.md#9-the-record)):
  counts, bookmarks, a restore, a new epoch, a dump (paged: `limit`, `after`), the compaction, `held` / `promote`,
  `shopcheck`, `decorcheck`, the log's (`logs`, `logstats`, `logpurge`, on the log's own object), the weather, and
  `load`: rows that already have their `at`, by the same rules, idempotent; a board post's, a packing list's and the
  wedding board's rows kept unless the row their slot holds beats them, since a dump holds each slot's latest only
  (`test/restore.test.ts`).
- **Push-driven:** after a write the object tells the room (`changed`, [Push](#push); a failed call tried once more);
  the room keeps the last one (`rec {at, rev}`, in its storage) and hands it to each phone in its `welcome`.
- **Compaction** (`store.ts compact`): the record can drop the `metrics` rows of locked weeks the model no longer
  reads, by the phones' own rule (`contract/compact.ts`; events are never touched). **It is off: every Health row is
  kept.** The Worker's cron would run it at 04:15 Tokyo only with the var `COMPACT_CRON=1`, which is unset
  (`relay/test/compact.test.ts` fails while it is set anywhere), and the admin's `compact` needs `confirm:
  'delete-health-history'`. When run: a date at a time, at most 5,000 deletes a run, the dates written or locked since
  the last run; no new epoch (a phone's cache holds a superset and compacts it by the same rule).
- **Snapshot size:** a year of two phones and the guest is ~50–100k rows and ~3–6 MB of JSON in a full snapshot (every
  Shortcut run appends each changed value of its 32 days; tallies, island days, decor and layout ops, the meal log's
  ~300-byte rows), so the snapshot is paged ([API](#api)) and the phones fetch 4,000 rows a page
  ([Snapshot cache](#snapshot-cache)). `relay/test/compact.test.ts` measures a synthetic year: 49,215 rows, 5.16 MB
  cold; 13,168 rows, 2.97 MB were it compacted.
- **A restore** (`restore {bookmark}`): the object answers every `/api` request `unavailable` (retried, never
  acknowledged) from before it sets the bookmark until it restarts on it, so no write is acked and then dropped; the
  restored record starts a new epoch.
- **Backups:** point-in-time recovery (30 days, on the Free plan) and `dump` / `load`: [runbook §9](ops/runbook.md#9-the-record).

## Live relay

Presence between the phones while they have the app open (decisions: *Live relay on Cloudflare*). The room carries
intents, never data of record: the record still catches an offline phone up.

- **Where:** `relay/` (its own package, outside the app's build): a Worker (`src/index.ts`) and the Durable Object
  `IslandRoom` (`idFromName('island')`, `src/room.ts`). Production `wss://island-fund-relay.island-fund-relay.workers.dev/room`;
  a test copy, `island-fund-relay-test`, with its own secrets, for the smoke test. `GET /health` → `{ok, v, versions,
  t, wx}` (`wx`: [The real weather](#the-real-weather)); `POST /api` and `/admin` ([The record](#the-record));
  `POST /notify` ([Push](#push)); `POST /log` ([observability](ops/observability.md)); `POST /stt`.
- **Admission:** the Worker accepts `/room` upgrades only from `ALLOWED_ORIGINS` (`https://island-fund.pages.dev`) and
  `http://localhost|127.0.0.1`; everything else 403. The origin only keeps other sites out; the key is the auth.
- **Tickets** (`contract/ticket.ts`, `auth.ts admission`): a paired phone opens each socket with the subprotocols
  `island-v1` and a fresh ticket, `tk.<who>.<exp base 36>.<HMAC-SHA256 under the person's key>` (`exp` ≤ 10 minutes
  ahead of the relay's clock; the phones make it for 5, on the kept relay clock). The Worker checks it before the room:
  a bad or stale ticket is 403; a good one goes on marked with its person (`X-Island-Ticket`, set or removed only by
  the Worker), the room answers `island-v1`, its hello must be that person's (else 4001) and it is never let go to
  make room for another. A socket without a ticket is still let in (tickets are optional until required). Two
  ticketed sockets failing before they open and the phone goes without for 6 hours (`island.liveTicket`). The demo's
  test relays offer none.
- **Auth:** the first message is `hello {key, since?, build?, beat?}` (`build` the app's version, logged as `ws.hello`).
  The room compares the key in constant time with `KEY_A`/`KEY_B`/`KEY_C` and answers `welcome {me, peer, t, rec?,
  here, gone?, hb?}` (`rec`: the record's last change; `here`: everyone else here; `gone`: when each person's last
  socket closed, kept in its storage), or closes 4001. No hello within 12 s: 4003. A second socket of the same person
  replaces the first (4002, no presence flicker), so there are at most three welcomed sockets; at most 4 wait for their
  hello (a new one lets the oldest go: 4003, the log's `room.full`), so silent sockets never keep a phone out.
- **Protocol** (`app/src/lib/contract/live-protocol.ts`, imported by both sides and checked by the same parsers): JSON,
  `v: 3` (`LIVE_VS`), ≤ 256 bytes (an intent ~60–100; a `replay` ≤ 16,000). Client intents:
  - `walk {to, at?, from?, via?, s?, ms?, f?}`: where my villager is going, and with `from`, `via` (≤ 10 waypoints),
    `s` (when it set off, the relay's clock), `ms` (≤ 60 s; 0 = put there) and `f` (the facing at its end) the very
    walk ([Shared world](#shared-world) "Villagers"); integers within the plan (`WORLD_X` −230…620 × `WORLD_Z`
    −400…2500, `island/world.ts` PLAN).
  - `act {act, id?, at?, pt?}`, `catch {what, id?, at?, how?}`, `world {op, id}` (`watered`, `wished`, `woke`),
    `pick {id, what, at?}`, `put {id, what, at}`, `shake {tree, drop}`: the shared world's.
  - `decor` (a decoration, a room piece or a layout op, as the record's `decor` op: kept for the day and replayed;
    an `at` more than a day ahead refused), `drag {id, x, z, f, it?, end?}` (a tent piece under the finger: presence
    only), `tent {in, to?, from?, via?, s?, ms?, seat?, n?, lie?, sc?}` (my villager in a room, its walk or its seat;
    `sc` `u` / `v` another home, `m` the museum, `s` the shop; presence only).
  - `highfive {at}` (numbered; with the recipient away the room holds the last one per (sender, recipient) for them,
    sends it after their next welcome and lets it go at their `got {at}` or after a day; never the record:
    [decisions](decisions.md#a-high-five-goes-over-the-relay-only)).
  - `fish {ph, id?, pt?, from?, s?}` (a line's step: `cast`, `nibble`, `bite`, `reel`, `off`; presence only; the
    angler's phone sends its step again when someone comes) and `say {text, sc?}` (a phrase over my villager,
    [Villager taps](design.md#villager-taps); `cleanSay`: ≤ 20 code points; one a second a person).
  - `quiz {g, op, …}` (ききみみ クイズ) and `play {g, gm, op, …}` (ききみみ's games, its successor): presence only,
    relayed live to everyone else here, never kept, replayed, acked or written; ≤ 210 bytes sent. Their ops and fields:
    [kikimimi-engine.md](kikimimi-engine.md#the-play-wire); the phones compute the game's schedule from `go`.
  - `music {src, at, song?, ms?, pc?}` (a music stage: `isl` the island or a room's stereo `t` / `u` / `v`;
    [design](design.md#shared-music)): numbered and acked, never in the ring; the room keeps the last record per
    source (the later `at` winning, `newerMusic`, the phones' rule too), refuses a stale or finished one (`ack ok:
    false` after the kept record), and sends the live records after each welcome.
  - `saved {}` ([Push](#push)), `ping {c}` → `pong {c, t}`, `got {at}`.

  Relay-only: `changed {what, who, at, rev}`, `wx {h0, s, fx?, at, src, rev}`, `presence {who, on}`, `replay {es}`,
  `ack`, `busy`. The room drops any client-sent `who`/`t`, stamps its own (`t` strictly increasing) and relays to the
  others.
- **Numbered intents and acks:** any intent may carry `c`, the phone's sequence number (increasing through the day);
  the room answers the sender `ack {c, t, ok}` (`ok` false when the world refused it: a claim already made, a nest too
  soon, a walk numbered before the one it keeps from the same socket). A resend of a kept intent with the same `c` is
  acked again, never relayed or kept twice; so is one of its last 64 acked intents it doesn't keep (`acked`, in its
  storage). It relays before it writes the day to storage, so a kept intent reaches the partner as fast as a passing
  one; its ack goes after the write (an ack is durable).
- **Heartbeat:** `{"v":3,"kind":"hb"}` → `{"v":3,"kind":"hb","t":0}` (`HB_PING` / `HB_PONG`), answered by the runtime
  itself (`setWebSocketAutoResponse`), so it never wakes the room or bills duration; the welcome's `hb: true` says the
  room answers it. **Ghosts:** a phone whose hello says `beat: true` sends something whenever it has sent nothing for
  20 s; the room closes such a socket silent for 60 s (4003 `silent`, its person gone for the others: `sweepSilent`).
- **Versions:** a `v` the relay doesn't know closes 4004 (`protocol version N unsupported`); the client waits for a
  reload. A version bump deploys the relay first, speaking both (`LIVE_VS`), then the app; the old one goes once the
  log's `ws.hello` (`npm run logs -- report`, *Live hellos*) shows every phone on the new one.
- **Limits:** per socket a token bucket of 20, refilled 20/s; beyond it messages are dropped, and a numbered intent
  hears `busy {c, t}` (resent later). `ping`, `got` and the heartbeat never wait on the bucket.
- **Replay:** the room keeps today's shared world in its storage ([Shared world](#shared-world)); a hello with `since`
  (the last `t` the phone heard, `island.liveSince`) gets the newer changes after the welcome, all of them, mine too,
  in `replay {es}` messages of ≤ 16,000 bytes, in the room's order.
- **Cost:** the Hibernation API (`ctx.acceptWebSocket`): an idle socket keeps no object in memory
  ([budget](ops/observability.md#request-budget)).
- **Client** (`app/src/lib/sync/live.ts`, `liveRelay()`: one socket for the app): connects while the page is visible
  and online, closes on hide or offline, reconnects after a drop with backoff (1 s doubling to 15 s, ±25 %); after
  4001/4002/4004 it waits until the page is shown again.
  - **Clock:** pings at welcome and +2 s; the offset is the shortest round trip's of the last 8 (`serverNow()`),
    across sockets, kept across reloads (`island.liveOffset`, trusted 6 hours, never when the device clock went back),
    so what a phone stamps before its first welcome is on the relay's clock too. The shared world's Tokyo day is the
    island's clock's (`world.now()`), never the device's.
  - **Liveness:** a socket quiet for 20 s is probed (the heartbeat when the room answers it; a timed ping at most 5
    minutes apart for the clock), and nothing heard within 10 s gives it up (the client's own 4000) and opens a new one
    at once; `pageshow` and `focus` probe a socket that looks open. The welcome is due within 10 s (more after
    failures; else 4010), and a socket still opening 4 s after the app comes back to front is replaced.
  - **The outbox:** what the room keeps (`isStored`: the shared world's intents and walks) goes even with the partner
    away, numbered, and waits in an outbox (≤ 120, a walk replacing the walk before it; full, the oldest layout op
    goes first) until its `ack`; after a reconnect it goes again (12 at once, then one every 60 ms; another day's
    dropped). Kept in localStorage (`island.liveOutbox`, under the person key's hash), so an intent made offline
    survives the app being killed; two tabs merge the one copy. A kept intent's ack is due within 5 s: overdue, the
    socket is probed, and from a socket that answered it goes again (the wait doubling to 60 s), dropped after 4 tries
    (`ws.unacked`: a catch is still in the record's day row). `ack {ok: false}` tells `onRefused` (a race lost). A
    send the socket's buffer turns away waits on this socket and goes as it drains, in order. A layout op sent with
    someone there is numbered too (`isLayoutIntent`): acked, never kept, so a save of 40 ops past the bucket is resent.
  - `send(intent)` is a no-op returning false unless welcomed and, for what the room doesn't keep, someone is there;
    it never throws or blocks. `on()` delivers the others' intents, `onStatus()` `{connected, me, peer}`. URL:
    `LIVE_URL`, overridable by `VITE_LIVE_URL` (empty = off). `metrics()`: messages and bytes each way, resends, acks'
    round trips, what's waiting.
- **Measured** (`npm run smoke` from Tokyo, edge NRT): connect ~65 ms, ping RTT median 18–21 ms, partner one-way median
  19 ms, a kept intent one way 21–22 ms and its ack 31–33 ms (`npm run latency`).
- **Tests:** `relay/test/` (keys, origins, the bucket, the room: auth, relaying, stamping, rate limit, replay and
  ring trimming, replacement, presence, hello timeout, the socket cap, `changed`; the notify secret) with
  `cd relay && npm test` (also `.github/workflows/relay.yml`); `live-protocol.test.ts`, `live.test.ts`,
  `live-room.test.ts` (the client against the real room) and `store/push.test.ts` in the app's vitest.

## The real weather

Tokyo's sky by the hour for the island ([design](design.md#weather); decisions: *Weather from Tokyo, by the hour*).
`relay/src/weather.ts` (pure but for its fetch), `IslandRoom.weatherTick` (`relay/src/index.ts`), the phones'
`sync/wx.ts` and `island/weather.ts` `realWeatherAt`.

- **Source:** Open-Meteo's forecast, JMA's models (`/v1/forecast?models=jma_seamless`, hourly `weather_code`,
  `precipitation`, `cloud_cover`, `visibility`, `temperature_2m`; `past_hours=13`, `forecast_hours=36`), for one fixed
  point (`wrangler.toml` `WX_LAT` / `WX_LON`: central Tokyo). No key, free for non-commercial use, CC BY 4.0, credited
  in 設定. No phone calls a weather API, and nothing about us leaves the relay but that coordinate. JMA's model gives no
  snow, fog or thunder codes for Tokyo: snow comes by temperature.
- **When:** the Worker's `*/15` cron calls the room's `weatherTick`. A fetch is due 30 minutes after a good one, or
  past :45 with none since (so the next hour is locked before it begins): about 48 a day. A hello fetches too when it's
  due (the test copy has no cron). One fetch at a time, a 5 s timeout; a failure keeps the timeline it had, logs
  `wx-fail <why>` and backs off 30 min, 1 h, then 2 h.
- **The timeline** (storage `wx`): `{h0, s, fx?, hi?, at, src, rev}`: `h0` the first hour (hours since the epoch, UTC),
  `s` a letter an hour (`c` fine, `o` cloudy, `r` rain, `h` a downpour, `s` snow) for the 12 hours before now (the
  rainbow looks back) and the next 36, `fx` the foggy hours, `hi` `[tokyoDay, °C]` the day's high (しずえ's news), `at`
  the fetch time, `src` `om` or `fx` (an admin fixture), `rev` bumped when an hour a phone holds would read otherwise.
  The response is checked strictly, so bad data never replaces good.
- **The mapping** (dead bands on the hour before's sky): wet from 0.5 mm/h or a rain code, kept down to 0.2; a
  downpour from 4 mm/h, a heavy code, freezing rain or thunder, kept down to 2.5; snow by a snow code or wet at ≤ 1 °C,
  kept up to 2 °C; cloudy from 85 % cloud cover, kept down to 60 %; fog under 1 km while dry. A lone dry hour between
  wet ones is wet, and a lone hour between two alike is theirs.
- **Locks:** an hour that has begun (and the next, after a fetch past :45) keeps its sky; the sky changes at most once
  an hour, at :00, so a phone that cached it shows the same as one online.
- **To the phones:** `wx` after the welcome (while the timeline serves: fetched within 36 h and covering the hour) and
  on each `rev`; ≤ ~190 bytes, cached as `island.wx`.
- **The phones:** in ほんもの mode (`pref weatherMode`: one island-wide row, slot `pref|island|weatherMode`, the last
  anyone set) the hour's sky comes from the timeline while it serves, else from the seeded day; winter's snow, the
  event nights held fine, the seeded fog and aurora and the rainbow are the phone's rules (pure, by the date).
- **The island's look** (`pref seasonLook`, 設定 → 季節): `{event, season, weather, tod}` (each a lowercase id or null)
  or `null` (自動), one island-wide row (slot `pref|island|seasonLook`); the record checks the names and that each value
  is `[a-z0-9-]{1,24}` or null; a phone reads the values it knows.
- **Ops:** `GET /health` → `wx {at, src, age (min), hours (ahead), fails}`; the signed `/admin` op `wx`:
  `{refresh: true}` fetches now, `{s, fx?}` puts a fixture in (the smoke test), `{}` says how it is. Weather is never
  written to the record; only the mode is.
- **Tests:** `relay/test/weather.test.ts` (recorded Open-Meteo responses against golden timelines: the dead bands,
  fog, the gap fill, the strict parse, the locks, the revisions, the backoff, with a fake fetch and a fixed clock),
  `room.test.ts`; the app's `island/realWeather.test.ts`; `e2e/realweather.spec.ts`; `npm run smoke`.

## The guest

A third person, a visitor rather than a member ([design](design.md#the-guest); decisions: *A guest, not a third
member*): one key, `KEY_C` (unset = no guest), who `G`. On the island the guest is a member's equal: the layout and
the decorations, its island day, the flowers, the stars and visitors, the weather, the board, the shop, its own home,
ききみみ. The economy (ベル, ごほうび, the harvest), the members' goals, their real-world records (a trip's notes, the
wedding board), the Health ingest, the trees, きろく, けんこう and ふたりでぜんぶ stay A + B; the からだ figures never reach
the guest.

- **What it sees** (`contract/guest.ts guestRows` via `rowsFor`, on every snapshot of the guest's key): the members'
  activity (`steps`, `exercise_min`, `move_kcal`, `stand_min`), every event but the からだ goals (the registry's `body`
  group) and a member's profile; its own `listen` rows whole and the members' as summaries. Never a からだ row
  (`weight`, `body_fat_pct`, `bmi`, `lean_kg`). A member's snapshot never carries the guest's profile.
- **What it writes** (`guestMayWrite`): everything on the island a member writes, by the same rules (`find`, `tally`,
  `tally_back`, `island`, any `decor` op but another's home, `board`, `sell`, `buy`, `pack` on its own ids, its own
  `pack_chk` / `pack_reset`, its own meals, repeats, recipes and custom foods, `listen`, its own cosmetic prefs, the
  meal log's goals, its profile, `weatherMode`, `seasonLook`). Not the economy (`spend`, `spend_void`, `harvest`), a
  member's or an activity / からだ goal, a `trip_note`, the wedding board, `ingest` or `uploads`: `forbidden` (the queue
  drops it). Its rows are the record's like anyone's (`person = G`; the tent's merge order A < B < G).
- **The room:** the guest sends anything a member does; a scoped `decor` op of another's home is refused for anyone
  (`scopeMaySend`). Presence is per person; `peer` stays the partner for a member and either member for the guest. A
  high-five names whom it is for (`to`).
- **Push:** its own `changed` notices reach every phone; of the members' it hears an event's, an ingest's only when it
  brought activity rows (`notify(n, guest)`), and a new epoch's. Its welcome's `rec` is the last change it heard of
  (the room's `rec-g`).
- **The phones:** a member's always draws the guest's villager, as a third actor (`ui-state/cast.ts`: `mine`,
  `partner`, `third`; on the guest's phone `third` is B), asleep where its last walk left it while it isn't online
  ([Shared world](#shared-world) "Sleep"); the guest's phone guards what it sends by the same
  rules (`week.send` by `guestMayWrite`), so nothing it may not do is queued or shown.
- **Tests:** `relay/test/guest.test.ts` (no からだ row or goal in any snapshot or delta; the island's writes taken, the
  economy's refused; the dump has `G`'s rows; the room's three villagers), `contract/guest.test.ts`,
  `model/guest.test.ts`, `e2e/guest.spec.ts`, `e2e/island-edit.spec.ts`; `npm run smoke` with `KEY_C`.

## Ambient life

What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug
coming by) is decided per 10-second slot of the Tokyo day from the date, the slot and the shared world, so every phone
shows the same island without a message (decisions: *Ambient life from the clock*). `app/src/lib/components/island/ambient.ts`
(pure, `ambient.test.ts`); idle life and the critters play it.

- **Clock:** `slotAt(ms, offset)` → `{date, slot, into, hour, month}`, 8,640 slots a day. `ms` is the island's clock
  (`clock.ts now()`, so a `?date=` preview moves the slots); `offset` the relay's clock minus the device's
  (`ambientClock.ts relayOffset`, 0 before any welcome). A slot is played `DECIDE_MS` (500 ms) after it starts, by
  when an intent sent before the start has reached the partner.
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")`, kinds `villager`, `visitor`,
  `host`, `critter:<channel>`; species from the existing pickers (`pickFish`, `pickFresh`, `pickDive`, `pickBug`) by
  the sky at the slot's start (`weather.ts yieldSkyAt`), not each phone's live sky. Engine-proof: integer world points,
  squared distances, plain string order.
- **Villagers** (`villagerBeats(world, date, slot)`): each person's villager (`at`, `home`, `free`, `lastIntent`), the
  points of interest (`wander.ts pois`), the phase and both day scores. One beat a slot: an idle move from `IDLE_POOL`,
  an outing of 1–3 stops within 600u (30 % of slots, one villager out at a time; `avatar.ts outing`), a chat or a
  dance for two free villagers (dancing only with both scores ≥ 70; a pair's other an awake one). A sleeping villager
  is never free: in none. A villager whose person has the island open makes small moves but no outings, and is left
  alone 12 slots after its person's last walk (`held`); one woken by a tap (not online) may go on an outing.
  The guest's villager joins while it's awake: a third each, no outing of its own, no tree shaking.
- **Visitor:** `Visitor.svelte beat(r)` runs `visitorLife.ts pickAct`, `pickEmote` and `strollSpots` on the slot's
  `visitor` PRNG; a phone whose visitor is speaking skips it.
- **Critters** (`spawnsIn(date, slot, coasts)`, `crittersAt`): per channel (the sea off the front beach, `sea`, a
  shadow; its bubbles a channel of their own, `bubbles`, odds `BUBBLE_ODDS`; the rest of the coast a channel per
  stretch, `sea1`…, their count the layout's, `island/coast.ts coasts()`; each fresh water a channel of its own; the
  bugs two, `bug` and `bug2`, two roaming at once, the second's spot off the first's, `bugRivals`) a slot brings one
  with odds 0.9 when the last one's stay is over, staying 4–5 slots (bubbles 3, a bug 2), the stays chained per
  10-minute block, so a phone opening mid-stay finds the ones still there. Where each is comes from its seed
  (`critterPath.ts`: its swim patch or the bug's spot and its itinerary, `legAt`), never from a camera. Its id is
  `<kind>:<slot>` (`fresh:<water>:<slot>`, `fish:c<k>:<slot>`, the second bug's `bug:l2:<slot>`).
- **Agreement and its limits:** the same inputs give the same slot (tested with shuffled inputs and skewed clocks).
  The phones differ only where their inputs do: a clock offset off by more than the margin, a walk sent within ~20 ms
  of a boundary, a local skip (a sheet, a reaction playing), and the camera. What a person does by hand (a cast's bite
  plan, a dive's chase, a balloon, a shooting star) plays on their phone; its outcome is shared.

## Shared world

Every phone shows the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*).
What comes by itself is a function of the date, the slot and world coordinates ([Ambient life](#ambient-life)); what a
person does is a small intent over the relay, kept by the room for the day, folded by every phone into the same day.

- **The day** (`sync/world-day.ts`, pure, `world-day.test.ts`): a `WorldDay` folded from the day's intents in the
  relay's order: claims (`catch:<id>`, `pick:<id>`: who got it, what, how, where), puts, the shakes in order, watered
  cells, wishes, each person's last walk. First wins, and the relay's order makes it so: a partner's claim of something
  I claimed too means the relay heard theirs first (it drops a later claim), so theirs replaces mine.
- **A race lost:** what my claim put in my pocket comes out again (`world.lost` → `store/actions.ts lostRace`), with
  a line 「〇〇が さきに とったよ」. A catch still in the held or queued tally is sent again one less; one whose tally
  already went is given back by a `tally_back` of its day ([Events](#events)). The claims counted today are kept
  (`island.counted`), so a race lost after a reload or a kill still gives the catch back. **A refused claim** (the
  room's `ack {ok: false}`) is a race lost the same way. A claim in the day is gone on every phone, mine too
  (`lying`, `takenIds`), and can't be made twice.
- **The store** (`store/world.svelte.ts`, `world`): today's day on this phone, kept in localStorage (`island.world`;
  the demo's per tab) so a reload needs only what's new; `share(intent)` folds my change (refused when someone already
  has it), keeps it and sends it to the relay at once (never behind the record's hold); `on(fn)` the others', `live`
  when it happened in the last 12 s (the island plays it), else it only changes the island. Written once per burst.
- **The room** (`relay/src/room.ts`): keeps today's world (Tokyo's day on the relay clock; a new day starts empty but
  for each person's last walk, so a villager stays where it was left): the last 400 changes (past that, the oldest
  that claims nothing and isn't a walk goes, then the oldest claim) and each person's last `walk`, in one storage
  value (`ring`). The day's claims and each tree's last nest are kept apart (`day`, `DayIndex`), so neither a trimmed
  ring nor a hibernation lets a claim be made twice. It refuses a claim it already holds today and a second nest from a
  tree within the hour (`NEST_GAP_MS`). A page's first hello asks from Tokyo midnight (or the kept `since`).
- **The demo** (`sync/live-local.ts`): the demo's players are tabs of one browser (`?demo`, `?demo&as=B`, `as=G`); a
  BroadcastChannel carries the intents and the sending tab plays the room's rules on a log in localStorage
  (`island-demo.relay`), so the e2e's two-player tests run without a network.
- **The record's day row** (`island` event, `store/actions.ts sendIslandDay`): my part of the day (`rowOf`), sent
  whole when it grows, held 2 minutes, only once this session's fetch has folded the record's rows in (and then at once
  if it holds what the record's copy lacks: a change made before them, the app closed since; the relay's midnight
  folds the same rows again for its new day, never the phone's own clock's; a refused shake's row waits as any). The model keeps
  each person's latest (`state.islandDays`); the store folds in today's (what the relay didn't bring: both apps closed,
  an outage), yesterday's watering (today's hybrids grow from everyone's) and the wishes for the mornings to come
  (`applyRow`). A shake carries `at`, the shaker's own time, its identity on every phone.
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each person's phone
  moves their own villager. Every walk and put of mine goes as the very walk: `walk {to, from, via, s, ms, f}`, `s` on
  the relay's clock. The partner's phone plays it from the same start: late, it starts where the walk is by now
  (`along`); a gap ≤ 160u is walked off within the walk's own time, a bigger one glides (≤ 1.5 s); never a jump while
  the island is in view. While the partner has the island open, their villager is the relay's to move here; a walk
  under way is said again every 5 s while someone is here. A phone gone leaves its villager where its last walk ended
  on every phone, across days ([decisions](decisions.md#a-villager-stays-where-it-was-left)); back, it says where it stands once its welcome is in.
- **Sleep** ([design](design.md#sleep)): a villager sleeps while its person is offline: not in the welcome's or a
  `presence`'s `here`, its `gone` (the room's clock) over 45 s ago (`ui-state/presence.ts`; the status kept while this
  phone's socket is down). A wake here is `act {act: wake, id: <whose>, at}`, kept in the day: every phone, one opening
  within it too, wakes the same villager till `at` + 60 s (`playWake`). Gulliver woken is `world {op: woke, id:
  gulliver}`, kept in the day.
- **What's shared:** the critters (each where its seed puts it; its catch or escape by its id, `catch {what, id, at,
  how}`: `rod`, `net`, `dive`, `dig`, `flee`, claimed at the tap; my cast as an `act`, its line the `fish` steps); a
  bug out of a bush, from under the rock or off a villager as a `put` (`bug:<id>:<bush|rock|flea>`); where each
  villager stands; the partner's tap ring; every tree's shakes and what they left (`br:<tree>:<k>`, `co:<tree>:0|1`,
  a dangling bug `dg:…`, the nest's wasps `ws:…`); the day's things on the ground (shells, fragments, the bottle, dig
  spots, mushrooms, weeds, fallen goal fruit `fr:<person>:<fruit>`: `pick {id, what, at}`); a balloon's present; watered
  flowers; wishes; a bush shaken and the rock struck (`act` with `pt`).
- **The decorations** (`store/decor.svelte.ts` on the `Synced` base, [Decorating](design.md#decorating)): kept for
  good. Each change is one `decor` op, sent to the relay at once (kept in the day's ring, replayed) and to the record's
  queue; the store merges whatever arrives by id (`contract/decor.ts`) and keeps the map in localStorage
  (`island.decor`). My op's `at` is the relay's clock and always after the op it replaces.
- **Still each phone's own:** the camera, a balloon's flight, shooting stars' timing, the visitor's lines, a cast's
  bite plan, a dive's chase, a tarantula rearing, a startup beat, sounds: what one person does or watches by hand;
  their outcomes are shared.
- **Checked** (`e2e/sync-harness.spec.ts`): two players run a scripted session (tap-walks, a pick-up, a catch, a
  present, watering, a shake, a wish, decorations placed, moved and put away, both grabbing one thing at once), then
  both phones (and a third opening later) must have the same canonical day (`world-day.ts canonical`, `hash`), the same
  decorations and each villager at the same point. On the demo's tabs in CI; against the test relay with `RELAY_E2E=1
  … --workers=1` (tap → the partner's villager sets off median 34–40 ms). `world-day.test.ts` runs a 40-change session
  with conflicts, a dropped socket and a late join on the real `RoomCore`.

## Push

While the app is on screen, a change to the record reaches the other phones in well under a second (decisions: *Push
through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches up a phone that missed it.

- **Record → room:** after a write that added `metrics` or `events` rows (never a duplicate, a refusal or a read), the
  record calls the room (an RPC between the objects, after its commit) with `{what: 'ingest'|'event', who, at, rev}`.
  `POST /notify` (signed, below) takes the same notice from a server (`npm run smoke` uses it).
- **Auth:** the notify secret is HMAC-SHA256(key `"<KEY_A>:<KEY_B>"` trimmed and lower-cased,
  `island-relay-notify/1`), derived by both servers from the keys they hold; a phone holds only its own key, so it
  can't sign. Rotating a key rotates it ([runbook §3](ops/runbook.md#3-rotate-a-key)). The same secret signs `/admin`.
  Each POST carries `X-Island-Time` (ms) and `X-Island-Sig` = HMAC-SHA256(secret, `"<time>.<body>"`), hex; the relay
  refuses a signature more than 5 minutes off (401), a body over 256 bytes (413) or a bad notice (400), and answers 204
  with `X-Island-Heard: <sockets>` (`relay/src/notify.ts`).
- **Relay → phones:** the room sends `changed {what, who, at, rev, t}` to every authenticated socket, the writer's
  too (a Shortcut upload reaches its own phone), the guest's only of what it may see. Only the last mark is kept (the
  welcomes' `rec`).
- **The nudge:** after the queue gets an ack, the phone sends `saved {}` over its socket; the room relays it like any
  intent. It stops once a `changed` has reached the phone this session.
- **Client** (`store/live.ts`, the one socket): `onChange` → one `refresh({fresh: true})` 300 ms later (changes arriving
  together make one), skipped when the cache already has it and for my own `event` (its row came back in the ack). The
  CSP's `connect-src` allows the relay's `wss://` origin.
- **Measured** (Tokyo, test relay): notify POST → `changed` on both phones median 53–70 ms.

## Notifications

None ([decisions](decisions.md#no-notifications); `e2e/no-notify.spec.ts`: nothing asks, subscribes or calls `/push`).

## Service worker

`app/src/service-worker/` (pure rules in `caches.ts`).

- **Registration:** by the app, not Kit (`kit.serviceWorker.register = false`; `lib/ui-state/swLate.ts`): once the 3D
  island has its models in (Island3D's `loaded()`) or can't draw; off the island 2 s after the window's load; on the
  island 30 s after the start at the latest, so a first visit's precache never competes with three.js and the models.
- **Install:** precaches the built JS/CSS and static files except the rarer font slices, audio, the art manifest, the
  app icons, villager art beyond the two defaults, the critters', finds' and presents' art (all cached on first use),
  the guides' photos, MapLibre and ききみみ's parts (Offline, below). The hashed chunks (an older shell's copy where it
  has one, else fetched) are all or nothing (`addAll`). The static files by content hash (`caches.ts installStatics`;
  the worker's manifest carries each file's, `vite.config.ts swPrecacheOnly`): one an older shell holds at the same
  hash is copied, the rest fetched with `cache: 'no-cache'`, each on its own (one that fails doesn't fail the install).
  The worker's script lists only the precached paths (`swPrecacheOnly` filters Kit's `$app/manifest` by `caches.ts
  precachable` at build time). `npm run sw:measure -- <buildA> <buildB>` measures an install after a deploy.
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it) and the runtime caches; deletes the rest.
- **Navigations:** stale-while-revalidate: this version's cached shell at once (installed with its chunks, so the HTML
  always matches them; `caches.ts isShellOf`). The revalidation is the worker's: the browser checks for a new worker on
  each navigation, and every deploy changes it. No shell of this version yet: network first, an older version's shell
  offline or after 3 s.
- **Updates:** Kit's `_app/version.json` check (on focus and on coming back to the front) sets `updated`; the layout
  then waits for the new build's worker (`ui-state/reload.ts newWorker`: the new worker installs, skips waiting and
  claims the page) and reloads once nothing is open, so the reload gets the new build's shell. Never on a timer. An
  install that fails or an update not fetched reloads nothing; the next resume asks again. `e2e/sw-update.spec.ts`
  (`scripts/serve-build.ts /__e2e/deploy` stands in for a deploy).
- **Notifications:** none (no `push` or `notificationclick` handler).
- **Room cache** (`island-room-v1`: the rooms' and the 3D island's models, the players' parts, the villagers' models;
  cache-first on first use, outliving builds): bounded (`caches.ts roomEvict`, its index `__room-index` in the cache
  itself). A file's older versions (the same path under another `?v=`) go at once; then, while the rest is over 40 MB,
  the least recently used, never one used within 3 days. The players' packs (`/room/player/<home>.<hash>.pak`) are kept
  here too: the everyday pack whole, a part's slice (`?s=`) as below, each slice a file of its own.
- **Listen cache** (`island-listen-v1`: ききみみ's audio packs, `/audio/listen/<pack>.<hash>.pak`,
  [kikimimi.md](kikimimi.md) "Audio"): cache first, never revalidated, outliving builds; `listenEvict`: a pack's older
  version once unused for 10 minutes, then the least recently used past 30 MB, never a pack used in the last 10 minutes.
  A clip's slice (`?s=<from>-<to>`, asked as a Range) is kept under its URL as a 200 of its bytes (cut from the whole pack
  when that's cached; Pages answers a Range with the whole pack, which is then kept too); any other Range request passes
  through.
- **STT cache** (`island-stt-v1`: ききみみ's recogniser, [kikimimi-mic.md "Hosting and the service worker"](kikimimi-mic.md#hosting-and-the-service-worker)): the whisper model and
  its ONNX runtime under `/stt/` (~70 MB) and its worker (`vite.config.ts stt-names`). Never precached: the page fills
  it after the mic opt-in (`lib/mic/models.ts ensureStt`); the worker serves `/stt/` from it and never stores.
- **Offline:** what a phone has shown once reads offline; nothing is prefetched unasked.
  - *Precached* (`scripts/load-budget.ts` ≤ 3 MB): the Zen Maru Gothic slices holding ~99 % of the app's characters
    and Fredoka's Latin (`caches.ts PRECACHED_FONT_SLICES`; the rest on first use, `island-fonts-v1`), each trip's
    cover and the trail tracks.
  - *Photos* (`island-photos-v1`: the rest of `travel/` and `hiking/`, the heroes too, and the wedding's banner): kept on first view, stale-while-revalidate
    once a day old (`caches.ts swrFetch`, `x-island-stored`), bounded at 20 MB. A photo that can't load is the paper
    placeholder (`ui/photoFallback.ts`).
  - *MapLibre* (its chunk, worker, CSS and engines): into this version's shell the first time a map draws; each
    install carries it on from an older shell (`caches.ts carried`). Offline the maps import it only if a shell holds
    it (`travel/map/cached.ts`: Safari keeps a failed import for the page's life).
  - *ききみみ's parts* (`levels/parts/<part>.json`'s chunks, `kiki-<part>.<hash>.js`, `vite.config.ts kiki-part-names`):
    out of the precache (a game's text is no use offline without its audio); into the shell the first time a game
    loads one, carried on by each install (`caches.ts carryPlan`). Offline, `pool.ts` imports only a part a shell
    holds; a game never played says オフラインです (`chunkQueue.ts`).
  - *Tiles* (`island-tiles-v1`: OpenFreeMap, `basemap.nationalmap.gov`, `cyberjapandata.gsi.go.jp`, all CORS-open so
    no opaque answer is kept): stale-while-revalidate past 14 days, bounded at 60 MB (`bytesEvict`, `__tile-index`).
    OpenFreeMap's keyed without the week's build (`tileKey`). Fetched by the page, not MapLibre's worker
    (`travel/map/tiles.ts`: WebKit's service worker doesn't see that worker's fetches); one function serves a tile
    (`index.ts serveTile`), the saved areas first. The TileJSON (`island-map-meta-v1`): the copy within an hour, else
    the network within 2.5 s, else the copy.
  - *Saved areas*: 「オフライン用に保存」 on a trip's or a trail's map ([design](design.md#offline-maps)).
    `lib/offline/plan.ts` (pure) sizes the tiles by measured means per source and zoom times the area's density
    (`npm run offline:measure -- --full`, never in CI; within ±20 %, plan.test). `lib/offline/save.ts` fetches them
    (OpenFreeMap 4 at a time, USGS and GSI 2 with 150 ms after each; header `x-island-save`, answered from the network
    and never stored among the seen tiles) into `island-offline-<id>` with the TileJSON and a manifest `{id, source,
    tileVersion, tiles, stored, empty, bytes, done, at}`. Resumable; a failed tile tried 3 more passes, then `done:
    false` (「一部のみ」). An OpenFreeMap area keeps its week's build (更新 starts it again whole, offered past 30 days).
    Before it starts: online, ≤ 3,000 tiles and ≤ 50 MB an area, all areas ≤ 150 MB (`TOTAL_CAP_BYTES`), free storage
    ≥ 1.2× the plan; the first save asks `storage.persist()`. `island.offlineAreas` mirrors the manifests, so an area
    Safari evicted shows 「消えました」. `activate` never deletes an `island-offline-*` cache (`isSavedArea`).
  - *Storage kept:* the installed app asks `navigator.storage.persist()` once, after its first sync that worked
    (`sync/persist.ts`), and logs `storage.persist`.
  - `e2e/offline.spec.ts` (Chromium, the worker on): a visit, then offline: the hero, a photo seen, a trail's track, a
    photo never seen as the placeholder; a map drawn online drawn offline with no tile asked; a saved trail; ききみみ: a
    game played online played offline, one never played says オフラインです.
- **Runtime:** fonts, villager, critter, find and present art cache-first on first use; audio (`island-audio-v1`)
  cache-first and never revalidated (every audio URL carries its content hash, `?v=`, `lib/sound/manifest.ts`;
  `/audio/*` is served immutable, `scripts/headers.ts`), an LRU per class (the 3 most recent music files, K.K.'s 2, 8
  of the rest). The food data (`/food/*.json`, `island-food-v1`) cache-first by its `?v=<index.version>`; `index.json`
  from the network within 2.5 s, else its cached copy; a newer `index.json` replaces the cached one only once every
  file it names is cached, so going offline mid-update leaves the last whole version. Other GETs: this version's cache,
  the previous one, then the network. The relay is cross-origin and always live.

## Tests

`relay/test/store.test.ts`, `store-route.test.ts`, `ingest-golden.test.ts` (the record on node:sqlite),
`parse.test.ts`, `restore.test.ts`, `compact.test.ts`; the app's queue (`queue-batch.test.ts`), cache, sync and store
tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and `npm run bench` for the model at year-3 volume.
