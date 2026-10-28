import { describe, expect, it } from 'vitest';
import type { WeekScore } from '#lib/types.ts';
import { nextRung, payoutWeek } from '#lib/scoring/payout.ts';

const ws = (person: 'A' | 'B', score: number): WeekScore => ({
  person, weekKey: '2026-11-02', score, restDays: 1, strengthDays: [], dataDays: 7,
  categories: {} as WeekScore['categories']
});
const jarTotal = (a: number, b: number) => {
  const p = payoutWeek(ws('A', a), ws('B', b));
  return p.A.fruitYen + p.B.fruitYen + p.teamYen;
};

describe('payoutWeek (PROPOSAL §3.3)', () => {
  it('matches the worked table', () => {
    expect(jarTotal(100, 100)).toBe(12000);
    expect(jarTotal(85, 85)).toBe(10200);
    expect(jarTotal(75, 75)).toBe(9000);
    expect(jarTotal(60, 60)).toBe(7200);
  });
  it('splits fruit, team and purse', () => {
    const p = payoutWeek(ws('A', 85), ws('B', 59));
    expect(p).toEqual({
      weekKey: '2026-11-02',
      A: { score: 85, fruitYen: 4250, purseYen: 1000 },
      B: { score: 59, fruitYen: 2950, purseYen: 0 },
      teamYen: 1180
    });
  });
  it('purse threshold is inclusive at 60; zero pays zero', () => {
    const p = payoutWeek(ws('A', 60), ws('B', 0));
    expect(p.A.purseYen).toBe(1000);
    expect(p.B).toEqual({ score: 0, fruitYen: 0, purseYen: 0 });
    expect(p.teamYen).toBe(0);
  });
});

describe('nextRung', () => {
  it('returns the first rung strictly above the total', () => {
    expect(nextRung(0)).toEqual({ key: 'onsen_day', yen: 30000, remainingYen: 30000 });
    expect(nextRung(29999)).toEqual({ key: 'onsen_day', yen: 30000, remainingYen: 1 });
    expect(nextRung(30000)).toEqual({ key: 'hakone', yen: 80000, remainingYen: 50000 });
    expect(nextRung(699999)?.key).toBe('europe');
  });
  it('is null past the top', () => {
    expect(nextRung(700000)).toBeNull();
    expect(nextRung(1e7)).toBeNull();
  });
});
