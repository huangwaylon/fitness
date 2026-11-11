# The island's layout (customisable outdoors, homes and interiors)

The layout: the schema, the ops, the default, the nav, the checks and the store (`app/src/lib/layout/`,
`store/layout.svelte.ts`); the 3D ground and objects from it (`world3d/terrain.ts`, `world3d/objects.ts`); the desktop
editor (and its phone view's もようがえ); the homes, their looks and their rooms. The game itself has no island
editing: the island is arranged in /editor only.

## The grid

- **One tile = 30 world units** = one NH tile (10 model units of NH's furniture at the island's scale, world.ts
  `DECOR_U` = 3u a model unit: a 2-tile bench is 60u, an 80u villager is NH's chibi). The tent's room uses the same
  tile, so an outdoor footprint and a room footprint mean the same thing.
- **20 × 156 tiles**, x −90…510, z −90…4590 (`layout/grid.ts` `GRID`; 80 rows until 2026-11-10): the long island
  (land x −30…420, z −30…1680) with a ring of sea, and 96 more rows of sea behind it for the island to grow back into
  (the editor's しまの おおきさ: 152 rows of land at most, twice the old 76); everything off the grid is sea. The rows of
  sea behind the land cost nothing: a band of chunks that is all sea has no bake or mesh (`terrain.ts`: the deep plane
  shows there), the worker builds no chunk of it (`mesh.ts openSeaRow`), and the fields' raster stops 4 rows past the
  land (`fields.ts rasterRows`, to a whole chunk: the default's 64 rows; behind it each channel's clamp, as off the
  grid). Tile (c, r) covers x `−90 + 30c … +30`, z `−90 + 30r … +30`;
  `r` grows into the island (away from the camera), as world z does. Read the extent from the layout
  (`model.ts extentOf`), never a constant.
- **Chunks of 8 × 8 tiles** (3 × 20 of them; the last column sticks out past the grid and is sea): the unit of a
  terrain op. The ops allow up to 16 chunks across and 32 deep (128 × 256 tiles; deep was 16 until 2026-11-10), so the
  grid can grow without a relay deploy.

## The island's size

`layout/resize.ts`, the editor's しまの おおきさ.

- **An edge a tile at a time:** `resizeEdge(layout, edge, ±n)` → `{ codes, blocked }` (`edge` まえ `front`, おく `back`,
  ひだり `left`, みぎ `right`). Along each line across the edge the outermost land tile (the beach, a cliff's edge, a
  river's mouth) moves a tile out and the tile it leaves takes the inner tile's kind and tier; a river running along
  the coast isn't doubled. Pulled in, the outermost tile moves in over the inner one and the sea takes its place, so a
  push then a pull gives the island back.
- **Bounds:** the land keeps `MARGIN` (2) tiles of sea round it and at least `MIN` (6) tiles across and along. The
  default (15 × 57) can grow its back 95 rows (to 15 × 152) and its east a tile; shift-click steps 8. The camera's middle across is the land box's middle
  (`model.ts midXOf`), so a lopsided pull stays centred.
- **In the way:** what stands on a tile the sea takes, or is newly wrong on its new ground, its `fixed` marked
  (catalog: a home, the museum, the shop, K.K.'s stool, the board, a goal tree, the summer pieces). `moveInside` moves
  each to its nearest clear tile (resolve.ts `clearTile`), the fixed and the biggest first; one with nowhere near is
  put away unless it's fixed: a fixed one stuck holds the resize.
- **The editor:** the side panel's しまの おおきさ, the land's size and four edges' − / ＋. A stepper hovered draws the
  ghost (land gained green, lost red, the new coast dashed: plan.ts `drawCoast`). A click is one action (edits.ts
  `resize`; ⌘Z), its chunk ops and moves one burst (`sendMany`), so the phones get it live and their camera's far end
  follows. Blocked, the list instead (★ fixed; a click selects and centres) and 「うごかす」 or やめる. The phone view's
  もようがえ has no terraforming, so no resize.

## The layout is data

`layout/model.ts` `Layout` (`codes`, `objects`, `homes`; `tile(c, r)`, `kind`, `tier`):

- **Terrain per tile:** one *kind* and one *tier*, one code `kind × 4 + tier` (base 36, one character in a chunk op).
  - Kinds (`grid.ts KINDS`, never reordered): `sea`, `grass`, `sand`, `dirt`, `stone`, `brick`, `plank` (path kinds),
    `river`, `pond`.
  - Tier 0…3: the cliff levels (each +40u). A tile next to a lower one has a cliff face on that side; river water
    that steps down a tier is a **waterfall** (derived, never painted).
- **Objects** (`layout/catalog.ts` `KIND_LIST`: each kind's footprint, whether it blocks, its block box, where it may
  stand, its drawn height, palette icon and names): trees (`oak`, `cedar`, `palm`, `bamboo`, `goal-tree` a|b),
  `bush` and `hedge`, `flower` (`c<n>`: the scatter's clump n), rocks, lights, NH's outdoor furniture, the seasonal
  spots (`beach-chair`, `sandcastle`, `snowboy`), NH's bulletin board (`board`: 2 × 1, one on the island, used from
  the tile in front of it, which must stay clear and reachable like a home's door), K.K. Slider's stool (`kk-stool`, id
  `kk-slider`: 1 × 1, one on the island, never deleted, its front tile `front-kk-slider` clear and reachable; the
  default puts it on まえ's lawn west of the main path at tile 6 × 22; docs/design.md "K.K. on his stool"), the pieces
  that join terrain (`bridge` over water, `stairs` up a cliff), the homes (`home`), the buildings (below) and named
  spots (`spot`: `villager-a|b` the villagers' home spots; the old fixed `stage` spot is dropped as a layout is read,
  model.ts `isLegacyStage`, since 2026-11-11: the stage is derived).
  Each: `id`, kind `k`, tile `x, z` (its footprint's lowest column and row), facing `f` 0–3 (0 toward the camera, −z;
  1 +x, 2 away, 3 −x), variant `s`. A footprint is `w × d` tiles, turned by `f` for the kinds that `turn`; for the
  others an odd `f` only mirrors the look. Every object's spot is a tile (no offsets).
- **Homes:** three, fixed ids `home-A` (ウェイ's, the campsite's tent), `home-B` (うめ's), `home-G` (the guest's).
  Where a home stands is an object; how it looks is its **style** (`layout/homes.ts`: `{m, w?, r?, d?}`), its owner's
  alone. A home's `(x, z)` is its door's tile (`model.ts originOf`), so a new look grows round its door; see "Homes".
- **The default layout** (`layout/default.json`, data: world.ts's island as the grid had it at 20 × 80, with the
  record's ops over it; /editor writes those, nothing regenerates the file): まえ (the sea, the beach, the health lawn, the goal trees, the stream's crossing and its bridge) at
  the front; おく (the campsite, the pond, the bamboo, the falls, the upper tier's forest) at the back; between them
  open grass, the stream on down its east side, the main path to the campsite, うめ's house (`HOME_B`, row 27) and
  the guest's (`HOME_G`, row 34) with paths to their doors and a lamp at each, the shop and the museum (below).
  Every piece on its own tile, no two sharing one (`layout.test.ts`). A phone's layout is the default with the
  record's ops over it (`layoutOf(entries)`).

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
  room; `relay/test/guest.test.ts`): the outdoors and every home's room anyone's (2026-11-10); a home's look its owner's alone.
- A room scope (`t`, `u`, `v`) is contract/tent.ts's op: its own ids, its own cap of 60 pieces.
- The room relays a layout op live but never keeps it in the day's ring (an afternoon in the editor would push the
  shared world out); a phone opening later reads it from the record. A `drag` with `sc: 'o'` is an outdoor object
  being moved (x, z its middle in world units): presence, as the tent's.
- **A burst** (the editor's save, a clash settled): my ops are merged and rebuilt once and go to the record as one
  burst (`week.sendMany`: one queue write, one recompute); the partner's, one socket message each, are merged as they
  come and rebuilt once, the tick after. The room relays 20 at once; the rest hear `busy` and the phone sends them
  again a second on (`e2e/live-sync.spec.ts` burst: all 40 arrive live).
- **Two edits on one tile:** last writer wins only per id, so two phones moving different pieces onto one tile at
  once would leave both there. When the partner's ops land, a piece of theirs that overlaps one of mine (validate.ts
  `overlap`) is settled: if my op is the later (`at`, then who: the same order on both phones), my piece moves to the
  nearest clear tile (`layout/resolve.ts clearTile`: rings outwards in a fixed order, same tier, out of the water, on
  grass when it belongs there, making no new error), as a normal op of mine; else it is theirs to move. Only one
  phone moves, so nothing ping-pongs; bridges and stairs stay and show the editor's overlap.
- **A door blocked between two edits** (a palm east of K.K.'s stool while the other phone turns the stool east): when
  the partner's ops land near a door, the merged island's `door` errors are looked at, and a pair of a landed piece
  of theirs and one of mine that clears the error when taken away is settled as an overlap is (`resolveMoves`). A
  door already blocked, or blocked by another piece, is nobody's. A burst away from every door costs no check.
- Ids: a default object's (`goal-A`, `fl:52:180`), a new one `o<time><random>` (`model.ts newObjId`); tokens
  (`k`, `s`, `m`) are lower-case; home parts (`w`, `r`, `d`) `[A-Za-z0-9.]`.

## Derived, never hand-made

- **Heights** (`layout/height.ts` `heightAt(layout, x, z)`, `fieldOf(layout)`): each tier 40u; grass and paths 3u over
  it, sand 1.2u, the river's and pond's bed 9u under the bank, the seabed falling away from the shore. Every region's
  corners are NH's rounded ones (a convex corner cut, a concave one filled): cliffs on a third of a tile, the soft
  edges (below) on half a tile, a staircase of tiles drawn a straight diagonal. Stairs ramp along their facing; a
  bridge's deck arches over its water.
- **Nav** (`layout/nav.ts` `navOf(layout)`): a walk grid at half a tile (15u): water and the sea block (a bridge's
  deck is walkable), so does every blocking footprint (its block box padded 5u); a step keeps to its tier but on
  stairs. A* with the corners pulled straight; `findPath`, `snapTap` (home → its door, water → the nearest bank, else
  the nearest walkable point), `walkable`, `reachable`, `named` (`homeA`, `homeB`, `door-home-A|B|G`, the default's
  seats, `front-<id>`). `planTap(navOf(layout), from, x, z)` for a tap. Builds in ~4 ms.
- **The visitors' stage** (`layout/spots.ts` `stageOf(layout)`, NH's plaza): the members' plaza mark when one is down
  and usable, else the open grass tile nearest the island's middle 200u behind the villagers' spots, with a clear tile
  each side, nothing tall in front of it on screen nor right behind; looser if none has that. `washedUp(layout, date,
  seed)`: Gulliver's beach, his mark when usable, else a free sand tile two in from the sea, by the date. The day's
  weeds and fossils keep off the stage; the wedding's arch and a birthday's cake stand by it (layoutWorld.ts ARCH,
  CAKE); the idle walks keep off it. Pure: every phone with the layout agrees.
- **The visitors' spots** (catalog.ts group `visitor`, kinds `plaza` おきゃくさんの ばしょ, `beach-spot` ジョニーの
  ばしょ and `guest-spot` ゲストの場所, one each, removable): a mark never drawn in play, standing on nothing (no overlap,
  no block). Every visitor but Gulliver stands at centre stage, so one plaza places them all; Gulliver's is its own and
  optional; the day's guest's (`guestSpot`; none: centre stage, `besideStage` while a visitor's on it) too.
  `markerSpot(layout, k)`: the latest put down, where they stand, or `at: null` when nobody can. `spotWhy(layout, k,
  c, r)`: why not, each reason with the tiles and things in the way (none: usable; `plazaOk`, `guestOk`, `beachOk`):
  - plaza: grass or a path, a clear 3 × 3 patch of its tier (the events' arch behind, cake in front), no door;
  - guest (since 2026-11-11; was the plaza's): its own tile of dry land (grass, a path, sand), nothing on it, no
    door, nothing in front or beside hiding them (hides.ts FIGURE_HIDES of its height, a tree's canopy), nothing within 60u
    behind in its column (their head takes its tap). A flower or a fence beside it is fine;
  - Gulliver (since 2026-11-11; was a tile round and three rows clear): lying across, his 81u body over three tiles,
    so those three sand of one tier with nothing on them, nothing in front or beside hiding his ±40u (a palm's fronds),
    nothing right behind his body (lying, 27u) nor his column once he stands up (60u). A palm diagonally behind his
    feet, or three tiles across, is fine.
  And reachable. Unusable: the derived spot, and validate.ts's `visitor-spot` warning naming the reasons
  (「横に花があります」, 「砂浜ではありません」, 「入口の前です」, 「段差があります」, 「歩いて行けません」, 「木に隠れます」…)
  with the blocking tiles and things. An ordinary `sc: 'o'` op.
- **Validation** (`layout/validate.ts` `validate(layout)` → issues, each `error` or `warn` with its tiles and ids): an
  object off the land or in water, one straddling a cliff, overlapping footprints, a tree off the grass (warn), stairs
  that join no cliff, a bridge over no water, a door or front that can't be reached, a missing or second goal tree, an
  unreachable named spot, land nobody can walk to (warn), water joined only at a corner or spilling over a cliff
  (warn). Advisory: the record keeps whatever the members save. The default has no errors (`layout.test.ts`).
- **What changed** (`layout/diff.ts` `diffLayouts(a, b)`): the chunks that differ, the objects added, moved (or
  turned, restyled) and removed, the homes whose look changed.

## API for the 3D scene

- **Pure** (`app/src/lib/layout/`, no three.js): `layoutOf(entries)` (the default with the ops merged over it), the
  `Layout`'s tiles, objects and homes (model.ts: `objMid`, `footOf`, `doorOf`, `extentOf`), `heightAt`, `navOf` /
  `findPath` / `snapTap` / `planTap`, `diffLayouts`.
- **The live layout** (`store/layout.svelte.ts`, its header lists the API): `layout.current` (reactive), `pos`, `obj`,
  `ofKind`, `home`, `on(fn)` (every change with its diff) and `apply(ops)` (mine: merged, kept, sent). IslandScene
  attaches it (the relay, the record's `state.layout` rows); every phone keeps the layout in localStorage.
- **three.js:** `buildGround(layout, { renderer, look })` (`world3d/terrain.ts`: the `Ground` interface, its group,
  heights, rebuild by chunk, season look, bands, `ready`, `restore`) and `placeObjects(layout, day)`
  (`world3d/objects.ts`: the engine's instances and the stand-ins, `day` the season and the date's swaps and pieces).

## The 3D ground

- **The geometry** (`layout/mesh.ts`, pure: its header has NH's quadrant scheme): rounded corners on vertices that meet
  the neighbours' exactly, a vertical wall at a tier's edge (NH's cliff strata), a waterfall where water steps down a
  tier, stone steps for the stairs.
- **The distance fields** (`layout/fields.ts`): each region's signed distance to its rounded edge (the land, the
  beach's sand, the fresh water, the paths, each tier), which the heights, the bake, the shore wash and the fresh
  water's edge read (~110 ms for the island on a desktop, ~300 on a phone). Built once per tiles and bridges, off the
  main thread as the app starts and cached for the next launch (`fieldsPrime.ts`, `fieldsCache.ts`: their headers);
  the mount waits for them.
- **Soft edges** (NH's coast is round): the data and the objects stay on tiles, only the drawn edge is round: the
  coast, the beach, the fresh water and the paths on half a tile, a staircase of tiles cut to a straight diagonal; a
  cliff's corner on a third of a tile; a river runs out to the sea square. The editor's plan stays tile-exact; its 3D
  preview is the same ground.
- **The river's turns** (`layout/river.ts`, its header has the rules): each river's main stem drawn as a **straight** for a run
  of tiles one way and **one arc** through a staircase between two, of one breadth, the arcs kept on the river's own tiles and straight at a bridge; a delta keeps its
  tiles. Walking, fishing and casts go by tiles. The editor marks it on the plan (`かわの せん`); `/editor?check` lists
  the arcs (かわの カーブ).
- **The look is baked on the GPU** (`world3d/terrain.ts`): one shader paints each band from the fields and the tiles,
  NH's way, at load and again only for what a change touches; the season's palette (`ground.look`) rebakes it all.
- **Bands:** a row of chunks (8 tile rows) is one band: 4 draws and one texture each, so the draws stay flat however
  long the island grows; bands out of view are culled. At most 12 bands are baked (`BAND_BUDGET`, ~2 MB a target):
  today's island (8) bakes all at once; past 12 (the longest has 20) a band coming into the camera's reach takes the
  farthest one's target (`near()`), so the GPU's bakes stay ~24 MB however long. The editor's 3D preview bakes all. The island renders at the 30 fps cap ([perf](ops/perf.md)).
- **The water:** NH's sea round the island (the shore foam, the shallows' turquoise ~70u out then a ~200u fade into
  the deep blue, so a fish's shadow reads across the fishing range); NH's waves washing ashore (`layout/swash.ts`, design.md "The sea's
  wash": one rhythm on the ground, the sea's shader and the CPU, so what washes in rides a wave); the rivers' flow
  along their stems hurrying white into a fall, the ponds' ripples, the falls' streaks (terrain.ts `FRESH_FRAG`), all
  on water.ts's shared clock, tint and fog.
- NH's textures: `npm run terrain-textures` (scripts/terrain-textures.ts) into `static/terrain/nh/*.webp`.

## The editor

`/editor/` (`routes/editor/+page.svelte`, `components/editor/`: `Editor.svelte`, `plan.ts` the canvas, `edits.ts` the
edits, `Preview3D.svelte`): unlinked, noindex, for anyone paired (A, B or the guest; a browser not paired gets the way
to `/pair`). `?demo` runs it on the demo's island (`?demo&as=B` beside it as the phone).

- **The plan:** the layout top-down, the back of the island at the top: tiles in NH's map colours (the higher a tier,
  the lighter), the cliffs' edges dark, a fall white, the objects by their icons, the homes labelled with their doors,
  the named spots as pins; what's wrong tinted on its tiles (a visitors' spot's warning: the tiles in the way too).
  Where the visitors and the guest stand while no usable mark of theirs is down (`stageOf`, `besideStage`) a dashed
  tile, 「お客さん（自動）」 / 「ゲスト（自動）」, recomputed with the checks.
- **The mouse:** えらぶ (V) picks up a piece and drags it on the grid (shift adds to the selection, a drag on empty
  ground draws a box); ぬる (B) paints a brush (くさ, すな, つち, いし, レンガ, いた, かわ, いけ, うみ; sizes 1–3); がけ (C)
  raises or lowers a tier; おく places from the palette (the island's one-offs greyed while they stand), its ghost
  green or red. The wheel or R turns what's held; Delete takes the selection away (never a goal tree, a home, a named
  spot or a one-off).
- **The keyboard:** ⌘Z / ⌘⇧Z (undo reverts one action over the island as it is now: the partner's changes stay),
  ⌘C / ⌘V (paste at the pointer), ⌘A, the arrows nudge, G the grid, the wheel zooms (⌘-wheel while placing), space and
  drag (or a right / middle drag) pans, 0 the whole island, 1–3 the brush.
- **Live:** each finished action goes out as layout ops at once (the record and the relay); a drag streams the
  piece's spot as presence (`drag`, `sc: 'o'`, ~10 a second). The checks (validate.ts) run a moment after every
  change; a click on one selects its pieces and centres its tiles.
- **The 3D preview** (`editor/Preview3D.svelte`; `?view=orbit` alone, `?view=phone` as a phone's camera): drawn
  through the island's own builders, so the two can't drift: `buildGround`, placeObjects' instances on today's day
  (`drawCheck.ts previewDay`), the homes, bridges, stairs and ponds (`world3d/built.ts` createBuilt) and K.K. on his
  stool (asleep 0–6; he follows the stool while it's held). Not drawn (not the layout's): the villagers, players and
  visitors, the day's finds, weeds and critters, the weather, the lamps' glow, the events' pieces.
  `world3d/previewDraw.test.ts` fails for a catalog kind with no drawing. **Moved by hand only:** orbit, a drag turns,
  the wheel or a pinch zooms, a right / shift / space drag or two fingers pan; phone, a drag on open ground pans, a
  pinch or ctrl-wheel zooms, the wheel scrolls (a press on a piece is IslandEdit's). The pan keeps the pivot over the
  land's box; ⌖ puts it back. The phone view's camera is the island's (`world3d/islandCam.ts`: the pitch by the zoom,
  the pivot below the middle, the haze, the band cull; `shadowBox.ts`), so a zoomed view is what the phone shows. It
  draws a frame only when something changed, at most 30 a second (`world3d/stage.ts`), never on a timer; the shadow
  map only when what casts or the shadow box moved.
- **`?check`** (`world3d/drawCheck.ts undrawn`): a 3Dの チェック panel listing each object the phones' 3D island doesn't
  draw as a model (a day of each season), and why: an unknown kind, a card of 2D art, nothing at all, a model file
  missing; a click selects it.
- **Files:** JSON に かきだす / JSON を よみこむ (model.ts `toJson` / `fromJson`; an import is one action), 最初の島に戻す
  (the reset op; the homes' looks kept) behind `editor/ResetConfirm.svelte`: what goes, then リセットする only once
  「リセット」 is typed (やめる the default; anyone, the guest too).
- **The e2e:** `e2e/editor.spec.ts` (a move live on the other tab and across a reload; a stroke and its undo / redo;
  R; Delete refusing a goal tree; placing refused on the river; the typed reset (A and G); the guest's door; しまの おおきさ live, blocked,
  うごかす and its ⌘Z), `e2e/editor-preview.spec.ts` (a pond on the plan in the preview, K.K. following his stool, the
  phone view's pan and ⌖, no frame while still).

## Homes

- **The catalogue** (`layout/homes.ts`, `homes.json`; `npm run home-models` with NH_MODELS converts NH's House* parts
  into `static/room/homes/`: 63 families, each part's GLB in its first colour with every other colour's albedo beside
  it and a 48px swatch per colour, ~2.9 MB plus ~18 MB of KTX2 packs; NH's own picker icons for the doors and the
  player house):
  - `campsite`: the campsite tent (ウェイ's by default);
  - `tent-n` (`w` 'A' | 'B'): NH's move-in tent; `tent-p`: the player's first tent;
  - `house`: NH's modular house, `w` a wall (`PA04Stucco.B`, or a villager house's: NA ようふう, NB ログハウス, NC わふう,
    ND こや), `r` the same shape's roof, `d` one of NH's 14 doors, each part in its colours (6–10). A roof of another
    shape is mended to the wall's.
  - Footprints (3u a model unit): the player house 5 × 3, a villager house 4 × 3 (ND 4 × 4), the move-in tent 3 × 3,
    the player's tent and the campsite 4 × 3; the porch inside the front row.
- **The defaults:** うめ's NH's player house (stucco, a western tile roof), the guest's a villager's log house (a
  thatched roof).
- **Sizes** (`homes.ts exteriorOf`): NH's player house has levels; the app's rooms have three sizes (design.md "The tent"
  › Room size), so the player house's outside follows its room: the chosen look (PA04) for 増築した部屋 8 × 8, NH's first
  house (PA00: its one wall, its roof in the same colour letter of NH's eight) for 初めての家 6 × 6 and テント 4 × 4.
  The footprint, porch and door stay the style's (PA00 stands inside PA04's): nothing on the layout moves. The island
  reads each room's size from the rooms' store (loaded after the first load), the editor's preview too. Not used: PA01
  (NH's 8 × 8 main room alone: it would replace the chosen look the largest room wears), PA02–PA03 (NH's back and side
  rooms: the app's homes have one room); PB04, PC04 and PD04 are NH's other final-house sidings and roofs (brick, log,
  stone, Japanese… with their own shapes), looks rather than sizes, not in いえを かえる yet. A villager's house and the
  tents have no levels.
- **Drawing them** (`world3d/home.ts buildHome(style)`: the three parts at 3u a model unit, NH's soft Lambert, a
  lamp's own glow; `world3d/objects.ts homePlaces(layout)`: each home's origin, front wall's middle and yaw; the
  campsite's tent stays placeObjects' instance).
- **いえを かえる** (`components/homes/HomePicker.svelte`): the owner's own, in their home's room and in the editor
  (わたしの いえ). The kind, the shape, the wall's and roof's materials and colours, the door; the house turning in a
  preview. A look that wouldn't fit where the home stands is refused there; これにする sends the `h` op. Only the owner
  may (`scopeMayWrite`: `hA` A, `hB` B, `hG` G).
- **Turning a home:** its facing (`f`) is part of its look, so only its owner turns it (the record and the room refuse
  anyone else's; an outdoor op never changes it). It turns about its door's tile, the footprint, the walk-up spot
  (`door-home-*`), the model's yaw and the way out of its room with it. A turn that would wall the door in or overlap
  is refused: the editor's R / wheel (own home only), the phone view's ↻ (shown to the owner), いえを かえる's ↻ まわす.
- **The rooms:** every home's inside is the tent's room system (`routes/tent/?home=B|G`, `TentRoom.svelte`'s `home`;
  `store/tent.svelte.ts` `rooms.A` the tent's `t`, `rooms.B` うめ's `u`, `rooms.G` the guest's `v`), the same 8 × 8 room
  whatever the outside. Anyone comes in, arranges it and switches its light (2026-11-10; design.md "Whose room").
  Presence says which home (`tent` and `drag` with `sc`; `store/where.svelte.ts`). Out of the door: in front of that
  home's door on the layout.
- **The e2e** (`e2e/homes.spec.ts`): うめ arranges her room, the guest sees it but can't arrange it; うめ swaps her
  house's look live; the guest swaps its own.

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
- **The default:** the museum on the clifftop behind the campsite (default.json: tiles 6…12 ×
  54…57), the shop in the middle west of the main path behind うめ's home (SHOP: tiles 2…8 × 34…37). On the live
  island the members placed both themselves; the e2e specs that walk on open lawn ask the page for it
  (`e2e/island.ts` `lawnTap`, `openNear`) rather than tapping a fixed point a building may stand on.

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

- **The kinds** (catalog.ts `GARDEN_KINDS`, NH's official names in kanji): all 30 of NH 2.0's fence items
  (`fence-<id>`; not placeable: FenceIkegakiSnow, the hedge's winter look; FenceShareTexture, a texture;
  FenceGardenPegRope, no item, its rope hung below its posts with no T or cross piece), six crops (`crop-<id>`: tomato,
  wheat, sugarcane, potato, carrot, pumpkin, its colour the variant), the gold roses, the lily of the valley and the
  vine (variant a | b | c). Ordinary `o` ops: the relay takes any kind token, no relay change.
- **A fence** takes its whole tile (catalog `block`, no `foot`): nobody stands or walks on it (nav.ts blocks its four
  cells), so the villagers' and players' ways go round a run (`e2e/garden.spec.ts`). A crop or a flower is walked over.
- **Joining** (NH's way, `fenceJoin`): a fence joins the same kind on the tile east, north, west or south of it on the
  same tier (never across a cliff, never another kind, never a diagonal). Its four neighbours pick one of NH's six
  pieces and its quarter turns (`fencePiece`): none `a` (across, or along when its facing is odd), one `b` (an end, its
  arm to the neighbour), two opposite `c`, two beside `d` (a corner), three `g` (a T), four `h`. NH's `e`, `f`, `i`
  (capped corners, a lone piece with a stub) have no neighbourhood of their own on a four-neighbour grid. The plan draws
  a fence as a post and a bar to each neighbour it joins. `layout/garden.test.ts` holds all 16 neighbourhoods.
- **Crops grow by the date** (`cropStage`): the day planted (the piece's id is `o` + its time, model.ts newObjId) a
  sprout, a stage a day after, ripe on the third and fuller on the fourth and fifth (NH's 0, 1, 2, 3Lv1–3), the same on
  every phone. No watering (NH's crops grow unwatered); a crop of the default's, or with no date, is grown. Each stands
  on NH's soil mound.
- **The garden's flowers** are always in bloom where they're put: no season, no watering, no hybrid (the wild flowers'
  watering and hybrids, care.ts, stay theirs).
- **The cedars' festive lights** (PltTreeCedarDeco, its lights lit at night, in the snow in winter): every cedar in the
  illuminated tree's weeks (fixedDecor.ts `WINDOWS.illumi`, Dec 15 – Jan 6).
- **NH's other bushes** (yellow hibiscus, blue and pink hydrangeas, yellow tea olive, red and pink camellias) are
  `bush` variants, their own models (assets.json `bushes/<id>`).
- **Placing** (`editor/edits.ts placeRun`): with a fence or a crop held, a press puts one down and a drag puts one on
  each tile it crosses, four-connected (across, then along, so a run joins), skipping tiles taken; the run is one action
  (⌘Z). The phone view's もようがえ has the same tabs, a piece at a time.
- **Loading**: their models are packs (scripts/world3d-assets.ts `GARDEN`, docs/world3d-assets.md) listed in
  `world3d/garden.json`, not assets.json: an island without a fence, a crop, a garden flower or lit cedars fetches none
  of it; with one, the manifest, then the packs it draws. The icons are one sheet for the editors
  (`static/room/editor/garden-icons.webp`, `npm run garden-icons`).

## The outdoor catalogue

The rooms' pieces outdoors (the user, 2026-11-10: NH's catalogue but character customisation): every housewares and
miscellaneous piece NH lets one put outdoors (the ACNH spreadsheet's `outdoor`, 415) and the 36 gyroids, less the 57
the editor already has as kinds of its own (by NH's model file, or its name): 394 pieces. Critter tanks stay indoors
(the rooms' 生き物 gives each ずかん catch's; the editor isn't gated by the ずかん).

- **Data:** `npm run outdoor-catalog` (`scripts/outdoor-catalog.ts`) writes `layout/outdoor.json` from the room data
  (tent/items.json, more.json, the seats, NH's names in i18n/tent.*.json): each piece a kind `nh-<code>`, its tab by
  NH's tag. Rerun it after room-models; `layout/outdoor.test.ts` fails while the two differ.
- **Tabs:** NH's lamps under 明かり, seats, tables, beds and baths under 家具, the ranch under キャンプ, dishes under
  食べ物; new tabs 庭 (garden, plants, Japanese), 公園 (playground, sports, the plaza's rides and stalls, shop signs,
  music), 街 (vehicles, works, screens and walls, the castle, arches), 海辺, オブジェ (landmarks, space, toys, Mario,
  Sanrio), 行事 (the seasons' and Festivale's) and はにわ. Both editors; icons NH's own (static/room/icons) or the ずかん's.
- **Same indoors and out:** a piece is drawn from its room model (loose, or cut from its room pack: one shared
  `tent/roomPacks.ts` store; `world3d/outdoorModels.ts`) at NH's furniture scale, turned by its facing; its footprint,
  top (layout/tops.ts), small flag, seat (nav.ts, villager3d/seats3d.ts) and light (things.ts lamps: its room emitter
  for a piece with NH's lighting; a glowing piece's emissive lit at night) are the room's. Nothing is converted again:
  no new static files.
- **Loading:** `layout/outdoor.ts` imports the table only when the layout has an `nh-` piece (the layout store
  rebuilds once it's in, so the walk, the checks and the scene see them) or an editor opens; till then the kinds are
  unknown and nothing of them is drawn. First load: the table and the models stay out of it.
- **The e2e:** `e2e/editor-catalogue.spec.ts` (the phone もようがえ's はにわ tab, four pieces put down, on the island
  at their room height, the streetlight lit at night).

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
  the desktop editor's Delete takes them with it (⌘Z brings both), the phone's 🗑 refuses until they're off (the rooms'
  「上のものを先に片付けてください」). The e2e: `e2e/editor-surfaces.spec.ts`.

## Phone editing

`components/layoutEdit/IslandEdit.svelte`: the island's もようがえ in the editor's phone view (the tent's もようがえ
stays the room's), the tent's way (TentEdit's tray, bar and buttons). The tray's tabs (き, かんぼく, はな, 野菜, フェンス, いわ, あかり,
かぐ, キャンプ, 食べ物, ジム (design.md "Decorating"), はし・さか, たてもの, おきゃくさん: the visitors' marks drawn over the ground only in
this mode, red when nobody can stand there with the reason in the bar) over every placeable kind; a tap on one puts
it down as a ghost on the free tile nearest the view's middle, its footprint green or red, the bar saying why; a finger
on it, or on any placed thing, drags it a tile at a time; a tap on the ground moves it there; ↻ まわす, ✕ やめる, ✓ ここに
おく, 🗑 しまう (never for a goal tree, a home, a one-off). While held the other phones see it move (`drag`, `sc: 'o'`);
a drop is its ops at once. Anyone's, the guest's too. Terraforming (paths, water, cliffs) is the desktop editor's
alone.

It runs over any stage: `{ host, toScreen(x, z, lift), toGround(sx, sy), size(), moved(fn), hide(ids) }` (`moved`: told
of each camera move, no probe each display frame). The editor's phone view
gives it one (`/editor/?view=phone&edit`: the 3D island's camera and bend, `&cam=<z>` its spot; `&preview=0` a flat
plan, the e2e's; `?view=orbit` the 3D preview, `&eye=x,y,z&at=x,y,z` its camera). The e2e: `e2e/island-edit.spec.ts`,
`e2e/decor.spec.ts`, `e2e/island3d-layout.spec.ts`, `e2e/gym.spec.ts`, `e2e/visitor-spot.spec.ts`.

## How the 3D island reads it

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
- The e2e: `e2e/layout-island.spec.ts`; unit: `island/layoutWorld.test.ts`.
