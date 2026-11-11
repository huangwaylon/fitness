// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The villager pose system (src/lib/components/villager3d: poses.ts → rig.ts) on an NH *player* (render/player.js's
// loadPlayer). The same maths as rig.ts (a pose's model-space rotation turned into each bone's own frame, after its
// rest rotation), plus what the player's skeleton needs that a villager's doesn't (src/lib/components/player3d/tune.ts, its port):
//   - ALIAS: the hands. A player's hand mesh is skinned to Wrist_L/R, not Hand_L/R (Hand_* is a bare tip joint, NH's
//     item socket). A pose's Hand_* rotation goes on Wrist_*, so the hand visibly bends and the tool (on Hand_*,
//     Wrist's child) follows it.
//   - The skirt and hem driver: NH swings a skirt's chains (Skirt_{1,2,3}_{L,R}{F,C,B}, under Waist, weighted to nothing
//     on the legs) with its cloth physics; with nothing driving them, a thigh raised to sit goes straight through the
//     skirt. Here each chain follows its side's thigh: the front most, the side half, the back a little; the chain's
//     last joint bends back by as much so the cloth past the knee hangs. The tops' hem (Skirt_1_* only) the same, less.
//   - The ponytail (Hair_1 → Hair_2, a hairstyle's own joints): NH's spring. Here it hangs toward gravity a part of the
//     way as the head and body tip, and rolls aside lying on its back (else it goes into the pillow).
//   - Player measures (Body): rig.ts's thigh/shin/hip from the bones, plus the ankle's height over the sole, which the
//     villager formula (sitOn's shin + 0.25) doesn't know: the player's sole sits ~0.55 under its ankle joint.
import * as THREE from 'three';
import { JOINTS } from '/v3d/poses.ts';

export const ALIAS = { Hand_L: 'Wrist_L', Hand_R: 'Wrist_R' };
const CHAINS = ['LF', 'LC', 'LB', 'RF', 'RC', 'RB'];
/** How much of its thigh's pitch each skirt chain takes (front, centre/side, back), and its hem's. */
export const SKIRT = { F: 0.95, C: 0.55, B: 0.12, hem: 0.55, spread: 0.8 };

const e = new THREE.Euler(0, 0, 0, 'XYZ'), r = new THREE.Quaternion(), d = new THREE.Quaternion();

