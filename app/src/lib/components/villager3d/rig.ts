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

/** A kind's own rigging over the villagers' (the human players': player3d/tune.ts). */
export interface RigOpts {
  /** A pose's joint → the bone it turns (the player's hands are skinned to Wrist_*, not Hand_*). */
  alias?: Partial<Record<Joint, string>>;
  /** More bones a kind turns itself (a skirt's, a ponytail's), in the same way (`turn` below). */
  extra?: readonly string[];
  /** After each pose: a kind's own (the cloth, the hair, the hands kept out of the head). `turn` sets a joint's or an
   *  extra bone's model-space rotation as apply does (null: its rest). */
  after?: (p: Pose, turn: (name: string, v: readonly [number, number, number] | null) => void) => void;
}

export interface Rig {
  apply(p: Pose): void;
  /** The thigh's and the shin's length and the hips' height (model units). */
  body: Body;
  /** A joint's bone (the head's, for what sits on it; a hand's, for a tool), by its name. */
  bone(n: Joint): Bone | null;
  /** How many joints a pose can move. */
  joints: number;
}

const e = new Euler(0, 0, 0, 'XYZ'), r = new Quaternion(), d = new Quaternion();

/** The rig of a villager's scene (its root at rest, unscaled: the GLB's own scene). */
export function rigOf(root: Object3D, opts: RigOpts = {}): Rig {
  root.updateMatrixWorld(true);
  const rootQ = root.getWorldQuaternion(new Quaternion()).invert();
  const rootM = root.matrixWorld.clone().invert();
  const map = new Map<string, Bone>();
  root.traverse((n) => {
    if ((n as Bone).isBone && !map.has(n.name)) map.set(n.name, n as Bone);
  });
  const js: Partial<Record<Joint, J>> = {};
  const jOf = (bone: Bone): J => {
    const w = rootQ.clone().multiply(bone.getWorldQuaternion(new Quaternion()));
    return { bone, rest: bone.quaternion.clone(), w, wi: w.clone().invert() };
  };
  for (const n of JOINTS) {
    const bone = map.get(opts.alias?.[n] ?? n);
    if (bone) js[n] = jOf(bone);
  }
  const more = new Map<string, J>();
  for (const n of opts.extra ?? []) {
    const bone = map.get(n);
    if (bone) more.set(n, jOf(bone));
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
  /** A model-space turn in the bone's own frame, after its rest (none: its rest). */
  const turnJ = (j: J, v: readonly [number, number, number] | null | undefined) => {
    if (!v || (v[0] === 0 && v[1] === 0 && v[2] === 0)) {
      j.bone.quaternion.copy(j.rest);
      return;
    }
    r.setFromEuler(e.set(v[0], v[1], v[2]));
    d.copy(j.wi).multiply(r).multiply(j.w);
    j.bone.quaternion.copy(j.rest).multiply(d);
  };
  return {
    body,
    joints: list.length,
    // (the bone of that name: a player's Hand_R, the tool's socket, though its pose turns Wrist_R)
    bone: (n) => map.get(n) ?? null,
    apply(p) {
      for (const [n, j] of list) turnJ(j, p.j[n]);
      opts.after?.(p, (name, v) => {
        const j = js[name as Joint] ?? more.get(name);
        if (j) turnJ(j, v);
      });
    }
  };
}
