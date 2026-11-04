import { describe, expect, it } from 'vitest';
import { GOALS, goalField, nudge } from './goals.ts';

describe('nudge (GoalEdit −/＋)', () => {
  it('steps one step, from a value off the grid onto it, within the range', () => {
    expect(nudge(GOALS.steps, 8000, 1)).toBe(8500);
    expect(nudge(GOALS.steps, 8000, -1)).toBe(7500);
    expect(nudge(GOALS.move, 537, 1)).toBe(540);
    expect(nudge(GOALS.move, 537, -1)).toBe(530);
    expect(nudge(GOALS.steps, 30000, 1)).toBe(30000);
    expect(nudge(GOALS.steps, 1000, -1)).toBe(1000);
    expect(nudge(GOALS.weight, 65, -1)).toBe(64.5);
    expect(nudge(GOALS.weight, 62.37, 1)).toBe(62.5);
    expect(nudge(GOALS.fat, 19.5, 1)).toBe(20);
  });
  it('what it gives, the field shows and the spec parses back', () => {
    for (const [k, v] of [['steps', 12500], ['move', 600], ['weight', 64.5], ['fat', 20]] as const) {
      expect(GOALS[k].parse(goalField(GOALS[k], v))).toBe(v);
    }
  });
});
