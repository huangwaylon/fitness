// Rule versions: compute-on-read re-prices every week a value applies to, so versions in use must never change.
import { describe, expect, it } from 'vitest';
import { HABITS, RULES, type HabitsVersion, type RuleVersion } from './rules.ts';
import { habitsFor, rulesFor, weekKeyOf } from '#lib/scoring/index.ts';
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
    // RULES[0] was edited in place once, on 2026-10-30 (ADR 0019 amendment: strength 400 ベル, 3-day badge): nothing
    // had paid yet (ベル are play money and the economy started that week), so there was no paid week to protect.
    // A second in-place edit the same day (goals review round 12: duo per shared badge) was equally safe. From here
    // on, append a version instead.
    expect(RULES[0]).toEqual({
      from: '2026-10-26',
      goals: { activeMin: 45, steps: 8000, exerciseMin: 60, standMin: 180 },
      bells: { perMinute: 5, stepDay: 200, strengthDay: 400, perTick: 100, perExerciseMin: 3, moveAtGoal: 180, perStandMin: 1, gymDay: 400 },
      badges: {
        activeDays: 5, stepDays: 4, strengthDays: 3, ticks: 15, bells: 500, duoPerBadge: 250,
        exerciseDays: 5, moveDays: 5, standDays: 5, gymDays: 3
      }
    });
    const habits = ['protein_each_meal', 'no_sweets', 'veg_two_meals'];
    expect(HABITS[0]).toEqual({ from: '2026-10-26', people: { A: { habits }, B: { habits } } });
  });

  it('versions start on Mondays, in ascending order; a week takes the latest that has started', () => {
    for (const [i, v] of RULES.entries()) {
      expect(weekKeyOf(v.from)).toBe(v.from);
      if (i > 0) expect(v.from > RULES[i - 1].from).toBe(true);
    }
    expect(rulesFor('2026-10-26')).toBe(RULES[0]); // before the first version (the demo calendar)
    const v2: RuleVersion = { ...RULES[0], from: '2026-12-07', bells: { ...RULES[0].bells, perTick: 120 } };
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
      bells: { ...RULES[0].bells, perMinute: 10, stepDay: 300, strengthDay: 500, perTick: 150 },
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

  it('habits change the same way: a HABITS entry with a later `from`, never an edit in place', () => {
    const later: HabitsVersion = { from: '2027-03-01', people: { A: { habits: ['a', 'b', 'c'] }, B: HABITS[0].people.B } };
    const old = habitsFor('A', '2026-11-16');
    withAppended(HABITS, later, () => {
      expect(habitsFor('A', '2026-11-16')).toEqual(old);
      expect(habitsFor('A', '2027-03-08')).toEqual(['a', 'b', 'c']);
    });
  });
});
