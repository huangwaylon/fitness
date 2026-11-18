// 英語すごろく's board in 3D, the pure part (engine.ts draws it): the plan's points (board.ts: a W × H drawing, y down
// the route) as world X/Z, the route ahead of the camera (ふりだし nearest, the sea's あがり farthest), a hop from stone to
// stone, the places of people sharing a stone, the river's line and its bridges, the die's faces and the camera's
// framing. No three.js objects but its maths.
import { Quaternion, Vector3 } from 'three';
import { BOARD, GOAL, H, W } from '#lib/sugoroku/board.ts';
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

/** The river's middle (plan y) at plan x: across the island near y 235 (Board.svelte's river), RIVER_HALF wide. */
export const riverY = (x: number): number => 236 + 6 * Math.sin(x / 45) - 4 * Math.cos(x / 23);
export const RIVER_HALF = 11;

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

/** The camera for a view of `aspect` (w / h) following plan-world point [fx, fz]: where it stands and what it looks at
 *  (world). It keeps ~WIDTH across at the focus (the long board's width on a phone), follows x part way (the board stays
 *  centred-ish), and stands behind the focus (+Z), looking down the route. */
export function cameraFor(fx: number, fz: number, aspect: number): { pos: [number, number, number]; at: [number, number, number] } {
  const WIDTH = 190, MIN_H = 230;
  const half = Math.tan(((FOV / 2) * Math.PI) / 180);
  // (distance for the width across, and at least for a height of view on a wide screen)
  const dist = Math.max(WIDTH / 2 / (half * Math.max(aspect, 0.2)), MIN_H / 2 / half);
  // (the look ahead stops short of the sea past あがり)
  const x = fx * 0.6, z = Math.max(fz - 70, stoneAt(GOAL)[1] + 25);
  return { pos: [x, Math.sin(PITCH) * dist, z + Math.cos(PITCH) * dist], at: [x, 0, z] };
}
