// The island's seeded day: everything a phone shows without syncing (finds, weeds, weather, visitors, showers, eggs)
// derives from the Tokyo date, a stream name and the island's seed, so both phones agree.
import { seeded } from '#lib/random.ts';

/** The island's own seed (`?seed=` in the demo varies it: devHooks.ts). */
export const ISLAND_SEED = 'island-fund';

/** A seeded PRNG for one stream of one day. */
export const dayRand = (date: string, stream: string, seed = ISLAND_SEED): (() => number) => seeded(`${seed}|${date}|${stream}`);
