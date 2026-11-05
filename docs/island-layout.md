# The island's layout (customisable outdoors, homes and interiors)

The layout: the schema, the ops, the default, the nav, the checks and the store (`app/src/lib/layout/`,
`store/layout.svelte.ts`); the 3D ground and objects from it (`world3d/terrain.ts`, `world3d/objects.ts`); the desktop
editor; the homes, their looks and their rooms; the phone's もようがえ. Phone terraforming is the editor's alone.

## The grid

- **One tile = 30 world units** = one NH tile (10 model units of NH's furniture at the island's scale, world.ts
  `DECOR_U` = 3u a model unit: a 2-tile bench is 60u, an 80u villager is NH's chibi). The tent's room uses the same
  tile (10 model units), so an outdoor footprint and a room footprint mean the same thing.
- **20 × 60 tiles**, x −90…510, z −90…1710 (`layout/grid.ts` `GRID`): the long island (land x −30…480, z −30…1680:
  the user's call, 2026-11-02, first twice today's length, then 60 tiles: room for the homes and what comes) with a ring of
  sea; everything off the grid is sea. Tile (c, r) covers x `−90 + 30c … +30`, z `−90 + 30r … +30`; `r` grows into
  the island (away from the camera), as world z does. Read the extent from the layout (`model.ts extentOf`), never
  a constant.
- **Chunks of 8 × 8 tiles** (3 × 8 of them; the last column sticks out past the grid and is sea): the unit of a
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
  the villagers' home spots; `stage`, the old fixed visitors' spot, kept but unused: the stage is derived).
  Each: `id`, kind `k`, tile `x, z` (its footprint's lowest column and row), facing `f` 0–3 (0 toward the camera, −z;
  1 +x, 2 away, 3 −x), variant `s`. A footprint is `w × d` tiles, turned by `f` for the kinds that `turn` (a bench);
  for the others an odd `f` only mirrors the look.
- **On the grid:** every object's spot is a tile (a footprint's middle a tile's middle, or a tile line for an even
  side). The model still reads an `n` offset (the first default had them) but nothing sets one now.
