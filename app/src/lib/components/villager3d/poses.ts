// NH's villagers in motion (villager3d): NH's files have no animation clips, so every motion is drawn here, on the
// skeleton, procedurally: small, bouncy, simple, as NH's are. Pure functions of time → a pose (joint rotations and the
// body's lift, squash and pitch); rig.ts puts a pose on the bones. Unit-tested.
//   Rotations are about the model's own axes at rest (y up, z the way it faces, x to its left), applied z, then y, then
//   x: +x pitches a part forward and down (a bow, a head's droop, a hanging leg or arm swung back), +y turns it to the
//   villager's left, +z rolls it toward its right. A child's rotation is in its parent's rest frame (the parent's turn
//   carries it): so a forearm bends about y (+y folds the right one forward, −y the left), as it would from NH's bind
//   pose, a T, whatever the upper arm does. The arms are lowered from the T by ARMS (each pose says how far).
//   Base states loop (idle, walk, sit, lie, nap, doze, prone); actions play once over a base (hop, wave, high five, the
//   surprise, the sting's wobble, a sleeper's twitch) and hand back; a state change crossfades over FADE_MS.
import { clamp01, smooth01 } from '#lib/math.ts';
import { ARMS, TAU, add, arms, breathe, cyc, drift, rest, sitOn, squat, type BaseOpts, type Body, type Pose, type UseDef } from './poses-kit.ts';
import { STAND_USES } from './poses-stand.ts';
import { RIDE_USES } from './poses-ride.ts';
import { YOGA_MS, yoga } from './yoga.ts';

export { JOINTS, mix, over, poseBuf, seatOf, sitOn, type Body, type Joint, type Pose } from './poses-kit.ts';

export type State = 'idle' | 'walk' | 'sit' | 'lie' | 'nap' | 'doze' | 'fish' | 'prone' | GymUse;
/** A piece's use (villager3d/seats3d.ts Use), each a base state looped while it's on its piece: the gym's six NH
 *  lets one use, and ours (the curl, the kettlebell's swing, the yoga mat's flows, the Ring-Con's squats, the climbing
 *  wall, a bath's soak, the toilet stall's sit). */
type CoreUse = 'press' | 'pedal' | 'run' | 'punch' | 'bounce' | 'pullup' | 'curl' | 'swing' | 'yoga' | 'ring' | 'climb' | 'soak' | 'stall';
/** The uses kept in their own registries (a UseDef each): the ones stood at (poses-stand.ts: a stove's cooking, a desk's
 *  typing …) and the ones ridden or sat in (poses-ride.ts). */
export const MORE_USES: Readonly<Record<string, UseDef>> = { ...STAND_USES, ...RIDE_USES };
export type GymUse = CoreUse | keyof typeof STAND_USES | keyof typeof RIDE_USES;
const CORE: readonly CoreUse[] = ['press', 'pedal', 'run', 'punch', 'bounce', 'pullup', 'curl', 'swing', 'yoga', 'ring', 'climb', 'soak', 'stall'];
export const GYM_USES: readonly GymUse[] = [...CORE, ...(Object.keys(MORE_USES) as GymUse[])];
export const isGym = (s: State): s is GymUse => (GYM_USES as readonly string[]).includes(s);
export type Action = 'hop' | 'wave' | 'highfive' | 'surprise' | 'sting' | 'cast' | 'tug' | 'reel' | 'warmup' | 'sidebend' | 'jump' | 'twitch';
export const ACTION_MS: Record<Action, number> = {
  hop: 720, wave: 1700, highfive: 1000, surprise: 650, sting: 1400, cast: 620, tug: 420, reel: 700, twitch: 460,
  // group stretching's three (island/stretching.ts POSE_MS each, a beat less: each hands over to the next)
  warmup: 1950, sidebend: 1950, jump: 1950
};
export const FADE_MS = 150;

/** A walk's cycle (two steps) covers this many model units up to 200 u/s (a villager 5.4 u a model unit): at 200 about
 *  3.7 cycles a second, NH's quick little steps; at a wander (90 u/s), 1.7. */
export const STRIDE = 10;
/** Faster than 200 u/s a step reaches further, by the speed's square root, and the legs swing as much wider (walk's
 *  `a`), so the feet still don't slide: the run (walkGraph.ts SPEED.run, 300 u/s) 22% longer steps at 4.5 cycles a
 *  second, not a frantic 5.6. */
