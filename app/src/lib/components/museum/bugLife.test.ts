import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLY_UPS } from '../island/critterPath.ts';
import { FLAPS } from '../world3d/wings.ts';
import { BUG_S, CASE, CASES, OAKS, POND_Y, SOLIDS, bugLife, bugSeed, pose, slotsOf, type Pose, type Size, type Solid } from './bugLife.ts';
import { BUG_WING } from './plan.ts';
import { BUG_IDS, habitatOf, type Habitat } from './species.ts';

const DIR = join(import.meta.dirname, '../../../../static/room/world3d/critters/bugs');

/** A bug's size as the garden draws it: its model's box (every part, its node's scale) × BUG_S. */
function sizeOf(id: string): Size {
  const b = readFileSync(join(DIR, `${id}.glb`));
  const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
  const node = j.nodes.find((n: { mesh?: number }) => n.mesh !== undefined), s = node.scale ?? [1, 1, 1];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of j.meshes[node.mesh].primitives) {
    const a = j.accessors[p.attributes.POSITION];
    for (let k = 0; k < 3; k++) (lo[k] = Math.min(lo[k], a.min[k] * s[k])), (hi[k] = Math.max(hi[k], a.max[k] * s[k]));
  }
  return { w: (hi[0] - lo[0]) * BUG_S, h: (hi[1] - lo[1]) * BUG_S, l: (hi[2] - lo[2]) * BUG_S };
}

/** Every bug in each of the garden's places it may keep to (slotsOf: the hour's pick puts it in one of them). */
const BUGS = BUG_IDS.flatMap((id) => {
  const hab = habitatOf(id), size = sizeOf(id);
  return slotsOf(id, hab).map(({ i, takes }) => ({ id, hab, size, slot: i, takes, life: bugLife(id, hab, i, bugSeed(id), size) }));
});

/** Its body's bounds at a pose: its box (across, along, up to its back, its wings' reach up), turned. */
function bounds(p: Pose, s: Size, flaps: boolean) {
  const rx = p.uy * p.fz - p.uz * p.fy, ry = p.uz * p.fx - p.ux * p.fz, rz = p.ux * p.fy - p.uy * p.fx;
  const up = s.h + (flaps ? s.w * 0.5 : 0);
  const o = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
  for (const a of [-0.5, 0.5]) for (const b of [-0.5, 0.5]) for (const c of [0, 1]) {
    const x = p.x + rx * a * s.w + p.fx * b * s.l + p.ux * c * up, y = p.y + ry * a * s.w + p.fy * b * s.l + p.uy * c * up, z = p.z + rz * a * s.w + p.fz * b * s.l + p.uz * c * up;
    o.x0 = Math.min(o.x0, x); o.x1 = Math.max(o.x1, x); o.y0 = Math.min(o.y0, y); o.y1 = Math.max(o.y1, y); o.z0 = Math.min(o.z0, z); o.z1 = Math.max(o.z1, z);
  }
  return o;
}
const meets = (a: Omit<Solid, 'what'>, b: Solid, e = 0.05) => a.x0 < b.x1 - e && a.x1 > b.x0 + e && a.y0 < b.y1 - e && a.y1 > b.y0 + e && a.z0 < b.z1 - e && a.z1 > b.z0 + e;

const FPS = 30, MINUTES = 2;
/** Each bug over two minutes at the exhibits' 30 a second, from a clock well on (the museum's). */
const runs = BUGS.map((b) => {
  const flaps = FLAPS.test(`critters/bugs/${b.id}`), p = pose(), dt = 1000 / FPS, t0 = 3_600_000 + bugSeed(b.id);
  const out = { ...b, flaps, top: 0, moved: 0, turned: 0, frames: 0, sat: 0, slow: 0, flapped: new Set<number>(), bad: [] as string[], room: { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity } };
  let px = NaN, py = 0, pz = 0, ph = 0;
  for (let i = 0; i <= MINUTES * 60 * FPS; i++) {
    b.life.at(t0 + i * dt, dt, p);
    const o = bounds(p, b.size, flaps), m = out.room;
    // (all the room it took)
    m.x0 = Math.min(m.x0, o.x0); m.x1 = Math.max(m.x1, o.x1); m.y0 = Math.min(m.y0, o.y0); m.y1 = Math.max(m.y1, o.y1); m.z0 = Math.min(m.z0, o.z0); m.z1 = Math.max(m.z1, o.z1);
    const why: string[] = [];
    if (o.x0 < BUG_WING.x0 || o.x1 > BUG_WING.x1 || o.z0 < BUG_WING.z0 || o.z1 > BUG_WING.z1) why.push('out of the wing');
    if (o.y0 < (b.hab === 'water' ? POND_Y - b.size.h - 0.01 : -0.01)) why.push('under the ground');
    for (const s of SOLIDS) if (!b.life.on.includes(s.what) && meets(o, s)) why.push(`in ${s.what}`);
    const [sx, sy, sz, sr] = b.life.sphere;
    if (Math.hypot(p.x - sx, p.y - sy, p.z - sz) > sr) why.push('off its cull sphere');
    if (b.hab === 'terrarium') {
      const [x, z] = CASES[Number(b.life.on[0].slice(5))];
      if (o.x0 < x - CASE.w / 2 || o.x1 > x + CASE.w / 2 || o.z0 < z - CASE.d / 2 || o.z1 > z + CASE.d / 2 || o.y0 < CASE.stand + 2 - 0.01 || o.y1 > CASE.stand + CASE.h) why.push('out of its case');
    }
    if (why.length && out.bad.length < 3) out.bad.push(`${(i / FPS).toFixed(1)}s ${why.join(', ')}`);
    if (!Number.isNaN(px)) {
      // (its pace over the ground, as the island's critterPath.test: a flier's bob and a hop's arc aside; on a trunk, along its bark)
      const bark = b.hab === 'trunk' || b.hab === 'palm';
      const v = Math.hypot(p.x - px, bark ? p.y - py : 0, p.z - pz) * FPS;
      out.top = Math.max(out.top, v);
      out.moved += v / FPS;
      if (v < 1) out.slow++;
    }
    if (p.sat) out.sat++;
    out.flapped.add(Math.round(p.flap * 10));
    out.frames++;
    px = p.x;
    py = p.y;
    pz = p.z;
    const h = Math.atan2(p.fx, p.fz);
    if (i) out.turned += Math.abs(Math.atan2(Math.sin(h - ph), Math.cos(h - ph)));
    ph = h;
  }
  return out;
});

