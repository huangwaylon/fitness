// 英語すごろく's board families and layout keys (docs/sugoroku.md "The board"), apart from the generator (layout.ts) so
// what an online game's id needs (wire.ts newGameId: the next game another family) loads without it.
import { fnv1a } from '#lib/random.ts';

/** The generator's version: a layout key is `${GEN}:${seed}`; a change to the generator bumps it (an older key then
 *  reads as no board: its save as none; layout.test's golden boards fail on a change without it), and so wire.ts RULES.
 *  2: the boards with 2–3 みんなで！ stones a route (1, before them, retired 2026-11-20). */
export const GEN = 2;
export const FAMILIES = ['snake', 'zigzag', 'wave', 'loop', 'cross', 'forks'] as const;
export type Family = (typeof FAMILIES)[number];
export const familyOf = (seed: string): Family => FAMILIES[fnv1a(`${seed}:family`) % FAMILIES.length];
export const layoutKey = (seed: string): string => `${GEN}:${seed}`;
/** A layout key's family (none: no key). */
export const familyOfKey = (key?: string): Family | null => (key ? familyOf(key.slice(key.indexOf(':') + 1)) : null);
