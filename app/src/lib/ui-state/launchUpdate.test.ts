import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASK_MS, askAtLaunch, askMs, HOLD_MS, launchHold, launchHolding, resetLaunch } from './launchUpdate.ts';

/** A promise settled by the test. */
function later<T>() {
  let ok!: (v: T) => void, no!: (e: unknown) => void;
  const p = new Promise<T>((a, b) => ((ok = a), (no = b)));
  return { p, ok, no };
}
/** Whether `p` has settled after the timers and microtasks so far. */
async function settled(p: Promise<unknown>): Promise<boolean> {
  let done = false;
  void p.then(() => (done = true));
  await vi.advanceTimersByTimeAsync(0);
  return done;
}

let t = 0;
const now = () => t;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  resetLaunch();
  t = 0;
});
afterEach(() => vi.useRealTimers());

describe('a launch the service worker served asks for a newer build (launchUpdate.ts)', () => {
  it('none asked (not the worker\'s page): the island isn\'t held', async () => {
    expect(await settled(launchHold())).toBe(true);
    expect(askMs()).toBeUndefined();
  });

  it('the same build: held only till the answer; no worker asked', async () => {
    const answer = later<boolean>(), worker = vi.fn(async () => true), reload = vi.fn(() => true);
    askAtLaunch({ check: () => answer.p, worker, reload, now });
    expect(await settled(launchHold())).toBe(false);
    t = 140;
    answer.ok(false);
    expect(await settled(launchHold())).toBe(true);
    expect(worker).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(askMs()).toBe(140);
  });

  it('a newer build whose worker comes in: the page reloads into it, the island never built', async () => {
    const answer = later<boolean>(), next = later<boolean>(), reload = vi.fn(() => true);
    askAtLaunch({ check: () => answer.p, worker: () => next.p, reload, now });
    answer.ok(true);
    expect(await settled(launchHold())).toBe(false);
    expect(launchHolding()).toBe(true);
    await vi.advanceTimersByTimeAsync(HOLD_MS - 1);
    next.ok(true);
    expect(await settled(launchHold())).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await settled(launchHold())).toBe(false);
  });

  it('a newer build whose worker is slow (or fails): the island boots the build it has after HOLD_MS, no reload', async () => {
    const next = later<boolean>(), reload = vi.fn(() => true);
    askAtLaunch({ check: async () => true, worker: () => next.p, reload, now });
    await vi.advanceTimersByTimeAsync(HOLD_MS - 1);
    expect(await settled(launchHold())).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await settled(launchHold())).toBe(true);
    expect(launchHolding()).toBe(false);
    next.ok(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(reload).not.toHaveBeenCalled();
    // (a worker that can't be had: at once)
    resetLaunch();
    askAtLaunch({ check: async () => true, worker: async () => false, reload, now });
    expect(await settled(launchHold())).toBe(true);
    expect(reload).not.toHaveBeenCalled();
  });

  it('a slow answer: held ASK_MS at most; a newer build named after it is the layout\'s reload, not the launch\'s', async () => {
    const answer = later<boolean>(), worker = vi.fn(async () => true), reload = vi.fn(() => true);
    askAtLaunch({ check: () => answer.p, worker, reload, now });
    await vi.advanceTimersByTimeAsync(ASK_MS - 1);
    expect(await settled(launchHold())).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await settled(launchHold())).toBe(true);
    answer.ok(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(worker).not.toHaveBeenCalled();
    expect(launchHolding()).toBe(false);
  });

  it('offline (the ask fails) or a reload refused by its loop guard: the island boots', async () => {
    askAtLaunch({ check: () => Promise.reject(new Error('offline')), now });
    expect(await settled(launchHold())).toBe(true);
    resetLaunch();
    const reload = vi.fn(() => false);
    askAtLaunch({ check: async () => true, worker: async () => true, reload, now });
    expect(await settled(launchHold())).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(launchHolding()).toBe(false);
  });

  it('asked once a page load', async () => {
    const check = vi.fn(async () => false);
    askAtLaunch({ check, now });
    askAtLaunch({ check, now });
    expect(check).toHaveBeenCalledTimes(1);
  });
});
