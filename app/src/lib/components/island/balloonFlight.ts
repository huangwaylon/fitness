// The balloon present's flight in world space (docs/design.md "Balloon"), pure: NH's balloon flies across the island
// at one height well above the trees, from the sea off one side to the sea off the other, bobbing and swaying on the
// breeze, its present swinging under it on a short string; shot down, the present falls along a short floaty arc to
// the spot already chosen for it (presentLanding.ts). Balloon.svelte plans and owns the flight (its tap area: a world
// node on the rig), world3d/balloon3d.ts draws it (the models, the string, a blob shadow on the ground under it), and
// SceneTaps.svelte draws the fall. The flight's clock is its own age: it runs in the island's frames (and the World's
// game clock), so it holds while the page is hidden or a sheet covers the island.

import { clamp01, hermite } from '#lib/math.ts';

/** NH's balloon of a colour (its model, world3d-assets.ts's five): 1 in 20 the gold (4), else one of the other four,
 *  each as likely. */
export const balloonModel = (r: () => number = Math.random): string => `balloon/${r() < 0.05 ? 4 : Math.floor(r() * 4)}`;

/** World units, the rig's sizes: the balloon (NH's model, its middle on the rig), the string from its knot, the present
 *  hanging on it (NH's, smaller than it lies on the ground). */
export const RIG = { balloon: 40, string: 11, gift: 18 } as const;
/** How far above the highest ground under its lane it flies (u): clear of NH's tallest trees (a cedar's 122u). */
export const ALT = 165;
/** The lane crosses the screen in about this long (ms) at any zoom. */
const CROSS_MS = 22_000;
/** The flight starts and ends this far off the screen's sides (px): it comes in from out of view, over the sea. */
const OFF_PX = 70;

/** The camera as the flight sees it (Balloon.svelte's from the World; a fake in the unit tests). Px from the scene's
 *  top-left. */
export interface SkyView {
  /** A world point (x, z, height y) on screen, or null behind the horizon or the camera. */
  at(x: number, z: number, y: number): readonly [number, number] | null;
  /** The ground's height at (x, z). */
  feet(x: number, z: number): number;
  /** The screen's width; the lane's top (the HUD's foot), the bottom any of it may reach (the bottom controls'
   *  top), the horizon. */
  vw: number;
  top: number;
  bottom: number;
  horizon: number;
  /** The ground in view: the world x under the screen's middle, and z from the screen's foot to the horizon. */
  cx: number;
  z0: number;
  z1: number;
}

export interface Flight {
  /** From x0 to x1 (world) along the lane at z, the knot at height y (world). */
  x0: number;
  x1: number;
  z: number;
  y: number;
  ms: number;
  /** The bob's and the sway's phases (radians). */
  ph: number;
}

/** A lane's height at z: ALT over the highest ground under it (a little either side of it: the sway), across the
 *  island and its beaches. */
export function laneY(v: Pick<SkyView, 'feet'>, z: number): number {
  let top = -Infinity;
  for (let x = -90; x <= 510; x += 30) for (const dz of [-30, 0, 30]) top = Math.max(top, v.feet(x, z + dz));
  return Math.round(top + ALT);
}

/** A flight across the island in view now, or null (no lane on screen: a sky too short). Its lane is biased to the
 *  front: the balloon crosses a little under the HUD (and the horizon), its shadow on the ground in view under it,
 *  so its present has a short way to fall to the front; at its lane's height (ALT over the highest ground under it). */
