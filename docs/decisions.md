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

### The sheet is an export
The bound Google Sheet is a one-way copy: the relay's cron rewrites its tabs from the record after each change (within
15 minutes) and every night, and a README tab and a note on each header say it is read-only. Its Apps Script web app
only takes that export (it forwarded the old `/exec` URL's requests to the record for the day of the move, until both
phones were seen posting to the relay alone). The relay pushes (signed in the body, since Apps Script can't read headers) rather than Apps Script pulling,
so no installable trigger or new Google scope was needed and the relay holds no Google credential. Why: a backup and
something to look at, in the place the user already knows, without a second path for data of record. Not done:
writing back from the sheet (an edit there goes nowhere); an installable time trigger pulling deltas (a possible later
step if the push ever fails often).

### Per-person keys
Two keys, `KEY_A` and `KEY_B`, as Worker secrets (and Script Properties, which derive the export's signature); a key
identifies the person. It travels in the POST body, never the URL; requests are `text/plain` (no CORS preflight). A
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
would conflict with Health.

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
than one guest; the guest's villager in the members' ambient life (it moves only by its own phone).

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
Every ベル goes into one shared wallet. Exactly two treats: おやつ 40 and 外食 70 (`SHOP`; 8 and 15 until 2026-11-02, the
user: "Let's change 外食 to 70 and oyatsu to 40"); either person buys, either
person can erase any buy (`spend_void`; the script refuses a void of no buy and acks a second one as a duplicate); an
uncovered buy is ignored on read. Why: one number to watch, two clear choices priced against the week (a typical week,
52, is one おやつ; a perfect one, 70, exactly one 外食: treats to save for, not to buy daily), and mistakes
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

### Two trees a day hold a present (2026-11-02)
NH's furniture from the trees: each day two of the oaks and cedars (by the date's seed; not the palms, not the goal
trees) hold a piece of the balloon presents' furniture that the tent can place, and their first shake drops it,
wrapped, to open where it lies; never ベル (NH's bag of bells left out). It crosses as a `put` of a `present` by the
tree's id and opens as one, so no contract or relay change: the relay's first put wins, the day row keeps it, and
whatever draws a balloon's present (the DOM island, the 3D island's port) draws it. Why: the user ("when you shake
them, you can occasionally get presents too"); wrapped because our presents are, and the present path brings the
plate, the ずかん, the tent and the sharing with it.

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

### A villager's phrase is presence (2026-11-02)
A tap on my villager opens a phrase picker (six presets, my own last few, a 20-character field); the pick shows over my
villager on both phones for 4 s through one small relay intent, `say {text}` (v2), that the room relays live and keeps
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
cap (40 pieces), so an old phone, which knows no scope, ignores them (its parser rejects the unknown key or the item).
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
per id, the record keeps each id's latest, a reset drops what it voids. The outdoors are the members' alone, a home's
look and room its owner's (the tent all three), enforced by the record and the room. Nav, heights and validation are
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

### The island is twice as long (2026-11-02)
20 × 92 tiles: today's まえ in front, today's おく behind, and a new middle between them for the homes and what comes
next. Why: the user, for room to build; the width (and so the camera's rules: vertical scroll, x centred) unchanged.

### The tent's camera is the player's, its walls cut away
The room opens at NH's fixed, slightly top-down view, and a drag turns the camera round the room's middle (a pinch
zooms, 🏠 eases it back), within limits that keep the walls from clipping; the walls between the camera and the room
are cut away. The villagers are their renders as billboards turned to the camera about the up axis (leaning back a
little), alpha-tested and depth-sorted with the furniture. Why: the user asked for a perspective camera the player
can move and rotate, "like NH's room camera but freer", and 2D villagers in 3D that hide behind a table and cover it in
front.

### The island in 3D: three.js under the DOM island
The island is drawn in three.js (`components/world3d/`, behind `?island=3d` and せってい's しまの えがきかた switch until it
does all the 2D island does, then the default): NH's models instanced, the ground a heightfield under the baked
textures, the water live, every material bent onto the rolling log in its vertex shader. The DOM island keeps running
over the canvas: its nodes are placed through the 3D camera (`camera.svelte.ts` `Proj3`) and stay the tap areas, the
popups, the balloons and the marks; their art goes invisible where the canvas draws the thing. The camera is NH's: one
finger scrolls along the island only (z, a free fling, never x), two pinch the zoom (clamped, eased back), it never
rotates and nothing but the finger moves it; a gesture is one thing from start to end. Shadows and water are on; the
shadow map is drawn unbent (three's receivers look it up at their unbent position), so it redraws only when its box
steps, not on each frame of a scroll. Every lamp is always-on emissive with a halo and a pool; the 6 real point lights
go to the lights nearest the view's centre with hysteresis, fading over 400 ms, so a light never pops. Why: the user
approved the POC on the phone ("redo the whole map such that it's all 3d. same as the tent room…"), and reusing the
DOM island's model, director, nav, sync and every overlay means only the drawing and the hit-testing are new.
