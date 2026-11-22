// The uses stood at (poses.ts GymUse, dispatched by base(); docs/design.md "The gym": Stood at): a piece one stands in
// front of and works at, looped on the wall clock while one's on it (its seat, so every phone draws it alike), and the
// one-offs played once on this phone (ACTS, like the rooms' instruments: tent/playPose.ts). Each pose as poses.ts draws
// its own (its header has the axes); what's held rides the hands (world3d/heldProps.ts), what flies or steams is
// tent/standFx.ts's, timed off the moments exported here. Pure: unit-tested.
import { clamp01, smooth01 } from '#lib/math.ts';
import { ARMS, TAU, breathe, cyc, drift, over, poseBuf, rest, squat, type Body, type Pose, type UseDef } from './poses-kit.ts';

/** A pulse 0 → 1 → 0 between a and b (fractions), smooth both ways. */
const hump = (k: number, a: number, b: number) => (k <= a || k >= b ? 0 : Math.sin(((k - a) / (b - a)) * Math.PI));
/** 0 before a, 1 after b, smooth between. */
const ramp = (k: number, a: number, b: number) => smooth01(clamp01((k - a) / (b - a)));

// ---- looped (synced: the seat's use) ---------------------------------------------------------------------------------

/** One rep (ms) of each: the cook's swirls and tosses, a hammer's blow, a line typed, a look through the eyepiece and a
 *  pan, a page read and turned, a line written and looked at. */
export const STAND_MS = { cook: 4800, hammer: 950, type: 1600, peer: 6400, read: 5600, write: 4200 } as const;
/** The cook's round (fractions of a rep): swirling the pot till `toss`, then two tosses. */
export const COOK_TOSS = 0.6;
/** The hammer's blow lands this far into its rep. */
export const HAMMER_HIT = 0.68;

/** How far up a toss of the cook's pot is now (0 … 1): the food leaps then (standFx's sizzle). */
export const tossAt = (t: number, seed = 0): number => {
  const k = cyc(t, STAND_MS.cook, seed);
  return k < COOK_TOSS ? 0 : Math.max(0, Math.sin(((k - COOK_TOSS) / (1 - COOK_TOSS)) * TAU * 2));
};
/** Whether a hammer's blow just landed (within `win` of the rep after HAMMER_HIT). */
export const hitAt = (t: number, seed = 0, win = 0.1): boolean => {
  const k = cyc(t, STAND_MS.hammer, seed);
  return k >= HAMMER_HIT && k < HAMMER_HIT + win;
};

/** Cooking at a stove, a fire, a counter: the pot held in both hands over it, swirled round, then tossed twice (the food
 *  leaping), leaning in and watching it. */
function cook(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 2400, 1);
  const k = cyc(t, STAND_MS.cook, seed), toss = tossAt(t, seed);
  const a = k < COOK_TOSS ? (k / COOK_TOSS) * 3 * TAU : 0, sx = Math.sin(a), cz = Math.cos(a), sw = k < COOK_TOSS ? 1 : 0;
  // (the hands at the pot's handles, low in front: a swirl's little circle, a toss up and the wrists back)
  const fwd = -0.64 + 0.07 * cz * sw - 0.3 * toss;
  p.j.Arm_1_L = [fwd, 0.07 * sx * sw, -(ARMS - 0.32)];
  p.j.Arm_1_R = [fwd, 0.07 * sx * sw, ARMS - 0.32];
  p.j.Arm_2_L = [0, -0.95 - 0.2 * toss, 0];
  p.j.Arm_2_R = [0, 0.95 + 0.2 * toss, 0];
  p.j.Hand_L = [-0.35 * toss, 0, 0];
  p.j.Hand_R = [-0.35 * toss, 0, 0];
  p.j.Spine_1 = [0.14, 0.05 * sx * sw, 0];
  p.j.Head = [0.24 - 0.1 * toss, 0.06 * sx * sw, 0];
  p.y = 0.08 * toss;
  return p;
}

/** At the workbench: the work held down with the left hand, the hammer in the right raised and brought down on it, a
 *  little bounce off it. */
