# Player avatars: design (game designer, rev. 2, 2026-11-05)

Replace each person's NH *villager* avatar with an NH *human player* (`target.jpg`), with an NH-style closet and
saved looks in せってい. The asset side is the tech artist's and the art scout's: `tech-notes.md` (the kit assembles:
one body, one skeleton, parts bound by joint name, faces as texture swaps, colours as tints) and `catalog.md` (the
picks, a curated palette).

**Signed off (the user, 2026-11-05): the default looks.** These are the starting point for each person and the one
tap back.
- **A:** the render as it stands: `render/outfits/a.json`. Hair24, Eye02, round glasses Circle0, Aran3 green cable
  knit, Slacks0, Rubbertoe7 sneakers.
- **B:** `PlayerHair12`, the polo (`TopYshirtsHPolo7`), the long black skirt (`SkirtLongDenim3`), and the bow
  `CapOrnamentLRibbon7` standing in for the scrunchie. No earring (NH has none).

**Revision 2:**
- A broad NH-style closet: every player garment that renders correctly, browsed by category and colour variant.
- One tap back to the default look.
- Saved looks per person (コーデ).

**Decided (the user, 2026-11-05): all clothing is free and fully customizable.**
- Every closet item is open to everyone, the guest included, from the start.
- Clothes are not tied to ベル or かいがら, the shop, presents or fitness rewards.
- No ownership model: a saved look can never hold an item someone can't wear.
- decisions.md's "the shop sells no clothing" stays true. The shop and the ずかん's clothing presents are unchanged.

---

## 1. Where an avatar appears today, and what changes

Today "my avatar" means a roster villager: `prefs.villager`, resolved by `lib/villagers/look.ts` `resolveLook`. The
defaults are goldie (A), anchovy (B) and judy (the guest). It is drawn in two ways:

- **3D:** `components/villager3d/villager3d.ts`. GLBs live in `static/room/villagers3d/<id>.glb`. All 417 are listed
  in `villagers.json`: at most 96.9 KB, median 69 KB, at most 5,000 tris.
- **2D:** the official head icon (`characters/Avatar.svelte` → `Villager.svelte`, `art.ts` `villagerArt`).

