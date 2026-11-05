// The 3D island's own small models (docs/design.md "World: in 3D"), for what NH's files have no model of: the
// pond's lily flower (and a pad, should fx/lily-pad be missing), a winter flower's snow cap, a decoration's footprint
// marker.
// Built in code (a few hundred triangles each), in model units at the scale given in PROC (a tile is 10 units, as NH's
// furniture), drawn by things.ts as any model (instanced, bent, NH's soft Lambert).
import {
  CircleGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial, RingGeometry, SphereGeometry,
  type BufferGeometry
} from 'three';
import type { AssetKey } from './assets.ts';

/** The procedural models as art keys, as assets.json's (`proc/<name>`). */
export const PROC: Record<string, AssetKey> = {
  'proc/lily-pad': { m: 'proc/lily-pad', cat: 'scenery', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/lily-flower': { m: 'proc/lily-flower', cat: 'scenery', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/snow-cap': { m: 'proc/snow-cap', cat: 'scenery', s: 1, anchor: 'feet', hit: 0, shadow: false },
  'proc/foot-ok': { m: 'proc/foot-ok', cat: 'decor', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/foot-bad': { m: 'proc/foot-bad', cat: 'decor', s: 3, anchor: 'feet', hit: 12, shadow: false }
};

/** Their bounds (model units), as assets.json's models (the anchors, the stand-ins' sizes). */
export const PROC_BOUNDS: Record<string, { min: number[]; max: number[]; tris: number; kb: number; v: string }> = {
  'proc/lily-pad': { min: [-3, 0, -3], max: [3, 0.1, 3], tris: 40, kb: 0, v: 'p1' },
  'proc/lily-flower': { min: [-1.2, 0, -1.2], max: [1.2, 1.4, 1.2], tris: 80, kb: 0, v: 'p1' },
  'proc/snow-cap': { min: [-1, 0, -1], max: [1, 0.45, 1], tris: 60, kb: 0, v: 'p1' },
  'proc/foot-ok': { min: [-5, 0, -5], max: [5, 0.1, 5], tris: 8, kb: 0, v: 'p1' },
  'proc/foot-bad': { min: [-5, 0, -5], max: [5, 0.1, 5], tris: 8, kb: 0, v: 'p1' }
};

const mat = (color: number, o: Partial<{ opacity: number; side: 0 | 1 | 2 }> = {}) =>
  new MeshStandardMaterial({ color, transparent: o.opacity !== undefined, opacity: o.opacity ?? 1, side: o.side ?? 0, roughness: 1 });
const part = (g: Group, geo: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const mesh = new Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  g.add(mesh);
  return mesh;
};

/** A procedural model by name (`proc/…`), or null. */
export function procScene(name: string): Group | null {
  const g = new Group();
  switch (name) {
    case 'proc/lily-pad': {
      // a round pad with NH's notch, a lighter vein
      part(g, new CircleGeometry(3, 22, 0.35, Math.PI * 2 - 0.7), mat(0x5fa64a, { side: 2 }), 0, 0.05, 0, -Math.PI / 2);
      part(g, new RingGeometry(0.2, 2.6, 22, 1, 0.5, 0.2), mat(0x8cc66a, { side: 2 }), 0, 0.07, 0, -Math.PI / 2);
      return g;
    }
    case 'proc/lily-flower': {
      const pink = mat(0xf4a6c6), core = mat(0xffe27a);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        part(g, new ConeGeometry(0.45, 1.3, 6), pink, Math.cos(a) * 0.55, 0.65, Math.sin(a) * 0.55, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      }
      part(g, new SphereGeometry(0.35, 8, 6), core, 0, 0.8, 0);
      return g;
    }
    case 'proc/snow-cap': {
      // a winter flower's little cap of snow (Flowers.svelte's 2D one): a flattened dome, unit wide (scaled by the
      // flower's size); in the world, not a DOM node over the canvas (28 of them, each its own layer under the wet
      // sky's url() tint, held a snowy scroll at ~35 fps on the iOS Simulator)
      part(g, new SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff), 0, 0, 0).scale.set(1, 0.45, 1);
      return g;
    }
    case 'proc/foot-ok': case 'proc/foot-bad': {
      part(g, new RingGeometry(3.6, 4.6, 4, 1, Math.PI / 4), mat(name === 'proc/foot-ok' ? 0x7fd36a : 0xe8564a, { opacity: 0.85, side: 2 }), 0, 0.1, 0, -Math.PI / 2);
      return g;
    }
    default:
      return null;
  }
}
