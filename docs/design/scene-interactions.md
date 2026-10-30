# Scene interactions: tapping the scenery

Status: implemented (round 15). Code: `app/src/lib/components/island/SceneTaps.svelte` (the flourishes),
`sceneTaps.ts` (the hit test and the sound hook), plus `data-bush` / `data-flower` hooks in `BackRow.svelte` /
`FlowerBeds.svelte` and a hop added to the balloon's wobble. E2E check: `app/e2e/scenery.spec.ts`.

## Why

In New Horizons and Pocket Camp nothing on the island is dead scenery. Brush past a hedge and it rustles. Walk
through flowers and they wiggle. Running kicks up little dust puffs and leaves footprints in sand and snow. The sea
has fish shadows. On a clear night you might see a shooting star. Up to now our island only answered taps on the
things that *do* something (the trees, the fruit, the jar, the villagers, the balloon). Everything else ignored the
finger. This round makes the rest of the island answer a tap too, in the same soft, toy-like way, without making
any of it count for anything.

## Rules (for every scenery tap)

- **Short and subtle.** ≤ 1 s (a butterfly or shooting star is 0.85 to 1.05 s). It should feel like brushing past
  something, not like a reward.
- **No points and no state.** It never touches ベル, never opens a sheet, never navigates and never writes anything.
  Rare surprises (a butterfly, a fish shadow, a shooting star) are only something to look at. There are no drops.
- **Cheap.** One `pointerdown` listener on the scene. It uses transforms and opacity only. The shakes are one-shot
  Web Animations on the art's own element (`rotate` / `scale`, which add on top of the art's CSS `transform`).
  There are at most 4 flourishes at once, with at most 6 nodes each, and each is removed after ≤ 1.1 s. When idle
  nothing runs except the night's shooting-star timer. No layout reads happen except the stage / orb / cloud boxes,
  once per tap.
- **Buttons come first.** Anything inside a control is ignored: the canopies and fruit rows, the jar, the villagers,
  the balloon, and the HUD (which lives outside the scene). The art keeps `pointer-events: none`, so no new hit
  boxes cover a button. A tap that closes a tree's popup only closes it.
- **Respects the scene state.** Nothing spawns while `data-covered` (a sheet is open) or `data-paused` (the page is
  hidden), or in non-live gallery thumbnails.
- **Reduced motion.** Every tap gives just a soft glow fade at the tap point (450 ms, opacity only). Nothing shakes
  and there is no idle shooting star.
- **Accessibility.** Purely decorative, so it is pointer-only, inside an `aria-hidden` layer, and adds no focus stops
  or labels. Bushes and flowers have tile-sized tap cells (≈ 44u ≈ 44px at 390). Sky hit boxes are padded to ≥ 44px.
- **Night.** The layer sits over the time-of-day tint (so sparkles and fireflies glow). The ground's flourishes are
  dimmed to 55% at night (85% at dusk) to match the tinted island.

## Element → tap response → game reference

| Element | Tap response (implemented) | NH / Pocket Camp reference |
|---|---|---|
| **Hedge bush** (official bush art) | The bush rustles: a 0.52 s squash-and-jiggle pivoting on its foot. Three leaves pop off the top and flutter down to either side. Seasonal: **cherry petals** in spring (official `season/petal`), green leaves in summer, **maple leaves** in autumn (official `season/maple-leaf`), **snow clumps** in winter. | NH shrubs (azalea, hydrangea, hibiscus, tea olive, holly, camellia) shake and shed a few leaves or petals when you run into them. Trees drop seasonal leaves and blossoms when shaken. In winter, shaking a tree drops snow. |
| **Flower** (official flower art) | The flower wiggles on its stem (0.62 s, squash then ±9°). Two petals in the species' colour drift down, and a little ✦ sparkle pops at the bloom. **Rare (1 in 8, day, not winter): a common butterfly** (white with a yellow edge) flutters up off the bloom and away. **Summer nights (1 in 2): a firefly** rises out of the bed, blinking. | NH flowers wiggle when you walk through them. Butterflies spawn around flowers by day (common butterfly, yellow butterfly), and fireflies come out on summer nights. |
| **Sea** (around and behind the island) | Two foreshortened ripple rings and three droplets where you tapped (0.8 s). **Rare (1 in 10): a fish shadow** surfaces and slips away (1.05 s). | NH: casting into the water makes a ring and splash, and fish shadows swim the sea. Pocket Camp's fishing spots ripple. |
| **Sand** (the beach) | Two little footprints that fade, plus a puff of sand dust. | NH: running on the beach leaves footprints and kicks up dust puffs. |
| **Grass** | A small puff of dust. **Winter: a snow puff plus two footprints in the snow.** | NH: running leaves white dust puffs. Snow keeps footprints. |
| **Cloud** | The cloud squishes like a marshmallow (0.62 s, scale only, on top of its drift), and three soft wisps break off the tapped edge and dissolve. | Not interactive in the games. This is a Pocket Camp-style "toy" response in NH's soft cloud style. |
| **Sun** | The sun pops (scale bounce). A halo ring, a turning four-point glint and two lens flecks streak down-right (the light comes from the upper left). | NH's sun has a lens glare when you tilt the camera up. |
| **Moon** (night) | The moon bobs, a star twinkles by it, and a **shooting star** streaks down-left across the upper sky. | NH: on clear nights shooting stars cross the sky (you wish on them with A, and Celeste visits on meteor-shower nights). |
| **Night sky** | A star twinkles where you tapped. 1 in 4 times, a shooting star follows. | As above. NH's sky has twinkling stars. |
| **Idle, clear night** | A shooting star crosses on its own every 45 to 120 s (not while covered or hidden, and never with reduced motion). | NH's meteor showers. |
| **Balloon present** | Kept the rubbery wobble, plus a little **hop up on its string** that bobs back down. Still no pop and no present. | NH: you shoot balloons down with a slingshot. Here, to keep it pointless (no points), a tap only nudges it. |

