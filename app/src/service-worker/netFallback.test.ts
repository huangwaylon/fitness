// A saved area's file on a weak network (netFallback.ts): the saved copy after a short wait, at once offline.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithin, NET_FALLBACK_MS, NO_COPY_WAIT_MS, netOrSaved } from './netFallback.ts';

const res = (body: string, status = 200) => new Response(body, { status });
const never = () => new Promise<Response | null>(() => {});
afterEach(() => vi.useRealTimers());

describe("a saved area's file, the network weak", () => {
  it('the network hanging (lie-fi): the saved copy after the wait, not the request\'s 30 s and more', async () => {
    vi.useFakeTimers();
    const out = netOrSaved(never(), async () => res('saved'), { online: true });
    await vi.advanceTimersByTimeAsync(NET_FALLBACK_MS);
    expect(await (await out).text()).toBe('saved');
  });

  it('offline: the saved copy at once; none saved: the network\'s answer (or an error)', async () => {
    let asked = 0;
    const net = (async () => (asked++, null))();
    expect(await (await netOrSaved(net, async () => res('saved'), { online: false })).text()).toBe('saved');
    expect((await netOrSaved(Promise.resolve(null), async () => undefined, { online: false })).type).toBe('error');
    expect(asked).toBe(1);
  });

  it('the network in time: its answer; a failure or a 404 in time: the saved copy, else that answer', async () => {
    expect(await (await netOrSaved(Promise.resolve(res('net')), async () => res('saved'), { online: true })).text()).toBe('net');
    expect(await (await netOrSaved(Promise.resolve(null), async () => res('saved'), { online: true })).text()).toBe('saved');
    expect((await netOrSaved(Promise.resolve(res('', 404)), async () => undefined, { online: true })).status).toBe(404);
  });

  it('slow and nothing saved: the network\'s answer when it comes', async () => {
    vi.useFakeTimers();
    let answer!: (r: Response) => void;
    const out = netOrSaved(new Promise<Response | null>((r) => (answer = r)), async () => null, { online: true });
    await vi.advanceTimersByTimeAsync(NET_FALLBACK_MS + 5_000);
    answer(res('late'));
    expect(await (await out).text()).toBe('late');
  });
});

describe('a file with no copy, the network hung (fetchWithin)', () => {
  it('aborted past the wait, not hanging; an answer in time passes, its timer cleared', async () => {
    vi.useFakeTimers();
    const hung = (_r: Request, init?: RequestInit) => new Promise<Response>((_, no) => init?.signal?.addEventListener('abort', () => no(init.signal!.reason)));
    const caught = fetchWithin(hung, new Request('https://x/a.js')).catch((e: unknown) => e as DOMException);
    await vi.advanceTimersByTimeAsync(NO_COPY_WAIT_MS);
    expect((await caught).name).toBe('TimeoutError');
    expect(await (await fetchWithin(async () => res('ok'), new Request('https://x/b.js'))).text()).toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });
});