- **Homes:** three, fixed ids `home-A` (ウェイ's, the campsite's tent), `home-B` (うめ's), `home-G` (the guest's).
  Where a home stands is an object; how it looks is its **style** (`layout/homes.ts`: `{m, w?, r?, d?}`), its owner's
  alone. A home's `(x, z)` is its door's tile (the front row's middle, the left of two: `model.ts originOf`), so a new
  look's footprint grows round its door and the door stays put; see "Homes" below.
- **The default layout** (`layout/default.json`, `npm run layout:default` from world.ts and scatter.json): today's
  island on the grid, world.ts's ids kept (`goal-A`, `hedge-3`, `bench-mae`, `fl:52:180`, `tape-deck`, `rock`,
  `bridge`, `stairs`; the campsite is `home-A`), made long: today's まえ (the sea, the beach, the health
  lawn, the goal trees, the stream's crossing and its bridge) at the front as it is; today's おく (the campsite, the
  pond, the bamboo, the falls, the upper tier's forest; world.ts z ≥ 680) moved 420u (14 tiles) back
  (`layout/migrate.ts` LONG_SPLIT / LONG_GROW); between them a new middle: open grass to build on, the stream running
  on down its east side, the main path through it to the campsite, うめ's house (rows 29…31) and the guest's (34…36)
  with paths to their doors and a lamp at each, a few trees at the edges, three bushes, two clumps of flowers.
  **Every piece on the grid** (the user): no offsets; each snapped to its tile, a piece whose tile is taken (or on a
  path, the water, off the grass for a tree or a flower) moved to the nearest free tile round it (the homes and the
  structures first, the flowers last), so no two share a tile (`layout.test.ts`). The layout a phone shows is the default
  with the record's ops over it (`layoutOf(entries)`).
- **The island reads the layout** on every phone.

## Ops (the record and the relay)

All are the existing `decor` event and `decor` relay intent with a scope `sc`, last writer wins per id, the same merge
as the decorations (latest `at` on the relay's clock, then a removal, then G over B over A), the record keeping each
id's latest op (slot `decor|<sc>|<id>`). An old phone ignores every new scope (its parsers refuse the key).

| `sc` | Op | Who may write |
|---|---|---|
| `o` | an object set `{id, at, k, x, z, f, s?}` or gone `{id, at, rm: true}` (not final: a later set brings it back) | A, B |
| `c` | a terrain chunk `{id: 'c<cx>x<cz>', at, g}`: `g` its 64 tiles, row by row, one character each | A, B |
| `r` | a reset `{id: 'reset', at}`: every `o` and `c` op older than it is void (the default again); the record drops them | A, B |
| `h` | a home's style `{id: 'hA'\|'hB'\|'hG', at, m, w?, r?, d?, f?}` (`f` its facing 0–3) | its owner alone |
| `t` | ウェイ's home's interior (the tent's room, as before) | A, B, G |
| `u` | うめ's home's interior | B |
| `v` | the guest's home's interior | G |

- The server enforces it (`contract/layout.ts` `scopeMayWrite` in the record, `live-protocol.ts` `scopeMaySend` in the
  room; tests in `relay/test/guest.test.ts`): the guest can never write an outdoor op.
- A room scope (`t`, `u`, `v`) is contract/tent.ts's op: its own ids, its own cap of 60 pieces.
- The room relays a layout op live but never keeps it in the day's ring (an afternoon in the editor would push the
  shared world out of it); a phone opening later reads it from the record. A `drag` with `sc: 'o'` is an outdoor
  object being moved (x, z its middle in world units): presence, as the tent's.
- Ids: a default object's (`goal-A`, `fl:52:180`), a new one `o<time><random>` (`model.ts newObjId`); tokens
  (`k`, `s`, `m`) are lower-case; home parts (`w`, `r`, `d`) `[A-Za-z0-9.]`.

## Derived, never hand-made

- **Heights** (`layout/height.ts` `heightAt(layout, x, z)`, `fieldOf(layout)` for the ground alone, the rounded tier
  and surface): each tier 40u; grass and paths 3u over it, sand 1.2u, the river's and the pond's bed 9u under the
  bank, the seabed falling away from the shore. Every region's corners are NH's rounded ones (a convex corner cut, a
  concave one filled), so cliffs, banks, the beach and paths never show a square corner: the cliffs on a third of a
  tile (their walls), the soft edges (below) on half a tile, a staircase of tiles drawn a straight diagonal. Stairs
  ramp from their tier to the next along their facing; a bridge's deck arches over its water.
- **Nav** (`layout/nav.ts` `navOf(layout)`): a walk grid at half a tile (15u): water and the sea block (a bridge's deck
  is walkable over them), so does every blocking footprint (its kind's block box, padded 5u: a trunk, not its whole
  tile); a step keeps to its tier but on stairs (a ramp's cells rise along it). A* with the corners pulled straight;
  `findPath`, `snapTap` (home → its door, water → the nearest bank, else the nearest walkable point), `walkable`,
  `reachable`, `named` (`homeA`, `homeB`, `door-home-A|B|G`, the default's seats `seatMaeL`…
  `stoolW`, `pullup`). **A drop-in for planTap:** `planTap(navOf(layout), from, x, z)` (tapWalk.ts takes either nav).
  Builds in ~4 ms.
- **The visitors' stage** (`layout/spots.ts` `stageOf(layout)`, NH's plaza): the members' plaza mark when one is put
  down and usable (below), else the open grass tile nearest the island's
  middle 200u behind the villagers' spots (in view as the camera opens at まえ), with a tile clear on each side, behind
  and in front (no path, water, door or thing on it), nothing tall in front of it on screen (a tree's canopy, a home,
  a villager at its spot) nor right behind it; looser if none has that. `washedUp(layout, date, seed)`: Gulliver's
  beach, his mark's tile when one is put down and usable, else a free sand tile two in from the sea in the beach's
  middle, by the date. The day's weeds and fossils keep off the stage; the wedding's arch and a birthday's cake stand
  by it (layoutWorld.ts ARCH, CAKE), the idle walks keep off it (nav `centreStage`), a balloon's present lands clear of
  the visitor drawn there. Pure: every phone with the layout agrees, and a もようがえ moves them.
- **The visitors' spots** (catalog.ts group `visitor`, kinds `plaza` おきゃくさんの ばしょ and `beach-spot` ジョニーの
  ばしょ, `one`: one each on the island, removable): a mark the members put down, never drawn in play, standing on
  nothing (no ground taken, no overlap, no block, the weeds' open grass unchanged). **Two marks cover everyone:**
  every visitor but Gulliver stands at centre stage (K.K.'s show, Wisp, Celeste, the hosts, the wedding couple too),
  so one plaza places them all; Gulliver alone lies elsewhere (the beach, a new stretch by the date), so his is its own
  and optional. A night stage of K.K.'s own would be a third spot with no visitor of its own to justify it.
  `markerSpot(layout, k)`: the latest put down (two phones at once: the later id; the phone's ✓ removes the other),
  where they stand (`at`, the tile's middle) or `at: null` when nobody can now. Usable: the plaza's `plazaOk` (grass or
  a path, the stage's clear 3 × 3 patch round it, its tier's, for the arch behind and the cake in front, and
  reachable; what stands in front of it on screen is the members' choice), Gulliver's `beachOk` (sand with sand each
  side, nothing a tile round it nor three behind, reachable). Unusable (something put on it, the ground repainted):
  the derived spot, and validate.ts's `visitor-spot` warning (the editor's bar, the plan's issues). An ordinary
  `sc: 'o'` object op: the contract takes any kind token (no relay change), and an older app keeps an object of a kind
  it doesn't know without drawing it.
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
  edge: the land, the beach's sand, the fresh water, the paths, each tier. The heights, the bake, the sea's shore wash
  and the fresh water's edge all read them, so every edge is soft and round and follows the tiles (~30 ms for the whole
  island on a desktop).
- **Soft edges** (the user, 2026-11-02: "smooth the coast and grass edges", NH's coast is round): the terrain data
  and the objects stay on tiles, only the drawn edge is round. The coast (land/sea), the beach's sand (grass/sand),
  the fresh water and the paths are rounded on **half a tile**; a convex corner whose two diagonal neighbours carry the
  region on (a staircase of tiles) is cut **straight** through its edges' middles, and a concave one filled to the same
  line, so a diagonal of tiles is a diagonal shore, river or path; then each soft field is box-blurred (2 cells, twice:
  a straight edge stays exactly on its tile's side, a one-tile path keeps its breadth, the kinks and the raster's
  steps round off). Where a tier's wall stands (a plateau's cliff to the sea), a corner keeps the cliff's exact third
  of a tile, so the sand meets the wall's foot. A river runs out to the sea square (the sea counts as its own for the
  corners). The tiers' fields (the walls, the cliff tops) are untouched. Consequences in the 3D ground: the fresh water's
  surface also goes on a bank's tile (same tier, beside fresh water) where the filled corner dips it under; its edge
  fades on the field (`FRESH_FRAG`, dW −1.2…−2), not where the 5u mesh crosses it; the seabed is continuous at the
  shoreline (no 1.5u step: the mesh's cells showed through the shallows as teeth); a path's rounded-out corner takes
  the nearest path tile's kind in the bake (`pathTile`). The editor's plan stays tile-exact; its 3D preview is the
  same ground. Cost: no new draws or textures (one more fetch in the fresh water's shader), +~130 water triangles on
  the default island, ~+10 ms a field rebuild (desktop).
- **The river's turns** (`layout/river.ts`; the user, 2026-11-03: "for the straight parts, keep it straight … if I
  have a straight line down, then go 45 degree down and left, then straight left, I want the 45 degree down to be a
  quarter circle curve"): each river's main stem (its tiles from the far end to the sea, a fall or a pond) is drawn as
  straights and circular arcs, one breadth (13.5u a side; broader at the mouth), and the fresh water's field, the flow
  and the streaks' way along follow it. A **straight** is a run of 3+ tile steps one way (or the run at either end),
  drawn exactly on its tiles' middles. Between two straights the tiles that turn (a staircase, a jog's step) give a
  line through their middle; two straights at an angle with a staircase between are **one arc** tangent to both, its
  radius the one that passes through the staircase's middle (the default's and the user's stream: R 5.7 tiles, 90°),
  a little smaller if the tiles or a bridge say; where one circle can't (a long staircase) it's an arc at each end of
  the diagonal. A **plain L** (two straights meeting on a tile) gets a small fillet (0.75 tile). Every arc shrinks
  until its middle is on water and its banks within `EDGE_TOL` (0.3 tile) of water tiles, and stays within 3u of its
  straight where it passes a bridge (the deck square across the water). Pinned at the ends (the mouth, a fall's lip,
  a pond). A river mostly not one stem (painted broad, a delta) keeps its tiles. The data stays on tiles: walking,
  fishing and casts go by tiles. The editor marks it on the plan (`かわの せん`, on by default): the centreline, the
  banks dashed, each arc orange with its radius in tiles and its angle; `/editor?check` lists the arcs (かわの カーブ).
- **The look is baked on the GPU** (`world3d/terrain.ts`): one shader paints each band's texture from the fields and
  the tiles, NH's way (grass with its flecks, NH's own grass pattern, the beach going wet at the sea and
  the seabed deepening under it, the dirt path worn with its pebbles, NH's stone, brick and plank textures, a river's
  earthy rim and its bed, a shade at a cliff's foot), once at load and again only for what a change touches. The
  season's palette (`ground.look`) rebakes it all.
- **Bands:** the ground draws a row of chunks across the island as one: 4 draws (the ground, the walls, the falls,
  the fresh water), one 960 × 384 texture (1.6 px a unit, ~21 MB for the whole island with mips), so the draw calls
  stay flat however long the island grows; the camera shows ~6 of the 12. Measured in the editor's phone view at
  393 × 852 (×3, desktop Chrome): 78–94 draws (the models' instancing and the shadow pass included), 180–230k
  triangles, 60 fps; the island's first build ~0.4–1.2 s with the models' loading.
- **The water:** NH's sea round the island (the shore foam where the land's field says; the shallows' turquoise
  reaching ~70u out, twice the old band, then a long ~200u fade into the deep blue, opaque only far out: the user,
  2026-11-03, "the transition from shallow water to deep water is very sudden, fish are very hard to see". A fish's
  shadow reads under the see-through water across the fishing range. Near the shore the bake's bed shows through; past
  the field's reach (FAR) the bed is the deep plane's blue, and the deep plane is lit as the ground is, so the grid's
  edge never shows through the water at dusk or night), NH's waves washing ashore (`layout/swash.ts`, design.md "The sea's wash"): a point's place on
  the shore is its land distance less the waterline (1.7u, where the sea's surface meets the beach), its wave's phase
  its nearest shoreline point's (the point less the field's normal, from two more taps of the field, times its
  distance); the ground's top material draws the run-up, the foam and the wet sand on the beach at the sea's level,
  the sea's shader the incoming foam line and the backwash in the water: one rhythm, the same maths (SWASH_GLSL) on
  both and on the CPU (what washes in rides a wave: Finds), the rivers' flow (each tile's way down, breadth-first along the river to the sea
  or a fall) and the ponds' ripples, the falls' streaks; all on water.ts's shared clock, tint and fog uniforms.
  The river's look is the hand-made river's (the user, 2026-11-03: "the river water animation still isn't as good as
  the original"; `water.ts` RIVER_FRAG / FOAM_FRAG, the /world3d era): on a stem its streaks run on the length along
  the stem and across it (each water vertex's `path`, from `fields.along`), not on the world's position turned to the
  flow, which sheared into seams and swirls at a bend and worse the farther up the island; 26 u/s (no slowing at the
  banks), hurrying to 90 u/s and whitening over the last 22u before a fall's lip, a fast white sheet on it; a foam
  pool churning over the first 34u below a fall (`flow.w`, no extra draw); glints riding the current. The falls'
  wall: long streaks a few u across at 110 u/s over NH's streak texture, in world units (its ×90 octave was finer than
  a pixel and shimmered as static). Off a stem (a broad reach) the tiles' flow as before.
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
placeObjects(layout, day): { insts: Inst[]; standins: Standin[] }   // objects.ts: the engine's instances, from the layout
  day = { season, foliage, month, swaps?: swapsOn(date), pieces?: piecesOn(date, hour, seed), fruit? }
extentOf(layout): { grid, land, shore, home }   // model.ts: the island's box, the front shoreline's z, ウェイ's door
```

## The editor (phase 3)

`/editor/` (`routes/editor/+page.svelte`, `components/editor/`: `Editor.svelte`, `plan.ts` the canvas,
`edits.ts` the edits, `Preview3D.svelte`): unlinked, noindex, the members' only (the browser paired with the A or B key
at `/pair`; the guest's key gets 「ウェイと うめだけが つかえます」, and the record refuses the guest's outdoor ops
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
- **`?check`** (`world3d/drawCheck.ts undrawn`): a 3Dの チェック panel listing each object the phones' 3D island
  doesn't draw as a model (placeObjects run as the island runs it, a day of each season), and why: an unknown kind, a
  card of 2D art, nothing at all (a look with no model and no art), a model file missing; a click selects it. What's
  drawn elsewhere (NH-part homes, bridges and stairs, the board, spots, seasonal spots out of season) isn't listed.
- **Files:** JSON に かきだす / JSON を よみこむ (model.ts `toJson` / `fromJson`; an import is one action: undo takes it
  back), はじめの しまに もどす behind a confirm (the reset op: every object and chunk op before it void, the homes' looks
  kept).
- **The e2e** (`e2e/editor.spec.ts`): a move reaches the other tab's layout live and stays across a reload; a stroke
  and its undo / redo; R; Delete refusing a goal tree; placing (refused on the river); reset; the guest's door.

## Homes (phase 4)

- **The catalogue** (`layout/homes.ts`, `homes.json`; `npm run home-models` with NH_MODELS converts NH's House*
  parts into `static/room/homes/`: 63 families, 2.8 MB, each part's GLB in its first colour, every other colour's
  albedo beside it, a 48px swatch per colour, NH's own picker icons for the doors and the player house):
  - `campsite`: today's campsite tent (ウェイ's by default);
  - `tent-n` (`w` 'A' | 'B'): NH's move-in tent; `tent-p`: the player's first tent;
  - `house`: NH's modular house, `w` a wall (`PA04Stucco.B`: the player house's four walls, or a villager house's:
    NA ようふう, NB ログハウス, NC わふう, ND こや, each its materials), `r` the same shape's roof, `d` one of NH's 14 doors
    (`Simple.R.A`: round or square), each part in its colours (6–10). A roof of another shape is mended to the wall's.
  - Footprints by shape (3u a model unit: NH's 10 model units a tile): the player house 5 × 3, a villager house
    4 × 3 (ND 4 × 4), the move-in tent 3 × 3, the player's tent and the campsite 4 × 3; the porch inside the front row.
- **The defaults:** うめ's NH's player house (stucco, a western tile roof), the guest's a villager's log house (a
  thatched roof), both in the middle with paths to their doors.
- **Drawing them** (`world3d/home.ts buildHome(style)`: a Group of the three parts at 3u a model unit, NH's soft
  Lambert, a lamp's own glow; `world3d/objects.ts homePlaces(layout)`: each built home's origin, its front wall's
  middle, and its yaw; the campsite's tent stays placeObjects' instance).
- **いえを かえる** (`components/homes/HomePicker.svelte`): the owner's own, in their home's room (the button by
  もようがえ) and in the editor (わたしの いえ). The kind (いえ, テント, ちいさなテント, キャンプのテント), the shape, the wall's
  and the roof's materials and colours (swatches; NH's icons for the player house), the door (NH's icons, round or
  square, its colours); the house turning in a preview as it's chosen. A look that wouldn't fit where the home stands
  (a footprint over something, off the land, over water, across a cliff, its door walled in) is refused there, so the
  island stays valid; これにする sends the `h` op. Only the owner may (`scopeMayWrite`: `hA` A, `hB` B, `hG` G).
- **The rooms:** every home's inside is the tent's room system (`routes/tent/?home=B|G`, `TentRoom.svelte`'s `home`;
  `store/tent.svelte.ts` `rooms.A` the tent's `t`, `rooms.B` うめ's `u`, `rooms.G` the guest's `v`: their own pieces,
  their own cap, the same ops), the same 8 × 8 room whatever the outside (so a new look never breaks a room). Its
  owner arranges it (the tent's by all three) and switches its light; anyone may come in and see it. Presence says
  which home (`tent` and `drag` with `sc`): one place at a time (`store/where.svelte.ts` `home`: who's in which).
  Out of the door: just in front of that home's door on the layout.
- **The e2e** (`e2e/homes.spec.ts`): うめ arranges her room (her piece in her room only, kept), the guest comes in and
  sees it but can't arrange it; うめ swaps her house's look and the other phone holds it live; the guest swaps its own.

## The island's buildings

- **The kinds** (`catalog.ts` group `building`, `door: true`): the museum (`museum`, はくぶつかん, NH's 7 × 4, one to
  an island, `fixed`: never deleted, moved and turned freely) and the shop (`shop`, タヌキ商店, NH's Nook's Cranny, the
  same 7 × 4 and rules: [design](design.md#the-shop)). A
  building's door is the middle of its front edge (`model.ts doorOf`, as a home's, but its `(x, z)` is its footprint's
  own back-left tile); its door's tile must stay clear and reachable (`validate.ts` `door`); `nav.ts` keeps it in
  `doors` (no padding round its footprint, `door-<id>` named, a tap on it snaps to its door: `catalog.ts goesIn`).
- **Drawn:** NH's StrcMuseumA02 and its doors (`npm run world3d-models -- --only=museum`: static/room/world3d/museum.glb,
  models.json), at NH's building scale (3u a model unit), its steps on the footprint's front edge (`objects.ts`
  placeObjects). On the island it's a building (`island/layoutWorld.ts` BUILDINGS `museum`: its tap area, its door) and
  a tap on it walks up and goes in to `/museum` (IslandScene goInto); the editor's plan draws it as a home is drawn,
  named, its door marked; its palette and the phone's tray (たてもの) offer it only while the island has none.
- **The default** puts it at the back, on the clifftop behind the campsite (`scripts/layout-default.ts` MUSEUM: tiles
  6…12 × 54…57, its door's row kept clear; the clifftop's cedars claim their tiles after it). An island arranged
  before it came (the record) may hold something there: then, once, a member's phone moves it to the free spot nearest
  its default, facing the camera if it can (`layout/buildings.ts` buildingOps: one `o` op of its id, as the editor's
  move; the guest never sends one; an island where it has an op of its own is left as it is). IslandScene runs it after
  the record's rows (`layout.placeBuildings()`). A spot is had three ways, in turn: on clear ground; else clearing
  flowers (only flowers: never a tree, a bush, furniture, or a path under it; at most 12, each an `o` removal before the
  building's op, as the editor's); else, the last resort, over a path. Each must leave every named spot reachable. On
  the record of 2026-11-03 (the user's own cedars on the clifftop) it clears one flower and stands turned on the west
  lawn, tiles 4…7 × 11…17 (`buildings.test.ts`).
- **The shop** the same way: NH's StrcMarketA02 and its doors with the Japanese sign (タヌキ商店:
  `npm run world3d-models -- --only=shop`, 129 KB), `/shop`; the default puts it in the middle, west of the main path
  behind うめ's home, its door a step off the path (`layout-default.ts` SHOP: tiles 2…8 × 34…37). うめ's home stands two
  rows nearer the bridge (HOME_B: its roof hid the shop's door), the middle's own oak goes east of the path and its two
  cedars are gone (nowhere else clear of the stream's bank, the doors and the decor the specs tap), its clump of flowers
  either side of the door; nothing of today's island moves. On the user's island all of
  these have ops of their own but one flower (`mid-fl-3`, a tile from where it stood). まえ's lawn and the river's
  banks stay as they were: the specs that walk on open
  lawn ask the page for it (`e2e/island.ts` `lawnTap`, `openNear`) rather than tapping a fixed point a building may come
  to stand on. On the record of 2026-11-03 the museum takes the one spot that only clears flowers and the shop stands
  over the campsite's path at the back, tiles 8…14 × 46…49. On the user's island of 2026-11-04 (flower borders down
  both sides, the main path between, no 7 × 4 spot clear; the museum would have straddled the main path across the
  front lawn and left the shop none) the museum clears four of the west border's flowers (tiles 2…8 × 12…15) and the
  shop four of the east's (tiles 10…16 × 11…14), either side of the main path on the front lawn.

## Turning a home

A home's facing (`f`, 0–3) is part of its look (the `h` op's `f`), so only its owner turns it, and the record and the
room refuse anyone else's; an outdoor op (a member moving it) never changes it (model.ts layoutOf keeps the owner's).
It turns about its door's tile (model.ts originOf), the door, the footprint, the walk-up spot (`door-home-*`), the
model's yaw (homePlaces) and the way out of its room (TentRoom's outOfHome) with it. A turn that would wall the door
in or put the footprint over something is refused: in the editor R / the wheel (the owner's own home only; a toast
says why not), on the phone's もようがえ the ↻ button (shown only to the owner), and いえを かえる's ↻ まわす (the guest's
way to turn its own house).

## The day's spots, the structures, the old decorations

- **Weeds and fossils** (`layout/spots.ts` daySpots): 15 weed spots and 6 dig spots a day from the layout's open
  grass (a grass tile nothing stands on, off the paths, the water and the banks, away from a door, a board's front,
  a named spot and the stairs, one a walker reaches), spread out, seeded by the date and the island's seed: the same
  on every phone. `beach.ts useSpots(layoutSpots(() => layout.current))` switches the island's weeds (care.ts) and
  fossils (beach.ts digSpots) onto them; before the layout's applied, world.ts's spots (`island/site.svelte.ts` calls it).
- **NH's bridges and inclines** (`npm run structure-models`: 8 bridges, NH's shortest span; 6 inclines: stone, brick,
  iron, wood, log, natural; `world3d/structure.ts`): `structurePlaces(layout)` + `buildStructure(place)` → a group
  to attach at `(x, ground.heightAt(x, z), −z)` (a bridge at its banks' feet − 6), its yaw set. The stairs are NH's
  2 × 4 (rising one tier over four tiles). Island3D attaches them, with `structures: true` to placeObjects (no
  world3d bridge instance) and `stairs: false` to buildGround (no drawn steps).
- **The old もようがえ's decorations** (`layout/migrate.ts`): each member's phone moves its own (by the decoration's
  last placer) into the layout once, as `o` ops `m-<its id>` on its tile (おく's z moved back as the default's), kind
  and facing kept (`layout.migrateDecor`, from IslandScene with the record's decorations); already moved (any op of
  that id, a removal too) never again; the guest has none. The island draws the layout's copy, not contract/decor's.

## Phone editing (phase 5)

`components/layoutEdit/IslandEdit.svelte`: the island's もようがえ on the phone, the tent's way (TentEdit's tray, bar
and buttons). The tray's tabs (き, かんぼく, はな, いわ, あかり, かぐ, ジム (the gym: design.md "Decorating"), はし・さか, たてもの, おきゃくさん (the
visitors' spots, above: their marks drawn over the ground only in the mode, a soft tile and its sign, red when nobody
can stand there now with the reason in the bar; the usual spot a dashed ring while no plaza is down; the tray's item
picks up the one there, so placing it again moves it, and with something held a tap on a mark puts it there)) over every placeable kind (the ten
decorations of island/decor.ts are layout kinds now too: いしどうろう … いちりんしゃ, cards of their renders in 3D until
they have models); a tap on one puts it down as a ghost on the free tile nearest the view's middle, its footprint on
the ground green or red, the bar saying why (the checks' reason); a finger on it, or on any placed thing (picked up,
its model hidden), drags it a tile at a time; a tap on the ground moves it there; ↻ まわす, ✕ やめる, ✓ ここに おく,
🗑 しまう (never for a goal tree, a home, the island's one-offs). While held, the other phones see it move (`drag`,
`sc: 'o'`); a drop is its ops at once. The members' only (the guest gets no もようがえ; the record refuses it anyway).
**Terraforming on the phone (paths, water, cliffs) is deferred:** the desktop editor's alone for now.

It runs over any stage: `{ host, toScreen(x, z, lift), toGround(sx, sy), size(), hide(id) }`. The editor's phone
view gives it one (`/editor/?view=phone&edit`: the 3D island's camera and bend, `&cam=<z>` its spot; `&preview=0` a
flat plan, the e2e's; `?view=orbit` the 3D preview, `&eye=x,y,z&at=x,y,z` its camera). On the island, IslandScene
mounts it while せってい → もようがえ is open, the stage from the World (`host` the scene element, `toScreen` = `world.at(x, z, lift)` in its px, `toGround` =
`world.worldAt(sx, sy)`, `hide(id)` = `things.over(id, { hidden: true })` / `over(id, null)`). The e2e:
`e2e/island-edit.spec.ts` (a new piece placed and on the other phone; a placed one picked up, dragged and put down;
red over the river; no 🗑 for a one-off; none for the guest), `e2e/visitor-spot.spec.ts` (the plaza put down, moved
and taken away, Kicks on it on both phones; a bench on it: red, the warning, the usual ring).

## How the 3D island reads it

- **The ground:** `createIsland(canvas, ground)` with `buildGround(layout.current, { renderer, look })` (the season's
  palette: `ground.look(look)`); its bands culled per frame (`ground.chunks()`, engine.ts).
- **The things:** `placeObjects(layout.current, day)`; ids are the layout's (the fixed decor's spots' ids, the
  campsite's tent `home-A` with `tap: 'tent'`, the bridge `bridge`).
- **Live changes:** `layout.on(({ diff }) => …)` rebuilds the changed ground chunks and things
  (`store/layout.svelte.ts`; things.ts rebuilds only the models whose instances changed).
- **The camera's ends** from `extentOf(layout.current)` (the shoreline + 60, the far home's door + 16), recomputed on
  a change; `MID_X` 195.
- **The homes:** `homePlaces(layout.current)` → `buildHome(style)` attached (rebuilt on `diff.homes`); a tap on
  `home-B` / `home-G` walks to its door and goes in to `/tent?home=B|G` (the campsite's to `/tent`; back out, the
  room drops `home`); their lamps `homeTod`.
- **The gameplay:** `island/site.svelte.ts` `site.on` (always): `island/layoutWorld.ts worldOf(layout)` derives every
  value world.ts exports (`HOMES`, `CAMPSITE` / `BUILDINGS`, `CENTRE_STAGE` / `ARCH` / `CAKE`, `SEATS` / `PULLUP_AT`,
  `SCENERY`, `DECOR_SLOTS`, `FLOWERS`, `GOAL_TREES`, `ROCK`, `TAPE_DECK`, `RIVER`, `POND` / `SPRING`, `CLIFF`,
  `BRIDGE`, `SHORE_Z`, `LAND`, `SEA_BOX`, `BEACH_BOX`, `CAMS`, `LAWN_SPOTS` / `DIG_SPOTS`; `surfaceAt`, `freshWhere`,
  `inRiver`, `onLand`, `onGrass`) and `setWorld` swaps them in (ES live bindings; a cache keys on `worldGen()`; a DOM
  overlay reads `site.rev`). Before it's applied (and in the unit tests), world.ts's own.
- **The walk:** layout/nav.ts's (`nav.ts walkNav()`: the layout's grid with the island's named spots, `homeA`,
  `homeB`, `centreStage`, `door-home-A|B|G`, the default's seats, `front-<id>`) for a tap; walkGraph.ts's geo for the
  idle walks and the visitors.
- **The decorations:** Decor.svelte draws the layout's decoration objects as tap areas only (placeObjects draws them).
- The e2e: `e2e/layout-island.spec.ts`; unit: `island/layoutWorld.test.ts`.

## Not yet

- Phone terraforming (paths, water, cliffs) is the desktop editor's only, for now.
