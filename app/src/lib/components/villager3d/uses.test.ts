import { describe, expect, it } from 'vitest';
import { CLIMB, GYM_USES, JOINTS, REP_MS, YOGA, YOGA_FADE_MS, YOGA_HOLD_MS, base, climbAt, type Body } from './poses.ts';

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

  it('the yoga holds four poses in turn, crossfading between: each held still but its breath, unlike the next', () => {
    const slot = YOGA_HOLD_MS + YOGA_FADE_MS, held = (i: number, d = 0) => base('yoga', i * slot + 500 + d, o);
    expect(YOGA).toHaveLength(4);
    for (let i = 0; i < 4; i++) {
      // still through a hold (the legs; the breath moves the chest)
      expect(held(i).j.Leg_1_R).toEqual(held(i, 3000).j.Leg_1_R);
      expect(JSON.stringify(held(i).j.Leg_1_R)).not.toBe(JSON.stringify(held((i + 1) % 4).j.Leg_1_R));
    }
    // half-way through a fade, between the two
    const a = held(0).j.Leg_1_R![0], b = held(1).j.Leg_1_R![0], mid = base('yoga', YOGA_HOLD_MS + YOGA_FADE_MS / 2, o).j.Leg_1_R![0];
    expect(mid).toBeGreaterThan(Math.min(a, b));
    expect(mid).toBeLessThan(Math.max(a, b));
    // the downward dog tips the body forward over its feet; the child's pose kneels low
    expect(held(2).pitch).toBeGreaterThan(0.2);
    expect(held(3).y).toBeLessThan(-1.5);
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
