// カメラめせん's head (lookAt.ts): the turn's clamp to a neck's reach, and the head on a small rig (its bones' own odd
// rest turns, the body turned and leaning) aimed at the camera, eased on and off, back to its pose.
import { describe, expect, it } from 'vitest';
import { Bone, Group, Quaternion, Vector3 } from 'three';
import { PITCH_MAX, YAW_MAX, gazeOf, headLook, lookAngles } from './lookAt.ts';
import { rigOf } from '../villager3d/rig.ts';
import type { Villager3D } from '../villager3d/villager3d.ts';

const deg = (d: number) => (d * Math.PI) / 180;

describe('the clamp', () => {
  it('is the direction’s yaw and pitch within ±70° and ±30°', () => {
    expect([YAW_MAX, PITCH_MAX]).toEqual([deg(70), deg(30)]);
    const [y, p] = lookAngles(Math.sin(deg(20)), 0, Math.cos(deg(20)));
    expect(y).toBeCloseTo(deg(20));
    expect(p).toBeCloseTo(0);
    expect(lookAngles(0, Math.tan(deg(15)), 1)[1]).toBeCloseTo(deg(15));
    // past the neck: its limit
    expect(lookAngles(1, 0, 0)).toEqual([deg(70), 0]);
    expect(lookAngles(-1, 0, 0.2)[0]).toBe(-deg(70));
    expect(lookAngles(0, 5, 1)[1]).toBe(deg(30));
    expect(lookAngles(0, -5, 1)[1]).toBe(-deg(30));
    // behind: the nearer side's
    expect(lookAngles(0.1, 0, -1)[0]).toBe(deg(70));
    expect(lookAngles(-0.1, 0, -1)[0]).toBe(-deg(70));
  });
});

/** A body (its group turned `yaw`) whose neck leans and whose head bone has a rest turn of its own, as a GLB's do. */
function body(yaw: number) {
  const group = new Group(), neck = new Bone(), head = new Bone();
  neck.name = 'Neck';
  head.name = 'Head';
  neck.position.set(0, 10, 0);
  neck.quaternion.setFromAxisAngle(new Vector3(0, 0, 1), deg(90));
  head.position.set(2, 0, 0);
  head.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), deg(-35));
  neck.add(head);
  group.add(neck);
  const rig = rigOf(group);
  group.rotation.y = yaw;
  group.position.set(5, 0, -3);
  // the pose: the neck a little forward, the head's own tilt
  rig.apply({ j: { Neck: [0.2, 0, 0], Head: [0.1, 0.2, 0] }, y: 0, sq: 1, pitch: 0 });
  group.updateMatrixWorld(true);
  const v = { group, rig, state: () => 'idle' } as unknown as Villager3D;
  return { v, head, posed: head.quaternion.clone() };
}
const run = (v: Villager3D, cam: Vector3 | null, ms: number) => {
  let more = true;
  for (let t = 0; t < ms && more; t += 16) more = headLook(v, cam, 16, false);
  return more;
};

describe('the head', () => {
  it('turns to a camera within reach, eased, then rests (no more frames)', () => {
    const { v } = body(deg(30));
    // ahead of it (its +z turned 30°), up a little and to its left
    const cam = new Vector3(5 + Math.sin(deg(50)) * 100, 40, -3 + Math.cos(deg(50)) * 100);
    expect(headLook(v, cam, 16, true)).toBe(true);
    expect(gazeOf(v, cam)!.off).toBeGreaterThan(1);
    expect(run(v, cam, 3000)).toBe(false);
    const g = gazeOf(v, cam)!;
    expect(g.off).toBeLessThan(0.5);
    expect(Math.abs(g.toYaw)).toBeLessThan(70);
    expect(Math.abs(g.toPitch)).toBeLessThan(30);
  });
  it('stops at the neck’s reach: behind and high above, the head at ±70° and +30°', () => {
    const { v } = body(0);
    const cam = new Vector3(5 + 60, 300, -3 - 100);
    run(v, cam, 3000);
    const g = gazeOf(v, cam)!;
    expect(g.yaw).toBeCloseTo(70, 0);
    expect(g.pitch).toBeCloseTo(30, 0);
  });
  it('off, it eases back to its pose exactly, then leaves the next pose alone', () => {
    const { v, head, posed } = body(0);
    const cam = new Vector3(40, 30, 80);
    run(v, cam, 3000);
    expect(head.quaternion.angleTo(posed)).toBeGreaterThan(0.1);
    expect(headLook(v, null, 16, false)).toBe(true);
    expect(run(v, null, 3000)).toBe(false);
    expect(head.quaternion.angleTo(posed)).toBeLessThan(1e-6);
    // (off and settled: nothing touched)
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.3);
    head.quaternion.copy(q);
    expect(headLook(v, null, 16, true)).toBe(false);
    expect(head.quaternion.equals(q)).toBe(true);
  });
});
