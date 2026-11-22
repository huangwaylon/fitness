// The poses' shared kit (poses.ts and its use registries, poses-stand.ts and poses-ride.ts): the pose's shape, the
// body's measures and the small helpers every pose is built from. A registry's entry (UseDef) is one looped use: its
// rep, how it's got onto (stood, sat or lain on: seats3d.ts) and its pose at t. Apart from poses.ts so the registries
// import it without a cycle. Pure.

export type V3 = readonly [number, number, number];
export const JOINTS = [
  'Spine_1', 'Spine_2', 'Spine_3', 'Neck', 'Head', 'Clavicle_L', 'Clavicle_R', 'Arm_1_L', 'Arm_1_R', 'Arm_2_L', 'Arm_2_R', 'Hand_L', 'Hand_R',
  'Leg_1_L', 'Leg_1_R', 'Leg_2_L', 'Leg_2_R', 'Ankle_L', 'Ankle_R', 'TailRoot', 'Tail_1', 'Side_Ear_1_L', 'Side_Ear_1_R',
  // (the beak's two halves and an owl's ear tufts: the museum's curator, museum/curator.ts)
  'Mouth', 'Mouth_U', 'Crest_L', 'Crest_R'
] as const;
export type Joint = (typeof JOINTS)[number];

export interface Pose {
  /** Joint → rotation (radians about the model's x, y, z at rest). A joint not named is at rest. */
  j: Partial<Record<Joint, V3>>;
  /** The body lifted (model units), squashed (1 none; under 1 squat and wider), pitched (radians: −π/2 lies it on its
   *  back, its head away from the camera; +π/2 on its front, face down). */
  y: number;
  sq: number;
  pitch: number;
  /** The body turned about its feet (radians, three's yaw: + from its front toward its left), before the pitch: the
   *  yoga's poses facing along the mat. Absent: none. */
  yaw?: number;
  /** On a piece used in place, the body moved forward (model units; − back): a pull-up's short arms brought under the
   *  bar. None: 0. */
  z?: number;
}

/** A villager's measures (model units), from its bones at rest: the thigh's and the shin's length, the hips' height;
 *  the shoulder's joint (out from the middle, up) and the upper arm's and the forearm's length (a pose reaching for a
 *  bar: pull-ups). */
export interface Body {
  thigh: number;
  shin: number;
  hip: number;
  /** The shoulders' height and an arm's reach (shoulder to the palm), where a pose needs the hands on the floor (the
   *  yoga's plank, the dog): rig.ts measures them, else from the hips' height (armOf, shoulderOf). */
  arm?: number;
  sh?: number;
  /** The ankle joint's height over the sole (rig.ts measures it): the walk's feet on the ground (gait.ts). */
  ankle?: number;
  /** The shoulder's joint out from the middle, the upper arm's and the forearm's length (a pose reaching for a bar:
   *  the pull-up's, poses.ts reachTo): rig.ts measures them. */
  limb?: readonly [number, number, number];
}
/** The shoulders' height and an arm's reach, measured or from the hips' (a villager's proportions). */
export const shoulderOf = (b: Body): number => b.sh ?? 2.05 * b.hip;
export const armOf = (b: Body): number => b.arm ?? 1.15 * b.hip;

/** The arms lowered from NH's T (radians about z): by the sides, a little out. */
export const ARMS = 1.22;
export const TAU = Math.PI * 2;
/** A smooth, slow wander in −1 … 1 (two sines out of step: no randomness, so a frame is reproducible). */
export const drift = (t: number, seed: number) => 0.6 * Math.sin(t * 0.00041 + seed * 1.7) + 0.4 * Math.sin(t * 0.00097 + seed * 4.1);

