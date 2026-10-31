import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { MORNING, POSES, POSE_MS, STRETCH_MS, deckOut, isMorning, sawIsland, stretched } from './stretching.ts';
import { MOTION_MS } from '../motion/reactions.ts';

function memKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('the tape deck', () => {
  beforeEach(() => configureStorage({ local: memKV() }));

  it('the morning is 06:00–08:00 (edges: 5 no, 6 and 7 yes, 8 no)', () => {
    expect([4, 5, 6, 7, 8, 9].map(isMorning)).toEqual([false, false, true, true, false, false]);
    expect(MORNING).toEqual({ from: 6, to: 8 });
  });
  it('comes out on a day either of us met Exercise, at any hour', () => {
    expect(deckOut('2026-11-02', 13, false)).toBe(false);
    expect(deckOut('2026-11-02', 13, true)).toBe(true);
    expect(deckOut('2026-11-02', 23, true)).toBe(true);
  });
  it('comes out when the island is open in the morning, and stays out that day after a morning opening', () => {
    expect(deckOut('2026-11-02', 7, false)).toBe(true); // open now, in the morning
    expect(deckOut('2026-11-02', 9, false)).toBe(false); // nobody opened it this morning
    sawIsland('2026-11-02', 5); // too early
    expect(deckOut('2026-11-02', 9, false)).toBe(false);
    sawIsland('2026-11-02', 7);
    expect(deckOut('2026-11-02', 9, false)).toBe(true);
    expect(deckOut('2026-11-02', 22, false)).toBe(true);
    expect(deckOut('2026-11-03', 9, false)).toBe(false); // a new day starts afresh
  });
  it('once a day per phone: after the stretch it goes until tomorrow, even with Exercise met', () => {
    stretched('2026-11-02');
    expect(deckOut('2026-11-02', 7, true)).toBe(false);
    expect(deckOut('2026-11-03', 7, false)).toBe(true);
    expect(deckOut('2026-11-03', 12, true)).toBe(true);
  });
  it('broken storage only brings the deck back (nothing throws)', () => {
    configureStorage({ local: null });
    stretched('2026-11-02');
    expect(deckOut('2026-11-02', 12, true)).toBe(true);
  });
  it('three of NH’s stretches, two seconds each (~6 s), each a motion of that length', () => {
    expect(POSES).toEqual(['warmup', 'sidebend', 'leap']);
    expect(STRETCH_MS).toBe(6000);
    for (const p of POSES) expect(MOTION_MS[p]).toBe(POSE_MS);
  });
});

describe('the routine (director)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('both villagers and the visitor do the same stretch on the same beat, then a note', async () => {
    const { actors, resetAll } = await import('../motion/director.svelte.ts');
    const { groupStretch, stretch } = await import('../motion/stretch.svelte.ts');
    resetAll();
    const done = vi.fn();
    expect(groupStretch(POSES, POSE_MS, done)).toBe(0);
    for (const [i, pose] of POSES.entries()) {
      vi.advanceTimersByTime(i ? POSE_MS : 0);
      expect([actors.mine.motion, actors.partner.motion, stretch.pose]).toEqual([pose, pose, pose]);
    }
    vi.advanceTimersByTime(POSE_MS);
    expect(stretch.pose).toBeNull();
    expect(done).toHaveBeenCalledOnce();
    expect(actors.mine.emote).toBe('mark-note');
  });
  it('a villager out on a stroll walks home first; the routine starts when both are home', async () => {
    const { actors, resetAll, stroll } = await import('../motion/director.svelte.ts');
    const { groupStretch } = await import('../motion/stretch.svelte.ts');
    resetAll();
    stroll('mine', 30);
    expect(actors.mine.walkX).toBe(30);
    const wait = groupStretch(POSES, POSE_MS);
    expect(wait).toBe(1600);
    expect(actors.mine.walkX).toBe(0);
    expect(actors.mine.walking).toBe(true);
    expect(actors.partner.motion).toBeNull();
    vi.advanceTimersByTime(1600);
    expect(actors.mine.walking).toBe(false);
    expect([actors.mine.motion, actors.partner.motion]).toEqual(['warmup', 'warmup']);
  });
  it('a reaction during the routine waits for it (nobody is cut short)', async () => {
    const { actors, react, resetAll, queuedEvents } = await import('../motion/director.svelte.ts');
    const { groupStretch } = await import('../motion/stretch.svelte.ts');
    resetAll();
    groupStretch(POSES, POSE_MS);
    vi.advanceTimersByTime(2100);
    react('R5');
    expect(queuedEvents()).toEqual(['R5']);
    expect([actors.mine.motion, actors.partner.motion]).toEqual(['sidebend', 'sidebend']);
    vi.advanceTimersByTime(2000);
    expect([actors.mine.motion, actors.partner.motion]).toEqual(['leap', 'leap']);
    vi.advanceTimersByTime(2500);
    expect(queuedEvents()).toEqual([]);
  });
  it('sleepers join in and go back to sleep after', async () => {
    const { actors, resetAll, setAsleep } = await import('../motion/director.svelte.ts');
    const { groupStretch } = await import('../motion/stretch.svelte.ts');
    resetAll();
    setAsleep('partner', true);
    groupStretch(POSES, POSE_MS);
    expect(actors.partner.asleep).toBe(false);
    vi.advanceTimersByTime(0);
    expect(actors.partner.motion).toBe('warmup');
    vi.advanceTimersByTime(STRETCH_MS + 2500);
    expect(actors.partner.asleep).toBe(true);
  });
});
