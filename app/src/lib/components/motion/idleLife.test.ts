import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Node has no DOM: stub just what the scheduler touches.
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('addEventListener', vi.fn());
  vi.stubGlobal('removeEventListener', vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('idle life cleanup (P2)', () => {
  it('stop() cancels the chat follow-ups, so nobody is left facing inward', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, pendingTimers, resetAll } = await import('./director.svelte.ts');
    const { IDLE_POOL } = await import('./reactions.ts');
    resetAll();
    vi.setSystemTime(new Date('2026-10-29T12:00:00'));
    // At noon with low scores the pool is everything but stretch and dance: aim the weighted pick at chat.
    const pool = IDLE_POOL.filter((e) => e.action !== 'stretch' && e.action !== 'dance');
    const total = pool.reduce((s, e) => s + e.weight, 0);
    const before = pool.slice(0, pool.findIndex((e) => e.action === 'chat')).reduce((s, e) => s + e.weight, 0);
    // calls: first delay, actor (0.5 → mine), weighted pick, then the chat glyph picks
    const seq = [0, 0.5, (before + 1) / total, 0, 0, 0, 0, 0];
    let calls = 0;
    const stop = startIdleLife({
      paused: () => false,
      asleep: () => false,
      scores: () => [50, 50],
      treeShake: () => {},
      random: () => seq[Math.min(calls++, seq.length - 1)]
    });
    await vi.advanceTimersByTimeAsync(2_600);
    expect(actors.mine.face).toBe('in'); // chat started: facing each other
    await vi.advanceTimersByTimeAsync(400);
    stop();
    // the partner's laugh (at +900 ms) and both "face home" beats (at +3 s) were idle-owned: gone
    await vi.advanceTimersByTimeAsync(60_000);
    expect(actors.partner.face).toBe('home'); // never turned
    expect(actors.mine.face).toBe('in'); // stop() alone doesn't move anyone; resetAll() (scene unmount) does
    expect(pendingTimers('mine') + pendingTimers('partner')).toBe(0);
    resetAll();
    expect(pendingTimers('mine') + pendingTimers('partner') + pendingTimers('host')).toBe(0);
  });

  it('stop() before the first tick schedules nothing', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, resetAll } = await import('./director.svelte.ts');
    resetAll();
    const stop = startIdleLife({ paused: () => false, asleep: () => false, scores: () => [0, 0], treeShake: () => {} });
    stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(actors.mine.motionN + actors.partner.motionN + actors.mine.emoteN + actors.partner.emoteN).toBe(0);
  });

  it('a reaction that preempts an actor also drops the idle-owned cancellers (N8)', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { actors, cancel, resetAll } = await import('./director.svelte.ts');
    const { IDLE_POOL } = await import('./reactions.ts');
    resetAll();
    vi.setSystemTime(new Date('2026-10-29T12:00:00'));
    const pool = IDLE_POOL.filter((e) => e.action !== 'stretch' && e.action !== 'dance');
    const total = pool.reduce((s, e) => s + e.weight, 0);
    const before = pool.slice(0, pool.findIndex((e) => e.action === 'chat')).reduce((s, e) => s + e.weight, 0);
    const seq = [0, 0.5, (before + 1) / total, 0, 0, 0, 0, 0];
    let calls = 0;
    const stop = startIdleLife({
      paused: () => false,
      asleep: () => false,
      scores: () => [50, 50],
      treeShake: () => {},
      random: () => seq[Math.min(calls++, seq.length - 1)]
    });
    await vi.advanceTimersByTimeAsync(2_600);
    expect(actors.mine.face).toBe('in');
    expect(stop.owned()).toBeGreaterThan(0);
    cancel('mine');
    cancel('partner');
    expect(stop.owned()).toBe(0);
    stop();
    resetAll();
  });
});

describe('event queue (v5 §6)', () => {
  it('plays events one at a time; touch feedback never waits', async () => {
    const { react, queuedEvents, actors, resetAll } = await import('./director.svelte.ts');
    resetAll();
    react('R2'); // check-in saved: 2200 ms
    react('R3'); // partner data arrives meanwhile: queued
    react('R3'); // duplicate: dropped
    expect(queuedEvents()).toEqual(['R3']);
    const n = actors.partner.motionN;
    react('R10'); // tapping the partner plays now
    expect(actors.partner.motionN).toBe(n + 1);
    await vi.advanceTimersByTimeAsync(2_700);
    expect(queuedEvents()).toEqual([]);
    expect(actors.partner.emote).toBe('surprise'); // R3 started after R2 + the gap
    resetAll();
    expect(queuedEvents()).toEqual([]);
  });
});

describe('idle life while the page is hidden (round 16 M11)', () => {
  it('stops its timer on hide (no polling) and wakes on show', async () => {
    const { startIdleLife } = await import('./idleLife.svelte.ts');
    const { resetAll } = await import('./director.svelte.ts');
    resetAll();
    const doc = document as unknown as { hidden: boolean; addEventListener: ReturnType<typeof vi.fn> };
    let ticks = 0;
    const stop = startIdleLife({ paused: () => (ticks++, false), asleep: () => false, scores: () => [0, 0], treeShake: () => {} });
    const onVis = doc.addEventListener.mock.calls.find((c) => c[0] === 'visibilitychange')![1] as () => void;
    doc.hidden = true;
    onVis();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(600_000);
    expect(ticks).toBe(0);
    doc.hidden = false;
    onVis();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(ticks).toBeGreaterThan(0);
    stop();
  });
});
