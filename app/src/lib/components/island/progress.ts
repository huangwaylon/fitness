// Today's progress of one ring fruit toward its daily goal (ADR 0021), as the island draws it.
import type { PersonWeekView, RingFruit, RingProgress } from '#lib/types.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { RULES } from '#lib/config/rules.ts';

/** 0–100: today's share of the daily goal (met = 100, also when met by the tsuyu rule). */
export function todayPct(r: Pick<RingProgress, 'today' | 'goal' | 'met'>): number {
  if (r.met) return 100;
  return r.goal > 0 ? Math.max(0, Math.min(100, (r.today * 100) / r.goal)) : 0;
}

/** The most one person can earn in a day (1,140 ベル with the ADR 0021 rules: the Move goal pays the same at any kcal). */
export function dayMax(): number {
  const r = RULES[RULES.length - 1];
  const b = r.bells;
  return r.goals.exerciseMin * b.perExerciseMin + b.moveAtGoal + r.goals.standMin * b.perStandMin + b.stepDay + b.gymDay;
}

/** 0–100: how much of a full day this person has earned today (idle life's "doing well" weight). */
export const dayScore = (p: PersonWeekView): number => {
  const bells = Object.values(p.today.rings).reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round((bells * 100) / dayMax()));
};

/** 「30/60分」「420/600kcal」「6,200/8,000歩」「✓」: today against the daily goal. */
export function todayAmount(fruit: RingFruit, r: RingProgress): string {
  if (fruit === 'coconut') return r.met ? '✓' : '—';
  return t(`tree.${fruit}`, { a: formatNum(r.today), g: formatNum(r.goal) });
}

