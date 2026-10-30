// ADR 0019: ベル per day, weekly badges, the ふたりボーナス and the pot split.
import { describe, expect, it } from 'vitest';
import type { CheckinTick, DayMetrics, Visit, Workout } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { POTS, RULES } from '#lib/config/rules.ts';
import { duoBonus, earnWeek, splitPots, type EarnInput } from './bells.ts';

const WK = '2026-11-02';
const D = weekDays(WK);
const HABITS = ['protein_each_meal', 'no_sweets', 'veg_two_meals'];

let n = 0;
const workout = (date: string, type: string, durationMin: number, extra: Partial<Workout> = {}): Workout => ({
  id: `w${n++}`, date, type, startAt: `${date}T07:00:00+09:00`, endAt: `${date}T08:00:00+09:00`, durationMin, avgHr: null, includesStrength: null, ...extra
});
const visit = (date: string, time = '07:00'): Visit => ({ placeKey: 'anytime', date, arriveAt: `${date}T${time}:00+09:00` });
const ticks = (date: string, keys: string[] = HABITS): CheckinTick[] => keys.map((habit) => ({ date, habit }));
const days = (wk: string, ex: (number | null)[], st: (number | null)[]): DayMetrics[] =>
  weekDays(wk).map((date, i) => ({ date, exerciseMin: ex[i] ?? null, steps: st[i] ?? null }));

function input(p: Partial<EarnInput> = {}): EarnInput {
  const weekKey = p.weekKey ?? WK;
  return { person: 'A', weekKey, habits: HABITS, days: days(weekKey, [], []), workouts: [], visits: [], checkins: [], ...p };
}
const day0 = (p: Partial<EarnInput>) => earnWeek(input(p)).days[0];

/** Every badge and every daily maximum, every day. */
function perfect(weekKey = WK): EarnInput {
  const d = weekDays(weekKey);
  return input({
    weekKey,
    days: days(weekKey, Array(7).fill(60), Array(7).fill(9000)),
    workouts: d.map((x) => workout(x, 'Traditional Strength Training', 40)),
    checkins: d.flatMap((x) => ticks(x))
  });
}

