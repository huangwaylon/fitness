import { describe, expect, it } from 'vitest';
import { SEASONS } from '#lib/config/rules.ts';
import type { CheckinTick, DayMetrics, PersonTargets, Visit, WeekInput, Workout } from '#lib/types.ts';
import { weekDays } from '#lib/scoring/dates.ts';
import { ratioMilli, scoreWeek } from '#lib/scoring/score.ts';
import { targetsFor } from '#lib/scoring/targets.ts';

const WK = '2026-11-02';
const A = SEASONS[0].targets.A; // 135 min, 2 strength, 7500 × 5, 15 ticks
const B = SEASONS[0].targets.B; // 85 min

let n = 0;
function workout(date: string, type: string, durationMin: number, avgHr: number | null = null, includesStrength: boolean | null = null): Workout {
  return { extId: `w${n++}`, date, type, startAt: `${date}T07:00:00+09:00`, endAt: `${date}T08:00:00+09:00`, durationMin, avgHr, includesStrength };
}
function visit(date: string, dwellMin: number, autoStrength: boolean, confirmed: boolean | null = null): Visit {
  return { placeKey: autoStrength ? 'pt' : 'gym', date, arriveAt: `${date}T07:00:00+09:00`, leaveAt: `${date}T08:00:00+09:00`, dwellMin, autoStrength, confirmed };
}
function ticks(date: string, keys: string[]): CheckinTick[] {
  return keys.map((habitKey) => ({ date, habitKey }));
}
function days(weekKey: string, exercise: (number | null)[], steps: (number | null)[]): DayMetrics[] {
  return weekDays(weekKey).map((date, i) => ({ date, exerciseMin: exercise[i] ?? null, steps: steps[i] ?? null }));
}
function input(p: Partial<WeekInput> & { targets?: PersonTargets } = {}): WeekInput {
  const weekKey = p.weekKey ?? WK;
  return {
    person: 'A', weekKey, age: 29, targets: A,
    days: days(weekKey, [], []), workouts: [], visits: [], checkins: [], cozyDays: [], calibration: false,
    ...p
  };
}
/** A perfect week for A in `weekKey`. */
function perfect(weekKey = WK, targets = A): WeekInput {
  const d = weekDays(weekKey);
  return input({
    weekKey, targets,
    days: days(weekKey, [90, 90, 90, 90, 90, 90, 90], [9000, 9000, 9000, 9000, 9000, 9000, 9000]),
    workouts: [workout(d[0], 'Traditional Strength Training', 45), workout(d[2], 'Functional Strength Training', 45), workout(d[4], 'Pilates', 45)],
    checkins: d.flatMap((x) => ticks(x, [...targets.habits]))
  });
}

describe('ratioMilli', () => {
  it('pays linearly, floors, caps and pays in full on zero target', () => {
    expect(ratioMilli(25000, 1000, 2000, 7)).toBe(12500);
    expect(ratioMilli(25000, 11000, 15000, 7)).toBe(18333);
    expect(ratioMilli(25000, 5000, 2000, 7)).toBe(25000);
    expect(ratioMilli(25000, 0, 0, 7)).toBe(25000);
    expect(ratioMilli(25000, 0, 2000, 0)).toBe(25000);
    expect(ratioMilli(25000, 0, 2000, 7)).toBe(0);
  });
});

