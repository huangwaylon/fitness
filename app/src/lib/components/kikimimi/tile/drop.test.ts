import { describe, expect, it } from 'vitest';
import { EMPTY as E } from '#lib/kikimimi/games/listened.ts';
import { dropOn } from './drop.ts';

const all = [0, 1, 2, 3, 4];

describe('a tile let go', () => {
  it('from the pool: onto an empty slot, there (not the next one)', () => {
    expect(dropOn([E, E, E, E, E], all, { tile: 7 }, { slot: 3 })).toEqual([E, E, E, 7, E]);
  });
  it('from the pool onto a filled slot: inserted, my later tiles shifting right into the nearest empty one', () => {
    expect(dropOn([1, 2, E, 3, E], all, { tile: 7 }, { slot: 0 })).toEqual([7, 1, 2, 3, E]);
    expect(dropOn([1, 2, 4, E, 3], all, { tile: 7 }, { slot: 1 })).toEqual([1, 7, 2, 4, 3]);
  });
  it('…with no empty slot after it: the occupant goes back to the pool', () => {
    expect(dropOn([E, 1, 2, 3, 4], all, { tile: 7 }, { slot: 2 })).toEqual([E, 1, 7, 3, 4]);
  });
  it('a placed tile or a cancel target from the pool: nothing changes', () => {
    expect(dropOn([1, E, E], [0, 1, 2], { tile: 1 }, { slot: 1 })).toBeNull();
    expect(dropOn([E, E, E], [0, 1, 2], { tile: 4 }, 'back')).toBeNull();
    expect(dropOn([E, E, E], [0, 2], { tile: 4 }, { slot: 1 })).toBeNull();
    expect(dropOn([E, E, E], [0, 1, 2], { tile: 4 }, null)).toBeNull();
  });
  it('from a slot: onto an empty one, a plain move; back, the slot emptied', () => {
    expect(dropOn([1, 2, E], [0, 1, 2], { slot: 0 }, { slot: 2 })).toEqual([E, 2, 1]);
    expect(dropOn([1, 2, E], [0, 1, 2], { slot: 1 }, 'back')).toEqual([1, E, E]);
  });
  it('from a slot onto a filled one: a list reorder, the tiles between shifting toward the slot it left', () => {
    expect(dropOn([1, 2, 3, 4, 5], all, { slot: 0 }, { slot: 3 })).toEqual([2, 3, 4, 1, 5]);
    expect(dropOn([1, 2, 3, 4, 5], all, { slot: 4 }, { slot: 1 })).toEqual([1, 5, 2, 3, 4]);
  });
  it('onto itself, nowhere, or from an empty slot: nothing changes', () => {
    expect(dropOn([1, 2], [0, 1], { slot: 0 }, { slot: 0 })).toBeNull();
    expect(dropOn([1, 2], [0, 1], { slot: 0 }, null)).toBeNull();
    expect(dropOn([E, 2], [0, 1], { slot: 0 }, { slot: 1 })).toBeNull();
  });
  it('shifts only along my slots: co-op the partner’s are skipped, easy the given one', () => {
    // co-op, role 0: slots 0, 2, 4 (1 and 3 the partner's, EMPTY on my phone)
    expect(dropOn([1, E, 2, E, E], [0, 2, 4], { tile: 7 }, { slot: 0 })).toEqual([7, E, 1, E, 2]);
    expect(dropOn([1, E, 2, E, 3], [0, 2, 4], { slot: 4 }, { slot: 0 })).toEqual([3, E, 1, E, 2]);
    // easy: slot 0 given (kept), mine 1-3
    expect(dropOn([9, 1, 2, E], [1, 2, 3], { tile: 7 }, { slot: 1 })).toEqual([9, 7, 1, 2]);
  });
});
