import { describe, expect, it } from 'vitest';
import { weekCard } from './week.ts';

const MIN = 60_000;
// 2026-11-04 is a Wednesday: the week is 11/2 (Mon) – 11/8 (Sun)
const base = { today: '2026-11-04', me: 'A' as const, goal: 3 };

describe('the week card', () => {
  it('stamps a day by one finished session (≥ 4 answers), this week only', () => {
    const w = weekCard({ ...base, others: [], mine: [
      { d: '2026-11-01', n: 8, ms: 5 * MIN }, // last Sunday: another card
      { d: '2026-11-02', n: 8, ms: 4 * MIN },
      { d: '2026-11-03', n: 3, ms: 1 * MIN }, // left after 3: no stamp
      { d: '2026-11-04', n: 6, ms: 2 * MIN },
      { d: '2026-11-04', n: 8, ms: 2 * MIN }
    ] });
    expect(w.days).toEqual([true, false, true, false, false, false, false]);
    expect(w).toMatchObject({ at: 2, count: 2, goal: 3, met: false });
  });
  it('meets the target; a new week starts empty, nothing said of the last', () => {
    const mine = ['2026-11-02', '2026-11-03', '2026-11-04'].map((d) => ({ d, n: 8, ms: MIN }));
    expect(weekCard({ ...base, others: [], mine }).met).toBe(true);
    expect(weekCard({ ...base, goal: 5, others: [], mine }).met).toBe(false);
    const next = weekCard({ ...base, today: '2026-11-09', others: [], mine });
    expect(next).toMatchObject({ count: 0, at: 0, met: false });
  });
  it('the couple quest sums both members’ minutes (never the guest’s), never split by who', () => {
    const w = weekCard({ ...base, mine: [{ d: '2026-11-03', n: 8, ms: 20 * MIN }], others: [
      { who: 'B', d: '2026-11-04', ms: 25 * MIN }, { who: 'G', d: '2026-11-04', ms: 30 * MIN }, { who: 'B', d: '2026-10-30', ms: 30 * MIN }
    ] });
    expect(w.quest).toEqual({ minutes: 45, of: 60, met: false, solo: false });
  });
  it('the guest has its own solo quest of 30 minutes', () => {
    const w = weekCard({ ...base, me: 'G', mine: [{ d: '2026-11-03', n: 8, ms: 31 * MIN }], others: [{ who: 'A', d: '2026-11-03', ms: 40 * MIN }] });
    expect(w.quest).toEqual({ minutes: 31, of: 30, met: true, solo: true });
  });
});
