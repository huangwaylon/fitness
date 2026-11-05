import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextChance } from './retry.ts';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('a failed load’s next chance (retry.ts)', () => {
  it('backs off 2 s, doubling, at most a minute', async () => {
    vi.useFakeTimers();
    const at = (n: number) => {
      let done = false;
      void nextChance(n).then(() => (done = true));
      return () => done;
    };
    const first = at(0), fourth = at(3), late = at(10);
    await vi.advanceTimersByTimeAsync(1999);
    expect(first()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(first()).toBe(true);
    await vi.advanceTimersByTimeAsync(16_000 - 2000);
    expect(fourth()).toBe(true);
    expect(late()).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000 - 16_000);
    expect(late()).toBe(true);
  });

  it('at once when the network comes back, or the page comes back to the front', async () => {
    vi.useFakeTimers();
    const win = new EventTarget(), doc = Object.assign(new EventTarget(), { visibilityState: 'hidden' });
    vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
    vi.stubGlobal('removeEventListener', win.removeEventListener.bind(win));
    vi.stubGlobal('document', doc);
    let a = false, b = false;
    void nextChance(5).then(() => (a = true));
    win.dispatchEvent(new Event('online'));
    await Promise.resolve();
    expect(a).toBe(true);
    void nextChance(5).then(() => (b = true));
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(b).toBe(false); // (still hidden)
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(b).toBe(true);
  });
});
