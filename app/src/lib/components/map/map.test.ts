// The maps' shared core, its pure parts (docs/design.md "Maps"): GeoJSON's few words, a tap's nearest feature, the
// one location dot, the saved places near a path and their layer's spec, the layer's one switch on this phone.
import { describe, expect, it, vi } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';
import { bboxOf, fc, ln, pt } from './geojson.ts';
import { nearestHit } from './hits.ts';
import { EMPTY, locData, locLayers, LOC_LAYERS, ZOOM } from './style.ts';
import { NEAR_M, NEAR_MAX, nearRoute } from './places/near.ts';
import { placesOn, setPlacesOn } from './places/setting.ts';
import { DEVICE } from '#lib/sync/storage.ts';

// (layer.ts's GL side reaches gl.ts, MapLibre's values: stood in for, its pure spec read alone)
vi.mock('./gl.ts', () => ({
  tapRouter: () => ({ add: () => () => {}, miss: () => () => {} }),
  setData: (map: { getSource(id: string): { setData(d: unknown): void } | undefined }, id: string, d: unknown) => map.getSource(id)?.setData(d)
}));
vi.mock('./gl-images.ts', () => ({ lazyImages: () => () => {}, canvasImage: () => ({ width: 0, height: 0, data: new Uint8ClampedArray() }) }));
const { placesLayer, placesLayers, SAVED, SQUARE_Z, tagOf } = await import('./places/layer.ts');

const styleOf = (layers: StyleSpecification['layers'], sources: StyleSpecification['sources']): StyleSpecification => ({ version: 8, sources, layers });

describe('GeoJSON', () => {
  it('a collection of points and lines, and the box round some points', () => {
    expect(fc([pt(1, 2, { id: 'a' }), ln([[0, 0], [1, 1]])])).toEqual({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { id: 'a' }, geometry: { type: 'Point', coordinates: [1, 2] } },
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }
      ]
    });
    expect(bboxOf([[139.7, 35.6], [139.9, 35.5], [139.8, 35.7]])).toEqual([[139.7, 35.5], [139.9, 35.7]]);
    expect(bboxOf([])).toBeNull();
    // one point: a box of no size; any iterable (a generator: the track's points as they're read)
    expect(bboxOf([[139.7, 35.6]])).toEqual([[139.7, 35.6], [139.7, 35.6]]);
    expect(bboxOf((function* () { yield [1, 2]; yield [-1, 3]; })())).toEqual([[-1, 2], [1, 3]]);
  });
});

describe('a tap', () => {
  it('goes to the nearest feature on screen; one with no point never wins; ties to the first', () => {
    const at = { x: 100, y: 100 };
    const fs = [{ id: 'far', p: { x: 120, y: 100 } }, { id: 'line', p: null }, { id: 'near', p: { x: 95, y: 104 } }, { id: 'tie', p: { x: 104, y: 95 } }];
    expect(nearestHit(fs, at, (f) => f.p)?.id).toBe('near');
    expect(nearestHit([{ id: 'line', p: null }], at, (f) => f.p)).toBeUndefined();
    expect(nearestHit([], at, () => at)).toBeUndefined();
  });
});

describe('the location dot', () => {
  it('is a valid style: halo, edge, dot, sky; a stale fix grey', () => {
    const s = styleOf(locLayers('loc', 35), { loc: { ...EMPTY } });
    expect(validateStyleMin(s).map((e) => e.message)).toEqual([]);
    expect(s.layers.map((l) => l.id)).toEqual([LOC_LAYERS.halo, LOC_LAYERS.edge, LOC_LAYERS.dot]);
    const dot = s.layers[2] as { paint: Record<string, unknown> };
    expect(dot.paint['circle-color']).toEqual(['case', ['to-boolean', ['get', 'stale']], '#FFFFFF', '#4F9BE0']);
    expect(locData({ lon: 139, lat: 35, acc: 12 }, true).features[0].properties).toEqual({ acc: 12, stale: true });
    expect(locData({ lon: 139, lat: 35, acc: 12 }).features[0].properties).toEqual({ acc: 12 });
    expect(locData(null).features).toEqual([]);
    expect(ZOOM).toEqual({ min: 4, max: 18 });
  });
});

describe('the saved places near a path', () => {
  it('within 2 km, nearest first, at most 40', () => {
    expect([NEAR_M, NEAR_MAX]).toEqual([2000, 40]);
    // a path along the equator at 0..0.1°; places 0.001° (~111 m) a step north of its start
    const path = [[0, 0], [0.05, 0], [0.1, 0]];
    const rows = Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, lng: 0.05, lat: (60 - i) * 0.0003 }));
    const near = nearRoute(rows, path);
    expect(near).toHaveLength(40);
    expect(near[0].id).toBe('p59');
    expect(nearRoute([{ id: 'far', lng: 0.05, lat: 0.05 }], path)).toEqual([]);
    expect(nearRoute(rows, [])).toEqual([]);
  });
});

