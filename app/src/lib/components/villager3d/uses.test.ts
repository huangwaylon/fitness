import { describe, expect, it } from 'vitest';
import { CLIMB, GYM_USES, JOINTS, PRESS, REP_MS, ROCK, base, bounceThigh, climbAt, pullAt, reachTo, rockAt, swingAt, type Body } from './poses.ts';
import { STRADDLE } from './poses-kit.ts';

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
    // never upright with the bell low: wherever the torso's within ~17° of upright the arms point at least ~30° forward
    // in the world (the torso's lean taken off theirs: the bell about the hips' height or over), up and down alike
    for (let i = 0; i < 200; i++) if (torso(i / 200) < 0.3) expect(-at(i / 200).j.Arm_1_L![0] - torso(i / 200), `${i / 200}`).toBeGreaterThan(0.55);
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

  it('the exercise ball: the feet on the floor at any seat height and through the bounce, a player\'s high seat with its thighs sloping down', () => {
    for (const body of [{ thigh: 1.4, shin: 0.86, hip: 2.69 }, { thigh: 1.9, shin: 1.9, hip: 4.4 }] as Body[])
      for (let i = 0; i <= 20; i++) {
        const h = body.shin + 0.25 + body.thigh * (-0.85 + 1.7 * (i / 20));
        const th = bounceThigh(body, h);
        // (the foot under the knee: the hips' height less the thigh's drop and the shin's reach)
        expect(h + body.thigh * Math.sin(th) - body.shin - 0.25, `${body.thigh} ${h}`).toBeCloseTo(0, 6);
      }
    // high: the knees below the hips; low: above them
    expect(bounceThigh({ thigh: 1.9, shin: 1.9, hip: 4.4 }, 3.2)).toBeLessThan(0);
    expect(bounceThigh({ thigh: 1.4, shin: 0.86, hip: 2.69 }, 0.6)).toBeGreaterThan(0);
    const p = base('bounce', 300, { ...o, body: { thigh: 1.9, shin: 1.9, hip: 4.4 }, seatH: 3.2 });
    expect(p.j.Leg_1_L![0]).toBeGreaterThan(-1.5);
  });
});

