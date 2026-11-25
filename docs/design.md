# Island Fund: design

What the app is and how it behaves. Backend: [backend.md](backend.md); reasons: [decisions.md](decisions.md); budgets:
[ops/perf.md](ops/perf.md). Numbers live in `app/src/lib/config/rules.ts` and `contract/rules.ts` and win over this
doc; most files named here explain their details in their header comment.

## Product

A two-player Animal Crossing (NH) style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch, plus an optional guest ([The guest](#the-guest)). Activity grows fruit and earns **ベル** (+1 per daily
goal) into each person's wallet, spent on two treats. Japanese first, English per person.

- <a id="health-data"></a>**Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise, active energy,
  stand, weight, body fat %, BMI, lean mass) as `metrics` rows several times a day; a day's value is its latest row.
  Apple Health is the only source: no health number is typed into the app. What the app sends:
  [backend.md "Events"](backend.md#events).
- **Data out:** the static PWA (SvelteKit on Cloudflare Pages) fetches raw rows from the relay and computes every
  number on the phone (`lib/model/`, pure functions).
- **Principles:** zero required taps a day; both see all data; only opt-in notifications; no reduced-motion variants.

Code map: README "Layout" (`deps.test.ts` enforces import direction). Helpers: `lazy` (`ui-state/reload.ts`), `quiet()`
(`lib/quiet.ts`), `lib/math.ts`, `staticUrl()`, last-writer-wins maps (`store/synced.svelte.ts`).
<a id="maps"></a>**Maps:** controls, status and location dot live in `components/map/`; features import it, not each
other.

## Simplicity rules

No app tab bar: 島, the health popup and the menu's sheets (a sheet's own `TabBar` is fine). One focal point per screen;
a number in full in one place only, elsewhere a doorway to it. Per screen ≤ 40 Japanese characters of non-numeric text,
3 cards, 5 rows a card, one しずえ line (≤ 16 characters) only with news; the trip guides are the exception.

## Screens

### Island