export const reachOf = (speed: number): number => Math.sqrt(Math.max(1, speed / 200));
/** A cycle's length (model units) at `speed` (u/s). */
export const strideOf = (speed: number): number => STRIDE * reachOf(speed);

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

/** Walking or running at `speed` (u/s), `phase` the cycles walked (distance / strideOf, so the feet never slide): legs
 *  and arms swinging opposite, the knee lifting on the swing, a bounce on each step, leaning into it. */
export function walk(t: number, phase: number, speed: number): Pose {
  const k = clamp01(speed / 200), a = (0.55 + 0.45 * k) * reachOf(speed);
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

/** Asleep face down on the ground (Gulliver washed up on the beach, NH): flat on its front, the arms limp out by its
 *  sides, the legs straight, the head turned a little to one side, slow snoring breaths. */
function prone(t: number, seed = 0): Pose {
  const p = arms(rest(), ARMS * 0.55);
  breathe(p, t, 4000, 2.4);
  p.pitch = Math.PI / 2;
  p.j.Head = [0.05, 0.18 + 0.03 * Math.sin(t / 2600 + seed), 0];
  p.j.Leg_1_L = [0, 0, -0.08];
  p.j.Leg_1_R = [0, 0, 0.08];
  p.j.Ankle_L = [0.5, 0, 0];
  p.j.Ankle_R = [0.5, 0, 0];
  return p;
}

/** Dozing on its feet (NH's villagers nodding off at night): the head drooping, slow deep breaths, a sway, and now
 *  and then the nod as it catches itself. */
function doze(t: number, seed = 0): Pose {
  const p = arms(rest(), ARMS + 0.06);
  const b = breathe(p, t, 4600, 2);
  const cyc = ((t + seed * 1000) % 7000) / 7000;
  // the droop deepens over the cycle and snaps back at its end (the nod)
  const nod = cyc < 0.92 ? smooth01(cyc / 0.92) : 1 - smooth01((cyc - 0.92) / 0.08);
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

// ---- the gym (seats3d.ts Use: its piece's anchor places it; NH's use, looped while it's on it) ---------------------

/** One rep's length (ms) of each. */
export const REP_MS: Record<GymUse, number> = {
  ...(Object.fromEntries(Object.entries(MORE_USES).map(([k, d]) => [k, d.ms])) as Record<Exclude<GymUse, CoreUse>, number>),
  press: 1800, pedal: 760, run: 330, punch: 1100, bounce: 900, pullup: 4200, curl: 2200, swing: 1400, ring: 2600, soak: 3400, stall: 3400,
  // (the yoga's four flows one after another: yoga.ts; the climbing wall's round, up and down: whole reach-and-steps,
  // MOVE_MS)
  yoga: YOGA_MS, climb: 18 * 1300
};

/** Lying on the weight bench pressing the bar: the arms from the chest (elbows out, bent) straight up and down again,
 *  the knees bent over the bench's end, feet on the ground. */
function press(t: number, seed = 0): Pose {
  const p = lie(t, seed);
  // 0 at the chest, 1 locked out: up quicker than down
  const k = cyc(t, REP_MS.press, seed), up = k < 0.4 ? smooth01(k / 0.4) : k < 0.55 ? 1 : 1 - smooth01((k - 0.55) / 0.45);
  // (lying, the body's forward is up: the arms forward point at the sky)
  const fwd = -0.75 - 0.8 * up, down = ARMS * (0.45 + 0.45 * up), elbow = 1.35 * (1 - up);
  p.j.Arm_1_L = [fwd, 0, -down];
  p.j.Arm_1_R = [fwd, 0, down];
  p.j.Arm_2_L = [0, -elbow, 0];
  p.j.Arm_2_R = [0, elbow, 0];
  p.j.Leg_1_L = [-0.5, 0, -0.12];
  p.j.Leg_1_R = [-0.5, 0, 0.12];
  p.j.Leg_2_L = [1.1, 0, 0];
  p.j.Leg_2_R = [1.1, 0, 0];
  p.j.Head = [-0.2 + 0.08 * up, 0, 0];
  return p;
}

/** On the exercise bike's saddle (sitOn's legs), pedalling: each thigh rising and falling half a turn from the other,
 *  the knee folding with it, leaning in to the handlebars, the hands on them. */
function pedal(t: number, body: Body, h: number, seed = 0): Pose {
  const p = sitOn(t, body, h, false, seed);
  const a = cyc(t, REP_MS.pedal) * TAU, sL = Math.sin(a), cL = Math.cos(a);
  p.j.Leg_1_L = [-1.15 + 0.38 * sL, 0, -0.08];
  p.j.Leg_1_R = [-1.15 - 0.38 * sL, 0, 0.08];
  p.j.Leg_2_L = [1.25 + 0.4 * cL, 0, 0];
  p.j.Leg_2_R = [1.25 - 0.4 * cL, 0, 0];
  p.j.Ankle_L = [-0.2, 0, 0];
  p.j.Ankle_R = [-0.2, 0, 0];
  p.j.Arm_1_L = [-1.25, 0, -(ARMS - 0.25)];
  p.j.Arm_1_R = [-1.25, 0, ARMS - 0.25];
  p.j.Arm_2_L = [0, -0.35, 0];
  p.j.Arm_2_R = [0, 0.35, 0];
  p.j.Spine_1 = [0.24, 0, 0.04 * sL];
  p.j.Head = [-0.12, 0, 0];
  p.y += 0.06 * Math.abs(sL);
  return p;
}

/** Running in place on the treadmill's belt: the run's own stride (walk at a run's speed), the belt carrying the feet
 *  back under it. */
function run(t: number): Pose {
  return walk(t, t / (REP_MS.run * 2), 300);
}

/** At the punching bag: the guard up (the fists by the chin), a jab with one hand then the other, the body turning into
 *  each and bobbing on its toes. */
function punch(t: number, seed = 0): Pose {
  const p = arms(rest(), ARMS - 0.15, -1.0, 1.4);
  breathe(p, t, 1800, 1);
  const k = cyc(t, REP_MS.punch, seed), half = k < 0.5 ? 0 : 1, u = (k % 0.5) / 0.5;
  // out fast, back slower
  const hit = u < 0.18 ? smooth01(u / 0.18) : u < 0.45 ? 1 - smooth01((u - 0.18) / 0.27) : 0;
  const L = half ? 0 : hit, R = half ? hit : 0;
  p.j.Arm_1_L = [-1.0 - 0.6 * L, 0, -(ARMS - 0.15) + 0.2 * L];
  p.j.Arm_1_R = [-1.0 - 0.6 * R, 0, ARMS - 0.15 - 0.2 * R];
  p.j.Arm_2_L = [0, -1.4 * (1 - L) - 0.1, 0];
  p.j.Arm_2_R = [0, 1.4 * (1 - R) + 0.1, 0];
  p.j.Spine_1 = [0.12, 0.22 * (R - L), 0];
  p.j.Head = [0.06, -0.1 * (R - L), 0];
  p.j.Leg_1_L = [-0.18, 0, -0.08];
  p.j.Leg_1_R = [0.12, 0, 0.08];
  p.y = 0.12 * Math.abs(Math.sin(k * TAU * 2));
  return p;
}

/** Bouncing on the exercise ball: seated on its top, a little hop up and the squash back down, the arms out for
 *  balance, the feet on the floor all through (BOUNCE_FEET): the knees bend as the hips rise, and a ball higher than the
 *  shins (a player's short legs on the island's 7.6) has the thighs sloping down to them, not the feet dangling. */
/** The ball's thigh off level (radians, + up) for hips `h` over the floor: the shin straight down from the knee to
 *  the floor (sitOn's reach), the thigh up when the seat's low, down when it's high. */
export function bounceThigh(body: Body, h: number): number {
  const k = (body.shin + 0.25 - h) / Math.max(0.5, body.thigh);
  return Math.max(-1.1, Math.min(1.05, Math.asin(Math.max(-1, Math.min(1, k)))));
}
function bounce(t: number, body: Body, h: number, seed = 0): Pose {
  const p = sitOn(t, body, h, false, seed);
  const b = Math.abs(Math.sin(cyc(t, REP_MS.bounce * 2) * TAU));
  p.y += 0.55 * b;
  p.sq *= 1 - 0.05 * (1 - b);
  const th = bounceThigh(body, h + 0.55 * b);
  p.j.Leg_1_L = [-1.5 - th, 0, -0.14];
  p.j.Leg_1_R = [-1.5 - th, 0, 0.14];
  p.j.Leg_2_L = [1.5 + th, 0, 0];
  p.j.Leg_2_R = [1.5 + th, 0, 0];
  p.j.Arm_1_L = [-0.35, 0, -(ARMS - 0.55)];
  p.j.Arm_1_R = [-0.35, 0, ARMS - 0.55];
  p.j.Head = [-0.05 * b, 0, 0];
  return p;
}

/** At the pull-up bar (the island's old rhythm, Island3D's pullLift: two pull-ups, a rest): its hands up and forward on
 *  the bar, pulled up by the arms' bend, the legs hanging and tucking a little at the top. */
function pullup(t: number, seed = 0): Pose {
  const p = rest();
  const k = cyc(t, REP_MS.pullup, seed);
  const step = (a: number, b: number, c: number, d: number) => (k < a || k > d ? 0 : k < b ? smooth01((k - a) / (b - a)) : k <= c ? 1 : 1 - smooth01((k - c) / (d - c)));
  const up = Math.max(step(0, 0.08, 0.16, 0.24), step(0.32, 0.4, 0.48, 0.56));
  // (out wide, up and forward to the bar's ends beside its head; the elbows bend as it pulls)
  p.j.Arm_1_L = [-2.0 + 0.3 * up, 0, -0.6 + 0.3 * up];
  p.j.Arm_1_R = [-2.0 + 0.3 * up, 0, 0.6 - 0.3 * up];
  p.j.Arm_2_L = [0, -0.9 * up, 0];
  p.j.Arm_2_R = [0, 0.9 * up, 0];
  p.j.Leg_2_L = [0.45 * up, 0, 0];
  p.j.Leg_2_R = [0.45 * up, 0, 0];
  p.j.Head = [-0.15, 0, 0];
  // (its chin over the bar at the top: 16u, in model units at the villagers' 5.4u)
  p.y = 3 * up;
  breathe(p, t, 2600, 0.6);
  return p;
}

// ---- ours: a held prop's lifts, the mat's yoga, the climbing wall, the bath, the stall --------------------------------


/** A curl (the barbell's, the dumbbell's), standing: the arms down holding it at the thighs, the elbows folding it up to
 *  the shoulders and lowering it slower, a little lean back at the top. The prop rides the hands (benchBar.ts). */
function curl(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 2400, 0.8);
  const k = cyc(t, REP_MS.curl, seed), up = k < 0.35 ? smooth01(k / 0.35) : k < 0.45 ? 1 : 1 - smooth01((k - 0.45) / 0.55);
  // (forward a touch as it comes up, the elbows by the sides)
  p.j.Arm_1_L = [-0.2 - 0.25 * up, 0, -(ARMS + 0.22)];
  p.j.Arm_1_R = [-0.2 - 0.25 * up, 0, ARMS + 0.22];
  p.j.Arm_2_L = [0, -0.15 - 1.95 * up, 0];
  p.j.Arm_2_R = [0, 0.15 + 1.95 * up, 0];
  p.j.Spine_1 = [0.04 - 0.08 * up, 0, 0];
  p.j.Head = [0.08 - 0.05 * up, 0, 0];
  p.j.Leg_1_L = [0, 0, -0.1];
  p.j.Leg_1_R = [0, 0, 0.1];
  return p;
}

/** The kettlebell's swing (a rep REP_MS.swing): feet wider than the hips, two hands on the handle. From the bottom
 *  (hinged at the hips ~55°, the knees soft, the forearms against the inner thighs, the bell hiked back between the
 *  legs) the hips snap through, the torso comes upright and the straight arms float the bell up to the chest; a beat
 *  there, it falls, the arms come down first and the hips hinge back as the bell passes between the legs. The head in
 *  line with the spine. The bell hangs from the hands (benchBar.ts HELD_PROPS: along the arms). */
const SWING = {
  /** the torso's hinge at the bottom (radians off upright, the legs leaning back from the heels a part of it) */
  hinge: 1.0,
  /** the arms off hanging (forward −): down and back between the thighs at the bottom, a little over level at the top */
  armLow: 0.1, armTop: -1.55,
  /** the feet apart (each leg out), the hands in to the body's middle (the arms past hanging, toward each other) */
  stance: 0.24, inward: 0.22
} as const;
/** The swing's phase at k (0 … 1 of a rep): the hips' extension (0 hinged … 1 upright) and the bell's height (0 back
 *  between the legs … 1 at the chest). The hip snap and the arms move together: the hips open as the bell comes
 *  forward through hip height and are upright once it's there (HIPS), so the bell is never low with the torso
 *  upright; up quick, a float at the chest, the fall, a beat hinged with the bell back between the legs. Both start and
 *  end at 0 with no jump (the loop's seam). */
export function swingAt(k: number): { hips: number; bell: number } {
  const e = (a: number, b: number) => smooth01((k - a) / (b - a));
  // up 0 … 0.36, the float to 0.5, down 0.5 … 0.9, the bottom to 1
  const bell = k < 0.5 ? e(0, 0.36) : 1 - e(0.5, 0.9);
  return { hips: smooth01((bell - HIPS[0]) / (HIPS[1] - HIPS[0])), bell };
}
/** Where along the bell's arc the hips open, from hinged to upright: from the bell swinging forward past the knees to
 *  it out in front at the hips' height (the arms ~50° forward). */
const HIPS = [0.25, 0.75] as const;
function swing(t: number, body: Body, seed = 0): Pose {
  const p = rest();
  breathe(p, t, REP_MS.swing, 0.6);
  const { hips, bell } = swingAt(cyc(t, REP_MS.swing, seed)), h = 1 - hips;
  // the legs wide and soft at the bottom, the hips sent back (the legs lean back from the heels, the torso forward)
  squat(p, body, 0.16 * h * body.thigh);
  const back = 0.2 * h;
  p.pitch = -back;
  p.j.Leg_1_L = add(p.j.Leg_1_L, [0, 0.12, -SWING.stance]);
  p.j.Leg_1_R = add(p.j.Leg_1_R, [0, -0.12, SWING.stance]);
  p.j.Ankle_L = add(p.j.Ankle_L, [back, 0, SWING.stance * 0.8]);
  p.j.Ankle_R = add(p.j.Ankle_R, [back, 0, -SWING.stance * 0.8]);
  const hinge = (SWING.hinge + back) * h - 0.04 * hips;
  p.j.Spine_1 = [0.62 * hinge, 0, 0];
  p.j.Spine_2 = [0.25 * hinge, 0, 0];
  p.j.Spine_3 = [0.13 * hinge, 0, 0];
  // (the head along the spine, the eyes a little ahead)
  p.j.Head = [-0.15 * h, 0, 0];
  // straight arms, the hands together on the handle at the body's middle: from back between the thighs to the chest
  const fwd = SWING.armLow + (SWING.armTop - SWING.armLow) * bell;
  const inn = ARMS + 0.35 + SWING.inward;
  p.j.Arm_1_L = [fwd, 0, -inn];
  p.j.Arm_1_R = [fwd, 0, inn];
  p.j.Arm_2_L = [0, -0.06, 0];
  p.j.Arm_2_R = [0, 0.06, 0];
  return p;
}

/** The Ring-Con: held in both hands at the chest, a squat each rep, the ring squeezed (the hands in) at the bottom, every
 *  other rep pressed out at arm's length instead. */
function ring(t: number, body: Body, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 2000, 1);
  const k = cyc(t, REP_MS.ring, seed), press = cyc(t, REP_MS.ring * 2, seed) >= 0.5;
  const down = k < 0.45 ? smooth01(k / 0.45) : k < 0.55 ? 1 : 1 - smooth01((k - 0.55) / 0.45);
  squat(p, body, 0.55 * down * body.thigh);
  const out = press ? down : 0, squeeze = press ? 0 : down;
  p.j.Arm_1_L = [-1.05 - 0.35 * out, 0, -(ARMS - 0.5) + 0.12 * squeeze];
  p.j.Arm_1_R = [-1.05 - 0.35 * out, 0, ARMS - 0.5 - 0.12 * squeeze];
  p.j.Arm_2_L = [0, -1.25 * (1 - out) - 0.1, 0];
  p.j.Arm_2_R = [0, 1.25 * (1 - out) + 0.1, 0];
  p.j.Spine_1 = [0.12 + 0.18 * down, 0, 0];
  p.j.Head = [-0.12 * down, 0, 0];
  return p;
}

