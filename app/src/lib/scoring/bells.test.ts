// ADR 0021: ベル per day for the five fruits (🍑 Exercise, 🍐 Move, 🍒 Stand, 🍎 steps, 🥥 gym), weekly badges, the
// ふたりボーナス (ADR 0019).
import { describe, expect, it } from 'vitest';
import type { GymArrival, PersonId, Workout } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { RULES } from '#lib/config/rules.ts';
import { duoBonus, earnWeek, type EarnDay, type EarnInput } from './bells.ts';

/** A v1 week (RULES[0]); the v2 rules from 2026-11-02 have their own block below. */
const WK = '2026-10-26';
const D = weekDays(WK);

let n = 0;
const workout = (date: string, type: string, durationMin: number, extra: Partial<Workout> = {}): Workout => ({
  id: `w${n++}`, date, type, startAt: `${date}T07:00:00+09:00`, endAt: `${date}T08:00:00+09:00`, durationMin, avgHr: null, ...extra
});
const arrival = (date: string, time = '07:00'): GymArrival => ({ id: `${date}T${time}`, label: '', date, arriveAt: `${date}T${time}:00+09:00` });
type Cols = Partial<Record<'ex' | 'st' | 'kcal' | 'stand', (number | null)[]>> & { goal?: number | number[] };
/** A week of metrics, column by column (missing = null); the Move goal per day (default 600). */
const days = (wk: string, c: Cols = {}): EarnDay[] =>
  weekDays(wk).map((date, i) => ({
    date, exerciseMin: c.ex?.[i] ?? null, steps: c.st?.[i] ?? null, moveKcal: c.kcal?.[i] ?? null, standMin: c.stand?.[i] ?? null,
    moveGoal: Array.isArray(c.goal) ? c.goal[i] : (c.goal ?? 600)
  }));

function input(p: Partial<EarnInput> = {}): EarnInput {
  const weekKey = p.weekKey ?? WK;
  return { person: 'A', weekKey, days: days(weekKey), workouts: [], arrivals: [], ...p };
}
const day0 = (c: Cols, p: Partial<EarnInput> = {}) => earnWeek(input({ days: days(WK, c), ...p })).days[0];
const all = (v: number) => Array(7).fill(v);

/** Every badge and every daily maximum, every day. */
function perfect(weekKey = WK, person: PersonId = 'A'): EarnInput {
  return input({
    person,
    weekKey,
    days: days(weekKey, { ex: all(60), st: all(9000), kcal: all(700), stand: all(200) }),
    workouts: weekDays(weekKey).map((x) => workout(x, 'Traditional Strength Training', 40))
  });
}

