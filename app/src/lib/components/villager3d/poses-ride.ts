// The uses ridden or sat in (poses.ts GymUse, dispatched by base(); docs/design.md "The gym"), looped on the wall clock
// while one's on the piece: the vehicles' drive, the rockets boarded, the helm steered, a board balanced on, a cart
// pushed, the sandbox dug in, the elephant slide gone down and round, the teacup and the train ridden, the carousel's
// horse, the massage chair's shake and the office chair's swivel. Each a UseDef (poses-kit.ts). What the piece itself
// does meanwhile (motionOf: a spin, a rumble, a squash) and where the slide carries its rider (slideAt) are here too, so
// the rooms (tent/rideFx.ts) and the island (world3d/villagers.ts) move them alike off the same clock. Pure: unit-tested.
import { clamp01, smooth01 } from '#lib/math.ts';
import { ARMS, TAU, add, arms, breathe, cyc, drift, rest, sitOn, squat, type BaseOpts, type Body, type Pose, type UseDef } from './poses-kit.ts';

/** How far a seated pose's hips sit under where they'd stand (villager3d.ts SINK, the seat's give). */
const SINK = 0.55;
/** A sitting pose on a stood anchor (the slide's top): the body lowered so the hips are on it. */
const seatDrop = (b: Body) => -(b.hip - SINK);

/** Seated at the wheel: the hands on it ahead at the chest, small turns side to side, a bob with the engine. */
function drive(t: number, o: BaseOpts): Pose {
  const p = sitOn(t, o.body, o.seatH ?? o.body.hip, true, o.seed);
  // (a slow turn of the wheel and a quicker correction over a rep; the engine's bumps BUMPS a rep)
  const a = cyc(t, RIDE_USES.drive.ms, o.seed) * TAU, steer = 0.6 * Math.sin(a) + 0.4 * Math.sin(3 * a);
  p.j.Arm_1_L = [-1.2 - 0.1 * steer, 0, -(ARMS - 0.45)];
  p.j.Arm_1_R = [-1.2 + 0.1 * steer, 0, ARMS - 0.45];
  p.j.Arm_2_L = [0, -0.55, 0];
  p.j.Arm_2_R = [0, 0.55, 0];
  p.j.Spine_1 = [0.08, 0.06 * steer, 0];
  p.j.Head = [-0.04, 0.12 * steer, 0];
  p.y += 0.05 * Math.abs(Math.sin(BUMPS * a));
  return p;
}

/** Climbing into a rocket, a shuttle or the saucer (got onto with a hop: villager3d sitAt), crouched in its hatch: hidden
 *  once in (tent/rideFx.ts BOARD_HIDE_MS). */
function board(t: number, o: BaseOpts): Pose {
  const p = arms(rest(), ARMS - 0.25, -0.5, 0.6);
  breathe(p, t, 2000, 1);
  squat(p, o.body, 0.4 * o.body.thigh);
  p.j.Spine_1 = [0.25, 0, 0];
  return p;
}

/** At the ship's helm, standing: both hands up on the wheel's spokes, turning it one way and the other, the weight
 *  shifting with it, looking out ahead. */
function steer(t: number, o: BaseOpts): Pose {
  const p = rest();
  breathe(p, t, 2600, 1);
  const k = Math.sin((cyc(t, RIDE_USES.steer.ms, o.seed)) * TAU);
  // (a hand high, the other low on the wheel, swapping as it turns)
  p.j.Arm_1_L = [-1.35 - 0.3 * k, 0, -(ARMS - 0.55)];
  p.j.Arm_1_R = [-1.35 + 0.3 * k, 0, ARMS - 0.55];
  p.j.Arm_2_L = [0, -0.5, 0];
  p.j.Arm_2_R = [0, 0.5, 0];
  p.j.Spine_1 = [0.06, 0, 0.06 * k];
  p.j.Leg_1_L = [0, 0, -0.12];
  p.j.Leg_1_R = [0, 0, 0.12];
  p.j.Head = [-0.1, 0.25 * drift(t, o.seed), 0];
  return p;
}

/** Balanced on a board, side on along it: the feet apart, the knees bent, the arms out, swaying side to side and
 *  catching it. */
