import { describe, expect, it } from 'vitest';
import { once } from './once.ts';

describe('once', () => {
  it('loads once while it holds, again after a failure', async () => {
    let n = 0;
    const fail = [true];
    const get = once(() => (n++, fail.shift() ? Promise.reject(new Error('offline')) : Promise.resolve(n)));
    await expect(get()).rejects.toThrow('offline');
    const [a, b] = [get(), get()];
    expect(a).toBe(b);
    expect(await a).toBe(2);
    expect(await get()).toBe(2);
    expect(n).toBe(2);
  });
});
