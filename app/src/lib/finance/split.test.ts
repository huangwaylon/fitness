// The split's defaults and the viewer's side (finance/split.ts) and the months on Tokyo's calendar (finance/dates.ts),
// ported from the shared-expense app's split and dates tests.
import { describe, expect, it } from 'vitest';
import { FIN_BP } from '#lib/contract/finance.ts';
import { defaultSplitFor, percentOf, shareFor } from './split.ts';
import { dayInMonth, monthAt, monthNumber, shiftMonth } from './dates.ts';

describe('defaultSplitFor', () => {
  const config = { split: { A: 8000, B: 2000 } };

  it('reads only the payer’s own value, never mirroring one from the other', () => {
    expect(defaultSplitFor(config, 'A')).toBe(8000);
    expect(defaultSplitFor(config, 'B')).toBe(2000);
    const lopsided = { split: { A: 8000, B: 8000 } };
    expect([defaultSplitFor(lopsided, 'A'), defaultSplitFor(lopsided, 'B')]).toEqual([8000, 8000]);
  });

  it('falls back per person to the even split, whatever the config carries', () => {
    expect(defaultSplitFor({ split: { A: 8000 } as never }, 'B')).toBe(5000);
    for (const v of [NaN, Infinity, undefined, null, 'half', {}, 0.8, -1, 10001]) expect(defaultSplitFor({ split: { A: v, B: 0 } as never }, 'A'), String(v)).toBe(5000);
    expect(defaultSplitFor(undefined, 'A')).toBe(5000);
    expect(defaultSplitFor({ split: { A: 0, B: FIN_BP } }, 'A')).toBe(0);
  });
});

describe('the viewer’s side', () => {
  it('is the payer’s own share for the payer, the rest for the other', () => {
    const e = { payer: 'A' as const, ps: 8000 };
    expect([shareFor(e, 'A'), shareFor(e, 'B')]).toEqual([8000, 2000]);
    expect([shareFor({ payer: 'B', ps: FIN_BP }, 'B'), shareFor({ payer: 'B', ps: FIN_BP }, 'A')]).toEqual([FIN_BP, 0]);
  });

  it('rounds to a whole percent for display, half up', () => {
    expect([0, 5000, 3340, 3350, 8000, FIN_BP, 3333, 6667].map(percentOf)).toEqual([0, 50, 33, 34, 80, 100, 33, 67]);
  });
});

describe('months', () => {
  it('reads Tokyo’s month of an instant, not the device’s', () => {
    // 2026-08-31 23:30 in Tokyo is still August there, September past UTC midnight… and the reverse at 00:30
    expect(monthAt(Date.parse('2026-08-31T14:30:00Z'))).toBe('2026-08');
    expect(monthAt(Date.parse('2026-08-31T15:30:00Z'))).toBe('2026-09');
  });

  it('shifts across years both ways, and never out of a short month', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-01', -13)).toBe('2024-12');
    expect(shiftMonth('2026-01', 25)).toBe('2028-02');
    expect(shiftMonth('2026-03', -1)).toBe('2026-02');
    expect(shiftMonth('2026-05', 0)).toBe('2026-05');
    for (const bad of ['', '2026-13', '2026-1', '2026-08-01', 'x']) expect(shiftMonth(bad, 1), bad).toBe('');
  });

  it('answers a month’s number, null for anything not a month', () => {
    expect([monthNumber('2026-01'), monthNumber('2026-12')]).toEqual([1, 12]);
    for (const bad of ['2026-00', '2026-13', '2026-08-01', '', null, undefined, 202608]) expect(monthNumber(bad), String(bad)).toBeNull();
  });

  it('clamps a day to the month’s last, February and leap years included', () => {
    expect(dayInMonth('2026-08', 5)).toBe('2026-08-05');
    expect(dayInMonth('2026-08', 31)).toBe('2026-08-31');
    expect(dayInMonth('2026-02', 31)).toBe('2026-02-28');
    expect(dayInMonth('2028-02', 31)).toBe('2028-02-29');
    expect(dayInMonth('2100-02', 29)).toBe('2100-02-28');
    expect(dayInMonth('2000-02', 30)).toBe('2000-02-29');
    expect(dayInMonth('2026-04', 31)).toBe('2026-04-30');
    expect([dayInMonth('2026-08', 0), dayInMonth('2026-08', 1.5), dayInMonth('2026-08', NaN)]).toEqual(['2026-08-01', '2026-08-01', '2026-08-01']);
    for (const bad of ['', '2026-13', '2026-08-01']) expect(dayInMonth(bad, 5)).toBe('');
  });
});
