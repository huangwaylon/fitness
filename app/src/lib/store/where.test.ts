import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Relayed } from '#lib/contract/live-protocol.ts';
import { CONFIRM_MS, where } from './where.svelte.ts';

const tent = (inside: boolean) => ({ v: 2, kind: 'tent', in: inside, who: 'B', t: 1 }) as unknown as Relayed;
beforeEach(() => {
  vi.useFakeTimers();
  where.reset();
});
afterEach(() => vi.useRealTimers());

describe('where the partner’s villager is', () => {
  it('in the tent while they say so, out when they leave it', () => {
    where.heard(tent(true));
    expect(where.partnerInTent).toBe(true);
    where.heard(tent(false));
    expect(where.partnerInTent).toBe(false);
  });

  it('which place: a home by its `sc` (none the tent), the museum by `m`, the shop by `s`', () => {
    for (const [sc, place] of [[undefined, 'A'], ['u', 'B'], ['v', 'G'], ['m', 'M'], ['s', 'S']] as const) {
      where.heard({ ...tent(true), ...(sc ? { sc } : {}) } as Relayed);
      expect([where.partnerInTent, where.home.B]).toEqual([true, place]);
    }
    where.heard(tent(false));
    expect(where.home.B).toBeNull();
  });

  it('gone quiet inside: back on the island after the timeout, unless they come back first (and say so)', () => {
    where.presence('B', true);
    where.heard(tent(true));
    where.presence('B', false);
    vi.advanceTimersByTime(where.goneMs - 1);
    expect(where.partnerInTent).toBe(true);
    where.presence('B', true);
    // (their room says where they are to an arrival: rooms/roomLife.ts onPresence `came`)
    where.heard(tent(true));
    vi.advanceTimersByTime(where.goneMs * 2);
    expect(where.partnerInTent).toBe(true);
    where.presence('B', false);
    vi.advanceTimersByTime(where.goneMs);
    expect(where.partnerInTent).toBe(false);
  });

  it('back while thought inside and no word: out after CONFIRM_MS (a lost exit, their other device on the island)', () => {
    where.presence('B', true);
    where.heard(tent(true));
    // still here, said again (status after status): nothing changes
    where.presence('B', true);
    vi.advanceTimersByTime(CONFIRM_MS * 2);
    expect(where.partnerInTent).toBe(true);
    // this phone's own outage (nobody knows: it waits), then back: they don't say they're inside
    where.presence('B', false, null);
    vi.advanceTimersByTime(where.goneMs * 2);
    expect(where.partnerInTent).toBe(true);
    where.presence('B', true);
    vi.advanceTimersByTime(CONFIRM_MS - 1);
    expect(where.partnerInTent).toBe(true);
    where.presence('B', true);
    vi.advanceTimersByTime(1);
    expect([where.partnerInTent, where.home.B]).toEqual([false, null]);
  });

  it('by the relay’s leave time: out when it comes; this phone offline (no time known) waits', () => {
    where.heard(tent(true));
    where.presence('B', false, null);
    vi.advanceTimersByTime(where.goneMs * 2);
    expect(where.partnerInTent).toBe(true);
    where.presence('B', false, 5000);
    where.presence('B', false, 5000); // said again: the same moment
    vi.advanceTimersByTime(4999);
    expect(where.partnerInTent).toBe(true);
    vi.advanceTimersByTime(1);
    expect(where.partnerInTent).toBe(false);
  });

  it('a partner on the island going quiet, or back, changes nothing', () => {
    where.presence('B', true);
    where.presence('B', false);
    vi.advanceTimersByTime(where.goneMs * 2);
    expect(where.partnerInTent).toBe(false);
  });
});
