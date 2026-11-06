// キャンプ's filter (docs/design.md §Trips): one kind (all / free / paid) and any of the amenities (beach, toilet,
// shower), all of them at once; each chip's count is what the list would hold with that chip pressed.
import type { Camp } from '#lib/travel/types.ts';

export type CampKind = 'all' | 'wild' | 'paid';
export type Amenity = 'beach' | 'toilet' | 'shower';
export const KINDS: readonly CampKind[] = ['all', 'wild', 'paid'];
export const AMENITIES: readonly Amenity[] = ['beach', 'toilet', 'shower'];

interface CampFilter { kind: CampKind; has: readonly Amenity[] }

/** The camps that pass the filter, in the guide's order (by road time from the office). */
export const campsFor = (camps: readonly Camp[], f: CampFilter): Camp[] =>
  camps.filter((c) => (f.kind === 'all' || c.type === f.kind) && f.has.every((a) => c[a]));

/** How many a chip would show: the kind swapped, or the amenity toggled on (an amenity already on: what shows now). */
export function countWith(camps: readonly Camp[], f: CampFilter, chip: CampKind | Amenity): number {
  if ((KINDS as readonly string[]).includes(chip)) return campsFor(camps, { ...f, kind: chip as CampKind }).length;
  const a = chip as Amenity;
  return campsFor(camps, { ...f, has: f.has.includes(a) ? f.has : [...f.has, a] }).length;
}
