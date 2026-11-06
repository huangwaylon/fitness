// The museum's hour (hourFader.ts): the clock read once a second for a new hour, a fade over FADE on screen and at once
// off it, a material dithered only while it fades.
import { describe, expect, test } from 'vitest';
import { MeshLambertMaterial } from 'three';
import { FADE, ditherMaterial, fadeMaterial, fadeStep, hourWatch } from './hourFader.ts';

describe("the museum's hour", () => {
  test('the hour turns once, read at most once a second', () => {
    let now = Date.parse('2026-11-04T12:59:59.5+09:00');
    const h = hourWatch(() => now), h0 = h.hour;
    expect(h.tick(0)).toBe(false);
    now += 1000;
    expect(h.tick(500)).toBe(false); // (not read yet)
    expect(h.tick(1000)).toBe(true);
    expect(h.hour).toBe(h0 + 1);
    expect(h.tick(2000)).toBe(false);
  });

  test('a fade: FADE seconds on screen, at once off it, kept within 0…1', () => {
    expect(fadeStep(0, 1, (FADE * 1000) / 2, true)).toBeCloseTo(0.5);
    expect(fadeStep(0.9, 1, FADE * 1000, true)).toBe(1);
    expect(fadeStep(0.1, -1, FADE * 1000, true)).toBe(0);
    expect(fadeStep(0.3, 1, 16, false)).toBe(1);
    expect(fadeStep(0.3, -1, 16, false)).toBe(0);
  });

  test('a material dithered only while it fades, recompiled only when that changes', () => {
    const m = new MeshLambertMaterial(), v0 = m.version;
    fadeMaterial(m, 0.4);
    expect([m.alphaHash, m.opacity, m.version]).toEqual([true, 0.4, v0 + 1]);
    fadeMaterial(m, 0.6);
    expect(m.version).toBe(v0 + 1);
    fadeMaterial(m, 1);
    expect([m.alphaHash, m.opacity, m.version]).toEqual([false, 1, v0 + 2]);
    ditherMaterial(m, false);
    expect(m.version).toBe(v0 + 2);
  });
});
