# Island Fund: design

What the client builds now: the screens, the island scene, motion, chrome, tokens and small screens. Tokens: `app/src/lib/styles/tokens.css` (+ element styles in `theme.css`). Art: `app/static/art/` (`manifest.json`, fetched by `app/scripts/fetch-assets.ts`). Decisions: official art [ADR 0018](../decisions/0018-official-art-public-site.md), Japanese-first UI [0007](../decisions/0007-japanese-first-ui.md), simplicity [0014](../decisions/0014-simplify-no-promises-no-cozy.md), no privacy settings or alerts [0016](../decisions/0016-no-privacy-no-alerts.md). Research: [ac-research.md](ac-research.md). History editing: [history-and-editing.md](history-and-editing.md). Older versions are in git (style guide v4.1, v5 direction, environment style, scale and ground; deleted in round 8).

Section letters (§0, §A, §S, §M, §T, §R) match the references in code comments.

**Direction.** It reads as *あつまれ どうぶつの森* at a glance: official NH renders (villagers, しずえ, trees, fruit, NookPhone tiles) standing on a **Pocket Camp–style diorama** that we paint in SVG/CSS to match them. NH's 2D UI patterns (dialogue box, choice list, map ribbon, NookPhone, Nook Miles+ cards) are the chrome. Bright and calm; night is soft periwinkle, never black.

**IP rule.** Official art only from `static/art/` through `<OfficialArt key alt size>`, with a fallback (our vector or `Silhouette`) so a missing file never breaks a screen. On-screen names follow the Japanese game: しずえ, しまフォン, ベル (icon only; amounts stay ¥). No Nintendo fonts or sounds. The repo and site are public for now (ADR 0018).

---

## 0. Simplicity budget (overrides everything)

