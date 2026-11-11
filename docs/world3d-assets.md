# The 3D island's assets (NH's models for every island art key)

The island draws NH's own models for its art keys. The manifest is `app/src/lib/components/world3d/assets.json`
(typed: `world3d/assets.ts`); the map from art key to model is `scripts/world3d-assets.ts`. The per-key table is the
manifest itself; this doc keeps the pipeline, the rules and a summary.

## How they're made

The source is NH's 2.0.0 export (archive.org `acnh-2.0.0-models`, `ACNH_2.0.0_Exported_Model_DAE+PNG.7z`, md5
4c42817a…: 57,822 `<Model>.Nin_NX_NVN` folders of .dae and PNG), extracted to `~/Downloads/acnh-2.0.0-models/Model`.

- Every converter looks a folder up by its exact name (`scripts/nh-folders.ts`: a case-only match fails the run;
  room-models.ts SHEET_CASE spells the sheet's few as the export does).
- `scripts/world3d-assets.ts`: the map (art key → NH model folder, the conversion's options, the key's scale and
  anchor). `scripts/world3d-models.ts` converts them: NH's materials baked into one WebP each (≤ 128 px for small
  things, 256 for furniture, 512 for the tent and the countdown board), merged per material, quantised and
  meshopt-compressed by gltfpack, triangles capped per kind (critters 2,500, visitors 4,000).
  `NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run world3d-models [-- --only=critters/,finds/]`. The raw model
  files never enter the repo; the converted GLBs ship on the site.
- Output: `app/static/room/world3d/<kind>/<id>.glb` (under `/room/`: the service worker caches a file on first use,
  never at install). The first 45 models stay in `models.json` and serve their keys from there.
- **Then `npm run world3d-ktx2`** (`scripts/world3d-ktx2.ts`, its header: the packs, the loose textures, the
  transcoder, what it needs): the island draws KTX2 (`world3d/ktx2.ts`: ASTC on an iPhone, kept transcoded in
  IndexedDB); the island's models then carry no WebPs (`scripts/glb-webp.ts`: each model's in its
  `static/room/tex/<id>.webpp`, drawn only without a KTX2; the sheet and seat tools put them back), the rooms' keep
  theirs. `world3d/ktx2.test.ts`
  fails until it's run after a model, a home or a player part changes. Its `CAPS` caps a texture's KTX2 smaller than
  its WebP (the exteriors seen only from the island's camera: their top mips dropped; ktx2.json `caps`, the key
  `<hash>@<px>`, texHash.ts texKey).
- See-through two-sided parts (glass, curtains, a critter's fade) are two meshes, one a side (`world3d/sides.ts`):
  three's own two passes re-derive the program twice a draw.
- **Validation:** `node scripts/world3d-sheet.ts [-- --only=bug,fish] [-- --night]` draws every model at its world
  scale beside an 80u villager card, at the island's 30° pitch, to `/tmp/world3d-assets/sheet-<kind>-<n>.png`;
  `world3d/assets.test.ts` holds each file to its kind's budget; the editor's `?check` lists what isn't drawn as a
  model (docs/island-layout.md "The editor").

## The manifest (assets.json)

`models` (per model: bounds, triangles, KB, content hash, `lit`), `keys` (per art key: the model, its scale, `anchor`
`feet` / `centre` / `joint`, footprint, tap radius, shadow, facing, winter look, `lazy` group, stand-in) and `budgetKb`
per kind: the fields are typed and explained in `world3d/assets.ts`; `world3d/assets.test.ts` holds every file to its
kind's budget and the whole to 15 MB.

## Rules

- **Scales:** NH's furniture scale is the island's (`world.ts` DECOR_U = 3u a model unit; a tile is 10 model units).
  The critters and the visitors are at the villagers' scale, 5.4 (an NH villager is 14.9 units, the island's 80u).
  The finds, the fruit, the shadows and the presents are drawn at their art's sizes (`h` in the map).
- **Colours:** NH's gray albedo + gradient materials take their colour from the gradient's row: each flower colour
  its own model (no runtime tint), the bushes, the star fragments, the shells, the present, the pumpkin. Albedos whose
  alpha isn't an opacity (the mushrooms', the coconut's) are read raw and made opaque.
- **Animation:** none in NH's files (bind pose only), so the critters' idle motion stays the runtime's. The visitors'
  arms are lowered from the bind pose.
