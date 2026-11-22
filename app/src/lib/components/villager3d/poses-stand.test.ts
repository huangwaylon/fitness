import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JOINTS, idle, type Body } from './poses.ts';
import { ACTS, COOK_TOSS, HAMMER_HIT, ONCE_MS, REACH, STAND_MS, STAND_USES, actPose, heldIn, hitAt, isStandUse, onceMs, tossAt, type Act } from './poses-stand.ts';
import { ACT_PIECES, HELD_STAND, PROPS, STAND_PIECES } from '../world3d/heldProps.ts';
import { HELD_PROPS } from '../world3d/benchBar.ts';
import { familyOf, isGadget } from '../tent/toggles.ts';
import { ITEMS } from '../tent/items.ts';
import SEATS from './seats3d.json' with { type: 'json' };

const BODY: Body = { thigh: 1.6, shin: 1.4, hip: 3.4 };
const o = { phase: 0, speed: 0, body: BODY, seed: 0 };
const MODELS = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'models');
const USES = Object.keys(STAND_USES) as (keyof typeof STAND_USES)[];
const ONES = Object.keys(ACTS) as Act[];

/** A pose's numbers sane: finite, each joint a known one within a turn and a bit, the elbows folding their own way,
 *  the knees forward. */
function sane(tag: string, p: ReturnType<typeof idle>, bad: string[]) {
  if ([p.y, p.sq, p.pitch, ...Object.values(p.j).flat()].some((n) => !Number.isFinite(n as number))) bad.push(`${tag}: not finite`);
  for (const [j, v] of Object.entries(p.j)) if (!JOINTS.includes(j as never) || v!.some((a) => Math.abs(a) > 3.2)) bad.push(`${tag}: ${j} ${v}`);
  if ((p.j.Arm_2_R?.[1] ?? 0) < -0.05) bad.push(`${tag}: right elbow backwards`);
  if ((p.j.Arm_2_L?.[1] ?? 0) > 0.05) bad.push(`${tag}: left elbow backwards`);
  if ((p.j.Leg_2_L?.[0] ?? 0) < -0.05 || (p.j.Leg_2_R?.[0] ?? 0) < -0.05) bad.push(`${tag}: knee backwards`);
  if (p.sq < 0.85 || p.sq > 1.15 || Math.abs(p.pitch) > 0.01) bad.push(`${tag}: squash ${p.sq}, pitch ${p.pitch}`);
  if (p.y > 1.5 || p.y < -BODY.thigh) bad.push(`${tag}: lift ${p.y}`);
}

/** A converted model's bounds (its positions' accessors, quantized, under its one node's scale and offset). */
function bounds(code: string): [number[], number[]] {
  const b = readFileSync(join(MODELS, `${code}.glb`)), n = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + n).toString());
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  const node = j.nodes.find((x: { scale?: number[] }) => x.scale) ?? { scale: [1, 1, 1], translation: [0, 0, 0] };
  for (const m of j.meshes) for (const pr of m.primitives) {
    const a = j.accessors[pr.attributes.POSITION];
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], a.min[i] * node.scale[i] + (node.translation?.[i] ?? 0));
      hi[i] = Math.max(hi[i], a.max[i] * node.scale[i] + (node.translation?.[i] ?? 0));
    }
  }
  return [lo, hi];
}

