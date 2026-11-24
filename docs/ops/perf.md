# Performance: budgets, measuring, backlog

The target is iPhone 15 and 16 Safari. Rendering and timing are judged on the iOS Simulator and the phones' own
`perf.boot`, `perf.sheet`, `perf.rest`, `perf.scan` ([observability](observability.md)), never on CI's software GL.

## Budgets
- **Bytes**: enforced by the build: [testing.md "Load budget"](testing.md#load-budget).
- **Startup**: the asleep guest's villager loads after `shown` (Island3D `guestLate`); fields and the ground's bands come from
  IndexedDB unless the field code changed (`fieldsCache.ts`); the last launch's GPU programs are linked right after
  the first frame, before the models (`progCache.ts`, per build; perf.boot `progPre`/`progHit`/`prog`); a cold open after a deploy is the cached shell, the deploy taken at the next
  safe moment ([backend](../backend.md) "Service worker", whose table holds the cache bounds). The island is held till its
  first placing is in (engine.ts `launchHeld`; let go once models stall 400 ms); an unanswered file is given up after
  5 s (fetchBytes.ts).
- **ごはん**: products.json and kalori.json load only with a search or a logged food from them
  (`db.wantMore(lazySources(ids))`); a picture holds its canvas, not its decoded sheet (food/cells.ts). The first open never waits on the
  pictures' index: `food/images.ts` keeps each looked-up cell; `components/food/prime.ts` looks up the day's foods
  (everyone's, recipe ingredients too) and fetches their sheets at idle after launch and on every return; the index
  loads only ~600 ms after open (`OPEN_MS`, `dbHold.svelte.ts`) when something on screen is unknown. The scanner
  ([food-data](../food-data.md#barcodes)): ~400 KB on its first press, carried, never precached; a band read every
  180 ms; the camera off on every exit and after 60 s without a read.
- **The model**: `npm run bench`, year 3 compacted ≤ 15 ms ([runbook §1](runbook.md#1-deploy-the-ui)).
- **The island's length**: the ground costs the land's length; a band (8 tile rows) is 4 draws and a ~2 MB bake target,
  at most 12 baked (terrain.ts `BAND_BUDGET`). Draws per frame don't grow with length.
- **Frames**: at most 30 fps ([design](../design.md#frame-rate)), 12 at rest (things.ts, effects.ts `calm`), critters
  calm after 15 s untouched (pace.ts `CRIT_CALM_MS`); a fishing float bobs at the rest rate except a nibble and bite
  (fishing3d.ts `floatWants`). Nothing in the log, sync, clouds or sheets runs per frame. `perf.rest`'s `why1`-`why3`,
  `fx1`, `nd1` name what kept the island awake.
- **The museum** (engine.ts): ~100-230 draw calls a room; every texture uploaded and every room's programs compiled in
  the warm-up, so a room change compiles nothing; 0 frames at rest, 30/s while something moves.

## Measuring
- **Launch A/B on the desktop**: `[WARM=1] npm run perf:start -- <port> [runs] [webkit|chromium]` against `node
  scripts/serve-build.ts <port>` (`THROTTLE=4` for Chromium; `scripts/perf-start.ts` header). Phone-like: the iOS
  Simulator's warm launches, `npm run ios:check -- --boots 8 --url 'http://127.0.0.1:<port>/?demo&checks=0'`
  ([testing.md](testing.md#the-ios-simulator-check-the-real-target-on-the-mac)).
- **The phones**: `npm run logs -- report` in `relay/` (`perf.boot` with `pre`, `swNet`, `swRoom`, `lateA`/`lateF`;
  `perf.sheet`; `pre + island whole`; a deploy's new worker beside the launch `swi`/`swiMs` and the app's last file
  before the mount `chunkEnd`/`chunkN`: the report's `warm, new worker beside` rows; a resume's `app.show` `f1`/`ms`).
  `data` (the record from IndexedDB) is read from hooks.client.ts on (sync/cacheEarly.ts), before the layout runs.
- **Sheets**: perf-sheets.ts at the `probes` git tag ([testing.md](testing.md#run-it-locally)).
- **The relay**: `npm run latency` in `relay/` (ping ~20 ms from Tokyo); `npm run smoke` (an ingest → `changed` on both
  phones). The record's size: [backend](../backend.md#the-record) "Snapshot size".
- **Traps**: headless Chromium's SwiftShader compiles shaders in software (use `--use-angle=metal --enable-gpu
  --ignore-gpu-blocklist`); test mode turns on three's shader checks (testMode.ts, ~350 ms a launch): measure with
  `&checks=0`; the first frame is only the ground, the island as seen is `perf.boot`'s `shown`.

## Rooms by size
`ios:indoor --room 120 --size 16 --varied` vs 60 pieces: draw calls 124 → 235, `drawMs` 0.72 → 1.45, entry 676 →
1,033 ms. Switched pieces moving are capped (`tent/toggles.ts` `ACTIVE_MAX` 4); a room with a fan on draws 12 fps,
~0.6 ms CPU each; glows cost no frame.

## Uses
A use's loop alone stays at the ambient 12 fps (`e2e/room-use-perf.spec.ts`: 60 pieces, 3 uses, CPU p95 2 ms).

## Backlog (open)
| # | Change | Why | Where |
|---|---|---|---|
| L1 | The phones' late wave (shown − loaded ~800 ms p50, none on a Mac); check `pre`, `swNet`, `lateA − lateF` | biggest open win | service worker, world3d/things.ts |
| C3 | One packed startup file per build (default layout's models) | one request, not ~70, if L1 is queueing | scripts/world3d-models.ts |
| W2 | Pack the tent's tray icons (room/icons/) as the ずかん's are | fewer cache entries, faster cold worker | scripts/room-packs.ts, caches.ts |
| W4 | Remove the boot watchdog once no `perf.boot` says `net` for a week | less inline script | ui-state/bootWatch.ts |
| R3 | Keep the GL renderer across island ⇄ room | the tent's return frame (~150 ms at 4× CPU) | world3d/engine.ts |
| R5 | Instance repeats in a full room | fewer calls | tent/engine.ts |
| B2 | `createImageBitmap` for the remaining WebP textures | ~50 ms main thread | world3d/things.ts |
| B3a | Back pass flip as a uniform (one program for `twoPass`) | −7 programs | world3d/sides.ts |
| B5 | `content-visibility: auto` on long sheet bodies | layout and paint | food, travel, hiking |
| A1 | Check a sheet's first sound tap in `perf.sheet` (`new AudioContext` slow in Chromium) | maybe a faster first tap | sound/engine.ts |
| G1 | Reuse mirror's and roundedIn's scratch arrays | garbage while dragging | world3d |

Not pursued: a launch snapshot (declined); View Transitions (snapshot the canvas, save no work); merging the small
launch chunks (CSS past the budget); an IndexedDB processed-model cache (C2: a bulk read cost more than fetch + parse).
