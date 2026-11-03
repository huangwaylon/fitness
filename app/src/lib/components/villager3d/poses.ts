// NH's villagers in motion (villager3d): NH's files have no animation clips, so every motion is drawn here, on the
// skeleton, procedurally: small, bouncy, simple, as NH's are. Pure functions of time → a pose (joint rotations and the
// body's lift, squash and pitch); rig.ts puts a pose on the bones. Unit-tested.
//   Rotations are about the model's own axes at rest (y up, z the way it faces, x to its left), applied z, then y, then
//   x: +x pitches a part forward and down (a bow, a head's droop, a hanging leg or arm swung back), +y turns it to the
//   villager's left, +z rolls it toward its right. A child's rotation is in its parent's rest frame (the parent's turn
//   carries it): so a forearm bends about y (+y folds the right one forward, −y the left), as it would from NH's bind
//   pose, a T, whatever the upper arm does. The arms are lowered from the T by ARMS (each pose says how far).
//   Base states loop (idle, walk, sit, lie, nap, doze); actions play once over a base (hop, wave, high five, the
//   surprise, the sting's wobble) and hand back; a state change crossfades over FADE_MS.

type V3 = readonly [number, number, number];
export const JOINTS = [
  'Spine_1', 'Spine_2', 'Spine_3', 'Neck', 'Head', 'Clavicle_L', 'Clavicle_R', 'Arm_1_L', 'Arm_1_R', 'Arm_2_L', 'Arm_2_R', 'Hand_L', 'Hand_R',
  'Leg_1_L', 'Leg_1_R', 'Leg_2_L', 'Leg_2_R', 'Ankle_L', 'Ankle_R', 'TailRoot', 'Tail_1', 'Side_Ear_1_L', 'Side_Ear_1_R'
] as const;
export type Joint = (typeof JOINTS)[number];

export interface Pose {
  /** Joint → rotation (radians about the model's x, y, z at rest). A joint not named is at rest. */
  j: Partial<Record<Joint, V3>>;
  /** The body lifted (model units), squashed (1 none; under 1 squat and wider), pitched (radians: −π/2 lies it on its
   *  back, its head away from the camera). */
  y: number;
  sq: number;
  pitch: number;
}

/** A villager's measures (model units), from its bones at rest: the thigh's and the shin's length, the hips' height. */
export interface Body {
  thigh: number;
  shin: number;
  hip: number;
}

export type State = 'idle' | 'walk' | 'sit' | 'lie' | 'nap' | 'doze' | 'fish';
export type Action = 'hop' | 'wave' | 'highfive' | 'surprise' | 'sting' | 'cast' | 'tug' | 'reel' | 'warmup' | 'sidebend' | 'jump';
export const ACTION_MS: Record<Action, number> = {
  hop: 720, wave: 1700, highfive: 1000, surprise: 650, sting: 1400, cast: 620, tug: 420, reel: 700,
  // group stretching's three (island/stretching.ts POSE_MS each, a beat less: each hands over to the next)
  warmup: 1950, sidebend: 1950, jump: 1950
};
export const FADE_MS = 150;

/** The arms lowered from NH's T (radians about z): by the sides, a little out. */
const ARMS = 1.22;
/** A walk's cycle (two steps) covers this many model units: at the app's run (200 u/s, a villager 5.4 u a model unit)
 *  about 3.7 cycles a second, NH's quick little steps; at a wander (90 u/s), 1.7. */
export const STRIDE = 10;
const TAU = Math.PI * 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
/** A smooth, slow wander in −1 … 1 (two sines out of step: no randomness, so a frame is reproducible). */
const drift = (t: number, seed: number) => 0.6 * Math.sin(t * 0.00041 + seed * 1.7) + 0.4 * Math.sin(t * 0.00097 + seed * 4.1);

