// NH's villagers in 3D (the /villagers3d POC; docs/decisions.md "The island in 3D"): a villager's GLB
// (scripts/villagers3d-models.ts: static/room/villagers3d/<roster id>.glb, its skeleton and skin kept, its eyes and
// mouths two atlases) loaded on demand (a phone only ever loads its two or three villagers and the day's visitor),
// posed every frame by poses.ts through rig.ts, its face from faces.ts (blinking on its own rhythm), lit as the
// island's models are (Lambert, a little self-light by its own colour: engine.ts's "lift"), and a soft blob of shadow
// under it. Plain three.js: whatever scene it stands in moves the group (x, z, yaw) and calls step() in each frame.
//   v.group                 add it (engine.ts attach() bends its materials with the island)
//   v.set(state)            idle, walk, sit, lie, nap, doze: crossfaded over FADE_MS
//   v.act(action)           hop, wave, highfive, surprise, sting: once, over the state
//   v.face(f | null)        an expression (null: the state's own: asleep closed, else resting)
//   v.step(t, moved, speed) one frame: `moved` the u walked since the last (the stride follows it), `speed` u/s
//   v.head()                the head bone (a balloon's, a hat's anchor)
import {
  CircleGeometry, Color, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, SphereGeometry, Vector3, type Bone, type Material,
  type MeshStandardMaterial, type SkinnedMesh, type Texture
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ACTION_MS, FADE_MS, STRIDE, action, base, mix, over, type Action, type Pose, type State } from './poses.ts';
import { cellTransform, eyeAt, mouthAt, type Face } from './faces.ts';
import { rigOf, type Rig } from './rig.ts';

/** World units per model unit: an NH villager is 14.9 model units, the island's 80u (world3d-assets.ts VILLAGER_S). */
export const VILLAGER_S = 5.4;

