# Testing: the tiers, CI and stable e2e specs

The single description of how the app is tested and what gates a deploy. The relay's own checks: [runbook §8](runbook.md#8-deploy-the-live-relay).

## Why the tiers
CI's Linux runners have no GPU: Chromium draws WebGL in software (SwiftShader), and one `renderer.render` takes
hundreds of ms to seconds. The island's gameplay step runs inside the 3D engine's frame, so a drawn spec there tests
SwiftShader's speed more than the game. So the gate runs the game without drawing (**logic mode**), and drawing is
judged on the iOS Simulator and the phones (iPhone 15/16 Safari, Metal). GPU runners aren't worth it: GitHub's are
paid, and its macOS VMs draw in software too.

| Tier | What | Where |
|---|---|---|
| Unit | pure rules and simulations: spawns, seeds, schedules, paths, scoring, sync merges | vitest (`src/**/*.test.ts`, ~360 files), the `unit` job |
| Logic-mode e2e | the real app in a browser, gameplay and DOM tap areas live, the 3D engines drawing nothing | Playwright: the gate (a selection) and the full logic tier after each deploy (all) |
| Drawn smoke | real WebGL: it draws, the camera, a tap lands on the model (`@render`, `@smoke`: ~16 tests) | after each deploy, advisory; everything drawn on demand |

- **A rule belongs in a unit test.** If an e2e asserts a rule ("four dig spots a day", "Celeste one night in ten"),
  test the function that decides it (beach.ts, critters.ts, events.ts, meteor.ts, daySeed.ts) with a seed and a date;
  the e2e checks only the wiring. Determinism makes this work: `?seed=`, `?date=`, the day's seeded RNG, no
  `Math.random` in a rule.
- **The game clock.** The island's life runs on time, not frames: every position is a function of the time, and the
  World steps itself every 33 ms while anything moves when no drawn frame has (camera.svelte.ts `simTick`), so a slow
  or seldom-drawn picture never slows the game.
- **The test API.** Specs act and query by id through hooks, not pixels: `__world3d.where(id)`, `client`, `ground`,
  `things`, `go`, `zoom`, `camStill`, `idle`, `stats`; `__world.put/go/mine`; `__villagers3.*`; `__tent.*`, wrapped by
  e2e/island.ts (`is3d`, `w3`, `tapOn`, `tapThing`). A new interaction comes with its hook and a `data-*` on its DOM
  node; a spec reaching for `elementFromPoint` or a fixed coordinate means a hook is missing.
