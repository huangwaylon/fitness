import { describe, expect, it } from 'vitest';
import { deriveVisits, type PresenceEvent } from '#lib/scoring/visits.ts';

const places = [{ key: 'gym', autoStrength: false }, { key: 'pt', autoStrength: true }];
const ev = (id: number, placeKey: string, event: 'arrive' | 'leave', at: string): PresenceEvent => ({ id, placeKey, event, at });

describe('deriveVisits', () => {
  it('pairs arrive→leave per place, sorts by time, applies place and confirmation flags', () => {
    const out = deriveVisits(
      [
        ev(4, 'pt', 'leave', '2026-11-04T11:00:00+09:00'),
        ev(1, 'gym', 'arrive', '2026-11-03 07:00:00 +0900'),
        ev(3, 'pt', 'arrive', '2026-11-04T10:00:00+09:00'),
        ev(2, 'gym', 'leave', '2026-11-03 08:05:30 +0900')
      ],
      places,
      new Map([[1, true]])
    );
    expect(out).toEqual([
      { placeKey: 'gym', date: '2026-11-03', arriveAt: '2026-11-03 07:00:00 +0900', leaveAt: '2026-11-03 08:05:30 +0900', dwellMin: 65, autoStrength: false, confirmed: true, arriveEventId: 1 },
      { placeKey: 'pt', date: '2026-11-04', arriveAt: '2026-11-04T10:00:00+09:00', leaveAt: '2026-11-04T11:00:00+09:00', dwellMin: 60, autoStrength: true, confirmed: null, arriveEventId: 3 }
    ]);
  });
  it('drops short visits (< 30 min) but keeps exactly 30', () => {
    const out = deriveVisits(
      [ev(1, 'gym', 'arrive', '2026-11-03T07:00:00+09:00'), ev(2, 'gym', 'leave', '2026-11-03T07:29:59+09:00'),
        ev(3, 'gym', 'arrive', '2026-11-03T18:00:00+09:00'), ev(4, 'gym', 'leave', '2026-11-03T18:30:00+09:00')],
      places, new Map()
    );
    expect(out.map((v) => v.arriveEventId)).toEqual([3]);
  });
  it('drops unmatched events; a repeated arrive replaces the stale one', () => {
    const out = deriveVisits(
      [ev(1, 'gym', 'leave', '2026-11-03T06:00:00+09:00'), // leave with no arrive
        ev(2, 'gym', 'arrive', '2026-11-03T07:00:00+09:00'), // stale (lost leave)
        ev(3, 'gym', 'arrive', '2026-11-04T07:00:00+09:00'),
        ev(4, 'gym', 'leave', '2026-11-04T08:00:00+09:00'),
        ev(5, 'gym', 'arrive', '2026-11-05T07:00:00+09:00')], // never left
      places, new Map()
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ arriveEventId: 3, dwellMin: 60, date: '2026-11-04' });
  });
  it('does not pair across places; unknown places are not autoStrength', () => {
    const out = deriveVisits(
      [ev(1, 'gym', 'arrive', '2026-11-03T07:00:00+09:00'), ev(2, 'pt', 'leave', '2026-11-03T08:00:00+09:00'),
        ev(3, 'park', 'arrive', '2026-11-03T09:00:00+09:00'), ev(4, 'park', 'leave', '2026-11-03T10:00:00+09:00')],
      places, new Map()
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ placeKey: 'park', autoStrength: false });
  });
  it('dates the visit by the Tokyo date of arrival (midnight crossing, UTC input)', () => {
    const out = deriveVisits(
      [ev(1, 'gym', 'arrive', '2026-11-03T14:40:00Z'), ev(2, 'gym', 'leave', '2026-11-03T15:20:00Z')],
      places, new Map([[1, false]])
    );
    expect(out[0]).toMatchObject({ date: '2026-11-03', dwellMin: 40, confirmed: false });
  });
  it('returns [] for no events', () => {
    expect(deriveVisits([], places, new Map())).toEqual([]);
  });
});
