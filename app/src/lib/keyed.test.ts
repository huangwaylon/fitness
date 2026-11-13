import { afterEach, describe, expect, it, vi } from 'vitest';
import { keyed } from './keyed.ts';

const answer = (status: number) => vi.fn(async () => new Response(status === 304 || status === 204 ? null : '{}', { status }));
afterEach(() => vi.unstubAllGlobals());

describe('keyed: a members-only call', () => {
  it('no key or no endpoint: unpaired, nothing sent', async () => {
    const f = answer(200);
    vi.stubGlobal('fetch', f);
    expect(await keyed('https://relay/x', '')).toEqual({ ok: false, why: 'unpaired' });
    expect(await keyed('', 'k')).toEqual({ ok: false, why: 'unpaired' });
    expect(f).not.toHaveBeenCalled();
  });

  it('the key as a Bearer header beside the caller’s, the rest of init as given', async () => {
    const f = answer(200);
    vi.stubGlobal('fetch', f);
    const r = await keyed('https://relay/x', 'k1', { method: 'POST', headers: { 'If-None-Match': 'W/"1"' }, cache: 'no-store' });
    expect(r.ok).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://relay/x');
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', headers: { 'If-None-Match': 'W/"1"', Authorization: 'Bearer k1' } });
  });

  it('2xx and 304 answer; 401, 403, 404 refused; any other status failed, with the reply', async () => {
    for (const [status, ok, why] of [[200, true], [204, true], [304, true], [401, false, 'refused'], [403, false, 'refused'], [404, false, 'refused'], [429, false, 'failed'], [500, false, 'failed'], [503, false, 'failed']] as const) {
      vi.stubGlobal('fetch', answer(status));
      const r = await keyed('https://relay/x', 'k');
      expect(r.ok).toBe(ok);
      expect(r.res?.status).toBe(status);
      if (!r.ok) expect(r.why).toBe(why);
    }
  });

  it('fetch threw: unreached; the timeout: timeout; the caller’s signal: aborted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); }));
    expect(await keyed('https://relay/x', 'k')).toEqual({ ok: false, why: 'unreached' });
    const hang = vi.fn((_: string, init: RequestInit) => new Promise<Response>((_, no) => init.signal!.addEventListener('abort', () => no(init.signal!.reason))));
    vi.stubGlobal('fetch', hang);
    expect(await keyed('https://relay/x', 'k', {}, 5)).toEqual({ ok: false, why: 'timeout' });
    const ctl = new AbortController();
    const p = keyed('https://relay/x', 'k', { signal: ctl.signal }, 10_000);
    ctl.abort();
    expect(await p).toEqual({ ok: false, why: 'aborted' });
  });

  it('the answer timer stops at the headers: a slow body is not cut', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_: string, init: RequestInit) => ((signal = init.signal ?? undefined), new Response('{}'))));
    const r = await keyed('https://relay/x', 'k', {}, 5);
    await new Promise((ok) => setTimeout(ok, 20));
    expect(r.ok && signal?.aborted).toBe(false);
  });
});
