# The 3D island's assets (NH's models for every island art key)

The island draws NH's own models for its art keys. The manifest is `app/src/lib/components/world3d/assets.json`
(typed: `world3d/assets.ts`); the map from art key to model is `scripts/world3d-assets.ts`. The per-key table is the
manifest itself; this doc keeps the pipeline, the rules and a summary.

## How they're made

The source is NH's 2.0.0 export (archive.org `acnh-2.0.0-models`, `ACNH_2.0.0_Exported_Model_DAE+PNG.7z`, md5
4c42817a…: 57,822 `<Model>.Nin_NX_NVN` folders of .dae and PNG), extracted to `~/Downloads/acnh-2.0.0-models/Model`.
It holds the old `~/Downloads/Model` set but for 15 layout icons; a run on both can take a folder of symlinks, the new
first. It brought the 2.0 villagers, Brewster, Kapp'n and Wilbur, and 376 tent pieces; nothing the island lacked.

- `scripts/world3d-assets.ts`: the map (art key → NH model folder, the conversion's options, the key's scale and
  anchor). `scripts/world3d-models.ts` converts them: NH's materials baked into one WebP each (≤ 128 px for small
  things, 256 for furniture, 512 for the tent and the countdown board), merged per material, quantised and
  meshopt-compressed by gltfpack, triangles capped per kind (critters 2,500, visitors 4,000).
  `NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run world3d-models [-- --only=critters/,finds/]`. The raw model files never enter
  the repo; the converted GLBs are public.
- Output: `app/static/room/world3d/<kind>/<id>.glb` (under `/room/`: the service worker caches a file on first use,
  never at install). The first 43 models stay in `models.json` and serve their keys from there.
- **Then `npm run world3d-ktx2`** (needs `basisu`: `brew install basis_universal`): each model's WebPs (world3d,
  homes, structures, villagers3d, player) as KTX2 (UASTC, mipmaps built), one pack a model in
  `static/room/tex/<id>.ktx2p` (`world3d/ktx2Pack.ts`); the loose WebPs those models wear (the homes' other colours,
  the players' faces and the bundled closet's garments: `texHash.ts looseTextures`) as KTX2 beside them; and three's
  transcoder wasm in `static/room/basis/`. The island draws those (`world3d/ktx2.ts`: ASTC on an iPhone, kept
  transcoded in IndexedDB); the WebPs stay for the museum's own models, the tent's furniture and a fallback.
  `world3d/ktx2.test.ts` fails until it's run after a model, a home or a player part changes.
