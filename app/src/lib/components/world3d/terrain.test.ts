// The island's ground kept CPU-side page-wide for one layout (terrain.ts `kept`): a second mount (back from a room)
// takes every band's arrays again, building no chunk; another layout's build replaces the set.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { codeOf, idx } from '#lib/layout/grid.ts';
import { Layout, defaultLayout } from '#lib/layout/model.ts';
import type { WebGLRenderer } from 'three';

const built = vi.hoisted(() => ({ n: 0 }));
vi.mock('#lib/layout/mesh.ts', async (orig) => {
  const m = await orig<typeof import('#lib/layout/mesh.ts')>();
  return { ...m, chunkMesh: (l: Layout, c: number) => (built.n++, m.chunkMesh(l, c)) };
});

const renderer = { getRenderTarget: () => null, setRenderTarget() {}, render() {} } as unknown as WebGLRenderer;
const image = () => ({ addEventListener() {}, removeEventListener() {}, style: {}, set src(_: string) {} });
beforeEach(() => vi.stubGlobal('document', { baseURI: 'http://x/', createElementNS: image, createElement: image }));
afterEach(() => vi.unstubAllGlobals());

const positions = (g: { group: { children: unknown[] } }) =>
  (g.group.children as { geometry: { getAttribute(n: string): { array: Float32Array } | undefined } }[]).map((m) => [...(m.geometry.getAttribute('position')?.array ?? [])].length);

describe('the ground kept for a layout', () => {
  it('a second mount builds no chunk and has the same ground; another layout builds its own', async () => {
    const { buildGround, keptBytes, forgetBands } = await import('./terrain.ts');
    forgetBands();
    const l = defaultLayout();
    built.n = 0;
    const a = buildGround(l, { renderer, stairs: false });
    const first = built.n;
    expect(first).toBeGreaterThan(0);
    const bytes = keptBytes();
    expect(bytes).toBeGreaterThan(0);
    a.dispose();
    // back from a room: the store's next layout object, the same tiles
    const b = buildGround(new Layout(l.codes.slice(), new Map(l.objects), l.homes), { renderer, stairs: false });
    expect(built.n).toBe(first);
    expect(positions(b)).toEqual(positions(buildGround(l, { renderer, stairs: false })));
    const top = (g: typeof b) => (g.group.children[0] as unknown as { geometry: { getAttribute(n: string): { array: Float32Array } } }).geometry;
    expect(top(b).getAttribute('normal').array.length).toBe(top(b).getAttribute('position').array.length);
    b.dispose();
    // a もようがえ: its own set
    const codes = l.codes.slice();
    codes[idx(3, 3)] = codeOf('grass', 0);
    buildGround(new Layout(codes, new Map(l.objects), l.homes), { renderer, stairs: false });
    expect(built.n).toBeGreaterThan(first);
  });
});

describe('the bands baked (terrain.ts BAND_BUDGET: the long island, 2026-11-10)', () => {
  const longest = async () => {
    const { resizedCodes, withTiles } = await import('#lib/layout/resize.ts');
    return withTiles(defaultLayout(), resizedCodes(defaultLayout(), 'back', 95)!);
  };
  const bakes = { n: 0 };
  const counting = { ...renderer, render: () => void bakes.n++ } as unknown as WebGLRenderer;
  it('today\'s island bakes every band with ground at once, as before (8)', async () => {
    const { buildGround } = await import('./terrain.ts');
    const g = buildGround(defaultLayout(), { renderer, stairs: false });
    expect(g.chunks()).toHaveLength(8);
    g.near(0);
    expect(g.chunks()).toHaveLength(8);
    g.dispose();
  });
  it('the longest (20 bands) holds 12 targets: those in the camera\'s reach baked as it scrolls, a far one given up', async () => {
    const { buildGround } = await import('./terrain.ts');
    const { bandInView } = await import('./islandCam.ts');
    bakes.n = 0;
    const g = buildGround(await longest(), { renderer: counting, stairs: false });
    expect(g.chunks()).toHaveLength(12);
    const inView = (z: number) => g.chunks().filter((b) => bandInView(b, z)).length;
    for (const z of [0, 1500, 3000, 4400, 2200, 0]) {
      const before = bakes.n;
      g.near(z);
      expect(g.chunks().length, `at ${z}`).toBeLessThanOrEqual(12);
      // every band with ground in reach is baked (the bands' world z: −90 + 240 a row; rows 0…19 have ground)
      const want = Array.from({ length: 20 }, (_, r) => ({ z0: -90 + 240 * r, z1: -90 + 240 * (r + 1) })).filter((b) => bandInView(b, z)).length;
      expect(inView(z), `at ${z}`).toBe(want);
      expect(bakes.n - before, `at ${z}`).toBeLessThanOrEqual(want);
    }
    // the far end's bands in reach; the front's given up
    g.near(4400);
    expect(g.chunks().some((b) => b.z0 > 4300)).toBe(true);
    expect(g.chunks().some((b) => b.z0 < 0)).toBe(false);
    g.dispose();
  });
  it('the editor\'s preview (bands: Infinity) bakes all 20', async () => {
    const { buildGround } = await import('./terrain.ts');
    const g = buildGround(await longest(), { renderer, stairs: false, bands: Infinity });
    expect(g.chunks()).toHaveLength(20);
    g.dispose();
  });
});
