import { describe, expect, it } from 'vitest';
import { outsat } from './seats.ts';

describe('one villager a seat, the first to sit keeps it', () => {
  it('the earlier sit keeps it; the later stands up', () => {
    expect(outsat({ s: 2000, who: 'A' }, { s: 1999, who: 'B' })).toBe(true);
    expect(outsat({ s: 1999, who: 'B' }, { s: 2000, who: 'A' })).toBe(false);
  });
  it('an exact tie (as sent: whole ms) stands only one up, the same on both phones', () => {
    for (const [x, y] of [['A', 'B'], ['A', 'G'], ['B', 'G']] as const) {
      // (each phone: its own sit unrounded, the other's as sent)
      const onX = outsat({ s: 1000.4, who: x }, { s: 1000, who: y }), onY = outsat({ s: 1000.2, who: y }, { s: 1000, who: x });
      expect([onX, onY]).toEqual([false, true]);
    }
  });
});