const rest = (): Pose => ({ j: {}, y: 0, sq: 1, pitch: 0 });
const arms = (p: Pose, down = ARMS, fwd = 0, elbow = 0) => {
  p.j.Arm_1_L = [fwd, 0, -down];
  p.j.Arm_1_R = [fwd, 0, down];
  if (elbow) {
    p.j.Arm_2_L = [0, -elbow, 0];
    p.j.Arm_2_R = [0, elbow, 0];
  }
  return p;
};
/** Breathing (a period of `ms`): the chest rises and the body barely swells. */
const breathe = (p: Pose, t: number, ms: number, k: number) => {
  const b = Math.sin((t / ms) * TAU);
  p.j.Spine_2 = add(p.j.Spine_2, [-0.03 * k * b, 0, 0]);
  p.sq *= 1 + 0.014 * k * b;
  return b;
};
const add = (a: V3 | undefined, b: V3): V3 => (a ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : b);

// ---- the base states -------------------------------------------------------------------------------------------------

/** Standing: breathing, the head looking about now and then, the tail and the arms barely moving. */
export function idle(t: number, seed = 0): Pose {
  const p = arms(rest());
  const b = breathe(p, t, 3200, 1);
  const look = drift(t, seed);
  p.j.Head = [0.06 * drift(t * 0.7, seed + 3), 0.42 * look * Math.abs(look), 0.04 * drift(t * 1.3, seed + 5)];
  p.j.Neck = [0, 0.12 * look, 0];
  p.j.Arm_1_L = add(p.j.Arm_1_L, [0, 0, 0.03 * b]);
  p.j.Arm_1_R = add(p.j.Arm_1_R, [0, 0, -0.03 * b]);
  p.j.TailRoot = [0, 0.25 * Math.sin(t / 700 + seed), 0];
  return p;
}

/** Walking or running at `speed` (u/s), `phase` the cycles walked (distance / STRIDE, so the feet never slide): legs
 *  and arms swinging opposite, the knee lifting on the swing, a bounce on each step, leaning into it. */
export function walk(t: number, phase: number, speed: number): Pose {
  const k = clamp01(speed / 200), a = 0.55 + 0.45 * k;
  const s = Math.sin(phase * TAU), c = Math.cos(phase * TAU);
  const p = arms(rest(), ARMS - 0.08 * k, 0, 0.25 + 0.25 * k);
  p.j.Leg_1_L = [-0.62 * a * s, 0, 0];
  p.j.Leg_1_R = [0.62 * a * s, 0, 0];
  // the knee bends while its leg swings forward (the left's hip moving forward while cos > 0)
  p.j.Leg_2_L = [0.85 * a * Math.max(0, c), 0, 0];
  p.j.Leg_2_R = [0.85 * a * Math.max(0, -c), 0, 0];
  p.j.Ankle_L = [-0.3 * a * Math.max(0, c), 0, 0];
  p.j.Ankle_R = [-0.3 * a * Math.max(0, -c), 0, 0];
  p.j.Arm_1_L = add(p.j.Arm_1_L, [0.55 * a * s, 0, 0]);
  p.j.Arm_1_R = add(p.j.Arm_1_R, [-0.55 * a * s, 0, 0]);
  // a bounce at each step's middle, a little squash as a foot lands; the body leans in and twists with the stride
  p.y = 0.34 * a * Math.abs(s);
  p.sq = 1 - 0.045 * a * (1 - Math.abs(s));
  p.j.Spine_1 = [0.1 + 0.1 * k, 0.1 * a * s, 0];
  p.j.Head = [-0.05 - 0.05 * k, -0.06 * a * s, 0.05 * a * s];
  p.j.TailRoot = [0, 0.35 * Math.sin(phase * TAU * 2), 0];
  p.j.Side_Ear_1_L = [0.18 * a * Math.abs(s), 0, 0];
  p.j.Side_Ear_1_R = [0.18 * a * Math.abs(s), 0, 0];
  void t;
  return p;
}

/** Sitting (a bench, a stool, a chair): thighs level, shins down, hands in the lap, the feet swinging a little. Its
 *  hips sink by its thigh's length, so its feet stay where they stood. */
