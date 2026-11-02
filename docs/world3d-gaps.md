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

2. **My villager in front of the tent covers most of its door** (tapwalk.spec "near its door my villager goes
   straight in", tent.spec, sync-harness.spec "one place at a time"). Expected: a tap on the tent goes in. Is: with
   my villager standing at the tent's way out (buildings.ts outOfTent: ±12, 30 in front of the door), its tap card
   (`[data-actor] button.vil`, ~61 × 84 px at the far end) covers the upper ~2/3 of the door's button (~78 × 55 px).
   A tap there is a tap on my villager (in front: right by depth), so only the door's lower corners go in. The specs
   now tap the door where it is the door's (`tapOn`). Worth a look: the villager's DOM card is the 2D render's size;
   sized to the 3D model's projected box (or the door's button sized to the tent's model) the tent would stay tappable
   round a villager standing at it.

## Open: engine / scene (the lead)

3. **No petals or maple leaves on the 3D pond** (seasonal.spec "the pond on 2027-04-05: petal floating"). Expected
   (docs/design.md "Pond"): petals afloat on the pond in cherry-blossom week (Apr 1–10), maple leaves in maple week
   (Nov 16–25). Is: the 3D island floats them on the stream only (floats3d.ts, `float-*` instances); the pond's floats
   were WorldWater's SVG, which the 3D island doesn't mount. The spec checks the stream's (`where('float-0').model`)
   and says so.

4. **The night sky is a sliver: few shooting stars** (celeste.spec "shooting stars every 3–8 s on a shower night":
   1 in 24 s, ≥ 2 expected; fixme'd on the 3D island). Expected: on a shower night a streak every 3–8 s, across the
   night sky clear of the controls. Is: at the default (whole-island) view on the iPhone 13 profile (390 × 664) the
   horizon is at y ≈ 105 px and the HUD's ribbon spans 10–54 px, so SceneTaps' shootingStar() has a band of ~40 px
   (band top + 6 to the horizon − 14) beside a wide ribbon: streakPath's 40 tries find no lane most times and the
   streak is skipped. The sun and the moon sit in the same sliver. Either the camera leaves more sky at night (or on a
   short screen), or the 3D island draws the streaks in its own sky (behind the trees, so they may cross them).

## Open: CI's software GL (SwiftShader), the engine (the lead): the cutover's blocker

CI's e2e draw in software (SwiftShader, one GPU process for every tab of the browser). Locally with
`E2E_SWIFTSHADER=1 E2E_ISLAND=3d`: 108 failed at 6 workers, 38 at 3 (CI's), 17 at 1; the gating 2D suite passes.

E1. **The 3D island never stops drawing.** Idle, even `?water=0&critter=none&visitor=none`, it draws 30 frames a
   second on a GPU and ~14 in software (the water's 30 a second; the season's falling leaves). A second tab in the same
   browser then opens 5–8× slower (its ribbon 6.5 s, its 3D island 23–36 s against 5 s): the two-phone specs
   (shared-world, guest, decor, board, sync-harness) run out, and input lags (health.spec's drag: `mouse.move` out of
   time). Where (engine.ts frame()): with the water off the loop runs only while something reports `more`, yet a
   summer noon with `?water=0&critter=none&visitor=none` still draws 30 a second on a GPU (60 frames in 2 s, no
   flourish playing): Island3D's frame hook (world.step, mirror, characterCards, villagerCards) reports motion every
   frame with nothing moving; November's falling leaves (stats().fx 6) make it 60. On CI (run 41463316947) the
   3D suite failed ~230 of ~380 against 38 locally at 3 workers. Wanted: on a software renderer (Island3D's swiftshader/llvmpipe check) the ambient motion off or a few frames
   a second, and an idle island drawing nothing.
E2. **Covered, it still draws**: with けんこう's popup over the island, ~14 frames a second in software. Wanted: no
   frames while a sheet covers it (`enabled()` false), as the 2D island pauses.

The specs meanwhile wait for the 3D island before they act (e2e/island.ts `is3d`), watch what comes and goes as it
opens (`watchFor`/`sawIt`), and fast-forward the page's clock instead of running it frame by frame
(`page.clock.fastForward`: under `runFor` each faked frame is drawn, a minute of them in software takes minutes).

## Hooks wanted (`window.__world3d`)

- `lamps(): string[]`, the ids of the lamps lit now (things.ts `lamps()` with the level > 0). fixed-decor.spec checks a
  seasonal lamp is lit by its model (`where('lantern-1').model === 'deco/mushroom-lamp'`) and `stats().points > 0`;
  the id list would say that lamp itself glows.

## Not gaps (the specs changed)

- The 3D camera shows the whole island at the default zoom: no scroll at zoom 1 (scroll.spec, world.spec's scroller
  checks are 2D-only; the 3D camera's own are world3d.spec's).
- A thumb's 44 px tap box (hitbox.ts MIN_HIT) reaches far deeper at the 3D far end: the day's weed at (221, 762) took
  tapwalk's tap at (196, 840). The spec taps clear of it.
- The tent's 3D villagers blink while the room is still (a frame per blink, tent/engine.ts): tent.spec allows two.
- A tree's popup on the 3D island goes over the canopies (FruitTree fitPopup), not a fixed place: scroll.spec checks the
  other tree stays tappable instead; demo.spec taps the same tree where its popup leaves it uncovered.
