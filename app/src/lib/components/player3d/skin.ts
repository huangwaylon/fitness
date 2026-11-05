// A player's one skeleton (player3d.ts): the body's ten meshes and every part's bound to a single Skeleton, so a
// frame computes the player's bone matrices once and uploads one bone texture (three's per skeleton), not one per mesh
// (a dressed player had 16-18). Each mesh's own skeleton (its GLB's: the same joints as the body's, or a subset, each
// joint's inverse bind with the mesh's dequantisation folded in, gltfpack's) is mapped onto it by joint: the shared
// skeleton's inverse binds are the player's rest, and the mesh's bind matrix takes the difference (the same for every
// joint of a mesh whose rest is the body's: checked, else the mesh keeps a skeleton of its own as before). Its joint
// numbers are rewritten to the shared skeleton's: the joints the player had when it was made come first, in the same
// order for every player, so a mesh using only those has the same numbers on every player (one copy, kept by its GLB's
// geometry); a part's own joints (a skirt's, a ponytail's) are added after, per player.
import { BufferAttribute, BufferGeometry, Matrix4, Skeleton, type Bone, type Object3D, type SkinnedMesh } from 'three';

/** How far apart (of its largest entry) two joints' bind differences may be and still be one mesh's. */
const SAME = 1e-3;

interface Bound {
  /** The player's joints its own skeleton's map to (by its own joint number). */
  to: Bone[];
  /** Its GLB's geometry (its own joint numbers). */
  src: BufferGeometry;
  /** Bound to the shared skeleton (else its own). */
  shared: boolean;
}

/** The remapped geometries of meshes using only the joints every player has, by their GLB's geometry and the map. */
const common = new WeakMap<BufferGeometry, Map<string, BufferGeometry>>();

/** The joint numbers a mesh's vertices use (weight over 0). */
function usedJoints(g: BufferGeometry): Set<number> {
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, u = new Set<number>();
  for (let i = 0; i < si.count; i++) for (let k = 0; k < 4; k++) if (sw.getComponent(i, k) > 0) u.add(si.getComponent(i, k));
  return u;
}

/** `src` with its joint numbers through `map` (the other attributes shared). */
function remapped(src: BufferGeometry, map: readonly number[]): BufferGeometry {
  const g = new BufferGeometry();
  g.setIndex(src.index);
  for (const [k, a] of Object.entries(src.attributes)) if (k !== 'skinIndex') g.setAttribute(k, a);
  g.setAttribute('skinIndex', new BufferAttribute(new Uint16Array(src.attributes.skinIndex.count * 4), 4));
  writeJoints(g, src, map);
  g.morphAttributes = src.morphAttributes;
  g.morphTargetsRelative = src.morphTargetsRelative;
  for (const r of src.groups) g.addGroup(r.start, r.count, r.materialIndex);
  g.setDrawRange(src.drawRange.start, src.drawRange.count);
  g.name = src.name;
  g.userData = src.userData;
  return g;
}
function writeJoints(g: BufferGeometry, src: BufferGeometry, map: readonly number[]) {
  const from = src.attributes.skinIndex, to = g.attributes.skinIndex as BufferAttribute, a = to.array as Uint16Array;
  for (let i = 0; i < from.count; i++) for (let k = 0; k < 4; k++) a[i * 4 + k] = map[from.getComponent(i, k)] ?? 0;
  to.needsUpdate = true;
}

export interface SharedSkin {
  readonly skeleton: Skeleton;
  /** Bind `m` (as loaded: its own skeleton, its GLB's geometry) to the shared skeleton, its joint `i` being the
   *  player's `to[i]`; or, when its rest isn't the player's, to a skeleton of its own over those joints. */
  bind(m: SkinnedMesh, to: Bone[]): void;
  /** A part's own joint, just added under its parent at its rest: its rest noted. */
  graft(b: Bone): void;
  /** The player's joints `m` binds to. */
  uses(m: SkinnedMesh): readonly Bone[];
  /** Whether `m` is on the shared skeleton. */
  shares(m: SkinnedMesh): boolean;
  /** `m` taken off: its geometry (the GPU's copy) and its own skeleton, if it has one, let go of. */
  drop(m: SkinnedMesh): void;
  /** Joints no longer in the model let go of (a part taken off), the meshes' numbers rewritten. */
  compact(meshes: Iterable<SkinnedMesh>): void;
  /** Its bone texture and the geometries made for this player let go of. */
  dispose(meshes: Iterable<SkinnedMesh>): void;
}

