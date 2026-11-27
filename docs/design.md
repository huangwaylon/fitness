# Island Fund: design

What the app is and how it behaves. Backend [backend.md](backend.md); reasons [decisions.md](decisions.md); budgets
[ops/perf.md](ops/perf.md). Numbers live in `app/src/lib/config/rules.ts` and `contract/rules.ts` and win over this
doc; most files named here explain themselves in their header.

## Product

A two-player Animal Crossing (NH) style island for a couple in Tokyo (A and B, each with an iPhone and an Apple Watch)
plus an optional guest ([The guest](#the-guest)). Activity grows fruit and earns **ベル** (+1 per daily goal) into each
person's wallet, spent on two treats. Japanese first, English per person.

- <a id="health-data"></a>**Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise, active energy,
  stand, weight, body fat %, BMI, lean mass) as `metrics` rows; a day's value is its latest row. No health number is
  typed. What the app sends: [backend.md "Events"](backend.md#events).
- **Data out:** the static PWA fetches raw rows and computes every number on the phone (`lib/model/`, pure).
- **Principles:** zero required taps a day; both see all data; only opt-in notifications; no reduced-motion variants.

Code map: [architecture.md](architecture.md#code-layout) (`deps.test.ts` enforces import direction). Helpers: `lazy`
(`ui-state/reload.ts`), `quiet()` (`lib/quiet.ts`), `lib/math.ts`, `staticUrl()`, last-writer-wins maps
(`store/synced.svelte.ts`). <a id="maps"></a>**Maps:** controls, status and location dot in `components/map/`;
features import it, not each other.

## Simplicity rules

No app tab bar: 島, the health popup and the menu's sheets. One focal point per screen; a number in full in one place,
elsewhere a doorway to it. Per screen ≤ 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card, one しずえ
line (≤ 16 characters) only with news; trip guides excepted.

## Screens

### Island

The HUD row, a sync chip only when sync fails, the 3D scene ([World](#world)), しずえ's box only with news. One finger
scrolls まえ → おく, two pinch-zoom, a tap on empty ground walks my villager.

- **HUD row** (top-right, `--hud-top`): [やること's disc](todo.md#the-disc-and-the-peek) (only when due), health, menu.
- **Menu** (`island/HudMenu.svelte`, `ui-state/menuGrid.ts`): the leaf drops one fixed 3×3 grid for everyone: 毎日
  (やること [todo.md](todo.md), 英語 [english.md](english.md), ベル [the panel](#panel)), お出かけ (旅行 [Trips](#trips),
  地図 [places.md](places.md), 登山 [hiking.md](hiking.md)), ほか (結婚式 [wedding.md](wedding.md), ボット
  [bots.md](bots.md), 設定 [Settings](#settings)). 56px squircles in their hue (`--tile-*`), a white line icon, the
  name under; badges: ボット's 「!」, 英語's dot.
- **Health button** (`island/HudHealth.svelte`): the popup on its last tab, [健康](#kenkou) or [ごはん](#gohan).
- **Coins** (`island/HudCoins.svelte`): a newly met goal flies +1 (+2 with がんばり) into the leaf.
- **Say button** (`island/SayButton.svelte`): the phrase picker ([Villager taps](#villager-taps)); rooms too.
- Controls are buttons with `aria-label`, ≥ 44px; focus order = visual order.

### Wallet

<a id="panel"></a>ごほうび (`panel/IslandPanel.svelte`, `wallet/Wallet.svelte`, `wallet/Shop.svelte`; `/jar` redirects
to `?panel=rewards`): both wallets as jars (`Jar.svelte`, `walletFill`) with today's ベル; the two [rewards](#rewards),
bought from my wallet after a confirm, sent after its 取り消す; 貯めたベル ([Kiroku](#kiroku)); 買い物の記録
(`wallet/Purchases.svelte`), where anyone voids any buy.

### Settings

**設定** (`panel/SettingsSheet.svelte`): プロフィール, 姿, サウンド ([Sound settings](#sound-settings)), 言語, 季節
([Seasonal look](#seasonal-look), [Weather](#weather)'s switch), 図鑑 ([Zukan](#zukan)).

<a id="sugata"></a>**すがた** (`look/LookPage.svelte`): [players.md "The dresser"](players.md#the-dresser).

<a id="profile"></a>**プロフィール** (`panel/ProfileSection.svelte`, `model/profile.ts`): read-only, locked sex and birth
date ([backend](backend.md#pref)). Feeds height √(weight ÷ BMI); resting energy (`bmrOn`: InBody's formula on
`smoothLine`'s lean line within 60 days, else Mifflin–St Jeor); daily energy = resting + the mean Move of the last 28
Watch-worn days (≥ 7, `activityOn`), else × 1.4, within 1.2–2.2 × resting; ごはん's default goals (`contract/goals.ts`
`derived`); BMI category with Asian cut-offs (23 / 25).

### Kiroku

The ベル ledger (`model/bells.ts` bellsLedger, `components/kiroku/*`), read-only in [ごほうび](#wallet): weeks newest
first, each person's ベル beside their four fruits; a day shows each goal, +1 and がんばり.

### Kenkou

健康 (`model/health.ts`, `components/health/*`, own chunk): one person's Health data over time. Whose (shared with
ごはん) · 健康 | ごはん · ✕; 活動 · 体 (the guest: 活動 only); 1週 · 1か月 · 3か月 · 1年. Cards `CARDS` (`BarCard`: solid on
goal days; `BodyCard`: dots and trend line `dotLine`, toggled by 傾向線を表示; muscle estimated, 基礎代謝量 = 370 + 21.6 ×
除脂肪体重).

- <a id="pace"></a>**ペース** (`model/pace.ts`, [why](decisions.md#weight-pace-a-forecast-on-request)): 体's first card:
  verdict, ETA month, progress on `smoothLine`, weekly rate, streak; its 計算 counts a day's Move only with ≥ 60 min
  Stand (`dayMove`).
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit` over `contract/goals.ts` GOALS): a card's chip opens a
  tray; only one's own; activity goals apply from today; the ベル keep 60 / 120 ([Goals](#goals)).
- <a id="goal-directions"></a>**Goal directions** (GOALS `dir`, [why](decisions.md#goal-directions)): at least (steps,
  Move, Exercise, Stand, lean, muscle, protein, fibre), at most (body fat, fat, salt), near (weight ±1.5 %, BMI ±4 %,
  kcal ±10 %, carbs ±15 %).
- **Rules:** no record, no row; today is drawn, not counted; **a day without the Watch**
  ([decisions](decisions.md#no-watch-days)) has no Move/Exercise/Stand; steps stay.

### Gohan

ごはん (`model/food.ts`, `components/food/*`; data [food-data.md](food-data.md)): a typed meal log, never ベル; all see
all, the owner edits. A day renders from its entries' snapshots
([decisions](decisions.md#recalculation-future-automatic-past-by-hand)); food data loads in a worker at first search
or idle.

- **記録 · グラフ:** kcal against the goal (coral past 20 % over), P · F · C · 塩分, every nutrient, PFC balance against
  食事摂取基準 2025; meals 朝 · 昼 · 夜 · おやつ. My own past day with 2+ main meals under my resting energy (`profile.ts
  lowKcal`) gets a gentle note asking about drinks, snacks and oil; it still counts.
- **Goals:** kcal, protein, fat, carbs, salt, fibre; defaults from [Profile](#profile)
  ([fibre](decisions.md#fibre-no-alcohol); [low kcal warns](decisions.md#low-kcal-goals-warn-allow)).
- **Search** (`FoodSearch`; ranking `food/search.ts`, golden queries `food/load.test.ts`): recent, best matches, 近いもの;
  empty, さいきん lists this meal's items at their amount first (`foodUi.ts recentOf`); chain menus
  ([food-data.md](food-data.md#kalori)) rank under generic foods unless the shop is named. **Barcode** (`FoodScan`;
  [food-data.md](food-data.md#barcodes)): not found → この商品を登録. **Amount** (`FoodAmount`, `FoodPortion`): past 15 g
  salt, 2,500 kcal or 200 g of a seasoning mix shows 「量を確認」 (`food/portionCheck.ts amountCheck`), never blocking; a
  name stating its weight also takes grams (`food/nutrition.ts servingGrams`). **Forgotten items** (`food/quick.ts`):
  on my own day's meals with entries, chips (drink, oil, alcohol, snack, kinds logged there before) add my most-logged item of the kind (90 days),
  undone by the snackbar. **いつもの:** a meal on set weekdays, changes from tomorrow. **My recipes and foods:**
  everyone's; the maker deletes.

### Sheets and harvest

One sheet skin, `ui/Sheet.svelte` (a `<dialog>`). **Harvest** (`sheets/HarvestOverlay.svelte`): Sunday 19:30 until
both tap, the week's recap. **Pair** (`routes/pair`): paste the key or open a `#key=` link in the installed app.

### Navigation

One rule app-wide (`ui/nav.test.ts`).

- **The title bar** (`ui/NavBar`, 48px): ✕ top-right closes the whole sheet; ‹ top-left only on a level; backdrop and
  Esc close. One button, `ui/NavButton` (`.disc`, 32 in 44; `.pill` over a photo or map); no words but the title.
- **A half-filled form asks first** (`ui/discard.svelte.ts`).
- **Forms and confirms:** a form is ✕ + one footer action; an inline edit キャンセル + its action. A confirm answers
  with the verb, never はい / いいえ (`ActionSheet` or `Sheet confirm`); an undoable delete acts at once with 取り消す.
- Full-height sheets open at once; a form sheet or level slides 240 ms.

### Unified kit

<a id="sizes"></a>**Sizes:** `:is(dialog, .sheet-copy)` in theme.css: title bar 48, controls 32–36px in a 44px hit,
rows 44–52; the world (HUD, menu, rooms, dialogue) keeps the game's sizes.

- **Type:** `--font-ui` 700 (Zen Maru Gothic), `--font-num` 600 (Fredoka), `--font-body`; 18 · 15 · 13 · 11.
- **Components** (ui/, on `/dev/kit`): `Sheet`, `NavBar`, `NavButton`, `TabBar`, `Chip`/`ChipRow`, `Segmented`,
  `Tick`, `StatStrip`, `PhotoBand`, `ProgressBar`, `ActionSheet`, `LoadError`. **Controls:** `Segmented` one of ≤ 6,
  `.chip` many, `.prow` + `.sw` on/off, `.btn` a verb; selected = yuzu.
- **Icons:** `ui/Icon` only (24 grid, 2px stroke, `currentColor`); no emoji in chrome; NH art only where named.

## Economy

Rule `scoring/bells.ts`, on read `model/bells.ts`, values `config/rules.ts` (`RULES`, `STRETCH`), `contract/rules.ts`
(`SHOP`, `PRICE_HALVED_MS`); pinned by their tests and golden fixtures. Earnings are recomputed from rows.

### Goals

Per person per Tokyo day, all or nothing: **+1 ベル per goal met** (`RING_FRUITS` order).

| Fruit | Metric (Shortcut → stored) | Goal |
|---|---|---|
| 🍐 Move | `calories` → `move_kcal` | `pref` moveGoal |
| 🍑 Exercise | `exercise_minutes` → `exercise_min` | 60 min |
| 🍒 Stand | `stand_minutes` → `stand_min` | 120 min |
| 🍎 Steps | max of `steps`, `steps_watch` | `pref` stepsGoal |

A day's Move and steps goals are the last set on or before it. **がんばり:** +1 per goal at 1.5× (`STRETCH`), ≤ +2 a
person a day. **ふたりでぜんぶ:** +2 shared when both meet all four. A day pays the pair 0–14 (`scoring/bells.test.ts`).

### Rewards

`SHOP`: **おやつ 20 ベル**, **外食 35 ベル**. `spend {spendId, item, bells, day?}`: `bells` = `shopPrice` at the record's
clock (doubled before `PRICE_HALVED_MS`), `day` ≤ 14 days back (`spendOf`); anyone voids (`spend_void`).

### Harvest and lock

<a id="the-first-week"></a>**The first week** (`firstWeek`): the first with an activity row stamped by that week's
lock. **Sunday 19:30 JST** the recap; **Wednesday 04:00 JST** the week's earnings lock (internal).

### Wallet and buys

`walletAt`: own ベル plus half of ふたりでぜんぶ; buys and voids replay by `at`; a buy counts only if covered, so no
balance goes negative. Buys never lock.

## Weight

`model/weight.ts`: a day's latest row, never earns; dots raw, the line a local linear fit over ±21 days
(`smoothLine`), also the からだ cards' change (`dotStats`). Body metrics (`State.body`: body fat 2–70 %, BMI 10–60, lean
10–150 kg) alike; goals `goalBodyFat`, `goalBmi`, `goalLean`.

## Island scene

`components/island/*`, `world3d/*` (rules `lib/world/`). Day-only things load when due
(`ui-state/lazyComponent.svelte.ts`). The DOM animates only `transform`/`opacity`; `data-paused` (hidden),
`data-covered` (a sheet pauses life), `data-sheet` (full-height sheet: nothing drawn). Nothing on the island pays ベル.
Dev URL params: [ops/testing.md](ops/testing.md#url-params).

### World

`world3d/engine.ts`, mounted by `island/IslandScene.svelte`; layout coordinates ([island-layout.md](island-layout.md)),
an 80u villager. **No WebGL:** a line (`[data-no3d]`), the rest works. **In 3D**: no island DOM; things from
`world3d/things3.ts`.

- **The camera** (`world3d/islandCam.ts`; `camera.svelte.ts` `World`, `world.at(…)`): zoom 1 to 3.2, out to the land's
  width (`zoomOutOf`), springing back only past the ends; x centred; one finger scrolls (no snap, no automatic move); it
  backs off with the land's height under the view (`liftProfile`); scroll ends per zoom (`fitZoomEnds`).
- **Layout** (`layout/default.json`, `npm run layout`): home A left, B right. **The sea's wash**: `layout/swash.ts`.
- **Decor** (`world/fixedDecor.ts`): obstacles answering a tap in place, life in `island/ambient.ts`. **Sitting**
  (`island/sitting.ts`): a seat tap walks to the nearest free seat.
- **Lights** (`world3d/lights.ts`): models' own lights at dusk and night; snowy models in winter.

### Startup

[ops/perf.md](ops/perf.md). The 3D import starts while the week loads (`ui-state/boot.ts`); ground fields from a
worker or cache (`layout/fieldsPrime.ts`). **A failed load retries** (`ui-state/retry.ts`); **a failed chunk reloads**
into a newer build once a session (`ui-state/reload.ts`). Cache rules `scripts/headers.ts`.

### Frame rate

≤ **30** fps (`store/frameRate.ts` FPS) while anything moves, nothing when still; one pacer (`world3d/pace.ts`).
**At rest** **12** fps (engine.ts REST_FPS), the museum 15; critters drop to 12 after 15 s (CRIT_CALM_MS). One renderer
(`world3d/stage.ts`), models cached page-wide (`world3d/modelCache.ts`).

### Buildings

`world/buildings.ts`, `island/doorOut.ts`: campsite, homes, [museum](#the-museum), [shop](#the-shop). A tap walks in;
‹ しまへ comes out at the door facing out on every phone (`layout/nav.ts` exitOf).

### Environment

Seasons (`ui-state/season.ts`): winter Dec 11 – Feb 24, spring to May 31, summer to Sep 15, autumn to Dec 10. Sky by
Tokyo time: dawn 05, day 07, dusk 16, night 19 (never black).

### Particles and events

≤ 3 particles; petals and leaves float (`floats3d.ts`); `eventsAt`: cherry blossom Apr 1–10, maple Nov 16–25, Toy Day
Dec 24.

### Weather

`world/weather.ts`, relay `src/weather.ts`: Tokyo's real hourly weather ([backend](backend.md#the-real-weather)) or the
seeded day, same on every phone. **The switch** (設定 → 季節 → 天気): 自動 / ゲーム island-wide; 晴れ / 雨 / 雪 force the look
only; `?weather=`. Winter rain is snow; event nights stay fine; rain critters and shooting stars follow it.

### Trees

`island/FruitTree.svelte`, `world/fruitDay.ts`: one per person, four fruits filling toward the goals; a met fruit falls
and the owner's tap (within 22u) picks it up for 60 かいがら (`contract/pocket.ts GOAL_GOODS`, `fr:<person>:<fruit>`;
`pickMaySend`); all four, a gold one, 150. Other taps open the popup: goals (`world/progress.ts goalMark`),
[daily checks](#daily-checks), meals (`world/mealChecks.ts`).

### Daily checks

`model/checks.ts`: 顔, HIIT, Core, ticked by the owner, never from Health; 0 ベル.

### Shaking a tree

`island/treeShake.ts`: three quick taps shake any tree but bamboo: nests, bugs, branches, coconuts, never fruit;
presents `island/treeGifts.ts`; shared. Wasps chase the shaker ([Event music](#event-music)).

### Scene interactions

`island/sceneTaps.ts`: everything answers a tap softly, ≤ 4 flourishes; water casts ([Critters](#critters)), flowers
are watered ([Island care](#island-care)), empty ground walks ([Walking](#walking)). **Tap targets**
(`world3d/pick3d.ts`, `island/hitbox.ts`, `SceneTaps`): a thing's visible body, ≥ 44px, front wins; overlays own their
taps; nothing on a building's footprint (`layout/clear.ts`); WebKit never retargets (`ui-state/exactTaps.ts`).

### Balloon

`world/balloonFlight.ts`, `island/balloon.svelte.ts`: by day every 45–90 s; the present lands clear of controls
(`world/presentLanding.ts`); contents by NH's rates (`island/catalog.ts`, `npm run catalog:build`).

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/villagerSync.ts`; [backend](backend.md#shared-world). Catches,
pick-ups and drops on all phones, villagers and fishing in step; first claim wins; a partner's act within 12 s plays
here, older ones only change the island.

### Sleep

`ui-state/presence.ts` ([decisions](decisions.md#sleep-by-presence)): awake while its person's app is open (`GRACE_MS`
45 s), else asleep where it stands; a tap wakes it for `WAKE_MS` (a minute).

### The guest

`contract/guest.ts`, `ui-state/cast.ts` ([backend](backend.md#the-guest), [decisions](decisions.md#the-guest)): ゲスト,
its own key ([runbook](ops/runbook.md#10-pair-a-phone)); tests `?demo&as=G`. A member's app and island life, except: 健康
is 活動 only (no body data in its snapshot); ボット read-only; its wallet earns nothing (no Health data), so its ベル
reads 0; its harvest tap is its own recap seen. "The partner" cases: `ui-state/cast.ts` islandActors.

### The island's layout

`layout/`, `store/layout.svelte.ts`: [island-layout.md](island-layout.md); edited in /editor only.

### Decorating

`layoutEdit/IslandEdit.svelte`, `island/decor.svelte.ts`, `world/decor.ts`: anyone places NH's outdoor furniture, in
/editor only ([island-layout.md](island-layout.md#phone-editing)); ≤ 1,500 objects (LAYOUT_MAX). **The gym** (ジム), in
rooms and on the island: a tap uses a piece in a loop (`world3d/benchBar.ts`, `tent/uses.ts`, `tent/rideFx.ts`);
**Stood at** pieces (`standFx.ts`) sync as seats.

### The bulletin board

[board.md](board.md).

### The tent

`tent/`, `store/tent.svelte.ts`, `contract/tent.ts`; homes are the same system; one place at a time
(`store/where.svelte.ts`). `ROOM_SIZES`, ≤ 120 pieces (`TENT_MAX`); camera `rooms/pan.ts` or [First
person](#first-person); arches pass between posts (`scripts/room-pass.ts`); **stereos** (`tent/stereo.ts`) on the
room's [stage](#shared-music). **Table tops:** one small thing a tile, carried with the table. **Whose room:** anyone
arranges any room; a home's look stays its owner's; tray `tent/shelf.ts`. Undo `tent/steps.ts`;
**Saved arrangements** `contract/roomSave.ts` (three a room); seats `tent/seats.ts`; models
[world3d-assets.md](world3d-assets.md#room-packs).

### Critters

`world/critters.ts`, `island/critterPath.ts`: NH species on the Tokyo clock, seeded ([backend](backend.md) "Ambient
life"); catches shared by id; seasons 3× in NH's months, hours hold. **Fishing** (`world/fishing.ts`): a tap on water
casts, any tap but a door reels. **Bugs:** a tap nets. **How the bugs move** (bugPath): NH's paces. Diving `world/sea.ts`; plates
`island/CatchStack.svelte`.

### Beach finds

`island/finds.svelte.ts`, `world/beach.ts`: shells, four dig spots (`DIGS_A_DAY`), mushrooms, bottles, star fragments;
seeded, shared; first finds go in the ずかん.

### Island care

`island/care.svelte.ts`, `world/care.ts`: weeds, watering, the rock; fields [farming.md](farming.md). A flower watered
yesterday by anyone is 1 in 4 a hybrid today (`hybridFor`, seeded), the same on every phone, greeted once per phone.

### Pond

`world/pondFish.ts`: fresh-water fish by where you cast; rare river fish (weight ≤ 0.4) stray into the pond at half
odds in their months and hours (about 1–7 % of shadows).

### Zukan

`kiroku/Zukan.svelte`, `kiroku/zukan.ts`, `model/finds.ts`: from 設定; a row per kind, shared first finds, each
person's tally ([backend](backend.md#tally)).

### The museum

`museum/` ([island-layout.md](island-layout.md#the-islands-buildings)): rooms in `plan.ts`, one drawn at a time
(engine.ts showRoom), a doorway changes the music ([Place music](#place-music)); baked light (`bake.ts`); visitors
`visitors.ts`; NEW tags `newTags.ts`; [First person](#first-person).

### First person

`rooms/firstPerson.ts`, `rooms/gesture.ts`: the eye button in rooms and the museum (`island.fpv`, `?fpv=1|0`); a drag
turns the head, a walk never does; a pinch is the lens (`rooms/lens.svelte.ts`).

### The shop

`shop/`, `contract/shop.ts` (`npm run shop:prices`): タヌキ商店, money かいがら, never ベル
([decisions](decisions.md#the-shops-かいがら)); everyone has a pocket. `shop/Counter.svelte`; 24 pieces a day each.
Prices NH ÷ 20 (a sell ≥ 3), catches and beach finds sell × 10, ≤ 10,000.

### Dialogue

`world/pager.ts`, `island/Talk.svelte`: NH's box, 33 ms a glyph, two lines a page, auto-turn after 6 s; placement
`island/placement.ts` `placeBy`.

### Villager taps

Mine: a squish. **Phrases** (`island/SayPicker.svelte`): ≤ 20 characters, 4 s on every phone. The partner's: a ハイタッチ
on both (`world/highFives.ts`).

### Players

`components/player3d/`, `components/person3d/person3d.ts`: [players.md](players.md).

### Visitors

`island/visitor.svelte.ts`, `world/visitors.ts`: at most one (K.K. aside), seeded by date (every phone agrees).
Priority (`visitorAt`): an event's host, the wedding couple, Celeste, Pavé, nobody Saturday from 18:00
([K.K.](#kk-on-his-stool)), Daisy Mae (Sunday 05–12), else the day's `ROTATION` visitor (Mon–Sat: weekday visitors and
special characters, each once per 23 weekdays and a week apart across cycles, Wisp never Saturday). Hours
(`hoursOf`): Wisp 20–04, beach ones 06–18, the rest 06–22. All at the visitors' spot
(`plaza`, else `stageOf`); Gulliver, Gullivarrr and Wendell on the beach (`washedUp`). `?visitor=<id>|none`.

### Visitors: roles

`world/visitorRoles.ts` (`ROLES`): shops (Gracie, Wardell: `VisitorShop.svelte`), gifts (Pete, Leilani, Lottie),
Katrina's fortune, Wendell's fish, cheers (Chip, Nat), chat; plaza and chat/cheer characters ask おねがい
([farming.md](farming.md)).

### K.K. on his stool

`island/kk.svelte.ts`, `island/kkSlider.ts`: a fixed layout piece; `kkMode` (`?kk=show|day|asleep`): show Saturday
18:00–24:00, strumming by day, asleep 00–06; a tap offers a song on the island's [shared stage](#shared-music).

### Visitors: life

`island/visitorLife.ts`: the director's fourth actor; Gulliver wakes on the fifth tap.

### Halloween

`world/events.ts`, `island/Halloween.svelte`: Oct 31, pumpkins all day, lit 17:00–24:00 with Jack.

### Holiday hosts

`world/events.ts`, `world/visitors.ts` (`HOSTS`), `world/eggs.ts`: Franklin (Turkey Day), Jingle (Toy Day), Zipper
(Bunny Day week: eggs from balloons, digs and the line).

### Birthdays

`world/birthday.ts`, `island/Birthday.svelte`, `island/cake.svelte.ts`: from `PEOPLE` in `config/rules.ts` (Feb 29 →
Feb 28); hats and a cake whose tap plays ハッピーバースデー on the [shared stage](#shared-music).

### Wedding countdown

`world/wedding.ts`, `island/Wedding.svelte`: the 結婚式 board's date ([wedding.md](wedding.md), `time/holidays.ts`
`weddingDate`); milestones bring Reese and Cyrus, the day fireworks from 19:00.

### Shooting stars

`world/stars.ts`: clear nights 19:00–04:00, a streak in open sky only; a sky tap during one is a wish (`scene-wish`), a
star fragment next morning. <a id="celeste-and-meteor-showers"></a>**Celeste and meteor showers** (`world/meteor.ts`):
about one night in ten, ≤ one a week, a star every 3–8 s.

### Fireworks

`world/fireworks.ts`, `island/Fireworks.svelte`: August Sundays, New Year's, the wedding night, and when both meet
every goal; a sky tap adds one; ≤ 4 bursts.

### Group stretching

`island/stretching.ts`, `island/deck.svelte.ts`: the tape deck plays on a day either met Exercise, or 06–08; a tap plays
ラジオ体操 on the [shared stage](#shared-music) and awake villagers stretch; once a day.

### Trips

旅行 ([travel.md](travel.md)): `travel/TravelSheet.svelte`. <a id="offline-maps"></a>**Offline maps**:
`offline/SaveButton`, `travel/OfflineMaps`.

- **A trip** (`travel/TripView.svelte`; /s `share/TripShare.svelte`): 日程 · 地図 · 準備 · 持ち物.
- **日程** (`travel/Itinerary.svelte`): every day on one page, a boarding pass each (its stub held at the top); a stop:
  arrival, place, one line of how we got there, 「泊」, **未予約** in bold; notes, km, sun, maps only on a tap. Each fact
  once a screen.
- **Now:** one yuzu line on the stop we're heading to, earlier lines soft; the page opens on it. Later days are
  `content-visibility: auto` with a guessed height, never one holding an open line.

### Seasonal look

`ui-state/preview.ts`, `panel/SeasonSection.svelte`: forces the island's look only (`pref seasonLook`).

## Motion

`motion/director.svelte.ts` (one state per actor), `motion/idleLife.svelte.ts` (ambient life's slots); reactions
`REACTIONS`, never on first render.

### Walking

`world/walkGraph.ts`, `island/tapWalk.ts`, `layout/nav.ts`, `island/avatar.ts`.

- **Only empty ground walks:** anything to do acts in place; doors, the board and seats are walked up to. Off-limits
  ground snaps to the nearest reachable point.
- **Position persists**; a gone phone leaves its villager asleep there. **No teleports** on other phones. **The camera
  never moves for a walk.**
- A newly met goal walks the villager to its tree; ふたりでぜんぶ brings both together for a high-five.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`): an `aria-live` mirror. **Banner** (`ui/Toast.svelte`): one at a time, wrapped by
  phrase (`i18n/phrases.ts`); undo and retry as the bottom snackbar over `FLOOR` (`UNDO_MS`). English in Japanese copy
  has `lang="en"`.
- **Buttons:** primary leaf, secondary cream, selected yuzu, disabled sunk; "can't now" = `aria-disabled`.
- **Text:** `--text`, `--text-soft`, `--leaf-text`, `--coral-text`, `--sky-text`; ≥ 13px; 4.5:1
  (`styles/contrast.test.ts`). **Focus:** one `:focus-visible` ring (`ui/modality.ts`).
- **Tokens:** `styles/tokens.css` only (`styles/vars.test.ts`); coral for errors; `--person-a` / `--person-b`
  CVD-checked. **Theme:** light only (`e2e/night.spec.ts`); only the scene follows `data-tod`.

## Copy

Two zones by where a string shows (`i18n/linebreaks.test.ts` WORLD):

- **The world** (island, rooms, HUD, bubbles, world toasts): spaced kana, `word-break: keep-all`, no run over 12.
- **Everything opened from it** (sheets, dialogs, the editor, the board, the shop's list) **and the leaf menu**: kanji
  Japanese, `word-break: normal`. A bubble is keep-all anywhere; a banner takes its act's zone (`undoBanner`).
- **Dots:** 「・」 inside a phrase, 「 · 」 between items. **Register:** English Study and すごろく casual.
- **One spelling a term:** 設定 · 記録 · 目標 · 歩数 · 体重 · 完了 · 削除 · 取り消す · 保存 · 編集 · 決定 · キャンセル · 閉じる ·
  戻る · 元に戻す · もう一度 · 今日 · 変更 · 並び順 · 同期 · オフライン · 住民 · ゲスト · 姿 · 模様替え · 片付ける · 季節 · 天気 · 図鑑 ·
  捕まえた · 作る · 資料 · 詳しく · 並べ替え · すべて; a day `11/4（水）` (when.ts), alone `11月4日（水）`. Game words (ベル,
  かいがら, がんばり, ふたりで全部, いつもの, ごはん, ごほうび) and NH's names stay.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre 480px.
No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; keyboard via
`ui/keyboardInset.svelte.ts` (`--kb`); safe areas only via `--safe-*`, `--ui-top`, `--pad-foot`. Check 393×852,
375×667, 320×568.

## Official art

NH renders only from `static/art/` via `<OfficialArt>` (a missing file never breaks a screen); WebP, never upscaled.
Manifest `lib/art.ts`; `scripts/fetch-assets.ts`, NH icons `scripts/nh-icons.ts`; villagers `lib/villagers/roster.ts`;
Japanese names; one file a picture (`scripts/art-dedupe.ts`, `static-files.test`). **Packed icons**
(`scripts/art-packs.ts`): clothing, recipes, artworks in `static/art/finds/pack/`, cut by `lib/artPack`, evicted by
`artEvict`. **The 3D renders** (`scripts/models.ts`): `world/models.json` (feet and box per model) and the sprites
([world3d-assets.md](world3d-assets.md)).

## Sound

`lib/sound/`. <a id="sound-settings"></a>**Sound settings** (設定 → サウンド): ミュージック, 効果音, 音量 0–10; off at first,
per phone (`island.sound`). Nothing sounds without a visible reason; effects are placeholders (`synth.ts`).

### Hourly music

One track per Tokyo hour (`hourly.ts`) in sunny / rain / snow, 3 s crossfade, gapless; the opening theme first;
low-passed under a sheet.

### Event music

NH's event tracks replace the hour's (`events.ts`). **Cut-ins** (`player.svelte.ts`, per phone): the wasps' chase and
sting, Franklin's jingle. Now Playing and Media Session name the track.

### Place music

A room's own track (`places.ts`): the museum's rooms, the shop; tent and homes none. Priority (`choose.ts pickMusic`):
opening, cut-in, shared stage, room, island.

### Shared music

`sound/stage.svelte.ts`: music someone starts is a **stage** (K.K., stretch, cake; each room's stereo) heard where
audio is on; mechanism [sound-sync.md](sound-sync.md). <a id="kk-slider"></a>**K.K. Slider** (`kk.ts`): live files on
the stool, airchecks on stereos; never the last song twice.

### Ambience

`ambient.ts` by hour, month and weather (waves always; nothing alive in rain or snow); procedural beds
(`ambientSynth.ts`) unless a file `ambient.<id>` exists.

### Cues

`cues.ts CUES` maps moments to sounds; nothing calls `play()` directly; outcomes call `cue()` (`scene-<kind>`). The
day's first open plays a radio jingle (`radio.ts`); a missing file borrows a `like`'s (`ids.ts`); world cues skip
while covered. Dialogue is silent.

### Taps

No text selection or iOS callout (`.selectable` opts in). Every tappable names its sound in `data-sfx`; one listener
(`taps.ts`) plays it (`self`, `none`); `aria-disabled="true"` swallows the click with `boop` (`taps.test.ts`).

### Mix

`mix.ts` LEVELS: music, ambience, effects; 音量 squared (default 0.8); jingles duck music; effects decode at unlock,
`lazy` ones at first play.

### Engine lifecycle

`player.svelte.ts` drives `engine.ts`; rules in `session.ts` (`engine.test.ts`). The chunk loads at launch with a
setting on, else at the first tap. **Unlock:** the first tap creates the context; nothing queues. **Suspend:** idle
effects sleep, hidden pauses, music off releases files. **iOS session:** `ambient`; a video's floor (`videoFocus`)
switches to `playback`.

### Audio files

`static/audio/manifest.json` (`manifest.ts`), `static/audio/kk.json`; `v` is a content hash, so `/audio/*` is immutable
([backend.md](backend.md#service-worker)); never precached. `npm run audio:music -- <dir>` (`scripts/music.ts`);
`sound.test.ts` checks paths, hashes, budgets.
