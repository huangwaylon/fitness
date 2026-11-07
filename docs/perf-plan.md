# Island Fund: warm start and sheet transitions, performance plan (2026-11-08)

Measured on origin/main 2e03a0f7, built in a scratch copy (/tmp, now deleted) with timing marks added there only.
Engines: desktop WebKit as an iPhone 15 (Playwright), the **iOS 26.5 Simulator's Safari** (iPhone 17 Pro, over
safaridriver; the Mac's CPU and GPU, so faster than a phone but WebKit/iOS behaviour is real), and Chromium as an
iPhone 13 at 4x CPU on **ANGLE Metal** (a stand-in for phone CPU speed). Each run was `?demo&date=2026-11-04T12:00`, warm
with the service worker installed and its caches full, unless marked cold.

The launch snapshot is dropped (the user said no).

## 0. Two measurement traps (fix these before trusting any A/B)

1. **The "2 s long task" comes from SwiftShader.** Headless Chromium uses SwiftShader by default, which has no
   KHR_parallel_shader_compile. In that 2 s task, 1.8 s is native time spent waiting on the GPU process to compile
   shaders in software. On Apple GPUs (Chromium with ANGLE Metal, and WebKit) the longest startup task is 124-136 ms at
   4x CPU. Earlier reviews that put 77% of startup in shader compiles were measuring SwiftShader. perf:start in Chromium
   needs `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`.
2. **`?demo` switches on `renderer.debug.checkShaderErrors`** (testMode.ts `shaderChecks`). Each program then gets a
   blocking `getProgramInfoLog`/`getShaderInfoLog` on first use. In the Simulator that was **338-385 ms of extra
   blocking** per warm start (41 calls). Real users never pay it, but perf:start and ios:check both run `?demo`. Add a
   `?checks=0` override for perf runs (in scratch I used `&nochecks`). All numbers below are without the checks.
3. A smaller one: perf:start's "first frame" (`frames > 0`) is a frame with **1 draw call**: the sky or ground, with 50
   models still loading. The island the user actually sees arrives at `loaded()`. Add a "first full frame" mark: loaded
   and nothing held back.

## 1. Warm start, measured

### iOS Simulator, warm (SW controls the page, caches full), ms from navigation start

| Step | warm (typical) | notes |
|---|---|---|
| HTML from the SW (`responseEnd`) | 8-13 | 3 of ~12 runs took **~1020 ms** here (SW wake-up?); check on a phone |
| Entry JS evaluated, layout script runs | 78-103 | 116 JS files, all from the SW cache; the last one ends at 265-400 |
| Page mounts, data ready (demo backend) → Island3D onMount | 126-163 | real users read IndexedDB here (live.ts loadCache); the relay is never awaited |
| Wait for the worker's ground fields (`fieldsSoon`, up to 300 ms) | **75-140** | on the critical path, before the WebGL context exists |
| `mount()`: renderer, ground build and GPU bake (ground 35-40) | 46-51 | |
| First frame | 305-387 | 1 draw call; 15 programs; 50 models pending |
| Models: 71 GLBs (1.5 MB) from the SW room cache, parsed (`place()` async) | 180-230 (wall) | done by about 500 |
| **The frame where models appear: one render() of 255-533 ms** | ends 513-1016 | = `loaded()`; median about 900 |
| Follow-up frames (fx warm-up, shadows, critters) | 60-140 each | about 1.0-1.3 s after start |
| Programs | 15 → 36 at loaded → 54 by 10 s | 26-31 compile passes after load |

Cold in the Simulator (nothing cached): first frame 452-738 ms, loaded 1103-1402 ms.

