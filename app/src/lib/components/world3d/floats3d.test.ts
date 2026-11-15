import { afterAll, describe, expect, it } from 'vitest';
import { floats } from './floats3d.ts';
import { worldOf } from '#lib/world/layoutWorld.ts';
import { defaultLayout } from '#lib/layout/model.ts';
import * as W from '#lib/world/world.ts';

describe('the seasonal floats (floats3d.ts) on the default layout', () => {
  W.setWorld(worldOf(defaultLayout()));
  afterAll(() => W.setWorld(null));
  const all = floats(), river = all.filter((f) => !f.pond), k = (id: string) => Number(id.slice('float-'.length));

  it('a dozen or so down the river, never a chain (one a tile was 40)', () => {
    expect(river.length).toBeGreaterThanOrEqual(10);
    expect(river.length).toBeLessThanOrEqual(15);
  });
  it('spaced evenly along it, across its points (the next one ~90u on, a bend’s chord a little less)', () => {
    for (let i = 1; i < river.length; i++) {
      const a = river[i - 1], b = river[i];
      if (k(b.id) !== k(a.id) + 1) continue; // (one off the bridge's deck)
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      expect(d).toBeGreaterThan(60);
      expect(d).toBeLessThan(100);
    }
  });
  it('on the river below the falls’ pool (the upper reach and the falls’ foam bare), none on the bridge or out at sea', () => {
    for (const f of river) {
      expect(f.z).toBeLessThanOrEqual(W.CLIFF.z0 - W.FALLS_POOL);
      expect(W.inRiver(f.x, f.z)).toBe(true);
      expect(W.onBridge(f.x, f.z, -20)).toBe(false);
    }
    expect(Math.max(...river.map((f) => f.z))).toBeGreaterThan(W.CLIFF.z0 - 120); // (from just below the falls)
  });
  it('and the pond’s five', () => {
    expect(all.filter((f) => f.pond).map((f) => f.id)).toEqual([0, 1, 2, 3, 4].map((i) => `float-pond-${i}`));
  });
});
