// The museum's exhibits (docs/design.md "The museum"): what's on show (species.ts, fossils.ts, art.ts), built into the
// rooms once the engine is up and again as the finds come: the aquarium's tanks and fish (aquarium.ts), the garden's
// bugs (garden.ts), and, each once my villager has come near its room (MuseumRoom: their models fetched only then), the
// sea creatures' tanks in the aquarium (seaLife.ts), each fossil room's fossils (fossilWing.ts) and each
// gallery room's art (gallery.ts); and the benches of each room that has some (benches.ts). A unit is rebuilt only
// when its own list changed (a new fish rebuilds the aquarium, not the garden; a new T. rex piece F2, not F1).
import type { Exhibit, Museum } from './engine.ts';
import { wingOfRoom, type RoomId, type Wing } from './plan.ts';
import type { Specimen } from './species.ts';
import { SPOTS as FOSSIL_SPOTS, type FossilOnShow } from './fossils.ts';
import { ART_SPOTS, type ArtOnShow } from './art.ts';
import { buildAquarium } from './aquarium.ts';
import { buildGarden } from './garden.ts';
import { buildSeaLife } from './seaLife.ts';
import { buildFossils } from './fossilWing.ts';
import { buildGallery } from './gallery.ts';
import { BENCH_ROOMS, buildBenches } from './benches.ts';

/** Everything on show: the creatures (fish, bugs, sea creatures), the fossils, the art. */
export interface OnShow { list: readonly Specimen[]; fossils: readonly FossilOnShow[]; art: readonly ArtOnShow[] }
/** A unit of exhibits: its key, its wing (the exhibit's), the room it's drawn in, whether it waits to be woken. */
export interface Unit { key: string; wing: Wing; room: RoomId; lazy: boolean }
export const UNITS: readonly Unit[] = [
  { key: 'fish', wing: 'fish', room: 'fish', lazy: false },
  { key: 'bug', wing: 'bug', room: 'bug', lazy: false },
  { key: 'sea', wing: 'fish', room: 'fish', lazy: true },
  ...(['F1', 'F2', 'F3'] as const).map((room) => ({ key: room, wing: 'fossil' as const, room, lazy: true })),
  ...(['G1', 'G2'] as const).map((room) => ({ key: room, wing: 'art' as const, room, lazy: true })),
  ...BENCH_ROOMS.map((room) => ({ key: `bench:${room}`, wing: wingOfRoom(room), room, lazy: false }))
];
/** The units built only once woken (near: their packs fetched then). */
export const LAZY: readonly string[] = UNITS.filter((u) => u.lazy).map((u) => u.key);

const built = new WeakMap<Museum, Map<string, { key: string; e: Exhibit }>>();

/** Show these (each unit rebuilt with its own when they changed; the aquarium picks its fish and the garden its bugs by
 *  `clock`'s hour; a lazy one only once its room, or its wing, is in `awake`). */
export function show(m: Museum, on: OnShow, clock?: () => number, awake: ReadonlySet<Wing | RoomId> = new Set()): void {
  const units = built.get(m) ?? built.set(m, new Map()).get(m)!;
  const put = (u: Unit, ids: readonly { id: string }[], build: () => Exhibit) => {
    if (u.lazy && !awake.has(u.room) && !awake.has(u.wing)) return;
    const key = ids.map((s) => s.id).join(',');
    const was = units.get(u.key);
    if (was && was.key === key) return;
    if (was) m.drop(was.e);
    const e = build();
    // (the room it's drawn in: the engine draws a room's own only)
    e.room = u.room;
    m.exhibit(e);
    units.set(u.key, { key, e });
  };
  const { list } = on;
  for (const u of UNITS) {
    if (u.key.startsWith('bench:')) put(u, [], () => buildBenches(m.kit, u.room));
    else if (u.key === 'fish' || u.key === 'bug' || u.key === 'sea') {
      const kind = u.key, mine = list.filter((s) => s.kind === kind);
      put(u, mine, () => (kind === 'fish' ? buildAquarium(m.kit, mine, clock) : kind === 'bug' ? buildGarden(m.kit, mine, clock) : buildSeaLife(m.kit, mine)));
    } else if (u.wing === 'fossil') {
      const mine = on.fossils.filter((f) => FOSSIL_SPOTS.get(f.id)?.room === u.room);
      put(u, mine, () => buildFossils(m.kit, mine));
    } else {
      const mine = on.art.filter((a) => ART_SPOTS.get(a.id)?.room === u.room);
      put(u, mine, () => buildGallery(m.kit, mine, u.room));
    }
  }
}
