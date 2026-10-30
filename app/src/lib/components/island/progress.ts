// Today's progress of one fruit toward the daily goal both people share (ADR 0019 §2), as the island draws it.
import type { FruitKey, FruitProgress, PersonWeekView } from '#lib/types.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { DAILY, RULES } from '#lib/config/rules.ts';

/** 0–100: today's share of the daily goal (met = 100, also when met by the tsuyu rule). */
export function todayPct(f: Pick<FruitProgress, 'todayActual' | 'todayGoal' | 'todayMet'>): number {
  if (f.todayMet) return 100;
  return f.todayGoal > 0 ? Math.max(0, Math.min(100, (f.todayActual * 100) / f.todayGoal)) : 0;
}

/** The most one person can earn in a day (1,125 ベル with the 2026-10-30 rules). */
export function dayMax(): number {
  const r = RULES[RULES.length - 1];
  return r.goals.activeMin * r.bells.perMinute + r.bells.stepDay + r.bells.strengthDay + DAILY.maxTicks * r.bells.perTick;
}

/** 0–100: how much of a full day this person has earned today (idle life's "doing well" weight). */
export const dayScore = (p: PersonWeekView): number => Math.min(100, Math.round((p.today.bells * 100) / dayMax()));

/** 「30/45分」「6,200/8,000歩」「✓」「2/3」: today against the daily goal. */
export function todayAmount(fruit: FruitKey, f: FruitProgress): string {
  if (fruit === 'coconut') return f.todayMet ? '✓' : '0/1';
  return t(`tree.${fruit}`, { a: formatNum(f.todayActual), g: formatNum(f.todayGoal) });
}

