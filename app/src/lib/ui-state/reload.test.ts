import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lazy, RELOAD_WINDOW_MS, safeReload } from './reload.ts';

const reload = vi.fn();
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v)
  });
  vi.stubGlobal('location', { reload });
});
afterEach(() => {
  vi.unstubAllGlobals();
  reload.mockReset();
});

describe('safeReload', () => {
  it('reloads once per window, then again after it', () => {
    expect(safeReload(1_000_000)).toBe(true);
    expect(safeReload(1_000_000 + RELOAD_WINDOW_MS - 1)).toBe(false);
    expect(safeReload(1_000_000 + RELOAD_WINDOW_MS)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('never reloads without storage (no loop guard)', () => {
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => {} });
    expect(safeReload()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('lazy', () => {
  it('memoises a successful load', async () => {
    const load = vi.fn(async () => 'mod');
    const get = lazy(load);
    expect(await get()).toBe('mod');
    expect(await get()).toBe('mod');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('forgets a failed load (the next call retries) and reloads once', async () => {
    const load = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module')).mockResolvedValue('mod');
    const get = lazy(load);
    await expect(get()).rejects.toThrow(TypeError);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(await get()).toBe('mod');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
