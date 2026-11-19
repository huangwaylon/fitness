// stt.ts transcribe's upload: the take's silence cut before it goes, and one more try for an upload that never reached
// the relay (fetch threw), logged once; none for an answer, a timeout or the caller's abort.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const logged: [string, Record<string, unknown>][] = [];
vi.mock('#lib/sync/log.ts', () => ({ log: (e: string, d: Record<string, unknown>) => logged.push([e, d]) }));
vi.mock('#lib/sync/storage.ts', () => ({ getKey: () => 'ab'.repeat(16) }));
vi.mock('#lib/sync/transport.ts', () => ({ relayUrl: (p: string) => `https://relay${p}` }));
const { transcribe } = await import('./stt.ts');

/** 0.5 s quiet · 1 s of a tone · 1 s quiet. */
const take = () => Float32Array.from({ length: 40_000 }, (_, i) => (i >= 8_000 && i < 24_000 ? Math.sin(i / 10) * 0.4 : 0.0005 * Math.sin(i)));
const said = () => new Response(JSON.stringify({ ok: true, text: 'Good morning.', aiMs: 400 }), { status: 200 });
const threw = () => Promise.reject(new TypeError('Load failed'));

beforeEach(() => {
  logged.length = 0;
  vi.stubGlobal('navigator', { onLine: true, serviceWorker: { controller: {} } });
  vi.stubGlobal('document', { visibilityState: 'visible' });
});
afterEach(() => vi.unstubAllGlobals());

describe('transcribe: the upload', () => {
  it('sends the take without its silent ends, the times kept', async () => {
    const f = vi.fn(async () => said());
    vi.stubGlobal('fetch', f);
    const r = await transcribe(take());
    expect(r).toMatchObject({ ok: true, text: 'Good morning.', audS: 2.5, aiMs: 400 });
    // 1 s of sound and its 0.3 s + 0.4 s of padding
    expect(r.ok && r.sentS).toBeCloseTo(1.7, 1);
    const body = (f.mock.calls[0] as unknown as [string, RequestInit])[1].body as Uint8Array;
    expect(body.length).toBeLessThan(44 + 1.8 * 32_000);
    expect(logged).toEqual([]);
  });

  it('unreached once: sent again (the same bytes), the words heard, one stt.retry', async () => {
    const f = vi.fn().mockImplementationOnce(threw).mockImplementationOnce(async () => said());
    vi.stubGlobal('fetch', f);
    const r = await transcribe(take());
    expect(r.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
    const bodies = f.mock.calls.map((c) => (c[1] as RequestInit).body);
    expect(bodies[1]).toBe(bodies[0]);
    expect(logged).toEqual([['stt.retry', { ms: expect.any(Number), msg: 'Load failed', on: true, vis: 'visible', sw: true, ok: true }]]);
  });

  it('unreached twice: network, the second why logged; never a third', async () => {
    const f = vi.fn(threw);
    vi.stubGlobal('fetch', f);
    expect(await transcribe(take())).toEqual({ ok: false, miss: 'network' });
    expect(f).toHaveBeenCalledTimes(2);
    expect(logged).toMatchObject([['stt.retry', { ok: false, why: 'unreached' }]]);
  });

  it('an answer (502, 429), a timeout or the caller leaving: no second try', async () => {
    for (const [answer, miss] of [[502, 'ai'], [429, 'capped']] as const) {
      const f = vi.fn(async () => new Response('{}', { status: answer }));
      vi.stubGlobal('fetch', f);
      expect(await transcribe(take())).toEqual({ ok: false, miss });
      expect(f).toHaveBeenCalledTimes(1);
    }
    const timeout = vi.fn(() => Promise.reject(new DOMException('late', 'TimeoutError')));
    vi.stubGlobal('fetch', timeout);
    expect(await transcribe(take())).toEqual({ ok: false, miss: 'timeout' });
    expect(timeout).toHaveBeenCalledTimes(1);
    const left = new AbortController();
    const gone = vi.fn(() => (left.abort(), Promise.reject(new TypeError('Load failed'))));
    vi.stubGlobal('fetch', gone);
    expect((await transcribe(take(), undefined, left.signal)).ok).toBe(false);
    expect(gone).toHaveBeenCalledTimes(1);
    expect(logged).toEqual([]);
  });
});
