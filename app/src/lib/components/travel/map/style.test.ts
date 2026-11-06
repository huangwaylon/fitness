// The trip map's style (docs/travel.md "Maps"): a valid MapLibre style, labels in the reader's locale in the app's
// font, the NookPhone palette, the overlays in the day colours, the attribution the licences ask for.
import { describe, expect, it } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { labelField } from './basemap.ts';
import { FONT, fontFaces } from './fonts.ts';
import { BASEMAP, buildStyle, haloRadius, labelLayers, overlayLayers, SRC } from './style.ts';
import { NOOK } from './theme.ts';

const BASE = 'https://example.test/fitness/';
const style = (locale: 'ja' | 'en' = 'ja') => buildStyle(locale, fontFaces(BASE));

describe('the map style', () => {
  it('is a valid style (the spec validator), with the font faces', () => {
    expect(validateStyleMin(style()).map((e) => e.message)).toEqual([]);
    expect(validateStyleMin(style('en')).map((e) => e.message)).toEqual([]);
  });

  it('labels in the reader\'s locale: its own name, then (English) the Latin one, then the local name', () => {
    expect(labelField('ja')).toEqual(['coalesce', ['get', 'name:ja'], ['get', 'name']]);
    expect(labelField('en')).toEqual(['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]);
    const s = style('en');
    const ids = labelLayers(s);
    expect(ids.length).toBeGreaterThan(8);
    for (const l of s.layers.filter((x) => ids.includes(x.id))) {
      const layout = (l as { layout: Record<string, unknown> }).layout;
      expect(layout['text-field'], l.id).toEqual(labelField('en'));
      expect(layout['text-max-width'], l.id).toBe(9);
      // one font, the app's; no italics, no capitals
      expect(layout['text-font'], l.id).toEqual([FONT]);
      expect(layout['text-transform'], l.id).toBeUndefined();
    }
  });

  it('wraps Japanese labels at 12 ems, so a name like エメラルドビーチ stays whole', () => {
    const s = style('ja');
    for (const l of s.layers.filter((x) => labelLayers(s).includes(x.id))) expect((l as { layout: Record<string, unknown> }).layout['text-max-width'], l.id).toBe(12);
  });

  it('draws with the app\'s Zen Maru Gothic (Latin first, every Japanese slice), no glyphs URL', () => {
    const faces = fontFaces(BASE)[FONT] as { url: string; 'unicode-range': string[] }[];
    expect(faces.length).toBeGreaterThan(100);
    expect(faces[0]['unicode-range'][0]).toBe('U+0000-00FF');
    for (const f of faces) expect(f.url).toMatch(/^https:\/\/example\.test\/.+\.woff2/);
    expect(style().glyphs).toBeUndefined();
  });

  it('is the NookPhone palette: the sea, the land, sand and the roads from the theme; no sprite, no basemap icons', () => {
    const s = style();
    const paint = (id: string) => (s.layers.find((l) => l.id === id) as { paint: Record<string, unknown> }).paint;
    expect(paint('water')['fill-color']).toBe(NOOK.sea);
    expect(paint('land')['background-color']).toBe(NOOK.land);
    expect(paint('landcover-sand')['fill-color']).toBe(NOOK.sand);
    expect(paint('road-minor')['line-color']).toBe(NOOK.road);
    expect(paint('road-minor-casing')['line-color']).toBe(NOOK.roadCasing);
    expect(s.sprite).toBeUndefined();
    expect(s.layers.some((l) => 'source' in l && l.source === SRC.base && 'layout' in l && l.layout && Object.keys(l.layout).some((k) => k.startsWith('icon-')))).toBe(false);
  });

  it('reads OpenFreeMap\'s TileJSON with the attribution OpenStreetMap\'s licence asks for', () => {
    expect(style().sources[SRC.base]).toEqual(BASEMAP);
    expect(BASEMAP.url).toBe('https://tiles.openfreemap.org/planet');
    expect(BASEMAP.attribution).toContain('© OpenStreetMap');
    expect(BASEMAP.attribution).toContain('OpenMapTiles');
  });

  it('draws the legs over the roads and under the labels in the day colours: drive and bus solid, walk dashed, boat dotted', () => {
    const o = overlayLayers();
    const by = (id: string) => o.find((l) => l.id === id) as { paint: Record<string, unknown>; filter?: unknown };
    expect(by('legs-road').paint['line-color']).toEqual(['get', 'color']);
    expect(by('legs-road').paint['line-dasharray']).toBeUndefined();
    expect(by('legs-walk').paint['line-dasharray']).toEqual([1.4, 1.1]);
    expect(by('legs-boat').paint['line-dasharray']).toEqual([0, 1.8]);
    const ids = style().layers.map((l) => l.id);
    expect(ids.indexOf('legs-casing')).toBeGreaterThan(ids.indexOf('road-motorway'));
    expect(ids.indexOf('legs-boat')).toBeLessThan(ids.indexOf('label-water-point'));
    expect(ids.indexOf('cands')).toBeGreaterThan(ids.indexOf('label-city'));
    expect(ids.at(-1)).toBe('loc-dot');
    // the pins' room: invisible, over the labels, so they keep clear of the HTML pins
    const keep = o.find((l) => l.id === 'keepout') as { paint: Record<string, unknown>; layout: Record<string, unknown> };
    expect([keep.paint['icon-opacity'], keep.layout['icon-allow-overlap'], keep.layout['icon-ignore-placement']]).toEqual([0, true, false]);
  });

  it('sizes the accuracy halo in metres: 100 m at zoom 16 on the equator is ~84 px (512 px tiles)', () => {
    const e = haloRadius(0) as unknown[];
    const z0 = (e[4] as [string, unknown, number])[2];
    expect((100 / z0) * 2 ** 16).toBeCloseTo(83.7, 0);
    expect((haloRadius(60) as unknown[])[4]).toEqual(['/', ['get', 'acc'], z0 * Math.cos(Math.PI / 3)]);
  });
});
