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
| `build` | `npm run build` once (its budgets: the kikimimi budget, the headers, the precache limit); its `build-pages/` is the `site` artifact `deploy` ships | yes |
| `checks`, `unit` | `checks`: first the **gate's plan**, once for all its shards (each choosing its own could disagree: a test in no shard; the `gate-plan` artifact, ~20 s in): the selection (`scripts/e2e-impact.ts`), the auto-quarantine (`scripts/e2e-flakes.ts`) and the shards' plan (`scripts/e2e-shards.ts plan`, the committed `e2e/timings.json`); then `npm run check`, `npm run knip`, the quarantine listed in the summary (`scripts/e2e-quarantine.ts`: red when a quarantined test has no owner) and `scripts/docs-check.ts` (the docs' pointers). `unit`: `npx vitest run`. Both beside the build | yes |
| `e2e-gate` ×4 | **the gate's e2e** ("The gate" below): Playwright in Chromium (iPhone 13 profile) in logic mode (`E2E_RENDER=none`), `@render` and `@quarantine` left out, on `site` served as Pages serves it (`scripts/serve-build.ts`): the plan (the gate set, the changed specs ×3 and the specs the push reaches; the shards wait for its artifact, not for `checks`: `needs: checks` cost ~35 s); 3 workers each (4 made the short waits flaky on the 4-core runners); each shard builds the commit itself (no waiting for `build`) | yes |
| `deploy` | `site` to Cloudflare Pages (`wrangler pages deploy`, project `island-fund`), a direct upload, once all of the above are green (it starts after `build` and gets the artifact, ききみみ's recogniser for `stt/` (an Actions cache keyed on `src/lib/mic/models.ts`, filled on a miss by `scripts/stt-models.ts`) and wrangler ready meanwhile, ~30 s off push→live, then waits on the gate: `scripts/deploy-gate.ts`, every job in its `GATE` list once and `success`, else red); then checks https://island-fund.pages.dev answers this build (`_app/version.json`), with its CSP header and the `stt/` manifest. No `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secret: a warning, nothing deployed | — |

After a deploy, never holding one back:

| Workflow · job | What |
|---|---|
| *e2e logic full* (`e2e-logic-full.yml`) · `e2e-logic` ×6 | **the full logic tier**: every test the gate's way, the auto-quarantined too, on the deployed commit, after each green *Deploy UI* run (and on demand). Loud: a failure is an `::error` on its spec, a list in the summary, and the workflow red: the next push's to fix first |
| · `e2e-render` | **the drawn smoke**: the `@render` and `@smoke` tests with real (software) GL, one runner; advisory (CI's SwiftShader isn't the phones' Metal: rendering is judged on the iOS Simulator and the phones) |
| · `timings` | the tier's test times folded into `e2e/timings.json` (the `e2e-timings` artifact) and the shards' spread in the summary: when they drift apart, `npm run e2e:timings` and commit it. And **what the gate missed** (`scripts/e2e-missed.ts`): each failing spec the deployed commit's gate didn't run, with that commit's changed files: the next `e2e/impact.json` rule |
| *e2e full tier* (`e2e-full.yml`) ×10 | **everything drawn**, on demand (no schedule: nightly it was red every night on drawn-only timings, SwiftShader's, not the phones'): the whole suite with real GL (the quarantine too), one browser a runner, `E2E_SLOW=1` (a test 90 s, an expect 20 s: drawn under software GL the game itself runs slower); its failures in its summary and on their specs |

- **Red main never deploys, never older over newer, and the newest green does.** Pushes' runs overlap, never
  cancelled (cancelling older runs, nothing finished in a burst): a push's gate starts at once. Only `deploy` is one at
  a time (`cloudflare-deploy`; a newer one waiting replaces an older one waiting), and its order guard
  (`scripts/deploy-order.ts`) checks the live commit just before wrangler: older or the same, it deploys nothing
  (green, a notice); not sure, red. A pull request's runs go one at a time on its branch. The full logic tier, too,
  runs one at a time to the end (a newer one waits; one waiting is replaced by the newest).
- **The gate** (`scripts/e2e-impact.ts`, `npm run e2e:impact` shows what it would run here): not every test, to keep
  the push to live short. It runs (1) the **gate set**, `e2e/gate.json`: ~18 fast, stable spec files over the core flows (boot,
  the HUD, the tent, fishing, 健康 · ごはん and a health goal, ききみみ, the shop, two phones, the record offline
  (sync-offline), the editor, りょこう, the service worker, the CSP), ~450 s of tests; (2) the specs the push **changed**, each test 3× and never retried (the `chromium-x3`
  projects, `E2E_X3`): one failure in three is a flake the push brought, red; (3) the specs its files **reach**: a
  changed e2e helper's importers (not island.ts or hud.ts: nearly every spec's), a src or content file's by
  `e2e/impact.json` (path globs to spec names; else the file's own name: `fishing3d.ts` → `fishing3d*.spec.ts`). A file
  nothing maps (a store, the config, a fixture, `package.json`) adds nothing. The changes are counted from the commit
  live on the site (the `cloudflare-pages` deployments; that API down, the last green *Deploy UI* run's), not the push
  before: runs get superseded; force-pushed away, from where it and HEAD meet; no base at all, the gate set and more
  specs up to the budget, with a warning. Over the budget (~1300 s of tests, ~110 s a shard) the reached specs drop
  out first, then the changed ones run once each: a changed spec always runs.
  Add a rule to `e2e/impact.json` when a src area's spec missed a break the full logic tier caught (its summary's
  "Failed here, not run by the gate" names the spec and the commit's files). Every directory under `src/` and
  `content/` maps to a spec, or is in `impact.json`'s `unmapped` with why (src/lib/e2e-impact.test.ts).
- **Flakes: one retry, and a ledger.** On CI `retries: 1`: a test that fails twice is red; one that fails, then passes
  on its retry, is green but **flaky**: e2e/reporters/flaky.ts names it in the job summary, puts a warning on its spec,
  and writes it to the run's `flaky.json`, uploaded as `flaky-<shard>`: the **flaky ledger** (`npm run e2e:flakes`
  prints the last 48 h). **Auto-quarantine:** a test flaky in runs of 2 commits or more in 48 h (the gate's shards and
  the full logic tier both count; only this repo's own runs on main, never a fork's pull request: the repo is public)
  is left out of the gate (`--test-list-invert`), listed in its summary as *auto-quarantined* with why, and still run
  by the full logic tier. A flake counts only on a commit that has its spec's last change, so a fix to the spec lifts
  it at once, and a flake after it is listed *flaky after its fix*; else it comes back after 48 h without one. At most 5, the worst (most commits, then
  runs, then the latest): the rest are a warning each, still gating. Each one quarantined is a warning on its spec
  naming its owner (the spec's last commit). Never a gate set test (a warning: fix it now). A shard where most tests
  failed or were flaky (or 10 flaky at once) is the runner, not the tests: left out of the tally, named in the
  summary (the ledger's entry has the shard's tests run and failed). No commit: the
  gate reads the ledger from the API each run (best effort: the API down, nothing is left out). Fix a flaky test at
  its cause; one that's broken goes to the **quarantine** (below) with an owner. Locally (`npm run e2e:ci-like`)
  there's no retry: a flake is red.
- **Tags** (`test('…', { tag: '@render' }, …)`): `@render` needs real drawing (draw calls, pixels, the canvas's alpha):
  the drawn smoke only, never the logic tier. `@smoke` is a whole 3D flow worth drawing too: both tiers. `@quarantine`
  is broken: out of the gate and the full logic tier, run in the drawn full tier until fixed, with its owner and why
  (`annotation: { type: 'quarantine', description: 'owner: …: the rod never comes out on CI (#run)' }`). `@logic` is
  the logic tiers' only, never drawn: a timing a software-GL frame of 0.5–1 s can't meet (three quick taps within
  1.2 s, a wait sized for the game at full speed), with why in `annotation: { type: 'logic', description: 'drawn: …' }`;
  it says nothing about the phones, whose frames are 16 ms. List them: `npx playwright test --list --grep @quarantine` (or `@logic`).
- **Logic mode** (`E2E_RENDER=none`; src/lib/ui-state/testMode.ts): the island's and the tent's 3D engines run every
  frame (the scene, cameras, gestures, the World's step, poses, effects, the tap areas) but never call `renderer.render`
  or the shadow map: a frame costs ~1 ms. Set by `localStorage['e2e.render'] = 'none'` (the config does it for
  `E2E_RENDER=none`) or `?render=none&demo`; `__world3d.stats().drawn` is false and `stats().calls` 0.
- **WebKit, the users' browser** (Playwright's WebKit as an iPhone 15: the same viewport as the users' iPhone 15 and
  16), runs in **the flake hunt** (`.github/workflows/e2e-flake-hunt.yml`) on **macOS** runners (Safari's own WebKit;
  Linux's draws the island at about one frame a second): weekly (Monday 03:30 Tokyo), and Actions → *e2e flake hunt*
  → Run workflow (with how many runs each; 1 for a plain WebKit check). The logic tier as the gate runs it: WebKit's
  signal is its DOM, events and JS, and the VM's software GL isn't the phones' Metal (drawn, the logic specs timed
  out). Each test 3× over, retries off, 2 workers a runner (a 3-core VM: at 3, tests ran 3-6× their local time), 60 s
  a test (`--timeout=60000`: the VM runs a test 2–3× its Linux time). Red when anything failed even once, its summary
  lists them worst first; it gates nothing. WebKit itself crashing under Playwright ("Cannot find parent object
  browser@…") is named but not red (`scripts/e2e-report.ts` `VERDICT`). Too slow to gate each push (5 macOS runners,
  ~10–15 min each); once green across the board it replaces Chromium as the gate. A test WebKit can't run is
  `@chromium` with why (`@logic`: "Tags"): tagged out, never a job left red.
- **The base path.** The site is at the root (`BASE_PATH` unset or `''`); the specs follow `BASE_PATH` (`e2e/island.ts`
  `BASE`, `islandURL`), so a build under one (`BASE_PATH=/x npm run build`, then `BASE_PATH=/x npm run e2e`) is tested the same.
- **The headers.** `npm run build` writes `build-pages/_headers` (`scripts/headers.ts`: the CSP SvelteKit put in the
  page's `<meta>`, with `frame-ancestors 'none'`, and nosniff, no-referrer, Permissions-Policy (everything off but
  `geolocation=(self)`, the trip map's locate button), HSTS; a year's cache for
  `_app/immutable/`; and the island page's chunks as modulepreload links in `index.html`), and `serve-build.ts` serves them as Cloudflare Pages does (all but the cache). `csp.spec.ts` walks
  the island, its sheets, the music, the shop, the museum, the tent, the editor and the trip map (drawn on fixture
  tiles: its worker, fonts and OpenFreeMap's origin) and fails on any CSP violation.
- **The trip map.** In the logic tier no map is made: `TripMap` is a stub with its pins as buttons
  (`travel-map.spec.ts`, `window.__travelMap`; its stub tests set logic mode themselves, so they read the stub in any
  tier). Every map tile host is answered on every context (`e2e/mapTiles.ts`, from e2e/fixtures.ts): OpenFreeMap from
  `e2e/fixtures/travel/` (the refresh recipe in `e2e/trips.ts`), USGS and GSI a 1 px PNG, so a drawn map (a trip's
  地図, a hike's trail, `csp.spec`, `leaks.spec`) never reaches the network, whichever spec makes it.
- Playwright's browsers are cached by its version; bumping `@playwright/test` downloads them once.

## CI cost
The repo is public, so Actions minutes are free. Once it goes private (GitHub Free: 2,000 min a month), the full
logic tier (~47 billed min a run, ~60 % of all CI) should run at most every 30 min: in `e2e-logic-full.yml`, comment
out `workflow_run` and uncomment `schedule` (both are there). Scheduled, its `throttle` job picks the newest green
deploy and runs only when one landed since its previous scheduled run; a red then spans a wider range of commits.

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
Local-only WebKit reds on a Mac (CI's macOS runners pass): `csp.spec.ts` at `--workers=1`, every second test (after a
test with the sound on, the next page's WebGL context is lost as it's made: `getShaderPrecisionFormat` null, the island
shows `[data-no3d]`), so give each test its own worker; `kk-sync.spec.ts`, two (WebKit's audio clock stands still here,
`currentTime` 0 after 1.5 s, so the K.K. test's positions never move; the tent test's third page loses its WebGL context
as above, `tent.failed`): check them on the flake hunt.

## Before you push (a new or changed spec, or a change to the 3D engines, the tent or sync)
1. `npm run verify` (~20 s): `checks` as CI runs it, all at once, the first red printed and the rest stopped: the
   lockfile (`npm ci --dry-run`: an ERESOLVE peer conflict), `check`, `knip` (and relay/'s, once `npm ci` ran there),
   `vitest run`, the quarantine's owners, the docs' pointers (`scripts/docs-check.ts`: every relative link and anchor
   in the docs resolves, every backticked repo path exists, every `docs/….md` "Heading" or §Section a comment cites is
   there; rename a heading and repoint its citations in the same push). `-- --quick`: vitest on the changes since
   origin/main only; `-- --build`: the build and its budgets too, beside svelte-check. No e2e.
   **The pre-push hook runs it for you** (`.githooks/pre-push`; app's `npm ci` / `npm install` sets `core.hooksPath
   .githooks` for every worktree): a push that changes `app/` runs `npm run verify -- --build` on the working tree, one
   that changes only `docs/` or README.md the docs check, and is refused when red. Emergency bypass: `git push
   --no-verify` (or `SKIP_VERIFY=1 git push`), then fix forward.
2. `npm run e2e:ci-like -- --changed` (or `-- e2e/the.spec.ts --repeat 5`): the logic tier as CI runs it (a fresh build if `src/` is newer,
   software GL, CI's workers, `CI=1`, a free port), each test 5×. For a drawn (`@render`/`@smoke`) test add
   `--tier render`; `--tier full` draws everything; `--workers 6` loads the machine as a busy runner is.
3. All green, every time: push (`git pull --rebase origin main && git push origin HEAD:main`). One failure in 5 is a
   flake: fix it now, or quarantine it in the same push with its owner.
4. After the push, watch the run (`gh run watch`), then the full logic tier after its deploy (*e2e logic full*). A red
   gate, or a red full logic tier, is yours to fix first, before anything else.

## Hermetic
Every e2e runs in a sealed world (e2e/fixtures.ts), so a run today and a run in a month see the same island.

- **Import Playwright from `./fixtures.ts`**, never `'@playwright/test'` (`import { expect, test, type Page } from
  './fixtures.ts'`): that's what brings the rest. The lint (`src/lib/e2e-hermetic.test.ts`, in vitest) checks.
- **The clock is pinned.** Every test's scene clock starts at `PINNED_DATE` (2026-11-04 12:00 Tokyo: a Wednesday, clear
  all day, no event), on every context, a second phone's too (`localStorage['e2e.date']`, read by
  src/lib/time/clock.ts as a `?date=` for a load without one; a live phone never sets it). A `?date=` in the URL still
  wins: say the day and hour when the test is about them. A page that sets its device clock to a time
  (`page.clock.install({ time })`, `setFixedTime`, `setSystemTime`, before it opens) owns it: the pin is lifted for
  that page. `test.use({ ownClock: true })` lifts it for a file.
- **The weather is pinned.** With the clock pinned the island never takes a relay's or a cached timeline: its sky is
  the pinned day's seeded one, or a fixture: `?wx=rain-pm|typhoon|snow|cloudy|clears` (a timeline on the scene clock),
  `?weather=` (forced). The demo has no relay timeline at all; never assert on whatever sky the day happens to have.
- **Ambient life is off.** Nothing spawns or wanders on its own: no critter visits (fish, bubbles, fresh-water
  shadows, bugs), no day's visitor (an event's host still comes: Jack, Franklin, Reese, Celeste), no balloon, no idle
  beats of the villagers, しずえ or a visitor (looks, hops, tree shakes, strolls, outings), no ordinary night's shooting
  stars. The villagers are all there, asleep while their phone isn't open (one tab: the others'; `?awake` keeps
  everyone up, `?grace=` / `?wake=` shorten the spans: design.md "Sleep"); the opening beats, the events and what a tap
  starts are as ever. It's `localStorage['e2e.ambient'] = 'off'` (every context), read with the hooks on (`?demo` or a
  dev build: island/devHooks.ts) as `critter=none`, `visitor=events`, `balloon=none`, `idle=none` and `stars=none`. A
  URL's own param wins (`?critter=fish`, `?visitor=jack`, `?balloon`): say what the test is about. A test of the ambient life itself opts back in: `test.use({ ambient: 'on' })` (visitors.spec,
  visitor-life.spec; a single test in an anonymous `test.describe`: critters.spec's balloon, pond.spec's fresh-water
  visits, guest.spec's idle guest).
- **The tests' own relay agrees with its phones.** liveRoom.ts and record.ts run on the pinned time and shift their
  phones' device clock (`Date`) there too (a phone and its relay agree on the time: tickets, the day's replay); read
  the time as they do: `island.now()`, `rec.now()`, never `Date.now()`.
- **No network.** Chromium resolves no host but 127.0.0.1 (`--host-resolver-rules`), and a request off the local
  preview that went out (Chromium refused it; WebKit: a server answered) fails the test at its end, naming it. Mock a
  relay with `page.route` / `context.route` and fulfil it (board.spec, record.ts, liveRoom.ts); the map tiles are
  answered already (e2e/mapTiles.ts). The real relay's
  harness (`RELAY_E2E=1`, sync-harness.spec) is the one opt-out (`test.use({ network: 'any' })`).
- **No randomness**: no `Math.random` in a spec (a counter for ids); pin the island's with `?seed=`, `&rock=`,
  `&shake=`, and a critter or a visitor with `?critter=` / `?visitor=` (docs/design.md "Dev params").
- **Storage**: each test has its own context (Playwright's), service workers blocked; two phones in one context share
  `localStorage` and a BroadcastChannel (the demo's relay). In Chromium every tab is visible and focused (Playwright
  emulates it: rAF runs at 60 in both), so a tab that missed a tap didn't miss it for being behind; still
  `bringToFront()` the tab that acts (rule 6 below). Wait for a second tab's island (`is3d`, `quiet`) before timing
  anything across the two (highfive-star).
- **Taps on the 3D island are frame-locked** (e2e/island.ts `tapAt`, `tapWorld`, `tapThing`, `tapWater`): the page's
  frames held (requestAnimationFrame's callbacks kept till after the tap), the point read in the page, a real touch
  (or `mouse: true`) there, then the frames let go, so no camera ease, walk or swim comes between the read and the tap
  (a point read, then tapped a round trip later, was most of the tap specs' flakes). An aim is a function run in the
  page (a world point, a model, a fish, a box), polled while it has no point or a tap area lies over it. `castIn`
  sends its tap from the page in the same task (`dispatch`: a tree's lazy tap area can't come in between) and retries
  until it cast. A point tapped as read only where nothing moves or the tap itself is the test (exact-taps).
- **Read the hooks once they're there**: `__world` comes before `__world3d`; `camTo` and `settled` wait for both
  (`ready3d`); a spec reading `__world3d` straight after `goto` waits on `is3d` first.
- **The island after the HUD**: after a `goto` or `reload` wait with `islandUp` (e2e/island.ts), not the HUD alone. The
  3D island mounts after the HUD shows, once the ground's fields are in (worker or cache: layout/fieldsPrime.ts), and
  until then every island target sits hidden at the scene's corner: a box read or a tap there misses.
- **Silent**: Chromium runs with `--mute-audio` and `--disable-audio-output` (the music, K.K. and the effects never
  sound on a dev's Mac, and the page's audio clock is a fake output's, as on CI's Linux: the Mac's own device stalled
  it, the decks frozen, kk-sync red locally); WebKit headless makes no sound.
- **No new fixed wait**, wall-clock sampling or long test: ratcheted ("Guardrails" below).
- **Wait for what an action loads.** A tap that deals a deck, opens a sheet or enters a room may load a chunk first
  (ききみみ loads a level at a time): wait for the state it ends in (the game's countdown, the sheet open) before
  reading what it made (kikimimi-progress read the lobby's deck before にがて れんしゅう's came).
- **Vitest's module cache** (node_modules/.vitest-cache) never keeps a module with an `import.meta.glob`
  (vite.config.ts `globsUncached`), so a file added under a glob is seen at once; anything else odd after a big
  rebase: `npx vitest run --clearCache`.

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
`E2E_X3`, scripts/e2e-impact.ts; more than 8 changed is a sweep: each runs once). A flake fails the push that brings
it, not the next ten runs. Before pushing: `npm run e2e:ci-like -- --changed` ("Before you push").

## Writing a stable spec
Most red runs are the spec, not the app. Before pushing a new or changed spec, run it with
`--repeat-each=10` (and the whole file with `--workers=8`: a loaded machine is what CI is).

1. **Never tap where something can wander.** The villagers walk about, critters come and go (a flea off a villager,
   a bug from under the rock), visitors stroll, balloons drift. Tap a point only once it is *that* thing's, read and
   tapped in one held frame (`tapAt` and its `clear`, above), or pin the scene: ambient life is off already
   ("Hermetic"), then `&rock=clonk`, `&shake=…`, `?weather=…`, `?seed=` (docs/design.md "Dev params"). Prefer a locator's own click
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
10. **Fishing**: any water casts, however far from my villager; `e2e/island.ts` `toTheWater` puts it on the bank near
    the shadow and gives a water point on the screen (`toTheWater('sea')`: on the sea itself, not a clifftop pool);
    `tapWater` taps it frame-locked and returns where, and the ground the float must land on; `castIn` casts until it
    did and returns where, the place to reel (a fixed reel point can be a door, and with the line out a door goes in:
    the bite is missed). The bite's window is short, so `reelOnBite` taps in the page the moment the 「！」 shows.
    `__fish.why()` names what the last tap on water did; `__fish.line()` its phase. The 「！」's spot against the head is
    `__world3d.bite(slot)` (e2e/biteMark.ts `overHead`); hold it up with `__world3d.pinBite('mine')` rather than wait
    for bites (bite-mark.spec). The sea off the back beach (`?critter=fish&coast=back`) lies by the doors and the
    beach's finds: a real touch there casts (ui-state/exactTaps.ts takes a touch's click from its pointerup's point, so
    WebKit's touch adjustment never moves it onto a door; a find's 44px margin over the water is the water's: exact-taps).
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
The PWA stays open for days, so a scene's round trip must leave nothing behind. `e2e/leaks.spec.ts` (`@chromium`, in
the gate) goes in and out of the shop, the museum and うめ's house, opening いえを かえる, and the museum in first person
and out (the eye button, a bench), すがた dressed (as ウェイ: no context or DOM node more a visit), the info sheets
(りょこう's pages and maps, Okinawa's 地図 and campsites, けっこんしき, three trails), three rounds, and checks after a
forced GC that no WebGL context (watched by WeakRefs) or window/document listener is left over, and that inside the
museum only its own context lives. To hunt one: `npm run leak -- <flow> [cycles] --snap` (scripts/leak-probe.ts, its
header lists the flows: the rooms, the island's mount left early (`abort`), each sheet, the picker, visibility, the
museum's eye, benches, hours, curator and a wing rebuilt, fishing, selling, the sim's clock over midnight and over
days; `FILL=1`: a room furnished first) against a served build (`E2E_PORT`), printing per cycle the heap, DOM nodes,
listeners, rAF a second, live contexts and the room's renderer.info, then a heap-snapshot diff by constructor
(`SNAP_AT=0`: the whole heap, for an A/B of two builds); `--path=<name>` (`=<name>`: exactly, e.g.
`--path==WebGL2RenderingContext`) prints what retains the ones new since the first snapshot.
- **What a scene leaves behind:** anything page-wide (a `window.__*` hook, a module's callback, a `<link>`'s
  listener) that holds a closure made in a component holds that whole component: its DOM, its renderer. A hook goes
  in the scene's cleanup (only if it's still its own); a callback kept by a module is made at module level. Vite's
  preload helper left its CSS links' listeners (holding the first island for the page's life): vite.config.ts
  `preloadListenersOff` takes them off.
- **three.js:** a renderer stays alive as long as any geometry, material or texture it drew isn't disposed (three's
  dispose listeners hold it). Anything drawn from a page-wide model cache (homes, bridges, villagers) is disposed when
  its renderer goes, the ones that left the scene earlier too, and so is the page-wide white stand-in (blank.ts
  `WHITE`, on most materials: undisposed, it held each すがた stage's renderer and page): every surface ends its
  renderer with world3d/stage.ts `endRenderer` (releaseAll, WHITE, `forceContextLoss()`).
- **A closure made inside a cleanup** shares the cleanup's scope: a page-wide hold's `hold = () => false` written in its
  let-go held `fn` (Critters' closure) and so the whole island; a let-go value is made at module level.
- **The probe's own handles:** `waitForSelector` and `waitForFunction` return handles that keep their DOM or object
  alive (a heap path through "DevTools console"); wait on booleans.
- A steady +0.3 MB a trip that's all `[code]` in the diff is V8 compiling; it levels off (the museum in and out:
  from the 12th trip). `blink::NetworkResourcesData` is DevTools' own (the probe's), not the app's.
- **MapLibre:** a map goes by travel/map/glmap.ts removeMap, not `map.remove()` alone: that leaves the style's font faces in
  `document.fonts` (each holding its woff2; ~19 a guide's map) and the last map's abort Error holding the map.
- **Models kept:** the page-wide caches keep each model without its loader's parser (release.ts `lean`: the parser
  holds the GLB's whole file again). Over days they still grow, one entry a new model (a visitor's, a day's thing), and
  the island's GPU keeps each texture it drew until it goes: bounded by the models there are.

## Load budget
`npm run build` ends with `scripts/load-budget.ts`: the first load (what `index.html` loads, transitively) ≤ 400 KB of
JS and 70 KB of CSS gzipped, none of it three.js, MapLibre or a feature's sheet, and the service worker's precache
≤ 3 MB on the wire. Bytes only (never timing): over one, the build fails.

Timing is an A/B on the desktop, never CI: `npm run perf:start -- <port> [runs] [webkit|chromium]` (scripts/perf-start.ts,
default 5 runs, WebKit as an iPhone 15; Chromium as an iPhone 13, `THROTTLE=4` for a 4x slower CPU) against a build served
by `node scripts/serve-build.ts <port>`: each run cold (no service worker), or warm with `WARM=1` (the service worker
installed by a first load, then reloads), its first contentful paint, the island's first frame and loaded(), the main
thread's gaps over its first 10 s, the launch's own clock (`boot.*`: world3d/boot.ts, the log's `perf.boot`), then the
medians. The demo runs without its shader checks there (`checks=0`: [perf.md](perf.md#measuring)). The phone's numbers come from
the iOS Simulator (`npm run ios:check -- --boots 8 --url 'http://127.0.0.1:<port>/?demo&checks=0'`: warm launches'
`perf.boot` and their medians) and the phones' own `perf.boot` (`npm run logs -- report`).

## Unused assets
`npm run unused` (`scripts/unused-assets.ts`, read-only) sorts every file under `static/` and every module under `src/`
into safe to delete, used (with who uses it) and unsure; `-- --list=safe|used|unsure` for the paths, `-- --json`. Kept
by hand though nothing names them for the 3D island: the flowers' and oaks' art (the DOM tap areas' sizes and clips),
the candy, the party popper, the cake and the event pieces' art (the DOM over the canvas still shows or measures them).
Check a deletion against what the built island draws:
```sh
npm run build && node scripts/serve-build.ts 4396 &   # a free port (lsof -i :4396)
node scripts/unused-probe.ts 4396 /tmp/seen.txt       # 17 scenes: what's drawn or loaded; exits 1 on any 404 under art/, room/, terrain/
npm run unused -- --seen=/tmp/seen.txt                # the summary, with what was seen drawn
```
Beside its list the probe writes `<file>.wasted`: what was downloaded into the DOM and never seen drawn.

## The iOS Simulator check (the real target, on the Mac)

CI's software GL is no judge of the phones' rendering, so it's checked on the iOS Simulator, on this Mac: `npm run
ios:check` (scripts/ios-sim-check.ts) boots the newest iOS's iPhone, drives Safari over WebDriver (Remote Automation
on; safaridriver ships with macOS), opens the live site's demo (`--url` for another, e.g. a local build), and writes `test-results/ios-sim/<time>/`:
`report.md` / `report.json` (the 3D island's load time, idle and scrolling fps with the frames' p50/p95 and the long
ones, the engine's stats and the frames it draws a second idle; then けんこう (1週, 1年) and ごはん (きろく, グラフ)
opened from the HUD: the island's frames under each (0: it pauses), the CSS animations still running, and the
sheet's own scroll's fps; the page's errors) and four screenshots. `--seed FILE` puts localStorage entries in first (`{"island-demo.layout": …}`: the demo island with
things on it), `--then FILE` runs a script in the page once the island is up (my villager onto a piece), so an A/B of a
change is the same island twice (the gym's ten pieces: design.md "Decorating"). Exit 1 when the island didn't come up or it failed.

The indoor scenes likewise: `npm run ios:indoor -- --url <base>` (scripts/ios-sim-indoor.ts; `--fpv`: every room at
my villager's eyes; `--room N`: the tent and うめ's room furnished first with N pieces, `--varied` each a different
model; the base, e.g. a local `vite preview`'s `http://127.0.0.1:4962/`) seeds a full museum, opens the island, then
goes into the shop, the tent, うめ's house and the museum by the app's own navigation, twice (cold, then warm): each
one's time to its first frame and to everything in, the bytes fetched, the longest gaps on the way in, the frames a
second at rest and walking, each frame's cost, draw calls, triangles and the GPU's geometries, textures and programs,
a camera orbit, the museum's hour swap and a wing rebuilt; out to the shop after each, the rAF callbacks, timers and
intervals still running (a leak); the Web Content process's resident memory in each room. `report.json` and screenshots.

Nightly, a launchd agent (`~/Library/LaunchAgents/fund.island.ios-check.plist`, then
`launchctl load ~/Library/LaunchAgents/fund.island.ios-check.plist`):

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
