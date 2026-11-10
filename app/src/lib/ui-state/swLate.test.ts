import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fresh = async () => {
  vi.resetModules();
  return import('./swLate.ts');
};
const container = () => ({ register: vi.fn(() => Promise.resolve({})) });
const tick = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the service worker registered late (swLate)', () => {
  it('on the island: once the island releases it, not before', async () => {
    const { registerLate, releaseWorker } = await fresh();
    const sw = container();
    registerLate(true, sw as unknown as ServiceWorkerContainer);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sw.register).not.toHaveBeenCalled();
    releaseWorker();
    await tick();
    expect(sw.register).toHaveBeenCalledTimes(1);
    expect(sw.register.mock.calls[0]).toEqual([expect.stringMatching(/\/service-worker\.js$/), { type: 'module' }]);
  });

  it('on the island: by ISLAND_CAP_MS whatever the island does; a release before the start counts', async () => {
    const { ISLAND_CAP_MS, registerLate } = await fresh();
    const sw = container();
    registerLate(true, sw as unknown as ServiceWorkerContainer);
    await vi.advanceTimersByTimeAsync(ISLAND_CAP_MS - 1);
    expect(sw.register).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(sw.register).toHaveBeenCalledTimes(1);

    const late = await fresh(), sw2 = container();
    late.releaseWorker();
    late.registerLate(true, sw2 as unknown as ServiceWorkerContainer);
    await tick();
    expect(sw2.register).toHaveBeenCalledTimes(1);
  });

  it('off the island: IDLE_MS after the window loads', async () => {
    const { IDLE_MS, registerLate } = await fresh();
    let onLoad = () => {};
    vi.stubGlobal('document', { readyState: 'interactive' });
    vi.stubGlobal('addEventListener', (type: string, f: () => void) => type === 'load' && (onLoad = f));
    const sw = container();
    registerLate(false, sw as unknown as ServiceWorkerContainer);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sw.register).not.toHaveBeenCalled();
    onLoad();
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(sw.register).toHaveBeenCalledTimes(1);
  });

  it('workerControls: once registered and active, whether it controls the page', async () => {
    const { registerLate, releaseWorker, workerControls } = await fresh();
    const sw = { ...container(), ready: Promise.resolve({}), controller: {} };
    let got: boolean | undefined;
    void workerControls().then((v) => (got = v));
    registerLate(true, sw as unknown as ServiceWorkerContainer);
    await tick();
    expect(got).toBeUndefined();
    releaseWorker();
    await tick();
    expect(got).toBe(true);

    const first = await fresh(), sw2 = { ...container(), ready: Promise.resolve({}), controller: null };
    let got2: boolean | undefined;
    void first.workerControls().then((v) => (got2 = v));
    first.releaseWorker();
    first.registerLate(true, sw2 as unknown as ServiceWorkerContainer);
    await tick();
    expect(got2).toBe(false);
  });

  it('a page it didn\'t control (a first launch) tells the active worker what it fetched; a controlled one doesn\'t', async () => {
    vi.stubGlobal('performance', { setResourceTimingBufferSize: vi.fn(), getEntriesByType: (t: string) => (t === 'resource' ? [{ name: 'https://x/room/a.glb?v=1' }, { name: 'https://x/art/b.webp' }] : []) });
    for (const controller of [null, {}]) {
      const m = await fresh(), post = vi.fn();
      m.releaseWorker();
      m.registerLate(true, { ...container(), ready: Promise.resolve({ active: { postMessage: post } }), controller } as unknown as ServiceWorkerContainer);
      await tick();
      expect(post.mock.calls).toEqual(controller ? [] : [[{ k: 'warm', urls: ['https://x/room/a.glb?v=1', 'https://x/art/b.webp'] }]]);
    }
    expect(performance.setResourceTimingBufferSize).toHaveBeenCalledTimes(1);
  });

  it('no service workers (a private window, an old browser): nothing', async () => {
    const { registerLate } = await fresh();
    expect(() => registerLate(true, undefined)).not.toThrow();
  });
});
