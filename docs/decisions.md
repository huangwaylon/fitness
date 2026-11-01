# Decisions

The decisions in force, each with its reason. The numbers live in `app/src/lib/config/rules.ts`; if this file and the
code disagree, the code wins.

## Data and backend

### Google Sheet backend
One spreadsheet, *Island Fund*, with a bound Apps Script web app (`app/gas/main.ts`; scope `spreadsheets.currentonly`,
runs as the owner, open to anyone) as its only reader and writer; it never hands out Google tokens. Why: free, nothing
to host, and a leaked key reaches only Island data.

### Per-person keys
Two keys, `KEY_A` and `KEY_B`, in Script Properties; a key identifies the person. It travels in the POST body, never
the URL; requests are `text/plain` (no CORS preflight). A phone pairs with a `#key=…` link or by typing the key. Why:
no accounts for two people.

### Append-only, computed on read
The sheet holds raw rows only (`metrics`, `events`, `uploads`). The server stamps each row with its own `at` and checks
shapes; the app computes everything else (ベル, locks, the wallet) on read. Why: no ledger, no scheduler, the rules in
one place.

### Local-first sync
The app paints from a local snapshot and polls for rows newer than the last `at` it has (`since`); taps are optimistic
and queue until sent; a changed `rev` (a hand edit) drops the cache. Why: Apps Script takes 1–4 s, and that must never
block a tap.

### The script serves only what the app reads
`snapshot` sends only rows of a known metric or event type and person, and the script puts each tab's header and
column formats right itself. Why: the app never needs code for rows or layouts it doesn't produce, and a hand edit
can't break a phone.

### Live relay on Cloudflare
While both phones have the app open, each sees the other's villager act at once: a Worker with one SQLite-backed
Durable Object (the island room, `relay/`) on the Workers Free plan relays small intents (where I tapped and what I
did, never positions) between the two, over a WebSocket opened only while the app is visible and authenticated with
the same person key as the sheet. It is presence only: the sheet stays the record (shared changes also go through the
outbox), so a relay outage loses liveness, never data. Why: Apps Script can't push and takes seconds, polling it
faster would burn its quota; the Free plan needs no payment method, the Hibernation API makes idle sockets free, and
the edge is in Tokyo (~20 ms one way). Firebase RTDB (Spark) was the fallback.

### Relay versions side by side
The relay speaks every protocol version in `LIVE_VS` at once (1 and 2): each socket keeps its hello's version, the
relay's messages and the shared intents reach every phone in its own, and a walk passes only between phones of the
same version. Any other version, or a switch mid-socket, is closed 4004 with a reason, so the phone parks until a
reload. Why: the two phones update at different times (a service worker update waits for the next open), so a hard
switch would cut presence and the push for whichever updates last, and a stage point can't be mapped to the world.
The order is fixed: deploy the relay with the new version first, then the app; drop the old one once both run it.

### Push through the relay
When the sheet changes, the Apps Script POSTs a small signed notice (`what`, `who`, newest `at`, `rev`) to the relay,
which tells the open phones to fetch now; a phone also nudges its partner over the socket after an acked event. The
signing secret is derived from both person keys, so only the two servers can sign and nothing new is provisioned.
Polling is unchanged, so the push only adds immediacy. Why: a partner's steps, goals and buys show within a second
instead of at the next open, for ~150 relay requests a day. Not done: caching the snapshot at the edge (the app
already paints from IndexedDB, most polls return nothing, and hand edits fire `onEdit`, a simple trigger that can't
notify, so an edge copy could serve stale rows) and serving the app's writes through the Worker (a second path for
data of record).

