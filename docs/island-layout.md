# The island's layout (customisable outdoors, homes and interiors)

The layout: the schema, the ops, the default, the nav, the checks and the store (`app/src/lib/layout/`,
`store/layout.svelte.ts`); the 3D ground and objects from it (`world3d/terrain.ts`, `world3d/objects.ts`); the desktop
editor (and its phone view's もようがえ); the homes, their looks and their rooms. The game itself has no island
editing: the island is arranged in /editor only.

## The grid

- **One tile = 30 world units** = one NH tile (10 model units of NH's furniture at the island's scale, world.ts
  `DECOR_U` = 3u a model unit: a 2-tile bench is 60u, an 80u villager is NH's chibi). The tent's room uses the same
  tile, so an outdoor footprint and a room footprint mean the same thing.
- **20 × 156 tiles**, x −90…510, z −90…4590 (`layout/grid.ts` `GRID`): the long island (land x −30…420, z −30…1680)
  with a ring of sea and room behind it to grow back into (152 rows of land at most); everything off the grid is sea.
  Sea behind the land costs nothing: an all-sea band has no bake or mesh (`terrain.ts`, `mesh.ts openSeaRow`), and the
  fields' raster stops 4 rows past the land (`fields.ts rasterRows`). Tile (c, r) covers x `−90 + 30c … +30`,
  z `−90 + 30r … +30`; `r` grows away from the camera, as world z does. Read the extent from the layout
  (`model.ts extentOf`), never a constant.
- **Chunks of 8 × 8 tiles** (3 × 20 of them; the last column sticks out past the grid and is sea): the unit of a
  terrain op. The ops allow up to 16 chunks across and 32 deep (128 × 256 tiles), so the grid can grow without a relay
  deploy; the live protocol takes its bounds from these (contract/layout.ts).

## The island's size

`layout/resize.ts`, the editor's しまの おおきさ.

- **An edge a tile at a time:** `resizeEdge(layout, edge, ±n)` → `{ codes, blocked }` (`front`, `back`, `left`,
  `right`): along each line across the edge the outermost land tile moves a tile out (or in, the sea taking its place),
  the tile it leaves taking the inner one's kind and tier, so a push then a pull gives the island back.
- **Bounds:** the land keeps `MARGIN` (2) tiles of sea round it and at least `MIN` (6) tiles across and along. The
  default (15 × 57) can grow its back 95 rows (to 15 × 152) and its east a tile; shift-click steps 8. The camera's
  middle across is the land box's middle (`model.ts midXOf`), so a lopsided pull stays centred.
- **In the way:** what stands on a tile the sea takes, or is newly wrong there, `moveInside` moves to its nearest clear
  tile (resolve.ts `clearTile`), the `fixed` (catalog: a home, a building, K.K.'s stool, the board, a goal tree) and the
  biggest first; one with nowhere near is put away, but a fixed one stuck holds the resize.
- **The editor:** the side panel's しまの おおきさ, four edges' − / ＋ with a ghost on hover; a click is one action (⌘Z)
  and one burst (`sendMany`), or the list of what's in the way. The phone view has no resize.

## The layout is data

`layout/model.ts` `Layout` (`codes`, `objects`, `homes`; `tile(c, r)`, `kind`, `tier`):

- **Terrain per tile:** one *kind* and one *tier*, one code `kind × 4 + tier` (base 36, one character in a chunk op).
  - Kinds (`grid.ts KINDS`, never reordered): `sea`, `grass`, `sand`, `dirt`, `stone`, `brick`, `plank` (path kinds),
    `river`, `pond`.
  - Tier 0…3: the cliff levels (each +40u). A tile next to a lower one has a cliff face on that side; river water
    that steps down a tier is a **waterfall** (derived, never painted).
- **Objects** (`layout/catalog.ts` `KIND_LIST`: each kind's footprint, whether it blocks, its block box, where it may
  stand, its drawn height, palette icon and names): trees (`goal-tree` a|b among them), bushes, flowers, rocks,
  lights, NH's outdoor furniture, the seasonal spots, NH's bulletin board (`board`, one on the island) and K.K.'s stool
  (`kk-stool`, one, never deleted: docs/design.md "K.K. on his stool"), each used from the tile in front of it, which
  must stay clear and reachable like a home's door; `bridge` and `stairs`, which join terrain; the homes, the
  buildings (below) and named spots (`spot`: `villager-a|b`; an old `stage` spot is dropped as a layout is read: the
  stage is derived).
  Each: `id`, kind `k`, tile `x, z` (its footprint's lowest column and row), facing `f` 0–3 (0 toward the camera, −z;
  1 +x, 2 away, 3 −x), variant `s`. A footprint is `w × d` tiles, turned by `f` for the kinds that `turn`; for the
  others an odd `f` only mirrors the look. Every object's spot is a tile (no offsets).
- **Homes:** three, fixed ids `home-A` (ウェイ's, the campsite's tent), `home-B` (うめ's), `home-G` (the guest's).
  Where a home stands is an object; how it looks is its **style** (`layout/homes.ts`: `{m, w?, r?, d?}`), its owner's
  alone. A home's `(x, z)` is its door's tile (`model.ts originOf`), so a new look grows round its door; see "Homes".
- **The default layout** (`layout/default.json`, data: world.ts's island as the grid had it at 20 × 80; /editor
  writes ops over it, nothing regenerates the file): まえ (the beach, the health lawn, the goal trees, the stream's
  crossing) at the front, おく (the campsite, the pond, the falls, the upper tier's forest) at the back, open grass, the
  homes, the shop and the museum between; every piece on its own tile (`layout.test.ts`). A phone's layout is the
  default with the record's ops over it (`layoutOf(entries)`).

## Ops (the record and the relay)

All are the `decor` event and `decor` relay intent with a scope `sc`, last writer wins per id, the same merge as the
decorations (latest `at` on the relay's clock, then a removal, then G over B over A), the record keeping each id's
latest op (slot `decor|<sc>|<id>`). An old phone ignores every new scope (its parsers refuse the key).

| `sc` | Op | Who may write |
|---|---|---|
| `o` | an object set `{id, at, k, x, z, f, s?, on?}` or gone `{id, at, rm: true}` (not final: a later set brings it back); `on`: on that object's top ("Table tops") | A, B, G |
| `c` | a terrain chunk `{id: 'c<cx>x<cz>', at, g}`: `g` its 64 tiles, row by row, one character each | A, B, G |
| `r` | a reset `{id: 'reset', at}`: every `o` and `c` op older than it is void (the default again); the record drops them | A, B, G |
| `h` | a home's style `{id: 'hA'\|'hB'\|'hG', at, m, w?, r?, d?, f?}` (`f` its facing 0–3) | its owner alone |
| `t` | ウェイ's home's interior (the tent's room) | A, B, G |
| `u` | うめ's home's interior | A, B, G |
| `v` | the guest's home's interior | A, B, G |

- The server enforces it (`contract/layout.ts` `scopeMayWrite` in the record, `live-protocol.ts` `scopeMaySend` in the
  room; `relay/test/guest.test.ts`): the outdoors and every home's room anyone's; a home's look its owner's alone.
- A room scope (`t`, `u`, `v`) is contract/tent.ts's op: its own ids, its own cap of 60 pieces.
- The room relays a layout op live but never keeps it in the day's ring (an afternoon in the editor would push the
  shared world out); a phone opening later reads it from the record. A `drag` with `sc: 'o'` is an outdoor object
  being moved (x, z its middle in world units): presence, as the tent's.
- **A burst** (the editor's save, a clash settled): one queue write and one rebuild (`week.sendMany`); the partner's
  ops are merged as they come and rebuilt once. The room relays 20 at once; the rest hear `busy` and are resent.
- **Two edits on one tile** (last writer wins only per id): a piece of the partner's that lands overlapping one of
  mine (validate.ts `overlap`) is settled by the later op's phone alone (`at`, then who): its piece moves to the
  nearest clear tile (`layout/resolve.ts clearTile`), as a normal op, so nothing ping-pongs. A door the two edits
  blocked between them is settled the same way (`resolveMoves`); bridges and stairs stay and show the overlap.
- Ids: a default object's (`goal-A`, `fl:52:180`), a new one `o<time><random>` (`model.ts newObjId`); tokens
  (`k`, `s`, `m`) are lower-case; home parts (`w`, `r`, `d`) `[A-Za-z0-9.]`.

## Derived, never hand-made

- **Heights** (`layout/height.ts` `heightAt(layout, x, z)`, `fieldOf(layout)`): each tier 40u; grass and paths 3u over
  it, sand 1.2u, the river's and pond's bed 9u under the bank, the seabed falling away from the shore. Every region's
  corners are NH's rounded ones (a convex corner cut, a concave one filled): cliffs on a third of a tile, the soft
  edges (below) on half a tile, a staircase of tiles drawn a straight diagonal. Stairs ramp along their facing; a
  bridge's deck arches over its water.
- **Nav** (`layout/nav.ts` `navOf(layout)`, ~4 ms): a walk grid at half a tile; water and every blocking footprint
  block (a bridge's deck walks), a step keeps to its tier but on stairs. A* with the corners pulled straight;
  `findPath`, `snapTap` (a home → its door, water → the nearest bank), `reachable`, `named` spots, `planTap` for a tap.
- **The visitors' stage** (`layout/spots.ts` `stageOf(layout)`, NH's plaza): the plaza mark when one is down and
  usable, else open grass near the island's middle behind the villagers' spots, clear each side and unhidden;
  `washedUp(layout, date, seed)`: Gulliver's beach, his mark or a free sand tile by the date. The day's weeds, fossils
  and idle walks keep off the stage; the wedding's arch and a birthday's cake stand by it. Pure: every phone agrees.
- **The visitors' spots** (catalog.ts group `visitor`: `plaza`, `beach-spot`, `guest-spot`, one each, removable): marks
  never drawn in play, standing on nothing. The plaza places every visitor but Gulliver; Gulliver's and the day's
  guest's are their own and optional. `markerSpot(layout, k)` is where they stand (or `at: null`); `spotWhy` gives each
  reason one can't stand there with the tiles and things in the way (the rules: `plazaOk`, `guestOk`, `beachOk`, each
  needs ground clear of what would hide them, and a way to it). Unusable: the derived spot, and validate.ts's
  `visitor-spot` warning naming the reasons. An ordinary `sc: 'o'` op.
- **Validation** (`layout/validate.ts` `validate(layout)` → issues, each `error` or `warn` with its tiles and ids, the
  checks listed in its header): advisory, the record keeps whatever the members save. The default has no errors.
- **What changed** (`layout/diff.ts` `diffLayouts(a, b)`): the chunks that differ, the objects added, moved (or
  turned, restyled) and removed, the homes whose look changed.

## The 3D ground

- **The geometry** (`layout/mesh.ts`, pure: its header has NH's quadrant scheme): rounded corners on vertices that meet
  the neighbours' exactly, a vertical wall at a tier's edge (NH's cliff strata), a waterfall where water steps down a
  tier, stone steps for the stairs.
- **The distance fields** (`layout/fields.ts`): each region's signed distance to its rounded edge (the land, the
  sand, the fresh water, the paths, each tier), read by the heights, the bake and the water's edges. Built once per
  tiles and bridges, off the main thread, cached for the next launch (`fieldsPrime.ts`, `fieldsCache.ts`).
- **Soft edges** (NH's coast is round; the radii: "Heights" above): the data and the objects stay on tiles, only the
  drawn edge of the coast, the beach, the fresh water and the paths is round; a river runs out to the sea square. The
  editor's plan stays tile-exact; its 3D preview is the same ground.
- **The river's turns** (`layout/river.ts`, its header has the rules): each main stem drawn as straights and one arc
  through each staircase, on the river's own tiles; walking, fishing and casts go by tiles. The editor marks it on the
  plan; `/editor?check` lists the arcs.
- **The look is baked on the GPU** (`world3d/terrain.ts`): one shader paints each band from the fields and the tiles,
  NH's way, at load and again only for what a change touches; the season's palette (`ground.look`) rebakes it all.
- **Bands:** a row of chunks (8 tile rows) is one band: 4 draws and one texture each, so the draws stay flat however
  long the island grows; bands out of view are culled. A budget of bands is baked (`BAND_BUDGET`), once a launch; past
  it a band coming into the camera's reach takes the farthest one's target (`near()`). The editor's 3D preview bakes
  all. The numbers (bands, MB, the 30 fps cap): [perf](ops/perf.md).
- **The water:** NH's sea round the island (foam, the shallows' turquoise fading to the deep blue); NH's waves
  washing ashore (`layout/swash.ts`, design.md "The sea's wash": one rhythm on the ground, the shader and the CPU); the
  rivers' flow, the ponds' ripples, the falls' streaks (terrain.ts `FRESH_FRAG`), on water.ts's shared clock.
- NH's textures: `npm run terrain-textures` (scripts/terrain-textures.ts) into `static/terrain/nh/*.webp`.

## The editor

`/editor/` (`routes/editor/+page.svelte`, `components/editor/`: `Editor.svelte`, `plan.ts` the canvas, `edits.ts` the
edits, `Preview3D.svelte`): unlinked, noindex, for anyone paired (A, B or the guest; a browser not paired gets the way
to `/pair`). `?demo` runs it on the demo's island (`?demo&as=B` beside it as the phone).

- **The plan:** the layout top-down in NH's map colours, the objects by their icons, the homes labelled, the named
  spots as pins, what's wrong tinted on its tiles; where the visitors stand without a usable mark, a dashed tile.
- **The tools:** select and drag, the terrain brush, the cliff tier, place from the palette (the island's one-offs
  greyed while they stand); Delete never takes a goal tree, a home, a named spot or a one-off. ⌘Z reverts one action
  over the island as it is now (the partner's changes stay).
- **Live:** each finished action goes out as layout ops at once (the record and the relay); a drag streams the
  piece's spot as presence (`drag`, `sc: 'o'`, ~10 a second). The checks (validate.ts) run a moment after every
  change; a click on one selects its pieces and centres its tiles.
- **The 3D preview** (`editor/Preview3D.svelte`; `?view=orbit`, or `?view=phone` with the island's own camera,
  `world3d/islandCam.ts`): drawn through the island's builders, so the two can't drift (`buildGround`, placeObjects on
  today's day, `world3d/built.ts`, K.K.'s stool); not drawn: what isn't the layout's (villagers, the day's finds and
  critters, weather, events). `world3d/previewDraw.test.ts` fails for a catalog kind with no drawing. Moved by hand
  only; a frame only when something changed, at most 30 a second (`world3d/stage.ts`).
- **`?check`** (`world3d/drawCheck.ts undrawn`): a 3Dの チェック panel listing each object the phones' 3D island doesn't
  draw as a model (a day of each season), and why: an unknown kind, a card of 2D art, nothing at all, a model file
  missing; a click selects it.
- **Files:** JSON に かきだす / JSON を よみこむ (model.ts `toJson` / `fromJson`; an import is one action), 最初の島に戻す
  (the reset op; the homes' looks kept) behind `editor/ResetConfirm.svelte`: what goes, then リセットする only once
  「リセット」 is typed (anyone, the guest too).

## Homes

- **The catalogue** (`layout/homes.ts`, `homes.json`; `npm run home-models` with NH_MODELS converts NH's House* parts
  into `static/room/homes/`: 63 families, each part's GLB in its first colour with the other colours' albedos and a
  swatch each; NH's own picker icons for the doors and the player house):
  - `campsite`: the campsite tent (ウェイ's by default);
  - `tent-n` (`w` 'A' | 'B'): NH's move-in tent; `tent-p`: the player's first tent;
  - `house`: NH's modular house, `w` a wall (`PA04Stucco.B`, or a villager house's NA…ND), `r` the same shape's roof,
    `d` one of NH's 14 doors, each part in its colours. Footprints at 3u a model unit (the player house 5 × 3); the
    porch inside the front row.
- **The defaults:** うめ's NH's player house (stucco, a western tile roof), the guest's a villager's log house (a
  thatched roof).
- **Sizes** (`homes.ts exteriorOf`): the player house's outside follows its room's size (design.md "The tent" › Room
  size): the chosen look (PA04) at 8 × 8, NH's first house (PA00) at 6 × 6 and 4 × 4, in the same footprint, porch and
  door, so nothing on the layout moves. A villager's house and the tents have no levels.
- **Drawing them** (`world3d/home.ts buildHome(style)`: the three parts at 3u a model unit, NH's soft Lambert, a
  lamp's own glow; `world3d/objects.ts homePlaces(layout)`: each home's origin, front wall's middle and yaw; the
  campsite's tent stays placeObjects' instance).
- **家を変える** (`components/homes/HomePicker.svelte`): the owner's own, in their home's room and in the editor: the
  kind, shape, materials, colours and door, in a turning preview; a look that wouldn't fit is refused; これにする sends
  the `h` op (`scopeMayWrite`: the owner alone).
- **Turning a home:** its facing (`f`) is part of its look, so only its owner turns it, about its door's tile (the
  footprint, the walk-up spot and the way out of its room with it); a turn that would wall the door in or overlap is
  refused.
- **The rooms:** every home's inside is the tent's room system (`routes/tent/?home=B|G`, `TentRoom.svelte`'s `home`;
  `store/tent.svelte.ts` `rooms.A` the tent's `t`, `rooms.B` うめ's `u`, `rooms.G` the guest's `v`), each 4, 6 or 8 tiles
  square as chosen (contract/tent.ts ROOM_SIZES; design.md "The tent" › Room size), whatever the outside. Anyone comes
  in, arranges it and switches its light (design.md "Whose room"). Presence says which home (`tent` and `drag` with
  `sc`; `store/where.svelte.ts`). Out of the door: in front of that home's door on the layout.

## The island's buildings

- **The kinds** (`catalog.ts` group `building`, `door: true`): the museum (`museum`, はくぶつかん, NH's 7 × 4, one to an
  island, `fixed`) and the shop (`shop`, タヌキ商店, NH's Nook's Cranny, the same 7 × 4 and rules:
  [design](design.md#the-shop)). A building's door is the middle of its front edge (`model.ts doorOf`; its `(x, z)` is
  its footprint's back-left tile); its door's tile must stay clear and reachable (`validate.ts` `door`); `nav.ts` keeps
  it in `doors` (`door-<id>` named, a tap on it snaps to its door: `catalog.ts goesIn`).
- **Drawn:** NH's StrcMuseumA02 / StrcMarketA02 and their doors (`npm run world3d-models -- --only=museum|shop`), at
  3u a model unit, steps on the footprint's front edge. On the island each is a building (`island/layoutWorld.ts`
  BUILDINGS: its tap area, its door) and a tap walks up and goes in (`/museum`, `/shop`); the editor's palette offers
  one only while the island has none.
- **The default** (default.json): the museum on the clifftop behind the campsite (tiles 6…12 × 54…57), the shop in
  the middle west of the main path behind うめ's home (tiles 2…8 × 34…37). The live island's are where the members put
  them, so the e2e specs ask the page for open lawn (`e2e/island.ts` `lawnTap`, `openNear`), never a fixed point.

## The day's spots, the structures, the old decorations

- **Weeds and fossils** (`layout/spots.ts` daySpots): 15 weed spots and 8 dig spots a day from the layout's open grass
  (a grass tile nothing stands on, off the paths, the water and the banks, away from a door, a front, a named spot,
  the stairs and a building's ground (`layout/clear.ts`), one a walker reaches), spread out, seeded by the date and the
  island's seed: the same on every phone. `beach.ts` digSpots buries `DIGS_A_DAY` (4) fossils on 4 of the 8.
  `island/site.svelte.ts` switches the weeds (care.ts) and fossils onto them; before the layout's applied, world.ts's.
- **NH's bridges and inclines** (`npm run structure-models`: 8 bridges; 6 inclines: stone, brick, iron, wood, log,
  natural; `world3d/structure.ts`): `structurePlaces(layout)` + `buildStructure(place)` → a group at
  `(x, ground.heightAt(x, z), −z)`, its yaw set. The stairs are NH's 2 × 4 (one tier over four tiles). Island3D attaches
  them, with `structures: true` to placeObjects and `stairs: false` to buildGround.
- **The old もようがえ's decorations** (`layout/migrate.ts`): each member's phone moved its own into the layout once,
  as `o` ops `m-<its id>` on its tile (`layout.migrateDecor`); already moved (any op of that id) never again. The
  island draws the layout's copy, not contract/decor's.

## Fences and the garden

`layout/garden.ts` (pure: the kinds, the joining, the crops' growth), `world3d/garden.ts` (their models, lazy), the
editor's 野菜 and フェンス tabs and NH's garden flowers under 花.

- **The kinds** (catalog.ts `GARDEN_KINDS`, NH's official names in kanji): NH 2.0's fence items (`fence-<id>`; the
  three that aren't items left out), six crops (`crop-<id>`, the pumpkin's colour its variant), the gold roses, the
  lily of the valley and the vine (a | b | c). Ordinary `o` ops: the relay takes any kind token.
- **A fence** takes its whole tile (nav.ts blocks it), so the ways go round a run; a crop or a flower is walked over.
- **Joining** (NH's way, `fenceJoin`): a fence joins the same kind east, north, west or south on its tier; its four
  neighbours pick NH's piece and turn (`fencePiece`; `layout/garden.test.ts` holds all 16 neighbourhoods).
- **Crops grow by the date** (`cropStage`: planted at its id's time, ripe on the third day, fuller on the fourth and
  fifth), the same on every phone. These decor crops need no watering; the fields' plants are another thing (below).
- **Fields** (kind `field`, the 畑 tab under 野菜; `layout/field.ts`): a farm field, its owner and size its variant
  (`a-10x4`), placed and resized in /editor only. Its plants live on the record, plot by plot (`fd:<id>.<col>.<row>`),
  not in the layout; weeds, fossils and drops keep off it (`layout/clear.ts`). The rules: [farming.md](farming.md).
- **The garden's flowers** are always in bloom where they're put: no season, no watering, no hybrid (the wild flowers'
  watering and hybrids, care.ts, stay theirs).
- **The cedars' festive lights**: every cedar in the illuminated tree's weeks (fixedDecor.ts `WINDOWS.illumi`).
- **NH's other bushes** are `bush` variants, their own models (assets.json `bushes/<id>`).
- **Placing** (`editor/edits.ts placeRun`): with a fence or a crop held, a press puts one down and a drag puts one on
  each tile it crosses, four-connected (across, then along, so a run joins), skipping tiles taken; the run is one action
  (⌘Z). The phone view's もようがえ has the same tabs (野菜, フェンス), a piece at a time.
- **Loading**: their models are packs listed in `world3d/garden.json` (docs/world3d-assets.md): an island without one
  fetches none of it. The editors' icons are one sheet (`npm run garden-icons`).

## The outdoor catalogue

The rooms' pieces outdoors (NH's catalogue but character customisation): every housewares and miscellaneous piece NH
lets one put outdoors (the ACNH spreadsheet's `outdoor`, 415) and the 36 gyroids, less the 57 the editor already has as
kinds of its own (by NH's model file, or its name): 394 pieces. Critter tanks stay indoors (the rooms' 生き物 gives each
ずかん catch's; the editor isn't gated by the ずかん).

- **Data:** `npm run outdoor-catalog` (`scripts/outdoor-catalog.ts`) writes `layout/outdoor.json` from the room data
  (tent/items.json, more.json, the seats, NH's names in i18n/tent.*.json): each piece a kind `nh-<code>`, its tab by
  NH's tag. Rerun it after room-models; `layout/outdoor.test.ts` fails while the two differ.
- **Tabs:** by NH's tag into the existing tabs (明かり, 家具, キャンプ, 食べ物) and its own: 庭, 公園, 街, 海辺, オブジェ,
  行事, はにわ. Both editors; icons NH's own (static/room/icons) or the ずかん's.
- **Same indoors and out:** a piece is drawn from its room model (loose, or cut from its room pack: one shared
  `tent/roomPacks.ts` store; `world3d/outdoorModels.ts`) at NH's furniture scale, turned by its facing; its footprint,
  top (layout/tops.ts), small flag, seat (nav.ts, villager3d/seats3d.ts) and light (things.ts lamps: its room emitter
  for a piece with NH's lighting; a glowing piece's emissive lit at night) are the room's. Nothing is converted again:
  no new static files.
- **Loading:** `layout/outdoor.ts` imports the table only when the layout has an `nh-` piece (the layout store
  rebuilds once it's in, so the walk, the checks and the scene see them) or an editor opens; till then the kinds are
  unknown and nothing of them is drawn. First load: the table and the models stay out of it.

## Table tops

NH's surfaces outdoors, the rooms' rules (design.md "The tent" › Table tops; the shared geometry `lib/surface.ts`,
the island's `layout/tops.ts`). A small thing (NH's miscellaneous: the food, the kettles, the lantern, the radio, the
cooler, the buckets…) stands on a surface (the folding and outdoor tables, the camp kitchen, the outdoor bench, the
log stool, the wagon, the iron garden table, the locker), one a tile of its top; each surface's top is its room
piece's (tent/items.json `sy`, `st`: the same NH model, `tops.test.ts`).

- **Data:** the thing keeps its own tile (one of its surface's) and facing, and names its surface (`on`). Everything
  else that reads the layout (the walk, the checks, an older phone) sees a thing on that tile; it blocks nothing and
  overlaps nothing of its own. Its surface gone (a race), it stands on the ground there.
- **Drawn** (`world3d/objects.ts`): on the top at the surface's drawn scale (its `lift`), on the top's rectangle, so a
  lamp's light and a tap node (island/Decor.svelte) are there too. A bench or a stool with things on it is no seat.
- **Edited:** in both editors a small thing put down or dragged over a top goes on it (a tap on the table with one
  held, as in the rooms); moving or turning the table carries its things (`carryTops`: the same slots, turned);
  the desktop editor's Delete takes them with it (⌘Z brings both), the phone's 片付ける refuses until they're off (as
  in the rooms).

## Phone editing

`components/layoutEdit/IslandEdit.svelte`: the island's もようがえ in the editor's phone view (the tent's もようがえ
stays the room's), the tent's way (TentEdit's tray, bar and buttons). The tray's tabs are IslandEdit's TABS, the
catalogue's groups in kanji (`decor.tab.*`: 木, 花, 野菜, 家具, ジム (design.md "Decorating"), the outdoor catalogue's,
建物, お客さん: the visitors' marks, drawn over the ground only in this mode, red when nobody can stand there with the
reason in the bar). A tap on a kind puts it down as a ghost on the free tile nearest the view's middle, its footprint
green or red, the bar saying why; a finger on it, or on any placed thing, drags it a tile at a time; a tap on the
ground moves it there; ↻ turns it, ✕ puts it back, ✓ places it, 片付ける takes it away (never a goal tree, a home, a
one-off). While held the other phones see it move (`drag`, `sc: 'o'`); a drop is its ops at once. Anyone's, the
guest's too. Terraforming (paths, water, cliffs) is the desktop editor's alone.

It runs over any stage: `{ host, toScreen(x, z, lift), toGround(sx, sy), size(), moved(fn), hide(ids) }` (`moved`: told
of each camera move, no probe each display frame). The editor's phone view gives it one (`/editor/?view=phone&edit`:
the 3D island's camera and bend, `&cam=<z>` its spot; `&preview=0` a flat plan, the e2e's; `?view=orbit` the 3D
preview, `&eye=x,y,z&at=x,y,z` its camera).

## How the 3D island reads it

**API for the 3D scene:** pure `app/src/lib/layout/` (`layoutOf(entries)`, model.ts's `objMid`, `footOf`, `doorOf`,
`extentOf`, `heightAt`, `navOf` / `planTap`, `diffLayouts`); the live layout `store/layout.svelte.ts` (its header lists
the API: `layout.current`, `on(fn)` with each change's diff, `apply(ops)`; kept in localStorage); three.js's
`buildGround(layout, { renderer, look })` (`world3d/terrain.ts`: the `Ground` interface) and
`placeObjects(layout, day)` (`world3d/objects.ts`).

- **The ground:** `createIsland(canvas, (renderer) => buildGround(layout.current, { renderer, look }))`; its bands
  culled per frame (`ground.chunks()`, engine.ts).
- **The things:** `placeObjects(layout.current, day)`; ids are the layout's (the campsite's tent `home-A` with
  `tap: 'tent'`, the bridge `bridge`).
- **Live changes:** `layout.on(({ diff }) => …)` rebuilds the changed ground chunks and things (things.ts rebuilds only
  the models whose instances changed).
- **The camera's ends** from `extentOf(layout.current)` (Island3D `fitEnds`: the front shore and まえ's canopy clear of
  the HUD, the land's far edge `EDGE_AT` (0.42) down the screen), recomputed on a change; its middle across the land
  box's (`model.ts midXOf`: `MID_X` 195 on the default island).
- **The homes:** `homePlaces(layout.current)` → `buildHome(style)` (`world3d/built.ts` createBuilt, with the bridges,
  stairs and ponds; rebuilt on `diff.homes`); a tap on `home-B` / `home-G` walks to its door and goes in to
  `/tent?home=B|G` (the campsite's to `/tent`); their lamps `homeTod`.
- **The gameplay:** `island/site.svelte.ts` `site.on`: `island/layoutWorld.ts worldOf(layout)` derives every place
  world.ts exports (its homes, buildings, stage, seats, scenery, flowers, goal trees, waters, boxes, cameras and spots)
  and `setWorld` swaps them in (ES live bindings; a cache keys on `worldGen()`; a DOM overlay reads `site.rev`). Before
  it's applied (and in the unit tests), world.ts's own.
- **The walk:** layout/nav.ts's (`nav.ts walkNav()`: the layout's grid with the island's named spots) for a tap;
  walkGraph.ts's geo for the idle walks and the visitors.
- **The decorations:** Decor.svelte draws the layout's decoration objects as tap areas only (placeObjects draws them).
