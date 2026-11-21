// A saved area's file on a weak network (netFallback.ts): the saved copy after a short wait, at once offline.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NET_FALLBACK_MS, netOrSaved } from './netFallback.ts';

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
