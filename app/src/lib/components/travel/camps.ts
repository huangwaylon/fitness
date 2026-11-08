// キャンプ場 (Okinawa's 35 campsites; docs/design.md §Trips): the page's one filter, a criterion at a time as the old
// site's (すべて, a kind, or one amenity), and a site's amenities in the order its row draws them. Pure.
import type { Camp } from '#lib/travel/types.ts';

export type CampFilter = 'all' | 'wild' | 'paid' | 'beach' | 'toilet' | 'shower';
export const CAMP_FILTERS: readonly CampFilter[] = ['all', 'wild', 'paid', 'beach', 'toilet', 'shower'];

/** Whether a campsite shows under a filter: all, its kind, or one amenity it has. */
export const campShown = (c: Camp, f: CampFilter): boolean => f === 'all' || (f === 'wild' || f === 'paid' ? c.type === f : c[f]);

/** The amenities a site has (its row's icons): the beach, a toilet, a shower. */
export const amenities = (c: Camp): ('beach' | 'toilet' | 'shower')[] => (['beach', 'toilet', 'shower'] as const).filter((k) => c[k]);
