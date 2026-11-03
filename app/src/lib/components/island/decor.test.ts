import { describe, expect, it } from 'vitest';
import { CELL, DECOR_ART, DECOR_ITEMS, blockOf, boxOf, decorH, footOf, nearestSpot, placeWhy, snap, spotWhy, wallsIn, type DecorItem, type Facing } from './decor.ts';
import type { Placed } from '#lib/contract/decor.ts';
import { HOMES, POND, SCENERY, surfaceAt } from './world.ts';
import { art } from '#lib/art.ts';
import PLACES from './models.json';
import MODELS from '../world3d/assets.json';
import { nav, reachable, setNavDecor, walkable as navWalkable } from './nav.ts';
import { route, setWalkDecor, walkGeo, walkable } from './walkGraph.ts';

const T = 1_793_000_000_000;
let n = 0;
const put = (item: DecorItem, x: number, z: number, f: Facing = 0): Placed => ({ id: `d${String(n++).padStart(6, '0')}`, item, x, z, f, p: T, at: T, who: 'A' });

describe('decorations: art and sizes (island/decor.ts)', () => {
  it('every item has its four facings rendered, at one scale (the crop height varies a little with the depth it shows)', () => {
    expect(DECOR_ITEMS).toHaveLength(10);
    // facing 0 is art (the tray's icon); every facing a 3D model (the 3D island draws them), its box in models.json
    for (const k of DECOR_ART) expect(k.endsWith('-0') ? art(k) : PLACES[k as keyof typeof PLACES], k).toBeTruthy();
    for (const k of DECOR_ART) expect(k in MODELS.keys, k).toBe(true);
    for (const i of DECOR_ITEMS) {
      const hs = ([0, 1, 2, 3] as const).map((f) => decorH(i, f));
      expect(Math.max(...hs) - Math.min(...hs), i).toBeLessThan(10); // the crop's height: a deep side seen from 30° up stands a little taller
      expect(hs[0], i).toBeGreaterThan(18);
      expect(hs[0], i).toBeLessThan(75);
    }
  });
  it('a quarter turn swaps the footprint', () => {
    expect(footOf('garden-wagon', 0)).toEqual([60, 24]);
    expect(footOf('garden-wagon', 1)).toEqual([24, 60]);
  });
});

describe('decorations: the half-tile grid', () => {
  it('snaps an item so its footprint\'s edges lie on the grid lines', () => {
    for (const [item, f] of [['tanuki', 0], ['brick-well', 0], ['garden-wagon', 1]] as [DecorItem, Facing][])
      for (const [x, z] of [[100.4, 333.3], [-7, 13], [251, 707]]) {
        const [sx, sz] = snap(item, f, x, z);
        const b = boxOf({ item, f, x: sx, z: sz });
        for (const v of [b.x0, b.x1, b.y0, b.y1]) expect(Math.abs(v / CELL - Math.round(v / CELL)), `${item} ${v}`).toBeLessThan(1e-9);
        expect(Math.abs(sx - x)).toBeLessThanOrEqual(CELL / 2);
        expect(Math.abs(sz - z)).toBeLessThanOrEqual(CELL / 2);
      }
  });
});