function balance(t: number, o: BaseOpts): Pose {
  const p = rest();
  breathe(p, t, 1800, 1);
  const s = Math.sin(cyc(t, RIDE_USES.balance.ms, o.seed) * TAU), s2 = Math.sin(cyc(t, RIDE_USES.balance.ms / 2.7, o.seed) * TAU);
  p.j.Leg_1_L = [0, 0, -0.32];
  p.j.Leg_1_R = [0, 0, 0.32];
  squat(p, o.body, (0.28 + 0.06 * s2) * o.body.thigh);
  p.y -= 0.12;
  arms(p, 0.35 + 0.25 * s, -0.15, 0.25);
  p.j.Arm_1_R = [-0.15, 0, 0.35 - 0.25 * s];
  p.j.Spine_1 = add(p.j.Spine_1, [0.1, 0, 0.12 * s]);
  p.j.Head = [-0.05, 0, -0.1 * s];
  return p;
}

/** Pushing a cart, a stroller, a wagon: standing behind it leaning in, the hands forward on its handle (its height over
 *  the feet the anchor's `top`: o.climb, villager units), marching on the spot. */
function push(t: number, o: BaseOpts): Pose {
  const p = rest();
  breathe(p, t, 2200, 1);
  const b = o.body, handle = o.climb ?? b.hip + 1, k = clamp01((handle - b.hip) / 2.4);
  const s = Math.sin(cyc(t, RIDE_USES.push.ms, o.seed) * TAU);
  // (the hands from the thighs, k 0, to the chest, k 1, a little in, the elbows soft)
  const fwd = -0.55 - 0.85 * k;
  p.j.Arm_1_L = [fwd, 0, -(ARMS - 0.35)];
  p.j.Arm_1_R = [fwd, 0, ARMS - 0.35];
  p.j.Arm_2_L = [0, -0.35, 0];
  p.j.Arm_2_R = [0, 0.35, 0];
  p.j.Spine_1 = [0.22, 0, 0.03 * s];
  p.j.Leg_1_L = [-0.18 * Math.max(0, s), 0, -0.05];
  p.j.Leg_1_R = [-0.18 * Math.max(0, -s), 0, 0.05];
  p.j.Leg_2_L = [0.35 * Math.max(0, s), 0, 0];
  p.j.Leg_2_R = [0.35 * Math.max(0, -s), 0, 0];
  p.j.Head = [-0.12, 0.2 * drift(t, o.seed), 0];
  p.y = 0.08 * Math.abs(s);
  return p;
}

/** Digging in the sand, crouched low: a hand scooping in front and tossing it aside, the other on the knee, the head
 *  down watching. */
function dig(t: number, o: BaseOpts): Pose {
  const p = rest();
  breathe(p, t, 2000, 1);
  squat(p, o.body, 0.85 * o.body.thigh);
  p.j.Leg_1_L = add(p.j.Leg_1_L, [0, 0, -0.25]);
  p.j.Leg_1_R = add(p.j.Leg_1_R, [0, 0, 0.25]);
  const k = cyc(t, RIDE_USES.dig.ms, o.seed), scoop = k < 0.55 ? smooth01(k / 0.55) : 1 - smooth01((k - 0.55) / 0.45);
  p.j.Arm_1_R = [-0.6 - 0.7 * scoop, 0.3 * scoop, ARMS - 0.35];
  p.j.Arm_2_R = [0, 0.3 + 0.6 * (1 - scoop), 0];
  p.j.Arm_1_L = [-0.75, 0, -(ARMS - 0.2)];
  p.j.Arm_2_L = [0, -0.6, 0];
  p.j.Spine_1 = [0.45, 0.12 * scoop, 0];
  p.j.Head = [0.15, 0, 0];
  return p;
}

/** The elephant slide's round (ms): up its back, scooting along its head, down its trunk, off, and walking back round
 *  to its foot. */
