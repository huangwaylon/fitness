// Today's progress of one ring fruit toward its daily goal, as the island draws it.
import type { PersonWeekView, RingProgress } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';

/** 0–100: today's share of the daily goal (met = 100). */
export function todayPct(r: Pick<RingProgress, 'today' | 'goal' | 'met'>): number {
  if (r.met) return 100;
  return r.goal > 0 ? Math.max(0, Math.min(100, (r.today * 100) / r.goal)) : 0;
}

/** 0–100: the share of today's four goals this person has met (idle life's "doing well" weight; がんばり aside). */
export const dayScore = (p: PersonWeekView): number =>
  Math.round((RING_FRUITS.filter((f) => p.rings[f].met).length * 100) / RING_FRUITS.length);
