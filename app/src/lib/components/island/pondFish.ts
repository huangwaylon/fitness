// The fresh-water fish (docs/design.md "Fishing"): NH's 46, each in the water NH keeps it in (world.ts freshWhere): the
// pond, the river, the river mouth (the wide reach on the west beach) or the clifftop (the river above the cliff and the
// spring). Its own chunk, loaded with the first fresh-water shadow (Critters.svelte), so the island's first load doesn't
// carry it; the ずかん's page imports it too. Like the sea fish (critters.ts FISH): NH's northern-hemisphere months only
// weight the odds (×IN_SEASON), the hours still hold, a low weight is a rare fish. Months, hours, shadows and locations
// from the game's data (the ACNH data spreadsheet, as on Nookipedia); the weights are ours. A catch is a ずかん find,
// never ベル.
import { ALL_DAY, ALL_YEAR, pick, span, type Fish, type PondFishId } from './critters.ts';
import type { FreshWhere } from './world.ts';

export type { PondFishId };

/** NH's 46 freshwater fish in the game's critterpedia order, each with NH's location (`water`; the char, NH's clifftop
 *  river and ponds, takes the most specific: the clifftop). Deviations from NH: the clifftop char and cherry salmon
 *  keep their spring hours (4 pm – 9 am) in autumn too (NH: all day then). */
export const POND_FISH: Record<PondFishId, Fish & { water: FreshWhere }> = {
  bitterling: { months: span(11, 3), hours: ALL_DAY, size: 1, weight: 3, water: 'river' },
  'pale-chub': { months: ALL_YEAR, hours: [9, 16], size: 1, weight: 4, water: 'river' },
  'crucian-carp': { months: ALL_YEAR, hours: ALL_DAY, size: 2, weight: 5, water: 'river' },
  dace: { months: ALL_YEAR, hours: [16, 9], size: 3, weight: 4, water: 'river' },
  carp: { months: ALL_YEAR, hours: ALL_DAY, size: 4, weight: 4, water: 'pond' },
  koi: { months: ALL_YEAR, hours: [16, 9], size: 4, weight: 1.5, water: 'pond' },
  goldfish: { months: ALL_YEAR, hours: ALL_DAY, size: 1, weight: 1.5, water: 'pond' },
  'pop-eyed-goldfish': { months: ALL_YEAR, hours: [9, 16], size: 1, weight: 1, water: 'pond' },
  'ranchu-goldfish': { months: ALL_YEAR, hours: [9, 16], size: 2, weight: 1, water: 'pond' },
  killifish: { months: span(4, 8), hours: ALL_DAY, size: 1, weight: 1.5, water: 'pond' },
  crawfish: { months: span(4, 9), hours: ALL_DAY, size: 2, weight: 2.5, water: 'pond' },
  'soft-shelled-turtle': { months: span(8, 9), hours: [16, 9], size: 4, weight: 1, water: 'river' },
  'snapping-turtle': { months: span(4, 10), hours: [21, 4], size: 4, weight: 0.7, water: 'river' },
  tadpole: { months: span(3, 7), hours: ALL_DAY, size: 1, weight: 2, water: 'pond' },
  frog: { months: span(5, 8), hours: ALL_DAY, size: 2, weight: 2, water: 'pond' },
  'freshwater-goby': { months: ALL_YEAR, hours: [16, 9], size: 2, weight: 2, water: 'river' },
  loach: { months: span(3, 5), hours: ALL_DAY, size: 2, weight: 3, water: 'river' },
  catfish: { months: span(5, 10), hours: [16, 9], size: 4, weight: 2, water: 'pond' },
  'giant-snakehead': { months: span(6, 8), hours: [9, 16], size: 4, weight: 0.7, water: 'pond' },
  bluegill: { months: ALL_YEAR, hours: [9, 16], size: 2, weight: 4, water: 'river' },
  'yellow-perch': { months: span(10, 3), hours: ALL_DAY, size: 3, weight: 2, water: 'river' },
  'black-bass': { months: ALL_YEAR, hours: ALL_DAY, size: 4, weight: 4, water: 'river' },
  tilapia: { months: span(6, 10), hours: ALL_DAY, size: 3, weight: 2, water: 'river' },
  pike: { months: span(9, 12), hours: ALL_DAY, size: 5, weight: 0.7, water: 'river' },
  'pond-smelt': { months: span(12, 2), hours: ALL_DAY, size: 2, weight: 3, water: 'river' },
  sweetfish: { months: span(7, 9), hours: ALL_DAY, size: 3, weight: 2, water: 'river' },
  'cherry-salmon': { months: [3, 4, 5, 6, 9, 10, 11], hours: [16, 9], size: 3, weight: 1.5, water: 'clifftop' },
  char: { months: [3, 4, 5, 6, 9, 10, 11], hours: [16, 9], size: 3, weight: 0.6, water: 'clifftop' },
  'golden-trout': { months: [3, 4, 5, 9, 10, 11], hours: [16, 9], size: 3, weight: 0.3, water: 'clifftop' },
  stringfish: { months: span(12, 3), hours: [16, 9], size: 5, weight: 0.3, water: 'clifftop' },
  salmon: { months: [9], hours: ALL_DAY, size: 4, weight: 1.5, water: 'mouth' },
  'king-salmon': { months: [9], hours: ALL_DAY, size: 5, weight: 0.4, water: 'mouth' },
  'mitten-crab': { months: span(9, 11), hours: [16, 9], size: 2, weight: 1.5, water: 'river' },
  guppy: { months: span(4, 11), hours: [9, 16], size: 1, weight: 1, water: 'river' },
  'nibble-fish': { months: span(5, 9), hours: [9, 16], size: 1, weight: 0.8, water: 'river' },
  angelfish: { months: span(5, 10), hours: [16, 9], size: 2, weight: 1, water: 'river' },
  betta: { months: span(5, 10), hours: [9, 16], size: 2, weight: 1, water: 'river' },
  'neon-tetra': { months: span(4, 11), hours: [9, 16], size: 1, weight: 1, water: 'river' },
  rainbowfish: { months: span(5, 10), hours: [9, 16], size: 1, weight: 1, water: 'river' },
  piranha: { months: span(6, 9), hours: [9, 16], also: [21, 4], size: 2, weight: 0.8, water: 'river' },
  arowana: { months: span(6, 9), hours: [16, 9], size: 4, weight: 0.4, water: 'river' },
  dorado: { months: span(6, 9), hours: [4, 21], size: 5, weight: 0.3, water: 'river' },
  gar: { months: span(6, 9), hours: [16, 9], size: 5, weight: 0.4, water: 'pond' },
  arapaima: { months: span(6, 9), hours: [16, 9], size: 6, weight: 0.3, water: 'river' },
  'saddled-bichir': { months: span(6, 9), hours: [21, 4], size: 4, weight: 0.4, water: 'river' },
  sturgeon: { months: span(9, 3), hours: ALL_DAY, size: 6, weight: 0.4, water: 'mouth' }
};

