# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md), performance budgets and the backlog in [ops/perf.md](ops/perf.md). Numbers come from
`app/src/lib/config/rules.ts` and `contract/rules.ts` (the rewards' prices), which win if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch, plus an optional guest ([The guest](#the-guest)). Their activity, measured automatically, grows fruit and
earns **ベル** (play money, a stamp card: +1 per daily goal) into each person's own wallet, spent on two treats: おやつ and
外食. Japanese first, English per person.

- <a id="health-data"></a>**Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active
  energy, stand minutes, weight, body fat %, BMI, lean body mass) several times a day, as `metrics` rows; a day's value
  is its latest row, so each sync replaces it with Health's current total (a locked week's earnings stay as of its
  lock). **Apple Health is the source of truth:** no health number is entered or fixed in the app. What the app sends
  itself (goals, prefs, buys, the meal log, finds…): [backend.md "Events"](backend.md#events).
- **Data out:** the PWA (SvelteKit, static on Cloudflare Pages) fetches the raw rows from the relay and computes every
  number on the phone (`lib/model/`, pure functions).
- **Principles:** zero required taps a day; both people see all data; no notifications but 保養所's opt-in;
  everything always animates (no reduced-motion variants, but where noted).

The code map is README's Layout; `deps.test.ts` enforces the modules' import direction. Shared helpers: lazy chunks
load through `ui-state/reload.ts` `lazy`, failures a caller goes on without through `quiet()` (`lib/quiet.ts`), easing
and clamping `lib/math.ts`, a static file's URL `staticUrl()`, the synced last-writer-wins maps `store/synced.svelte.ts`.

## Simplicity rules

- No app tab bar: 島, the health popup (the dumbbell: 健康 and ごはん) and the HUD menu's six sheets
  ([Island](#island) "Menu").
- One focal point per screen (島: the island itself, the sky clean; ごほうび: the wallets, today's ベル under each).
- A number is shown in full in one place; elsewhere it is only a doorway to it.
- Per screen at most 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card; one しずえ line (≤ 16
  characters), only with news. (The trip guides are the one exception: [Trips](#trips).)

## Screens

### Island

Top to bottom: the HUD row (one cluster in the sky's top-right corner: the health button and the menu's leaf); a sync
chip only when sync isn't ok; the scene; しずえ's box only with news; at the bottom the farm button (left, while the
island has a field: [farming.md "Playing"](farming.md#playing)) and the say button (right). The island is in 3D under
them ([World](#world)): one finger scrolls it from まえ (home, the health lawn) back to おく, two pinch the zoom, a tap
on empty ground walks my villager there.

- **Trees:** one per person, today's four fruits in the canopy ([Trees](#trees)). A tap opens a popup, one grid: per
  goal (🍎 steps first, then Move, Exercise, Stand) today's amount against the goal, ✓ once met and a yuzu がんばり chip
  at 1.5× ([Goals](#goals)); a ごはん row (朝 / 昼 / 夜, each ✓ once that person logged that meal today) and a button
  to their ごはん day; the day's ledger, ふたりでぜんぶ outside either total, and when that person's data last arrived
  (a dot once over 6 hours old).
- **HUD row:** [the health button] [the menu] in the top-right corner at `--hud-top` (10px under the safe area), 6px
  apart; nothing else in the sky.
- **Menu** (`island/HudMenu.svelte`), the single home of the menu's order: a 44px cream disc
  with NH's leaf mark, folded by default. A tap unfolds it (the disc yellow, the leaf tipped −40°) into seven cream pills
  (the guest's six), right-aligned under the leaf, the same width, 44px tall, its name then its icon or number:
  1. **ベル 121** (my wallet's balance, both members' on the guest's phone; the number is the picture) →
     [the panel](#panel), ごほうび. Its label carries today's ベル for a screen reader.
  2. **旅行** (a plane) → [Trips](#trips)
  3. **結婚式** (a heart) → [wedding.md](wedding.md)
  4. **登山** (a mountain) → [hiking.md](hiking.md)
  5. **英語** (a speech balloon) → [ききみみ クイズ](#ききみみ-クイズ) (「誘われています！」 under its name, and a coral dot on
     the folded leaf, while someone's invite is live)
  6. **ボット** (a robot's head; a dot while a bot needs a person) → [ボット](#bots)
  7. **設定** (a gear) → [設定](#settings)

  Labels are kanji ([Copy](#copy)). No "+N" badge on the leaf (it reads as a notification). It folds back on a second
  tap of the leaf, a tap elsewhere (which still does what it would), Esc, any sheet opening, and a pick; folded, the
  pills are `inert`. The icons are one drawn set: the gear's soft brown (#A88B68), details cream.
- **Health button** (`island/HudHealth.svelte`): a cream pill, NH's red dumbbell across it, no number. Tap → the
  villagers glance up and the health popup opens at once on the tab shown last: [健康](#kenkou) or [ごはん](#gohan). One
  kept sheet; ごはん mounts the first time its tab shows.
- **Coins** (`island/HudCoins.svelte`): each newly met goal flies a +1 coin from its fruit into the leaf (+2 with
  がんばり); never for a refund, nor while something covers the scene.
- **Villagers:** a tap on mine is a squish; a tap on the partner's is a high-five ([Villager taps](#villager-taps)).
- **Say button** (`island/SayButton.svelte`): a round cream button at the scene's bottom right, NH's chat glyph; it
  opens the phrase picker (a phrase shows over my villager on every phone). Hidden under a sheet, the panel, the
  harvest and a tree's popup; every room has it too ([The tent](#the-tent) "Phrases").
- Controls are real buttons with `aria-label`, ≥ 44px (villagers 64px); focus order = visual order.

### Wallet

<a id="panel"></a>ごほうび, the island panel (`panel/IslandPanel.svelte`, `wallet/Wallet.svelte`, `wallet/Shop.svelte`):
the menu's ベル row opens it at once, full height, no tabs, its own chunk, at its top; a ledger day pushes a level with ‹
(the wallet stays mounted under it). Top to bottom:

- **The wallets:** side by side, mine first: each a jar (`Jar.svelte`, filling as it grows: `walletFill`), its owner's
  avatar and name, the balance, and under it today's ベル into it in a soft yuzu pill (their goals, がんばり and half of
  ふたりでぜんぶ; at 0 a faint one, so nothing jumps). The guest sees both, buys nothing.
- **The rewards** ([Rewards](#rewards)): two tiles with NH item art, name and price, paid from my own wallet; one it
  can't cover is sunk. A small ⓘ at each tile's corner shows what counts as that reward in a cream bubble. 買う！ asks
  first, naming my wallet (「ウェイのベル 53 → 33」), applies at once and waits 5 s with 取り消す before it is sent.
- **貯めたベル:** the ベル ledger ([Kiroku](#kiroku)); a day pushes a level.
- **買い物の記録** (`wallet/Purchases.svelte`), folded behind a disclosure: the buys newest first (art, name, day, who,
  price), ten at a time. 🗑 on any line (either of us, any buy) asks first, then sends a `spend_void`; the ベル go back to
  the buyer's wallet, with 取り消す for 5 s. The old `/jar` page redirects to the island with the panel open
  (`?panel=rewards`).

### Settings

**設定** (`panel/SettingsSheet.svelte`): the menu's 設定 pill → its own full-height sheet: **姿** (the look's portrait,
the よびな and what's worn → [the 姿 level](#sugata)), **プロフィール** ([Profile](#profile)), **サウンド**
([Sound settings](#sound-settings)), **言語** (日本語 / English), **季節** ([Seasonal look](#seasonal-look); its 天気 is
[Weather](#weather)'s switch too) and **図鑑** (設定 closes, [the 図鑑](#zukan) opens). The guest's says it's visiting.

### Bots

**ボット** (`bots/BotsSheet.svelte`, members only): tabs **保養所** (`ItsPage`, not in demo), **ジム** (`GymPage`). The
last tab reopens; only the shown page is mounted. A dot while a bot needs a person. 保養所's draft asks before a tab
switch or close. Its **通知** (`ItsNotify`): push per phone, off by default, asked on the tap; テスト通知; a
notification opens 保養所.

<a id="sugata"></a>**すがた** (`look/LookPage.svelte`, `look/closet.ts`, `store/look.ts`; the look's
contract: [players.md](players.md)): one dresser in NH's wardrobe layout, the whole closet free (no ベル, no unlocks),
for A, B and the guest alike. Each person is NH's human player ([Players](#players)) or a villager.
- **The stage:** the 3D player (drag turns, tap hops) or the villager's render, shrinking as the panel scrolls; a
  status pill says what's worn (いつもの, a コーデ's name, a season's arrangement, a villager), **元に戻す** once anything
  changed this visit; the nameplate opens the よびな sheet; the colour dots of the item last tapped.
- **Six tabs** (`look.tab.*`): **コーデ · 顔 · 髪 · 服 · 小物 · 住民**, with sub-rows. コーデ: **いつもの** (never stored),
  the saved looks (at most 20) and 保存; a saved one can be overwritten, renamed or deleted. The closet: NH's grid, five
  a row, a tile per item in its variant (a one-piece clears the bottoms; one of hat / hair ornament). 住民: the search,
  the special characters and the 417 villagers.
- **Sending:** the stage holds a draft; leaving the level sends it once if changed, with 取り消す for 5 s. No 決定 (✕
  keeps, as NH's wardrobe). コーデ edits go out as made ([backend](backend.md#events)).
- The preview is the level's one WebGL context (the island's sleeps under the sheet), released on close; a player's
  round head for the chips and rows is drawn once and kept (`look/portraits.svelte.ts`).

<a id="profile"></a>**プロフィール** (`panel/ProfileSection.svelte`, `model/profile.ts`): one card.
Whose (the two members, this phone's first; the guest only its own) with the age; sex, birthday (a native date field)
and the BMI standard (Asian, the default · WHO; not the guest's). Prefs on the record ([backend](backend.md#events)
`sex`, `birth`, `bmiStd`): either member sets either's; private to the two members (the guest's to the guest),
enforced by the record. What it feeds:
- **Height:** √(weight ÷ BMI) from Health's latest day with both (no height pref).
- **Energy:** resting by Mifflin–St Jeor from the latest weigh-in; daily = resting + the average Move of the last 28
  Watch-worn days (at least 7, `activityOn`), else resting × 1.4; kept within 1.2–2.2 × resting (`model/profile.ts`).
- **ごはん's defaults** ([Gohan](#gohan)), only while no goal is set (`contract/goals.ts` `derived`): kcal the daily
  energy (less 15 % while the goal weight is more than 0.5 kg under, never under the resting energy nor 1,500 / 1,200);
  salt and protein by sex and weight (食事摂取基準 2025).
- **BMI's category** on the BMI card ([Kenkou](#kenkou)).

### Kiroku

The ベル ledger (`model/bells.ts` bellsLedger, `components/kiroku/*`), read-only, in [ごほうび](#wallet) under the rewards
(「貯めたベル」):

- **ベル:** by week (earnings only), newest first, by person: the week's head and each day's line give each person's
  ベル (their own wallet's: their goals, がんばり and half of ふたりでぜんぶ) beside their four fruits (bright = met), a star
  on a ふたりでぜんぶ day, a second line with each person's がんばり on such a day; tap → the day.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  がんばり chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

健康 (`model/health.ts`, `components/health/*`): the health popup's first page (full height): Health data over time, one
person at a time, computed on read, each card with its goal; its code and strings load with the first opening.

- **The title bar** (both pages): whose · the page switch 健康 | ごはん · ✕; on ごはん's levels ‹, the title, ✕.
- **Whose:** a native `<select>`, one pick for both pages, kept for the session; with the guest picked 健康 shows the
  last member picked, and says so.
- **The selectors:** 活動 · 体 and the period (1週 · 1か月 · 3か月 · 1年; ごはん's グラフ's too), 1週 and 活動 on every
  opening, the guest 活動 only; a sticky ‹ the range › and 今日.
- **Cards** (`model/health.ts` CARDS): 活動 歩数, ムーブ, エクササイズ, スタンド; 体 体重, 体脂肪率, BMI, 除脂肪体重. Each
  card (`ChartCard`) has its goal chip ([Goals in place](#goals-in-place)), or a note while nothing is recorded.
  **Activity** (`BarCard`): the daily average and its change against the previous period, goal days n/N, the best and the
  days without a record, the chart.
- **Chart** (`BarChart`, SVG; its header): a bar per day, week or month in the person's colour, solid when the goal
  was met its way ([Goal directions](#goal-directions)); a tap shows one value, a drag pages (right = older).
- **体重 · 体脂肪率 · BMI · 除脂肪体重** (`BodyCard`, `DotChart`; their headers): each its own optional goal, the average
  (BMI with its category by the person's standard: under 18.5, Asian 23 / 25 or WHO 25 / 30), the change, the dot chart
  and the goal month at that pace. No good / bad colours; never earns.
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit` over the registry `contract/goals.ts` GOALS): a tap on a
  card's chip opens a tray under the header (−/＋ by the step, the range, clear where clearable, キャンセル, 決定), one
  open at a time; either person sets either's; the same control sets ごはん's goals. 活動's goals hold from today on; the
  ベル keep Exercise and Stand at 60 / 120 ([Goals](#goals)), and the editor says so. The guest's chips are read-only.
- <a id="goal-directions"></a>**Goal directions** (GOALS `dir`; why: [decisions](decisions.md#goal-directions)): at
  least 歩数, ムーブ, エクササイズ, スタンド, 除脂肪体重, たんぱく質, 食物繊維; at most 体脂肪率, 脂質, 塩分, アルコール; near a
  value: 体重 (±1.5 %), BMI (±4 %), カロリー (±10 %), 炭水化物 (±15 %). Every chip, shading, goal day and tile follows it.
- **Rules:** a day's value is Health's latest; a day without a record has no row (from the first activity record);
  today is drawn but not counted; the previous period is the same length just before.
- **A day without the Watch** ([decisions](decisions.md#no-watch-days)): a day whose Move, Exercise and Stand are all 0
  or absent is no data for them (`activityOn`, the one reader); steps stay; read-time only.

### Gohan

ごはん, the meal log (`model/food.ts`, `components/food/*`; the data: [food-data.md](food-data.md)): the health popup's
second page. It opens on 記録, today. What each of us ate, typed in by hand, never earning ベル; everyone sees everyone's
meals, only the owner changes an entry. A day renders from its entries' snapshots and never waits on the food data (it
loads with the first search, or at idle, in a worker); kept mounted between openings.

- **Tabs:** 記録 · グラフ. 記録 has ‹ the day › and 今日; › goes past today only to tomorrow, when a いつもの fills it.
  Recipes and custom foods are reached from a meal's search.
- **Summary card:** the day's kcal with its goal chip and bar (coral only past 20 % over); P · F · C · 塩分 (coral past a
  ceiling), a fold with every nutrient, and the **PFC balance** (Atwater 4/9/4) against 食事摂取基準 2025 (never coral).
  A past day with nothing logged says so, not 0.
- **Goals** (the registry; [Goal directions](#goal-directions)): kcal, protein, fat, carbs, salt, fibre, alcohol, on my
  own cards. **Defaults** while unset: kcal from the daily energy, protein and salt by the profile ([Profile](#profile));
  fibre by sex and age; alcohol 20 g ([decisions](decisions.md#fibre-and-alcohol)); none for fat and carbs. **Warn,
  allow** ([decisions](decisions.md#low-kcal-goals-warn-allow)): a low kcal goal gets a note, never a block.
- **Meals:** breakfast · lunch · dinner · おやつ, a card each, a row per entry. On my day ＋ opens the search (the
  keyboard up in the same tap); anyone else's day is read-only. An entry keeps its food as logged (mine offers a changed food's latest values); an empty meal offers
  yesterday's and another person's, copied as mine with 取り消す; **quick** (⚡, or a kcal typed) logs one serving.
- **Search** (`FoodSearch`'s header; the ranking `food/search.ts`, its golden queries `food/load.test.ts`): my recent
  foods, then the best matches, a food's states one row. Nothing holding the whole query: 見つかりませんでした, 自分で作る,
  then **近いもの**, the names holding most of it (`nearby`). Offline: a retry and the recent list.
  A member's search also holds the chain menus ([food-data.md](food-data.md#kalori)), logged by the serving: under the
  generic foods unless a word names a shop (セブン, スタバ…), which narrows to its menu; the shop chips and marks:
  `FoodSearch.svelte`'s header. None in test mode or for the guest.
- **Amount** (`FoodAmount`, `FoodPortion`; their headers): one screen on an iPhone 15: the picture (marked as an AI
  image), kcal, P · F · C · 塩分, the state and amount controls; the foot (the meal and add, or 保存 / 削除) over the
  keyboard.
- **いつもの (a repeat):** a meal eaten the same way on set weekdays fills each day it covers (🔁), counting like any
  entry; changes apply from tomorrow, stopping keeps past days; editing one of its items changes that day only.
- **グラフ:** what was eaten only (burned is 健康's ムーブ): the period's average day against the goal, then kcal and each
  nutrient as 健康's activity cards (a day with nothing logged has no record).
- **My recipes and my foods:** everyone's, in a meal's search after the recent ones. A recipe logs as a food (servings
  1–20); a custom food is one serving typed in (kcal needed). Anyone else's is read-only, copied to edit; deletes are
  asked twice.
- **Sources** at the foot: the AI-image note and each dataset's attribution and licence.

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar
  ([Navigation](#navigation)), one CTA in a sticky footer above the keyboard; the kit's sizes and type: [Unified
  kit](#unified-kit).
- **Harvest** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both have tapped, the week's recap: each
  person's ベル, the ふたりでぜんぶ days and the total; 受け取る → the coins fall into the jars (ceremony only). ✕ = later.
- **Pair** (`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

One rule app-wide; `ui/nav.test.ts` enforces it.

- **The title bar** is `ui/NavBar` on every sheet, panel and level: 48px, the title centred (18, `--font-ui` 700). ✕
  top-right closes the whole sheet from any level; ‹ top-left only on a level (or a sheet opened in place of its
  parent's row: 図鑑, ‹ back to 設定); they never swap or move. Backdrop tap and Esc also close.
- **A half-filled form asks first** (`ui/discard.svelte.ts`): while a form holds unsaved input (結婚式's task form,
  ごはん's recipe / custom food / quick editors), ✕, the backdrop, Esc and the editor's ‹ ask to discard
  (「入力した内容を破棄しますか？」 [破棄する] [編集を続ける]). Untouched, they close at once.
- **One button**, `ui/NavButton`, for ‹, ✕ and the bar's tools: a 32px disc in the 44px hit, one look everywhere,
  over a photo or a map too (‹ grown into a pill: ‹ しまへ in a room, ‹ 戻る on the board). No other ✕ or ‹. Floating
  cards put the same ✕ at their top-right corner.
- **Lead and trailing:** on a top level the lead slot may hold one compact control: ⚙ (ききみみ), whose data (健康,
  ごはん), km | mi (旅行). Trailing, before ✕: tool icons only (＋). Never words in the bar but the title, or, in its
  place (`middle`), 健康 | ごはん's page switch.
- **Forms and confirms:** a form sheet (`Sheet` default) is ✕ to cancel + one action in its footer (保存), no キャンセル.
  An edit mode inside a sheet or the world (a memo, a board note, a goal's tray) has キャンセル then its action. A confirm
  asks 「…を削除しますか？」 and answers with the verb, never はい / いいえ: a list's is an `ActionSheet` (the coral 削除
  row); one with a picture (a buy, a saved look) or one that ends something (全部片付ける, ききみみ's やめる) a sheet
  with キャンセル + the verb (`.two-cta`, `.btn.danger` when it loses something). A delete that can be undone acts at
  once with 取り消す on its banner.
- The island's full-height sheets (健康, the panel, 旅行, 結婚式, 登山, ききみみ, ボット, 設定) open and close at once:
  no zoom, slide or fade; a form sheet rises over 240 ms; a level slides in over 240 ms.

### Unified kit

<a id="sizes"></a>**Sizes:** one scope, `:is(dialog, .sheet-copy)` in theme.css (every sheet, panel, level, pairing, the
board, the trays, the shop's menu): the small edge and lip, cards `--r-row`, the title bar 48 (title 18) and its 32px
discs, controls drawn 32–36px in a 44px hit (a `ChipRow` 44 high so its scroll never clips a hit), rows 44–52. The world
(the HUD, the leaf menu, the rooms, dialogue) keeps the game's sizes: the 2px edge and the 4px lip.

Every sheet uses one kit, denser where the info is dense; game feel from edges, small lips, stickers, stitches and the
yuzu "selected". Nothing feature-local: shared tokens only ([Chrome and tokens](#chrome-and-tokens); trip `dayColors`
stay trip data).

- **Type:** titles, labels, numbers in `--font-ui` 700 (Zen Maru Gothic) / `--font-num` 600 (Fredoka, tabular); body
  and notes `--font-body` (the system font). Sheet title 18 · card title 15 · row text 15 (lists) / 14 (timeline) ·
  note, meta 13 · tag, tab label, axis 11. Paragraphs `text-wrap: pretty`. Sheets are normal Japanese with kanji; the
  island world keeps spaced kana ([Copy](#copy)).
- **Shape:** cards with a small lip, no hairline; rows split by an inset stitch; selected = yuzu (never green); the
  action = the leaf `.btn`. One control row per view, under the header.
- **Components** (ui/): `Sheet variant="full"` · `NavBar` · `NavButton` · `TabBar` (`panel`: a tablist) · `Chip` in `ChipRow` ·
  `Segmented` · `Tick` · `StatStrip` · `PhotoBand` · `ProgressBar` · `ActionSheet`; theme.css's small classes. A sample
  of all of it: `/dev/kit` (`vite dev`).
- **Icons:** `ui/Icon` only: our own drawing on a 24 grid, a 2px round stroke in `currentColor`; an unknown name draws
  a pin. No emoji in chrome.
- **NH art, only:** the pink-roses art in the wedding ring; the villager heads on the leaf-menu pills; packing
  categories as NH items (`packView.ts`). No characters in the sheets.
- Every tappable has its `data-sfx` (the shown tab / chip `none`); fields 16px+; no grabber.

## Economy

A stamp card with small numbers. Rule `scoring/bells.ts`, economy on read `model/bells.ts`, values `config/rules.ts`
(`RULES`, `STRETCH`) and `contract/rules.ts` (`SHOP`, `PRICE_HALVED_MS`); pinned by their tests, `model/properties.test.ts` and the golden fixtures. Earnings are
recomputed from the rows.

### Goals

Lists follow Apple's ring order, Move, Exercise, Stand, then steps (`RING_FRUITS`), except けんこう and the tree's popup
(steps first). Per person per Tokyo day, all or nothing: **+1 ベル for each goal met**.

| Fruit | Metric (Shortcut field → stored) | Daily goal |
|---|---|---|
| 🍐 Move | active kcal (`calories` → `move_kcal`) | per person `pref` moveGoal (`contract/goals.ts`) |
| 🍑 Exercise | Watch exercise minutes (`exercise_minutes` → `exercise_min`) | 60 min |
| 🍒 Stand | Stand Time (`stand_minutes` → `stand_min`) | 120 min |
| 🍎 Steps | `steps` (max of `steps`, `steps_watch`) | per person `pref` stepsGoal (`contract/goals.ts`) |

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

Exactly two (`SHOP`): 🍦 **おやつ 20 ベル** (`snack`) and 🍜 **外食 35 ベル** (`dinner`), each bought from the buyer's
own wallet. A buy is `spend {spendId, item, bells, day?}`: `bells` exactly the item's price at the record's clock
(`shopPrice`; 40 / 70 before `PRICE_HALVED_MS`, so old buys replay at theirs; the server refuses anything else), `day`
the Tokyo day it was for (optional: the record's day or up to 14 days before, `spendOf`). Either of us undoes any buy
(`spend_void`). Against the numbers check (each wallet gets its own days and half of ふたりでぜんぶ) each is something to
save for: a typical person has two おやつ and one 外食 every three weeks; a lazy week (14 each) buys nothing.

### Harvest and lock

- <a id="the-first-week"></a>**The first week:** the first one with an activity row stamped by that week's lock
  (`firstWeek`); a baseline of old days synced after their weeks locked never earns.
- **Sunday 19:30 JST:** the harvest recap opens (nothing lands then: the week's ベル came in day by day).
- **The following Wednesday 04:00 JST:** the week locks. Until then its earnings move with late syncs; after, they are
  computed as of the lock. The lock is internal: nothing shows it.

### Wallet and buys

Each person's wallet runs from the economy's first day: a day's ベル count in it from that day, their own and half of
ふたりでぜんぶ (`walletAt`). Buys and voids replay in server order (by `at`).

- **Coverage:** a buy counts only if its buyer's wallet covers it (what it got up to the buy's `day`, else its `at`'s
  Tokyo day, minus their earlier accepted buys); an uncovered buy is ignored, so no balance goes negative.
- **Voids:** once a buy ([Rewards](#rewards)); buys and voids never lock.

## Weight

`model/weight.ts`, for けんこう's 期間の変化 and goal month; never earns (`deps.test.ts`). Plain arithmetic, no
smoothing: over the visible period, the first week's average weigh-in → the last week's when the weigh-ins span 14
days or more, else the first weigh-in → the last; under two, none (–). Per week: that change over the days between the
two weeks' middles, shown from 7 days apart. Goal month: from the last week's average at that pace, only when it heads
to the goal at ≥ 0.05 kg a week within 156 weeks (else 「焦らず、ゆっくりいきましょう」; at the goal 「目標に届いています」).

The body metrics (`body_fat_pct` %, `bmi`, `lean_kg` kg; `State.body`) are read the same way: a day's latest row, one
decimal, within their bounds (body fat 2–70 %, BMI 10–60, lean 10–150 kg). Each has a goal (`goalBodyFat`, `goalBmi`,
`goalLean`; the registry, `contract/goals.ts`), its goal month worked out as weight's, the goal's way. They never earn,
and the cache keeps only their newest row per day once the week has locked, like weight.

## Island scene

`lib/components/island/*` and `lib/components/world3d/*`: NH's island in 3D on the editable layout, NH's own models in
three.js, with the DOM island over the canvas as its tap areas, marks, balloons and popups ([World](#world)). What
comes only on its days (a visitor, the tape deck, the cake, the weather, the fireworks, an event's decorations) loads
the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load carries none of it. Only `transform`
and `opacity` animate in the DOM; everything pauses while hidden (`data-paused`), a sheet pauses particles, critters and
idle life (`data-covered`), and under a full-height sheet every animation holds (`data-sheet`) and the 3D island draws
nothing. Nothing on the island pays ベル. **Dev params:** the island's URL params (`island/devHooks.ts`,
`ui-state/preview.ts`): [ops/testing.md "URL params"](ops/testing.md#url-params).

### World

The island is in 3D (`world3d/engine.ts`: its header has the camera, the ground, the things, the lights) with the DOM
island over the canvas (`island/IslandScene.svelte`); every coordinate is the layout's once applied
([island-layout.md](island-layout.md)).

- **Units:** world units (an 80u villager); x across, z into the island (bigger = further back; the front shoreline is
  SHORE_Z).
- **No WebGL** (never on the target iPhones): a line in the middle of the scene (`[data-no3d]`); the rest works.
- **In 3D** ([decisions](decisions.md) "The island in 3D"): the canvas sits under the stage's nodes; the World's step
  runs in the engine's frame ([Frame rate](#frame-rate)). The villagers and the day's visitor are NH's models (one with
  none is its render's card).
  - **The camera** (`world3d/islandCam.ts`): the default zoom (1) is the widest, x centred, one finger only scrolls
    along the island (free: no snap, no automatic move); zoomed in it pans sideways too, within the land. A pinch zooms
    about its middle up to 3.2, rubber-banding past the default. A gesture is one kind from start to end; a touch on a
    fling only stops it.
  - **What comes and goes** is drawn from the DOM island's nodes: an `m3` art key stands as NH's model, `v3` a
    character's; their DOM art stays the invisible tap box, never downloaded unless there's no model
    (`characters/artGate.ts`). The board's focus: [board.md](board.md).
- **The projector** (`camera.svelte.ts` `World`): every world thing is a DOM node at its feet (`{@attach world.at(…)}`)
  placed through the 3D camera. **One depth order** for the DOM: nearer in front, ties by x. World-anchored overlays (a
  tree's popup, a bite's 「！」) stand over everything at their true size. Only nodes near the camera are shown.
- **The ground and the water** are the layout's, built on the phone: [island-layout.md](island-layout.md).
  **The sea's wash** (`layout/swash.ts`): NH's waves on every sea shore every few seconds, the foam running up and the
  wet sand drying after, out of step along a beach; the shore one eased colour ramp by depth, rivers fading into the sea.
- **Layout:** the default island (`layout/default.json`; what stands where: [island-layout.md](island-layout.md)):
  the homes A (ウェイ, left) and B (うめ, right) on every phone (never mirrored), the goal trees on their outer sides.
  The wild flowers (clumps of one kind, the season's in turn) and weed spots are scattered, seeded
  (`npm run layout` → `island/scatter.json`). **Decor** (`island/fixedDecor.ts`): NH's outdoor furniture and seasonal
  pieces, each a walk obstacle; a tap answers in place (the pump waters, the shishi-odoshi tips, the rest knock); lamps
  and the campfire light from dusk. **The decor's life** (`island/ambient.ts`): 19–22 a villager sits at the campfire;
  on an exercise-goal day pull-ups now and then; when both met every goal, at dusk side by side on the front bench.
  **Sitting** (`island/sitting.ts`): a tap on a seat walks my villager to its nearest free seat, else a `boop`.
- **Winter and night looks:** NH's snowy models and the models' own light, lit at dusk and night (`world3d/lights.ts`).
- **Sizes** (`scene.ts`): NH's proportions against an 80u villager; taps: [Scene interactions](#scene-interactions).
- **Fixed over the island:** the sky, the HUD, the weather, the fireworks and the shooting stars; DOM art over the
  canvas takes the time of day's multiply, a light none. Nothing runs when still ([ops/perf.md](ops/perf.md)).

### Startup

What a launch waits for, and what it doesn't (budgets and measurements: [ops/perf.md](ops/perf.md)):
- A second visit's page is the service worker's cached shell at once ([backend](backend.md) "Service worker").
- The island page's chunks are preloaded from `index.html`; the 3D island's import starts while the page reads the
  week (`ui-state/boot.ts`); the ground's fields are built in a worker or read from the last launch's cache
  (`layout/fieldsPrime.ts`), and the 3D island mounts once they're in. The players draw from the bundled part table
  ([Players](#players)).
- **A failed load tries again** at its next chance (`ui-state/retry.ts`: the next `online`, the page back, or a
  backoff); **a chunk that fails reloads the page** only into a newer build, once a session (`ui-state/reload.ts`).
- three.js is imported by name everywhere, never as a whole module; the static files' cache rules: `scripts/headers.ts`.

### Frame rate

The game draws at most **30** frames a second (`store/frameRate.ts` FPS) while something moves, a gesture included; a
still scene draws nothing. One pacer runs every surface's frames (`world3d/pace.ts`); the simulation runs on real time,
so nothing moves slower. **At rest** (no finger for a moment, only ambience on screen) the island draws its ambience at
**12** a second (engine.ts REST_MS, REST_FPS), the museum its tanks and bugs at 15, the tent only a blink; any move or
touch is back at the full rate at once. A villager's small moves in place (a turn, a nod, a surprise: villagers.ts
SMALL) are ambience too; a walk or a hop is the full rate.

**One renderer lifecycle:** every WebGL surface makes and lets go of its renderer the same way (`world3d/stage.ts`: its
header); the rooms keep their models page-wide (`world3d/modelCache.ts`); shadows redraw only when a caster changes
(`world3d/shadowBox.ts`).

### Buildings

`island/buildings.ts`, `island/doorOut.ts`. The campsite, the homes, the museum ([The museum](#the-museum)) and the
shop ([The shop](#the-shop); each one to an island, moved and turned in the editor, never removed): a tap on one walks
my villager up to its door and goes in. ‹ しまへ comes out of the door, NH's way: my villager stands just in front of it,
facing out, on every phone at once (`layout/nav.ts` exitOf). Inside, my villager is nowhere on the others' islands.

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

`island/weather.ts` (pure), relay `src/weather.ts`. The island has **Tokyo's real weather by the hour**, or the game's own
seeded days; every phone shows the same sky at the same hour: **fine**, **cloudy**, **rain**, **a downpour**, **snow**,
with **fog** as an hour's extra.

- **ほんもの (the default):** the relay's Open-Meteo timeline for central Tokyo, one sky an hour
  ([backend](backend.md#the-real-weather)), cached on each phone; an hour is locked once it begins. Without a fresh
  timeline (and in ゲーム, and under `?date=`): the seeded day.
- **As NH:** Dec 11 – Feb 24 rain falls as **snow**. Event nights stay fine (the August fireworks, New Year's, a meteor
  shower's night, the wedding night). The seeded treats (fog, the aurora, the rainbow) and **ゲーム**'s days:
  `weather.ts`'s header.
- **The switch:** 設定 → 季節's **天気** ([Seasonal look](#seasonal-look)): **自動** or **ゲーム**, one for the whole island
  (the last anyone set), so phones never disagree on the rain-only critters; its 晴れ / 雨 / 雪 force the look only;
  `?weather=` forces both.
- **Look:** a grey sky and a darker tint on a wet day, half when cloudy; a change of sky eases over a minute. Rain and
  snow fall in the 3D world; indoors nothing falls. **Sound:** the hour's rain or snow arrangement, the rain bed,
  splashing footsteps.
- **Critters:** cloudy counts as fine; the coelacanth only in rain or snow, the snail only in rain, NH's "any except
  rain" bugs away while it rains; shooting stars only on a fine night.

### Trees

`island/FruitTree.svelte`, `island/fruitDay.ts`. A tree's fruit through one Tokyo day:

- **Hanging:** each goal's fruit, 🍐 🍑 🍒 🍎 left to right, grey at 0 and filling with colour toward the goal.
- **Falling:** met, the tree shakes and the fruit drops in front of the trunk with a thud and a puff; once per phone;
  a reload finds it lying there.
- **Picking up:** a tap on a fallen fruit picks it up, gone on every phone until the next Tokyo day
  (`fr:<person>:<fruit>`). Anyone may pick up either tree's fruit, into the pocket for the shop (no ベル). A tap within
  22u of a fallen fruit picks up the nearest, else it opens the popup.
- **All four met:** four warm glints on the canopy over a soft gold pulse (NH's money tree).
- **The popup** stands in screen space over every tint, between the HUD and the screen's foot, over its tree as far
  as the edges allow; a tail toward the tree.
- `fruit-day` in localStorage (`{ date, dropped, picked }`): losing it only drops a fruit again.

### Shaking a tree

`island/treeShake.ts` (its header: the odds, the caps, the drop spots). Every tree shakes: the goal trees and every
oak, cedar and palm (bamboo doesn't).

- **Tap or shake:** a goal tree's tap opens or closes the popup; any other tree's rustles it. The third tap within
  1.2 s (and each quick tap after) is a shake: the tree shakes where it stands, my villager turning to it (no walk).
- **What falls (NH's; the odds: the header):** a hardwood or a cedar a wasp nest, a dangling bug or a branch; a palm
  its two coconuts once a day, else only a nest; wood now and then. No fruit from a goal tree. **No piles:** while
  anything a tree dropped lies under it, a shake only rustles it.
- **A tree's present** (`island/treeGifts.ts`): each day two oaks or cedars hold a piece of
  furniture, dropped wrapped by the first shake and opened like a balloon's present; the 図鑑 credits whoever opened it.
- **Shared** ([Shared world](#shared-world)): a shake's outcome goes to the others; their phone plays it, their wasps
  charge their villager. What lies is the shared day's (first pick-up wins).
- **The nest:** three wasps charge the villager who shook it; a tap in time nets one. Too late, they sting: NH's swollen
  eye for a minute. The chase has its own music ([Event music](#event-music)).
- **A dangling bug:** a bagworm, or at night sometimes a spider, sways on its thread for a while; a tap nets it.

### Scene interactions

`island/sceneTaps.ts`. Every part of the island answers a tap softly and counts for nothing; ≤ 4 flourishes at once;
nothing while covered or hidden. What nothing else took is a walk ([Walking](#walking)); a seat is sat on
([World](#world), "Sitting on a tap").

A bush jiggles and sheds leaves (1 in 10 a bug flies out); a tree's leaves rustle ([Shaking a tree](#shaking-a-tree));
a flower is watered ([Island care](#island-care)); any water casts the line there ([Critters](#critters) "Fishing");
sand leaves footprints; grass puffs dust (snow in winter); a cloud squishes; the sun glints; the moon bobs; the night sky
twinkles (and grants a wish while a shooting star crosses: [Shooting stars](#shooting-stars)); the campfire is poked.

**Tap targets** (`island/hitbox.ts`): everything tappable answers on its whole visible body, at least 44 × 44px; in
front wins, exactly under the finger over a character's loose reach; a building is its model's silhouette.
**Nothing lies on a building's ground** (`layout/clear.ts`): what's dropped or spawned takes a spot off its footprint,
door step and the strip its model hides. On water only what's drawn takes a tap, so a tap on the sea beside a dig spot
casts. A touch goes where the finger was, never moved by WebKit's touch adjustment onto a door
(`ui-state/exactTaps.ts`).

### Balloon

NH's balloon present (`island/balloonFlight.ts`: its header; `island/Balloon.svelte`): by day every 45–90 s of
on-screen time it flies over the island in 3D, sea to sea. A tap pops it: the present falls to open ground clear of
every control (`island/presentLanding.ts`) and lies there for every phone until tapped open. What's inside follows NH's
drop rates without Bells or materials (`island/catalog.ts`: furniture, clothing, a season's DIY recipe), counted in the
ずかん. On Bunny Day a sky egg instead. The catalogue: `npm run catalog:build`.

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/PartnerNews.svelte`; the mechanism:
[backend](backend.md#shared-world). Every phone shows the same island: what's caught or picked up is gone on all, what
a shake drops lies on all, each villager stands where its person sent it.

- **The villagers move as one:** each of us moves our own villager; the other phones play the very same walk,
  catching up when a message is late (`island/villagerSync.ts`); asleep and awake alike ([Sleep](#sleep)).
- **Fishing, seen by everyone**: each step of a line (the cast, the nibbles, the bite, the reel) plays on the others'
  phones as it happens. The shadow cast at is theirs while the line is out (a tap on it here
  boops); an angler whose phone goes, or who goes through a door, is no longer fishing.
- **The partner's doings, played here:** within 12 s, their villager turns to it and it plays at the target; older
  (heard on opening), it only changes the island.
- **First wins:** of two people tapping the same thing, the relay's first claim is it; the other sees it taken.
- **Late and alone:** a phone opening later hears the day from the relay; with the relay unreachable each phone keeps
  its own and they catch up when it's back.

### Sleep

`ui-state/presence.ts`, `ui-state/cast.ts` ([decisions](decisions.md#sleep-by-presence)). Everyone's villager (A's, B's,
the guest's) is always on the island: **awake while its person's app is open, asleep where it stands while it's
closed**, at any hour (no night's sleep).

- **Online:** the relay's presence, and for a grace (`GRACE_MS`, 45 s) after a person's last socket closed, on the
  relay's clock, the same instant on every phone ([backend](backend.md#shared-world) "Sleep").
- **Asleep:** the zzz, in none of the island's life; those awake carry on without it.
- **A tap wakes it** (a high-five: [Villager taps](#villager-taps)) for a minute (`WAKE_MS`), the same minute on every
  phone; it's in the island's life then, and it sleeps where it ends up.

### The guest

`contract/guest.ts`, `ui-state/cast.ts` ([backend](backend.md#the-guest), [decisions](decisions.md#the-guest)). A third
person, ゲスト: a visitor to our island, NH's way, with its own key (pairing: [runbook "Pair a
phone"](ops/runbook.md#10-pair-a-phone)). Tests: `?demo&as=G`.

- **What it sees:** our island, the trees and their popups, the menu's ベル row (both wallets) and ごほうび view-only
  (`guest.jarNote` in place of the rewards), the 図鑑, 健康's 活動 (either member's, goals read-only) and everyone's meals.
  Never a 体 figure: the record leaves them out of its snapshot. 設定 as ours, no ボット ([Bots](#bots)).
  ききみみ: the members' games as their summaries. Its island opens at its own villager (far up the island; only the
  open position, `IslandScene` `GUEST_OPEN_BACK`).
- **What it does:** everything on the island a member does (walks, catches, digs, shakes, phrases, high-fives, every
  home's room and its own house's look, the editor, watering, wishes, the weather, the shop, the museum, K.K., the
  board, ききみみ), its finds credited in the shared 図鑑. It earns and spends no ベル, sets none of our goals and writes
  neither the wedding board nor a trip's notes (the record refuses those).
- **Its villager:** as the members' ([Sleep](#sleep)), never on an outing of its own; drawn like the partner's (a lilac
  name tag), a tap a high-five.
- **Who counts as "the partner"**: the guest only where the island's life is everyone's (`ui-state/cast.ts`
  islandActors: its header has each case); the edge face and the goal walks are the members' own.

### The island's layout

`layout/`, `store/layout.svelte.ts`: the outdoors is data anyone of us can change: NH's tiles on a grid, each grass,
sand, a path, a river, a pond or the sea, on cliff tiers, with every tree, bush, rock, lamp, piece of furniture, the
bridge, the stairs and the homes an object on its tiles. The contract is [island-layout.md](island-layout.md). Each
home's look is its owner's, its room anyone's; anyone changes the outdoors, in /editor only ([Decorating](#decorating)).

### Decorating

`layoutEdit/IslandEdit.svelte` (in /editor), `island/Decor.svelte`, `island/decor.ts`. Any of us (the guest too) puts
NH's outdoor furniture on the island, moves, turns and removes it, in /editor only ([island-layout.md "Phone
editing"](island-layout.md#phone-editing)); every phone shows it at once, kept: the decorations are the layout's
objects. At most 1,500 objects stand (`contract/layout.ts` LAYOUT_MAX, the record's cap).

- **The items:** NH's models under their official names, in the tray's tabs (`layout/catalog.ts` `group`; the packs:
  [world3d-assets.md](world3d-assets.md)).
- **The gym** (the tray's ジム tab): NH's fitness furniture. **Used, NH's way** (the six NH lets one use): a tap walks my
  villager up to it and on, and it loops its pose while it stays (press, pedal, run, punch, bounce, pull-up); a tap on
  the ground gets it off. One villager a piece, the earlier keeping it; nothing new on the relay.
  **The bench press:** the bench's own bar is swapped for the gym's barbell, which rides the hands through the press
  (`world3d/benchBar.ts`; [world3d-assets.md](world3d-assets.md) "Parts split out"). The yoga mats are lain on, the speed
  bag punched, the massage chair sat on; the others are to look at (a tap jiggles them).
- **キャンプ:** NH's camp goods: the fires and lanterns lit at night, the cot and the sleeping bag lain on, the chairs
  and bench sat on. **食べ物** (to look at): NH's dishes and drinks.
- **On the island** a placed item is a world thing: NH's model, an obstacle the walk goes round; a tap jiggles it in
  place. The partner's change puffs where it lands.

### The bulletin board

NH's island board on the front beach ([board.md](board.md)): a tap walks my villager up beside it, the camera dollies to
its face and back. Pinned notes, four a page, newest first, plain text (at most 4 lines and 100 characters); a 「！」 bobs
over it when someone else wrote since I last looked. Everyone, the guest too, writes.

### The tent

`tent/` (each file's header has its part), `store/tent.svelte.ts`, `contract/tent.ts`. A tap on the tent walks my
villager to its door, then in: its own 3D screen (its own chunk) behind NH's door iris, black till its first frame; out
the same ([Buildings](#buildings)). The homes' rooms are the same system.

- **One place at a time:** each villager is on the island or in one room (a home, the museum, the shop), on every phone
  (`store/where.svelte.ts`); a phone gone quiet inside has its villager leave 3 minutes after the relay saw it go.
- **The room:** NH's main room, the front wall with the door and its doormat (two tiles kept clear). **Room size** (the
  広さ tab): 4 × 4, 6 × 6 or 8 × 8 (the default, `ROOM_SIZES`) against the same front wall; larger always, smaller only
  with nothing left outside, else those pieces glow red and the bar says how many (decisions: *A room's size never moves
  or drops a piece*).
- **The camera** starts as NH's room camera (47° down, from the front); a drag turns and tilts it, two fingers zoom
  and pan (`rooms/pan.ts`; the hint: `rooms/PanHint.svelte`), ⌂ eases it back; walls in the way cut away. Or [First
  person](#first-person). **The light:** warm, one small shadow map; at night dimmer, lamps lit.
- **The villagers:** NH's 3D models where they have one, else billboards. A floor tap walks mine there (round the
  furniture), a villager tap hops it, a piece tap acts in place, the doormat or ‹ しまへ goes out. The partner's villager
  rests where it last stood while they're away.
- **Stereos** (`tent/stereo.ts`): any room's NH music player plays K.K.'s airchecks on the room's stage
  ([Shared music](#shared-music)), heard by everyone in the room; anyone's tap on the one playing stops it.
- **模様替え** (the foot's green button; the tray and the holding rules: `TentEdit.svelte`): a piece goes down as a
  ghost on the free spot nearest my villager, green or red with the reason; it turns, places, is put away (取り消す for
  5 s) or put back. At most 60 pieces, whole tiles, off the door's two, not over a piece or a villager; a rug lies under
  furniture, a wall piece on a wall's grid. **Table tops:** small things one a tile, carried with the table
  (island-layout.md "Table tops").
- **Whose room:** anyone arranges any room, the guest too; only a home's look stays its owner's. The tray is the
  **editor's**: the starter set, the island's finds and catches and their own buys; a piece is a catalogue entry, not
  a count. Two editing at once merge as every decor op (decisions: *Decor is a last-writer-wins map*).
- **取り消す, 全部片付ける** (`tent/steps.ts`): 取り消す takes back my last change in this room (⌘Z too; this phone's).
  全部片付ける, asked first, puts every piece away (wallpaper, floor and size stay). A clear, a call-up and their undo
  are one group the record keeps all or none (backend "Groups").
- **Saved arrangements** (保存; `contract/roomSave.ts`): three slots a room, anyone's: save, call up (asked first, one
  取り消す) and delete; a piece no one could put there now is named, asked before and told after.
- **Sit, lie and switch** (`tent/seats.ts`, the museum's benches too): a tap walks my villager to a chair's or bed's
  nearest free side ([Seats and beds](world3d-assets.md#seats-and-beds)), a floor tap gets it up, the first to sit keeps
  the seat. A light switches with a tap, kept with the piece; NH's room switch (💡) dims the room's light.
- **Phrases** ([Villager taps](#villager-taps)): the say button in every room (hidden in 模様替え and under a sheet), shown
  only to phones whose villager is in that room.
- **The Happy Home Academy** (`tent/hha.ts`): the first visit after the room changed that day, ハニワくん's letter rates
  it (NH's points; bronze, silver, gold) with one remark. No ベル.
- **Shared:** each change is one op ([backend](backend.md#events)); a held piece moves on the others' phones with a
  yellow footprint, not theirs to pick up, and drops back if silent (`tent/dragLink.ts`).
- **The ceiling:** a layer over the floor's, taps go through it. **Gyroids:** a tap sets one bobbing, silent. The
  models: NH's whole catalogue but character customisation ([world3d-assets.md](world3d-assets.md#room-packs)).

### Critters

`island/critters.ts`, `island/critterPath.ts` (each header has its numbers). NH species on the Tokyo clock, frequent,
the same on every phone (ambient life's slots: [backend](backend.md) "Ambient life"):

- **Who comes:** a shadow off every stretch of the coast most of the time, the front beach's bubbles on a channel of
  their own, each fresh water its own shadow ([Pond](#pond)), up to two roaming bugs. A fish's odds are its water's,
  month's, hour's and sky's alone. **Seasons are a flavour, not a gate:** any species in any month, 3× likelier in its
  NH northern months; hours still hold.
- **Where it is, is the world's** ([Shared world](#shared-world)): its seed picks every swim, landing and hop at its
  time, so every phone has it at the same spot; a catch or an escape is shared by its id (first wins).
- **Fishing** (`island/fishing.ts`, its header: the reach, the nibbles, the window): a tap on any water casts there
  from where my villager stands (no walk). A shadow near the float nibbles, then bites (NH's 「！」); while the line is
  out any tap but a door is the reel: on the bite it catches, earlier it scares the fish. 1 in 14 a boot, tire or can.
- **How the bugs move** (`critterPath.ts` bugPath, NH's paces): butterflies meander and land on a flower, a bee never
  lands, a dragonfly darts and hovers, a firefly drifts, hoppers hop; none faster than a running villager.
- **Fish:** NH's sea and pier fish, NH's shadows by size. **Bugs:** NH's, each where NH keeps it (`critters.ts` where
  the island lacks the spot); a tap nets one; a near miss startles it; at night the tarantula and the scorpion rear up
  at a first tap and charge off at a second.
- **Diving** (`island/sea.ts`, NH's sea creatures): bubbles rise off the front beach now and then; a tap dives; 1 spot
  in 25 is a pearl.
- **The catch:** the official icon pops onto a plate with NH's catch line; every catch's and find's plate (anyone's)
  goes in one stack at the bottom centre (`island/CatchStack.svelte`), at most 3. World cues `scene-<kind>`
  ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`. The day's items derive from the Tokyo date and time plus a seed, so every
phone agrees; what anyone picks up, digs or opens is gone on all ([Shared world](#shared-world): first wins). The first
of each shell, fossil and fragment is a ずかん `find`.

- **Seashells** (NH's; the summer shell rare): one washes up every 60–120 s, the newest three lie on the sand. One that turns up while the island is open rides the next wave up the beach
  ([World](#world) "The sea's wash"); what lies there as the island opens just lies. `?find=washed` washes a bottle in.
- **Fossils** (NH's): **four dig spots a day** as in NH (`beach.ts` `DIGS_A_DAY`), shown only clear of every
  control; a tap digs one up, gone till tomorrow.
- **Mushrooms** (`island/mushrooms.ts`): November's, beside the trunks, NH's weights. No `find`.
- **Message bottle:** every 8–14 minutes one rocks at the water's edge for 6; a tap reads its note (16 notes).
- **Star fragments:** each wish on a shooting star is one fragment on the beach the next morning (at most 8).
- **A balloon's present:** where it lands; what's inside is decided at the tap and shown on every phone. A tree's
  present is the same ([Shaking a tree](#shaking-a-tree)).

### Island care

`island/Care.svelte`, `island/care.ts` (no ベル, no find):

- **Weeds** sprout every 30–60 minutes on the day's free weed spots, the newest three at a time; a tap pulls one, gone
  on every phone.
- **Watering:** a flower tap is NH's watering can; a flower watered today glitters for the day on every phone. The
  flowers watered yesterday have a 1 in 4 chance of a hybrid on one of them today, the same everywhere.
- **The rock** (on the health lawn): a tap clonks it with the shovel; 1 in 4 a sparkle, 1 in 8 a pill bug or a
  centipede crawls out.
- **The fields (はたけ):** NH 2.0's vegetables, a field each (a member's own: only its owner plants and harvests,
  anyone waters, the guest's only if the editor gives it one), starts from the shop, produce sold for かいがら:
  [farming.md](farming.md).

### Pond

`island/pondFish.ts`. NH's pond (lily pads and a slow ripple), the river and its mouth, and the spring and the river
above the cliff.

- **Fresh water by where you cast** (NH's locations: the pond, the river, its mouth, the clifftop); the river's own
  also come to the mouth and the clifftop.
- **Visits:** as often as the sea's, one shadow per water, a while if nobody fishes, smaller than the sea's, every point
  of its swim on that water's own tiles.
- **Its bugs:** the pondskater and diving beetle by day in summer, the giant water bug at night. A catch is a ずかん
  `find` of kind `fish`.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/zukan.ts`, `model/finds.ts`. The ずかん is its own sheet, opened from 設定's last row (設定
closes; on its rows ‹ goes back to 設定, ✕ to the island): one row per kind with how many have been found, a row → that
kind's page. Shared (the first `find` of anyone): 魚, 虫, 海の幸, 化石 (laid out like NH's museum), かいがら, カタログ (by NH's
categories) and レシピ (by season); the counts: `zukan.test.ts`. Every catch and pick-up counts:
each found tile its count, the picked entry its total and each person's (the day tallies: [backend](backend.md#tally)).
A kind's page: every entry in the game's order, a silhouette until found, its head (the picked entry: icon, name, who
found it when, NH's line) pinned.

### The museum

`museum/` (each file's header has its part). NH's museum (はくぶつかん), a building on the layout
([island-layout.md](island-layout.md#the-islands-buildings)) entered as every room ([Buildings](#buildings)).

- **Rooms** (`plan.ts`: the plan and its rules): the hall (Blathers' desk), the bug garden, the aquarium, **the fossils
  a loop** (NH's: hall > F1 > F2 > F3 > hall) and the gallery off the bug garden. A plaque over each doorway names the
  room beyond in spaced kana; every way back says はくぶつかん.
- **The camera** (`camera.ts`): the whole room across, a drag, two fingers and ⌂ as the rooms'. Or [First
  person](#first-person). Taps, phrases and presence as the rooms'.
- **One room at a time** (engine.ts showRoom; [decisions](decisions.md)): only my villager's room is drawn. Each doorway
  shows a card in the next room's colour; a tap on it, its plaque or the floor past its line walks through, inside a
  short dip that changes the music ([Place music](#place-music)) and closes every balloon.
- **Light and night** (`look.ts`, `bake.ts`; nothing per frame): baked light on each floor, NH's lamps with halo cards,
  the tanks' water the brightest thing; at night the room dims and the pools and cards take over. A room change compiles
  nothing ([perf](ops/perf.md)).
- **The curator:** フータ behind his desk, watching my villager near him, else still but for his blinks (the visitors
  too); he greets me once a visit, a tap is one of his lines (never twice running), now and then the newest find.
- **Visitors** (`visitors.ts`): NH villagers from ききみみ's cast through the Tokyo day, a few a room, seeded by the date
  (the same everywhere, nothing sent); a tap: a hop and a line in its personality's voice.
- **What's on show:** one of each fish, bug, sea creature and fossil in the ずかん's first finds and each genuine artwork a
  present has held. A tap: its card (who found it and when, a skeleton's progress), docked clear of the exhibit; with a
  card open any tap only closes it.
- **HUD:** a room chip at the top centre (the plaque's word and what's on show). **NEW** (`newTags.ts`): a find of the
  last 24 h not yet opened on this phone gets a gold 「NEW」 card; the chip counts them.
- **The wings** (`aquarium.ts`, `garden.ts`, `fossils.ts`, `gallery.ts`: each header has its exhibits): the hour's pick
  of the caught fish and bugs living as on the island, a skeleton's pieces in a row until whole, the genuine artworks a
  balloon's present now and then brings. A wing is built as my villager nears its doorway (plan.ts nearRooms).

### First person

`rooms/firstPerson.ts` (the lens, the head's limits, the glide), `rooms/gesture.ts` (the finger's rule). In the tent,
the homes and the museum the eye button (bottom left, yuzu while on) puts the camera at my villager's eyes, and back;
kept on this phone (`island.fpv`; `?fpv=1|0`); off during 模様替え.

- **The eyes:** the model's own eyes, the walk's bob damped, the idle's breath never moving the camera; kept off the
  walls and out of what stands taller. My villager's body is hidden near the camera. The glide in and out is short;
  through a door the eyes come at once.
- **Closed rooms:** at the eyes every wall stands, with a ceiling over each room, a lintel over each opening and a closed
  door in each doorway (a tap goes out).
- **The finger** (one rule at the eyes and off them): a short still touch is a tap, acting where it lifts (a villager,
  piece, seat, door, the curator, an exhibit; else the floor walks; else a boop); past a few px it's a drag: the camera
  only, never a walk. A second finger: a pinch (at the eyes nothing).
- **The head:** only a drag turns it, no inertia. It starts where my villager faces; after that a walk never turns it.
  The body faces its walk; standing, it turns to where I look; seated, only the head. No pinch, no zoom, no ⌂. A tap
  walks to the floor under it; the museum's taps stop at the first wall on the ray. My balloon stands at the view's foot.

### The shop

`shop/` and `contract/shop.ts` (each header has its part; prices: `npm run shop:prices`). NH's Nook's Cranny (タヌキ商店),
a building as the museum ([Buildings](#buildings)), with its own money, かいがら, never ベル
([decisions](decisions.md#the-shops-かいがら)): the island's catches sell for them and buy furniture for the rooms. Each
person has a pocket and かいがら, the guest too.

- **Inside, in 3D** (`shop/plan.ts` on the rooms' engine): NH's Nook's Cranny, in by its door. まめきち and つぶきち
  behind the counter; today's stock in the room, the same on every phone (stage, table, back wall; the rest in the list
  only). The camera as the rooms' (a drag, two fingers zoom and pan, ⌂). **Others in the shop are drawn** (presence
  `sc: 's'`).
- **The finger** (the rooms' rule): a floor tap walks; a tap on a piece picks it in place (its card: price and 買う); a
  tap on the twins (their bodies and the counter's top), their balloon or the sign (「タップで かう・うる」) opens the list
  at once, on its last tab (an empty pocket: かう). No choice box, no auto-open. The twins talk only in the room.
- **The list** (`shop/Counter.svelte`: its header has the rows and the bar): 売る · 買う, my かいがら in the bar.
- **うる**: my pocket (caught, found or picked up, less sold) by section; a row picks its stack, − / + one, 全部 all of
  it. Selling leaves the ずかん and the museum; presents and bottles never sell.
- **かう**: today's stock, 24 pieces a day, seeded (a pack's pieces side by side), less what the island had by midnight;
  past my かいがら dimmed. The starts ([farming.md](farming.md)) in rows. Bought: in 模様替え.
- A sell or a buy shows at once, a one-line toast, 取り消す for 5 s, then the record checks it
  ([backend](backend.md#events)).
- **Prices:** NH's Bells ÷ 20 both ways (a sell at least 3); a piece NH never sells is made up (4 × its NH sell price ÷
  20); at most 10,000.

### Dialogue

`island/pager.ts`, `island/Talk.svelte`, `island/Plate.svelte`. The speech balloon and the catch plate read like NH's
box: 33 ms a glyph, two lines a page. A tap finishes the page, the next turns it, the last closes it; an orange ▼ bobs
while another page follows. Left alone a page turns after 6 s. The name tag is tilted on its top-left in the speaker's
NH colour. No voices. A visitor's first tap is their introduction, a first find adds 「ずかんに のったよ！」; a line may end on
NH's answers (Jack, K.K.).

Where it stands, one rule for every speaker (`island/placement.ts` `placeBy`): by the speaker, its tail pointing at
them, nearness first; clear of every control if it can, never over the HUD, しずえ's box, a popup or the speaker. It
follows a speaker who moves (`island/balloonFollow.ts`) and closes if they go.

### Villager taps

A tap on my villager is a squish and the tap sound (seated, where it sits), and in NH's flea months now and then a flea
hops off ([Critters](#critters)); nothing opens.

**Phrases** (`island/SayPicker.svelte`, `island/say.ts`): the say button ([Island](#island)) opens the phrase picker
above it: my own last four (newest first, kept on this phone) and a field (at most 20 characters). No presets: only my
own words. A pick hops my villager and shows the phrase in its balloon for 4 s (the name on a tag in the person's
colour), on every phone (presence only). One balloon at a time.

A tap on the partner's villager is a **ハイタッチ** at once, in place: they stop (woken first if asleep), a sparkle flies
from my villager to them, both turn and hop, hearts as it lands. Their phone plays the same moment from the same
start; closed, it hears it when it opens, once (`island/highFives.ts`). A tap while one is under way adds nothing. Off
screen, the edge chip brings the camera to them.

### Players

`components/player3d/`, `components/person3d/person3d.ts`; everything else: [players.md](players.md). A and B are NH's
human players by default (`contract/look.ts` DEFAULT_LOOKS), assembled at runtime from parts converted from the game
files ([world3d-assets.md "Players"](world3d-assets.md#players)). `person3d` is the one seam between the look a person
wears and the model a scene stands up (a player or a roster villager), swapped in place when the look changes; the 2D
heads (`characters/Avatar.svelte`) show the look's portrait. A part a look can't have is drawn as いつもの's.

### Visitors

`island/Visitor.svelte`, `island/visitors.ts` (its header: who comes when). NH's visitors, one at a time, each NH's own
3D model (a character with none never comes), seeded by the date: **Daisy Mae** on Sunday mornings, Monday to Saturday
one of NH's weekday visitors (none on Saturday from 18:00: [K.K. on his stool](#kk-on-his-stool)); **Jack**,
**Celeste**, the holiday hosts and the wedding couple on their days. Priority (`visitorAt`): the event's host, the
wedding couple, Celeste, (Saturday evening: nobody), Daisy Mae, then the day's. They stand on centre stage (the
visitors' spot, put in the editor); **Gulliver washes up on the front beach** (his spot), face down (the spots' rules:
[island-layout.md](island-layout.md) "Derived, never hand-made"). A tap: my villager turns to them, their introduction
the first time, then a line. No trading, no ベル.

### Visitors: roles

`island/visitorRoles.ts` (pure; who plays which role). NH's other special characters come as **guests** through the
visitors' one slot, each NH's own 3D model, each with a role the one framework plays from per-character data:
**shop** (グレース, ナッティー: 6 pieces of the shop's list, seeded, never today's stock or one the island has),
**gift** (a piece for the rooms, once a visit, to whoever asks first), **fortune** (ハッケミィ: each person's luck and
colour for the day), **fish** (セイイチ: the next fish caught feeds him, then his gift), **cheer** (a hop and a line at
each catch of their kind) and **chat**.

**When and where** (its header): one guest a day, 06:00–22:00, a seeded cycle, at the editor's **guest spot**
(`layout/spots.ts`); **the collision rule:** with none usable, at centre stage beside the day's visitor; the beach
guests on Gulliver's beach, but at the guest spot on a day Gulliver lies there. Weeds and fossils keep off the guest
spot. `?guest=<id>|none`. **The cast** (the 図鑑's cast page): every special character with NH's head icon and where we
meet them.

### K.K. on his stool

`island/KKSlider.svelte`, `island/kkSlider.ts`. K.K. Slider (とたけけ) lives on the island on his **stool**: a layout piece
(one on the island, never removed, moved and turned in the editor; its front tile kept clear), by default on まえ's lawn
west of the main path. He's no visitor (never in the schedule). What he's up to goes by the Tokyo clock (`kkMode`;
`?kk=show|day|asleep`):
- **His show, Saturday 18:00–24:00** (NH's concert): a tap is his greeting with NH's choice box; the villagers sway
  and a caption sits by him on every phone. **By day** he strums quietly; **asleep** 00:00–06:00. Either way a tap
  offers a song all the same.
- **Anyone, any time:** with ミュージック off, picking a song turns it on on that phone. **The song is everyone's**: the
  island's music stage ([Shared music](#shared-music)), anyone's stop stops it for all. A tap turns my villager to him
  (no walk).

### Visitors: life

`island/visitorLife.ts` (pure; its header: the signatures, the beats, arriving and leaving). The visitor is the stage
director's fourth actor, a beat on every idle slot (nothing while its line is up). **Gulliver** sleeps face down; a tap
is a nudge and his sleep talk, the **fifth** wakes him for the day. A tap: my villager turns to them; the visitor walks
back to its spot, turns with a hop and speaks. On a page's first paint they're simply there.

### Halloween

`island/events.ts`, `island/Halloween.svelte`. NH's Halloween on Oct 31 (Tokyo): NH's pumpkins on the lawn all day;
17:00–24:00 they light up and **Jack** comes; his 「トリック オア トリート！」 ends on NH's answers (no candy is his trick: party
nose glasses on my villager for a minute).

### Holiday hosts

`island/events.ts`, `island/visitors.ts` (`HOSTS`), `island/eggs.ts`. Each NH holiday is one date rule in `events.ts`
(`nthWeekday`, `easter`); its host takes the visitor slot with an introduction, four lines and two villager day lines:

- **Franklin**, Turkey Day (the fourth Thursday of November, 09:00–24:00): he asks for a fish; the next fish caught that
  day (`island:catch`) makes him happy (`scene-franklin`).
- **Jingle**, Toy Day (Dec 24, from 05:00), beside the decorations.
- **Zipper**, Bunny Day (Easter Sunday; the seven days before are the celebration). All week NH's eggs turn up: a
  balloon drops a sky egg 1 in 3, a dig spot an earth egg 1 in 4, the line a water egg 1 in 6.

### Birthdays

`island/birthday.ts`, `island/Birthday.svelte`, `island/Cake.svelte`, `villagers/birthdays.ts`. Ours come from `PEOPLE`
in `config/rules.ts` (null turns one off; Feb 29 falls on Feb 28). On one: both villagers wear NH's birthday hat; NH's
cake by centre stage, confetti, しずえ's greeting; a tap on the cake plays ハッピーバースデー on the island's [shared
stage](#shared-music) and blows the candles out for the day on every phone. An NH villager's own birthday puts the hat
on it.

### Wedding countdown

`island/wedding.ts`, `island/Wedding.svelte`. The wedding date is the 結婚式 board's `date` setting
([wedding.md](wedding.md); `time/holidays.ts` `weddingDate`); the island, its weather and its music read that one date.
On the milestone days (`wedding.ts`) Reese and Cyrus are the visitor under a heart float, Reese's introduction ending on
the count. On the day the villagers bow and glow, confetti (`scene-wedding`) and fireworks from 19:00. Every June Sunday
NH's wedding arch stands behind centre stage.

### Shooting stars

`island/stars.ts`, `island/SceneTaps.svelte`. On a clear night (19:00–04:00): every 3–8 minutes of on-screen night 1–3
streaks (1 in 6 a shower of 5–8); a meteor shower's night one every 3–8 s. A quick white streak to the lower left, clear
of every control. **A wish:** a tap in the sky while one crosses: sparkles, a chime (`scene-wish`), 「ながれぼしに おねがい！」, and
a fragment the next morning.

<a id="celeste-and-meteor-showers"></a>**Celeste and meteor showers** (`island/meteor.ts`): about one night in ten, at
most one a week (seeded by its Monday), Celeste visits 20:00–04:00 and shooting stars cross every 3–8 s; her lines
explain wishing, the fragments and the season's sign (the zodiac fragment twice as likely).

### Fireworks

`island/fireworks.ts`, `island/Fireworks.svelte`. Every Sunday in August 19:00–24:00; New Year's countdown (Dec 31
23:00, a volley at midnight, the show until 01:00); the wedding night from 19:00; and a volley of 3–5 the evening both
of us meet all four goals (once a day per phone, from 18:00). A shell rises from behind the island and bursts in NH's
colours, clear of every control; a tap in the sky during a show sends one more. ≤ 4 bursts at once.

### Group stretching

`island/stretching.ts`, `island/TapeDeck.svelte`, `motion/stretch.svelte.ts`. NH's tape deck (a fixed layout piece, NH's
boom box) plays on a day either of us met 🍑 Exercise, or when the island is opened 06:00–08:00. A tap plays NH's
ラジオ体操 on the island's [shared stage](#shared-music) and every awake villager (the guest's and a visitor too) does
NH's three stretches together on every phone; then it's done for the day.

### ききみみ クイズ

English listening for A, B and the guest: everything is [kikimimi.md](kikimimi.md) (speaking
[kikimimi-mic.md](kikimimi-mic.md), the content [curriculum.md](curriculum.md)). On the island: the menu's 英語 pill
opens its full-height sheet, the island paused under it; an invite shows as a toast and on the pill
([kikimimi.md](kikimimi.md) "UI details").

### Trips

旅行, the trip guides (data, relay and maps: [travel.md](travel.md)), in the [unified kit](#unified-kit): the menu's
旅行 pill opens a full-height sheet (`components/travel/TravelSheet.svelte`: its header has the opening and the levels),
the island paused under it; a private value not in yet shows 🔒.
- **The list:** upcoming (soonest first) and past, a boarding pass each (the days to go counted at home, Tokyo's day,
  as 結婚式's).
- **A trip:** the photo band, then 日程 · 地図 · キャンプ場 · 持ち物 (each only where the trip has it). 日程: the timeline
  on the trip's own clock (the day on now first, its row lit). 地図: the day's stops; a row flies the map there, a pin
  scrolls to its rows.
- <a id="offline-maps"></a>**Offline maps** (`components/offline/SaveButton.svelte`; data: [backend](backend.md)
  "Service worker"): one pill per area, over the trip map and every trail's map: save (its size) → saving (a percentage,
  × cancels) → saved; a partial or evicted save offers a retry, an area past 30 days an update; a save that can't start
  says why (offline, the 150 MB total, storage, another save). A trash pill deletes a saved area. Offline, the map says
  it shows the saved range only. The feature docs give only their areas' sizes.
- **持ち物:** a card per category, a row per item with my tick (each ticks their own) and who has packed it; 編集 adds,
  removes and resets my ticks; the guest changes only what it added; deletes act at once with 取り消す.
- **A trip that's over is read-only.** The guides are reading cards, denser than
  [Simplicity rules](#simplicity-rules) otherwise allow; their text breaks only between words (`Txt.svelte`).

### Seasonal look

`ui-state/preview.ts` (pure; its header: what follows the look and what never does), `panel/SeasonSection.svelte`.
設定's **季節** shows the whole island another day's look, on every phone at once: an event, a season (春 / 夏 / 秋 / 冬), the
weather and the time of day (朝 / 昼 / 夕方 / 夜), each **自動** by default. Anyone sets it, the guest too; it stays until
someone sets it back (`pref seasonLook`, one island-wide slot). Folded to one row (自動, or what's forced, and **自動に戻す**
while anything is). **天気** is one group for both the look and [Weather](#weather)'s switch: 自動, ゲーム, 晴れ / 雨 / 雪.

- **Events:** each brings its day's look and, for the evening ones, the night sky. **Only the look follows it**
  (`preview.ts`): never the scene clock, the days records are keyed by, nor what the island yields (critters, eggs,
  mushrooms; a wish brings no fragment while it's on).
- **On screen:** a chip under the HUD row says what; a tap on it goes back to the real day for all.

## Motion

- **Rig** (`Villager.svelte`, `Host.svelte`): `.actor` › `.face` (facing) › `.body` (one motion) › the art; what sits on
  a render's head goes by `villagers/heads.json` (`npm run heads`). The director (`motion/director.svelte.ts`) holds one
  state per actor (mine, the partner's, しずえ, the visitor); `holdEvents(ms)` queues event reactions behind a routine.
- **Primitives:** `if-` keyframes in `tokens.css`; durations in `MOTION_MS` (`motion/reactions.ts`) must match.
- **Marks:** villagers get floating marks (`Mark.svelte`) or official glyphs; しずえ the cream bubble (`Emote.svelte`).
- **Reactions** (`REACTIONS`): first open, the partner's day growing, high-fives, a goal met, all four met, taps,
  waking, a low week (Thu–Sat), a sync problem, the harvest. Never on first render.
- **Idle life** (`motion/idleLife.svelte.ts`): on ambient life's slots, so every phone plays the same: one villager does
  one small thing or sets off on an outing, or both chat or dance; after 3 min idle, stopped after 10 min; paused while
  hidden or covered. Only a villager whose person isn't on the island goes on outings.

### Walking

`island/walkGraph.ts`, `island/tapWalk.ts` (their headers: the walk mask, the routing, the speeds), `layout/nav.ts`,
`island/avatar.ts`.

- **Only empty ground walks my villager:** a tap on something to do (a tree, a bush, a flower, the rock, a weed, a
  find, a bug, a fish shadow, the bubbles, the water, the tape deck, a visitor, the partner) acts in place: my villager
  turns to it and the action plays at the target, its tool there. The exceptions, walked up to: the doors, the board, a
  seat ([World](#world) "Sitting on a tap").
- **Tap-to-walk:** my villager runs there, over the bridge and up the stairs. A tap on ground it can't stand on snaps
  to the nearest walkable point near it, unreachable ground to the nearest reachable point; water never walks (it
  ripples); a building's footprint knocks at its door. A cream ring marks the spot.
- **Where my villager is, kept**: the island opens with it where it last stood, however long after; only a player never
  placed starts at home. A phone gone (closed, hidden, offline) leaves its villager where its
  last walk ended, on every phone, asleep there ([Sleep](#sleep)).
- **Never a teleport on another phone:** a big gap glides off at the run while in view; only a phone opening, or the
  island hidden, puts it there. **The camera never moves for a walk:** only the finger scrolls.
- **Sheets and hiding:** a sheet stops everyone; uncovered, the outings wander back; hidden over 30 s, they're back on
  return. A balloon opens only over a villager standing still.
- **Footsteps** by the ground (a splash on a rainy day).
- **Off screen** ([Shared world](#shared-world)): a round face of the partner's villager is pinned at the edge; a tap
  scrolls to them.
- **Goals:** a newly met fruit walks that person's villager to their tree; ふたりでぜんぶ brings both to the middle of the
  lawn for a high-five.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`, the box's rules: [Dialogue](#dialogue)): an `aria-live` mirror. **Banner**
  (`ui/Toast.svelte`, one at a time): the whole message, wrapped by phrase (`i18n/phrases.ts`: keep-all with a `<wbr>`
  after a particle or 。, as WebKit has no `auto-phrase`), a number never cut; a long one grows it. Sheet hints and
  notes use the same `ui/Phrases.svelte`.
- **Buttons:** every tappable has an edge, static cards only a soft lip ([Sizes](#sizes)). Primary leaf, secondary
  cream, selected yuzu, disabled sunk; "can't now" = `aria-disabled` ([Taps](#taps)). The shared skins:
  `styles/theme.css`.
- **Text colours by surface:** themed surfaces take `--text`, `--text-soft`, `--leaf-text`, `--coral-text`; an
  always-cream object (a bubble, a cream button, a ticket) carries `.obj-cream`, the day colours back inside it. Content
  text ≥ 13px (`--fs-s`); ききみみ's `readability.test.ts` holds both.
- **Focus:** no ring after a pointer input (`ui/modality.ts`); focus is restored for keyboard and VoiceOver.
- **Tokens** (`styles/tokens.css`): ink `#4A3A2C`, cream `#FFF9E3`, paper `#F5E4BC`, card `#FFFCF2`, edge `#937047`,
  leaf `#6ED07A`, yuzu `#FFD84D`, mint `#7BD7C1`, coral `#FF8F7A` (errors only), the chart pair `--person-a` `#2F86BD` /
  `--person-b` `#D2701F` (night `#7EC8F0` / `#FFB066`; CVD-checked); one `--z-*` stacking scale.
- **Theme:** `data-tod` comes only from the Tokyo clock (`prefers-color-scheme` ignored); night chrome `#3A4886`. The
  HUD, plate, dialogue and choices stay cream/yellow.

## Copy

Two zones, by where a string shows (`i18n/linebreaks.test.ts` WORLD lists the world's keys):
- **The world** (the island and its rooms: lines, `Bubble`, signs, in-world notices and toasts, the HUD, the tree's
  plate): kids-style spaced kana (分かち書き), 「つうしん中…」, 「みずやり ずみ」. `word-break: keep-all`: a line breaks only at
  a space or after 、。！, so no run without one is over 12 characters.
- **Everything opened from it** (every sheet, panel, level, dialog and form, pairing, the error page, the editor, the
  board, the shop's menu; an NPC's line inside one stays the world's) **and the leaf menu's pills** (kanji: easier to
  read): natural adult Japanese with kanji and no spaces between words (a space only around a number or Latin: 「目標
  8,000歩 以上」). `dialog`, `[role=dialog]` and `.sheet-copy` are `word-break: normal` (`line-break: strict`); a bubble
  is keep-all wherever it is.
- **One spelling a term** in every sheet: 設定 · 記録 · 目標 · 歩数 · 体重 · 完了 · 削除 · 取り消す · 保存 · 編集 · 決定 ·
  キャンセル · 閉じる · 戻る · 元に戻す (restore; an undo is 取り消す) · もう一度 · 今日 · 変更 · 同期 · オフライン · 住民 ·
  ゲスト (the guest player; お客さん only for NH's visitors) · 姿 · 模様替え · 片付ける · 季節 · 天気 · 図鑑 · 捕まえた ·
  作る · 資料 · a range with 〜; the game's own words stay (ベル, かいがら, がんばり, ふたりで全部, いつもの, ごはん, ごほうび) and official names as NH
  writes them. A sheet's title may differ from its button (けんこう → 健康, 英語 → ききみみ). linebreaks.test checks the sheets'
  keys for spaces between Japanese characters and for the kana spellings of the list.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard from
`visualViewport` (`ui/keyboardInset.svelte.ts`: `keyboardInset`, `withKeyboardInset` sets `--kb`; never `innerHeight`).
Safe areas only through the tokens (`--safe-*`, `--ui-top`, `--pad-foot`), never `env()` in a component. Short screens
scale the island down. Check at 393×852, 375×667 and 320×568, day, dusk, night and winter.

## Official art

Official NH renders only from `static/art/` through `<OfficialArt>`, with a fallback so a missing file never breaks a
screen; WebP, never upscaled. Manifest and helpers `lib/art.ts`; files from `scripts/fetch-assets.ts`, but the
catalogue's, the critters' and the finds' icons: NH's own 2D icons from the game files (`scripts/nh-icons.ts`). The
villagers and special characters: `lib/villagers/roster.ts`. Ours: sky, sea, ground, the jar, effects,
marks, UI sprites. Names follow the Japanese game; no Nintendo fonts.

**The 3D renders** (`npm run models`: `scripts/models.ts`, its header): what NH has a model of is rendered from it for
the 2D art (the campsite, the trees in their seasonal looks, the bushes, the lamps, the rocks, the bridge, the
decorations), from the world's view, lit NH-style, under the scene's art keys; every look of one thing shares one
crop. The 3D pipeline: [world3d-assets.md](world3d-assets.md).

## Sound

`lib/sound/`. <a id="sound-settings"></a>**Sound settings** (設定's サウンド): **ミュージック** (music, ambience),
**効果音** (effects, jingles), **音量** 0–10; both off at first, turning one on previews it; this phone's only
(`island.sound`). Nothing sounds without a visible reason (idle life is silent). The music
is our own files; every effect is an original placeholder (`synth.ts`), replaceable by a file.

### Hourly music

One track per **Tokyo hour** (`hourly.ts`) in sunny / rain / snow arrangements (a missing variant falls back to sunny),
a 3 s crossfade on the hour, each file a gapless loop. Turning ミュージック on plays the opening theme first. Under a
sheet, the panel or the harvest the music is low-passed.

### Event music

On NH's event days its track replaces the hour's (`events.ts`, over the shared dates of `time/holidays.ts`), with the
hour's crossfade at the boundaries. A track without its file is the hour's music (or its `alt`):

The days, hours and titles: `events.ts` (the wedding day is the board's date).

**Cut-ins** (`sound.svelte.ts`) swap at once over the island's music and hand back to it (each phone's own): the wasps
(Chased by Bees while they chase; a sting plays Stung by Bees once) and Franklin's cooking jingle. The stretch's
ラジオ体操 and the cake's ハッピーバースデー play on the island's shared stage instead. A cut-in ends at its end, when its
file can't play, at 音量 0, or when ミュージック goes off. Now Playing and the Media Session name the track.

### Place music

As in NH, a building's room plays its own track in place of the island's (`places.ts`), faded under the door's black.
What sounds, first there wins (`choose.ts pickMusic`): the opening theme, a cut-in, a shared stage, the room's track,
the island's. The museum's rooms each their own (`museum-hall`, `-bugs`, `-fish`, `-fossils`, `-art`, the room my
villager's, settled a moment past an opening), the shop `shop`; the tent and the homes none (NH's houses play the
hour's music). A room without a file keeps the island's music; a door's track is fetched while my villager walks up.

### Shared music

`sound/stage.svelte.ts`; the mechanism (the record, its last-writer rule, the seek, the unlock):
[sound-sync.md](sound-sync.md). Continuous music someone starts is a **stage**, one record per source, the same on
every phone: the island's (K.K., the stretch, the cake) and each room's stereo. Visuals follow the record for
everyone; the sound plays only where the stage is, with ミュージック on, 音量 above 0 and audio unlocked, from where the
song is now. Mute and volume stay local. The first tap after the app opens picks the song up mid-song.

**Another player's sounds** (a shake, a dig, a splash, their footsteps…) reach every phone through the intents that
show them, each played where it happens, by the island camera's ear (none off screen, softer toward the edge:
sound-sync.md). Personal sounds stay mine: the controls' taps, the shop, the ききみみ cues, my wasps' music, a setting's
preview.

<a id="kk-slider"></a>**K.K. Slider** (`kk.ts`, its header: the list, adding a song): K.K.'s songs, NH's titles, their
own chunk loaded the first time K.K. or a stereo's list shows. K.K. on his stool plays his live file on the island's
stage, a room's stereo its aircheck; a pick never repeats the last one; the offered songs are prefetched.

### Ambience

`ambient.ts` on the music bus, crossfaded, by the hour, month and weather (waves always; birds, cicadas, higurashi,
crickets in their hours and months; nothing alive in rain or snow). The beds are **procedural** (`ambientSynth.ts`: original loops, its own chunk); a file
at `ambient.<id>` replaces a bed.

### Cues

`cues.ts CUES` maps moments to sounds, levels and delays; nothing calls `play()` directly. Reactions name a cue per
step, taps in `data-sfx`, outcomes call `cue()` (scenery → `scene-<kind>`). The first open of the day (しずえ's
`announce`) plays NH's **radio jingle** (`radio.ts`: morning, noon or evening, one of six by the date, or the holiday's
own). A sound without its file borrows a
`like`'s (`ids.ts`). **World cues** are skipped while a sheet, the panel or the harvest covers the scene; UI cues (soft
mallets and bells for the panel, cursor, confirm and cancel) always play. Dialogue is silent.

### Taps

Every tappable names its sound in `data-sfx`; one capture listener (`taps.ts`) plays it on the click. `self`: the
handler plays the outcome's cue; `none`: silent. A control with `aria-disabled="true"` has its click swallowed and
plays `boop`. Enforced by `taps.test.ts`.

### Mix

Buses (`mix.ts` LEVELS): music, ambience and effects under the voice (ききみみ's clips: 音量 alone; they duck the music as
a jingle does); master 音量 squared (default 0.8). A few voices at most and a cap per sound; jingles never overlap and
duck the music. Effects decode on the unlock (only while 効果音 is on), but the `lazy` ones (the radio jingles, the
complete fanfare), fetched at first play. Effects jitter pitch.

### Engine lifecycle

`sound.svelte.ts` drives `engine.ts`; the rules are pure in `session.ts`; `engine.test.ts` uses a fake context.

- **Unlock:** no context until a setting is on; the first tap creates and resumes it and unlocks both decks; with
  ミュージック on the hour's file is fetched just after launch, so that tap starts it.
- **Nothing queues:** a cue on a context that isn't running is dropped; a tap's own sound may run just after its resume.
- **Idle suspend:** with only effects on the context sleeps a few seconds after the last sound.
- **Background:** hidden → decks paused, ambience stopped, context suspended; back in front the hour fades in.
- **Music off:** the fade-out, then every music file in memory released.
- **iOS session:** `ambient`: it mixes with other apps' audio and follows the Ring/Silent switch.
- **Voice session** ([kikimimi-engine.md](kikimimi-engine.md#audio)): a ききみみ game wakes the context even with sound
  off, holds it awake and sets the session to `playback`; its end hands back to the settings.

### Audio files

`static/audio/manifest.json` (`manifest.ts`: its header has the keys) and K.K.'s `static/audio/kk.json`. Each entry's
`v` is its file's content hash, so `/audio/*` is immutable ([backend.md](backend.md#service-worker)). Add a file and its
entry, no code change; a missing file falls back (an effect's placeholder, ambience's procedural bed, music silent).
`npm run audio:music -- <dir>` (`scripts/music.ts`) builds every entry from our MP3s; `sound.test.ts` checks every
path, hash and folder budget. Audio is never precached.
