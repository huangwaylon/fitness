// A menu item's picture (ADR 0022): official NH item art for the default menu (static/art/items), else a sprite by
// id (Sprites.svelte), else the section's own mark for an item someone added.
import type { MenuSection } from '#lib/types.ts';

const ART: Record<string, string> = {
  snack: 'items/snack',
  ice: 'items/ice',
  konbini: 'items/konbini',
  dessert: 'items/dessert',
  cafe: 'items/cafe',
  dinner: 'items/dinner',
  want: 'items/want',
  souvenir: 'items/souvenir',
  onsen: 'items/onsen',
  meal: 'items/meal',
  spa: 'items/spa',
  upgrade: 'items/upgrade'
};

/** The official art key for a default item, or null. */
export const itemArt = (id: string): string | null => ART[id] ?? null;

/** The section's mark (sprite id), for items without art and the section headers. */
export const sectionIcon = (section: MenuSection): string => (section === 'daily' ? 'i-ice' : 'i-plane');
