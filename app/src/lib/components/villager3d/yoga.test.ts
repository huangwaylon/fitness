import { describe, expect, it } from 'vitest';
import { FLOWS, FLOW_NAMES, YOGA_MS, asana, flowAt, flowMs, footAt, keyTimes, mirror, turns, yoga, type Asana } from './yoga.ts';
import { JOINTS, type Body, type Pose } from './poses-kit.ts';

// a villager's measures (ace's bones) and a human player's (longer legs and arms, a higher chest)
const VILLAGER: Body = { thigh: 1.4, shin: 0.86, hip: 2.69, sh: 5.55, arm: 3.5 };
const PLAYER: Body = { thigh: 1.9, shin: 1.9, hip: 4.4, sh: 7.6, arm: 4.6 };
const ALL = [...new Set(Object.values(FLOWS).flatMap((f) => f.map((s) => s.a)))] as Asana[];
const joints = (p: Pose) => Object.entries(p.j) as [string, readonly number[]][];

describe('the yoga mat\'s flows (yoga.ts)', () => {
  it('has the four flows, each from and back to standing at the mat\'s middle facing its front, each pose of the flows drawn', () => {
    expect(FLOW_NAMES).toEqual(['sun', 'standing', 'balance', 'floor']);
    for (const f of FLOW_NAMES) {
      const st = FLOWS[f];
      expect(st[0]).toMatchObject({ a: 'mountain' });
      expect(st[0].yaw ?? 0).toBe(0);
      expect(st[st.length - 1].a).toBe('mountain');
    }
    expect(YOGA_MS).toBe(FLOW_NAMES.reduce((a, f) => a + flowMs(f), 0));
    // the sun salutation's poses, the standing flow's warriors, triangle and side angle, both sides, the balances, the floor's
    expect(FLOWS.sun.map((s) => s.a)).toEqual(expect.arrayContaining(['raised', 'fold', 'halflift', 'plank', 'updog', 'dog', 'lunge']));
    for (const a of ['warrior1', 'warrior2', 'reverse', 'triangle', 'sideangle'] as const) for (const side of [1, -1]) expect(FLOWS.standing.some((s) => s.a === a && s.side === side)).toBe(true);
    for (const a of ['tree', 'dancer'] as const) for (const side of [1, -1]) expect(FLOWS.balance.some((s) => s.a === a && s.side === side)).toBe(true);
    expect(FLOWS.floor.map((s) => s.a)).toEqual(expect.arrayContaining(['seatedfold', 'boat', 'bridge', 'child', 'savasana']));
    // holds of a few breaths for the key poses
    expect(FLOWS.sun.find((s) => s.a === 'dog')!.hold).toBeGreaterThanOrEqual(8000);
    expect(FLOWS.floor.find((s) => s.a === 'savasana')!.hold).toBeGreaterThanOrEqual(12000);
  });

  it('every pose, both bodies: finite, the joints within natural limits (the knees and elbows bending their way), never flipped', () => {
    const bad: string[] = [];
    for (const body of [VILLAGER, PLAYER]) for (const a of ALL) for (const p of [asana(a, body), mirror(asana(a, body))]) {
      const nums = [p.y, p.sq, p.pitch, p.yaw ?? 0, ...joints(p).flatMap(([, v]) => v)];
      if (nums.some((n) => !Number.isFinite(n))) bad.push(`${a}: not finite`);
      for (const [n, v] of joints(p)) {
        if (!JOINTS.includes(n as never) || v.some((x) => Math.abs(x) > 3.0)) bad.push(`${a} ${n} ${v}`);
        if (n.startsWith('Leg_2') && (v[0] < -0.01 || v[0] > 2.9)) bad.push(`${a}: knee ${n} ${v[0]}`);
        if (n === 'Arm_2_L' && v[1] > 0.01) bad.push(`${a}: elbow L backwards`);
        if (n === 'Arm_2_R' && v[1] < -0.01) bad.push(`${a}: elbow R backwards`);
        if (n.startsWith('Spine') && Math.abs(v[0]) > 1.1) bad.push(`${a}: ${n} bent ${v[0]}`);
      }
      if (Math.abs(p.pitch) > 1.45) bad.push(`${a}: pitch ${p.pitch}`);
      if (p.y < -body.hip || p.y > body.hip) bad.push(`${a}: lift ${p.y}`);
    }
    expect(bad).toEqual([]);
  });

  it('the poses read apart: warrior I\'s arms high, warrior II\'s out level, the triangle tipped, the bridge\'s hips up, the dog standing tall where the child kneels low', () => {
    for (const body of [VILLAGER, PLAYER]) {
      const p = (a: Asana) => asana(a, body), side = (q: Pose) => (q.j.Spine_1?.[2] ?? 0) + (q.j.Spine_2?.[2] ?? 0) + (q.j.Spine_3?.[2] ?? 0);
      expect(p('warrior1').j.Arm_1_L![2]).toBeGreaterThan(0.8);
      expect(Math.abs(p('warrior2').j.Arm_1_L![2])).toBeLessThan(0.2);
      expect(side(p('triangle'))).toBeGreaterThan(1.2);
      expect(p('bridge').y - p('supine').y).toBeGreaterThan(0.5 * body.thigh);
      // the dog's hips near their standing height on straight legs (its knees unbent), the child's on its heels
      expect(p('dog').y).toBe(0);
      expect(p('dog').j.Leg_2_L?.[0] ?? 0).toBe(0);
      expect(p('child').y).toBeLessThan(-0.5 * body.hip);
      expect(p('child').j.Leg_2_L![0]).toBeGreaterThan(2.5);
      // the plank leant far over, straight; the dog's legs far more upright, folded at the hips
      expect(p('plank').pitch).toBeGreaterThan(p('dog').pitch + 0.5);
      expect(p('plank').j.Spine_1?.[0] ?? 0).toBe(0);
    }
  });

  it('the plank puts the hands on the mat: the arm\'s reach meets the floor from the shoulders, either body', () => {
    for (const body of [VILLAGER, PLAYER]) {
      const p = asana('plank', body), arm = -p.j.Arm_1_L![0] - p.pitch;
      // (the shoulders' height leant over, less the arm's reach down at its angle: 0)
      expect(body.sh! * Math.cos(p.pitch) - body.arm! * Math.cos(arm)).toBeCloseTo(0, 6);
      expect(arm).toBeGreaterThanOrEqual(0);
    }
  });

  it('a sided pose\'s left is its right mirrored', () => {
    const r = asana('warrior2', VILLAGER), l = mirror(r);
    expect(l.j.Leg_1_L).toEqual([r.j.Leg_1_R![0], -r.j.Leg_1_R![1], -r.j.Leg_1_R![2]]);
    expect(l.j.Head![1]).toBeCloseTo(-r.j.Head![1], 9);
    expect(mirror(l)).toEqual(r);
  });

  it('turns() gives the rig\'s Euler of turns in order (a leg turned out, then raised to the side)', () => {
    turns(['x', 0.4]).forEach((v, i) => expect(v).toBeCloseTo([0.4, 0, 0][i], 12));
    const [x, y, z] = turns(['x', -1], ['y', -Math.PI / 2]);
    // the leg, raised forward then turned out 90° to its right, points out to the right (−x) and down
    const c = Math.cos, s = Math.sin;
    const v = [0, -1, 0];
    // Rx·Ry·Rz applied to v
    const rz = [v[0] * c(z) - v[1] * s(z), v[0] * s(z) + v[1] * c(z), v[2]];
    const ry = [rz[0] * c(y) + rz[2] * s(y), rz[1], -rz[0] * s(y) + rz[2] * c(y)];
    const rx = [ry[0], ry[1] * c(x) - ry[2] * s(x), ry[1] * s(x) + ry[2] * c(x)];
    expect(rx[0]).toBeCloseTo(-Math.sin(1), 6);
    expect(rx[1]).toBeCloseTo(-Math.cos(1), 6);
    expect(rx[2]).toBeCloseTo(0, 6);
  });

  it('which flow is on: deterministic in the loop\'s clock and the yogi\'s seed, every flow in every round, yogis apart', () => {
    const t = 1_763_800_000_000;
    expect(flowAt(t, 45.5)).toEqual(flowAt(t, 45.5));
    // the room's three (tent/engine.ts: A, B, G's seeds) start each round on different flows
    const seeds = ['A', 'B', 'G'].map((w) => w.charCodeAt(0) * 0.7), r0 = Math.ceil(t / YOGA_MS) * YOGA_MS;
    expect(new Set(seeds.map((sd) => flowAt(r0 + 1, sd).flow)).size).toBe(3);
    for (const sd of seeds) {
      const seen = new Set<string>();
      for (let u = 0; u < YOGA_MS; u += 1000) seen.add(flowAt(r0 + u, sd).flow);
      expect(seen.size).toBe(4);
      // the next round starts one flow further on (not the same order again)
      expect(flowAt(r0 + YOGA_MS + 1, sd).flow).not.toBe(flowAt(r0 + 1, sd).flow);
    }
    // keyTimes lands in its flow, on its pose's hold
    for (const f of FLOW_NAMES) for (const k of keyTimes(f, 49.7, t)) expect(flowAt(k.t, 49.7).flow).toBe(f);
  });

  it('flows on smoothly: no jump anywhere through two rounds (between poses, flows and rounds), either body', () => {
    for (const body of [VILLAGER, PLAYER]) {
      const t0 = Math.ceil(1_763_800_000_000 / YOGA_MS) * YOGA_MS - 30_000, dt = 25;
      let prev = yoga(t0, body, 45.5), worst = 0, at = 0;
      for (let t = t0 + dt; t < t0 + YOGA_MS + 60_000; t += dt) {
        const p = yoga(t, body, 45.5);
        const d = Math.max(
          Math.abs(p.pitch - prev.pitch), Math.abs((p.yaw ?? 0) - (prev.yaw ?? 0)), Math.abs(p.y - prev.y) / body.hip,
          ...JOINTS.map((n) => Math.max(...[0, 1, 2].map((c) => Math.abs((p.j[n]?.[c] ?? 0) - (prev.j[n]?.[c] ?? 0)))))
        );
        if (d > worst) (worst = d), (at = t);
        prev = p;
      }
      // (the quickest move turns a joint ~2.5 rad in 1.1 s, eased: ~0.1 rad a 25 ms step at its fastest)
      expect(worst, `at ${at - t0}`).toBeLessThan(0.16);
    }
  });

  it('holds still but for the breath; a foot that changes its place steps there, lifted, while standing', () => {
    // the dog's hold: the legs still, the chest breathing
    const k = keyTimes('sun', 0, 1_763_800_000_000).find((x) => x.a === 'dog')!;
    const a = yoga(k.t - 2000, VILLAGER), b = yoga(k.t + 1200, VILLAGER);
    expect(a.j.Leg_1_L).toEqual(b.j.Leg_1_L);
    expect(a.j.Spine_2).not.toEqual(b.j.Spine_2);
    // mountain → warrior II (R): the right foot steps out to the right along the mat, off the floor on its way
    const st = FLOWS.standing, i = st.findIndex((s) => s.a === 'warrior1' && s.side === 1);
    const ks = keyTimes('standing', 0, 1_763_800_000_000), t1 = ks[i].t, t2 = ks[i + 1].t;
    const end = t1 + st[i].hold / 2;
    const ground = Math.min(footAt(yoga(end - 1, VILLAGER), VILLAGER, 'R')[1], footAt(yoga(t2, VILLAGER), VILLAGER, 'R')[1]);
    let high = -Infinity;
    for (let t = end; t < end + st[i].move; t += 20) high = Math.max(high, footAt(yoga(t, VILLAGER), VILLAGER, 'R')[1]);
    expect(high - ground).toBeGreaterThan(0.15 * VILLAGER.thigh);
    // standing still in a balance's hold: the standing foot where it was
    const tr = keyTimes('balance', 0, 1_763_800_000_000).find((x) => x.a === 'tree')!;
    const f0 = footAt(yoga(tr.t - 2000, VILLAGER), VILLAGER, 'L'), f1 = footAt(yoga(tr.t + 2000, VILLAGER), VILLAGER, 'L');
    expect(Math.hypot(f0[0] - f1[0], f0[2] - f1[2])).toBeLessThan(1e-9);
  });
});
