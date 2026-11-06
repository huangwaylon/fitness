// ききみみ クイズ's cast: one voice per villager for good (docs/curriculum.md "American English first"; 12 US voices,
// 6 a gender, speech.ts SLOTS, scripts/tts/cast.json), the few UK and AU voices of the accent-exposure items, and the
// lookups every content file builds its rows with.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { CastId } from './bank.ts';

/** Who speaks with which cast voice, for good: a US voice for every villager (docs/curriculum.md "American English
 *  first", 2026-11-06; 12 US voices, speech.ts SLOTS, scripts/tts/cast.json). Levels 1-3's speakers and the units' are
 *  here too. The villagers who spoke UK or AU before, and some of the busiest US ones, moved onto the second six
 *  (us-f4…f6, us-m4…m6; us-f6 a light Southern and us-m6 a light New York voice) or the first six by character, the
 *  load spread (speech.test: no voice over a tenth) and dialogue partners never sharing a voice (bank.test). */
export const CAST: Readonly<Partial<Record<RosterId, CastId>>> = {
  bunnie: 'us-f1', rosie: 'us-f1', lily: 'us-f1', judy: 'us-f1',
  goldie: 'us-f2', audie: 'us-f2', label: 'us-f2',
  maple: 'us-f3', molly: 'us-f3', 'daisy-mae': 'us-f3', merengue: 'us-f3', fauna: 'us-f3',
  diana: 'us-f4', whitney: 'us-f4', ankha: 'us-f4',
  saharah: 'us-f5', celeste: 'us-f5', coco: 'us-f5',
  mabel: 'us-f6', cherry: 'us-f6',
  dom: 'us-m1', stitches: 'us-m1', 'kid-cat': 'us-m1', cj: 'us-m1', marshal: 'us-m1',
  'tom-nook': 'us-m2', orville: 'us-m2', hamlet: 'us-m2', gulliver: 'us-m2', wilbur: 'us-m2', kappn: 'us-m2',
  pietro: 'us-m3', bob: 'us-m3', anchovy: 'us-m3', 'kk-slider': 'us-m3', flick: 'us-m3', brewster: 'us-m3',
  punchy: 'us-m4', sherb: 'us-m4', kicks: 'us-m4', roald: 'us-m4',
  raymond: 'us-m5', julian: 'us-m5', blathers: 'us-m5',
  redd: 'us-m6', apollo: 'us-m6',
  // the content sprint's villagers (content/: もり, やま, ほし; 2026-11-06), the same rules
  bea: 'us-f1', nana: 'us-f2', pekoe: 'us-f3',
  olivia: 'us-f4', tasha: 'us-f4', freya: 'us-f4', vivian: 'us-f4', tia: 'us-f4', reneigh: 'us-f4', francine: 'us-f4',
  portia: 'us-f5', pashmina: 'us-f5', sylvia: 'us-f5', phoebe: 'us-f5', agnes: 'us-f5', marina: 'us-f5', gayle: 'us-f5',
  melba: 'us-f6', kitt: 'us-f6', faith: 'us-f6', charlise: 'us-f6', poppy: 'us-f6', tangy: 'us-f6', katt: 'us-f6', tammy: 'us-f6',
  walker: 'us-m1', frett: 'us-m3', admiral: 'us-m3',
  kidd: 'us-m4', bud: 'us-m4', genji: 'us-m4', al: 'us-m4', cyd: 'us-m4', lucky: 'us-m4', beau: 'us-m4', fang: 'us-m4', octavian: 'us-m4',
  keaton: 'us-m5', cyrano: 'us-m5', chief: 'us-m5', jacques: 'us-m5', curlos: 'us-m5', henry: 'us-m5', kabuki: 'us-m5', sterling: 'us-m5',
  wolfgang: 'us-m5',
  gruff: 'us-m6', tex: 'us-m6', curt: 'us-m6', static: 'us-m6', lopez: 'us-m6', shep: 'us-m6', ken: 'us-m6', teddy: 'us-m6', zucker: 'us-m6'
};

/** The few villagers who also speak UK or AU English, and only in an item tagged `accent-exposure` (やま and ほし, ≤ 10%
 *  of each: bank.test "accent policy"; source.ts puts the voice on). Their voices from before the American focus. */
export const EXPOSURE: Readonly<Partial<Record<RosterId, CastId>>> = {
  ankha: 'uk-f1', fauna: 'uk-f1', mabel: 'uk-f1', celeste: 'uk-f1', olivia: 'uk-f1', tasha: 'uk-f1', freya: 'uk-f1',
  vivian: 'uk-f1',
  raymond: 'uk-m1', julian: 'uk-m1', marshal: 'uk-m1', chief: 'uk-m1', kidd: 'uk-m1', curlos: 'uk-m1',
  blathers: 'uk-m2', apollo: 'uk-m2', tex: 'uk-m2', static: 'uk-m2',
  saharah: 'au-f1', whitney: 'au-f1', faith: 'au-f1', phoebe: 'au-f1', charlise: 'au-f1',
  curt: 'au-m1', genji: 'au-m1', gruff: 'au-m1',
  wilbur: 'au-m2', cyd: 'au-m2', walker: 'au-m2'
};

/** A villager's cast voice (CAST); a speaker without one is an authoring error. */
export function castFor(who: RosterId): CastId {
  const cast = CAST[who];
  if (!cast) throw new Error(`kikimimi: ${who} has no cast voice`);
  return cast;
}
