import { describe, expect, it } from 'vitest';
import { phaseOf, rowMin, rowNow, sortTrips, todayDay } from './when.ts';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { nz } from '#lib/travel/trips/nz.ts';
import { seattle } from '#lib/travel/trips/seattle.ts';

/** A Tokyo wall time as an instant (what ?date= means). */
const jst = (s: string) => Date.parse(`${s}:00+09:00`);
/** An Auckland wall time in February (NZDT, UTC+13). */
const nzdt = (s: string) => Date.parse(`${s}:00+13:00`);

describe('row times', () => {
  it('reads them as written', () => {
    expect([rowMin('06:10'), rowMin('~12:00'), rowMin('<21:00'), rowMin('9:36'), rowMin(''), rowMin(undefined)]).toEqual([370, 720, 1260, 576, null, null]);
  });
});

describe('where a trip stands', () => {
  it('counts down, then the day of the trip, then past', () => {
    expect(phaseOf(okinawa, jst('2026-10-01T12:00'))).toEqual({ k: 'soon', days: 9 });
    expect(phaseOf(okinawa, jst('2026-10-09T23:59'))).toEqual({ k: 'soon', days: 1 });
    expect(phaseOf(okinawa, jst('2026-10-10T00:00'))).toEqual({ k: 'now', day: 1 });
    expect(phaseOf(okinawa, jst('2026-10-12T23:00'))).toEqual({ k: 'now', day: 3 });
    // the flight home landed at 22:50: still on a while past midnight, then gone by
    expect(phaseOf(okinawa, jst('2026-10-13T00:00'))).toEqual({ k: 'now', day: 3 });
    expect(phaseOf(okinawa, jst('2026-10-13T05:00'))).toEqual({ k: 'past' });
  });
  it('on the trip’s own calendar, not Tokyo’s', () => {
    // 21:00 in Tokyo on Feb 10 is 01:00 Feb 11 in Auckland: day 1 already
    expect(phaseOf(nz, jst('2027-02-10T21:00'))).toEqual({ k: 'now', day: 1 });
    expect(phaseOf(nz, jst('2027-02-10T18:00'))).toEqual({ k: 'soon', days: 1 });
    // Seattle's last day, Jul 19 in Seattle, is Jul 20 in Tokyo till 16:00
    expect(phaseOf(seattle, jst('2026-07-20T15:00'))).toEqual({ k: 'now', day: 18 });
  });
  it('on while a row outside the calendar is: the eve’s flight out, the flight home past midnight', () => {
    // NZ 98 leaves Narita at 18:30 Tokyo time on Feb 10 (22:30 in Auckland, the trip's day still a day off)
    expect(phaseOf(nz, jst('2027-02-10T18:40'))).toEqual({ k: 'now', day: 1 });
    expect(phaseOf(nz, nzdt('2027-02-17T00:20'))).toEqual({ k: 'now', day: 6 });
    expect(phaseOf(nz, nzdt('2027-02-17T09:00'))).toEqual({ k: 'past' });
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
    const r = rowNow(okinawa, at)!;
    expect(r.day).toBe(2);
    expect(r.next).toBe(false);
    const day2 = okinawa.days[1];
    const begun = day2.rows.filter((x) => rowMin(x.t) !== null && rowMin(x.t)! <= 9 * 60);
    expect(day2.rows[r.i]).toBe(begun.at(-1));
  });
  it('before a day’s first row, that row comes next; none after the trip', () => {
    expect(rowNow(okinawa, jst('2026-10-10T05:00'))).toEqual({ day: 1, i: 0, next: true });
    expect(todayDay(okinawa, jst('2026-10-10T05:00'))).toBe(1);
    expect(rowNow(okinawa, jst('2026-10-14T12:00'))).toBeNull();
    expect(todayDay(okinawa, jst('2026-10-14T12:00'))).toBeNull();
  });
  it('a day’s last row is now till its midnight, then the next day’s first comes next', () => {
    expect(rowNow(okinawa, jst('2026-10-10T23:30'))).toEqual({ day: 1, i: okinawa.days[0].rows.length - 1, next: false });
    expect(rowNow(okinawa, jst('2026-10-11T00:30'))).toEqual({ day: 2, i: 0, next: true });
    // NZ's day 4 leaves New Plymouth at 03:10: past midnight it opens on that
    expect(rowNow(nz, nzdt('2027-02-14T00:30'))).toEqual({ day: 4, i: 0, next: true });
    expect(todayDay(nz, nzdt('2027-02-14T00:30'))).toBe(4);
    // a free day (Seattle's day 3): nothing marked, the day still today's
    expect(rowNow(seattle, Date.parse('2026-07-04T19:00:00Z'))).toBeNull();
    expect(todayDay(seattle, Date.parse('2026-07-04T19:00:00Z'))).toBe(3);
  });
  it('NZ: the flight out on the eve (Tokyo’s 18:30) is day 1’s first row; the flight home after midnight day 6’s last', () => {
    // Feb 10, 18:40 in Tokyo (22:40 in Auckland): the NZ 98 row (dd −1, on Tokyo's clock), so day 1 opens on the eve
    const eve = jst('2027-02-10T18:40');
    expect(rowNow(nz, eve)).toEqual({ day: 1, i: 0, next: false });
    expect(todayDay(nz, eve)).toBe(1);
    // 18:40 in Auckland is only 14:40 in Tokyo: not boarded yet
    expect(rowNow(nz, nzdt('2027-02-10T18:40'))).toBeNull();
    // Feb 16, 23:50: check-in is still the row; Feb 17, 00:20 (past midnight, a date after the trip): NZ 95 (dd 1)
    const d6 = nz.days[5];
    const last = d6.rows.length - 1;
    expect(d6.rows[last].dd).toBe(1);
    expect(rowNow(nz, nzdt('2027-02-16T23:50'))).toEqual({ day: 6, i: last - 1, next: false });
    expect(rowNow(nz, nzdt('2027-02-17T00:20'))).toEqual({ day: 6, i: last, next: false });
    expect(todayDay(nz, nzdt('2027-02-17T00:20'))).toBe(6);
    // and once the plane is well gone, nothing
    expect(rowNow(nz, nzdt('2027-02-17T09:00'))).toBeNull();
  });
});
