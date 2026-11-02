// A pose (poses.ts) on an NH villager's skeleton (villager3d). Each joint's rest rotation is kept, and its rest
// orientation in the model's space: a pose's rotation, given about the model's axes, is turned into the bone's own
// frame (w⁻¹ · R · w) and applied after its rest rotation, so a child's turn rides on its parent's (a forearm's bend
// follows the arm's swing). Joints a species lacks (a bird's ears) are skipped.
import { Euler, Quaternion, Vector3, type Bone, type Object3D } from 'three';
import { JOINTS, type Body, type Joint, type Pose } from './poses.ts';

interface J {
  bone: Bone;
  rest: Quaternion;
  w: Quaternion;
  wi: Quaternion;
}

export interface Rig {
  apply(p: Pose): void;
  /** The thigh's and the shin's length and the hips' height (model units). */
  body: Body;
  /** A joint's bone (the head's, for what sits on it). */
  bone(n: Joint): Bone | null;
  /** How many joints a pose can move. */
  joints: number;
}

const e = new Euler(0, 0, 0, 'XYZ'), r = new Quaternion(), d = new Quaternion();

/** The rig of a villager's scene (its root at rest, unscaled: the GLB's own scene). */
export function rigOf(root: Object3D): Rig {
  root.updateMatrixWorld(true);
  const rootQ = root.getWorldQuaternion(new Quaternion()).invert();
  const rootM = root.matrixWorld.clone().invert();
  const map = new Map<string, Bone>();
  root.traverse((n) => {
    if ((n as Bone).isBone && !map.has(n.name)) map.set(n.name, n as Bone);
  });
  const js: Partial<Record<Joint, J>> = {};
  for (const n of JOINTS) {
    const bone = map.get(n);
    if (!bone) continue;
    const w = rootQ.clone().multiply(bone.getWorldQuaternion(new Quaternion()));
    js[n] = { bone, rest: bone.quaternion.clone(), w, wi: w.clone().invert() };
  }
  const at = (n: string) => {
    const b = map.get(n);
    return b ? new Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(rootM) : null;
  };
  const len = (a: string, b: string, dflt: number) => {
    const pa = at(a), pb = at(b);
    return pa && pb ? pa.distanceTo(pb) : dflt;
  };
  const body: Body = { thigh: len('Leg_1_L', 'Leg_2_L', 1.6), shin: len('Leg_2_L', 'Ankle_L', 1.4), hip: at('Leg_1_L')?.y ?? 3.4 };
  const list = Object.entries(js) as [Joint, J][];
  return {
    body,
    joints: list.length,
    bone: (n) => js[n]?.bone ?? null,
    apply(p) {
      for (const [n, j] of list) {
        const v = p.j[n];
        if (!v || (v[0] === 0 && v[1] === 0 && v[2] === 0)) {
          j.bone.quaternion.copy(j.rest);
          continue;
        }
        r.setFromEuler(e.set(v[0], v[1], v[2]));
        // the model-space turn in the bone's own frame, after its rest
        d.copy(j.wi).multiply(r).multiply(j.w);
        j.bone.quaternion.copy(j.rest).multiply(d);
      }
    }
  };
}
