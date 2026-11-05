# The 3D island's assets (NH's models for every island art key)

Status: **converted**. The island draws NH's own models for its art keys. This file is the inventory: every art key the island renders, its model, and the keys left without one. The
3D integration reads `app/src/lib/components/world3d/assets.json` (typed: `world3d/assets.ts`).

## How they're made

- `scripts/world3d-assets.ts`: the map (art key → NH model folder, the conversion's options, the key's scale and
  anchor). `scripts/world3d-models.ts` (the POC's pipeline, extended) converts them: NH's materials baked into one
  WebP each (≤ 128 px for the small things, 256 for furniture, 512 for the tent and the countdown board), merged per
  material, quantised and meshopt-compressed by gltfpack, triangles capped per kind (critters 2,500, visitors 4,000).
  `NH_MODELS=~/Downloads/Model npm run world3d-models [-- --only=critters/,finds/]`. The raw model files never enter
  the repo; the converted GLBs are public (the user's call).
- Output: `app/static/room/world3d/<kind>/<id>.glb` (under `/room/`: the service worker caches a file on first use,
  never at install). The POC's own 43 models stay where they are (`models.json`) and serve their keys from there.
- See-through two-sided parts (glass, curtains, a critter's fade, the particles) are two meshes, one a side
  (`world3d/sides.ts`): three's own two passes re-derive the program twice a draw every frame (27–31 a frame, ~13% of
  `render()`'s CPU on the demo island). The same pixels: the back faces drawn first.
- Contact sheets: `node scripts/world3d-sheet.ts [-- --only=bug,fish] [-- --night]` draws every model at its world
  scale beside an 80u villager card, at the island's 30° pitch, to `/tmp/world3d-assets/sheet-<kind>-<n>.png`.

## The manifest (assets.json)

- `models`: per model its bounds (model units), triangles, KB, content hash (`?v=`), `lit` (an emissive: lights at night).
- `keys`: per art key `m` (the model), `cat`, `s` (world units per model unit), `anchor` (`feet`: the origin on the
  ground; `centre`: the bounds' centre at a height: a flying bug, a held fish, a balloon; `joint`: the origin is NH's
  hand or head joint: a held tool, a hat, the party glasses), `foot` (tiles of 30u,
  unturned), `hit` (tap radius, u; at least 12), `shadow` (casts one; not the flat things), `lit`, `yaw` (a
  decoration's facing: one model for its four facings), `winter` (the key of its winter look), `lazy` (loaded with
  its group: `bug`, `fish`, `sea` per the month's critters, `event`, `visitor`), `standIn` (another's model).
- `budgetKb` per kind (the unit test, `world3d/assets.test.ts`, holds every file to it and the whole to 15 MB) and
  `kb`, the total per kind.

Scales: NH's furniture scale is the island's (`world.ts` DECOR_U = 3u a model unit; a tile is 10 model units). The
critters and the visitors are at the villagers' scale, 5.4 (an NH villager is 14.9 units, the island's 80u), so they
keep NH's proportions to the villagers. The finds, the fruit, the shadows and the presents are drawn at their art's
sizes (`h` in the map: the model's longest side).

Colours: NH's gray albedo + gradient materials take their colour from the gradient's row (the POC's foliage fix,
everywhere): the flowers per colour (each colour its own model, its own row: no runtime tint), the bushes, the star
fragments (the normal star, then Capricorn to Sagittarius in the calendar's order), the shells, the present, the
pumpkin. Albedos whose alpha isn't an opacity (the mushrooms', the coconut's) are read raw and made opaque.

Animation: none. NH's files have no clips (the .dae files hold the bind pose only), so the critters' idle motion
(a flutter, a bob, a swim) stays the runtime's. The visitors' arms are lowered from the bind pose.

Effects: the seasons' falling leaves, petals and snowflakes are NH's own (the ones a net catches: InsectAutumnLeaf,
InsectSakurapetal, InsectSnowCrystal). NH's files have no effect models (no Eff*/Emo*), so the sparkle (now drawn
as `effects.ts`' star in code, gold, Fx.svelte's path; `fx/sparkle` stays the campfire's tinted sparks), the 「！」,
the dust puff, the splash and its ripple are small stylised meshes in the art's colours, unlit, 2 KB each
(`scripts/world3d-fx.ts`, the `fx/*` keys; flat ones face +z for the runtime to turn to the camera). So are the
zzz, the sweat drop, the confetti, the campfire's flame (`lit`) and the pond's lily pad; the heart and the ♪ are
NH's own (its item icons UnitIconLove, UnitIconMusic). The rain's streaks and rings and the snow's flakes have no assets: they're drawn in their shaders
(`world3d/precip.ts`, design.md "Weather").

Parts split out (`split` in the map: scripts/world3d-page.js splitOff): NH's weight bench (FtrPressBench) is one mesh
skinned to one joint, its barbell baked in, but the bar, its two plates and two collars are pieces of their own in the
mesh (no shared vertices with the rack), so the converter lifts the mesh's connected pieces wholly above 10 model units
(the rack's uprights stand on the ground) into a node of their own, `bar` (672 of its 2,206 triangles, the same material
and texture: +1 draw for every bench on the island), its geometry about its middle and the node there; its extras and
assets.json's `part` say where it rests (−6.28, 14.29, 0: over the head's end, across the bench along z, 9.95 long).
gltfpack keeps the nodes and the extras for these (`-kn -ke`). At runtime (world3d/things.ts lift/rest) the bar is
drawn on the rack with the bench's instances; pressed (world3d/benchBar.ts), that instance's bar is emptied and drawn as
a mesh of its own (the instanced geometry and bent material, no shadow while off); what's drawn there is the gym's
standalone barbell instead (`decor/barbell`, its longest side along the part's axis, its middle at the part's, 1.25 ×
its own: lift's `held`), on the rack as the presser lies down and at its hands while it presses.

Held tools and accessories: the bug net, the rod and its bobber (NH's wooden ones: the plain ones have no textures
in the files; the fishing line is the runtime's, a line from the rod's tip), the birthday's cake hats (pink, blue)
and NH's party glasses, at the villagers' scale, `anchor: joint`.

Seats and beds (`villager3d/seats3d.ts`, `seats3d.json`; `npm run seat-anchors`, scripts/seat-anchors.ts): every
piece a villager sits or lies on (the tent's and the homes' furniture with NH's `interact`, and the island's park
bench, log bench, log stools and hammock) has its seat or bed found from its converted model (the rays down of
room-surfaces-page.js; scripts/room-surfaces.ts seatOf, bedOf), an OVERRIDES table for the odd ones (the hammocks
sway; the gym's weight bench pressed on: `use`), the gym's pieces used in place by hand (USE: a `u` point, the feet's or the
hips', its facing and where one gets on from; the bike, the ball, the treadmill, the bag, the pull-up bar): a seat's top, its middles across (a sofa's or a bench's two), its back edge, front edge and back's height; a
bed's mattress top, the axis it's lain along, the pillow's end, a double bed's two places. `anchorsOf(shape, place)`
turns one into Anchors where the piece stands; `v.sitAt(anchor)` (villager3d.ts) turns, steps onto it and sits down
(SIT_MS, 420 ms; an arc over a seat's back when it comes from behind, as at the island's benches, whose seat spots are
behind them), hips on the seat and back to its back, feet down or dangling by the seat's height
(poses.ts sitOn), or lies on its back along the bed, head on the pillow end (a hammock rocks); `sitAt(null)` gets up
to wherever the caller puts it next. The tent's seats (tent/seats.ts), the museum's benches (museum/seats.ts: the park bench's, at 1.2×) and the island's (world3d/villagers.ts, by
world.ts SEATS's names) pass their anchors; a piece with no shape keeps the old placement.

Fishing (`world3d/fishing3d.ts`): Critters.svelte says each step of my line (cast, wait, bite, reel) and where its
float is; my 3D villager (world3d/villagers.ts) holds NH's rod while the line is out (`VSpec.tool`, Island3D's), turned
in its hand to point out over the water in the fishing pose, swings it out on the cast, is tugged at
the bite and reels in (the rod kept in hand till the reel is over), however far its float (a cast goes to
any water). Which way
(`world3d/facing.ts`, the same on every phone from the same steps): standing, it turns to the float, NH's quick smooth
turn (~0.2 s), and keeps facing it, square on from the rod's hand, the rod pointed at it; seated or lying it doesn't
turn, the rod pointed the way it faces. The rod is a 3D child of the hand bone (`Hand_R`) and the line runs in world
space from its tip; like everything the villager takes up after it's on the island (the rod, a hat), its material is
bent with the island (`bend.ts`): unbent, it drew off the hand by the bend's drop and slid with every pinch and scroll
(`e2e/fishing3d.spec.ts`: its tip against the feet the same at every zoom, nothing on the villager unbent). The float
moves on my line's steps (`floatLift`, read each frame by the bobber node's `live`): a gentle
±0.6u bob over 1.5 s while it waits, a soft ring (`fx/ripple`) every 2.6 s; a quick 380 ms dip and a small ring at each
nibble; at the bite a little hop and a plunge 7u under, a splash and a big
ring (the rings and the splash are emitters on the water's surface: `m3.emit` on a node of their own), and NH's 「！」
pops over the angler's head (`world3d/biteMark.ts`, from the angler's step: mine, and the others' on their phones'
islands too): one quad a villager, made at its first bite and then shown and hidden, its art a canvas drawn once (NH's
cream disc, red rim and ！). **Where**: over the head as it's posed this frame (villager3d `crown()`: the rest
pose's highest point carried by the head bone; the head taken as the ball from the bone to its top, the mark OVER_U 3u
over the ball's highest point), so standing it's over the head's top, seated on its head on the bench, lying over the
head's side; a card's (no model yet) over the card. **Bend and facing**: its own vertex shader bends only its anchor
(bend.ts bendW) and lays the quad out from there in the camera's plane, so it sits on the curved world with the head,
upright (the camera never rolls) and square on at every pitch; a bent quad leaned back with the curve, and a quad
turned only about the world's up (cylindrical) is squashed to about half by the camera's 40–63° look down.
**Size**: 20u in the world (it grows with the head as a pinch zooms in), held to 30–52 px on screen (the widest zoom
draws 20u at 19 px, too small to read; fully in, 60). **On top**: no depth test, drawn last: NH's is over everything,
and it's the cue to tap. Its pop overshoots (320 ms), a small hop while held, 140 ms out at the reel or
the miss (a bite reeled at once still pops in whole).
`__world3d.bite(slot)` (dev and ?demo): a mark as drawn (canvas px: its bottom, top and sides, its size) and its head's
on screen; `__world3d.pinBite(slot)` holds one up (e2e/bite-mark.spec.ts). Frames run at
full rate while the float is out (`moveStart`), the ambient rate again once it's gone. `window.__fx3` (dev and ?demo):
each source's live parts and the spawns' log (e2e/fishing3d.spec.ts: the nibbles' rings come before the 「！」). The
fx/* meshes draw in their vertex colours unless tinted (they drew all white before: the 「！」 a blank disc). The line is Island3D's (a bent `Line` from `tip()`, `world3d/fishLine.ts`, pure and unit-tested): one quadratic from
the tip to the float, a point every 16u (12 to 64: a line across the island bends with the island as smoothly as the
ground under it; one buffer of 64, its draw range the points used); it sags under its own weight by its length (6u for
a short one, as NH's; 4% of a long one), lifted only where it must to stay 4u over the ground, the water's surface and
every blocking object's tiles at its drawn height (a cliff, a house, a tree between my villager and the water; bar 24u
at either end), at most 0.6 of its length. Its shape is worked out when its ends move (by 4u at the tip, 1u at the
float), not each frame (`__world3d.line()`: its points, e2e/fishing-taps.spec.ts' far cast). A tube line (thicker than a 1 px GL line on
a 3× phone) is open for the lead.

Not converted here (see the table's last section): the villagers and the visitors (skinned models of their own, below),
the emotes and the UI's art. The plumeria isn't in NH's files under any name: NH's hibiscus (the closest shape) stands in, in the
plumeria's white and pink.

The villagers' own 3D models (the villager3d runtime, 411 of them) are converted apart, by `scripts/villagers3d-models.ts`
and `scripts/villagers3d-page.js` into `app/static/room/villagers3d/<id>.glb` (≤ 100 KB each), skinned and posed in code.
So are the island's visitors: the roster's special characters (K.K., Daisy Mae, Wisp, Gulliver, Celeste, Kicks, Label,
Saharah, Leif, Redd, C.J., Flick) and, by `VISITOR_ONLY` (not in the picker), Franklin (NpcSpTuk), Jack (Pkn), Jingle
(Rei), Zipper (Pyn), Reese (Alw) and Cyrus (Alp), their face at rest. Pavé isn't in NH's files: he never visits. A material's textures
are the ones its Collada effect samples, not the ones named after it: NH's `mCapVis` (the ears, horns and hair a hat
hides: 195 villagers) and `mGlassCap` sample `mBody_Alb` and `mGlass_Alb`, a hedgehog's or a kangaroo's `mSoftmesh`
the body's or the cloth's; looked up by their own names they came out plain white (the user saw the ears). The texture
is made once and shared (one image in the GLB), and the converter fails a villager whose GLB has a material without a
base colour where the source has one. The 60 plain tops are the files' own: the clothing's texture isn't in them
(Isabelle's and Redd's tops have none either).

## The inventory

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

### accessory

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| accessories/party-glasses | accessories/party-glasses | 5.4 | joint |  | 16 | 11.2 |  |
| deco/birthday-hat-blue | accessories/birthday-hat-blue | 5.4 | joint |  | 29 | 20.6 |  |
| deco/birthday-hat-pink | accessories/birthday-hat-pink | 5.4 | joint |  | 29 | 20.8 |  |

### find

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| balloon/0 | finds/balloon-0 | 3.356 | centre |  | 12 | 5.5 | lit |
| balloon/1 | finds/balloon-1 | 3.356 | centre |  | 12 | 5.5 | lit |
| balloon/2 | finds/balloon-2 | 3.356 | centre |  | 12 | 5.5 | lit |
| balloon/3 | finds/balloon-3 | 3.356 | centre |  | 12 | 5.5 | lit |
| balloon/4 | finds/balloon-4 | 3.356 | centre |  | 12 | 5.9 | lit |
| deco/present | finds/present | 5.479 | feet |  | 12 | 8.5 |  |
| finds/acanthostega | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/amber | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ammonite | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ankylo-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ankylo-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ankylo-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/anomalocaris | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/aquarius-fragment | finds/aquarius-fragment | 5.114 | feet |  | 12 | 7 |  |
| finds/archaeopteryx | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/archelon-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/archelon-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/aries-fragment | finds/aries-fragment | 5.114 | feet |  | 12 | 7 |  |
| finds/australopith | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/brachio-chest | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/brachio-pelvis | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/brachio-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/brachio-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/cancer-fragment | finds/cancer-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/capricorn-fragment | finds/capricorn-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/coconut | finds/coconut | 4.9 | feet |  | 12 | 7.1 |  |
| finds/conch | finds/spiral | 5.263 | feet |  | 12 | 7.1 |  |
| finds/coprolite | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/coral | finds/coral | 8.304 | feet |  | 12 | 7.7 |  |
| finds/cowrie | finds/clam | 6.811 | feet |  | 12 | 7.1 |  |
| finds/deinony-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/deinony-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/dig-spot | finds/dig-spot | 2.993 | feet |  | 12 | 4.7 |  |
| finds/dimetrodon-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/dimetrodon-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/dinosaur-track | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/diplo-chest | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/diplo-neck | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/diplo-pelvis | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/diplo-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/diplo-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/diplo-tail-tip | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/dunkleosteus | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/earth-egg | finds/earth-egg | 6.094 | feet |  | 12 | 6.9 |  |
| finds/elegant-mushroom | finds/elegant-mushroom | 4.115 | feet |  | 12 | 6.7 |  |
| finds/eusthenopteron | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/flat-mushroom | finds/flat-mushroom | 3.759 | feet |  | 12 | 7.7 |  |
| finds/fossil | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/gemini-fragment | finds/gemini-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/giant-clam | finds/clam | 6.811 | feet |  | 12 | 7.1 |  |
| finds/hardwood | finds/hardwood | 3.374 | feet |  | 12 | 5.6 |  |
| finds/hole | finds/hole | 2.589 | feet |  | 12 | 6.2 |  |
| finds/iguanodon-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/iguanodon-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/iguanodon-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/juramaia | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/large-star-fragment | finds/large-star-fragment | 4.944 | feet |  | 12 | 6.5 |  |
| finds/left-megalo-side | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/left-ptera-wing | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/left-quetzal-wing | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/leo-fragment | finds/leo-fragment | 5.114 | feet |  | 12 | 7 |  |
| finds/libra-fragment | finds/libra-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/mammoth-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/mammoth-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/megacero-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/megacero-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/megacero-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/message-bottle | finds/message-bottle | 5.063 | feet |  | 12 | 7.5 |  |
| finds/myllokunmingia | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ophthalmo-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ophthalmo-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/pachy-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/pachy-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/parasaur-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/parasaur-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/parasaur-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/pearl | finds/pearl | 5.021 | feet |  | 12 | 5.8 |  |
| finds/pisces-fragment | finds/pisces-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/plesio-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/plesio-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/plesio-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/ptera-body | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/quetzal-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/rare-mushroom | finds/rare-mushroom | 6.944 | feet |  | 12 | 5.8 |  |
| finds/right-megalo-side | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/right-ptera-wing | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/right-quetzal-wing | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/rock | rock | 2.714 | feet |  | 13 | 6.3 |  |
| finds/round-mushroom | finds/round-mushroom | 4.95 | feet |  | 12 | 14.4 |  |
| finds/sabertooth-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/sabertooth-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/sagittarius-fragment | finds/sagittarius-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/sand-dollar | finds/clam | 6.811 | feet |  | 12 | 7.1 |  |
| finds/scorpius-fragment | finds/scorpius-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/sea-snail | finds/spiral | 5.263 | feet |  | 12 | 7.1 |  |
| finds/shark-tooth-pattern | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/shovel | finds/shovel | 2.451 | feet |  | 12 | 7.2 |  |
| finds/skinny-mushroom | finds/skinny-mushroom | 4.819 | feet |  | 12 | 7.5 |  |
| finds/sky-egg | finds/sky-egg | 6.094 | feet |  | 12 | 7.3 |  |
| finds/softwood | finds/softwood | 3.374 | feet |  | 12 | 5.6 |  |
| finds/spino-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/spino-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/spino-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/star-fragment | finds/star-fragment | 5.114 | feet |  | 12 | 7.1 |  |
| finds/stego-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/stego-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/stego-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/summer-shell | finds/summer-shell | 5.263 | feet |  | 12 | 8.4 |  |
| finds/t-rex-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/t-rex-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/t-rex-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/taurus-fragment | finds/taurus-fragment | 5.114 | feet |  | 12 | 7 |  |
| finds/tree-branch | finds/tree-branch | 6.452 | feet |  | 15 | 6.7 |  |
| finds/tricera-skull | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/tricera-tail | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/tricera-torso | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/trilobite | finds/fossil | 4.545 | feet |  | 12 | 7.6 |  |
| finds/venus-comb | finds/clam | 6.811 | feet |  | 12 | 7.1 |  |
| finds/virgo-fragment | finds/virgo-fragment | 5.114 | feet |  | 12 | 7 |  |
| finds/wasp-nest | finds/wasp-nest | 4.032 | feet |  | 12 | 8.4 |  |
| finds/water-egg | finds/water-egg | 6.077 | feet |  | 12 | 7.1 |  |
| finds/watering-can | finds/watering-can | 4 | feet |  | 12 | 8.7 |  |
| finds/weed-fall | finds/weed-fall | 1.505 | feet |  | 12 | 17.3 |  |
| finds/weed-spring | finds/weed-spring | 1.322 | feet |  | 12 | 18.6 |  |
| finds/weed-summer | finds/weed-summer | 1.464 | feet |  | 12 | 18 |  |
| finds/weed-winter | finds/weed-winter | 1.559 | feet |  | 12 | 17.1 |  |
| finds/wood | finds/wood | 3.374 | feet |  | 12 | 5.6 |  |
| items/candy | finds/candy | 3.712 | feet |  | 12 | 7.9 |  |
| presents/diy-recipe | finds/diy-recipe | 6.687 | feet |  | 12 | 6.5 |  |

### scenery

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bridges/stone-deck | bridge-stone | 1.18 | feet | 2×1 | 24 | 30.6 | winter: bridges/stone-deck-winter |
| bridges/stone-deck-winter | bridges/stone-winter | 1.18 | feet | 2×1 | 24 | 37.6 |  |
| bridges/stone-front | bridge-stone | 1.18 | feet | 2×1 | 24 | 30.6 | winter: bridges/stone-front-winter |
| bridges/stone-front-winter | bridges/stone-winter | 1.18 | feet | 2×1 | 24 | 37.6 |  |

### bush

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bushes/blue-hydrangea | bushes/blue-hydrangea | 3 | feet | 1×1 | 17 | 12.5 | winter: bushes/blue-hydrangea-winter |
| bushes/blue-hydrangea-winter | bushes/blue-hydrangea-winter | 3 | feet | 1×1 | 16 | 10.7 |  |
| bushes/holly | bush-holly | 3 | feet | 1×1 | 17 | 11.6 | winter: bushes/holly-winter |
| bushes/holly-winter | bushes/holly-winter | 3 | feet | 2×1 | 18 | 9.3 |  |
| bushes/orange-tea-olive | bush-orange-tea-olive | 3 | feet | 1×1 | 16 | 12.3 | winter: bushes/orange-tea-olive-winter |
| bushes/orange-tea-olive-winter | bushes/orange-tea-olive-winter | 3 | feet | 1×1 | 16 | 10.6 |  |
| bushes/pink-azalea | bush-pink-azalea | 3 | feet | 1×1 | 16 | 14.2 | winter: bushes/pink-azalea-winter |
| bushes/pink-azalea-winter | bushes/pink-azalea-winter | 3 | feet | 1×1 | 16 | 10.7 |  |
| bushes/pink-camellia | bushes/pink-camellia | 3 | feet | 1×1 | 16 | 12.8 | winter: bushes/pink-camellia-winter |
| bushes/pink-camellia-winter | bushes/pink-camellia-winter | 3 | feet | 1×1 | 16 | 12.2 |  |
| bushes/pink-hydrangea | bushes/pink-hydrangea | 3 | feet | 1×1 | 17 | 12.7 | winter: bushes/pink-hydrangea-winter |
| bushes/pink-hydrangea-winter | bushes/pink-hydrangea-winter | 3 | feet | 1×1 | 16 | 10.7 |  |
| bushes/pink-plumeria | bushes/pink-plumeria | 3 | feet | 1×1 | 16 | 12.6 | winter: bushes/red-hibiscus-winter, stand-in |
| bushes/red-camellia | bushes/red-camellia | 3 | feet | 1×1 | 16 | 13.1 | winter: bushes/red-camellia-winter |
| bushes/red-camellia-winter | bushes/red-camellia-winter | 3 | feet | 1×1 | 16 | 12.2 |  |
| bushes/red-hibiscus | bush-red-hibiscus | 3 | feet | 1×1 | 16 | 12.9 | winter: bushes/red-hibiscus-winter |
| bushes/red-hibiscus-winter | bushes/red-hibiscus-winter | 3 | feet | 1×1 | 16 | 11.4 |  |
| bushes/white-azalea | bush-white-azalea | 3 | feet | 1×1 | 16 | 14 | winter: bushes/white-azalea-winter |
| bushes/white-azalea-winter | bushes/white-azalea-winter | 3 | feet | 1×1 | 16 | 10.7 |  |
| bushes/white-plumeria | bushes/white-plumeria | 3 | feet | 1×1 | 16 | 12.7 | winter: bushes/red-hibiscus-winter, stand-in |
| bushes/yellow-hibiscus | bushes/yellow-hibiscus | 3 | feet | 1×1 | 16 | 12.8 | winter: bushes/yellow-hibiscus-winter |
| bushes/yellow-hibiscus-winter | bushes/yellow-hibiscus-winter | 3 | feet | 1×1 | 16 | 11.4 |  |
| bushes/yellow-tea-olive | bushes/yellow-tea-olive | 3 | feet | 1×1 | 16 | 12.3 | winter: bushes/yellow-tea-olive-winter |
| bushes/yellow-tea-olive-winter | bushes/yellow-tea-olive-winter | 3 | feet | 1×1 | 16 | 10.6 |  |

### sea

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| critters/abalone | critters/sea/abalone | 5.4 | centre |  | 13 | 9.4 |  |
| critters/acorn-barnacle | critters/sea/acorn-barnacle | 5.4 | centre |  | 12 | 9.5 |  |
| critters/chambered-nautilus | critters/sea/chambered-nautilus | 5.4 | centre |  | 15 | 13.2 |  |
| critters/dungeness-crab | critters/sea/dungeness-crab | 5.4 | centre |  | 20 | 15.6 |  |
| critters/firefly-squid | critters/sea/firefly-squid | 5.4 | centre |  | 12 | 10.6 |  |
| critters/flatworm | critters/sea/flatworm | 5.4 | centre |  | 12 | 9.3 |  |
| critters/gazami-crab | critters/sea/gazami-crab | 5.4 | centre |  | 20 | 7.9 |  |
| critters/giant-isopod | critters/sea/giant-isopod | 5.4 | centre |  | 19 | 16.5 |  |
| critters/gigas-giant-clam | critters/sea/gigas-giant-clam | 5.4 | centre |  | 29 | 14.2 |  |
| critters/horseshoe-crab | critters/sea/horseshoe-crab | 5.4 | centre |  | 24 | 14.7 |  |
| critters/lobster | critters/sea/lobster | 5.4 | centre |  | 28 | 16.6 |  |
| critters/mantis-shrimp | critters/sea/mantis-shrimp | 5.4 | centre |  | 18 | 17.4 |  |
| critters/moon-jellyfish | critters/sea/moon-jellyfish | 5.4 | centre |  | 12 | 8.9 |  |
| critters/mussel | critters/sea/mussel | 5.4 | centre |  | 12 | 7.8 |  |
| critters/octopus | critters/sea/octopus | 5.4 | centre |  | 12 | 12.8 |  |
| critters/oyster | critters/sea/oyster | 5.4 | centre |  | 12 | 9.4 |  |
| critters/pearl-oyster | critters/sea/pearl-oyster | 5.4 | centre |  | 12 | 9.7 |  |
| critters/red-king-crab | critters/sea/red-king-crab | 5.4 | centre |  | 30 | 16.6 |  |
| critters/scallop | critters/sea/scallop | 5.4 | centre |  | 12 | 9.1 |  |
| critters/sea-anemone | critters/sea/sea-anemone | 5.4 | centre |  | 15 | 12.3 |  |
| critters/sea-cucumber | critters/sea/sea-cucumber | 5.4 | centre |  | 14 | 7.8 |  |
| critters/sea-grapes | critters/sea/sea-grapes | 5.4 | centre |  | 12 | 16.7 |  |
| critters/sea-pig | critters/sea/sea-pig | 5.4 | centre |  | 12 | 11 |  |
| critters/sea-pineapple | critters/sea/sea-pineapple | 5.4 | centre |  | 12 | 12.8 |  |
| critters/sea-slug | critters/sea/sea-slug | 5.4 | centre |  | 12 | 11.3 |  |
| critters/sea-star | critters/sea/sea-star | 5.4 | centre |  | 12 | 9.8 |  |
| critters/sea-urchin | critters/sea/sea-urchin | 5.4 | centre |  | 12 | 11.6 |  |
| critters/seaweed | critters/sea/seaweed | 5.4 | centre |  | 12 | 10.3 |  |
| critters/slate-pencil-urchin | critters/sea/slate-pencil-urchin | 5.4 | centre |  | 17 | 13.5 |  |
| critters/snow-crab | critters/sea/snow-crab | 5.4 | centre |  | 24 | 14.8 |  |
| critters/spider-crab | critters/sea/spider-crab | 5.4 | centre |  | 59 | 21 |  |
| critters/spiny-lobster | critters/sea/spiny-lobster | 5.4 | centre |  | 31 | 17.8 |  |
| critters/spotted-garden-eel | critters/sea/spotted-garden-eel | 5.4 | centre |  | 12 | 11.3 |  |
| critters/sweet-shrimp | critters/sea/sweet-shrimp | 5.4 | centre |  | 12 | 9.9 |  |
| critters/tiger-prawn | critters/sea/tiger-prawn | 5.4 | centre |  | 14 | 12.6 |  |
| critters/turban-shell | critters/sea/turban-shell | 5.4 | centre |  | 12 | 11.7 |  |
| critters/umbrella-octopus | critters/sea/umbrella-octopus | 5.4 | centre |  | 12 | 9.9 |  |
| critters/vampire-squid | critters/sea/vampire-squid | 5.4 | centre |  | 18 | 12.5 |  |
| critters/venus-flower-basket | critters/sea/venus-flower-basket | 5.4 | centre |  | 12 | 14.8 |  |
| critters/whelk | critters/sea/whelk | 5.4 | centre |  | 12 | 12.4 |  |

### bug

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| critters/agrias-butterfly | critters/bugs/agrias-butterfly | 5.4 | centre |  | 15 | 13 |  |
| critters/atlas-moth | critters/bugs/atlas-moth | 5.4 | centre |  | 25 | 17.3 |  |
| critters/bagworm | critters/bugs/bagworm | 5.4 | centre |  | 12 | 10.9 |  |
| critters/banded-dragonfly | critters/bugs/banded-dragonfly | 5.4 | centre |  | 20 | 13.8 |  |
| critters/bell-cricket | critters/bugs/bell-cricket | 5.4 | feet |  | 12 | 9.9 |  |
| critters/brown-cicada | critters/bugs/brown-cicada | 5.4 | feet |  | 19 | 14.9 |  |
| critters/centipede | critters/bugs/centipede | 5.4 | feet |  | 18 | 13.5 |  |
| critters/cicada-shell | critters/bugs/cicada-shell | 5.4 | feet |  | 12 | 13.3 |  |
| critters/citrus-long-horned-beetle | critters/bugs/citrus-long-horned-beetle | 5.4 | feet |  | 12 | 14.2 |  |
| critters/common-bluebottle | critters/bugs/common-bluebottle | 5.4 | centre |  | 15 | 12.7 |  |
| critters/common-butterfly | critters/bugs/common-butterfly | 5.4 | centre |  | 12 | 13.5 |  |
| critters/cricket | critters/bugs/cricket | 5.4 | feet |  | 12 | 10.6 |  |
| critters/cyclommatus-stag | critters/bugs/cyclommatus-stag | 5.4 | feet |  | 20 | 16.4 |  |
| critters/damselfly | critters/bugs/damselfly | 5.4 | centre |  | 13 | 11 |  |
| critters/darner-dragonfly | critters/bugs/darner-dragonfly | 5.4 | centre |  | 18 | 13.1 |  |
| critters/diving-beetle | critters/bugs/diving-beetle | 5.4 | feet |  | 12 | 12.5 |  |
| critters/drone-beetle | critters/bugs/drone-beetle | 5.4 | feet |  | 17 | 14.9 |  |
| critters/earth-boring-dung-beetle | critters/bugs/earth-boring-dung-beetle | 5.4 | feet |  | 13 | 14.4 |  |
| critters/emperor-butterfly | critters/bugs/emperor-butterfly | 5.4 | centre |  | 20 | 12.5 |  |
| critters/evening-cicada | critters/bugs/evening-cicada | 5.4 | feet |  | 16 | 16.1 |  |
| critters/firefly | critters/bugs/firefly | 5.4 | centre |  | 12 | 13.1 |  |
| critters/flea | critters/bugs/flea | 5.4 | feet |  | 12 | 8.3 |  |
| critters/giant-cicada | critters/bugs/giant-cicada | 5.4 | feet |  | 17 | 17.1 |  |
| critters/giant-stag | critters/bugs/giant-stag | 5.4 | feet |  | 20 | 11.2 |  |
| critters/giant-water-bug | critters/bugs/giant-water-bug | 5.4 | feet |  | 15 | 11.2 |  |
| critters/golden-stag | critters/bugs/golden-stag | 5.4 | feet |  | 20 | 17.1 |  |
| critters/goliath-beetle | critters/bugs/goliath-beetle | 5.4 | feet |  | 20 | 16.6 |  |
| critters/grasshopper | critters/bugs/grasshopper | 5.4 | feet |  | 12 | 11.1 |  |
| critters/great-purple-emperor | critters/bugs/great-purple-emperor | 5.4 | centre |  | 18 | 13.6 |  |
| critters/hermit-crab | critters/bugs/hermit-crab | 5.4 | feet |  | 14 | 10.9 |  |
| critters/honeybee | critters/bugs/honeybee | 5.4 | centre |  | 12 | 18.3 |  |
| critters/horned-atlas | critters/bugs/horned-atlas | 5.4 | feet |  | 24 | 16.5 |  |
| critters/horned-dynastid | critters/bugs/horned-dynastid | 5.4 | feet |  | 20 | 17.2 |  |
| critters/horned-elephant | critters/bugs/horned-elephant | 5.4 | feet |  | 25 | 17.4 |  |
| critters/jewel-beetle | critters/bugs/jewel-beetle | 5.4 | feet |  | 13 | 14.1 |  |
| critters/ladybug | critters/bugs/ladybug | 5.4 | feet |  | 12 | 13.3 |  |
| critters/long-locust | critters/bugs/long-locust | 5.4 | feet |  | 19 | 15.1 |  |
| critters/madagascan-sunset-moth | critters/bugs/madagascan-sunset-moth | 5.4 | centre |  | 15 | 13.4 |  |
| critters/man-faced-stink-bug | critters/bugs/man-faced-stink-bug | 5.4 | feet |  | 18 | 15.9 |  |
| critters/mantis | critters/bugs/mantis | 5.4 | feet |  | 21 | 18.7 |  |
| critters/migratory-locust | critters/bugs/migratory-locust | 5.4 | feet |  | 19 | 15.1 |  |
| critters/miyama-stag | critters/bugs/miyama-stag | 5.4 | feet |  | 20 | 16.9 |  |
| critters/mole-cricket | critters/bugs/mole-cricket | 5.4 | feet |  | 13 | 13.4 |  |
| critters/monarch-butterfly | critters/bugs/monarch-butterfly | 5.4 | centre |  | 18 | 14.7 |  |
| critters/mosquito | critters/bugs/mosquito | 5.4 | centre |  | 12 | 9.5 |  |
| critters/moth | critters/bugs/moth | 5.4 | centre |  | 12 | 13.5 |  |
| critters/orchid-mantis | critters/bugs/orchid-mantis | 5.4 | feet |  | 14 | 13.8 |  |
| critters/paper-kite-butterfly | critters/bugs/paper-kite-butterfly | 5.4 | centre |  | 20 | 14.3 |  |
| critters/peacock-butterfly | critters/bugs/peacock-butterfly | 5.4 | centre |  | 17 | 12.2 |  |
| critters/pill-bug | critters/bugs/pill-bug | 5.4 | feet |  | 12 | 10.5 |  |
| critters/pondskater | critters/bugs/pondskater | 5.4 | feet |  | 12 | 9.8 |  |
| critters/queen-alexandras-birdwing | critters/bugs/queen-alexandras-birdwing | 5.4 | centre |  | 28 | 13 |  |
| critters/rainbow-stag | critters/bugs/rainbow-stag | 5.4 | feet |  | 21 | 16.1 |  |
| critters/rajah-brookes-birdwing | critters/bugs/rajah-brookes-birdwing | 5.4 | centre |  | 22 | 13.7 |  |
| critters/red-dragonfly | critters/bugs/red-dragonfly | 5.4 | centre |  | 12 | 10.9 |  |
| critters/rice-grasshopper | critters/bugs/rice-grasshopper | 5.4 | feet |  | 12 | 14.7 |  |
| critters/robust-cicada | critters/bugs/robust-cicada | 5.4 | feet |  | 22 | 15.9 |  |
| critters/rosalia-batesi-beetle | critters/bugs/rosalia-batesi-beetle | 5.4 | feet |  | 15 | 16 |  |
| critters/saw-stag | critters/bugs/saw-stag | 5.4 | feet |  | 20 | 17.1 |  |
| critters/scarab-beetle | critters/bugs/scarab-beetle | 5.4 | feet |  | 16 | 17.5 |  |
| critters/scorpion | critters/bugs/scorpion | 5.4 | feet |  | 16 | 10.8 |  |
| critters/snail | critters/bugs/snail | 5.4 | feet |  | 12 | 7.1 |  |
| critters/spider | critters/bugs/spider | 5.4 | centre |  | 12 | 11.6 |  |
| critters/stinkbug | critters/bugs/stinkbug | 5.4 | feet |  | 13 | 14.4 |  |
| critters/tarantula | critters/bugs/tarantula | 5.4 | feet |  | 13 | 10.8 |  |
| critters/tiger-beetle | critters/bugs/tiger-beetle | 5.4 | feet |  | 12 | 15 |  |
| critters/tiger-butterfly | critters/bugs/tiger-butterfly | 5.4 | centre |  | 17 | 14 |  |
| critters/violin-beetle | critters/bugs/violin-beetle | 5.4 | feet |  | 14 | 14.7 |  |
| critters/walker-cicada | critters/bugs/walker-cicada | 5.4 | feet |  | 16 | 16.2 |  |
| critters/walking-leaf | critters/bugs/walking-leaf | 5.4 | feet |  | 17 | 11.6 |  |
| critters/walking-stick | critters/bugs/walking-stick | 5.4 | feet |  | 15 | 9.7 |  |
| critters/wasp | critters/bugs/wasp | 5.4 | centre |  | 12 | 20.5 |  |
| critters/wasp-swarm | critters/bugs/wasp-swarm | 5.4 | centre |  | 12 | 6.2 |  |
| critters/wharf-roach | critters/bugs/wharf-roach | 5.4 | feet |  | 12 | 5.9 |  |
| critters/yellow-butterfly | critters/bugs/yellow-butterfly | 5.4 | centre |  | 12 | 14.3 |  |

### fish

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| critters/anchovy | critters/fish/anchovy | 5.4 | centre |  | 12 | 6.7 |  |
| critters/angelfish | critters/fish/angelfish | 5.4 | centre |  | 12 | 9.7 |  |
| critters/arapaima | critters/fish/arapaima | 5.4 | centre |  | 86 | 12.8 |  |
| critters/arowana | critters/fish/arowana | 5.4 | centre |  | 33 | 12.3 |  |
| critters/barred-knifejaw | critters/fish/barred-knifejaw | 5.4 | centre |  | 16 | 10.1 |  |
| critters/barreleye | critters/fish/barreleye | 5.4 | centre |  | 12 | 12.1 |  |
| critters/betta | critters/fish/betta | 5.4 | centre |  | 15 | 10.8 |  |
| critters/bitterling | critters/fish/bitterling | 5.4 | centre |  | 12 | 8.1 |  |
| critters/black-bass | critters/fish/black-bass | 5.4 | centre |  | 22 | 10.2 |  |
| critters/blowfish | critters/fish/blowfish | 5.4 | centre |  | 16 | 15.3 |  |
| critters/blue-marlin | critters/fish/blue-marlin | 5.4 | centre |  | 74 | 12.4 |  |
| critters/bluegill | critters/fish/bluegill | 5.4 | centre |  | 14 | 9 |  |
| critters/boot | critters/fish/boot | 5.4 | centre |  | 12 | 7.8 |  |
| critters/butterfly-fish | critters/fish/butterfly-fish | 5.4 | centre |  | 12 | 9.3 |  |
| critters/carp | critters/fish/carp | 5.4 | centre |  | 24 | 10.5 |  |
| critters/catfish | critters/fish/catfish | 5.4 | centre |  | 23 | 10.1 |  |
| critters/char | critters/fish/char | 5.4 | centre |  | 28 | 10.5 |  |
| critters/cherry-salmon | critters/fish/cherry-salmon | 5.4 | centre |  | 21 | 9.7 |  |
| critters/clownfish | critters/fish/clownfish | 5.4 | centre |  | 12 | 8.7 |  |
| critters/coelacanth | critters/fish/coelacanth | 5.4 | centre |  | 57 | 14 |  |
| critters/crawfish | critters/fish/crawfish | 5.4 | centre |  | 16 | 13.6 |  |
| critters/crucian-carp | critters/fish/crucian-carp | 5.4 | centre |  | 17 | 7.4 |  |
| critters/dab | critters/fish/dab | 5.4 | centre |  | 19 | 10.3 |  |
| critters/dace | critters/fish/dace | 5.4 | centre |  | 17 | 9.2 |  |
| critters/dorado | critters/fish/dorado | 5.4 | centre |  | 37 | 13.1 |  |
| critters/empty-can | critters/fish/empty-can | 5.4 | centre |  | 12 | 7.2 |  |
| critters/football-fish | critters/fish/football-fish | 5.4 | centre |  | 27 | 15.5 |  |
| critters/freshwater-goby | critters/fish/freshwater-goby | 5.4 | centre |  | 18 | 10 |  |
| critters/frog | critters/fish/frog | 5.4 | centre |  | 12 | 10.3 |  |
| critters/gar | critters/fish/gar | 5.4 | centre |  | 44 | 11.5 |  |
| critters/giant-snakehead | critters/fish/giant-snakehead | 5.4 | centre |  | 27 | 11.6 |  |
| critters/giant-trevally | critters/fish/giant-trevally | 5.4 | centre |  | 38 | 12.7 |  |
| critters/golden-trout | critters/fish/golden-trout | 5.4 | centre |  | 21 | 10.2 |  |
| critters/goldfish | critters/fish/goldfish | 5.4 | centre |  | 12 | 9.4 |  |
| critters/great-white-shark | critters/fish/great-white-shark | 5.4 | centre |  | 81 | 17.2 |  |
| critters/guppy | critters/fish/guppy | 5.4 | centre |  | 12 | 8.4 |  |
| critters/hammerhead-shark | critters/fish/hammerhead-shark | 5.4 | centre |  | 73 | 14.5 |  |
| critters/horse-mackerel | critters/fish/horse-mackerel | 5.4 | centre |  | 16 | 9.1 |  |
| critters/killifish | critters/fish/killifish | 5.4 | centre |  | 12 | 7.3 |  |
| critters/king-salmon | critters/fish/king-salmon | 5.4 | centre |  | 35 | 11.4 |  |
| critters/koi | critters/fish/koi | 5.4 | centre |  | 24 | 12.5 |  |
| critters/loach | critters/fish/loach | 5.4 | centre |  | 15 | 8.7 |  |
| critters/mahi-mahi | critters/fish/mahi-mahi | 5.4 | centre |  | 58 | 12.3 |  |
| critters/mitten-crab | critters/fish/mitten-crab | 5.4 | centre |  | 16 | 11.8 |  |
| critters/moray-eel | critters/fish/moray-eel | 5.4 | centre |  | 32 | 8.4 |  |
| critters/napoleonfish | critters/fish/napoleonfish | 5.4 | centre |  | 51 | 12.3 |  |
| critters/neon-tetra | critters/fish/neon-tetra | 5.4 | centre |  | 12 | 7.2 |  |
| critters/nibble-fish | critters/fish/nibble-fish | 5.4 | centre |  | 12 | 8.6 |  |
| critters/oarfish | critters/fish/oarfish | 5.4 | centre |  | 95 | 17.7 |  |
| critters/ocean-sunfish | critters/fish/ocean-sunfish | 5.4 | centre |  | 64 | 13.9 |  |
| critters/old-tire | critters/fish/old-tire | 5.4 | centre |  | 16 | 7.8 |  |
| critters/olive-flounder | critters/fish/olive-flounder | 5.4 | centre |  | 36 | 13.3 |  |
| critters/pale-chub | critters/fish/pale-chub | 5.4 | centre |  | 12 | 7.4 |  |
| critters/pike | critters/fish/pike | 5.4 | centre |  | 37 | 12.2 |  |
| critters/piranha | critters/fish/piranha | 5.4 | centre |  | 14 | 9.6 |  |
| critters/pond-smelt | critters/fish/pond-smelt | 5.4 | centre |  | 12 | 8 |  |
| critters/pop-eyed-goldfish | critters/fish/pop-eyed-goldfish | 5.4 | centre |  | 12 | 10 |  |
| critters/puffer-fish | critters/fish/puffer-fish | 5.4 | centre |  | 14 | 9.6 |  |
| critters/rainbowfish | critters/fish/rainbowfish | 5.4 | centre |  | 12 | 7.6 |  |
| critters/ranchu-goldfish | critters/fish/ranchu-goldfish | 5.4 | centre |  | 12 | 10 |  |
| critters/ray | critters/fish/ray | 5.4 | centre |  | 51 | 10.3 |  |
| critters/red-snapper | critters/fish/red-snapper | 5.4 | centre |  | 24 | 10.3 |  |
| critters/ribbon-eel | critters/fish/ribbon-eel | 5.4 | centre |  | 37 | 14.6 |  |
| critters/saddled-bichir | critters/fish/saddled-bichir | 5.4 | centre |  | 32 | 11.6 |  |
| critters/salmon | critters/fish/salmon | 5.4 | centre |  | 27 | 10.9 |  |
| critters/saw-shark | critters/fish/saw-shark | 5.4 | centre |  | 52 | 14.2 |  |
| critters/sea-bass | critters/fish/sea-bass | 5.4 | centre |  | 32 | 10.7 |  |
| critters/sea-butterfly | critters/fish/sea-butterfly | 5.4 | centre |  | 12 | 5.9 |  |
| critters/sea-horse | critters/fish/sea-horse | 5.4 | centre |  | 12 | 7.2 |  |
| critters/snapping-turtle | critters/fish/snapping-turtle | 5.4 | centre |  | 29 | 14.8 |  |
| critters/soft-shelled-turtle | critters/fish/soft-shelled-turtle | 5.4 | centre |  | 28 | 12 |  |
| critters/squid | critters/fish/squid | 5.4 | centre |  | 18 | 9.4 |  |
| critters/stringfish | critters/fish/stringfish | 5.4 | centre |  | 40 | 10.3 |  |
| critters/sturgeon | critters/fish/sturgeon | 5.4 | centre |  | 64 | 11.3 |  |
| critters/suckerfish | critters/fish/suckerfish | 5.4 | centre |  | 29 | 9.3 |  |
| critters/surgeonfish | critters/fish/surgeonfish | 5.4 | centre |  | 12 | 10.1 |  |
| critters/sweetfish | critters/fish/sweetfish | 5.4 | centre |  | 20 | 9.5 |  |
| critters/tadpole | critters/fish/tadpole | 5.4 | centre |  | 12 | 5 |  |
| critters/tilapia | critters/fish/tilapia | 5.4 | centre |  | 19 | 9.8 |  |
| critters/tuna | critters/fish/tuna | 5.4 | centre |  | 55 | 12.2 |  |
| critters/whale-shark | critters/fish/whale-shark | 5.4 | centre |  | 107 | 17.6 |  |
| critters/yellow-perch | critters/fish/yellow-perch | 5.4 | centre |  | 15 | 9.5 |  |
| critters/zebra-turkeyfish | critters/fish/zebra-turkeyfish | 5.4 | centre |  | 23 | 16.1 |  |

### deco

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| deco/bamboo-shoot-lamp | deco/bamboo-shoot-lamp | 3 | feet | 1×1 | 12 | 15.1 | lit |
| deco/bamboo-shoot-lamp-lit | deco/bamboo-shoot-lamp | 3 | feet | 1×1 | 12 | 15.1 | lit |
| deco/bbs-bird-day | deco/bbs-bird-day | 3.5 | feet | 1×1 | 12 | 28.1 |  |
| deco/bbs-bird-night | deco/bbs-bird-night | 3.5 | feet | 1×1 | 12 | 25 |  |
| deco/beach-chair | deco/beach-chair | 3 | feet | 2×1 | 29 | 24.1 |  |
| deco/bulletin-board | deco/bulletin-board | 3.5 | feet | 2×1 | 30 | 20.5 | winter: deco/bulletin-board-winter |
| deco/bulletin-board-winter | deco/bulletin-board-winter | 3.5 | feet | 2×1 | 30 | 22.2 |  |
| deco/campfire | campfire | 3 | feet | 2×2 | 25 | 30.5 | lit |
| deco/campfire-lit | campfire | 3 | feet | 2×2 | 25 | 30.5 | lit |
| deco/campsite | tent | 3 | feet | 4×4 | 60 | 71.1 | lit, winter: deco/campsite-winter |
| deco/campsite-lit | tent | 3 | feet | 4×4 | 60 | 71.1 | lit |
| deco/campsite-sign | campsite-sign | 3 | feet | 2×1 | 26 | 14 |  |
| deco/campsite-winter | deco/campsite-winter | 3 | feet | 4×4 | 60 | 76.1 | lit |
| deco/egg-arch | deco/egg-arch | 3 | feet | 3×1 | 45 | 30.9 |  |
| deco/firewood | firewood | 3 | feet | 1×1 | 12 | 15.6 |  |
| deco/flat-rock | flat-rock | 3 | feet | 2×1 | 28 | 15.7 |  |
| deco/garden-lantern | garden-lantern | 3 | feet | 1×1 | 12 | 13.4 | lit |
| deco/garden-lantern-lit | garden-lantern | 3 | feet | 1×1 | 12 | 13.4 | lit |
| deco/garden-lantern-white | garden-lantern-white | 3 | feet | 1×1 | 12 | 14 | lit |
| deco/garden-lantern-white-lit | garden-lantern-white | 3 | feet | 1×1 | 12 | 14 | lit |
| deco/garden-rock | garden-rock | 3 | feet | 1×1 | 15 | 14.1 |  |
| deco/hammock | hammock | 3 | feet | 2×1 | 30 | 36.1 |  |
| deco/illumi-tree | deco/illumi-tree | 3 | feet | 2×2 | 30 | 42.6 | lit |
| deco/illumi-tree-lit | deco/illumi-tree | 3 | feet | 2×2 | 30 | 42.6 | lit |
| deco/kadomatsu | deco/kadomatsu | 3 | feet | 1×1 | 12 | 20.6 |  |
| deco/log-bench | log-bench | 3 | feet | 2×1 | 30 | 21.7 |  |
| deco/log-stool | log-stool | 3 | feet | 1×1 | 12 | 9.2 |  |
| deco/mushroom-lamp | deco/mushroom-lamp | 3 | feet | 1×1 | 12 | 27.7 | lit |
| deco/mushroom-lamp-lit | deco/mushroom-lamp | 3 | feet | 1×1 | 12 | 27.7 | lit |
| deco/nut-lamp | deco/nut-lamp | 3 | feet | 1×1 | 12 | 18.8 | lit |
| deco/nut-lamp-lit | deco/nut-lamp | 3 | feet | 1×1 | 12 | 18.8 | lit |
| deco/park-bench | park-bench | 3 | feet | 2×1 | 26 | 18.6 |  |
| deco/picnic-set | deco/picnic-set | 3 | feet | 2×2 | 22 | 32.7 |  |
| deco/pond-stone-maple | deco/pond-stone-maple | 3 | feet | 2×1 | 27 | 15.5 |  |
| deco/pond-stone-sakura | deco/pond-stone-sakura | 3 | feet | 2×1 | 27 | 19.4 |  |
| deco/pullup | pullup | 3 | feet | 1×1 | 15 | 13.1 |  |
| deco/pump | pump | 3 | feet | 1×1 | 15 | 15.2 |  |
| deco/rod-stand | rod-stand | 3 | feet | 1×1 | 12 | 18.4 |  |
| deco/sandcastle | deco/sandcastle | 3 | feet | 1×1 | 13 | 15.2 |  |
| deco/shishiodoshi | shishiodoshi | 3 | feet | 1×1 | 15 | 17.7 |  |
| deco/shishiodoshi-tip | deco/shishiodoshi-tip | 3 | feet | 1×1 | 15 | 17.7 |  |
| deco/snowboy-0 | deco/snowboy-0 | 3 | feet | 1×1 | 15 | 16.3 |  |
| deco/snowboy-1 | deco/snowboy-1 | 3 | feet | 1×1 | 15 | 18.4 |  |
| deco/snowboy-2 | deco/snowboy-2 | 3 | feet | 2×2 | 21 | 18.6 |  |
| deco/snowboy-3 | deco/snowboy-3 | 3 | feet | 2×2 | 23 | 18.4 |  |
| deco/streetlamp | streetlamp | 3 | feet | 1×1 | 12 | 16.5 | lit |
| deco/streetlamp-lit | streetlamp | 3 | feet | 1×1 | 12 | 16.5 | lit |
| deco/tape-deck | tape-deck | 5.4 | feet | 2×1 | 20 | 16.7 |  |

### event

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| deco/birthday-cake | events/birthday-cake | 3 | feet | 1×1 | 12 | 17.2 |  |
| deco/countdown-board | events/countdown-board | 3 | feet | 3×1 | 42 | 28.5 | lit |
| deco/party-popper | events/party-popper | 5.294 | feet | 1×1 | 12 | 7.1 |  |
| deco/pumpkin | events/pumpkin | 4.867 | feet | 1×1 | 12 | 7.1 |  |
| deco/spooky-lantern | events/spooky-lantern | 3 | feet | 1×1 | 12 | 9 | lit |
| deco/wedding-arch | events/wedding-arch | 3 | feet | 3×1 | 39 | 46.3 |  |

### decor

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| decor/barbell-0 | decor/barbell | 3 | feet | 2×1 | 29 | 12 |  |
| decor/barbell-1 | decor/barbell | 3 | feet | 2×1 | 29 | 12 | yaw 90° |
| decor/barbell-2 | decor/barbell | 3 | feet | 2×1 | 29 | 12 | yaw 180° |
| decor/barbell-3 | decor/barbell | 3 | feet | 2×1 | 29 | 12 | yaw 270° |
| decor/birdbath-0 | decor/birdbath | 3 | feet | 1×1 | 12 | 14.2 |  |
| decor/birdbath-1 | decor/birdbath | 3 | feet | 1×1 | 12 | 14.2 | yaw 90° |
| decor/birdbath-2 | decor/birdbath | 3 | feet | 1×1 | 12 | 14.2 | yaw 180° |
| decor/birdbath-3 | decor/birdbath | 3 | feet | 1×1 | 12 | 14.2 | yaw 270° |
| decor/brick-well-0 | decor/brick-well | 3 | feet | 2×2 | 22 | 23.6 |  |
| decor/brick-well-1 | decor/brick-well | 3 | feet | 2×2 | 22 | 23.6 | yaw 90° |
| decor/brick-well-2 | decor/brick-well | 3 | feet | 2×2 | 22 | 23.6 | yaw 180° |
| decor/brick-well-3 | decor/brick-well | 3 | feet | 2×2 | 22 | 23.6 | yaw 270° |
| decor/climbing-wall-0 | decor/climbing-wall | 3 | feet | 2×1 | 30 | 12.7 |  |
| decor/climbing-wall-1 | decor/climbing-wall | 3 | feet | 2×1 | 30 | 12.7 | yaw 90° |
| decor/climbing-wall-2 | decor/climbing-wall | 3 | feet | 2×1 | 30 | 12.7 | yaw 180° |
| decor/climbing-wall-3 | decor/climbing-wall | 3 | feet | 2×1 | 30 | 12.7 | yaw 270° |
| decor/digital-scale-0 | decor/digital-scale | 3 | feet | 1×1 | 12 | 8.7 |  |
| decor/digital-scale-1 | decor/digital-scale | 3 | feet | 1×1 | 12 | 8.7 | yaw 90° |
| decor/digital-scale-2 | decor/digital-scale | 3 | feet | 1×1 | 12 | 8.7 | yaw 180° |
| decor/digital-scale-3 | decor/digital-scale | 3 | feet | 1×1 | 12 | 8.7 | yaw 270° |
| decor/exercise-ball-0 | decor/exercise-ball | 3 | feet | 1×1 | 12 | 6.1 |  |
| decor/exercise-ball-1 | decor/exercise-ball | 3 | feet | 1×1 | 12 | 6.1 | yaw 90° |
| decor/exercise-ball-2 | decor/exercise-ball | 3 | feet | 1×1 | 12 | 6.1 | yaw 180° |
| decor/exercise-ball-3 | decor/exercise-ball | 3 | feet | 1×1 | 12 | 6.1 | yaw 270° |
| decor/exercise-bike-0 | decor/exercise-bike | 3 | feet | 1×1 | 14 | 16.5 | lit |
| decor/exercise-bike-1 | decor/exercise-bike | 3 | feet | 1×1 | 14 | 16.5 | lit, yaw 90° |
| decor/exercise-bike-2 | decor/exercise-bike | 3 | feet | 1×1 | 14 | 16.5 | lit, yaw 180° |
| decor/exercise-bike-3 | decor/exercise-bike | 3 | feet | 1×1 | 14 | 16.5 | lit, yaw 270° |
| decor/garden-wagon-0 | decor/garden-wagon | 3 | feet | 2×1 | 29 | 45.4 |  |
| decor/garden-wagon-1 | decor/garden-wagon | 3 | feet | 2×1 | 29 | 45.4 | yaw 90° |
| decor/garden-wagon-2 | decor/garden-wagon | 3 | feet | 2×1 | 29 | 45.4 | yaw 180° |
| decor/garden-wagon-3 | decor/garden-wagon | 3 | feet | 2×1 | 29 | 45.4 | yaw 270° |
| decor/iron-chair-0 | decor/iron-chair | 3 | feet | 1×1 | 12 | 15.3 |  |
| decor/iron-chair-1 | decor/iron-chair | 3 | feet | 1×1 | 12 | 15.3 | yaw 90° |
| decor/iron-chair-2 | decor/iron-chair | 3 | feet | 1×1 | 12 | 15.3 | yaw 180° |
| decor/iron-chair-3 | decor/iron-chair | 3 | feet | 1×1 | 12 | 15.3 | yaw 270° |
| decor/iron-table-0 | decor/iron-table | 3 | feet | 1×1 | 14 | 13.4 |  |
| decor/iron-table-1 | decor/iron-table | 3 | feet | 1×1 | 14 | 13.4 | yaw 90° |
| decor/iron-table-2 | decor/iron-table | 3 | feet | 1×1 | 14 | 13.4 | yaw 180° |
| decor/iron-table-3 | decor/iron-table | 3 | feet | 1×1 | 14 | 13.4 | yaw 270° |
| decor/kettlebell-0 | decor/kettlebell | 3 | feet | 1×1 | 12 | 8.8 |  |
| decor/kettlebell-1 | decor/kettlebell | 3 | feet | 1×1 | 12 | 8.8 | yaw 90° |
| decor/kettlebell-2 | decor/kettlebell | 3 | feet | 1×1 | 12 | 8.8 | yaw 180° |
| decor/kettlebell-3 | decor/kettlebell | 3 | feet | 1×1 | 12 | 8.8 | yaw 270° |
| decor/monstera-0 | decor/monstera | 3 | feet | 1×1 | 15 | 20.6 |  |
| decor/monstera-1 | decor/monstera | 3 | feet | 1×1 | 15 | 20.6 | yaw 90° |
| decor/monstera-2 | decor/monstera | 3 | feet | 1×1 | 15 | 20.6 | yaw 180° |
| decor/monstera-3 | decor/monstera | 3 | feet | 1×1 | 15 | 20.6 | yaw 270° |
| decor/protein-shaker-0 | decor/protein-shaker | 3 | feet | 1×1 | 12 | 17.3 |  |
| decor/protein-shaker-1 | decor/protein-shaker | 3 | feet | 1×1 | 12 | 17.3 | yaw 90° |
| decor/protein-shaker-2 | decor/protein-shaker | 3 | feet | 1×1 | 12 | 17.3 | yaw 180° |
| decor/protein-shaker-3 | decor/protein-shaker | 3 | feet | 1×1 | 12 | 17.3 | yaw 270° |
| decor/punching-bag-0 | decor/punching-bag | 3 | feet | 1×1 | 14 | 14.5 |  |
| decor/punching-bag-1 | decor/punching-bag | 3 | feet | 1×1 | 14 | 14.5 | yaw 90° |
| decor/punching-bag-2 | decor/punching-bag | 3 | feet | 1×1 | 14 | 14.5 | yaw 180° |
| decor/punching-bag-3 | decor/punching-bag | 3 | feet | 1×1 | 14 | 14.5 | yaw 270° |
| decor/signpost-0 | decor/signpost | 3 | feet | 1×1 | 13 | 13 |  |
| decor/signpost-1 | decor/signpost | 3 | feet | 1×1 | 13 | 13 | yaw 90° |
| decor/signpost-2 | decor/signpost | 3 | feet | 1×1 | 13 | 13 | yaw 180° |
| decor/signpost-3 | decor/signpost | 3 | feet | 1×1 | 13 | 13 | yaw 270° |
| decor/stone-lantern-0 | decor/stone-lantern | 3 | feet | 1×1 | 12 | 18.3 | lit |
| decor/stone-lantern-1 | decor/stone-lantern | 3 | feet | 1×1 | 12 | 18.3 | lit, yaw 90° |
| decor/stone-lantern-2 | decor/stone-lantern | 3 | feet | 1×1 | 12 | 18.3 | lit, yaw 180° |
| decor/stone-lantern-3 | decor/stone-lantern | 3 | feet | 1×1 | 12 | 18.3 | lit, yaw 270° |
| decor/tanuki-0 | decor/tanuki | 3 | feet | 1×1 | 13 | 17.7 |  |
| decor/tanuki-1 | decor/tanuki | 3 | feet | 1×1 | 13 | 17.7 | yaw 90° |
| decor/tanuki-2 | decor/tanuki | 3 | feet | 1×1 | 13 | 17.7 | yaw 180° |
| decor/tanuki-3 | decor/tanuki | 3 | feet | 1×1 | 13 | 17.7 | yaw 270° |
| decor/treadmill-0 | decor/treadmill | 3 | feet | 2×1 | 25 | 20.5 | lit |
| decor/treadmill-1 | decor/treadmill | 3 | feet | 2×1 | 25 | 20.5 | lit, yaw 90° |
| decor/treadmill-2 | decor/treadmill | 3 | feet | 2×1 | 25 | 20.5 | lit, yaw 180° |
| decor/treadmill-3 | decor/treadmill | 3 | feet | 2×1 | 25 | 20.5 | lit, yaw 270° |
| decor/upright-locker-0 | decor/upright-locker | 3 | feet | 1×1 | 12 | 13.9 |  |
| decor/upright-locker-1 | decor/upright-locker | 3 | feet | 1×1 | 12 | 13.9 | yaw 90° |
| decor/upright-locker-2 | decor/upright-locker | 3 | feet | 1×1 | 12 | 13.9 | yaw 180° |
| decor/upright-locker-3 | decor/upright-locker | 3 | feet | 1×1 | 12 | 13.9 | yaw 270° |
| decor/water-cooler-0 | decor/water-cooler | 3 | feet | 1×1 | 12 | 21.6 |  |
| decor/water-cooler-1 | decor/water-cooler | 3 | feet | 1×1 | 12 | 21.6 | yaw 90° |
| decor/water-cooler-2 | decor/water-cooler | 3 | feet | 1×1 | 12 | 21.6 | yaw 180° |
| decor/water-cooler-3 | decor/water-cooler | 3 | feet | 1×1 | 12 | 21.6 | yaw 270° |
| decor/weight-bench-0 | decor/weight-bench | 3 | feet | 2×1 | 27 | 22.3 |  |
| decor/weight-bench-1 | decor/weight-bench | 3 | feet | 2×1 | 27 | 22.3 | yaw 90° |
| decor/weight-bench-2 | decor/weight-bench | 3 | feet | 2×1 | 27 | 22.3 | yaw 180° |
| decor/weight-bench-3 | decor/weight-bench | 3 | feet | 2×1 | 27 | 22.3 | yaw 270° |
| decor/wheelbarrow-0 | decor/wheelbarrow | 3 | feet | 1×1 | 15 | 17.2 |  |
| decor/wheelbarrow-1 | decor/wheelbarrow | 3 | feet | 1×1 | 15 | 17.2 | yaw 90° |
| decor/wheelbarrow-2 | decor/wheelbarrow | 3 | feet | 1×1 | 15 | 17.2 | yaw 180° |
| decor/wheelbarrow-3 | decor/wheelbarrow | 3 | feet | 1×1 | 15 | 17.2 | yaw 270° |

### flower

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| flowers/black-cosmos | flowers/black-cosmos | 3 | feet |  | 15 | 13.1 |  |
| flowers/black-roses | flowers/black-roses | 3 | feet |  | 15 | 13.6 |  |
| flowers/black-tulips | flowers/black-tulips | 3 | feet |  | 15 | 13.1 |  |
| flowers/blue-pansies | flowers/blue-pansies | 3 | feet |  | 16 | 10.5 |  |
| flowers/blue-roses | flowers/blue-roses | 3 | feet |  | 15 | 14.2 |  |
| flowers/green-mums | flowers/green-mums | 3 | feet |  | 15 | 14.7 |  |
| flowers/orange-cosmos | flowers/orange-cosmos | 3 | feet |  | 15 | 13.4 |  |
| flowers/orange-lilies | flowers/orange-lilies | 3 | feet |  | 14 | 13.4 |  |
| flowers/orange-pansies | flowers/orange-pansies | 3 | feet |  | 16 | 10.8 |  |
| flowers/orange-roses | flowers/orange-roses | 3 | feet |  | 15 | 14.2 |  |
| flowers/orange-tulips | flowers/orange-tulips | 3 | feet |  | 15 | 13.3 |  |
| flowers/pink-cosmos | flowers/pink-cosmos | 3 | feet |  | 15 | 13.4 |  |
| flowers/pink-hyacinths | flowers/pink-hyacinths | 3 | feet |  | 14 | 13.3 |  |
| flowers/pink-lilies | flowers/pink-lilies | 3 | feet |  | 14 | 13.3 |  |
| flowers/pink-mums | flowers/pink-mums | 3 | feet |  | 15 | 14.8 |  |
| flowers/pink-roses | flowers/pink-roses | 3 | feet |  | 15 | 13.9 |  |
| flowers/pink-tulips | flowers/pink-tulips | 3 | feet |  | 15 | 13.2 |  |
| flowers/purple-hyacinths | flowers/purple-hyacinths | 3 | feet |  | 14 | 13.5 |  |
| flowers/purple-mums | flowers/purple-mums | 3 | feet |  | 15 | 15 |  |
| flowers/purple-pansies | flowers/purple-pansies | 3 | feet |  | 16 | 10.4 |  |
| flowers/purple-roses | flowers/purple-roses | 3 | feet |  | 15 | 13.9 |  |
| flowers/purple-tulips | flowers/purple-tulips | 3 | feet |  | 15 | 13.4 |  |
| flowers/purple-windflowers | flowers/purple-windflowers | 3 | feet |  | 15 | 11.8 |  |
| flowers/red-cosmos | flowers/red-cosmos | 3 | feet |  | 15 | 13.5 |  |
| flowers/red-mums | flowers/red-mums | 3 | feet |  | 15 | 15 |  |
| flowers/red-pansies | flowers/red-pansies | 3 | feet |  | 16 | 10.6 |  |
| flowers/red-roses | flowers/red-roses | 3 | feet |  | 15 | 14.3 |  |
| flowers/red-tulips | flowers/red-tulips | 3 | feet |  | 15 | 13.3 |  |
| flowers/red-windflowers | flowers/red-windflowers | 3 | feet |  | 15 | 12.2 |  |
| flowers/white-cosmos | flowers/white-cosmos | 3 | feet |  | 15 | 13.1 |  |
| flowers/white-hyacinths | flowers/white-hyacinths | 3 | feet |  | 14 | 13.2 |  |
| flowers/white-lilies | flowers/white-lilies | 3 | feet |  | 14 | 13.3 |  |
| flowers/white-mums | flowers/white-mums | 3 | feet |  | 15 | 14.5 |  |
| flowers/white-pansies | flowers/white-pansies | 3 | feet |  | 16 | 10.5 |  |
| flowers/white-roses | flowers/white-roses | 3 | feet |  | 15 | 13.5 |  |
| flowers/white-tulips | flowers/white-tulips | 3 | feet |  | 15 | 12.8 |  |
| flowers/white-windflowers | flowers/white-windflowers | 3 | feet |  | 15 | 11.7 |  |
| flowers/yellow-cosmos | flowers/yellow-cosmos | 3 | feet |  | 15 | 13.4 |  |
| flowers/yellow-lilies | flowers/yellow-lilies | 3 | feet |  | 14 | 13.6 |  |
| flowers/yellow-mums | flowers/yellow-mums | 3 | feet |  | 15 | 14.9 |  |
| flowers/yellow-pansies | flowers/yellow-pansies | 3 | feet |  | 16 | 10.7 |  |
| flowers/yellow-tulips | flowers/yellow-tulips | 3 | feet |  | 15 | 13.2 |  |

### fruit

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fruit/apple | fruit-apple | 5.217 | feet |  | 12 | 10.8 |  |
| fruit/cherry | fruit-cherry | 4.918 | feet |  | 12 | 11.1 |  |
| fruit/peach | fruit-peach | 5.755 | feet |  | 12 | 13.1 |  |
| fruit/pear | fruit-pear | 4.38 | feet |  | 12 | 12.9 |  |

### fx

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fx/bang | fx/bang | 13.5 | centre |  | 14 | 2.1 |  |
| fx/confetti | fx/confetti | 9.249 | centre |  | 12 | 1.9 |  |
| fx/dust | fx/dust | 7.292 | feet |  | 12 | 2.3 |  |
| fx/flame | fx/flame | 7.692 | feet |  | 12 | 2.1 | lit |
| fx/heart | fx/heart | 2.985 | centre |  | 12 | 6.5 |  |
| fx/lily-pad | fx/lily-pad | 6 | feet |  | 12 | 2 |  |
| fx/note | fx/note | 2.933 | centre |  | 12 | 6.5 |  |
| fx/ripple | fx/ripple | 9 | feet |  | 12 | 2 |  |
| fx/sparkle | fx/sparkle | 6 | centre |  | 12 | 1.8 |  |
| fx/splash | fx/splash | 11.25 | feet |  | 12 | 2 |  |
| fx/sweat | fx/sweat | 4.211 | centre |  | 12 | 1.9 |  |
| fx/zzz | fx/zzz | 5.785 | centre |  | 12 | 2 |  |
| season/maple-leaf | fx/maple-leaf | 2.286 | centre |  | 12 | 3.6 |  |
| season/petal | fx/petal | 3.07 | centre |  | 12 | 3.4 |  |
| season/snowflake | fx/snowflake | 2.288 | centre |  | 12 | 5.7 |  |

### shadow

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shadow/dive | critters/shadows/dive | 5.102 | feet |  | 15 | 2.9 |  |
| shadow/fin | critters/shadows/fin | 6.787 | feet |  | 32 | 3 |  |
| shadow/fresh-1 | critters/shadows/fresh-1 | 7.752 | feet |  | 12 | 2.7 |  |
| shadow/fresh-2 | critters/shadows/fresh-2 | 7.182 | feet |  | 13 | 2.7 |  |
| shadow/fresh-3 | critters/shadows/fresh-3 | 4.706 | feet |  | 16 | 2.7 |  |
| shadow/fresh-4 | critters/shadows/fresh-4 | 4.717 | feet |  | 20 | 2.8 |  |
| shadow/fresh-5 | critters/shadows/fresh-5 | 5.09 | feet |  | 24 | 2.8 |  |
| shadow/fresh-6 | critters/shadows/fresh-6 | 6.172 | feet |  | 32 | 2.8 |  |
| shadow/narrow | critters/shadows/narrow | 4.666 | feet |  | 22 | 3 |  |
| shadow/sea-1 | critters/shadows/sea-1 | 7.752 | feet |  | 12 | 2.7 |  |
| shadow/sea-2 | critters/shadows/sea-2 | 7.182 | feet |  | 13 | 2.7 |  |
| shadow/sea-3 | critters/shadows/sea-3 | 4.706 | feet |  | 16 | 2.7 |  |
| shadow/sea-4 | critters/shadows/sea-4 | 4.717 | feet |  | 20 | 2.8 |  |
| shadow/sea-5 | critters/shadows/sea-5 | 5.09 | feet |  | 24 | 2.8 |  |
| shadow/sea-6 | critters/shadows/sea-6 | 6.172 | feet |  | 32 | 2.8 |  |

### tool

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tools/bobber | tools/bobber | 5.4 | centre |  | 12 | 4 |  |
| tools/net | tools/net | 5.4 | joint |  | 20 | 7.9 |  |
| tools/rod | tools/rod | 5.4 | joint |  | 12 | 6.4 |  |

### tree

| key | model | scale | anchor | foot | hit | KB | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| trees/bamboo | bamboo | 3 | feet | 2×2 | 31 | 32.3 | winter: trees/bamboo-winter |
| trees/bamboo-winter | trees/bamboo-winter | 3 | feet | 2×2 | 31 | 37.1 |  |
| trees/cedar | cedar | 3 | feet | 2×2 | 32 | 21.9 | winter: trees/cedar-winter |
| trees/cedar-winter | trees/cedar-winter | 3 | feet | 2×2 | 33 | 33.9 |  |
| trees/oak-fall | oak-fall | 3 | feet | 3×2 | 40 | 29.6 | winter: trees/oak-winter |
| trees/oak-spring | oak-spring | 3 | feet | 3×2 | 43 | 36.7 | winter: trees/oak-winter |
| trees/oak-summer | oak-summer | 3 | feet | 3×2 | 40 | 28.7 | winter: trees/oak-winter |
| trees/oak-winter | trees/oak-winter | 3 | feet | 3×2 | 41 | 45.3 |  |
| trees/palm | palm | 3 | feet | 4×3 | 53 | 22.9 | winter: trees/palm-winter |
| trees/palm-winter | trees/palm-winter | 3 | feet | 4×3 | 53 | 36.7 |  |

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
