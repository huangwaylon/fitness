// The ずかん's catalog (docs/design.md "Zukan"): every fish, bug, fossil and shell the island has, in the game's order,
// with each entry's icon and name key. Pure; the panel's ずかん reads it with the model's finds (model/finds.ts).
import type { FindKind } from '#lib/contract/api.ts';
import { BUGS, FISH, critterArt } from '../island/critters.ts';
import { FOSSILS, FOSSIL_SETS, SHELLS, findArt } from '../island/beach.ts';

export type ZukanKind = Exclude<FindKind, 'fragment'>;
export const ZUKAN_KINDS: readonly ZukanKind[] = ['fish', 'bug', 'fossil', 'shell'];

export interface Entry { id: string; art: string; name: string }

/** The entries of a kind: id, official icon key, i18n name key. */
export function entries(kind: ZukanKind): Entry[] {
  if (kind === 'fish') return Object.keys(FISH).map((id) => ({ id, art: critterArt(id as keyof typeof FISH), name: `critter.name.${id}` }));
  if (kind === 'bug') return Object.keys(BUGS).map((id) => ({ id, art: critterArt(id as keyof typeof BUGS), name: `critter.name.${id}` }));
  if (kind === 'fossil') return FOSSILS.map(fossil);
  return SHELLS.map(([id]) => ({ id, art: findArt(id), name: `beach.name.${id}` }));
}
const fossil = (id: string): Entry => ({ id, art: findArt(id), name: `beach.name.${id}` });

/** A run of a page's entries: a fossil set (its name key) or the loose ones (no name). */
export interface Group { name: string | null; entries: Entry[] }

/** A kind's page as the ずかん lays it out: the fossils as NH's museum does (the standalone ones, then each dinosaur's
 *  pieces together under its name, 「Tレックス 2/3」); any other kind is one run. */
export function groups(kind: ZukanKind): Group[] {
  if (kind !== 'fossil') return [{ name: null, entries: entries(kind) }];
  const inSets = new Set<string>(Object.values(FOSSIL_SETS).flat());
  return [
    { name: null, entries: FOSSILS.filter((id) => !inSets.has(id)).map(fossil) },
    ...Object.entries(FOSSIL_SETS).map(([set, ids]) => ({ name: `fossil.set.${set}`, entries: ids.map(fossil) }))
  ];
}

/** A name as a list shows it: the English catalog's names carry an article for the catch line ("a sea bass"). */
export const bare = (name: string): string => name.replace(/^(an?|some) /, '');

/** The icon that stands for a kind on the summary card. */
export const KIND_ART: Record<ZukanKind, string> = {
  fish: critterArt('sea-bass'), bug: critterArt('common-butterfly'), fossil: findArt('ammonite'), shell: findArt('cowrie')
};
