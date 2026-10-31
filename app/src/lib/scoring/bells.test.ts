// The stamp card: +1 ベル per daily goal met (🍐 Move, 🍑 Exercise, 🍒 Stand, 🍎 steps), all or nothing; がんばり (+1
// per goal at 1.5×, at most +2 a day); ふたりでぜんぶ (+2 when both met all four the same day); and the numbers check of
// docs/design.md#economy.
import { describe, expect, it } from 'vitest';
import type { PersonId, RingFruit } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { RING_FRUITS, RULES, SHOP, STRETCH, shopPrice, stretchOf } from '#lib/config/rules.ts';
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
/** A day meeting all four goals and reaching exactly these stretch targets (just at 1.5×). */
const stretches = (...fs: RingFruit[]): Day => ({
  moveKcal: fs.includes('pear') ? 900 : 600,
  exerciseMin: fs.includes('peach') ? 90 : 60,
  standMin: fs.includes('cherry') ? 180 : 120,
  steps: fs.includes('apple') ? 12000 : 8000
});

/** The pair's ベル of a week: both people's goals + ふたりでぜんぶ. */
const pairWeek = (a: WeekEarning, b: WeekEarning): number =>
  [a, b].reduce((n, e) => n + e.days.reduce((m, d) => m + d.bells, 0), 0) + togetherDays(a, b).filter(Boolean).length * RULES.together;

