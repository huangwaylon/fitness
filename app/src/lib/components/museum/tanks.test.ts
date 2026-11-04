// The aquarium's tanks and their swimmers (museum/tanks.ts, boids.ts).
import { describe, expect, test } from 'vitest';
import { spawn, stepSchool, swimBox, type Swimmer } from './boids.ts';
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
