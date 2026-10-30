// ベル earned per person per day and weekly badges (ADR 0019, what earns: ADR 0021): five automatic metrics, one fruit each (🍑 Exercise, 🍐 Move, 🍒 Stand, 🍎 steps, 🥥 gym). Pure; the model feeds it one person's
// week as of a time and decides which weeks count (the economy's first week, locks).
import { RING_FRUITS, rulesFor, STRENGTH, TSUYU } from '#lib/config/rules.ts';
import type { LocalDate, PersonId, RingBells, RingFruit, GymArrival, WeekKey, Workout } from '#lib/types.ts';
import { inMonthDayRange, weekDays } from '#lib/time/dates.ts';

// ---------- a day's raw facts (also read by きろく) ----------

/**
 * Strength workout: at least STRENGTH.minWorkoutMin, and a きろく override if there is one (any type), else an auto
 * type. Other types count only when marked in きろく.
 */
export const isStrengthWorkout = (w: Pick<Workout, 'type' | 'durationMin' | 'strengthOverride'>): boolean =>
  w.durationMin >= STRENGTH.minWorkoutMin &&
  (typeof w.strengthOverride === 'boolean' ? w.strengthOverride : (STRENGTH.autoTypes as readonly string[]).includes(w.type));

/** Gym days of a week (max one per date): strength workouts and gym arrivals. */
function gymDaysOf(workouts: readonly Workout[], arrivals: readonly GymArrival[]): Set<LocalDate> {
  const set = new Set<LocalDate>();
  for (const w of workouts) if (isStrengthWorkout(w)) set.add(w.date);
  for (const a of arrivals) set.add(a.date);
  return set;
}

/** Minutes of the workouts added by hand, per day. */
export function manualMinutesByDay(workouts: readonly Pick<Workout, 'date' | 'durationMin' | 'manual'>[]): Map<LocalDate, number> {
  const out = new Map<LocalDate, number>();
  for (const w of workouts) if (w.manual) out.set(w.date, (out.get(w.date) ?? 0) + w.durationMin);
  return out;
}

const toMilli = (x: number): number => Math.round(x * 1000);

/** A day's counted exercise milli-minutes: max(Watch, workouts added in きろく), never a sum (ADR 0021 §2). */
export const exerciseMilli = (watchMin: number | null, manualMin: number): number => Math.max(0, toMilli(watchMin ?? 0), toMilli(manualMin));

const isTsuyu = (d: LocalDate): boolean => inMonthDayRange(d, TSUYU.from, TSUYU.to);

// ---------- earnings ----------

/** One day's raw metrics (null = no row) and the person's Move goal in force that day. */
export interface EarnDay {
  date: LocalDate;
  steps: number | null;
  /** Watch exercise minutes. */
  exerciseMin: number | null;
  /** Move: active energy, kcal. */
  moveKcal: number | null;
  /** Health Stand Time, minutes. */
  standMin: number | null;
  /** kcal (`pref` moveGoal in force that day, else PEOPLE[p].moveGoal). */
  moveGoal: number;
}

/** One person's week as of some time: the inputs `earnWeek` needs (dates outside the week are ignored). */
export interface EarnInput {
  person: PersonId;
  weekKey: WeekKey;
  days: EarnDay[];
  workouts: Workout[];
  arrivals: GymArrival[];
}

/** A day's earnings with the facts behind them. */
interface DayEarning {
  date: LocalDate;
  bells: number;
  rings: RingBells;
  /** Counted exercise minutes, floored, before the daily cap. */
  exerciseMin: number;
  moveKcal: number | null;
  moveGoal: number;
  standMin: number | null;
  steps: number | null;
  gym: boolean;
  /** The daily goal met, per fruit (🍎 also by the tsuyu rule). */
  met: Record<RingFruit, boolean>;
}

interface FruitWeek {
  /** Days meeting the daily goal. */
  weekDays: number;
  weekGoalDays: number;
  badge: boolean;
  /** Daily ベル of this fruit over the week. */
  weekBells: number;
}

