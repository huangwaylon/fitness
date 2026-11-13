// The World's step under the scene's hook (camera.svelte.ts): someone walking off screen asks only for the ambience's
// frames, the game clock still stepping it (IslandScene anyMoving, scene.ts charInView).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { World, type Proj3 } from './camera.svelte.ts';
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

describe('a rush hushes the nodes that paint nothing', () => {
  /** A node's element, painting (a fill) or not (a bare tap area), on a scene; getComputedStyle counted per element. */
  const scene = { id: 'scene' };
  const el = (fill: boolean) => ({
    fill, style: { setProperty() {}, visibility: '', opacity: '', clipPath: '' } as unknown as CSSStyleDeclaration, classList: { toggle() {} },
    toggleAttribute() {}, closest: () => scene, childNodes: [], children: [], localName: 'div', parentNode: null
  });
  it('styles a node once, from rush to rush, till something in it or on the scene changes', () => {
    const styled = new Map<unknown, number>();
    let cb: ((rs: { target: unknown; attributeName?: string }[]) => void) | null = null;
    const observed: unknown[] = [];
    vi.stubGlobal('getComputedStyle', (e: { fill: boolean }) => {
      styled.set(e, (styled.get(e) ?? 0) + 1);
      return { display: 'block', opacity: '1', visibility: 'visible', getPropertyValue: () => '', content: 'none', backgroundImage: 'none', backgroundColor: e.fill ? 'red' : 'transparent', boxShadow: 'none', borderTopWidth: '0', borderRightWidth: '0', borderBottomWidth: '0', borderLeftWidth: '0' };
    });
    vi.stubGlobal('MutationObserver', class {
      constructor(f: typeof cb) {
        cb = f;
      }
      observe(t: unknown) {
        observed.push(t);
      }
      disconnect() {}
    });
    try {
      let rushing = false;
      const w = new World(), three = { ...flat(), rushing: () => rushing };
      w.useThree(three);
      const bare = el(false), art = el(true);
      w.at({ x: 10, z: 10 })(bare as unknown as HTMLElement);
      w.at({ x: 20, z: 10 })(art as unknown as HTMLElement);
      // (placed: shown)
      w.step(0);
      const rush = () => {
        rushing = true;
        w.step(0);
        rushing = false;
        w.step(0);
      };
      rush();
      // (the bare one: itself, its ::before and ::after)
      expect([styled.get(bare), styled.get(art)]).toEqual([3, 1]);
      // (the bare one watched, and the scene)
      expect(observed).toEqual([bare, scene]);
      rush();
      rush();
      expect([styled.get(bare), styled.get(art)]).toEqual([3, 3]);
      // a mark put in it: styled again at the next rush
      cb!([{ target: bare }]);
      rush();
      expect(styled.get(bare)).toBe(6);
      // its own place written by the World: no change
      cb!([{ target: bare, attributeName: 'style' }]);
      rush();
      expect(styled.get(bare)).toBe(6);
      // night falls on the scene: all styled again
      cb!([{ target: scene, attributeName: 'data-tod' }]);
      rush();
      expect(styled.get(bare)).toBe(9);
      w.useThree(null);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