/** Who swims in a water, as in NH: the pond holds the pond fish; the river the river fish; the river mouth and the
 *  clifftop are the river too, so their own fish (the salmon, the sturgeon; the char, the golden trout) come with the
 *  river's. */
export function freshPool(where: FreshWhere): PondFishId[] {
  return (Object.keys(POND_FISH) as PondFishId[]).filter((id) => {
    const w = POND_FISH[id].water;
    return w === where || (w === 'river' && (where === 'mouth' || where === 'clifftop'));
  });
}
const pools = new Map<FreshWhere, Record<string, Fish>>();
const poolOf = (where: FreshWhere) => {
  let p = pools.get(where);
  if (!p) pools.set(where, (p = Object.fromEntries(freshPool(where).map((id) => [id, POND_FISH[id]]))));
  return p;
};
/** The fish under a new shadow in `where` (always someone: the carp and the crucian carp are about all day, all year,
 *  in the pond and the rivers). */
export const pickFresh = (where: FreshWhere, month: number, hour: number, r: () => number): PondFishId =>
  (pick(poolOf(where), month, hour, r) as PondFishId | null) ?? (where === 'pond' ? 'carp' : 'crucian-carp');
/** Any fresh-water fish (every water's together). */
export const pickPondFish = (month: number, hour: number, r: () => number): PondFishId =>
  pick(POND_FISH, month, hour, r) ?? 'crucian-carp';
