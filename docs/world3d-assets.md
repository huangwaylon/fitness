# The 3D island's assets (NH's models for every island art key)

The island draws NH's own models for its art keys. The manifest is `app/src/lib/components/world3d/assets.json`
(typed: `world3d/assets.ts`); the map from art key to model is `scripts/world3d-assets.ts`. The per-key table is the
manifest itself; this doc keeps the pipeline, the rules and a summary.

## How they're made

The source is NH's 2.0.0 export (archive.org `acnh-2.0.0-models`, `ACNH_2.0.0_Exported_Model_DAE+PNG.7z`, md5
4c42817a…: 57,822 `<Model>.Nin_NX_NVN` folders of .dae and PNG), extracted to `~/Downloads/acnh-2.0.0-models/Model`.
It holds the old `~/Downloads/Model` set but for 15 layout icons; a run on both can take a folder of symlinks, the new
first. It brought the 2.0 villagers, Brewster, Kapp'n and Wilbur, and 376 tent pieces; nothing the island lacked.

- Every converter looks a folder up by its exact name (`scripts/nh-folders.ts`): a name that matches only in another
  case (the sheet's `FtrPressbench` for the export's `FtrPressBench`) fails the run, since a case-sensitive disk has
  no such folder; room-models.ts's SHEET_CASE spells the sheet's few that way as the export does.
- `scripts/world3d-assets.ts`: the map (art key → NH model folder, the conversion's options, the key's scale and
  anchor). `scripts/world3d-models.ts` converts them: NH's materials baked into one WebP each (≤ 128 px for small
  things, 256 for furniture, 512 for the tent and the countdown board), merged per material, quantised and
  meshopt-compressed by gltfpack, triangles capped per kind (critters 2,500, visitors 4,000).
  `NH_MODELS=~/Downloads/acnh-2.0.0-models/Model npm run world3d-models [-- --only=critters/,finds/]`. The raw model files never enter
  the repo; the converted GLBs are public.
- Output: `app/static/room/world3d/<kind>/<id>.glb` (under `/room/`: the service worker caches a file on first use,
  never at install). The first 45 models stay in `models.json` and serve their keys from there.
