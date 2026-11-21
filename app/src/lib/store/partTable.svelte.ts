// The parts this app has (contract/look.ts usePartTable; contract/partIds.json, from scripts/players3d-models.ts: an id
// ending in a digit by its line, the rest exactly): a look naming any other (a newer app's, one dropped) reads as
// いつもの's part, and this phone never sends one. (The relay keeps the form check only: a newer phone's part survives
// an older relay; each phone draws what it has.) The table (~40 KB) is its own chunk, asked for as this module loads
// (with store/look.ts, at launch) but off the first load; until it's in every well-formed part passes, and lookOf
// reads `parts.ready`, so a look is read again once it is.
import { usePartTable } from '#lib/contract/look.ts';

export const parts = $state({ ready: false });

void import('#lib/contract/partIds.json').then(
  ({ default: ids }) => {
    const exact = new Set<string>(ids.exact), lines = ids.lines as Record<string, string>;
    usePartTable({ has: (id) => exact.has(id) || (lines[id.slice(0, -1)] ?? '').includes(id.slice(-1)) });
    parts.ready = true;
  },
  () => {} // (no table: the form check alone, as the relay's)
);