function hammer(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 1900, 1);
  const k = cyc(t, STAND_MS.hammer, seed);
  const up = k < 0.55 ? smooth01(k / 0.55) : k < HAMMER_HIT ? 1 - smooth01((k - 0.55) / (HAMMER_HIT - 0.55)) : 0;
  const bounce = hump(k, HAMMER_HIT, HAMMER_HIT + 0.14);
  p.j.Arm_1_R = [-0.72 - 1.05 * up - 0.12 * bounce, 0, ARMS - 0.3];
  p.j.Arm_2_R = [0, 0.55 + 1.0 * up, 0];
  p.j.Hand_R = [0.25 - 0.45 * up, 0, 0];
  p.j.Arm_1_L = [-0.82, 0, -(ARMS - 0.22)];
  p.j.Arm_2_L = [0, -0.45, 0];
  p.j.Spine_1 = [0.2 - 0.06 * up, -0.06 * up, 0];
  p.j.Head = [0.28, 0, 0];
  p.y = -0.06 * bounce;
  return p;
}

/** At a desk, a sewing machine, a register, the copier: both hands forward on the keys, tapping one then the other, the
 *  head down at the work, now and then up at the page. */
function type(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 3000, 1);
  const tt = t + seed * 137, beat = STAND_MS.type / 12, n = Math.floor(tt / beat), u = (((tt % beat) + beat) % beat) / beat;
  const hit = Math.sin(u * Math.PI) ** 2, l = n % 2 ? hit : 0, r = n % 2 ? 0 : hit;
  // (a pause each rep's end: the hands still, a look up)
  const k = cyc(t, STAND_MS.type, seed), still = ramp(k, 0.78, 0.84) * (1 - ramp(k, 0.94, 1)), go = 1 - still;
  p.j.Arm_1_L = [-0.92, 0.05, -(ARMS - 0.14)];
  p.j.Arm_1_R = [-0.92, -0.05, ARMS - 0.14];
  p.j.Arm_2_L = [0, -0.62, 0];
  p.j.Arm_2_R = [0, 0.62, 0];
  p.j.Hand_L = [0.32 * l * go, 0, 0];
  p.j.Hand_R = [0.32 * r * go, 0, 0];
  p.j.Spine_1 = [0.16, 0, 0];
  p.j.Head = [0.26 - 0.3 * still, 0.12 * drift(t, seed), 0];
  return p;
}

/** At a telescope, the microscope: bent to the eyepiece, a hand either side of it, panning slowly round; now and then up
 *  from it, a look at the sky. */
function peer(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 3600, 0.8);
  const k = cyc(t, STAND_MS.peer, seed), up = ramp(k, 0.78, 0.84) * (1 - ramp(k, 0.92, 0.98)), bend = 1 - up;
  const pan = Math.sin(k * TAU) * bend;
  p.j.Spine_1 = [0.32 * bend + 0.02, 0.16 * pan, 0];
  p.j.Spine_2 = [0.1 * bend, 0, 0];
  p.j.Head = [0.16 * bend - 0.3 * up, 0.04 * pan, 0];
  p.j.Arm_1_L = [-1.15 * bend - 0.3, 0, -(ARMS - 0.45 * bend)];
  p.j.Arm_1_R = [-1.15 * bend - 0.3, 0, ARMS - 0.45 * bend];
  p.j.Arm_2_L = [0, -1.15 * bend - 0.2, 0];
  p.j.Arm_2_R = [0, 1.15 * bend + 0.2, 0];
  return p;
}

/** At a bookshelf, a rack: the book (the magazine) open in both hands at the chest, the head down, the eyes along its
 *  lines, a page turned each rep. */
function read(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 3800, 1);
  const k = cyc(t, STAND_MS.read, seed), turn = hump(k, 0.8, 0.95);
  const bob = 0.04 * Math.sin(k * TAU * 2);
  p.j.Arm_1_L = [-0.8 + bob, 0, -(ARMS - 0.42)];
  p.j.Arm_1_R = [-0.8 + bob, -0.4 * turn, ARMS - 0.42 + 0.15 * turn];
  p.j.Arm_2_L = [0, -1.05, 0];
  p.j.Arm_2_R = [0, 1.05 - 0.2 * turn, 0];
  p.j.Spine_1 = [0.06, 0, 0];
  p.j.Head = [0.32, 0.08 * Math.sin(k * TAU * 5) * (1 - turn), 0];
  return p;
}

