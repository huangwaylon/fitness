// A zone's wall clock (time/zone.ts). The wedding board's part ported from the old board's test/time.test.js
// (~/Documents/other/wedding): the zone and today. A day is the
// contract's isLocalDate (contract.test's), so the old Sheet's tolerance ('2027-04-18T00:00', junk) has no case here.
//
// The zone is used for exactly ONE thing — deciding what today's date is — so that is what this file leans on: a board
// in Tokyo and a device in Los Angeles must disagree about "today" by a day for several hours, and everything
// downstream compares day strings.
import { describe, expect, it } from 'vitest';
import { daysBetween } from '#lib/time/dates.ts';
import { instantIn, resolveTimeZone, todayIn, untilMidnight, wallIn } from './zone.ts';

const TOKYO = 'Asia/Tokyo';
const LA = 'America/Los_Angeles';
/** A Tokyo wall time as an instant (what ?date= means). */
const jst = (s: string) => Date.parse(`${s}:00+09:00`);
/** An Auckland wall time in February (NZDT, UTC+13). */
const nzdt = (s: string) => Date.parse(`${s}:00+13:00`);

describe('a trip’s clock', () => {
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
  it('across DST: a skipped wall time an hour on, a repeated one its first (summer) reading', () => {
    // Auckland falls back on Apr 4 2027, 03:00 NZDT → 02:00 NZST (Apr 3, 14:00 UTC): 02:30 comes twice
    expect(instantIn('Pacific/Auckland', '2027-04-04', 90)).toBe(Date.parse('2027-04-03T12:30:00Z'));
    expect(instantIn('Pacific/Auckland', '2027-04-04', 150)).toBe(Date.parse('2027-04-03T13:30:00Z'));
    expect(instantIn('Pacific/Auckland', '2027-04-04', 210)).toBe(Date.parse('2027-04-03T15:30:00Z'));
    // the same from the day before, past its midnight
    expect(instantIn('Pacific/Auckland', '2027-04-03', 1440 + 150)).toBe(Date.parse('2027-04-03T13:30:00Z'));
    // and springs forward on Sep 26 2027, 02:00 NZST → 03:00 NZDT: 02:30 is skipped, read as 03:30
    expect(instantIn('Pacific/Auckland', '2027-09-26', 150)).toBe(Date.parse('2027-09-25T14:30:00Z'));
    // Los Angeles springs forward on Mar 14 2027 at 02:00 PST (10:00 UTC)
    expect(instantIn('America/Los_Angeles', '2027-03-14', 90)).toBe(Date.parse('2027-03-14T09:30:00Z'));
    expect(instantIn('America/Los_Angeles', '2027-03-14', 150)).toBe(Date.parse('2027-03-14T10:30:00Z'));
    expect(instantIn('America/Los_Angeles', '2027-03-14', 210)).toBe(Date.parse('2027-03-14T10:30:00Z'));
    // and falls back on Nov 7 2027: 01:30 twice, the first on PDT
    expect(instantIn('America/Los_Angeles', '2027-11-07', 90)).toBe(Date.parse('2027-11-07T08:30:00Z'));
    for (const [tz, date, min] of [['Pacific/Auckland', '2027-04-04', 210], ['America/Los_Angeles', '2027-03-14', 210]] as const)
      expect(wallIn(tz, instantIn(tz, date, min))).toEqual({ date, min });
  });
});

describe('zones', () => {
  it('takes an IANA name, else falls back rather than throwing', () => {
    expect(resolveTimeZone(LA)).toBe(LA);
    expect(resolveTimeZone(TOKYO)).toBe(TOKYO);
    expect(resolveTimeZone('Mars/Olympus')).toBe(TOKYO);
    expect(resolveTimeZone('')).toBe(TOKYO);
    expect(resolveTimeZone(undefined)).toBe(TOKYO);
  });
});

describe('todayIn', () => {
  it('answers in the BOARD zone, not the device one', () => {
    // 2027-04-18 15:00 UTC is the 19th in Tokyo and still the 18th in Los Angeles: read in the wrong zone, a task due
    // on the 18th stops being due somewhere between nine and sixteen hours early or late.
    const at = Date.UTC(2027, 3, 18, 15, 0);
    expect(todayIn(TOKYO, at)).toBe('2027-04-19');
    expect(todayIn(LA, at)).toBe('2027-04-18');
  });

  it('returns the stored shape, zero-padded; a nonsense zone falls back', () => {
    expect(todayIn(TOKYO, Date.UTC(2027, 0, 5, 3, 0))).toBe('2027-01-05');
    expect(todayIn('Mars/Olympus', Date.UTC(2027, 3, 18, 0, 0))).toBe(todayIn(TOKYO, Date.UTC(2027, 3, 18, 0, 0)));
  });
});

describe('untilMidnight', () => {
  it('is the time to the zone’s next midnight, at most an hour', () => {
    // 23:59:30 in Tokyo
    expect(untilMidnight(TOKYO, Date.UTC(2027, 3, 18, 14, 59, 30))).toBe(30_000);
    expect(untilMidnight(TOKYO, Date.UTC(2027, 3, 18, 15, 0, 0))).toBe(3_600_000);
    // 23:00 in Los Angeles is 07:00 UTC; Tokyo is at 16:00 then
    expect(untilMidnight(LA, Date.UTC(2027, 3, 19, 6, 30))).toBe(1_800_000);
    expect(todayIn(LA, Date.UTC(2027, 3, 19, 6, 30) + 1_800_000)).toBe('2027-04-19');
  });
});

describe('the countdown', () => {
  // The board's countdown is `daysBetween(today, wedding)`, `today` in the BOARD's zone, so it flips at midnight at the
  // venue (time/dates.ts' calendar arithmetic: its own tests cross DST, months and leap days).
  const wedding = '2027-04-18';
  const countdown = (nowMs: number) => daysBetween(todayIn(TOKYO, nowMs), wedding);

  it('counts calendar days in the board zone', () => {
    expect(countdown(Date.UTC(2027, 3, 11, 14, 0))).toBe(7);
    expect(countdown(Date.UTC(2027, 3, 20, 0, 0))).toBe(-2);
  });

  it('flips at midnight, not at the hour the page loaded', () => {
    expect(countdown(Date.UTC(2027, 3, 17, 14, 59))).toBe(1);
    expect(countdown(Date.UTC(2027, 3, 17, 15, 1))).toBe(0);
  });
});
