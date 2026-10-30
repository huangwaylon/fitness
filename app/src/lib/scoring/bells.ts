// ベル earned per person per day, weekly badges and the pot split (ADR 0019). Pure; the model feeds it the rows of a
// week as of a time and decides which weeks count (the economy's first week, locks).
import { DAILY, HOLIDAY, POTS, STEP_MINUTES, STRENGTH, TSUYU } from '#lib/config/rules.ts';
import type { CheckinTick, DayBells, DayMetrics, FruitBells, FruitKey, LocalDate, PersonId, PotKey, Visit, WeekKey, Workout } from '#lib/types.ts';
import { inMonthDayRange, weekDays } from '#lib/time/dates.ts';
import { rulesFor } from '#lib/scoring/targets.ts';

// ---------- a day's raw facts (also read by きろく) ----------

/** Convert a (possibly fractional) count to integer milli-units. */
const toMilli = (x: number): number => Math.round(x * 1000);

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

const isStrengthVisit = (v: Visit): boolean =>
  v.dwellMin >= STRENGTH.minVisitMin && (v.autoStrength || v.confirmed === true);

/**
 * Strength days of a week (max one per date): strength workouts, auto-strength places, and confirmed (non-auto) gym
 * visits, at most STRENGTH.maxConfirmedVisitsPerWeek of those (earliest first). Pass one week's workouts and visits.
 */
function strengthDaysOf(workouts: readonly Workout[], visits: readonly Visit[]): Set<LocalDate> {
  const set = new Set<LocalDate>();
  for (const w of workouts) if (isStrengthWorkout(w)) set.add(w.date);
  let confirmed = 0;
  for (const v of [...visits].sort((x, y) => x.date.localeCompare(y.date))) {
    if (!isStrengthVisit(v) || set.has(v.date)) continue;
    if (!v.autoStrength && confirmed++ >= STRENGTH.maxConfirmedVisitsPerWeek) continue;
    set.add(v.date);
  }
  return set;
}

/** Minutes of the workouts added by hand, per day. */
export function manualMinutesByDay(workouts: readonly Pick<Workout, 'date' | 'durationMin' | 'manual'>[]): Map<LocalDate, number> {
  const out = new Map<LocalDate, number>();
  for (const w of workouts) if (w.manual) out.set(w.date, (out.get(w.date) ?? 0) + w.durationMin);
  return out;
}

/** The three minute sources of a day, in milli-minutes (uncapped); the day counts the largest, never a sum. */
export function minuteSourcesMilli(steps: number | null, exerciseMin: number | null, manualMin: number, stepGoal: number): { watch: number; steps: number; manual: number } {
  return {
    watch: toMilli(exerciseMin ?? 0),
    steps: steps === null ? 0 : Math.floor(Math.max(0, steps - stepGoal) * 1000 / STEP_MINUTES.stepsPerMin),
    manual: toMilli(manualMin)
  };
}

/** A day's active milli-minutes: max(Watch, (steps − goal) / 100, manual workouts). */
function activeMilliOfDay(steps: number | null, exerciseMin: number | null, manualMin: number, stepGoal: number): number {
  const m = minuteSourcesMilli(steps, exerciseMin, manualMin, stepGoal);
  return Math.max(0, m.watch, m.steps, m.manual);
}

const isPearOff = (d: LocalDate): boolean => inMonthDayRange(d, HOLIDAY.pearOff.from, HOLIDAY.pearOff.to);
const isTsuyu = (d: LocalDate): boolean => inMonthDayRange(d, TSUYU.from, TSUYU.to);

// ---------- earnings ----------

/** One person's week as of some time: the inputs `earnWeek` needs (dates outside the week are ignored). */
export interface EarnInput {
  person: PersonId;
  weekKey: WeekKey;
  /** The person's three eating habits that week; other ticks don't count. */
  habits: readonly string[];
  days: DayMetrics[];
  workouts: Workout[];
  visits: Visit[];
  checkins: CheckinTick[];
}

/** A day's earnings with the facts behind them. */
interface DayEarning extends DayBells {
  /** Counted active minutes, floored, before the daily cap (max of the three sources). */
  minutes: number;
  steps: number | null;
  /** 🍑 reached the daily goal (45 min). */
  activeMet: boolean;
  /** 🍎 reached 8,000 steps, or (tsuyu) 30 active minutes. */
  stepMet: boolean;
  strength: boolean;
  /** Distinct habit ticks counted (max 3; 0 on 正月 pear-off days). */
  ticks: number;
}

interface FruitWeek {
  /** Progress toward the badge: days meeting the daily goal (🍑🍎🥥) or ticks (🍐). */
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
  fruits: Record<FruitKey, FruitWeek>;
  badges: Record<FruitKey, boolean>;
  /** +badges.bells per badge met. */
  bonus: number;
  allBadges: boolean;
}

