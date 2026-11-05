# Testing: CI and stable e2e specs

## CI (`.github/workflows/pages.yml`)
A push to `main` that touches `app/**` (docs-only and relay-only pushes don't run it; relay changes run *Relay checks*):

The tiers and why: [test-strategy.md](test-strategy.md).

| Job | What | Gates the deploy |
|---|---|---|
| `build` | `npm run build` once; its `build-pages/` is the `site` artifact: what `deploy` ships and the full tier tests | yes |
| `checks` | `npm run check`, `npm run knip`, `npx vitest run`, beside the build | yes |
| `e2e-logic` ×12 | **the logic tier**: Playwright in Chromium (iPhone 13 profile), every test but `@render` and `@quarantine`, with the 3D engines drawing nothing (`E2E_RENDER=none`), on `site` served as Pages serves it (`scripts/serve-build.ts`), 3 workers each (4 made the short waits flaky on the 4-core runners), shards balanced by each test's time (`scripts/e2e-shards.ts plan`, from the committed `e2e/timings.json`; the `timings` job's summary says when they drift apart: `npm run e2e:timings` and commit it); each shard builds the commit itself (~12 s: no waiting for `build`) | yes |
| `e2e-render` | **the drawn smoke**: the `@render` and `@smoke` tests with real (software) GL, one runner; advisory since Nov 2026 (CI's SwiftShader isn't the phones' Metal: rendering is judged on the iOS Simulator and the phones) | no |
| `deploy` | `site` to Cloudflare Pages (`wrangler pages deploy`, project `island-fund`), once all of the above are green; then checks https://island-fund.pages.dev answers this build (`_app/version.json`) with its CSP header. No `CLOUDFLARE_API_TOKEN` secret: a warning, nothing deployed | — |
| `e2e-full` ×10 | **the full tier** (`.github/workflows/e2e-full.yml`, its own workflow after each run of this one, and on demand): the whole suite drawn (the quarantine too), one browser a runner, `E2E_SLOW=1` (a test 90 s, an expect 20 s: drawn under software GL the game itself runs slower); its failures in its summary and on their specs | no |

- **Red main never deploys, and the newest green does.** One run at a time on `main`, never cancelled: a newer push
  waits, and one still waiting is replaced by the newest. So in a burst of pushes the running one finishes and
  deploys, then the newest runs (a deploy that has started is never cancelled either). The full tier likewise runs
  one at a time to the end (a newer one waits; one waiting is replaced by the newest): when its runs cancelled each
  other, a burst of pushes left it never finishing, red for hours unseen.
- **No silent retries.** `retries: 0`. A test that fails is run once more in its own step: passing then, it's named in the
  job summary and annotated on its spec as **flaky**, and the deploy goes on; failing again, or more than 5 failing in a
  shard (broken, not flaky), the job is red. A flaky test goes to the **quarantine** at once (below), and its owner
  fixes it at its cause; don't wait for it to fail twice.
- **Tags** (`test('…', { tag: '@render' }, …)`): `@render` needs real drawing (draw calls, pixels, the canvas's alpha):
  the drawn smoke only, never the logic tier. `@smoke` is a whole 3D flow worth drawing too: both tiers. `@quarantine`
  is flaky: out of the gate, run in the full tier until fixed. A quarantined test carries who owns it and why:
  `{ tag: '@quarantine', annotation: { type: 'quarantine', description: 'owner: engine agent, 2026-11-03: the rod never
  comes out on CI (#run)' } }`. List them: `npx playwright test --list --grep @quarantine`. `@logic` is the gate's
  only, never drawn (the full tier leaves it out): a timing a software-GL frame of 0.5–1 s can't meet (three quick taps
  within 1.2 s, frame-by-frame smoothness, a wait sized for the game at full speed, a squish over before a frame shows
  it), with why in `annotation: { type: 'logic', description: 'drawn: …' }`; it says nothing about the phones, whose
  frames are 16 ms. List them: `npx playwright test --list --grep @logic`.
- **Logic mode** (`E2E_RENDER=none`; src/lib/ui-state/testMode.ts): the island's and the tent's 3D engines run every
  frame (the scene, cameras, gestures, the World's step, the villagers' poses, effects, the tap areas) but never call
  `renderer.render`. `__world3d.stats().drawn` is false and `stats().calls` 0. Specs need no change; one that reads draw
  calls or pixels is `@render`.
- **WebKit, the users' browser** (Playwright's WebKit as an iPhone 15: the users' phones are an iPhone 15 and an iPhone 16
  on Safari, and Playwright's two profiles have the same viewport), runs in **the flake hunt**
  (`.github/workflows/e2e-flake-hunt.yml`) on **macOS** runners (Safari's own WebKit; Linux's draws the island at about
  one frame a second, so its timing-bound specs fail there): nightly, and Actions → *e2e flake hunt* → Run workflow
  (with how many runs each; 1 for a plain WebKit check). Too slow to gate each push yet (5 macOS runners, ~4 min);
  once it's green across the board it replaces Chromium as the gate. Each test 3× over, retries off; red when anything
  failed even once, its summary lists them worst first. It gates nothing.
- **The base path.** The site is at the root (`BASE_PATH` unset or `''`); the specs follow `BASE_PATH` (`e2e/island.ts`
  `BASE`, `islandURL`), so a build under one (`BASE_PATH=/x npm run build`, then `BASE_PATH=/x npm run e2e`) is tested the same.
- **The headers.** `npm run build` writes `build-pages/_headers` (`scripts/headers.ts`: the CSP SvelteKit put in the
  page's `<meta>`, with `frame-ancestors 'none'`, and nosniff, no-referrer, Permissions-Policy, HSTS; a year's cache for
  `_app/immutable/`), and `serve-build.ts` serves them as Cloudflare Pages does (all but the cache). `csp.spec.ts` walks
  the island, its sheets, the music, the shop, the museum, the tent and the editor and fails on any CSP violation.
- Playwright's browsers are cached by its version; bumping `@playwright/test` downloads them once.

## Run it locally
```sh
cd app
npm run build                       # the e2e test the build, not the dev server
npx playwright install webkit       # once per Playwright version
E2E_PORT=4391 npm run e2e -- --project=webkit   # a free port (--project=chromium: the installed Chrome)
E2E_PORT=4391 npm run e2e -- e2e/demo.spec.ts --project=webkit --repeat-each=10   # hunt a flake
E2E_SWIFTSHADER=1 E2E_PORT=4391 npm run e2e -- e2e/world3d.spec.ts --project=chromium   # software GL, as CI's Linux draws
E2E_RENDER=none E2E_PORT=4391 npm run e2e -- --project=chromium   # the logic tier: the 3D engines draw nothing
npm run e2e:ci-like -- e2e/world3d.spec.ts --repeat 5   # as CI runs it (below)
```

## Before you push (a new or changed spec, or a change to the 3D engines, the tent or sync)
1. `npm run check && npx vitest run && npm run knip` (all three gate the deploy; deps.test checks the folders' imports).
2. `npm run e2e:ci-like -- e2e/the.spec.ts --repeat 5`: the logic tier as CI runs it (a fresh build if `src/` is newer,
   software GL, CI's workers, `CI=1`, a free port), each test 5×. For a drawn (`@render`/`@smoke`) test add
   `--tier render`; `--tier full` draws everything; `--workers 6` loads the machine as a busy runner is.
3. All green, every time: push (`git pull --rebase origin main && git push origin HEAD:main`). One failure in 5 is a
   flake: fix it now, or quarantine it in the same push with its owner.
4. After the push, watch the run (`gh run watch`). A red gate is yours to fix first, before anything else.

## Writing a stable spec
Most red runs so far were the spec, not the app. Before pushing a new or changed spec, run it with
`--repeat-each=10` (and the whole file with `--workers=8`: a loaded machine is what CI is).

1. **Never tap where something can wander.** The villagers walk about, critters come and go (a flea off a villager,
   a bug from under the rock), visitors stroll, balloons drift. Tap a point only once it is *that* thing's: poll
   `document.elementFromPoint(x, y)` until it's inside the target, or pin the scene: `?critter=none`, `?visitor=none`,
   `&rock=clonk`, `&shake=…`, `?weather=…`, `?seed=` (docs/design.md "Dev params"). Prefer a locator's own click
   (Playwright checks what receives it) to `page.mouse.click(x, y)` when the island isn't the target.
2. **Wait on the app's state, not on time.** `expect(…).toBeVisible()`, `expect.poll(() => window.__world.cam())`,
   `__world.idle()`, `__tent.stats().frames`, `data-*` attributes (`__world3d.camStill()` once the camera's last move is
   framed: the DOM's tap areas placed for it, not where the previous camera had them); never `waitForTimeout` to "let it settle". A fixed
   wait is only for proving that nothing happens for a while (a toast that must stay 3 s), and then say so.
3. **Fix the clock.** `?date=2026-11-04T12:00` for the day and hour; `page.clock.install({ time })` when the app's
   timers matter, `page.clock.runFor(ms)` to skip an animation's wait instead of sleeping through it. The clock fakes
   `requestAnimationFrame` too, so `runFor` steps the 3D engines frame by frame: in logic mode that's quick (drawn under
   software GL it took minutes, hence `fastForward` there).
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
    the shadow (the near case) and gives a water point to tap; the bite's window is short, so `reelOnBite` taps in the
    page the moment the 「！」 shows. `__fish.why()` names what the last tap on water did; `__fish.line()` its phase.
    The 「！」's spot on screen against the head is `__world3d.bite(slot)` (e2e/biteMark.ts `overHead`); to check it at
    several zooms or seated, hold it up with `__world3d.pinBite('mine')` rather than wait for bites (bite-mark.spec).
    The sea off the back beach (`?critter=fish&coast=back`) lies high on the screen at the camera's far stop, beside
    the doors and the beach's finds: a real touch there casts (`page.touchscreen.tap`; ui-state/exactTaps.ts takes a
    touch's click from its pointerup's point, so WebKit's touch adjustment never moves it onto a door, and a find's 44px
    margin over the water is the water's: `e2e/exact-taps.spec.ts`). `toTheWater('sea')` gives a point on the sea
    itself (a clifftop pool by the back beach is water too) and on the screen.
    `castIn(page, water)` casts in any water: `toTheWater`'s point checked clear and clicked in one step in the page (a tree's
    tap area on the bank comes in as its lazy art loads), retried until it cast; it returns where it cast, the place to
    reel (a fixed reel point can be a building's door, and with the line out a door goes in: the bite is missed).
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
and out (the eye button, a bench), three rounds, and checks after a forced GC that no WebGL context (watched by
WeakRefs) or window/document listener is left over, and that inside the museum only its own context lives. To hunt
one: `npm run leak -- <flow> [cycles] --snap` (scripts/leak-probe.ts, its header lists the flows: the rooms, each
sheet, the picker, visibility, the museum's eye, benches, hours, curator and a wing rebuilt, fishing, selling, the
sim's clock over midnight and over days; `FILL=1`: a room furnished first) against a served build (`E2E_PORT`), printing per cycle the heap, DOM nodes, listeners, rAF
a second, live contexts and the room's renderer.info, then a heap-snapshot diff by constructor (`SNAP_AT=0`: the
whole heap, for an A/B of two builds); `--path=<name>` (`=<name>`: exactly, e.g. `--path==WebGL2RenderingContext`)
prints what retains the ones new since the first snapshot.
- **What a scene leaves behind:** anything page-wide (a `window.__*` hook, a module's callback, a `<link>`'s
  listener) that holds a closure made in a component holds that whole component: its DOM, its renderer. A hook goes
  in the scene's cleanup (only if it's still its own); a callback kept by a module is made at module level. Vite's
  preload helper left its CSS links' listeners (holding the first island for the page's life): vite.config.ts
  `preloadListenersOff` takes them off.
- **three.js:** a renderer stays alive as long as any geometry, material or texture it drew isn't disposed (three's
  dispose listeners hold it). Anything drawn from a page-wide model cache (homes, bridges, villagers) is disposed when
  its renderer goes (world3d/release.ts `releaseAll`), the ones that left the scene earlier too; then
  `forceContextLoss()`.
