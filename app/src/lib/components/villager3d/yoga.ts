// The yoga mat's flows (poses.ts base 'yoga'; docs/design.md "The gym"): four sequences of held poses, each pose a
// keyframe eased into the next, held for a few breaths, the sides mirrored. Which flow is on is the loop's clock's and
// the yogi's seed's (villager3d/loopClock.ts: the relay's), so both phones show the same pose. Pure.
//   The poses are drawn for NH's proportions (a big head on a short body: a villager's, a player's): the folds stop
//   short of the head reaching the mat, the plank and the dog put the hands on the mat by the arm's reach (Body arm/sh).
//   The body faces its mat's front (+z) for the poses seen best from the front (the tree, warrior II and its family)
//   and turns along the mat (yaw ±π/2) for the ones lying along it (the sun salutation, warrior I, the dancer, the
//   floor's): the room's mats are long across the anchor's facing.
//   A standing pose's feet: where a step changes where a foot stands, that leg steps (lifted, one leg after the other)
//   while the other stays put (stepping()).
import { clamp01 } from '#lib/math.ts';
import { ARMS, add, armOf, breathe, mix, rest, shoulderOf, type Body, type Joint, type Pose, type V3 } from './poses-kit.ts';

/** The poses (asanas) the flows are made of. A sided one is drawn for its right side (the right leg forward, bent or
 *  lifted) and mirrored for the left. */
export type Asana =
  | 'mountain' | 'raised' | 'fold' | 'halflift' | 'plank' | 'updog' | 'dog' | 'lunge'
  | 'warrior1' | 'warrior2' | 'reverse' | 'triangle' | 'sideangle'
  | 'tree' | 'dancer'
  | 'squat' | 'staff' | 'seatedfold' | 'boat' | 'supine' | 'bridge' | 'kneel' | 'child' | 'savasana';
const SIDED: ReadonlySet<Asana> = new Set(['lunge', 'warrior1', 'warrior2', 'reverse', 'triangle', 'sideangle', 'tree', 'dancer']);
/** Stood on the feet (a change of stance there is stepped). */
const STANDING: ReadonlySet<Asana> = new Set(['mountain', 'raised', 'fold', 'halflift', 'warrior1', 'warrior2', 'reverse', 'triangle', 'sideangle', 'tree', 'dancer']);

/** A flow's step: the pose (its side: 1 right, −1 left), which way the body faces (yaw), held `hold` ms, then `move` ms
 *  into the next step. */
export interface Step {
  a: Asana;
  side?: 1 | -1;
  yaw?: number;
  hold: number;
  move: number;
}
export type FlowName = 'sun' | 'standing' | 'balance' | 'floor';

const Q = Math.PI / 2;
// (one breath ~4.8 s: a hold of a few breaths; a key pose of the flow 2-3 breaths, a pose passed through one)
const B = 4800;
const s = (a: Asana, hold: number, move: number, side?: 1 | -1, yaw?: number): Step => ({ a, hold, move, ...(side ? { side } : {}), ...(yaw ? { yaw } : {}) });

/** A sun salutation, facing along the mat (+x), each round stepping forward on a side. */
const sunRound = (side: 1 | -1): Step[] => [
  s('mountain', 1400, 1300, undefined, Q),
  s('raised', 1600, 1400, undefined, Q),
  s('fold', 2200, 1100, undefined, Q),
  s('halflift', 1300, 1300, undefined, Q),
  s('plank', 2000, 1500, undefined, Q),
  s('updog', 2200, 1600, undefined, Q),
  s('dog', 2 * B, 1500, undefined, Q),
  s('lunge', 2000, 1400, side, Q),
  s('fold', 1600, 1500, undefined, Q),
  s('raised', 1200, 1300, undefined, Q)
];
/** Warrior I facing along the mat (its front foot's way), then opening to the front: warrior II, the reverse warrior,
 *  the triangle, the extended side angle, on one side. */
