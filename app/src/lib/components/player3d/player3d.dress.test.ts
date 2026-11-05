// createPlayer's caches and a dress() racing dispose() (player3d.ts), over stand-in files: the GLB and texture loaders
// answer with tiny skinned models and plain textures, the animator and the face tuning stubbed (no WebGL, no fetch).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Bone, BufferAttribute, BufferGeometry, Group, Material, MeshStandardMaterial, Skeleton, SkinnedMesh, Texture, TextureLoader, type Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DEFAULT_LOOKS, type PlayerLook } from '#lib/contract/look.ts';
import { PARTS } from './parts.ts';

vi.mock('../villager3d/villager3d.ts', () => ({
  animateModel: (_id: string, model: Object3D) => ({ group: model, dispose: () => model.removeFromParent() })
}));
vi.mock('./tune.ts', () => ({ playerKind: () => ({ cell: () => 0, rebind() {} }) }));
const { createPlayer, glbStats, texStats } = await import('./player3d.ts');

/** A one-vertex skinned mesh on Root → Head, its material named `mat` (with a texture of its own). */
function model(mats: string[]): GLTF {
  const scene = new Group(), root = new Bone(), head = new Bone();
  root.name = 'Root';
  head.name = 'Head';
  root.add(head);
  scene.add(root);
  for (const n of mats) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
    g.setAttribute('skinIndex', new BufferAttribute(new Uint16Array([0, 0, 0, 0]), 4));
    g.setAttribute('skinWeight', new BufferAttribute(new Float32Array([1, 0, 0, 0]), 4));
    const m = new SkinnedMesh(g, new MeshStandardMaterial({ name: n, map: new Texture({ close: () => void closed++ } as unknown as ImageBitmap) }));
    scene.add(m);
    scene.updateMatrixWorld(true);
    m.bind(new Skeleton([root, head]));
  }
  return { scene } as unknown as GLTF;
}
const BODY = ['mSkin', 'mSocks', 'mEye', 'mMouth', 'mCheek', 'mNose0'];
/** Images closed (an evicted GLB's). */
let closed = 0;

/** Loads held back by URL part (released by hand). */
let holdBack: { match: string; go: () => void }[] = [];
const gate = (url: string) => {
  const h = holdBack.find((x) => url.includes(x.match));
  return h ? new Promise<void>((ok) => (h.go = ok)) : Promise.resolve();
};
let disposedMats: Set<Material>;
beforeEach(() => {
  holdBack = [];
  disposedMats = new Set();
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url: string) => {
    await gate(url);
    return model(url.includes('body.glb') ? BODY : ['mPart']);
  });
  vi.spyOn(TextureLoader.prototype, 'loadAsync').mockImplementation(async (url: string) => {
    await gate(url);
    return new Texture();
  });
  const d0 = Material.prototype.dispose;
  vi.spyOn(Material.prototype, 'dispose').mockImplementation(function (this: Material) {
    disposedMats.add(this);
    d0.call(this);
  });
});
afterEach(() => vi.restoreAllMocks());

const A = DEFAULT_LOOKS.A;
/** The bundled table's tops with a mesh of their own, and eyes, other than A's. */
const tops = Object.entries(PARTS.items).filter(([id, it]) => it.slot === 'top' && it.mesh && !it.onepiece && id !== A.top && PARTS.items[A.top!].mesh !== it.mesh)
  .filter(([, it], i, all) => all.findIndex(([, o]) => o.mesh === it.mesh) === i).map(([id]) => id);
const eyes = Object.keys(PARTS.face).filter((k) => /^PlayerEye/.test(k) && k !== A.eye);
const hairs = Object.keys(PARTS.hair).filter((h) => h !== A.hair);
const settle = () => new Promise((ok) => setTimeout(ok, 0));
const meshMats = (g: Object3D) => {
  const out: Material[] = [];
  g.traverse((n) => (n as SkinnedMesh).isSkinnedMesh && out.push((n as SkinnedMesh).material as Material));
  return out;
};

describe('a player dressed as it goes (player3d.ts)', () => {
  it('closed while a garment loads: the queued dress makes nothing it keeps (no texture held, no GLB worn, its materials disposed)', async () => {
    expect(tops.length).toBeGreaterThan(2);
    const p = await createPlayer('t', A, '/r');
    expect(texStats().held).toBeGreaterThan(0);
    expect(glbStats().worn).toBeGreaterThan(0);
    const top = PARTS.items[tops[0]];
    holdBack = [{ match: `mesh/${top.mesh}.glb`, go: () => {} }];
    const next: PlayerLook = { ...A, top: tops[0], eye: eyes[0] };
    const dressed = p.dress(next);
    await settle();
    p.dispose();
    // (the new eye's sheet and iris, fetched before the top, cached but held by none till the sweep)
    expect(texStats().held).toBe(0);
    holdBack[0].go();
    await dressed;
    await settle();
    expect(texStats()).toEqual({ held: 0, refs: 0, cached: 0 });
    expect(glbStats().worn).toBe(0);
    for (const m of meshMats(p.group)) expect(disposedMats.has(m), m.name).toBe(true);
    // a dress after dispose does nothing at all
    await p.dress({ ...A, top: tops[1] });
    expect(texStats()).toEqual({ held: 0, refs: 0, cached: 0 });
    expect(glbStats().worn).toBe(0);
  });

  it('keeps the GLBs worn and the 16 last worn, the older let go of (geometry and images)', async () => {
    const p = await createPlayer('t', A, '/r');
    expect(hairs.length).toBeGreaterThan(20);
    const worn = glbStats().worn;
    closed = 0;
    for (const h of hairs.slice(0, 22)) await p.dress({ ...A, hair: h });
    const s = glbStats();
    expect(s.worn).toBe(worn);
    expect(s.idle).toBe(16);
    // (the body's own, never counted, besides)
    expect(s.cached).toBe(worn + 16 + 1);
    // A's own hair and the first five tried on: their images closed
    await settle();
    expect(closed).toBeGreaterThanOrEqual(6);
    // back to an evicted one: fetched again, worn
    await p.dress({ ...A, hair: hairs[0] });
    expect(glbStats()).toMatchObject({ worn, idle: 16 });
    p.dispose();
    expect(glbStats().worn).toBe(0);
  });

  it('lets a face sheet no one wears any more go (the cached atlas, not only its copy)', async () => {
    const p = await createPlayer('t', A, '/r');
    const held0 = texStats().held, cached0 = texStats().cached;
    for (const e of eyes.slice(0, 8)) await p.dress({ ...A, eye: e });
    // as many held and cached as with the first eye: each old sheet (and its iris) let go of
    expect(texStats().held).toBe(held0);
    expect(texStats().cached).toBe(cached0);
    p.dispose();
    expect(texStats()).toEqual({ held: 0, refs: 0, cached: 0 });
  });
});
