# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md). Numbers come from `app/src/lib/config/rules.ts`, which wins if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch. Their activity, measured automatically, grows fruit and earns **ベル** (play money, a stamp card: +1 per
daily goal) into one shared wallet, spent on two treats: おやつ and 外食. Japanese first, English per person.

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  weight, body fat %, BMI, lean body mass) several times a day. **Apple Health is the source of truth:** no health number is entered or fixed in the
  app ([Health data](#health-data)).
- **Data out:** the PWA (SvelteKit, static on GitHub Pages) fetches the raw rows and computes every number on the
  phone (`lib/model/`, pure functions).
- **Principles:** zero required taps a day; both people see all data; one opt-in notification (the partner met every
  goal, [backend](backend.md#notifications)) and nothing else; everything always animates
  (no reduced-motion variants).

Modules: `contract/` (shared with the script) · `config/rules.ts` · `scoring/` · `model/` · `sync/` · `store/` ·
`ui-state/` · `sound/` · `components/`, `routes/`. `deps.test.ts` enforces the import direction.

## Simplicity rules

- No tab bar: 島 (the island) and ごほうび (the wallet), plus one panel for everything else (tap the ribbon).
- One focal point per screen (島: today's ベル, also the door to the panel; ごほうび: the balance).
- A number is shown in full in one place; elsewhere it is only a doorway to it.
- Per screen at most 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card; one しずえ line (≤ 16
  characters), only with news.

## Screens

### Island

Top to bottom: the ribbon 「きょう +6 ベル」 (both people today, ふたりでぜんぶ included; counts up; tap → [the
panel](#panel)) with the jar on its right, the two centred in the sky; a sync chip only when sync isn't ok; the scene;
しずえ's box only with news. The island is NH's rolling log under them ([World](#world)): a drag scrolls it from まえ
(home, the health lawn) back to ひろば and おく, a tap on empty ground walks my villager there.

- **Trees:** one per person, today's four fruits in the canopy ([Trees](#trees)). A tap opens a popup: per goal (🍎
  steps first, then Move, Exercise, Stand) today's amount against the goal (「14,164 / 8,000歩」), ✓ once met and a yuzu
  「がんばり」 chip at 1.5× ([Goals](#goals)); no ベル on the rows. Until then each holds its place faintly: a dashed
  ring where the ✓ comes and a dashed ghost of the chip (gone once the day's がんばり cap is paid), so an early morning's
  popup shows what will fill in. Then the ledger, always all three lines, a zero faint: 「もくひょう +3」, 「がんばり +1」
  (「がんばり（上限 2） +2」 when three or four were reached) and this person's total 「うめの きょう +6 ベル」; then
  ふたりでぜんぶ (「ふたりで ぜんぶ まで：あと 2つ」 or 「ふたりで ぜんぶ！ +2 ふたりに」), outside either total, so both
  totals plus it make the ribbon. The last line says when that person's data last arrived (「15:24 に とどいた」), with
  a dot once it is over 6 hours old.
- **Jar** (`island/HudJar.svelte`): a cream pill as tall as the ribbon, the jar rising out of its left end, the shared
  balance and a leaf ▶. Each newly met goal flies in as a +1 coin from its fruit (+2 with its がんばり; `CoinFlow`),
  ふたりでぜんぶ as a +2 under the jar; all of it waits while something covers the scene. Tap → ごほうび (the island zooms
  into the jar and ごほうび grows out of it; live CSS, no View Transition: its snapshot of the banded ground striped on iPhone).
- **Centre stage:** the plaza's middle (`world.ts` `CENTRE_STAGE`, ひろば), where visitors stand.
- **Villagers:** a tap on mine opens its phrase picker (a phrase shows in its balloon on both phones); a tap on the
  partner's is a high-five ([Villager taps](#villager-taps)). Neither opens a sheet.
- Controls are real buttons with `aria-label`, ≥ 44px (villagers 64px); focus order = visual order.

### Wallet

ごほうび (`routes/jar/+page.svelte`, `wallet/Shop.svelte`): the jar over 「ふたりのベル」 and the balance, then two tiles
with NH item art: 🍦 おやつ 8 ベル and 🍜 外食 15 ベル. One the wallet can't cover is sunk with あと N ベル. 買う！ asks
first, applies at once and waits 5 s with とりけす before it is sent.

「かいもの きろく」 (`wallet/Purchases.svelte`) lists the buys, newest first (art, name, day, who, price), ten at a time
(「もっと見る」). ✕ on any line (either of us, any buy) asks NH-style (「このかいものを けしますか？ 8 ベル もどります」);
はい sends a `spend_void`, the ベル go back, and the banner carries とりけす for 5 s.

### Panel

Tap the ribbon → the island panel slides down from the top (`panel/IslandPanel.svelte`): title 「しまの てちょう」, full
height, three tabs pinned under the title (NH yellow for the one shown): けんこう · きろく · せってい. Every opening
from the ribbon starts on けんこう at 1週 (a building's door or the museum opens its own tab). Its own chunk, loaded on the first tap.

- **けんこう:** the Health data over time ([Kenkou](#kenkou)); its own chunk.
- **きろく:** the ベル ledger, 目標 and the ずかん ([Kiroku](#kiroku)).
- **せってい:** **むらびと** (my villager and よびな; かえる → the picker: 23 special characters and all 417 NH
  villagers, its head pinned over the scrolling grid), **サウンド** ([Sound settings](#sound-settings)), **つうち** (one
  switch, off by default and per phone: 「うめの ぜんぶ たっせいを しらせる」, once a day, never 22:00–08:00;
  [backend](backend.md#notifications)), **ことば** (日本語 / English), **つうしん** (when each of us last synced; いま つうしん) and **あそびかた** (くわしく → the guide:
  the goals, ふたりでぜんぶ, the treats, the Sunday recap, a protein hint of 1.6 g per kg a day).

A day, a goal, the picker and the guide push a level with ‹ (the tabs hide while a level is open); ✕, the backdrop and
Esc close the panel.

### Kiroku

きろく (`model/history.ts`, `components/kiroku/*`), read-only:

- **ベル:** everything earned, then by week (earnings only) one line per day under the two avatars: each person's four
  fruits (bright = met), a star on a ふたりでぜんぶ day, the day's ベル (tap → the day); on a がんばり day a smaller second
  line with each person's がんばり ベル.
- **目標:** the Move, steps, weight and body fat goals; two avatar pills pick whose (either person sets either person's). The
  steps goal (歩数（1日）, ✎) takes 1,000–30,000 in 500s in a 16px numeric field; 8,000 for both until set. The weight
  goal (体重, 目標体重: 20–300 kg) and the body fat goal (体脂肪率, 目標体脂肪率: 3–60 %, 「3〜60%で 入れてね」) take one
  decimal in a decimal field, each with 目標をなくす once set (まだ until then); both are shown only, never earn, and
  each row carries its からだ card's icon.
- **ずかん** ([Zukan](#zukan)): one row per kind with how many either of us has found.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  「がんばり」 chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

けんこう (`model/health.ts`, `components/health/*`, `e2e/health.spec.ts`): the Health data over time for the personal
trainer, one person at a time, computed on read.

- **Whose data:** two avatar pills (this phone's person first and chosen on opening; kept for the session).
- **Controls:** 1週 · 1か月 · 3か月 · 1年 (1週 on every opening; kept while the panel stays open), then かつどう ·
  からだ, the same pills (かつどう on every opening, like the period; switching keeps the period, the range and whose
  data), then a sticky row: ‹ the visible range (「10/2–10/31」; 「1日ごと」 / 「1週ごとの 1日平均」 / 「1か月ごとの 1日平均」
  under it) › and きょう.
- **Cards, per group** (`model/health.ts` GROUPS and CARDS, the user's "activity metrics and body metrics"): かつどう
  🍎 歩数, 🍐 ムーブ, 🍑 エクササイズ, 🍒 スタンド (then the footnote); からだ 体重, 体脂肪率, BMI, 除脂肪体重 (what a
  scale writes at one weigh-in). As each activity card has its fruit, each からだ card has a catalogue icon
  (`art.ts` BODY_ART, 24px, decorative: the heading names it): 体重 the red kitchen scale (a scale, but NH's, and
  readable on the cream and the night cards), 体脂肪率 the exercise ball (round and soft, never a judgement), BMI the
  clipboard with its chart (an index you read off), 除脂肪体重 the weight bench (muscle).
- **A card per activity metric**: the goal; 1日の平均 with 前の期間より ↑/↓ %;
  目標 n/N日（%）, ベスト and 記録なし n日; the chart; a one-line key.
- **Chart** (`BarChart`, SVG): a bar per day (1週, 1か月), per week (3か月: 13) or per calendar month (1年), each
  the bucket's daily average, in the person's colour (ウェイ blue `--person-a`, うめ orange `--person-b`); solid when
  the goal was met, pale when not; today outlined; a finished bucket with no row gets a short hatched stub (記録なし).
  The goal dashed (stepped when the Move or steps goal changed). On 1週 each bar carries its value. A tap shows one value; a
  horizontal drag turns the page (right = older); vertical drags scroll the panel.
- **体重** (`WeightCard`, `DotChart`): 平均 (n回の記録), 期間の変化 ([Weight](#weight)), the chart on an axis fitted
  to the weights (dots joined by a thin line; the goal dashed, or a 「目標 66.0 ↓」 label when far off) and the goal
  month at that pace (only when the period ends today).
- **体脂肪率 · BMI · 除脂肪体重** (`BodyCard`, `DotChart`): as 体重 (体脂肪率 with its own goal, `goalBodyFat`, drawn
  and keyed exactly as the weight goal: the dashed yuzu line, 「目標 19.5」 or the ↑/↓ label when far off, the axis
  fitted to it when near, 「- - 目標」 in the key, and the goal month at that pace; BMI and 除脂肪体重 have none;
  unset = no line): 平均 (n回の記録), 期間の変化 (the same
  plain change, in the metric's unit: `−0.4%`, `+0.2`, `−0.3 kg`) and per week, and the dot chart on an axis fitted to the
  values (at least 2 points of body fat or 2 kg, 1 of BMI). A day with no measurement has no dot; 記録なし when the
  period has none. Never earns, no good / bad colours.
- **Rules:** a day's value is Health's latest, as reported: every day with a row counts, whatever its value; 記録なし is
  a day with no row (counted from the first activity record); today is drawn but not counted; the previous period is
  the same length just before. The footnote says so.
- **Cost:** the tab's code and strings (`i18n/kenkou.*.json`) load with the tab; the daily series is memoised per
  model and day. `?demo&weeks=60` makes a longer history with some missing Watch days.

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar,
  one CTA in a sticky footer above the keyboard.
- **Harvest** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both have tapped, the week's recap: each
  person's ベル, the ふたりでぜんぶ days and the total; 受け取る → the coins fall into the jar (ceremony only). ✕ = あとで.
- **Pair** (`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

✕ top-right closes the whole sheet from any level; ‹ top-left only when there is a level to go up to; a full page has
‹ 島へ. Backdrop tap and Esc also close. `ui/NavBar.svelte` + `ui/NavButton.svelte`; `ui/nav.test.ts` fails on a
modal without them. Sheets rise and levels slide in over 240 ms.

## Economy

A stamp card with small numbers. Rule `scoring/bells.ts`, economy on read `model/bells.ts`, values `config/rules.ts`
(`RULES`, `STRETCH`, `SHOP`); pinned by their tests, `model/properties.test.ts` and the golden fixtures. Earnings are
recomputed from the rows.

### Goals

Lists follow Apple's ring order, Move, Exercise, Stand, then steps (`RING_FRUITS`), except けんこう and the tree's popup
(steps first). Per person per Tokyo day, all or nothing: **+1 ベル for each goal met**.

| Fruit | Metric (Shortcut field → stored) | Daily goal |
|---|---|---|
| 🍐 Move | active kcal (`calories` → `move_kcal`) | per person `pref` moveGoal, 100–2,000 (default ウェイ 600, うめ 400) |
| 🍑 Exercise | Watch exercise minutes (`exercise_minutes` → `exercise_min`) | 60 min |
| 🍒 Stand | Stand Time (`stand_minutes` → `stand_min`) | 120 min |
| 🍎 Steps | `steps` (max of `steps`, `steps_watch`) | per person `pref` stepsGoal, 1,000–30,000 in 500s (default 8,000 for both) |

The Move and steps goals on a day are the last ones set on or before that Tokyo date (a change never re-prices an
earlier day). Everything that reads a goal reads that day's: the ベル, the tree's popup, けんこう's goal
line and goal days, あそびかた, and the all-four notification.

**がんばり (stretch):** +1 more for each goal reached at 1.5× (`STRETCH.multiplier`): 🍐 1.5 × that day's Move goal,
🍑 90 min, 🍒 180 min, 🍎 1.5 × that day's steps goal (12,000 for 8,000); at most **+2 a person a day** (`STRETCH.cap`, paid to the first in
`RING_FRUITS` order). A person earns 0–4 + 0–2 a day.

**ふたりでぜんぶ:** +2 shared when both meet all four goals the same Tokyo day (がんばり doesn't enter it). A day pays
0–14 for the pair.

### Numbers check

`scoring/bells.test.ts` asserts these (the pair, one week):

| Week | How | ベル |
|---|---|---|
| Most | every goal every day, both, two at 1.5× every day | (4 + 2) × 7 × 2 + 2 × 7 = **98** |
| Perfect | every goal every day, both, no がんばり | 4 × 7 × 2 + 2 × 7 = **70** |
| Typical | each goal on 5 of 7 days, both perfect on 3 days with one at 1.5× | 23 × 2 + 3 × 2 = **52** |
| Lazy | two easy goals a day, never all four | 2 × 7 × 2 = **28** |

### Rewards

Exactly two, one shared wallet (`SHOP`): 🍦 **おやつ 8 ベル** (`snack`) and 🍜 **外食 15 ベル** (`dinner`). A buy is
`spend {spendId, item, bells}` with `bells` exactly the item's price (the server refuses anything else). Either person
buys; either person undoes any buy (`spend_void`).

### The first week

The economy starts with the data: its first week is the first one with an activity row stamped by that week's lock
(`firstWeek`). A baseline of old days synced after their weeks locked never earns.

### Harvest and lock

- **Sunday 19:30 JST:** the harvest recap opens (nothing lands then: the week's ベル came in day by day).
- **The following Wednesday 04:00 JST:** the week locks. Until then its earnings move with late syncs; after, they are
  computed as of the lock. The lock is internal: nothing shows it.

### Wallet and buys

A day's ベル count in the wallet from that day. Buys and voids replay in server order.

- **Coverage:** a buy counts only if covered (everything earned up to its date minus earlier accepted buys); an
  uncovered buy is ignored, so the balance never goes negative.
- **Voids:** either of us, any buy, once; the ベル return. Buys and voids never lock.

## Health data

Steps, exercise, Move, Stand, weight and the body metrics (body fat %, BMI, lean body mass) come only from the
Shortcut's `metrics` rows; a day's value is its latest row,
so each sync replaces it with Health's current total (a locked week's earnings stay as of its lock). Nothing in the
app enters or fixes them.

What the app sends ([backend.md](backend.md#events)): the goals (`pref` `moveGoal`, `stepsGoal`, `goalWeight`, `goalBodyFat`, either person's
via `data.person`), buys and voids, harvest taps, the sender's `locale`, `villagerName` and `villager`, and
the ずかん's finds (`find`, the first of each). A buy and its とりけす wait 5 s before they are sent (touching the banner
holds it, ≤ 2 min).

## Weight

`model/weight.ts`, for けんこう's 期間の変化 and goal month; never earns (`deps.test.ts`). Plain arithmetic, no
smoothing: over the visible period, the first week's average weigh-in → the last week's when the weigh-ins span 14
days or more, else the first weigh-in → the last; under two, none (–). Per week: that change over the days between the
two weeks' middles, shown from 7 days apart. Goal month: from the last week's average at that pace, only when it heads
to the goal at ≥ 0.05 kg a week within 156 weeks (else 「あせらず、ゆっくり いこうね」; at the goal 「目標に届いています」).

The body metrics (`body_fat_pct` %, `bmi`, `lean_kg` kg; `State.body`, apart from the activity rows like weight) are
read the same way: a day's latest row, one decimal, within their bounds (body fat 2–70 %, BMI 10–60, lean 10–150 kg);
けんこう's 期間の変化 is the same plain change. Body fat has a goal (`goalBodyFat`, 3–60 %, one decimal, per person,
the latest only), its goal month worked out as weight's; BMI and lean mass have none. They never earn: bells.ts reads only the activity metrics, and
the cache keeps only their newest row per day once the week has locked, like weight.

## Island scene

`lib/components/island/*`: NH's island as a rolling log in 2D DOM around official renders ([World](#world)). What comes only on its days
(a visitor, the tape deck, the cake, the weather, the fireworks, Halloween's, a birthday's and the wedding's decorations)
is loaded the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load carries none of it. Light from the upper left;
each surface one fill, one gradient, one soft shade; no strokes on scenery. Only `transform` and `opacity` animate;
everything pauses while hidden (`data-paused`), and a sheet pauses particles, critters and idle life
(`data-covered`). Nothing on the island pays ベル.

### World

`island/world.ts` (every coordinate), `island/roll.ts` (the projection), `island/camera.svelte.ts` (the camera and
projector), `island/IslandScene.svelte`, `island/WorldGround.svelte`, `island/WorldWater.svelte`, `island/Scenery.svelte`,
`e2e/world.spec.ts`, `e2e/world-perf.spec.ts` (on demand: `WORLD_PERF=1`).

- **Units:** world units (1u = 1 CSS px at 390 wide at the pivot); x across (0…390 is the screen at the pivot), z into
  the island (the front shoreline is SHORE_Z −30). The plan spans x −230…620, z −460…2650; the land x −40…430, z
  −30…2250 (a 130u corner radius), the front beach z −30…110 (140u: fishing and diving from it), the side and back
  beaches 30u. The back zone is compact: the museum 1518, the cliff 1676…1720, the campsite 1830, a cedar forest
  behind it and palms on the back beach.
- **The rolling log** (`roll.ts`): θ = (z − camZ) / R on a cylinder seen at a 64° tilt with a mild perspective; R is
  set per screen so the horizon sits at 16% of the height and the pivot at 72%. `unproject` inverts it (Newton with a
  bisection fallback): a tap's world point, null in the sky.
- **The camera** is a native vertical scroller (overscroll contained; a drag scrolls, a tap is a click) in three
  **sections** (`sections.ts`, `e2e/sections.spec.ts`): **まえ** (the scroller's foot, where it opens: the sea with its
  fish shadows, the wide beach, the airport, the health lawn), **ひろば** (the plaza, Resident Services, the pond, the river) and **おく**
  (Nook's Cranny, Able Sisters, the museum, the cliff, the waterfall, the campsite). The stops are world.ts's CAMS
  (114, 860, 1440) fitted to the screen: まえ lower on a short screen so the sea in front of the beach stays in view,
  おく further back until the campsite's top is 16px under the HUD (as far as the plan reaches). The camera rests only on a stop: mandatory snapping (`scroll-snap-type: y mandatory`, `scroll-snap-stop:
  always`), and one section a swipe, however hard the fling: a fling that carries past the next stop is caught there
  (one frame of `overflow: hidden` cuts the momentum, as iOS allows; Chrome's touch fling skipped the middle stop in
  spite of `scroll-snap-stop`). A stop is a whole-px scroll position and reads back as exactly its camZ. A
  programmatic move (the end of a follow, a popup letting the camera go, the partner's edge face) eases onto a stop
  with snapping off and turns it back on there; a touch hands the camera to the finger at once. A resize keeps the
  section. Nothing runs per frame for it (the scroll events do the checking).
- **In 3D** (`components/world3d/`, `?island=3d` or せってい → しまの えがきかた; docs/decisions.md "The island in 3D"):
  `Island3D.svelte` puts a canvas under the stage's nodes (over the DOM sky: the sun and the moon stay behind the
  world) and hands the projector its camera (`World.useThree`); the engine (`engine.ts`) runs the World's step in its
  own frame (60 a second while anything moves, 30 while only the water does). The models: `layout3d.ts` from world.ts
  and the day's scenery and decor pieces (a card of today's art for what has no model yet); the villagers: cards of
  their renders posed from the director (`motion3d.ts`); the lights: `lights.ts`; the finger: `gestures.ts`. The ends
  are fitted per screen like the 2D ones (the shoreline 83% down at まえ, the campsite's feet half way at おく).
  `window.__world3d` (stats, view, go, client, ground) for the e2e (`e2e/world3d.spec.ts`).
- **The projector** (`camera.svelte.ts` `World`): every upright thing is a node at its feet (`{@attach world.at(…)}`)
  placed by one tick: an upright billboard (translate + scale, faded near the horizon, sunk behind it), a flat mark
  (also squashed by the ground's foreshortening) or a ground quad (a matrix3d, like the bands). **One depth order**: the
  z-index from the feet (nearer in front, ties by x); a tree is two nodes, its canopy 14u nearer than its trunk, so a
  villager just in front covers the trunk while the leaves cover its head. Overlays anchored in the world (a tree's
  popup, a bite's 「！」) stand over everything at their true size. Only nodes in [camZ − 260, camZ + 900] are shown.
- **The ground** is baked (`scripts/terrain.ts`, `npm run terrain`: one WebGL shader in Chrome, seeded noise, distance
  fields with soft noisy edges, 4× supersampling, no outlines; `cwebp`): the sea's turquoise rings, wet sand and lacy
  foam, the speckled sand, NH's grass with leaf flecks, ragged dirt paths with tufts and pebbles, the
  campsite's worn clearing, the meandering stream and pond (dark channel, light shallows, muddy banks, overhanging
  grass), the stream's mouth fanning into the shallows on the west beach, the stone bridge's deck (NH's own model seen
  from straight above, `bridges/stone-deck` and its snowy look from `scripts/models.ts`, drawn as a texture with its
  soft shadow on the water), the cliff's strata, the stairs and every still thing's contact shadow. 8 chunks of 270u per look (2 px a unit), drawn by 40 bands bent onto the log (`WorldGround`); chunks 0–3
  at once, 4–7 when the camera nears them or the browser is idle; only the day's look loads. **Six looks**, each
  dressed by `scripts/terrain-seasons.ts` (painted over the ground, under the contact shadows): spring (clover, 286 KB),
  **spring-petals** in the blossom days Apr 1–10 (cherry petals heaped under the blossoming oaks, along the paths' edges,
  a thin scatter elsewhere; 333 KB), summer (lush: tall tufts, clover, deeper green; 302 KB),
  autumn (dry patches in the warm grass; 260 KB), **autumn-leaves** in the fall foliage Oct 16 – Dec 10 (maple leaves
  heaped under the oaks and blown along おく's paths; the front lawn tidier, small piles close under its trees and a
  few strays; none on the sand; 291 KB), winter (snow in soft drifts lit from the upper left and
  blue in their lee, banks along the paths with their shade on the path, snow thinning out over the sand, the banks
  snowy to the water's edge: NH's rivers never freeze; 233 KB). Time of day is never baked (the tint does it). Upright sprites stand at
  the near edges: the cliff's face (40u tall, world.ts FACE_H: three broken layers scored top to bottom by NH's rounded
  ribs and grooves, a thick scalloped grass lip with long drooping tufts, eight carved stone steps with lit rounded
  noses and moss in the joints, mossy boulders at its foot); the stone bridge's near end (`WorldWater`: NH's model
  seen level, its top 36%: the end posts and the deck's lip, `bridges/stone-front`, snowy in winter). The pond's edge wanders
  and reed clumps (a few cattails) grow on its far and west banks.
- **The live water** (`WorldWater`): the shore's foam wash (`ShoreWash`), the waterfall's sheets, foam and mist
  (`Waterfall`: 50u wide and 45u tall, layered sheets with two slow translucent curtains, a wide foam pool, spray and
  mist), glints twinkling on the open sea, flow streaks down the river, the pond's lily pads and ripple (petals
  or maple leaves afloat in their weeks, and riding the river: NH's petal and leaf icons, one every ~50u from the falls'
  pool to the mouth, none under the bridge, each 36u downstream over 15 s, turning): CSS only, held still under a sheet and while hidden.
- **Layout** (`world.ts`): まえ: the wide front beach with the island's only palms (three, out of the way: one at each of its outer corners and a
  young one by the water on the left; the palm beetles keep to them), plumeria at the
  grass edge, the villagers' homes A (132, 214, ウェイ) and B (262, 214, うめ) on both phones (never mirrored per phone) with the goal trees on their outer sides (60 / 332,
  216), the tape deck between them, the rock, the dig spots, a cedar (34, 442) and an oak (328, 494) behind the lawn on
  either side, set back so their canopies leave the hedge in view, the hedge at z 600 with
  streetlamps at the bridge's front corners. One dirt path runs up the middle from the beach to the campsite's
  clearing, and on to the stairs. The stream rises at the spring on the upper tier, falls through the cliff (x
  351…393), meanders down the east side, bends west at z ≈ 700 and crosses the island between the health lawn and おく
  (z ≈ 645, its width breathing 29–33u), under the stone bridge where the path crosses it (`BRIDGE`: x 195, z
  622…670, 35.5u wide: NH's 30.2 × 40.8 model units at 1.18u each), out to its mouth on the west beach (fishing: the
  river along both reaches, the mouth's wide water, the falls' pool). おく: the month's bushes either side of the path, the pond (74, 772) with a
  flat rock on its east shore, the bamboo grove by the stream's bend (forward of the campfire, so the clearing's east
  side isn't one heap), the campsite's tent (196, 984) in its worn clearing with its sign, hollies
  and garden lanterns, white lanterns at the stairs' foot, the cliff (z 1040…1080) with its stairs (x 36…84), a cedar
  forest on the upper tier.
  **Balance** (`scripts/layout.ts`, `npm run layout` → `island/scatter.json`): the trees, the bushes, the props and the
  decor's spots are composed by hand in focal groups (the goal trees at the homes, the pond's corner, the campsite's
  clearing, the bamboo by the stream, the bridge with its lamps and the hedge), each section's mass balanced across the
  path; what fills between them is scattered: the wild flowers' clumps and the weeds' lawn spots by seeded
  best-candidate sampling (a Poisson-disk sampler: each pick the open-lawn candidate farthest from everything there,
  the picks taking turns either side of the path), every kind keeping its own gap (a clump 76u from a clump, 52u from a
  trunk, 72u from the bamboo, 34u from a prop; a weed spot 64u from the next), none under a canopy, behind a villager's
  spot, where a goal tree's fruit falls, in the villagers' stage in front of the homes or off the screen's edge.
  `scenery.test` checks the gaps and that no open lawn is more than 90u from anything (no dead zones). Rerun it after
  moving a composed piece, then `npm run terrain` (the shadows).
  **Wild flowers** (`world.ts` FLOWERS, `Flowers.svelte`): NH's flowers in seven clumps of 2–5 of one kind over the
  open lawn (four small ones on the front lawn, three round おく's ground), never on sand or a path; the season's
  kinds in turn (`scene.ts` WILD: tulips and hyacinths, lilies and roses, cosmos and mums, pansies and windflowers
  blooming on under the snow), 30u (pansies, windflowers, mums lower, lilies taller), each with a baked soft shadow.
  Each flower's id is where it stands (`fl:<x>:<z>`): watering, hybrids and the flower bugs key on it.
  **Decor** (NH's models and catalog icons): streetlamps, garden lanterns, garden and flat rocks, the month's bushes, a
  bamboo grove, and the campfire on the clearing's east side (262, 944; NH's `FtrCampfire`) with two log stools at it,
  clear of centre stage and the tent's door. Unlit by day; from dusk (.7) and at night its render's emissive look
  breathes, three tongues of flame flicker over the logs, a warm halo and a pool of light on the clearing, all lights
  (untinted, in the fire's depth: a villager in front covers them), still while covered or hidden.
  **The fixed decor** (`world.ts` DECOR_SLOTS, `island/fixedDecor.ts`, `e2e/fixed-decor.spec.ts`): NH's outdoor
  furniture at one scale (world.ts DECOR_U, 3u a model unit, the decorations' too: a bench 40u beside an 80u villager;
  the campfire 47u, the stools 19u), each in its own spot with a footprint. For good: まえ's one bench at the left grass
  edge facing the sea (`FtrParkbenche`, 40, 130); おく's hammock by the pond's front (98, 700), the log bench on its back
  bank (`FtrLogSofaL`) with the rod stand by the casting spot, the pump (250, 806), the shishi-odoshi at the bamboo's
  foot, the pull-up bar stand on the east lawn by the stream (`FtrPullupstand`, 330, 902) and the firewood by the tent
  (`FtrFirewood`). The seasons, never a new spot (a seasonal piece takes its own spot or the place of what stands
  there): the blossom days (Apr 1–10) the picnic set in the log bench's place and the cherry-blossom pond stone in the
  flat rock's; the young bamboo's window (Feb 25 – May 21) the bamboo-shoot lamp for the clearing's east lantern; the
  summer (Jun 1 – Sep 15) the beach chair and the sandcastle on the east beach (the castle from 05:00 until the tide
  takes it at 18:00); acorns' window (Sep 1 – Dec 10) the tree's-bounty lamp for the west lantern, the mushroom lamp in
  November; the foliage (Oct 16 – Dec 10) the maple-leaf pond stone; Dec 15 – Jan 6 the illuminated tree in the
  hammock's place; Dec 26 – Jan 7 kadomatsu for the stairs' white lanterns; a snowboy on the front lawn on a snow day
  (NH's snowball and its face), melting through NH's three stages over the next three days; Bunny Day's egg arch on the
  arch's spot. The seasonal lamps and the illuminated tree light at dusk like the lanterns. All from the date, the hour
  and the seed: the same on both phones. Every spot is a walk obstacle all year and a spot a decoration can't take
  ([Decorating](#decorating)), so a seasonal piece never lands on one. The permanent pieces' shadows are baked; a
  seasonal one draws its own. A tap answers where it stands (nobody walks, my villager turns to it): a bench creaks and
  sheds a leaf (`creak`), the bar rings (`clang`), the pump gushes (`pump`), the sandcastle and the snowboy puff, the
  rest knock softly. The shishi-odoshi tips (NH's model posed: `deco/shishiodoshi-tip`) every 15–25 s while it's in
  view and on a tap, and knocks back on its stone: `kon` (local, cosmetic). The new sounds are synthesized
  (`sound/synth.ts`).
  **The decor's life** (ambient life's beats, `island/ambient.ts`, `IslandScene`): an outing now and then stops at the
  front bench and sits 20–40 s; on a day a sit on the pond's bench (each its own seat); in the evening (19–22) a
  villager goes to sit at the campfire on its own stool (A west, B east) for 30–60 s; on a day its person met the
  exercise goal (🍑) a villager goes to the pull-up bar now and then and does pull-ups there; when both met every goal
  today, at dusk (17:00–19:00, each quarter hour both are home) they set off together for the front bench and sit side
  by side facing the sea for 90 s. A villager standing still on a seat (`world.ts` SEATS, just behind it) is drawn
  seated (sunk SEAT_DROP behind the seat, which covers its legs); both on one bench: a ♥ each. Like every outing, each
  phone sends its own villager's walk (villagerSync) and plays the partner's from the slot only while they're away;
  seated, the pull-ups and the ♥ follow from where the villagers stand, so both phones draw the same
  (`e2e/sync-harness.spec.ts`: A seated on the front bench is seated on B). Ambient only: a tap never sends one to sit.
  The pump waters every wild flower within 70u (each the shared `watered` op, as a tap's watering). The snowboy says a
  line in its voice on a tap (「さむいって いいね〜」…; melting: 「すこし ちいさく なっちゃった…」).
  `fixedDecor.test` holds the plan's rules: まえ one piece for good and two seasonal at most,
  nothing over the finds or the sea view, nothing over 40u in front of z 300, 40u from Gulliver and Daisy Mae; every
  spot 20u off a path, 24u off the dig, weed and flower spots, 30u off trunks, 60u off centre stage, the cake and the
  arch, 12u off the water.
  `scenery.test` keeps every piece off the water, the paths, the footprints and the features' spots, and the walk
  reaching every door; bamboo and rocks are obstacles like the trees.
- **Winter and night looks** (`scripts/models.ts`, [Official art](#official-art)): NH's own snowy models (the campsite,
  the trees, the bushes: `<art>-winter`) and the models' emissive light (the campsite's lantern and door, the lamps'
  glass: `<art>-lit`), laid over at dusk (.7) and night, over the tint (as the fireflies), with the lamps' glow
  (`deco/lamp-glow`, drawn: `scripts/derive-art.ts`).
- **Sizes** (`scene.ts`), NH's proportions against an 80u villager (≈ 45 × 76px at the front on a 393px screen): hardwood
  120u · cedar 140–150u · palm ~110u · bush 34–40u · flower 30u · hanging fruit 20u · ground fruit 24u · a shell 32u
  (its art, ≈ 22px drawn) · a star fragment 24u · the bottle 28u · a mushroom 26u · a dig spot 26u · a weed 24u · a
  branch 36u, a coconut 28u · a present ≥ 30u · the bugs 1.6× their drawn sizes (a butterfly ≈ 29u, a beetle ≈ 18–24u,
  a ladybug ≈ 14u, the tarantula ≈ 27u) · fish shadows 20–64u by NH's size 1–6 (an eel 44u; fresh water 0.65×).
  Every tap target is at least 44px ([Scene interactions](#scene-interactions)).
- **Fixed outside the log:** the sky (to the horizon), the HUD, the weather, the fireworks and the shooting stars;
  a haze where the ground meets the sky; one tint for the time of day over the land.
- **The cliff's face** sorts behind everything that stands (its depth at the plan's far end): a walker on the stairs
  or on the tier above draws in front of it, as does everything below it (`e2e/world.spec.ts`: the foot, the middle
  and the top of the stairs, and further back).
- **The tint at the source** (IslandScene): the ground takes it as one multiply plane; every world node but a light
  takes the same multiply as an SVG colour-matrix filter on what it draws (each image, svg and drawn bit; a wrapper's
  ::before / ::after), never on a wrapper, so a tap's shake, a hop or a bob, which WebKit draws in a layer of its own,
  stays tinted (on the wrapper, a tapped bush or tree flashed bright at night). A leaf's own filter takes the tint
  first (`var(--leaf-tint,)`). `e2e/world.spec.ts` checks no moving thing sits under a tinted wrapper.
- **Cost:** nothing runs when still: a scroll frame, a walk (one rAF while someone is on the way) or a change places
  what moved; style writes only when a value changes. Measured at 4× CPU throttling: see `docs/decisions.md`.

### Buildings

`island/buildings.ts`, `island/Scenery.svelte`, `island/Museum.svelte`, `e2e/tapwalk.spec.ts`. A building is one tap (on it or its footprint's
ground; my villager turns to it where it stands, no walk): NH's character inside answers in the balloon (its tail at the door, their colour
on the name tag) and when it closes the feature opens. Resident Services: しずえ (たぬきち 22:00–05:00) → せってい;
Nook's Cranny: まめきち・つぶきち → ごほうび; Able Sisters: あさみ → the むらびと picker; Dodo Airlines: モーリー →
つうしん (せってい at its sync section); the museum: フータ → the ずかん ([Museum](#museum)); the campsite: no line, straight
in through its door to the tent's inside ([The tent](#the-tent)). The panel keeps its せってい tab too (`ui.door` asks the panel for the section). **Wilbur** stands on the
dock while my partner has the app open (the relay's presence, the phone's one socket; `?wilbur` shows him); a tap and
he says so, in his radio talk (「…オーバー！」). The lines are short and in each character's NH voice: しずえ polite and
bright (「あっ、…さん！」), たぬきち's だなも, the Nooklings' echo (「いらっしゃいませ〜！」「…ませ〜！」), あさみ's shop talk
(her sister busy in the back), モーリー's "Hey hey hey!" (はいはーい！) at the gateway to the skies; a line may name my
villager.

### Environment

- **Seasons** (`ui-state/season.ts`): winter (snow) Dec 11 – Feb 24, spring to May 31, summer to Sep 15, autumn to Dec
  10. Oaks: blossom Apr 1–10, fall leaves Oct 16 – Dec 10.
- **Time of day**, Tokyo clock only: dawn 05–07, day 07–16, dusk 16–19, night 19–05; it sets the sky and one tint.
  Night is soft periwinkle, never black; the windows and lamps light up from dusk.
- **Hedge:** one species a month (Apr–May azalea, Jun hydrangea, Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly,
  Jan–Mar camellia). The wild flowers by season (`scene.ts` WILD).

### Particles and events

≤ 3 particles (petals, maple leaves, snowflakes on a snow day, summer fireflies but not in the rain). Snow lies on every
roof and on the cedars while it lies on the ground; petals float on the pond and down the river in cherry-blossom week
and maple leaves in maple week. Events (`eventsAt`): cherry blossom Apr 1–10, maple week Nov 16–25, Toy Day Dec 24, the balloon present.

### Weather

`island/weather.ts` (pure), `island/weatherNow.svelte.ts`, `island/Weather.svelte`, `e2e/weather.spec.ts`. Seeded by the
date (a weather day runs 05:00 → 05:00), so both phones agree: about one day in six is wet (rain all day, light or a
downpour; a wet morning; or heavy rain that clears at 16:00 and leaves a **rainbow** 16:00–17:00, 1 in 8 double). In
December–February a wet day snows instead (about one in four). Fine days only: **fog** at 07:00 October–March (1 in 8),
the **aurora** on winter nights 19:00–04:00 (1 in 10, not on a meteor shower's night). Fireworks days and meteor shower
nights are always fine.

- **Look:** an overcast sky and a darker tint on a wet day; rain one tiled layer of streaks moved by transform; snow
  two tiled layers plus NH's snowflakes (only on snow days); fog a haze with two drifting banks; the rainbow soft arcs
  low on the right; the aurora three swaying curtains. Over the tint, under every control.
- **Sound:** the hour's rain or snow arrangement when there is one, the rain bed, footsteps splash.
- **Critters:** the coelacanth only in rain or snow; the snail only in rain; NH's "any except rain" bugs stay away
  while it rains. No shooting-star showers unless the night is clear.

### Trees

`island/FruitTree.svelte`, `island/fruitDay.ts`, `e2e/trees.spec.ts`. A tree's fruit through one Tokyo day (a quick run of canopy taps shakes it: [Shaking a tree](#shaking-a-tree)):

- **Hanging:** each goal's fruit, 🍐 🍑 🍒 🍎 left to right, grey at 0 and filling with colour toward the goal
  (grayscale = 1 − share, washed lighter while grey).
- **Falling:** met, the tree shakes and the fruit drops to the ground in front of the trunk with a thud and a puff;
  once per phone, the first time the island shows it met; a reload finds it lying there.
- **Picking up:** a tap on a fallen fruit picks it up (a hop, a sparkle, a pop), gone on both phones until the next
  Tokyo day (the shared day's `fr:<person>:<fruit>`; our villager picks it up on the other). Either person may pick up
  either tree's fruit; cosmetic (no ベル). The fruit row is one button: a tap within 22u of a fallen fruit picks up the
  nearest, else it opens the popup.
- **All four met:** four warm glints twinkle on the canopy over a soft gold pulse (NH's money tree).
- **The popup** stands in screen space over every tint, in the middle of the band between the HUD and the screen's
  foot, roughly centred and leaning away from its tree (the goal trees stand at the lawn's outer edges, so the canopy
  stays tappable beside it); a tail toward the tree when the tree is above or below it.
- `fruit-day` in localStorage (`{ date, dropped, picked }`, ids `A:pear`): losing it only drops a fruit again.

### Shaking a tree

`island/treeShake.ts`, `island/TreeShakes.svelte`, `e2e/shake.spec.ts`, `e2e/shared-world.spec.ts`. Every tree on the
island shakes: the two goal trees and every oak, cedar and palm of the scenery (`SCENERY_TREES`; bamboo doesn't, as in
NH).

- **Tap or shake:** on a goal tree one tap on it (its canopy or its trunk) opens or closes the popup; on any other
  tree a tap on its leaves or its trunk (Scenery's `data-tree` hit areas, down to its base: the ground further round it
  stays the ground's; [Tap targets](#scene-interactions)) rustles it. The third tap
  within 1.2 s (and each quick tap after) is a shake: a goal tree's popup closes, the tree shakes where it stands and
  rustles (`tree-shake`), my villager turning to it (no walk).
- **What falls, by the kind of tree (NH's):** a hardwood (an oak, a goal tree) or a cedar: 1 in 8 a wasp nest, else 1
  in 7 a dangling bug, else 1 in 5 a branch (it lies beside the trunk until a tap picks it up; cosmetic). A palm: its
  two coconuts the first time it's shaken in a Tokyo day (they lie round its foot; a tap picks one up, NH's 「ヤシのみを
  ひろった！」), after that only, 1 in 8, a nest (NH: no branches or bagworms from a palm). At most one nest per tree an
  hour, on both phones. No furniture (NH's hardwoods drop some; scenery here never pays), and no fruit from a goal tree:
  its fruit falls when its goal is met.
- **Shared** ([Shared world](#shared-world)): a shake's outcome goes to the partner; on their phone my villager turns to
  the tree, it shakes and the same thing falls; their wasps charge their villager (only they can net
  them). What lies (branches, coconuts) is the shared day's: a reload or the other phone finds it there, and a pick-up
  by either of us takes it on both (first wins). `?shake=nest|branch|bagworm|spider|coconut` forces the next drop.
- **The nest:** three wasps buzz out and charge the villager who shook it for 1.5 s; a tap in time nets one (NH's catch
  line, a ずかん find). Too late, they sting: a 「！」, a sweat drop, and they fly off; NH's swollen eye (a pink lump on
  the villager's own eye, the near one on a render drawn looking right) stays for a minute. The wasp is weight 0 in the
  bug table: it only ever comes from a nest. The chase and sting have their own music ([Event music](#event-music)).
- **A dangling bug:** a bagworm, or in the spider's hours (19:00–08:00) a spider 3 times in 8, drops on its thread and
  sways for 10 s; a tap nets it, left alone it climbs back up.

### Scene interactions

`island/SceneTaps.svelte`, `island/sceneTaps.ts`, `e2e/scenery.spec.ts`. Every part of the island answers a tap softly
and counts for nothing (no ベル, state, navigation or writes); one `click` listener (a drag scrolls, so it never
reaches it); ≤ 4 flourishes at once, drawn as world nodes where the tap landed; taps on controls are ignored; nothing
while covered or hidden; decorative, `aria-hidden`, pointer-only. What nothing else took is a walk ([Walking](#walking)).

A bush jiggles and sheds seasonal leaves (1 in 10 a bug flies out; on the partner's phone our villager shakes it too,
the same bug: [Shared world](#shared-world)); a tree's leaves rustle (three quick taps shake it: [Shaking a
tree](#shaking-a-tree)); a flower is watered ([Island care](#island-care));
the sea ripples (1 in 10 a fish shadow); sand leaves footprints; grass puffs dust (snow in winter); a cloud squishes;
the sun glints; the moon bobs; the night sky twinkles (and grants a wish while a shooting star crosses: [Shooting
stars](#shooting-stars)); the pond rings; the campfire is poked where it is (its logs shift, five embers rise, a soft
crackle: `crackle`, synthesized).

**Tap targets** (`island/hitbox.ts`, `e2e/hits.spec.ts`): everything tappable answers on its whole visible body,
base included, at least 44 × 44px about its middle; in front wins. A tree is its leaves (Scenery's `.hit`, the canopy
button) and its trunk down to a little below its foot (`.hit-trunk`, a goal tree's `.trunk-btn`; ≥ 44px wide on
screen: `--inv`); a flower's `::after` grows it to 44px; what a module hit-tests itself (a shell, a fragment, the
bottle, a dig spot, a mushroom, a present, a weed, the rock, a bug, the tape deck, the cake) is the box of what it
draws (its img / svg: a node's anchor is a 0 × 0 point at its foot) grown to 44px (`hitOf`), the one in front (the
smaller world z) when two overlap (`pick`). `?hit` draws them all ([Dev params](#dev-params)).

### Balloon

NH's balloon present: by day every 45–90 s of on-screen time (the first after 20–40 s), in the sky's lane above the
ribbon (none on a sky too short). A tap pops it; the present falls onto the lawn nearest the current view, on the
nearest open grass clear of what lies there and of every control, bounces and stays until tapped (not kept across a
reload). A tap
opens it where it lies: the wrapping pops (confetti, sparkles, the catch fanfare) and the item is held up while the
plate reads 「カエルのチェアを てにいれた！」 (`island/catalog.ts`, its own chunk with its names, fetched when a present
lands). What's inside follows NH (Nookipedia, Balloon: the item drop rates, Bells and materials left out): furniture 35 :
clothing 20 : a season's DIY recipe 15 while a recipe season is on, else 50 : 25. The pool is NH's shop stock, 1,836
base items (no colour variants): orderable, sold by Nook's Cranny or the Able Sisters, no event, never DIY items, Nook
Miles exclusives or special characters'; the shops' season stock only in season (a kotatsu Dec–Feb), clothing twice as
likely in its style's season. The 126 recipes balloons carry, each in its NH window (northern hemisphere): cherry
blossoms Apr 1–10, young spring bamboo Feb 25–May 21, summer shells Jun–Aug, acorns and pine cones Sep 1–Dec 10, maple
Nov 16–25, mushrooms November, ornaments Dec 15–Jan 6, snowflakes Dec 11–Feb 24, Halloween October, Shamrock Day
Mar 10–17, Bunny Day's egg balloons on its days; a recipe shows NH's recipe card. Never Bells, nothing kept, but counted
in the ずかん (カタログ, レシピ: a first one gets the plate's second page). On Bunny Day a sky egg instead. Off the island it
drops into the sea. The catalogue is built by `npm run catalog:build` (`scripts/catalog.ts`: the ACNH spreadsheet's
JSON for the rules and the game's ja/en names, Nookipedia for the icons; 96 px webp under `static/art/finds/items|recipes/`,
~1.8 KB each, cached by the service worker on first use).

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/partnerNews.ts`, `island/PartnerNews.svelte`,
`e2e/shared-world.spec.ts` ([backend](backend.md#shared-world)). Both phones show the same island: what's caught or
picked up is gone on both, what a shake drops lies on both, each villager stands where its person sent it.

- **The villagers move as one:** each of us moves our own villager; the other phone plays the very same walk (from
  the same spot, at the same time, along the same way, facing the same way at its end), catching up when a message
  is late and walking off a small gap, so both phones have each villager at the same point (a two-tab check: within
  a step under way, the same point at the end). While the partner has the island open their villager follows only
  their phone (`island/villagerSync.ts`, [backend](backend.md#shared-world)). Asleep and awake too: both doze off at
  22:00 and wake at 05:00 at the same moment; a villager woken on one phone is awake on both for the same 10 s, and
  Gulliver woken by either of us is up on both for the day.
- **One layout, not mirrored:** A (ウェイ) lives on the left and B (うめ) on the right on both phones, whichever of us
  holds it: the homes, the goal trees, the meeting spots are by person, never by "mine / the partner's", and every
  shared id is by person or by where the thing stands (a flower's `fl:<x>:<z>`); `?demo` and `?demo&as=B` show the
  same island.

- **The partner's doings, played here:** when their change arrives (within 12 s of it), their villager turns to it
  where it stands (no run over, as on their phone) and it plays at the target (the net or the shovel there, a splash,
  a shake, a pick-up); a catch or a find is held up over their head with a small plate (「うめが スズキを
  つかまえた！」, `world.partner.*`) when it's in view, else a notice slides in at the edge on their side (the item's icon and the line, 3.6 s). Heard on opening (older),
  it only changes the island.
- **First wins:** of two people tapping the same thing, the relay's first claim is it; the other phone sees it taken
  by them (their villager holds it up) and its own tap does nothing more.
- **Late and alone:** a phone opening later hears the day from the relay (and keeps it: a reload needs only what's
  new); with the relay unreachable each phone keeps its own and they catch up when it's back.

### The guest

`contract/guest.ts`, `ui-state/cast.ts`, `ui-state/viewer.ts`, `e2e/guest.spec.ts` ([backend](backend.md#the-guest),
[decisions](decisions.md#a-guest-not-a-third-member-2026-11-02)). A third person, 「おきゃくさん」: a visitor to our island,
NH's way, with its own key (pairing: [runbook §4b](ops/runbook.md#4b-the-guest)). `?demo&as=G` is its phone.

- **What it sees:** our island, the trees and their popups, the ベル ribbon and the jar (to look at: its balance and the
  buys, 「ちょきんばこは ふたりの もの。」 in place of the shop, no ×), きろく (the ledger, the goals read-only) and
  けんこう's かつどう. Never a からだ figure: no からだ switch, no weight or body card, no weight or body fat goal (its snapshot holds
  none: the record leaves them out). せってい: its villager and name (the same picker, its own prefs), the sound, the
  language and あそびかた; no もようがえ, つうち or つうしん, and a line saying it's visiting.
- **What it does:** walks, catches, digs, picks up and shakes like us (the shared world's claims, first wins), its
  finds and counts its own in the shared ずかん (the museum: each entry credited to its first finder, the guest's
  name with 「（おきゃくさん）」 once it has one of its own; per-person counts, and a row of who found how many of the page
  once three share it); phrases over its villager, high-fives with either of us, and the tent: walking, sitting and
  arranging it. It earns and spends nothing, sets no goal, waters no flower and wishes on no star (the room would
  refuse those, so its phone doesn't try).
- **Its villager on the island:** there only while its app is open (the relay's presence), like an NH visitor. Each
  time the app opens it comes ashore at the front beach's right end and strolls up to its spot by the campsite, on
  every phone (its walk goes over the relay). It has no home and no tree. It moves only when the guest moves it
  (taps, the tent, a seat): no phone's idle life walks it, on its own phone or ours, no outing, no follow, no walk
  home after a while away; in place it bobs and blinks like anyone. It dozes 22:00–05:00 on the relay's clock with
  everyone. Closing the app takes it off our islands.
- **On our phones:** drawn like the partner's villager (the same billboard, its walks played the same way, lilac name
  tag); a tap on it is a high-five (to the guest), its phrases show over it, its catches play there (its villager turns
  to it, the plate says its name). A banner says it came: 「おきゃくさんが あそびに きたよ！」.
- **Who counts as "the partner"** (each "both of us" rule, said once): the guest never does.
  - Wilbur on the dock, the edge face (「うめの ほうへ」), `peer`: the other member only; on the guest's phone either
    member for `peer`, A for the edge face.
  - ふたりでぜんぶ, the goal walks, the evening meet-up and the bench gathering, the follow, the partner meeting a
    visitor: the members' own, on their own phones; the guest's phone plays none of them (A's and B's fruit still
    ripens on their trees there).
  - Ambient life (`ambient.ts`): the two members' villagers only, on every phone; the guest's villager is never in it
    (on the guest's phone A's and B's take their beats as on ours).
  - Group stretching: the members' two villagers; the guest's stands where it is.
  - The goal notification: the members' only; the guest's phone reports nothing and gets nothing.
  - Sleep: everyone, by the relay's clock; a wake is said with whose villager woke (`act wake`, `id` A, B or G).
  - High-fives: one at a time per pair, each with its `to`; the room holds the last one per (sender, recipient) pair.

### The island's layout

`layout/` (grid, catalog, model, height, nav, validate, diff), `store/layout.svelte.ts`, `scripts/layout-default.ts`
([the layout's contract](island-layout.md), decisions: *The island's layout is data on NH's tile grid*). The outdoors
is a layout anyone of us can change: NH's 30u tiles (20 × 46), each grass, sand, a path (dirt, stone, brick, plank), a
river, a pond or the sea, on cliff tiers 0–3; every tree, bush, flower, rock, lamp and piece of furniture, the bridge,
the stairs and the three homes an object on its tiles. Today's island is the default (`npm run layout:default`), its
objects exactly where they stood; うめ's and the guest's houses stand on the upper tier, up the stairs. Corners are
round (NH's), cliffs are steps of 40u, a river stepping down a tier falls. The members change the outdoors (the
desktop editor, then the phone); each person changes only their own home's look and room (the guest: its own house
and the tent).

### Decorating

`contract/decor.ts`, `store/decor.svelte.ts`, `island/decor.ts`, `island/Decor.svelte`, `island/DecorMode.svelte`,
`e2e/decor.spec.ts` ([backend](backend.md#events), decisions: *Decor is a last-writer-wins map*). Either of us puts
NH's outdoor furniture on the island, moves it and takes it away; both phones show the same layout, kept for good
(not day-scoped).

- **The items** (ten, NH's models in four facings, `scripts/models.ts` at one scale: 3u a model unit, a villager 80u):
  いしどうろう (stone lantern), バードバス, ガーデンワゴン, アイアンガーデンテーブル and チェア, レンガのいど, たぬきのおきもの,
  モンステラ, みちしるべ (signpost), いちりんしゃ (wheelbarrow). None of them is in the fixed decor (benches, the campfire,
  the shishi-odoshi, the hammock, the pull-up bar) and none is seasonal. At most 30 on the island, shared: either of us
  moves or takes away anyone's.
- **In:** せってい → もようがえ → はじめる (the panel closes; no new HUD control on the island). The tray stands at the
  screen's foot in the thumb's reach: the ten items in two rows of five and ✓ おわる with the count (「3/30」); a bar
  above it says what to do, or what is held and why it can't go.
- **Place:** a tap on an item puts it down as a ghost on the nearest fine spot in the middle of the view (lifted with
  a hop, its footprint on the ground; both stand over everything while it's held, so a tree or a villager in front
  never hides them). One finger on it drags it (the island doesn't scroll under it; a drag on empty
  ground still scrolls it, and a tap on the ground moves the ghost there); it moves a half tile (12u) at a time, its
  footprint green where it may stand and red where not, the bar saying why (「みずの うえには おけません」). ↻ まわす turns
  it a quarter, ✕ やめる lets it go, ✓ ここに おく places it (greyed while red).
- **Where:** on grass, sand or a path (NH lets furniture stand anywhere on the ground); not over the water, off the
  island or in front of the cliff's foot (the upper tier is out of view), not on the bridge or its ends, a fixed thing
  (trunks, bushes, lamps, rocks, the tent's footprint, the tape deck), another decoration, a villager, or what a tap
  must reach (the homes, the dig spots, the weeds' and mushrooms' spots, the flowers, the beach finds, a goal tree's
  fallen fruit, centre stage, the doors, the stairs' and the bridge's ends, the banks one fishes from, the villagers'
  outing spots); and never so it walls a place or a villager in (the walk graph with it must still reach every named
  spot home reached without decorations: tested on a drop, ~3 ms, not every move).
- **Move, put away:** a tap or a drag on a placed item picks it up (the same bar, with 🗑 しまう); ✓ puts it where it
  is now, ✕ back where it was. しまう takes it away at once with とりけす on the banner for 5 s (a new one where it
  stood). ✓ おわる places what's held (if it may stand there) and leaves the mode.
- **Out of the mode** a placed item is a world thing: in the one depth order, an obstacle the villagers walk round
  (the walk mask's cells under it and the tap navigation rebuilt when the layout changes), and a tap jiggles it where
  it stands (my villager turns to it: no walk). The partner's change, just made, puffs where it lands and their
  villager turns to it.
- **Cost:** the renders are 1–3 KB each, fetched as an item first shows (the tray's ten with the mode); the mode is
  its own chunk. A drag moves one world node a frame while the finger is down; nothing runs when still.

### The tent

`routes/tent/+page.svelte`, `tent/TentRoom.svelte`, `tent/TentEdit.svelte`, `tent/engine.ts` (three.js), `tent/grid.ts`,
`tent/items.ts`, `tent/dragLink.ts`, `store/tent.svelte.ts`, `contract/tent.ts`, `ui-state/doorTransition.ts`,
`scripts/room-models.ts`, `store/where.svelte.ts`, `e2e/tent.spec.ts`, `e2e/sync-harness.spec.ts`. A tap on the
campsite's tent walks my villager up to its door (the one exception to "a tap on something acts in place", the user's:
"we have to walk up to it before we enter it"; the walk goes over the relay like any, so the partner sees me walk up
and vanish inside; within 36u of the door it goes straight in; a tap on anything else on the way is the end of going
in), then goes inside: its own screen, truly 3D, behind NH's door (a black iris closes on the tent's door, stays black
while the room's chunk and first frame come, opens out of the room's door; the way out the same, opening on the tent
on the island, the camera where it was). Out of the door my villager stands just in front of the tent (A a step to the
left of the door, B to the right, both 30u in front, so the tent stays tappable), facing out, on both phones (the put
goes with the leaving).

- **One place at a time:** each villager is on the island or in the tent, on both phones (`store/where.svelte.ts`:
  presence over the relay, the tent screen's `tent {in}` as it opens and closes, said again whenever the partner joins
  or the socket comes back; the island says `{in: false}` to a partner who arrives). A villager in the tent is nowhere
  on the partner's island (hidden, its life there, outings, follows and meet-ups leave it alone, no high-five or
  phrase can reach it); inside, the partner's villager is there only while the partner is. A phone that goes quiet
  inside (closed, offline) has its villager home on the island again after 30 s (avatar.ts SNAP_HOME_MS).

- **The room:** NH's largest, the main room fully expanded: 8 × 8 tiles (Nookipedia's upgrade table: the main room
  6 × 6 → 8 × 8, the second floor and basement 10 × 6 = 60 tiles, so 8 × 8 = 64 is the most floor), NH's own grid (a tile
  10 model units: RoomMdlFloor8x8 is −40…40), four walls four tiles high (RoomMdlWall) on a dark base, the front one with
  the door (two tiles wide, three high) and NH's doormat inside it; its two tiles stay clear.
- **The camera** starts as NH's room camera (perspective, 47° down, a long 32° lens, from the front), fitted so the whole
  room shows above the edit tray's room; then it's the player's: a drag on the room turns it round the room's middle and
  tilts it (28°–78°), a pinch (or the wheel) zooms it (0.55–1.35 ×), the 🏠 button (shown once it moved) eases it back.
  A corner-on view steps back to keep the square in; the walls between the camera and the room are cut away (Happy
  Home Paradise's look), so the room shows from any side. A tap walks, a drag turns (in the edit mode a drag that
  starts on a piece moves the piece instead).
- **The light:** warm interior light (a soft sky over a warm floor bounce, a key from the upper front left casting the
  room's one small shadow map, 1024², redrawn only when a piece changes, a fill from the camera's side); at dusk and
  night dimmer and warmer, the lamps' emissive on and up to four warm point lights at the lamps (a tap turns a lamp on
  or off).
- **The villagers** are billboards of their official renders (NH's 3D villagers would mean converting all 417: too much
  to ship), standing at their feet, turned to the camera about the up axis only (leaning back 45 % of the camera's tilt
  so a steep view doesn't squash them), cut out by alpha test (depth sorted with the furniture: behind a table it hides
  them, in front of it they cover it), 16 model units tall (a bed is 20 long), each with a soft round shadow, mirrored
  to face the way they walk on screen. The renders have no walk frames: the walk is NH's trot, a bob and a squash a
  step. A tap on the floor walks mine there (A* on half tiles round the furniture, rugs walkable, the corners pulled
  straight; 30 units a second); a tap on a villager hops it (only where it's drawn, its alpha); a tap on a piece acts
  in place (my villager turns to it, it jiggles, a lamp switches); the doormat or ‹ 島へ goes back out.
- **The partner's villager** is theirs to move while they're in the tent (each walk of mine goes over the relay as the
  `tent` intent, the very walk: from, the way, when, how long; a join hears where I am); while they're away (not on the
  relay) their villager rests in the room where it last stood; while they're on the island it isn't here.
- **もようがえ** (the foot's yellow button) arranges the room: the grid on the floor and the tray in the thumb's reach:
  tabs かぐ (the starter set), ラグ, みつけた (every furniture either of us found in a balloon's present that NH has a model
  of: the ずかん's カタログ, newest first), かべがみ, ゆか, over NH's own icons in two rows that scroll sideways (60 px), and
  ✓ おわる with the count (「3/40」). A tap on a piece's icon puts it down as a ghost on the free spot nearest my villager,
  lifted, its footprint on the floor green where it may stand and red where not, the bar above saying why
  (「でいりぐちは あけて おこう」, 「ほかの かぐと かさなります」, 「むらびとが いるよ」…); a finger on it (or on a placed piece,
  which picks it up) drags it a tile at a time; a tap on the floor moves it there; ↻ まわす turns it a quarter (about
  its middle); ✓ おく places it (greyed while red); 🗑 しまう takes a placed one back to the storage (とりけす on the banner
  for 5 s); ✕ やめる puts it back. A wallpaper or a floor is on at once. **Where:** on its whole tiles inside the room,
  off the door's two tiles, not over another piece or a villager; a rug lies under the furniture (and may cover the
  door's tiles), never over another rug. At most 40 pieces, shared (the wallpaper and the floor don't count): 64 tiles
  and the phone's draw budget.
- **Turning:** ↻ or a tap on the piece I hold turns it a quarter clockwise (a tap: under 8 px and 450 ms; a drag
  moves it; a tap on another piece picks that one), easing round.
- **Table tops** (NH's surfaces): NH's surface flag and its small things come from the ACNH spreadsheet (the game
  files have no params for it): a piece flagged `surface` (tables, desks, counters, shelves, dressers, the fireplace: 60
  of the pieces, 12 of the starter set) holds small things (the spreadsheet's Miscellaneous, one tile: 126; the lantern,
  the lamps, the kettle, the tea set…) on its top, one to a tile of its footprint, at its height (its model's top). A
  small thing held over a surface goes on it (the footprint at the top); its op names the piece (`on`) and its slot
  there, so moving or turning the table carries what's on it (the ghost carries them) in one op. NH's rule for putting
  away: not with things on it (「うえの ものを さきに しまってね」). A thing on a table blocks neither the floor nor a walk.
  A race (one of us puts the table away as the other puts a lamp on it) leaves the lamp on the floor at its slot's tile,
  the same on both phones.
- **On the walls** (NH's wall-mounted things: the ACNH spreadsheet's Wall-mounted, 54 with a model here; ten in the
  starter set: the log, cuckoo, pendulum and ironwood clocks, the iron wall lamp and rack, the tool board, the
  corkboard, two wreaths): the かべかけ tab; a piece hangs on a wall's grid (a tile across, a 5-unit step up, never
  over the door or another), lands on the first free spot of the back wall, goes where a wall is tapped or dragged
  along the walls; its facing is its wall's (no ↻). Its op: x the tile across, z the step, f the wall. A wall cut away
  takes its things with it.
- **Sit, lie and switch** (`tent/seats.ts`): NH's own interaction from the ACNH spreadsheet (`interact`: a Chair is sat
  on, a Bed lain on: 38 and 20 of the pieces); a sofa seats one a tile across, a double bed two. Outside the edit mode a
  tap on one walks my villager up to it (a step in front: physical, like the door) and it sits facing the piece's front,
  or lies on the bed; a tap on the floor gets it up and walks it. The renders have no sitting or lying art: sitting, the
  billboard sinks into the seat to the hips; lying, it lies back along the bed facing up. One villager a seat, the first
  to sit keeps it (presence: the `tent` intent's `seat`). A light (NH's lighting type, the fireplace: 37 pieces) switches
  on or off with a tap, kept with the piece (its op's `l`) on both phones; it glows (its emissive) while on, and in the
  dark lights the room round it (up to four point lights). NH's room light switch (💡, top right) dims the room's own
  light; at night, or with it off, the room is lit by whatever is on.
- **The Happy Home Academy** (`tent/hha.ts`, `HhaLetter.svelte`): the first time someone comes in through the door
  after the room was changed that day (Tokyo's), ハニワくん's letter rates it, once a day on each phone; the ハニワ button
  (top right) shows the rating as the room is now. Worked out from the shared room alone, so both phones agree: NH's
  HHA base points from the spreadsheet (a second of the same thing half, a third nothing; the wallpaper and floor
  too), a series of 3 or more (120 each, 600 more from 6: まるた, ラタン…), a theme and a colour that 4 or more and half the
  pieces share (NH's concepts and catalogue colours: 80 and 60 each), the lights on (250, then 100 each up to four), the
  space (the floor 30–65 % used 700, near it 300; something on a table, something on a wall, 200 each) and the kinds
  of thing (60 each, up to 600). どうの ハニワ from 3,000, ぎん from 6,000, きん from 10,000 (a starter camp ≈ 1,900, a log
  room ≈ 4,700, the log room grown and lit ≈ 8,500). One remark: what would help (empty, sparse, crowded, dark) or the
  best of what's there, its series, theme or colour named. The numbers are their own chunk (`hha.json`, from
  `npm run room-models`), fetched only for a rating. No ベル.
- **Shared and kept:** the room is both of ours, live on both phones: each change is one op (the island's `decor` op
  with the room's scope, last writer wins, the sheet keeps each piece's latest: `contract/tent.ts`,
  [backend](backend.md#events)). While I hold a piece, the partner's phone sees it move as I move it (`drag`, ≤ 10 a
  second, presence only): lifted where my finger has it, eased between the updates, a yellow footprint where it would
  land, and not theirs to pick up (「ウェイが うごかしているよ」); if we grab one at once the earlier hold keeps it; silent
  for 2 s (or the partner gone) it drops back where the room has it; the drop is the op, which lands before the drag's
  end, so it never jumps back.
- **Cost:** three.js and the room's code are their own chunk, fetched only when the tent opens (the island never loads
  them: `e2e/tent.spec.ts`); no MSAA; the device pixel ratio capped at 2, 1.5 while the camera moves; frames are drawn
  on demand (a walk, a gesture, a piece popping in, the partner's held piece), none while still; everything is disposed
  on the way out (the WebGL context too). A full room (35 starter pieces and rugs): 71 draw calls, 49 k triangles; a
  full turn of the camera at 1.5×: a frame's own cost p50 0.3 ms / p95 0.5 ms (Chrome, M-series), p50 2.8 / p95 4.2 ms
  with 4× CPU throttling, frames 16.7 / 18.5 ms apart; Playwright's WebKit p95 1 ms, 17 ms apart (2026-11-02).
- **The models** (`npm run room-models`, NH_MODELS=~/Downloads/Model): NH's furniture, rugs, wallpapers and floors
  converted from the game files to files the app serves (`static/room/`): each piece a glTF with NH's materials baked
  into one WebP texture each (≤ 256 px; NH's gray albedo × its gradient, a little of its ambient occlusion, its
  opacity as alpha; the emissive kept for lamps), quantised and meshopt-compressed by gltfpack, ≤ 40 KB aimed for
  (≈ 18 KB on average); its footprint from the model's bounds, NH's catalogue size winning where they differ;
  wallpapers 256 × 512 (two tiles across, the wall's height), floors 512² (four tiles); NH's own catalogue icons.
  Cached by the service worker on first use (`island-room-v1`, a model's URL carrying its content hash), never at
  install.

### Critters

`island/Critters.svelte`, `island/critters.ts`, `island/critterPath.ts`, `e2e/critters.spec.ts`. NH species on the Tokyo
clock, for fun and frequent, and the same on both phones (ambient life's 10-second slots, `island/ambient.ts`,
docs/backend.md "Ambient life"): the sea holds a shadow or, 1 turn in 4, bubbles most of the time, a fresh water its
own shadow ([Pond](#pond)), and a bug comes by every so often, each of the same kind and species on both phones and
leaving at the same boundary. **Where it is, is the world's** ([Shared world](#shared-world)): its seed picks the fresh
water, the swim patch, the trunk, the flower head or the patch of grass, and every glide, hop, dart, rest and landing
at its time after it came (`critterPath.ts`), so both phones have it at the same spot doing the same thing, and a phone
opening mid-stay finds it where the other shows it; each phone shows it when its camera sees that spot (covered or
hidden, the critters leave; back, those still staying are there); ≤ 1 in each water and 1 bug. A catch or an escape
is shared by the critter's id (first wins): it's gone on both phones, and on the partner's their villager turns to it
and it's netted, reeled in, dived for or dug there, and held up. A bug out of a shaken bush, from under the rock or off my
villager is put on the island for both (`put`), its moves from its id. **Seasons are a flavour, not a gate:** any species in any month, 3× likelier in its NH
northern-hemisphere months; hours still hold.

- **Fishing** (the sea in front of the beach, seen from まえ, or a fresh water: `critters.ts` `Water`): a shadow (NH
  sizes 1–6) dawdles there. A tap near it casts a bobber, the line from the bank in front of it (my villager turns to
  it where it stands); the fish closes in over 2–3 darts, nibbles
  0–3 times, then bites: the bobber is yanked under, a small 「！」 pops over it, and a tap anywhere in the next 1.6 s
  catches it. The first early tap makes it hesitate; a second scares it off. 1 in 14 a boot, tire or can.
- **Fish** (all 34 of NH's sea and pier fish, `FISH`): NH's shadows by size (20–64u, the eels long and thin; a fin for
  the sharks, the ocean sunfish and the suckerfish); the coelacanth only in rain or snow.
- **Bugs** (74 of NH's 80, `BUGS`), each where NH keeps it: butterflies and moths in flight and landing on the flowers
  (the moth round the lamps); the ladybug and mantises on a flower's head; dragonflies and fireflies near water;
  cicadas, beetles and the walking stick on the oaks' and cedars' trunks (NH's stump bugs too: the island has no
  stumps); NH's palm beetles on the palms (the cyclommatus and golden stags, the horned atlas and elephant, the goliath
  beetle); grasshoppers, crickets, the pill bug
  and the centipede in the grass; the hermit crab and the wharf roach on the beach; the mole cricket under a chirping
  mound (a tap digs it up); the tarantula and the scorpion at night, gentle: the first tap makes one rear up, a second
  while reared makes it charge off, and once it settles a tap nets it; a flea hops off my villager 1 in 10 taps
  (Apr–Nov); the pondskater, diving beetle and giant water bug on the pond and the river's still reach. A tap nets one;
  within 80px it startles away (on both phones). A bug a dev hook brings keeps clear of every control; one of ambient
  life's sits where its seed puts it (a tap on it comes first, before a control under it). Left out: the blue weevil beetle, the giraffe stag
  and the horned hercules (no icons), the dung beetle, the ant and the fly
  ([decisions.md](decisions.md#the-rest-of-nhs-bugs-what-the-island-can-hold)).
- **Diving** (`island/sea.ts`, NH's 40 sea creatures, loaded with the first bubble spot; `e2e/dive.spec.ts`): 1 turn in
  4 the sea holds a spot of bubbles instead of a shadow (gone after 30 s). A tap dives: still and slow creatures are
  caught at once; a medium one half the time, else, like a fast one, its shadow darts off and a second tap on it in
  time (1.6 / 1.3 / 1.0 s) catches it; a very fast one gets clean away 1 time in 3. 1 spot in 25 is a pearl (a shell
  in the ずかん).
- **The catch:** the official icon pops onto a plate with NH's catch line (`island/catchLines.ts`: English from
  Nookipedia, Japanese from the game), loaded with the first critter. The plate sits above (else below) the catch,
  clear of every control and overlay, else low in the middle like NH's box; a tap dismisses it. The catch is held up
  over my villager's head while it reads.
- **Cost:** each critter is a world node; it moves by CSS transitions inside it between waypoints a timer picks (no
  rAF), one wing or fin loop each; one timer between visits; art on first need. World cues `scene-<kind>`, quiet and jittered ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`, `island/sceneDay.ts`, `e2e/finds.spec.ts`. The day's items derive from the
Tokyo date and time plus a seed, so both phones agree; what either of us picks up, digs or opens is gone on both
([Shared world](#shared-world): a `pick`, claimed at the tap, first wins; this phone keeps its own in `scene-day` too),
the next dig spot is the same on both, and on the other phone our villager turns to it, it's picked up (or dug) where
it lies, with the line. The first of each shell, fossil and fragment is a ずかん `find`, written when it's picked up (and still ours).

- **Seashells** (NH's eight; the summer shell rare, likelier June–September): one washes up every 60–120 s, the newest
  three lie on the sand. A tap picks it up: 「タカラガイを ひろった！」.
- **Where things lie** (`beachSpot`): shells, fragments and the bottle keep 34u apart (`BEACH_GAP`), each taking a
  spot that far from everything there in a seeded order; worked out once per date and seed, so nothing moves.
- **Fossils** (all 73 of NH's: the standalone ones and every dinosaur piece, `FOSSIL_SETS`): NH's star-shaped dig
  spot, 1–2 at a time on six lawn spots (`world.ts` `DIG_SPOTS`: four on the front lawn, two behind the trees), each
  shown only where it's clear of every control on this screen. A tap digs it up (the shovel, a burst of earth, an open
  hole that fades): 「化石を ほりだした！ アンモナイトだ！」. The next turns up 20–40 s later.
- **Mushrooms** (`island/mushrooms.ts`): every November day 1–2 beside the trunks (1 in 8 October and December days
  one), NH's weights; a tap picks one up. 1 in 20 November dig spots hold the rare mushroom. Cosmetic: no `find`.
- **Message bottle:** every 8–14 minutes one rocks at the water's edge for 6; a tap reads its note (16 kind notes).
- **Star fragments:** each wish on a shooting star, either of ours (`wished`, kept by the store past its day and in
  the sheet's day row), is one fragment on the beach the next morning (from 05:00, at most 8), now and then a large one
  or the season's zodiac fragment (twice as likely after a meteor shower), twinkling now and then.
- **A balloon's present:** where it lands it's put on the island for both (`put`; the balloon itself is each phone's
  own); either opens it, what's inside decided at the tap and shown on the other phone too (「うめが ○○を てにいれた！」).

### Island care

`island/Care.svelte`, `island/care.ts`, `e2e/care.spec.ts` (no ベル, no find):

- **Weeds** sprout every 30–60 minutes on the lawn's free spots (`LAWN`), the newest three at a time; a tap pulls one
  (`scene-weed`), gone on both phones (our villager pulls it on the other).
- **Watering:** a flower tap is NH's watering can (a tilt, drops, a glint; `scene-water`); a flower watered today, by
  either of us, glitters for the day on both phones (`wateredOn` and the shared day's `watered`, by the flower's id `fl:<x>:<z>`,
  from where it stands). The flowers watered yesterday, both people's, have a 1 in 4 chance of a hybrid colour on one
  of them today, the same one on both phones (NH's hybrids by kind, simplified: `care.ts` hybridsOf; `scene-garden`).
- **The rock** (on the health lawn behind the left tree): a tap clonks it with the shovel (on both phones); 1 in 4 a
  sparkle, 1 in 8 a pill bug or a centipede crawls out (on both: a `put`).
- Weeds, dig spots and the rock are measured clear of the controls on each screen (a covered spot isn't shown).

### Pond

`island/pondFish.ts`, `island/critters.ts` (`freshWhere`, `freshAreas`), `e2e/pond.spec.ts`. NH's pond at the plaza's
left (`world.ts` `POND`, an oval 80 × 44u baked into the ground with lily pads and a slow ripple live on it), the river
and its mouth, and the spring and the river above the cliff.

- **Fresh water by where you cast** (NH's locations, `freshWhere`): the pond's 12, the river's 27, the river mouth's 3
  (salmon, king salmon, sturgeon) and the clifftop's 4 (char, cherry salmon, golden trout, stringfish); as in NH the
  river's own also come to the mouth and the clifftop. `FRESH`, its own chunk fetched with the first freshwater shadow.
  Season weights the odds, hours hold, rare = low weight.
- **Visits:** as often as the sea's (their own slot), one shadow per water, to the water and reach its seed picks
  (the same on both phones, in view or not: `critterPath.ts` freshWater), 45 s if nobody fishes, drawn at 0.65 of the sea's size; my villager fishes from the pond's bank (`pondside`) or the
  river's nearest bank.
- **Its bugs:** the pondskater and diving beetle by day in summer, the giant water bug at night.
- **The catch:** a ずかん `find` of kind `fish`, like the sea's.

### Museum

`island/Museum.svelte`, `island/blathers.ts`, `e2e/museum.spec.ts`. NH's museum (the upgraded building's map icon, one
family with the other buildings, 104u tall) in おく between two oaks (`world.ts` `BUILDINGS`), the door to the ずかん: a button (「はくぶつかん：ずかんを ひらく」, a
soft knock). A tap and Blathers says one line: drowsy by day (05:00–19:00), lively at night, and 3 times in 5 about the
latest find of the last week. When his box closes the panel opens on きろく scrolled to the ずかん; a second tap while
he talks opens it at once.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/ZukanCard.svelte`, `kiroku/zukan.ts`, `model/finds.ts`, `model/tally.ts`,
`e2e/zukan.spec.ts`. The ずかん in きろく, shared (the first `find` of either of us): さかな 80 (the sea's 34 and the pond's
46), むし 74, うみのさち 40, かせき 73 (laid out like NH's museum: the standalone ones, then each dinosaur with
「Tレックス 1 / 3」), かいがら 9 (the pearl last), and a balloon's presents: カタログ 1,836 (by NH's categories: かぐ,
こもの, かべかけ, てんじょう, トップス... かさ) and レシピ 126 (by season). Every catch and pick-up counts: each found tile shows
「×12」 and the picked entry's head the total and each of us (the day tallies, `tally`, backend.md#tally); a find from
before the tallies counts 1. カタログ and レシピ load their names with the page (`i18n/catalog.ts`, the language on screen)
and build their grid a slice per frame, as the むらびと picker. A kind's page: every entry in the game's order, the official icon and name for found ones, a silhouette and
？？？ for the rest, 「コンプリート！」 when all are in. The page's head is pinned: the kind and its count, and the picked
entry (icon, name, 「7/4 ウェイが 見つけた」 and NH's catch line, two lines, ▼ for more); the grid scrolls under it.
Names of everything catchable live in their own catalog (`i18n/catch.ts`), loaded with the ずかん or the first catch.

### Dialogue

`island/pager.ts`, `island/Talk.svelte`, `island/Plate.svelte`, `e2e/dialogue.spec.ts`. The speech balloon and the catch
plate read like NH's box: 33 ms a glyph, two lines a page (split at the text's line breaks). A tap finishes the page,
the next turns it, the last closes it; an orange ▼ bobs while another page follows. Left alone a page turns after 6 s
and the last closes after a read's length. The balloon's name tag is tilted on its top-left in the speaker's NH
colour. No voices. Multi-page: some villager lines go on (`<key>.more`), a visitor's first tap is their introduction,
a first find adds 「ずかんに のったよ！」. A line may end on NH's answers (Jack, K.K.).

Where it stands, one rule for every speaker (my villager, the visitors, Blathers; `placement.ts` `placeBy`,
`e2e/bubbles.spec.ts`): by the speaker, its tail pointing at them, at most 40px off: above the head when there's room,
else beside it, else below the feet, sliding along so the tail still reaches. Room gives way step by step, nearness
doesn't: clear of every control, else over the museum (both within 16px); else over the island's things (trees, fruit
rows) but not the villagers; else over them too. Never over the HUD, しずえ's box, a popup or another overlay, the
speaker, or off the scene. It follows a speaker who moves (a move lasting 0.6 s) and closes if they go. Plates and
captions (`place`: the catch plate, the wish, K.K.'s caption) keep clear of every control, nearest first. Every balloon,
plate and caption keeps 12px (`EDGE`) from the screen's sides and foot, above the home indicator. The catch plate is one
plate for every discovery (catches, finds, a present, its first-find page): the icon at its start, two lines a page, the
▼ in its own room at the right; the captions (the wish, K.K.'s song, Gulliver's sleep talk) share one pill
(`.if-caption`: the plate's colours, 13px).

### Villager taps

A tap on my villager is a squish and the tap sound (R9; no ♪ any more: the picker is its answer), and in NH's flea months now and then a flea hops off
it ([Critters](#critters)); it opens the phrase picker by it (`island/SayPicker.svelte`, `island/say.ts`,
`e2e/say.spec.ts`), never a sheet. The picker is a small cream card in the reactions wheel's spirit, standing by my
villager by the balloons' rule (never under the HUD; above the keyboard while one is up; outside the scroller, so its
field never scrolls the island): 「なにを いう？」 and ✕, six presets in two columns (やっほー！ おつかれさま！
がんばろう！ やったね！ いっしょに あるこう！ おやすみ〜), my own last three (kept on this phone, `island.says`), and
「じぶんで かく…」: a field of at most 20 characters (cut only when the IME isn't composing; a counter), もどる and
いう; Enter sends. Every target ≥ 44px. ✕, Esc or a tap elsewhere closes it, as a tree's popup: on the ground that tap
only closes (nobody walks), on a control it still acts (the flea is netted), on my villager it only closes. A pick
closes it, hops my villager and shows the phrase in its balloon for 4 s (`island/Says.svelte`: Talk's cream balloon,
the name on a tag in the person's colour, its tail at the villager, clear of its emote and the other villager's; it
follows a walk, steps aside while the camera moves; text, never markup; taps go through it). A newer phrase replaces
it. On the partner's phone the same balloon shows over my villager there, which hops too (the relay's `say`, presence
only: a phone that is closed simply never sees it, one opening later doesn't either; at most one per 1.5 s, the newer
waiting). No sound beyond the UI cues, no ベル. The speech balloon (`island/Talk.svelte`) is for the island's other
speakers: the doors, the visitors, Blathers, Wilbur. One balloon at a time.

A tap on the partner's villager is a **ハイタッチ** straight away (no card), in place: the tap sound, they stop where
they are (either woken first if asleep), a sparkle flies in an arc from my villager to them, and both turn to each
other and hop with the sparkles and one joyful sound (R4, which never waits behind another reaction); hearts on them
as it lands. The banner 「うめさんに ハイタッチ！」 on this phone. It goes over the relay only (`highfive {at}`, the tap's
relay time; never the sheet): their phone plays the same moment from the same start (~50–65 ms later via the test
relay): their villager, which is theirs to move, stops where it is (and says so), turns to mine, my sparkle flies to
it, both hop, hearts on theirs, and 「ウェイさんからハイタッチ！」. Closed, their phone hears it when it opens (the room
holds the last one for them, a day at most): the banner and R5's hearts. Each one is heard once (`island/highFives.ts`:
today's heard ones on that phone, by their tap's time). A tap while one is under way adds nothing, and both tapping at
once plays one (each phone its own). Relay down: the moment plays here, the partner hears nothing. Their numbers and when their data last arrived are on their tree's popup (the card's one line about their
day went with it). Off screen, the edge chip by the screen's side (「うめの ほうへ」) still brings the camera to them.

### Visitors

`island/Visitor.svelte`, `island/visitors.ts`, `e2e/visitors.spec.ts`. NH's visitors (official renders), one at a time,
seeded by the date: **K.K. Slider** on Saturday nights 18:00–24:00, **Daisy Mae** on Sunday mornings 05:00–12:00,
**Wisp** on 1 in 4 nights 20:00–04:00, **Gulliver** on 1 in 4 days 06:00–18:00; **Jack** on Halloween night,
**Celeste** on a meteor shower's night, the holiday hosts on their days, the wedding couple on its days. Priority
(`visitorAt`): the event's host (Jack included), the wedding couple, Celeste, then K.K. and the rest. They stand on
centre stage in the plaza (ひろば) at the villagers' scale times their NH height, with a contact shadow; as in NH,
**Gulliver washes up on the front beach** and **Daisy Mae wanders the front lawn** (both seen from まえ). A tap (while
they're on screen): my villager turns to them where it stands, then their introduction the first time, then one of their lines
(`visitorInView` says whether they're on screen now). No trading, no ベル.

**K.K.'s show:** with ミュージック on, a tap is his greeting with NH's choice box, **リクエスト** (up to four songs) or
**おまかせ**. The island's music stops for the song ([K.K. Slider](#kk-slider)), he strums harder, ♪ float up, the
villagers sway and a 「♪ けけボッサ」 caption sits by him. A tap mid-song offers ストップ / つづけて. At its end his
sign-off and the island's music returns. With no song files he says he's tuning his guitar; with the music off he only
talks.

### Visitors: life

`island/visitorLife.ts` (pure), `island/Visitor.svelte`, `island/avatar.ts` (`meetVisitor`, `visitorRoute`),
`e2e/visitor-life.spec.ts`. The visitor is the stage director's fourth actor (`'visitor'`): its walks, motions,
emotes, fx and facing use the villagers' calls, and idle life gives it a beat on every slot (awake or asleep), drawn from the slot's PRNG.

- **Always (CSS):** a breath (2.4–3.2 s, each its own) and now and then a weight shift, on separate transform
  properties so loops add up; the contact shadow breathes with it.
- **Signatures (NH):** K.K. strums with a head-bob (harder mid-song); Wisp floats, drifts and flickers; Jack sways and
  twirls with a spooky glint; Daisy Mae shifts her turnips and hums; Franklin waddles, flaps and looks about; Jingle
  bounces with a sparkle; Pavé dances Festivale's steps and a samba with confetti; Zipper hops; Celeste looks up and
  points when a shooting star crosses (`island:star`); Reese and Cyrus lean toward each other and nuzzle.
- **Gulliver** sleeps face down on the front beach (snoring, zzz, a twitch). A tap is a nudge: a twitch and his sleep talk
  (「…ムニャムニャ…」, a small caption); the **fifth** wakes him: a start, a 「！」, he gets up and introduces himself
  (awake for the day).
- **A beat** (`pickAct`): the signature, an emote (never the same twice running), a look at the nearest villager, a
  stroll for those who roam, home when away, or at most every 45 s **the partner comes over** when the visitor is within
  600u of their home (beside them, they face each other, a nod and emotes, then home; one walker at a time). Nothing
  while their line is in the balloon.
- **Strolls:** Daisy Mae, Franklin, Zipper and Celeste amble to a walkable spot around theirs (level or in front, clear
  of every control and the villagers) and back 4–7 s later; the others stay put. The villagers route around them.
- **A tap:** my villager turns to them where it stands; the visitor walks back to its spot if it strolled, turns to
  my villager with a little hop and speaks, standing still until the balloon closes. A tap elsewhere now and then draws a glance.
- **Arriving and leaving:** when a visit starts or ends with the island open: walkers come from the campsite along
  the paths (and go back there), Wisp floats down, Celeste flies down, K.K. and Gulliver appear, Jack in a spooky puff;
  they leave the same way. On a page's first paint they're simply there.
- **Cost:** CSS keyframes and the director's timers; the one rAF only while it walks; paused with the scene.

### Halloween

`island/events.ts`, `island/Halloween.svelte`, `island/Visitor.svelte`, `e2e/halloween.spec.ts`. NH's Halloween on Oct
31 (Tokyo):

- **All day:** NH's pumpkins on the lawn (`HALLOWEEN_SPOTS`, each only where clear of every control).
- **17:00–24:00:** they become lit jack-o'-lanterns under a purple-to-orange wash, and **Jack** comes instead of anyone
  else. His ask, 「トリック オア トリート！」, ends on NH's answers: 「キャンディを あげる」 delights him (the candy pops up
  over his head); 「なにも あげない」 is his trick: my villager wears party nose glasses for a minute (not kept across a
  reload). Unanswered it closes after 15 s.
- **Villagers:** three Halloween day lines join their chats in the evening.

### Holiday hosts

`island/events.ts`, `island/visitors.ts` (`HOSTS`), `island/eggs.ts`, `e2e/holidays.spec.ts`. Each NH holiday is one date
rule in `events.ts` (`nthWeekday`, `easter`); its host takes the visitor slot from the hour its main part starts, with
an introduction, four lines and two villager day lines:

- **Franklin**, Turkey Day (the fourth Thursday of November, 09:00–24:00): his introduction asks for a fish; the next
  fish caught that day (`island:catch`) makes him happy and he thanks you by its name. Kept for the day on this phone
  (`scene-franklin`).
- **Jingle**, Toy Day (Dec 24, from 05:00), beside the Toy Day decorations.
- **Pavé**, Festivale (Shrove Monday, 48 days before Easter), all day.
- **Zipper**, Bunny Day (Easter Sunday; the seven days before are the celebration, and he comes on the first and the
  last). All week NH's eggs turn up as captions: a balloon drops a sky egg 1 in 3, a dig spot holds an earth egg 1 in
  4, a fish on the line is a water egg 1 in 6.

### Birthdays

`island/birthday.ts`, `island/Birthday.svelte`, `island/Cake.svelte`, `villagers/birthdays.ts`, `e2e/birthday.spec.ts`.
Ours come from `PEOPLE` in `config/rules.ts` (ウェイ `10-06`, うめ `03-04`; null turns one off; Feb 29 falls on Feb 28).
On one: both villagers wear NH's birthday hat; NH's cake stands in front of centre stage (else behind it), its candles
lit; confetti over both villagers the first time that day on this phone (`scene-birthday`); しずえ's 「うめさん、
おたんじょうび おめでとう！」. A tap on the cake plays a music box and blows the candles out for the day. Each goal the
birthday person meets that day pops NH's party popper over their villager. An NH villager's own birthday (Nookipedia's
dates, a small module of their own) puts the hat on that villager.

### Wedding countdown

`island/wedding.ts`, `island/Wedding.svelte`, `e2e/wedding.spec.ts`. Our wedding is 2027-10-08 (Tokyo). On the
milestone days (365, 200, 100, 50, 30, 7 and 1 days to go, and the day) Reese and Cyrus are the visitor from 06:00 to
midnight, side by side under a heart float; Reese's introduction ends on the count (「けっこんしき まで あと 100日！」, on
the day 「ごけっこん おめでとう！」), then they take turns. On the day the villagers bow and glow with hearts, confetti
bursts the first time that day (`scene-wedding`) and fireworks from 19:00. Every June Sunday NH's wedding arch stands
behind centre stage.

### Celeste and meteor showers

`island/meteor.ts`, `island/visitors.ts`, `e2e/celeste.spec.ts`. About one night in ten, at most one a week (a week has
one with a 0.7 chance, seeded by its Monday): Celeste is the visitor 20:00–04:00 and shooting stars cross every 3–8 s.
Her lines explain wishing, the fragments and the season's sign (`zodiac.<sign>`). Each wish is a fragment the next
morning, the zodiac fragment twice as likely.

### Shooting stars

`island/stars.ts`, `island/SceneTaps.svelte`, `e2e/sky.spec.ts`. On a clear night in NH's hours (19:00–04:00):

- **Showers:** every 3–8 minutes of on-screen night (the first after 30–90 s), 1–3 streaks; 1 in 6 a bigger shower of
  5–8. The countdown holds while covered or hidden. A meteor shower's night: one every 3–8 s.
- **The streak:** a quick white streak falling to the lower left, its whole path in the sky and clear of every control
  (a short sky beside the HUD gets a shorter one, or none).
- **A wish:** a tap in the sky while one crosses, once a star: sparkles, a chime (`scene-wish`) and 「ながれぼしに
  おねがい！」. Each is a fragment the next morning (`scene-wish`: `{ <morning>: n }`, older mornings dropped).

### Fireworks

`island/fireworks.ts`, `island/Fireworks.svelte`, `e2e/sky.spec.ts`.

- **When:** every Sunday in August 19:00–24:00; New Year's countdown, Dec 31 23:00, a volley at midnight and the show
  until 01:00; our wedding night from 19:00; and a volley of 3–5 the evening both of us meet all four goals (once a day
  per phone, from 18:00; `fireworks-day`).
- **The look:** a shell rises from behind the island and bursts (peony, ring, willow, heart, star, now and then a little
  pixel pattern), NH's colours, sparks drifting down (2.7 s).
- **Where:** the night sky and the open sea behind the island, each burst's whole circle clear of every control; a tap
  in the sky during a show sends one more there. Villagers cheer now and then.
- **Cost:** one transform/opacity keyframe per spark, ≤ 4 bursts at once, one timer between them.

### Group stretching

`island/stretching.ts`, `island/TapeDeck.svelte`, `motion/stretch.svelte.ts`, `e2e/radio.spec.ts`. NH's tape deck comes
out on a day either of us met 🍑 Exercise, or when the island is opened 06:00–08:00 (`scene-stretch`), on the lawn clear
of every control. A tap plays its tape (an original ~6 s march) and both villagers, and an awake visitor, do three of
NH's stretches together (`if-warmup`, `if-sidebend`, `if-leap`); event reactions wait (`holdEvents`). Then the deck
goes for the day.

### Dev params

Read once by `island/devHooks.ts`. The island's hooks work in dev builds or with `?demo`; `?date`, `?theme` and
`?season` work everywhere:

| Param | Effect |
|---|---|
| `?demo` (`=harvest`, `&as=B`, `&weeks=60`) | Made-up data, no backend; the harvest recap; play as B; a longer history |
| `?date=YYYY-MM-DDTHH:mm` | The scene clock (Tokyo), this page load only |
| `?theme=`, `?season=` | Preview a time of day or a season |
| `?seed=` | The island's seed (finds, weather, visitors) |
| `?weather=clear\|rain\|heavy\|snow\|fog\|aurora\|rainbow` | Force the weather |
| `?event=<id>` | Force an event day (and its evening) |
| `?visitor=<id>`, `?arrive`, `?leave=<ms>`, `?stroll`, `?meet` | A visitor; its arrival; its departure; a stroll; the partner's hello |
| `?critter=fish\|pond\|<fish>\|<pond fish>\|<bug>\|none`, `?sea=<id>\|pearl`, `?flea` | A critter now (kept until caught; ambient visits off); a dive spot; a flea on every villager tap |
| `?shake=nest\|branch\|bagworm\|spider` | The next shake drops that |
| `?rock=clonk\|sparkle\|bug` | Every rock tap has that outcome |
| `?find=bottle\|fragment\|mushroom\|rare-mushroom\|earth-egg` | A beach find now / every dig spot that |
| `?balloon`, `?fireworks`, `?shower`, `?stretch`, `?hybrid`, `?wander` | A balloon; a show; a meteor shower's night; the tape deck; a hybrid flower; the partner wanders |
| `?wilbur` | Wilbur on the dock (as when the partner's app is open) |
| `?hit` | Every tap target drawn over the island (magenta: the scene's elements; cyan: the boxes a module tests) |

The live island also sets `window.__world` (`cam()`, `go(z)`: the camera there at once, the stops' snapping off;
`at(x, z)`: a world point's client px; `put(x, z)`: my villager there; `idle()`; `perf`; `stops()`: the sections'
camZ; `mine()`, `following()`, `snapping()`) for the e2e and the console.

## Motion

- **Rig** (`Villager.svelte`, `Host.svelte`): `.actor` › `.face` (facing) › `.body` (one motion) › the art; emotes and
  fx sit beside `.face`, so they never squash or mirror. What sits on the head (the birthday hat, Jack's party glasses)
  goes where each render's head is, a sting's swollen eye on its eye: `villagers/heads.json`, measured from the art by
  `npm run heads` (`scripts/heads.ts`: the head from the alpha, the eyes as lit dark blobs, a level pair, with a
  hand-checked table where that misses), loaded only when one is worn. The director (`motion/director.svelte.ts`) holds one state per
  actor (mine, the partner's, しずえ, the visitor); `holdEvents(ms)` queues event reactions behind a routine.
- **Primitives:** `if-` keyframes in `tokens.css`; durations in `MOTION_MS` (`motion/reactions.ts`) must match.
- **Marks:** villagers get floating marks (`Mark.svelte`) or official glyphs; しずえ the cream bubble (`Emote.svelte`).
  Effects (`Fx.svelte`) remove themselves.
- **Reactions** (`REACTIONS`, R1–R19): first open, the partner's day growing, high-fives, a goal met, all four met,
  taps, waking, a low week (Thu–Sat), a sync problem, the harvest. Never on first render; pages `emit(…)`
  (`motion/bus.svelte.ts`).
- **Idle life** (`motion/idleLife.svelte.ts`): on ambient life's 10-second slots (`island/ambient.ts`, the relay's
  clock), so both phones play the same: each slot one villager does one small thing or sets off on an outing, or both
  chat or dance, and the visitor takes its beat from the slot's PRNG (しずえ now and then), no emotes or fx; one slot in
  three after 3 min idle, stopped after 10 min; paused while hidden or covered. Only a villager whose person isn't on
  the island (the relay's presence) goes on outings; one its person just walked is left alone 2 min.

### Walking

`island/walkGraph.ts`, `island/nav.ts`, `island/tapWalk.ts`, `island/wander.ts` (pure), `island/avatar.ts`,
`motion/director.svelte.ts` `walkTo`, `e2e/movement.spec.ts`, `e2e/world.spec.ts`, `e2e/tapwalk.spec.ts`.

- **My villager is me, and only empty ground walks it:** a tap on something to do (a tree, a bush, a flower, the rock,
  a weed, a dig spot, a shell or a find, a fallen fruit, branch, coconut, mushroom or present, a bug, a fish shadow,
  the bubbles, the water, the tape deck, a building, a visitor, the partner) acts in place: my villager turns to it
  where it stands and the action plays at the target, its tool there (NH's floating can, shovel and net; a cast's line
  from the bank). A catch or a find is held up over my villager's head where it stands. A flea is tapped off my
  villager itself.
- **Tap-to-walk** (a tap on grass or sand that nothing else took; `tapWalk.ts planTap` over `nav.ts`): my villager runs
  there (200 u/s), over the bridge and up the stairs. A tap on ground it can't stand on snaps to the nearest walkable
  point within 40u; ground nobody can reach to the nearest reachable point, facing it. Water never walks (it ripples), and a building's footprint knocks at its door in place.
  The partner's relayed walks replay the same planner (their softer ring where they tapped). A cream ring marks the
  spot and shrinks away (NH has none: the least feedback). It stays there for the rest of the Tokyo day
  (`island-stay` in localStorage, with the date; a new day finds it home), and so does it on the partner's phone: the
  relay keeps each person's last walk, so a phone opening later puts their villager where they sent it ([Shared
  world](#shared-world)).
- **The camera never moves for a walk** (nor for the partner or a visitor): only the finger scrolls.
- **Hold-up:** a catch or a find is lifted over my villager's head (`if-holdup`) while its plate reads.
- **Sheets and hiding:** a sheet stops everyone where they are; uncovered, the outings wander back; hidden over 30 s,
  they're back on return. A balloon opens only over a villager standing still, and steps aside while the camera
  scrolls.
- **Walk mask** (`walkGeo`): land, the bridge's deck (inside its rails) and the stairs; not the sea, the river, the pond, the spring,
  the cliff face, building footprints, trunks, the rock, bushes or props. Rasterised once on a 4u grid; named
  nodes (homes, the trees, the shore, both ends of the bridge and of the stairs, every door, the pondside, the river's
  casting spots, centre stage) and the obstacles' padded corners make a visibility graph built once (~15 ms); a
  straight segment when clear, else Dijkstra through it. Outings, goal walks and the meet-up use it.
- **Navigation for taps** (`nav.ts`): the same ground as convex polygons grown by an 8u pad (the river a chain of
  quads cut at the bridge's deck, the pond a 16-gon, the cliff two strips either side of the stairs, the footprints,
  trunks, bushes, props, the hedge, the fences, the bamboo, the rocks; off the land is the sea, and the land is convex, so two points on
  it see each other unless a polygon is between). Nodes: the polygons' corners a step outside plus the named nodes
  (the walk mask's names, so a relayed node id means the same); only bitangent edges up to 320u are kept. ~400 nodes,
  ~2,060 edges, 119 polygons; built in ~2.8 ms (median, M-series Mac; the walk mask's grid takes ~80 ms there), a
  tap's snap and A* p50 0.05 ms, p95 0.15 ms (`PERF=1 npx vitest run nav` checks the budget; CI only catches blow-ups). Each node knows its connected region, so a tap
  never aims at a pocket nobody can reach.
- **Footsteps** by the ground under the walker (`tapWalk.ts stepCue` over `world.ts surfaceAt`): grass, sand, snow
  (grass and dirt in winter), the stairs' and the stone bridge's stone; a rainy day splashes.
- **Rendering:** the feet are a world node whose position is read each frame from the director (`livePos`: along the
  current segment by the clock) while anyone walks, the one rAF; depth from the feet's z every frame. Facing by
  direction (`LOOKS_RIGHT`; `NO_MIRROR` renders lean instead of flipping). The walk cycle is `if-walkbounce`, a dust
  puff every other step.
- **The villagers' own outings:** the partner's villager walks to 1–3 points of interest within 600u of home (beside a
  tree, the rock, the shore, the pondside), then home; mine does the same only after 2 min without input. One villager
  away at a time; nothing after 10 min without input.
- **Follow and chat:** when mine has been away over 8 s (and within 600u) the partner comes over; two villagers within
  64u chat.
- **The partner over the relay** (`LIVE_V` 2): my tap-to-walk sends `walk` with the world point; their villager on my
  phone runs there along the same graph from where it stands (no positions are sent). Off screen, a round face of
  their villager is pinned at the top or bottom edge; a tap scrolls to them.
- **Goals:** a newly met fruit walks that person's villager to their tree, where the reaction plays; ふたりでぜんぶ
  brings both to the middle of the lawn for a high-five.
- **Footsteps:** a quiet step by the ground under the walker (`world.ts` `surfaceAt`: `footstep-grass`, `-sand`,
  `-snow`, `-splash`), ≤ 1 per 320 ms; world cues.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`): cream box, yuzu nameplate, 33 ms a glyph, tap to finish, `aria-live` mirror.
  **Choices** (`ui/ChoiceList.svelte`), **banner** (`ui/Toast.svelte`, one at a time).
- **Buttons:** every tappable has an edge (2px outline + 4px lip); static cards only a soft lip. Primary leaf,
  secondary cream, selected yuzu, disabled sunk. "Can't now" = `aria-disabled` ([Taps](#taps)).
- **Focus:** no ring after a pointer input (`ui/modality.ts`); focus is restored for keyboard and VoiceOver.
- **Type:** Zen Maru Gothic (UI, Japanese) and Fredoka (numbers); `word-break: keep-all` for Japanese.
- **Tokens** (`styles/tokens.css`): ink `#4A3A2C`, cream `#FFF9E3`, paper `#F5E4BC`, card `#FFFCF2`, edge `#937047`,
  leaf `#6ED07A`, yuzu `#FFD84D`, mint `#7BD7C1`, coral `#FF8F7A` (errors only), the chart pair `--person-a`
  `#2F86BD` / `--person-b` `#D2701F` (night `#7EC8F0` / `#FFB066`; CVD-checked); one `--z-*` stacking scale.
- **Theme:** `data-tod` comes only from the Tokyo clock (`prefers-color-scheme` ignored); night chrome `#3A4886`. The
  ribbon, plate, dialogue and choices stay cream/yellow.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard inset `--kb`
from `visualViewport` (`ui/keyboardInset.ts`). Short screens scale the island down. Check at 393×852, 375×667 and
320×568, day, dusk, night and winter.

## Official art

Official NH renders only from `static/art/` through `<OfficialArt>`, with a fallback so a missing file never breaks a
screen; WebP, never upscaled. Manifest and helpers `lib/art.ts` (the build packs the manifest's sizes per folder: `vite.config.ts` `slimArtManifest`); files from
`scripts/fetch-assets.ts`. Groups: villagers (all 417 + 23 special characters; roster `lib/villagers/roster.ts`, loaded
with the picker; `lib/villagers/look.ts`: ids, facing, defaults goldie and anchovy), host (しずえ, たぬきち), fruit,
trees, bushes, flowers, particles, reactions, money, deco, critters, finds, presents. Ours: sky, sea, ground, the jar,
effects, marks, UI sprites. Names follow the Japanese game; no Nintendo fonts.

**The 3D renders** (`scripts/models.ts`, `scripts/models-page.js`, `npm run models`): what NH has a model of is drawn
from it rather than from a Nookipedia icon: the campsite (its tent and deck; the door's foot on world.ts's door
line), the trees (the oak in its four looks: spring is NH's cherry-blossom model, summer and fall are the same model
tinted by its gradient's rows for the time of year, winter NH's snowy model; the cedar, palm and bamboo with their
snowy models), the hedge's eleven bushes in bloom (the colour a row of the flowers' gradient; winter NH's snowy bush),
the streetlamp and the garden lanterns (with `-lit`: the glass alone, lit, for dusk and night) and the garden and flat
rocks. Each is rendered by
three.js in the installed Chrome from the world's view (orthographic, 30° down), lit NH-style (a soft sky, a warm key
from the upper left with soft shadows, a cool fill), its materials rebuilt from the model's textures (albedo or gray
albedo × gradient, two-channel normals, the _Mix map's roughness and occlusion, per-material emissive weights), at
about 3 px per world unit of the height it's drawn at. Every look of one thing shares one crop, so they lay over one
another. Outputs keep the scene's art keys (`trees/oak-summer`, `bushes/holly`, `deco/campsite`…) plus their looks:
`-winter` (the scene picks it in winter when it exists), `-lit`, and the oak's `-trunk` / `-canopy` layers (its two
nodes, a villager between them). `island/models.json` holds where each stands (its feet or door point as fractions of
the image, `Scenery`'s anchor) and its size in model units. NH has no model of the plumeria or the campsite sign: those stay catalog icons. The stone
bridge is rendered twice: its deck from straight above (`bridges/stone-deck`, the terrain bake's texture, never shown
or precached by the app) and its near end seen level (`bridges/stone-front`, an upright piece). The decorations
([Decorating](#decorating), `decor/<item>-<f>`) are rendered in their four facings (a quarter turn each about the up
axis) at one scale (`ppu`, px per model unit) rather than one height, so every facing stands the same size.

## Sound

`lib/sound/`. Off by default, kept per phone. Nothing sounds without a visible reason (idle life is silent). The music
is the user's own files; every effect is an original placeholder (`synth.ts`), replaceable by a file.

### Hourly music

One track per **Tokyo hour** (`hourly.ts`) in sunny / rain / snow arrangements (`sound.weather`; a missing variant falls
back to sunny). A 3 s crossfade on the hour; the next file is fetched a minute early. Each file is a loop period plus a
3 s copy of its start; two `<audio>` decks hand over inside the copy, so the loop has no gap. Turning ミュージック on
plays the opening theme first. Under a sheet, the panel or the harvest the music is low-passed at 900 Hz.

### Event music

On NH's event days its track replaces the hour's (`events.ts eventMusicAt`, Tokyo date and hour), with the hour's
crossfade at the boundaries:

| When (Tokyo) | Track |
| --- | --- |
| Oct 31 17:00–24:00 | ハロウィン (Halloween) |
| 4th Thursday of Nov 09:00–24:00 | サンクスギビングデー (Turkey Day) |
| Jan 1 00:00 | ニューイヤー（Happy New Year）, once, within 2 minutes of midnight |
| Jan 1 00:00–02:00 | ニューイヤー（午前0時）, the fireworks |
| Jan 1 02:00–05:00 | ニューイヤー（午前2時） |
| Jan 1 05:00 – Jan 2 05:00 | 元日 (New Year's Day) |

**Cut-ins** (`sound.svelte.ts`) swap at once over the island's music and hand back to it: the wasps (`waspMusic`):
Chased by Bees loops from the nest's fall; a net brings the island's music back; a sting plays Stung by Bees once. K.K.'s
songs are cut-ins too. The settings' note and the Now Playing tile name the event track or song.

### K.K. Slider

`kk.ts kkTracks`: K.K.'s songs from the manifest's `kk` list (`{ id, ja, en, file, gain }`, NH's official titles),
one-shots under `audio/kk/`. `playKK(id)` plays one over the island's music, `stopKK()` ends it, `sound.kk` is the song
playing; `kkPick` never repeats the last one.

### Ambience

`ambientFor(hour, month, weather, { heavy })` on the music bus, crossfaded (0.5 s): waves always; birds 05–17 on fine
days (the season's: the bush warbler in spring, the bulbul in autumn); cicadas 08–17 Jul–Aug; higurashi 04–08 and 16–19
Jul–Aug; crickets 17–05 Sep–Nov; nothing alive in rain or snow; wind Dec–Feb; rain.

The beds are **procedural** (`ambientSynth.ts`, its own chunk): original loops rendered once into buffers when the main
thread is idle, deterministic, 12–40 s each, starting at a random point. Hidden: stopped, nothing renders. A file at
`ambient.<id>` in the manifest replaces a bed.

### UI sounds

Soft mallets and bells for the panel, cursor, confirm and cancel. Dialogue is silent.

### Cues

`cues.ts CUES` maps moments to sounds, levels and delays; nothing calls `play()` directly. Reactions name a cue per
step, taps in `data-sfx`, outcomes call `cue()` (tree tap → rustle, fruit lands → thud, each coin → a climbing
pentatonic run, 受け取る → fanfare, buy → purchase, first open of the day → chime, scenery → `scene-<kind>`). **World
cues** (the island's own sounds) are skipped while a sheet, the panel or the harvest covers the scene; UI cues always
play.

### Taps

Every tappable names its sound in `data-sfx`; one capture listener (`taps.ts`) plays it on the click. `self`: the
handler plays the outcome's cue; `none`: silent. A control with `aria-disabled="true"` has its click swallowed and
plays `boop`. Enforced by `taps.test.ts`, walked by `e2e/sound.spec.ts`.

### Mix

Buses: music 0.30, ambience 0.28, effects 0.90; master 音量 squared (default 0.8). ≤ 6 voices and a cap per sound
(`ids.ts`); jingles (fanfare, miles, chime) never overlap and duck the music to 25%. Effects jitter pitch.

### Engine lifecycle

`sound.svelte.ts` drives `engine.ts`; the rules are pure in `session.ts`; `engine.test.ts` uses a fake context.

- **Unlock:** no context until a setting is on. `pointerup`, `touchend`, `click` or `keydown` creates and resumes it
  and unlocks both decks; `pointerdown` only wakes it. With ミュージック on, the hour's file is fetched 1 s after launch,
  so the first tap starts it inside the gesture.
- **Nothing queues:** a cue on a context that isn't running is dropped; a tap's own sound may run within 250 ms of its
  resume.
- **Idle suspend:** with only effects on the context sleeps 10 s after the last sound.
- **Background:** hidden → decks paused, ambience stopped, context suspended, the hour clock stopped; back in front the
  hour fades in over 0.8 s.
- **iOS session:** always `ambient`: it mixes with other apps' audio and follows the Ring/Silent switch. The Media
  Session tile names the tune.

### Audio files

`static/audio/manifest.json` (bundled by `manifest.ts`): `sfx.<id>`, `music.<weather>.<00–23>` = `{file, start, end?,
gain?}`, `opening`, `ambient.<id>`, `events.<id>` (the same shape) and `kk[]`. Add a file and its entry, no code change;
a missing effect keeps its placeholder, missing ambience its procedural bed, missing music is silence. `sound.test.ts`:
files exist and are named, ≤ 1 MB a looped track, ≤ 20 MB for `music/`, ≤ 1.2 MB a K.K. song, ≤ 12 MB for `kk/`. `npm
run audio:music -- <dir>` (`scripts/music.ts`, ffmpeg) builds the hours from the user's MP3s (finds the loop, appends the
copy, AAC 64 kbps, `gain` to −16 LUFS); `-- --extras <dir>` does the event loops and one-shots. Audio is never
precached ([backend.md](backend.md#service-worker)).

### Sound settings

The panel's サウンド: **ミュージック** (music, ambience), **効果音** (effects, jingles), **音量** 0–10; both off at first;
turning one on previews it. In localStorage (`island.sound`), never synced.
