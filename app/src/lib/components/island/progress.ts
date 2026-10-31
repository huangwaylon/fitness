// Today's progress of one ring fruit toward its daily goal, as the island draws it.
import type { PersonWeekView, RingFruit, RingProgress, WeekKey } from '#lib/types.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { rulesFor } from '#lib/config/rules.ts';

/** 0–100: today's share of the daily goal (met = 100, also when met by the tsuyu rule). */
export function todayPct(r: Pick<RingProgress, 'today' | 'goal' | 'met'>): number {
  if (r.met) return 100;
  return r.goal > 0 ? Math.max(0, Math.min(100, (r.today * 100) / r.goal)) : 0;
}

/** The most one person can earn in a day of the week (the Move goal pays the same at any kcal): 740 ベル in v1, 1,400 from 2026-11-02. */
export function dayMax(weekKey: WeekKey): number {
  const r = rulesFor(weekKey);
  const b = r.bells;
  return r.goals.exerciseMin * b.perExerciseMin + b.moveAtGoal + r.goals.standMin * b.perStandMin + b.stepDay;
}

/** 0–100: how much of a full day this person has earned today (idle life's "doing well" weight). */
export const dayScore = (p: PersonWeekView, weekKey: WeekKey): number => {
  const bells = Object.values(p.today.rings).reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round((bells * 100) / dayMax(weekKey)));
};

/** 「30/60分」「420/600kcal」「6,200/8,000歩」: today against the daily goal. */
export function todayAmount(fruit: RingFruit, r: RingProgress): string {
  return t(`tree.${fruit}`, { a: formatNum(r.today), g: formatNum(r.goal) });
}

