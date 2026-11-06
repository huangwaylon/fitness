// The packing list as PackList draws it (docs/travel.md "Packing list (relay)"), pure: each category with my count of
// it, each item's text in the reader's language (else the other side), my tick, who has packed it, and what I may
// change (contract/pack.ts packMayEdit; nothing before I'm known), and a category's icon (its NH item, else ours).
import { packMayEdit, type PackCat, type PackItem } from '#lib/contract/pack.ts';
import type { Locale } from '#lib/i18n/index.ts';
import type { Who } from '#lib/types.ts';
import { isIcon } from '../ui/Icon.svelte';
import { pick } from './text.ts';

interface PackRowView { id: string; text: string; note: string; mine: boolean; editable: boolean; item: PackItem }
export interface PackCatView { id: string; name: string; icon: string; mine: number; total: number; editable: boolean; rows: PackRowView[]; cat: PackCat }

/** `me` null: not known yet (the week's view still loading): nothing is mine, nothing editable. */
export function packView(list: readonly PackCat[], me: Who | null, locale: Locale): PackCatView[] {
  const may = (x: PackItem | PackCat) => !!me && packMayEdit(me, x);
  return list.map((cat) => {
    const rows = cat.items.map((item) => ({
      id: item.id, text: pick(item.name, locale), note: pick(item.note, locale), mine: !!me && item.ticks.includes(me), editable: may(item), item
    }));
    return { id: cat.id, name: pick(cat.name, locale), icon: cat.icon, mine: rows.filter((r) => r.mine).length, total: rows.length, editable: may(cat), rows, cat };
  });
}

/** My overall progress: how many of how many, and whether that's everything (a list with nothing in it isn't). */
export function myProgress(view: readonly PackCatView[]): { mine: number; total: number; done: boolean } {
  let mine = 0, total = 0;
  for (const c of view) (mine += c.mine), (total += c.total);
  return { mine, total, done: total > 0 && mine === total };
}

/** A name cut to `max` characters (code points) with an ellipsis, for a one-line banner. */
export function clip(s: string, max: number): string {
  const cs = Array.from(s);
  return cs.length <= max ? s : `${cs.slice(0, max - 1).join('').trimEnd()}…`;
}

/** The packing categories' NH items (docs/design.md "Unified kit": the only NH art in the sheets), by the guide's icon
 *  name: 書類 the scrapbook, 服装 the pocket tee, 登山 the lace-up boots, 電子機器 the SLR camera, 手土産 the present,
 *  基本 the toothbrush and cup, 海遊び the goggles, キャンプ the sleeping bag, 現地調達 the shopping basket, Hiking the
 *  trekking shoes. */
const CAT_ART: Record<string, string> = {
  file: 'finds/items/scrapbook',
  shirt: 'finds/items/pocket-tee',
  mountain: 'finds/items/lace-up-boots',
  camera: 'finds/items/slr-camera',
  gift: 'deco/present',
  pin: 'finds/items/toothbrush-and-cup-set',
  waves: 'finds/items/goggles',
  tent: 'finds/items/sleeping-bag',
  cart: 'finds/items/shopping-basket',
  footprints: 'finds/items/trekking-shoes'
};

/** A category's icon: an emoji the guest picked as itself; a guide's name its NH item (CAT_ART), else drawn by the
 *  kit's Icon, any name it lacks a bag. */
export function catIcon(s: string): { emoji: string } | { art: string } | { icon: string } {
  if (s && !/^[a-z][a-z0-9-]*$/.test(s)) return { emoji: s };
  if (CAT_ART[s]) return { art: CAT_ART[s] };
  return { icon: isIcon(s) ? s : 'shopping-bag' };
}
