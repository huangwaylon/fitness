import { describe, expect, it } from 'vitest';
import { starGeometry } from './effects.ts';

describe('the star sparkle (effects.ts: the high five\'s, a sparkle, a ✦ mark)', () => {
  const g = starGeometry(), pos = g.getAttribute('position'), col = g.getAttribute('color');
  it('is geometry in its own colours, no texture: sharp at any size, never black for want of light', () => {
    expect(g.getAttribute('uv')).toBeUndefined();
    expect(col.count).toBe(pos.count);
    // gold, a white heart, a warm rim: nothing dark
    let min = 1;
    for (let i = 0; i < col.count; i++) min = Math.min(min, col.getX(i) + col.getY(i) + col.getZ(i));
    expect(min).toBeGreaterThan(0.5);
  });
  it('is four long points (radius 1, its rim a little past), curved: enough of the outline to stay round at full screen', () => {
    let r = 0;
    for (let i = 0; i < pos.count; i++) r = Math.max(r, Math.hypot(pos.getX(i), pos.getY(i)));
    expect(r).toBeGreaterThan(1.1);
    expect(r).toBeLessThan(1.25);
    // the four points straight up, down and across; between them the waist well in
    const at = (a: number) => {
      let best = 0;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        if (Math.abs(Math.atan2(y, x) - a) < 0.02 && Math.abs(pos.getZ(i) - 0.001) < 1e-6) best = Math.max(best, Math.hypot(x, y));
      }
      return best;
    };
    for (const a of [0, Math.PI / 2, -Math.PI / 2]) expect(at(a)).toBeCloseTo(1, 2);
    expect(at(Math.PI / 4)).toBeLessThan(0.45);
    // (the fill's outline: 56 points; the rim's and the heart's besides)
    expect(pos.count / 3).toBeGreaterThanOrEqual(56 * 2 + 20);
  });
});
