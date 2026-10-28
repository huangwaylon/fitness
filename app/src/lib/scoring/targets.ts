import { HOLIDAY, SEASONS } from '#lib/config/rules.ts';
import type { PersonId, PersonTargets, WeekKey } from '#lib/types.ts';
import { inMonthDayRange, weekDays, weekKeyOf } from '#lib/scoring/dates.ts';

/** Round to 3 decimals so factors like 85 × 0.7 give 59.5, not 59.49999999999999. Scoring works in milli-units. */
const roundMilli = (x: number): number => Math.round(x * 1000) / 1000;

/** True if any day of the Mon–Sun week falls in the 正月 easy window (Dec 22–Jan 3, wraps the year). */
export function isEasyWeek(weekKey: WeekKey): boolean {
  return weekDays(weekKey).some((d) => inMonthDayRange(d, HOLIDAY.easy.from, HOLIDAY.easy.to));
}

/** Season targets for a person in a week, with holiday easy-week factors applied (ADR 0011). */
export function targetsFor(person: PersonId, weekKey: WeekKey): PersonTargets {
  const wk = weekKeyOf(weekKey);
  const sorted = [...SEASONS].sort((a, b) => a.from.localeCompare(b.from));
  if (sorted.length === 0) throw new Error('No SEASONS configured');
  // Before the first season starts, fall back to the first season's targets.
  const season = sorted.filter((s) => s.from <= wk).at(-1) ?? sorted[0];
  const base = season.targets[person];
  const t: PersonTargets = { ...base, habits: [...base.habits] as [string, string, string] };
  if (isEasyWeek(wk)) {
    const f = HOLIDAY.easy.factor;
    t.activeMinPerWeek = roundMilli(base.activeMinPerWeek * f);
    t.strengthDaysPerWeek = roundMilli(base.strengthDaysPerWeek * f);
    t.stepDaysPerWeek = roundMilli(base.stepDaysPerWeek * f);
  }
  return t;
}
