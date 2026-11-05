# NH player kit: tech notes (technical artist, 2026-11-05)

What's in the dump (`~/Downloads/Model/<Name>.Nin_NX_NVN/`, Collada + PNG), how it goes together, and the harness
that assembles it (`render/`). Everything here was read off the files or checked in renders; guesses are marked.

## Verdict

The player kit can be assembled. One body, one skeleton, and every hair, top, bottom and shoe binds to it by joint
name. Eyes and mouths are texture swaps. Skin and hair colours are tints. A and B come out recognisably NH, with
a few gaps (see the end).

## The body: `PlayerBody`

- **Meshes** (`PlayerBody.dae`), one material each. Triangles in brackets.
  - `Body__mSkin` (1848): the body. Its skin is white in the albedo and its grey underwear is its own colour.
  - `EarL__mSkin`, `EarR__mSkin` (77 each).
  - `Body__mSocks` (1148): the legs from the ankle to the thigh, and the feet. The sock texture goes here.
  - Three **face patches**. These are the face itself: there is no skin under them, so they must be opaque.
    - `Body__mEye` (78): the upper face.
    - `Body__mMouth` (50): the mouth area.
    - `Body__mCheek` (80): the cheeks.
  - `Nose00/01/02__mNose` (26 / 108 / 142): the three nose shapes. Show one.
  - `Paint__mPaint` (140): face paint, a grey placeholder. Hidden.
- **Skeleton: 46 joints.**
  - The chain: `nw4f_root > Mdl_Root > Root > Trans_Root > Skl_Root > Spine_1 > Spine_2 > Spine_3 > Neck > Head`.
  - Arms: `Clavicle_L/R > Arm_1_* > Arm_1_*_Sub, Arm_2_* > Wrist_*, Hand_*, Wrist_*_Sub`.
  - Legs: `Waist > Leg_1_* > Leg_1_*_Sub, Leg_2_* > Leg_2_*_Sub, Ankle_* > Toe_*`.
  - Extras:
    - `Head > Feel`: a face locator, at y 12.15, near the eyes' height. It is not the glasses' anchor (see below).
    - `Bag`, `z_Bag`: bags.
    - `Item`: under `Root`, at the origin.
    - `EarL`, `EarR`, `Nose00-02`: rigid joints for those meshes.
  - The bind pose is a T-pose. Bones point along their local +x (the Head's world quaternion is about (0.48, 0.52,
    0.5, 0.5)).
- **Size.** About 15.3 model units to the top of the bald head; 15.4–16.1 with hair.
  - Head joint at y 8.96 (z −0.39).
  - Eyes' centre ≈ (0, 12.2, 1.5). Face front z ≈ 2.4.
  - A villager is 12.5–14.9 units, so a player is a little taller than goldie, with a bigger head.
