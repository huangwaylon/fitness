# Performance: budgets, measuring, backlog

The target is the users' iPhone 15 and 16 on Safari. Rendering and timing are judged on the iOS Simulator and the
phones' own `perf.boot` / `perf.sheet` ([observability](observability.md)), never on CI's software GL.

## Budgets
- **Bytes:** gated by the build, the one copy of the numbers: [testing.md "Load budget"](testing.md#load-budget).
- **Startup:** the asleep guest's villager adds nothing to a member's launch: its model after `shown`, no card while
  it loads (Island3D `guestLate`). After a deploy too: the fields come from IndexedDB unless the field code changed
  (`fieldsCache.ts`); the mount waits for the garden's manifest when the island has a garden (else its import
  resolved after the mount's long task: 13-37 garden models after `loaded`, `shown` ~0.8 s later; perf.boot
  `garden`/`farm`); a cold open after a deploy is the cached shell, every chunk its own, the deploy taken at the next
  hide ([backend](../backend.md) "Service worker"; the launch review below). ごはん: products.json (4 MB, 30k) and kalori.json (the
  chain menus) only with a search, or one alone for a day with one of its foods logged
  (`db.wantMore(lazySources(ids))`); a picture holds its canvas, not its decoded sheet (food/cells.ts).
- **ごはん's scanner** ([food-data](../food-data.md#barcodes)): ~400 KB on the wire on the first press (the decoder's
  wasm, its chunk and the level's; carried, never precached), cached after. A frame's band read every 180 ms, the
  decode ~1-3 ms of it; the camera off on every way out (‹, ✕, a hide, a read) and after 60 s without a read
  (タップして再開). The phones' numbers: `perf.scan`, once a session.
