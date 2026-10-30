// Rule versions: compute-on-read re-prices every week a value applies to, so versions in use must never change.
import { describe, expect, it } from 'vitest';
import { RULES, type RuleVersion } from './rules.ts';
import { rulesFor, weekKeyOf } from '#lib/scoring/index.ts';
import { reduce } from '#lib/model/state.ts';
import { economyWeeks, weekBells } from '#lib/model/bells.ts';
import type { SnapshotRows } from '#lib/contract/api.ts';
import rowsJson from '#lib/model/fixtures/timeline-rows.json' with { type: 'json' };

const ROWS = rowsJson as unknown as SnapshotRows;
const END = Date.parse('2027-01-12T15:00:00Z');

/** Run `fn` with an extra version appended (the way a rule change is made), then take it out again. */
function withAppended<T>(list: readonly T[], extra: T, fn: () => void): void {
  (list as T[]).push(extra);
  try {
    fn();
  } finally {
    (list as T[]).pop();
  }
}

/** Every week's earnings (both people, daily + bonus) at END, from a fresh State. */
const earnings = () => {
  const s = reduce(ROWS);
  return economyWeeks(s, END).map((wk) => {
    const w = weekBells(s, wk, END);
    return { weekKey: wk, A: w.A.daily, B: w.B.daily, bonus: w.bonusBells };
  });
};

describe('RULES', () => {
  it('the versions in use are pinned: append a new version instead of editing one', () => {
    // RULES[0] was edited in place, all in the economy's first week (ベル are play money; nothing had paid):
    // 2026-10-30 ADR 0019 amendment (strength 400 ベル, 3-day badge), the same day's goals review (duo per shared
    // badge), and ADR 0021 (five automatic fruits, no check-ins; the 14,400 on-target week). A new version from the
    // current week would have replaced RULES[0] for every week that has ever earned anyway, so it would be the same
    // edit with an unused first entry. From here on, append a version instead.
    expect(RULES[0]).toEqual({
      from: '2026-10-26',
      goals: { exerciseMin: 60, standMin: 180, steps: 8000 },
      bells: { perExerciseMin: 3, moveAtGoal: 180, perStandMin: 1, stepDay: 200, gymDay: 400 },
      badges: { exerciseDays: 5, moveDays: 5, standDays: 5, stepDays: 4, gymDays: 3, bells: 400, duoPerBadge: 200 }
    });
  });

  it('versions start on Mondays, in ascending order; a week takes the latest that has started', () => {
    for (const [i, v] of RULES.entries()) {
      expect(weekKeyOf(v.from)).toBe(v.from);
      if (i > 0) expect(v.from > RULES[i - 1].from).toBe(true);
    }
    expect(rulesFor('2026-10-26')).toBe(RULES[0]); // before the first version (the demo calendar)
    const v2: RuleVersion = { ...RULES[0], from: '2026-12-07', bells: { ...RULES[0].bells, perStandMin: 2 } };
    withAppended(RULES, v2, () => {
      expect(rulesFor('2026-11-30')).toBe(RULES[0]);
      expect(rulesFor('2026-12-07')).toBe(v2);
      expect(rulesFor('2027-06-07')).toBe(v2);
    });
  });

  it('a new version re-prices only the weeks from its `from`, never an earlier week', () => {
    const before = earnings();
    const v2: RuleVersion = {
      ...RULES[0],
      from: '2026-12-07',
      bells: { ...RULES[0].bells, perExerciseMin: 5, stepDay: 300, gymDay: 500 },
      badges: { ...RULES[0].badges, bells: 800 }
    };
    withAppended(RULES, v2, () => {
      const after = earnings();
      expect(after.map((w) => w.weekKey)).toEqual(before.map((w) => w.weekKey));
      const early = (ws: typeof before) => ws.filter((w) => w.weekKey < v2.from);
      expect(early(after)).toEqual(early(before));
      expect(after.filter((w) => w.weekKey >= v2.from)).not.toEqual(before.filter((w) => w.weekKey >= v2.from));
    });
  });
});
