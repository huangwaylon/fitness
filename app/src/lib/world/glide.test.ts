import { describe, expect, it } from 'vitest';
import { EASE, Glide, bezier, turn, yawOf } from './glide.ts';

describe('glide (the 3D critters’ moves frame by frame)', () => {
  it('bezier is CSS’s cubic-bezier: its ends, the linear one, and the ease-in-out’s middle', () => {
    const lin = bezier(0, 0, 1, 1);
    for (const k of [0, 0.25, 0.5, 0.9, 1]) expect(lin(k)).toBeCloseTo(k, 4);
    expect(EASE.swim(0)).toBe(0);
    expect(EASE.swim(1)).toBe(1);
    expect(EASE.swim(0.5)).toBeCloseTo(0.5, 3);
    // a dart's starts fast
    expect(EASE.dash(0.2)).toBeGreaterThan(0.5);
  });

  it('a new target sets off from where it is now: never a jump', () => {
    const g = new Glide().to(0, 0, 0, 0, 0, EASE.swim);
    g.to(0, 100, 0, 0, 1000, EASE.swim);
    const mid = g.at(500).x;
    expect(mid).toBeCloseTo(50, 0);
    g.to(500, 0, 100, 0, 1000, EASE.swim);
    expect(g.at(500).x).toBeCloseTo(mid, 6);
    let last = g.at(500).x, z = g.z, max = 0;
    for (let t = 516; t <= 1600; t += 16) {
      g.at(t);
      max = Math.max(max, Math.hypot(g.x - last, g.z - z));
      [last, z] = [g.x, g.z];
    }
    expect(max).toBeLessThan(4);
    expect(g.at(1600).z).toBe(100);
    // the same target again changes nothing
    g.to(2000, 0, 100, 0, 1000, EASE.swim);
    expect(g.done(2000)).toBe(1);
  });

  it('turns the short way round, by its time constant', () => {
    expect(turn(3, -3, 1e6, 100)).toBeCloseTo(-3 + Math.PI * 2, 4);
    const a = turn(0, 1, 100, 100);
    expect(a).toBeCloseTo(1 - Math.exp(-1), 4);
    expect(yawOf(0, -1)).toBeCloseTo(0);
  });
});
