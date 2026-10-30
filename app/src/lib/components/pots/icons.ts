// A menu item's picture (Sprites.svelte): the defaults by id, or the pot's own mark for an item someone added.
import type { PotKey } from '#lib/types.ts';

const BY_ID: Record<string, string> = {
  snack: 'i-snack',
  ice: 'i-ice',
  cafe: 'i-cafe',
  dinner: 'i-yakiniku',
  daytrip: 'i-hike',
  onsen: 'i-onsen',
  weekend: 'i-bag',
  abroad: 'i-plane'
};

/** The sprite id for an item (`i-…`), falling back to the pot's mark. */
export function itemIcon(pot: PotKey, id: string): string {
  return BY_ID[id] ?? (pot === 'treat' ? 'i-gift' : 'i-plane');
}
