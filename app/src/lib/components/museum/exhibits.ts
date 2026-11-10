// The museum's exhibits (docs/design.md "The museum"): what's on show (species.ts, fossils.ts, art.ts), built into the
// wings once the engine is up and again as the finds come: the aquarium's tanks and fish (aquarium.ts), the garden's
// bugs (garden.ts), and, each once my villager has come near it (MuseumRoom: a wing's models fetched only then), the
// sea creatures' tanks (seaLife.ts), the fossils (fossilWing.ts) and the art gallery (gallery.ts).
// A wing is rebuilt only when its own list changed (a new fish rebuilds the aquarium, not the garden).
import type { Exhibit, Museum } from './engine.ts';
import type { Wing } from './plan.ts';
import type { Specimen } from './species.ts';
import type { FossilOnShow } from './fossils.ts';
import type { ArtOnShow } from './art.ts';
import { buildAquarium } from './aquarium.ts';
import { buildGarden } from './garden.ts';
import { buildSeaLife } from './seaLife.ts';
import { buildFossils } from './fossilWing.ts';
import { buildGallery } from './gallery.ts';

/** Everything on show: the creatures (fish, bugs, sea creatures), the fossils, the art. */
export interface OnShow { list: readonly Specimen[]; fossils: readonly FossilOnShow[]; art: readonly ArtOnShow[] }
/** The wings built only once woken (near: their packs fetched then). */
export const LAZY: readonly Wing[] = ['sea', 'fossil', 'art'];

const built = new WeakMap<Museum, Map<string, { key: string; e: Exhibit }>>();

/** Show these (each wing rebuilt with its own when they changed; the aquarium picks its fish and the garden its bugs by
 *  `clock`'s hour; a lazy wing only once in `awake`). */
export function show(m: Museum, on: OnShow, clock?: () => number, awake: ReadonlySet<Wing> = new Set()): void {
  const wings = built.get(m) ?? built.set(m, new Map()).get(m)!;
  const put = (wing: Wing, ids: readonly { id: string }[], build: () => Exhibit) => {
    if (LAZY.includes(wing) && !awake.has(wing)) return;
    const key = ids.map((s) => s.id).join(',');
    const was = wings.get(wing);
    if (was && was.key === key) return;
    if (was) m.drop(was.e);
    const e = build();
    m.exhibit(e);
    wings.set(wing, { key, e });
  };
  const { list } = on;
  const fish = list.filter((s) => s.kind === 'fish');
  put('fish', fish, () => buildAquarium(m.kit, fish, clock));
  const bugs = list.filter((s) => s.kind === 'bug');
  put('bug', bugs, () => buildGarden(m.kit, bugs, clock));
  const sea = list.filter((s) => s.kind === 'sea');
  put('sea', sea, () => buildSeaLife(m.kit, sea));
  put('fossil', on.fossils, () => buildFossils(m.kit, on.fossils));
  put('art', on.art, () => buildGallery(m.kit, on.art));
}
