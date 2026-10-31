// ベル per day for the four fruits (🍑 Exercise, 🍐 Move, 🍒 Stand, 🍎 steps), weekly badges, the
// ふたりボーナス.
import { describe, expect, it } from 'vitest';
import type { PersonId, Workout } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { RULES } from '#lib/config/rules.ts';
import { duoBonus, earnWeek, milestoneBells, type EarnDay, type EarnInput } from './bells.ts';

/** A v1 week (RULES[0]); the v2 rules from 2026-11-02 have their own block below. */
const WK = '2026-10-26';
const D = weekDays(WK);

let n = 0;
/** A workout added by hand in きろく. */
const workout = (date: string, type: string, durationMin: number): Workout => ({ id: `m:${n++}`, date, type, durationMin });
type Cols = Partial<Record<'ex' | 'st' | 'kcal' | 'stand', (number | null)[]>> & { goal?: number | number[] };
/** A week of metrics, column by column (missing = null); the Move goal per day (default 600). */
const days = (wk: string, c: Cols = {}): EarnDay[] =>
  weekDays(wk).map((date, i) => ({
    date, exerciseMin: c.ex?.[i] ?? null, steps: c.st?.[i] ?? null, moveKcal: c.kcal?.[i] ?? null, standMin: c.stand?.[i] ?? null,
    moveGoal: Array.isArray(c.goal) ? c.goal[i] : (c.goal ?? 600)
  }));

function input(p: Partial<EarnInput> = {}): EarnInput {
  const weekKey = p.weekKey ?? WK;
  return { person: 'A', weekKey, days: days(weekKey), workouts: [], ...p };
}
const day0 = (c: Cols, p: Partial<EarnInput> = {}) => earnWeek(input({ days: days(WK, c), ...p })).days[0];
const all = (v: number) => Array(7).fill(v);

/** Every badge and every daily maximum, every day. */
function perfect(weekKey = WK, person: PersonId = 'A'): EarnInput {
  return input({
    person,
    weekKey,
    days: days(weekKey, { ex: all(60), st: all(9000), kcal: all(700), stand: all(200) })
  });
}