describe('the saved places layer', () => {
  it('is a valid style: squares from z10, their glyph from z12, at 0.85; the chosen one ringed, its name where there is a font', () => {
    const sources = { [SAVED.src]: { ...EMPTY }, [SAVED.selSrc]: { ...EMPTY } };
    const named = placesLayers({ font: ['Zen Maru Gothic Bold'] });
    expect(validateStyleMin({ ...styleOf(named, sources), 'font-faces': { 'Zen Maru Gothic Bold': [{ url: 'https://example.test/a.woff2', 'unicode-range': ['U+0-FF'] }] } } as StyleSpecification).map((e) => e.message)).toEqual([]);
    expect(validateStyleMin(styleOf(placesLayers(), sources)).map((e) => e.message)).toEqual([]);
    const [sq, sel] = named as { id: string; minzoom?: number; layout: Record<string, unknown>; paint: Record<string, unknown> }[];
    expect([sq.id, sq.minzoom, sq.paint['icon-opacity']]).toEqual([SAVED.layer, SQUARE_Z.min, 0.85]);
    expect(sq.layout['icon-image']).toEqual(['step', ['zoom'], 'tp-sq', 12, ['concat', 'tp-', ['get', 'cat']]]);
    expect(sq.layout['icon-size']).toEqual(['step', ['zoom'], 10 / 16, 12, 14 / 16]);
    expect((placesLayers({ small: true })[0] as { layout: Record<string, unknown> }).layout['icon-size']).toEqual(['step', ['zoom'], 10 / 16, 12, 12 / 16]);
    // the basemap's labels make room for them unless told not to
    expect(sq.layout['icon-ignore-placement']).toBe(false);
    expect((placesLayers({ yieldLabels: false })[0] as { layout: Record<string, unknown> }).layout['icon-ignore-placement']).toBe(true);
    expect([sel.id, sel.layout['text-field'], sel.layout['text-anchor']]).toEqual([SAVED.sel, ['get', 'name'], 'bottom']);
    expect((placesLayers()[1] as { layout: Record<string, unknown> }).layout['text-field']).toBeUndefined();
  });

  it('on a map: added once its style is in, under `before`; drawn only on a change; hidden, smaller, the chosen one', () => {
    const data = new Map<string, unknown[]>(), layout: [string, string, unknown][] = [], added: [string, string | undefined][] = [];
    const on: Record<string, () => void> = {};
    const map = {
      style: { _loaded: false },
      on: (ev: string, f: () => void) => void (on[ev] = f),
      getSource: (id: string) => (data.has(id) ? { setData: (d: unknown) => data.get(id)!.push(d) } : undefined),
      addSource: (id: string) => void data.set(id, []),
      getLayer: (id: string) => id === 'wpts',
      addLayer: (l: { id: string }, before?: string) => void added.push([l.id, before]),
      setLayoutProperty: (id: string, k: string, v: unknown) => void layout.push([id, k, v]),
      queryRenderedFeatures: (o: { layers: string[] }) =>
        o.layers[0] === SAVED.sel ? [{ properties: { name: 'A' } }] : [1, 2].map((k) => ({ properties: { id: `p${k}` }, geometry: { coordinates: [k, k] } })),
      project: ([x, y]: [number, number]) => ({ x: x * 10.4, y: y * 10 })
    };
    const l = placesLayer(map as never, { before: 'wpts' });
    const a = { id: 'a', lng: 139, lat: 35, cat: 'カフェ' as const, name: 'A' };
    l.set([a], true, false);
    expect([data.size, l.state()]).toEqual([0, { squares: [], tag: '' }]);
    on['style.load']();
    expect(added).toEqual([[SAVED.layer, 'wpts'], [SAVED.sel, 'wpts']]);
    expect(data.get(SAVED.src)).toHaveLength(1);
    l.set([a], false, true);
    expect(data.get(SAVED.src)).toHaveLength(1);
    expect(layout.slice(-3)).toEqual([[SAVED.layer, 'visibility', 'none'], [SAVED.sel, 'visibility', 'none'], [SAVED.layer, 'icon-size', ['step', ['zoom'], 10 / 16, 12, 12 / 16]]]);
    expect(l.state().squares).toEqual([]);
    l.set([a], true, true);
    expect(l.state()).toEqual({ squares: [['p1', 10, 10], ['p2', 21, 20]], tag: 'A' });
    l.select(a);
    expect((data.get(SAVED.selSrc)!.at(-1) as { features: { properties: unknown }[] }).features[0].properties).toEqual({ cat: 'カフェ', name: 'A' });
    // a WebGL context lost (the style gone: nothing drawn), restored (its snapshot loaded again): the change since drawn
    on.webglcontextlost();
    l.set([a, { ...a, id: 'b' }], true, true);
    expect(data.get(SAVED.src)).toHaveLength(1);
    on['style.load']();
    expect([data.get(SAVED.src)!.length, added.length]).toEqual([2, 2]);
    l.destroy();
    expect(l.state().squares).toEqual([]);
    on['style.load']();
    expect(data.get(SAVED.src)).toHaveLength(2);
  });

  it('the chosen one\'s tag: a long name cut to 23 and …, by code point', () => {
    expect(tagOf('てすと温泉')).toBe('てすと温泉');
    expect(tagOf('あ'.repeat(24))).toBe('あ'.repeat(24));
    expect(tagOf('🍜'.repeat(30))).toBe(`${'🍜'.repeat(23)}…`);
  });

  it('its one switch: on by default, the trail map\'s old key read when the new one is unset, a change kept under the new', () => {
    const store = new Map<string, string>();
    const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    expect(placesOn(kv)).toBe(true);
    store.set(DEVICE.trailPlaces, 'false');
    expect(placesOn(kv)).toBe(false);
    setPlacesOn(kv, true);
    expect([store.get(DEVICE.mapPlaces), placesOn(kv)]).toEqual(['true', true]);
    expect(placesOn(null)).toBe(true);
    // the new key, once set, wins over the old either way; one unreadable is unset (the old key's, then on)
    setPlacesOn(kv, false);
    store.set(DEVICE.trailPlaces, 'true');
    expect(placesOn(kv)).toBe(false);
    store.set(DEVICE.mapPlaces, '{');
    expect(placesOn(kv)).toBe(true);
    store.set(DEVICE.trailPlaces, 'false');
    expect(placesOn(kv)).toBe(false);
  });
});
