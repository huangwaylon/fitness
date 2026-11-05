# Closet feasibility: the whole NH player wardrobe (technical artist, 2026-11-05)

**Question:** can the app offer NH-style customization from the dump (clothes, hair, glasses, hats, accessories) with
saved looks? This sweep wore every player-wearable item on one player, through the runtime swap a closet would use.

**Answer: yes.** 4,724 items wear correctly and **none is broken**. Five glasses were flagged by the checks, and all
five sit where they're designed to (below). Placement generalises to **five fixed anchors**, plus one per-hairstyle
table that's only needed for hair ornaments. Packed at the villagers' settings, the whole closet is **about 18 MB**,
of which **one outfit is about 60 KB** on top of a 54 KB body.

**How to reproduce:**
- `python3 -I design/avatar/render/closet-enum.py`, then `node design/avatar/render/closet.ts`. About 5 minutes.
- Data: `meshes.json` (per distinct mesh: packed KB, tris),
  `excluded.json`.
- Thumbnail contact sheets: `sheet-{tops,caphat,capornament,glasses}.webp` (the first 400 of each) and
  `failures-1.webp`. Every category's sheets, and the per-item `results.json`, are regenerated into
  `/tmp/avatar-ta/closet/`.

## 1. Inventory

**Mesh rule:** a texture item's mesh is its name up to the sleeve letter. `TopsTex<Kind><Shape><H|L|N><Name><n>` goes on
`PlayerTops<Kind><Shape><H|L|N>`, and `BottomsTex<Shape><Name><n>` on `PlayerBottoms<Shape>`. Every other item carries
its own `.dae`; its colour variants share one geometry, deduplicated by a hash of the geometry.

| Category (slot) | Items worn | Distinct meshes | Flagged | Packed meshes, KB (median) | WebP textures ≤256 px, KB (median) |
|---|---|---|---|---|---|
| tops + dresses (top) | 2,082 | 40 shapes | 0 | 639 (16.2) | 8,551 (3.2) |
| bottoms (bottom) | 733 | 7 shapes | 0 | 78 (11.3) | 1,339 (1.3) |
| shoes (shoes) | 469 | 86 | 0 | 836 (9.6) | 756 (1.3) |
| socks (socks: texture only, on the body) | 357 | 0 | 0 | — | 473 (0.7) |
| glasses (glasses) | 170 | 44 | 5 (by design) | 287 (6.5) | 141 (0.7) |
| glassmouth: goggles, snorkel, gas mask, nose (glasses) | 24 | 9 | 0 | 83 (9.7) | 23 (0.8) |
| mouth accessories: beard, pacifier, mask (face) | 40 | 23 | 0 | 146 (6.8) | 14 (0.3) |
| CapHat hats (hat) | 421 | 104 | 0 | 819 (7.8) | 1,490 (1.3) |
| CapBangs hoods (hat) | 49 | 12 | 0 | 111 (8.9) | 82 (1.7) |
| CapCostume (hat) | 46 | 12 | 0 | 143 (11.4) | 142 (2.6) |
| CapFullface (hat) | 57 | 17 | 0 | 212 (12.6) | 231 (3.7) |
| CapHelmet (hat) | 23 | 7 | 0 | 96 (14.0) | 96 (2.8) |
| CapMask (hat) | 11 | 7 | 0 | 58 (8.5) | 37 (3.5) |
| CapWig (hat) | 28 | 11 | 0 | 150 (15.4) | 80 (2.6) |
| CapOrnament hair ornaments (hat) | 111 | 45 | 0* | 392 (9.1) | 394 (1.1) |
| bags (bag) | 103 | 46 | 0 | 407 (8.8) | 285 (2.1) |
| **Total** | **4,724** | **470** | **5** | **4,456** | **14,134** |

\* Ornaments wear, but with a stand-in anchor (§3).

**Hair:** 37 hairstyles and 16 PlayerHairCaps, measured separately. Hair24 is about 1.5k tris, so roughly 15 KB packed
each (estimate), about 0.8 MB for all of them.