describe('earnWeek: the daily table (ADR 0021 §3)', () => {
  it('a perfect day is 180 + 180 + 180 + 200 + 400 = 1,140 ベル, split per fruit', () => {
    const d = earnWeek(perfect()).days[0];
    expect(d.rings).toEqual({ peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 });
    expect(d.bells).toBe(1140);
    expect(d.met).toEqual({ peach: true, pear: true, cherry: true, apple: true, coconut: true });
    expect(earnWeek(perfect()).daily).toBe(7 * 1140);
  });

  it('an empty day earns nothing', () => {
    expect(day0({})).toMatchObject({
      bells: 0, exerciseMin: 0, steps: null, moveKcal: null, standMin: null, gym: false,
      met: { peach: false, pear: false, cherry: false, apple: false, coconut: false }
    });
  });

  it('🍑 3 per whole counted exercise minute, capped at 60', () => {
    const peach = (ex: number) => day0({ ex: [ex] }).rings.peach;
    expect(peach(1)).toBe(3);
    expect(peach(59.9)).toBe(177);
    expect(peach(60)).toBe(180);
    expect(peach(200)).toBe(180);
    expect(day0({ ex: [200] }).exerciseMin).toBe(200); // counted minutes are reported uncapped
    expect(day0({ ex: [59] }).met.peach).toBe(false);
    expect(day0({ ex: [60] }).met.peach).toBe(true);
  });

  it('🍑 minutes are max(Watch, workouts added in きろく), never a sum; steps no longer turn into minutes', () => {
    const manual = (min: number) => workout(D[0], 'Yoga', min, { manual: true });
    const mins = (ex: number | null, w: Workout[] = [], st: number | null = null) => day0({ ex: [ex], st: [st] }, { workouts: w }).exerciseMin;
    expect(mins(30, [], 20000)).toBe(30); // ADR 0021 §2: 20,000 steps add no minutes
    expect(mins(null, [], 20000)).toBe(0);
    expect(mins(30, [manual(20), manual(15)])).toBe(35); // manual workouts of a day add up, then max
    expect(mins(30, [manual(20)])).toBe(30);
    expect(mins(10, [workout(D[0], 'Pilates', 45)])).toBe(10); // a Watch workout is already in its minutes
  });

  it('🍐 Move: 180 at the goal, proportional (floored) below it, capped above; the day’s own goal applies', () => {
    const pear = (kcal: number | null, goal = 600) => day0({ kcal: [kcal], goal }).rings.pear;
    expect(pear(null)).toBe(0);
    expect(pear(0)).toBe(0);
    expect(pear(1)).toBe(0); // 0.3 → 0
    expect(pear(300)).toBe(90);
    expect(pear(599)).toBe(179); // 179.7 → 179
    expect(pear(600)).toBe(180);
    expect(pear(2500)).toBe(180);
    expect(pear(300, 400)).toBe(135); // うめ's default goal: 300 / 400 × 180
    expect(pear(400, 400)).toBe(180);
    expect(day0({ kcal: [599] }).met.pear).toBe(false);
    expect(day0({ kcal: [600] }).met.pear).toBe(true);
    expect(day0({ kcal: [500.4] }).moveKcal).toBe(500.4);
    // A goal per day: the same 450 kcal meets Tuesday's 400 but not Monday's 600.
    const e = earnWeek(input({ days: days(WK, { kcal: [450, 450], goal: [600, 400, 400, 400, 400, 400, 400] }) }));
    expect(e.days.slice(0, 2).map((d) => [d.rings.pear, d.met.pear, d.moveGoal])).toEqual([[135, false, 600], [180, true, 400]]);
  });

  it('🍒 Stand: 1 per whole stand minute, capped at 180', () => {
    const cherry = (st: number | null) => day0({ stand: [st] }).rings.cherry;
    expect(cherry(null)).toBe(0);
    expect(cherry(58)).toBe(58);
    expect(cherry(179.9)).toBe(179);
    expect(cherry(180)).toBe(180);
    expect(cherry(1440)).toBe(180);
    expect(day0({ stand: [179] }).met.cherry).toBe(false);
    expect(day0({ stand: [180] }).met.cherry).toBe(true);
  });

  it('🍎 200 at 8,000 steps (inclusive); null steps never count', () => {
    const apple = (st: number | null) => day0({ st: [st] }).rings.apple;
    expect(apple(7999)).toBe(0);
    expect(apple(8000)).toBe(200);
    expect(apple(30000)).toBe(200);
    expect(apple(null)).toBe(0);
  });

  it('🍎 tsuyu (Jun 1–Jul 20): 30 counted exercise minutes also earn the step reward', () => {
    const june = '2027-06-07';
    const apple = (wk: string, i: number, ex: number, extra: Workout[] = []) =>
      earnWeek(input({ weekKey: wk, days: days(wk, { ex: all(ex), st: all(1000) }), workouts: extra })).days[i].rings.apple;
    expect(apple(june, 0, 30)).toBe(200);
    expect(apple(june, 0, 29)).toBe(0);
    expect(apple(june, 0, 0, [workout('2027-06-07', 'Yoga', 30, { manual: true })])).toBe(200); // a hand-added workout counts
    expect(apple('2027-07-19', 1, 30)).toBe(200); // Tue Jul 20: last day
    expect(apple('2027-07-19', 2, 30)).toBe(0); // Wed Jul 21
    expect(apple('2027-05-31', 0, 60)).toBe(0); // Mon May 31
    expect(apple('2027-05-31', 1, 30)).toBe(200); // Tue Jun 1
    expect(apple('2026-11-02', 0, 90)).toBe(0); // November
  });

  it('🥥 400 on a gym day (an arrival or a strength workout), at most once a day', () => {
    const coconut = (w: Workout[], a: GymArrival[] = []) => day0({}, { workouts: w, arrivals: a }).rings.coconut;
    expect(coconut([workout(D[0], 'Pilates', 15)])).toBe(400);
    expect(coconut([workout(D[0], 'Pilates', 14)])).toBe(0);
    expect(coconut([workout(D[0], 'Functional Strength Training', 30)])).toBe(400);
    expect(coconut([workout(D[0], 'Pilates', 30), workout(D[0], 'Traditional Strength Training', 30)], [arrival(D[0])])).toBe(400);
    expect(coconut([], [arrival(D[0])])).toBe(400); // a gym arrival alone, however short the stay
    expect(coconut([], [arrival(D[0]), arrival(D[0], '19:00')])).toBe(400); // two arrivals: still one gym day
  });

  it('🥥 no daily questions: other types (HIIT, yoga, core…) count only when marked as strength in きろく', () => {
    const coconut = (w: Workout) => day0({}, { workouts: [w] }).rings.coconut;
    for (const type of ['Yoga', 'High Intensity Interval Training', 'Core Training', 'Mixed Cardio', 'Cross Training', 'Running']) {
      expect(coconut(workout(D[0], type, 30))).toBe(0);
      expect(coconut(workout(D[0], type, 30, { strengthOverride: true }))).toBe(400);
    }
    expect(coconut(workout(D[0], 'Pilates', 30, { strengthOverride: false }))).toBe(0); // a mark takes an auto type out
    expect(coconut(workout(D[0], 'Yoga', 14, { strengthOverride: true }))).toBe(0); // still at least 15 minutes
  });

  it('🥥 every gym arrival day counts, with no weekly limit', () => {
    const e = earnWeek(input({ arrivals: D.slice(0, 5).map((d) => arrival(d)), workouts: [workout(D[5], 'Pilates', 30)] }));
    expect(e.days.map((d) => d.gym)).toEqual([true, true, true, true, true, true, false]);
    expect(e.fruits.coconut.weekBells).toBe(2400);
  });

  it('only dates in the week count; the first metrics row of a date wins', () => {
    const row = (date: string, steps: number, kcal: number): EarnDay => ({ date, steps, exerciseMin: 0, moveKcal: kcal, standMin: 0, moveGoal: 600 });
    const e = earnWeek(input({
      days: [row(D[0], 8000, 0), row(D[0], 100, 600), row('2026-11-02', 9000, 600)],
      workouts: [workout('2026-10-25', 'Pilates', 30)],
      arrivals: [arrival('2026-11-02')]
    }));
    expect(e.days[0].rings.apple).toBe(200);
    expect(e.days[0].rings.pear).toBe(0);
    expect(e.daily).toBe(200);
  });
});