/** At a chalkboard, the whiteboard: the right hand up on its face writing a line along, then a step back and a look at
 *  it, the left hand at the side. */
function write(t: number, seed = 0): Pose {
  const p = rest();
  breathe(p, t, 3200, 1);
  const k = cyc(t, STAND_MS.write, seed), look = ramp(k, 0.72, 0.8) * (1 - ramp(k, 0.92, 1)), on = 1 - look;
  // (along the line: the arm sweeps across; small loops for the letters)
  const along = k < 0.72 ? k / 0.72 : 1 - (k - 0.72) / 0.28, w = Math.sin(k * TAU * 24);
  p.j.Arm_1_R = [-1.55 * on - 0.25 + 0.06 * w * on, (0.35 - 0.6 * along) * on, ARMS - 0.6 * on];
  p.j.Arm_2_R = [0, 0.45 + 0.08 * w * on, 0];
  p.j.Hand_R = [-0.2 * on, 0, 0];
  p.j.Arm_1_L = [-0.1, 0, -ARMS];
  p.j.Spine_1 = [0.02, (-0.12 + 0.24 * along) * on, 0];
  p.j.Head = [-0.12 * on, (-0.25 + 0.5 * along) * on + 0.15 * look, 0];
  p.y = -0.1 * look;
  return p;
}

export const STAND_USES = {
  cook: { ms: STAND_MS.cook, on: 'stand', pose: (t, o) => cook(t, o.seed) },
  hammer: { ms: STAND_MS.hammer, on: 'stand', pose: (t, o) => hammer(t, o.seed) },
  type: { ms: STAND_MS.type, on: 'stand', pose: (t, o) => type(t, o.seed) },
  peer: { ms: STAND_MS.peer, on: 'stand', pose: (t, o) => peer(t, o.seed) },
  read: { ms: STAND_MS.read, on: 'stand', pose: (t, o) => read(t, o.seed) },
  write: { ms: STAND_MS.write, on: 'stand', pose: (t, o) => write(t, o.seed) }
} as const satisfies Record<string, UseDef>;
export type StandUse = keyof typeof STAND_USES;
export const isStandUse = (u: string | undefined): u is StandUse => !!u && u in STAND_USES;
/** How much nearer than a step out of its footprint one stands to reach it (model units): the eyepiece, the board's face
 *  are well inside theirs. */
export const REACH: Partial<Record<StandUse, number>> = { peer: 3, write: 4 };

// ---- the one-offs (this phone's: a drink, a photo, a call, a dart, a cue, a shot, a kick) -----------------------------

export type Act = 'sip' | 'photo' | 'call' | 'dart' | 'cue' | 'shoot' | 'kick';
/** Each one-off's length (ms) and its moment (ms in): the drink's first sip, the flash, a dart's or a ball's release, the
 *  cue's strike, the kick. */
export const ACTS: Readonly<Record<Act, { ms: number; at: number }>> = {
  sip: { ms: 4600, at: 2200 },
  photo: { ms: 3400, at: 1800 },
  call: { ms: 4800, at: 600 },
  dart: { ms: 2600, at: 1250 },
  cue: { ms: 3200, at: 2200 },
  shoot: { ms: 2800, at: 1300 },
  kick: { ms: 2400, at: 950 }
};
/** Fading in and out (ms). */
const IN_MS = 240, OUT_MS = 320;

