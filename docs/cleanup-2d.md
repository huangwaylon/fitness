# Cleaning up after the 3D cutover (the 2D island's assets and code)

## Status: phase B done (2026-11-03)

The 2D island is gone; the island is the 3D one on its layout, always (commits "Cleanup 2D, step 1" … "step 10" on
main). Measured on the same codebase with and without the cleanup (HEAD vs HEAD with the ten commits reverted;
apparent bytes):

| | Before | After | |
|---|---:|---:|---:|
| `static/` | 97.73 MB, 6,337 files | 95.80 MB, 6,239 files | −1.93 MB, −98 files |
| the build (`build-pages/`) | 102.31 MB, 6,634 files | 100.31 MB, 6,524 files | −2.00 MB |
| the bundle's JS | 2,736,275 B (850,497 gz), 143 chunks | 2,680,031 B (829,211 gz), 132 chunks | −55 KB (−21 KB gz) |

What went, by step:

| Step | What | Files | Lines (code, tests, scripts) | Static |
|---|---|---:|---:|---:|
| 1 | `quadMatrix`, `zIndexAt` out of roll.ts into `island/geom.ts` (+ geom.test) | 0 | +61 −56 | |
| 2 | せってい's switch (RenderSection, store/islandRender, DEVICE.islandRender / islandLayout, site's LAYOUT_3D and `?layout`); E2E_ISLAND / E2E_LAYOUT, `?island`; the 2D-only and `(2d)` specs; CI's e2e-3d job; /world3d a plain redirect to / | 2 | +146 −508 | |
| 3–6 | WorldGround, WorldWater, ShoreWash, Waterfall, roll.ts (+ test), DecorMode, terrain-preview.ts, derive-art.ts; IslandScene's scroller camera, ground tint plane and haze; camera.svelte.ts's 2D projector; Scenery's 2D lights; Particles' DOM fall; the gallery's still scenes; the no-WebGL line | 10 | +200 −2,141 | lamp-glow |
| 7 | /villagers3d (the POC) and its spec; Island3D's baked-ground look (groundUrls) | 2 | +5 −497 | |
| 8 | the 2D-only art: the lit looks (9), the decorations' turned facings 1–3 (30), the bridge's deck and winter front (3), the campsite's winter look, the goal trees' 2D fruit (4), the cliff-face sprites (2); manifest entries, caches.ts isBakeArt; models.ts writes none of it | 49 | +54 −61 | 0.25 MB |
| 9 | the baked ground: `static/terrain/<season>/` (48 chunks), island/terrain.json, scripts/terrain.ts and terrain-seasons.ts | 51 | +2 −1,343 | 1.74 MB |
| 10 | world.ts's 2D constants (PIVOT, SKY, TILT, BANDS, BAND_D, FACE_H, FALL_H, CAM_MIN, CAM_MAX); stale comments; `npm run unused` / `unused:probe` made the plain unused-asset scan | 0 | +41 −56 | |

About 4,700 lines removed, 510 added. The probe (17 scenes on the 3D island): 0 404s under art/, room/, terrain/ after
each deletion. Also fixed on the way: the decorations' 2D art drew over their 3D models (opacity 1); it's hidden and
never downloaded now.

**No WebGL** (never on the users' iPhones): 「この端末では しまを 表示できません」 / 「きろくや ごほうびは いつもどおり
つかえます」 instead of the island; the HUD, the panel, the health popup and ごほうび work (`e2e/world3d.spec.ts`).

**What was kept, and why** (`npm run unused` rules them by hand and now reports 0 safe):

- **The DOM island over the canvas:** the tap areas, marks, balloons, popups, Talk / Says, the art gate
  (`characters/artGate.ts`: an `m3off` node still shows its art), `camera.svelte.ts`'s projector.
- **The flowers' and oaks' art** (`art/flowers/`, `art/trees/`): the tap areas' sizes (Flowers' `.fl`) and the oak
  layers' clips (Scenery's `-trunk` / `-canopy`) come from them; care.spec reads the flowers' looks.
