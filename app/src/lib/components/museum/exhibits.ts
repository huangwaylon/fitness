// The museum's exhibits (docs/design.md "The museum"): what's on show (species.ts), built into the wings once the
// engine is up and again as the finds come: the aquarium's tanks (aquarium.ts) and the garden's (garden.ts).
import type { Museum } from './engine.ts';
import type { Specimen } from './species.ts';

/** Show these specimens (each wing rebuilt with its own). */
export function show(e: Museum, list: readonly Specimen[]): void {
  void e;
  void list;
}
