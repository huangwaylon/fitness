// A later game's meta that the catalog hasn't (round/registry.ts's line brings it, catalog.ts addMode). Eager (the
// sheet's chunk) and tiny: the game itself is its lane's chunk.
import type { ModeMeta } from '../catalog.ts';

/** 音の へんしん (docs/kikimimi.md "音の へんしん"): the daily connected-speech drill, on さくっと; no ばしょ (its phrases are
 *  their own level, today's phenomenon the place). */
export const HENSHIN_MODE: ModeMeta = { id: 'henshin', group: 'quick', icon: '🔗', mins: 4, qs: 8, coop: true, game: 'henshin' };
