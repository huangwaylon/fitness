// The pictures the 3D island's `art` flourishes show (effects.ts FxImg): an official render or reaction by its art key
// (art.ts: the figure's box cut out of a padded render), or one drawn here, as the 2D island drew it: the ？ mark
// (ui/Mark.svelte's, its white outline) and Reese and Cyrus's heart float (Visitor's svg). Island3D's chunk.
import { art, artUrl } from '#lib/art.ts';
import type { FxImg } from './effects.ts';

const svg = (w: number, h: number, vb: string, body: string): string =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${body}</svg>`)}`;
/** Drawn ones by name (sized for a sharp texture: 4 px a unit of their viewBox). */
const DRAWN: Record<string, FxImg> = {
  'mark:question': {
    url: svg(160, 160, '0 0 40 40', '<g fill="#F5A623" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"><path d="M11.5 13 Q11.5 4 20.5 4 Q29 4 29 12 Q29 17 23.5 19.6 Q22.6 20.2 22.6 22 V24.6 H17 V21 Q17 17.2 20.6 15.6 Q23 14.4 23 12 Q23 9.6 20.4 9.6 Q17.6 9.6 17.4 13 Z"/><circle cx="19.8" cy="32" r="3.8"/></g>'),
    aspect: 1
  },
  // a pink heart balloon on a string, a highlight on its upper left (NH's soft item style)
  'heart-float': {
    url: svg(192, 256, '-24 -24 48 64', '<path d="M0 18 C-3 26 3 32 0 40" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.4"/><path d="M0 18 C-26 2 -20 -20 -8 -20 C-3 -20 0 -16 0 -12 C0 -16 3 -20 8 -20 C20 -20 26 2 0 18 Z" fill="#FF7FAE"/><path d="M-12 -12 C-9 -16 -5 -15 -4 -12" fill="none" stroke="#FFE3EE" stroke-width="3" stroke-linecap="round"/>'),
    aspect: 0.75
  }
};

/** The picture for art key (or drawn name) `key`, or null (no such art). */
export function fxImg(key: string | undefined): FxImg | null {
  if (!key) return null;
  if (DRAWN[key]) return DRAWN[key];
  const a = art(key), url = artUrl(key);
  if (!a || !url) return null;
  const b = a.box;
  return { url, aspect: b ? b[2] / b[3] : a.w / a.h, crop: b ? [b[0] / a.w, b[1] / a.h, b[2] / a.w, b[3] / a.h] : undefined };
}