/** `model` at its rest, every joint it has now (the body's, the anchors on its head) the shared skeleton's first. */
export function sharedSkin(model: Object3D): SharedSkin {
  model.updateMatrixWorld(true);
  const rest = new Map<Bone, Matrix4>();
  const list: Bone[] = [];
  model.traverse((n) => {
    if (!(n as Bone).isBone) return;
    rest.set(n as Bone, n.matrixWorld.clone());
    list.push(n as Bone);
  });
  /** How many of the joints every player has the same (the first `fixed`). */
  const fixed = list.length;
  const skeleton = new Skeleton(list.slice(), list.map((b) => rest.get(b)!.clone().invert()));
  const index = new Map<Bone, number>(list.map((b, i) => [b, i]));
  const bound = new WeakMap<SkinnedMesh, Bound>();
  /** The geometries made for this player alone (meshes using a part's own joints). */
  const own = new Set<BufferGeometry>();

  const resize = () => {
    skeleton.boneMatrices = new Float32Array(skeleton.bones.length * 16);
    skeleton.boneTexture?.dispose();
    skeleton.boneTexture = null;
  };
  const add = (b: Bone) => {
    let i = index.get(b);
    if (i !== undefined) return i;
    i = skeleton.bones.length;
    skeleton.bones.push(b);
    skeleton.boneInverses.push(rest.get(b)!.clone().invert());
    index.set(b, i);
    resize();
    return i;
  };
  const mapOf = (b: Bound) => b.to.map((j) => index.get(j)!);
  const geometryFor = (src: BufferGeometry, map: number[], old: BufferGeometry | null): BufferGeometry => {
    if (map.every((i) => i < fixed)) {
      let byMap = common.get(src);
      if (!byMap) common.set(src, (byMap = new Map()));
      const k = map.join(',');
      let g = byMap.get(k);
      if (!g) byMap.set(k, (g = remapped(src, map)));
      return g;
    }
    if (old && own.has(old)) {
      writeJoints(old, src, map);
      return old;
    }
    const g = remapped(src, map);
    own.add(g);
    return g;
  };

  return {
    skeleton,
    bind(m, to) {
      const src = m.geometry, inv = m.skeleton.boneInverses, bind0 = m.bindMatrix.clone();
      // the bind difference by each joint used: one for the whole mesh when its rest is the player's
      let x: Matrix4 | null = null, same = true;
      for (const i of usedJoints(src)) {
        const r = rest.get(to[i]);
        if (!r) {
          same = false;
          break;
        }
        const xi = r.clone().multiply(inv[i]).multiply(bind0);
        if (!x) x = xi;
        else {
          const big = Math.max(...x.elements.map(Math.abs));
          if (xi.elements.some((e, k) => Math.abs(e - x!.elements[k]) > SAME * big)) {
            same = false;
            break;
          }
        }
      }
      if (!same || !x) {
        m.bind(new Skeleton(to, inv.map((v) => v.clone())), bind0);
        bound.set(m, { to, src, shared: false });
        return;
      }
      for (const j of to) add(j);
      const b: Bound = { to, src, shared: true };
      bound.set(m, b);
      m.geometry = geometryFor(src, mapOf(b), null);
      m.bind(skeleton, x);
    },
    graft(b) {
      const p = b.parent as Bone | null;
      b.updateMatrix();
      const pr = p ? rest.get(p) : undefined;
      rest.set(b, pr ? pr.clone().multiply(b.matrix) : b.matrix.clone());
    },
    uses: (m) => bound.get(m)?.to ?? m.skeleton.bones,
    shares: (m) => !!bound.get(m)?.shared,
    drop(m) {
      own.delete(m.geometry);
      m.geometry.dispose();
      // (its skeleton's bone texture, three's float texture kept on the GPU till the skeleton goes)
      if (!bound.get(m)?.shared) m.skeleton.dispose();
      bound.delete(m);
    },
    compact(meshes) {
      const inModel = (b: Bone) => {
        let n: Object3D | null = b;
        while (n && n !== model) n = n.parent;
        return n === model;
      };
      const keep = skeleton.bones.filter((b, i) => i < fixed || inModel(b));
      if (keep.length === skeleton.bones.length) return;
      for (const b of skeleton.bones) if (!keep.includes(b)) rest.delete(b);
      skeleton.bones = keep;
      skeleton.boneInverses = keep.map((b) => rest.get(b)!.clone().invert());
      index.clear();
      keep.forEach((b, i) => index.set(b, i));
      resize();
      for (const m of meshes) {
        const b = bound.get(m);
        if (b?.shared) m.geometry = geometryFor(b.src, mapOf(b), m.geometry);
      }
    },
    dispose(meshes) {
      skeleton.dispose();
      for (const m of meshes) if (!bound.get(m)?.shared) m.skeleton.dispose();
      for (const g of own) g.dispose();
      own.clear();
    }
  };
}
