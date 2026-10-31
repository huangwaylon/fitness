// Mushroom season (docs/design.md "Beach finds"), after NH: in November mushrooms come up beside the trees (round,
// skinny, flat, now and then an elegant one) and the rare mushroom is dug up instead of a fossil now and then. Not stiffly
// seasonal: a day in October or December brings one now and then. Pure and seeded by the date (beach.ts dayRand), so
// both phones see the same; what a phone picked up is its own (sceneDay.ts). Cosmetic: no ベル and no ずかん `find`
// (the ずかん has no kind for them; docs/decisions.md "Mushrooms are cosmetic").
import { ISLAND_SEED, dayRand, weighted } from './beach.ts';
import { TREE } from './scene.ts';

/** NH's four ground mushrooms with their spawn weights (Nookipedia "Mushroom", a 3-star island: the elegant one rare). */
export const MUSHROOMS = [['skinny-mushroom', 35], ['round-mushroom', 30], ['flat-mushroom', 30], ['elegant-mushroom', 5]] as const;
type MushroomId = (typeof MUSHROOMS)[number][0] | 'rare-mushroom';
/** How often a November dig spot holds the rare mushroom instead of its fossil. */
export const RARE_ODDS = 1 / 20;
/** How often a day in October or December brings a mushroom (November: every day). */
export const OFF_SEASON_ODDS = 1 / 8;

/** Beside each trunk on the lawn, between the canopy and the fruit row (stage units: x, the foot's y), so they follow
 *  the trees; Finds shows one only where this screen's controls leave room (measured). */
const TRUNK_DX = 21, TRUNK_UP = 18;
export const MUSHROOM_SPOTS: readonly (readonly [number, number])[] = [TREE.x.A, TREE.x.B].flatMap((x) => [
  [x - TRUNK_DX, TREE.base - TRUNK_UP], [x + TRUNK_DX, TREE.base - TRUNK_UP]
] as const);

const monthOf = (date: string): number => Number(date.slice(5, 7));

export interface Mushroom { uid: string; id: MushroomId; x: number; y: number; flip: boolean }

/** The day's mushrooms beside the trees: November 1–2 (half the days two), October and December one now and then
 *  (OFF_SEASON_ODDS), else none. Each on its own spot. */
export function mushroomsOn(date: string, seed = ISLAND_SEED): Mushroom[] {
  const m = monthOf(date), r = dayRand(date, 'mushrooms', seed);
  const n = m === 11 ? (r() < 0.5 ? 1 : 2) : (m === 10 || m === 12) && r() < OFF_SEASON_ODDS ? 1 : 0;
  const used = new Set<number>();
  return Array.from({ length: n }, (_, i) => {
    let spot = Math.floor(r() * MUSHROOM_SPOTS.length);
    while (used.has(spot)) spot = (spot + 1) % MUSHROOM_SPOTS.length;
    used.add(spot);
    const id = weighted(MUSHROOMS, r);
    const [sx, sy] = MUSHROOM_SPOTS[spot];
    return { uid: `m${i}`, id, x: sx, y: sy, flip: r() < 0.5 };
  });
}

/** Whether a dig spot (its uid on `date`) holds the rare mushroom instead of its fossil: November only, 1 in 20, its
 *  own stream (the day's fossils don't shift). */
export const rareMushroom = (date: string, uid: string, seed = ISLAND_SEED): boolean =>
  monthOf(date) === 11 && dayRand(date, `rare@${uid}`, seed)() < RARE_ODDS;
