import { afterEach, describe, expect, it, vi } from 'vitest';

// (reload.ts's lazy without its reload: a failed import forgotten, as there)
vi.mock('./reload.ts', () => ({
  lazy: <T>(load: () => Promise<T>) => {
    let p: Promise<T> | null = null;
    return () => (p ??= load().catch((e: unknown) => ((p = null), Promise.reject(e))));
  }
}));
const { lazyComponent, MAX_TRIES } = await import('./lazyComponent.svelte.ts');

afterEach(() => vi.useRealTimers());

describe('lazyComponent', () => {
  it('asks again after a failed load at its next chance, and whoever asked sees it then', async () => {
    vi.useFakeTimers();
    const C = (() => {}) as unknown as import('svelte').Component;
    let fails = 1, loads = 0;
    const lc = lazyComponent(async () => {
      loads++;
      if (fails-- > 0) throw new Error('offline');
      return { default: C };
    });
    // (the next ask comes from whoever read it again: its template, re-run as the failed load's chance came)
    expect(lc.get(true)).toBeNull();
    await vi.advanceTimersByTimeAsync(10);
    expect(loads).toBe(1);
    expect(lc.get(true)).toBeNull(); // (not before its chance)
    await vi.advanceTimersByTimeAsync(10);
    expect(loads).toBe(1);
    await vi.advanceTimersByTimeAsync(2000);
    lc.get(true);
    await vi.advanceTimersByTimeAsync(10);
    expect([loads, lc.get(true)]).toEqual([2, C]);
  });
  it('gives up after MAX_TRIES loads a page (a chunk that keeps failing is not asked for forever)', async () => {
    vi.useFakeTimers();
    let loads = 0;
    const lc = lazyComponent(async () => {
      loads++;
      throw new Error('gone');
    });
    for (let i = 0; i < 20; i++) {
      lc.get(true);
      await vi.advanceTimersByTimeAsync(61_000);
    }
    expect(loads).toBe(MAX_TRIES);
  });
});
