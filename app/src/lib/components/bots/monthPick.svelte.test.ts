// monthPick: the picked month while it is shown, else this month (a day rolling over at midnight).
import { expect, it } from 'vitest';
import { twoMonths } from '#lib/contract/tokyo.ts';
import { monthPick } from './monthPick.svelte.ts';

it('keeps the picked month while it is one of the two; on 12/1 a picked 11月 falls back to the first (12月)', () => {
  let today = '2026-11-30';
  const cal = monthPick(() => twoMonths(today));
  expect(cal.value).toBe('2026-11');
  cal.value = '2026-12';
  expect(cal.value).toBe('2026-12');
  today = '2026-12-01';
  expect([cal.months, cal.value]).toEqual([['2026-12', '2027-01'], '2026-12']);
  today = '2026-11-30';
  cal.value = '2026-11';
  today = '2026-12-01';
  expect(cal.value).toBe('2026-12');
});