describe('earnWeek: weekly badges (ADR 0021 §4)', () => {
  it('🍑 🍐 🍒 goal met on 5 days, 🍎 8,000 steps on 4 days, 🥥 3 gym days', () => {
    // k days at each goal (one day fewer for 🍎, two fewer for 🥥), just under it on the others.
    const at = (k: number) => input({
      days: days(WK, {
        ex: all(0).map((_, i) => (i < k ? 60 : 59)),
        kcal: all(0).map((_, i) => (i < k ? 600 : 599)),
        stand: all(0).map((_, i) => (i < k ? 180 : 179)),
        st: all(0).map((_, i) => (i < k - 1 ? 8000 : 7999))
      }),
      workouts: D.slice(0, k - 2).map((d) => workout(d, 'Pilates', 30))
    });
    const four = earnWeek(at(4)); // 4 days of each ring, 3 step days, 2 gym days
    expect(four.badges).toEqual({ peach: false, pear: false, cherry: false, apple: false, coconut: false });
    expect(four.bonus).toBe(0);
    const five = earnWeek(at(5)); // 5, 5, 5, 4, 3: all five
    expect(five.badges).toEqual({ peach: true, pear: true, cherry: true, apple: true, coconut: true });
    expect(five.fruits.peach).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.pear).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.cherry).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.apple).toMatchObject({ weekDays: 4, weekGoalDays: 4 });
    expect(five.fruits.coconut).toMatchObject({ weekDays: 3, weekGoalDays: 3 });
    expect(five.bonus).toBe(5 * 400);
  });

  it('+400 per badge; per-fruit week ベル are the daily parts', () => {
    const e = earnWeek(input({ days: days(WK, { stand: [180, 180, 180, 180, 180, 90] }) }));
    expect(e.badges).toEqual({ peach: false, pear: false, cherry: true, apple: false, coconut: false });
    expect(e.bonus).toBe(400);
    expect(e.fruits.cherry.weekBells).toBe(5 * 180 + 90);
    expect(e.daily).toBe(5 * 180 + 90);
  });

  it('the ふたりボーナス: +200 for each badge both people met', () => {
    const a = earnWeek(perfect());
    const b = earnWeek(perfect(WK, 'B'));
    expect(duoBonus(a, b)).toBe(1000);
    const weak = earnWeek({ ...perfect(WK, 'B'), workouts: [] }); // no gym days
    expect(weak.bonus).toBe(1600);
    expect(duoBonus(a, weak)).toBe(800); // one miss costs one share, never the lot
    expect(duoBonus(weak, weak)).toBe(800);
  });

  it('values come from the week’s rule version', () => {
    const v2 = { ...RULES[0], from: '2027-01-04', bells: { ...RULES[0].bells, perStandMin: 2 }, badges: { ...RULES[0].badges, duoPerBadge: 500 } };
    (RULES as (typeof v2)[]).push(v2);
    try {
      expect(earnWeek(perfect()).days[0].rings.cherry).toBe(180);
      expect(earnWeek(perfect('2027-01-04')).days[0].rings.cherry).toBe(360);
      expect(duoBonus(earnWeek(perfect('2027-01-04')), earnWeek(perfect('2027-01-04', 'B')))).toBe(2500);
    } finally {
      (RULES as unknown[]).pop();
    }
  });
});

