// A reward's picture: official NH item art (static/art/items): soft serve for おやつ, shoyu ramen for 外食.
import type { ShopItemId } from '#lib/types.ts';

const ART: Record<ShopItemId, string> = { snack: 'items/snack', dinner: 'items/dinner' };

export const itemArt = (id: ShopItemId): string => ART[id];
