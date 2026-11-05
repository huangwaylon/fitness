// A tap on a skinned model's outline as it's posed (the tent's on a human player), without skinning it on the CPU:
// each mesh's vertices boxed in the frame of the joint that carries most of each (its rest, once a mesh), and a ray
// put into each joint's frame as it's posed now and tried against its boxes. (three's raycast of a skinned mesh skins
// every vertex of the mesh, its bounds as well, for each ray: the tent's tap tried five.)
import { Box3, Matrix4, Ray, Vector3, type Object3D, type SkinnedMesh } from 'three';

interface Boxes { geometry: SkinnedMesh['geometry']; skeleton: SkinnedMesh['skeleton']; by: Map<number, Box3> }
const cache = new WeakMap<SkinnedMesh, Boxes>();

/** `m`'s vertices boxed by the joint weighing most on each, in that joint's frame. */
function boxesOf(m: SkinnedMesh): Boxes {
  const c = cache.get(m);
  if (c && c.geometry === m.geometry && c.skeleton === m.skeleton) return c;
  const pos = m.geometry.attributes.position, si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
  const by = new Map<number, Box3>(), v = new Vector3(), toJoint = new Map<number, Matrix4>();
  for (let i = 0; i < pos.count; i++) {
    let j = si.getComponent(i, 0), w = sw.getComponent(i, 0);
    for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > w) (w = sw.getComponent(i, k)), (j = si.getComponent(i, k));
    let t = toJoint.get(j);
    if (!t) toJoint.set(j, (t = m.skeleton.boneInverses[j].clone().multiply(m.bindMatrix)));
    let b = by.get(j);
    if (!b) by.set(j, (b = new Box3()));
    b.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(t));
  }
  const out = { geometry: m.geometry, skeleton: m.skeleton, by };
  cache.set(m, out);
  return out;
}

const local = new Ray(), inv = new Matrix4();
/** Whether `ray` (world space) meets a visible skinned mesh under `root` as posed (its joints' world matrices: the
 *  last frame's). */
export function hitsSkinned(root: Object3D, ray: Ray): boolean {
  let hit = false;
  root.traverseVisible((o) => {
    const m = o as SkinnedMesh;
    if (hit || !m.isSkinnedMesh) return;
    for (const [j, box] of boxesOf(m).by) {
      const bone = m.skeleton.bones[j];
      if (!bone) continue;
      local.copy(ray).applyMatrix4(inv.copy(bone.matrixWorld).invert());
      if (local.intersectsBox(box)) {
        hit = true;
        return;
      }
    }
  });
  return hit;
}
