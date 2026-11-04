import { describe, expect, it } from 'vitest';
import { mind, type Mind } from './curator.ts';
import type { Pt } from './plan.ts';

/** Steps `m` from t over ms at 30 a second, my villager at `me`; each step's check. */
function run(m: Mind, t: number, ms: number, me: Pt | null, each?: (t: number) => void): number {
  const end = t + ms;
  for (; t < end; t += 33) {
    m.step(t, 33, me);
    each?.(t);
  }
  return t;
}

describe('the curator (フータ): his mind', () => {
  it('breathes and looks about while alone, in one pose rewritten in place', () => {
    const m = mind(1), arrays = Object.values(m.pose.j);
    const ys: number[] = [], yaws: number[] = [];
    run(m, 0, 8000, null, () => (ys.push(m.pose.y), yaws.push(m.pose.j.Head![1])));
    expect(m.doing).toBe('idle');
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.15);
    expect(Math.max(...yaws) - Math.min(...yaws)).toBeGreaterThan(0.2);
    for (const v of [...ys, ...yaws]) expect(Number.isFinite(v)).toBe(true);
    expect(Object.values(m.pose.j)).toEqual(arrays);
    Object.values(m.pose.j).forEach((v, i) => expect(v).toBe(arrays[i]));
  });

  it('turns his head to my villager in front of the desk', () => {
    const m = mind(2);
    let t = run(m, 0, 1500, [30, -10]);
    expect(m.doing).toBe('look');
    expect(m.pose.j.Head![1]).toBeGreaterThan(0.4);
    t = run(m, t, 1500, [-30, -10]);
    expect(m.pose.j.Head![1]).toBeLessThan(-0.4);
    // (behind him or far off: not watched)
    run(m, t, 300, [0, 200]);
    expect(m.doing).toBe('idle');
  });

  it('nods off on his own while alone: a yawn, his head drooping to one side, eyes shut; my villager coming up wakes him with a start', () => {
    const m = mind(3);
    let dozed = -1;
    let t = run(m, 0, 40_000, null, (at) => {
      if (dozed < 0 && m.doing === 'doze') dozed = at;
    });
    expect(dozed).toBeGreaterThan(10_000);
    const n = mind(4);
    t = run(n, 0, 1000, null);
    n.doze(t);
    let opened = 0;
    t = run(n, t, 2000, null, () => (opened = Math.max(opened, n.pose.j.Mouth![0])));
    expect(opened).toBeGreaterThan(0.6);
    t = run(n, t, 2500, null);
    expect(n.doing).toBe('doze');
    expect(n.face).toBe('sleepy');
    expect(n.pose.j.Head![2]).toBeGreaterThan(0.1);
    t = run(n, t, 100, [0, -10]);
    expect(n.doing).toBe('look');
    expect(n.face).toBe('surprised');
    run(n, t, 1500, [0, -10]);
    expect(n.face).not.toBe('sleepy');
  });

  it('perks up when talked to: a hop, a wing raised as he explains, his beak moving while his line types; quiet after', () => {
    const m = mind(5);
    let t = run(m, 0, 1000, [0, -10]);
    const rest = { y: m.pose.y, l: m.pose.j.Arm_1_L![2], r: m.pose.j.Arm_1_R![2] };
    m.talk(t, 40);
    expect(m.doing).toBe('talk');
    let hop = 0, beak = 0, wing = 0;
    t = run(m, t, 1300, [0, -10], () => {
      hop = Math.max(hop, m.pose.y - rest.y);
      beak = Math.max(beak, m.pose.j.Mouth![0]);
      wing = Math.max(wing, Math.abs(m.pose.j.Arm_1_L![2] - rest.l), Math.abs(m.pose.j.Arm_1_R![2] - rest.r));
    });
    expect(hop).toBeGreaterThan(0.4);
    expect(beak).toBeGreaterThan(0.3);
    expect(wing).toBeGreaterThan(0.5);
    // the line typed: the beak still, the wing up till the balloon goes
    let moved = 0;
    t = run(m, t, 1000, [0, -10], () => (moved = Math.max(moved, m.pose.j.Mouth![0])));
    expect(moved).toBe(0);
    expect(m.doing).toBe('talk');
    m.quiet(t);
    t = run(m, t, 2000, [0, -10]);
    expect(m.doing).toBe('look');
    expect(Math.abs(m.pose.j.Arm_1_R![2] - rest.r)).toBeLessThan(0.15);
  });

  it('wakes when talked to while dozing', () => {
    const m = mind(6);
    let t = run(m, 0, 500, null);
    m.doze(t);
    t = run(m, t, 4000, null);
    m.talk(t, 20);
    run(m, t, 200, [0, -10]);
    expect(m.doing).toBe('talk');
    expect(m.face).toBe('surprised');
  });
});
