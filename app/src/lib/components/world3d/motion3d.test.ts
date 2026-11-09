import { describe, expect, it } from 'vitest';
import { gymPose, pullLift } from './motion3d.ts';
import { GYM_USES } from '../villager3d/poses.ts';
import { useOf } from '../villager3d/seats3d.ts';

describe('motion3d: a card (no 3D model) on the gym', () => {
  it('every gym piece gives a use, and every use moves the card over time (never a still card on it)', () => {
    for (const k of ['weight-bench', 'exercise-bike', 'treadmill', 'punching-bag', 'exercise-ball', 'pullup']) expect(useOf(k), k).not.toBeNull();
    expect(useOf('park-bench')).toBeNull();
    for (const u of GYM_USES) {
      const ps = Array.from({ length: 60 }, (_, i) => gymPose(u, i * 70));
      const spread = (f: (p: (typeof ps)[number]) => number) => Math.max(...ps.map(f)) - Math.min(...ps.map(f));
      expect(spread((p) => p.lift) + spread((p) => p.squash) * 50 + spread((p) => p.tilt) * 50, u).toBeGreaterThan(2);
    }
  });
  it('pull-ups lift the card to 9 u twice a cycle and back down', () => {
    expect(pullLift(0)).toBe(0);
    expect(pullLift(4200 * 0.12)).toBe(9);
    expect(pullLift(4200 * 0.44)).toBe(9);
    expect(pullLift(4200 * 0.8)).toBe(0);
  });
});
