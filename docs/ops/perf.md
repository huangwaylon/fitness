# Performance: budgets, measuring, backlog

The target is iPhone 15 and 16 Safari, judged on the iOS Simulator and the phones' own `perf.boot`, `perf.sheet`,
`perf.rest`, `perf.scan` ([observability](observability.md)), never on CI's software GL.

## Budgets
- **Bytes**: enforced by the build ([testing.md "Load budget"](testing.md#load-budget)).
- **Startup**: the asleep guest's villager loads after `shown` (`guestLate`); fields and ground bands come from
  IndexedDB (`fieldsCache.ts`); the last launch's GPU programs link right after the first frame (`progCache.ts`;
  `progPre`/`progHit`/`prog`); a cold open after a deploy is the cached shell ([backend](../backend.md) "Service
  worker"). The island is held till its first placing is in (`launchHeld`; let go after a 400 ms stall); a file
  unanswered for 5 s is given up (fetchBytes.ts).
- **ごはん**: products.json and kalori.json load only for a search or a logged food from them (`db.wantMore`); a picture
  holds its canvas, not the sheet (food/cells.ts). `components/food/prime.ts` fetches the day's pictures' sheets at idle;
  the index loads ~600 ms after open only when something shown is unknown (`OPEN_MS`). The scanner: ~400 KB on first
  press, never precached, a read every 180 ms, the camera off on exit and after 60 s idle.
- **The model**: `npm run bench`, year 3 compacted ≤ 15 ms.
- **The island's length**: a band (8 tile rows) is 4 draws and a ~2 MB bake target, ≤ 12 baked (terrain.ts
  `BAND_BUDGET`); draws per frame don't grow with length.
- **Frames**: ≤ 30 fps ([design](../design.md#frame-rate)), 12 at rest (`calm`), critters calm after 15 s
  (`CRIT_CALM_MS`), a float bobs at the rest rate but for a bite (`floatWants`). Nothing runs per frame in the log,
  sync, clouds or sheets. `perf.rest`'s `why1`-`why3`, `fx1`, `nd1` name what kept the island awake.
- **The museum**: ~100–230 draw calls a room; every texture and program warmed up, so a room change compiles nothing;
  0 fps at rest.

## Measuring
- **Launch A/B on the desktop**: `[WARM=1] npm run perf:start -- <port> [runs] [webkit|chromium]` against `node
  scripts/serve-build.ts <port>` (`THROTTLE=4` for Chromium). Phone-like: `npm run ios:check -- --boots 8 --url
  'http://127.0.0.1:<port>/?demo&checks=0'`.
- **The phones**: `npm run logs -- report` in `relay/` (`perf.boot`'s `pre`, `swNet`, `swRoom`, `lateA`/`lateF`,
  `swi`, `chunkEnd`; `perf.sheet`; `app.show`).
- **Sheets**: perf-sheets.ts at the `probes` git tag. **The relay**: `npm run latency` (~20 ms from Tokyo), `npm run
  smoke`. The record's size: [backend](../backend.md#the-record) "Snapshot size".
- **Traps**: headless Chromium compiles shaders in software (`--use-angle=metal --enable-gpu --ignore-gpu-blocklist`);
  test mode adds three's shader checks (~350 ms): measure with `&checks=0`; the island as seen is `perf.boot`'s `shown`.

## Rooms by size
120 pieces vs 60 (`ios:indoor --room 120 --size 16 --varied`): draw calls 124 → 235, `drawMs` 0.72 → 1.45, entry 676 →
1,033 ms. Moving switched pieces capped (`ACTIVE_MAX` 4); a room with a fan on draws 12 fps.

## Uses
A use's loop stays at 12 fps (`e2e/room-use-perf.spec.ts`: 60 pieces, 3 uses, CPU p95 2 ms).

## Backlog (open)
| # | Change | Why | Where |
|---|---|---|---|
| L1 | The phones' late wave (shown − loaded ~800 ms p50) | biggest open win | service worker, world3d/things.ts |
| C3 | One packed startup file (default layout's models) | one request, not ~70 | scripts/world3d-models.ts |
| W2 | Pack the tent's tray icons | faster cold worker | scripts/room-packs.ts |
| W4 | Remove the boot watchdog once no `perf.boot` says `net` for a week | less inline script | ui-state/bootWatch.ts |
| R3 | Keep the GL renderer across island ⇄ room | ~150 ms return frame | world3d/engine.ts |
| R5 | Instance repeats in a full room | fewer calls | tent/engine.ts |
| B2 | `createImageBitmap` for the remaining WebP textures | ~50 ms main thread | world3d/things.ts |
| B3a | Back pass flip as a uniform | −7 programs | world3d/sides.ts |
| B5 | `content-visibility: auto` on long sheet bodies | layout and paint | food, travel, hiking |
| A1 | Check a sheet's first sound tap in `perf.sheet` | maybe a faster first tap | sound/engine.ts |
| G1 | Reuse mirror's and roundedIn's scratch arrays | garbage while dragging | world3d |

Not pursued: a launch snapshot; View Transitions; merging the small launch chunks; a processed-model IndexedDB cache.
