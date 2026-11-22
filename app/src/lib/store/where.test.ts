import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Relayed } from '#lib/contract/live-protocol.ts';
import { CONFIRM_MS, where } from './where.svelte.ts';
import { log } from '#lib/sync/log.ts';

vi.mock('#lib/sync/log.ts', async (orig) => ({ ...(await orig<typeof import('#lib/sync/log.ts')>()), log: vi.fn() }));

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
    for (const [sc, place] of [[undefined, 'A'], ['u', 'B'], ['v', 'G'], ['m', 'M'], ['s', 'S'], ['x', 'X']] as const) {
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

describe('where: each change logged (where.change, 2026-11-22: two phones\' views of one person told apart)', () => {
  beforeEach(() => vi.mocked(log).mockClear());
  const changes = () => vi.mocked(log).mock.calls.filter((c) => c[0] === 'where.change').map((c) => c[1]);

  it('a place heard (once: the same again is no news), somewhere this build doesn\'t know (X), gone quiet inside', () => {
    where.heard(tent(true));
    where.heard(tent(true));
    where.heard({ ...tent(true), sc: 'x' } as Relayed);
    where.heard(tent(false));
    where.heard({ ...tent(true), sc: 'm' } as Relayed);
    where.presence('B', false, 1000);
    vi.advanceTimersByTime(1000);
    expect(changes()).toEqual([
      { who: 'B', place: 'A', src: 'tent' }, { who: 'B', place: 'X', src: 'tent' }, { who: 'B', place: 'island', src: 'tent' },
      { who: 'B', place: 'M', src: 'tent' }, { who: 'B', place: 'island', src: 'gone' }
    ]);
  });
});

describe('where: the last `tent` heard, for a room opened later (tentOf)', () => {
  it('kept while they are inside, gone once they are out', () => {
    const seated = { v: 3, kind: 'tent', in: true, to: [0, 10], seat: 'dmh1sofa01', n: 1, who: 'B', t: 1 } as unknown as Relayed;
    expect(where.tentOf('B')).toBeNull();
    where.heard(seated);
    expect(where.tentOf('B')).toEqual(seated);
    where.heard(tent(false));
    expect(where.tentOf('B')).toBeNull();
  });
});
