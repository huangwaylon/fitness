// memberCall's outcomes: a hang and a body that stalls past the 20 s are `timeout`, a caller's abort mid-flight is
// `offline` (AbortSignal.timeout shortened to 20 ms).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { memberCall } from './memberCall.ts';

const orig = AbortSignal.timeout.bind(AbortSignal);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const hang = () => vi.stubGlobal('fetch', vi.fn((_u: string, init?: RequestInit) => new Promise((_, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('x', 'AbortError'))))));

describe('memberCall', () => {
  it('a dead signal sends nothing', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await memberCall('https://x/a', 'GET', undefined, AbortSignal.abort(), 'k')).toMatchObject({ ok: false, err: 'aborted' });
    expect(f).not.toHaveBeenCalled();
  });
  it('a hang past the timeout is timeout', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(20));
    hang();
    expect(await memberCall('https://x/a', 'GET', undefined, undefined, 'k')).toMatchObject({ ok: false, err: 'timeout' });
  });
  it("a caller's abort mid-flight is offline", async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(5000));
    hang();
    const c = new AbortController();
    setTimeout(() => c.abort(), 10);
    expect(await memberCall('https://x/a', 'GET', undefined, c.signal, 'k')).toMatchObject({ ok: false, err: 'offline' });
  });
  it('headers in time, the body stalled past the timeout: timeout, not a 200 without json', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(20));
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init?: RequestInit) => {
      const body = new ReadableStream({ start(ctl) { init?.signal?.addEventListener('abort', () => ctl.error(new DOMException('x', 'AbortError'))); } });
      return new Response(body, { status: 200 });
    }));
    expect(await memberCall('https://x/a', 'GET', undefined, undefined, 'k')).toMatchObject({ ok: false, err: 'timeout' });
  });
  it('an answer in time is ok with its json', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ a: 1 })));
    expect(await memberCall('https://x/a', 'GET', undefined, undefined, 'k')).toMatchObject({ ok: true, json: { a: 1 } });
  });
});
