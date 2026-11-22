// The first person's lens (lens.svelte.ts): a pinch's zoom clamped between 50° and 130° (70° to start), kept on this phone
// (DEVICE.fpvFov), and a pinch at the eyes changes it, never the room's zoom (gesture.ts).
import { describe, expect, it, vi } from 'vitest';

const kv = vi.hoisted(() => new Map<string, string>([['island.fpvFov', '88.5']]));
vi.mock('#lib/sync/storage.ts', async (orig) => {
  const real = await orig<typeof import('#lib/sync/storage.ts')>();
  const store = { getItem: (k: string) => kv.get(k) ?? null, setItem: (k: string, v: string) => void kv.set(k, v), removeItem: (k: string) => void kv.delete(k) };
  return { ...real, localKV: () => store };
});
const { FOV, FOV_MIN, FOV_MAX, clampFov, zoomFov, lens, setLens } = await import('./lens.svelte.ts');
const { roomCamera } = await import('./gesture.ts');

const half = (d: number) => Math.tan((d * Math.PI) / 360);

describe('the lens', () => {
  it('is clamped to 50°…130°, 70° to start (junk: the start)', () => {
    expect([FOV_MIN, FOV, FOV_MAX]).toEqual([50, 70, 130]);
    expect(clampFov(30)).toBe(50);
    expect(clampFov(150)).toBe(130);
    expect(clampFov(85)).toBe(85);
    expect(clampFov(NaN)).toBe(70);
  });
  it('a pinch zooms it as a camera would: fingers together widen it, apart narrow it, the world scaled by the spread', () => {
    const wide = zoomFov(70, 0.8);
    expect(wide).toBeGreaterThan(70);
    expect(half(wide)).toBeCloseTo(half(70) / 0.8, 6);
    expect(zoomFov(wide, 1.25)).toBeCloseTo(70, 6);
    expect(zoomFov(90, 1)).toBeCloseTo(90, 9);
    // (never past either end, however far the fingers go)
    expect(zoomFov(70, 0.01)).toBe(130);
    expect(zoomFov(130, 50)).toBe(50);
  });
  it('is kept on this phone: read at start, written (to a tenth) on a change, clamped', () => {
    expect(lens.fov).toBe(88.5);
    setLens(93.27);
    expect(lens.fov).toBe(93.3);
    expect(kv.get('island.fpvFov')).toBe('93.3');
    setLens(400);
    expect(kv.get('island.fpvFov')).toBe('130');
  });
  it('a pinch at the eyes changes the lens, never the room’s zoom or pan; off them, the room’s zoom', () => {
    setLens(70);
    let at = true;
    const cam = { look: vi.fn(), orbit: vi.fn(), pinch: vi.fn(), fling: vi.fn(), zoom: vi.fn(), isDefault: () => true };
    const c = roomCamera(() => cam, () => at, () => {});
    c.fingers.pinch(0.8, 10, 10, 100, 100);
    c.fingers.fling(1, 1);
    expect(lens.fov).toBeCloseTo(zoomFov(70, 0.8), 1);
    expect(cam.pinch).not.toHaveBeenCalled();
    expect(cam.fling).not.toHaveBeenCalled();
    at = false;
    c.fingers.pinch(0.8, 10, 10, 100, 100);
    expect(cam.pinch).toHaveBeenCalledOnce();
    expect(lens.fov).toBeCloseTo(zoomFov(70, 0.8), 1);
  });
});
