// The museum's room camera, pure (docs/design.md "The museum"): one room drawn at a time, each framed for the portrait
// phone (393 × 852, iPhone 15/16): NH's room view (pitched down PITCH, a vertical FOV of FOV), the floor VIEW_W across at
// the target: the whole room across (its width and a little), so the target's x stays at the room's middle and every
// doorway's plaque is on the screen. Its z fixed where the room fits between the back button and the HUD (its back
// wall's top under the one, its front edge over the other), or else followed in depth between those two (a dead zone).
// The floor goes on past the front wall (the apron) down to the screen's foot.
// engine.ts aims the camera by it (target, distance), camera.test.ts holds the framing to the phone.
import { FLAG_OFF, WALL_T, WING_H, HALL_H, ROOM_IDS, boundsOf, plaqueAt, type Opening, type Pt, type Rect, type RoomId } from './plan.ts';

/** The camera's pitch (degrees down) and vertical field of view (degrees). */
export const PITCH = 50;
export const FOV = 32;
/** The target's height (a villager's middle, engine.ts). */
const TARGET_Y = 8;
/** The floor across the screen at the target, each room's (model units): the room's width and a tile, its walls just
 *  inside the screen's edges. Tuned on the phone by __museum.tune({ viewW }). */
export const VIEW_W: Readonly<Record<RoomId, number>> = Object.fromEntries(
  ROOM_IDS.map((id) => [id, ((b) => b.x1 - b.x0 + 10)(boundsOf(id))])
) as Record<RoomId, number>;
/** How far my villager may stray from the target before the camera follows (x, z: model units; x only where a room is
 *  wider than its view). */
export const DEAD: Pt = [12, 30];
/** A room that fits framed off the balance, this share of its spare rows moved: + down (its front edge toward the HUD:
 *  the hall, so no wide band of bare floor shows under its front wall), − up (its back wall's top toward the top bar:
 *  F1, so the hall's plaque at its cut front wall's foot clears the HUD's buttons). */
const LEAN: Partial<Record<RoomId, number>> = { hall: 0.5, F1: -0.5, F3: -0.5 };
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
  // further back); between them, or, a room that fits, the target that leaves as much room over the one as under the other
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
  const fit = solve((z) => backTop(z) - s.top - (s.H - s.bottom - front(z)));
  const k = LEAN[room] ?? 0, z = fit + Math.abs(k) * ((k > 0 ? zFront : zBack) - fit);
  const zs: Pt = zFront <= zBack ? [z, z] : [zBack, zFront];
  // the target's x at the room's middle (the whole room across), but where it's wider than the view (a tuning): a
  // follow between the side walls at the screen's edges
  const xs: Pt = viewW >= b.x1 - b.x0 ? [cx, cx] : [b.x0 + viewW / 2, b.x1 - viewW / 2];
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

/** How far in from the screen's edge a side wall's flag plaque keeps (css px). */
const EDGE = 14;
/** A doorway's plaque as hung (plan.ts plaqueAt), a side wall's flag stood far enough off its wall that its room's view
 *  (its target furthest back: the narrowest at the flag's depth) shows it whole, EDGE in from the screen's edge. */
export function plaqueOf(o: Opening, side: 'room' | 'next' = 'room', s: Screen = PORTRAIT): { x: number; y: number; z: number; yaw: number } {
  const p = plaqueAt(o, side);
  if (o.axis === 'z') return p;
  const f = framingOf(side === 'room' ? o.room : o.next, s), c: Cam = { x: f.x[0], z: f.z[0], pitch: f.pitch, d: f.d, s };
  // (the wall's side of the board: its x on the screen falls straight with the world's at its depth)
  const k = Math.sign(p.x - o.at), wallSide = (off: number) => o.at + k * (WALL_T / 2 + off);
  const a = project(c, wallSide(0), p.y, p.z)![0], b = project(c, wallSide(10), p.y, p.z)![0], want = k > 0 ? EDGE : s.W - EDGE;
  return plaqueAt(o, side, Math.max(FLAG_OFF, ((want - a) / (b - a)) * 10));
}
