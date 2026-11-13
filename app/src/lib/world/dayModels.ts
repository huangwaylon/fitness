// The art keys the island's finds, weeds and goal-tree fruit stand as today (Finds.svelte, Care.svelte,
// FruitTree.svelte: the same day's lists), known from the date and the clock alone: Island3D asks for their models with
// its first wave (things.ts prefetch). Their DOM nodes come later (Finds is a lazy chunk; its dig spots and mushrooms
// wait for the projector's first placing), and the phones' launches waited ~0.6 s past `loaded` for them (perf.boot
// lastM: finds/weed-fall, round-mushroom, fruit; review 2026-11-13 perf #3). What's been taken today isn't known here:
// a key too many is only a model decoded early.
import type { Season } from '#lib/ui-state/season.ts';
import { bottleAt, digSpots, findArt, shellsAt } from './beach.ts';
import { weedsAt } from './care.ts';
import { mushroomsOn } from './mushrooms.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';

/** The weed's model in `season` (Care.svelte's key). */
export const weedArt = (season: Season): string => `finds/weed-${season === 'autumn' ? 'fall' : season}`;

/** The keys of the finds and weeds lying on the island on `date` at `ms` into the (Tokyo) day, and the trees' fruit. */
export function dayFindKeys(date: string, ms: number, season: Season, seed?: string): Set<string> {
  const keys = new Set<string>([findArt('rock'), ...RING_FRUITS.map((f) => `fruit/${f}`)]);
  if (weedsAt(date, ms, seed).length) keys.add(weedArt(season));
  if (digSpots(date, new Set(), seed).length) keys.add('finds/dig-spot');
  for (const m of mushroomsOn(date, seed)) keys.add(findArt(m.id));
  for (const s of shellsAt(date, ms, seed)) keys.add(findArt(s.id));
  if (bottleAt(date, ms, seed)) keys.add(findArt('message-bottle'));
  return keys;
}