| Where | How it's drawn | Files | Human-player impact |
|---|---|---|---|
| Island: mine, the partner's, the third (the guest's) | 3D model; a render card until it loads | `world3d/villagers.ts`, `island/IslandScene.svelte` (DOM tap box ~l.1170), `island/avatar.ts`, `motion/director.svelte.ts` | Swap the model; every state and action must work: idle, walk, sit, lie, nap, doze, prone, hop, wave, highfive, surprise, sting; fishing rod and net; the birthday hat and party glasses on the head joint |
| Tent, homes | Same 3D (`url3d`) | `tent/TentRoom.svelte`, `villager3d/seats3d.*` | Sitting on `seats3d.json` anchors uses `rig.body` (thigh, shin, hips); the player's proportions differ. A long skirt (B) seated is a clipping risk |
| Museum | Same 3D | `museum/MuseumRoom.svelte` | As the tent |
| First person | `villager3d eyes()` from the eye mesh; body hidden near the head | `rooms/firstPerson.ts`, `store/firstPerson.svelte.ts` | The player model needs an eye anchor; A's glasses must hide with the body |
| Edge chip 「うめの ほうへ」 | 2D head | `IslandScene.svelte` ~l.1180 | Needs a player head icon |
| 2D heads in lists | `<Avatar>` chips (yuzu A, mint B, lilac G) | `kiroku/BellsLog.svelte`, `kiroku/DayDetail.svelte`, `kiroku/Zukan.svelte`, `museum/MuseumCard.svelte` (finder), `health/Pick.svelte` (けんこう's whose-data select), `panel/SyncSection.svelte`, `wallet/Purchases.svelte`, `sheets/HarvestOverlay.svelte`, `ui/Toast.svelte`, `board/posts.svelte.ts` (note author), `food/FoodCustom.svelte`, `food/FoodRecipe.svelte`, `panel/SettingsSheet.svelte` | ~14 call sites, all through `Avatar.svelte`, so one change point. The player head is a generated portrait (§5) |
| Guest | Same paths; its own `villager`/`villagerName` prefs; arrives at the beach | `contract/guest.ts` `GUEST_PREF_KEYS`, `ui-state/cast.ts` | The guest chooses its own avatar (memory rule). Its look is its own pref, as today |
| Visitors | The visitor meets the partner's avatar | `island/Visitor.svelte`, `island/visitorLife.ts`, `avatar.ts` `meetVisitor` | Visitors stay NH villagers. No change beyond the partner's model |
| Host | しずえ, or たぬきち if someone picked しずえ | `look.ts` `hostOf` | Only matters if the villager option stays |
| Homes | いえを かえる already offers "NH's player house" | design.md "The island's layout" | A natural fit: humans live in player houses |

**The recommendation: human players by default for A and B. The villager look stays as a secondary option**
(「むらびとの すがた」), for the members and the guest.

- **Why keep villagers:** the 417 models, the picker (`panel/VillagerPicker.svelte`) and their faces already work, so
  keeping them costs little *if* the player model fits the same `Villager3D` interface. It is also the safe fallback
  while the player models are incomplete, and the guest may well prefer to be a villager.
- **What a human player looks like in code:** one more character *kind* behind `Villager3D`
  (`createPlayer(look)` next to `createVillager(id)`). The scene, director, seats, first person and faces code don't
  care which kind it is.
- **When to drop villagers:** only if the user says they never want them. Then `VillagerPicker` and the 2D roster
  icons for players go away, saving a little bundle size, but nothing on the island, since visitors still need the
  roster.

## 2. Customization scope: an NH-style closet

**What the dump holds.** Counted from `~/Downloads/Model` folder names, leaving out `mydesign`, `3ds`, `Preview` and
`UnderWater` folders:

| Category | Base items | Colour variants | Meshes (one per shape) | In v1? |
|---|---|---|---|---|
| トップス + ワンピース (`TopsTex*`) | 559 | 2,102 | 44 shapes (`PlayerTops*`) | yes |
| ボトムス (`BottomsTex*`) | 153 | 738 | 7 shapes | yes |
| くつ (`Shoes*`) | 91 | 469 | one .dae a folder; dedupe by hash, expect ~91 | yes |
| くつした (`SocksTex*`) | 62 | 357 | none: a texture on the body's `mSocks` | yes |
| めがね (`AccessoryGlass*`) | 56 | 194 | ~56 | yes |
| かみかざり (`CapOrnament*`) | 35 | 111 | ~35 | yes. Its placement is per hairstyle (below) |
| ぼうし (`CapHat*`) | 125 | 421 | ~125 | later: only 16 hairstyles have `PlayerHairCap` versions |
| かみがた / かみのいろ / め / くち / はだ / ほお | 37 hairs (the folders hold 53 incl. variants), any colour, 26 eyes, 4 mouths, any tone, 3 blushes | – | – | yes, free |

**Not in the closet:** `CapFullface`, `CapHelmet`, `CapCostume`, `CapWig`, `CapMask`, `AccessoryMouth*` and the
custom-design shapes. These are costume pieces with extra fitting work.

- **"Renders correctly" is a gate, per shape.**
  - Every variant of a shape uses the same mesh, so QA is per shape: about 44 + 7 + 91 + 56 + 35. Render each shape on
    both bodies (standing, seated, walking) with the harness (`render/render.ts --sheet`).
  - A shape that clips or breaks is left out with all its variants.
  - The kept list becomes the **part table** (§4).
  - Spot-check variants for odd textures (an `_OP` cutout, a missing map).
- **Wear rules, as NH:**
  - A ワンピース clears ボトムス, and a bottom clears a ワンピース.
  - Socks show under what the bottoms leave.
  - Glasses and a hair ornament are both allowed at once.
  - Hats (later) swap the hair for its `PlayerHairCap` version, or hide the hair where none exists.
- **Hair ornaments:** their placement isn't in the files. Fit each one once per hairstyle group (top, back, side
  anchors per hairstyle, ~37 × 3 hand fits), not per ornament × hairstyle.
