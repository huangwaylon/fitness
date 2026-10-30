# Island Fund: design

What the app is and how the client is built: the product, the economy, the screens, the island scene, motion, chrome
and tokens. Section letters (§0, §1, §N, §E, §A, §S, §M, §T, §R) match the references in code comments.

Related: the backend contract [sheets-architecture.md](sheets-architecture.md), きろく [history-and-editing.md](history-and-editing.md),
[sound.md](sound.md), [scene-interactions.md](scene-interactions.md), the decisions in [`../decisions/`](../decisions/README.md).

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), both with an iPhone and an
Apple Watch. Their activity, measured automatically, grows fruit and earns **ベル** (play money) into one shared
wallet, which they spend on small treats they agreed on together. Japanese-first, switchable to English per person
(ADR 0007). Both see all data; there are no privacy settings and no notifications (ADR 0016).

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  body weight) to a Google Apps Script web app several times a day; an Arrive automation posts a gym arrival
  (ADR 0015, 0021; [shortcut-health-sync.md](../ops/shortcut-health-sync.md)).
- **Data out:** the PWA (SvelteKit, static on GitHub Pages) fetches the raw rows and computes everything on the phone.

**Architecture.** The Google Sheet is an append-only log (`metrics`, `workouts`, `presence` = gym arrivals,
`events`, `uploads`). `app/gas/` (bundled to `app/apps-script/Code.js`) is the only reader and writer: it validates
shapes and appends, nothing more. The client keeps the rows in IndexedDB, merges incremental `snapshot` replies and
derives every number on read in `app/src/lib/model/` (pure functions over the rows), so a rule change re-prices
history consistently and the sheet stays a dumb log. User actions are `event` rows sent through a persisted queue with
optimistic display. Module map: `contract/` (sheet and API shapes shared with the script) · `config/rules.ts` (the
rules as data) · `scoring/` (the earning rule) · `model/` (state, economy, きろく, weight trend) · `sync/` (storage,
transport, queue, cache) · `store/` (the week store, actions, live and demo backends) · `ui-state/` · `sound/` ·
`components/` and `routes/` (the UI). `deps.test.ts` enforces the import direction.

**IP rule.** Official NH art only from `static/art/` through `<OfficialArt key alt size>`, with a fallback (our vector
or `Silhouette`) so a missing file never breaks a screen (ADR 0018; the repo and site are public for now). On-screen
names follow the Japanese game: しずえ, しまフォン, ベル (`1,234 ベル` / `1,234 Bells`). No Nintendo fonts; sound
effects are our own placeholders; the hourly music is the user's own files ([sound.md](sound.md) §9.2).

**Direction.** It reads as *あつまれ どうぶつの森* at a glance: official renders (villagers, しずえ, trees, fruit,
NookPhone tiles) on a **Pocket Camp–style diorama** painted in SVG/CSS to match them, with NH's 2D UI patterns
(dialogue box, choice list, map ribbon, NookPhone, Nook Miles+ cards) as the chrome. Bright and calm; night is soft
periwinkle, never black.

## 0. Simplicity budget (overrides everything)

- **No tab bar.** Two places, 島 and ごほうび (the wallet), plus the しまフォン for everything else, the harvest overlay
  and sheets.
- **One focal point per screen** (島: today's ベル; ごほうび: the balance) and **one obvious control** in the thumb zone
  (島: the NookPhone).
- **Zero required taps a day** (ADR 0021): the Watch, the Shortcut and the Arrive automation fill the trees. No
  check-ins, no daily questions.
- **One home per datum:** a number is shown in full in one place; anywhere else it is a doorway (the plate, the
  ribbon), never a repeat.
- ≤ 40 Japanese characters of non-numeric text per screen, ≤ 3 cards per screen, ≤ 5 rows per card, one しずえ line
  (≤ 16 characters) and only when she has news. Decoration and motion never add words.
- Do not re-add: check-ins or habits, daily questions, pots or trip bars, Sunday promises, cozy days, a ふたり tab,
  privacy settings, notifications, a sheet grabber.

## 1. Screens

### 1.1 島 Island (`routes/+page.svelte`, `island/Hud.svelte`, `island/IslandScene.svelte`)

```
safe+16           ═══ きょう +620 ベル ═══          today's ベル ribbon (the one focal point)
                    オフライン · タップで つなぐ       sync chip, only when sync is not ok
         sky ── horizon ── sea
         island: hedge · my tree + fruit · jar + plate · partner's tree + fruit · flower beds
         me (left)                                partner (right)
         [しずえ box, just above the phone]           only with news (the harvest)
bottom             (📱)  しまフォン                   the NookPhone: 56px phone on a 68px disc + plate
```

- **Ribbon:** the NH map's yellow title banner, 「きょう +620 ベル」 for both of us, under the notch (`--safe-top` +
  16px). It counts up when ベル arrive. Tap → きろく ベル.