- **Effects:** the seasons' falling leaves, petals and snowflakes are NH's own. NH's files have no effect models, so
  the 「！」, the dust, the splash, the zzz, the confetti, the flame and the like are small unlit stylised meshes,
  ~2 KB each (`scripts/world3d-fx.ts`, the `fx/*` keys);
  the sparkle is `effects.ts`' star in code; the heart and the ♪ are NH's item icons. Rain and snow have no assets:
  they're drawn in their shaders (`world3d/precip.ts`, design.md "Weather").
- **Parts split out** (`split` in the map: `scripts/world3d-page.js` splitOff): the weight bench's baked-in barbell is
  lifted into a node of its own, `bar` (assets.json's `part`), so a press can draw the standalone barbell in the hands
  (`world3d/benchBar.ts`).
- **Packs** (`PACKS` in the map: the camp goods, the food, the gym's newer pieces): one GLB a tab
  (`static/room/world3d/decor/{camp,food,gym2}.glb` and `camp2.glb`, each under 400 KB, one KTX2 pack each), each
  member a node named its id (world3d-page.js convertPack, gltfpack `-kn`), a model `decor/<id>` in assets.json with `pack` its file, its key
  made at load (assets.ts packKey); things.ts reads the node out (`member`). island/decor.ts knows them by catalog.ts
  `packed`, never assets.json (that would pull it into the first load).
- **The garden** (`GARDEN` in the map; docs/island-layout.md "Fences and the garden"): packs under
  `static/room/world3d/garden/` (the fences, the crops' stages and soil, the garden's flowers and vines, the cedar's
  lights), their models in `world3d/garden.json`, not assets.json, so the first load never carries them
  (`world3d/garden.ts` loads it when the island has one). NH's remake fences have no albedo: their `_Mix` map picks
  the colour along the gradient's row (`grdMix`).
- **Held tools and accessories:** the bug net, the rod and its bobber (NH's wooden ones: the plain ones have no
  textures in the files), the birthday's cake hats and NH's party glasses, at the villagers' scale, `anchor: joint`.
- The plumeria isn't in NH's files: NH's hibiscus stands in, in the plumeria's white and pink.

## The museum

`scripts/world3d-models.ts --museum` (`NH_MODELS=… npm run world3d-models -- --museum [--only=…]`) writes the museum's
own models to `static/room/museum/` and `museum/models.json`: NH's tank and garden props (one GLB each, WebP
textures), its floors and walls (`tex/`), and its exhibits in packs (each member a node named its id, models.json
`pack` its file; Cloudflare Pages answers a Range with the whole file, so a pack is fetched whole, and only once one
of its members is on show):

- **Fossils:** 22 packs, one a skeleton (`fossil-<set>`) and `fossils` (the 14 standalone ones), NH's `FtrFossil*`,
  128 px textures, ≤ 3,000 triangles a piece; 3.2 MB in all.
- **Art:** the 43 genuine `FtrArt*` and `FtrSculpture*` (never a `*Fake`): `art-paintings-1|2` (256 px: they're read)
  and `art-statues-1|2` (128 px); 0.8 MB. Their NH icons (`Layout_FtrIcon_*`) at 96 px in `static/art/finds/art/`.
- **NH's museum-tank variants** (`*Museum`): the 12 sea creatures' (`sea-museum`) and the dung beetle's
  (`bug-museum`); the other variants are the catch's own meshes, so the aquarium and the garden keep the catch models.

## The rooms' catalogue

`npm run room-models` (`scripts/room-models.ts`, its header; `room-models-page.js` converts): every housewares,
miscellaneous, wall-mounted and ceiling piece of NH's (the spreadsheet's rows with a model in the export), every rug,
every gyroid (its first colour: a piece is one colour, NH's catalogue one), and each island catch's tank (`cr`: NH's
fish, bug or sea creature put down indoors): 2,341 pieces, 306 wallpapers, 209 floors. `-- --new` converts only what
isn't yet.

- **Materials:** a material's textures are the ones its Collada effect samples (a tank's `mLight` samples `mBody`'s);
  a gray albedo takes its gradient's first row (NH's first colour: the frozen series, the fortune-telling set's ball).
- **Tanks:** NH swims the critter in by its animation, which the files lack: at its bind pose it pokes out of its
  tank, so it's turned side on and fitted in its container's glass (`fitCritter`); the water and the glass's inner
  faces (NH's shader's) aren't drawn.
- **Ceiling pieces** hang from their origin (`cl`: the model under it); `items.test` holds all 39 to it.
- **Wallpapers and floors:** the albedo with NH's overlays flattened over it (`AlbOry`, `AlbEx`; an animated one's
  first frame): the static look of NH's moving ones. Their glow (`Emi`) is an emissive map lit in the dark (night, or
  the room's light off: engine.ts `glows`).

The island's outdoor catalogue draws these same room pieces (docs/island-layout.md "The outdoor catalogue"): the
room's GLB, from its pack or loose, at NH's furniture scale; nothing converted twice.

### Room packs

`scripts/room-packs.ts` (run at room-models' end; `--unpack` writes the files back to `.cache/room/`): every piece,
wallpaper and floor past the starter set and the ずかん's pieces is packed into `static/room/pack/<group>[-k].<hash>.pak`
(ktx2Pack's container, ≤ 64 KB, ~3-4 models: a room pays a whole pack for each piece it shows; the packs are the
only copy): the models by group (a group's series together), the wallpapers' and floors' pictures and glows, and the
icons of the tabs browsed a tab at a time (≤ 160 KB). A file's place `[pack,
offset, bytes]` is in `tent/more.json` (`pk`, `tex`, `icons`); the phone cuts it from its pack, fetched whole and once
(`items.ts` roomPacks: Pages ignores a Range), the service worker keeping it: ~690 packs, ~37 MB. The
shop's pieces keep loose icons (a day's stock is any 24 of them: their packs would cost more than the icons); its
stock keeps a pack's pieces together (contract/stock.ts `UNITS_FROM`): ~5 packs a day, not ~14.
`tent/more.json` and `tent/seats-more.json` load with the room's chunk only (items.json, the starter set's and the
ずかん's, with the presents too).

## Seats and beds

`villager3d/seats3d.ts`, `seats3d.json`; `npm run seat-anchors` (`scripts/seat-anchors.ts`): every piece a villager
sits or lies on (the rooms' furniture with NH's `interact`, the island's benches, stools and hammock) has its seat or
bed found from its converted model (rays down: `scripts/room-surfaces.ts` seatOf, bedOf), an OVERRIDES table for the
odd ones, and the gym's pieces used in place (USE). `anchorsOf(shape, place)` places one and `v.sitAt(anchor)`
(villager3d.ts) sits or lies there; the tent's seats (`tent/seats.ts`), the museum's benches (`museum/seats.ts`) and
the island's (`world3d/villagers.ts`) pass their anchors.

A lid (`tent/lid.ts` LIDS, the cold sleep pod's): cut out of the body's mesh at load and turned about its hinge (its
header: NH ships no clip, bone or shut variant). No re-export.

**The pose data** (`seats3d.json` `tent[code]` / `island[model]`, model units, the model's own frame): its schema is
seats3d.ts's header (`Shape`); a new piece adds one entry and needs nothing else.

The room turns and scales it with its piece (grid.ts `toRoom`); one gets on from the nearest free side
(`tent/seats.ts`); a piece whose seats have no pose isn't offered. `tent/seats.test.ts` checks every one at 4 facings.

## Lamps' emitters

`npm run room-models -- --emitters`: each of the rooms' lights (NH's `lightingType`) gets `e` in items.json, its point
light's spot: NH's `Light` locator when it's within the model (`el`), else the weighted middle of its emissive map's lit
texels, else EMITTERS by eye (`room-surfaces-page.js`). items.test checks each inside its emissive part at every facing.

## Fishing

Runtime behaviour, not assets: `world3d/fishing3d.ts`'s header (the line's steps, the rod, the float), with
`world3d/facing.ts`, `biteMark.ts` and `fishLine.ts`; the rule is design.md "Fishing".

## Villagers and visitors

Their skinned models are converted apart (`scripts/villagers3d-models.ts`, `scripts/villagers3d-page.js`) into
`app/static/room/villagers3d/<id>.glb` (458 files, ≤ 100 KB each), posed in code: the villagers, the roster's special
characters, by `VISITOR_ONLY` (not in the picker) the visitors and the shop's twins (`timmy`: one model for Timmy and
Tommy), and the guests (island/visitorRoles.ts), loaded only on their day. One whose clothes aren't part of its body
names its top's mesh and texture there; the converter fails a villager with a material missing its base colour, and
`villager3d.test` holds every material to its default top. Tulin, Mineru, Cece and Viché aren't in the 2.0.0 export:
their cards stay.

## Players

The human players' parts (`scripts/players3d-models.ts`; the runtime: [design.md "Players"](design.md#players)) ship in
44 packs, not ~5,200 loose files: `app/static/room/player/<home>.<hash>.pak` (~22 MB: `player3d/packing.ts`,
`scripts/player-packs.ts`, `npm run player:packs`), beside the whole part table (`parts.json`).
A pack is `ktx2Pack.ts`'s container (its files' paths in its head). Each file's place, `at` (a KTX2's, `k`: `[pack,
offset, bytes]`), is in both part tables.
- **Homes:** `everyday` (the body and both いつもの looks as a phone draws them, KTX2s included: ~330 KB, fetched whole
  as a player is first drawn, one request where there were 25); `face`, `hair` and a slot's first-closet garments
  (`top`, …: the bundled table's, what the closet lists and a saved コーデ wears; by id, a line's colours together, a
  shape with the first to wear it), ≤ 256 KB a pack; `more-<slot>` (the whole table's other ~4,000 items) and `webp`
  (the WebPs of textures with a KTX2: only a page without a GPU format draws them), ≤ 1.2 MB. A home past its bound
  splits as stably as can be (`lib/packPlan.ts planHome`).
- **On the phone** (`parts.ts`, `lib/packStore.ts`): any other part is cut from its pack, fetched whole and once
  (Pages answers a Range with the whole file), so a first wear costs its packs; the service worker keeps them
  (`island-room-v1`). Offline, a part never fetched is drawn as いつもの's (`player3d.ts wearable`).
- **Sources:** the packs are the only copy in the repo. `npm run player:packs -- --unpack` writes every file loose into
  `app/.cache/player/` (gitignored), the tree `players3d-models.ts` writes there and packs at its end;
  `npm run world3d-ktx2` packs the KTX2s it makes. `player3d/parts.test.ts` checks every place.

## The inventory

Written by `npm run world3d-models` from assets.json (the per-key rows are in the manifest).

<!-- assets:start -->
598 keys, 495 models, 6.34 MB in all.

| kind | keys | models | KB | loads |
| --- | --- | --- | --- | --- |
| accessory | 3 | 3 | 52.6 | lazily (event) |
| find | 129 | 52 | 406.8 | with the island |
| scenery | 4 | 2 | 68.2 | with the island |
| bush | 25 | 25 | 298.5 | with the island |
| sea | 40 | 40 | 495 | lazily (sea) |
| bug | 82 | 82 | 1106.3 | lazily (bug) |
| fish | 83 | 83 | 891.5 | lazily (fish) |
| deco | 48 | 39 | 862.8 | with the island |
| event | 6 | 6 | 115.2 | lazily (event) |
| decor | 89 | 23 | 1160.1 | with the island |
| flower | 42 | 42 | 551.5 | with the island |
| fruit | 4 | 4 | 47.9 | with the island |
| fx | 15 | 15 | 45.8 | with the island |
| shadow | 15 | 15 | 41.9 | with the island |
| tool | 3 | 3 | 18.3 | with the island |
| tree | 10 | 10 | 325.1 | with the island |

### No model of its own

| keys | status |
| --- | --- |
| villagers/* | not here: the villagers and the visitors are skinned models of their own (scripts/villagers3d-models.ts); a villager with none is its card |
| trees/*-canopy, trees/*-trunk | the tap layer’s: an oak’s two DOM tap boxes (Scenery.svelte) are cut to them; the 3D tree is one model |
| reactions/* | billboard: the villagers’ emotes |
| fx/* (sparkle, bang, dust, splash, ripple) | not NH’s: NH’s files have no effect models (no Eff*/Emo*), so these are stylised meshes in the art’s colours (scripts/world3d-fx.ts) |
| deco/airport | not on the island: the pairing page’s map icon |
| host/*, items/snack, items/dinner, money/* | not on the island: the panels’ and the HUD’s art |
| finds/items/*, finds/recipes/* | not on the island: the balloon catalogue’s icons, on the catch plate |
| deco/tape-deck | approximate: NH’s boom box (FtrRadicase) stands for the tape deck (the POC’s) |
| finds/shovel, finds/watering-can | approximate: NH’s wooden shovel and watering can (the plain ones’ textures aren’t in the files) |
<!-- assets:end -->
