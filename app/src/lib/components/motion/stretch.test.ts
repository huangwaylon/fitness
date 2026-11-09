import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { actors, resetAll } from './director.svelte.ts';
import { groupStretch } from './stretch.svelte.ts';
import { setCast, setPresence } from '#lib/ui-state/cast.ts';

const POSES = ['warmup', 'sidebend', 'leap'] as const;

describe('group stretching: everyone awake on the island (2026-11-06; awake while online: 2026-11-09)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAll();
  });
  afterEach(() => {
    resetAll();
    setCast('A');
    setPresence({ connected: true, here: [] });
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

  it('on the guest’s phone its own villager stretches with both members’ (their apps open)', async () => {
    setCast('G');
    setPresence({ connected: true, here: ['A', 'B'] });
    const seen = await poses();
    for (const id of ['mine', 'partner', 'third']) expect(seen[id], id).toEqual([...POSES]);
  });

  it('on a member’s phone the guest’s villager joins while it’s here, and not otherwise', async () => {
    setCast('A');
    setPresence({ connected: true, here: ['B'] });
    expect((await poses()).third).toEqual(['', '', '']);
    resetAll();
    setPresence({ connected: true, here: ['B', 'G'] });
    expect((await poses()).third).toEqual([...POSES]);
  });
});
