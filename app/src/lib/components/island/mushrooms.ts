// Mushroom season (docs/design.md "Beach finds"), after NH: in November mushrooms come up beside the trees (round,
// skinny, flat, now and then an elegant one) and the rare mushroom is dug up instead of a fossil now and then. Not stiffly
// seasonal: a day in October or December brings one now and then. Pure and seeded by the date (beach.ts dayRand), so
// both phones see the same; what a phone picked up is its own (sceneDay.ts). Cosmetic: no ベル and no ずかん `find`
// (the ずかん has no kind for them; docs/decisions.md "Mushrooms are cosmetic").
import { weighted } from '#lib/random.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { ROCK, SCENERY, TAPE_DECK, onLayout } from './world.ts';

/** NH's four ground mushrooms with their spawn weights (Nookipedia "Mushroom", a 3-star island: the elegant one rare). */
export const MUSHROOMS = [['skinny-mushroom', 35], ['round-mushroom', 30], ['flat-mushroom', 30], ['elegant-mushroom', 5]] as const;
type MushroomId = (typeof MUSHROOMS)[number][0] | 'rare-mushroom';
/** How often a November dig spot holds the rare mushroom instead of its fossil. */
export const RARE_ODDS = 1 / 20;
/** How often a day in October or December brings a mushroom (November: every day). */
export const OFF_SEASON_ODDS = 1 / 8;

/** Beside the front lawn's oak and cedar (world units: x, z), past their canopies' spans (a tap there would go to the
 *  tree), a step behind the trunk; the goal trees' sides are the villagers' and the fruit's. Finds shows one only where
 *  this screen's controls leave room (measured). */
const at = (id: string, kind: 'oak' | 'cedar', dx: number, dz: number): readonly [number, number] => {
  // (moved off the island's layout: the first of its kind)
  const t = SCENERY.find((s) => s.id === id) ?? SCENERY.find((s) => s.kind === kind) ?? { x: 195, z: 400 };
  // on the layout the trees stand where anyone puts them: never on the rock or the tape deck (a tap there is theirs),
  // the tree's other side then
  const clear = (x: number, z: number) => [ROCK, TAPE_DECK].every(([px, pz]) => Math.hypot(px - x, pz - z) >= NEAR_U);
  if (onLayout() && !clear(t.x + dx, t.z + dz) && clear(t.x - dx, t.z + dz)) return [t.x - dx, t.z + dz];
  return [t.x + dx, t.z + dz];
};
/** How far a mushroom keeps from the rock and the tape deck on the layout (u). */
const NEAR_U = 44;
export const mushroomSpots = (): readonly (readonly [number, number])[] => [at('oak-m1', 'oak', -54, 10), at('oak-m1', 'oak', 62, 14), at('cedar-m1', 'cedar', 40, 6), at('cedar-m1', 'cedar', 50, 24)];

const monthOf = (date: string): number => Number(date.slice(5, 7));

export interface Mushroom { uid: string; id: MushroomId; x: number; y: number; flip: boolean }

/** The day's mushrooms beside the trees: November 1–2 (half the days two), October and December one now and then
 *  (OFF_SEASON_ODDS), else none. Each on its own spot. */
export function mushroomsOn(date: string, seed = ISLAND_SEED): Mushroom[] {
  const m = monthOf(date), r = dayRand(date, 'mushrooms', seed);
  const n = m === 11 ? (r() < 0.5 ? 1 : 2) : (m === 10 || m === 12) && r() < OFF_SEASON_ODDS ? 1 : 0;
  const used = new Set<number>(), MUSHROOM_SPOTS = mushroomSpots();
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
