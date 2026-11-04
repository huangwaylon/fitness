// The aquarium's tanks and their swimmers (museum/tanks.ts, boids.ts): every fish, crab and prop all inside its glass.
import { describe, expect, test } from 'vitest';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { bandOf, cruiseOf, poseOf, spawn, stepSchool, stepWalker, swimBox, type Swimmer } from './boids.ts';
import { TANKS, backOf, bodyIn, openOf, propsOf, waterOf, type Box, type Tank } from './tanks.ts';
import { FISH_IDS, WALKERS, tankOf } from './species.ts';
import { ENTRANCE, FISH_WING, navOf, walkPath } from './plan.ts';
import { modelBounds } from '../world3d/models3d.ts';
import M from './models.json' with { type: 'json' };

const tank = (id: string) => TANKS.find((t) => t.id === id)!;
const inside = (b: Box, p: readonly number[], e = 1e-6) =>
  p[0] >= b.x0 - e && p[0] <= b.x1 + e && p[1] >= b.y0 - e && p[1] <= b.y1 + e && p[2] >= b.z0 - e && p[2] <= b.z1 + e;

/** A fish of NH's in its tank as the aquarium draws it: its body (tanks.ts bodyIn, from its model's bounds) and a swimmer. */
function fishIn(t: Tank, id: string, seed: number) {
  const b = modelBounds(`critters/fish/${id}`)!;
  const walker = !!WALKERS[id], body = bodyIn(t, b.min, b.max, walker), w = openOf(t);
  const f = spawn(w, body.r, body.reach, walker ? 3 : cruiseOf(body.r), seed, bandOf(id));
  if (walker) f.p[1] = w.y0 + body.half[1] * body.s;
  return { id, body, f, walker: WALKERS[id] };
}
/** Its model's box's corners where it's drawn (aquarium.ts write: turned, pitched, banked, scaled about its middle),
 *  its tail's sway widening it either side. */
const M4 = new Matrix4(), Q = new Quaternion(), Qp = new Quaternion(), V = new Vector3();
function corners(x: ReturnType<typeof fishIn>): Vector3[] {
  const [yaw, pitch, roll] = poseOf(x.f), [hx, hy, hz] = x.body.half, sw = x.body.sway;
  Q.setFromAxisAngle(new Vector3(0, 1, 0), yaw).multiply(Qp.setFromAxisAngle(new Vector3(1, 0, 0), pitch)).multiply(Qp.setFromAxisAngle(new Vector3(0, 0, 1), roll));
  M4.compose(V.set(...x.f.p), Q, new Vector3().setScalar(x.body.s));
  const out: Vector3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) out.push(new Vector3(sx * (hx + sw), sy * hy, sz * hz).applyMatrix4(M4));
  return out;
}

describe('the tanks', () => {
  test('three, in the aquarium wing, none over another, the walk round them from the hall', () => {
    expect(TANKS.map((t) => t.id).sort()).toEqual(['deep', 'river', 'sea']);
    for (const t of TANKS) expect(t.box.x0 >= FISH_WING.x0 && t.box.x1 <= FISH_WING.x1 && t.box.z0 >= FISH_WING.z0 && t.box.z1 <= FISH_WING.z1, t.id).toBe(true);
    for (const a of TANKS)
      for (const b of TANKS)
        if (a !== b) expect(a.box.x0 < b.box.x1 + 8 && b.box.x0 < a.box.x1 + 8 && a.box.z0 < b.box.z1 + 8 && b.box.z0 < a.box.z1 + 8, `${a.id} ${b.id}`).toBe(false);
    // from the door to the aisle, in front of the river tank and up to the deep tank's glass
    const g = navOf(TANKS.map((t) => t.box));
    for (const to of [[160, -10], [160, 80], [245, 10]] as const) {
      const p = walkPath(g, ENTRANCE, to);
      expect(Math.hypot(p.at(-1)![0] - to[0], p.at(-1)![1] - to[1]), `${to}`).toBeLessThan(1);
    }
  });
  test('the big ones fit: a whale shark in the great tank, an oarfish in the deep, an arapaima in the river; a neon tetra drawn bigger', () => {
    for (const [id, t] of [['whale-shark', 'sea'], ['oarfish', 'deep'], ['arapaima', 'river']] as const) {
      expect(tankOf(id)).toBe(t);
      const x = fishIn(tank(t), id, 1), w = openOf(tank(t));
      expect(x.body.s).toBeLessThan(1);
      // (room to turn: its reach well under half its water's narrowest)
      expect(x.body.reach[0] * 2).toBeLessThanOrEqual(0.8 * Math.min(w.x1 - w.x0, w.z1 - w.z0) + 1e-9);
    }
    expect(fishIn(tank('river'), 'neon-tetra', 1).body.s).toBeGreaterThan(1);
  });
  test('every prop on its tank’s sand, all of it inside the glass, under the water’s top, and in its back strip: none reaches into the fish’s open water', () => {
    const models = M.models as Record<string, { min: number[]; max: number[] }>;
    for (const t of TANKS) {
      const w = waterOf(t), back = backOf(t), open = openOf(t), ps = propsOf(t);
      expect(ps.length, t.id).toBeGreaterThan(0);
      // (the open water and the back strip apart, both in the water)
      for (const b of [back, open]) expect(inside(w, [b.x0, b.y0, b.z0]) && inside(w, [b.x1, b.y1, b.z1]), t.id).toBe(true);
      expect(back.x0 >= open.x1 || back.x1 <= open.x0 || back.z0 >= open.z1 || back.z1 <= open.z0, t.id).toBe(true);
      for (const p of ps) {
        const b = models[p.name];
        expect(p.y, `${t.id} ${p.name}`).toBe(w.y0);
        // (its box's middle over the spot, its foot on the sand, turned by its yaw: engine.ts Kit.prop)
        const m = new Matrix4().compose(new Vector3(p.x, p.y, p.z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), p.yaw), new Vector3().setScalar(p.s));
        const mid = [(b.min[0] + b.max[0]) / 2, b.min[1], (b.min[2] + b.max[2]) / 2];
        for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) {
          const c = new Vector3(x - mid[0], y - mid[1], z - mid[2]).applyMatrix4(m);
          expect(inside(back, c.toArray()), `${t.id} ${p.name} ${c.toArray().map((v) => v.toFixed(1))}`).toBe(true);
        }
      }
    }
  });
});

