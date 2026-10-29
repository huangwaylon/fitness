# Island Fund: Style Guide v4 (living island · cheerful NH theme · small phones)

Owner: Art director + motion designer · Status: **v4** (2026-10-29) · Tokens: `app/src/lib/styles/tokens.css` · Research: [ac-research.md](ac-research.md), reference images in `.refs/v4/` (gitignored) · Art: `app/static/art/` (`manifest.json`, fetched by `app/scripts/fetch-assets.ts`) · Decision: [ADR 0014](../decisions/0014-simplify-no-promises-no-cozy.md) · Previous: v3 (`git show 1bbe781:docs/design/style-guide.md`)

**Direction v4.** The app should read as *あつまれ どうぶつの森* at a glance, on a sunny day. It should feel bright, light-hearted and cheerful. The island is a small, living diorama: the real hardwood trees change with the season and carry our fruit, clouds drift, the sea sparkles, the hedges and flower beds come from the game, and the two villagers and しずえ are never quite still. They hop, turn around, hum, doze at night and react to everything you do with the game's own reaction icons. Our chrome (cream bubbles, chunky lipped buttons, paper cards) follows the NookPhone and Nook Miles+ look. Night is soft periwinkle and friendly. It is never navy-black or gloomy.

**IP rule (unchanged).** Official art comes only from `static/art/` through `<OfficialArt>` (Nintendo's art, for personal use, so the repo stays private). On-screen names follow the Japanese game: しずえ, ベル (the icon only; amounts stay ¥), しまフォン. No Nintendo fonts or sounds. Every official image has a fallback (our vector or `Silhouette`), so a missing file never breaks a screen.

**Section map.** §0 budget · §A art map · §S island scene · §M motion & expressions · §T AC theme elements · §R small screens · §1–4 colour, type, shape, components · §W work split · §C detail checklist.

---

## 0. Simplicity budget (overrides everything)

**2 tabs** (島 Island · 旅の壺 Jar) + the しまフォン launcher (top right) + the Sunday harvest overlay. One primary action per screen, in the thumb zone. ≤ 40 Japanese characters of non-numeric text per screen. One hero per screen. ≤ 3 cards per screen, ≤ 5 rows per card. One しずえ line (≤ 16 characters) per screen. **Decoration and motion never add words.** Reaction icons, sparkles and other effects stand in for text and are never paired with it.

Still removed (do not re-add): Sunday promises, のんびりデー / Cozy Days, the ふたり tab, the blocker question, promise cheer.

---

## A. Official art map (v4)

All files are `.webp` with alpha, already downscaled. Render them with `<OfficialArt key alt size>`. `size` = rendered **height**. Never upscale a file past its manifest height. `alt=""` when the image is decorative or a label sits next to it. Key helpers: the existing ones in `lib/client/assets.ts` (read-only this round), plus **new helpers in `lib/components/art.ts`** (Builder A): `reactionArt(id)`, `poseArt(id)`, `treeArt(season)`, `bushArt(id)`, `decoArt(id)`, `seasonArt(id)`, `flowerArt(id)`, `phoneArt(id)`.

| Group (count) | Keys (`static/art/<key>.webp`) | Px (h) | Where |
|---|---|---|---|
| Villagers (20) | `villagers/<id>` (full body ≤ 512), `villagers/<id>-icon` (128) | 512 / 128 | Scene, avatars |
| Host (6) | `host/isabelle`, `-stand`, `-bow`, `-winter`, `-icon`, `host/tom-nook` | 512 / 128 | Bubble host, empty states |
| Fruit (4) | `fruit/peach · coconut · apple · pear` | 128 | Trees, rings |
| **Trees (10)** | `trees/oak-spring` (cherry blossom) · `oak-summer` · `oak-fall` (red-orange) · `oak-winter` (snow), all 309×384 · `trees/cedar` 197×384 · `trees/palm` 320×302 (with coconuts) · `trees/{apple,peach,pear,coconut}-icon` 96 | 384 / 302 / 96 | The two fruit trees = oak of the season; cedar and palms frame the island; tree icons in Jar / harvest rows |
| **Bushes (7)** | `bushes/pink-azalea · blue-hydrangea · red-hibiscus · orange-tea-olive · pink-camellia · holly · green` | 96 | Back hedge (§S.6) |
| **Decor (17)** | `deco/fence-wood · fence-log · log-bench · mailbox · bonfire · rock · stone · resident-services (256×205) · airport (256×205) · sand-dollar · cowrie · conch · star-fragment · star-fragment-large · party-popper · present` | 64–256 | Island props, beach, events, pair screen |
| **Season (7)** | `season/petal · maple-leaf · snowflake · snowflake-large · acorn · pine-cone · mushroom` | 64 / 96 | Particles, seasonal ground items |
| Flowers (13) | `flowers/red-tulips · yellow-tulips · white-cosmos · red-roses · pink-cosmos · orange-pansies · blue-hyacinths · pink-lilies · white-windflowers · purple-mums · yellow-roses · pink-tulips · lily-of-the-valley` | 96–128 | Flower beds (§S.7) |
| **Reactions (24)** | `reactions/joy · delight · love · surprise · laughter · sleepy · happiness · greetings · encouraging · glee · pleased · pride · inspiration · daydreaming · dozing · amazed · curiosity · thought · flourish · bashfulness · sheepishness · worry · confident · shocked` | 96 | Inside the emote bubble (§M.3). These are the NH reaction-wheel icons: a grey cat face with coloured accents |
| **Pose reactions (10)** | `reactions/pose-excited · confetti · viva · lets-go · ta-da · double-wave · jump · work-out · stretch · flex` | 96 | Harvest steps, morning stretch, "let's go" nudges |
| Money (3) | `money/bells` (bag), `money/leaf`, **`money/miles`** | 96–128 | Savings amounts; Miles stamp on ladder rungs |
| Phone (10) | Full tiles: `phone/diy`, `phone/passport`, **`phone/rescue`** (red helicopter tile), **`phone/miles`**; bare glyphs (on our tile colour): **`phone/glyph-help`** (Island Life 101), **`glyph-chat`**, **`glyph-friends`**, **`glyph-resident`**, **`glyph-map`** · `phone/nookphone` (device render) | 92 / 96 / 512 | Launcher + dock (§T.1) |

v4 added 91 files (≈ 277 KB). Art total is about 0.65 MB. Clouds, waves, sky, sun/moon, paths, grass, cliffs, sparkles, hearts, notes, sweat, zzz and confetti are **our vectors**, since there is no usable official art for them.

---

## S. Island scene v4 (Builder A) `lib/components/island/*`

### S.1 Structure: an elastic sky over a fixed-aspect stage

```
.scene (position:relative; height: var(--scene-h); overflow:hidden; container-type:inline-size)
├── .sky    (absolute, inset 0 0 auto 0, height = scene-h − stage-h + 8px)  gradient, sun/moon, stars, clouds, balloon
└── .stage  (absolute, bottom 0, width 100%, aspect-ratio 390/360)          everything that stands on the island
     ├── <svg viewBox="0 0 390 360"> sea, waves, beach, cliff, grass, path, shadows (our vectors)
     ├── HTML overlays positioned in stage units: 1u = calc(100cqw / 390)  (helper `u(n)` → `calc(n * 100cqw / 390)`)
     └── .tint (time-of-day wash, opacity only) · .particles
```

* The **stage never changes shape**. All coordinates below are stage units (`u`), with x 0–390 and y 0–360, the origin at the stage's top-left and y increasing downward. "Base" means the y of the feet or trunk bottom.
* The **sky absorbs the height differences** between phones. `--scene-h = clamp(300px, 100dvh − var(--chrome-below), 600px)` where `--chrome-below` is the stacked height of everything under the scene (§R.1). If the sky would be shorter than `safe-top + 52px`, the stage moves up and its top (the back sea, y 0–40) crops. Villagers, trees and the jar must never crop.
* **No layout shift.** `.stage` has a fixed `aspect-ratio`, and every `<OfficialArt>` reserves its box from manifest w/h. Nothing in the scene changes size after first paint.

### S.2 Composition per viewport (computed from §R.1 chrome)

| Viewport (CSS px, safe top/bottom) | Scene h | Stage h | Visible sky under the status row | 1u | Villager h | Oak h | Fruit icon |
|---|---|---|---|---|---|---|---|
| **iPhone 15** 393×852 (59/34) | 852 − 282 = **570** | 363 | 570 − 363 − 59 = **148** | 1.008px | 95px | 151px | 27px |
| **iPhone SE** 375×667 (20/0), compact | 667 − 214 = **453** | 346 | **87** | 0.962px | 90px | 144px | 26px |
| **320 fallback** 320×568 (20/0), tiny | 568 − 200 = **368** | 295 | **53** (just above the 52px floor; on shorter screens the back sea crops) | 0.821px | 77px | 123px | 22px |
| Wide (≥ 430) | column max 480, centred; sky continues full-bleed behind | 443 max | — | ≤ 1.23px | — | — | — |

On iPhone 15, the 148px of sky holds three clouds and the sun. On SE it holds two clouds and the sun. At 320 it holds the status row and one cloud (C1) behind it.

### S.3 Layer stack (back → front, z-index in brackets)

| # | Layer | Content |
|---|---|---|
| 1 [0] | Sky gradient | `linear-gradient(180deg, var(--sky-top), var(--sky-bottom))`, bleeding under the status bar |
| 2 [1] | Sun / moon | Sun: disc r 22px `--sun-disc` + halo r 34px at 35% opacity, at `right: 18%`, `top: safe-top + 18px`. Night: moon crescent r 18px `#FFF3C4` + halo 30% + 12 stars |
| 3 [2] | Clouds | 3 drifting clouds (§S.4) |
| 4 [3] | Balloon present (event) | Occasional (§S.10) |
| 5 [10] | Sea | Stage background + 3 wave bands + sparkles (§S.5) |
| 6 [11] | Distant islet | x 318–372, y 6–24: sand ellipse `--beach` rx 27 ry 6 + `trees/palm` 26u tall at x 345 base 14. Cropped away first at 320 |
| 7 [12] | Beach | Front crescent + shells (§S.5) |
| 8 [13] | Cliff + grass plateau | (§S.6) |
| 9 [14] | Path | Dirt path (§S.6) |
| 10 [20] | Back row | Cedar, hedge, Resident Services, fences, mailbox, bench / bonfire (§S.6) |
| 11 [30] | Fruit trees | Two oaks + fruit (§S.8) |
| 12 [40] | Jar | Existing vector jar, centre (§S.6) |
| 13 [41] | Flower beds | (§S.7) |
| 14 [50+] | Villagers | Sorted by base y so the one standing lower is in front. Ground shadow, body, emote bubble, fx (§M) |
| 15 [45] | Front palms | Palms on the beach corners, behind the villagers |
| 16 [70] | Particles | Petals / leaves / snow / fireflies (§S.9) |
| 17 [80] | Time-of-day tint | One `div`, `background: var(--tod-tint)`, `pointer-events:none` (§S.11) |
| 18 [90] | Score pills | Under the villagers, above the tint so they stay readable at night |

### S.4 Sky and clouds (ours)

**Cloud shape (NH cumulus).** Long and soft with a flat bottom: one rounded rect (the base, height 40% of the cloud, `rx` = half its height) + 3–4 overlapping circles on top, with the largest second from the left. Fill `--cloud`. An **underside band**, the bottom 32% clipped to the cloud, is filled `--cloud-shade`. No stroke and no blur filter. A soft edge comes from a second copy scaled 1.04 at 35% opacity behind it. Define one `<symbol id="cloud-a|b|c">` each and place with `<use>`.

| Cloud | Size (px, iPhone 15) | top (% of visible sky) | Drift duration | Opacity | Shown on |
|---|---|---|---|---|---|
| C1 | 150×46 | 14% | 140s | .96 | all |
| C2 | 108×34 | 46% | 100s | .92 | sky ≥ 70px |
| C3 | 72×24 | 72% | 75s | .88 | sky ≥ 120px |

* **Drift:** `transform: translateX()` from `-110%` (of its own width) to `calc(100vw + 10%)`, `linear infinite`. Negative `animation-delay` (−30%, −62%, −15% of each duration) spreads them across the sky on load. `will-change: transform` on clouds only.
* **Colours.** Day: `--cloud #FFFFFF`, `--cloud-shade #DCE6FF`. Dawn: `#FFF6F0` / `#FFD9C7`. Dusk: `#FFF0E0` / `#FFB9A0`. Night: `#9AA6E0` at 50% opacity, shade `#7F8BCB`, C1 and C2 only. Winter day shade: `#E2E8F5`.

### S.5 Sea, waves, beach

* **Sea:** stage rect fill `--sea`. The back sea (y 0–40, above the plateau) is a vertical gradient from `--sea-far` at the horizon to `--sea`. The sea that shows at the front corners, outside the beach, is `--sea-deep`.
* **Wave bands** (×3: back sea at y 12 and y 28, front corners at y 354): scalloped crest lines, each an SVG path of 7–9 small arcs (radius 6u, stroke `--foam` 2.4u, round caps, opacity .7). Animation `if-wave`: `translateX(-6u) → translateX(6u)`, 4s `--ease-idle` alternate infinite, with delays 0, −1.3s and −2.6s.
* **Sparkles** (×6): 4-point stars, 6–9u, `#FFFFFF`, scattered over the back sea (y 4–36) and the front corners (y 340–358). `if-twinkle`: `scale(.2) opacity 0 → scale(1) opacity 1 → scale(.2) opacity 0`, 2.8s, random delays 0–2.8s. Night: 3 sparkles, tinted `#FFF3C4`.
* **Beach:** a sand band hugging the plateau, drawn under it: a rounded rect x −6–396, y 170–358, corner radius 60u. Only the front strip (y 298–358, 46u deep at the centre) and the front corners show. Fill `--beach`. Wet edge: the same shape offset 6u outward, fill `--beach-wet`. Shore foam: a 3u `--foam` stroke along the outer edge, `if-shore` `scaleY(1 → 1.05)` + opacity `.75 → 1`, 3.2s alternate, origin at the beach centre.
* **Shells:** `deco/sand-dollar` 14u at (112, 332), `deco/cowrie` 13u at (268, 338), `deco/conch` 15u at (214, 346). Night replaces two of them with `deco/star-fragment` 16u at (150, 338) and (300, 330), glowing with `if-glow` (opacity .65 → 1 plus drop glow `0 0 6px #FFF3A0`, 2.4s alternate). Opacity animates; the shadow stays static.

### S.6 Island plateau, path, back row, jar

* **Cliff and plateau:** the grass top is a rounded, slightly wobbly rectangle from x 12 to 378 and y 40 to 298, corner radius 44u, with edges that deviate ±3u (hand-drawn feel). Below its front and side edges sits a 14u **cliff face** (y 298–312) in `--cliff`, with two 1.5u strata lines in `--cliff-dark` at y 303 and 308. A 3u **grass lip** in `--grass-edge` runs along the plateau's top edge.
* **Grass texture (NH checker):** an SVG `<pattern>` 24u square holding two diamonds (squares rotated 45°, side 8.5u) in `--grass-2` on `--grass`, plus 12 grass tufts (`ʌʌ` paths 8×5u, stroke `--grass-edge` 1.6u) scattered at fixed positions that avoid the path. Winter adds no tufts. Instead, 10 snow sparkles twinkle like the sea sparkles but in `#FFFFFF` at 70% opacity.
* **Path (dirt, NH style):** a vertical strip x 175–215 from the beach (y 300) up to the Resident Services door (y 106), plus a horizontal strip y 248–276 from x 58 to x 332 (the villagers stand at its ends). Fill `--path`, edge 2u `--path-edge` with ±2u wobble, and 5 pebbles (r 1.6–2.4u, `--path-edge`). In winter the path is `#E9E4DA` with a `#D5CFC2` edge, like trodden snow.
* **Back row** (all `<OfficialArt>`, feet anchored at "base"):

| Prop | Key | Height (u) | x centre | base y | Seasons / time |
|---|---|---|---|---|---|
| Cedar (back left) | `trees/cedar` | 118 | 40 | 150 | Spring–autumn. **Winter:** replaced by `trees/oak-winter` 96u at the same spot |
| Hedge | bush pair of the season (§S.7), alternating | 30 | 28, 62, 96, 128 · 262, 294, 326, 360 | 82 | all |
| Resident Services | `deco/resident-services` | 66 (w 82) | 195 | 106 | all. Night: 2 window glows (§S.11) |
| Fences | `deco/fence-wood` ×2 per side (winter: `deco/fence-log`) | 22 | 136, 158 · 232, 254 | 114 | all |
| Mailbox | `deco/mailbox` | 22 | 226 | 136 | all |
| Bench | `deco/log-bench` | 24 | 140 | 168 | Spring/summer, and autumn/winter days |
| Bonfire | `deco/bonfire` | 26 | 140 | 168 | Autumn/winter from 16:00 (dusk and night), replacing the bench. Warm glow: radial `#FFC46B` at 40%, r 26u, `if-glow` 1.8s |
| Rock | `deco/rock` | 18 | 352 | 162 | all |
| Front palms | `trees/palm` | 72 · 56 | 366 · 24 | 344 · 348 | all (in winter too, as in NH) |

* **Jar:** unchanged vector, centred at x 195 with its base at y 266 on the path crossing, with a shadow ellipse rx 28 ry 5. Tap target ≥ 64×64px.

### S.7 Flowers and bushes per season

Two **flower beds** flank the vertical path just below the crossing. Each bed is a 3×2 grid at 16u pitch with 20u flowers, spanning x 128–172 and x 218–262, base rows at y 292 and y 306. In front of the beds is a 1.5u stitched border made of a dashed `--grass-edge` line (a planted-bed edge).

| Season | Bed left (3 + 3) | Bed right (3 + 3) | Hedge pair | Ground extras |
|---|---|---|---|---|
| Spring (Mar–May) | pink-tulips · yellow-tulips | blue-hyacinths · white-windflowers | pink-azalea + green | `season/petal` ×3 lying on grass (12u, rotated) |
| Summer (Jun–Aug) | red-roses · yellow-roses | pink-lilies · lily-of-the-valley | blue-hydrangea (Jun) / red-hibiscus (Jul–Aug) + green | — |
| Autumn (Sep–Nov) | pink-cosmos · white-cosmos | purple-mums · orange-pansies | orange-tea-olive + green | `season/mushroom` ×3 at the cedar base (14u, x 22–58, y 152), `season/acorn` ×2 under each oak |
| Winter (Dec–Feb) | none (snow mounds: white ellipses rx 8 ry 4) | none | holly + pink-camellia | `season/pine-cone` ×2 near the winter oak |

### S.8 The two fruit trees (official oak + official fruit)

* `trees/oak-<season>` (summer art for summer; spring art = cherry blossom) at **x 84 (person A) and x 306 (person B)**, base y 238, **150u tall** (121u wide). Shadow: ellipse rx 46 ry 9 `--sh-ground` at base + 2.
* **Fruit:** 4 official fruit per tree, placed in the tree box (% of tree width/height, centre point), each 27u (22% of the tree width) with a 1u white glow (`drop-shadow(0 0 1.5px #fff)`):
  peach (30%, 30%) · coconut (68%, 22%) · apple (22%, 52%) · pear (74%, 50%).
* **Ripeness stages** (unchanged thresholds): bud < 25% → `scale(.55)`, opacity .55, `saturate(.3)`. Small < 60% → `scale(.75)`, opacity .8, `saturate(.7)`. Nearly < 100% → `scale(.9)`. Ripe → `scale(1)` + a sparkle glint every 4s (`if-glint` on a 4-point star at the fruit's top-right, 600ms). `filter` is allowed on fruit **only** (not on villagers). Stage changes animate with `if-pop` (360ms).
* **Villagers** stand in front of their own oak: feet at **y 286**, x 84 (A) / 306 (B), **94u tall** (24cqw), ground shadow ellipse rx 20 ry 4.6 `--sh-ground`.
* **Tree idle:** `if-sway` ±1.2° around the base, 5s, with the B tree offset by −2.1s. Tap → **tree shake** (§M.2 `if-shake`) + 2 seasonal particles fall from the canopy + the fruit detail bubble (all 4 fruit with %).

### S.9 Particles (≤ 14 on screen, transform/opacity only)

| When | Art | Count | Size | Motion |
|---|---|---|---|---|
| Spring day | `season/petal` | 10 (20 during 4/1–4/10 cherry blossom week, but stay ≤ 14 visible) | 10–16px | `if-fall`: translateY from −10% to 110% of the scene + `if-flutter` (translateX ±18px, rotate ±40°), 9–14s, random delays |
| Autumn | `season/maple-leaf` | 8 (12 during 11/16–11/25 maple week) | 12–16px | Same as above, 10–15s, rotate 0–540° |
| Winter | `season/snowflake` + 1 `season/snowflake-large` | 12 + 1 | 8–14px / 22px | 12–18s, flutter ±10px. The large flake drifts once every 45s, 20s across |
| Summer night | ours: firefly (r 2.2u `#F3FF9E` + glow `0 0 6px #E8F59A`) | 8 | — | `if-firefly` wander ±14u, opacity .2 → 1, 3–5s |
| Summer day | none (sea sparkles carry it) | — | — | — |

### S.10 Seasonal events (by Japan date)

| Event | Dates | Scene change |
|---|---|---|
| Cherry blossom week | Apr 1–10 | Extra petals; しずえ uses `inspiration` on the first open |
| Summer fireworks | Sundays in August, 19:00–24:00 | Harvest overlay plays fireworks (ours: 6 radial bursts, 12 dots each, colours of the confetti set, 1.4s, staggered 0.7s). The scene sky gets 1 burst every 6s |
| Maple week | Nov 16–25 | Extra maple leaves |
| Toy Day eve | Dec 24 | `deco/present` 18u under each oak; the balloon carries `deco/present` |
| New Year's Eve | Dec 31 22:00 – Jan 1 02:00 | Fireworks in the sky; both villagers `if-dance` once on open; `deco/party-popper` is used as the harvest confetti source |
| Balloon present (any day) | Day only, ≤ 1× per session, after 60s on 島 | A balloon (ours: an ellipse 22×28px in `#FF6B6B`, `#FFD84D` or `#6FCFF6`, string 18px) carrying `deco/present` 20px drifts left → right across the sky in 26s, bobbing ±6px. **Tap (target 48×56) → pop**: confetti burst + the present falls behind the hedge. No text |

### S.11 Time of day (data-tod) and lighting

| tod | Sky top → bottom | Stage tint `--tod-tint` | Extras |
|---|---|---|---|
| dawn 05–07 | `#FFC6A8 → #CDEBFF` | `rgba(255,170,140,.12)` | Sun low (top: sky 70%), pink cloud shade |
| day | season sky (§1.3) | none | Sun high |
| dusk 16–19 | `#FF9E7A → #FFE2A8` | `rgba(255,140,90,.14)` | Sun `#FFB35C` low; long shadows: ground ellipses `scaleX(1.25)` |
| night 19–05 | `#3A4886 → #7584CC` (periwinkle, not navy) | `rgba(64,78,160,.26)` | Moon + 12 stars (`if-twinkle` 2.4–4s); Resident Services windows glow (two 8×10u rounded rects `#FFE38A` + `0 0 8px #FFD45A`); bonfire glow (autumn/winter); fireflies (summer); star fragments on the beach |

The tint covers the stage only. Villagers and the jar sit **under** the tint and score pills sit **above** it. Official art gets **no** `brightness()` filter in v4 because the tint does that job.

### S.12 What's tappable on 島 (≥ 44px, ≥ 8px apart)

| Target | Hit box | Action |
|---|---|---|
| My villager | figure box + 8px, min 64×64 | squish + `greetings` → check-in sheet after 200ms |
| Partner villager | same | squish + `happiness` → partner sheet after 200ms |
| Each tree canopy | canopy box (≈ 120×100px), not the trunk | tree shake + fruit detail bubble |
| Jar | 64×64 min | → 旅の壺 |
| しずえ (beside bubble) | 72×72 min | finish the letter reveal / next page / idle hop |
| Balloon (when flying) | 48×56 | pop |
| Status row: SyncPill, しまフォン | 44×44 | — |

Nothing else is tappable: no tap on Resident Services, fences, flowers or shells, because decoration never adds words. All targets are real `<button>`s with `aria-label`. The scene `svg` is `aria-hidden`.

### S.13 Performance budget

* Animate **only `transform` and `opacity`**. The exceptions are fruit `filter` (static per stage, never animated) and the one-time `if-glow` drop shadow on ≤ 3 small items. No `box-shadow`/`filter`/`clip-path` animation and no `mix-blend-mode`.
* ≤ **24 infinitely animated elements** in the scene: 3 clouds + 3 waves + 6 sparkles + 2 trees + 2 villager bobs + Isabelle bob + shore + ≤ 6 glows/twinkles. Particles (≤ 14) are on top of that. Use CSS keyframes only. JS (`setTimeout`) only schedules idle life and events. No rAF loop.
* `will-change: transform` on clouds and villagers only.
* **Pause** everything when the tab is hidden: `visibilitychange` sets `data-paused` on `.scene`, and `[data-paused] * { animation-play-state: paused !important }`. The idle-life scheduler stops too. A sheet covering the scene also pauses particles and idle life (clouds and waves keep going).
* Images: trees, villagers and Resident Services are `eager`, everything else `loading="lazy" decoding="async"`. First paint of 島 loads ≤ 30 art files (≈ 220 KB, cached by the SW after that).
* Target: 60fps on an iPhone SE 2 in Safari, with no long task > 50ms from the scene after load. Check with the Performance panel at 4× CPU throttle (≥ 50fps).
* **Reduced motion** (`prefers-reduced-motion: reduce`): clouds sit still at their delay positions; no waves, sparkles, sway, bob, particles or balloon; idle life off; reactions show their emote bubble with a 120ms fade (§M.6). The scene still shows season and time of day.

---

## M. Character motion & expression system (Builder A)

### M.1 Rig (static official renders + CSS)

```
.actor (positioned at base x/y; transform: translateX(var(--walk-x)) — walking only)
└── .face (transform: scaleX(var(--facing, 1)) — 1 = as drawn, −1 = mirrored)
    └── .body (transform-origin: 50% 100%; idle loop OR one reaction at a time)
        └── <OfficialArt villagers/<id>>
    .shadow (ellipse under feet, scales with hops: scale(.8) at the top of a hop)
    .emote  (bubble, §M.3)  · .fx (overlay effects, §M.4)
```

Squash and stretch conserve volume (scaleX × scaleY ≈ 1), never exceed 14% deformation, and always use `transform-origin: 50% 100%`. A reaction **replaces** the idle loop for its duration (`.body[data-act="hop"]`) and then the idle loop resumes with no jump: a reaction always starts and ends at `transform: none`.

### M.2 Motion primitives (keyframes, prefix `if-`, in `tokens.css` Builder A block)

| Name | Duration · easing | Keyframes (on `.body` unless noted) |
|---|---|---|
| `if-bob` (idle) | 2400ms ∞ `--ease-idle` | 0/100% none · 50% `translateY(-2%) scale(.985,1.015)`. Partner offset −1.2s |
| `if-breath-slow` (sleepy idle) | 4000ms ∞ | 0/100% none · 50% `translateY(1%) rotate(5deg) scale(1.01,.99)` |
| `if-squish` (tap) | 220ms `--ease-bounce` | 0 none · 40% `scale(1.08,.9)` · 100% none |
| `if-hop` | 600ms | 0 none · 15% `scale(1.1,.9)` · 40% `translateY(-16%) scale(.92,1.08)` · 65% `translateY(0) scale(1.08,.92)` · 82% `scale(.97,1.03)` · 100% none |
| `if-hop2` (yay) | 900ms | hop to −16% at 25%, land at 45%, hop to −10% at 65%, land at 85%, settle at 100% |
| `if-wiggle` | 700ms ease-in-out | rotate 0 · −7° · 7° · −5° · 5° · −2° · 0 (equal steps) |
| `if-turn` (look around) | 1400ms | on `.face`: 0 `scaleX(1)` · 12% `scaleX(-1)` · 80% `scaleX(-1)` · 92% `scaleX(1)`. `.body` dips `scale(1.04,.96)` at each flip |
| `if-nod` | 520ms | translateY 0 · 3% · 0 · 2% · 0 with `scaleY(.97)` at the dips |
| `if-laugh` | 620ms | translateY 0 · −4% · 0 · −4% · 0 · −3% · 0, `scale(1.02,.98)` on each down |
| `if-surprise` | 420ms `--ease-bounce` | 0 none · 18% `scale(1.12,.88)` · 45% `translateY(-10%) scale(.94,1.08)` · 72% `translateY(0) scale(1.04,.96)` · 100% none |
| `if-shy` | 1000ms | 0 none · 25–75% `rotate(-6deg) scale(.97)` · 100% none |
| `if-stretch` | 1400ms | 0 none · 30–70% `scale(.95,1.09)` · 85% `scale(1.04,.96)` · 100% none |
| `if-proud` | 900ms | 0 none · 30–75% `scale(1.05,.97) translateY(-2%)` · 100% none |
| `if-dance` | 1600ms (4 beats × 400ms) | per beat: −8° + translateX(−4%) + hop −5% → +8° + translateX(4%) + hop −5% … end none |
| `if-walkbounce` | 320ms ∞ while walking | 0/100% none · 50% `translateY(-4%) rotate(2deg)`, alternating sign per cycle (`alternate`) |
| `if-shake` (trees) | 480ms | rotate 0 · 3° · −3° · 2° · −1° · 0, origin at the trunk base |
| `if-bow` (しずえ) | 1100ms | 0 none · 35–65% `translateY(3%) scale(1.02,.98)` · 100% none |
| `if-talk` (しずえ, while typing) | 260ms ∞ | 0/100% none · 50% `translateY(-1.5%)` |
| `if-headshake` (しずえ sorry) | 600ms | rotate 0 · −3° · 3° · −3° · 0 |

**Walking** ("stroll"): JS sets `--walk-x` (in u, e.g. 40u toward the jar) and `--facing`, with `transition: transform 1600ms linear` on `.actor`. `.body` runs `if-walkbounce` and the fx layer emits a dust puff at the feet every 640ms. The villager then waits 1.2s (with a random daydream or wiggle) and walks back. The hit box moves with the actor because the button is inside `.actor`. Walking never crosses the jar (the stop point is ≥ 30u from x 195).

### M.3 Emote bubble (with official reaction icons)

* Cream circle **44px** (36px when `--compact`), fill `--bubble`, 2px border `#EADBB8`, lip `0 3px 0 rgba(74,58,44,.12)`. Tail: an 8px rounded triangle at the bottom, offset 30% toward the villager's head. The icon inside is `reactionArt(id)` at **34px** (28px compact).
* Position: centre 6u above the head top (the art box top + 6%), shifted 18% of the figure width **toward the screen edge** on the villager's side so the two bubbles never meet over the jar.
* Timing: in = `if-pop` 360ms `--ease-bounce` (scale 0 → 1.15 → 1, origin at the tail). Hold 1600ms (default; `sleepy` holds while sleeping). Out = 200ms `scale(.8)` + fade. Total `--dur-emote` 2200ms. Max **one per actor**. A new one replaces the old one immediately.
* Isabelle's emotes sit at the top-right of her render, 40px.

### M.4 Cute overlay effects (`Fx.svelte`, ours, SVG/CSS)

| Fx | Art | Count · size | Motion | Duration |
|---|---|---|---|---|
| sparkles | 4-point star `#FFE27A`, centre `#FFFFFF` | 4 · 8–14px | appear on a 70%-wide arc over the head: `scale(0) rotate(0) → scale(1.2) rotate(45deg) → scale(0)`, stagger 90ms | 700ms |
| hearts | heart `#FF7FA8` + shine `#FFFFFF` 40% | 3 · 12–16px | rise 40px with `translateX` ±6px sine, fade at 70–100%, stagger 150ms | 1200ms |
| notes | ♪ / ♫ paths, alternating `#5BC85A` and `#4DB4F0` | 3 · 14px | rise diagonally (outward) 36px, rotate ±12°, fade, stagger 220ms | 1100ms |
| sweat | drop `#8FD3F4` + highlight | 1 · 10×14px | at the temple (70%, 22% of the figure), slide down 8px + fade | 900ms |
| zzz | "z" in Fredoka 700, `#8F9CE6` | 3 · 12/15/18px | rise to the upper right 24px, fade, stagger 600ms, loops while asleep | 3000ms loop |
| confetti | rects 6×10px + circles 6px: `#FF7FA8 #FFD84D #6ED07A #6FCFF6 #B98AE8 #FF9B5C` | 16 (harvest: 36) | burst up 60–120px over 35%, then fall 200px with rotate 0–720°, fade at 85% | 1600ms |
| puff | circles `#FFF6E0` 80% | 2 · 6–10px | at the feet, `scale(.4) → scale(1.2)` + fade | 500ms |
| glint | 4-point star `#FFFFFF` | 1 · 10px | `scale(0) → 1 → 0` at the top-right of a ripe fruit | 600ms every 4s |
| fall-leaf | `season/*` of the season (spring petal, summer: ours green leaf, autumn maple, winter snowflake) | 2 · 12px | from the canopy, `if-fall` 1800ms short | 1800ms |

All fx are `pointer-events:none` and `aria-hidden`, and remove themselves on `animationend`. ≤ 40 fx nodes alive at once.

### M.5 Reaction catalogue (villagers)

"Mine" = the device owner's villager. "Partner" = the other. Event reactions **preempt** idle life (cancel the running idle action and play the reaction from `transform: none`).

| # | Trigger (source) | Actor | Motion | Emote | Fx | Total | Reduced motion |
|---|---|---|---|---|---|---|---|
| R1 | First open of the day (`bus: open`, once/day) | both, B 400ms after A | `if-wiggle` | `greetings` | — | 2.2s | emote fade only |
| R2 | Check-in saved (`bus: checkin-saved`) | mine | `if-hop2` | `joy` | notes + sparkles | 2.2s | emote + 1 static note |
| R3 | Partner's new data arrived (view diff: partner score ↑) | partner, then mine nods | `if-surprise` → `if-hop`; mine `if-nod` +600ms | `surprise` → `happiness` | — | 2.6s | emotes only |
| R4 | High-five sent (`bus: highfive-sent`) | mine | `if-hop` toward the partner (`--facing` toward them) | `encouraging` | sparkles | 2.2s | emote |
| R5 | High-five received (view diff / `bus: highfive-received`) | mine | `if-hop2` | `love` | hearts | 2.4s | emote + 1 heart |
| R6 | A fruit reaches 100% (view diff) | owner + that fruit | `if-proud`; fruit `if-pop` + glint | `pride` | sparkles on the fruit | 2.2s | emote; fruit swaps stage with a fade |
| R7 | A fruit moves up a stage (25/60%) | owner | `if-nod` | `pleased` | — | 2.2s | emote |
| R8 | All 4 fruit ripe for one person | owner | `if-dance` ×1 | `delight` | confetti (16) | 2.4s | emote |
| R9 | Tap my villager | mine | `if-squish` | `greetings` | — | sheet after 200ms | emote |
| R10 | Tap partner villager | partner | `if-squish` | `happiness` | — | sheet after 200ms | emote |
| R11 | Morning 05:00–09:00, first view | both (staggered) | `if-stretch` | `pose-stretch` | — | 2.2s | emote |
| R12 | Evening 18:00–22:00, mine not checked in today (once per evening) | partner faces mine | `if-turn` to face + `if-nod` | `encouraging` (or `pose-lets-go`) | — | 2.4s | emote |
| R13 | Night 22:00–05:00 | both | `if-breath-slow` replaces `if-bob` | `dozing` at the start, then `sleepy` every 30s | zzz loop | while night | static `sleepy` emote, no zzz |
| R14 | Tap while asleep | that one | `if-surprise` → back to sleep after 10s | `shocked` → `sleepy` | sweat | 10s | emote |
| R15 | Low week (Thu–Sat, my score < 30), once/day | mine | `if-shy` | `thought` | — | 2.2s | emote (never sad or angry icons) |
| R16 | Both ≥ 80 this week | both | idle pool gains "dance together" (synced `if-dance`) | `glee` | notes | 1.6s | — |
| R17 | Sync problem (`bus: sync-error`) | mine | `if-shy` | `sheepishness` | sweat | 2.2s | emote |
| R18 | Jar tapped | both | `if-turn` to face the jar for 1.2s | `curiosity` | — | 1.2s then navigate | none (navigate) |
| R19 | Harvest overlay (Sunday) | both (in the overlay rows) | `if-dance` | `pose-viva` → `joy` | confetti 36 (+ fireworks in August) | per step | emotes |

### M.6 しずえ (Isabelle) catalogue

| Situation | Pose art | Motion | Emote / fx |
|---|---|---|---|
| Idle | current | `if-bob` 2800ms, translateY −1.5% only (no squash) | — |
| Talking (letter reveal running) | current | `if-talk` until typing ends | — |
| Greeting (first open, R1) | `isabelle` (wave) | `if-hop` (−8% max) | `greetings` |
| Check-in saved | wave | `if-hop` | `joy` + notes |
| Info / Jar / neutral | `-stand` | idle | — |
| Thanks, harvest done | `-bow` | `if-bow` | `happiness` + sparkles |
| Error / sorry | `-bow` | `if-headshake` | `sheepishness` + sweat |
| Cherry blossom / maple week first open | wave | `if-wiggle` | `inspiration` |
| Night 22–05 | `-stand` | `if-breath-slow`; every 60s a `dozing` emote | zzz (1 cycle) |
| Tap (not typing, no next page) | — | `if-hop` | random of `joy · laughter · happiness · flourish` |
| Idle life (every 20–30s, §M.7) | swap `-stand` ↔ wave with a 160ms crossfade, or `if-wiggle` | — | — |
| Winter (Dec–Feb) | `-winter` replaces every pose; motions unchanged | — | — |

Pose swaps crossfade two stacked `<img>`s over 160ms (opacity only). The incoming image must already be decoded (`img.decode()` before the swap).

### M.7 Idle life (`lib/components/motion/idleLife.svelte.ts`)

* **One scheduler per scene.** After each action, wait `8000 + random() * 7000` ms (8–15s). Pick an actor: partner 40%, mine 40%, しずえ 20% (しずえ at most once every 20s). Skip any actor that is busy.
* **Pools** (weights; filtered by context; never the same action twice in a row per actor):

| Action | Weight | Context | Motion · emote · fx |
|---|---|---|---|
| look around | 20 | day | `if-turn` · — |
| wiggle | 15 | day | `if-wiggle` · — |
| hum | 12 | day | `if-bob` at 1200ms ×2 · — · notes |
| hop | 10 | day | `if-hop` · `happiness` |
| stroll | 10 | day, ≤ 1 per 60s per actor | walk 40u toward the jar and back (§M.2) · — · puffs |
| daydream | 10 | any but night | still · `daydreaming` or `thought` |
| tree shake | 7 | day | own tree `if-shake` + 1 fall-leaf · — |
| chat | 8 | day, ≤ 1 per 90s | A and B face each other (`--facing`): A `thought`, after 900ms B `laughter` + `if-laugh` |
| dance together | 5 | both ≥ 70 (R16 ≥ 80 raises it to 15) | synced `if-dance` · `glee` · notes |
| stretch | 8 | 05–10 only | `if-stretch` · `pose-stretch` |
| doze | — | night: the only action, every 20–30s | `sleepy` emote refresh |

* **Pause / stop:** `document.hidden`, any sheet or the harvest overlay open, or `prefers-reduced-motion`. After 3 minutes without input, the interval becomes 20–30s. After 10 minutes the scheduler stops until the next pointer/visibility event.
* **Never:** two actors starting idle actions within 2s of each other (except chat and dance), a stroll while a bubble is typing, or idle actions in the first 3s after an event reaction.
* **Event bus** (`lib/components/motion/bus.svelte.ts`, Builder A): `emit('open' | 'checkin-saved' | 'highfive-sent' | 'highfive-received' | 'sync-error')`. Pages (Builder B) call `emit` after the store action resolves. Diff events (R3, R6–R8) are detected inside the scene by comparing the previous and next `view` prop. They never fire on the first render or when restoring from cache.

### M.8 Reduced-motion summary

Loops off. Hops, walks and dances are off. Emote bubbles appear with a 120ms fade and hold 1.6s. Fx collapse to a single static icon (one note, heart or sparkle) that fades in and out over 120ms. Pose swaps are instant. The harvest uses fades (no confetti or fireworks). Tap feedback is a colour/lip change on buttons only.

---

## T. AC-derived theme elements (Builder B)

### T.1 しまフォン launcher (NookPhone)

* Phone button (top right, 44×44): `phone/nookphone` at 30px on a `--phone-bg` circle with a lip.
* **Phone sheet:** looks like the NookPhone screen. Radius 44px top, fill `--phone-bg #FFF7DF` with `--pat-dots`. Status row: time (Fredoka 600 15px) on the left, a small leaf (`money/leaf` 16px) in the centre, battery-free. Title 「しまフォン」 `--fs-h2` 900. Grid: **3 columns** of **64px squircle tiles** (radius 30%, lip `0 4px 0` darker by 15%), labels 12px 700 `--text` beneath, one line.

| App | Tile | Glyph / art |
|---|---|---|
| 使い方 | `#FFF0B8` (butter) | `phone/glyph-help` 44px |
| 村人 | official tile | `phone/passport` (full tile) |
| 言語 | `#8EB6FF` | `phone/glyph-chat` 44px |
| お知らせ | `#FFE27A` | `phone/glyph-resident` 44px |
| 同期 | official tile | `phone/rescue` (full tile) |
| 見せる範囲 | `#FFD1D1` | `phone/glyph-friends` 44px |

* Tile press: `if-squish`. Opening an app: the tile scales up 1 → 1.15 + fades as the app page slides in from the right over 260ms `--ease-soft`. A ‹ back button 44×44 sits top-left.
* **Dock** (2 tabs): tile 48px. 島 = `phone/glyph-map` on `--app-island #4FD1B5`. 旅の壺 = our jar glyph on `--app-jar #FFD84D`. The label sits beside the tile. Active tab: tile `translateY(-4px) scale(1.06)` + a `--c-leaf-soft` pill behind.

### T.2 Speech bubble + nameplate + ▼ (`Bubble.svelte`)

As v3 §4.1 (wobbly `--r-bubble`, `--bubble` fill, no border, lip `0 4px 0 var(--c-paper-2)`, a letter reveal at 33ms/char with pauses, an `aria-live` mirror, the ▼ in `--c-amber` `if-nudge` 700ms only when another page follows), plus:
* **Nameplate:** pill at `top:-14px; left:18px`, `rotate(-4deg)`, fill = speaker tag (`--tag-host #FFD84D` for しずえ), text `--fs-tag` 700 `--c-ink`, lip `0 2px 0` 15% darker. Pops 120ms after the box.
* The box is at least 64px tall and holds at most 2 lines at `--fs-talk` (1 line in compact mode, §R). Longer lines paginate with ▼ and never grow the box.
* Isabelle sits left of the bubble with her feet on the bubble's baseline: 84px tall (64px compact).

### T.3 Notification banner (`Toast.svelte` restyle)

NH NookPhone-style banner: slides down **below the status row** (`top: safe-top + 56px`). Pill, height 52px, `width: min(100% − 24px, 420px)`, fill `--bubble`, 2px `#EADBB8` border, lip `0 4px 0 rgba(74,58,44,.12)`. Left: a 36px icon on a 40px pebble (partner villager icon for partner events, `host/isabelle-icon` for system events, `money/miles` for milestones). Text: one line, `--fs-body` 700 `--c-ink-talk`, ≤ 16 characters. Right: a small `reactions/<id>` icon at 28px (e.g. `love` for a high-five). Motion: in `translateY(-120%) → 0` over 320ms `--ease-bounce`, hold 2600ms, out 220ms `--ease-soft`. Swipe up or tap to dismiss. `role="status"`. Max 1 visible; queue the rest.

### T.4 Cards: Nook Miles+ and DIY styles

* **Miles+ card** (the Jar's ladder rungs and purse): pastel card fill (one per card: `--card-pink #FFD9D9`, `--card-teal #C6EFE9`, `--card-butter #FCEDAA`, `--card-lime #DFF3AA`, `--card-lilac #E4D9FB`), radius 18px, 2px border in the fill darkened 12%, a **scallop texture** (`radial-gradient(circle at 50% 0, rgba(255,255,255,.35) 6px, transparent 6.5px) 0 0 / 16px 10px`), title centred `--fs-h2` 900 `--c-ink`. A completed rung shows a **stamp**: `money/miles` 40px in a dashed white circle, rotated −8°, entering with `if-stamp` (scale 1.6 → 0.95 → 1, opacity 0 → 1, 260ms). An incomplete rung shows an empty dashed white circle.
* **Jar page background:** `--miles-bg #C9D2FA` with a wavy cream header edge (an SVG wave 12px tall, `--bg`) under the hero, like the Miles+ screen.
* **DIY card** (check-in sheet body): fill `#F6EEDA`, a 16px grid of `rgba(110,160,200,.14)` 1px lines, radius `--r-card`, with a label tape at the top (`--c-yuzu-soft`, rotated −3°).
* **Paper card** (`.card`, everything else) is unchanged from v3 (stitching, label tape).

### T.5 Bells / Miles counters and stars

* **Bells pill** (savings amounts): fill `#FFF6D6`, 2px `#EAD29A`, lip 3px `#E3C77E`. `money/bells` 26px overlaps the left edge by −6px. The number is in `--font-num` 600 `--c-ink`. On change, the digits count up over 600ms and the bag plays `if-hop` (small, −10%).
* **Hero total** (Jar, harvest): no pill, `money/bells` at 1.1em before the number, `--fs-hero`.
* **Miles-style navy pill** (harvest grand total only): fill `#3B4A8F`, text `#FFFFFF` (9.6:1), `money/miles`-shaped bag at left. Use it for one number per screen at most.
* **Week stars** (harvest result row, like island evaluation): 5 stars, 18px, filled `#FFD84D` with a 1.5px `#C99A2E` outline, empty `#FFF3C4` with the same outline. Count = `ceil(avgScore / 20)`. Each star pops in with `if-pop`, staggered 120ms.

### T.6 Fonts

Keep **Zen Maru Gothic** (UI, 500/700/900) + **Fredoka** (numbers, 500/600/700). They are rounded, friendly and close to NH's humanist rounded type, and no Nintendo fonts are allowed. No new font packages.

---

## R. Small-screen rules (Builder B, Builder A for the scene)

**Breakpoints.** `--compact` applies when `(max-height: 700px) or (max-width: 359px)`. Tiny applies when `(max-width: 339px)` (320px phones). Portrait only. In landscape or on wide screens, the column is centred at `--col: 480px` and the scene sky stays full-bleed.

**Global.** Side padding `max(18px, safe-left/right)` (14px tiny). Status row at `top: safe-top + 8px`, height 44. Dock bottom at `safe-bottom + 8px` (min 10px). `100dvh` everywhere, never `100vh`. No horizontal scroll at 320. Text ≥ 11px. Inputs ≥ 16px (prevents iOS zoom). Tap targets ≥ 44px, 8px apart. `overscroll-behavior: none` on the body; sheets scroll internally. The keyboard is handled with `visualViewport`: `--kb = innerHeight − visualViewport.height − visualViewport.offsetTop`, and sticky footers get `translateY(calc(-1 * var(--kb)))`.

### R.1 島 Island

| Block (top → bottom) | iPhone 15 | Compact (SE) | Tiny (320) |
|---|---|---|---|
| Scene | `--scene-h` (§S.2) | same | same; the stage may crop the back sea |
| gap | 12 | 10 | 8 |
| Isabelle + bubble | 84 (Isabelle 84px, bubble 2 lines) | 64 (Isabelle 64, 1 line, `--fs-talk` .9375rem) | 60 (Isabelle 56) |
| gap | 12 | 10 | 8 |
| Primary button | 56 | 52 | 52 |
| gap | 12 | 10 | 8 |
| Dock | 72 | 60 (tile 40) | 56 (tile 38, labels 11px) |
| bottom | safe 34 | 8 | 8 |
| **`--chrome-below`** | **282** | **214** | **200** |

Score pills: iPhone 15 shows name tag 11px + score `--fs-h2` + `/100`. Compact drops `/100`. Tiny replaces the name tag with a 10px colour dot. Emote bubble 44 → 36px compact. The strength-confirm question replaces the primary button in the same 52–56px slot (two chips side by side), so the layout never jumps.

### R.2 旅の壺 Jar
Hero: jar art 120px (compact 96, tiny 84) + total `--fs-hero` (compact 2.25rem, tiny 2rem). The Isabelle line is a 1-line bubble with 72px art (compact 56). Cards stack in one column with 22px gaps (compact 16). Ladder rungs are Miles+ cards ≥ 56px tall, with the stamp 40px (compact 32). Content scrolls with `padding-bottom: dock + safe + 16px`. The hero shrinks by ≤ 20% on scroll via an `IntersectionObserver` class toggle (a single transform, not a scroll-linked animation).

### R.3 今夜のチェック sheet
`max-height: calc(100dvh − safe-top − 24px)`. Header 56 (compact 48): villager icon 48/40 + date. Rows ≥ 56 (compact 52), one column. Labels may wrap to 2 lines at 320, and chips wrap to a second row; never shrink below 44px. Footer: sticky leaf 「保存」 56px + `safe-bottom`, lifted by `--kb`. Focused inputs `scrollIntoView({block:'center'})`. Numeric inputs use `inputmode="numeric"` (or `decimal`). The DIY card body (§T.4) gets 12px padding in compact mode.

### R.4 Partner sheet
Height auto, `max-height: 72dvh`. Header: villager icon 64 (compact 56) + name + score. Fruit rings in 4 columns of 64px at ≥ 360px width, 2×2 of 64px below that. 「ハイタッチ」 is full-width 56 (compact 52). Sending it triggers R4 in the scene behind once the sheet closes.

### R.5 しまフォン launcher
The sheet height is `100dvh − safe-top − 12px`. Grid of 3 columns: tile 64 / gap 18 (compact 56 / 14, tiny 52 / 12). Labels ≤ 5 Japanese characters and ≤ 10 Latin characters in one line. Use the i18n short labels and never ellipsize. App pages scroll inside the phone. The 村人 picker shows 64px icons in 5 columns at ≥ 375px, 56px in 4 columns below that. Selected = leaf ring + check badge 20px.

### R.6 Sunday harvest overlay
`position: fixed; inset: 0`, padding = safe areas + 16px. Steps are centred in a `max-width: 420px` column. Person row: villager icon 40, 4 official fruit at 24px (tiny: 20, and the amount wraps to a second line), stars (§T.5), amount in a Bells pill. Total in the Miles-style navy pill, `--fs-hero` (compact 2.25rem). The confirm button is sticky at the bottom with `safe-bottom`. The confetti and fireworks layer is `pointer-events:none`, and the fireworks canvas is skipped at compact height (CSS dots only).

### R.7 Pair / まだ設定されていません (not set up)
Centred column. Hero: `deco/airport` 220px wide (compact 160, hidden when height < 600). The arrival metaphor: the dodo seaplane brings you to the island. Isabelle 72px + 1-line bubble. 6-digit code: 6 boxes of 44×56 (tiny 40×52), gap 8 (tiny 6), Fredoka 28px, `inputmode="numeric" autocomplete="one-time-code"`. The button is sticky above the keyboard (`--kb`). The not-set-up variant shows Tom Nook (`host/tom-nook` 120px, compact 96) + the existing link to `?demo`, with no input.

---

## 1. Colour (v4: brighter and sunnier; Builder B updates `tokens.css`, Builder A appends scene tokens)

Use semantic tokens (`--bg --surface --edge --text --text-soft --bubble --lip --stitch`) in components so night mode works for free. Buttons are always a **light fill with brown ink text** (≥ 5:1).

### 1.1 Core (day): values changed in v4 are in bold

| Token | v4 | Use |
|---|---|---|
| `--c-cream` | **`#FFF9E3`** | App background (+ `--pat-dots`) |
| `--c-bubble` | **`#FFFCEB`** | Bubbles, emote bubble, banner |
| `--c-paper` / `-2` | **`#FFF3D6` / `#F8E5BA`** | Cards / lip |
| `--c-stitch` | **`#E5CC94`** | Stitching |
| `--c-ink` / `--c-ink-talk` | `#4A3A2C` / `#6A5641` | Text |
| `--c-leaf` / lip / soft / ink | **`#6ED07A` `#4FB35C` `#C8F0C4`** `#2E6B38` | Primary |
| `--c-yuzu` / lip / soft | **`#FFD84D` `#E6B22E` `#FFF2B8`** | しずえ tag, celebrate |
| `--c-coral` / lip / soft / ink | **`#FF8F7A` `#E5735F` `#FFDCD3`** `#B04A3B` | Purse |
| `--c-sky` / lip / soft / ink | **`#6FCFF6` `#3FB0E3` `#D8F3FF` `#23688F`** | Info, sync |
| NH accents (new) | `--c-nook-teal #3FC1B0` · `--miles-navy #3B4A8F` · `--miles-bg #C9D2FA` · `--card-pink #FFD9D9` · `--card-teal #C6EFE9` · `--card-butter #FCEDAA` · `--card-lime #DFF3AA` · `--card-lilac #E4D9FB` | §T |
| Fx (new, Builder A) | `--fx-spark #FFE27A` · `--fx-heart #FF7FA8` · `--fx-note-1 #5BC85A` · `--fx-note-2 #4DB4F0` · `--fx-sweat #8FD3F4` · `--fx-zzz #8F9CE6` | §M.4 |

### 1.2 Night (19:00–06:00 or system dark): soft periwinkle, friendly

`--bg #33417A` · `--surface #45559A` · `--edge #6070B4` · `--text #FFF6E0` (≥ 7:1 on surface) · `--text-soft #D2D9F5` (≥ 4.5:1 on surface; verify) · `--bubble #FFF6E0` (bubble text stays `--c-ink-talk`) · `--lip #26306A` · `--stitch #6E7EC0` · moon accent `#FFF3C4`. Night primary button `--c-moon #FFE9A8` with lip `#D9BE6A`. `theme-color` `#33417A` at night and `#FFF9E3` by day.

### 1.3 Scene palette (season × day) — Builder A block in `tokens.css`, keyed on `data-season`

| Token | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| `--grass` / `--grass-2` | `#9BE36E` / `#8BD660` | `#7DDA55` / `#6ECC48` | `#CAD764` / `#BAC955` | `#FAFCFF` / `#E8F0FB` |
| `--grass-edge` | `#6FBF50` | `#55B340` | `#9DAE45` | `#C7D9EE` |
| `--cliff` / `--cliff-dark` | `#C9A26B` / `#A98250` | `#C9A26B` / `#A98250` | `#C49A62` / `#A07A4A` | `#B8C6D8` / `#97A8BF` |
| `--path` / `--path-edge` | `#EBCF92` / `#D3AF6D` | `#EBCF92` / `#D3AF6D` | `#E4C185` / `#CCA463` | `#E9E4DA` / `#D5CFC2` |
| `--sea-far` / `--sea` / `--sea-deep` | `#A6ECF7` / `#63D6EC` / `#33B9DF` | `#9CEBF8` / `#4FD2EE` / `#22B0E0` | `#A9E3F0` / `#5CC8E2` / `#3AAED6` | `#BCE3F0` / `#6BC2E0` / `#4AA6D0` |
| `--beach` / `--beach-wet` | `#FBEABB` / `#EED69A` | `#FDEAB0` / `#F0D592` | `#F5E2B0` / `#E6CD92` | `#EFEBE0` / `#DCD6C6` |
| `--sky-top` → `--sky-bottom` (day) | `#57B8F7` → `#CDEEFF` | `#3FA9F5` → `#BDE8FF` | `#69B8F0` → `#F8EDD3` | `#8EC6F0` → `#EEF6FF` |
| `--sun-disc` | `#FFE68A` | `#FFE066` | `#FFD27A` | `#FFF1C2` |
| `--sh-ground` | `rgba(46,100,40,.22)` | same | `rgba(90,80,30,.22)` | `rgba(80,100,140,.18)` |

Time of day changes only the sky, the clouds and `--tod-tint` (§S.11). Grass is never repainted at night; the tint handles it. Fruit (`--f-*`) and partner colours are unchanged.

## 2. Typography (unchanged from v3)

| Token | Size / lh | Family · weight | Use |
|---|---|---|---|
| `--fs-hero` | 2.75rem / 1.05 | num 700 | Jar total, harvest total |
| `--fs-h1` | 1.75rem / 1.15 | ui 900 | Titles |
| `--fs-h2` | 1.25rem / 1.2 | ui 900 | Card titles |
| `--fs-talk` | 1.0625rem / 1.5 (compact .9375rem) | ui 700 `--c-ink-talk` | Bubbles |
| `--fs-body` | .9375rem / 1.45 | ui 500/700 | Default |
| `--fs-tag` / `--fs-caption` | .8125rem | ui 700 | Tags, meta |
| `--fs-micro` | .6875rem | ui 700 | Dock labels (tiny) |

`font-feature-settings: "palt"`, `tabular-nums` in lists.

## 3. Shape, elevation, patterns (unchanged from v3 unless noted)

Radii `--r-sm 14 · --r-card 22 · --r-lg 28 · --r-phone 44 · --r-pill · --r-squircle 30% · --r-bubble (wobbly) · --r-blob`. Borders 2px. Signature **solid lip** (0-blur offset shadow in a darker shade of the fill) + `--sh-btn-hi`. Patterns ≤ 7% opacity: 島 = scene + `--pat-dots` below it. Jar = `--miles-bg` + scallops (v4). Harvest = night + stars. Progress = `--pat-stripes-fill` animated (stopped under reduced motion).

## 4. Components (unchanged from v3 except as noted in §T)

Chunky button `.btn` (pill, 56px, squash press `translateY(4px) scale(1.03,.94)`, bounce release; variants leaf · yuzu · coral · moon · paper). Paper card `.card` (stitching + label tape). Sheets (top radius 28, grabber 40×5, `translateY(100%) → 0` 260ms + 1.5% overshoot). Chips 44px. Switch 60×36 with a squashing knob. Fruit ring: the official fruit in the centre with the four ripeness stages (§S.8). Fallback chibi villager (v3 §7, unchanged; see the v3 file in git) renders only when an official render fails.

---

## W. Work split v4 (two builders; no shared files except marked blocks)

**Off-limits to both:** `app/src/lib/client/**` (store, gas, theme, assets: read only), the model/scoring, the service worker, `routes/pair` logic (B restyles markup only, coordinating with the engineer), `scripts/*`, `static/art/**` (the art director owns them).

| | **Builder A: island scene, characters, motion** | **Builder B: screens, chrome, theme, small screens** |
|---|---|---|
| Creates / owns | `lib/components/island/` (new folder: `IslandScene.svelte` (moved; keep the old path re-exporting it), `Sky.svelte`, `Clouds.svelte`, `Sea.svelte`, `Ground.svelte` (plateau, path, beach), `BackRow.svelte`, `FruitTree.svelte`, `FlowerBeds.svelte`, `Particles.svelte`, `Balloon.svelte`, `scene.ts` (coordinates and season tables from §S as data)) · `Villager.svelte` · `Host.svelte` · `Emote.svelte` (official reaction icons) · new `Fx.svelte` · `lib/components/motion/` (`idleLife.svelte.ts`, `bus.svelte.ts`, `reactions.ts` = the §M.5/§M.6 tables as data) · `lib/components/art.ts` (new helpers, §A) · `OfficialArt.svelte` · `Sprites.svelte` · `Silhouette.svelte` · `FruitRing.svelte` (fruit stage visuals) · `routes/dev/characters/+page.svelte` (gallery: every manifest key, every reaction played on demand, each season × tod via `?season=&theme=`) | `lib/styles/theme.css` · `lib/styles/tokens.css` (owner; v4 palette §1.1/§1.2, `--compact` media rules, §T tokens) · `Bubble.svelte` (§T.2) · `Toast.svelte` → banner (§T.3) · `ShimaPhone.svelte` + `HelpButton.svelte` (§T.1) · `TabBar.svelte` (dock) · `Sheet.svelte` (+ `--kb` keyboard lift) · `CheckinSheet.svelte` (DIY card) · `PartnerSheet.svelte` · `HarvestOverlay.svelte` (stars, navy pill, confetti/fireworks via A's `Fx`) · `SyncPill.svelte` · `Rope.svelte` · `LeafCoin.svelte` → Bells pill · `Yen.svelte` · `Avatar.svelte` · `routes/+layout.svelte` · `routes/+page.svelte` (island page layout §R.1, `--chrome-below`, calls `emit()`) · `routes/jar/+page.svelte` (Miles+ cards) · `routes/pair/+page.svelte` (markup/style only) · `lib/i18n/*` |
| Shared, append-only | `tokens.css`: a `/* Builder A: scene + fx + keyframes */` block at the end (§1.3, §M.2, `--fx-*`, `--tod-tint`) · `i18n/*`: `island.*` aria-label keys in a marked block | — |
| Interface contract | `<IslandScene view me onvillager={(who)=>…} onjar onfruit />` (props unchanged from v3 + `paused` boolean); `emit(event)`; `<Emote id size />`; `<Fx kind at />`; `--scene-h` read from the parent | Sets `--chrome-below` on the island page; passes `paused` when a sheet/overlay is open; calls `emit('checkin-saved' / 'highfive-sent' / 'sync-error')` |
| Order | 1 stage/sky split + no-shift layout · 2 trees + fruit · 3 back row, beds, beach · 4 rig + primitives · 5 emote + fx · 6 reactions + bus · 7 idle life · 8 particles/events · 9 perf pass | 1 tokens v4 + compact rules · 2 island page layout §R.1 · 3 dock + launcher · 4 bubble + banner · 5 sheets + keyboard · 6 Jar Miles+ · 7 harvest · 8 pair/not-set-up · 9 320px pass |

Both run `npm run check`, `npm test` and `npm run build` before every push, `git pull --rebase --autostash origin main`, and `git add` only their own paths. Screenshots for review are taken at 393×852, 375×667 and 320×568, day and night (`?season=…&theme=night`), and saved to `.shots/v4/` (gitignored).

---

## C. Detail checklist (builders tick, reviewers verify at 393×852, 375×667, 320×568)

**Scene layout**
- [ ] C1 The stage keeps `aspect-ratio: 390/360` at all three sizes, and only the sky height changes (§S.2 numbers ±4px).
- [ ] C2 At 320×568 the villagers, trees, jar, beds and beach are fully visible. Only the back sea may crop (on screens shorter than 568).
- [ ] C3 No layout shift on load (Lighthouse CLS = 0 on 島). Every image box is reserved from the manifest.
- [ ] C4 Villagers stand at x 84 / 306u, feet at y 286u ±2. Oaks at base y 238u, 150u tall.
- [ ] C5 Each oak carries 4 official fruit at the §S.8 positions, 22% of the tree width, in the right ripeness stage.
- [ ] C6 Score pills stay readable at night (above the tint) and follow the compact/tiny rules (§R.1).

**Background detail**
- [ ] C7 Sky gradient matches §1.3 for the season and §S.11 for dawn/dusk/night (sample the top and bottom pixels).
- [ ] C8 Clouds: 3 / 2 / 1 visible at 393 / 375 / 320, drifting at 140 / 100 / 75s with a flat bottom and a `--cloud-shade` underside.
- [ ] C9 The sea has 3 animated wave bands, 6 sparkles (3 at night) and a breathing shore foam line.
- [ ] C10 The beach has 3 shells by day and 2 glowing star fragments at night.
- [ ] C11 The plateau has a wobbly edge, a 14u cliff face with 2 strata lines, the diamond-checker grass texture and 12 tufts (no tufts in winter).
- [ ] C12 The dirt path forms a T: from the beach up to the Resident Services door, and across between the villagers.
- [ ] C13 Back row is complete: cedar (oak-winter in winter), 8 hedge bushes of the season pair, Resident Services, 4 fences (log in winter), mailbox, bench (bonfire on autumn/winter evenings), rock, 2 front palms, distant islet (≥ 375 only).
- [ ] C14 The flower beds show the §S.7 flowers for the season. Winter shows snow mounds instead.
- [ ] C15 Seasonal ground extras are present (petals / mushrooms + acorns / pine cones).
- [ ] C16 Night: moon + 12 stars, periwinkle sky (not navy), Resident Services windows lit, tint `rgba(64,78,160,.26)`, fireflies in summer.
- [ ] C17 Particles are of the right season, ≤ 14 on screen, using official petal/leaf/snowflake art.
- [ ] C18 Events can be forced with `?date=YYYY-MM-DDTHH:mm` on the dev gallery: cherry week, August Sunday fireworks, maple week, Toy Day presents, NYE.
- [ ] C19 The balloon present appears at most once per session (day only) and pops into confetti on tap.

**Characters & motion**
- [ ] C20 Every reaction R1–R19 can be triggered from `/dev/characters` and matches its §M.5 motion, emote icon, fx and duration (±50ms).
- [ ] C21 The emote bubble is 44px (36px compact) with a 34px official reaction icon, shifted toward the screen edge, ≤ 1 per actor.
- [ ] C22 Reactions start and end at `transform: none`, so there is no visible jump back into the idle bob.
- [ ] C23 Squash/stretch keeps scaleX×scaleY within 0.95–1.05 of 1, the origin is at the feet, and deformation never exceeds 14%.
- [ ] C24 Idle life fires every 8–15s, never puts two actors within 2s of each other (except chat/dance), and repeats no action back to back.
- [ ] C25 Idle life pauses when the tab is hidden, while a sheet is open and under reduced motion. It slows after 3 min and stops after 10 min idle.
- [ ] C26 A stroll walks ≤ 40u, flips facing, bounces and puffs dust, never reaches the jar, and the tap target moves with the villager.
- [ ] C27 Night 22–05: both villagers doze (slow breath, zzz, `sleepy`); a tap wakes them (`shocked` + sweat) and they fall asleep again after 10s.
- [ ] C28 しずえ bobs while idle, bounces while typing, and swaps pose with a 160ms crossfade and no flash of a blank image. She wears the winter outfit Dec–Feb.
- [ ] C29 Tapping a villager plays the squish + emote and opens the sheet ≤ 250ms after the tap.
- [ ] C30 Tree tap: shake 480ms, 2 seasonal leaves fall, the fruit detail bubble appears.

**Theme & chrome**
- [ ] C31 The launcher has 3 columns with 64px tiles (56 compact, 52 tiny) and uses the §T.1 official tiles/glyphs and tile colours. Labels stay on one line, with no ellipsis.
- [ ] C32 Dock: 島 uses the map glyph, Jar uses ours; the active tile is lifted; both targets are ≥ 44px.
- [ ] C33 Speech bubble: nameplate tilted −4° in `#FFD84D`; ▼ only when another page follows; ≤ 2 lines (1 compact); text reveal at 33ms/char and instant under reduced motion.
- [ ] C34 Notification banner: below the status row, 52px tall, icon + ≤ 16 chars + reaction icon; bounces in at 320ms, holds 2600ms; swipe or tap dismisses it.
- [ ] C35 Jar: periwinkle Miles+ background, pastel scalloped rung cards, a Miles stamp on completed rungs (`if-stamp`).
- [ ] C36 The check-in sheet looks like a DIY card (grid paper + label tape).
- [ ] C37 Bells pill with the bag overlapping on every savings amount. Navy pill only on the harvest total. Harvest rows show week stars.
- [ ] C38 Palette: day colours match §1.1/§1.3 (bright, saturated). Night matches §1.2. All text contrast is ≥ 4.5:1 (body) and ≥ 3:1 (≥ 18px bold).

**Small screens & a11y**
- [ ] C39 No horizontal scroll at 320. No text < 11px. All targets are ≥ 44px and ≥ 8px apart.
- [ ] C40 The island page fits without scrolling at all three sizes (`--chrome-below` 282 / 214 / 200).
- [ ] C41 The keyboard never covers the focused input or the save/pair button (iOS Safari + standalone PWA).
- [ ] C42 Safe areas: the status row clears the notch/Dynamic Island, and the dock clears the home indicator.
- [ ] C43 Reduced motion: no loops, particles or hops; emotes fade in for 1.6s; the scene still shows season and time of day.
- [ ] C44 Every tappable scene element is a `<button>` with an `aria-label`. Decorative art has `alt=""` and the scene SVG is `aria-hidden`.
- [ ] C45 Performance: ≥ 50fps at 4× CPU throttle on 島, no scene long task > 50ms after load, only transform/opacity animated (check the Layers / Rendering paint flashing).
