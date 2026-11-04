// The museum's exhibits (docs/design.md "The museum"): what's on show (species.ts), built into the wings once the
// engine is up and again as the finds come: the aquarium's tanks and fish (aquarium.ts), the garden's bugs (garden.ts).
// A wing is rebuilt only when its own list changed (a new fish rebuilds the aquarium, not the garden).
import type { Exhibit, Museum } from './engine.ts';
import type { Specimen } from './species.ts';
import { buildAquarium } from './aquarium.ts';
import { buildGarden } from './garden.ts';

const built = new WeakMap<Museum, Map<string, { key: string; e: Exhibit }>>();

/** Show these specimens (each wing rebuilt with its own when they changed; the aquarium picks its fish by `clock`'s hour). */
export function show(m: Museum, list: readonly Specimen[], clock?: () => number): void {
  const wings = built.get(m) ?? built.set(m, new Map()).get(m)!;
  const put = (wing: string, mine: readonly Specimen[], build: () => Exhibit) => {
    const key = mine.map((s) => s.id).join(',');
    const was = wings.get(wing);
    if (was && was.key === key) return;
    if (was) m.drop(was.e);
    const e = build();
    m.exhibit(e);
    wings.set(wing, { key, e });
  };
  const fish = list.filter((s) => s.kind === 'fish');
  put('fish', fish, () => buildAquarium(m.kit, fish, clock));
  const bugs = list.filter((s) => s.kind === 'bug');
  put('bug', bugs, () => buildGarden(m.kit, bugs));
}