### Shortcut health sync
Each iPhone runs one built-in Shortcut posting daily totals (`steps` and `steps_watch`, `exercise_minutes`, `calories`,
`stand_minutes`, `weight`), triggered when an everyday app opens (Health can't be read while locked). Latest wins: any
changed value is appended. Why: no third-party app and nothing manual; Health is the truth, up or down.

### No manual input
The app asks nothing day to day and never enters health data. Why: the daily loop needs no taps, and a second source
would conflict with Health.

### No privacy rules
Everything is visible to both people. Why: two people, one game.

### One notification: the partner met every goal
(Replaces *No alerts*, 2026-11.) The only notification is a Web Push to my phone when my partner's day reaches all four
goals (「うめが きょうの もくひょうを 4つ ぜんぶ たっせい！」, or 「ふたりで ぜんぶ たっせい！」 when mine already had),
at most once a day per person, never 22:00–08:00 Tokyo, and only on a phone whose せってい → つうち switch is on (off by
default). No reminders, nothing about my own day, nothing else; in-app confirmations (undo, a failed save) stay as
they were. The achiever's own phone notices (goals are computed on the phone, so no backend change) and asks the
relay, which keeps the subscriptions, dedupes, applies the quiet hours and sends (`relay/`, RFC 8291/8292 with
WebCrypto, no library). A report in quiet hours is skipped, not held for 08:00: a morning buzz about last night is
noise, and the island shows it anyway. Why: the one moment worth hearing about at once is the other person finishing,
and the reason not to notify (the app is opened by choice) still rules out everything else. Limits: the achiever's
app must open after the Shortcut's sync to notice (an everyday app opening runs the Shortcut, not ours), and an
iPhone needs iOS 16.4+ and the Home Screen app. Not done: detecting it on the relay from Apps Script's notify (it would
need the health data there) or on the partner's phone (that phone would have to be open, when the island already
shows it with the fruit and flowers).

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

### Harvest and week lock
Sunday 19:30 the recap opens (ceremony only); the Wednesday 04:00 after, the week's earnings lock (spends never do).
The lock is internal. Why: late syncs get a grace period, then the past stays put; it also lets the client compact and
memoise locked weeks.

### One wallet, two rewards
Every ベル goes into one shared wallet. Exactly two treats: おやつ 8 and 外食 15 (`SHOP`); either person buys, either
person can erase any buy (`spend_void`; the script refuses a void of no buy and acks a second one as a duplicate); an
uncovered buy is ignored on read. Why: one number to watch, two clear choices priced against the week, and mistakes
undone without deleting anything.

### Weight never earns
Shown only, with an optional goal line. Why: paying for kilograms rewards crash diets and punishes muscle.

## Health data

