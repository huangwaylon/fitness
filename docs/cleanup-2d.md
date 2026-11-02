# Cleaning up after the 3D cutover (the 2D island's assets and code)

The user wants the 2D island's assets removed right after the 3D island becomes the only island, once they have
confirmed this list. **Nothing is deleted yet.** The list comes from `npm run unused` (`app/scripts/unused-assets.ts`),
checked against what the built 3D island draws (`npm run unused:probe`). Snapshot: 2026-11-02, main at 6456bab.

```sh
cd app
npm run build && node scripts/serve-build.ts 4396 &          # (a free port: lsof -i :4396)
npm run unused:probe -- 4396 /tmp/seen.txt                    # 17 scenes on the 3D island: what's drawn or loaded
npm run unused -- --seen=/tmp/seen.txt                        # the summary; --list=safe|used|unsure for paths; --json
```

## How it decides

- **The users of a file** are the source files that name it: a literal key or path (`'deco/present'`,
  `` `art/x.webp` ``), a template that builds it (`` `critters/${id}` ``, counted as a real use when the varying part,
  e.g. `sea-bass`, is spelled somewhere in the source), a prefix (`'room/homes/' + id`), or a string in a JSON file
  (`island/models.json`, `catalog.json`, `layout/catalog.ts`'s icons).
- **Each user has a kind:**
  - the **2D renderer**, which goes with the cutover (the files listed below);
  - the **island's world** (`components/island|world3d|board`, and `lib/art.ts`'s key helpers, which only the island
    calls). Its DOM nodes stay over the canvas, but their art shows only where the 3D island has no model for the key
    (`world3d/assets.json` keys: otherwise a card, or the node's own art through `m3off`);
  - the **app beyond the island** (the tent, the ずかん, the HUD, the sheets, the もようがえ tray, the editor's palette).
    Anything it names stays;
  - a **dev page** (the gallery shows every key), which keeps nothing.
- **The ずかん's data counts as the app's.** `kiroku/zukan.ts` imports `critters.ts`, `beach.ts`, `sea.ts`,
  `pondFish.ts` and `catalog.ts`, so the art keys those build are ずかん and catch-plate icons. `world.ts` is the one
  exception: the app imports it for positions only, and its scenery keys are the island's to draw.
- **A layer of a modelled thing is safe.** An oak's `-trunk` / `-canopy` and a lamp's `-lit` head are parts of the 2D
  sprite of something the 3D island draws as NH's model.
- **Hand-checked rules** (`KNOWN` in the script) cover what the scan can't see: villagers (cards for villagers without
  3D models), しずえ, the catalogue icons, the UI art, the falling petals and leaves, the terrain, and the bake's input.
- **The probe** opens the built 3D island in 17 scenes (the four seasons, night and dusk, rain and snow, Halloween,
  Christmas Eve, a birthday, K.K., Gulliver, Wisp, a fish, a tarantula, a bottle), scrolls and taps. Anything it saw
  drawn (a visible DOM image) or loaded by the engine (a texture, never a DOM image) can't be "safe". It demoted
  `season/*`: a tapped bush's petals and a shaken tree's leaves are still drawn by the DOM over the canvas.
- **The built JS** (`build-pages/`) is read too: an unnamed file whose name is in the shipped chunks becomes "unsure".
  There were none.

## Summary

| | Files | Size |
|---|---:|---:|
| **Safe to delete after the cutover** | **126** | **0.58 MB** |
| Still used | 6,147 | 90.81 MB |
| of which 2D art (`art/`) | 3,257 | 15.88 MB |
| of which 3D models, the tent's room, audio, icons | 2,890 | 74.9 MB |
| **Unsure** (the baked ground: safe once the layout's ground lands) | **48** | **1.67 MB** |

The 2D island's own art is small: the bulk of `static/` is the 3D models, the music and the villagers' renders, which
all stay. The cutover frees 0.58 MB of art now, and 2.25 MB once the layout's ground replaces the baked chunks. The
code is the bigger win (below).

**A win before any deletion:** today the 3D island downloads about 120 2D images it never shows. They are the DOM's
own art under the canvas at opacity 0: the probe saw 199 fetched and 77 drawn or loaded. Removing the art from the
nodes (the code below) stops those downloads even before any files go.

## Safe to delete after the cutover (126 files, 0.58 MB)

Each has a 3D model in `world3d/assets.json` (or is a layer of one), and only the 2D island draws it:

- `art/deco/` (31): bamboo-shoot-lamp, bamboo-shoot-lamp-lit, birthday-cake, bulletin-board-winter, campfire-lit,
  campsite-lit, campsite-winter, egg-arch, garden-lantern-lit, garden-lantern-white-lit, illumi-tree, illumi-tree-lit,
  kadomatsu, lamp-glow (`Scenery`'s `{#if lit && !r3}` only), mushroom-lamp, mushroom-lamp-lit, nut-lamp, nut-lamp-lit,
  party-popper, picnic-set, pond-stone-maple, pond-stone-sakura, present, pumpkin, shishiodoshi-tip, snowboy-1…3,
  spooky-lantern, streetlamp-lit, wedding-arch
- `art/decor/` (30): every old もようがえ decoration's looks 1–3 (birdbath, brick-well, garden-wagon, iron-chair,
  iron-table, monstera, signpost, stone-lantern, tanuki, wheelbarrow). Look 0 of each stays as the tray's icon.
- `art/flowers/` (41): every wild flower but red-tulips (the palette's icon)
- `art/trees/` (14): oak-spring, oak-fall, oak-winter, the four oaks' -trunk and -canopy layers, bamboo-winter,
  cedar-winter, palm-winter
- `art/fruit/` (4): apple, cherry, peach, pear (the goal trees' fruit is NH's models, greyed by `m3.grey`)
- `art/bridges/` (3): stone-deck, stone-deck-winter (the bake's input, never shown), stone-front-winter
- `art/items/candy` (1)
- `terrain/sprites/` (2): cliff-face, cliff-face-winter (WorldWater only)

Then remove their entries from `static/art/manifest.json` (fetch-assets / derive-art / models.ts write it), and the
matching rules in `service-worker/caches.ts`: `isBakeArt`, and `isDecorArt`'s `-lit` and `lamp-glow` cases.

## Still used (6,147 files, 90.81 MB)

- **Flat art for villagers without a 3D model**, and the villagers everywhere else: `art/villagers/` (887, 11.49 MB):
  the roster, the HUD, the tent, and the 3D island's cards where `has3d` is false.
- **ずかん and catch-plate icons:** `art/critters/` (197, 0.40 MB); `art/finds/` (110, 0.23 MB: shells, fossils,
  fragments, mushrooms, the bottle, eggs, the branch); `art/presents/diy-recipe`.
- **The balloon catalogue** (presents, the ずかん, the tent's items): `art/finds/items/` (1,836, 3.17 MB),
  `art/finds/recipes/` (126, 0.22 MB).
- **Tray and palette icons** (the phone's もようがえ `IslandEdit`, the editor, `layout/catalog.ts`): art/bushes (24,
  `bushes/${s}` for the chosen bush), the deco and decor look-0 icons, bridges/stone-front, flowers/red-tulips, and
  trees oak-summer, cedar, palm, bamboo.
- **HUD and UI art:** `art/host/` (しずえ, Tom Nook), `art/reactions/`, `art/money/`, `art/fruit3d/`,
  `art/items/{dinner,snack}` (the wallet), `art/deco/airport` (pairing), `art/deco/birthday-hat-*` (drawn over the 3D
  villagers).
- **Seen on the 3D island:** `art/season/` (petal, maple-leaf, snowflake: a tapped bush's petals and a shaken tree's
  leaves are DOM flourishes over the canvas, and the 3D floats' cards).
- **3D models and the tent:** `room/` (villagers3d, models, homes, world3d, floor, wall, structures, icons).
  `terrain/nh/` (NH's ground textures for the layout's live terrain).
- **Audio, the app icons, the web manifest.**

## Unsure (48 files, 1.67 MB)

- `terrain/{spring,summer,autumn,winter,spring-petals,autumn-leaves}/0…7.webp`: the baked ground. The 2D island draws
  it (WorldGround), and so does the **3D island today** (`Island3D.svelte` `groundUrls()` → `engine.groundLook`, and
  `/villagers3d`). It becomes safe once the 3D island draws `buildGround(layout)` (docs/island-layout.md "What the 3D
  integration must change" 1). `island/terrain.json`, `scripts/terrain.ts`, `terrain-seasons.ts` and
  `terrain-preview.ts` go with it, and so does `caches.ts` `isCritterArt`'s `/terrain/` case.

## The code that goes

### Whole files (the script's `GONE`, ~1,000 lines)

| File | Lines | What |
|---|---:|---|
| `island/WorldGround.svelte` | 116 | the baked ground's 40 bent bands |
| `island/WorldWater.svelte` | 192 | the live water's CSS sprites over the baked ground |
| `island/ShoreWash.svelte` | 100 | the foam strip (WorldWater's) |
| `island/Waterfall.svelte` | 129 | the CSS falls (WorldWater's) |
| `island/roll.ts` (+ `roll.test.ts` 190) | 211 | the rolling log's projection. **First move** `quadMatrix` (place3's flat quads) and `zIndexAt` (`depthAt`, the DOM's stacking) into camera.svelte.ts: the 3D path still uses them. |
| `island/DecorMode.svelte` | 346 | the old もようがえ's tray and ghost (IslandEdit takes its place on the 3D island, docs/island-layout.md "Phone editing") |

No other module becomes unreachable once these go. Those that already are (`model/record.ts`, `sync/fake-record.ts`)
are outside the cutover.

### Lines to edit in the files that stay

- `island/IslandScene.svelte`
  - :31, :32: drop the WorldGround and WorldWater imports. :76: roll's `camAt, horizonAhead, scrollFor, solveCam`.
  - :168–169: `failed3`, and `r3` is always true. :1062: `onfail` (the "no WebGL: draw in 2D" fallback; the user
    decides between an error card and nothing).
  - :1064–1068: the `{:else}` branch (WorldGround, WorldWater, `.haze`).
  - :485–500 and :560–600: the 2D scroller camera (`solveCam`, `scrollFor`, `camAt`, `camMin` / `camMax` from
    `CAMS`).
  - :983–1001, :1048: the time-of-day `shade` filter. :1149: `.tint`. :1219: `.haze`'s CSS.
  - :1186–1205: the `[data-r3]` rules become unconditional, or better, the hidden art goes from the nodes and the
    rules with it.
- `island/camera.svelte.ts`: :10 the roll import. :149 `depthAt` and :152 `P` (roll's params). Every
  `if (this.three) … else` (:189, :197–201, :214–215, :232–233, :239, :246, :265–290 the 2D `place`, :334–341 the 2D
  quad, :382–385, :401, :452): keep the 3D side. `three` becomes non-null.
- `island/Scenery.svelte`: :168 (shade), :185 (the lit looks and the lamps' glow), :238 (the tent's pool):
  `{#if … !r3}` blocks. Every `<OfficialArt>` inside an m3 node.
- `island/Particles.svelte`: :82, the DOM's falling particles (`!w.rest.three`). The 3D island keeps the count.
- `island/FruitTree.svelte`: the 2D oak (:358, :367 `treeArt`) and the DOM fruit (:407's else). The popup's
  placement (:331) keeps its 3D side.
- `island/Critters.svelte`: the 2D fish teardrop (:1197) and the sprites. `BugSprite.svelte` (359) stays only as the
  invisible tap box, so trim it to that.
- `island/Finds.svelte`, `Flowers.svelte`, `Decor.svelte`, `Visitor.svelte`, `TreeShakes.svelte`, `Halloween.svelte`,
  `Wedding.svelte`, `Cake.svelte`, `TapeDeck.svelte`, `Care.svelte`: the `<OfficialArt>` inside nodes that have an m3
  key with a model. Keep the node and its hit box, and keep the art for keys without a model.
- `components/panel/RenderSection.svelte`, `store/islandRender.svelte.ts`, `sync/storage.ts`: せってい's 2D/3D switch.
- `service-worker/caches.ts`: the rules named above.
- e2e: specs run on the 2D island by default (`E2E_ISLAND=3d` switches). The default flips, and the 2D-only
  assertions go (e.g. `board.spec`'s `'sheet'` view).
- Scripts: `scripts/terrain.ts` (1,081), `terrain-seasons.ts`, `terrain-preview.ts` (with the baked ground).
  `scripts/models.ts` (the 2D renders of NH's models) stays while any of its art is used (the tray icons).

### world.ts constants still read after the cutover

From the import graph with the files above gone (`npm run unused`'s last section):

- **Only the 2D camera reads these**, so they go with it: `PIVOT`, `TILT`, `BEHIND`, `AHEAD` (camera.svelte.ts's roll
  params), `SKY` (also `/villagers3d`), `CAMS`, `CAM_MIN`, `CAM_MAX` (IslandScene's scroller). `PLAN` is the same,
  and also `world3d/ground.ts`'s heightfield until the layout ground lands.
- **Nobody reads these:** `BANDS`, `BAND_D`, `FACE_H`, `FALL_H`, `PATHS`, `Building`.
- **The 3D ground reads these** (`world3d/ground.ts`, `water.ts`) until `buildGround(layout)` lands: `LAND`, `GRASS`,
  `RIVER`, `SPRING`, `POND`, `CLIFF`, `BRIDGE`, `onBridge`.
- **Still read by the DOM overlays, the walk and the critters** (docs/island-layout.md item 7: each should come from
  the layout): `HOMES`, `CAMPSITE`, `BUILDINGS`, `BuildingId`, `CENTRE_STAGE`, `ARCH`, `CAKE`, `SEATS`, `seatAt`,
  `SEAT_DROP`, `PULLUP_AT`, `FLOWERS`, `flowerById`, `DECOR_SLOTS`, `DECOR_U`, `GOAL_TREES`, `TREE_H`, `ROCK`,
  `TAPE_DECK`, `BRIDGE_RAIL`, `HEDGE_Z`, `HEDGE_XS`, `SCENERY`, `FALLS_POOL`, `freshWhere`, `FreshWhere`,
  `riverNear`, `riverNS`, `inRiver`, `inOval`, `onLand`, `onGrass`, `surfaceAt`, `SHORE_Z`, `DIG_SPOTS`,
  `LAWN_SPOTS`, `BEACH_BOX`, `SEA_BOX`.
