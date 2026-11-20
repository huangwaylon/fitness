// The World's step under the scene's hook (camera.svelte.ts): someone walking off screen asks only for the ambience's
// frames, the game clock still stepping it (IslandScene anyMoving, scene.ts charInView).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ISLAND_BEND_R, World, horizonGuess, type Proj3 } from './camera.svelte.ts';
import { charInView, VILLAGER } from './scene.ts';
import type { At } from '../world3d/engine.ts';

/** A flat camera: a world point (x, z) at (x, z) px, `lift` up the screen, a unit a px; behind it past z 2000. */
const flat = (): Proj3 => ({
  at: (x, z, lift, out) => Object.assign(out ?? ({} as At), { sx: x, sy: z - lift, k: 1, up: 1, ground: 1, depth: z < 2000 ? 100 : -1, visible: true }),
  ground: () => null,
  horizon: () => 0,
  rev: () => 0,
  kick: vi.fn(),
  idle: () => true
});
const AT: At = { sx: 0, sy: 0, k: 0, up: 0, ground: 0, depth: 0, visible: false };

afterEach(() => vi.useRealTimers());

describe('an off-screen walker', () => {
  it('on screen or within a finger and its height of it: in view; past that, or behind the camera: not', () => {
    const p = flat(), m = 40 + VILLAGER.h;
    expect(charInView(p, 200, 400, 390, 844, AT)).toBe(true);
    expect(charInView(p, 390 + m - 1, 400, 390, 844, AT)).toBe(true);
    expect(charInView(p, 390 + m + 1, 400, 390, 844, AT)).toBe(false);
    // (its head over the bottom edge: in)
    expect(charInView(p, 200, 844 + VILLAGER.h * 1.3 + m - 1, 390, 844, AT)).toBe(true);
    expect(charInView(p, 200, 2400, 390, 844, AT)).toBe(false);
  });

  it("the hook's 'ambient' steps the game clock but asks no full rate; true does", () => {
    vi.useFakeTimers();
    const w = new World(), three = flat();
    w.useThree(three);
    let want: boolean | 'ambient' = 'ambient', steps = 0;
    w.onTick(() => (steps++, want));
    expect(w.step(0)).toBe('ambient');
    // (no frame comes: the game clock steps it on its own)
    vi.advanceTimersByTime(100);
    expect(steps).toBeGreaterThan(1);
    want = true;
    expect(w.step(0)).toBe(true);
    want = false;
    expect(w.step(0)).toBe(false);
    const n = steps;
    vi.advanceTimersByTime(200);
    expect(steps).toBe(n);
    w.useThree(null);
  });
});

describe("an overlay's anchor (World.at: the visitor's mumble caption)", () => {
  it('follows its live point upright at its true size (--inv), hidden while out of view', () => {
    const w = new World(), base = flat(), props: Record<string, string> = {};
    // (twice the size: k 2, its --inv ½ rounded up a step; past z 2000: not visible, as past the horizon)
    w.useThree({ ...base, at: (x, z, lift, out) => Object.assign(base.at(x, z, lift, out), { k: 2, visible: z < 2000 }) });
    let pos: [number, number, number] = [10, 100, 0];
    const style = { visibility: '', transform: '', zIndex: '', setProperty: (k: string, v: string) => void (props[k] = v) } as unknown as CSSStyleDeclaration;
    const off = w.at({ x: 10, z: 100, live: () => pos, inv: true, zi: 7 })({ style } as unknown as HTMLElement);
    w.step(0);
    expect([style.transform, props['--inv'], style.zIndex, style.visibility]).toEqual(['translate(10.0px,100.0px) scale(2.0000)', '0.507', '7', '']);
    pos = [10, 2400, 0];
    w.step(0);
    expect(style.visibility).toBe('hidden');
    pos = [30, 120, 0];
    w.step(0);
    expect([style.transform, style.visibility]).toEqual(['translate(30.0px,120.0px) scale(2.0000)', '']);
    off();
    w.useThree(null);
  });
});

describe('horizonGuess', () => {
  it("is the engine's horizon at the opening zoom (engine.ts horizon: islandCam's camera over the log)", async () => {
    const { PerspectiveCamera, Vector3 } = await import('three');
    const { FOV, backAt, dropPivot, horizonAt, pitchAt, pose } = await import('../world3d/islandCam.ts');
    const { bendU } = await import('../world3d/bend.ts');
    bendU.uBendR.value = ISLAND_BEND_R;
    for (const [w, h] of [[393, 852], [393, 659], [390, 600], [320, 568], [430, 932], [768, 1024]]) {
      const cam = new PerspectiveCamera(FOV, w / h, 20, 6000), camZ = 137, tg = new Float64Array(2);
      dropPivot(cam, w, h);
      pose(cam, 240, 0, camZ, backAt(w / h), pitchAt(1));
      horizonAt(cam, camZ, tg);
      const p = new Vector3(240, tg[0], tg[1]).project(cam);
      expect(horizonGuess(w, h)).toBeCloseTo(Math.max(0, ((1 - p.y) / 2) * h), 1);
    }
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(new URL('../world3d/engine.ts', import.meta.url), 'utf8')).toContain(`bendU.uBendR.value = ${ISLAND_BEND_R};`);
  });
});
