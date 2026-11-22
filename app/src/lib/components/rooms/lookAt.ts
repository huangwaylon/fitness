// The rooms' カメラめせん (docs/design.md "The tent"): every character's head turned to the camera after its pose, within
// a neck's reach (yaw ±70°, pitch ±30° off the chest), eased in, out and along; the pose's own head blended back as it
// goes off. The rooms' engines call it from poseStep (roomCore.ts) with the camera's place, or null (off, or at the
// eyes: never in first person). The rigs' eyes are textures, so the head alone turns. Its state rides each model.
import { Euler, Quaternion, Vector3 } from 'three';
import type { Villager3D } from '../villager3d/villager3d.ts';
import type { J } from '../villager3d/rig.ts';

/** How far a head turns from the chest (radians): left and right, up and down. */
export const YAW_MAX = (70 * Math.PI) / 180, PITCH_MAX = (30 * Math.PI) / 180;
/** The easing's time constants (ms): the head's aim, the look's weight on and off. */
const AIM_TC = 110, ON_TC = 160;

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/** A direction in the chest's frame (the model's axes: +z ahead, +y up) as the head's turn to it: yaw left of ahead
 *  (radians, +x), pitch up; each clamped to the neck's reach (behind: the nearer side's limit). */
export function lookAngles(x: number, y: number, z: number): [number, number] {
  return [clamp(Math.atan2(x, z), YAW_MAX), clamp(Math.atan2(y, Math.hypot(x, z)), PITCH_MAX)];
}

interface Look { yaw: number; pitch: number; w: number; posed: Quaternion; applied: boolean }
const looks = new WeakMap<Villager3D, Look>();
const e = new Euler(0, 0, 0, 'YXZ'), q = new Quaternion(), qr = new Quaternion(), qp = new Quaternion(), d = new Vector3(), hp = new Vector3();

/** The direction `to` (world) in the head joint's rest frame on its parent as posed now, in the model's axes, into
 *  `out`: where the head would face, at rest, is +z. */
function inChest(j: J, to: Vector3, out: Vector3): Vector3 {
  const parent = j.bone.parent!;
  parent.updateWorldMatrix(true, false);
  hp.copy(j.bone.position).applyMatrix4(parent.matrixWorld);
  parent.getWorldQuaternion(qp);
  return out.copy(to).sub(hp).applyQuaternion(qp.invert()).applyQuaternion(qr.copy(j.rest).invert()).applyQuaternion(j.w);
}

/**
 * One frame of `v`'s head: toward `cam` (world; null: back to its pose), eased by `dt` ms. `posed`: its pose was just
 * applied (step()), else its last pose's head is used again. True while it's still turning (more frames).
 */
export function headLook(v: Villager3D, cam: Vector3 | null, dt: number, posed: boolean): boolean {
  const j = v.rig.joint('Head');
  if (!j || !j.bone.parent) return false;
  let s = looks.get(v);
  if (!s) {
    if (!cam) return false;
    looks.set(v, (s = { yaw: 0, pitch: 0, w: 0, posed: new Quaternion(), applied: false }));
  }
  if (posed || !s.applied) s.posed.copy(j.bone.quaternion);
  if (!cam && !s.w) {
    if (s.applied) j.bone.quaternion.copy(s.posed), (s.applied = false);
    return false;
  }
  let moving = false;
  if (cam) {
    inChest(j, cam, d);
    const [ty, tp] = lookAngles(d.x, d.y, d.z);
    if (!s.w) (s.yaw = ty), (s.pitch = tp);
    const a = 1 - Math.exp(-dt / AIM_TC), dy = ty - s.yaw, dp = tp - s.pitch;
    if (Math.abs(dy) + Math.abs(dp) < 1e-3) (s.yaw = ty), (s.pitch = tp);
    else (s.yaw += dy * a), (s.pitch += dp * a), (moving = true);
  }
  const want = cam ? 1 : 0, dw = want - s.w;
  if (Math.abs(dw) < 2e-3) s.w = want;
  else (s.w += dw * (1 - Math.exp(-dt / ON_TC))), (moving = true);
  // the head turned in the model's axes after its rest (rig.ts turnJoint's), blended with the pose's own
  e.set(-s.pitch, s.yaw, 0);
  q.setFromEuler(e);
  qr.copy(j.wi).multiply(q).multiply(j.w);
  q.copy(j.rest).multiply(qr);
  const k = s.w * s.w * (3 - 2 * s.w);
  j.bone.quaternion.copy(s.posed).slerp(q, k);
  s.applied = s.w > 0;
  if (!s.applied) j.bone.quaternion.copy(s.posed);
  return moving;
}

/** Where `v`'s head faces now and where `cam` is from it, both as yaw and pitch off the chest (degrees; the latter
 *  unclamped), and the angle between the head's way and the camera's (the e2e's check); null without a head. */
export function gazeOf(v: Villager3D, cam: Vector3): { yaw: number; pitch: number; toYaw: number; toPitch: number; off: number } | null {
  const j = v.rig.joint('Head');
  if (!j || !j.bone.parent) return null;
  v.group.updateMatrixWorld(true);
  const deg = 180 / Math.PI, to = inChest(j, cam, new Vector3());
  // the head's own +z (the model's ahead at rest) through its turn now, in the same frame
  const f = new Vector3(0, 0, 1).applyQuaternion(j.wi).applyQuaternion(j.bone.quaternion).applyQuaternion(qr.copy(j.rest).invert()).applyQuaternion(j.w);
  return {
    yaw: Math.atan2(f.x, f.z) * deg, pitch: Math.atan2(f.y, Math.hypot(f.x, f.z)) * deg,
    toYaw: Math.atan2(to.x, to.z) * deg, toPitch: Math.atan2(to.y, Math.hypot(to.x, to.z)) * deg, off: f.angleTo(to) * deg
  };
}
