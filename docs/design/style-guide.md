# Island Fund: Style Guide v2 (AC-inspired revamp)

Owner: UI/UX Designer · Status: **v2** (2026-10-28) · Tokens: `app/src/lib/styles/tokens.css` · Research: [ac-research.md](ac-research.md) · Reference images: `.refs/` (local only, git-ignored) · Previous: v0.4 [mockup.html](mockup.html)

**Direction.** A cosy island you hold in your hand, in the spirit of あつまれ どうぶつの森: chunky toy-like UI, wobbly cream speech bubbles with tilted name tags, a phone with bright squircle apps, seasonal checkered grass, and big-headed villagers that bob and pop emotes. **Everything is drawn by us.** IP rule: no Nintendo characters, art, icons, sounds, fonts or names (no "Nook", "Isabelle", "NookPhone", "Bells", "Miles"). Our names: **しまフォン** (phone), **リーフコイン** (leaf-coin icon; the currency is plain ¥).

## 0. Simplicity budget (unchanged; it overrides everything)

3 tabs max (島 · 旅の壺 · ふたり) + the Sunday overlay · one primary action per screen, in the thumb zone · ≤ 40 Japanese characters of non-numeric text per screen · one hero number per screen · ≤ 3 cards per screen, ≤ 5 rows per card · icons first, labels on tap · explanations go in しまフォン → 使い方 · one Juniper line (≤ 16 characters) per screen · banned tone words per PROPOSAL §3.8. **Decoration never adds words.**

---

## 1. Colour

All values live in `tokens.css`. Use **semantic tokens** in components (`--bg --surface --edge --text --text-soft --bubble --lip --stitch`) so night mode works for free. The v0.4 names (`--leaf`, `--paper`, `--ink`…) still work.

### 1.1 Core (day)

| Token | Hex | Use |
|---|---|---|
| `--c-cream` | `#FFF8E7` | App background (with `--pat-dots`) |
| `--c-bubble` | `#FFFBEA` | Speech-bubble fill. Warm off-white, never `#fff` |
| `--c-paper` / `--c-paper-2` | `#FDF1D6` / `#F6E6C1` | Card / card lip and pressed paper |
| `--c-stitch` | `#DCC79B` | Dashed stitching inside cards |
| `--c-ink` | `#4A3A2C` | Text and all outlines |
| `--c-ink-talk` | `#6A5641` | Bubble text (6.7:1 on the bubble, 6.0:1 on the night bubble) |
| `--c-leaf` / `-lip` / `-soft` / `-ink` | `#7BC67E` `#5FA862` `#BFE5B9` `#2E6B38` | Primary button, its lip, success fill, green text |
| `--c-yuzu` / `-lip` / `-soft` | `#FFD66B` `#E3B23C` `#FFF0BF` | Juniper name tag, celebration button, highlights |
| `--c-coral` / `-lip` / `-soft` / `-ink` | `#FF9B87` `#E07F6B` `#FFD9CF` `#B04A3B` | ごほうび財布 (treat purse) |
| `--c-sky` / `-lip` / `-soft` / `-ink` | `#8FD3F4` `#5FB3DD` `#DDF2FB` `#2F6F96` | Info, sync |
| `--c-amber` | `#F5A623` | ▼ "next" arrow |
| `--c-coin` / `-rim` / `-shine` | `#F7C548` `#D9962A` `#FFF1B8` | Leaf-coin |
| `--c-blush` | `#FF9E8F` | Villager cheeks (opacity .7) |
| `--c-emote-blue` | `#4D7CF2` | "!" emote only |

Buttons are always **light fill + brown ink text** (≥ 5:1). Never white text on a saturated fill.

### 1.2 Night (19:00–06:00 or system dark): `[data-theme="night"]`

`--bg #1F2A44`, `--surface #33456B`, `--edge #4A5E8A`, `--text #F7EEDB` (12.4:1), `--text-soft #B9C3DA`, `--bubble #F7EEDB` (bubble text stays `--c-ink-talk`), accent `--moon #F6E7B0`, lip `#18213A`, stitch `#5A6F9C`. Night buttons use `--c-moon` with lip `--c-moon-lip`.

