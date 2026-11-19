import { describe, expect, it } from 'vitest';
import { liftFor } from './keyboardInset.svelte.ts';

// a 659 px screen, a 336 px keyboard: 323 px left above it
const kb = { clientTop: 0, height: 323, open: true };

describe('liftFor', () => {
  it('no lift with no keyboard, nor when the box is already above it', () => {
    expect(liftFor({ top: 500, bottom: 600 }, 0, { ...kb, open: false })).toBe(0);
    expect(liftFor({ top: 500, bottom: 600 }, 120, { ...kb, open: false })).toBe(0);
    expect(liftFor({ top: 100, bottom: 200 }, 0, kb)).toBe(0);
  });
  it('lifts the box to 12 px above the keyboard', () => {
    expect(liftFor({ top: 400, bottom: 500 }, 0, kb)).toBe(189);
    // measured lifted already: the same lift
    expect(liftFor({ top: 211, bottom: 311 }, 189, kb)).toBe(189);
  });
  it('lowers it when the box moved up (scrolled, the keyboard shorter), never below 0', () => {
    expect(liftFor({ top: 111, bottom: 211 }, 189, kb)).toBe(89);
    expect(liftFor({ top: 11, bottom: 111 }, 50, kb)).toBe(0);
  });
  it('a box taller than what is left keeps its top in sight', () => {
    expect(liftFor({ top: 400, bottom: 800 }, 0, kb)).toBe(388);
  });
  it('the visible part where the browser scrolled the page (clientTop)', () => {
    expect(liftFor({ top: 400, bottom: 500 }, 0, { clientTop: 100, height: 323, open: true })).toBe(89);
  });
});