/** p: loadPlayer's result, at rest (before any pose). tune: { skirt?: Partial<SKIRT>, hair?: number, alias?: false } */
export function playerRig(p, tune = {}) {
  const root = p.body;
  root.updateMatrixWorld(true);
  const rootQ = root.getWorldQuaternion(new THREE.Quaternion()).invert();
  const rootM = root.matrixWorld.clone().invert();
  const J = (bone) => {
    const w = rootQ.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    return { bone, rest: bone.quaternion.clone(), w, wi: w.clone().invert() };
  };
  const alias = tune.alias === false ? {} : ALIAS;
  const js = {};
  for (const n of JOINTS) {
    const b = p.bones.get(alias[n] ?? n);
    if (b) js[n] = J(b);
  }
  // the cloth and the hair: whatever of them this outfit has
  const extra = {};
  for (const c of CHAINS) for (const k of [1, 2, 3]) {
    const b = p.bones.get(`Skirt_${k}_${c}`);
    if (b) extra[`Skirt_${k}_${c}`] = J(b);
  }
  for (const n of ['Hair_1', 'Hair_2']) { const b = p.bones.get(n); if (b) extra[n] = J(b); }
  // a chain is a long skirt's if it has a second joint; the hem's (a top's) is Skirt_1 only
  const longSkirt = !!extra.Skirt_2_LF;
  const sk = { ...SKIRT, ...(tune.skirt ?? {}) };

  const at = (n) => { const b = p.bones.get(n); return b ? new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(rootM) : null; };
  const len = (a, b, dflt) => { const pa = at(a), pb = at(b); return pa && pb ? pa.distanceTo(pb) : dflt; };
  const restBox = new THREE.Box3().setFromObject(root);
  // the torso's depth (what's under the neck: the body without its head), the head's being three times it
  const neckY = at('Neck')?.y ?? 8.5, tb = new THREE.Box3(), v = new THREE.Vector3();
  for (const r0 of p.out) {
    const m = r0.mesh;
    if (!m.isSkinnedMesh || !m.visible || !['mSkin', 'top', 'bottom'].includes(r0.slot)) continue;
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 2) {
      v.fromBufferAttribute(pos, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld).applyMatrix4(rootM);
      if (v.y < neckY - 0.3) tb.expandByPoint(v);
    }
  }
  const body = {
    thigh: len('Leg_1_L', 'Leg_2_L', 1.6), shin: len('Leg_2_L', 'Ankle_L', 1.4), hip: at('Leg_1_L')?.y ?? 3.4,
    ankle: at('Ankle_L')?.y ?? 0.3, tall: restBox.max.y, back: Math.max(1, -restBox.min.z), front: Math.max(1, restBox.max.z),
    torsoBack: -tb.min.z, torsoFront: tb.max.z, neck: neckY
  };
  // poses.ts sitOn reaches the floor with `shin + 0.25` (a villager's sole ~0.25 under its ankle); a player's is
  // `ankle` (0.79) under it: the shin it's handed is lengthened by the difference, else on a low seat the feet sink
  // ~0.5 into the floor (the real length stays as shinLen)
  body.shinLen = body.shin;
  if (tune.seatReach !== false) body.shin = body.shinLen + body.ankle - 0.25;
  const set = (j, v) => {
    if (!v || (v[0] === 0 && v[1] === 0 && v[2] === 0)) { j.bone.quaternion.copy(j.rest); return; }
    r.setFromEuler(e.set(v[0], v[1], v[2]));
    d.copy(j.wi).multiply(r).multiply(j.w);
    j.bone.quaternion.copy(j.rest).multiply(d);
  };
  // the head as an ellipsoid in the Head bone's frame (the skin over the neck), for the hands' clearance
  const headB = p.bones.get('Head'), hb = new THREE.Box3();
  if (headB) {
    const inv = headB.matrixWorld.clone().invert();
    for (const r0 of p.out) {
      const m = r0.mesh;
      if (!m.isSkinnedMesh || r0.slot !== 'mSkin') continue;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld);
        if (v.clone().applyMatrix4(rootM).y > neckY + 0.6) hb.expandByPoint(v.applyMatrix4(inv));
      }
    }
  }
  const headC = hb.getCenter(new THREE.Vector3()), headR = hb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  // the eyes' patch, in the head bone's frame and the model's (the sting's lump, a reach's target)
  const eyeMesh = p.out.find((r0) => r0.slot === 'mEye')?.mesh, eyeBoxM = new THREE.Box3();
  let eyeToHead = null;
  if (eyeMesh) {
    const pos = eyeMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); eyeMesh.applyBoneTransform(i, v); eyeBoxM.expandByPoint(v.applyMatrix4(eyeMesh.matrixWorld).applyMatrix4(rootM)); }
    // a point of the body's frame at rest → the head bone's (for what rides the head: the sting's lump)
    const m = headB.matrixWorld.clone().invert().multiply(root.matrixWorld);
    eyeToHead = (pt) => pt.clone().applyMatrix4(m);
  }
  body.headR = headR.toArray().map((x) => +x.toFixed(2));
  /** How far inside the head a hand is (< 1: inside; the hand's ball ~0.75 around its middle). */
  const hw = new THREE.Vector3(), ht = new THREE.Vector3();
  const inside = (side) => {
    const w = p.bones.get(`Wrist_${side}`), h = p.bones.get(`Hand_${side}`);
    if (!w || !h || !headB) return 9;
    w.getWorldPosition(hw); h.getWorldPosition(ht);
    hw.lerp(ht, 0.5);
    headB.worldToLocal(hw).sub(headC);
    const m = 0.75 + (tune.handMargin ?? 0.15);
    return Math.hypot(hw.x / (headR.x + m), hw.y / (headR.y + m), hw.z / (headR.z + m));
  };
  const list = Object.entries(js);
  /** A hand's middle (model space) as posed now. */
  const handAt = (side, out) => {
    p.bones.get(`Wrist_${side}`).getWorldPosition(hw); p.bones.get(`Hand_${side}`).getWorldPosition(ht);
    // (the body's own frame as it is now: the actor may have been moved since)
    return out.copy(hw.lerp(ht, 0.5)).applyMatrix4(root.matrixWorld.clone().invert());
  };
  /** A numeric reach (coordinate descent on the arm's pose angles, from `init`, the rest of the pose at rest): the
   *  Arm_1 and Arm_2 rotations that bring the hand's middle nearest `target` (model space, at rest). Cached by key. */
  const reached = new Map();
  const reach = (side, target, init, key) => {
    if (key && reached.has(key)) return reached.get(key);
    const a1 = js[`Arm_1_${side}`], a2 = js[`Arm_2_${side}`];
    const x = [...init.a1, ...init.a2];
    const hand = new THREE.Vector3();
    const err = () => {
      set(a1, x.slice(0, 3)); set(a2, x.slice(3, 6)); a1.bone.updateMatrixWorld(true);
      return handAt(side, hand).distanceTo(target);
    };
    for (const [n, j] of list) j.bone.quaternion.copy(j.rest);
    root.updateMatrixWorld(true);
    let e0 = err();
    for (let step = 0.3; step > 0.004; step *= 0.6) {
      for (let it = 0; it < 6; it++) for (let i = 0; i < 6; i++) for (const d of [step, -step]) {
        x[i] += d; const e1 = err();
        if (e1 < e0) e0 = e1; else x[i] -= d;
      }
    }
    err();
    const r = { a1: x.slice(0, 3), a2: x.slice(3, 6), miss: e0 };
    if (key) reached.set(key, r);
    return r;
  };
  const hairK = tune.hair ?? 0.6;
  // lying, the head's tipped so it, not the body, isn't what the body rests on: on its back the chin tucks (the head
  // propped on the pillow, NH's), on its front the chin lifts
  const lieTuck = tune.lieTuck ?? [0.45, 0.2], proneLift = tune.proneLift ?? [-0.45, -0.25];
  // face down, the head turned onto its cheek (a player's head is 4x its chest's depth: face-first it props the body
  // up at a slant), the turn's side the prone pose's own
  const proneTurn = tune.proneTurn ?? 1.15;
  return {
    body, joints: list.length, longSkirt, eyeBox: eyeBoxM, eyeToHead, reach, handAt,
    bone: (n) => js[n]?.bone ?? p.bones.get(n) ?? null,
    /** pose: poses.ts's; ctx: { pitch } the body's (lying) so the hair can flop aside. */
    apply(pose, ctx = {}) {
      const pitch = ctx.pitch ?? pose.pitch ?? 0;
      if (pitch < -0.5 || pitch > 0.5) {
        const [h, nk] = pitch < 0 ? lieTuck : proneLift, k = Math.min(1, (Math.abs(pitch) - 0.5) / 1.0);
        const hd = pose.j.Head ?? [0, 0, 0], nn = pose.j.Neck ?? [0, 0, 0];
        const turn = pitch > 0 ? proneTurn * k * Math.sign(hd[1] || 1) : 0;
        pose = { ...pose, j: { ...pose.j, Head: [hd[0] + h * k, hd[1] + turn, hd[2]], Neck: [nn[0] + nk * k, nn[1], nn[2]] } };
      }
      // a low seat (sitOn's thighs raised past level): the hands in the lap ride up onto the knees, else the knees
      // come up through the forearms (the player's longer thighs)
      const th = Math.max(0, -((pose.j.Leg_1_L ?? [0])[0]) - 1.5);
      if (th > 0.02 && tune.kneeHands !== false) {
        const a1L = pose.j.Arm_1_L ?? [0, 0, 0], a1R = pose.j.Arm_1_R ?? [0, 0, 0];
        pose = { ...pose, j: { ...pose.j, Arm_1_L: [a1L[0] - 0.85 * th, a1L[1], a1L[2]], Arm_1_R: [a1R[0] - 0.85 * th, a1R[1], a1R[2]] } };
      }
      for (const [n, j] of list) set(j, pose.j[n]);
      // the hands kept out of the head (a player's arms are long enough to reach into it: the wave's fist, a blend
      // passing through the face): the upper arm swung out about the forward axis till the hand clears it (the hand
      // moves out sideways, the gesture kept), then, if that's not enough, the elbow unbent
      if (tune.headClear !== false && headB) {
        root.updateMatrixWorld(true);
        for (const side of ['L', 'R']) {
          const a1 = js[`Arm_1_${side}`], a2 = js[`Arm_2_${side}`], v1 = pose.j[`Arm_1_${side}`] ?? [0, 0, 0], v2 = pose.j[`Arm_2_${side}`] ?? [0, 0, 0];
          if (!a1 || !a2 || inside(side) >= 1) continue;
          const out = side === 'L' ? -1 : 1;
          let d = 0;
          while (d < 0.9 && inside(side) < 1) { d += 0.06; set(a1, [v1[0], v1[1], v1[2] + out * d]); a1.bone.updateMatrixWorld(true); }
          let k = 1;
          while (k > 0.2 && inside(side) < 1) { k -= 0.08; set(a2, [v2[0] * k, v2[1] * k, v2[2] * k]); a2.bone.updateMatrixWorld(true); }
        }
      }
      // the skirt: each chain after its side's thigh (x: its pitch, − forward; z: out to the side)
      for (const c of CHAINS) {
        const s1 = extra[`Skirt_1_${c}`];
        if (!s1) continue;
        const side = c[0], pos = c[1];
        const leg = pose.j[`Leg_1_${side}`] ?? [0, 0, 0];
        const fwd = Math.min(0, leg[0]), back = Math.max(0, leg[0]);
        // the front follows a thigh forward fully, the back one swung back; the side chains half of either
        const kf = pos === 'F' ? sk.F : pos === 'C' ? sk.C : sk.B;
        const kb = pos === 'B' ? sk.F * 0.6 : pos === 'C' ? sk.C * 0.5 : sk.B;
        const pitch = (kf * fwd + kb * back) * (longSkirt ? 1 : sk.hem);
        set(s1, [pitch, 0, leg[2] * sk.spread * (pos === 'C' ? 1 : 0.6)]);
        const s3 = extra[`Skirt_3_${c}`];
        // past the knee the cloth hangs: the last joint takes the pitch back (a lap's: forward only)
        if (s3) set(s3, [-0.92 * kf * fwd, 0, 0]);
        const s2 = extra[`Skirt_2_${c}`];
        if (s2) set(s2, [0, 0, 0]);
      }
      // the ponytail: toward gravity, a part of the way, as the head and body pitch; aside lying down
      const h1 = extra.Hair_1;
      if (h1) {
        const head = pose.j.Head ?? [0, 0, 0], sp = pose.j.Spine_1 ?? [0, 0, 0];
        const lying = pitch < -0.5;
        set(h1, lying ? [0, 0, 1.1 * Math.sign(head[1] || 1)] : [-hairK * (head[0] + sp[0]), 0, -hairK * (head[2] + sp[2])]);
      }
    }
  };
}

