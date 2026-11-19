import { describe, expect, it } from 'vitest';
import { goalMark, todayPct } from './progress.ts';
import { ringBells } from '#lib/scoring/bells.ts';

describe('goalMark: the tree popup’s mark per goal', () => {
  it('not met: a dashed ring, nothing paid', () => expect(goalMark({ met: false }, 0)).toEqual({ kind: 'todo', bells: 0 }));
  it('met: ✓, +1', () => expect(goalMark({ met: true }, 1)).toEqual({ kind: 'met', bells: 1 }));
  it('its がんばり paid: the star, +2', () => expect(goalMark({ met: true }, 2)).toEqual({ kind: 'stretch', bells: 2 }));
  it('never pays what isn’t met', () => expect(goalMark({ met: false }, 2).kind).toBe('todo'));
  it('past the cap: three at 1.5×, the third (RING_FRUITS order) shows ✓, so the marks add up to the day’s ベル', () => {
    const met = { pear: true, peach: true, cherry: true, apple: true };
    const rings = ringBells({ met, stretched: { pear: true, peach: false, cherry: true, apple: true } });
    const marks = (['pear', 'peach', 'cherry', 'apple'] as const).map((f) => goalMark({ met: true }, rings[f]));
    expect(marks.map((m) => m.kind)).toEqual(['stretch', 'met', 'stretch', 'met']);
    expect(marks.reduce((a, m) => a + m.bells, 0)).toBe(6);
  });
});

describe('todayPct', () => {
  it('met is 100, else the share, clamped', () => {
    expect(todayPct({ today: 10, goal: 5, met: true })).toBe(100);
    expect(todayPct({ today: 3, goal: 6, met: false })).toBe(50);
    expect(todayPct({ today: 3, goal: 0, met: false })).toBe(0);
  });
});
