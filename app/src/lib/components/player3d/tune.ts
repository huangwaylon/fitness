// What an NH human player does its own way over a villager (design/avatar/anim/rig.md: the animator's study, ported):
// the villagers' poses (villager3d/poses.ts) drive it unchanged through villager3d's Kind, with these on top.
//   - The hands: a player's hand mesh is skinned to Wrist_*, not Hand_* (NH's item socket): a pose's Hand_* turns
//     Wrist_* (the tool, on Hand_R, follows).
//   - The cloth: NH swings a skirt's chains (Skirt_{1,2,3}_{L,R}{F,C,B}) and a top's hem with physics; here each chain
//     follows its side's thigh (the front most, the side half, the back a little), its last joint taking the pitch
//     back so the cloth past the knee hangs.
//   - The ponytail (Hair_1): toward gravity a part of the way as the head and body tip; aside lying on its back.
//   - A low seat: the hands ride up onto the knees as the thighs rise (the player's longer thighs).
//   - Lying and face down: the chin tucked (the head on the pillow), or the head turned onto its cheek; the lift by the
//     torso's depth, not the head's (a player's head is far deeper than its chest).
//   - The hands kept out of the head (a player's arms reach into it: the wave's fist, a blend through the face).
//   - sitOn's reach: a player's sole sits further under its ankle than a villager's.
//   - The sting: the hand can't reach the eye (shoulder to eye ~4.8, the arm 4.1): it goes to the cheek under it;
//     the cast's wind-up swings out to the side, past the head, not across the face.
//   - Faces: the player's 16 eye and 9 mouth frames hold the same expressions in another order (PLAYER_EYE,
//     PLAYER_MOUTH); its resting mouth is the look's own (B's an open smile).
import { Box3, Euler, Matrix4, Quaternion, Vector3, type Bone, type Object3D, type SkinnedMesh } from 'three';
import { action as villagerAction, type Action, type Body, type Pose } from '../villager3d/poses.ts';
import type { Face } from '../villager3d/faces.ts';
import type { Kind } from '../villager3d/villager3d.ts';

type V3 = readonly [number, number, number];
const CHAINS = ['LF', 'LC', 'LB', 'RF', 'RC', 'RB'] as const;
/** How much of its thigh's pitch each skirt chain takes (front, side, back), a top's hem's share, the spread's. */
const SKIRT = { F: 0.95, C: 0.55, B: 0.12, hem: 0.55, spread: 0.8 } as const;
/** The ponytail's share of the head's and body's tip. */
const HAIR_K = 0.6;
/** Lying on its back: the head (x) and neck (x) tucked; face down: lifted; and turned onto its cheek (y). */
const LIE_TUCK = [0.45, 0.2] as const, PRONE_LIFT = [-0.45, -0.25] as const, PRONE_TURN = 1.15;

/** NH's villager cells (faces.ts) → the player's frames (design/avatar/tech-notes.md, anim/rig.md "Face").
 *    eyes:   0 open · 1 drowsy · 2 shut (asleep, the blink) · 3 cross · 4 worried · 5 happy ^ ^ · 6 shocked · 7 > <
 *            8 open, pupils small · 9 flat · 10 open, pupils big · 11 side glance · 12 wide · 13 squint · 14 glossy · 15 tired
 *    mouths: 0 closed smile · 1 open smile · 2 big grin · 3 frown · 4 upset · 5 open "ah" · 6 flat · 7 small "o" · 8 open "o" */
export const PLAYER_EYE: Readonly<Record<number, number>> = { 0: 0, 3: 13, 8: 4, 9: 5, 10: 6, 11: 7, 14: 2, 15: 3 };
export const PLAYER_MOUTH: Readonly<Record<number, number>> = { 0: 0, 1: 7, 2: 8, 3: 3, 5: 5, 6: 4, 7: 1, 8: 2 };

/** A villager face's cell → the player's frame: the resting mouth (cell 0) is the look's own `rest` frame, but asleep
 *  (a closed smile). */
export function playerCell(part: 'eye' | 'mouth', i: number, face: Face, rest = 0): number {
  if (part === 'eye') return PLAYER_EYE[i] ?? i;
  return i === 0 ? (face === 'sleepy' ? 0 : rest) : PLAYER_MOUTH[i] ?? i;
}