/** The climbing wall's round (fractions of REP_MS.climb): up its face till `up`, a look round at the top till `top`,
 *  back down till `down`, a rest at its foot. */
export const CLIMB = { up: 0.42, top: 0.52, down: 0.9 } as const;
/** One reach and step (ms): a hand up to the next hold, the other side's knee up after it. */
const MOVE_MS = 1300;
/** How far up the climber's feet are (0 … 1) at `t`, and whether it's going up (1), down (−1) or still (0). */
export function climbAt(t: number, seed = 0): { h: number; dir: -1 | 0 | 1 } {
  const k = cyc(t, REP_MS.climb, seed);
  if (k < CLIMB.up) return { h: smooth01(k / CLIMB.up), dir: 1 };
  if (k < CLIMB.top) return { h: 1, dir: 0 };
  if (k < CLIMB.down) return { h: 1 - smooth01((k - CLIMB.top) / (CLIMB.down - CLIMB.top)), dir: -1 };
  return { h: 0, dir: 0 };
}
/** Climbing, facing the wall (its feet `top` villager units up at the top): a hand reaching up to a hold while the other
 *  pulls down to the shoulder, the opposite knee up onto the next foothold, side after side, the body rising (or sinking)
 *  with each pull; still at the top and the foot, both hands up on holds, looking about. */
