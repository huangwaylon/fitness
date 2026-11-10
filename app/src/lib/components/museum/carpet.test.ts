import { describe, expect, it } from 'vitest';
import { carpetGeometry, carpetTexture } from './carpet.ts';

/** The texel at a model point (x, z). */
const at = (t: ReturnType<typeof carpetTexture>, x: number, z: number) => {
  const i = Math.floor((x - t.x0) * t.px), j = Math.floor((z - t.z0) * t.px), k = (j * t.w + i) * 4;
  return [t.data[k], t.data[k + 1], t.data[k + 2]];
};
const gold = (c: number[]) => c[0] > 180 && c[1] > 140;
const pile = (c: number[]) => c[0] > 120 && c[0] < 160 && c[1] < 60;

describe('the carpets: strips in, one seamless carpet out', () => {
  // a T: a runner along x, another along z meeting it from below
  const T = [{ x0: -40, x1: 40, z0: -8, z1: 8 }, { x0: -8, x1: 8, z0: 8, z1: 60 }];
  const t = carpetTexture(T);
  it('its gold border runs round the union, not across the junction', () => {
    // along the top edge of the x runner, and the z runner's sides
    expect(gold(at(t, 0, -8 + 1.4))).toBe(true);
    expect(gold(at(t, -8 + 1.4, 30))).toBe(true);
    expect(gold(at(t, 8 - 1.4, 30))).toBe(true);
    // where they meet (the x runner's lower edge, inside the z runner): pile, no border across
    expect(pile(at(t, 0, 8 - 1.4))).toBe(true);
    expect(pile(at(t, 0, 8 + 1.4))).toBe(true);
    // the x runner's lower edge beside the junction keeps its border
    expect(gold(at(t, 25, 8 - 1.4))).toBe(true);
  });
  it('one pile colour all over (no tile repeat): the middles of both strips match', () => {
    const a = at(t, -30, 0), b = at(t, 0, 50);
    for (let c = 0; c < 3; c++) expect(Math.abs(a[c] - b[c])).toBeLessThanOrEqual(8);
  });
  it('its geometry: the strips themselves, facing up, their UVs in world units over the texture', () => {
    const g = carpetGeometry(T, t);
    expect(g.position.length).toBe(T.length * 12);
    expect(g.index.length).toBe(T.length * 6);
    for (let k = 0; k < g.uv.length; k += 2) {
      const x = g.position[(k / 2) * 3], z = g.position[(k / 2) * 3 + 2];
      expect(g.uv[k]).toBeCloseTo((x - t.x0) / (t.w / t.px));
      expect(g.uv[k + 1]).toBeCloseTo((z - t.z0) / (t.h / t.px));
    }
    // (the first triangle's normal: +y)
    const p = (i: number) => [g.position[i * 3], g.position[i * 3 + 1], g.position[i * 3 + 2]];
    const [a, b, c] = [p(g.index[0]), p(g.index[1]), p(g.index[2])];
    const u = [b[0] - a[0], b[2] - a[2]], v = [c[0] - a[0], c[2] - a[2]];
    expect(u[1] * v[0] - u[0] * v[1]).toBeGreaterThan(0);
  });
});
