import { describe, expect, it } from 'vitest';
import { GOAL_PREF_KEYS, PREF_KEYS } from './api.ts';
import { GOAL_DIRS, GOAL_IDS, GOAL_KEYS, GOALS, goalFallback, goalKeysOf, goalMet, goalOfKey, goalOver, goalPrefTaken, isGoalValue } from './goals.ts';

describe('the goal registry', () => {
  it('every goal has a direction, a range on its grid, a key of its own and a default in range', () => {
    const bad: string[] = [];
    for (const id of GOAL_IDS) {
      const g = GOALS[id];
      if (!GOAL_DIRS.includes(g.dir)) bad.push(`${id}: dir`);
      if (!(g.min < g.max) || !isGoalValue(id, g.min) || !isGoalValue(id, g.max)) bad.push(`${id}: range`);
      if ((g.dir === 'target') !== (g.band !== undefined && g.band > 0)) bad.push(`${id}: band`);
      if (g.history === 'daily' && (g.clearable || g.fallback === null)) bad.push(`${id}: a daily goal always has one`);
      for (const p of ['A', 'B'] as const) {
        const f = goalFallback(id, p);
        if (f !== null && !isGoalValue(id, f)) bad.push(`${id}: fallback ${f}`);
      }
      if (goalOfKey(g.key) !== id) bad.push(`${id}: key`);
    }
    expect(bad).toEqual([]);
    expect(new Set(GOAL_KEYS).size).toBe(GOAL_IDS.length);
  });
  it('the contract lists the same keys (it stays dependency-free), and the record reads each', () => {
    expect([...GOAL_PREF_KEYS].sort()).toEqual([...GOAL_KEYS].sort());
    expect(GOAL_KEYS.every((k) => PREF_KEYS.includes(k))).toBe(true);
    expect([goalKeysOf('body'), goalKeysOf('food')]).toEqual([
      ['goalWeight', 'goalBodyFat', 'goalBmi', 'goalLean'], ['kcalGoal', 'proteinGoal', 'fatGoal', 'carbsGoal', 'saltGoal', 'fibreGoal', 'alcoholGoal']
    ]);
  });
  it('the directions chosen (docs/decisions.md "Goal directions")', () => {
    expect(Object.fromEntries(GOAL_IDS.map((id) => [id, GOALS[id].dir]))).toEqual({
      steps: 'atLeast', move: 'atLeast', exercise: 'atLeast', stand: 'atLeast',
      weight: 'target', body_fat_pct: 'atMost', bmi: 'target', lean_kg: 'atLeast',
      k: 'target', p: 'atLeast', fa: 'atMost', c: 'target', s: 'atMost', fi: 'atLeast', al: 'atMost'
    });
  });
  it('values: in range, on the grid; clearing only where it may', () => {
    const got = [
      isGoalValue('steps', 8500), isGoalValue('steps', 8250), isGoalValue('move', 537), isGoalValue('move', 537.5),
      isGoalValue('weight', 65.3), isGoalValue('weight', 65.35), isGoalValue('s', 7.5), isGoalValue('s', 7.3), isGoalValue('k', '2000'),
      isGoalValue('exercise', 30), isGoalValue('exercise', 33), isGoalValue('stand', 120), isGoalValue('bmi', 22.4), isGoalValue('lean_kg', 9.9),
      goalPrefTaken('weight', null), goalPrefTaken('weight', ''), goalPrefTaken('steps', null), goalPrefTaken('k', null)
    ];
    expect(got).toEqual([true, false, true, false, true, false, true, false, false, true, false, true, true, false, true, true, false, true]);
  });
  it('met follows the direction', () => {
    const got = [
      goalMet('steps', 8000, 8000), goalMet('steps', 7999, 8000), goalMet('stand', 119.9, 120), goalMet('stand', 120.4, 120),
      goalMet('s', 7, 7), goalMet('s', 7.1, 7), goalMet('body_fat_pct', 18, 20),
      goalMet('k', 2200, 2000), goalMet('k', 1800, 2000), goalMet('k', 2201, 2000), goalMet('k', 1700, 2000), goalMet('weight', 66.9, 66)
    ];
    expect(got).toEqual([true, false, false, true, true, false, true, true, true, false, false, true]);
    // past a ceiling (ごはん's coral): at most over it, near a value over its band; a floor never
    expect([goalOver('s', 7.5, 7), goalOver('s', 7, 7), goalOver('c', 290, 250), goalOver('c', 280, 250), goalOver('p', 300, 100)]).toEqual([true, false, true, false, false]);
  });
  it('defaults: Move per member, the fixed rings, none for the optional ones', () => {
    expect([goalFallback('move', 'A'), goalFallback('move', 'B'), goalFallback('move', 'G'), goalFallback('steps', 'G'), goalFallback('exercise', 'A'), goalFallback('stand', 'B'), goalFallback('weight', 'A')])
      .toEqual([600, 400, null, 8000, 60, 120, null]);
  });
});
