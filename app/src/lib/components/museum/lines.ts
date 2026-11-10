// What the curator says (docs/design.md "The museum"), pure: NH's Blathers (フータ) at the desk, a tap's line (i18n
// museum.curator.*). His welcome the first time in a visit, then one of his lines, never the same twice running.
import { pickOne } from '#lib/random.ts';

/** The id a tap on the curator picks (curator.ts). */
export const CURATOR = 'curator';
/** His lines (museum.curator.0 …; .0 counts what's on show: {fish}, {bugs}; .6 the fossils, {fossils}; .7 the art,
 *  {art}; .10 how the art comes: a balloon's present now and then). */
const LINES = 11;

/** His line on a tap (an i18n key): `last` the one before (none yet: his welcome). */
export function curatorLine(r: () => number, last?: string): string {
  if (!last) return 'museum.curator.hello';
  return pickOne(Array.from({ length: LINES }, (_, i) => `museum.curator.${i}`).filter((k) => k !== last), r);
}
