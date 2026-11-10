// The museum's room camera, pure (docs/design.md "The museum"): one room drawn at a time, each framed for the portrait
// phone (393 × 852, iPhone 15/16): NH's room view (pitched down PITCH, a vertical FOV of FOV), the floor VIEW_W across at
// the target (the hall a little closer, its 12 × 12 whole). The framing per room: the target's x kept so the side walls
// stay at the screen's edges (a soft follow inside, a dead zone either side), its z fixed where the room fits between the
// back button and the HUD (its back wall's top under the one, its front edge over the other), or else followed in depth
// between those two (a dead zone too). The floor goes on past the front wall (the apron) down to the screen's foot.
// engine.ts aims the camera by it (target, distance), camera.test.ts holds the framing to the phone.
import { WING_H, HALL_H, boundsOf, type Pt, type Rect, type RoomId } from './plan.ts';

/** The camera's pitch (degrees down) and vertical field of view (degrees). */
export const PITCH = 50;
export const FOV = 32;
/** The target's height (a villager's middle, engine.ts). */
const TARGET_Y = 8;
/** The floor across the screen at the target, each room's (model units: the hall whole, its side arches and their
 *  plaques in view from the door; the wings' 11.2 tiles of their 12, the side walls a soft follow away). Tuned on the
 *  phone by __museum.tune({ viewW }). */
export const VIEW_W: Readonly<Record<RoomId, number>> = { hall: 124, bug: 112, fish: 112, F1: 112, F2: 112, F3: 112, G1: 112, G2: 112 };
/** How far my villager may stray from the target before the camera follows (x, z: model units). */
export const DEAD: Pt = [12, 30];
/** The phone's screen and what covers it (css px): the top bar to its back button's foot, the HUD's height. */
export interface Screen { W: number; H: number; top: number; bottom: number }
export const PORTRAIT: Screen = { W: 393, H: 852, top: 110, bottom: 72 };

/** A camera: its target (x, z on the floor, at TARGET_Y), pitch and distance, on a screen. */
export interface Cam { x: number; z: number; pitch: number; d: number; s: Screen }
const rad = (deg: number) => (deg * Math.PI) / 180;
/** The distance that shows `viewW` across at the target (engine.ts fit: its horizontal half angle's). */
const distanceFor = (viewW: number, s: Screen): number => viewW / 2 / (Math.tan(rad(FOV / 2)) * (s.W / s.H));
/** Where a point lands on the screen (css px, the canvas's: the target at the middle of the band between the top bar
 *  and the HUD, engine.ts's view offset), or null behind the camera. */