### 1.3 Scene palette (season × day/night)

Set on `<html>` by `lib/client/theme.svelte.ts`: `data-season` by month (Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter), and `data-tod` (dawn 05–07, day, dusk 16–19, night). Test with `?season=winter&theme=night`.

| Token | Spring | Summer | Autumn | Winter | Night (spring / summer / autumn / winter) |
|---|---|---|---|---|---|
| `--grass` / `--grass-2` (checker) | `#8DD16A` / `#80C55E` | `#5DBB4F` / `#52AE45` | `#B5C25A` / `#A6B44E` | `#F4F7FA` / `#E4ECF4` (snow) | `#3E6B52` · `#2F5E45` · `#5B6040` · `#8C9DB8` |
| `--grass-edge` (cliff band) | `#5EA448` | `#3E8E3A` | `#7F8C3A` | `#B9CADD` | `#2A4B3A` (winter `#62759A`) |
| `--tree-leaf` / `-2` | `#6CBF5A` / `#55A84A` | `#3FA34A` / `#318A3D` | `#E89A3C` / `#D2763A` | `#4F8F6A` / `#3F7A59` + snow caps | darkened per season |
| `--season-accent` | blossom `#FFC2D4` | sun `#FFE27A` | leaf `#E8643C` | snow `#FFFFFF` | |
| `--sea` / `--sea-deep` | `#6FCBE8` / `#4FB3D6` | `#3FB8DE` / `#2A9CC8` | `#5BB3CF` / `#4298B8` | `#6AA9C9` / `#4F8FB2` | `#2B3A5C` / `#22304D` |
| `--beach` | `#F1E2B8` | `#F4E3B0` | `#EAD9AE` | `#E6E1D3` | `#4A5E8A` |

| Sky `--sky-top → --sky-bottom` | |
|---|---|
| dawn | `#F9C9A8 → #D5ECF5` |
| day (spring) | `#9FDCF7 → #E4F6FD` (summer `#6FCBF5 → #C9EEFC`, autumn `#A7D5EE → #F3E9D2`, winter `#BFD9EC → #EEF4F8`) |
| dusk | `#F4A27C → #FBE3B6` |
| night | `#16203A → #2B3A5C` + stars + moon |

Fruit (`--f-peach #FFB38A`, `--f-coconut #9C6B45`, `--f-apple #FF8A7A`, `--f-pear #C9DE6E`) and partner colours (`--p-plum`, `--p-apricot`, `--p-mint`, `--p-berry`, `--p-lemon`) are unchanged from v0.4.

---

## 2. Typography

| Role | Family (OFL, fontsource) | Weights | Token |
|---|---|---|---|
| UI, Japanese, Latin text | **Zen Maru Gothic** | 500 body · 700 bold · **900 headings** (new) | `--font-ui` |
| Numbers, ¥, scores | **Fredoka** | 500 · 600 · 700 | `--font-num` |

No other packages. The stack falls back per glyph, so `¥146,200` in `--font-num` renders the digits in Fredoka. `font-feature-settings: "palt"`, `letter-spacing: 0` for Japanese, `tabular-nums` in lists.

| Token | Size / line height | Family · weight | Use |
|---|---|---|---|
| `--fs-hero` | 2.75rem / 1.05 | num 700 | Jar total, harvest total |
| `--fs-h1` | 1.75rem / 1.15 | ui **900** | Screen titles |
| `--fs-h2` | 1.25rem / 1.2 | ui 900 | Card titles |
| `--fs-talk` | 1.0625rem / 1.5 | ui 700, `--c-ink-talk` | Speech bubbles |
| `--fs-body` | .9375rem / 1.45 | ui 500 / 700 | Default |
| `--fs-tag` | .8125rem / 1 | ui 700 | Name tags, pills |
| `--fs-caption` | .8125rem / 1.35 | ui 700 | Meta |
| `--fs-micro` | .6875rem / 1.2 | ui 700 | Dock labels |