function climb(t: number, top: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 1700, 1);
  const { h, dir } = climbAt(t, seed), go = dir !== 0 ? 1 : 0;
  const tt = t + seed * 137, m = (((tt % MOVE_MS) + MOVE_MS) % MOVE_MS) / MOVE_MS, side = Math.floor(tt / MOVE_MS) % 2 ? 1 : -1;
  const reach = go * Math.sin(m * Math.PI), L = side < 0 ? reach : -0.6 * reach, R = side > 0 ? reach : -0.6 * reach;
  // the arms up the wall to the holds (+z raises the left one from the T, −z the right), the elbows bent
  p.j.Arm_1_L = [-0.45, 0, 0.75 + 0.55 * L];
  p.j.Arm_1_R = [-0.45, 0, -0.75 - 0.55 * R];
  p.j.Arm_2_L = [0, -0.55 + 0.4 * L, 0];
  p.j.Arm_2_R = [0, 0.55 - 0.4 * R, 0];
  // the knee opposite the reaching hand up onto a hold
  const kL = Math.max(0, R), kR = Math.max(0, L);
  p.j.Leg_1_L = [-0.35 - 0.9 * kL, 0, -0.22];
  p.j.Leg_1_R = [-0.35 - 0.9 * kR, 0, 0.22];
  p.j.Leg_2_L = [0.55 + 1.1 * kL, 0, 0];
  p.j.Leg_2_R = [0.55 + 1.1 * kR, 0, 0];
  p.j.Ankle_L = [-0.3, 0, 0];
  p.j.Ankle_R = [-0.3, 0, 0];
  p.j.Spine_1 = [0.12, 0.08 * side * go, 0];
  p.j.Head = [dir < 0 ? -0.2 : -0.35, 0.15 * Math.sin(t / 1900 + seed) * (1 - go), 0];
  p.y = top * h + 0.25 * reach;
  return p;
}

