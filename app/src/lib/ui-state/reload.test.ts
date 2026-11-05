import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isChunkError, lazy, newWorker, reloadUnlessLeaving, RELOAD_WINDOW_MS, safeReload } from './reload.ts';

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

  it('forgets a failed load (the next call retries) and reloads once into a newer deployed build', async () => {
    const load = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module')).mockResolvedValue('mod');
    const get = lazy(load, async () => 'next');
    await expect(get()).rejects.toThrow(TypeError);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(await get()).toBe('mod');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('reloads nothing on a page that is leaving (or offline): version.json not fetched', async () => {
    for (const deployedNow of [async () => null, async () => { throw new TypeError('Load failed'); }]) {
      const get = lazy(vi.fn().mockRejectedValue(new TypeError('Importing a module script failed.')), deployedNow);
      await expect(get()).rejects.toThrow(TypeError);
    }
    await new Promise((r) => setTimeout(r, 0));
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('isChunkError (only a chunk not fetched reloads)', () => {
  it('the browsers\' module-load TypeErrors and Vite\'s CSS preload', () => {
    for (const m of ['Failed to fetch dynamically imported module: https://x/_app/immutable/chunks/a.js', 'Importing a module script failed.', 'error loading dynamically imported module: https://x/a.js'])
      expect(isChunkError(new TypeError(m)), m).toBe(true);
    expect(isChunkError(new Error('Unable to preload CSS for /_app/immutable/assets/a.css'))).toBe(true);
  });
  it('not a module that threw as it ran, nor anything else', () => {
    for (const e of [new TypeError("Cannot read properties of undefined (reading 'x')"), new TypeError('undefined is not an object'), new Error('boom'), new SyntaxError('Unexpected token'), 'x', null, undefined])
      expect(isChunkError(e), String(e)).toBe(false);
  });
  it('lazy reloads nothing for a module that threw (the sound\'s renderer, a JSON chunk), still forgets it', async () => {
    const load = vi.fn().mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'ctx')")).mockResolvedValue('mod');
    const deployedNow = vi.fn(async () => 'next');
    const get = lazy(load, deployedNow);
    await expect(get()).rejects.toThrow(TypeError);
    await new Promise((r) => setTimeout(r, 0));
    expect(deployedNow).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(await get()).toBe('mod');
  });
});

describe('reloadUnlessLeaving (a chunk that failed)', () => {
  it('reloads nothing when the deployed build is the running one (a reload into it cures nothing)', async () => {
    expect(await reloadUnlessLeaving(async () => 'v1', 'v1')).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
  it('once a deployed version a session, however many failures and windows', async () => {
    vi.useFakeTimers();
    try {
      expect(await reloadUnlessLeaving(async () => 'v2', 'v1')).toBe(true);
      // (the reload came back to the old build: the old shell still cached, the chunk still failing)
      vi.advanceTimersByTime(10 * RELOAD_WINDOW_MS);
      for (let i = 0; i < 5; i++) expect(await reloadUnlessLeaving(async () => 'v2', 'v1')).toBe(false);
      expect(reload).toHaveBeenCalledTimes(1);
      // a newer deploy still gets its one
      expect(await reloadUnlessLeaving(async () => 'v3', 'v1')).toBe(true);
      expect(reload).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('newWorker (a deploy\'s reload waits for its service worker)', () => {
  type Outcome = 'claims' | 'fails' | 'hangs';
  const container = (o: { controller?: boolean; installs?: Outcome; offline?: boolean }) => {
    const listeners: (() => void)[] = [];
    const worker = { state: 'installing', on: [] as (() => void)[], addEventListener(_: string, f: () => void) { this.on.push(f); } };
    const reg = { installing: null as unknown, waiting: null, update: vi.fn(async () => {
      if (o.offline) throw new TypeError('Failed to update a ServiceWorker');
      if (!o.installs) return;
      reg.installing = worker;
      if (o.installs === 'claims') setTimeout(() => listeners.forEach((f) => f()), 10);
      if (o.installs === 'fails') setTimeout(() => ((worker.state = 'redundant'), worker.on.forEach((f) => f())), 10);
    }) };
    const sw = { controller: o.controller ? {} : null, getRegistration: async () => reg, addEventListener: (_: string, f: () => void) => listeners.push(f) };
    return { sw: sw as unknown as ServiceWorkerContainer, reg };
  };
  it('at once with no worker in control (a first visit)', async () => {
    const { sw, reg } = container({});
    expect(await newWorker(sw)).toBe(true);
    expect(reg.update).not.toHaveBeenCalled();
  });
  it('at once when the worker is already the newest', async () => {
    const { sw, reg } = container({ controller: true });
    expect(await newWorker(sw)).toBe(true);
    expect(reg.update).toHaveBeenCalledTimes(1);
  });
  it('once the new worker claims the page, once a page', async () => {
    const { sw, reg } = container({ controller: true, installs: 'claims' });
    const t = Date.now();
    expect(await newWorker(sw)).toBe(true);
    expect(Date.now() - t).toBeLessThan(1000);
    expect(await newWorker(sw)).toBe(true);
    expect(reg.update).toHaveBeenCalledTimes(1);
  });
  it('never on a timer: a slow install is waited for, however long', async () => {
    vi.useFakeTimers();
    try {
      const { sw } = container({ controller: true, installs: 'hangs' });
      let done = false;
      void newWorker(sw).then(() => (done = true));
      await vi.advanceTimersByTimeAsync(10 * 60_000);
      expect(done).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
  it('false when the install fails or the update can\'t be fetched; the next call asks again', async () => {
    for (const o of [{ installs: 'fails' as const }, { offline: true }]) {
      const { sw, reg } = container({ controller: true, ...o });
      expect(await newWorker(sw)).toBe(false);
      expect(await newWorker(sw)).toBe(false);
      expect(reg.update).toHaveBeenCalledTimes(2);
    }
  });
});