describe('ADR 0021: the headline number', () => {
  it('a minimum on-target week is 14,400 ベル for the two of them (≈ the ADR 0019 week of 14,250)', () => {
    // Each person exactly at every badge line and no more: 60 exercise min, the Move goal and 180 stand min on 5 days,
    // 8,000 steps on 4, the gym on 3. Daily 3 × (5 × 180) + 4 × 200 + 3 × 400 = 4,700; badges 5 × 400 = 2,000;
    // ふたりボーナス 5 × 200 = 1,000. Each person's own Move goal: ウェイ 600, うめ 400.
    const onTarget = (person: PersonId, goal: number) => earnWeek(input({
      person,
      days: days(WK, { ex: [60, 60, 60, 60, 60], kcal: Array(5).fill(goal), stand: [180, 180, 180, 180, 180], st: [8000, 8000, 8000, 8000], goal }),
      arrivals: D.slice(0, 3).map((x) => arrival(x))
    }));
    const a = onTarget('A', 600), b = onTarget('B', 400);
    expect(a.daily).toBe(4700);
    expect(b.daily).toBe(4700);
    expect(a.bonus).toBe(2000);
    expect(duoBonus(a, b)).toBe(1000);
    expect(a.daily + a.bonus + b.daily + b.bonus + duoBonus(a, b)).toBe(14_400);
  });
});