export function planFlight(v: SkyView, rnd: () => number = Math.random): Flight | null {
  const lo = Math.max(v.top + 44, v.horizon + 24), hi = lo + Math.max(0, v.bottom - lo) * 0.22;
  if (lo > v.bottom - 80) return null;
  const syAt = (z: number) => v.at(v.cx, z, laneY(v, z))?.[1] ?? -Infinity;
  /** The lane's z putting the balloon at screen y `want` (farther is higher up the screen). */
  const solve = (want: number) => {
    let a = v.z0 - 400, b = v.z1 + 400;
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2;
      if (syAt(m) > want) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  let want = lo + rnd() * (hi - lo), z = solve(want);
  // its shadow on the screen too (zoomed right in the drop under it is long): the lane further up until it is
  for (let i = 0; i < 12; i++) {
    const sh = v.at(v.cx, z, v.feet(v.cx, z));
    if (!sh || sh[1] < v.bottom - 30 || want <= v.top + 30) break;
    want = Math.max(v.top + 30, want - 24);
    z = solve(want);
  }
  const y = laneY(v, z), p = v.at(v.cx, z, y), q = v.at(v.cx + 100, z, y);
  if (!p || !q || q[0] - p[0] < 1 || p[1] < v.top || p[1] > v.bottom) return null;
  // the screen's sides at the lane (a level line across the screen: the camera never rolls)
  const pxU = (q[0] - p[0]) / 100, xAt = (sx: number) => v.cx + (sx - p[0]) / pxU;
  const xl = xAt(-OFF_PX), xr = xAt(v.vw + OFF_PX), ltr = rnd() < 0.5;
  return { x0: ltr ? xl : xr, x1: ltr ? xr : xl, z: Math.round(z), y, ms: Math.round(CROSS_MS * ((v.vw + 2 * OFF_PX) / (v.vw + 60))), ph: rnd() * Math.PI * 2 };
}

/** The rig at an age (ms): the knot (world x, y, z), the balloon's middle (leaning about the knot), where the string
 *  meets the present's top (a pendulum from the knot, a beat behind the lean, trailing the drift a little) and the two
 *  tilts (radians, about the view's axis: + leans its top to +x). */
export interface Rig {
  knot: readonly [number, number, number];
  balloon: readonly [number, number, number];
  gift: readonly [number, number, number];
  lean: number;
  swing: number;
}
const TAU = Math.PI * 2;
export function rigAt(f: Flight, age: number): Rig {
  const k = Math.max(0, Math.min(1, age / f.ms)), dir = Math.sign(f.x1 - f.x0) || 1;
  // NH's: a slow bob on a steady height, a sway back and forth in depth, the balloon rocking
  const x = f.x0 + (f.x1 - f.x0) * k, y = f.y + 3.2 * Math.sin((TAU * age) / 3600 + f.ph), z = f.z + 5 * Math.sin((TAU * age) / 7300 + f.ph * 0.7);
  const lean = 0.07 * Math.sin((TAU * age) / 5200 + f.ph);
  // (the present: the lean's swing 0.9 s behind it, trailing the drift by 5°)
  const swing = -dir * 0.087 + 0.1 * Math.sin((TAU * (age - 900)) / 5200 + f.ph);
  const h = RIG.balloon / 2, L = RIG.string;
  return {
    knot: [x, y, z],
    balloon: [x + Math.sin(lean) * h, y + Math.cos(lean) * h, z],
    gift: [x + Math.sin(swing) * L, y - Math.cos(swing) * L, z],
    lean,
    swing
  };
}

/** The present's fall: from where it hung (its top, world) to its landing spot on the ground (x, z), how long it
 *  takes (ms): longer the further it drifts (a pop over the back of the island floats forward to the front). */
export function fallMs(from: readonly [number, number, number], to: readonly [number, number, number]): number {
  return Math.round(Math.min(3000, Math.max(1600, 1300 + Math.hypot(to[0] - from[0], to[2] - from[2]) * 2.4 + (from[1] - to[1]) * 2.6)));
}
/** Where the falling present is at `k` (0 … 1 of its fall): its feet (world x, y, z) and its tilt (radians). NH's: a
 *  little hop up as the balloon bursts, then down, slowly at first (it floats), the drift eased out, a sway that
 *  settles; it meets the ground at `to` exactly. `from` is where its top hung: its feet start a present's height lower. */
export function fallAt(from: readonly [number, number, number], to: readonly [number, number, number], k: number): { at: [number, number, number]; tilt: number } {
  const q = clamp01(k);
  const ease = hermite(q), y0 = from[1] - RIG.gift;
  const drop = q * q * (1.6 - 0.6 * q), hop = 10 * Math.sin(Math.PI * Math.min(1, q / 0.35)) * (1 - q);
  return {
    at: [from[0] + (to[0] - from[0]) * ease, y0 + (to[1] - y0) * drop + (q < 1 ? hop : 0), from[2] + (to[2] - from[2]) * ease],
    tilt: 0.28 * Math.sin(q * Math.PI * 3) * (1 - q)
  };
}

// ---- the flight now (Balloon.svelte's, read by the 3D island) --------------------------------------------------------

interface Flying {
  f: Flight;
  /** Its age (ms) and the clock it was last advanced at. */
  age: number;
  last: number;
  /** The balloon's colour (its NH model's key) and whether it has been shot down. */
  model: string;
  popped: boolean;
}
let cur: Flying | null = null;
/** A frame's step at most (ms): a gap longer than that (the page hidden, a sheet over the island: no frames) holds the
 *  flight where it was (a software renderer's ambience, 2 frames a second, still keeps time). */
const STEP_MAX = 600;

/** The balloon flies (or is gone: null). */
export function setFlight(f: Flight | null, model = 'balloon/0'): void {
  cur = f ? { f, age: 0, last: performance.now(), model, popped: false } : null;
}
/** Shot down: the balloon and the present on its string go at once (the present that falls is SceneTaps'). */
export function popFlight(): void {
  if (cur) cur.popped = true;
}
/** The flight now, its clock advanced to `now` (the island's frames call this: the projector's, the 3D island's). */
export function flying(now = performance.now()): { f: Flight; age: number; model: string; popped: boolean } | null {
  if (!cur) return null;
  const dt = now - cur.last;
  if (dt > 0) {
    cur.age += Math.min(STEP_MAX, dt);
    cur.last = now;
  }
  return cur;
}
/** The e2e's: move the flight so its knot is over (x, z) now, at height y (the lane's there), flying on. */
export function moveFlight(x: number, z: number, y: number): void {
  if (!cur) return;
  const { f, age } = cur, dx = (f.x1 - f.x0) * Math.min(1, age / f.ms);
  cur.f = { ...f, x0: x - dx, x1: x - dx + (f.x1 - f.x0), z, y };
}
