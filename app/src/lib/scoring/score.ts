// Weekly score: four fruits, integer milli-fruit per category, score = floor(sum / 1000) (ADR 0009, 0011).
import { CALIBRATION, HOLIDAY, PEACH_DAILY_CAP, POINTS, REST, STRENGTH, TSUYU } from '#lib/config/rules.ts';
import type { CategoryResult, FruitKey, LocalDate, WeekInput, WeekScore } from '#lib/types.ts';
import { inMonthDayRange, weekDays } from '#lib/scoring/dates.ts';

/** Convert a (possibly fractional) count to integer milli-units. Targets are pre-rounded to 3 dp by targetsFor. */
const toMilli = (x: number): number => Math.round(x * 1000);

/** Exact floor(a / b) for non-negative integers. */
const idiv = (a: number, b: number): number => (a - (a % b)) / b;

/**
 * Linear partial credit, capped at the target. The prorated target is `weeklyTargetMilli × eligibleDays / 7`, so
 * ratio = actualMilli × 7 / (weeklyTargetMilli × eligibleDays), all in integers. A zero target pays in full.
 */
export function ratioMilli(maxMilli: number, actualMilli: number, weeklyTargetMilli: number, eligibleDays: number): number {
  const den = weeklyTargetMilli * eligibleDays;
  if (den <= 0) return maxMilli;
  const num = actualMilli * 7;
  if (num >= den) return maxMilli;
  return idiv(maxMilli * num, den);
}

export const isStrengthWorkout = (w: WeekInput['workouts'][number]): boolean =>
  w.durationMin >= STRENGTH.minWorkoutMin &&
  ((STRENGTH.autoTypes as readonly string[]).includes(w.type) ||
    ((STRENGTH.askTypes as readonly string[]).includes(w.type) && w.includesStrength === true));

export const isStrengthVisit = (v: WeekInput['visits'][number]): boolean =>
  v.dwellMin >= STRENGTH.minVisitMin && (v.autoStrength || v.confirmed === true);

/**
 * Score one person's week.
 *
 * Judgement calls (documented for the server/UI):
 * - Rest days are evaluated over the dates present in `input.days` (the caller passes the week so far, or all 7
 *   days). A day with no hard workout counts as rest, so a not-yet-elapsed day passed in will count as rest.
 * - Cozy days shrink every target by exact fractions; activity logged on a cozy day still counts.
 * - `actual` is the counted amount after per-day caps (daily minute cap, 1 strength day/day, 3 ticks/day), not
 *   clipped to the target; the pay itself is capped at the target.
 */
