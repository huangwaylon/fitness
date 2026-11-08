// contract/tokyo.ts's calendar arithmetic: day numbers across months, years and a leap day.
import { expect, test } from 'vitest';
import { dayNum, dayOf, nextDay, prevDay } from './tokyo.ts';

test('dayNum and dayOf round-trip; next and previous days cross months, years and 29 February', () => {
  expect([dayNum('1970-01-01'), dayNum('2026-11-09')]).toEqual([0, 20766]);
  for (const d of ['1999-12-31', '2024-02-29', '2026-11-09']) expect(dayOf(dayNum(d))).toBe(d);
  expect([nextDay('2024-02-28'), nextDay('2024-02-29'), nextDay('2025-02-28'), nextDay('2026-12-31')]).toEqual(['2024-02-29', '2024-03-01', '2025-03-01', '2027-01-01']);
  expect([prevDay('2027-01-01'), prevDay('2024-03-01')]).toEqual(['2026-12-31', '2024-02-29']);
});