Top to bottom: the HUD row, a sync chip only when sync fails, the 3D scene ([World](#world)), しずえ's box only with
news. One finger scrolls from まえ (home, the health lawn) to おく, two pinch-zoom, a tap on empty ground walks my
villager.

- **HUD row:** the health button and the menu, top-right at `--hud-top`; nothing else in the sky.
- **Menu** (`island/HudMenu.svelte`): NH's leaf disc unfolds up to nine pills (the guest's eight): ベル (my wallet; the
  guest's shows both) → [the panel](#panel), 旅行 → [Trips](#trips), 結婚式 → [wedding.md](wedding.md), 登山 →
  [hiking.md](hiking.md), 地図 → [places.md](places.md), 英語 → [english.md](english.md), ボット (a dot when a bot needs
  a person) → [bots.md](bots.md), やること → [todo.md](todo.md), 設定 → [Settings](#settings). **Edit mode** (a pill held
  500 ms): hide (never ベル), reorder, 元に戻す, 完了; each person's own order. Folded pills are `inert`. **今日・明日**
  ([todo.md](todo.md)) shows beside them when something is due.
- **Health button** (`island/HudHealth.svelte`): the health popup on its last tab, [健康](#kenkou) or [ごはん](#gohan);
  one kept sheet.
- **Coins** (`island/HudCoins.svelte`): a newly met goal flies +1 (+2 with がんばり) into the leaf.
- **Say button** (`island/SayButton.svelte`): the phrase picker ([Villager taps](#villager-taps)); rooms have one too.
- Controls are buttons with `aria-label`, ≥ 44px; focus order = visual order.

### Wallet

<a id="panel"></a>ごほうび (`panel/IslandPanel.svelte`, `wallet/Wallet.svelte`, `wallet/Shop.svelte`; `/jar` redirects to
`?panel=rewards`): both wallets as jars (`Jar.svelte`, `walletFill`) with today's ベル (goals, がんばり, half of
ふたりでぜんぶ); the two [rewards](#rewards), bought from my wallet after a confirm naming it, sent after its 取り消す;
貯めたベル ([Kiroku](#kiroku)); 買い物の記録 (`wallet/Purchases.svelte`), where anyone voids any buy (`spend_void`).

### Settings

**設定** (`panel/SettingsSheet.svelte`): プロフィール, 姿, サウンド ([Sound settings](#sound-settings)), 言語, 季節
([Seasonal look](#seasonal-look), with [Weather](#weather)'s switch) and 図鑑 ([Zukan](#zukan)).

<a id="sugata"></a>**すがた** (`look/LookPage.svelte`, `look/closet.ts`, `store/look.ts`; contract:
[players.md](players.md)): NH's wardrobe, the whole closet free (no ベル, no unlocks) for A, B and the guest; each person
is NH's human player ([Players](#players)) or a villager. Tabs (`look.tab.*`) コーデ (いつもの, up to 20 saved looks) · 顔
· 髪 · 服 · 小物 · 住民. Leaving the level sends the draft once if changed, with 取り消す; no 決定. The preview is the
level's only WebGL context.

<a id="profile"></a>**プロフィール** (`panel/ProfileSection.svelte`, `model/profile.ts`): read-only sex and birth date
for A, B and ゲスト ([backend](backend.md#pref) prefs, locked). It feeds height √(weight ÷ BMI); resting energy (`bmrOn`:
InBody's formula on the smoothed lean line (`smoothLine`) within 60 days, else Mifflin–St Jeor; the card's dots stay
raw); daily energy = resting + the average Move of the
last 28 Watch-worn days (≥ 7, `activityOn`), else × 1.4, within 1.2–2.2 × resting; ごはん's default goals
(`contract/goals.ts` `derived`); BMI's category with Asian cut-offs (23 / 25).

### Kiroku

The ベル ledger (`model/bells.ts` bellsLedger, `components/kiroku/*`), read-only in [ごほうび](#wallet): weeks newest
first, each person's ベル beside their four fruits; a day shows each goal's value, +1 and がんばり.

### Kenkou

健康 (`model/health.ts`, `components/health/*`): the health popup's first page, one person's Health data over time,
its own chunk. Whose (a `<select>`, shared with ごはん) · 健康 | ごはん · ✕; 活動 · 体 and 1週 · 1か月 · 3か月 · 1年 (the
guest: 活動 only). Cards: `model/health.ts` CARDS (`BarCard`: solid bars on goal days; `BodyCard`: dots and its trend line
(`dotLine`, the line its 「N日で」 chip reads), all shown or hidden by 体重's 傾向線を表示; muscle estimated, 基礎代謝量 = 370 + 21.6 × 除脂肪体重).

- <a id="pace"></a>**ペース** (`model/pace.ts`, [why](decisions.md#weight-pace-a-forecast-on-request)): 体's first
  card: verdict, ETA month, progress (start and now both on `smoothLine`'s line), weekly rate, streak (none beside
  横ばい / 戻り気味). Its 計算 and the TDEE count a day's Move only with ≥ 60 min Stand (`model/profile.ts dayMove`;
  partial-wear days), while the cards show every day as reported.
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit` over `contract/goals.ts` GOALS): a card's chip opens a
  tray; each person sets only their own (the record refuses another's). Activity goals apply from today; the ベル keep
  Exercise and Stand at 60 / 120 ([Goals](#goals)).
- <a id="goal-directions"></a>**Goal directions** (GOALS `dir`, [why](decisions.md#goal-directions)): at least (steps,
  Move, Exercise, Stand, lean, muscle, protein, fibre), at most (body fat, fat, salt), near (weight ±1.5 %, BMI ±4 %,
  kcal ±10 %, carbs ±15 %); every chip, bar and goal day follows it.
- **Rules:** no record, no row; today is drawn, not counted. **A day without the Watch**
  ([decisions](decisions.md#no-watch-days)): Move, Exercise and Stand all 0 or absent = no data for them
  (`activityOn`); steps stay.

### Gohan

ごはん (`model/food.ts`, `components/food/*`; data: [food-data.md](food-data.md)): the second page, a typed-in meal log
that never earns ベル; all see all, only the owner edits. A day renders from its entries' snapshots (an entry keeps its
food as logged, a いつもの takes the latest: [decisions](decisions.md#recalculation-future-automatic-past-by-hand)); the
food data loads in a worker at the first search or at idle.

- **記録 · グラフ:** a day's kcal against its goal (coral past 20 % over), P · F · C · 塩分, every nutrient, the PFC
  balance against 食事摂取基準 2025; meals breakfast · lunch · dinner · おやつ. My own past counted day (2+ main meals)
  under my resting energy (`profile.ts lowKcal`) says 「基礎代謝より少なめの記録です。飲み物・間食・料理の油も入っていますか」;
  never on the partner's; the day still counts.
- **Goals:** kcal, protein, fat, carbs, salt, fibre; defaults from [Profile](#profile) (fibre:
  [decisions](decisions.md#fibre-no-alcohol)); a low kcal goal warns, never blocks
  ([decisions](decisions.md#low-kcal-goals-warn-allow)).
- **Search** (`FoodSearch`'s header; ranking `food/search.ts`, golden queries `food/load.test.ts`): recent, best
  matches, then 近いもの; before typing, さいきん lists what I had at this meal first, at that meal's amount
  (`foodUi.ts recentOf`), then the rest; chain menus ([food-data.md](food-data.md#kalori)) rank under generic foods
  unless the shop is named. **Barcode** (`FoodScan`'s header; [food-data.md](food-data.md#barcodes)): not found → この商品を登録.
  **Amount** (`FoodAmount`, `FoodPortion`): one entry over 15 g salt or 2,500 kcal, or over 200 g of a seasoning mix
  (…の素, ルー, だし), shows a quiet 「量を確認」 (`food/portionCheck.ts amountCheck`), never blocking; a menu whose name
  states its weight (「…18g」) also takes grams (`food/nutrition.ts servingGrams`). **Forgotten items**
  (`food/quick.ts`): on my own day, on a meal with entries (おやつ always), chips on the たんぱく質 line: 朝 / 昼
  ＋飲み物 ＋油, 夜 also ＋お酒, おやつ ＋飲み物 ＋間食, plus kinds I logged there before; a tap adds my most-logged item
  of the kind (90 days) at my usual amount, else a generic, undone by the snackbar. **いつもの:** a meal repeated on set
  weekdays, changes from tomorrow. **My recipes and foods:** everyone's; only the maker deletes.

### Sheets and harvest

One sheet skin, `ui/Sheet.svelte` (a `<dialog>`; [Unified kit](#unified-kit)). **Harvest**
(`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both tap, the week's recap (ceremony only). **Pair**
(`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

One rule app-wide, enforced by `ui/nav.test.ts`.

- **The title bar** (`ui/NavBar`, 48px): ✕ top-right closes the whole sheet from any level; ‹ top-left only on a level
  (or `Sheet onback`); backdrop and Esc close. One button, `ui/NavButton` (theme.css `.disc`, 32 in a 44 hit; a `.pill`
  over a photo or map). No words in the bar but the title or 健康 | ごはん.
- **A half-filled form asks first** (`ui/discard.svelte.ts`): 「入力した内容を破棄しますか？」.
- **Forms and confirms:** a form is ✕ + one footer action, no キャンセル; an inline edit is キャンセル + its action. A
  confirm answers with the verb, never はい / いいえ (an `ActionSheet`, or `Sheet confirm={{ verb, onyes }}` with a
  picture). An undoable delete acts at once, 取り消す on its banner.
- Full-height sheets open and close at once; a form sheet or a level slides over 240 ms.

### Unified kit

<a id="sizes"></a>**Sizes:** one scope, `:is(dialog, .sheet-copy)` in theme.css: the title bar 48, controls drawn
32–36px in a 44px hit, rows 44–52; the world (HUD, leaf menu, rooms, dialogue) keeps the game's sizes (2px edge, 4px
lip). Shared tokens only ([Chrome and tokens](#chrome-and-tokens)).

- **Type:** `--font-ui` 700 (Zen Maru Gothic), `--font-num` 600 (Fredoka, tabular), `--font-body` (system); title 18 ·
  card and row 15 · note 13 · tab and axis 11.
- **Components** (ui/, all on `/dev/kit`): `Sheet`, `NavBar`, `NavButton`, `TabBar`, `Chip` in `ChipRow`, `Segmented`,
  `Tick`, `StatStrip`, `PhotoBand`, `ProgressBar`, `ActionSheet`, `LoadError`, plus theme.css's classes. **Controls:**
  `Segmented` one of ≤ 6, `.chip` many, `.prow` + `.sw` on/off, `.btn` a verb; selected = yuzu, never green.
- **Icons:** `ui/Icon` only (24 grid, 2px round stroke, `currentColor`); no emoji in chrome but the health sheet's
  `data-emoji` switches. **NH art** only where named (packing categories: `packView.ts`).
- Every tappable has its `data-sfx`; fields 16px+.

## Economy

Rule `scoring/bells.ts`, on read `model/bells.ts`, values `config/rules.ts` (`RULES`, `STRETCH`) and `contract/rules.ts`
(`SHOP`, `PRICE_HALVED_MS`); pinned by their tests, `model/properties.test.ts` and the golden fixtures. Earnings are
recomputed from the rows.

### Goals

Per person per Tokyo day, all or nothing: **+1 ベル for each goal met**, in ring order (`RING_FRUITS`).

| Fruit | Metric (Shortcut field → stored) | Daily goal |
|---|---|---|
| 🍐 Move | active kcal (`calories` → `move_kcal`) | `pref` moveGoal (`contract/goals.ts`) |
| 🍑 Exercise | `exercise_minutes` → `exercise_min` | 60 min |
| 🍒 Stand | `stand_minutes` → `stand_min` | 120 min |
| 🍎 Steps | max of `steps`, `steps_watch` | `pref` stepsGoal (`contract/goals.ts`) |

A day's Move and steps goals are the last set on or before it; Exercise and Stand always pay at 60 / 120
(`RULES.goals`). **がんばり:** +1 per goal at 1.5× (`STRETCH.multiplier`), at most +2 a person a day (`STRETCH.cap`).
**ふたりでぜんぶ:** +2 shared when both meet all four. A day pays the pair 0–14; `scoring/bells.test.ts` pins a week
(most 98, perfect 70, typical 52, lazy 28).

### Rewards

`SHOP`: **おやつ 20 ベル** (`snack`), **外食 35 ベル** (`dinner`). A buy is `spend {spendId, item, bells, day?}`: `bells`
exactly `shopPrice` at the record's clock (40 / 70 before `PRICE_HALVED_MS`), `day` up to 14 days back (`spendOf`).
Anyone voids any buy (`spend_void`).

### Harvest and lock

<a id="the-first-week"></a>**The first week** (`firstWeek`): the first with an activity row stamped by that week's
lock; a backfilled baseline never earns. **Sunday 19:30 JST** the recap (ceremony; the ベル came day by day);
**Wednesday 04:00 JST** the week locks: its earnings are as of the lock from then on. The lock is internal.

### Wallet and buys

`walletAt`: a person's own ベル plus half of ふたりでぜんぶ from the first day; buys and voids replay by `at`. A buy counts
only if covered (earnings up to its `day`, else its `at`'s day, minus earlier buys), so no balance goes negative. Buys
and voids never lock.

## Weight

`model/weight.ts`: a day's latest row, never earns (`deps.test.ts`); dots unsmoothed, the line a local linear fit over
±21 days (`smoothLine`, not an EWMA, which lagged a steady loss), also the からだ cards' change (`model/health.ts
dotStats`; [Kenkou](#pace)). Body metrics (`State.body`: body fat 2–70 %, BMI 10–60, lean 10–150 kg) the same; goals
`goalBodyFat`, `goalBmi`, `goalLean`.

## Island scene

`components/island/*`, `world3d/*` (rules: `lib/world/`): NH's island in 3D on the editable layout. What comes only on
its days loads when first due (`ui-state/lazyComponent.svelte.ts`). The DOM animates only `transform` and `opacity`;
`data-paused` (hidden), `data-covered` (a sheet pauses particles, critters, idle life), `data-sheet` (a full-height
sheet: the 3D island draws nothing). Nothing on the island pays ベル. Dev URL params (`world/devHooks.ts`):
[ops/testing.md](ops/testing.md#url-params).

### World

`world3d/engine.ts`, mounted by `island/IslandScene.svelte`; coordinates are the layout's
([island-layout.md](island-layout.md)); an 80u villager, z into the island. **No WebGL:** a line (`[data-no3d]`); the
rest works. **In 3D** ([decisions](decisions.md) "The island in 3D"): no island DOM; things from `world3d/things3.ts`.

- **The camera** (`world3d/islandCam.ts`; `camera.svelte.ts` `World`, `world.at(…)` for overlays): widest by default, x
  centred; one finger scrolls (no snap, no automatic move); a pinch zooms to 3.2.
- **Layout** (`layout/default.json`, `npm run layout`): home A left, B right, never mirrored. **The sea's wash**:
  `layout/swash.ts`.
- **Decor** (`world/fixedDecor.ts`): obstacles that answer a tap in place; their life in `island/ambient.ts`.
  **Sitting** (`island/sitting.ts`): a seat tap walks to the nearest free seat.
- **Lights** (`world3d/lights.ts`): models' own lights at dusk and night; snowy models in winter.

### Startup

Budgets: [ops/perf.md](ops/perf.md). The 3D import starts while the week loads (`ui-state/boot.ts`); ground fields come
from a worker or cache (`layout/fieldsPrime.ts`). **A failed load retries** (`ui-state/retry.ts`); **a failed chunk
reloads** into a newer build, once a session (`ui-state/reload.ts`). Cache rules: `scripts/headers.ts`.

### Frame rate

At most **30** fps (`store/frameRate.ts` FPS) while anything moves; a still scene draws nothing; one pacer
(`world3d/pace.ts`). **At rest** the island's ambience draws at **12** fps (engine.ts REST_FPS), the museum 15;
critters drop to 12 after 15 s untouched (pace.ts CRIT_CALM_MS). **One renderer lifecycle** (`world3d/stage.ts`),
models cached page-wide (`world3d/modelCache.ts`).

### Buildings

`world/buildings.ts`, `island/doorOut.ts`: the campsite, homes, [museum](#the-museum), [shop](#the-shop), never removed.
A tap walks in; ‹ しまへ comes out at the door, facing out, on every phone (`layout/nav.ts` exitOf).

### Environment

Seasons (`ui-state/season.ts`): winter Dec 11 – Feb 24, spring to May 31, summer to Sep 15, autumn to Dec 10. Tokyo
time of day sets the sky: dawn 05, day 07, dusk 16, night 19 (never black).

### Particles and events

≤ 3 particles; petals and leaves float on water (`floats3d.ts`); events (`eventsAt`): cherry blossom Apr 1–10, maple
week Nov 16–25, Toy Day Dec 24.

### Weather

`world/weather.ts`, relay `src/weather.ts`: Tokyo's real hourly weather (the relay's Open-Meteo timeline,
[backend](backend.md#the-real-weather)) or the seeded day, the same on every phone. **The switch** (設定 → 季節 → 天気):
自動 / ゲーム, island-wide; 晴れ / 雨 / 雪 force the look only; `?weather=` both. Winter rain falls as snow; event nights
stay fine; rain-only critters and fine-night shooting stars follow it.

### Trees

`island/FruitTree.svelte`, `world/fruitDay.ts`: one per person, four fruits filling toward the goals; a met fruit falls
and the owner's tap (within 22u) picks it up for 60 かいがら (`contract/pocket.ts GOAL_GOODS`, key
`fr:<person>:<fruit>`; others refused: `pickMaySend`); all four met, a gold one, 150. Other taps open the popup: goals with marks (`world/progress.ts goalMark`),
[daily checks](#daily-checks), meals and P · F · C (`world/mealChecks.ts`).

### Daily checks

`model/checks.ts`: 顔, HIIT, Core, ticked by the owner only, never from Health; 0 ベル (`RULES.checks`).

### Shaking a tree

`island/treeShake.ts`: three quick taps shake any tree but bamboo, in place; nests, bugs, branches, coconuts, never
fruit; no piles; presents from `island/treeGifts.ts`; shared. Wasps chase the shaker ([Event music](#event-music)).

### Scene interactions

`island/sceneTaps.ts`: everything answers a tap softly, for nothing, ≤ 4 flourishes at once; water casts
([Critters](#critters)), flowers are watered ([Island care](#island-care)), empty ground walks ([Walking](#walking)).
**Tap targets** (`world3d/pick3d.ts`, `island/hitbox.ts`, router `SceneTaps`): a thing's whole visible body, ≥ 44px,
front wins; overlays own their taps. Nothing lies on a building's footprint (`layout/clear.ts`); WebKit never retargets
a touch (`ui-state/exactTaps.ts`).

### Balloon

`world/balloonFlight.ts`, `island/balloon.svelte.ts`: by day every 45–90 s on screen; the present lands clear of
controls (`world/presentLanding.ts`); contents by NH's rates (`island/catalog.ts`, `npm run catalog:build`).

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/villagerSync.ts`; mechanism: [backend](backend.md#shared-world).
Every phone shows the same island: catches and pick-ups gone on all, drops on all, villagers and fishing in step. The
relay's first claim wins; a partner's act within 12 s plays here, older ones only change the island.

### Sleep

`ui-state/presence.ts` ([decisions](decisions.md#sleep-by-presence)): a villager is awake while its person's app is
open, asleep where it stands otherwise (`GRACE_MS` 45 s on the relay's clock); a tap wakes it for `WAKE_MS` (a minute).

### The guest

`contract/guest.ts`, `ui-state/cast.ts` ([backend](backend.md#the-guest), [decisions](decisions.md#the-guest)): ゲスト,
its own key ([runbook](ops/runbook.md#10-pair-a-phone)); tests `?demo&as=G`. The same app as A and B except: ボット
read-only (its bookings are on our accounts); 健康 is 活動 only (the record leaves body data out of its snapshot); its
wallet never earns (no Health data), so rewards are out of reach and its ベル pill shows both wallets; no harvest; it
opens at its villager (`GUEST_OPEN_BACK`). "The partner" cases: `ui-state/cast.ts` islandActors.

### The island's layout

`layout/`, `store/layout.svelte.ts`; contract: [island-layout.md](island-layout.md); edited in /editor only.

### Decorating

`layoutEdit/IslandEdit.svelte`, `island/decor.svelte.ts`, `world/decor.ts`: anyone, the guest too, places NH's outdoor
furniture, in /editor only ([island-layout.md](island-layout.md#phone-editing)); ≤ 1,500 objects (`contract/layout.ts`
LAYOUT_MAX). **The gym** (ジム), rooms and island: a tap uses a piece in a loop (`world3d/benchBar.ts`,
`tent/uses.ts`, `tent/rideFx.ts`); **Stood at** pieces (`standFx.ts`) sync as seats.

### The bulletin board

[board.md](board.md): front beach; four notes a page; everyone writes.

### The tent

`tent/`, `store/tent.svelte.ts`, `contract/tent.ts`; the homes are the same system. One place at a time
(`store/where.svelte.ts`). Sizes `ROOM_SIZES`, ≤ 120 pieces (`TENT_MAX`); camera `rooms/pan.ts` or
[First person](#first-person); arches pass between posts (`scripts/room-pass.ts`); stereos (`tent/stereo.ts`) on the
room's [stage](#shared-music). **Table tops:** one small thing a tile, carried with the table. **Whose room:** anyone
arranges any room, the guest too; a home's look stays its owner's; tray `tent/shelf.ts`. Undo `tent/steps.ts`;
**Saved arrangements** `contract/roomSave.ts` (three a room); seats `tent/seats.ts`; models
[world3d-assets.md](world3d-assets.md#room-packs).

### Critters

`world/critters.ts`, `island/critterPath.ts`: NH species on the Tokyo clock, seeded, so every phone agrees
([backend](backend.md) "Ambient life"); catches shared by id. Seasons a flavour (3× in NH's months), hours hold.
**Fishing** (`world/fishing.ts`): a tap on water casts; any tap but a door reels. **How the bugs move** (bugPath): NH's
paces. **Bugs:** a tap nets. Diving `world/sea.ts`; plates `island/CatchStack.svelte` ([Cues](#cues)).

### Beach finds

`island/finds.svelte.ts`, `world/beach.ts`: shells, four dig spots a day (`DIGS_A_DAY`), mushrooms, bottles, star
fragments; seeded, shared; first finds go in the ずかん.

### Island care

`island/care.svelte.ts`, `world/care.ts`: weeds, watering, the rock; fields: [farming.md](farming.md). A flower
watered yesterday (by anyone: the shared day's `watered` and the record's rows) is 1 in 4 a hybrid today (`hybridFor`,
seeded by the date), the same on every phone; each phone greets it once (a sparkle, 「くろい コスモスが さいた！」).

### Pond

`world/pondFish.ts`: fresh-water fish by where you cast.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/zukan.ts`, `model/finds.ts`: from 設定; a row per kind, shared first finds, each
person's tally ([backend](backend.md#tally)).

### The museum

`museum/`: NH's はくぶつかん ([island-layout.md](island-layout.md#the-islands-buildings)). Rooms in `plan.ts`, one drawn
at a time (engine.ts showRoom; [decisions](decisions.md)), a doorway changes the music ([Place music](#place-music));
baked light (`bake.ts`); visitors `visitors.ts`; NEW tags `newTags.ts`; or [First person](#first-person).

### First person

`rooms/firstPerson.ts`, `rooms/gesture.ts`: the eye button in rooms and the museum (`island.fpv`, `?fpv=1|0`); a drag
turns the head, a walk never does; a pinch is the lens (`rooms/lens.svelte.ts`).

### The shop

`shop/`, `contract/shop.ts` (`npm run shop:prices`): タヌキ商店, its own money かいがら, never ベル
([decisions](decisions.md#the-shops-かいがら)); everyone has a pocket. List `shop/Counter.svelte`; 24 pieces a day each.
Prices: NH Bells ÷ 20 (a sell ≥ 3), catches and beach finds sell × 10, ≤ 10,000.

### Dialogue

`world/pager.ts`, `island/Talk.svelte`: NH's box, 33 ms a glyph, two lines a page, a page turns itself after 6 s;
placement `island/placement.ts` `placeBy` (clear of controls and the HUD).

### Villager taps

Mine: a squish. **Phrases** (`island/SayPicker.svelte`): my own words, ≤ 20 characters, 4 s on every phone. The
partner's: a ハイタッチ on both phones (`world/highFives.ts`).

### Players

`components/player3d/`, `components/person3d/person3d.ts`: NH's human players (`contract/look.ts` DEFAULT_LOOKS); see
[players.md](players.md), [world3d-assets.md "Players"](world3d-assets.md#players).

### Visitors

`island/visitor.svelte.ts`, `world/visitors.ts`: one at a time, each NH's 3D model, seeded by date. Priority
(`visitorAt`): an event's host, the wedding couple, Celeste, nobody on Saturday from 18:00 ([K.K.](#kk-on-his-stool)),
Daisy Mae (Sunday mornings), the weekday visitor. They stand on centre stage; Gulliver sleeps on the front beach. No
trading, no ベル.

### Visitors: roles

`world/visitorRoles.ts`: special characters with a role, one a day at the guest spot (`layout/spots.ts`);
`?guest=<id>|none`.

### K.K. on his stool

`island/kk.svelte.ts`, `island/kkSlider.ts`: a fixed layout piece, no visitor; `kkMode` (`?kk=show|day|asleep`): his
show Saturday 18:00–24:00, strumming by day, asleep 00–06. Any time a tap offers a song, played on the island's
[shared stage](#shared-music) for everyone.

### Visitors: life

`island/visitorLife.ts`: the director's fourth actor; Gulliver wakes on the fifth tap.

### Halloween

`world/events.ts`, `island/Halloween.svelte`: Oct 31, pumpkins all day, lit 17:00–24:00 with Jack.

### Holiday hosts

`world/events.ts` (`nthWeekday`, `easter`), `world/visitors.ts` (`HOSTS`), `world/eggs.ts`: Franklin (Turkey Day, wants
a fish), Jingle (Toy Day), Zipper (Bunny Day week: eggs from balloons, digs and the line).

### Birthdays

`world/birthday.ts`, `island/Birthday.svelte`, `island/cake.svelte.ts`: ours from `PEOPLE` in `config/rules.ts` (null
turns one off; Feb 29 → Feb 28); hats and a cake whose tap plays ハッピーバースデー on the [shared stage](#shared-music).

### Wedding countdown

`world/wedding.ts`, `island/Wedding.svelte`: the date is the 結婚式 board's `date` ([wedding.md](wedding.md);
`time/holidays.ts` `weddingDate`); milestone days bring Reese and Cyrus, the day fireworks from 19:00.

### Shooting stars

`world/stars.ts`: clear nights 19:00–04:00; a sky tap while one crosses is a wish (`scene-wish`), a star fragment the
next morning. <a id="celeste-and-meteor-showers"></a>**Celeste and meteor showers** (`world/meteor.ts`): about one
night in ten, at most one a week, a star every 3–8 s.

### Fireworks

`world/fireworks.ts`, `island/Fireworks.svelte`: August Sundays, New Year's, the wedding night, and the evening both of
us meet every goal; a sky tap adds one; ≤ 4 bursts at once.

### Group stretching

`island/stretching.ts`, `island/deck.svelte.ts`: the tape deck plays on a day either met Exercise, or 06–08; a tap
plays ラジオ体操 on the [shared stage](#shared-music) and every awake villager stretches; once a day.

### Trips

旅行 ([travel.md](travel.md)): `travel/TravelSheet.svelte`. <a id="offline-maps"></a>**Offline maps**:
`offline/SaveButton`, `travel/OfflineMaps`.

- **A trip** (`travel/TripView.svelte`; /s `share/TripShare.svelte`): 日程 · 地図 · 準備 (logistics, campsites) · 持ち物.
- **日程** (`travel/Itinerary.svelte`): every day on one page, a boarding pass each: the stub 「● 2/13（土） 3日目 タイトル」
  (date in ink, the day's colour only the dot) held at the top, torn off along a stitch. A stop: arrival, place, one quiet
  line of how we got there (「車 2時間31分」, 「07:35発」 on the first leg only); 「泊」, **未予約** in bold. Notes, km,
  sun, 地図で見る, Googleマップ only on a tap; the day's tip and photo on its stub's tap. Each fact once a screen.
- **Now:** one yuzu line on the stop we're heading to (「いま移動中 · あと1時間40分 · 181 km」), earlier lines soft; the
  page opens on it. Days below it are `content-visibility: auto` with a guessed height (WebKit: no scroll anchoring),
  never one holding an open line; the pass's side room is the section's, so its notches aren't clipped.
- Distinct from the list's boarding pass: that one is torn down the right with a photo and sky band; the day's is torn
  across under its stub, text only.

### Seasonal look

`ui-state/preview.ts`, `panel/SeasonSection.svelte`: forces the island's look only (`pref seasonLook`).

## Motion

`motion/director.svelte.ts` (one state per actor), `motion/idleLife.svelte.ts` (on ambient life's slots, the same on
every phone); reactions `REACTIONS`, never on first render.

### Walking

`world/walkGraph.ts`, `island/tapWalk.ts`, `layout/nav.ts`, `island/avatar.ts`.

- **Only empty ground walks:** anything to do acts in place (my villager turns to it); walked up to: doors, the board,
  seats. Off-limits ground snaps to the nearest reachable point; water ripples.
- **Position persists:** the island opens where my villager last stood; a gone phone leaves it asleep there.
- **No teleports** on other phones (a glide in view). **The camera never moves for a walk.**
- A newly met goal walks the villager to its tree; ふたりでぜんぶ brings both together for a high-five.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`; [Dialogue](#dialogue)): an `aria-live` mirror. **Banner** (`ui/Toast.svelte`): one
  at a time, wrapped by phrase (`i18n/phrases.ts`); undo and retry as the bottom snackbar over `FLOOR` (`UNDO_MS`).
  Sheet copy via `ui/Phrases.svelte`; English in Japanese copy has `lang="en"`.
- **Buttons:** primary leaf, secondary cream, selected yuzu, disabled sunk; "can't now" = `aria-disabled`
  ([Taps](#taps)).
- **Text:** `--text`, `--text-soft`, `--leaf-text`, `--coral-text`, `--sky-text`; ≥ 13px; `styles/contrast.test.ts`
  holds 4.5:1. **Focus:** one `:focus-visible` ring, none after a pointer (`ui/modality.ts`).
- **Tokens:** `styles/tokens.css` only (`styles/vars.test.ts`); coral is for errors; `--person-a` / `--person-b`
  CVD-checked.
- **Theme:** one light theme, no dark mode (`e2e/night.spec.ts`); only the scene follows `data-tod`.

## Copy

Two zones by where a string shows (`i18n/linebreaks.test.ts` WORLD):

- **The world** (island, rooms, HUD, bubbles, world toasts): spaced kana (分かち書き), `word-break: keep-all`, no unbroken
  run over 12 characters.
- **Everything opened from it** (sheets, dialogs, the editor, the board, the shop's list) **and the leaf menu**: natural
  kanji Japanese; `dialog`, `[role=dialog]`, `.sheet-copy` are `word-break: normal`. A bubble is keep-all anywhere.
- **A banner** takes its act's zone (`undoBanner` `world`: とりけす vs 取り消す). **Dots:** 「・」 inside a phrase, 「 · 」
  between items. **Register:** English Study and すごろく casual.
- **One spelling a term:** 設定 · 記録 · 目標 · 歩数 · 体重 · 完了 · 削除 · 取り消す · 保存 · 編集 · 決定 · キャンセル · 閉じる ·
  戻る · 元に戻す (restore) · もう一度 · 今日 · 変更 · 並び順 · 同期 · オフライン · 住民 · ゲスト (NH's visitors: お客さん) · 姿 ·
  模様替え · 片付ける · 季節 · 天気 · 図鑑 · 捕まえた · 作る · 資料 · 詳しく · 並べ替え · filter すべて, verb 全部〜 · ranges with
  〜; a day `11/4（水）` (when.ts), alone `11月4日（水）`. Game words stay (ベル, かいがら, がんばり, ふたりで全部, いつもの, ごはん,
  ごほうび), as do NH's official names.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard via
`ui/keyboardInset.svelte.ts` (`--kb`, never `innerHeight`). Safe areas only via `--safe-*`, `--ui-top`, `--pad-foot`,
never `env()` in a component. Check at 393×852, 375×667 and 320×568.

## Official art

NH renders only from `static/art/` through `<OfficialArt>` (a missing file never breaks a screen); WebP, never
upscaled. Manifest `lib/art.ts`; files from `scripts/fetch-assets.ts`, NH's own 2D icons via `scripts/nh-icons.ts`;
villagers in `lib/villagers/roster.ts`. Names follow the Japanese game; no Nintendo fonts. One file a picture
(`scripts/art-dedupe.ts`; `static-files.test` fails on duplicate bytes).

**Packed icons** (`scripts/art-packs.ts`, `npm run art:packs`): clothing, recipes and artworks in
`static/art/finds/pack/` (≤ ~200 KB each, hashed index), cut out by `lib/artPack`; old packs evicted (`artEvict`).

**The 3D renders** (`scripts/models.ts`): write `world/models.json` (feet point and box per model: scale and tap areas)
and the sprites shown off the island ([world3d-assets.md](world3d-assets.md)).

## Sound

`lib/sound/`. <a id="sound-settings"></a>**Sound settings** (設定 → サウンド): **ミュージック**, **効果音**, **音量** 0–10;
both off at first, per phone (`island.sound`). Nothing sounds without a visible reason. Music is our own files; effects
are original placeholders (`synth.ts`), replaceable by files.

### Hourly music

One track per Tokyo hour (`hourly.ts`) in sunny / rain / snow (missing → sunny), a 3 s crossfade, gapless loops; the
opening theme first; low-passed under a sheet.

### Event music

NH's event tracks replace the hour's (`events.ts`, dates from `time/holidays.ts`). **Cut-ins** (`player.svelte.ts`,
per phone): the wasps' chase and sting, Franklin's jingle; they end at their end, on failure, at 音量 0 or ミュージック
off. Now Playing and the Media Session name the track.

### Place music

A room plays its own track (`places.ts`): the museum's rooms (`museum-hall`, `-bugs`, `-fish`, `-fossils`, `-art`),
the shop `shop`; tent and homes none. Priority (`choose.ts pickMusic`): opening theme, cut-in, shared stage, room,
island.

### Shared music

`sound/stage.svelte.ts`; mechanism: [sound-sync.md](sound-sync.md). Music someone starts is a **stage**, one record per
source (the island's K.K., stretch and cake; each room's stereo), playing from where the song is now wherever audio is
on and unlocked; mute and volume stay local. Others' sounds reach every phone by the camera's ear; UI taps, the shop,
my wasps and previews stay mine.

<a id="kk-slider"></a>**K.K. Slider** (`kk.ts`: the list, adding a song): his own chunk; live files on the stool,
airchecks on stereos; never the last song twice; offered songs prefetched.

### Ambience

`ambient.ts` on the music bus by hour, month and weather (waves always; nothing alive in rain or snow); procedural beds
(`ambientSynth.ts`, own chunk), replaced by a file at `ambient.<id>`.

### Cues

`cues.ts CUES` maps moments to sounds; nothing calls `play()` directly. Reactions name cues, taps use `data-sfx`,
outcomes call `cue()` (`scene-<kind>`). The day's first open plays a radio jingle (`radio.ts`). A missing file borrows
a `like`'s (`ids.ts`). World cues skip while covered; UI cues always play. Dialogue is silent.

### Taps

No text selection or iOS callout (`.selectable` opts in). Every tappable names its sound in `data-sfx`; one capture
listener (`taps.ts`) plays it (`self`: the handler plays the outcome; `none`: silent); `aria-disabled="true"` swallows
the click and plays `boop`. Enforced by `taps.test.ts`.

### Mix

`mix.ts` LEVELS: music, ambience, effects; master 音量 squared (default 0.8); voice caps; jingles duck the music.
Effects decode at unlock, the `lazy` ones at first play.

### Engine lifecycle

`player.svelte.ts` drives `engine.ts`; rules pure in `session.ts`; `engine.test.ts` uses a fake context. The player
chunk loads at launch with a setting on, else at the first tap.

- **Unlock:** no context until a setting is on; the first tap creates and resumes it. **Nothing queues:** a cue on a
  stopped context is dropped.
- **Suspend:** effects only → sleeps after the last sound; hidden → paused and suspended; **music off** releases files.
- **iOS session:** `ambient` (mixes, obeys the silent switch); **a video's floor** (`videoFocus`) pauses the island and
  switches to `playback` until it closes.

### Audio files

`static/audio/manifest.json` (`manifest.ts`) and `static/audio/kk.json`; each entry's `v` is a content hash, so
`/audio/*` is immutable ([backend.md](backend.md#service-worker)); never precached. Missing files fall back.
`npm run audio:music -- <dir>` (`scripts/music.ts`) builds entries from our MP3s; `sound.test.ts` checks paths, hashes
and folder budgets.
