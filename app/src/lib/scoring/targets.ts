// Which rule version and which habits a week uses (both versioned by week, ascending `from`; a week before the first
// version uses the first).
import { HABITS, RULES, type RuleVersion } from '#lib/config/rules.ts';
import type { PersonId, WeekKey } from '#lib/types.ts';
import { weekKeyOf } from '#lib/time/dates.ts';

/** The latest entry with `from` ≤ the week, or the first one before any applies. */
function versionFor<T extends { from: WeekKey }>(list: readonly T[], weekKey: WeekKey): T {
  for (let i = list.length - 1; i > 0; i--) if (list[i].from <= weekKey) return list[i];
  return list[0];
}

/** The rule version of a week. */
export const rulesFor = (weekKey: WeekKey): RuleVersion => versionFor(RULES, weekKey);

/** A person's three eating habits in a week (hot in `reduce`: one call per check-in; don't mutate the result). */
export const habitsFor = (person: PersonId, weekKey: WeekKey): readonly [string, string, string] =>
  versionFor(HABITS, weekKeyOf(weekKey)).people[person].habits;
