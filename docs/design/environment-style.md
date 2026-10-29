# Environment style (art director, round 7)

**Decision: "Pocket Camp diorama".** Our villagers, trees, flowers and fruit are official 3D renders: soft shading, a key light from the upper left and front, rich saturation, no outlines. The scenery has to be painted the same way. Every ground, water and sky surface gets **one base fill, one gentle gradient (lighter toward the upper left and the distance), one soft lower shade, and sparse official-style flecks**. **No strokes and no offset lips on scenery** (the lip stays on chrome). Contact shadows are soft and radial. This replaces v5's "NH map look" for the scene: the map is UI art, not a scene.

## References (`.refs/pocketcamp/`, Nookipedia)
- `Campsite_PC_Artwork.png`: **the precedent.** Official renders on a flat-tone green diorama with scattered light flecks, an earthen rim and banded flat mountains.
- `PC_Saltwater_Shores_1.png`: shallows #61D4C9 going out to azure #3F92CF. Wet sand #D5A65B against dry #EEC471. Soft blob shadows.
- `PC_Sunburst_Island_1.png`: cliff lit on top, dark below (#B39670 to #7F614A). Hazy horizon.
- `PC_Title_Screen_1.0.0_Spring.png`: white clouds with a soft pale-blue underside.
- `PC_Campsite_Winter.png`: snow with blue-lilac shade and scalloped edges.
- `NH_Key_Art_Logoless.jpg`: sky #5AABFA to #93E1FC. Sea: horizon haze, then open #4388E3, then shallow #5BE0F2, then white foam.
- `Summer_Beach_NH_Artwork.jpg`: deep #3A84D5, translucent shallows, one foam line, sand #FFD678.
- `PanchamBro_NH_Island_Screenshot_-_Daiken_Key.jpg`: NH grass is plain green with sparse two-tone triangles. Terracotta cliff.

## Audit (`.shots/v6/ad-day-393.png`, `ad-night-393.png`, `ad-winter-393.png`, `ad-dusk-375.png`, `ad-dawn-320.png`)
| # | Element | Inconsistency |
|---|---|---|
| A1 | Sea | Flat mint with hard ▲ marks (map-UI art). No depth, no shallows. |
| A2 | Shore | A rounded-rectangle beach with a uniform white outline. It reads as a board, not an island. |
| A3 | Framing 393 | The stage is 479px wide, so the plateau is cut straight at both screen edges. |
| A4 | Grass | Regular diamond wallpaper with no light falloff. The renders look like stickers on it. |
| A5 | Cliff | A uniform 6u tan band with no shading. |
| A6 | Sun | A flat disc with no glow. Hidden behind C2 at 393, crowding the NookPhone at 320. It sits on the right, against the renders' upper-left light. |
| A7 | Clouds | A hard offset lip strip (a chrome idiom). Oversized at 393. |
| A8 | Moon | A flat crescent with no glow. |
| A9 | Shadows | Hard flat ellipses. Weak under villagers, missing under fruit. |
| A10 | Night | The sea turns navy but the grass stays bright: a daylit island under a night sky. |
| A11 | Winter | Mint summer sea, unshaded white plateau, grey sand. |
| A12 | Dusk | Muddy grey-teal sea. |
| A13 | Jar | Flat hand-drawn glass among the renders. |

## Spec
u = stage unit. Light from the upper left. Gradients use `userSpaceOnUse` over each element's bounding box.

**Framing.** Keep the stage formula and the horizon cap. Redraw the plateau as an **organic shape spanning x 40–350u** and move the **trees to x 88 / 302**, so sea shows on both sides at every width:
| Viewport | Horizon | Stage (1u) | Plateau on screen | Sun core / glow | Clouds C1 / C2 |
|---|---|---|---|---|---|
| 393×852 | 179px | 479 (1.23px) | 6–387px | 30 / 84px | 120 / 86px |
| 375×667 | 140px | 375 (0.96px) | 38–336px | 26 / 72px | 100 / 72px |
| 320×568 | 109px | 320 (0.82px) | 33–287px | 22 / 60px | 64 / 48px |

**Sky** (top, 55%, horizon):
| Time of day | Top | Mid | Horizon |
|---|---|---|---|
| Day | #4AA3F6 | #79C9FC | #C6EEFF |
| Dawn | #7FA8E8 | #F6C3B4 | #FFE6CC |
| Dusk | #5B6FC4 | #F59A86 | #FFD39A |
| Night | #1F2C66 | #34478F | #5A6CB4 |

Season shifts (day only): summer top #2F92F0; autumn horizon #E8F2EE; winter #8EC2EE / #BFE0F8 / #EEF7FF.

**Sun.** Upper left, at left 18% and 58% down the sky band. One radial gradient: #FFFEF2 from 0 to 35%, #FFE989 at 50%, transparent at 100%. Dawn/dusk: 22% above the horizon, core #FFF3D6, glow #FFB36B.

**Moon.** Same position. Crescent #FFF4C8 with a glow of rgba(255,244,200,.35) out to 2.2× its radius. Keep the stars.

**Clouds.** Keep the lobes and drop the lip. Vertical gradient: #FFFFFF from 0 to 55%, #E8F2FC at 80%, #D2E3F5 at 100%. Underside: dawn #FFE0D2, dusk #FFC9B0, night #7F8CC8 at 0.6. Keep them in lanes away from the sun.

**Sea** (one layer, from the horizon to the bottom):
1. Gradient: haze #8EDDF5 (top 4u), then #4C9DE8 at 25%, then open sea **#3D8FE2**.
2. Glints instead of ▲ marks: white 6×1.5u rounded dashes at 40% opacity, about 2% coverage, denser near the horizon. Their drift is the one sea animation.
3. Shallow ring: 16u outside the beach, #5ED8E8 fading outward.
4. Foam: a 2.5u white wavy line on the beach edge, plus a second line 7u out at 45%.

The tint (below) darkens the sea, so delete the per-time sea tables. The chrome under 島 uses the computed open sea: day #3D8FE2, dawn #3D81C1, dusk #3D78A3, night #255CC5.

**Sand.** A crescent that wraps the front and sides down to y 352u, with a wavy edge. Radial gradient #FCE7AE (upper left) to **#F4D184**. Wet band 5u, #E2B66E. Cliff-foot shade #D6AE68 at 50% opacity, 8u blur. Winter: #EEE6D4, wet band #D2C7B0.

**Cliff.** Front 12u tall, tapering to 6u at the sides. Gradient #DDA472 to **#B97A50**, two faint strata lines #C88B5D, and a 3u grass overhang of #5FA847.

**Grass:**
| Season | Base | Highlight | Fleck light | Fleck dark |
|---|---|---|---|---|
| Spring | #7CC95A | #9BD970 | #A8E07A | #5EAE47 |
| Summer | #5DBE4A | #7CCF5E | #8ED96C | #46A23A |
| Autumn | #A8C457 | #C2D46E | #D9C26A | #8AA845 |
| Winter | #F5F8FF | #FFFFFF | none | shade #D5E0F2 |

The highlight is radial, centred at (30%, 25%). Flecks are 5u NH triangles, randomly rotated, about 3% coverage, seeded with `rng()`. Winter: 6u scalloped snow over the cliff edge.

**Contact shadows.** Radial, fading to 0, offset +6% right and down.
- Colour: on grass rgba(34,74,28,.32), on sand rgba(140,98,40,.28), on snow rgba(80,110,160,.25).
- Size (rx / ry): villager 0.30h / 0.06h, tree 0.26h, jar 0.55w, fruit 0.45 of its size.
- Dusk: ×1.25 to the right.

**Jar.** Glass #DDF2FB, an upper-left white streak at 30%, a lower-right shade of #BFDCEA. No outline.

**Time of day.** One tint layer with `mix-blend-mode: multiply` over the environment and sprites (the jar, stars and fireflies stay above it): dawn #FFE6DA, dusk #FFD7B8, night **#9AA4DE**. Season comes only from the palette tables.

## Build checklist
- [ ] Ground: organic plateau x 40–350u, trees at 88/302, sand crescent, wet band, cliff gradient, overhang.
- [ ] Grass: delete the diamonds. Radial highlight plus seeded triangle flecks per season.
- [ ] Sea: gradient, glints (one animation), shallow ring, two foam lines.
- [ ] Sky table. Sun/moon upper left with a glow. Clouds use the gradient fill, no lip, sized per the table.
- [ ] Radial, surface-coloured shadows under villagers, trees, jar and fruit.
- [ ] Multiply tint. Delete the sea time tables. Chrome uses the computed hexes.
- [ ] Winter: snow shade, scallops, sand and sky.
- [ ] Jar highlight and shade.
- [ ] No scenery strokes or lips. Check 393/375/320 × day/dusk/night/winter.

No official runtime textures: Nookipedia's ground, sea and sky images are perspective screenshots with UI baked in. All of the above is SVG/CSS; `fetch-assets.ts` is unchanged.