/** Soaking in a bath (the hips on the tub's inner floor: the anchor's), the legs out along it, the knees up a little,
 *  leaning back against its end, the hands on the knees, the head tipped back, slow deep breaths. */
function soak(t: number, body: Body, seed = 0): Pose {
  const p = sitOn(t, body, 0.25 * body.shin, true, seed);
  breathe(p, t, 3400, 0.8);
  p.j.Spine_1 = [-0.4, 0, 0.04 * Math.sin(t / 3100 + seed)];
  // (the hands in on the knees, not out on the rim: a player's long arms went through a drum-can's or a claw-foot's sides)
  arms(p, ARMS + 0.05, -0.75, 0.55);
  p.j.Head = [-0.28, 0.18 * drift(t * 0.4, seed), 0];
  return p;
}

/** In the toilet stall: sat on the seat (sitOn's legs), the hands on the knees; hidden once the door's shut. */
function stall(t: number, body: Body, h: number, seed = 0): Pose {
  const p = sitOn(t, body, h, true, seed);
  p.j.Arm_1_L = [-0.75, 0, -(ARMS + 0.05)];
  p.j.Arm_1_R = [-0.75, 0, ARMS + 0.05];
  return p;
}

export function base(state: State, t: number, o: BaseOpts): Pose {
  const more = MORE_USES[state];
  if (more) return more.pose(t, o);
  switch (state) {
    case 'curl': return curl(t, o.seed);
    case 'swing': return swing(t, o.body, o.seed);
    case 'yoga': return yoga(t, o.body, o.seed);
    case 'ring': return ring(t, o.body, o.seed);
    case 'climb': return climb(t, o.climb ?? 0, o.seed);
    case 'soak': return soak(t, o.body, o.seed);
    case 'stall': return stall(t, o.body, o.seatH ?? o.body.hip, o.seed);
    case 'press': return press(t, o.seed);
    case 'pedal': return pedal(t, o.body, o.seatH ?? o.body.hip, o.seed);
    case 'run': return run(t);
    case 'punch': return punch(t, o.seed);
    case 'bounce': return bounce(t, o.body, o.seatH ?? o.body.hip, o.seed);
    case 'pullup': return pullup(t, o.seed);
    case 'fish': return fish(t, o.seed);
    case 'walk': return walk(t, o.phase, o.speed);
    case 'sit': return o.seatH !== undefined ? sitOn(t, o.body, o.seatH, !!o.back, o.seed) : sit(t, o.body, o.seed);
    case 'lie': return lie(t, o.seed);
    case 'nap': return nap(t, o.seed);
    case 'doze': return doze(t, o.seed);
    case 'prone': return prone(t, o.seed);
    default: return idle(t, o.seed);
  }
}

