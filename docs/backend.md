# Island Fund: backend

The record (a Durable Object's SQLite on the relay) and the client's sync. The contract (tables, row tuples, reply
shapes, bounds) is `app/src/lib/contract/api.ts`, shared by the record (`relay/src/store.ts`) and the client. The relay
imports from the app only `app/src/lib/contract/` (the record's rules `record.ts`, the room's wire `live-protocol.ts`,
the log's schema `log.ts`, the ops' shapes), and the contract reaches only itself, `types.ts` and `random.ts`
(`deps.test.ts` "the relay boundary").

## Overview

The record is an append-only log with slots (a later tally of the same day replaces the earlier one, and so on): the
relay's `IslandStore` ([The record](#the-record)) is its only reader and writer. It authenticates, validates shapes,
stamps `at` and appends; there is no server-side economy and no config: the client caches the rows and derives every
number on read. User actions are `event` rows sent through a persisted queue and shown at once; health data comes from
each phone's Shortcut (`ingest`). Nothing is exported; the backups are point-in-time recovery and the dump ([runbook §7](ops/runbook.md#7-backups)).

## Tables

The record's tables ([The record](#the-record) "Where"). `at` is the record's time, ISO 8601
UTC with milliseconds, strictly increasing (all rows of one ingest share it). Dates are `YYYY-MM-DD` (Tokyo).

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric`, `value` | `ingest`; `metric` ∈ `steps` · `exercise_min` · `move_kcal` · `stand_min` · `weight` · `body_fat_pct` · `bmi` · `lean_kg` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON text) | `event` / `events`; `id` client-generated |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest`'s audit: `ok` / `partial` / `error`, size, warnings and the body's shape (never the body or key); 60 days (each ingest lets older rows go) |

`metrics` and `events` are synced to the client; `uploads` is read only by the `uploads` action.

## Events

Exactly the types in `EVENT_TYPES`; another type or a bad shape is refused with `bad_request`. `data` is an object,
≤ 20,000 characters as JSON (a `wnote`'s 140,000: its own cap; past either `too_large`). The server checks shapes (and a spend's item and price, `SHOP` in `contract/rules.ts`);
wallet cover is a read-time rule in the model, which ignores an invalid row.

| type | data | Rules |
|---|---|---|
| `spend` | `{spendId, item, bells}` | `spendId` 1–128 chars; `item` `snack` with `bells` 40, or `dinner` with `bells` 70 |
| `spend_void` | `{spendId}` | from either person; the script refuses one naming no `spend` row and acknowledges a second void of the same buy as `duplicate` (nothing appended); the model takes the first after the spend |
| `harvest` | `{week}` | a week key; counts only for the harvest open at the time |
| `pref` | `{key, value, person?}` | `locale` (`ja`/`en`), `villagerName` (1–20), `villager` (roster id), the look (`contract/look.ts`, [below](#the-look)): `look` and `savedLooks`, and the goals: one key per charted metric, its range, grid, direction and history in the registry (`contract/goals.ts` GOALS, `isGoalValue`; the latest ones may be null: none). A day keeps its own (no null): `stepsGoal` (1,000–30,000 in 500s), `moveGoal` (integer 100–2,000), `exerciseGoal` (min: 5–300 in 5s), `standGoal` (min: 10–600 in 10s); each may say `day` (2026-11-05: the phone's Tokyo day it was set on, a `YYYY-MM-DD`, only on these four, else `bad_request`), the day it applies from when within a day of the record's Tokyo day of its `at` (`contract/record.ts goalDay`; further off, or absent: `at`'s day), so a goal set at 23:59 that reaches the record after midnight is that day's (the app's `setGoal` sends the model's Tokyo day). The latest only (or null): `goalWeight` (20–300 kg, one decimal), `goalBodyFat` (3–60 %, one decimal), `goalBmi` (15–40, one decimal), `goalLean` (10–150 kg, one decimal), and the meal log's `kcalGoal` (kcal: 1,000–5,000 in 50s), `proteinGoal` (g: 10–400 in 5s), `fatGoal` (g: 10–300 in 5s), `carbsGoal` (g: 20–800 in 5s), `saltGoal` (g: 1–20 in 0.5s), `fibreGoal` (g: 5–60, whole), `alcoholGoal` (g: 1–100, whole). The profile (`contract/profile.ts`, [design](design.md#profile); each checked by the record when set, or null: unset): `sex` (`m`/`f`), `birth` (a real `YYYY-MM-DD` from 1900-01-01 to 10 years before the record's Tokyo day; else `bad_request`), `bmiStd` (`asia`/`who`); private: a member's reach the two members only, the guest's the guest only (`rowsFor`, [The guest](#the-guest)) |
| `find` | `{kind, id}` | the island's scenery for the shared ずかん: `kind` ∈ `fish` · `bug` · `sea` · `fossil` · `shell` · `fragment` · `item` · `recipe` (`FIND_KINDS`; the last two: what a balloon's present held), `id` a catalog id (`[a-z][a-z0-9-]{0,47}`; the lists live in the client, so they can grow without a redeploy). Never ベル |
| `tally` | `{date, counts}` | one person's counts of one Tokyo day for the ずかん's 「×12」 (`contract/tally.ts`): `date` a real date not after tomorrow (server's Tokyo date), `counts` 1–300 keys `kind:id` (a find's kind and id, or `goods:<id>`: a pick-up with no ずかん page, never a find, since 2026-11-04; an older record refuses the whole row, so the relay deploys first) → whole 1–999. One row per person and day: see **Tally** below. Never ベル |
| `tally_back` | `{date, counts}` | (2026-11-05) what one person gives back of one day's tally (`contract/tally.ts backCovered`): a claim race lost after the day's `tally` already reached the record (the partner's claim came first; a tally only grows, so the catch is taken back by a row of its own). A tally's shape and date rules; its slot the sender's day, its counts only grow (`mergeTally`, as a tally's), and the record keeps it only while that day's tally it holds covers every count (else `bad_request`, `tally short`). The pocket (the shop's check, `shopTarget`) and the ずかん's counts are the tallies' less these (`model/tally.ts tallyTotals`, a person's never below none). A catch already sold when it is given back **costs its かいがら** (2026-11-05, relay review R1: until then the pocket stood at −n and the sale's かいがら stayed spendable): the shared fold (`contract/shop.ts shopLedger`, its `back` argument; `owedOf`) takes off the かいがら the sold units the give-backs uncovered fetched (their sells' average), so the record's wallet check and every phone's wallet agree; a later catch of the species covers the sale again and the debt goes (the かいがら back, the pocket still empty: the new catch stands in for the one given back). A sale a lower tally uncovers otherwise (a stale one from before the record kept each day's largest counts) owes nothing, as before; the wallet can read below 0 when the かいがら were spent before the give-back. An app from before it ignores the row (its pocket shows the catch until it updates). The guest's too |
| `island` | `{date, taken, puts, shakes, watered, wishes, at?}` | one person's part of one Tokyo day's shared island ([Shared world](#shared-world), `contract/island.ts`): ids picked up, dug, pulled or opened, and (2026-11-05) the critters caught as their claim `catch:<id>` (≤ 400 together: a catch made offline is on the record, so the partner can't catch it again), things put down `[id, what, x, z]` (≤ 60), shakes that left something `[tree, drop, at]` (≤ 120), flowers watered (`fl:<x>:<z>`, world.ts FLOWERS, ≤ 40), wishes by the morning they bring a fragment, where their villager stands (`[x, z]` within the plan); `date` not after tomorrow. One row per person and day, replaced like a tally. Never ベル |
| `decor` | `{id, at, item, x, z, f, p}` or `{id, at, rm: true}` | the island's decorations ([Decorating](design.md#decorating), `contract/decor.ts`): an item set at a spot (placed or moved: its whole state; `item` one of the ten, `x` −40…430 and `z` −30…1040 whole units, `f` the facing 0–3, `p` when it was first placed, `at` the sender's relay clock in ms) or taken away (final). Either person, any item. The script keeps each item's **latest op only**: it deletes the item's older rows before appending (as a tally's), acknowledges an op that a row of the item beats as `duplicate` (a removal, or a later op) and refuses a new item past 30 (`bad_request`, `decor full`). The model merges them by id (`decorLayout`: a removal beats everything, else the latest `at`, then B over A). **The tent's** ([The tent](design.md#the-tent), `contract/tent.ts`) are the same ops with `sc: 't'`: `item` a piece's code (`f…`), `x` and `z` its footprint's back-left tile 0–7; the wallpaper and the floor are the ids `dtentwall` / `dtentfloor` (`w…` / `g…`, x = z = f = 0, never removed). Kept apart from the island's: their own latest op per id, their own cap of 60 pieces each (`tent full`; 40 until 2026-11-04); うめ's and the guest's homes' rooms are the same with `sc: 'u'` / `'v'`. **A light's switch alone** (2026-11-05): `{sc, id, at, lt}` (`lt` 1 on, 0 off; nothing else on it, never a surface's id): its own slot beside its piece's (`decor|<sc>|<id>|l`, latest op wins), never the piece's place; kept only while the room holds the piece (else, or beaten, `duplicate`), never counted toward the cap. The light is the switch's unless the piece's own op says `l` (an older phone's whole state) later (`tentLayout`); an app from before it ignores such a row (`tentOpOf`: an unknown key) and the live intent. **The island's layout** ([island-layout.md](island-layout.md#ops-the-record-and-the-relay), `contract/layout.ts`) is `sc` `o` (an object), `c` (a terrain chunk), `r` (a reset: the record drops the object and chunk ops it voids) and `h` (a home's look): the outdoors anyone's (the guest's too, 2026-11-06), a home's look and room its owner's (`scopeMayWrite`), at most 1,500 objects standing (`layout full`; a removed object's row stays, uncounted: until 2026-11-05 the removals counted, so ~1,450 of them made every placement full; a removal is never refused, a removed object put back counts as new); an object's kind `k` is any lower-case token (no allow-list: the kinds are the app's, `layout/catalog.ts`; a phone keeps an object of a kind it doesn't know and ignores it, never drawn, blocking or picked up), so a new kind (the gym's, 2026-11-05) needs no relay deploy |
| `board` | `{id, at, p, t}` or `{id, at, rm: true}` | the island's bulletin board ([board.md](board.md), `contract/board.ts`): a note set (posted or edited: its whole text `t`; `p` when it was first posted, `p = at` for a new one; `id` `b` + 6–24 of `[0-9a-z]`; `at` the sender's relay clock in ms) or taken down (final). `t` is plain text, sanitised by the record as on the phone (`cleanText`: NFC, line breaks made `\n`, control and bidi characters stripped, trimmed, ≤ 4 lines, ≤ 100 code points; nothing left: `bad_request`). Anyone posts (the guest too); an edit only by its author, a removal by anyone (`boardMayWrite`, 2026-11-06: the guest as a member; else `forbidden`). The record keeps each note's **latest op only** (slot `board\|<id>`), acknowledges as `duplicate` an op a held one beats, anything after a removal, and an edit or removal of a note it doesn't hold; **at most 50 notes**: a new one past them drops the oldest (by `p`), and only the newest 50 removals are kept. The phones fold the ops by the same rules (`boardFold`). No live intent of its own (a note is past the room's 256 bytes): the record's notice brings it to every open phone |
| `food` | `{id, at, d, m, g, f}` or `{id, at, rm: true}` | the meal log (ごはん, `contract/food.ts`; [decisions](decisions.md#meal-log-2026-11-03)): an entry set (logged or edited: its whole state) or removed (final). `id` `f` + 6–24 of `[0-9a-z]`; `at` the sender's relay clock in ms, at most a day past the record's (else `bad_request`: a clock far ahead would stamp an op no later edit could beat); `d` the Tokyo day it was eaten, a real date not after tomorrow (the server's Tokyo date); `m` the meal `b` 朝 · `l` 昼 · `d` 夕 · `s` 間食; `g` grams 0.1–5,000 (one decimal); `f` the food per 100 g as it was logged (a snapshot: a data refresh never rewrites a meal): `{id, n, k, p, fa, c, s, fi?, al?, u?}`, `id` its catalog id (≤ 64 chars; `custom:<id>` a custom food's, `recipe:<id>` a recipe's, `quick:<id>` a quick entry's: kcal typed in for a meal out, an `sv` snapshot of its own with no food saved), `n` its name, `k` kcal 0–950, `p` `fa` `c` `s` protein, fat, carbs and salt in g (each 0–100 or null: unknown), `fi` `al` fibre and alcohol in g (since 2026-11-05: each 0–100, kept only when known; absent or null: unknown, dropped), `u` the portion label it was picked by (≤ 20), `sv` (only `true`) a serving with no known weight (a custom food's, or a recipe of one: see `food_custom`): `k` and the nutrients are then one serving's (0–5,000 kcal, 0–500 g) and `g` is a nominal 100 per serving (shown as servings, never grams). An app from before `sv` (2026-11-04) refuses a snapshot with it, so it doesn't show such an entry until it updates; one from before `fi`/`al` (2026-11-05) likewise. The record keeps it as `foodOp` returns it: known keys only, the name and label one clean line (`cleanLine`: control and bidi characters stripped, blank runs one space, trimmed; the name ≤ 60 code points, nothing left: `bad_request`), a missing nutrient null. Anyone logs their own (the guest too: the row's sender is the owner); only the owner edits or removes it (`foodAccept`; else `forbidden`). The record keeps each entry's **latest op only** (slot `food\|<id>`, a removal's row kept so nothing brings it back), acknowledges as `duplicate` an op no later than the one held, anything after a removal, and a removal of an entry it doesn't hold. **A known two-phone limit:** an edit made on one of the owner's phones before it fetched a later edit from another (the same key paired twice, or Safari and the home-screen app) is older than the one held, so it is acknowledged as `duplicate` and dropped: the phone shows it until the re-read that follows an ack without a row (1.5 s, [Write queue](#write-queue)), then the record's (newer) state, with no message. One phone never hits it (`foodNow` stamps each op after the one it changes). Everyone sees every meal, the guest included. The phones fold the ops by the same rules (`foodFold`); a day's totals are read off the entries (`model/food.ts`). Never ベル: the economy never imports it (`deps.test.ts`) |
| `food_repeat` | `{id, at, m, it, w, from, to?, sk?}` or `{id, at, rm: true}` | a recurring meal (いつもの, `contract/food.ts`; [decisions](decisions.md#meal-log-2026-11-03)): one person's one meal on chosen weekdays from a day on, set (its whole state) or removed (final). `id` `r` + 6–24 of `[0-9a-z]`; `at` as `food`'s; `m` the meal; `it` its items, 1–20 of `{g, f}` (each as a `food` op's `g` and `f`, cleaned alike); `w` the weekday mask 1–127 (bit 0 Monday … bit 6 Sunday, of the Tokyo date); `from` its first day, a real date not after tomorrow; `to` its last (≥ `from`; absent or null: open-ended, kept absent); `sk` the days it skips (each within `from`…`to`, ≤ 400; kept sorted, once each; empty: dropped); `nx` (sent only, never kept) the repeat this op's end is followed by: the record refuses the op (`bad_request`, `no such repeat`) unless it holds that repeat, set, of the same owner. Its days' items are not rows: every phone reads them into each day it covers (`model/food.ts foodDay`: virtual entries, id `<repeat id>:<index>`). A change of its items or weekdays is a new repeat from tomorrow and then the old one's end (`to` today) naming it in `nx`, so a past day never changes and the change is both or neither (were the new one refused, its first day after the record's tomorrow, the end is too and the old one goes on); one day edited is a skip plus that day's items as `food` entries. Owner-only, the latest op per id (slot `food_repeat\|<id>`), stale and after-removal ops acknowledged as `duplicate`: exactly `food`'s rules (`foodAccept`), but **a day skipped stays skipped** (`repeatAccept`): a set op kept over a set one held is stored with the held one's `sk` too (those within its `from`…`to`; the latest 400), and a stale set op whose `sk` has days the held one lacks is not a duplicate: the held op is stored again with them added (a new row, `{ok, at}`). So two of the owner's phones, one making a day ordinary (a skip and its items as entries) while the other ends or changes the repeat, never show that day's items twice, in either arrival order. The phones fold by the same rule (`foodRepeatFold`). Everyone sees every repeat; never ベル |
| `food_recipe` | `{id, at, n, sv, it}` or `{id, at, rm: true}` | a recipe (マイレシピ, `contract/food.ts`; [decisions](decisions.md#meal-log-2026-11-03)): a dish of foods put together by one person, set (its whole state) or removed (final). `id` `c` + 6–24 of `[0-9a-z]`; `at` as `food`'s (at most a day ahead); `n` its name, one clean line like a food's (`cleanLine`, ≤ 30 code points, nothing left: `bad_request`); `sv` the servings it makes, an integer 1–20; `it` its ingredients, 1–30 of `{g, f}` (each as a `food` op's `g` and `f`, cleaned alike). Owner-only, the latest op per id (slot `food_recipe\|<id>`), stale and after-removal ops acknowledged as `duplicate`: exactly `food`'s rules (`foodAccept`). Everyone sees every recipe, the guest included, and anyone logs anyone's: a logged recipe is an ordinary `food` entry of the logger's whose `f` is the recipe per 100 g (`recipeSnap`: `id` `recipe:<recipe id>`, `n` its name, kcal and each nutrient its totals × 100 / its grams, a nutrient null only when no ingredient knows it; `u` the portion, 「1人前」 = its grams / `sv`: `recipePortion`; with an ingredient of no known weight (`f.sv`), the snapshot is one serving's values per a nominal 100 g, `sv: true`, and 1人前 = 100), a snapshot, so editing or removing the recipe never changes a meal logged from it. Never ベル |
| `food_custom` | `{id, at, n, u, g?, k, p, fa, c, s}` or `{id, at, rm: true}` | a custom food (マイ食品, `contract/food.ts`; [decisions](decisions.md#meal-log-2026-11-03)): a food not in the food data, typed in by one person as one serving, set (its whole state) or removed (final). `id` `m` + 6–24 of `[0-9a-z]`; `at` as `food`'s (at most a day ahead); `n` its name (`cleanLine`, ≤ 30 code points, nothing left: `bad_request`); `u` the serving's label (`cleanLine`, ≤ 20, e.g. 「1個」「1食」; nothing left: `bad_request`); `g` the serving's grams 0.1–5,000 (one decimal), absent when its weight is unknown; `k` kcal in one serving 0–5,000; `p` `fa` `c` `s` protein, fat, carbs and salt in one serving, g (each 0–500 or null: unknown; missing kept null); `fi` `al` fibre and alcohol likewise (since 2026-11-05; kept only when known). With `g`, a serving no denser than a food (≤ 950 kcal and ≤ 100 g of each nutrient per 100 g: `customDensityOk`; else `bad_request`). Owner-only, the latest op per id (slot `food_custom\|<id>`), stale and after-removal ops acknowledged as `duplicate`: exactly `food`'s rules (`foodAccept`). Everyone sees every custom food, the guest included, and anyone logs anyone's (a copy is a new one of the copier's): a logged one is an ordinary `food` entry of the logger's whose `f` is `customSnap` (`id` `custom:<id>`, `n` its name, its serving per 100 g, i.e. × 100 / `g`; with no `g`, the serving's own values with `sv: true` and a nominal 100 g per serving), a snapshot, so editing or removing it never changes a meal logged from it. It is a recipe's ingredient like any food (`{g, f: customSnap}`). Never ベル |
| `sell` | `{species, n, v}` | the shop ([The shop](design.md#the-shop), `contract/shop.ts`): the sender sells `n` (1–999) of one species from their pocket, `species` a tally key of the pocket's kinds (`contract/pocket.ts`: `fish`, `bug`, `sea`, `shell`, `fossil`, `fragment`, `goods`; `fish:koi`, `shell:coral`, `goods:wood`; never a present's `item`/`recipe`) with a price, `v` the かいがら it fetched: at most `n` × the species' price in `contract/shopPrices.ts` (NH's sell price ÷ 20, at least 3; `npm run shop:prices`; at most, so an app from before a price rise still sells at its own lower list), kept so a later price list never rewrites a past sale. **The pocket is derived**: the sender's tallies' catches of the species (each day's row, see **Tally**) less their sells of it; the record refuses (`bad_request`, `pocket short`) a sell past it, reading the sender's tally and shop rows in the object (`shopTarget`: ≤ 366 tally rows a year a person). No slot: every sell is a row. Each person's own, the guest's too. Never ベル: the economy never imports the shop (`deps.test.ts`) |
| `buy` | `{item, price, d}` | the shop: the sender buys a room's piece (`item` `f…`, tent/items.json) at exactly its price (`contract/shopPrices.ts`: NH's buy price ÷ 20) from the stock of Tokyo day `d`, which must be the record's yesterday, today or tomorrow (a buy queued over midnight, a clock a little ahead) and hold the piece (`stockOf`: STOCK_N pieces drawn from the price list by the date alone, and the basics). **かいがら are derived**: Σ the sender's sells' `v` − Σ their buys' `price`; a buy past them is refused (`wallet short`), and a piece they bought already (`owned`): a bought piece is theirs for good, in their もようがえ. No slot. The phones fold the same rows by the same rules (`contract/shop.ts shopLedger`, model/shop.ts): a row the record kept counts whatever the tallies read now (it was covered when kept: a stale lower tally never takes back a sale's かいがら or a bought piece; only a piece twice is ignored), and a queued one only when the ledger covers it, as the record will judge it. Never ベル |
| `listen` | `{d, g, gm?, u?, l?, tm?, lv, n, ms, p?, r}` | (2026-11-05) one ききみみ クイズ game's answers of the sender's ([kikimimi.md](kikimimi.md#progress--feedback-spec-2026-11-05), `contract/listen.ts`): `d` the Tokyo day (a real date, not after the record's tomorrow), `g` the game id (`[a-z0-9]{4,12}`), `gm` which game (2026-11-06, [kikimimi-framework.md](kikimimi-framework.md#44-the-listen-row): `[a-z][a-z0-9]{1,7}`, absent the quiz; a phone writes it from step 8c on), `u` its unit (`[a-z0-9-]{1,12}`), `l` the unit's lesson 1–5 (2026-11-06, [curriculum-units.md](curriculum-units.md) §3: 1 であい, 2 ばめん, 3 チェック, 4 おと, 5 じっせん; only with `u`), `tm` the team's first-listen rights in a co-op lesson 0–6 (the same on both phones; only with `l`), `lv` 1–8 (the stage; 5 the アナウンス pack; 1–5 till 2026-11-06, a relay deploy), `n` the players 1–3, `ms` its length 0–3,600,000, `p` only `1` (にがて れんしゅう), `r` 1–12 answers `[id, ok, pick, rp]` (an item id `[a-z0-9][a-z0-9-]{0,31}`, 0/1, the authored choice −1…4095 (−1 timed out; above 3 a later game's: a tile round's bitmask of wrong slots, a memo's per-slot result), replays 0–99; none, `[]`, only with `gm` `story`: おやすみ ものがたり's minutes, `u` its serial, 2026-11-07, a relay deploy); no other key (`bad_request`). Written once at the game's results; no slot (each game its own row, a retry a duplicate by its id). **Private** (`rowsFor`): its owner gets it whole, everyone else only `{d, g, n, ms}` (a game played, never the level or the answers: the couple summary), plus `{u, stamped: 1}` when the row stamps its unit (`stampsUnit`: `l` 3 with ≥ 5 of its answers right on the first listen, or `tm` ≥ 5; derived at each read, never stored), the guest's and the members' alike (2026-11-06: the guest gets the members' summaries, they get the guest's); the guest writes its own. Folded on the phone only (kikimimi/progress.ts, srs.ts: an answer whose item id the build doesn't know is skipped), never by the economy. An app from before it ignores the rows; a relay from before it refuses them, so the relay deploys first |
| `pack` | `{trip, id, at, kind, ord, name, cat?, note?, icon?, by?}` or `{trip, id, at, rm: true}` | (2026-11-06) a trip's packing list ([travel.md](travel.md#packing-list-relay), `contract/pack.ts`): a category (`kind: 'cat'`, `icon` ≤ 32 characters: a guide icon name or an emoji) or an item (`kind: 'item'` in `cat`, optional `note`), set (its whole state) or removed (final). `trip` `[a-z0-9-]{1,24}` (a new trip needs no deploy); `id` a seed id `[a-z][a-z0-9-]{0,31}` (nobody's) or one an op made, `_` + 6–24 of `[0-9a-z]` (its creator's: `by`, the same on every later set, else `bad_request` `pack owner`); `ord` finite, \|ord\| ≤ 1e9; `name` / `note` pairs `{ja?, en?}`, one clean line each (cleaned by the record; name ≤ 80, note ≤ 120 code points); `at` the sender's relay clock, at most a day past the record's. Slot `pack\|<trip>\|<id>`: the latest `at`, then G over B over A; a removal is final and drops the item's ticks. Members change any id; the guest only ids it made, and a category of its own only while every item in it is its own (else `forbidden`). An op on an op-made id the record doesn't hold is acknowledged and dropped unless it is the creation. 300 rows a trip: past them the oldest removal of an op-made id is dropped (never a seed id's), else `bad_request` `pack full` |
| `pack_chk` | `{trip, id, at, v}` | (2026-11-06) one person's tick of a trip's item (`v` 1 packed, 0 not): slot `pack_chk\|<trip>\|<id>\|<sender>` (each person only their own, the guest too), the latest `at`. A tick of a removed item, or of an id an op made that the record doesn't hold, is acknowledged and dropped; at most 300 a trip and person (`pack full`) |
| `pack_reset` | `{trip, at}` | (2026-11-06) one person's 「リセット」: their ticks no later than its `at` read as off (the others' stay). Slot `pack_reset\|<trip>\|<sender>`, the latest `at` |
| `trip_note` | `{trip, at, v}` | (2026-11-06) a trip's private values ([travel.md](travel.md#private-values): booking refs, names, a personal URL; the guide's `{p:key}` tokens), never in the repo: `v` at most 64 keys `[A-Za-z0-9_-]{1,40}` → one clean line ≤ 500 characters each (cleaned by the record). Written by a member (or the admin's `load`), the whole note at once; the guest's is `forbidden`. All three keys read it. Slot `trip_note\|<trip>`, the latest `at`, then who |
| `wtask` | `{id, at, c, title, cat, due?, start?, parent?, del?, imported?}` or `{id, at, rm: true}` | (2026-11-06) the wedding board's task or subtask ([wedding.md](wedding.md#the-record-relay), `contract/wedding.ts`): its whole state (set) or a purge (final). `id` `[A-Za-z0-9_-]{1,64}` (the old Sheet's UUIDs, a new one `newTaskId`); `at` the sender's relay clock in ms, at most a day past the record's; `c` its creation (ms: a checklist's order); `title` 1–500 code points, `cat` 0–40, one clean line each (cleaned by the record); `due` / `start` real `YYYY-MM-DD`s; `parent` a subtask's task (not itself, never with a date): refused (`bad_request` `wedding parent`) unless the record holds it as a top-level task or the held subtask already names it (a subtask whose parent was purged stays editable); `del` when soft-deleted (ms; a set without it restores). Slot `wtask\|<id>`; the latest `at` wins, then who; a purge beats everything and drops the task's tick; a purge of a task not held is acknowledged and dropped. At most 2,000 rows (`wedding full`). The members' (the guest's `forbidden`). `imported: true` (all four types) only on the admin's load's rows from the old Sheet ([wedding.md](wedding.md#migration)); a phone's is `bad_request` |
| `wdone` | `{id, at, v, imported?}` | (2026-11-06) a wedding task's tick, shared (`v` 1 done, 0 not): slot `wdone\|<id>`, the latest `at`, then who; a tick of a task not held or purged is acknowledged and dropped. The members' |
| `wconf` | `{k, at, v, imported?}` | (2026-11-06) one wedding setting: `k` `p1` / `p2` (the names, ≤ 40), `date` (`YYYY-MM-DD`), `time` (`HH:MM`), `venue` (≤ 200), `tz` (an IANA name's shape), each `''` to clear, or `cats` (≤ 30 distinct categories, 1–40 each; `[]`: the starter list). Texts one clean line (cleaned by the record). Slot `wconf\|<k>`, the latest `at`, then who. The members' |
| `wnote` | `{at, md, base?, imported?}` (kept with `was?`) | (2026-11-06) the wedding board's note, one markdown document ≤ 64,000 characters kept exactly as sent; `base` the `at` of the note it was edited from. Slot `wnote`, the latest `at`, then who. A save whose `base` isn't the held note's `at` (or has none over a held note) is kept with the replaced note beside it (`was: {at, md, who}`, the record's own: a phone's `was` is `bad_request`), so the phones show both until a save from the new one. One that loses on `at` to a note it wasn't edited from and differs from it is restamped the held `at` + 1 and kept the same way (one from the held note, or the same text, is acknowledged and dropped). The members' |

**Finds:** the client sends a `find` only the first time either person finds that `kind:id` (the model holds queued
events too, so a second catch before the ack sends nothing; a race between the two phones only adds a duplicate the
model folds away). The model's `findsView` (`model/finds.ts`) keeps the first find per `kind:id` across both people
(its Tokyo date and finder); the economy never imports it (`deps.test.ts`).

<a id="tally"></a>**Tally:** every catch and pick-up adds one to the phone's tally of the day (`store/actions.ts` recordFind; a good, recordGoods), sent as
the day's whole tally: held a minute (the next catches replace the held one), so a busy minute is one request. The
record keeps one row per person and day: the new row replaces the day's older one, its counts each entry's larger of
the two (`contract/tally.ts mergeTally`: a day's counts only grow, so a lower one is a stale send, a second phone's or a
queue that waited, and never takes back a catch a sale counted). A phone that cached a replaced row keeps it
harmlessly: the model folds each person's rows of a day the same way (`model/tally.ts dayTallies`) and sums days and
people into totals per entry and per person; compaction drops replaced rows from the cache. The next tally starts from the
latest row of the day (another phone's or before a reload), so a send never lowers a count. Two people × a year ≈ 730
rows of a few hundred bytes.

`person` (`A`/`B`, whose goal; absent = the sender) is allowed only on the goal prefs (`contract/api.ts` GOAL_PREF_KEYS: the registry's thirteen) and the profile's (PROFILE_PREF_KEYS: `sex`, `birth`, `bmiStd`; either member sets either member's, as the goals)
(`eventSubject`, shared by both sides). The row's `person` column is always the sender. A new pref key needs the
relay first (the record refuses a key it doesn't know: `bad_request`); an app from before it reads such a row and
ignores it (the model takes only the keys it knows), so `goalBodyFat` (2026-11-02) went relay first, then the app, and so did `food` and `kcalGoal` (2026-11-03), the nutrient goals (2026-11-04), `exerciseGoal` / `standGoal` / `goalBmi` / `goalLean` (2026-11-05), `sex` / `birth` / `bmiStd` (2026-11-05), `look` / `savedLooks` (2026-11-05), `fibreGoal` / `alcoholGoal` and the snapshots' `fi` / `al` (2026-11-05), `food_repeat` (2026-11-03), `food_recipe` (2026-11-03), `sell` / `buy` (2026-11-04) and `food_custom` (2026-11-04). There are no health-data events:
Apple Health is the source of truth ([design.md](design.md#health-data)).

### The look
Each person's avatar (`app/design/avatar/customization.md` §4, `contract/look.ts`): an NH human player assembled
from parts, or their roster villager. Two prefs, the sender's own (a `person` on them is `bad_request`; the guest's are
its own too), one slot each per person (the latest wins), sent to every phone like the other cosmetic prefs, both
checked whole by the record when set (`validEventData`: `lookPrefOk`, `savedLooksOk`; else `bad_request`):
- `look`: `{kind: 'player', look}`, `{kind: 'villager'}` (which villager: the `villager` pref) or null. Unset or null:
  **いつもの**, the default look, which is code (`DEFAULT_LOOKS`: A's and B's signed-off players, `design/avatar/render/outfits/a.json`,
  `b.json`; the guest's its villager) and never stored, so it can't be deleted or drift, and the members became their
  players with nothing written.
- `savedLooks`: the コーデ, the whole list (only its owner edits it): at most 20 of `{id, name, look}`, `id` 8 of
  `[a-z0-9]` (unique), `name` 1–12 code points, trimmed, no control characters. 20 of the longest fit the 20,000
  characters of an event's data with room to spare (`look.test.ts`).
- A player `look` (v 1): `hair`, `eye`, `mouth` (part ids), `hairColor`, `eyeColor`, `skin` (`#rrggbb`: tints),
  `mouthFrame` (0–8, its resting frame), `cheek`, `nose` (0–2), and `top`, `bottom`, `socks`, `shoes`, `glasses`,
  `ornament` (a part id or null), `hat` (optional, later); no other key. A part id is its slot's dump folder family
  (`PlayerHair…`, `PlayerEye…`, `PlayerMouth…`, `TopsTex…`, `BottomsTex…`, `SocksTex…`, `Shoes…`, `AccessoryGlass…`,
  `CapOrnament…`, `CapHat…`), letters and digits, ≤ 40 characters; a one-piece top (`TopsTexOnepiece…`) has no
  bottom. Once the closet pipeline's part table exists (`usePartTable`), only its ids pass.
- **Reading** (`resolveLook`, `readSavedLooks`): a phone reads a look part by part, so a field that's missing, broken
  or names a part it doesn't know (a newer app's) is いつもの's for that field alone, never a crash; the stored row is
  kept as it is. The model and the slot take any `{kind}`-shaped look (`lookPrefRead`); the whole check is the record's.
- No ownership: all clothing is free, so a valid look is a wearable one. Neither pref is private (presentation only).

## API

`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, body = JSON text (`text/plain` from a page: no CORS
preflight; a Shortcut's `application/json` is fine), `{key, action, ...}`. Every reply is JSON with status 200:
`{ok:true, ...}` or `{ok:false, error, detail?}`, `error` ∈ `unauthorized` · `bad_request` · `too_large` · `busy` ·
`unavailable`. Body cap 1,000,000 characters.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | the Shortcut's fields ([Ingest](#ingest)) | `{ok, metrics, skipped?, warnings?}` |
| `event` | `id, type, data` | `{ok, duplicate?}`: a repeated `id` is acked as a duplicate before any check (2026-11-08: a retry whose time rules have lapsed, a buy days on, is never refused), so retries are safe |
| `events` | `events: [{id, type, data}, …]` (≤ 50) | `{ok, results: [{id, ok, duplicate?, at?} \| {id, ok: false, error, detail?}]}`: each kept in order as `event` would, `at` its stored row's; one whose write throws is `{id, ok: false, error: 'unavailable'}` alone (nothing of it kept), the others go on and the notice tells of what committed |
| `snapshot` | `since?` (ISO: the max `at` cached); `page?` (1–10,000 rows a reply), `after?` (the last page's `next`) | `{ok, me, now, rev, rows:{metrics, events}, next?}`: compact arrays in column order, rows with `at > since`, both people. With `page` (2026-11-05), at most that many rows in (at, table, seq) order and `next` (a cursor `<at>\|m\|<seq>` or `…\|e\|…`) while there are more: the pages together are the whole reply, and a row written between two pages is in a later one. Without `page`, every row at once (as before, and kept so: an app from before paging, 5a40fa6c of 2026-11-05, never reads `next`, so a cut reply would lose rows for good; the log's `req` says `pg` 0 for such a request, so when they stop shows in `npm run logs`) |
| `uploads` | | `{ok, rows:[{at, status, bytes, notes}]}`: the caller's last 20 audit rows, newest first |
| `whoami` | | `{ok, me, build}` (pairing) |
| `health` | no `key` | `{ok, build: 'relay-2'}` |

An unreadable `since`, a `page` out of range, an `after` that isn't a cursor (or one without `page`) is `bad_request`; an unknown action too.

## Auth and limits

- **Keys:** the caller is whichever Worker secret `KEY_A` / `KEY_B` matches (or `KEY_C`, the guest's: `G`,
  [The guest](#the-guest)), in constant time; a key that isn't 32–128 hex characters is refused before any comparison.
  `KEY_A` and `KEY_B` also derive the server-to-server secret that signs `/notify` and `/admin` (never `KEY_C`): a
  rotation updates the admin tools' keys file too ([runbook §4](ops/runbook.md#4-rotate-a-key)).
- **Rate limit:** 120 requests per key per minute (in the record's memory). Over it: `busy`. A snapshot's later pages (`page` with `after`) have their own 600 a minute (2026-11-05, relay review O9: a cold fetch of a big record spent the writes' budget); a first page counts as a request.

## Record state

The record keeps its clock and revision in its `meta` table: `last_at` (the last `at`; the next is max(now,
`last_at` + 1 ms)) and `rev` ([Revision](#revision)). A Durable Object runs one request at a time and each write is
one SQLite transaction, so a snapshot never sees half of one; no lock. An ack is sent only after its transaction
committed (the output gate).

## Revision

`rev` is the record's epoch (`e1`, `e2`, …): it changes only when the record is rebuilt (a restore: the room, told
before the restart, has the restored record start a new epoch ~5 s later; or `node scripts/record.ts rev`). A new
epoch, and a `load` that added rows, send `changed` (`what: 'ingest'`) so the open phones refetch at once (the test relay, 2026-11-05: a restore to a bookmark of a second before, `e3` → `e4` by itself within ~8 s; a `rev` heard as `changed` by an open socket). A `snapshot` whose `rev` or `me` differs from the cache's makes the client drop the cache
(never the unsent queue) and fetch everything. Locked weeks' earnings are memoised per `rev`. Nothing edits the
record by hand.

## Ingest

`relay/src/parse.ts`: newline-joined Text lists, one line per day, each optional: `dates` (Shortcuts' date text, English or
Japanese; only the day is used), `steps` (the iPhone's), `steps_watch` (the Apple Watch's), `exercise_minutes` (→ `exercise_min`), `calories` (→ `move_kcal`),
`stand_minutes` (→ `stand_min`), `weight` (kg; 0 = none), `body_fat_percentage` (→ `body_fat_pct`, %; 0 = none), `body_mass_index` (→ `bmi`;
0 = none), `lean_body_mass` (→ `lean_kg`, kg; 0 = none). Other fields are ignored. A list whose length differs from
`dates` is dropped with a warning; an unreadable line, an activity value above `METRIC_BOUNDS`, a weight
outside 20–300 kg or a body value outside `BODY_BOUNDS` (body fat 2–70 %, BMI 10–60, lean 10–150 kg) is skipped (out of
bounds: with a warning). A body with none of the fields is `bad_request` (audited as `error`); a Shortcut that doesn't
send the body lists yet is ingested as before. **A date repeated** in `dates` (a time-zone change, 2026-11-08) keeps one
value a day and metric: an activity metric's largest, a weigh-in's last line, with a `dates: N repeat a date` warning
(until then the run failed whole). A run whose write throws still leaves an `error` audit row (`not saved: <class>`,
written after the rollback) and answers `unavailable`.

**Body metrics** (`body_fat_percentage`, `body_mass_index`, `lean_body_mass`): aligned to `dates` like `weight`, stored with one decimal, latest
wins, never earn. Body fat may come as Shortcuts writes Health's percentage: a fraction (`0.223`) or a percent (`22.3`,
`22.3%`); a plausible body fat is ≥ 2 %, so a value ≤ 1 (without a `%`) is a fraction and is ×100. Lean body mass is in
kg like weight (no unit conversion: Health's mass unit must be kg).

**Steps:** Shortcuts' Find Health Samples sums every source, so the iPhone's and the Watch's steps would count twice
(Health de-duplicates them; Shortcuts doesn't). The Shortcut sends each device's list, filtered by Source, and a day's
steps are max(`steps`, `steps_watch`) (Health's merge counts one device at a time, so the max is close to its total;
a day unreadable in one list takes the other). Without `steps_watch`, `steps` is stored as sent. `steps_watch` is
validated like the other lists (Text, length = `dates`, ≤ 100,000).

**Latest wins:** Apple Health is the source of truth, so a row is appended whenever a value differs from the last row
for (person, date, metric), lower or higher (weight with one decimal); the same value is never appended twice.
One exception (2026-11-05): a `0` for a **past** Tokyo day (before the record's today) whose latest row is above 0 is
**held, not appended** (counted in the audit's notes, `N past zeros held`): a run that read nothing (Health locked while the phone
is, the Shortcut's Fill Missing then sends 0 for every day) would otherwise rewrite the history. Nothing is thrown away
(the user's rule: all Health data is kept): the value goes to `metrics_held` (person, date, metric, value; first and
last seen, how many times, `promoted`), never served to a phone, in every dump (`rows.held`) and taken back by a load;
were it a real correction, the admin promotes it (`record.ts held`, `promote <person> <date> <metric> [value]`: a row of
the day like an ingest's, the day's latest from then, the held row kept with its mark; [runbook §13](ops/runbook.md#13-the-record)). Today may still go
down to 0; a past day's first 0 (a day without the Watch) and any lower value above 0 are kept as before. The
model reads a day's latest row ([design.md](design.md#health-data)); a locked week reads it as of its lock (Wednesday
04:00), so a later sync never moves locked earnings. The Shortcut posts to the record's `/api` with `"key"` and
`"action": "ingest"` (`docs/ops/shortcut-health-sync.md`).

**A day without the Watch:** the Shortcut's **Fill Missing** sends `0` for a day Health has no samples, so a day the
Watch wasn't worn is stored as Move 0, Exercise 0, Stand 0 (with the phone's steps): real rows, kept as sent. The
model reads such a day (all three 0 or absent) as no data for those three (`model/health.ts` `activityOn`, the one
reader for けんこう and the TDEE's Move; [design.md](design.md#kenkou)); steps stay. The ベル need no rule: a 0 and a missing
value earn no fruit alike. An empty line (the Shortcut's optional §2 step 8d) writes no row, counted under `skipped`.

## Client sync

`lib/sync/` (storage, transport, pairing, queue, cache) and `lib/store/` (the week store, actions, `live.ts`,
`view.ts`, and the demo backend, loaded only with `?demo`).

### Storage keys

`sync/storage.ts` registers every key: live `island.key`, `island.me`, `island.queue`, `island.acked`; the demo
`island-demo.*` (it can never touch a live key); per device `island.sound` and `island.locale` (the language last shown, so an English launch loads its strings before the first paint), and `island.wx` (the relay's last real-weather timeline, for opening offline: [The real weather](#the-real-weather)). If storage fails (full, private mode) the
data lives in memory for the session and a banner says so once. Pairing as a different person clears the cache, queue
and acked list. `sync/transport.ts` `post()` never throws (20 s timeout; network failure = `offline`; timeout,
non-2xx or non-JSON = `unavailable`).

### Snapshot cache

`sync/cache.ts`: `{me, rows, since, rev, rowsAt, skewMs, fetchedAt}` in IndexedDB (database `island`; in memory if
unavailable): a `meta` record (all but the rows, a few hundred bytes, written on every refresh) and the rows in
**segments**, each tab's rows in order, 1,000 a record (`seg:<tab>:<key>`, listed in the meta). A save keeps the
segments that still hold the same rows in the same place and writes the rest anew from the first change: on a poll
only the last, partly filled segment (≤ ~300 KB of meal log rows, usually far less), after a compaction the segments from its first dropped
row on. The meta and the segments it lists go in one transaction, so a reader sees one whole set; a listed segment
missing reads as no cache (a full fetch), segments it doesn't list (another tab's) go on the next save; anything else in the store (an older layout) reads as
no cache and the next save clears it. A refresh posts `snapshot` with `since` and `page` (4,000 rows; 2026-11-05),
fetching each page after the last one's `next` and applying them together at the end (`sync/cache.ts fetchPages`: a
page that fails leaves the cache as it was, a new epoch between two pages starts over whole, an older relay's one reply
is taken as it comes; no cap on the pages, since every metric row of Apple Health is kept: until 2026-11-05 a fetch
stopped at 200 pages, 800k rows, a new phone's first fetch failing some years on; now a `next` that came before fails
the fetch, and only a runaway's 100,000 pages stop it), then
merges (`model/snapshot.ts`: deduped by natural key, its key set kept with each row list and layered by each merge, so
a poll costs the rows it brings; ordered by `at`; an empty poll keeps the same rows object, so nothing re-reduces and
no rows are written; a poll whose rows only append, in `at` order, is folded over the last State, `model/state.ts`
foldRows, the same State a whole reduce gives: ~300k rows reduced whole ~160 ms on a Mac, folded < 1 ms), records the server clock skew and saves in order. Overlapping refreshes share one request; a `fresh` caller waits for one more after any in flight. A reply that
lands after pairing again is dropped.

### Compaction

On each merge `model/compact.ts` drops `metrics` rows of locked weeks the model can no longer read: per (person, date,
metric) it keeps the latest row at the lock and the latest overall; per person the newest row. Weight keeps the newest
row per day. Views are unchanged; ~90% of rows go. The rule is the contract's (`contract/compact.ts compactKeep`,
`weekLockMs` = the model's `finalMs`, checked equal). **The record does not compact its rows** (the user's rule,
2026-11-05: every Health row is kept): it has the same rule (`store.ts compact`, [The record](#the-record)
"Compaction"), but the cron runs it only with `COMPACT_CRON=1` (unset) and the admin's `compact` only with `confirm:
'delete-health-history'`; so a cold fetch brings the whole history and the phone's cache compacts it by the rule. A `tally` replaced by a later one of the same person and day goes
too (the record no longer has it), and so does a `food`, `food_recipe` or `food_custom` op the meal log's fold no longer reads
(`model/food.ts foldedAway`: one replaced by a later op of the same id, or refused): per id the op the record keeps,
a removal with the op it removed (alone the fold would read it as stale). ~20 % of the meal log's rows (edits) go.
Every `food_repeat` op stays: its fold (`repeatAccept`) takes every op's skipped days.

### Write queue

`sync/queue.ts`: events in `island.queue`, sent in order until acked. To the record, everything that may go now goes in
one `events` request (≤ 50 and ≤ 900,000 chars: the record's body cap is 1,000,000; in queue order, the holds and
subjects below kept), each answered by id. A request refused whole (`too_large`, `bad_request`) is halved and sent again
at once; one event alone so refused is set aside.

- **Day rows** (`tally`, `island`): a newer row of the same day replaces the queued ones (not in flight) in the first
  one's place: a day's tally only grows and an island day is sent whole, so it carries all they did.
- **Set aside** (`parked`, 2026-11-08): an event the record fails (`unavailable`: its write threw) 30 times, ~2 h, is
  kept and shown but no longer sent, and no longer blocks the queue (later events on its subject wait with it). Logged
  `queue.poison`; a sync tap (`unpark`) tries it again. Never dropped.

- **Holds:** a held event (`holdMs`, the undo window) is skipped, not waited for; `unqueue` takes it back, `holdEvent`
  moves its time.
- **Subjects:** a later event on the same spend (its `spend_void`) never overtakes a held one, so the server keeps the
  on-screen order.
- **Replies:** acked (`ok` or `duplicate`) → into `island.acked`, then out of the queue; acked events stay in the view
  until a snapshot holds their id (given up 5 minutes after the ack). `bad_request` / `too_large` → dropped with a
  message. `unauthorized` → pairing. Other errors keep the event and all after it, with backoff 1 s, 2 s, 4 s … ≤ 5
  min, ±20%.
- **Retry now:** the `online` event, a sync tap and the re-read after an ack send backed-off events at once (a
  background refresh on becoming visible keeps the backoff).

### Optimistic view

`store/view.ts composeModel`: the cached rows plus acked and queued events, each stamped just after the newest server
row on the server's clock, so read-time rules judge it as the server will. The store recomputes on every change and
each minute (not while hidden: a missed minute recomputes once on return).

**The meal log costs the island nothing.** `reduce` keeps `food`, `food_repeat`, `food_recipe` and `food_custom` rows raw (`model/state.ts`
RAW_EVENTS: unparsed, out of `ats`, one lookup a row), so a change's reduce is the same with or without them; only
the food sheet reads them (`model/food.ts`): each row parsed and validated once (memoised per row object), the
entries folded from the last fold when the rows extend it (a poll: its new rows and one merge). `npm run bench`
(3 people × ~10 meals a day, every op a polling phone gets) at year 3, Node on an M5: poll + 1 row → view 3–4 ms with
the meal log, 2–3 ms without; reduce + week view 3 ms; the sheet open first after a
cold start ~55–65 ms (every row parsed once), then ~5 ms per poll; a cache write after a poll ~0.4 ms.

### When it syncs

On launch (after painting from the cache), when the app becomes visible (≤ every 30 s), on a sync tap, on `online`,
and while the app is on screen whenever the relay says the record changed ([Push](#push)). Each refresh flushes the
queue, then fetches. **Not when current:** on launch and on becoming visible the phone waits up to 2 s for the relay's
`welcome`, whose `rec {at, rev}` is the record's last change the room heard of (kept across its restarts); when the
cache has it (same `rev`, `at` ≤ `since`) and was fetched within 15 minutes, it only flushes the queue. No welcome, no
socket or an older cache: it fetches. **On every welcome** (2026-11-05; each reconnect: back from the app switcher,
the relay restarting with 1012, a dropped network) the phone compares its `rec` with the cache at once, not only when a
refresh runs: past the cache, it fetches (gathered with a push, once per mark, so a guest's filtered snapshot that never
reaches the mark can't fetch at each reconnect), and becoming visible inside the 30 s floor fetches when the welcome
says the cache is behind; the opening's own refresh compares its first welcome itself (one fetch, not two), and a
welcome during a fetch is looked at again when it's done. A change made while the socket was down was otherwise only
fetched at the next open or sync tap (`e2e/live-sync.spec.ts` E14, E15). **After an ack:** the record answers each event with its stored row's `at`, and
that row goes into the cache at once (`since` unmoved, so the next poll still brings everything written after it); only
an ack without a row (a duplicate) is followed by a `fresh` re-read 1.5 s later.

**Two tabs** (2026-11-05): two tabs (or a PWA and a Safari tab) of one phone share its localStorage, and the
second's hello replaces the first's socket (4002), so the first hears nothing of the second. The layout and the
rooms (`store/layout.svelte.ts`, `store/tent.svelte.ts`: every op's winning entry, a commutative merge) merge what's
in storage before they write, never writing a stale whole map over the other tab's ops, and fold the other tab's
writes as their `storage` events land. The layout writes once per tick's burst (2026-11-05, round 2: it parsed, folded
and rewrote the whole copy at every change, mine too), and parses what's stored only when its text isn't this tab's
own last write.

**Conflicts:** every op merges commutatively per id (last writer wins: `at`, then who), so the phones always agree;
two edits of different things that clash are settled by one phone: a layout piece moved onto one the partner moved
to the same tile at once moves off, by the later op's phone ([island-layout.md](island-layout.md#ops-the-record-and-the-relay)
"Two edits on one tile"). A room's light switch (`store/tent.svelte.ts switchLight`) is an op of its own since 2026-11-05 (`{sc, id, at, lt}`,
[Events](#events) `decor`): it never touches the piece's place, so a move the partner made meanwhile and the switch
both stand on both phones (as the piece's whole state again it was one or the other, last writer wins per id); a move
made after it carries no `l`, the switch's op keeps the light.

<a id="the-record"></a>
## The record

- **Where:** `relay/src/store.ts` (`StoreCore`, free of the Workers runtime), in its own SQLite-backed Durable Object,
  `IslandStore` (`idFromName('record')`, `storeObject.ts`), apart from the island room. Tables: `metrics` (`seq`, `at`,
  `person`, `date`, `metric`, `value` REAL, `late`; unique (person, date, metric, at), index on `at`), `events` (`seq`,
  `id` unique, `at`, `person`, `type`, `data`, `slot` unique, `late`; indexes on `at` and `type`), `ids` (every event id
  ever accepted), `uploads` (the ingest audit), `meta` (`last_at`, `rev`, `schema_v`, …), `metrics_latest` (each
  person's day's latest value per metric: an ingest's comparison; kept in the same transaction as each `metrics` row).
- **Schema:** `SCHEMA` (the base tables, `IF NOT EXISTS`) and then `MIGRATIONS`, an ordered list run once each on the
  object's start, each step and its mark (`meta.schema_v`, the steps run; the admin `counts` says it) one transaction; a
  new table or index is a new step at the end, never an edit of one that shipped; a step that adds a derived table fills
  it from the rows there. 1: index `events (type, person)`; 2: `metrics_latest`, filled from `metrics`; 3: `metrics_held` ([Ingest](#ingest) "Latest wins").
- **API:** `POST /api` (`{key, action, ...}` as text/plain JSON; `ingest`, `event`,
  `snapshot`, `uploads`, `whoami`, keyless `health` → `{ok, build: 'relay-2'}`), every reply JSON with status 200;
  CORS for the allowed origins, none needed for a Shortcut. The Worker checks the origin, method and size, and that
  the body carries a person's key (`storeRoute.ts keyGate`: a bounded scan for a top-level `"key": "<hex>"`, not a
  parse; a body with none goes on only when it is ≤ 512 characters, keyless `health`), else `unauthorized` there, so a
  stranger's body never costs a Durable Object request; then it hands the body to the object, which parses it, checks
  the key again and answers (the Free plan gives a Worker ~10 ms of CPU per request; the object far more). Rate limit 120 per key per minute.
- **Rules** (`app/src/lib/contract/record.ts`): the shape checks (`validEventData`); `at` =
  max(now, last + 1 ms), one per ingest, one per event; an event id once, forever (`ids`: a late retry of a replaced
  event is still a duplicate); **slots**, a later event of a slot replacing it: a
  tally and an island day per sender and day, a cosmetic pref (`locale`, `villagerName`, `villager`, `look`, `savedLooks`) or a latest-only goal (the からだ and meal-log goals) per
  subject, a goal a day keeps (`stepsGoal`, `moveGoal`, `exerciseGoal`, `standGoal`) per subject and Tokyo day (`goalDay`: its `day` within a day of its `at`'s, else `at`'s; the goal in force on each past day
  stays: `dailyGoalOn`), a decoration per scope and id (by `decorAccept` / `tentAccept`), a board note, a meal entry and a repeat per id (by
  `boardAccept` / `foodAccept`). A pref the model ignores takes
  no slot. A `highfive` event (high-fives go over the room) is acknowledged and kept nowhere; an old row of one is ignored
  by the model.
- **The shop's check** (a `sell` or a `buy`, `shopTarget`): against each person's running ledger (meta `shop|<who>`:
  their tallies' totals less the give-backs, the give-backs, sold and fetched per species, かいがら, owed, the pieces),
  kept in the same transaction as each tally, give-back, sell and buy (`shopNote`: a tally's change is its kept row
  less the one it replaced; a sell or buy by the fold's own step, `contract/shop.ts shopStep`), never their history
  (until 2026-11-05 every sale reread it: a year's 20-sale batch read ~153k rows, 112 ms; now a few). Folded from the
  rows when it isn't there (the first sale after this deploy; after a `load`, which lets them go); the admin's
  `shopcheck {fix?}` compares each with the full fold (`same`, `differs`, `none`) and takes the fold's with `fix`.
- **A decor op's check** (`decorTarget`): reads only its own slots' rows (the piece's and its light switch's, the
  layout's reset) and the caps' counts (meta `decor_live`: the island's decorations, each room's pieces, the outdoors'
  pieces standing; kept by every decor op in its transaction, `decorNote`; let go by a reset or a load and counted
  from the rows at the next op; the admin's `decorcheck {fix?}` compares); until 2026-11-05 every op parsed every decor
  row. A reset drops the voided object and chunk rows by their slots' range and `at` (`dropVoided`, no row parsed).
- **Ingest:** `relay/src/parse.ts` and the audit row (`relay/src/audit.ts`); a day's latest
  value read from `metrics_latest` over the body's days (one row a day and metric: a 32-day body reads ≤ 32 × its
  metrics, never the history; until 2026-11-05 every row of the 32 days, ~23,000 after a month of hourly runs). `relay/test/ingest-golden.test.ts` runs a week of
  both phones' Shortcut bodies (their real shapes: A's iPhone-only body with English dates, B's with the Watch's steps
  and Japanese dates; made-up values) and checks the record's replies, rows, `at`s and audit rows against a recorded golden
  (`fixtures/ingest-golden.json`).
- **`since`:** answered from the `at` index; an empty poll reads one row (the revision). A row that arrived out of
  `at` order (an import's) is marked `late` with its arrival time, and a
  poll also returns late rows that arrived after `since` − 10 s, so no phone misses one (the merge dedupes it).
- **Revision:** `rev` is an epoch (`e1`, `e2`, …), changed only when the record is rebuilt (`node scripts/record.ts
  rev`, and by itself after a restore: [Revision](#revision)). Nothing edits the record by hand.
- **Admin:** `POST /admin`, signed like `/notify` ([Push](#push) "Auth"; the Worker refuses a missing or malformed
  signature or a time outside the 5-minute window with 401 before the object, which checks the signature; a `restore`,
  `rev` or `logpurge` is taken once per signature: its replay within 10 minutes is 409, table `admin_seen`), takes the record tool's ops (`{op}`: counts
  and who came which way, bookmarks, a restore, a new epoch, a dump (paged: `limit`, `after`), a compaction, the log (`logs`, `logstats`, `logpurge`: the log's own object, [observability](ops/observability.md)), the weather, and `load`: rows that already have
  their `at`, by the same rules, idempotent; a board post's, a packing list's and the wedding board's rows as the record
  had them, kept unless the row their slot holds beats them, since a dump holds each slot's latest only: until
  2026-11-06 a restore into an empty record dropped edited posts, a guest's item a member edited, an added item's
  removal and a tick older than its item's row, `test/restore.test.ts`).
- **Push-driven:** after a write the object tells the room (`changed`, [Push](#push); a failed call is tried once more); the room keeps the last one
  (`rec {at, rev}`, in its storage) and hands it to each phone in its `welcome`, so a phone that has it needn't fetch
  on opening ([When it syncs](#when-it-syncs)).
- **Compaction** (2026-11-05, `store.ts compact`): the record drops the `metrics` rows of locked weeks the model can no
  longer read, by the phones' own rule (`contract/compact.ts`; events are never touched, their slots keep one row each
  already, and no id leaves `ids`). A date at a time (its rows by the (person, date, …) key), a week of dates a
  transaction, at most 5,000 rows deleted a run (each delete writes ~4 rows against the Free plan's 100,000 a day): the
  Worker's cron at 19:15 UTC (04:15 Tokyo, just after a Wednesday's lock) once a day (`compactTick`, the log's
  `cron.compact`) **only with the var `COMPACT_CRON=1`, unset (off) since the user's hold of 2026-11-05: the locked
  days' history is kept until they decide**, or the admin's `compact {confirm: 'delete-health-history', max?, rev?}` by
  hand (refused without the confirm, 2026-11-05: it deletes Health history rows; `record.ts compact
  --delete-health-history`). Each run looks at the dates with rows written or loaded since
  the last run and those whose week locked since (the first run: every date); a run stopped at its cap leaves the mark
  where it was, so the next looks again (a compacted date is a fixed point: read, nothing deleted). No new epoch: a
  phone's cache holds a superset and compacts it by the same rule, so its views are the same; `compact {rev: true}`
  starts one when the phones should refetch the smaller record (once, after the first run's backlog).
- **Measured** (2026-11-02, curl from Tokyo): a full snapshot 0.09–0.18 s for 73 KB, an empty poll 0.06 s; an event write is one
  `events` request, the row back in its reply.
- **A restore** (`restore {bookmark}`): the object answers every `/api` request `unavailable` (retried, never
  acknowledged) from before it sets the bookmark until it restarts on it (~200 ms after its reply), so no write is
  acked and then dropped by the bookmark (2026-11-05, relay review O4); the restored record starts a new epoch.
- **Backups:** point-in-time recovery (30 days, on the Free plan) and `dump` / `load`: [runbook §13](ops/runbook.md#13-the-record).

## Live relay

Presence between the two phones while both have the app open (decisions: *Live relay on Cloudflare*). The room
carries intents, never data of record: the record ([The record](#the-record), its own object on the same Worker) still
catches an offline phone up.

- **Where:** `relay/` (its own package, outside the app's build): a Worker (`src/index.ts`) and one Durable Object,
  `IslandRoom` (`idFromName('island')`), SQLite-backed (`new_sqlite_classes`, the only kind the Free plan has).
  Production `wss://island-fund-relay.island-fund-relay.workers.dev/room`; a test copy, `island-fund-relay-test`, with
  its own secrets and room for the smoke test. `GET /health` → `{ok, v, versions, t, wx}` (`wx`: the real weather's
  `{at, src, age, hours, fails}`, [The real weather](#the-real-weather)); `POST /api` and `/admin`
  ([The record](#the-record)); `POST /notify` ([Push](#push)).
- **Admission:** the Worker accepts `/room` upgrades only from `ALLOWED_ORIGINS` (`https://island-fund.pages.dev`; exact origins,
  comma-separated) and
  `http://localhost|127.0.0.1`; everything else 403. The origin only keeps other sites out; the key is the auth.
- **Admission** (2026-11-05, relay review O3: the server half; the phones' half comes next, then it is required): a
  phone may offer, as its WebSocket's subprotocols, `island-v1` and a ticket (`contract/ticket.ts`: `tk.<who>.<exp
  base 36>.<hex HMAC-SHA256 under the person's key, lower case, of island-room.<who>.<exp>>`, `exp` at most 10 minutes
  ahead of the relay's clock; the phones make it for 5). The Worker checks it before the room (`auth.ts admission`): a
  bad or stale ticket is 403; a good one goes on marked with its person (`X-Island-Ticket`, set or removed only by the
  Worker), the room answers with `island-v1` (a browser drops a socket whose answer names no subprotocol it offered),
  its hello must be that person's (else 4001 `not the ticket's`) and it is never let go to make room for another
  (`makeRoom` lets go only unticketed ones; it still says hello within 12 s). A socket without a ticket is let in as
  before, for now. **The phones' half** (2026-11-05, client round 2): a paired phone (it knows whose key it holds,
  `island.me`) makes a fresh ticket for each socket (`makeTicket(key, me, now + offset + 5 min)`, the kept relay clock)
  and opens it with `[island-v1, ticket]`; two ticketed sockets in a row failing before they open (a 403, or a relay
  that can't answer one) and the next goes without, kept 6 hours (`island.liveTicket`) so a relay without the ticket
  costs one page load two failed handshakes; a ticketed welcome clears it, and one without failing too tries tickets
  again. The demo's test relays (no `me`) offer none. Safe to require tickets once both phones run this build (the
  log's `ws.hello` build) and the deployed relay answers `island-v1`: a phone whose ticket fails then has no fallback.
- **Auth:** the first message is `hello {key, since?, build?}` (`build`, 2026-11-05: the app's version, ≤ 24 of
  `[0-9A-Za-z.-]`, else left out; the room logs each welcomed hello as `ws.hello {v, build}` with who:
  [observability](ops/observability.md)). The room compares it in constant time with the secrets
  `KEY_A`/`KEY_B`/`KEY_C` (unset = nobody gets in) and answers `welcome {me, peer, t, rec?, here, gone?}` (`rec`: the record's
  last change; `here`: everyone else who is here; `gone`: when the room saw each person's last socket close,
  for those not here and my own last one, kept in its storage: one gone quiet inside a room leaves it then,
  `store/where.svelte.ts`), or
  closes 4001. No hello within 12 s (a DO alarm sweeps; a slow phone, a 3–5 s round trip and a long task at boot, still gets in; MAX_PENDING caps the silent ones): 4003. A second socket of the same person replaces the first
  (4002, no presence flicker), so there are at most three welcomed sockets. At most 4 sockets wait for their hello: a
  new one lets the oldest of them go (4003, the log's `room.full`), so silent sockets never keep a phone out; a socket
  is never refused.
- **Protocol** (`app/src/lib/contract/live-protocol.ts`, imported by both sides and checked by the same parsers): JSON,
  `v: 3` (the rolling-log world with the guest: `who` may be `G`, the welcome's `here`, a high-five's `to`; v1 and v2
  went on 2026-11-05, once every phone's hello said v3: the log's `ws.hello`), ≤ 256 bytes (an intent ~60–100; a `replay` ≤ 16,000). Intents: `walk {to: node id | [x, z], at?,
  from?, via?, s?, ms?, f?}` (world units, where the villager is going, and with `from`, `via` (≤ 10 waypoints), `s`
  (when it set off, the relay's clock), `ms` (how long, ≤ 60 s; 0 = put there) and `f` (the facing at its end: `home`,
  `in`, `l`, `r`) the very walk, [Shared
  world](#shared-world) "Villagers"; integers within the plan `WORLD_X` −230…620 × `WORLD_Z` −400…2500, equal to
  `island/world.ts` PLAN), `act {act, id?, at?, pt?}`,
  `catch {what, id?, at?, how?}`, `world {op, id}` (`watered`, `wished`, `woke`), `saved {}` ([Push](#push)), `decor {id, at, item, x, z, f, p} | {id, at, rm}` (a decoration set or removed, as the record's `decor` op, the tent's with `sc: 't'`; kept for the day and replayed, never claimed: the merge is commutative), `drag {id, x, z, f, it?, end?}` (a tent piece under the finger, ~10 a second while it moves, ≤ 60 bytes; presence only: relayed while the partner is there, never kept, replayed or written), `tent {in, to?, from?, via?, s?, ms?, seat?, n?, lie?, sc?}` (my villager in the tent, its walk there in the room's model units, or seated on a piece's seat `n` since `s` (rooms/seating.ts: the earlier sit keeps a seat); `sc` `u` / `v` another home's room, `m` the museum (`seat` a bench: `dmbench1`/`2`), its points within ±320, `s` the shop, no points (2026-11-04: an
older phone or relay drops it, and shows the villager at the shop's door as before); presence only) `highfive {at}` (a high-five, `at` the tap on the relay's clock, numbered; relayed live, and with the partner away the room holds the last one for them in its storage (`held`, one per recipient, a newer one replacing it), sends it after the welcome of their next hello, and lets it go at their `got {at}` or after a day; never the record; see [decisions](decisions.md#a-high-five-goes-over-the-relay-only-2026-11-02)) `fish {ph, id?, pt?, from?, s?}` (a line's step, `ph` one of `cast`, `nibble`, `bite`, `reel`, `off`; `pt` its float, `from` the angler's feet (its line runs from the rod there), world points; `id` the shadow at the float now, its shared id (a `cast` again at the same `pt` says a shadow noticed it, or with none that it got away and the float is back up); `s` when it went out; presence only: relayed live to everyone here, never kept, replayed, acked or written; the angler's phone sends its step again when someone comes, and a phone drops an angler's line at their presence off; [Shared world](design.md#shared-world)) and `say {text, sc?}` (a phrase over my villager, [Villager taps](design.md#villager-taps); `sc` where it was said, a home's room `t`, `u` or `v`, the museum `m`, none the island: the phones show it only in the same place, an unknown `sc` refused; presence only: relayed live to the others, never kept, replayed or sent to the record; `text` cleaned on both sides by `cleanSay`: NFC, no control, newline or bidi characters, blanks squeezed, trimmed, ≤ 20 code points, else dropped; the room passes one per person per second, the phone one per 1.5 s), `quiz {g, op, …}` (ききみみ クイズ, [docs/kikimimi.md](kikimimi.md#sync-one-new-presence-only-intent): `g` the game (`[a-z0-9]{4,8}`), `op` `open {seed, lv, same}` (the host's lobby: `seed` a uint32 (its bit 0 たいせん, bit 1 スピード はしご, bits 2-3 こたえる じかん), `lv` 1–8 (1–5 till 2026-11-06), `same` おなじへや), `join` / `leave`, `go {at}` (the game starts at `at`, the relay's clock), `a {i, k, rp, s}` (an answer: question 0–7, choice 0–3, replayed, the sender's running total 0–1040, a bound kept from the first-listen bonus's days), `skip {i, at}` (the host: question `i` starts at `at`; a player's: its よみおわった for question `i`, or with the host gone its つぎへ to `i`), `end` (the host cancelled it); ≤ 210 bytes sent; presence only: relayed live to everyone else here, the guest's too, never kept, replayed, acked or written; the phones compute the game's schedule from `go`, `kikimimi/session.ts`), `play {g, gm, op, …}` (2026-11-06, ききみみ's games, the quiz's successor: [kikimimi-framework.md](kikimimi-framework.md#41-wire-contractlive-protocolts); `g` the game (`[a-z0-9]{4,8}`), `gm` which game (`[a-z][a-z0-9]{1,7}`, a shape only: the relay knows no list of games), `op` `open {cv, seed, f, o, u?, ids?}` (the host's lobby: `cv` the content version, 6 hex; `seed` a uint32; `f` flags 0–7, bit 0 おなじへや, bit 1 たいせん; `o` ≤ 4 options 0–255; `u` a unit `[a-z0-9-]{1,12}`; `ids` ≤ 8 review item ids 0–99,999), `join {tr?}` (the player's tier 0–3), `leave`, `end`, `go {at, pl}` (`pl` the players' bitmask 1–7, A 1, B 2, G 4), `a {i, k, rp, s}` (round 0–31; `k` a choice 0–255 or 1–12 tiles 0–63; replays 0–99; the running total 0–9,999), `skip {i, at}` (round 0–32), `ev {i, e, x?}` (reserved: `e` 0–255, `x` 0–65,535); known fields only, by op; ≤ 210 bytes sent (the worst-case `open` 199), ≤ 256 relayed; presence only like `quiz`: relayed live to everyone else here, the guest's too, never kept, replayed, acked or written; no phone sends it before step 8c), `music {src, at, song?, ms?, pc?}` (2026-11-06, a music stage, [sound-sync.md](sound-sync.md): `src` `isl` the island (K.K., the island cut-ins) or a room's stereo `t` / `u` / `v` (`pc` the playing piece's decor id, room stages only); `at` the song's position 0 on the relay's clock; `song` `[a-z0-9-]{1,32}` with `ms` its length 1–600,000; no `song`: stopped. Numbered and acked, never in the ring: the room keeps the last record per source (`music` in its storage), the later `at` winning, a tie by who (`newerMusic`, the phones' rule too); an `at` over 5 s from the room's clock is taken as the room's (`t`); a stale one (older than the kept one) or one already over (`musicLive`: a song till `at + ms`, a stop for 10 min) is refused, `ack ok: false` after the kept record sent back to the sender; a taken one goes to everyone else; each hello gets the live records after the welcome (and `wx`), the sender's own too, the expired let go; an older relay refuses it, an older phone drops it) the shared world's ([Shared
  world](#shared-world)): `pick {id, what, at?}`, `put {id, what, at}`, `shake {tree, drop}`. Relay-only: `changed {what, who, at, rev}`, `wx {h0, s, fx?, at, src, rev}` ([The real weather](#the-real-weather)). The room drops any client-sent `who`/`t`, stamps its own (`t` strictly increasing) and sends it
  to the other person only. Any intent may carry `c`, the phone's sequence number (increasing through the day: its
  `Date.now()` at sending, or one more): the room answers the sender `ack {c, t, ok}` (`t` its stamp; `ok` false when
  the world refused it: a claim already made, a nest too soon, a walk numbered before the one it keeps on the same
  socket, or one from another socket that set off (`s`) over 5 s before it: since 2026-11-05 a walk's `c` is compared
  only with its own socket's (each socket gets an id at open, `Meta.sk`, kept with the walk and never sent), so a
  person's second device with another clock, or a phone after a reload, walks on where a newer socket's walk had been
  refused), and a resend
  of a kept intent with the same `c` (after a reconnect) is acked again, never relayed or kept twice; so is one of the
  last 64 acked intents it doesn't keep (a high-five: the same intent and `c`; kept in its storage, `acked`, since
  2026-11-05, relay review R2: a wake from hibernation forgot them, and the resend after it was delivered twice). It relays to
  the partner before it writes the day to storage (a message sent after a write waits for it: the output gate), so a
  kept intent reaches the partner as fast as a passing one; its ack goes after the write (an ack is durable).
  `ping {c}` → `pong {c, t}`; the heartbeat (2026-11-05, `HB_PING` / `HB_PONG`: exactly `{"v":3,"kind":"hb"}` → `{"v":3,"kind":"hb","t":0}`), answered by the
  Durable Objects runtime itself (`setWebSocketAutoResponse`), so it never wakes the room or bills duration: liveness
  only (`t` is no clock), any socket, never the bucket; the welcome's `hb: true` says the room answers it; `got {at}` (my phone heard the partner's high-five `at`: the one held for me goes); `presence {who, on}` when the partner comes or goes (the island
  stands Wilbur on the dock while it's on). A `v` the relay doesn't know closes 4004, before or after the hello, with
  the reason `protocol version N unsupported (relay speaks 3)`; the client waits for the next show, i.e. a reload.
  `GET /health` lists `versions`. Deploy order for a version bump: the relay first, speaking both (`LIVE_VS`), then
  the app; the old one goes once the log's `ws.hello` (`npm run logs -- report`, *Live hellos*) shows every phone on
  the new one.
- **Limits:** per socket a token bucket of 20, refilled 20/s; beyond it messages are dropped, not queued, and a welcomed phone's numbered intent hears `busy {c, t}` (2026-11-05: neither relayed nor kept; the phone sends it again later; its own kind, so an older phone ignores it and resends after its next welcome as before). `ping` and `got` never wait on the bucket.
- **Ghosts** (2026-11-05, relay review O2): the heartbeat never reaches the room, so a phone gone without closing its
  socket (asleep, out of signal) stayed `here`. A phone whose hello says `beat: true` sends something (the heartbeat
  at least) whenever it has *sent* nothing for 20 s; the room watches such a socket's last sign of life (its hello, its
  last message: the attachment's `hd`, kept every 10 s at most; the runtime's `getWebSocketAutoResponseTimestamp`: the
  last heartbeat answered) and, silent 60 s (three beats missed), closes it (4003 `silent`), its person gone for the
  others (presence off, `gone`). Nothing is sent to ask (a mid-session `welcome` would make a phone redo its welcome's
  work: its outbox, its catch-up fetch, its clock). A socket without `beat` (the apps before it ping only when they've
  *heard* nothing for 20 s, so one only listening to the partner may be silent for minutes) is never closed for its
  silence. An alarm watches while a beating socket is in (`sweepSilent`, at most every 30 s, shared with the hello
  sweep's and a restore's), and each hello sweeps first, so a newcomer never hears a ghost is here. A message the
  room's code throws on is caught (the log's `do.error`, `where: ws.message`), the socket kept. The phones say `beat`
  since 2026-11-05 (client round 2: sync/live.ts probes when either nothing was heard or nothing was sent for 20 s;
  `live-room.test.ts` runs the client against the real room for 4 minutes of only the partner's news: connected).
- **Replay:** the room keeps today's shared world in DO storage ([Shared world](#shared-world)); a hello with `since`
  (the last such `t` that phone heard, kept across reloads: `island.liveSince`) gets the newer ones after the welcome,
  all of them, mine too (a phone that lost its record gets it back), in `replay {es}` messages of ≤ 16,000 bytes (~150
  changes each) in the room's order.
- **Cost:** the Hibernation API (`ctx.acceptWebSocket`): an idle socket keeps no DO in memory. Free plan: 100k
  requests/day (incoming WebSocket messages count 20:1), 13,000 GB-s/day; two people tapping are far below.
- **Client** (`app/src/lib/sync/live.ts`, `createLive({key})`): connects while the page is visible and online, closes
  on hide or offline (no socket, no timers), reconnects after a drop with backoff (1 s doubling to 15 s, ±25 %: only while shown, so the cap is a game's longest
  wait for a link back; 60 s till 2026-11-07); after 4001/4002/4004 it waits until the page is shown again. Clock: pings at welcome and +2 s; the offset is the shortest
  round trip's of the last 8 (`serverNow()`), across sockets: a welcome takes its own guess (`t` − now, short by the
  trip) only when the pings' offset from before falls outside its bounds (2026-11-07: a reconnect moved a game's clock
  by the welcome's trip, a second on a slow link), kept across reloads (`island.liveOffset`, 2026-11-05: rewritten when it
  moves 50 ms): what a phone stamps before its first welcome (a layout or a room op made offline or in the first second
  after opening) is on the relay's clock too, so a device clock running fast can't win every last-writer conflict;
  the shared world's Tokyo day (the record's day rows, the wishes' mornings, the row's date) is the island's clock's
  (`world.now()`), never the device's. **Liveness** (2026-11-05): a socket that dies without closing (a
  half-open TCP after an iPhone's sleep, a tunnel) used to look connected for good: pinged once a minute, its pong never
  awaited. Now a socket quiet for 20 s (nothing heard: any message counts) is pinged, and nothing heard within 10 s of
  a ping gives it up (closed with the client's own 4000, logged as `ws.close`) and opens a new one at once, whose
  welcome sends the outbox again; `pageshow` and `focus` ping a socket that looks open (iOS can bring a page back
  `visible` with a dead socket). A kept intent's ack is due within 5 s: overdue with nothing heard since it went, the
  socket is asked (a probe, its answer due within 5 s: only no answer gives the socket up; 2026-11-05, it was given up
  at once, so an intent a relay dropped without a word reconnected every 5 s for good, the outbox kept across reloads);
  heard from (a relay that dropped it over its limit, or one it couldn't read, without a word), it goes again on the
  socket, the wait doubling to 60 s, each such miss a try kept with the entry across sockets and reloads, and after 4
  it's dropped (`ws.unacked`: a catch is still in the record's day row); `busy {c}` resends it after a backoff (1 s
  doubling, no try). `ack {ok: false}` (refused: a claim already made, one it couldn't read) takes it out and tells
  `onRefused` (store/world.svelte.ts: a refused claim is a race lost). **The socket's buffer** (2026-11-05): Chromium
  and WebKit grow `bufferedAmount` inside `send()`, so an editor's save of 40 ops in one task found it past 4 KB after
  ~27 and the rest were kept unsent with no ack due until the next welcome; now one the buffer turns away waits on this
  socket (`held` in `metrics()`, no ack due, never taken for a dead socket) and goes as it drains (looked at every 30
  ms), in order: nothing kept goes ahead of it. The outbox full (120), its oldest layout op goes first, never a catch
  for an editor's save. **The welcome** is due within 10 s of making the socket (20 s, 30 s after failures): else it's
  dropped (the client's own 4010, `ws.close`) and another made after the backoff; one still opening 4 s after it was
  made when the app comes back to front (a visibility change, `pageshow`, `focus`) is replaced at once (iOS can freeze a
  socket mid-handshake). The kept clock offset (`island.liveOffset` `{off, at}`) is trusted for 6 hours after it was
  measured, never when the device's clock is now behind `at` (set back since). Idle traffic while
  shown: 3 probes and 3 answers a minute on a quiet socket (was 1 and 1), none while anything else is heard; since
  2026-11-05 a probe to a room whose welcome said `hb` is the heartbeat (`HB_PING`, answered by the runtime with the room
  asleep: no duration), and a timed ping goes at most 5 minutes apart for the clock (`CLOCK_EVERY_MS`); an older room
  gets pings as before. `send(intent)` is a no-op returning false unless welcomed
  and, for what the room doesn't keep, the partner is present; it never throws or blocks. A layout op sent with someone
  there is numbered too (2026-11-05, `isLayoutIntent`): acked, never kept, so an editor's save of 40 over the room's
  burst of 20 hears `busy` for the rest and sends them again a second on (the room acks a resend it relayed without
  relaying it twice: its last 64 acked intents), where they were dropped and only the record's push brought them. `on()` delivers the partner's intents,
  `onStatus()` `{connected, me, peer}`. URL: `LIVE_URL`, overridable by `VITE_LIVE_URL` (empty = off). What the room
  keeps (`isStored`: the shared world's intents and walks) goes even with the partner away, numbered (`c`), and waits
  in an outbox (≤ 120, a walk replacing the walk before it) until its `ack`: sent offline or lost with a dropped
  socket, it goes again after the next welcome (12 at once, then one every 60 ms; another day's dropped). The outbox
  is kept in localStorage (`island.liveOutbox`, 2026-11-05: written once per burst, under the person key's hash, read
  back at startup for that key only), so an intent made offline survives the app being killed; the relay knows a
  resend by its number and acks it without relaying it twice. Two tabs share that one copy: each merges the other's
  entries in before it writes (by number; what it took out itself stays out), and takes the other's writes as their
  `storage` events land: what the other tab added it sends on its own socket if that's the one up, what the other had
  acked leaves it too. Paired again as someone else on the same page (the backend's reset stops and starts the one
  socket), the outbox is the new key's: the last person's is neither sent nor kept under the new key. The day
  comes as `replay`, each change delivered in order, mine too. `metrics()`: messages and bytes
  each way, resends, the last acks' round trips, what's waiting.
- **Measured** (`npm run smoke` from a Mac in Tokyo, edge NRT): connect ~65 ms, ping RTT median 18–21 ms (p90 23–40),
  partner one-way median 19 ms (p90 44), clock offset ±9 ms. `npm run latency` (2026-11-01, the test copy, both
  clients on one Mac, n = 30 each): a passing `act` one way median 21–23 ms (p90 26–40); the kept ones (walk, catch,
  pick, put, watered) were median 31–35 ms (p90 36–45) while the room wrote before relaying, and are 21–22 ms (p90
  25–35) relaying first; their ack median 31–33 ms. A late join of the day (169–352 changes): one message each, the
  last 134 ms after the hello (169 messages, 17 KB) → 3 `replay` messages, the last 29 ms after it (36 KB).
- **Tests:** `relay/test/` (keys, origins, the bucket, the room: auth, relay to the other person only, stamping, rate
  limit, replay and ring trimming, replacement, presence, hello timeout, the socket cap, the nudge and `changed`; the
  notify secret, signatures and window) with `cd relay && npm test`
  (also `.github/workflows/relay.yml`); `live-protocol.test.ts`, `live.test.ts` and `store/push.test.ts` in the app's vitest.

## The real weather

Tokyo's sky by the hour for the island ([design](design.md#weather); decisions: *Weather from Tokyo, by the hour*).
`relay/src/weather.ts` (pure but for its fetch), `IslandRoom.weatherTick` (`relay/src/index.ts`), the phones'
`sync/wx.ts` and `island/weather.ts` `realWeatherAt`.

- **Source:** Open-Meteo's forecast, JMA's models (`/v1/forecast?models=jma_seamless`, hourly `weather_code`,
  `precipitation`, `cloud_cover`, `visibility`, `temperature_2m`; `past_hours=13`, `forecast_hours=36`), for one
  fixed point (`wrangler.toml` `WX_LAT` / `WX_LON`: 35.69, 139.75, central Tokyo by the 東京 AMeDAS station). No key,
  free for non-commercial use, data CC BY 4.0, credited in せってい (「天気: Open-Meteo（気象庁モデル）」). No phone
  calls a weather API, and nothing about us leaves the relay but that coordinate. JMA's model gives no snow, fog or
  thunder codes and no visibility for Tokyo: snow comes by temperature, and the fog and thunder rows stay for a
  model that has them.
- **When:** the existing `*/15` cron calls the room's `weatherTick` next to the export. A fetch is due 30 minutes
  after a good one, or past :45 with none since (so the next hour is locked before it begins): about 48 a day, at
  :15 and :45. A hello fetches too when it's due (the test copy has no cron; production's safety net). One fetch at a
  time, a 5 s timeout. A failure (an error status, a bad body, a timeout, no current hour) keeps the timeline it had,
  logs `wx-fail <why>` and backs off 30 min, 1 h, then 2 h.
- **The timeline** (storage `wx`: `{wx, fails, failAt?}`): `wx = {h0, s, fx?, hi?, at, src, rev}`. `hi` is `[tokyoDay, °C]`, the high of the fetch's Tokyo day (from ≥ 12 of its hours; しずえの ニュース reads it out), and a changed high bumps `rev` too. `h0` is the first hour
  (hours since the epoch, UTC) and `s` a letter an hour: `c` fine, `o` cloudy, `r` rain, `h` a downpour, `s` snow. The
  12 hours before now (the phones' rainbow looks back) and the next 36, ≤ 48 letters. `fx` lists the foggy hours,
  `at` is the fetch time, `src` is `om` (Open-Meteo) or `fx` (an admin fixture), and `rev` bumps when an hour a phone
  holds would read otherwise (or it reaches 6 hours further). The response is checked strictly (hourly times, WMO
  codes, numbers in range), so bad data never replaces good.
- **The mapping** (dead bands on the hour before's sky): wet from 0.5 mm/h or a rain code (lighter drizzle is
  cloudy), kept down to 0.2; a downpour from 4 mm/h, a heavy code, freezing rain or thunder, kept down to 2.5; snow by
  a snow code or wet at ≤ 1 °C, kept up to 2 °C; cloudy from 85 % cloud cover (overcast's code without one), kept
  down to 60 %; fog by a fog code or under 1 km while dry. Then a lone dry hour between wet ones is wet, and a lone
  hour between two alike is theirs.
- **Locks:** an hour that has begun (and the next one, once a fetch came after :45) keeps the sky it had; a fetch
  rewrites only the hours after. The sky changes at most once an hour, at :00, and a phone that cached it before the
  hour shows the same as one that's online.
- **To the phones:** `wx` after the welcome (while the timeline serves: fetched within 36 h and covering the hour)
  and to every phone when its `rev` changes; ≤ ~190 bytes. The phone keeps the newest one and caches it (`island.wx`).
- **The phones:** in ほんもの mode (`pref weatherMode`: one island-wide row in the record, slot `pref|island|weatherMode`,
  the last anyone set, the guest too) the hour's sky comes from the timeline while it serves, else from the
  seeded day; winter's snow, the event nights held fine, the seeded fog and aurora, and the rainbow are the phone's
  rules (pure, by the date: both phones agree).
- **The island's look** (`pref seasonLook`, 設定 → 季節, 2026-11-08): `{event, season, weather, tod}` (each a lowercase
  id or null) or `null` (自動), one island-wide row (slot `pref|island|seasonLook`, the last anyone set, the guest too).
  The record checks the field names and that each value is `[a-z0-9-]{1,24}` or null; the phones read the values they
  know (an older phone ignores the key, a newer value shows as the real day's).
- **Ops:** `GET /health` → `wx {at, src, age (min), hours (ahead), fails}`. The signed `/admin` op `wx` (via the
  record's object): `{refresh: true}` fetches now, `{s, fx?}` puts a fixture timeline in from the current hour (the
  smoke test), `{}` says how it is. Weather is never written to the record; only the mode is.
- **Tests:** `relay/test/weather.test.ts` (Open-Meteo responses recorded 2026-11-04, a clear winter day, spring
  showers, a rainy-season day, a downpour, a typhoon, the snow of 2024-02-05 and that day's forecast, against golden
  timelines; no one-hour flicker; the dead bands, fog, the gap fill, the strict parse, the locks, the revisions, when
  it's due, the backoff; a 500, a bad body, a timeout and no network keeping the good timeline, with a fake fetch and
  a fixed clock), `room.test.ts` (`wx` after the welcome, on change), `store.test.ts` / `guest.test.ts` (the
  mode's row); the app's `island/realWeather.test.ts`; `e2e/realweather.spec.ts`; `npm run smoke` (a fixture reaches a
  phone; a fetch from Open-Meteo; `/health`'s age).

## The guest

A third person, a visitor rather than a member (docs/design.md "The guest", decisions: *A guest, not a third member*):
one key, `KEY_C` (a Worker secret like the others; unset = no guest), role `guest`, who `G`. On the island the guest
is a member's equal (2026-11-06, decisions: *The guest plays the island as a member does*): the layout and the
decorations, its island day, the flowers, the stars and the visitors, the weather, the board, the shop, the homes
(its own), ききみみ. The economy (the ベル spent on ごほうび, the harvest), the members' goals, their real-world records
(a trip's notes, the wedding board), the Health ingest, the trees, きろく, けんこう and ふたりでぜんぶ stay A + B; the
からだ figures never reach the guest at all.

- **What it sees** (the record, `contract/guest.ts guestRows` via `rowsFor`, applied to every `snapshot` and delta of the guest's key):
  the members' activity (`steps`, `exercise_min`, `move_kcal`, `stand_min`), every event but the からだ goals (`pref
  goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`: the registry's `body` group): the goals and their history, the buys and voids (the jar, view-only), the harvests, the finds, tallies,
  decorations and the layout, island days, cosmetic prefs and the weather, the board, the trips' packing lists and notes (`trip_note`) and every meal (everyone's, with the meal log's goals; every repeat, recipe and custom food too); its own ききみみ `listen` rows whole and the members' as their summaries (as a member gets the other's; a member gets the guest's the same way). Never a からだ row: `weight`, `body_fat_pct`, `bmi`, `lean_kg`; never a member's profile (`pref sex` / `birth` / `bmiStd` whose subject is A or B), its own it does get. A member's snapshot in turn never carries the guest's profile (`rowsFor`).
- **What it writes** (`guestMayWrite`): everything on the island a member writes, under the same rules as a member:
  `find`, `tally` and `tally_back` (credited to `G`), its part of the island's day (`island`), any `decor` op (the
  island's decorations, the outdoors `o` / `c` / `r`, the tent's room, its own home's room and look `v`, `h` with `hG`;
  another's home is `forbidden` to it as to anyone: `scopeMayWrite`), a `board` note (its own to edit; any to take down,
  as a member), a `sell` and a `buy` at the shop (its own pocket and かいがら), a trip's `pack` op (adding; changing and
  removing only the ids it made, a category only while all its items are its own), its own `pack_chk` and `pack_reset`, a `food` entry, a `food_repeat`, a
  `food_recipe` and a `food_custom` (its own meals, repeats, recipes and custom foods; only its own to edit, end and
  remove; anyone's recipe or custom food it logs as its own entry), its ききみみ games (`listen`), its own `pref`
  `locale` / `villagerName` / `villager` / `look` / `savedLooks`, the meal log's goals, its profile (`sex`, `birth`,
  `bmiStd`) and the island's `weatherMode` and `seasonLook` (no `person`). Not the economy (`spend`, `spend_void`, `harvest`), a
  member's or an activity / からだ goal, a `trip_note` or the wedding board (`wtask`, `wdone`, `wconf`, `wnote`), nor
  `ingest` / `uploads`: `forbidden` (the queue drops it). Its rows are the record's like anyone's: one tally per day (`tally|G|<date>`), its prefs' own slots, the tent's
  merge order A < B < G; the dump carries them with `person = G`.
- **The room:** the guest sends anything a member does (`guestMaySend` went 2026-11-06): a world op (watering, a
  wish, a wake), the island's and the outdoors' `decor`, a `saved` nudge too; a scoped `decor` op of another's home is
  refused for anyone (`scopeMaySend`: acked `ok: false`, never relayed). Its intents reach both members' phones; theirs reach it. Presence is per person: each
  join and leave is told to everyone else who can hear of it; `peer` stays the partner for a member (the guest never
  counts) and either member for the guest. A high-five names whom it is for (`to`; a member's to the partner may leave
  it out), and the room holds the last one per (sender, recipient) pair for a recipient who is away (`Held`, `<from>><to>`).
- **Push:** its own `changed` notices reach every phone; of the members' it hears an event's, an ingest's only when
  that ingest brought activity rows (the record says so: `notify(n, guest)`), and a new epoch's. A members' ingest of
  からだ rows alone never reaches it: when one ran is theirs, and its snapshot (no からだ row) could never reach that
  mark (2026-11-05 client review). Its welcome's `rec` is the last change it heard of (the room's `rec-g`), not the
  record's.
- **The phones** ([design](design.md#the-guest)): a member's draws the guest's villager while it's `here`, as a third
  villager actor (`ui-state/cast.ts`: `mine`, `partner`, `third`; on the guest's phone `third` is B); the guest's
  phone guards what it sends by the same rules (`week.send` by `guestMayWrite`, the socket by `scopeMaySend` as
  every phone), so nothing it may not do is queued or shown.
- **Tests:** `relay/test/guest.test.ts` (the snapshot and deltas never carry a からだ row or a からだ goal and do carry
  the activity; the island's writes taken from it, the layout and the decorations, its island day, the weather, the
  board; the economy's and the members' records refused, leaving nothing; the export has `G`'s rows; the room's three
  villagers, its world ops and decor relayed, the high-fives' pairs); `contract/guest.test.ts` (every event type
  placed, the prefs, `rowsFor` the guest: all but the からだ rows); `model/guest.test.ts` (credit, first finds, counts,
  the view, its island day and weather); `e2e/guest.spec.ts` (the guest's phone shows no からだ, no ベル buy or erase;
  its もようがえ, the editor, the weather and つうしん; its catch in a member's ずかん credited to it; its tent piece in
  both members' tents; its villager on both islands only while open, still when idle), `e2e/island-edit.spec.ts`
  (its outdoor piece on both members' islands and in the record), `e2e/editor.spec.ts`, `e2e/realweather.spec.ts`,
  `e2e/board.spec.ts`; `npm run smoke` (the test copy's guest key, when `.smoke-keys` has `KEY_C`).

## Ambient life

What the island does on its own (a villager's outing or small move, the visitor's beat, a fish, bubbles or a bug
coming by) is decided per 10-second slot of the Tokyo day from the date, the slot and the shared world, so both phones
show the same island without a message (decisions: *Ambient life from the clock*). `app/src/lib/components/island/ambient.ts`
(pure, tests `ambient.test.ts`); idle life and the critters play it.

- **Clock:** `slotAt(ms, offset)` → `{date, slot, into, hour, month}`, 8,640 slots a day on whole 10 s of the epoch.
  `ms` is the island's clock (`clock.ts now()`, so a `?date=` preview moves the slots); `offset` the relay's clock minus
  the device's from the shared socket's pings (`ambientClock.ts relayOffset`: `liveRelay().serverNow() − Date.now()`,
  0 before any welcome: alone, nobody has to agree). A slot is played `DECIDE_MS` (500 ms) after it starts, by when an
  intent sent before the start has reached the partner; walks start then, small moves at their `at` within the slot.
- **Randomness:** `slotRand(date, slot, kind)` = `dayRand(date, "ambient:<kind>:<slot>")` (the island seed's mulberry32),
  kinds `villager`, `visitor`, `host`, `critter:<channel>`; species from `spawnRand(spawn)` with the existing pickers
  (`pickFish`, `pickFresh`, `pickDive`, `pickBug`), so the lazy tables stay out. Engine-proof: integer world points,
  squared distances, plain string order.
- **Villagers** (`villagerBeats(world, date, slot)`): the world is each person's villager (`at`, `home`, `free`:
  awake, standing, not busy; `lastIntent`: when its person last steered it, `avatar.ts steered`: my taps here, the
  partner's walks over the relay), the points of interest (`wander.ts pois`), the phase and both day scores. Beats are
  keyed by person (idle life maps them to its actors: `cast.ts actorOf`): one a slot, an idle move from `IDLE_POOL` (its hours,
  day-only moves, `every` gaps against the recent slots' rolls), an outing of 1–3 stops within 600u with lingers (30 %
  of slots, one villager out at a time, from home; `avatar.ts outing`), a chat or a dance for two free villagers
  (dancing only with both scores ≥ 70), or the night's doze. A villager whose person has the island open (`present`:
  mine always, the partner's by the relay's presence) makes small moves but no outings, and one is left alone 12 slots
  (2 min) after its person's last walk (`held`). The guest's villager is in the world (`G`) while it's on the island
  (its app open: always `present`): the slot's turn is then a third each and a pair any two; it has no outing of its
  own, joins the dusk meet-up at the point of interest nearest the front bench, and shakes no tree.
- **Visitor:** `Visitor.svelte beat(r)` runs `visitorLife.ts pickAct`, `pickEmote` and `strollSpots` on the slot's
  `visitor` PRNG; a phone whose visitor is speaking skips it.
- **Critters** (`spawnsIn(date, slot, coasts)`, `crittersAt(date, slot, coasts)`): per channel (the sea off the front
  beach, `sea`: a shadow, as every stretch's; its bubbles a channel of their own, `bubbles`, odds `BUBBLE_ODDS`; the rest of the coast a channel per stretch, `sea1`…, shadows
  only, their count the layout's, `island/coast.ts coasts()`; each fresh water, the pond, the river, its mouth and the clifftop, a channel of its own; the bugs two, `bug` and `bug2`: two roaming at once, the second's spot off the first's, `bugRivals`) a slot
  brings one with odds 0.9 when the last one's stay is over, at
  `at` ms into the slot, staying 4–5 slots (bubbles 3, a bug 2); the stays are chained per 10-minute block from the date
  and slot alone, ending within it, so a phone opening mid-stay finds the ones still there. Where each is comes from its
  seed too (`critterPath.ts`: its swim patch or the bug's spot, and its itinerary, each move at a time
  after it came, `legAt` for a phone joining mid-stay), never from a camera; `Critters.svelte` places it there and
  each phone shows it when its camera sees that spot. Its id is `<kind>:<slot>`, a fresh water's `fresh:<water>:<slot>`, a stretch of coast's `fish:c<k>:<slot>`, the second bug's `bug:l2:<slot>`
  ([Shared world](#shared-world)).
- **Agreement and its limits:** the same inputs give the same slot (tested with shuffled inputs and skewed clocks).
  The phones differ where their inputs do: a clock offset off by more than the 500 ms margin, a walk sent within
  ~20 ms of a boundary, a local skip (a sheet, a reaction playing, the 3-minute slow-down), and the camera (each phone
  shows what its view holds of the same world). What a person does by hand plays on their phone as it always did (a
  cast's bite plan and its hesitation, a dive's chase, a tarantula rearing, a line read, a balloon, a shooting star);
  its outcome is shared ([Shared world](#shared-world)).

## Shared world

Both phones show the same island (decisions: *A shared world: the seed for what comes, the relay for what we do*).
What comes by itself is a function of the date, the slot and world coordinates ([Ambient life](#ambient-life)); what
a person does is a small intent over the relay, kept by the room for the day, folded by both phones into the same day.

- **The day** (`sync/world-day.ts`, pure, tests `world-day.test.ts`): a `WorldDay` folded from the day's intents in
  the relay's order: claims (`catch:<id>`, `pick:<id>`: who got it, what, how, where), puts, the shakes in order,
  watered cells, wishes, each person's last walk. First wins, and the relay's order makes it so: a partner's claim of
  something I claimed too means the relay heard theirs first (it drops a later claim, never relaying or keeping it),
  so theirs replaces mine (`beat`) and my phone shows it caught by them. **A race lost** (2026-11-05): what my claim
  put in my pocket comes out again (`world.lost` → `store/actions.ts lostRace`: each catch and pick-up counted with
  its claim key and its held minute; one counted in the tally still waiting to be sent, held a minute or queued while
  offline, is sent again one less, by the same `tally` event), with a line 「〇〇が さきに とったよ」 (a live catch's own news on the island says it
  instead). A day's counts only grow on the record (`mergeTally`), so one whose tally went (a race lost after its
  minute: a catch made offline, resolved at the reconnect) is given back by a `tally_back` of its day (2026-11-05,
  [Events](#events): the day's given-back counts with one more, never past what the day's tally holds). A catch
  counted in an earlier minute than the held one is given back too (taking it out of the held tally did nothing: the
  record keeps each count's larger value). Across a reload or a kill (2026-11-05, round 2): the claims counted today
  are kept beside it (`island.counted` `{me, d, cs}`: claim → tally key; the demo's per player), so a race lost after
  the page that counted it is gone (the partner's claim heard in the next open's replay) still gives the catch back, by
  a `tally_back` (the queue never lets one pass a held tally: the record takes it only while the day's tally covers
  it). **A refused claim** (the room's `ack {ok: false}`, `live.onRefused`): someone reached it first and this phone
  never heard theirs (the room's day ring past it); still mine here, it's a race lost as above, the claim the
  partner's (the guest's phone: A's), kept with the day, until the record's rows say otherwise. A repeat changes nothing; another day's is
  ignored. A claim in the day is gone on every phone, mine too (`lying`, `takenIds`; the island's finds, care, fruit,
  branches and wood): a phone that lost its own scene record (a new origin, Safari's cleared storage) gets my claims
  back in the replay and the day's row, and a claim can't be made twice, so a thing kept lying for one was drawn but
  untappable (2026-11-05, after the move to pages.dev: the presents I'd opened lay about, `e2e/present-taps.spec.ts`).
- **The store** (`store/world.svelte.ts`, `world`): today's day on this phone, kept in localStorage (`island.world`,
  the day's events; the demo's per tab) so a reload needs only what's new; `share(intent)` folds my change (refused
  when the partner already has it), keeps it and sends it; `on(fn)` the partner's, `live` when it happened in the last
  12 s (the island plays it: their villager turns to it and it plays at the target), else (heard on opening) it
  only changes the island. My change goes to the relay first, at once (never behind the record's 2-minute hold), then
  is folded and kept; my own heard back in the relay's replay is folded quietly. The day's record is written once per
  burst (a microtask after the last change: a replay of 300 changes is one write, not 300). Attached to the phone's
  one socket when the backend starts (`store/live.ts`), so the
  partner's changes are heard on any tab of the app.
- **The room** (`relay/src/room.ts`): keeps today's world (Tokyo's day on the relay clock, a new day starts empty but
  for each person's last walk, carried in with a new stamp so a phone opening asks for it: their villager stays where
  it was left, however long ago): the last 400 changes (`world`, `catch` with an id, `pick`, `put`, `shake`; past
  that the oldest that claims nothing and isn't a walk goes, then the oldest claim) and each person's last `walk`
  (replacing the one before), in DO storage (one value, `ring`, written whole at each change: as rows, a walk would be
  two writes, its old row's delete and its new one, against the Free plan's rows-written budget, for a ≤ 40 KB value's
  serialising saved; relay review O10, kept as is). The day's claims (with who made each, its stamp and `c`) and each tree's
  last nest are kept apart from the ring (storage key `day`, `DayIndex`, let go with the Tokyo day), so neither a
  trimmed ring nor a hibernation after it lets a claim be made twice (2026-11-05: a pick trimmed by 400 later changes
  and a restart was accepted again); a resend of a trimmed claim by its sender with the same `c` is acked again. It
  refuses a claim it already holds today and a second nest from a tree within the hour (`NEST_GAP_MS`). A hello's `since` replays the partner's
  after it; a page's first hello asks from Tokyo midnight (or the kept `since`), so a phone opening later hears the
  day.
- **The demo** (`sync/live-local.ts`): the demo's two players are two tabs of one browser (`?demo`, `?demo&as=B`);
  a BroadcastChannel carries the intents and the sending tab plays the room's rules on a log in localStorage
  (`island-demo.relay`), so the e2e's two-player tests (`e2e/shared-world.spec.ts`) run on it without a network.
- **The record's day row** (`island` event, [Events](#events); `store/actions.ts sendIslandDay`): my part of the day
  (`rowOf`: what I took, put down, shook, watered and wished, where my villager stands), sent whole when it grows,
  held 2 minutes (a busy stretch is one request), one row per person and day in the record (the older one replaced, as
  a tally's). The model keeps each person's latest (`state.islandDays`); the store folds today's (what the relay
  didn't bring: both apps closed past the relay's day, an outage), yesterday's watering (today's hybrids grow from both
  people's) and the wishes for the mornings to come (`applyRow`; a claim known from a row becomes news when the
  relay's own arrives, so the partner's animation still plays). A shake carries `at`, the shaker's own time, its
  identity on both phones and in the row.
- **Villagers** (`island/villagerSync.ts`, `motion/director.svelte.ts` `onOwnMove` / `setRemote`): each person's
  phone moves their own villager and is the one that does. Every walk and put of mine (a tap-walk, a
  stop under a sheet or by a reaction, back home after 30 s away; a burst within one task is one message) goes as the
  very walk: `walk {to, from, via, s, ms, f}`, `s` on the relay's clock. The partner's phone plays it from the same
  start at the same time: on time it walks the way; late (a slow message, a phone opening mid-walk) it starts where
  the walk is by now (`along`) and arrives when it does there; a gap ≤ 160u from where their villager stands here is
  walked off within the walk's own time, a bigger one glides off from where it stands (no slower than the run, at most
  1.5 s, arriving a little late); a walk already over is a brisk catch-up within 120u (≤ 600 ms), further a glide
  there (≤ 1.5 s), facing `f`: never a jump while the island is in view and the news live. A phone opening (the
  day's last walk, the replay) or the scene hidden puts it where the walk has it by now. Out of a room's door the
  room says my put at once (`island/doorOut.ts`, in the shared day). While the partner has the island open
  (presence), their villager is the relay's to move here: this phone's own life (a follow, an outing, a
  meeting with the visitor, a put under a sheet) leaves it alone, and a reaction here doesn't stop its walk. On a
  partner's arrival my villager's current walk goes again (they find it where mine is), and a walk under way is
  said again every 5 s while they're here (a phone that missed its start finds it on its way). Idle motions and the
  ambient beats stay clock-seeded (ambient.ts); an action plays in place on both phones (no walk-then-act). A phone gone
  (closed, hidden, offline, however long) leaves its villager where its last walk ended on every phone (the room's
  last walk, carried across days,
  [decisions](decisions.md#a-villager-stays-where-it-was-left-2026-11-04)); back, it says where it stands (its kept
  spot) once its welcome is in.
- **Sleep:** the villagers doze 22:00–05:00 on the relay's clock (`islandLife`: put to sleep or woken at the hour it
  turns, the same moment on both phones; never re-checked each minute, so a woken villager stays awake). A wake here (a tap on mine, a high-five wakes both) is `act {act: wake, id: <whose>, at}` (the relay's
  clock): the other phone wakes the same villager for what's left of its 10 s (`villagerSync.ts playWake`), so both
  doze off again at the same moment (and stay up past 05:00). Gulliver woken (the fifth nudge) is `world {op: woke,
  id: gulliver}`, kept in the day (`WorldDay.woke`): up on both phones, and for a phone opening later.
- **What's shared:** the critters: each where its seed puts it ([Ambient life](#ambient-life)), and its catch or
  escape by its id (`catch {what, id: <kind>:<slot>, at, how}`: `rod`, `net`, `dive`, `dig`, or `flee`, claimed at the
  tap so the relay's first wins; my cast as an `act` so my villager turns to it on the other phone too, its line the `fish` steps), a
  bug out of a bush, from under the rock or off a villager as a `put` (`bug:<id>:<bush|rock|flea>`, its itinerary
  from its id); where each villager stands (the last walk: a phone opening later puts the partner's villager
  there; mine stays where I sent it, across days), the partner's tap ring, and every tree's shakes: the outcome
  (`shake {tree, drop}`), what it left lying (a branch `br:<tree>:<k>`, coconuts `co:<tree>:0|1`, named from the
  day's shakes so both phones agree), a dangling bug (`dg:<tree>:<k>`) and the nest's wasps (`ws:<tree>:<k>`) as
  critters to catch, the nest rule; the day's things on the ground (shells, fragments, the bottle, dig spots and the
  next one, mushrooms, weeds, fallen goal fruit `fr:<person>:<fruit>`, branches, coconuts: `pick {id, what, at}`), a
  balloon's present (`put` where it lands; its contents in the opener's `pick`), watered flowers (`world watered`, by
  the flower's id), wishes (`world wished`, by the morning), a bush shaken and the rock struck (`act` with `pt`, played by the
  partner's villager).
- **The decorations** (`store/decor.svelte.ts`, [Decorating](design.md#decorating)): not the day's, kept for good. Each
  change is one `decor` op, sent to the relay at once (kept in the day's ring, replayed to a phone opening later that
  day) and to the record's queue (the record across days: each item's latest op); the store merges whatever arrives,
  from wherever, by id (`contract/decor.ts`), and keeps the merged map in localStorage (`island.decor`) so a reload
  shows the layout before the record answers. My op's `at` is the relay's clock and always after the op it replaces
  (a phone whose clock is behind still moves what it saw).
- **Still each phone's own:** the camera (each shows what its view holds of the same world), a balloon's flight and
  where this phone's lands (its present is shared once down), shooting stars and the night's showers' timing, the
  visitor's lines and a tap on them, a cast's bite plan and hesitation, a dive's chase, a tarantula rearing, the plates
  and lines read, a startup beat, sounds. These are what one person does or watches by hand, or decoration timed per
  screen; their outcomes (a catch, a find) are shared.
- **Budget** (Free plan): an intent is ≤ 100 bytes sent (tested), ≤ 140 relayed. A busy day of two people (~300
  walks, ~200 catches and pick-ups, ~50 shakes) is ~550 incoming messages: ~28 DO requests (20:1), ~550 storage writes
  (of 100,000 rows/day), and a replay on each open (outgoing messages are free). Nothing per frame. With every villager
  move told (2026-11-01): a walk ~100–200 bytes, one per move (a tap-walk, a stop; a burst within one
  task is one message), said again every 5 s while one is under way and the partner is here, one more on each join
  and reconnect; a wake ~70 bytes. A busy hour together (~120 moves, ~60 resays, ~40 world changes, pings) is ~250
  incoming messages, ~13 DO requests; a day of it ~2,000 messages, ~100 DO requests and ~1,500 storage writes: under
  1 % of the 100k requests, 1.5 % of the writes. The acks, presence and replays go out (free). Per frame: none (the
  director moves the feet by the clock; a message only at a walk's start).
- **Checked** (`e2e/sync-harness.spec.ts`): two players run a scripted session (four tap-walks, a pick-up, a catch,
  a present put down and picked up, a watered flower, a shake, a wish, two decorations placed, one moved by the other
  phone and one put away, both moving one at once, both grabbing one thing at once), then both phones (and a third
  opening later) must have the same canonical day (`world-day.ts canonical`, `hash`), the same decorations (each
  item's id, kind, spot and facing) and each villager at the same point, awake or asleep alike. On the demo's two tabs in CI; against the test relay with
  `RELAY_E2E=1 … --workers=1` (2026-11-02 00:10, from Tokyo, n = 3 runs): tap → the partner's villager sets off on the
  other phone median 34–40 ms (max 56), a pick-up / catch / put / watering / shake there 15–28 ms, a phone opening
  later has the same island 364–391 ms after its navigation starts (the page's load included); acks 29–38 ms; nothing
  resent. A decoration's change there median 21 ms (max 23; 2026-11-02, n = 4), the phone opening later with the same
  layout from the relay's replay alone (its own storage). The simulated room (`world-day.test.ts`, the real `RoomCore`) runs a 40-change session with conflicts, a
  dropped socket and its resends, and a late batched join: the same hash on every phone.

## Push

While the app is on screen, a change to the record reaches the other phone in well under a second instead of at its
next open (decisions: *Push through the relay*). Additive: the polling in [When it syncs](#when-it-syncs) still catches
up a phone that missed it.

- **Record → room:** after a write that added `metrics` or `events` rows (an `ingest` with a changed value, a new
  event; never a duplicate, a refusal or a read), the record calls the room (an RPC between the two objects, after its
  commit) with `{what: 'ingest'|'event', who, at, rev}` (`at` = the newest row's, `rev` the record's). `POST /notify`
  (signed, below) takes the same notice from a server (`npm run smoke` uses it; nothing else sends one).
- **Auth:** the notify secret is HMAC-SHA256(key `"<KEY_A>:<KEY_B>"` trimmed and lower-cased,
  `island-relay-notify/1`), derived by both servers from the person keys they already hold; a phone holds only its own
  key, so it can't sign. Nothing to provision; rotating a key rotates it (and the admin tools' keys file with it,
  runbook §4). The same secret signs `/admin`. Each POST carries `X-Island-Time` (ms) and `X-Island-Sig` = HMAC-SHA256(key secret,
  `"<time>.<body>"`), hex; the relay refuses a signature more than 5 minutes off (401), a body over 256 bytes (413) or
  a bad notice (400), and answers 204 with `X-Island-Heard: <sockets>` (`relay/src/notify.ts`). The secret never
  travels and no key is in a URL or a log.
- **Relay → phones:** the room sends `changed {what, who, at, rev, t}` to every authenticated socket, the writer's
  too (a Shortcut upload reaches its own phone), the guest's only of what it may see ([The guest](#the-guest)). Only
  the last mark is kept (the welcomes' `rec`).
- **The nudge:** after the queue gets an ack, the phone sends `saved {}` over its socket; the room relays it to the
  partner like any intent (only when they are there). It stops (sent and heeded) once a `changed` has reached the
  phone this session (with the record, at once).
- **Client** (`store/live.ts`, the one socket `sync/live.ts liveRelay()`, opened when the backend starts and
  reconnected on pairing): `onChange` → one `refresh({fresh: true})` 300 ms later (changes arriving together make one),
  skipped when the cache already has it (same `rev`, `at` ≤ `since`) and for my own `event` (its row came back in
  the ack). The CSP's `connect-src` allows the relay's `wss://` origin.
- **Cost** (Free plan, measured by `npm run smoke`): one notify = 1 Worker request + 1 DO request; a nudge = 1/20 of a
  DO request. Budget for two phones: [Request budget](#request-budget).
- **Measured** (from a Mac in Tokyo, test relay): notify POST → `changed` on both phones median 53–70 ms (max 92);
  the nudge one way median 19 ms; the relay's `health` ~20–50 ms.

### Request budget

Free plan limits (developers.cloudflare.com, 2026-11): Workers 100,000 requests/day; Durable Objects 100,000
requests/day (a WebSocket connect is one, incoming messages count 20:1, outgoing free), 13,000 GB-s/day of duration
(an idle hibernatable object is not billed), 5 M rows read and 100,000 rows written/day, 5 GB storage; KV 1,000
writes/day (unused). A generous day for two phones:

| Source | Count/day | Worker req | DO req | DO GB-s | Rows read | Rows written |
|---|---|---|---|---|---|---|
| Sockets (each show of the app) | 2 × 60 | 120 | 120 | ~150 (10 s awake each, 128 MB) | | |
| Liveness (a quiet socket every 20 s while shown, 2 × 2 h): the heartbeat, answered by the runtime without waking the room (2026-11-05), and a timed ping for the clock every 5 minutes | 720 (672 heartbeats, 48 pings) | 0 | ≤ 36 | ~60 (the pings; ~900 when every probe was a ping) | | |
| Intents kept for the day (the room's ring), nudges | ~2,000 | 0 | 100 | ~100 | | ~2,000 |
| Record reads: snapshots (opens not current, pushes, taps; ~5 rows each; a full one is the whole compacted record: ~13k rows a year, below) | ~300 | 300 | 300 | ~30 | ~3,000 (+ ~13k per full fetch) | |
| Record writes: `events` batches (~100 events) and their notice to the room | ~100 | 100 | 200 | ~10 | ~1,000 (ids, slots, decor) | ~1,000 (a row, its id, its indexes, `last_at`) |
| Shortcut ingests (2 phones, ~24 runs each; ≤ ~260 latest rows read for 32 days) | ~50 | 50 | 100 | ~5 | ~15,000 | ~1,500 |
| The record's compaction (the cron's 04:15 run; a Wednesday's drops the week that locked, ~2,000 rows; the other days' nothing) | 1 | 0 | 1 | ~1 | ~2,000 (that week's dates) | ~8,000 on a Wednesday, else ~0 (not in the total) |
| The real weather (the same cron: the room's tick, a fetch at :15 and :45, a `wx` on change) | 96 ticks, ~48 fetches | 0 | 96 | ~10 | | ~48 (one storage key) |
| The log ([observability](ops/observability.md): a `req` RPC each `/api`, the phones' batches, room closes; a row and a cap row each write, the prune 30 days on) | ~600 RPCs, ~60 batches | ~60 | ~700 | ~10 | ~2,000 (queries) | ~2,500 |
| **Total** (Free plan limit) | | **~630 (0.6 % of 100,000)** | **~1,650 (1.7 % of 100,000)** | **~380 (2.9 % of 13,000)** | **~22,000 (0.4 % of 5 M)** | **~7,050 (7 % of 100,000)** |

Measured 2026-11-01 (a UTC day, test traffic included, before the record): Worker 1.8k requests, DO 9.9k (the
smoke and latency runs), 3.7k rows written, 346 rows read, ~25 GB-s. Duration stays the binding limit and under a
tenth of it even with the island's presence ten times busier. **Snapshot size** (measured 2026-11-05, the relay review, for a year of
the two phones and the guest): ~97k rows and ~5.9 MB of JSON a year in a full snapshot (metrics:
every Shortcut run appends each changed value of its 32 days; events: tallies, island days, decor and layout ops, the
meal log's ~300-byte rows), not the ~750 rows / ~1 MB once budgeted. A full fetch (a new epoch, a new phone, a dropped
cache) was the whole record in one reply and one DO request (~97k rows read, ~2 % of the day's 5 M); polls stay small.
**Since 2026-11-05 the record compacts itself** ([The record](#the-record) "Compaction") **and pages its snapshot**
([API](#api); the phones fetch 4,000 rows a page and apply the pages together: [Snapshot cache](#snapshot-cache)). A synthetic year (`relay/test/compact.test.ts`: both phones' Shortcut every waking hour, A's weight, the
meal log of three, a tally a person a day; fewer metrics rows than the review's 32-day re-sends): a cold fetch before
49,215 rows (39,425 metrics, 9,790 events), 5.16 MB, 49,216 rows read; after compaction 13,168 rows (3,378 metrics),
2.97 MB, 13,169 rows read, in 4 pages of ≤ 4,000 rows (the meal log's rows are most of what's left). The first
compaction of a year's backlog takes ~7 daily runs (5,000 deletes each, ~20,000 rows written of the day's 100,000); a
week's new rows after that are ~2,000 (~8,000 rows written, once a week). Storage against 5 GB is no concern.

## Notifications

None ([decisions](decisions.md#no-notifications-2026-11-02); `e2e/no-notify.spec.ts`: nothing asks, subscribes or
calls `/push`). The app's unsubscribing of an old Web Push subscription and the relay's 410 for an old build's `/push/*`
went on 2026-11-05, once both phones ran builds from after (their `/push/*` would now 404).

## Service worker

`app/src/service-worker/` (pure rules in `caches.ts`).

- **Registration:** by the app, not Kit (`kit.serviceWorker.register = false`; `lib/ui-state/swLate.ts`): once the 3D
  island has its models in (Island3D's `loaded()`) or can't draw; off the island (another route, /pair, the error and
  not-set-up screens) 2 s after the window's load; on the island 30 s after the start at the latest. Kit registered it on
  the window's load, so a first visit's precache (2.9 MB) loaded alongside three.js and the island's models. A phone
  the worker already controls is unaffected (the browser checks for a new worker on each navigation itself).
- **Install:** precaches built JS/CSS and static files except the rarer font slices, audio, the art manifest, the app
  icons, villager art beyond the two defaults, the critters', finds' and presents' art (all cached on first use), the
  guides' photos, MapLibre and ききみみ's parts (Offline, below). The hashed chunks (an older shell's copy where it has
  one, else fetched) are all or nothing (`addAll`): one not fetched fails the install, and the page asks again later.
  The static files (~65: the art, the manifest, the trails' tracks) by content hash (`caches.ts installStatics`; the
  worker's manifest carries each file's, `vite.config.ts swPrecacheOnly`): one an older shell recorded at the same
  hash (its `__static-hashes`: the hashes of the bytes it stored) is copied, the rest fetched with `cache: 'no-cache'`
  (past the HTTP cache), each on its own: one that fails is served from the previous shell or the network and doesn't
  fail the install. The shell is fetched with `no-cache` too.
- **Its cost** (`npm run sw:measure -- <buildA> <buildB>`: two builds, B a deploy of A, served as Pages serves them over
  10 Mbps / 70 ms; WebKit as an iPhone 15, Chromium at 4× CPU; 2026-11-07): a first visit's island `loaded()` in WebKit
  12.2 s → 4.5 s once the worker waited for it (Chromium's load event already came after the island: 4.6 s, unchanged);
  an app open right after a deploy, the install 102 requests / 1.5 MB → 38 / 0.85 MB in WebKit (it fetched every static
  file whole), 104 (66 revalidations) → 40 in Chromium, the new worker in 1.4 s sooner. Chromium installs the same
  worker a second time when the post-deploy reload starts (a claim after it; seen only with the worker registered
  after the load, e2e/sw-update.spec takes the first). The worker's script carries only the
  precached paths (`vite.config.ts swPrecacheOnly` filters Kit's `$app/manifest` lists by `caches.ts precachable` at
  build time): 22 KB (6 KB gzipped), from 565 KB (56 KB) listing all ~11,700 files of the build.
- **Activate:** keeps the current shell (`island-shell-<version>`), the previous one (an old page loads its lazy chunks
  from it) and the runtime caches; deletes the rest.
- **Navigations:** stale-while-revalidate: this version's cached shell at once (installed with its chunks, so the HTML
  always matches them; the install keeps the shell only if it is its own build's, `caches.ts isShellOf`: the version
  Kit writes into the bootstrap). The revalidation is the worker's: the browser checks for a new worker on each
  navigation, and every deploy changes it. No shell of this version yet (a first visit, offline at install): network
  first, an older version's shell offline or after 3 s; the response becomes this version's shell only if it has none
  and it is this build's HTML, so an old worker never stores a newer build's.
- **Updates:** Kit's `_app/version.json` check (on focus and on coming back to the front) sets `updated`; the layout
  then waits for the new build's worker (`ui-state/reload.ts newWorker`: `registration.update()`, the new worker
  installs, skips waiting and claims the page, `controllerchange`, however long its install takes) and reloads once
  nothing is open, so the reload is served the new build's shell. Never on a timer: it waited at most 15 s and then
  reloaded anyway, into the old build's cached shell (a wasted reload on every resume while an install was slow or
  failing). An install that fails (the worker redundant) or an update not fetched (offline) reloads nothing; the next
  time the app comes to the front asks again. A stale chunk's reload waits the same way. `e2e/sw-update.spec.ts`
  (Chromium; `scripts/serve-build.ts /__e2e/deploy` stands in for a deploy): the cached shell at once, a deploy's
  reload after its worker is in, an install that fails (no reload; the next resume installs and reloads), a slow one
  (20 s: no reload before it's in) and a static file that 404s (the install still whole).
- **Notifications:** none (no `push` or `notificationclick` handler: [decisions](decisions.md#no-notifications-2026-11-02)).
- **Room cache** (`island-room-v1`: the tent's, the museum's and the 3D island's models, the players' parts, the
  villagers' models; cache-first on first use, outliving builds): bounded (`caches.ts roomEvict`). Its index (each
  URL's bytes and last use) is kept in the cache itself (`__room-index`), 2 s after a change. A file's older versions
  (the same path under another `?v=`, used less recently: a re-converted model, never asked for again) go at once;
  then, while the rest is over 40 MB, the least recently used, never one used within 3 days (what the island, the tent
  and the museum show now). It grew without end (the players' parts alone ~30 MB, the villagers' models ~29 MB): with
  the shell and the record's IndexedDB under one origin, WebKit may evict all of it at once. A cache from before the
  index is counted whole once (each file used now, in the cache's order); a file put as the worker was stopped is
  counted the next time it starts.
- **Listen cache** (`island-listen-v1`: ききみみ's audio packs, `/audio/listen/<pack>.<hash>.pak`, docs/kikimimi.md
  "Audio"): cache first on first use, never revalidated (the hash is in the name), outliving builds; the room's
  bounded-by-bytes code (`boundedCache` in the worker: an index of each pack's bytes and last use in the cache), with
  `listenEvict`: a pack's older version (another hash) once unused for 10 minutes, then the least recently used past
  30 MB, never a pack used in the last 10 minutes (a game in progress). Range requests pass through. The packs are
  ~110 MiB in all on Pages today (docs/kikimimi.md "Audio"); moving them to R2 behind a same-origin `PACK_BASE` (W2-R)
  is pending the user's R2 step and changes nothing here (same origin, same cache).
- **STT cache** (`island-stt-v1`: ききみみ's recogniser, docs/kikimimi-mic.md §3.6): the whisper model and its ONNX
  runtime under `/stt/` (~70 MB) and the worker that runs them (`_app/immutable/workers/stt.<hash>.js`, named by
  `vite.config.ts stt-names`). Never precached: the page fills the cache itself after the mic opt-in (`lib/mic/models.ts
  ensureStt`, the parts assembled and checked); the worker serves `/stt/` from it first and never stores, so a phone
  that never opted in holds 0 bytes of it and a deploy never refetches it.
- **Offline** (phase A, 2026-11-07, decisions.md): what a phone has shown once reads offline; nothing is prefetched.
  - *Precached* (~1 MB of the 2.9 MB precache, `scripts/load-budget.ts` ≤ 3 MB): the Zen Maru Gothic slices holding
    ~99% of the app's own characters, both weights, and Fredoka's Latin (`caches.ts PRECACHED_FONT_SLICES`, 0.7 MB;
    the rest on first use, `island-fonts-v1`), each trip's cover and hero and the ten trail tracks (0.26 MB).
  - *Photos* (`island-photos-v1`: every other file under `travel/` and `hiking/`, ~3.4 MB in all): kept on first view,
    stale-while-revalidate (`caches.ts swrFetch`: the copy at once, refetched in the background once a day old; the
    copy stamped with when it was stored, `x-island-stored`), bounded at 20 MB, least recently used out. A photo that
    can't load is the paper placeholder (`ui/photoFallback.ts`).
  - *MapLibre* (its chunk, worker and CSS and the two engines, ~480 KB on the wire): into this version's shell the first
    time a map draws; each install copies the unchanged files from an older shell and fetches the changed ones, once
    a map has drawn on the phone. Offline the maps import it only if a shell holds it (`travel/map/cached.ts`: Safari
    keeps a failed import for the page's life). The worker's manifest lists these carried files though it doesn't
    precache them (`caches.ts carried`, `vite.config.ts swPrecacheOnly`; before 2026-11-07 it filtered them out, so no
    install carried MapLibre).
  - *ききみみ's parts* (each `levels/parts/<part>.json`'s chunk, `kiki-<part>.<hash>.js`: `vite.config.ts
    kiki-part-names`; 77 parts today (levels, ladders, units, story chapters, listening files); taking the 53 of
    2026-11-07, ~0.69 MB on the wire, out of the precache took it 3.57 → 2.88 MB): kept out of
    the precache, since a game's text is of no use offline without its audio packs (Listen cache, on first use too).
    Into this version's shell the first time a game loads one; each install copies the unchanged and fetches a changed
    part whose name an older shell holds (`caches.ts carryPlan`). Offline, `pool.ts` imports only a part a shell holds
    (Safari's failed import, as above); a game never played says オフラインです (`chunkQueue.ts`). ききみみ's code (the
    sheet, its pages, the lanes) stays precached.
  - *Tiles* (`island-tiles-v1`): the tiles a map drew (OpenFreeMap, `basemap.nationalmap.gov`,
    `cyberjapandata.gsi.go.jp`; all send `Access-Control-Allow-Origin: *`, so no opaque answer is ever kept: one would
    cost quota unread), stale-while-revalidate past 14 days, bounded at 60 MB, least recently used out (`bytesEvict`,
    the room's `boundedCache` index, `__tile-index`). OpenFreeMap's are keyed without the week's build in their path
    (`tileKey`), so last week's tile answers under this week's TileJSON. They are fetched by the page, not MapLibre's
    worker (`travel/map/tiles.ts`: WebKit's service worker doesn't see that worker's fetches). One function serves a
    tile (`index.ts serveTile`), the saved areas first (below). The TileJSON (`island-map-meta-v1`): the copy
    within an hour, else the network within 2.5 s, else the copy.
  - *Saved areas* (phase B, the user 2026-11-07; nothing downloads unasked): 「オフライン用に保存」 on a trip's map and a
    trail's (design.md "Offline maps"). `lib/offline/plan.ts` (pure): a trip's or a trail's tiles and MB, by measured
    means per source and zoom (`npm run offline:measure -- --full`: every tile once, ~5 min, never in CI) times the
    area's density (a city's vector tiles weigh ~6× a coast's); within ±20 % of the measured bytes (plan.test). The
    page fetches them (`lib/offline/save.ts`: one path, as WebKit's worker never sees MapLibre's worker): OpenFreeMap 4
    at a time, USGS and GSI 2 with 150 ms after each; header `x-island-save`, which the worker answers from the network
    (a raster tile's seen copy first) and never stores among the seen tiles, dropping the header (OpenFreeMap answers a
    preflight 405, so no `X-Client` header can be sent: the app is known by its Referer; email them before wider use).
    Into `island-offline-<id>` (`trip-nz`, `trail-lake-22`) under the tile keys, with the TileJSON and a manifest
    `{id, source, tileVersion, tiles, stored, empty, bytes, done, at}`. Resumable (stored tiles skipped); a failed
    tile asked again over 3 more passes, then `done: false` (「一部のみ」); a 404/204 is none there. An OpenFreeMap area
    keeps its week's build; a save at another build starts it again whole (更新, offered past 30 days: never two builds
    in one area). Before it starts: online, ≤ 3,000 tiles and ≤ 50 MB an area, all areas ≤ 150 MB (`TOTAL_CAP_BYTES`),
    `storage.estimate()` free ≥ 1.2× the plan; the first save asks `storage.persist()`.
    `localStorage island.offlineAreas` mirrors the manifests, so an area Safari evicted shows 「消えました」.
    `serveTile` asks the saved areas first (never revalidated), then the seen tiles; offline, a tile in neither isn't
    asked of the network. Offline with no TileJSON kept, an area's copy answers. `activate` never deletes an
    `island-offline-*` cache (`caches.ts isSavedArea`) and the 60 MB bound indexes only `island-tiles-v1`.
    `e2e/offline.spec.ts`: a trail saved on fixture tiles, its cache and its trash pill's 削除; drawn (@render), offline
    from the area alone, no tile asked of the network.
  - *Storage kept:* the installed app asks `navigator.storage.persist()` once, after its first sync that worked
    (`sync/persist.ts`), and logs `storage.persist` (granted, already, MB used and quota).
  - *The sync pill* offline counts the taps waiting to go (`sync/queue.ts`); its label says when the record last came.
  - `e2e/offline.spec.ts` (Chromium, the worker on): a visit, then offline: the hero, a photo seen, a trail's track and
    chart, a photo never seen as the placeholder; drawn (@render), a map drawn online drawn offline with no tile asked;
    ききみみ: no part at install, a game played online played offline, one never played says オフラインです.
- **Runtime:** fonts, villager, critter, find and present art cache-first on first use (a precached font slice from
  the shell); audio (`island-audio-v1`)
  cache-first and never revalidated: every audio URL carries its file's content hash (`?v=`, `lib/sound/manifest.ts`;
  `/audio/*` is served immutable, `scripts/headers.ts`), so a re-cut file is a new URL. An LRU per class keeps the 3
  most recent music files (the hours, the event music, the rooms), K.K.'s 2 (a run of songs never pushes the hours
  out) and 8 of the rest (effects, beds: an old version ages out; a loose ききみみ clip from before the packs with them); a hit is re-put only when it isn't its class's
  newest. Range requests pass through. The food data (`/food/*.json`, `island-food-v1`) cache-first by its `?v=<index.version>`, stored after it answers; `index.json` from the network within 2.5 s, else (or offline) its cached copy. A newer `index.json` waits beside the cached one until every file it names is cached; only then does it replace it and the older version's files go, so going offline mid-update leaves the last whole version, never a mix. Other GETs: this version's cache, the previous one, then the
  network. The relay is cross-origin and always live.

## Tests

`relay/test/store.test.ts`, `store-route.test.ts` and `ingest-golden.test.ts` (the record on node:sqlite);
`relay/test/parse.test.ts`; queue (`queue-batch.test.ts`: the record's batches), cache, sync and store tests; the golden fixtures (`GOLDEN_UPDATE=1` to regenerate) and
`npm run bench` for the model at year-3 volume.