/** NH's villager faces (faces.ts FACES, BLINK: villager eye cells 0-15, mouth cells 0-8) → the player's eye frames
 *  (PlayerEyeNN/mEye_Alb.0-15) and mouth frames (PlayerMouthNN/mMouth_Alb.0-8), the same expression read off the
 *  player's textures (player3d/tune.ts PLAYER_EYE / PLAYER_MOUTH; the frames are the same expressions for every PlayerEyeNN and PlayerMouthNN).
 *    player eyes:   0 open · 1 half shut (drowsy) · 2 shut, soft (asleep, the blink) · 3 cross (brows in) · 4 worried
 *                   5 happy shut (^ ^) · 6 shocked (white, "0 0") · 7 squeezed shut (> <) · 8 open, pupils small
 *                   9 flat half-lidded · 10 open, pupils big · 11 half-lidded side glance · 12 wide, pupils small
 *                   13 squint · 14 open, glossy (looking up) · 15 half-lidded, tired
 *    player mouths: 0 closed smile · 1 open smile · 2 big open grin · 3 frown · 4 open wavy frown (upset)
 *                   5 open "ah" · 6 small flat line · 7 small "o" · 8 open "o" */
export const PLAYER_EYE = { 0: 0, 3: 13, 8: 4, 9: 5, 10: 6, 11: 7, 14: 2, 15: 3 };
export const PLAYER_MOUTH = { 0: 0, 1: 7, 2: 8, 3: 3, 5: 5, 6: 4, 7: 1, 8: 2 };
/** The player's [eye, mouth] frames for a villager face's cells. The villager's resting mouth (0) is the player's own
 *  chosen mouth frame (`rest`: B's look is an open smile, .1), except asleep (a closed smile). A negative mouth is a
 *  player frame given directly (−1 − frame: the talk cycle's). */
