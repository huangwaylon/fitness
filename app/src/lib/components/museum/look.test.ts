// The museum's light (look.ts): every wing's look within the exposure cap, its walls lit at least near its floor's level,
// night warmer and no darker than 0.8× day (the lamps take over), the night recipe's strengths, the blend between two
// looks, and the look put on three's lights and renderer (Neutral tone mapping).
import { describe, expect, test } from 'vitest';
import { AmbientLight, Color, DirectionalLight, HemisphereLight, NeutralToneMapping, NoToneMapping, type ToneMapping } from 'three';
import { KEY, LIFT, LOOK, POOL, TINT, WATER_GLOW, applyLook, blendLook, lookAt, luma } from './look.ts';
import type { Wing } from './plan.ts';

const WINGS: Wing[] = ['hall', 'bug', 'fish', 'sea', 'fossil', 'art'];
const UP = [0, 1, 0] as const, WALL = [0, 0, 1] as const, SIDE = [1, 0, 0] as const;
const warmth = (hex: number) => {
  const c = new Color(hex);
  return c.r - c.b;
};

describe("the museum's looks", () => {
  test('every wing within the exposure cap, by day and night, its background never near black', () => {
    for (const w of WINGS) {
      for (const n of [0, 0.5, 1]) expect(lookAt(w, n).exposure).toBeLessThanOrEqual(1.15);
      expect(lookAt(w, 0, { exposure: 2 }).exposure).toBe(1.15);
      const bg = new Color(LOOK[w].bg);
      expect(Math.max(bg.r, bg.g, bg.b)).toBeGreaterThan(0.004);
    }
  });

  test('day: the floors and the camera-facing walls bright, the walls at least 0.8× the floor (not half), the aquarium darker than the hall', () => {
    for (const w of WINGS) {
      const floor = luma(LOOK[w], UP), wall = luma(LOOK[w], WALL), side = luma(LOOK[w], SIDE);
      expect(floor).toBeGreaterThan(0.6);
      expect(floor).toBeLessThan(0.97);
      expect(wall).toBeGreaterThan(0.8 * floor);
      expect(side).toBeGreaterThan(0.5);
    }
    expect(luma(LOOK.fish, UP)).toBeLessThan(luma(LOOK.hall, UP));
  });

  test('night: at least 0.8× day everywhere (a wall, a floor in a pool), and warmer where lamps light it', () => {
    for (const w of WINGS) {
      const d = lookAt(w, 0), n = lookAt(w, 1);
      const pool = w === 'bug' ? ([0, 0, 0] as const) : ([0.3, 0.25, 0.18] as const);
      for (const [nm, baked] of [[UP, pool], [WALL, [0, 0, 0]], [SIDE, [0, 0, 0]]] as const) {
        expect(luma(n, nm, 0.8, baked)).toBeGreaterThanOrEqual(0.8 * luma(d, nm, 0.8, baked));
      }
      if (w !== 'fish' && w !== 'sea') expect(warmth(n.sky)).toBeGreaterThan(warmth(d.sky));
    }
  });

  test("the night recipe: the pools ×1.5, the lamps 0.6 → 1, the cards ×1.4, the key ×0.6 (the bug wing's ×0.5), the tanks' glow ×1.3", () => {
    const d = lookAt('hall', 0), n = lookAt('hall', 1);
    expect(n.lm).toBeCloseTo(d.lm * 1.5);
    expect([d.lamp, n.lamp]).toEqual([0.6, 1]);
    expect(n.cards).toBeCloseTo(1.4);
    expect(n.keyI).toBeCloseTo(d.keyI * 0.6);
    expect(n.exposure).toBeCloseTo(d.exposure - 0.05);
    expect(n.ambI).toBe(d.ambI);
    expect(lookAt('bug', 1).keyI).toBeCloseTo(LOOK.bug.keyI * 0.5);
    expect([lookAt('fish', 1).glow, lookAt('hall', 1).glow]).toEqual([1.3, 1]);
    expect(lookAt('fish', 1).hemi).toBeCloseTo(LOOK.fish.hemi * 0.75);
    // (clamped: past night is night)
    expect(lookAt('art', 3)).toEqual(lookAt('art', 1));
    expect(lookAt('art', -1)).toEqual(lookAt('art', 0));
  });

  test("a tuning's partial on the day look, carried through the night", () => {
    const n = lookAt('fossil', 1, { hemi: 3, bg: 0x102030 });
    expect(n.hemi).toBeCloseTo(3 * 0.85);
    expect(n.bg).toBe(0x102030);
    expect(LOOK.fossil.hemi).toBe(2.1);
  });

  test('two looks blended: each end itself, between them in the middle', () => {
    expect(blendLook(LOOK.hall, LOOK.fish, 0)).toEqual(LOOK.hall);
    expect(blendLook(LOOK.hall, LOOK.fish, 1)).toEqual(LOOK.fish);
    const m = blendLook(LOOK.hall, LOOK.fish, 0.5);
    expect(m.hemi).toBeCloseTo((LOOK.hall.hemi + LOOK.fish.hemi) / 2);
    const b = new Color(m.bg), h = new Color(LOOK.hall.bg), f = new Color(LOOK.fish.bg);
    expect(b.b).toBeGreaterThan(h.b);
    expect(b.b).toBeLessThan(f.b);
  });

  test("the dark tints gone: every floor and wall tint near white, the pools' colours warm (the aquarium's blue), the exhibits' self-light", () => {
    for (const w of WINGS) for (const hex of [TINT[w].floor, TINT[w].wall]) for (const sh of [16, 8, 0]) expect((hex >> sh) & 255).toBeGreaterThanOrEqual(0xd6);
    for (const w of ['hall', 'fossil', 'art'] as const) expect(warmth(POOL[w])).toBeGreaterThan(0);
    expect(warmth(POOL.fish)).toBeLessThan(0);
    // (the paintings lit most of the still exhibits, never past the creatures; the water's glow a deep blue)
    expect(LIFT.painting).toBeGreaterThan(LIFT.statue);
    for (const v of Object.values(LIFT)) (expect(v).toBeGreaterThan(0), expect(v).toBeLessThanOrEqual(LIFT.creature));
    expect(warmth(WATER_GLOW)).toBeLessThan(0);
  });

  test("applied: three's lights, Neutral tone mapping and the exposure, the key's place, the background", () => {
    const hemi = new HemisphereLight(), key = new DirectionalLight(), amb = new AmbientLight();
    const renderer: { toneMapping: ToneMapping; toneMappingExposure: number } = { toneMapping: NoToneMapping, toneMappingExposure: 1 };
    const scene: { background: unknown } = { background: null };
    const L = lookAt('art', 0);
    applyLook({ hemi, key, amb }, renderer, scene, L);
    expect(renderer).toEqual({ toneMapping: NeutralToneMapping, toneMappingExposure: L.exposure });
    expect([hemi.color.getHex(), hemi.groundColor.getHex(), hemi.intensity]).toEqual([L.sky, L.ground, L.hemi]);
    expect([key.color.getHex(), key.intensity, amb.color.getHex(), amb.intensity]).toEqual([L.key, L.keyI, L.amb, L.ambI]);
    expect(key.position.toArray()).toEqual([...KEY]);
    const bg = scene.background as Color;
    expect(bg.getHex()).toBe(L.bg);
    applyLook({ hemi, key, amb }, renderer, scene, lookAt('fish', 1));
    expect(scene.background).toBe(bg);
    expect(bg.getHex()).toBe(LOOK.fish.bg);
  });
});
