# The 3D island's gaps (e2e on `E2E_ISLAND=3d`)

What the whole e2e suite found running on the 3D island (track C, the cutover's gate). Each: the spec, what's
expected, what happens, the diagnosis, and who fixes it. The specs' 2D-only checks are pinned to `?island=2d` and
the rest read the 3D island through `window.__world3d` (e2e/island.ts: `is3d`, `w3`, `tapOn`).

## Fixed

1. **A visitor in front of the campsite: the tap went to the door behind them** (bubbles.spec: K.K. and Jack at
   21:00). Expected: a tap on K.K. at the campsite plays his line (the balloon). Was: the tent's door button sat under
   his figure (the 3D camera shows the door small behind him; visitors are `pointer-events: none` and answer through
   SceneTaps), so the click was the door's and my villager went into the tent. Fixed in SceneTaps.svelte: a click on a
   building's door asks the visitor first and stops the door's (delegated) handler when they take it.

## Open: the island components (non-engine)

2. **My villager in front of the tent covers most of its door** (fixed): a 3D villager's DOM card is its model's
   core (villagers.ts size(): from its head's height standing, ~0.6 as wide; Island3D sets --v3w / --v3h, IslandScene's
   [data-v3] .vil takes them, no 2D padding or 64 px least size): at the tent's way out the card is 27 × 45 px (was
   40 × 56) and 42% of the door takes a tap (was 20%).

## Open: engine / scene (the lead)

3. **No petals or maple leaves on the 3D pond** (fixed): floats3d.ts floats five on the pond too (`float-pond-0…4`,
   circling inside its banks over 90 s) beside the stream's; seasonal.spec checks the pond's.

4. **The night sky is a sliver: few shooting stars** (fixed): on the 3D island SceneTaps' shootingStar() lets a
   streak cross on down over the island's far end (its band at least 150 px tall from under the HUD), so on the
   390 × 664 profile a shower night brings its streaks; celeste.spec's shower runs on the 3D island again.

## CI's software GL (SwiftShader), the engine: the cutover's blocker

CI's e2e draw in software (SwiftShader, one GPU process for every tab of the browser). Locally with
`E2E_SWIFTSHADER=1 E2E_ISLAND=3d`: 108 failed at 6 workers, 38 at 3 (CI's), 17 at 1; the gating 2D suite passes.

E1. **The 3D island never stops drawing** (fixed). It drew 30 a second idle with nothing moving on a GPU (~14 in
   software), 60 in November (the falling leaves) and at night (the zzz). Causes: a part's `kick()` inside a frame
   (a card's `set` each frame) scheduled the next frame, and an ambient flourish's spawn (the fall, a zzz) counted as
   activity (60 a second for 400 ms). Now (engine.ts frame()): each part says what it wants (`Want`: true it moves,
   the full rate; `'ambient'` only its ambience, the water, the fall, a fire's flicker, an emitter, a blink, at
   `Options.ambient` a second, on a timer, no display frames woken between; false nothing), a kick from inside a
   frame is that frame's own, and `stats().why` names what wanted the last one. On a software renderer the ambience
   runs at 2 a second (`?ambient=` sets it anywhere). Measured (390 × 664, idle 4 s after load, frames a second):
   GPU summer noon with the water off 30 (the villagers' blink: ambience), with it 30, November noon 30 (was 60),
   November night 33 (was 61); SwiftShader 2, 2, 2.5 and 4 (was ~14). With the critters and visitors about, what
   moves still draws at the full rate (13 a second in software).
E2. **Covered, it still draws** (fixed): `Island3.pause(on)` from Island3D's `enabled()` (a sheet over the island):
   0 frames in 3 s under けんこう's popup (`stats().paused`).

The specs meanwhile wait for the 3D island before they act (e2e/island.ts `is3d`), watch what comes and goes as it
opens (`watchFor`/`sawIt`), and fast-forward the page's clock instead of running it frame by frame
(`page.clock.fastForward`: under `runFor` each faked frame is drawn, a minute of them in software takes minutes).

## Hooks (`window.__world3d`)

- `lamps(): string[]` (provided): the ids of the lamps lit now (lights.ts `lit()`: a model's id, a stand-in's `s:`
  prefixed; none by day). fixed-decor.spec checks the seasonal lamp itself glows (`lamps()` has `lantern-1`).
- `stats().why` (the parts that wanted the last frame, `~` ambience only) and `stats().paused`.

## Not gaps (the specs changed)

- The 3D camera shows the whole island at the default zoom: no scroll at zoom 1 (scroll.spec, world.spec's scroller
  checks are 2D-only; the 3D camera's own are world3d.spec's).
- A thumb's 44 px tap box (hitbox.ts MIN_HIT) reaches far deeper at the 3D far end: the day's weed at (221, 762) took
  tapwalk's tap at (196, 840). The spec taps clear of it.
- The tent's 3D villagers blink while the room is still (a frame per blink, tent/engine.ts): tent.spec allows two.
- A tree's popup on the 3D island goes over the canopies (FruitTree fitPopup), not a fixed place: scroll.spec checks the
  other tree stays tappable instead; demo.spec taps the same tree where its popup leaves it uncovered.
