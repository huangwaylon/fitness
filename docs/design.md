# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md), performance budgets and the backlog in [ops/perf.md](ops/perf.md). Numbers come from
`app/src/lib/config/rules.ts`, which wins if they disagree.

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
- **Principles:** zero required taps a day; both people see all data; no notifications (the app is opened by choice);
  everything always animates (no reduced-motion variants, but where noted).

The code map is README's Layout; `deps.test.ts` enforces the modules' import direction. Shared helpers: lazy chunks
load through `ui-state/reload.ts` `lazy`, failures a caller goes on without through `quiet()` (`lib/quiet.ts`), easing
and clamping `lib/math.ts`, a static file's URL `staticUrl()`, the synced last-writer-wins maps `store/synced.svelte.ts`.

## Simplicity rules

- No app tab bar: 島 (the island), the health popup (tap the dumbbell: 健康 and ごはん, its two tabs), and behind the
  HUD menu's leaf the panel for the ベル (ごほうび), 旅行 ([Trips](#trips)), 結婚式 ([wedding.md](wedding.md)),
  トレイル ([hiking.md](hiking.md)), ききみみ ([kikimimi.md](kikimimi.md)) and 設定 (the 図鑑 its last row), each its
  own sheet.
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
- **HUD row:** [the health button] [the menu], right-aligned in the top-right corner at `--hud-top` (10px under the
  safe area, clear of iOS 27's top-edge blur), 6px apart; nothing else in the sky. Every target ≥ 44px.
- **Menu** (`island/HudMenu.svelte`, `e2e/hud-menu.spec.ts`), the single home of the menu's order: a 44px cream disc
  with NH's leaf mark, folded by default. A tap unfolds it (the disc yellow, the leaf tipped −40°) into six cream pills,
  right-aligned under the leaf, the same width, 44px tall, its name then its icon or number:
  1. **ベル 121** (my wallet's balance, both members' on the guest's phone; the number is the picture) →
     [the panel](#panel), ごほうび. Its label carries today's ベル for a screen reader.
  2. **旅行** (Orville's head) → [Trips](#trips)
  3. **結婚式** (Harvey's head) → [wedding.md](wedding.md)
  4. **トレイル** (a mountain) → [hiking.md](hiking.md)
  5. **英語** (しずえ's head) → [ききみみ クイズ](#ききみみ-クイズ) (「誘われています！」 under its name, and a coral dot on
     the folded leaf, while someone's invite is live)
  6. **設定** (a gear) → [設定](#settings)

  Labels are kanji ([Copy](#copy)). No "+N" badge on the leaf (it reads as a notification). It folds back on a second
  tap of the leaf, a tap elsewhere (which still does what it would), Esc, any sheet opening, and a pick; folded, the
  pills are `inert`.
- **Health button** (`island/HudHealth.svelte`): a cream pill, NH's red dumbbell across it, no number. Tap → the
  villagers glance up and the health popup opens at once on the tab shown last: [健康](#kenkou) or [ごはん](#gohan). One
  kept sheet; ごはん mounts the first time its tab shows.
- **Coins** (`island/HudCoins.svelte`): each newly met goal flies up as a +1 coin from its fruit into the leaf (+2 with
  its がんばり), the number counting up as each lands, today's ベル in a small yuzu bubble for a moment; never for a
  refund, and not while something covers the scene.
- **Centre stage:** the plaza (ひろば: `layout/spots.ts` `stageOf`), where visitors stand.
- **Villagers:** a tap on mine is a squish; a tap on the partner's is a high-five ([Villager taps](#villager-taps)).
- **Say button** (`island/SayButton.svelte`): a round cream button at the scene's bottom right, NH's chat glyph; it
  opens the phrase picker (a phrase shows over my villager on every phone). Hidden under a sheet, the panel, the
  harvest and a tree's popup. The guest, the tent and the homes have it too ([The tent](#the-tent) "Phrases"). Nothing
  else lives at the bottom right.
- Controls are real buttons with `aria-label`, ≥ 44px (villagers 64px); focus order = visual order.

### Wallet

ごほうび, the island panel (`wallet/Wallet.svelte`, `wallet/Shop.svelte`), top to bottom:

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

### Panel

The menu's ベル row opens the island panel at once, full height (`panel/IslandPanel.svelte`): title 「ごほうび」, no tabs,
[the wallet](#wallet). Every opening starts at its top; its own chunk. A ledger day pushes a level with ‹ (the wallet
stays mounted under it); ✕, the backdrop and Esc close it. The goals are 健康's ([Kenkou](#kenkou)), the 図鑑 設定's.

### Settings

**設定** (`panel/SettingsSheet.svelte`): the menu's 設定 pill → its own full-height sheet: **姿** (the look's portrait,
the よびな and what's worn → [the 姿 level](#sugata)), **プロフィール** ([Profile](#profile)), **サウンド**
([Sound settings](#sound-settings)), **言語** (日本語 / English), **季節** ([Seasonal look](#seasonal-look); its 天気 is
[Weather](#weather)'s switch too) and **図鑑** (設定 closes, [the 図鑑](#zukan) opens). The guest's is the same, with a
line saying it's visiting. Its own chunk.

<a id="sugata"></a>**すがた** (`look/LookPage.svelte`, `look/closet.ts`, `store/look.ts`, `e2e/look.spec.ts`; the look's
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

<a id="profile"></a>**プロフィール** (`panel/ProfileSection.svelte`, `model/profile.ts`, `e2e/profile.spec.ts`): one card.
Whose (the two members, this phone's first; the guest only its own) with the age; sex, birthday (a native date field)
and the BMI standard (Asian, the default · WHO; not the guest's). Prefs on the record ([backend](backend.md#events)
`sex`, `birth`, `bmiStd`): either member sets either's; private to the two members (the guest's to the guest),
enforced by the record. What it feeds:
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

The ベル ledger (`model/bells.ts` bellsLedger, `components/kiroku/*`), read-only, in [ごほうび](#wallet) under the rewards
(「貯めたベル」):

- **ベル:** by week (earnings only), one line per day: each person's four fruits (bright = met), a star on a
  ふたりでぜんぶ day, the day's ベル (tap → the day); on a がんばり day a second line with each person's がんばり ベル.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  がんばり chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

健康 (`model/health.ts`, `components/health/*`, `e2e/health.spec.ts`): the health popup's first page (full height).
Health data over time, one person at a time, computed on read, each card with its goal. Its code and strings
(`i18n/kenkou.*.json`) load with the first opening.

- **The title bar** (both pages, `e2e/kenkou-header.spec.ts`): whose · the page switch 健康 | ごはん · ✕, no tab bar; on
  ごはん's levels ‹, the level's title, ✕.
- **Whose:** a native `<select>` by the avatar, one pick for both pages, kept for the session. 健康 has no guest data:
  with the guest picked it shows the last member picked, and says so.
- **The selectors:** 活動 · 体 (two pills with NH icons) and the period dropdown (1週 · 1か月 · 3か月 · 1年; ごはん's
  グラフ's too); 1週 and 活動 on every opening; the guest has 活動 only. Then a sticky row: ‹ the visible range and its
  bucket › and 今日 (inactive on today).
- **Cards** (`model/health.ts` GROUPS and CARDS): 活動 🍎 歩数, 🍐 ムーブ, 🍑 エクササイズ, 🍒 スタンド; 体 体重, 体脂肪率,
  BMI, 除脂肪体重, each with a catalogue icon (`art.ts` BODY_ART).
- **One card for every chart** (`ChartCard`: icon, name, the goal chip: [Goals in place](#goals-in-place); with nothing
  recorded yet a note and no chart). **Activity** (`BarCard`): the daily average with the change against the previous
  period; goal days n/N (%), the best and the days without a record; the chart; a one-line key.
- **Chart** (`BarChart` in `ChartFrame`, SVG): a bar per day, week or month by the period, the bucket's daily average in
  the person's colour, solid when the goal was met its way ([Goal directions](#goal-directions)), paler the fewer of its
  days did; today dashed; a bucket with no row a hatched stub; the goal a dashed line. A tap shows one value; a drag
  pages (right = older).
- **体重 · 体脂肪率 · BMI · 除脂肪体重** (`BodyCard`, `DotChart`): each its own optional goal, the average (n records;
  BMI with its category by the person's standard: under 18.5 underweight, Asian 23 / 25, or WHO 25 / 30;
  [Profile](#profile)), the period's change ([Weight](#weight)) and per week, the dot chart on a fitted axis with the
  goal dashed yuzu (or its words at the edge with ↑/↓ when far off), and the goal month at that pace (only when the
  period ends today). No good / bad colours; never earns.
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit`, `health/goals.ts` GOAL_SPECS over the registry
  `contract/goals.ts` GOALS): every chart's card has its goal as a chip, or none. A tap opens a tray under the header:
  −/＋ by the goal's step, the range in words, clear (where clearable), キャンセル and 決定; one open at a time. Either
  person sets either's. The same control sets ごはん's goals.
  - The ranges, steps and the values until set: the registry. 活動's goals hold from today on (a day keeps its own); the
    ベル keep Exercise and Stand at the fixed 60 / 120 ([Goals](#goals)), and the editor says so. 体's are clearable and
    never earn.
  - The guest's phone: chips read-only, no 体 card (the record never sends it one).
- <a id="goal-directions"></a>**Goal directions** (`contract/goals.ts` GOALS `dir`; why:
  [decisions](decisions.md#goal-directions)): at least 歩数, ムーブ, エクササイズ, スタンド, 除脂肪体重, たんぱく質, 食物繊維;
  at most 体脂肪率, 脂質, 塩分, アルコール; near a value (前後): 体重 (±1.5 %), BMI (±4 %), カロリー (±10 %), 炭水化物
  (±15 %). The chip, the line's words, the shading, the goal days, ごはん's tiles and the goal month all follow it.
- **Rules:** a day's value is Health's latest; every day with a row counts; a day without a record is a day with no row
  (from the first activity record); today is drawn but not counted; the previous period is the same length just before.
- **A day without the Watch** ([decisions](decisions.md#no-watch-days)): the Shortcut sends `0` when Health has no
  samples, so a day whose Move, Exercise and Stand are all 0 or absent is read as no data for them (`model/health.ts`
  `noWatch`, `activityOn`: the one reader of a day's activity); steps stay. Read-time only. The ベル need no such rule (a
  0 and a missing value earn alike). `?demo&health=zero` sends the demo's no-watch days as 0/0/0; `?demo&weeks=60` makes
  a longer history.

### Gohan

ごはん, the meal log (`model/food.ts`, `components/food/*`, `lib/food/`, `e2e/food.spec.ts`; the data:
[food-data.md](food-data.md)): the health popup's second tab (whose and the title bar: [Kenkou](#kenkou)). Each time
it shows it starts on 記録, today, no level open. What each of us ate, typed in by hand; it never earns ベル. Everyone
sees everyone's meals, the guest too; only the owner changes an entry. The day renders from its entries' snapshots and
never waits on the food data (the catalogue loads with the first search or amount, or at idle, in a worker); kept
mounted between openings, so a reopening shows the day at once.

- **Tabs:** 記録 · グラフ. 記録 has a sticky row ‹ the day › and 今日; › goes past today only to tomorrow, when a いつもの
  fills it (read-only). Recipes and custom foods have no tab: a meal's search is the way in.
- **Summary card:** the day's kcal with its goal chip ([goals in place](#goals-in-place)) and a bar (coral only past
  20 % over); P · F · C · 塩分 (past a ceiling coral) and a fold with every nutrient; the **PFC balance** (Atwater 4/9/4,
  alcohol its own share) against 食事摂取基準 2025's 目標量 (never coral). A past day with nothing logged says so, not 0.
- **Goals** (the registry `contract/goals.ts`; their ways: [Goal directions](#goal-directions)): kcal, protein, fat,
  carbs, salt, fibre and alcohol, set on my own cards only. **Defaults:** protein, kcal and salt from the profile
  ([Profile](#profile)); fibre by sex and age (men 20 g, 22 from 30 to 64; women 18); alcohol 20 g (厚労省's 節度ある
  適度な飲酒: [decisions](decisions.md#fibre-and-alcohol)); none for fat and carbs. A default never overrides a set goal.
  **Warn, allow** ([decisions](decisions.md#low-kcal-goals-warn-allow)): a kcal goal under my resting energy (else under
  1,500 / 1,200) gets a gentle note; never blocking.
- **Meals:** breakfast · lunch · dinner · おやつ, a card each with its kcal and its protein chip (leaf once at the
  per-meal aim), a row per entry: its picture (or the category tile), the food, its amount, kcal. On my day ＋ → the
  search (the keyboard up in the same tap), an entry → its amount; anyone else's day is read-only. An entry keeps its
  food as logged (when the food now differs, mine offers its latest values; nothing updates by itself); an entry logged
  from a meal's search comes back to it, for several foods a trip; an empty meal on my day offers yesterday's and
  another person's, copied as mine with 取り消す; **quick** (⚡, or a kcal typed in the search) logs one entry by the
  serving, never a saved food.
- **Search:** a 16px field (recipe, custom food and quick under it until something is typed). Empty: my recent foods;
  typed, the best matches (`food/search.ts`: its ranking; `food/load.test.ts`'s golden queries pin the first result),
  a food in its states (生 · ゆで · 焼き) one row, its generated picture ([food-data.md](food-data.md) "Pictures") or its
  **category tile**. ー counts (カレー is not かれい). Offline: a message, a retry, the recent list.
- **Amount** (`FoodPortion`): one screen on an iPhone 15 for the common case: the picture (marked as an AI image), the
  name, the kcal at title size, P · F · C · 塩分 and the nutrients a 100 g; **状態** (a chip per state, the portion
  carried through its yield); **量** (portions as chips, −/＋, grams or ml); the foot: the meal and add, or 保存 / 削除
  for my entry, held over the keyboard.
- **いつもの (a repeat):** a meal eaten the same way on set weekdays: its items fill each day it covers, marked 🔁,
  counting like any entry; its days a chip in the meal's header (毎日 · 平日 · 週末 · 月水金…); changes apply from
  tomorrow, stopping keeps past days. Editing one of its items changes that day only.
- **グラフ:** what was eaten only (calories burned are 健康's ムーブ). 健康's range row, then the period's average day
  (over the finished days with a meal, against the goal, with the nutrients and PFC balance), then kcal eaten as 健康's
  activity cards (a day with nothing logged has no record, never 0) and the same card for each nutrient.
- **My recipes and my foods:** everyone's, listed in a meal's search after the recent ones. A recipe logs as a food (a
  serving, the whole, 100 g; servings 1–20; its box its ingredients' pictures and a small pot); a custom food is one
  serving typed in (kcal needed; a weight too light for its values is refused). Anyone else's is read-only, copied to
  edit; deletes are asked twice.
- **Sources** at the foot: the AI-image note, then each dataset's label, attribution and license. Food names whose
  kanji are outside the trimmed font subset fall back to the system font.

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar
  ([Navigation](#navigation)), one CTA in a sticky footer above the keyboard; the kit's sizes and type: [Unified
  kit](#unified-kit).
- **Text colours by surface:** themed surfaces take `--text`, `--text-soft`, `--leaf-text`, `--coral-text` (light on
  navy at night); an always-cream object (a bubble, a cream button, a stamp, a ticket) carries `.obj-cream`
  (theme.css), which puts the day colours back inside it. A choice set aside after a reveal is sunk (`--ctl-off`).
  Content text ≥ 13px (`--fs-s`); ききみみ's `readability.test.ts` holds both.
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
  row), one with a picture (a buy, a saved look) a sheet with キャンセル + the verb (`.btn.danger`). A delete that can be
  undone acts at once with 取り消す on its banner.
- The island's full-height sheets (健康, the panel, 旅行, 結婚式, トレイル, ききみみ, 設定) open and close at once: no
  zoom, slide or fade; a form sheet rises over 240 ms; a level slides in over 240 ms.

### Sizes

One scope, `:is(dialog, .sheet-copy)` in theme.css (every sheet, panel, level, pairing, the board, the trays, the
shop's menu): the small edge and lip, cards `--r-row`, the title bar 48 (title 18) and its 32px discs, controls drawn
32–36px in a 44px hit (a `ChipRow` 44 high so its scroll never clips a hit: e2e/sheet-hits.spec), rows 44–52. The world
(the HUD, the leaf menu, the rooms, the dialogue) keeps the game's sizes: the 2px edge and the 4px lip.

### Unified kit

Every sheet uses one kit: the same paper, cards, leaf and yuzu, denser where the info is dense. Game feel from edges,
small lips, stickers, stitches and the yuzu "selected"; dense text smaller, in the system font. Nothing feature-local:
shared tokens only (tokens.css, re-tinted by time of day; trip `dayColors` stay trip data).

- **Type:** titles, labels, numbers in `--font-ui` 700 / `--font-num` 600 (tabular); body and notes `--font-body` (the
  system font). Sheet title 18 · card title 15 · row text 15 (lists) / 14 (timeline) · note, meta 13 · tag, tab label,
  axis 11. Paragraphs `text-wrap: pretty`. Sheets are normal Japanese with kanji; the island world keeps spaced kana
  ([Copy](#copy)).
- **Shape:** cards with a small lip, no hairline; rows split by an inset stitch; selected = yuzu (never green); the
  action = the leaf `.btn`. One control row per view, under the header. Grain only on the letter.
- **Components** (ui/): `Sheet variant="full"` · `NavBar` · `NavButton` · `TabBar` · `Chip` in `ChipRow` ·
  `Segmented` · `Tick` · `StatStrip` · `PhotoBand` · `ProgressBar` · `ActionSheet`; theme.css's small classes. A sample
  of all of it: `/dev/kit` (`vite dev`).
- **Icons:** `ui/Icon` only: our own drawing on a 24 grid, a 2px round stroke in `currentColor`; an unknown name draws
  a pin. No emoji in chrome.
- **NH art, only:** the pink-roses art in the wedding ring; the villager heads on the leaf-menu pills; packing
  categories as NH items (`packView.ts`). No characters in the sheets.
- Every tappable has its `data-sfx` (the shown tab / chip `none`); fields 16px+; no grabber.

## Economy

A stamp card with small numbers. Rule `scoring/bells.ts`, economy on read `model/bells.ts`, values `config/rules.ts`
(`RULES`, `STRETCH`, `SHOP`); pinned by their tests, `model/properties.test.ts` and the golden fixtures. Earnings are
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

### The first week

The economy starts with the data: its first week is the first one with an activity row stamped by that week's lock
(`firstWeek`). A baseline of old days synced after their weeks locked never earns.

### Harvest and lock

- **Sunday 19:30 JST:** the harvest recap opens (nothing lands then: the week's ベル came in day by day).
- **The following Wednesday 04:00 JST:** the week locks. Until then its earnings move with late syncs; after, they are
  computed as of the lock. The lock is internal: nothing shows it.

### Wallet and buys

Each person's wallet runs from the economy's first day: a day's ベル count in it from that day, their own and half of
ふたりでぜんぶ (`walletAt`). Buys and voids replay in server order (by `at`).

- **Coverage:** a buy counts only if its buyer's wallet covers it (what it got up to the buy's `day`, else its `at`'s
  Tokyo day, minus their earlier accepted buys); an uncovered buy is ignored, so no balance goes negative. The history
  shows each buy's day.
- **Voids:** either of us, any buy, once; the ベル return to the buyer's wallet. Buys and voids never lock.



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
comes only on its days (a visitor, the tape deck, the cake, the weather, the fireworks, an event's decorations) loads
the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load carries none of it. Only `transform` and `opacity` animate in the DOM; everything pauses while hidden (`data-paused`), a sheet pauses particles, critters and idle life
(`data-covered`), and under a full-height sheet every animation holds (`data-sheet`) and the 3D island draws nothing
(`e2e/sheet-idle.spec.ts`). Nothing on the island pays ベル.

### World

The island is in 3D (`world3d/Island3D.svelte`, `world3d/engine.ts`: its header has the camera, the ground, the
things, the lights) with the DOM island over the canvas (`island/IslandScene.svelte`); every coordinate is the
layout's once applied (`island/world.ts`, `island/site.svelte.ts`; [island-layout.md](island-layout.md)). e2e:
`world.spec.ts`, `world3d.spec.ts`, `world-perf.spec.ts`; `window.__world3d` serves them.

- **Units:** world units (an 80u villager); x across, z into the island (bigger = further back; the front shoreline is
  SHORE_Z).
- **No WebGL** (never on the target iPhones): a line in the middle of the scene instead of the island (`[data-no3d]`);
  the HUD, the panel and the health popup work as ever.
- **In 3D** ([decisions](decisions.md) "The island in 3D"): the canvas sits under the stage's nodes and the projector
  draws through its camera; the World's step runs in the engine's frame ([Frame rate](#frame-rate)), or on the game's
  clock when no frame has (camera.svelte.ts `simTick`). The villagers and the day's visitor are NH's models (a villager
  with none is its render's card, here and in the rooms).
  - **The camera** (`world3d/islandCam.ts`): the default zoom (1) is the widest it rests at, x centred, and one finger
    only scrolls along the island (free, native-feeling: no snap, no automatic move). Zoomed in, one finger pans
    sideways too, within the land plus a little sea. A pinch zooms about its middle, in up to 3.2; past the default it
    gives with rubber-band resistance and springs back. A gesture is one kind from start to end. A touch on a fast
    fling only stops it (no tap).
  - **What comes and goes** is drawn from the DOM island's own nodes: a node with an `m3` art key stands as NH's model,
    one with `v3` is a character's; their DOM art goes invisible and stays the tap box, its image never downloaded
    unless there's no model (`characters/artGate.ts`). Flourishes are a few of NH's fx models in world space
    (`effects.ts`); a DOM jiggle on canvas-drawn art moves the model too (`island/echo3d.ts`).
  - The board's focus: [board.md](board.md). The e2e's logic mode (`E2E_RENDER=none`) runs the frames and draws nothing.
- **The projector** (`camera.svelte.ts` `World`): every world thing is a DOM node at its feet (`{@attach world.at(…)}`)
  placed through the 3D camera. **One depth order** for the DOM: nearer in front, ties by x. World-anchored overlays (a
  tree's popup, a bite's 「！」) stand over everything at their true size. Only nodes near the camera are shown.
- **The ground and the water** are the layout's, built on the phone: [island-layout.md](island-layout.md).
  **The sea's wash** (`layout/swash.ts`): NH's waves on every sea shore every few seconds, the foam running up and the
  wet sand drying after, out of step along a beach; the shore one eased colour ramp by depth, rivers fading into the sea.
- **Layout:** the default island (`layout/default.json`; what stands where: [island-layout.md](island-layout.md)):
  the homes A (ウェイ, left) and B (うめ, right) on every phone (never mirrored), the goal trees on their outer sides.
  The wild flowers and weed spots are scattered, seeded (`npm run layout` → `island/scatter.json`; `scenery.test`).
  **Wild flowers** (`Flowers.svelte`): clumps of one kind each, the season's kinds in turn (`scene.ts` WILD).
  **Decor** (the fixed pieces: `island/fixedDecor.ts`, `e2e/fixed-decor.spec.ts`): NH's outdoor furniture in spots of
  their own (the benches, the hammock, the pump, the shishi-odoshi, the pull-up bar, the campfire with two stools, and
  seasonal pieces from the date), the same on every phone, each a walk obstacle. A tap answers in place (the pump
  waters the flowers near it, the shishi-odoshi tips, the rest knock); a seat is sat on. Lamps and the campfire light
  from dusk. **The decor's life** (`island/ambient.ts`): 19–22 a villager sits at the campfire; on an exercise-goal day
  a villager does pull-ups now and then; when both met every goal, at dusk they sit side by side on the front bench.
  **Sitting on a tap** (`island/sitting.ts`, `e2e/sit-outdoors.spec.ts`): a tap on a seat walks my villager to its
  nearest free seat and on; taken, the other seat, else a `boop`.
- **Winter and night looks:** NH's snowy models and the models' own light, lit at dusk and night (`world3d/lights.ts`).
- **Sizes** (`scene.ts`): NH's proportions against an 80u villager (≈ 45 × 76px at the front on a 393px screen). Every
  tap target is at least 44px ([Scene interactions](#scene-interactions)).
- **Fixed over the island:** the sky (to the horizon), the HUD, the weather, the fireworks and the shooting stars. What
  the DOM still draws over the canvas takes the time of day's multiply on what it draws; a light takes none.
- **Cost:** nothing runs when still: a camera move, a walk or a change places what moved
  ([ops/perf.md](ops/perf.md)).

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
touch is back at the full rate at once.

**One renderer lifecycle:** every WebGL surface makes and lets go of its renderer the same way (`world3d/stage.ts`: its
header), at a lower pixel ratio while a gesture moves the camera; the rooms keep their models page-wide
(`world3d/modelCache.ts`). **Shadows** redraw only when a caster changes or the shadow box moves on
(`world3d/shadowBox.ts`); a room's map only when a piece changes.

### Buildings

`island/buildings.ts`, `island/doorOut.ts`, `e2e/tapwalk.spec.ts`. The campsite, the homes, the museum
([The museum](#the-museum)) and the shop ([The shop](#the-shop)): a tap on one walks my villager up to its door and goes
in. ‹ しまへ comes out of the door, NH's way: my villager stands just in front of it, facing out, on every phone at once
(`layout/nav.ts` exitOf). Inside, my villager is nowhere on the others' islands.

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

`island/weather.ts` (pure), `island/Weather.svelte`, `world3d/precip.ts`, relay `src/weather.ts`;
`e2e/weather.spec.ts`, `e2e/realweather.spec.ts`. The island has **Tokyo's real weather by the hour**, or the game's
own seeded days; every phone shows the same sky at the same hour. NH's skies: **fine**, **cloudy**, **rain**, **a
downpour**, **snow**, with **fog** as an hour's extra.

- **ほんもの (the default):** the relay keeps Open-Meteo's forecast for central Tokyo as a timeline, one sky an hour
  ([backend](backend.md#the-real-weather)); each phone caches it. An hour is locked once it begins, so the sky changes
  at most once an hour. Without a fresh enough timeline (and in ゲーム, and under a `?date=` preview): the seeded day.
- **On the phone, as NH:** Dec 11 – Feb 24 real rain falls as **snow**. Event nights stay fine: the August Sunday
  fireworks (19:00–24:00), New Year's (23:00–01:00), a meteor shower's night (20:00–04:00) and the wedding night (from
  19:00). The seeded treats stay on real fine hours: the 07:00 **fog** (October–March, 1 in 8) and the **aurora**
  (winter nights, 1 in 10). Real fog shows at any hour. The **rainbow** is the first fine hour 07:00–17:00 right after
  rain, once a day, double 1 day in 8.
- **ゲーム (the seeded days):** about one day in six is wet (all day, a wet morning, or heavy rain clearing at 16:00 with
  a rainbow); in December–February a wet day snows. Fireworks days and meteor shower nights are always fine.
- **The switch:** 設定 → 季節's **天気** ([Seasonal look](#seasonal-look)): **自動** (Tokyo's) or **ゲーム**, one setting
  for the whole island (the last anyone set, the guest too), so phones never disagree on the rain-only critters; under
  it what the island has now and Open-Meteo's credit. Its 晴れ / 雨 / 雪 force the look (not the critters); `?weather=`
  forces both.
- **Look:** a grey sky and a darker tint on a wet day, half that when cloudy; fog, the rainbow and the aurora NH's way.
  A change of sky eases over a minute; the page opens to its sky at once. Rain and snow fall in the 3D world; indoors
  nothing falls.
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

`island/treeShake.ts` (its header: the odds, the caps, the drop spots), `island/TreeShakes.svelte`,
`e2e/shake.spec.ts`. Every tree shakes: the goal trees and every oak, cedar and palm (bamboo doesn't).

- **Tap or shake:** a goal tree's tap opens or closes the popup; any other tree's rustles it. The third tap within
  1.2 s (and each quick tap after) is a shake: the tree shakes where it stands, my villager turning to it (no walk).
- **What falls (NH's):** a hardwood or a cedar now and then a wasp nest, a dangling bug or a branch (picked up into the
  pocket); a palm its two coconuts the first shake of the day, after that only a nest. Any tree's shake knocks out a
  piece of wood 1 in 3 times, three a tree a day at most. No fruit from a goal tree. **No piles:** while anything a tree
  dropped lies under it, a shake only rustles it.
- **A tree's present** (`island/treeGifts.ts`, `e2e/tree-gifts.spec.ts`): each day two oaks or cedars hold a piece of
  furniture, dropped wrapped by the first shake and opened like a balloon's present; the 図鑑 credits whoever opened it.
- **Shared** ([Shared world](#shared-world)): a shake's outcome goes to the others; their phone plays it, their wasps
  charge their villager. What lies is the shared day's (first pick-up wins). `?shake=…` forces the next drop.
- **The nest:** three wasps charge the villager who shook it; a tap in time nets one. Too late, they sting: NH's swollen
  eye for a minute. The chase has its own music ([Event music](#event-music)).
- **A dangling bug:** a bagworm, or at night sometimes a spider, sways on its thread for a while; a tap nets it.

### Scene interactions

`island/SceneTaps.svelte`, `island/sceneTaps.ts`, `e2e/scenery.spec.ts`. Every part of the island answers a tap softly
and counts for nothing; ≤ 4 flourishes at once; nothing while covered or hidden. What nothing else took is a walk
([Walking](#walking)); a seat is sat on ([World](#world), "Sitting on a tap").

A bush jiggles and sheds leaves (1 in 10 a bug flies out); a tree's leaves rustle ([Shaking a tree](#shaking-a-tree));
a flower is watered ([Island care](#island-care)); any water casts the line there ([Critters](#critters) "Fishing");
sand leaves footprints; grass puffs dust (snow in winter); a cloud squishes; the sun glints; the moon bobs; the night sky
twinkles (and grants a wish while a shooting star crosses: [Shooting stars](#shooting-stars)); the campfire is poked.

**Tap targets** (`island/hitbox.ts`, `e2e/hits.spec.ts`): everything tappable answers on its whole visible body, at
least 44 × 44px about its middle; in front wins, and what's exactly under the finger wins over a character's loose
reach. A building is its model's silhouette as the camera sees it, nothing past it (`e2e/building-taps.spec.ts`).
**Nothing lies on a building's ground** (`layout/clear.ts`): what's dropped or spawned takes a spot off its footprint,
door step and the strip its model hides. On water only what's drawn takes a tap, so a tap on the sea beside a dig spot
casts. `?hit` draws them all ([Dev params](#dev-params)). A touch goes where the finger was, never moved by WebKit's
touch adjustment onto a door (`ui-state/exactTaps.ts`, `e2e/exact-taps.spec.ts`); mouse, keyboard and VoiceOver
clicks are untouched.

### Balloon

NH's balloon present (`island/balloonFlight.ts`, `island/Balloon.svelte`, `world3d/balloon3d.ts`): by day every
45–90 s of on-screen time (the first after 20–40 s) it flies over the island in 3D, sea to sea, high over the trees,
its shadow under it, in a lane a little under the HUD (none when the sky is too short or with no 3D island). A tap
pops it: the present falls to open ground in the lower view, clear of every control (`island/presentLanding.ts`), and
lies there for every phone until tapped (not kept across a reload); a tap opens it where it lies. What's inside
follows NH's drop rates without Bells or materials
(`island/catalog.ts`: furniture, clothing, a season's DIY recipe; NH's shop stock, each recipe in its NH window),
counted in the ずかん (カタログ, レシピ). On Bunny Day a sky egg instead. The catalogue: `npm run catalog:build`.

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/PartnerNews.svelte`, `e2e/shared-world.spec.ts`; the mechanism:
[backend](backend.md#shared-world). Every phone shows the same island: what's caught or picked up is gone on all, what
a shake drops lies on all, each villager stands where its person sent it.

- **The villagers move as one:** each of us moves our own villager; the other phones play the very same walk,
  catching up when a message is late (`island/villagerSync.ts`); asleep and awake alike ([Sleep](#sleep)).
- **Fishing, seen by everyone** (`e2e/fish-sync.spec.ts`): each step of a line (the cast, the nibbles, the bite, the
  reel) plays on the others' phones as it happens. The shadow cast at is theirs while the line is out (a tap on it here
  boops); an angler whose phone goes, or who goes through a door, is no longer fishing.
- **The partner's doings, played here:** within 12 s of it, their villager turns to it and it plays at the target; a
  catch or a find is its plate in the bottom stack. Heard on opening (older), it only changes the island.
- **First wins:** of two people tapping the same thing, the relay's first claim is it; the other sees it taken.
- **Late and alone:** a phone opening later hears the day from the relay; with the relay unreachable each phone keeps
  its own and they catch up when it's back.

### Sleep

`ui-state/presence.ts`, `ui-state/cast.ts`, `e2e/presence-sleep.spec.ts` ([decisions](decisions.md#sleep-by-presence)).
Everyone's villager (A's, B's, the guest's) is always on the island: **awake while its person's app is open, asleep
where it stands while it's closed**, at any hour (no night's sleep).

- **Online:** the relay's presence, and for a grace (`GRACE_MS`, 45 s) after a person's last socket closed, on the
  relay's clock, the same instant on every phone ([backend](backend.md#shared-world) "Sleep").
- **Asleep:** the zzz, in none of the island's life; those awake carry on without it.
- **A tap wakes it** (a high-five: [Villager taps](#villager-taps)) for a minute (`WAKE_MS`), the same minute on every
  phone; it's in the island's life then, and it sleeps where it ends up.
- **Back online:** awake where it is (no walk home: [Walking](#walking)).

### The guest

`contract/guest.ts`, `ui-state/cast.ts`, `e2e/guest.spec.ts` ([backend](backend.md#the-guest),
[decisions](decisions.md#the-guest)). A third person, ゲスト: a visitor to our island, NH's way, with its own key
(pairing: [runbook "Pair a phone"](ops/runbook.md#10-pair-a-phone)). `?demo&as=G` is its phone.

- **What it sees:** our island, the trees and their popups, the menu's ベル row (both wallets) and ごほうび view-only
  (`guest.jarNote` in place of the rewards), the 図鑑, 健康's 活動 (either member's, goals read-only) and everyone's meals.
  Never a 体 figure: the record leaves them out of its snapshot. 設定 as ours, with a line saying it's visiting.
  ききみみ: the members' games as their summaries.
- **What it does:** everything on the island a member does (walks, catches, digs, shakes, phrases, high-fives, every
  home's room and its own house's look, the editor, watering, wishes, the weather, the shop, the museum, K.K., the
  board, ききみみ), its finds credited in the shared 図鑑. It earns and spends no ベル, sets none of our goals and writes
  neither the wedding board nor a trip's notes (the record refuses those).
- **Its villager:** always there, as the members' are: where its last walk left it, asleep while its app is closed
  ([Sleep](#sleep)); awake, in the island's life as a member's villager, never an outing of its own, and its shakes
  drop nothing. On our phones it's drawn like the partner's (a lilac name tag); a tap is a high-five.
- **Who counts as "the partner"**: the guest only where the island's life is everyone's (`ui-state/cast.ts`
  islandActors: its header has each case); the edge face and the goal walks are the members' own.

### The island's layout

`layout/`, `store/layout.svelte.ts`: the outdoors is data anyone of us can change: NH's tiles on a grid, each grass,
sand, a path, a river, a pond or the sea, on cliff tiers, with every tree, bush, rock, lamp, piece of furniture, the
bridge, the stairs and the homes an object on its tiles. The contract is [island-layout.md](island-layout.md). Each
home's look is its owner's, its room anyone's; anyone changes the outdoors, in /editor only ([Decorating](#decorating)).

### Decorating

`layoutEdit/IslandEdit.svelte` (in /editor), `island/Decor.svelte`, `island/decor.ts`, `e2e/decor.spec.ts`. Any of us
(the guest too) puts NH's outdoor furniture on the island, moves, turns and removes it, in /editor only (the desktop
editor or its phone view; the tray, the ghost and the reset: [island-layout.md "Phone editing"](island-layout.md#phone-editing));
every phone shows the change at once, kept for good: the decorations are the layout's objects. At most 1,500 objects
stand (`contract/layout.ts` LAYOUT_MAX, the record's cap).

- **The items:** NH's models under their official names, in the tray's tabs (`layout/catalog.ts` `group`; the packs:
  [world3d-assets.md](world3d-assets.md)).
- **The gym** (the tray's ジム tab): NH's fitness furniture. **Used, NH's way** (the six NH lets one use): a tap walks my
  villager up to it and on, and it loops its pose while it stays (press, pedal, run, punch, bounce, pull-up); a tap on
  the ground gets it off. One villager a piece, the earlier keeping it; nothing new on the relay (`e2e/gym.spec.ts`).
  **The bench press:** the bench's own bar is swapped for the gym's barbell, which rides the hands through the press
  (`world3d/benchBar.ts`; [world3d-assets.md](world3d-assets.md) "Parts split out"). The yoga mats are lain on, the speed
  bag punched, the massage chair sat on; the others are to look at (a tap jiggles them).
- **キャンプ:** NH's camp goods: the fires and lanterns lit at night, the cot and the sleeping bag lain on, the chairs
  and bench sat on. **食べ物** (to look at): NH's dishes and drinks.
- **On the island** a placed item is a world thing: NH's model, an obstacle the walk goes round; a tap jiggles it in
  place. The partner's change puffs where it lands.

### The bulletin board

NH's island board on the front beach ([board.md](board.md), `e2e/board.spec.ts`): a tap walks my villager up beside
it, the camera dollies to its face and back. Pinned notes, four a page, newest first, plain text (at most 4 lines and
100 characters); a 「！」 bobs over it when someone else wrote since I last looked. Everyone, the guest too, writes.

### The tent

`tent/TentRoom.svelte`, `tent/TentEdit.svelte`, `tent/engine.ts`, `tent/grid.ts`, `store/tent.svelte.ts`,
`contract/tent.ts`, `e2e/tent*.spec.ts`. A tap on the campsite's tent walks my villager up to its door (a tap elsewhere
on the way cancels), then goes inside: its own screen, truly 3D, behind NH's door (a black iris closes, stays black
while the room's chunk and first frame come, opens out of the room's door; the way out the same, my villager stepping
out in front, facing out, on every phone). The homes' rooms are the same system.

- **One place at a time:** each villager is on the island or in a room (the tent, a home, the museum, the shop), on
  every phone (`store/where.svelte.ts`). A phone that goes quiet inside has its villager leave 3 minutes after the relay
  saw it go.
- **The room:** NH's main room, four walls, the front one with the door and NH's doormat (its two tiles stay clear).
  **Room size** (the 広さ tab, `e2e/tent-size.spec.ts`): 4 × 4, 6 × 6 and 8 × 8 (the default; `contract/tent.ts`
  ROOM_SIZES), against the same front wall. Larger always; smaller only with nothing left outside, else those pieces
  glow red and the bar says how many to move or put away (decisions: *A room's size never moves or drops a piece*).
- **The camera** starts as NH's room camera (47° down, from the front); a drag turns and tilts it, a pinch zooms, 🏠
  eases it back; the walls in the way are cut away (Happy Home Paradise's look). Or at my villager's eyes:
  [First person](#first-person). **The light:** warm, one small shadow map; at night dimmer, the lamps lit.
- **The villagers** are NH's 3D models where they have one, else billboards of their official renders. A tap on the
  floor walks mine there (round the furniture, rugs walkable); a tap on a villager hops it; a tap on a piece acts in
  place; the doormat or ‹ しまへ goes back out. The partner's villager is theirs to move while they're in the room; away,
  it rests where it last stood.
- **Stereos** (`tent/stereo.ts`, `kk-sync.spec.ts`): NH's music players in any room play K.K.'s airchecks (a tap opens
  the song list) on the room's music stage ([Shared music](#shared-music)), heard by everyone in the room; anyone's tap
  on the one playing stops it for all.
- **模様替え** (the foot's green button; the tray's tabs: `TentEdit.svelte`'s header): the grid on the floor, a tray
  of the room's pieces and 完了 with the count. A piece goes down as a ghost on the free spot nearest my villager, its
  footprint green or red with the reason; it turns, places, is put away (取り消す for 5 s) or put back. At most 60 pieces a room, on whole tiles, off the door's two, not
  over a piece or a villager; a rug lies under furniture. **Holding** (NH's: one thing held at a time): while I hold
  one, the finger is for it (a press or a near miss drags it, a floor tap puts it there if it may stand, a 400 ms press
  swaps, a tap off the room puts it down). **Table tops** (NH's surfaces): small things go one a tile on a surface's
  top, and moving the table carries them; not put away with things on it. The island's tables follow the same rules
  (island-layout.md "Table tops"). **On the walls:** a piece hangs on a wall's grid.
- **Whose room:** anyone arranges any room, the guest too: pieces, the wallpaper, the floor, the rugs, the ceiling, the
  size and the lights; only a home's look (いえを かえる) stays its owner's. The tray is the **editor's**: the starter
  set, the island's finds and catches (everyone's) and their own buys. A piece is a catalogue entry, not a count:
  placing one spends nothing and putting one away gives nothing back, so a piece someone else put down is just taken
  out of the room (its buyer still has it). Two editing at once merge as every decor op (decisions: *Decor is a
  last-writer-wins map*).
- **取り消す, 全部片付ける** (the bar, holding nothing; `tent/steps.ts`, `e2e/room-batch.spec.ts`): 取り消す takes back my
  last change in this room (⌘Z too; this phone's, while the page is open). 全部片付ける, after a confirmation, puts every
  piece away; the wallpaper, floor and size stay. Its undo puts each back exactly (tile, facing, layer, light, order) as
  new pieces (a removal is final in the record). A clear, a call-up and their undo are one batch: one group the record
  keeps all or none (backend "Groups"), pushed to the other phones at once.
- **Saved arrangements** (保存; `contract/roomSave.ts`): three slots a room, in the record, anyone's: save (a name, the
  date), call up (after a confirmation: the room replaced by it, wallpaper, floor and size too, one batch, one 取り消す)
  and delete. A saved piece is put down if anyone could put it there now (it stands in the room, it's in the caller's
  tray, or the room's owner bought it); the rest (and what stands on them) are left out, named, asked before and told
  after.
- **Loading:** the room's code is its own chunk; the models stay loaded page-wide (`world3d/modelCache.ts`), so a room
  comes back with no fetch or decode; at rest it draws only a blink ([Frame rate](#frame-rate)).
- **Sit, lie and switch** (`tent/seats.ts`; the museum's benches too): a Chair is sat on, a Bed lain on: a tap walks my
  villager up to the nearest free side ([Seats and beds](world3d-assets.md#seats-and-beds)); a floor tap gets it up; the
  first to sit keeps the seat. The cold sleep pod's lid shuts over its sleeper and opens before they get up. A light
  switches with a tap, kept with the piece; NH's room light switch (💡) dims the room's own light.
- **Phrases** ([Villager taps](#villager-taps)): the say button in every room, hidden in 模様替え and under a sheet; a
  phrase shows only on a phone whose villager is in that room (`e2e/say-rooms.spec.ts`).
- **The Happy Home Academy** (`tent/hha.ts`): the first visit after the room changed that day, ハニワくん's letter rates
  it from the shared room alone (NH's HHA points; bronze, silver, gold) with one remark. No ベル.
- **Shared and kept:** each change is one op (last writer wins: `contract/tent.ts`, [backend](backend.md#events)).
  While I hold a piece, the others see it move with a yellow footprint, not theirs to pick up; silent for a moment it
  drops back; the drop is the op (`tent/dragLink.ts`).
- **The ceiling** (NH's 39 pieces): a layer of its own over the floor's, hung from the walls' top; a tap goes through it
  to the floor (`grid.ts` isCeiling). **Gyroids** (NH's 36): a tap sets one bobbing a couple of seconds, silent.
- **The models** ([world3d-assets.md](world3d-assets.md)): NH's whole catalogue but character customisation (2,341
  pieces, 306 wallpapers, 209 floors), the rarer ones in packs fetched whole ([Room packs](world3d-assets.md#room-packs)),
  cached by the service worker on first use.

### Critters

`island/Critters.svelte`, `island/critters.ts`, `island/critterPath.ts`, `e2e/critters.spec.ts`. NH species on the
Tokyo clock, frequent, and the same on every phone (ambient life's slots: [backend](backend.md) "Ambient life"):

- **Who comes:** the sea holds a shadow off every stretch of the coast most of the time (`island/coast.ts`), the front
  beach's bubbles on a channel of their own; each fresh water its own shadow ([Pond](#pond)); and up to two roaming
  bugs at once. A fish's odds are its water's and the month's, hour's and sky's alone. **Seasons are a flavour, not a
  gate:** any species in any month, 3× likelier in its NH northern months; hours still hold.
- **Where it is, is the world's** ([Shared world](#shared-world)): its seed picks the swim patch, the trunk, the flower
  or the grass, and every glide, hop, dart and landing at its time (`critterPath.ts`), so every phone has it at the same
  spot doing the same thing. A catch or an escape is shared by the critter's id (first wins).
- **Fishing** (`island/fishing.ts`, my line's state machine; its header: the reach, the nibbles, the window): a tap on
  any water, however far, casts there from where my villager stands, turning to it (no walk to the water; seated it
  stays seated). A shadow near the float, with open water between, closes in, nibbles 1–4 times, then bites (the float
  yanked under, NH's 「！」 over the angler). While the line is out any tap but a door is the reel: on the bite it
  catches (a second's window); earlier it scares the fish; with none it comes in. The line ends by itself only through a
  door, when covered, or at the day's turn. 1 in 14 a boot, tire or can (`e2e/fishing-taps.spec.ts`: every water point
  on screen casts). In 3D nothing pops: shadows and bugs fade in and out, a fish turns to the float, bumps it, lunges,
  darts off (`e2e/critters3d.spec.ts`). The rod and line: [world3d-assets.md](world3d-assets.md) "Fishing".
- **How the bugs move** (`critterPath.ts` bugPath, NH's paces): butterflies and moths flutter in a meander and land on a
  flower of their clump, a bee never lands, a dragonfly darts and hovers, a firefly drifts, a beetle flies in to its
  trunk, hoppers hop, crawlers crawl; none faster than a running villager. The museum's bug wing moves them the same
  way; wings beat in the vertex shader (`world3d/wings.ts`).
- **Fish** (all 34 of NH's sea and pier fish): NH's shadows by size (a fin for the sharks); the coelacanth only in rain
  or snow.
- **Bugs** (all 80 of NH's), each where NH keeps it (flowers, water, trunks, palms, grass, the beach, under a chirping
  mound; at night the tarantula and the scorpion rear up at a first tap and charge off at a second; a flea off my
  villager 1 in 10 taps, Apr–Nov). A tap nets one, judged where the 3D island draws it (`e2e/bug-taps.spec.ts`); a near
  miss startles it, as does my villager running at it (`critters.ts` fleesFrom). Where the island lacks NH's spot
  (`critters.ts` has each): the ant and the fly by the campfire all year, the dung beetle's snowball Dec–Feb only.
- **Diving** (`island/sea.ts`, NH's 40 sea creatures; `e2e/dive.spec.ts`): a spot of bubbles rises off the front beach
  now and then (gone after 30 s); a tap dives, a faster creature's shadow may dart off for a second tap (its odds:
  sea.ts). 1 spot in 25 is a pearl.
- **The catch:** the official icon pops onto a plate with NH's catch line (`island/catchLines.ts`). Every catch's and
  find's plate (anyone's) goes in one stack at the bottom centre (`island/CatchStack.svelte`): the newest at the bottom,
  each fading on its own or at a tap, at most 3. World cues `scene-<kind>` ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`, `e2e/finds.spec.ts`. The day's items derive from the Tokyo date and time plus
a seed, so every phone agrees; what anyone picks up, digs or opens is gone on all ([Shared world](#shared-world): first
wins). The first of each shell, fossil and fragment is a ずかん `find`.

- **Seashells** (NH's eight; the summer shell rare, likelier June–September): one washes up every 60–120 s, the newest
  three lie on the sand, kept apart. One that turns up while the island is open rides the next wave up the beach
  ([World](#world) "The sea's wash"); what lies there as the island opens just lies. `?find=washed` washes a bottle in.
- **Fossils** (all 73 of NH's): **four dig spots a day** as in NH (`beach.ts` `DIGS_A_DAY`), shown only clear of every
  control; a tap digs one up, gone till tomorrow.
- **Mushrooms** (`island/mushrooms.ts`): every November day 1–2 beside the trunks (now and then in October and
  December), NH's weights; 1 in 20 November dig spots hold the rare mushroom. No `find`.
- **Message bottle:** every 8–14 minutes one rocks at the water's edge for 6; a tap reads its note (16 notes).
- **Star fragments:** each wish on a shooting star is one fragment on the beach the next morning (from 05:00, at most
  8), now and then a large one or the season's zodiac fragment.
- **A balloon's present:** where it lands; what's inside is decided at the tap and shown on every phone. A tree's
  present is the same ([Shaking a tree](#shaking-a-tree)).

### Island care

`island/Care.svelte`, `island/care.ts`, `e2e/care.spec.ts` (no ベル, no find):

- **Weeds** sprout every 30–60 minutes on the day's free weed spots, the newest three at a time; a tap pulls one, gone
  on every phone.
- **Watering:** a flower tap is NH's watering can; a flower watered today glitters for the day on every phone. The
  flowers watered yesterday have a 1 in 4 chance of a hybrid on one of them today, the same everywhere.
- **The rock** (on the health lawn): a tap clonks it with the shovel; 1 in 4 a sparkle, 1 in 8 a pill bug or a
  centipede crawls out.
- Weeds, dig spots and the rock are measured clear of the controls on each screen.
- **The fields (はたけ):** NH 2.0's vegetables on a field each, starts from the shop, produce sold for かいがら:
  [farming.md](farming.md).

### Pond

`island/pondFish.ts`, `e2e/pond.spec.ts`. NH's pond (lily pads and a slow ripple), the river and its mouth, and the
spring and the river above the cliff.

- **Fresh water by where you cast** (NH's locations): the pond's 12, the river's 27, the mouth's 3 and the clifftop's 4;
  the river's own also come to the mouth and the clifftop.
- **Visits:** as often as the sea's, one shadow per water, a while if nobody fishes, smaller than the sea's, every point
  of its swim on that water's own tiles.
- **Its bugs:** the pondskater and diving beetle by day in summer, the giant water bug at night. A catch is a ずかん
  `find` of kind `fish`.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/zukan.ts`, `model/finds.ts`, `e2e/zukan.spec.ts`. The ずかん is its own sheet, opened from
設定's last row (設定 closes; on its rows ‹ goes back to 設定, ✕ to the island): one row per kind with how many have been
found, a row → that kind's page. Shared (the first `find` of anyone): 魚 80 (the sea's 34 and fresh water's 46), 虫 80,
海の幸 40, 化石 73 (laid out like NH's museum), かいがら 9, カタログ 1,836 (by NH's categories) and レシピ 126 (by season).
Every catch and pick-up counts: each found tile its count, the picked entry its total and each person's (the day
tallies: [backend](backend.md#tally)). A kind's page: every entry in the game's order, a silhouette until found, its
head (the picked entry: icon, name, who found it when, NH's line) pinned.

### The museum

`museum/` (each file's header has its part), `e2e/museum.spec.ts`, `e2e/museum-visitors.spec.ts`,
`e2e/first-person.spec.ts`. NH's museum (はくぶつかん) is a building on the layout
([island-layout.md](island-layout.md#the-islands-buildings)): NH's own model, one to an island, moved and turned in the
editor, never removed. A tap walks my villager to its door and in (the door's iris); ‹ しまへ or the doormat comes back
out.

- **Rooms** (`plan.ts`): one floor of portrait rooms, each one rect, 12 tiles across (the screen's way) and deeper the
  other. The hall (12 × 16): marble, a red runner from the door to Blathers' desk at the back, two benches. Left arch:
  the bug garden (12 × 20); right arch: the aquarium (12 × 20, the sea creatures' tanks among its fish tanks). **The
  fossils a loop** (NH's): the back-left arch to F1, the back-right to F3 (12 × 22 each), F2 (12 × 25) behind both:
  hall > F1 > F2 > F3 > hall. The gallery (G1, G2, 12 × 20 each) off the bug garden's far wall. Any room at most two
  doorways from the hall, no doorway in a room's front wall, every room within the relay's walk bounds (live-protocol
  MUSEUM_U): plan.test. The e2e puts my villager at named spots (`spots.ts`, `__museum.spot(name)`).
- **Plaques:** a lintel and a plaque over each doorway naming the room beyond in spaced kana, cream on walnut; every
  way back to the hall says はくぶつかん; every plaque of a room is whole on screen from each of its ways in
  (camera.test, hud.test).
- **The camera** (`camera.ts`): NH's room view for the portrait phone: the whole room across, x fixed at its middle,
  its back wall's top under the back button and its front edge over the HUD; a deeper room (F2) follows in depth with a
  dead zone. Nothing on show in the screen's bottom 120 px from any way in (camera.test). A drag turns it, a pinch
  zooms, ⌂ puts it back; the walls in the way cut away. At the eyes: [First person](#first-person).
- **Like the rooms:** a tap on the floor walks my villager there, the say button says a phrase in here only, and who
  else is in is the rooms' presence with the museum's scope (the guest too).
- **One room at a time** (engine.ts showRoom; why: [decisions](decisions.md)): only my villager's room is drawn, with
  whoever else is in it. Each doorway shows a card in the next room's colour with a glimpse of it; a tap on the card,
  its plaque, the tile before it or the floor past its line walks through, one tap. The room changes past the line
  inside a short dip to the next room's colour (hud.ts DIP_MS); its music changes with it ([Place music](#place-music)).
  The dip closes every balloon.
- **Light and night** (`look.ts`, `bake.ts`; no real lamps, nothing per frame): one look a room, each floor's baked
  light (dark at wall feet and under what stands, warm pools under exhibits, lamps and benches, cyan round each tank),
  NH's sconces, desk lamps and candles with halo cards, a wash over each painting, the tanks' water the brightest thing.
  At night (look.ts NIGHT) the room's own light dims, the pools and cards take over, an amber cast, everything outside
  the room dark. A room change compiles nothing (the warm-up; costs: [perf](ops/perf.md)); exhibits step only while
  something on screen moves, the fossils and art never.
- **The curator:** フータ (Blathers) behind his desk, NH's owl: breathing, glances, blinks; he watches my villager and
  nods off alone. He greets me once a visit on the way in; a tap is one of his lines in NH's balloon (never twice
  running), with a NEW find now and then his news of the newest by name.
- **Visitors** (`visitors.ts`, `crowd3d.ts`, `visitorLines.ts`: the numbers): NH villagers from ききみみ's cast through
  the Tokyo day, a few a room, admiring, sitting, chatting; seeded by the date, so every phone shows the same with
  nothing sent. One near waves to my villager; a tap: a hop and a line in its personality's voice.
- **What's on show:** one of each fish, bug, sea creature and fossil in the ずかん's first finds (anyone's) and each
  genuine artwork a present has held (selling takes nothing out). A tap: its card (MuseumCard: names, a fossil's
  skeleton progress, an artwork's title and artist, who found it and when), docked at the bottom or the top
  (`hud.ts` cardDock); with a card open any tap only closes it. Seated, the first tap only gets my villager up.
- **HUD:** a room chip at the top centre: the room's plaque word for word and what's on show of what it holds, hidden at
  the eyes. **NEW** (`newTags.ts`): a find of the last 24 h whose card hasn't been opened on this phone gets a gold
  「NEW」 card over it (one a skeleton, 「NEW ×n」 over a tank with more than three); the chip counts them, the hall's
  plaque to that wing a gold dot.
- **Built as one comes near:** the sea creatures and each fossil and gallery room are built (packs fetched) only once my
  villager is within a few tiles of their doorway (plan.ts nearRooms); the hall, aquarium and garden at once. Models
  stay loaded across visits (`world3d/modelCache.ts`; packs: [world3d-assets](world3d-assets.md#the-museum)).
- **The aquarium:** NH's three tanks (the great sea tank across the back, the deep-sea tank along the left wall, the
  river tank in the front corner), each facing the walkway (tanks.ts frontOf), two park benches facing the great tank.
  Up to seven of each tank's caught species an hour, the same on every phone, calm long passes, never clipping the
  glass; feeder fish hunted now and then (each phone's own). The sea creatures (`seaTanks.ts`, `seaLife.ts`) all at
  once in the reef tank and tide pool, NH's museum-tank models where NH has one.
- **The bug garden:** NH's garden under glass with cases; up to ten caught bugs an hour, each living as on the island.
- **The fossils** (`fossils.ts`, `fossilWing.ts`): NH's 73 as NH's models; F1 the early life, F2 the diplodocus and the
  T. rex alone in the middle, F3 the rest to the brachiosaurus. A skeleton's pieces stand in a row, each where it joins
  the next; once all are in the animal is whole (fossils.test).
- **The art gallery** (`art.ts`, `gallery.ts`): NH's 43 genuine artworks only: paintings on the red back walls and low
  panels with an aisle up the middle (a panel between the camera and my villager fades out), statues in the front band.
  A balloon's present now and then (`island/catalog.ts` ART_ONE_IN) holds an artwork the museum hasn't got.

### First person

`rooms/firstPerson.ts` (the lens, the head's limits, the glide), `rooms/gesture.ts` (the finger's rule),
`e2e/first-person.spec.ts`. In the tent, the homes and the museum the eye button (bottom left, yuzu while on) puts the
camera at my villager's eyes, and back. Kept on this phone (`island.fpv`; `?fpv=1|0` for a tab); local only. Off
during もようがえ.

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

`shop/ShopRoom.svelte`, `shop/stock.ts`, `contract/shop.ts`, `contract/stock.ts`, `contract/shopPrices.ts`,
`contract/pocket.ts` (`npm run shop:prices`), `e2e/shop.spec.ts`. NH's Nook's Cranny (タヌキ商店) with its own money,
かいがら (shells), never ベル ([decisions](decisions.md#the-shops-かいがら)): the island's catches sell for them and buy
furniture for the rooms. Each person's own pocket and かいがら, the guest's too.

- **Inside, in 3D** (`shop/plan.ts`, the rooms' engine with the shop's model as its shell: tent/engine.ts `Shell`): NH's
  built-up Nook's Cranny (`npm run world3d-models -- --shop`, static/room/shop/shell.glb), in by its door as the tent
  and the museum. まめきち and つぶきち stand behind the counter (one model for the two: villagers3d `timmy`). Today's
  stock stands in the room (`display`, the same on every phone): the largest on the stage's two tiers, small things on
  the table, wall things on the back wall; a piece with no place left is in the list only. The camera follows my
  villager from the stage to the counter; a drag turns it, a pinch zooms, ⌂ puts it back; the walls in the way cut
  away. **Others in the shop are drawn**, walking where they walk: the rooms' `tent` presence with `sc: 's'` (its
  points within the protocol's SHOP_U). Out of the door, or gone quiet past the presence's grace, they're gone.
- **The finger** (the rooms' rule): a floor tap walks; a tap on a piece picks it in place (a card: its icon, name,
  price and 買う, or owned); a tap on the twins (their bodies and the counter's top: `TWINS_BOX`, never the floor before
  it), on their balloon or on the sign by the door (`shop.sign`) is NH's choice box (sell · buy · nothing), the only way
  to the counter's list: a sheet over the room (its ✕ back to the room; its head and tabs pinned while the list scrolls).
  Their greeting is a small balloon by まめきち once I first reach the counter, gone after 4 s; it takes no tap meant
  for the room. A tile's name breaks only between its words (`shop/words.ts`).
- **うる** (sell): my pocket, everything I caught, found or picked up less what I sold, in sections, dearest first. A
  tap picks one more, − one less, all; the bar says how many for how much and sells. Selling never takes anything out
  of the ずかん or the museum. A present's furniture or recipe never sells, nor a message bottle. An empty pocket opens
  the shop on かう.
- **かう** (buy): first the fields' starts ([farming.md](farming.md), always in stock); then today's stock, 24 pieces
  of NH furniture a Tokyo day, seeded, less every piece the island had by the day's start (the ずかん's furniture finds
  and anyone's buys), so both phones agree all day; fewer when the island has nearly everything, none when it has all.
  The bar's 全部 picks every piece I don't have yet and 買う buys them at once (one undo); short of the total, the twins
  say by how much and 買う only boops: never a part of the lot (the record keeps it all or none). A bought piece is mine
  for good in 模様替え in every room I arrange.
- A sell or a buy shows at once with 取り消す for 5 s, then goes to the record, which checks it
  ([backend](backend.md#events)).
- **Prices:** NH's Bells ÷ 20 both ways (a sell at least 3): a sea bass 20, a koi 200, a whale shark 650, wood 3. A
  piece NH never sells (DIY, events, Nook Miles, Nook Shopping, the special characters', the gyroids) is **made up**: 4 ×
  its NH sell price ÷ 20, at least 3. **At most 10,000** (13 pieces). The stock: 1,902 pieces (915 made up), every room
  model but the starter set, the rugs and the tanks; a median 190.
- **The building:** NH's Nook's Cranny, one to an island, moved and turned in the editor, never removed
  ([island-layout.md](island-layout.md#the-islands-buildings)); the only way in.

### Dialogue

`island/pager.ts`, `island/Talk.svelte`, `island/Plate.svelte`, `e2e/dialogue.spec.ts`. The speech balloon and the catch
plate read like NH's box: 33 ms a glyph, two lines a page. A tap finishes the page, the next turns it, the last closes
it; an orange ▼ bobs while another page follows. Left alone a page turns after 6 s. The name tag is tilted on its
top-left in the speaker's NH colour. No voices. A visitor's first tap is their introduction, a first find adds
「ずかんに のったよ！」; a line may end on NH's answers (Jack, K.K.).

Where it stands, one rule for every speaker (`island/placement.ts` `placeBy`, `e2e/bubbles.spec.ts`): by the speaker,
its tail pointing at them, close: above the head when there's room, else beside, else below. Room gives way step by
step, nearness doesn't: clear of every control, else over the island's things but not the villagers, else over them
too. Never over the HUD, しずえ's box, a popup, the speaker, or off the scene. It follows a speaker who moves (carried
whole while the camera moves: `island/balloonFollow.ts`) and closes if they go. Captions (the wish, K.K.'s) keep clear
of every control; the catch plates stand in their stack ([Critters](#critters) "The catch").

### Villager taps

A tap on my villager is a squish and the tap sound (seated, where it sits), and in NH's flea months now and then a flea
hops off ([Critters](#critters)); nothing opens.

**Phrases** (`island/SayPicker.svelte`, `island/say.ts`, `e2e/say.spec.ts`): the say button ([Island](#island)) opens
the phrase picker above it: my own last four (newest first, kept on this phone) and a field (at most 20 characters).
No presets: only my own words. A pick hops my villager and shows the phrase in its balloon for 4 s (the name on a tag
in the person's colour), on every phone (presence only). One balloon at a time.

A tap on the partner's villager is a **ハイタッチ** at once, in place: they stop (woken first if asleep), a sparkle flies
from my villager to them, both turn and hop, hearts as it lands. Their phone plays the same moment from the same
start; closed, it hears it when it opens, once (`island/highFives.ts`). A tap while one is under way adds nothing. Off
screen, the edge chip brings the camera to them.

### Players

`components/player3d/`, `components/person3d/person3d.ts`, `e2e/players.spec.ts`; the conversion:
[world3d-assets.md "Players"](world3d-assets.md#players); the look's contract: [players.md](players.md). A and B are NH's human players
by default (`contract/look.ts` DEFAULT_LOOKS), assembled at runtime from parts converted from the game files: one body,
NH's faces, skin, hair and eye colours, and every hairstyle and garment that wore cleanly (4,338 items, lazy, in packs);
hats at NH's brim with NH's cut-down hair.
- **The part table:** the bundled first closet covers the everyday looks; the whole table (~1.2 MB) is fetched only for
  a part it lacks. A part a look can't have (offline, never fetched) is drawn as いつもの's, and a look naming an unknown
  part reads as いつもの (`contract/partIds.json`, in the first load).
- **Who draws a person:** `person3d` is the one seam between the look a person wears and the model a scene stands up
  (a player, or the roster villager); the island, the rooms and the museum swap a model in place when the look changes.
  **The 2D heads** (`characters/Avatar.svelte`: きろく, ずかん, the museum's finder, the pickers, the toasts, the edge
  chip) show the look worn: a player's portrait, drawn when the island is idle, the flat stand-in till then.

### Visitors

`island/Visitor.svelte`, `island/visitors.ts`, `e2e/visitors.spec.ts`. NH's visitors, one at a time, each NH's own 3D
model (a character with none never comes), seeded by the date: **Daisy Mae** on Sunday mornings 05:00–12:00, and
Monday to Saturday one of NH's weekday visitors (each at most once a week, about one quiet day in ten): **Kicks**,
**Label**, **Saharah**, **Leif**, **Redd**, **C.J.** and **Flick** 06:00–22:00, **Gulliver** 06:00–18:00, **Wisp**
20:00–04:00 (none on Saturday from 18:00: K.K.'s show, [K.K. on his stool](#kk-on-his-stool)); **Jack** on Halloween
night, **Celeste** on a meteor shower's night, the holiday hosts and the wedding couple on their days. Priority
(`visitorAt`): the event's host, the wedding couple, Celeste, (Saturday evening: nobody), Daisy Mae, then the day's.
`?visitor=none`: nobody. They stand on centre stage (the visitors' spot, put in the editor); **Gulliver washes up on
the front beach** (his spot), face down. Where the guest spot and Gulliver's may be put is what they need, no more: one
free tile of land in view, sand under his body; the editor names what's in the way and draws the derived spots
(docs/island-layout.md "Derived, never hand-made"). A tap: my villager turns to them, their introduction the first
time, then a line. No trading, no ベル.

### Visitors: roles

`island/visitorRoles.ts` (pure), `island/Visitor.svelte`, `island/VisitorShop.svelte`, `island/visitorShop.ts`,
`e2e/visitors.spec.ts`. NH's other special characters come as **guests** through the visitors' one slot, each NH's own 3D
model, each with a role (the one framework plays it, the data is per character):

| role | who | what |
| --- | --- | --- |
| shop | グレース (Gracie: pieces of 500 かいがら and up), ナッティー (Wardell: any) | their sheet: 6 pieces of the shop's price list, seeded by the day, never today's stock or one the island has; bought as the shop's |
| gift | ぺりお (Pete), クーコ (Leilani), タクミ (Lottie) | a piece for the rooms (a present's find: みつけた), once a visit to whoever asks first, the same piece on every phone |
| fortune | ハッケミィ (Katrina) | the day's luck and lucky colour, each person's own, the same all day |
| fish | セイイチ (Wendell, on the beach) | hungry: the next fish caught that day feeds him (this phone's record), then his gift |
| cheer | うおまさ (Chip: fish), カメヤマさん (Nat: bugs) | a hop and a line at each catch of their kind while they're here |
| chat | かいぞく (Gullivarrr, on the beach), みしらぬネコ (Rover), ししょー (Shrunk), コトブキ (Tortimer), パロンチーノ (Phineas), ベルリーナ (Pavé) | their introduction and lines |

**When:** **one guest every day**, 06:00–22:00 (the beach guests 06:00–18:00; on a Saturday till 18:00, K.K.'s show),
in a slot of their own (`visitors.ts guestNow`; its own director actor and 3D figure), by a seeded cycle
(`visitorRoles.ts guestOn`): each once before any comes again, never the same two days running, the same on both
phones. The weekday visitors, Daisy Mae, Wisp and the events' hosts keep their own slot. Pavé dances on Festivale (the
Monday 48 days before Easter), in the visitors' slot.

**Where:** at the **guest spot** the editor puts down (catalog.ts `guest-spot`, one an island; `spots.ts guestSpot`).
**The collision rule:** with no usable guest spot the guest stands at centre stage, beside the day's visitor if it's
there too (`besideStage`); the beach guests wash up on Gulliver's beach, but at the guest spot (or that fallback) on a
day Gulliver lies there or a guest spot is down. Weeds and fossils keep off the guest spot. Hooks:
`?guest=<id>|none`.

**Elsewhere:** Resetti asks first in the editor's island reset; Copper turns a wrong key away at the pairing page's
gate, Booker asks to wait when it can't be checked. **The cast** (the 図鑑's cast page, `kiroku/Cast.svelte`): every
special character with NH's own head icon (`npm run npc-icons`), its official name and where we meet them; those with
no sensible role on our island (no clothing, turnips, dreams, trains or post office here) are in the cast only.

### K.K. on his stool

`island/KKSlider.svelte`, `island/kkSlider.ts`, `e2e/visitors.spec.ts`. K.K. Slider (とたけけ) lives on the island on
his **stool**: a layout piece (one on the island, never removed, moved and turned in the editor; its front tile kept
clear), by default on まえ's lawn west of the main path. He's no visitor (never in the schedule). What he's up to goes
by the Tokyo clock (`kkMode`; `?kk=show|day|asleep`):
- **His show, Saturday 18:00–24:00** (NH's concert): a tap is his greeting with NH's choice box (a request from two
  songs or more, or his pick). The island's music stops for the song ([K.K. Slider](#kk-slider)), he strums harder, ♪
  float up, the villagers sway and a caption sits by him, on every phone; a tap mid-song can stop it. At its end his
  sign-off and the island's music returns.
- **By day** (06:00–24:00 the rest of the week): he strums quietly, no sound; a tap is a chat that offers a song all the
  same.
- **Asleep, 00:00–06:00:** nodded off; a tap wakes him and he offers one all the same, then sleeps.
- **Anyone, any time:** A, B and the guest alike; with ミュージック off, picking a song turns it on on that phone. **The
  song is everyone's**: it plays on the island's music stage ([Shared music](#shared-music)), heard on every phone
  outdoors from the same point; anyone's stop stops it for all; a phone opening mid-song comes in where it is. Where
  it can't be heard his caption says so and a tap listens. A tap turns my villager to him (no walk).

### Visitors: life

`island/visitorLife.ts` (pure), `e2e/visitor-life.spec.ts`. The visitor is the stage director's fourth actor, with a
beat on every idle slot.

- **Signatures (NH's,** `visitorLife.ts`**):** each its own move (Wisp floats, Jack twirls, Celeste points at a
  shooting star…).
- **Gulliver** sleeps face down (zzz, a twitch). A tap is a nudge and his sleep talk; the **fifth** wakes him: he gets
  up and introduces himself (awake for the day).
- **A beat:** the signature, an emote, a look at the nearest villager, a stroll for those who roam, or now and then
  **the partner comes over** (one walker at a time). Nothing while their line is up.
- **A tap:** my villager turns to them; the visitor walks back to its spot, turns with a hop and speaks.
- **Arriving and leaving** with the island open: walkers come from the campsite and go back, the others their NH way;
  on a page's first paint they're simply there.

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
one date. On the milestone days (`wedding.ts`) Reese and Cyrus are the visitor under a heart float, Reese's introduction ending
on the count. On the day the villagers bow and
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

English listening for A, B and the guest: everything is [kikimimi.md](kikimimi.md) (speaking
[kikimimi-mic.md](kikimimi-mic.md), the content [curriculum.md](curriculum.md)). On the island: the menu's 英語 pill
opens its full-height sheet, the island paused under it; an invite shows as a toast and on the pill
([kikimimi.md](kikimimi.md) "UI details").

### Trips

旅行, the trip guides (data, relay and maps: [travel.md](travel.md)), in the [unified kit](#unified-kit). The menu's
旅行 pill opens a full-height sheet (`components/travel/TravelSheet.svelte`, its own chunk), the island paused under it.
- **Opening:** straight into the trip on now, else back where it was left. Offline with the chunk not cached, a banner
  and a retry; a private value not in yet shows 🔒.
- **The list:** upcoming (soonest first) and past, a boarding pass each (the island's airline, TYO ✈ the trip's code,
  the cover, dates; the torn stub counts the days to go or the day of the trip, a past trip a sticker). The km | mi
  switch at the left of the title bar (this phone's, never synced).
- **A trip:** the photo band, then a TabBar 日程 · 地図 (with a route) · キャンプ場 (with campsites) · 持ち物. 日程: a chip a
  day and 準備; the day's card (date, title, route; a hike's photo and stats, a link opening トレイル's trail); the
  timeline (time, a dot on a dashed spine, text, note), on the trip's own clock: the day on now first, its row now lit.
- **地図:** the day chips and the map, the day's stops in a dense card; a row flies the map there, a pin scrolls to its
  rows. Locate at the bottom right; a layer button where the trip has candidate places; the save pill at the top-left.
- <a id="offline-maps"></a>**Offline maps** (`components/offline/SaveButton.svelte`; data: [backend](backend.md)
  "Service worker"): one pill per area, over the trip map and every trail's map: save (with its size) → saving (a
  percentage, × cancels) → saved (its size); a partial or evicted save offers a retry, an OpenFreeMap area past 30 days
  an update. A save that can't start says why (offline, the 150 MB total, the storage, another save running). A trash
  pill beside a saved area deletes it. Offline with the area saved, the map says it shows the saved range only; the
  credit stays visible. The feature docs give only their areas' sizes.
- **キャンプ場:** one ChipRow of filters (free, paid, beach, toilets, showers), the sites in one dense card; a row opens
  its card.
- **持ち物:** my count and the bar, 編集; a card per category (its NH item), a row per item: my tick (each person ticks
  their own), who has packed it at the right. 編集: an ActionSheet per row or category, add, add a category, reset my
  ticks. The guest changes only what it added. Deletes act at once with 取り消す; a category's and the reset ask first.
- **A trip that's over is read-only:** 持ち物 frozen as the seed list; nothing else editable.
- **The guides bend [Simplicity rules](#simplicity-rules):** they are reading cards, denser than a screen otherwise
  allows. Their text breaks only between words (`Txt.svelte`).

### Seasonal look

`ui-state/preview.ts` (pure; its header: what follows the look and what never does), `panel/SeasonSection.svelte`,
`e2e/preview.spec.ts`, `e2e/season-shared.spec.ts`. 設定's **季節** shows the whole island another day's look, on every
phone at once: an event, a season (春 / 夏 / 秋 / 冬), the weather and the time of day (朝 / 昼 / 夕方 / 夜), each **自動** by
default. Anyone sets it, the guest too; it stays until someone sets it back (`pref seasonLook`, one island-wide slot).
Folded to one row (自動, or what's forced, and **自動に戻す** while anything is). **天気** is one group for both the look and
[Weather](#weather)'s switch: 自動, ゲーム, 晴れ / 雨 / 雪.

- **Events** (the birthdays, Bunny Day, the blossom and maple weeks, the fireworks, the wedding, Halloween, Turkey Day,
  Toy Day, a meteor shower): each brings its day's look and, for the evening ones, the night sky.
- **What follows it:** the theme, the weather's look and music, the music's hour and event, the visitor, the fireworks,
  the shower, birthdays, the wedding, the particles and decorations, the hedges.
- **What never does:** the scene clock (`?date=` only), the days records are keyed by, and what the island yields:
  critters by the real month and weather, eggs and mushrooms by the real day, and a wish brings no fragment while it's on.
- **On screen:** a chip under the HUD row says what; a tap on it goes back to the real day for all.

### Dev params

The island's URL params (a visitor, the weather, a critter, the clock…, read by `island/devHooks.ts` and
`ui-state/preview.ts`) are listed in [ops/testing.md "URL params"](ops/testing.md#url-params).

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
`island/avatar.ts`, `e2e/movement.spec.ts`, `e2e/tapwalk.spec.ts`.

- **Only empty ground walks my villager:** a tap on something to do (a tree, a bush, a flower, the rock, a weed, a
  find, a bug, a fish shadow, the bubbles, the water, the tape deck, a visitor, the partner) acts in place: my villager
  turns to it and the action plays at the target, its tool there. The exceptions, walked up to: the doors, the board, a
  seat ([World](#world) "Sitting on a tap").
- **Tap-to-walk:** my villager runs there, over the bridge and up the stairs. A tap on ground it can't stand on snaps
  to the nearest walkable point near it, unreachable ground to the nearest reachable point; water never walks (it
  ripples); a building's footprint knocks at its door. A cream ring marks the spot.
- **Where my villager is, kept** (`e2e/positions.spec.ts`): the island opens with it where it last stood, however long
  after; only a player never placed starts at home. A phone gone (closed, hidden, offline) leaves its villager where its
  last walk ended, on every phone, asleep there ([Sleep](#sleep)).
- **Never a teleport on another phone:** a big gap glides off at the run while in view; only a phone opening, or the
  island hidden, puts it there. **The camera never moves for a walk:** only the finger scrolls.
- **Sheets and hiding:** a sheet stops everyone; uncovered, the outings wander back; hidden over 30 s, they're back on
  return. A balloon opens only over a villager standing still.
- **Footsteps** by the ground (grass, sand, snow, stone, a splash on a rainy day).
- **Outings:** only a woken villager whose person is away goes on one ([backend](backend.md#ambient-life) "Ambient
  life").
- **The partner over the relay** ([Shared world](#shared-world)): my walk goes as `walk`; their phone runs my villager
  along the same way. Off screen, a round face of their villager is pinned at the edge; a tap scrolls to them.
- **Goals:** a newly met fruit walks that person's villager to their tree; ふたりでぜんぶ brings both to the middle of the
  lawn for a high-five.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`, the box's rules: [Dialogue](#dialogue)): an `aria-live` mirror. **Banner** (`ui/Toast.svelte`, one at a time): the whole message, wrapped by phrase (`i18n/phrases.ts`: keep-all
  with a `<wbr>` after a particle or 。, as WebKit has no `auto-phrase`), a number never cut; a long one grows it.
- **Buttons:** every tappable has an edge (2px outline + 4px lip); static cards only a soft lip. Primary leaf,
  secondary cream, selected yuzu, disabled sunk. "Can't now" = `aria-disabled` ([Taps](#taps)). Shared skins in
  `styles/theme.css`: `.btn` (`.paper`, `.small`; `.off`), `.chip` / `.chips`, `.edit-tray`, `.hcard`, `.sec-label`,
  `.level-acts`; ‹ / ✕: [Navigation](#navigation).
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
  ゲスト (the guest player; お客さん only for NH's visitors) · 姿 · 模様替え · 片付ける · 季節 · 天気 · 図鑑 · 捕まえた · 作る · 資料 · a range with 〜; the game's own words stay
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
screen; WebP, never upscaled. Manifest and helpers `lib/art.ts`; files from `scripts/fetch-assets.ts`, but the
catalogue's, the critters' and the finds' icons: NH's own 2D icons from the game files (`scripts/nh-icons.ts`). The
villagers: all 417 + 23 special characters (`lib/villagers/roster.ts`). Ours: sky, sea, ground, the jar, effects,
marks, UI sprites. Names follow the Japanese game; no Nintendo fonts.

**The 3D renders** (`npm run models`: `scripts/models.ts`, its header): what NH has a model of is rendered from it for
the 2D art (the campsite, the trees in their seasonal looks, the bushes, the lamps, the rocks, the bridge, the
decorations), from the world's view, lit NH-style, under the scene's art keys; every look of one thing shares one
crop. The 3D pipeline: [world3d-assets.md](world3d-assets.md).

## Sound

`lib/sound/`. Off by default, kept per phone. Nothing sounds without a visible reason (idle life is silent). The music
is our own files; every effect is an original placeholder (`synth.ts`), replaceable by a file.

### Hourly music

One track per **Tokyo hour** (`hourly.ts`) in sunny / rain / snow arrangements (a missing variant falls back to sunny),
a 3 s crossfade on the hour, each file a gapless loop. Turning ミュージック on plays the opening theme first. Under a
sheet, the panel or the harvest the music is low-passed.

### Event music

On NH's event days its track replaces the hour's (`events.ts`, over the shared dates of `time/holidays.ts`), with the
hour's crossfade at the boundaries. A track without its file is the hour's music (or its `alt`):

Festivale (Easter − 48), Bunny Day, August Sunday nights (the fireworks), the wedding day (the board's date: ウエディング,
then the party from 19:00), Halloween from 17:00, Turkey Day, Toy Day (a snow version in snow), the New Year's Eve
countdown (four tracks from 23:00), New Year's (once at midnight, then the 0am, 2am and New Year's Day tracks). The
hours and titles: `events.ts`.

**Cut-ins** (`sound.svelte.ts`) swap at once over the island's music and hand back to it (each phone's own): the wasps
(Chased by Bees while they chase; a sting plays Stung by Bees once) and Franklin's cooking jingle. The stretch's
ラジオ体操 and the cake's ハッピーバースデー play on the island's shared stage instead. A cut-in ends at its end, when its
file can't play, at 音量 0, or when ミュージック goes off. Now Playing and the Media Session name the track.

### Place music

As in NH, a building's room plays its own track in place of the island's (`places.ts`), faded under the door's black.
What sounds, first there wins (`choose.ts pickMusic`): the opening theme, a cut-in, a shared stage, the room's track,
the island's.

The museum's rooms each their own (`museum-hall`, `-bugs`, `-fish`, `-fossils`, `-art`), the shop `shop`; the tent
and the homes none (NH's houses play the hour's music).

The museum's room is my villager's, settled a moment past an opening so a doorway never flaps. A room without a file
keeps the island's music; a door's track is fetched while my villager walks up.

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

### K.K. Slider

`kk.ts` (its header: the list, adding a song): K.K.'s songs, NH's titles, their own chunk loaded the first time K.K. or
a stereo's list shows. K.K. on his stool plays his live file on the island's stage, a room's stereo its aircheck; a pick
never repeats the last one; the offered songs are prefetched.

### Ambience

`ambient.ts` on the music bus, crossfaded: waves always; birds 05–17 on fine days (the bush warbler in spring, the
bulbul in autumn); cicadas 08–17 Jul–Aug; higurashi 04–08 and 16–19 Jul–Aug; crickets 17–05 Sep–Nov; nothing alive in
rain or snow; wind Dec–Feb; rain. The beds are **procedural** (`ambientSynth.ts`: original loops, its own chunk); a file
at `ambient.<id>` replaces a bed.

### UI sounds

Soft mallets and bells for the panel, cursor, confirm and cancel. Dialogue is silent.

### Cues

`cues.ts CUES` maps moments to sounds, levels and delays; nothing calls `play()` directly. Reactions name a cue per
step, taps in `data-sfx`, outcomes call `cue()` (scenery → `scene-<kind>`). The first open of the day (しずえ's `announce`) plays NH's **radio jingle**
(`radio.ts`: morning, noon or evening, one of six by the date, or the holiday's own). A sound without its file borrows a
`like`'s (`ids.ts`). **World cues** are skipped while a sheet, the panel or the harvest covers the scene; UI cues
always play.

### Taps

Every tappable names its sound in `data-sfx`; one capture listener (`taps.ts`) plays it on the click. `self`: the
handler plays the outcome's cue; `none`: silent. A control with `aria-disabled="true"` has its click swallowed and
plays `boop`. Enforced by `taps.test.ts`, walked by `e2e/sound.spec.ts`.

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
- **Voice session (ききみみ, [kikimimi-engine.md](kikimimi-engine.md#audio)):** a game's tap creates or wakes the context
  even with sound set silent, holds it awake (the background still suspends it), and sets the session to `playback`;
  ending it stops the clips, drops the decoded ones and hands back to the settings.

### Audio files

`static/audio/manifest.json` (`manifest.ts`: its header has the keys) and K.K.'s `static/audio/kk.json`. Each entry's
`v` is its file's content hash, so `/audio/*` is immutable ([backend.md](backend.md#service-worker)). Add a file and its
entry, no code change; a missing file falls back (an effect's placeholder, ambience's procedural bed, music silent).
`npm run audio:music -- <dir>` (`scripts/music.ts`) builds every entry from our MP3s; `sound.test.ts` checks every
path, hash and folder budget. Audio is never precached.

### Sound settings

設定's サウンド: **ミュージック** (music, ambience), **効果音** (effects, jingles), **音量** 0–10; both off at first; turning one
on previews it. In localStorage (`island.sound`), never synced.
