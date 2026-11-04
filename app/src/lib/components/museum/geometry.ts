// A catch's model as the museum draws it (aquarium.ts, garden.ts): its mesh as plain floats in its own space; and the
// wings' static pieces batched.
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Mesh, type Material, type Matrix4, type Object3D } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Box } from './tanks.ts';

/** A model's mesh as plain floats in its model's space: gltfpack quantises a GLB's positions, normals and uvs (their
 *  node's transform scales them back), so the geometry alone would stand huge and skewed; its node's transform baked in. */
export function plainGeometry(root: Object3D, m: Mesh): BufferGeometry {
  root.updateMatrixWorld(true);
  const src = m.geometry, geo = new BufferGeometry();
  for (const name of ['position', 'normal', 'uv'] as const) {
    const a = src.getAttribute(name);
    if (!a) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
    geo.setAttribute(name, new Float32BufferAttribute(out, a.itemSize));
  }
  if (src.index) geo.setIndex(src.index.clone());
  geo.applyMatrix4(m.matrixWorld);
  return geo;
}

/** A wing's static pieces (a tank's frame, a case's glass) batched by material: each piece's geometry with its place
 *  baked in, one mesh a material when done (a draw call each, not one a piece). Returns the geometries made (the wing
 *  disposes them). The pieces share their attributes (BoxGeometry's, PlaneGeometry's: indexed, position, normal, uv). */
export function batcher() {
  const by = new Map<Material, BufferGeometry[]>();
  return {
    add(g: BufferGeometry, m: Material, at: Matrix4) {
      g.applyMatrix4(at);
      (by.get(m) ?? by.set(m, []).get(m)!).push(g);
    },
    done(parent: Object3D, order: (m: Material) => number = () => 0): BufferGeometry[] {
      const out: BufferGeometry[] = [];
      for (const [m, gs] of by) {
        const g = gs.length === 1 ? gs[0] : mergeGeometries(gs);
        if (gs.length > 1) for (const x of gs) x.dispose();
        const mesh = new Mesh(g, m);
        mesh.renderOrder = order(m);
        parent.add(mesh);
        out.push(g);
      }
      by.clear();
      return out;
    }
  };
}

/** A box without some of its faces (a glass case's floor: the soil's top is there): BoxGeometry's faces, in its order. */
export function openBox(w: number, h: number, d: number, without: readonly ('+x' | '-x' | '+y' | '-y' | '+z' | '-z')[]): BufferGeometry {
  const g = new BoxGeometry(w, h, d), faces = ['+x', '-x', '+y', '-y', '+z', '-z'] as const, idx = g.index!.array;
  const keep: number[] = [];
  faces.forEach((f, i) => {
    if (!without.includes(f)) for (let k = i * 6; k < i * 6 + 6; k++) keep.push(idx[k]);
  });
  g.setIndex(keep);
  g.clearGroups();
  return g;
}

/** A glass box's metal frame (a tank's, a case's; `e` its half thickness, the glass's edges along its middle): a post
 *  at each corner from `y0` up to the top rails' underside, the two rails along x over the whole length, the two along z
 *  between them. No two pieces overlap, so none shares a face's plane with another over the same spot. */
export function frameOf(b: Box, y0: number, e: number): Box[] {
  const top = { y0: b.y1 - e, y1: b.y1 + e };
  const out: Box[] = [];
  for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]] as const) out.push({ x0: x - e, x1: x + e, y0, y1: b.y1 - e, z0: z - e, z1: z + e });
  for (const z of [b.z0, b.z1]) out.push({ x0: b.x0 - e, x1: b.x1 + e, ...top, z0: z - e, z1: z + e });
  for (const x of [b.x0, b.x1]) out.push({ x0: x - e, x1: x + e, ...top, z0: b.z0 + e, z1: b.z1 - e });
  return out;
}

/** A flat thing lying on another (a carpet on the floor, the medallion on the carpets): drawn `layer` steps over it in
 *  depth (its own lift a hair, too small for the depth buffer at a slant), so the two never fight. */
export function decal<T extends Material>(m: T, layer: number): T {
  m.polygonOffset = true;
  m.polygonOffsetFactor = -layer;
  m.polygonOffsetUnits = -4 * layer;
  return m;
}
