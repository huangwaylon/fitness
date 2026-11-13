# Testing: the tiers, CI and stable e2e specs

How the app is tested and what gates a deploy. The relay's own checks: [runbook §8](runbook.md#8-deploy-the-live-relay).

## Why the tiers
CI's Linux runners have no GPU: Chromium draws WebGL in software (SwiftShader), one `renderer.render` taking hundreds of
ms to seconds, and the island's gameplay steps inside the 3D engine's frame. So the gate runs the game without drawing
(**logic mode**), and drawing is judged on the iOS Simulator and the phones (iPhone 15/16 Safari, Metal). GPU runners
aren't worth it: GitHub's are paid, and its macOS VMs draw in software too.

| Tier | What | Where |
|---|---|---|
| Unit | pure rules and simulations: spawns, seeds, schedules, paths, scoring, sync merges | vitest (`src/**/*.test.ts`), the `unit` job |
| Logic-mode e2e | the real app in a browser, gameplay and DOM tap areas live, the 3D engines drawing nothing | Playwright: the gate (a selection) and the full logic tier after each deploy (all) |
| Drawn smoke | real WebGL: it draws, the camera, a tap lands on the model (`@render`, `@smoke`) | after each deploy, advisory; everything drawn on demand |

- **A rule belongs in a unit test.** If an e2e asserts a rule ("four dig spots a day"), test the function that decides
  it (beach.ts, critters.ts, events.ts, meteor.ts, daySeed.ts) with a seed and a date; the e2e checks only the wiring.
  `?seed=`, `?date=`, the day's seeded RNG and no `Math.random` in a rule make it deterministic.
- **The game clock.** Every position is a function of the time, and the World steps itself every 33 ms while anything
  moves when no drawn frame has (camera.svelte.ts `simTick`), so a slow or undrawn picture never slows the game.
- **The test API.** Specs act and query by id through hooks (`__world3d`, `__world`, `__villagers3`, `__tent`, wrapped
  by e2e/island.ts), not pixels. A new interaction comes with its hook and a `data-*` on its DOM node; a spec reaching
  for `elementFromPoint` or a fixed coordinate means a hook is missing.
- **Two phones** are two tabs of one context, synced through `sync/live-local.ts` (a BroadcastChannel plays the relay's
  room): no network, deterministic, neither tab drawing. Never two drawn 3D tabs in one test. The real relay: on demand
  (`RELAY_E2E=1`, `e2e/sync-harness.spec.ts`).
- **A lean gate, fixed forward.** A bad deploy is fixed in minutes (or the last green deploy re-run), so the gate is
  lean (~3 min to live) and the heavier tiers run after the deploy. A red gate or a red full logic tier is the next
  push's first job.
- **Ownership.** Each spec's header names its area; its owner is whoever last changed that area's code. Fix a flake at
  its cause (a missing hook, a wait on time, a tap where something wanders); never loosen an assertion.

Open: the rule parts of the holidays, celeste, finds, critters, bugs, weather and seasonal specs into vitest; visual
snapshots in the full tier.

## CI (`.github/workflows/pages.yml`)
*Deploy UI* runs on a push to `main` touching `app/**`. A docs-only push runs *Docs check* (`docs.yml`: docs-check
alone); relay changes run *Relay checks* (its path filter kept in step by `relay/test/paths.test.ts`).

These gate the deploy:

