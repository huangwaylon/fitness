// 英語すごろく's board in 3D, the pure part (engine.ts draws it): the plan's points (board.ts: a W × H drawing, y down
// the route) as world X/Z, the route ahead of the camera (ふりだし nearest, the sea's あがり farthest), a hop from stone to
// stone, the places of people sharing a stone, the river's line and its bridges, the die's faces and the camera's
// framing. No three.js objects but its maths.
import { Quaternion, Vector3 } from 'three';
import { BOARD, FORK, GOAL, H, W } from '#lib/sugoroku/board.ts';
import { clamp } from '#lib/math.ts';

/** World units a plan unit. */
const S = 1;
/** A person's height (world units): about a stone's width and a half. */
export const PERSON_H = 30;
/** A stone's radius and thickness, ふりだし's and あがり's radius. */
export const STONE_R = 15, STONE_T = 4, END_R = 21;
/** How high a hop goes (world units), and how long a stone takes (ms). */
export const HOP_H = 7, HOP_MS = 250;

/** A plan point (x right, y down the route) as world [X, Z]: the route runs away from the camera (−Z). */
export const toWorld = (x: number, y: number): [number, number] => [(x - W / 2) * S, (H / 2 - y) * S];

/** Stone `i`'s middle, world [X, Z]. */
export function stoneAt(i: number): [number, number] {
  const sp = BOARD[i];
  return toWorld(sp.x, sp.y);
}

/** Stone `i`'s top (where a person stands), world units. */
export const topOf = (i: number): number => STONE_T + (BOARD[i].kind === 'start' || BOARD[i].kind === 'goal' ? 0.5 : 0);

/** The hops of a walk from `from` along `path` (the board's spaces in order, as board.ts pathOf gives them): each
 *  [a, b] and whether b is one of a's next stones (false: a jump, an event card's move back, still drawn as a hop). */
export function hopsOf(from: number, path: readonly number[]): { a: number; b: number; linked: boolean }[] {
  const out: { a: number; b: number; linked: boolean }[] = [];
  let a = from;
  for (const b of path) {
    if (b === a || b < 0 || b >= BOARD.length) continue;
    out.push({ a, b, linked: BOARD[a].next.includes(b) });
    a = b;
  }
  return out;
}

/** Where a hop from stone `a` to `b` is at `u` (0–1): along the line, up an arc, facing the way it goes (yaw: 0
 *  faces +Z, toward the camera, as NH's models do). */
export function hopAt(a: number, b: number, u: number): { x: number; y: number; z: number; yaw: number } {
  const [ax, az] = stoneAt(a), [bx, bz] = stoneAt(b), k = clamp(u, 0, 1);
  const e = k * k * (3 - 2 * k);
  const ya = topOf(a), yb = topOf(b);
  return { x: ax + (bx - ax) * e, z: az + (bz - az) * e, y: ya + (yb - ya) * k + 4 * HOP_H * k * (1 - k), yaw: Math.atan2(bx - ax, bz - az) };
}

/** Where the `n`th of `m` people on one stone stands, off its middle (world [dx, dz]): side by side, the camera's way. */
export function slotOf(n: number, m: number): [number, number] {
  if (m <= 1) return [0, 0];
  const t = n - (m - 1) / 2;
  return [t * 13, m > 2 && n % 2 ? -6 : 2];
}

/** The river's middle (plan y) at plan x: straight across the island between the plaza and the river rows, a tile
 *  (islandPlan.ts TILE_P) wide, as an NH river is on the island's grid. */
export const riverY = (_x: number): number => 230;
export const RIVER_HALF = 10;

/** The route's crossings of the river (plan x, y, and the path's yaw across it): a bridge at each. */
export function bridges(): { x: number; y: number; yaw: number }[] {
  const out: { x: number; y: number; yaw: number }[] = [];
  BOARD.forEach((sp) => {
    for (const j of sp.next) {
      const to = BOARD[j], d = (y: number, x: number) => y - riverY(x);
      if (Math.sign(d(sp.y, sp.x)) === Math.sign(d(to.y, to.x))) continue;
      // (bisect the segment for the crossing)
      let lo = 0, hi = 1;
      for (let k = 0; k < 24; k++) {
        const m = (lo + hi) / 2, x = sp.x + (to.x - sp.x) * m, y = sp.y + (to.y - sp.y) * m;
        if (Math.sign(d(y, x)) === Math.sign(d(sp.y, sp.x))) lo = m;
        else hi = m;
      }
      const x = sp.x + (to.x - sp.x) * lo, y = sp.y + (to.y - sp.y) * lo;
      out.push({ x, y, yaw: Math.atan2(to.x - sp.x, -(to.y - sp.y)) });
    }
  });
  return out;
}

// ---- the die ----

