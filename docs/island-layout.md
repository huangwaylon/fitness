# The island's layout (customisable outdoors, homes and interiors)

The layout's schema, ops, default, nav and checks (`app/src/lib/layout/`, store `store/layout.svelte.ts`), the 3D
ground and objects built from it (`world3d/terrain.ts`, `world3d/objects.ts`), the editor, and the homes. The game has
no island editing: the island is arranged in /editor only.

## The grid
- **One tile = 30 world units** = one NH tile (world.ts `DECOR_U` = 3u a model unit). Rooms use the same tile.
- **20 × 156 tiles** (`layout/grid.ts` `GRID`), x −90…510, z −90…4590; tile (c, r) covers x `−90 + 30c … +30`,
  z `−90 + 30r … +30`, `r` growing away from the camera. Off the grid is sea; all-sea bands cost no bake or mesh
  (`mesh.ts openSeaRow`, `fields.ts rasterRows`). Read the extent from the layout (`model.ts extentOf`), never a constant.
- **Chunks of 8 × 8 tiles**: the unit of a terrain op. The ops allow up to 16 × 32 chunks, so the grid can grow
  without a relay deploy (contract/layout.ts).

## The island's size
`layout/resize.ts` (the editor's しまの おおきさ): `resizeEdge(layout, edge, ±n)` → `{ codes, blocked }` moves an edge's
outermost land a tile out or in (reversible). The land keeps `MARGIN` (2) tiles of sea round it and is at least `MIN`
(6) across and along; the default 15 × 57 can grow back to 152 rows. What's in the way moves to its nearest clear tile
(`moveInside`, resolve.ts `clearTile`), `fixed` and biggest first; a stuck fixed one blocks the resize. The camera
centres on the land box (`model.ts midXOf`). In the editor's 島 panel; one action (⌘Z), one burst.

## The layout is data
`layout/model.ts` `Layout` (`codes`, `objects`, `homes`):
- **Terrain per tile**: a *kind* and a *tier*, code `kind × 4 + tier` (base 36, one character). Kinds (`grid.ts KINDS`,
  never reordered): `sea`, `grass`, `sand`, `dirt`, `stone`, `brick`, `plank`, `river`, `pond`. Tiers 0…3 (+40u each);
  cliffs and waterfalls are derived.
- **Objects** (`layout/catalog.ts` `KIND_LIST`: footprint, blocking, where it may stand, height, icon, names): trees
  (`goal-tree`), bushes, flowers, rocks, lights, NH furniture, `board` and `kk-stool` (one each, used from the clear
  tile in front), `bridge`, `stairs`, homes, buildings, named spots (`villager-a|b`). Each: `id`, `k`, tile `x, z`
  (footprint's lowest column and row), facing `f` 0–3 (0 toward the camera), variant `s`. Spots are whole tiles.
- **Homes**: fixed ids `home-A` (ウェイ's campsite tent), `home-B` (うめ's), `home-G` (the guest's); where is an object,
  the look a **style** (`layout/homes.ts` `{m, w?, r?, d?}`) only its owner sets. A home's `(x, z)` is its door's tile.
- **The default** (`layout/default.json`): まえ (beach, lawn, goal trees) at the front, おく (campsite, pond, falls,
  forest) at the back. A phone's layout is the default with the record's ops over it (`layoutOf(entries)`).

## Ops (the record and the relay)
All are the `decor` event/intent with a scope `sc`; last writer wins per id (latest `at`, then removal, then G > B > A);
the record keeps each id's latest op (slot `decor|<sc>|<id>`). An old phone ignores unknown scopes.

| `sc` | Op | Who |
|---|---|---|
| `o` | object set `{id, at, k, x, z, f, s?, on?}` or `{id, at, rm: true}`; `on`: its surface ("Table tops") | A, B, G |
| `c` | terrain chunk `{id: 'c<cx>x<cz>', at, g}` (64 characters) | A, B, G |
| `r` | reset `{id: 'reset', at}`: older `o`/`c` ops void | A, B, G |
| `h` | home style `{id: 'hA'\|'hB'\|'hG', at, m, w?, r?, d?, f?}` | owner only |
| `t`, `u`, `v` | rooms of ウェイ, うめ, the guest (contract/tent.ts, `TENT_MAX` 120) | A, B, G |

- Server-enforced: `contract/layout.ts` `scopeMayWrite` (record), `live-protocol.ts` `scopeMaySend` (room);
  `relay/test/guest.test.ts`.
- The room relays layout ops live but keeps none in the day's ring; `drag` with `sc: 'o'` is presence.
- **A burst** (`week.sendMany`): one queue write, one rebuild; the room takes 20 at once, the rest get `busy`.
- **Two edits on one tile**: the later op's phone alone moves its piece to the nearest clear tile (`layout/resolve.ts
  clearTile`, `resolveMoves` for blocked doors), so nothing ping-pongs.
- Ids: default objects' own, new ones `o<time><random>` (`model.ts newObjId`).

## Derived, never hand-made
- **Heights** (`layout/height.ts` `heightAt`, `fieldOf`): 40u a tier; NH's rounded corners; stairs ramp, bridges arch.
- **Nav** (`layout/nav.ts` `navOf`): a half-tile walk grid, A*; `findPath`, `snapTap`, `reachable`, `planTap`.
  Stairs are stepped on and off only along their climb (never over a curb from the side); an arch's posts block, its
  way through doesn't (`archTiles`); the seasonal spots empty today block nothing (`navOf(l, bare)`, `fixedDecor.ts
  emptySpots`, re-applied by `site.bare` as the day, the hour and the snowboy's melt change).
- **Arches over water** (`layout/height.ts` `standLift`): a gate, torii or gazebo whose way through spans water stands
  on its posts' banks (the highest), not the bed.
- **The visitors' stage** (`layout/spots.ts` `stageOf`): the plaza mark if usable, else open grass near the middle;
  `washedUp` for Gulliver. Visitor marks (`plaza`, `beach-spot`): `markerSpot`, `spotWhy`; a retired `guest-spot` is
  dropped as a layout is read (`model.ts isRetired`).
- **Validation** (`layout/validate.ts`): advisory issues (`error`/`warn`); the record keeps whatever is saved. A piece's
  ground (`objIssues`): on the grid, on land, one tier; an arch, a gate, a gazebo (a piece with a way through, `pa`)
  only by its posts (`nav.ts archTiles`), its way through may span a river, a pond or the sea. Overlaps (`overlap`):
  solid things never share ground, nothing stands on stairs or a bridge's deck, a flower or a deck under an arch's way
  through is fine. The default has no issues at all (layout.test.ts).
- **Diff** (`layout/diff.ts` `diffLayouts`): chunks, objects and homes changed.
- **The day's spots** (`layout/spots.ts` `daySpots`): 15 weed and 8 dig spots on open grass (`layout/clear.ts`),
  seeded by date and island seed; `beach.ts` buries `DIGS_A_DAY` (4) fossils on them. None till outdoor kinds load
  (no jump); always drawn, under the HUD too.

## The 3D ground
- **Geometry** `layout/mesh.ts` (NH's quadrant scheme in its header); **distance fields** `layout/fields.ts` and the
  ground's **bands** (`layout/bands.ts`: a chunk row joined, its normals, the fields' texture bytes), built off the main
  thread and cached across launches (`fieldsPrime.ts`, `fieldsCache.ts`, keyed by the layout's tiles, pieces and homes
  and the worker's hash). A layout change in the session (the editor, the other phone) makes the new fields and bands in the
  same worker; the scene stays on the drawn ground's layout (Island3D `sceneLayout`) till they're in, then the changed
  bands are swapped in and the models move with them.
- Data stays on tiles; only the drawn coast, beach, water and path edges are round.
- **The river's turns** (`layout/river.ts`): drawn as straights and arcs; gameplay goes by tiles; `/editor?check`
  lists arcs.
- **Baked on the GPU** (`world3d/terrain.ts`): bands of 8 tile rows, 4 draws each, culled out of view; at most
  `BAND_BUDGET` baked ([perf](ops/perf.md)). The season's palette rebakes.
- **The water**: the sea, NH's swash (`layout/swash.ts`), rivers and falls (terrain.ts
  `FRESH_FRAG`). Textures: `npm run terrain-textures` → `static/terrain/nh/`.
- Bridges and inclines: `npm run structure-models`, `world3d/structure.ts` (`structurePlaces`, `buildStructure`).

## The editor
`/editor/` (`routes/editor/+page.svelte`, `components/editor/`: `Editor.svelte`, `plan.ts`, `edits.ts`,
`Preview3D.svelte`): unlinked, noindex, for anyone paired (A, B, guest). `?demo` runs it on the made-up island.
- **Plan and tools**: top-down map, select/drag, terrain brush, cliff tier, palette (`Palette.svelte`); Delete never
  takes a goal tree, home, named spot or one-off (the seasonal pieces go and come back from the 季節 tab, their ids
  their kinds'). ⌘Z reverts one action. Each action goes out as ops at once; a drag streams `drag`. The selection's
  回す · 複製 (`edits.ts duplicate`: right, left, below or above it, where every copy fits; never a bridge or stairs) ·
  削除 are buttons too. The placing ghost is green only where validation passes the piece (`ghostAt`: `placeErrors`);
  ⌘V pastes all of a copy where it fits, or nothing.
- **Chrome:** names in kanji (`layout/labels.ts labelOf`, the table `editor/kanjiNames.ts`, the editor's
  chunk only; the world keeps the kana `ja`), a home by its owner (ウェイの家) in the palette, inspector and checks.
  The palette searches kanji, kana, romaji and English (`editor/search.ts`; "/" focuses it, Enter picks the first).
  The badge is the socket's (ライブ / 接続中… / オフライン) with the write queue's unsent layout ops (`liveBadge.ts`).
  Escape drops a drag in progress (a move's `drag` end sent, a stroke unsaved). 0 / a phone's 全体 fits the island.
- **Two layouts, one editor**: a desktop window gets three columns (palette | plan | 3D, selection, `IslandSize`,
  `IssueList`, files) and the shortcuts. ≤ 760 px (iPhone 15/16 Safari) the plan is full-bleed under a top bar (↶ ↷,
  3D: the orbit preview in the plan's place, off by default), a dock (選択 置く 塗る 崖 川 島), a card over it (the
  selection's actions, the piece being placed, the brush) and the palette and 島 as sheets; insets via `--safe-*`,
  controls 44 px.
- **Fingers** (`planFingers.ts`, the rooms' `gestures` rule, the plan's and the river tool's): a tap selects (複数:
  adds), places or dabs; one finger drags a *selected* piece, a brush stroke, a fence/crop run or a knot, else pans;
  two pinch the zoom and pan, cancelling a stroke or move in progress. No long press, no hover.
- **3D preview** (`?view=orbit` with `&eye=x,y,z&at=x,y,z`, or `?view=phone` with `world3d/islandCam.ts`): the island's
  own builders (`world3d/built.ts`); `world3d/previewDraw.test.ts` fails for an undrawn catalog kind; ≤ 30 fps.
- **`?check`** (`world3d/drawCheck.ts`): objects the phones' 3D island can't draw, and why.
- **Files**: JSON export/import (`toJson`/`fromJson`), 最初の島に戻す (the `r` op, homes' looks kept) behind
  `editor/ResetConfirm.svelte` (type 「リセット」).

### The river tool
`layout/riverPath.ts` (pure, the editor's chunk only): the main river (the largest piece of `river` tiles) as knots,
redrawn and saved as **tiles**: chunk `c` ops plus `o` ops for what moved, one burst like any stroke. No new field or
scope, so old builds, the partner's phone and the island's caches (the fields/mesh keys hash the codes) follow it.
- `pathOf`: knots from the tiles each time it opens (Douglas-Peucker, both ends, a fall's two tiles pinned); never saved.
- `route`: a segment whose knots didn't move keeps its tiles; a moved one is the straight 4-connected line between its
  knots (river.ts rounds the turns as it draws). 1 tile wide, the main river only; cliffs never change.
- Red blocks the save: the end by the tier-0 sea or a painted pond; downhill only; a fall straight down a straight
  cliff; off cliff edges; never touching itself or other water but at its ends; not through fixed things, stairs,
  fields or door tiles; 4–120 tiles on land. Amber: things moved aside (`resolve.ts clearTile`), a bridge with no place,
  the mouth or clifftop fish lost.
- `applyPath`: old tiles back to the commonest of grass/sand/dirt around them, the bridges that crossed the old river
  re-placed across a straight run of the new one (turned to span it).
- **The tool** (`editor/RiverTool.svelte`, imported when it opens; `plan.ts` `drawRiverHandles`/`riverHit`). 川の道
  (a phone's 川) or R with nothing selected. Drag a knot (the end is pulled to the coast, the start to a pond). Click
  or tap a segment or its "+" to add a knot. Delete/Backspace, right-click or 点を消す (a tapped knot) removes one (a
  fall's pair together); two fingers pinch. ⌘Z / ⇧⌘Z step the tool's own history. 開いた時に戻す, 最初の川 (the default's knots over today's
  island). The chip shows OK, 注意 n or the first red reason, and its list pans to an issue. ✓ is off while anything is
  red. Moves and bridges show as amber arrows, and the 3D preview gets the save 300 ms after the pointer lifts. ✓ is one
  editor action (「川の道を変えた」, one ⌘Z). 「相手が川を変えました」 offers 読み直す.

## Homes
- **Catalogue** (`layout/homes.ts`, `homes.json`; `npm run home-models` → `static/room/homes/`, `-- --atlas` the
  picker atlas): `campsite`, `tent-n`, `tent-p`, `house` (wall `w`, roof `r`, door `d`). Defaults: うめ's NH player
  house, the guest's log house. Player-house size follows its room (`homes.ts exteriorOf`).
- Drawn by `world3d/home.ts buildHome(style)`, placed by `world3d/objects.ts homePlaces`.
- **家を変える** (`components/homes/HomePicker.svelte`): the owner's own; sends `h`. Turning (`f`) is the owner's too.
- **The rooms**: every inside is the tent's room system (`routes/tent/?home=B|G`; `store/tent.svelte.ts` `rooms`),
  anyone may enter and arrange (design.md "Whose room"); presence in `store/where.svelte.ts`.

## The island's buildings
Museum (`museum`) and shop (`shop`), catalog group `building`, 7 × 4, one each, `fixed`
([design](design.md#the-shop)). The door is the front edge's middle (`model.ts doorOf`), kept clear (`validate.ts`
`door`); a tap walks in (`world/layoutWorld.ts` BUILDINGS, `catalog.ts goesIn`). Models: `npm run world3d-models --
--only=museum|shop`. Specs find open lawn via `e2e/island.ts` `lawnTap`, never fixed points.

## Fences and the garden
`layout/garden.ts` (kinds, joining, growth), `world3d/garden.ts` (lazy models listed in `world3d/garden.json`; icons
`npm run garden-icons`). Kinds (catalog.ts `GARDEN_KINDS`): NH fences, six crops, garden flowers; ordinary `o` ops.
A fence blocks its tile and joins neighbours (`fenceJoin`, `fencePiece`; `layout/garden.test.ts`); crops grow by date
(`cropStage`) and need no water; garden flowers always bloom. **Fields** (kind `field`, `layout/field.ts`): a farm
field placed in /editor, its plants on the record ([farming.md](farming.md)). Placing a run: `editor/edits.ts placeRun`.

## The outdoor catalogue
NH's outdoor-placeable housewares, miscellaneous and gyroids not already editor kinds (394, kind `nh-<code>`). `npm run
outdoor-catalog` (`scripts/outdoor-catalog.ts`) writes `layout/outdoor.json` from the room data; rerun after
room-models (`layout/outdoor.test.ts`). Drawn from their room models (`world3d/outdoorModels.ts`, `tent/roomPacks.ts`)
with the room's footprint, top, seat and light. `layout/outdoor.ts` loads the table only when the layout has an `nh-`
piece or an editor opens; never in the first load.

## Table tops
Small things stand on surfaces as in rooms (shared `lib/surface.ts`, island `layout/tops.ts`; tops from tent/items.json,
`tops.test.ts`). The thing keeps its tile and names its surface (`on`); drawn on the top by `world3d/objects.ts`; moving
a table carries its things (`carryTops`).

## Phone editing
`components/layoutEdit/IslandEdit.svelte`: the island's もようがえ in the editor's phone view, the tent's tray/bar way
(tabs: IslandEdit `TABS`, `decor.tab.*`). Place, drag, ↻, ✕, ✓, 片付ける; others see `drag`. Anyone, guest too;
furniture only. It runs over a stage `{ host, toScreen, toGround, size, moved, hide }`:
`/editor/?view=phone&edit` (`&cam=<z>`; `&preview=0` a flat plan for e2e).

## How the 3D island reads it
**API for the 3D scene:** pure `app/src/lib/layout/` (`layoutOf`, `objMid`, `footOf`, `doorOf`, `extentOf`, `heightAt`,
`navOf`, `planTap`, `diffLayouts`); live store `store/layout.svelte.ts` (`layout.current`, `on(fn)` with a diff,
`apply(ops)`); `buildGround(layout, { renderer, look })` and `placeObjects(layout, day)`.
- Live changes rebuild only the changed chunks and things. Camera ends from `extentOf` (Island3D `fitEnds`).
- Gameplay: `island/site.svelte.ts` `site.on` → `world/layoutWorld.ts worldOf(layout)` → `setWorld`.
- Walk: `nav.ts walkNav()` for taps; walkGraph.ts for idle walks (both on the layout's walk grid). Decorations' tap
  areas: island/decor.svelte.ts.
