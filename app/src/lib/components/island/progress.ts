// Today's progress of one ring fruit toward its daily goal, as the island draws it.
import type { PersonWeekView, RingProgress, WeekKey } from '#lib/types.ts';
import { RING_FRUITS, RULES } from '#lib/config/rules.ts';

/** 0–100: today's share of the daily goal (met = 100). */
export function todayPct(r: Pick<RingProgress, 'today' | 'goal' | 'met'>): number {
  if (r.met) return 100;
  return r.goal > 0 ? Math.max(0, Math.min(100, (r.today * 100) / r.goal)) : 0;
}

/** The most one person can earn in a day: every goal met (4 ベル). */
const DAY_MAX = RING_FRUITS.length * RULES.perGoal;

/** 0–100: how much of a full day this person has earned today (idle life's "doing well" weight). `_weekKey` is unused. */
export const dayScore = (p: PersonWeekView, _weekKey?: WeekKey): number => Math.min(100, Math.round((p.today.bells * 100) / DAY_MAX));