export const rest = (): Pose => ({ j: {}, y: 0, sq: 1, pitch: 0 });
export const arms = (p: Pose, down = ARMS, fwd = 0, elbow = 0) => {
  p.j.Arm_1_L = [fwd, 0, -down];
  p.j.Arm_1_R = [fwd, 0, down];
  if (elbow) {
    p.j.Arm_2_L = [0, -elbow, 0];
    p.j.Arm_2_R = [0, elbow, 0];
  }
  return p;
};
/** Breathing (a period of `ms`): the chest rises and the body barely swells. */
export const breathe = (p: Pose, t: number, ms: number, k: number) => {
  const b = Math.sin((t / ms) * TAU);
  p.j.Spine_2 = add(p.j.Spine_2, [-0.03 * k * b, 0, 0]);
  p.sq *= 1 + 0.014 * k * b;
  return b;
};
export const add = (a: V3 | undefined, b: V3): V3 => (a ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : b);
/** Where t is in a cycle of `ms` (0 … 1), shifted by the seed. */
export const cyc = (t: number, ms: number, seed = 0) => ((((t + seed * 137) % ms) + ms) % ms) / ms;

/** Sitting on a seat `h` model units over the floor (its hips' joint that high, the caller's: villager3d sitAt), NH's:
 *  thighs forward, the hands in the lap, its back upright against the seat's back (`back`) or a little forward on a
 *  stool. A seat higher than its shins leaves its feet dangling (swinging a little); a lower one has its feet on the
 *  floor, the knees up as far as the seat is low (a cushion's: knees up, feet out). The hips are the group's origin:
 *  no lift here. */
