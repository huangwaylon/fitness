# Decisions

The decisions in force now, each with a one-line why. Git history keeps the past. The numbers live in
`app/src/lib/config/rules.ts`; if this file and the code disagree, the code wins.

## Data and backend

### Google Sheet backend
One spreadsheet, *Island Fund*, on the shared Google account. A bound Apps Script web app (`app/gas/main.ts`;
scope `spreadsheets.currentonly`, runs as the owner, open to anyone) is its only reader and writer, and it never
hands out Google tokens. Why: free, nothing to host, and a leaked Island key reaches only Island data.

### Per-person keys
Two keys, `KEY_A` and `KEY_B`, live in Script Properties. A key identifies the person. It travels in the POST body,
never in the URL; requests are `text/plain` so there is no CORS preflight. A phone pairs with a `#key=…` link or by
typing the key. Why: no accounts and no login, for two people.

### Append-only compute-on-read
The sheet holds raw rows only: `metrics`, `events`, `uploads`. The server stamps every row with its own `at` and
checks shapes; the app computes everything else (ベル, locks, the wallet) from the rows on read. Why: no
ledger and no scheduler, and the rules sit in one place, in the app.

### Local-first sync
The app paints from a local snapshot and polls for rows newer than the last `at` it has seen (`since`). Taps are
optimistic and queue until sent. When the sheet's `rev` changes (a hand edit), the client drops its cache and
refetches everything. Why: Apps Script takes 1–4 s, and that must never block a tap.

### Shortcut health sync
Each iPhone runs one built-in Shortcut that posts daily totals (`steps`, `exercise_minutes`, `calories` as Move
kcal, `stand_minutes`, `weight`). It is triggered when everyday apps open, because Health can't be read while the
phone is locked. A day's activity value only goes up (the server appends only a higher value). Why: no third-party
app and nothing manual.

### No manual check-ins
The app asks nothing day to day: no eating check-ins and no "was that strength?" questions. Everything that earns
comes from the Watch. Why: the daily loop needs no taps.

### No privacy rules
Everything is visible to both people: raw numbers, ベル and weight. Why: two people, one game.

### No alerts
No notifications, no reminders and no web push. Only in-app confirmations remain (undo, a failed save). Why:
simpler, and the app is opened by choice.

## Economy

### Bells play money
ベル are play money, not tied to yen: no transfers and no payday. Amounts are small whole numbers. Why: prices the
couple chooses, with no real money at stake.

