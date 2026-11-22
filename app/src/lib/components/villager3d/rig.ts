// A pose (poses.ts) on an NH villager's skeleton (villager3d). Each joint's rest rotation is kept, and its rest
// orientation in the model's space: a pose's rotation, given about the model's axes, is turned into the bone's own
// frame (w⁻¹ · R · w) and applied after its rest rotation, so a child's turn rides on its parent's (a forearm's bend
// follows the arm's swing). Joints a species lacks (a bird's ears) are skipped.
import { Euler, Quaternion, Vector3, type Bone, type Matrix4, type Object3D } from 'three';
import { JOINTS, type Body, type Joint, type Pose } from './poses.ts';

/** A bone a pose turns: its rest rotation, and its rest orientation in the model's space and that inverted. */
export interface J {
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
  /** A joint a pose turns, with its rest (rooms/lookAt.ts turns the head after the pose), or null: none of it. */
  joint(n: Joint): J | null;
  /** How many joints a pose can move. */
  joints: number;
}

const e = new Euler(0, 0, 0, 'XYZ'), r = new Quaternion(), d = new Quaternion();

/** A rig's root at rest: its world matrices updated, the inverse of its world rotation and matrix. */
export function restFrame(root: Object3D): { q: Quaternion; m: Matrix4 } {
  root.updateMatrixWorld(true);
  return { q: root.getWorldQuaternion(new Quaternion()).invert(), m: root.matrixWorld.clone().invert() };
}

/** The bones under `root` by name (the first of each name), into `map` (cleared first). */
export function bonesOf(root: Object3D, map = new Map<string, Bone>()): Map<string, Bone> {
  map.clear();
  root.traverse((n) => {
    if ((n as Bone).isBone && !map.has(n.name)) map.set(n.name, n as Bone);
  });
  return map;
}

/** A bone as a joint, at rest (`rootQ`: restFrame's q). */
export function jointOf(rootQ: Quaternion, bone: Bone): J {
  const w = rootQ.clone().multiply(bone.getWorldQuaternion(new Quaternion()));
  return { bone, rest: bone.quaternion.clone(), w, wi: w.clone().invert() };
}

/** A model-space turn in the bone's own frame, after its rest (none: its rest). */
export function turnJoint(j: J, v: readonly [number, number, number] | null | undefined): void {
  if (!v || (v[0] === 0 && v[1] === 0 && v[2] === 0)) {
    j.bone.quaternion.copy(j.rest);
    return;
  }
  r.setFromEuler(e.set(v[0], v[1], v[2]));
  d.copy(j.wi).multiply(r).multiply(j.w);
  j.bone.quaternion.copy(j.rest).multiply(d);
}

/** A bone's rest position in the model's space (`rootM`: restFrame's m), or null with none of that name. */
export function restAt(bones: Map<string, Bone>, rootM: Matrix4, n: string): Vector3 | null {
  const b = bones.get(n);
  return b ? new Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(rootM) : null;
}

/** The rig of a villager's scene (its root at rest, unscaled: the GLB's own scene). */
export function rigOf(root: Object3D, opts: RigOpts = {}): Rig {
  const { q: rootQ, m: rootM } = restFrame(root);
  const map = bonesOf(root);
  const js: Partial<Record<Joint, J>> = {};
  for (const n of JOINTS) {
    const bone = map.get(opts.alias?.[n] ?? n);
    if (bone) js[n] = jointOf(rootQ, bone);
  }
  const more = new Map<string, J>();
  for (const n of opts.extra ?? []) {
    const bone = map.get(n);
    if (bone) more.set(n, jointOf(rootQ, bone));
  }
  const at = (n: string) => restAt(map, rootM, n);
  const len = (a: string, b: string, dflt: number) => {
    const pa = at(a), pb = at(b);
    return pa && pb ? pa.distanceTo(pb) : dflt;
  };
  const body: Body = { thigh: len('Leg_1_L', 'Leg_2_L', 1.6), shin: len('Leg_2_L', 'Ankle_L', 1.4), hip: at('Leg_1_L')?.y ?? 3.4 };
  // (the shoulder to the wrist, and the palm past it: Hand_L is the item socket in the palm)
  const sh = at('Arm_1_L')?.y, arm = len('Arm_1_L', 'Wrist_L', 0) || len('Arm_1_L', 'Hand_L', 0);
  if (sh) body.sh = sh;
  if (arm) body.arm = arm * 1.12;
  const list = Object.entries(js) as [Joint, J][];
  const turnNamed = (name: string, v: readonly [number, number, number] | null | undefined) => {
    const j = js[name as Joint] ?? more.get(name);
    if (j) turnJoint(j, v);
  };
  return {
    body,
    joints: list.length,
    // (the bone of that name: a player's Hand_R, the tool's socket, though its pose turns Wrist_R)
    bone: (n) => map.get(n) ?? null,
    joint: (n) => js[n] ?? null,
    // (no closure or entry a call: every walker's every frame)
    apply(p) {
      for (let i = 0; i < list.length; i++) turnJoint(list[i][1], p.j[list[i][0]]);
      opts.after?.(p, turnNamed);
    }
  };
}
