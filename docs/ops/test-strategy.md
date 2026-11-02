# Test strategy: a 3D mobile web game

How we test しまの貯金箱 now that it's a three.js game with a lot of interactions, and why. The how-to (commands, the
rules for a stable spec) is in [testing.md](testing.md). This page covers what goes in which layer, and how CI gates the
deploy.

## Where we started (Nov 2026)

- Of the last 40 runs on `main`: **2 green, 22 red, 14 cancelled.** A green push took **~5 min** to go live: build
  35 s, then the 8 drawn e2e shards (75–210 s each, split by test count, so one shard holding the 3D specs ran 3× as
  long as another), then the deploy (20–30 s).
- The red came from a handful of 3D specs: board's 3D face (10 of 22 red runs), fishing3d ×3 (7), world3d's camera and
  tap tests (7, 6, 5, 4), say-rooms in the tent (4). They timed out, or `page.evaluate` hung for 60 s.
- **The cause:** CI's Linux runners have no GPU. Chromium draws WebGL in software (SwiftShader), and one
  `renderer.render` takes from hundreds of ms to seconds. The island's gameplay step (`world.step`, the villagers, the
  rod's pose) runs *inside* the 3D engine's frame. So under software GL the game itself runs slowly, and the main
  thread is blocked while it draws. Each 3D spec was testing SwiftShader's speed more than our game.
- Each newer push cancelled the older run, so in a burst of agent pushes nothing finished, and a red run blocked every
  deploy until someone fixed it.

## The pyramid for this game

| Layer | What | Where | Share |
|---|---|---|---|
| 1. Logic | pure functions and simulations: spawns, seeds, schedules, paths, scoring, sync merge | vitest (`*.test.ts`, 123 files) | the bulk |
| 2. Logic-mode e2e | the real app in a browser, the gameplay and DOM tap areas live, **the 3D engines drawing nothing** (`E2E_RENDER=none`) | Playwright, the gate | most e2e |
| 3. Drawn smoke | real WebGL: it draws, the camera, a tap lands on the model, the tent opens (`@render`, `@smoke`) | Playwright, the gate, 1 runner | ~10 tests |
| 4. Visual | screenshots at a fixed camera, time and seed, with a tolerance | Playwright `toHaveScreenshot`, full tier | a few |