describe('decorations: where one may stand', () => {
  it('grass, sand and the paths are fine', () => {
    expect(surfaceAt(192, 420)).toBe('dirt');
    expect(spotWhy('tanuki', 0, 192, 420, [])).toBeNull();
    expect(spotWhy('tanuki', 0, 300, 540, [])).toBeNull();
    expect(spotWhy('signpost', 0, 24, 96, [])).toBeNull();
  });
  it('not over the water, off the island, on the cliff or the bridge, nor in front of the cliff\'s foot', () => {
    expect(spotWhy('tanuki', 0, POND.x, POND.z, [])).toBe('water');
    expect(spotWhy('tanuki', 0, 192, -60, [])).toBe('ground');
    expect(spotWhy('tanuki', 0, 300, 1060, [])).toBe('ground');
    expect(spotWhy('tanuki', 0, 192, 646, [])).not.toBeNull();
  });
  it('not on a fixed thing, a tap\'s spot or another decoration', () => {
    const oak = SCENERY.find((s) => s.kind === 'oak')!;
    expect(spotWhy('tanuki', 0, oak.x, oak.z, [])).toBe('thing');
    expect(spotWhy('tanuki', 0, HOMES.A[0], HOMES.A[1], [])).toBe('spot');
    expect(spotWhy('tanuki', 0, 300, 540, [], undefined, [[300, 544]])).toBe('spot');
    const a = put('brick-well', 300, 534);
    expect(spotWhy('tanuki', 0, 312, 540, [a])).toBe('taken');
    expect(spotWhy('tanuki', 0, 312, 540, [a], a.id)).toBeNull();
    // side by side is fine
    expect(spotWhy('tanuki', 0, 300 + 24 + 12, 540, [a])).toBeNull();
  });
  it('never walls anyone in: closing a ring round a home is refused, a ring with a gap is fine', () => {
    const [hx, hz] = HOMES.B;
    const ring: Placed[] = [];
    for (let x = hx - 48; x <= hx + 48; x += 24) for (const z of [hz - 48, hz + 48]) ring.push(put('tanuki', x, z));
    for (let z = hz - 24; z <= hz + 24; z += 24) for (const x of [hx - 48, hx + 48]) ring.push(put('tanuki', x, z));
    const last = ring.pop()!;
    expect(wallsIn(ring, last)).toBe(true);
    expect(placeWhy(ring, last)).not.toBeNull();
    const gap = ring.pop()!;
    expect(wallsIn(ring, gap)).toBe(false);
  });
  it('finds the nearest fine spot on the grid', () => {
    const p = nearestSpot([], 'tanuki', 0, HOMES.A[0], HOMES.A[1])!;
    expect(spotWhy('tanuki', 0, p[0], p[1], [])).toBeNull();
    expect(Math.hypot(p[0] - HOMES.A[0], p[1] - HOMES.A[1])).toBeLessThan(80);
  });
});

describe('decorations: the walk goes round them', () => {
  it('the walk mask and the tap navigation take them in and give the ground back when they go', () => {
    const w = put('brick-well', 300, 540);
    const before = route(walkGeo(), [300, 504], [300, 576])!;
    expect(before).toHaveLength(1);
    setWalkDecor([blockOf(w)]);
    setNavDecor([blockOf(w)]);
    try {
      expect(walkable(walkGeo(), 300, 540)).toBe(false);
      expect(navWalkable(nav(), 300, 540)).toBe(false);
      const around = route(walkGeo(), [300, 504], [300, 576])!;
      expect(around.length).toBeGreaterThan(1);
      expect(reachable(nav(), 300, 492)).toBe(true);
    } finally {
      setWalkDecor([]);
      setNavDecor([]);
    }
    expect(walkable(walkGeo(), 300, 540)).toBe(true);
    expect(navWalkable(nav(), 300, 540)).toBe(true);
    expect(route(walkGeo(), [300, 504], [300, 576])).toHaveLength(1);
  });
  it('a change costs little: the walk mask patches only its cells, the nav rebuilds in a few ms', () => {
    const items = Array.from({ length: 30 }, (_, k) => put('tanuki', -12 + (k % 10) * 36, 400 + Math.floor(k / 10) * 60));
    const t0 = performance.now();
    setWalkDecor(items.map(blockOf));
    const t1 = performance.now();
    setNavDecor(items.map(blockOf));
    const g = nav();
    const t2 = performance.now();
    expect(route(walkGeo(), [60, 370], [60, 432])!.length).toBeGreaterThan(1); // round the one at (60, 400): the corner graph again
    const t3 = performance.now();
    setWalkDecor([]);
    setNavDecor([]);
    console.log(`decor: mask ${(t1 - t0).toFixed(1)} ms, nav ${(t2 - t1).toFixed(1)} ms (${g.nodes.length} nodes), first route round one (the corner graph) ${(t3 - t2).toFixed(1)} ms`);
    // generous: a sanity bound, not a benchmark (the full suite runs its files in parallel on a loaded machine;
    // timing assertions stay out of the gates: docs/ops/testing.md). Alone it's a few ms.
    expect(t1 - t0).toBeLessThan(400);
    expect(t2 - t1).toBeLessThan(800);
  });
});