---

## 3. Shape, elevation, patterns

**Radii:** `--r-sm 14` inputs · `--r-card 22` cards · `--r-lg 28` sheets · `--r-phone 44` しまフォン · `--r-pill` buttons · `--r-squircle 30%` app tiles · `--r-bubble` (wobbly: `34px 46px 38px 42px / 40px 34px 46px 40px`) · `--r-blob` pebbles. **Borders** 2px (`--bw`).

**Elevation:** the signature is the **solid lip**, a 0-blur offset shadow in a darker shade of the fill (`0 5px 0 var(--c-leaf-lip)`), plus `--sh-btn-hi` (a 2px inner top highlight). Floating things add `--sh-soft` / `--sh-float`. Under villagers and trees: an ellipse filled with `--sh-ground`.

**Patterns** (opacity ≤ 7%, never behind body text without a paper card):

| Page | Background |
|---|---|
| 島 | Scene fills the top; below the horizon `--bg` + `--pat-dots` |
| 旅の壺 | `--bg` + `--pat-stripes` (sand diagonals) |
| ふたり | `--bg` + `--pat-dots-pink` |
| Sunday overlay | Night + `--pat-stars` |
| Progress fills | `--pat-stripes-fill` animated 32px/s (stops under reduced motion) |

---

## 4. Components (Builder B unless noted)

### 4.1 Speech bubble `Bubble.svelte`
- **Box:** fill `--bubble`, radius `--r-bubble`, **no border**; `box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-soft)`; padding 18px 20px 16px; min-height 64px. Text `--fs-talk` 700 `--c-ink-talk`.
- **Name tag:** a pill at `top: -14px; left: 18px`, `rotate(-4deg)`, padding 5px 12px, `--fs-tag` 700 `--c-ink`, fill = speaker tag colour (`--tag-juniper` for Juniper, `--tag-<partnerColour>` for villagers), lip `0 2px 0` 15% darker. It pops in 120ms after the box.
- **Tail:** a 16px rounded triangle on the side facing the speaker, same fill, no stroke. Omit it when the speaker isn't on screen.
- **▼:** 14×10px rounded triangle in `--c-amber`, centred at `bottom: -6px`, `if-nudge 700ms infinite`. Show only when typing has finished **and** another page follows (tap = next page). Single-page lines don't show it.
- **Letter reveal:** each glyph is a `<span>` animated with `if-letter 120ms` at `--type-ms` (33ms) intervals. Add `--type-pause` after 。！？!? and half after 、,. Tapping the bubble finishes instantly. The real text sits in a visually hidden `aria-live="polite"` node; the animated spans are `aria-hidden`. Reduced motion: no reveal.
- **Entry:** the box scales from 0.6 at the tail corner to 1 with `--ease-bounce` over `--dur-pop`.

### 4.2 しまフォン: dock + launcher
- **Dock (tab bar):** floating slab, `width: min(100vw, var(--col)) - 24px`, height 72px (`--tabbar-h` goes to 72 when this lands), fill `--phone-bg`, 2px `--phone-edge`, radius 30px, `--sh-float`. Three **app tiles**, 48×48, radius `--r-squircle`, fills `--app-island` / `--app-jar` / `--app-us`, glyph 28px in `--c-ink` (flat silhouette with one white or accent detail, no outline). Label `--fs-micro` below.
  - Active: tile `translateY(-6px) scale(1.08)`, a 3px `--c-ink` dot under the label, label `--text`.
  - Inactive: label `--text-faint`.
  - Tap: squash (§4.3).
- **Launcher:** the top-right "?" becomes a 44px **phone button** (rounded-rect phone glyph). It opens a bottom sheet shaped like a phone: radius `--r-phone`, fill `--phone-bg`, status row (`19:30` · leaf-coin · season glyph) in `--fs-caption`, the focused app title at `--fs-h2` 900, and a **3-column grid** of 64px tiles with 18px gaps and labels under. Apps: 使い方 (`--app-help`, the current help text), 村人 (`--app-villager`: species, colourway, name), 言語 (`--app-lang`), お知らせ (`--app-bell`), 同期 (`--app-sync`). Each opens its panel inside the phone with a ‹ back. These move out of ふたり, so ふたり keeps partner, promises and のんびりデー only.