export function project(c: Cam, x: number, y: number, z: number): [number, number] | null {
  const p = rad(c.pitch), sp = Math.sin(p), cp = Math.cos(p);
  // (the camera at the target + (0, d sin p, d cos p), looking at it: forward (0, −sin p, −cos p), up (0, cos p, −sin p))
  const vx = x - c.x, vy = y - (TARGET_Y + c.d * sp), vz = z - (c.z + c.d * cp);
  const depth = -vy * sp - vz * cp, up = vy * cp - vz * sp;
  if (depth <= 0) return null;
  const t = Math.tan(rad(FOV / 2)), { W, H, top, bottom } = c.s;
  const band = Math.max(0.3 * H, H - top - bottom), shift = H / 2 - (top + band / 2);
  return [W / 2 + (vx / (depth * t * (W / H))) * (W / 2), H / 2 - (up / (depth * t)) * (H / 2) - shift];
}
/** The floor's z under a screen row (css px), for a target. */
function floorZAt(c: Cam, py: number): number {
  // (by bisection: the floor's rows fall monotonically with z under the camera)
  let lo = c.z - 2000, hi = c.z + c.d * Math.cos(rad(c.pitch)) - 1;
  for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2, q = project(c, c.x, 0, m);
    if (q && q[1] < py) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** A room's framing: its view's width, the target's range (x, z: a range of one value, fixed), and the apron the floor
 *  needs past the front wall to reach the screen's foot from the frontmost target. */
export interface Framing { room: RoomId; viewW: number; pitch: number; d: number; x: Pt; z: Pt; apron: number }
/** A framing's tuning (the Simulator's: __museum.tune): another view width or pitch. */
export interface CamTune { viewW?: number; pitch?: number }
const wallH = (room: RoomId) => (room === 'hall' ? HALL_H : WING_H);
function framing(room: RoomId, s: Screen = PORTRAIT, b: Rect = boundsOf(room), o: CamTune = {}): Framing {
  const viewW = o.viewW ?? VIEW_W[room], pitch = o.pitch ?? PITCH, d = distanceFor(viewW, s), cx = (b.x0 + b.x1) / 2;
  const cam = (z: number): Cam => ({ x: cx, z, pitch, d, s });
  // the back wall's top just under the top bar (the target no further forward), the front edge just over the HUD (no
  // further back); between them, or both at once at the target that leaves as much room over the one as under the other
  // (each a row moving up the screen as the target comes forward: a root by bisection)
  const solve = (f: (z: number) => number) => {
    let lo = b.z0 - 250, hi = b.z1 + 100;
    const up = f(lo) > f(hi);
    for (let k = 0; k < 60; k++) {
      const m = (lo + hi) / 2;
      if (f(m) > 0 === up) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const row = (z: number, y: number, at: number) => project(cam(z), cx, y, at)?.[1] ?? -Infinity;
  const backTop = (z: number) => row(z, wallH(room), b.z0);
  const front = (z: number) => row(z, 0, b.z1);
  const zBack = solve((z) => backTop(z) - s.top), zFront = solve((z) => s.H - s.bottom - front(z));
  const zs: Pt = zFront <= zBack ? ((z) => [z, z] as Pt)(solve((z) => backTop(z) - s.top - (s.H - s.bottom - front(z)))) : [zBack, zFront];
  // the side walls at the screen's edges at the target's depth, but a front corner (a villager a body in from it) on
  // the screen too: the floor across is narrower there, nearer the camera
  const p = rad(pitch), camZ = zs[1] + d * Math.cos(p), depthFront = (TARGET_Y + d * Math.sin(p)) * Math.sin(p) + (camZ - b.z1) * Math.cos(p);
  const halfFront = depthFront * Math.tan(rad(FOV / 2)) * (s.W / s.H) * (1 - 48 / s.W) - 8;
  const lo = Math.min(b.x0 + viewW / 2, b.x0 + 8 + halfFront), hi = Math.max(b.x1 - viewW / 2, b.x1 - 8 - halfFront);
  const xs: Pt = lo < hi ? [lo, hi] : [cx, cx];
  const apron = Math.max(0, floorZAt(cam(zs[1]), s.H) - b.z1);
  return { room, viewW, pitch, d, x: xs, z: zs, apron };
}
/** The framings, made once a screen (and a tuning). */
const made = new Map<string, Framing>();
export function framingOf(room: RoomId, s: Screen = PORTRAIT, o: CamTune = {}): Framing {
  const k = `${room} ${s.W} ${s.H} ${s.top} ${s.bottom} ${o.viewW} ${o.pitch}`;
  return made.get(k) ?? made.set(k, framing(room, s, boundsOf(room), o)).get(k)!;
}
/** The target for my villager at `me`, from the last one (`was`): kept while it's within the dead zone, else brought
 *  just near enough, always within the room's range. A room's first frame: `was` its framing's middle (enter()). */
export function follow(f: Framing, was: Pt, me: Pt): Pt {
  const keep = (v: number, at: number, dead: number, [lo, hi]: Pt) => Math.min(hi, Math.max(lo, Math.min(at + dead, Math.max(at - dead, v))));
  return [keep(was[0], me[0], DEAD[0], f.x), keep(was[1], me[1], DEAD[1], f.z)];
}
/** The target on entering a room at `me` (a fade's cut, a put): as near me as the room's range lets. */
export const enter = (f: Framing, me: Pt): Pt => [Math.min(f.x[1], Math.max(f.x[0], me[0])), Math.min(f.z[1], Math.max(f.z[0], me[1]))];
