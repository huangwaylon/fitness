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
- **Principles:** zero required taps a day; both people see all data; no notifications (the app is opened by choice;
  [decisions](decisions.md#no-notifications-2026-11-02)); everything always animates
  (no reduced-motion variants).

Modules: `contract/` (shared with the script) · `config/rules.ts` · `scoring/` · `model/` · `sync/` · `store/` ·
`ui-state/` · `sound/` · `components/`, `routes/`. `deps.test.ts` enforces the import direction.

## Simplicity rules

- No tab bar: 島 (the island), the health popup (tap the dumbbell: けんこう), the meal log (tap the bowl: ごはん), and
  behind the HUD menu's leaf the one panel for the ベル (its 「ベル 121」 row: ごほうび, no tabs), the ずかん and せってい,
  each its own sheet.
- One focal point per screen (島: the island itself, the sky clean, the leaf the door to the rest; ごほうび: the
  balance, today's ベル under it).
- A number is shown in full in one place; elsewhere it is only a doorway to it.
- Per screen at most 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card; one しずえ line (≤ 16
  characters), only with news.

## Screens

### Island

Top to bottom: the HUD row, one cluster in the sky's top-right corner (the health button, the meal button and the
menu's leaf, whose 「ベル」 row opens [the panel](#panel), ごほうび, where today's ベル are); a sync chip only when sync isn't ok; the scene;
しずえ's box only with news; the say button at the bottom right. The island is in 3D under them ([World](#world)): one finger
scrolls it from まえ (home, the health lawn) back to おく, two pinch the zoom, a tap on empty ground walks my villager there.

- **Trees:** one per person, today's four fruits in the canopy ([Trees](#trees)). A tap opens a popup: per goal (🍎
  steps first, then Move, Exercise, Stand) today's amount against the goal (「14,164 / 8,000歩」), ✓ once met and a yuzu
  「がんばり」 chip at 1.5× ([Goals](#goals)); no ベル on the rows. Until then each holds its place faintly: a dashed
  ring where the ✓ comes and a dashed ghost of the chip (gone once the day's がんばり cap is paid), so an early morning's
  popup shows what will fill in. Then the ledger, always all three lines, a zero faint: 「もくひょう +3」, 「がんばり +1」
  (「がんばり（上限 2） +2」 when three or four were reached) and this person's total 「うめの きょう +6 ベル」; then
  ふたりでぜんぶ (「ふたりで ぜんぶ まで：あと 2つ」 or 「ふたりで ぜんぶ！ +2 ふたりに」), outside either total, so both
  totals plus it make today's total (ごほうび's 「きょう +N ベル」). The last line says when that person's data last arrived (「15:24 に とどいた」), with
  a dot once it is over 6 hours old.
- **HUD row:** [the health button] [the meal button] [the menu], one cluster right-aligned in the top-right corner,
  the leaf at the very right (2026-11-03, the user: "move the leaf drop down button to the very right … kenkou, gohan,
  then finally dropdown menu"; [decisions](decisions.md#the-jar-goes-into-the-leaf-ごほうび-is-the-panel-2026-11-03)),
  at `--hud-top` (10px under the safe area: clear of iOS 27's top-edge blur, the Dynamic Island clear above it), inset
  14px or the safe area's side, 6px apart. The dumbbell and the bowl are the same width (60px, `--hud-side`), the menu
  a 44px disc. No jar and no ribbon in the sky: NH's island view keeps its sky clear and its UI tucked away, and the
  sky's left (a third of it from 393px up) stays free for the sun, the moon and the stars. Every target
  is 44px or more. No View Transition anywhere in it (the stripes bug); day and night are the same art (the buttons
  cream with their lip), both reading on either sky.
- **Menu** (`island/HudMenu.svelte`, `e2e/hud-menu.spec.ts`): the cluster's right end, at the screen's side, a 40px
  cream disc with the lip in a 44px target, NH's leaf mark in it (drawn inline: two greens either side of a pale vein, a dark outline, a curled stem; NH's art has no flat one, `money/leaf` is the 3D item); `aria-expanded`, `aria-controls` its
  pills. Folded by default: the sky shows only the dumbbell, the bowl and the menu. A tap unfolds it: the disc turns
  NH's yellow, the leaf tips (−40°, as if it flicked the menu down) and three cream pills drop out of it, one after
  the other (a 380ms spring, 55ms apart), right-aligned under the leaf (along the screen's side), the same width:
  **ベル 121** (the shared wallet's balance in the app's number font, no icon: the number is the picture) →
  [the panel](#panel) (ごほうび; `aria-expanded` while it's open), **ずかん** (NH's agrias butterfly) →
  [the ずかん](#zukan) and **せってい** (a gear in the say button's soft brown: NH has no settings icon) →
  [せってい](#panel). Each pill is 44px tall, its name then its icon or number (a word as well as a picture: an icon
  alone would be a guess). The ベル row's label carries today's ベル too (「ごほうび · ふたりのベル 129 ベル · きょう
  12 ベル」: on the island only a screen reader hears today's total; it's shown in full in ごほうび). No permanent
  "+N" badge on the leaf (a badge reads as a notification to clear). The guest has the ベル row too: ごほうび is
  view-only there, the same balance. It folds back up
  quicker (160ms, the last pill first) on a second tap of the leaf, a tap anywhere else (that tap still does what it
  would: no swallowed tap), Esc (focus back on the leaf), any sheet opening or もようがえ, and a pick: a pill's tap
  is a press squash, the villagers glance up (R18) and its sheet grows out of the pill's icon (Sheet's `pop`, as
  けんこう); once that sheet has closed, the focus goes back to the leaf (`preventScroll`; the pill is inert by then,
  so the dialog's own return would drop it to the page's top). Folded, the pills are `visibility: hidden` and `inert`: no focus, no taps, out of placement.ts' guards (a
  balloon may stand there). The column is out of the row's flow, so the HUD's box (`.ribbon-wrap`, which the 3D
  island measures for the sky) stays the row. Reduced motion: the pills fade in and out where they stand, the leaf
  doesn't tip.
  - Why (the design pass, 2026-11-03): a game UI view (NH's island view keeps its corners to a few objects; a
    phone-style drawer, not a second row), an iOS HIG view (one cluster at the thumb's reach of the top, ≥ 44pt
    targets, the safe area, a disclosure that says so with `aria-expanded`, labels beside icons, outside tap and
    Esc to dismiss) and an accessibility view (focus order = reading order: the dumbbell, the bowl, the leaf, then
    its pills; nothing hidden reachable; reduced motion honoured; text on cream, never on the sky).
    The pills drop down rather than slide left: sliding left would cover the sky's middle (the sun, the moon) and
    put the pills before the leaf in the reading order; under the leaf they're over the island for a moment only.
    The ベル row is first (the most used: the wallet), the rarer one (せってい) the furthest.
- **Health button** (`island/HudHealth.svelte`): a small cream pill 44px tall with the cream lip, 60px wide, NH's red
  dumbbell (`items/dumbbell`, NH's catalogue icon) across it, its plates a little over the ends; no number (the numbers
  live in the popup), the cluster's left end. Tap → the villagers glance up at it
  (R18, to the right) and [けんこう](#kenkou) grows out of the dumbbell (`health/HealthSheet.svelte`, Sheet's `pop`: a live CSS zoom
  about the button, no View Transition: its snapshot of the banded ground striped on iPhone).
- **Meal button** (`island/HudFood.svelte`): the health button's pill with NH's ramen bowl (`items/dinner`), between
  the dumbbell and the leaf. Tap → the villagers glance up at it (R18) and [ごはん](#gohan) grows out of
  the bowl (`food/FoodSheet.svelte`, Sheet's `pop`).
- **Coins** (`island/HudCoins.svelte`): each newly met goal flies up as a +1 coin from its fruit into the leaf (+2 with
  its がんばり; `CoinFlow`), the leaf squashing as each lands (the menu open: into the ベル row's number, which squashes
  instead); the ベル row's number holds while coins are in the air (`coinsInFlight`) and counts up by each one as it
  lands. As each lands, today's ベル so far pop up just under the leaf, right-aligned to the screen's side, in a small
  yuzu bubble (「+3」, counting up with the coins; the menu open: left of the ベル row), hold ~1 s and fade (reduced
  motion: a plain fade; aria-hidden: the label says it); only coins landing flash it, never a とりけす's refund. All of
  it waits while something covers the scene. The leaf, not the bowl or the dumbbell: it is where the ベル live now,
  and the corner it sits in is where NH's own bells pickup flies (up to the phone's corner).
- **Centre stage:** the plaza's middle (`world.ts` `CENTRE_STAGE`, ひろば), where visitors stand.
- **Villagers:** a tap on mine is a squish; a tap on the partner's is a high-five ([Villager taps](#villager-taps)).
  Neither opens a sheet.
- **Say button** (`island/SayButton.svelte`): a small round cream button at the scene's bottom right, NH's chat glyph
  (a speech bubble with three dots, soft ink), 36px drawn in a 44px target, 12px in from the side and above the home
  indicator; over しずえ's box while she speaks. It opens the phrase picker above it (a phrase shows over my villager
  on both phones). Hidden under a sheet, the panel or the harvest, a tree's popup, and in もようがえ. The guest has it
  too, and the tent and the homes have it ([The tent](#the-tent) "Phrases"). Nothing else lives at the bottom right (the partner's edge face and the catch plates' stack are centred; the stack keeps the button's room on both sides).
- Controls are real buttons with `aria-label`, ≥ 44px (villagers 64px); focus order = visual order.

### Wallet

ごほうび, the island panel (`wallet/Wallet.svelte`, `wallet/Shop.svelte`), top to bottom:

- **The header row:** the jar at the left (`Jar.svelte`, 58–76px wide, filling as the wallet grows: `walletFill`); to
  its right the balance, big, and under it, smaller, today's ベル in a soft yuzu pill with the Bells bag (「きょうの ベル
  +6」: both of us, がんばり and ふたりでぜんぶ included, the number the trees' popups add up to), at 0 a faint cream one
  (shown, not hidden: nothing jumps when the first coin lands). The two as one group centred in the row.
- **The rewards:** two tiles with NH item art (6px under the tile's top: the art has its own air), its name and its price: 🍦 おやつ 40 ベル and 🍜 外食 70 ベル. One the
  wallet can't cover is sunk (a tap boops). At each tile's top-right a small round ⓘ (a 24px soft-brown disc, a 44px
  target by its `::after`, `aria-expanded`) shows what counts as that reward (「たこやき・アイス・あんみつ…」) in a little
  cream speech bubble hanging from it over the tiles' art, as wide as the two tiles (a tile's width broke the list after
  every ・ at 320px; its tail under the disc, NH's bounce in); ⓘ again, a tap
  anywhere else or Esc (only the bubble: the panel stays) folds it, one at a time. No examples and no 「あと N ベル」 on
  the tiles (2026-11-03, the user: "remove the example items - replace with a small circle info button … to save
  space. remove the ato x bell text"). 買う！ asks first, applies at once and waits 5 s with とりけす before it is sent.
- **ためた ベル:** the ベル ledger ([Kiroku](#kiroku)), under the rewards; a day pushes a level.
- **かいもの きろく** (`wallet/Purchases.svelte`), at the very bottom, folded by default: its heading is a 44px
  disclosure (「かいもの きろく 3件」, a chevron that turns, `aria-expanded`) and the list grows open under it (a
  280ms grid-row ease, WebKit animates it; reduced motion: at once), folded again on every opening of the panel.

The buys list newest first (art, name, day, who, price), ten at a time
(「もっと見る」). ✕ on any line (either of us, any buy) asks NH-style (「このかいものを けしますか？ 40 ベル もどります」);
はい sends a `spend_void`, the ベル go back, and the banner carries とりけす for 5 s. The old `/jar` page redirects to the
island with the panel open on ごほうび (`?panel=rewards`, dropped from the URL once read).

### Panel

The HUD menu's 「ベル」 row → the island panel slides down from the top (`panel/IslandPanel.svelte`): title 「ごほうび」,
full height, no tabs: [the wallet](#wallet) (the jar and the balance, today's ベル, the rewards, the ベル ledger, the
buys). Every opening starts at its top. Its own chunk, loaded on the first tap. The goals are けんこう's
([Kenkou](#kenkou)), the ずかん the HUD menu's.

A day of the ledger pushes a level with ‹ (the wallet stays mounted under it, hidden, so ‹ comes back to it as it was,
scrolled where it was); ✕, the backdrop and Esc close the panel.

**せってい** (`panel/SettingsSheet.svelte`): the HUD menu's せってい pill → its own sheet, full height, grown out of the
pill (Sheet's `pop`), title せってい: **むらびと** (my villager and よびな; かえる → the picker: 23 special characters
and all 417 NH villagers, its head pinned over the scrolling grid), **サウンド** ([Sound settings](#sound-settings)), **ことば** (日本語 /
English), **つうしん** (when each of us last synced; いま つうしん; not the guest's), **もようがえ** (one row with its はじめる;
not the guest's) and **あそびかた** (くわしく → the guide: the goals, ふたりでぜんぶ, the treats, the Sunday recap, a
protein hint of 1.6 g per kg a day). The picker and the guide push a level with ‹; ✕, the backdrop and Esc close it,
and the next opening starts at its top. Its own chunk, loaded on the first tap.

### Kiroku

The ベル ledger (`model/history.ts`, `components/kiroku/*`), read-only, in [ごほうび](#wallet) under the rewards
(「ためた ベル」; it was a tab of its own, きろく, until 2026-11-03):

- **ベル:** by week (earnings only; the all-time total isn't repeated here: the wallet is ごほうび's) one line per day under the two avatars: each person's four
  fruits (bright = met), a star on a ふたりでぜんぶ day, the day's ベル (tap → the day); on a がんばり day a smaller second
  line with each person's がんばり ベル.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  「がんばり」 chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

けんこう (`model/health.ts`, `components/health/*`, `e2e/health.spec.ts`): the health popup (the HUD's dumbbell; full
height like the panel, title けんこう and ✕; ✕, the backdrop and Esc close it): the
Health data over time for the personal trainer, one person at a time, computed on read, each card with its goal. Its code and strings load with the first opening.

- **The selectors** (the user: "move the user selector to the left of the title in the same row … move the time
  period selector to the same row as katsudou and karada"). Whose data sits in the title bar, left of けんこう
  (NavBar's `lead`: the title stays centred, ✕ at the right): one native
  `<select>` (iOS's own picker; a cream pill ≥ 44px with a chevron, 16px type so Safari doesn't zoom; 「だれの データ」),
  compact (`Pick` `compact`: the avatar, the name, a stroke of their colour; at 320 the name without the avatar).
  The two members, this phone's person first and chosen on opening, kept for the session. Then one row: かつどう ·
  からだ, two pills, each with an NH icon (`art.ts` GROUP_ART: the cute sneakers, the dreamy bear toy), and the
  period beside them, a dropdown as wide as its longest option (「きかん」: 1週 · 1か月 · 3か月 · 1年). 1週 and
  かつどう on every opening; switching either keeps the other, the range and whose data; the guest has no switch
  (かつどう only), the period alone at the row's right end.
- **Then** a sticky row: ‹ the visible range (「10/2–10/31」; 「1日ごと」 / 「1週ごとの 1日平均」 / 「1か月ごとの 1日平均」
  under it) › and きょう.
- **Cards, per group** (`model/health.ts` GROUPS and CARDS, the user's "activity metrics and body metrics"): かつどう
  🍎 歩数, 🍐 ムーブ, 🍑 エクササイズ, 🍒 スタンド (then the footnote); からだ 体重, 体脂肪率, BMI, 除脂肪体重 (what a
  scale writes at one weigh-in). As each activity card has its fruit, each からだ card has a catalogue icon
  (`art.ts` BODY_ART, 24px, decorative: the heading names it): 体重 the red kitchen scale (a scale, but NH's, and
  readable on the cream and the night cards), 体脂肪率 the protein shaker, BMI the exercise bike, 除脂肪体重 the
  weight bench (muscle): the user's picks.
- **A card per activity metric**: the goal (at the upper right: [Goals in place](#goals-in-place)); 1日の平均 with 前の期間より ↑/↓ %;
  目標 n/N日（%）, ベスト and 記録なし n日; the chart; a one-line key.
- **Chart** (`BarChart`, SVG): a bar per day (1週, 1か月), per week (3か月: 13) or per calendar month (1年), each
  the bucket's daily average, in the person's colour (ウェイ blue `--person-a`, うめ orange `--person-b`); solid when
  the goal was met, pale when not; today outlined; a finished bucket with no row gets a short hatched stub (記録なし).
  The goal dashed (stepped when the Move or steps goal changed). On 1週 each bar carries its value. A tap shows one value; a
  horizontal drag turns the page (right = older); vertical drags scroll the panel.
- **体重** (`WeightCard`, `DotChart`): its goal at the upper right; 平均 (n回の記録), 期間の変化 ([Weight](#weight)), the chart on an axis fitted
  to the weights (dots joined by a thin line; the goal dashed, or a 「目標 66.0 ↓」 label when far off) and the goal
  month at that pace (only when the period ends today).
- **体脂肪率 · BMI · 除脂肪体重** (`BodyCard`, `DotChart`): as 体重 (体脂肪率 with its own goal, `goalBodyFat`, drawn
  and keyed exactly as the weight goal: the dashed yuzu line, 「目標 19.5」 or the ↑/↓ label when far off, the axis
  fitted to it when near, 「- - 目標」 in the key, and the goal month at that pace; BMI and 除脂肪体重 have none;
  unset = no line): 平均 (n回の記録), 期間の変化 (the same
  plain change, in the metric's unit: `−0.4%`, `+0.2`, `−0.3 kg`) and per week, and the dot chart on an axis fitted to the
  values (at least 2 points of body fat or 2 kg, 1 of BMI). A day with no measurement has no dot; 記録なし when the
  period has none. Never earns, no good / bad colours.
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit`, `goals.ts`; the user: "every metric card that has a goal gets a
  tappable goal there"): each goal sits at its card's upper right as a chip, 「- - 目標 8,000歩 ✎」 (the swatch the chart's
  goal line: soft on the bar charts, yuzu on the dot charts; 「目標 まだ」 when none). A tap opens its editor in place: a tan
  tray across the card under the header, its notch under the chip (the chart moves down; nothing is covered, and Safari
  scrolls the field above the keyboard): the goal's title (with きょうから for the goals a day keeps), −/＋ by the goal's
  step around a 16px field with its keypad (nothing focused on opening, so no keyboard until the field is tapped; −/＋
  start from the goal, else the period's average for 体重 and 体脂肪率), the range in words (coral after a refused
  けってい), then 目標をなくす (once set, for the goals that may be cleared), やめる and けってい (dimmed until the field
  holds a goal). One open at a time; Esc, やめる or a tap anywhere else close it unchanged, the focus back on the chip;
  saved, a banner says so. The goals, per person, for whose data is shown (either
  person sets either person's):
  - 🍎 歩数: 1,000–30,000 in 500s, from today on; 8,000 for both until set. 🍐 ムーブ: 100–2,000 kcal (−/＋ by 10),
    from today on. The chip shows the goal at the period's end (a past period's own); the editor starts from today's.
    🍑 エクササイズ and 🍒 スタンド: fixed, the chip read-only.
  - 体重 (目標体重: 20–300 kg, ±0.5) and 体脂肪率 (目標体脂肪率: 3–60 %, 「3〜60%で 入れてね」, ±0.5): one decimal in a
    decimal field, clearable; shown only, never earn.
  - The guest's phone: the chips read-only (and no からだ card, so no からだ goal).
- **Rules:** a day's value is Health's latest, as reported: every day with a row counts, whatever its value; 記録なし is
  a day with no row (counted from the first activity record); today is drawn but not counted; the previous period is
  the same length just before. The footnote says so.
- **Cost:** the tab's code and strings (`i18n/kenkou.*.json`) load with the tab; the daily series is memoised per
  model and day. `?demo&weeks=60` makes a longer history with some missing Watch days.

### Gohan

ごはん, the meal log (`model/food.ts`, `components/food/*`, `lib/food/`, `e2e/food.spec.ts`; the data in
`static/food/`, built by `food-data/`: [food data](food-data.md)): the HUD's bowl button (NH's ramen bowl,
`items/dinner`, set 3px below the pill's centre so the bowl, not its nori, sits mid-pill) grows it out
of the bowl like けんこう (full height; whose day, title ごはん and ✕; ‹ in whose place while a level is open). What each of us ate, typed in by hand; it never earns ベル.
Everyone sees everyone's meals, the guest's phone too; only the owner changes an entry. Its code, its strings
(`i18n/food.*.json`) and the food data load with the first opening (the data only with the first search).

- **Tabs:** first, right under the title bar (stable across tabs), けんこう's group switch (`ui/Segmented`, a list
  of tabs: `Food.svelte` TABS): きろく (on each opening; its icon NH's rice cooker, `art.ts` FOOD_TAB_ART: the plate
  meal before it was a blur at 22px) · グラフ (`FoodChart`). Under it, per tab: きろく the day row, グラフ the period
  (at the row's right end, where けんこう has it; the tabs take the whole row) then the range row. Switching whose keeps
  the tab. Recipes and custom foods have no tab: a meal's search is the way in.
- **Whose day (きろく, グラフ):** in the title bar left of ごはん, as けんこう's (the same compact pill): this phone's
  person first, then the others (the guest once it has logged a meal, or on its own phone); kept for the session.
  Then (きろく) a sticky row: ‹ the day (「11/4(水)」) › and きょう; › goes past today only to tomorrow, and only when a
  いつもの fills it (read-only: a look at what comes).
- **Summary card:** この日の カロリー, the day's kcal large; with the person's goal (`pref kcalGoal`, 1,200–5,000 by
  50 in the field, the record takes 1,000+; none until set) 「目標 2,200 kcal」, a bar in the person's colour and,
  today, あと N kcal / N kcal オーバー, a past day 目標より N kcal 少なめ / 多め; coral only past 20 % over (the lifter's
  surplus is no fault). Then たんぱく質 · 脂質 · 炭水化物 · 塩分 in grams, protein with 「目標 N g 以上」 (1.6 g × the
  latest weigh-in; members with a weight only). A day with nothing logged: no tiles; a past one 「きろく なし」 (not
  0 kcal). On my day ✎ sets my goal (`health/ValueInput`, with 目標をなくす).
- **Meals:** 朝ごはん · 昼ごはん · 夜ごはん · おやつ, a card each with its kcal and a row per entry (the food, its
  amount in one format, a weight once: 「茶碗1杯（150g）」, 「1パック（110g）」, 「中ジョッキ×2（700ml）」; kcal). On my
  day ＋ → the search (its field focused in the same tap, so the iPhone's keyboard comes up), an entry → its amount
  at once (from its snapshot: its own portion; the catalog's portions swapped in when they come); anyone else's day is
  read-only. Levels slide in (240 ms, as けんこう's); ‹ comes back where the day was scrolled, the focus on what
  opened it. Confirmations are short (「夜ごはんに ついかしました」) and docked low, never over the level they land on.
- **Search:** a 16px field (no search mid-IME composition), its ✕ the app's 44px lipped round button; under it, side
  by side (half the row each, on 393 px too), ＋ レシピを つくる (a meal's search only) and ＋ 食品を つくる; empty,
  さいきん (my latest entry of each food, as I had it); typed, the best matches: the name, ✓n when n independent
  sources agree on its kcal, a product's brand and kcal per 100 g, and its default portion (with its weight) and kcal;
  the same name, brand and kcal shown once. ー counts (カレー is not かれい). Offline: 「データを よみこめませんでした
  （オフライン？）」, もういちど, and さい��ん still under it (a recent pick keeps its portion).
- **Amount:** the food's values per 100 g; its portions as chips (100 g last), −/＋ by a whole portion for the things
  counted (本 · 個 · 杯 · 缶 · 枚 · 切れ · 貫 · パック · ジョッキ …) and by half for 茶碗, 人前 and weights (±10 g once
  grams are typed), a grams field (ml for a drink; typing grams leaves the portions); kcal and P/F/C/salt live; which
  meal; ついか, or ほぞん / けす for my entry (けす at once, its banner's とりけす logs it again).
- **いつもの (a repeat):** a meal eaten the same way on set weekdays. Its items fill each day it covers, marked with
  the drawn 🔁 (`RepeatMark`, not an emoji) on each row, and count like any entry; everyone sees them. Its days sit in
  the meal's header as a chip (毎日 · 平日 · 週末 · 月水金…), on my day a tap → the repeat level (`FoodRepeat`):
  the weekdays (毎日 · 平日 · 週末, then 月〜日 one by one; one stays on), what it holds with the kcal sum, and
  いつものを やめる (asked twice: ほんとうに やめる？; past days keep theirs), この日の内容を いつものに する (when that
  day's foods or amounts differ, not its entries' ids) and 曜日を ほぞん (both from tomorrow). On my today a meal with
  entries and no repeat ends with a small 「いつものに する」 link → the same level, 毎日 first, 「いつものに する」 (the
  day looks the same, its items now the repeat's). One name, いつもの, for the title, the chip, the marks and the
  verbs. Tapping one of its items opens it; ほぞん or けす changes that day only: the day leaves the repeat then (its
  items become its own, in one go; unmarked under the same chip); ‹ changes nothing.
- **グラフ (the グラフ tab;** the user: "show total calories over different periods of time … also show average line …
  also add in the calories burned graph"**):** けんこう's period dropdown (`health/Pick`) under the tabs, its range row (`health/RangeNav`, swipe paging), then たべた カロリー (`FoodIntake`, けんこう's
  `BarChart` and MetricCard's layout; `model/food.ts` foodSeries, one pass over the record up to today, read by
  health.ts's bucket and stat rules): a bar per day (foodDay's total, repeats included) or per week / month (the daily
  average of its days with a meal), every bar solid in the person's colour (no goal-met shading: the kcal goal isn't
  a target to hit, and a low day is never rewarded); today outlined and uncounted; a day with nothing logged is
  記録なし (the stub, never a 0). 1日の平均（n日分） and 期間の合計 over the finished days with a meal; 記録 n日 ·
  記録なし m日; the goal dashed, the average a flat solid line (「平均」 in the key). Under it, for a member, けんこう's 🍐 ムーブ card as is for the same
  person, period and range (the calories burned; never subtracted from what was eaten); the guest has none of its own.
- **マイレシピ:** everyone's recipes (`food_recipe`), in a meal's search: all after さいきん (the latest changed first),
  the matching ones above the catalog's; a row: its name, who set it and how many servings, a serving's kcal. One →
  the amount for the recipe as a food (1人前 first, ぜんぶ, 100 g; the search's meal), logging an ordinary entry of mine
  on the day shown; its 「レシピを ひらく」 (left of ついか) opens it. ＋ レシピを つくる (under the search's field) opens a
  new one. Mine opens in the editor (`FoodRecipe`): the name, なん人前 (−/＋, 1–20), the ingredients (each a row like a
  meal's; a tap → the amount: ほぞん / けす), ＋ ざいりょうを ついか (the search and the amount, no meal: ついか puts it in
  the recipe), 1人前あたり and ぜんぶで live, then けす (asked twice: ほんとうに けす？) and ほぞん (waiting until something
  changed); both go back to the meal's search. Anyone else's: the same read-only, 「〇〇の レシピ」, with 「コピーして
  へんしゅう」 (a recipe of mine, opened in the editor) and 「ごはんに ついか」 (back to its amount).
- **マイ食品 (the user: "create my own food and record its calories for future use in case there's a food not in the
  existing database"):** everyone's custom foods (`food_custom`, contract/food.ts `customSnap`), a food typed in as one
  serving. Both searches (a meal's and a recipe's ingredient) list them under マイ食品 (all after さいきん / マイレシピ,
  the matching ones above the catalog's); ＋ 食品を つくる under the field, and when nothing matches a card saying so with
  a line on what it is for and 「＋ じぶんで つくる」, open the editor, the typed text its name. The editor (`FoodCustom`): なまえ, 1食の めやす (「1食」 unless
  typed) and その重さ g (may stay blank: then it logs by the serving), カロリー kcal (needed) and P/F/C/塩分 g (only
  what is known), all per serving, full-width digits welcome; a weight too light for its values (denser than any food:
  `customDensityOk`) is refused before ほぞん. ほぞん goes on where it came from: its amount (a meal's ついか, or the
  ingredient's); a custom food's amount (from the search) has 「マイ食品を ひらく」: mine in the editor (ほぞん and けす,
  asked twice, go back to the search), anyone else's read-only with 「コピーして へんしゅう」 and 「ごはんに ついか」 (back to
  its amount). With no weight the amount steps whole servings, no grams field and no weight shown anywhere (the
  entry's snapshot says `sv`: 「1食」, 「1食×2」, a nominal 100 g a serving underneath; a recipe with such an ingredient
  logs by 1人前 alike).
- **データの出典** at the foot: each dataset's label, attribution and license (the data's licenses ask for it).
- Food names come from the data, so their kanji are not all in the trimmed Zen Maru subset: those fall back to the
  system font (the copy's own strings are covered: `npm run fonts:subset`).

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
line and goal days and あそびかた.

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

Exactly two, one shared wallet (`SHOP`): 🍦 **おやつ 40 ベル** (`snack`) and 🍜 **外食 70 ベル** (`dinner`). A buy is
`spend {spendId, item, bells}` with `bells` exactly the item's price (the server refuses anything else). Either person
buys; either person undoes any buy (`spend_void`).

Against the numbers check, each is something to save for (`scoring/bells.test.ts` pins it):

| Week | ベル | Buys |
|---|---|---|
| Most | 98 | one 外食 (28 left) or two おやつ (18 left); never both (110) |
| Perfect | 70 | exactly one 外食, or one おやつ (30 left) |
| Typical | 52 | one おやつ (12 left); a 外食 takes about a week and a half. Three typical weeks (156): a 外食 and two おやつ, 6 left |
| Lazy | 28 | nothing: an おやつ takes about a week and a half |

So a typical pair has two おやつ and one 外食 every three weeks. (Before 2026-11-02: おやつ 8, 外食 15, two
or three of each a week; a buy at the old prices is refused.)

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

`lib/components/island/*` and `lib/components/world3d/*`: NH's island in 3D on the editable layout, NH's own models in
three.js, with the DOM island over the canvas as its tap areas, marks, balloons and popups ([World](#world)). What comes only on its days
(a visitor, the tape deck, the cake, the weather, the fireworks, Halloween's, a birthday's and the wedding's decorations)
is loaded the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load carries none of it. Light from the upper left;
each surface one fill, one gradient, one soft shade; no strokes on scenery. Only `transform` and `opacity` animate;
everything pauses while hidden (`data-paused`), and a sheet pauses particles, critters and idle life
(`data-covered`); under a full-height sheet (the panel, けんこう, ごはん) every animation in the scene holds too
(`data-sheet`) and the 3D island draws nothing, so nothing behind the sheet asks for a frame (`e2e/sheet-idle.spec.ts`).
Nothing on the island pays ベル.

### World

`island/world.ts` (every coordinate: the layout's once applied, `island/site.svelte.ts`), `island/camera.svelte.ts`
(the projector), `island/IslandScene.svelte`, `world3d/Island3D.svelte` (the canvas), `world3d/engine.ts` (the scene,
the camera, the frames), `island/Scenery.svelte`, `e2e/world.spec.ts`, `e2e/world3d.spec.ts`, `e2e/world-perf.spec.ts`
(on demand: `WORLD_PERF=1`). The 2D island (the rolling log, its baked ground and CSS water, せってい's 2D/3D switch)
went in November 2026 (docs/cleanup-2d.md).

- **Units:** world units (an 80u villager); x across (centre 195), z into the island (bigger = further back; the front
  shoreline is SHORE_Z). The live island reads the editable layout (`site.svelte.ts`: world.ts's values are the
  layout's, docs/island-layout.md); world.ts's own values are the old fixed island's, read before the layout is
  applied and by the unit tests and the layout scripts.
- **No WebGL** (never on the users' iPhone 15 / 16 Safari): instead of the island a line in the middle of the scene,
  「この端末では しまを 表示できません」 / 「ごほうびや けんこうは いつもどおり つかえます」 (`[data-no3d]`); the HUD, the
  panel, the health popup and ごほうび work as ever (`e2e/world3d.spec.ts`).
- **The 3D island** (docs/decisions.md "The island in 3D"): `Island3D.svelte` puts a canvas under the stage's nodes
  (over the DOM sky: the sun and the moon stay behind the world) and hands the projector its camera (`World.useThree`);
  the engine (`engine.ts`) runs the World's step in its own frame (60 a second while anything moves, 30 while only the
  water does; a model's or a critter's move slower than 60 px/s on screen, or off it, is ambience: `world3d/pace.ts`), and the World steps itself on the game's own clock when no frame has (camera.svelte.ts `simTick`). The
  ground and the water are the layout's (`terrain.ts` buildGround with NH's textures, on `water.ts`'s shared uniforms); the objects
  `objects.ts` placeObjects from the layout and the day's scenery and decor pieces (a card of today's art for what has
  no model yet); the villagers NH's models (`villagers.ts`, villager3d/), the visitors cards of their renders posed
  from the director (`motion3d.ts`); the lights `lights.ts`; the finger `gestures.ts`. The camera's ends come from the
  layout's extent (the shoreline at まえ, the far end at ウェイ's door). `window.__world3d` (stats, view, go, client,
  ground, where, focus, xRoom, strays, alphaBlends, away) for the e2e (`e2e/world3d.spec.ts`).
  - **The camera** (the user, 2026-11-02): the default zoom (1) is the widest it rests at, x centred, and one finger
    only scrolls along the island (its sideways movement ignored). Zoomed in past it, one finger pans sideways too (a
    free 2D pan with its fling), x held over the land plus 24 u of sea either side (`xRoom`: growing in over the first
    0.3 of zoom, so it's exactly centred at the default). A pinch zooms about its middle (the ground under it stays
    put, its x as far as the room lets it); pinching back toward the default eases x to the middle; past the default
    it gives with rubber-band resistance and, on release, springs back to the default over 350 ms, eased out (the
    user's approved automatic move). In: up to 1.8. A gesture is one kind from start to end. No native scroll: the
    island's viewport never scrolls.
  - **What comes and goes** is drawn from the DOM island's own nodes (`camera.svelte.ts`): a node with an `m3` art key
    stands as NH's model where the node is (its live position too; a move eases over `ms` as its sprite's CSS
    transition; `drop` falls in from above; `y` an absolute height: a fish's shadow under the sea), and one with a
    `c3` is a character's card (a visitor) posed by its actor; their DOM art goes invisible (`.m3on`, IslandScene's
    `[data-r3]` rules) and stays as the tap box, its image never downloaded (`characters/artGate.ts`) unless the 3D
    island has no model for its key (`m3off`). Finds, weeds, the rock, decorations, the tape deck, the events' pieces,
    the critters (the bugs at their flight height, the fish shadows turned the way they swim: under the water, above its
    bed (a pond put down: its own), drawn after the water so it never washes them out: `things.ts` UNDER_WATER), the goal trees' fruit
    (greyed until grown, falling as the same model), a shaken tree's drops; the stream's petals and leaves
    (`floats3d.ts`); the seasonal fall (petals, leaves, snow: `ambient3d.svelte.ts`).
  - **Flourishes** (`effects.ts`, `island/fx3d.ts`): a tap's dust and splash, a bush's leaves, sparks, drops, sparkles,
    the 「！」 of a bite: a few particles of NH's fx/* models in world space, depth-tested, fading; the DOM's own
    `.in3d`, invisible. A DOM reaction on art the canvas draws (a jiggle, a rustle, a shake) moves the model too
    (`island/echo3d.ts`).
  - **The board's focus** (docs/board.md): `world.three.focus(rect)` / `unfocus()` / `attach(id, obj)`.
  - On a software renderer (CI's headless Chromium) it draws at its lightest (half the pixels, no shadow map); the
    e2e's logic mode (`E2E_RENDER=none`) runs the frames and draws nothing.
- **The projector** (`camera.svelte.ts` `World`): every world thing is a DOM node at its feet (`{@attach world.at(…)}`)
  placed through the 3D camera by one step: an upright node (translate + scale; a modelled thing's squashed upright as
  the model's height is foreshortened), a flat mark (also squashed by the ground's foreshortening) or a ground quad (a
  matrix3d). Nothing is placed until the 3D camera is up. **One depth order** for the DOM: the z-index from the feet
  (nearer in front, ties by x); a tree is two nodes, its canopy 14u nearer than its trunk. Overlays anchored in the
  world (a tree's popup, a bite's 「！」) stand over everything at their true size. Only nodes in
  [camZ − 600, camZ + 900] are shown.
- **The ground and the water** are the layout's, built on the phone (`world3d/terrain.ts` buildGround: NH's ground
  textures in `static/terrain/nh/`, its looks by the season and the blossom and foliage weeks; `world3d/water.ts`: the
  sea, the rivers' flow, the falls, the ponds), docs/island-layout.md.
  - **The sea's wash** (the user, 2026-11-03: "add a wave animation - be faithful to the original animal crossing
    game, waves washing ashore onto the beach"; `layout/swash.ts`, drawn by `terrain.ts`): NH's gentle waves on every
    sea shore of the layout, round its smoothed coast. Every 5 s a wave's white foam line rolls in over the shallows,
    runs up the sand (easing out, 11–22u up: its reach varies wave to wave), a thin sheet of water behind its lacy
    front with the sea's turquoise showing through it deeper down and a fainter foam line inside it; then it drains
    back, faster as it goes, its foam thinning, into the water, and the sand it covered stays dark and wet, drying in a
    second or two. The waves are out of step along the coast (each point's phase is its nearest shoreline point's, so a
    front stays a line along the coast) and travel along a beach a little. Lit like the ground: dim and moonlit at
    night, warm at dusk, nothing switched. Cheap: a shader on the ground's own material and the sea's (no geometry),
    on the water's clock (the ambient 30 fps when nothing else moves).
- **Layout** (`world.ts`: the old fixed island's, which the editable layout's default was drawn from: `npm run
  layout:default`; the live island reads the layout, docs/island-layout.md): まえ: the wide front beach with the island's only palms (three, out of the way: one at each of its outer corners and a
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
  moving a composed piece.
  **Wild flowers** (`world.ts` FLOWERS, `Flowers.svelte`): NH's flowers in seven clumps of 2–5 of one kind over the
  open lawn (four small ones on the front lawn, three round おく's ground), never on sand or a path; the season's
  kinds in turn (`scene.ts` WILD: tulips and hyacinths, lilies and roses, cosmos and mums, pansies and windflowers
  blooming on under the snow), 30u (pansies, windflowers, mums lower, lilies taller).
  Each flower's id is where it stands (`fl:<x>:<z>`): watering, hybrids and the flower bugs key on it.
  **Decor** (NH's models and catalog icons): streetlamps, garden lanterns, garden and flat rocks, the month's bushes, a
  bamboo grove, and the campfire on the clearing's east side (262, 944; NH's `FtrCampfire`) with two log stools at it,
  clear of centre stage and the tent's door. Unlit by day; from dusk (.7) and at night three tongues of flame flicker
  over the logs (the DOM's, untinted, in the fire's depth) and the 3D island's flame cards, glow, halo, pool and point
  light burn, still while covered or hidden.
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
  ([Decorating](#decorating)), so a seasonal piece never lands on one. Their shadows are the 3D island's. A tap answers where it stands (nobody walks, my villager turns to it), but for a seat (it
  sits: below): the bar rings (`clang`), the pump gushes (`pump`), the sandcastle and the snowboy puff, the
  rest knock softly. The shishi-odoshi tips (NH's model posed: `deco/shishiodoshi-tip`) every 15–25 s while it's in
  view and on a tap, and knocks back on its stone: `kon` (local, cosmetic). The new sounds are synthesized
  (`sound/synth.ts`).
  **The decor's life** (ambient life's beats, `island/ambient.ts`, `IslandScene`): an outing now and then stops at the
  front bench and sits 20–40 s; on a day a sit on the pond's bench (each its own seat); in the evening (19–22) a
  villager goes to sit at the campfire on its own stool (A west, B east) for 30–60 s; on a day its person met the
  exercise goal (🍑) a villager goes to the pull-up bar now and then and does pull-ups there; when both met every goal
  today, at dusk (17:00–19:00, each quarter hour both are home) they set off together for the front bench and sit side
  by side facing the sea for 90 s. A villager standing still on a seat's spot (`world.ts` SEATS: `layout/nav.ts`
  seatsOf, a step in front of the seat, where the room's walk to a chair ends) is on it: the 3D villager turns and sits
  down on the piece's own seat (`villager3d` sitAt on its `seats3d.json` anchor, as in the tent), or lies in the
  hammock (asleep, it naps there); both on one bench: a ♥ each. Like every outing, each phone sends its own villager's
  walk (villagerSync) and plays the partner's from the slot only while they're away; seated, the pull-ups and the ♥
  follow from where the villagers stand, so both phones draw the same (`e2e/sync-harness.spec.ts`: A seated on the
  front bench is seated on B).
  **Sitting on a tap** (`island/sitting.ts`, IslandScene `sitOn`, `e2e/sit-outdoors.spec.ts`; the user: "similar to
  when they're inside a home, have them sit/sleep on that object - be consistent"): a tap on a seat (the park bench and
  the log bench, two each; a log stool; an iron garden chair; the hammock and, in its summer, the beach chair, lain in)
  walks my villager up to its free seat nearest it and on, as in the tent: the second exception, with the doors and the
  board, to "a tap on something acts in place". Taken by another villager: the other seat, else a `boop`; two on one
  seat (got there second, or two phones took it at the same moment, each before it heard the other): the earlier sit
  keeps it (a walk's end, `s` + `ms`, the same numbers on every phone), an exact tie by who (A, then B, then G), and the
  other gets up for the other seat, else a step aside (`sitting.ts` yieldsSeat, as the tent's `outsat`). On it a tap
  on the ground gets it up and walks it; a tap on another seat moves it there; a tap on it is its squish. Only a seat that's there today sits (the illuminated tree in the
  hammock's spot, the picnic set on the pond's bench don't). Nothing new goes over the relay: the walk ends on the
  seat's spot, so the partner's and the guest's phones see it sit, a phone opening later finds it seated, and 3 minutes
  after its phone has gone it gets up and walks home like any.
  The pump waters every wild flower within 70u (each the shared `watered` op, as a tap's watering). The snowboy says a
  line in its voice on a tap (「さむいって いいね〜」…; melting: 「すこし ちいさく なっちゃった…」).
  `fixedDecor.test` holds the plan's rules: まえ one piece for good and two seasonal at most,
  nothing over the finds or the sea view, nothing over 40u in front of z 300, 40u from Gulliver and Daisy Mae; every
  spot 20u off a path, 24u off the dig, weed and flower spots, 30u off trunks, 60u off centre stage, the cake and the
  arch, 12u off the water.
  `scenery.test` keeps every piece off the water, the paths, the footprints and the features' spots, and the walk
  reaching every door; bamboo and rocks are obstacles like the trees.
- **Winter and night looks:** NH's snowy models and the models' emissive light (the campsite's lantern and door, the
  lamps' glass), lit at dusk (.7) and night by the 3D island's lights (`world3d/lights.ts`).
- **Sizes** (`scene.ts`), NH's proportions against an 80u villager (≈ 45 × 76px at the front on a 393px screen): hardwood
  120u · cedar 140–150u · palm ~110u · bush 34–40u · flower 30u · hanging fruit 20u · ground fruit 24u · a shell 32u
  (its art, ≈ 22px drawn) · a star fragment 24u · the bottle 28u · a mushroom 26u · a dig spot 26u · a weed 24u · a
  branch 36u, a coconut 28u · a present ≥ 30u · the bugs 1.6× their drawn sizes (a butterfly ≈ 29u, a beetle ≈ 18–24u,
  a ladybug ≈ 14u, the tarantula ≈ 27u) · fish shadows 20–64u by NH's size 1–6 (an eel 44u; fresh water 0.65×).
  Every tap target is at least 44px ([Scene interactions](#scene-interactions)).
- **Fixed over the island:** the sky (to the horizon), the HUD, the weather, the fireworks and the shooting stars.
- **The tint at the source** (IslandScene): what the DOM still draws over the canvas (a mark, a card with no model, a
  flourish) takes the time of day's multiply as an SVG colour-matrix filter on what it draws (each image, svg and
  drawn bit; a wrapper's ::before / ::after), never on a wrapper; a light (a lamp's, a firefly) takes none. A leaf's
  own filter takes the tint first (`var(--leaf-tint,)`). The 3D island's light is its own scene's.
- **Cost:** nothing runs when still: a camera move, a walk or a change places what moved (the engine's frames, the
  game clock's steps while something moves); style writes only when a value changes. Measured at 4× CPU throttling: see `docs/decisions.md`.

### Buildings

`island/buildings.ts`, `island/Scenery.svelte`, `e2e/tapwalk.spec.ts`. The campsite, the homes, the museum
([The museum](#the-museum)) and the shop ([The shop](#the-shop)): a tap on one walks my villager up to its door and goes
in (the tent's inside: [The tent](#the-tent); a home's room; the museum's and the shop's own screens). The partner's presence
is their villager and the edge face, not a character of its own (`partnerOnline`: the relay's presence, never in the
demo).

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
  foot, over its own tree as far as the screen's edges allow (above the canopies when they leave room; else beside
  the other tree's canopy, which stays tappable); a tail toward the tree when the tree is above or below it.
- `fruit-day` in localStorage (`{ date, dropped, picked }`, ids `A:pear`): losing it only drops a fruit again.

### Shaking a tree

`island/treeShake.ts`, `island/TreeShakes.svelte`, `e2e/shake.spec.ts`, `e2e/shared-world.spec.ts`. Every tree on the
island shakes: the two goal trees and every oak, cedar and palm of the scenery (`sceneryTrees()`; bamboo doesn't, as in
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
  hour, on both phones. No fruit from a goal tree: its fruit falls when its goal is met.
- **A tree's present** (`island/treeGifts.ts`, `e2e/tree-gifts.spec.ts`; NH's furniture from the trees): each Tokyo
  day two of the oaks and cedars (`GIFT_TREES`: not a palm, which has its coconuts, nor a goal tree, which has its fruit
  and its popup) hold a piece of furniture, and the first shake of one drops it before anything else, once. It falls
  out of the canopy wrapped, as a balloon's present (our presents are wrapped, and a present to open reads as the
  moment the user asked for), in front of the trunk, and a tap opens it where it lies like one: the confetti, the
  fanfare and 「システムキッチンを てにいれた！」. Inside is that tree's piece of the day (`catalog.ts` treeItem): the balloon
  presents' furniture (every piece as likely, the shops' season stock only in season) that the tent has a model of, so
  it's always placeable (みつけた). Which trees and what they hold come from the date and the island's seed (`dayRand`),
  the same on every phone with no messages. Furniture only, never ベル (NH's bag of bells from one tree left out:
  scenery never pays). While it lies unopened, a shake of its tree only rustles. Shared: the drop is a `put` of a
  `present` by the tree's id (`tf:<tree>`; the shake itself crosses as `none`), first wins at the relay, so it lies on
  every phone and in the day row; opening it is the present's `pick`, and the ずかん's カタログ credits whoever opened it
  (A, B or the guest).
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
while covered or hidden; decorative, `aria-hidden`, pointer-only. What nothing else took is a walk ([Walking](#walking));
a seat (its tap area's `data-sit`, or the ground at its foot) is sat on ([World](#world), "Sitting on a tap").

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

NH's balloon present: by day every 45–90 s of on-screen time (the first after 20–40 s). It flies over the island in
3D (`island/balloonFlight.ts`, drawn by `world3d/balloon3d.ts`): NH's balloon with the present swinging on a short
string under it, at one height (165u over the highest ground under its lane: well above the tallest trees), from the
sea off one side to the sea off the other in about 22 s, bobbing, swaying in depth and rocking gently, its soft blob
shadow on the ground right under it; bent with the rolling log like everything else. Its lane is picked from the view
as it starts, at any scroll and zoom: across the screen a little under the HUD (and the horizon), biased to the front,
its shadow in view; none when the sky under the HUD is too short, with reduced motion, or with no 3D island. Its tap
area is a world node on it (`island/Balloon.svelte`: the balloon and its present, 48px at least, never through a
control over the island). A tap pops it (a "pan!", confetti and a sparkle where it burst): the balloon and the present
on its string go at once, and the present falls along a short floaty arc (a little hop, a slow start, a sway that
settles; 1.6–3 s, longer the further it drifts) to a spot chosen before it falls (`island/presentLanding.ts`): open
sand or grass (the layout's walk grid all round it, one level: not the sea, a river or a pond, a cliff's edge, the
stairs or under any object's footprint), clear of what lies there, in the lower part of the view (the front, near
the camera), inside it and clear of every control (the HUD, the bottom controls, the catch stack); popped over the
back of the island it drifts forward to the front. Each rule gives way a little before none is found; with no open
ground in view at all nothing falls. It lands with a sparkle and stays until tapped, put on the island for both phones
(the landing spot is sent: `put`; not kept across a reload). The flight's clock is the island's frames (the
ambience's rate): it holds while the page is hidden or a sheet covers the island. A tap
opens it where it lies: the wrapping pops (confetti, sparkles, the catch fanfare) and its plate
reads 「カエルのチェアを てにいれた！」 (`island/catalog.ts`, its own chunk with its names, fetched when a present
lands). What's inside follows NH (Nookipedia, Balloon: the item drop rates, Bells and materials left out): furniture 35 :
clothing 20 : a season's DIY recipe 15 while a recipe season is on, else 50 : 25. The pool is NH's shop stock, 1,836
base items (no colour variants): orderable, sold by Nook's Cranny or the Able Sisters, no event, never DIY items, Nook
Miles exclusives or special characters'; the shops' season stock only in season (a kotatsu Dec–Feb), clothing twice as
likely in its style's season. The 126 recipes balloons carry, each in its NH window (northern hemisphere): cherry
blossoms Apr 1–10, young spring bamboo Feb 25–May 21, summer shells Jun–Aug, acorns and pine cones Sep 1–Dec 10, maple
Nov 16–25, mushrooms November, ornaments Dec 15–Jan 6, snowflakes Dec 11–Feb 24, Halloween October, Shamrock Day
Mar 10–17, Bunny Day's egg balloons on its days; a recipe shows NH's recipe card. Never Bells, nothing kept, but counted
in the ずかん (カタログ, レシピ: a first one gets the plate's second page). On Bunny Day a sky egg instead. The catalogue is built by `npm run catalog:build` (`scripts/catalog.ts`: the ACNH spreadsheet's
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

- **Fishing, seen by everyone** (`e2e/fish-sync.spec.ts`; the user: "we know who's actively trying to catch a
  fish"): each step of a line goes to the others' phones as it happens (`fish {ph, id?, pt?, from?, s?}`, presence only:
  `cast`, `nibble`, `bite`, `reel`, `off`), so every phone shows it: their villager's rod (in a line's reach of the
  float, else the line runs from the bank), the line out to their float where it landed, its bob, each nibble's dip and
  ring, the bite's plunge and splash, the reel. The shadow it's cast at swims up to their float and is theirs while the
  line is out: a tap on it here casts nothing, a soft boop says so (Critters' `__fish.why()`: the partner's); a catch
  is their `catch` as ever (the plate), and the line clears. A phone that comes while a line is out hears its step
  again (its angler's phone sends it when it sees them come); an angler whose phone goes is no longer fishing, nor
  one who goes through a door with the line out (its `off` as the island goes); a line cast again elsewhere frees
  the shadow the old one was at; and back from a room, the others' villagers hold no rod till their next step. The
  guest's line too.
- **The partner's doings, played here:** when their change arrives (within 12 s of it), their villager turns to it
  where it stands (no run over, as on their phone) and it plays at the target (the net or the shovel there, a splash,
  a shake, a pick-up); a catch or a find is its plate (「うめが スズキを つかまえた！」, `world.partner.*`) in the
  bottom stack as mine are, nothing held over their head: its icon pops up from their villager when it's in view (out
  of view it comes in from the edge on their side). Heard on opening (older),
  it only changes the island.
- **First wins:** of two people tapping the same thing, the relay's first claim is it; the other phone sees it taken
  by them (their plate in the stack) and its own tap does nothing more.
- **Late and alone:** a phone opening later hears the day from the relay (and keeps it: a reload needs only what's
  new); with the relay unreachable each phone keeps its own and they catch up when it's back.

### The guest

`contract/guest.ts`, `ui-state/cast.ts`, `ui-state/viewer.ts`, `e2e/guest.spec.ts` ([backend](backend.md#the-guest),
[decisions](decisions.md#a-guest-not-a-third-member-2026-11-02)). A third person, 「おきゃくさん」: a visitor to our island,
NH's way, with its own key (pairing: [runbook §4b](ops/runbook.md#4b-the-guest)). `?demo&as=G` is its phone.

- **What it sees:** our island, the trees and their popups, the HUD menu's ベル row, ごほうび (to look at: the balance, today's ベル (the members') and the
  buys, 「ちょきんばこは ふたりの もの。」 in place of the shop, no ×; the ledger), the ずかん and
  けんこう's かつどう (whose data: either member; no からだ switch) with its goals read-only (no chip to tap). Never a からだ figure: no からだ switch, no weight or body card, no weight or body fat goal (its snapshot holds
  none: the record leaves them out). せってい: its villager and name (the same picker, its own prefs), the sound, the
  language and あそびかた; no もようがえ or つうしん, and a line saying it's visiting.
- **What it does:** walks, catches, digs, picks up and shakes like us (the shared world's claims, first wins), its
  finds and counts its own in the shared ずかん (each entry credited to its first finder, the guest's
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
  - The edge face (「うめの ほうへ」), `peer`: the other member only; on the guest's phone either
    member for `peer`, A for the edge face.
  - ふたりでぜんぶ, the goal walks, the evening meet-up and the bench gathering, the follow, the partner meeting a
    visitor: the members' own, on their own phones; the guest's phone plays none of them (A's and B's fruit still
    ripens on their trees there).
  - Ambient life (`ambient.ts`): the two members' villagers only, on every phone; the guest's villager is never in it
    (on the guest's phone A's and B's take their beats as on ours).
  - Group stretching: the members' two villagers; the guest's stands where it is.
  - Sleep: everyone, by the relay's clock; a wake is said with whose villager woke (`act wake`, `id` A, B or G).
  - High-fives: one at a time per pair, each with its `to`; the room holds the last one per (sender, recipient) pair.

### The island's layout

`layout/` (grid, catalog, model, height, nav, validate, diff), `store/layout.svelte.ts`, `scripts/layout-default.ts`
([the layout's contract](island-layout.md), decisions: *The island's layout is data on NH's tile grid*). The outdoors
is a layout anyone of us can change: NH's 30u tiles (20 × 46), each grass, sand, a path (dirt, stone, brick, plank), a
river, a pond or the sea, on cliff tiers 0–3; every tree, bush, flower, rock, lamp and piece of furniture, the bridge,
the stairs and the three homes an object on its tiles. Today's island is the default (`npm run layout:default`), its
objects on the grid near where they stood, made long (20 × 60): まえ at the front, おく at the back, and between them a
new middle, open grass for building, the stream running down its east side, the path through it, うめ's and the
guest's houses with paths to their doors. Corners are round (NH's), cliffs are steps of 40u with NH's strata, a river
stepping down a tier falls, stairs are stone steps; the 3D ground is built and baked from the layout on the phone
(world3d/terrain.ts). Each home is its owner's: its look
(いえを かえる: NH's player house or a villager's, wall, roof and door in their colours, the move-in tents, the campsite's
tent) and its room (the tent's room system: うめ's house, the guest's), anyone welcome in. On the phone the members
arrange the island's things the tent's way (layoutEdit/IslandEdit: a tray of every kind, a ghost green or red, drag a
tile at a time, turn, put away); the terrain is the desktop editor's. The members change the outdoors (the
desktop editor, then the phone); each person changes only their own home's look and room (the guest: its own house
and the tent).

### Decorating

`layoutEdit/IslandEdit.svelte`, `island/Decor.svelte`, `island/decor.ts`, `e2e/decor.spec.ts`, docs/island-layout.md
"Phone editing". Either of us puts NH's outdoor furniture on the island, moves it, turns it and takes it away; both
phones show the same island, kept for good: the decorations are the layout's objects of their kinds (the old
decorations' map, `contract/decor.ts`, moved into the layout once as `m-<id>`: layout/migrate.ts).

- **The items** (ten, NH's models): いしどうろう (stone lantern), バードバス, ガーデンワゴン, アイアンガーデンテーブル and チェア,
  レンガのいど, たぬきのおきもの, モンステラ, みちしるべ (signpost), いちりんしゃ (wheelbarrow), with the layout's other kinds in
  IslandEdit's tray tabs.
- **In:** せってい → もようがえ → はじめる (the sheet closes; no new HUD control on the island): IslandEdit over the 3D
  camera, the tent's way: a tray of every kind, a ghost green or red, a drag a tile at a time, a tap on the ground
  puts it there, ↻ まわす, ✕, 🗑, ✓ (island-layout.md "Phone editing").
- **Out of the mode** a placed item is a world thing: NH's model on the 3D island, its DOM node the tap area (its 2D
  art hidden under the model), an obstacle the walk goes round (layout/nav.ts), and a tap jiggles it where it stands
  (my villager turns to it: no walk). The partner's change, just made, puffs where it lands and their villager turns
  to it.

### The bulletin board

`components/board/`, `contract/board.ts`, `e2e/board.spec.ts` ([board.md](board.md), [backend](backend.md#events) `board`).
NH's island board (`EvtobjBbs`, its bird `BbsBirdDay` / `BbsBirdNight` on top in 3D) stands on the front beach at the lawn's
edge, by the path behind the shells' sand (clear of Gulliver's spot), facing the sea (the layout's `board` object once the layout has it: movable in the editor). A tap on
it walks my villager up beside it (the tent door's exception to "interactables act in place"), then it opens: on the 3D
island the camera dollies to its face (≈600 ms) and back to exactly where it was (the one automatic camera move, the
user's: it needs the 3D lead's `focus`, board.md), else a sheet showing the same face. The face is a canvas (the 3D
board's texture): NH's pinned notes, four a page, newest first, each with its author's villager head and name and the
date; ‹ › and a swipe page. A tap on a note reads it whole, with かきなおす (its author) and はがす (its author, or ウェイ
and うめ for anyone's: a second tap confirms). 「かきこむ」 opens a field above the keyboard: plain text, at most 4 lines and
100 characters (NH's board takes more; four short lines read at a glance on the zoomed board). A 「！」 bobs over the board
when someone else wrote since I last looked. Everyone, the guest too, writes; the record enforces who may change what.

### The tent

`routes/tent/+page.svelte`, `tent/TentRoom.svelte`, `tent/TentEdit.svelte`, `tent/engine.ts` (three.js), `tent/grid.ts`,
`tent/items.ts`, `tent/dragLink.ts`, `store/tent.svelte.ts`, `contract/tent.ts`, `ui-state/doorTransition.ts`,
`scripts/room-models.ts`, `scripts/room-surfaces.ts`, `store/where.svelte.ts`, `e2e/tent.spec.ts`, `e2e/tent-surfaces.spec.ts`, `e2e/tent-hold.spec.ts`, `e2e/sync-harness.spec.ts`. A tap on the
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
  inside (closed, offline) has its villager leave the tent 3 minutes after the relay saw it go: it comes out of the
  door and walks home ([Walking](#walking) "A phone gone a while").

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
  which picks it up) drags it a tile at a time; a tap on the floor moves it there (Holding, below); ↻ まわす turns it a quarter (about
  its middle); ✓ おく places it (greyed while red); 🗑 しまう takes a placed one back to the storage (とりけす on the banner
  for 5 s); ✕ やめる puts it back. A wallpaper or a floor is on at once. **Where:** on its whole tiles inside the room,
  off the door's two tiles, not over another piece or a villager; a rug lies under the furniture (and may cover the
  door's tiles), never over another rug. At most 40 pieces, shared (the wallpaper and the floor don't count): 64 tiles
  and the phone's draw budget.
- **Turning:** ↻ or a tap on the piece I hold turns it a quarter clockwise (a tap: under 8 px and 450 ms; a drag
  moves it), easing round.
- **Holding** (NH's decorating: one thing held at a time; `TentEdit.svelte`): with nothing held a tap or a press on a
  piece takes it up. While I hold one, the finger is for it alone: a press on it, or a near miss (its drawn shape on
  screen and 14 px round it), drags it; a tap on the floor puts it there if it may stand there, else it stays where it
  was and the spot flashes red, the bar saying why; a tap on another piece doesn't take that one (what I hold shakes
  its head, and the first three times on this phone the bar says 「いまの かぐを おいてね」), except where what I hold goes
  there (a small thing onto a table's top, a piece over a rug, a rug under a piece); a drag that starts on another
  piece turns the camera; a long press (400 ms, the finger still) on another piece puts what I hold down (where it is
  when it may stand there, else back where it was) and takes that one, with a pop, the finger dragging it on; a tap off
  the room (a wall, the dark round it) puts what I hold down. The held piece has a yellow handle over it. A tap near a
  small thing on a table (10 px round it) is the small thing, not the table.
- **Table tops** (NH's surfaces): which pieces are surfaces and which things go on them come from the ACNH spreadsheet
  (Norviah/animal-crossing's JSON; the game files have no params for it), never a hand list. NH's rules: a piece with
  the spreadsheet's `surface` = true holds things (Housewares: tables, low tables, desks, counters, kitchens, chests,
  dressers, wardrobes, low and open shelves, the bookshelves flagged, TV stands, stools, the fireplace; a few
  Miscellaneous too: the cardboard box, the record box); a piece without it holds nothing however flat it looks (the
  wooden bookshelf, the bamboo shelf, the vanities, the dining tables a few are). Only Miscellaneous things go on a
  surface (lamps, the kettle, the tea set, a 2 × 1 one like the 50-inch TV on two tiles), one a tile, on its TOP only
  (no inner shelves: NH has none), never on a thing that's itself on a table. Wall-mounted things are never surfaces
  (the spreadsheet's Wall-mounted sheet has no surface column; NH's wall shelves hold nothing). 60 of the pieces here
  (12 of the starter set) are surfaces, 126 small. **The top** is found from each surface's converted model, not its
  bounds (`scripts/room-surfaces.ts`, `npm run room-models -- --surfaces`): rays straight down every half unit over
  the footprint; the highest flat level that covers enough of it is the top (a vase or tool standing on it is no
  level: the log shelves' top is 7.4, its bounds 11; the tool shelf's 18.8, not 23.1), a tile holds a thing where the
  top covers its middle (the throwback hat table's brim and the open-frame kitchen's sink hold none), and a top
  that's a roof over a working level open in front and clear above (the system kitchen's cabinets over its counter, the
  loft bed over its desk) has its things on that level. items.json keeps each one's `sy` (height), `st` (the top's
  rectangle) and `sl` (its tiles that hold); a thing stands at `sy`, its middle kept on the rectangle. A small thing
  held over a surface goes on it (dragged over a tall one, it follows the finger on the top); its op names the piece
  (`on`) and its slot there, so moving or turning the table carries what's on it (the ghost carries them) in one op.
  NH's rule for putting away: not with things on it (「うえの ものを さきに しまってね」). A thing on a table blocks neither
  the floor nor a walk. A race (one of us puts the table away as the other puts a lamp on it) leaves the lamp on the
  floor at its slot's tile, the same on both phones.
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
- **Phrases** (as on the island, [Villager taps](#villager-taps)): the island's say button at the room's bottom right,
  just above the foot's buttons (いえを かえる and もようがえ fill the foot's width), in the tent and every home, the guest's
  too; hidden in もようがえ, under a sheet and ハニワくん's letter. The same picker above it; a tap on the room while it's
  open only closes it (nobody walks). The phrase shows in the island's balloon (`island/Says.svelte`) over the speaker's
  villager in the room, by its head as the room's camera sees it (the tent engine's `headPoint(who)`: the top of its
  card for now, the 3D model's head bone once switched), by the island's placement rule (never over the room's
  controls); it follows a walk, steps aside while the camera turns, 4 s, a newer one replacing it. It goes out as
  `say {text, sc}` with the room's scope (`t` the tent, `u` うめ's, `v` the guest's) and shows only on a phone whose
  villager is in that room; one said on the island (no `sc`) only on the island (one place at a time). `e2e/say-rooms.spec.ts`.
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
docs/backend.md "Ambient life"): the sea holds a shadow or, 1 turn in 4, bubbles most of the time, each fresh water
(the pond, the river, its mouth, the clifftop) its own shadow most of the time too ([Pond](#pond)), and a bug comes by every so often, each of the same kind and species on both phones and
leaving at the same boundary. **Where it is, is the world's** ([Shared world](#shared-world)): its seed picks the swim
patch (a pond's on the island's ponds, painted or put down), the trunk, the flower head or the patch of grass, and every glide, hop, dart, rest and landing
at its time after it came (`critterPath.ts`), so both phones have it at the same spot doing the same thing, and a phone
opening mid-stay finds it where the other shows it; each phone shows it when its camera sees that spot (covered or
hidden, the critters leave; back, those still staying are there); ≤ 1 in each water and 1 bug. A catch or an escape
is shared by the critter's id (first wins): it's gone on both phones, and on the partner's their villager turns to it
and it's netted, reeled in, dived for or dug there, its plate in the stack. A bug out of a shaken bush, from under the rock or off my
villager is put on the island for both (`put`), its moves from its id. **Seasons are a flavour, not a gate:** any species in any month, 3× likelier in its NH
northern-hemisphere months; hours still hold.

- **Fishing** (the sea in front of the beach, seen from まえ, or a fresh water: `critters.ts` `Water`): a shadow (NH
  sizes 1–6) dawdles there. A tap near it casts a bobber, the line from the bank in front of it (my villager turns to
  it where it stands): a tap on a shadow as drawn (its body and a finger round it, the drawn coast past the water's
  tiles included), on its water within CAST_U, or on another water within NEAR_U (the river by its mouth, the sea at
  the mouth, the falls' pool and the river below: one water to the eye), the bobber in the shadow's own water nearest
  the tap; the nearest shadow on screen wins (`e2e/fishing-taps.spec.ts`); the fish closes in over 2–3 darts, nibbles
  1–3 times (each a small dip and a ring: it's coming), then bites: the bobber is yanked under with a splash, a small
  「！」 pops over it (on the 3D island over my villager's head: docs/world3d-assets.md "Fishing"), and a tap anywhere in the next 1.6 s
  catches it. The first early tap makes it hesitate; a second scares it off. 1 in 14 a boot, tire or can.
  On the 3D island (`island/glide.ts`, `world3d/things.ts`) nothing pops: a shadow or a bug fades in (0.6 s, a slight
  scale-up) where it comes and out where it goes; they move by the 2D's own curves, smooth from wherever they are,
  turning as they go; my cast's fish turns to the float, each nibble its nose bumping the float with the float's dip,
  the bite a lunge onto it; scared, it turns tail and darts off with a quick tail wiggle, fading as it goes
  (`e2e/critters3d.spec.ts`).
- **Fish** (all 34 of NH's sea and pier fish, `FISH`): NH's shadows by size (20–64u, the eels long and thin; a fin for
  the sharks, the ocean sunfish and the suckerfish); the coelacanth only in rain or snow.
- **Bugs** (74 of NH's 80, `BUGS`), each where NH keeps it: butterflies and moths in flight and landing on the flowers
  (the moth round the lamps); the ladybug and mantises on a flower's head; dragonflies and fireflies near water;
  cicadas, beetles and the walking stick on the oaks' and cedars' trunks (NH's stump bugs too: the island has no
  stumps); NH's palm beetles on the palms (the cyclommatus and golden stags, the horned atlas and elephant, the goliath
  beetle); grasshoppers, crickets, the pill bug
  and the centipede in the grass; the hermit crab and the wharf roach on the beach; the mole cricket under a chirping
  mound (a tap digs it up); the tarantula and the scorpion at night, gentle: the first tap makes one rear up (on the
  3D island its front lifts under NH's 「！」 till it settles), a second while reared makes it charge off, and once it
  settles a tap nets it; a flea hops off my villager 1 in 10 taps
  (Apr–Nov); the pondskater, diving beetle and giant water bug on the pond and the river's still reach. A tap nets one,
  judged where the 3D island draws it (its model's spot, not its invisible sprite's: a percher flying in to its trunk
  is 30–110 px off its sprite), even over my villager, a canopy or a door in front of which it flies (`e2e/bug-taps.spec.ts`);
  within 80px it startles away (on both phones). A bug a dev hook brings keeps clear of every control; one of ambient
  life's sits where its seed puts it (a tap on it comes first, before a control under it). Left out: the blue weevil beetle, the giraffe stag
  and the horned hercules (no icons), the dung beetle, the ant and the fly
  ([decisions.md](decisions.md#the-rest-of-nhs-bugs-what-the-island-can-hold)).
- **Diving** (`island/sea.ts`, NH's 40 sea creatures, loaded with the first bubble spot; `e2e/dive.spec.ts`): 1 turn in
  4 the sea holds a spot of bubbles instead of a shadow (gone after 30 s). A tap dives: still and slow creatures are
  caught at once; a medium one half the time, else, like a fast one, its shadow darts off and a second tap on it in
  time (1.6 / 1.3 / 1.0 s) catches it; a very fast one gets clean away 1 time in 3. 1 spot in 25 is a pearl (a shell
  in the ずかん).
- **The catch:** the official icon pops out of the catch onto a plate with NH's catch line (`island/catchLines.ts`:
  English from Nookipedia, Japanese from the game), loaded with the first critter. Every catch's and find's plate
  (fish, bugs, sea creatures, shells, fossils, a dig, a bottle, fragments, mushrooms, a tree's bugs and coconut, a
  balloon present, the partner's and the guest's) goes in one stack at the bottom centre (`island/catchStack.svelte.ts`,
  `island/CatchStack.svelte`): above the home indicator and しずえ's box, clear of the say button (its room kept on
  both sides) and over the partner's edge face. The newest enters at the bottom and the older slide up; each fades out
  on its own timer (the pager's) or a tap, and the ones above slide down into its room. At most 3 show: a fourth
  fades the oldest out early. Reduced motion: no slide, a quick fade. The plate is the whole of it: nothing is held up
  over a villager's head (the stack says it, its icon from the catch).
- **Cost:** each critter is a world node; it moves by CSS transitions inside it between waypoints a timer picks (no
  rAF), one wing or fin loop each; one timer between visits; art on first need. World cues `scene-<kind>`, quiet and jittered ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`, `island/sceneDay.ts`, `e2e/finds.spec.ts`. The day's items derive from the
Tokyo date and time plus a seed, so both phones agree; what either of us picks up, digs or opens is gone on both
([Shared world](#shared-world): a `pick`, claimed at the tap, first wins; this phone keeps its own in `scene-day` too),
the next dig spot is the same on both, and on the other phone our villager turns to it, it's picked up (or dug) where
it lies, its plate in the bottom stack (nothing held over the head). The first of each shell, fossil and fragment is a ずかん `find`, written when it's picked up (and still ours).

- **Seashells** (NH's eight; the summer shell rare, likelier June–September): one washes up every 60–120 s, the newest
  three lie on the sand. A tap picks it up: 「タカラガイを ひろった！」.
- **Washing in** (the user, 2026-11-03: "instead of suddenly appearing, can we animate them fading in and moving up
  the beach like they're being swept up onto the beach"; `layout/swash.ts`): a shell, the bottle or a fragment that
  turns up while the island is open waits for the next wave at its stretch of the coast ([The sea's wash](#world)),
  then rides it in: from just past the waterline straight up the beach (the shore's normal, from the land field) to
  where it lies, ~1–1.5 s easing out, fading in (its model's own opacity, things.ts; its tap area moves with it).
  What lies there as the island opens just lies; reduced motion: it fades in where it lies. Taking it is as ever.
  `?find=washed`: a bottle washes in 1.5 s after the island opens (`e2e/finds.spec.ts`).
- **Where things lie** (`beachSpot`): shells, fragments and the bottle keep 34u apart (`BEACH_GAP`), each taking a
  spot that far from everything there in a seeded order; worked out once per date and seed, so nothing moves.
- **Fossils** (all 73 of NH's: the standalone ones and every dinosaur piece, `FOSSIL_SETS`): NH's star-shaped dig
  spot, 2–4 at a time on six lawn spots (`world.ts` `DIG_SPOTS`: four on the front lawn, two behind the trees), each
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
  A tree's present is the same put, by its tree's id ([Shaking a tree](#shaking-a-tree)).

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

### Zukan

`kiroku/Zukan.svelte`, `kiroku/ZukanCard.svelte`, `kiroku/zukan.ts`, `model/finds.ts`, `model/tally.ts`,
`e2e/zukan.spec.ts`. The ずかん is its own sheet (`kiroku/ZukanSheet.svelte`: the HUD menu's ずかん pill, grown out of it,
Sheet's `pop`): first one row per kind with how many either of us has found (`ZukanCard`), a row → that kind's page
with ‹; the next opening starts on the rows. Shared (the first `find` of either of us): さかな 80 (the sea's 34 and the pond's
46), むし 74, うみのさち 40, かせき 73 (laid out like NH's museum: the standalone ones, then each dinosaur with
「Tレックス 1 / 3」), かいがら 9 (the pearl last), and a balloon's presents: カタログ 1,836 (by NH's categories: かぐ,
こもの, かべかけ, てんじょう, トップス... かさ) and レシピ 126 (by season). Every catch and pick-up counts: each found tile shows
「×12」 and the picked entry's head the total and each of us (the day tallies, `tally`, backend.md#tally); a find from
before the tallies counts 1. カタログ and レシピ load their names with the page (`i18n/catalog.ts`, the language on screen)
and build their grid a slice per frame, as the むらびと picker. A kind's page: every entry in the game's order, the official icon and name for found ones, a silhouette and
？？？ for the rest, 「コンプリート！」 when all are in. The page's head is pinned: the kind and its count, and the picked
entry (icon, name, 「7/4 ウェイが 見つけた」 and NH's catch line, two lines, ▼ for more); the grid scrolls under it.
Names of everything catchable live in their own catalog (`i18n/catch.ts`), loaded with the ずかん or the first catch.

### The museum

`museum/` (`MuseumRoom.svelte`, `engine.ts`, `plan.ts`, `species.ts`, `exhibits.ts`, `MuseumCard.svelte`),
`routes/museum`, `layout/buildings.ts`, `e2e/museum.spec.ts`. NH's museum (はくぶつかん) is a building on the layout
(docs/island-layout.md "The island's buildings"): NH's own model (StrcMuseumA02, the built-up museum with its banners),
7 × 4 tiles, one to an island, at the back on the clifftop behind the campsite by default; the members move and turn it
in the editor and on the phone's もようがえ, never take it away. A tap on it walks my villager up to its door and goes in
(the door's iris, as a home's) to its own screen; ‹ 島へ or the doormat comes back out, just out of its door.

- **Inside** (plan.ts, model units, the rooms' scale: a tile 10, a villager 16): one floor, NH's layout: the entrance
  hall in the middle (NH's lobby: its marble floor, its stone walls with a gold cornice, the red carpets from the door to
  the owl's medallion and on to each wing, pillars at the openings, red banners, Blathers at his desk, NH's model), the
  bug wing to the left (こんちゅう), the aquarium to the right (さかな), each through an opening in the hall's side wall.
  NH's own museum floors and walls (scripts/world3d-models.ts `--museum`: static/room/museum/tex/), lit warm; a little
  dimmer at night.
- **No surfaces fighting:** no two faces share a plane. The walls' slabs meet at each joint with one running over its
  square (the tallest, the one in its own line first) and the others stopping at it (plan.ts wallEnds), the cornice the
  same; what lies flat on another (the carpets, the medallion, the doormat, the shadows, the garden's paths, soil and
  pond, a tank's caustics) is drawn a layer over it in depth (geometry.ts decal: polygonOffset); the glass of the tanks
  and the cases is open below (its floor the sand's or the soil's top); the garden's paths one mesh in the world's
  tiling, its pieces never overlapping. The depth range is the museum's only: the near plane just over its tallest top
  (the cornice), the far one past its farthest corner (at the default view ~40× the precision of a fixed near of 4).
- **Like the rooms:** a tap on the floor walks my villager there (plan.ts walkPath: a half-tile grid, A* with its corners
  pulled straight, round the walls and what stands on the floor); a drag turns the camera, a pinch zooms, ⌂ puts it
  back; the camera is NH's room view following my villager through the rooms (kept over the floors near the door), the
  walls between it and my villager cut away. The say button says a phrase in here only (`say` `sc: 'm'`).
- **Who else is in:** the rooms' presence, the museum's own scope (`tent` with `sc: 'm'`, its points within the
  museum's ±320; live-protocol.ts): the others' villagers are here while they are, walking as they walk, and nowhere on
  the island meanwhile (store/where.svelte.ts `home` `M`). The guest comes in like anyone.
- **What's on show** (species.ts): one of each fish and bug in the ずかん's first finds (anyone's, the guest's too), as
  it's found; nothing else (the guest visits too, and its finds are on show under its name). The ずかん's alone, never the
  pockets': selling every one caught takes nothing out (NH's donation, not a catch kept). A tap on one: its card (MuseumCard: NH's icon, its Japanese and English names, 「7/4 ウェイが
  見つけた」, ×n from the tallies as the ずかん counts).
- **The aquarium** (`aquarium.ts`, `tanks.ts`, `boids.ts`): NH's grouping (species.ts tankOf): the great sea tank along
  the back wall (the sea's middling and big fish, the rays and sharks: a whale shark scaled to it), the deep-sea tank
  on the far wall (dark: the oarfish, the coelacanth, the barreleye, the football fish, the squid, the sea butterfly),
  the river tank as an island in the middle (the fresh water's middling and big fish, the turtles), sixteen small tanks
  on their stands by the front in two rows of eight, one or two little fish each, four tanks to each group (the pond's,
  the stream's, the tropical, the reef's; drawn a little bigger), each with NH's own props (kelp on its rocks, coral, the deep's dark rocks, the river's stones,
  logs and water plants, NH's diver and little submarine in the great tank). Each species found swims in its tank, one of
  each (NH's), boid-like: its own slow wandering heading, mostly along its tank's long side,
  turned off the glass before it, off the others' bodies, its body always in the water; facing its way, its tail
  swaying (the vertex shader: one program for every fish). The bottom walkers share a small tank and walk its sand
  (boids.ts stepWalker: a walk to a spot, a rest, keeping off each other's way): the mitten crab sideways, its claws
  forward, the crawfish ahead (NH's). The water is one shader (NH's blue to its depth, caustics
  shimmering on its back and floor, rays from the surface), its glass tinted its water's colour, its bubbles one Points
  risen in the shader. A species is one InstancedMesh, culled by its tank's bounds; a tank off screen rests; nothing
  allocated in a frame.
- **The bug wing** (`garden.ts`): NH's garden under glass (its sky and palms on the walls, dusk-blue at night): stone
  paths, a pond, NH's oaks and a palm (the island's models), NH's flowers in rows, the museum's own garden props
  (flower beds, bushes, a fallen log with its autumn leaves, ferns, cacti, the mangroves), and five glass display
  cases on stands along the back. Each bug found lives there as it lives (species.ts habitatOf, from island/critters.ts):
  a butterfly, a moth or a bee flies a slow path round a flower bed, its wings beating (the vertex shader); a dragonfly
  hovers over the pond and darts to another spot; a firefly drifts over it, glowing (brighter at night); a ladybug, a
  mantis or a stink bug sits on a bloom; a grasshopper or a cricket hops in the grass; a cicada, a stag or a beetle
  clings to an oak's trunk head up (the palm beetles to the palm); the snail and the walking leaf creep on the bushes;
  the tiger beetle and the dung beetle crawl the soil by the log; the pondskater and the diving beetle glide on the
  pond; the tarantula, the scorpion, the centipede, the beach's crawlers (the hermit crab sideways) and the mole
  cricket walk the soil of a case;
  the bagworm and the spider hang from an oak's branch on their threads. Drawn a little bigger than NH's (1.9×, the
  island's way), one InstancedMesh a species, placed each frame where it is, culled by its own bounds.
- **Performance:** the wings' exhibits are built only once the finds are in (exhibits.ts: a wing rebuilt only when its
  own list changes), their models loaded per species (the museum chunk, its props and textures under /room/: cached on
  first use); every frame moves only the tanks and bugs on screen (each culled by its own bounds, so the hall draws no
  wing's fish or bugs); 60 a second while something moves (a walk, the camera), the exhibits' 30 while only they do,
  nothing while nothing on screen does (the hall at rest: none). The tanks' and the cases' stands, bases, water, glass
  and frames are one mesh a material (geometry.ts batcher). Measured on the iOS Simulator (`npm run ios:indoor`, a
  museum with every fish and bug): the hall at rest 30 → 0 frames a second, 258 → 93 draw calls; the aquarium 335 →
  170, the bug wing 250 → 84; the way in's longest frame 301 → 79 ms. Once everything is in, what isn't on screen yet
  is made ready while the hall is still (its textures up eight at a time, its programs compiled: engine.ts warm), so a
  wing's first sight is no hitch (walking into the aquarium: its longest frame ~100 → 36 ms); the cost, every wing's
  textures on the GPU whether visited or not (~300 small ones, a few MB).
- No music of its own: the app has no NH museum track (NH's museum is quiet ambience); the island's hour plays on.

### The shop

`shop/ShopRoom.svelte`, `routes/shop`, `contract/shop.ts`, `contract/shopPrices.ts` (`npm run shop:prices`),
`model/shop.ts`, `store/actions.ts` (sell, buyPiece), `e2e/shop.spec.ts`. NH's Nook's Cranny (タヌキ商店) with its own
money, かいがら (shells, NH's cowrie for its mark), never ベル ([decisions](decisions.md#the-shops-かいがら-2026-11-04)):
the island's catches sell for them and buy furniture for the rooms. Each person's own pocket and かいがら, the guest's
too.

- **Inside:** a screen, not a 3D room (decisions: the shop is a counter, its work lists and prices; a walking room adds
  nothing to them and would cost another three.js scene on the phone): honey wood walls, the green sign, a window (the
  sky's: day blue, night navy with a star), NH's render of まめきち and つぶきち (Timmy and Tommy) behind a wooden counter
  with its register, their line in a cream balloon on the counter (「いらっしゃいませだも〜！」, the offer, 「まいど
  ありがとうだも〜！」, 「かいがらが たりないだも…」…), and under it NH's counter menu, a fixed-cream panel (ink, at every
  time of day). At dusk and night the wood warms under a lamp's glow. My かいがら top right; ‹ 島へ top left goes back out
  (just out of the shop's door).
- **うる** (sell): my pocket, each fish, bug and sea creature I caught (my day tallies, model/tally.ts) less what I sold,
  dearest first: its icon, name, price and ×n. A tap picks one more (past the pocket: none again), − one less, ぜんぶ all;
  the bar says 「3こで 120 かいがら」 and うる sells them (one `sell` a species). Selling never takes a species out of the
  ずかん or the museum. Shells, fossils and presents don't sell.
- **かう** (buy): today's stock (きょうの しなもの: 8 pieces of NH furniture a Tokyo day, the same on every phone, from the
  date alone) and the basics always (いつもの: a cardboard box, a zen cushion, a mini cactus set), each with its NH icon,
  name and price; one picked, かう buys it. A piece I own says もってる; too dear or owned, かう boops and the twins say
  why. A bought piece is mine for good in もようがえ (TentEdit's かった tab, and the かべかけ tab for a wall piece) in
  every room I arrange.
- A sell or a buy shows at once with もとに戻す for 5 s (the banner up over the counter here, clear of the bar), then
  goes to the record, which checks it (the pocket, the wallet, the stock, the price: [backend](backend.md#events)).
- **Prices:** a catch NH's Bells ÷ 100 (a sea bass 4, a koi 40, a whale shark 130), a piece NH's ÷ 20 (a median piece
  110: about a day's catches).
- **The building:** NH's Nook's Cranny with its タヌキ商店 sign, 7 × 4, one to an island, moved and turned in the editor
  and もようがえ, never deleted ([island-layout.md](island-layout.md#the-islands-buildings)); a tap walks up to its door
  and goes in, ‹ 島へ comes out of it. It is the only way in: the leaf's menu has no かいがら row (one goes to the shop
  to buy and sell, as in NH).

### Dialogue

`island/pager.ts`, `island/Talk.svelte`, `island/Plate.svelte`, `e2e/dialogue.spec.ts`. The speech balloon and the catch
plate read like NH's box: 33 ms a glyph, two lines a page (split at the text's line breaks). A tap finishes the page,
the next turns it, the last closes it; an orange ▼ bobs while another page follows. Left alone a page turns after 6 s
and the last closes after a read's length. The balloon's name tag is tilted on its top-left in the speaker's NH
colour. No voices. Multi-page: some villager lines go on (`<key>.more`), a visitor's first tap is their introduction,
a first find adds 「ずかんに のったよ！」. A line may end on NH's answers (Jack, K.K.).

Where it stands, one rule for every speaker (my villager, the visitors; `placement.ts` `placeBy`,
`e2e/bubbles.spec.ts`): by the speaker, its tail pointing at them, at most 40px off: above the head when there's room,
else beside it, else below the feet, sliding along so the tail still reaches. Room gives way step by step, nearness
doesn't: clear of every control, else over the museum (both within 16px); else over the island's things (trees, fruit
rows) but not the villagers; else over them too. Never over the HUD, しずえ's box, a popup or another overlay, the
speaker, or off the scene. It follows a speaker who moves (a move lasting 0.6 s) and closes if they go. Captions
(`place`: the wish, K.K.'s caption) keep clear of every control, nearest first; the catch plates stand in their stack
at the bottom centre ([Critters](#critters) "The catch"). Every balloon,
plate and caption keeps 12px (`EDGE`) from the screen's sides and foot, above the home indicator. The catch plate is one
plate for every discovery (catches, finds, a present, its first-find page): the icon at its start, two lines a page, the
▼ in its own room at the right; the captions (the wish, K.K.'s song, Gulliver's sleep talk) share one pill
(`.if-caption`: the plate's colours, 13px).

### Villager taps

A tap on my villager is a squish and the tap sound (R9; no ♪; seated, it squishes where it sits, as in the tent), and in NH's flea months now and then a flea hops off
it ([Critters](#critters)); nothing opens. The say button at the scene's bottom right ([Island](#island): 「ひとこと いう」)
opens the phrase picker above it (`island/SayButton.svelte`, `island/SayPicker.svelte`, `island/say.ts`,
`e2e/say.spec.ts`), never a sheet. The picker is a small cream card in the reactions wheel's spirit, standing above the
button, its right edge at the button's (inside the screen; above the keyboard while one is up; outside the scroller, so its
field never scrolls the island): 「なにを いう？」 and ✕, my own last four, newest first (kept on this phone,
`island.says`; a quick pick said again goes first; a list kept when it was three reads as it is), and 「じぶんで かく…」:
a field of at most 20 characters (cut only when the IME isn't composing; a counter), もどる and いう; Enter sends. No
presets: only my own words (the user: "get rid of all the default messages. only custom messages"). With nothing kept
yet it opens straight on the field (no lone button, no もどる; ✕ closes). Every target ≥ 44px. ✕, Esc or a tap elsewhere closes it, as a tree's popup: on the ground that tap
only closes (nobody walks), on a control it still acts (the flea is netted), on the button it only closes; ✕ and Esc
give the focus back to the button. My villager stays put while it's open. A pick
closes it, hops my villager and shows the phrase in its balloon for 4 s (`island/Says.svelte`: Talk's cream balloon,
the name on a tag in the person's colour, its tail at the villager, clear of its emote and the other villager's; it
follows a walk, steps aside while the camera moves; text, never markup; taps go through it). A newer phrase replaces
it. On the partner's phone the same balloon shows over my villager there, which hops too (the relay's `say`, presence
only: a phone that is closed simply never sees it, one opening later doesn't either; at most one per 1.5 s, the newer
waiting). No sound beyond the UI cues, no ベル. The speech balloon (`island/Talk.svelte`) is for the island's other
speakers: the visitors. One balloon at a time.

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
they're on screen): my villager turns to them where it stands, then their introduction the first time, then one of their lines No trading, no ベル.

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

- **All day:** NH's pumpkins on the lawn (`Halloween.svelte`'s `SPOTS`, each only where clear of every control).
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
goes for the day. On the island's layout the deck is a fixed piece there every day, NH's boom box at the villagers'
scale (about half a villager tall): on its day a tap plays the tape (the 3D villagers do NH's three: villager3d poses
`warmup`, `sidebend`, `jump`); any other time a tap says when it plays, or that today's is done, and no ♪ floats.

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
  the bubbles, the water, the tape deck, a building, a visitor, the partner) acts in place (the exceptions: the tent's
  door, the board, and a seat, walked up to and sat or lain on: [World](#world), "Sitting on a tap"): my villager turns to it
  where it stands and the action plays at the target, its tool there (NH's floating can, shovel and net; a cast's line
  from the bank). A catch or a find is its plate in the bottom stack; my villager stays where it stood. A flea is tapped off my
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
- **No hold-up:** a catch or a find lifts nothing over a villager's head and plays no pose (the bottom stack's plate,
  its icon popping up from where it happened, says it: [Critters](#critters)).
- **A phone gone a while:** 3 minutes after the relay saw a member's phone go (the app closed or hidden, offline), their
  villager walks home to its spot by its own tree at a stroll, on every phone the same (a phone opening later finds it
  where that walk has it, or home), then lives there as any (idle beats, dozing at night: it gets up for the walk and
  dozes again at home). Back within the 3 minutes, nothing happens; back mid-walk, their phone picks it up where it
  is and walks the rest. Not the guest's: it leaves with its app (villagerSync.ts, [decisions](decisions.md)).
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
  HUD, plate, dialogue and choices stay cream/yellow.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard from
`visualViewport` (`ui/keyboardInset.svelte.ts`: the `keyboardInset` store, the visible part above it, for any text
field; `withKeyboardInset` sets `--kb`; never `innerHeight`, which iOS shrinks with the keyboard). Short screens scale the island down. Check at 393×852, 375×667 and
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