**Excluded (221 items):**
- 93 underwater variants.
- 67 umbrellas: held props that need a hand anchor; not worn.
- 26 My Design / `3ds` / `Preview` items: they carry `_Crv` (player-made designs), no albedo.
- 23 NPC aprons.
- 10 `Plt` placeholders.
- 2 NPC-only textures with no player mesh.

**Flagged (5), each checked in its thumbnail:** `AccessoryGlassMonocle0-2` (one eye), `AccessoryGlassPilotDoc` and
`AccessoryGlassMirrorGray` (a head mirror and sunglasses up on the forehead). All are off-centre by design. Thumbnails
are in `failures-1.webp`.

**Material quirks the assembler now handles** (`player.js`; these were the sweep's first-pass failures):
- **Albedo base read from the Collada's effects**, not the material name. For example,
  `AccessoryGlassBostonBlackHigh_mAccessory` samples `mAccessory_Alb`.
- **Hair-coloured parts.** `_AlbGry` with no `_Alb` is tinted with the hair colour:
  - beards (`AccessoryMouthBeard*`);
  - a headphone's `mCapHair`;
  - the hair parts of wigs and hoods.
- **See-through parts with no albedo** (`mCapAlpha` visors, some lenses) are drawn as clear tinted glass.

## 2. Runtime architecture and budget

**Shape:**
- **The body is loaded once per page** (54 KB with the 16-eye and 9-mouth atlases; skeleton, skin, face patches).
- **One GLB per distinct mesh:** 40 top shapes, 7 bottom shapes, 37 hairs, 86 shoes, 44 glasses… 470 in all, plus
  hair.
- **One WebP per item:** the albedo with its fabric detail and cavity baked in.
- A part GLB holds only its geometry and the joints it uses. At load it binds to the body's bones by name (and grafts
  its own: skirt, hair, hat flaps). That's what `player.js` `wear(slot, value)` does today.
  - A texture-only swap (another colour of the same top, socks) changes a material's map: one WebP request.
  - A shape swap loads one mesh GLB plus one WebP.
- **Tints cost nothing:** skin, hair colour (also beards and wig hair) and blush are material colours on greyscale or
  white textures.

