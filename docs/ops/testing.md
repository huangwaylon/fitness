# Testing: the tiers, CI and stable e2e specs

What gates a deploy and how to write specs that stay green. The relay's checks:
[runbook §8](runbook.md#8-deploy-the-live-relay).

## Why the tiers
CI's Linux runners have no GPU (SwiftShader: seconds a frame), so the gate runs the game without drawing (logic mode);
drawing is judged on the iOS Simulator and the phones. Tiers: **unit** (vitest, `src/**/*.test.ts`: every rule and
simulation), **logic-mode e2e** (Playwright, the real app with gameplay and 3D tap areas live, nothing drawn: the gate
runs a selection, the full logic tier all after each deploy), **drawn smoke** (`@render`, `@smoke`, advisory).

- A rule belongs in a unit test with a seed and a date (beach.ts, critters.ts, events.ts, daySeed.ts); the e2e checks
  the wiring. Positions are functions of time; the World steps itself every 33 ms when no frame drew
  (camera.svelte.ts `simTick`).
- **The test API.** Specs act and query by id through hooks (`__world3d`, `__world`, `__villagers3`, `__tent`,
  `__fish`; wrapped by e2e/island.ts), never pixels: `__world3d.pick(cx, cy)` (what a tap hits), `box(kind, id)`, and
  the rest in island/probe.ts. Tap areas come from world3d/things3.ts via world3d/pick3d.ts (probe.spec, probe3d.spec).
  A new interaction comes with its hook; `elementFromPoint` or a fixed coordinate in a spec means one is missing.
- **Two phones** are two tabs of one context synced by `sync/live-local.ts` (a BroadcastChannel as the room), neither
  drawing. The real relay: `RELAY_E2E=1`, `e2e/sync-harness.spec.ts`.
- A lean gate (~3 min to live), fixed forward: a red gate or full logic tier is the next push's first job. A spec's
  owner is whoever last changed its area; fix flakes at their cause, never loosen an assertion.

## CI (`.github/workflows/pages.yml`)
*Deploy UI* runs on a push to `main` touching `app/**` (docs only: *Docs check*, `docs.yml`; relay: *Relay checks*,
`relay.yml`, which also deploys the relay, runbook §8; its paths kept in step by `relay/test/paths.test.ts`). Jobs wait by `needs`, never by polling the API.

- `plan`: the gate's selection (`gate-plan` artifact; `scripts/e2e-impact.ts`, `e2e-flakes.ts`, `e2e-shards.ts plan`).
  `checks`: `check`, `knip`, quarantine owners, docs-check. `unit`: `npx vitest run`.
- `e2e-gate` ×4: Chromium, logic mode, `--grep-invert "@render|@quarantine"`, against `scripts/serve-build.ts`; shards
  split by `e2e/timings.json`; each builds with its budgets, shard 1's `build-pages/` is the `site` artifact.
- `deploy`: when every job in its `GATE` env succeeded (`scripts/deploy-gate.ts`), `site` to Cloudflare Pages; then
  https://island-fund.pages.dev must serve it (`_app/version.json`, 6 min) with its CSP, else **Deploy not served**
  (red; only the deployment URL serving it: a **Pages alias lag** warning). One run at a time; `scripts/deploy-order.ts`
  never deploys older over newer; `scripts/relay-first.ts` waits up to 10 min for the live relay to have the last relay
  commit. `contract/compat.test.ts` pins `LIVE_V`, `LIVE_VS`, `ROOM_PROTOCOL` per `COMPAT`.

After a deploy, never holding one back: *e2e logic full* (`e2e-logic-full.yml`): `e2e-logic` ×6 (every test incl.
auto-quarantined; red is the next push's job), `e2e-render` (drawn smoke, advisory), `coverage` (`npm run coverage`:
files under `contract/`, `sync/`, `store/actions.ts`, `store/meals.ts` at 85 % or their floor in
`scripts/coverage-floors.ts`), `timings` (refresh with `npm run e2e:timings`; `scripts/e2e-missed.ts` lists what the
gate missed). *e2e flake hunt*
(`e2e-flake-hunt.yml`, nightly, runbook §0): WebKit as an iPhone 15, logic tier ×3, no retries, failures to the `flake`
issue (titled by spec names, "9 tests failed: guest, gymbot, players, pond +4 more": `scripts/flake-why.ts`; the places in
its body).

- **The gate** (`npm run e2e:impact` previews): the gate set `e2e/gate.json` (15 fast, stable files); the specs the push
  **changed**, each test 3× unretried (`chromium-x3`, `E2E_X3`: one failure is red); the specs its files **reach** (a
  changed helper's importers, over `MAX_IMPORTERS` 10 or fixtures.ts: the gate set; src/content via `e2e/impact.json`;
  specs spelling a changed i18n string). Base: the live commit. Over `CAP_MS` (~1550 s) reached specs drop first, then
  changed ones run once (also over `MAX_CHANGED` 8). Unmapped directories are listed with why (src/lib/e2e-impact.test.ts).
- **Flakes**: CI `retries: 1`; passing on retry is flaky (e2e/reporters/flaky.ts → `flaky-<shard>`; `npm run
  e2e:flakes`). Flaky on 2+ commits in 48 h: auto-quarantined out of the gate (max 5, never the gate set) till its spec
  changes (scripts/e2e-flakes.ts). Locally no retry.
- **Tags**: `@render` drawn only; `@smoke` both; `@quarantine` out of gate and full tier, with a `quarantine`
  annotation (owner, why); `@logic` never draws; `@chromium` not on WebKit (say why).
- **Logic mode** (`E2E_RENDER=none`; src/lib/ui-state/testMode.ts): engines run every frame, never draw
  (`__world3d.stats().drawn` false); maps are stubs (`e2e.render` `map` draws them, e2e/trips.ts).
- `BASE_PATH=/x` for build and e2e alike. `csp.spec.ts` fails on any CSP violation (`scripts/headers.ts`). Map tiles
  are answered locally (`e2e/mapTiles.ts`).

## CI cost
Queue time is the cost: batch pushes, measure locally. Heavy dispatch-only runs go in 02:00–07:00 JST, never
03:00–03:45 (runbook §0).

## Run it locally
```sh
cd app && npm run build                                # e2e test the build
npx playwright install webkit                          # once per Playwright version
npm run e2e -- --project=webkit                        # own port per checkout (E2E_PORT=…)
npm run e2e -- e2e/x.spec.ts --project=webkit --repeat-each=10           # hunt a flake
E2E_SWIFTSHADER=1 npm run e2e -- e2e/world3d.spec.ts --project=chromium  # software GL, as CI
E2E_RENDER=none npm run e2e -- --project=chromium      # the logic tier
```
Sync probe: `SYNC_PROBE=1 npm run e2e -- e2e/zz-sync-probe.spec.ts --project=webkit --workers=3` (~15 min, prints
`[probe-summary]`, never asserts). Local WebKit loses WebGL after a test with sound: one worker per test.

## Before you push
1. `npm run verify` (scripts/verify.ts; `-- --quick`, `-- --build`): lockfile, `check`, `knip`, `knip-relay`, vitest,
   quarantine owners, docs-check (rename a heading and its citations together). `.githooks/pre-push` runs it (over
   50 MB of new blobs refused unless `BIG_PUSH=1`; bypass `--no-verify`).
2. Specs, 3D, tent or sync touched: `npm run e2e:ci-like -- --changed` (or `-- e2e/x.spec.ts --repeat 5`; `--tier
   render`, `--workers 6`): CI's way, each test 5×. One failure in 5: fix or quarantine with its owner.
3. `git pull --rebase origin main && git push origin HEAD:main`, `gh run watch`, then watch the full logic tier.

## Hermetic
Every e2e is sealed (e2e/fixtures.ts header). Import Playwright from `./fixtures.ts` (`src/lib/e2e-hermetic.test.ts`).
The clock is pinned at `PINNED_DATE` (Wednesday noon, clear, no event; `?date=` wins; `test.use({ ownClock: true })`).
Ambient life is off (`localStorage['e2e.ambient']`; villagers sleep unless `?awake`; `test.use({ ambient: 'on' })`).
The tests' relay (liveRoom.ts, record.ts) runs on that clock: `island.now()`, `rec.now()`, never `Date.now()`. No
network (mock with `page.route`; unit tests: src/no-network.setup.ts), no `Math.random` (pin `?seed=`, `?critter=`…),
a context per test, service workers blocked, silent audio. Island taps are frame-locked (e2e/island.ts `tapAt`); after
a goto wait with `islandUp`. Odd vitest after a rebase: `npx vitest run --clearCache`.

## Test mode
`?demo`: made-up rows (`store/demo/`), the players as two tabs, the hooks. Only in the dev server or with
`localStorage['e2e.testMode'] = '1'` (`ui-state/testMode.ts`; `test.use({ testMode: false })`). Tests only, never a
product feature.

## URL params
Read by `world/devHooks.ts` (seasonal: `ui-state/preview.ts`); in dev or test mode, except `?date`, `?theme`, `?season`.

| Param | Effect |
|---|---|
| `?demo` (`=harvest`, `&as=B\|G`, `&weeks=60`, `&health=none`) | [Test mode](#test-mode) variants |
| `?date=YYYY-MM-DDTHH:mm`, `?theme=`, `?season=`, `?seed=` | clock (Tokyo), time of day, season, seed |
| `?weather=`, `?wx=real\|game\|<fixture>` | weather; mode or `world/wxFixtures.ts` timeline |
| `?event=`, `?visitor=<id>\|none\|events`, `?arrive`, `?leave=`, `?stroll`, `?meet`, `?kk=` | events, visitors, K.K. |
| `?critter=`, `&coast=`, `&swim=`, `&dice=`, `?sea=`, `?flea`, `?shake=`, `?rock=`, `?find=` | critters and finds |
| `?balloon`, `?fireworks`, `?shower`, `?stretch`, `?hybrid`, `?idle=none`, `?stars=none` | one-offs |
| `?hit`, `?fpv=1\|0`, `?render=none` | tap targets drawn; rooms' first person; logic mode |
| `?awake`, `?grace=`, `?wake=`, `?quietafter=` | presence ([Sleep](../design.md#sleep)) |
| `?relay=<wss>&key=` | test mode over a real relay |

Anywhere: `?panel=rewards`, `?dpr=`, `?aa=0|1`, `?shadows=0|1`, `?ambient=<fps>`, `?ktx2=0` (the Simulator's ASTC
quirk). Editor: [island-layout.md](../island-layout.md).

## Guardrails
`src/lib/e2e-budgets.test.ts` caps per file in `e2e/budgets.json`: `waits` (`waitForTimeout(`, setTimeout promises),
`wallClock` (`performance.now(`, `requestAnimationFrame(`), `longTests` (`test.setTimeout(` over 30 s, `test.slow(`),
`textSelectors` (`getByText(`, `hasText:`). Lower with `UPDATE_BUDGETS=1 npx vitest run src/lib/e2e-budgets`.

## Writing a stable spec
Run a new spec `--repeat-each=10` and its file `--workers=8`.
1. **Never tap where something can wander**: read and tap in one frame (`tapAt`) or pin the scene.
2. **Wait on state, not time**: `expect.poll`, `__world.idle()`, `__world3d.camStill()`, `data-*`; type hooks
   yourself (`unknown` on `Window`, `src/app.d.ts`).
3. **Step the clock**: `page.clock.install({ time })` before the goto, then `runFor(ms)`.
4. **Find by role or test id**, never position or `nth()`.
5. **WebKit is the browser**: whole-px scroll, no wheel (`scrollBy`), no CDP.
6. **Two phones**: `bringToFront()` the acting tab, poll the other.
7. **Toasts cover the tabs**; tap a pill only at rest (`e2e/hud.ts` `unfoldMenu`).
8. **Clean, short tests**; never loosen an assertion.
9. **Fishing** via e2e/island.ts `toTheWater`, `castIn`, `reelOnBite`; `__fish.why()`.
10. **Route failing chunks** just before the one tap (`e2e/stale.spec.ts`).
11. **Phone width** (390/393 px); screenshots only under `SHOTS=<dir>`.

## Memory
`e2e/leaks.spec.ts` (`@chromium`) and `e2e/leaks-sheets.spec.ts` check after round trips and a forced GC that no
WebGL context, listener or editor buffer remains (`e2e/memory.ts`). Hunt: `npm run leak -- <flow> [cycles] --snap`.
Page-wide holds keep components (clear in cleanup; vite.config.ts `preloadListenersOff`); end renderers with
world3d/stage.ts `endRenderer`; MapLibre via components/map/gl.ts `removeMap`. Warm-up climbs ~10 trips: judge 20+.

## Load budget
`npm run build` ends with `scripts/load-budget.ts`: first load ≤ 369 KB JS and 70 KB CSS gzipped, with no three.js,
MapLibre or feature sheet; the precache ≤ 3.6 MB; plus share page, `/gym` and English caps. Over fails the build.
Timing: [perf.md](perf.md#measuring).

## Unused assets
`npm run unused` (`scripts/unused-assets.ts`, read-only): safe/used/unsure. Confirm with `node scripts/serve-build.ts
<port>`, `npm run unused:probe -- <port> /tmp/seen.txt`, `npm run unused -- --seen=/tmp/seen.txt`.

## The iOS Simulator check (the real target, on the Mac)
`npm run ios:check` (scripts/ios-sim-check.ts: island frames, けんこう, ごはん, errors and shots in
`test-results/ios-sim/`) and `npm run ios:indoor` (scripts/ios-sim-indoor.ts: tent, houses, museum, shop). On demand.
