// The packing list as PackList draws it (docs/travel.md "Packing list (relay)"), pure: each category with my count of
// it, each item's text in the reader's language (else the other side), my tick, the chips of who has packed it (the
// two members always, lit when packed; the guest's only once it has ticked), and what I may change (the members
// anything, the guest only what it added). And the 「じゅんび OK！」 stamp's one celebration per trip and person.
import type { L, PackCat, PackItem } from '#lib/contract/pack.ts';
import { packMayEdit } from '#lib/contract/pack.ts';
import type { Who } from '#lib/types.ts';

type Locale = 'ja' | 'en';

/** A text pair in the reader's language, else the other side. */
export const pick = (l: L | undefined, locale: Locale): string => (l ? (l[locale] ?? l[locale === 'ja' ? 'en' : 'ja'] ?? '') : '');

/** Whether `me` may rename, move or remove it: the members anything, the guest only what it added (a category only
 *  when every item in it is its own too). */
export function mayEditAs(me: Who, x: PackItem | PackCat): boolean {
  if (!packMayEdit(me, x)) return false;
  return !('items' in x) || me !== 'G' || x.items.every((i) => i.by === 'G');
}

/** A chip of who has packed an item: the members' always (`on` when packed), the guest's only when it has. */
export interface PackChip { who: Who; on: boolean }
export function chipsOf(ticks: readonly Who[]): PackChip[] {
  const out: PackChip[] = [{ who: 'A', on: ticks.includes('A') }, { who: 'B', on: ticks.includes('B') }];
  if (ticks.includes('G')) out.push({ who: 'G', on: true });
  return out;
}

interface PackRowView { id: string; text: string; note: string; mine: boolean; chips: PackChip[]; editable: boolean; item: PackItem }
export interface PackCatView { id: string; name: string; icon: string; mine: number; total: number; editable: boolean; rows: PackRowView[]; cat: PackCat }

export function packView(list: readonly PackCat[], me: Who, locale: Locale): PackCatView[] {
  return list.map((cat) => {
    const rows = cat.items.map((item) => ({
      id: item.id, text: pick(item.name, locale), note: pick(item.note, locale), mine: item.ticks.includes(me), chips: chipsOf(item.ticks),
      editable: mayEditAs(me, item), item
    }));
    return { id: cat.id, name: pick(cat.name, locale), icon: cat.icon, mine: rows.filter((r) => r.mine).length, total: rows.length, editable: mayEditAs(me, cat), rows, cat };
  });
}

/** My overall progress: how many of how many, and whether that's everything (a list with nothing in it isn't). */
export function myProgress(view: readonly PackCatView[]): { mine: number; total: number; done: boolean } {
  let mine = 0, total = 0;
  for (const c of view) (mine += c.mine), (total += c.total);
  return { mine, total, done: total > 0 && mine === total };
}

/** The guides' category icons (lucide names, docs/travel.md "Data shape") as NH catalogue icons; an emoji as itself. */
const ICON_ART: Record<string, string> = {
  file: 'finds/items/antique-map',
  shirt: 'finds/items/pocket-tee',
  waves: 'finds/items/surfboard',
  tent: 'finds/items/camp-stove',
  camera: 'finds/items/slr-camera',
  cart: 'finds/items/shopping-cart',
  pin: 'finds/items/sturdy-paper-bag',
  footprints: 'finds/items/trekking-shoes',
  mountain: 'finds/items/mountain-parka',
  gift: 'deco/present',
  'shopping-bag': 'finds/items/shopping-bag'
};
export function iconOf(icon: string): { art: string } | { emoji: string } {
  if (ICON_ART[icon]) return { art: ICON_ART[icon] };
  // a name we have no art for is a bag; anything else (not a lucide-style name) is an emoji
  return /^[a-z][a-z0-9-]*$/.test(icon) || !icon ? { art: ICON_ART['shopping-bag'] } : { emoji: icon };
}

/** The 「じゅんび OK！」 celebration's mark: one per trip and person on a phone. */
const stampKey = (who: Who, trip: string): string => `${who}|${trip}`;
/** Whether this completion is the one to celebrate (not yet in `seen`), and `seen` with it. */
export function celebrate(seen: readonly string[], who: Who, trip: string): { now: boolean; seen: string[] } {
  const k = stampKey(who, trip);
  return seen.includes(k) ? { now: false, seen: [...seen] } : { now: true, seen: [...seen, k].slice(-24) };
}