describe('earnWeek: the daily table', () => {
  it('a perfect day is 180 + 180 + 180 + 200 = 740 ベル, split per fruit (no 🥥: four fruits only)', () => {
    const d = earnWeek(perfect()).days[0];
    expect(d.rings).toEqual({ peach: 180, pear: 180, cherry: 180, apple: 200 });
    expect(d.bells).toBe(740);
    expect(d.met).toEqual({ peach: true, pear: true, cherry: true, apple: true });
    expect(earnWeek(perfect()).daily).toBe(7 * 740);
  });

  it('an empty day earns nothing', () => {
    expect(day0({})).toMatchObject({
      bells: 0, exerciseMin: 0, steps: null, moveKcal: null, standMin: null,
      met: { peach: false, pear: false, cherry: false, apple: false }
    });
  });

  it('a workout added by hand earns only its minutes, toward 🍑, whatever its type', () => {
    const d = day0({}, { workouts: [workout(D[0], 'Traditional Strength Training', 45)] });
    expect(d.rings).toEqual({ peach: 135, pear: 0, cherry: 0, apple: 0 });
    expect(d.bells).toBe(135);
    expect(Object.keys(d.met)).toEqual(['peach', 'pear', 'cherry', 'apple']);
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

  it('🍑 minutes are max(Watch, workouts added in きろく), never a sum; steps never count as minutes', () => {
    const manual = (min: number) => workout(D[0], 'Yoga', min);
    const mins = (ex: number | null, w: Workout[] = [], st: number | null = null) => day0({ ex: [ex], st: [st] }, { workouts: w }).exerciseMin;
    expect(mins(30, [], 20000)).toBe(30); // 20,000 steps add no minutes
    expect(mins(null, [], 20000)).toBe(0);
    expect(mins(30, [manual(20), manual(15)])).toBe(35); // manual workouts of a day add up, then max
    expect(mins(30, [manual(20)])).toBe(30);
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
    expect(apple(june, 0, 0, [workout('2027-06-07', 'Yoga', 30)])).toBe(200); // a hand-added workout counts
    expect(apple('2027-07-19', 1, 30)).toBe(200); // Tue Jul 20: last day
    expect(apple('2027-07-19', 2, 30)).toBe(0); // Wed Jul 21
    expect(apple('2027-05-31', 0, 60)).toBe(0); // Mon May 31
    expect(apple('2027-05-31', 1, 30)).toBe(200); // Tue Jun 1
    expect(apple('2026-11-02', 0, 90)).toBe(0); // November
  });

  it('only dates in the week count; the first metrics row of a date wins', () => {
    const row = (date: string, steps: number, kcal: number): EarnDay => ({ date, steps, exerciseMin: 0, moveKcal: kcal, standMin: 0, moveGoal: 600 });
    const e = earnWeek(input({
      days: [row(D[0], 8000, 0), row(D[0], 100, 600), row('2026-11-02', 9000, 600)],
      workouts: [workout('2026-10-25', 'Pilates', 30), workout('2026-11-02', 'Pilates', 30)]
    }));
    expect(e.days[0].rings.apple).toBe(200);
    expect(e.days[0].rings.pear).toBe(0);
    expect(e.daily).toBe(200);
  });
});

describe('earnWeek: weekly badges', () => {
  it('🍑 🍐 🍒 goal met on 5 days, 🍎 8,000 steps on 4 days', () => {
    // k days at each goal (one day fewer for 🍎), just under it on the others.
    const at = (k: number) => input({
      days: days(WK, {
        ex: all(0).map((_, i) => (i < k ? 60 : 59)),
        kcal: all(0).map((_, i) => (i < k ? 600 : 599)),
        stand: all(0).map((_, i) => (i < k ? 180 : 179)),
        st: all(0).map((_, i) => (i < k - 1 ? 8000 : 7999))
      })
    });
    const four = earnWeek(at(4)); // 4 days of each ring, 3 step days
    expect(four.badges).toEqual({ peach: false, pear: false, cherry: false, apple: false });
    expect(four.bonus).toBe(0);
    const five = earnWeek(at(5)); // 5, 5, 5, 4: all four
    expect(five.badges).toEqual({ peach: true, pear: true, cherry: true, apple: true });
    expect(five.fruits.peach).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.pear).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.cherry).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.apple).toMatchObject({ weekDays: 4, weekGoalDays: 4 });
    expect(five.bonus).toBe(4 * 400);
  });

  it('+400 per badge; per-fruit week ベル are the daily parts', () => {
    const e = earnWeek(input({ days: days(WK, { stand: [180, 180, 180, 180, 180, 90] }) }));
    expect(e.badges).toEqual({ peach: false, pear: false, cherry: true, apple: false });
    expect(e.bonus).toBe(400);
    expect(e.fruits.cherry.weekBells).toBe(5 * 180 + 90);
    expect(e.daily).toBe(5 * 180 + 90);
  });

  it('the ふたりボーナス: +200 for each badge both people met', () => {
    const a = earnWeek(perfect());
    const b = earnWeek(perfect(WK, 'B'));
    expect(duoBonus(a, b)).toBe(800);
    const weak = earnWeek({ ...perfect(WK, 'B'), days: days(WK, { ex: all(60), st: all(7999), kcal: all(700), stand: all(200) }) }); // no step day
    expect(weak.bonus).toBe(1200);
    expect(duoBonus(a, weak)).toBe(600); // one miss costs one share, never the lot
    expect(duoBonus(weak, weak)).toBe(600);
  });

  it('values come from the week’s rule version', () => {
    const v2 = { ...RULES[0], from: '2027-01-04', bells: { ...RULES[0].bells, perStandMin: 2 }, badges: { ...RULES[0].badges, duoPerBadge: 500 } };
    (RULES as (typeof v2)[]).push(v2);
    try {
      expect(earnWeek(perfect()).days[0].rings.cherry).toBe(180);
      expect(earnWeek(perfect('2027-01-04')).days[0].rings.cherry).toBe(360);
      expect(duoBonus(earnWeek(perfect('2027-01-04')), earnWeek(perfect('2027-01-04', 'B')))).toBe(2000);
    } finally {
      (RULES as unknown[]).pop();
    }
  });
});