- **A closure made inside a cleanup** shares the cleanup's scope: `napHold = () => false` written in holdNaps' let-go
  held `fn` (Critters' closure) and so the whole island; a let-go value is made at module level.
- **The probe's own handles:** `waitForSelector` and `waitForFunction` return handles that keep their DOM or object
  alive (a heap path through "DevTools console"); wait on booleans.
- A steady +0.3 MB a trip that's all `[code]` in the diff is V8 compiling; it levels off (the museum in and out:
  from the 12th trip). `blink::NetworkResourcesData` is DevTools' own (the probe's), not the app's.
- **Models kept:** the page-wide caches keep each model without its loader's parser (release.ts `lean`: the parser
  holds the GLB's whole file again). Over days they still grow, one entry a new model (a visitor's, a day's thing), and
  the island's GPU keeps each texture it drew until it goes: bounded by the models there are.

## The iOS Simulator check (the real target, on the Mac)

CI draws in software (SwiftShader): no judge of the phones' rendering (iPhone 15/16, Safari, Metal). The rendering is
checked on the iOS Simulator instead, on this Mac: `npm run ios:check` (scripts/ios-sim-check.ts) boots the newest
installed iOS's iPhone, turns on Safari's Remote Automation in it, drives Safari over WebDriver (safaridriver ships with
macOS), opens the live site's demo (`--url` for another, e.g. a local build), and writes `test-results/ios-sim/<time>/`:
`report.md` / `report.json` (the 3D island's load time, idle and scrolling fps with the frames' p50/p95 and the long
ones, the engine's stats and the frames it draws a second idle; then けんこう (1週, 1年) and ごはん (きろく, グラフ)
opened from the HUD: the island's frames under each (0: it pauses), the CSS animations still running, and the
sheet's own scroll's fps; the page's errors) and four screenshots. `--seed FILE` puts localStorage entries in first (`{"island-demo.layout": …}`: the demo island with
things on it), `--then FILE` runs a script in the page once the island is up (my villager onto a piece), so an A/B of a
change is the same island twice (the gym's ten pieces: design.md "Decorating"). Exit 1 when the island didn't come up or it failed.

The indoor scenes likewise: `npm run ios:indoor -- --url <base>` (`--fpv`: every room at my villager's eyes; `--room N`: the tent and うめ's room furnished first with N pieces, `--varied` each a different model; scripts/ios-sim-indoor.ts; the base, e.g. a local
`vite preview`'s `http://127.0.0.1:4962/`) seeds a full museum (every fish and bug found), opens the island,
then goes into the shop, the tent, うめ's house and the museum by the app's own navigation, twice (cold, then warm):
each one's time to its first frame and to everything in, the bytes fetched, the longest frame gaps on the way in, the
frames it draws a second at rest and walking (the museum's hall, aquarium and bug wing), each frame's cost, its draw
calls, triangles and the GPU's geometries, textures and programs, a camera orbit's frames (the rooms), the museum's
hour swap and a wing rebuilt (its worst gaps, its programs); and out to the
shop after each: the rAF callbacks, timer fires and intervals still running (a leak); the page's Web Content process's
resident memory in each room. `report.json` and screenshots.

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
