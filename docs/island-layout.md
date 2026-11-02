# The island's layout (customisable outdoors, homes and interiors)

Status: **phase 1 (schema, ops, default migration)**. This file is the contract between the layout work (the grid,
the ops, terrain generation, the editor, the homes and their interiors) and the 3D integration (the scene, the
camera, porting the island's features behind `?island=3d`). The API section is a proposal until the lead agrees.

## The grid

- **One tile = 30 world units** = one NH tile (10 model units at the island's furniture scale, world.ts `DECOR_U` = 3u
  a model unit: a 2-tile bench is 60u, an 80u villager is NH's chibi). The tent's room uses the same tile (10 model
  units), so an outdoor footprint and a room footprint mean the same thing.
- **20 × 46 tiles**, x −90…510, z −90…1290 (`layout/grid.ts` `GRID`): the current two-section island (land x −40…430,
  z −30…1260) with a ring of sea; everything off the grid is sea. NH's island is 112 × 96; ours is the rolling log's
  narrow strip, so it is long and thin. Tile (c, r) covers x `X0 + 30c … +30`, z `Z0 + 30r … +30`; `r` grows into the
  island (away from the camera), as world z does.
- **Chunks of 8 × 8 tiles** (3 × 6 of them): the unit of a terrain op and of a terrain rebuild.

## The layout is data

`layout/model.ts` `Layout`:

- **Terrain per tile:** one *kind* and one *tier*.
  - Kinds: `sea`, `grass`, `sand`, `dirt`, `stone`, `brick`, `plank` (path kinds), `river`, `pond`.
  - Tier 0…3: the cliff levels (0 the ground the beach and the lawn are on; each tier +40u). A tile next to a lower one
    has a cliff face on that side; river water that steps down a tier is a **waterfall** (derived, never painted).
- **Objects** (`layout/catalog.ts` kinds): trees (`oak`, `cedar`, `palm`, `bamboo`, the two `goal-tree`s), `bush`,
  `flower`, `rock`, lamps, NH's outdoor furniture, the fixed decor, the tape deck, the pieces that join terrain
  (`bridge`, `stairs`) and the homes (`home`). Each: `id`, kind `k`, tile `x, z` (its footprint's lowest column and
  row), facing `f` 0–3 (0 toward the camera), variant `s` (a bush's species, a flower's colour and kind, a lantern's
  colour…). A footprint is `w × d` tiles turned by `f`.
- **Homes:** three, fixed ids `home-A` (ウェイ's, today's campsite tent), `home-B` (うめ's), `home-G` (the guest's).
  Where a home stands is an object; how it looks is its **home style** (below), its owner's.
- **The default layout** (`layout/default.json`, `npm run layout:default` from world.ts and scatter.json): today's
  island snapped to the grid. The layout a phone shows is the default with the record's ops over it.

## Ops (the record and the relay)

All are the existing `decor` event and `decor` relay intent with a scope `sc`, last writer wins per id, the same
merge as the decorations (latest `at` on the relay's clock, then G over B over A), the record keeping each id's
latest op (slot `decor|<sc>|<id>`). An old phone ignores every new scope (its parsers refuse the key).

| `sc` | Op | Who may write |
|---|---|---|
| `o` | an object set `{id, at, k, x, z, f, s?}` or gone `{id, at, rm: true}` (not final: a later set brings it back) | A, B |
| `c` | a terrain chunk `{id: 'c<cx>x<cz>', at, g}`: `g` its 64 tiles, row by row, one character each | A, B |
| `r` | a reset `{id: 'reset', at}`: every `o` and `c` op older than it is void (the default again) | A, B |
| `h` | a home's style `{id: 'hA'\|'hB'\|'hG', at, m, w?, r?, d?}` | its owner; `hG` also A and B |
| `t` | ウェイ's home's interior (the tent's room, as before) | A, B, G |
| `u` | うめ's home's interior | B |
| `v` | the guest's home's interior | G |

The server enforces it (`contract/layout.ts` `scopeMayWrite`, used by the record and the room): the guest can never
write an outdoor op.

## Derived, never hand-made

- **Nav** (`layout/nav.ts`): a walk grid at half a tile from the layout: water, cliffs (a tier step without stairs),
  the sea and every blocking footprint block; stairs join two tiers; a bridge's deck crosses its water. A* with the
  corners pulled straight. `navOf(layout)`, `findPath`, `walkable`, `snapTap`, `reachable`.
- **Validation** (`layout/validate.ts`): `validate(layout)` → issues (each with its tiles): an object off the land or
  on water, two footprints over each other, a path or stairs that joins nothing, a water body of an invalid shape (a
  diagonal-only touch, a pond with river tiles, water on a cliff edge without a fall), a home without a clear door
  tile, a missing or second goal tree, a villager's home spot or a named spot that can't be reached.

## API for the 3D scene (proposal)

Pure (`app/src/lib/layout/`, no three.js):

```ts
layoutOf(entries: Iterable<LayoutEntry>): Layout          // the default with the ops merged over it
layout.tile(c, r): { kind, tier }; layout.objects: ReadonlyMap<string, Obj>; layout.homes: Record<Who, HomeStyle>
heightAt(layout, x, z): number                             // the ground's height (feet, taps)
navOf(layout): Nav; findPath(nav, from, to); snapTap(nav, x, z)
diffLayouts(a, b): { chunks: number[]; objects: { add: Obj[]; move: Obj[]; remove: string[] } }
```

three.js (`app/src/lib/components/world3d/`, bent like everything else):

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
place of the whole `place(list)` so one moved object rebuilds one instance. `store/layout.svelte.ts` gives the live
layout and an `on(change)` with what changed.

## Not yet

Phone terraforming (paths, water, cliffs) is the desktop editor's only, for now.