describe('the pose review\'s fixes (2026-11-22): the pull-up\'s grip, the speed bag, the toilets, the barrel, short beds, the rock', () => {
  // (a joint's turn as rig.ts puts it: Euler XYZ in the model's frame, the child's in its parent's turned frame)
  const turn = (v: readonly number[], [x, y, z]: readonly number[]) => {
    let [a, b, c] = v;
    [a, b] = [a * Math.cos(z) - b * Math.sin(z), a * Math.sin(z) + b * Math.cos(z)];
    [a, c] = [a * Math.cos(y) + c * Math.sin(y), -a * Math.sin(y) + c * Math.cos(y)];
    [b, c] = [b * Math.cos(x) - c * Math.sin(x), b * Math.sin(x) + c * Math.cos(x)];
    return [a, b, c];
  };
  const handOf = (a1: readonly number[], a2: readonly number[], u: number, f: number) => {
    const upper = turn([u, 0, 0], a1), fore = turn(turn([f, 0, 0], a2), a1);
    return upper.map((x, i) => x + fore[i]);
  };

  it('reachTo puts the left hand on its point, the elbow out and down, the forearm folding up', () => {
    for (const [x, y, z] of [[0.8, 1.5, -0.6], [1.0, 0.4, 0], [0.3, 1.9, 0.5], [1.2, 1.0, -1.0]]) {
      const r = reachTo(x, y, z, 1.1, 1.2), h = handOf(r.a1, r.a2, 1.1, 1.2);
      expect(Math.hypot(h[0] - x, h[1] - y, h[2] - z), `${x},${y},${z}`).toBeLessThan(1e-6);
      expect(r.a2[2]).toBeGreaterThanOrEqual(0);
    }
    // out of reach: straight toward it
    const far = reachTo(5, 5, 0, 1, 1), h = handOf(far.a1, far.a2, 1, 1);
    expect(far.a2[2]).toBeCloseTo(0, 1);
    expect(h[0]).toBeCloseTo(h[1], 2);
  });

  it('the pull-up\'s hands stay on its bar through the rep (each body\'s own arm), lifted off the ground, higher at the top', () => {
    const judy: Body = { thigh: 1.28, shin: 0.79, hip: 2.36, sh: 5.07, limb: [1.17, 1.13, 1.19] };
    const tall: Body = { thigh: 1.9, shin: 1.9, hip: 4.6, sh: 9.2, limb: [1.6, 2.0, 2.1] };
    for (const body of [judy, tall]) {
      const oo = { ...o, body, grip: 18.6, bar: [3.15, -2.44] as const };
      const ys: number[] = [];
      for (let i = 0; i < 40; i++) {
        const p = base('pullup', (i / 40) * REP_MS.pullup, oo), [sx, u, f] = body.limb!;
        const h = handOf(p.j.Arm_1_L!, p.j.Arm_2_L!, u, f);
        // the hand at the bar's height and the grip's depth from the feet (the body brought under it by `z`)
        expect(h[1] + body.sh! + p.y, `${i}`).toBeCloseTo(18.6, 2);
        expect(h[2] + (p.z ?? 0), `${i}`).toBeCloseTo(-2.44, 2);
        expect(sx + h[0]).toBeLessThanOrEqual(3.15 + 1e-6);
        ys.push(p.y);
      }
      expect(Math.min(...ys)).toBeGreaterThan(0);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.3 * (body.limb![1] + body.limb![2]));
    }
    expect(pullAt(0.12 * REP_MS.pullup)).toBe(1);
    // the island's stand (no grip): its old pull-up
    expect(base('pullup', 600, o).z ?? 0).toBe(0);
  });

  it('the speed bag: the fists up by the face, rolling a turn each REP_MS.speed; the press\'s arms over the sternum', () => {
    expect(REP_MS.speed).toBeGreaterThanOrEqual(150);
    expect(REP_MS.speed).toBeLessThanOrEqual(220);
    const a = base('speed', 1000, o), b = base('speed', 1000 + REP_MS.speed / 4, o);
    expect(a.j.Arm_1_L![0]).toBeLessThan(-1.5);
    expect(a.j.Arm_2_R![1]).toBeGreaterThan(1.1);
    expect(a.j.Arm_1_L![0]).not.toBeCloseTo(b.j.Arm_1_L![0], 3);
    expect(PRESS).toEqual({ bottom: -1.0, top: -1.5, elbow: 1.6 });
  });

  it('the standing toilet stood at, the squat toilet squatted a whole thigh down, heels down', () => {
    const u = base('urinal', 900, o);
    expect(u.y).toBe(0);
    expect(u.j.Leg_2_L?.[0] ?? 0).toBe(0);
    const s = base('squat', 900, o);
    expect(s.y).toBeLessThan(-0.8 * BODY.thigh);
    // the soles flat: the ankle takes back what the thigh and the shin turn
    expect(s.j.Leg_1_L![0] + s.j.Leg_2_L![0] + s.j.Ankle_L![0]).toBeCloseTo(0, 6);
  });

  it('a narrow tub soaked in upright, up till the shoulders are at its rim; a short bed\'s knees drawn up; the rock in step', () => {
    const body: Body = { ...BODY, sh: 6 };
    const lean = base('soak', 500, { ...o, body }), up = base('soak', 500, { ...o, body, upright: true, rim: 4 });
    expect(lean.j.Spine_1![0]).toBeLessThan(-0.3);
    expect(Math.abs(up.j.Spine_1![0])).toBeLessThan(0.05);
    expect(up.y).toBeCloseTo(4 - (6 - BODY.hip) + 0.15, 6);
    expect(base('soak', 500, { ...o, body, upright: true, rim: 1 }).y).toBe(0);
    const bed = base('lie', 500, { ...o, short: 1 }), flat = base('lie', 500, o);
    expect(bed.j.Leg_1_L![0]).toBeLessThan(-0.5);
    expect(flat.j.Leg_1_L![0]).toBe(0);
    // (at most a right angle and a bit at the hips however short)
    expect(base('lie', 0, { ...o, short: 99 }).j.Leg_1_L![0]).toBeCloseTo(-1.2, 6);
    expect(Math.max(...Array.from({ length: 200 }, (_, i) => Math.abs(rockAt(i * 41))))).toBeCloseTo(ROCK.a, 2);
    // astride: the thighs out round the ride-on's body
    expect(base('sit', 0, { ...o, ride: true }).j.Leg_1_R![2]).toBeCloseTo(STRADDLE, 6);
  });
});