### Health trends (けんこう)
The panel's first tab shows the Health data over time for the personal trainer, one person at a time, computed on read
(`model/health.ts`). As reported, nothing cut off: every day with a row counts whatever its value; 記録なし is only a
day with no row; today is drawn but not counted. Periods by day, week or month so long ranges stay readable; plain
numbers, no trend lines or smoothing (weight's change is first week → last week). No export. Why: a trainer needs
exact, comparable numbers anyone can check against the bars.

### きろく is earnings only
The ledger shows what was earned; the buys live on ごほうび. Why: one home per datum.

## App and hosting

### PWA on GitHub Pages
A static SvelteKit SPA (adapter-static, base `/fitness`), installed to the home screen, with a strict CSP allowing
only our origin and the Apps Script origins. The repo is public (free Pages); without a key the site shows only
pairing or `?demo`. Why: free hosting, data never on the site.

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

### Mushrooms are cosmetic
November's mushrooms are captions only, no ずかん `find`. Why: NH's mushrooms are crafting materials with no catalogue
page, and a new find kind needs a redeploy for a seasonal flourish.

### The jar beside the ribbon
The wallet's jar sits in the HUD on the right of 「きょう +N ベル」. Why: today's ベル and the wallet read together, and
the island's middle stays free for visitors.

### NH events by date rule
Each dated NH event (Halloween, Turkey Day, Toy Day, Festivale, Bunny Day) is one rule in `island/events.ts`, and its
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
Our birthdays sit in `PEOPLE` (`config/rules.ts`), the wedding date in `island/wedding.ts`; the wedding countdown is NH's
couple visiting on milestone days. Why: they never change, both phones agree, and an event to find beats a counter.

### Group stretching on an Exercise day
The tape deck comes out on a day either of us met 🍑 Exercise or on a morning opening; a tap makes everyone stretch
once a day. Why: NH's most fitness-like ritual tied to the goal that is exercise, paying nothing.

### Only a tap on empty ground walks my villager
A tap on an interactable (a tree, a pond, a bug, a find, a door, a visitor, the partner) acts in place: my villager
turns to it and the action plays at the target, its tool there (no walk-then-act); a tap on bare ground runs it there
(200 u/s, the camera staying put), where it stays for the day. With the relay, my tap-to-walk replays on the
partner's phone (the destination only; their planner walks it), and their doings play at the target here without
their villager running over. Why: the user ("only move the character if the tapped spot is not an interactable
object… when we click trees, ponds, etc., the character moves there and gets in the way"); every tap keeps its
meaning and nothing waits for a walk.

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
other phone sees it caught by them. The sheet keeps one cheap row per person and day (`island`, replaced like a
tally) for when the relay has nothing. Why: per-camera placement made the phones disagree on where (and so whether)
a critter was, and only the outcome of a person's action has to cross: a seed costs nothing, an intent per action is
far below the Free plan (a busy day ~550 messages, ~28 DO requests), and the relay already orders them, so no leader,
no clock sync beyond the pings, nothing per frame. The relay's day is presence-grade (it may be gone); the sheet row
is the record. Not done: streaming positions or the interactive moments (a cast's bite, a dive's chase, a tarantula's
mood stay on the phone that taps; their outcome is shared), a rejection message to the losing phone (the winner's own
intent tells it), every event to the sheet (a day row instead), sharing the balloon's flight.

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
shared high-five or follow while both are here (left out rather than run on two phones at once), the visitor's beats
beyond Gulliver's waking.

### Decor is a last-writer-wins map, the sheet keeps each item's latest op
The island's decorations ([Decorating](design.md#decorating)) are persistent, shared by both of us, either may move
or remove any. Each change is one op carrying the item's whole state (`{id, at, item, x, z, f, p}`) or its removal
(`{id, at, rm}`); the layout is the ops merged by id: a removal beats everything (ids are never reused: an undo puts a
new one down), else the latest `at` on the relay's clock, then B over A (`contract/decor.ts`). The merge is commutative
and idempotent, so it doesn't matter which way an op arrives first (the relay live, its day's replay, the sheet's
snapshot, my own optimistic copy): both phones and a reload reach the same layout. The relay only carries the ops
(`decor`, kept in the day's ring for a phone opening later that day); the sheet is the record across days and keeps
only each item's latest op (the script deletes the older rows: at most one row per item ever placed), checks the
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

### Speech balloons stand by their speaker
One placement rule for every balloon: by the speaker, at most 40px off, loosening what may sit under it (the museum,
the trees, the villagers) before ever standing further off; never over the HUD. Why: a reader must see who speaks;
covering a tree for a few seconds is fine.

### Weather days by the date
Seeded by the date with NH's rules; tiled layers moved by transform. No umbrellas (the renders have no hand to hold
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

## The island world

### The rolling-log world in 2D DOM
The island is NH's rolling log: one flat plan (x across, z in) bent over a cylinder by a pure projection (`roll.ts`,
option A of the research, kept by the user's iPhone spike at a locked 60 fps), the camera a native scroller with three
proximity stops (まえ, ひろば, おく), every upright thing a DOM billboard at its feet placed by one projector in one depth
order. Not WebGL (a bundle, context loss, its own tap model and every animation ported) nor CSS 3D (nested preserve-3d
misrenders on iOS). Measured at 4× CPU throttling on the iPhone 13 viewport: fling p95 16.8 ms, worst 33 ms once, no
long tasks, ≤ 83 style writes a frame for ~140 nodes, nothing pending once still. Why: DOM taps, the e2e and every
existing component stay; nothing runs when still.

### The ground is baked raster, the water live
The terrain is painted offline (`scripts/terrain.ts`: a WebGL shader in Chrome, noise, soft distance-field edges,
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
interleave with the DOM sprites' depth order). The model files never enter the repo, only the renders. Why: the user
asked for the game's own models ("let's use them going forward"), and they read as one family at every season.