export function sit(t: number, body: Body, seed = 0): Pose {
  const p = arms(rest(), ARMS + 0.12, -0.55, 0.7);
  breathe(p, t, 3400, 1);
  const kick = Math.sin(t / 520 + seed);
  p.j.Leg_1_L = [-1.5, 0, -0.06];
  p.j.Leg_1_R = [-1.5, 0, 0.06];
  p.j.Leg_2_L = [1.5 + 0.22 * kick, 0, 0];
  p.j.Leg_2_R = [1.5 - 0.22 * kick, 0, 0];
  p.j.Spine_1 = [-0.05, 0, 0];
  const look = drift(t, seed);
  p.j.Head = [0.05, 0.35 * look, 0.05 * drift(t * 1.2, seed + 2)];
  p.y = -body.thigh;
  return p;
}

/** Sitting on a seat `h` model units over the floor (its hips' joint that high, the caller's: villager3d sitAt), NH's:
 *  thighs forward, the hands in the lap, its back upright against the seat's back (`back`) or a little forward on a
 *  stool. A seat higher than its shins leaves its feet dangling (swinging a little); a lower one has its feet on the
 *  floor, the knees up as far as the seat is low (a cushion's: knees up, feet out). The hips are the group's origin:
 *  no lift here. */
export function sitOn(t: number, body: Body, h: number, back: boolean, seed = 0): Pose {
  const p = arms(rest(), ARMS + 0.12, -0.55, 0.7);
  breathe(p, t, 3400, 1);
  const reach = body.shin + 0.25;
  // the thigh raised above level by th (knees up) so that a shin hanging straight down just reaches the floor
  const th = h >= reach ? 0 : Math.min(1.05, Math.asin(Math.min(1, (reach - h) / Math.max(0.5, body.thigh))));
  const kick = h >= reach ? Math.sin(t / 520 + seed) * 0.22 : 0;
  // (a deep, low seat: the knees a little apart)
  const out = 0.06 + 0.25 * (th / 1.05);
  p.j.Leg_1_L = [-1.5 - th, 0, -out];
  p.j.Leg_1_R = [-1.5 - th, 0, out];
  // the knee: the shin straight down (more bent the higher the thigh), or dangling and swinging
  p.j.Leg_2_L = [1.5 + th + kick, 0, 0];
  p.j.Leg_2_R = [1.5 + th - kick, 0, 0];
  p.j.Ankle_L = [-0.15, 0, 0];
  p.j.Ankle_R = [-0.15, 0, 0];
  p.j.Spine_1 = [back ? -0.1 : 0.04, 0, 0];
  const look = drift(t, seed);
  p.j.Head = [0.05, 0.35 * look, 0.05 * drift(t * 1.2, seed + 2)];
  return p;
}

/** How high a sitting villager's seat is (model units) over its origin: its hips stay over the origin (they're the
 *  pivot), its knees come forward and its feet hang under them. */
export const seatOf = (b: Body): number => b.hip - b.thigh;

/** Lying on its back (a bed, the hammock): the body pitched flat, arms by its sides, legs straight; `lift` the
 *  surface's height under its back is the caller's. */
function lie(t: number, seed = 0): Pose {
  const p = arms(rest(), ARMS + 0.25);
  breathe(p, t, 3600, 1.2);
  p.pitch = -Math.PI / 2;
  p.j.Head = [-0.12, 0.25 * drift(t, seed), 0];
  p.j.Leg_1_L = [0, 0, -0.05];
  p.j.Leg_1_R = [0, 0, 0.05];
  return p;
}

/** Asleep lying down: slower, deeper breaths, the head rolled to one side. */
function nap(t: number, seed = 0): Pose {
  const p = arms(rest(), ARMS + 0.25);
  breathe(p, t, 5200, 2.2);
  p.pitch = -Math.PI / 2;
  p.j.Head = [-0.1, 0.5, 0.1];
  p.j.Arm_1_L = add(p.j.Arm_1_L, [-0.4, 0, 0.3]);
  void seed;
  return p;
}

/** Dozing on its feet (NH's villagers nodding off at night): the head drooping, slow deep breaths, a sway, and now
 *  and then the nod as it catches itself. */
