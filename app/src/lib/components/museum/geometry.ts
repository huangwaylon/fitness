// A catch's model as the museum draws it (aquarium.ts, garden.ts): its mesh as plain floats in its own space.
import { BufferGeometry, Float32BufferAttribute, type Mesh, type Object3D } from 'three';

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