export const SLIDE = { climb: 1300, scoot: 700, slide: 900, land: 400, walk: 2700 } as const;
const SLIDE_MS = SLIDE.climb + SLIDE.scoot + SLIDE.slide + SLIDE.land + SLIDE.walk;
/** The round's way in the anchor's frame (z ahead, x to its left, y up), in the slide's tops (`top`): its foot behind the
 *  back at 0, the top reached 0.5 in, its trunk's start 1.29, its end 2 (a quarter up), the floor 2.22; back round
 *  0.85 to its right (the room's front). */
const P = { up: 0.5, edge: 1.29, end: 2, off: 2.22, side: -0.85, low: 0.25 } as const;
export type SlidePhase = 'climb' | 'scoot' | 'slide' | 'land' | 'walk';
/** Where the slide's rider is at `t`: its phase and how far through it (k), its offset from the anchor (x, y, z: in the
 *  slide's tops) and its turn from the anchor's way (yaw). */
export function slideAt(t: number, seed = 0): { phase: SlidePhase; k: number; x: number; y: number; z: number; yaw: number } {
  let u = cyc(t, SLIDE_MS, seed) * SLIDE_MS;
  if (u < SLIDE.climb) {
    const k = u / SLIDE.climb;
    return { phase: 'climb', k, x: 0, y: smooth01(k), z: P.up * smooth01(k * 1.15 - 0.15), yaw: 0 };
  }
  u -= SLIDE.climb;
  if (u < SLIDE.scoot) {
    const k = u / SLIDE.scoot;
    return { phase: 'scoot', k, x: 0, y: 1, z: P.up + (P.edge - P.up) * smooth01(k), yaw: 0 };
  }
  u -= SLIDE.scoot;
  if (u < SLIDE.slide) {
    // (faster as it goes: down a slope)
    const k = u / SLIDE.slide, e = k * k * (1.6 - 0.6 * k);
    return { phase: 'slide', k, x: 0, y: 1 - (1 - P.low) * e, z: P.edge + (P.end - P.edge) * e, yaw: 0 };
  }
  u -= SLIDE.slide;
  if (u < SLIDE.land) {
    const k = u / SLIDE.land;
    return { phase: 'land', k, x: 0, y: P.low * (1 - smooth01(k)) + 0.12 * Math.sin(k * Math.PI), z: P.end + (P.off - P.end) * smooth01(k), yaw: 0 };
  }
  u -= SLIDE.land;
  // back round: to its right, back along its side, in to its foot (each leg its length's share of the walk), turned a
  // quarter at each corner (eased over TURN of the leg), round to the way it started at the end
  const k = u / SLIDE.walk, legs = [-P.side, P.off, -P.side], all = legs[0] + legs[1] + legs[2], TURN = 0.2, q = -Math.PI / 2;
  let d = k * all;
  if (d < legs[0]) return { phase: 'walk', k, x: P.side * (d / legs[0]), y: 0, z: P.off, yaw: q * smooth01(d / TURN) };
  d -= legs[0];
  if (d < legs[1]) return { phase: 'walk', k, x: P.side, y: 0, z: P.off * (1 - d / legs[1]), yaw: q + q * smooth01(d / TURN) };
  d -= legs[1];
  return { phase: 'walk', k, x: P.side * (1 - d / legs[2]), y: 0, z: 0, yaw: 2 * q + q * smooth01(d / TURN) + q * smooth01((d - legs[2] + TURN) / TURN) };
}

