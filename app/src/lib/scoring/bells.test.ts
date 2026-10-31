// The stamp card: +1 ベル per daily goal met (🍐 Move, 🍑 Exercise, 🍒 Stand, 🍎 steps), all or nothing; ふたりでぜんぶ
// (+2 when both met all four the same day); and the numbers check of docs/design.md#economy.
import { describe, expect, it } from 'vitest';
import type { PersonId, RingFruit } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { RING_FRUITS, RULES, SHOP, shopPrice } from '#lib/config/rules.ts';
import { allMet, earnWeek, ringBells, togetherDays, type EarnDay, type WeekEarning } from './bells.ts';

const WK = '2026-11-02';

type Day = Partial<Omit<EarnDay, 'date'>>;
/** One person's week from per-day metrics (missing = no row); the Move goal defaults to 600. */
const week = (ds: (Day | null)[], person: PersonId = 'A', wk = WK): WeekEarning =>
  earnWeek({
    person,
    weekKey: wk,
    days: weekDays(wk).flatMap((date, i) => {
      const d = ds[i];
      return d ? [{ date, steps: null, exerciseMin: null, moveKcal: null, standMin: null, moveGoal: 600, ...d }] : [];
    })
  });

/** A day meeting exactly these goals (just at the goal), the others well under. */
const meets = (...fs: RingFruit[]): Day => ({
  moveKcal: fs.includes('pear') ? 600 : 300,
  exerciseMin: fs.includes('peach') ? 60 : 20,
  standMin: fs.includes('cherry') ? 120 : 60,
  steps: fs.includes('apple') ? 8000 : 3000
});
const ALL = meets(...RING_FRUITS);

/** The pair's ベル of a week: both people's goals + ふたりでぜんぶ. */
const pairWeek = (a: WeekEarning, b: WeekEarning): number =>
  [a, b].reduce((n, e) => n + e.days.reduce((m, d) => m + d.bells, 0), 0) + togetherDays(a, b).filter(Boolean).length * RULES.together;

describe('the rules', () => {
  it('are a stamp card: +1 a goal, +2 ふたりでぜんぶ, goals 60 min / 120 min / 8,000 steps', () => {
    expect(RULES).toEqual({ goals: { exerciseMin: 60, standMin: 120, steps: 8000 }, perGoal: 1, together: 2 });
  });
});

describe('earnWeek: one person', () => {
  it('+1 per goal met, all or nothing: at the goal counts, just under it does not', () => {
    const [at, under] = week([ALL, { moveKcal: 599, exerciseMin: 59.9, standMin: 119.9, steps: 7999 }]).days;
    expect(at.bells).toBe(4);
    expect(at.met).toEqual({ pear: true, peach: true, cherry: true, apple: true });
    expect(under.bells).toBe(0);
    expect(under.met).toEqual({ pear: false, peach: false, cherry: false, apple: false });
  });

  it('far above a goal still pays 1: a day pays at most 4', () => {
    const d = week([{ moveKcal: 2000, exerciseMin: 300, standMin: 900, steps: 40000 }]).days[0];
    expect(d.bells).toBe(4);
    expect(ringBells(d.met)).toEqual({ pear: 1, peach: 1, cherry: 1, apple: 1 });
  });

  it('each goal on its own', () => {
    for (const f of RING_FRUITS) {
      const d = week([meets(f)]).days[0];
      expect(d.bells, f).toBe(1);
      expect(RING_FRUITS.filter((g) => d.met[g]), f).toEqual([f]);
    }
  });

  it('🍐 is the person\'s Move goal in force that day', () => {
    const [a, b] = week([{ moveKcal: 450, moveGoal: 400 }, { moveKcal: 450, moveGoal: 500 }]).days;
    expect([a.met.pear, b.met.pear]).toEqual([true, false]);
    expect(week([{ moveKcal: 900, moveGoal: 0 }]).days[0].met.pear).toBe(false); // no goal: never met
  });

  it('a day with no row, a missing metric or a negative value meets nothing', () => {
    const w = week([null, { steps: 9000 }, { exerciseMin: -5, moveKcal: -1, standMin: -3, steps: -10 }]);
    expect(w.days.map((d) => d.bells)).toEqual([0, 1, 0, 0, 0, 0, 0]);
    expect(w.days[0]).toMatchObject({ steps: null, moveKcal: null, standMin: null, exerciseMin: 0 });
  });

  it('keeps the facts: exercise floored, the others as read; Mon..Sun; dates outside the week ignored', () => {
    const w = earnWeek({
      person: 'B', weekKey: WK,
      days: [
        { date: '2026-11-01', steps: 9000, exerciseMin: 70, moveKcal: 700, standMin: 200, moveGoal: 400 },
        { date: '2026-11-03', steps: 8100, exerciseMin: 61.7, moveKcal: 401, standMin: 121, moveGoal: 400 }
      ]
    });
    expect(w.days.map((d) => d.date)).toEqual(weekDays(WK));
    expect(w.days[0].bells).toBe(0);
    expect(w.days[1]).toMatchObject({ bells: 4, exerciseMin: 61, steps: 8100, moveKcal: 401, standMin: 121, moveGoal: 400 });
  });
});

describe('ふたりでぜんぶ', () => {
  it('only when both people meet all four goals that day', () => {
    const a = week([ALL, ALL, meets('pear', 'peach', 'cherry'), ALL]);
    const b = week([ALL, meets('pear', 'peach', 'cherry'), ALL, ALL], 'B');
    expect(togetherDays(a, b)).toEqual([true, false, false, true, false, false, false]);
    expect(allMet(a.days[0])).toBe(true);
    expect(allMet(a.days[2])).toBe(false);
  });
});

describe('the numbers check (docs/design.md#economy)', () => {
  it('a perfect week is 70 for the pair: 4 × 7 each + 2 × 7 together', () => {
    const days = Array(7).fill(ALL);
    expect(pairWeek(week(days), week(days, 'B'))).toBe(70);
  });

  it('a typical week (each goal on 5 of 7 days, both perfect on 3) is 46: 20 each + 3 × 2', () => {
    // Mon–Wed perfect for both; then each goal on 2 more days, never all four on one day.
    const days = [ALL, ALL, ALL, meets('pear', 'peach'), meets('cherry', 'apple'), meets('pear', 'peach'), meets('cherry', 'apple')];
    const a = week(days), b = week(days, 'B');
    for (const f of RING_FRUITS) expect(a.days.filter((d) => d.met[f]).length).toBe(5);
    expect(togetherDays(a, b).filter(Boolean)).toHaveLength(3);
    expect(pairWeek(a, b)).toBe(46);
  });

  it('a lazy week (two easy goals a day, never all four) is 28', () => {
    const days = Array(7).fill(meets('pear', 'cherry'));
    expect(pairWeek(week(days), week(days, 'B'))).toBe(28);
  });

  it('the two rewards against it: おやつ 6, 外食 20; a typical week pays two おやつ and a 外食 with 14 to spare', () => {
    expect(SHOP).toEqual([{ id: 'snack', bells: 6 }, { id: 'dinner', bells: 20 }]);
    expect(46 - 2 * shopPrice('snack')! - shopPrice('dinner')!).toBe(14);
  });
});
