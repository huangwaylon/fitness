import { afterEach, describe, expect, it, vi } from 'vitest';
import { madeGL } from './madeGL.ts';

const refused = () => Object.assign(new Error('Error creating WebGL context.'), { name: 'NoWebGL' });

describe("a room's engine made on its canvas", () => {
  afterEach(() => vi.useRealTimers());
  it('asks once more a second after a refused context', async () => {
    vi.useFakeTimers();
    const make = vi.fn().mockImplementationOnce(() => { throw refused(); }).mockReturnValue('engine');
    const p = madeGL(make, () => true);
    await vi.advanceTimersByTimeAsync(999);
    expect(make).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(p).resolves.toBe('engine');
  });
  it('fails on a second refusal, on a room closed meanwhile, and at once on anything else', async () => {
    vi.useFakeTimers();
    const twice = madeGL(() => { throw refused(); }, () => true);
    const closed = vi.fn(() => { throw refused(); });
    const gone = madeGL(closed, () => false);
    const p = Promise.allSettled([twice, gone]);
    await vi.advanceTimersByTimeAsync(1000);
    expect((await p).map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(closed).toHaveBeenCalledTimes(1);
    const bug = vi.fn(() => { throw new TypeError('x'); });
    await expect(madeGL(bug, () => true)).rejects.toThrow(TypeError);
    expect(bug).toHaveBeenCalledTimes(1);
  });
});
