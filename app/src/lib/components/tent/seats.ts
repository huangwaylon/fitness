// Sitting and lying in the tent (docs/design.md "The tent": NH's chairs, sofas and beds), pure: a piece's seats (NH's
// interaction from the ACNH spreadsheet: a Chair is sat on, a Bed lain on; a sofa seats one a tile across, a double bed
// two), where each one is in the room, how high, which way it faces, and where to stand to get on it.
import { ITEMS, footprint } from './items.ts';
import { TILE, centreOf, type Facing, type Pt } from './grid.ts';
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
  /** Where to stand to get on it: a step out in front. */
  from: Pt;
  /** Where a 3D villager sits or lies on it (its model's own seat, from its geometry: villager3d/seats3d.ts). */
  anchor?: Anchor;
}

/** A piece's seats as it stands (its spot in the room and its height off the floor, a thing on a table being none). */
export function seatsOf(p: { id: string; item: string; x: number; z: number; f: Facing; y?: number }): Seat[] {
  const m = ITEMS[p.item];
  if (!m?.u || (p.y ?? 0) > 0) return [];
  const lie = m.u === 'l', n = Math.max(1, m.n ?? 1);
  const [cx, cz] = centreOf(p), a = (p.f * Math.PI) / 2;
  // the piece's own axes turned: across (its width) and its front (+z as modelled)
  const across: Pt = [Math.cos(a), -Math.sin(a)], front: Pt = [Math.sin(a), Math.cos(a)];
  const [w, d] = [m.w, m.d], y = Math.min(lie ? 7 : 6, m.h * (lie ? 0.7 : 0.55));
  void footprint;
  // the model's own seats (its geometry's): where, how high, and where to step up to them
  const own = anchorsOf(shapeOf('tent', p.item), { x: cx, z: cz, y: 0, yaw: a, s: 1 });
  if (own.length === n)
    return own.map((an, i) => ({ id: p.id, n: i, lie, at: [an.x, an.z] as Pt, y: an.y, front, from: an.from, anchor: an }));
  return Array.from({ length: n }, (_, i) => {
    const off = ((i + 0.5) / n - 0.5) * w * TILE;
    const at: Pt = [cx + across[0] * off, cz + across[1] * off];
    const step = (d * TILE) / 2 + 5;
    return { id: p.id, n: i, lie, at, y, front, from: [at[0] + front[0] * step, at[1] + front[1] * step] };
  });
}
