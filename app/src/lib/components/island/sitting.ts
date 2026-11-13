// Sitting and lying out on the island (docs/design.md "Decor: sitting"), as in the tent (tent/seats.ts): a tap on a
// bench, a stool, a chair, the hammock or the beach chair walks my villager up to it, a step in front (layout/nav.ts
// seatsOf: its seat's spot), and there it turns and sits or lies down on the piece's own seat (villager3d/seats3d.ts
// anchorsOf, villager3d sitAt), one villager a seat (a bench two). A villager standing still on a seat's spot is on it
// (world.ts seatAt), so every phone draws the same from where the walks leave it: the relay's walk is all it takes,
// and its end (when it sat) settles two phones taking one seat at the same moment (yieldsSeat). Pure but for the
// layout it's given.
import { anchorsOf, shapeOf, type Anchor } from '../villager3d/seats3d.ts';
import { liesOn, seatsOf, yawOf } from '#lib/layout/nav.ts';
import { objMid, type Layout, type Obj } from '#lib/layout/model.ts';
import { kindDef } from '#lib/layout/catalog.ts';
import MODELS from '#lib/world/models.json' with { type: 'json' };
import { DECOR_U } from '#lib/world/world.ts';
import { outsat } from '../rooms/seating.ts';
import type { Who } from '#lib/types.ts';

type Pt = readonly [number, number];
const MU = MODELS as unknown as Record<string, { mu: [number, number] }>;

export interface SeatSpot {
  /** Its spot's name (a walk-graph node: world.ts SEATS) and where it is (a step in front of the seat). */
  name: string;
  at: Pt;
  /** Its piece (a layout object's id, its kind) and which of its seats (left to right as it faces us). */
  piece: string;
  kind: string;
  n: number;
  lie: boolean;
}

/** A piece's seats (none: not a seat, or no model of it to sit on). */
export function seatSpots(l: Layout, o: Obj): SeatSpot[] {
  if (!shapeOf('island', o.k)) return [];
  return seatsOf(l, o).map(([name, at], n) => ({ name, at, piece: o.id, kind: o.k, n, lie: liesOn(o.k) }));
}

/** The seat whose spot is `name`, or null. */
export function seatNamed(l: Layout, name: string): SeatSpot | null {
  for (const o of l.objects.values()) {
    const s = seatSpots(l, o).find((q) => q.name === name);
    if (s) return s;
  }
  return null;
}

/** A piece's model scale as the 3D island stands it (world3d/objects.ts): the fixed decor at NH's furniture scale, the
 *  scenery's stools fitted to their height. */
const scaleOf = (o: Obj): number => (o.k === 'log-stool' ? (kindDef(o.k)?.h ?? 19) / (MU['deco/log-stool']?.mu[1] ?? 6.3) : DECOR_U);

/** Where a 3D villager sits or lies on the seat whose spot is `name` (three's space: z the world's −z, on the ground
 *  at `floor`), or null. */
export function seatAnchor(l: Layout, name: string, floor: number): Anchor | null {
  const s = seatNamed(l, name), o = s && l.objects.get(s.piece);
  if (!s || !o) return null;
  const [x, z] = objMid(l, o);
  return anchorsOf(shapeOf('island', o.k), { x, z: -z, y: floor, yaw: yawOf(o), s: scaleOf(o) })[s.n] ?? null;
}

/** Which of a piece's seats to take from `from`: the nearest one nobody else is on (`taken`), or null (all taken). */
export function freeSeat(spots: readonly SeatSpot[], from: Pt, taken: (s: SeatSpot) => boolean): SeatSpot | null {
  const d = (s: SeatSpot) => Math.hypot(s.at[0] - from[0], s.at[1] - from[1]);
  return spots.filter((s) => !taken(s)).sort((a, b) => d(a) - d(b))[0] ?? null;
}

/** Whether a seat is there today: a decor spot's piece may be another look on the day (fixedDecor.ts: the illuminated
 *  tree in the hammock's, the picnic set on the pond's bench, the beach chair only in its summer); the rest always. */
export function seatOpen(s: SeatSpot, pieces: readonly { id: string; key: string }[], slots: readonly { id: string }[]): boolean {
  if (!slots.some((d) => d.id === s.piece)) return true;
  return pieces.some((p) => p.id === s.piece && p.key === `deco/${s.kind}`);
}

/** Whether an art key is a seat's own look (`deco/<kind>` with a model seat: its tap area sits). */
export const sitLook = (key: string): boolean => key.startsWith('deco/') && !!shapeOf('island', key.slice(5));

/** The seat piece on the ground at (x, z), its footprint and a little round it (a tap there: a 3D piece with no tap
 *  area of its own, an iron chair), or null. */
export function seatPieceAt(l: Layout, x: number, z: number, pad = 8): Obj | null {
  for (const o of l.objects.values()) {
    const def = kindDef(o.k);
    if (!def?.foot || !shapeOf('island', o.k)) continue;
    const [mx, mz] = objMid(l, o), [w, d] = def.turns && o.f % 2 ? [def.foot[1], def.foot[0]] : def.foot;
    if (Math.abs(x - mx) <= w / 2 + pad && Math.abs(z - mz) <= d / 2 + pad) return o;
  }
  return null;
}

/** When a villager's last walk (the relay's) sat it down, on the relay's clock: the walk's end, `s` + `ms` (both whole
 *  ms as sent, so every phone has the same number; a field of its own would take the longest walk past the relay's
 *  MAX_BYTES); null: unknown (an older phone's bare walk, only `to`). */
export function sitTimeOf(w: { s?: number; ms?: number } | null | undefined): number | null {
  return w?.s !== undefined && w.ms !== undefined ? w.s + w.ms : null;
}

/** Others on my seat with me (two phones took it at the same moment, each before it heard the other): whether mine
 *  gets up. The earlier sit keeps it, an exact tie by who (rooms/seating.ts outsat: the same rule on every phone, so only
 *  one gets up); an unknown sit time (an older phone's walk) never outsits a known one, and two unknown both stay. */
export function yieldsSeat(mine: { who: Who; s: number | null }, others: readonly { who: Who; s: number | null }[]): boolean {
  return others.some((o) => o.s !== null && (mine.s === null || outsat({ s: mine.s, who: mine.who }, { s: o.s, who: o.who })));
}
