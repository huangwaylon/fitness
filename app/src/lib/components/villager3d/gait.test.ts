import { describe, expect, it } from 'vitest';
import { JOINTS, action, ACTION_MS, type Action, type Body, type Pose } from './poses.ts';
import { SETTLE_MS, VILLAGER_LEG, ankleOf, gaitOf, legOf, settle, strideOf, walk } from './gait.ts';
import { rest } from './poses-kit.ts';

// the measures of NH's bodies at rest (rig.ts's; the harness's bones): Raymond's and a human player's
const VILLAGER: Body = { thigh: 1.67, shin: 0.82, hip: 2.85, ankle: 0.364 };
// (a player's shin as tune.ts overrides it for sitOn: the walk measures its own from the hips and the ankle)
const PLAYER: Body = { thigh: 2.58, shin: 2.13, hip: 4.96, ankle: 0.79 };
const S = 5.4;

/** The ankles in the plane of the walk (model units: z ahead of the hips, y over the ground) as a pose has them. */
function ankles(p: Pose, b: Body): [number, number][] {
  const sh = legOf(b) - b.thigh;
  return (['L', 'R'] as const).map((sd) => {
    const th = -(p.j[`Leg_1_${sd}`]?.[0] ?? 0), k = p.j[`Leg_2_${sd}`]?.[0] ?? 0;
    return [b.thigh * Math.sin(th) + sh * Math.sin(th - k), b.hip + p.y - b.thigh * Math.cos(th) - sh * Math.cos(th - k)];
  });
}

/** A straight walk at `speed` (u/s), 30 frames a second, as villager3d steps it: the drift of each foot on the ground
 *  from frame to frame (world u), and the frames with no foot down. */
function walkOut(b: Body, speed: number) {
  const mv = speed / 30, drift: number[] = [];
  let x = 0, phase = 0.13, flight = 0, prev: [number, number][] | null = null;
  for (let i = 0; i < 90; i++) {
    x += mv;
    phase += mv / (strideOf(speed, legOf(b)) * S);
    const a = ankles(walk(0, phase, speed, b), b);
    const down = a.map(([, y]) => y - ankleOf(b) < 0.02);
    // (in the air: both soles over a tenth of a unit up, ~half a world unit)
    if (a.every(([, y]) => y - ankleOf(b) > 0.1)) flight++;
    if (prev) for (let k = 0; k < 2; k++) if (down[k] && prev[k][1] - ankleOf(b) < 0.02) drift.push(Math.abs(x + a[k][0] * S - (x - mv + prev[k][0] * S)));
    prev = a;
  }
  return { drift, flight };
}

describe('the walk (gait.ts)', () => {
  it('keeps the foot on the ground where it landed, for a villager and a player, strolling and running', () => {
    for (const [name, b] of [['villager', VILLAGER], ['player', PLAYER]] as const) for (const sp of [90, 300]) {
      const { drift } = walkOut(b, sp);
      expect(drift.length, `${name} ${sp}: feet down`).toBeGreaterThan(8);
      // (the body travels 3 u a frame strolling, 10 running)
      expect(Math.max(...drift), `${name} ${sp}`).toBeLessThan(1);
    }
  });

  it('strolls with a foot always down; a run has its flights', () => {
    expect(walkOut(VILLAGER, 90).flight).toBe(0);
    expect(walkOut(PLAYER, 90).flight).toBeLessThan(10);
    expect(walkOut(PLAYER, 300).flight).toBeGreaterThan(0);
  });

  it("takes strides by its leg's length: a player's longer legs, longer steps at the same speed", () => {
    expect(strideOf(300, legOf(PLAYER)) / strideOf(300, legOf(VILLAGER))).toBeCloseTo(legOf(PLAYER) / legOf(VILLAGER), 6);
    expect(legOf(VILLAGER)).toBeCloseTo(VILLAGER_LEG, 2);
    // a villager's run at NH's quick cadence (cycles a second)
    const cycles = 300 / (strideOf(300) * S);
    expect(cycles).toBeGreaterThan(3.7);
    expect(cycles).toBeLessThan(5);
  });

  it('is finite, the knees bend forward only, the hips never higher than the legs reach', () => {
    for (const b of [VILLAGER, PLAYER]) for (const sp of [0, 45, 90, 200, 300, 420]) for (let i = 0; i < 64; i++) {
      const p = walk(0, i / 32, sp, b);
      for (const [j, v] of Object.entries(p.j)) {
        expect(JOINTS.includes(j as never)).toBe(true);
        for (const a of v!) expect(Number.isFinite(a) && Math.abs(a) < 2.5, `${sp} ${i} ${j}`).toBe(true);
      }
      expect(p.j.Leg_2_L![0]).toBeGreaterThanOrEqual(0);
      expect(p.j.Leg_2_R![0]).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1e-9);
      const g = gaitOf(i / 32, sp, b);
      expect(g.hip).toBeLessThanOrEqual(b.hip + 1e-9);
    }
  });

  it('swings the arms against the legs', () => {
    const p = walk(0, 0.0, 90, VILLAGER), g = gaitOf(0, 90, VILLAGER);
    // (the left foot ahead: the left arm back, +x)
    expect(Math.sign(p.j.Arm_1_L![0])).toBe(Math.sign(g.z[0] - g.z[1]));
  });
});