- **Jar + plate:** the wallet's balance as a bare number on a cream plate. New ベル fly in as coins from the fruit that
  earned them. Tap → ごほうび.
- **Trees:** one per person; today's five ring fruit lie on the ground in front (per kind 0–3 items = thirds of the
  daily goal, 🍑 🍐 🍒 🍎 🥥; a kind with nothing yet shows one faint item). Tap the canopy or the fruit row → the popup:
  a nameplate, per fruit today / goal, today's ベル and the week as a small 「2/5」 (days met / needed; a ✓ disc once
  the badge is met). In a v2 week (from 2026-11-02) each ring fruit also shows today's **4 milestone pips** (yuzu =
  reached; none for 🥥), and **one** nudge line sits under the rows, 「あと 8分で +45」, for the tapped fruit or else the
  fruit nearest its next step (`nextAt`, `nextGain`); v1 weeks show neither. The popup always opens **upwards**, tail
  down at its tree; where the sky is short it is pushed down over the canopy (never flipped; tighter rows on short
  screens), staying inside the screen and under the ribbon. The popup is the one home of per-fruit detail; a tap on it
  closes it.
- **Layout:** the island (hedge top 32u to beach foam 356u) is **centred in the visible ocean**, from the horizon to
  the phone's top (`--island-bottom`). The horizon is the island's own (24u above the hedge) unless that makes the sky
  taller than 27% of the screen; then it stops there and the island sits lower in open sea. Its size is the width fit,
  at most what keeps its horizon 12px under the ribbon's lip (`--hud-bottom`). It never runs under the ribbon or the
  phone (≥ 22px to the phone at 320×568, ≈ 44px at 393×852).
- **The NookPhone** is the island's one control (bottom centre, ≥ 56px): the hub for きろく, あそびかた and settings.
- **しずえ** shows only with news (the harvest), in a box floating just above the phone, so nothing in the scene moves.
- **Taps:** the partner → their card; my villager → a hop; a tree → the popup; the jar → ごほうび; the ribbon → きろく
  ベル; the phone → しまフォン; scenery → small flourishes ([scene-interactions.md](scene-interactions.md)). All are real
  buttons with `aria-label`, ≥ 44px (villagers and jar ≥ 64px). Focus / VoiceOver order = the visual order: heading,
  ribbon, scene, phone. An open tree popup takes the taps that land on it (they close it), so nothing drawn under it fires.

### 1.2 ごほうび the wallet (`routes/jar/+page.svelte`, ADR 0022)

Title bar (‹ 島へ, ごほうび), a hero (the jar over 「ふたりのベル」 and the balance), then **one list** of big buy tiles (item
art, name, price: the price of the next buy). An escalating food treat already bought this week shows its base struck
through before the price and a small yuzu pill, 「こんしゅう 2かいめ」 / "2nd this week" (`MenuShelf.svelte`); the confirm
shows the price being paid with the same count. An item the wallet can't cover yet is sunk and says あと N ベル (a tap boops). ✎ edits the list (add /
rename / reprice / remove, shared by both). Under the list, one quiet line: 「食べものは 週3回くらいが めやす。あとは
ためよう！」 (a guide, no cap). 買う！ asks first, then shows at once and waits 5 s with とりけす before it is
sent. No history here (it lives in きろく ベル). The island jar morphs into the hero jar (View Transitions; a crossfade
under reduced motion; `ui-state/jarTransition.ts`).

### 1.3 しまフォン NookPhone (`phone/ShimaPhone.svelte`)

