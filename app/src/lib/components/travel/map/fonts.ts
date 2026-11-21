// The map's one font: Zen Maru Gothic Bold, the app's own (docs/design.md "Type"), drawn by MapLibre from the style's
// `font-faces` (each a woff2 with its unicode-range, fetched only once a label needs one of its characters, then
// rasterised on the phone). So Japanese and Latin labels are the same round face as the chrome: the app's own subsets
// first (fonts.css's, precached: kana, 常用, the app's other kanji, each by its exact characters: MapLibre takes the
// first face whose range holds one), then @fontsource's slices for a place name's rarer kanji. The style has no glyphs
// URL: a character no face covers (Cyrillic: its 700 isn't built) is drawn in a local font.
import type { FontFacesSpecification } from 'maplibre-gl';
import ranges from '@fontsource/zen-maru-gothic/unicode.json';
import own from '#lib/styles/fonts/ranges.json';
import kana from '#lib/styles/fonts/zen-maru-gothic-700-kana.woff2?url';
import joyo from '#lib/styles/fonts/zen-maru-gothic-700-joyo.woff2?url';
import extra from '#lib/styles/fonts/zen-maru-gothic-700-extra.woff2?url';

export const FONT = 'Zen Maru Gothic Bold';

// (not the whole-font `japanese` file, 1.5 MB: no unicode.json range names it, so it was only ever deployed)
const files = import.meta.glob(['../../../../../node_modules/@fontsource/zen-maru-gothic/files/zen-maru-gothic-*-700-normal.woff2', '!**/zen-maru-gothic-japanese-700-normal.woff2', '!**/zen-maru-gothic-cyrillic-700-normal.woff2'], {
  query: '?url', import: 'default', eager: true
}) as Record<string, string>;

/** `[2]` → `2`, `latin-ext` stays. */
const slice = (k: string) => k.replace(/^\[(\d+)\]$/, '$1');

export function fontFaces(base = typeof location === 'undefined' ? 'http://localhost/' : location.href): FontFacesSpecification {
  const byName = new Map(Object.entries(files).map(([p, url]) => [/zen-maru-gothic-(.+)-700-normal\.woff2$/.exec(p)![1], url]));
  const face = (url: string, r: string) => ({ url: new URL(url, base).href, 'unicode-range': r.split(',').map((s) => s.trim()) });
  const slices = Object.entries(ranges as Record<string, string>)
    .map(([k, r]) => ({ k: slice(k), r }))
    .filter(({ k }) => byName.has(k) && k !== 'greek')
    .map(({ k, r }) => face(byName.get(k)!, r));
  return { [FONT]: [face(kana, own.kana), face(joyo, own.joyo), face(extra, own.extra), ...slices] };
}