/** The slide's rider: climbing, sitting up top, down with the arms up, landing, walking back round. */
function slide(t: number, o: BaseOpts): Pose {
  // (on the clock alone, no seed: its carry, tent/rideFx.ts, has none)
  const s = slideAt(t), b = o.body;
  if (s.phase === 'walk') {
    const p = rest();
    arms(p, ARMS - 0.05, 0, 0.3);
    const ph = s.k * 9, sw = Math.sin(ph * TAU);
    p.j.Leg_1_L = [-0.5 * sw, 0, 0];
    p.j.Leg_1_R = [0.5 * sw, 0, 0];
    p.j.Leg_2_L = [0.6 * Math.max(0, Math.cos(ph * TAU)), 0, 0];
    p.j.Leg_2_R = [0.6 * Math.max(0, -Math.cos(ph * TAU)), 0, 0];
    p.j.Arm_1_L = add(p.j.Arm_1_L, [0.45 * sw, 0, 0]);
    p.j.Arm_1_R = add(p.j.Arm_1_R, [-0.45 * sw, 0, 0]);
    p.y = 0.25 * Math.abs(sw);
    return p;
  }
  if (s.phase === 'climb') {
    // hand over hand up its back
    const p = rest(), m = Math.sin(s.k * 4 * Math.PI);
    p.j.Arm_1_L = [-0.45, 0, 0.75 + 0.5 * Math.max(0, m)];
    p.j.Arm_1_R = [-0.45, 0, -0.75 - 0.5 * Math.max(0, -m)];
    p.j.Arm_2_L = [0, -0.5, 0];
    p.j.Arm_2_R = [0, 0.5, 0];
    p.j.Leg_1_L = [-0.35 - 0.8 * Math.max(0, -m), 0, -0.2];
    p.j.Leg_1_R = [-0.35 - 0.8 * Math.max(0, m), 0, 0.2];
    p.j.Leg_2_L = [0.5 + 1.0 * Math.max(0, -m), 0, 0];
    p.j.Leg_2_R = [0.5 + 1.0 * Math.max(0, m), 0, 0];
    p.j.Spine_1 = [0.2, 0, 0];
    return p;
  }
  if (s.phase === 'land') {
    const p = arms(rest(), ARMS - 0.6 * (1 - s.k), 0, 0.2);
    squat(p, b, 0.5 * b.thigh * Math.sin(s.k * Math.PI));
    return p;
  }
  // sat on top, then down: the legs out straight along it, leaning back, the arms flung up as it goes
  const p = sitOn(t, b, 0.3 * b.shin, false, o.seed), go = s.phase === 'slide' ? Math.sin(Math.min(1, s.k * 1.6) * Math.PI / 2) : 0;
  p.j.Leg_1_L = [-1.45, 0, -0.1];
  p.j.Leg_1_R = [-1.45, 0, 0.1];
  p.j.Leg_2_L = [0.15, 0, 0];
  p.j.Leg_2_R = [0.15, 0, 0];
  p.j.Spine_1 = [-0.1 - 0.3 * go, 0, 0];
  arms(p, ARMS - (ARMS + 0.35) * go, -0.4 * (1 - go), 0.3);
  p.j.Head = [-0.15 * go, 0, 0];
  p.y = seatDrop(b);
  return p;
}

/** Riding the teacup or the train, sat: the hands ahead on its wheel or its rail, leaning out a little with the turn,
 *  looking round. */
function ride(t: number, o: BaseOpts): Pose {
  const p = sitOn(t, o.body, o.seatH ?? o.body.hip, true, o.seed);
  p.j.Arm_1_L = [-1.05, 0, -(ARMS - 0.4)];
  p.j.Arm_1_R = [-1.05, 0, ARMS - 0.4];
  p.j.Arm_2_L = [0, -0.6, 0];
  p.j.Arm_2_R = [0, 0.6, 0];
  p.j.Spine_1 = [-0.05, 0, 0.1];
  p.j.Head = [-0.06, 0.4 * Math.sin(cyc(t, RIDE_USES.ride.ms, o.seed) * TAU), 0.08];
  return p;
}

/** Astride the carousel's horse: the legs either side of it, the hands up on its pole, rising and sinking with it. */
function carousel(t: number, o: BaseOpts): Pose {
  const p = sitOn(t, o.body, o.seatH ?? o.body.hip, false, o.seed);
  p.j.Leg_1_L = [-1.2, 0, -0.55];
  p.j.Leg_1_R = [-1.2, 0, 0.55];
  p.j.Leg_2_L = [1.0, 0, 0];
  p.j.Leg_2_R = [1.0, 0, 0];
  p.j.Arm_1_L = [-1.55, 0, -(ARMS - 0.55)];
  p.j.Arm_1_R = [-1.55, 0, ARMS - 0.55];
  p.j.Arm_2_L = [0, -0.45, 0];
  p.j.Arm_2_R = [0, 0.45, 0];
  p.j.Spine_1 = [0.06, 0, 0];
  p.j.Head = [-0.05, 0.3 * drift(t, o.seed), 0];
  p.y += 0.35 * Math.sin((t / RIDE_USES.carousel.ms) * TAU);
  return p;
}