A NookPhone-screen sheet: the title bar and a 3-column grid of squircle tiles (no status row: no clock, no leaf); in
the demo a small yuzu デモ chip sits under the grid. Its ✕ and ‹ sit 18px from the phone's top and side, as on a paper sheet, and
rows fade out under its title bar. Every tile is the same squircle: its fill, the round-13 edge (2px
outline + 4px lip in a darker shade of the fill, drawn by `::after` so the art can't cover it) and the art inside; the
three official full tiles (きろく, 村人, つうしん) sit on their own background colour (`#8B97EB`, `#76D787`,
`#FD5967`) so their baked-in corners vanish. Each app slides in from the right inside the phone.

| App | Tile | What |
|---|---|---|
| きろく | `phone/miles` | からだ (weight trend, 目標: Move goal + weight goal, weeks of badges) and ベル (the passbook); week → day → fix ([history-and-editing.md](history-and-editing.md)). Lazy-loaded |
| あそびかた | `phone/glyph-help` | No taps needed, the five fruits and goals (v2: 「ベルは 4つの だんかいで ふえるよ…」 and per fruit a 4-cell step table, amount over ベル, the goal step ringed), badges, the wallet with the treat guide (「食べものの ごほうびは、ふたりで 週3回くらいが めやす…」, no cap) and the escalation line (「おやつ・カフェ・外ごはんは、おなじ週に 買うたびに ちょっとずつ 高くなるよ（1.5ばい）。月曜日に もとの 値段に もどります！」), a 「たんぱく質の ヒント」 card (1.6 g per kg a day, per person from the goal weight else the trend, rounded to 5 g; not tracked), the setup |
| 村人 | `phone/passport` | My villager from the roster (one search field): 23 special characters first (とくべつ: たぬきち, しずえ, とたけけ…), then 158 villagers by species; and my よびな. If either of us picks しずえ, たぬきち hosts (nameplate, banner icon) |
| ことば | `phone/glyph-chat` | 日本語 / English |
| つうしん | `phone/rescue` | When each of us last synced, いま つうしん |
| サウンド | our note glyph | ミュージック / 効果音 / おしゃべり (all off by default) and 音量 ([sound.md](sound.md) §10) |

### 1.4 Sheets, harvest, pairing

- **One sheet skin** (`ui/Sheet.svelte`, a native `<dialog>`): tan paper with white-cream cards (navy at night),
  radius 32, a lip, a sticky title bar (fading into the content, so ✕ never scrolls away), one CTA in a sticky footer
  lifted above the keyboard.
- **Partner card** (`sheets/PartnerSheet.svelte`): name, face, one line about their day (from their rings), when their
  data last arrived, and ハイタッチ.
- **日曜の収穫** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both tapped. The week's recap (per person the
  five badges and bonus, the ふたりボーナス, the week's bonus as the big number) → 受け取る (a ceremony: the bonus counts
  either way) → coins fall into the jar and the balance counts up. ✕ / Esc = あとで.
- **Pair** (`routes/pair`): `deco/airport` hero, しずえ and one line, paste the key (or open a `#key=` link in the
  installed app).

## N. Navigation

| Where | Top-left | Centre | Top-right |
|---|---|---|---|
| A sheet (partner card, buy, menu editor) | — | title | ✕ |
| The しまフォン home | — | しまフォン | ✕ |
| A phone app, any level inside (きろく week → day → fix) | ‹ (one level up) | the app's title | ✕ (closes the phone) |
| A full page (ごほうび) | ‹ 島へ | title | — |
| The harvest | — | (the steps) | ✕ = あとで |

✕ closes the whole sheet from any level and always sits top-right; ‹ goes up one level and appears only when there is
one. The title bar is sticky (with a fade), so ✕ and ‹ stay in reach while a sheet scrolls. Backdrop tap and Esc also
close a sheet; nothing advertises swipe-down. `ui/NavBar.svelte` + `ui/NavButton.svelte` (44px); `ui/nav.test.ts` fails on a modal without them. Motion: a sheet rises in 240 ms (ease-out), a pushed level
slides in from the right in 240 ms; reduced motion: no slide.

## E. Economy (ADR 0019, 0021, 0022)

Values in `config/rules.ts` (`RULES`, versioned by week), the earning rule in `scoring/bells.ts`, the economy on read in
`model/bells.ts`. Pinned by `scoring/bells.test.ts`, `config/rules.test.ts` and the golden fixtures.

**ベル per person per day**, recomputed from the rows (so they move whenever data arrives), five automatic metrics,
one fruit each. A week is priced by its own rule version (`rulesFor(weekKey)`; the island, the tree popups, あそびかた,
きろく and the harvest read the version of the week in view). The values below are **v2, from Mon 2026-11-02** ("push
exercise + strength" and "v2 milestone curve", ADR 0021 amendments); v1 (the week of 10-26 only) paid 🍑 3/min, 🍒 1/min
to 180 min, 🍐 floor(180 × min(kcal, goal) / goal), 🍎 200 all or nothing, 🥥 400 and +400 a badge:

| Fruit | Metric (Shortcut field → stored metric) | Daily goal | ベル a day |
|---|---|---|---|
| 🍑 peach | Exercise minutes: max(Watch, workouts added in きろく), never a sum (`exercise_minutes` → `exercise_min`) | 60 min | milestones 25 / 70 / 130 / **240** |
| 🍐 pear | Move, active kcal (`calories` → `move_kcal`) | per person, `pref` moveGoal (default ウェイ 600, うめ 400; 100–2,000) | milestones 19 / 53 / 98 / **180** |
| 🍒 cherry | Stand minutes, Health Stand Time (`stand_minutes` → `stand_min`) | 120 min | milestones 13 / 35 / 65 / **120** |
| 🍎 apple | Steps (`steps`) | 8,000 (tsuyu Jun 1–Jul 20: or 30 exercise min, the full 200) | milestones 20 / 60 / 110 / **200** |
| 🥥 coconut | Gym: any gym arrival, or a strength workout (Traditional / Functional Strength Training, Pilates, ≥ 15 min; any other type only when marked in きろく) | a gym day | 500 |

- **Milestones** (v2, `RULES[1].curve`): 🍑🍐🍒🍎 pay at 25 / 50 / 75 / 100% of the day's goal, each step worth more
  than the last and the biggest at the goal; below 25% nothing, above the goal the max. One shared share table, 25 / 70
  / 130 / 240 of the max (≈ 0.104 / 0.292 / 0.542 / 1), rounded to whole ベル; 🍎 pays the user-approved 20 / 60 / 110 /
  200 instead of the shares' 21 / 58 / 108. 🥥 stays one event.

  | % of goal | 25% | 50% | 75% | 100% |
  |---|---|---|---|---|
  | 🍑 Exercise (60 min) | 15 min → 25 | 30 → 70 | 45 → 130 | 60 → 240 |
  | 🍐 Move (own goal, e.g. 600 kcal) | 150 → 19 | 300 → 53 | 450 → 98 | 600 → 180 |
  | 🍒 Stand (120 min) | 30 min → 13 | 60 → 35 | 90 → 65 | 120 → 120 |
  | 🍎 Steps (8,000) | 2,000 → 20 | 4,000 → 60 | 6,000 → 110 | 8,000 → 200 |

  The view exposes today's step and the next one per fruit (`RingProgress.milestone`, `nextAt`, `nextBells`,
  `nextGain`: `docs/reviews/round-19/milestones-contract.md`).