describe('earnWeek: the daily table (ADR 0019 §3)', () => {
  it('a perfect day is 225 + 200 + 400 + 300 = 1,125 ベル, split per fruit', () => {
    const d = earnWeek(perfect()).days[0];
    expect(d.parts).toEqual({ peach: 225, apple: 200, coconut: 400, pear: 300 });
    expect(d.bells).toBe(1125);
    expect(earnWeek(perfect()).daily).toBe(7 * 1125);
  });

  it('an empty day earns nothing', () => {
    expect(day0({})).toMatchObject({ bells: 0, minutes: 0, steps: null, activeMet: false, stepMet: false, strength: false, ticks: 0 });
  });

  it('🍑 5 per whole counted minute, capped at 45 minutes', () => {
    const peach = (ex: number) => day0({ days: days(WK, [ex], []) }).parts.peach;
    expect(peach(1)).toBe(5);
    expect(peach(44)).toBe(220);
    expect(peach(45)).toBe(225);
    expect(peach(200)).toBe(225);
    expect(day0({ days: days(WK, [200], []) }).minutes).toBe(200); // counted minutes are reported uncapped
  });

  it('🍑 minutes are max(Watch, (steps − 8,000) / 100, manual workouts), never a sum', () => {
    const manual = (min: number) => workout(D[0], 'Pilates', min, { manual: true });
    const mins = (ex: number | null, st: number | null, w: Workout[] = []) => day0({ days: days(WK, [ex], [st]), workouts: w }).minutes;
    expect(mins(30, 12000)).toBe(40); // steps: (12,000 − 8,000) / 100 = 40 beats Watch 30
    expect(mins(30, 10000)).toBe(30); // Watch 30 beats steps 20
    expect(mins(30, 10000, [manual(20), manual(15)])).toBe(35); // manual workouts of a day add up, then max
    expect(mins(30, null, [manual(20)])).toBe(30);
    expect(mins(null, 8050)).toBe(0); // 0.5 step-minutes floor to 0
    expect(mins(10, null, [workout(D[0], 'Pilates', 45)])).toBe(10); // a Watch workout is already in its minutes
    expect(day0({ days: days(WK, [null], [12550]) }).parts.peach).toBe(225); // 45.5 min → 45 (capped)
    expect(day0({ days: days(WK, [null], [11999]) }).parts.peach).toBe(195); // 39.99 → 39
  });

  it('🍎 200 at 8,000 steps (inclusive); null steps never count', () => {
    const apple = (st: number | null) => day0({ days: days(WK, [], [st]) }).parts.apple;
    expect(apple(7999)).toBe(0);
    expect(apple(8000)).toBe(200);
    expect(apple(30000)).toBe(200);
    expect(apple(null)).toBe(0);
  });

  it('🍎 tsuyu (Jun 1–Jul 20): 30 counted active minutes also earn the step reward', () => {
    const june = '2027-06-07';
    const apple = (wk: string, i: number, ex: number, extra: Workout[] = []) =>
      earnWeek(input({ weekKey: wk, days: days(wk, Array(7).fill(ex), Array(7).fill(1000)), workouts: extra })).days[i].parts.apple;
    expect(apple(june, 0, 30)).toBe(200);
    expect(apple(june, 0, 29)).toBe(0);
    expect(apple(june, 0, 0, [workout('2027-06-07', 'Yoga', 30, { manual: true })])).toBe(200); // a hand-added workout counts
    expect(apple('2027-07-19', 1, 30)).toBe(200); // Tue Jul 20: last day
    expect(apple('2027-07-19', 2, 30)).toBe(0); // Wed Jul 21
    expect(apple('2027-05-31', 0, 60)).toBe(0); // Mon May 31
    expect(apple('2027-05-31', 1, 30)).toBe(200); // Tue Jun 1
    expect(apple('2026-11-02', 0, 90)).toBe(0); // November
  });

  it('🥥 400 on a strength day, at most once a day', () => {
    const coconut = (w: Workout[], v: Visit[] = []) => day0({ workouts: w, visits: v }).parts.coconut;
    expect(coconut([workout(D[0], 'Pilates', 15)])).toBe(400);
    expect(coconut([workout(D[0], 'Pilates', 14)])).toBe(0);
    expect(coconut([workout(D[0], 'Pilates', 30), workout(D[0], 'Traditional Strength Training', 30)], [visit(D[0])])).toBe(400);
    expect(coconut([workout(D[0], 'Yoga', 30)])).toBe(0); // ask type, unanswered
    expect(coconut([workout(D[0], 'Yoga', 30, { includesStrength: true })])).toBe(400);
    expect(coconut([workout(D[0], 'Running', 30, { strengthOverride: true })])).toBe(400); // きろく override
    expect(coconut([workout(D[0], 'Pilates', 30, { strengthOverride: false })])).toBe(0);
    expect(coconut([], [visit(D[0])])).toBe(400); // a gym arrival alone, however short the stay
    expect(coconut([], [visit(D[0]), visit(D[0], '19:00')])).toBe(400); // two arrivals: still one strength day
  });

  it('🥥 every gym arrival day counts, with no weekly limit', () => {
    const e = earnWeek(input({ visits: D.slice(0, 5).map((d) => visit(d)), workouts: [workout(D[5], 'Pilates', 30)] }));
    expect(e.days.map((d) => d.strength)).toEqual([true, true, true, true, true, true, false]);
    expect(e.fruits.coconut.weekBells).toBe(2400);
  });

  it('🍐 100 per distinct tick of my 3 habits, max 3 a day', () => {
    const pear = (c: CheckinTick[]) => day0({ checkins: c }).parts.pear;
    expect(pear(ticks(D[0], ['no_sweets']))).toBe(100);
    expect(pear(ticks(D[0], ['no_sweets', 'no_sweets']))).toBe(100);
    expect(pear(ticks(D[0], ['no_sweets', 'eat_lunch']))).toBe(100); // not my habit
    expect(pear(ticks(D[0]))).toBe(300);
  });

  it('🍐 正月 pear-off days (Dec 29–Jan 3) earn no pear; the badge is prorated to the other days', () => {
    const wk = '2026-12-28'; // Mon Dec 28 is the only pear day
    const d = weekDays(wk);
    const e = earnWeek(input({ weekKey: wk, checkins: d.flatMap((x) => ticks(x)) }));
    expect(e.days.map((x) => x.parts.pear)).toEqual([300, 0, 0, 0, 0, 0, 0]);
    expect(e.fruits.pear).toMatchObject({ weekDays: 3, weekGoalDays: 3, badge: true }); // ceil(15 × 1 / 7)
    const wk2 = '2027-01-04'; // Mon Jan 4: back to normal
    expect(earnWeek(input({ weekKey: wk2 })).fruits.pear.weekGoalDays).toBe(15);
    const wk0 = '2026-12-21'; // no pear-off day; other activity unaffected by 正月 (no easy weeks any more)
    expect(earnWeek(input({ weekKey: wk0 })).fruits).toMatchObject({ pear: { weekGoalDays: 15 }, peach: { weekGoalDays: 5 }, apple: { weekGoalDays: 4 }, coconut: { weekGoalDays: 3 } });
  });

  it('only dates in the week count; the first metrics row of a date wins', () => {
    const e = earnWeek(input({
      days: [{ date: D[0], steps: 8000, exerciseMin: 0 }, { date: D[0], steps: 100, exerciseMin: 0 }, { date: '2026-11-09', steps: 9000, exerciseMin: 60 }],
      workouts: [workout('2026-11-01', 'Pilates', 30)],
      checkins: ticks('2026-11-09')
    }));
    expect(e.days[0].parts.apple).toBe(200);
    expect(e.daily).toBe(200);
  });
});

