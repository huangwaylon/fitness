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

### No alerts
No notifications, reminders or web push; only in-app confirmations (undo, a failed save). Why: the app is opened by
choice.

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
🍐 Move (active kcal, per-person goal), 🍑 Exercise (60 min), 🍒 Stand (120 min), 🍎 Steps (8,000), in Apple's ring
order (けんこう and the tree's popup put steps first). Why: the Watch measures them with no effort; Move follows each
person's own Fitness goal.

### Move goal per person
`pref` `moveGoal` (100–2,000 kcal), set by either person, applies from the Tokyo day it is set. Why: Move kcal depend
on body size, and the past must not re-price.

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

### Fruit on the tree, flowers in the bed
Each goal's fruit colours in with progress, falls when met and is picked up for the day; the person's bed shows the
goal flowers (bud → bloom) and all four make the canopy glint. Why: NH's harvest feel, completion visible after the
pick-up, no new object on a small stage.

### Shaking a tree
A quick run of taps (the third within 1.2 s) shakes; a single tap stays the popup. A nest 1 in 8 (at most one per tree
an hour), its wasps caught or stinging (a fright and a sweat drop). Why: the popup keeps the single tap, and a run is
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
70 of NH's 80 bugs, each where NH keeps it (stump bugs on the trunks; the tarantula and scorpion gentle). Left out:
the palm-tree bugs, the dung beetle, the ant and the fly. Why: a bug in the wrong place reads as a mistake.

### Sea creatures by diving
A bubble spot takes a fish shadow's turn 1 in 4; they are their own ずかん page (`find` kind `sea`). Why: NH's diving
without making the sea busier.

### One pond for every freshwater fish
The island has no river, so all 46 freshwater fish come to one small pond, fished like the sea. Why: NH's fishing is
half freshwater; a river doesn't fit the stage.

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

### My villager walks to what I tap
Walk-then-act on the existing taps, snappy (≤ 0.9 s, none over 1.2 s), the outcome decided at the tap. The partner's
villager goes about on its own. Why: every tap keeps its meaning, timing games never wait, and the other person's taps
don't matter on my phone.

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