export const playerFace = (eye, mouth, rest = 0, face = '') =>
  [PLAYER_EYE[eye] ?? eye, mouth < 0 ? -1 - mouth : mouth === 0 ? (face === 'sleepy' ? 0 : rest) : PLAYER_MOUTH[mouth] ?? mouth];

/** Player-specific action overrides over poses.ts's action(a, u) (same envelope): what a villager's proportions get
 *  away with and a player's don't (player3d/tune.ts).
 *   sting: the villager's hand-to-eye can't reach on a player (shoulder to eye ~4.8 u, the arm 4.1): the left hand
 *          to the left cheek just under the eye instead (a numeric reach, once), the wobble kept.
 *   cast:  the wind-up's rod hand comes up in front of a player's face (the rod across the glasses): the arm swung
 *          out to the side as it goes up, so the hand passes beside the head. */
export function playerAction(rig, action, a, u) {
  const r = action(a, u);
  if (a === 'sting' && rig.reach) {
    const eb = rig.eyeBox, w = eb.max.x - eb.min.x;
    const target = new THREE.Vector3(eb.max.x - 0.15 * w, eb.min.y - 1.5, eb.max.z + 0.5);
    const k = rig.reach('L', target, { a1: [0, -0.5, 0.3], a2: [0, 0, 1.0] }, 'sting-L');
    const wob = Math.sin((u / 340) * Math.PI * 2);
    r.p.j.Arm_1_L = [k.a1[0], k.a1[1], k.a1[2] + 0.04 * wob];
    r.p.j.Arm_2_L = k.a2;
  }
  if (a === 'cast') {
    const k = u / 620, back = k < 0.4 ? ease(k / 0.4) : 1 - ease((k - 0.4) / 0.3);
    const v = r.p.j.Arm_1_R;
    if (v) r.p.j.Arm_1_R = [v[0], v[1] + 0.25 * back, v[2] - 0.55 * back];
  }
  return r;
}
const ease = (v) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