export function scoreWeek(input: WeekInput): WeekScore {
  const { targets } = input;
  const week = weekDays(input.weekKey);
  const inWeek = new Set(week);
  const cozy = new Set(input.cozyDays.filter((d) => inWeek.has(d)));
  const eligibleDays = 7 - cozy.size;
  const pearDays = week.filter((d) => !cozy.has(d) && !inMonthDayRange(d, HOLIDAY.pearOff.from, HOLIDAY.pearOff.to));
  const pearOffDays = new Set(week.filter((d) => inMonthDayRange(d, HOLIDAY.pearOff.from, HOLIDAY.pearOff.to)));

  // One metrics row per date in the week (first wins if duplicated).
  const dayRows = new Map<LocalDate, WeekInput['days'][number]>();
  for (const d of input.days) if (inWeek.has(d.date) && !dayRows.has(d.date)) dayRows.set(d.date, d);
  const workouts = input.workouts.filter((w) => inWeek.has(w.date));
  const visits = input.visits.filter((v) => inWeek.has(v.date));

  // 🍑 Peach: active minutes with a daily cap, plus a rest-day bonus.
  const activeTargetMilli = toMilli(targets.activeMinPerWeek);
  const capMilli = Math.min(PEACH_DAILY_CAP.maxMin * 1000, Math.max(PEACH_DAILY_CAP.minMin * 1000, Math.floor(activeTargetMilli / 2)));
  let activeMilli = 0;
  for (const d of dayRows.values()) activeMilli += Math.min(Math.max(0, toMilli(d.exerciseMin ?? 0)), capMilli);
  const maxHr = 220 - input.age;
  const hardHrPermille = Math.round(REST.hardHrFraction * 1000);
  const isHard = (w: WeekInput['workouts'][number]): boolean =>
    w.durationMin >= REST.hardWorkoutMin && w.avgHr !== null && w.avgHr * 1000 >= hardHrPermille * maxHr;
  const hardDates = new Set(workouts.filter(isHard).map((w) => w.date));
  const restDays = [...dayRows.keys()].filter((d) => cozy.has(d) || !hardDates.has(d)).length +
    [...cozy].filter((d) => !dayRows.has(d)).length;
  const peachMax = (POINTS.peachActive + POINTS.peachRest) * 1000;
  const peachMilli =
    ratioMilli(POINTS.peachActive * 1000, activeMilli, activeTargetMilli, eligibleDays) + (restDays >= 1 ? POINTS.peachRest * 1000 : 0);

  // 🥥 Coconut: strength days (max 1 per day).
  const strengthSet = new Set<LocalDate>();
  for (const w of workouts) if (isStrengthWorkout(w)) strengthSet.add(w.date);
  for (const v of visits) if (isStrengthVisit(v)) strengthSet.add(v.date);
  const strengthDays = [...strengthSet].sort();
  const strengthTargetMilli = toMilli(targets.strengthDaysPerWeek);
  const coconutMilli = ratioMilli(POINTS.coconut * 1000, strengthDays.length * 1000, strengthTargetMilli, eligibleDays);

  // 🍎 Apple: step-goal days (in tsuyu, ≥ 30 active minutes also counts).
  let stepDays = 0;
  for (const d of dayRows.values()) {
    const stepsOk = d.steps !== null && d.steps >= targets.stepGoal;
    const tsuyuOk = inMonthDayRange(d.date, TSUYU.from, TSUYU.to) && d.exerciseMin !== null && d.exerciseMin >= TSUYU.exerciseMin;
    if (stepsOk || tsuyuOk) stepDays++;
  }
  const stepTargetMilli = toMilli(targets.stepDaysPerWeek);
  const appleMilli = ratioMilli(POINTS.apple * 1000, stepDays * 1000, stepTargetMilli, eligibleDays);

  // 🍐 Pear: distinct ticks of the person's 3 habits, max 3/day, not on 正月 pear-off days.
  const habits = new Set(targets.habits);
  const ticksByDay = new Map<LocalDate, Set<string>>();
  for (const c of input.checkins) {
    if (!inWeek.has(c.date) || pearOffDays.has(c.date) || !habits.has(c.habitKey)) continue;
    if (!ticksByDay.has(c.date)) ticksByDay.set(c.date, new Set());
    ticksByDay.get(c.date)!.add(c.habitKey);
  }
  let ticks = 0;
  for (const s of ticksByDay.values()) ticks += Math.min(3, s.size);
  const pearTargetMilli = toMilli(targets.pearTicksPerWeek);
  const pearMilli = ratioMilli(POINTS.pear * 1000, ticks * 1000, pearTargetMilli, pearDays.length);

  const prorated = (weeklyMilli: number, days: number): number => (weeklyMilli * days) / 7000;
  const categories: Record<FruitKey, CategoryResult> = {
    peach: { key: 'peach', milli: peachMilli, maxMilli: peachMax, actual: activeMilli / 1000, target: prorated(activeTargetMilli, eligibleDays) },
    coconut: { key: 'coconut', milli: coconutMilli, maxMilli: POINTS.coconut * 1000, actual: strengthDays.length, target: prorated(strengthTargetMilli, eligibleDays) },
    apple: { key: 'apple', milli: appleMilli, maxMilli: POINTS.apple * 1000, actual: stepDays, target: prorated(stepTargetMilli, eligibleDays) },
    pear: { key: 'pear', milli: pearMilli, maxMilli: POINTS.pear * 1000, actual: ticks, target: prorated(pearTargetMilli, pearDays.length) }
  };

  const dataDays = [...dayRows.values()].filter((d) => d.steps !== null || d.exerciseMin !== null).length;
  const sum = peachMilli + coconutMilli + appleMilli + pearMilli;
  const score = input.calibration
    ? dataDays >= CALIBRATION.minDataDays ? CALIBRATION.flatScore : 0
    : Math.floor(sum / 1000);

  return { person: input.person, weekKey: input.weekKey, score, categories, restDays, strengthDays, dataDays };
}
