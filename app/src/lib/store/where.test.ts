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

  it('a partner on the island going quiet changes nothing', () => {
    where.peer(false);
    vi.advanceTimersByTime(where.goneMs * 2);
    expect([where.partnerInTent, where.wentHome]).toEqual([false, 0]);
  });
});