- Max 1,240 a day (v1: 1,140). The Move goal in force on a day is the last one set on or before that Tokyo date: a change never
  re-prices earlier days.
- **Weekly bonus** at the Sunday 19:30 harvest: +340 per badge (v1: +400; 🍑 / 🍐 / 🍒 goal met (100%) on ≥ 5 days, 🍎 ≥ 4, 🥥 ≥ 3) and
  the ふたりボーナス, +200 for each badge both people met.
- **On target** (every badge for both, minimum days), v2: per person 5 × 240 🍑 + 5 × 180 🍐 + 5 × 120 🍒 + 4 × 200 🍎 +
  3 × 500 🥥 = 5,000 daily + 5 × 340 badges = 6,700; both (13,400) + 5 × 200 duo = **14,400 ベル a week**, the same as
  v1 (4,700 daily + 2,000 badges), so the menu prices still fit. Goal days pay the max on the curve too, so the
  milestones change only partial days. The badge amount absorbed the extra 300 daily: 2 × 5 ×
  b + 5 × 200 = 14,400 − 10,000 gives b = 340 with the duo unchanged. Per-person shares: 🥥 1,840 (27%), 🍑 1,540
  (23%), 🍐 1,240, 🍎 1,140, 🍒 940. The daily part is 69% of the week (v1 65%), so a week short of badges still pays most of
  its work.
- **One shared wallet:** every ベル earned (daily as it happens, the bonus at Sunday 19:30) goes into it. One shared,
  editable menu, one list (`pref` menu, latest wins, items `{id, label, bells}`). Either person buys
  (`spend`), the buyer can undo (`spend_void`), no approvals. Buys replay in server order and a buy counts only if the
  wallet covered it at its time, so the balance never goes negative. Trips themselves are paid outside the game.
