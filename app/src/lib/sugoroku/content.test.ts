import { describe, expect, it, vi } from 'vitest';
import { retryOnce } from './content.ts';

describe('retryOnce (すごろく content: one quick retry, then the caller)', () => {
  it('a failure online is tried once more after the wait, and that try wins', async () => {
    vi.useFakeTimers();
    let n = 0;
    const load = vi.fn(() => (++n === 1 ? Promise.reject(new Error('dropped')) : Promise.resolve('ok')));
    const p = retryOnce(load, 1000, () => true);
    await vi.advanceTimersByTimeAsync(999);
    expect(load).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(p).resolves.toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
  it('a second failure is passed on (the screen shows もう一度); never a third try', async () => {
    vi.useFakeTimers();
    const load = vi.fn(() => Promise.reject(new Error('down')));
    const p = retryOnce(load, 1000, () => true);
    const done = expect(p).rejects.toThrow('down');
    await vi.advanceTimersByTimeAsync(5000);
    await done;
    expect(load).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
  it('offline: no retry, the failure at once', async () => {
    const load = vi.fn(() => Promise.reject(new Error('offline')));
    await expect(retryOnce(load, 1000, () => false)).rejects.toThrow('offline');
    expect(load).toHaveBeenCalledTimes(1);
  });
});
