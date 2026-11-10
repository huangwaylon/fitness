// A room's benches (docs/design.md "The museum"; where they stand: seats.ts), an exhibit of their own so every room
// that has some draws them, keeps the walk off them and makes them tappable (engine.ts seats): the island's park bench,
// loaded once, a clone a bench. Nothing on them moves (frame never asks for one).
import { Group } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import { wingOfRoom, type RoomId } from './plan.ts';
import { BENCHES, BENCH_HALF, BENCH_MODEL, BENCH_S, benchRect } from './seats.ts';

/** The rooms with benches. */
export const BENCH_ROOMS: readonly RoomId[] = [...new Set(BENCHES.map((b) => b.room))];

export function buildBenches(kit: Kit, room: RoomId): Exhibit {
  const group = new Group();
  let disposed = false;
  const b = kit.islandBounds(BENCH_MODEL);
  const half: [number, number] = b ? [((b.max[0] - b.min[0]) * BENCH_S) / 2, ((b.max[2] - b.min[2]) * BENCH_S) / 2] : [...BENCH_HALF];
  const h = (b ? b.max[1] : 10) * BENCH_S;
  const mine = BENCHES.filter((q) => q.room === room);
  const holders = mine.map(({ x, z, yaw }) => {
    const holder = new Group();
    holder.position.set(x, 0, z);
    holder.rotation.y = yaw;
    holder.scale.setScalar(BENCH_S);
    group.add(holder);
    return holder;
  });
  void kit.island(BENCH_MODEL).then((g) => {
    if (!g || disposed) return;
    for (const holder of holders) holder.add(g.scene.clone(true));
    kit.invalidate();
  });
  return {
    group,
    wing: wingOfRoom(room),
    room,
    blocks: [],
    seats: mine.map((q) => ({ id: q.id, h, ...benchRect(q, half) })),
    frame: () => false,
    pick: () => null,
    where: () => null,
    shown: () => [],
    night: () => {},
    dispose() {
      disposed = true;
      group.removeFromParent();
    }
  };
}
