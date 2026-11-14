# Decisions

The decisions in force, each with its reason; the rule itself lives where it is linked (the numbers:
`app/src/lib/config/rules.ts`, `contract/`). If this file and the code disagree, the code wins.

## Data and backend

### The record on the relay
The data of record is SQLite in a Durable Object on the relay (`IslandStore`, [backend](backend.md#the-record);
backups: [runbook §6](ops/runbook.md#6-backups)). Why: ~0.1 s a request at ~1 % of the Free plan, and one copy of the
health data is one fewer to guard.

### Logging and observability
Logs live in their own Durable Object (`IslandLog`), capped, allow-listed, never a record's value
([observability](ops/observability.md)). Why: a restore must not roll back the logs, a runaway log must never stop the
record's writes, and a trail needs no private data.

### The gym bot
A LINE bot for a gym's free slots runs as its own Worker (`gym/`, [its README](../gym/README.md)) on the relay's
account; ボット → ジム reads its public `/status` and, with a member key, `/gym/config` and `/gym/act`. Why: no machine
or tunnel to keep alive, its deploys never touch the relay's, and a status of totals and codes needs no keys.

### The ITS booker
The 保養所 booker is the `its-bot` Worker (settings, record, verdict) plus a runner on GitHub Actions that checks out
main each run ([its/README.md](../its/README.md)). Why: no Mac to keep awake, the site's Turnstile needs a real headed
Chrome (a hosted runner has one, a Worker can't), and both fit the Free plans. Each run dispatches the next as it ends,
and the Worker's 5-min cron dispatches one when no runner reports (its/README.md "Watchdog"). Why: GitHub drops most
scheduled ticks, which left hours with no runner and no error; a cron, not the object's alarm, needs nothing to arm it.

### Per-person keys
`KEY_A`, `KEY_B` (and the guest's `KEY_C`) are Worker secrets; a key identifies its person and travels in a `text/plain`
POST body, never the URL. Why: no accounts for three people, and no CORS preflight.

### Append-only, computed on read
The record holds raw rows stamped with the server's `at`; the app computes ベル, locks and the wallet on read. Why: no
ledger, no scheduler, the rules in one place.

### Local-first sync
The app paints from its snapshot, polls for newer rows and queues optimistic taps until acked
([backend](backend.md#client-sync)). Why: a tap never waits for the network, and an unchanged phone fetches nothing.

### The record serves only what the app reads
`snapshot` sends, and the record accepts, only known metric and event types and persons. Why: the app never needs code
for rows it doesn't produce.

### Live relay on Cloudflare
While the app is visible, a WebSocket to the island room (`relay/`, [backend](backend.md#live-relay)) relays small
intents, never positions; the record is its own object, so a room outage loses liveness, never data. Why: the Free plan,
hibernation makes idle sockets free, and the edge is ~20 ms from Tokyo.

### Relay versions side by side
The relay speaks every version in `LIVE_VS`; any other is closed 4004. A change ships relay first, then the app; the old
version goes once the log shows every phone on the new one (the phones' `ws.close` `v`: `npm run logs -- report`'s
*Live protocol*). Why: the phones update at different times.

### Push through the relay
When the record changes the room tells the open phones to fetch now ([backend](backend.md#push)); polling stays. Why: a
partner's steps and buys show within a second, and a current phone skips its fetch.

### Shortcut health sync
Each iPhone runs one built-in Shortcut posting daily totals when an everyday app opens
([shortcut](ops/shortcut-health-sync.md)); latest wins; health rows are never compacted or pruned. Why: no third-party
app, nothing manual; Health is the truth, up or down.

### No manual input
The app never enters health data and asks nothing day to day; the meal log is the one exception. Why: the daily loop
needs no taps, and a second source would conflict with Health.

### No notifications
No notification of any kind (no Web Push, no service worker `push`); in-app banners and the relay's record-change notice
stay. Why: unused, and the one piece of iOS-only, hard-to-test machinery. One exception, 保養所: ITS holds and
confirmations, opt-in per phone in ボット → 保養所, members only, from the its-bot Worker
(its/README.md "Push"). Why: a hold lapses in 30 min and the site's mail was the only alert; the game, the island and
health stay push-free.

## Players and privacy

### No privacy rules
Everything is visible to both members. Why: two people, one game. The guest is the one exception.

### The guest
A third person plays as a guest ([design](design.md#the-guest), [backend](backend.md#the-guest)) but never sees the
members' からだ figures or profiles nor writes the economy or the real-world records, enforced by the record and the
room (`contract/guest.ts`). Why: a guest who plays but doesn't earn; a rule only the UI kept would leak via the cache.

### Profile
Sex, birth date and BMI standard are private prefs like the body data ([backend](backend.md#the-guest) `rowsFor`); the
BMI standard defaults to Asian cut-offs (JASSO, 23 / 25), and a suggested goal never overrides a set one. Why: right for
East Asian bodies, and only what a phone may show is ever on it.

### Player avatars
A and B are NH human players by default (a villager is an option), all clothing free; the default look, いつもの, is code,
never a row, and an unknown part reads as いつもの's ([backend](backend.md#the-look), [design](design.md#players)). Why: no
inventory to sync, a retune reaches everyone, and a newer app's part never breaks an older phone.

### すがた: one dresser, kept on leaving
One stage, six tabs (コーデ · 顔 · 髪 · 服 · 小物 · 住民; [players](players.md)); the villager pick joins the draft like a
garment, and `villager` and `look` are sent once on leaving (no 決定; 元に戻す and a 5 s 取り消す cover regret). Why: one
commit model on one screen, as NH's wardrobe.

## Health and meals

### Health trends (健康)
The dumbbell's popup shows the Health data over time, one person at a time, computed on read, plain numbers with no
smoothing ([design](design.md#kenkou)). Why: exact numbers anyone can check against the bars.

### No-watch days
<a id="no-watch-days"></a>A day with Move, Exercise and Stand all 0 or absent is no data for those three outside the
ベル (`model/health.ts activityOn`); rows are never rewritten. Why: the Shortcut sends 0 for a day without samples,
which dragged TDEEs and averages down; for the ベル a 0 and a missing value earn alike.

### Goal directions
One registry (`contract/goals.ts` GOALS) holds every chart's goal and its direction (at least, at most, or near a
value); Exercise and Stand goals are 健康's lines only, the ベル keep 60 / 120. Why: a chip that says which way reads at
a glance, and a lower weight is never rewarded.

### Low kcal goals: warn, allow
<a id="low-kcal-goals-warn-allow"></a>A kcal goal under resting energy or the safe floor (1,500 kcal a man, 1,200 a woman
or unknown) gets an inline note and still saves. Why: a goal is the person's call; a hard floor would refuse a supervised
plan.

### Meal log
ごはん is typed in by the person ([design](design.md#gohan), the `food` op: [backend](backend.md#events)): a per-100 g
snapshot of the food, edited only by its logger, seen by everyone, never earning ベル (`deps.test.ts`); a repeat's or a
change's past never changes. Why: a calorie tracker whose history never rewrites itself.

### Portion steps
−/＋ start at ×0.5: by halves to ×20, a counted portion (個 · 枚 · 本 …, a piece food's 1人前) by halves to ×2 and
whole ones after; 作る量 stays whole. Why: half an apple or 1½ slices is what people eat and estimate by eye; finer
than ½ is the grams field's job, and a counted ×1 → ×5 is five taps, not eight.

### Fibre and alcohol
食物繊維 and アルコール are optional snapshot keys (`fi`, `al`), kept only when the source says; default goals from the
食事摂取基準 2025 and 健康日本21 (alcohol at most 20 g). Why: unknown never reads as zero, and one plain national line.

### Kalori as a lazy dataset
kalori.jp's chain and konbini menus ship as `kalori.json` in `static/food/`, a lazy secondary dataset like the products:
in git and on Pages, the guest's and the demo's search alike; values per serving, estimates labelled and never ✓n
([food-data](food-data.md#kalori)). Why: chain meals are what we eat out, and the owner chose (the call recorded in
the commit) to publish kalori.jp's data in this public repo, knowingly superseding the rule that its terms (第8条) kept
it out, behind a members-only relay route (Workers KV, a key, its own cache and upload script); one way in for every
dataset beats that route for one of them.

### Kalori's raw data in releases, the scraper in food-data
`kalori_scrape.py` lives in `food-data/scripts/` and runs in `kalori-scrape.yml`; its output is a dated release
(`kalori-data.tar.gz`), which `fetch.py`'s `KALORI_TAG` pins ([food-data](food-data.md#kalori)). Why: ~70 MB of shards
rewritten each refresh would bloat every clone, in a branch or a repo of its own; a pinned, checksummed release is an
immutable input for each shipped `kalori.json`, and the merged pin is the accepted baseline (a rejected release is
never seeded or diffed from); and the weekly refresh lands as a PR the owner merges, so one repo beats two.

## Economy

### Bells are play money
Small whole numbers, not tied to yen; no transfers. Why: prices the couple chooses, no real money at stake.

### A stamp card
Per person per Tokyo day, a ベル per daily goal met, がんばり at 1.5×, ふたりでぜんぶ when both meet all four
([design](design.md#goals)), recomputed from the rows. Why: numbers a child can add up, and the bonus makes it a team
effort.

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
Each person earns into and buys from their own wallet, two treats at halved prices ([design](design.md#rewards));
either person erases any buy, and a buy may name its day. Why: each spends their own, an old buy keeps its price, and a
treat logged late is judged by that day's wallet.

### Weight never earns
Shown only, with an optional goal. Why: paying for kilograms rewards crash diets and punishes muscle.

### The shop's かいがら
The shop ([design](design.md#the-shop)), a 3D room, has its own per-person currency, かいがら, never ベル: NH's prices
÷ 20 both ways (a piece NH never sells: 4 × its sell price), every piece buyable; the pocket is derived from the day
tallies, the stock from the date. Why: NH's prices, nothing stored for the stock, and no request per catch.

## App and hosting

### PWA on Cloudflare Pages
A static SvelteKit SPA on Pages, deployed from CI after the gate, with a strict CSP
([runbook §1](ops/runbook.md#1-deploy-the-ui)); without a key it shows only pairing. Why: the pairing key is
in localStorage, so the origin must be ours alone.

### Test mode, not a demo
`?demo`'s made-up data and hooks are a test harness: on in the dev server and, in the shipped build, only in a test's
browser (`localStorage['e2e.testMode']`, [testing](ops/testing.md#test-mode)); a visitor's `?demo` is the normal app.
A feature's Worker is faked by its spec's route mock, never by an in-app fixture. The param keeps its name. Why: no one
uses a demo, the e2e must test the very build that ships, and in-app fakes are code that only tests read.

### Offline shell
The service worker precaches the build (not audio, art beyond the defaults or the trip photos), opens this version's
cached shell at once, and keeps one previous version for a stale page's chunks ([backend](backend.md#service-worker)).
Why: the app opens instantly and offline.

### Japanese first
Japanese by default, English per person (`pref locale`), each catalog loaded when first needed. Why: both live in Japan,
and the first load stays small.

### Copy: spaced kana in the world, kanji in the sheets
The island world and its HUD keep spaced kana; every sheet, panel, dialog and form, and the leaf menu's pills, use
natural Japanese with kanji, one spelling a term ([design](design.md#copy)). Why: the world's voice is NH's kana; adults
read kanji faster.

### Always animated
No reduced-motion variants. Why: one code path.

### 設定 trimmed; the island arranged in /editor only
The main island is edited only from /editor (the tent's もようがえ stays the room's); the game draws at most 30 frames a
second. Why: fewer controls, one place to arrange the island, a cooler phone.

## The island world

### The island in 3D: three.js under the DOM island
The island is drawn in three.js (`components/world3d/`): NH's models on the editable layout, the ground built on the
phone ([island layout](island-layout.md)); the DOM island runs over the canvas as the tap areas, popups and marks.
Without WebGL the island shows a line and the rest of the app works; no 2D fallback. Why: the model, director, nav, sync
and overlays were reused, and iPhone 15 / 16 Safari always have WebGL.

### Free scrolling
Only the finger moves the camera: one finger scrolls, two pinch the zoom; no snap, no sections, no automatic camera move
(the board's focus is the one exception). Why: a camera that moves by itself fights the finger.

### Lights in depth
The time of day's tint and a wet day's darkening are applied at the source, so a light sorts in depth and stays
untinted. Every lamp is emissive with a halo; the few real point lights go to the lamps nearest the view's centre with
hysteresis and fade. Why: lights that pop or glow through trees read as bugs.

### The island's layout is data on NH's tile grid
The outdoors (terrain per tile with cliff tiers, objects, three homes) is `layout/` data: a default plus the record's
`decor` ops ([island layout](island-layout.md#the-layout-is-data)); nav, heights and validation derive from it. Why: a
fully customisable island through one record path.

### The ground is built on the phone
The ground's geometry and look are baked on the phone from the layout, again only where a change lands
([island layout](island-layout.md#the-3d-ground)). Why: an editable layout can't ship pre-baked textures.

### Decor is a last-writer-wins map, the record keeps each item's latest op
Each change of a decoration is one op with the item's whole state or its removal, merged by id (a removal beats
everything, else the latest `at`, then G over B over A: `contract/decor.ts`). Why: commutative and idempotent, so any
arrival order reaches the same layout with no leader, and rows stay as few as the items.

### A room's size never moves or drops a piece
A home's room is one of NH's main rooms (4 × 4, 6 × 6 or 8 × 8), a smaller one a square of the largest's tiles against
its front wall; a shrink that would leave a piece outside is refused ([The tent](design.md#the-tent)). Why: nothing is
lost, and old phones and rows keep working.

### Buildings are doors
The tent, the homes, the museum and the shop open their own screens; a tap on the door walks up, then in. Why: NH's
buildings, and reasons to visit the back of the island.

### Only a tap on empty ground walks my villager
A tap on an interactable acts in place (my villager turns to it); a tap on bare ground runs it there; a door, the board
and a seat walk up first ([design](design.md#walking)). Why: every tap keeps its meaning and nothing waits for a walk.

### A tap on a seat sits on it
Seats, the hammock and the beach chair are walked up to and sat or lain on, one villager a seat (a bench two); nothing
new crosses the relay. Why: one behaviour indoors and out.

### Ambient life from the clock
What the island does on its own is a function of the Tokyo date, the 10-second slot and the shared world, on the relay's
clock ([backend](backend.md#ambient-life)). Why: every phone shows the same life with no messages and nothing stored.

### A shared world: the seed for what comes, the relay for what we do
What comes by itself is a function of the date, slot and place; what a person does is a small intent the room keeps for
the Tokyo day and replays in order, so first wins ([backend](backend.md#shared-world)). Why: only outcomes cross, far
below the Free plan's limits.

### One island, each villager its own phone's
Every phone shows the same island, A's home on the left, B's on the right; a person's phone owns their villager, and each
walk crosses as the very walk, replayed from the same start at the same time ([design](design.md#shared-world)). Why:
replaying only a tap's target let the phones drift.

### A villager stays where it was left
A villager stays where its last walk ended, however long its phone is gone; gone quiet inside a room, it comes out at
the door; in the shop, the museum or a room, I'm nowhere on the others' islands ([backend](backend.md#shared-world)).
Why: a villager walking itself home read as someone else moving it.

### Sleep by presence
A villager is awake while its person's app is open and asleep where it stands while it's closed, at any hour, by the
relay's presence and clock ([design](design.md#sleep)). Why: one rule anyone can read off the island, agreed without a
message.

### A villager's phrase is presence
The say button sends `say {text, sc}`, shown over the speaker for 4 s to the phones in the same place, kept nowhere,
cleaned by `cleanSay` on both sides (≤ 20 code points) and drawn as text. Why: a phrase is a moment, not a record.

### A high-five goes over the relay only
A tap on the partner sends `highfive {at}`, relayed live or held for an absent partner's next welcome (a day at most); no
record row. Why: instant, and a row per tap bought nothing.

### A catch is its plate
A catch or a find is its plate in the bottom stack, the icon popping from where it happened; nothing over the head. Why:
the stack already says what and by whom.

### Speech balloons stand by their speaker
Every balloon stands by its speaker, at most 40 px off, never over the HUD. Why: the reader must see who speaks.

### Special characters: one guest a day, one framework
NH's special characters come one a day through the visitors' slot, each with a role (shop, gift, fortune, fish, cheer,
chat) that one framework plays from per-character data ([design](design.md#visitors-roles)). Why: all of NH's cast
without a screen or a sync path each.

### Visitors are the director's fourth actor
The visitor moves through the villagers' director, idle life and walk graph. Why: one animation system, paused under a
sheet like the rest.

### K.K. lives on the island
K.K. sits on his stool, a fixed piece of the layout (moved in the editor, never deleted): his show on Saturday nights,
songs on request by day, dozing after midnight ([design](design.md#kk-on-his-stool)). Why: a resident, not scenery.

### The balloon flies in the world
The balloon present is a 3D model over the island; popped, its landing spot is chosen first (open ground at the front of
the view, `world/presentLanding.ts`) and sent with the `put`. Why: a present must land where it can be seen and tapped.

### The island's look is shared
設定's 季節 (`pref seasonLook`) and 天気 (`pref weatherMode`) are one each for the island, the last anyone set; the look
forces what the scene shows, never the clock (`ui-state/preview.ts`). Why: one island, one look, without filing real
catches under another day.

### Weather from Tokyo, by the hour
The relay fetches Open-Meteo's JMA forecast on its cron and keeps a 48-hour timeline of NH's skies that phones cache
([backend](backend.md#the-real-weather)); winter rain falls as snow; fireworks, meteor and wedding nights stay fine. Why:
one fetch for every phone, hours locked once begun so phones agree.

### Rain and snow in the world
Rain and snow are instanced, one draw call each, moved in the vertex shader. Why: depth, at no CPU per particle.

### A player walks half as fast again
A player's villager runs at 300 u/s and walks to an action at 360 (`world/speed.ts`); strolls, visitors and critters
keep their pace. Why: crossing the long island took too long.

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
three with the editor's pieces (placing spends nothing, putting away returns nothing); its door is its anchor. The
record and the room enforce it (`scopeMayWrite`, `scopeMaySend`). Why: decorating each other's homes is the fun, and with
nothing consumed there's no inventory to hand back.

### A room's whole change is one group; undo puts back new pieces
The clear, a saved arrangement called up and their undo are one `group` of decor ops the record keeps all or none, sent
to the other phones by the record's push, not the room's intents; an undo of a removal is a new piece where the old one
stood; saved arrangements are their own event (`room_save`; [backend](backend.md#events)). Why: atomic, no protocol
change (intents are 256 bytes, 20 a second), a removal is final in the decor merge, and older apps skip an unknown event.

### The museum draws one room at a time
Only the room I'm in is drawn; a doorway dips to the next and the camera snaps to its frame ([design](design.md#the-museum)).
Why: NH's museum is a room at a time, and one keeps a phone room's draw calls and memory.

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
Nothing on the island pays or costs ベル; flourishes are per phone, seeded from the date; only finds, tallies and the
island day are written. Why: the economy stays computed from the goals.

### Fruit on the tree, wild flowers on the lawn
Each goal's fruit colours in with progress, falls when met and is picked up for the day; the flowers are scenery. Why:
NH's harvest feel, with the goals in one place.

### Shaking a tree
The third tap within 1.2 s shakes; a single tap opens a goal tree's popup and rustles any other
([design](design.md#shaking-a-tree)). Why: how people shake trees in NH, never ベル.

### Farming: NH 2.0's vegetables on a field each
Starts at the shop, a field each placed in the editor, NH's ÷ 20 prices, 40 plants each, ripe in 3 days and again 3 days
after a harvest, 1–3 by the watering ([farming.md](farming.md)). Why: faithful to NH, worth a daily minute without
outearning fishing; the cadence is the lever, never a price.

### Mushrooms are cosmetic
November's mushrooms have no ずかん page; they go into the pocket to sell (`goods`). Why: NH's mushrooms are crafting
materials with no catalogue page.

### NH's calendar and critters
Each dated NH event is one rule in `world/events.ts`, its host in the visitor slot; NH's bugs, fish and sea creatures
where NH keeps them, and balloon presents at NH's odds ([design](design.md#critters)). Why: NH's world with no new
screens and nothing to sync.

### Birthdays and the wedding from the code
Birthdays sit in `PEOPLE` (`config/rules.ts`); the wedding date is the 結婚式 board's `date` (`time/holidays.ts
weddingDate`). Why: one date, changed once, both phones agreeing.

### Group stretching on an Exercise day
The tape deck comes out on a day either of us met 🍑 Exercise; a tap makes everyone stretch once a day. Why: NH's most
fitness-like ritual, tied to the exercise goal.

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
  local until 「誘う」. Why: a computed schedule drifted after one lost message.
- **Modes and options ride on the seed's bits**, the host picking the least repeated of 24 seeds. Why: no relay deploy,
  and every phone deals the same deck.
- **A level shows only when every item has a clip.** Why: the clips are the readiness signal, nothing to flip.
- **American English first;** UK/AU only as tagged accent exposure (≤ 10 %) at やま and ほし. Why: the learners' target,
  with a little variety at the top.
- **Audio in packs**, each fetched whole and once, on Pages (no R2). Why: Pages' 20,000-file limit.
- **`play` beside `quiz`:** later games send `play`; the quiz too once every phone knows it (`QUIZ_ON_PLAY`). Why: an
  older phone must still hear it.
- **The microphone** is off by default and per phone; recordings stay in memory for their round; recognition runs on
  the phone first, with disclosed fallbacks; no transcript or speaking score leaves the phone. Why: the voice is the
  most personal data the app would touch.
- **Every place playable:** a lane's game offers all five places (catalog.ts `PLACE_LVS`), each with content of its own
  level: harder words and sentences up the island, not only more decoys. Why: everyone picks their level.
- **Plain speech in the tiles:** a contraction shows as said, never expanded; only gonna / wanna / gotta are respelled
  tiles; a stage caps its reduced tiles (listen.ts `REDUCED_CAP`: 20 / 25 / 30 %), and a recorded line carries its
  `tone:` (scripts/tts/tone-picks.json). Why: listening, not slang drills, and a tone that fits the line.
- **‹ back to the English page, a look-back not a rewind:** ‹ mid-game returns where it started, ✕ to the island;
  「前の問題」 only shows the last question. Why: simple for kids and non-technical players.
- **Stories stop at the auto-lock** (no wake lock, no lock-screen playback). Why: the screen doesn't stay on at bedtime.

## Trips and offline

### The trip map
MapLibre GL JS on OpenFreeMap's public vector tiles in a NookPhone style of our own ([travel](travel.md#maps)); the CSP
gains only `https://tiles.openfreemap.org` in `connect-src`; geolocation only when the locate button is tapped, never
leaving the phone. Why: real open maps with no keys or ops.

### Offline
What a phone has shown stays available offline, bounded ([backend](backend.md#service-worker)); a trip or trail area
can be saved ahead by hand (150 MB in all; nothing downloads by itself). Why: trips are read where the signal is worst,
without costing every phone every deploy.
