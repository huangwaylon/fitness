# Testing: the tiers, CI and stable e2e specs

What gates a deploy and how to write specs that stay green. The relay's checks: [runbook §8](runbook.md#8-deploy-the-live-relay).

## Why the tiers
CI's runners have no GPU, so the gate runs the game without drawing (logic mode); drawing is judged on the iOS
Simulator and the phones. **Unit** (vitest, `src/**/*.test.ts`): every rule and simulation, with a seed and a date.
**Logic-mode e2e** (Playwright, the real app, gameplay and 3D tap areas live, nothing drawn): the wiring; the gate runs
a selection, the full tier all after each deploy. **Drawn smoke** (`@render`, `@smoke`): advisory. The World steps
itself every 33 ms when no frame drew (`simTick`).

- **The test API.** Specs act and query by id through hooks (`__world3d`, `__world`, `__villagers3`, `__tent`,
  `__fish`; wrapped by e2e/island.ts), never pixels: `__world3d.pick(cx, cy)`, `box(kind, id)`, the rest in
  island/probe.ts. A new interaction comes with its hook; `elementFromPoint` or a fixed coordinate means one is missing.
- **Two phones** are two tabs synced by `sync/live-local.ts` (a BroadcastChannel as the room). The real relay:
  `RELAY_E2E=1`, `e2e/sync-harness.spec.ts`.
- The gate is lean (~3 min to live) and fixed forward: a red gate or full tier is the next push's first job; fix flakes
  at their cause, never loosen an assertion.

## CI (`.github/workflows/pages.yml`)
*Deploy UI* runs on a push touching `app/**` (docs: `docs.yml`; relay: `relay.yml`, runbook §8). Jobs wait by `needs`.

