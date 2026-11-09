# Decisions

The decisions in force, each with its reason. The numbers live in the code (`app/src/lib/config/rules.ts`,
`contract/`); if this file and the code disagree, the code wins. Who asked for what, and when, is in the git log.

## Data and backend

### The record on the relay
The data of record (metrics, events, the ingest audit) is SQLite in a Durable Object on the relay (`IslandStore`), on the
Workers Free plan beside the live room, its own class so the two change apart. Event ids are primary keys, `since` an
index, and a slot row (a tally, an island day, a pref, a decoration) is replaced by its later event. Backups are
point-in-time recovery (30 days) and `node scripts/record.ts dump` ([runbook](ops/runbook.md)). There is no Google Sheet
and no Apps Script. Why: the old Apps Script took 1–15 s a request under its lock; the record answers in ~0.1 s at about
1 % of the Free plan, and one copy of the health data is one fewer to guard.

### Logging and observability
Logs live in their own Durable Object (`IslandLog`), not the record: a restore of the record must not roll back the
incident's logs ([observability](ops/observability.md)). One table keyed by receipt time, no index (each index row costs
a write on the Free plan); per-day caps per role so a runaway log can never stop the record's writes; an allow-list of
fields enforced by the relay, error messages scrubbed on both sides, never a record's values. The phone keeps an error's
trail first and resends until acked. Only the signed admin reads it; 30 days' retention. Why: investigations need a
trail, without a second copy of private data or a paid service.

