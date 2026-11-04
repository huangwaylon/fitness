// The museum's seats (docs/design.md "The museum": the aquarium's benches), pure: NH's two park benches in the
// aquarium's aisle facing the great sea tank, two seats each, where each stands, and where and how a villager sits on
// it: the island's park bench's own seats (villager3d/seats3d.ts, from its model's geometry: scripts/seat-anchors.ts),
// at the museum's scale. The sitting itself is the rooms' (rooms/seating.ts).
import { anchorsOf, shapeOf, type Anchor } from '../villager3d/seats3d.ts';
import type { RoomSeat } from '../rooms/seating.ts';
import type { Pt } from './plan.ts';

/** The benches: each its id (a seat's piece on the relay: the `tent` intent's `seat`), its middle (x, z), its turn
 *  (three's yaw: π, its front toward −z, the great tank). The island's park bench (static/room/world3d), BENCH_S its
 *  model's units a museum unit. */
export const BENCHES: readonly { id: string; x: number; z: number; yaw: number }[] = [
  { id: 'dmbench1', x: 124, z: -20, yaw: Math.PI },
  { id: 'dmbench2', x: 196, z: -20, yaw: Math.PI }
];
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
