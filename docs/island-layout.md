# The island's layout (customisable outdoors, homes and interiors)

The layout's schema, ops, default, nav and checks (`app/src/lib/layout/`, store `store/layout.svelte.ts`), the 3D
ground and objects built from it (`world3d/terrain.ts`, `world3d/objects.ts`), the editor and the homes. The island is
arranged in /editor only.

## The grid
- **One tile = 30 world units** = one NH tile (world.ts `DECOR_U` = 3u a model unit); rooms use the same tile.
- **20 × 156 tiles** (`layout/grid.ts` `GRID`), x −90…510, z −90…4590, tile (c, r) at `−90 + 30c`, `r` growing away
  from the camera. Off the grid is sea; all-sea bands cost nothing (`mesh.ts openSeaRow`, `fields.ts rasterRows`). Read
  the extent from the layout (`model.ts extentOf`), never a constant.
- **Chunks of 8 × 8 tiles**, the unit of a terrain op; ops allow 16 × 32 chunks, so the grid grows without a relay
  deploy (contract/layout.ts).

## The island's size
`layout/resize.ts` `resizeEdge(layout, edge, ±n)` → `{ codes, blocked }` (editor's 島 panel; one action, one burst):
an edge's outermost land a tile out or in. `MARGIN` (2) tiles of sea round the land, at least `MIN` (6) across; the
default 15 × 57 can grow to 152 rows. What's in the way moves to its nearest clear tile (`moveInside`, `clearTile`),
`fixed` and biggest first; a stuck fixed one blocks. The camera centres on the land box (`model.ts midXOf`).

## The layout is data
`layout/model.ts` `Layout` (`codes`, `objects`, `homes`):
- **Terrain per tile**: code `kind × 4 + tier` (base 36). Kinds (`grid.ts KINDS`, never reordered): `sea`, `grass`,
  `sand`, `dirt`, `stone`, `brick`, `plank`, `river`, `pond`; tiers 0…3 (+40u each); cliffs and falls derived.
- **Objects** (`layout/catalog.ts` `KIND_LIST`: footprint, blocking, ground, height, icon, names): trees (`goal-tree`),
  bushes, flowers, rocks, lights, NH furniture, `board` and `kk-stool` (one each, used from the tile in front),
  `bridge`, `stairs`, homes, buildings, spots (`villager-a|b`). Each: `id`, `k`, tile `x, z` (lowest column and row),
  facing `f` 0–3 (0 toward the camera), variant `s`.
- **Homes**: `home-A`, `home-B`, `home-G` (the guest's); placement is an object, the look a **style**
  (`layout/homes.ts` `{m, w?, r?, d?}`) only its owner sets; `(x, z)` is the door's tile.
- **The default** (`layout/default.json`): まえ (beach, lawn, goal trees), おく (campsite, pond, falls, forest). A
  phone's layout = the default + the record's ops (`layoutOf(entries)`).

## Ops (the record and the relay)
All are `decor` events/intents with a scope `sc`; per id, latest `at`, then removal, then G > B > A; the record keeps
each id's latest (`decor|<sc>|<id>`); an old phone ignores unknown scopes.

| `sc` | Op | Who |
|---|---|---|
| `o` | object `{id, at, k, x, z, f, s?, on?}` or `{id, at, rm: true}` (`on`: "Table tops") | A, B, G |
| `c` | terrain chunk `{id: 'c<cx>x<cz>', at, g}` (64 chars) | A, B, G |
| `r` | reset `{id: 'reset', at}`: older `o`/`c` void | A, B, G |
| `h` | home style `{id: 'hA'\|'hB'\|'hG', at, m, w?, r?, d?, f?}` | owner |
| `t`, `u`, `v` | the three homes' rooms (contract/tent.ts, `TENT_MAX` 120) | A, B, G |

- Enforced by `contract/layout.ts` `scopeMayWrite` (record), `live-protocol.ts` `scopeMaySend` (room);
  `relay/test/guest.test.ts`. The room relays ops live, keeps none; `drag` with `sc: 'o'` is presence.
- **A burst** (`week.sendMany`): one queue write, one rebuild; the room takes 20 at once, then `busy`.
- **Two edits on one tile**: only the later op's phone moves its piece aside (`layout/resolve.ts clearTile`,
  `resolveMoves`). New ids `o<time><random>` (`model.ts newObjId`).

## Derived, never hand-made
- **Heights** (`layout/height.ts` `heightAt`, `fieldOf`): NH's rounded corners; stairs ramp, bridges arch.
- **Nav** (`layout/nav.ts` `navOf`): half-tile grid, A* (`findPath`, `snapTap`, `reachable`, `planTap`). Stairs only
  along their climb; an arch's posts block, its way through doesn't (`archTiles`); today's empty seasonal spots block
  nothing (`navOf(l, bare)`, `fixedDecor.ts emptySpots`, `site.bare`).
- **Arches over water** (`standLift`): a piece whose way through spans water stands on its posts' highest bank.
- **The visitors' stage** (`layout/spots.ts` `stageOf`): the plaza mark, else open grass near the middle; `washedUp`
  for Gulliver; marks `markerSpot`, `spotWhy`; a retired `guest-spot` is dropped on read (`model.ts isRetired`).
- **Validation** (`layout/validate.ts`): advisory (`error`/`warn`), the record keeps whatever is saved. `objIssues`:
  on the grid, on land, one tier; a piece with a way through (`pa`) only by its posts, which may span water. `overlap`:
  solids never share ground, nothing on stairs or a deck. The default has none (layout.test.ts).
- **Diff** (`layout/diff.ts` `diffLayouts`): chunks, objects, homes.
- **The day's spots** (`spots.ts` `daySpots`): 15 weed and 8 dig spots on open grass (`layout/clear.ts`), seeded by
  date; `beach.ts` buries `DIGS_A_DAY` (4) fossils there; none till outdoor kinds load, then always drawn.

## The 3D ground
- **Geometry** `layout/mesh.ts`; **distance fields** `layout/fields.ts`; **bands** `layout/bands.ts`; built in a
  worker, cached across launches (`fieldsPrime.ts`, `fieldsCache.ts`, keyed by tiles, pieces, homes, worker hash). A
  change in session builds the new bands there; the scene stays on its drawn layout (Island3D `sceneLayout`) till they
  swap in. Data is tiles; only the drawn coast, beach, water and path edges are round.
- **The river's turns** (`layout/river.ts`): drawn as straights and arcs; gameplay goes by tiles.
- **Baked on the GPU** (`world3d/terrain.ts`): bands of 8 rows, 4 draws, culled; ≤ `BAND_BUDGET` baked
  ([perf](ops/perf.md)); the season rebakes.
- **The water**: sea, NH's swash (`layout/swash.ts`), rivers and falls (`FRESH_FRAG`); textures `npm run
  terrain-textures`. Bridges and inclines: `npm run structure-models`, `world3d/structure.ts`.

## The editor
`/editor/` (`routes/editor/+page.svelte`, `components/editor/`: `Editor.svelte`, `plan.ts`, `edits.ts`,
`Preview3D.svelte`): unlinked, noindex, anyone paired; `?demo` on the made-up island.
- **Plan and tools**: top-down map, select/drag, terrain brush, cliff tier, palette (`Palette.svelte`). Delete never
  takes a goal tree, home, spot or one-off (seasonal pieces via the 季節 tab). ⌘Z one action; each action is sent at
  once, a drag streams `drag`. 回す · 複製 (`edits.ts duplicate`, where every copy fits; never bridges or stairs) · 削除;
  the ghost is green only where `placeErrors` passes; ⌘V pastes all or nothing.
- **Chrome:** kanji names (`layout/labels.ts labelOf`, `editor/kanjiNames.ts`; the world keeps kana); search over
  kanji, kana, romaji, English (`editor/search.ts`; "/" focuses, Enter picks); the badge is the socket plus unsent ops
  (`liveBadge.ts`); Escape drops a drag; 0 / 全体 fits the island.
- **Two layouts**: desktop, three columns (palette | plan | 3D, `IslandSize`, `IssueList`, files) and shortcuts;
  ≤ 760 px (iPhone), the plan full-bleed under a top bar (↶ ↷, 3D off by default), a dock (選択 置く 塗る 崖 川 島), a card
  for the selection or brush, palette and 島 as sheets; controls 44 px.
- **Fingers** (`planFingers.ts`): a tap selects, places or dabs; one finger drags a selected piece, a stroke, a run
  or a knot, else pans; two pinch and pan, cancelling a stroke. No long press, no hover.
- **3D preview** (`?view=orbit&eye=…&at=…` or `?view=phone`, `world3d/islandCam.ts`): the island's own builders
  (`world3d/built.ts`); `world3d/previewDraw.test.ts` fails for an undrawn kind; ≤ 30 fps.
- **`?check`** (`world3d/drawCheck.ts`): objects the 3D island can't draw, and why.
- **Files**: JSON export/import (`toJson`/`fromJson`); 最初の島に戻す (the `r` op, home looks kept) behind
  `editor/ResetConfirm.svelte`.

### The river tool
`layout/riverPath.ts` (pure, editor chunk): the main river as knots, saved as **tiles** (`c` ops plus `o` ops for what
moved, one burst), so old builds and caches follow it.
- `pathOf`: knots from the tiles on open (Douglas-Peucker, ends and falls pinned). `route`: unmoved segments keep their
  tiles, moved ones are 4-connected straight lines; 1 tile wide; cliffs never change.
- Red blocks the save: end not at tier-0 sea or a pond; uphill; a fall not straight down a cliff; touching other water;
  through fixed things, stairs, fields or doors; outside 4–120 tiles. Amber: pieces moved aside, a bridge unplaced, the
  mouth or clifftop fish lost.
- `applyPath`: old tiles become the commonest ground around; bridges re-placed across a straight run.
- **The tool** (`editor/RiverTool.svelte`; `plan.ts` `drawRiverHandles`/`riverHit`): 川の道 (phone 川) or R. Drag a
  knot; tap a segment or "+" to add; Delete, right-click or 点を消す removes; its own ⌘Z; 開いた時に戻す, 最初の川. ✓ (one
  editor action) is off while anything is red; the 3D preview follows 300 ms after a lift; 「相手が川を変えました」
  offers 読み直す.

## Homes
- **Catalogue** (`layout/homes.ts`, `homes.json`; `npm run home-models`, `-- --atlas`): `campsite`, `tent-n`,
  `tent-p`, `house` (wall `w`, roof `r`, door `d`); player-house size follows its room (`exteriorOf`).
- Drawn by `world3d/home.ts buildHome(style)`, placed by `world3d/objects.ts homePlaces`.
- **家を変える** (`components/homes/HomePicker.svelte`): owner only; sends `h`, turning (`f`) too.
- **The rooms**: the tent's room system (`routes/tent/?home=B|G`; `store/tent.svelte.ts` `rooms`), anyone enters and
  arranges (design.md "Whose room"); presence `store/where.svelte.ts`.

## The island's buildings
Museum and shop: group `building`, 7 × 4, one each, `fixed` ([design](design.md#the-shop)). The door is the front
edge's middle (`model.ts doorOf`), kept clear; a tap walks in (`world/layoutWorld.ts` BUILDINGS, `catalog.ts goesIn`).
Specs find lawn via `e2e/island.ts` `lawnTap`.

## Fences and the garden
`layout/garden.ts`, `world3d/garden.ts` (lazy, `world3d/garden.json`; icons `npm run garden-icons`). Kinds
(`GARDEN_KINDS`): NH fences, six crops, garden flowers, as `o` ops. A fence blocks and joins neighbours (`fenceJoin`,
`fencePiece`); crops grow by date (`cropStage`), unwatered; flowers always bloom. **Fields** (kind `field`,
`layout/field.ts`): [farming.md](farming.md). Runs: `editor/edits.ts placeRun`.

## The outdoor catalogue
NH's outdoor housewares, miscellaneous and gyroids (394, kind `nh-<code>`): `npm run outdoor-catalog`
(`scripts/outdoor-catalog.ts`) → `layout/outdoor.json`, rerun after room-models (`layout/outdoor.test.ts`). Drawn from
room models (`world3d/outdoorModels.ts`, `tent/roomPacks.ts`); `layout/outdoor.ts` loads only for an `nh-` piece or an
editor.

## Table tops
Small things on surfaces as in rooms (`lib/surface.ts`, `layout/tops.ts`, `tops.test.ts`): the thing keeps its tile and
names its surface (`on`); a moved table carries them (`carryTops`).

## Phone editing
`components/layoutEdit/IslandEdit.svelte`: the island's もようがえ in the editor's phone view, the tent's tray way (tabs
`TABS`): place, drag, ↻, ✕, ✓, 片付ける; furniture only, anyone. A stage `{ host, toScreen, toGround, size, moved, hide
}`: `/editor/?view=phone&edit` (`&cam=<z>`; `&preview=0` for e2e).

## How the 3D island reads it
**API for the 3D scene:** pure `app/src/lib/layout/` (`layoutOf`, `objMid`, `footOf`, `doorOf`, `extentOf`,
`heightAt`, `navOf`, `planTap`, `diffLayouts`); store `store/layout.svelte.ts` (`layout.current`, `on(fn)` with a
diff, `apply(ops)`); `buildGround(layout, { renderer, look })`, `placeObjects(layout, day)`.
- Live changes rebuild only what changed; camera ends from `extentOf` (Island3D `fitEnds`).
- Gameplay: `island/site.svelte.ts` `site.on` → `world/layoutWorld.ts worldOf(layout)` → `setWorld`.
- Walks: `nav.ts walkNav()` for taps, walkGraph.ts for idle; decor tap areas island/decor.svelte.ts.
