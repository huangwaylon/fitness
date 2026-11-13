// The rooms' models as loaded (fetched, decoded, converted: CPU-side), kept page-wide across visits as the island keeps
// its own (things.ts): back in the tent, the museum or another's home, a model builds at once, with no fetch, meshopt
// or image decode again. Kept without the loader's parser (release.ts lean); a failed load isn't kept. Each room's
// GPU copies go with its renderer (a user's release(): three's listeners on a cached model's resources would hold the
// renderer, and three uploads them again to the next). Bounded: the users of each are counted, and of those none
// uses, the `keep` last used stay (a room's whole set back at once), the older let go of (geometry, textures, images
// closed; fetched again if asked for again).
import { Texture, type Material, type Mesh, type Object3D } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { keepUsed } from './keepUsed.ts';
import { lean } from './release.ts';
import { swallowed } from '#lib/quiet.ts';

/** A model's GPU copies let go of on every renderer (its geometries, materials and their textures); `close`: its
 *  decoded images too (evicted: it's not to be drawn again). `seen`: what's already let go of. */
export function freeModel(root: Object3D, close = false, seen = new Set<object>()) {
  root.traverse((n) => {
    const m = n as Mesh;
    if (m.geometry && !seen.has(m.geometry)) (seen.add(m.geometry), m.geometry.dispose());
    const ms = (m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []) as Material[];
    for (const x of ms) {
      if (seen.has(x)) continue;
      seen.add(x);
      for (const v of Object.values(x)) {
        if (!(v instanceof Texture) || seen.has(v)) continue;
        seen.add(v);
        v.dispose();
        if (close) (v.image as { close?: () => void } | null)?.close?.();
      }
      x.dispose();
    }
  });
}

/** A cache of the models `fetch` makes, by key (`label`: its warnings'). */
export function modelCache(keep: number, fetch: (key: string) => Promise<GLTF>, label: string) {
  const models = new Map<string, Promise<GLTF | null>>();
  /** The same, loaded (what a release lets go of at once: no wait on the loads still under way). */
  const loaded = new Map<string, GLTF>();
  const kept = keepUsed<string>(keep, (k) => {
    const g = loaded.get(k);
    models.delete(k);
    loaded.delete(k);
    if (g) freeModel(g.scene, true);
  });
  function load(k: string): Promise<GLTF | null> {
    let p = models.get(k);
    if (p) return p;
    p = fetch(k).then((g) => {
      if (models.get(k) === p) loaded.set(k, g);
      return lean(g);
    }, (e: unknown) => {
      console.warn(label, k, e);
      swallowed('model.load');
      if (models.get(k) === p) models.delete(k);
      return null;
    });
    models.set(k, p);
    return p;
  }
  return {
    /** A renderer's use: what it loads stays kept till release(), which lets go of their GPU copies (on it). */
    user() {
      const used = new Set<string>();
      return {
        load(k: string) {
          if (!used.has(k)) (used.add(k), kept.use(k));
          return load(k);
        },
        /** At once (a quick way back in must not have its new room's uploads let go of a tick later), and handed
         *  back (the unused past `keep` evicted). */
        release(seen = new Set<object>()) {
          for (const k of used) {
            const g = loaded.get(k);
            if (g) freeModel(g.scene, false, seen);
            kept.unuse(k);
          }
          used.clear();
        }
      };
    },
    /** Loaded, used by a room, kept unused. */
    stats: () => ({ loaded: loaded.size, ...kept.stats() })
  };
}
