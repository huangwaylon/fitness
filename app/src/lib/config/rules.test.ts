// Rule versions: compute-on-read re-prices every week a value applies to, so paid versions must never change.
import { describe, expect, it } from 'vitest';
import { RULES, SEASONS, type RuleVersion, type Season } from './rules.ts';
import { rulesFor, targetsFor, weekKeyOf } from '#lib/scoring/index.ts';
import { reduce } from '#lib/model/state.ts';
import { settledWeeks } from '#lib/model/week.ts';
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

describe('RULES', () => {
  it('the paid versions are pinned: append a new version instead of editing one', () => {
    expect(RULES[0]).toEqual({
      from: '2026-11-02',
      money: { yenPerFruit: 50, teamYenPerFruit: 20, purseYen: 1000, purseMinScore: 60 },
      points: { peachActive: 30, peachRest: 5, coconut: 25, apple: 15, pear: 25 }
    });
  });

  it('versions start on Mondays, in ascending order; a week takes the latest that has started', () => {
    for (const [i, v] of RULES.entries()) {
      expect(weekKeyOf(v.from)).toBe(v.from);
      if (i > 0) expect(v.from > RULES[i - 1].from).toBe(true);
    }
    expect(rulesFor('2026-10-26')).toBe(RULES[0]); // before the first version (the demo calendar)
    const v2: RuleVersion = { ...RULES[0], from: '2026-12-07', money: { ...RULES[0].money, yenPerFruit: 60 } };
    withAppended(RULES, v2, () => {
      expect(rulesFor('2026-11-30')).toBe(RULES[0]);
      expect(rulesFor('2026-12-07')).toBe(v2);
      expect(rulesFor('2027-06-07')).toBe(v2);
    });
  });

  it('a new version re-prices only the weeks from its `from`, never a week paid before it', () => {
    const before = settledWeeks(reduce(ROWS), END);
    const v2: RuleVersion = {
      from: '2026-12-07',
      money: { yenPerFruit: 100, teamYenPerFruit: 40, purseYen: 2000, purseMinScore: 60 },
      points: { peachActive: 40, peachRest: 5, coconut: 20, apple: 15, pear: 20 }
    };
    withAppended(RULES, v2, () => {
      const after = settledWeeks(reduce(ROWS), END);
      expect(after.map((w) => w.weekKey)).toEqual(before.map((w) => w.weekKey));
      const early = (ws: typeof before) => ws.filter((w) => w.weekKey < v2.from);
      expect(early(after)).toEqual(early(before));
      expect(after.filter((w) => w.weekKey >= v2.from)).not.toEqual(before.filter((w) => w.weekKey >= v2.from));
    });
  });

  it('targets change the same way: a SEASONS entry with a later `from`, never an edit in place', () => {
    const later: Season = { key: 's2', from: '2027-03-01', targets: { A: { ...SEASONS[0].targets.A, stepGoal: 9000 }, B: SEASONS[0].targets.B } };
    const old = targetsFor('A', '2026-11-16');
    withAppended(SEASONS, later, () => {
      expect(targetsFor('A', '2026-11-16')).toEqual(old);
      expect(targetsFor('A', '2027-03-08').stepGoal).toBe(9000);
    });
  });
});