/** In a massage chair: leaned back on it, the arms on its rests, the whole body shaking a little with it, eyes half
 *  shut (the head lolling). */
function massage(t: number, o: BaseOpts): Pose {
  const p = sitOn(t, o.body, o.seatH ?? o.body.hip, true, o.seed);
  arms(p, ARMS + 0.1, -0.45, 0.4);
  const a = cyc(t, RIDE_USES.massage.ms, o.seed) * TAU, buzz = Math.sin(160 * a) * 0.5 + Math.sin(110 * a) * 0.5;
  p.j.Spine_1 = [-0.22, 0, 0.02 * buzz];
  p.j.Spine_2 = [0.015 * buzz, 0, 0];
  p.j.Head = [-0.2 + 0.03 * buzz, 0.25 * Math.sin(a), 0.03 * buzz];
  p.y += 0.03 * buzz;
  return p;
}

/** In a swivel chair (the gaming chair, the office chairs): sat back, the hands in the lap, a foot pushing off the floor
 *  now and then (the chair's own turn: motionOf). */
function swivel(t: number, o: BaseOpts): Pose {
  const p = sitOn(t, o.body, o.seatH ?? o.body.hip, true, o.seed);
  const k = Math.cos((t / SWIVEL_MS) * TAU);
  p.j.Leg_2_L = add(p.j.Leg_2_L, [0.25 * Math.max(0, k), 0, 0]);
  p.j.Leg_2_R = add(p.j.Leg_2_R, [0.25 * Math.max(0, -k), 0, 0]);
  // (the shoulders a little against the chair's turn)
  p.j.Spine_1 = [-0.12, -0.15 * Math.sin((t / SWIVEL_MS) * TAU), 0];
  return p;
}

export const RIDE_USES = {
  drive: { ms: 3600, on: 'sit', pose: drive },
  board: { ms: 2000, on: 'stand', pose: board },
  steer: { ms: 4200, on: 'stand', pose: steer },
  balance: { ms: 2600, on: 'stand', pose: balance },
  push: { ms: 900, on: 'stand', pose: push },
  dig: { ms: 1600, on: 'stand', pose: dig },
  slide: { ms: SLIDE_MS, on: 'stand', pose: slide },
  ride: { ms: 3400, on: 'sit', pose: ride },
  carousel: { ms: 2400, on: 'sit', pose: carousel },
  massage: { ms: 3400, on: 'sit', pose: massage },
  swivel: { ms: 6400, on: 'sit', pose: swivel }
} as const satisfies Record<string, UseDef>;
export type RideUse = keyof typeof RIDE_USES;

// ---- what the piece does while it's ridden (the rooms' tent/rideFx.ts, the island's world3d/villagers.ts) -------------

/** The engine's bumps a drive's rep (its rumble: the driver's and the vehicle's alike). */
const BUMPS = 14;
/** A swivel chair's turn and back (ms), how far (rad). */
const SWIVEL_MS = 6400, SWIVEL = 0.5;
/** The spinning pieces (by item code): a turn's time (ms) and how many alike round it (a turn's that share looks the
 *  same: where it may come to rest), or the train's chug (its rock and bob, in place: it has no track). */
export const SPIN: Readonly<Record<string, { ms: number; n: number } | 'chug'>> = {
  f1507: { ms: 9000, n: 3 },
  f12684: { ms: 14000, n: 1 },
  f12803: 'chug'
};
/** Boarded (a rocket, the shuttle, the saucer) or driven in a closed cab (its roof too low for a head: the bulldozer, the
 *  excavator, the steamroller, the truck, the minicar): hidden this long after getting on (the hop in, villager3d SIT_MS,
 *  and a beat inside), the rooms' (tent/rideFx.ts) and the island's (world3d/villagers.ts). */
