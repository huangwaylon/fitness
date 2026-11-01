# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md). Numbers come from `app/src/lib/config/rules.ts`, which wins if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch. Their activity, measured automatically, grows fruit and earns **ベル** (play money, a stamp card: +1 per
daily goal) into one shared wallet, spent on two treats: おやつ and 外食. Japanese first, English per person.

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  weight) several times a day. **Apple Health is the source of truth:** no health number is entered or fixed in the
  app ([Health data](#health-data)).
- **Data out:** the PWA (SvelteKit, static on GitHub Pages) fetches the raw rows and computes every number on the
  phone (`lib/model/`, pure functions).
- **Principles:** zero required taps a day; both people see all data; no notifications; everything always animates
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
しずえ's box only with news. The island is centred in the visible ocean, from the horizon to the screen's bottom, and
never runs under the ribbon.

- **Trees:** one per person, today's four fruits in the canopy ([Trees](#trees)). A tap opens a popup: per goal (🍎
  steps first, then Move, Exercise, Stand) today's amount against the goal (「14,164 / 8,000歩」), ✓ once met and a yuzu
  「がんばり」 chip at 1.5× ([Goals](#goals)); no ベル on the rows. Then the ledger: 「もくひょう +3」, 「がんばり +1」
  (「がんばり（上限 2） +2」 when three or four were reached) and this person's total 「うめの きょう +6 ベル」; then
  ふたりでぜんぶ (「ふたりで ぜんぶ まで：あと 2つ」 or 「ふたりで ぜんぶ！ +2 ふたりに」), outside either total, so both
  totals plus it make the ribbon. The last line says when that person's data last arrived (「15:24 に とどいた」), with
  a dot once it is over 6 hours old.
- **Jar** (`island/HudJar.svelte`): a cream pill as tall as the ribbon, the jar rising out of its left end, the shared
  balance and a leaf ▶. Each newly met goal flies in as a +1 coin from its fruit (+2 with its がんばり; `CoinFlow`),
  ふたりでぜんぶ as a +2 under the jar; all of it waits while something covers the scene. Tap → ごほうび (the page zooms
  about the jar, which morphs into the hero jar).
- **Centre stage:** the island's open middle (`scene.ts` `CENTRE_STAGE`), kept free for a visitor.
- **Villagers:** mine hops when tapped and says a line ([Villager chats](#villager-chats)); the partner's opens their
  card.
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
height, three tabs pinned under the title (NH yellow for the one shown): けんこう · きろく · せってい. It opens on
けんこう and remembers the last tab for the session. Its own chunk, loaded on the first tap.

- **けんこう:** the Health data over time ([Kenkou](#kenkou)); its own chunk.
- **きろく:** the ベル ledger, 目標 and the ずかん ([Kiroku](#kiroku)).
- **せってい:** **むらびと** (my villager and よびな; かえる → the picker: 23 special characters and all 417 NH
  villagers, its head pinned over the scrolling grid), **サウンド** ([Sound settings](#sound-settings)), **ことば**
  (日本語 / English), **つうしん** (when each of us last synced; いま つうしん) and **あそびかた** (くわしく → the guide:
  the goals, ふたりでぜんぶ, the treats, the Sunday recap, a protein hint of 1.6 g per kg a day).

A day, a goal, the picker and the guide push a level with ‹ (the tabs hide while a level is open); ✕, the backdrop and
Esc close the panel.

### Kiroku

きろく (`model/history.ts`, `components/kiroku/*`), read-only:

- **ベル:** everything earned, then by week (earnings only) one line per day under the two avatars: each person's four
  fruits (bright = met), a star on a ふたりでぜんぶ day, the day's ベル (tap → the day); on a がんばり day a smaller second
  line with each person's がんばり ベル.
- **目標:** the Move and weight goals; two avatar pills pick whose (either person sets either person's).
- **ずかん** ([Zukan](#zukan)): one row per kind with how many either of us has found.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  「がんばり」 chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

けんこう (`model/health.ts`, `components/health/*`, `e2e/health.spec.ts`): the Health data over time for the personal
trainer, one person at a time, computed on read.

- **Whose data:** two avatar pills (this phone's person first and chosen on opening; kept for the session).
- **Controls:** 1週 · 1か月 · 3か月 · 1年 · すべて (default 1か月, kept for the session), then a sticky row: ‹ the
  visible range (「10/2–10/31」; 「1日ごと」 / 「1週ごとの 1日平均」 / 「1か月ごとの 1日平均」 under it) › and きょう.
- **A card per metric** (🍎 歩数, 🍐 ムーブ, 🍑 エクササイズ, 🍒 スタンド): the goal; 1日の平均 with 前の期間より ↑/↓ %;
  目標 n/N日（%）, ベスト and 記録なし n日; the chart; a one-line key.
- **Chart** (`BarChart`, SVG): a bar per day (1週, 1か月), per week (3か月: 13) or per calendar month (1年, すべて), each
  the bucket's daily average, in the person's colour (ウェイ blue `--person-a`, うめ orange `--person-b`); solid when
  the goal was met, pale when not; today outlined; a finished bucket with no row gets a short hatched stub (記録なし).
  The goal dashed (stepped when the Move goal changed). On 1週 each bar carries its value. A tap shows one value; a
  horizontal drag turns the page (right = older); vertical drags scroll the panel.
- **体重** (`WeightCard`, `WeightChart`): 平均 (n回の記録), 期間の変化 ([Weight](#weight)), the chart on an axis fitted
  to the weights (dots joined by a thin line; the goal dashed, or a 「目標 66.0 ↓」 label when far off) and the goal
  month at that pace (only when the period ends today).
- **Rules:** a day's value is Health's latest, as reported: every day with a row counts, whatever its value; 記録なし is
  a day with no row (counted from the first activity record); today is drawn but not counted; the previous period is
  the same length just before. The footnote says so.
- **Cost:** the tab's code and strings (`i18n/kenkou.*.json`) load with the tab; the daily series is memoised per
  model and day. `?demo&weeks=60` makes a longer history with some missing Watch days.

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar,
  one CTA in a sticky footer above the keyboard.
- **Partner card:** face, one line about their day, ハイタッチ.
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
| 🍎 Steps | `steps` (max of `steps`, `steps_watch`) | 8,000 |

The Move goal on a day is the last one set on or before that Tokyo date.

**がんばり (stretch):** +1 more for each goal reached at 1.5× (`STRETCH.multiplier`): 🍐 1.5 × that day's Move goal,
🍑 90 min, 🍒 180 min, 🍎 12,000 steps; at most **+2 a person a day** (`STRETCH.cap`, paid to the first in
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

Steps, exercise, Move, Stand and weight come only from the Shortcut's `metrics` rows; a day's value is its latest row,
so each sync replaces it with Health's current total (a locked week's earnings stay as of its lock). Nothing in the
app enters or fixes them.

What the app sends ([backend.md](backend.md#events)): the two goals (`pref` `moveGoal`, `goalWeight`, either person's
via `data.person`), buys and voids, harvest taps, high-fives, the sender's `locale`, `villagerName` and `villager`, and
the ずかん's finds (`find`, the first of each). A buy and its とりけす wait 5 s before they are sent (touching the banner
holds it, ≤ 2 min).

## Weight

`model/weight.ts`, for けんこう's 期間の変化 and goal month; never earns (`deps.test.ts`). Plain arithmetic, no
smoothing: over the visible period, the first week's average weigh-in → the last week's when the weigh-ins span 14
days or more, else the first weigh-in → the last; under two, none (–). Per week: that change over the days between the
two weeks' middles, shown from 7 days apart. Goal month: from the last week's average at that pace, only when it heads
to the goal at ≥ 0.05 kg a week within 156 weeks (else 「あせらず、ゆっくり いこうね」; at the goal 「目標に届いています」).

## Island scene

`lib/components/island/*`: a Pocket Camp–style diorama in SVG/CSS around official renders. What comes only on its days
(a visitor, the tape deck, the cake, the weather, the fireworks, Halloween's, a birthday's and the wedding's decorations)
is loaded the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load carries none of it. Light from the upper left;
each surface one fill, one gradient, one soft shade; no strokes on scenery. Only `transform` and `opacity` animate;
everything pauses while hidden (`data-paused`), and a sheet pauses particles, critters and idle life
(`data-covered`). Nothing on the island pays ベル.

### Layout and scale

An elastic sky over a **stage of 390 × 360 units (u)** (`--su` = one unit). The island (14u–356u, the horizon at 0u)
is centred between the horizon and the screen's bottom (`--island-bottom`); the sky is at most 27% of the screen. Back
to front: sky · sea · ground · pond · hedge · museum · trees + fruit · flower beds · villagers · particles · one tint.

`scene.ts`: **1 tile = 44u**, **1 row = 31u**; `col(k) = 195 + 44k`, k = −3…3; rows: hedge 62 · trees + centre stage
173 · bed back 266 · front 297. Villager 80u (cols ±1, front row) · hardwood 120u (cols ±2) · bush 48u · flower 32u ·
hanging fruit 20u · ground fruit 24u. The back row reads bush · pond · museum · bush · bush.

### Environment

- **Seasons** (`ui-state/season.ts`): winter (snow) Dec 11 – Feb 24, spring to May 31, summer to Sep 15, autumn to Dec
  10. Oaks: blossom Apr 1–10, fall leaves Oct 16 – Dec 10.
- **Time of day**, Tokyo clock only: dawn 05–07, day 07–16, dusk 16–19, night 19–05; it sets the sky and one tint.
  Night is soft periwinkle, never black.
- **Hedge:** one species a month (Apr–May azalea, Jun hydrangea, Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly,
  Jan–Mar camellia). Two flower beds by season.

### Particles and events

≤ 3 particles (petals, maple leaves, snowflakes on a snow day, summer fireflies but not in the rain). Snow lies on the
museum's roof while it lies on the ground; petals float on the pond in cherry-blossom week and maple leaves in maple
week. Events (`eventsAt`): cherry blossom Apr 1–10, maple week Nov 16–25, Toy Day Dec 24, the balloon present.

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

`island/FruitTree.svelte`, `island/FlowerBeds.svelte`, `island/fruitDay.ts`, `e2e/trees.spec.ts`. A tree's fruit and its
person's flowers through one Tokyo day (a quick run of canopy taps shakes it: [Shaking a tree](#shaking-a-tree)):

- **Hanging:** each goal's fruit, 🍐 🍑 🍒 🍎 left to right, grey at 0 and filling with colour toward the goal
  (grayscale = 1 − share, washed lighter while grey).
- **Falling:** met, the tree shakes and the fruit drops to the ground in front of the trunk with a thud and a puff;
  once per phone, the first time the island shows it met; a reload finds it lying there.
- **Picking up:** a tap on a fallen fruit picks it up (a hop, a sparkle, a pop), gone on this phone until the next
  Tokyo day. Either person may pick up either tree's fruit; cosmetic, never synced. The fruit row is one button: a tap
  within 22u of a fallen fruit picks up the nearest, else it opens the popup.
- **Goal flowers:** each 2 × 2 bed belongs to the person standing beside it, one flower per goal (`BED_FRUIT`: 🍐
  back-left, 🍑 back-right, 🍒 front-left, 🍎 front-right) in the season's species. Not met: a swaying bud. Met: it
  blooms once per phone (a squash, a pop, petal bits, a glint, `flower-bloom`); a reload finds it open.
- **All four met:** four warm glints twinkle on the canopy over a soft gold pulse (NH's money tree).
- `fruit-day` in localStorage (`{ date, dropped, picked, bloomed }`, ids `A:pear`): losing it only drops a fruit and
  blooms a flower again.

### Shaking a tree

`island/treeShake.ts`, `island/TreeShakes.svelte`, `e2e/shake.spec.ts`.

- **Tap or shake:** one canopy tap opens or closes the popup; the third tap within 1.2 s (and each quick tap after) is
  a shake: the popup closes, the tree rustles and drops leaves (`tree-shake`).
- **What falls:** 1 in 8 a wasp nest (at most one per tree an hour, `tree-nest`), else 1 in 7 a dangling bug, else 1
  in 5 a branch (it lies beside the trunk until a tap picks it up; cosmetic).
- **The nest:** three wasps buzz out and charge the villager on that side for 1.5 s; a tap in time nets one (NH's catch
  line, a ずかん find). Too late, they sting: a 「！」, a sweat drop, and they fly off. The wasp is weight 0 in the bug
  table: it only ever comes from a nest. The chase and sting have their own music ([Event music](#event-music)).
- **A dangling bug:** a bagworm, or in the spider's hours (19:00–08:00) a spider 3 times in 8, drops on its thread and
  sways for 10 s; a tap nets it, left alone it climbs back up.

### Scene interactions

`island/SceneTaps.svelte`, `island/sceneTaps.ts`, `e2e/scenery.spec.ts`. Every part of the island answers a tap softly
and counts for nothing (no ベル, state, navigation or writes); one `pointerdown` listener; ≤ 4 flourishes at once;
taps on controls are ignored; nothing while covered or hidden; decorative, `aria-hidden`, pointer-only.

A bush jiggles and sheds seasonal leaves (1 in 10 a bug flies out); a flower is watered ([Island care](#island-care));
the sea ripples (1 in 10 a fish shadow); sand leaves footprints; grass puffs dust (snow in winter); a cloud squishes;
the sun glints; the moon bobs; the night sky twinkles (and grants a wish while a shooting star crosses: [Shooting
stars](#shooting-stars)); the pond rings.

### Balloon

NH's balloon present: by day every 45–90 s of on-screen time (the first after 20–40 s), in a lane under the ribbon (a
smaller one or none on a short sky). A tap pops it; the present falls onto the lawn behind the trees, on the nearest
spot clear of what lies there and of every control, bounces and stays until tapped (not kept across a reload). My
villager walks over, the wrapping pops (confetti, sparkles, the catch fanfare) and the item is held up while the
plate reads 「ロッキングチェアを てにいれた！」 (`island/presents.ts`): one of 35 NH furniture and clothing items (some
likelier in their season) or, in their NH windows, a seasonal DIY recipe (half the presents then), shown on NH's
recipe card. Never Bells, nothing kept. On Bunny Day a sky egg instead. Off the island it drops into the sea.

### Critters

`island/Critters.svelte`, `island/critters.ts`, `e2e/critters.spec.ts`. NH species on the Tokyo clock, for fun and
frequent: a visit every 8–15 s of on-screen time (the first after 3–6 s; the countdown holds while covered or hidden,
and the critters leave): a fish shadow whenever the sea is empty, then the pond ([Pond](#pond)), else usually a bug; ≤
1 in each water and 1 bug. **Seasons are a flavour, not a gate:** any species in any month, 3× likelier in its NH
northern-hemisphere months; hours still hold.

- **Fishing** (the sea's box or the pond's oval: `critters.ts` `Water`): a shadow (NH sizes 1–6) dawdles off the front
  beach. A tap near it casts a bobber from the rod in my villager's hand; the fish closes in over 2–3 darts, nibbles
  0–3 times, then bites: the bobber is yanked under, a small 「！」 pops over it, and a tap anywhere in the next 1.6 s
  catches it. The first early tap makes it hesitate; a second scares it off. 1 in 14 a boot, tire or can.
- **Fish** (all 34 of NH's sea and pier fish, `FISH`): NH's shadows by size (14–46u, the eels long and thin; a fin for
  the sharks, the ocean sunfish and the suckerfish); the coelacanth only in rain or snow.
- **Bugs** (70 of NH's 80, `BUGS`), each where NH keeps it: butterflies and moths in flight and landing on the flowers;
  the ladybug and mantises on a flower's head; dragonflies over the lawn; cicadas, beetles and the walking stick on
  the trunks (NH's stump bugs too: the island has no stumps); fireflies at night; grasshoppers, crickets, the pill bug
  and the centipede in the grass; the hermit crab and the wharf roach on the beach; the mole cricket under a chirping
  mound (a tap digs it up); the tarantula and the scorpion at night, gentle: the first tap makes one rear up, a second
  while reared makes it charge off, and once it settles a tap nets it; a flea hops off my villager 1 in 10 taps
  (Apr–Nov); the pondskater, diving beetle and giant water bug on the pond. A tap nets one; within 80px it startles
  away. Bugs keep clear of every control. Left out: the palm-tree bugs, the dung beetle, the ant and the fly
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
- **Cost:** critters move by CSS transitions between waypoints a timer picks (no rAF), one wing or fin loop each; one
  timer between visits; art on first need. World cues `scene-<kind>`, quiet and jittered ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`, `island/sceneDay.ts`, `e2e/finds.spec.ts`. The day's items derive from the
Tokyo date and time plus a seed, so both phones broadly agree; what a phone picks up is hidden there only (`scene-day`),
and the first of each shell, fossil and fragment is a ずかん `find`.

- **Seashells** (NH's eight; the summer shell rare, likelier June–September): one washes up every 60–120 s, the newest
  three lie on the sand. A tap picks it up: 「タカラガイを ひろった！」.
- **Where things lie** (`beachSpot`): shells, fragments and the bottle keep 34u apart (`BEACH_GAP`), each taking a
  spot that far from everything there in a seeded order; worked out once per date and seed, so nothing moves.
- **Fossils** (all 73 of NH's: the standalone ones and every dinosaur piece, `FOSSIL_SETS`): NH's star-shaped dig
  spot, 1–2 at a time on six spots clear of every control. A tap digs it up (the shovel, a burst of earth, an open
  hole that fades): 「化石を ほりだした！ アンモナイトだ！」. The next turns up 20–40 s later.
- **Mushrooms** (`island/mushrooms.ts`): every November day 1–2 beside the trunks (1 in 8 October and December days
  one), NH's weights; a tap picks one up. 1 in 20 November dig spots hold the rare mushroom. Cosmetic: no `find`.
- **Message bottle:** every 8–14 minutes one rocks at the water's edge for 6; a tap reads its note (16 kind notes).
- **Star fragments:** each wish on a shooting star is one fragment on the beach the next morning (from 05:00, at most
  8), now and then a large one or the season's zodiac fragment (twice as likely after a meteor shower), twinkling now
  and then.

### Island care

`island/Care.svelte`, `island/care.ts`, `e2e/care.spec.ts` (no ベル, no find):

- **Weeds** sprout every 30–60 minutes on the lawn's free spots (`LAWN`), the newest three at a time; a tap pulls one
  (`scene-weed`).
- **Watering:** a flower tap is NH's watering can (a tilt, drops, a glint; `scene-water`); a flower watered today
  glitters for the day (`wateredOn`). A bed watered today has a 1 in 4 chance of a hybrid colour in one watered cell
  tomorrow (NH's hybrids, simplified; `scene-garden`).
- **The rock** (in front of the hedge, left of centre stage): a tap clonks it with the shovel; 1 in 4 a sparkle, 1 in 8
  a pill bug or a centipede crawls out.
- Weeds, dig spots and the rock are measured clear of the controls on each screen (a covered spot isn't shown).

### Pond

`island/Pond.svelte`, `island/pondFish.ts`, `e2e/pond.spec.ts`. NH's pond, small, on the back row at the left
(`scene.ts` `POND`, an oval of water 52 × 18u, lily pads, reeds, one slow ripple).

- **Its fish:** all 46 of NH's freshwater fish (river, river mouth, clifftop and pond: the island has no river),
  `POND_FISH`, its own chunk fetched with the pond's first shadow. Season weights the odds, hours hold, rare = low
  weight.
- **Visits:** as often as the sea's (its own slot), one shadow at a time, 45 s if nobody fishes, drawn at 0.65 of the
  sea's size. Fishing is the sea's; my villager walks round to the back bank (walkGraph's `pondside`) and fishes from
  there.
- **Its bugs:** the pondskater and diving beetle by day in summer, the giant water bug at night.
- **The catch:** a ずかん `find` of kind `fish`, like the sea's.

### Museum

`island/Museum.svelte`, `island/blathers.ts`, `e2e/museum.spec.ts`. NH's museum (the upgraded building, 100u wide) on
the back row in the middle (`scene.ts` `MUSEUM`), the door to the ずかん: a button (「はくぶつかん：ずかんを ひらく」, a
soft knock). A tap and Blathers says one line: drowsy by day (05:00–19:00), lively at night, and 3 times in 5 about the
latest find of the last week. When his box closes the panel opens on きろく scrolled to the ずかん; a second tap while
he talks opens it at once.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/ZukanCard.svelte`, `kiroku/zukan.ts`, `model/finds.ts`, `e2e/zukan.spec.ts`. The ずかん in
きろく, shared (the first `find` of either of us): さかな 80 (the sea's 34 and the pond's 46), むし 70, うみのさち 40,
かせき 73 (laid out like NH's museum: the standalone ones, then each dinosaur with 「Tレックス 1 / 3」), かいがら 9 (the
pearl last). A kind's page: every entry in the game's order, the official icon and name for found ones, a silhouette and
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
captions (`place`: the catch plate, the wish, K.K.'s caption) keep clear of every control, nearest first.

### Villager chats

`island/chat.ts`, `island/Talk.svelte`, `e2e/chat.spec.ts`. A tap on my villager keeps its hop and says a line in NH's
balloon above its head. Lines follow the villager's NH personality (12 each; special characters 10 of their own), 3 in
10 about the day (the morning, the night, today's goals so far, never ベル), a sleepy one when the tap wakes them; never
the same twice running. The roster loads on the first chat. One balloon at a time.

### Visitors

`island/Visitor.svelte`, `island/visitors.ts`, `e2e/visitors.spec.ts`. NH's visitors (official renders), one at a time,
seeded by the date: **K.K. Slider** on Saturday nights 18:00–24:00, **Daisy Mae** on Sunday mornings 05:00–12:00,
**Wisp** on 1 in 4 nights 20:00–04:00, **Gulliver** on 1 in 4 days 06:00–18:00; **Jack** on Halloween night,
**Celeste** on a meteor shower's night, the holiday hosts on their days, the wedding couple on its days. Priority
(`visitorAt`): the event's host (Jack included), the wedding couple, Celeste, then K.K. and the rest. They stand on
centre stage at the villagers' scale times their NH height, with a contact shadow (a smaller figure on the front beach
while a control covers the centre). A tap: their introduction the first time, then one of their lines. No trading, no
ベル.

**K.K.'s show:** with ミュージック on, a tap is his greeting with NH's choice box, **リクエスト** (up to four songs) or
**おまかせ**. The island's music stops for the song ([K.K. Slider](#kk-slider)), he strums harder, ♪ float up, the
villagers sway and a 「♪ けけボッサ」 caption sits by him. A tap mid-song offers ストップ / つづけて. At its end his
sign-off and the island's music returns. With no song files he says he's tuning his guitar; with the music off he only
talks.

### Visitors: life

`island/visitorLife.ts` (pure), `island/Visitor.svelte`, `island/avatar.ts` (`meetVisitor`, `visitorRoute`),
`e2e/visitor-life.spec.ts`. The visitor is the stage director's fourth actor (`'visitor'`): its walks, motions,
emotes, fx and facing use the villagers' calls, and idle life gives it a beat on every tick (awake or asleep).

- **Always (CSS):** a breath (2.4–3.2 s, each its own) and now and then a weight shift, on separate transform
  properties so loops add up; the contact shadow breathes with it.
- **Signatures (NH):** K.K. strums with a head-bob (harder mid-song); Wisp floats, drifts and flickers; Jack sways and
  twirls with a spooky glint; Daisy Mae shifts her turnips and hums; Franklin waddles, flaps and looks about; Jingle
  bounces with a sparkle; Pavé dances Festivale's steps and a samba with confetti; Zipper hops; Celeste looks up and
  points when a shooting star crosses (`island:star`); Reese and Cyrus lean toward each other and nuzzle.
- **Gulliver** sleeps face down on the lawn (snoring, zzz, a twitch). A tap is a nudge: a twitch and his sleep talk
  (「…ムニャムニャ…」, a small caption); the **fifth** wakes him: a start, a 「！」, he gets up and introduces himself
  (awake for the day).
- **A beat** (`pickAct`): the signature, an emote (never the same twice running), a look at the nearest villager, a
  stroll for those who roam, home when away, or at most every 45 s **the partner comes over** (beside them, they face
  each other, a nod and emotes, then home; one walker at a time). Nothing while their line is in the balloon.
- **Strolls:** Daisy Mae, Franklin, Zipper and Celeste amble to a walkable spot around theirs (level or in front, clear
  of every control and the villagers) and back 4–7 s later; the others stay put. The villagers route around them.
- **A tap:** the visitor walks back to its spot if it strolled, turns to my villager with a little hop and speaks once
  my villager is beside them, standing still until the balloon closes. A tap elsewhere now and then draws a glance.
- **Arriving and leaving:** when a visit starts or ends with the island open: walkers up from the water's edge along
  the walk graph, Wisp floats down, Celeste flies down, K.K. and Gulliver appear, Jack in a spooky puff; they leave the
  same way. On a page's first paint they're simply there.
- **Cost:** no rAF; CSS keyframes and the director's timers; `will-change` only while walking; paused with the scene.

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
dates, a small module of their own) puts the hat on that villager and they say so in their chats.

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
| `?find=bottle\|fragment\|mushroom\|rare-mushroom\|earth-egg` | A beach find now / every dig spot that |
| `?balloon`, `?fireworks`, `?shower`, `?stretch`, `?hybrid`, `?wander` | A balloon; a show; a meteor shower's night; the tape deck; a hybrid flower; the partner wanders |

## Motion

- **Rig** (`Villager.svelte`, `Host.svelte`): `.actor` › `.face` (facing) › `.body` (one motion) › the art; emotes and
  fx sit beside `.face`, so they never squash or mirror. The director (`motion/director.svelte.ts`) holds one state per
  actor (mine, the partner's, しずえ, the visitor); `holdEvents(ms)` queues event reactions behind a routine.
- **Primitives:** `if-` keyframes in `tokens.css`; durations in `MOTION_MS` (`motion/reactions.ts`) must match.
- **Marks:** villagers get floating marks (`Mark.svelte`) or official glyphs; しずえ the cream bubble (`Emote.svelte`).
  Effects (`Fx.svelte`) remove themselves.
- **Reactions** (`REACTIONS`, R1–R19): first open, the partner's day growing, high-fives, a goal met, all four met,
  taps, waking, a low week (Thu–Sat), a sync problem, the harvest. Never on first render; pages `emit(…)`
  (`motion/bus.svelte.ts`).
- **Idle life** (`motion/idleLife.svelte.ts`): every 9–15 s one actor does one small thing (しずえ ≤ every 20–30 s), no
  emotes or fx; slower after 3 min idle, stopped after 10 min; paused while hidden or covered. The partner's outings
  ride on its ticks.

### Walking

`island/walkGraph.ts`, `island/wander.ts` (pure), `island/avatar.ts`, `motion/director.svelte.ts` `walkTo`,
`e2e/movement.spec.ts`.

- **My villager is me:** a tap on something to do walks my villager there first, then the action plays where it
  stands (the bush shaken, the can, the shovel, the rod, the net; a visitor speaks once it's there). A flea is tapped
  off my villager itself: no walk.
- **Snappy:** 240 u/s, a walk clamped to 150–900 ms; one over 1.2 s (or with nowhere clear to stand) isn't made: the
  villager turns to it. The outcome is decided at the tap; the reel, a dive's chase, a tarantula and the wasps never
  wait for a walk.
- **Where it stands:** around the target at 26u, else 40u (a can or a net also across a bed), the nearest by walking;
  a spot counts only if the standing figure covers no control, visitor or canopy and stays on screen.
- **After:** it stays 4–6 s, then wanders home at 90 u/s. A sheet stops everyone; uncovered, they wander home; hidden
  over 30 s, they're home on return. A balloon opens only over a villager standing still.
- **Hold-up:** a catch or a find is lifted over my villager's head (`if-holdup`) while its plate reads.
- **Walk mask:** the lawn, the front beach, the cliff's low front as the way down, and the pond's back bank; obstacles
  are the trunks, the beds, the rock and the pond. ~25 named nodes; a straight segment when clear, else the shortest
  route through the nodes (a visibility graph).
- **Rendering:** the feet at `translate(x, y)` u, one CSS transition per segment; no rAF; `will-change` only while
  walking. Facing by direction (`LOOKS_RIGHT`; `NO_MIRROR` renders lean instead of flipping). Depth from the feet's y
  (`depthZ`). The walk cycle is `if-walkbounce`, a dust puff every other step.
- **The villagers' own outings:** the partner's villager walks to 1–3 points of interest (beside a tree, the rock, the
  shore, centre stage, the pondside), then home; mine does the same only after 2 min without input. One villager away
  at a time; nothing after 10 min without input.
- **Follow and chat:** when mine has been away over 8 s the partner comes over; two villagers within 64u chat.
- **Goals:** a newly met fruit walks that person's villager to their tree, where the reaction plays; ふたりでぜんぶ
  brings both to the middle for a high-five.
- **Footsteps:** a quiet step by the ground under the walker (`footstep-grass`, `-sand`, `-snow`, `-splash`), ≤ 1 per
  320 ms; world cues.

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
