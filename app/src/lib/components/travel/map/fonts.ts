// The map's one font: Zen Maru Gothic Bold, the app's own (docs/design.md "Type"), drawn by MapLibre from the style's
// `font-faces` (each @fontsource slice a woff2 with its unicode-range, fetched only once a label needs one of its
// characters, then rasterised on the phone). So Japanese and Latin labels are the same round face as the chrome. The
// style has no glyphs URL: a character no slice covers (Cyrillic, Greek: their slices left out) is drawn in a local
// font.
import type { FontFacesSpecification } from 'maplibre-gl';
import ranges from '@fontsource/zen-maru-gothic/unicode.json';

export const FONT = 'Zen Maru Gothic Bold';

const files = import.meta.glob('../../../../../node_modules/@fontsource/zen-maru-gothic/files/zen-maru-gothic-*-700-normal.woff2', {
  query: '?url', import: 'default', eager: true
}) as Record<string, string>;

/** `[2]` → `2`, `latin-ext` stays. */
const slice = (k: string) => k.replace(/^\[(\d+)\]$/, '$1');
/** The slices in the order MapLibre should try them: Latin first (most labels' digits and spaces), then the rest. */
const ORDER = (k: string) => (k === 'latin' ? 0 : k === 'latin-ext' ? 1 : 2);

export function fontFaces(base = typeof location === 'undefined' ? 'http://localhost/' : location.href): FontFacesSpecification {
  const byName = new Map(Object.entries(files).map(([p, url]) => [/zen-maru-gothic-(.+)-700-normal\.woff2$/.exec(p)![1], url]));
  const faces = Object.entries(ranges as Record<string, string>)
    .map(([k, r]) => ({ k: slice(k), r }))
    .filter(({ k }) => byName.has(k) && k !== 'cyrillic' && k !== 'greek')
    .sort((a, b) => ORDER(a.k) - ORDER(b.k))
    .map(({ k, r }) => ({ url: new URL(byName.get(k)!, base).href, 'unicode-range': r.split(',').map((s) => s.trim()) }));
  return { [FONT]: faces };
}
