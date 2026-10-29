# Scale, ground and beds (scene artist, round 7)

The island now uses the New Horizons tile grid. Every size is derived from the villager. Code: `island/scene.ts` (`TILE`, `ROW`, `col()`, `ROWS`).

## Tile unit
- **1 tile = 44u** wide. **1 row = 31u** deep (NH's camera foreshortens ground depth to about 0.7).
- Columns are centred on the jar: `col(k) = 195 + 44k`, k = −3…3.
- Rows: hedge 80 · trees + jar 173 · bed back 266 · front 297.
- **Villager = 80u ≈ 1.8 tiles.**

Measured from in-game screenshots (`.refs/scale/NH_Gold_Rose_About_to_Grow.jpg`, `.refs/pocketcamp/PanchamBro_…jpg`; the custom-design patches under trunks give the tile) and the official renders.

## Scale table
H = villager height. px = 393 / 320.

| Element | Game | Before | Now | px |
|---|---|---|---|---|
| Villager | 1 tile, ≈ 1.8 tiles tall | 94u | **80u**, cols ±1 | 93 / 74 |
| Hardwood | ≈ 1.5 H, canopy ≈ 2.2 tiles | 128u | **120u**, cols ±2 | 139 / 110 |
| Bush | 1 per tile, ≈ 0.6 H | 28u (0.3 H), 37.5u pitch | **48u**, 44u pitch | 56 / 44 |
| Flower | 1 per tile, ≈ 0.45 H | 20u, 18u pitch | **32u** (0.4 H), 44u pitch | 37 / 29 |
| Fruit | ≈ 0.3 H | 18u | **24u** | 28 / 25 |
| Jar | 1-tile furniture, ≈ 0.8 H | 56 × 70u | **52 × 65u** | 60 / 48 wide |

Tap targets are unchanged: villager and jar buttons ≥ 64px, the fruit row 44px.

## Compromises
- **Villagers −15%.** At 94u the island would be under 5 tiles wide. At 80u it holds 7, and the villagers still read at 320.
- **Fruit at half-tile pitch.** NH puts one dropped item per tile; 4 kinds × 3 items can't fit that way.
- **Jar 1.2 tiles wide**, so the coins and the plate stay legible.
- **Flowers 0.4 H.** NH's flower art is one big bloom, so it reads oversized at true height.
- **Outer bushes** (cols ±3) lean over the rounded back corners, mostly behind the canopies.
- **Orthographic.** Depth comes from rows and z-order, not shrinking (Pocket Camp presentation).

## Ground
- **Flecks:** NH leaf triangles of about 0.2 tile, squashed to 0.7 depth. They sit on a seeded jittered grid (about 2.4 cells per tile, 62% filled), so there is no repeat. Light flecks outnumber dark ones, at two opacities each.
- **Tonal variation:** broad blurred lighter and darker patches. The plaza and root flares stay clear.
- **Winter:** snow dimples instead of leaves.
- **Cliff edge:** the overhang casts a soft shade onto the cliff top.
- **Palettes:** unchanged.

## Hedge
One NH species per month in two alternating colours, one bush per tile on cols −3…3:
- Apr–May azalea
- Jun hydrangea
- Jul–Aug hibiscus
- Sep–Oct tea olive
- Nov–Dec holly
- Jan–Mar camellia

The art is the 3D catalog renders (`*_Bush_NH_Icon`), trimmed to the figure (`fetch-assets.ts` `TRIM`). Each bush has a contact shadow, and snow on top in winter.

## Flower beds
Two 2 × 2 beds mirrored about the jar, on cols ±2/±3 of the back and front rows. Col 0 stays open for strolls. Each flower has a contact shadow.

| Season | Back row | Front row |
|---|---|---|
| Spring | red tulips | yellow tulips |
| Summer | red roses | white roses |
| Autumn | pink cosmos | purple mums |
| Winter | red roses, snow caps | orange pansies |

No new animation and no layout shift.