function doze(t: number, seed = 0): Pose {
  const p = arms(rest(), ARMS + 0.06);
  const b = breathe(p, t, 4600, 2);
  const cyc = ((t + seed * 1000) % 7000) / 7000;
  // the droop deepens over the cycle and snaps back at its end (the nod)
  const nod = cyc < 0.92 ? ease(cyc / 0.92) : 1 - ease((cyc - 0.92) / 0.08);
  p.j.Head = [0.28 + 0.22 * nod + 0.03 * b, 0, 0.06 * Math.sin(t / 2300)];
  p.j.Spine_1 = [0.08 + 0.05 * nod, 0, 0.03 * Math.sin(t / 2300)];
  p.y = -0.05 * nod;
  return p;
}

/** The rod's arm forward while fishing (radians about x): its hand at the chest. */
const ROD_X = -1.05;
/** Fishing (NH's): standing at the water, the rod's hand forward at the chest, the other at its side, watching the
 *  float, the rod's tip bobbing a touch with the breath. */
function fish(t: number, seed = 0): Pose {
  const p = arms(rest());
  const b = breathe(p, t, 3000, 1);
  p.j.Arm_1_R = [ROD_X + 0.03 * b, 0.25, ARMS - 0.55];
  p.j.Arm_2_R = [0, 0.75, 0];
  p.j.Hand_R = [-0.2, 0, 0];
  p.j.Arm_1_L = [-0.15, 0, -ARMS];
  p.j.Head = [0.18, 0.04 * drift(t * 0.6, seed), 0];
  p.j.Spine_1 = [0.05, 0, 0];
  return p;
}

export function base(state: State, t: number, o: { phase: number; speed: number; body: Body; seed: number; seatH?: number; back?: boolean }): Pose {
  switch (state) {
    case 'fish': return fish(t, o.seed);
    case 'walk': return walk(t, o.phase, o.speed);
    case 'sit': return o.seatH !== undefined ? sitOn(t, o.body, o.seatH, !!o.back, o.seed) : sit(t, o.body, o.seed);
    case 'lie': return lie(t, o.seed);
    case 'nap': return nap(t, o.seed);
    case 'doze': return doze(t, o.seed);
    default: return idle(t, o.seed);
  }
}

// ---- the actions: once, over a base ----------------------------------------------------------------------------------

/** An action's pose `u` ms in, and how much of it shows (its envelope: in and out over FADE_MS). Joints it names
 *  replace the base's (by its weight); its lift adds, its squash multiplies. */
