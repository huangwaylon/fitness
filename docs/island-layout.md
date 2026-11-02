# The island's layout (customisable outdoors, homes and interiors)

Status: **phases 1 (schema, ops, default migration, nav, validation, the store), 2 (the 3D ground from the grid, the
objects from the layout, the long island) and 3 (the desktop editor) landed**; next: the homes and their interiors
(4), phone editing (5). This file is the contract
between the layout work (`app/src/lib/layout/`, `store/layout.svelte.ts`, `world3d/terrain.ts`, `world3d/objects.ts`,
the editor, the homes) and the 3D integration (the scene, the camera, porting the island's features: the lead's
`world3d/engine.ts` and the rest of `world3d/`).

## The grid

- **One tile = 30 world units** = one NH tile (10 model units of NH's furniture at the island's scale, world.ts
  `DECOR_U` = 3u a model unit: a 2-tile bench is 60u, an 80u villager is NH's chibi). The tent's room uses the same
  tile (10 model units), so an outdoor footprint and a room footprint mean the same thing.
- **20 × 92 tiles**, x −90…510, z −90…2670 (`layout/grid.ts` `GRID`): the long island (land x −30…480, z −30…2640:
  twice today's length, the user's call, 2026-11-02: room for the homes and the buildings to come) with a ring of
  sea; everything off the grid is sea. Tile (c, r) covers x `−90 + 30c … +30`, z `−90 + 30r … +30`; `r` grows into
  the island (away from the camera), as world z does. Read the extent from the layout (`model.ts extentOf`), never
  a constant.
- **Chunks of 8 × 8 tiles** (3 × 12 of them; the last column sticks out past the grid and is sea): the unit of a
  terrain op. The ops allow up to 16 × 16 chunks (128 × 128 tiles), so the grid can grow again without a relay deploy.

## The layout is data

`layout/model.ts` `Layout` (`codes`, `objects`, `homes`; `tile(c, r)`, `kind`, `tier`):

- **Terrain per tile:** one *kind* and one *tier*, one code `kind × 4 + tier` (base 36, one character in a chunk op).
  - Kinds (`grid.ts KINDS`, never reordered): `sea`, `grass`, `sand`, `dirt`, `stone`, `brick`, `plank` (path kinds),
    `river`, `pond`.
  - Tier 0…3: the cliff levels (0 the ground the beach and the lawn are on; each tier +40u). A tile next to a lower
    one has a cliff face on that side; river water that steps down a tier is a **waterfall** (derived, never painted).
- **Objects** (`layout/catalog.ts` `KIND_LIST`: each kind's footprint, whether it blocks, its block box, where it may
  stand, its drawn height, palette icon and names): trees (`oak`, `cedar`, `palm`, `bamboo`, `goal-tree` a|b),
  `bush` and `hedge` (variant: the species, `month-a|b` the month's pair), `flower` (`c<n>`: the scatter's clump n,
  its kind the season's), rocks (`rock` the shovel's, `flat-rock`, `garden-rock`), lights, NH's outdoor furniture,
  the seasonal spots (`beach-chair`, `sandcastle`, `snowboy`), NH's bulletin board (`board`: 2 × 1, one on the
  island, used from the tile in front of it, which must stay clear and reachable like a home's door), the pieces that
  join terrain (`bridge` over water, `stairs` up a cliff), the homes (`home`) and named spots (`spot`: `villager-a|b`
  the villagers' home spots, `stage`).
  Each: `id`, kind `k`, tile `x, z` (its footprint's lowest column and row), facing `f` 0–3 (0 toward the camera, −z;
  1 +x, 2 away, 3 −x), variant `s`. A footprint is `w × d` tiles, turned by `f` for the kinds that `turn` (a bench);
  for the others an odd `f` only mirrors the look.
- **The default offset `n`:** a default object stands exactly where it stands today (`n`: its offset in u from its
  footprint's middle); an op (a move) always puts it on its tile, and `n` is gone. So reading positions from the
  layout instead of world.ts changes nothing on the island until someone moves something.
- **Homes:** three, fixed ids `home-A` (ウェイ's, the campsite's tent), `home-B` (うめ's), `home-G` (the guest's).
  Where a home stands is an object; how it looks is its **style** (`layout/homes.ts`: `{m, w?, r?, d?}`), its owner's.
  The style's model sets the footprint (campsite 4 × 3, tents 3 × 3 / 4 × 3, a house 4 × 3); its door is the middle
  of the front edge (`model.ts doorOf`), the tile(s) in front of it must stay clear.
- **The default layout** (`layout/default.json`, `npm run layout:default` from world.ts and scatter.json): today's
  island on the grid, world.ts's ids kept (`goal-A`, `hedge-3`, `bench-mae`, `fl:52:180`, `tape-deck`, `rock`,
  `bridge`, `stairs`; the campsite is `home-A`), made twice as long: today's まえ (the sea, the beach, the health
  lawn, the goal trees, the stream's crossing and its bridge) at the front as it is; today's おく (the campsite, the
  pond, the bamboo, the falls, the upper tier's forest; world.ts z ≥ 680) moved 1380u (46 tiles) back; between them
  a new middle: open grass to build on, the stream running on down its east side, the main path through it to the
  campsite, うめ's house (tiles 3…6 × 46…48) and the guest's (11…14 × 56…58) with paths to their doors and a lamp
  at each, a few trees at the edges, two bushes, three clumps of flowers. The layout a phone shows is the default
  with the record's ops over it (`layoutOf(entries)`).
- **The 2D island keeps world.ts's area** (46 tiles) until the 3D cutover: it doesn't read the layout (its positions
  for おく would be 1380u off). The layout store is attached on every phone already, so the ops are there for the 3D
  island.

## Ops (the record and the relay)

All are the existing `decor` event and `decor` relay intent with a scope `sc`, last writer wins per id, the same merge
as the decorations (latest `at` on the relay's clock, then a removal, then G over B over A), the record keeping each
id's latest op (slot `decor|<sc>|<id>`). An old phone ignores every new scope (its parsers refuse the key).

| `sc` | Op | Who may write |
|---|---|---|
| `o` | an object set `{id, at, k, x, z, f, s?}` or gone `{id, at, rm: true}` (not final: a later set brings it back) | A, B |
| `c` | a terrain chunk `{id: 'c<cx>x<cz>', at, g}`: `g` its 64 tiles, row by row, one character each | A, B |
| `r` | a reset `{id: 'reset', at}`: every `o` and `c` op older than it is void (the default again); the record drops them | A, B |
| `h` | a home's style `{id: 'hA'\|'hB'\|'hG', at, m, w?, r?, d?}` | its owner; `hG` also A and B |
| `t` | ウェイ's home's interior (the tent's room, as before) | A, B, G |
| `u` | うめ's home's interior | B |
| `v` | the guest's home's interior | G |

- The server enforces it (`contract/layout.ts` `scopeMayWrite` in the record, `live-protocol.ts` `scopeMaySend` in the
  room; tests in `relay/test/guest.test.ts`): the guest can never write an outdoor op.
- A room scope (`t`, `u`, `v`) is contract/tent.ts's op: its own ids, its own cap of 40 pieces.
- The room relays a layout op live but never keeps it in the day's ring (an afternoon in the editor would push the
  shared world out of it); a phone opening later reads it from the record. A `drag` with `sc: 'o'` is an outdoor
  object being moved (x, z its middle in world units): presence, as the tent's.
- Ids: a default object's (`goal-A`, `fl:52:180`), a new one `o<time><random>` (`model.ts newObjId`); tokens
  (`k`, `s`, `m`) are lower-case; home parts (`w`, `r`, `d`) `[A-Za-z0-9.]`.

## Derived, never hand-made

- **Heights** (`layout/height.ts` `heightAt(layout, x, z)`, `fieldOf(layout)` for the ground alone, the rounded tier
  and surface): each tier 40u; grass and paths 3u over it, sand 1.2u, the river's and the pond's bed 9u under the
  bank, the seabed falling away from the shore. Every region's corners are NH's rounded ones (a convex corner cut on
  a 0.42-tile radius, a concave one filled), so cliffs, banks, the beach and paths never show a square corner. Stairs
  ramp from their tier to the next along their facing; a bridge's deck arches over its water.
- **Nav** (`layout/nav.ts` `navOf(layout)`): a walk grid at half a tile (15u): water and the sea block (a bridge's deck
  is walkable over them), so does every blocking footprint (its kind's block box, padded 5u: a trunk, not its whole
  tile); a step keeps to its tier but on stairs (a ramp's cells rise along it). A* with the corners pulled straight;
  `findPath`, `snapTap` (home → its door, water → the nearest bank, else the nearest walkable point), `walkable`,
  `reachable`, `named` (`homeA`, `homeB`, `centreStage`, `door-home-A|B|G`, the default's seats `seatMaeL`…
  `stoolW`, `pullup`). **A drop-in for planTap:** `planTap(navOf(layout), from, x, z)` (tapWalk.ts takes either nav).
  Builds in ~4 ms.
- **Validation** (`layout/validate.ts` `validate(layout)` → issues, each `error` or `warn` with its tiles and ids): an
  object off the land or in water, one straddling a cliff, two footprints over each other, a tree off the grass
  (warn), stairs that join no cliff, a bridge that spans no water, a home whose door can't be reached, a missing or
  second goal tree, a named spot nobody can reach, land nobody can walk to (warn), water joined only at a corner or
  spilling over a cliff (warn; only a river falls). Advisory: the record keeps whatever the members save. The default
  has no errors (`layout.test.ts`).
- **What changed** (`layout/diff.ts` `diffLayouts(a, b)`): the chunks that differ, the objects added, moved (or
  turned, restyled) and removed, the homes whose look changed.

## API for the 3D scene

Pure (`app/src/lib/layout/`, no three.js):

```ts
layoutOf(entries: Iterable<LayoutEntry>): Layout          // the default with the ops merged over it
layout.tile(c, r): { kind, tier }; layout.objects: ReadonlyMap<string, Obj>; layout.homes: Record<Who, HomeStyle>
objMid(layout, obj): [x, z]; footOf(layout, obj); doorOf(layout, home)
heightAt(layout, x, z): number                             // the ground's height (feet, taps)
navOf(layout): LayoutNav; findPath(nav, from, to); snapTap(nav, x, z); planTap(nav, …) as today
diffLayouts(a, b): { chunks: number[]; objects: { add: Obj[]; move: Obj[]; remove: string[] }; homes }
```

The live layout (`store/layout.svelte.ts`, Svelte runes; what the scene, the DOM sprites and the editor read):

```ts
layout.current: Layout          // reactive: reading it in an $effect or $derived subscribes
layout.pos(id): [x, z] | null   // where an object stands (u); null when it's gone
layout.obj(id); layout.ofKind('flower'); layout.home('B')
layout.on(({ diff, who, live }) => …)   // every change as it lands, with what changed
layout.apply(ops)               // changes of mine (the editor's save, the phone's もようがえ): merged, kept, sent
```

IslandScene attaches it (the relay, the record's `state.layout` rows, the sink to the record), so every phone keeps
the layout in localStorage already. The DOM sprites (Scenery, FruitTree, Flowers, Decor) can read `layout.pos(id)`
for their spots with no visual change (the default's offsets); the 3D island reads `layout.current`.

## The 3D ground (phase 2)

- **The geometry** (`layout/mesh.ts`, pure): NH's own scheme. Each tile is four quadrants of 15u, each 3 × 3 cells
  of 5u; a quadrant whose corner is rounded (`fields.ts roundedIn`: a convex corner cut, a concave one filled, on a
  third of a tile, 10u) has its corner's 2 × 2 cells replaced by a quarter disc and the piece round it, at their own
  levels, on vertices that meet the neighbours' exactly. A tier's edge stands a vertical wall from the upper ground
  down to the lower (NH's cliff strata, `static/terrain/nh/cliff.webp`); where water meets water a tier down the wall
  is a waterfall. Stairs are stone steps (8 to a tier) with their sides walled. Heights over a level from
  `height.ts`: the beach sloping into the sea, the banks to a river's bed, a path a little sunk.
- **The distance fields** (`layout/fields.ts`): each region's signed distance (u, 2.5u raster, ±48u) to its rounded
  edge: the land, the beach's sand, the fresh water, the paths, each tier. The heights and the look both read them,
  so every edge is soft and round and follows the tiles (~20 ms for the whole island on a desktop).
- **The look is baked on the GPU** (`world3d/terrain.ts`): one shader paints each band's texture from the fields and
  the tiles, NH's way (the 2D bake's grass with its flecks, NH's own grass pattern, the beach going wet at the sea and
  the seabed deepening under it, the dirt path worn with its pebbles, NH's stone, brick and plank textures, a river's
  earthy rim and its bed, a shade at a cliff's foot), once at load and again only for what a change touches. The
  season's palette (`ground.look`) rebakes it all.
- **Bands:** the ground draws a row of chunks across the island as one: 4 draws (the ground, the walls, the falls,
  the fresh water), one 960 × 384 texture (1.6 px a unit, ~21 MB for the whole island with mips), so the draw calls
  stay flat however long the island grows; the camera shows ~6 of the 12. Measured in the editor's phone view at
  393 × 852 (×3, desktop Chrome): 78–94 draws (the models' instancing and the shadow pass included), 180–230k
  triangles, 60 fps; the island's first build ~0.4–1.2 s with the models' loading.
- **The water:** NH's sea round the island (translucent over the baked shallows, opaque by the grid's edge, the shore
  foam where the land's field says), the rivers' flow (each tile's way down, breadth-first along the river to the sea
  or a fall) and the ponds' ripples, the falls' streaks; all on water.ts's shared clock, tint and fog uniforms.
- NH's textures: `npm run terrain-textures` (NH_MODELS=~/Downloads/Model) converts the few PNGs from
  `FldUnit.Nin_NX_NVN` into `static/terrain/nh/*.webp` (92 KB).

three.js (`app/src/lib/components/world3d/terrain.ts`, `objects.ts`; bent like everything else):

```ts
buildGround(layout, { renderer, look?, base?, px? }): Ground   // engine.ts's BuiltGround, and more
  ground.group: Group                 // add to the scene once: the land, the walls, the falls, the water, the sea, the stairs
  ground.heightAt(x, z) / ground.feet(x, z)   // = layout/height.ts: the ground; where feet stand (stairs, bridge decks)
  ground.land: { x0, x1, z0, z1, r }  // the land's box (updated by a rebuild)
  ground.update(t): false             // the engine's per-frame hook (its water runs on waterU)
  ground.rebuild(layout, chunks?)     // after a change: the bands those chunks are in (and either side); all when none given
  ground.look('summer' | … | 'autumn-leaves')
  ground.chunks(): { z0, z1, meshes }[]     // each band, for the camera's culling
  ground.ready: Promise<void>         // NH's textures in (the bands bake again then)
  ground.dispose()
placeObjects(layout, day): { insts: Inst[]; standins: Standin[] }   // layout3d.ts island()'s, from the layout
  day = { season, foliage, month, swaps?: swapsOn(date), pieces?: piecesOn(date, hour, seed), fruit? }
extentOf(layout): { grid, land, shore, home }   // model.ts: the island's box, the front shoreline's z, ウェイ's door
```

## The editor (phase 3)

`/fitness/editor/` (`routes/editor/+page.svelte`, `components/editor/`: `Editor.svelte`, `plan.ts` the canvas,
`edits.ts` the edits, `Preview3D.svelte`): unlinked, noindex, the members' only (the browser paired with the A or B key
at `/fitness/pair`; the guest's key gets 「ウェイと うめだけが つかえます」, and the record refuses the guest's outdoor ops
anyway). `?demo` runs it on the demo's island (`?demo&as=B` beside it as the phone).

- **The plan:** the layout top-down, the back of the island at the top (as the phones see it): tiles in NH's map
  colours (the higher a tier, the lighter), the cliffs' edges dark, a fall white, the objects by their icons at their
  spots (a default piece where it stands today), the homes labelled with their doors, the named spots as pins; what's
  wrong tinted on its tiles.
- **The mouse:** えらぶ (V) picks up a piece and drags it on the grid (a group, if it's selected; shift adds to the
  selection, a drag on empty ground draws a box); ぬる (B) paints a brush (くさ, すな, つち, いし, レンガ, いた, かわ, いけ,
  うみ; sizes 1–3); がけ (C) raises or lowers the tiles a tier; おく places from the palette (each kind's icon; the
  island's one-offs greyed while they stand) with its ghost green or red. The wheel or R turns what's held (a drag,
  a placement); Delete takes the selection away (never a goal tree, a home, a named spot or a one-off).
- **The keyboard:** ⌘Z / ⌘⇧Z (undo reverts one action over the island as it is now: the partner's changes since stay),
  ⌘C / ⌘V (paste at the pointer), ⌘A, the arrows nudge, G the grid, the wheel zooms (⌘-wheel while placing), space and
  drag (or a right / middle drag) pans, 0 the whole island, 1–3 the brush.
- **Live:** each finished action (a drop, a stroke, a turn) goes out as layout ops at once (the store: the record
  and the relay), so a phone holds it as it's made; a drag streams the piece's spot as presence (`drag`, `sc: 'o'`,
  ~10 a second). The checks (validate.ts) run a moment after every change; a click on one selects its pieces and
  centres its tiles. The 3D preview beside the plan is the island's own ground and models.
- **Files:** JSON に かきだす / JSON を よみこむ (model.ts `toJson` / `fromJson`; an import is one action: undo takes it
  back), はじめの しまに もどす behind a confirm (the reset op: every object and chunk op before it void, the homes' looks
  kept).
- **The e2e** (`e2e/editor.spec.ts`): a move reaches the other tab's layout live and stays across a reload; a stroke
  and its undo / redo; R; Delete refusing a goal tree; placing (refused on the river); reset; the guest's door.

## What the 3D integration must change (the lead's files)

1. **The ground:** `createIsland(canvas, ground)` takes a BuiltGround already (2c4e4b64): pass
   `buildGround(layout.current, { renderer, look })` (it needs the renderer for its bake: create it first, or let
   createIsland hand it over); `groundLook(urls)` → `ground.look(look)` (the season's palette, rebaked); the Ground
   draws the sea, the fresh water, the falls and a deep plane under the sea, on the same `waterU` the frame loop
   drives. Cull its bands per frame as the baked chunks were (`z1 > camZ − 700 && z0 < camZ + 1500` over
   `ground.chunks()`): today a BuiltGround's meshes all stay visible.
2. **The things:** `island(day)` → `placeObjects(layout.current, day)` (the same Inst and Standin shapes). Ids are
   the layout's: the fixed decor's pieces are their spots' ids (`bench-mae`, not `fx-bench-mae`), the campsite's
   tent is `home-A` (not `tent`; `tap: 'tent'` as before), the bridge `bridge`. うめ's and the guest's homes come
   in phase 4 (`world3d/home.ts`).
3. **Live changes:** `layout.on(({ diff }) => { ground.rebuild(layout.current, diff.chunks); things.place(placeObjects(layout.current, day).insts) })`
   (`store/layout.svelte.ts`; things.ts already rebuilds only the models whose instances changed).
4. **The camera:** `CAM_Z = { min: 30, max: 1000 }` → from `extentOf(layout.current)`: `min = shore + 60` (today's
   30), `max = home[1] + 16` (today's 1000 by the campsite at 984; the campsite is now at z 2364, so 2380). Recompute
   on a layout change (the members may move the tent). `MID_X` 195 stays (the width is the same); the horizon rule
   (bend R 1300) and the shadow box (it follows the camera) need nothing; the lights' nearest-6 budget is the same
   on a longer island (more lamps in all, the same 6 at a time); the sea plane is the Ground's (4200 × 6000 round
   the grid's middle, z 1290).
5. **Walking:** `planTap(navOf(layout.current), …)` (rebuild the nav on a layout change, ~4 ms), feet from
   `ground.feet`. Named nodes: `homeA`, `homeB` (the villagers' spots), `centreStage`, `door-home-A|B|G`, the
   default's seats (`seatMaeL` … `stoolW`, `pullup`), `front-<id>` (a bulletin board's spot).
6. **world.ts constants the island still reads** (the 2D island and the DOM overlays over the 3D canvas): `HOMES`,
   `CAMS`, `CAM_MIN` / `CAM_MAX`, `CAMPSITE` / `BUILDINGS` (the tent's door), `CENTRE_STAGE`, `ARCH`, `CAKE`, `SEATS`,
   `PULLUP_AT`, `FLOWERS`, `DECOR_SLOTS`, `GOAL_TREES`, `ROCK`, `TAPE_DECK`, `BRIDGE`, `POND`, `RIVER`, `SPRING`,
   `CLIFF`, `FALLS_POOL`, `freshWhere` (fishing), `surfaceAt` (footsteps), `DIG_SPOTS`, `LAWN_SPOTS`, `BEACH_BOX`,
   `SEA_BOX`, `LAND`, `PLAN`. For the 3D island each must come from the layout: the spots and seats from `navOf`'s
   named nodes, the tent's door from `doorOf(layout, home-A)`, the flowers, the goal trees, the rock, the tape deck
   and the decor's spots from `layout.objects` (by id or kind), the water a cast lands in from
   `fieldOf(layout).surfaceAt(x, z)` (`sea`, `river`, `pond`) and a tile's tier (the clifftop), footsteps from the
   same `surfaceAt`. The dig spots, the weeds' lawn spots and the beach's finds box are world.ts's still; I'll add
   `openGrass(layout)` (free grass tiles) when the lead wants them derived.

## Not yet

- Phone terraforming (paths, water, cliffs) is the desktop editor's only, for now.
- The weeds' lawn spots and the dig spots are still world.ts's (not layout objects); once the 3D island reads the
  layout they should be derived from it (open grass tiles), so a moved pond never holds a weed.
- NH's bridges and inclines as models (BridgeWood…, SlopeBrickStair, SlopeIronStair are in the game files): the
  stone bridge is world3d's one model, the stairs are drawn stone steps.
