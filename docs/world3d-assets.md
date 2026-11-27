# The 3D island's assets (NH's models for every island art key)

The island draws NH's own models: manifest `app/src/lib/components/world3d/assets.json` (typed in `world3d/assets.ts`),
art key → model in `scripts/world3d-assets.ts`. Converted GLBs ship on the site; the raw export never enters the repo.

## How they're made
Source: NH's 2.0.0 export (archive.org `acnh-2.0.0-models`) in `~/Downloads/acnh-2.0.0-models/Model`; folders by exact
name (`scripts/nh-folders.ts`).
- `NH_MODELS=… npm run world3d-models [-- --only=critters/,finds/]` (`scripts/world3d-models.ts`): one WebP per
  material (128 px small, 256 furniture, 512 tent and countdown board), merged, gltfpack, triangles capped (critters
  2,500, visitors 4,000) → `app/static/room/world3d/<kind>/<id>.glb` (cached on first use, never at install).
- **Then `npm run world3d-ktx2`** (`scripts/world3d-ktx2.ts`): the island draws KTX2 (`world3d/ktx2.ts`, ASTC on
  iPhone, transcodes in IndexedDB); WebP albedos move to fallback packs `static/room/tex/webp-*.pak`
  (`scripts/glb-webp.ts`, the only copy; used with `?ktx2=0` or a failure). `world3d/ktx2.test.ts` fails until rerun
  after a model change; `CAPS` shrinks far-only textures.
- See-through two-sided parts are two meshes (`world3d/sides.ts`).
- **Validation:** `node scripts/world3d-sheet.ts [-- --only=bug,fish] [-- --night]` → `/tmp/world3d-assets/`;
  `world3d/assets.test.ts` holds each kind's `budgetKb` and 15 MB in all; the editor's `?check` lists undrawn kinds
  (docs/island-layout.md "The editor"). NH's 2D icons: `npm run icons:nh` (`scripts/nh-icons.ts`).

## Rules
- **Scale**: furniture at world.ts `DECOR_U` (3u a model unit); critters and visitors at the villagers' 5.4.
- **Colour**: gray albedo + gradient materials take the gradient's row (no tint).
- **No animation** in NH's files: idle motion is the runtime's; effects are small stylised meshes
  (`scripts/world3d-fx.ts`, `fx/*`); rain and snow shaders (`world3d/precip.ts`).
- **Split parts** (`split`): the weight bench's `bar` (`world3d/benchBar.ts`).
- **Packs** (`PACKS`): one GLB a tab under `static/room/world3d/decor/`, members as named nodes (assets.ts packKey),
  found by catalog.ts `packed`, never assets.json.
- **The garden** (`GARDEN`; docs/island-layout.md "Fences and the garden"): packs under
  `static/room/world3d/garden/` (`world3d/garden.json`), loaded only when the island has a garden.

## The museum
`npm run world3d-models -- --museum` → `static/room/museum/`, `museum/models.json`: tanks, props, floors, walls;
exhibits in packs (22 fossil, 43 artworks in `art-*`, tank variants), each fetched whole once on show (Pages ignores
Range).

## The rooms' catalogue
`npm run room-models` (`scripts/room-models.ts`; `-- --new`): every NH houseware, miscellaneous, wall, ceiling piece,
rug, gyroid and catch tank (2,341 pieces, 306 wallpapers, 209 floors); remake patterns (`scripts/room-pattern.ts`);
critters fitted into tanks (`fitCritter`). **Wallpapers and floors**: overlays flattened (`AlbOry`, `AlbEx`), glow
(`Emi`) lit in the dark (engine.ts `glows`). Lamps: `-- --emitters` writes each light's `e`. The outdoor catalogue
reuses these (docs/island-layout.md "The outdoor catalogue").

### Room packs
`scripts/room-packs.ts` (`--unpack` → `.cache/room/`): everything past the starter set and the ずかん's is packed into
`static/room/pack/<group>[-k].<hash>.pak` (≤ 64 KB; tab icons ≤ 160 KB; ~690 packs), the only copy; places in
`tent/more.json`; fetched whole once (`tent/roomPacks.ts`). A day's stock keeps a pack's pieces together
(contract/stock.ts `UNITS_FROM`).

