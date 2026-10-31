// ベル earned per person per day, a stamp card: +1 for each of the four daily goals met (🍐 Move, 🍑 Exercise,
// 🍒 Stand, 🍎 steps), all or nothing; がんばり, +1 more for each goal reached at 1.5× (at most +2 a day); and
// ふたりでぜんぶ, +2 shared when both met all four on the same day. Pure; the model feeds it one person's week as of a
// time and decides which weeks count (the first week, locks).
import { RING_FRUITS, RULES, STRETCH, stretchOf } from '#lib/config/rules.ts';
import type { LocalDate, PersonId, RingBells, RingFruit, WeekKey } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';

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
export interface DayEarning {
  date: LocalDate;
  /** +RULES.perGoal per goal met (0–4) + がんばり (`stretch`, 0–2). */
  bells: number;
  /** The daily goal met, per fruit. */
  met: Record<RingFruit, boolean>;
  /** The stretch target (1.5 × the goal) reached, per fruit (implies met; may be more than the cap pays). */
  stretched: Record<RingFruit, boolean>;
  /** がんばり ベル that day: STRETCH.perGoal per stretched fruit, at most STRETCH.cap. */
  stretch: number;
  /** Exercise minutes, floored. */
  exerciseMin: number;
  moveKcal: number | null;
  moveGoal: number;
  standMin: number | null;
  steps: number | null;
}

export interface WeekEarning {
  person: PersonId;
  weekKey: WeekKey;
  /** Mon..Sun. */
  days: DayEarning[];
}

/** がんばり paid per fruit: the stretched fruits in RING_FRUITS order, until STRETCH.cap is reached. */
function stretchPaid(stretched: Record<RingFruit, boolean>): Record<RingFruit, boolean> {
  let left = STRETCH.cap;
  return Object.fromEntries(RING_FRUITS.map((f) => {
    const pay = stretched[f] && left >= STRETCH.perGoal;
    if (pay) left -= STRETCH.perGoal;
    return [f, pay];
  })) as Record<RingFruit, boolean>;
}

/** The day's ベル per fruit: RULES.perGoal when met, + STRETCH.perGoal when its がんばり is paid (within the cap). */
export function ringBells(d: Pick<DayEarning, 'met' | 'stretched'>): RingBells {
  const paid = stretchPaid(d.stretched);
  return Object.fromEntries(RING_FRUITS.map((f) => [f, (d.met[f] ? RULES.perGoal : 0) + (paid[f] ? STRETCH.perGoal : 0)])) as RingBells;
}

export const noneMet = (): Record<RingFruit, boolean> => ({ pear: false, peach: false, cherry: false, apple: false });

/**
 * One person's ベル for a week. A goal is met at or above it: 🍐 kcal ≥ the Move goal in force that day, 🍑 Watch
 * exercise minutes ≥ 60 (fractions count), 🍒 whole Stand minutes ≥ 120, 🍎 steps ≥ 8,000; and stretched at or above
 * 1.5 × the same (900 kcal for a 600 goal, 90 min, 180 min, 12,000 steps), paying がんばり up to its cap. A day with no
 * row meets nothing.
 */
export function earnWeek(input: EarnInput): WeekEarning {
  const g = RULES.goals;
  const week = weekDays(input.weekKey);
  const rows = new Map<LocalDate, EarnDay>();
  for (const d of input.days) if (d.date >= week[0] && d.date <= week[6] && !rows.has(d.date)) rows.set(d.date, d);

  const days = week.map((date): DayEarning => {
    const m = rows.get(date);
    const steps = m?.steps ?? null;
    const moveKcal = m?.moveKcal ?? null;
    const standMin = m?.standMin ?? null;
    const moveGoal = m?.moveGoal ?? 0;
    const ex = Math.max(0, m?.exerciseMin ?? 0);
    const met: Record<RingFruit, boolean> = {
      pear: moveGoal > 0 && (moveKcal ?? 0) >= moveGoal,
      peach: ex >= g.exerciseMin,
      cherry: Math.floor(standMin ?? 0) >= g.standMin,
      apple: (steps ?? 0) >= g.steps
    };
    const stretched: Record<RingFruit, boolean> = {
      pear: met.pear && (moveKcal ?? 0) >= stretchOf(moveGoal),
      peach: met.peach && ex >= stretchOf(g.exerciseMin),
      cherry: met.cherry && Math.floor(standMin ?? 0) >= stretchOf(g.standMin),
      apple: met.apple && (steps ?? 0) >= stretchOf(g.steps)
    };
    const stretch = Math.min(STRETCH.cap, RING_FRUITS.filter((f) => stretched[f]).length * STRETCH.perGoal);
    const bells = RING_FRUITS.filter((f) => met[f]).length * RULES.perGoal + stretch;
    return { date, bells, met, stretched, stretch, exerciseMin: Math.floor(ex), moveKcal, moveGoal, standMin, steps };
  });
  return { person: input.person, weekKey: input.weekKey, days };
}

/** Every goal met that day. */
export const allMet = (d: Pick<DayEarning, 'met'>): boolean => RING_FRUITS.every((f) => d.met[f]);

/** ふたりでぜんぶ per day of the week: both people met all four goals (+RULES.together shared). */
export const togetherDays = (a: WeekEarning, b: WeekEarning): boolean[] => a.days.map((d, i) => allMet(d) && allMet(b.days[i]));
