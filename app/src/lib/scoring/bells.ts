// ベル earned per person per day and weekly badges: four automatic metrics, one fruit
// each (🍐 Move, 🍑 Exercise, 🍒 Stand, 🍎 steps). Pure; the model feeds it one person's week as of a time and decides
// which weeks count (the economy's first week, locks).
import { RING_FRUITS, rulesFor, TSUYU, type RuleVersion } from '#lib/config/rules.ts';
import type { LocalDate, PersonId, RingBells, RingFruit, WeekKey } from '#lib/types.ts';
import { inMonthDayRange, weekDays } from '#lib/time/dates.ts';

/** A day's exercise milli-minutes (the Watch may send fractions; never negative). */
const exerciseMilli = (min: number | null): number => Math.max(0, Math.round((min ?? 0) * 1000));

const isTsuyu = (d: LocalDate): boolean => inMonthDayRange(d, TSUYU.from, TSUYU.to);

// ---------- the milestone curve (v2) ----------

/** A fruit's ベル at the day's goal: its daily max. */
const fruitMax = (r: RuleVersion, f: RingFruit): number =>
  f === 'peach' ? r.goals.exerciseMin * r.bells.perExerciseMin
  : f === 'pear' ? r.bells.moveAtGoal
  : f === 'cherry' ? r.goals.standMin * r.bells.perStandMin
  : r.bells.stepDay;

const steps = new WeakMap<RuleVersion, Partial<Record<RingFruit, readonly number[]>>>();
/**
 * A fruit's ベル at each milestone of the week's curve, e.g. 🍑 v2 [45, 120, 230, 420]; null when the week has no curve
 * (v1: linear). Computed once per rule version and fruit (earnWeek asks for every day).
 */
export function milestoneBells(weekKey: WeekKey, f: RingFruit): readonly number[] | null {
  const r = rulesFor(weekKey);
  if (!r.curve) return null;
  let byFruit = steps.get(r);
  if (!byFruit) steps.set(r, (byFruit = {}));
  const { pay } = r.curve;
  return (byFruit[f] ??= r.curve.bells?.[f] ?? pay.map((x) => Math.round((fruitMax(r, f) * x) / pay[pay.length - 1])));
}

/** Milestones reached (0..at.length): how many steps of the goal `amount` has met. */
const milestoneOf = (at: readonly number[], amount: number, goal: number): number =>
  goal > 0 ? at.filter((x) => amount >= x * goal).length : 0;

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
}

/** A day's earnings with the facts behind them. */
interface DayEarning {
  date: LocalDate;
  bells: number;
  rings: RingBells;
  /** Exercise minutes, floored, before the daily cap. */
  exerciseMin: number;
  moveKcal: number | null;
  moveGoal: number;
  standMin: number | null;
  steps: number | null;
  /** The daily goal met, per fruit (🍎 also by the tsuyu rule). */
  met: Record<RingFruit, boolean>;
  /** Milestones reached per curve fruit (0–4; the goal met is the last, 🍎's tsuyu day too); null in a week without a curve (v1). */
  milestone: Record<RingFruit, number> | null;
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

export const zeroRings = (): RingBells => ({ pear: 0, peach: 0, cherry: 0, apple: 0 });

/**
 * One person's ベル for a week, at the week's rule version. Per day:
 * - 🍑 perExerciseMin × Watch exercise minutes, up to goals.exerciseMin.
 * - 🍐 floor(moveAtGoal × min(kcal, goal) / goal), the goal being the person's Move goal in force that day.
 * - 🍒 perStandMin × whole stand minutes, up to goals.standMin.
 * - 🍎 stepDay at goals.steps; in tsuyu also at TSUYU.exerciseMin counted minutes.
 * With a milestone curve (v2) each fruit instead pays `milestoneBells` at the last milestone reached (0 below the first).
 * Badges (+badges.bells each): days at the goal ≥ exerciseDays / moveDays / standDays / stepDays.
 */
export function earnWeek(input: EarnInput): WeekEarning {
  const r = rulesFor(input.weekKey);
  const week = weekDays(input.weekKey);
  const inWeek = (d: LocalDate) => d >= week[0] && d <= week[6];
  const rows = new Map<LocalDate, EarnDay>();
  for (const d of input.days) if (inWeek(d.date) && !rows.has(d.date)) rows.set(d.date, d);
  const exGoalMilli = r.goals.exerciseMin * 1000;

  const days = week.map((date): DayEarning => {
    const m = rows.get(date);
    const steps = m?.steps ?? null;
    const moveKcal = m?.moveKcal ?? null;
    const standMin = m?.standMin ?? null;
    const moveGoal = m?.moveGoal ?? 0;
    const ex = exerciseMilli(m?.exerciseMin ?? null);
    const kcal = Math.max(0, moveKcal ?? 0);
    const stand = Math.max(0, Math.floor(standMin ?? 0));
    const met: Record<RingFruit, boolean> = {
      pear: moveGoal > 0 && kcal >= moveGoal,
      peach: ex >= exGoalMilli,
      cherry: stand >= r.goals.standMin,
      apple: (steps !== null && steps >= r.goals.steps) || (isTsuyu(date) && ex >= TSUYU.exerciseMin * 1000)
    };
    const rings: RingBells = {
      pear: moveGoal > 0 ? Math.floor((r.bells.moveAtGoal * Math.min(kcal, moveGoal)) / moveGoal) : 0,
      peach: Math.floor(Math.min(ex, exGoalMilli) / 1000) * r.bells.perExerciseMin,
      cherry: Math.min(stand, r.goals.standMin) * r.bells.perStandMin,
      apple: met.apple ? r.bells.stepDay : 0
    };
    let milestone: DayEarning['milestone'] = null;
    if (r.curve) {
      const at = r.curve.at;
      milestone = {
        pear: milestoneOf(at, kcal, moveGoal),
        peach: milestoneOf(at, ex, exGoalMilli),
        cherry: milestoneOf(at, stand, r.goals.standMin),
        apple: met.apple ? at.length : milestoneOf(at, steps ?? 0, r.goals.steps)
      };
      for (const f of RING_FRUITS) rings[f] = milestone[f] > 0 ? milestoneBells(input.weekKey, f)![milestone[f] - 1] : 0;
    }
    return {
      date, bells: RING_FRUITS.reduce((n, f) => n + rings[f], 0), rings,
      exerciseMin: Math.floor(ex / 1000), moveKcal, moveGoal, standMin, steps, met, milestone
    };
  });

  const need: Record<RingFruit, number> = {
    pear: r.badges.moveDays, peach: r.badges.exerciseDays, cherry: r.badges.standDays, apple: r.badges.stepDays
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
