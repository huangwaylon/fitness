// fetchPublic's outcomes: a hang past the 20 s is `timeout` (logged), a caller's abort isn't logged, a bad body is
// `json` (AbortSignal.timeout shortened to 20 ms).
import { afterEach, describe, expect, it, vi } from 'vitest';

const log = vi.hoisted(() => vi.fn());
vi.mock('#lib/sync/log.ts', () => ({ log }));
const { fetchPublic } = await import('./fetchPublic.ts');

const orig = AbortSignal.timeout.bind(AbortSignal);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  log.mockClear();
});
const hang = () => vi.stubGlobal('fetch', vi.fn((_u: string, init?: RequestInit) => new Promise((_, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('x', 'AbortError'))))));
const parse = (x: unknown) => (x && typeof x === 'object' && 'v' in x ? x : null);

describe('fetchPublic', () => {
  it('a hang past the timeout is timeout, logged', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(20));
    hang();
    expect(await fetchPublic('https://x/s', 'gym.fail', parse)).toEqual({ ok: false, err: 'timeout', http: null });
    expect(log).toHaveBeenCalledWith('gym.fail', expect.objectContaining({ op: 'status', err: 'timeout' }), 2);
  });
  it('headers in time, the body stalled past the timeout: timeout', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(20));
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init?: RequestInit) => {
      const body = new ReadableStream({ start(ctl) { init?.signal?.addEventListener('abort', () => ctl.error(new DOMException('x', 'AbortError'))); } });
      return new Response(body, { status: 200 });
    }));
    expect(await fetchPublic('https://x/s', 'kalori.fail', parse)).toMatchObject({ ok: false, err: 'timeout' });
  });
  it("a caller's abort mid-flight is offline, not logged", async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(5000));
    hang();
    const c = new AbortController();
    setTimeout(() => c.abort(), 10);
    expect(await fetchPublic('https://x/s', 'gym.fail', parse, { signal: c.signal })).toMatchObject({ ok: false, err: 'offline' });
    expect(log).not.toHaveBeenCalled();
  });
  it('an answer in time is its status; a bad body json; a 503 http', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ v: 1 })));
    expect(await fetchPublic('https://x/s', 'gym.fail', parse)).toEqual({ ok: true, status: { v: 1 } });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ a: 1 })));
    expect(await fetchPublic('https://x/s', 'gym.fail', parse)).toEqual({ ok: false, err: 'json', http: 200 });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    expect(await fetchPublic('https://x/s', 'gym.fail', parse)).toEqual({ ok: false, err: 'http', http: 503 });
  });
});
