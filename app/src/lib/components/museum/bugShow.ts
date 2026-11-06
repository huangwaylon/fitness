// Which bugs live in the bug wing this hour, and where (docs/design.md "The museum", "The hour's bugs"), pure: as the
// aquarium's fish (species.ts onDisplay), at most BUGS_SHOWN of those the ずかん says were caught, none twice, by a
// shuffle seeded by (Tokyo's date and hour, 'bug'): the same ten on every phone, a new ten each hour. Each takes a
// place of its own (bugLife.ts slotsOf: an air box, a flower, a half of the pond, a patch, a case, a trunk), so no two
// stack or come into each other's room; one whose places are all taken this hour is passed over for the next.
import { slotsOf } from './bugLife.ts';
import { hourShuffle, type Habitat, type Specimen } from './species.ts';

/** The most bugs on show at once (the user: "reduce # down to 10 random ones"). */
export const BUGS_SHOWN = 10;

/** A bug on show: it, and its place (its habitat's `slot`-th: bugLife's). */
export interface Shown { sp: Specimen; slot: number }

/** This hour's bugs (hourOf's `hour`) from those on show (species.ts onShow), each in its own place, in the shuffle's
 *  order. */
export function bugsOnDisplay(bugs: readonly Specimen[], hour: number): Shown[] {
  const taken = new Set<string>(), out: Shown[] = [];
  for (const sp of hourShuffle(bugs.filter((s) => s.kind === 'bug'), hour, 'bug')) {
    if (out.length >= BUGS_SHOWN) break;
    const slot = slotsOf(sp.id, sp.tank as Habitat).find((s) => !s.takes.some((t) => taken.has(t)));
    if (!slot) continue;
    for (const t of slot.takes) taken.add(t);
    out.push({ sp, slot: slot.i });
  }
  return out;
}