export interface WeekEarning {
  person: PersonId;
  weekKey: WeekKey;
  /** Mon..Sun. */
  days: DayEarning[];
  /** Sum of the daily earnings. */
  daily: number;
  fruits: Record<RingFruit, FruitWeek>;
  badges: Record<RingFruit, boolean>;
  /** +badges.bells per badge met. */
  bonus: number;
}

export const zeroRings = (): RingBells => ({ peach: 0, pear: 0, cherry: 0, apple: 0, coconut: 0 });

/**
 * One person's ベル for a week (ADR 0021 §3–4), at the week's rule version. Per day:
 * - 🍑 perExerciseMin × counted minutes, up to goals.exerciseMin. Minutes = max(Watch, workouts added in きろく).
 * - 🍐 floor(moveAtGoal × min(kcal, goal) / goal), the goal being the person's Move goal in force that day.
 * - 🍒 perStandMin × whole stand minutes, up to goals.standMin.
 * - 🍎 stepDay at goals.steps; in tsuyu also at TSUYU.exerciseMin counted minutes.
 * - 🥥 gymDay on a gym day (max 1/day): a strength workout or any gym arrival.
 * Badges (+badges.bells each): days at the goal ≥ exerciseDays / moveDays / standDays / stepDays / gymDays.
 */
export function earnWeek(input: EarnInput): WeekEarning {
  const r = rulesFor(input.weekKey);
  const week = weekDays(input.weekKey);
  const inWeek = new Set(week);
  const rows = new Map<LocalDate, EarnDay>();
  for (const d of input.days) if (inWeek.has(d.date) && !rows.has(d.date)) rows.set(d.date, d);
  const workouts = input.workouts.filter((w) => inWeek.has(w.date));
  const gym = gymDaysOf(workouts, input.arrivals.filter((a) => inWeek.has(a.date)));
  const manual = manualMinutesByDay(workouts);
  const exGoalMilli = r.goals.exerciseMin * 1000;

  const days = week.map((date): DayEarning => {
    const m = rows.get(date);
    const steps = m?.steps ?? null;
    const moveKcal = m?.moveKcal ?? null;
    const standMin = m?.standMin ?? null;
    const moveGoal = m?.moveGoal ?? 0;
    const ex = exerciseMilli(m?.exerciseMin ?? null, manual.get(date) ?? 0);
    const kcal = Math.max(0, moveKcal ?? 0);
    const stand = Math.max(0, Math.floor(standMin ?? 0));
    const met: Record<RingFruit, boolean> = {
      peach: ex >= exGoalMilli,
      pear: moveGoal > 0 && kcal >= moveGoal,
      cherry: stand >= r.goals.standMin,
      apple: (steps !== null && steps >= r.goals.steps) || (isTsuyu(date) && ex >= TSUYU.exerciseMin * 1000),
      coconut: gym.has(date)
    };
    const rings: RingBells = {
      peach: Math.floor(Math.min(ex, exGoalMilli) / 1000) * r.bells.perExerciseMin,
      pear: moveGoal > 0 ? Math.floor((r.bells.moveAtGoal * Math.min(kcal, moveGoal)) / moveGoal) : 0,
      cherry: Math.min(stand, r.goals.standMin) * r.bells.perStandMin,
      apple: met.apple ? r.bells.stepDay : 0,
      coconut: met.coconut ? r.bells.gymDay : 0
    };
    return {
      date, bells: RING_FRUITS.reduce((n, f) => n + rings[f], 0), rings,
      exerciseMin: Math.floor(ex / 1000), moveKcal, moveGoal, standMin, steps, gym: met.coconut, met
    };
  });

  const need: Record<RingFruit, number> = {
    peach: r.badges.exerciseDays, pear: r.badges.moveDays, cherry: r.badges.standDays, apple: r.badges.stepDays, coconut: r.badges.gymDays
  };
  const fruits = {} as Record<RingFruit, FruitWeek>;
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

/** The ふたりボーナス: +badges.duoPerBadge for each badge both people met (one miss never costs it all). */
export const duoBonus = (a: WeekEarning, b: WeekEarning): number =>
  RING_FRUITS.filter((f) => a.badges[f] && b.badges[f]).length * rulesFor(a.weekKey).badges.duoPerBadge;
