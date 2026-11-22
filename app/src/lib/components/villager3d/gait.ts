// The walk (poses.ts base 'walk') and the stop after it, from where the feet are: each foot planted while it bears the
// body (still on the ground while the body passes over it) and swung forward through the air to its next spot, its leg
// solved to reach it (two bones, the knee forward, the sole flat). The stride is the leg's (a player's legs are ~1.7
// times a villager's: a villager's stride on them overstrode, the planted foot slid back and the body floated), so
// every character keeps its feet where they land. Pure; unit-tested (gait.test.ts: the planted foot's drift).
//   phase: the cycles walked (villager3d: the distance over strideOf), the left foot down at 0, the right at 0.5.
import { clamp01, smooth01 } from '#lib/math.ts';
import { ARMS, TAU, arms, rest, type Body, type Pose } from './poses-kit.ts';

/** A villager's leg (hip joint to ankle, model units: Raymond's 2.49), the yardstick of the strides below. */
export const VILLAGER_LEG = 2.49;
/** The ankle joint's height over the sole at rest (model units): measured (rig.ts), else a villager's share. */
export const ankleOf = (b: Body): number => b.ankle ?? 0.13 * b.hip;
/** The leg's length, hip joint to ankle (the legs hang straight at rest). */
export const legOf = (b: Body): number => b.hip - ankleOf(b);
/** A cycle's length (two steps, model units) at `speed` (u/s) on legs of `leg`: ~2.4 legs at a wander (90 u/s, NH's
 *  quick steps: a villager's 2.7 cycles a second), ~4.9 at the run (300 u/s: 4.5 a second, a player's 2.7). */
export const strideOf = (speed: number, leg = VILLAGER_LEG): number => leg * (0.9 + 4 * clamp01(speed / 300));
/** How far ahead of the hips a foot lands (of the leg), at most. */
const REACH = 0.44;
/** A foot's share of the cycle on the ground: a walk's over half (both down a moment), a run's under (a flight). */
const STANCE = [0.2, 0.6] as const;
/** The leg's working length: never straight, a little give in the knee. */
const GIVE = 0.98;
/** How much of the vault over the planted leg the hips keep (the rest smoothed away: a bob, not a pogo). */
const BOB = 0.8;
/** How much a lifted foot's height frees the hips from it. */
const LET_GO = 2;
/** The stop: the feet stepped back under the hips, one then the other (ms). */
export const SETTLE_MS = 380;

/** Where the feet are under the hips (z forward of the hip joint, the lift off the ground; [left, right]) and the hips'
 *  height over the ground (all model units). */
export interface Gait {
  z: [number, number];
  lift: [number, number];
  hip: number;
  /** Each foot's share of the cycle on the ground, how far ahead it lands. */
  stance: number;
  reach: number;
}

/** The gait at `phase` (cycles) and `speed` (u/s) for `body`'s legs. */
export function gaitOf(phase: number, speed: number, body: Body, out?: Gait): Gait {
  const L = legOf(body), S = strideOf(speed, L), k = clamp01(speed / 300);
  const beta = Math.min(STANCE[1], Math.max(STANCE[0], (2 * REACH * L) / S)), A = (beta * S) / 2;
  const g = out ?? { z: [0, 0], lift: [0, 0], hip: 0, stance: beta, reach: A };
  g.stance = beta;
  g.reach = A;
  const H = (0.14 + 0.08 * k) * L, Le = GIVE * L;
  // (a swung foot leaves and lands at the ground's speed: no scuff at either end; its tangents eased by half)
  const m = (-1.5 * A * (1 - beta)) / beta;
  for (let i = 0; i < 2; i++) {
    const f = (((phase + i * 0.5) % 1) + 1) % 1;
    if (f < beta) {
      g.z[i] = A * (1 - (2 * f) / beta);
      g.lift[i] = 0;
    } else {
      const s = (f - beta) / (1 - beta), s2 = s * s, s3 = s2 * s;
      g.z[i] = (2 * s3 - 3 * s2 + 1) * -A + (s3 - 2 * s2 + s) * m + (-2 * s3 + 3 * s2) * A + (s3 - s2) * m;
      g.lift[i] = H * Math.sin(Math.PI * s);
    }
  }
  // the hips: vaulting over the planted feet (as high as the leg reaches over each, BOB of the rise kept); a foot off
  // the ground holds them less as it rises (no jump as it leaves, a run's flight a little up)
  const low = Math.sqrt(Le * Le - A * A);
  let cap = Le;
  for (let i = 0; i < 2; i++) cap = Math.min(cap, Math.sqrt(Math.max(0, Le * Le - g.z[i] * g.z[i])) + LET_GO * g.lift[i]);
  g.hip = low + BOB * (cap - low);
  g.hip += ankleOf(body);
  return g;
}

