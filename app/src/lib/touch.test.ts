import { describe, expect, it } from 'vitest';
import { REACH, rubber } from './touch.ts';

describe('the rubber band', () => {
  it('gives less and less past an edge, never its reach, as the island\'s old (1 - 1/(o/160 + 1)) * 160', () => {
    for (const o of [0, 1, 40, 160, 1000]) expect(rubber(o)).toBeCloseTo((1 - 1 / (o / 160 + 1)) * 160, 9);
    expect(rubber(-5)).toBe(0);
    expect(rubber(1e9)).toBeLessThan(REACH);
  });
});
