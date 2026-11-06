// キャンプ場's filter (docs/design.md §Trips): one kind (all / free / paid), any of the amenities (beach, toilet,
// shower), and the shortlist (候補: a camp with one of our chips), all at once; each chip's count is what the list
// would hold with that chip pressed.
import type { Camp } from '#lib/travel/types.ts';

export type CampKind = 'all' | 'wild' | 'paid';
export type Amenity = 'beach' | 'toilet' | 'shower';
export const AMENITIES: readonly Amenity[] = ['beach', 'toilet', 'shower'];

interface CampFilter { kind: CampKind; has: readonly Amenity[]; picks?: boolean }

/** On our shortlist: one of its chips is ours (1泊目 / 2泊目 / 候補). */
export const isPicked = (c: Camp): boolean => c.chips.some((x) => x.pick);

/** The camps that pass the filter, in the guide's order (by road time from the office). */
export const campsFor = (camps: readonly Camp[], f: CampFilter): Camp[] =>
  camps.filter((c) => (f.kind === 'all' || c.type === f.kind) && f.has.every((a) => c[a]) && (!f.picks || isPicked(c)));

/** How many a chip would show: the kind swapped, the amenity or the shortlist toggled on (one already on: what shows
 *  now). */
export function countWith(camps: readonly Camp[], f: CampFilter, chip: CampKind | Amenity | 'picks'): number {
  if (chip === 'picks') return campsFor(camps, { ...f, picks: true }).length;
  if (chip === 'all' || chip === 'wild' || chip === 'paid') return campsFor(camps, { ...f, kind: chip }).length;
  return campsFor(camps, { ...f, has: f.has.includes(chip) ? f.has : [...f.has, chip] }).length;
}
