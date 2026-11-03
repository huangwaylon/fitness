// A tank's swimmers (docs/design.md "The museum"), pure: a few rules of a boid each frame, NH's aquarium's calm. Each
// fish wanders on its own slow heading (a smooth noise of its seed and the time), keeps mostly along its tank's long
// side, turns away from the glass before it gets there, keeps off the others' bodies, rises and dips only a little;
// its speed is its own (a big fish slow, a little one quick) within bounds. Its body (half its length) never leaves the
// water: the step clamps it inside. Plain arrays, no allocation in a step (the frames call it for every fish on show).
import type { Box } from './tanks.ts';

export interface Swimmer {
  /** Where (x, y, z) and its velocity (u/s). */
  p: [number, number, number];
  v: [number, number, number];
  /** Its cruising speed (u/s) and half its body's length (u). */
  speed: number;
  r: number;
  /** Its own noise's seed. */
  seed: number;
}

/** The box a swimmer's middle keeps to: the water less its body (its length along the tank's long side, half that
 *  across: it turns to swim along). */
export function swimBox(water: Box, r: number, out: Box = { x0: 0, x1: 0, y0: 0, y1: 0, z0: 0, z1: 0 }): Box {
  const along = water.x1 - water.x0 >= water.z1 - water.z0;
  const ix = Math.min(along ? r : r * 0.5, (water.x1 - water.x0) / 2 - 0.1), iz = Math.min(along ? r * 0.5 : r, (water.z1 - water.z0) / 2 - 0.1);
  const iy = Math.min(r * 0.35, (water.y1 - water.y0) / 2 - 0.1);
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
export function spawn(water: Box, r: number, speed: number, seed: number): Swimmer {
  const b = swimBox(water, r);
  const f = (k: number) => (Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1;
  const u = (k: number) => Math.abs(f(k));
  const a = u(4) * Math.PI * 2;
  return { p: [b.x0 + (b.x1 - b.x0) * u(1), b.y0 + (b.y1 - b.y0) * u(2), b.z0 + (b.z1 - b.z0) * u(3)], v: [Math.sin(a) * speed, 0, Math.cos(a) * speed], speed, r, seed };
}

/** One step of every swimmer in one tank (dt seconds, t the time in seconds). */
export function stepSchool(fish: Swimmer[], water: Box, dt: number, t: number): void {
  const along = water.x1 - water.x0 >= water.z1 - water.z0;
  const h = Math.min(0.1, Math.max(0, dt));
  for (let i = 0; i < fish.length; i++) {
    const s = fish[i], b = swimBox(water, s.r, tmp), x = s.p[0], y = s.p[1], z = s.p[2];
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