### Per-person keys
`KEY_A`, `KEY_B` (and the guest's `KEY_C`) are Worker secrets; a key identifies its person. It travels in a `text/plain`
POST body, never the URL (no CORS preflight). A phone pairs with a `#key=…` link or by typing it. Why: no accounts for
three people.

### Append-only, computed on read
The record holds raw rows; the server stamps each with its own `at` and checks shapes; the app computes ベル, locks and
the wallet on read. Why: no ledger, no scheduler, the rules in one place.

### Local-first sync
The app paints from its IndexedDB snapshot and polls for rows newer than its last `at`; taps are optimistic and queue
until acked (one batch, each stored row back in the reply). A retry the record already has is acked as a duplicate. The
welcome says when the phone is already current, so it skips the fetch; a changed `rev` drops the cache. Why: a tap must
never wait for the network, and an unchanged phone shouldn't fetch at all.

### The record serves only what the app reads
`snapshot` sends only known metric and event types and persons, and the record accepts nothing else. Why: the app never
needs code for rows it doesn't produce.

### Live relay on Cloudflare
While phones have the app open, a WebSocket to the island room (a SQLite Durable Object, `relay/`) relays small intents
(what I tapped and did, never positions), opened only while visible and authenticated by the person key. The room is
presence and the day's shared world; the record is its own object, so a room outage loses liveness, never data. Why: the
Free plan needs no payment method, hibernation makes idle sockets free, and the edge is ~20 ms from Tokyo.

### Relay versions side by side
The relay speaks every version in `LIVE_VS` (today `[3]`); any other is closed 4004 and the phone parks until a reload.
A change ships relay first, then the app; the old version is dropped once the `ws.hello` log shows every phone on the new
one. New fields are additive so an older phone ignores them. Why: the phones update at different times (a service
worker update waits for the next open), and a hard switch would cut whichever updated last.

### Push through the relay
When the record changes it tells the room (`{what, who, at, rev}`), which tells the open phones to fetch now and keeps
the last notice for each phone's next welcome. Polling stays. Why: a partner's steps and buys show within a second, and a
current phone skips its fetch.

### Shortcut health sync
Each iPhone runs one built-in Shortcut posting daily totals (steps, exercise, Move kcal, stand, weight, body fat, BMI)
when an everyday app opens ([shortcut](ops/shortcut-health-sync.md)); any changed value is appended, latest wins. Health
rows are never compacted or pruned. Why: no third-party app, nothing manual; Health is the truth, up or down.

### No manual input
The app never enters health data, and asks nothing day to day. Why: the daily loop needs no taps, and a second source
would conflict with Health. The meal log is the one exception (below).

### No notifications
The app sends no notification of any kind (no Web Push, no service worker `push`). In-app banners and the relay's
record-change notice to open phones stay. Why: nobody used it, and it was the one piece of iOS-only, hard-to-test
machinery.

## Players and privacy

### No privacy rules
Everything is visible to both members. Why: two people, one game. The guest is the one exception.

### The guest
A third person plays as a guest ([backend](backend.md#the-guest)): its own key and villager, catching for the shared
ずかん, decorating the island and the tent, the board, the island's weather and look, ききみみ. It never sees the members'
からだ figures (weight, body fat, BMI, lean mass and their goals) or profiles, and doesn't write the economy or the
real-world records: ごほうび's buys, the harvest, the members' goals, the Health ingest, a trip's notes, the wedding board.
The record and the room enforce it (`contract/guest.ts`); the からだ rows never enter its snapshot. Its villager joins the
island's ambient life while its app is open. Why: a guest who plays but doesn't earn; a privacy rule only the UI kept
would leak through the cache.

### Profile
Each person's sex, birth date and BMI standard are prefs, private like the body data: a member's reach only the members,
the guest's only the guest (`rowsFor`). Height is derived from Health's weight and BMI. Energy is Mifflin–St Jeor plus
Apple's Move; suggested goals are defaults only, never over a set goal. The BMI standard defaults to Asian cut-offs
(JASSO, 23 / 25). Why: right for East Asian bodies, nothing extra to keep in step, and only what a phone may show is ever
on it.

### Player avatars
A and B are NH human players by default (a villager is an option). All clothing is free, so the record's check of a look
is its whole check. A look is one `look` pref, saved コーデ one `savedLooks` pref (≤ 20); the default, いつもの, is code,
never a row (null means it), so a retune reaches everyone. A phone reads a look part by part, an unknown part as
いつもの's. Why: no inventory to sync, and a newer app's part never breaks an older phone ([backend](backend.md#the-look)).

### すがた: one dresser, kept on leaving
すがた is one level: a shared stage, six tabs (コーデ · かお · かみ · ふく · こもの · むらびと); the villager pick joins the
draft like a garment, and `villager` and `look` are sent once on leaving (no けってい; もどす and a 5 s とりけす cover
regret). Why: one commit model on one screen, as NH's wardrobe.

## Health and meals

### Health trends (けんこう)
The dumbbell's popup shows the Health data over time, one person at a time, computed on read (`model/health.ts`): every
day with a row counts; 記録なし is a day without one; today is drawn, not counted. Day, week or month periods, plain
numbers, no smoothing. Its tabs include ごはん, the meal log. Why: a trainer needs exact numbers anyone can check against
the bars.

### No-watch days
<a id="no-watch-days"></a>A day with Move, Exercise and Stand all 0 or absent is no data for those three everywhere
outside the ベル (`model/health.ts activityOn`); steps stay; rows are never rewritten. Why: the Shortcut's Fill Missing
sends 0 for a day without samples, which pinned TDEEs at the floor and dragged averages down; for the ベル a 0 and a
missing value earn alike.

### Goal directions
One registry (`contract/goals.ts` GOALS) holds every chart's goal: its pref, range, history and direction, read by the
record, the model and the screens. At least: steps, Move, Exercise, Stand, lean mass, protein. At most: body fat, fat,
salt, alcohol. Near a value (前後): weight ±1.5 %, BMI ±4 %, kcal ±10 %, carbs ±15 %. Exercise and Stand goals are
けんこう's lines only; the ベル keep the fixed 60 / 120. Why: a chip that says which way reads at a glance, and a lower
weight is never rewarded.

### Low kcal goals: warn, allow
<a id="low-kcal-goals-warn-allow"></a>A kcal goal under resting energy or the safe floor (1,500 kcal a man, 1,200 a woman
or unknown) gets an inline note and still saves. Why: a goal is the person's call; a hard floor would refuse a supervised
plan.

### Meal log
ごはん (a tab in the 健康 sheet) is typed in by the person: a food from the shipped data, its grams, the meal and the day.
Each entry is a `food` op ([backend](backend.md#events)), latest op per id; only its logger edits it; everyone sees every
meal, the guest included. The food goes in as a per-100 g snapshot, so a data refresh never rewrites a meal. It never
earns ベル (`deps.test.ts`). Repeats (いつもの) are one row whose days are computed on read; a change ends it and starts a
new one, so the past never changes. Recipes and custom foods are shared rows, logged as an ordinary `food` snapshot; a
serving with no weight logs as a nominal 100 g with `sv`. Why: the calorie tracker in the island, with history that never
rewrites itself.

### Fibre and alcohol
The meal log counts 食物繊維 and アルコール as optional snapshot keys (`fi`, `al`), kept only when the source says, so
unknown never reads as zero. Alcohol counts only drinks. Default goals: fibre by the 食事摂取基準 2025 (needs sex),
alcohol at most 20 g (健康日本21's 「節度ある適度な飲酒」). Why: one plain national line, and nothing older changes.

## Economy

### Bells are play money
Small whole numbers, not tied to yen; no transfers. Why: prices the couple chooses, no real money at stake.

### A stamp card
Per person per Tokyo day, +1 ベル per daily goal met (at most 4); がんばり +1 per goal at 1.5× (at most +2); ふたりでぜんぶ +2
shared when both meet all four. One `RULES`, one `STRETCH`, earnings recomputed from the rows. A typical week ≈ 52 for
the pair. Why: numbers a child can add up, and the bonus makes it a team effort.

### Four automatic fruits
🍐 Move (per-person goal), 🍑 Exercise (60 min), 🍒 Stand (120 min), 🍎 Steps (per-person goal, 8,000 until set). Move
and steps goals apply from the Tokyo day they are set. Why: the Watch measures them with no effort, and the past must not
re-price.

### Economy start
The first week with an activity row, stamped by its lock. Why: no start date in code, and old days can't earn.

### Harvest and week lock
Sunday 19:30 the recap opens (ceremony only); the Wednesday 04:00 after, the week's earnings lock (spends never do). Why:
a grace period for late syncs, then the past stays put.

### One wallet, two rewards
Every ベル goes into one shared wallet; two treats, おやつ 40 and 外食 70 (`contract/rules.ts SHOP`). Either person buys or
erases any buy (`spend_void`). Why: one number to watch, priced against the week (a typical week is one おやつ, a perfect
one a 外食), and mistakes undone without deleting anything.

### Weight never earns
Shown only, with an optional goal. Why: paying for kilograms rewards crash diets and punishes muscle.

### The shop's かいがら
The shop ([design](design.md#the-shop)) has its own per-person currency, かいがら, never ベル. The pocket is derived: what a
person's day tallies caught, less what they sold, so no write per catch. Anything collectible sells (`contract/pocket.ts`:
critters, shells, fossils, fragments, goods). Prices are NH's Bells ÷ 20 both ways (a sell at least 3); a sale keeps its
price. The stock is 8 pieces a day by the date's seed plus three basics, only what a room can place. The record refuses a
sell past the pocket and a buy past the wallet. The shop is a counter screen, not a 3D room. Why: NH's sell : buy ratio,
nothing stored for the stock, and no request per catch.

## App and hosting

### PWA on Cloudflare Pages
A static SvelteKit SPA at https://island-fund.pages.dev, deployed from CI after the gate, with a strict CSP (our origin,
the relay's, OpenFreeMap's tiles), nosniff, no-referrer, a Permissions-Policy, no framing, HSTS. Without a key it shows
only pairing or `?demo`. No key or data is in the repo. Why: the pairing key is in localStorage, so the origin must be
ours alone, and Pages can set headers.

### Offline shell
The service worker precaches the build (not audio, art beyond the defaults or the trip photos), loads pages
network-first with a 3 s fallback, and keeps one previous version for a stale page's chunks. Why: the app opens instantly
and offline.

### Japanese first
Japanese by default, English per person (`pref locale`), each catalog loaded when first needed. Why: both live in Japan,
and the first load stays small.

### Copy: spaced kana in the world, kanji in the sheets
The island world and its HUD (lines, bubbles, signs) keep spaced kana under `word-break: keep-all`; every sheet, panel,
dialog and form, and the leaf menu's pills, use natural Japanese with kanji, one spelling a term
([design](design.md#copy)). Why: the world's voice is NH's kana; adults read kanji faster, and keep-all would make an
unspaced sentence one word.

### Always animated
No reduced-motion variants. Why: one code path is simpler.

### 設定 trimmed; the island arranged in /editor only
The main island is edited only from /editor; the tent's もようがえ stays the room's. The game draws at most 30 frames a
second. Why: fewer controls, one place to arrange the island, and a cooler phone.

## The island world

### The island in 3D: three.js under the DOM island
The island is drawn in three.js (`components/world3d/`): NH's models instanced on the editable layout, the ground built on
the phone ([island layout](island-layout.md)), the water live. The DOM island runs over the canvas as the tap areas,
popups, balloons and marks, placed through the 3D camera. Without WebGL the island shows a line and the rest of the app
works; there is no 2D fallback. Why: reusing the model, director, nav, sync and overlays meant only drawing and
hit-testing were new, and iPhone 15 / 16 Safari always have WebGL.

### Free scrolling
Only the finger moves the camera: one finger scrolls along the island (sideways only zoomed in, x otherwise centred),
two pinch the zoom; no snap, no sections, no automatic camera move (the board's focus is the one exception). It rests
where the scroll leaves it, and nothing runs once still. Why: a camera that moves by itself fights the finger.

### Lights in depth
The time of day's tint and a wet day's darkening are applied at the source, so a light (a lamp, a lit window, a firefly)
sorts in depth like anything else and stays untinted. Every lamp is emissive with a halo; the few real point lights go to
the lamps nearest the view's centre with hysteresis and fade, so a light never pops. Why: lights that pop or glow through
trees read as bugs.

### The island's layout is data on NH's tile grid
The outdoors (terrain per tile with cliff tiers, objects with a facing, three homes) is `layout/` data: a default plus the
record's `decor` ops scoped `o` (object), `c` (chunk), `r` (reset), `h` (a home's look) and the rooms' `t` / `u` / `v`. Nav,
heights and validation derive from the layout. The grid is 20 × 80; the editor moves an edge a tile at a time. Why: an
island fully customisable on the tent's grid, through one record path.

### The ground is built on the phone
The ground's geometry and its painted look come from the layout's distance fields, baked per band of chunks on the phone
at load and again only where a change lands. Why: a layout the members change can't ship pre-baked textures, and painting
live every frame would cost what a bake costs once.

### Decor is a last-writer-wins map, the record keeps each item's latest op
Each change of a decoration is one op with the item's whole state or its removal; the layout is the ops merged by id: a
removal beats everything (ids never reused), else the latest `at`, then B over A (`contract/decor.ts`). The record keeps
each item's latest op and checks the item, bounds and the cap (30). Why: commutative and idempotent, so any arrival order
reaches the same layout with no leader, and rows stay as few as the items.

### A room's size never moves or drops a piece
A home's room is one of NH's main rooms, 4 × 4, 6 × 6 or 8 × 8 (none set: 8 × 8), chosen by whoever may arrange it
([The tent](design.md#the-tent)). A smaller room is a square of the largest one's tiles against its front wall, so a
piece's tiles never change; a shrink that would leave a piece outside is refused until it's moved or put away (the
rooms have no storage to send it to); a piece left outside by a race is kept, not drawn, until the room grows. Why:
nothing is ever lost, and old phones and old rows keep working.

### Buildings are doors
The tent, the homes, the museum and the shop open their own screens; a tap on the door walks my villager up to it, then
in. Why: NH's buildings, and the back of the island gets reasons to visit.

### Only a tap on empty ground walks my villager
A tap on an interactable (a tree, a pond, a bug, a find, a visitor, the partner) acts in place: my villager turns to it
and the action plays there. A tap on bare ground runs it there (300 u/s). The exceptions walk up first: a door, the
board, a seat. Why: every tap keeps its meaning and nothing waits for a walk.

### A tap on a seat sits on it
Benches, stools, chairs, the hammock and the beach chair are walked up to and sat or lain on, as a chair or bed in a room;
one villager a seat (a bench two). Nothing new crosses the relay: a villager still on a seat's spot is on it. Why: one
behaviour indoors and out.

### Ambient life from the clock
What the island does on its own is a function of the Tokyo date, the 10-second slot and the shared world, with PRNGs
keyed by date, slot and kind on the relay's clock (`island/ambient.ts`). Why: every phone shows the same outings,
visitors and critters with no messages, no leader and nothing stored.

### A shared world: the seed for what comes, the relay for what we do
What comes by itself (a critter's water, spot and path, the day's shells, 4 dig spots, weeds) is a function of the date,
slot and world coordinates. What a person does is a small intent (`catch`, `pick`, `put`, `shake`, `world`, `walk`,
`act`, ≤ 100 bytes) the room keeps for the Tokyo day and replays; both phones fold the day in the relay's order
(`sync/world-day.ts`), so first wins. The record keeps one `island` row per person and day for when the room has nothing.
Why: only outcomes cross, at far below the Free plan's limits.

### One island, each villager its own phone's
Every phone shows the same island: A's home on the left, B's on the right. A person's phone owns their villager: each
walk crosses as the very walk (`walk {to, from, via, s, ms}` on the relay's clock), and the others play it from the same
start at the same time. Why: replaying only a tap's target let the phones drift.

### A villager stays where it was left
A villager stays where its last walk ended, however long its phone is gone; the room carries each person's last walk
into each new day. Gone quiet inside a room, it comes out at the door 3 minutes later. While I'm in the shop, museum or a
room, other phones show me nowhere. Why: a villager walking itself home read as someone else moving it.

### A villager's phrase is presence
The say button (bottom right, also in the tent and homes) sends `say {text, sc}`: shown over the speaker for 4 s on the
phones in the same place, kept nowhere. The text is cleaned by `cleanSay` on both phones and the relay (≤ 20 code points)
and drawn as text. Why: a phrase is a moment, not a record.

### A high-five goes over the relay only
A tap on the partner sends `highfive {at}`; the room relays it live, or holds the last one for an absent partner until
their next welcome (a day at most). No record row. Why: instant over the relay, and a row per tap bought nothing.

### A catch is its plate
A catch or a find is its plate in the bottom stack, the icon popping from where it happened; nothing is held over the
head. Why: the stack already says what and by whom.

### Speech balloons stand by their speaker
Every balloon stands by its speaker, at most 40 px off, never over the HUD. Why: the reader must see who speaks.

### Visitors are the director's fourth actor
The visitor moves through the villagers' director, idle life and walk graph. Why: one animation system, paused under a
sheet like the rest.

### K.K. lives on the island
K.K. sits on his stool, a fixed piece of the layout (`kk-stool`, moved in the editor, never deleted): Saturday 18:00–24:00
is his show, by day he plays on request, 00:00–06:00 he dozes. Why: a resident who played once a week would be scenery.

### The balloon flies in the world
The balloon present is a 3D model flying over the island; popped, its landing spot is chosen first (open ground at the
front of the view, `island/presentLanding.ts`) and sent with the `put`. Why: a present must land where it can be seen and
tapped.

### The island's look is shared
設定's 季節 (`pref seasonLook`) and 天気 (`pref weatherMode`) are one each for the island, the last anyone set. The look
forces what the scene shows, never the clock, so it can't change ベル, the ずかん or the shared world's day
(`ui-state/preview.ts`; the dev params feed the same override). Why: one island, one look, without filing real catches
under another day.

### Weather from Tokyo, by the hour
The relay fetches Open-Meteo's JMA forecast on its cron and keeps a 48-hour timeline of NH's skies; phones cache it
([backend](backend.md#the-real-weather)). Winter rain falls as snow; fireworks, meteor and wedding nights stay fine. The
fallbacks are the cached timeline, then the seeded days. Why: one fetch for every phone, hours locked once begun so phones
agree.

### Rain and snow in the world
What falls is instanced in the 3D island, one draw call each, moved in the vertex shader. Why: NH's rain has depth, at no
CPU per particle.

### A player walks half as fast again
A player's villager runs at 300 u/s, walks to an action at 360, walks rooms at 45 model units a second; strolls, visitors
and critters keep their pace. Why: crossing the long island took too long.

## Rooms

### The tent's inside is three.js, its models NH's own, converted
Rooms are true 3D (`components/tent/`), their own chunk, drawn on demand and disposed on the way out. Furniture, rugs and
surfaces are NH's files converted by `scripts/room-models.ts` into compact glTFs and WebPs under `static/room/`; the
converted models may ship. Why: a room to furnish and walk in, costing the island nothing.

### The tent's room is decor ops with a room scope; a drag is presence
A room's layout, wallpaper and floor are `decor` ops scoped `t` / `u` / `v` (`contract/tent.ts`), at most 60 pieces a room.
While a finger holds a piece, its spot crosses as `drag` (presence, never kept); the drop is the op. Why: one record path
for every room, and the partner sees it arranged live.

### Every home is a room; a home's look is its owner's
Each home is the tent's room system with its own scope; a home's look and room are its owner's alone (the tent's
everyone's). Its door is its anchor, so a new look grows round it. Why: three homes, each changing only their own.

### The tent's surfaces are NH's flag
Which pieces hold things is the ACNH spreadsheet's `surface` flag; where things stand is found from the converted model and
kept in items.json. Why: faithful to NH, nothing added by hand.

### The tent's edit mode holds one thing at a time
Holding a piece, a tap on another doesn't take it; a long press does. Why: it was too easy to pick up the wrong thing, and
NH holds one item until it's put down.

### The tent's camera is the player's, its walls cut away
A drag turns the camera round the room, a pinch zooms, 🏠 eases it back; walls between the camera and the room are cut
away. Why: a freer NH room camera.

## Content, art and sound

### Scenery is cosmetic and local
Nothing on the island pays or costs ベル. Flourishes are per phone; seeded content derives from the date so phones agree.
Only finds, tallies and the island day are written. Why: the economy stays computed from the goals.

### Fruit on the tree, wild flowers on the lawn
Each goal's fruit colours in with progress, falls when met and is picked up for the day. The flowers are scenery, watered
for fun. Why: NH's harvest feel, with the goals in one place.

### Shaking a tree
The third tap within 1.2 s shakes; a single tap stays the popup. A nest 1 in 8 (one per tree an hour); two oaks or cedars a
day hold a wrapped present. Why: how people shake trees in NH, never ベル.

### Mushrooms are cosmetic
November's mushrooms have no ずかん page; they go into the pocket to sell (`goods`). Why: NH's mushrooms are crafting
materials with no catalogue page.

### NH's calendar and critters
Each dated NH event is one rule in `island/events.ts`, its host in the visitor slot. 74 of NH's 80 bugs, each where NH keeps
it; sea creatures by diving at bubble spots (their own ずかん page); the 46 freshwater fish by the water NH keeps them in.
Balloon presents hold NH's orderable stock at NH's odds, counted in the ずかん from day tallies. Showers on clear nights,
wishes becoming fragments. Why: NH's world with no new screens and nothing to sync.

### Birthdays and the wedding from the code
Birthdays sit in `PEOPLE` (`config/rules.ts`); the wedding date is the けっこんしき board's `date` (`time/holidays.ts
weddingDate`). Why: one date, changed once, both phones agreeing.

### Group stretching on an Exercise day
The tape deck comes out on a day either of us met 🍑 Exercise; a tap makes everyone stretch once a day. Why: NH's most
fitness-like ritual, tied to the goal that is exercise.

### Official NH art
Official renders and NH's models are fetched or converted by hand into `app/static/`, never hot-linked; `<OfficialArt>`
falls back to our own drawings. Personal use only. Why: the real look, and the app keeps working if the art goes.

### Sound off by default
Music, effects and volume are per device and off until turned on; music is fetched on demand, never precached. Why: an app
opened on a train must never surprise anyone.

### Event music and procedural ambience
NH's event tracks replace the hour's on their days; K.K.'s songs and the wasps' chase cut in and hand back. Surf, wind,
rain, birds and insects are synthesised; a file in the manifest can replace a bed. Why: the island sounds like the game,
with no megabytes under the music.

## ききみみ

The English listening game's decisions in force; detail in [kikimimi](kikimimi.md) and [the mic](kikimimi-mic.md).
- **Lazy:** the sheet and each level's content are their own chunks; the first load gains only the invite listener.
  Why: nothing heavy before it's opened.
- **The host is the clock:** the host's `skip` is its position, beaconed every 3 s; every phone adopts it. A lobby is
  local until 「みんなを さそう」. Why: a computed schedule drifted after one lost message.
- **Modes and options ride on the seed's bits** (たいせん, スピード はしご, the answer timer), and the host picks the least
  repeated of 24 seeds. Why: no relay deploy, and every phone deals the same deck.
- **A level shows only when every item has a clip.** Why: the clips are the readiness signal, nothing to flip.
- **American English first;** UK/AU only as tagged accent exposure (≤ 10 %) at やま and ほし. Why: the learners' target,
  with a little variety at the top.
- **Audio in packs** (whole m4a files with a byte index), fetched once per game and cached. Why: Pages' 20,000-file
  limit, and few refetches when a clip changes.
- **`play` beside `quiz`:** later games send `play`; the quiz keeps `quiz` (`QUIZ_ON_PLAY` off) until every phone runs a
  build that knows `play`. Why: an older phone must still hear it.
- **The microphone** is off by default and per phone; recordings stay in memory for their round; recognition runs on the
  phone first, with disclosed fallbacks; no transcript or speaking score leaves the phone. Why: the voice is the most
  personal data the app would touch.

## Trips and offline

### The trip map
MapLibre GL JS on OpenFreeMap's public vector tiles in a NookPhone style of our own ([travel](travel.md#maps)), labels in
our fonts; the CSP gains only `https://tiles.openfreemap.org` in `connect-src`; geolocation only when the locate button is
tapped, never leaving the phone. Why: real open maps with no keys or ops.

### Offline
What a phone has shown stays available offline: trip covers, trail tracks and common fonts precached; guide photos,
MapLibre and drawn tiles kept on first view, bounded ([backend](backend.md#service-worker)). A trip or trail area can be
saved ahead by hand (150 MB in all, per-area caps; nothing downloads by itself). Why: trips are read where the signal is
worst, without costing every phone every deploy.
