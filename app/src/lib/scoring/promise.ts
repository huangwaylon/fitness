// Sunday promise auto-check (motivational-coach round 3 §2, ADR 0011). Never a failure state: ○ "open", not ✗.
import { PROMISE_RULES } from '#lib/config/rules.ts';
import type { LocalDate, PromiseKind, PromiseResult, Visit, WeekKey, WeekPromise, Workout } from '#lib/types.ts';
import { addDays, weekDays } from '#lib/scoring/dates.ts';
import { isStrengthWorkout } from '#lib/scoring/score.ts';

type Activity = { date: LocalDate; workout?: Workout; visit?: Visit };

function matches(kind: PromiseKind, a: Activity): boolean {
  const { workout: w, visit: v } = a;
  switch (kind) {
    case 'gym':
      return !!v || (!!w && isStrengthWorkout(w));
    case 'pt':
      return (!!v && v.autoStrength) || (!!w && isStrengthWorkout(w));
    case 'walk':
      return !!w && ((PROMISE_RULES.walkTypes as readonly string[]).includes(w.type) || w.durationMin >= PROMISE_RULES.walkAnyWorkoutMin);
    case 'any':
      return !!v || (!!w && w.durationMin >= PROMISE_RULES.anyWorkoutMin);
  }
}

/** Mon=bit0 … Sun=bit6 → promised dates. */
export function promisedDays(daysMask: number, weekKey: WeekKey): LocalDate[] {
  return weekDays(weekKey).filter((_, i) => (daysMask & (1 << i)) !== 0);
}

/**
 * 'paused' if any promised day is a cozy day; 'kept' if every promised day d has its own matching activity on
 * d−1..d+1 (each activity used once; greedy by date, earliest usable activity first, which is optimal for
 * equal-width windows); otherwise 'open'. Activities dated after `today` are ignored. An empty mask is 'open'.
 */
export function checkPromise(
  p: WeekPromise,
  weekKey: WeekKey,
  workouts: Workout[],
  visits: Visit[],
  cozyDays: LocalDate[],
  today: LocalDate
): PromiseResult {
  const days = promisedDays(p.daysMask, weekKey);
  const cozy = new Set(cozyDays);
  if (days.some((d) => cozy.has(d))) return 'paused';
  if (days.length === 0) return 'open';

  const activities: Activity[] = [
    ...workouts.map((w) => ({ date: w.date, workout: w })),
    ...visits.map((v) => ({ date: v.date, visit: v }))
  ]
    .filter((a) => a.date <= today && matches(p.kind, a))
    .sort((x, y) => x.date.localeCompare(y.date));

  const used = new Set<number>();
  for (const d of days) {
    const lo = addDays(d, -1);
    const hi = addDays(d, 1);
    const i = activities.findIndex((a, idx) => !used.has(idx) && a.date >= lo && a.date <= hi);
    if (i < 0) return 'open';
    used.add(i);
  }
  return 'kept';
}