export function sitOn(t: number, body: Body, h: number, back: boolean, seed = 0, ride = false): Pose {
  const p = arms(rest(), ARMS + 0.12, -0.55, 0.7);
  breathe(p, t, 3400, 1);
  const reach = body.shin + 0.25;
  // the thigh raised above level by th (knees up) so that a shin hanging straight down just reaches the floor
  const th = h >= reach ? 0 : Math.min(1.05, Math.asin(Math.min(1, (reach - h) / Math.max(0.5, body.thigh))));
  const kick = h >= reach ? Math.sin(t / 520 + seed) * 0.22 : 0;
  // (a deep, low seat: the knees a little apart; astride a rocking horse or a ride-on, the thighs out round its body)
  const out = ride ? STRADDLE : 0.06 + 0.25 * (th / 1.05);
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

/** Astride (a rocking horse, a ride-on): each thigh this far out (radians about z) round the seat's body. */
export const STRADDLE = 0.5;

/** How high a sitting villager's seat is (model units) over its origin: its hips stay over the origin (they're the
 *  pivot), its knees come forward and its feet hang under them. */
export const seatOf = (b: Body): number => b.hip - b.thigh;

/** The legs bent so the hips drop by `d` (villager units), the feet staying put: the thighs forward, the knees bent back
 *  half as far again (the knees out over the toes), the ankles flexed to keep the soles flat. Returns the thigh's angle. */
export function squat(p: Pose, body: Body, d: number): number {
  const L = body.thigh + body.shin, h = Math.max(0.3 * L, L - d);
  // (the thigh's angle a off upright, the shin leaning back half of it: h = thigh·cos a + shin·cos a/2)
  let a = 0;
  for (let i = 0; i < 12; i++) a = Math.acos(Math.min(1, Math.max(-1, (h - body.shin * Math.cos(a / 2)) / body.thigh)));
  p.j.Leg_1_L = add(p.j.Leg_1_L, [-a, 0, -0.07 * a]);
  p.j.Leg_1_R = add(p.j.Leg_1_R, [-a, 0, 0.07 * a]);
  p.j.Leg_2_L = add(p.j.Leg_2_L, [1.5 * a, 0, 0]);
  p.j.Leg_2_R = add(p.j.Leg_2_R, [1.5 * a, 0, 0]);
  p.j.Ankle_L = add(p.j.Ankle_L, [-0.5 * a, 0, 0]);
  p.j.Ankle_R = add(p.j.Ankle_R, [-0.5 * a, 0, 0]);
  p.y += h - L;
  return a;
}

/** A pose to write into (mix's and over's `out`: a character's own, kept from frame to frame). */
export const poseBuf = (): Pose => ({ j: {}, y: 0, sq: 1, pitch: 0 });
const ZERO: V3 = [0, 0, 0];
/** out.j[n] = x + (y − x) · k, in out's own array for the joint (made once). */
function lerpJ(out: Pose, n: Joint, x: V3, y: V3, k: number) {
  const o = (out.j[n] ?? (out.j[n] = [0, 0, 0])) as [number, number, number];
  o[0] = x[0] + (y[0] - x[0]) * k;
  o[1] = x[1] + (y[1] - x[1]) * k;
  o[2] = x[2] + (y[2] - x[2]) * k;
}

/** a → b by k (0 … 1): each joint's rotation, the lift, the squash and the pitch. Into `out` (a buffer of the
 *  caller's, neither a nor b; a new pose without one), its joints neither names let go. */
export function mix(a: Pose, b: Pose, k: number, out: Pose = poseBuf()): Pose {
  if (k <= 0) return a;
  if (k >= 1) return b;
  for (const n of JOINTS) {
    const x = a.j[n], y = b.j[n];
    if (x || y) lerpJ(out, n, x ?? ZERO, y ?? ZERO, k);
    else if (out.j[n]) delete out.j[n];
  }
  out.y = a.y + (b.y - a.y) * k;
  out.sq = a.sq + (b.sq - a.sq) * k;
  out.pitch = a.pitch + (b.pitch - a.pitch) * k;
  const ya = a.yaw ?? 0, yb = b.yaw ?? 0;
  if (ya || yb) out.yaw = ya + (yb - ya) * k;
  else delete out.yaw;
  out.z = (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * k;
  return out;
}

/** An action over a base by its weight: the joints it names replace the base's, its lift adds, its squash multiplies.
 *  Into `out` (a buffer of the caller's, neither b nor a; a new pose without one). */
export function over(b: Pose, a: Pose, w: number, out: Pose = poseBuf()): Pose {
  if (w <= 0) return b;
  for (const n of JOINTS) {
    const x = b.j[n], y = a.j[n];
    if (y) lerpJ(out, n, x ?? ZERO, y, w);
    else if (x) lerpJ(out, n, x, x, 0);
    else if (out.j[n]) delete out.j[n];
  }
  out.y = b.y + a.y * w;
  out.sq = b.sq * (1 + (a.sq - 1) * w);
  out.pitch = b.pitch;
  // (its turn adds: the twirl's spin)
  const yaw = (b.yaw ?? 0) + (a.yaw ?? 0) * w;
  if (yaw) out.yaw = yaw;
  else delete out.yaw;
  out.z = b.z;
  return out;
}

/** What base() hands each pose: the walk's phase and speed, the body, the seed, a seat's height and back, the climb's
 *  top, a pull-up bar's `grip` height and where on it the hands go (`bar`: out from the middle, forward of the feet), a
 *  narrow tub's `upright` soak (its `rim` that far over the seat), a ride-on straddled (`ride`), a bed shorter than the body (`short`: by how much,
 *  the knees drawn up to fit). Heights, grips and lengths in the villager's model units. */
export interface BaseOpts {
  phase: number; speed: number; body: Body; seed: number; seatH?: number; back?: boolean; climb?: number;
  grip?: number; bar?: readonly [number, number]; upright?: boolean; rim?: number; ride?: boolean; short?: number;
}
/** A use in a registry (poses-stand.ts, poses-ride.ts): one rep (ms), how it's got onto (the anchor the feet's when
 *  stood, the hips' when sat, a bed's when lain on: seats3d.ts), its looped pose at t. */
export interface UseDef {
  ms: number;
  on: 'stand' | 'sit' | 'lie';
  pose(t: number, o: BaseOpts): Pose;
}
