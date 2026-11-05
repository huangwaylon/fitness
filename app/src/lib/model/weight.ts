// Body weight: each person's weigh-ins and, over a period, a plain change and the month a goal may be reached. Shown
// only: nothing here feeds the ベル economy (bells.ts never imports this file, and weight rows live in their own State
// maps).
//
// Rules:
// - A day's weight is its latest ingested row stamped at or before T. The Shortcut sends the day's Body Mass from
//   Apple Health (relay/src/parse.ts), and the server appends a row whenever it differs from the day's last row, so the
//   latest row is the current one (unlike steps, which take the max).
// - The change over a period (plainChange) is plain arithmetic on the weigh-ins, no smoothing: the average of the
//   first week's weigh-ins (the 7 days from the first) → the average of the last week's (the 7 days to the last), when
//   the two weeks don't overlap (the weigh-ins span 14 days or more); else the first weigh-in → the last. Per week: that
//   change over the days between the two weeks' middles (their weigh-ins' mean date), from 7 days apart.
// - The goal date (project) extends that weekly pace from the last week's average; only from two weeks, not toward a
//   goal it is moving away from, too slow (WEIGHT.minPacePerWeek) or too far out (WEIGHT.projectMaxWeeks).
import type { GoalDir } from '#lib/contract/goals.ts';
import type { LocalDate, PersonId } from '#lib/types.ts';
import { WEIGHT } from '#lib/config/rules.ts';
import { addDays, daysBetween, localDateAt } from '#lib/time/dates.ts';
import { roundKg as round1 } from '#lib/contract/api.ts';
import { latestAt, type State } from './state.ts';

export interface WeighIn { date: LocalDate; kg: number }

export type WeightProjection =
  | { kind: 'reached' }
  /** The goal is reached around `date` at the period's pace. */
  | { kind: 'date'; date: LocalDate }
  /** Heading the other way, too slow, too far out or too few weigh-ins: no date (the UI stays encouraging). */
  | { kind: 'none' };

export interface PlainChange {
  /** `weeks`: the first week's average → the last week's; `ends`: the first weigh-in → the last. */
  basis: 'weeks' | 'ends';
  /** Where it starts and ends (kg, two decimals), and when the end stands (the last week's middle, or the last weigh-in). */
  from: number;
  to: number;
  at: LocalDate;
  /** to − from, one decimal. */
  change: number;
  /** The change per week (two decimals); null when the two ends are under 7 days apart. */
  perWeek: number | null;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Every day with a weight as of T (none after T's own date), ascending: each day's latest row stamped at or before T. */
export function weighIns(s: State, p: PersonId, t: number): WeighIn[] {
  const today = localDateAt(t);
  const out: WeighIn[] = [];
  for (const date of [...s.weights[p].keys()].sort()) {
    if (date > today) continue;
    const kg = latestAt(s.weights[p].get(date), t);
    if (kg !== undefined) out.push({ date, kg });
  }
  return out;
}

/** The average weigh-in and the mean date (days after `base`) of some weigh-ins. */
function mean(days: readonly WeighIn[], base: LocalDate): { kg: number; day: number } {
  let kg = 0, day = 0;
  for (const d of days) (kg += d.kg), (day += daysBetween(base, d.date));
  return { kg: kg / days.length, day: day / days.length };
}

/** The plain change over ascending weigh-ins (one period's); null under two. */
export function plainChange(days: readonly WeighIn[]): PlainChange | null {
  if (days.length < 2) return null;
  const first = days[0].date, last = days.at(-1)!.date;
  const weeks = daysBetween(first, last) >= 13;
  const a = weeks ? mean(days.filter((d) => daysBetween(first, d.date) < 7), first) : { kg: days[0].kg, day: 0 };
  const b = weeks ? mean(days.filter((d) => daysBetween(d.date, last) < 7), first) : { kg: days.at(-1)!.kg, day: daysBetween(first, last) };
  const span = b.day - a.day;
  return {
    basis: weeks ? 'weeks' : 'ends',
    from: round2(a.kg),
    to: round2(b.kg),
    at: addDays(first, Math.round(b.day)),
    change: round1(b.kg - a.kg),
    perWeek: span >= 7 ? round2(((b.kg - a.kg) / span) * 7) : null
  };
}

/** Where the period's pace meets the goal: reached once the end is at or past it (seen from the start). */
export function project(c: PlainChange, goal: number, dir: GoalDir = 'target', band = 0): WeightProjection {
  // a ceiling is reached once under it and a floor once over it, whichever side the period started on; a value to
  // stay near once within its band, or once crossed on the way to it
  const crossed = goal <= c.from ? c.to <= goal : c.to >= goal;
  if (dir === 'atMost' ? c.to <= goal : dir === 'atLeast' ? c.to >= goal : crossed || Math.abs(c.to - goal) <= goal * band) return { kind: 'reached' };
  const diff = goal - c.to;
  const pace = c.basis === 'weeks' ? c.perWeek : null;
  if (pace === null || Math.abs(pace) < WEIGHT.minPacePerWeek || Math.sign(pace) !== Math.sign(diff)) return { kind: 'none' };
  const weeks = diff / pace;
  if (weeks > WEIGHT.projectMaxWeeks) return { kind: 'none' };
  return { kind: 'date', date: addDays(c.at, Math.ceil(weeks * 7)) };
}
