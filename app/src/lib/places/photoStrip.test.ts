import { describe, expect, it } from 'vitest';
import { reachOf, shownOf } from './photoStrip.ts';

// the card's strip on an iPhone 15 (a ~357 px view, 266 px cells, 8 px gaps); the viewer's full-width pages
const VIEW = 357, STEP = 274;

describe('reachOf (the cells that may load)', () => {
  it('only the first till it is done, however wide the view', () => {
    expect(reachOf(0, VIEW, STEP, 10, false)).toBe(0);
    expect(reachOf(STEP * 4, VIEW, STEP, 10, false)).toBe(0);
  });
  it('then the cells in view plus one ahead: the first and the peeking second, so the third', () => {
    expect(reachOf(0, VIEW, STEP, 10, true)).toBe(2);
    // scrolled to the 4th (index 3) centred: the 3rd–5th in view, the 6th ahead
    expect(reachOf(3 * STEP - (VIEW - 266) / 2, VIEW, STEP, 10, true)).toBe(5);
    expect(reachOf(9 * STEP, VIEW, STEP, 10, true)).toBe(9);
  });
  it('a full-width viewer page: the shown one and the next; never past the last, none for none', () => {
    expect(reachOf(0, 393, 393, 10, true)).toBe(1);
    expect(reachOf(4 * 393, 393, 393, 10, true)).toBe(5);
    expect(reachOf(9 * 393, 393, 393, 10, true)).toBe(9);
    expect(reachOf(0, 393, 393, 1, true)).toBe(0);
    expect(reachOf(0, 393, 393, 0, true)).toBe(0);
  });
});

describe('shownOf (the shown cell)', () => {
  it('the nearest snap position, clamped', () => {
    expect(shownOf(0, STEP, 10)).toBe(0);
    expect(shownOf(STEP * 0.6, STEP, 10)).toBe(1);
    expect(shownOf(STEP * 20, STEP, 10)).toBe(9);
    expect(shownOf(-30, STEP, 10)).toBe(0);
    expect(shownOf(5, 0, 10)).toBe(0);
  });
});