describe('the stop (gait.ts settle)', () => {
  it('steps the feet in under the hips without sliding a planted one, and ends standing', () => {
    for (const b of [VILLAGER, PLAYER]) for (const ph of [0.05, 0.3, 0.55, 0.8]) {
      const from = gaitOf(ph, 300, b);
      let prev: [number, number][] | null = null;
      for (let i = 0; i <= 12; i++) {
        const p = rest();
        settle(p, i / 12, from, b);
        const a = ankles(p, b);
        if (prev) for (let k = 0; k < 2; k++) if (a[k][1] - ankleOf(b) < 0.02 && prev[k][1] - ankleOf(b) < 0.02) expect(Math.abs(a[k][0] - prev[k][0]) * S, `${ph} ${i}`).toBeLessThan(1);
        prev = a;
      }
      const end = rest();
      settle(end, 1, from, b);
      expect(Math.abs(end.y)).toBeLessThan(0.01);
      for (const j of ['Leg_1_L', 'Leg_2_L', 'Leg_1_R', 'Leg_2_R'] as const) expect(Math.abs(end.j[j]![0])).toBeLessThan(0.05);
    }
    expect(SETTLE_MS).toBeGreaterThan(200);
  });
});

describe('the moments (poses.ts action)', () => {
  const ALL = Object.keys(ACTION_MS) as Action[];
  it('every one finite, its joints within a turn, the body not squashed flat', () => {
    for (const a of ALL) for (let i = 0; i <= 40; i++) {
      const { p, w } = action(a, (i / 40) * ACTION_MS[a]);
      expect(Number.isFinite(w), a).toBe(true);
      for (const v of Object.values(p.j)) for (const x of v!) expect(Number.isFinite(x) && Math.abs(x) < 3.2, `${a} ${i}`).toBe(true);
      expect(p.sq, a).toBeGreaterThan(0.8);
      expect(p.sq, a).toBeLessThan(1.2);
    }
  });

  it('the reactions each their own (they all played as a hop or a wave): the joint each moves most', () => {
    const peak = (a: Action, f: (p: Pose) => number) => Math.max(...Array.from({ length: 41 }, (_, i) => f(action(a, (i / 40) * ACTION_MS[a]).p)));
    expect(peak('nod', (p) => p.j.Head?.[0] ?? 0)).toBeGreaterThan(0.25);
    expect(peak('bow', (p) => p.j.Spine_1?.[0] ?? 0)).toBeGreaterThan(0.2);
    expect(peak('proud', (p) => -(p.j.Spine_1?.[0] ?? 0))).toBeGreaterThan(0.15);
    expect(peak('proud', (p) => -(p.j.Arm_2_L?.[1] ?? 0))).toBeGreaterThan(1.2);
    expect(peak('laugh', (p) => -(p.j.Head?.[0] ?? 0))).toBeGreaterThan(0.25);
    expect(peak('twirl', (p) => p.yaw ?? 0)).toBeGreaterThan(6);
    expect(peak('dance', (p) => p.y)).toBeGreaterThan(0.3);
    expect(peak('wiggle', (p) => p.j.Spine_1?.[2] ?? 0)).toBeGreaterThan(0.1);
    expect(peak('point', (p) => -(p.j.Head?.[0] ?? 0))).toBeGreaterThan(0.25);
    // the twirl ends where it began, a whole turn round
    expect(action('twirl', ACTION_MS.twirl).p.yaw).toBeCloseTo(Math.PI * 2, 3);
  });

  it('the high five up higher than the wave, with a hop; the wave swinging its arm side to side; the warm-up past level', () => {
    const at = (a: Action, k: number) => action(a, k * ACTION_MS[a]).p;
    // (the arm's raise: −z past level for the right arm)
    expect(-at('highfive', 0.45).j.Arm_1_R![2]).toBeGreaterThan(0.8);
    expect(at('highfive', 0.45).y).toBeGreaterThan(2);
    const raise = Array.from({ length: 30 }, (_, i) => -at('wave', 0.2 + i * 0.02).j.Arm_1_R![2]);
    expect(Math.max(...raise) - Math.min(...raise)).toBeGreaterThan(0.5);
    expect(Math.max(...raise)).toBeGreaterThan(0.6);
    expect(-at('warmup', 0.25).j.Arm_1_R![2]).toBeGreaterThan(0.4);
  });
});
