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
         [しずえ box, over the front beach]           only with news (the harvest)
bottom             (📱)  しまフォン                   the NookPhone: 56px phone on an 84px disc
```

- **Ribbon:** the NH map's yellow title banner, 「きょう +620 ベル」 for both of us, under the notch (`--safe-top` +
  16px). It counts up when ベル arrive. Tap → きろく ベル.
- **Jar + plate:** the wallet's balance as a bare number on a cream plate. New ベル fly in as coins from the fruit that
  earned them. Tap → ごほうび.
- **Trees:** one per person; today's five ring fruit lie on the ground in front (per kind 0–3 items = thirds of the
  daily goal, 🍑 🍐 🍒 🍎 🥥; a kind with nothing yet shows one faint item). Tap the canopy or the fruit row → the popup:
  a nameplate, per fruit today / goal, today's ベル and the week's badge pips (✓ once met). The popup is the one home of
  per-fruit detail.
- **The NookPhone** is the island's one control (bottom centre, ≥ 56px): the hub for きろく, あそびかた and settings.
- **しずえ** shows only with news (the harvest), in a box over the front beach, so nothing in the scene moves.
- **Taps:** the partner → their card; my villager → a hop; a tree → the popup; the jar → ごほうび; the ribbon → きろく
  ベル; the phone → しまフォン; scenery → small flourishes ([scene-interactions.md](scene-interactions.md)). All are real
  buttons with `aria-label`, ≥ 44px (villagers and jar ≥ 64px). Focus order: heading, ribbon, phone, scene.

### 1.2 ごほうび the wallet (`routes/jar/+page.svelte`, ADR 0022)

Title bar (‹ 島へ, ごほうび), a hero (the jar over 「ふたりのベル」 and the balance), then **one list** of big buy tiles (item
art, name, price). An item the wallet can't cover yet is sunk and says あと N ベル (a tap boops). ✎ edits the list (add /
rename / reprice / remove, shared by both). 買う！ asks first, then shows at once and waits 5 s with とりけす before it is
sent. No history here (it lives in きろく ベル). The island jar morphs into the hero jar (View Transitions; a crossfade
under reduced motion; `ui-state/jarTransition.ts`).

### 1.3 しまフォン NookPhone (`phone/ShimaPhone.svelte`)

A NookPhone-screen sheet: status row (time · leaf · デモ in the demo), the title bar, and a 3-column grid of squircle
tiles. Each app slides in from the right inside the phone.

| App | Tile | What |
|---|---|---|
| きろく | `phone/miles` | からだ (weight trend, 目標: Move goal + weight goal, weeks of badges) and ベル (the passbook); week → day → fix ([history-and-editing.md](history-and-editing.md)). Lazy-loaded |
| あそびかた | `phone/glyph-help` | No taps needed, the five fruits and goals, badges, the wallet, the setup |
| 村人 | `phone/passport` | My villager from the roster (158, one search field) and my よびな |
| ことば | `phone/glyph-chat` | 日本語 / English |
| つうしん | `phone/rescue` | When each of us last synced, いま つうしん |
| サウンド | our note glyph | ミュージック / 効果音 / おしゃべり (all off by default) and 音量 ([sound.md](sound.md) §10) |

### 1.4 Sheets, harvest, pairing

- **One sheet skin** (`ui/Sheet.svelte`, a native `<dialog>`): tan paper with white-cream cards (navy at night),
  radius 32, a lip, the title bar, one CTA in a sticky footer lifted above the keyboard.
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
one. Backdrop tap and Esc also close a sheet; nothing advertises swipe-down. `ui/NavBar.svelte` + `ui/NavButton.svelte`
(44px); `ui/nav.test.ts` fails on a modal without them. Motion: a sheet rises in 240 ms (ease-out), a pushed level
slides in from the right in 240 ms; reduced motion: no slide.

## E. Economy (ADR 0019, 0021, 0022)

Values in `config/rules.ts` (`RULES`, versioned by week), the earning rule in `scoring/bells.ts`, the economy on read in
`model/bells.ts`. Pinned by `scoring/bells.test.ts`, `config/rules.test.ts` and the golden fixtures.

**ベル per person per day**, recomputed from the rows (so they move whenever data arrives), five automatic metrics,
one fruit each:

| Fruit | Metric (Shortcut field → stored metric) | Daily goal | ベル a day |
|---|---|---|---|
| 🍑 peach | Exercise minutes: max(Watch, workouts added in きろく), never a sum (`exercise_minutes` → `exercise_min`) | 60 min | 3 per minute (max 180) |
| 🍐 pear | Move, active kcal (`calories` → `move_kcal`) | per person, `pref` moveGoal (default ウェイ 600, うめ 400; 100–2,000) | floor(180 × min(kcal, goal) / goal) |
| 🍒 cherry | Stand minutes, Health Stand Time (`stand_minutes` → `stand_min`) | 180 min | 1 per minute (max 180) |
| 🍎 apple | Steps (`steps`) | 8,000 (tsuyu Jun 1–Jul 20: or 30 exercise min) | 200 |
| 🥥 coconut | Gym: any gym arrival, or a strength workout (Traditional / Functional Strength Training, Pilates, ≥ 15 min; any other type only when marked in きろく) | a gym day | 400 |

- Max 1,140 a day. The Move goal in force on a day is the last one set on or before that Tokyo date: a change never
  re-prices earlier days.
- **Weekly bonus** at the Sunday 19:30 harvest: +400 per badge (🍑 / 🍐 / 🍒 goal met on ≥ 5 days, 🍎 ≥ 4, 🥥 ≥ 3) and
  the ふたりボーナス, +200 for each badge both people met.
- **On target** (every badge for both, minimum days): per person 4,700 daily + 2,000 badges = 6,700; both + 1,000 duo =
  **14,400 ベル a week**. The daily part is 65% of it, so a week short of badges still pays most of its work.
- **One shared wallet:** every ベル earned (daily as it happens, the bonus at Sunday 19:30) goes into it. One shared,
  editable menu, one list (`pref` menu, latest wins, items `{id, label, bells}`). Either person buys
  (`spend`), the buyer can undo (`spend_void`), no approvals. Buys replay in server order and a buy counts only if the
  wallet covered it at its time, so the balance never goes negative. Trips themselves are paid outside the game.
- **Default menu** (`DEFAULT_MENU`): おやつ 1,200 · カフェ・デザート 2,500 · 外ごはん 6,000 · ほしいもの 8,000 ·
  旅のごほうび 12,000. On target: 2–3 おやつ (≈ 3,000) + a café date (2,500) + eating out every two weeks (3,000) ≈
  8,500 a week, leaving ≈ 5,900: a ほしいもの every ~1.5 weeks or a 旅のごほうび every ~2.
- **Locks:** a week's earnings change with late syncs and edits until its Wednesday 04:00 lock, then they are fixed at
  the lock. Buys never lock. The economy starts in the week of Mon 2026-10-26.
- **Weight** (ADR 0020) is a trend only, shown in きろく; it never earns (`deps.test.ts` checks the economy never imports
  `model/weight.ts`).
- **View model** (`types.ts`): `WeekView.people[p]` (today's ベル per fruit, ring progress, Move goal), `wallet
  {balance, earned, spent, today, week}`, `menu`, `harvest`; きろく reads `model/history.ts` (`historyWeeks`,
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

`IslandScene` = an elastic sky over a fixed-aspect **stage of 390 × 360 units (u)**, anchored to the bottom, with one
NH-blue sea from the horizon down under the island and behind the bottom chrome. The page gives the scene
`--scene-h: 100dvh` and `--island-bottom = --chrome-below`; the stage's front beach (its last 34u) tucks under the
chrome. The HUD overlays the sky. Back to front: sky (sun/moon, stars, clouds, balloon, fireworks) · sea · ground ·
hedge · trees + ground fruit · jar + plate · flower beds · villagers · particles · one multiply tint.

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
- **Banner** (`ui/Toast.svelte`): NookPhone-style, below the status row, in the top layer; a 36px icon, one line, a
  reaction icon or one action (とりけす). Tap or swipe up to dismiss; one at a time.
- **Buttons:** four tiers, ink text (≥ 5.6:1), radius 16, a squash on press. Every tappable thing has an **edge** (2px
  outline + 4px lip in one colour, ≥ 3:1 on the panel); static cards only the soft lip, so "brown edge = tappable".
  Primary = leaf; secondary = white-cream `--ctl`; selected = yuzu `--ctl-sel`; disabled = sunk `--ctl-off`, no edge.
  A control that can't act now uses `aria-disabled` (it boops: [sound.md](sound.md) §13).
- **Fonts:** Zen Maru Gothic (UI, 500/700, subset in `fonts.css`, `npm run fonts:subset`) + Fredoka (numbers, 600/700).

### Tokens (`styles/tokens.css`)

- **Palette:** ink `#4A3A2C` / `#6B5544` · cream `#FFF9E3` · paper `#F5E4BC` · card `#FFFCF2` · lip `#E0C48A` · edge
  `#937047` · leaf `#6ED07A` / `#4FB35C` / edge `#2F8A3F` · yuzu `#FFD84D` / `#E6B22E` · mint `#7BD7C1` / `#63B4B5` ·
  coral `#FF8F7A` (errors only). Components use semantic tokens (`--bg --surface --card --lip --text --text-soft --hud
  --focus --scrim`); scene colours live in the `.if-scene` block, `--fx-*`, `--jar-*`.