- **`rig.body`** (from `villager3d/rig.ts` `rigOf` on the player, all units):

  | thigh (Leg_1→Leg_2) | shin (Leg_2→Ankle) | hip (Leg_1's y) |
  |---|---|---|
  | 2.59 | 1.60 | 4.98 |

### Rig mapping onto the app's villager rig

- **Same names, no remap table.** NH uses one skeleton family for villagers and players. A villager's (`NpcNmlCat*`)
  45 joints are the same as the player's, apart from the ears and tail.
- **19 of `poses.ts` `JOINTS` exist on the player:** `Spine_1-3`, `Neck`, `Head`, `Clavicle_L/R`, `Arm_1_L/R`,
  `Arm_2_L/R`, `Hand_L/R`, `Leg_1_L/R`, `Leg_2_L/R`, `Ankle_L/R`.
- **Absent:** `TailRoot`, `Tail_1`, `Side_Ear_1_*`, `Mouth`, `Mouth_U`, `Crest_*`. `rigOf` already skips missing joints.
- **Checked:**
  - `rigOf(body)` plus `poses.ts` `idle(0)` and `sitOn(...)` work unchanged on the assembled player. The renders use
    them.
  - `ARMS` (1.22 from the T) gives arms by the sides.
- **Not yet checked:**
  - Walk stride and bob, and lie/prone.
  - The player's longer thigh (2.59) for `seatOf` and `seats3d.json`. Expect a per-kind tuning table, as the design
    notes say.
- **Garments add their own joints** (they're grafted under their parent, by name):
  - Skirts: `Skirt_{1,2,3}_{L,R}{F,C,B}`.
  - A hem: `Skirt_1_*` on `PlayerTopsTop*`.
  - Hair: `Bangs_*`, `Hair_1-3`, `Z_*`.
- **NH moves the garment joints by cloth physics, and there are no clips.** For sitting, `studio.js` `skirtSit` lays
  them over the thighs procedurally. An animator needs the same for walking: a lag, a sway.

### Faces: same scheme as the villagers, different cell meanings

- `PlayerEyeNN` (26 eye types) and `PlayerMouthNN` (4 mouth types) hold **only textures, no .dae**.
  - Eyes: `mEye_Alb.0-15.png` (256×128) and `mEye_Mix.*`.
  - Mouths: `mMouth_Alb.0-8.png` (128×128) and `mMouth_Mix.*`.
- They go on the body's `mEye` / `mMouth` patches.
- **Compositing** (`player.js` `faceMat`):
  - Where `_Mix`'s red is 1, it's skin (the skin colour).
  - Where it's 0, it's the albedo's RGB (the outline, the sclera, the dark iris).
  - The eye albedo's alpha shades the sclera and pupil. It's used to tint the iris (`eyeColor`).
  - The sclera is light grey in the file. It's lifted toward white (`scleraLift`, a judgement call: NH shows it
    white).
- **Expression cells**, read off `PlayerEye22` and `PlayerMouth01`. These **differ from `faces.ts`'s villager cells**,
  so they need a per-kind table.
  - **Eyes:** 0 open, 1 half-lidded, 2 closed (blink, asleep), 3 cross, 4 worried/sad, 5 happy (^ ^),
    6 surprised (O O), 7 squeezed (> <), 8 open (alt), 9 narrowed, 10 glance, 11 low-lidded, 12 open up, 13 half,
    14 worried, 15 squint.
  - **Mouths:** 0 gentle smile (rest), 1 open smile, 2 big open smile, 3 frown, 4 open frown, 5 big open frown,
    6 flat, 7 small "o", 8 open "o".
  - **Suggested `FACES` for players:**

    | neutral | happy | joy | surprised | sad | sleepy | cross | sting | blink |
    |---|---|---|---|---|---|---|---|---|
    | [0, 0] | [5, 1] | [7, 2] | [6, 8] | [4, 4] | [2, 6] | [3, 3] | [15, 4] | eye 2 |

- **Cheeks** (`mCheek_Alb.0-2`): a blush shape. Black means blush and white means skin. `_Mix` is flat.
- **Nose:** a fixed orange `mNose_Alb`.

## How the parts bind

| Part | Files | Binding |
|---|---|---|
| Hair | `PlayerHair00-36/PlayerHairNN.dae` + `mHair_AlbGry/_Mix/_Nrm` | Skinned, but in **head space**: its `Root` (and `Head`) is the head joint, with the body's axes. The harness adds a `HeadAttach` bone under `Head`, with the head's rest rotation undone, and grafts the hair's `Root` under it. `Bangs_*` and `Hair_*` joints can be animated. Hair23+ add a `Body__mHairSkin` mesh (a shaved nape or sides), tinted with the skin colour |
| Hair under hats | `PlayerHairCap03…36` (16) | Cut-down hair to wear under a hat. Only `Root`, head space as above |
| Tops | `PlayerTops<Kind><Shape><H\|L\|N>` (mesh only) + `TopsTex<Kind><Shape><H\|L\|N><Name><n>` (`mTops_Alb/_Mix/_Nrm/_OP`) | Body space. Skinned to the body's joints by name, plus a `Skirt_1_*` hem. **Texture → mesh:** the texture's name prefix up to the sleeve letter is the mesh: `TopsTexTopOuterLAran3` → `PlayerTopsTopOuterL`. H/L/N = half/long/no sleeves. `Onepiece*` (dresses) replace the bottoms. `*mydesign*`, `*3ds*` and `*Preview` meshes are the custom-design variants |
| Bottoms | `PlayerBottoms{PantsHalf,PantsHot,PantsNormal,PantsWide,SkirtAline,SkirtBox,SkirtLong}` + `BottomsTex<Shape><Name><n>` | Body space, the same way (`BottomsTexSkirtLongDenim3` → `PlayerBottomsSkirtLong`) |
| Shoes | `Shoes<Lowcut\|Highcut\|Knee\|Sandal><Name><n>` (each its own .dae + `mShoes_*`) | Body space, the leg and toe joints |
| Socks | `SocksTex<Name><n>` (`mSocks_Alb/_Mix/_Nrm`) | Texture only, on the body's `mSocks`. With no socks, the body's `mSocks_AlbOry` × the skin colour (bare legs) |
| Glasses | `AccessoryGlass<Name><n>` (`mAccessory` frame, `mAccessoryAlpha` lens with `_OP`). `*UnderWater` variants exist | Rigid, one `Root` joint. **Where it sits isn't in the files.** In head space it would sit at the chin (y −0.2…1.9, z −0.65…0). The harness fits it to the eyes: centred on the `mEye` patch, lenses at the face front (`glassesY`, `glassesZ` to adjust). `Feel` doesn't fit either. The scout eyeballed (0, 11.2, 2.45) world, which agrees |
| Hair ornaments, hats | `CapOrnament*`, `CapHat*`, `CapBangs*`… (`mCap_*`) | Rigid, one `Root`. Head space, but the placement is per hairstyle in the game and not in the files. The ornament meshes lie flat (made for the top of the head). Placed by hand (`extra[].at/turn/scale`) |

### Texture conventions (players)

- **`_Alb`, cloth** (tops, bottoms, shoes, socks):
  - RGB is the colour. It's often flat: Aran3 is a plain green.
  - **Alpha is a fabric-detail luminance**: the cables, the weave. 0.5 means neutral.
- **`_Mix`, cloth:**
  - R ≈ 0.
  - **G = the weave's cavities.** It holds the cable pattern; plain areas are white.
  - B ≈ flat 0.6. Not occlusion here (unlike the villagers').
- **`_Mix`, skin and face** (`mSkin`, `mEye`, `mMouth`): **red = the skin-tint mask.**
- **`_Nrm`:** two-channel (x in R, y in G, BC5); rebuild z.
- **`_OP`:** green is the cutout.
- **`mHair_AlbGry`:** near-white greyscale, multiplied by the hair colour. `mHair_Mix` R is shading, G a hairline band,
  B an anisotropic highlight stripe.
- **So skin, hair and blush colours cost no bytes:** they're tints. The harness bakes them into the texture. A runtime
  version would keep them as material colours or uniforms.

## The harness: `app/design/avatar/render/`

| File | What |
|---|---|
| `player.js` | **The assembler module (browser, three.js).** `loadPlayer(outfit, files[, base])` → `{ root, body, bones, rig, out, setFace(eyeFrame, mouthFrame), eyes(), outfit }`. `rig` is the app's `rig.ts` on the player: `rig.apply(pose)` takes `poses.ts` poses. `setFace` swaps the eye and mouth frames (async; each frame is made once, then cached). Also exports `boxOf`, `normalMaps(on)` |
| `studio.js` | Renderer (1024 px), NH-like soft light (hemisphere + warm key with soft shadow + cool fill + rim, no tone mapping), pastel ground, `shot()` framing, `standing()` (`idle(0)`), `seated()` (`sitOn` + `skirtSit`), `bench()` |
| `harness.ts` | **The Node half as a module.** `openHarness({ page? })` → `{ page, call, filesFor(outfit), copy, save, close }`. It copies only the needed folders' .dae/.png into `/tmp/avatar-ta/scratch`. It serves `/player.js`, `/studio.js`, three.js, `/v3d/*.ts` (the app's `villager3d`, type-stripped) and `/page.js` (yours, or the default) |
| `render.ts` | CLI (below) |
| `page.js` | The default page: `renderOne`, `renderPair`, `sheet`, `compare`, `exportOne` (GLB), `inspect`, `avg`, `debug` |
| `outfits/*.json` | Outfit specs: `a`, `b`, `b-hair00`, `b-hair29`, `b-linen` |

**Outfit spec:**

```json
{ "name": "a", "skin": "#f6cfa8", "hair": "PlayerHair24", "hairColor": "#2f241d",
  "eye": "PlayerEye02", "eyeFrame": 0, "eyeColor": "#3d2416", "mouth": "PlayerMouth01", "mouthFrame": 0,
  "nose": 0, "cheek": 1, "blush": "#f3958a", "blushK": 0.6,
  "top": { "mesh": "PlayerTopsTopOuterL", "tex": "TopsTexTopOuterLAran3", "onepiece": false, "detail": 1 },
  "bottom": { "mesh": "PlayerBottomsPantsNormal", "tex": "BottomsTexPantsNormalSlacks0" },
  "shoes": "ShoesLowcutRubbertoe7", "socks": "SocksTexDailysocks1", "glasses": "AccessoryGlassCircle0",
  "hairCap": null, "extra": [{ "folder": "CapOrnamentLRibbon7", "rigid": true, "at": [0, 0.6, -3.75], "turn": [1.45, 0, 0], "scale": 0.75 }] }
```

**For the animator.** Write your own page module, which imports `/player.js` (and `/studio.js` if you want the
lighting). Then:

```ts
import { openHarness } from '../render/harness.ts';
const h = await openHarness({ page: '/abs/path/anim-page.js' });
const files = h.filesFor(outfit);
await h.call('yourFn', outfit, files);
```

In the page:

```js
const p = await loadPlayer(outfit, files);
p.rig.apply(walk(t, ...));
await p.setFace(5, 1);
```

**CLI** (from `app/`; `NH_MODELS` defaults to `~/Downloads/Model`):

- `node design/avatar/render/render.ts design/avatar/render/outfits/a.json design/avatar/render/outfits/b.json`
  writes, to `renders/`:
  - `<name>-{front,34,back,face,seated}.png`
  - `pair-{front,seated}.png`
- `--glb a.json`: also packs a GLB to `/tmp/avatar-ta/glb/` and prints KB and tris. The pack is WebP ≤ 256 px, 16-eye
  and 9-mouth atlases, gltfpack meshopt, no normal maps, the same as `scripts/villagers3d-models.ts`.
- `--sheet base.json key v1 v2 … [--view=face|front|34]`: a grid in `/tmp/avatar-ta/sheets/`.
- `--compare out.png r1.png …`: the target beside renders.
- `--inspect Folder/file.png`: the channels, written to `/tmp`.
- `--avg Folder…`: mean albedo colours (for finding a colourway).

## Size (packed as the villagers' GLBs are)

| | KB | tris | draw calls |
|---|---|---|---|
| A (everything, one GLB) | 112.3 | 8,212 | 15 primitives |
| B | 103.9 | 7,498 | 14 |
| Body alone (skin, legs, face patches with atlases, ears, nose) | 54.3 | 3,384 | |
| → A's parts (hair 1.5k, top 1.1k, pants 0.8k, shoes 0.8k, glasses 0.7k) | ≈ 58 | ≈ 4.8k | |

- **Geometry dominates.** All textures together are about 12 KB of WebP at 256 px.
- **Over the design's ≤ 100 KB and 5–6k tris per avatar if packed whole. Within budget if the body is shared once per
  page:** 54 KB + ~50–58 KB per outfit.
- **Ways to save:**
  - Merge the three `mSkin` primitives.
  - Cut leg and arm triangles hidden by clothing.
  - `gltfpack -si` on the body (1.8k skin + 1.1k legs).
  - Draw calls can drop to about 8 if the face patches and the body share one atlas.

## Gaps (honest)

- **No scrunchie.** NH has no hair-tie item; ties are baked into the hair meshes. Stand-in: `CapOrnamentLRibbon7`
  (a black bow), placed by hand behind the pony.
- **No earrings at all** in NH: there's no ear-accessory slot or mesh.
- **B's hair:** there's no low side ponytail with full bangs.
  - `Hair12` has a low centre pony with side-swept bangs.
  - `Hair00` has blunt bangs but a top bun.
  - `Hair29` has strands and a pony, with an open forehead.
  - A kit-bash (Hair00's front with Hair12's pony) is possible: both are skinned meshes in head space. It would be
    custom mesh work.
- **B's top:** `TopYshirtsHPolo7` is a black short-sleeve polo with buttons, but the collar barely reads.
  - The alternative `OnepieceAlineHLinen0` is a black dress, but knee-length.
  - The black long skirt is black denim (`SkirtLongDenim3`).
- **A's sweater:** a real NH cable knit (Aran, green). The cables are in the normal map and `_Mix`, so they read
  subtly at render scale. They're nothing like the target's soft, fuzzy render.
- **A's hair:** `Hair24` is the closest bowl. Its bangs are shorter and smoother than the target's, and it has a
  skin-fade nape.
- **Shoes:** `ShoesLowcutRubbertoe7` is black with a white sole, but has no side stripes.
- **Glasses placement is fitted, not from the files.** The NH frame is thicker than the target's wire.
- **Not reproduced:** NH's real shader (rim light, toon ramp, eye highlights) and hair/cloth physics. The renders use
  three's standard material with soft light, so they're flatter than NH in-game. The target is a stylised render
  anyway.
