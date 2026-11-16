import { describe, expect, it } from 'vitest';
import { partWay, type Saved } from './session.ts';

const at = (n: number, ids = ['g1', 'n1', 'x1']): Saved => ({ v: 'v', ids, at: n, st: [], unsent: 0, perQ: {}, sent: null, t: 0 });

describe('partWay (home’s 続きから)', () => {
  it('is a question of the play, never the watch card or its まとめ', () => {
    expect(partWay(null)).toBe(false);
    expect(partWay(at(-1))).toBe(false);
    expect(partWay(at(0))).toBe(true);
    expect(partWay(at(2))).toBe(true);
    // まとめ: the play's own length (3 here, drawn from a bank of 21), not the bank's
    expect(partWay(at(3))).toBe(false);
  });
  it('is never a play whose まとめ was reached, even one gone back from after it (its next opening draws the next)', () => {
    expect(partWay({ ...at(1), sent: '2026-11-16' })).toBe(false);
  });
});
