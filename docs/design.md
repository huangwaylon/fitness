# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md). Numbers come from `app/src/lib/config/rules.ts`, which wins if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch. Their activity, measured automatically, grows fruit and earns **ベル** (play money) into one shared wallet,
spent on small treats they agreed on. Japanese first, English per person.

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  weight) several times a day. **Apple Health is the source of truth:** no health number is entered or fixed in the
  app ([Health data](#health-data)).
- **Data out:** the PWA (SvelteKit, static on GitHub Pages) fetches the raw rows and computes every number on the
  phone (`lib/model/`, pure functions), so a rule change re-prices history consistently.
- **Principles:** zero required taps a day; both people see all data; no notifications.

Modules: `contract/` (shared with the script) · `config/rules.ts` · `scoring/` · `model/` · `sync/` · `store/` ·
`ui-state/` · `sound/` · `components/`, `routes/`. `deps.test.ts` enforces the import direction.

## Simplicity rules

- No tab bar: 島 (the island) and ごほうび (the wallet), plus one panel for everything else (tap the ribbon).
- One focal point per screen (島: today's ベル, which is also the door to the panel; ごほうび: the balance).
- A number is shown in full in one place; elsewhere it is only a doorway to it.
- Per screen at most 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card; one しずえ line (≤ 16
  characters), only with news.

## Screens

### Island

Top to bottom: the ribbon 「きょう +620 ベル」 (both people today; counts up; tap → [the panel](#panel)), a sync chip
only when sync isn't ok, the scene, しずえ's box only with news. Nothing else sits at the bottom: the island is centred
in the visible ocean, from the horizon down to the screen's bottom above the home indicator, and never runs under the
ribbon.

- **Trees:** one per person; today's four fruits lie in front, 0–3 items each (thirds of the goal). A tap opens a
  popup: per fruit today / goal, today's ベル, the week as 「2/5」 (days met / needed, ✓ once the badge is met). In a
  week with the milestone curve each fruit shows four pips and one nudge line, 「あと 8分で +45」, for the tapped fruit
  or the one nearest its next step. The last line says, softly, when that person's data last arrived (「15:24 に
  とどいた」, 「きのう 21:10」, 「10/29」), with a small dot once it is over 6 hours old.
- **Jar + plate:** the balance; new ベル fly in as coins. Tap → ごほうび.
- **Villagers:** mine hops when tapped; the partner opens their card.
- Controls are real buttons with `aria-label`, ≥ 44px (villagers and jar 64px); focus order = visual order.

### Wallet

ごほうび (`routes/jar/+page.svelte`): the jar over 「ふたりのベル」 and the balance, then one list of buy tiles with the
price of the next buy. An escalating treat bought this week shows its base struck through and 「こんしゅう 2かいめ」; one
the wallet can't cover is sunk with あと N ベル. ✎ edits the shared list. A guide line: food treats about three times a
week (no cap). 買う！ asks first, applies at once and waits 5 s with とりけす before it is sent.

### Panel

Tap the ribbon → the island panel slides down from the top (`panel/IslandPanel.svelte`, a top sheet: the safe area
over its title bar 「しまの てちょう」, rounded at the bottom, stopping 24px short of the screen's bottom). One scroller,
in this order: **きろく** ([Kiroku](#kiroku)), **からだ / 目標**, **むらびと** (my villager and よびな; かえる → the
picker: 23 special characters and 158 villagers), **サウンド** ([Sound settings](#sound-settings)), **ことば**
(日本語 / English), **つうしん** (when each of us last synced; いま つうしん) and **あそびかた** (one line; くわしく →
the guide: step tables, the treat guide and escalation, a protein hint of 1.6 g per kg a day, not tracked). A week, a
day, the weight screen, the picker and the guide push a level with ‹; ✕, the backdrop and Esc close the panel.
The panel is its own chunk, loaded on the first tap.

### Kiroku

きろく (`model/history.ts`, `components/kiroku/*`) is a read-only history at the top of the panel, two sections:

- **きろく (ベル):** everything earned, then by week: the Sunday bonus, the buys (my own → とりけす) and one line per day
  (tap → the day).
- **からだ・目標:** a weight card per person (→ the weight screen), 目標 (the Move and weight goals; two avatar pills
  pick whose, either person sets either person's), then one card per week, newest first: ✓ once both harvested, each
  person's four badges (tap → the week).
- **Week:** ベル, badges, a day table (tap a day).
- **Day:** me then the partner: the day's ベル and, per fruit, its value (green at the goal) and ベル.
- **Weight screen:** trend, week change, since start, pace, a 12-week chart (dots = weigh-ins, line = trend, dashes =
  goal), the goal month at the current pace, the recent weigh-ins. No good/bad colours.

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar,
  one CTA in a sticky footer above the keyboard.
- **Partner card:** face, one line about their day, ハイタッチ (when their data arrived is on their tree).
- **Harvest** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both have tapped: badges, bonuses, the
  ふたりボーナス, then 受け取る and coins fall into the jar. ✕ = あとで. The bonus is in the wallet from 19:30 either way.
- **Pair** (`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

✕ sits top-right and closes the whole sheet from any level; ‹ sits top-left only when there is a level to go up to; a
full page has ‹ 島へ. Backdrop tap and Esc also close. `ui/NavBar.svelte` + `ui/NavButton.svelte`; `ui/nav.test.ts`
fails on a modal without them. Sheets rise and levels slide in over 240 ms (no slide under reduced motion).

## Economy

Rule `scoring/bells.ts`, economy on read `model/bells.ts`, values `config/rules.ts`; pinned by their tests,
`model/properties.test.ts` and the golden fixtures. Earnings are recomputed from the rows, so they move whenever data
arrives. The economy starts with the week of Mon 2026-10-26.

### Fruits and goals

Every list shows them in Apple's ring order, Move, Exercise, Stand, then steps (`RING_FRUITS`).

| Fruit | Metric (Shortcut field → stored) | Daily goal |
|---|---|---|
| 🍐 Move | active kcal (`calories` → `move_kcal`) | per person `pref` moveGoal, 100–2,000 (default ウェイ 600, うめ 400) |
| 🍑 Exercise | Watch exercise minutes (`exercise_minutes` → `exercise_min`) | 60 min |
| 🍒 Stand | Stand Time (`stand_minutes` → `stand_min`) | 120 min (v1 180) |
| 🍎 Steps | `steps` | 8,000; Jun 1 – Jul 20 (tsuyu) 30 exercise minutes also count |

The Move goal on a day is the last one set on or before that Tokyo date: a change never re-prices earlier days.

### Milestone curve

In v2 each fruit pays at 25 / 50 / 75 / 100% of the goal (nothing below 25%, the maximum above the goal). Shares 25 /
70 / 130 / 240 of the maximum, rounded; 🍑 rounded to 5s; 🍎 set by hand.

| % of goal | 25% | 50% | 75% | 100% |
|---|---|---|---|---|
| 🍐 (e.g. 600 kcal) | 150 → 19 | 300 → 53 | 450 → 98 | 600 → 180 |
| 🍑 (60 min) | 15 min → 45 | 30 → 120 | 45 → 230 | 60 → 420 |
| 🍒 (120 min) | 30 min → 13 | 60 → 35 | 90 → 65 | 120 → 120 |
| 🍎 (8,000) | 2,000 → 20 | 4,000 → 60 | 6,000 → 110 | 8,000 → 200 |

The view exposes each fruit's step and the next one (`RingProgress.milestone`, `nextAt`, `nextGain`).

### Rule versions

`rulesFor(weekKey)` picks the latest `RULES` version whose `from` is on or before the week; every screen reads the
version of the week in view. A change is a new version with a later `from`, never an edit of one that has earned.

| | v1 (week of 2026-10-26) | v2 (from Mon 2026-11-02) |
|---|---|---|
| 🍐 | floor(180 × min(kcal, goal) / goal) | milestones, max 180 |
| 🍑 | 3 a minute to 60 min (180) | milestones, max 420 |
| 🍒 | 1 a minute to 180 min (180) | milestones, max 120 |
| 🍎 | 200 at the goal | milestones, max 200 |
| Badge / duo per badge | 400 / 200 | 450 / 500 |
| Day max · on target for both | 740 · 11,000 | 920 · 14,400 |

On target in v2 (every badge for both, minimum days): per person 5 × 180 + 5 × 420 + 5 × 120 + 4 × 200 = 4,400 + 4 ×
450 = 6,200; both 12,400 + 4 × 500 = 14,400, of which 8,800 is daily.

### Badges and duo bonus

A badge per fruit when its goal (100%) was met on enough days: 🍐 🍑 🍒 5, 🍎 4. Each pays the badge ベル; the
ふたりボーナス pays the duo amount for each badge both people met. Both land as the week's bonus.

### Harvest and lock

- **Sunday 19:30 JST:** the harvest opens and the week's bonus lands in the wallet.
- **The following Wednesday 04:00 JST:** the week locks. Until then its earnings move with late syncs; after, they are
  computed as of the lock, so the past stays put. The lock is internal: nothing shows it.

### Wallet and buys

One shared wallet: a day's ベル count from that day (at their current value), a week's bonus from its Sunday 19:30.
Either person buys (`spend`), no approvals. Buys and voids replay in server order.

- **Coverage:** a buy counts only if covered: everything earned on days up to its date plus bonuses landed by its time,
  minus earlier accepted buys. An uncovered buy is ignored, so the balance never goes negative (a higher Move goal set
  later the same day can lower that day's ベル and so uncover a buy).
- **Voids:** the buyer only, once (`spend_void`); the ベル return. Buys and voids never lock.

### Escalating treats

おやつ, カフェ・デザート and 外ごはん (ids `snack`, `cafe`, `dinner`, so a rename keeps it) cost base × 1.5ⁿ, n = the
accepted, not voided buys of that id earlier in the same Tokyo week (Mon–Sun), by either person; for n ≥ 1 rounded to
the nearest 50 (an exact half down), never below the base: おやつ 1,200 → 1,800 → 2,700 → 4,050; カフェ 2,500 → 3,750 →
5,600; 外ごはん 6,000 → 9,000 → 13,500. The base is the menu price at the buy's server time. A buy sends the current
price; on read, one stamped from 2026-10-31 00:00 JST (`enforceFrom`) whose `bells` isn't its price at its place in
server order is ignored, so of two simultaneous buys the server's first wins. A void frees its buy for later ones.

### Default menu

`DEFAULT_MENU` until edited (`pref` menu, latest wins): おやつ 1,200 · カフェ・デザート 2,500 · 外ごはん 6,000 · ほしいもの
8,000 · 旅のごほうび 12,000. On target, treats ≈ 8,500 a week leave ≈ 5,900 to save.

## Health data

Apple Health is the source of truth. Steps, exercise, Move, Stand and weight come only from the Shortcut's `metrics`
rows; a day's activity value is its highest row, its weight its latest. Nothing in the app enters or fixes them.

What the app sends instead ([backend.md](backend.md#events)): the two goals (`pref` `moveGoal`, `goalWeight`, either
person's: `data.person`, absent = the sender), the menu, buys and voids, harvest taps, high-fives, and the sender's own
`locale`, `villagerName` and `villager`. A buy and its とりけす are shown at once and wait 5 s with とりけす before they
are sent (touching the banner holds it, ≤ 2 min). Rows of an event type the app no longer knows are ignored.

## Weight trend

Shown in きろく only; never earns (`deps.test.ts`: the economy never imports `model/weight.ts`). An exponentially
weighted average of the weigh-ins: each day moves it 10% towards that day's weight (a gap of g days weighs the next
1 − 0.9^g). Pace = the trend's average change over the last 28 days (needs 14). A goal date shows when the pace heads
to the goal at ≥ 0.05 kg a week within 156 weeks.

## Island scene

`lib/components/island/*`: a Pocket Camp–style diorama in SVG/CSS around official renders. Light from the upper left;
each surface one fill, one gradient, one soft shade, sparse flecks; no strokes or lips on scenery.

### Layout and scale

An elastic sky over a **stage of 390 × 360 units (u)**. The island (32u–356u) is centred between the horizon and the
screen's bottom above the home indicator (`--island-bottom`); the sky is at most 27% of the screen; nothing runs under
the ribbon. Back
to front: sky · sea · ground · hedge · trees + fruit · jar · flower beds · villagers · particles · one tint.

`scene.ts`: **1 tile = 44u**, **1 row = 31u** deep; `col(k) = 195 + 44k`, k = −3…3; row bases hedge 80 · trees + jar
173 · bed back 266 · front 297. Villager 80u (cols ±1, front row) · hardwood 120u (cols ±2) · bush 48u (cols −3…3) ·
flower 32u (cols ±2/±3) · ground fruit 24u · jar 52u wide (col 0).

### Environment

- **Seasons** (`ui-state/season.ts`): winter (snow) Dec 11 – Feb 24, spring to May 31, summer to Sep 15, autumn to Dec
  10. Oaks: blossom Apr 1–10, fall leaves Oct 16 – Dec 10.
- **Time of day**, Tokyo clock only: dawn 05–07, day 07–16, dusk 16–19, night 19–05; it sets the sky and one tint.
  Night is soft periwinkle, never black.
- **Hedge:** one species a month (Apr–May azalea, Jun hydrangea, Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly,
  Jan–Mar camellia). Two flower beds by season. A newly earned fruit shakes its tree and drops in.

### Particles and events

≤ 3 particles (petals, maple leaves, snow, summer fireflies). Events (`eventsAt`): cherry blossom Apr 1–10, maple week
Nov 16–25, fireworks on August Sundays from 19:00 and at New Year, Toy Day Dec 24, the balloon present. Only
`transform` and `opacity` animate; everything pauses while hidden (`data-paused`); a sheet also pauses particles and
idle life (`data-covered`).

### Scene interactions

`island/SceneTaps.svelte`, `island/sceneTaps.ts`, `island/Critters.svelte`, `island/critters.ts`, `e2e/scenery.spec.ts`,
`e2e/critters.spec.ts`. Every part of the island answers a tap softly and counts for nothing: no ベル, no state, no
navigation, no writes; one `pointerdown` listener; ≤ 4 flourishes at once; taps on controls are ignored; nothing while
covered or hidden; reduced motion gives a 450 ms glow and no critters; decorative, `aria-hidden`, pointer-only.

**Scenery** (≤ 1 s each): a bush jiggles and sheds seasonal leaves (1 in 10 a bug flies out: a moth after dark, else a
butterfly of the season, sometimes a ladybug); a flower wiggles (1 in 8 by day outside winter a butterfly, 1 in 2 on
summer nights a firefly); the sea ripples (1 in 10 a fish shadow); sand leaves footprints; grass puffs dust (snow in
winter); a cloud squishes; the sun glints; the moon sends a shooting star; the night sky twinkles (1 in 4 a shooting
star); a clear night sends a shooting star every 45–120 s.

**Balloon** (NH's balloon present): a tap pops it (a "pan!", confetti in its colours); the present falls onto the lawn
in front of the hedge, behind the trees and the jar, bounces, sparkles and fades (off the island's corner it drops into
the sea). No caption. Short skies fly a smaller balloon under the ribbon, or none.

**Critters** (NH, northern hemisphere, Tokyo clock): every 1–3 minutes of on-screen time (first after 30–90 s; the
countdown holds while covered or hidden, and the critters leave) a fish shadow or a bug comes by; ≤ 1 of each.

- **Fishing:** a shadow (NH sizes 1–6) dawdles off the front beach (on a short screen, beside the island). A tap
  near it casts a red-and-white bobber on a line from the beach; within 90u the fish swims up, nibbles 0–3 times (a
  bob) and bites (the bobber goes under): a tap in the next 1 s catches it, a tap any earlier or none in time and it
  flees; a cast it ignores is reeled back by the next tap. Mostly sea bass (all year); horse mackerel, anchovy (4–21h),
  olive flounder, red snapper all year; dab Oct–Apr, squid Dec–Aug, sea butterfly Dec–Mar, puffer fish Nov–Feb, barred
  knifejaw Mar–Nov; 1 in 14 a boot, tire or can.
- **Bugs:** common butterfly Sep–Jun, yellow Mar–Jun and Sep–Oct, tiger Mar–Sep (4–19h) over the flower beds; darner
  dragonfly Apr–Oct (8–17h), red dragonfly Sep–Oct (8–19h) darting over the hedge; fireflies on summer nights (19–4h);
  bell cricket Sep–Oct and cricket Sep–Nov (17–8h) hopping in the grass; no wasps, nothing that chases. A tap on one
  swings the net (caught); a tap within 80px startles it away. Bugs keep to spots clear of every control.
- **The catch:** the official critterpedia icon pops out of the catch onto a plate like the jar's with NH's line:
  「〇〇を つりあげた！」 / 「〇〇を つかまえた！」, the sea bass 「…まあまあ かな？」 ("it's at least a C+!"), junk
  「つれた！ …と思ったら、ながぐつだった」. It sits centred above (else below) the catch, inside the safe area and clear of
  every control, popup and しずえ's box; with no room it's skipped. 2.6 s.

**Cost:** transforms and opacity only; critters move by CSS transitions between waypoints a timer picks (no rAF), one
wing or fin loop each while on screen; between visits one timer. Art loads on first need. Layers: sea life z 1 (under
the tint), bugs `--z-leaf` (night `--z-taps`, so fireflies glow), the catch `--z-taps`, the present under `--z-tree`.
Cues: `scene-<kind>` world cues, quiet and jittered (≤ 0.5, ≤ 2 at once, < 1 s, never jingles; [Cues](#cues)).
`?critter=fish|<bug id>` (dev or `?demo`) brings one on at once and keeps it until caught; `?balloon` floats one.

## Motion

- **Rig** (`Villager.svelte`, `Host.svelte`): `.actor` › `.face` (facing) › `.body` (one motion) › the art; emotes and
  fx sit beside `.face`, so they never squash or mirror. The director (`motion/director.svelte.ts`) holds one state per
  actor.
- **Primitives:** `if-` keyframes in `tokens.css`; durations in `MOTION_MS` (`motion/reactions.ts`) must match.
- **Marks:** villagers get floating marks (`Mark.svelte`) or official glyphs; しずえ the cream bubble
  (`Emote.svelte`). Effects (`Fx.svelte`) remove themselves.
- **Reactions** (`REACTIONS`, R1–R19): events such as first open, the partner's day growing, high-fives, a goal met,
  all four goals met, taps, waking, a low week (Thu–Sat under 1,000 ベル), a sync problem, the harvest. They never fire
  on first render; pages `emit(…)` (`motion/bus.svelte.ts`).
- **Idle life** (`motion/idleLife.svelte.ts`): every 9–15 s one actor does one small thing (しずえ ≤ every 20–30 s), no
  emotes or fx; slower after 3 min idle, stopped after 10 min; paused while hidden, covered or under reduced motion.
- **Reduced motion:** no loops, hops, walks or dances; emotes fade in; dialogue appears at once.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`): cream box, yuzu nameplate, 33 ms a glyph, tap to finish, `aria-live` mirror.
  **Choices** (`ui/ChoiceList.svelte`), **banner** (`ui/Toast.svelte`, one at a time).
- **Buttons:** every tappable has an edge (2px outline + 4px lip); static cards only a soft lip. Primary leaf,
  secondary cream, selected yuzu, disabled sunk. "Can't now" = `aria-disabled` ([Taps](#taps)).
- **Focus:** no ring after a pointer input (`ui/modality.ts`); focus is restored for keyboard and VoiceOver.
- **Type:** Zen Maru Gothic (UI, Japanese) and Fredoka (numbers); `word-break: keep-all` for Japanese.
- **Tokens** (`styles/tokens.css`): ink `#4A3A2C`, cream `#FFF9E3`, paper `#F5E4BC`, card `#FFFCF2`, edge `#937047`,
  leaf `#6ED07A`, yuzu `#FFD84D`, mint `#7BD7C1`, coral `#FF8F7A` (errors only); semantic tokens in components; one
  `--z-*` stacking scale.
- **Theme:** `data-tod` comes only from the Tokyo clock (`prefers-color-scheme` ignored); night chrome `#3A4886`. The
  ribbon, plate, dialogue and choices stay cream/yellow. Previews: `?theme=`, `?season=`, `?date=`.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard inset `--kb`
from `visualViewport` (`ui/keyboardInset.ts`). Short screens scale the island down. Check at 393×852, 375×667 and 320×568, day, dusk, night and winter.

## Official art

Official NH renders only from `static/art/` through `<OfficialArt>`, with a fallback so a missing file never breaks a
screen; WebP, never upscaled. Manifest and helpers `lib/art.ts`; files from `scripts/fetch-assets.ts`. Groups:
villagers (roster `lib/villagers/roster.ts`; defaults goldie and anchovy), host (しずえ, たぬきち), fruit, seasonal oaks,
bushes, flowers, season particles, reactions, money, deco. Ours: sky, sea, ground, the jar, effects, marks,
UI sprites. Names follow the Japanese game (しずえ, ベル); no Nintendo fonts.

## Sound

`lib/sound/`. Off by default, kept per phone. Nothing sounds without a visible reason (idle life is silent). The
hourly music and opening are the user's own files; every effect is an original placeholder, replaceable by a file.

### Hourly music

One track per **Tokyo hour** (`hourly.ts`) in sunny / rain / snow arrangements (`sound.weather`, sunny for now;
`?weather=` previews; a missing variant falls back to the hour's sunny track). A 3 s crossfade on the hour; the next
file is fetched a minute early. Each file is a loop period plus a 3 s copy of its start; two `<audio>` decks hand over
inside the copy (aligned to ~12 ms, 0.15 s crossfade), so the loop has no gap. Turning ミュージック on plays the
opening theme until it ends or the panel closes. Under a sheet, the panel or the harvest the music is low-passed at 900 Hz.

### Ambience

`ambientFor(hour, month, weather)` on the music bus: waves always; birds 05–17 Mar–Nov when fine; cicadas 08–17
Jul–Aug; higurashi 04–08 and 16–19 Jul–Aug; crickets 17–05 Sep–Nov; wind Dec–Feb or snow; rain. Files only (none are
listed yet).

### UI sounds

Soft mallets and bells for the phone, cursor, confirm and cancel. Dialogue is silent: the villagers don't speak (the
text just types).

### Cues

`cues.ts CUES` maps moments to sounds, levels and delays; nothing calls `play()` directly. Reactions name a cue per
step, taps in `data-sfx`, outcomes call `cue()`. Examples: tree tap → rustle, fruit lands → thud, each coin → coin
(climbing a pentatonic run), badge met → miles, 受け取る → fanfare, buy → purchase, villager/jar tap → pop, first open of
the day → chime (waits up to 15 s for the first tap), scenery → `scene-<kind>`. **World cues** (the island's own
sounds) are skipped while a sheet, the panel or the harvest covers the scene; UI cues always play.

### Taps

Every tappable names its sound in `data-sfx`; one capture listener (`taps.ts`) plays it on the click. `self`: the
handler plays the outcome's cue; `none`: silent (text fields). A control with `aria-disabled="true"` has its click
swallowed and plays `boop`. Enforced by `taps.test.ts`, walked by `e2e/sound.spec.ts`.

### Mix

Buses: music 0.30, ambience 0.28, effects 0.90; master 音量 squared (default 0.8). ≤ 6 voices and a cap
per sound (`ids.ts`); jingles (fanfare, miles, chime) never overlap and duck the music to 25%. Effects jitter pitch
(UI and jingles don't).

### Engine lifecycle

`sound.svelte.ts` drives `engine.ts`; the rules are pure in `session.ts`; `engine.test.ts` uses a fake context.

- **Unlock:** no context until a setting is on. `pointerup`, `touchend`, `click` or `keydown` creates and resumes it
  and unlocks both decks; `pointerdown` only wakes it, so scenery taps are heard. With ミュージック on, the hour's file is
  fetched 1 s after launch, so the first tap starts it inside the gesture; a track that should play but doesn't is
  started by the next tap.
- **Nothing queues:** a cue on a context that isn't running is dropped; a tap's own sound may run within 250 ms of its
  resume and is cancelled if the context still isn't running 300 ms later.
- **Idle suspend:** with only effects on (or the music held by an outside ⏸) the context sleeps 10 s after
  the last sound.
- **Background:** hidden → decks paused, ambience stopped, context suspended, the hour clock stopped (no prefetch while
  hidden or muted); back in front the same hour fades in over 0.8 s. A deck that starts while hidden is paused again.
- **Decks:** a fade-out's delayed pause applies only to the assignment it faded (deck generation). Failed effect
  decodes retry on a later unlock.
- **iOS session:** `navigator.audioSession.type` is `playback` while ミュージック is on (plays in silent mode), else
  `ambient`. The Media Session tile names the tune; ▶ resumes only in front, ⏸ holds until the next tap.

### Audio files

`static/audio/manifest.json` (bundled by `manifest.ts`): `sfx.<id>`, `music.<weather>.<00–23>` = `{file, start, end?,
gain?}`, `opening`, `ambient.<id>`. Add a file and its entry, no code change; a missing effect keeps its placeholder
(`synth.ts`), missing music or ambience is silence. `sound.test.ts`: files exist, ≤ 1 MB a track, ≤ 20 MB in all. `npm
run audio:music -- <dir>` (`scripts/music.ts`, ffmpeg) builds the 24 tracks from the user's MP3s: finds the loop,
appends the copy, encodes AAC 64 kbps, sets `gain` to −16 LUFS. Audio is never precached
([backend.md](backend.md#service-worker)).

### Sound settings

The panel's サウンド: **ミュージック** (music, ambience), **効果音** (effects, jingles), **音量** 0–10; both off at
first; turning one on previews it. 音量 0 mutes in place. In localStorage (`island.sound`), never
synced.
