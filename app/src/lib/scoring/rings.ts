// ベル per person per day and the weekly badges of ADR 0021: five automatic metrics, one fruit each (🍑 Exercise,
// 🍐 Move, 🍒 Stand, 🍎 steps, 🥥 gym). Pure; the model feeds it one person's week as of a time.
import { RING_FRUITS, STRENGTH, TSUYU } from '#lib/config/rules.ts';
import type { LocalDate, PersonId, RingBells, RingFruit, Visit, WeekKey, Workout } from '#lib/types.ts';
import { inMonthDayRange, weekDays } from '#lib/time/dates.ts';
import { rulesFor } from '#lib/scoring/targets.ts';

/** One day's raw metrics (null = no row) and the person's Move goal in force that day. */
interface RingDayInput {
  date: LocalDate;
  steps: number | null;
  /** Watch exercise minutes. */
  exerciseMin: number | null;
  /** Move: active energy, kcal. */
  moveKcal: number | null;
  /** Health Stand Time, minutes. */
  standMin: number | null;
  /** kcal (`pref` moveGoal in force that day, else the default). */
  moveGoal: number;
}

/** One person's week as of some time (dates outside the week are ignored). */
export interface RingInput {
  person: PersonId;
  weekKey: WeekKey;
  days: RingDayInput[];
  workouts: Workout[];
  visits: Visit[];
}

/** A day's earnings with the facts behind them. */
interface RingDay {
  date: LocalDate;
  bells: number;
  rings: RingBells;
  /** Counted exercise minutes, floored, before the daily cap: max(Watch, workouts added in きろく), never a sum. */
  exerciseMin: number;
  moveKcal: number | null;
  moveGoal: number;
  standMin: number | null;
  steps: number | null;
  gym: boolean;
  /** The daily goal met, per fruit (🍎 also by the tsuyu rule). */
  met: Record<RingFruit, boolean>;
}

interface RingFruitWeek {
  /** Days meeting the daily goal. */
  weekDays: number;
  weekGoalDays: number;
  badge: boolean;
  /** Daily ベル of this fruit over the week. */
  weekBells: number;
}

export interface RingWeek {
  person: PersonId;
  weekKey: WeekKey;
  /** Mon..Sun. */
  days: RingDay[];
  /** Sum of the daily earnings. */
  daily: number;
  fruits: Record<RingFruit, RingFruitWeek>;
  badges: Record<RingFruit, boolean>;
  /** +badges.bells per badge met. */
  bonus: number;
}

export const zeroRings = (): RingBells => ({ peach: 0, pear: 0, cherry: 0, apple: 0, coconut: 0 });

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

/** Gym days of a week (max one per date): strength workouts and gym arrivals. */
export function gymDaysOf(workouts: readonly Workout[], visits: readonly Visit[]): Set<LocalDate> {
  const set = new Set<LocalDate>();
  for (const w of workouts) if (isStrengthWorkout(w)) set.add(w.date);
  for (const v of visits) set.add(v.date);
  return set;
}

/** Minutes of the workouts added by hand, per day. */
export function manualMinutesByDay(workouts: readonly Pick<Workout, 'date' | 'durationMin' | 'manual'>[]): Map<LocalDate, number> {
  const out = new Map<LocalDate, number>();
  for (const w of workouts) if (w.manual) out.set(w.date, (out.get(w.date) ?? 0) + w.durationMin);
  return out;
}

const toMilli = (x: number): number => Math.round(x * 1000);
const isTsuyu = (d: LocalDate): boolean => inMonthDayRange(d, TSUYU.from, TSUYU.to);

/**
 * One person's ベル for a week (ADR 0021 §3–4), at the week's rule version. Per day:
 * - 🍑 perExerciseMin × counted minutes, up to goals.exerciseMin. Minutes = max(Watch, manual workouts).
 * - 🍐 floor(moveAtGoal × min(kcal, goal) / goal), the goal being the person's Move goal in force that day.
 * - 🍒 perStandMin × stand minutes, up to goals.standMin.
 * - 🍎 stepDay at goals.steps; in tsuyu also at TSUYU.exerciseMin counted minutes.
 * - 🥥 gymDay on a gym day (max 1/day): a strength workout or any gym arrival.
 * Badges (+badges.bells each): days at the goal ≥ exerciseDays / moveDays / standDays / stepDays / gymDays.
 */
export function earnRingWeek(input: RingInput): RingWeek {
  const r = rulesFor(input.weekKey);
  const week = weekDays(input.weekKey);
  const inWeek = new Set(week);
  const rows = new Map<LocalDate, RingDayInput>();
  for (const d of input.days) if (inWeek.has(d.date) && !rows.has(d.date)) rows.set(d.date, d);
  const workouts = input.workouts.filter((w) => inWeek.has(w.date));
  const gym = gymDaysOf(workouts, input.visits.filter((v) => inWeek.has(v.date)));
  const manual = manualMinutesByDay(workouts);
  const exGoalMilli = r.goals.exerciseMin * 1000;

  const days = week.map((date): RingDay => {
    const m = rows.get(date);
    const steps = m?.steps ?? null;
    const moveKcal = m?.moveKcal ?? null;
    const standMin = m?.standMin ?? null;
    const moveGoal = m?.moveGoal ?? 0;
    const exMilli = Math.max(0, toMilli(m?.exerciseMin ?? 0), toMilli(manual.get(date) ?? 0));
    const kcal = Math.max(0, moveKcal ?? 0);
    const stand = Math.max(0, Math.floor(standMin ?? 0));
    const met: Record<RingFruit, boolean> = {
      peach: exMilli >= exGoalMilli,
      pear: moveGoal > 0 && kcal >= moveGoal,
      cherry: stand >= r.goals.standMin,
      apple: (steps !== null && steps >= r.goals.steps) || (isTsuyu(date) && exMilli >= TSUYU.exerciseMin * 1000),
      coconut: gym.has(date)
    };
    const rings: RingBells = {
      peach: Math.floor(Math.min(exMilli, exGoalMilli) / 1000) * r.bells.perExerciseMin,
      pear: moveGoal > 0 ? Math.floor((r.bells.moveAtGoal * Math.min(kcal, moveGoal)) / moveGoal) : 0,
      cherry: Math.min(stand, r.goals.standMin) * r.bells.perStandMin,
      apple: met.apple ? r.bells.stepDay : 0,
      coconut: met.coconut ? r.bells.gymDay : 0
    };
    return {
      date, bells: RING_FRUITS.reduce((n, f) => n + rings[f], 0), rings,
      exerciseMin: Math.floor(exMilli / 1000), moveKcal, moveGoal, standMin, steps, gym: met.coconut, met
    };
  });

  const need: Record<RingFruit, number> = {
    peach: r.badges.exerciseDays, pear: r.badges.moveDays, cherry: r.badges.standDays, apple: r.badges.stepDays, coconut: r.badges.gymDays
  };
  const fruits = {} as Record<RingFruit, RingFruitWeek>;
  const badges = {} as Record<RingFruit, boolean>;
  for (const f of RING_FRUITS) {
    const have = days.filter((d) => d.met[f]).length;
    badges[f] = have >= need[f];
    fruits[f] = { weekDays: have, weekGoalDays: need[f], badge: badges[f], weekBells: days.reduce((n, d) => n + d.rings[f], 0) };
  }
  return {
    person: input.person, weekKey: input.weekKey, days, daily: days.reduce((n, d) => n + d.bells, 0),
    fruits, badges, bonus: RING_FRUITS.filter((f) => badges[f]).length * r.badges.bells
  };
}