describe('scoreWeek: totals', () => {
  it('a perfect week is exactly 100', () => {
    const s = scoreWeek(perfect());
    expect(s.score).toBe(100);
    expect(s.categories.peach).toMatchObject({ milli: 35000, maxMilli: 35000, target: 135 });
    expect(s.categories.coconut).toMatchObject({ milli: 25000, actual: 3, target: 2 });
    expect(s.categories.apple).toMatchObject({ milli: 15000, actual: 7, target: 5 });
    expect(s.categories.pear).toMatchObject({ milli: 25000, actual: 21, target: 15 });
    expect(s.strengthDays).toEqual(['2026-11-02', '2026-11-04', '2026-11-06']);
    expect(s.dataDays).toBe(7);
    expect(s.restDays).toBe(4); // the 3 strength days are not rest days; the other 4 are
  });
  it('a perfect week for B, and in easy/holiday weeks, is exactly 100', () => {
    expect(scoreWeek(perfect(WK, B)).score).toBe(100);
    expect(scoreWeek(perfect('2026-12-21', targetsFor('B', '2026-12-21'))).score).toBe(100);
    expect(scoreWeek(perfect('2026-12-28', targetsFor('A', '2026-12-28'))).score).toBe(100);
  });
  it('an empty week scores 0 (no data → no rest days)', () => {
    const s = scoreWeek(input());
    expect(s.score).toBe(0);
    expect(s.dataDays).toBe(0);
  });
  it('a typical week matches hand-computed values (73)', () => {
    const d = weekDays(WK);
    const s = scoreWeek(input({
      days: days(WK, [10, 70, 0, 15, 5, 20, 0], [8000, 7000, 9000, 7500, 3000, 12000, null]),
      workouts: [
        workout(d[1], 'Traditional Strength Training', 40, 150), // hard + strength
        workout(d[3], 'Yoga', 20, 100, null) // unanswered → not strength
      ],
      checkins: [
        ...ticks(d[0], ['teishoku_lunch', 'low_salt_day', 'veg_two_meals']),
        ...ticks(d[1], ['teishoku_lunch', 'veg_two_meals']),
        ...ticks(d[2], ['veg_two_meals']),
        ...ticks(d[3], ['teishoku_lunch', 'low_salt_day', 'veg_two_meals']),
        ...ticks(d[5], ['low_salt_day', 'veg_two_meals'])
      ]
    }));
    // Peach: 10 + 67.5 (cap) + 0 + 15 + 5 + 20 + 0 = 117.5 min → floor(30000 × 117.5 / 135) = 26111, + 5000 rest
    expect(s.categories.peach.actual).toBe(117.5);
    expect(s.categories.peach.milli).toBe(31111);
    expect(s.restDays).toBe(6);
    // Coconut: 1 of 2 → 12500
    expect(s.categories.coconut.milli).toBe(12500);
    // Apple: Mon, Wed, Thu (exactly 7500), Sat → 4 of 5 → 12000
    expect(s.categories.apple).toMatchObject({ actual: 4, milli: 12000 });
    // Pear: 11 of 15 → floor(25000 × 11 / 15) = 18333
    expect(s.categories.pear).toMatchObject({ actual: 11, milli: 18333 });
    // 31111 + 12500 + 12000 + 18333 = 73944 → 73
    expect(s.score).toBe(73);
    expect(s.dataDays).toBe(7); // Sunday has exerciseMin 0 (non-null) even without steps
  });
});