/** The fastest each goes (u/s; NH's paces, the island's: critterPath FLY_UPS, PACE), a curve's peak 1.8× its mean. */
const TOP: Record<Habitat, number> = {
  fly: FLY_UPS.flutter[1] * 1.8, dart: FLY_UPS.dart[1] * 1.8, drift: FLY_UPS.drift[1] * 1.8, hop: 120, trunk: 50, palm: 50,
  leaf: 5, ground: 200, water: 85, terrarium: 110, flower: 8, dangle: 4
};

describe('the bug wing’s bugs (bugLife.ts: the island’s motion, NH’s museum)', () => {
  it('one bug a trunk and a branch: an oak each, the palm one', () => {
    expect(slotsOf('walking-stick', 'trunk').map((s) => s.i)).toEqual(OAKS.map((_, i) => i));
    expect(slotsOf('bagworm', 'dangle').map((s) => s.i)).toEqual(OAKS.map((_, i) => i));
    expect(slotsOf('coconut-crab', 'palm').length).toBe(1);
  });
  it('every bug stays in its enclosure or case over two minutes: never in a prop, a trunk, a flower, the glass or the ground', () => {
    const bad = runs.filter((r) => r.bad.length).map((r) => `${r.id} (${r.hab} ${r.slot}): ${r.bad.join('; ')}`);
    expect(bad).toEqual([]);
  });
  it('each kind keeps its pace: none faster than NH’s', () => {
    const fast = runs.filter((r) => r.top > (r.id === 'honeybee' ? FLY_UPS.bee[1] * 1.8 : TOP[r.hab])).map((r) => `${r.id} ${r.top.toFixed(1)} u/s`);
    expect(fast).toEqual([]);
  });
  it('the fliers fly about, a dragonfly hovers between darts, every crawler and hopper goes and rests', () => {
    const still = (r: (typeof runs)[number]) => r.hab === 'flower' && r.id !== 'stinkbug' && r.id !== 'man-faced-stink-bug' || r.hab === 'dangle' || r.id === 'cicada-shell';
    const lazy = runs.filter((r) => !still(r) && r.moved < (r.hab === 'leaf' ? 3 : r.hab === 'trunk' || r.hab === 'palm' ? 8 : r.hab === 'fly' || r.hab === 'dart' ? 600 : 15) && r.turned < 6).map((r) => `${r.id} (${r.hab} ${r.slot}) moved ${r.moved.toFixed(0)}u`);
    const restless = runs.filter((r) => !still(r) && r.hab !== 'fly' && r.hab !== 'drift' && r.slow / r.frames < 0.2).map((r) => `${r.id} rests ${((100 * r.slow) / r.frames).toFixed(0)}%`);
    expect([...lazy, ...restless]).toEqual([]);
  });
  it('the butterflies and moths land on the flowers, the bee buzzes from flower to flower; their wings open and close', () => {
    const landers = runs.filter((r) => r.hab === 'fly' && /butterfly|birdwing|bluebottle|emperor|moth|honeybee/.test(r.id));
    expect(new Set(landers.map((r) => r.id)).size).toBeGreaterThan(12);
    // (in one of its places at least: over the oak's row no flower is clear of a birdwing's wings)
    const never = [...new Set(landers.map((r) => r.id))].filter((id) => id !== 'honeybee' && landers.every((r) => r.id !== id || r.sat === 0));
    const bee = runs.find((r) => r.id === 'honeybee')!;
    const beeHovers = bee.slow;
    const stiff = runs.filter((r) => r.flaps && r.flapped.size < 5).map((r) => r.id);
    expect({ never, beeHovers: beeHovers > 0, stiff }).toEqual({ never: [], beeHovers: true, stiff: [] });
  });
  it('no two on show ever meet: two bugs in places that take no spot in common keep to rooms apart (none stacks on another)', () => {
    // (every pair of species in every pair of places the pick may give them together: all the room each took in two
    // minutes, its body's bounds, kept apart)
    const out: string[] = [];
    for (const a of runs) for (const b of runs) {
      if (a.id >= b.id || a.takes.some((t) => b.takes.includes(t))) continue;
      if (meets(a.room, { ...b.room, what: '' }, 0)) out.push(`${a.id} (${a.hab} ${a.slot}) and ${b.id} (${b.hab} ${b.slot})`);
    }
    expect([...new Set(out.map((s) => s.replace(/[a-z-]+ \(/g, '(')))]).toEqual([]);
  });
});
