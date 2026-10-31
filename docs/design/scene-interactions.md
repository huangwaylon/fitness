# Scene interactions: tapping the scenery

Code: `app/src/lib/components/island/SceneTaps.svelte` (the flourishes), `sceneTaps.ts` (the hit test and the sound
hook), `data-bush` / `data-flower` hooks in `BackRow.svelte` / `FlowerBeds.svelte`, and the balloon's hop
(`Balloon.svelte`). E2E: `app/e2e/scenery.spec.ts`.

**Why.** In New Horizons and Pocket Camp nothing on the island is dead scenery: hedges rustle, flowers wiggle, running
leaves footprints, fish shadows swim, shooting stars cross the night. Here every part of the island answers a tap in
the same soft, toy-like way, without counting for anything.

## Rules (for every scenery tap)

- **Short and subtle:** ≤ 1 s; it should feel like brushing past something, not a reward.
- **No points and no state:** it never touches ベル, opens a sheet, navigates or writes anything. Rare surprises (a
  butterfly, a fish shadow, a shooting star) are only something to look at.
- **Cheap:** one `pointerdown` listener on the scene; transforms and opacity only (shakes are one-shot Web Animations on
  the art's own element). At most 4 flourishes at once, ≤ 6 nodes each, removed after ≤ 1.1 s. When idle nothing runs
  except the night's shooting-star timer.
- **Buttons come first:** taps inside a control (trees, fruit rows, jar, villagers, balloon, the HUD) are ignored; the
  art keeps `pointer-events: none`. A tap that closes a tree's popup only closes it. The popup's 🥥 chips (きのう / きょう, ADR 0023) are buttons: a tap on one toggles that
  gym day and keeps the popup open.
- **Scene state:** nothing spawns while `data-covered` (a sheet is open) or `data-paused` (hidden), or in gallery
  thumbnails.
- **Reduced motion:** every tap gives only a soft glow at the tap point (450 ms, opacity); no shakes, no idle shooting
  star.
- **Accessibility:** decorative, pointer-only, in an `aria-hidden` layer, no focus stops. Bushes and flowers have
  tile-sized cells (≈ 44px); sky hit boxes are padded to ≥ 44px.
- **Night:** the layer sits over the time-of-day tint (sparkles and fireflies glow); ground flourishes are dimmed to
  55% at night, 85% at dusk.

## Element → response

| Element | Tap response | NH / Pocket Camp reference |
|---|---|---|
| Hedge bush | A 0.52 s squash-and-jiggle on its foot; three leaves pop off and flutter down: petals in spring, green leaves in summer, maple leaves in autumn, snow clumps in winter | Shrubs shake and shed leaves or petals; winter trees drop snow |
| Flower | Wiggles on its stem (0.62 s); two petals drift down, a ✦ pops. 1 in 8 (day, not winter): a common butterfly flutters off. Summer nights (1 in 2): a firefly rises | Flowers wiggle when walked through; butterflies by day, fireflies on summer nights |
| Sea | Two ripple rings and three droplets (0.8 s); 1 in 10: a fish shadow surfaces and slips away | Casting ripples, fish shadows |
| Sand | Two fading footprints and a dust puff | Footprints and dust on the beach |
| Grass | A dust puff; in winter a snow puff and two footprints | Running dust; snow keeps footprints |
| Cloud | Squishes like a marshmallow (scale only, on top of its drift); three wisps break off | A Pocket Camp–style toy response |
| Sun | A scale bounce, a halo ring, a turning glint and two lens flecks down-right | NH's sun glare |
| Moon (night) | Bobs, a star twinkles, a shooting star streaks down-left | Shooting stars on clear nights |
| Night sky | A star twinkles at the tap; 1 in 4, a shooting star follows | Twinkling stars |
| Idle, clear night | A shooting star every 45–120 s (not covered, hidden or under reduced motion) | Meteor showers |
| Balloon present | A rubbery wobble and a hop up its string; no pop, no present | Balloons (shot down in NH; here only nudged) |

Not built, by choice: message bottles and star fragments (they imply something to collect or state across days),
wishing on a shooting star (implies an outcome), bugs on the trees (the trees are buttons), weather taps (no weather
source yet).

## Sound

Scenery taps call `sceneSfx(kind)` (`island/sceneTaps.ts`), which plays the `scene-<kind>` cue from `sound/cues.ts`:
quiet world cues (silent under a sheet), low gain, pitch-jittered, two at once at most. Bush → `rustle`, flower →
`swish`, butterfly / sun / moon / star → `sparkle` at different pitches, cloud → `puff`, shooting star → `twinkle` (not
a jingle: it doesn't duck the music), sea / fish → `splash`, sand / grass / snow → `step-sand` / `step-grass` /
`step-snow`, balloon → `squeak`. All are synth placeholders ([sound.md](sound.md) §8); a file in
`static/audio/manifest.json` replaces any of them. Audio also unlocks on `pointerdown`, so the first tap is heard.