export function action(a: Action, u: number): { p: Pose; w: number } {
  const T = ACTION_MS[a], p = rest();
  const w = Math.min(ease(u / FADE_MS), ease((T - u) / FADE_MS));
  switch (a) {
    case 'hop': {
      // a squash to gather, up (stretched, legs tucked, arms flung up), a squash on landing, back
      const k = u / T;
      if (k < 0.17) p.sq = 1 - 0.2 * ease(k / 0.17);
      else if (k < 0.66) {
        const f = (k - 0.17) / 0.49;
        p.y = 3.4 * 4 * f * (1 - f);
        p.sq = 1.1 - 0.1 * Math.abs(2 * f - 1);
        arms(p, ARMS - 0.95 * Math.sin(f * Math.PI), 0, 0.3);
        p.j.Leg_1_L = [-0.45 * Math.sin(f * Math.PI), 0, 0];
        p.j.Leg_1_R = [-0.45 * Math.sin(f * Math.PI), 0, 0];
        p.j.Leg_2_L = [0.9 * Math.sin(f * Math.PI), 0, 0];
        p.j.Leg_2_R = [0.9 * Math.sin(f * Math.PI), 0, 0];
        p.j.Side_Ear_1_L = [-0.4 * Math.sin(f * Math.PI), 0, 0];
        p.j.Side_Ear_1_R = [-0.4 * Math.sin(f * Math.PI), 0, 0];
      } else {
        const f = (k - 0.66) / 0.34;
        p.sq = 1 - 0.18 * Math.sin(f * Math.PI);
      }
      return { p, w: 1 };
    }
    case 'wave': {
      // the right arm out to the side and forward (NH's villagers' heads are big: straight up, it would hide behind),
      // the forearm up, waving side to side three times
      const up = Math.min(ease(u / 220), ease((T - u) / 260));
      const wag = Math.sin((u / 260) * TAU) * up;
      p.j.Arm_1_R = [0, 0.3 * up, ARMS - (ARMS + 0.2) * up];
      p.j.Arm_2_R = [0, 0, -0.85 * up + 0.35 * wag];
      p.j.Hand_R = [0, 0, 0.3 * wag];
      p.j.Head = [0, -0.14 * up, 0.08 * up];
      p.j.Spine_1 = [0, 0, -0.05 * up + 0.03 * wag];
      return { p, w };
    }
    case 'highfive': {
      // up on its toes, the right arm up and out (straight up, NH's big head would hide it: its hand clears the head's
      // side), the slap at 45 % (a little hop), back
      const up = Math.min(ease(u / 160), ease((T - u) / 240));
      const slap = Math.exp(-(((u - 0.45 * T) / 70) ** 2));
      p.j.Arm_1_R = [0, 0.35 * up, ARMS - (ARMS + 0.45) * up];
      p.j.Arm_2_R = [0, 0, -0.45 * up + 0.25 * slap];
      p.j.Hand_R = [0.5 * slap, 0, 0];
      p.j.Spine_1 = [-0.12 * up + 0.08 * slap, 0, -0.06 * up];
      p.j.Head = [-0.18 * up, 0, 0];
      p.y = 0.25 * up + 0.7 * slap;
      p.sq = 1 + 0.05 * up - 0.08 * slap;
      return { p, w };
    }
    case 'surprise': {
      // a start: a little jump back, arms flung out, leaning back
      const k = u / T, jump = Math.sin(clamp01(k / 0.5) * Math.PI);
      arms(p, ARMS - 0.6 * jump, 0, 0.2);
      p.j.Spine_1 = [-0.22 * jump, 0, 0];
      p.j.Head = [-0.15 * jump, 0, 0];
      p.y = 1.2 * jump;
      p.sq = 1 + 0.08 * jump;
      return { p, w };
    }
    case 'cast': {
      // the cast (NH's): the rod's arm up and back over the shoulder, then the whip forward and out, the body with it
      const k = u / T, back = k < 0.4 ? ease(k / 0.4) : 1 - ease((k - 0.4) / 0.3), out = k < 0.4 ? 0 : Math.sin(clamp01((k - 0.4) / 0.6) * Math.PI);
      p.j.Arm_1_R = [ROD_X - 1.3 * back + 0.3 * out, 0.25, ARMS - 0.55];
      p.j.Arm_2_R = [0, 0.75 - 0.4 * back, 0];
      p.j.Spine_1 = [-0.12 * back + 0.12 * out, 0.12 * back, 0];
      p.j.Head = [0.1 * out, 0, 0];
      return { p, w };
    }
    case 'tug': {
      // the bite: the float goes under and the rod's tip is yanked down with it, a start
      const k = u / T, dip = Math.sin(clamp01(k / 0.35) * Math.PI) * (1 - k);
      p.j.Arm_1_R = [ROD_X + 0.45 * dip, 0.25, ARMS - 0.55];
      p.j.Arm_2_R = [0, 0.75, 0];
      p.j.Spine_1 = [0.12 * dip, 0, 0];
      p.j.Head = [0.22 + 0.1 * dip, 0, 0];
      return { p, w };
    }
    case 'reel': {
      // the reel: the rod pulled up and back, leaning back with it, then down again
      const k = u / T, up = Math.sin(clamp01(k / 0.75) * Math.PI);
      p.j.Arm_1_R = [ROD_X - 1.0 * up, 0.25, ARMS - 0.55];
      p.j.Arm_2_R = [0, 0.75 - 0.3 * up, 0];
      p.j.Spine_1 = [-0.18 * up, 0, 0];
      p.j.Head = [-0.12 * up, 0, 0];
      p.y = 0.3 * up;
      return { p, w };
    }
    case 'warmup': {
      // NH's Posture Warm-Up (group stretching): the arms swung up out to the sides and down again, twice, a little
      // bend of the knees at the bottom of each
      const s = 0.5 - 0.5 * Math.cos((u / T) * 2 * TAU);
      arms(p, ARMS - (ARMS + 0.55) * s, 0.15 * s, 0.1);
      p.j.Spine_1 = [-0.06 * s, 0, 0];
      p.j.Head = [-0.12 * s, 0, 0];
      p.sq = 1 - 0.06 * (1 - s);
      return { p, w };
    }
    case 'sidebend': {
      // NH's Side Bends: the arms up, the body bent to one side and the other, twice
      const up = Math.min(ease(u / 300), ease((T - u) / 300)), bend = Math.sin((u / T) * 2 * TAU) * up;
      arms(p, ARMS - (ARMS + 0.5) * up, 0.1 * up, 0.15);
      p.j.Spine_1 = [0, 0, 0.3 * bend];
      p.j.Spine_2 = [0, 0, 0.12 * bend];
      p.j.Head = [0, 0, 0.1 * bend];
      return { p, w };
    }
    case 'jump': {
      // NH's Jump: two hops on the spot, the arms flung out and up at the top of each
      const k = ((u / T) * 2) % 1;
      if (k < 0.2) p.sq = 1 - 0.16 * ease(k / 0.2);
      else if (k < 0.72) {
        const f = (k - 0.2) / 0.52;
        p.y = 3 * 4 * f * (1 - f);
        p.sq = 1.08 - 0.08 * Math.abs(2 * f - 1);
        arms(p, ARMS - 1.5 * Math.sin(f * Math.PI), 0, 0.2);
        p.j.Leg_1_L = [-0.35 * Math.sin(f * Math.PI), 0, -0.12 * Math.sin(f * Math.PI)];
        p.j.Leg_1_R = [-0.35 * Math.sin(f * Math.PI), 0, 0.12 * Math.sin(f * Math.PI)];
      } else p.sq = 1 - 0.14 * Math.sin(((k - 0.72) / 0.28) * Math.PI);
      return { p, w };
    }
    case 'sting': {
      // stung: a dizzy wobble, a hand to the swollen eye
      const wob = Math.sin((u / 340) * TAU);
      p.j.Spine_1 = [0.05, 0, 0.12 * wob];
      p.j.Head = [0.08, 0, -0.18 * wob];
      p.j.Arm_1_L = [0, -0.5, 0.3];
      p.j.Arm_2_L = [0, 0, 1.0];
      return { p, w };
    }
  }
}

