// The daily checks' reward when raised (RULES.checks is 0 today: the user, 2026-11-19): +RULES.checks once per person
// and day with all three done, into that day's ベル and the wallet like a goal; idempotent per day, and a locked week
// keeps what it had at its lock. Here RULES.checks is mocked to 3.
import { describe, expect, it, vi } from 'vitest';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';

vi.mock('#lib/config/rules.ts', async (orig) => {
  const m = await orig<typeof import('#lib/config/rules.ts')>();
  return { ...m, RULES: { ...m.RULES, checks: 3 } };
});
const { reduce } = await import('./state.ts');
const { weekBells } = await import('./bells.ts');

const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
let n = 0;
const check = (at: string, d: string, k: string, v: boolean | null): EventRow => [at, 'A', `c${++n}`, 'check', JSON.stringify({ d, k, v })];
const metric = (at: string, date: string, m: MetricRow[3], v: number): MetricRow => [at, 'A', date, m, v];
const WK = '2026-11-16', DAY = '2026-11-19';

describe('the daily checks’ reward, raised', () => {
  it('pays once a day with all three done, however many taps; nothing with two', () => {
    const w3 = [metric(jst(DAY, '08:00'), DAY, 'hiit_n', 1), metric(jst(DAY, '08:00'), DAY, 'core_n', 1)];
    const taps = [check(jst(DAY, '09:00'), DAY, 'face', true), check(jst(DAY, '09:01'), DAY, 'face', null), check(jst(DAY, '09:02'), DAY, 'face', true)];
    const now = Date.parse(jst(DAY, '22:00'));
    const w = weekBells(reduce({ metrics: w3, events: taps }), WK, now);
    expect(w.A.days.map((d) => d.bells)).toEqual([0, 0, 0, 3, 0, 0, 0]);
    expect(weekBells(reduce({ metrics: w3, events: taps.slice(0, 2) }), WK, now).A.days.map((d) => d.bells)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('a locked week reads its checks as of the lock: a tap after it never pays', () => {
    const w3 = [metric(jst(DAY, '08:00'), DAY, 'hiit_n', 1), metric(jst(DAY, '08:00'), DAY, 'core_n', 1)];
    const late = check(jst('2026-11-26', '05:00'), DAY, 'face', true); // after Wednesday 04:00
    const w = weekBells(reduce({ metrics: w3, events: [late] }), WK, Date.parse(jst('2026-11-27', '12:00')));
    expect(w.A.days[3].bells).toBe(0);
  });
});