Desktop WebKit warm: first frame 293-308 ms, loaded 406-462 ms, longest frame 53-85 ms (also the models' first render).
Chromium 4x on Metal, warm: first frame 719-730 ms, loaded 1169-1197 ms, long tasks 124 ms (app JS evaluation), 136 ms
(mount and ground), 61 ms and 92 ms.

### What is inside the 255-533 ms frame (the main warm-start cost)

WebGL calls instrumented in the Simulator:

- `getProgramParameter(ACTIVE_UNIFORMS)`: **270-416 ms over 41 calls, the longest single call 111-186 ms.** This is
  three's first use of each program (`getUniforms`). KHR_parallel_shader_compile **is** present on iOS WebKit: about
  210 COMPLETION_STATUS polls return false, and `hold()` waits on them correctly. But each sync call blocks until the
  GPU process has drained its whole queue, and that queue holds everything sent before it.
- `texSubImage2D`: 205-232 ms of main-thread time; 186 textures; 190 `generateMipmap`.
- 151 `createImageBitmap` decodes, which queue up (10-33 s of summed async time).

A/B tests on the same frame (Simulator, warm):

| Variant | Longest frame | loaded |
|---|---|---|
| baseline | 255-533 | 513-1016 |
| `points=0` (no point lights) | 108-342 | no better |
| `shadows=0` | 287-348 | no better |
| **model textures stripped** | **85-115** | **524** (warm1) |

**So the stall is texture work, not shader complexity.** Model textures: 140 embedded WebP images, 432 KB on disk, but
**6.84 MPx: about 36 MB as RGBA8 with mips**. Most are small (42 at 128², 26 at 64²); 11 are 512², 35 are 256².

Chromium 4x, main thread between the first frame and loaded():
- three core 91 ms
- GLTFLoader and meshopt 31 ms
- **Blob plus createObjectURL 55 ms**: GLTFLoader's image path, which goes bufferView → Blob → object URL → fetch → ImageBitmap
- fetch 19 ms
- texture upload 29 ms
- shader-related 27 ms

Before the first frame: 254 ms of app JS and Svelte mounting, including **23 ms of forced layout from getBoundingClientRect**.

### Shader programs: the 54 grouped by what makes them differ (scene traversal at 10 s, 346 materials)

- Lambert things: `bend`, double-sided, instanced. Three variants: map+emissiveMap (44 materials), the same plus
  alphaTest (38), no map (1).
- **Back/front pairs from twoPass (sides.ts): 7 pairs = 14 programs.** These are #19/20, #21/22, #31/32 (curtain),
  #49/50, #51/52 (fade), #29/30 and #44/45 (basic).
- Map vs no-map and emissiveMap vs none split otherwise identical programs: #1/#5 (`wash`), #2/#7, #17/#27/#28, #36/#40,
  #25/#39.
- Depth (shadow) programs: #33, #34, #35, #53, plus 17 materials not compiled yet. These come with the castShadow and
  fade variants.
- Skinned player and villager programs: about 9 (body, tops ×3, cap, accessory, cheek, eye). They split on the same
  map / alphaTest / transparent / mask lines.
- ShaderMaterials: sea, water, falls, halo, pool and precip, 8 or more programs. Precip and halos compile on first show.

**Mergeable: about 54 → 36.**
- The back pass's flip becomes a uniform instead of `side` (−7).
- Every Lambert or Basic material gets a map and an emissiveMap, using shared 1×1 white and black textures (−6 to −8).
- The depth programs get the same treatment (−2 or −3).

AlphaTest should stay its own variant: discard turns off Apple's hidden-surface removal.

The A/B tests show program count is **not** the warm-start bottleneck in the Simulator. It may matter more on an A16's
Metal compiler. Needs a real-phone check.

### Data hydration, critters, NPCs, sound
- The island renders from IndexedDB before the relay answers (live.ts `loadCache`, then a welcome wait of up to 2 s
  that never blocks rendering). **Rendering from local state before the relay is already done.** It couldn't be timed
  without real keys; add a mark.
- localStorage: 70 reads at startup, under 1 ms in total.
- Critters wait until 3 s. Villager GLBs load on demand. Sound starts after `whenIdle`. Fx warm-up starts 400 ms after
  `place()`. None of these are on the critical path. Only the fx warm-up and shadows show up, as the 60-140 ms
  follow-up frames.

## 2. Sheet transitions, measured

Timed from the tap to `dialog[open]`. That includes **the deliberate 90 ms `later(go, 90)`** in HudMenu `pick`,
HudFood and HudHealth. "Settled" is the last DOM change inside the dialog. "Blocked" is frame time over 16.7 ms between
the tap and settling.

### iOS Simulator, warm

| Sheet | First open: open / settled / blocked | Loaded on first open | Repeat open: open / settled / blocked |
|---|---|---|---|
| ごはん | 119 / **594** / 62 | **14 JSON files, 5.7 MB** (food DB) plus 8 JS | 128 / 128 / 27 |
| けんこう | 120 / 144 / 38 | 2 JS (HealthSheet → Health waterfall) | 117 / 117 / 25 |
| トレイル | 147 / 147 / **86** | 7 JS, 7 photos | 113 / 113 / 45 |
| りょこう | 121 / 121 / 18 | 4 JS | 108 / 108 / 0 |
| けっこんしき | 128 / 128 / 20 | 1 JS, hero image | 110 / 110 / 0 |
| ききみみ | **202 / 350** / 0 | **49 JS, 15 CSS, a 646 KB pack** | 102 / 301 / 0 |

### Chromium 4x on Metal, warm (phone-speed CPU)

| Sheet | First open | Repeat open |
|---|---|---|
| ごはん | settled **1168 ms**, with a **575 ms long task** (the food JSON parse and indexing) | still 83-117 ms frames (Food is rebuilt) |
| トレイル | a 217 ms frame | |
| りょこう | a 117 ms frame | |
| ききみみ | opens at 240 ms, with 83 ms frames | |

### Where an open's frames go (desktop WebKit, so roughly ×3 on a phone)

- **`popFrom()` writes `--pop-x`/`--pop-y` on `:root`**: a full-document style recalc of **15-22 ms**. The document
  has 857 elements, 600 of them in the island.
- **`.if-scene[data-sheet] *` pause rule** (tokens.css:269), a universal selector over the island: **5-8 ms**.
- `showModal` plus the dialog's layout: 8 ms.
- The open animation (`pop`, 280 ms) is already transform and opacity only. backdrop-filter is used only by ききみみ's
  Sandwich. The pop animation itself ran at 15-19 frames per 300 ms, so it is fine.

### Root causes for sheets
1. Nothing is prefetched before the tap.
2. Two-step chunk waterfalls: FoodSheet → Food, HealthSheet → Health, ききみみ → Hub and pages. Content mounts
   mid-animation.
3. ごはん loads and parses 5.7 MB of food JSON on the main thread on first open whenever a meal has entries (FoodMeal
   `foodDb()`), and later another 2.6 MB `products.json`.
4. `Sheet.svelte` wraps its contents in `{#if open}`, so **every repeat open rebuilds** Food, Health, TripView,
   MapLibre and the ききみみ game.
5. Two whole-document style recalcs at the moment of opening.
6. The 90 ms delay plus the 280 ms zoom means **at least 370 ms** before a sheet is fully up.
7. りょこう, けっこんしき and トレイル keep the island rendering while their chunk loads: `open` flips only after the
   import resolves.

## 3. Root causes, ranked by user-visible cost

1. **Warm start: model textures uploaded all in one frame** (140 decodes, 186 RGBA uploads with mip generation, about
   36 MB). The sync program first-use waits drain that queue: a **255-533 ms freeze in the Simulator** (more on an A16)
   just as the island appears.
2. **ごはん's 5.7 MB JSON on the main thread** at first open: 575 ms long task at 4x CPU.
3. **Sheets rebuilt on every open, with no prefetch, plus content waterfalls.**
4. **Ground fields worker wait** before the WebGL context: 75-140 ms in the Simulator, about 200 ms on a phone by the
   code's own comment.
5. **Style recalcs at open** (root variable plus the universal pause selector), and the deliberate 90 ms delay.
6. Program count (54) and its variants: secondary in the Simulator; check on a phone.
7. GLTFLoader's Blob/objectURL churn (55 ms at 4x) and 71 separate GLB requests through the SW.

## 4. Plan, in priority order

Effort: S < 1 day, M 1-3 days, L > 3 days. "Phone" means a real iPhone 15/16 check is needed (the Simulator uses the
Mac's GPU and CPU). "SW" means the item depends on, or should be coordinated with, fitness-df's service-worker work.

### Do first
| # | Change | Expected gain | Effort / risk | Files | Checks |
|---|---|---|---|---|---|
| A1 | **Staged texture upload in `hold()`**. Before an object is shown, `renderer.initTexture()` its textures under a per-frame budget (about 6-8 ms, or N per frame). Hold the object until its textures are uploaded and its programs are ready. Then **prime each program's first use** (`renderer.properties.get(m).currentProgram.getUniforms()`) one per frame, between frames, so the sync wait happens while the queue is empty. Optionally fade models in over 150 ms. | The 255-533 ms freeze becomes frames of about 50 ms or less; models appear over about 10-20 frames. Time to everything shown is about the same or better. | M / low-medium (pop-in order; the "lights never pop" rule doesn't apply to models) | world3d/engine.ts (`hold`), things.ts | phone |
| A2 | **Cache the ground fields per layout** (IndexedDB, key = hash(layout) + FIELDS_VERSION). On a hit, `mount()` doesn't wait for the worker. | −75-140 ms (Simulator), about −200 ms (phone) before the first frame | S / low | layout/fieldsPrime.ts, Island3D.svelte (`fieldsSoon`), sync/cache.ts-style IndexedDB helper | phone |
| A3 | **Prefetch sheet chunks after the island loads**, once the SW controls the page. `import()` FoodSheet+Food, HealthSheet+Health, Travel, Wedding, Hiking, KikimimiSheet+Hub, one per idle slot (`requestIdleCallback`; on Safari, `setTimeout` 200 ms apart). Also start loading on `pointerdown`. | First open: no chunk wait (ききみみ 49 files about −100-200 ms; トレイル and けんこう −15-50 ms) and no waterfall | S / low (memory: about 600 KB of code parsed early) | island/Hud.svelte, HudMenu.svelte, ui-state/lazySheet.svelte.ts, a new ui-state/prefetch.ts | SW: start after registration and `controller` (swLate.ts) |
| A4 | **Move ごはん's food DB out of the open path.** Store what the log shows (name, image key, kcal, PFC) in each entry so a meal renders without the DB. Load and parse the DB in a **Web Worker** (fetch, `JSON.parse`, the index), and only when search or detail needs it. | ごはん first open about −500-1000 ms on a phone (the 575 ms long task at 4x) | M / medium (data shape, older entries) | food/load.ts, components/food/foodUi.ts, FoodMeal.svelte, Food.svelte | phone |
| A5 | **Keep sheet contents mounted after close.** Replace Sheet's `{#if open}` with mounted-but-closed: `content-visibility: hidden` plus `inert` once the sheet has been opened. Keep an LRU of the last 2-3 sheets; MapLibre gets `removeMap` only on eviction. | Repeat opens near 0 ms of mount work (ごはん 83-117 ms frames at 4x, トレイル 45 ms in the Simulator → about 0) | M / medium (memory on iOS, ききみみ's `packs.clear()`, focus handling, effects that assume a remount) | ui/Sheet.svelte, kikimimi/KikimimiSheet.svelte, travel/map/remove.ts | phone memory (jetsam) |
| A6 | **Cheaper open path.** (a) Set `--pop-x`/`--pop-y` on the dialog, not `:root`. (b) Replace `.if-scene[data-sheet] *` with `visibility: hidden` (or `content-visibility: hidden`) on `.if-scene` and the canvas **after** the open animation ends, for full opaque sheets: nothing behind the sheet is styled or composited. (c) Flip `paused` at the tap for りょこう, けっこんしき and トレイル too. | −20-30 ms per open on desktop WebKit, so about −60-100 ms on a phone, at the very start of the animation | S / low (popFrom also serves the zukan and settings) | island/popFrom.ts, ui/Sheet.svelte, styles/tokens.css, IslandScene.svelte, routes/+page.svelte | phone (feel) |
| A7 | **Mount first, then animate; drop the fixed 90 ms.** Overlap the press feedback with mounting (start on `pointerdown`, open as soon as the content is ready). Import Food/Health/Hub statically inside their sheet chunk, so the first animation frame has content. | −90 ms perceived on every open; no content popping in mid-zoom | S / low | HudMenu.svelte, HudFood/HudHealth.svelte, food/FoodSheet.svelte, health/HealthSheet.svelte | phone (feel) |

