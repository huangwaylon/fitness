// The aquarium as built (museum/aquarium.ts) with a stub kit (no GPU, every catch a box): the feeders of all three
// tanks one InstancedMesh (one draw call, one material, a slot each), never over FEEDERS a tank, inside their water;
// the bubbles one Points; the glass and the floor's caustics one pass each. (The misses collected, checked once.)
import { describe, expect, test } from 'vitest';
import { BoxGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshLambertMaterial, Points, Vector3, type Material, type Sphere } from 'three';
import type { Kit } from './engine.ts';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FEEDERS, PREDATORS, feederBox } from './feeding.ts';
import { FISH_IDS, onShow } from './species.ts';
import { TANKS, openOf } from './tanks.ts';
import { findKey } from '#lib/model/finds.ts';

(globalThis as { window?: unknown }).window ??= { devicePixelRatio: 1 };
const { buildAquarium } = await import('./aquarium.ts');

const kit = {
  tex: () => null,
  model: async () => null,
  prop: () => new Group(),
  critter: async () => ({ scene: new Group().add(new Mesh(new BoxGeometry(2, 1, 4))) }) as unknown as GLTF,
  island: async () => null,
  islandBounds: () => null,
  lambert: () => new MeshLambertMaterial(),
  cards: () => ({ mesh: new Mesh(), cards: () => {} }),
  invalidate: () => {},
  noDraw: true
} as unknown as Kit;

describe('the aquarium as built', () => {
  test('the feeders: one InstancedMesh for the three tanks (one draw call), FEEDERS a tank at most, each in its water; the bubbles one Points; the glass one pass', async () => {
    const all = onShow(new Map(FISH_IDS.map((id) => [findKey('fish', id), { person: 'A', at: 0 }] as const)) as never);
    const at = Date.parse('2026-11-04T12:00:00+09:00'), aq = buildAquarium(kit, all, () => at);
    // (the fish in: their models' promises)
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    const seen = (_: Sphere) => true, out: string[] = [];
    const feeders: InstancedMesh[] = [], points: Points[] = [];
    aq.group.traverse((o) => {
      if ((o as InstancedMesh).isInstancedMesh && o.userData.feeders) feeders.push(o as InstancedMesh);
      if ((o as Points).isPoints) points.push(o as Points);
    });
    expect(feeders.length).toBe(1);
    const mesh = feeders[0];
    expect(mesh.count).toBe(FEEDERS * TANKS.length);
    expect(Array.isArray(mesh.material)).toBe(false);
    // (the bubbles one Points, beside each tank's bite's puff)
    expect(points.length).toBe(1 + TANKS.length);
    // two minutes at 30 fps: the slots of each tank hold its feeders only, inside its water
    const M = new Matrix4(), p = new Vector3(), boxes = TANKS.map((t) => feederBox(openOf(t)));
    let most = 0, drawn = 0;
    for (let k = 0; k < 120 * 30; k++) {
      aq.frame(k * (1000 / 30), 1000 / 30, seen);
      if (mesh.visible) drawn++;
      for (const [ti] of TANKS.entries()) {
        let n = 0;
        for (let i = 0; i < FEEDERS; i++) {
          mesh.getMatrixAt(ti * FEEDERS + i, M);
          if (Math.abs(M.determinant()) < 1e-12) continue;
          n++;
          p.setFromMatrixPosition(M);
          const b = boxes[ti];
          if (!(p.x >= b.x0 - 1e-4 && p.x <= b.x1 + 1e-4 && p.y >= b.y0 - 1e-4 && p.y <= b.y1 + 1e-4 && p.z >= b.z0 - 1e-4 && p.z <= b.z1 + 1e-4)) out.push(`${TANKS[ti].id} ${i} out at ${k}`);
        }
        most = Math.max(most, n);
      }
    }
    expect(out.slice(0, 5)).toEqual([]);
    expect(most).toBeGreaterThan(5);
    expect(most).toBeLessThanOrEqual(FEEDERS);
    expect(drawn).toBeGreaterThan(0);
    // (the hour's sea pick leads with a predator: its feeders come)
    expect(aq.shown().some((id) => PREDATORS.has(id))).toBe(true);
    // the glass and the floor's caustics drawn in one pass (a transparent DoubleSide is two in three otherwise)
    const twoPass: string[] = [];
    aq.group.traverse((o) => {
      const m = (o as Mesh).material as Material | undefined;
      if (m && !Array.isArray(m) && m.transparent && m.side === 2 && !m.forceSinglePass) twoPass.push(o.type);
    });
    expect(twoPass).toEqual([]);
    aq.dispose();
  });
});
