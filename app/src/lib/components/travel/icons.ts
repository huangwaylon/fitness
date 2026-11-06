// The guides' icons (the old site's lucide names, docs/travel.md "Data shape"), one table: the glyph the trip cards
// show (an emoji on a cream disc, as the NookPhone's apps) and, for the packing list's categories, the NH catalogue
// art when there is some.
const ICONS: Record<string, { glyph: string; art?: string }> = {
  'plane-landing': { glyph: '🛬' }, 'plane-takeoff': { glyph: '🛫' }, waves: { glyph: '🌊', art: 'finds/items/surfboard' },
  'mountain-snow': { glyph: '🏔️' }, mountain: { glyph: '⛰️', art: 'finds/items/mountain-parka' }, car: { glyph: '🚙' },
  tent: { glyph: '⛺', art: 'finds/items/camp-stove' }, teacup: { glyph: '🍵' }, shirt: { glyph: '👕', art: 'finds/items/pocket-tee' },
  sailboat: { glyph: '⛵' }, pin: { glyph: '📍', art: 'finds/items/sturdy-paper-bag' }, gift: { glyph: '🎁', art: 'deco/present' },
  file: { glyph: '📄', art: 'finds/items/antique-map' }, camera: { glyph: '📷', art: 'finds/items/slr-camera' }, sprout: { glyph: '🌱' },
  sparkles: { glyph: '🎆' }, 'shopping-bag': { glyph: '🛍️', art: 'finds/items/shopping-bag' }, info: { glyph: '💡' },
  footprints: { glyph: '👣', art: 'finds/items/trekking-shoes' }, droplets: { glyph: '💧' }, cart: { glyph: '🛒', art: 'finds/items/shopping-cart' },
  calendar: { glyph: '🗓️' }, building: { glyph: '🏙️' }
};

/** The glyph for a guide's icon name (a pin for any not listed). */
export const glyphOf = (icon: string): string => ICONS[icon]?.glyph ?? '📍';

/** A packing category's icon: its NH art, an emoji as itself (one the guest picked), any other name a bag. */
export function iconOf(icon: string): { art: string } | { emoji: string } {
  const art = ICONS[icon]?.art;
  if (art) return { art };
  return /^[a-z][a-z0-9-]*$/.test(icon) || !icon ? { art: ICONS['shopping-bag'].art! } : { emoji: icon };
}