- **No tab bar.** Two places: 島 and 旅の壺, plus the しまフォン (NookPhone) for everything else, the harvest overlay and sheets.
- **One focal point per screen** (島: this week's score; 旅の壺: the total) and **one primary action**, in the thumb zone.
- ≤ 40 Japanese characters of non-numeric text per screen. ≤ 3 cards per screen, ≤ 5 rows per card. One しずえ line (≤ 16 characters), and only when she has news.
- **Decoration and motion never add words.** Reactions and effects stand in for text, never beside it.
- Still removed (do not re-add): Sunday promises, のんびりデー / cozy days, the ふたり tab, the blocker question, privacy settings, notifications.

## 1. Screens

### 1.1 島 Island (`routes/+page.svelte`, `Hud.svelte`)

```
top+8    12:40 10/28(水)                    [NookPhone]     corner clock, plain text (date kept at 320)
         オフライン · タップで再接続                          sync chip, only when sync is not ok
top+56            ═══ 今週 43/100 ═══                         score ribbon (今週 dropped at 320)
         sky ── horizon ── sea
         island: hedge · my tree · jar + ¥ plate · partner's tree · flower beds
         me (left)                                partner (right)
bottom   [しずえ box, 2 lines (1 compact)] [はい][いいえ]     only with news
         [ 今夜のチェック ]  56 (48 compact)
```

- **Score ribbon:** a copy of the NH map's yellow title banner (yuzu, ribbon tails), Fredoka 24. The one focal point. It counts up after a check-in. Tap = きろく on this week.
- **Jar + plate:** a cream nameplate with the total, the scene's only label. Tap the jar → 旅の壺.
- **One action:** 今夜のチェック, full width, leaf green. A pending question (「筋トレでしたか？」) puts NH's choice list in the same slot.
- **しずえ** shows only for news: a pending question, harvest ready, payday, "grew", or the answer she just took. Her box lives in one fixed slot under the scene (`--chrome-below`, over the sea), so the island never moves when she speaks.
- **Sync errors are not しずえ's.** Offline or a failed refresh is the chip under the clock (tap = retry, `同期中…` while it runs). A failed save gets one banner and my villager's sheepish R17.
- **Taps:** my villager → check-in sheet; the partner → partner sheet; a tree canopy or its fruit row → the fruit detail bubble; the jar → 旅の壺; しずえ → finish the line / next / a hop. All are real `<button>`s with `aria-label`, ≥ 44px (villagers and jar ≥ 64px), ≥ 8px apart; the scene `svg` is `aria-hidden`. Decoration is never tappable.

### 1.2 旅の壺 Trip Jar (`routes/jar/+page.svelte`)

`◀ 島へ` pill + the NookPhone, then the hero: the jar + **¥146,200** (44) + `今週 ≈ ¥5,860`. Then two cream **Nook Miles+ cards in one skin**: the trip (`money/miles-ticket`, 次は 沖縄, a bar, `あと ¥3,800`; tap = the ladder) and ごほうび財布 (`phone/nook-shopping`, 使う; quiet until the purse can pay for the cheapest treat). Payday is a quiet cream banner with the bells icon. 使う and payday ✓ show at once but wait 5 s with もとに戻す before they are sent. No しずえ.

**島 ⇄ 旅の壺:** the jar squashes (R18), then the island jar morphs into the hero jar (View Transitions, `view-transition-name: jar`, 320 ms in / 280 ms back); without View Transitions, the same zoom as a CSS entrance; under reduced motion, a short crossfade (`client/jarTransition.ts`).

### 1.3 しまフォン NookPhone (`ShimaPhone.svelte`)

A NookPhone-screen sheet: status row (time · leaf · デモ in demo), title, and a 3-column grid of squircle tiles. Each app (`components/phone/*`) slides in from the right inside the phone with a ‹ back (focus returns to its tile).

| App | Tile | What |
|---|---|---|
| きろく | `phone/miles` (full tile) | History and editing: からだ / お金, week → day → edit ([history-and-editing.md](history-and-editing.md)). Lazy-loaded on first open |
| 使い方 | `phone/glyph-help` on yuzu | The four things to know, one card each |
| 村人 | `phone/passport` (full tile) | Pick my villager from the 10-villager roster, and its name |
| 言語 | `phone/glyph-chat` on mint | 日本語 / English |
| 同期 | `phone/rescue` (full tile) | When each of us last synced, いま同期 |

### 1.4 Sheets, harvest, pairing

- **One sheet skin** (`Sheet.svelte`, a native `<dialog>`): the chrome surface (cream; navy at night), radius 32, a lip, a tilted yuzu nameplate title, one CTA in a sticky footer lifted above the keyboard.
- **今夜のチェック** (`CheckinSheet.svelte`): my three habits for today (or yesterday, 48 h fill-in) as big toggles; each tap saves at once. 正月: eating is off.
- **Partner sheet:** their head icon, name, four fruit rings with real numbers (no /100 score), today's eating check-ins, and one action: ハイタッチ (R4 plays behind once it closes).
- **日曜の収穫** (`HarvestOverlay.svelte`, ≤ 60 s): a modal `<dialog>` (Esc = あとで). Steps: tally → rung reached (if any) → 壺に入れる → end card. The island stays visible behind a cool tint (`rgba(58,72,134,.18)` below the sky; `rgba(30,36,80,.16)` at night). しずえ's box, one card (rows: villager icon, the four fruit by ripeness, + ¥) and the CTA sit at the bottom. The jar total is the one big number; the purse is one line under it. The end card fills the jar and counts the total up (an item-get beat: the jar pops, a sparkle). No confetti over the numbers.
- **Pair / not set up** (`routes/pair`): `deco/airport` hero (hidden under 600px tall), しずえ + one line, paste the key (or `#key=` inside the installed PWA). Not set up: Tom Nook + the link to `?demo`.

## A. Official art map

WebP with alpha, already downscaled; never upscale past the manifest height. `<OfficialArt key alt size>`, `size` = rendered height; `alt=""` when decorative or labelled. Key helpers and the manifest (bundled at build time, without its source credits): `lib/art.ts`.

| Group | Keys (`static/art/<key>.webp`) | Where |
|---|---|---|
| Villagers | `villagers/<id>` (full body), `villagers/<id>-icon`; roster: goldie, raymond, bob, bunnie, judy, stitches, hamlet, molly, lily, dom | Scene, avatars, sheets |
| Host | `host/isabelle` (wave), `-stand`, `-winter` (cardigan, same canvas as `-stand`), `-icon`, `host/tom-nook` | Dialogue box, toasts, not-set-up |
| Fruit | `fruit/peach · coconut · apple · pear` | Ground fruit, rings, harvest rows |
| Trees | `trees/oak-spring` (blossom) · `oak-summer` · `oak-fall` · `oak-winter` | One hardwood per person |
| Bushes | azalea, hydrangea, hibiscus, tea olive (two colours each), camellia (two), holly | Back hedge (§S.3) |
| Flowers | red/yellow tulips, red/white roses, pink cosmos, purple mums, orange pansies | Flower beds (§S.3) |
| Season | `season/petal · maple-leaf · snowflake` | Particles |
| Reactions | 22 NH reaction-wheel icons (`reactions/<id>`) + `pose-viva` | しずえ's bubble, harvest, toasts |
| Money | `money/bells`, `leaf`, `miles`, `miles-ticket` | Amounts, payday, trip card |
| Phone | `phone/nookphone`, full tiles `miles · passport · rescue · nook-shopping`, glyphs `glyph-help · glyph-chat` | NookPhone (§1.3) |
| Deco | `deco/airport`, `deco/present` | Pair hero, balloon present |

Ours (no usable official art): sky, sun, moon, clouds, sea, ground, cliff, the jar, sparkles, hearts, notes, sweat, zzz, confetti, villager marks (`Mark.svelte`) and the UI sprites (`Sprites.svelte`). There are no official runtime textures: Nookipedia's ground, sea and sky images are screenshots with UI baked in.

## S. Island scene (`lib/components/island/*`)

### S.1 Structure

`IslandScene` = an elastic sky over a fixed-aspect **stage of 390 × 360 units (u)**, anchored to the bottom, with one NH-blue sea running from the horizon down under the island and behind the bottom chrome. The page gives the scene `--scene-h: 100dvh` and `--island-bottom = --chrome-below` (the tallest chrome state, kept stable); the stage's front beach (its last `TUCK_U` = 34u: sand, foam, nothing tappable) tucks under the top of that slot so the shore meets the dialogue. The HUD overlays the sky; clouds keep below it (`--cloud-lane`). Back to front: sky (sun/moon, stars, clouds, balloon, fireworks) · sea · ground · hedge · trees + ground fruit · jar + plate · flower beds · villagers · particles · one multiply tint (the jar, stars and fireflies stay above it).

**Painting rule ("Pocket Camp diorama").** Light from the upper left. Every ground, water and sky surface = one base fill + one gentle gradient (lighter toward the upper left and the distance) + one soft lower shade + sparse flecks. **No strokes and no offset lips on scenery** (the lip is a chrome idiom). Contact shadows are soft and radial in the colour of the surface. Gradients use `userSpaceOnUse` over each element's box.

### S.2 NH tile scale (`scene.ts`)

- **1 tile = 44u** wide; **1 row = 31u** deep (NH's camera foreshortens depth to ≈ 0.7). Columns centred on the jar: `col(k) = 195 + 44k`, k = −3…3.
- Row bases: hedge 80 · trees + jar 173 · bed back 266 · front 297. Orthographic: depth comes from rows and z-order, not shrinking.

| Element | Size | Place | px at 393 / 320 |
|---|---|---|---|
| Villager (the reference, ≈ 1.8 tiles) | 80u | cols ±1, front row | 93 / 74 |
| Hardwood (≈ 1.5 villagers) | 120u | cols ±2 (x 107 / 283), tree row | 139 / 110 |
| Bush (1 per tile) | 48u | cols −3…3, hedge row | 56 / 44 |
| Flower (0.4 villager) | 32u (pansies 0.8×, mums 0.92×) | cols ±2/±3, bed rows | 37 / 29 |
| Ground fruit (≈ 0.3 villager) | 24u | half-tile pitch at the trunk | 28 / 25 |
| Jar (≈ 1.2 tiles, legible coins and plate) | 52 × 65u | col 0, tree row, on a sand plaza | 60 / 48 wide |

### S.3 Environment

**Framing.** An organic rounded plateau (grass x 44–346u, y 50–316u) with a sand crescent around it (x 30–360u, down to y 352u), so sea shows on both sides at every width. Horizon at stage y 8u: a narrow open-sea strip behind the island.

**Sky** (`Sky.svelte`): a 3-stop gradient (top · mid at 55% · horizon) bleeding under the status bar.

| Time of day | Top | Mid | Horizon |
|---|---|---|---|
| Day | #4AA3F6 | #79C9FC | #C6EEFF |
| Dawn 05–07 | #7FA8E8 | #F6C3B4 | #FFE6CC |
| Dusk 16–19 | #5B6FC4 | #F59A86 | #FFD39A |
| Night 19–05 | #1F2C66 | #34478F | #5A6CB4 |

Season shifts (day only): summer top #2F92F0; autumn horizon #E8F2EE; winter #8EC2EE / #BFE0F8 / #EEF7FF.

- **Sun:** upper left (left 18%, 58% down the band; dawn/dusk 22% above the horizon), one radial glow: #FFFEF2 core, #FFE989 ring (dawn/dusk #FFF3D6 / #FFB36B). Drawn above the clouds.
- **Moon:** same place, crescent #FFF4C8 with a soft glow; 10 stars, 2 twinkle.
- **Clouds** (`Clouds.svelte`): two, round lobes on an elliptical base, one vertical gradient (white to 55%, #E8F2FC, #D2E3F5 underside; dawn/dusk/night undersides tinted; night at 0.6). 140 / 100 s drift. 120 / 86px at 393, 100 / 72 compact, 64 / 48 at 320. Lanes keep them off the sun; short skies rest them at the horizon.

**Sea** (`Sea.svelte`): one layer, a 4u haze #8EDDF5, then #4C9DE8, then open **#3D8FE2**. White 6 × 1.5u glints at 40% (≈ 2% coverage, denser near the horizon); their slow drift is the one sea animation. The chrome under 島 is the same open sea through the same tint (`--sea-flat`: day #3D8FE2, dawn #3D81C1, dusk #3D78A3, night #255CC5).

**Ground** (`Ground.svelte`), back to front: a turquoise shallow ring #5ED8E8 fading outward · a second foam line 7u out at 45% · a 2.5u foam line on the beach edge · a 5u wet band #E2B66E · the sand crescent (radial #FCE7AE → **#F4D184**) · a soft shade at the cliff foot · the terracotta cliff (12u at the front, 6u at the sides; #DDA472 → **#B97A50**, two faint strata) · a 3u grass overhang with a soft shade on the cliff top · the grass · the plaza under the jar · contact shadows.

| Season | Grass | Highlight | Fleck light | Fleck dark |
|---|---|---|---|---|
| Spring (Feb 25–May 31) | #7CC95A | #9BD970 | #A8E07A | #5EAE47 |
| Summer (Jun 1–Sep 15) | #5DBE4A | #7CCF5E | #8ED96C | #46A23A |
| Autumn (Sep 16–Dec 10) | #A8C457 | #C2D46E | #D9C26A | #8AA845 |
| Winter (Dec 11–Feb 24) | #F5F8FF | #FFFFFF | snow dimples | shade #B9C8E6 |

Grass: a radial highlight at (30%, 25%), broad blurred tonal patches, and NH leaf triangles ≈ 0.2 tile, squashed to 0.7 depth, on a seeded jittered tile grid (≈ 2.4 cells per tile, 62% filled, two opacities per tone; no repeat). Winter: snow dimples, scalloped snow over the cliff edge, sand #EEE6D4.

**Contact shadows:** radial, fading to 0, offset slightly right and down. On grass `rgba(34,74,28,.32)`, on sand `rgba(140,98,40,.28)`, on snow `rgba(80,110,160,.25)`. Dusk stretches them ×1.25 to the right.

**Hedge** (`BackRow.svelte`): one species per month in two alternating colours, one bush per tile: Apr–May azalea, Jun hydrangea, Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly, Jan–Mar camellia. Snow on top in winter. No buildings, benches, paths, palms or shells.

**Flower beds** (`FlowerBeds.svelte`): two 2 × 2 beds mirrored about the jar (col 0 stays open for strolls). Spring red / yellow tulips · summer red / white roses · autumn pink cosmos / purple mums · winter red roses / orange pansies with snow caps.

**Trees and fruit** (`FruitTree.svelte`): one plain seasonal oak per person (blossom Apr 1–10, green, fall leaves Oct 16–Dec 10, snow). The week's fruit lies on the ground in front of the trunk, 🍑 🥥 🍎 🍐 left to right: per kind 0–3 items = thirds of that kind's target; a kind with nothing yet shows one faded item. A new item makes the tree shake (±4°, 3 swings, 500 ms) and drops in with a bounce. Under 360px wide: one item per kind, sized by its count.

**Jar** (`Jar.svelte`, one drawing for the island, the 旅の壺 hero and the harvest end card): glass #DDF2FB with an upper-left white streak and a lower-right shade, a coin stack up to the fill line, a yuzu lid with a leaf, no outline.

**Time of day = one multiply tint** over land and sea: dawn #FFE6DA, dusk #FFD7B8, night #9AA4DE. Season comes only from the palette tables.

### S.4 Particles and events

≤ 3 particles, one animation each (official art): petals while the blossoms are out, maple leaves once the oaks turn (more in maple week), snow in winter; summer nights get our fireflies. Japan-date events (`eventsAt`): cherry blossom Apr 1–10, maple week Nov 16–25, fireworks on August Sundays after 19:00 and New Year's Eve, Toy Day presents Dec 24, plus the balloon present (ours + `deco/present`; tap = pop).

### S.5 Performance

- Animate only `transform` and `opacity`. CSS keyframes only; JS schedules idle life and events, no rAF loop.
- **Pause** everything when the tab is hidden (`data-paused` on `.if-scene`); a sheet or the overlay also pauses particles and idle life.
- Trees, fruit, particles and villagers load `eager`, everything else lazy. Target: 60 fps on an iPhone SE 2 in Safari, no long task > 50 ms from the scene after load.

## M. Motion and expression

### M.1 Rig (`Villager.svelte`, `Host.svelte`)

`.actor` (position; `--walk-x` while strolling) › `.face` (`scaleX` = facing; `if-turn`) › `.body` (origin at the feet; idle loop or one motion) › `<OfficialArt>`. The emote and fx are siblings of `.face`, so they never squash or mirror. Squash and stretch conserve volume and stay ≤ 14%. Every motion starts and ends at `transform: none`, so a new one preempts cleanly. The stage director (`motion/director.svelte.ts`) holds one state per actor (mine, partner, しずえ).

### M.2 Motion primitives (`tokens.css`, prefix `if-`)

`squish` 220 · `hop` 600 · `hop2` 900 · `wiggle` 700 · `turn` 1400 (a lean toward the middle and back, no mirror flip) · `nod` 520 · `laugh` 620 · `surprise` 420 · `shy` 1000 · `stretch` 1400 · `proud` 900 · `dance` 1600 · `shake` 480 (trees) · `bow` 1100 (しずえ; there is no official bow render, so the `-stand` render dips) · `headshake` 600 · `talk` (while her line types) · `bob` (idle) · `breath-slow` (asleep). Durations live in `MOTION_MS` (`reactions.ts`) and must match the keyframes. Strolls walk ≤ 40u toward the jar and back (`--dur-walk` 1600 ms), never crossing it.

### M.3 Emotes and marks

- **Villagers never show the player's cat-face reaction icons.** They get our floating marks (`Mark.svelte`: ♪ ! ? 💦 ♥ ✦ zz) or the official colour glyphs (love, surprise, glee, inspiration, curiosity, thought, daydreaming), with no bubble.
- **しずえ** gets the cream emote bubble (`Emote.svelte`) with the official icons, at the top right of her render.
- Pop 360 ms, hold, out 200 ms (`--dur-emote` 2200 ms). One per actor; a new one replaces the old.

### M.4 Effects (`Fx.svelte`, ours)

sparkles 700 ms · hearts 1200 · notes 1100 · sweat 900 · zzz (loops while asleep) · confetti 1600 · puff 500 · glint 600. Colours `--fx-*`. `pointer-events: none`, `aria-hidden`, removed on end.

### M.5 Reactions (`REACTIONS` in `reactions.ts`)

Events preempt idle life. R1 first open of the day · R2 check-in saved · R3 the partner's new data · R4 high-five sent · R5 high-five received · R6 a fruit ripe · R7 a fruit stage up · R8 all four ripe · R9/R10 tap mine / partner · R11 morning stretch · R12 evening nudge (I haven't checked in) · R13 fall asleep (22–05) · R14 woken up · R15 low week (thought, never sad) · R16 dance together (both ≥ 80) · R17 sync problem · R18 jar tapped (both turn to the jar) · R19 harvest. Diff events (R3, R6–R8) come from comparing the previous and next `view` and never fire on first render or a cache restore. Pages call `emit('open' | 'checkin-saved' | 'highfive-sent' | 'highfive-received' | 'sync-error')` (`motion/bus.svelte.ts`).

### M.6 しずえ

Outfit: aloha shirt outside winter, the cardigan (`-winter`) in snow season; never mixed. Poses: wave (cheer), stand (calm), bow (thanks / sorry). She talks (`if-talk`) while her line types, hops for greetings and check-ins, bows for the harvest, head-shakes for errors, and breathes slowly at night. Pose swaps crossfade over 160 ms after `img.decode()`.

### M.7 Idle life (`motion/idleLife.svelte.ts`)

One scheduler per live scene, in the background: every **9–15 s** one actor does one small thing (look, wiggle, hop, stroll, peek into the jar, tree shake, chat, dance together, morning stretch); しずえ swaps pose, wiggles or hops at most every 20–30 s. **No emotes or fx in idle life:** those mark events. Evening (19–22): only the quiet ones. Asleep (22–05): the villagers only doze. After 3 min without input the gap is 25–40 s; after 10 min it stops until the next touch. It pauses while hidden, under a sheet or overlay, and under reduced motion.

**Idle budget ≤ 10 running animations:** breathing ×2, しずえ, clouds, sea glints, ≤ 3 particles, ≤ 2 twinkles. Events play one at a time.

### M.8 Reduced motion

Loops, hops, walks and dances off; emotes fade in over 120 ms and hold; fx collapse to one static icon; pose swaps are instant; the jar transition is a crossfade; the dialogue text appears at once. The scene still shows season and time of day.

## T. Chrome (NH 2D UI)

- **Dialogue box** (`Bubble.svelte`): wobbly cream box (cream at every time of day), a tilted yuzu nameplate that pops in after it, letter reveal at 33 ms/char (tap to finish), amber ▼ only when another page follows. It holds `--talk-lines` lines (2; 1 compact) and never grows. しずえ stands on its left, feet on its baseline. The real text is in an `aria-live` node.
- **Choice list** (`ChoiceList.svelte`): cream pills stacked at the right; a yuzu ▶ cursor starts on はい and follows hover, focus and ↑/↓.
- **Banner** (`Toast.svelte`): NookPhone-style, below the status row, in the top layer (inside the open sheet's `<dialog>` when there is one). A 36px icon on a pebble (the partner's villager for partner events, しずえ otherwise), one line ≤ 16 characters, one reaction icon or an action (もとに戻す). Tap or swipe up to dismiss; one at a time.
- **Nook Miles+ card:** one cream skin for the trip and the purse.
- **Buttons:** a light fill with ink text (≥ 5:1), radius 16, a 4px lip, a squash on press.
- **Fonts:** Zen Maru Gothic (UI, 500/700, subset in `fonts.css`) + Fredoka (numbers only, 600/700). Rounded and close to NH's type; no Nintendo fonts.

## Tokens (`tokens.css`)

**Palette (12):** ink `#4A3A2C` / `#6B5544` · cream `#FFF9E3` · paper `#FFF3D6` · lip `#E0C48A` · leaf `#6ED07A` / `#4FB35C` (the action) · yuzu `#FFD84D` / `#E6B22E` (the focus: ribbon, nameplates) · map mint `#7BD7C1` / `#63B4B5` · coral `#FF8F7A` (errors only). Components use the semantic tokens (`--bg --surface --lip --text --text-soft --hud --focus --scrim`). Scene and fx colours are separate (`.if-scene` block, `--fx-*`, `--jar-*`).

**Type:** `12` · `15` body · `18` talk/button · `24` title/score · `44` hero. Weights 500/700. `palt`, `tabular-nums` in lists.

**Radius:** `8` chips · `16` buttons · `24` cards/dialogue · `32` sheets/phone · `30%` tiles · pill only for the ribbon, the plate and the choices.

**Depth:** no strokes. Chrome = one 4px lip (`--lip-h`, `--sh-lip`). `--sh-float` only on floating layers (the banner). Things on the ground get a contact shadow (§S.3).

**Motion:** `--ease-bounce`, `--ease-soft`, `--ease-squash`, `--ease-idle`; `--dur-tap` 90 · `quick` 140 · `base` 260 · `pop` 360 · `slow` 600 · `emote` 2200 (reduced motion: 0 / 120 ms, emote 1600).

### T.7 Time of day sets the theme

`data-tod` on `<html>` comes **only from the clock** (dawn 05–07, day 07–16, dusk 16–19, night 19–05; `client/season.ts`); `prefers-color-scheme` is ignored. Previews: `?theme=night|day`, `?season=`.

| tod | Chrome | Lip | HUD text | `theme-color` |
|---|---|---|---|---|
| dawn, day | cream / ink | `#E0C48A` | `#33261B` | sky top |
| dusk | `#FFF1DC` / ink | `#E8B98A` | white | sky top |
| night | `#3A4886`, surface `#45559A` / `#FFF6E0` | `#2E3A72` | `#FFF6E0` | `#3A4886` |

The ribbon, plate, dialogue box and choices are game objects and stay cream/yellow at every time of day.

## R. Small screens

- **Breakpoints:** compact = `(max-height: 700px) or (max-width: 359px)`; tiny = `(max-width: 339px)`. Portrait only; wider screens centre a `--col: 480px` column with the sky full-bleed.
- **Compact:** gap 8, action 48, 1 dialogue line, talk 16px, NookPhone tiles 56 / gap 14. **Tiny:** side padding 14, tiles 52 / 12, the ribbon drops `今週`.
- **Global:** side padding 18, `100dvh` (never `100vh`), no horizontal scroll at 320, text ≥ 11px, inputs ≥ 16px (no iOS zoom), targets ≥ 44px and 8px apart, `overscroll-behavior: none`; sheets scroll internally. The keyboard inset `--kb` comes from `visualViewport`; sticky footers lift by it and focused inputs scroll to the centre.
- **島:** `--chrome-below` = dialogue (`--talk-lines`) + 8 + action + lip + gap + safe bottom: one constant per viewport (≈ 180px at 393×852, ≈ 138px at 375×667 and 320×568). The scene keeps its full height; the chrome sits on the sea.
- **Scene per viewport:**

| Viewport | Horizon | Stage (1u) | Plateau on screen |
|---|---|---|---|
| 393×852 | 179px | 479px (1.23px) | 6–387px |
| 375×667 | 140px | 375px (0.96px) | 38–336px |
| 320×568 | 109px | 320px (0.82px) | 33–287px |

- **Sheets:** `max-height: calc(100dvh − safe-top − 24px)`; check-in rows ≥ 56 (52 compact), labels may wrap to 2 lines at 320 but targets never shrink below 44. The NookPhone sheet is full height minus the status bar; labels ≤ 5 Japanese / 10 Latin characters, never ellipsized; the 村人 roster wraps.
- **Harvest:** fixed, padded by the safe areas; a `max-width: 420px` column; the CTA sticky at the bottom.
- **Check:** 393×852, 375×667 and 320×568, at day, dusk, night and winter.