const standingSide = (side: 1 | -1): Step[] => [
  s('warrior1', B, 1600, side, -Q * side),
  s('warrior2', B, 1500, side),
  s('reverse', 1.4 * B, 1500, side),
  s('triangle', B, 1600, side),
  s('sideangle', B, 1500, side),
  s('mountain', 1500, 1500)
];

export const FLOWS: Readonly<Record<FlowName, readonly Step[]>> = {
  sun: [s('mountain', 1200, 1300), ...sunRound(1), ...sunRound(-1), s('mountain', 1500, 1400, undefined, Q)],
  standing: [s('mountain', 1500, 1600), ...standingSide(1), ...standingSide(-1)],
  balance: [
    s('mountain', 1500, 1700), s('tree', 1.5 * B, 1700, 1), s('mountain', 1200, 1700), s('tree', 1.5 * B, 1700, -1),
    s('mountain', 1200, 1300), s('mountain', 600, 1700, undefined, Q), s('dancer', 1.2 * B, 1700, 1, Q), s('mountain', 900, 1300, undefined, Q),
    s('mountain', 600, 1700, undefined, -Q), s('dancer', 1.2 * B, 1700, -1, -Q), s('mountain', 900, 1300, undefined, -Q)
  ],
  // facing along the mat the other way (−x): sat down, the legs out along it, lain back the other way
  floor: [
    s('mountain', 1200, 1300), s('mountain', 500, 1500, undefined, -Q), s('squat', 600, 1500, undefined, -Q), s('staff', 1500, 1700, undefined, -Q),
    s('seatedfold', 2 * B, 1700, undefined, -Q), s('staff', 900, 1600, undefined, -Q), s('boat', 1.4 * B, 1600, undefined, -Q),
    s('staff', 500, 1700, undefined, -Q), s('supine', 900, 1600, undefined, -Q), s('bridge', 1.4 * B, 1700, undefined, -Q),
    s('supine', 700, 1700, undefined, -Q), s('staff', 500, 1600, undefined, -Q), s('kneel', 700, 1700, undefined, -Q),
    s('child', 2 * B, 1700, undefined, -Q), s('kneel', 600, 1700, undefined, -Q), s('staff', 500, 1700, undefined, -Q),
    s('savasana', 3 * B, 2000, undefined, -Q), s('staff', 800, 1600, undefined, -Q), s('squat', 600, 1600, undefined, -Q),
    s('mountain', 900, 1500, undefined, -Q)
  ]
};
export const FLOW_NAMES = Object.keys(FLOWS) as FlowName[];
/** A flow's length (ms), its steps' holds and moves. */
export const flowMs = (f: FlowName): number => FLOWS[f].reduce((a, st) => a + st.hold + st.move, 0);
/** All four, one after another (each starts and ends standing at the mat's middle, facing its front). */
export const YOGA_MS = FLOW_NAMES.reduce((a, f) => a + flowMs(f), 0);

/** Which flow is on at `t` (the loop's clock, ms) for a yogi of `seed`, and how far into it (ms): the four in turn, each
 *  round of them starting one further on, and each yogi starting from its own (two on two mats rarely do the same). */
export function flowAt(t: number, seed = 0): { flow: FlowName; u: number; round: number } {
  const round = Math.floor(t / YOGA_MS);
  let u = t - round * YOGA_MS;
  const first = (((Math.floor(Math.abs(seed) * 10) + round) % 4) + 4) % 4;
  for (let i = 0; i < 4; i++) {
    const flow = FLOW_NAMES[(first + i) % 4], ms = flowMs(flow);
    if (u < ms || i === 3) return { flow, u: Math.min(u, ms), round };
    u -= ms;
  }
  throw new Error('unreachable');
}

/** When each of a flow's steps' holds is half done, at or after `from` (loop ms) for `seed`: the key poses' times (the
 *  e2e's shots, the tests). */
