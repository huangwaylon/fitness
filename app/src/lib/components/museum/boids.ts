// A tank's swimmers (docs/design.md "The museum"), pure: NH's aquarium's calm. Each fish swims long, gently curving
// passes along its tank's long side, turning round only near its ends: a leg at a time to a spot near the far end (now
// and then one partway), at its depth (bandOf: a flounder low, a sunfish high), drifting up and down a little. Its
// heading turns no faster than its size allows (turnOf: a big fish wide and slow, a little one quicker), its turn eased
// in and out, its body banked a little into it. Its pace is its own: cruising, a slow drift, now and then a pause
// hovering, then a glide off (a few strong beats of its tail, then coasting); its tail beats with its speed. It steers
// early and softly off the glass (a look ahead, the water inset by its turning room) and the others' bodies (a light
// separation, no schooling: each tank's fish are one of a kind), and slows as it nears the glass ahead, so it never
// turns sharply in a corner: a turn round at an end is slow, wide as the water lets it. All of its body (its model's box,
// turned any way, pitched and rolled as it can, its tail swaying: reachOf) stays in the water: the step clamps its
// middle inside. A bottom walker (the crawfish, the mitten crab: NH's, on the sand) walks instead (stepWalker). Plain
// arrays and numbers, no allocation in a step (the frames call it for every fish on show).
import type { Box } from './tanks.ts';

export interface Swimmer {
  /** Where (x, y, z) and its velocity (u/s). */
  p: [number, number, number];
  v: [number, number, number];
  /** Its cruising speed (u/s) and half its body's length (u). */
  speed: number;
  r: number;
  /** How far its body reaches from its middle, sideways and up (reachOf, at its drawn size). */
  reach: [number, number];
  /** Its own noise's seed. */
  seed: number;
  /** A walker's heading (radians, as atan2(x, z)): what it faces, not always its way (a crab's is square to it). */
  face?: number;
  /** Its heading (radians, as atan2(x, z)), its speed along it (u/s), how fast it's turning (rad/s), its roll (rad). */
  yaw: number;
  u: number;
  turn: number;
  roll: number;
  /** Its depth: the part of its water's height it keeps to (0 the sand, 1 the surface). */
  band: readonly [number, number];
  /** Where its leg goes, which way that is along its tank's long side (±1), and how many legs it's swum. */
  goal: [number, number, number];
  way: number;
  leg: number;
  /** Its pace: how many bouts, this one's kind (PACE) and speed (a share of its cruise), and when it ends (s). */
  bout: number;
  mode: number;
  pace: number;
  until: number;
  /** Its tail: its beat's phase (rad) and how wide it sways (0…1 of its sway). */
  beat: number;
  kick: number;
}

/** The most a swimmer pitches up or down, and rolls into a turn (radians). */
const MAX_PITCH = 0.35;
const MAX_ROLL = 0.22;
/** How far a body reaches from its middle, sideways and up (u), at any heading, a pitch up to MAX_PITCH and a roll up
 *  to MAX_ROLL: its model's box's half sizes (across, up, along) and its tail's sway (across, either side). Rolled about
 *  its length its cross-section's half sizes grow to a = x cos r + y sin r, b = x sin r + y cos r; a box's corner
 *  (a, b, z) pitched by p lies √(a² + (b sin p + z cos p)²) out and |b cos p − z sin p| up; turning keeps the first. */
export function reachOf(hx: number, hy: number, hz: number, sway = 0, pitch = MAX_PITCH, roll = MAX_ROLL): [number, number] {
  const s = Math.sin(pitch), x = hx + sway;
  const a = x * Math.cos(roll) + hy * Math.sin(roll), b = x * Math.sin(roll) + hy * Math.cos(roll);
  return [Math.hypot(a, hz + b * s), b + hz * s];
}
const POSE: [yaw: number, pitch: number, roll: number] = [0, 0, 0];
/** A swimmer's heading, pitch and roll (what its matrix is drawn by: yaw, then pitch, then roll about its length): a
 *  walker's facing level, else its heading, nose up a little as it rises (never past MAX_PITCH), banked into its turn.
 *  (One shared tuple, rewritten each call: nothing allocated.) */
export function poseOf(f: Swimmer): readonly [yaw: number, pitch: number, roll: number] {
  if (f.face !== undefined) {
    POSE[0] = f.face;
    POSE[1] = POSE[2] = 0;
    return POSE;
  }
  const sp = Math.hypot(f.v[0], f.v[2]);
  POSE[0] = f.yaw;
  POSE[1] = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, -Math.atan2(f.v[1], Math.max(0.01, sp)) * 0.6));
  POSE[2] = Math.max(-MAX_ROLL, Math.min(MAX_ROLL, f.roll));
  return POSE;
}

