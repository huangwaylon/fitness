# Avatar catalog (art scout) — v2

Source dump: `~/Downloads/Model/<Folder>.Nin_NX_NVN/` (untrusted, read-only). Folder names below
omit `.Nin_NX_NVN`. Target: `target.jpg` (A = left/male, B = right/female).

**Look first:** `sheets/outfit-previews.png` — software renders of the picks on the real
`PlayerBody` (T-pose, no eye/mouth decals, flat shading). The B outfit (row 1, right) is very close to the target.

## Sheets (`sheets/`)
| Sheet | What |
|---|---|
| `outfit-previews.png` | A pick, A alt, B pick (front + 3/4), two B alts in a one-piece dress |
| `player-hair-renders.png` | **all 37 hairstyles** rendered on the head, front / 3/4 / back (dark brown) |
| `hair-shortlist-renders.png` | bigger renders of the A and B hair candidates |
| `player-hair-icons.png`, `player-hair-charamake.png` | the game's own silhouette icons for Hair00–36 |
| `player-eye-icons.png`, `player-eye-charamake.png`, `player-pupil-icons.png`, `player-eye-textures.png` | eye shapes 00–25 (outline icons, pupil icons, `mEye_Alb.0` textures) |
| `player-mouth-icons.png`, `player-mouth-textures.png` | mouths 00–03; textures show all 9 expression frames each |
| `player-cheek-nose-face.png` | cheek 00–02, nose 00–02 icons |
| `sweaters.png`, `dresses-shirts.png`, `b-outfit-candidates.png`, `bottoms.png`, `long-skirts.png`, `shoes.png`, `socks.png`, `glasses.png`, `hair-accessories.png` | shortlisted clothing, every colour variant, labelled |
| `palette-clothing.png` | the curated settings-screen clothing palette (below) |

## Rig / file notes for the renderer
- **`PlayerBody`** = whole body incl. head, bind pose, model space (feet y=0, head ~y 7.5–15.3, face front z ≈ +2.5).
  The face is several meshes: `Body__mSkin` (has holes at the face), `Paint__mPaint` (face plate),
  `Body__mEye`, `Body__mMouth`, `Body__mCheek` (decal meshes filling the holes),
  `Nose00/01/02__mNose` (show one), `EarL/EarR__mSkin`, `Body__mSocks` (socks texture goes here).
  Hide the eye/mouth decal meshes and you see straight through the face.
- **Hair** (`PlayerHairNN/PlayerHairNN.dae`) is in head-joint space: translate **(0, 8.957, -0.39)**
  (Skl_Root 4.84 + Spine_2 1.3 + Spine_3 1.25 + Neck 1.19 + Head 0.377 in y; Neck -0.39 in z).
  Needs **back-face culling** (the inner shell of the back hair faces forward and covers the face otherwise).
  Hair00–22: one `Hair__mHair` mesh. Hair23+: `BodyHair__mHair` + `Body__mHairSkin` (fade/shaved skin; tint with skin colour).
  `mHair_AlbGry` is grey, no alpha → multiply by hair colour. Vertex colours are R/G/B region masks (G = hairline band).
  `PlayerHairCapNN` (16 of them) = cut-down versions to wear under hats.
- **Glasses** (`AccessoryGlass*`) are head-local too. I eyeballed offset **(0, 11.2, 2.45)**, looks right in the
  previews but may sit a bit high; please verify against the eye decal. Lenses are the separate
  `AccessoryAlpha1__mAccessoryAlpha` mesh (I hid it; it has an `_OP` opacity map).
- **Tops**: texture folder `TopsTex<Shape><Sleeve><Name><n>` (`mTops_Alb/Mix/Nrm/OP.png`), model
  `PlayerTops<Shape><Sleeve>`. E.g. `TopsTexTopOuterLAran3` → `PlayerTopsTopOuterL`; `TopsTexOnepieceAlineHLinen0` → `PlayerTopsOnepieceAlineH`.
  Sleeve letter: **L** long, **H** half/short, **N** none. One-pieces (`Onepiece*`) replace the bottoms.
- **Bottoms**: `BottomsTex<Shape><Name><n>` → model `PlayerBottoms<Shape>` (`PantsNormal`, `PantsWide`, `PantsHalf`,
  `PantsHot`, `SkirtLong`, `SkirtAline`, `SkirtBox`). Hide `Body__mSoftmesh` (waist filler) if it shows through.
- **Shoes**: each folder has its own dae, body space (`ShoesLowcut*`, `ShoesHighcut*`, `ShoesKnee*`, `ShoesSandal*`).
- **Socks**: texture only (`SocksTex*/mSocks_Alb.png`), on `PlayerBody`'s `Body__mSocks`.
- Tops/bottoms/shoes are body space, no offset. The variant digit = colour (see sheets).
- **Eyes**: `PlayerEyeNN/mEye_Alb.0..15.png` (16 expression frames, .0 = neutral; pupil only, grey → tint with eye colour).
  `PlayerEyeBiteNN` = parallel set. **Mouths**: `PlayerMouth00..03/mMouth_Alb.0..8.png`
  (.0 closed, .1 open smile, .2 big open smile, .3 frown, .4/.5 open, .6 small, .7/.8 "o").
