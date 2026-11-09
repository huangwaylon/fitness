# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md), performance budgets and the backlog in [ops/perf.md](ops/perf.md). Numbers come from
`app/src/lib/config/rules.ts`, which wins if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch, plus an optional guest ([The guest](#the-guest)). Their activity, measured automatically, grows fruit and
earns **ベル** (play money, a stamp card: +1 per daily goal) into one shared wallet, spent on two treats: おやつ and
外食. Japanese first, English per person.

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  weight, body fat %, BMI, lean body mass) several times a day. **Apple Health is the source of truth:** no health
  number is entered or fixed in the app ([Health data](#health-data)).
- **Data out:** the PWA (SvelteKit, static on Cloudflare Pages) fetches the raw rows from the relay and computes every
  number on the phone (`lib/model/`, pure functions).
- **Principles:** zero required taps a day; both people see all data; no notifications (the app is opened by choice);
  everything always animates (no reduced-motion variants, but where noted).

Modules: `contract/` (shared with the relay) · `config/rules.ts` · `scoring/` · `model/` · `sync/` · `store/` ·
`ui-state/` · `sound/` · `components/`, `routes/`. `deps.test.ts` enforces the import direction. Shared helpers:
lazy chunks load through one helper (`ui-state/reload.ts` `lazy`, used by `lazyComponent` and `lazySheet`), failures a
caller goes on without go through `quiet()` (`lib/quiet.ts`, counted in IslandLog), easing and clamping are
`lib/math.ts`'s, a static file's run-time URL is `staticUrl()`, and the synced last-writer-wins maps (decor, tent,
layout) share the `Synced` base (`store/synced.svelte.ts`).

## Simplicity rules

- No app tab bar: 島 (the island), the health popup (tap the dumbbell: 健康 and ごはん, its two tabs), and behind the
  HUD menu's leaf the panel for the ベル (ごほうび), りょこう ([Trips](#trips)), けっこんしき ([wedding.md](wedding.md)),
  トレイル ([hiking.md](hiking.md)), ききみみ ([kikimimi.md](kikimimi.md)) and せってい (the ずかん its last row), each its
  own sheet.
- One focal point per screen (島: the island itself, the sky clean; ごほうび: the balance, today's ベル under it).
- A number is shown in full in one place; elsewhere it is only a doorway to it.
- Per screen at most 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card; one しずえ line (≤ 16
  characters), only with news. (The trip guides are the one exception: [Trips](#trips).)

## Screens

### Island

Top to bottom: the HUD row (one cluster in the sky's top-right corner: the health button and the menu's leaf); a sync
chip only when sync isn't ok; the scene; しずえ's box only with news; the say button at the bottom right. The island is
in 3D under them ([World](#world)): one finger scrolls it from まえ (home, the health lawn) back to おく, two pinch the
zoom, a tap on empty ground walks my villager there.

- **Trees:** one per person, today's four fruits in the canopy ([Trees](#trees)). A tap opens a popup, one grid
  (icon · ✓ · amount · がんばり, every edge lined up): per goal (🍎 steps first, then Move, Exercise, Stand) today's
  amount against the goal (「14,164 / 8,000歩」), ✓ once met and a yuzu 「がんばり」 chip at 1.5× ([Goals](#goals)). Until
  then each holds its place faintly (a dashed ring, a dashed ghost chip, gone once the day's がんばり cap is paid). Under
  the goals one ごはん row, 朝 / 昼 / 夜, each ✓ once that person's meal log has anything in that meal today (a いつもの
  too; おやつ never counts: `island/mealChecks.ts`), and one button: 「きろく」 on my own tree, 「みる」 on anyone else's,
  opening the health popup on ごはん, today, on that person's day (`health/open.svelte.ts` askFood: the sheet a `lazySheet`, the ask its `show` arg). Then the ledger, all
  three lines, a zero faint: 「もくひょう +3」, 「がんばり +1」 (「がんばり（上限 2） +2」 at three or four) and the person's
  total 「うめの きょう +6 ベル」; then ふたりでぜんぶ (「あと 2つ」 or 「ふたりで ぜんぶ！ +2 ふたりに」), outside either total.
  The last line says when that person's data last arrived (「15:24 に とどいた」), with a dot once over 6 hours old.
- **HUD row:** [the health button] [the menu], right-aligned in the top-right corner at `--hud-top` (10px under the
  safe area, clear of iOS 27's top-edge blur), 6px apart. No jar, no meal button and no ribbon in the sky (NH's island
  view keeps its sky clear; its left third stays free for the sun and moon). Every target ≥ 44px; no View Transition.
- **Menu** (`island/HudMenu.svelte`, `e2e/hud-menu.spec.ts`), the single home of the menu's order: a 44px cream disc (the dumbbell pill's height)
  in a 44px target with NH's leaf mark drawn inline; `aria-expanded`, `aria-controls`. Folded by default. A tap unfolds
  it: the disc turns yellow, the leaf tips (−40°) and six cream pills show at once, right-aligned under the leaf, the
  same width, each 44px tall, its name then its icon or number:
  1. **ベル 121** (the balance in the number font: the number is the picture) → [the panel](#panel), ごほうび. Its label
     carries today's ベル for a screen reader.
  2. **旅行** (Orville's head) → [りょこう](#trips)
  3. **結婚式** (Harvey's head) → けっこんしき
  4. **トレイル** (a mountain) → トレイル
  5. **英語** (しずえ's head) → [ききみみ クイズ](#ききみみ-クイズ) (「誘われています！」 under its name, and a coral dot on
     the folded leaf, while someone's invite is live)
  6. **設定** (a gear) → [設定](#settings)

  Labels are kanji ([Copy](#copy)). No "+N" badge on the leaf (it reads as a notification). It folds back (160ms) on a
  second tap of the leaf, a tap elsewhere (which still does what it would), Esc, any sheet opening, and a pick (its
  sheet opens at once; on close, focus returns to the leaf). Folded, the pills are `visibility: hidden` and `inert`; the
  column is out of the row's flow, so the HUD's box (`.ribbon-wrap`, which the 3D island measures) stays the row. Why:
  a game's few corner objects with a drawer, HIG (one cluster, ≥ 44pt, a disclosure with `aria-expanded`, labels beside
  icons), focus order = reading order; down, not left, to keep the sky's middle clear.
- **Health button** (`island/HudHealth.svelte`): a cream pill 44px tall, 60px wide, NH's red dumbbell across it, no
  number. Tap → the villagers glance up and the health popup opens at once (`health/HealthSheet.svelte`, Sheet's `pop`)
  on the tab shown last: [健康](#kenkou) or [ごはん](#gohan) (`ui/TabBar` at its foot; `healthLast.ts`). One kept sheet,
  one chunk; ごはん mounts the first time its tab shows and stays, so its pictures and catalogue never load for 健康 alone.
- **Coins** (`island/HudCoins.svelte`): each newly met goal flies up as a +1 coin from its fruit into the leaf (+2 with
  its がんばり; `CoinFlow`), the leaf squashing as each lands (the menu open: into the ベル row's number); the number
  holds while coins fly (`coinsInFlight`) and counts up as each lands. Today's ベル so far pop up under the leaf in a
  small yuzu bubble (「+3」), hold ~1 s and fade; only landing coins flash it, never a refund. All of it waits while
  something covers the scene.
- **Centre stage:** the plaza (`world.ts` `CENTRE_STAGE`, ひろば: `layout/spots.ts` `stageOf`), where visitors stand.
- **Villagers:** a tap on mine is a squish; a tap on the partner's is a high-five ([Villager taps](#villager-taps)).
- **Say button** (`island/SayButton.svelte`): a round cream button at the scene's bottom right, NH's chat glyph, 36px
  in a 44px target. It opens the phrase picker (a phrase shows over my villager on every phone). Hidden under a sheet,
  the panel, the harvest and a tree's popup. The guest, the tent and the homes have it too ([The tent](#the-tent)
  "Phrases"). Nothing else lives at the bottom right.
- Controls are real buttons with `aria-label`, ≥ 44px (villagers 64px); focus order = visual order.

### Wallet

ごほうび, the island panel (`wallet/Wallet.svelte`, `wallet/Shop.svelte`), top to bottom:

- **The header row:** the jar (`Jar.svelte`, filling as the wallet grows: `walletFill`); beside it the balance, big,
  and under it today's ベル in a soft yuzu pill (「今日のベル +6」: both of us, がんばり and ふたりでぜんぶ included), at 0 a
  faint one (shown, so nothing jumps when the first coin lands).
- **The rewards:** two tiles with NH item art, name and price: 🍦 おやつ 40 ベル and 🍜 外食 70 ベル. One the wallet can't
  cover is sunk. A small ⓘ at each tile's corner shows what counts as that reward in a cream speech bubble as wide as
  both tiles; ⓘ again, a tap elsewhere or Esc folds it. 買う！ asks first, applies at once and waits 5 s with 取り消す
  before it is sent.
- **貯めたベル:** the ベル ledger ([Kiroku](#kiroku)); a day pushes a level.
- **買い物の記録** (`wallet/Purchases.svelte`), folded by default behind a 44px disclosure (「買い物の記録 3件」); the
  buys newest first (art, name, day, who, price), ten at a time (「もっと見る」). 🗑 on any line (either of us, any buy)
  asks first, then sends a `spend_void`; the ベル go back and the banner carries 取り消す for 5 s. The old `/jar` page
  redirects to the island with the panel open (`?panel=rewards`).

### Panel

The menu's ベル row opens the island panel at once, full height (`panel/IslandPanel.svelte`): title 「ごほうび」, no tabs,
[the wallet](#wallet). Every opening starts at its top; its own chunk, loaded on the first tap. A ledger day pushes a
level with ‹ (the wallet stays mounted and scrolled under it); ✕, the backdrop and Esc close it. The goals are
けんこう's ([Kenkou](#kenkou)), the ずかん 設定's.

### Settings

**設定** (`panel/SettingsSheet.svelte`): the menu's 設定 pill → its own full-height sheet, at once, title せってい:
**すがた** (the look's portrait, the よびな and what's worn; かえる → [the すがた level](#sugata)), **プロフィール**
([Profile](#profile)), **サウンド** ([Sound settings](#sound-settings)), **言語** (日本語 / English), **季節**
([Seasonal look](#seasonal-look); its 天気 is [Weather](#weather)'s switch too) and **図鑑** (設定 closes, [the
ずかん](#zukan) opens). The guest's is the same, with a line saying it's visiting. Its own chunk.

<a id="sugata"></a>**すがた** (`look/LookPage.svelte`, `look/LookStage.svelte`, `look/tabs.ts`, `look/ClosetGrid.svelte`,
`look/VillagerGrid.svelte`, `look/closet.ts`, `store/look.ts`, `e2e/look.spec.ts`; the UX in
[sugata-ux.md](../app/design/avatar/sugata-ux.md)): one dresser in NH's wardrobe layout, the whole closet free (no ベル,
no unlocks), for A, B and the guest alike. Each person is NH's human player ([Players](#players)) or a villager.
- **The stage:** the 3D player (drag turns, tap hops) or the villager's render, shrinking as the panel scrolls; a
  status pill says what's worn (「★いつもの」, a コーデ's name, 「ふゆ · アレンジちゅう」, 「住民 · ことの」), **元に戻す** once
  anything changed this visit, the nameplate opens the よびな sheet, and the colour dots of the item last tapped.
- **Six tabs:** **コーデ · かお · 髪 · 服 · 小物 · 住民**, with sub-rows. コーデ: **★いつもの** (never stored), the saved
  looks (at most 20) and **＋ 保存**; a saved one offers うわがき · なまえ · けす. The closet: NH's grid, five a row, a
  tile per item in its variant (a ワンピース clears the bottoms, one of hat / hair ornament). 住民: the search, とくべつ and
  the 417 villagers, heads lazy.
- **Sending:** the stage holds a draft; leaving the level sends it once if changed (one `look` pref, a picked villager's
  `villager` pref first; a member's いつもの as null), with 取り消す for 5 s. No 決定 (✕ keeps, as NH's wardrobe). コーデ
  edits go out as made (`savedLooks`, [backend](backend.md#events)).
- **The closet is the part table's** (`player3d/parts.json` through `look/closet.ts`'s `Closet`): each garment line a
  tile with its colours as dots, the swatches measured by `scripts/players3d-models.ts`; a tile is the line's catalogue
  icon tinted to the colour. closet.test keeps every grid non-empty and every swatch measured.
- **The preview** (`look/LookPreview.svelte`, `look/preview3d.ts`): `createPlayer` on the stage's canvas, edits
  `dress()`ed in place; its renderer is the level's one WebGL context (the island's sleeps under the sheet), released on
  close; frames on demand, at most 30 a second; the flat stand-in (`look/PlayerFigure.svelte`) until it's up.
- **Portraits** (`look/portraits.svelte.ts`, `look/LookPortrait.svelte`): a player's round head is `portrait()` through
  the preview's renderer, 128 px, kept by the look's hash in localStorage (the latest 24; on quota fewer) and in memory
  as asked for (24, LRU).

<a id="profile"></a>**プロフィール** (`panel/ProfileSection.svelte`, `model/profile.ts`, `e2e/profile.spec.ts`): one card.
Whose (the two members, this phone's first; the guest only its own) with the age (「29さい」); せいべつ (おとこ · おんな ·
ひみつ), たんじょうび (a native date field) and BMIの めやす (アジア, the default · WHO; not the guest's). Prefs on the
record ([backend](backend.md#events) `sex`, `birth`, `bmiStd`): either member sets either's; private to the two
members (the guest's to the guest), enforced by the record. What it feeds:
- **Height:** from Health's own BMI: √(weight ÷ BMI) of the latest day with both (no height pref).
- **Energy:** resting by Mifflin–St Jeor (10 × kg + 6.25 × cm − 5 × age, + 5 a man, − 161 a woman), the latest
  weigh-in; daily = resting + the average Move of the last 28 days with the Watch worn (at least 7: `model/health.ts`
  `activityOn`), else resting × 1.4; kept within 1.2–2.2 × resting.
- **ごはん's defaults** ([Gohan](#gohan)), only while no goal is set: kcal the daily energy, less 15 % while the goal
  weight is more than 0.5 kg under the latest weigh-in, never under the resting energy nor 1,500 (a man) / 1,200 (a
  woman), to a 50; salt 7.5 g a man, 6.5 g a woman (食事摂取基準 2025); protein 1.6 g × the weigh-in, at least the
  推奨量 (65 g a man, 60 from 65; 50 g a woman). Registered as the goals' `derived` defaults (`contract/goals.ts`).
- **BMI's category** on the BMI card ([Kenkou](#kenkou)).

### Kiroku

The ベル ledger (`model/history.ts`, `components/kiroku/*`), read-only, in [ごほうび](#wallet) under the rewards
(「貯めたベル」):

- **ベル:** by week (earnings only), one line per day: each person's four fruits (bright = met), a star on a
  ふたりでぜんぶ day, the day's ベル (tap → the day); on a がんばり day a second line with each person's がんばり ベル.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  がんばり chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

けんこう (`model/health.ts`, `components/health/*`, `e2e/health.spec.ts`): the health popup's first page, 健康 (full
height). Health data over time, one person at a time, computed on read, each card with its goal. Its code and strings
(`i18n/kenkou.*.json`) load with the first opening.

- **The title bar** (both pages, `e2e/kenkou-header.spec.ts`): whose · the page switch 健康 | ごはん · ✕, no tab bar.
  The switch (`KenkouSwitch`, NavBar's `middle`, the title kept as its hidden heading) is one cream track, each page
  its NH art (the dumbbell, the dinner) and its name, the shown one on the yuzu thumb; drawn 40px, taller than the
  pills under it, so it reads as the page. On ごはん's levels the bar is ‹, the level's title, ✕ (no switch).
- **Whose** (NavBar's `lead`, `Pick`): the avatar alone with its colour stroke, a native `<select>` (iOS's picker lists
  the names; the accessible name 「誰のデータ：ウェイ」). One pick for both pages (`health/whose.svelte.ts`), this
  phone's person first, kept for the session. 健康 has no guest data: with the guest picked it shows the last member
  picked, its pill dashed and a line under the bar 「おきゃくさんの健康データはありません。ウェイを表示しています」.
- **Spacing:** both pages' scrollers set `--kk-gap` 12 (rows, cards) and `--kk-row` 44 (the control row), so their
  range rows sit at one height.
- **The selectors:** under the bar one row: かつどう ·
  からだ (two pills with NH icons: `art.ts` GROUP_ART) and the period dropdown (1週 · 1か月 · 3か月 · 1年; the same
  controls as ごはん's グラフ). 1週 and かつどう on every opening. The guest has no switch (かつどう only).
- **Then** a sticky row: ‹ the visible range (「10/2〜10/31」, 「1日ごと」 / 「1週ごとの 1日平均」 / 「1か月ごとの 1日平均」) ›
  and きょう.
- **Cards** (`model/health.ts` GROUPS and CARDS): かつどう 🍎 歩数, 🍐 ムーブ, 🍑 エクササイズ, 🍒 スタンド; からだ 体重,
  体脂肪率, BMI, 除脂肪体重, each with a catalogue icon (`art.ts` BODY_ART: the kitchen scale, the protein shaker, the
  exercise bike, the weight bench).
- **One card for every chart** (`ChartCard`: icon, name, the goal chip: [Goals in place](#goals-in-place); with nothing
  recorded yet 「まだ記録がありません」 and no chart). **Activity** (`BarCard`): 1日の平均 with 前の期間より ↑/↓ %; 目標
  n/N日（%）, ベスト and 記録なし n日; the chart; a one-line key.
- **Chart** (`BarChart` in `ChartFrame`, SVG; the frame is every chart's: grid, dates, goal line, slide and drag, the
  picked bucket's callout): a bar per day (1週, 1か月), week (3か月) or calendar month (1年), each the bucket's daily
  average in the person's colour (ウェイ `--person-a`, うめ `--person-b`); solid when the goal was met its way
  ([Goal directions](#goal-directions)), paler the fewer of its days did; today outlined dashed; a finished bucket with
  no row a short hatched stub (記録なし). The goal dashed (stepped when it changed), no words in the plot; on 1週 each
  bar carries its value. A tap shows one value; a horizontal drag pages (right = older).
- **体重 · 体脂肪率 · BMI · 除脂肪体重** (`BodyCard`, `DotChart`): each its own optional goal, 平均 (n回の記録; BMI with its
  category by the person's standard: under 18.5 低体重, アジア 23 過体重 / 25 肥満, or WHO 25 / 30; [Profile](#profile)),
  期間の変化 ([Weight](#weight)) and per week, the dot chart on a fitted axis with the goal dashed yuzu (or its words at
  the edge with ↑/↓ when far off), and the goal month at that pace (only when the period ends today). No good / bad
  colours; never earns.
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit`, `health/goals.ts` GOAL_SPECS over the registry
  `contract/goals.ts` GOALS): every chart's card has its goal as a chip, 「- - 目標 8,000歩 以上 ✎」 (以上 / 以下 /
  前後), or 「目標なし」. A tap opens a tray under the header, its notch under the chip (nothing covered): the title (with
  きょうから for the goals a day keeps), −/＋ by the goal's step around a 16px field, the range in words, then 目標を外す
  (where clearable), キャンセル and 決定. One open at a time; Esc, やめる or a tap elsewhere close it unchanged; saved, a
  banner says so. Either person sets either's. The same control sets ごはん's goals.
  - かつどう, from today on (a day keeps its own): 🍎 歩数 1,000–30,000 in 500s (8,000 until set), 🍐 ムーブ
    100–2,000 kcal (ウェイ 600, うめ 400 until set), 🍑 エクササイズ 5–300 min (60), 🍒 スタンド 10–600 min (120). The ベル
    keep Exercise and Stand at the fixed 60 / 120 ([Goals](#goals)), and the editor says so.
  - からだ, one decimal, clearable, never earn: 体重 20–300 kg, 体脂肪率 3–60 %, BMI 15–40, 除脂肪体重 10–150 kg.
  - The guest's phone: chips read-only, no からだ card (the record never sends it one).
- <a id="goal-directions"></a>**Goal directions** (`contract/goals.ts` GOALS `dir`; why:
  [decisions](decisions.md#goal-directions)): at least 歩数, ムーブ, エクササイズ, スタンド, 除脂肪体重, たんぱく質, 食物繊維;
  at most 体脂肪率, 脂質, 塩分, アルコール; near a value (前後): 体重 (±1.5 %), BMI (±4 %), カロリー (±10 %), 炭水化物
  (±15 %). The chip, the line's words, the shading, 目標 n/N日, ごはん's tiles and the goal month all follow it.
- **Rules:** a day's value is Health's latest; every day with a row counts; 記録なし is a day with no row (from the first
  activity record); today is drawn but not counted; the previous period is the same length just before.
- **A day without the Watch** ([decisions](decisions.md#no-watch-days)): the Shortcut sends `0` when Health has no
  samples, so a day whose Move, Exercise and Stand are all 0 or absent is read as no data for them (`model/health.ts`
  `noWatch`, `activityOn`: the one reader of a day's activity); steps stay. Read-time only. The ベル need no such rule (a
  0 and a missing value earn alike). `?demo&health=zero` sends the demo's no-watch days as 0/0/0; `?demo&weeks=60` makes
  a longer history.

### Gohan

ごはん, the meal log (`model/food.ts`, `components/food/*`, `lib/food/`, `e2e/food.spec.ts`; the data in
`static/food/`, built by `food-data/`: [food-data.md](food-data.md)): the health popup's second tab (no bowl in the
HUD; whose and the title bar: [Kenkou](#kenkou)). Each time it shows it starts on きろく, today, the day at its top, no level open. What each of us ate, typed in by
hand; it never earns ベル. Everyone sees everyone's meals, the guest too; only the owner changes an entry. Its code is
in the popup's chunk, its strings (`i18n/food.*.json`) load with it. The day renders from its entries' snapshots and
never waits on the food data: the catalogue loads with the first search or amount, or at idle after the open
(`foodUi.ts` foodDbSoon), parsed in a worker (`food/dataset.worker.ts`) and handed over in slices. Kept mounted between
openings (Sheet's `keep`), so a reopening shows the day at once.

- **Tabs** (`ui/Segmented`, `Food.svelte` TABS): きろく · グラフ (`FoodChart`). Whose day is 健康's pick (this phone's
  person first, then the others; the guest once it has logged a meal). きろく has a sticky row
  ‹ the day › and きょう; › goes past today only to tomorrow, when a いつもの fills it (read-only). Recipes and custom
  foods have no tab: a meal's search is the way in.
- **Summary card:** three short rows, so every meal's ＋ shows on opening: the day's kcal large with the kcal goal chip
  ([goals in place](#goals-in-place)) and, with a goal, a bar with あと N kcal / N kcal オーバー (a past day 少なめ /
  多め), coral only past 20 % over; then 「P 11.6 g F 5.1 g C 61.8 g 塩分 0.5 g」 (past a ceiling coral), and 「くわしく
  ⌄」 (a `<details>`) with たんぱく質 · 脂質 · 炭水化物 · 塩分 against their goals (`goalOver`), 食物繊維 (「–」 while no
  entry knows its fibre) and, on a day with any, アルコール. Under them the **PFC balance** (`PfcBar`, `model/food.ts`
  pfcShare: Atwater 4/9/4 over their sum, alcohol at 7 its own share), each share's % against 食事摂取基準 2025's 目標量
  (13–20 %, 20–30 %, 50–65 %: `PFC_RANGES`): ✓ within, else ひくめ / たかめ (never coral). A past day with nothing logged:
  「きろく なし」, not 0 kcal.
- **Goals** (the registry `contract/goals.ts`, prefs per person): kcal 1,200–5,000 by 50, protein, fat and carbs in g
  by 5 (10–400, 10–300, 20–800), salt 1–20 g by 0.5, fibre 5–60 g and alcohol 1–100 g by 1; set on my own cards only.
  Directions: kcal near (±10 %: a low day is no win, a surplus no fault), protein at least, fat at most, carbs near
  (±15 %), salt at most, fibre at least, alcohol at most. **Defaults:** protein 1.6 g × the latest weigh-in; with a
  profile kcal from the daily energy and salt by sex ([Profile](#profile)); fibre by sex and age (men 20 g, 22 from 30
  to 64; women 18); alcohol 20 g (厚労省's 節度ある適度な飲酒: [decisions](decisions.md#fibre-and-alcohol));
  none for fat and carbs. A default never overrides a set goal. **Warn, allow**
  ([decisions](decisions.md#low-kcal-goals-warn-allow)): a kcal goal under my resting energy (else under 1,500 / 1,200)
  gets a gentle note (`model/profile.ts` `lowKcal`, `health/goals.ts` `kcalWarn`); never coral, never blocking.
- **Meals:** 朝ごはん · 昼ごはん · 夜ごはん · おやつ, a card each with its kcal and its protein chip (leaf once at the
  per-meal aim: `profile.ts` mealProteinTarget), a row per entry: a 40px picture box (`FoodThumb`: the picture, else the
  category tile; before the catalogue is in, as this phone last saw it: `foodUi.ts` loggedCat), the food, its amount
  (「茶碗1杯（150g）」), kcal. On my day ＋ → the search (focused in the same tap, so the keyboard comes up), an entry → its
  amount; anyone else's day is read-only. Levels slide in (240 ms). Confirmations dock just above a level's actions
  (`ui/Toast`).
  - **最新の値にする** (`fresh.ts`): an entry keeps its food as logged; when the food now differs beyond rounding, my
    entry offers 「最新の値にする（729→765 kcal）」 (`refreshFood`). Nothing updates by itself.
  - **Several foods a trip:** an entry logged from a meal's search comes back to the search (field cleared and focused,
    「ついかした もの（n）」 with ✕, おわり); each food row has its own ＋ for its default portion; a row's tap sets it up in
    place (`FoodOpen`: the amount's controls, P · F · C, 「追加 558 kcal」), one row at a time.
  - **Copy a meal:** an empty meal on my day offers 「きのうと おなじ」 and 「〇〇と おなじ」 (`model/food.ts` copySources),
    copied as new entries of mine (`store/actions.ts` copyMeal), with とりけす.
  - **クイック:** the ⚡ chip, or a kcal typed in the search (「650」: foodUi.ts typedKcal), logs one entry by the serving
    (なまえ, カロリー, optional nutrients); its snapshot is a custom food's form with its own id (`quick:<id>`), never a
    saved マイ食品.
- **Search:** a 16px field (no search mid-IME composition), ＋ レシピ, ＋ マイ食品 and ⚡ クイック under it until something is
  typed. Empty: さいきん (my latest entry of each food); typed, the best matches: the name, 「✓ 2件の資料で一致」 when sources
  agree on its kcal, a product's brand, the everyday name (`foodUi.ts` glossOf), the default portion and kcal. A food in
  its states (`vg`/`st`: 生 · ゆで · 焼き) is one row (`search.ts`, `stemName`). MEXT's lookalikes are out unless named
  (LOOKALIKE). Left of the name the **category tile** (`FoodThumb`; `art.ts` FOOD_CAT) or the food's generated picture
  (`lib/food/images.ts` imgOf: every generic food has one, in `static/food-img` sprite sheets; a product its subcategory's, else its tile;
  [food-data.md](food-data.md) "Pictures"). ー counts (カレー is not かれい). Offline: a message, もういちど, and さいきん.
  **Ranking** (`food/search.ts` tierOf): the name exact or its head; its prefix, level with an alias exact; a substring;
  an alias's prefix or substring; any other field; rare forms (`RARE_FORM`) 2.5 tiers lower, a secondary dataset 1.5,
  packaged products 2. `food/load.test.ts`'s 55 golden queries pin the first result, no product above a generic food in
  the top three. The first 24 rows are drawn, the rest near the list's end.
- **Amount** (`FoodPortion`, rules `amount.svelte.ts` AmountPick): one screen on an iPhone 15 for the common case. The
  head: the picture (a tap enlarges it in `FoodPhoto`, 「AI生成のイメージ」), the name, everyday name and 「これは…」 (`desc`),
  the kcal at title size, P · F · C · 塩分, and 「100gあたりの栄養 ▾」 (a drink's 「100mlあたり」). **状態**: a chip per state; picking one swaps the
  food, carrying the portion through the pair's yield (`foodUi.ts` stateItem). **量**: portions as chips, −/＋ by a whole
  portion for counted things (`foodUi.ts` PIECE) or by half, a grams field (ml for a drink). The foot: the meal (four
  buttons) over 「追加 298 kcal」, or 保存 / 削除 for my entry (with 取り消す).
- **A level's actions** (theme.css `.level-acts`): held at the sheet's foot and over the keyboard while a field is typed in.
- **いつもの (a repeat):** a meal eaten the same way on set weekdays (`FoodRepeat`): its items fill each day it covers,
  marked 🔁 (`RepeatMark`), counting like any entry; its days a chip in the meal's header (毎日 · 平日 · 週末 · 月水金…);
  changes apply from tomorrow, やめる keeps past days. Editing one of its items changes that day only.
- **グラフ:** what was eaten only (calories burned are けんこう's ムーブ). Its range row is けんこう's, then **この期間の平均**
  (`FoodAverage`, `model/food.ts` foodAverage): the average day over the finished days with a meal, against the goal,
  with the nutrients and PFC balance. Then たべた カロリー (`BarCard`; `model/food.ts` foodSeries): a bar per day or the
  daily average of a week / month's days with a meal, solid when met; a day with nothing logged is 記録なし, never 0;
  1日の平均（n日分）, 期間の合計, 目標 n/N日 · 記録 n日 · 記録なし m日; the average a flat line. Then the same card for
  たんぱく質, 脂質, 炭水化物, 塩分, 食物繊維 and アルコール (`art.ts` NUTRIENT_ART), each with its goal; with nothing logged
  each card still shows its goal chip (so goals can be set before the first meal).
- **マイレシピ** (`food_recipe`, `FoodRecipe`) and **マイ食品** (`food_custom`, contract/food.ts `customSnap`,
  `FoodCustom`): everyone's, listed in a meal's search after さいきん. A recipe logs as a food (1人前, ぜんぶ, 100 g); its
  editor has its picture (the first four ingredients'), the name, なん人前 (1–20), the ingredients (added by a trip like a
  meal's search), 1人前あたり and ぜんぶで. A custom food is one serving typed in: なまえ, 1食の めやす, その重さ g (optional:
  then it logs by the serving, `sv`), カロリー (needed) and the nutrients; a weight too light for its values is refused
  (`customDensityOk`). Made from a meal's search, either saves and logs one serving in one tap. Anyone else's is read-only
  with 「コピーして へんしゅう」 and 「ごはんに ついか」; deletes are asked twice.
  - **A recipe at a glance** (the user 2026-11-09): wherever a recipe or an entry of one shows (the search's マイレシピ,
    さいきん, 記録), its box holds its ingredients' pictures (`foodUi.ts` recipePlate: a food once, the pictured ones
    first, then the most grams, at most 4; 1 whole, 2 halves, 3 a half and two quarters, 4 a 2 × 2; one without a
    picture its category's tile; `food/cells.ts` drawPlate, kept per what it holds) and a small round pot on its corner
    (the レシピ tile's glyph): a recipe, not a food. A removed recipe's entry keeps the plain レシピ tile. No dish
    picture is guessed from a recipe's name. On anyone else's day an entry of a recipe still there opens it read-only
    (コピーして編集 only: no 追加 from there); my entry's amount has レシピを見る. Nothing new is seen: meals and
    recipes are everyone's already, the guest's phone too.
- **データの出典** at the foot: 「イメージ: AI生成の イメージ」, then each dataset's label, attribution and license.
- Food names come from the data, so their kanji may be outside the trimmed Zen Maru subset: those fall back to the
  system font (the copy's own strings are covered: `npm run fonts:subset`).

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar,
  one CTA in a sticky footer above the keyboard.
- **Text colours by surface:** themed surfaces take `--text`, `--text-soft`, `--leaf-text`, `--coral-text` (light on
  navy at night); an always-cream object (a bubble, a cream button, a stamp, a ticket) carries `.obj-cream`
  (theme.css), which puts the day colours back inside it. A choice set aside after a reveal is sunk (`--ctl-off`).
  Content text ≥ 13px (`--fs-s`); ききみみ's `readability.test.ts` holds both.
- **Harvest** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both have tapped, the week's recap: each
  person's ベル, the ふたりでぜんぶ days and the total; 受け取る → the coins fall into the jar (ceremony only). ✕ = あとで.
- **Pair** (`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

One rule app-wide; `ui/nav.test.ts` enforces it.

- **The title bar** is `ui/NavBar` on every sheet, panel and level: 48px, the title centred (18, `--font-ui` 700). ✕
  top-right closes the whole sheet from any level; ‹ top-left only on a level (or a sheet opened in place of its
  parent's row: ずかん, ‹ back to 設定); they never swap or move. Backdrop tap and Esc also close.
- **A half-filled form asks first** (`ui/discard.svelte.ts`): while a form holds unsaved input (けっこんしき's task
  form, ごはん's マイレシピ / マイ食品 / クイック editors), ✕, the backdrop, Esc and the editor's ‹ ask
  「入力した内容を破棄しますか？」 [破棄する] [編集を続ける]. Untouched, they close at once.
- **One button**, `ui/NavButton`, for ‹, ✕ and the bar's tools: a 32px disc in the 44px hit (`--ctl`, `--sh-ctl-s`),
  the glyph `ui/Icon` at stroke 2.4. One look everywhere, over a photo or a map too; a map's own controls are the same
  family. `text`: ‹ grown into a pill (‹ 島へ in a room, ‹ 戻る on the board). No other ✕ or ‹. Floating cards (the
  museum's, the HHA letter, the say picker, the K.K. picker, a board note, ごはん's photo) put the same ✕ at their
  top-right corner.
- **Lead and trailing:** on a top level the lead slot may hold one compact control: ⚙ (ききみみ), whose data (けんこう,
  ごはん), km | mi (りょこう). Trailing, before ✕: tool icons only (＋). Never words in the bar but the title, or, in its
  place (`middle`), 健康 | ごはん's page switch.
- **Forms and confirms:** a form sheet (`Sheet` default) is ✕ to cancel + one action in its footer (保存), no キャンセル.
  An edit mode inside a sheet or the world (メモ, a board note, a goal's tray) has キャンセル then its action. A confirm asks
  「…を削除しますか？」 and answers with the verb, never はい / いいえ: a list's is an `ActionSheet` (the coral 削除 row),
  one with a picture (a buy, a saved look) a sheet with キャンセル + the verb (`.btn.danger`). A delete that can be undone
  acts at once with 取り消す on its banner.
- The island's full-height sheets (けんこう, the panel, りょこう, けっこんしき, トレイル, ききみみ, 設定) open and close at once:
  no zoom, slide or fade; a form sheet rises over 240 ms; a level slides in over 240 ms.

### Sizes

The kit's sizes are every sheet's: one scope, `:is(dialog, .sheet-copy)` in theme.css (every sheet, panel, level,
pairing, the board, the trays, the shop's menu), sets `--sh-ctl` to the small edge (1.5px, a 2px lip), cards to
`--r-row` 14 with the small lip, `--side` 12. In it: the title bar 48 (title 18) and its 32px discs; controls drawn
32–36px in a 44px hit (`.chip` 32, `Segmented` 36; `.chip.big` 44 for a level's main choice; a `ChipRow` is 44 high so
its scroll never clips a hit: e2e/sheet-hits.spec); rows 44–52 (`.prow` 52); the action `.btn` keeps its 4px lip. The
world (the HUD, the leaf menu, the rooms, the dialogue) keeps the game's sizes: the 2px edge and the 4px lip.

### Unified kit

Every sheet (りょこう, けっこんしき, トレイル as much as ごほうび / 設定) uses one kit: the same paper, cards, leaf and yuzu,
denser where the info is dense. Game feel from edges, small lips, stickers, stitches and the yuzu "selected"; dense text
smaller, in the system font. Nothing feature-local: shared tokens only (`--c-rose`, `--c-sky`; trip `dayColors` stay
trip data).

- **Tokens** (tokens.css, re-tinted by time of day): `--font-body` (system: -apple-system, Hiragino Sans) · `--lip-s`
  2px / `--sh-lip-s` · `--sh-ctl-s` (+ `-press`) · `--c-sky` #4F9BE0, `--sky-text` · `--c-rose` #E88FAE, `--rose-soft`
  · `--stitch` (1.5px dashed dividers, a ticket's perforation) · `--r-row` 14.
- **Type:** titles, labels, numbers in `--font-ui` 700 / `--font-num` 600 (tabular); body and notes `--font-body` 400 /
  600. Sheet title `--fs-talk` 18 · card title `--fs-body` 15 · row text 15 (lists) / 14 (timeline) · note, meta
  `--fs-s` 13 · tag, tab label, axis `--fs-xs` 11 ui 700. Sheets are normal Japanese with kanji; the island world keeps
  spaced kana ([Copy](#copy)).
- **Shape:** cards `--card`, `--r-row`, `--sh-lip-s`, no hairline; rows split by a 12px-inset stitch; controls 32px drawn
  / 44px hit; selected = yuzu (never green); the action = the leaf `.btn`. One control row per view, under the header.
  Grain only on the letter. Side padding 12, stack gap 8.
- **Components** (ui/): `Sheet variant="full"` (edge to edge on `--surface`, `.kit` scope: NavBar, one scroller,
  TabBar; default is the paper form sheet: `title`, fields, `footer`, `focusField`) · `NavBar` (`title`, `onback`,
  `onclose`, `lead`, `trailing`, `over`) · `NavButton` (`kind` back / close / tool, `text`) · `TabBar` (`items`, `value`,
  `onpick`; a cream dock, the shown tab on a yuzu pill; 56px + the safe area) · `Chip` in `ChipRow` · `Segmented` ·
  `Tick` · `StatStrip` (up to 4 cells) · `PhotoBand` (150 hero, 120 card) · `ProgressBar` · `ActionSheet` (`groups`,
  `note`: what a 削除 takes with it). theme.css: `.chip.s`, `.card.dense` with `.row` / `.row.kv`, `.stitch`,
  `.sec-label.head`, `.tag`, `.sticker`, `.grain`. A sample of all of it: `/dev/kit` (`vite dev`).
- **Icons:** `ui/Icon` only (`name`, `size` 18 rows · 20 buttons · 22 tabs, `stroke` 2, `soft`): our own drawing on a
  24 grid, a 2px round stroke in `currentColor`; an unknown name draws a pin. No emoji in chrome.
- **NH art, only:** the pink-roses art in the wedding ring; the villager heads on the leaf-menu pills; packing
  categories as NH items (32px on a cream disc: 書類 `scrapbook`, 服装 `pocket-tee`, 登山 `lace-up-boots`, 電子機器
  `slr-camera`, 手土産 `deco/present`, 基本 `toothbrush-and-cup-set`, 海遊び `goggles`, キャンプ `sleeping-bag`, 現地調達
  `shopping-basket`, Hiking `trekking-shoes`). No characters in the sheets.
- **Rules kept:** every tappable has its `data-sfx` (the shown tab / chip `none`), ‹ ✕ are NavBar / NavButton, fields
  16px+, no grabber.

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
| 🍎 Steps | `steps` (max of `steps`, `steps_watch`) | per person `pref` stepsGoal, 1,000–30,000 in 500s (default 8,000) |

The Move and steps goals on a day are the last ones set on or before that Tokyo date (a change never re-prices an
earlier day); everything that reads a goal reads that day's. The ベル price Exercise and Stand at the fixed 60 / 120 min
(`RULES.goals`) whatever is set in けんこう: there `exerciseGoal` / `standGoal` only draw its line and goal days.

**がんばり (stretch):** +1 more for each goal reached at 1.5× (`STRETCH.multiplier`): 🍐 1.5 × that day's Move goal,
🍑 90 min, 🍒 180 min, 🍎 1.5 × that day's steps goal; at most **+2 a person a day** (`STRETCH.cap`, paid in
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
buys; either undoes any buy (`spend_void`). Against the numbers check each is something to save for: a typical pair has
two おやつ and one 外食 every three weeks; a perfect week buys exactly one 外食; a lazy week (28) buys nothing.

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
Shortcut's `metrics` rows; a day's value is its latest row, so each sync replaces it with Health's current total (a
locked week's earnings stay as of its lock). Nothing in the app enters or fixes them.

What the app sends ([backend.md](backend.md#events)): the goals and profile prefs (either person's via `data.person`),
buys and voids, harvest taps, the sender's `locale`, `villagerName`, `villager` and `look`, the meal log's ops, and the
ずかん's finds (`find`, the first of each). A buy and its 取り消す wait 5 s before they are sent (touching the banner
holds it, ≤ 2 min).

## Weight

`model/weight.ts`, for けんこう's 期間の変化 and goal month; never earns (`deps.test.ts`). Plain arithmetic, no
smoothing: over the visible period, the first week's average weigh-in → the last week's when the weigh-ins span 14
days or more, else the first weigh-in → the last; under two, none (–). Per week: that change over the days between the
two weeks' middles, shown from 7 days apart. Goal month: from the last week's average at that pace, only when it heads
to the goal at ≥ 0.05 kg a week within 156 weeks (else 「あせらず、ゆっくり いこうね」; at the goal 「目標に届いています」).

The body metrics (`body_fat_pct` %, `bmi`, `lean_kg` kg; `State.body`) are read the same way: a day's latest row, one
decimal, within their bounds (body fat 2–70 %, BMI 10–60, lean 10–150 kg). Each has a goal (`goalBodyFat`, `goalBmi`,
`goalLean`; the registry, `contract/goals.ts`), its goal month worked out as weight's, the goal's way. They never earn,
and the cache keeps only their newest row per day once the week has locked, like weight.

## Island scene

`lib/components/island/*` and `lib/components/world3d/*`: NH's island in 3D on the editable layout, NH's own models in
three.js, with the DOM island over the canvas as its tap areas, marks, balloons and popups ([World](#world)). What
comes only on its days (a visitor, the tape deck, the cake, the weather, the fireworks, Halloween's, a birthday's and
the wedding's decorations) is loaded the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load
carries none of it. Light from the upper left; each surface one fill, one gradient, one soft shade; no strokes on
scenery. Only `transform` and `opacity` animate; everything pauses while hidden (`data-paused`), a sheet pauses
particles, critters and idle life (`data-covered`), and under a full-height sheet every animation holds (`data-sheet`)
and the 3D island draws nothing nor asks for a frame (`e2e/sheet-idle.spec.ts`). Nothing on the island pays ベル.

### World

`island/world.ts` (every coordinate: the layout's once applied, `island/site.svelte.ts`), `island/camera.svelte.ts`
(the projector), `island/IslandScene.svelte`, `world3d/Island3D.svelte` (the canvas), `world3d/engine.ts` (the scene,
the camera, the frames), `island/Scenery.svelte`, `e2e/world.spec.ts`, `e2e/world3d.spec.ts`, `e2e/world-perf.spec.ts`
(on demand: `WORLD_PERF=1`).

- **Units:** world units (an 80u villager); x across (centre 195 on the default island: the land box's middle,
  `model.ts midXOf`), z into the island (bigger = further back; the front shoreline is SHORE_Z). The live island reads
  the editable layout ([island-layout.md](island-layout.md)); world.ts's own values are the old fixed island's, read
  before the layout is applied and by the unit tests and the layout scripts.
- **No WebGL** (never on the target iPhones): instead of the island a line in the middle of the scene, 「この端末では
  しまを 表示できません」 (`[data-no3d]`); the HUD, the panel and the health popup work as ever.
- **The 3D island** ([decisions](decisions.md) "The island in 3D"): `Island3D.svelte` puts a canvas under the stage's
  nodes (over the DOM sky) and hands the projector its camera (`World.useThree`); the engine runs the World's step in
  its own frame ([the frame rate](#frame-rate) while anything moves, the ambient rate while only the water does; a move
  slower than 60 px/s on screen, or off it, is ambience: `world3d/pace.ts`), and the World steps itself on the game's
  clock when no frame has (camera.svelte.ts `simTick`). The ground and the water are the layout's (`terrain.ts`
  buildGround with NH's textures, `water.ts`); the objects `objects.ts` placeObjects; the villagers and the day's
  visitor NH's models (`villagers.ts`, villager3d/: a villager with none is its render's card, on the island, in the tent and the museum: `person3d.test.ts` checks every pickable look draws); the lights `lights.ts`;
  the finger `gestures.ts`. The camera's ends come from the layout's extent. `window.__world3d` (stats, view, go,
  client, ground, where, focus, xRoom, strays, alphaBlends, away, lamps, precip) serves the e2e: `stats().why` names the
  parts that wanted the last frame, `stats().paused` is true under a sheet.
  - **The camera:** the default zoom (1) is the widest it rests at, x centred, and one finger only scrolls along the
    island. Zoomed in, one finger pans sideways too, x held over the land plus 24u of sea either side (`xRoom`). A pinch
    zooms about its middle; past the default it gives with rubber-band resistance and springs back over 350 ms (the one
    automatic move besides the board's focus). In: up to 1.8. A gesture is one kind from start to end. No native scroll.
    A touch on a fling still faster than 0.1 px/ms only stops it (iOS's scroll: no tap).
  - **Programs compiled ahead** (engine.ts `hold`): a frame never waits on a program still linking (KHR_parallel_shader_compile).
  - **A rush** (engine.ts `rushing`: a drag, a pinch, a fast fling) places only what shows (camera.svelte.ts `quiet`);
    the next still step places every node (`camStill`). The sky's height is on its own boxes (`data-horizon`).
  - **What comes and goes** is drawn from the DOM island's own nodes (`camera.svelte.ts`): a node with an `m3` art key
    stands as NH's model (`drop` falls in; `y` an absolute height), one with `v3` is a character's model; their DOM art
    goes invisible (`.m3on`, `[data-r3]`) and stays the tap box, its image never downloaded (`characters/artGate.ts`)
    unless there's no model (`m3off`). Fish shadows draw after the water (`things.ts` UNDER_WATER).
  - **Flourishes** (`effects.ts`, `island/fx3d.ts`): a few particles of NH's fx/* models in world space (the bite's 「！」:
    `biteMark.ts`; one star in code: `effects.ts` starGeometry). A DOM jiggle on canvas-drawn art moves the model too
    (`island/echo3d.ts`).
  - **The board's focus** ([board.md](board.md)): `world.three.focus(rect)` / `unfocus()` / `attach(id, obj)`.
  - On a software renderer (CI's headless Chromium) it draws at its lightest; the e2e's logic mode
    (`E2E_RENDER=none`) runs the frames and draws nothing.
- **The projector** (`camera.svelte.ts` `World`): every world thing is a DOM node at its feet (`{@attach world.at(…)}`)
  placed through the 3D camera: an upright node, a flat mark or a solid's outline (a building's tap area). Nothing is placed until the
  camera is up. **One depth order** for the DOM: z-index from the feet (nearer in front, ties by x); a tree is two
  nodes, its canopy 14u nearer than its trunk. World-anchored overlays (a tree's popup, a bite's 「！」) stand over
  everything at their true size. Only nodes in [camZ − 600, camZ + 900] are shown.
- **The ground and the water** are the layout's, built on the phone (`world3d/terrain.ts` buildGround: NH's ground
  textures in `static/terrain/nh/` by the season; `world3d/water.ts`: the sea, the rivers' flow, the falls, the ponds):
  [island-layout.md](island-layout.md).
    - **The sea's wash** (`layout/swash.ts`, drawn by `terrain.ts`): NH's waves on every sea shore every 5 s, the foam
    running up 11–22u and the wet sand drying after; each point's phase is its nearest shoreline point's. A shader on the
    ground's and the sea's materials. **The shore** is one eased colour ramp by depth (sand, wet sand, aqua, turquoise,
    deep blue), rivers fading into the sea at their mouths.
- **Layout:** the default island (`npm run layout:default`; [island-layout.md](island-layout.md)): まえ, the front
beach with the only palms, the homes A (ウェイ, left) and B (うめ, right) on every phone (never mirrored) with the goal
trees on their outer sides, the tape deck, the rock, the dig spots, the hedge; one path up the middle to the campsite
and the stairs; the stream from the upper tier over the falls, across the island under the stone bridge to the west
beach; おく: the pond, the bamboo, the campsite's tent, the cliff, a cedar forest on the upper tier. The trees, bushes and
props are composed by hand in focal groups; the wild flowers and weed spots are scattered by seeded Poisson-disk sampling
(`scripts/layout.ts`, `npm run layout` → `island/scatter.json`; `scenery.test` checks the gaps and that no open lawn is
more than 90u from anything). **Wild flowers** (`world.ts` FLOWERS, `Flowers.svelte`): seven clumps of one kind, the
season's kinds in turn (`scene.ts` WILD); each flower's id is where it stands (`fl:<x>:<z>`).
  **Decor** (the fixed pieces: `world.ts` DECOR_SLOTS, `island/fixedDecor.ts`, `e2e/fixed-decor.spec.ts`): NH's outdoor
  furniture at one scale (world.ts DECOR_U), each in its own spot: the front bench, the hammock, the log bench, the
  pump, the shishi-odoshi, the pull-up bar, the firewood, the campfire with two stools, and seasonal pieces from the date
  (the picnic set, the summer's beach chair and sandcastle, the seasonal lamps, the illuminated tree, kadomatsu, a
  snowboy after snow, Bunny Day's arch), the same on every phone. Every spot is a walk obstacle and off-limits to
  decorations (`fixedDecor.test`). A tap answers in place: the pump gushes and waters the flowers within 70u, the
  sandcastle and snowboy puff, the shishi-odoshi tips (also every 15–25 s in view), the rest knock; a seat is sat on;
  the pull-up bar is the gym's. Lamps and the campfire light from dusk (.7).
  **The decor's life** (`island/ambient.ts`): outings sit on the benches; 19–22 a villager sits at the campfire on its own
  stool; on an exercise-goal day a villager does pull-ups now and then; when both met every goal, at dusk they sit side by
  side on the front bench. A villager standing still on a seat's spot (`world.ts` SEATS: `layout/nav.ts` seatsOf) is on
  it (`villager3d` sitAt on its `seats3d.json` anchor; the hammock is lain in), so every phone draws the same.
  **Sitting on a tap** (`island/sitting.ts`, IslandScene `sitOn`, `e2e/sit-outdoors.spec.ts`): a tap on a seat walks my
  villager to its nearest free seat and on (with the doors and the board, the exceptions to "a tap acts in place").
  Taken: the other seat, else a `boop`; two on one seat, the earlier sit keeps it (a tie by A, B, G: `sitting.ts`
  yieldsSeat). Nothing new goes over the relay: the walk ends on the seat's spot.
- **Winter and night looks:** NH's snowy models and the models' emissive light, lit at dusk (.7) and night by
  `world3d/lights.ts`.
- **Sizes** (`scene.ts`), NH's proportions against an 80u villager (≈ 45 × 76px at the front on a 393px screen):
  hardwood 120u · cedar 140–150u · palm ~110u · bush 34–40u · flower 30u · hanging fruit 20u · ground fruit 24u · a shell
  32u · a star fragment 24u · the bottle 28u · a mushroom 26u · a dig spot 26u · a weed 24u · a branch 36u · a coconut
  28u · a present ≥ 30u · the bugs 1.6× their drawn sizes · fish shadows 20–64u by NH's size 1–6 (fresh water 0.65×).
  Every tap target is at least 44px ([Scene interactions](#scene-interactions)).
- **Fixed over the island:** the sky (to the horizon), the HUD, the weather, the fireworks and the shooting stars.
- **The tint at the source** (IslandScene): what the DOM still draws over the canvas takes the time of day's multiply
  as an SVG colour-matrix filter on what it draws, never on a wrapper; a light takes none. The 3D island's light is its
  own scene's.
- **Cost:** nothing runs when still: a camera move, a walk or a change places what moved; style writes only when a
  value changes. Budgets: [ops/perf.md](ops/perf.md).

### Startup

What a launch waits for, and what it doesn't (budgets and measurements: [ops/perf.md](ops/perf.md)):
- **The shell:** a second visit's page is the service worker's cached shell at once ([backend](backend.md) "Service
  worker").
- **The players:** drawn from the bundled part table; the whole one (~1.1 MB) only for a part it lacks
  ([Players](#players)); not fetched, the bundled one for now, asked for again next time.
- **The island page's chunks:** `index.html` modulepreloads the island page's chunk and its static imports
  (`scripts/headers.ts`), and `+layout.ts` load() starts the 3D island's import while the page reads the week from
  IndexedDB, only when the launch opens the island (`ui-state/boot.ts opensIsland`), so a phone going to /pair
  downloads less. The 3D island's own chunks are not preloaded from `index.html` (tried: no sooner first frame, a later
  first paint).
- **The ground's fields:** the layout's distance fields and the ground's chunks (`layout/mesh.ts chunkMesh`) are built
  in a worker started from `+layout.ts` load() (`layout/fieldsPrime.ts` `primeFields`: one job per layout, shared by
  load() and the mount, whichever asks first; the mount awaits it). The main thread builds them only with no worker, an
  error, or one stalled 4 s; a cached set is used first ([island-layout.md](island-layout.md)). The chunks come back as
  transferred buffers, adopted once each (`adoptChunks`).
- **The 2D stand-in figure:** its colours from `look/swatches.json` through `look/swatch.ts`; the closet and the part
  table load with すがた. `contract/partIds.json` stays in the first load (it decides whether a kept look draws as it is).
- **A failed load tries again** at its next chance (`ui-state/retry.ts nextChance`: the next `online`, the page back to
  the front, or a backoff of 2 s doubling to a minute): a lazy component (5 loads a page at most), a food dataset, the
  villagers' birthdays chunk.
- **A chunk that fails reloads the page** (`ui-state/reload.ts`) only into a newer build: when `_app/version.json`
  names another version, once that version a session (`island.chunkReloadFor`), and only once its service worker
  controls the page. A chunk of the running build that keeps failing reloads nothing.
- **Static files keep Pages' default cache** (revalidated): `/room/*`, `/terrain/*` and `/art/*` are not all
  content-hashed by name, and `_headers` can't match a query string.
- **three.js:** imported by name everywhere (`world3d/threePreview.ts` for the editor's preview), never as a whole
  module.

### Frame rate

The game draws at most **30** frames a second (`store/frameRate.ts` FPS; a stored `island.fps` is ignored), the full
rate of every 3D engine (the island, the rooms, the museum) while something moves, a gesture included; a still scene
draws nothing. On a 60 Hz screen each engine draws every other display frame (an even 33 ms). One pacer runs every
engine's frames (`world3d/pace.ts` `pacer`), each ambient due time 1000/rate after the last one's due time.
Every surface makes and ends its renderer through `world3d/stage.ts` (makeRenderer, endRenderer); the small ones
(すがた, the home picker: its sway at 15 a second) draw through its `createStage`: on demand, none while hidden. The
museum at rest (no finger for 2.5 s) draws its tanks and bugs at 15 a second, 10 seen only through an opening.
The simulation runs on real time (`dt`), so nothing moves slower; a touch moves the camera on its event and the next due
frame draws it. Why 30: NH itself runs at 30, a gesture at 60 cost the most, and the added latency is under a vsync.

The DOM over the canvas keeps as few composited layers as it can: art the canvas draws is hidden (opacity 0) with no
filter and no endless animation of its own (`[data-r3]` rules), since every drawn frame recomposites every layer.

**At rest** (engine.ts REST_MS 2 s, REST_FPS 12) the island draws its ambience at **12** a second: no finger for 2 s and
the last frame wanting only the ambience (no fling, spring or focus, no walk, no critter fast on screen: `pace.ts`
moveFast, no flourish). Any of those, or a touch, draws at the full rate at once. The shadow map redraws only when a
caster changes (a fish shadow casts none; a critter's fade only as it passes half; a bug's move or a thing shown or
hidden at most every 66 ms) or its box moves on (once per 0.3 of the view's width of scroll); at rest at most every
250 ms. Under the 3D island a fish shadow's own CSS transition is off (the canvas moves the model).

### Buildings

`island/buildings.ts`, `island/doorOut.ts`, `island/Scenery.svelte`, `e2e/tapwalk.spec.ts`, `e2e/positions.spec.ts`.
The campsite, the homes, the museum ([The museum](#the-museum)) and the shop ([The shop](#the-shop)): a tap on one walks
my villager up to its door and goes in (the tent: [The tent](#the-tent); a home's room; the museum's and the shop's own
screens). ‹ 島へ comes out of the door, NH's way: my villager stands just in front of it, facing out (`layout/nav.ts`
exitOf: 30u out, A to the left and B to the right, the guest between), on every phone at once. Inside, my villager is
nowhere on the others' islands. The partner's presence is their villager and the edge face (`partnerOnline`: the
relay's presence, never in the demo).

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
and maple leaves in maple week. Events (`eventsAt`): cherry blossom Apr 1–10, maple week Nov 16–25, Toy Day Dec 24,
the balloon present.

### Weather

`island/weather.ts` (pure), `island/weatherNow.svelte.ts`, `island/Weather.svelte`, `world3d/precip.ts`,
`island/wxFixtures.ts`, `sync/wx.ts`, `panel/SeasonSection.svelte`, relay `src/weather.ts`; `e2e/weather.spec.ts`,
`e2e/realweather.spec.ts`. The island has **Tokyo's real weather by the hour**, or the game's own seeded days. Every
phone shows the same sky at the same hour. NH's skies: **fine**, **cloudy**, **rain**, **a downpour**, **snow**, with
**fog** as an hour's extra.

- **ほんもの (the default):** the relay fetches Open-Meteo's forecast (JMA's models, central Tokyo) on its 15-minute
  cron and keeps a 48-hour timeline, one sky an hour ([backend](backend.md#the-real-weather)). Each phone gets it after
  the welcome and whenever it changes, and caches it (`island.wx`). An hour is locked once it begins, so the sky changes
  at most once an hour. The mapping has dead bands against flicker: rain from 0.5 mm/h (stays down to 0.2), a downpour
  from 4 mm/h or thunder (stays down to 2.5), cloudy from 85 % cover (stays down to 60 %), snow by a snow code or wet
  at 1 °C. A lone hour between two alike takes theirs.
- **Fallbacks:** the cached timeline while it covers the hour and was fetched within 36 hours; otherwise (and in ゲーム)
  the seeded day. A `?date=` preview shows the seeded day.
- **On the phone, as NH:** Dec 11 – Feb 24 real rain falls as **snow**. Event nights stay fine: the August Sunday
  fireworks (19:00–24:00), New Year's (23:00–01:00), a meteor shower's night (20:00–04:00) and the wedding night (from
  19:00). The seeded treats stay on real fine hours: the 07:00 **fog** (October–March, 1 in 8) and the **aurora**
  (winter nights, 1 in 10). Real fog shows at any hour. The **rainbow** is the first fine hour 07:00–17:00 right after
  rain, once a day, double 1 day in 8. No dry-spell rescue for the rain-only critters (Tokyo's ~100 wet days suffice).
- **ゲーム (the seeded days):** seeded by the date (05:00 → 05:00). About one day in six is wet (all day, a wet
  morning, or heavy rain clearing at 16:00 with a rainbow); in December–February a wet day snows. Fireworks days and
  meteor shower nights are always fine.
- **The switch:** 設定 → 季節's **天気** ([Seasonal look](#seasonal-look)): **自動** (Tokyo's) or **ゲーム**, one setting
  for the whole island (`pref weatherMode`, the last anyone set, the guest too), so phones never disagree on the
  rain-only critters. Under it what the island has now and the credit 「天気: Open-Meteo（気象庁モデル）」. Its 晴れ / 雨 /
  雪 force the look (not the critters); `?weather=` forces both.
- **Look:** a grey sky and a darker tint on a wet day, half that when cloudy. Fog a haze with two drifting banks, the
  rainbow soft arcs low on the right, the aurora three swaying curtains. A change of sky eases over a minute; the sky
  the page opens to is there at once.
- **Rain and snow fall in the 3D world** (`world3d/precip.ts`): NH's thin slanted streaks with rings where drops land,
  a downpour denser; snow soft drifting flakes. Indoors nothing falls. One draw call an effect (instanced quads moved in
  the vertex shader by a time uniform), in boxes that follow the view, anchored in the world and bent with the island;
  ring heights from a small float texture of the layout's surface. `__world3d.precip()` / `precipCalls()` serve the e2e.
- **Sound:** the hour's rain or snow arrangement when there is one, the rain bed, footsteps splash.
- **Critters:** cloudy counts as fine. The coelacanth comes only in rain or snow, the snail only in rain, and NH's "any
  except rain" bugs stay away while it rains. Shooting stars come only on a fine night.

### Trees

`island/FruitTree.svelte`, `island/fruitDay.ts`, `e2e/trees.spec.ts`. A tree's fruit through one Tokyo day:

- **Hanging:** each goal's fruit, 🍐 🍑 🍒 🍎 left to right, grey at 0 and filling with colour toward the goal.
- **Falling:** met, the tree shakes and the fruit drops in front of the trunk with a thud and a puff; once per phone;
  a reload finds it lying there.
- **Picking up:** a tap on a fallen fruit picks it up, gone on every phone until the next Tokyo day (`fr:<person>:<fruit>`).
  Anyone may pick up either tree's fruit, into the pocket for the shop (no ベル). A tap within 22u of a fallen fruit
  picks up the nearest, else it opens the popup.
- **All four met:** four warm glints on the canopy over a soft gold pulse (NH's money tree).
- **The popup** stands in screen space over every tint, between the HUD and the screen's foot, over its tree as far
  as the edges allow; a tail toward the tree.
- `fruit-day` in localStorage (`{ date, dropped, picked }`): losing it only drops a fruit again.

### Shaking a tree

`island/treeShake.ts`, `island/TreeShakes.svelte`, `e2e/shake.spec.ts`, `e2e/shared-world.spec.ts`. Every tree shakes:
the goal trees and every oak, cedar and palm (`sceneryTrees()`; bamboo doesn't).

- **Tap or shake:** a goal tree's tap opens or closes the popup; any other tree's rustles it. The third tap within
  1.2 s (and each quick tap after) is a shake: the tree shakes where it stands, my villager turning to it (no walk).
- **What falls (NH's):** a hardwood or a cedar: 1 in 8 a wasp nest, else 1 in 7 a dangling bug, else 1 in 5 a branch
  (picked up into the pocket). A palm: its two coconuts the first shake of the day, after that only a nest (1 in 8). At
  most one nest per tree an hour. No fruit from a goal tree.
- **Wood** (`treeShake.ts woodFall`): any tree's shake knocks out a piece of wood 1 in 3 times (木材, やわらかい木材 or
  かたい木材), three a tree a day at most, never with a branch, coconuts or a present. Seeded, so every phone agrees; a
  `put` (`wd:<tree>:<k>`, first wins). `?shake=wood` forces one.
- **No piles:** while anything a tree dropped lies under it (a branch, coconuts, wood, its present, a goal tree's fruit),
  a shake only rustles it. A branch or a piece of wood lands on a free spot of a small ring round the foot (front and
  inner side first, then behind; a goal tree's past its fruit row), a tap's width clear of what lies about and the
  day's dig spots, picked by its id so both phones agree (`dropSpot`).
- **A tree's present** (`island/treeGifts.ts`, `e2e/tree-gifts.spec.ts`): each day two oaks or cedars (`GIFT_TREES`)
  hold a piece of furniture the tent has a model of (`catalog.ts` treeItem), dropped wrapped by the first shake and
  opened where it lies like a balloon's present. From the date and the island's seed (`dayRand`). Furniture only, never
  ベル. A `put` of a `present` (`tf:<tree>`); the ずかん's カタログ credits whoever opened it.
- **Shared** ([Shared world](#shared-world)): a shake's outcome goes to the others; their phone plays it, their wasps
  charge their villager. What lies is the shared day's (first pick-up wins).
  `?shake=nest|branch|bagworm|spider|coconut` forces the next drop.
- **The nest:** three wasps charge the villager who shook it for 1.5 s; a tap in time nets one. Too late, they sting:
  NH's swollen eye for a minute. The wasp only ever comes from a nest. The chase has its own music
  ([Event music](#event-music)).
- **A dangling bug:** a bagworm, or 19:00–08:00 a spider 3 times in 8, sways on its thread for 10 s; a tap nets it.

### Scene interactions

`island/SceneTaps.svelte`, `island/sceneTaps.ts`, `e2e/scenery.spec.ts`. Every part of the island answers a tap softly
and counts for nothing; one `click` listener (a drag scrolls, so it never reaches it); ≤ 4 flourishes at once; nothing
while covered or hidden; decorative, `aria-hidden`. What nothing else took is a walk ([Walking](#walking)); a seat is
sat on ([World](#world), "Sitting on a tap").

A bush jiggles and sheds leaves (1 in 10 a bug flies out); a tree's leaves rustle ([Shaking a tree](#shaking-a-tree));
a flower is watered ([Island care](#island-care)); any water casts the line there ([Critters](#critters) "Fishing");
sand leaves footprints; grass puffs dust (snow in winter); a cloud squishes; the sun glints; the moon bobs; the night sky
twinkles (and grants a wish while a shooting star crosses: [Shooting stars](#shooting-stars)); the campfire is poked
(`crackle`).

**Tap targets** (`island/hitbox.ts`, `e2e/hits.spec.ts`): everything tappable answers on its whole visible body, at
least 44 × 44px about its middle; in front wins. What's exactly under the finger wins over a character's loose reach.
A tree is its leaves and its trunk down to a little below its foot (≥ 44px wide); a building is its model's silhouette
as the camera sees it (camera.svelte.ts `body`, `things.ts` outline), nothing past it (`e2e/building-taps.spec.ts`); a
thing in front of a building's area is that thing's (hitbox.ts `notBehind`). **Nothing lies on a building's ground**
(`layout/clear.ts`, `island/offBuildings.test.ts`, `e2e/present-taps.spec.ts`): its footprint, its door's step and the
strip behind it its model hides (`layout/hides.ts`). What's dropped or spawned takes a spot off it (`openGrass`), and
what lies there already is drawn and tapped at the nearest free spot (`offBuildings`), its put unchanged. What a module
hit-tests itself (a shell, a dig spot, a present, a weed, a bug, the tape deck…) is the box of what it draws grown to
44px (`hitOf`), the nearer when two overlap (`pick`); on water only what it draws (`bareOf`), so a tap on the sea beside
a dig spot casts. `?hit` draws them all ([Dev params](#dev-params)).
A touch decides by the point under the finger (`ui-state/exactTaps.ts`, `e2e/exact-taps.spec.ts`): WebKit's touch
adjustment moves a click onto the nearest clickable element within the finger's radius, which opened the shop from the
sea or left a room from its floor. Inside `data-exact-taps` (the island's `.stage`, the tent's and the museum's
`<main>`) a capture listener drops a moved touch click and sends the click to what's under the finger, inside the native
click (keeping its user activation). Mouse, keyboard and VoiceOver clicks are untouched.

### Balloon

NH's balloon present: by day every 45–90 s of on-screen time (the first after 20–40 s). It flies over the island in 3D
(`island/balloonFlight.ts`, `world3d/balloon3d.ts`) at 165u over the highest ground under its lane, sea to sea in about
22 s, its blob shadow under it. Its lane is picked from the view (a little under the HUD, biased to the front); none
when the sky is too short, with reduced motion, or with no 3D island. Its tap area is a world node
(`island/Balloon.svelte`, 48px at least). A tap pops it (a "pan!", confetti): the present falls along a floaty arc to a
spot chosen first (`island/presentLanding.ts`: open walkable ground in the lower view, clear of every control; popped
over the back it drifts forward), lands with a sparkle and stays until tapped, `put` for every phone (not kept across a
reload). The flight's clock is the island's frames. A tap opens it where it lies: 「カエルのチェアを てにいれた！」
(`island/catalog.ts`, its own chunk). What's inside follows NH's drop rates (Bells and materials left out): furniture 35 :
clothing 20 : a season's DIY recipe 15 while a recipe season is on, else 50 : 25. The pool is NH's shop stock (1,836 base
items; season stock only in season); the 126 recipes each in their NH window (northern hemisphere). Never Bells, counted
in the ずかん (カタログ, レシピ). On Bunny Day a sky egg instead. The catalogue is built by `npm run catalog:build`
(`scripts/catalog.ts`: the ACNH spreadsheet for rules and names, Nookipedia for icons; 96 px webp under
`static/art/finds/items|recipes/`, cached by the service worker on first use).

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/partnerNews.ts`, `island/PartnerNews.svelte`,
`e2e/shared-world.spec.ts` ([backend](backend.md#shared-world)). Every phone shows the same island: what's caught or
picked up is gone on all, what a shake drops lies on all, each villager stands where its person sent it.

- **The villagers move as one:** each of us moves our own villager; the other phones play the very same walk (same
  start, time, way and end facing), catching up when a message is late (`island/villagerSync.ts`). Sleep too
  ([Sleep](#sleep)): the same villagers asleep on every phone, a wake on one is on all for the same minute.
- **One layout, not mirrored:** A lives on the left and B on the right on every phone; every shared id is by person or
  by place (`fl:<x>:<z>`); `?demo` and `?demo&as=B` show the same island.
- **Fishing, seen by everyone** (`e2e/fish-sync.spec.ts`): each step of a line goes to the others as it happens (`fish
  {ph, id?, pt?, from?, s?}`, presence only: `cast`, `nibble`, `bite`, `reel`, `off`): their rod, line, float, nibbles,
  bite and reel. The shadow cast at is theirs while the line is out (a tap on it here boops). A phone that comes while
  a line is out hears its step again; an angler whose phone goes, or who goes through a door, is no longer fishing.
- **The partner's doings, played here:** within 12 s of it, their villager turns to it and it plays at the target; a
  catch or a find is its plate in the bottom stack (「うめが スズキを つかまえた！」). Heard on opening (older), it only
  changes the island.
- **First wins:** of two people tapping the same thing, the relay's first claim is it; the other sees it taken.
- **Late and alone:** a phone opening later hears the day from the relay (and keeps it); with the relay unreachable each
  phone keeps its own and they catch up when it's back.

### Sleep

`ui-state/presence.ts`, `ui-state/cast.ts`, `island/islandLife.svelte.ts` syncSleep, `e2e/presence-sleep.spec.ts`
([decisions](decisions.md#sleep-by-presence)). Everyone's villager (A's, B's, the guest's) is always on the island:
**awake while its person's app is open, asleep where it stands while it's closed**, at any hour (no night's sleep).

- **Online:** the relay's `here`, and for `GRACE_MS` (45 s) after a person's last socket closed (its `gone`), so a
  reload, a moment in another app or a dropped socket doesn't put the villager to sleep. All on the relay's clock, the
  same instant on every phone; a phone's own socket down, the last word holds till its welcome; reloaded, what it last
  heard is kept (`scene-presence.<who>`), those here then counted as gone then.
- **Asleep:** the zzz, in none of the island's life (ambient beats, chats and dances, the dusk meet-up, ふたりでぜんぶ,
  the follow, group stretching: `cast.ts` islandActors, `ambient.ts` not free); those awake carry on without it.
- **A tap wakes it** (a high-five: [Villager taps](#villager-taps)) for `WAKE_MS` (60 s) from the wake's relay time
  (`act {act: wake, id, at}`): on every open phone, one opening meanwhile too, the same minute; it's in the island's
  life then (not present: an outing of its own), and it sleeps where it ends up (stopped mid-walk). Each phone moves it
  by the same seeded slots; a phone opening later puts it where its person's last walk ended.
- **Back online:** awake where it is (no walk home: [Walking](#walking)).

### The guest

`contract/guest.ts`, `ui-state/cast.ts`, `ui-state/viewer.ts`, `e2e/guest.spec.ts` ([backend](backend.md#the-guest),
[decisions](decisions.md#the-guest)). A third person, 「おきゃくさん」: a visitor to our
island, NH's way, with its own key (pairing: [runbook "Pair a phone"](ops/runbook.md#10-pair-a-phone)). `?demo&as=G` is its phone.

- **What it sees:** our island, the trees and their popups, the menu's ベル row and ごほうび view-only (「ちょきんばこは
  ふたりの もの。」 in place of the shop), the ずかん, けんこう's かつどう (either member's, goals read-only) and everyone's
  meals. Never a からだ figure: the record leaves them out of its snapshot. せってい as ours, with a line saying it's
  visiting. ききみみ: the members' games as their summaries.
- **What it does:** everything on the island a member does (walks, catches, digs, shakes, phrases, high-fives, the tent
  and its own house, the editor, watering, wishes, waking a visitor, the weather, the shop, the museum, K.K., the board,
  ききみみ), its finds credited in the shared ずかん (「（おきゃくさん）」). It earns and spends no ベル, sets none of our goals
  and writes neither the wedding board nor a trip's notes (the record refuses those).
- **Its villager on the island:** always there, as the members' are (the user, 2026-11-09: "go for consistency"):
  where its last walk left it (its spot by its house, or the campsite, till it has walked), its own phone opening it
  there too. Asleep while its app is closed, awake while it's open, as everyone's ([Sleep](#sleep)); awake, in the
  island's life as a member's villager (ambient moves, chats, ふたりでぜんぶ's walk and high-five, the dusk meet-up,
  group stretching), never an outing of its own.
- **On our phones:** drawn like the partner's villager (lilac name tag); a tap is a high-five; its phrases and catches
  show there. A banner: 「おきゃくさんが あそびに きたよ！」.
- **Who counts as "the partner"** (said once): the guest only where the island's life is everyone's
  (`ui-state/cast.ts` islandActors).
  - The edge face and `peer`: the other member only; on the guest's phone either member for `peer`, A for the face.
  - ふたりでぜんぶ: everyone on the island walks to the middle (the guest a step in front: `wander.ts` MEET.G) and
    high-fives.
  - The follow: a member's villager comes over to mine; on the guest's phone A's or B's comes to the guest's.
  - Ambient life (`ambient.ts`): every awake villager; the guest's shakes no tree.
  - The goal walks and meeting a visitor: the members' own. Sleep: everyone's, by the relay's presence (`act wake`, `id`).
  - High-fives: one at a time per pair, each with its `to`.

### The island's layout

`layout/` (grid, catalog, model, height, nav, validate, diff), `store/layout.svelte.ts`, `scripts/layout-default.ts`.
The outdoors is data anyone of us can change: NH's 30u tiles on a 20 × 80 grid (`layout/grid.ts`), each grass, sand,
a path, a river, a pond or the sea, on cliff tiers 0–3, with every tree, bush, rock, lamp, piece of furniture, the
bridge, the stairs and the homes an object on its tiles. The contract (tiles, objects, homes, resizing, the 3D build,
the editor) is [island-layout.md](island-layout.md). Each home is its owner's (its look and its room); anyone changes
the outdoors, in /editor only ([Decorating](#decorating)).

### Decorating

`layoutEdit/IslandEdit.svelte` (in /editor), `island/Decor.svelte`, `island/decor.ts`, `e2e/decor.spec.ts`,
[island-layout.md](island-layout.md) "Phone editing". Any of us (the guest too) puts NH's outdoor furniture on the
island in /editor, moves, turns and removes it; every phone shows the same island, kept for good: the decorations are
the layout's objects (the old decorations' map moved into the layout once as `m-<id>`: layout/migrate.ts).

- **The items:** NH's models (いしどうろう, バードバス, ガーデンワゴン, アイアンガーデンテーブル and チェア, レンガのいど,
  たぬきのおきもの, モンステラ, みちしるべ, いちりんしゃ) and the layout's other kinds in IslandEdit's tray tabs.
- **The gym** (the tray's ジム tab, `layout/catalog.ts` group `gym`): NH's fitness furniture under its official names
  (けんすいスタンド, プレスベンチ, エクササイズバイク, ランニングマシン, サンドバッグ, バランスボール, バーベル, ケトルベル,
  プロテインシェイカー, ウォーターサーバー, たいじゅうそくていき, クライミングウォール, ロッカー), through the decorations'
  pipeline ([world3d-assets.md](world3d-assets.md)). **Used, NH's way** (the six NH lets one use): a tap walks my
  villager up to it and on, a seat of sitting.ts (`layout/nav.ts` SEAT_ON, `villager3d/seats3d.json` `use`,
  `scripts/seat-anchors.ts` USE), and it loops its pose while it stays (poses.ts `press`, `pedal`, `run`, `punch`,
  `bounce`, `pullup`; a villager with no 3D model, drawn as its card, by a rhythm of its own: `world3d/motion3d.ts` gymPose); a tap on the ground gets it off. Anyone, the guest too. One villager a piece, the earlier keeping it; nothing new on the
  relay (`e2e/gym.spec.ts`). **The bench press:** NH's bench's bar is split out as the GLB's `bar` node
  ([world3d-assets.md](world3d-assets.md) "Parts split out"); lying down, the bench's small bar is swapped on the rack
  for the gym's barbell (benchBar.ts HELD, 1.25 × NH's size so a human player's grip fits), which rides the hands
  (villager3d `hands()`, `world3d/benchBar.ts`) through `press` and goes back on the rack as it gets up. The others are
  to look at (a tap jiggles them). A piece is the decorations' instanced model; its use is stepped at the ambient rate.
  More of NH's (the gym pack): ヨガマット and たぬき開発ヨガマット (lain on), スピードバッグ (punched, `punch`),
  マッサージチェア (sat on), ダンベル (to look at).
- **キャンプ** (group `camp`): NH's camp goods, the island's own (キャンプファイア, まるたのイス, まるたのベンチ,
  ハンモック, ロッドスタンド, まき, キャンプサイトの看板) and the camp pack's: たき火, ファイヤーピット, ランタン (lit at
  night from their emitters, world3d/things.ts LAMP `e`, faded in as every light), キャンプベッド and シュラフ (lain on),
  折りたたみアウトドアチェア, ディレクターズチェア, アウトドアベンチ (sat on), キッズテント, クーラーボックス,
  バーベキューグリル, コッフェル, 折りたたみアウトドアテーブル, アウトドアテーブル, キャリーワゴン, ウォータージャグ,
  ケトル, 携帯ラジオ, ナナメのみちしるべ, せかいのみちしるべ; and a second file's (`decor/camp2`): アウトドアキッチン
  (NH's camp table with its burner and sink), アウトドア発電機, ポリタンク, 物干しロープ, 物干しざお, 落ち葉のたき火,
  ドラム缶風呂 and 燻製マシン (their fires lit at night), ビニールチェア (sat on), やかん, エスプレッソメーカー,
  木製のバケツ, ブリキのバケツ.
- **食べ物** (group `food`, to look at): ピクニックバスケット, お花見セット, フルーツバスケット, パン, ミックスサンドセット,
  飯ごう (its fire lit at night), 鍋, フライパン, シーフードのアヒージョ, スズキの香草焼き, 洋風定食, 和風定食,
  ペットボトル飲料, ココナッツジュース, クッキー. Their labels are kanji (the sheets' rule; the world's tap areas
  name them so too, no `decor.item.*` of their own). The tray's icons are the ずかん's, else NH's own (`art/items/<kind>`).
- **How many:** the layout's objects are capped by the record at 1,500 standing (`contract/layout.ts` LAYOUT_MAX).
- **In:** /editor only: the desktop editor, or its phone view's IslandEdit (`/editor/?view=phone&edit`), the tent's
  way (a tray, a ghost green or red, a tile at a time, ↻ まわす, ✕, 🗑, ✓). Its おきゃくさん tab: where the visitors stand
  and where Gulliver washes up. Every phone has the change at once (the layout's ops over the relay). Its reset to the
  default asks first, anyone alike: リセットする only once 「リセット」 is typed ([island-layout.md](island-layout.md)).
- **On the island** a placed item is a world thing: NH's model, its DOM node the tap area, an obstacle the walk goes
  round (layout/nav.ts); a tap jiggles it in place. The partner's change puffs where it lands.

### The bulletin board

`components/board/`, `contract/board.ts`, `e2e/board.spec.ts`: [board.md](board.md) (and [backend](backend.md#events)
`board`). NH's island board stands on the front beach (the layout's `board` object); a tap walks my villager up beside
it, then the camera dollies to its face (the engine's `focus`) and back. Pinned notes, four a page, newest first; a
note's author rewrites it, its author or a member takes it down; plain text, at most 4 lines and 100 characters. A 「！」
bobs over it when someone else wrote since I last looked. Everyone, the guest too, writes.

### The tent

`routes/tent/+page.svelte`, `tent/TentRoom.svelte`, `tent/TentEdit.svelte`, `tent/engine.ts` (three.js), `tent/grid.ts`,
`tent/items.ts`, `tent/dragLink.ts`, `store/tent.svelte.ts`, `contract/tent.ts`, `ui-state/doorTransition.ts`,
`scripts/room-models.ts`, `scripts/room-surfaces.ts`, `store/where.svelte.ts`, `e2e/tent.spec.ts`,
`e2e/tent-surfaces.spec.ts`, `e2e/tent-hold.spec.ts`, `e2e/tent-size.spec.ts`, `e2e/sync-harness.spec.ts`. A tap on the campsite's tent walks my
villager up to its door (the walk goes over the relay; within 36u it goes straight in; a tap elsewhere on the way
cancels), then goes inside: its own screen, truly 3D, behind NH's door (a black iris closes, stays black while the
room's chunk and first frame come, opens out of the room's door; the way out the same). Out of the door my villager
stands just in front, facing out, on every phone. The homes' rooms are the same system.

- **One place at a time:** each villager is on the island or in a room, on every phone (`store/where.svelte.ts`:
  presence over the relay, `tent {in}`, said again when someone joins or the socket comes back). A villager in a room is
  nowhere on the island. The museum and the shop are the same (`sc` `m`, `s`). A phone that goes quiet inside has its
  villager leave 3 minutes after the relay saw it go ([Walking](#walking) "A phone gone").
- **The room:** NH's largest main room, 8 × 8 tiles (a tile 10 model units), four walls four tiles high, the front one
  with the door (two tiles wide) and NH's doormat; its two tiles stay clear.
- **Room size** (もようがえ's 広さ tab, `e2e/tent-size.spec.ts`): NH's main rooms, テント 4 × 4, 初めての家 6 × 6 and
  増築した部屋 8 × 8 ([Nookipedia: Home loan](https://nookipedia.com/wiki/Home_loan),
  [Player house](https://nookipedia.com/wiki/Player_house)), each card the room's plan. One op (`dtentsize`, the
  room's scope: whoever may arrange it); none is 8 × 8. A smaller room is the largest one's middle tiles against the
  same front wall (`grid.ts` Bounds): the walls, floor, grid and camera fit it, pieces keep their tiles. Larger always;
  smaller only with nothing left outside, else those pieces glow red and the bar says how many to move or put away
  (decisions: *A room's size never moves or drops a piece*). The HHA's space counts the room's own tiles. NH's back,
  side, upstairs and basement rooms are a follow-up (a home is one room).
- **The camera** starts as NH's room camera (perspective, 47° down, a 32° lens, from the front), then it's the
  player's: a drag turns it round the room and tilts it (28°–78°), a pinch zooms (0.55–1.35 ×), 🏠 eases it back. The
  walls between the camera and the room are cut away (Happy Home Paradise's look). Or at my villager's eyes:
  [First person](#first-person).
- **The light:** warm interior light, one small shadow map (1024², redrawn only when a piece changes); at night dimmer
  and warmer, the lamps' emissive on and up to four point lights at the lamps, each where its lamp glows (items.json
  `e`: NH's light locator, else its emissive part's lit middle; turned with the piece: grid.ts `toRoom`).
- **The villagers** are NH's 3D models where they have one (villager3d/: walking, sitting, lying, a hop, blinks), else
  billboards of their official renders, each with a soft round shadow. A tap on the floor walks mine there (A* on half
  tiles round the furniture, rugs walkable; 45 units a second); a tap on a villager hops it; a tap on a piece acts in
  place; the doormat or ‹ 島へ goes back out.
- **Stereos** (`tent/stereo.ts`, `tent/StereoPicker.svelte`, `kk-sync.spec.ts`): NH's music players in any room
  play K.K.'s songs. A tap opens the song list (おまかせ, or one by name); the song is his **aircheck** (manifest
  `kkAircheck.<id>`) on the room's music stage ([Shared music](#shared-music): `request(sc, id, { pc })`, the tent's
  `t`, うめ's `u`, the guest's `v`), so everyone in the room hears it from the same point; the room's music stops for it.
  Anyone's tap on the one playing stops it for all; heard only inside the room.
- **The partner's villager** is theirs to move while they're in the room (each walk goes over the relay as the `tent`
  intent); while they're away their villager rests where it last stood.
- **もようがえ** (the foot's green button, `TentEdit.svelte`): the grid on the floor and a tray: かぐ (the starter set),
  ラグ, みつけた (furniture found in presents that NH has a model of), ジム (tent/items.ts GYM), かった (bought in the shop),
  かべかけ, かべがみ, ゆか, and ✓ おわる with the count (「3/60」). A piece goes down as a ghost on the free spot nearest my
  villager, its footprint green or red with the reason (「出入り口はあけておきましょう」…); ↻ まわす turns it; ✓ 置く places it;
  🗑 片付ける stores it (取り消す for 5 s); ✕ やめる puts it back. At most 60 pieces a room, on whole tiles, off the door's
  two, not over a piece or a villager; a rug lies under furniture. **Holding** (NH's: one thing held at a time): while I
  hold one, the finger is for it (a press or a near miss drags it, a floor tap puts it there if it may stand, a tap on
  another piece doesn't take it unless what I hold goes there; a 400 ms press swaps; a tap off the room puts it down).
  **Table tops** (NH's surfaces, from the ACNH spreadsheet's `surface` flag): Miscellaneous things go one a tile on a
  surface's top, found from its converted model (`scripts/room-surfaces.ts`: items.json `sy`, `st`, `sl`); a thing's op
  names its piece (`on`), so moving the table carries it; not put away with things on it. The island's tables
  outdoors follow the same rules (`lib/surface.ts`; island-layout.md "Table tops"). **On the walls** (the かべかけ
  tab): a piece hangs on a wall's grid (its op: x, z the step, f the wall).
- **Loading:** the furniture's models are kept page-wide as loaded (tent/engine.ts `loadModel`, release.ts `lean`), so
  a room comes back with no fetch or decode; each room's GPU copies go with its renderer. What isn't drawn yet (the first
  person's ceiling, the edit grid) is compiled a program a tick once still (engine.ts `warm`). At rest the room draws
  only a blink (villager3d `nextBlink`).
- **Sit, lie and switch** (`tent/seats.ts`; shared with the museum's benches: `rooms/seating.ts`): NH's own interaction
  from the spreadsheet (a Chair is sat on, a Bed lain on): a tap walks my villager up to the nearest free side and it
  sits or lies, its pose its model's turned with the piece (along the bed, the head on the pillow, a double bed's two
  side by side: [Seats and beds](world3d-assets.md#seats-and-beds)); a floor tap gets it up; the first to sit keeps the seat (the `tent` intent's `seat`). The cold sleep pod's lid (`tent/lid.ts`) shuts over
  its sleeper once lain (0.45 s, then 0.52 s eased; at once with reduced motion), the sleeper settling 1.2 deeper, and
  opens before they get up (the get-up waits for it); each phone runs it off the shared lying pose. A light switches with a tap, kept with the
  piece (its op's `l`); NH's room light switch (💡) dims the room's own light.
- **Phrases** ([Villager taps](#villager-taps)): the say button at the room's bottom right, in the tent and every home;
  hidden in もようがえ and under a sheet. The phrase shows in the island's balloon (`island/Says.svelte`) by the speaker's
  head (the engine's `headPoint(who)`), 4 s. It goes out as `say {text, sc}` with the room's scope (`t`, `u`, `v`) and
  shows only on a phone whose villager is in that room (`e2e/say-rooms.spec.ts`).
- **The Happy Home Academy** (`tent/hha.ts`, `HhaLetter.svelte`): the first visit after the room changed that day,
  ハニワくん's letter rates it, from the shared room alone (NH's HHA points: series, themes, colours, lights, space, kinds;
  どう 3,000, ぎん 6,000, きん 10,000) with one remark. The numbers are their own chunk (`hha.json`). No ベル.
- **Shared and kept:** each change is one op (the island's `decor` op with the room's scope, last writer wins:
  `contract/tent.ts`, [backend](backend.md#events)). While I hold a piece, the others see it move (`drag`, ≤ 10 a
  second, presence only) with a yellow footprint, not theirs to pick up (「ウェイが うごかしているよ」); the earlier hold
  keeps it; silent for 2 s it drops back; the drop is the op.
- **Cost:** three.js and the room's code are their own chunk, fetched only when the tent opens (`e2e/tent.spec.ts`); no
  MSAA; pixel ratio capped at 2, 1.5 while the camera moves; frames on demand; everything disposed on the way out.
- **The models** (`npm run room-models`, NH_MODELS: see [world3d-assets.md](world3d-assets.md)): NH's furniture, rugs, wallpapers and floors
  converted to `static/room/`: 816 pieces (every ずかん piece NH has a model of), each a meshopt glTF with baked WebP
  textures (≤ 256 px, ≈ 18 KB average), its footprint from NH's catalogue size; wallpapers 256 × 512, floors 512².
  Cached by the service worker on first use (`island-room-v1`, content-hashed URLs), never at install.

### Critters

`island/Critters.svelte` (shapes `critterTypes.ts`, 3D moves `critterMotion3d.ts`), `island/critters.ts`,
`island/critterPath.ts`, `e2e/critters.spec.ts`. NH species on the Tokyo clock, frequent, and the same on every phone
(ambient life's 10-second slots, `island/ambient.ts`, [backend](backend.md) "Ambient life"):

- **Who comes:** the sea holds a shadow off every stretch of the coast most of the time (`island/coast.ts` cuts the
  showable sea into one stretch per 450u of coastline, from the layout's tiles), and the front beach's bubbles come on a
  channel of their own beside its shadow; each fresh water its own shadow ([Pond](#pond)); and up to two roaming bugs at
  once (each on its own trunk or flower, or 40u apart). A fish's odds are its water's and the month's, hour's and sky's
  alone (`ambient.test.ts`). **Seasons are a flavour, not a gate:** any species in any month, 3× likelier in its NH
  northern months; hours still hold.
- **Where it is, is the world's** ([Shared world](#shared-world)): its seed picks the swim patch, the trunk, the flower
  or the grass, and every glide, hop, dart and landing at its time (`critterPath.ts`), so every phone has it at the same
  spot doing the same thing. Each phone shows it when its camera sees that spot. A catch or an escape is shared by the
  critter's id (first wins). A bug out of a bush, from under the rock or off my villager is a `put`.
- **Fishing** (`island/fishing.ts`, my line's state machine, pure and unit-tested; `critters.ts` waterAt / landing on
  the island's own tiles): a tap on any water, however far, casts there from where my villager stands, turning to it (no
  walk to the water; seated it stays seated). The float lands on the water tapped or the nearest within 12u; the line as
  long as it takes ([world3d-assets.md](world3d-assets.md) "Fishing"). A shadow within `NOTICE_U` (180u) of the float,
  with open water between, closes in, nibbles 1–4 times, then bites (the float yanked under, NH's 「！」 over the angler).
  While the line is out any tap but a door is the reel: on the bite it catches (`BITE_WINDOW_MS` 1 s from when the bite
  shows); earlier it scares the fish; with none it comes in. The line ends by itself only through a door, when covered,
  or at the day's turn. 1 in 14 a boot, tire or can. `e2e/fishing-taps.spec.ts`:
  every water point on screen casts. On the 3D island (`island/glide.ts`, `world3d/things.ts`) nothing pops: shadows and
  bugs fade in and out, a fish turns to the float, bumps it, lunges, darts off (`e2e/critters3d.spec.ts`); the 3D frame
  reads plain mirrors (`mirrorFish` / `mirrorBug`), not Svelte's proxies.
- **How the bugs move** (`critterPath.ts` bugPath, NH's paces, `FLY_UPS`, `PACE`): butterflies and moths flutter in a
  meander and land on a flower of their clump (`critters.ts` beds), a bee never lands, a dragonfly darts and hovers, a
  firefly drifts, a beetle flies in to its trunk, hoppers hop, crawlers crawl; none faster than a running villager
  (`critterPath.test.ts`). `bugLegs` is shared with the museum's bug wing. **Wings** (`world3d/wings.ts` FLAPS,
  wingBeat, `wingHinge`) turn in the vertex shader about a hinge from each model's geometry (`wings.test.ts`).
- **Fish** (all 34 of NH's sea and pier fish, `FISH`): NH's shadows by size (a fin for the sharks); the coelacanth only
  in rain or snow.
- **Bugs** (74 of NH's 80, `BUGS`), each where NH keeps it (flowers, water, trunks, palms, grass, the beach, under a
  chirping mound, at night the tarantula and the scorpion: a first tap rears one up, a second makes it charge off; a flea
  off my villager 1 in 10 taps, Apr–Nov). A tap nets one, judged where the 3D island draws it (`e2e/bug-taps.spec.ts`):
  within 30px nets it, within 56px startles it, as does my villager running at it within 70u (`critters.ts` fleesFrom).
  Left out: those NH's icons or our island can't hold ([decisions](decisions.md#nhs-calendar-and-critters)).
- **Diving** (`island/sea.ts`, NH's 40 sea creatures, loaded with the first bubble spot; `e2e/dive.spec.ts`): a spot of
  bubbles rises off the front beach now and then, on its own channel (gone after 30 s). A tap dives: still and slow
  creatures are caught at once; a medium one half the time, else its shadow darts off and a second tap in time
  (1.6 / 1.3 / 1.0 s) catches it; a very fast one gets away 1 in 3. 1 spot in 25 is a pearl.
- **The catch:** the official icon pops onto a plate with NH's catch line (`island/catchLines.ts`), loaded with the
  first critter. Every catch's and find's plate (mine, the partner's, the guest's) goes in one stack at the bottom centre
  (`island/catchStack.svelte.ts`, `island/CatchStack.svelte`), clear of the say button: the newest at the bottom, each
  fading on its own timer or a tap, at most 3. Nothing is held over a villager's head.
- **Cost:** each critter is a world node; one timer between visits; art on first need. World cues `scene-<kind>`
  ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`, `island/sceneDay.ts`, `e2e/finds.spec.ts`. The day's items derive from the
Tokyo date and time plus a seed, so every phone agrees; what anyone picks up, digs or opens is gone on all
([Shared world](#shared-world): a `pick`, first wins). The first of each shell, fossil and fragment is a ずかん `find`.

- **Seashells** (NH's eight; the summer shell rare, likelier June–September): one washes up every 60–120 s, the newest
  three lie on the sand.
- **Washing in** (`layout/swash.ts`): a shell, the bottle or a fragment that turns up while the island is open waits
  for the next wave at its stretch ([World](#world) "The sea's wash") and rides it up the beach, fading in. What lies
  there as the island opens just lies. `?find=washed` washes a bottle in.
- **Where things lie** (`beachSpot`): shells, fragments and the bottle keep 34u apart (`BEACH_GAP`), seeded per date.
- **Fossils** (all 73 of NH's, `FOSSIL_SETS`): **four dig spots a day** as in NH (`beach.ts` `DIGS_A_DAY`), each on
  one of the day's eight candidate spots (`layout/spots.ts` daySpots, seeded by the date), shown only clear of every
  control. A tap digs it up: 「化石を ほりだした！ アンモナイトだ！」. A dug spot stays gone till tomorrow. Each day stands
  alone (the relay keeps only today's claims).
- **Mushrooms** (`island/mushrooms.ts`): every November day 1–2 beside the trunks (1 in 8 October and December days),
  NH's weights. 1 in 20 November dig spots hold the rare mushroom. No `find`.
- **Message bottle:** every 8–14 minutes one rocks at the water's edge for 6; a tap reads its note (16 notes).
- **Star fragments:** each wish on a shooting star (`wished`) is one fragment on the beach the next morning (from 05:00,
  at most 8), now and then a large one or the season's zodiac fragment.
- **A balloon's present:** `put` where it lands; what's inside is decided at the tap and shown on every phone. A tree's
  present is the same, by its tree's id ([Shaking a tree](#shaking-a-tree)).

### Island care

`island/Care.svelte`, `island/care.ts`, `e2e/care.spec.ts` (no ベル, no find):

- **Weeds** sprout every 30–60 minutes on the day's free weed spots (15 from the layout's open grass, `layout/spots.ts`
  daySpots), the newest three at a time; a tap pulls one (`scene-weed`), gone on every phone.
- **Watering:** a flower tap is NH's watering can (`scene-water`); a flower watered today glitters for the day on every
  phone (`wateredOn`, the shared `watered` by `fl:<x>:<z>`). The flowers watered yesterday have a 1 in 4 chance of a
  hybrid on one of them today, the same everywhere (`care.ts` hybridsOf; `scene-garden`).
- **The rock** (on the health lawn): a tap clonks it with the shovel; 1 in 4 a sparkle, 1 in 8 a pill bug or a
  centipede crawls out (a `put`).
- Weeds, dig spots and the rock are measured clear of the controls on each screen.

### Pond

`island/pondFish.ts`, `island/critters.ts` (`freshWhere`, `freshAreas`), `e2e/pond.spec.ts`. NH's pond (`world.ts`
`POND`, lily pads and a slow ripple), the river and its mouth, and the spring and the river above the cliff.

- **Fresh water by where you cast** (NH's locations, `freshWhere`): the pond's 12, the river's 27, the mouth's 3 and
  the clifftop's 4; the river's own also come to the mouth and the clifftop. `FRESH` is its own chunk.
- **Visits:** as often as the sea's (their own slot), one shadow per water, 45 s if nobody fishes, at 0.65 of the sea's
  size, every point of its swim on that water's own tiles (`critters.ts` waterAt).
- **Its bugs:** the pondskater and diving beetle by day in summer, the giant water bug at night.
- **The catch:** a ずかん `find` of kind `fish`.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/ZukanCard.svelte`, `kiroku/zukan.ts`, `model/finds.ts`, `model/tally.ts`,
`e2e/zukan.spec.ts`. The ずかん is its own sheet (`kiroku/ZukanSheet.svelte`), opened from 設定's last row (設定 closes;
on its rows ‹ goes back to 設定, ✕ to the island): one row per kind with how many have been found (`ZukanCard`), a row →
that kind's page. Shared (the first `find` of anyone): 魚 80 (the sea's 34 and fresh water's 46), 虫 74, 海の幸 40, 化石 73
(laid out like NH's museum), かいがら 9, カタログ 1,836 (by NH's categories) and レシピ 126 (by season). Every catch and
pick-up counts: each found tile shows 「×12」, the picked entry its total and each person's (the day tallies:
[backend](backend.md#tally)). A kind's page: every entry in the game's order, icon and name when found, a silhouette and
？？？ otherwise, 「コンプリート！」 when all are in; its head (the picked entry: icon, name, 「7/4 ウェイが 見つけた」, NH's line)
is pinned. Names live in their own catalogues (`i18n/catch.ts`, `i18n/catalog.ts`), loaded with the ずかん or the first
catch; カタログ and レシピ build their grid a slice per frame.

### The museum

`museum/` (`MuseumRoom.svelte`, `engine.ts`, `plan.ts`, `species.ts`, `exhibits.ts`, `MuseumCard.svelte`),
`routes/museum`, `e2e/museum.spec.ts`. NH's museum (はくぶつかん) is a building on the layout
([island-layout.md](island-layout.md#the-islands-buildings)): NH's own model (StrcMuseumA02), 7 × 4 tiles, one to an
island, moved and turned in the editor, never removed. A tap walks my villager to its door and in (the door's iris);
‹ 島へ or the doormat comes back out.

- **Inside** (plan.ts, model units: a tile 10, a villager 16): one floor, NH's layout: the entrance hall (marble, stone
  walls with a gold cornice, red carpets, Blathers at his desk), the bug wing to the left (こんちゅう), the aquarium to the
  right (さかな). NH's own floors and walls (`scripts/world3d-models.ts --museum`), lit warm, dimmer at night.
- **No surfaces fighting:** no two faces share a plane (plan.ts wallEnds; geometry.ts decal and frameOf); surfaces.test
  checks it. The depth range is the museum's own (near plane just over its tallest top).
- **Like the rooms:** a tap on the floor walks my villager there (plan.ts walkPath: half-tile A*); a drag turns the
  camera, a pinch zooms, ⌂ puts it back; the camera follows my villager through the rooms, the walls cut away
  (engine.ts cutaway: the walls facing the camera and any hiding my villager, faded over 220 ms, dithered). The say
  button says a phrase in here only (`say` `sc: 'm'`).
- **The curator** (`curator.ts`, `lines.ts`): フータ (Blathers) behind his desk, the villagers' skinned model
  (villagers3d/blathers.glb), posed every frame by `mind()`: breathing, an owl's glances, blinks, a wing gesture every
  5–12 s; he watches my villager in front of him; alone for half a minute he nods off on his feet and wakes with a
  start. A tap perks him up and is his line in NH's balloon (island/Talk.svelte): his welcome first in a visit, then one
  of six (museum.curator.*), never the same twice running. Every joint keeps to its natural range (curator.ts `RANGE`,
  curator.test). On screen the hall draws at the exhibits' rate; off screen he's not stepped.
- **Who else is in:** the rooms' presence with the museum's scope (`tent` with `sc: 'm'`; store/where.svelte.ts `home`
  `M`). The guest comes in like anyone.
- **What's on show** (species.ts): one of each fish and bug in the ずかん's first finds (anyone's), the ずかん's alone,
  never the pockets' (selling takes nothing out: NH's donation). A tap: its card (MuseumCard: icon, names, who found it
  and when, ×n).
- **The aquarium** (`aquarium.ts`, `tanks.ts`, `boids.ts`): NH's three tanks (species.ts tankOf): the great sea tank,
  the dark deep-sea tank, the river tank in front; NH's park benches in the aisle (`seats.ts`, `rooms/seating.ts`: sat on
  as in the tent, the seat carried by the rooms' presence). **The hour's fish** (species.ts onDisplay): at most seven
  (PER_TANK) of each tank's caught species, shuffled by (Tokyo's date and hour, the tank): the same on every phone, new
  each hour (a 1.6 s dithered fade); the great tank always shows a caught predator if there is one. **Nothing clips**
  (tanks.ts bodyIn, FIT, backOf, openOf; tanks.test). **Swimming** (boids.ts stepSchool, NH's calm): long curving passes,
  turns bounded by size (turnOf), each species at its depth (bandOf), its tail beating with speed; walkers on the river
  sand (stepWalker); one InstancedMesh a species, culled by its tank (boids.test). **Feeding time** (`feeding.ts`, pure):
  where a predator is on show, schools of 6–10 generic feeder fish (never a ずかん species) come every 30–90 s; a hunt
  stalks, chases, lunges and bites about four times in ten; cosmetic and local (feeding.test, aquarium.test).
- **The bug wing** (`garden.ts`): NH's garden under glass: paths, a pond, oaks and a palm, flowers, props and five display
  cases. Each of the hour's bugs lives as on the island (species.ts habitatOf; `bugLife.ts`: the island's `critterPath.ts`
  bugLegs / bugAt and `world3d/wings.ts`, no copy), kept to its own enclosure so it never meets a prop or the glass, at
  1.9× NH's size (bugLife.test). **The hour's bugs** (`bugShow.ts` bugsOnDisplay): at most ten (BUGS_SHOWN) of the
  caught, shuffled by the hour, each in a place of its own (bugShow.test, garden.test); only their models load.
- **Performance:** the wings' exhibits are built once the finds are in (rebuilt only when a wing's list changes), models
  loaded per species; every frame moves only what's on screen; the exhibits step at the ambient rate, nothing while
  nothing on screen moves. Stands, bases, water, glass and frames are one mesh a material (geometry.ts batcher). Once
  everything is in, what isn't on screen yet is made ready while the hall is still (textures eight at a time, programs
  compiled: engine.ts warm; paused while the page is hidden). Its models stay loaded across visits, as the tent's
  furniture does (world3d/modelCache.ts: the 64 last used of those unused; each visit's GPU copies go with its renderer).
  On WebKit its models' textures are plain images, not ImageBitmaps (world3d/gltf.ts `glbLoader({ plain })`: WebKit
  uploads ImageBitmaps ~10× slower); the island keeps its ImageBitmaps. A rebuilt wing keeps its
  programs (engine.ts `retired`: the old wing disposed only after the new one's materials compiled;
  `npm run leak -- rebuild`).
- **Never a blank frame:** the canvas's buffer is resized only just before a draw, in the same task (engine.ts draw),
  since WebKit shows a cleared buffer until the next draw.
- Its music: [Place music](#place-music).

### First person

`rooms/firstPerson.ts` (the shared math and the glide), `rooms/gesture.ts`, `rooms/EyeToggle.svelte`,
`store/firstPerson.svelte.ts`, the tent's and the museum's engines (`firstPerson`, `look`), `e2e/first-person.spec.ts`.
In the tent, the homes and the museum the eye button (bottom left, yuzu while on) puts the camera at my villager's
eyes, and back. Kept on this phone (`island.fpv`; `?fpv=1|0` for a tab); local only. Off during もようがえ.

- **The eyes:** the model's own eyes (villager3d `eyes()`, riding the head bone; a card's at 0.7 of its height), the
  walk's bob damped. The eye follows the head for 0.9 s after it last moved, then holds (`headAnchor`), so the idle's
  breath never moves the camera. Kept 3 u off the walls, out of what stands taller, within the floors (`clampEye`). My
  villager's body is hidden near the camera.
- **The lens:** 70°, near plane 1 u.
- **The glide:** 450 ms both ways, from the room's view to the eye. Through a door the eyes come at once.
- **Closed rooms:** at the eyes every wall stands, and the first person's own pieces show: a ceiling over each room
  (unlit, dimmed at night), a lintel over each opening, a closed door in each doorway (a tap goes out).
- **The finger** (`rooms/gesture.ts`, one rule at the eyes and off them): a tap is a finger lifted within 10 px under
  500 ms, acting where it lifts (a villager, piece, seat, door, the curator, an exhibit; else the floor walks; else a
  boop). Past 10 px it's a drag: the camera only, never a walk. Held longer: nothing. A second finger: a pinch (at the
  eyes nothing).
- **The head:** only a drag turns it (0.18° a px on a phone; pitch ±60°, eased 45 ms, no inertia). It starts where my
  villager faces; after that a walk never turns it. The body faces its walk; standing, it turns to where I look; seated,
  only the head. No pinch, no zoom, no ⌂. A tap walks to the floor under it from the eyes' camera; the museum's taps
  stop at the first wall on the ray. My balloon stands at the view's foot.
- **Cost:** frames only while the glide, the head, the eye or a walk moves; at the eyes a wing's exhibits are drawn only
  while its opening is in view.

### The shop

`shop/ShopRoom.svelte`, `shop/stock.ts` (buyPiece), `routes/shop`, `contract/shop.ts`, `contract/stock.ts`,
`contract/shopPrices.ts` and `buyPrices.ts` (`npm run shop:prices`), `model/shop.ts`, `store/actions.ts` (sell),
`e2e/shop.spec.ts`. NH's Nook's Cranny (タヌキ商店) with its own
money, かいがら (shells), never ベル ([decisions](decisions.md#the-shops-かいがら)): the island's catches sell
for them and buy furniture for the rooms. Each person's own pocket and かいがら, the guest's too.

- **Inside:** a screen, not a 3D room (a counter, lists and prices; a walking room would add nothing and cost another
  three.js scene): honey wood walls, the sign, a window with the sky, まめきち and つぶきち behind the counter, their line
  in a cream balloon, and NH's counter menu under it. My かいがら top right; ‹ 島へ goes back out. While I'm in here my
  villager is nowhere on the others' islands (`tent {in, sc: 's'}`).
- **うる** (sell): my pocket, everything I caught, found or picked up (my day tallies, model/tally.ts) less what I sold,
  in sections (虫, 魚, 海の幸, かいがら, 資源, 果物, 化石, その他: `shop/pocket.ts`), dearest first. A tap picks one more, −
  one less, ぜんぶ all; the bar says 「3こで 120 かいがら」 and うる sells (one `sell` a kind). Selling never takes anything
  out of the ずかん or the museum. A present's furniture or recipe never sells, nor a message bottle. An empty pocket
  opens the shop on かう.
- **What a pocket holds** (`contract/pocket.ts`, one table: kind, id, names, icon, price): every collectible: fish,
  bugs, sea creatures, shells, fossils, star fragments, and the goods (`goods:<id>` tally keys: wood, branches, weeds,
  fruit, coconuts, mushrooms, Bunny Day's eggs, junk off the line).
- **かう** (buy): today's stock, 24 pieces of NH furniture a Tokyo day (`shop/stock.ts`): the day's order of the price
  list (seeded by the date and the island's seed) less every piece the island had by the day's start, the shared
  ずかん's furniture finds (presents, tree gifts, digs) and anyone's buys, so both phones agree all day and a find today
  leaves it till tomorrow. No いつもの (folded in: all three were furniture). Fewer when the island has nearly
  everything; none, 売り切れ. Each with its icon, name and price. A piece I own says もってる. The bar's 全部 picks every
  piece I don't have yet: the bar and the twins say the count and total (「ぜんぶ 23こで 5,026 かいがらだも！」), 買う buys
  them at once (one undo), then every tile says 持っている and the bar 「すべて持っています」. Short of the total, the twins say
  by how much and 買う only boops: never a part of the lot (which part would be the shop's pick, not mine; one at a time
  does that). The record keeps the lot all or none (`events` group: [backend](backend.md#api)). A bought piece is mine for
  good in もようがえ (the かった tab, or かべかけ for a wall piece) in every room I arrange.
- A sell or a buy shows at once with 取り消す for 5 s, then goes to the record, which checks it (the pocket, the
  wallet, the stock's day, the price: [backend](backend.md#events)).
- **Prices:** NH's Bells ÷ 20 both ways (a sell at least 3): a sea bass 20, a koi 200, a whale shark 650, wood 3; a
  median piece 130 (745 pieces: every room model NH sells for up to 100,000 Bells), one or two catches.
- **The building:** NH's Nook's Cranny, 7 × 4, one to an island, moved and turned in the editor, never removed
  ([island-layout.md](island-layout.md#the-islands-buildings)); the only way in.

### Dialogue

`island/pager.ts`, `island/Talk.svelte`, `island/Plate.svelte`, `e2e/dialogue.spec.ts`. The speech balloon and the catch
plate read like NH's box: 33 ms a glyph, two lines a page. A tap finishes the page, the next turns it, the last closes
it; an orange ▼ bobs while another page follows. Left alone a page turns after 6 s. The name tag is tilted on its
top-left in the speaker's NH colour. No voices. Multi-page: some lines go on (`<key>.more`), a visitor's first tap is
their introduction, a first find adds 「ずかんに のったよ！」. A line may end on NH's answers (Jack, K.K.).

Where it stands, one rule for every speaker (`placement.ts` `placeBy`, `e2e/bubbles.spec.ts`): by the speaker, its tail
pointing at them, at most 40px off: above the head when there's room, else beside, else below. Room gives way step by
step, nearness doesn't: clear of every control, else over the island's things but not the villagers, else over them too.
Never over the HUD, しずえ's box, a popup, the speaker, or off the scene. It follows a speaker who moves and closes if
they go. While the camera moves every balloon stays whole, carried with its speaker by a transform
(`island/balloonFollow.ts`: `World.frameOf` or a room's projected head; no layout read in the frame), then is placed
again by the rule. Captions (`place`: the wish, K.K.'s) keep clear of every control; the catch plates stand in their
stack ([Critters](#critters) "The catch"). Everything keeps 12px (`EDGE`) from the screen's sides and foot. The catch
plate is one plate for every discovery; the captions share one pill (`.if-caption`).

### Villager taps

A tap on my villager is a squish and the tap sound (seated, where it sits), and in NH's flea months now and then a flea
hops off ([Critters](#critters)); nothing opens.

**Phrases:** the say button ([Island](#island)) opens the phrase picker above it (`island/SayButton.svelte`,
`island/SayPicker.svelte`, `island/say.ts`, `e2e/say.spec.ts`): a small cream card, 「なにを いう？」 and ✕, my own last four
(newest first, kept on this phone: `island.says`) and 「じぶんで かく…」 (a field of at most 20 characters, cut only when
the IME isn't composing; もどる and いう; Enter sends). No presets: only my own words. With nothing kept it opens on the
field. ✕, Esc or a tap elsewhere closes it (on the ground that tap only closes). A pick hops my villager and shows the
phrase in its balloon for 4 s (`island/Says.svelte`: the name on a tag in the person's colour; text, never markup; taps
go through it); a newer one replaces it. Every other phone shows it too (the relay's `say`, presence only, at most one
per 1.5 s). The speech balloon (`island/Talk.svelte`) is for the visitors and the curator. One balloon at a time.

A tap on the partner's villager is a **ハイタッチ** at once, in place: they stop (woken first if asleep), a sparkle flies
from my villager to them, both turn and hop, hearts as it lands; 「うめさんに ハイタッチ！」. Over the relay only
(`highfive {at}`, the tap's relay time): their phone plays the same moment from the same start (「ウェイさんからハイタッチ！」).
Closed, their phone hears it when it opens (the room holds the last one per pair, a day at most); each heard once
(`island/highFives.ts`). A tap while one is under way adds nothing. Off screen, the edge chip (「うめの ほうへ」) brings
the camera to them.

### Players

`scripts/players3d-models.ts`, `components/player3d/` (`player3d.ts`, `tune.ts`, `parts.ts`, `skin.ts`,
`portrait.ts`), `contract/partIds.json`; the conversion and its notes: `design/avatar/tech-notes.md`,
[world3d-assets.md](world3d-assets.md). A and B are NH's human players by default (`contract/look.ts` DEFAULT_LOOKS),
assembled at runtime from parts converted from the game files: the body (once per page; skin and hair colours are
tints), the faces as atlases swapped by texture offset (eye colour through each eye's iris mask), one GLB per part
mesh bound to the body's joints by name on one skeleton (`skin.ts`), one WebP per item (a KTX2 too for the bundled
closet's). Every hairstyle, eye and mouth and every garment that wore cleanly is converted (4,338 items, ~23 MB in 44
packs under `/room/player/`, lazy; an outfit ~60 KB over the body): [world3d-assets.md "Players"](world3d-assets.md#players). Hats sit at NH's brim with NH's cut-down hair; hair ornaments at each
hairstyle's measured spot (`ORNAMENT_ON`).
- **The part table:** per item its slot, mesh, textures, colour line, swatch and closet icon. The whole table
  (`static/room/player/parts.json`, ~1 MB) is fetched only when a look wears a part the bundled first closet
  (`components/player3d/parts.json`) lacks (`parts.ts covers`, `loadParts`). `contract/partIds.json` is every id the app
  has, so a look naming an unknown part reads as いつもの's.
- **The runtime:** `createPlayer(id, look, asset('/room/player'), seed)` → a `Player3D`: villager3d's `Villager3D`
  interface (the same the island, the rooms and the museum use) plus `dress(look)` (changes in place only what differs)
  and `look()`; a part it can't have (offline, never fetched) is drawn as いつもの's (`wearable`), and it rejects only
  without the body (keep the stand-in). Faces map faces.ts's expressions (tune.ts); poses
  are poses.ts's, unforked (`animateModel` with a rig Kind). `portrait(renderer, player, size, bg)` draws the head with a
  renderer the page already has. `design/avatar/player3d/check.ts` draws the runtime in headless Chrome.

**Who draws a person** (`components/person3d/person3d.ts`, `e2e/players.spec.ts`): `person3(who, look, villagerPref,
dirs)` is the one seam between the look a person wears (`store/look.ts` `lookOf`) and the model a scene stands up: a
player look → `createPlayer` (its villager as the stand-in if a part can't be had), a villager look → the roster
villager. Keyed by the look: the island, the rooms and the museum swap a model in place when it changes. `dispose()`
also disposes skeletons. **The 2D heads** (`characters/Avatar.svelte` `worn`: きろく, ずかん, the museum's finder, the
pickers, the purchases, the harvest, the toasts, the edge chip) show the look worn: a player's portrait
(`look/portraits.svelte.ts`), the flat stand-in till drawn, or the villager's icon. The island's renderer draws missing
portraits when idle or under a sheet (`person3d` `createPainter`, `useIdlePainter`). `npm run leak -- look` swaps looks.

### Visitors

`island/Visitor.svelte`, `island/visitors.ts`, `e2e/visitors.spec.ts`. NH's visitors, one at a time, each NH's own 3D
model (a character with none never comes), seeded by the date: **Daisy Mae** on Sunday mornings 05:00–12:00, and
Monday to Saturday one of NH's weekday visitors (`ROTATION`, each at most once a week, about one quiet day in ten):
**Kicks**, **Label**, **Saharah**, **Leif**, **Redd**, **C.J.** and **Flick** 06:00–22:00, **Gulliver** 06:00–18:00,
**Wisp** 20:00–04:00 (none on Saturday from 18:00: K.K.'s show, [K.K. on his stool](#kk-on-his-stool)); **Jack** on
Halloween night, **Celeste** on a meteor shower's night, the holiday hosts and the wedding couple on their days.
Priority (`visitorAt`): the event's host, the wedding couple, Celeste, (Saturday evening: nobody), Daisy Mae, then the
day's. `?visitor=none`: nobody. They stand on centre stage (`stageOf`: where we put **おきゃくさんの ばしょ** in the
editor, else derived), converted and posed as the villagers are (`scripts/villagers3d-models.ts`, `VISITOR_ONLY`;
`world3d/villagers.ts` slot `visitor`); **Gulliver washes up on the front beach** (`washedUp`: **ジョニーの ばしょ**),
face down (villager3d's `prone`). A tap: my villager turns to them, their introduction the first time, then a line. No
trading, no ベル.

### K.K. on his stool

`island/KKSlider.svelte`, `island/kkSlider.ts`, `e2e/visitors.spec.ts`, `e2e/visitor-life.spec.ts`. K.K. Slider
(とたけけ) lives on the island on his **stool**: a layout piece (`kk-stool`, id `kk-slider`; one on the island, never
removed, moved and turned in the editor; its front tile kept clear). The default stands on まえ's lawn west of the main
path. He's no visitor (never in the schedule); NH's model (loaded the first time he's in view) sits on NH's log stool a
size up (`KK_STOOL_H`), placed from the piece's middle and yaw (`kkSpot`, `objMid` / `yawOf`) on the ground the stool
stands on. What he's up to goes by the Tokyo clock (`kkMode`; `?kk=show|day|asleep`):
- **His show, Saturday 18:00–24:00** (NH's concert): a tap is his greeting with NH's choice box, **リクエスト** (two songs,
  or ほかの 曲) or **おまかせ**. The island's music stops for the song ([K.K. Slider](#kk-slider)), he strums harder, ♪
  float up, the villagers sway and a caption sits by him, on every phone. A tap mid-song offers ストップ / つづけて. At its
  end his sign-off and the island's music returns.
- **By day** (06:00–24:00 the rest of the week): he strums quietly, no sound; a tap is a chat that offers a song all the
  same (a resident who played only once a week would be scenery).
- **Asleep, 00:00–06:00:** nodded off (villager3d's `nap`); a tap wakes him and he offers one all the same, then sleeps.
- **Anyone, any time:** A, B and the guest alike; with ミュージック off, picking a song turns it on on that phone. **The
  song is everyone's**: it plays on the island's music stage ([Shared music](#shared-music)), heard on every phone
  outdoors from the same point; anyone's ストップ stops it for all; a phone opening mid-song comes in where it is. Where
  it can't be heard his caption reads 「♪ title 🔇 タップで きく」 and his menu offers きく. Usage counters
  `act:kk.tap.<mode>`, `act:kk.song.<mode>`. A tap turns my villager to him (no walk).

### Visitors: life

`island/visitorLife.ts` (pure), `island/Visitor.svelte`, `island/avatar.ts` (`meetVisitor`, `visitorRoute`),
`e2e/visitor-life.spec.ts`. The visitor is the stage director's fourth actor (`'visitor'`), with a beat on every idle
slot from the slot's PRNG.

- **Always:** the villagers' idle pose; the director's motions are its actions.
- **Signatures (NH):** Wisp floats in his glow; Jack twirls; Daisy Mae hums; Franklin flaps; Jingle hops with a
  sparkle; Zipper hops; Celeste points when a shooting star crosses; Reese and Cyrus side by side, hearts; the others
  nod, pose, hum, sway or look about.
- **Gulliver** sleeps face down (zzz, a twitch). A tap is a nudge and his sleep talk; the **fifth** wakes him: he gets
  up and introduces himself (awake for the day).
- **A beat** (`pickAct`): the signature, an emote, a look at the nearest villager, a stroll for those who roam, or at
  most every 45 s **the partner comes over** (one walker at a time). Nothing while their line is up.
- **Strolls:** Daisy Mae, Leif, C.J., Flick, Franklin, Zipper and Celeste amble to a nearby walkable spot and back 4–7 s
  later.
- **A tap:** my villager turns to them; the visitor walks back to its spot, turns with a hop and speaks.
- **Arriving and leaving** with the island open: walkers come from the campsite and go back, Wisp floats, Celeste flies
  (`liftNow`), Gulliver appears, Jack in a puff. On a page's first paint they're simply there.
- **Cost:** one more skinned character on the villagers' code (its GLB ≤ 100 KB, loaded on first visit).

### Halloween

`island/events.ts`, `island/Halloween.svelte`, `e2e/halloween.spec.ts`. NH's Halloween on Oct 31 (Tokyo): NH's pumpkins
on the lawn all day; 17:00–24:00 they light up under a purple-to-orange wash and **Jack** comes. His 「トリック オア
トリート！」 ends on NH's answers: 「キャンディを あげる」 delights him; 「なにも あげない」 is his trick (party nose glasses on
my villager for a minute). Three Halloween lines join the villagers' chats.

### Holiday hosts

`island/events.ts`, `island/visitors.ts` (`HOSTS`), `island/eggs.ts`, `e2e/holidays.spec.ts`. Each NH holiday is one
date rule in `events.ts` (`nthWeekday`, `easter`); its host takes the visitor slot with an introduction, four lines and
two villager day lines:

- **Franklin**, Turkey Day (the fourth Thursday of November, 09:00–24:00): he asks for a fish; the next fish caught that
  day (`island:catch`) makes him happy (`scene-franklin`).
- **Jingle**, Toy Day (Dec 24, from 05:00), beside the decorations.
- **Zipper**, Bunny Day (Easter Sunday; the seven days before are the celebration). All week NH's eggs turn up: a
  balloon drops a sky egg 1 in 3, a dig spot an earth egg 1 in 4, the line a water egg 1 in 6.

### Birthdays

`island/birthday.ts`, `island/Birthday.svelte`, `island/Cake.svelte`, `villagers/birthdays.ts`, `e2e/birthday.spec.ts`.
Ours come from `PEOPLE` in `config/rules.ts` (null turns one off; Feb 29 falls on Feb 28). On one: both villagers wear
NH's birthday hat; NH's cake stands by centre stage, its candles lit; confetti the first time that day
(`scene-birthday`); しずえ's greeting. A tap on the cake plays NH's ハッピーバースデー on the island's
[shared stage](#shared-music) (`ev-happy-birthday`) and the candles go out for the day on every phone. Each goal the
birthday person meets pops a party popper. An NH villager's own birthday puts the hat on it.

### Wedding countdown

`island/wedding.ts`, `island/Wedding.svelte`, `e2e/wedding.spec.ts`. The wedding date is the けっこんしき board's `date`
setting ([wedding.md](wedding.md); `time/holidays.ts` `weddingDate`); the island, its weather and its music read that
one date. On the milestone days (365, 200, 100, 50, 30, 7 and 1 days to go, and the day) Reese and Cyrus are the
visitor 06:00–24:00 under a heart float, Reese's introduction ending on the count. On the day the villagers bow and
glow, confetti (`scene-wedding`) and fireworks from 19:00. Every June Sunday NH's wedding arch stands behind centre
stage.

### Celeste and meteor showers

`island/meteor.ts`, `island/visitors.ts`, `e2e/celeste.spec.ts`. About one night in ten, at most one a week (seeded by
its Monday): Celeste visits 20:00–04:00 and shooting stars cross every 3–8 s. Her lines explain wishing, the fragments
and the season's sign. Each wish is a fragment the next morning, the zodiac one twice as likely.

### Shooting stars

`island/stars.ts`, `island/SceneTaps.svelte`, `e2e/sky.spec.ts`. On a clear night (19:00–04:00): every 3–8 minutes of
on-screen night 1–3 streaks (1 in 6 a shower of 5–8); a meteor shower's night one every 3–8 s. A quick white streak to
the lower left, clear of every control. **A wish:** a tap in the sky while one crosses: sparkles, a chime
(`scene-wish`), 「ながれぼしに おねがい！」, and a fragment the next morning.

### Fireworks

`island/fireworks.ts`, `island/Fireworks.svelte`, `e2e/sky.spec.ts`. Every Sunday in August 19:00–24:00; New Year's
countdown (Dec 31 23:00, a volley at midnight, the show until 01:00); the wedding night from 19:00; and a volley of 3–5
the evening both of us meet all four goals (once a day per phone, from 18:00). A shell rises from behind the island and
bursts in NH's colours, each burst clear of every control; a tap in the sky during a show sends one more. ≤ 4 bursts at
once, one timer between them.

### Group stretching

`island/stretching.ts`, `island/TapeDeck.svelte`, `motion/stretch.svelte.ts`, `e2e/radio.spec.ts`. NH's tape deck (a
fixed layout piece, NH's boom box) plays on a day either of us met 🍑 Exercise, or when the island is opened
06:00–08:00 (`scene-stretch`). A tap plays NH's ラジオ体操 on the island's [shared stage](#shared-music) (`ev-aerobics`)
and everyone's villager awake on the island (the guest's too) and an awake visitor do NH's three stretches together
(villager3d `warmup`, `sidebend`, `jump`) on every phone; event reactions wait (`holdEvents`). Then it's done for the
day; any other time a tap says when it plays.

### ききみみ クイズ

English listening for the players (A, B and the guest), for Japanese speakers learning English: the quiz, its hub,
engine, audio and sync are [kikimimi.md](kikimimi.md), speaking [kikimimi-mic.md](kikimimi-mic.md), the content
[curriculum.md](curriculum.md). On the island: the menu's 英語 pill opens a full-height sheet
(`components/kikimimi/KikimimiSheet.svelte`, lazy); the tap itself starts the voice session
(`invite.svelte.ts` wakeQuizVoice → `voiceSession(true)`), so clips play with the silent switch on; the 3D island is
paused under it. `KikimimiHost.svelte`, always loaded in the island scene, listens on the scene's one Live and shows
another's lobby as a toast (「ウェイが ききみみに さそっています」 [さんか]); the pill reads 「誘われています！」 with a coral dot on
the folded leaf meanwhile. Closing ends the voice session and drops every decoded clip.

### Trips

りょこう, the trip guides (data, relay and maps: [travel.md](travel.md)), in the [unified kit](#unified-kit). The menu's
旅行 pill opens a full-height sheet (`components/travel/TravelSheet.svelte`; its own chunk, a `lazySheet` mounted by
`island/Hud.svelte`), the island paused under it.
- **Opening:** straight into the trip on now, else back where it was left.
- **Offline:** the chunk not cached yet, a banner 「オフラインです」 + もういちど; a private value not in yet shows 🔒 ・・・.
- **The list** (`TripList.svelte`, from `trips/meta.ts` only): これからの旅 (soonest first) and これまで, a boarding pass
  each (`Pass.svelte`: the `--c-sky` strip 「✈ しまの そら便 · SHIMA AIR」, TYO ✈ the trip's `code`, the cover, dates; the
  torn stub 「あと 97 日」 / 「明日」 / 「いま 2 日目」 or a past trip's 「行ってきた」 sticker). The km | mi switch at the left of
  the title bar (this phone's, `DEVICE.travelUnits`, never synced: `units.ts`).
- **A trip** (`TripView.svelte`): ‹ ✕ on the PhotoBand, then a TabBar 日程 · 地図 (with a route) · キャンプ場 (with
  campsites) · 持ち物. 日程: a chip a day and 準備; the day shown (`DayCard`: date, title, route; a hike's photo, a
  StatStrip, 「トレイルで見る」 opening トレイル's trail); the timeline (`Rows`: time, a dot on a dashed spine, text, note). The
  trip's clock is its own `tz` (`when.ts`): the day on now first, its row now lit (or 「次」).
- **地図** (`MapPane.svelte`): the day chips and the map, the day's stops in a dense card; a row flies the map there, a
  pin scrolls to its rows. Locate at the bottom right; a layer button where the trip has candidate places; the save
  pill at the top-left.
- <a id="offline-maps"></a>**Offline maps** (`components/offline/SaveButton.svelte`; data: [backend](backend.md)
  "Service worker"): one pill per area, over the trip map and every trail's map: 「⬇ オフライン用に保存（20.5 MB）」 →
  「× 保存中… 42%」 → 「✓ 保存済み · 20.4 MB」; 「一部のみ · もう一度」, 「消えました · もう一度保存」; an OpenFreeMap area past 30
  days 「保存済み · 更新」. A save that can't start says why (オフライン, 合計 150 MB, 空き容量, ほかの地図を保存中). A trash pill
  beside a saved area deletes it. Offline with the area saved, 「保存した範囲のみ」; the credit stays visible.
- **キャンプ場** (`CampList.svelte`, `camps.ts`): one ChipRow (すべて · 無料 · 有料 · ビーチ · トイレ · シャワー), the sites in
  one dense card; a row opens its card (`CampSheet.svelte`).
- **持ち物** (`PackList.svelte`, `packView.ts`): my 「12 / 35」 and the bar, 編集; a card per category (its NH item:
  `packView.ts` CAT_ART), a row per item: my `Tick` (each person ticks their own), who has packed it at the right. 編集:
  an ActionSheet per row or category, 「＋ 追加」, カテゴリを追加, チェックをリセット (mine only). The guest changes only what it
  added. Deletes act at once with 取り消す; a category's and the reset ask first.
- **A trip that's over is read-only** (`when.ts` `readOnly`): 持ち物 frozen as the seed list (`packing.frozen`, a
  「終わった旅」 sticker); nothing else editable.
- **The guides bend [Simplicity rules](#simplicity-rules):** they are reading cards, denser than a screen otherwise
  allows. Their text (`.guide`) breaks only between words (`Txt.svelte`: a `<wbr>` between Intl.Segmenter's words).

### Seasonal look

`ui-state/preview.ts` (pure: `resolvePreview`, `lookFrom`, `shownAt`), `ui-state/preview.svelte.ts`,
`panel/SeasonSection.svelte`, `island/PreviewPill.svelte`, `e2e/preview.spec.ts`, `e2e/season-shared.spec.ts`. 設定's
**季節** shows the whole island another day's look, on every phone at once: an event, a season (春 / 夏 / 秋 / 冬), the
weather and the time of day (朝 / 昼 / 夕方 / 夜), each **自動** by default. Anyone sets it, the guest too; it stays until
someone sets it back. Folded to one row (自動, or what's forced, and **自動に戻す** while anything is). **天気** is one group
for both the look and [Weather](#weather)'s switch: 自動, ゲーム (`pref weatherMode`), 晴れ / 雨 / 雪. It's the record's:
`pref seasonLook` (`{event, season, weather, tod}` or null, one island-wide slot, the last anyone set), bound into
ui-state by the root layout (`bindLook`). One resolution feeds every seasonal look: the dev params (they win, field by
field), the setting, then what the event implies.

- **Events:** うめの たんじょうび, イースター, さくら, はなび, ウェイの たんじょうび, けっこんしき, ハロウィン, もみじ, ハーベスト
  フェスティバル, せいなる よる, りゅうせいぐん. An event brings its day's look (`EVENT_DAY`) and, for the evening ones, the
  night sky.
- **What follows it:** the theme, the weather's look and music, the music's hour and event (`shownAt`), `eventAt` for
  the scene, the visitor, the fireworks, the shower, birthdays, the wedding, the particles and decorations, the hedges.
- **What never does:** the scene clock (`?date=` only), the days records are keyed by, and what the island yields:
  critters come by the real month and weather (`yieldSky`), eggs and mushrooms by the real day, and a wish brings no
  fragment while it's on.
- **On screen:** a chip under the HUD row says what (「きせつ: ハロウィン」); a tap on it goes back to the real day for all.

### Dev params

Read on each call by `island/devHooks.ts` (the seasonal ones by `ui-state/preview.ts`). The island's hooks work in dev
builds or with `?demo`; `?date`, `?theme` and `?season` work everywhere:

| Param | Effect |
|---|---|
| `?demo` (`=harvest`, `&as=B\|G`, `&weeks=60`, `&health=none\|zero`) | Made-up data, no backend; the harvest recap; play as B or the guest; a longer history; no Health rows / no-watch days |
| `?date=YYYY-MM-DDTHH:mm` | The scene clock (Tokyo), this page load only (it moves the shared day too) |
| `?theme=dawn\|day\|dusk\|night`, `?season=` | Preview a time of day or a season |
| `?seed=` | The island's seed (finds, weather, visitors) |
| `?weather=clear\|cloudy\|rain\|heavy\|snow\|fog\|aurora\|rainbow` | Force the weather (the critters' too) |
| `?wx=real\|game` | The island's weather mode for this load |
| `?wx=rain-pm\|clears\|typhoon\|snow\|fog\|cloudy\|stale` | A canned real-weather timeline (`island/wxFixtures.ts`) |
| `?event=<id>` | Show an event (the preview's ids: `halloween`, `cherry`, `birthday-A`, `wedding`…) |
| `?visitor=<id>\|none\|events`, `?arrive`, `?leave=<ms>`, `?stroll[=<ms>]`, `?meet` | A visitor (`events`: an event's host only); its arrival; its departure; a stroll; the partner's hello |
| `?kk=show\|day\|asleep` | K.K. on his stool, whatever the clock |
| `?critter=fish\|pond\|<fish>\|<pond fish>\|<bug>\|none`, `&coast=front\|back\|left\|right`, `?sea=<id>\|pearl`, `?flea` | A critter now (ambient visits off), a sea fish off that side; a dive spot; a flea on every villager tap |
| `?shake=nest\|branch\|bagworm\|spider\|coconut\|wood` | The next shake drops that |
| `?rock=clonk\|sparkle\|bug` | Every rock tap has that outcome |
| `?find=bottle\|fragment\|mushroom\|rare-mushroom\|earth-egg\|washed` | A beach find now / every dig spot that / a bottle washing in |
| `?balloon`, `?fireworks`, `?shower`, `?stretch`, `?hybrid` | A balloon (`=none`: never); a show; a meteor shower's night; the tape deck; a hybrid flower |
| `?hit` | Every tap target drawn over the island |
| `?fpv=1\|0` | The rooms' first-person view for the tab |
| `?awake`, `?grace=<ms>`, `?wake=<ms>` | Everyone counts as online (no villager sleeps); the [Sleep](#sleep) grace and a tap's wake that long |
| `?idle=none`, `?stars=none` | No idle beats; no ordinary night's shooting stars |
| `localStorage['e2e.ambient'] = 'off'` | The e2e's ambient life off (e2e/fixtures.ts): `critter=none`, `visitor=events`, `balloon=none`, `idle=none`, `stars=none` unless the URL sets them |
| `?relay=<wss url>&key=<key>` | The demo over a real relay (`e2e/sync-harness.spec.ts`) |
| `?quietafter=<ms>` | How long a phone gone quiet inside a room stays shown there |
| `?render=none` | The 3D engines run but draw nothing (the e2e's logic mode: `ui-state/testMode.ts`) |

Anywhere: `?panel=rewards` opens ごほうび at once; the 3D island's renderer takes `?dpr=<ratio>`, `?aa=0\|1`,
`?shadows=0\|1` and `?ambient=<fps>`. The editor's params: [island-layout.md](island-layout.md). The live island sets
`window.__world` (`cam()`, `go(z)`, `at(x, z)`, `put(x, z)`, `idle()`, `quiet()`, `perf`, `stops()`, `mine()`,
`partner()`, `geo()`, `site()`, …) for the e2e and the console (e2e/island.ts wraps them).

## Motion

- **Rig** (`Villager.svelte`, `Host.svelte`): `.actor` › `.face` (facing) › `.body` (one motion) › the art; emotes and
  fx beside `.face`. What sits on a render's head (the birthday hat, Jack's glasses, a swollen eye) goes by
  `villagers/heads.json` (`npm run heads`). The director (`motion/director.svelte.ts`) holds one state per actor (mine,
  the partner's, しずえ, the visitor); `holdEvents(ms)` queues event reactions behind a routine.
- **Primitives:** `if-` keyframes in `tokens.css`; durations in `MOTION_MS` (`motion/reactions.ts`) must match.
- **Marks:** villagers get floating marks (`Mark.svelte`) or official glyphs; しずえ the cream bubble (`Emote.svelte`).
  Effects (`Fx.svelte`) remove themselves.
- **Reactions** (`REACTIONS`, R1–R19): first open, the partner's day growing, high-fives, a goal met, all four met,
  taps, waking, a low week (Thu–Sat), a sync problem, the harvest. Never on first render; pages `emit(…)`
  (`motion/bus.svelte.ts`).
- **Idle life** (`motion/idleLife.svelte.ts`): on ambient life's 10-second slots (`island/ambient.ts`, the relay's
  clock), so every phone plays the same: each slot one villager does one small thing or sets off on an outing, or both
  chat or dance; one slot in three after 3 min idle, stopped after 10 min; paused while hidden or covered. Only a
  villager whose person isn't on the island goes on outings; one its person just walked is left alone 2 min.

### Walking

`island/walkGraph.ts`, `island/nav.ts`, `island/tapWalk.ts`, `island/wander.ts` (pure), `island/avatar.ts`,
`motion/director.svelte.ts` `walkTo`, `e2e/movement.spec.ts`, `e2e/world.spec.ts`, `e2e/tapwalk.spec.ts`.

- **Only empty ground walks my villager:** a tap on something to do (a tree, a bush, a flower, the rock, a weed, a
  find, a bug, a fish shadow, the bubbles, the water, the tape deck, a visitor, the partner) acts in place: my villager
  turns to it and the action plays at the target, its tool there. The exceptions, walked up to: the doors, the board, a
  seat ([World](#world) "Sitting on a tap").
- **Tap-to-walk** (`tapWalk.ts planTap` over `nav.ts`): my villager runs there (300 u/s), over the bridge and up the
  stairs. A tap on ground it can't stand on snaps to the nearest walkable point within 40u; unreachable ground to the
  nearest reachable point. Water never walks (it ripples); a building's footprint knocks at its door. A cream ring marks
  the spot. The relay keeps each person's last walk, so a phone opening later puts their villager where they sent it.
- **Where my villager is, kept** (`avatar.ts` startAt, `e2e/positions.spec.ts`): the island opens with it where it last
  stood (`island-stay.<who>`), however long after. Only a player never placed starts at home.
- **Never a teleport on another phone:** a big gap glides off at the run within 1.5 s while in view (villagerSync
  `playPartner`); only a phone opening, or the island hidden, puts it there.
- **The camera never moves for a walk:** only the finger scrolls.
- **A phone gone** (closed, hidden, offline, for any time): its villager stays where its last walk ended, on every phone
  (the relay carries each person's last walk into each new day), asleep there ([Sleep](#sleep)).
- **Sheets and hiding:** a sheet stops everyone; uncovered, the outings wander back; hidden over 30 s, they're back on
  return. A balloon opens only over a villager standing still.
- **Walk mask** (`walkGeo`): land, the bridge's deck and the stairs; not water, cliffs, footprints, trunks, the rock,
  bushes or props. Rasterised once on a 4u grid; named nodes and the obstacles' padded corners make a visibility graph
  (~15 ms to build); a straight segment when clear, else Dijkstra. Outings, goal walks and the meet-up use it.
- **Navigation for taps** (`layout/nav.ts` navOf on the layout's walk grid; `island/nav.ts walkNav` adds the named
  spots): a tap's snap (`snapTap`), its way (`findPath`) and each spot's connected region.
- **Footsteps** by the ground (`tapWalk.ts stepCue` over `world.ts surfaceAt`: `footstep-grass`, `-sand`, `-snow`,
  stone, `-splash` on a rainy day), ≤ 1 per 320 ms.
- **Rendering:** the feet are a world node read each frame from the director (`livePos`) while anyone walks; facing by
  direction (`LOOKS_RIGHT`; `NO_MIRROR`).
- **The villagers' own outings:** the partner's villager walks to 1–3 points of interest within 600u of home, then
  home; mine only after 2 min without input. One away at a time; nothing after 10 min without input.
- **Follow and chat:** when mine has been away over 8 s (within 600u) the partner comes over; two villagers within 64u
  chat.
- **The partner over the relay** (`LIVE_V` 2): my tap-to-walk sends `walk` with the world point; their phone runs my
  villager there along the same graph. Off screen, a round face of their villager is pinned at the edge; a tap scrolls
  to them.
- **Goals:** a newly met fruit walks that person's villager to their tree; ふたりでぜんぶ brings both to the middle of the
  lawn for a high-five.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`): cream box, yuzu nameplate, 33 ms a glyph, tap to finish, `aria-live` mirror.
  **Banner** (`ui/Toast.svelte`, one at a time): the whole message, wrapped by phrase (`i18n/phrases.ts`: keep-all
  with a `<wbr>` after a particle or 。, as WebKit has no `auto-phrase`), a number never cut; a long one grows it.
- **Buttons:** every tappable has an edge (2px outline + 4px lip); static cards only a soft lip. Primary leaf,
  secondary cream, selected yuzu, disabled sunk. "Can't now" = `aria-disabled` ([Taps](#taps)). Shared skins in
  `styles/theme.css`: `.btn` (`.paper`, `.small`; `.off`), `.chip` / `.chips`, `.edit-tray`, `.hcard`, `.sec-label`,
  `.level-acts`; ‹ / ✕ are always `NavButton`.
- **Focus:** no ring after a pointer input (`ui/modality.ts`); focus is restored for keyboard and VoiceOver.
- **Type:** Zen Maru Gothic (UI, Japanese) and Fredoka (numbers); line breaking by zone ([Copy](#copy)).
- **Tokens** (`styles/tokens.css`): ink `#4A3A2C`, cream `#FFF9E3`, paper `#F5E4BC`, card `#FFFCF2`, edge `#937047`,
  leaf `#6ED07A`, yuzu `#FFD84D`, mint `#7BD7C1`, coral `#FF8F7A` (errors only), the chart pair `--person-a` `#2F86BD` /
  `--person-b` `#D2701F` (night `#7EC8F0` / `#FFB066`; CVD-checked); one `--z-*` stacking scale.
- **Theme:** `data-tod` comes only from the Tokyo clock (`prefers-color-scheme` ignored); night chrome `#3A4886`. The
  HUD, plate, dialogue and choices stay cream/yellow.

## Copy

Two zones, by where a string shows (`i18n/linebreaks.test.ts` WORLD lists the world's keys):
- **The world** (the island and its rooms: lines, `Bubble`, signs, in-world notices and toasts, the HUD, the tree's
  plate): kids-style spaced kana (分かち書き), 「つうしん中…」, 「ここに おく」. `word-break: keep-all`: a line breaks only at
  a space or after 、。！, so no run without one is over 12 characters.
- **Everything opened from it** (every sheet, panel, level, dialog and form, pairing, the error page, the editor, the
  board, the shop's menu; an NPC's line inside one stays the world's) **and the leaf menu's pills** (kanji: easier to
  read): natural adult Japanese with kanji and no spaces between words (a space only around a number or Latin: 「目標
  8,000歩 以上」). `dialog`, `[role=dialog]` and `.sheet-copy` are `word-break: normal` (`line-break: strict`); a bubble
  is keep-all wherever it is.
- **One spelling a term** in every sheet: 設定 · 記録 · 目標 · 歩数 · 体重 · 完了 · 削除 · 取り消す · 保存 · 編集 · 決定 ·
  キャンセル · 閉じる · 戻る · 元に戻す (restore; an undo is 取り消す) · もう一度 · 今日 · 変更 · 同期 · オフライン · 住民 ·
  お客さん · 姿 · 模様替え · 片付ける · 季節 · 天気 · 図鑑 · 捕まえた · 作る · 資料 · a range with 〜; the game's own words stay
  (ベル, かいがら, がんばり, ふたりで全部, いつもの, ごはん, ごほうび) and official names as NH writes them. A sheet's title may
  differ from its button (けんこう → 健康, 英語 → ききみみ). linebreaks.test checks the sheets' keys for spaces between
  Japanese characters and for the kana spellings of the list.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard from
`visualViewport` (`ui/keyboardInset.svelte.ts`: `keyboardInset`, `withKeyboardInset` sets `--kb`; never `innerHeight`).
Safe areas only through the tokens (`--safe-*`, `--ui-top`, `--pad-foot`), never `env()` in a component. Short screens
scale the island down. Check at 393×852, 375×667 and 320×568, day, dusk, night and winter.

## Official art

Official NH renders only from `static/art/` through `<OfficialArt>`, with a fallback so a missing file never breaks a
screen; WebP, never upscaled. Manifest and helpers `lib/art.ts` (the build packs the manifest's sizes per folder:
`vite.config.ts` `slimArtManifest`); files from `scripts/fetch-assets.ts`. Groups: villagers (all 417 + 23 special
characters; roster `lib/villagers/roster.ts`; `lib/villagers/look.ts`), host (しずえ, たぬきち), fruit, trees, bushes,
flowers, particles, reactions, money, deco, critters, finds, presents. Ours: sky, sea, ground, the jar, effects, marks, UI
sprites. Names follow the Japanese game; no Nintendo fonts.

**The 3D renders** (`scripts/models.ts`, `scripts/models-page.js`, `npm run models`): what NH has a model of is
rendered from it for the 2D art (the campsite, the trees in their seasonal looks, the hedge's bushes, the lamps with
their `-lit` glass, the rocks, the stone bridge's deck and front, the decorations in four facings), by three.js in the
installed Chrome from the world's view (orthographic, 30° down), lit NH-style, about 3 px per world unit. Every look of
one thing shares one crop. Outputs keep the scene's art keys plus `-winter`, `-lit`, and the oak's `-trunk` /
`-canopy`; `island/models.json` holds each one's anchor and size. The pipeline: [world3d-assets.md](world3d-assets.md).

## Sound

`lib/sound/`. Off by default, kept per phone. Nothing sounds without a visible reason (idle life is silent). The music
is the user's own files; every effect is an original placeholder (`synth.ts`), replaceable by a file.

### Hourly music

One track per **Tokyo hour** (`hourly.ts`) in sunny / rain / snow arrangements (`sound.weather`; a missing variant falls
back to sunny). A 3 s crossfade on the hour; the next file is fetched a minute early. Each file is a loop period plus a
3 s copy of its start; two `<audio>` decks hand over inside the copy, so the loop has no gap. Turning ミュージック on
plays the opening theme first. Under a sheet, the panel or the harvest the music is low-passed at 900 Hz.

### Event music

On NH's event days its track replaces the hour's (`events.ts eventMusicAt`, one table over the shared dates of
`time/holidays.ts`), with the hour's crossfade at the boundaries; boundaries inside an hour get one timer each
(`msToNextEdge`). A track without its file is the hour's music (or its `alt`):

| When (Tokyo) | Track |
| --- | --- |
| Festivale: the Monday before Ash Wednesday (Easter − 48) 05:00–24:00 | カーニバル (Festivale) |
| Bunny Day: Easter Sunday 05:00–24:00 | イースター (Bunny Day) |
| Aug Sundays 19:00–24:00 | 花火大会 (Fireworks Show) |
| The wedding day (the board's date) 06:00–19:00, 19:00–24:00 | ウエディング, then ウエディングパーティー (each the other's `alt`) |
| Oct 31 17:00–24:00 | ハロウィン (Halloween) |
| 4th Thursday of Nov 09:00–24:00 | サンクスギビングデー (Turkey Day) |
| Dec 24 05:00–24:00 | クリスマス (Toy Day); in snow クリスマス（雪） |
| Dec 31 23:00 / 23:30 / 23:50 / 23:55 | カウントダウン (Countdown), four tracks, each to the next |
| Jan 1 00:00 | ニューイヤー（Happy New Year）, once, within 2 minutes of midnight (`island.newYearIntro`) |
| Jan 1 00:00–02:00 | ニューイヤー（午前0時）, the fireworks |
| Jan 1 02:00–05:00 | ニューイヤー（午前2時） |
| Jan 1 05:00 – Jan 2 05:00 | 元日 (New Year's Day) |

**Cut-ins** (`sound.svelte.ts`) swap at once over the island's music and hand back to it (each phone's own): the wasps
(`waspMusic`: Chased by Bees loops while they chase; a sting plays Stung by Bees once) and Franklin's cooking jingle
(`eventJingle(ids)`). The stretch's ラジオ体操 and the cake's ハッピーバースデー play on the island's shared stage instead
(`ev-<id>`). A cut-in ends at its end, when its file can't play (`onfailed`), at 音量 0, or when ミュージック goes off.
Under a cut-in the interrupted track stays fetched (`choose.ts pinsFor`). Now Playing and the Media Session
(`mediaSession.ts`) name the track (`sound.title.<id>`).

### Place music

As in NH, a building's room plays its own track in place of the island's (`places.ts`, `sound.svelte.ts setPlace`),
with a short fade under the door's black (`hourly.ts` DOOR: 0.65 s). What sounds, first there wins (`choose.ts
pickMusic`): the opening theme, a cut-in, a shared stage, the room's track, the island's.

| Where | Track (`places.<id>`) |
| --- | --- |
| The museum's hall / bug wing / aquarium | `museum-hall` 博物館（エントランス） / `museum-bugs` / `museum-fish` |
| The shop | `shop` タヌキ商店 |
| The tent and the homes | none: NH's houses play the hour's music |

The museum's room is my villager's: it changes once the villager is 6 units through an opening (`plan.ts wingHeld`)
and has stayed 0.6 s, so a doorway never flaps. A room without a file keeps the island's music. Tapping a door fetches
its track while the villager walks up (`prefetchPlace`); indoors the island's file stays pinned so leaving starts it at
once. Nothing is fetched while ミュージック is off.

### Shared music

`sound/stage.svelte.ts`, the relay's `music` ([backend.md](backend.md#live-relay)); the mechanism in
[sound-sync.md](sound-sync.md). Continuous music someone starts is a **stage**, one record per source, the same on
every phone: `isl` the island's (K.K., the stretch, the cake), `t` / `u` / `v` a room's stereo. A record says which song
plays from when (`at`, the relay's clock) for how long (`ms`); `request(src, song)` and `hush(src)` apply it here at once
and send it; the room keeps the last one per source and hands the live ones over at hello. Last writer wins by `(at,
who)` (`newerMusic`). Nothing goes out when a song ends: each phone drops the record at `at + ms`. Visuals follow the
record for everyone; the sound plays only where the stage is (`enterStage`) with ミュージック on, 音量 above 0 and audio
unlocked, seeked to `serverNow − at` (`MusicTrack.from`). Mute and volume stay local. The first tap after the app opens
picks the song up mid-song.

**Another player's sounds** (a shake, a dig, a splash, their footsteps…) reach every phone through the intents that
show them, each played where it happens (`cue(c, { at })`, `sceneSfx(kind, at)`) with the island camera's gain
(`camera.svelte.ts earGain`, `cues.ts hearFrom`: none off screen, 1 at the middle down to 0.35 at the edge). Personal
sounds stay mine: the controls' taps, the shop, the ききみみ cues, my wasps' music, a setting's preview.

### K.K. Slider

`kk.ts loadKK()`: K.K.'s songs from `static/audio/kk.json` (`{ id, ja, en, file, gain, v, d }`, NH's titles; their
airchecks at `kkAircheck.<id>`), its own chunk loaded the first time K.K. or a stereo's list shows. K.K. on his stool
plays his live file on the island's stage, a room's stereo its aircheck (`kkTrack`, `stageTrack`); `kkPick` never
repeats the last one; `kkTitle` is the title in the app's language; the offered songs are prefetched (`prefetchKK`).

### Ambience

`ambientFor(hour, month, weather, { heavy })` on the music bus, crossfaded (0.5 s): waves always; birds 05–17 on fine
days (the bush warbler in spring, the bulbul in autumn); cicadas 08–17 Jul–Aug; higurashi 04–08 and 16–19 Jul–Aug;
crickets 17–05 Sep–Nov; nothing alive in rain or snow; wind Dec–Feb; rain. The beds are **procedural**
(`ambientSynth.ts`, its own chunk): original loops rendered once into buffers when the main thread is idle, 12–40 s
each. A file at `ambient.<id>` replaces a bed.

### UI sounds

Soft mallets and bells for the panel, cursor, confirm and cancel. Dialogue is silent.

### Cues

`cues.ts CUES` maps moments to sounds, levels and delays; nothing calls `play()` directly. Reactions name a cue per
step, taps in `data-sfx`, outcomes call `cue()` (tree tap → rustle, fruit lands → thud, each coin → a climbing
pentatonic run, 受け取る and a present → NH's get fanfare, all four goals met by both → the complete fanfare, buy →
purchase, scenery → `scene-<kind>`). The first open of the day (しずえ's `announce`) plays NH's **radio jingle**
(`radio.ts radioJingleAt`: morning 05–11, noon 11–17, evening 17–05, one of six by the Tokyo date's seed, or the
holiday's own). A sound without its file borrows a `like`'s (`ids.ts`). **World cues** are skipped while a sheet, the
panel or the harvest covers the scene; UI cues always play.

### Taps

Every tappable names its sound in `data-sfx`; one capture listener (`taps.ts`) plays it on the click. `self`: the
handler plays the outcome's cue; `none`: silent. A control with `aria-disabled="true"` has its click swallowed and
plays `boop`. Enforced by `taps.test.ts`, walked by `e2e/sound.spec.ts`.

### Mix

Buses: music 0.30, ambience 0.28, effects 0.90, voice 1.0 (ききみみ's clips: 音量 alone; they duck the music as a jingle
does); master 音量 squared (default 0.8). ≤ 6 voices and a cap per sound (`ids.ts`); jingles never overlap and duck the
music to 25%. Effects decode on the unlock (only while 効果音 is on), except the `lazy` ones (the radio jingles, the
complete fanfare): fetched at first play (2.5 s, then the placeholder) and kept decoded two at most. Effects jitter
pitch.

### Engine lifecycle

`sound.svelte.ts` drives `engine.ts`; the rules are pure in `session.ts`; `engine.test.ts` uses a fake context.

- **Unlock:** no context until a setting is on. `pointerup`, `touchend`, `click` or `keydown` creates and resumes it
  and unlocks both decks; `pointerdown` only wakes it. With ミュージック on, the hour's file is fetched 1 s after launch,
  so the first tap starts it inside the gesture.
- **Nothing queues:** a cue on a context that isn't running is dropped; a tap's own sound may run within 250 ms of its
  resume.
- **Idle suspend:** with only effects on the context sleeps 10 s after the last sound.
- **Background:** hidden → decks paused, ambience stopped, context suspended; back in front the hour fades in over
  0.8 s.
- **Music off:** the fade-out, then every music file in memory released (`Engine.release`); the next on fetches again
  (from the service worker's cache).
- **iOS session:** `ambient`: it mixes with other apps' audio and follows the Ring/Silent switch.
- **Voice session (ききみみ, [kikimimi.md](kikimimi-engine.md#audio)):** `voiceSession(true)` inside a game's tap creates or
  wakes the context even with sound set silent, holds it awake (the background still suspends it), and sets the session
  to `playback`; `false` stops the clips, drops the decoded ones (an LRU of 4) and hands back to the settings.
  `playVoice(buf, {relayAt, now})` schedules at `currentTime + (relayAt − now())/1000`.

### Audio files

`static/audio/manifest.json` (bundled by `manifest.ts`): `sfx.<id>` = `{file, v}`, `music.<weather>.<00–23>` = `{file,
start, end?, gain?, v}`, `opening`, `ambient.<id>`, `events.<id>`, `places.<id>`; K.K.'s `kk[]` and `kkAircheck.<id>` in
`static/audio/kk.json`. `v` is the file's content hash (written by the build; `npm run audio:music -- --hashes` after a
hand-replaced file; `sound.test.ts` checks every one): the app fetches `file?v=`, so `/audio/*` is immutable
([backend.md](backend.md#service-worker)). Add a file and its entry, no code change; a missing effect keeps its
placeholder, missing ambience its procedural bed, missing music is silence.
`npm run audio:music -- <dir> [--only <key regex>]` (`scripts/music.ts`, ffmpeg) builds every entry from the user's MP3s
by track number (`CATALOGUE`): loops (finds the period, cuts it where both passes match, appends the copy; a 2 s blend
where the rip's second pass is a variation), one-shots (silence trimmed), AAC 64 kbps, `gain` to −16 LUFS; jingles mono
with their loudness in the file; K.K.'s songs and airchecks mono AAC at 40 kbps. `sound.test.ts`: every manifest path
exists, every file is named, each folder under its budget (one file / all): `music/` 1 / 64 MB, `places/` 1 / 6 MB,
`sfx/` 0.25 / 4 MB, `kk/` 1.2 / 60 MB, `kk/aircheck/` 1.2 / 36 MB. Audio is never precached; the worker's audio cache
keeps its few per class (music 3, K.K. 2, the rest 8; ききみみ's packs have their own cache).

### Sound settings

設定's サウンド: **ミュージック** (music, ambience), **効果音** (effects, jingles), **音量** 0–10; both off at first; turning one
on previews it. In localStorage (`island.sound`), never synced.