### Our own pieces
`scripts/room-own.ts`: an NH piece made ours with our picture (`design/room/<code>.png`, `room-own-letters.py`) or
digits (`room-own-digits.py`); GIFTS (tent/items.ts) makes it a find. Codes `f9xxxx` (wedding board, the 2026/2027
arches).

## Seats and beds
`npm run seat-anchors` (`scripts/seat-anchors.ts`, `scripts/room-surfaces.ts` seatOf, bedOf, OVERRIDES) →
`villager3d/seats3d.json` (seats3d.ts `Shape`); `anchorsOf(shape, place)`, `v.sitAt(anchor)`; `tent/seats.test.ts`
checks 4 facings. Lids and moving parts: `tent/lid.ts`, `tent/uses.ts`; bath floors `scripts/inner-floor.ts`.

## Villagers and visitors
`scripts/villagers3d-models.ts` → `app/static/room/villagers3d/<id>.glb` (458, ≤ 100 KB), posed in code, loaded on
their day; `VISITOR_ONLY` keeps visitors out of the picker.

## Players
Parts (`scripts/players3d-models.ts`; runtime [players.md](players.md)) ship as 44 packs
`app/static/room/player/<home>.<hash>.pak` (`npm run player:packs`, `scripts/player-packs.ts`, `player3d/packing.ts`,
`lib/packPlan.ts`), places in `parts.json`: `everyday` (body, いつもの), `face`, `hair`, first-closet garments per slot
(≤ 256 KB), `more-<slot>`, `webp` (≤ 1.2 MB); cut by `lib/packStore.ts`; offline an unfetched part draws as いつもの.
The only copy: `-- --unpack` → `app/.cache/player/`; `player3d/parts.test.ts` checks every place.

## The inventory
Written by `npm run world3d-models` from assets.json.

<!-- assets:start -->
598 keys, 483 models, 6.26 MB in all.

| kind | keys | models | KB | loads |
| --- | --- | --- | --- | --- |
| accessory | 3 | 3 | 52.6 | lazily (event) |
| find | 129 | 52 | 406.8 | with the island |
| scenery | 4 | 2 | 68.2 | with the island |
| bush | 25 | 20 | 242.9 | with the island |
| sea | 40 | 40 | 495 | lazily (sea) |
| bug | 82 | 82 | 1106.3 | lazily (bug) |
| fish | 83 | 83 | 891.5 | lazily (fish) |
| deco | 48 | 39 | 862.8 | with the island |
| event | 6 | 6 | 115.2 | lazily (event) |
| decor | 89 | 23 | 1160.1 | with the island |
| flower | 42 | 42 | 551.5 | with the island |
| fruit | 4 | 4 | 47.9 | with the island |
| fx | 15 | 15 | 45.8 | with the island |
| shadow | 15 | 8 | 22.4 | with the island |
| tool | 3 | 3 | 18.3 | with the island |
| tree | 10 | 10 | 325.1 | with the island |

### No model of its own

| keys | status |
| --- | --- |
| villagers/* | not here: the villagers and the visitors are skinned models of their own (scripts/villagers3d-models.ts); a villager with none is its card |
| reactions/* | billboard: the villagers’ emotes |
| fx/* (sparkle, bang, dust, splash, ripple) | not NH’s: NH’s files have no effect models (no Eff*/Emo*), so these are stylised meshes in the art’s colours (scripts/world3d-fx.ts) |
| deco/airport | not on the island: the pairing page’s map icon |
| host/*, items/snack, items/dinner, money/* | not on the island: the panels’ and the HUD’s art |
| finds/items/*, finds/recipes/*, finds/pack/* | not on the island: the balloon catalogue’s icons (clothing, recipes, artworks packed), on the catch plate |
| deco/tape-deck | approximate: NH’s boom box (FtrRadicase) stands for the tape deck (the POC’s) |
| finds/shovel, finds/watering-can | approximate: NH’s wooden shovel and watering can (the plain ones’ textures aren’t in the files) |
<!-- assets:end -->