describe('the headline number', () => {
  it('v1: a minimum on-target week is 11,000 ベル for the two of them', () => {
    // Each person exactly at every badge line and no more: 60 exercise min, the Move goal and 180 stand min on 5 days,
    // 8,000 steps on 4. Daily 3 × (5 × 180) + 4 × 200 = 3,500; badges 4 × 400 = 1,600; ふたりボーナス 4 × 200 = 800.
    // Each person's own Move goal: ウェイ 600, うめ 400.
    const onTarget = (person: PersonId, goal: number) => earnWeek(input({
      person,
      days: days(WK, { ex: [60, 60, 60, 60, 60], kcal: Array(5).fill(goal), stand: [180, 180, 180, 180, 180], st: [8000, 8000, 8000, 8000], goal })
    }));
    const a = onTarget('A', 600), b = onTarget('B', 400);
    expect(a.daily).toBe(3500);
    expect(b.daily).toBe(3500);
    expect(a.bonus).toBe(1600);
    expect(duoBonus(a, b)).toBe(800);
    expect(a.daily + a.bonus + b.daily + b.bonus + duoBonus(a, b)).toBe(11_000);
  });
});

describe('RULES v2 from 2026-11-02 (push exercise)', () => {
  const WK2 = '2026-11-02';
  const day = (c: Cols, p: Partial<EarnInput> = {}) => earnWeek(input({ weekKey: WK2, days: days(WK2, c), ...p })).days[0];

  it('switches on Monday 2026-11-02: Sunday 11-01 still earns v1, the Monday v2', () => {
    const sun = (wk: string, i: number) => earnWeek(input({ weekKey: wk, days: days(wk, { ex: all(60), stand: all(150) }) })).days[i].rings;
    expect(sun('2026-10-26', 6)).toEqual({ peach: 180, pear: 0, cherry: 150, apple: 0 }); // Sun 11-01
    expect(sun(WK2, 0)).toEqual({ peach: 420, pear: 0, cherry: 120, apple: 0 }); // Mon 11-02
  });

  it('per-fruit maxima: 🍑 420, 🍐 180, 🍒 120, 🍎 200; a perfect day is 920', () => {
    expect(day({ ex: [59] }).met.peach).toBe(false);
    expect(day({ ex: [60] }).met.peach).toBe(true);
    expect(day({ stand: [119] }).met.cherry).toBe(false);
    expect(day({ stand: [120] }).met.cherry).toBe(true);
    const p = earnWeek(perfect(WK2)).days[0];
    expect(p.rings).toEqual({ peach: 420, pear: 180, cherry: 120, apple: 200 });
    expect(p.bells).toBe(920);
    expect(p.milestone).toEqual({ peach: 4, pear: 4, cherry: 4, apple: 4 });
  });

  it('badges keep their thresholds (5 · 5 · 5 · 4) at +450 each; the ふたりボーナス is +500 a shared badge', () => {
    const e = earnWeek(input({ weekKey: WK2, days: days(WK2, { stand: [120, 120, 120, 120, 120] }) }));
    expect(e.badges).toEqual({ peach: false, pear: false, cherry: true, apple: false });
    expect(e.bonus).toBe(450);
    const four = earnWeek(input({ weekKey: WK2, days: days(WK2, { stand: [120, 120, 120, 120, 119] }) }));
    expect(four.badges.cherry).toBe(false);
    expect(duoBonus(earnWeek(perfect(WK2)), earnWeek(perfect(WK2, 'B')))).toBe(2000);
  });

  it('a minimum on-target week is still ≈ 14,400 ベル for the two of them, so the treat prices still fit', () => {
    // 5 × 420 🍑 + 5 × 180 🍐 + 5 × 120 🍒 + 4 × 200 🍎 = 4,400 daily; 4 × 450 = 1,800 badges; 6,200 each;
    // + 4 × 500 ふたりボーナス = 14,400.
    const onTarget = (person: PersonId, goal: number) => earnWeek(input({
      person, weekKey: WK2,
      days: days(WK2, { ex: [60, 60, 60, 60, 60], kcal: Array(5).fill(goal), stand: [120, 120, 120, 120, 120], st: [8000, 8000, 8000, 8000], goal })
    }));
    const a = onTarget('A', 600), b = onTarget('B', 400);
    expect(a.fruits.peach.weekBells).toBe(2100);
    expect(a.fruits.pear.weekBells).toBe(900);
    expect(a.fruits.cherry.weekBells).toBe(600);
    expect(a.fruits.apple.weekBells).toBe(800);
    expect(a.daily).toBe(4400);
    expect(b.daily).toBe(4400);
    expect(a.bonus).toBe(1800);
    expect(duoBonus(a, b)).toBe(2000);
    expect(a.daily + a.bonus + b.daily + b.bonus + duoBonus(a, b)).toBe(14_400);
  });
});