describe('scoreWeek: peach', () => {
  it('daily cap = min(90, max(60, ½ weekly target))', () => {
    const big = [200, 0, 0, 0, 0, 0, 0];
    expect(scoreWeek(input({ days: days(WK, big, []) })).categories.peach.actual).toBe(67.5); // A 135 → 67.5
    expect(scoreWeek(input({ targets: B, days: days(WK, big, []) })).categories.peach.actual).toBe(60); // B 85 → 60
    expect(scoreWeek(input({ targets: { ...A, activeMinPerWeek: 150 }, days: days(WK, big, []) })).categories.peach.actual).toBe(75);
    expect(scoreWeek(input({ targets: { ...A, activeMinPerWeek: 300 }, days: days(WK, big, []) })).categories.peach.actual).toBe(90);
  });
  it('the cap uses the un-prorated weekly target', () => {
    const s = scoreWeek(input({ days: days(WK, [200], []), cozyDays: ['2026-11-07', '2026-11-08'] }));
    expect(s.categories.peach.actual).toBe(67.5);
  });
  it('rest day: hard = ≥ 20 min at ≥ 77% of 220 − age; null HR is not hard', () => {
    const d = weekDays(WK);
    const withData = days(WK, Array(7).fill(0), Array(7).fill(1000));
    // age 29 → 0.77 × 191 = 147.07
    const hardEveryDay = d.map((x) => workout(x, 'Running', 30, 160));
    expect(scoreWeek(input({ days: withData, workouts: hardEveryDay })).restDays).toBe(0);
    expect(scoreWeek(input({ days: withData, workouts: hardEveryDay })).categories.peach.milli).toBe(0);
    expect(scoreWeek(input({ days: withData, workouts: d.map((x) => workout(x, 'Running', 30, 147)) })).restDays).toBe(7);
    expect(scoreWeek(input({ days: withData, workouts: d.map((x) => workout(x, 'Running', 30, 147.1)) })).restDays).toBe(0);
    expect(scoreWeek(input({ days: withData, workouts: d.map((x) => workout(x, 'Running', 19, 180)) })).restDays).toBe(7);
    expect(scoreWeek(input({ days: withData, workouts: d.map((x) => workout(x, 'Running', 44, null)) })).restDays).toBe(7);
    // ≥ 45 min is a long workout: not a rest day even without HR
    expect(scoreWeek(input({ days: withData, workouts: d.map((x) => workout(x, 'Running', 45, null)) })).restDays).toBe(0);
  });
  it('rest threshold scales with age', () => {
    const d = weekDays(WK);
    const withData = days(WK, Array(7).fill(0), Array(7).fill(1000));
    // age 40 → 0.77 × 180 = 138.6
    expect(scoreWeek(input({ age: 40, days: withData, workouts: d.map((x) => workout(x, 'Running', 30, 138)) })).restDays).toBe(7);
    expect(scoreWeek(input({ age: 40, days: withData, workouts: d.map((x) => workout(x, 'Running', 30, 139)) })).restDays).toBe(0);
  });
  it('a cozy day counts as rest even with a hard workout', () => {
    const d = weekDays(WK);
    const s = scoreWeek(input({ workouts: d.map((x) => workout(x, 'Running', 30, 170)), cozyDays: [d[6]] }));
    expect(s.restDays).toBe(1);
    expect(s.categories.peach.milli).toBe(5000); // active minutes come from day metrics (none here), not workouts
  });
  it('rest days only cover dates passed in (week so far)', () => {
    const d = weekDays(WK);
    const s = scoreWeek(input({ days: days(WK, [], []).slice(0, 2), workouts: [workout(d[0], 'Running', 30, 170), workout(d[1], 'Running', 30, 170)] }));
    expect(s.restDays).toBe(0);
  });
});

describe('scoreWeek: coconut', () => {
  const d = weekDays(WK);
  const strength = (ws: Workout[] = [], vs: Visit[] = []) => scoreWeek(input({ workouts: ws, visits: vs }));
  it('auto types ≥ 15 min count; shorter do not', () => {
    expect(strength([workout(d[0], 'Pilates', 15)]).strengthDays).toEqual([d[0]]);
    expect(strength([workout(d[0], 'Pilates', 14)]).strengthDays).toEqual([]);
    // Core Training is an ask type: a 15-min plank set isn't a full session unless confirmed
    expect(strength([workout(d[0], 'Core Training', 30)]).strengthDays).toEqual([]);
    expect(strength([workout(d[0], 'Core Training', 30, null, true)]).strengthDays).toEqual([d[0]]);
    expect(strength([workout(d[0], 'Running', 60)]).strengthDays).toEqual([]);
  });
  it('ask types count only when includesStrength === true', () => {
    expect(strength([workout(d[0], 'Yoga', 30, null, true)]).strengthDays).toEqual([d[0]]);
    expect(strength([workout(d[0], 'Yoga', 30, null, false)]).strengthDays).toEqual([]);
    expect(strength([workout(d[0], 'High Intensity Interval Training', 14, null, true)]).strengthDays).toEqual([]);
    expect(strength([workout(d[0], 'Running', 30, null, true)]).strengthDays).toEqual([]);
  });
  it('visits: ≥ 30 min and autoStrength or confirmed', () => {
    expect(strength([], [visit(d[0], 30, true)]).strengthDays).toEqual([d[0]]);
    expect(strength([], [visit(d[0], 29, true)]).strengthDays).toEqual([]);
    expect(strength([], [visit(d[0], 60, false, true)]).strengthDays).toEqual([d[0]]);
    expect(strength([], [visit(d[0], 60, false, null)]).strengthDays).toEqual([]);
    expect(strength([], [visit(d[0], 60, false, false)]).strengthDays).toEqual([]);
  });
  it('max one strength day per date; pay capped at target', () => {
    const s = strength([workout(d[0], 'Pilates', 30), workout(d[0], 'Core Training', 30)], [visit(d[0], 60, true)]);
    expect(s.strengthDays).toEqual([d[0]]);
    expect(s.categories.coconut.milli).toBe(12500);
    const many = strength(d.map((x) => workout(x, 'Pilates', 30)));
    expect(many.categories.coconut).toMatchObject({ milli: 25000, actual: 7 });
  });
  it('ignores activity outside the week', () => {
    expect(strength([workout('2026-11-01', 'Pilates', 30), workout('2026-11-09', 'Pilates', 30)]).strengthDays).toEqual([]);
  });
});