### 4.3 Chunky button `.btn`
Pill, min-height 56px (small: 44px), padding 0 24px, `--fs-body-lg` 700 `--c-ink`, fill + lip: `box-shadow: var(--sh-btn-hi), 0 5px 0 <lip>`.
- **Press** (`:active`, `--dur-tap`, `--ease-squash`): `translateY(4px) scale(1.03, .94)`, lip → `0 1px 0`.
- **Release:** back to 1 with `--ease-bounce` over `--dur-base`.
- Variants: `leaf` (primary), `yuzu` (celebrate/confirm in harvest), `coral` (purse), `moon` (night primary), `paper` (quiet: `--surface` + 2px `--edge` + `--sh-lip`).
- An optional 26px icon goes on the left. Disabled: opacity .55, no lip.

### 4.4 Paper card `.card`
`--surface`, 2px `--edge`, radius `--r-card`, `--sh-lip`, padding 16px. **Stitching:** `outline: 2px dashed var(--stitch); outline-offset: calc(-1 * var(--stitch-gap))`. Optional **label tape**: a pill on the top edge (like a name tag, rotate -3deg, `--c-yuzu-soft` or a partner tag colour) for card titles instead of an in-card heading. Row dividers: `2px dashed var(--stitch)`.

### 4.5 Leaf-coin counter (Builder A draws the coin, B the pill)
**Coin** (`LeafCoin.svelte`, viewBox 24): a circle r10 in `--c-coin`, 2px rim in `--c-coin-rim`, an inner ring r7.5 at 40% rim opacity, a **¥** glyph built from strokes (2px `--c-coin-rim`), a sprouting leaf (8×5 `--c-leaf`, outline `--c-ink` 1.2) at 1–2 o'clock on the rim, and a shine crescent `--c-coin-shine`.
**Pill:** coin 22px + `¥146,200` in `--font-num` 600, cream fill, 2px `--edge`, lip 3px. When the value changes, digits count up over `--dur-slow` and the coin plays `if-coin` once.

### 4.6 Sheets, chips, switches
- **Sheets:** radius `--r-lg` top only, `--surface` + `--pat-dots`, a 40×5 grabber, enter `translateY(100%) → 0` over `--dur-base` `--ease-soft`, then a 1.5% overshoot bounce.
- **Chips:** pill, 44px high; selected = `--c-leaf-soft` + `--c-leaf` border.
- **Switch:** 60×36 pill; the knob is a 28px cream circle with a lip, and on tap it squashes to `scaleX(1.25)` mid-travel.

### 4.7 Emote bubble (Builder A)
A white (`--c-bubble`) round bubble, 30u in diameter, with a 6u tail pointing down, floating 10u above the head top. Its symbol is drawn in the brand colours: ♪ (cheer, `--c-leaf-ink`), ! (surprised, `--c-emote-blue`), z z (sleepy, `--c-sky-ink`), ✦ (proud, `--c-amber`), ♥ (high-five, `--p-berry`). Animation `if-emote` over `--dur-emote`. Max one per character at a time.

---

## 5. Island scene composition (Builder A) `IslandScene.svelte`

viewBox `0 0 390 540`, scaled to container width; the sky bleeds under the status bar.

