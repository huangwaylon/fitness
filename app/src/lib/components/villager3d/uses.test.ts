import { describe, expect, it } from 'vitest';
import { CLIMB, GYM_USES, JOINTS, REP_MS, base, climbAt, swingAt, type Body } from './poses.ts';

const BODY: Body = { thigh: 1.6, shin: 1.4, hip: 3.4 };
const o = { phase: 0, speed: 0, body: BODY, seed: 0, seatH: 4.8, back: true, climb: 9 };

describe('the uses\' poses (poses.ts: the curl, the swing, the yoga, the Ring-Con, the climb, the soak, the stall)', () => {
  it('every use, over two of its reps: finite, the joints within a turn and a bit, the body not flipped, nor squashed flat', () => {
    const bad: string[] = [];
    for (const u of GYM_USES) for (let i = 0; i <= 80; i++) {
      const t = (i / 40) * REP_MS[u] + 7, p = base(u, t, o);
      const nums = [p.y, p.sq, p.pitch, ...Object.values(p.j).flat()];
      if (nums.some((n) => !Number.isFinite(n as number))) bad.push(`${u} ${t}: not finite`);
      for (const [j, v] of Object.entries(p.j)) if (!JOINTS.includes(j as never) || v!.some((a) => Math.abs(a) > 3.2)) bad.push(`${u} ${t}: ${j} ${v}`);
      if (Math.abs(p.pitch) > Math.PI / 2 + 1e-6) bad.push(`${u}: pitch ${p.pitch}`);
      if (p.sq < 0.85 || p.sq > 1.15) bad.push(`${u}: squash ${p.sq}`);
      // (only the climb lifts it far: up its wall)
      if (u !== 'climb' && u !== 'pullup' && (p.y > 2 || p.y < -(BODY.thigh + BODY.shin))) bad.push(`${u}: lift ${p.y}`);
    }
    expect(bad).toEqual([]);
  });

  it('the knees bend forward and the elbows the way they fold (never backwards) in the lifts and the squats', () => {
    for (const u of ['curl', 'swing', 'ring'] as const) for (let i = 0; i < 20; i++) {
      const p = base(u, (i / 20) * REP_MS[u], o);
      expect(p.j.Leg_2_L?.[0] ?? 0, u).toBeGreaterThanOrEqual(0);
      expect(p.j.Arm_2_R?.[1] ?? 0, u).toBeGreaterThanOrEqual(0);
      expect(p.j.Arm_2_L?.[1] ?? 0, u).toBeLessThanOrEqual(0);
    }
    // the curl's bar comes up to the shoulders: the elbow folds most of the way
    expect(Math.max(...Array.from({ length: 40 }, (_, i) => base('curl', (i / 40) * REP_MS.curl, o).j.Arm_2_R![1]))).toBeGreaterThan(1.9);
  });

  it('the kettlebell swing: a hip hinge at the bottom, straight arms to the chest at the top, the hands together, no jump at the rep\'s seam', () => {
    expect(REP_MS.swing).toBeGreaterThanOrEqual(1200);
    expect(REP_MS.swing).toBeLessThanOrEqual(1600);
    expect(swingAt(0)).toEqual({ hips: 0, bell: 0 });
    expect(swingAt(1 - 1e-9).hips).toBeCloseTo(0, 6);
    expect(swingAt(1 - 1e-9).bell).toBeCloseTo(0, 6);
    // (o's seed shifts the rep: cyc's 137 ms a unit; seed 0 here)
    const at = (k: number) => base('swing', k * REP_MS.swing, o);
    const torso = (k: number) => { const p = at(k); return p.j.Spine_1![0] + p.j.Spine_2![0] + p.j.Spine_3![0] + p.pitch; };
    // the bottom: the torso 45-60° forward, the arms back between the legs (past hanging), the knees soft
    expect(torso(0)).toBeGreaterThan(0.78);
    expect(torso(0)).toBeLessThan(1.05);
    expect(at(0).j.Arm_1_L![0]).toBeGreaterThan(0);
    expect(at(0).j.Leg_2_L![0]).toBeGreaterThan(0.1);
    // the top (the float): upright, the straight arms a little over level, the knees straight
    for (const k of [0.38, 0.45]) {
      expect(Math.abs(torso(k))).toBeLessThan(0.1);
      expect(at(k).j.Arm_1_L![0]).toBeLessThan(-1.45);
      expect(at(k).j.Leg_2_L?.[0] ?? 0).toBeLessThan(0.02);
    }
    // the stance wider than the hips, the hands in to the middle on the handle (the arms past hanging, toward each other)
    expect(at(0.2).j.Leg_1_L![2]).toBeLessThan(-0.15);
    expect(at(0.2).j.Leg_1_R![2]).toBeGreaterThan(0.15);
    expect(-at(0.2).j.Arm_1_L![2]).toBeGreaterThan(Math.PI / 2);
    expect(at(0.2).j.Arm_1_R![2]).toBeGreaterThan(Math.PI / 2);
    // smooth all round (no pop at the seam): 10 ms apart, every joint within a small turn
    let worst = 0;
    for (let i = 0; i <= 300; i++) {
      const a = at(i / 300 - 0.5), b = at(i / 300 - 0.5 + 10 / REP_MS.swing);
      for (const [n, v] of Object.entries(a.j)) worst = Math.max(worst, ...v!.map((x, c) => Math.abs(x - (b.j[n as keyof typeof b.j]?.[c] ?? 0))));
    }
    expect(worst).toBeLessThan(0.12);
  });

  it('climbs up the wall, looks round at the top, comes back down and rests at its foot, in a loop', () => {
    const at = (k: number) => base('climb', k * REP_MS.climb, o).y;
    expect(climbAt(0).h).toBe(0);
    expect(climbAt((CLIMB.up + CLIMB.top) / 2 * REP_MS.climb)).toEqual({ h: 1, dir: 0 });
    expect(climbAt(0.2 * REP_MS.climb).dir).toBe(1);
    expect(climbAt(0.7 * REP_MS.climb).dir).toBe(-1);
    expect(at(0.47)).toBeCloseTo(o.climb, 5);
    expect(at(0.95)).toBeCloseTo(0, 5);
    // rising all the way up, falling all the way down (the hitch of each pull aside)
    expect(at(0.3)).toBeGreaterThan(at(0.1));
    expect(at(0.8)).toBeLessThan(at(0.6));
    expect(at(0.3)).toBeCloseTo(at(1.3), 6);
  });

  it('soaks low, the legs forward and the back leaning on the tub; sits in the stall as on a seat', () => {
    const s = base('soak', 1000, o);
    expect(s.j.Leg_1_L![0]).toBeLessThan(-1.5);
    expect(s.j.Spine_1![0]).toBeLessThan(-0.2);
    const st = base('stall', 1000, o);
    expect(st.j.Leg_1_L![0]).toBeLessThanOrEqual(-1.5);
  });
});
