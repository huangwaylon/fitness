// A catch's model as the museum draws it (aquarium.ts, garden.ts): its mesh as plain floats in its own space; and the
// wings' static pieces batched.
import { BufferGeometry, Float32BufferAttribute, Mesh, type Material, type Matrix4, type Object3D } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
