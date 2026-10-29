import { RUNGS, type RuleVersion } from '#lib/config/rules.ts';
import type { PersonPayout, WeekPayout, WeekScore } from '#lib/types.ts';
import { rulesFor } from '#lib/scoring/targets.ts';

const person = (score: number, money: RuleVersion['money']): PersonPayout => ({
  score,
  fruitYen: money.yenPerFruit * score,
  purseYen: score >= money.purseMinScore ? money.purseYen : 0
});

/** Weekly yen (ADR 0008), at the week's rule version: ¥50 × own score each, team ¥20 × the lower score, Treat Purse ¥1,000 at ≥ 60. */
export function payoutWeek(a: WeekScore, b: WeekScore): WeekPayout {
  const { money } = rulesFor(a.weekKey);
  return {
    weekKey: a.weekKey,
    A: person(a.score, money),
    B: person(b.score, money),
    teamYen: money.teamYenPerFruit * Math.min(a.score, b.score)
  };
}

/** Next trip rung above `totalYen`, or null past the top. */
export function nextRung(totalYen: number): { key: string; yen: number; remainingYen: number } | null {
  const r = RUNGS.find((x) => x.yen > totalYen);
  return r ? { key: r.key, yen: r.yen, remainingYen: r.yen - totalYen } : null;
}