| Layer (back → front) | Spec |
|---|---|
| Sky | Linear gradient `--sky-top → --sky-bottom`, y 0–330. Day: sun disc r20 + halo r30 at (336, 96); 2 clouds drifting 60s. Night: moon crescent + 8 twinkling stars. Dawn/dusk: warm gradient + `--scene-dim` multiply overlay |
| Sea | Rect from y 300 in `--sea`, darker band `--sea-deep` at y 300–312 (horizon), 4 foam arcs moving ±4px over 3s |
| Island | **Curved horizon:** the top surface is a wide ellipse (cx 195, cy 430, rx 186, ry 92), so the ground visibly rolls away like the game's curved world. Below it a **cliff band** 12u tall in `--grass-edge`, then the beach ring (rx 196, ry 100) in `--beach` with a `--beach-edge` 3u stroke |
| Grass | Fill with an SVG `<pattern>` 28×28 checker of `--grass`/`--grass-2`, `patternTransform="translate(195 430) scale(1 .55) rotate(45)"`, so it reads as diamond checker in perspective. Sprinkle 6 tiny 5-petal flowers (r3, white/`--p-berry`/`--c-yuzu`) and 4 grass tufts |
| Trees (×2) | Trunk 18×70u, `--trunk`, slight taper, root flare. Canopy = **5 overlapping circles** (r 34–46) in `--tree-leaf` with a `--tree-leaf-2` underside crescent and 2 highlight blobs (white 18%). The 4 fruit rings hang on the canopy in a 2×2 grid, each with a 6u leaf on top so they read as fruit. Sway ±1.2° over 5s, origin at the trunk base, trees offset −2s. Seasonal: spring = 6 blossom dots on the canopy + petals drifting (≤ 8 particles); autumn = orange canopy + 4 falling leaves; winter = white snow cap paths on the top 3 circles + 12 snowflakes; summer = none |
| Jar | Centre (195, 405), 54×66u, coins visible, lid `--c-yuzu`; tap = `if-wiggle` |
| Villagers | Each stands on the grass at its tree's foot, 64u tall (full body), ground shadow ellipse rx 18 ry 4 `--sh-ground`. Idle `if-bob` `--dur-idle`, offset −1.2s. Tap partner = cheer + ♥ emote (high-five) |
| Scores | Hero scores under the trees in HTML (B lays them out on top of the SVG) |

Juniper sits **outside** the scene, beside the speech bubble (§4.1), 72px.

---

## 6. Motion

| Thing | Duration | Easing | Detail |
|---|---|---|---|
| Button press / release | 90 / 260ms | squash / bounce | scale(1.03, .94) + 4px down |
| Pop-in (emote, badge, fruit full) | 360ms | bounce | `if-pop` 0 → 1.15 → 1 |
| Bubble open | 360ms | bounce | from the tail corner |
| Letter reveal | 33ms/char | — | pause 180ms at 。！？ |
| Sheet | 260ms | soft | + 1.5% overshoot |
| Villager idle bob | 2400ms loop | idle | translateY −2%, scale(.985, 1.015) |
| Cheer / surprised hop | 600ms ×1 | — | `if-hop` (anticipation squash → stretch → land squash) |
| Juniper's yuzu | follows her body 80ms late | bounce | follow-through, ±4° |
| Tree sway | 5s loop | idle | ±1.2° |
| Coin count-up | 600ms | soft | + `if-coin` |
| Harvest steps | 1200ms each | soft | as v0.4 |

**Squash and stretch rule:** volume is conserved (scaleX × scaleY ≈ 1), always with `transform-origin: 50% 100%` for characters, and never more than 14% deformation.

**Reduced motion** (`prefers-reduced-motion: reduce`, handled by tokens + theme.css): no loops (bob, sway, drift, nudge, stripes), no letter reveal, no particles, no hops. Press = colour/lip change only; pops become 120ms fades. Emotes still appear (static) for 1.6s because they carry meaning.

---

## 7. Villager character system (Builder A)

### 7.1 Shared chibi body: `viewBox="0 0 100 120"`, ground line y = 116