export function keyTimes(flow: FlowName, seed = 0, from = 0): { a: Asana; side?: 1 | -1; t: number }[] {
  for (let r = Math.floor(from / YOGA_MS); ; r++) {
    // the flow's start in round r
    let t0 = r * YOGA_MS;
    const first = (((Math.floor(Math.abs(seed) * 10) + r) % 4) + 4) % 4;
    for (let i = 0; i < 4 && FLOW_NAMES[(first + i) % 4] !== flow; i++) t0 += flowMs(FLOW_NAMES[(first + i) % 4]);
    if (t0 < from) continue;
    const out: { a: Asana; side?: 1 | -1; t: number }[] = [];
    for (const st of FLOWS[flow]) {
      out.push({ a: st.a, ...(st.side ? { side: st.side } : {}), t: t0 + st.hold / 2 });
      t0 += st.hold + st.move;
    }
    return out;
  }
}

// ---- the poses ---------------------------------------------------------------------------------------------------

type M = number[];
const mul = (a: M, b: M): M => {
  const o = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return o;
};
const axis = (ax: 'x' | 'y' | 'z', a: number): M => {
  const c = Math.cos(a), sn = Math.sin(a);
  if (ax === 'x') return [1, 0, 0, 0, c, -sn, 0, sn, c];
  if (ax === 'y') return [c, 0, sn, 0, 1, 0, -sn, 0, c];
  return [c, -sn, 0, sn, c, 0, 0, 0, 1];
};
/** Turns about the model's axes, in the order given (the first turns first), as the rig's rotation (x, y, z: three's
 *  'XYZ' Euler, Rx·Ry·Rz): a leg turned out then raised to the side, which the rig's order can't say directly. */
export function turns(...rs: ['x' | 'y' | 'z', number][]): V3 {
  let m: M = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (const [ax, a] of rs) m = mul(axis(ax, a), m);
  const y = Math.asin(Math.max(-1, Math.min(1, m[2])));
  return Math.abs(m[2]) < 0.9999999 ? [Math.atan2(-m[5], m[8]), y, Math.atan2(-m[1], m[0])] : [Math.atan2(m[7], m[4]), y, 0];
}

/** A pose mirrored left for right (the joints' sides swapped, their turns about y and z reversed). */
export function mirror(p: Pose): Pose {
  const o: Pose = { j: {}, y: p.y, sq: p.sq, pitch: p.pitch, ...(p.yaw ? { yaw: -p.yaw } : {}) };
  for (const [n, v] of Object.entries(p.j) as [Joint, V3][]) {
    const m = (n.endsWith('_L') ? n.slice(0, -2) + '_R' : n.endsWith('_R') ? n.slice(0, -2) + '_L' : n) as Joint;
    o.j[m] = [v[0], -v[1], -v[2]];
  }
  return o;
}

/** The hips' drop (model units, negative) with a thigh `a` off upright and its shin `b` (both forward +): the foot
 *  still on the floor. */
const dropOf = (body: Body, a: number, b: number) => body.thigh * Math.cos(a) + body.shin * Math.cos(b) - body.thigh - body.shin;
/** How far off upright a straight leg must lean to reach the floor with the hips dropped `d` (≤ 0). */
const leanFor = (body: Body, d: number) => Math.acos(clamp01(1 + d / (body.thigh + body.shin)));
/** Sat on the floor: the hips' joint this far over it (the seat's depth under the hips). */
const seatDrop = (body: Body) => -body.hip + 0.32 * body.hip;
/** The torso bent forward by `a` in all (over the three spine joints). */
const bend = (p: Pose, a: number, side = 0) => {
  p.j.Spine_1 = [0.55 * a, 0, 0.55 * side];
  p.j.Spine_2 = [0.27 * a, 0, 0.27 * side];
  p.j.Spine_3 = [0.18 * a, 0, 0.18 * side];
};
/** The arms (both) as one turn each: L's, R's mirrored. */
const arm2 = (p: Pose, l: V3, elbow = 0) => {
  p.j.Arm_1_L = l;
  p.j.Arm_1_R = [l[0], -l[1], -l[2]];
  if (elbow) {
    p.j.Arm_2_L = [0, -elbow, 0];
    p.j.Arm_2_R = [0, elbow, 0];
  }
};
/** Hanging by the sides (the torso's frame), a little out, forward by `fwd`. */
const down = (fwd = 0): V3 => [-fwd, 0, -(ARMS + 0.2)];
/** The right leg forward (thigh `a` forward of upright, the shin `b`), the knee bent between. */
const legR = (p: Pose, a: number, b: number, out = 0.05) => {
  p.j.Leg_1_R = [-a, 0, out];
  p.j.Leg_2_R = [a + b > 0 ? Math.max(0, a - b) : 0, 0, 0];
};
/** Warrior II's legs (the right knee bent over its foot out to the right, `bendA` the thigh off upright; the left leg
 *  straight out to the left): the hips' drop. The right leg turned out 90° so the knee bends out along the mat. */
