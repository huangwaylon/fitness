// キャンプ場's filter (camps.ts): one criterion at a time, over Okinawa's 26 sites.
import { describe, expect, it } from 'vitest';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { amenities, CAMP_FILTERS, campShown } from './camps.ts';

const camps = okinawa.camps!;
const n = (f: (typeof CAMP_FILTERS)[number]) => camps.filter((c) => campShown(c, f)).length;

describe('the campsites filter', () => {
  it('all, a kind, or one amenity: the kinds split the 26', () => {
    expect(n('all')).toBe(26);
    expect(n('wild') + n('paid')).toBe(26);
    expect(n('paid')).toBe(11);
    for (const f of ['beach', 'toilet', 'shower'] as const) expect(n(f)).toBe(camps.filter((c) => c[f]).length);
  });
  it('a site’s amenities in the row’s order', () => {
    expect(amenities({ ...camps[0], beach: true, toilet: false, shower: true })).toEqual(['beach', 'shower']);
  });
});
