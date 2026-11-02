# Testing: CI and stable e2e specs

## CI (`.github/workflows/pages.yml`)
A push to `main` that touches `app/**` (docs-only and relay-only pushes don't run it; relay changes run *Relay checks*):

| Job | What | Gates the deploy |
|---|---|---|
| `build` | `npm run build` once; its `build-pages/` is both the Pages artifact and the `site` artifact the e2e jobs test | yes |
| `checks` | `npm run check`, `npm run knip`, `npx vitest run`, beside the build | yes |
| `e2e` ×8 | Playwright in Chromium (iPhone 13 profile), the whole suite, on `site` served as Pages serves it (`scripts/serve-build.ts`), split by test (`fullyParallel`, 3 workers each) | yes, until WebKit is green across the board |
| `e2e-3d` ×8 | the same suite on the 3D island (`E2E_ISLAND=3d`), ahead of the cutover; nightly and on demand (`gh workflow run pages.yml`) only; its failures in its job summary (docs/world3d-gaps.md) | no, until it's green |
| `deploy` | to Pages, once all of the above are green | — |

- **Red main never deploys.** A newer push cancels an older run's checks (each job's own concurrency group), so a
  burst of pushes deploys the latest; a deploy that has started is never cancelled (the newer one waits).
- **No silent retries.** `retries: 0`. A test that fails is run once more in its own step: passing then, it's named in the
  job summary and annotated on its spec as **flaky**, and the deploy goes on; failing again, or more than 5 failing in a
  shard (broken, not flaky), the job is red. Fix a flaky spec at its cause (below), don't wait for it to fail twice.
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
E2E_ISLAND=3d E2E_PORT=4391 npm run e2e -- --project=chromium   # every test on the 3D island (せってい's switch in localStorage)
E2E_SWIFTSHADER=1 E2E_PORT=4391 npm run e2e -- e2e/world3d.spec.ts --project=chromium   # software GL, as CI's Linux draws
```

## Writing a stable spec
Most red runs so far were the spec, not the app. Before pushing a new or changed spec, run it with
`--repeat-each=10` (and the whole file with `--workers=8`: a loaded machine is what CI is).

1. **Never tap where something can wander.** The villagers walk about, critters come and go (a flea off a villager,
   a bug from under the rock), visitors stroll, balloons drift. Tap a point only once it is *that* thing's: poll
   `document.elementFromPoint(x, y)` until it's inside the target, or pin the scene: `?critter=none`, `?visitor=none`,
   `&rock=clonk`, `&shake=…`, `?weather=…`, `?seed=` (docs/design.md "Dev params"). Prefer a locator's own click
   (Playwright checks what receives it) to `page.mouse.click(x, y)` when the island isn't the target.
2. **Wait on the app's state, not on time.** `expect(…).toBeVisible()`, `expect.poll(() => window.__world.cam())`,
   `__world.idle()`, `__tent.stats().frames`, `data-*` attributes; never `waitForTimeout` to "let it settle". A fixed
   wait is only for proving that nothing happens for a while (a toast that must stay 3 s), and then say so.
3. **Fix the clock.** `?date=2026-11-04T12:00` for the day and hour; `page.clock.install({ time })` when the app's
   timers matter, `page.clock.runFor(ms)` to skip an animation's wait instead of sleeping through it.
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
