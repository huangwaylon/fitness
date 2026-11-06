// The bug wing as built (museum/garden.ts) with a stub kit (no GPU, every bug a box): this hour's ten (bugShow.ts), each
// its own InstancedMesh, its model loaded only when picked; the hour turning off screen swaps them at once, on screen
// the outgoing fade out and the new fade in, their models' geometry and materials released as they go.
import { describe, expect, test } from 'vitest';
import { BoxGeometry, Group, InstancedMesh, Mesh, MeshLambertMaterial, type Sphere } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Kit } from './engine.ts';
import { BUGS_SHOWN, bugsOnDisplay } from './bugShow.ts';
import { BUG_IDS, hourOf, onShow } from './species.ts';
import { findKey } from '#lib/model/finds.ts';

// (the firefly's glow is drawn on a canvas)
const ctx = { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {}, fillStyle: '' };
(globalThis as { document?: unknown }).document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
const { buildGarden } = await import('./garden.ts');

const loaded: string[] = [];
const kit = {
  tex: () => null,
  model: async () => null,
  prop: () => new Group(),
  critter: async (_: string, id: string) => (loaded.push(id), { scene: new Group().add(new Mesh(new BoxGeometry(2, 1, 4))) }) as unknown as GLTF,
  island: async () => null,
  islandBounds: () => null,
  lambert: () => new MeshLambertMaterial(),
  invalidate: () => {},
  noDraw: true
} as unknown as Kit;
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

describe('the bug wing as built', () => {
  test('this hour’s ten, a mesh each, only theirs loaded; the next hour’s swapped in (at once off screen, faded on it), the gone ones released', async () => {
    const all = onShow(new Map(BUG_IDS.map((id) => [findKey('bug', id), { date: '2026-11-04', at: 0, person: 'A' }] as const)) as never);
    let now = Date.parse('2026-11-04T12:00:00+09:00');
    const g = buildGarden(kit, all, () => now);
    await settle();
    const meshes = () => {
      const out: InstancedMesh[] = [];
      g.group.traverse((o) => void ((o as InstancedMesh).isInstancedMesh && out.push(o as InstancedMesh)));
      return out;
    };
    const want = (ms: number) => bugsOnDisplay(all, hourOf(ms)).map((s) => s.sp.id).sort();
    expect(want(now).length).toBe(BUGS_SHOWN);
    expect(g.shown().sort()).toEqual(want(now));
    expect(meshes().length).toBe(BUGS_SHOWN);
    expect(loaded.sort()).toEqual(want(now));

    // the hour turns with the wing off screen: the new ten at once
    const before = meshes();
    now += 3_600_000;
    g.frame(10_000, 33, (_: Sphere) => false);
    await settle();
    expect(g.shown().sort()).toEqual(want(now));
    expect(meshes().length).toBe(BUGS_SHOWN);
    const gone = before.filter((m) => !meshes().includes(m));
    expect(gone.length).toBeGreaterThan(0);
    // (released: its geometry's disposed, it's out of the group)
    for (const m of gone) expect(m.parent).toBeNull();

    // the hour turns on screen: the outgoing fade out (dithered) while the new fade in, then ten again
    now += 3_600_000;
    let t = 20_000;
    g.frame(t, 33, () => true);
    await settle();
    const fading = meshes().filter((m) => (Array.isArray(m.material) ? m.material : [m.material]).some((x) => x.alphaHash));
    expect(fading.length).toBeGreaterThan(0);
    expect(g.shown().sort()).toEqual(want(now));
    for (let i = 0; i < 80; i++) g.frame((t += 33), 33, () => true);
    expect(meshes().length).toBe(BUGS_SHOWN);
    expect(meshes().every((m) => (Array.isArray(m.material) ? m.material : [m.material]).every((x) => !x.alphaHash && x.opacity === 1))).toBe(true);
    g.dispose();
  });
});