- **The candy and the party popper:** drawn by the DOM over the 3D island (Jack's treat, the birthday popper). The
  **cake**'s tap box is its art's.
- **The event and seasonal pieces** (present, pumpkin, spooky lantern, wedding arch, snowboy stages, lamps, kadomatsu,
  egg arch, picnic set, pond stones, illuminated tree, the shishi-odoshi tipped, the board's winter look): hidden under
  their models, but the specs check their nodes' art. A later pass can check their models instead.
- **world.ts's old geometry** (LAND, GRASS, RIVER, POND, SPRING, CLIFF, BRIDGE, PATHS…): the layout's default and its
  scripts are drawn from it, the unit tests read it, and `world3d/ground.ts` / `water.ts` still read it (the old
  heightfield and waters: the pond model is being brought back as a layout object, so they stay). Island3D's
  off-layout fallback (`ground = WORLD_GROUND`, `island(day)`) and engine.ts's `groundLook` are now unreachable but
  left to the engine's owner.
- **The shade at the source** (`--tod-filter`): it still tints what the DOM draws over the canvas at night.
- **Critters' `w.rest.three` branches:** still mean "the 3D camera is up" (the critters agent's file).

The rest of this page is the plan as written before phase B, kept as its record.


The cutover goes in two phases (the user: "flip to 3D as soon as the tests pass and start the unused assets cleanup"):

- **Phase A, at the flip** (`DEFAULT = '3d'`, `LAYOUT_3D = true`): せってい's switch keeps the 2D island reachable for one
  release, so the 2D renderer and everything it draws stay. Only what **neither** island uses may go. The result is
  below ("Phase A"): no static file qualifies, and the win is the 3D island no longer downloading the DOM's hidden art.
- **Phase B, after one release with the fallback:** the 2D renderer, its art, the baked ground and the switch go,
  in the order of "The plan for phase B" (below).

The lists come from `npm run unused` (`app/scripts/unused-assets.ts`), checked against what the built islands draw
(`npm run unused:probe`, in both islands). Snapshot: 2026-11-03, main at 56fe9be (just before the flip).

```sh
cd app
npm run build && node scripts/serve-build.ts 4396 &                      # (a free port: lsof -i :4396)
node scripts/unused-probe.ts 4396 /tmp/seen-3d.txt --island=3d --layout   # 17 scenes: what's drawn or loaded
node scripts/unused-probe.ts 4396 /tmp/seen-2d.txt --island=2d            # the same on the 2D fallback
sort -u /tmp/seen-3d.txt /tmp/seen-2d.txt > /tmp/seen.txt
npm run unused -- --seen=/tmp/seen.txt     # the summary; --list=safe|used|unsure for paths; --json
```

The probe also lists every 404 under `art/`, `room/` and `terrain/` (and exits 1): after any deletion, both islands
must show none. Beside its list it writes `<file>.wasted`: what was downloaded into the DOM and never seen drawn.
(`--layout` is `?layout`, the 3D island on its layout before `LAYOUT_3D` is on; after the flip it's the default.)

## How it decides

- **The users of a file** are the source files that name it: a literal key or path (`'deco/present'`,
  `` `art/x.webp` ``), a template that builds it (`` `critters/${id}` ``, counted as a real use when the varying part,
  e.g. `sea-bass`, is spelled somewhere in the source), a prefix (`'room/homes/' + id`), or a string in a JSON file
  (`island/models.json`, `catalog.json`, `layout/catalog.ts`'s icons).
- **Each user has a kind:**
  - the **2D renderer**, which goes with the cutover (the files listed below);
  - the **island's world** (`components/island|world3d|board`, and `lib/art.ts`'s key helpers, which only the island
    calls). Its DOM nodes stay over the canvas, but their art shows only where the 3D island has no model for the key
    (`world3d/assets.json` keys: otherwise a card, or the node's own art through `m3off`);
  - the **app beyond the island** (the tent, the ずかん, the HUD, the sheets, the もようがえ tray, the editor's palette).
    Anything it names stays;
  - a **dev page** (the gallery shows every key), which keeps nothing.
- **The ずかん's data counts as the app's.** `kiroku/zukan.ts` imports `critters.ts`, `beach.ts`, `sea.ts`,
  `pondFish.ts` and `catalog.ts`, so the art keys those build are ずかん and catch-plate icons. `world.ts` is the one
  exception: the app imports it for positions only, and its scenery keys are the island's to draw.
- **A layer of a modelled thing is safe.** An oak's `-trunk` / `-canopy` and a lamp's `-lit` head are parts of the 2D
  sprite of something the 3D island draws as NH's model.
- **Hand-checked rules** (`KNOWN` in the script) cover what the scan can't see: villagers (cards for villagers without
  3D models), しずえ, the catalogue icons, the UI art, the falling petals and leaves, the terrain, and the bake's input.
- **The probe** opens the built 3D island in 17 scenes (the four seasons, night and dusk, rain and snow, Halloween,
  Christmas Eve, a birthday, K.K., Gulliver, Wisp, a fish, a tarantula, a bottle), scrolls and taps. Anything it saw
  drawn (a visible DOM image) or loaded by the engine (a texture, never a DOM image) can't be "safe". It demoted
  `season/*`: a tapped bush's petals and a shaken tree's leaves are still drawn by the DOM over the canvas.
- **The built JS** (`build-pages/`) is read too: an unnamed file whose name is in the shipped chunks becomes "unsure".
  There were none.

## Summary

| | Files | Size |
|---|---:|---:|
| **Safe once the 2D fallback goes (phase B)** | **126** | **0.58 MB** |
| of which the 2D fallback still draws (phase A: stays) | 126 | 0.58 MB |
| Still used | 6,148 | 90.29 MB |
| of which 2D art (`art/`) | 3,257 | 15.88 MB |
| of which 3D models, the tent's room, audio, icons | 2,891 | 74.4 MB |
| **The baked ground** (the 2D fallback's; the 3D island on its layout no longer loads it: phase B) | **48** | **1.67 MB** |

`static/` is 106 MB (6,322 files); the build (`build-pages/`) 131 MB. The 2D island's own art is small: the bulk is the
3D models, the music and the villagers' renders, which all stay. Phase B frees 0.58 MB of art and 1.67 MB of baked
ground; the code is the bigger win (below).

## Phase A (at the flip, with the 2D fallback)

**Static files: none go.** Every one of the 126 "safe" files is the 2D island's art for something the 3D island draws
as a model, and the 2D fallback still draws it: the flowers (`Flowers.svelte`), the oaks and their layers
(`FruitTree.svelte`), the fruit, the decorations' looks 1–3 (`Decor.svelte`, the old もようがえ `DecorMode`), the lamps'
lit looks and glow, the event pieces (`Halloween`, `Wedding`, `Cake`, `Birthday`), the cliff faces (`WorldWater`). The
2D probe saw 50 of them drawn in its 17 scenes; the other 76 are the 2D island's in other scenes (a flower colour, a
look, an hour), so the scan's reasons, not the probe, decide. Two more are the bake's input (`bridges/stone-deck*`,
`scripts/terrain.ts`), which stays while the baked ground does.

**The baked ground stays.** The 3D island on its layout draws `terrain.ts buildGround(layout)` with `terrain/nh/` (the
probe on the layout loaded no `terrain/<season>/` chunk), but the 2D fallback's `WorldGround` draws the chunks, and so
does the 3D island off its layout (the no-layout path, `/villagers3d`). They go in phase B.

**Code: nothing is unreachable in either island.**

- `world.ts`'s unread exports: `BANDS`, `BAND_D` (WorldGround), `FACE_H`, `FALL_H` (WorldWater, terrain-preview.ts),
  `PATHS` (world.ts's `surfaceAt`, scenery.test.ts), `Building` (layoutWorld.ts) are all still read with the 2D
  renderer in. Phase B.
- `DecorMode.svelte` is the 2D island's もようがえ (decor.spec's old-mode tests): phase B.
- `knip` is clean (it gates the deploy). `knip --production` lists 189 exports read only by the unit tests (the rules'
  constants: kept for the tests) and the two dead modules outside the cutover (`model/record.ts`, `sync/fake-record.ts`).
- Routes: `/world3d` is already a redirect to `?island=3d` (a kept link; world3d.spec covers it). `/villagers3d` is the
  3D villagers POC the user judged on the phone (unlinked, noindex); it reads world.ts and the baked ground. **Ask the
  user** before deleting it (phase B at the latest, or move it onto the layout).

**The win: the 3D island stops downloading the DOM's hidden art** (`characters/artGate.ts`). Its DOM nodes stay over
the canvas as the tap areas, but their art is hidden where the canvas draws the thing (IslandScene's `[data-r3]` rules,
which also set `--art3d: off`, inherited). An `<OfficialArt>` under such a node now waits with a blank image (its URL
in `data-src`) until its node shows it: no model for its key (`m3off`), or the 2D island again (せってい's switch, no
WebGL). The probe, 17 scenes on the 3D island on its layout:

| | Before | After |
|---|---:|---:|
| Distinct images fetched (`art/`, `terrain/`) | 176 | 65 |
| Requests for them | 1,179 | 401 (about 69 → 24 a load) |
| Downloaded into the DOM, never drawn | 124 | 11 (the visitors' renders, the engine's cards' too; the HUD's fruit) |
| Bytes of the images no longer downloaded | | 0.53 MB (113 images) |
| 404s, either island | 0 | 0 |

The 2D island is unchanged (219 fetched, 133 drawn).

## Safe once the 2D fallback goes: phase B (126 files, 0.58 MB)

Each has a 3D model in `world3d/assets.json` (or is a layer of one), and only the 2D island draws it:

- `art/deco/` (31): bamboo-shoot-lamp, bamboo-shoot-lamp-lit, birthday-cake, bulletin-board-winter, campfire-lit,
  campsite-lit, campsite-winter, egg-arch, garden-lantern-lit, garden-lantern-white-lit, illumi-tree, illumi-tree-lit,
  kadomatsu, lamp-glow (`Scenery`'s `{#if lit && !r3}` only), mushroom-lamp, mushroom-lamp-lit, nut-lamp, nut-lamp-lit,
  party-popper, picnic-set, pond-stone-maple, pond-stone-sakura, present, pumpkin, shishiodoshi-tip, snowboy-1…3,
  spooky-lantern, streetlamp-lit, wedding-arch
- `art/decor/` (30): every old もようがえ decoration's looks 1–3 (birdbath, brick-well, garden-wagon, iron-chair,
  iron-table, monstera, signpost, stone-lantern, tanuki, wheelbarrow). Look 0 of each stays as the tray's icon.
- `art/flowers/` (41): every wild flower but red-tulips (the palette's icon)
- `art/trees/` (14): oak-spring, oak-fall, oak-winter, the four oaks' -trunk and -canopy layers, bamboo-winter,
  cedar-winter, palm-winter
- `art/fruit/` (4): apple, cherry, peach, pear (the goal trees' fruit is NH's models, greyed by `m3.grey`)
- `art/bridges/` (3): stone-deck, stone-deck-winter (the bake's input, never shown), stone-front-winter
- `art/items/candy` (1)
- `terrain/sprites/` (2): cliff-face, cliff-face-winter (WorldWater only)

Then remove their entries from `static/art/manifest.json` (fetch-assets / derive-art / models.ts write it), and the
matching rules in `service-worker/caches.ts`: `isBakeArt`, and `isDecorArt`'s `-lit` and `lamp-glow` cases.

## Still used (6,148 files, 90.29 MB)

- **Flat art for villagers without a 3D model**, and the villagers everywhere else: `art/villagers/` (887, 11.49 MB):
  the roster, the HUD, the tent, and the 3D island's cards where `has3d` is false.
- **ずかん and catch-plate icons:** `art/critters/` (197, 0.40 MB); `art/finds/` (110, 0.23 MB: shells, fossils,
  fragments, mushrooms, the bottle, eggs, the branch); `art/presents/diy-recipe`.
- **The balloon catalogue** (presents, the ずかん, the tent's items): `art/finds/items/` (1,836, 3.17 MB),
  `art/finds/recipes/` (126, 0.22 MB).
- **Tray and palette icons** (the phone's もようがえ `IslandEdit`, the editor, `layout/catalog.ts`): art/bushes (24,
  `bushes/${s}` for the chosen bush), the deco and decor look-0 icons, bridges/stone-front, flowers/red-tulips, and
  trees oak-summer, cedar, palm, bamboo.
- **HUD and UI art:** `art/host/` (しずえ, Tom Nook), `art/reactions/`, `art/money/`, `art/fruit3d/`,
  `art/items/{dinner,snack}` (the wallet), `art/deco/airport` (pairing), `art/deco/birthday-hat-*` (drawn over the 3D
  villagers).
- **Seen on the 3D island:** `art/season/` (petal, maple-leaf, snowflake: a tapped bush's petals and a shaken tree's
  leaves are DOM flourishes over the canvas, and the 3D floats' cards).
- **3D models and the tent:** `room/` (villagers3d, models, homes, world3d, floor, wall, structures, icons).
  `terrain/nh/` (NH's ground textures for the layout's live terrain).
- **Audio, the app icons, the web manifest.**

## The baked ground: phase B (48 files, 1.67 MB)

- `terrain/{spring,summer,autumn,winter,spring-petals,autumn-leaves}/0…7.webp`: the baked ground. The 2D island draws
  it (WorldGround), and so does the 3D island **off** its layout (`Island3D.svelte` `groundUrls()` →
  `engine.groundLook`; `/villagers3d`). On its layout the 3D island draws `buildGround(layout)` and loads none of it.
  `island/terrain.json`, `scripts/terrain.ts`, `terrain-seasons.ts` and `terrain-preview.ts` go with it, and so do
  `caches.ts` `isCritterArt`'s `/terrain/` case and the bake's input `art/bridges/stone-deck*`.

## The code that goes

### Whole files (the script's `GONE`, ~1,000 lines)

| File | Lines | What |
|---|---:|---|
| `island/WorldGround.svelte` | 116 | the baked ground's 40 bent bands |
| `island/WorldWater.svelte` | 192 | the live water's CSS sprites over the baked ground |
| `island/ShoreWash.svelte` | 100 | the foam strip (WorldWater's) |
| `island/Waterfall.svelte` | 129 | the CSS falls (WorldWater's) |
| `island/roll.ts` (+ `roll.test.ts` 190) | 211 | the rolling log's projection. **First move** `quadMatrix` (place3's flat quads) and `zIndexAt` (`depthAt`, the DOM's stacking) into camera.svelte.ts: the 3D path still uses them. |
| `island/DecorMode.svelte` | 346 | the old もようがえ's tray and ghost (IslandEdit takes its place on the 3D island, docs/island-layout.md "Phone editing") |

No other module becomes unreachable once these go. Those that already are (`model/record.ts`, `sync/fake-record.ts`)
are outside the cutover.

### Lines to edit in the files that stay

- `island/IslandScene.svelte`
  - :31, :32: drop the WorldGround and WorldWater imports. :76: roll's `camAt, horizonAhead, scrollFor, solveCam`.
  - :168–169: `failed3`, and `r3` is always true. :1062: `onfail` (the "no WebGL: draw in 2D" fallback; the user
    decides between an error card and nothing).
  - :1064–1068: the `{:else}` branch (WorldGround, WorldWater, `.haze`).
  - :485–500 and :560–600: the 2D scroller camera (`solveCam`, `scrollFor`, `camAt`, `camMin` / `camMax` from
    `CAMS`).
  - :983–1001, :1048: the time-of-day `shade` filter. :1149: `.tint`. :1219: `.haze`'s CSS.
  - :1186–1205: the `[data-r3]` rules become unconditional, or better, the hidden art goes from the nodes and the
    rules with it.
- `island/camera.svelte.ts`: :10 the roll import. :149 `depthAt` and :152 `P` (roll's params). Every
  `if (this.three) … else` (:189, :197–201, :214–215, :232–233, :239, :246, :265–290 the 2D `place`, :334–341 the 2D
  quad, :382–385, :401, :452): keep the 3D side. `three` becomes non-null.
- `island/Scenery.svelte`: :168 (shade), :185 (the lit looks and the lamps' glow), :238 (the tent's pool):
  `{#if … !r3}` blocks. Every `<OfficialArt>` inside an m3 node.
- `island/Particles.svelte`: :82, the DOM's falling particles (`!w.rest.three`). The 3D island keeps the count.
- `island/FruitTree.svelte`: the 2D oak (:358, :367 `treeArt`) and the DOM fruit (:407's else). The popup's
  placement (:331) keeps its 3D side.
- `island/Critters.svelte`: the 2D fish teardrop (:1197) and the sprites. `BugSprite.svelte` (359) stays only as the
  invisible tap box, so trim it to that.
- `island/Finds.svelte`, `Flowers.svelte`, `Decor.svelte`, `Visitor.svelte`, `TreeShakes.svelte`, `Halloween.svelte`,
  `Wedding.svelte`, `Cake.svelte`, `TapeDeck.svelte`, `Care.svelte`: the `<OfficialArt>` inside nodes that have an m3
  key with a model. Keep the node and its hit box, and keep the art for keys without a model.
- `components/panel/RenderSection.svelte`, `store/islandRender.svelte.ts`, `sync/storage.ts`: せってい's 2D/3D switch.
- `service-worker/caches.ts`: the rules named above.
- e2e: specs run on the 2D island by default (`E2E_ISLAND=3d` switches). The default flips, and the 2D-only
  assertions go (e.g. `board.spec`'s `'sheet'` view).
- Scripts: `scripts/terrain.ts` (1,081), `terrain-seasons.ts`, `terrain-preview.ts` (with the baked ground).
  `scripts/models.ts` (the 2D renders of NH's models) stays while any of its art is used (the tray icons).

### world.ts constants still read after the cutover

From the import graph with the files above gone (`npm run unused`'s last section):

- **Only the 2D camera reads these**, so they go with it: `PIVOT`, `TILT`, `BEHIND`, `AHEAD` (camera.svelte.ts's roll
  params), `SKY` (also `/villagers3d`), `CAMS`, `CAM_MIN`, `CAM_MAX` (IslandScene's scroller). `PLAN` is the same,
  and also `world3d/ground.ts`'s heightfield until the layout ground lands.
- **Nobody reads these:** `BANDS`, `BAND_D`, `FACE_H`, `FALL_H`, `PATHS`, `Building`.
- **The 3D ground reads these** (`world3d/ground.ts`, `water.ts`) until `buildGround(layout)` lands: `LAND`, `GRASS`,
  `RIVER`, `SPRING`, `POND`, `CLIFF`, `BRIDGE`, `onBridge`.
- **Still read by the DOM overlays, the walk and the critters** (docs/island-layout.md item 7: each should come from
  the layout): `HOMES`, `CAMPSITE`, `BUILDINGS`, `BuildingId`, `CENTRE_STAGE`, `ARCH`, `CAKE`, `SEATS`, `seatAt`,
  `SEAT_DROP`, `PULLUP_AT`, `FLOWERS`, `flowerById`, `DECOR_SLOTS`, `DECOR_U`, `GOAL_TREES`, `TREE_H`, `ROCK`,
  `TAPE_DECK`, `BRIDGE_RAIL`, `HEDGE_Z`, `HEDGE_XS`, `SCENERY`, `FALLS_POOL`, `freshWhere`, `FreshWhere`,
  `riverNear`, `riverNS`, `inRiver`, `inOval`, `onLand`, `onGrass`, `surfaceAt`, `SHORE_Z`, `DIG_SPOTS`,
  `LAWN_SPOTS`, `BEACH_BOX`, `SEA_BOX`.

## The plan for phase B (after one release with the fallback; not before)

Line numbers above are as of 6456bab: find each by its name. Each step is its own commit, green on its own (`npm run
check`, `npm run knip`, `npx vitest run`, `npm run build`, `npm run e2e:ci-like` on the specs it touches), and after
each the probe on the 3D island shows no 404 (`node scripts/unused-probe.ts <port> /tmp/seen.txt`).

1. **Move what the 3D path keeps out of roll.ts:** `quadMatrix` (place3's flat quads) and `zIndexAt` (`depthAt`, the
   DOM's stacking) into `camera.svelte.ts`, with their cases from `roll.test.ts`.
2. **The switch goes:** `components/panel/RenderSection.svelte` and its row in せってい; `store/islandRender.svelte.ts`
   (the island is 3D: its readers lose their `mode === '3d'` tests); `sync/storage.ts` `DEVICE.islandRender` and
   `DEVICE.islandLayout`; `island/site.svelte.ts`'s `LAYOUT_3D`, `fromUrl` and `kept` (`on` is `force ?? true`). The
   e2e: `E2E_ISLAND` and `E2E_LAYOUT` in `playwright.config.ts`, `is3d` in `e2e/island.ts` (always true), the specs'
   `(2d)` variants and 2D-only tests (board.spec's `'sheet'` view, decor.spec's old-mode tests, layout-island's
   no-`?layout` case, world3d.spec's `?island=2d`), and CI's `e2e-3d` job (`pages.yml`: the gate is it now).
3. **IslandScene draws only in 3D:** `r3` always true; no WebGL is an error card or nothing (**ask the user**, today it
   falls back to 2D through `failed3`/`onfail`); the `{:else}` branch (WorldGround, WorldWater, `.haze`); the 2D
   scroller camera (`solveCam`, `scrollFor`, `camAt`, `camMin`/`camMax` from `CAMS`); the time-of-day `shade` filter,
   `.tint` and `.haze`'s CSS; the `[data-r3]` rules unconditional.
4. **Delete the 2D renderer's files:** `WorldGround.svelte`, `WorldWater.svelte`, `ShoreWash.svelte`,
   `Waterfall.svelte`, `roll.ts` + `roll.test.ts`, `DecorMode.svelte`; empty the script's `GONE` (since gone itself).
5. **`camera.svelte.ts`:** `three` non-null, each `if (this.three) … else` keeps its 3D side, the roll params go.
6. **The nodes keep their hit boxes, not their art:** the `{#if … !r3}` blocks (Scenery's shade, lit looks and lamp
   glow, the tent's pool; Particles' DOM fall; FruitTree's 2D oak and DOM fruit; Critters' fish teardrop and sprites,
   `BugSprite.svelte` trimmed to its tap box), and the `<OfficialArt>` of an m3 node whose key has a model in Finds,
   Flowers, Decor, Visitor, TreeShakes, Halloween, Wedding, Cake, TapeDeck, Care. Keep the art of keys with no model
   (cards, `m3off`). Then `characters/artGate.ts` stays only for what is still hidden (else it goes, with the rules'
   `--art3d`).
7. **The 3D island's off-layout path:** with `site.on` always true, Island3D's `island(day)` world, `groundUrls()`,
   `WORLD_GROUND` and `world3d/ground.ts`'s heightfield, `water.ts`'s world.ts waters. Check `editor/Preview3D.svelte`
   and `/villagers3d` first (**ask the user** about deleting the POC route, or move it onto the layout).
8. **The static files:** the 126 above (`--list=safe`), the 48 baked chunks, `island/terrain.json`; their entries in
   `static/art/manifest.json` (fetch-assets / derive-art / models.ts write it, so fix the writers too); `caches.ts`
   `isBakeArt`, `isDecorArt`'s `-lit` and `lamp-glow` cases, `isCritterArt`'s `/terrain/` case. Rerun `npm run unused`
   and the probe first: whatever a step above made unreferenced joins the list, and nothing on it may be seen.
9. **Scripts:** `scripts/terrain.ts`, `terrain-seasons.ts`, `terrain-preview.ts` and the `terrain`, `terrain:preview`
   npm scripts. `scripts/models.ts` stays while its renders are icons (the tray).
10. **world.ts:** the 2D camera's `PIVOT`, `TILT`, `BEHIND`, `AHEAD`, `SKY`, `CAMS`, `CAM_MIN`, `CAM_MAX`, `PLAN`;
    the unread `BANDS`, `BAND_D`, `FACE_H`, `FALL_H`, `PATHS` (and scenery.test's use), `Building`; after step 7, the
    old ground's `LAND`, `GRASS`, `RIVER`, `SPRING`, `POND`, `CLIFF`, `BRIDGE`, `onBridge` where nothing reads them.
    The overlays' constants follow the layout (docs/island-layout.md item 7), not this cleanup.
11. **Docs:** design.md "World", decisions.md "The island in 3D", this page (what's gone), testing.md (the e2e-3d job).
