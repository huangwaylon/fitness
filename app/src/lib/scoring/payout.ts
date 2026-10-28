import { MONEY, RUNGS } from '#lib/config/rules.ts';
import type { PersonPayout, WeekPayout, WeekScore } from '#lib/types.ts';

const person = (score: number): PersonPayout => ({
  score,
  fruitYen: MONEY.yenPerFruit * score,
  purseYen: score >= MONEY.purseMinScore ? MONEY.purseYen : 0
});

/** Weekly yen (ADR 0008): ¥50 × own score each, team ¥20 × the lower score, Treat Purse ¥1,000 at ≥ 60. */
export function payoutWeek(a: WeekScore, b: WeekScore): WeekPayout {
  return {
    weekKey: a.weekKey,
    A: person(a.score),
    B: person(b.score),
    teamYen: MONEY.teamYenPerFruit * Math.min(a.score, b.score)
  };
}

/** Next trip rung above `totalYen`, or null past the top. */
export function nextRung(totalYen: number): { key: string; yen: number; remainingYen: number } | null {
  const r = RUNGS.find((x) => x.yen > totalYen);
  return r ? { key: r.key, yen: r.yen, remainingYen: r.yen - totalYen } : null;
}