### A stamp card
Per person per Tokyo day, +1 ベル for each daily goal met, all or nothing (at most 4); がんばり, +1 more for each goal
reached at 1.5× its target (🍐 1.5 × that day's Move goal, 🍑 90 min, 🍒 180 min, 🍎 12,000 steps), at most +2 a day;
and ふたりでぜんぶ: +2 shared when both meet all four the same day (がんばり doesn't enter it). So 0–4 + 0–2 a person
and 0–14 for the pair a day. One `RULES` object and one `STRETCH` object, no versions: the rule applies to every day
and earnings are recomputed from the rows. A typical week is ≈ 52 for the pair, at most 98, a perfect one without
がんばり 70, a lazy one ≈ 28. Why: numbers a child can add up, every goal counts the same, a big day is worth a little
more without making the goals themselves optional (the cap keeps one heroic day from outweighing steady ones), and
the bonus makes a day a team effort. Shown as earned, never mixed: a goal's row shows the goal (✓) and a 「がんばり」
chip at 1.5× (the same on every stretched row, whatever the cap pays), with no ベル on it; the popup's ledger adds
もくひょう and がんばり (「（上限 2）」 when more were reached) to the person's total, and ふたりでぜんぶ, shown in both
popups, stays outside both totals, so the two totals and the bonus add up to the ribbon once.

### Economy start
The economy starts with the data: the first week with an activity row stamped by its lock. Why: no start date to
keep in the code, and a baseline of old days can't earn.

### Rings four automatic fruits
Four automatic metrics, one fruit each, listed in Apple's ring order (Move, Exercise, Stand), then steps (けんこう and the tree's popup put steps first, user request):

| Fruit | Metric | Daily goal |
|---|---|---|
| 🍐 pear | Move, active kcal | per person (`moveGoal`, defaults 600 / 400) |
| 🍑 peach | Exercise minutes | 60 min |
| 🍒 cherry | Stand Time, minutes | 120 min |
| 🍎 apple | Steps | 8,000 |

Why: the Watch measures them with no effort, and the same goals apply to both people (except Move, which follows
each person's own Fitness goal).

### Exercise minutes
A day's minutes are the Watch's exercise minutes. Steps never turn into minutes. Why: one source, no double counting.

### Move goal per person
A `pref` `moveGoal` (whole kcal, 100–2,000), which either person may set. It applies from the Tokyo day it is set
and never re-prices earlier days. Why: Move kcal depend on body size.

### Harvest and week lock
Each week has two times (JST). At Sunday 19:30 the harvest recap opens (each person's ベル, the ふたりでぜんぶ days, the
total); tapping 受け取る is ceremony only and nothing lands then. At the Wednesday 04:00 after, the week locks: its
earnings are fixed, and later syncs don't count. Spends are never locked. The lock is internal (no 🔒 or countdown in
the UI). Why: late Health syncs get a grace period, then the past stays put; it also lets the client compact and
memoise locked weeks.

### One wallet
Every ベル earned goes into one shared wallet, from its day. Why: one number to watch; trips are paid for outside the
game.

### Two rewards
Exactly two fixed treats: おやつ 8 ベル and 外食 15 ベル (`SHOP`). Either person buys, either person can undo any buy
(`spend_void`), and a buy the wallet can't cover is ignored on read, so the balance never goes negative. A spend names
its item at exactly its price; the server refuses anything else. Why: two clear choices priced against the week
(the most a week pays, 98, buys four of each; a perfect week, 70, three of each; a typical one, ≈ 52, two of each),
nothing to edit or argue about. A perfect day pays 10 to 14, so each treat is a two-to-four-times-a-week thing,
depending on effort.

### Erasing a buy
The ごほうび page lists every buy (「かいもの きろく」) and either of us can erase any of them, at any time; the ベル go back
(2026-10-31, user: "in case we make a mistake"). It reuses the append-only `spend_void` (nothing is deleted from the
sheet), no longer the buyer's only: one shared wallet, and any of us may edit any data. The script now checks a void
names a `spend` on the sheet (else `bad_request`), and a second void of the same buy is acknowledged as a duplicate and
not appended (the other phone got there first), so it stays idempotent. The week lock freezes earnings, not spending, so
a buy from a locked week can still be erased; the harvest recap counts earnings only and never changes.

### Weight never earns
Weight is shown only: no ベル, no goal that pays, and the economy never reads it; an optional goal line; a day's
weight is its latest row, 20–300 kg. Why: paying for kilograms rewards crash diets and punishes muscle.

## Health data

### Apple Health is the source of truth
Steps, exercise, Move, Stand and weight come only from the Shortcut; the app never enters or fixes them (no
`metric_set`, `workout_add` or `workout_edit`: the server refuses them and the model ignores old rows). The goals
(`moveGoal`, `goalWeight`) stay editable for either person (`data.person`), and either may void any buy (`spend_void`);
other prefs are the sender's own. Why: all health data is already in Apple Health, so manual edits only add a second, conflicting source.

### Health trends (けんこう)
A panel tab, けんこう (Health), the first (the panel opens on it; user request: the trends first), before きろく and せってい, shows the Health data over time for the personal trainer
(user request, 2026-10-31; team discussion in `docs/reviews/kenkou/discussion.md`). Computed on read in the browser
from the same rows (`model/health.ts`), no backend change, its code loaded with the tab.
- **Values:** a day's value is Apple Health's latest row, not the as-of-lock value: the trainer wants the truth, and the
  ベル keep theirs.
- **One person at a time** (user request): a ウェイ / うめ switch at the top, this phone's person by default (kept for
  the session, like the period); every card shows that person only. Why: the point is one person's trends, and one
  series reads better on a phone (wider bars, values on 1週).
