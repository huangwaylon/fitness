// Weekly score: four fruits, integer milli-fruit per category, score = floor(sum / 1000) (ADR 0009, 0011, 0014).
import { CALIBRATION, DAILY, HOLIDAY, PEACH_DAILY_CAP, REST, STEP_MINUTES, STRENGTH, TSUYU } from '#lib/config/rules.ts';
import type { CategoryResult, FruitKey, LocalDate, Visit, WeekInput, WeekScore, Workout } from '#lib/types.ts';
import { inMonthDayRange, weekDays } from '#lib/scoring/dates.ts';
import { rulesFor } from '#lib/scoring/targets.ts';

/** Convert a (possibly fractional) count to integer milli-units. Targets are pre-rounded to 3 dp by targetsFor. */
const toMilli = (x: number): number => Math.round(x * 1000);

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
 * Strength workout: at least STRENGTH.minWorkoutMin, and a きろく override if there is one (any type), else an auto
 * type, or an ask type answered "yes".
 */
export const isStrengthWorkout = (w: Pick<Workout, 'type' | 'durationMin' | 'includesStrength' | 'strengthOverride'>): boolean =>
  w.durationMin >= STRENGTH.minWorkoutMin &&
  (typeof w.strengthOverride === 'boolean'
    ? w.strengthOverride
    : (STRENGTH.autoTypes as readonly string[]).includes(w.type) ||
      ((STRENGTH.askTypes as readonly string[]).includes(w.type) && w.includesStrength === true));

/** Minutes of the workouts added by hand, per day. */
export function manualMinutesByDay(workouts: readonly Pick<Workout, 'date' | 'durationMin' | 'manual'>[]): Map<LocalDate, number> {
  const out = new Map<LocalDate, number>();
  for (const w of workouts) if (w.manual) out.set(w.date, (out.get(w.date) ?? 0) + w.durationMin);
  return out;
}

/** The three minute sources of a day, in milli-minutes (uncapped); the day counts the largest. */
export function minuteSourcesMilli(steps: number | null, exerciseMin: number | null, manualMin: number, stepGoal: number): { watch: number; steps: number; manual: number } {
  return {
    watch: toMilli(exerciseMin ?? 0),
    steps: steps === null ? 0 : Math.floor(Math.max(0, steps - stepGoal) * 1000 / STEP_MINUTES.stepsPerMin),
    manual: toMilli(manualMin)
  };
}

/** A day's active milli-minutes before the daily cap: max(Watch, step-derived, manual workouts). */
function activeMilliOfDay(steps: number | null, exerciseMin: number | null, manualMin: number, stepGoal: number): number {
  const m = minuteSourcesMilli(steps, exerciseMin, manualMin, stepGoal);
  return Math.max(0, m.watch, m.steps, m.manual);
}

const isStrengthVisit = (v: Visit): boolean =>
  v.dwellMin >= STRENGTH.minVisitMin && (v.autoStrength || v.confirmed === true);

/**
 * Score one person's week.
 *
 * Judgement calls (documented for the server/UI):
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
  const strengthSet = new Set<LocalDate>();
  for (const w of workouts) if (isStrengthWorkout(w)) strengthSet.add(w.date);
  // Confirmed (non-auto) gym visits pay at most STRENGTH.maxConfirmedVisitsPerWeek days.
  let confirmedVisits = 0;
  for (const v of [...visits].sort((x, y) => x.date.localeCompare(y.date))) {
    if (!isStrengthVisit(v) || strengthSet.has(v.date)) continue;
    if (!v.autoStrength && confirmedVisits++ >= STRENGTH.maxConfirmedVisitsPerWeek) continue;
    strengthSet.add(v.date);
  }
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