- **Two phones** are two tabs of one context, synced through `sync/live-local.ts` (a BroadcastChannel plays the
  relay's room in-process): no network, deterministic, and in logic mode neither tab draws. Never two drawn 3D tabs in
  one test. The real relay is checked on demand (`RELAY_E2E=1`, `e2e/sync-harness.spec.ts`).
- **A lean gate, fixed forward.** Two people use the app and a bad deploy is fixed in minutes (or the last green run's
  deploy re-run), so the gate is lean (push to live in ~3 min) and the heavier tiers run after the deploy. A red gate
  or a red full logic tier is the next push's first job.
- **Ownership.** Each spec's header names its area; its owner is whoever last changed that area's code. Fix a flake
  at its cause (a missing hook, a wait on time, a tap where something wanders); never loosen an assertion.

Open: the rule parts of holidays, celeste, finds, critters, bugs, weather and seasonal specs into vitest; visual
snapshots (`toHaveScreenshot` at a fixed camera, date and seed, baselines made on CI's image) in the full tier; the
layout specs drawn in the full tier.

## CI (`.github/workflows/pages.yml`)
A push to `main` that touches `app/**` (a docs-only push runs *Docs check*, `docs.yml`: docs-check alone; relay changes run *Relay checks*, whose path filter `relay/test/paths.test.ts` keeps in step with what the relay imports):

| Job | What | Gates the deploy |
|---|---|---|
| `checks`, `unit` | `checks`: first the **gate's plan**, once for all its shards (the `gate-plan` artifact, ~20 s in): the selection (`scripts/e2e-impact.ts`), the auto-quarantine (`scripts/e2e-flakes.ts`), the shards (`scripts/e2e-shards.ts plan`, `e2e/timings.json`); then `npm run check`, `npm run knip`, the quarantine's owners (`scripts/e2e-quarantine.ts`) and `scripts/docs-check.ts`. `unit`: `npx vitest run` | yes |
| `e2e-gate` ×4 | **the gate's e2e** ("The gate" below) in Chromium (iPhone 13 profile), logic mode, `@render` and `@quarantine` left out, 3 workers each on a 4-core runner (4 made the short waits flaky), 2 on fewer (the private repo's 2-core runners: at 3 the gate timed out), on the build served as Pages serves it (`scripts/serve-build.ts`). Each shard builds (with its budgets: the kikimimi budget, the headers, the precache limit) and waits for the plan's artifact, not for `checks`; shard 1's `build-pages/` is the `site` artifact `deploy` ships | yes |
| `deploy` | `site` to Cloudflare Pages (`wrangler pages deploy`, project `island-fund`). It starts at once (ききみみ's `stt/` from an Actions cache keyed on `src/lib/mic/models.ts`, filled by `scripts/stt-models.ts`; wrangler), takes `site` once shard 1 uploads it, then waits on the gate (`scripts/deploy-gate.ts`: every job in its `GATE` list once and `success`, else red). After the upload, https://island-fund.pages.dev must answer this build (`_app/version.json`, 6 min at most) with its CSP header and the `stt/` manifest. Not by then, but the deployment's own URL serves it: a **Pages alias lag** warning (Cloudflare's, it catches up) and the checks on that URL, green; neither serves it: **Deploy not served**, red. No Cloudflare secret: a warning, nothing deployed | — |

After a deploy, never holding one back:

| Workflow · job | What |
|---|---|
| *e2e logic full* (`e2e-logic-full.yml`) · `e2e-logic` ×6 | **the full logic tier**: every test the gate's way, the auto-quarantined too, on the deployed commit, after each green *Deploy UI* run (and on demand). A failure is an `::error` on its spec, a list in the summary, and the workflow red: the next push's to fix first |
| · `e2e-render` | **the drawn smoke**: `@render` and `@smoke` with real (software) GL, one runner; advisory (SwiftShader isn't the phones' Metal) |
| · `coverage` | the unit tests' line coverage per file (`npm run coverage`): every file under `contract/` and `sync/`, and `store/actions.ts`, at 85 % or its own ratchet floor (`scripts/coverage-floors.ts`); red under it |
| · `timings` | the tier's test times folded into `e2e/timings.json` (the `e2e-timings` artifact; when the shards' spread drifts, `npm run e2e:timings` and commit it), and **what the gate missed** (`scripts/e2e-missed.ts`): each failing spec the deployed commit's gate didn't run, with the `e2e/impact.json` rule to add |
| *e2e full tier* (`e2e-full.yml`) ×10 | **everything drawn**, on demand only (nightly it was red every night on SwiftShader's timings, not the phones'): the whole suite with real GL, one browser a runner, `E2E_SLOW=1` (a test 90 s, an expect 20 s) |

- **Red main never deploys, never older over newer, and the newest green does.** Pushes' runs overlap, never
  cancelled: a push's gate starts at once. Only `deploy` is one at a time (`cloudflare-deploy`; a newer one waiting
  replaces an older one waiting), and its order guard (`scripts/deploy-order.ts`) deploys nothing when the live commit
  is the same or newer, and is red when not sure. A pull request's runs go one at a time on its branch; the full logic
  tier runs one at a time to the end.
- **The gate** (`scripts/e2e-impact.ts`; `npm run e2e:impact` shows what it would run here): (1) the **gate set**,
  `e2e/gate.json`, ~18 fast, stable spec files over the core flows (~450 s of tests); (2) the specs the push
  **changed**, each test 3× and never retried (the `chromium-x3` projects, `E2E_X3`): one failure in three is a flake
  the push brought, red; (3) the specs its files **reach**: a changed e2e helper's importers (not island.ts or hud.ts:
  nearly every spec's), a src or content file's by `e2e/impact.json` (path globs to spec names; else the file's own
  name). A file nothing maps adds nothing. The changes count from the commit live on the site, not the push before
  (runs get superseded); a base force-pushed away, from where it and HEAD meet; no base, a base meeting HEAD only at
  the first commit or over 500 files away (a rewritten history): the gate set and more specs up to the budget, with a
  warning. Over the budget (~1300 s of tests, ~110 s a shard) the reached specs drop out first, then the changed run
  once each; a sweep (over 8 changed) runs them once, cheapest first, up to the budget, the rest left to the full tier.
  Every directory under `src/` and `content/` maps to a spec or is in `impact.json`'s `unmapped` with why, and every
  spec that opens the phone editor (`/editor/?view=phone`) is in the editor/ and layoutEdit/ rules
  (src/lib/e2e-impact.test.ts). The full tier's "what the gate missed" prints the rule to add.
- **Flakes: one retry, and a ledger.** On CI `retries: 1`: failing twice is red; failing, then passing on the retry,
  is **flaky**: e2e/reporters/flaky.ts names it in the summary and on its spec, and uploads it (`flaky-<shard>`), the
  **flaky ledger** (`npm run e2e:flakes`: the last 48 h, the same answer in CI and locally). **Auto-quarantine:** a
  test flaky in runs of 2 commits or more in 48 h (only this repo's own runs on main) is left out of the gate, named in
  its summary with its owner, still run by the full logic tier; a flake counts only on a commit that has its spec's
  last change, so a fix lifts it at once (one after it is *flaky after its fix*). At most 5, the worst; the rest a
  warning each, still gating. Never a gate set test (a warning: fix it now). A shard that mostly broke is the runner's,
  left out of the tally. Best effort: the API down, nothing is left out. The mechanics: scripts/e2e-flakes.ts's
  header. A broken test goes to the **quarantine** (below) with an owner. Locally (`npm run e2e:ci-like`) there's no
  retry: a flake is red.
- **Tags** (`test('…', { tag: '@render' }, …)`): `@render` needs real drawing (draw calls, pixels): the drawn smoke
  only. `@smoke` is a whole 3D flow worth drawing too: both tiers. `@quarantine` is broken: out of the gate and the
  full logic tier, run in the drawn full tier until fixed, with its owner and why (`annotation: { type: 'quarantine',
  description: 'owner: …' }`). `@logic` is the logic tiers' only, never drawn: a timing a software-GL frame of 0.5–1 s
  can't meet, with why in `annotation: { type: 'logic', description: 'drawn: …' }`. List them: `npx playwright test
  --list --grep @quarantine` (or `@logic`).
- **Logic mode** (`E2E_RENDER=none`; src/lib/ui-state/testMode.ts): the 3D engines run every frame (the scene, the
  cameras, gestures, the World's step, poses, the tap areas) but never draw: a frame costs ~1 ms.
  `__world3d.stats().drawn` is false. A map is its stub there; `e2e.render` `map` (e2e/trips.ts `mapsDrawn`) makes the
  maps while the island still doesn't draw.
- **WebKit, the users' browser** (Playwright's WebKit as an iPhone 15), runs in **the flake hunt**
  (`.github/workflows/e2e-flake-hunt.yml`) on macOS runners (Linux's WebKit draws the island at ~1 fps): weekly
  (Monday 03:30 Tokyo) and on demand, the logic tier each test 3×, retries off, 2 workers a runner, 60 s a test. Red
  when anything failed once; it gates nothing. WebKit itself crashing under Playwright is named, not red
  (`scripts/e2e-report.ts` `VERDICT`). Once green across the board it replaces Chromium as the gate. A test WebKit
  can't run is `@chromium` with why.
- **The base path.** The site is at the root; the specs follow `BASE_PATH` (`e2e/island.ts` `BASE`, `islandURL`), so
  a build under one (`BASE_PATH=/x npm run build`, then `BASE_PATH=/x npm run e2e`) is tested the same.
- **The headers.** `npm run build` writes `build-pages/_headers` (`scripts/headers.ts`: its header lists them) and
  `serve-build.ts` serves them as Pages does (all but the cache). `csp.spec.ts` walks the island, its sheets, the
  music, the shop, the museum, the tent, the editor and the trip map and fails on any CSP violation.
- **The trip map.** In the logic tier no map is made: `TripMap` is a stub with its pins as buttons
  (`travel-map.spec.ts`, `window.__travelMap`). Every map tile host is answered on every context (`e2e/mapTiles.ts`,
  the fixtures' refresh recipe in `e2e/trips.ts`), so a drawn map never reaches the network.
- Playwright's browsers are cached by its version; bumping `@playwright/test` downloads them once.

## CI cost
The repo is private (since 11-10): GitHub Free includes 2,000 Actions minutes a month. Measured 11-09/11-10, while
public: ~70 billed min a push (Deploy UI ~20, the full logic tier ~50; each job rounds up to whole minutes), ~5,200 a
day with the weekly hunt's macOS runs (×10 billing): the allowance lasts under a day at that rate, ~$550–800 a month
over it. So: batch pushes (one per finished, verified group of fixes), measure locally (`npm run e2e:ci-like`, the
hunt on the Mac) rather than dispatching CI, and set an Actions spending limit. The cuts available: the full logic tier
on a schedule (in `e2e-logic-full.yml` swap `workflow_run` for the commented `schedule`, whose `throttle` job runs
only when a deploy landed since) and a self-hosted runner for the e2e jobs (the user's call).

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
One-off measuring probes, done and deleted, are at the `probes` git tag (`git show probes:app/scripts/<name>.ts`):
`sw-measure.ts` (a service worker install A/B), `perf-sheets.ts` (sheet open A/B), `offline-measure.ts` (map tiles'
bytes), relay's `wedding-cats.ts` (the categories' one rename).

Local-only WebKit reds on a Mac (CI's macOS runners pass): `csp.spec.ts` at `--workers=1`, every second test (after a
test with the sound on, the next page's WebGL context is lost as it's made: `getShaderPrecisionFormat` null, the island
shows `[data-no3d]`), so give each test its own worker; `kk-sync.spec.ts`, two (WebKit's audio clock stands still here,
`currentTime` 0 after 1.5 s, so the K.K. test's positions never move; the tent test's third page loses its WebGL context
as above, `tent.failed`): check them on the flake hunt.

## Before you push (a new or changed spec, or a change to the 3D engines, the tent or sync)
1. `npm run verify` (~20 s; ~25 s with `-- --build`): `checks` as CI runs it, all at once, the first red printed and the rest stopped: the
   lockfile (`npm ci --dry-run`: an ERESOLVE peer conflict), `check`, `knip` (and relay/'s, once `npm ci` ran there),
   `vitest run`, the quarantine's owners, the docs' pointers (`scripts/docs-check.ts`: every relative link and anchor
   in the docs resolves, every backticked repo path exists, every `docs/….md` "Heading" or §Section a comment cites is
   there; rename a heading and repoint its citations in the same push). `-- --quick`: vitest on the changes since
   origin/main only; `-- --build`: the build and its budgets too, beside svelte-check. No e2e.
   **The pre-push hook runs it for you** (`.githooks/pre-push`, set for every worktree by app's `npm ci`): a push that
   changes `app/` runs `npm run verify -- --build` on the working tree (uncommitted files under `app/` are named in a
   warning: they're checked, not pushed), one that changes only `docs/` or README.md the docs check; red is refused.
   It also sums the files new to the remote: over 10 MB a warning, over 50 MB refused unless `BIG_PUSH=1` (iterate
   generated assets in `app/.cache`, commit the accepted set once). Bypass: `git push --no-verify`, then fix forward.
2. `npm run e2e:ci-like -- --changed` (or `-- e2e/the.spec.ts --repeat 5`): the logic tier as CI runs it (a fresh build if `src/` is newer,
   software GL, CI's workers, `CI=1`, a free port), each test 5×. For a drawn (`@render`/`@smoke`) test add
   `--tier render`; `--tier full` draws everything; `--workers 6` loads the machine as a busy runner is.
3. All green, every time: push (`git pull --rebase origin main && git push origin HEAD:main`). One failure in 5 is a
   flake: fix it now, or quarantine it in the same push with its owner.
4. After the push, watch the run (`gh run watch`), then the full logic tier after its deploy (*e2e logic full*). A red
   gate, or a red full logic tier, is yours to fix first, before anything else.

## Hermetic
Every e2e runs in a sealed world (e2e/fixtures.ts; its header has the mechanics), so a run today and a run in a month
see the same island.

- **Import Playwright from `./fixtures.ts`**, never `'@playwright/test'` (the lint: `src/lib/e2e-hermetic.test.ts`).
- **The clock is pinned** at `PINNED_DATE` (2026-11-04 12:00 Tokyo: a Wednesday, clear all day, no event), every
  context's. A `?date=` in the URL still wins: say the day and hour when the test is about them. A page that sets its
  device clock (`page.clock.install({ time })` before it opens) owns it; `test.use({ ownClock: true })` lifts the pin
  for a file.
- **The weather is pinned**: the pinned day's seeded sky, or a fixture (`?wx=…`, `?weather=`: "URL params"); never
  assert on whatever sky the day has.
- **Ambient life is off**: nothing spawns or wanders on its own (critters, a day's visitor, the balloon, idle beats,
  an ordinary night's shooting stars); an event's host still comes. The villagers are there, asleep while their phone
  isn't open (`?awake`, `?grace=`, `?wake=`: design.md "Sleep"); the opening beats, the events and what a tap starts
  are as ever. A URL's own param wins (`?critter=fish`, `?visitor=jack`): say what the test is about. A test of the
  ambient life itself opts back in: `test.use({ ambient: 'on' })`.
- **The tests' own relay agrees with its phones**: liveRoom.ts and record.ts run on the pinned time; read it as they
  do, `island.now()`, `rec.now()`, never `Date.now()`.
- **No network**: a request off the local preview fails the test at its end, naming it. Mock a relay with
  `page.route` / `context.route` (board.spec, record.ts, liveRoom.ts); the map tiles are answered already; the real
  relay's harness (`RELAY_E2E=1`, sync-harness.spec) is the one opt-out (`test.use({ network: 'any' })`).
- **No randomness**: no `Math.random` in a spec; pin the island's with `?seed=`, `&rock=`, `&shake=`, `?critter=`,
  `?visitor=` ("URL params").
- **Storage**: each test its own context, service workers blocked; two phones in one context share `localStorage` and
  a BroadcastChannel (the demo's relay). Chromium's tabs are all visible and focused; still `bringToFront()` the tab
  that acts, and wait for a second tab's island (`is3d`, `quiet`) before timing across the two.
- **Taps on the 3D island are frame-locked** (e2e/island.ts `tapAt` and what's built on it: `tapWorld`, `tapThing`,
  `tapWater`, `tapBox`, `tapFigure`, `tapOn`): the point read in a held frame and tapped before the next, polled while
  there's none or a tap area lies over it (a point read, then tapped a round trip later, was most of the tap specs'
  flakes). `castIn` sends its tap from the page in the same task; `reelOnBite` taps at the bite, off any tap area. A
  point tapped as read only where nothing moves.
- **Read the hooks once they're there**: `__world` comes before `__world3d` (`camTo` and `settled` wait for both); after
  a `goto` or `reload` wait with `islandUp`, not the HUD alone: the 3D island mounts once the ground's fields are in
  (layout/fieldsPrime.ts), and until then every island target sits hidden at the scene's corner.
- **Silent**: Chromium muted on a fake audio output (playwright.config.ts: a Mac's own device stalled the page's audio
  clock, kk-sync red locally); WebKit headless makes no sound.
- **No new fixed wait**, wall-clock sampling or long test: ratcheted ("Guardrails" below).
- **Wait for what an action loads.** A tap that deals a deck, opens a sheet or enters a room may load a chunk first:
  wait for the state it ends in before reading what it made.
- **Vitest's module cache** never keeps a module with an `import.meta.glob` (vite.config.ts `globsUncached`); anything
  odd after a big rebase: `npx vitest run --clearCache`.

## URL params
Read on each call by `island/devHooks.ts` (the seasonal ones by `ui-state/preview.ts`). The island's hooks work in dev
builds or with `?demo`; `?date`, `?theme` and `?season` work everywhere:

| Param | Effect |
|---|---|
| `?demo` (`=harvest`, `&as=B\|G`, `&weeks=60`, `&health=none\|zero`) | Made-up data, no backend; the harvest recap; play as B or the guest; a longer history; no Health rows / no-watch days |
| `?date=YYYY-MM-DDTHH:mm` | The scene clock (Tokyo), this page load only (it moves the shared day too) |
| `?theme=dawn\|day\|dusk\|night`, `?season=` | Preview a time of day or a season |
| `?seed=` | The island's seed (finds, weather, visitors) |
| `?weather=clear\|cloudy\|rain\|heavy\|snow\|fog\|aurora\|rainbow` | Force the weather (the critters' too) |
| `?wx=real\|game` | The island's weather mode for this load |
| `?wx=rain-pm\|clears\|typhoon\|snow\|fog\|cloudy\|stale` | A canned real-weather timeline (`island/wxFixtures.ts`) |
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
| `localStorage['e2e.ambient'] = 'off'` | The e2e's ambient life off (e2e/fixtures.ts): `critter=none`, `visitor=events`, `balloon=none`, `idle=none`, `stars=none` unless the URL sets them |
| `?relay=<wss url>&key=<key>` | The demo over a real relay (`e2e/sync-harness.spec.ts`) |
| `?quietafter=<ms>` | How long a phone gone quiet inside a room stays shown there |
| `?render=none` | The 3D engines run but draw nothing (the e2e's logic mode: `ui-state/testMode.ts`) |

Anywhere: `?panel=rewards` opens ごほうび at once; the 3D island's renderer takes `?dpr=<ratio>`, `?aa=0|1`,
`?shadows=0|1`, `?ambient=<fps>`, and for the phones' A/B (perf.drag, perf.rest) `?dprmove=<ratio>` (while the camera
moves: 1.5; at `dpr` or above no swap) and `?shadow=<px>` (the shadow map's size: 2048). The editor's params: [island-layout.md](../island-layout.md). The live island
sets `window.__world` (`cam()`, `go(z)`, `at(x, z)`, `put(x, z)`, `idle()`, `quiet()`, `perf`, `stops()`, `mine()`,
`partner()`, `geo()`, `site()`, …) for the e2e and the console (e2e/island.ts wraps them).

## Guardrails
`src/lib/e2e-budgets.test.ts` (vitest, so the `unit` job) counts the flaky patterns per file in `e2e/*.ts`; today's
counts are the ceilings in `e2e/budgets.json`. A file over its ceiling, or a new file with any, fails, saying what to do
instead:

| Rule | Counts | Instead |
|---|---|---|
| `waits` | `waitForTimeout(`, a `setTimeout` promise (a `// hold:` too) | wait on state; prove "nothing happens" with `page.clock.runFor` |
| `wallClock` | `performance.now(`, `requestAnimationFrame(` in a spec | the speed/step rule in vitest with an explicit dt; step `page.clock` |
| `longTests` | `test.setTimeout(` over 30 s, `test.slow(` | split the test; its rule parts into vitest |
| `textSelectors` | `getByText(`, `hasText:` in a spec | `getByRole` or a `data-*` hook (text is copy) |

Fixed one? `UPDATE_BUDGETS=1 npx vitest run src/lib/e2e-budgets` writes the ceilings down to the counts (it never
raises one: that's a hand edit to explain in the commit).

## A changed spec, three times
The gate runs the specs a push adds or edits each test 3× over, never retried (the `chromium-x3` projects:
`E2E_X3`, scripts/e2e-impact.ts; more than 8 changed is a sweep: once each, cheapest first, up to the budget). A flake fails the push that brings
it, not the next ten runs. Before pushing: `npm run e2e:ci-like -- --changed` ("Before you push").

## Writing a stable spec
Most red runs are the spec, not the app. Before pushing a new or changed spec, run it with
`--repeat-each=10` (and the whole file with `--workers=8`: a loaded machine is what CI is).

1. **Never tap where something can wander.** The villagers walk about, critters come and go (a flea off a villager,
   a bug from under the rock), visitors stroll, balloons drift. Tap a point only once it is *that* thing's, read and
   tapped in one held frame (`tapAt` and its `clear`, above), or pin the scene: ambient life is off already
   ("Hermetic"), then `&rock=clonk`, `&shake=…`, `?weather=…`, `?seed=` ("URL params"). Prefer a locator's own click
   (Playwright checks what receives it) to `page.mouse.click(x, y)` when the island isn't the target.
2. **Wait on the app's state, not on time.** `expect(…).toBeVisible()`, `expect.poll(() => window.__world.cam())`,
   `__world.idle()`, `__tent.stats().frames`, `data-*` attributes (`__world3d.camStill()` once the camera's last move is
   framed: the DOM's tap areas placed for it, not where the previous camera had them); never `waitForTimeout` to "let it settle". (The app's hooks are declared on `Window` in `src/app.d.ts`, as `unknown`: a spec types what it reads.) A fixed
   wait is only for proving that nothing happens for a while (a toast that must stay 3 s), and then say so.
3. **Fix the clock.** It's pinned already (above, "Hermetic"); `?date=2026-11-04T12:00` when the day and hour matter; `page.clock.install({ time })` when the app's
   timers matter, `page.clock.runFor(ms)` to skip an animation's wait instead of sleeping through it. The clock fakes
   `requestAnimationFrame` too, so `runFor` steps the 3D engines frame by frame: in logic mode that's quick (drawn under
   software GL it took minutes, hence `fastForward` there). ききみみ's schedule (a clip's window is its clips.json
   length, a timer, never the audio's) runs on it: install the clock before the goto and step to the state
   (e2e/kikimimi-nav.ts `runToQuestion`, `runToPhase`, `runToSee`) instead of waiting out a play; never step while a
   mic take listens (its stand-in audio is real time).
4. **Find things by role or test id**, not by position or `nth()`: `getByRole('button', { name })`, `[data-tab=…]`,
   `[data-critter]`. Add a `data-*` hook to the component when there is none.
5. **WebKit is the browser.** It scrolls by whole px (a camera z is within a px of what `go(z)` asked: compare with a
   tolerance, `toBeLessThan(1.5)`), has no mouse wheel on a phone (scroll the scroller: `scrollBy`), moves focus
   onto buttons with ⌥Tab (`Alt+Tab`), and has no CDP (slow animations down with `document.getAnimations()`'
   `playbackRate`). A spec that truly needs Chromium is tagged `{ tag: '@chromium' }`, with why in
   `playwright.config.ts`. Linux's WebKit is not Safari: it renders the island in software at ~1 fps; reproduce CI's
   WebKit on a Mac, not in Docker.
6. **Two phones in one context share storage.** The sync specs' tabs share `localStorage`; a hidden tab's timers are
   throttled. Bring the acting tab to the front, and poll the other for the result.
7. **Banners and sheets cover things.** A toast drops over the panel's tabs for a few seconds (and a pointer resting
   on it holds it there): tap it away, or wait for it to go, before tapping under it.
8. **Each test starts clean**: a fresh context, service workers blocked. Don't lean on another test's leftovers, and
   don't make one test do the work of three: a short test fails clearly and shards evenly.
9. **Don't loosen an assertion to make it pass.** If the app is wrong, it's a bug: fix it or say so in the commit.
10. **Fishing**: any water casts, however far from my villager; e2e/island.ts `toTheWater`, `tapWater`, `castIn` and
    `reelOnBite` (their headers: a bank by the shadow, a frame-locked cast, the reel at the bite) rather than fixed
    points (a fixed reel point can be a door, and with the line out a door goes in). `__fish.why()` names what the last
    tap on water did, `__fish.line()` its phase; hold a 「！」 up with `__world3d.pinBite('mine')` (bite-mark.spec). The
    sea off the back beach lies by the doors and the beach's finds: a real touch there casts (ui-state/exactTaps.ts;
    exact-taps.spec).
11. **Tap a pill only once it's at rest.** Playwright calls a moving thing "stable" while a staggered transition is in
    its delay, then the tap lands where it has moved off to (the menu's せってい sits over the ベル row 110 ms first):
    `e2e/hud.ts` `unfoldMenu` / `fromMenu` wait for the pills' spring. A route that fails chunks fails every lazy load
    under it (a critter's, a visitor's): pin the scene and route just before the one tap it's for (`e2e/stale.spec.ts`).
12. **One width, the phones'.** The users' phones are an iPhone 15 and an iPhone 16 (393 px wide): a flow runs at one
    width (390 or 393), not again at 320 or 375; a narrow width only where the layout itself is the test (the HUD's
    row, a sheet's fit). **Debug pictures** (`page.screenshot` that asserts nothing) only under `SHOTS=<dir>`:
    ``if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/name.png` })``, and a wait that is only
    for the picture inside the same `if`.

## Memory
The PWA stays open for days, so a scene's round trip must leave nothing behind: `e2e/leaks.spec.ts` (`@chromium`)
goes in and out of the rooms and the info sheets and checks, after a forced GC, that no WebGL context or
window/document listener is left over, and that the editor's strokes and the home picker's swatches leave no
ArrayBuffers behind (`Runtime.getHeapUsage` `backingStorageSize`: typed arrays and decoded models, most of the page's
memory and outside the JS heap; leak-probe prints it as `abMB`). To hunt one: `npm run leak -- <flow> [cycles] --snap` (scripts/leak-probe.ts:
its header lists the flows, the flags and what each cycle prints) against a served build (`E2E_PORT`). What the leaks
so far taught:
- **A page-wide hold keeps its component**: a `window.__*` hook, a module's callback or a `<link>`'s listener holding a
  closure made in a component holds its DOM and its renderer. A hook goes in the scene's cleanup (only if it's still
  its own); a module's callback, and a let-go value written inside a cleanup, is made at module level. Vite's preload
  listeners: vite.config.ts `preloadListenersOff`.
- **three.js**: a renderer stays alive while anything it drew is undisposed; every surface ends its renderer with
  world3d/stage.ts `endRenderer` (its header: why WHITE too). Models kept page-wide are lean (release.ts `lean`).
- **A cache keyed by a value lives as long as it does**: a layout kept (the editor's undo) kept its WeakMap'd fields
  (~9 MB a layout). Keep history as plain data; bound a page-wide cache by its users (world3d/keepUsed.ts).
- **MapLibre**: a map goes by travel/map/glmap.ts `removeMap`, not `map.remove()` alone.
- **The probe's own handles** keep what they point at: wait on booleans. A steady +0.3 MB a trip that's all `[code]` is
  V8 compiling; `blink::NetworkResourcesData` is DevTools'.

## Load budget
`npm run build` ends with `scripts/load-budget.ts`: the first load (what `index.html` loads, transitively) ≤ 400 KB of
JS and 70 KB of CSS gzipped, none of it three.js, MapLibre or a feature's sheet, and the service worker's precache
≤ 3 MB on the wire. Bytes only (never timing): over one, the build fails. Timing is an A/B on the desktop and the iOS
Simulator, never CI: [perf.md](perf.md#measuring).

## Unused assets
`npm run unused` (`scripts/unused-assets.ts`, read-only; its header: the kinds and the flags) sorts every file under
`static/` and every module under `src/` into safe to delete, used and unsure. Check a deletion against what the built
island draws: serve a build (`node scripts/serve-build.ts <port>`), `node scripts/unused-probe.ts <port> /tmp/seen.txt`
(17 scenes; red on a 404 under art/, room/, terrain/), then `npm run unused -- --seen=/tmp/seen.txt`.

## The iOS Simulator check (the real target, on the Mac)

CI's software GL is no judge of the phones' rendering, so it's checked on the iOS Simulator, on this Mac: `npm run
ios:check` (scripts/ios-sim-check.ts: the island's load, idle and scrolling frames, けんこう and ごはん over it, the
page's errors and screenshots into `test-results/ios-sim/<time>/`; `--url`, `--seed`, `--then`, `--boots`: its
header) and `npm run ios:indoor` (scripts/ios-sim-indoor.ts: the tent, うめ's house, the museum and the shop, cold
then warm, and what still runs after each: a leak). Exit 1 when the island didn't come up.

Run on demand (the Mac sleeps). Nightly instead, a launchd agent
(`~/Library/LaunchAgents/fund.island.ios-check.plist`, then `launchctl load` it):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>fund.island.ios-check</string>
  <key>ProgramArguments</key><array><string>/bin/zsh</string><string>-lc</string>
    <string>cd ~/Documents/other/fitness/app &amp;&amp; npm run ios:check</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>30</integer></dict>
  <key>StandardOutPath</key><string>/tmp/island-ios-check.log</string>
  <key>StandardErrorPath</key><string>/tmp/island-ios-check.log</string>
</dict></plist>
```
