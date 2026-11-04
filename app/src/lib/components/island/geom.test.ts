import { describe, expect, it } from 'vitest';
import { quadMatrix, zIndexAt } from './geom.ts';

describe('zIndexAt(): the DOM’s stacking order', () => {
  it('further is lower, ties by x (left first)', () => {
    const zs = [100, 340, 341, 800, 1500];
    for (let i = 1; i < zs.length; i++) expect(zIndexAt(zs[i], 195, 2600)).toBeLessThan(zIndexAt(zs[i - 1], 195, 2600));
    expect(zIndexAt(500, 100, 2600)).toBeLessThan(zIndexAt(500, 101, 2600));
    expect(zIndexAt(500, 400, 2600)).toBeLessThan(zIndexAt(499.75, -100, 2600));
  });
});

describe('quadMatrix(): a box onto a quad', () => {
  const apply = (m: number[], x: number, y: number) => {
    const w = m[3] * x + m[7] * y + m[15];
    return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
  };
  it('takes the box’s corners onto the quad’s', () => {
    const q = [40, 10, 160, 10, 190, 60, 10, 60];
    const m = quadMatrix(200, 50, q);
    for (const [i, [x, y]] of [[0, 0], [200, 0], [200, 50], [0, 50]].entries()) {
      const [px, py] = apply(m, x, y);
      expect(px).toBeCloseTo(q[i * 2]);
      expect(py).toBeCloseTo(q[i * 2 + 1]);
    }
  });
  it('a rectangle is a plain scale and translate', () => {
    expect(quadMatrix(100, 20, [5, 7, 205, 7, 205, 47, 5, 47]).map((v) => v + 0)).toEqual([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 5, 7, 0, 1]);
  });
});
