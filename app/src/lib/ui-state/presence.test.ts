import { describe, expect, it } from 'vitest';
import { GRACE_MS, WAKE_MS, awakeIn, nextTurn, onlineIn, seenSince } from './presence.ts';

describe('presence → sleep (2026-11-09: online awake, offline asleep, a tap wakes one for a minute)', () => {
  it('here: online; gone: online for the grace, then not; never heard of: not', () => {
    const s = { here: ['B'] as const, gone: { G: 100_000 } };
    expect(onlineIn(s, 'B', 0)).toBe(true);
    expect(onlineIn(s, 'G', 100_000 + GRACE_MS - 1)).toBe(true);
    expect(onlineIn(s, 'G', 100_000 + GRACE_MS)).toBe(false);
    expect(onlineIn(s, 'A', 0)).toBe(false);
    expect(onlineIn(null, 'B', 0)).toBe(false);
  });

  it('a wake keeps one up WAKE_MS from its `at`, never before it', () => {
    const s = { here: [] };
    expect(awakeIn(s, { A: 10_000 }, 'A', 10_000)).toBe(true);
    expect(awakeIn(s, { A: 10_000 }, 'A', 10_000 + WAKE_MS - 1)).toBe(true);
    expect(awakeIn(s, { A: 10_000 }, 'A', 10_000 + WAKE_MS)).toBe(false);
    expect(awakeIn(s, { A: 10_000 }, 'A', 9_000)).toBe(false);
  });

  it('the next turn: the soonest grace or wake to run out', () => {
    expect(nextTurn({ here: [], gone: { B: 0 } }, { G: 0 }, 1)).toBe(GRACE_MS);
    expect(nextTurn({ here: ['B'], gone: { B: 0 } }, {}, 1)).toBe(null); // (here: no grace runs)
    expect(nextTurn({ here: [] }, { G: 0 }, 1)).toBe(WAKE_MS);
    expect(nextTurn({ here: [], gone: { B: 0 } }, {}, GRACE_MS)).toBe(null);
  });

  it('two phones’ views agree: the same word from the relay at the same instant, the same sleepers', () => {
    // the relay's `gone` is its own clock's: both phones (their clocks corrected to it) flip at the same instant
    const room = { here: [] as const, gone: { B: 500_000 } };
    for (const t of [500_000, 500_000 + GRACE_MS - 1, 500_000 + GRACE_MS]) expect(onlineIn(room, 'B', t)).toBe(onlineIn({ ...room }, 'B', t));
  });

  it('kept across a reload: those here then count as gone then', () => {
    expect(seenSince({ here: ['B'], gone: { G: 5 } }, 1_000)).toEqual({ here: [], gone: { G: 5, B: 1_000 } });
  });
});
