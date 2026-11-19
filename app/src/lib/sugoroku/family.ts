// 英語すごろく's board families and layout keys (docs/sugoroku.md "The board"), apart from the generator (layout.ts) so
// what an online game's id needs (wire.ts newGameId: the next game another family) loads without it.
import { fnv1a } from '#lib/random.ts';

/** The generator's version: a layout key is `${gen}:${seed}`; a change to the generator bumps it (an older key then
 *  reads as no board: its save as none; layout.test's golden boards fail on a change without it), and so wire.ts RULES.
 *  The versions this build still builds (GENS): 1 the boards before mini-games, 2 with 2–3 みんなで！ stones a route
 *  (new boards). */
export const GENS = [1, 2] as const;
export type Gen = (typeof GENS)[number];
export const GEN: Gen = 2;
export const FAMILIES = ['snake', 'zigzag', 'wave', 'loop', 'cross', 'forks'] as const;
export type Family = (typeof FAMILIES)[number];
export const familyOf = (seed: string): Family => FAMILIES[fnv1a(`${seed}:family`) % FAMILIES.length];
export const layoutKey = (seed: string, gen: Gen = GEN): string => `${gen}:${seed}`;
/** A layout key's generator version (null: one this build doesn't build). */
export const genOfKey = (key: string): Gen | null => {
  const g = Number(/^(\d+):/.exec(key)?.[1]);
  return (GENS as readonly number[]).includes(g) ? (g as Gen) : null;
};
/** A layout key's family (none for the classic board). */
export const familyOfKey = (key?: string): Family | null => (key ? familyOf(key.slice(key.indexOf(':') + 1)) : null);
