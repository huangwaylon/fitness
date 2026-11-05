import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lazy, newWorker, RELOAD_WINDOW_MS, safeReload } from './reload.ts';

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
    const get = lazy(load, async () => true);
    await expect(get()).rejects.toThrow(TypeError);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(await get()).toBe('mod');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('reloads nothing on a page that is leaving (or offline): its next request fails too', async () => {
    for (const alive of [async () => false, async () => { throw new TypeError('Load failed'); }]) {
      const get = lazy(vi.fn().mockRejectedValue(new TypeError('Importing a module script failed.')), alive);
      await expect(get()).rejects.toThrow(TypeError);
    }
    await new Promise((r) => setTimeout(r, 0));
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('newWorker (a deploy\'s reload waits for its service worker)', () => {
  const container = (o: { controller?: boolean; installs?: boolean; claims?: boolean }) => {
    const listeners: (() => void)[] = [];
    const reg = { installing: null as unknown, waiting: null, update: vi.fn(async () => {
      if (!o.installs) return;
      reg.installing = {};
      if (o.claims) setTimeout(() => listeners.forEach((f) => f()), 10);
    }) };
    const sw = { controller: o.controller ? {} : null, getRegistration: async () => reg, addEventListener: (_: string, f: () => void) => listeners.push(f) };
    return { sw: sw as unknown as ServiceWorkerContainer, reg };
  };
  it('at once with no worker in control (a first visit)', async () => {
    const { sw, reg } = container({});
    await newWorker(sw, 60_000);
    expect(reg.update).not.toHaveBeenCalled();
  });
  it('at once when the worker is already the newest', async () => {
    const { sw, reg } = container({ controller: true });
    await newWorker(sw, 60_000);
    expect(reg.update).toHaveBeenCalledTimes(1);
  });
  it('once the new worker claims the page, once a page', async () => {
    const { sw, reg } = container({ controller: true, installs: true, claims: true });
    const t = Date.now();
    await newWorker(sw, 60_000);
    expect(Date.now() - t).toBeLessThan(1000);
    await newWorker(sw, 60_000);
    expect(reg.update).toHaveBeenCalledTimes(1);
  });
  it('gives up after its wait (the reload then goes ahead)', async () => {
    const { sw } = container({ controller: true, installs: true });
    const t = Date.now();
    await newWorker(sw, 50);
    expect(Date.now() - t).toBeGreaterThanOrEqual(45);
  });
});
