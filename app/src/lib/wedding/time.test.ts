// Ported from the old board's test/time.test.js (~/Documents/other/wedding): the zone and today. A day is the
// contract's isLocalDate (contract.test's), so the old Sheet's tolerance ('2027-04-18T00:00', junk) has no case here.
//
// The zone is used for exactly ONE thing — deciding what today's date is — so that is what this file leans on: a board
// in Tokyo and a device in Los Angeles must disagree about "today" by a day for several hours, and everything
// downstream compares day strings.
import { describe, expect, it } from 'vitest';
import { daysBetween } from '#lib/time/dates.ts';
import { isValidTimeZone, monthOf, resolveTimeZone, todayIn, untilMidnight } from './time.ts';

const TOKYO = 'Asia/Tokyo';
const LA = 'America/Los_Angeles';

describe('zones', () => {
  it('validates IANA names', () => {
    expect(isValidTimeZone(TOKYO)).toBe(true);
    expect(isValidTimeZone(LA)).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('falls back rather than throwing', () => {
    expect(resolveTimeZone('Mars/Olympus')).toBe(TOKYO);
    expect(resolveTimeZone('')).toBe(TOKYO);
    expect(resolveTimeZone(LA)).toBe(LA);
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

describe('the month key', () => {
  it('is a day’s YYYY-MM, empty for none (it groups with the undated rows)', () => {
    expect(monthOf('2027-04-18')).toBe('2027-04');
    expect(monthOf('')).toBe('');
  });
});
