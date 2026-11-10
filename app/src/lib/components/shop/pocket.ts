// The pocket's table (docs/design.md "The shop"): every tally key the shop's うる can show (contract/pocket.ts's kinds),
// its section, its name's i18n key and its official icon, one place for all. Prices are the record's
// (contract/shopPrices.ts); the names load with the catch names (i18n/catch.ts).
import { GOODS, type PocketKind } from '#lib/contract/pocket.ts';
import { CROPS } from '#lib/contract/farm.ts';

/** うる's sections, in its order (NH's pocket-ish: the critters, the beach, the trees' and the ground's). */
export const SECTIONS = ['bug', 'fish', 'sea', 'shell', 'material', 'fruit', 'veg', 'fossil', 'other'] as const;
type Section = (typeof SECTIONS)[number];

/** The goods by section (anything else is その他: mushrooms, eggs, junk), and their icons where not `finds/<id>`. */
const GOODS_SECTION: Readonly<Record<string, Section>> = {
  wood: 'material', softwood: 'material', hardwood: 'material', 'tree-branch': 'material', weeds: 'material',
  apple: 'fruit', pear: 'fruit', peach: 'fruit', cherry: 'fruit', coconut: 'fruit',
  // the fields' (contract/farm.ts): the vegetables and their starts
  ...Object.fromEntries(CROPS.flatMap((c) => [[c, 'veg'], [`${c}-start`, 'veg']]))
};
const GOODS_ART: Readonly<Record<string, string>> = {
  apple: 'fruit/apple', pear: 'fruit/pear', peach: 'fruit/peach', cherry: 'fruit/cherry',
  boot: 'critters/boot', 'old-tire': 'critters/old-tire', 'empty-can': 'critters/empty-can'
};

export interface PocketItem {
  key: string;
  section: Section;
  /** The name's i18n key (the catch catalog's). */
  name: string;
  /** The official icon's art key. */
  art: string;
}

/** A tally key as the pocket shows it, or null when it isn't one of the pocket's (a present's piece, a bad key). */
export function pocketItem(key: string): PocketItem | null {
  const i = key.indexOf(':');
  const kind = key.slice(0, i) as PocketKind, id = key.slice(i + 1);
  switch (kind) {
    case 'fish':
    case 'bug':
      return { key, section: kind, name: `critter.name.${id}`, art: `critters/${id}` };
    case 'sea':
      return { key, section: 'sea', name: `sea.name.${id}`, art: `critters/${id}` };
    case 'shell':
    case 'fossil':
      return { key, section: kind, name: `beach.name.${id}`, art: `finds/${id}` };
    case 'fragment':
      return { key, section: 'other', name: `beach.name.${id}`, art: `finds/${id}` };
    case 'goods':
      if (!Object.hasOwn(GOODS, id)) return null;
      return { key, section: GOODS_SECTION[id] ?? 'other', name: id in GOODS_ART && GOODS_ART[id].startsWith('critters/') ? `critter.name.${id}` : `beach.name.${id}`, art: GOODS_ART[id] ?? `finds/${id}` };
    default:
      return null;
  }
}
