import { describe, expect, it } from 'vitest';
import { addDays, inMonthDayRange, minutesBetween, nowInZone, parseInstant, toLocalDate, weekDays, weekKeyOf } from '#lib/scoring/dates.ts';

describe('toLocalDate', () => {
  it('flips to the next Tokyo day at 15:00 UTC', () => {
    expect(toLocalDate('2026-11-01T14:59:59Z')).toBe('2026-11-01');
    expect(toLocalDate('2026-11-01T15:00:00Z')).toBe('2026-11-02');
    expect(toLocalDate('2026-11-01T15:30:00.000Z')).toBe('2026-11-02');
  });
  it('accepts timestamps with compact offsets', () => {
    expect(toLocalDate('2026-11-02 07:15:00 +0900')).toBe('2026-11-02');
    expect(toLocalDate('2026-11-02 00:30:00 +0000')).toBe('2026-11-02');
    expect(toLocalDate('2026-11-01 23:30:00 -0800')).toBe('2026-11-02');
    expect(toLocalDate('2026-11-01 14:59:00 +0000')).toBe('2026-11-01');
  });
  it('accepts ISO with offsets and treats offset-less times as Tokyo wall clock', () => {
    expect(toLocalDate('2026-11-02T00:10:00+09:00')).toBe('2026-11-02');
    expect(toLocalDate('2026-11-01T23:59:00+09:00')).toBe('2026-11-01');
    expect(toLocalDate('2026-11-02T00:10:00')).toBe('2026-11-02');
  });
  it('handles year boundaries', () => {
    expect(toLocalDate('2026-12-31T15:00:00Z')).toBe('2027-01-01');
  });
  it('rejects garbage', () => {
    expect(() => parseInstant('not a date')).toThrow();
  });
});

describe('week helpers', () => {
  it('weekKeyOf returns Monday', () => {
    expect(weekKeyOf('2026-11-02')).toBe('2026-11-02'); // Monday
    expect(weekKeyOf('2026-11-08')).toBe('2026-11-02'); // Sunday
    expect(weekKeyOf('2026-11-09')).toBe('2026-11-09'); // next Monday
    expect(weekKeyOf('2027-01-01')).toBe('2026-12-28'); // week of Jan 1 starts in December
  });
  it('weekDays lists Mon..Sun across a year boundary', () => {
    expect(weekDays('2026-12-28')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  });
  it('addDays handles months and leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
  it('nowInZone reports Tokyo wall clock', () => {
    expect(nowInZone(new Date('2026-11-08T10:30:00Z'))).toEqual({ date: '2026-11-08', weekday: 0, hour: 19, minute: 30 });
    expect(nowInZone(new Date('2026-11-10T19:00:00Z'))).toEqual({ date: '2026-11-11', weekday: 3, hour: 4, minute: 0 });
  });
  it('inMonthDayRange wraps the year', () => {
    expect(inMonthDayRange('2026-12-29', '12-29', '01-03')).toBe(true);
    expect(inMonthDayRange('2027-01-03', '12-29', '01-03')).toBe(true);
    expect(inMonthDayRange('2027-01-04', '12-29', '01-03')).toBe(false);
    expect(inMonthDayRange('2026-12-28', '12-29', '01-03')).toBe(false);
    expect(inMonthDayRange('2027-06-01', '06-01', '07-20')).toBe(true);
    expect(inMonthDayRange('2027-07-21', '06-01', '07-20')).toBe(false);
  });
  it('minutesBetween across formats', () => {
    expect(minutesBetween('2026-11-02 07:00:00 +0900', '2026-11-01T22:45:00Z')).toBe(45);
  });
});
