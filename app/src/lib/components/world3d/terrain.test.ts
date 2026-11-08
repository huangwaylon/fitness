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