- **As reported, nothing cut off** (user decision: "report the apple health data as is"): every day with a row for a
  metric is a real data point, whatever its value (0, 66 steps, 3 kcal): drawn as its bar and counted in every
  average, best day, goal count and change. 記録なし is only a day with no row for that metric (nothing received:
  before the first sync, a day the Shortcut didn't cover): a short faint stub on the axis instead of a bar (user
  decision: a full-height hatched column read like a huge value), out of the numbers, counted as 記録なし n日 (from
  the first activity record). Today is drawn but not counted: it is a partial day, and counting it would drag every
  average down until the evening sync; the footnote and its callout (きょう（とちゅう）) say so. Why: a barely-moving
  day is the truth a trainer wants to see; a threshold hid real days and inflated the averages.
- **Periods:** 1週 and 1か月 (30 days) by day, 3か月 by week (13, ending on the last day shown), 1年 and すべて by calendar
  month (daily averages per bucket), so long ranges stay readable on a phone; ‹ › and a drag on any chart step a whole
  period, きょう comes back; the change compares with the period of equal length just before.
- **Each chart:** steps first, then Move, Exercise, Stand (user request); one series in the person's fixed colour
  (ウェイ blue, うめ orange; a CVD-safe pair, checked with a validator), solid = goal met, their goal dashed (their own
  Move goal history), a tap for the exact value. No trend line (user decision: no moving average on the bars, no
  smoothed weight line); weight shows its weigh-ins joined by a thin line, on an axis fitted to that person's weights.
- **Weight's change is plain** (user decision): 期間の変化 = the first week's average weigh-in → the last week's in the
  visible period (else the first weigh-in → the last, saying which), and the goal month extends that weekly pace; no
  smoothed trend anywhere. Why: a number anyone can check against the dots beats a filtered one nobody can.
- **First tab** (user request): the panel opens on けんこう (then きろく, せってい), and remembers the last tab for the
  session.
- **No week card** (user decision): the period's charts and stats carry the trends; 1週 is the week view.
- **Weight moved here:** the weight left きろく (no information twice); its goal is still set in きろく's 目標 card.
- **No export:** no copy/CSV of a summary (user decision); the trainer reads the screen.
Why: the trainer needs exact, comparable numbers over weeks to years, without leaving the game's look.

### きろく is earnings only
The ベル ledger shows what was earned (weeks, days, ふたりでぜんぶ); the buys and their erase live only on ごほうび's
かいもの きろく (user decision, 2026-10-31). Why: one home per datum.

## App and hosting

### PWA on GitHub Pages
The UI is a static SvelteKit SPA (adapter-static, base `/fitness`), deployed by `.github/workflows/pages.yml` and
installed to the home screen. A strict CSP allows only our own origin and the Apps Script origins. Why: free hosting,
and data never sits on the site.

### Public repo for now
The repo and the site are public, since free Pages needs it. Without a key the site shows only pairing or `?demo`
(made-up data). Why: free; it can move to a private host later without code changes.

### Offline shell
The service worker precaches the build, loads pages network-first with a 3 s fallback to the cached shell, and
keeps one previous version so a stale page can still load its chunks. It never touches the Apps Script backend.
Why: the app opens instantly and offline.

### Japanese first
The UI defaults to Japanese; each person can switch to English (`pref` `locale`). Strings live in `ja.json` and
`en.json` (けんこう's in `kenkou.ja.json` / `kenkou.en.json`, loaded with its tab, and the names of everything the island lets
us catch in `catch.ja.json` / `catch.en.json`, loaded with the first catch, beach find or the ずかん, to keep the first load small), the type is rounded (Zen Maru Gothic), and dates are formatted the Japanese way. Why: both live in
Japan.