/** A one-off's own pose `u` ms in (the joints it moves; the idle's under it). */
function actOwn(a: Act, u: number, body: Body): Pose {
  const p = rest(), { ms, at } = ACTS[a];
  switch (a) {
    case 'sip': {
      // the pour: the cup held out low at the machine's spout; up to the mouth; two sips (the head back), down a little
      const lift = ramp(u, 1350, 1850), s1 = hump(u, 2100, 2800), s2 = hump(u, 3200, 3900), sip = Math.max(s1, s2);
      p.j.Arm_1_R = [-0.85 - 0.35 * lift, 0, ARMS - 0.28 - 0.32 * lift];
      p.j.Arm_2_R = [0, 0.45 + 1.25 * lift, 0];
      p.j.Hand_R = [-0.45 * sip, 0, 0];
      p.j.Arm_1_L = [-0.15, 0, -ARMS];
      p.j.Spine_1 = [0.16 * (1 - lift) - 0.06 * sip, 0, 0];
      p.j.Head = [0.22 * (1 - lift) - 0.28 * sip, 0, 0];
      break;
    }
    case 'photo': {
      // the camera up to the face in both hands, held still, the click (the flash), a look at the shot
      const up = ramp(u, 0, 600) * (1 - ramp(u, 2700, 3200)), click = hump(u, at - 60, at + 140);
      p.j.Arm_1_L = [-1.2 * up - 0.1, 0, -(ARMS - 0.55 * up)];
      p.j.Arm_1_R = [-1.2 * up - 0.1, 0, ARMS - 0.55 * up];
      p.j.Arm_2_L = [0, -1.5 * up, 0];
      p.j.Arm_2_R = [0, 1.5 * up + 0.08 * click, 0];
      p.j.Spine_1 = [-0.05 * up, 0, 0];
      p.j.Head = [0.06 * up - 0.1 * (1 - up) * ramp(u, 2700, 3000), 0, 0];
      break;
    }
    case 'call': {
      // the handset at the right ear, the other hand on the hip, a tilt of the head and nods, a little turn
      const up = ramp(u, 0, 500) * (1 - ramp(u, ms - 600, ms - 200)), nod = Math.max(0, Math.sin((u / 520) * TAU));
      p.j.Arm_1_R = [-0.35 * up, 0, ARMS - 1.5 * up];
      p.j.Arm_2_R = [0, 1.75 * up, 0];
      p.j.Arm_1_L = [0.15, 0, -(ARMS - 0.4)];
      p.j.Arm_2_L = [0, -1.25, 0];
      p.j.Head = [0.1 * nod * up, 0.15 * Math.sin(u / 900), 0.12 * up];
      p.j.Spine_1 = [0, 0.12 * Math.sin(u / 1300), 0.04];
      break;
    }
    case 'dart': {
      // aim (the hand by the face), back, the throw (the arm out straight at the board), the follow-through
      const aim = ramp(u, 0, 500), back = hump(u, 850, at), out = ramp(u, at - 80, at + 60) * (1 - ramp(u, ms - 700, ms - 200));
      p.j.Arm_1_R = [(-1.25 - 0.3 * out) * aim, 0, ARMS - 0.6 * aim];
      p.j.Arm_2_R = [0, (1.6 + 0.4 * back) * aim * (1 - out) + 0.2 * out, 0];
      p.j.Hand_R = [-0.3 * back + 0.4 * out, 0, 0];
      p.j.Arm_1_L = [-0.2, 0, -(ARMS - 0.3)];
      p.j.Spine_1 = [0.05 + 0.12 * out, 0.08 * aim, 0];
      p.j.Head = [0.04, -0.08 * aim, 0];
      break;
    }
    case 'cue': {
      // bent over the table, the left hand out on the cloth (the bridge), the right drawing the cue back and through
      // twice, then the strike, held
      const bend = ramp(u, 0, 500) * (1 - ramp(u, ms - 600, ms - 150)), drawn = u < at ? Math.sin((u / (at / 2.5)) * TAU) * 0.5 + 0.5 : 0;
      const strike = hump(u, at - 120, at + 60);
      p.j.Spine_1 = [0.62 * bend, 0.1 * bend, 0];
      p.j.Head = [-0.4 * bend, -0.06 * bend, 0];
      p.j.Arm_1_L = [-1.25 * bend, 0.1, -(ARMS - 0.3 * bend)];
      p.j.Arm_2_L = [0, -0.2 * bend, 0];
      p.j.Arm_1_R = [(-0.35 + 0.35 * drawn - 0.3 * strike) * bend, 0, ARMS - 0.25 * bend];
      p.j.Arm_2_R = [0, (0.9 + 0.6 * drawn - 0.5 * strike) * bend, 0];
      squat(p, body, 0.12 * body.thigh * bend);
      break;
    }
    case 'shoot': {
      // the ball at the chest, a dip, up over the head and away (a hop with it), the wrists flicked after it
      const dip = hump(u, 300, at - 100), up = ramp(u, at - 400, at), hop = hump(u, at - 150, at + 350);
      const down = ramp(u, ms - 700, ms - 200);
      squat(p, body, 0.35 * body.thigh * dip);
      p.j.Arm_1_L = [(-1.0 - 1.4 * up) * (1 - down), 0, -(ARMS - 0.55) * (1 - down) - ARMS * down];
      p.j.Arm_1_R = [(-1.0 - 1.4 * up) * (1 - down), 0, (ARMS - 0.55) * (1 - down) + ARMS * down];
      p.j.Arm_2_L = [0, -(1.3 - 1.0 * up) * (1 - down), 0];
      p.j.Arm_2_R = [0, (1.3 - 1.0 * up) * (1 - down), 0];
      p.j.Hand_L = [0.5 * ramp(u, at, at + 150) * (1 - down), 0, 0];
      p.j.Hand_R = [0.5 * ramp(u, at, at + 150) * (1 - down), 0, 0];
      p.j.Head = [-0.25 * up * (1 - down), 0, 0];
      p.y += 0.9 * hop;
      break;
    }
    case 'kick': {
      // the right leg back, then through the ball, the arms out for balance, back down
      const back = hump(u, 150, at), thru = hump(u, at - 80, at + 400);
      p.j.Leg_1_R = [0.55 * back - 1.0 * thru, 0, 0.06];
      p.j.Leg_2_R = [0.95 * back + 0.15 * thru, 0, 0];
      p.j.Ankle_R = [0.3 * thru, 0, 0];
      p.j.Leg_1_L = [0, 0, -0.06];
      p.j.Arm_1_L = [-0.35 * thru + 0.3 * back, 0, -(ARMS - 0.45)];
      p.j.Arm_1_R = [0.35 * thru - 0.3 * back, 0, ARMS - 0.45];
      p.j.Spine_1 = [0.1 * back - 0.1 * thru, 0, 0];
      p.j.Head = [0.18, 0, 0];
      break;
    }
  }
  return p;
}