- `plan`: the **gate's plan** for all shards (the `gate-plan` artifact: `scripts/e2e-impact.ts`, `e2e-flakes.ts`,
  `e2e-shards.ts plan`). `checks`: `check`, `knip`, the quarantine's owners and docs-check. `unit`: `npx vitest run`.
  Jobs wait on each other by `needs`, never by polling the API (the workflow token's quota is per repo and hourly).
- `e2e-gate` ×4 (after `plan`): **the gate's e2e** (below) in Chromium, logic mode, without `@render` and `@quarantine`, on the build
  served as Pages serves it (`scripts/serve-build.ts`). Each shard builds (with its budgets); shard 1's `build-pages/`
  is the `site` artifact `deploy` ships.
- `deploy` (after all of them): `site` to Cloudflare Pages once every job in its `GATE` env (pages.yml; checked by `scripts/deploy-gate.ts`) is `success` (ききみみ's
  `stt/` from an Actions cache, `scripts/stt-models.ts`). Then https://island-fund.pages.dev must answer this build
  (`_app/version.json`, 6 min at most) with its CSP header and the `stt/` manifest: only the deployment's own URL
  serving it is a **Pages alias lag** warning; neither is **Deploy not served**, red. No Cloudflare secret: a warning,
  nothing deployed.

After a deploy, never holding one back:

| Workflow · job | What |
|---|---|
| *e2e logic full* (`e2e-logic-full.yml`) · `e2e-logic` ×6 | **the full logic tier**: every test the gate's way, the auto-quarantined too, on the deployed commit after each green *Deploy UI* run (and on demand). A failure is an `::error` on its spec and the workflow red: the next push's to fix first |
| · `e2e-render` | **the drawn smoke**: `@render` and `@smoke` with software GL; advisory |
| · `coverage` | line coverage per file (`npm run coverage`): every file under `contract/` and `sync/`, and `store/actions.ts` and `store/meals.ts`, at 85 % or its ratchet floor (`scripts/coverage-floors.ts`); red under it |
| · `timings` | test times folded into `e2e/timings.json` (the `e2e-timings` artifact; when the shards' spread drifts, `npm run e2e:timings` and commit it), and **what the gate missed** (`scripts/e2e-missed.ts`): each failing spec the gate didn't run, with the `e2e/impact.json` rule to add |
| *e2e full tier* (`e2e-full.yml`) ×10 | **everything drawn**, on demand only (SwiftShader's timings made it red nightly): the whole suite with real GL, `E2E_SLOW=1` (a test 90 s, an expect 20 s) |

- **Red main never deploys, never older over newer, and the newest green does.** Runs overlap, never cancelled; only
  `deploy` is one at a time (`cloudflare-deploy`; a newer waiting one replaces an older), and its order guard
  (`scripts/deploy-order.ts`) deploys nothing when the live commit is the same or newer, red when unsure.
- **The gate** (`scripts/e2e-impact.ts`; `npm run e2e:impact` shows what it would run): (1) the **gate set**,
  `e2e/gate.json`, 18 fast, stable spec files over the core flows; (2) the specs the push **changed**, each test 3×,
  never retried (the `chromium-x3` projects, `E2E_X3`): one failure in three is a flake the push brought, red; (3) the
  specs its files **reach**: a changed e2e helper's importers (over `MAX_IMPORTERS`, 10, and fixtures.ts: the gate set instead), a src or content file's by
  `e2e/impact.json` (path globs to spec names; else the file's own name), and a changed i18n catalog's every spec that
  spells one of its old strings (a value changed or dropped: copy a spec clicks by). Changes count from the commit live on the
  site (an unusable base: the gate set and more up to the budget, with a warning). Over the budget (`CAP_MS`, ~1300 s of
  tests) the reached specs drop out first, then the changed run once each (so do over `MAX_CHANGED`, 8, changed specs: a sweep). Every directory under `src/` and `content/`
  maps to a spec or is in `impact.json`'s `unmapped` with why, and every spec opening `/editor/?view=phone` is in the
  editor/ and layoutEdit/ rules (src/lib/e2e-impact.test.ts).
- **Flakes: one retry, and a ledger.** On CI `retries: 1`: failing twice is red; passing on the retry is **flaky**,
  named by e2e/reporters/flaky.ts in the summary and uploaded (`flaky-<shard>`): the **flaky ledger** (`npm run
  e2e:flakes`: the last 48 h). **Auto-quarantine:** a test flaky on 2+ commits in 48 h leaves the gate (at most 5;
  never a gate set test), named with its owner, still run by the full logic tier; a fix to its spec lifts it at once
  (scripts/e2e-flakes.ts's header). Locally (`npm run e2e:ci-like`) there's no retry: a flake is red.
- **Tags**: `@render` needs real drawing (the drawn smoke only); `@smoke` is a 3D flow worth drawing too (both tiers);
  `@quarantine` is broken: out of the gate and the full logic tier, with an `annotation` of type `quarantine` naming
  the owner and why; `@logic` never draws (annotation `logic`); `@chromium` can't run on WebKit, with why. List them:
  `npx playwright test --list --grep @quarantine`.
- **Logic mode** (`E2E_RENDER=none`; src/lib/ui-state/testMode.ts): the 3D engines run every frame (scene, cameras,
  gestures, the World's step, poses, tap areas) but never draw, ~1 ms a frame; `__world3d.stats().drawn` is false. A
  map is its stub; `e2e.render` `map` (e2e/trips.ts `mapsDrawn`) draws the maps only.
- **WebKit, the users' browser** (Playwright's WebKit as an iPhone 15), runs in **the flake hunt**
  (`e2e-flake-hunt.yml`) on macOS runners (Linux's WebKit draws at ~1 fps): weekly and on demand, the logic tier each
  test 3×, no retries. Red when anything failed once; it gates nothing. WebKit itself crashing is named, not red
  (`scripts/e2e-report.ts` `VERDICT`). Once green across the board it replaces Chromium as the gate.
- **The base path.** The specs follow `BASE_PATH` (`e2e/island.ts` `BASE`, `islandURL`): `BASE_PATH=/x npm run build`,
  then `BASE_PATH=/x npm run e2e`.
- **The headers.** `serve-build.ts` serves `build-pages/_headers` (`scripts/headers.ts`) as Pages does, and
  `csp.spec.ts` walks every surface and fails on any CSP violation.
- **The trip map.** In the logic tier `TripMap` is a stub with its pins as buttons (`travel-map.spec.ts`,
  `window.__travelMap`). Every map tile host is answered on every context (`e2e/mapTiles.ts`; refreshing the fixtures:
  `e2e/trips.ts`), so a drawn map never reaches the network.

## CI cost
Public-repo minutes are free; the cost is queue time (macOS runners queue longest), so: batch pushes (one per finished, verified group of fixes)
and measure locally (`npm run e2e:ci-like`, the hunt on the Mac) rather than dispatching CI. Cuts available: the full
logic tier on a schedule (in `e2e-logic-full.yml`, swap `workflow_run` for the commented `schedule`; its `throttle` job
runs only when a deploy landed since) and a self-hosted runner for the e2e jobs.

## Run it locally
```sh
cd app
npm run build                       # the e2e test the build, not the dev server
npx playwright install webkit       # once per Playwright version
npm run e2e -- --project=webkit   # this checkout's own port (from its path; E2E_PORT=… to pick one); --project=chromium: the installed Chrome
npm run e2e -- e2e/demo.spec.ts --project=webkit --repeat-each=10   # hunt a flake
E2E_SWIFTSHADER=1 npm run e2e -- e2e/world3d.spec.ts --project=chromium   # software GL, as CI's Linux draws
E2E_RENDER=none npm run e2e -- --project=chromium   # the logic tier: the 3D engines draw nothing
npm run e2e -- --project=chromium-mic   # the mic's specs (kikimimi-mic*.spec.ts): a fake mic fed our clip, muted
npm run e2e:ci-like -- e2e/world3d.spec.ts --repeat 5   # as CI runs it (below)
npm run e2e -- e2e/csp.spec.ts --project=webkit --workers=8   # a worker a test (below)
```
One-off measuring probes, done and deleted, are at the `probes` git tag (`git show probes:app/scripts/<name>.ts`).

Local WebKit on a Mac loses a page's WebGL context after a test with sound (csp.spec at `--workers=1`, kk-sync): give
each test its own worker, or check them on the flake hunt.

## Before you push (a new or changed spec, or a change to the 3D engines, the tent or sync)
1. `npm run verify` (~20 s): `checks` as CI runs it (scripts/verify.ts: the lockfile, `check`, `knip`, `knip-relay` (with relay's `node_modules`), `vitest run`,
   the quarantine's owners, `scripts/docs-check.ts`: rename a heading and repoint its citations in the same push).
   `-- --quick`: vitest on the changes only; `-- --build`: the build and its budgets too. No e2e. **The pre-push hook
   runs it** (`.githooks/pre-push`, set by app's `npm ci`: `verify -- --build` for a push changing `app/`, the docs
   check for docs only; over 50 MB of new files refused unless `BIG_PUSH=1`). Bypass `--no-verify`, then fix forward.
2. `npm run e2e:ci-like -- --changed` (or `-- e2e/the.spec.ts --repeat 5`): the logic tier as CI runs it (a fresh
   build if `src/` is newer, software GL, CI's workers, `CI=1`, a free port), each test 5×. `--tier render` for a drawn
   test; `--tier full` draws everything; `--workers 6` loads the machine as a busy runner is.
3. All green, every time: push (`git pull --rebase origin main && git push origin HEAD:main`). One failure in 5 is a
   flake: fix it now, or quarantine it in the same push with its owner.
4. Watch the run (`gh run watch`), then the full logic tier after its deploy. Red is yours to fix first.

## Hermetic
Every e2e runs in a sealed world (e2e/fixtures.ts; its header has the mechanics), so a run today and in a month see the
same island.

- **Import Playwright from `./fixtures.ts`**, never `'@playwright/test'` (the lint: `src/lib/e2e-hermetic.test.ts`).
- **The clock is pinned** at `PINNED_DATE` (2026-11-04 12:00 Tokyo: a Wednesday, clear all day, no event), every
  context's. A `?date=` in the URL still wins: say the day and hour when the test is about them. A page that installs
  its own clock (`page.clock.install({ time })` before it opens) owns it; `test.use({ ownClock: true })` lifts the pin
  for a file.
- **The weather is pinned**: the pinned day's seeded sky, or a fixture (`?wx=…`, `?weather=`).
- **Ambient life is off**: nothing spawns or wanders on its own (critters, the day's visitor and guest, the balloon,
  idle beats, an ordinary night's shooting stars); an event's host still comes. The villagers are asleep while their phone isn't
  open (`?awake`, `?grace=`, `?wake=`). A URL's own param wins (`?critter=fish`, `?visitor=jack`). A test of ambient
  life opts back in: `test.use({ ambient: 'on' })`.
- **The tests' own relay agrees with its phones**: liveRoom.ts and record.ts run on the pinned time; read it as they
  do, `island.now()`, `rec.now()`, never `Date.now()`.
- **No network**: a request off the local preview fails the test, naming it. Mock a relay with `page.route` /
  `context.route` (board.spec, record.ts, liveRoom.ts); map tiles are answered already; the real relay's harness is the
  one opt-out (`test.use({ network: 'any' })`). Unit tests too: a real fetch, WebSocket or socket off this machine
  fails the test (src/no-network.setup.ts, vitest's `setupFiles`).
- **No randomness**: no `Math.random` in a spec; pin the island with `?seed=`, `&rock=`, `&shake=`, `?critter=`,
  `?visitor=`.
- **Storage**: each test its own context, service workers blocked; two phones in one context share `localStorage` and a
  BroadcastChannel. `bringToFront()` the tab that acts, and wait for a second tab's island (`is3d`, `quiet`) before
  timing across the two.
- **Taps on the 3D island are frame-locked** (e2e/island.ts `tapAt` and what's built on it): the point read in a held
  frame and tapped before the next, polled while a tap area lies over it; `castIn` and `reelOnBite` likewise.
- **Read the hooks once they're there**: `__world` comes before `__world3d` (`camTo` and `settled` wait for both);
  after a `goto` or `reload` wait with `islandUp`, not the HUD: until the ground's fields are in
  (layout/fieldsPrime.ts) every island target sits hidden at the scene's corner.
- **Silent**: Chromium muted on a fake audio output (playwright.config.ts); WebKit headless makes no sound.
- **No new fixed wait**, wall-clock sampling or long test: ratcheted ("Guardrails").
- **Wait for what an action loads**: a tap that deals a deck, opens a sheet or enters a room may load a chunk first.
- **Vitest's module cache** never keeps a module with an `import.meta.glob` (vite.config.ts `globsUncached`); anything
  odd after a big rebase: `npx vitest run --clearCache`.

## Test mode
`?demo` is a test harness, not a feature: made-up rows (`store/demo/`) instead of the relay, the two players as two
tabs (`sync/live-local.ts`), and the URL and window hooks. It switches on (`ui-state/testMode.ts`) only
- in the dev server (`import.meta.env.DEV`; there without `VITE_RECORD_URL` even with no `?demo`), or
- in a production build when the browser has `localStorage['e2e.testMode'] = '1'` before the app loads:
  e2e/fixtures.ts sets it on every context (`test.use({ testMode: false })` is a real visitor's phone, boot.spec), and
  the perf and Simulator scripts set it (perf-start, leak-probe, unused-probe, ios-sim-check, ios-sim-indoor).

So the e2e tests the very build that ships, and a visitor's `?demo` on the live site is the normal app (pairing, or
their data). A feature that calls a Worker gets no in-app fixture: its spec pairs a phone (e2e/record.ts) and routes
the Worker (`page.route`: gymbot.spec, its.spec).

## URL params
Read on each call by `world/devHooks.ts` (the seasonal ones by `ui-state/preview.ts`). The island's hooks work in dev
builds or test mode; `?date`, `?theme` and `?season` work everywhere:

| Param | Effect |
|---|---|
| `?demo` (`=harvest`, `&as=B\|G`, `&weeks=60`, `&health=none`) | [Test mode](#test-mode): made-up data, no backend; the harvest recap; play as B or the guest; a longer history; no Health rows |
| `?date=YYYY-MM-DDTHH:mm` | The scene clock (Tokyo), this page load only (it moves the shared day too) |
| `?theme=dawn\|day\|dusk\|night`, `?season=` | Preview a time of day or a season |
| `?seed=` | The island's seed (finds, weather, visitors) |
| `?weather=clear\|cloudy\|rain\|heavy\|snow\|fog\|aurora\|rainbow` | Force the weather (the critters' too) |
| `?wx=real\|game` | The island's weather mode for this load |
| `?wx=rain-pm\|clears\|typhoon\|snow\|fog\|cloudy\|stale` | A canned real-weather timeline (`world/wxFixtures.ts`) |
| `?event=<id>` | Show an event (the preview's ids: `halloween`, `cherry`, `birthday-A`, `wedding`…) |
| `?visitor=<id>\|none\|events`, `?arrive`, `?leave=<ms>`, `?stroll[=<ms>]`, `?meet` | A visitor (`events`: an event's host only); its arrival; its departure; a stroll; the partner's hello |
| `?kk=show\|day\|asleep` | K.K. on his stool, whatever the clock |
| `?critter=fish\|pond\|<fish>\|<pond fish>\|<bug>\|none`, `&coast=front\|back\|left\|right`, `?sea=<id>\|pearl`, `?flea` | A critter now (ambient visits off), a sea fish off that side; a dive spot; a flea on every villager tap |
| `?shake=nest\|branch\|bagworm\|spider\|coconut\|wood` | The next shake drops that |
| `?rock=clonk\|sparkle\|bug` | Every rock tap has that outcome |
| `?find=bottle\|fragment\|mushroom\|rare-mushroom\|earth-egg\|washed` | A beach find now / every dig spot that / a bottle washing in |
| `?balloon`, `?fireworks`, `?shower`, `?stretch`, `?hybrid` | A balloon (`=none`: never); a show; a meteor shower's night; the tape deck; a hybrid flower |
| `?hit` | Every tap target drawn over the island |
| `?fpv=1\|0` | The rooms' first-person view for the tab |
| `?awake`, `?grace=<ms>`, `?wake=<ms>` | Everyone counts as online (no villager sleeps); the [Sleep](../design.md#sleep) grace and a tap's wake that long |
| `?idle=none`, `?stars=none` | No idle beats; no ordinary night's shooting stars |
| `localStorage['e2e.ambient'] = 'off'` | The e2e's ambient life off (e2e/fixtures.ts): `critter=none`, `visitor=events`, `guest=none`, `balloon=none`, `idle=none`, `stars=none` unless the URL sets them |
| `?relay=<wss url>&key=<key>` | Test mode over a real relay (`e2e/sync-harness.spec.ts`) |
| `?quietafter=<ms>` | How long a phone gone quiet inside a room stays shown there |
| `?render=none` | The 3D engines run but draw nothing (logic mode: `ui-state/testMode.ts`) |

Anywhere: `?panel=rewards` opens ごほうび at once; the 3D island's renderer takes `?dpr=<ratio>`, `?aa=0|1`,
`?shadows=0|1`, `?ambient=<fps>`, and for the phones' A/B (perf.drag, perf.rest) `?dprmove=<ratio>` (while the camera
moves: 1.5), `?shadow=<px>` (the shadow map: 2048), `?cull=0` (every still thing drawn: world3d/things.ts cull),
`?points=<n>` (the real point lights: 6) and `?pointmask=0` (the unlit point lights' shader mask off: on by default,
bend.ts pointMask). The editor's params: [island-layout.md](../island-layout.md). `window.__world` (`cam()`, `go(z)`,
`at(x, z)`, `put(x, z)`, `idle()`, `quiet()`, `perf`, `stops()`, `mine()`, `partner()`, `geo()`, `site()`, …) serves
the e2e and the console (e2e/island.ts wraps them).

## Guardrails
`src/lib/e2e-budgets.test.ts` (the `unit` job) counts the flaky patterns per file in `e2e/*.ts` against the ceilings in
`e2e/budgets.json`; a file over its ceiling, or a new file with any, fails, saying what to do instead:

| Rule | Counts | Instead |
|---|---|---|
| `waits` | `waitForTimeout(`, a `setTimeout` promise (a `// hold:` too) | wait on state; prove "nothing happens" with `page.clock.runFor` |
| `wallClock` | `performance.now(`, `requestAnimationFrame(` in a spec | the speed/step rule in vitest with an explicit dt; step `page.clock` |
| `longTests` | `test.setTimeout(` over 30 s, `test.slow(` | split the test; its rule parts into vitest |
| `textSelectors` | `getByText(`, `hasText:` in a spec | `getByRole` or a `data-*` hook (text is copy) |

Fixed one? `UPDATE_BUDGETS=1 npx vitest run src/lib/e2e-budgets` lowers the ceilings to the counts (raising one is a
hand edit, explained in the commit).

## Writing a stable spec
Most red runs are the spec, not the app. Run a new or changed spec with `--repeat-each=10` (and the whole file with
`--workers=8`: a loaded machine is what CI is).

1. **Never tap where something can wander.** Tap a point only once it is *that* thing's, read and tapped in one held
   frame (`tapAt`), or pin the scene. Prefer a locator's own click to `page.mouse.click(x, y)` off the island.
2. **Wait on the app's state, not on time.** `expect(…).toBeVisible()`, `expect.poll(() => window.__world.cam())`,
   `__world.idle()`, `__tent.stats().frames`, `data-*` attributes, `__world3d.camStill()` (the tap areas placed for the
   camera's last move); never `waitForTimeout` to "let it settle" (the hooks are `unknown` on `Window`, `src/app.d.ts`:
   a spec types what it reads).
3. **Fix the clock.** Pinned already; `?date=2026-11-04T12:00` when the hour matters; `page.clock.install({ time })`
   when the app's timers matter, `page.clock.runFor(ms)` to skip a wait (it fakes `requestAnimationFrame` too).
   ききみみ's schedule runs on it (a clip's window is its clips.json length, never the audio's): install the clock before
   the goto and step to the state (e2e/kikimimi-nav.ts `runToQuestion`, `runToPhase`, `runToSee`); never step while a
   mic take listens (its stand-in audio is real time).
4. **Find things by role or test id**, not by position or `nth()`: `getByRole('button', { name })`, `[data-tab=…]`,
   `[data-critter]`. Add a `data-*` hook when there is none.
5. **WebKit is the browser.** It scrolls by whole px (compare a camera z with a tolerance), has no mouse wheel on a
   phone (`scrollBy`), moves focus with ⌥Tab, and has no CDP. Reproduce CI's WebKit on a Mac, not in Docker.
6. **Two phones in one context share storage**, and a hidden tab's timers are throttled: bring the acting tab to the
   front, and poll the other for the result.
7. **Banners and sheets cover things.** A toast drops over the panel's tabs for a few seconds (longer under a resting
   pointer): tap it away, or wait for it to go.
8. **Each test starts clean** and short: don't lean on another test's leftovers or make one test do three's work.
9. **Don't loosen an assertion to make it pass.** If the app is wrong, fix it or say so in the commit.
10. **Fishing**: e2e/island.ts `toTheWater`, `tapWater`, `castIn` and `reelOnBite`, never fixed points (one can be a
    door). `__fish.why()` names what the last tap on water did, `__fish.line()` its phase; `__world3d.pinBite('mine')`
    holds a 「！」 up.
11. **Tap a pill only once it's at rest** (Playwright calls a thing in a staggered transition's delay "stable"):
    `e2e/hud.ts` `unfoldMenu` / `fromMenu` wait for the spring. A route failing chunks fails every lazy load under it:
    route just before the one tap it's for (`e2e/stale.spec.ts`).
12. **One width, the phones'** (393 px): a flow runs at 390 or 393, a narrow width only where the layout itself is the
    test. **Debug pictures** (`page.screenshot` asserting nothing) only under `SHOTS=<dir>`:
    ``if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/name.png` })``, any wait for the
    picture inside the same `if`.

## Memory
The PWA stays open for days, so a scene's round trip must leave nothing behind: `e2e/leaks.spec.ts` (`@chromium`) goes
in and out of the rooms and the info sheets and checks, after a forced GC, that no WebGL context, window/document
listener or the editor's ArrayBuffers are left over; `e2e/leaks-sheets.spec.ts` does the sheets (`e2e/memory.ts`;
`Runtime.getHeapUsage` `backingStorageSize`: typed arrays and decoded models, outside the JS heap). To hunt one: `npm
run leak -- <flow> [cycles] --snap` (scripts/leak-probe.ts: its header lists the flows and flags) against a served build
(`E2E_PORT`). What the leaks taught:
- **A page-wide hold keeps its component**: a `window.__*` hook, a module's callback or a `<link>`'s listener holding a
  component's closure holds its DOM and its renderer. A hook goes in the scene's cleanup (only if still its own); a
  module's callback, and a let-go value written inside a cleanup, is made at module level. Vite's preload listeners:
  vite.config.ts `preloadListenersOff`. A child's value in a parent's bound prop (a ‹ handler, a snippet) outlives the
  child: clear it in the child's cleanup.
- **three.js**: a renderer stays alive while anything it drew is undisposed; every surface ends its renderer with
  world3d/stage.ts `endRenderer`. Models kept page-wide are lean (release.ts `lean`).
- **A cache keyed by a value lives as long as it does**: keep history (the editor's undo) as plain data; bound a
  page-wide cache by its users (world3d/keepUsed.ts).
- **MapLibre**: a map goes by travel/map/glmap.ts `removeMap`, not `map.remove()` alone.
- **The probe's own handles** keep what they point at: wait on booleans.

## Load budget
`npm run build` ends with `scripts/load-budget.ts`: the first load (what `index.html` loads, transitively) ≤ 400 KB of
JS and 70 KB of CSS gzipped, none of it three.js, MapLibre or a feature's sheet, and the service worker's precache
≤ 3 MB on the wire. Bytes only: over one, the build fails. Timing: [perf.md](perf.md#measuring).

## Unused assets
`npm run unused` (`scripts/unused-assets.ts`, read-only; its header: the kinds and flags) sorts every file under
`static/` and module under `src/` into safe to delete, used and unsure. Check a deletion against what the built island
draws: `node scripts/serve-build.ts <port>`, `node scripts/unused-probe.ts <port> /tmp/seen.txt` (red on a 404 under
art/, room/, terrain/), then `npm run unused -- --seen=/tmp/seen.txt`.

## The iOS Simulator check (the real target, on the Mac)
`npm run ios:check` (scripts/ios-sim-check.ts: the island's load, idle and scrolling frames, けんこう and ごはん over it,
the page's errors and screenshots into `test-results/ios-sim/<time>/`; `--url`, `--seed`, `--then`, `--boots`: its
header) and `npm run ios:indoor` (scripts/ios-sim-indoor.ts: the tent, うめ's house, the museum and the shop, cold then
warm, and what still runs after each: a leak). Exit 1 when the island didn't come up. On demand, and nightly by a
launchd agent (its plist: scripts/ios-sim-check.ts's header).
