import { describe, expect, it } from 'vitest';
import { bendPoint, unbendRay } from './bend.ts';

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