describe('the uses stood at (poses-stand.ts) and what\'s held for them (world3d/heldProps.ts)', () => {
  it('each looped use, over two reps: sane, moving, the same a rep on (the wall clock: both phones alike)', () => {
    const bad: string[] = [];
    for (const u of USES) {
      const T = STAND_MS[u];
      expect(STAND_USES[u].ms).toBe(T);
      expect(STAND_USES[u].on).toBe('stand');
      for (let i = 0; i <= 80; i++) sane(`${u} ${i}`, STAND_USES[u].pose((i / 40) * T + 7, o), bad);
      const at = (t: number) => JSON.stringify(Object.fromEntries(Object.entries(STAND_USES[u].pose(t, o).j).filter(([k]) => k !== 'Head' && k !== 'Spine_2')));
      if (at(1000) === at(1000 + T / 4)) bad.push(`${u}: still`);
      if (at(1000) !== at(1000 + 2 * T)) bad.push(`${u}: no loop`);
    }
    expect(bad).toEqual([]);
  });

  it('their moments: the cook\'s tosses after its swirl, the hammer\'s blow once a rep', () => {
    for (let i = 0; i < 50; i++) expect(tossAt((i / 50) * COOK_TOSS * STAND_MS.cook)).toBe(0);
    expect(Math.max(...Array.from({ length: 100 }, (_, i) => tossAt((COOK_TOSS + (i / 100) * (1 - COOK_TOSS)) * STAND_MS.cook)))).toBeGreaterThan(0.95);
    const hits = Array.from({ length: 100 }, (_, i) => hitAt((i / 100) * STAND_MS.hammer)).filter(Boolean).length;
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThan(15);
    // the hammer's right arm high before the blow, down at it
    const arm = (k: number) => STAND_USES.hammer.pose(k * STAND_MS.hammer, o).j.Arm_1_R![0];
    expect(arm(0.55)).toBeLessThan(arm(HAMMER_HIT) - 0.8);
  });

  it('each one-off: sane all the way, its moment inside it, faded in from the idle and back out to it', () => {
    const bad: string[] = [];
    for (const a of ONES) {
      const { ms, at } = ACTS[a];
      expect(at, a).toBeGreaterThan(0);
      expect(at, a).toBeLessThan(ms);
      expect(onceMs(a)).toBe(ms);
      for (let i = 0; i <= 60; i++) {
        const u = (i / 60) * ms;
        sane(`${a} ${Math.round(u)}`, actPose(a, u, BODY, idle(u)), bad);
      }
      expect(actPose(a, 0, BODY, idle(0)).j.Arm_1_R).toEqual(idle(0).j.Arm_1_R);
      expect(actPose(a, ms, BODY, idle(ms)).j.Arm_1_R).toEqual(idle(ms).j.Arm_1_R);
    }
    // a use stood at played in place: its loop, a while
    expect(onceMs('cook')).toBe(ONCE_MS);
    sane('cook once', actPose('cook', 2000, BODY, idle(2000)), bad);
    expect(bad).toEqual([]);
  });

  it('the props held: a drink, the camera, the phone all the way; a dart and a ball till let go of; never the kick\'s', () => {
    for (const a of ['sip', 'photo', 'call', 'cue'] as const) expect([0, 0.5, 0.99].every((k) => heldIn(a, k * ACTS[a].ms)), a).toBe(true);
    for (const a of ['dart', 'shoot'] as const) {
      expect(heldIn(a, ACTS[a].at - 1), a).toBe(true);
      expect(heldIn(a, ACTS[a].at + 1), a).toBe(false);
    }
    expect(heldIn('kick', 100)).toBe(false);
    expect(heldIn('sip', ACTS.sip.ms)).toBe(false);
  });

  it('each prop: its model there, gripped inside its bounds, small in a room\'s hands; in HELD_PROPS', () => {
    for (const [name, p] of Object.entries(PROPS)) {
      const key = 'm' in p ? p.m : p.b;
      expect(HELD_STAND[key], name).toBe(p);
      expect(HELD_PROPS[key], name).toBe(p);
      if (!('m' in p)) continue;
      expect(existsSync(join(MODELS, `${p.m}.glb`)), name).toBe(true);
      const [lo, hi] = bounds(p.m);
      for (let i = 0; i < 3; i++) expect(p.grip[i] >= lo[i] - 0.01 && p.grip[i] <= hi[i] + 0.01, `${name} grip ${i}`).toBe(true);
      // (held, under 6 units across: a room's villager stands 16)
      expect(Math.max(hi[0] - lo[0], hi[2] - lo[2]) * p.scale, name).toBeLessThan(6);
    }
  });

  it('the pieces: real ones, each one kind, none another family\'s (an instrument, a screen, a toy), the stood-at ones with their spot', () => {
    const stood = Object.keys(STAND_PIECES), ones = Object.keys(ACT_PIECES), tent = (SEATS as unknown as { tent: Record<string, { k: string; use?: string; z?: number }> }).tent;
    for (const c of [...stood, ...ones]) {
      expect(ITEMS[c], c).toBeTruthy();
      // (a gadget may be one too, the microwave's whir, the register's coin: the tap stands at it first, TentRoom's
      // tap branch)
      const fam = familyOf(c);
      expect(fam === null || isGadget(fam), c).toBe(true);
      expect(ITEMS[c].u, c).toBeUndefined();
    }
    expect(stood.filter((c) => ones.includes(c))).toEqual([]);
    for (const c of stood) {
      expect(tent[c]?.k, c).toBe('u');
      expect(tent[c].use, c).toBe(STAND_PIECES[c].use);
      expect(isStandUse(tent[c].use), c).toBe(true);
      // (a step out of its footprint, in front: nearer by REACH)
      expect(tent[c].z, c).toBeCloseTo((ITEMS[c].d * 10) / 2 + 4 - (REACH[STAND_PIECES[c].use] ?? 0), 4);
    }
    // the counts (docs/design.md "The gym": Stood at)
    const count = <T extends string>(rows: Readonly<Record<string, { use?: T; act?: T }>>) => Object.values(rows).reduce<Record<string, number>>((n, r) => ((n[(r.use ?? r.act)!] = (n[(r.use ?? r.act)!] ?? 0) + 1), n), {});
    expect(count(STAND_PIECES)).toEqual({ cook: 34, hammer: 5, type: 21, peer: 3, read: 8, write: 3 });
    expect(count(ACT_PIECES)).toEqual({ sip: 22, photo: 2, call: 5, dart: 1, cue: 1, shoot: 1, kick: 4 });
  });
});
