// A tank's swimmers (docs/design.md "The museum"), pure: a few rules of a boid each frame, NH's aquarium's calm. Each
// fish wanders on its own slow heading (a smooth noise of its seed and the time), keeps mostly along its tank's long
// side, turns away from the glass before it gets there, keeps off the others' bodies, rises and dips only a little;
// its speed is its own (a big fish slow, a little one quick) within bounds. All of its body (its model's box, turned
// any way, pitched as it can, its tail swaying: reachOf) stays in the water: the step clamps its middle inside. A bottom walker (the crawfish, the mitten crab: NH's, on the sand) walks instead
// (stepWalker). Plain arrays, no allocation in a step (the frames call it for every fish on show).
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
}

/** The most a swimmer pitches up or down (radians). */
const MAX_PITCH = 0.35;
/** How far a body reaches from its middle, sideways and up (u), at any heading and a pitch up to MAX_PITCH: its
 *  model's box's half sizes (across, up, along) and its tail's sway (across, either side). A box's corner (x, y, z)
 *  pitched by p lies √(x² + (y sin p + z cos p)²) out and |y cos p − z sin p| up; turning keeps the first. */
export function reachOf(hx: number, hy: number, hz: number, sway = 0, pitch = MAX_PITCH): [number, number] {
  const s = Math.sin(pitch);
  return [Math.hypot(hx + sway, hz + hy * s), hy + hz * s];
}
/** A swimmer's heading and pitch (what its matrix is drawn by): a walker's facing level, else its way, nose up a
 *  little as it rises (never past MAX_PITCH). */
export function poseOf(f: Swimmer): [yaw: number, pitch: number] {
  if (f.face !== undefined) return [f.face, 0];
  const sp = Math.hypot(f.v[0], f.v[2]);
  return [Math.atan2(f.v[0], f.v[2]), Math.max(-MAX_PITCH, Math.min(MAX_PITCH, -Math.atan2(f.v[1], Math.max(0.01, sp)) * 0.6))];
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

/** A swimmer set off somewhere in its water (seeded: the same on every phone, each time). */
export function spawn(water: Box, r: number, reach: [number, number], speed: number, seed: number): Swimmer {
  const b = swimBox(water, reach);
  const f = (k: number) => (Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1;
  const u = (k: number) => Math.abs(f(k));
  const a = u(4) * Math.PI * 2;
  return { p: [b.x0 + (b.x1 - b.x0) * u(1), b.y0 + (b.y1 - b.y0) * u(2), b.z0 + (b.z1 - b.z0) * u(3)], v: [Math.sin(a) * speed, 0, Math.cos(a) * speed], speed, r, reach, seed };
}

/** One step of every swimmer in one tank (dt seconds, t the time in seconds). */
export function stepSchool(fish: Swimmer[], water: Box, dt: number, t: number): void {
  const along = water.x1 - water.x0 >= water.z1 - water.z0;
  const h = Math.min(0.1, Math.max(0, dt));
  for (let i = 0; i < fish.length; i++) {
    const s = fish[i], b = swimBox(water, s.reach, tmp), x = s.p[0], y = s.p[1], z = s.p[2];
    let vx = s.v[0], vy = s.v[1], vz = s.v[2];
    // its own wandering heading (along the tank's long side mostly), turned toward slowly
    const w = t * (0.12 + (s.seed % 7) * 0.012) + s.seed;
    const ang = Math.sin(w) * 2.4 + Math.sin(w * 0.37 + 1.3) * 1.6;
    let dx = Math.sin(ang), dz = Math.cos(ang);
    if (along) dz *= 0.45;
    else dx *= 0.45;
    const dy = Math.sin(w * 0.8 + 2.1) * 0.12;
    const k = 0.9 * h;
    vx += (dx * s.speed - vx) * k;
    vz += (dz * s.speed - vz) * k;
    vy += (dy * s.speed - vy) * k;
    // the glass ahead: turned away (harder the nearer)
    const m = s.r * 0.6 + 3;
    const push = (d: number) => (d < m ? (1 - d / m) * s.speed * 3 * h : 0);
    vx += push(x - b.x0) - push(b.x1 - x);
    vz += push(z - b.z0) - push(b.z1 - z);
    vy += (push(y - b.y0) - push(b.y1 - y)) * 0.5;
    // the others: kept off each other's bodies
    for (let j = 0; j < fish.length; j++) {
      if (j === i) continue;
      const o = fish[j], ox = x - o.p[0], oy = y - o.p[1], oz = z - o.p[2];
      const d2 = ox * ox + oy * oy + oz * oz, near = (s.r + o.r) * 0.7;
      if (d2 > near * near || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), f = ((near - d) / near) * s.speed * 2 * h;
      vx += (ox / d) * f;
      vy += (oy / d) * f * 0.3;
      vz += (oz / d) * f;
    }
    // its speed within bounds, level mostly
    const sp = Math.hypot(vx, vy, vz), lo = s.speed * 0.45, hi = s.speed * 1.3;
    if (sp > hi || (sp < lo && sp > 1e-6)) {
      const c = (sp > hi ? hi : lo) / sp;
      vx *= c;
      vy *= c;
      vz *= c;
    }
    vy = Math.max(-s.speed * 0.25, Math.min(s.speed * 0.25, vy));
    // on, and never out of the water
    s.p[0] = Math.min(b.x1, Math.max(b.x0, x + vx * h));
    s.p[1] = Math.min(b.y1, Math.max(b.y0, y + vy * h));
    s.p[2] = Math.min(b.z1, Math.max(b.z0, z + vz * h));
    s.v[0] = vx;
    s.v[1] = vy;
    s.v[2] = vz;
  }
}

const hash = (seed: number, k: number): number => Math.abs((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1);
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
