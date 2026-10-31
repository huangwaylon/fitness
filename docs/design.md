# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md). Numbers come from `app/src/lib/config/rules.ts`, which wins if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch. Their activity, measured automatically, grows fruit and earns **ベル** (play money, a stamp card: +1 per daily goal)
into one shared wallet, spent on two treats: おやつ and 外食. Japanese first, English per person.

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  weight) several times a day. **Apple Health is the source of truth:** no health number is entered or fixed in the
  app ([Health data](#health-data)).
- **Data out:** the PWA (SvelteKit, static on GitHub Pages) fetches the raw rows and computes every number on the
  phone (`lib/model/`, pure functions).
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

Top to bottom: the ribbon 「きょう +6 ベル」 (both people today, ふたりでぜんぶ included; counts up; centred in the sky between the safe
area and the horizon; tap → [the panel](#panel)), a sync chip
only when sync isn't ok, the scene, しずえ's box only with news. Nothing else sits at the bottom: the island is centred
in the visible ocean, from the horizon down to the screen's bottom above the home indicator, and never runs under the
ribbon.

- **Trees:** one per person; today's four fruits lie in front, 0–3 items each (thirds of the goal). A tap opens a
  popup: per goal today's amount against the goal, met or not (「638 / 600 kcal」, 「14,164 / 8,000歩」), a ✓ before
  it once met, and its +1 (bright once earned); then a star line for today's ふたりでぜんぶ, 「ふたりで ぜんぶ まで：あと 2つ」 (goals left, both people) or 「ふたりで ぜんぶ！ +2」. The last
  line says, softly, when that person's data last arrived (「15:24 に とどいた」, 「きのう 21:10」, 「10/29」), with a
  small dot once it is over 6 hours old.
- **Jar + plate:** the balance; each goal met flies in as a +1 coin from its fruit, ふたりでぜんぶ as a +2 over the
  jar. Tap → ごほうび.
- **Villagers:** mine hops when tapped and says a line ([Villager chats](#villager-chats)); the partner opens their card.
- Controls are real buttons with `aria-label`, ≥ 44px (villagers and jar 64px); focus order = visual order.

### Wallet

ごほうび (`routes/jar/+page.svelte`, `wallet/Shop.svelte`): the jar over 「ふたりのベル」 and the balance, then two big
tiles with NH item art: 🍦 おやつ 8 ベル (たこやき・アイス・あんみつ・ポテチ・スイーツ・スタバ) and 🍜 外食 15 ベル (マーラータン・
おすし・ラーメン・韓国料理・トッポッキ). One the wallet can't cover is sunk with あと N ベル. 買う！ asks first, applies at
once and waits 5 s with とりけす before it is sent.

### Panel

Tap the ribbon → the island panel slides down from the top (`panel/IslandPanel.svelte`, a top sheet: the safe area
over its title bar 「しまの てちょう」, filling the screen to its bottom edge, rounded there like the screen's corners;
its height never changes between tabs). Two tabs sit
pinned under the title bar (NH's yellow for the one shown); it opens on **きろく**, and remembers the last tab for the
session:

- **きろく:** the ベル ledger by week and day, then からだ (the weight trend) and 目標 (the Move and weight goals)
  ([Kiroku](#kiroku)).
- **せってい:** **むらびと** (my villager and よびな; かえる → the picker: 23 special characters and all 417 NH villagers; its head (my villager, よびな, the search) stays pinned while the head grid scrolls under it),
  **サウンド** ([Sound settings](#sound-settings)), **ことば** (日本語 / English), **つうしん** (when each of us last
  synced; いま つうしん) and **あそびかた** (one line; くわしく → the guide: the four goals at +1 each, ふたりでぜんぶ
  +2, the two treats and their prices, the Sunday recap; a protein hint of 1.6 g per kg a day, not tracked).

A day, the weight screen, a goal, the picker and the guide push a level with ‹ (the tabs hide while a level is
open); ✕, the backdrop and Esc close the panel. It is its own chunk, loaded on the first tap.

### Kiroku

きろく (`model/history.ts`, `components/kiroku/*`) is a read-only history, the panel's first tab, in two sections:

- **ベル:** everything earned, then by week (its ベル): the buys (my own → とりけす) and one line per day under the two
  avatars: each person's four fruits (bright = met), a star on a ふたりでぜんぶ day, the day's ベル (tap → the day).
- **からだ・目標:** a weight card per person (→ the weight screen), 目標 (the Move and weight goals; two avatar pills
  pick whose, either person sets either person's).
- **Day:** ふたりでぜんぶ (+2 or —), then me and the partner: the day's ベル and, per goal, its value (green when met)
  and +1.
- **Weight screen:** trend, week change, since start, pace, a 12-week chart (dots = weigh-ins, line = trend, dashes =
  goal), the goal month at the current pace, the recent weigh-ins. No good/bad colours.

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar,
  one CTA in a sticky footer above the keyboard.
- **Partner card:** face, one line about their day, ハイタッチ (when their data arrived is on their tree).
- **Harvest** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both have tapped, a recap of the week: each
  person's ベル, the ふたりでぜんぶ days (+2 each) and the week's total; 受け取る → the week's coins fall into the jar. ✕ =
  あとで. Nothing more lands: the week's ベル came in day by day.
- **Pair** (`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

✕ sits top-right and closes the whole sheet from any level; ‹ sits top-left only when there is a level to go up to; a
full page has ‹ 島へ. Backdrop tap and Esc also close. `ui/NavBar.svelte` + `ui/NavButton.svelte`; `ui/nav.test.ts`
fails on a modal without them. Sheets rise and levels slide in over 240 ms (no slide under reduced motion).

## Economy

A stamp card with small numbers. Rule `scoring/bells.ts`, economy on read `model/bells.ts`, values `config/rules.ts`
(`RULES`, `SHOP`); pinned by their tests, `model/properties.test.ts` and the golden fixtures. Earnings are recomputed
from the rows, so they move whenever data arrives.

### Goals

Every list shows them in Apple's ring order, Move, Exercise, Stand, then steps (`RING_FRUITS`). Per person per Tokyo
day, all or nothing: **+1 ベル for each goal met**, so at most 4.

| Fruit | Metric (Shortcut field → stored) | Daily goal |
|---|---|---|
| 🍐 Move | active kcal (`calories` → `move_kcal`) | per person `pref` moveGoal, 100–2,000 (default ウェイ 600, うめ 400) |
| 🍑 Exercise | Watch exercise minutes (`exercise_minutes` → `exercise_min`) | 60 min |
| 🍒 Stand | Stand Time (`stand_minutes` → `stand_min`) | 120 min |
| 🍎 Steps | `steps` | 8,000 |

The Move goal on a day is the last one set on or before that Tokyo date: a change never re-prices earlier days.

**ふたりでぜんぶ:** +2 shared when both people meet all four goals on the same Tokyo day. A day pays 0–10 for the pair.

### Numbers check

`scoring/bells.test.ts` asserts these (the pair, one week):

| Week | How | ベル |
|---|---|---|
| Perfect | every goal every day, both | 4 × 7 × 2 + 2 × 7 = **70** |
| Typical | each goal met on 5 of 7 days, both perfect on 3 days | 20 × 2 + 3 × 2 = **46** |
| Lazy | two easy goals a day (say Move and Stand), never all four | 2 × 7 × 2 = **28** |

A perfect week buys three おやつ and three 外食 (69); a typical week two of each (46); a lazy one a 外食 and a おやつ.

### Rewards

Exactly two, one shared wallet (`SHOP`): 🍦 **おやつ 8 ベル** (`snack`: takoyaki, ice cream, anmitsu, chips, sweets,
Starbucks) and 🍜 **外食 15 ベル** (`dinner`: malatang, sushi, ramen, Korean food, tteokbokki). A buy is
`spend {spendId, item, bells}` with `bells` exactly the item's price (the server refuses anything else; the model
ignores it too). Either person buys, no approvals; the buyer undoes (`spend_void`).

### The first week

The economy starts with the data: its first week is the first one with an activity row stamped by that week's lock
(`firstWeek`). A baseline of old days, synced long after their weeks locked, never earns and never moves it.

### Harvest and lock

- **Sunday 19:30 JST:** the harvest recap opens (nothing lands then: the week's ベル came in day by day).
- **The following Wednesday 04:00 JST:** the week locks. Until then its earnings move with late syncs; after, they are
  computed as of the lock, so the past stays put. The lock is internal: nothing shows it.

### Wallet and buys

A day's ベル count in the wallet from that day (at their current value). Buys and voids replay in server order.

- **Coverage:** a buy counts only if covered: everything earned on days up to its date minus earlier accepted buys.
  An uncovered buy is ignored, so the balance never goes negative (a higher Move goal set later the same day can lower
  that day's ベル and so uncover a buy).
- **Voids:** the buyer only, once (`spend_void`); the ベル return. Buys and voids never lock.

## Health data

Apple Health is the source of truth. Steps, exercise, Move, Stand and weight come only from the Shortcut's `metrics`
rows; a day's value (activity and weight) is its latest row, so each sync replaces it with Health's current total (a
locked week's earnings stay as of its lock). Nothing in the app enters or fixes them.

What the app sends instead ([backend.md](backend.md#events)): the two goals (`pref` `moveGoal`, `goalWeight`, either
person's: `data.person`, absent = the sender), buys and voids, harvest taps, high-fives, and the sender's own
`locale`, `villagerName` and `villager`, and the island's finds for the ずかん (`find`, the first of each, never ベル). A buy and its とりけす are shown at once and wait 5 s with とりけす before they
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
star); a clear night sends a shooting star every 15–40 s.

**Balloon** (NH's balloon present): by day every 45–90 s of on-screen time (the first after 20–40 s), in a lane under
the ribbon. A tap pops it (a "pan!", confetti in its colours); the present falls onto the lawn in front of the hedge,
behind the trees and the jar, bounces, sparkles and fades (off the island's corner it drops into the sea). No caption.
Short skies fly a smaller balloon under the ribbon, or none.

**Critters** (NH species, Tokyo clock; for fun, frequent): a visit every 8–15 s of on-screen time (the first after
3–6 s; the countdown holds while covered or hidden, and the critters leave): a fish shadow whenever the sea is empty,
else usually a bug; ≤ 1 of each. **Seasons are a flavour, not a gate:** any fish or bug can come in any month, 3× likelier
in its NH northern-hemisphere months; hours still hold (butterflies and bees by day, fireflies and moths at night).

- **Fishing:** a shadow (NH sizes 1–6) dawdles off the front beach. A tap near it (1.5× the old reach) casts a
  red-and-white bobber; the fish swims up and nibbles 0–3 times (small wiggles), then bites: a 「！」 pops, the bobber is
  yanked under with its own sound, and a tap anywhere on the sea in the next 1.6 s catches it. The first early tap only
  makes it hesitate and nibble again; a second scares it off. 1 in 14 a boot, tire or can.
- **Fish** (all 33 of NH's sea and pier fish, `FISH`): mostly sea bass; the reef fish of spring and summer, the big ones
  (ray, tuna, marlin, oarfish), the sharks after dark in summer and, rarest of all, the coelacanth (no weather here, so
  no rain gate). NH's shadows: sizes 1–6, a long thin one for the eels, a fin cutting the surface for the sharks, the
  ocean sunfish and the suckerfish. The pier fish come to the beach (there's no pier).
- **Bugs** (47 NH species, `BUGS`): butterflies (the paper kite, agrias, monarch and the two birdwings among them),
  the honeybee, ladybug and a snail on the beds; dragonflies and the damselfly over the hedge; the cicadas (a shell
  now and then), the stag beetles, the horned dynastid, the Goliath, drone and jewel beetles and the walking stick on
  the trunks; fireflies and the Atlas moth at night; grasshoppers, locusts, mantises, crickets, the pill bug and the
  centipede in the grass; the hermit crab (after dark) and the wharf roach on the front beach. Fliers come in from the
  side, perchers fly in to a trunk (a shell and a walking stick are just there), crawlers fade in and creep (a crab
  scuttles sideways, a snail barely moves). A tap on one swings the net (caught); within 80px it startles away. A
  shaken bush lets one out 1 in 3. Bugs keep clear of every control (the trunk spot sits between the canopy and the
  fruit row).
- **The catch:** the official critterpedia icon pops out of the catch onto a plate like the jar's with NH's line:
  「〇〇を つりあげた！」 / 「〇〇を つかまえた！」, the sea bass 「…まあまあ かな？」 ("it's at least a C+!"), junk
  「つれた！ …と思ったら、ながぐつだった」. It sits centred above (else below) the catch, inside the safe area and clear of
  every control, popup and しずえ's box; with no room it's skipped. 2.6 s.

**Beach finds** (`island/Finds.svelte`, `island/beach.ts`, `island/sceneDay.ts`, `e2e/finds.spec.ts`): the day's items
derive from the Tokyo date and time plus a seed (`?seed=` in the demo), so both phones broadly see the same island;
what a phone picks up is hidden there only (`scene-day` in localStorage), and the first of each shell, fossil and
fragment is a ずかん `find` (never ベル).

- **Seashells** (NH's seven: sea snail, cowrie, venus comb, sand dollar, coral, conch, giant clam): one washes up on the
  front beach every 60–120 s, the newest three lie on the sand (one arriving on screen slides in from the foam). A tap
  picks it up: 「タカラガイを ひろった！」.
- **Fossils** (32: NH's standalone fossils and one piece of each dinosaur): NH's star-shaped ✕ crack on the lawn, 1–2 at
  a time on six spots measured clear of every control (beside the trunks, between the fruit rows and the beds; a spot a
  control covers on a small screen isn't shown). A tap digs it up (the official shovel strikes twice, earth flies, a
  hole): 「化石を ほりだした！ アンモナイトだ！」. The next spot turns up 20–40 s later.
- **Message bottle:** every 8–14 minutes one lies at the water's edge for 6; a tap reads its note (16 short, kind notes,
  ja/en). Not a find.
- **Star fragments:** a tap in the night sky while a shooting star crosses is a wish (「ながれぼしに おねがい！」,
  `scene-wish` in localStorage); the next morning (a wish before 05:00: that morning) 2–3 fragments lie on the beach:
  star fragments, now and then a large one or the season's zodiac fragment.
- The plate is the catch's (`island/Plate.svelte`, placed by `island/placement.ts` clear of every control); taps reach
  44px; reduced motion keeps the pick-ups, without the lift or the shovel. `?find=bottle|fragment` (dev or `?demo`)
  brings one now.

**Island care** (`island/Care.svelte`, `island/care.ts`, `e2e/care.spec.ts`; no ベル, no find):

- **Weeds** (our own tufts: NH's icon is a sack of them) sprout every 30–60 minutes on the lawn's free spots (`LAWN`:
  beside the trunks, in front of the hedge by the jar, between the villagers' feet; a showing dig spot keeps its spot),
  the newest three at a time. A tap pulls one: it pops up and tumbles away with two clods of earth (`scene-weed`).
- **Watering:** a flower tap is NH's watering can (it tilts in over the bloom, three drops, a late glint; `scene-water`)
  on top of the wiggle. A bed watered today has a 1 in 4 chance of a hybrid colour in one watered cell tomorrow (NH's
  hybrids, simplified: tulips → purple, black, orange; roses → black, orange, pink, purple, blue; cosmos → orange,
  black; mums → pink, green; pansies → blue, purple), for that whole day (`scene-garden` in localStorage).
- **The rock** (NH's rock, in front of the hedge by the jar's lid): a tap clonks it (a jolt, `scene-clonk`), 1 in 4 a
  sparkle (NH's money rock, without the money), 1 in 8 a pill bug or a centipede crawls out from under it.
- Weeds, dig spots and the rock are measured clear of the controls themselves on each screen (a spot a control covers
  isn't shown); a flower's tap cell is a reach away from every lawn spot. `?hybrid` (dev or `?demo`) shows one.

### Villager chats

`island/chat.ts`, `island/Talk.svelte`, `e2e/chat.spec.ts`. A tap on my villager keeps its hop (R9) and says a line in
NH's speech balloon (cream, a nameplate with my よびな, a tail to the speaker; 33 ms a glyph; ≥ 2.8 s), as close above
(else below) the head as fits, clear of every control and of its own ♪. The partner's tap still opens their card.
Lines follow the villager's NH personality (lazy, peppy, smug, cranky, normal, jock, snooty, sisterly: 12 each; special
characters 10 of their own), 3 in 10 about the day instead (the morning, the night, today's goals so far: 「目標 2つ
クリア！ あと すこし！」, never ベル), a sleepy one when the tap wakes them; never the same line twice in a row. Kid-friendly,
ja/en. The roster (personalities) loads on the first chat. One balloon at a time; a new tap replaces it.

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
  all four goals met, taps, waking, a low week (Thu–Sat), a sync problem, the harvest. They never fire
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
villagers (all 417 of NH + 23 special characters; roster `lib/villagers/roster.ts`, loaded with the picker; the
island draws through `lib/villagers/look.ts`: ids, facing, defaults goldie and anchovy), host (しずえ, たぬきち),
fruit, seasonal oaks, bushes, flowers, season particles, reactions, money, deco. Ours: sky, sea, ground, the jar, effects, marks,
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
(climbing a pentatonic run), a ふたりでぜんぶ week in the harvest → miles, 受け取る → fanfare, buy → purchase, villager/jar tap → pop, first open of
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
- **iOS session:** always `ambient`, like game music: it mixes with other apps' audio and follows the Ring/Silent
  switch (user decision). The Media Session tile names the tune; ▶ resumes only in front, ⏸ holds until the next tap.

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
