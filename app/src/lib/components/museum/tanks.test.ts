// The aquarium's tanks and their swimmers (museum/tanks.ts, boids.ts).
import { describe, expect, test } from 'vitest';
import { spawn, stepSchool, stepWalker, swimBox, type Swimmer } from './boids.ts';
import { TANKS, fishScale, waterOf } from './tanks.ts';
import { FISH_WING } from './plan.ts';

const inside = (b: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }, p: number[]) =>
  p[0] >= b.x0 - 1e-9 && p[0] <= b.x1 + 1e-9 && p[1] >= b.y0 - 1e-9 && p[1] <= b.y1 + 1e-9 && p[2] >= b.z0 - 1e-9 && p[2] <= b.z1 + 1e-9;

describe('the tanks', () => {
  test('each in the aquarium wing, none over another', () => {
    for (const t of TANKS) expect(t.box.x0 >= FISH_WING.x0 && t.box.x1 <= FISH_WING.x1 && t.box.z0 >= FISH_WING.z0 && t.box.z1 <= FISH_WING.z1, t.id).toBe(true);
    for (const a of TANKS)
      for (const b of TANKS)
        if (a !== b) expect(a.box.x0 < b.box.x1 && b.box.x0 < a.box.x1 && a.box.z0 < b.box.z1 && b.box.z0 < a.box.z1, `${a.id} ${b.id}`).toBe(false);
  });
  test('a whale shark fits the great tank; a neon tetra is drawn bigger in its small one', () => {
    const sea = TANKS.find((t) => t.id === 'sea')!, small = TANKS.find((t) => t.id === 'small-5')!;
    expect(39.5 * fishScale(sea, 39.5)).toBeLessThanOrEqual(sea.maxLen);
    expect(fishScale(small, 2.2)).toBeGreaterThan(1);
  });
});

describe('the swimmers (boid-like)', () => {
  test('in every tank, a shoal swims for ten minutes and never leaves its water (its body inside), keeping a speed', () => {
    for (const t of TANKS) {
      const w = waterOf(t);
      const fish: Swimmer[] = [3, 6, 12].map((len, i) => spawn(w, (len * fishScale(t, len)) / 2, 6 + i, i * 17 + 3));
      for (const f of fish) expect(inside(swimBox(w, f.r), f.p), `${t.id} spawn`).toBe(true);
      for (let k = 0; k < 600 * 30; k++) {
        stepSchool(fish, w, 1 / 30, k / 30);
        if (k % 97) continue;
        for (const f of fish) {
          expect(inside(swimBox(w, f.r), f.p), `${t.id} at ${k}`).toBe(true);
          expect(Math.hypot(...f.v)).toBeLessThanOrEqual(f.speed * 1.31);
        }
      }
    }
  });
  test('it moves (not stuck in a corner), mostly along its tank’s long side', () => {
    const t = TANKS.find((x) => x.id === 'sea')!, w = waterOf(t);
    const f = spawn(w, 5, 8, 5);
    let along = 0, across = 0, x0 = f.p[0], travelled = 0;
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

describe('the bottom walkers (a crab, a crawfish)', () => {
  const t = TANKS.find((x) => x.id === 'small-8')!, w = waterOf(t);
  const walk = (sideways: boolean) => {
    const f = spawn(w, 2, 3, 41);
    f.p[1] = w.y0 + 1;
    let moved = 0, square = 0, ahead = 0, rests = 0, travelled = 0;
    const x0 = f.p[0], z0 = f.p[2];
    for (let k = 0; k < 60 * 30; k++) {
      stepWalker(f, w, 1 / 30, k / 30, sideways);
      expect(inside(swimBox(w, f.r), f.p), `at ${k}`).toBe(true);
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
    const a = spawn(w, 2.5, 3, 7), b = spawn(w, 2.5, 3, 99);
    a.p = [w.x0 + 4, w.y0 + 1, (w.z0 + w.z1) / 2];
    b.p = [w.x1 - 4, w.y0 + 1, (w.z0 + w.z1) / 2];
    let nearest = Infinity;
    for (let k = 0; k < 120 * 30; k++) {
      stepWalker(a, w, 1 / 30, k / 30, true, [a, b]);
      stepWalker(b, w, 1 / 30, k / 30, false, [a, b]);
      nearest = Math.min(nearest, Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2]));
    }
    expect(nearest).toBeGreaterThan((a.r + b.r) * 0.7);
  });
});
