// contract/tokyo.ts's calendar arithmetic: day numbers across months, years and a leap day; a month's weeks.
import { expect, test } from 'vitest';
import { dayNum, dateOfDayNum, monthWeeks, nextDay, prevDay, twoMonths } from './tokyo.ts';

test('dayNum and dateOfDayNum round-trip; next and previous days cross months, years and 29 February', () => {
  expect([dayNum('1970-01-01'), dayNum('2026-11-09')]).toEqual([0, 20766]);
  for (const d of ['1999-12-31', '2024-02-29', '2026-11-09']) expect(dateOfDayNum(dayNum(d))).toBe(d);
  expect([nextDay('2024-02-28'), nextDay('2024-02-29'), nextDay('2025-02-28'), nextDay('2026-12-31')]).toEqual(['2024-02-29', '2024-03-01', '2025-03-01', '2027-01-01']);
  expect([prevDay('2027-01-01'), prevDay('2024-03-01')]).toEqual(['2026-12-31', '2024-02-29']);
});

test('monthWeeks: a month’s whole weeks, Monday first, the lead and tail marked; twoMonths: this and next', () => {
  const nov = monthWeeks('2026-11');
  expect(nov.length).toBe(6); // 11/1 is a Sunday: 10/26–12/6
  expect([nov[0][0], nov[0][6], nov[5][6]]).toEqual([{ date: '2026-10-26', d: 26, inMonth: false }, { date: '2026-11-01', d: 1, inMonth: true }, { date: '2026-12-06', d: 6, inMonth: false }]);
  expect(monthWeeks('2027-02').length).toBe(4); // 2/1 a Monday, 2/28 a Sunday
  const leap = monthWeeks('2028-02'); // a leap February: 2/29 a Tuesday, 3/1–5 its tail
  expect([leap.length, leap[4][1], leap[4][2].inMonth]).toEqual([5, { date: '2028-02-29', d: 29, inMonth: true }, false]);
  expect(monthWeeks('2026-12').at(-1)![6].date).toBe('2027-01-03');
  expect([twoMonths('2026-11-14'), twoMonths('2026-12-31')]).toEqual([['2026-11', '2026-12'], ['2026-12', '2027-01']]);
});
