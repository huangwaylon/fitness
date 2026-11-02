import { describe, expect, it } from 'vitest';
import { bendPoint, unbendRay } from './bend.ts';
import { CHUNKS, GRASS_Y, TIER, baseHeight, chunkGrid, feetY, groundHeight } from './ground.ts';
import { layout } from './layout3d.ts';
import W3D from './models.json' with { type: 'json' };
import { BRIDGE, POND, SCENERY } from '../island/world.ts';

describe('the 3D island’s ground', () => {
  it('is grass on the lawn, tier 2 above the cliff, carved at the water, under the sea off the land', () => {
    expect(groundHeight(200, 300)).toBe(GRASS_Y);
    expect(groundHeight(150, 1150)).toBe(GRASS_Y + TIER);
    expect(groundHeight(POND.x, POND.z)).toBeLessThan(GRASS_Y - 5);
    expect(groundHeight(195, -200)).toBeLessThan(0);
    // the bridge's deck stands over the stream
    expect(feetY(BRIDGE.x, (BRIDGE.z0 + BRIDGE.z1) / 2)).toBeGreaterThan(baseHeight(BRIDGE.x, 646) - 1);
  });

  it('cuts into the bake’s 8 chunks, its triangles facing up', () => {
    const g = chunkGrid(3);
    expect(CHUNKS).toBe(8);
    expect(g.index.length).toBe(g.cols * g.rows * 6);
    // the first triangle's normal (three's space: z out of the screen) points up
    const p = (i: number) => [g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]];
    const [a, b, c] = [p(g.index[0]), p(g.index[1]), p(g.index[2])];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    expect(u[2] * v[0] - u[0] * v[2]).toBeGreaterThan(0);
  });
});

describe('the rolling log', () => {
  it('leaves the pivot where it is and drops the ground away from it', () => {
    expect(bendPoint(10, 0, -500, -500, 900)).toEqual([10, 0, -500]);
    const far = bendPoint(0, 0, -900, -500, 900);
    expect(far[1]).toBeLessThan(-80);
  });

  it('finds the ground under a ray through the bent world (the taps)', () => {
    const R = 900, pivot = -500, o = [195, 1400, 700];
    for (const z of [-300, -500, -800]) {
      const [bx, by, bz] = bendPoint(150, 3, z, pivot, R);
      const d = [bx - o[0], by - o[1], bz - o[2]], l = Math.hypot(...d);
      const hit = unbendRay(o, d.map((n) => n / l), 3, pivot, R)!;
      expect(hit[0]).toBeCloseTo(150, 3);
      expect(hit[1]).toBeCloseTo(z, 3);
    }
  });
});

describe('the 3D island’s layout', () => {
  it('places every scenery piece as a converted NH model', () => {
    const list = layout('autumn', 'fall', 11);
    for (const s of SCENERY) expect(list.some((o) => o.id === s.id)).toBe(true);
    for (const o of list) {
      expect(W3D.models[o.model]).toBeTruthy();
      expect(o.scale).toBeGreaterThan(0);
    }
  });
});
