// Bunny Day's eggs (docs/design.md "Holiday hosts"), after NH: through Bunny Day's celebrations (events.ts eggTime: the
// week before Easter and the day itself) eggs turn up where NH hides them: a balloon carries a sky egg instead of its
// present now and then, a dig spot holds an earth egg, a fish on the line is a water egg. Cosmetic: a caption, never ベル,
// never a ずかん find. Pure (the dig spot's from the date, so both phones agree; the rest at the moment).
import { ISLAND_SEED, dayRand } from './beach.ts';

/** NH's three eggs the island can hold (earth: dug up; sky: from a balloon; water: on the line). */
export const EGGS = ['earth-egg', 'sky-egg', 'water-egg'] as const;
/** A balloon carries a sky egg instead of its present 1 in 3; a dig spot holds an earth egg 1 in 4; a fish on the line
 *  is a water egg 1 in 6. */
export const EGG_ODDS = { balloon: 1 / 3, dig: 1 / 4, line: 1 / 6 } as const;

/** Whether a dig spot (its uid on `date`) holds an earth egg instead of its fossil (its own stream). */
export const eggInDig = (date: string, uid: string, seed = ISLAND_SEED): boolean => dayRand(date, `egg@${uid}`, seed)() < EGG_ODDS.dig;
/** Whether this balloon's present is a sky egg. */
export const eggInBalloon = (r: () => number = Math.random): boolean => r() < EGG_ODDS.balloon;
/** Whether this fish on the line is a water egg. */
export const eggOnLine = (r: () => number = Math.random): boolean => r() < EGG_ODDS.line;
