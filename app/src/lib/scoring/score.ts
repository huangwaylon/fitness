// Weekly score: four fruits, integer milli-fruit per category, score = floor(sum / 1000) (ADR 0009, 0011, 0014).
import { CALIBRATION, DAILY, HOLIDAY, PEACH_DAILY_CAP, REST, STRENGTH, TSUYU } from '#lib/config/rules.ts';
import type { CategoryResult, FruitKey, LocalDate, WeekInput, WeekScore, Workout } from '#lib/types.ts';
import { activeMilliOfDay, manualMinutesByDay, strengthDaysOf, toMilli } from '#lib/scoring/bells.ts';
import { inMonthDayRange, weekDays } from '#lib/time/dates.ts';
import { rulesFor } from '#lib/scoring/targets.ts';

/** Exact floor(a / b) for non-negative integers. */
const idiv = (a: number, b: number): number => (a - (a % b)) / b;

/**
 * Linear partial credit, capped at the target. With `days` < 7 the target is prorated to `weeklyTargetMilli × days / 7`
 * (only Pear over 正月 pear-off days), so ratio = actualMilli × 7 / (weeklyTargetMilli × days), all in integers.
 * A zero target pays in full.
 */
export function ratioMilli(maxMilli: number, actualMilli: number, weeklyTargetMilli: number, days = 7): number {
  const den = weeklyTargetMilli * days;
  if (den <= 0) return maxMilli;
  const num = actualMilli * 7;
  if (num >= den) return maxMilli;
  return idiv(maxMilli * num, den);
}

/**
 * Score one person's week.
 *
 * Judgement calls (documented for the model and UI):
 * - A rest day is a day with Health data and no strength day, no long workout and no hard workout. A week with no
 *   data has no rest days, so it scores 0. There is no excused-day mechanism: a sick week simply scores lower.
 * - Targets are weekly and never prorated, except Pear over 正月 pear-off days.
 * - `actual` is the counted amount after per-day caps (daily minute cap, 1 strength day/day, 3 ticks/day), not
 *   clipped to the target; the pay itself is capped at the target.
 */