describe('scoreWeek: apple', () => {
  it('step goal is inclusive; null steps never count', () => {
    const s = scoreWeek(input({ days: days(WK, [], [7500, 7499, null, 0, 20000]) }));
    expect(s.categories.apple.actual).toBe(2);
    expect(s.categories.apple.milli).toBe(6000);
  });
  it('tsuyu: ≥ 30 active min also counts (Jun 1–Jul 20 only)', () => {
    const june = '2027-06-07';
    const s = scoreWeek(input({ weekKey: june, days: days(june, [30, 29, 30, 30, 30, 0, 0], [1000, 1000, 9000, 1000, 1000]) }));
    expect(s.categories.apple.actual).toBe(4);
    const edge = '2027-07-19'; // Mon 19, Tue 20, Wed 21
    expect(scoreWeek(input({ weekKey: edge, days: days(edge, [30, 30, 30, 30], []) })).categories.apple.actual).toBe(2);
    const may = '2027-05-24'; // May 24–30
    expect(scoreWeek(input({ weekKey: may, days: days(may, [60, 60, 60], []) })).categories.apple.actual).toBe(0);
    const startEdge = '2027-05-31'; // Mon May 31, Tue Jun 1
    expect(scoreWeek(input({ weekKey: startEdge, days: days(startEdge, [30, 30], []) })).categories.apple.actual).toBe(1);
  });
});

describe('scoreWeek: pear', () => {
  const d = weekDays(WK);
  it('counts distinct ticks of the 3 habits only', () => {
    const s = scoreWeek(input({
      checkins: [...ticks(d[0], ['teishoku_lunch', 'teishoku_lunch', 'eat_lunch', 'snack_swap']), ...ticks(d[1], ['veg_two_meals'])]
    }));
    expect(s.categories.pear.actual).toBe(2);
    expect(s.categories.pear.milli).toBe(Math.floor((25000 * 2) / 15));
  });
  it('ticks above target pay the max', () => {
    const s = scoreWeek(input({ checkins: d.flatMap((x) => ticks(x, [...A.habits])) }));
    expect(s.categories.pear).toMatchObject({ actual: 21, milli: 25000 });
  });
});

describe('scoreWeek: Cozy Day prorating (exact fractions)', () => {
  const d = weekDays(WK);
  const base = (cozyDays: string[]) => input({
    days: days(WK, [50, 50, 0, 0, 0, 0, 0], [9000, 9000, 9000, 9000, 0, 0, 0]),
    workouts: [workout(d[0], 'Pilates', 30)],
    checkins: [...ticks(d[0], [...A.habits]), ...ticks(d[1], [...A.habits]), ...ticks(d[2], [...A.habits]), ...ticks(d[3], [...A.habits])],
    cozyDays
  });
  it('1 cozy day → targets × 6/7', () => {
    const s = scoreWeek(base([d[6]]));
    expect(s.categories.peach.target).toBeCloseTo((135 * 6) / 7, 10);
    expect(s.categories.coconut.target).toBeCloseTo(12 / 7, 10);
    expect(s.categories.apple.target).toBeCloseTo(30 / 7, 10);
    expect(s.categories.pear.target).toBeCloseTo(90 / 7, 10);
    expect(s.categories.peach.milli).toBe(Math.floor((30000 * 100 * 7) / (135 * 6)) + 5000); // 25925 + 5000
    expect(s.categories.coconut.milli).toBe(14583); // 25000 × 7/12
    expect(s.categories.apple.milli).toBe(14000); // 15000 × 28/30
    expect(s.categories.pear.milli).toBe(23333); // 25000 × 84/90
  });
  it('2 cozy days → × 5/7', () => {
    const s = scoreWeek(base([d[5], d[6]]));
    expect(s.categories.peach.milli).toBe(35000); // 100 ≥ 96.43
    expect(s.categories.coconut.milli).toBe(17500); // 25000 × 7/10
    expect(s.categories.apple.milli).toBe(15000); // 4 ≥ 3.57
  });
  it('3 cozy days → × 4/7', () => {
    expect(scoreWeek(base([d[4], d[5], d[6]])).categories.coconut.milli).toBe(21875); // 25000 × 7/8
  });
  it('4 cozy days → only the first 3 count (× 4/7)', () => {
    const s = scoreWeek(base([d[3], d[4], d[5], d[6]]));
    expect(s.categories.coconut).toMatchObject({ milli: 21875 });
    expect(s.categories.coconut.target).toBeCloseTo(8 / 7, 10);
  });
  it('cozy days outside the week are ignored; duplicates count once', () => {
    expect(scoreWeek(base(['2026-11-09', d[6], d[6]])).categories.coconut.milli).toBe(14583);
  });
  it('a week can never be fully excused: 7 cozy days count as 3', () => {
    // Weeks spanning two months could otherwise hold 7 (review round 3, F1).
    expect(scoreWeek(input({ cozyDays: d })).score).toBe(5);
  });
});

