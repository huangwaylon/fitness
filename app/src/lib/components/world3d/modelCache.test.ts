import { BufferGeometry, Mesh, MeshLambertMaterial, Scene, Texture } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { modelCache } from './modelCache.ts';

/** A model of one mesh and one texture, its disposals counted. */
function fake(freed: string[]) {
  return async (k: string) => {
    const map = new Texture(), geo = new BufferGeometry();
    map.addEventListener('dispose', () => freed.push(`${k}:tex`));
    geo.addEventListener('dispose', () => freed.push(`${k}:geo`));
    const scene = new Scene();
    scene.add(new Mesh(geo, new MeshLambertMaterial({ map })));
    return { scene, scenes: [scene], animations: [], cameras: [], asset: {}, userData: {} } as unknown as GLTF;
  };
}

describe('modelCache user().unload (a preview let go mid-visit)', () => {
  it("frees that model's GPU copies on this renderer and hands it back; the rest stay till release()", async () => {
    const freed: string[] = [];
    const cache = modelCache(8, fake(freed), 'test');
    const room = cache.user();
    await Promise.all(['sofa', 'rug-a', 'rug-b'].map((k) => room.load(k)));
    expect(cache.stats()).toMatchObject({ loaded: 3, used: 3 });
    room.unload('rug-a');
    room.unload('rug-a'); // twice: once only
    room.unload('lamp'); // never loaded: nothing
    expect(freed.sort()).toEqual(['rug-a:geo', 'rug-a:tex']);
    // kept CPU-side (unused, under keep): tried again, it builds at once
    expect(cache.stats()).toMatchObject({ loaded: 3, used: 2, idle: 1 });
    room.release();
    expect(freed.length).toBe(6);
    expect(cache.stats()).toMatchObject({ used: 0, idle: 3 });
  });
});
