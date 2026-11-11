# Performance: budgets, measuring, backlog

The target is the users' iPhone 15 and 16 on Safari. Rendering and timing are judged on the iOS Simulator and the
phones' own `perf.boot` / `perf.sheet` ([observability](observability.md)), never on CI's software GL.

## Budgets
- **Bytes:** gated by the build, the one copy of the numbers: [testing.md "Load budget"](testing.md#load-budget).
- **Startup:** the asleep guest's villager adds nothing to a member's launch: its model after `shown`, no card while
  it loads (Island3D `guestLate`). ごはん: products.json (2.7 MB) only with a search, or a day with a product logged
  (`db.wantMore`); a picture holds its canvas, not its decoded sheet (food/cells.ts).
- **The model:** `npm run bench`, year 3 compacted ≤ 15 ms ([runbook §1](runbook.md#1-deploy-the-ui)).
- **The island's length** (the grid 20 × 156): the ground costs the land's length, not the grid's. The default (57
  rows): fields 8.8 MB / ~105 ms on the Mac, chunks 1.9 MB, 8 bakes. The longest (152 rows): fields 21.6 MB / ~230 ms,
  chunks 4.5 MB (the cache's record ~26 MB). A band (8 tile rows) is 4 draws and one ~2 MB bake target; at most 12 are
  baked (`BAND_BUDGET`, ~24 MB; 20 unbudgeted would be ~39 MB), a band coming into reach taking the farthest one's
  target. Draws and a scroll's frame are the same at either length.
- **The museum** (iPhone 15 viewport, WebKit, everything in; engine.ts): a wall 2-3 draws, a room ~100-230 calls; the
  fossils ~110 calls, ~110k triangles, 3.5 MB in 22 packs; the gallery ~70 calls, 0.8 MB in 4 packs; the sea creatures
  ~130 calls with the aquarium. Each texture decoded and uploaded once however many repeats use it; the warm-up uploads
  every texture (8 every 32 ms) and compiles every room's programs, so a room change compiles nothing (museum.spec
  @render). At rest 0 frames; exhibits step at 30/s while something on screen moves (15/s after 2.5 s with no finger).
- **Frames:** the island at most 30 fps ([design](../design.md#frame-rate)); nothing in the log, the sync or the
  sheets runs per frame.

## Measuring
- **Launch, an A/B on the desktop:** timing is never CI's (the build's budgets are bytes only). `npm run perf:start --
  <port> [runs] [webkit|chromium]` against `node scripts/serve-build.ts <port>`, cold or `WARM=1` (`THROTTLE=4` for
  Chromium; what each run measures and the medians: `scripts/perf-start.ts`'s header). The phone's numbers: the iOS
  Simulator's warm launches (`npm run ios:check -- --boots 8 --url 'http://127.0.0.1:<port>/?demo&checks=0'`) and the
  phones' own `perf.boot`.
- **Sheets:** perf-sheets.ts (tap → dialog shown, content ready, longest frame), interleaved A/B: at the
  `probes` tag ([testing.md](testing.md#run-it-locally)).
- **The phone's engine:** `npm run ios:check` and `ios:indoor` on the iOS Simulator
  ([testing.md](testing.md#the-ios-simulator-check-the-real-target-on-the-mac)); the phones' own numbers:
  `npm run logs -- report` (`perf.boot`, `perf.sheet`).
- **Measured** (the relay's latency from Tokyo, edge NRT; `cd relay && npm run smoke`, `npm run latency`): connect ~65 ms, ping
  RTT median 18–21 ms, partner one-way median 19 ms, a kept intent one way 21–22 ms and its ack 31–33 ms; a notify
  POST → `changed` on both phones median 53–70 ms (the test relay); tap → the partner's villager sets off median
  34–40 ms (`RELAY_E2E=1` sync-harness).
- **The record's size:** `compact.test.ts`'s synthetic year of three people: 49,215 rows, 5.16 MB of JSON
  ([backend](../backend.md#the-record) "Snapshot size"). `npm run bench` (year 3): a poll plus one row → the view in
  3–4 ms, 2–3 ms without the meal log's rows.
- **Traps:**
  1. Headless Chromium draws with SwiftShader, which has no KHR_parallel_shader_compile: its "2 s long task" is
     shader compiles in software. For Chromium timings use `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`.
  2. `?demo` turns on three's shader checks (`renderer.debug.checkShaderErrors`, testMode.ts): ~350 ms of sync
     readbacks a launch that no phone pays. Measure with `&checks=0`.
  3. The first frame has one draw call (the ground); the island as seen is `perf.boot`'s `shown`.

## Backlog (open)
| # | Change | Why / expected gain | Where |
|---|---|---|---|
| B1 | Downscale over-sized model textures at build time (512² → 256² where the model's on-screen footprint allows) | at the island's zoom a model is ~20-200 px; fewer texture pixels to transcode and upload | scripts/world3d-models.ts (`maxTex`) |
| B2 | Bypass GLTFLoader's image path for the WebPs still loaded (`createImageBitmap` on the bufferView's Blob, no object URL or fetch) | ~50 ms of main thread at 4× CPU before C1; now only the WebP fallback and the rooms' own models | world3d/things.ts, villager3d, home |
| B3a | The back pass's flip as a uniform instead of `side` (one program for both passes of `twoPass`) | −7 programs; needs both passes double-sided with a discard by face, and A1 already compiles them off the main thread: check a phone's `perf.boot` `progs` / `appear` first | world3d/sides.ts |
| B5 | `content-visibility: auto` with `contain-intrinsic-size` on long sheet bodies (the meal log's days, ききみみ's lists, the travel guide, the trail list) | less layout and paint on open and scroll | food, kikimimi, travel, hiking components |
| C2 | A processed-model cache in IndexedDB: per model its decoded vertex and index buffers and material parameters, keyed by `MODELS[name].v` and a pipeline version, read in one `getAll` | ~30-50 ms of main thread at 4× (meshopt and JSON parse) and ~70 fewer service-worker round trips; worth it together with C1's cache | world3d/things.ts, home.ts, structure.ts, villager3d.ts |
| C3 | Instead of C2: one packed startup file per build (the default layout's models, meshopt and KTX2), a room-cache asset | one request instead of ~70 | scripts/world3d-models.ts, things.ts, the service worker's classes |
| R3 | Keep the GL renderer, its programs and textures across island ⇄ room | the tent's return is still a 150-170 ms frame at 4× (first draw: upload 41, compile 45; Svelte 111); the ground's second bake is gone (terrain.ts `nhImages`) | world3d/engine.ts, rooms |
| K1 | A ききみみ lesson's clips without their whole packs (a level-4 lesson: 3 packs, 3.5 MB; Pages answers no Range): smaller packs (a unit's review clips in its unit pack) | ~1.2 s on 4G before the first question; owned by the packs' work | kikimimi/packs.ts prefetchClips |
| A1 | Check `perf.sheet` for ききみみ's first tap on a phone: headless Chromium spends 658 ms in `new AudioContext` | if real, create the context at the first tap anywhere | sound/engine.ts #ensure |
| G1 | Reuse placeBody / at / mirror / roundedIn's scratch arrays | 7.9 MB/s of garbage while dragging | world3d |

Not pursued: a launch snapshot and crossfade (declined); the View Transitions API (it snapshots the WebGL canvas and
saves no mount work).