- See-through two-sided parts (glass, curtains, a critter's fade, the particles) are two meshes, one a side
  (`world3d/sides.ts`): three's own two passes re-derive the program twice a draw every frame. The same pixels.
- **Validation:** `node scripts/world3d-sheet.ts [-- --only=bug,fish] [-- --night]` draws every model at its world
  scale beside an 80u villager card, at the island's 30° pitch, to `/tmp/world3d-assets/sheet-<kind>-<n>.png`;
  `world3d/assets.test.ts` holds each file to its kind's budget; the editor's `?check` lists what isn't drawn as a
  model (docs/island-layout.md "The editor").

## The manifest (assets.json)

- `models`: per model its bounds (model units), triangles, KB, content hash (`?v=`), `lit` (an emissive: lights at night).
- `keys`: per art key `m` (the model), `cat`, `s` (world units per model unit), `anchor` (`feet`: the origin on the
  ground; `centre`: the bounds' centre at a height: a flying bug, a held fish, a balloon; `joint`: NH's hand or head
  joint: a held tool, a hat, the party glasses), `foot` (tiles of 30u, unturned), `hit` (tap radius, u; at least 12),
  `shadow` (casts one; not the flat things), `lit`, `yaw` (a decoration's facing: one model for its four facings),
  `winter` (the key of its winter look), `lazy` (loaded with its group: `bug`, `fish`, `sea` per the month's critters,
  `event`, `visitor`), `standIn` (another's model).
- `budgetKb` per kind (`world3d/assets.test.ts` holds every file to it and the whole to 15 MB) and `kb`, the total per
  kind.

## Rules

- **Scales:** NH's furniture scale is the island's (`world.ts` DECOR_U = 3u a model unit; a tile is 10 model units).
  The critters and the visitors are at the villagers' scale, 5.4 (an NH villager is 14.9 units, the island's 80u).
  The finds, the fruit, the shadows and the presents are drawn at their art's sizes (`h` in the map).
- **Colours:** NH's gray albedo + gradient materials take their colour from the gradient's row: each flower colour
  its own model (no runtime tint), the bushes, the star fragments, the shells, the present, the pumpkin. Albedos whose
  alpha isn't an opacity (the mushrooms', the coconut's) are read raw and made opaque.
- **Animation:** none in NH's files (bind pose only), so the critters' idle motion stays the runtime's. The visitors'
  arms are lowered from the bind pose.
- **Effects:** the seasons' falling leaves, petals and snowflakes are NH's own (InsectAutumnLeaf, InsectSakurapetal,
  InsectSnowCrystal). NH's files have no effect models, so the 「！」, the dust puff, the splash and its ripple, the
  zzz, the sweat drop, the confetti, the campfire's flame and the lily pad are small stylised meshes in the art's
  colours, unlit, ~2 KB each (`scripts/world3d-fx.ts`, the `fx/*` keys; flat ones face +z for the runtime to turn);
  the sparkle is `effects.ts`' star in code; the heart and the ♪ are NH's item icons. Rain and snow have no assets:
  they're drawn in their shaders (`world3d/precip.ts`, design.md "Weather").
- **Parts split out** (`split` in the map: `scripts/world3d-page.js` splitOff): NH's weight bench (FtrPressBench) is
  one skinned mesh with its barbell baked in; the converter lifts the bar's connected pieces into a node of their own,
  `bar` (gltfpack `-kn -ke` keeps the node and extras; assets.json's `part` says where it rests). At runtime
  (`world3d/things.ts` lift/rest, `world3d/benchBar.ts`) the bar is drawn on the rack with the bench's instances;
  pressed, that instance's bar is emptied and the gym's standalone barbell (`decor/barbell`) drawn at the presser's
  hands instead.
- **Held tools and accessories:** the bug net, the rod and its bobber (NH's wooden ones: the plain ones have no
  textures in the files), the birthday's cake hats and NH's party glasses, at the villagers' scale, `anchor: joint`.
- The plumeria isn't in NH's files: NH's hibiscus stands in, in the plumeria's white and pink.

## Seats and beds

`villager3d/seats3d.ts`, `seats3d.json`; `npm run seat-anchors` (`scripts/seat-anchors.ts`): every piece a villager
sits or lies on (the tent's and homes' furniture with NH's `interact`, and the island's park bench, log bench, log
stools and hammock) has its seat or bed found from its converted model (rays down: `room-surfaces-page.js`;
`scripts/room-surfaces.ts` seatOf, bedOf), an OVERRIDES table for the odd ones (the hammocks sway; the weight bench:
`use`), and the gym's pieces used in place (USE: a `u` point, its facing and where one gets on from). A seat: its
top, its middles across (a sofa's two), its back and front edges and back's height; a bed: the mattress top, the axis
it's lain along, the pillow's end, a double bed's two places. `anchorsOf(shape, place)` places one; `v.sitAt(anchor)`
(villager3d.ts) turns, steps on and sits (SIT_MS 420 ms; an arc over a seat's back when it comes from behind), hips on
the seat, feet down or dangling (poses.ts sitOn), or lies along the bed (a hammock rocks); `sitAt(null)` gets up. The
tent's seats (`tent/seats.ts`), the museum's benches (`museum/seats.ts`) and the island's (`world3d/villagers.ts`, by
world.ts SEATS's names) pass their anchors.

## Fishing

`world3d/fishing3d.ts`: Critters.svelte says each step of my line (cast, wait, bite, reel) and where its float is; my
3D villager holds NH's rod while the line is out (`VSpec.tool`), swings it out on the cast, is tugged at the bite and
reels in.

- **Facing** (`world3d/facing.ts`, the same on every phone): standing, it turns to the float (~0.2 s) and keeps
  facing it, the rod pointed at it; seated or lying it doesn't turn. The rod is a child of the hand bone (`Hand_R`),
  its material bent with the island (`bend.ts`; `e2e/fishing3d.spec.ts`: its tip against the feet the same at every
  zoom).
- **The float** (`floatLift`): a ±0.6u bob over 1.5 s while it waits and a soft ring (`fx/ripple`) every 2.6 s; a
  380 ms dip and a small ring at each nibble; at the bite a hop and a plunge 7u under, a splash and a big ring
  (emitters on the water's surface).
- **The 「！」** (`world3d/biteMark.ts`, from the angler's step, on every phone): one quad a villager, its art a canvas
  drawn once (NH's cream disc, red rim and ！), over the head as posed this frame (villager3d `crown()`, OVER_U 3u
  above). Its own vertex shader bends only its anchor and lays the quad out in the camera's plane, so it stays upright
  and square on at every pitch. 20u in the world, held to 30–52 px on screen; no depth test, drawn last. Its pop
  overshoots (320 ms); 140 ms out at the reel or the miss. `__world3d.bite(slot)` / `pinBite(slot)` (dev and ?demo;
  `e2e/bite-mark.spec.ts`).
- **The line** (`world3d/fishLine.ts`, pure and unit-tested; Island3D's bent `Line` from `tip()`): one quadratic from
  the tip to the float, a point every 16u (12 to 64), sagging by its length (6u short, 4% long), lifted only where it
  must to stay 4u over the ground, the water and every blocking object's tiles. Its shape is worked out when its ends
  move, not each frame (`__world3d.line()`; `e2e/fishing-taps.spec.ts`).
- Frames run at full rate while the float is out (`moveStart`). `window.__fx3` (dev and ?demo): each source's live
  parts and the spawns' log.

## Villagers and visitors

Their skinned models are converted apart (`scripts/villagers3d-models.ts`, `scripts/villagers3d-page.js`) into
`app/static/room/villagers3d/<id>.glb` (442 files, ≤ 100 KB each), posed in code: the villagers, the roster's special
characters (K.K., Daisy Mae, Wisp, Gulliver, Celeste, Kicks, Label, Saharah, Leif, Redd, C.J., Flick, Brewster, Kapp'n,
Wilbur) and, by
`VISITOR_ONLY` (not in the picker), Franklin, Jack, Jingle, Zipper, Reese and Cyrus. Pavé isn't in NH's files: he
never visits. A material's textures are the ones its Collada effect samples, not the ones named after it (`mCapVis`
and `mGlassCap` sample `mBody_Alb` and `mGlass_Alb`); the converter fails a villager whose GLB has a material without
a base colour where the source has one. The 60 plain tops are the files' own (the clothing's texture isn't in them). Tulin, Mineru, Cece and Viché aren't in
the 2.0.0 export: their cards stay.

## The inventory

Written by `npm run world3d-models` from assets.json (the per-key rows are in the manifest).

<!-- assets:start -->
589 keys, 435 models, 5.50 MB in all.

| kind | keys | models | KB | loads |
| --- | --- | --- | --- | --- |
| accessory | 3 | 3 | 52.6 | lazily (event) |
| find | 129 | 52 | 406.8 | with the island |
| scenery | 4 | 2 | 68.2 | with the island |
| bush | 24 | 24 | 287 | with the island |
| sea | 40 | 40 | 495 | lazily (sea) |
| bug | 75 | 75 | 1020 | lazily (bug) |
| fish | 83 | 83 | 891.5 | lazily (fish) |
| deco | 48 | 39 | 895.5 | with the island |
| event | 6 | 6 | 115.2 | lazily (event) |
| decor | 88 | 22 | 373.6 | with the island |
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
| bushes/white-plumeria, bushes/pink-plumeria | no plumeria in NH’s files (no other name either): NH’s hibiscus (the closest shape) in the plumeria’s white and pink (`standIn`) |
| trees/*-canopy, trees/*-trunk | 2D only: the 2D oak’s two layers; the 3D tree is one model |
| reactions/* | billboard: the villagers’ emotes |
| fx/* (sparkle, bang, dust, splash, ripple) | not NH’s: NH’s files have no effect models (no Eff*/Emo*), so these are stylised meshes in the 2D’s colours (scripts/world3d-fx.ts) |
| deco/airport | not on the island: the pairing page’s map icon |
| host/*, items/snack, items/dinner, money/* | not on the island: the panels’ and the HUD’s art |
| finds/items/*, finds/recipes/* | not on the island: the balloon catalogue’s icons, on the catch plate |
| deco/tape-deck | approximate: NH’s boom box (FtrRadicase) stands for the tape deck (the POC’s) |
| finds/shovel, finds/watering-can | approximate: NH’s wooden shovel and watering can (the plain ones’ textures aren’t in the files) |
<!-- assets:end -->