export function scoreWeek(input: WeekInput): WeekScore {
  const { targets } = input;
  const points = rulesFor(input.weekKey).points;
  const week = weekDays(input.weekKey);
  const inWeek = new Set(week);
  const isPearOff = (d: LocalDate) => inMonthDayRange(d, HOLIDAY.pearOff.from, HOLIDAY.pearOff.to);
  const pearDays = week.filter((d) => !isPearOff(d)).length;

  // One metrics row per date in the week (first wins if duplicated).
  const dayRows = new Map<LocalDate, WeekInput['days'][number]>();
  for (const d of input.days) if (inWeek.has(d.date) && !dayRows.has(d.date)) dayRows.set(d.date, d);
  const days = [...dayRows.values()];
  const dataRows = days.filter((d) => d.steps !== null || d.exerciseMin !== null);
  const workouts = input.workouts.filter((w) => inWeek.has(w.date));
  const visits = input.visits.filter((v) => inWeek.has(v.date));

  // 🥥 Coconut: strength days (max 1 per day).
  const strengthSet = strengthDaysOf(workouts, visits);
  const strengthDays = [...strengthSet].sort();
  const strengthTargetMilli = toMilli(targets.strengthDaysPerWeek);
  const coconutMilli = ratioMilli(points.coconut * 1000, strengthDays.length * 1000, strengthTargetMilli);

  // 🍑 Peach: active minutes with a daily cap, plus a rest-day bonus. A day's minutes are the largest of the Watch's
  // exercise minutes, the steps over the goal (STEP_MINUTES pace) and the workouts added by hand in きろく, so nothing
  // counts twice (ADR 0011).
  const activeTargetMilli = toMilli(targets.activeMinPerWeek);
  const capMilli = Math.min(PEACH_DAILY_CAP.maxMin * 1000, Math.max(PEACH_DAILY_CAP.minMin * 1000, Math.floor(activeTargetMilli / 2)));
  const manualMin = manualMinutesByDay(workouts);
  let activeMilli = 0;
  for (const d of days) {
    activeMilli += Math.min(activeMilliOfDay(d.steps, d.exerciseMin, manualMin.get(d.date) ?? 0, targets.stepGoal), capMilli);
  }
  const maxHr = 220 - input.age;
  const hardHrPermille = Math.round(REST.hardHrFraction * 1000);
  const isHard = (w: Workout): boolean =>
    w.durationMin >= REST.hardWorkoutMin && w.avgHr !== null && w.avgHr * 1000 >= hardHrPermille * maxHr;
  const busyDates = new Set([
    ...workouts.filter((w) => isHard(w) || w.durationMin >= REST.longWorkoutMin).map((w) => w.date),
    ...strengthSet,
    // Any gym visit makes a busy day, even one not (yet) confirmed as strength (round 4 review W7).
    ...visits.filter((v) => v.dwellMin >= STRENGTH.minVisitMin).map((v) => v.date)
  ]);
  // Only days with Health data can be rest days, so an empty (or future) day never pays.
  const restDays = dataRows.filter((d) => !busyDates.has(d.date)).length;
  const peachMax = (points.peachActive + points.peachRest) * 1000;
  const peachMilli = ratioMilli(points.peachActive * 1000, activeMilli, activeTargetMilli) + (restDays >= 1 ? points.peachRest * 1000 : 0);

  // 🍎 Apple: step-goal days (in tsuyu, ≥ 30 active minutes also counts).
  let stepDays = 0;
  for (const d of days) {
    const stepsOk = d.steps !== null && d.steps >= targets.stepGoal;
    const tsuyuOk = inMonthDayRange(d.date, TSUYU.from, TSUYU.to) && d.exerciseMin !== null && d.exerciseMin >= TSUYU.exerciseMin;
    if (stepsOk || tsuyuOk) stepDays++;
  }
  const stepTargetMilli = toMilli(targets.stepDaysPerWeek);
  const appleMilli = ratioMilli(points.apple * 1000, stepDays * 1000, stepTargetMilli);

  // 🍐 Pear: distinct ticks of the person's 3 habits, max 3/day, not on 正月 pear-off days.
  const habits = new Set(targets.habits);
  const ticksByDay = new Map<LocalDate, Set<string>>();
  for (const c of input.checkins) {
    if (!inWeek.has(c.date) || isPearOff(c.date) || !habits.has(c.habit)) continue;
    if (!ticksByDay.has(c.date)) ticksByDay.set(c.date, new Set());
    ticksByDay.get(c.date)!.add(c.habit);
  }
  let ticks = 0;
  for (const s of ticksByDay.values()) ticks += Math.min(DAILY.maxTicks, s.size);
  const pearTargetMilli = toMilli(targets.pearTicksPerWeek);
  const pearMilli = ratioMilli(points.pear * 1000, ticks * 1000, pearTargetMilli, pearDays);

  const categories: Record<FruitKey, CategoryResult> = {
    peach: { key: 'peach', milli: peachMilli, maxMilli: peachMax, actual: activeMilli / 1000, target: targets.activeMinPerWeek },
    coconut: { key: 'coconut', milli: coconutMilli, maxMilli: points.coconut * 1000, actual: strengthDays.length, target: targets.strengthDaysPerWeek },
    apple: { key: 'apple', milli: appleMilli, maxMilli: points.apple * 1000, actual: stepDays, target: targets.stepDaysPerWeek },
    pear: { key: 'pear', milli: pearMilli, maxMilli: points.pear * 1000, actual: ticks, target: (pearTargetMilli * pearDays) / 7000 }
  };

  const dataDays = dataRows.length;
  const sum = peachMilli + coconutMilli + appleMilli + pearMilli;
  const score = input.calibration
    ? dataDays >= CALIBRATION.minDataDays ? CALIBRATION.flatScore : 0
    : Math.floor(sum / 1000);

  return { person: input.person, weekKey: input.weekKey, score, categories, restDays, strengthDays, dataDays };
}
