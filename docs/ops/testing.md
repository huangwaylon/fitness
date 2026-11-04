# Testing: CI and stable e2e specs

## CI (`.github/workflows/pages.yml`)
A push to `main` that touches `app/**` (docs-only and relay-only pushes don't run it; relay changes run *Relay checks*):

The tiers and why: [test-strategy.md](test-strategy.md).

| Job | What | Gates the deploy |
|---|---|---|
| `build` | `npm run build` once; its `build-pages/` is both the Pages artifact and the `site` artifact the full tier tests | yes |
| `checks` | `npm run check`, `npm run knip`, `npx vitest run`, beside the build | yes |
| `e2e-logic` ×12 | **the logic tier**: Playwright in Chromium (iPhone 13 profile), every test but `@render` and `@quarantine`, with the 3D engines drawing nothing (`E2E_RENDER=none`), on `site` served as Pages serves it (`scripts/serve-build.ts`), 3 workers each (4 made the short waits flaky on the 4-core runners), shards balanced by each test's time (`scripts/e2e-shards.ts plan`, from the committed `e2e/timings.json`; the `timings` job's summary says when they drift apart: `npm run e2e:timings` and commit it); each shard builds the commit itself (~12 s: no waiting for `build`) | yes |
| `e2e-render` | **the drawn smoke**: the `@render` and `@smoke` tests with real (software) GL, one runner; advisory since Nov 2026 (CI's SwiftShader isn't the phones' Metal: rendering is judged on the iOS Simulator and the phones) | no |
| `deploy` | to Pages, once all of the above are green | — |
| `e2e-full` ×5 | **the full tier** (`.github/workflows/e2e-full.yml`, its own workflow after each run of this one, and on demand): the whole suite drawn (the quarantine too); its failures in its summary and on their specs | no |

- **Red main never deploys, and the newest green does.** One run at a time on `main`, never cancelled: a newer push
  waits, and one still waiting is replaced by the newest. So in a burst of pushes the running one finishes and
  deploys, then the newest runs (a deploy that has started is never cancelled either). The full tier's runs do cancel
  each other: only the newest's result matters.
- **No silent retries.** `retries: 0`. A test that fails is run once more in its own step: passing then, it's named in the
  job summary and annotated on its spec as **flaky**, and the deploy goes on; failing again, or more than 5 failing in a
  shard (broken, not flaky), the job is red. A flaky test goes to the **quarantine** at once (below), and its owner
  fixes it at its cause; don't wait for it to fail twice.
- **Tags** (`test('…', { tag: '@render' }, …)`): `@render` needs real drawing (draw calls, pixels, the canvas's alpha):
  the drawn smoke only, never the logic tier. `@smoke` is a whole 3D flow worth drawing too: both tiers. `@quarantine`
  is flaky: out of the gate, run in the full tier until fixed. A quarantined test carries who owns it and why:
  `{ tag: '@quarantine', annotation: { type: 'quarantine', description: 'owner: engine agent, 2026-11-03: the rod never
  comes out on CI (#run)' } }`. List them: `npx playwright test --list --grep @quarantine`.
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
11. **Tap a pill only once it's at rest.** Playwright calls a moving thing "stable" while a staggered transition is in
    its delay, then the tap lands where it has moved off to (the menu's せってい sits over the ベル row 110 ms first):
    `e2e/hud.ts` `unfoldMenu` / `fromMenu` wait for the pills' spring. A route that fails chunks fails every lazy load
    under it (a critter's, a visitor's): pin the scene and route just before the one tap it's for (`e2e/stale.spec.ts`).

## Memory
The PWA stays open for days, so a scene's round trip must leave nothing behind. `e2e/leaks.spec.ts` (`@chromium`, in
the gate) goes in and out of the shop, the museum and うめ's house, opening いえを かえる, three rounds, and checks after
a forced GC that no WebGL context (watched by WeakRefs) or window/document listener is left over. To hunt one:
`npm run leak -- <flow> [cycles] --snap` (scripts/leak-probe.ts, its header lists the flows: the rooms, each sheet, the
picker, visibility, the sim's clock over midnight) against a served build (`E2E_PORT`), printing per cycle the heap,
DOM nodes, listeners and live contexts, then a heap-snapshot diff by constructor; `--path=<name>` prints what retains it.
- **three.js:** a renderer stays alive as long as any geometry, material or texture it drew isn't disposed (three's
  dispose listeners hold it). Anything drawn from a page-wide model cache (homes, bridges, villagers) is disposed when
  its renderer goes (world3d/release.ts `releaseAll`), the ones that left the scene earlier too; then
  `forceContextLoss()`.
- **The probe's own handles:** `waitForSelector` and `waitForFunction` return handles that keep their DOM or object
  alive (a heap path through "DevTools console"); wait on booleans.
- A steady +0.3 MB a trip that's all `[code]` in the diff is V8 compiling; it levels off.

## The iOS Simulator check (the real target, on the Mac)

CI draws in software (SwiftShader): no judge of the phones' rendering (iPhone 15/16, Safari, Metal). The rendering is
checked on the iOS Simulator instead, on this Mac: `npm run ios:check` (scripts/ios-sim-check.ts) boots the newest
installed iOS's iPhone, turns on Safari's Remote Automation in it, drives Safari over WebDriver (safaridriver ships with
macOS), opens the live site's demo (`--url` for another, e.g. a local build), and writes `test-results/ios-sim/<time>/`:
`report.md` / `report.json` (the 3D island's load time, idle and scrolling fps with the frames' p50/p95 and the long
ones, the engine's stats and the frames it draws a second idle; then けんこう (1週, 1年) and ごはん (きろく, グラフ)
opened from the HUD: the island's frames under each (0: it pauses), the CSS animations still running, and the
sheet's own scroll's fps; the page's errors) and four screenshots. Exit 1 when the island didn't come up or it failed.

The indoor scenes likewise: `npm run ios:indoor -- --url <base>` (`--fpv`: every room at my villager's eyes; scripts/ios-sim-indoor.ts; the base, e.g. a local
`vite preview`'s `http://127.0.0.1:4962/fitness/`) seeds a full museum (every fish and bug found), opens the island,
then goes into the shop, the tent, うめ's house and the museum by the app's own navigation, twice (cold, then warm):
each one's time to its first frame and to everything in, the bytes fetched, the longest frame gaps on the way in, the
frames it draws a second at rest and walking (the museum's hall, aquarium and bug wing), each frame's cost, its draw
calls, triangles and the GPU's geometries, textures and programs, a camera orbit's frames (the rooms); and out to the
shop after each: the rAF callbacks, timer fires and intervals still running (a leak). `report.json` and screenshots.

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
