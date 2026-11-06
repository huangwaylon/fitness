import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { actors, resetAll } from './director.svelte.ts';
import { groupStretch } from './stretch.svelte.ts';
import { setCast, setGuestHere } from '#lib/ui-state/cast.ts';

const POSES = ['warmup', 'sidebend', 'leap'] as const;

describe('group stretching: everyone on the island (2026-11-06)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAll();
  });
  afterEach(() => {
    resetAll();
    setCast('A');
    setGuestHere(false);
    vi.useRealTimers();
  });
  const poses = async () => {
    const seen: Record<string, string[]> = { mine: [], partner: [], third: [] };
    groupStretch(POSES, 1000);
    for (let i = 0; i < POSES.length; i++) {
      await vi.advanceTimersByTimeAsync(i ? 1000 : 1);
      for (const id of ['mine', 'partner', 'third'] as const) seen[id].push(actors[id].motion ?? '');
    }
    return seen;
  };

  it('on the guest’s phone its own villager stretches with both members’', async () => {
    setCast('G');
    const seen = await poses();
    for (const id of ['mine', 'partner', 'third']) expect(seen[id], id).toEqual([...POSES]);
  });

  it('on a member’s phone the guest’s villager joins while it’s here, and not otherwise', async () => {
    setCast('A');
    expect((await poses()).third).toEqual(['', '', '']);
    resetAll();
    setGuestHere(true);
    expect((await poses()).third).toEqual([...POSES]);
  });
});
