# Decisions

The decisions in force, each with its reason; the rule itself lives where it is linked (the numbers in the code:
`app/src/lib/config/rules.ts`, `contract/`). If this file and the code disagree, the code wins. Who asked for what, and
when, is in the git log.

## Data and backend

### The record on the relay
The data of record is SQLite in a Durable Object on the relay (`IslandStore`, [backend](backend.md#the-record);
backups: [runbook §6](ops/runbook.md#6-backups)); no Google Sheet, no Apps Script. Why: the Apps Script took 1–15 s a
request; the record answers in ~0.1 s at ~1 % of the Free plan, and one copy of the health data is one fewer to guard.

### Logging and observability
Logs live in their own Durable Object (`IslandLog`), capped, allow-listed, never a record's value
([observability](ops/observability.md)). Why: a restore of the record must not roll back an incident's logs, a runaway
log must never stop the record's writes, and a trail needs no second copy of private data or a paid service.

### Per-person keys
`KEY_A`, `KEY_B` (and the guest's `KEY_C`) are Worker secrets; a key identifies its person and travels in a `text/plain`
POST body, never the URL. Why: no accounts for three people, and no CORS preflight.

### Append-only, computed on read
The record holds raw rows stamped with the server's `at`; the app computes ベル, locks and the wallet on read. Why: no
ledger, no scheduler, the rules in one place.

### Local-first sync
The app paints from its snapshot, polls for newer rows and queues optimistic taps until acked
([backend](backend.md#client-sync)). Why: a tap must never wait for the network, and an unchanged phone shouldn't fetch
at all.

### The record serves only what the app reads
`snapshot` sends, and the record accepts, only known metric and event types and persons. Why: the app never needs code
for rows it doesn't produce.

### Live relay on Cloudflare
While the app is open and visible, a WebSocket to the island room (`relay/`, [backend](backend.md#live-relay)) relays
small intents, never positions; the record is its own object, so a room outage loses liveness, never data. Why: the Free
plan needs no payment method, hibernation makes idle sockets free, and the edge is ~20 ms from Tokyo.

### Relay versions side by side
The relay speaks every version in `LIVE_VS` (today `[3]`); any other is closed 4004 and the phone parks until a reload.
A change ships relay first, then the app; the old version goes once the `ws.hello` log shows every phone on the new one;
new fields are additive. Why: the phones update at different times, and a hard switch would cut whichever updated last.

### Push through the relay
When the record changes the room tells the open phones to fetch now ([backend](backend.md#push)); polling stays. Why: a
partner's steps and buys show within a second, and a current phone skips its fetch.

### Shortcut health sync
Each iPhone runs one built-in Shortcut posting daily totals when an everyday app opens, at most every 10 minutes
([shortcut](ops/shortcut-health-sync.md)); latest wins; health rows are never compacted or pruned. Why: no third-party
app, nothing manual; Health is the truth, up or down.

### No manual input
The app never enters health data and asks nothing day to day; the meal log is the one exception (below). Why: the daily
loop needs no taps, and a second source would conflict with Health.

### No notifications
No notification of any kind (no Web Push, no service worker `push`); in-app banners and the relay's record-change notice
stay. Why: nobody used it, and it was the one piece of iOS-only, hard-to-test machinery.

## Players and privacy

### No privacy rules
Everything is visible to both members. Why: two people, one game. The guest is the one exception.

### The guest
A third person plays as a guest ([design](design.md#the-guest), [backend](backend.md#the-guest)): it plays, but never
sees the members' からだ figures or profiles nor writes the economy or the real-world records, enforced by the record and
the room (`contract/guest.ts`). Why: a guest who plays but doesn't earn; a rule only the UI kept would leak via the cache.

### Profile
Each person's sex, birth date and BMI standard are prefs, private like the body data (`rowsFor`: a member's to the
members, the guest's to the guest). Height is derived from Health's weight and BMI; energy is Mifflin–St Jeor plus
Apple's Move; suggested goals never override a set one; the BMI standard defaults to Asian cut-offs (JASSO, 23 / 25).
Why: right for East Asian bodies, nothing extra to keep in step, and only what a phone may show is ever on it.

### Player avatars
A and B are NH human players by default (a villager is an option), all clothing free; the default look, いつもの, is code,
never a row, and an unknown part reads as いつもの's ([backend](backend.md#the-look), [design](design.md#players)). Why: no
inventory to sync, a retune reaches everyone, and a newer app's part never breaks an older phone.

### すがた: one dresser, kept on leaving
すがた is one level: one stage, six tabs (コーデ · かお · かみ · ふく · こもの · むらびと); the villager pick joins the draft
like a garment, and `villager` and `look` are sent once on leaving (no けってい; もどす and a 5 s とりけす cover regret).
Why: one commit model on one screen, as NH's wardrobe.

## Health and meals

### Health trends (けんこう)
The dumbbell's popup shows the Health data over time, one person at a time, computed on read, plain numbers with no
smoothing ([design](design.md#kenkou)). Why: a trainer needs exact numbers anyone can check against the bars.

### No-watch days
<a id="no-watch-days"></a>A day with Move, Exercise and Stand all 0 or absent is no data for those three everywhere
outside the ベル (`model/health.ts activityOn`); steps stay; rows are never rewritten. Why: the Shortcut's Fill Missing
sends 0 for a day without samples, which pinned TDEEs at the floor and dragged averages down; for the ベル a 0 and a
missing value earn alike.

### Goal directions
One registry (`contract/goals.ts` GOALS) holds every chart's goal: its pref, range, history and direction (at least, at
most, or near a value), read by the record, the model and the screens. Exercise and Stand goals are けんこう's lines only;
the ベル keep the fixed 60 / 120. Why: a chip that says which way reads at a glance, and a lower weight is never rewarded.

### Low kcal goals: warn, allow
<a id="low-kcal-goals-warn-allow"></a>A kcal goal under resting energy or the safe floor (1,500 kcal a man, 1,200 a woman
or unknown) gets an inline note and still saves. Why: a goal is the person's call; a hard floor would refuse a supervised
plan.

### Meal log
ごはん is typed in by the person ([design](design.md#gohan), the `food` op: [backend](backend.md#events)): a per-100 g
snapshot of the food, edited only by its logger, seen by everyone, never earning ベル (`deps.test.ts`); a repeat's or a
change's past never changes. Why: the calorie tracker in the island, with history that never rewrites itself.

### Fibre and alcohol
食物繊維 and アルコール are optional snapshot keys (`fi`, `al`), kept only when the source says; alcohol counts only drinks.
Default goals: fibre by the 食事摂取基準 2025, alcohol at most 20 g (健康日本21's 「節度ある適度な飲酒」). Why: unknown never
reads as zero, one plain national line, and nothing older changes.

## Economy

### Bells are play money
Small whole numbers, not tied to yen; no transfers. Why: prices the couple chooses, no real money at stake.

### A stamp card
Per person per Tokyo day, a ベル per daily goal met, がんばり at 1.5×, ふたりでぜんぶ when both meet all four
([design](design.md#goals)); earnings recomputed from the rows. Why: numbers a child can add up, and the bonus makes it
a team effort.

### Four automatic fruits
🍐 Move, 🍑 Exercise, 🍒 Stand, 🍎 Steps ([design](design.md#goals)); the Move and steps goals apply from the Tokyo day
they are set. Why: the Watch measures them with no effort, and the past must not re-price.

### Economy start
The first week with an activity row, stamped by its lock ([design](design.md#the-first-week)). Why: no start date in
code, and old days can't earn.

### Harvest and week lock
Sunday 19:30 the recap opens (ceremony only); the Wednesday 04:00 after, the week's earnings lock, spends never
([design](design.md#harvest-and-lock)). Why: a grace period for late syncs, then the past stays put.

### A wallet each, two rewards
Each person earns into and buys from their own wallet (ふたりでぜんぶ split +1 each), two treats, おやつ 20 and 外食 35
([design](design.md#rewards)); either person erases any buy (`spend_void`). Why: the user (2026-11-10) wanted each
to earn and spend their own; prices halved with the wallets. Until 2026-11-11 04:00 JST one shared wallet at 40 / 70
(every old buy kept as it was), then halved into the two.

### Weight never earns
Shown only, with an optional goal. Why: paying for kilograms rewards crash diets and punishes muscle.

### The shop's かいがら
The shop ([design](design.md#the-shop)), a counter screen, has its own per-person currency, かいがら, never ベル, at
NH's sell : buy ratio (a piece NH never sells: 4 × its NH sell price, NH's own ratio, then the same ÷ 20), a piece at most
10,000 (2026-11-10: every piece buyable; a 100,000-Bell cap had left 65 out); the pocket is
derived from the day tallies, the stock from the date. Why: NH's prices, nothing
stored for the stock, and no request per catch.

## App and hosting

### PWA on Cloudflare Pages
A static SvelteKit SPA at https://island-fund.pages.dev, deployed from CI after the gate, with a strict CSP and security
headers ([runbook §1](ops/runbook.md#1-deploy-the-ui)); without a key it shows only pairing or `?demo`; no key or data
in the repo. Why: the pairing key is in localStorage, so the origin must be ours alone, and Pages can set headers.

### Offline shell
The service worker precaches the build (not audio, art beyond the defaults or the trip photos), opens this version's
cached shell at once, and keeps one previous version for a stale page's chunks
([backend](backend.md#service-worker)). Why: the app opens instantly and offline.

### Japanese first
Japanese by default, English per person (`pref locale`), each catalog loaded when first needed. Why: both live in Japan,
and the first load stays small.

### Copy: spaced kana in the world, kanji in the sheets
The island world and its HUD keep spaced kana; every sheet, panel, dialog and form, and the leaf menu's pills, use
natural Japanese with kanji, one spelling a term ([design](design.md#copy)). Why: the world's voice is NH's kana; adults
read kanji faster, and keep-all would make an unspaced sentence one word.

### Always animated
No reduced-motion variants. Why: one code path is simpler.

### 設定 trimmed; the island arranged in /editor only
The main island is edited only from /editor (the tent's もようがえ stays the room's); the game draws at most 30 frames a
second. Why: fewer controls, one place to arrange the island, and a cooler phone.

## The island world

### The island in 3D: three.js under the DOM island
The island is drawn in three.js (`components/world3d/`): NH's models on the editable layout, the ground built on the
phone ([island layout](island-layout.md)); the DOM island runs over the canvas as the tap areas, popups and marks.
Without WebGL the island shows a line and the rest of the app works; no 2D fallback. Why: reusing the model, director,
nav, sync and overlays meant only drawing and hit-testing were new, and iPhone 15 / 16 Safari always have WebGL.

### Free scrolling
Only the finger moves the camera: one finger scrolls along the island, two pinch the zoom; no snap, no sections, no
automatic camera move (the board's focus is the one exception). Why: a camera that moves by itself fights the finger.

### Lights in depth
The time of day's tint and a wet day's darkening are applied at the source, so a light sorts in depth and stays
untinted. Every lamp is emissive with a halo; the few real point lights go to the lamps nearest the view's centre with
hysteresis and fade, so a light never pops. Why: lights that pop or glow through trees read as bugs.

### The island's layout is data on NH's tile grid
The outdoors (terrain per tile with cliff tiers, objects, three homes) is `layout/` data: a default plus the record's
`decor` ops ([island layout](island-layout.md#the-layout-is-data)); nav, heights and validation derive from it. Why: an
island fully customisable on the tent's grid, through one record path.

### The ground is built on the phone
The ground's geometry and painted look are baked on the phone from the layout's distance fields, again only where a
change lands ([island layout](island-layout.md#the-3d-ground)). Why: a layout the members change can't ship pre-baked
textures, and painting live every frame would cost what a bake costs once.

### Decor is a last-writer-wins map, the record keeps each item's latest op
Each change of a decoration is one op with the item's whole state or its removal, merged by id (a removal beats
everything, else the latest `at`, then G over B over A: `contract/decor.ts`); the record keeps each item's latest op.
Why: commutative and idempotent, so any arrival order reaches the same layout with no leader, and rows stay as few as
the items.

### A room's size never moves or drops a piece
A home's room is one of NH's main rooms (4 × 4, 6 × 6 or 8 × 8), a smaller one a square of the largest's tiles against
its front wall; a shrink that would leave a piece outside is refused ([The tent](design.md#the-tent)). Why: nothing is
ever lost, and old phones and old rows keep working.

### Buildings are doors
The tent, the homes, the museum and the shop open their own screens; a tap on the door walks my villager up, then in.
Why: NH's buildings, and the back of the island gets reasons to visit.

### Only a tap on empty ground walks my villager
A tap on an interactable acts in place (my villager turns to it); a tap on bare ground runs it there; a door, the board
and a seat walk up first ([design](design.md#walking)). Why: every tap keeps its meaning and nothing waits for a walk.

### A tap on a seat sits on it
Benches, stools, chairs, the hammock and the beach chair are walked up to and sat or lain on, one villager a seat (a
bench two); nothing new crosses the relay. Why: one behaviour indoors and out.

### Ambient life from the clock
What the island does on its own is a function of the Tokyo date, the 10-second slot and the shared world, on the relay's
clock (`island/ambient.ts`, [backend](backend.md#ambient-life)). Why: every phone shows the same outings, visitors and
critters with no messages, no leader and nothing stored.

### A shared world: the seed for what comes, the relay for what we do
What comes by itself is a function of the date, slot and place; what a person does is a small intent the room keeps
for the Tokyo day and replays in its order, so first wins ([backend](backend.md#shared-world)). Why: only outcomes cross,
far below the Free plan's limits.

### One island, each villager its own phone's
Every phone shows the same island, A's home on the left, B's on the right; a person's phone owns their villager, and
each walk crosses as the very walk, replayed from the same start at the same time ([design](design.md#shared-world)).
Why: replaying only a tap's target let the phones drift.

### A villager stays where it was left
A villager stays where its last walk ended, however long its phone is gone; gone quiet inside a room, it comes out at
the door; in the shop, the museum or a room, I'm nowhere on the others' islands ([backend](backend.md#shared-world)).
Why: a villager walking itself home read as someone else moving it.

### Sleep by presence
Everyone's villager is awake while its person's app is open and asleep where it stands while it's closed, at any hour,
by the relay's presence and clock ([design](design.md#sleep)). Why: one rule everyone can read off the island, and all
open phones agree who sleeps without a message of their own.

### A villager's phrase is presence
The say button sends `say {text, sc}`, shown over the speaker for 4 s to the phones in the same place, kept nowhere,
cleaned by `cleanSay` on both sides (≤ 20 code points) and drawn as text. Why: a phrase is a moment, not a record.

### A high-five goes over the relay only
A tap on the partner sends `highfive {at}`, relayed live or held for an absent partner's next welcome (a day at most); no
record row. Why: instant over the relay, and a row per tap bought nothing.

### A catch is its plate
A catch or a find is its plate in the bottom stack, the icon popping from where it happened; nothing over the head. Why:
the stack already says what and by whom.

### Speech balloons stand by their speaker
Every balloon stands by its speaker, at most 40 px off, never over the HUD. Why: the reader must see who speaks.

### Visitors are the director's fourth actor
The visitor moves through the villagers' director, idle life and walk graph. Why: one animation system, paused under a
sheet like the rest.

### K.K. lives on the island
K.K. sits on his stool, a fixed piece of the layout (moved in the editor, never deleted): his show on Saturday nights,
songs on request by day, dozing after midnight ([design](design.md#kk-on-his-stool)). Why: a resident who played once a
week would be scenery.

### The balloon flies in the world
The balloon present is a 3D model over the island; popped, its landing spot is chosen first (open ground at the front of
the view, `island/presentLanding.ts`) and sent with the `put`. Why: a present must land where it can be seen and tapped.

### The island's look is shared
設定's 季節 (`pref seasonLook`) and 天気 (`pref weatherMode`) are one each for the island, the last anyone set; the look
forces what the scene shows, never the clock (`ui-state/preview.ts`). Why: one island, one look, without filing real
catches under another day.

### Weather from Tokyo, by the hour
The relay fetches Open-Meteo's JMA forecast on its cron and keeps a 48-hour timeline of NH's skies that phones cache
([backend](backend.md#the-real-weather)); winter rain falls as snow; fireworks, meteor and wedding nights stay fine. Why:
one fetch for every phone, hours locked once begun so phones agree.

### Rain and snow in the world
What falls is instanced in the 3D island, one draw call each, moved in the vertex shader. Why: NH's rain has depth, at no
CPU per particle.

### A player walks half as fast again
A player's villager runs at 300 u/s and walks to an action at 360; strolls, visitors and critters keep their pace. Why:
crossing the long island took too long.

## Rooms

### The tent's inside is three.js, its models NH's own, converted
Rooms are true 3D (`components/tent/`), their own chunk, drawn on demand with the island's renderer lifecycle
(`world3d/stage.ts`); NH's furniture, rugs and surfaces converted by `scripts/room-models.ts` may ship
([design](design.md#the-tent)). Why: a room to furnish and walk in, costing the island nothing.

### The tent's room is decor ops with a room scope; a drag is presence
A room's layout, wallpaper and floor are `decor` ops scoped `t` / `u` / `v` (`contract/tent.ts`, at most 60 pieces a
room); a held piece's spot crosses as `drag` (presence), the drop is the op. Why: one record path for every room, and the
partner sees it arranged live.

### Every home is a room; a home's look is its owner's, its room anyone's
Each home is the tent's room system with its own scope; its look its owner's alone, its room arranged by any of the
three (2026-11-10, the user: until then each room its owner's, the tent's everyone's), with the editor's own pieces
(placing spends nothing, putting away returns nothing: a piece is owned as a catalogue entry); its door is its anchor.
The record and the room enforce it (`scopeMayWrite`, `scopeMaySend`). Why: decorating each other's homes is the game's
fun, and with nothing consumed there's no inventory to hand back.

### The tent's surfaces are NH's flag
Which pieces hold things is the ACNH spreadsheet's `surface` flag; where things stand is found from the converted model
and kept in items.json. Why: faithful to NH, nothing added by hand.

### The tent's edit mode holds one thing at a time
Holding a piece, a tap on another doesn't take it; a long press does. Why: it was too easy to pick up the wrong thing,
and NH holds one item until it's put down.

### The tent's camera is the player's, its walls cut away
A drag turns the camera round the room, a pinch zooms, 🏠 eases it back; walls between the camera and the room are cut
away. Why: a freer NH room camera.

## Content, art and sound

### Scenery is cosmetic and local
Nothing on the island pays or costs ベル; flourishes are per phone, seeded content from the date; only finds, tallies and
the island day are written. Why: the economy stays computed from the goals.

### Fruit on the tree, wild flowers on the lawn
Each goal's fruit colours in with progress, falls when met and is picked up for the day; the flowers are scenery. Why:
NH's harvest feel, with the goals in one place.

### Shaking a tree
The third tap within 1.2 s shakes; a single tap stays the popup ([design](design.md#shaking-a-tree)). Why: how people
shake trees in NH, never ベル.

### Mushrooms are cosmetic
November's mushrooms have no ずかん page; they go into the pocket to sell (`goods`). Why: NH's mushrooms are crafting
materials with no catalogue page.

### NH's calendar and critters
Each dated NH event is one rule in `island/events.ts`, its host in the visitor slot; NH's bugs, fish and sea creatures
where NH keeps them, and balloon presents at NH's odds ([design](design.md#critters)). Why: NH's world with no new
screens and nothing to sync.

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
Music, effects and volume are per device and off until turned on; music is fetched on demand, never precached. Why: an
app opened on a train must never surprise anyone.

### Event music and procedural ambience
NH's event tracks replace the hour's on their days; surf, wind, rain, birds and insects are synthesised
([design](design.md#event-music)). Why: the island sounds like the game, with no megabytes under the music.

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
- **Audio in packs** (whole m4a files with a byte index), each fetched whole and once, its clips cut from it; Pages
  static, no R2. Why: Pages' 20,000-file limit, and few refetches when a clip changes.
- **`play` beside `quiz`:** later games send `play`; the quiz too since every phone runs a build that knows it
  (`QUIZ_ON_PLAY`). Why: an older phone must still hear it.
- **The microphone** is off by default and per phone; recordings stay in memory for their round; recognition runs on the
  phone first, with disclosed fallbacks; no transcript or speaking score leaves the phone. Why: the voice is the most
  personal data the app would touch.

## Trips and offline

### The trip map
MapLibre GL JS on OpenFreeMap's public vector tiles in a NookPhone style of our own ([travel](travel.md#maps)); the CSP
gains only `https://tiles.openfreemap.org` in `connect-src`; geolocation only when the locate button is tapped, never
leaving the phone. Why: real open maps with no keys or ops.

### Offline
What a phone has shown stays available offline, bounded ([backend](backend.md#service-worker)); a trip or trail area
can be saved ahead by hand (150 MB in all; nothing downloads by itself). Why: trips are read where the signal is worst,
without costing every phone every deploy.