- `plan` (`scripts/e2e-impact.ts`, `e2e-flakes.ts`, `e2e-shards.ts`); `checks` (`check`, `knip`, quarantine owners,
  docs-check); `unit` ×3; `e2e-gate` ×4 (Chromium, logic mode, no `@render|@quarantine`, against
  `scripts/serve-build.ts`, split by `e2e/timings.json`; shard 1's build is the `site` artifact).
- `deploy` (`scripts/deploy-gate.ts`): `site` to Pages, then the live URL must serve it with its CSP within 6 min, else
  **Deploy not served**. Before it: `deploy-order.ts` (never older over newer), `deploy-quiet.ts` (20 min after the live
  deploy unless an `Urgent:` trailer or `urgent` dispatch), `deploy-keep.ts` (older hashed files, 3 days, ≤ 3,000),
  `relay-first.ts` (≤ 15 min for the relay). `contract/compat.test.ts` pins `LIVE_V`, `LIVE_VS`, `ROOM_PROTOCOL` per `COMPAT`.

After a deploy, *e2e logic full* (`e2e-logic-full.yml`): `e2e-logic` ×6 (every test), `e2e-render` (advisory),
`coverage` (`contract/`, `sync/`, `store/actions.ts`, `store/meals.ts` at 85 % or `scripts/coverage-floors.ts`),
`timings` (`npm run e2e:timings`; `scripts/e2e-missed.ts`). *e2e flake hunt* (nightly): WebKit as an iPhone 15, logic
tier ×3, no retries, failures to the `flake` issue (`scripts/flake-why.ts`).

- **The gate** (`npm run e2e:impact` previews): `e2e/gate.json` (15 stable files); the specs the push **changed**, each
  3× unretried (`chromium-x3`); the specs its files **reach** (a helper's importers, over `MAX_IMPORTERS` 10 or
  fixtures.ts: the gate set; `e2e/impact.json`; specs spelling a changed i18n string). Over `CAP_MS` (~1550 s) reached
  specs drop first, then changed ones run once (also over `MAX_CHANGED` 8).
- **Flakes**: CI `retries: 1`; passing on retry is flaky (`npm run e2e:flakes`). Flaky on 2+ commits in 48 h:
  auto-quarantined out of the gate (max 5, never the gate set) till its spec changes. Locally no retry.
- **Tags**: `@render` drawn only; `@smoke` both; `@quarantine` out of gate and full tier (annotation: owner, why);
  `@logic` never draws; `@chromium` not on WebKit (say why).
- **Logic mode** (`E2E_RENDER=none`, `ui-state/testMode.ts`): engines run, never draw; maps are stubs.
- `BASE_PATH=/x` for build and e2e alike; `csp.spec.ts` fails on any CSP violation; map tiles answered locally.

## CI cost
Queue time is the cost: batch pushes, measure locally. Heavy dispatch-only runs in 02:00–07:00 JST, never 03:00–03:45.

## Run it locally
```sh
cd app && npm run build                                # e2e tests the build
npx playwright install webkit                          # once per Playwright version
npm run e2e -- --project=webkit                        # own port per checkout (E2E_PORT=…)
npm run e2e -- e2e/x.spec.ts --project=webkit --repeat-each=10           # hunt a flake
E2E_RENDER=none npm run e2e -- --project=chromium      # the logic tier
```
`SYNC_PROBE=1 npm run e2e -- e2e/zz-sync-probe.spec.ts` prints `[probe-summary]`, never asserts. Local WebKit loses
WebGL after a test with sound: one worker per test.

## Before you push
1. `npm run verify` (`-- --quick`, `-- --build`): lockfile, `check`, `knip`, vitest, quarantine owners, docs-check
   (rename a heading and its citations together). `.githooks/pre-push` runs it planned by `scripts/verifyPlan.ts`
   (nothing for a verified tree; >50 MB of new blobs needs `BIG_PUSH=1`).
2. Specs, 3D, tent or sync touched: `npm run e2e:ci-like -- --changed` (each test 5×; one failure: fix or quarantine).
3. `npm run push`: rebase, push, again if main moved. Then `gh run watch`, then the full tier.

## Hermetic
Every e2e is sealed (e2e/fixtures.ts header; import Playwright from it). The clock is pinned at `PINNED_DATE`
(Wednesday noon, clear; `?date=` wins; `ownClock`); ambient life off (`ambient: 'on'`, `?awake`); the tests' relay
uses `island.now()` / `rec.now()`. No network (`page.route`; unit: src/no-network.setup.ts), no `Math.random` (pin
`?seed=`…), a context per test, no service workers, silent audio. Island taps are frame-locked (`tapAt`); after a goto
wait with `islandUp`.

## Test mode
`?demo`: made-up rows (`store/demo/`), the hooks; only in the dev server or with `localStorage['e2e.testMode'] = '1'`.
Tests only, never a product feature.

## URL params
Read by `world/devHooks.ts`; dev or test mode only, except `?date`, `?theme`, `?season`.

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
`src/lib/e2e-budgets.test.ts` caps per file (`e2e/budgets.json`): `waits`, `wallClock`, `longTests` (over 30 s),
`textSelectors`. Lower with `UPDATE_BUDGETS=1 npx vitest run src/lib/e2e-budgets`.

## Writing a stable spec
Run a new spec `--repeat-each=10` and its file `--workers=8`. Read and tap in one frame (`tapAt`) or pin the scene;
wait on state (`expect.poll`, `__world.idle()`, `__world3d.camStill()`, `data-*`), never time; step the clock
(`page.clock.install` before the goto, then `runFor`); find by role or test id, never `nth()`; WebKit is the browser
(whole-px scroll, `scrollBy`, no CDP); two phones: `bringToFront()` the acting tab, poll the other; tap a pill only at
rest (`e2e/hud.ts unfoldMenu`); fish via e2e/island.ts `toTheWater`, `castIn`, `reelOnBite`; route failing chunks just
before the tap (`e2e/stale.spec.ts`); phone width 390/393 px; screenshots only under `SHOTS=<dir>`.

## Memory
`e2e/leaks.spec.ts` and `e2e/leaks-sheets.spec.ts` check after round trips and a forced GC that no WebGL context,
listener, timer or editor buffer remains (`e2e/memory.ts`; wait out the warm-up, `warmedUp`; judge 20+ trips). Hunt:
`npm run leak -- <flow> [cycles] --snap`. End renderers with world3d/stage.ts `endRenderer`, maps with
components/map/gl.ts `removeMap`.

## Load budget
`npm run build` ends with `scripts/load-budget.ts`: first load ≤ 375 KB JS and 70 KB CSS gzipped, with no three.js,
MapLibre or feature sheet; precache ≤ 3.6 MB; plus share page, `/gym` and English caps. Timing: [perf.md](perf.md#measuring).

## Unused assets
`npm run unused` (read-only: safe/used/unsure); confirm with `npm run unused:probe -- <port> /tmp/seen.txt` against
`node scripts/serve-build.ts <port>`, then `npm run unused -- --seen=/tmp/seen.txt`.

## The iOS Simulator check (the real target, on the Mac)
`npm run ios:check` (island frames, けんこう, ごはん, errors and shots in `test-results/ios-sim/`) and `npm run ios:indoor`
(tent, houses, museum, shop). On demand.