## Content, art and sound

### Fruit on the tree, picked up for the day
Each goal's fruit hangs in its person's tree, grey at 0 and colouring in with progress; met, it falls (once per
phone) and a tap picks it up, gone until the next Tokyo day. The day's progress stays visible after the pick-up in
the flower beds and the canopy: each bed is the goal flowers of the person standing beside it, one per goal (a bud
until met, then it blooms, once per phone), and all four met make the canopy glint (NH's money tree). The beds were
already there, so completion needs no new object on a small stage, and a bud-to-bloom reads as NH's own growth; the
species stay the season's (a tidy two-species bed), not the fruit's colours. Picking up and blooming are cosmetic and
local (`fruit-day` in localStorage): no ベル, no event, no backend change, and either person may
pick up either tree's fruit. Why: the user asked for NH's harvest feel (2026-10-31) without touching the economy;
the ベル stay computed from the goals on read, so a pick-up can never earn, lose or double anything, and a phone that
loses the record only sees a fruit fall again. Syncing pick-ups was weighed and left out: two phones disagreeing about
a cosmetic fruit costs nothing, a new event type costs a script redeploy. Replaces the ground piles in thirds.

### Shaking a tree: taps in a quick run, wasps without a cost
A single tap on a tree stays its popup; a quick run of taps (the third within 1.2 s) is NH's shake. Why: the popup is
the tree's one home for the day's numbers, so it keeps the single tap, and a run is how people shake a tree in NH
anyway (tapping while the popup is open was weighed: it would make closing the popup a shake). A shake drops a branch
now and then and a wasp nest 1 in 8 (at most one per tree an hour, no daily cap: the user asked for it fun and
frequent); the wasps are caught with a tap within 1.5 s or sting. Nothing pays or costs: no ベル from trees (scenery
never pays), a sting is a fright and a sweat drop (NH's swollen eye was a lump drawn over the eye of the default render: on
most of the 440 villagers it missed the eye, so it became an emote), and the caught wasp is a ずかん find like any bug (an existing event,
no script change). The wasp is in the bug table with weight 0, so it only ever comes from a nest.

### Mushrooms are cosmetic
November's mushrooms (beside the trees, 1–2 a day; now and then in October and December) and the rare mushroom (1 in 20
November dig spots) are picked up for a caption only: no ベル and no ずかん `find`. Why: the ずかん's kinds are NH's
museum (fish, bugs, fossils) plus the shells; NH's mushrooms are crafting materials with no catalogue page, and a new
find kind would need a script redeploy for a seasonal flourish. Seeded by the date, so both phones see the same ones.

### The jar beside the ribbon
The shared wallet's jar sits in the HUD, on the right of 「きょう +N ベル」, as one centred row (user). The goals' coins
still fly from the fruit on the island up into it. Why: today's ベル and the wallet read together where the eye
already goes, and the island's middle is free for visitors.

### NH events by date rule: Halloween
Dated NH events are one rule each in `island/events.ts` (a Tokyo `MM-DD` and the hour its evening starts), read by
whatever shows them; only Halloween so far (Oct 31: pumpkins all day; 17:00–24:00 the lit lanterns, a light wash,
Jack and the villagers' Halloween lines). Jack is a visitor and comes first that night, even over K.K. on a Saturday
(Oct 31 2026 is one). With no inventory, his "trick or treat" is a choice in the balloon: candy delights him, nothing
earns his trick, party glasses on my villager for a minute, not kept across a reload. Cosmetic and local: no ベル, no
event, no script change. Why: the user asked for NH's Halloween on the night (2026-10-31), light and without touching
the economy; one rule table keeps the next event (Toy Day, the countdown) a small change. The music is the audio
side's (the hour's track), not here.

