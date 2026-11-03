import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Relayed } from '#lib/sync/live-protocol.ts';
import { where } from './where.svelte.ts';

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

  it('which place: a home by its `sc` (none the tent), the museum by `m`', () => {
    for (const [sc, place] of [[undefined, 'A'], ['u', 'B'], ['v', 'G'], ['m', 'M']] as const) {
      where.heard({ ...tent(true), ...(sc ? { sc } : {}) } as Relayed);
      expect([where.partnerInTent, where.home.B]).toEqual([true, place]);
    }
    where.heard(tent(false));
    expect(where.home.B).toBeNull();
  });

  it('gone quiet inside: home on the island after the timeout, unless they come back first', () => {
    where.heard(tent(true));
    where.peer(false);
    vi.advanceTimersByTime(where.goneMs - 1);
    expect(where.partnerInTent).toBe(true);
    where.peer(true);
    vi.advanceTimersByTime(where.goneMs * 2);
    expect([where.partnerInTent, where.wentHome]).toEqual([true, 0]);
    where.peer(false);
    vi.advanceTimersByTime(where.goneMs);
    expect([where.partnerInTent, where.wentHome]).toEqual([false, 1]);
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
    expect([where.partnerInTent, where.wentHome]).toEqual([false, 1]);
  });

  it('a partner on the island going quiet changes nothing', () => {
    where.peer(false);
    vi.advanceTimersByTime(where.goneMs * 2);
    expect([where.partnerInTent, where.wentHome]).toEqual([false, 0]);
  });
});
