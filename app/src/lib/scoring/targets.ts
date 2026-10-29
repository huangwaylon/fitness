import { HOLIDAY, RULES, SEASONS, type RuleVersion, type Season } from '#lib/config/rules.ts';
import type { PersonId, PersonTargets, WeekKey } from '#lib/types.ts';
import { inMonthDayRange, weekDays, weekKeyOf } from '#lib/time/dates.ts';

/** Round to 3 decimals so factors like 85 × 0.7 give 59.5, not 59.49999999999999. Scoring works in milli-units. */
const roundMilli = (x: number): number => Math.round(x * 1000) / 1000;

/** True if any day of the Mon–Sun week falls in the 正月 easy window (Dec 25–Jan 1: always two weeks; wraps the year). */
export function isEasyWeek(weekKey: WeekKey): boolean {
  return weekDays(weekKey).some((d) => inMonthDayRange(d, HOLIDAY.easy.from, HOLIDAY.easy.to));
}

/** SEASONS in ascending `from`. */
export function seasonsByStart(): Season[] {
  if (SEASONS.length === 0) throw new Error('No SEASONS configured');
  return [...SEASONS].sort((a, b) => a.from.localeCompare(b.from));
}

const cache = new Map<string, PersonTargets>();

/** Season targets for a person in a week, with holiday easy-week factors applied (ADR 0011). A fresh copy per call. */
export function targetsFor(person: PersonId, weekKey: WeekKey): PersonTargets {
  const k = `${person}|${weekKey}`;
  let t = cache.get(k);
  if (!t) cache.set(k, (t = computeTargets(person, weekKey)));
  return { ...t, habits: [...t.habits] as [string, string, string] };
}

function computeTargets(person: PersonId, weekKey: WeekKey): PersonTargets {
  const wk = weekKeyOf(weekKey);
  const sorted = seasonsByStart();
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

/** The rule version of a week: the latest with `from` ≤ the week, or the first one before any applies. */
export function rulesFor(weekKey: WeekKey): RuleVersion {
  for (let i = RULES.length - 1; i > 0; i--) if (RULES[i].from <= weekKey) return RULES[i];
  return RULES[0];
}