| Part | Geometry (units) |
|---|---|
| Head | Ellipse cx 50, cy 40, rx 36, ry 32 (y 8–72). Species may vary rx 34–40 / ry 28–33 |
| Torso | Bell path, top width 34 (x 33–67) at y 68, bottom width 44 (x 28–72) at y 106, corners r 8. Fill `--v-shirt` (default = partner colour) + optional pattern (stripes / dots / leaf print, 2 colours max) |
| Arms | Capsules 10×22, pivot at the shoulders (31, 74) / (69, 74), rest angle ±18° outward. Coat colour; the hand is the rounded end (no fingers) |
| Legs | Capsules 11×12 at x 37 / 52, y 104–116, coat shade colour |
| Tail | Species-specific, behind the torso at (66, 100) |
| Outline | `--v-line` 2.6u, round joins, on the silhouette only (head, ears, torso, arms). Inner details unstroked |
| Head-only avatar | Same symbol, `viewBox="10 0 80 80"` |

Head:body = 64 : 50 ≈ 1.3:1 visually (matching the reference villagers). The head overlaps the torso by 4u (no neck).

### 7.2 Face anchors (all species)

Eyes centred at (36, 44) and (64, 44) (frog/duck: y 40). Brows at y 34 (optional). Nose (50, 52). Mouth (50, 60). Blush ellipses (27, 54) and (73, 54), rx 6.5, ry 4, `--c-blush` at .7.

| Eye variant | Shape |
|---|---|
| `oval` (default) | Ellipse rx 3.6, ry 4.6, `--v-eye`, highlight circle r 1.3 at (+1.2, −1.6) |
| `dot` | Circle r 3, no highlight (deadpan; Juniper, sheep) |
| `happy` | ∩ arc, 9u wide, stroke 3 |
| `sleepy` | ‿ arc, 9u wide, stroke 3 |
| `wide` | Circle r 5 + highlight r 1.8 + small second highlight r .8 |
| `smug` | Oval with a flat upper lid (clip the top 40%) + lid line |
| `sparkle` | Oval + a 4-point star highlight (`--c-coin-shine`) |

| Mouth | Shape |
|---|---|
| `smile` | Q-curve 10u wide, stroke 2.4 |
| `open` | D shape 10×7, `--v-mouth` fill + tongue `--v-tongue` |
| `cat` | "w" made of 2 arcs, 12u wide |
| `o` | Ellipse 4×5, `--v-mouth` |
| `flat` | Line 6u, stroke 2.4 |

### 7.3 Species head features

Each species = `{ ears, muzzle, nose, marking?, tail, headScale?, defaultMouth }` drawn over or behind the shared head. Colourways: base / shade (ears, legs, markings) / light (muzzle, inner ear).