function wideLegs(p: Pose, body: Body, bendA: number): number {
  const d = dropOf(body, bendA, 0);
  const back = leanFor(body, d);
  p.j.Leg_1_R = turns(['x', -bendA], ['y', -Q * 0.92]);
  p.j.Leg_2_R = [bendA, 0, 0];
  p.j.Ankle_R = [0, 0, 0];
  p.j.Leg_1_L = turns(['y', 0.35], ['z', -back]);
  p.j.Ankle_L = [0, 0, back * 0.9];
  p.y = d;
  return d;
}

/** A pose held still (its breath added by the flow), for its right side; `body` the yogi's. */
export function asana(a: Asana, body: Body): Pose {
  const p = rest();
  const T = body.thigh, sh = shoulderOf(body), reach = armOf(body);
  switch (a) {
    case 'mountain':
      arm2(p, down(0.05));
      p.j.Leg_1_L = [0, 0, 0.02];
      p.j.Leg_1_R = [0, 0, -0.02];
      break;
    case 'raised':
      // the arms up overhead, a small lift of the chest, looking up at the hands
      // (a wide V: a big head between the hands)
      arm2(p, [0.15, 0, 0.95]);
      p.j.Spine_1 = [-0.12, 0, 0];
      p.j.Spine_2 = [-0.06, 0, 0];
      p.j.Head = [-0.3, 0, 0];
      break;
    case 'fold': {
      // folded forward over the legs (the knees soft), the arms hanging to the mat, the head heavy
      const f = 1.45;
      bend(p, f);
      arm2(p, down(f - 0.1));
      p.j.Leg_2_L = [0.15, 0, 0];
      p.j.Leg_2_R = [0.15, 0, 0];
      p.j.Leg_1_L = [-0.08, 0, 0];
      p.j.Leg_1_R = [-0.08, 0, 0];
      p.j.Head = [0.2, 0, 0];
      p.y = dropOf(body, 0.08, 0.07);
      break;
    }
    case 'halflift': {
      // the back flat, level, the hands on the shins, looking ahead
      const f = 1.25;
      bend(p, f);
      arm2(p, down(f - 0.45));
      p.j.Head = [-0.75, 0, 0];
      break;
    }
    case 'plank': {
      // straight from the heels to the head, on the hands under the shoulders (a little ahead): leant as far as the
      // arm's reach lets the hands meet the mat
      const th = 1.12, ahead = Math.acos(clamp01((sh * Math.cos(th)) / reach));
      p.pitch = th;
      arm2(p, [-(th + ahead), 0, -(ARMS + 0.3)]);
      p.j.Head = [-0.3, 0, 0];
      p.j.Ankle_L = [-(th - 0.25), 0, 0];
      p.j.Ankle_R = [-(th - 0.25), 0, 0];
      break;
    }
    case 'updog': {
      // the hips low, the legs long behind, the chest lifted up between straight arms, looking up
      const th = 1.38, arch = 1.1;
      p.pitch = th;
      p.y = 0.12 * body.hip;
      bend(p, -arch);
      const tilt = th - arch;
      arm2(p, [-tilt - 0.15, 0, -(ARMS + 0.3)]);
      p.j.Head = [-0.45, 0, 0];
      p.j.Ankle_L = [0.6, 0, 0];
      p.j.Ankle_R = [0.6, 0, 0];
      break;
    }
    case 'dog': {
      // the inverted V: the legs straight and tall from the heels to the hips, the torso tipped from them down toward
      // the mat, the straight arms reaching on down to the hands on it well ahead of the feet; the head lifted off the
      // mat between the arms (a big head: in line with the back it went through the mat)
      const th = 0.35, f = 1.4;
      p.pitch = th;
      bend(p, f);
      // (the arms overhead in the torso's frame, tipped down past its line to the mat: + toward the belly)
      arm2(p, [0.55, 0, 1.3]);
      p.j.Head = [-0.7, 0, 0];
      p.j.Ankle_L = [-th, 0, 0];
      p.j.Ankle_R = [-th, 0, 0];
      break;
    }
    case 'lunge': {
      // stepped forward: the right foot between the hands, the knee over it, the left leg long behind on its toes
      const a = 1.25, d = dropOf(body, a, 0.15);
      legR(p, a, 0.15);
      const back = Math.min(1.2, leanFor(body, d) + 0.2);
      p.j.Leg_1_L = [back, 0, -0.03];
      p.j.Leg_2_L = [0.35, 0, 0];
      p.j.Ankle_L = [-0.3, 0, 0];
      p.y = d;
      bend(p, 1.0);
      arm2(p, down(0.95), 0);
      p.j.Head = [-0.35, 0, 0];
      break;
    }
    case 'warrior1': {
      // the right knee bent forward over its foot, the left leg long behind (its heel down), the arms high overhead
      const a = 0.95, d = dropOf(body, a, 0.05);
      legR(p, a, 0.05);
      p.j.Ankle_R = [-0.05, 0, 0];
      const back = leanFor(body, d);
      p.j.Leg_1_L = turns(['y', 0.5], ['x', back]);
      p.j.Ankle_L = [-back * 0.85, 0, 0];
      p.y = d;
      arm2(p, [-0.1, 0, 1.05]);
      p.j.Spine_1 = [-0.12, 0, 0];
      p.j.Head = [-0.25, 0, 0];
      break;
    }
    case 'warrior2':
      // the feet wide along the mat, the right knee bent over its foot, the arms out level along the legs, looking
      // over the right hand
      wideLegs(p, body, 1.05);
      arm2(p, [0, 0, 0.02]);
      p.j.Head = [0.05, -1.0, 0];
      break;
    case 'reverse':
      // warrior II's legs, leaning back over the left leg: the right arm up and over, the left hand down the left leg
      wideLegs(p, body, 1.0);
      bend(p, -0.1, -0.5);
      p.j.Arm_1_R = [0, 0, -1.45];
      p.j.Arm_1_L = [0.1, 0, -1.2];
      p.j.Head = [-0.35, -0.2, 0];
      break;
    case 'triangle': {
      // both legs straight and wide, the torso tipped over the right leg till level: one line of the arms from the
      // right hand at the shin to the left up at the sky, looking up at it
      const back = 0.5;
      p.j.Leg_1_R = turns(['y', -Q * 0.9], ['x', -back]);
      p.j.Leg_1_L = turns(['y', 0.35], ['z', -back]);
      p.j.Ankle_L = [0, 0, back * 0.9];
      p.y = dropOf(body, back, back);
      bend(p, 0.15, 1.35);
      arm2(p, [0, 0, 0]);
      p.j.Head = [0, 0.75, 0.2];
      break;
    }
    case 'sideangle':
      // warrior II's legs, the torso down over the right thigh, the right hand to the mat inside the foot, the left
      // arm long over the ear: one line from the left foot to the left hand
      wideLegs(p, body, 1.1);
      bend(p, 0.15, 1.0);
      p.j.Arm_1_L = [-0.15, 0, 1.15];
      p.j.Arm_1_R = [0, 0, -0.35];
      p.j.Head = [0, 0.6, 0.1];
      break;
    case 'tree':
      // on the left leg, the right foot up against the inner left knee (the thigh out level to the side), the arms up
      // and out like branches
      p.j.Leg_1_R = turns(['x', -1.5], ['y', -Q]);
      p.j.Leg_2_R = [2.4, 0, 0];
      p.j.Ankle_R = [0.4, 0, 0];
      p.j.Leg_1_L = [0, 0, 0.04];
      // (a wide V up and out: overhead, short arms hid behind a big head and a player's long ones went into it)
      arm2(p, [0.1, 0, 0.75]);
      p.j.Head = [-0.05, 0, 0];
      p.j.Spine_1 = [-0.03, 0, -0.04];
      break;
    case 'dancer':
      // on the left leg, the right foot caught behind in the right hand and kicked up, leaning forward, the left arm
      // reaching ahead and up
      p.j.Leg_1_R = [1.45, 0, 0.1];
      p.j.Leg_2_R = [1.6, 0, 0];
      p.j.Ankle_R = [0.6, 0, 0];
      p.j.Leg_1_L = [-0.05, 0, 0.02];
      bend(p, 1.05);
      p.j.Arm_1_R = [1.6, 0, ARMS + 0.1];
      p.j.Arm_2_R = [0, 0.2, 0];
      p.j.Arm_1_L = [-2.9, 0, -(ARMS - 0.1)];
      p.j.Head = [-0.8, 0, 0];
      break;
    case 'squat':
      // a deep squat on the way down to the mat (and up), the arms forward for balance
      squatDeep(p, body);
      arm2(p, down(1.3), 0.3);
      bend(p, 0.35);
      break;
    case 'staff':
      // sat tall, the legs straight out ahead, the hands on the mat by the hips
      seated(p, body);
      arm2(p, down(0.05));
      break;
    case 'seatedfold':
      // sat, folded forward over the straight legs, the hands reaching to the feet, the head toward the knees
      seated(p, body);
      bend(p, 1.05);
      arm2(p, down(1.95));
      p.j.Head = [0.25, 0, 0];
      break;
    case 'boat':
      // balanced on the seat in a V: the legs up together, the shins level, leaning back, the arms out straight along
      // the legs
      p.y = seatDrop(body);
      p.j.Leg_1_L = [-2.35, 0, -0.04];
      p.j.Leg_1_R = [-2.35, 0, 0.04];
      p.j.Leg_2_L = [0.55, 0, 0];
      p.j.Leg_2_R = [0.55, 0, 0];
      p.j.Ankle_L = [0.3, 0, 0];
      p.j.Ankle_R = [0.3, 0, 0];
      bend(p, -0.62);
      arm2(p, down(0.95));
      p.j.Head = [0.25, 0, 0];
      break;
    case 'supine':
      // lying on the back, the knees up, the feet flat on the mat, the arms along the sides
      lying(p, body);
      kneesUp(p, body, 0);
      break;
    case 'bridge':
      // lying on the shoulders, the hips lifted high, the knees over the feet, the arms flat on the mat
      lying(p, body);
      kneesUp(p, body, 0.95 * T);
      break;
    case 'kneel':
      // kneeling, sat back on the heels, upright, the hands on the thighs
      kneeling(p, body);
      arm2(p, down(0.6), 0.35);
      break;
    case 'child':
      // kneeling, sat back on the heels and folded right down over the knees, the arms long ahead along the mat
      kneeling(p, body);
      p.j.Leg_1_L = add(p.j.Leg_1_L, [0, 0, -0.18]);
      p.j.Leg_1_R = add(p.j.Leg_1_R, [0, 0, 0.18]);
      bend(p, 1.75);
      arm2(p, [0.25, 0, 1.3]);
      p.j.Head = [0.35, 0, 0];
      break;
    case 'savasana':
      // lying flat, the legs long and fallen a little open, the arms out from the sides, palms up, still
      lying(p, body);
      p.j.Leg_1_L = [-Q, 0, -0.12];
      p.j.Leg_1_R = [-Q, 0, 0.12];
      p.j.Ankle_L = [0.4, 0.3, 0];
      p.j.Ankle_R = [0.4, -0.3, 0];
      arm2(p, [-Q + 0.15, 0, -(ARMS - 0.15)]);
      break;
  }
  return p;
}
function squatDeep(p: Pose, body: Body) {
  const a = 1.6;
  p.j.Leg_1_L = [-a, 0, -0.35];
  p.j.Leg_1_R = [-a, 0, 0.35];
  p.j.Leg_2_L = [a + 0.75, 0, 0];
  p.j.Leg_2_R = [a + 0.75, 0, 0];
  p.j.Ankle_L = [-0.75, 0, 0];
  p.j.Ankle_R = [-0.75, 0, 0];
  p.y = dropOf(body, a, 0.75) * 0.95;
}
function seated(p: Pose, body: Body) {
  p.y = seatDrop(body);
  p.j.Leg_1_L = [-Q, 0, -0.03];
  p.j.Leg_1_R = [-Q, 0, 0.03];
  p.j.Ankle_L = [-0.2, 0, 0];
  p.j.Ankle_R = [-0.2, 0, 0];
}
/** Lain back from sitting (the hips where they sat: the torso down behind them). */
function lying(p: Pose, body: Body) {
  p.y = seatDrop(body) - 0.05 * body.hip;
  bend(p, -Q);
  arm2(p, down(-0.05));
  p.j.Head = [0.15, 0, 0];
}
/** Lying, the knees up and the feet on the mat by the hips, the hips lifted `lift` (the bridge's). */
function kneesUp(p: Pose, body: Body, lift: number) {
  const T = body.thigh, S = body.shin, hp = body.hip + p.y + lift, ankle = body.hip - T - S;
  // the shin straight down from the knee, the knee as high as the foot needs
  const c = Math.max(-1, Math.min(1, (hp - S - ankle) / T)), a = Math.acos(c);
  p.j.Leg_1_L = [-a, 0, -0.08];
  p.j.Leg_1_R = [-a, 0, 0.08];
  p.j.Leg_2_L = [a, 0, 0];
  p.j.Leg_2_R = [a, 0, 0];
  p.y += lift;
  if (lift > 0) {
    // the torso from the shoulders on the mat up to the hips
    const D = shoulderOf(body) - body.hip, up = Math.asin(clamp01(lift / Math.max(1, D)));
    bend(p, -(Q - up));
    arm2(p, down(-0.05 - up));
  }
}
function kneeling(p: Pose, body: Body) {
  p.j.Leg_1_L = [-1.5, 0, -0.06];
  p.j.Leg_1_R = [-1.5, 0, 0.06];
  p.j.Leg_2_L = [2.85, 0, 0];
  p.j.Leg_2_R = [2.85, 0, 0];
  p.j.Ankle_L = [0.9, 0, 0];
  p.j.Ankle_R = [0.9, 0, 0];
  // the hips on the heels: the knee on the mat, the thigh level
  p.y = -(body.hip - 0.55 * body.shin) + 0.35 * body.shin;
}

