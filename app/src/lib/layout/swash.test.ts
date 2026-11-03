import { describe, expect, test } from 'vitest';
import { defaultLayout } from './model.ts';
import { Ch, fieldsOf } from './fields.ts';
import { PERIOD, WATERLINE, frontAt, nextRunUp, phaseAt, shoreNormal, swash, washAt, washFrom, washMs } from './swash.ts';

const F = fieldsOf(defaultLayout());

describe('NH’s waves washing ashore (swash.ts)', () => {
  test('a wave runs up the sand easing out, drains back into the water, and the next comes in from out there: no jump', () => {
    const reach = 15;
    expect(frontAt(0, reach)).toBe(0);
    // the run-up: fast first, slowing to its reach
    expect(frontAt(0.32, reach)).toBeCloseTo(reach, 6);
    expect(frontAt(0.08, reach) - frontAt(0, reach)).toBeGreaterThan(frontAt(0.32, reach) - frontAt(0.24, reach));
    // the backwash: below the waterline at its end; the next foam line out in the water, reaching the waterline as the
    // next run-up starts (continuous over the cycle's end)
    expect(frontAt(0.779, reach)).toBeLessThan(0);
    expect(frontAt(0.781, reach)).toBeLessThan(-10);
    expect(frontAt(0.9999, reach)).toBeCloseTo(0, 1);
    // smooth within each part
    for (let u = 0; u < 0.995; u += 0.005) {
      if (u < 0.78 && u + 0.005 > 0.78) continue;
      expect(Math.abs(frontAt(u + 0.005, reach) - frontAt(u, reach))).toBeLessThan(1);
    }
  });
  test('the sand under the wave is covered, wet once it drains past, and dries; above its reach it stays dry', () => {
    const [x, z] = [150, -30];
    const t0 = nextRunUp(100, x, z) + 100;
    // run-up's peak: 4u up is under the water
    const peak = swash(4, t0 + 0.32 * PERIOD, x, z);
    expect(peak.covered).toBe(true);
    expect(peak.wet).toBe(1);
    // drained past: wet, drying over time
    const a = swash(4, t0 + 0.74 * PERIOD, x, z), b = swash(4, t0 + 0.95 * PERIOD, x, z);
    expect(a.covered).toBe(false);
    expect(a.wet).toBeGreaterThan(b.wet);
    expect(b.wet).toBeGreaterThan(0);
    // far up the beach: never wet
    for (let k = 0; k < 20; k++) expect(swash(40, t0 + k * 0.37, x, z).wet).toBe(0);
  });
  test('the next run-up: within a wave’s cycle, and the wave starts there then', () => {
    for (const [x, z, t] of [[150, -30, 0], [-40, 400, 1234.5], [500, 1700, 3599]]) {
      const w = nextRunUp(t, x, z);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(PERIOD + 1e-9);
      const c = (t + w) / PERIOD + phaseAt(x, z);
      expect(Math.min(c - Math.floor(c), Math.ceil(c) - c)).toBeLessThan(1e-6);
    }
  });
  test('the phase varies along the coast, slowly (several waves along a beach, out of step, never a shimmer)', () => {
    const ph = Array.from({ length: 61 }, (_, i) => phaseAt(i * 10, -30));
    expect(Math.max(...ph) - Math.min(...ph)).toBeGreaterThan(0.3);
    for (let i = 1; i < ph.length; i++) {
      const d = Math.abs(ph[i] - ph[i - 1]);
      expect(Math.min(d, 1 - d)).toBeLessThan(0.06);
    }
  });
});

describe('the shore’s normal and where a find washes in from', () => {
  test('on the front beach the normal points out to the front sea; on a side beach, out to its side', () => {
    const [nx, nz] = shoreNormal(F, 150, -10)!;
    expect(nz).toBeLessThan(-0.95);
    expect(Math.abs(nx)).toBeLessThan(0.3);
    // the left side's coast (the land starts 2–3 tiles in from the grid's edge)
    const x = -90 + 3 * 30 + 6, z = 600;
    if (F.at(Ch.land, x, z) < 0 && F.at(Ch.land, x, z) > -40) expect(shoreNormal(F, x, z)![0]).toBeLessThan(-0.9);
  });
  test('a find comes from just past the waterline straight out to sea from its spot, and slides up to it', () => {
    const w = washFrom(F, 150, 20)!;
    expect(w).not.toBeNull();
    expect(F.at(Ch.land, ...w.from)).toBeGreaterThan(WATERLINE);
    expect(Math.abs(F.at(Ch.land, ...w.coast))).toBeLessThan(2);
    expect(w.from[1]).toBeLessThan(20);
    expect(w.dist).toBeCloseTo(Math.hypot(w.from[0] - 150, w.from[1] - 20), 6);
    expect(Math.abs(w.from[0] - 150)).toBeLessThan(5);
    // in the sea or away from a shore: none
    expect(washFrom(F, 150, -200)).toBeNull();
  });
  test('the slide: ~1–1.5 s, easing out, fading in over its first part, at its spot at the end', () => {
    expect(washMs(5)).toBe(1000);
    expect(washMs(500)).toBe(1500);
    const wi = { from: [0, 0] as [number, number], to: [0, 40] as [number, number], t0: 1000, ms: 1200 };
    expect(washAt(wi, 900)).toMatchObject({ z: 0, a: 0, done: false });
    const s = Array.from({ length: 13 }, (_, i) => washAt(wi, 1000 + i * 100));
    for (let i = 1; i < s.length; i++) {
      expect(s[i].z).toBeGreaterThanOrEqual(s[i - 1].z);
      expect(s[i].a).toBeGreaterThanOrEqual(s[i - 1].a);
    }
    // eased out: most of the way in the first half
    expect(s[6].z).toBeGreaterThan(30);
    expect(s[3].a).toBeGreaterThan(0.3);
    expect(s[3].a).toBeLessThan(1);
    expect(s[12]).toMatchObject({ x: 0, z: 40, a: 1, done: true });
  });
});