- **Surfaces:** the panel (`--bg`: tan by day, `#3A4886` at night) is a step darker than its cards (`--card`). Controls
  `--ctl`, `--ctl-sel`, `--ctl-off`, `--edge`, with `--sh-ctl`; fixed-cream game objects (sheet close, keypad, back
  pill, choices) use `--sh-obj` (always brown). Themed text is `var(--text)`, never `--c-ink`.
- **Type:** 12 · 15 body · 18 talk/button · 24 title/ribbon · 44 hero. **Radius:** 8 chips · 16 buttons · 24
  cards/dialogue · 32 sheets/phone · 30% tiles. **Motion:** `--dur-tap` 90 · `quick` 140 · `base` 260 · `pop` 360 ·
  `slow` 600 · `emote` 2200 (reduced motion: 0 / 120 ms).

### T.7 Time of day sets the theme

`data-tod` on `<html>` comes **only from the Tokyo clock** (dawn 05–07, day 07–16, dusk 16–19, night 19–05;
`ui-state/season.ts`); `prefers-color-scheme` is ignored. Previews: `?theme=night|day`, `?season=`, `?date=`.

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
- **島:** `--chrome-below` is one constant per viewport (≈ 180px at 393×852, ≈ 138px at 375×667 and 320×568); the scene
  keeps its full height and the chrome sits on the sea.
- **Sheets:** `max-height: calc(100dvh − safe-top − 24px)`; NookPhone labels ≤ 5 Japanese / 10 Latin characters,
  never ellipsized. The harvest: a `max-width: 420px` column, CTA sticky at the bottom.
- **Check** at 393×852, 375×667 and 320×568, at day, dusk, night and winter.
