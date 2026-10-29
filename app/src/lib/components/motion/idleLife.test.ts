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
});