/** The box a swimmer's middle keeps to: the water less its reach (reachOf), so all of it stays in. */
export function swimBox(water: Box, reach: readonly [number, number], out: Box = { x0: 0, x1: 0, y0: 0, y1: 0, z0: 0, z1: 0 }): Box {
  const ix = Math.min(reach[0], (water.x1 - water.x0) / 2), iz = Math.min(reach[0], (water.z1 - water.z0) / 2);
  const iy = Math.min(reach[1], (water.y1 - water.y0) / 2);
  out.x0 = water.x0 + ix;
  out.x1 = water.x1 - ix;
  out.y0 = water.y0 + iy;
  out.y1 = water.y1 - iy;
  out.z0 = water.z0 + iz;
  out.z1 = water.z1 - iz;
  return out;
}
const tmp: Box = { x0: 0, x1: 0, y0: 0, y1: 0, z0: 0, z1: 0 };

/** How fast a fish of half-length r may turn (rad/s): a little one (r 3) about 1.5, a whale shark (r 10) 0.8, never
 *  under 0.45. */
export const turnOf = (r: number): number => Math.max(0.45, Math.min(1.5, 2.6 / Math.sqrt(Math.max(1, r))));
/** A fish's cruise (u/s, at its drawn size): a big one slower for its length (a little one ~0.7 lengths a second, a
 *  whale shark ~0.35). */
export const cruiseOf = (r: number): number => 2.2 + r * 0.45;

/** Where each species keeps in its water's height (0 the sand, 1 the surface; NH's: the flatfish and rays on the
 *  bottom, the eels and the turtles low, the sunfish and the surface feeders high); any other the middle. */
const BANDS: Readonly<Record<string, readonly [number, number]>> = {
  'olive-flounder': [0, 0.12], dab: [0, 0.12], ray: [0.02, 0.25], 'saw-shark': [0.05, 0.3], 'moray-eel': [0, 0.25], 'ribbon-eel': [0, 0.3],
  'zebra-turkeyfish': [0.1, 0.45], 'sea-horse': [0.15, 0.5], 'barred-knifejaw': [0.15, 0.6], 'ocean-sunfish': [0.6, 1], 'mahi-mahi': [0.5, 0.95],
  tuna: [0.4, 0.9], 'blue-marlin': [0.45, 0.9], suckerfish: [0.4, 0.85], 'whale-shark': [0.4, 0.9],
  coelacanth: [0, 0.35], 'football-fish': [0, 0.4], barreleye: [0.1, 0.5], 'sea-butterfly': [0.55, 1], squid: [0.3, 0.85], oarfish: [0.25, 0.85],
  loach: [0, 0.15], catfish: [0, 0.2], 'freshwater-goby': [0, 0.2], sturgeon: [0, 0.25], 'saddled-bichir': [0, 0.25], 'soft-shelled-turtle': [0, 0.3],
  'snapping-turtle': [0, 0.3], tadpole: [0.4, 0.9], frog: [0.6, 1], killifish: [0.6, 1], guppy: [0.5, 1], 'pond-smelt': [0.4, 0.9],
  arowana: [0.65, 1], gar: [0.55, 1], arapaima: [0.45, 0.95], 'neon-tetra': [0.3, 0.8], angelfish: [0.3, 0.8], 'giant-snakehead': [0.1, 0.5]
};
const MID: readonly [number, number] = [0.2, 0.8];
export const bandOf = (id: string): readonly [number, number] => BANDS[id] ?? MID;