- **Appearance:** expose everything; it's cheap (textures and tints).
  - All 26 eye shapes, 4 mouths and 37 hairstyles.
  - Hair colour: NH's palette as swatches, plus the scout's 8.
  - Skin tones and blush.
- **Economy: none.** All of the closet is free for everyone from day one (the user's decision). No shop line, no
  unlocks, no rewards. The ずかん's clothing presents stay collectibles only.

## 3. Settings UX: すがた

> **Superseded in layout (2026-11-05):** すがた is now one dresser (stage, six tabs, the villager picker as the むらびと
> tab, one commit model): [sugata-ux.md](sugata-ux.md) and docs/design.md "すがた". What follows is the first level's design.

**The せってい row:**
- The first section, today's むらびと (`panel/SettingsSheet.svelte`), becomes **すがた**.
- The row: a portrait chip, the よびな, and **かえる**.
- The guest gets the same row.

**かえる pushes the すがた level.** It has a pinned head, as VillagerPicker does, with the closet scrolling under it:

1. **The preview**, ~40% of the height:
   - the live 3D player, idling and blinking;
   - a horizontal drag turns it, and a tap hops it and plays an expression;
   - the よびな field beside it;
   - **もどす** (undo this visit's changes), shown only after a change.
2. **The コーデ strip**, one horizontal row of portrait chips (60 px, with names under them):
   - **「いつもの」 always comes first.** It's the signed-off default look, marked with a ★. One tap wears it. This
     replaces もとに もどす. It can't be overwritten or deleted.
   - Then the saved looks, newest first. A tap wears it in the preview.
   - Then **「＋ ほぞん」**: it saves the current look as a new コーデ and asks for a name (default 「コーデ 3」,
     ≤ 12 characters). At the cap (20) it says 「いっぱいだよ」.
   - The chip being worn has a ⋯. It opens a small card (not a long press: iOS Safari's long press brings up its own
     callout):
     - **うわがき** (overwrite with the current look);
     - **なまえを かえる** (rename);
     - **けす** (delete), with an NH-style confirm, 「この コーデを けしますか？」, and とりけす for 5 s after.
3. **The category chips:** one row, ≥ 44 px, `roving`:
   - かお (め, くち, はだ, ほお)
   - かみ (かみがた, then かみのいろ swatches)
   - トップス
   - ボトムス
   - ワンピース
   - くつした
   - くつ
   - こもの (めがね, かみかざり)
4. **The grid** for a garment category, NH's wardrobe way:
   - **Tiles:** one tile per base item. A tile shows its icon in the variant last chosen.
   - **Choosing:** a tap wears it, and a row of colour dots slides open under that tile row (the item's variants).
     A dot swaps only the texture (§5), so the swap is instant once the dot's texture is cached.
   - **Colour filter:** a row above the grid (すべて · あか · きいろ · みどり · あお · むらさき · ピンク · ちゃ ·
     しろ · くろ). Each variant gets a hue bucket, worked out at build from its mean albedo (`--avg`).
   - **No search.** NH's wardrobe has none, and these items have no names unless they're mapped to the catalogue.
   - The grid is built a slice per frame, and icons load as they near the view (VillagerPicker's IntersectionObserver).
   - Every item shows for everyone. There are no locks.
5. **The foot:** **「むらびとの すがたに する」** pushes the existing VillagerPicker. The villager look is still the
   option from §1.

**Saving:**
- Wearing and editing change only the preview. The current look is sent once, as a single `look` pref, when you
  leave the level (‹, ✕, Esc or backdrop).
- コーデ edits (save, overwrite, rename, delete) are sent when they're made, as one `savedLooks` pref.
- For the guest and for both members, everything is per person.

**Phone notes:**
- The preview's WebGL renderer is made when the level opens and disposed when it closes. Leaving also frees the
  textures you browsed but aren't wearing.
- The island already draws nothing under a full-height sheet.
- 16 px inputs, so Safari doesn't zoom.
- iPhone 15/16 Safari only.

## 4. Data model

The record is the Durable Object. Prefs are one slot per (person, key), latest wins (`model/record.ts`). Both new
prefs are added to `contract/api.ts` `PREF_KEYS`, `contract/guest.ts` `GUEST_PREF_KEYS`, `record.ts` `LATEST_PREFS`
and `prefTaken`, `model/state.ts` and `docs/backend.md`.

```ts
// contract/look.ts (shared by the app and the relay)
type PartId = string;            // a part table id: the dump folder name, e.g. 'TopsTexTopOuterLAran3', 'PlayerHair24'
type Look = {
  v: 1,
  hair: PartId, hairColor: Hex, eye: PartId, eyeColor: Hex, mouth: PartId, skin: Hex, cheek: 0 | 1 | 2, nose: 0 | 1 | 2,
  top: PartId | null,            // a TopsTex… (a Onepiece… one means bottom is null)
  bottom: PartId | null, socks: PartId | null, shoes: PartId | null,
  glasses: PartId | null, ornament: PartId | null, hat?: PartId | null   // hat: later
}
// pref `look`: { kind: 'player', look: Look } | { kind: 'villager' }  (the existing `villager` pref says which villager)
// pref `savedLooks`: { id: string /* 8 chars */, name: string /* 1–12 */, look: Look }[]
```

- **The default look is code, not data:** `DEFAULT_LOOK.A`, `.B` (the signed-off outfits) and `.G` (a neutral
  preset).
  - 「いつもの」 is always shown and never stored, so it can't be deleted or drift.
  - No `look` pref means you wear the default look. This is also the migration: the members become their signed-off
    players without anything written.
- **Size limits:**
  - A `Look` is about 350 characters as JSON.
  - `savedLooks` is capped at **20**: about 8 KB, under the record's 20,000-character event limit
    (`relay/src/store.ts` `MAX_EVENT_DATA_CHARS`).
  - Names: 1–12 characters, trimmed, plain text.
- **Validation (`prefTaken`, pure):**
  - The shape and the limits.
  - Hex colours.
  - Every `PartId` against the **part table**: the QA'd list, generated, about 4,000 ids. It goes in `contract/`, and
    the relay bundles it (~30 KB gzipped). The app loads it only with the すがた level.
  - **Forward compatibility:** a phone that meets an id it doesn't know (a newer app's part) draws the default look's
    part for that slot and keeps the id as it is.
  - **Unknown ids at the record:** while the relay runs an older version side by side with a newer one, it refuses
    them with `too_new`, and the queue keeps them until the relay is updated. Same rule as any new pref.
- **No ownership:** every id in the part table is wearable by anyone, so validation is the whole check. A saved
  look always wears exactly as saved, except for an id from a newer app, which takes the default part (above).
- **Sync:**
  - Both prefs go through the queue to the record like `villager` today. The partner's phone picks them up on its
    next snapshot or poll.
  - The room may also announce a `look` change as presence (as `say` is), so an open partner phone swaps the model
    at once.
  - `savedLooks` matter only to their owner's phone(s). Other phones never fetch parts for them.
  - One whole-list pref per person is enough: only its owner edits it, and a person has one phone. A per-コーデ map
    (like decor ops) would be needed only if two phones of one person edited at once.
  - The sheet export carries the JSON.
- **The guest:** the same two prefs, its own.
  - Its default look is a neutral preset, or it stays its current villager (`kind: 'villager'`) until it opens
    すがた: it isn't changed under it.
  - The same full closet as the members.
- **Private profiles:** a look holds presentation only. No part is gated by sex. Sex and birth stay on the record's
  profile alone.

## 5. For the tech artist (constraints)

- **One mesh per shape, textures per variant.** The dump is already built this way (`PlayerTopsTopOuterL` plus
  `TopsTexTopOuterLAran0…n`).
  - Ship each shape's GLB once, without textures: `static/room/players3d/mesh/<shape>.glb`.
  - Ship each variant's textures on their own: `…/tex/<variant>.webp`, the albedo with its detail in alpha and the
    `_Mix` G channel packed in, ≤ 256 px, plus `_OP` where it exists.
  - A colour dot then costs one ~3–5 KB fetch; a new shape ~10–20 KB.
  - Shoes have one .dae a folder: dedupe identical meshes at conversion.
- **What it costs on the server** (estimates, GitHub Pages; nothing is precached by the service worker, only cached
  on first use):

| What | Count | Estimate |
|---|---|---|
| Shape GLBs (tops, bottoms, shoes, glasses, ornaments) | ~230 | ~3–4 MB |
| Variant textures | ~4,000 | ~15–20 MB |
| Closet icons, one per variant, rendered by the harness at 96 px | ~4,000 | ~10 MB, fetched as tiles near the view |
| Hair (37 + 16 cap versions), eye and mouth atlases (26 + 4) | ~83 | ~1.5 MB |

  - Icons rendered by our harness rather than NH's icon set mean every variant gets one in one consistent look, and
    no item-name mapping is needed.
- **What it costs on a phone:**
  - The body, ~54 KB, once per page.
  - Each person's outfit ~50–60 KB, so ~220 KB for three people on first sight, cached after that.
  - Browsing the closet fetches only what's previewed.
  - Within the ≤ 100 KB per avatar budget only because the body is shared. Keep `tech-notes.md`'s savings: merge the
    skin primitives, cut hidden limb triangles, aim for ~8 draw calls.
- **Assembly at runtime** on one skeleton (the harness's `player.js` `loadPlayer` is the start). Every part binds by
  joint name. Hair and ornaments graft under `HeadAttach`.
  - Swapping a part disposes the old part's geometry and texture if nobody else uses them. Count references; three
    people may share a shape.
  - Skin, hair, eye and blush colours as material uniforms, not baked into textures, so changing them costs no
    bytes.
- **The part table is generated** from the QA'd shapes. For each id: kind, shape, sleeve (which body parts it hides),
  onepiece, hue bucket, an anchor group (ornaments), and its `PlayerHairCap` (later, for hats).
- **Animation and faces:** as in rev. 1 and `tech-notes.md`.
  - The same joint names, so `poses.ts` runs on players as is.
  - A per-kind tuning table: the thigh, seats, `ARMS`.
  - A per-kind `FACES` table (players' cells differ).
  - Procedural skirt and hem joints for sitting (`skirtSit`) and for a walk's sway.
  - Garments with skirt joints must pass the seated QA.
- **Portraits:** the strip's chips and the `Avatar.svelte` heads are rendered from the look and cached by its hash
  (localStorage).
  - Render them with the preview's renderer while すがた is open, and the island's renderer otherwise. Never a second
    context.

## 6. Open questions and plan

**For the user:**
- **Resolved:** clothes are all free (the user, 2026-11-05).
- **Resolved:** the villager look stays as an option, the switch at the foot of すがた, for the members and the guest
  (the user, 2026-11-05).

**Phases:**
1. **Done:** sign-off renders of A and B.
2. **POC route, `routes/dev/player`:**
   - `createPlayer(look)` implementing `Villager3D`: states, faces, seats, attachments.
   - Runtime part and texture swaps.
   - Measure KB, draw calls and iOS Simulator frame cost.
   - The すがた level's preview and コーデ strip sketched there.
3. **Closet pipeline:**
   - Convert the shapes and variants.
   - The QA contact sheets per shape → the part table.
   - Icons and hue buckets.
4. **Integration:**
   - The `look` and `savedLooks` prefs, with defaults in `contract/look.ts`.
   - Spawn by look on the island, in the tent and in the museum.
   - Portraits.
   - The すがた level.
   - The guest.
   - e2e: the closet flow, コーデ save/wear/overwrite/delete, sync between two tabs; the leaks spec.
   - Docs: design.md and decisions.md.
5. **Later:** hats (cap hair).
