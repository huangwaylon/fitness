// やること's due dates and reminders (contract/todoDue.ts): the due's format and calendar, each reminder's Tokyo fire
// time (`eve` across a month and a year end), and the day a due falls on around Tokyo's midnight.
import { describe, expect, it } from 'vitest';
import { dayOf, dueOf, fireAt, LATE_MS, REMS_DATE, REMS_TIMED, remFits } from './todoDue.ts';
import { localDateAt } from './tokyo.ts';

const tokyo = (s: string) => Date.parse(`${s}+09:00`);

describe('dueOf', () => {
  it('reads a date or a date and time; refuses anything else', () => {
    expect(dueOf('2026-11-24')).toEqual({ date: '2026-11-24', time: null });
    expect(dueOf('2026-11-24T00:00')).toEqual({ date: '2026-11-24', time: '00:00' });
    expect(dueOf('2099-12-31T23:59')).toEqual({ date: '2099-12-31', time: '23:59' });
    expect(dueOf('2028-02-29')).not.toBeNull();
    for (const s of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-11-00', '2023-12-31', '2100-01-01', '2026-11-24T24:00', '2026-11-24T23:60', '2026-11-24T', '2026-11-24Z', ' 2026-11-24', null, 5])
      expect(dueOf(s), String(s)).toBeNull();
  });

  it('a reminder fits its due’s kind', () => {
    expect(REMS_TIMED.every((r) => remFits({ time: '09:00' }, r))).toBe(true);
    expect(REMS_DATE.every((r) => remFits({ time: null }, r))).toBe(true);
    expect(remFits({ time: null }, 'at')).toBe(false);
    expect(remFits({ time: '09:00' }, 'am')).toBe(false);
    expect(LATE_MS).toBe(600_000);
  });
});

describe('fireAt', () => {
  it('each reminder at its Tokyo minute', () => {
    expect(fireAt('2026-11-24T15:00', 'at')).toBe(tokyo('2026-11-24T15:00'));
    expect(fireAt('2026-11-24T15:00', 'b10')).toBe(tokyo('2026-11-24T14:50'));
    expect(fireAt('2026-11-24T00:30', 'b60')).toBe(tokyo('2026-11-23T23:30'));
    expect(fireAt('2026-11-24T15:00', 'eve')).toBe(tokyo('2026-11-23T20:00'));
    expect(fireAt('2026-11-24', 'am')).toBe(tokyo('2026-11-24T08:00'));
    expect(fireAt('2026-11-24', 'eve')).toBe(tokyo('2026-11-23T20:00'));
  });

  it('`eve` across a month and a year end; null for a mismatch or a bad due', () => {
    expect(fireAt('2026-12-01', 'eve')).toBe(tokyo('2026-11-30T20:00'));
    expect(fireAt('2028-03-01T07:00', 'eve')).toBe(tokyo('2028-02-29T20:00'));
    expect(fireAt('2027-01-01', 'eve')).toBe(tokyo('2026-12-31T20:00'));
    expect(fireAt('2026-11-24', 'at')).toBeNull();
    expect(fireAt('2026-11-24T15:00', 'am')).toBeNull();
    expect(fireAt('2026-02-30', 'am')).toBeNull();
  });
});

describe('dayOf', () => {
  it('past, today, tomorrow, later from Tokyo’s day, at 23:59 and 00:00', () => {
    const before = localDateAt(tokyo('2026-11-24T23:59'));
    const after = localDateAt(tokyo('2026-11-25T00:00'));
    expect(before).toBe('2026-11-24');
    expect(dayOf('2026-11-24T23:00', before)).toBe('today');
    expect(dayOf('2026-11-25', before)).toBe('tomorrow');
    expect(dayOf('2026-11-24T23:00', after)).toBe('past');
    expect(dayOf('2026-11-25T00:00', after)).toBe('today');
    expect(dayOf('2026-11-26', after)).toBe('tomorrow');
    expect(dayOf('2026-11-27', after)).toBe('later');
    expect(dayOf('2026-12-01', '2026-11-30')).toBe('tomorrow');
    expect(dayOf('2026-11-31', after)).toBeNull();
  });
});