/** The value on each of three's BoxGeometry faces, in its order (+X, −X, +Y, −Y, +Z, −Z): opposite faces add to 7. */
export const DIE_FACES = [2, 5, 1, 6, 3, 4] as const;
const NORMALS: readonly [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const UP = new Vector3(0, 1, 0);

/** Face value `n`'s outward normal in the die's own frame. */
export function normalOf(n: number): Vector3 {
  const i = DIE_FACES.indexOf(n as (typeof DIE_FACES)[number]);
  if (i < 0) throw new RangeError(`no die face ${n}`);
  return new Vector3(...NORMALS[i]);
}

/** The die at rest with `n` on top, turned `yaw` about the vertical (the rest's look varies, the top doesn't). */
export function restOf(n: number, yaw = 0): Quaternion {
  const up = new Quaternion().setFromUnitVectors(normalOf(n), UP);
  return new Quaternion().setFromAxisAngle(UP, yaw).multiply(up);
}

/** The value on top of a die turned `q`. */
export function topFace(q: Quaternion): number {
  let best = 0, bestY = -Infinity;
  NORMALS.forEach((nv, i) => {
    const y = new Vector3(...nv).applyQuaternion(q).y;
    if (y > bestY) (bestY = y), (best = i);
  });
  return DIE_FACES[best];
}

/** A roll's length (ms), and the die's size (world units). */
export const ROLL_MS = 900, DIE_SIZE = 9;
/** The tumble's turns before it settles. */
const TURNS = 2.5;

/** The die at `u` (0–1) of a roll onto `rest`, spun about `axis` (a unit vector, horizontal): `q` its turn (the rest
 *  at u = 1), `h` its height off the ground (its middle's lift over resting), `d` how far along the toss (0 at the
 *  hand, 1 where it lands). A drop, two bounces, a settle. */
export function tumbleAt(u: number, rest: Quaternion, axis: Vector3, out = new Quaternion()): { q: Quaternion; h: number; d: number } {
  const k = clamp(u, 0, 1);
  // (the spin slows to a stop at 0.85; the last bit is the settle)
  const s = clamp(k / 0.85, 0, 1), left = (1 - s) ** 2;
  out.setFromAxisAngle(axis, left * TURNS * Math.PI * 2).multiply(rest);
  let h: number;
  if (k < 0.45) h = 40 * (1 - (k / 0.45) ** 2);
  else if (k < 0.72) {
    const t = (k - 0.45) / 0.27;
    h = 9 * 4 * t * (1 - t);
  } else if (k < 0.88) {
    const t = (k - 0.72) / 0.16;
    h = 2.5 * 4 * t * (1 - t);
  } else h = 0;
  const d = 1 - (1 - clamp(k / 0.88, 0, 1)) ** 2;
  return { q: out, h, d };
}

// ---- the camera ----

/** The camera's pitch down (radians) and its vertical field (degrees). */
const PITCH = (50 * Math.PI) / 180;
export const FOV = 34;
const HALF = Math.tan(((FOV / 2) * Math.PI) / 180);
/** The land's half width (plan units) the view keeps to: past it the beach, then the sea. */
const LAND_HALF = 170;
/** The steepest the canvas's top ray may get (degrees below the horizon): never the horizon, nor the open sea. */
export const TOP_RAY_MIN = 20;

/** The view's visible part on a canvas `h` tall (CSS px), the overlays' insets `top` and `bottom` off it: `hv` the
 *  height framed, from `top` down. The canvas is also drawn under the top overlay; when the part left is so short that
 *  its top ray would tip under TOP_RAY_MIN, some of the bottom inset is given back (the board framed a little under
 *  the sheet). */
export function visibleOf(h: number, top: number, bottom: number): { top: number; hv: number } {
  const t = clamp(top, 0, h / 2);
  // (the canvas's top is (1 + 2t/hv) half fields above the middle: at most PITCH − TOP_RAY_MIN)
  const k = Math.tan(PITCH - (TOP_RAY_MIN * Math.PI) / 180) / HALF - 1;
  const hv = clamp(h - t - Math.max(0, bottom), Math.min(h - t, (2 * t) / k), h - t);
  return { top: t, hv: Math.max(1, hv) };
}

/** How far below the horizon (degrees) the canvas's top ray is, the visible part `hv` tall starting `top` down. */
export const topRayOf = (top: number, hv: number): number => ((PITCH - Math.atan(HALF * (1 + (2 * top) / hv))) * 180) / Math.PI;

/** The camera for a visible part of `aspect` (its w / hv: the canvas less the overlays) following plan-world point
 *  [fx, fz]: where it stands and what it looks at (world). ~190 across at the focus on a phone (wider on a wider view,
 *  `wide` at a fork's choice) and at least ~3 stones ahead; x follows part way but never past the land (the beach at
 *  the sides, never open sea); the focus in the view's lower third with the stones ahead above it; the look ahead
 *  stops short of the sea past あがり. */
export function cameraFor(fx: number, fz: number, aspect: number, wide = 0): { pos: [number, number, number]; at: [number, number, number] } {
  const a = Math.max(aspect, 0.2);
  const spanX = Math.max(wide, clamp(190 * Math.sqrt(Math.max(1, a / 0.8)), 190, 280));
  const dist = Math.max(spanX / 2 / (HALF * a), 120 / 2 / HALF);
  const edge = Math.max(0, LAND_HALF - spanX / 2);
  // (but whose turn it is stays well inside the view: a stone at the land's edge shows a strip of beach past it; a fork's
  // aim is taken as it is, the beach's strip allowed, so the fork and both ways show)
  const keep = spanX / 2 - 40;
  const x = wide ? clamp(fx, -(LAND_HALF + 20 - spanX / 2), LAND_HALF + 20 - spanX / 2) : clamp(clamp(fx * 0.6, -edge, edge), fx - keep, fx + keep);
  const z = Math.max(fz - 0.2 * 2 * dist * HALF, stoneAt(GOAL)[1] + 25);
  return { pos: [x, Math.sin(PITCH) * dist, z + Math.cos(PITCH) * dist], at: [x, 0, z] };
}

/** A fork's choice: the camera's aim (between the fork and its two ways' first stones: cameraFor's look ahead puts the
 *  ways above whoever stands there) and its width across. */
export function forkAim(): { x: number; z: number; wide: number } {
  const [a, b] = BOARD[FORK].next.map(stoneAt), [fx, fz] = stoneAt(FORK);
  return { x: (fx + (a[0] + b[0]) / 2) / 2, z: (fz + (a[1] + b[1]) / 2) / 2, wide: 260 };
}
