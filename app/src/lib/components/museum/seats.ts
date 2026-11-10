// The museum's seats (docs/design.md "The museum": its benches), pure: NH's park benches, two seats each, in the
// rooms where one lingers (the aquarium's aisle facing the great sea tank; the hall's sides and the gallery's front
// bands facing the camera, so their fronts and who sits there read; beside the T. rex's island facing it), where each stands, and where
// and how a villager sits on it: the island's park bench's own seats (villager3d/seats3d.ts, from its model's geometry: scripts/seat-anchors.ts),
// at the museum's scale. The sitting itself is the rooms' (rooms/seating.ts).
import { anchorsOf, shapeOf, type Anchor } from '../villager3d/seats3d.ts';
import type { RoomSeat } from '../rooms/seating.ts';
import type { Pt, Rect, RoomId } from './plan.ts';

/** A bench: its id (a seat's piece on the relay: the `tent` intent's `seat`), its room, its middle (x, z), its turn
 *  (three's yaw: 0 its front toward +z, π toward −z). */
export interface Bench { id: string; room: RoomId; x: number; z: number; yaw: number }
/** The benches (the island's park bench, static/room/world3d; BENCH_S its model's units a museum unit). The aquarium's
 *  keep their ids (a seat heard from an older phone still lands). */
export const BENCHES: readonly Bench[] = [
  { id: 'dmbench1', room: 'fish', x: 104, z: 16, yaw: Math.PI },
  { id: 'dmbench2', room: 'fish', x: 152, z: 16, yaw: Math.PI },
  { id: 'hbench1', room: 'hall', x: -42, z: 54, yaw: 0 },
  { id: 'hbench2', room: 'hall', x: 42, z: 54, yaw: 0 },
  { id: 'g1bench', room: 'G1', x: 88, z: -72, yaw: 0 },
  { id: 'g2bench', room: 'G2', x: 163, z: -72, yaw: 0 },
  { id: 'f2bench', room: 'F2', x: -132, z: -136, yaw: -Math.PI / 2 }
];
/** A bench's floor (its model's, about: benches.ts measures it), turned with it. */
export const BENCH_HALF: Pt = [11, 6];
export function benchRect(b: Bench, half: Pt = BENCH_HALF): Rect {
  const side = Math.abs(Math.sin(b.yaw)) > 0.7, [hx, hz] = side ? [half[1], half[0]] : half;
  return { x0: b.x - hx, x1: b.x + hx, z0: b.z - hz, z1: b.z + hz };
}
export const BENCH_S = 1.2;
/** The bench's model (the island's). */
export const BENCH_MODEL = 'park-bench';

export interface MuseumSeat extends RoomSeat {
  /** Where a 3D villager sits on it (villager3d sitAt). */
  anchor: Anchor;
}

/** A bench's seats, in its model's order (none: no such bench, or its model has no seats). */
export function benchSeats(id: string): MuseumSeat[] {
  const b = BENCHES.find((q) => q.id === id);
  if (!b) return [];
  return anchorsOf(shapeOf('island', BENCH_MODEL), { x: b.x, z: b.z, y: 0, yaw: b.yaw, s: BENCH_S }).map((a, n) => ({
    id: b.id, n, lie: a.lie, at: [a.x, a.z] as Pt, from: a.from, anchor: a
  }));
}

/** The seat `n` of bench `id`, or null. */
export const seatOf = (id: string, n: number): MuseumSeat | null => benchSeats(id)[n] ?? null;
