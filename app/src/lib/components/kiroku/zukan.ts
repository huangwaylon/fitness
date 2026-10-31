// The ずかん's catalog (docs/design.md "Zukan"): every fish, bug, fossil and shell the island has, in the game's order,
// with each entry's icon and name key. Pure; the panel's ずかん reads it with the model's finds (model/finds.ts).
import type { FindKind } from '#lib/contract/api.ts';
import { BUGS, FISH, critterArt } from '../island/critters.ts';
import { FOSSILS, SHELLS, findArt } from '../island/beach.ts';

export type ZukanKind = Exclude<FindKind, 'fragment'>;
export const ZUKAN_KINDS: readonly ZukanKind[] = ['fish', 'bug', 'fossil', 'shell'];

export interface Entry { id: string; art: string; name: string }

/** The entries of a kind: id, official icon key, i18n name key. */
export function entries(kind: ZukanKind): Entry[] {
  if (kind === 'fish') return Object.keys(FISH).map((id) => ({ id, art: critterArt(id as keyof typeof FISH), name: `critter.name.${id}` }));
  if (kind === 'bug') return Object.keys(BUGS).map((id) => ({ id, art: critterArt(id as keyof typeof BUGS), name: `critter.name.${id}` }));
  if (kind === 'fossil') return FOSSILS.map((id) => ({ id, art: findArt(id), name: `beach.name.${id}` }));
  return SHELLS.map(([id]) => ({ id, art: findArt(id), name: `beach.name.${id}` }));
}

/** A name as a list shows it: the English catalog's names carry an article for the catch line ("a sea bass"). */
export const bare = (name: string): string => name.replace(/^(an?|some) /, '');

/** The icon that stands for a kind on the summary card. */
export const KIND_ART: Record<ZukanKind, string> = {
  fish: critterArt('sea-bass'), bug: critterArt('common-butterfly'), fossil: findArt('ammonite'), shell: findArt('cowrie')
};