| Species | Head features | Colourways (base · shade · light) |
|---|---|---|
| **cat** | Triangle ears, tips at (20, 6) / (80, 6), bases on the head rim, inner triangles in light pink; small inverted-triangle nose `#F28BA8`; 2 whiskers per side (opacity .5); mouth `cat`; optional forehead patch; tail = S-curve capsule | Cream `#FFF3E6 · #E9D6C2 · #FFC9C0` · Lilac `#CDB6F0 · #A98FD6 · #FFD6E5` · Ginger `#F6B26B · #D98B45 · #FFE6CC` |
| **dog** | Floppy teardrop ears hanging from (22, 22) to (13, 58) (shade colour, behind the face); muzzle ellipse (50, 58) rx 15, ry 11 light; nose ellipse rx 5, ry 3.6 `--v-eye` with a highlight; tail = short upward curl | Biscuit `#F2C48D · #A8754E · #FFF1DE` · Cocoa `#A9765A · #7A4F38 · #F3DCC4` · Cloud `#F5F2EC · #C9BFB3 · #FFFFFF` |
| **rabbit** | Tall capsule ears 12×36 rising from (36, 12) / (64, 12), tilted ±8° (variant: right ear folded at half height), inner light; tiny Y nose; two front teeth when `open`; tail = cotton puff r 6 | Blush `#F9C6D3 · #E79AB0 · #FFF3F6` · Snow `#FBF8F2 · #D9D2C6 · #FFC9D3` · Mocha `#C9A27E · #9C7656 · #F5E3CF` |
| **bear** | Round ears r 9 at (22, 14) / (78, 14) + inner r 5; muzzle ellipse rx 14, ry 10 light; rounded-triangle nose in dark; tail = r 5 stub | Honey `#E3A76B · #B97A45 · #F8DDB9` · Mint `#A9DDC8 · #7FBFA6 · #E8F7F0` · Cocoa `#9A6B4F · #6E4A36 · #E6CDB4` |
| **hamster** | Small round ears r 7 at (26, 12) / (74, 12), inner pink; headScale rx 38 (chubby); white bean-shaped muzzle patch across the lower face; pink dot nose; teeth on `open`; blush rx 8 | Golden `#F7C26B · #E39B3C · #FFF4DE` · Pebble `#CFC8C2 · #A69C93 · #FFFFFF` · Peach `#FFC7A6 · #F3A07E · #FFF1E6` |
| **duck** | No ears; a 3-feather tuft at (50, 8); eyes at y 40; **bill** = flat rounded ellipse rx 16, ry 7 at (50, 58) in `#F5A341` with a lighter top half (it replaces nose and mouth; `open` = bill parts 4u); tail = 3-point feather | Sunny `#FFE27A · #E8C24B · #FFF6C9` · Mint `#BDE6D5 · #93CDB6 · #EFFAF5` · Hazel `#C49A6C · #9A744C · #F2E2CC` |
| **frog** | headScale rx 40, ry 28 (wide, flat); **eye bumps** = circles r 12 at (32, 16) / (68, 16) on top of the head (eyes drawn inside the bumps); wide mouth spanning x 30–70; blush rx 9; no nose (two dots) | Leaf `#8FD48A · #5FB15C · #F7F2D0` · Lagoon `#6FD0C4 · #43A99C · #E8FAF4` · Sakura `#F7B6C9 · #E58FA9 · #FFF0F4` |
| **sheep** | **Wool ring** of 9 overlapping circles (r 9) around the face in wool colour (the face is a smaller inner ellipse rx 26, ry 24 in face colour); small horizontal leaf ears at (20, 44) / (80, 44); optional curled horns (spiral, `#E9D3A8`); eyes `dot`; wool scallops on the torso hem | Cream wool `#FFFBF2 · #EAE0CF · face #F7C9B8` · Cocoa face `#FFFBF2 · #EAE0CF · face #6E5B4E` (light eyes) · Pink wool `#FFD6E2 · #F2B3C6 · face #FFF1E6` |

Data shape (in `lib/villagers/species.ts`): `{ id, nameJa, colourways: [{ id, base, shade, light }], features: Snippet/part ids }`. Stored per person as `villagerSpecies` + `villagerColor` (the colourway id). Unknown or null → the v0.4 defaults (A = dog Biscuit, B = cat Lilac).

### 7.4 Expressions (the only five; no sad or angry)

| Expression | Eyes | Mouth | Pose / motion | Emote | Used when |
|---|---|---|---|---|---|
| `happy` (default) | oval | smile (cat: `cat`) | idle bob | — | normal |
| `cheer` | happy | open | arms up (±140°), `if-hop` ×1 | ♪ | check-in saved, harvest confirmed, rung reached, high-five received |
| `sleepy` | sleepy | flat | head tilt 6°, bob slows to 4s | z z | 22:00–06:00, のんびりデー |
| `surprised` | wide + brows raised 3u | o | small hop, arms out ±40° | ! | partner logged something new, sync conflict prompt (blocker question) |
| `proud` | smug | smile | torso scaleX 1.04, arms on hips (bent 70°) | ✦ | a fruit ring completes, a promise kept |

API: `<Villager species colourway expression="happy" size={64} head={false} emote={false} label />`.

### 7.5 Juniper (host) `Juniper.svelte`, viewBox `0 0 100 120`

