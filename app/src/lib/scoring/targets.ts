// Which rule version a week uses (versioned by week, ascending `from`; a week before the first version uses the first).
import { RULES, type RuleVersion } from '#lib/config/rules.ts';
import type { WeekKey } from '#lib/types.ts';

/** The latest entry with `from` ≤ the week, or the first one before any applies. */
function versionFor<T extends { from: WeekKey }>(list: readonly T[], weekKey: WeekKey): T {
  for (let i = list.length - 1; i > 0; i--) if (list[i].from <= weekKey) return list[i];
  return list[0];
}

/** The rule version of a week. */
export const rulesFor = (weekKey: WeekKey): RuleVersion => versionFor(RULES, weekKey);