- **Escalating food treats** (ADR 0022 amendment; `ESCALATING_ITEMS`, `ESCALATION` in `rules.ts`, `treatPrice` in
  `model/bells.ts`): おやつ, カフェ・デザート and 外ごはん (by id: a rename or reprice keeps it) cost base × 1.5^n, n = the
  accepted, not voided buys of that id earlier in the same Tokyo week (Mon 00:00 – Sun 24:00 JST), by either person.
  n ≥ 1 rounds to the nearest 50 ベル, an exact half down, never below the base: おやつ 1,200 → 1,800 → 2,700 → 4,050;
  カフェ 2,500 → 3,750 → 5,600; 外ごはん 6,000 → 9,000 → 13,500. The base is the menu price at the buy's server time.
  The buy sends the current price; on read, an escalating buy whose `bells` isn't its price at its place in server
  order (or that the wallet can't cover) is ignored and doesn't count, so of two phones buying at once the server's
  first wins. A void frees its buy for the buys after it (the price steps back down); earlier buys never change.
  Enforced from 2026-10-31 00:00 JST (`enforceFrom`); earlier buys are accepted at any price but still count. ほしいもの,
  旅のごほうび and added items stay flat. No backend change (the server stores `bells` as before).
- **Default menu** (`DEFAULT_MENU`): おやつ 1,200 · カフェ・デザート 2,500 · 外ごはん 6,000 · ほしいもの 8,000 ·
  旅のごほうび 12,000. On target: 2–3 おやつ (≈ 3,000) + a café date (2,500) + eating out every two weeks (3,000) ≈
  8,500 a week, leaving ≈ 5,900: a ほしいもの every ~1.5 weeks or a 旅のごほうび every ~2.
- **Locks:** a week's earnings change with late syncs and edits until its Wednesday 04:00 lock, then they are fixed at
  the lock. Buys never lock. The economy starts in the week of Mon 2026-10-26.
- **Weight** (ADR 0020) is a trend only, shown in きろく; it never earns (`deps.test.ts` checks the economy never imports
  `model/weight.ts`).
- **View model** (`types.ts`): `WeekView.people[p]` (today's ベル per fruit, ring progress, Move goal), `wallet
  {balance, earned, spent, today, week}`, `menu` (`MenuItemView`: `{id, label, bells}` plus `price` for the next buy,
  `basePrice`, `boughtThisWeek`, `escalates`), `harvest`; きろく reads `model/history.ts` (`historyWeeks`,
  `weekDetail`, `dayDetail`, `bellsLedger`, `editLog`) and `model/weight.ts`.

## A. Official art map

WebP with alpha, already downscaled; never upscale past the manifest height. `size` = rendered height; `alt=""` when
decorative. Helpers and the manifest (bundled at build time): `lib/art.ts`; files fetched by `scripts/fetch-assets.ts`.

| Group | Keys (`static/art/<key>.webp`) | Where |
|---|---|---|
| Villagers | `villagers/<id>`, `villagers/<id>-icon`; roster `lib/villagers/roster.ts` (158; defaults A = goldie, B = anchovy, precached by the service worker; the rest cached on first use) | Scene, avatars, sheets |
| Host | `host/isabelle` (wave), `-stand`, `-winter`, `-icon`, `host/tom-nook` | Dialogue box, toasts, not-set-up |
| Fruit | `fruit/peach · pear · cherry · apple · coconut` | Ground fruit, popups, harvest |
| Trees | `trees/oak-spring` (blossom) · `oak-summer` · `oak-fall` · `oak-winter` | One hardwood per person |
| Bushes | azalea, hydrangea, hibiscus, tea olive (two colours each), camellia (two), holly | Back hedge (§S.3) |
| Flowers | red/yellow tulips, red/white roses, pink cosmos, purple mums, orange pansies | Flower beds (§S.3) |
| Season | `season/petal · maple-leaf · snowflake` | Particles |
| Reactions | NH reaction-wheel icons (`reactions/<id>`) + `pose-viva` | しずえ's bubble, harvest, toasts |
| Money | `money/bells`, `leaf`, `miles` | Amounts, the bonus |
| Phone | `phone/nookphone`, tiles `miles · passport · rescue · nook-shopping`, glyphs `glyph-help · glyph-chat` | NookPhone (§1.3) |
| Deco | `deco/airport`, `deco/present` | Pair hero, balloon present |

Ours (no usable official art): sky, sun, moon, clouds, sea, ground, cliff, the jar, effects, villager marks
(`Mark.svelte`) and the UI sprites (`Sprites.svelte`).

## S. Island scene (`lib/components/island/*`)

### S.1 Structure

`IslandScene` = an elastic sky over a fixed-aspect **stage of 390 × 360 units (u)**, with one NH-blue sea from the
horizon down under the island and behind the bottom chrome. The page gives the scene `--scene-h` (the full height),
`--hud-bottom` (the ribbon's lip) and `--island-bottom` (the phone's top, `--chrome-below` − `--gap`); the island
(32u–356u) is centred between the horizon and `--island-bottom`. The horizon = min(`--island-bottom`'s y − 372u, 27% of
the scene) (≥ 40px), the stage top = (horizon + that y) / 2 − 194u; the stage is sized min(width fit: the sand 5px inside
each edge, the grass 12px inside on tall phones; (that y − `--hud-bottom` − 12px) × 390 / 372; ≤ 560px). No front-beach tuck: nothing of the island sits under the chrome. The HUD
overlays the sky. Back to front: sky (sun/moon, stars, clouds, balloon, fireworks) · sea · ground · hedge · trees + ground fruit · jar + plate · flower beds · villagers · particles · one multiply tint.

**Painting rule.** Light from the upper left. Every surface = one base fill + one gentle gradient + one soft lower
shade + sparse flecks. **No strokes and no lips on scenery** (the lip is a chrome idiom). Contact shadows are soft and
radial in the surface's colour.

### S.2 NH tile scale (`scene.ts`)

- **1 tile = 44u** wide, **1 row = 31u** deep (NH's ≈ 0.7 foreshortening). Columns centred on the jar:
  `col(k) = 195 + 44k`, k = −3…3. Row bases: hedge 80 · trees + jar 173 · bed back 266 · front 297. Depth comes from
  rows and z-order, not shrinking.

| Element | Size | Place |
|---|---|---|
| Villager (the reference) | 80u | cols ±1, front row |
| Hardwood | 120u | cols ±2, tree row |
| Bush | 48u | cols −3…3, hedge row |
| Flower | 32u (pansies 0.8×, mums 0.92×) | cols ±2/±3, bed rows |
| Ground fruit | 24u | half-tile pitch at the trunk |
| Jar | 52 × 65u | col 0, tree row, on a sand plaza |

### S.3 Environment

- **Framing:** a rounded grass plateau (x 44–346u, y 50–316u) inside a sand crescent, sea on both sides at every
  width; horizon at stage y 8u.
- **Sky** (`Sky.svelte`): a 3-stop gradient; day #4AA3F6 / #79C9FC / #C6EEFF, dawn 05–07 #7FA8E8 / #F6C3B4 / #FFE6CC,
  dusk 16–19 #5B6FC4 / #F59A86 / #FFD39A, night 19–05 #1F2C66 / #34478F / #5A6CB4; day-only season shifts (summer
  top #2F92F0, autumn horizon #E8F2EE, winter #8EC2EE / #BFE0F8 / #EEF7FF). `season.test.ts` checks the table against
  `tokens.css`. Sun or crescent moon upper left; 10 stars at night; two drifting clouds (`Clouds.svelte`).
- **Sea** (`Sea.svelte`): haze #8EDDF5 → #4C9DE8 → open #3D8FE2 with sparse drifting glints (the one sea animation).
- **Ground** (`Ground.svelte`): shallow ring, foam lines, wet band, sand (#F4D184), terracotta cliff, grass. Grass by
  season: spring #7CC95A (Feb 25–May 31), summer #5DBE4A (Jun 1–Sep 15), autumn #A8C457 (Sep 16–Dec 10), winter snow
  #F5F8FF (Dec 11–Feb 24), with seeded leaf flecks.
- **Hedge** (`BackRow.svelte`): one species per month, two colours, one bush per tile (Apr–May azalea, Jun hydrangea,
  Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly, Jan–Mar camellia); snow on top in winter.
- **Flower beds** (`FlowerBeds.svelte`): two 2 × 2 beds mirrored about the jar, flowers by season.
- **Trees and fruit** (`FruitTree.svelte`): one seasonal oak per person (blossom Apr 1–10, fall leaves Oct 16–Dec 10,
  snow in winter). A newly earned fruit item shakes the tree (±4°, 500 ms) and drops in with a bounce. Under 360px wide:
  one item per kind, sized by its count.
- **Jar** (`Jar.svelte`, shared with the wallet's hero): glass with a streak and shade, a coin stack, a yuzu lid.
- **Time of day = one multiply tint** over land and sea (dawn #FFE6DA, dusk #FFD7B8, night #9AA4DE).

### S.4 Particles and events

≤ 3 particles (official art): petals while the blossoms are out, maple leaves in autumn, snow in winter, our fireflies
on summer nights. Japan-date events (`eventsAt`): cherry blossom Apr 1–10, maple week Nov 16–25, fireworks on August
Sundays after 19:00 and New Year's Eve, Toy Day presents Dec 24, and the balloon present.

### S.5 Performance

Animate only `transform` and `opacity`; CSS keyframes; JS schedules idle life and events, no rAF loop. Everything
pauses while the tab is hidden (`data-paused`); a sheet also pauses particles and idle life (`data-covered`). Target:
60 fps on an iPhone SE 2.

## M. Motion and expression

### M.1 Rig (`Villager.svelte`, `Host.svelte`)

`.actor` (position) › `.face` (`scaleX` = facing) › `.body` (origin at the feet; idle loop or one motion) ›
`<OfficialArt>`. The emote and fx are siblings of `.face`, so they never squash or mirror. Squash and stretch stay
≤ 14%; every motion starts and ends at `transform: none`. The director (`motion/director.svelte.ts`) holds one state per
actor (mine, partner, しずえ).

### M.2 Motion primitives (`tokens.css`, prefix `if-`)

`squish` 220 · `hop` 600 · `hop2` 900 · `wiggle` 700 · `turn` 1400 · `nod` 520 · `laugh` 620 · `surprise` 420 · `shy`
1000 · `stretch` 1400 · `proud` 900 · `dance` 1600 · `shake` 480 (trees) · `bow` 1100 (しずえ) · `headshake` 600 · `hum`
2400 · `talk`, `bob`, `breath-slow` (loops). Durations live in `MOTION_MS` (`motion/reactions.ts`) and must match the
keyframes. Strolls walk ≤ 40u toward the jar and back.

### M.3 Emotes and marks

Villagers never show the player's cat-face reaction icons: they get our floating marks (`Mark.svelte`: ♪ ! ? 💦 ♥ ✦ zz)
or the official colour glyphs, with no bubble. しずえ gets the cream bubble (`Emote.svelte`) with the official icons.
Pop 360 ms, hold, out 200 ms; one per actor.

### M.4 Effects (`Fx.svelte`, ours)

sparkles 700 ms · hearts 1200 · notes 1100 · sweat 900 · zzz (loops while asleep) · confetti 1600 · puff 500 · glint
600. `pointer-events: none`, `aria-hidden`, removed on end.

### M.5 Reactions (`REACTIONS` in `motion/reactions.ts`)

Events preempt idle life. Triggered now: R1 first open of the day · R3 the partner's day grew · R4 / R5 high-five sent /
received · R6 a fruit's daily goal met · R7 a fruit grew a stage · R8 all five goals met · R9 / R10 tap mine / partner · R11
morning stretch (05–09) · R12 evening nudge (18–22, my day under half) · R13 fall asleep (22–05) · R14 woken up · R15
low week (Thu–Sat under 1,000 ベル; thoughtful, never sad) · R16 dance together (idle) · R17 sync problem · R18 jar
tapped · R19 harvest. R2 (cheer) is only in the dev gallery. Diff reactions come from comparing the previous and next
`view` and never fire on first render. Pages call `emit('highfive-sent' | 'sync-error' | …)` (`motion/bus.svelte.ts`).

### M.6 しずえ

Aloha shirt outside winter, the cardigan (`-winter`) in snow season. Poses: wave, stand, bow. She talks while her line
types, hops for greetings, bows for the harvest, head-shakes for errors, breathes slowly at night. Pose swaps crossfade
over 160 ms after `img.decode()`.

### M.7 Idle life (`motion/idleLife.svelte.ts`)

One scheduler per live scene: every **9–15 s** one actor does one small thing (look, wiggle, hop, stroll, peek into the
jar, tree shake, chat, dance together, morning stretch); しずえ at most every 20–30 s. **No emotes or fx in idle life**
(those mark events). Evening: only the quiet ones; asleep (22–05): the villagers doze. After 3 min without input the
gap is 25–40 s; after 10 min it stops until the next touch. Paused while hidden, covered or under reduced motion.
Budget ≤ 10 running animations.

### M.8 Reduced motion

Loops, hops, walks and dances off; emotes fade in and hold; fx collapse to one static icon; pose swaps are instant; the
jar transition is a crossfade; dialogue text appears at once. Season and time of day still show.

## T. Chrome (NH 2D UI)

- **Dialogue box** (`ui/Bubble.svelte`): wobbly cream box, a tilted yuzu nameplate, letter reveal at 33 ms/char (tap to
  finish), amber ▼ only when another page follows; `--talk-lines` lines (2; 1 compact); text mirrored in an
  `aria-live` node.
- **Choice list** (`ui/ChoiceList.svelte`): white-cream pills with the brown edge, the yuzu ▶ cursor, ↑/↓ and hover
  move it.
- **Banner** (`ui/Toast.svelte`): NookPhone-style, at the top under the safe area (the とりけす undo banner at the
  bottom), in the top layer; a 36px icon, one line, a reaction icon or one action (とりけす). Tap or swipe up to dismiss; one at a time.
- **Rows with an edged object** (✎, とりけす) are `--row-obj` tall (44 + the 4px lip + 6): 3px clear above the button
  and under its lip; `.pen-btn` lifts by half its lip so button + lip sit centred.
- **Buttons:** four tiers, ink text (≥ 5.6:1), radius 16, a squash on press. Every tappable thing has an **edge** (2px
  outline + 4px lip in one colour, ≥ 3:1 on the panel); static cards only the soft lip, so "brown edge = tappable".
  Primary = leaf; secondary = white-cream `--ctl`; selected = yuzu `--ctl-sel`; disabled = sunk `--ctl-off`, no edge.
  A control that can't act now uses `aria-disabled` (it boops: [sound.md](sound.md) §13). Shared objects in
  `theme.css`: `.pen-btn` (every ✎: an edged cream game object, `--sh-obj`) and `.add-btn` (＋ add a row: leaf-tinted,
  leaf edge).
- **Focus:** `ui/modality.ts` keeps `<html data-input="pointer|keyboard">`; after a pointer input `:focus-visible` draws
  no ring (text fields excepted), so a tap → ‹ back leaves no stray outline. Focus restore for keyboard and VoiceOver
  (‹ back, きろく edits, sheets) is unchanged, and Tab brings the ring back.
- **Fonts:** Zen Maru Gothic (UI, 500/700, subset in `fonts.css`, `npm run fonts:subset`) + Fredoka (numbers, 600/700).
- **Japanese line breaks:** `word-break: keep-all` on `html[lang=ja] body`: a line breaks only at the copy's spaces
  (分かち書き) or after 、。！, never inside a word, the same on iPhone Safari and in Chrome (no `auto-phrase`, which
  WebKit ignores). Long copy keeps its spaces.
- **Stacking:** one `--z-*` scale in `tokens.css`: the stage < the HUD (ribbon, sync chip) < the dock (しまフォン,
  しずえ's box); inside the stage trees < canopy taps < ground fruit < the fruit-row tap < villagers (mine in front) <
  the time-of-day tint < the jar + plate < scenery flourishes < coins < "+N" < the tree popup. Modal `<dialog>`s (sheets,
  the phone, the harvest) are in the top layer; the banner is a popover above an open sheet, and a sheet's footer rises
  above the undo banner while it shows.

### Tokens (`styles/tokens.css`)

- **Palette:** ink `#4A3A2C` / `#6B5544` · cream `#FFF9E3` · paper `#F5E4BC` · card `#FFFCF2` · lip `#E0C48A` · edge
  `#937047` · leaf `#6ED07A` / `#4FB35C` / edge `#2F8A3F` · yuzu `#FFD84D` / `#E6B22E` · mint `#7BD7C1` / `#63B4B5` ·
  coral `#FF8F7A` (errors only). Components use semantic tokens (`--bg --surface --card --lip --text --text-soft --hud
  --focus --scrim --hl`); `--hl` is the highlight (yuzu 30% by day, cream 14% at night, since yuzu over navy turns
  grey), used by the day's ベル strip, pressed rows and the help chips; scene colours live in the `.if-scene` block,
  `--fx-*`, `--jar-*`.
- **Surfaces:** the panel (`--bg`: tan by day, `#3A4886` at night) is a step darker than its cards (`--card`). Controls
  `--ctl`, `--ctl-sel`, `--ctl-off`, `--edge`, with `--sh-ctl`; fixed-cream game objects (sheet close, keypad, back
  pill, choices) use `--sh-obj` (always brown). Themed text is `var(--text)`, never `--c-ink`.
- **Type:** 12 · 15 body · 18 talk/button · 24 title/ribbon · 44 hero. **Radius:** 8 chips · 16 buttons · 24
  cards/dialogue · 32 sheets/phone · 30% tiles. **Motion:** `--dur-tap` 90 · `quick` 140 · `base` 260 · `pop` 360 ·
  `slow` 600 · `emote` 2200 (reduced motion: 0 / 120 ms).

### T.7 Time of day sets the theme

`data-tod` on `<html>` comes **only from the Tokyo clock** (dawn 05–07, day 07–16, dusk 16–19, night 19–05;
`ui-state/season.ts`); `prefers-color-scheme` is ignored. Previews: `?theme=night|day`, `?season=`, `?date=` (in
the demo `?date=` moves the demo's calendar too: the demo backend runs on the scene clock, `Backend.now()`, so
`?demo&date=2026-11-03T12:10` previews a v2 week).

| tod | Chrome | Lip | HUD text | `theme-color` |
|---|---|---|---|---|
| dawn, day | paper `#F5E4BC`, cards `#FFFCF2`, edge `#937047` | `#E0C48A` | `#33261B` | sky top |
| dusk | `#F6DFC0`, cards `#FFFCF2`, edge `#937047` | `#E8B98A` | white | sky top |
| night | `#3A4886`, cards `#4858A0` / `#FFF6E0`, edge `#B9C3F0` | `#2E3A72` | `#FFF6E0` | `#3A4886` |

The ribbon, plate, dialogue box and choices are game objects and stay cream/yellow at every time of day.

## R. Small screens

- **Breakpoints:** compact = `(max-height: 700px) or (max-width: 359px)`; tiny = `(max-width: 339px)`. Portrait only;
  wider screens centre a `--col: 480px` column with the sky full-bleed.
- **Global:** side padding 18, `100dvh`, no horizontal scroll at 320, text ≥ 11px, inputs ≥ 16px (no iOS zoom;
  `inputs.test.ts`), targets ≥ 44px and 8px apart, `overscroll-behavior: none`; sheets scroll internally. The keyboard
  inset `--kb` comes from `visualViewport`.
- **島:** the phone has one fixed slot, `--phone-h` 92px (`--chrome-below` = `--phone-h` + 2 × `--gap` +
  `--pad-bottom`); the scene keeps its full height, the chrome sits on the sea, and the island is centred in the
  visible ocean, the horizon down to the phone's top (`--island-bottom`), its horizon kept under the ribbon's lip
  (`--hud-bottom`), at the width fit, so short screens scale it down (§S.1). At 320×568 it spans 133–437px (horizon 111)
  with ≈ 23px to the phone; at 393×852, 274–670px (horizon 230) with ≈ 44px.
- **Sheets:** `max-height: calc(100dvh − safe-top − 24px)`; NookPhone labels ≤ 5 Japanese / 10 Latin characters,
  never ellipsized. The harvest: a `max-width: 420px` column, CTA sticky at the bottom.
- **Check** at 393×852, 375×667 and 320×568, at day, dusk, night and winter.