describe('the rules', () => {
  it('are a stamp card: +1 a goal, +2 ふたりでぜんぶ, goals 60 min / 120 min / 8,000 steps', () => {
    expect(RULES).toEqual({ goals: { exerciseMin: 60, standMin: 120, steps: 8000 }, perGoal: 1, together: 2 });
  });

  it('がんばり: +1 per goal at 1.5×, at most +2 a day: 90 min, 180 min, 12,000 steps, 900 / 600 kcal', () => {
    expect(STRETCH).toEqual({ multiplier: 1.5, perGoal: 1, cap: 2 });
    expect([RULES.goals.exerciseMin, RULES.goals.standMin, RULES.goals.steps, 600, 400].map(stretchOf)).toEqual([90, 180, 12000, 900, 600]);
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

  it('far above every goal pays 4 + がんばり 2: a day pays at most 6', () => {
    const d = week([{ moveKcal: 2000, exerciseMin: 300, standMin: 900, steps: 40000 }]).days[0];
    expect(d.bells).toBe(6);
    expect(d.stretch).toBe(2);
    expect(d.stretched).toEqual({ pear: true, peach: true, cherry: true, apple: true });
    expect(ringBells(d)).toEqual({ pear: 2, peach: 2, cherry: 1, apple: 1 });
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

describe('がんばり: the stretch bonus', () => {
  it('each stretch target at its edge: 900 / 90 / 180 / 12,000 count, 899 / 89.9 / 179.9 / 11,999 do not', () => {
    const edges: [RingFruit, Day, Day][] = [
      ['pear', { moveKcal: 900 }, { moveKcal: 899 }],
      ['peach', { exerciseMin: 90 }, { exerciseMin: 89.9 }],
      ['cherry', { standMin: 180 }, { standMin: 179.9 }],
      ['apple', { steps: 12000 }, { steps: 11999 }]
    ];
    for (const [f, at, under] of edges) {
      const [a, b] = week([{ ...ALL, ...at }, { ...ALL, ...under }]).days;
      expect([a.stretched[f], a.stretch, a.bells], f).toEqual([true, 1, 5]);
      expect(ringBells(a)[f], f).toBe(2);
      expect([b.stretched[f], b.stretch, b.bells], f).toEqual([false, 0, 4]);
      expect(ringBells(b)[f], f).toBe(1);
    }
  });

  it('89 exercise minutes do not stretch, 90 do (fractions count, as for the goal)', () => {
    const [a, b, c] = week([{ ...ALL, exerciseMin: 89 }, { ...ALL, exerciseMin: 90 }, { ...ALL, exerciseMin: 89.99 }]).days;
    expect([a.stretch, b.stretch, c.stretch]).toEqual([0, 1, 0]);
  });

  it('capped at +2: two stretched pay 2, three or four still pay 2 (reached, shown, not paid)', () => {
    const w = week([stretches('pear'), stretches('pear', 'apple'), stretches('peach', 'cherry', 'apple'), stretches(...RING_FRUITS)]);
    expect(w.days.slice(0, 4).map((d) => [d.stretch, d.bells])).toEqual([[1, 5], [2, 6], [2, 6], [2, 6]]);
    expect(RING_FRUITS.filter((f) => w.days[2].stretched[f])).toEqual(['peach', 'cherry', 'apple']);
    // the cap is paid to the first fruits in RING_FRUITS order, so the per-fruit ベル always add up to the day
    expect(ringBells(w.days[2])).toEqual({ pear: 1, peach: 2, cherry: 2, apple: 1 });
    for (const d of w.days) expect(Object.values(ringBells(d)).reduce((a, b) => a + b, 0)).toBe(d.bells);
  });

  it('a stretch needs its goal met: 1.5× of a goal is always met, and a day with no Move goal never stretches 🍐', () => {
    const d = week([{ ...ALL, moveKcal: 5000, moveGoal: 0 }]).days[0];
    expect([d.met.pear, d.stretched.pear, d.stretch]).toEqual([false, false, 0]);
  });

  it('🍐 at 1.5× the person\'s Move goal in force that day: 900 for 600, 600 for 400', () => {
    const [a, b, c, e] = week([
      { ...ALL, moveKcal: 899, moveGoal: 600 }, { ...ALL, moveKcal: 900, moveGoal: 600 },
      { ...ALL, moveKcal: 599, moveGoal: 400 }, { ...ALL, moveKcal: 600, moveGoal: 400 }
    ], 'B').days;
    expect([a, b, c, e].map((d) => d.stretched.pear)).toEqual([false, true, false, true]);
    // an odd goal: 1.5 × 333 = 499.5 kcal
    const [o1, o2] = week([{ ...ALL, moveKcal: 499, moveGoal: 333 }, { ...ALL, moveKcal: 500, moveGoal: 333 }]).days;
    expect([o1.stretched.pear, o2.stretched.pear]).toEqual([false, true]);
  });

  it('only the goals reached count: a stretched goal alone pays 2, without the others', () => {
    const d = week([{ steps: 12000 }]).days[0];
    expect([d.bells, d.stretch]).toEqual([2, 1]);
    expect(ringBells(d)).toEqual({ pear: 0, peach: 0, cherry: 0, apple: 2 });
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

  it('がんばり doesn\'t change it: +2 for all four met, whatever the stretch', () => {
    const a = week([stretches(...RING_FRUITS), stretches('pear', 'peach')]);
    const b = week([ALL, { ...stretches('pear', 'peach'), steps: 7999 }], 'B');
    expect(togetherDays(a, b).slice(0, 2)).toEqual([true, false]);
  });
});

describe('the numbers check (docs/design.md#economy)', () => {
  it('the most a week can pay the pair is 98: (4 + 2) × 7 each + 2 × 7 together (14 a day)', () => {
    const days = Array(7).fill(stretches(...RING_FRUITS));
    expect(pairWeek(week(days), week(days, 'B'))).toBe(98);
  });

  it('a perfect week without がんばり is 70 for the pair: 4 × 7 each + 2 × 7 together', () => {
    const days = Array(7).fill(ALL);
    expect(pairWeek(week(days), week(days, 'B'))).toBe(70);
  });

  it('a typical week (each goal on 5 of 7 days, both perfect on 3, one stretch on 3 days each) is 52: 23 each + 3 × 2', () => {
    // Mon–Wed perfect for both, with one goal at 1.5× each day; then each goal on 2 more days, never all four on one day.
    const S = stretches('apple');
    const days = [S, S, S, meets('pear', 'peach'), meets('cherry', 'apple'), meets('pear', 'peach'), meets('cherry', 'apple')];
    const a = week(days), b = week(days, 'B');
    for (const f of RING_FRUITS) expect(a.days.filter((d) => d.met[f]).length).toBe(5);
    expect(togetherDays(a, b).filter(Boolean)).toHaveLength(3);
    expect(pairWeek(a, b)).toBe(52);
  });

  it('a lazy week (two easy goals a day, never all four) is 28', () => {
    const days = Array(7).fill(meets('pear', 'cherry'));
    expect(pairWeek(week(days), week(days, 'B'))).toBe(28);
  });

  it('the two rewards against it: おやつ 8, 外食 15; the most a week pays is 4 of each, a typical week two of each', () => {
    expect(SHOP).toEqual([{ id: 'snack', bells: 8 }, { id: 'dinner', bells: 15 }]);
    expect(98 - 4 * shopPrice('snack')! - 4 * shopPrice('dinner')!).toBe(6);
    expect(52 - 2 * shopPrice('snack')! - 2 * shopPrice('dinner')!).toBe(6);
  });
});