/** A step's pose, its side's (mirrored for the left) and its facing. */
function stepPose(st: Step, body: Body): Pose {
  const p = asana(st.a, body);
  const q = st.side === -1 && SIDED.has(st.a) ? mirror(p) : p;
  if (st.yaw) q.yaw = st.yaw;
  return q;
}

/** Where a foot (its ankle) is, on the floor's plane (x, z), by the hips' and the leg's turns, the body's yaw and pitch:
 *  the steps' check of a foot that moves. */
export function footAt(p: Pose, body: Body, side: 'L' | 'R'): [number, number, number] {
  const hw = 0.22 * body.hip * (side === 'L' ? 1 : -1);
  const r1 = p.j[`Leg_1_${side}`] ?? [0, 0, 0], r2 = p.j[`Leg_2_${side}`] ?? [0, 0, 0];
  const m1 = mul(mul(axis('x', r1[0]), axis('y', r1[1])), axis('z', r1[2]));
  const m2 = mul(m1, mul(mul(axis('x', r2[0]), axis('y', r2[1])), axis('z', r2[2])));
  const ap = (m: M, v: number[]) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  const k = ap(m1, [0, -body.thigh, 0]), a = ap(m2, [0, -body.shin, 0]);
  let v = [hw + k[0] + a[0], body.hip + p.y + k[1] + a[1], k[2] + a[2]];
  v = ap(mul(axis('y', p.yaw ?? 0), axis('x', p.pitch)), [v[0], v[1] - p.y, v[2]]);
  return [v[0], v[1] + p.y, v[2]];
}