- **Body:** a capybara **loaf**. The head is a rounded rect 72×56, rx 26, at (14, 22): blockier and calmer than the villagers. The torso is the shared bell, widened by 6u. Short legs.
- **Colours:** coat `#C1915F`, shade `#A97B50` (muzzle, legs), ears `#9C6F48`.
- **Face:** small round ears r 6 at (24, 24) / (76, 24). Large muzzle rect 40×28, rx 14, at (30, 50), with 2 nostril dots. Eyes `dot` (r 2.6) at (38, 44) / (62, 44), set high and calm. Blush .55. Tiny smile.
- **Yuzu on her head:** circle r 11 at (50, 14) in `--c-yuzu`, `--v-line` stroke 2.6, three peel-dimple dots `#E8B93E`, a shine, and a leaf 14×7 in `--c-leaf` from (50, 3). It follows her body 80ms late; on cheer it hops off by 6u and lands with a squash; when sleepy it tilts 10°.
- **Neckerchief:** `--c-leaf` triangle knot at the neck (marks her as host).
- **Expressions:** the same five (sleepy = eyes ‿, yuzu tilts; cheer = arms up, yuzu hop). Name tag `--tag-juniper`.

---

## 8. Icons (Builder A)

- **App-tile glyphs:** 24-grid, flat fills in `--c-ink` with one white or accent detail, no strokes, corners r ≥ 1.5. Island = palm + sun; jar = our jar; us = two hearts; help = open book; villager = generic face; lang = speech bubbles あ/A; bell = bell; sync = leaf circle-arrows.
- **Inline UI icons:** 24-grid, 2.2px rounded stroke, as v0.4.
- **Fruit** as v0.4, each with a highlight dot and a leaf.

---

## 9. Platform (unchanged from v0.4 §5)

iPhone portrait, 375–430pt, standalone PWA. Safe areas via `--safe-*`. 44pt minimum targets (48 for primary). `100dvh`. Inputs ≥ 16px. No hover-only states. Bottom sheets, not modals. Night `theme-color #1F2A44`, day `#FFF8E7`.

---

## 10. Work split (two builders, no shared files)

| | **Builder A: characters & scene art** | **Builder B: UI chrome & screens** |
|---|---|---|
| Owns (create / edit) | `lib/components/Villager.svelte` (rewrite), new `lib/villagers/*` (species.ts, parts), new `lib/components/Juniper.svelte`, new `lib/components/Emote.svelte`, new `lib/components/LeafCoin.svelte`, `lib/components/Sprites.svelte` (fruit, tree, jar, all icon symbols incl. app-tile glyphs), `lib/components/IslandScene.svelte`, `lib/components/FruitRing.svelte`, `lib/components/Icon.svelte`, `static/icons/*` (app icon, touch icon) | `lib/components/theme.css`, `TabBar.svelte` (→ dock), `Bubble.svelte`, `Sheet.svelte`, `HelpButton.svelte` (→ しまフォン button + new `ShimaPhone.svelte`), `SyncPill.svelte`, `Rope.svelte`, `CheckinSheet.svelte`, `HarvestOverlay.svelte`, `PromiseEditor.svelte`, `routes/**/*.svelte` (Island/Jar/Us/pair layouts, `+layout.svelte`), `lib/client/theme.svelte.ts`, `lib/i18n/*` strings |
| Delivers | §5, §7, §8, §4.5 coin, §4.7 emotes. Stable props: `<Villager species colourway expression size head emote label>`, `<Juniper expression size>`, `<Emote kind>`, `<LeafCoin size spin>`, symbol ids for tab glyphs `#app-island`, `#app-jar`, `#app-us`, `#app-help`, `#app-villager`, `#app-lang`, `#app-bell`, `#app-sync` | §3 backgrounds, §4.1–4.4, §4.6, the leaf-coin pill, the しまフォン launcher (moves settings out of ふたり), expression wiring per §7.4 (which state shows which expression), harvest/check-in layouts |
| Until the other lands | Keep the existing `Villager` props working (`person`, `species`, `size`, `label`) | Use the current `Villager` and `#v-juni`; add `expression` props once A ships |

**Shared:** `lib/styles/tokens.css` is owned by the designer. Builders may only **append** tokens in a marked `/* Builder A */` or `/* Builder B */` block at the end, and never rename existing ones. Builder B owns `+layout.svelte`; if A needs something global, ask B. Run `npm run check` and `npx vite build` before every push, and rebase on `main` often.