**Bytes (WebP q80 at ≤256 px, gltfpack meshopt, no normal maps, as the villagers' GLBs):**

| What | KB |
|---|---|
| Body (shared, once) | 54 |
| A's outfit: hair 24 (~15), Aran top shape 13.8 + texture 0.8, slacks shape 11.2 + 0.7, Rubbertoe shoe 9.3 + 1.5, socks 0.2, Circle0 glasses 7.0 + 0.2 | **≈ 60** |
| B's outfit: hair 12 (~15), YshirtsH 11.1 + 0.9, SkirtLong 13.3 + 1.0, shoes 10.8, socks 0.2, bow ~9 | **≈ 61** |
| A typical new item: a texture-only colourway | 0.2–4 (median 1–3) |
| A typical new item: a new shape | 7–16 |
| Every mesh shape in the closet | ~5.3 MB (4.5 MB parts + ~0.8 MB hair) |
| Every item texture | ~14 MB |
| **The whole closet** | **~19 MB** |

**What a phone downloads:**
- **Wearing an outfit** (the island, someone else's player): body 54 KB once per page, plus about 60 KB per person.
  Three people come to about 235 KB, cached by the service worker on first use.
- **Opening the closet:** the item icons only. `static/art/finds/items/<id>.webp` already ships for the catalogued
  clothes; the rest would be ≈ 1–2 KB pre-rendered thumbnails, generated like these sheets.
  - **Previewing an item** fetches its texture (≈ 1–3 KB), plus its shape (≈ 10 KB) if it isn't loaded yet.
  - Paging through 20 tops of a few shapes costs about 60 KB. Nothing is preloaded.
  - With roughly ¼ of the meshes covering most tops (`TopYshirtsL` 248 items, `TopCoatL` 213, `OnepieceOverallL` 193,
    `TopOuterL` 182, `TopTshirtsH` 168), browsing is mostly texture swaps.
- **A curated first closet** (say 200 items over ~30 shapes) is ≈ 0.3 MB of meshes plus 0.4 MB of textures on the
  server. The full 4.7k closet is ≈ 19 MB in `static/`, all lazy.

## 3. Placement: how hats, glasses and ornaments generalise

**The files place almost everything themselves.** Five fixed anchors cover every category, all relative to the body's
`Head` joint (with the body's axes). There are no per-item offsets apart from one override.

| Anchor (head frame, model units) | Used by | Evidence |
|---|---|---|
| **Head joint** (0, 0, 0) | hair, PlayerHairCap, hoods (CapBangs), CapCostume, CapFullface, CapHelmet, CapWig, rigid or skinned | Each covers the head exactly there. Skinned ones bind by joint name (`Head`, their own `Root`). `CapHelmetHeaddress*`'s extra `nw4f_root/Mdl_Root/Body` chain is mapped onto the same frame |
| **Brim** (0, 3.567, −0.281) | every CapHat, rigid or skinned (bandanas, flaps) | The hats' origin is their brim line. `PlayerHair17`'s own `Root` sits exactly there |
| **Face front** (0, 1.85, 3.32) | glasses, glassmouth, mouth accessories, CapMask | Fitted once to `AccessoryGlassCircle0` on the eyes. All 235 then land right (sheets). Not the `Nose00` joint (0.8 too high) and not `Feel` |
| **Crown** (0, 6.3, −0.3) | hair ornaments (CapOrnament), skinned or rigid. **A stand-in** | The game places ornaments per hairstyle and per ornament kind (prefixes `T`, `L`, `F`, `C`, `A`); the files don't say where. The crown works for crowns, flower wreaths and horns. `L` (side) and `T` ribbons need the per-hairstyle table. Exception: `CapOrnamentCHeadsetDoc` uses the head joint |
| HeadAttach / HatAttach / CrownAttach bones | runtime | They ride the head bone, so every pose and the first-person hide work unchanged |

**Hats and hair: yes, a hat needs the hair swap.**
- Every hat leaves the head joint's hair in place, so full hair pokes through most hats.
- NH ships **16 `PlayerHairCap` variants** for exactly that: 03, 05, 07, 08, 09, 10, 12, 14, 19, 20, 24, 25, 29, 30,
  33, 36 (the voluminous styles). They're cut-down hair in the same head-joint frame.
- **Rule (inferred, needs a sample check before shipping):** under a hat, show `PlayerHairCapNN` if it exists. Otherwise
  hide the hair (short styles fit inside the hat).
- `player.js` implements this: `hat` set → `hairCap ?? (hatHidesHair ? none : hair)`. The part table needs a
  `hair → hairCap` column.
- Hoods, full-face helmets and wigs replace the hair entirely.

**Remaining per-hairstyle work:** ornament anchors (5 kinds × 37 hairstyles). Derivable offline by raycasting each
hair mesh from the head's middle in the kind's direction, or by hand for a short list.

## 4. Verdict for the closet design

- **Feasible as specified** (customization.md option B, and even option C).
  - Runtime swap is texture or shape level, with tints for colours.
  - One body per page; about 60 KB per outfit; lazy per-item bytes in the 1–15 KB range.
- **The part table** needs, per item:
  - `{ id, slot, mesh, tex, onepiece?, anchor? }`
  - per hair: `{ hairCap? }`
  - per ornament: a kind.
  - The sweep's `results.json` (regenerated) is a ready source (box, tris, texture KB per id).
- **Out of scope or risky:**
  - Umbrellas (held props).
  - My Design (`_Crv`) items.
  - Ornament placement on non-crown kinds.
  - Cloth physics: skirts, hems, ponytails and hat flaps have joints, but NH drives them by simulation. The animator's
    skirt driver covers sitting and walking; long dresses, capes and wide hats need checking per state.
- **The checks were automatic** (bounds per slot, untextured materials, alpha coverage) plus a visual pass over every
  sheet. Clipping between garments wasn't swept: a long coat over a skirt, a hood over glasses. That needs an
  exclusion table in the closet, as NH has (a dress clears the bottoms; full-face clears glasses and hats).