describe('the swimmers (boid-like), all of each inside its glass', () => {
  test('every species in its tank, five at a time, swims for two minutes: every corner of its body (turned, pitched, banked, its tail swaying) in the open water, clear of every prop', () => {
    // (the misses collected, checked once: an expect a sample is too slow for CI's 5 s)
    const out: string[] = [];
    for (const t of TANKS) {
      const w = openOf(t), ids = FISH_IDS.filter((id) => tankOf(id) === t.id && modelBounds(`critters/fish/${id}`));
      expect(ids.length, t.id).toBeGreaterThan(0);
      for (let g = 0; g < ids.length; g += 5) {
        const five = ids.slice(g, g + 5).map((id, i) => fishIn(t, id, g * 7 + i * 13 + 3));
        const swim = five.filter((x) => !x.walker), walk = five.filter((x) => x.walker);
        for (let k = 0; k < 120 * 30; k++) {
          stepSchool(swim.map((x) => x.f), w, 1 / 30, k / 30);
          for (const x of walk) stepWalker(x.f, w, 1 / 30, k / 30, x.walker === 'side', walk.map((y) => y.f));
          if (k % 23) continue;
          for (const x of five) for (const c of corners(x)) if (!inside(w, c.toArray())) out.push(`${t.id} ${x.id} at ${k}: ${c.toArray().map((v) => v.toFixed(2))}`);
          for (const x of swim) if (!(Math.hypot(...x.f.v) <= x.f.speed * 1.31)) out.push(`${t.id} ${x.id} at ${k}: speed ${Math.hypot(...x.f.v).toFixed(2)}`);
        }
      }
    }
    expect(out.slice(0, 10)).toEqual([]);
  });
  test('it moves (not stuck in a corner), mostly along its tank’s long side', () => {
    const w = waterOf(tank('sea'));
    const f = spawn(w, 5, [6, 3], 8, 5);
    let along = 0, across = 0, travelled = 0;
    const x0 = f.p[0];
    for (let k = 0; k < 3000; k++) {
      stepSchool([f], w, 1 / 30, k / 30);
      along += Math.abs(f.v[0]);
      across += Math.abs(f.v[2]);
      travelled = Math.max(travelled, Math.abs(f.p[0] - x0));
    }
    expect(along).toBeGreaterThan(across);
    expect(travelled).toBeGreaterThan(40);
  });
});

describe('the bottom walkers (a crab, a crawfish) on the river tank’s sand', () => {
  const w = waterOf(tank('river'));
  const walk = (sideways: boolean) => {
    const f: Swimmer = spawn(w, 2, [3, 1], 3, 41);
    f.p[1] = w.y0 + 1;
    let moved = 0, square = 0, ahead = 0, rests = 0, travelled = 0;
    const x0 = f.p[0], z0 = f.p[2];
    for (let k = 0; k < 60 * 30; k++) {
      stepWalker(f, w, 1 / 30, k / 30, sideways);
      expect(inside(swimBox(w, f.reach), f.p), `at ${k}`).toBe(true);
      expect(f.p[1]).toBe(w.y0 + 1);
      const sp = Math.hypot(f.v[0], f.v[2]);
      travelled = Math.max(travelled, Math.hypot(f.p[0] - x0, f.p[2] - z0));
      if (sp < 1e-6) { rests++; continue; }
      moved++;
      // how square its facing is to its way (1: sideways, 0: ahead)
      const c = Math.abs(Math.sin(f.face! - Math.atan2(f.v[0], f.v[2])));
      if (c > 0.9) square++;
      if (c < 0.3) ahead++;
    }
    return { moved, square, ahead, rests, travelled };
  };
  test('they live in the river tank', () => {
    for (const id of Object.keys(WALKERS)) expect(tankOf(id), id).toBe('river');
  });
  test('a crab walks the sand sideways, with rests, never off it', () => {
    const c = walk(true);
    expect(c.moved).toBeGreaterThan(100);
    expect(c.rests).toBeGreaterThan(100);
    expect(c.travelled).toBeGreaterThan(4);
    expect(c.square / c.moved).toBeGreaterThan(0.8);
  });
  test('a crawfish turns to its way and walks ahead', () => {
    const c = walk(false);
    expect(c.moved).toBeGreaterThan(100);
    expect(c.ahead / c.moved).toBeGreaterThan(0.8);
  });
  test('two in one tank keep off each other’s way', () => {
    const a = spawn(w, 2.5, [3, 1], 3, 7), b = spawn(w, 2.5, [3, 1], 3, 99);
    a.p = [w.x0 + 20, w.y0 + 1, (w.z0 + w.z1) / 2];
    b.p = [w.x0 + 40, w.y0 + 1, (w.z0 + w.z1) / 2];
    let nearest = Infinity;
    for (let k = 0; k < 120 * 30; k++) {
      stepWalker(a, w, 1 / 30, k / 30, true, [a, b]);
      stepWalker(b, w, 1 / 30, k / 30, false, [a, b]);
      nearest = Math.min(nearest, Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2]));
    }
    expect(nearest).toBeGreaterThan((a.r + b.r) * 0.7);
  });
});