interface J { bone: Bone; rest: Quaternion; w: Quaternion; wi: Quaternion }
const e = new Euler(0, 0, 0, 'XYZ'), r = new Quaternion(), d = new Quaternion();
const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};

/** A player's Kind for villager3d.ts animateModel: `model` the assembled player at rest (its skinned parts bound),
 *  `rest` its look's resting mouth frame. The drivers find whatever cloth and hair joints the outfit has; `rebind()`
 *  finds them again after a part is swapped. */
export function playerKind(model: Object3D, rest = 0): Kind & { rebind(): void } {
  model.updateMatrixWorld(true);
  const rootQ = model.getWorldQuaternion(new Quaternion()).invert();
  const rootM = model.matrixWorld.clone().invert();
  const bones = new Map<string, Bone>();
  const scan = () => {
    bones.clear();
    model.traverse((n) => {
      if ((n as Bone).isBone && !bones.has(n.name)) bones.set(n.name, n as Bone);
    });
  };
  scan();
  const jOf = (b: Bone): J => {
    const w = rootQ.clone().multiply(b.getWorldQuaternion(new Quaternion()));
    return { bone: b, rest: b.quaternion.clone(), w, wi: w.clone().invert() };
  };
  const set = (j: J, v: V3 | null | undefined) => {
    if (!v || (v[0] === 0 && v[1] === 0 && v[2] === 0)) {
      j.bone.quaternion.copy(j.rest);
      return;
    }
    r.setFromEuler(e.set(v[0], v[1], v[2]));
    d.copy(j.wi).multiply(r).multiply(j.w);
    j.bone.quaternion.copy(j.rest).multiply(d);
  };
  const at = (n: string) => {
    const b = bones.get(n);
    return b ? new Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(rootM) : null;
  };
  // the measures at rest: the ankle over the sole, the torso's depth (under the neck: the body without its head)
  const neckY = at('Neck')?.y ?? 8.5, ankle = at('Ankle_L')?.y ?? 0.79;
  const v = new Vector3(), torso = new Box3(), headBox = new Box3();
  const head = bones.get('Head') ?? null;
  const headInv = head ? head.matrixWorld.clone().invert() : new Matrix4();
  model.traverse((n) => {
    const m = n as SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    const name = (m.material as { name?: string }).name ?? '';
    const pos = m.geometry.attributes.position;
    const body = name === 'mSkin', cloth = name === 'mTops' || name === 'mBottoms';
    if (!body && !cloth) return;
    m.skeleton.update();
    for (let i = 0; i < pos.count; i += 2) {
      v.fromBufferAttribute(pos, i);
      m.applyBoneTransform(i, v);
      v.applyMatrix4(m.matrixWorld);
      const local = v.clone().applyMatrix4(rootM);
      if (local.y < neckY - 0.3) torso.expandByPoint(local);
      // (the head as an ellipsoid in the head bone's frame, from the skin over the neck: the hands' clearance)
      else if (body && local.y > neckY + 0.6) headBox.expandByPoint(v.applyMatrix4(headInv));
    }
  });
  const headC = headBox.getCenter(new Vector3()), headR = headBox.getSize(new Vector3()).multiplyScalar(0.5);
  const hasHead = !headBox.isEmpty();
  // the cloth and the hair joints this outfit has (found again on rebind)
  let extra: Map<string, J> = new Map();
  let longSkirt = false;
  const arms: Partial<Record<string, J>> = {};
  const findExtra = () => {
    scan();
    extra = new Map();
    for (const c of CHAINS) for (const k of [1, 2, 3]) {
      const b = bones.get(`Skirt_${k}_${c}`);
      if (b) extra.set(`Skirt_${k}_${c}`, jOf(b));
    }
    const h1 = bones.get('Hair_1');
    if (h1) extra.set('Hair_1', jOf(h1));
    longSkirt = extra.has('Skirt_2_LF');
  };
  findExtra();
  for (const n of ['Arm_1_L', 'Arm_1_R', 'Arm_2_L', 'Arm_2_R']) {
    const b = bones.get(n);
    if (b) arms[n] = jOf(b);
  }
  const hw = new Vector3(), ht = new Vector3();
  /** How far inside the head a hand's middle is (< 1 inside; the mitt ~0.75 round its middle). */
  const inside = (side: 'L' | 'R') => {
    const w = bones.get(`Wrist_${side}`), h = bones.get(`Hand_${side}`);
    if (!w || !h || !head || !hasHead) return 9;
    w.getWorldPosition(hw);
    h.getWorldPosition(ht);
    hw.lerp(ht, 0.5);
    head.worldToLocal(hw).sub(headC);
    const m = 0.9;
    return Math.hypot(hw.x / (headR.x + m), hw.y / (headR.y + m), hw.z / (headR.z + m));
  };

  /** After each pose (rig.ts RigOpts.after). */
  const after = (pose: Pose, turn: (name: string, v: V3 | null) => void) => {
    const pitch = pose.pitch;
    // lying on its back: the chin tucked (the head on the pillow, not the body on the head); face down: the chin up and
    // the head on its cheek
    if (pitch < -0.5 || pitch > 0.5) {
      const [hk, nk] = pitch < 0 ? LIE_TUCK : PRONE_LIFT, k = Math.min(1, (Math.abs(pitch) - 0.5) / 1.0);
      const hd = pose.j.Head ?? [0, 0, 0], nn = pose.j.Neck ?? [0, 0, 0];
      const tw = pitch > 0 ? PRONE_TURN * k * Math.sign(hd[1] || 1) : 0;
      turn('Head', [hd[0] + hk * k, hd[1] + tw, hd[2]]);
      turn('Neck', [nn[0] + nk * k, nn[1], nn[2]]);
    }
    // a low seat (sitOn's thighs raised past level): the hands ride onto the knees
    const th = Math.max(0, -((pose.j.Leg_1_L ?? [0, 0, 0])[0]) - 1.5);
    const arm1: Record<'L' | 'R', V3> = { L: pose.j.Arm_1_L ?? [0, 0, 0], R: pose.j.Arm_1_R ?? [0, 0, 0] };
    if (th > 0.02) {
      for (const sd of ['L', 'R'] as const) {
        const a = arm1[sd];
        arm1[sd] = [a[0] - 0.85 * th, a[1], a[2]];
        turn(`Arm_1_${sd}`, arm1[sd]);
      }
    }
    // the hands out of the head: the upper arm swung out about the forward axis till the hand clears, then the elbow
    // unbent
    if (head && hasHead) {
      for (const side of ['L', 'R'] as const) {
        const a1 = arms[`Arm_1_${side}`], a2 = arms[`Arm_2_${side}`];
        if (!a1 || !a2) continue;
        a1.bone.updateMatrixWorld(true);
        if (inside(side) >= 1) continue;
        const v1 = arm1[side], v2 = pose.j[`Arm_2_${side}`] ?? [0, 0, 0], out = side === 'L' ? -1 : 1;
        let dz = 0;
        while (dz < 0.9 && inside(side) < 1) {
          dz += 0.06;
          set(a1, [v1[0], v1[1], v1[2] + out * dz]);
          a1.bone.updateMatrixWorld(true);
        }
        let k = 1;
        while (k > 0.2 && inside(side) < 1) {
          k -= 0.08;
          set(a2, [v2[0] * k, v2[1] * k, v2[2] * k]);
          a2.bone.updateMatrixWorld(true);
        }
      }
    }
    // the skirt: each chain after its side's thigh (x: its pitch, − forward; z: out to the side)
    for (const c of CHAINS) {
      const s1 = extra.get(`Skirt_1_${c}`);
      if (!s1) continue;
      const side = c[0], pos = c[1] as 'F' | 'C' | 'B';
      const leg = pose.j[`Leg_1_${side as 'L' | 'R'}`] ?? [0, 0, 0];
      const fwd = Math.min(0, leg[0]), back = Math.max(0, leg[0]);
      const kf = SKIRT[pos], kb = pos === 'B' ? SKIRT.F * 0.6 : pos === 'C' ? SKIRT.C * 0.5 : SKIRT.B;
      set(s1, [(kf * fwd + kb * back) * (longSkirt ? 1 : SKIRT.hem), 0, leg[2] * SKIRT.spread * (pos === 'C' ? 1 : 0.6)]);
      const s3 = extra.get(`Skirt_3_${c}`);
      if (s3) set(s3, [-0.92 * kf * fwd, 0, 0]);
      const s2 = extra.get(`Skirt_2_${c}`);
      if (s2) set(s2, null);
    }
    // the ponytail
    const h1 = extra.get('Hair_1');
    if (h1) {
      const hd = pose.j.Head ?? [0, 0, 0], sp = pose.j.Spine_1 ?? [0, 0, 0];
      set(h1, pitch < -0.5 ? [0, 0, 1.1 * Math.sign(hd[1] || 1)] : [-HAIR_K * (hd[0] + sp[0]), 0, -HAIR_K * (hd[2] + sp[2])]);
    }
  };

  // the sting's reach: the arm's pose angles that bring the left hand to the cheek under its eye (once, at rest)
  let sting: { a1: V3; a2: V3 } | null = null;
  const reachSting = (): { a1: V3; a2: V3 } | null => {
    const a1 = arms.Arm_1_L, a2 = arms.Arm_2_L, w = bones.get('Wrist_L'), h = bones.get('Hand_L');
    let eye: Box3 | null = null;
    model.traverse((n) => {
      const m = n as SkinnedMesh;
      if (m.isMesh && (m.material as { name?: string }).name === 'mEye') {
        m.geometry.computeBoundingBox();
        eye = m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld).applyMatrix4(rootM);
      }
    });
    if (!a1 || !a2 || !w || !h || !eye) return null;
    const eb = eye as Box3, wd = eb.max.x - eb.min.x;
    const target = new Vector3(eb.max.x - 0.15 * wd, eb.min.y - 1.5, eb.max.z + 0.5);
    // (from rest: the other bones as they are at rest while it searches, then put back)
    const keep = [...bones.values()].map((b) => [b, b.quaternion.clone()] as const);
    for (const b of bones.values()) {
      const j = arms[b.name];
      if (j) b.quaternion.copy(j.rest);
    }
    const x = [0, -0.5, 0.3, 0, 0, 1.0];
    const hand = new Vector3(), inv = new Matrix4();
    const err = () => {
      set(a1, [x[0], x[1], x[2]]);
      set(a2, [x[3], x[4], x[5]]);
      model.updateMatrixWorld(true);
      inv.copy(model.matrixWorld).invert();
      w.getWorldPosition(hw);
      h.getWorldPosition(ht);
      return hand.copy(hw.lerp(ht, 0.5)).applyMatrix4(inv).distanceTo(target);
    };
    let e0 = err();
    for (let step = 0.3; step > 0.004; step *= 0.6) {
      for (let it = 0; it < 6; it++) for (let i = 0; i < 6; i++) for (const dd of [step, -step]) {
        x[i] += dd;
        const e1 = err();
        if (e1 < e0) e0 = e1;
        else x[i] -= dd;
      }
    }
    for (const [b, q] of keep) b.quaternion.copy(q);
    model.updateMatrixWorld(true);
    return { a1: [x[0], x[1], x[2]], a2: [x[3], x[4], x[5]] };
  };

  const body: Partial<Body> = {};
  // sitOn reaches the floor with shin + 0.25 (a villager's sole under its ankle): a player's is `ankle` under it
  const shin = at('Leg_2_L') && at('Ankle_L') ? at('Leg_2_L')!.distanceTo(at('Ankle_L')!) : 1.6;
  body.shin = shin + ankle - 0.25;

  return {
    ownMaterials: true,
    rig: {
      alias: { Hand_L: 'Wrist_L', Hand_R: 'Wrist_R' },
      after
    },
    body,
    depth: torso.isEmpty() ? undefined : { back: Math.max(1, -torso.min.z), front: Math.max(1, torso.max.z) },
    cell: (part, i, face) => playerCell(part, i, face, rest),
    action(a: Action, u: number) {
      const res = villagerAction(a, u);
      if (a === 'sting') {
        sting ??= reachSting();
        if (sting) {
          const wob = Math.sin((u / 340) * Math.PI * 2);
          res.p.j.Arm_1_L = [sting.a1[0], sting.a1[1], sting.a1[2] + 0.04 * wob];
          res.p.j.Arm_2_L = sting.a2;
        }
      }
      if (a === 'cast') {
        const k = u / 620, back = k < 0.4 ? ease(k / 0.4) : 1 - ease((k - 0.4) / 0.3);
        const a1 = res.p.j.Arm_1_R;
        if (a1) res.p.j.Arm_1_R = [a1[0], a1[1] + 0.25 * back, a1[2] - 0.55 * back];
      }
      return res;
    },
    rebind: findExtra
  };
}