Best practice for WebGL games (Unity/Unreal's play-mode vs edit-mode tests, three.js projects' headless sims, the
Playwright and Chromium teams' advice on GPU-less CI) says the same thing in each case: **keep the simulation apart
from the renderer and test the simulation without drawing.** Pixels are the slowest and least stable thing to assert,
so assert them rarely and in one place.

**1. Logic (vitest).** If an e2e asserts a rule ("a fish comes in 9 slots of 10", "Celeste one night in ten, at most
one a week", "Bunny Day hides an egg in a dig spot", "a fossil's replacement waits 20–40 s"), the rule belongs in a unit
test of the function that decides it (beach.ts, critters.ts, events.ts, meteor.ts, daySeed.ts), driven by a seed and a
date. Then the e2e only checks the wiring (one fish shows, one catch). Candidates to move down: the rule parts of
holidays.spec, celeste.spec, finds.spec (timing and counts), critters.spec and bugs.spec (who spawns when), weather.spec
(which day is which), seasonal.spec's date windows, and health.spec's sums and periods (the chart's maths).
**Determinism** is what makes this work: `?seed=`, `?date=`, the day's seeded RNG (daySeed.ts), and no `Math.random`
in a rule. A sim stepped with explicit `dt` (not wall time) is the next step: see "Time" below.

**2. Logic mode (`E2E_RENDER=none`, src/lib/ui-state/testMode.ts).** The 3D island and the tent build their scenes, load their
models, run every frame (cameras, gestures, `world.step`, the villagers' poses, the fishing rod, effects) and project
the DOM tap areas, but skip `renderer.render` and the shadow map. A frame then costs ~1 ms, not seconds. So a spec taps
the same DOM nodes and reads the same hooks (`__world3d`, `__villagers3`, `__tent`) as before, and needs no changes.
This is our version of the "null renderer" game engines ship for servers and tests. It's set with
`localStorage['e2e.render'] = 'none'` (the config does this for `E2E_RENDER=none`; it survives navigation) or
`?render=none&demo`, and `__world3d.stats().drawn` says which mode is on. A test that needs pixels or draw calls
(`stats().calls`, a canvas's alpha, vertex sanity) is tagged `@render` and runs only in layer 3.
Stays e2e, logic mode: anything that's a flow across the UI and the game (tap-walk, catch → plate → ずかん, the board,
decorating, tent editing, sheets and popups, sync between two phones, the HUD over the island, the 2D island while
it's still the default).

**3. Drawn smoke (`@render`, `@smoke`).** About ten tests with real (software) GL: the island draws and a lawn tap
walks; the camera's scroll and pinch; screen ↔ world (the tap areas sit on the models); nothing strays or goes NaN; the
night glows keep the canvas alpha; the tent opens and its floor tap walks; the villagers POC. These catch "it doesn't
draw" and "the projection is off". They're few, so they get one quiet runner and generous timeouts.

**4. Visual snapshots (to add).** A handful of `toHaveScreenshot` tests, each one scene at a fixed camera
(`__world3d.go(z, k)`), `?date=` and `?seed=`, `?critter=none&visitor=none`, ambience off (`?ambient=0&water=0`), and
DPR 1 at a small viewport, with `maxDiffPixelRatio` ~1 %. Candidates: the island by day and at night, the tent with a
few pieces, a villager's face. They run in the full tier only, against baselines made on the same CI image (software GL
renders differently from a Mac's GPU: never compare across the two). They catch lighting, material and shader
regressions that no hook sees.

## Time and waiting

- **Wait on state, never on time or frames:** `expect.poll(() => __world3d.camStill())`, `loaded()`, `idle()`, a
  `data-*` attribute. Never `waitForTimeout` to let something settle. A fixed wait is only for proving that nothing
  happens.
- **Control the clock:** `?date=` for the day and hour; `page.clock.install()` and then `page.clock.runFor(ms)` to step
  the game. Playwright's clock also fakes `requestAnimationFrame` and `performance.now`, so `runFor` *is* the sim-step
  API: each faked frame runs the engine's frame. Drawn under SwiftShader, a minute of frames took minutes (which is why
  specs used `fastForward`). In logic mode, `runFor(60_000)` is quick and deterministic.
- **Pin the ambience:** `?critter=none&visitor=none`, `?weather=`, `&rock=`, `?ambient=0`. Nothing should wander
  into a tap.

## The test API

Specs act on and query the game by id through stable hooks, not by guessing pixels: `__world3d.where(id)`,
`client(x, z, lift)`, `ground(cx, cy)`, `things(id)`, `go`, `zoom`, `camStill`, `idle`, `stats`; `__world.put/go/mine`;
`__villagers3.state/tool/tip`; `__tent.*`. e2e/island.ts wraps them (`is3d`, `w3`, `tapOn`, `tapThing`). A new
interaction comes with its hook and a `data-*` on its DOM node. When a spec reaches for `elementFromPoint` or a
hard-coded coordinate, a hook is missing.

## Two phones

Two phones are two tabs of one context, synced through `sync/live-local.ts` (a BroadcastChannel plays the relay's
room in-process). Nothing goes over the network, and it's deterministic. In logic mode neither tab draws, so a sync
spec costs two DOMs, not two GPUs. Keep it that way: never two drawn 3D tabs in one test. The real relay is checked
apart (`RELAY_E2E=1`, nightly or on demand), not on every push.

## CI (`.github/workflows/pages.yml`)

- **GPU runners aren't worth it here.** GitHub's GPU runners (T4) are paid larger runners, and its macOS arm64 VMs
  have no GPU passthrough, so WebGL is software there too. Logic mode removes the cost instead: SwiftShader only draws
  the ~10 drawn tests, at DPR 1 with shadows off (already automatic on a software renderer).
- **The gate** (what deploys): build ∥ checks (svelte-check, knip, vitest) ∥ the logic tier (8 shards) ∥ the drawn
  smoke (1 runner). **The full tier** (every test drawn, the quarantine, visuals) runs after the deploy and on the
  nightly, and flags failures in its summary. It never blocks the deploy.
- **Shards by time, not count** (scripts/e2e-shards.ts): the build plans Playwright test lists from each test's time
  on earlier runs (kept in a cache by the `timings` job), longest first onto the emptiest shard.
- **Flakes:** no silent retries. A failed test runs once more. If it passes then, the run stays green but the test is
  named in the summary as flaky, and the owner **quarantines it at once**: tag `@quarantine` with an annotation
  (owner, date, the failure). Quarantined tests leave the gate and run in the full tier until fixed. The quarantine
  is a short list with names on it, not a place tests go to be forgotten.
- **Newest green deploys:** one run at a time on `main` (a workflow-level concurrency group), never cancelled. A newer push waits, and any push still
  waiting is replaced by the newest. So in a burst of pushes the running one finishes and deploys, then the newest
  runs. That replaces the cancellation storm, where nothing finished.
- **Test impact analysis** (later, if the gate grows): `playwright test --only-changed=origin/main` on PRs, plus a map
  from source areas to specs (tent/** → tent*.spec). For now the gate is fast enough to run it all on every push.

## Deploy speed and risk

Two people use this app, and a bad deploy is fixed forward in minutes (or rolled back by re-running the last green
run's deploy). So the gate can be lean: correctness of rules (vitest), the flows (logic tier), and "it draws" (smoke).
The heavier checks run after the deploy. The target is **push to live in ~3 min**. We don't need a canary or
auto-rollback at this size. A red full tier is the next agent's first job, just as a red gate is.

## Ownership and process (agents)

- Before pushing a new or changed e2e spec, run it under CI's conditions, several times over:
  `npm run e2e:ci-like -- e2e/x.spec.ts --repeat 5` (software GL, CI's workers, CI=1; `--tier render` for a drawn
  one, `--workers 6` to load the machine).
- A test you see flake goes to `@quarantine` in that same push, with its owner. Don't rerun until it's green.
- Each spec's header names its area. Its owner is whoever last changed that area's code (the engine agent owns
  world3d.spec, fishing3d, seats3d; the layout agent owns layout-island and island-edit).
- Fix the cause: a missing hook, a wait on time, a tap where something wanders. Never loosen an assertion.
