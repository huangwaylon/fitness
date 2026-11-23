// The maps' core on a stand-in map (map/gl.ts, MapLibre's values stood in for): the one tap router (the nearest
// feature of the live routes' layers, else a miss), the mode a map tells (offline only after FAILS_OFFLINE tiles in a
// row, the first tile told once, a lost context), and the reveal over a floating card (a pan only if it's under it).
import { describe, expect, it, vi } from 'vitest';

vi.mock('maplibre-gl', () => ({ addProtocol: () => {}, AttributionControl: class {}, getGlobalDispatcher: () => ({}), Map: class {}, setWorkerUrl: () => {} }));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '' }));
const { revealAbove, tapRouter, watchMode } = await import('./gl.ts');

type F = { layer: { id: string }; geometry: { type: string; coordinates: number[] } };
/** A stand-in map: its handlers, the features a box query finds, project = the coordinates as px. */
function fakeMap(features: F[] = [], layers = ['a', 'b']) {
  const on: Record<string, ((e: unknown) => void)[]> = {};
  const panned: number[][] = [];
  const map = {
    on: (k: string, f: (e: unknown) => void) => void (on[k] ??= []).push(f),
    getLayer: (id: string) => layers.includes(id),
    queryRenderedFeatures: (_box: unknown, o: { layers: string[] }) => features.filter((f) => o.layers.includes(f.layer.id)),
    project: ([x, y]: number[]) => ({ x, y }),
    getContainer: () => ({ clientHeight: 800 }),
    panBy: (by: number[]) => void panned.push(by)
  };
  const fire = (k: string, e: unknown = {}) => on[k]?.forEach((f) => f(e));
  return { map: map as never, fire, panned };
}
const pt = (layer: string, x: number, y: number): F => ({ layer: { id: layer }, geometry: { type: 'Point', coordinates: [x, y] } });

describe('the one tap router', () => {
  it('the nearest feature of the live routes goes to its route; none near, the misses; one router a map', () => {
    const { map, fire } = fakeMap([pt('a', 110, 100), pt('b', 102, 101), { layer: { id: 'a' }, geometry: { type: 'LineString', coordinates: [] } }]);
    const got: string[] = [];
    let bOn = true;
    const r = tapRouter(map);
    expect(tapRouter(map)).toBe(r);
    r.add(['a'], (f) => got.push(`a@${f.geometry.coordinates[0]}`));
    const dropB = r.add(['b'], () => got.push('b'), () => bOn);
    r.miss(() => got.push('miss'));
    fire('click', { point: { x: 100, y: 100 } });
    // (b's route off: a's is the nearest left)
    bOn = false;
    fire('click', { point: { x: 100, y: 100 } });
    dropB();
    expect(got).toEqual(['b', 'a@110']);
    const empty = fakeMap([]);
    const misses: number[] = [];
    tapRouter(empty.map).miss(() => misses.push(1));
    tapRouter(empty.map).add(['a'], () => misses.push(2));
    empty.fire('click', { point: { x: 5, y: 5 } });
    expect(misses).toEqual([1]);
  });
});

describe('the mode a map tells (watchMode)', () => {
  it('nothing till its style is in; ready with a tile, the first one told once; offline after 3 failing tiles in a row, or the TileJSON; a lost context', () => {
    const { map, fire } = fakeMap();
    const modes: string[] = [];
    let tiles = 0;
    const loaded = watchMode(map, 'base', (m) => modes.push(m), () => tiles++);
    const tile = { dataType: 'source', sourceId: 'base', tile: {} };
    fire('data', tile);
    expect(modes).toEqual([]);
    loaded();
    expect(modes).toEqual(['ready']);
    fire('data', tile);
    expect(tiles).toBe(1);
    // two failing, one in between, two more: never offline; a third in a row: offline; a tile: ready again
    const fail = { sourceId: 'base', tile: {} };
    for (const e of [fail, fail, tile, fail, fail]) fire(e === tile ? 'data' : 'error', e);
    expect(modes).toEqual(['ready']);
    fire('error', fail);
    expect(modes).toEqual(['ready', 'offline']);
    fire('data', tile);
    expect(modes.at(-1)).toBe('ready');
    // another source's data or error isn't the basemap's
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fire('error', { sourceId: 'saved', error: new Error('x') });
    fire('data', { dataType: 'source', sourceId: 'saved', tile: {} });
    expect(modes.at(-1)).toBe('ready');
    // the TileJSON (no tile): offline at once
    fire('error', { sourceId: 'base' });
    expect(modes.at(-1)).toBe('offline');
    fire('webglcontextlost');
    expect(modes.at(-1)).toBe('lost');
    fire('webglcontextrestored');
    expect(modes.at(-1)).toBe('offline');
    expect(tiles).toBe(1);
  });
});

describe('the reveal over a floating card', () => {
  it('a pan only when the point would sit under the card (and its 24 px margin), by just that much', () => {
    const { map, panned } = fakeMap();
    revealAbove(map, [100, 500], 200);
    expect(panned).toEqual([]);
    revealAbove(map, [100, 700], 200);
    expect(panned).toEqual([[0, 124]]);
  });
});