- **Warm launch, where it goes** (the phones, 154 launches 11-11..11-14, ms from navigation, p50/p90): mount 519/816
  (~165 modules from the SW cache, parse), first frame 727/1185, loaded 900/1494, shown 1663/2444 (the late garden
  wave included). `net` = 0 in every one proved less than it seemed: a file the service worker answers reads transfer
  size 0 even when the worker fetched it from the network, so it counted only what went past the worker, not the room
  cache's misses (review 11/14 r2: 6 models evicted, `net` 0). Since 0c10c3a20 perf.boot has `swNet`/`swRoom`/`swKB`
  (the worker's own fetches), `pre` (the worker's fetch event to the page's clock: on WebKit the race and the cache
  lookups are before every mark; ~105 ms on desktop WebKit's `skip` launches), `swCold`, `tx`, `lateF`/`lateA`, and a
  warm launch's resource timings hold 1000 entries (they stopped at 250 of ~380); since r3 `warm` also needs `swRoom`
  0 (the report's warm/cold split). Read those before choosing L1 or C2.
- **The model:** `npm run bench`, year 3 compacted ≤ 15 ms ([runbook §1](runbook.md#1-deploy-the-ui)).
- **The island's length:** the ground costs the land's length, not the grid's (default 57 rows: fields ~105 ms on the
  Mac; the longest, 152: ~230 ms). A band (8 tile rows) is 4 draws and one ~2 MB bake target; at most 12 are baked
  (terrain.ts `BAND_BUDGET`), a band coming into reach taking the farthest one's. Draws per frame don't grow with
  length.
- **The museum** (engine.ts): a room ~100-230 draw calls. Each texture is decoded and uploaded once however many
  exhibits use it; the warm-up uploads every texture and compiles every room's programs, so a room change compiles
  nothing (museum.spec @render). At rest 0 frames; exhibits step at 30/s while something moves (15/s after 2.5 s with
  no finger).
- **Frames:** the island at most 30 fps ([design](../design.md#frame-rate)), 12 at rest for the ambience, a bug's fade
  and a character's sparkles, hearts and notes included (things.ts, effects.ts `calm`), the critters' moves once
  untouched 15 s (pace.ts `CRIT_CALM_MS`); the point lights' mask on (bend.ts). Measured on the phones 11-11..11-14:
  15.2 fps at rest time-weighted (a third of the frames at 30: walkers, flourishes, critters); `perf.rest`'s
  `why1`-`why3`, `fx1` and `nd1` (the moving node's tag) name them. A fishing float bobs at the ambience's rate, the
  full rate only for a nibble's dip and from the bite (fishing3d.ts floatWants: a float out was 30 fps, 100 % full; now
  ~13 fps, 10-14 %).
  Nothing in the log, the sync, the clouds or the sheets runs per frame (clouds.ts: no Animation read between steps).
  The phones' rest: `perf.rest` at each hide.

## Measuring
- **Launch, an A/B on the desktop** (never CI's: its budgets are bytes only): `npm run perf:start --
  <port> [runs] [webkit|chromium]` against `node scripts/serve-build.ts <port>`, cold or `WARM=1` (`THROTTLE=4` for
  Chromium; what each run measures and the medians: `scripts/perf-start.ts`'s header). The phone's numbers: the iOS
  Simulator's warm launches (`npm run ios:check -- --boots 8 --url 'http://127.0.0.1:<port>/?demo&checks=0'`) and the
  phones' own `perf.boot`.
- **Sheets:** perf-sheets.ts (tap → dialog shown, content ready, longest frame), interleaved A/B: at the
  `probes` tag ([testing.md](testing.md#run-it-locally)).
- **The phone's engine:** `npm run ios:check` and `ios:indoor` on the iOS Simulator
  ([testing.md](testing.md#the-ios-simulator-check-the-real-target-on-the-mac)); the phones' own numbers:
  `npm run logs -- report` (`perf.boot`, `perf.sheet`).
- **The relay's latency** (from Tokyo, edge NRT): `npm run latency` in `relay/` (ping RTT median ~20 ms, partner one
  way ~19 ms); `npm run smoke`: an ingest → `changed` on both phones; tap → the partner's villager sets off ~35-40 ms
  (`RELAY_E2E=1` sync-harness).
- **The record's size:** [backend](../backend.md#the-record) "Snapshot size".
- **Traps:**
  1. Headless Chromium draws with SwiftShader, which has no KHR_parallel_shader_compile: its "2 s long task" is
     shader compiles in software. For Chromium timings use `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`.
  2. Test mode (`?demo`; the scripts allow it with `e2e.testMode`) turns on three's shader checks (`renderer.debug.checkShaderErrors`, testMode.ts): ~350 ms of sync
     readbacks a launch that no phone pays. Measure with `&checks=0`.
  3. The first frame has one draw call (the ground); the island as seen is `perf.boot`'s `shown`.

## R4: the island without its DOM
The before/after measurements are in R4 step 10's commit (c8d89fb8e). The DOM went; the 3D's cost was unchanged.

## The launch review 11-21: the worker's cache and a deploy's page
The phones (prod log, 7 days, iOS, 121 launches): a cold open 3.3 s p50 / 5.5 s p90 to the island, 28 % of it `pre`
(before the page's clock), mostly the worker's first cache read on a cold start (`swOwn` p50 566 ms on A, 1,970 on B)
over ~4,400 entries; 48 % of launches `shell=net` (a deploy's page under the older worker, its new chunks past its
cache: shown 2,343 vs 1,695 ms). `npm run logs -- report` now prints `pre + island whole` beside `island whole`: warm
2,893 / 5,173 ms p50/p95 against 1,936 / 4,001 (246 launches, the 7 days before this change). Changed:

| What | Before | After |
|---|---|---|
| A deploy's page in the race | booted under the older worker (`net`) | the cached shell (`new`), the deploy at the next hide |
| Older shells kept, a page's build not said (`SHELLS_UNSURE`) | 3 (~550 entries each) | 1 |
| The room cache (`ROOM_CAP_N`, `ROOM_UNUSED_MS`) | bytes only (100 MB): ~1,600 files of ~22 KB | 1,000 files, any file unused 14 d out (never one used within 3 d) |
| Map tiles (`TILE_CAP_N`, bytes) | 800, 60 MB | 300, 30 MB |
| Birthday hats' 2D art | precached | on first use (`isDecorArt`: the 3D draws hats as models) |
| A lowered bound's deletes | all at the next write | at most `EVICT_MAX` (150) a write, none before the launch's end (`hold`); offline, the bytes' bound only |
| もう一度 failing again online | reloaded the app | a data fetch reloads only into a newer deployed build; a module still reloads (WebKit keeps a failed import) (`reloadOnRepeat`) |

Measured on the Mac (load average ~23 throughout, other work on the machine: read the spreads, not the medians alone):
- A cold CacheStorage open + `match` in desktop WebKit, phone B's entries (4,384: 3 shells, room 1,602) against the same
  after these bounds (3,236): median 86-101 → 60-67 ms over two rounds of 9 relaunches (a −30 %; the audit's own
  check: 43 ms at 500 entries, 87 at 4,400). The phone's `swOwn` is 6-20× the Mac's: expect a few hundred ms off B's.
- The phones' own: the deploy is taken by a reload out of sight (`hid`, perf.resume); `Stuck on an old build?` names
  a phone whose deploys don't install (`new` on one build over a day).

## The launch round 11-23: no wait on the network
The worker answers the cached shell at once, the network's page read in the background (`checkShell`): raced
launches paid +130-350 ms p50 `pre`, slow and lie-fi 400. `swOwn` grows with the origin's entries, not the opened
cache's (desktop WebKit: 50 → 7 ms; 50 + 4,000 elsewhere → 520-730). ジム's settings kept and timed out
(`e2e/sw-liefi.spec.ts`). The HUD before the scene (IslandScene its own chunk, preloaded with the page) and the sheets'
chunks from the worker's caches at the island's models in, offline too: e2e/launch-timeline's HUD 40-50 ms sooner
after the paint, the menu answering 16-23 ms after the HUD (was 72-92).

## Fonts as six files
Zen Maru Gothic as our own subsets, three a weight (`scripts/font-subsets.ts`); the before/after numbers are in its
commit (render-blocking CSS 54.8 → 26.3 KB gz, ~120 fewer cache entries).

## Rooms by size
`ios:indoor --room 120 --size 16 --varied` vs 60: calls 124 → 235, `drawMs` 0.72 → 1.45, entry 676 → 1,033 ms (R5).
Switched pieces moving (`tent/toggles.ts` ACTIVE_MAX 4): a resting room with a fan on draws 12 frames a second (24 in
2 s, desktop WebKit and Chromium), ~0.6 ms CPU each; off, none. Glows cost no frame.

## Uses
A use's loop alone: the ambient 12 fps (`e2e/room-use-perf.spec.ts`: 60 pieces, 3 uses: CPU p95 2 ms, `drawMs` ~1.0).
Stood at (cook, read, type; props, steam): 12.3 fps, CPU p95 3 ms.

## Backlog (open)
| # | Change | Why / expected gain | Where |
|---|---|---|---|
| B2 | Bypass GLTFLoader's image path for the WebPs still loaded (`createImageBitmap` on the bufferView's Blob, no object URL or fetch) | ~50 ms of main thread at 4× CPU before the KTX2 textures and their cache (texCache.ts); now only the WebP fallback and the rooms' own models | world3d/things.ts, villager3d, home |
| B3a | The back pass's flip as a uniform instead of `side` (one program for both passes of `twoPass`) | −7 programs; needs both passes double-sided with a discard by face, and the engine's warm-up already compiles them off the main thread (engine.ts, KHR_parallel_shader_compile): check a phone's `perf.boot` `progs` / `appear` first | world3d/sides.ts |
| B5 | `content-visibility: auto` with `contain-intrinsic-size` on long sheet bodies (the meal log's days, the travel guide, the trail list) | less layout and paint on open and scroll | food, travel, hiking components |
| W2 | The room's entries past the new bound, if storage.use `roomN` stays near 1,000: pack the tent's tray icons (room/icons/, 1,204 files, each its own entry: the likely bulk) into packs as the ずかん's are, and English Study's banks (ENGLISH_KEEP 400, `otherN` ~150 now) to ~150 | the origin's entries −500 to −900; a cold worker's first read ~10-20 ms less on the Mac's scale | scripts/room-packs.ts, tent/items.ts, caches.ts |
| W4 | The boot watchdog (bootWatch.ts, `?shell=cache`): only a worker from before 11-21 says `net`; remove it once no perf.boot says `net` for a week | less inline script, one rule less | ui-state/bootWatch.ts, scripts/headers.ts, +layout |
| L1 | (open, the biggest) The phones' late wave: shown − loaded 812 ms p50 / 1209 p90 (602 waiting on models); no Mac has it. Unverified: the worker's thread queueing ~380 cache lookups. Check `pre`, `swNet`, `lateA − lateF`; if so, C3 or the page reading the room cache itself. Since the 11-18 review (P3) `shown` waits for no effect's model (fx/: the flourishes, the stream's floats; `late`/`lastM` leave them out too): before, the maple leaf was the last model in 73 of 111 launches (shown 1950/2690, shown − loaded ~1045 with it last vs 939): compare only launches after | est. −300 to −600 ms of `shown` (unverified) | service-worker, world3d/things.ts |
| C2 | (deferred, measured 11/14) A processed-model cache in IndexedDB: per model its decoded buffers and material parameters, read in one `getAll` | small: fetch + parse of 76 models is 14 ms on desktop WebKit, 77 ms at Chromium 4×; est. 20-60 ms of `loaded` on a phone | world3d/things.ts, home.ts, structure.ts, villager3d.ts |
| C3 | One packed startup file per build (the default layout's models, meshopt and KTX2), a room-cache asset | one request instead of ~70: L1's lever if the worker's queue is the cause | scripts/world3d-models.ts, things.ts, the service worker's classes |
| R5 | Full room: instance repeats | fewer calls, a shorter entry | tent/engine.ts |
| R3 | Keep the GL renderer, its programs and textures across island ⇄ room | the tent's return is a 150-170 ms frame at 4× (upload 41, compile 45, Svelte 111) | world3d/engine.ts, rooms |
| A1 | Check `perf.sheet` for a sheet's first tap that starts sound on a phone: headless Chromium spends 658 ms in `new AudioContext` | if real, create the context at the first tap anywhere | sound/engine.ts #ensure |
| G1 | Reuse mirror's and roundedIn's scratch arrays (the camera's `at` already does) | 7.9 MB/s of garbage while dragging (measured before R4, with the DOM projector) | world3d |

Not pursued: a launch snapshot and crossfade (declined); the View Transitions API (it snapshots the WebGL canvas and
saves no mount work); merging the ~50 small launch chunks (measured 11/14, a `codeSplitting` group: mount −16 ms on
desktop WebKit, but the components' CSS split from 23 files to 49 and first-load CSS 60 → 109 KB gz, past the budget;
worth retrying with CSS kept out only if L1 shows request count matters).