- **Cheeks** `PlayerBody/mCheek_Alb.0/1/2` (0 hard oval, 1 soft, 2 none). **Nose** `mNose_Alb` (orange); Nose00 triangle, 01 dot, 02 square.
- `mSkin_Alb` is near-white → tint with skin colour.
- Regenerating sheets/renders: `tools/` (`render.py` = tiny numpy COLLADA rasteriser, `sheet.py` = PIL contact sheet,
  `mkl.py` = closet-icon lister, `outfit.sh`/`hairs.sh` = the driver scripts). Run with
  `uv run --no-project --with pillow --with numpy python -I tools/render.py …` (`outfit.sh`, `hairs.sh` write to `$OUT`, default `/tmp/avatar-scout`).

## Target feature picks

| Feature | 1st pick | Alternates | Notes |
|---|---|---|---|
| **Hair A** (bowl cut, heavy straight bangs) | `PlayerHair24` | `PlayerHair21`, `PlayerHair32` | 24 = mushroom bowl, bangs down to the brows: closest. Its nape is a skin fade (target has full hair at the back, but it's hidden from the front). 21 = full short round cut, bangs a little higher. 32 = flatter bowl with a buzzed back. |
| **Hair B** (full bangs, side strands, low ponytail) | `PlayerHair12` | `PlayerHair29`, `PlayerHair00` | **No exact match.** 12 = low ponytail at the nape + side-swept bangs (looks right in the preview). 29 = face-framing strands + low pony, open forehead. 00 = blunt full bangs + strands, but a top bun. Closest would be a kit-bash: Hair00's front with Hair12's pony. |
| **Hair colour** | dark brown `#3b2619` | lit brown `#4a2e1e`, near-black `#2a1b12` | sampled from the target. The hair texture is greyscale, so any colour works. |
| **Eyes A** | `PlayerEye02` | `PlayerEye03`, `PlayerEye00` | big plain oval, no lashes |
| **Eyes B** | `PlayerEye22` | `PlayerEye16`, `PlayerEye15` | round with outer-corner lashes |
| Eye colour | brown `#5a3a28` | black `#2b2018` | |
| **Mouth A** | `PlayerMouth01` frame `.0` | `PlayerMouth00` `.0` | wide closed smile |
| **Mouth B** | `PlayerMouth01` frame `.1` | `PlayerMouth00` `.1`, `PlayerMouth01` `.2` | open happy smile |
| Nose | `Nose00` (orange triangle) | | both |
| **Skin tone** | light peach `#f6cfa8` | `#f3c7a0` | both |
| **Blush** | `mCheek_Alb.1` (soft) | `.0` | both |
| **Glasses (A)** | `AccessoryGlassCircle0` (thin dark-grey round) | `AccessoryGlassOctagon4` (thin dark), `AccessoryGlassThurmont0` | Circle0 = the target's wire round frames. Circle3 is the brown version. |
| **Sweater (A)** | `TopsTexTopOuterLAran3` (forest green cable knit) | `TopsTexTopOuterLSweat1` (green crew sweatshirt), `TopsTexTopOuterLKnit` variants | model `PlayerTopsTopOuterL`. Aran is the cable knit; variant 3 is the green. |
| **Trousers (A)** | `BottomsTexPantsNormalSlacks0` (charcoal) | `BottomsTexPantsNormalDenim3` (black denim), `BottomsTexPantsNormalCropped0` (black) | model `PlayerBottomsPantsNormal`. Slacks0 has a tan belt that the sweater covers. |
| **B top + skirt** | `TopsTexTopYshirtsHPolo7` (black short-sleeve collared, buttons) + `BottomsTexSkirtLongDenim3` (black long skirt) | skirt: `BottomsTexSkirtLongMaone1` (charcoal), `BottomsTexSkirtLongPleats4` (grey, could be tinted) | models `PlayerTopsTopYshirtsH` + `PlayerBottomsSkirtLong`. Matches the target well. |
| **B one-piece alt** | `TopsTexOnepieceAlineHLinen0` (black short-sleeve A-line dress) | `TopsTexOnepieceBalloonHLace7` (black lace, too fancy) | model `PlayerTopsOnepieceAlineH`. No collar, knee length. **Gap:** no black collared short-sleeve shirt-dress exists (`OnepieceAlineNShirt` is the shirt-dress shape but has no black variant and no sleeves). |
| **Sneakers** | `ShoesLowcutRubbertoe7` (black canvas, white sole + toe cap) | `ShoesHighcutRubbertoe7` (black high-top), `ShoesLowcutSuede1` (navy retro runner, white stripe) | the target's side stripe is closest on Suede, but the colours are closest on Rubbertoe7 |
| Socks | `SocksTexDailysocks1` (black) | `SocksTexFootcover6` (black no-show), `SocksTexDailysocks5` (white) | barely visible in the target |
| **Scrunchie (B)** | none | `CapOrnamentLRibbon7` (small black bow) as a stand-in | **Gap:** NH has no hair-tie item; ties are baked into the hair meshes. A small black crumpled torus at the pony base would have to be custom. |
| **Earring (B)** | none | | **Gap:** NH has no earring category. Would need a tiny custom gold hoop (torus) on `EarL__mSkin`. |

## Curated customization palette (settings screen)

Cozy / everyday / cute, kept small. All names are folder names; `n` = colour variant.

**Hairstyles (12):** `PlayerHair24` bowl, `PlayerHair21` short round, `PlayerHair17` boyish fringe,
`PlayerHair08` side-swept, `PlayerHair09` shaggy short, `PlayerHair28` short crop,
`PlayerHair12` low ponytail, `PlayerHair29` strands + pony, `PlayerHair00` bun + bangs,
`PlayerHair05` bob with bangs, `PlayerHair11` long straight with bangs, `PlayerHair16` pigtails.
(Also nice: `PlayerHair15` messy bun, `PlayerHair03` flippy short.)

**Hair colours (8):** near-black `#2a1b12`, dark brown `#3b2619`, chestnut `#6b4129`,
light brown `#9a6a43`, honey `#c79a5b`, ash grey `#8d8a86`, auburn `#7a3324`, soft pink `#d99aa5`.

**Eyes (8):** `PlayerEye00`, `02`, `03`, `08` (lidded), `14` (top lashes), `16`, `22`, `24`.
Eye colours: brown `#5a3a28`, black `#2b2018`, hazel `#7a5a2e`, blue-grey `#4f6378`.

**Mouths (4):** `PlayerMouth00`, `01`, `02`, `03` (all of them; expressions come from the frames).

**Skin tones (6):** `#f9dcc0`, `#f6cfa8`, `#e8b48a`, `#c98e62`, `#9a6440`, `#6b432b`.
Blush: soft (`mCheek_Alb.1`), hard (`.0`), none (`.2`).

**Tops (12):** `TopsTexTopOuterLAran3` green cable, `TopsTexTopOuterLAran1` cream cable,
`TopsTexTopOuterLSweat1` green sweatshirt, `TopsTexTopOuterLArancardigan0` tan cardigan,
`TopsTexTopTshirtsLVnecksweater2` black V-neck, `TopsTexTopYshirtsHPolo7` black polo,
`TopsTexTopYshirtsHStandard0` white shirt, `TopsTexTopTshirtsHPocketshirts0` white tee,
`TopsTexOnepieceAlineHLinen0` black dress, `TopsTexOnepieceAlineHLinen3` cream dress,
`TopsTexOnepieceBoxLShirt1` beige shirt-dress, `TopsTexOnepieceBalloonHDolly0` pink dolly dress.

**Bottoms (10):** `BottomsTexPantsNormalSlacks0` charcoal, `BottomsTexPantsNormalSlacks6` pale,
`BottomsTexPantsNormalChino0` beige, `BottomsTexPantsNormalDenim0` blue denim,
`BottomsTexPantsNormalSweat0` lilac sweats, `BottomsTexPantsWideChino1` beige cropped wide,
`BottomsTexSkirtLongDenim3` black long, `BottomsTexSkirtLongPleats4` grey pleated,
`BottomsTexSkirtLongChino0` beige long, `BottomsTexSkirtAlineFlare1` black short flare.

**Shoes (7):** `ShoesLowcutRubbertoe7` black canvas, `ShoesHighcutRubbertoe7` black high-top,
`ShoesHighcutRubbertoe0` navy high-top, `ShoesLowcutLeathersneker0` white,
`ShoesLowcutSlipon6` cream slip-on, `ShoesLowcutLoafers1` black loafer, `ShoesLowcutSuede1` blue runner.

**Socks (4):** `SocksTexDailysocks1` black, `SocksTexDailysocks5` white, `SocksTexLine0` sporty stripe, `SocksTexFootcover6` no-show.

**Glasses & accessories (10):** `AccessoryGlassCircle0`, `AccessoryGlassCircle3` (brown),
`AccessoryGlassOval6`, `AccessoryGlassThurmont0`, `AccessoryGlassOctagon4`, `AccessoryGlassSquare1`,
`CapOrnamentLRibbon7` black bow, `CapOrnamentLHearthairpin0` heart pin, `CapHatBeret5` cream beret, `CapHatKnitcap0` charcoal beanie
(hats need the matching `PlayerHairCapNN` where one exists).
