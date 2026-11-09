// Sitting and lying in the tent (docs/design.md "The tent": NH's chairs, sofas and beds), pure: a piece's seats (NH's
// interaction from the ACNH spreadsheet: a Chair is sat on, a Bed lain on; a sofa seats one a tile across, a double bed
// two), each its model's own pose (villager3d/seats3d.json: the seat's or the mattress's top, a bed's long axis and
// pillow end, from its geometry) turned and placed with the piece, and the free side one gets on and off it from.
import { ITEMS } from './items.ts';
import { TILE, centreOf, toRoom, type Facing, type Pt } from './grid.ts';
import { anchorsOf, shapeOf, type Anchor } from '../villager3d/seats3d.ts';

export interface Seat {
  /** The piece's id and which of its seats. */
  id: string;
  n: number;
  lie: boolean;
  /** Where one sits or lies (model units), how high, and the way the piece faces (its front). */
  at: Pt;
  y: number;
  front: Pt;
  /** Where to stand to get on and off it: the nearest free side's step. */
  from: Pt;
  /** Where a 3D villager sits or lies on it (its model's own seat, from its geometry: villager3d/seats3d.ts). */
  anchor: Anchor;
}

/** How far out of the footprint one stands to get on. */
const STEP = 4;

/** A seat's steps in the piece's own frame (+z its front), the one it prefers first: a seat's front, then its sides
 *  (a chair pushed in at a table); a bed's own side (a double bed's slot its half's), the other, then its foot. */
function stepsOf(item: string, n: number): [number, number][] {
  const m = ITEMS[item], sh = shapeOf('tent', item)!, W = (m.w * TILE) / 2 + STEP, D = (m.d * TILE) / 2 + STEP;
  if (sh.k === 's') {
    const x = sh.x[n], z = (sh.z0 + sh.z1) / 2;
    return [[x, D], [x < 0 ? -W : W, z], [x < 0 ? W : -W, z]];
  }
  if (sh.k !== 'l') return [];
  const c = sh.c[n], mid = (sh.s[0] + sh.s[1]) / 2, side = c < 0 ? -1 : 1, foot = -sh.head;
  return sh.a === 'x'
    ? [[mid, side * D], [mid, -side * D], [foot * W, c]]
    : [[side * W, mid], [-side * W, mid], [c, foot * D]];
}

/** A piece's seats as it stands (its spot in the room and its height off the floor, a thing on a table being none);
 *  none when its model has no pose for every seat (it isn't offered). `free`: whether one can stand at a point (the
 *  room's: grid.ts standable), `near`: who's getting on (the nearest free step is theirs; else the preferred free one). */
export function seatsOf(p: { id: string; item: string; x: number; z: number; f: Facing; y?: number }, free?: (at: Pt) => boolean, near?: Pt): Seat[] {
  const m = ITEMS[p.item];
  if (!m?.u || (p.y ?? 0) > 0) return [];
  const n = Math.max(1, m.n ?? 1), [cx, cz] = centreOf(p);
  const own = anchorsOf(shapeOf('tent', p.item), { x: cx, z: cz, y: 0, yaw: (p.f * Math.PI) / 2, s: 1 });
  if (own.length !== n || own.some((a) => a.lie !== (m.u === 'l'))) return [];
  const [fx, , fz] = toRoom([0, 0, 1], p.f), front: Pt = [fx, fz];
  return own.map((an, i) => {
    const steps = stepsOf(p.item, i).map(([x, z]): Pt => ((o) => [cx + o[0], cz + o[2]] as const)(toRoom([x, 0, z], p.f)));
    const ok = free ? steps.filter(free) : steps, d = (q: Pt) => (near ? Math.hypot(q[0] - near[0], q[1] - near[1]) : 0);
    const from: Pt = ok.length ? ok.reduce((a, b) => (d(b) < d(a) ? b : a)) : (steps[0] ?? an.from);
    return { id: p.id, n: i, lie: an.lie, at: [an.x, an.z] as Pt, y: an.y, front, from, anchor: { ...an, from: [from[0], from[1]] } };
  });
}
