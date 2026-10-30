import { describe, expect, it } from 'vitest';
import { HABITS, RULES, type HabitsVersion } from '#lib/config/rules.ts';
import { habitsFor, rulesFor } from '#lib/scoring/targets.ts';

describe('habitsFor', () => {
  it('both people share the same three habits (ADR 0019 amendment)', () => {
    expect(habitsFor('A', '2026-11-02')).toEqual(['protein_each_meal', 'no_sweets', 'veg_two_meals']);
    expect(habitsFor('B', '2026-11-02')).toEqual(habitsFor('A', '2026-11-02'));
  });
  it('accepts any date in the week; a week before the first version uses the first', () => {
    expect(habitsFor('A', '2026-11-05')).toBe(HABITS[0].people.A.habits);
    expect(habitsFor('B', '2026-08-31')).toBe(HABITS[0].people.B.habits); // the demo's calendar
  });
  it('a later version applies from its week only', () => {
    const v2: HabitsVersion = { from: '2027-03-01', people: { A: { habits: ['a', 'b', 'c'] }, B: HABITS[0].people.B } };
    (HABITS as HabitsVersion[]).push(v2);
    try {
      expect(habitsFor('A', '2027-02-28')).toBe(HABITS[0].people.A.habits); // Sunday of the week before
      expect(habitsFor('A', '2027-03-03')).toEqual(['a', 'b', 'c']);
      expect(habitsFor('B', '2027-03-03')).toBe(HABITS[0].people.B.habits);
    } finally {
      (HABITS as HabitsVersion[]).pop();
    }
  });
});

describe('rulesFor', () => {
  it('the first version before any applies', () => {
    expect(rulesFor('2026-08-31')).toBe(RULES[0]);
    expect(rulesFor('2026-10-26')).toBe(RULES[0]);
  });
});
