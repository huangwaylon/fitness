// The sting's hand to the cheek (tune.ts reachArm): on the player body's own left arm (sting-arm.json: its chain at rest
// from the model's root, and the eyes' box, read off NH's body), the hand ends at the cheek, not out to the side.
import { describe, expect, it } from 'vitest';
import { Bone, Box3, Group, Object3D, Vector3 } from 'three';
import { jointOf, restFrame, turnJoint } from '../villager3d/rig.ts';
import { STING_ARM, STING_MISS, cheekOf, reachArm } from './tune.ts';
import ARM from './sting-arm.json' with { type: 'json' };

function body() {
  const root = new Group();
  let at: Object3D = root;
  const named = new Map<string, Object3D>();
  for (const c of ARM.chain) {
    const n = c.name.startsWith('Arm') || c.name.startsWith('Wrist') || c.name.startsWith('Hand') ? new Bone() : new Object3D();
    n.name = c.name;
    n.position.fromArray(c.p);
    n.quaternion.fromArray(c.q);
    n.scale.fromArray(c.s);
    at.add(n);
    at = n;
    named.set(c.name, n);
  }
  root.updateMatrixWorld(true);
  const { q } = restFrame(root);
  const a1 = jointOf(q, named.get('Arm_1_L') as Bone), a2 = jointOf(q, named.get('Arm_2_L') as Bone);
  const cheek = cheekOf(new Box3(new Vector3().fromArray(ARM.eye[0]), new Vector3().fromArray(ARM.eye[1])));
  const hand = () => {
    root.updateMatrixWorld(true);
    return named.get('Wrist_L')!.getWorldPosition(new Vector3()).lerp(named.get('Hand_L')!.getWorldPosition(new Vector3()), 0.5);
  };
  return { root, a1, a2, w: named.get('Wrist_L')!, h: named.get('Hand_L')!, cheek, hand };
}

describe("the sting's hand (tune.ts reachArm)", () => {
  it('ends at the cheek under the left eye, the arm raised forward (not straight out to the side)', () => {
    const b = body();
    const r = reachArm(b.a1, b.a2, b.w, b.h, b.root, b.cheek);
    expect(r.miss).toBeLessThan(1);
    turnJoint(b.a1, r.a1);
    turnJoint(b.a2, r.a2);
    const hand = b.hand();
    expect(hand.distanceTo(b.cheek)).toBeLessThan(1);
    // (in front of the face, at its height: not out at the side, where the old solve left it)
    expect(hand.z).toBeGreaterThan(1.5);
    expect(Math.abs(hand.x)).toBeLessThan(3);
  });

  it('the hand-authored arm alone brings the hand within the miss of the cheek', () => {
    const b = body();
    turnJoint(b.a1, STING_ARM.a1);
    turnJoint(b.a2, STING_ARM.a2);
    expect(b.hand().distanceTo(b.cheek)).toBeLessThan(STING_MISS);
  });

  it('a target out of reach gives the hand-authored arm', () => {
    const b = body();
    const r = reachArm(b.a1, b.a2, b.w, b.h, b.root, new Vector3(40, 40, 40));
    expect(r.a1).toEqual(STING_ARM.a1);
    expect(r.a2).toEqual(STING_ARM.a2);
  });
});