describe('earnWeek: weekly badges (ADR 0019 §4)', () => {
  it('🍑 45+ minutes on 5 days, 🍎 8,000 steps on 4 days, 🥥 3 strength days, 🍐 15 ticks', () => {
    const at = (k: number) => input({
      days: days(WK, Array(7).fill(0).map((_, i) => (i < k ? 45 : 44)), Array(7).fill(0).map((_, i) => (i < k - 1 ? 8000 : 7999))),
      workouts: D.slice(0, k - 2).map((d) => workout(d, 'Pilates', 30)),
      checkins: D.flatMap((d) => ticks(d)).slice(0, 10 + k)
    });
    const four = earnWeek(at(4)); // 4 active days, 3 step days, 2 strength days, 14 ticks
    expect(four.badges).toEqual({ peach: false, apple: false, coconut: false, pear: false });
    expect(four.bonus).toBe(0);
    const five = earnWeek(at(5)); // 5, 4, 3, 15: all four
    expect(five.badges).toEqual({ peach: true, apple: true, coconut: true, pear: true });
    expect(five.fruits.peach).toMatchObject({ weekDays: 5, weekGoalDays: 5, badge: true });
    expect(five.fruits.apple).toMatchObject({ weekDays: 4, weekGoalDays: 4 });
    expect(five.fruits.coconut).toMatchObject({ weekDays: 3, weekGoalDays: 3 });
    expect(five.fruits.pear).toMatchObject({ weekDays: 15, weekGoalDays: 15 });
    expect(five.bonus).toBe(2000);
    expect(five.allBadges).toBe(true);
  });

  it('+500 per badge; per-fruit week ベル are the daily parts', () => {
    const e = earnWeek(input({ days: days(WK, [60, 60, 60, 60, 60], []) }));
    expect(e.badges).toEqual({ peach: true, apple: false, coconut: false, pear: false });
    expect(e.bonus).toBe(500);
    expect(e.fruits.peach.weekBells).toBe(5 * 225);
    expect(e.daily).toBe(5 * 225);
  });

  it('the ふたりボーナス: +250 for each badge both people met', () => {
    const a = earnWeek(perfect());
    const b = earnWeek({ ...perfect(), person: 'B' });
    expect(duoBonus(a, b)).toBe(1000);
    const weak = earnWeek({ ...perfect(), person: 'B', checkins: [] });
    expect(weak.bonus).toBe(1500);
    expect(duoBonus(a, weak)).toBe(750); // one miss costs one share, never the lot
    expect(duoBonus(weak, weak)).toBe(750);
  });

  it('values come from the week’s rule version', () => {
    const v2 = { ...RULES[0], from: '2027-01-04', bells: { ...RULES[0].bells, perMinute: 10 }, badges: { ...RULES[0].badges, duoPerBadge: 500 } };
    (RULES as (typeof v2)[]).push(v2);
    try {
      expect(earnWeek(perfect()).days[0].parts.peach).toBe(225);
      expect(earnWeek(perfect('2027-01-04')).days[0].parts.peach).toBe(450);
      expect(duoBonus(earnWeek(perfect('2027-01-04')), earnWeek({ ...perfect('2027-01-04'), person: 'B' }))).toBe(2000);
    } finally {
      (RULES as unknown[]).pop();
    }
  });
});

describe('splitPots: 20% おやつ / 80% 旅 on totals', () => {
  it('treats = floor(total × 0.2), trips = the rest: nothing lost to rounding', () => {
    expect(splitPots(0)).toEqual({ treat: 0, trip: 0 });
    expect(splitPots(1)).toEqual({ treat: 0, trip: 1 });
    expect(splitPots(4)).toEqual({ treat: 0, trip: 4 });
    expect(splitPots(5)).toEqual({ treat: 1, trip: 4 });
    expect(splitPots(10)).toEqual({ treat: 2, trip: 8 });
    expect(splitPots(1125)).toEqual({ treat: 225, trip: 900 });
    for (const t of [7, 99, 12345, 9_999_999]) {
      const s = splitPots(t);
      expect(s.treat + s.trip).toBe(t);
      expect(s.treat).toBe(Math.floor((t * POTS.treatPercent) / 100));
    }
  });
});

describe('ADR 0019 amendment: the headline number', () => {
  it('a minimum on-target week is 14,250 ベル for the two of them', () => {
    // Each person exactly at every badge line and no more: 45 min on 5 days, 8,000 steps on 4, strength on 3, 15 ticks
    // (5 days × 3). Daily 5×225 + 4×200 + 3×400 + 15×100 = 4,625; badges 4 × 500 = 2,000; ふたりボーナス 4 × 250.
    const onTarget = (person: 'A' | 'B') => earnWeek(input({
      person,
      days: days(WK, [45, 45, 45, 45, 45], [8000, 8000, 8000, 8000]),
      workouts: D.slice(0, 3).map((x) => workout(x, 'Traditional Strength Training', 40)),
      checkins: D.slice(0, 5).flatMap((x) => ticks(x))
    }));
    const a = onTarget('A'), b = onTarget('B');
    expect(a.daily).toBe(4625);
    expect(a.bonus).toBe(2000);
    expect(a.allBadges).toBe(true);
    expect(duoBonus(a, b)).toBe(1000);
    expect(a.daily + a.bonus + b.daily + b.bonus + duoBonus(a, b)).toBe(14_250);
  });
});