// ---- the actions: once, over a base ----------------------------------------------------------------------------------

/** An action's pose `u` ms in, and how much of it shows (its envelope: in and out over FADE_MS). Joints it names
 *  replace the base's (by its weight); its lift adds, its squash multiplies. */
export function action(a: Action, u: number): { p: Pose; w: number } {
  const T = ACTION_MS[a], p = rest();
  const w = Math.min(smooth01(u / FADE_MS), smooth01((T - u) / FADE_MS));
  switch (a) {
    case 'hop': {
      // a squash to gather, up (stretched, legs tucked, arms flung up), a squash on landing, back
      const k = u / T;
      if (k < 0.17) p.sq = 1 - 0.2 * smooth01(k / 0.17);
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
      const up = Math.min(smooth01(u / 220), smooth01((T - u) / 260));
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
      const up = Math.min(smooth01(u / 160), smooth01((T - u) / 240));
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
      const k = u / T, back = k < 0.4 ? smooth01(k / 0.4) : 1 - smooth01((k - 0.4) / 0.3), out = k < 0.4 ? 0 : Math.sin(clamp01((k - 0.4) / 0.6) * Math.PI);
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
      const up = Math.min(smooth01(u / 300), smooth01((T - u) / 300)), bend = Math.sin((u / T) * 2 * TAU) * up;
      arms(p, ARMS - (ARMS + 0.5) * up, 0.1 * up, 0.15);
      p.j.Spine_1 = [0, 0, 0.3 * bend];
      p.j.Spine_2 = [0, 0, 0.12 * bend];
      p.j.Head = [0, 0, 0.1 * bend];
      return { p, w };
    }
    case 'jump': {
      // NH's Jump: two hops on the spot, the arms flung out and up at the top of each
      const k = ((u / T) * 2) % 1;
      if (k < 0.2) p.sq = 1 - 0.16 * smooth01(k / 0.2);
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
    case 'twitch': {
      // a sleeper's twitch (Gulliver nudged): a kick of the feet and a jerk of a wing, no lift (the head the sleep's)
      const k = Math.sin(clamp01(u / T) * Math.PI) * Math.sin((u / T) * 3 * Math.PI);
      p.j.Leg_2_L = [0.5 * k, 0, 0];
      p.j.Leg_2_R = [-0.3 * k, 0, 0];
      p.j.Arm_2_L = [0, -0.5 * k, 0];
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