export interface Villager3D {
  id: string;
  group: Object3D;
  set(s: State): void;
  state(): State;
  act(a: Action): void;
  face(f: Face | null): void;
  /** One frame at t (ms): `moved` the u walked since the last frame, `speed` (u/s) the walk's. True while it moves. */
  step(t: number, moved?: number, speed?: number): boolean;
  /** The self-light (the island's time of day: engine.ts TOD lift). */
  lift(l: number): void;
  head(): Bone | null;
  /** Hold a pose as it is (a test's, a still): null lets the states and actions move it again. */
  hold(p: Pose | null): void;
  rig: Rig;
  dispose(): void;
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const cache = new Map<string, Promise<GLTF>>();

/** A villager's GLB (once per id: a second villager of the same kind clones it). */
function load(url: string): Promise<GLTF> {
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((g) => {
      // NH's soft look, the island's way (world3d/things.ts): Lambert, lit a little by its own colour
      g.scene.traverse((n) => {
        const m = n as Mesh;
        if (!m.isMesh) return;
        const s = m.material as MeshStandardMaterial;
        const l = new MeshLambertMaterial({
          name: s.name, map: s.map, color: s.color, alphaTest: s.alphaTest, side: s.side, transparent: false,
          emissive: new Color(0xffffff), emissiveMap: s.map, emissiveIntensity: 0.32
        });
        l.userData = { ...s.userData };
        s.dispose();
        m.material = l;
      });
      return g;
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

const BLOB = new CircleGeometry(1, 20).rotateX(-Math.PI / 2);

/** A villager's 3D model, standing at its group's origin (its feet), facing +z (three's: toward the island's camera). */
export async function createVillager(id: string, url: string, seed = 0): Promise<Villager3D> {
  const g = await load(url);
  const model = cloneSkinned(g.scene);
  // the face's materials are its own (its cells change): the rest are shared with every clone
  const faces: { m: MeshLambertMaterial; tex: Texture; atlas: [number, number]; base: { ox: number; oy: number; sx: number; sy: number }; cell: number }[] = [];
  let eyeBox: [Vector3, Vector3] | null = null;
  model.traverse((n) => {
    const m = n as SkinnedMesh;
    if (!m.isMesh) return;
    m.frustumCulled = false;
    const mat = m.material as MeshLambertMaterial;
    const atlas = mat.userData?.atlas as [number, number, number] | undefined;
    if (atlas && mat.map) {
      const tex = mat.map.clone();
      const own = mat.clone();
      own.map = tex;
      own.emissiveMap = tex;
      m.material = own;
      faces.push({ m: own, tex, atlas: [atlas[0], atlas[1]], base: { ox: tex.offset.x, oy: tex.offset.y, sx: tex.repeat.x, sy: tex.repeat.y }, cell: -1 });
      if (mat.name === 'mEye') {
        m.geometry.computeBoundingBox();
        eyeBox = [m.geometry.boundingBox!.min.clone(), m.geometry.boundingBox!.max.clone()];
        m.updateWorldMatrix(true, false);
        eyeBox[0].applyMatrix4(m.matrixWorld);
        eyeBox[1].applyMatrix4(m.matrixWorld);
      }
    }
  });
  const rig = rigOf(model);
  // the faces NH swaps whole meshes for (a bird's beak, a deer's or a gorilla's muzzle: scripts/villagers3d-page.js
  // keeps FaceNothing, FaceGood and FaceBad, named for their face): the one for the expression shows
  const swaps: { kind: 'Nothing' | 'Good' | 'Bad'; mesh: Object3D }[] = [];
  model.traverse((n) => {
    const k = /^Face(Nothing|Good|Bad)/.exec(n.name)?.[1] as 'Nothing' | 'Good' | 'Bad' | undefined;
    if (k && (n as Mesh).isMesh) swaps.push({ kind: k, mesh: n });
    else if (k) n.traverse((c) => (c as Mesh).isMesh && swaps.push({ kind: k, mesh: c }));
  });
  let swapShown: string | null = null;
  const showSwap = (face: Face) => {
    if (!swaps.length) return;
    const want = face === 'happy' || face === 'joy' ? 'Good' : face === 'sad' || face === 'cross' || face === 'sting' ? 'Bad' : 'Nothing';
    const kind = swaps.some((s) => s.kind === want) ? want : 'Nothing';
    if (kind === swapShown) return;
    swapShown = kind;
    for (const s of swaps) s.mesh.visible = s.kind === kind;
  };
  showSwap('neutral');

  // the sting's lump (NH's swollen eye): over the eye on the viewer's left, on the head bone
  const head = rig.bone('Head');
  let lump: Mesh | null = null;
  if (head && eyeBox) {
    const [a, b] = eyeBox as [Vector3, Vector3];
    const w = b.x - a.x;
    const at = new Vector3(a.x + 0.27 * w, (a.y + b.y) / 2, b.z + 0.05 * w);
    // (in the model's own frame: before it's put in the scaled group)
    model.updateMatrixWorld(true);
    head.worldToLocal(at);
    lump = new Mesh(new SphereGeometry(1, 16, 12), new MeshLambertMaterial({ color: 0xf2a6b6, emissive: new Color(0xf2a6b6), emissiveIntensity: 0.25 }));
    const r = 0.2 * w;
    lump.scale.set(r, r * 0.85, r * 0.6);
    lump.position.copy(at);
    lump.visible = false;
    lump.name = 'sting-lump';
    head.add(lump);
  }

  const inner = new Object3D();
  inner.add(model);
  inner.scale.setScalar(VILLAGER_S);
  const group = new Object3D();
  group.name = `villager3d:${id}`;
  group.add(inner);
  // the blob of shadow on the ground (NH's walkers have one: no shadow map to redraw as they move)
  const blobMat = new MeshBasicMaterial({ color: 0x2a3a2a, transparent: true, opacity: 0.22, depthWrite: false });
  const blob = new Mesh(BLOB, blobMat);
  blob.scale.setScalar(17);
  blob.position.y = 0.6;
  blob.renderOrder = -1;
  group.add(blob);

  let cur: State = 'idle', prev: State = 'idle', since = -1e9, faceSet: Face | null = null;
  let act: { a: Action; t0: number } | null = null, phase = 0, lastT = 0, speed = 0, held: Pose | null = null;
  const o = { phase: 0, speed: 0, body: rig.body, seed };
  const setCell = (f: (typeof faces)[number], i: number) => {
    if (f.cell === i) return;
    f.cell = i;
    const c = cellTransform(i, f.atlas[0], f.atlas[1], f.base);
    f.tex.offset.set(c.ox, c.oy);
    f.tex.repeat.set(c.sx, c.sy);
  };
  const faceOf = (): Face => {
    if (act?.a === 'sting') return 'sting';
    if (faceSet) return faceSet;
    if (act?.a === 'hop' || act?.a === 'highfive' || act?.a === 'wave') return 'happy';
    if (act?.a === 'surprise') return 'surprised';
    return cur === 'nap' || cur === 'doze' ? 'sleepy' : 'neutral';
  };

  return {
    id, group, rig,
    set(s) {
      if (s === cur) return;
      prev = cur;
      cur = s;
      since = lastT;
    },
    state: () => cur,
    act(a) {
      act = { a, t0: lastT };
    },
    face(f) {
      faceSet = f;
    },
    head: () => head,
    hold(p) {
      held = p;
    },
    lift(l) {
      model.traverse((x) => {
        const m = (x as Mesh).material as Material | undefined;
        if (m && 'emissiveIntensity' in m && m !== lump?.material) (m as MeshLambertMaterial).emissiveIntensity = l;
      });
    },
    step(t, moved = 0, sp = 0) {
      lastT = t;
      phase += moved / (STRIDE * VILLAGER_S);
      speed = sp;
      o.phase = phase;
      o.speed = speed;
      const k = Math.min(1, (t - since) / FADE_MS);
      let p: Pose = base(cur, t, o);
      if (k < 1) p = mix(base(prev, t, o), p, k);
      if (held) p = held;
      else if (act) {
        const u = t - act.t0;
        if (u >= ACTION_MS[act.a]) act = null;
        else {
          const r = action(act.a, u);
          p = over(p, r.p, r.w);
        }
      }
      rig.apply(p);
      // the body: lifted, squashed (its volume kept), pitched (lying down: lifted onto its back)
      const sq = p.sq;
      inner.scale.set(VILLAGER_S / Math.sqrt(sq), VILLAGER_S * sq, VILLAGER_S / Math.sqrt(sq));
      inner.position.y = p.y * VILLAGER_S + (p.pitch ? -Math.sin(p.pitch) * 2.2 * VILLAGER_S : 0);
      inner.rotation.x = p.pitch;
      // lying, its middle over the group's origin (the bed's), not its feet
      inner.position.z = p.pitch ? Math.sin(p.pitch) * -6.5 * VILLAGER_S : 0;
      blob.scale.setScalar(p.pitch ? 30 : 17 * (1 - Math.min(0.4, p.y * 0.12)));
      blobMat.opacity = p.pitch ? 0.12 : 0.22;
      const face = faceOf();
      const eye = eyeAt(face, t, seed), mouth = mouthAt(face, t);
      for (const f of faces) setCell(f, f.m.name === 'mEye' ? eye : mouth);
      showSwap(face);
      if (lump) lump.visible = face === 'sting';
      return true;
    },
    dispose() {
      group.removeFromParent();
      for (const f of faces) {
        f.m.dispose();
        f.tex.dispose();
      }
      blobMat.dispose();
      if (lump) {
        lump.geometry.dispose();
        (lump.material as Material).dispose();
      }
    }
  };
}
