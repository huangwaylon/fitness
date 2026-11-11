// Where a villager sits or lies on a piece (scripts/seat-anchors.ts: seats3d.json, each seat's and bed's shape from its
// model's geometry), as the villager3d API takes it (villager3d.ts sitAt): an Anchor in the space the villager's group
// stands in, the piece put there by its middle, its turn (yaw: three's, about y; 0 its front toward +z) and its scale
// (that space's units a model unit). Pure: unit-tested.
import DATA from './seats3d.json' with { type: 'json' };
import { outdoorSeat } from '#lib/layout/outdoor.ts';

/** What a villager does on a piece of the gym (the island's: layout/catalog.ts group 'gym'; poses.ts plays each):
 *  presses lying on the weight bench, pedals the bike, runs on the treadmill, punches the bag, bounces on the ball,
 *  does pull-ups at the bar. */
type Use = 'press' | 'pedal' | 'run' | 'punch' | 'bounce' | 'pullup';
/** Whether one stands to use it (its feet on the anchor: the treadmill's belt, the bag, the bar), else sits on it (its
 *  hips: the bike's saddle, the ball) or lies (the bench). */
const standsOn = (u: Use): boolean => u === 'run' || u === 'punch' || u === 'pullup';

/** A seat's or a bed's shape in its model's frame (model units, +z its front, its middle at 0; seats3d.json
 *  `tent[code]` / `island[model]`, docs/world3d-assets.md "Seats and beds"): a seat `s` its top `y`, each seat's middle
 *  across `x` (a sofa's two), its back and front edges `z0`/`z1`, the back's height over it (0 a stool); a bed `l` the
 *  mattress's top, its long axis `a`, the pillow's end `head` (−1/+1 along it), the mattress's extent `s`, each
 *  sleeper's line across `c`, the pillow's rise `py`; `sway: 1` rocks (a hammock). scripts/room-surfaces.ts seatOf, bedOf;
 *  `use`: a gym piece's (seat-anchors.ts OVERRIDES). A gym piece used in place (`u`, by hand: scripts/seat-anchors.ts
 *  USE) is a point, its feet's (standing) or its hips' (seated) at (x, y, z), facing `yaw` (radians, its turn from the
 *  piece's front; −π/2 toward −x), got onto from (fx, fz) on the ground. */
type Shape =
  | { k: 's'; y: number; x: number[]; z0: number; z1: number; back: number; sway?: 1; use?: Use }
  | { k: 'l'; y: number; a: 'x' | 'z'; head: -1 | 1; s: [number, number]; c: number[]; py: number; sway?: 1; use?: Use }
  | { k: 'u'; use: Use; x: number; y: number; z: number; yaw: number; fx: number; fz: number };
const D = DATA as unknown as { tent: Record<string, Shape>; island: Record<string, Shape> };

export interface Anchor {
  lie: boolean;
  /** Sitting: the seat's back edge in its middle (where the hips go, the body against the back); lying: the head's
   *  end of the mattress on its middle line. In the group's parent's space; y the seat's or the mattress's top. */
  x: number;
  y: number;
  z: number;
  /** Which way it faces (sitting: the seat's front; lying: from its head to its feet), three's yaw. */
  yaw: number;
  /** The floor under it (its feet's height: they reach it or dangle). */
  floor: number;
  /** Sitting: how deep the seat is (to its front edge) and how high its back stands over it (0 none). */
  depth: number;
  back: number;
  /** Lying: how long the mattress is, how much higher its pillow end; a hammock sways. */
  len: number;
  pillow: number;
  sway: boolean;
  /** A step in front of it (sitting) or beside it (lying): where one stands to get on and off. */
  from: [number, number];
  /** A gym piece's use (poses.ts), and whether it's stood on (the anchor its feet's, not its hips'). */
  use?: Use;
  stand?: boolean;
}

export interface Place {
  x: number;
  z: number;
  /** The floor's height there. */
  y: number;
  yaw: number;
  /** Units a model unit. */
  s: number;
}

/** What one does on an island piece of the gym (by its model name: the layout's kind), or null: not the gym's. */
export const useOf = (key: string): Use | null => D.island[key]?.use ?? null;
/** The shape of a piece: the tent's by item code, the island's by model name (an outdoor catalogue piece's, its kind
 *  `nh-<code>`: its room piece's, layout/outdoor.ts). */
export const shapeOf = (where: 'tent' | 'island', key: string): Shape | null => D[where][key] ?? (where === 'island' ? (outdoorSeat(key) as Shape | null) : null);

/** A piece's anchors (one a seat or a sleeper), or [] when it has no shape. */
export function anchorsOf(sh: Shape | null, p: Place): Anchor[] {
  if (!sh) return [];
  const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
  // the model's (mx, mz) in the parent's space: turned by yaw (three's: +z toward +x by sin), scaled, moved
  const at = (mx: number, mz: number): [number, number] => [p.x + p.s * (mx * c + mz * sn), p.z + p.s * (-mx * sn + mz * c)];
  const dirYaw = (dx: number, dz: number) => p.yaw + Math.atan2(dx, dz);
  const use = sh.use ? { use: sh.use, stand: standsOn(sh.use) } : {};
  if (sh.k === 'u') {
    const [x, z] = at(sh.x, sh.z), [fx, fz] = at(sh.fx, sh.fz);
    return [{ lie: false, x, z, y: p.y + sh.y * p.s, yaw: p.yaw + sh.yaw, floor: p.y, depth: 0, back: 0, len: 0, pillow: 0, sway: false, from: [fx, fz], ...use }];
  }
  if (sh.k === 's') {
    return sh.x.map((mx) => {
      const [x, z] = at(mx, sh.z0), [fx, fz] = at(mx, sh.z1 + 6);
      return { lie: false, x, z, y: p.y + sh.y * p.s, yaw: p.yaw, floor: p.y, depth: (sh.z1 - sh.z0) * p.s, back: sh.back * p.s, len: 0, pillow: 0, sway: false, from: [fx, fz], ...use };
    });
  }
  return sh.c.map((mc) => {
    const head = sh.head < 0 ? sh.s[0] : sh.s[1];
    const [x, z] = sh.a === 'x' ? at(head, mc) : at(mc, head);
    // the feet's way along the bed; one gets on from its front side, by the bed's middle
    const yaw = sh.a === 'x' ? dirYaw(-sh.head, 0) : dirYaw(0, -sh.head);
    const mid = (sh.s[0] + sh.s[1]) / 2;
    const [fx, fz] = sh.a === 'x' ? at(mid, 10) : at(mc + (mc < 0 ? -1 : 1) * 2, sh.s[1] + 6);
    return { lie: true, x, z, y: p.y + sh.y * p.s, yaw, floor: p.y, depth: 0, back: 0, len: (sh.s[1] - sh.s[0]) * p.s, pillow: sh.py * p.s, sway: !!sh.sway, from: [fx, fz], ...use };
  });
}