// ---- blending --------------------------------------------------------------------------------------------------------

/** a → b by k (0 … 1): each joint's rotation, the lift, the squash and the pitch. */
export function mix(a: Pose, b: Pose, k: number): Pose {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const j: Pose['j'] = {};
  for (const n of new Set([...Object.keys(a.j), ...Object.keys(b.j)]) as Set<Joint>) {
    const x = a.j[n] ?? [0, 0, 0], y = b.j[n] ?? [0, 0, 0];
    j[n] = [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k];
  }
  return { j, y: a.y + (b.y - a.y) * k, sq: a.sq + (b.sq - a.sq) * k, pitch: a.pitch + (b.pitch - a.pitch) * k };
}

/** An action over a base by its weight: the joints it names replace the base's, its lift adds, its squash multiplies. */
export function over(b: Pose, a: Pose, w: number): Pose {
  if (w <= 0) return b;
  const j = { ...b.j };
  for (const n of Object.keys(a.j) as Joint[]) {
    const x = b.j[n] ?? [0, 0, 0], y = a.j[n]!;
    j[n] = [x[0] + (y[0] - x[0]) * w, x[1] + (y[1] - x[1]) * w, x[2] + (y[2] - x[2]) * w];
  }
  return { j, y: b.y + a.y * w, sq: b.sq * (1 + (a.sq - 1) * w), pitch: b.pitch };
}
