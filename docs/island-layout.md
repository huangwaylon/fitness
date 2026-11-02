# The island's layout (customisable outdoors, homes and interiors)

Status: **phase 1 landed (schema, ops, default migration, nav, validation, the store)**; next: terrain from the grid
(phase 2), the desktop editor (3), the homes and their interiors (4), phone editing (5). This file is the contract
between the layout work (`app/src/lib/layout/`, `store/layout.svelte.ts`, `world3d/terrain.ts`, `world3d/objects.ts`,
the editor, the homes) and the 3D integration (the scene, the camera, porting the island's features: the lead's
`world3d/engine.ts` and the rest of `world3d/`).

## The grid

- **One tile = 30 world units** = one NH tile (10 model units of NH's furniture at the island's scale, world.ts
  `DECOR_U` = 3u a model unit: a 2-tile bench is 60u, an 80u villager is NH's chibi). The tent's room uses the same
  tile (10 model units), so an outdoor footprint and a room footprint mean the same thing.
- **20 × 46 tiles**, x −90…510, z −90…1290 (`layout/grid.ts` `GRID`): the two-section island (land x −40…430,
  z −30…1260) with a ring of sea; everything off the grid is sea. Tile (c, r) covers x `−90 + 30c … +30`, z
  `−90 + 30r … +30`; `r` grows into the island (away from the camera), as world z does.
- **Chunks of 8 × 8 tiles** (3 × 6 of them; the last column and row stick out past the grid and are sea): the unit
  of a terrain op and of a terrain rebuild. The ops allow up to 8 × 8 chunks, so the grid can grow without a relay
  deploy.

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
  the seasonal spots (`beach-chair`, `sandcastle`, `snowboy`), the pieces that join terrain (`bridge` over water,
  `stairs` up a cliff), the homes (`home`) and named spots (`spot`: `villager-a|b` the villagers' home spots, `stage`).
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
  `bridge`, `stairs`; the campsite is `home-A`). The upper tier's forest steps aside for うめ's and the guest's
  houses, up the stairs, with a path to their doors. The layout a phone shows is the default with the record's ops
  over it (`layoutOf(entries)`).

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

three.js (`app/src/lib/components/world3d/`, phase 2, bent like everything else):

```ts
buildGround(layout, opts): Ground   // terrain.ts
  ground.group: Object3D            // add to the scene once: the land, the cliff faces, the water (sea, river, pond, falls)
  ground.update(layout, chunks)     // rebuild only those chunks (a paint stroke)
  ground.heightAt(x, z)             // = layout heightAt, for feetY
  ground.dispose()
placeObjects(layout, ctx): Inst[]   // objects.ts: the engine's `Inst` list (layout3d.ts's type), ids = object ids
```

What the scene would need (the lead's files, so a proposal): `engine.ground(...)` taking a `Ground` instead of the
baked chunk URLs, `feetY` from `ground.heightAt`, and an incremental `engine.set(insts)` / `engine.remove(ids)` in
place of the whole `place(list)` so one moved object rebuilds one instance.

## Not yet

- Phone terraforming (paths, water, cliffs) is the desktop editor's only, for now.
- The weeds' lawn spots and the dig spots are still world.ts's (not layout objects); once the 3D island reads the
  layout they should be derived from it (open grass tiles), so a moved pond never holds a weed.
