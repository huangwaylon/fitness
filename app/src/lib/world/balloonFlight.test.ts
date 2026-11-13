import { describe, expect, test } from 'vitest';
import { mulberry32 as mulberry } from '#lib/random.ts';
import { ALT, RIG, balloonModel, fallAt, fallMs, laneY, planFlight, rigAt, type SkyView } from './balloonFlight.ts';

/** A pinhole camera over the island like the 3D island's (no bend): at x 195, `back` u in front of the pivot z and
 *  `up` u high, looking down at the pivot; 390 × 844 px. */
function camera(pivot: number, zoom = 1, feet: (x: number, z: number) => number = () => 3): SkyView {
  const vw = 390, vh = 844, pitch = ((58 - 18 * ((zoom - 1) / 2.2)) * Math.PI) / 180, D = 1700 / zoom;
  const cy = D * Math.sin(pitch), cz = pivot - D * Math.cos(pitch), f = vh / 2 / Math.tan((15 * Math.PI) / 180);
  const at = (x: number, z: number, y: number): readonly [number, number] | null => {
    const dx = x - 195, dy = y - cy, dz = z - cz;
    const depth = dz * Math.cos(pitch) - dy * Math.sin(pitch), upv = dz * Math.sin(pitch) + dy * Math.cos(pitch);
    if (depth < 1) return null;
    return [vw / 2 + (f * dx) / depth, vh / 2 + 0.16 * vh - (f * upv) / depth];
  };
  // the ground's z at a screen y (the middle column), by search
  const zAt = (sy: number) => {
    let a = pivot - 2000, b = pivot + 4000;
    for (let i = 0; i < 60; i++) {
      const m = (a + b) / 2, p = at(195, m, 3);
      if (p && p[1] > sy) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  return { at, feet, vw, top: 120, bottom: vh - 90, horizon: 60, cx: 195, z0: zAt(vh), z1: zAt(80) };
}

describe('balloonFlight.ts: the balloon present across the island', () => {
  for (const [name, v] of [['まえ, zoomed out', camera(200)], ['the back, zoomed out', camera(1200)], ['zoomed right in', camera(500, 3.2)]] as const)
    test(`${name}: from off one side to off the other, across the screen under the HUD, its shadow in view`, () => {
      for (let seed = 0; seed < 12; seed++) {
        const r = mulberry(seed), f = planFlight(v, r)!;
        expect(f).not.toBeNull();
        const a = v.at(f.x0, f.z, f.y)!, b = v.at(f.x1, f.z, f.y)!;
        // in from out of view, out again on the other side
        expect(Math.min(a[0], b[0])).toBeLessThan(-40);
        expect(Math.max(a[0], b[0])).toBeGreaterThan(v.vw + 40);
        // under the HUD with room for the balloon over its knot, over the bottom
        expect(a[1]).toBeGreaterThan(v.top + 30);
        expect(a[1]).toBeLessThan(v.bottom);
        // its shadow on the ground in view under it
        const sh = v.at(195, f.z, v.feet(195, f.z))!;
        expect(sh[1]).toBeLessThan(v.bottom);
        expect(sh[1]).toBeGreaterThan(a[1]);
        // a steady height well over the trees
        expect(f.y).toBe(laneY(v, f.z));
        expect(f.ms).toBeGreaterThan(18_000);
        expect(f.ms).toBeLessThan(30_000);
      }
    });

  test('it flies ALT over the highest ground under its lane (a cliff top in the lane), whatever the lane', () => {
    const cliff = (x: number, z: number) => (z > 700 ? 123 : x > 300 ? 43 : 3);
    expect(laneY({ feet: cliff }, 400)).toBe(43 + ALT);
    expect(laneY({ feet: cliff }, 690)).toBe(123 + ALT);
    const v = camera(600, 1, cliff), f = planFlight(v, mulberry(3))!;
    expect(f.y).toBeGreaterThanOrEqual(43 + ALT);
  });

  test('no lane when the sky under the HUD is too short (none this time)', () => {
    expect(planFlight({ ...camera(200), top: 700 })).toBeNull();
  });

  test('the rig: the balloon over its knot, the present hanging under it, bobbing gently at its height, drifting on', () => {
    const f = { x0: -100, x1: 500, z: 400, y: 200, ms: 24_000, ph: 1 };
    let lastX = -Infinity;
    for (let t = 0; t <= f.ms; t += 400) {
      const r = rigAt(f, t);
      expect(r.knot[0]).toBeGreaterThan(lastX);
      lastX = r.knot[0];
      expect(Math.abs(r.knot[1] - f.y)).toBeLessThanOrEqual(3.3);
      expect(Math.abs(r.knot[2] - f.z)).toBeLessThanOrEqual(5);
      expect(r.balloon[1] - r.knot[1]).toBeGreaterThan(RIG.balloon / 2 - 0.2);
      expect(r.knot[1] - r.gift[1]).toBeGreaterThan(RIG.string - 0.3);
      expect(Math.abs(r.lean)).toBeLessThan(0.08);
      expect(Math.abs(r.swing)).toBeLessThan(0.2);
    }
    expect(rigAt(f, f.ms).knot[0]).toBe(500);
  });

  test('the fall: from the string to its spot exactly, never under the ground, floaty (longer the further it drifts)', () => {
    const from = [300, 250, 1100] as const, to = [180, 3, 300] as const;
    expect(fallAt(from, to, 1).at).toEqual([180, 3, 300]);
    const start = fallAt(from, to, 0).at;
    expect(start[0]).toBe(300);
    expect(start[1]).toBeCloseTo(250 - RIG.gift);
    let lowest = Infinity;
    for (let k = 0; k <= 1; k += 0.02) lowest = Math.min(lowest, fallAt(from, to, k).at[1]);
    expect(lowest).toBeGreaterThanOrEqual(3 - 1e-6);
    // a little hop up first, then slow: a quarter of the way in it has dropped less than a quarter of the way
    expect(fallAt(from, to, 0.1).at[1]).toBeGreaterThan(start[1]);
    expect(start[1] - fallAt(from, to, 0.25).at[1]).toBeLessThan((start[1] - 3) * 0.25);
    const near = fallMs([180, 170, 320], to), far = fallMs(from, to);
    expect(near).toBeGreaterThanOrEqual(1600);
    expect(far).toBeGreaterThan(near);
    expect(far).toBeLessThanOrEqual(3000);
  });
});

describe('the balloon’s colour', () => {
  test('1 in 20 the gold; the other four each as likely', () => {
    const r = mulberry(7), n: Record<string, number> = {}, N = 20_000;
    for (let i = 0; i < N; i++) {
      const m = balloonModel(r);
      n[m] = (n[m] ?? 0) + 1;
    }
    expect(Object.keys(n).sort()).toEqual(['balloon/0', 'balloon/1', 'balloon/2', 'balloon/3', 'balloon/4']);
    expect(Math.abs(n['balloon/4'] / N - 0.05)).toBeLessThan(0.01);
    for (const c of [0, 1, 2, 3]) expect(Math.abs(n[`balloon/${c}`] / N - 0.95 / 4)).toBeLessThan(0.015);
  });
});