describe('RULES v2 from 2026-11-02 (push exercise + strength)', () => {
  const WK2 = '2026-11-02';
  const D2 = weekDays(WK2);
  const day = (c: Cols, p: Partial<EarnInput> = {}) => earnWeek(input({ weekKey: WK2, days: days(WK2, c), ...p })).days[0];

  it('switches on Monday 2026-11-02: Sunday 11-01 still earns v1, the Monday v2', () => {
    const sun = (wk: string, i: number) => {
      const e = earnWeek(input({ weekKey: wk, days: days(wk, { ex: all(60), stand: all(150) }), arrivals: [arrival(weekDays(wk)[i])] }));
      return e.days[i].rings;
    };
    expect(sun('2026-10-26', 6)).toMatchObject({ peach: 180, cherry: 150, coconut: 400 }); // Sun 11-01
    expect(sun(WK2, 0)).toMatchObject({ peach: 240, cherry: 120, coconut: 500 }); // Mon 11-02
  });

  it('per-fruit caps: 🍑 4/min to 240, 🍐 180, 🍒 1/min to 120, 🍎 200, 🥥 500; a perfect day is 1,240', () => {
    const peach = (ex: number) => day({ ex: [ex] }).rings.peach;
    expect([peach(1), peach(59.9), peach(60), peach(200)]).toEqual([4, 236, 240, 240]);
    expect(day({ ex: [59] }).met.peach).toBe(false);
    expect(day({ ex: [60] }).met.peach).toBe(true);
    const cherry = (st: number) => day({ stand: [st] }).rings.cherry;
    expect([cherry(58), cherry(119.9), cherry(120), cherry(1440)]).toEqual([58, 119, 120, 120]);
    expect(day({ stand: [119] }).met.cherry).toBe(false);
    expect(day({ stand: [120] }).met.cherry).toBe(true);
    const pear = (kcal: number, goal: number) => day({ kcal: [kcal], goal }).rings.pear;
    expect([pear(300, 600), pear(600, 600), pear(2500, 600), pear(400, 400)]).toEqual([90, 180, 180, 180]); // the Move goal stays per person
    expect([day({ st: [7999] }).rings.apple, day({ st: [8000] }).rings.apple, day({ st: [30000] }).rings.apple]).toEqual([0, 200, 200]);
    expect(day({}, { arrivals: [arrival(D2[0]), arrival(D2[0], '19:00')] }).rings.coconut).toBe(500);
    const p = earnWeek(perfect(WK2)).days[0];
    expect(p.rings).toEqual({ peach: 240, pear: 180, cherry: 120, apple: 200, coconut: 500 });
    expect(p.bells).toBe(1240);
  });

  it('badges keep their thresholds (5 · 5 · 5 · 4 · 3) at +340 each; the ふたりボーナス stays +200 a shared badge', () => {
    const e = earnWeek(input({ weekKey: WK2, days: days(WK2, { stand: [120, 120, 120, 120, 120] }) }));
    expect(e.badges).toEqual({ peach: false, pear: false, cherry: true, apple: false, coconut: false });
    expect(e.bonus).toBe(340);
    const four = earnWeek(input({ weekKey: WK2, days: days(WK2, { stand: [120, 120, 120, 120, 119] }) }));
    expect(four.badges.cherry).toBe(false);
    expect(duoBonus(earnWeek(perfect(WK2)), earnWeek(perfect(WK2, 'B')))).toBe(1000);
  });

  it('a minimum on-target week is still 14,400 ベル for the two of them', () => {
    // 5 × 240 🍑 + 5 × 180 🍐 + 5 × 120 🍒 + 4 × 200 🍎 + 3 × 500 🥥 = 5,000 daily; 5 × 340 = 1,700 badges; 6,700 each;
    // + 5 × 200 ふたりボーナス = 14,400.
    const onTarget = (person: PersonId, goal: number) => earnWeek(input({
      person, weekKey: WK2,
      days: days(WK2, { ex: [60, 60, 60, 60, 60], kcal: Array(5).fill(goal), stand: [120, 120, 120, 120, 120], st: [8000, 8000, 8000, 8000], goal }),
      arrivals: D2.slice(0, 3).map((x) => arrival(x))
    }));
    const a = onTarget('A', 600), b = onTarget('B', 400);
    expect(a.fruits.peach.weekBells).toBe(1200);
    expect(a.fruits.coconut.weekBells).toBe(1500);
    expect(a.daily).toBe(5000);
    expect(b.daily).toBe(5000);
    expect(a.bonus).toBe(1700);
    expect(duoBonus(a, b)).toBe(1000);
    expect(a.daily + a.bonus + b.daily + b.bonus + duoBonus(a, b)).toBe(14_400);
  });
});