- **Then `npm run world3d-ktx2`** (`scripts/world3d-ktx2.ts`, its header: the packs, the loose textures, the
  transcoder, what it needs): the island draws KTX2 (`world3d/ktx2.ts`: ASTC on an iPhone, kept transcoded in
  IndexedDB); the WebPs stay for the museum's own models, the tent's furniture and a fallback. `world3d/ktx2.test.ts`
  fails until it's run after a model, a home or a player part changes.
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
- **Packs** (`PACKS` in the map: the camp goods, the food, the gym's newer pieces): one GLB a tab
  (`static/room/world3d/decor/{camp,food,gym2}.glb`, one KTX2 pack each; the camp tab's second, `camp2.glb`: a pack
  stays under 400 KB), each member a node named its id
  (world3d-page.js convertPack, gltfpack `-kn`), a model `decor/<id>` in assets.json with `pack` its file, its one key `decor/<id>-0` made at
  load (assets.ts packKey: none written, the island turns it by its facing); things.ts reads the node out (`member`).
  island/decor.ts knows them by catalog.ts `packed`, never assets.json (that would pull it into the first load). Eight files for 52 models, not three an item. A member's seat is found on the tent's
  model of the same NH piece (seat-anchors.ts ISLAND `room`).
- **The garden** (`GARDEN` in the map; docs/island-layout.md "Fences and the garden"): packs under
  `static/room/world3d/garden/` (the fences five kinds a file, each kind's six pieces; the crops' stages and soil; the
  garden's flowers and vines; the cedar's lights), their models in `world3d/garden.json` (`writeGarden`), not
  assets.json, so the first load never carries them (`world3d/garden.ts` loads it when the island has one). A pack's
  repeated textures are kept once. NH's remake fences have no albedo: their `_Mix` map's B picks the colour along the
  gradient's row (`grdMix`, its row the icon's colour, the frozen fence's gray lifted). `node scripts/world3d-sheet.ts
  --garden` draws each member.
- **Held tools and accessories:** the bug net, the rod and its bobber (NH's wooden ones: the plain ones have no
  textures in the files), the birthday's cake hats and NH's party glasses, at the villagers' scale, `anchor: joint`.
- The plumeria isn't in NH's files: NH's hibiscus stands in, in the plumeria's white and pink.

## The museum

`scripts/world3d-models.ts --museum` (`NH_MODELS=… npm run world3d-models -- --museum [--only=…]`) writes the museum's
own models to `static/room/museum/` and `museum/models.json`: NH's tank and garden props (one GLB each, WebP
textures), its floors and walls (`tex/`), and its exhibits in packs (each member a node named its id, models.json
`pack` its file; Cloudflare Pages answers a Range with the whole file, so a pack is fetched whole, and only once one
of its members is on show):

- **Fossils:** 22 packs, one a skeleton (`fossil-<set>`, 60–300 KB) and `fossils` (the 14 standalone ones), NH's
  `FtrFossil*` (74 folders: the T. rex's pieces join on their bases as placed side by side), 128 px textures, ≤ 3,000
  triangles a piece; 3.2 MB in all.
- **Art:** the 43 genuine `FtrArt*` and `FtrSculpture*` (never a `*Fake`): `art-paintings-1|2` (256 px: they're read)
  and `art-statues-1|2` (128 px); 0.8 MB. Their NH icons (`Layout_FtrIcon_*`) at 96 px in `static/art/finds/art/`.
- **NH's museum-tank variants** (`*Museum`): the 12 sea creatures' (`sea-museum`) and the dung beetle's with its ball
  (`bug-museum`). NH's fish variants (35) and the ant's and cicada shell's are the catch's own meshes (only their
  textures differ), so the aquarium and the garden keep the catch models.

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
- **Wallpapers and floors:** the albedo with NH's overlays flattened over it (a vista's clouds `AlbOry`, a railing in
  front `AlbEx`; an animated one's first frame): the static look of NH's moving ones (the 68 VFX wallpapers' scrolling
  and particles, the special walls' own geometry such as an arched window). Their glow (`Emi`, 41 of them: the aurora,
  the glowing moss, the candles) is an emissive map lit in the dark (night, or the room's light off: engine.ts `glows`).

### Room packs

`scripts/room-packs.ts` (run at room-models' end; `--unpack` writes the files back to `.cache/room/`): every piece,
wallpaper and floor past the starter set and the ずかん's pieces is packed into `static/room/pack/<group>[-k].<hash>.pak`
(ktx2Pack's container, ≤ 320 KB; the packs are the only copy): the models by group (housewares, misc, model, wall,
ceiling, rug, gyroid, critter; a group's series together), the wallpapers' and floors' pictures and glows, and the
icons of the tabs browsed a tab at a time (rugs, critters, wallpapers, floors; ≤ 160 KB). A file's place `[pack,
offset, bytes]` is in `tent/more.json` (`pk`, `tex`, `icons`); the phone cuts it from its pack, fetched whole and once
(`items.ts` roomPacks: Pages ignores a Range), the service worker keeping it. 133 packs, 37 MB, for ~2,000 files. The
shop's pieces keep loose icons (a day's stock is any 24 of them: their packs would cost more than the icons).
`tent/more.json` and `tent/seats-more.json` load with the room's chunk only (items.json, the starter set's and the
ずかん's, with the presents too).

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

A lid (`tent/lid.ts` LIDS, the cold sleep pod's): cut out of the body's mesh at load and turned about its hinge (its
header: NH ships no clip, bone or shut variant). No re-export.

**The pose data** (`seats3d.json` `tent[code]` / `island[model]`, model units, the model's own frame: +z its front, its
middle at 0; a new piece, like a hammock or a sleeping bag, adds one entry and needs nothing else):

- a seat `{k:'s', y, x:[…], z0, z1, back}`: the seat's top, each seat's middle across (a sofa's or a bench's two), the
  seat's back and front edges, the back's height over it (0 a stool);
- a bed `{k:'l', y, a, head, s:[s0, s1], c:[…], py}`: the mattress's top (a bunk bed's lowest, `LOW`), the long axis
  (`'x'`/`'z'`: the footprint's longer side; NH's 2 × 2 beds lie along x, the headboard at a side), the pillow's end
  (−1/+1 along it: NH's −x, by eye where the rays can't tell), the mattress's extent along it, each sleeper's line
  across (a double bed's two), the pillow's rise; `sway: 1` rocks (a hammock);
- a gym point `{k:'u', use, x, y, z, yaw, fx, fz}` (by hand: USE).

The room turns and scales it with its piece (grid.ts `toRoom`, as for the lamps' emitters); one gets on from the
nearest free side (`tent/seats.ts`: a bed's own side, the other, its foot; a seat's front, then its sides). A piece
whose seats have no pose isn't offered. `tent/seats.test.ts` checks every one at 4 facings (in the footprint, along
its axis, the head at the pillow end, on the mattress); a by-eye head goes in its HEAD_PLUS too.

## Lamps' emitters

`npm run room-models -- --emitters`: each of the tent's lights (NH's `lightingType`, 81) gets `e` in items.json, its
point light's spot in model units: NH's `Light` locator in the game's Collada when it's within the model (`el`: 60),
else the area- and brightness-weighted middle of its emissive map's lit texels on the converted model (19), else
EMITTERS by eye (2) (`room-surfaces-page.js` locator, emitter). The two agree within ~0.5 units where both exist.
items.test checks each inside its emissive part (or its model) at every facing.

## Fishing

`world3d/fishing3d.ts`: Critters.svelte says each step of my line (cast, wait, bite, reel) and where its float is; my
3D villager holds NH's rod while the line is out (`VSpec.tool`), swings it out on the cast, is tugged at the bite and
reels in. Each part's header has its numbers:

- **Facing** (`world3d/facing.ts`, the same on every phone): standing, it turns to the float and keeps facing it, the
  rod pointed at it; seated or lying it doesn't turn. The rod is a child of the hand bone, bent with the island
  (`e2e/fishing3d.spec.ts`: its tip against the feet the same at every zoom).
- **The float** (fishing3d.ts `floatLift`): a bob and a soft ring while it waits, a dip and a small ring at each
  nibble, at the bite a hop, a plunge, a splash and a big ring (emitters on the water's surface).
- **The 「！」** (`world3d/biteMark.ts`, on every phone): NH's mark over the head as posed this frame, upright and square
  on at every pitch, NH's size in the world held to a readable size on screen, never under anything.
  `__world3d.bite(slot)` / `pinBite(slot)` (dev and ?demo; `e2e/bite-mark.spec.ts`).
- **The line** (`world3d/fishLine.ts`, pure and unit-tested): one quadratic from the tip to the float, sagging by its
  length, lifted only where it must to clear the ground, the water and what blocks; worked out when its ends move, not
  each frame (`__world3d.line()`; `e2e/fishing-taps.spec.ts`).
- Frames run at the full rate (30 fps, not the rest's 12) while the float is out (`moveStart`). `window.__fx3` (dev and
  ?demo): each source's live parts and the spawns' log.

## Villagers and visitors

Their skinned models are converted apart (`scripts/villagers3d-models.ts`, `scripts/villagers3d-page.js`) into
`app/static/room/villagers3d/<id>.glb` (442 files, ≤ 100 KB each), posed in code: the villagers, the roster's special
characters (K.K., Daisy Mae, Wisp, Gulliver, Celeste, Kicks, Label, Saharah, Leif, Redd, C.J., Flick, Brewster, Kapp'n,
Wilbur) and, by
`VISITOR_ONLY` (not in the picker), Franklin, Jack, Jingle, Zipper, Reese and Cyrus, the shop's twins (`timmy`: NH's
NpcSpRcm in his shop apron, one model for Timmy and Tommy) and the guests (island/visitorRoles.ts: Gracie, Wardell,
Katrina, Wendell, Gullivarrr, Pete, Leilani, Lottie, Chip, Nat, Rover, Shrunk, Tortimer, Phineas, Pavé; 64-99 KB each,
loaded only on their day); one whose clothes aren't part of its body names its top's mesh and texture there. A material's textures are the ones its Collada effect samples, not the ones named after it (`mCapVis`
and `mGlassCap` sample `mBody_Alb` and `mGlass_Alb`); the converter fails a villager whose GLB has a material without
a base colour where the source has one. Each villager wears its default top's texture (a single-look top, as the Sanrio tees, is the data's row itself, not a variation: `villager3d.test` holds every material to its texture). Tulin, Mineru, Cece and Viché aren't in
the 2.0.0 export: their cards stay.

## Players

The human players' parts (`scripts/players3d-models.ts`; the runtime: [design.md "Players"](design.md#players)) ship in
44 packs, not ~5,200 loose files: `app/static/room/player/<home>.<hash>.pak` (~23 MB: `player3d/packing.ts`,
`scripts/player-packs.ts`, `npm run player:packs`), beside the whole part table (`parts.json`).
A pack is `ktx2Pack.ts`'s container (its files' paths in its head). Each file's place, `at` (a KTX2's, `k`: `[pack,
offset, bytes]`), is in both part tables.
- **Homes:** `everyday` (the body and both いつもの looks as a phone draws them, KTX2s included: ~330 KB, fetched whole
  as a player is first drawn, one request where there were 25); `face`, `hair` and a slot's first-closet garments
  (`top`, …: the bundled table's, what the closet lists and a saved コーデ wears; by id, a line's colours together, a
  shape with the first to wear it), ≤ 256 KB a pack; `more-<slot>` (the whole table's other ~4,000 items) and `webp`
  (the WebPs of textures with a KTX2: only a page without a GPU format draws them), ≤ 1.2 MB. A home past its bound
  splits as stably as can be (`lib/packPlan.ts planHome`).
- **On the phone** (`parts.ts`, `lib/packStore.ts`): any other part is cut from its pack, fetched whole and once (Cloudflare
  Pages answers a Range with the whole file: a 200), so a first wear costs its packs (A's saved one-piece and hairstyle: two, 0.5 MB, where the loose files were 43 KB), held and kept by the
  service worker (`island-room-v1`), their other parts free after. A saved コーデ is instant once worn. Offline, a part never fetched is drawn as いつもの's (`player3d.ts wearable`).
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
| trees/*-canopy, trees/*-trunk | 2D only: the 2D oak’s two layers; the 3D tree is one model |
| reactions/* | billboard: the villagers’ emotes |
| fx/* (sparkle, bang, dust, splash, ripple) | not NH’s: NH’s files have no effect models (no Eff*/Emo*), so these are stylised meshes in the 2D’s colours (scripts/world3d-fx.ts) |
| deco/airport | not on the island: the pairing page’s map icon |
| host/*, items/snack, items/dinner, money/* | not on the island: the panels’ and the HUD’s art |
| finds/items/*, finds/recipes/* | not on the island: the balloon catalogue’s icons, on the catch plate |
| deco/tape-deck | approximate: NH’s boom box (FtrRadicase) stands for the tape deck (the POC’s) |
| finds/shovel, finds/watering-can | approximate: NH’s wooden shovel and watering can (the plain ones’ textures aren’t in the files) |
<!-- assets:end -->