### Next
| # | Change | Expected gain | Effort / risk | Files | Checks |
|---|---|---|---|---|---|
| B1 | **Downscale over-sized model textures at build time.** At the island's zoom 1-3.2, a model is about 20-200 px on screen; take 512² to 256² wherever the model's footprint allows. | About −30-50% texture pixels (11×512² is about 2.9 of the 6.84 MPx) | S-M / low (zoom-in look) | scripts/world3d-models.ts, static/room/world3d | phone visual |
| B2 | **Bypass GLTFLoader's image path.** A loader plugin that does `createImageBitmap(new Blob([view]), {premultiplyAlpha:'none', colorSpaceConversion:'none'})` directly, with no object URL and no fetch. | About −50 ms main thread at 4x | S / low | world3d/things.ts (and villager3d, home) | |
| B3 | **Merge shader variants (54 → about 36).** (a) Back-pass flip as a uniform. (b) Shared 1×1 map/emissiveMap defaults. (c) Matching depth programs. Then precompile the known set right after the first frame with `renderer.compileAsync(scene)` using a placeholder scene, the island's lights and fog, and precip and halos made visible for the compile. Hidden meshes and first-show precip currently compile late. | Fewer link stalls and later hitches (26-31 compile passes after loaded); bigger on an A16 if Metal compiles are slow | M / medium (look parity) | world3d/sides.ts, bend.ts, things.ts, precip.ts, lights.ts, engine.ts | phone (compile times) |
| B4 | **Startup telemetry.** Log boot marks (first frame, first full frame, loaded, longest frame, ACTIVE_UNIFORMS wait) and each sheet's open and settle times to IslandLog. | Real iPhone numbers to decide B3, C1 and C2 | S / none | sync/log.ts, Island3D.svelte, ui/Sheet.svelte | needed to verify every "phone" item |
| B5 | `content-visibility: auto` with `contain-intrinsic-size` on long sheet bodies (food log days, the ききみみ lists, travel guide sections, the trail list). | Less layout and paint on open and scroll for long content | S / low | food, kikimimi, travel, hiking components | |