const FRUIT_KEYS: readonly FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
export const zeroParts = (): FruitBells => ({ peach: 0, coconut: 0, apple: 0, pear: 0 });

/**
 * One person's ベル for a week (ADR 0019 §2–4), at the week's rule version. Per day:
 * - 🍑 perMinute × counted minutes, up to goals.activeMin. Minutes = max(Watch, (steps − goal) / 100, manual).
 * - 🍎 stepDay at goals.steps; in tsuyu also at TSUYU.exerciseMin counted minutes.
 * - 🥥 strengthDay on a strength day (max 1/day; confirmed gym visits max 2/week).
 * - 🍐 perTick per distinct habit tick (max DAILY.maxTicks/day), none on 正月 pear-off days.
 * Badges: 🍑 activeDays days at the goal, 🍎 stepDays step days, 🥥 strengthDays, 🍐 `ticks` ticks (prorated over
 * pear-off days: ceil(ticks × days / 7)).
 */
export function earnWeek(input: EarnInput): WeekEarning {
  const r = rulesFor(input.weekKey);
  const week = weekDays(input.weekKey);
  const inWeek = new Set(week);
  const dayRows = new Map<LocalDate, DayMetrics>();
  for (const d of input.days) if (inWeek.has(d.date) && !dayRows.has(d.date)) dayRows.set(d.date, d);
  const workouts = input.workouts.filter((w) => inWeek.has(w.date));
  const strength = strengthDaysOf(workouts, input.visits.filter((v) => inWeek.has(v.date)));
  const manual = manualMinutesByDay(workouts);
  const habits = new Set(input.habits);
  const ticksByDay = new Map<LocalDate, Set<string>>();
  for (const c of input.checkins) {
    if (!inWeek.has(c.date) || isPearOff(c.date) || !habits.has(c.habit)) continue;
    (ticksByDay.get(c.date) ?? ticksByDay.set(c.date, new Set()).get(c.date)!).add(c.habit);
  }

  const goalMilli = r.goals.activeMin * 1000;
  const days = week.map((date): DayEarning => {
    const m = dayRows.get(date);
    const steps = m?.steps ?? null;
    const activeMilli = activeMilliOfDay(steps, m?.exerciseMin ?? null, manual.get(date) ?? 0, r.goals.steps);
    const stepMet = (steps !== null && steps >= r.goals.steps) || (isTsuyu(date) && activeMilli >= TSUYU.exerciseMin * 1000);
    const isStrength = strength.has(date);
    const ticks = Math.min(DAILY.maxTicks, ticksByDay.get(date)?.size ?? 0);
    const parts: FruitBells = {
      peach: Math.floor(Math.min(activeMilli, goalMilli) / 1000) * r.bells.perMinute,
      coconut: isStrength ? r.bells.strengthDay : 0,
      apple: stepMet ? r.bells.stepDay : 0,
      pear: ticks * r.bells.perTick
    };
    return {
      date, bells: parts.peach + parts.coconut + parts.apple + parts.pear, parts,
      minutes: Math.floor(activeMilli / 1000), steps, activeMet: activeMilli >= goalMilli, stepMet, strength: isStrength, ticks
    };
  });

  const pearDays = week.filter((d) => !isPearOff(d)).length;
  const progress: Record<FruitKey, [number, number]> = {
    peach: [days.filter((d) => d.activeMet).length, r.badges.activeDays],
    apple: [days.filter((d) => d.stepMet).length, r.badges.stepDays],
    coconut: [days.filter((d) => d.strength).length, r.badges.strengthDays],
    pear: [days.reduce((n, d) => n + d.ticks, 0), Math.ceil((r.badges.ticks * pearDays) / 7)]
  };
  const fruits = {} as Record<FruitKey, FruitWeek>;
  const badges = {} as Record<FruitKey, boolean>;
  for (const f of FRUIT_KEYS) {
    const [have, need] = progress[f];
    badges[f] = have >= need;
    fruits[f] = { weekDays: have, weekGoalDays: need, badge: badges[f], weekBells: days.reduce((n, d) => n + d.parts[f], 0) };
  }
  const count = FRUIT_KEYS.filter((f) => badges[f]).length;
  return {
    person: input.person, weekKey: input.weekKey, days, daily: days.reduce((n, d) => n + d.bells, 0),
    fruits, badges, bonus: count * r.badges.bells, allBadges: count === FRUIT_KEYS.length
  };
}

/** The ふたりボーナス: both people met all four badges. */
export const duoBonus = (a: WeekEarning, b: WeekEarning): number => (a.allBadges && b.allBadges ? rulesFor(a.weekKey).badges.duo : 0);

/** Split an all-time total into the two pots (on totals, so nothing is lost to rounding). */
export function splitPots(total: number): Record<PotKey, number> {
  const treat = Math.floor((total * POTS.treatPercent) / 100);
  return { treat, trip: total - treat };
}