const hash = (seed: number, k: number): number => Math.abs((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1);
/** A swimmer set off somewhere in its water (seeded: the same on every phone, each time), at its depth. */
export function spawn(water: Box, r: number, reach: [number, number], speed: number, seed: number, band: readonly [number, number] = MID): Swimmer {
  const b = swimBox(water, reach);
  const u = (k: number) => hash(seed, k);
  const a = u(4) * Math.PI * 2, y = b.y0 + (b.y1 - b.y0) * (band[0] + (band[1] - band[0]) * u(2));
  const f: Swimmer = {
    p: [b.x0 + (b.x1 - b.x0) * u(1), y, b.z0 + (b.z1 - b.z0) * u(3)], v: [Math.sin(a) * speed, 0, Math.cos(a) * speed], speed, r, reach, seed,
    yaw: a, u: speed, turn: 0, roll: 0, band, goal: [0, y, 0], way: 1, leg: 0, bout: 0, mode: CRUISE, pace: 1, until: -Infinity, beat: u(5) * 6, kick: 1
  };
  nextLeg(f, b, false);
  return f;
}

/** A pace's kinds: cruising, a slow drift, a pause hovering, the glide off after it. */
const CRUISE = 0, DRIFT = 1, HOVER = 2, GLIDE = 3;
/** The next bout of a swimmer's pace from time t (a hover always followed by a glide). */
function nextPace(s: Swimmer, t: number, mode = -1): void {
  const n = ++s.bout, a = hash(s.seed, n * 3.17), c = hash(s.seed, n * 5.31 + 0.5);
  if (mode < 0) mode = s.mode === HOVER ? GLIDE : a < 0.55 ? CRUISE : a < 0.85 ? DRIFT : HOVER;
  s.mode = mode;
  s.pace = mode === CRUISE ? 0.85 + 0.25 * c : mode === DRIFT ? 0.35 + 0.15 * c : mode === HOVER ? 0.05 : 1.15;
  s.until = t + (mode === CRUISE ? 5 + 7 * c : mode === DRIFT ? 3 + 4 * c : mode === HOVER ? 1.5 + 2.5 * c : 1.6 + c);
}
/** How far in from each end of its water a swimmer turns round (u): its turning room, at most a fifth of the length. */
const endRoom = (s: Swimmer, len: number): number => Math.min(len * 0.2, (s.speed / turnOf(s.r)) * 1.2 + s.r * 0.3);
/** A swimmer's next leg: to a spot near the end it's facing away from (a long pass), now and then one partway; across
 *  and up anywhere in its band. */
function nextLeg(s: Swimmer, b: Box, pause: boolean): boolean {
  const n = ++s.leg, along = b.x1 - b.x0 >= b.z1 - b.z0, L = along ? 0 : 2, C = 2 - L;
  const lo = L ? b.z0 : b.x0, hi = L ? b.z1 : b.x1, c0 = C ? b.z0 : b.x0, c1 = C ? b.z1 : b.x1, len = hi - lo;
  const room = endRoom(s, len), a = hash(s.seed, n * 1.37), far = s.p[L] - lo < hi - s.p[L];
  // (toward the far end, the goal within its last stretch; a quarter of legs stop partway)
  const k = a < 0.25 ? 0.3 + 0.4 * hash(s.seed, n * 2.11) : 1 - 0.15 * hash(s.seed, n * 2.11);
  s.goal[L] = far ? lo + room + (len - 2 * room) * k : hi - room - (len - 2 * room) * k;
  s.goal[C] = c0 + (c1 - c0) * (0.2 + 0.6 * hash(s.seed, n * 4.03));
  s.goal[1] = b.y0 + (b.y1 - b.y0) * (s.band[0] + (s.band[1] - s.band[0]) * hash(s.seed, n * 6.71));
  s.way = s.goal[L] >= s.p[L] ? 1 : -1;
  // (a leg's end, now and then: a pause there)
  return pause && s.mode !== HOVER && hash(s.seed, n * 7.9) < 0.3;
}

/** One step of every swimmer in one tank (dt seconds, t the time in seconds). */
export function stepSchool(fish: Swimmer[], water: Box, dt: number, t: number): void {
  const h = Math.min(0.1, Math.max(0, dt));
  for (let i = 0; i < fish.length; i++) {
    const s = fish[i], b = swimBox(water, s.reach, tmp), x = s.p[0], y = s.p[1], z = s.p[2];
    const along = b.x1 - b.x0 >= b.z1 - b.z0, w = turnOf(s.r), cruise = s.speed;
    // its pace (a new bout when this one's over, or the clock jumped: a tank back on screen)
    if (t >= s.until || s.until - t > 20) nextPace(s, t);
    // its leg: the next once it's there (or past it, along the long side)
    // (along the long side only: a goal beside it, inside its turning circle, never circled round)
    const L = along ? 0 : 2;
    if ((s.goal[L] - s.p[L]) * s.way < Math.max(2, s.r * 0.6) && nextLeg(s, b, true)) nextPace(s, t, HOVER);
    // where it wants to head: its goal, a little wander about it
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    let dx = s.goal[0] - x, dz = s.goal[2] - z;
    const dn = Math.hypot(dx, dz) || 1, wa = 0.22 * Math.sin(t * 0.23 + s.seed) + 0.12 * Math.sin(t * 0.61 + s.seed * 1.7);
    const cw = Math.cos(wa), sw = Math.sin(wa);
    const ux = dx / dn, uz = dz / dn;
    dx = ux * cw + uz * sw;
    dz = uz * cw - ux * sw;
    // the glass ahead: a point a little ahead, pushed back softly from the water inset by its turning room
    const look = s.r * 0.5 + s.u * 1.2;
    const qx = x + fx * look, qz = z + fz * look;
    const room = cruise / w;
    const mx = Math.min(room, (b.x1 - b.x0) * (along ? 0.2 : 0.45)), mz = Math.min(room, (b.z1 - b.z0) * (along ? 0.45 : 0.2));
    const soft = (d: number, m: number) => (d < m ? ((m - d) / Math.max(1e-6, m)) ** 2 * 2 : 0);
    dx += soft(qx - b.x0, mx) - soft(b.x1 - qx, mx);
    dz += soft(qz - b.z0, mz) - soft(b.z1 - qz, mz);
    // the others' bodies: kept off lightly (and slowed behind one ahead)
    let slow = 1, vyAway = 0;
    for (let j = 0; j < fish.length; j++) {
      if (j === i) continue;
      const o = fish[j], ox = x - o.p[0], oy = y - o.p[1], oz = z - o.p[2];
      const near = (s.r + o.r) * 0.9 + 2, d2 = ox * ox + oy * oy + oz * oz;
      if (d2 > near * near || d2 < 1e-9) continue;
      const d = Math.sqrt(d2), k = (1 - d / near) * 1.2;
      dx += (ox / d) * k;
      dz += (oz / d) * k;
      vyAway += (oy / d) * k * 0.3 * cruise;
      // (one just ahead: slowed)
      if (-(ox * fx + oz * fz) > d * 0.6) slow = Math.min(slow, 0.4 + 0.6 * (d / near));
    }
    // turned toward its way at no more than its own rate, eased in and out (a turn round toward the side with room)
    let err = Math.atan2(dx, dz) - s.yaw;
    err = Math.atan2(Math.sin(err), Math.cos(err));
    if (Math.abs(err) > 2.6) {
      const side = ((b.x0 + b.x1) / 2 - x) * fz - ((b.z0 + b.z1) / 2 - z) * fx;
      err = side >= 0 ? Math.abs(err) : -Math.abs(err);
    }
    const want = Math.max(-w, Math.min(w, err * 1.4));
    s.turn += Math.max(-w * 1.5 * h, Math.min(w * 1.5 * h, want - s.turn));
    s.yaw = Math.atan2(Math.sin(s.yaw + s.turn * h), Math.cos(s.yaw + s.turn * h));
    // its speed: its pace's, slower turning round, slowed with the glass ahead (its turn's room shrinking) and behind
    // another; eased (a glide's start brisk, its slowing gentle)
    const ahead = rayOut(x, z, fx, fz, b);
    let target = cruise * s.pace * slow * Math.max(0.3, Math.cos(err / 2));
    target = Math.min(target, Math.max(cruise * 0.05, 0.7 * w * (ahead - 0.5)));
    const du = target - s.u, acc = du > 0 ? cruise * (s.mode === GLIDE ? 1.2 : 0.45) : cruise * 1.1;
    s.u = Math.max(cruise * 0.04, s.u + Math.max(-acc * h, Math.min(acc * h, du)));
    // up and down: toward its leg's depth, a slow drift about it
    const band = (b.y1 - b.y0) * (s.band[1] - s.band[0]);
    const ty = Math.min(b.y1, Math.max(b.y0, s.goal[1] + band * 0.2 * Math.sin(t * 0.17 + s.seed * 0.9)));
    const vmax = cruise * 0.06 + s.u * 0.22;
    const vyT = Math.max(-vmax, Math.min(vmax, (ty - y) * 0.3 + vyAway));
    let vy = s.v[1] + (vyT - s.v[1]) * Math.min(1, h * 1.5);
    // banked into its turn (less as it slows)
    s.roll += (-(s.turn / w) * MAX_ROLL * Math.min(1, s.u / (cruise * 0.5)) - s.roll) * Math.min(1, h * 2);
    // its tail: wider and quicker the faster, a burst as it speeds up
    const push = Math.max(0, du) / cruise, sp = s.u / cruise;
    s.kick += (Math.min(1, 0.25 + 0.7 * sp + push * 1.2) - s.kick) * Math.min(1, h * 3);
    s.beat = (s.beat + h * (1.5 + 3.5 * sp + push * 5)) % (Math.PI * 200);
    // on, and never out of the water
    const vx = Math.sin(s.yaw) * s.u, vz = Math.cos(s.yaw) * s.u;
    s.p[0] = Math.min(b.x1, Math.max(b.x0, x + vx * h));
    s.p[2] = Math.min(b.z1, Math.max(b.z0, z + vz * h));
    const ny = Math.min(b.y1, Math.max(b.y0, y + vy * h));
    if (ny !== y + vy * h) vy = 0;
    s.p[1] = ny;
    s.v[0] = vx;
    s.v[1] = vy;
    s.v[2] = vz;
  }
}
/** How far (u) from (x, z) heading (fx, fz) to the edge of box b, level. */
function rayOut(x: number, z: number, fx: number, fz: number, b: Box): number {
  const tx = fx > 1e-6 ? (b.x1 - x) / fx : fx < -1e-6 ? (b.x0 - x) / fx : Infinity;
  const tz = fz > 1e-6 ? (b.z1 - z) / fz : fz < -1e-6 ? (b.z0 - z) / fz : Infinity;
  return Math.max(0, Math.min(tx, tz));
}

/** How long a walker's bout is (s): a walk to a spot on the sand, then a rest there. */
const BOUT = 3.2;
/** How far a walker's spots lie from its patch's middle (u). */
const PATCH = 5;

/** One step of a bottom walker on its tank's sand (its y kept): each bout a walk to a spot of its own about its patch
 *  (both seeded: the same on every phone), then a rest. A crab goes sideways (its body square to its way, NH's scuttle: whichever
 *  side is nearer its facing), anything else turns to its way and walks ahead; one about to walk into another waits. */
export function stepWalker(s: Swimmer, water: Box, dt: number, t: number, sideways: boolean, others: readonly Swimmer[] = []): void {
  const b = swimBox(water, s.reach, tmp), h = Math.min(0.1, Math.max(0, dt));
  const n = Math.floor(t / BOUT + (s.seed % 7) / 7);
  // (its spots about a patch of its own: a short walk each, in any size of tank)
  const hx = b.x0 + (b.x1 - b.x0) * hash(s.seed, 0.25), hz = b.z0 + (b.z1 - b.z0) * hash(s.seed, 0.75);
  const tx = Math.min(b.x1, Math.max(b.x0, hx + (hash(s.seed, n) - 0.5) * 2 * PATCH)), tz = Math.min(b.z1, Math.max(b.z0, hz + (hash(s.seed, n + 0.5) - 0.5) * 2 * PATCH));
  const dx = tx - s.p[0], dz = tz - s.p[2], d = Math.hypot(dx, dz), step = Math.min(d, s.speed * h);
  s.face ??= Math.atan2(s.v[0], s.v[2]);
  if (d < 0.05) {
    s.v[0] = s.v[1] = s.v[2] = 0;
    return;
  }
  const way = Math.atan2(dx, dz);
  // its facing: a crab's square to its way (the nearer of the two), anything else's toward its way, turned smoothly
  let want = way;
  if (sideways) {
    const l = way + Math.PI / 2, r = way - Math.PI / 2;
    want = Math.abs(wrap(l - s.face)) < Math.abs(wrap(r - s.face)) ? l : r;
  }
  const turn = wrap(want - s.face);
  s.face += Math.sign(turn) * Math.min(Math.abs(turn), 3 * h);
  // (a walker that isn't a crab sets off once it's turned most of the way)
  let go = sideways || Math.abs(turn) < 0.6 ? step : 0;
  for (const o of others) {
    if (o === s) continue;
    const ox = o.p[0] - s.p[0], oz = o.p[2] - s.p[2];
    if (ox * ox + oz * oz < (s.r + o.r) ** 2 * 0.6 && ox * dx + oz * dz > 0) go = 0;
  }
  s.p[0] = Math.min(b.x1, Math.max(b.x0, s.p[0] + (dx / d) * go));
  s.p[2] = Math.min(b.z1, Math.max(b.z0, s.p[2] + (dz / d) * go));
  s.v[0] = h ? ((dx / d) * go) / h : 0;
  s.v[1] = 0;
  s.v[2] = h ? ((dz / d) * go) / h : 0;
}
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