## Left as ideas (not built)

- **Message bottle** bobbing in at the shore (NH's daily bottle). Charming, but it implies a message or DIY to
  collect, and it needs a shore-path animation longer than 1 s. It would be best as a rare idle event with no tap.
- **Star fragments on the beach** the morning after a shooting star (NH). That needs state across days, which these
  taps must not have.
- **Wishing:** tap during a shooting star to make a wish ("☆ ねがいごと…" bubble). It would be cute, but it is a
  game mechanic with feedback that implies an outcome.
- **Seagull / Gulliver** washed up on the beach. Too big a character for a tap flourish.
- **Rain / snow weather taps** (puddle ripples on the ground). We don't have weather yet. The sound engine's
  `Weather` could drive it later.
- **Bugs on the trees** (cicadas in summer, NH's tree bugs). The trees are buttons, so their taps already belong to
  the tree.
- **Wet sand darkening** under the footprints at the waterline, and **wave foam** chasing the tap on the shore.
  Both are nice, but the foam is drawn in the ground SVG, so it would cost more.

## Sound

The sound engine (`src/lib/sound/`, with `cue(id)` in `cues.ts` and the catalogue in `ids.ts`) was not on main when
this landed, so scenery taps call one hook: `sceneSfx(kind)` in `island/sceneTaps.ts`, a no-op for now. To wire it,
replace its body with a lookup into `cues.ts` (add the cues below to `Cue` / `CUES`). The ids marked *new* need a
sound in `ids.ts` (a synth placeholder, or a file in `static/audio/manifest.json`).

| `sceneSfx(kind)` | Wanted cue → sound | Notes |
|---|---|---|
| `bush` | `scene-bush` → `rustle` (gain ≈ .7) | the same leafy rustle as `tree-shake`, lighter |
| `flower` | `scene-flower` → **new `swish`** (or `rustle`, gain .35, +5 st) | a soft grass swish |
| `butterfly` | `scene-butterfly` → `sparkle` (gain .3, +7 st) | fired together with `flower` |
| `cloud` | `scene-cloud` → **new `puff`** (a soft airy "pof"), or `pop` at gain .4 and −5 st | |
| `sun` | `scene-sun` → `sparkle` (gain .5) | |
| `moon` | `scene-moon` → `sparkle` (gain .4, −3 st) | |
| `star` | `scene-star` → `sparkle` (gain .3, +12 st) | a tiny high tink |
| `shooting-star` | `scene-shooting-star` → **new `twinkle`** (NH's shooting-star "shiing", a rising glissando, ≈ .6 s) | also fires for the idle shooting star. Not a jingle: it must not duck the music |
| `splash` | `scene-splash` → **new `splash`** (a water plop) | |
| `fish` | `scene-fish` → `splash` (softer, −4 st) | the fish variant of a splash |
| `sand` | `scene-sand` → **new `step-sand`** (a soft footstep crunch) | |
| `grass` | `scene-grass` → **new `step-grass`** | |
| `snow` | `scene-snow` → **new `step-snow`** (a squeaky snow crunch) | winter grass |
| `balloon` | `scene-balloon` → **new `squeak`** (a rubbery boing), or `pop` at gain .5 and +7 st | |

All of these should be `sfx` bus, low gain (≤ .5) and with pitch jitter (NH never repeats an effect at the exact
same pitch), with `max: 2` so rapid taps don't stack.