### The rest of NH's bugs: what the island can hold
Of NH's 80 bugs the island has 70: every one whose NH behaviour has a faithful place here. NH's stumps are the
trunks (as the jewel beetle already was); the tarantula and the scorpion are kept, but gentle: no fainting, the first
tap makes one rear up, a second while it's reared makes it charge off, and once it settles a tap nets it (NH's "wait
for it to calm down"); a flea hops off my villager now and then on a tap (NH: villagers carry fleas); the bagworm and
the spider dangle from a shaken tree; the mole cricket chirps under a mound (NH: heard, then dug up); the pondskater,
the diving beetle and the giant water bug keep to the pond's water. Left out until the island has the thing they need:
the seven palm-tree bugs (blue weevil beetle, cyclommatus, golden and giraffe stags, horned atlas, elephant and hercules:
the island's trees are hardwoods, and the Goliath beetle already stands in on the trunks); the dung beetle (snowballs);
the ant and the fly (rotten turnips, candy, trash on the ground). Why: the user wants more to catch, faithful to NH;
a bug in the wrong place reads as a mistake, and these few need scenery the island doesn't have yet.

### Birthdays from the people config
Our two birthdays sit beside the other per-person defaults (`PEOPLE`: name, Move goal, birthday; null = off), not in
the sheet: they never change, both phones agree from the code, and nothing is synced. The party is NH's (hats, cake,
music box, confetti, a popper on a goal), cosmetic and local (the confetti and the candles once a day per phone). NH
villagers' birthdays are Nookipedia's, in a small module of their own so neither the first load nor the roster grows.
Why: a day that's about the person, with nothing to set up and nothing that pays.

### Wedding countdown as visitors
The countdown to 2027-10-08 is NH's wedding couple coming on milestone days (365 … 1, the day), one visitor drawn as a
pair, not a counter on screen; the day itself is a pose, confetti and fireworks, and June Sundays get NH's arch. Why:
a countdown that turns up as an event keeps the island a game (one more thing to find, never a number to watch), on
dates both phones agree on, with nothing stored but the confetti's once-a-day.

### Holiday hosts in the visitor slot
NH's holidays are date rules in `events.ts`, each checked on Nookipedia (Turkey Day the fourth Thursday of November;
Toy Day Dec 24, all day in NH rather than only its night; Festivale Shrove Monday, 48 days before Easter; Bunny Day
Easter Sunday with the seven days before, Zipper on the first and last), and their hosts come as visitors before
anyone else. Franklin's "fish for the dish" is the one quest: the next catch that day, no inventory, kept on the phone
for the day; Bunny Day's eggs are captions in the places NH hides them (a balloon, a dig spot, the line), never ベル or
finds. Why: NH's calendar on the island with no new screens, no state to sync and nothing that pays.

### Meteor showers by the week
A shower night is seeded by the week (at most one a week, about one night in ten), not by the night, so it can never fall
twice in a week, as NH's Celeste never comes twice; it rides on the existing wish (a shower's wishes are the usual
`scene-wish` count, and the morning reads whether the night before was a shower's), so nothing new is stored and both
phones agree. Why: NH's rhythm (rare, a night worth staying up for) with no state to sync; more stars to wish on, so
more fragments, never ベル.

### Group stretching on an Exercise day
NH's tape deck comes out on a day either of us met 🍑 Exercise, or on a morning opening (06:00–08:00), and a tap makes
everyone on the island stretch together for ~6 s, once a day per phone. Why: NH's most fitness-like ritual ties to the
goal that is literally exercise without paying anything (no ベル, no event: a missed stretch costs nothing, a phone that
loses its record only sees the deck again); the morning hours are NH's own ラジオ体操. The tune is an original synthesized
march (no copyrighted radio-exercise music). The deck is a scene item like the visitors, not a button: a 44px button
doesn't fit on the lawn by the hedge on a small screen without sitting under a canopy.