describe('v2 milestone curve from 2026-11-02 (25 / 50 / 75 / 100% of the goal)', () => {
  const WK2 = '2026-11-02';
  const D2 = weekDays(WK2);
  const day = (c: Cols, p: Partial<EarnInput> = {}) => earnWeek(input({ weekKey: WK2, days: days(WK2, c), ...p })).days[0];
  const peach = (ex: number) => day({ ex: [ex] }).rings.peach;
  const apple = (st: number) => day({ st: [st] }).rings.apple;
  const cherry = (st: number) => day({ stand: [st] }).rings.cherry;
  const pear = (kcal: number, goal: number) => day({ kcal: [kcal], goal }).rings.pear;

  it('the tables: the shared shares, 🍑 rounded to 5s for its new max, 🍎 the user-approved steps; v1 weeks have none', () => {
    expect(milestoneBells(WK2, 'peach')).toEqual([45, 120, 230, 420]);
    expect(milestoneBells(WK2, 'pear')).toEqual([19, 53, 98, 180]);
    expect(milestoneBells(WK2, 'cherry')).toEqual([13, 35, 65, 120]);
    expect(milestoneBells(WK2, 'apple')).toEqual([20, 60, 110, 200]);
    // 🍑 stays within 2.5 ベル of the shares 25 / 70 / 130 / 240 of its max (43.75 / 122.5 / 227.5 / 420).
    const shares = [25, 70, 130, 240].map((x) => (420 * x) / 240);
    milestoneBells(WK2, 'peach')!.forEach((b, i) => expect(Math.abs(b - shares[i])).toBeLessThanOrEqual(2.5));
    for (const f of ['peach', 'pear', 'cherry', 'apple'] as const) {
      const b = milestoneBells(WK2, f)!;
      const steps = b.map((x, i) => x - (i ? b[i - 1] : 0));
      for (let i = 1; i < steps.length; i++) expect(steps[i], `${f} step ${i}`).toBeGreaterThan(steps[i - 1]); // each step worth more
      expect(b.at(-1), `${f} max`).toBe(earnWeek(perfect(WK2)).days[0].rings[f]); // the last step is the fruit's max
    }
    expect(milestoneBells('2026-10-26', 'peach')).toBeNull();
  });

  it('🍑 Exercise (goal 60): 15 → 45, 30 → 120, 45 → 230, 60 → 420, just below / at / above each step', () => {
    expect([0, 14, 14.99, 15, 15.5, 29.99, 30, 31, 44.99, 45, 46, 59.99, 60, 61, 200].map(peach))
      .toEqual([0, 0, 0, 45, 45, 45, 120, 120, 120, 230, 230, 230, 420, 420, 420]);
    expect([14, 15, 30, 45, 60].map((x) => day({ ex: [x] }).milestone!.peach)).toEqual([0, 1, 2, 3, 4]);
    // Workouts added in きろく count as before: max(Watch, manual).
    expect(day({ ex: [10] }, { workouts: [workout(D2[0], 'Outdoor Walk', 31)] }).rings.peach).toBe(120);
  });

  it('🍎 Steps (goal 8,000): 2k → 20, 4k → 60, 6k → 110, 8k → 200, just below / at / above each step', () => {
    expect([0, 1999, 2000, 2001, 3999, 4000, 4001, 5999, 6000, 6001, 7999, 8000, 8001, 30000].map(apple))
      .toEqual([0, 0, 20, 20, 20, 60, 60, 60, 110, 110, 110, 200, 200, 200]);
    expect(day({}).milestone!.apple).toBe(0); // no row
  });

  it('🍒 Stand (goal 120, whole minutes): 30 → 13, 60 → 35, 90 → 65, 120 → 120', () => {
    expect([0, 29, 29.9, 30, 31, 59, 60, 61, 89, 90, 91, 119, 119.9, 120, 121, 1440].map(cherry))
      .toEqual([0, 0, 0, 13, 13, 13, 35, 35, 35, 65, 65, 65, 65, 120, 120, 120]);
  });

  it('🍐 Move: the steps are shares of each person’s own goal (19 / 53 / 98 / 180)', () => {
    expect([0, 149, 150, 151, 299, 300, 301, 449, 450, 451, 599, 600, 601, 2500].map((k) => pear(k, 600)))
      .toEqual([0, 0, 19, 19, 19, 53, 53, 53, 98, 98, 98, 180, 180, 180]);
    expect([99, 100, 199, 200, 299, 300, 399, 400].map((k) => pear(k, 400))).toEqual([0, 19, 19, 53, 53, 98, 98, 180]);
    // A goal that doesn't divide by 4: 450 → steps at 112.5 / 225 / 337.5 / 450 kcal.
    expect([112, 112.5, 113, 224, 225, 337, 337.5, 449, 450].map((k) => pear(k, 450))).toEqual([0, 19, 19, 19, 53, 53, 98, 98, 180]);
    expect(pear(300, 1000)).toBe(19); // 30% of a big goal
    expect(pear(500, 0)).toBe(0); // no goal, no pear
  });

  it('tsuyu: 30 exercise minutes still make a full step day (milestone 4); steps alone climb the curve', () => {
    const TW = '2027-06-07';
    const tday = (c: Cols) => earnWeek(input({ weekKey: TW, days: days(TW, c) })).days[0];
    expect(tday({ ex: [30], st: [1000] })).toMatchObject({ rings: { apple: 200, peach: 120 }, milestone: { apple: 4 }, met: { apple: true } });
    expect(tday({ ex: [29], st: [3000] }).rings.apple).toBe(20);
  });

  it('badges still count days at the goal (100%); 75% days pay but never count', () => {
    const e = earnWeek(input({ weekKey: WK2, days: days(WK2, { st: all(7999), ex: all(59), stand: all(119), kcal: all(599) }) }));
    expect(e.badges).toEqual({ peach: false, pear: false, cherry: false, apple: false });
    expect(e.fruits.apple).toMatchObject({ weekDays: 0, weekBells: 7 * 110 });
    expect(e.daily).toBe(7 * (230 + 98 + 65 + 110));
    expect(e.bonus).toBe(0);
  });

  it('v1 vs v2 by week: the same partial day pays linearly on Sun 11-01 and on the curve on Mon 11-02', () => {
    const c = { ex: all(40), st: all(5000), stand: all(100), kcal: all(450) };
    const v1 = earnWeek(input({ weekKey: '2026-10-26', days: days('2026-10-26', c) })).days[6];
    const v2 = earnWeek(input({ weekKey: WK2, days: days(WK2, c) })).days[0];
    expect(v1.rings).toEqual({ peach: 120, pear: 135, cherry: 100, apple: 0 }); // 3/min, 450/600 × 180, 1/min, all or nothing
    expect(v1.milestone).toBeNull();
    expect(v2.rings).toEqual({ peach: 120, pear: 98, cherry: 65, apple: 60 });
    expect(v2.milestone).toEqual({ peach: 2, pear: 3, cherry: 3, apple: 2 });
  });
});