export const BOARD_HIDE_MS = 900;
export const CABS: ReadonlySet<string> = new Set(['f12600', 'f12602', 'f12603', 'f14049', 'f13621']);
/** Whether a rider of `use` on piece `code` is hidden once in. */
export const hidesIn = (use: string | undefined, code: string): boolean => use === 'board' || (use === 'drive' && CABS.has(code));
/** The uses whose piece moves or carries its rider (motionOf; the slide's slideAt). */
export const RIDE_MOVES: ReadonlySet<string> = new Set(['ride', 'carousel', 'swivel', 'massage', 'drive', 'bounce', 'balance', 'push', 'board', 'slide']);
/** A board laid down to stand on (the surfboard stands upright on its rack: tipped forward onto the floor, its rack under
 *  its foot), how high its top then is (model units). */
export const LAID: Readonly<Record<string, { lift: number }>> = { f7868: { lift: 1.15 } };

/** A piece's own motion at `t` (wall clock), in its frame about its foot's middle: moved (model units), turned (rad, as
 *  three's Euler XYZ), squashed (sy), and whether its rider goes with it (`carry`: a spin, a swivel, a rumble). `yaw` its
 *  rider's way in the piece's frame (a cart rocks along it). Null: nothing of it moves. */
export interface Motion { x: number; y: number; z: number; rx: number; ry: number; rz: number; sy: number; carry: boolean }
export function motionOf(use: string, code: string, t: number, yaw = 0): Motion | null {
  const m: Motion = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sy: 1, carry: false };
  const spin = SPIN[code];
  switch (use) {
    case 'ride':
    case 'carousel':
      if (spin === 'chug') {
        const c = (t / 700) * TAU;
        m.rz = 0.022 * Math.sin(c);
        m.y = 0.18 * Math.abs(Math.sin(c));
      } else if (spin) m.ry = ((t % spin.ms) / spin.ms) * TAU;
      else return null;
      m.carry = true;
      return m;
    case 'swivel':
      m.ry = SWIVEL * Math.sin((t / SWIVEL_MS) * TAU);
      m.carry = true;
      return m;
    case 'massage':
      m.x = 0.05 * Math.sin(t / 17);
      m.z = 0.05 * Math.sin(t / 23 + 1);
      m.y = 0.03 * Math.abs(Math.sin(t / 29));
      m.carry = true;
      return m;
    case 'drive': {
      const c = ((t % RIDE_USES.drive.ms) / RIDE_USES.drive.ms) * TAU * BUMPS;
      m.y = 0.1 * Math.abs(Math.sin(c));
      m.rz = 0.006 * Math.sin(c * 0.5);
      m.carry = true;
      return m;
    }
    case 'bounce':
      // the tire toy squashed under its rider's bounce (poses.ts bounce: REP_MS 900, its hop's |sin| over two)
      if (code !== 'f2329') return null;
      m.sy = 1 - 0.12 * (1 - Math.abs(Math.sin(((t % 1800) / 1800) * TAU)));
      return m;
    case 'balance': {
      const s = Math.sin(((t % RIDE_USES.balance.ms) / RIDE_USES.balance.ms) * TAU);
      if (LAID[code]) {
        // tipped forward onto the floor (its top toward +z), rocking a touch
        m.rx = Math.PI / 2;
        m.y = LAID[code].lift;
        m.rz = 0.04 * s;
      } else {
        // rolled about its length under the sway (across its rider's way)
        m.rx = 0.05 * s * Math.cos(yaw);
        m.rz = -0.05 * s * Math.sin(yaw);
      }
      return m;
    }
    case 'push': {
      // rocked to and fro along the push with each step
      const s = 0.22 * Math.sin(((t % RIDE_USES.push.ms) / RIDE_USES.push.ms) * TAU * 2);
      m.x = s * Math.sin(yaw);
      m.z = s * Math.cos(yaw);
      return m;
    }
    case 'board':
      // the saucer hums once boarded: a slow bob and turn
      if (code !== 'f1447') return null;
      m.y = 0.35 * Math.sin(t / 900);
      m.ry = (t / 6000) % TAU;
      return m;
    default:
      return null;
  }
}
/** A spinning piece's angle let go of at `ry` comes to rest at the nearest of its look-alike turns (rad, the short way). */
export function restOf(code: string, ry: number): number {
  const s = SPIN[code], n = s && s !== 'chug' ? s.n : 1, step = TAU / n;
  return Math.round(ry / step) * step;
}