### Larger (caching processed assets: the user said yes)
| # | Change | Expected gain | Effort / risk | Files | Checks |
|---|---|---|---|---|---|
| C1 | **KTX2 (UASTC, or ETC1S for the small ones) with pre-built mips, transcoded to ASTC 4x4 on the iPhone.** Cache the **transcoded output** in IndexedDB so warm starts skip transcoding: `compressedTexImage2D` from cached bytes, with no decode and no `generateMipmap`. | GPU memory about 36 MB → about 9 MB. No WebP decode, no mip generation, about ¼ of the upload. The Simulator's no-texture bound puts the freeze at about 85-115 ms (from 255-533). | L / medium: the basis transcoder is about 200 KB of wasm plus a worker; a cold start pays the transcode; the pipeline changes | scripts/world3d-models.ts, things.ts, a new world3d/texCache.ts | phone (ASTC support and timing) |
| C2 | **A processed-model cache in IndexedDB.** Per model: decoded vertex and index ArrayBuffers (meshopt already undone), material parameters and texture references. One store, `island-gpu-v{PIPELINE}`, keyed by `MODELS[name].v` (the content hash already in `?v=`). Read in one `getAll` transaction at startup. | About −30-50 ms main thread at 4x (meshopt and JSON parse) plus about 70 fewer SW round trips. **Small on its own; worth it together with C1**, as one record per model holding the geometry and ASTC mips. | M-L / medium (WebKit may evict IndexedDB: fall back to the network path) | things.ts, home.ts, structure.ts, villager3d.ts, a new world3d/modelCache.ts | phone |
| C3 | Alternative to C2: **one packed startup file per build** at build time (the default layout's ~60 models, meshopt and KTX2), cached by the SW like a room asset. | One request instead of 71; simpler than C2 | M / low-medium | scripts/world3d-models.ts, things.ts | SW: classify the pack (room cache, carried across builds) |

**What to cache, and where.**
- Geometry: ArrayBuffers in IndexedDB (structured clone, no serialisation cost).
- Textures: compressed GPU formats only.
  - Raw RGBA (36 MB) costs as much to read back and upload as it saves.
  - ImageBitmap can't be stored in IndexedDB on WebKit.
- The ground fields: Float32Arrays in IndexedDB.
- Cache Storage is the right place for files fetched as files (GLB, KTX2, a pack): the SW serves them. IndexedDB is
  the right place for decoded, structured data the page reads directly, and it doesn't collide with the SW.

**Invalidation.**
- Per model: its content hash (`?v=`) plus PIPELINE_VERSION (bumped when the decode, transcode or material code changes).
- Fields: hash(layout) plus FIELDS_VERSION.
- Bound the stores with an LRU, about 20 MB.

**Expected warm-start total with A1+A2+B1+B2, then C1** (Simulator scale): loaded about 900 → about 550 ms, and the
longest frame about 355 → under 60 ms. A phone is likely 1.5-2.5× these. To be confirmed with B4.

### Evaluated and not recommended
- **Launch snapshot and crossfade**: dropped (the user said no).
- **View Transitions API** (Safari 18+): it snapshots the whole page, WebGL canvas included, at the start. That costs a
  capture frame and does nothing about mount and data costs. The existing transform and opacity `pop` is already
  compositor-only.
- **Removing live blur**: there is none on the open path. The only `backdrop-filter` is ききみみ's Sandwich overlay;
  leave it.
- **Pausing the island under opaque sheets**: already done (engine `pause`, CSS animations paused). A6(b)/(c) finish it.
- **compileAsync alone**: `hold()` already does what `compileAsync` does (`compile` plus polling `isReady`). The missing
  part is priming the program's first use and spreading the texture uploads (A1).

## 5. What I'd ask of fitness-df (the service worker)
1. After registration, **warm `island-room-v1` with the startup models** in the background (the default layout's GLBs,
   from assets.json). A first visit currently fetches them before the SW exists, so the first warm launch still goes
   to the network for 71 GLBs (warm0 in the Simulator: `transferSize > 0` for all of them).
2. A **"controlling and installed" signal** (a resolved promise or event from swLate.ts) so A3's prefetch runs only
   once chunks come from the cache.
3. Keep the food data's versioned files cache-first, and consider precaching `index.json` plus the core sets after
   install. A4 is the main fix either way.
4. If C3 goes ahead: classify the pack as a room asset (cached on use, carried across builds).
5. Investigate the **~1020 ms navigation `responseEnd`** in 3 of ~12 warm Simulator runs (the SW navigation path or
   its start-up). Check it on a phone.
6. Nothing in A1, A2, A4-A7, B1-B5, C1 or C2 touches the SW. A3 and C3 need coordinating with it.
