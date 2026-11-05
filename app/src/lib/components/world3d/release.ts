// Letting go of a scene's GPU resources on its renderer. three adds its own dispose listeners to each geometry,
// material and texture a renderer draws, and they hold that renderer (its context, its canvas). One shared with a
// page-wide cache (a home's, a bridge's or a villager's model) outlives the renderer, so a renderer whose resources are
// never disposed stays alive, context and all. Disposing a cached one is safe: the next renderer to draw it uploads it
// again.
import { Texture, type BufferGeometry, type Material, type Mesh, type Object3D } from 'three';

type Res = BufferGeometry | Material | Texture;

/** The geometries, materials and their textures under `root`, added to `into`. */
export function resourcesOf(root: Object3D, into = new Set<Res>()): Set<Res> {
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) into.add(m.geometry);
    for (const mat of m.material ? ([] as Material[]).concat(m.material) : []) {
      into.add(mat);
      // (and those a shader takes from its userData: a player's iris, its bare legs under socks)
      for (const v of [...Object.values(mat), ...Object.values(mat.userData ?? {})]) if (v instanceof Texture) into.add(v);
    }
  });
  return into;
}

/** Every resource under `roots` disposed (and those in `also`: ones that were drawn and have since left the scene). */
export function releaseAll(roots: Object3D[], also: Iterable<Res> = []) {
  const all = new Set<Res>(also);
  for (const r of roots) resourcesOf(r, all);
  for (const r of all) r.dispose();
}

/** A model kept (a page-wide cache's) without its loader's parser: the parser holds the GLB's whole body and its JSON,
 *  besides the buffers three made from them (each drawn model's ~its file again, for the page's life). */
export function lean<T extends object>(g: T): T {
  (g as { parser?: unknown }).parser = undefined;
  return g;
}
