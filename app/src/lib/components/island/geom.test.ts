import { describe, expect, it } from 'vitest';
import { hull, zIndexAt } from './geom.ts';

describe('zIndexAt(): the DOM’s stacking order', () => {
  it('further is lower, ties by x (left first)', () => {
    const zs = [100, 340, 341, 800, 1500];
    for (let i = 1; i < zs.length; i++) expect(zIndexAt(zs[i], 195, 2600)).toBeLessThan(zIndexAt(zs[i - 1], 195, 2600));
    expect(zIndexAt(500, 100, 2600)).toBeLessThan(zIndexAt(500, 101, 2600));
    expect(zIndexAt(500, 400, 2600)).toBeLessThan(zIndexAt(499.75, -100, 2600));
  });
});

describe('hull(): a solid’s outline from its corners', () => {
  it('keeps the outer corners, drops the inner ones and the repeats', () => {
    const h = hull([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5], [10, 0], [5, 0]]);
    expect(new Set(h.map((p) => p.join()))).toEqual(new Set(['0,0', '10,0', '10,10', '0,10']));
    expect(h).toHaveLength(4);
  });
  it('a box seen from above its front: six corners round it', () => {
    // a building's 8 corners on screen: its front face below, its roof's back edge above and narrower
    expect(hull([[0, 100], [200, 100], [0, 40], [200, 40], [20, 80], [180, 80], [20, 10], [180, 10]])).toHaveLength(6);
  });
});