/** One leg posed (`side` L or R) to put its ankle `z` ahead of the hip joint and `lift` off the ground with the hips
 *  `hip` high: the knee forward, the sole flat (tipped by `toe`: + down). */
function legTo(p: Pose, side: 'L' | 'R', body: Body, z: number, lift: number, hip: number, toe = 0) {
  const t = body.thigh, sh = Math.max(0.2, legOf(body) - t);
  const dy = hip - ankleOf(body) - lift, d = Math.min(t + sh, Math.max(Math.abs(t - sh) + 1e-3, Math.hypot(z, dy)));
  const knee = Math.PI - Math.acos(Math.min(1, Math.max(-1, (t * t + sh * sh - d * d) / (2 * t * sh))));
  const th = Math.atan2(z, dy) + Math.acos(Math.min(1, Math.max(-1, (t * t + d * d - sh * sh) / (2 * t * d))));
  p.j[`Leg_1_${side}`] = [-th, 0, 0];
  p.j[`Leg_2_${side}`] = [knee, 0, 0];
  p.j[`Ankle_${side}`] = [th - knee + toe, 0, 0];
}

const SCRATCH: Gait = { z: [0, 0], lift: [0, 0], hip: 0, stance: 0, reach: 0 };

/** Walking or running at `speed` (u/s), `phase` the cycles walked: the feet planted and swung (gaitOf), the hips
 *  bobbing over them, the arms swinging against the legs, leaning into it. */
export function walk(t: number, phase: number, speed: number, body: Body): Pose {
  const k = clamp01(speed / 300), g = gaitOf(phase, speed, body, SCRATCH);
  const p = arms(rest(), ARMS - 0.08 * k, 0, 0.25 + 0.25 * k);
  for (let i = 0; i < 2; i++) {
    const s = g.lift[i] > 0 ? g.lift[i] / ((0.14 + 0.08 * k) * legOf(body)) : 0;
    legTo(p, i ? 'R' : 'L', body, g.z[i], g.lift[i], g.hip, -0.25 * s);
  }
  p.y = g.hip - body.hip;
  // the arms against the legs (the left back as the left foot's ahead), the body turning with the stride
  const w = (g.z[0] - g.z[1]) / (2 * Math.max(1e-6, g.reach)), a = 0.3 + 0.25 * k;
  p.j.Arm_1_L = [a * w, 0, -(ARMS - 0.08 * k)];
  p.j.Arm_1_R = [-a * w, 0, ARMS - 0.08 * k];
  const up = (g.hip - ankleOf(body)) / legOf(body) - 0.85;
  p.j.Spine_1 = [0.08 + 0.12 * k, 0.1 * w, 0];
  p.j.Head = [-0.05 - 0.05 * k, -0.06 * w, 0.05 * w];
  p.j.TailRoot = [0, 0.35 * Math.sin(phase * TAU * 2), 0];
  p.j.Side_Ear_1_L = [1.2 * up, 0, 0];
  p.j.Side_Ear_1_R = [1.2 * up, 0, 0];
  void t;
  return p;
}

/** The stop (u: 0 … 1 over SETTLE_MS) from the walk's gait `from`: the foot in the air (else the one further out)
 *  set down under the hips, then the other stepped in by it, the hips up to standing; legs and lift into `p`. */
export function settle(p: Pose, u: number, from: Gait, body: Body) {
  const L = legOf(body), Le = L;
  const first = from.lift[0] !== from.lift[1] ? (from.lift[0] > from.lift[1] ? 0 : 1) : Math.abs(from.z[0]) >= Math.abs(from.z[1]) ? 0 : 1;
  const z = [0, 0], lift = [0, 0];
  for (let i = 0; i < 2; i++) {
    const [a, b] = i === first ? [0, 0.55] : [0.45, 1];
    const e = smooth01(clamp01((u - a) / (b - a))), hop = Math.min(0.12 * L, 0.8 * Math.abs(from.z[i]));
    z[i] = from.z[i] * (1 - e);
    lift[i] = from.lift[i] * (1 - e) + hop * Math.sin(Math.PI * e);
  }
  let hip = from.hip + (body.hip - from.hip) * smooth01(u);
  for (let i = 0; i < 2; i++) if (lift[i] < 1e-3) hip = Math.min(hip, ankleOf(body) + Math.sqrt(Math.max(0, Le * Le - z[i] * z[i])));
  for (let i = 0; i < 2; i++) legTo(p, i ? 'R' : 'L', body, z[i], lift[i], hip);
  p.y = hip - body.hip;
}
