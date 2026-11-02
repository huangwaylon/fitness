// The 3D island's own small models (docs/design.md "World: in 3D"), for what NH's files have no model of: the
// fishing float, the pond's lily pads and their flower, a wasp swarm, the bug net, a decoration's footprint marker.
// Built in code (a few hundred triangles each), in model units at the scale given in PROC (a tile is 10 units, as NH's
// furniture), drawn by things.ts as any model (instanced, bent, NH's soft Lambert).
import {
  BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, RingGeometry, SphereGeometry, TorusGeometry,
  type BufferGeometry
} from 'three';
import type { AssetKey } from './assets.ts';

/** The procedural models as art keys, as assets.json's (`proc/<name>`). */
export const PROC: Record<string, AssetKey> = {
  'proc/bobber': { m: 'proc/bobber', cat: 'find', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/lily-pad': { m: 'proc/lily-pad', cat: 'scenery', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/lily-flower': { m: 'proc/lily-flower', cat: 'scenery', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/wasps': { m: 'proc/wasps', cat: 'bug', s: 3, anchor: 'centre', hit: 12, shadow: false },
  'proc/net': { m: 'proc/net', cat: 'find', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/foot-ok': { m: 'proc/foot-ok', cat: 'decor', s: 3, anchor: 'feet', hit: 12, shadow: false },
  'proc/foot-bad': { m: 'proc/foot-bad', cat: 'decor', s: 3, anchor: 'feet', hit: 12, shadow: false }
};

/** Their bounds (model units), as assets.json's models (the anchors, the stand-ins' sizes). */
export const PROC_BOUNDS: Record<string, { min: number[]; max: number[]; tris: number; kb: number; v: string }> = {
  'proc/bobber': { min: [-1, 0, -1], max: [1, 2.6, 1], tris: 200, kb: 0, v: 'p1' },
  'proc/lily-pad': { min: [-3, 0, -3], max: [3, 0.1, 3], tris: 40, kb: 0, v: 'p1' },
  'proc/lily-flower': { min: [-1.2, 0, -1.2], max: [1.2, 1.4, 1.2], tris: 80, kb: 0, v: 'p1' },
  'proc/wasps': { min: [-2.5, -1.5, -2.5], max: [2.5, 1.5, 2.5], tris: 300, kb: 0, v: 'p1' },
  'proc/net': { min: [-3, 0, -0.3], max: [3, 9, 0.3], tris: 200, kb: 0, v: 'p1' },
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
    case 'proc/bobber': {
      // NH's float: red over white, a little stick on top, floating half under
      part(g, new SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8402f), 0, 0.9, 0);
      part(g, new SphereGeometry(1, 14, 7, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf6f3ea), 0, 0.9, 0);
      part(g, new CylinderGeometry(0.12, 0.12, 0.9, 6), mat(0xf6f3ea), 0, 2.2, 0);
      return g;
    }
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
    case 'proc/wasps': {
      // three wasps: yellow and black, two wings each
      const body = mat(0xf2c230), band = mat(0x2a2420), wing = mat(0xffffff, { opacity: 0.7, side: 2 });
      for (const [x, y, z] of [[-1.6, 0.4, 0], [1.4, -0.3, 0.6], [0.2, 0.9, -1.2]]) {
        part(g, new SphereGeometry(0.55, 8, 6), body, x, y, z).scale.set(1.5, 1, 1);
        part(g, new BoxGeometry(0.25, 0.9, 0.9), band, x, y, z);
        part(g, new CircleGeometry(0.6, 8), wing, x - 0.1, y + 0.6, z + 0.3, -1.2);
        part(g, new CircleGeometry(0.6, 8), wing, x - 0.1, y + 0.6, z - 0.3, -1.9);
      }
      return g;
    }
    case 'proc/net': {
      // the bug net: a wooden handle, a hoop and its mesh
      part(g, new CylinderGeometry(0.18, 0.18, 6, 6), mat(0xb07a46), 0, 3, 0);
      part(g, new TorusGeometry(2, 0.18, 6, 20), mat(0xd9d4c4), 0, 8, 0);
      part(g, new CircleGeometry(2, 20), mat(0xffffff, { opacity: 0.45, side: 2 }), 0, 8, 0);
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