### My villager walks to what I tap
A tap on something to do sends my villager there first (NH: you walk up and do it), on each phone its own person's
villager. Of the ways to move a villager on a phone (walk-then-act on the existing taps, tap empty lawn to walk, a
drag or virtual stick, villagers wandering on their own) walk-then-act keeps every tap as it was: the lawn's taps
already do something and a stick fights the stage and the sheets. Kept snappy: 240 u/s, at most 0.9 s, no walk over
1.2 s, and the outcome is decided at the tap, so the walk is only cosmetic and a timing game (the bite, the wasps)
never waits for it. Spots are measured so a standing villager never covers a control. Transitions only, no rAF; a sheet
stops it. The partner's villager is never driven from this phone: it
goes about on its own (points of interest, following mine after 8 s away, a chat side by side, its tree when its
person meets a goal), one villager out at a time, because NH's villagers wander and a second avatar would make the
other person's taps matter on my phone.

### Visitors are the director's fourth actor
The visitors stood as single still renders and felt lifeless (user). Rather than a parallel animation system, the
visitor became the stage director's fourth actor (`'visitor'`): its walks, motions, emotes and facing use the same calls
as the villagers', idle life's scheduler gives it a beat, and the walk graph routes its strolls and arrivals, so a sheet,
a hidden page and the 10-minute idle stop already apply. Continuous life (breath, weight shift, each visitor's NH loop)
is CSS on separate transform properties so loops add up without JS. NH decides who roams (Daisy Mae, Franklin, Zipper,
Celeste) and who stays put (K.K. on his stool, Gulliver, Jack), and Gulliver sleeps until the fifth nudge as in NH; his
sleep talk is a small caption, not the balloon, so the nudges stay quick. A visitor returns to its spot before a line so
the balloon anchors where the bubble placement expects it. Arrivals and departures play only when a visit starts or ends
with the island open (or `?arrive`): a page load shows them already there, so a tap never chases a figure walking in.

### Sea creatures by diving, a find kind of their own
NH's 40 sea creatures come by diving: a bubble spot in the sea takes a fish shadow's turn (1 in 4), so the sea still
holds one thing at a time and the island is no busier; a tap dives, and NH's speeds become a second tap on a darting
shadow in time (the quickest sometimes get clean away). They are their own ずかん page, 「うみのさち」, recorded as a
`find` of kind `sea` (FIND_KINDS gained it: the script was rebuilt and redeployed, its ids still free-form); the pearl
NH finds while diving is a shell (かいがら), so its kind needs nothing new. Pascal (a scallop for a pearl) is left to the
visitors. Why: the user wants more to catch, faithful to NH and not stiffly seasonal; a dive spot reads as NH's and
costs one small layer, and the creatures' data, names, lines and sprites all load only when first needed.

### The pond, the museum and the night sky
For fun, frequent and NH-faithful (user), and never paying: no ベル from any of it.
- **One pond holds every freshwater fish.** The island has no river, so NH's 46 river, river-mouth, clifftop and pond
  fish all come to one small pond at the back, as often as the sea's (a visit fills the sea, then the pond), fished
  exactly like the sea (one fishing code, two water boxes). Their table is its own chunk, fetched with the pond's first
  shadow. A catch is a ずかん find of kind `fish`; the script checks a find's id by shape, not against a list, so the new
  ids needed no script change. Why: NH's fishing is half freshwater; a river would not fit the stage, a pond does.
- **The museum is the ずかん's door.** NH's upgraded museum (the official render, not the early tent) stands at the back
  in the middle; a tap is one line from Blathers (drowsy by day, lively at night, NH's owl), then the panel opens on
  きろく's ずかん when his box closes. One page only, so the door never makes you wait; a second tap goes straight in.
- **Shooting stars come in showers, each wish one fragment.** On a clear night a shower every 3–8 minutes (1 in 6 a
  bigger one) in NH's hours, rather than single stars every few seconds or summoned by a tap on the moon: waiting for
  them is NH's moment (a meteor shower's night, Celeste's, keeps its star every few seconds). Each wish is one star
  fragment the next morning (at most 8, the beach's room), per phone, a shower's night's like any other (its zodiac
  fragment likelier): the more you wish, the more you find, as in NH.
- **Fireworks on NH's dates and our own day.** NH's August Sundays and the New Year countdown, plus a short volley the
  evening both of us meet all four goals (once a day per phone, from 18:00), and a tap during a show sends one more.
  They open in the sky and the open sea behind the island, each whole burst clear of every control; the HUD fills the
  middle of a short sky, so bursts there are small and the big ones open low over the water as in NH.
- All of it is transform and opacity.

### Official NH art
Official Animal Crossing: New Horizons renders, fetched by hand with `npm run assets:fetch` into `app/static/art/`
(with a manifest), never hot-linked. `<OfficialArt>` falls back to our own SVG drawings. Why: the real look; if a
takedown comes, delete the art and the app keeps working. Personal use only, never commercial.

### Sound off by default
Music, effects and voice blips are per device and all off until turned on. The hourly music is fetched on demand,
never precached. Why: an app opened on a train must never surprise anyone.

### Event music, the wasps' and K.K.'s songs
NH's event tracks play on its event days and hours instead of the hour's, in Tokyo time like the hours: Halloween
(Oct 31 17–24), Turkey Day (the 4th Thursday of November 9–24), and New Year (Happy New Year! at midnight, the
fireworks music to 02:00, its calmer version to 05:00, New Year's Day for NH's whole day, Jan 1 05:00 → Jan 2 05:00).
The wasps' chase and sting and K.K.'s songs cut in over whatever plays and hand back to it, as in NH. The user's files
(2026-10-31), committed like the hours. Why: the island should sound like the game on the days the game is
different, without a setting of its own (ミュージック covers it). Dec 31's countdown tracks weren't among the files, so
the 23:00 hour plays then. とたけけの夢 (Dreaming of K.K. Slider: NH's first-night dream where K.K. appears) has no
moment here and was left out. K.K.'s songs are a list in the audio manifest (official titles, ja and en), so more can
be added without code; a tap on K.K. plays one, his show's own staging uses the same list (`sound/kk.ts`).

### Procedural ambience beds
The island's ambience (surf, wind, rain, birds, cicadas, higurashi, crickets) is synthesised in the app, not recorded:
original loops rendered once into buffers when first needed, with Japanese garden birds and insects after their calls
(the bush warbler in spring, the bulbul in autumn, aburazemi and minminzemi in summer, the evening higurashi, bell
crickets on autumn nights). A file in the manifest still replaces any bed. Why: no copyrighted or downloaded audio,
and no megabytes to fetch for sounds that sit under the music; quiet, varied enough over 12–40 s loops that start at a
random point. If a bed wears thin, a CC0 recording can take its place without code.

### Weather days by the date
The weather is seeded by the date (NH's 05:00 day), with NH's own rules (rain about one day in six, snow in winter, the
rainbow after a downpour clears late in the afternoon, fog at 07:00 in the cold months, the aurora on rare winter
nights), so nothing is stored or synced and both phones see the same sky. Rain and snow are tiled layers moved by
transform, not particle systems. It touches play the way NH does and no more: the rain-only coelacanth and snail, the
bugs that hide from rain, splashing steps; never ベル. Snowflakes now fall only on snow days (NH: a clear winter day has
snow on the ground but none falling). No umbrella over the villagers: the renders are single front-facing images with no hand to
hold one, so an umbrella would float over the head; left out rather than shipped poor.

### Speech balloons stand by their speaker
Every balloon (my villager, the visitors, Blathers) is placed by one rule: by the speaker, the tail at them, at most
40px off; above, else beside, else below; never over the HUD, the speaker or off the scene; what may sit under it
loosens step by step (the museum, then the trees, then the villagers) before it would ever stand further off. Why: the
old search kept clear of every control at any distance, so a visitor at centre stage, under the museum, got a balloon
floating above the museum, 100px+ from their head, and a reader couldn't tell who spoke. NH's box sits over the world
by the speaker; covering a tree for a few seconds is fine, losing the speaker isn't. The HUD stays uncovered because a
balloon over the ribbon or the jar would hide the app's own controls.
