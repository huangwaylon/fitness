// The guides' icons (the old site's lucide names, docs/travel.md "Data shape") as the glyphs the trip cards show: an
// emoji on a cream disc, as the NookPhone's apps; one for any name not listed.
const GLYPH: Record<string, string> = {
  'plane-landing': '🛬', 'plane-takeoff': '🛫', waves: '🌊', 'mountain-snow': '🏔️', mountain: '⛰️', car: '🚙', tent: '⛺',
  teacup: '🍵', shirt: '👕', sailboat: '⛵', pin: '📍', gift: '🎁', file: '📄', camera: '📷', sprout: '🌱', sparkles: '🎆',
  'shopping-bag': '🛍️', info: '💡', footprints: '👣', droplets: '💧', cart: '🛒', calendar: '🗓️', building: '🏙️'
};

/** The glyph for a guide's icon name. */
export const glyphOf = (icon: string): string => GLYPH[icon] ?? '📍';
