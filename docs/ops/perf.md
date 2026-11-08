# Performance: budgets, measuring, backlog

The target is the users' iPhone 15 and 16 on Safari. Rendering and timing are judged on the iOS Simulator and the
phones' own `perf.boot` / `perf.sheet` ([observability](observability.md)), never on CI's software GL.

## Budgets
- **Bytes, gated by the build** ([testing.md](testing.md#load-budget)): the first load ≤ 400 KB of JS and 70 KB of CSS
  gzipped (none of it three.js, MapLibre or a sheet), the service worker's precache ≤ 3 MB on the wire, the ききみみ
  budget (`scripts/kikimimi-budget.ts`), Pages' file cap (`static-files.test.ts`).
- **The model:** `npm run bench`, year 3 compacted ≤ 15 ms ([runbook §1](runbook.md#1-deploy-the-ui)).
- **Frames:** the island at most 30 fps ([design](../design.md#frame-rate)); nothing in the log, the sync or the
  sheets runs per frame.

## Measuring
- **Launch, an A/B on the desktop:** `npm run perf:start -- <port> [runs] [webkit|chromium]` against
  `node scripts/serve-build.ts <port>` (cold, or `WARM=1`); the how-to: [testing.md](testing.md#load-budget).
- **Sheets:** `npm run perf:sheets` (tap → dialog shown, content ready, longest frame), interleaved A/B.
- **The phone's engine:** `npm run ios:check` and `ios:indoor` on the iOS Simulator
  ([testing.md](testing.md#the-ios-simulator-check-the-real-target-on-the-mac)); the phones' own numbers:
  `npm run logs -- report` (`perf.boot`, `perf.sheet`).
- **Traps:**
  1. Headless Chromium draws with SwiftShader, which has no KHR_parallel_shader_compile: its "2 s long task" is
     shader compiles in software. For Chromium timings use `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`.
  2. `?demo` turns on three's shader checks (`renderer.debug.checkShaderErrors`, testMode.ts): ~350 ms of sync
     readbacks a launch that no phone pays. Measure with `&checks=0`.
  3. The first frame has one draw call (the ground); the island the user sees is `perf.boot`'s `shown`.

## Backlog (open)
| # | Change | Why / expected gain | Where |
|---|---|---|---|
| B1 | Downscale over-sized model textures at build time (512² → 256² where the model's on-screen footprint allows) | at the island's zoom a model is ~20-200 px; fewer texture pixels to transcode and upload | scripts/world3d-models.ts (`maxTex`) |
| B2 | Bypass GLTFLoader's image path for the WebPs still loaded (`createImageBitmap` on the bufferView's Blob, no object URL or fetch) | ~50 ms of main thread at 4× CPU before C1; now only the WebP fallback and the rooms' own models | world3d/things.ts, villager3d, home |
| B3a | The back pass's flip as a uniform instead of `side` (one program for both passes of `twoPass`) | −7 programs; needs both passes double-sided with a discard by face, and A1 already compiles them off the main thread: check a phone's `perf.boot` `progs` / `appear` first | world3d/sides.ts |
| B5 | `content-visibility: auto` with `contain-intrinsic-size` on long sheet bodies (the meal log's days, ききみみ's lists, the travel guide, the trail list) | less layout and paint on open and scroll | food, kikimimi, travel, hiking components |
| C2 | A processed-model cache in IndexedDB: per model its decoded vertex and index buffers and material parameters, keyed by `MODELS[name].v` and a pipeline version, read in one `getAll` | ~30-50 ms of main thread at 4× (meshopt and JSON parse) and ~70 fewer service-worker round trips; worth it together with C1's cache | world3d/things.ts, home.ts, structure.ts, villager3d.ts |
| C3 | Instead of C2: one packed startup file per build (the default layout's models, meshopt and KTX2), a room-cache asset | one request instead of ~70 | scripts/world3d-models.ts, things.ts, the service worker's classes |
| SW | After registration, warm `island-room-v1` with the startup models in the background | a first visit fetches them before the worker exists, so the first warm launch still goes to the network for them | service-worker/, swLate.ts |

Not pursued: a launch snapshot and crossfade (declined); the View Transitions API (it snapshots the WebGL canvas and
saves no mount work).