describe('scoreWeek: 正月 holiday', () => {
  it('Pear ignores Dec 29–Jan 3 and prorates the target to the remaining days', () => {
    const wk = '2026-12-28';
    const d = weekDays(wk);
    const t = targetsFor('B', wk);
    const s = scoreWeek(input({ person: 'B', weekKey: wk, targets: t, checkins: [...ticks(d[0], ['eat_lunch', 'snack_swap']), ...ticks(d[2], [...t.habits])] }));
    expect(s.categories.pear.actual).toBe(2);
    expect(s.categories.pear.target).toBeCloseTo(15 / 7, 10);
    expect(s.categories.pear.milli).toBe(23333); // 25000 × 2 × 7 / 15
  });
  it('a cozy Dec 28 leaves no pear days → full pear', () => {
    const wk = '2026-12-28';
    const s = scoreWeek(input({ weekKey: wk, targets: targetsFor('A', wk), cozyDays: [wk] }));
    expect(s.categories.pear).toMatchObject({ milli: 25000, target: 0 });
  });
  it('easy-week targets ×0.7 apply to Peach/Coconut/Apple', () => {
    const wk = '2026-12-21';
    const d = weekDays(wk);
    const s = scoreWeek(input({ weekKey: wk, targets: targetsFor('B', wk), days: days(wk, [], [7000, 7000, 7000]), workouts: [workout(d[0], 'Pilates', 30)] }));
    expect(s.categories.coconut.target).toBe(1.4);
    expect(s.categories.coconut.milli).toBe(Math.floor((25000 * 1000) / 1400)); // 17857
    expect(s.categories.apple.milli).toBe(Math.floor((15000 * 3) / 3.5)); // 12857
    expect(s.categories.peach.target).toBe(59.5);
    // Dec 21–27: no pear-off days
    expect(s.categories.pear.target).toBe(15);
  });
});

describe('scoreWeek: calibration', () => {
  it('pays the flat score with ≥ 6 data days, still filling categories', () => {
    const s = scoreWeek(input({ calibration: true, days: days(WK, [0, 0, 0, null, 0, 0, null], [null, null, null, 100, 0, 0, null]) }));
    expect(s.dataDays).toBe(6);
    expect(s.score).toBe(60);
    expect(s.categories.peach.milli).toBe(5000);
  });
  it('pays 0 with fewer data days, even for a perfect-looking week', () => {
    const p = perfect();
    const s = scoreWeek({ ...p, calibration: true, days: p.days.map((x, i) => (i < 2 ? { ...x, steps: null, exerciseMin: null } : x)) });
    expect(s.dataDays).toBe(5);
    expect(s.score).toBe(0);
    expect(s.categories.pear.milli).toBe(25000);
  });
  it('calibration pays 60 even when the computed score is higher', () => {
    expect(scoreWeek({ ...perfect(), calibration: true }).score).toBe(60);
  });
});

