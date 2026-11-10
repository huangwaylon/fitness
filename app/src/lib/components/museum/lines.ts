// What the curator says (docs/design.md "The museum"), pure: NH's Blathers (フータ) at the desk, a tap's line (i18n
// museum.curator.*). His welcome the first time in a visit, then one of his lines, never the same twice running.
import { pickOne } from '#lib/random.ts';

/** The id a tap on the curator picks (curator.ts). */
export const CURATOR = 'curator';
/** His lines (museum.curator.0 …; .0 counts what's on show: {fish}, {bugs}; .6 the fossils, {fossils}; .7 the art,
 *  {art}; .10 how the art comes: a balloon's present now and then). */
const LINES = 11;

/** His news: the newest find of the last day by name (museum.curator.new, {name}). */
const NEWS = 'museum.curator.new';
/** His line on a tap (an i18n key): `last` the one before (none yet: his welcome); `fresh`: a find of the last day is
 *  on show (every other tap or so his news, never twice running). */
export function curatorLine(r: () => number, last?: string, fresh = false): string {
  if (!last) return 'museum.curator.hello';
  if (fresh && last !== NEWS && r() < 0.5) return NEWS;
  return pickOne(Array.from({ length: LINES }, (_, i) => `museum.curator.${i}`).filter((k) => k !== last), r);
}
