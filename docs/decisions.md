# Decisions

The decisions in force, each with its reason. The numbers live in `app/src/lib/config/rules.ts`; if this file and the
code disagree, the code wins.

## Data and backend

### The record on the relay
The data of record (metrics, events, the ingest audit) lives in a second Durable Object on the relay, `IslandStore`,
in SQLite tables with keys and indexes: an event id is a primary key, `since` an index, and a tally, an island day, a
cosmetic pref, a day's goal or a decoration a slot its later event replaces (the sheet deleted and appended). It runs
on the Workers Free plan next to the island room, its own class so the two change apart. The API stayed the web app's
(`{key, action}`), so the app and the Shortcuts only changed the URL, and the parser and shape rules are the script's
own code (a golden test holds the record's ingest to what the script answered and wrote). Why: every keyed Apps Script
request took the script lock and 1–15 s (an empty poll once 14.5 s, a full snapshot 4–8 s), the platform's floor alone
is 1–4.7 s, a high-five cost two locked requests, and nobody edits the sheet by hand. On the relay a full snapshot
takes ~0.1 s and an empty poll ~0.06 s, at about 1 % of the Free plan's daily requests and rows, with point-in-time
recovery for 30 days. The move (2026-11-02) went in reversible steps (mirror, reads, writes, Shortcuts, export), the
old path working through each, because the two phones update a day apart; the model's numbers from the sheet and the
record were checked equal first. Not done: high-fives (relay-only now) and superseded cosmetic prefs were not carried
over; duplicate finds stay (the ずかん reads the first); an edge cache of the snapshot (the record already answers in
~60 ms from Tokyo's edge).

### Sheet export removed (2026-11-05)
The record is no longer copied to a Google Sheet: the relay's export cron and its signing, the Apps Script web app's
code (`app/gas/`, `app/apps-script/`, clasp) and its docs are gone. Why: the user ("get rid of the Google Sheets
export"); nobody read the sheet once the record moved to the relay, it was a second copy of every row (health data
included) in another account, the largest reader of the relay's rows (a dump every change), and an anonymous web app
signed with a secret from both keys, on the way to making the repo private. The backups are point-in-time recovery
(30 days) and `node scripts/record.ts dump` (runbook §7). The sheet and the script's deployment were left in the
Google account for the user to delete. (Before: the sheet was a one-way export, rewritten from the record within 15
minutes of a change and nightly, its web app taking only that export, signed in the body.)

### Logging and observability (2026-11-05)
The user: "a robust, reliable logging system ... used for future investigations". Designed with a client engineer, a
relay engineer, an SRE and a privacy reviewer, each challenging the draft; what was decided
([observability](ops/observability.md)):
- **Its own Durable Object** (`IslandLog`), not the record's SQLite: a restore of the record would roll back the logs
  of the very incident, and the dump would carry them. Not Analytics Engine (free, but its SQL API needs an account
  token on every reader and in CI) nor Logpush (paid). Workers Logs stays for the relay's console lines (3 days), with
  invocation logs off: they hold each request's IP, headers and place.
- **One table keyed by the receipt time** (ms × 1000 + a counter), no index: on the Free plan each index row is a row
  written and a delete is one too, so an index would double the log's cost; a time range is a range of the key.
- **Caps that bound the account, not just the log:** per UTC day and role in a `caps` table written once a write
  (counters only in memory would reset when the object is evicted), 8,000 events in all (rows written are the
  account's: a runaway log must never stop the record's writes); `/log` checks the key in the Worker before any
  object request, and a capped role is answered there until midnight.
- **An allow-list registry, enforced by the relay:** each event's fields and their kinds (bounded numbers, closed
  sets, tokens that can't hold 16 letters and digits in a row); a JS error's message scrubbed (URLs, fragments, ids,
  quoted text, non-ASCII, numbers) the same on both sides, idempotent. Never the record's `detail` or an ingest's
  warnings (they name values): a refusal is logged as its rule (`buy.pocket_short`).
- **The phone never drops an error first:** a ring that evicts by level and keeps the trail before an error; persisted
  (≤ 24 KB, the log goes first when storage is full) and sent with `keepalive` when hidden; a batch stays until the
  relay acks its id. Off in the demo and under automation (`?log=on` for the e2e).
- **`req` from the Worker:** the wall time of the record's answer, sent by RPC in `waitUntil` (about 1 % of the
  Free plan's object requests); the record returns a meta beside its reply. An object still on the old code is asked
  the plain way (the first deploy without that gave ~25 s of `unavailable`).
- **Who reads it:** only the signed admin ops (the operator); no phone, the guest's events included. Retention 30
  days (the same rows a day as 14; storage is nothing), a purge op for sooner.
- **The alert:** `health.yml` every 6 h reads counts from `/health/log` behind its own token (public `/health` would
  tell when the phones are in use), one `alert` issue with counts only (the repo is public).
- The record's old `telemetry` (anonymous errors and frames) is superseded: acknowledged, not kept, its table dropped
  (its messages weren't scrubbed).

### Per-person keys
Two keys, `KEY_A` and `KEY_B`, as Worker secrets (the guest's `KEY_C` too); a key identifies the person. It travels in the POST body, never the URL; requests are `text/plain` (no CORS preflight). A
phone pairs with a `#key=…` link or by typing the key. Why: no accounts for two people.

### Append-only, computed on read
The record holds raw rows only (`metrics`, `events`, `uploads`). The server stamps each row with its own `at` and
checks shapes; the app computes everything else (ベル, locks, the wallet) on read. Why: no ledger, no scheduler, the
rules in one place.

### Local-first sync
The app paints from a local snapshot (IndexedDB: a small meta record written each refresh, the rows only when they
change) and polls for rows newer than the last `at` it has (`since`); taps are optimistic and queue until acked, the
queue going in one batch whose reply carries each stored row, which goes into the cache at once; the cached rows are
reduced once per row set and the queue folded over a copy. On opening it skips the fetch when the relay's welcome says
it already has the record's last change. A changed `rev` (a rebuilt record) drops the cache. Why: a tap must never
wait for the network, and an unchanged phone shouldn't fetch at all.

### The record serves only what the app reads
`snapshot` sends only rows of a known metric or event type and person, and the record accepts nothing else. Why: the
app never needs code for rows it doesn't produce.

### Live relay on Cloudflare
While both phones have the app open, each sees the other's villager act at once: a Worker with a SQLite-backed
Durable Object (the island room, `relay/`) on the Workers Free plan relays small intents (where I tapped and what I
did, never positions) between the two, over a WebSocket opened only while the app is visible and authenticated with
the person key. The room is presence and the day's shared world; the record is its own object (above), so a room
outage loses liveness, never data. Why: the Free plan needs no payment method, the Hibernation API makes idle sockets
free, and the edge is in Tokyo (~20 ms one way). Firebase RTDB (Spark) was the fallback.

### Relay versions side by side
The relay speaks every protocol version in `LIVE_VS` at once (1 and 2): each socket keeps its hello's version, the
relay's messages and the shared intents reach every phone in its own, and a walk passes only between phones of the
same version. Any other version, or a switch mid-socket, is closed 4004 with a reason, so the phone parks until a
reload. Why: the two phones update at different times (a service worker update waits for the next open), so a hard
switch would cut presence and the push for whichever updates last, and a stage point can't be mapped to the world.
The order is fixed: deploy the relay with the new version first, then the app; drop the old one once both run it.
Done for v1 and v2 on 2026-11-05: the relay logged every welcomed hello's version and build (`ws.hello`), A's and
B's phones (and the guest, which only ever spoke v3) all said v3 on that day's builds, so `LIVE_VS` is `[3]`, and the
shims went with them (the per-socket version, the version-split walks, the guest's v3 gate, the non-batch replay, the
old held high-five format, five dead world ops, `emote`).

### Push through the relay
When the record changes, it tells the room (`{what, who, at, rev}`), which tells the open phones to fetch now, and
keeps the last one for each phone's next `welcome`. A signed `/notify` still takes the same notice from a server: the
secret is derived from both person keys, so only the two servers can sign and nothing new is provisioned. Polling
stays, so the push only adds immediacy. Why: a partner's steps, goals and buys show within a second instead of at the
next open, and a phone that is already current skips its fetch. Not done: an edge copy of the snapshot (see above).

### Shortcut health sync
Each iPhone runs one built-in Shortcut posting daily totals (`steps` and `steps_watch`, `exercise_minutes`, `calories`,
`stand_minutes`, `weight`), triggered when an everyday app opens (Health can't be read while locked). Latest wins: any
changed value is appended. Why: no third-party app and nothing manual; Health is the truth, up or down.

### No manual input
The app asks nothing day to day and never enters health data. Why: the daily loop needs no taps, and a second source
would conflict with Health. (The meal log is the one exception: below.)

### No privacy rules
Everything is visible to both people. Why: two people, one game. (The guest is the one exception: below.)

### A guest, not a third member (2026-11-02)
A third person plays as a visitor ([backend](backend.md#the-guest)): its own key (`KEY_C`, who `G`), its own villager
and name, catching for the shared ずかん (credited to it), high-fives, phrases and the tent's decorating; it sees the
members' activity, ベル, trees and きろく, never their bodies (weight, body fat, BMI, lean mass, the weight goal), and
writes nothing of the economy (no ingest, buy, void, harvest, goal or island decoration). The server enforces it: the
record leaves the からだ rows out of the guest's every snapshot and refuses its other writes `forbidden`, the room
refuses its other intents. Why: the user ("more of a guest… they don't contribute to the bells… can't view [body]
data… can modify the tent room"); a third member would have meant N people through the whole economy (the trees, the
week's ベル, ふたりでぜんぶ, the goals), and a privacy rule only the UI kept would leak through the cache. The protocol
went to v3 beside v2 (relay first), so a phone not yet updated plays on without hearing of the guest. Not done: more
than one guest. (Its villager joined the island's life on 2026-11-06.)

### The guest plays the island as a member does (2026-11-06)
(Amends *A guest, not a third member*.) Nothing on the island is the members' alone: the guest arranges the outdoors
(もようがえ on the phone and しまの エディター: objects, terrain, a reset), places and moves the island's decorations, keeps
its part of the island's day in the record (`island`: what it picked up and put down, its shakes, the flowers it
watered, its wishes), waters flowers, wishes on stars and wakes a sleeping visitor (`world` ops), sets the island's
weather (`pref weatherMode`), takes any note off the board, and sees the members' ききみみ summaries as they see its
own (and each other's): `{d, g, n, ms}` and a unit's stamp, never the answers. Each home stays its owner's (its look
and its room, the tent's room all three's), for everyone alike. What stays the members': the からだ figures (weight,
body fat, BMI, lean mass and their goals: never in the guest's snapshot, the record enforces it) and their profiles
(sex, birth date, BMI standard); and, until the user decides, the economy and the real-world records: ベル spent on
ごほうび (`spend`, `spend_void`), the harvest, the members' goals, a trip's notes, the wedding board, the Health
ingest and its audit. Why: the user ("nothing on the main island should be members only, all players + guests
should be treated equally; the only thing the guest can't see is the からだ information"). The record's and the room's
rules changed first (`guestMayWrite`, `scopeMayWrite` / `scopeMaySend`, `boardMayWrite`, `listenSeen`;
`guestMaySend` is gone: the room takes from the guest what it takes from anyone), the relay deployed before the
phones offered it.

### The guest's villager in the island's life; the rest stays the members' (2026-11-06)
(Amends *A guest, not a third member* and *The guest plays the island as a member does*.) The user went through what
was left members-only. Kept the members' by the user's choice (2026-11-06): ごほうび's buy and erase, the weekly
harvest, the members' activity and food goals and their profiles, the Health ingest and the uploads audit, a trip's
notes, editing others' packing items, and the wedding board. Included: the guest's villager joins the island's life
while its app is open, as a member's villager with the island open: ambient life's small moves, chats and dances
(`ambient.ts`: a slot's turn a third each, a pair with any two, the same on every phone from the relay's presence),
ふたりでぜんぶ's walk to the middle and high-five, the dusk meet-up beside the bench, group stretching, and on its own
phone a member's villager following it. Still none of its own outings (its person may tap it any moment), and it
shows only while its app is open. No relay or contract change: each phone decides from the presence it already has.

### No notifications (2026-11-02)
(Replaces *One notification: the partner met every goal*.) The app sends no notification of any kind: せってい's つうち
switch, the Web Push subscription, the service worker's `push` and `notificationclick`, the relay's `/push/*` routes,
its subscriptions and the VAPID key are gone. In-app banners (undo, a failed save) and the relay's record-change notice
to open phones (not Web Push) stay. Why (the user's): nobody used it, and it was the app's one piece of iOS-only,
hard-to-test machinery. The removal went in the side-by-side order: the app first (a phone that had it on lets its
subscription go on its next open, `sync/pushGone.ts`, and forgets `island.push` / `island.goalSent`), then the relay
(`/push/*` answers 410 to an old build, so it fails quietly; the room drops its `push_subs` and `push_sent` tables),
then the `VAPID_PRIVATE` secrets. The app's unsubscribing and the relay's 410 went too on 2026-11-05, every phone
having run a later build.

### Profile (2026-11-05)
Each person's sex, birth date and BMI standard are prefs on the record (the user asked for the calculations to account
for them). Private the way the body data is: the record sends a member's only to the two members and the guest's only
to the guest (`contract/guest.ts rowsFor`), so a phone never holds what it may not show. Height is derived from
Health's weight and BMI rather than asked for: the Shortcut sends both, the BMI was computed from Health's own height,
so the derivation is exact to rounding and nothing has to be kept in step. Energy is Mifflin–St Jeor (the most
validated resting equation for adults) plus Apple's Move, Apple's own resting + active model; a person without enough
Move days gets a light activity level. The suggestions are defaults only, never over a set goal: a cut's deficit (15 %)
only while the goal weight is under the latest weigh-in, floored at the resting energy and a sex minimum. The BMI
standard defaults to Asian cut-offs (JASSO, WHO's 23 / 25), right for East Asian bodies; WHO's can be chosen. Ethnicity
itself is not stored: only the standard it suggests.

### Fibre and alcohol (2026-11-05)
The meal log counts 食物繊維 and アルコール (the user approved the food review's proposal). A snapshot gains two optional
keys, `fi` and `al` (g per 100 g; [backend](backend.md#events) `food`), kept only when known: an entry logged before,
or from a source that doesn't say (most products, the city sets), has neither and reads as unknown, never as a false
value. Optional so nothing older changes (every old snapshot is as it was) and the other ways in (quick add, a custom food
left blank) simply lack them; the relay took them first, as with `sv`. kcal stays as each source gives it: MEXT's
energy already holds alcohol's 7 kcal/g. Fibre is MEXT's 食物繊維総量 (and the school lunches' 食物繊維 rows); a day's
fibre is unknown (記録なし on its chart) when none of its entries knows it, else the sum of those that do. Alcohol counts
only drinks: MEXT's アルコール of a 酒 (a dish's みりん or 料理酒 mostly cooks off, and would read as drinking), an unknown
one as none. Goals (the registry): fibre at least, by default the 食事摂取基準 2025's 目標量 by sex and age (men 20 g,
22 from 30 to 64; women 18; needs the profile's sex); alcohol at most, **20 g until set**, for everyone: 厚労省's
「節度ある適度な飲酒」 (健康日本21: about 20 g of pure alcohol a day on average), the one plain national line, a ceiling a
drinker can see against rather than none at all; 健康日本21（第三次）'s risk lines (40 g men, 20 g women) are above or
at it, so the default never reads as permission. A goal set always wins; one cleared is the 20 g again.

### Player avatars: the look as two prefs, いつもの in code (2026-11-05)
A and B are NH human players by default; the villager stays an option (the user). All clothing is free, with no
ownership, so the record's check of a look is its whole check: no inventory to consult. Each person's look is one
`look` pref and their コーデ one whole-list `savedLooks` pref (≤ 20, names ≤ 12): only their owner edits them and a
person has one phone, so a per-コーデ op log (as decor's) would buy nothing. The default look, いつもの, is code, never a
row: it can't be deleted or drift, and no migration was written (no `look` pref means it). Wearing one's own いつもの
sends null, so a retune of the default reaches everyone. The record checks a look whole (`bad_request` otherwise); a
phone reads it part by part, an unknown part as いつもの's, so a newer app's part never breaks an older phone. Part ids
are format-checked per slot until the closet's part table is generated; it plugs in (`usePartTable`) without a schema
change. Details: [backend](backend.md#the-look), `app/design/avatar/customization.md` §4.

### Meal log (2026-11-03)
An exception to *No manual input*: ごはん (the HUD's button between the jar and the dumbbell) is a meal log, typed in by
the person (a food from the shipped data, its grams, the meal and the day), and nothing Health measures is: the
activity and the body stay Apple Health's alone. Each entry is a `food` op in the record ([backend](backend.md#events)),
its own latest op per id like a board note: anyone logs their own, the guest too; only the one who logged it edits or
removes it; a removal is final. The food goes in as a snapshot per 100 g, so a data refresh never rewrites a meal, and
a day's totals are read off the entries. One goal, a daily kcal (`pref kcalGoal`, a goal like the Move goal: either
member sets either's, the guest its own); the protein shown is 1.6 g per kg of the latest weigh-in, the members' only.
It never earns ベル: the economy never imports it (`deps.test.ts`), so typing in a meal can't buy anything. Everyone sees
every meal, the guest included (unlike the body: what was eaten is shared like the activity). Why: the user (a port of
their calorie tracker into the island, everyone able to see the meals). Not done: barcode scanning (the CSP blocks Open
Food Facts and the shards aren't shipped), other goals.

Repeats (いつもの, added the same day): a meal eaten the same way most days is one `food_repeat` (the person's one meal,
its items, weekdays, a first day and an optional last, the days it skips), and its days' items are **computed on read**
(virtual entries, shown and counted like logged ones, future days too: planned), never copied into the record. History
is never rewritten: changing the items or the weekdays ends the repeat today and starts a new one tomorrow; stopping
ends it today; one day done differently is detached (the repeat skips it and that day's items become ordinary entries,
then edited). Why: the user ("i always eat the same thing for breakfast", with a day changed or the habit stopped); a
row per day would fill the record with copies and turn a change of habit into rewriting past days, while a computed
repeat is one row and a past day reads the same forever. Owner-only and latest op per id like an entry; the UI keeps
one live repeat per meal, the record need not.

Recipes (マイレシピ, added the same day): a dish put together from foods, the grams of each and the servings it makes,
is one `food_recipe` (`{id, at, n, sv, it}`), and logging it is **one ordinary `food` entry** of the logger's whose
food is the recipe per 100 g (its totals over its grams; 1人前 its grams over its servings), so nothing about `food`
changed. Recipes are **shared**: everyone, the guest included, sees every recipe and may log anyone's as their own meal;
only its owner edits or removes it (owner-only and latest op per id like an entry), and another's is changed by copying
it to a new recipe of one's own. A logged recipe is a snapshot like any food, so editing or removing the recipe never
changes a meal already eaten. Why: the user ("assemble my own recipes with selected amounts for each ingredient … easy
to register that as a meal item"; shared with all users); a recipe referenced by the entry instead would rewrite past
days on every edit and make each entry depend on another row.

Custom foods (マイ食品, 2026-11-04): a food not in the food data is one `food_custom` (`{id, at, n, u, g?, k, p, fa, c,
s}`: a name, one serving's label and, when known, its grams, and what that serving holds), and logging it is **one
ordinary `food` entry** whose food is the custom food per 100 g (`customSnap`), so, as for recipes, nothing about `food`
changed. Shared like recipes: everyone, the guest included, sees and logs everyone's; only its owner edits or removes
it; another's is copied to a new one of one's own; a logged one is a snapshot, so an edit never changes a meal already
eaten. It is a recipe's ingredient like any food. **A serving with no weight logs as a nominal 100 g**: what one knows of
a bento or a shop's dish is often 「1個 = 650 kcal」, not its grams, so the snapshot carries the serving's own values
with `sv: true` (per-serving limits, 5,000 kcal and 500 g, not a food's 950 and 100 per 100 g: a 1,200 kcal bento must
fit) and the entry's grams are 100 per serving, shown as servings, never grams. A recipe with such an ingredient has no
meaningful grams either, so it logs the same way (`sv`, 1人前 = 100). A serving with grams can't be denser than a food
(≤ 950 kcal, ≤ 100 g of a nutrient per 100 g): refused, so its snapshot is one any `food` entry takes. Why: the user
("create my own food and record its calories for future use in case there's a food not in the existing database");
a nullable weight with a nominal 100 g keeps the entry an ordinary one (grams × per-100 g) instead of a second kind of
entry counted in servings. An app from before `sv` doesn't show such an entry until it updates (accepted).

Two phones of one owner (2026-11-03, after a review): a key can be paired twice (or Safari and the home-screen app),
so a repeat's ops can cross. A skipped day therefore **stays skipped**: the record and the phones keep the union of a
repeat's ops' skipped days within its days (`repeatAccept`), else one phone's detached day plus the other's stop showed
that day's items twice. A change of a repeat is **both or neither**: the new repeat goes first and the old one's end
names it (`nx`), refused unless the record holds it, since the queue drops a refused event and sends the rest (an end
without its successor silently stopped the habit). A food op's `at` may be at most a day past the record's clock (a
clock far ahead would make every later edit stale). Left as a known limit: an edit from a phone that hadn't fetched a
later one is acknowledged as stale and reverts on the next read, without a message (one phone never hits it).

## Economy

### Bells are play money
Small whole numbers, not tied to yen; no transfers. Why: prices the couple chooses, no real money at stake.

### A stamp card
Per person per Tokyo day, +1 ベル per daily goal met (all or nothing, at most 4); がんばり +1 per goal at 1.5× (at most
+2 a day); ふたりでぜんぶ +2 shared when both meet all four. One `RULES` and one `STRETCH`, no versions: earnings are
recomputed from the rows. A typical week ≈ 52 for the pair, at most 98. Why: numbers a child can add up, every goal
counts the same, a big day is worth a little more without making goals optional, and the bonus makes it a team
effort. Shown as earned, never mixed: rows show ✓ and the がんばり chip, the ledger adds them up, ふたりでぜんぶ stays
outside both totals.

### Economy start
The first week with an activity row stamped by its lock. Why: no start date in the code, and a baseline of old days
can't earn.

### Four automatic fruits
🍐 Move (active kcal, per-person goal), 🍑 Exercise (60 min), 🍒 Stand (120 min), 🍎 Steps (per-person goal, 8,000 by
default), in Apple's ring
order (けんこう and the tree's popup put steps first). Why: the Watch measures them with no effort; Move follows each
person's own Fitness goal.

### Move and steps goals per person
`pref` `moveGoal` (100–2,000 kcal) and `stepsGoal` (1,000–30,000 in 500s, 8,000 until set), set by either person, apply
from the Tokyo day they are set. Why: Move kcal depend on body size and a day's walking on the person, and the past
must not re-price.

### Goal directions
(2026-11-05, the user: "for every single graph … I want to be able to set a goal"; "for each type of metric, also identify
and store whether the goal should be at least or at most".) One registry (`contract/goals.ts` GOALS) holds every goal:
its pref, range, history and direction, read by the record, the model and both screens. Every chart has one; each is a
pref per person. Directions, shown on the chip and the chart (以上 / 以下 / 前後) and used for met:
- **At least:** 歩数, ムーブ, エクササイズ, スタンド (more movement is the point), 除脂肪体重 (muscle kept or gained),
  たんぱく質 (a lifter's floor).
- **At most:** 体脂肪率 (nobody aims higher), 脂質 (a cap is the usual advice), 塩分 (a doctor's limit is a ceiling).
- **Near a value (前後, a band):** 体重 ±1.5 % and BMI ±4 % (a cut and a bulk both aim at a number; neither side is
  "good", and a lower weight is never rewarded: *Weight never earns*), カロリー ±10 % (a low day is no win and the
  lifter's surplus no fault: the summary's coral stays at 20 % over), 炭水化物 ±15 % (fuel for training, less on a cut).
Why: a chip that says which way reads at a glance, and met shading, goal days, the goal month and ごはん's coral need
it. Not done: flipping a direction per person (a pref per metric and the relay again, for a choice the defaults cover);
revisit if one of us wants a weight floor (a bulk) or a kcal ceiling. **Exercise and Stand:** their goals
(`exerciseGoal`, `standGoal`, per person per day like Move, 60 / 120 until set) are けんこう's lines only: the ベル keep
the fixed 60 / 120 (*Four automatic fruits*), so a goal set low can't buy anything.

### Harvest and week lock
Sunday 19:30 the recap opens (ceremony only); the Wednesday 04:00 after, the week's earnings lock (spends never do).
The lock is internal. Why: late syncs get a grace period, then the past stays put; it also lets the client compact and
memoise locked weeks.

### One wallet, two rewards
Every ベル goes into one shared wallet. Exactly two treats: おやつ 40 and 外食 70 (`SHOP`; 8 and 15 until 2026-11-02, the
user: "Let's change 外食 to 70 and oyatsu to 40"); either person buys, either
person can erase any buy (`spend_void`; the script refuses a void of no buy and acks a second one as a duplicate); an
uncovered buy is ignored on read. Why: one number to watch, two clear choices priced against the week (a typical week,
52, is one おやつ; a perfect one, 70, exactly one 外食: treats to save for, not to buy daily), and mistakes
undone without deleting anything.

### Weight never earns
Shown only, with an optional goal line. Why: paying for kilograms rewards crash diets and punishes muscle.

### The shop's かいがら (2026-11-04)
The shop ([design](design.md#the-shop)) has its own currency, かいがら (shells), never ベル: the island's catches buy
furniture; the week's goals still buy the two treats. Pockets and wallets are per person, the guest's too (the user).
- **The pocket is derived, no write per catch:** a person's pocket of a species is what their day tallies caught of it
  (`tally`: one row per person and day, latest wins, its counts only ever growing: [backend](backend.md#tally)) less what
  they sold (`sell`). Sound because the record already keeps exactly those rows and a day's count never drops (each send
  starts from the day's latest row). Its limits: a catch counts once its tally reaches the record, so the phone's queue
  sends a sell or a buy only after a held tally (one subject, `sync/queue.ts`); a tally past its caps (999 a day, 300
  keys) isn't in the pocket; two phones of one person racing on one day's tally could lower it, and then the pocket reads
  no lower than empty and the record refuses that species until it's caught again. Selling never takes anything out of
  the ずかん or the museum (they read `find` and the tallies, which a sell never touches).
- **Anything collectible sells (2026-11-04, the user: "basically anything collectible should be tracked and sellable",
  fossils too):** the pocket's kinds are one table (`contract/pocket.ts`): the critters, the ずかん's shells, fossils
  and star fragments (already in the tallies, so what was found before sells too), and the goods (`goods:<id>`: wood,
  a branch, fruit, weeds, mushrooms, eggs, junk), new tally keys with no ずかん page (a find kind would mean museum and
  ずかん pages for wood). A present's furniture stays もようがえ's. Wood comes from shaking (no axe in the app), three a
  tree a day as NH's axe gives.
- **かいがら = Σ sells − Σ buys**, derived per person; a sell keeps what it fetched (`v`), so a later price list never
  rewrites a past sale. The record refuses a sell past the pocket, a buy past the wallet or of a piece already owned, and
  a price over the list's; the phones fold the same rows by the same function (`contract/shop.ts shopLedger`).
- **The scale: NH's Bells ÷ 20 both ways** (rounded; a sell at least 3 かいがら, a piece at least 1), since 2026-11-04
  (the user: selling should be "fun, not too strict"). NH's own sell : buy ratio, as NH plays: a sea bass (400 Bells)
  20, a 2,000-Bell chair 100 (16 common fish, or one or two rare catches), a shark (15,000) 750. Until then sells were
  ÷ 100 against buys ÷ 20 (5× stingier than NH: the chair was 50 common butterflies), to make the stock last; it made
  saving feel like a chore. A sell keeps the `v` it was kept at, so the rise never reprices a past sale, and the record
  keeps a sell at *most* its list price, so an app from before the rise (its lower list) still sells. The 12 pieces
  over 100,000 Bells (the grand piano, the kimono stand…) stay out of the stock.
- **The stock**: 8 pieces a Tokyo day, drawn by the date alone (FNV-1a of `shop:<date>` seeding mulberry32) from the
  priced pieces, plus three basics always (a cardboard box, a zen cushion, a mini cactus set); every phone and the record
  get the same list with nothing stored. Only pieces the rooms can place (379 with NH models, the starter set aside):
  clothing has nothing to wear it, so a buy is always something for もようがえ. A bought piece joins that person's
  もようがえ for good (their own home's and the tent's), so a piece is bought once.
- **Where it shows:** only the counter (NH's Nook's Cranny, Timmy and Tommy): ごほうび stays the ベル's. The leaf's menu
  had a 「かいがら N」 row into the shop until 2026-11-04; dropped so that one walks to the shop to buy and sell, as in NH.
- **A screen, not a 3D room:** the shop is a counter: picking catches, counts and prices are lists, which NH itself
  draws as 2D menus; a walkable room would add another three.js scene (the phone already runs hot) for nothing a sale
  needs. NH's building on the island is 3D; inside, NH's render of the twins behind a drawn counter.
- **Its placement on the user's island** clears four of their flowers (and the museum's, placed the same way, four
  more): their island has no 7 × 4 spot clear (flower borders down both sides, the main path between), so the one-time
  op takes the nearest spot where only flowers stand, never a tree, a bush, furniture or a path; over a path is the
  last resort. The alternatives were a shop standing over things, or the museum straddling the main path across the
  front lawn and the shop with no spot at all.
- **Its default spot** is in the island's middle behind うめ's home, not on まえ's lawn: the lawn the specs walk on stays
  open, and the specs read open lawn from the page (`e2e/island.ts` `lawnTap`) instead of fixed points (the first
  default, east of the main path at まえ, broke a dozen of them and was reverted).
Why: the user ("currency is かいがら … per person … its own building"); deriving from the tallies costs no request per
catch on the Free plan, and the record checks cover itself (in the Durable Object) because a wallet is per person and
spends can't be voided, unlike the shared ベル wallet's read-time rule.

## Health data

### Health trends (けんこう)
The health popup (the HUD's dumbbell) shows the Health data over time for the personal trainer, one person at a time, computed on read
(`model/health.ts`). As reported, nothing cut off: every day with a row counts whatever its value; 記録なし is only a
day with no row; today is drawn but not counted. Periods by day, week or month so long ranges stay readable; plain
numbers, no trend lines or smoothing (weight's change is first week → last week). No export. Why: a trainer needs
exact, comparable numbers anyone can check against the bars.

### No-watch days
<a id="no-watch-days"></a>A day with Move, Exercise and Stand all 0 (or absent) is read as no data for those three, everywhere
outside the ベル (けんこう's series, bars, averages, goal days; the TDEE's Move): one pure helper, `model/health.ts`
`activityOn`. Steps stay. The stored rows are never rewritten. Why: the Shortcut's Fill Missing sends `0` for a day
Health has no samples; on the live record that was 27 of A's last 28 days and 13 of B's in October, which pinned both
TDEEs at the 1.2 × resting floor and pulled down けんこう's averages (the user, 2026-11-05: "treat as missing"). Partial
wear (Stand 9 with Move 0) stays a real day. The ベル needed no change: a 0 and a missing value earn no fruit alike
(`health.test.ts` checks the earnings are equal). The Shortcut may send empty lines instead
(`ops/shortcut-health-sync.md` §2 step 8d); the app copes either way.

### Low kcal goals: warn, allow
<a id="low-kcal-goals-warn-allow"></a>A kcal goal under the person's resting energy (Mifflin–St Jeor, with a profile)
or the safe floor (1,500 kcal a man, 1,200 a woman or unknown) gets a gentle inline note in the editor and still saves
(the user, 2026-11-05: "warn, allow"). Why: a goal is the person's own call; a hard floor would refuse a supervised
plan, while the note says why it matters (muscle loss, nutrients). The editor's own range still starts at 1,200.

### きろく is earnings only
The ledger shows what was earned, by week; the buys and the balance live on ごほうび (no all-time 「これまでに ためた ベル」
row, 2026-11-02). Why: one home per datum.

## App and hosting

### PWA on Cloudflare Pages (2026-11-05)
A static SvelteKit SPA (adapter-static, at the root of https://island-fund.pages.dev, a Cloudflare Pages project fed by
direct upload from CI after the gate), installed to the home screen, with a strict CSP (the `<meta>` and a header,
`build-pages/_headers`) allowing only our origin and the relay's (and, since 2026-11-06, OpenFreeMap's tiles for the trip map), and nosniff, no-referrer, a Permissions-Policy, no
framing, HSTS. Without a key the site shows only pairing or `?demo`. Why: the pairing key is in localStorage, and on
https://huangwaylon.github.io/fitness the origin was shared with the account's other GitHub Pages sites (any of them
could read it); GitHub Pages can't set headers; Cloudflare's free plan already hosts the relay. The move
(2026-11-05): both URLs served the same build and the relay let both origins in until each phone was paired on the new
one (new keys, runbook §14); then the GitHub Pages site, its deploy and the github.io origin went. The repo stays
public (the user's call; no key or data is in it).

### Offline shell
The service worker precaches the build (not audio, fonts or art beyond the defaults), loads pages network-first with a
3 s fallback and keeps one previous version for a stale page's chunks. Why: the app opens instantly and offline.

### Japanese first
Japanese by default, English per person (`pref` `locale`); strings in `ja.json` / `en.json` (English loaded when first
asked for), with けんこう's and the catch names in their own lazily loaded catalogs. Why: both live in Japan, and the first load stays small.

### Always animated
No reduced-motion variants anywhere. Why: the user's call, and one code path is simpler.

## Content, art and sound

### Scenery is cosmetic and local
Nothing on the island pays or costs ベル. Fruit pick-ups, blooms, wishes, weeds, presents, the visitors' quests and
once-a-day flourishes are per phone in localStorage; seeded content (finds, weather, visitors, showers) derives from
the date so both phones agree without syncing. Only a ずかん `find` is written. Why: the economy stays computed from the
goals on read, and a lost record only replays a flourish.

### Fruit on the tree, wild flowers on the lawn
Each goal's fruit colours in with progress, falls when met and is picked up for the day, and all four make the canopy
glint. The flowers are scenery, not metrics: NH's flowers scattered in small clumps over the lawn, watered for fun.
Why: NH's harvest feel, completion visible after the pick-up; one place for the goals (the trees) keeps the lawn
natural.

### Shaking a tree
A quick run of taps (the third within 1.2 s) shakes; a single tap stays the popup. A nest 1 in 8 (at most one per tree
an hour), its wasps caught or stinging (a fright, a sweat drop and NH's swollen eye, on each render's measured eye). Why: the popup keeps the single tap, and a run is
how people shake a tree in NH.

### Two trees a day hold a present (2026-11-02)
NH's furniture from the trees: each day two of the oaks and cedars (by the date's seed; not the palms, not the goal
trees) hold a piece of the balloon presents' furniture that the tent can place, and their first shake drops it,
wrapped, to open where it lies; never ベル (NH's bag of bells left out). It crosses as a `put` of a `present` by the
tree's id and opens as one, so no contract or relay change: the relay's first put wins, the day row keeps it, and
whatever draws a balloon's present (the DOM island, the 3D island's port) draws it. Why: the user ("when you shake
them, you can occasionally get presents too"); wrapped because our presents are, and the present path brings the
plate, the ずかん, the tent and the sharing with it.

### Mushrooms are cosmetic
November's mushrooms are captions only, no ずかん `find` (since 2026-11-04 they go into the pocket to sell: `goods`). Why: NH's mushrooms are crafting materials with no catalogue
page, and a new find kind needs a redeploy for a seasonal flourish.

### The jar is the door, no ribbon (2026-11-03)
(Amends *The dumbbell beside the ribbon*.) The きょう ribbon is gone from the HUD: the jar sits in the sky's top-left
corner, the dumbbell in its top-right. The jar opens the panel on ごほうび (tabs to きろく and せってい); today's ベル live
under ごほうび's balance as a yuzu pill 「きょう +N ベル」 (「きょう まだ 0 ベル」 before the first) and flash beside the jar
as coins land; the jar's label says them. Why (the user's ask, then the team's picks): NH's island view has a clean sky
with its UI in the corners; one doorway is the NookPhone's way (a long-press is undiscoverable and has no VoiceOver
equivalent, a third button brings the clutter back); today's earnings belong next to the money, and a permanent badge
would read as a notification. The guest sees the members' today, as the ribbon showed it.

### The dumbbell beside the ribbon (2026-11-02)
(Replaces *The jar beside the ribbon*.) The HUD's button on the right of 「きょう +N ベル」 is NH's dumbbell, opening
けんこう in a popup of its own; the panel (the ribbon) has three tabs, きろく · ごほうび · せってい, and opens on きろく
(the tabs superseded by *The jar goes into the leaf, ごほうび is the panel*: the panel is ごほうび alone, ずかん and
せってい the leaf menu's).
The button shows no number; today's new coins fly into the ribbon. In けんこう whose data and the period are two native
dropdowns in one row, かつどう / からだ the row under them. Why (the user's): the health numbers are what we look at
most, so they get the one button; the wallet is spent rarely and reads fine as a tab; two rows of selectors instead of
four leave the charts more of the screen. A native `<select>` is iOS's own picker: accessible, thumb-sized and with
nothing to break on Safari.

### NH events by date rule
Each dated NH event (Halloween, Turkey Day, Toy Day, Bunny Day; no Festivale: its host Pavé has no 3D model) is one rule in `island/events.ts`, and its
host takes the visitor slot. Why: NH's calendar on the island with no new screens and nothing to sync.

### The rest of NH's bugs: what the island can hold
74 of NH's 80 bugs, each where NH keeps it (stump bugs on the trunks, the palm beetles on the palms; the tarantula and
scorpion gentle). Left out: three palm beetles with no icon (the blue weevil, the giraffe stag, the horned hercules),
the dung beetle, the ant and the fly. Why: a bug in the wrong place reads as a mistake.

### Sea creatures by diving
A bubble spot takes a fish shadow's turn 1 in 4; they are their own ずかん page (`find` kind `sea`). Why: NH's diving
without making the sea busier.

### Fresh water by where you cast
The 46 freshwater fish come to the water NH keeps them in: the pond, the river, its mouth on the west beach, the
clifftop above the waterfall (the river's own also at the mouth and the clifftop, as in NH). Why: the world has all
four waters now, and where you fish is half of NH's fishing.

### Balloon presents are NH's shop stock, counted in the ずかん
A present holds one of NH's 1,836 orderable Nook's Cranny and Able Sisters items or, in season, one of the 126 recipes
balloons carry, at NH's odds without Bells or materials; the ずかん has them as カタログ and レシピ and counts every
catch (「×12」) from one `tally` row per person and day, which the script replaces in place of appending. Why: the real
pool and the satisfaction of a growing count, at ~730 small rows a year instead of one per catch.

### The museum is the ずかん's door
A tap is one line from Blathers, then the panel opens on the ずかん. Why: NH's museum, without making the door wait.

### Shooting stars in showers, wishes become fragments
A shower every few minutes on a clear night; a meteor shower night (at most once a week, Celeste's) one every few
seconds; each wish is a fragment the next morning. Why: NH's rhythm, never ベル.

### Birthdays and the wedding from the code
Our birthdays sit in `PEOPLE` (`config/rules.ts`); the wedding date comes from the けっこんしき board's `date` setting
(2026-11-06: one date for the board and the island; `time/holidays.ts` `weddingDate`, 2027-10-08 until the record has
one). The wedding countdown is NH's couple visiting on milestone days. Why: both phones agree, a changed date is
changed once, and an event to find beats a counter.

### Group stretching on an Exercise day
The tape deck comes out on a day either of us met 🍑 Exercise or on a morning opening; a tap makes everyone stretch
once a day. Why: NH's most fitness-like ritual tied to the goal that is exercise, paying nothing.

### Only a tap on empty ground walks my villager
A tap on an interactable (a tree, a pond, a bug, a find, a door, a visitor, the partner) acts in place: my villager
turns to it and the action plays at the target, its tool there (no walk-then-act); a tap on bare ground runs it there
(300 u/s, the camera staying put), where it stays for the day. With the relay, my tap-to-walk replays on the
partner's phone (the destination only; their planner walks it), and their doings play at the target here without
their villager running over. Why: the user ("only move the character if the tapped spot is not an interactable
object… when we click trees, ponds, etc., the character moves there and gets in the way"); every tap keeps its
meaning and nothing waits for a walk. The tent's door is the one exception (2026-11): a tap on it walks my villager up to it first, then
in (the user: "i want it to feel more physical, we have to walk up to it before we enter it"); near the door it goes
straight in, and any other tap on the way ends it.

### Ambient life from the clock
What the island does on its own is a function of the Tokyo date, the 10-second slot and the shared world, with PRNGs
keyed by date, slot and kind, on the relay's clock (`island/ambient.ts`): idle life's beats, the visitor's and the
critters' visits. Why: both phones show the same villager outings, visitor beats and critters with no messages, no
leader and nothing stored, and it costs nothing when one phone is alone. Where a critter shows stays each camera's,
and what a person does by hand stays on their phone. Not done: streaming ambient moves over the relay (a message per
beat and a leader to elect).

### A shared world: the seed for what comes, the relay for what we do
Both phones show the same island. What comes by itself is a function of the date, the 10-second slot and world
coordinates: a critter's water, spot and every move after it came (`island/critterPath.ts`), the day's shells, dig
spots and weeds (as before), each phone showing what its camera sees of it. What a person does is a small intent
(`catch`, `pick`, `put`, `shake`, `world`, `walk`, `act`: ≤ 100 bytes) that the relay keeps for the Tokyo day and
replays to a phone that opens later; both phones fold the day's intents in the relay's order into the same day
(`sync/world-day.ts`), so first wins: of two people tapping the same bug, the relay refuses the second claim and the
other phone sees it caught by them. The record keeps one cheap row per person and day (`island`, replaced like a
tally) for when the relay has nothing. Why: per-camera placement made the phones disagree on where (and so whether)
a critter was, and only the outcome of a person's action has to cross: a seed costs nothing, an intent per action is
far below the Free plan (a busy day ~550 messages, ~28 DO requests), and the relay already orders them, so no leader,
no clock sync beyond the pings, nothing per frame. The room's day is presence-grade (it may be gone); the record's row
is the record. Not done: streaming positions or the interactive moments (a cast's bite, a dive's chase, a tarantula's
mood stay on the phone that taps; their outcome is shared), a rejection message to the losing phone (the winner's own
intent tells it), every event to the record (a day row instead), sharing the balloon's flight.

### One island, each villager its own phone's (2026-11-01)
The two phones show the same island, not mirrored: A (ウェイ) lives on the left and B (うめ) on the right on both,
every shared id by person. Each person's phone is the authority for their own villager: every walk and put of it goes
over the relay as the very walk (`walk {to, from, via, s, ms, f}`, `s` on the relay's clock), and the other phone
plays that walk from the same start at the same time, catching up when late, walking off a small gap, jumping a big
one; while that person has the island open their villager there is the relay's to move (`director setRemote`), so
neither phone's own life (a follow, an outing, a walk home) moves the other's villager. A join, a reconnect and every
5 s of a walk under way say it again. Wakes go the same way (`act wake` with its time: both doze off again at the
same moment); the night's hours are cut on the relay's clock. The room relays before it writes (the output gate cost
~10 ms a kept intent), acks a numbered intent, knows a resend by its number, and replays the day in a few batched
messages, the phone's own included. Why: replaying only a tap's target let each phone plan the way from where it had
the villager, and each phone's own life moved both villagers, so they drifted (and the layout put "me" on the left);
the very walk with one owner is ~100 bytes a move, gives the same point at the same time (0.3 u apart under way in
the two-tab check, the same point at the end, measured 30–45 ms tap → set off on the other phone via the test
relay), and stays far inside the Free plan. Not done: streaming positions per frame (a walk is described whole), a
follow while both are here (left out rather than run on two phones at once), the visitor's beats beyond Gulliver's
waking.

### A villager whose phone is gone walks home, by the relay's clock (2026-11-02)
Superseded 2026-11-04: [A villager stays where it was left](#a-villager-stays-where-it-was-left-2026-11-04).
When a member's phone has been gone from the relay for 3 minutes (`HOME_AFTER_MS`, villagerSync.ts), their villager
walks home to its spot by its own tree (A left, B right) at a stroll, on every other phone; a phone opening later puts
it where that walk has it by now (home when it's over). The walk is a function of three shared things only: when the
room saw that person's last socket close (its clock: the `presence {on: false}`'s `t`, and the welcome's `gone {A, B,
G}` for a phone that wasn't there, mine included), where their last walk of the day ended (the room's day: the
replay), and the island's nav (planTap, as a tap goes). Till it sets off and on the way it stays the relay's
(`setRemote`: no phone's follow, outing or snap moves it); home, it's ambient life's again (its outings, the night's
doze: a villager asleep gets up for the walk and dozes again at home). A return within the 3 minutes cancels it; a
return mid-walk takes it over from where it is: that phone works out the same walk from its welcome and walks the
rest as its own (the other phone sees no jump), and tells nothing of its villager until then (no stale put first).
Gone inside the tent (or a home), it leaves the interior at the same moment and comes out at its door (where its
last island walk ended). The guest's villager isn't part of it (it leaves the island with its app). Why: the user
("after a user is disconnected for long enough… walk the character back to their starting positions next to the
trees"); a few minutes so a dropped connection isn't mistaken for leaving; the relay's clock and the room's last walk
make every phone draw the same walk without a message, and a `gone` in the welcome is additive (an older phone
ignores it). This phone's own socket dropping isn't anyone leaving: it changes nothing until the welcome says.
A welcome's `gone` is acted on once (2026-11-04): the relay's status keeps it for the socket's life, and each new
mount of the island (back from the museum, the shop, a room) took it afresh, walking or putting my villager home
moments after it stepped out of a door. And a phone that knows it was gone long (`store/seen.ts`) opens with its
villager home at once instead of where it was, then home a moment later when the welcome came.
Not done: the partner following mine while theirs is away and home (a per-phone follow, as before).

### A villager stays where it was left (2026-11-04)
The walk home is gone (its code, the welcome's `gone` acted on by the island, `store/seen.ts`, `?homeafter`): a phone
gone for any time (closed, hidden, offline) leaves its villager where its last walk ended, and reopening finds it
there, on every phone. The room carries each person's last walk into each new day (stamped anew, so a phone opening
from midnight asks for it) and never trims it out of its ring; the demo's relay does the same. Only a player never
placed starts at home; the guest's villager still shows only while its app is open. The welcome's `gone` stays: one
gone quiet inside a room leaves it 3 minutes on, back where it went in. And the shop is a place like the museum and
the rooms: while I'm in it the others' islands show me nowhere (`tent {in, sc: 's'}`, additive: an older phone or
relay drops it), out of its door they see me there. Why: the user ("spot persists": a villager walking itself home
read as being moved by someone else; "while I'm inside the shop, the other phones see me gone"). Not done: ambient
outings for a villager left away from home (they start from home, as before, so a villager left out stays put but
for its idle beats).

### Decor is a last-writer-wins map, the record keeps each item's latest op
The island's decorations ([Decorating](design.md#decorating)) are persistent, shared by both of us, either may move
or remove any. Each change is one op carrying the item's whole state (`{id, at, item, x, z, f, p}`) or its removal
(`{id, at, rm}`); the layout is the ops merged by id: a removal beats everything (ids are never reused: an undo puts a
new one down), else the latest `at` on the relay's clock, then B over A (`contract/decor.ts`). The merge is commutative
and idempotent, so it doesn't matter which way an op arrives first (the relay live, its day's replay, the record's
snapshot, my own optimistic copy): both phones and a reload reach the same layout. The relay only carries the ops
(`decor`, kept in the day's ring for a phone opening later that day); the record keeps them across days, and keeps
only each item's latest op (its slot: at most one row per item ever placed), checks the
item, the spot's bounds and the cap of 30. The island refuses a spot that is taken, off the ground, on a tap-critical
spot or that would wall anyone in; a race of two people dropping on one spot at once leaves both standing until one
is moved. Why: the layout lives for months, so a day-scoped fold (the shared world's) doesn't fit, and a whole-layout
row would let two phones overwrite each other's change; per-item last-writer-wins needs no leader, no clock beyond the
pings and no history, and its rows stay as few as the items. Not done: first-wins for two moves of one item (it needs
each op's history, which compaction drops: the later move wins on both phones), drag positions streamed live (only
the confirmed spot crosses).

### Visitors are the director's fourth actor
The visitor moves through the same director, idle life and walk graph as the villagers, with CSS loops for continuous
life. Why: one animation system, and pausing under a sheet or a hidden page already applies.

### K.K. lives on the island, on a piece of the layout (2026-11-05)
K.K. Slider is no longer a Saturday visitor: he sits on his stool, a fixed piece of the layout (`kk-stool`, one to an
island, never deleted, moved and turned in the editor; design.md "K.K. on his stool"), every day; Saturday 18:00–24:00
is his show (no visitor in the plaza then), by day he strums quietly and still plays a song on request, 00:00–06:00 he
dozes. His default spot is free on the record's island too, so no op was needed to place him; were it taken, he'd
stand there flagged in the editor, as the museum and the shop would (no automatic move: the user places pieces
themselves). The tent's music players play his airchecks through the same cut-in (`playKK(id, 'aircheck')`; since 2026-11-06 the room's shared music stage, sound-sync.md). Why: the
user ("I would like to make kkrider a permanent addition to the island - also make him movable/placeable via the
editor"); a resident who played only once a week would be scenery, so he plays on request any time he's awake.

### A villager's phrase is presence (2026-11-02)
A tap on my villager opens a phrase picker (six presets, my own last few, a 20-character field; since 2026-11-03 no
presets: my own last four and the field); the pick shows over my villager on both phones for 4 s through one small
relay intent, `say {text}` (v2), that the room relays live and keeps
nowhere: not in the day's ring, not in a replay, not in the record or the outbox. Its text is cleaned by the same
`cleanSay` on the phone, at the relay and on the receiving phone (controls, newlines, bidi tricks out, ≤ 20 code
points) and rendered as text; the phone sends one per 1.5 s (a newer pick waits, replacing the waiting one), the room
passes one per person per second. Only a v2 phone hears it; an older app's parser drops the unknown kind. Why: the
user ("speech bubble options… pick one to show to everyone for a few seconds, plus one with custom text"); a phrase is
a moment, not a record, so a closed phone missing it is right, and an additive kind needs no version bump (the relay
went first). Not done: a phrase history, reactions to a phrase, phrases while the island is covered.

### A high-five goes over the relay only (2026-11-02)
A tap on the partner's villager sends `highfive {at}` (v2; `at` the tap on the relay's clock, its identity), numbered
like a kept intent (acked, sent again after a reconnect). The room relays it live; with the partner away (or only an
older phone of theirs there) it holds the last one for them (one per recipient, a newer one replacing it, in its
storage), hands it over after the welcome of their next hello, and lets it go when their phone says `got {at}` or a day
has passed. The receiving phone plays the same moment as the tapper's when it's fresh (≤ 8 s: their own villager stops
there and says so, the sparkle from the tapper, hops, hearts), else the banner and R5; a local store of today's heard
ones (`hf-got.<me>`) makes a resend or the held copy no news, and the banner fires on receipt, not on a count. The app
sends no `highfive` event to the record any more (it is no event type; the record still acknowledges one queued on a
phone from before, and stores nothing). Why: the user ("improve the high five with the relay"; then "the count barely
matters": online over the relay, offline one stored touch); through the sheet the partner's phone reacted 1–4 s later
and a row per tap bought nothing, and an intent is ~45 bytes with no leader. Not done: a high-five while the relay is
down (the moment plays here only), a count of the day's high-fives on screen.

### Speech balloons stand by their speaker
One placement rule for every balloon: by the speaker, at most 40px off, loosening what may sit under it (the museum,
the trees, the villagers) before ever standing further off; never over the HUD. Why: a reader must see who speaks;
covering a tree for a few seconds is fine.

### Weather days by the date
Seeded by the date with NH's rules; screen layers moved by transform (the rain and snow since in 3D, below). No umbrellas (the renders have no hand to hold
one). Why: both phones see the same sky with nothing stored.

### Official NH art
Official renders fetched by hand (`npm run assets:fetch`) into `app/static/art/`, never hot-linked; `<OfficialArt>`
falls back to our own drawings. Why: the real look; if a takedown comes, delete the art and the app keeps working.
Personal use only.

### Sound off by default
Music, effects and volume are per device and off until turned on; music is fetched on demand, never precached. Why: an
app opened on a train must never surprise anyone.

### Event music and K.K.'s songs
NH's event tracks replace the hour's on their days; the wasps' chase and K.K.'s songs cut in and hand back. The user's
files, committed like the hours. Why: the island sounds like the game on the days the game is different.

### Procedural ambience
Surf, wind, rain, birds and insects are synthesised in the app; a file in the manifest replaces any bed. Why: no
copyrighted audio and no megabytes for sounds under the music.

### Copy: spaced kana in the world, kanji in the sheets (2026-11-07)
The user: "for everything except the content and menu in the main world, allow the use of kanji for easier reading, be
consistent." The world (the island and its rooms: lines, bubbles, signs, notices, the HUD and the leaf menu's pills)
keeps kids-style spaced kana under `word-break: keep-all`; every sheet, panel, dialog and form is natural adult
Japanese with kanji, one spelling a term, under `word-break: normal; line-break: strict` (docs/design.md "Copy").
Normal breaking is right for unspaced kanji text: keep-all would make a whole sentence one word, and WebKit has no
`auto-phrase`; the trip guides keep their Intl.Segmenter `<wbr>`s. Keys shared by a pill and its sheet split (a sheet's
title may differ: せってい → 設定). Fonts: the new kanji added two Zen Maru slices (148 → 150 @font-face rules, each
loaded only when one of its glyphs shows). Rejected: kanji everywhere (the world's voice is NH's kana), furigana
(clutter at these sizes), a per-person kana toggle (two copies of every sheet string).

## The island world

### The rolling-log world in 2D DOM (superseded: the island in 3D, November 2026)
The island was NH's rolling log: one flat plan (x across, z in) bent over a cylinder by a pure projection (`roll.ts`,
option A of the research, kept by the user's iPhone spike at a locked 60 fps), the camera a native scroller with three
proximity stops (まえ, ひろば, おく), every upright thing a DOM billboard at its feet placed by one projector in one depth
order. Not WebGL (a bundle, context loss, its own tap model and every animation ported) nor CSS 3D (nested preserve-3d
misrenders on iOS). Measured at 4× CPU throttling on the iPhone 13 viewport: fling p95 16.8 ms, worst 33 ms once, no
long tasks, ≤ 83 style writes a frame for ~140 nodes, nothing pending once still. Why: DOM taps, the e2e and every
existing component stay; nothing runs when still.

### The ground is baked raster, the water live (superseded: the layout's ground, built on the phone)
The terrain was painted offline (`scripts/terrain.ts`, since deleted: a WebGL shader in Chrome, noise, soft distance-field edges,
supersampling) into 8 WebP chunks per season (~440 KB a season, 2 px a unit; the back half lazy) and drawn by 40 bands;
only the water's motion (the shore's wash, the waterfall, glints, flow streaks, the pond's ripple) is live CSS, plus a
few upright sprites (the cliff's face, the bridges' fronts). Why: the user rejected the flat vector paths, river,
cliff and fences as "svg-y"; painterly materials (feathered dirt, varied bricks, flagstones, banks, strata) need
textures a live SVG can't afford in 40 bands, and a picture per band costs less to draw than an SVG.

### Buildings are doors; one render family
Resident Services, Nook's Cranny, Able Sisters, the museum, the airport and the campsite are NH's map icons (one
family; the true museum render went); a tap on it (in place) and NH's character answers and its feature opens
(せってい, ごほうび, むらびと, the ずかん, つうしん). The panel keeps its せってい tab and the HUD is unchanged. Why: the user's
call (keep the tab, add the doors); the back of the island gets a reason to visit.

### Wilbur is the only presence cue
Wilbur stands on the dock while the partner's app is open (the relay's presence over the phone's one socket); the
partner's villager replays my tap-to-walks. Why: NH-faithful, and no new UI.


### The scenery is NH's own models, rendered
The campsite, the trees, the bushes, the lamps and the rocks are NH's 3D models (Collada, from the game files the user
supplied) rendered to sprites at the world's view by `scripts/models.ts`, in place of Nookipedia's icons and map icons.
NH's snowy models and the models' emissive light give the winter and night looks that `derive-art.ts` used to paint
onto the icons; each tree's gradient gives its seasons; an oak renders as trunk and canopy layers. Pre-rendered, not
drawn at runtime: the world stays DOM sprites with no WebGL, no runtime cost and the same lazy loading, at ~3 px per
unit (a WebGL layer would add ~145 KB of three.js, megabytes of models and a frame on every scroll, and couldn't
interleave with the DOM sprites' depth order). The model files never enter the repo, only the renders and the tent's converted models (below). Why: the user
asked for the game's own models ("let's use them going forward"), and they read as one family at every season.

### The fixed decor: spots that hold one piece each, the seasons taking turns in them
NH's outdoor furniture stands in fixed spots (world.ts DECOR_SLOTS), at the decorations' one scale (3u a model unit).
Each spot holds a piece for good or the seasons' pieces in turn, and some seasonal pieces stand in the place of a lamp
or a rock (fixedDecor.ts); variety comes from the calendar, not density, and the island never gains a spot. Every spot
is a walk obstacle all year and a place a player's decoration can't take, even while empty, so a seasonal piece never
lands on one and the walk graph never changes with the date. Pure on the date, the hour and the seed: no sync needed.
Why: the user approved the decor plan (one sea-facing bench at the front, the pull-up bar, seasonal swaps "never
additions"), and two phones must show the same island.

### The tent's inside is three.js, its models NH's own, converted
The tent opens a room that is truly 3D (`components/tent/`): three.js at runtime, in its own chunk fetched only when
the tent opens, drawn on demand at a capped pixel ratio, disposed on the way out. Its furniture, rugs, wallpapers and
floors are NH's own files converted by `scripts/room-models.ts` into compact glTFs and WebPs committed under
`static/room/` (about 8 MB for ~390 pieces and 82 surfaces, ≈ 18 KB a piece): the starter set and every furniture a
balloon can bring that NH has a model of here, so a ずかん find can always be placed. The raw game files never enter
the repo; the conversion is reproducible. The villagers stay billboards of their renders. The page's CSP gains
`wasm-unsafe-eval` (the meshopt decoder is WebAssembly) and `blob:` for images and fetches (three decodes the models'
textures from blob URLs). Why: the user asked for a fully 3D room "the size of a large room in animal crossing" to
furnish and walk in; the island's DOM world couldn't, a WebGL layer there would cost the island, and on its own screen
it costs the island nothing. Model files public: the user's call.

### The tent's room is the island's decor ops with a room scope; a drag is presence
The tent's layout, wallpaper and floor are `decor` ops with `sc: 't'` (`contract/tent.ts`): the same event type, the same
relay intent, the same last-writer-wins merge and the same latest-op-per-id record, but their own ids, tiles (0–7) and
cap (40 pieces; 60 since 2026-11-04), so an old phone, which knows no scope, ignores them (its parser rejects the unknown key or the item).
While a finger holds a piece its spot crosses as `drag` (≤ 10 a second, only when it moved, again each second while
it rests) and my villager inside as `tent` (the very walk): presence only, relayed while the partner is there, never
kept, replayed or written; the drop is the op, sent before the drag's end. The earlier of two holds on one piece
keeps it; a hold unheard for 2 s drops back. Why: one record path for both rooms (the island's guarantees carry over:
commutative, no leader), and the partner sees the room being arranged as NH's co-op does, for ~60 bytes a tenth of a
second, without a row per finger move.

### The island's layout is data on NH's tile grid, its changes scoped decor ops (2026-11-02)
The outdoors (terrain per 30u tile: a kind and a cliff tier; objects on tiles with a facing; three homes, each with its
owner's style) is `layout/` data: the default (today's island on the grid, world.ts's ids and exact spots kept) with
the record's ops over it. Its changes are `decor` ops with scopes `o` (an object), `c` (an 8 × 8 chunk of tiles), `r`
(a reset to the default), `h` (a home's look), and the homes' rooms `t` / `u` / `v` (the tent's ops): last writer wins
per id, the record keeps each id's latest, a reset drops what it voids. The outdoors are anyone's (the guest's too
since 2026-11-06), a home's look and room its owner's (the tent all three), enforced by the record and the room. Nav, heights and validation are
derived from the layout, never hand-made. Why: the user asked for an outer world "fully customizable… similar to the
inside of the tent… the same grid system", with everything movable (trees, the pond, the river, the tent) and three
homes; one record path (the decorations' and the tent's guarantees carry over: commutative, no leader), and the
guest's limits server-side.

### The 3D ground is built from the layout and baked on the phone (2026-11-02)
The 3D island's ground is the layout's: NH's quadrant scheme (round corners, vertical cliff walls with NH's strata,
falls where water steps down) as geometry, and its look painted by a shader into one texture per band of chunks on
the phone itself, once at load and again only where a change lands, from the layout's distance fields. Why: a
layout the members change at will can't ship pre-baked textures, and painting it live every frame (noise, flecks,
pebbles) would cost the phone each frame what a bake costs once; bands keep the draw calls flat on an island twice
as long.

### The island is long: 60 tiles (2026-11-02)
20 × 60 tiles (the user: first 92, then 60): today's まえ in front, today's おく behind, and a new middle between them for the homes and what comes
next. Why: the user, for room to build; the width (and so the camera's rules: vertical scroll, x centred) unchanged.

### The island's size is the editor's: edges a tile at a time, the back up to 19 more rows (2026-11-06)
The grid is 20 × 80 (20 rows of sea behind the island, no visual change: an all-sea band of chunks has no bake or
mesh), and the editor's しまの おおきさ moves an edge (まえ / おく / ひだり / みぎ) out or in a tile per click: the outermost
land tile of each line moves and the one it leaves takes the inner tile's ground (a river's mouth runs on, a river
along the coast isn't doubled), so a push then a pull gives the island back (`layout/resize.ts`). The land keeps two
tiles of sea round it on the grid: today the back can grow 19 rows (15 × 57 → 15 × 76), the front and the west not at
all, the east a tile; any edge pulls in down to 6 tiles. A resize is one undoable action of `c` ops (and `o` moves),
so the record and the relay needed nothing (the contract already allowed chunks to c15x15). What's in the way is
listed (a click selects it) and 「うごかす」 moves it inside (resolve.ts clearTile); a fixed piece (a home, the museum,
the shop, K.K.'s stool, the board, a goal tree) is moved, never deleted, and one with nowhere near to go holds the
resize. The camera's middle across is the land box's middle (model.ts midXOf: still x-centred, now on the land as it
is). Why: the user chose "Longer + reshape" (room to build at the back, the shape theirs); the width stays the grid's,
so the camera's rules are unchanged. Rejected: a wider grid (the x-centred camera shows 420u across), separate masks
(each tile already holds its kind and tier), a relay or contract change (none needed).

### The tent's surfaces are NH's flag, their tops the model's geometry (2026-11-02)
Which pieces hold things and which things go on them are the ACNH spreadsheet's (`surface`; the Miscellaneous sheet),
the same data NH's community took from the game; nothing is added by hand (a flat-looking piece NH doesn't flag holds
nothing, a wall shelf holds nothing: NH's Wall-mounted items have no surface). Where on a piece things stand is found
from its converted model (rays down: the highest flat level, the tiles it covers, a roof over a working level giving
way to it), kept in items.json, because the game files carry no surface heights and a model's bounds put things in
the air over ornaments. The ops are unchanged (a slot is a tile of the piece's own footprint, a 2 × 1 thing's its
back-left tile), so the relay and the record needed nothing. Why: the user asked for low shelves, low tables,
bookshelves "and other flat surfaces… faithful to" NH.

### The tent's edit mode holds one thing at a time (2026-11-02)
Holding a piece, a tap on another doesn't take it (a head-shake, and a hint the first three times); a long press
(400 ms) on another does, putting the held one down first; a drag from another turns the camera; a tap off the room
puts the held one down; a near miss on the held one is it (14 px round its drawn shape). Before, any tap on any
piece picked it, a tap meant for the floor next to a neighbour moved the wrong thing, a held piece's tall top fell
through to whatever was behind it, and a drag that began on a neighbour grabbed it. Why: the user found it "too easy
to accidentally select a different item"; NH's own decorating holds one item until it's put down.

### Every home is the tent's room; a home's look is its owner's alone (2026-11-02)
うめ's house and the guest's are the tent's room system with their own scopes (`u`, `v`): the same 8 × 8 room, their
own pieces, arranged by their owner alone (the tent's, ウェイ's, by all three as before). A home's look (NH's player
house or a villager's in their parts and colours, the move-in tents, the campsite's tent) is its owner's alone to
change, any time; its door is its anchor, so a new look grows round the door and the room is the same whatever the
outside. A look that wouldn't fit where the home stands is refused in the picker. Why: the user asked for three homes,
"the option for a user to swap out their home model as desired… keep it flexible", each changing only their own; one
room system means every room has the tent's editing, its sync and its record path.

### The tent's camera is the player's, its walls cut away
The room opens at NH's fixed, slightly top-down view, and a drag turns the camera round the room's middle (a pinch
zooms, 🏠 eases it back), within limits that keep the walls from clipping; the walls between the camera and the room
are cut away. The villagers are their renders as billboards turned to the camera about the up axis (leaning back a
little), alpha-tested and depth-sorted with the furniture. Why: the user asked for a perspective camera the player
can move and rotate, "like NH's room camera but freer", and 2D villagers in 3D that hide behind a table and cover it in
front.

### The island in 3D: three.js under the DOM island
The island is drawn in three.js (`components/world3d/`): NH's models instanced on the editable layout (its ground
built on the phone, docs/island-layout.md), the water live. The DOM island keeps running
over the canvas: its nodes are placed through the 3D camera (`camera.svelte.ts` `Proj3`) and stay the tap areas, the
popups, the balloons and the marks; their art goes invisible where the canvas draws the thing. The camera is NH's: one
finger scrolls along the island (z, a free fling; sideways too only when zoomed in past the default, x clamped over
the island and a little sea, centred again by the default), two pinch the zoom about their middle (the default is the
widest: past it a rubber band, springing back on release), it never rotates and nothing but the finger moves it (the
spring back and the board's focus the user's two exceptions); a gesture is one thing from start to end. (The user,
2026-11-02: "zoomed in, let me pan left and right".) Shadows and water are on; the
shadow map is drawn unbent (three's receivers look it up at their unbent position), so it redraws only when its box
steps, not on each frame of a scroll. Every lamp is always-on emissive with a halo and a pool; the 6 real point lights
go to the lights nearest the view's centre with hysteresis, fading over 400 ms, so a light never pops. Why: the user
approved the POC on the phone ("redo the whole map such that it's all 3d. same as the tent room…"), and reusing the
DOM island's model, director, nav, sync and every overlay means only the drawing and the hit-testing are new.

### The 2D island goes; no WebGL is a line, not a fallback (November 2026)
The 3D island became the default on the 60-tile layout (behind せってい's 2D/3D switch for a release), then the 2D island
went (2026-11-03, ~4,700 lines): the rolling log (`roll.ts`), its baked ground (48 chunks and the bake), its CSS water,
the scroller camera, the old もようがえ (DecorMode: IslandEdit is the one), the switch and `?island` / `?layout`, the
2D-only art (lit looks, turned facings, the bridge's deck, the cliff sprites), the /villagers3d POC and the e2e's 2D
variants. Without WebGL the island shows 「この端末では しまを 表示できません」 and the rest of the app (the panel, health,
ごほうび) works as ever. Why: the users' phones (iPhone 15 / 16 Safari) always have WebGL; a second renderer to keep
in step cost every feature twice. Kept: the DOM island over the canvas (the tap areas, marks, balloons, popups), and
the 2D art the app or the tap areas still use (the tent, the homes, the ずかん and catalogue icons, the HUD, villagers
without 3D models, the flowers' and oaks' tap boxes).

### The phrases open from a say button, not my villager (2026-11-02)
A small round button at the island's bottom right (NH's chat glyph, 36px in a 44px target) opens the phrase picker
above it; a tap on my villager is only its squish (and now and then a flea). Why: the user ("instead of tapping our
character… a small message icon on the bottom right… not too intrusive"); a moving villager is a hard target and a
tap on it is play, not a menu. The tent and the homes have it too (below).

### The bulletin board is a record event, its notes plain text (2026-11-02)
NH's board (the user: "walk up to it to update its contents for everyone to see… the camera should zoom up to it"). Each
note is a `board` op, last writer wins per note, a removal final, as the decorations are; the record enforces who may
(anyone posts; only the author edits; the author or a member takes down) and keeps 50 (a new one drops the oldest),
and the phones fold by the same rules. 100 characters and 4 lines: legible at the zoomed board on a phone. Plain text
only, sanitised on both sides and only ever drawn as text (canvas `fillText`, Svelte text). No live intent: a note is
over the room's 256-byte messages, and the record's notice already reaches every open phone. The walk up is the tent
door's exception, the camera's dolly the one automatic camera move (the user's ask), the latter the 3D lead's to add
(board.md); before the 3D island's focus is up, a sheet shows the same face.

### A phrase is said in one place (2026-11-02)
The say button is in the tent and every home too, its balloon over the speaker's villager in the room. `say` carries
where it was said, an additive `sc` (`t` the tent, `u` うめ's, `v` the guest's room; none: the island), and each phone
shows it only when it is in the same place: a room's phrase on the phones whose villager is in that room, an island's
on the phones on the island. The phones filter it (the relay only checks and passes the field on; deployed first);
an older phone sends none and is on the island, and ignores the field it doesn't know (the speaker in a room is hidden
on its island anyway). The balloon's anchor in a room is one engine function, `headPoint(who)` (tent/engine.ts), for
the 3D villagers' head bone. Why: the user ("add the say button inside the tent and houses"); one place at a time
already holds for the villagers themselves, so a phrase follows its speaker. Not done: a phrase heard through a wall.

### A catch is its plate, nothing held up (2026-11-03)
NH's hold-up (the item lifted over the villager's head, a squash-and-rise pose, busy while the plate read) goes: a
catch or a find, mine, the partner's or the guest's, is only its plate in the bottom stack, its icon popping up from
where it happened. Why: the user ("we don't need that now that we have the messaging system at the bottom center of
the screen"); the stack already says what was caught and by whom, and the item over the head doubled it.

### The jar goes into the leaf, ごほうび is the panel (2026-11-03)
(Amends *The jar is the door, no ribbon*.) The HUD is [the dumbbell] [the bowl] [the leaf], the leaf at the very right;
the jar leaves the sky and the leaf's dropdown gains 「ベル 121」 first (the balance, no icon), opening the panel. The
panel is ごほうび alone (title ごほうび, no きろく / ごほうび switch): the jar at the left of the balance with 「きょうの
ベル +N」 under it, the rewards (ⓘ for their examples; no examples or 「あと N ベル」 on the tiles), the ベル ledger that
was きろく, and the buys folded at the bottom. The coins fly into the leaf (into the ベル row when it's open) and today's
+N flashes under the leaf. Why: the user ("move the bell jar button into the dropdown menu … rearrange items … remove
the two way kiroku / gohoubi selector"); one door less in the sky, one screen for everything about ベル. The coin flash
by the leaf, not the bowl: the leaf is where the ベル row drops from, so the landing points at where they are kept.

### A tap on a seat sits on it, outside as in the tent (2026-11-03)
A tap on the island's benches, stools, iron chair, hammock or beach chair walks my villager up to it and sits or lies it
there, as a chair or a bed in the tent does: the third exception to "a tap on something acts in place", after the tent's
door and the board. The seat's spot (`layout/nav.ts` seatsOf) moves from just behind the piece (the 2D island's, its legs
hidden by the seat) to a step in front of it, the room's `from`, so the 3D villager walks up to the front and turns and
sits down on the model's own seat (the same `seats3d.json` anchors and `villager3d` sitAt as the rooms; a test holds the
spot and the anchor together), and gets up there again. Nothing new goes over the relay: outside, a villager standing
still on a seat's spot is on it, so the walk is the whole story on every phone, a phone opening later and the walk
home after 3 minutes included, and an older phone draws the same; the room's `seat` field isn't needed. One villager a
seat (a bench two): taken, the other seat or a boop, as in the room. Why: the user ("similar to when they're inside a
home, have them sit/sleep on that object - be consistent"). Not done: the picnic set and the illuminated tree, a seat's
spot's other looks, aren't sat on.

### A tap by a fish casts to it, whatever water the ground says; a shadow in every fresh water (2026-11-03)
A tap casts to the nearest shadow on screen when it's on the shadow as drawn (its body and a finger round it), on its
water within CAST_U, or on another water within NEAR_U, the bobber in the shadow's own water nearest the tap. Before,
the tap's water was the ground's under the tap (`critters.ts` waterAt) and only that water's shadow could be cast to:
a tap on the river a step up from a fish at the mouth, on the sea by a fish at the mouth, on the river below the falls'
pool, or on the drawn coast past the water's tiles found no fish, and the tap only splashed. Each fresh water is its
own ambient channel (the pond, the river, its mouth, the clifftop: one channel for all four left a pond on screen
empty three turns in four), and a layout without the painted pond no longer has a pond patch far off the island
(`layoutWorld.ts` POND then stands far off it: a third of the pond's fish swam there on the user's island). Why: the
user ("often i see fish in the water, tapping the water, no reel is cast"; "i don't see any fish shadows inside the
ponds … i also don't see any fish in the rivers"). Critters' `__fish` hook (dev and the demo) names why a tap didn't
cast.

### The balloon flies in the world; its present lands where it can be tapped (2026-11-03)
The balloon present is a real 3D model flying over the island (`island/balloonFlight.ts`, `world3d/balloon3d.ts`), not a
DOM node crossing the screen's sky with its model drawn where the node was: at one height well over the trees, from
sea to sea, its lane picked from the view as it starts (biased to the front), a blob shadow under it, bent with the
log. Popped, its present's landing spot is chosen first (`island/presentLanding.ts`: open sand or grass in the front
of the view, clear of every control and of what lies there) and the fall steered to it, so it never drops where it
can't be seen or tapped: no more dropping into the sea, and a pop over the back of the island drifts forward. The spot
is this phone's (its view) and is sent with the `put`, so both phones have it where it landed; the flight itself stays
each phone's own. Its frames are the ambience's (a slow drift), its clock the island's (it holds under a sheet).
Why: the user ("implement it as a real 3d model flying directly over the world, in 3d space … it should consistently
drop to the front area, somewhere open").

### The seasonal preview is a look, not a date (2026-11-04)
せってい's きせつ (design.md "Seasonal preview") forces what the scene shows (an event, a season, the weather, the time
of day) instead of moving the scene clock as `?date=` does: the clock also keys the records (the shared world's day, the
day items, the tallies), so a moved clock could file real catches and picks under another day. Whatever the island
yields stays the real day's (critters by the real weather and month, no eggs in place of a find, no fragment from a
previewed star), so the preview can't change ベル, ずかん or the shared world. It's this phone's (never synced), for the
day it was set on. The dev params (`?event=`, `?weather=`, `?season=`, `?theme=`, `?fireworks`, `?shower`) feed the
same resolution (`ui-state/preview.ts`), so there is one override, not two. Why: the user ("Add an option in settings
for seasonal overrides to trigger them").

### A player walks half as fast again (2026-11-04)
A villager its player moves (mine, the partner's, the guest's) runs a tap-walk at 300 u/s on the island (`SPEED.run`,
was 200), walks to a tree, the meet-up or an action spot at 360 (`SPEED.action`, was 240), and walks the tent and the
museum at 45 model units a second (`PACE`, was 30); a partner's correction (`villagerSync` RUN_U_S) is the brisk 360.
The strolls (`SPEED.wander` 90), the visitors and the critters are as they were. Faster than 200 u/s a step reaches
further and the legs swing wider by the speed's square root (`poses.ts` reachOf), so the run's feet don't slide and it
steps 4.5 cycles a second, not 5.6. A walk carries its `ms` and its end, so an older phone on the old pace
still ends a partner's walk where it ends. Why: the user ("Increase the walk speed of players by 50%").

### Weather from Tokyo, by the hour (2026-11-04)
The island's weather is Tokyo's (design.md "Weather", backend.md "The real weather"): the relay fetches Open-Meteo's
forecast from JMA's models on the cron it already runs and keeps a 48-hour timeline of NH's skies (fine, cloudy, rain,
a downpour, snow; fog an extra) on the room's object. Each phone gets it after the welcome and on change, and caches
it. Why this way: one fetch and one cache for every phone (no phone calls a weather API, and the iOS PWA can't fetch in
the background anyway); hours locked once they begin, so the two phones can't disagree or flicker; a free keyless
source with an hourly forecast for offline phones (JMA's own JSON has only three daily slots, WeatherKit needs a paid
membership and Apple's branding). The fallbacks are the cached timeline (≤ 36 h), then the seeded days. Kept from the
game, by the user's answers: winter rain (Dec 11 – Feb 24) falls as snow; the fireworks nights, the meteor showers and
the wedding night stay fine; the morning fog and the aurora stay as seeded treats on real fine hours; no rescue for the
rain-only critters in a dry spell. One island-wide setting (`pref weatherMode`, ほんもの by default, members only) keeps
the game's weather a tap away. The point is central Tokyo. Why: the user ("We are based in Tokyo, Japan. Can we get
the game weather to sync with the real weather?").

### Rain and snow in the world, one draw call each (2026-11-04)
What falls is the 3D island's (design.md "Weather"), not a screen layer: streaks and rings, or flakes, instanced, moved
in the vertex shader, wrapped in boxes that follow the view and anchored in the world. Why: the user ("instead of just
a 2D texture on the screen, actually make it more like a subtle, beautiful 3D splash, drop, falling effect. Not overly
done, subtle. Similar to the original game"); NH's rain has depth and lands on the ground. Battery: the island already
draws at its ambient 30 for the water, so falling rain costs only its two draws (no CPU per particle); a CSS layer
would have been free on the GPU but flat.

### A room holds 60 pieces (2026-11-04)
Each room scope (`t`, `u`, `v`) keeps up to 60 pieces (`TENT_MAX`, was 40); the record refuses the 61st (`tent full`).
The relay went first (it enforces the cap), then the app; an older build stops at 40 and shows a room's oldest 40.
Measured full on the iOS Simulator (design.md "The tent"): draw calls 80 → ~113, frame cost unchanged (p95 2–3 ms),
so a repeated model stays a mesh of its own (no instancing: it would complicate moving, turning and table-top things
for nothing measurable); 3 rooms × 60 ops make a ~48 KB snapshot, and a live op is per piece (≤ 185 of 256 bytes).
Why: the user ("Can we increase the max number of items in a room to 60?").

### すがた: one dresser, dress as you go, kept on leaving (2026-11-05)
すがた is one level: a large shared stage on top (the final form, its state in words), six tabs (コーデ · かお · かみ ·
ふく · こもの · むらびと) and the panel (design.md "すがた", design/avatar/sugata-ux.md). The villager picker is the むらびと
tab, and its pick joins the draft like a garment: nothing is sent until the level is left, then `villager` and `look`
once (the guest: `villager`, `look: null`). No けってい: leaving keeps it, as NH's wardrobe (a けってい would suggest ✕
throws the changes away); もどす on the stage and a 5 s とりけす after leaving cover the regret. Why: the user ("make the
menu for customizing user and choosing villager more intuitive. maybe tabbed with shared preview of final form"); before,
the villager was a second level sent on tap while the look was sent on leaving, two commit models on one screen.

### ききみみ クイズ: a lazy sheet, a tiny invite listener (2026-11-05)
The listening game's sheet is its own chunk (the bank, the deck, the session, its strings: ~30 KB gzipped) loaded on
the first あそぶ or さんか; the island's first load only gains the listener and the banner (`KikimimiHost`,
`invite.svelte.ts`, a few hundred bytes) and two strings. The listener keeps the quiz intents heard in the last 10
minutes and hands them to the sheet's session as it opens, rather than the session living in the first load or the host
re-sending on a sheet's opening: the relay's quiz intent is presence only, so a phone that opens the sheet later would
otherwise never hear the lobby. The session's scoring is score.ts's (one `points`). With the host gone mid-game each
phone moves on by itself once everyone left has answered (a reveal's length later), as no skip will come. Mid-game the
sheet isn't closed by a backdrop tap or Esc (Sheet's `ondismiss`); ✕ asks first. Why: the user's game for several
players, with nothing heavy before it's opened (docs/kikimimi.md "Performance").

### ききみみ クイズ: the host is the clock; a lobby is mine alone till さそう (2026-11-05)
A correctness review ran two sessions on one clock and found the computed schedule drifting: one lost `skip` left a
phone ~15 s behind for the rest of the game, a phone back from a lock could show (and answer) an old question, players
raced ahead of a locked host and never met it again (in おなじへや the clip and the screen disagreed), a phone's own
blip counted as "host gone", and つぎへ on the last question ended only the host's phone. Now the host's `skip` is its
position, sent as it changes and every 3 s while a game runs (a few dozen bytes, unstored), and every phone adopts it
even for a question already under way or one it passed (starts never decrease; a question whose clip began over 5 s
before is sat out). Players move on by themselves only when the host has really gone (its `leave`, or away 15 s), and
presence is ignored while the phone's own socket is down. The end is `skip` with i = 8 (the protocol's bound relaxed, the
relay redeployed with it) rather than a new op. Rejected: each phone voting on a shared position (no single clock to
agree on, more traffic) and the host only re-sending on presence (a lost skip mid-game had no repair). Opening from
せってい no longer invites everyone: the lobby is local (nothing sent, a solo game sends nothing at all) until
「みんなを さそう」; in おなじへや the first-listen bonus is off for everyone, since only the host's phone can replay. Why:
the review's repro and the game designer's P0s (an accidental invite to the whole island; an unfair +30).

### ききみみ クイズ: an untimed reveal, a lobby timer on the seed, いっぱつ a badge (2026-11-06)
The user asked for a longer answer timer settable per session, no timer on the reveal ("i want time to read and the
answers") and a review of the ones they got wrong; and decided the first-listen bonus becomes a badge. The answer window
is now 30 s by default, with 20 / 60 s and none (the reveal once everyone joined and here has answered) as a lobby
setting, carried on the `open`'s seed bits 2-3 next to たいせん's bit 0 and スピード はしご's bit 1: no new field, so no relay deploy, and every phone
computes the same limit. The reveal holds till つぎへ, so the schedule no longer knows a next question's start until the
host's skip: unfixed starts are Infinity, and the host-as-clock rules (adopt the host's position, beacons, late = sat out)
stand unchanged around it. A player's `skip`, which the old code ignored, carries their よみおわった (the question they're
in) or, with the host gone, their つぎへ (the next question): again no protocol change, and an older phone ignores it.
Phones re-send their answer and よみおわった on a join or someone's return, so a phone back from a lock into an untimed
reveal sees the others' answers; a host back after the players moved on adopts their position (a player answers its stale
beacon with theirs). Rejected: a new `ready` op or an `open` field (a relay deploy and a mixed-version window for one
bit of state), auto-advancing once everyone is ready (the user wants time; the host decides), and keeping the bonus as
points beside the badge. The results open on the misses, with a solo replay of just those (a local deck, recorded as
practice like にがて れんしゅう, feeding the SRS as before).

### ききみみ: less repetition by the host's seed, levels 6-7 on a widened lv (2026-11-06)
The user wanted more content and variety ("there's too much repetition right now"). Five content sets (もり ×2 into level
4, やま as level 6, ほし as level 7) and a pass against repetition landed together. A shared deck must stay the same on
every phone, so the host's phone chooses among 24 seeds the one whose deck overlaps its last 6 games least (kept in
DEVICE storage), the seed's flag bits untouched: the other phones only read the seed, so no protocol change and no
mixed-version risk. A solo game and にがて れんしゅう are this phone's alone, so they draw the items not heard lately
first. A cross-bank near-duplicate test (token overlap on the English, identical right answers) guards the bank as it
grows. Levels 6 and 7 needed the quiz's and the listen row's `lv` widened to 1-8: one relay deploy before any phone could
send them (5 stays the アナウンス pack, 8 the next room). Rejected: sending the deck's ids (over the 210-byte budget and a
relay change), a shared history between the partners (each phone hears its own games), a new level value for やま
inside 1-5 (5 is the pack's, and the ladder of places needs two more).

### ききみみ: American English first; UK/AU only as tagged exposure at やま and ほし (2026-11-06)
The user: "there is too much Australian and British slang. I want the focus to be American English." Every item,
dialogue line and unit is now American by default: US vocabulary, idioms, spelling, dates, dollars and social norms,
and a US voice. UK and AU stay only as deliberate accent exposure at やま and ほし (B2+, C1): at most 10% of each of those
levels, every such item tagged `accent-exposure` and written in standard international English, never slang; none at
はまべ, かわ, もり or in a unit (bank.test enforces the shares). The cast grew from 12 to 18 voices so the variety comes
from Americans: six more designed US voices (ages twenty-two to sixty-five, deep to bright, a light Southern and a light
New York one), and every villager's voice for good (`CAST`) is a US one. The six UK/AU voices are kept, in a separate
villager → voice map (`EXPOSURE`) that only an exposure item uses, so a villager sounds American everywhere else and
the content's authors pick exposure by a tag, not by casting. Rejected: dropping UK/AU entirely (the learners will meet
them at work and travel, and a little at the top keeps the ear flexible), an exposure share per unit (units teach one
can-do, an accent change there is noise), designed UK/AU voices (VoiceDesign can't do them; the Phonon and VCTK
references stay).

### ききみみ クイズ level 4: content before its voices, hidden till its clips exist (2026-11-05)
Level 4 「かわ・もり」 (docs/curriculum.md §14, increment 1) landed as content only: 67 real-life items (`bank4.ts`) with
`tts`, `note`, an abstract `cast` voice id per villager and the scenario `tags`, and no audio. The lobby offers a level
only when every item of it has a clip (`deck.ts LEVELS`), so main stays shippable while the neural TTS is chosen; the
`say` script never speaks level 4 (the robotic voices were rejected). The protocol's quiz `lv` went from 1-3 to 1-5 at
the same time, so the relay (which validates `lv`) is redeployed long before any phone sends 4, and 5 needs no deploy
later. Rejected: generating `say` clips now to be replaced (the user rejected them; a level shipped with them would be
played), a feature flag (the clips themselves are the readiness signal, nothing to forget to flip).

### ききみみ スピード はしご: a quiz mode on the seed, rungs by time-stretch, climbs scored flat (2026-11-06)
スピード はしご (docs/curriculum.md §14, increment 7) is the quiz's session with another deck: 2 ladders × 4 rungs = 8
questions, so the protocol, the relay and the co-op / たいせん code are the quiz's. The mode rides on the `open`'s seed's
bit 1 beside たいせん's bit 0: no new field and no relay deploy; `lv` 5 stays the next level's room. The rungs are one take
per line stretched with ffmpeg atempo to 0.8-1.4 × 4.3 syllables a second, pre-rendered: the voice path's Web Audio
`playbackRate` shifts pitch, and atempo measured nearly free to 1.25× and about −0.35 UTMOS at 1.4×. Each rung asks a
different question (Japanese for rungs 1-3, so no English is read before a faster listen; the top a dictation-lite pick
of near-sound forms of the chunk), and below the top the reveal keeps the line hidden and silent. Scoring follows the
learning-science review: a rung counts only when climbed in order on the first listen, stopping at the first miss or
replay, a flat 100 each. Rejected: a payout weighted to the top (invites guessing), separate faster takes per rung (not
the same line, and the engine's pace isn't steerable), a level value for the mode (contends with increment 6).

### The trip map: MapLibre on OpenFreeMap's tiles, our own style, online only (2026-11-06; offline phase A below)
The trips' maps (docs/travel.md "Maps") are MapLibre GL JS 6 drawing OpenFreeMap's public vector tiles (OpenMapTiles
schema, OpenStreetMap data) in a NookPhone style of our own, every label in the app's Zen Maru Gothic through the
style's `font-faces` (the @fontsource slices we already ship; no glyphs URL). Online only: no tile download, and
MapLibre's chunk, worker and CSS are kept out of the precache. The CSP gains one origin, `https://tiles.openfreemap.org`,
in `connect-src` only (no sprite, fonts ours: no `img-src` or `font-src` change); the worker is a file of our own
origin (no `blob:` worker, no eval). The Permissions-Policy gains `geolocation=(self)` for the locate button: asked
only when tapped, watched only while the map shows, the position never leaving the phone. OpenFreeMap sees the phones'
IP and the area viewed, never the trip's places, legs or notes. Why: the user asked for real open maps,
NookPhone-styled and online; OpenFreeMap needs no ops and covers every trip worldwide. Rejected: self-hosted Protomaps
extracts on R2 (19 MB for Okinawa alone, a bucket and a relay route to run; still possible: `style.ts` `BASEMAP` is
the one place that names the source), raster tiles (blurry on a 3× screen, no restyling), Google / Apple maps (keys,
terms, not themeable).

### ききみみ's microphone: off by default, on the phone first, nothing kept (2026-11-07)
The user approved mic modes (docs/kikimimi-mic.md) on these terms, the privacy rule in docs/kikimimi.md "マイク":
the mic is off by default and turned on per phone; solo by default, the partner involved only when both opted in;
recordings live in memory for their round and are never stored, synced, logged or sent to the partner; speech to
text runs on the phone first (whisper in the page, downloaded once after consent), with Safari's recogniser (audio
may go to Apple) or the relay's Workers AI (`POST /stt`, the request only, nothing kept, sizes and times logged, a
daily cap and `STT_OFF`) as disclosed fallbacks; no transcript or speaking score leaves the phone, rows carry minutes
only, and there is no speaking leaderboard. The Permissions-Policy allows `microphone=(self)`. Why: the panel is shy
about speaking and the voice is the most personal data the app would touch. Rejected: server-first recognition
(simplest, but every utterance leaves the phone), a pronunciation score (noise from ASR, and it shames), free LLM
conversation (the user: no).

### Offline: the guides and the maps seen, phase A (2026-11-07)
The user: "we'd like some offline functionality for the app in general … also need access to travel, hike, and
wedding even if offline." This reverses the trip map's "online only" and the past trips' "download nothing" for what
the phone has already shown (docs/backend.md "Service worker" › Offline): the trips' covers and heroes, the trails'
tracks and the common font slices are precached; the guides' photos, MapLibre and the map tiles drawn are kept on
first view, bounded, never prefetched. Saving a map area ahead of time is phase B, separate. Why: a trip is read where
the signal is worst (a ferry, a trailhead), and these are a few MB. Rejected: precaching every photo and MapLibre at
install (≈ 6 MB more on every phone and every deploy for screens one phone may never open), prefetching a trip's
tiles (tens of MB, OpenFreeMap's goodwill).
