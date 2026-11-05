// The ground's look (terrain.ts's palette) for a season and its foliage: the island's (Island3D) and the editor's
// preview's, the same rule. Free of three.js (the editor loads it before its 3D chunk).
import type { Season } from '#lib/ui-state/theme.svelte.ts';

export type Look = 'spring' | 'summer' | 'autumn' | 'winter' | 'spring-petals' | 'autumn-leaves';

/** Spring's blossom and autumn's fall colours are looks of their own; otherwise the season's. */
export const lookOf = (season: Season, foliage: string): Look =>
  season === 'spring' && foliage === 'blossom' ? 'spring-petals' : season === 'autumn' && foliage === 'fall' ? 'autumn-leaves' : season;