/** A one-off: one of ACTS, or a use stood at played in place a while (its piece on a table, nowhere to stand at it:
 *  its loop, this phone's alone). */
export type Once = Act | StandUse;
/** How long a use stood at plays in place (ms). */
export const ONCE_MS = 4800;
const isAct = (a: Once): a is Act => a in ACTS;
export const onceMs = (a: Once): number => (isAct(a) ? ACTS[a].ms : ONCE_MS);

/** A one-off's pose `u` ms in (over the idle, faded in and out; `out` reused). */
export function actPose(a: Once, u: number, body: Body, idlePose: Pose, out: Pose = poseBuf()): Pose {
  const ms = onceMs(a), k = Math.min(ms, Math.max(0, u));
  const w = Math.min(smooth01(clamp01(u / IN_MS)), smooth01(clamp01((ms - u) / OUT_MS)));
  return over(idlePose, isAct(a) ? actOwn(a, k, body) : STAND_USES[a].pose(k, { phase: 0, speed: 0, body, seed: 0 }), w, out);
}

/** Whether a one-off's prop is in the hands `u` ms in: a drink's, the camera, the phone, a use's the whole way; a dart,
 *  a ball till they're let go of (then standFx flies them). The kick's ball is never held. */
export function heldIn(a: Once, u: number): boolean {
  if (u < 0 || u >= onceMs(a)) return false;
  if (a === 'dart' || a === 'shoot') return u < ACTS[a].at;
  return a !== 'kick';
}
