import { describe, expect, it } from 'vitest';
import { currentRow, daysFrom, instantIn, phaseOf, rowMin, sortTrips, todayDay, wallIn } from './when.ts';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { nz } from '#lib/travel/trips/nz.ts';
import { seattle } from '#lib/travel/trips/seattle.ts';

/** A Tokyo wall time as an instant (what ?date= means). */
const jst = (s: string) => Date.parse(`${s}:00+09:00`);
/** An Auckland wall time in February (NZDT, UTC+13). */
const nzdt = (s: string) => Date.parse(`${s}:00+13:00`);

describe('zones', () => {
  it('reads an instant on the trip’s own clock', () => {
    expect(wallIn('Asia/Tokyo', jst('2026-10-10T06:10'))).toEqual({ date: '2026-10-10', min: 370 });
    // Tokyo's 20:00 on Feb 13 is already Feb 14, 00:00 in Auckland
    expect(wallIn('Pacific/Auckland', jst('2027-02-13T20:00'))).toEqual({ date: '2027-02-14', min: 0 });
    expect(wallIn('America/Los_Angeles', Date.parse('2026-07-03T15:30:00Z'))).toEqual({ date: '2026-07-03', min: 8 * 60 + 30 });
  });
  it('turns a local wall time into its instant, across midnight both ways', () => {
    expect(instantIn('Pacific/Auckland', '2027-02-16', 24 * 60 + 10)).toBe(nzdt('2027-02-17T00:10'));
    expect(instantIn('Pacific/Auckland', '2027-02-11', 18 * 60 + 30 - 1440)).toBe(nzdt('2027-02-10T18:30'));
    expect(instantIn('America/Los_Angeles', '2026-07-02', 9 * 60 + 36)).toBe(Date.parse('2026-07-02T16:36:00Z'));
  });
  it('counts whole days and reads row times as written', () => {
    expect(daysFrom('2026-11-04', '2027-02-11')).toBe(99);
    expect([rowMin('06:10'), rowMin('~12:00'), rowMin('<21:00'), rowMin('9:36'), rowMin(''), rowMin(undefined)]).toEqual([370, 720, 1260, 576, null, null]);
  });
});

describe('where a trip stands', () => {
  it('counts down, then the day of the trip, then past', () => {
    expect(phaseOf(okinawa, jst('2026-10-01T12:00'))).toEqual({ k: 'soon', days: 9 });
    expect(phaseOf(okinawa, jst('2026-10-09T23:59'))).toEqual({ k: 'soon', days: 1 });
    expect(phaseOf(okinawa, jst('2026-10-10T00:00'))).toEqual({ k: 'now', day: 1 });
    expect(phaseOf(okinawa, jst('2026-10-12T23:00'))).toEqual({ k: 'now', day: 3 });
    expect(phaseOf(okinawa, jst('2026-10-13T00:00'))).toEqual({ k: 'past' });
  });
  it('on the trip’s own calendar, not Tokyo’s', () => {
    // 21:00 in Tokyo on Feb 10 is 01:00 Feb 11 in Auckland: day 1 already
    expect(phaseOf(nz, jst('2027-02-10T21:00'))).toEqual({ k: 'now', day: 1 });
    expect(phaseOf(nz, jst('2027-02-10T19:00'))).toEqual({ k: 'soon', days: 1 });
    // Seattle's last day, Jul 19 in Seattle, is Jul 20 in Tokyo till 16:00
    expect(phaseOf(seattle, jst('2026-07-20T15:00'))).toEqual({ k: 'now', day: 18 });
  });
  it('lists the trips on now and coming soonest first, the past newest first', () => {
    const at = jst('2026-11-04T12:00');
    const s = sortTrips([okinawa, seattle, nz], at);
    expect(s.coming.map((t) => t.id)).toEqual(['nz']);
    expect(s.past.map((t) => t.id)).toEqual(['okinawa', 'seattle']);
    const during = sortTrips([nz, seattle, okinawa], jst('2026-10-11T09:00'));
    expect(during.coming.map((t) => t.id)).toEqual(['okinawa', 'nz']);
  });
});

describe('the row that is now', () => {
  it('is the latest row begun, on the day open today', () => {
    // Oct 11, 09:00 in Okinawa: day 2, the dive boat's row (08:00 at the shop … the next row later)
    const at = jst('2026-10-11T09:00');
    expect(todayDay(okinawa, at)).toBe(2);
    const r = currentRow(okinawa, at)!;
    expect(r.day).toBe(2);
    const day2 = okinawa.days[1];
    const begun = day2.rows.filter((x) => rowMin(x.t) !== null && rowMin(x.t)! <= 9 * 60);
    expect(day2.rows[r.i]).toBe(begun.at(-1));
  });
  it('none before the first row or after the trip; the day by date before its first row', () => {
    expect(currentRow(okinawa, jst('2026-10-10T05:00'))).toBeNull();
    expect(todayDay(okinawa, jst('2026-10-10T05:00'))).toBe(1);
    expect(currentRow(okinawa, jst('2026-10-14T12:00'))).toBeNull();
    expect(todayDay(okinawa, jst('2026-10-14T12:00'))).toBeNull();
  });
  it('NZ: the flight out on the eve is day 1’s first row; the flight home after midnight is day 6’s last', () => {
    // Feb 10, 18:40 in Auckland (14:40 Tokyo): the NZ 98 row (dd −1), so day 1 opens on the eve
    const eve = nzdt('2027-02-10T18:40');
    expect(currentRow(nz, eve)).toEqual({ day: 1, i: 0 });
    expect(todayDay(nz, eve)).toBe(1);
    // Feb 16, 23:50: check-in is still the row; Feb 17, 00:20 (past midnight, a date after the trip): NZ 95 (dd 1)
    const d6 = nz.days[5];
    const last = d6.rows.length - 1;
    expect(d6.rows[last].dd).toBe(1);
    expect(currentRow(nz, nzdt('2027-02-16T23:50'))).toEqual({ day: 6, i: last - 1 });
    expect(currentRow(nz, nzdt('2027-02-17T00:20'))).toEqual({ day: 6, i: last });
    expect(todayDay(nz, nzdt('2027-02-17T00:20'))).toBe(6);
    // and once the plane is well gone, nothing
    expect(currentRow(nz, nzdt('2027-02-17T09:00'))).toBeNull();
  });
});