const LEGS = { L: ['Leg_1_L', 'Leg_2_L', 'Ankle_L'], R: ['Leg_1_R', 'Leg_2_R', 'Ankle_R'] } as const;
/** Smoother than smooth01 (its speed and acceleration both 0 at either end): a move eases out of one pose into the next. */
const ease = (k: number): number => {
  const x = clamp01(k);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** From step a's pose to b's by u (0 … 1). Standing to standing, a foot that has to move to another place steps there:
 *  lifted off the mat and set down, in its own part of the move (both: one, then the other), while the other leg stays. */
function stepping(A: Pose, B: Pose, a: Step, b: Step, body: Body, u: number, out: Pose): Pose {
  const e = ease(u);
  const p = mix(A, B, e, out);
  if (!STANDING.has(a.a) || !STANDING.has(b.a)) return p;
  const moved = (['L', 'R'] as const).filter((sd) => {
    const fa = footAt(A, body, sd), fb = footAt(B, body, sd);
    return Math.hypot(fa[0] - fb[0], fa[2] - fb[2]) > 0.3 * body.thigh;
  });
  if (!moved.length) return p;
  if (p === A || p === B) return p;
  moved.forEach((sd, i) => {
    // (one leg: the whole move; two: the first in 0 … 0.6, the second in 0.4 … 1)
    const [s0, s1] = moved.length === 1 ? [0, 1] : i === 0 ? [0, 0.6] : [0.4, 1];
    const ku = clamp01((u - s0) / (s1 - s0)), kl = ease(ku), lift = 0.45 * Math.sin(Math.PI * ku);
    for (const n of LEGS[sd]) {
      const x = A.j[n] ?? [0, 0, 0], y = B.j[n] ?? [0, 0, 0];
      p.j[n] = [x[0] + (y[0] - x[0]) * kl, x[1] + (y[1] - x[1]) * kl, x[2] + (y[2] - x[2]) * kl];
    }
    const j1 = p.j[LEGS[sd][0]]!, j2 = p.j[LEGS[sd][1]]!;
    p.j[LEGS[sd][0]] = [j1[0] - lift, j1[1], j1[2]];
    p.j[LEGS[sd][1]] = [j2[0] + 2 * lift, j2[1], j2[2]];
  });
  return p;
}

/** The yoga mat at `t` (the loop's clock): the flow's pose, held (breathing) or easing into the next. `out`: a buffer. */
export function yoga(t: number, body: Body, seed = 0): Pose {
  const { flow, u } = flowAt(t, seed);
  const steps = FLOWS[flow];
  let at = u, i = 0;
  while (i < steps.length - 1 && at >= steps[i].hold + steps[i].move) at -= steps[i].hold + steps[i].move, i++;
  const st = steps[i], A = stepPose(st, body);
  let p: Pose;
  if (at <= st.hold) p = A;
  else {
    // into the next step (the last: into the next flow's first, mountain facing the front, as each starts)
    const nx = steps[i + 1] ?? FLOWS[FLOW_NAMES[0]][0];
    p = stepping(A, stepPose(nx, body), st, nx, body, (at - st.hold) / st.move, { j: {}, y: 0, sq: 1, pitch: 0 });
  }
  if (p === A) p = { ...A, j: { ...A.j } };
  // a slow breath all through (the chest rising, the arms barely lifting with it)
  const b = breathe(p, t, B, 1.3);
  for (const n of ['Arm_1_L', 'Arm_1_R'] as const) if (p.j[n]) p.j[n] = add(p.j[n], [0, 0, (n === 'Arm_1_L' ? 0.025 : -0.025) * b]);
  return p;
}
