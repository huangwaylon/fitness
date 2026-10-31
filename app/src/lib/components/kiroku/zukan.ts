// The ずかん's catalog (docs/design.md "Zukan"): every fish (the sea's and the pond's), bug, sea creature, fossil and shell the island has, in the game's order,
// with each entry's icon and name key. Pure; the panel's ずかん reads it with the model's finds (model/finds.ts).
import type { FindKind } from '#lib/contract/api.ts';
import { BUGS, FISH, critterArt, type Catch } from '../island/critters.ts';
import { POND_FISH } from '../island/pondFish.ts';
import { FOSSILS, FOSSIL_SETS, SHELLS, findArt } from '../island/beach.ts';
import { PEARL, SEA } from '../island/sea.ts';

export type ZukanKind = Exclude<FindKind, 'fragment'>;
export const ZUKAN_KINDS: readonly ZukanKind[] = ['fish', 'bug', 'sea', 'fossil', 'shell'];

export interface Entry { id: string; art: string; name: string }

/** Every fish, the pond's and the sea's, in NH's critterpedia order (the freshwater fish first, as the game lists them). */
const NH_FISH_ORDER = [
  'bitterling', 'pale-chub', 'crucian-carp', 'dace', 'carp', 'koi', 'goldfish', 'pop-eyed-goldfish', 'ranchu-goldfish', 'killifish',
  'crawfish', 'soft-shelled-turtle', 'snapping-turtle', 'tadpole', 'frog', 'freshwater-goby', 'loach', 'catfish', 'giant-snakehead',
  'bluegill', 'yellow-perch', 'black-bass', 'tilapia', 'pike', 'pond-smelt', 'sweetfish', 'cherry-salmon', 'char', 'golden-trout',
  'stringfish', 'salmon', 'king-salmon', 'mitten-crab', 'guppy', 'nibble-fish', 'angelfish', 'betta', 'neon-tetra', 'rainbowfish',
  'piranha', 'arowana', 'dorado', 'gar', 'arapaima', 'saddled-bichir', 'sturgeon', 'sea-butterfly', 'sea-horse', 'clownfish',
  'surgeonfish', 'butterfly-fish', 'napoleonfish', 'zebra-turkeyfish', 'blowfish', 'puffer-fish', 'anchovy', 'horse-mackerel', 'barred-knifejaw',
  'sea-bass', 'red-snapper', 'dab', 'olive-flounder', 'squid', 'moray-eel', 'ribbon-eel', 'tuna', 'blue-marlin', 'giant-trevally',
  'mahi-mahi', 'ocean-sunfish', 'ray', 'saw-shark', 'hammerhead-shark', 'great-white-shark', 'whale-shark', 'suckerfish',
  'football-fish', 'oarfish', 'barreleye', 'coelacanth'
] as const;
const FISH_ORDER: Catch[] = NH_FISH_ORDER.filter((id) => id in FISH || id in POND_FISH);

/** The entries of a kind: id, official icon key, i18n name key. */
export function entries(kind: ZukanKind): Entry[] {
  if (kind === 'fish') return FISH_ORDER.map((id) => ({ id, art: critterArt(id), name: `critter.name.${id}` }));
  if (kind === 'bug') return Object.keys(BUGS).map((id) => ({ id, art: critterArt(id as keyof typeof BUGS), name: `critter.name.${id}` }));
  if (kind === 'sea') return Object.keys(SEA).map((id) => ({ id, art: critterArt(id as keyof typeof SEA), name: `sea.name.${id}` }));
  if (kind === 'fossil') return FOSSILS.map(fossil);
  // the beach's shells, then the pearl from diving
  return [...SHELLS.map(([id]) => id), PEARL].map((id) => ({ id, art: findArt(id), name: `beach.name.${id}` }));
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
  fish: critterArt('sea-bass'), bug: critterArt('common-butterfly'), sea: critterArt('octopus'), fossil: findArt('ammonite'),
  shell: findArt('cowrie')
};
