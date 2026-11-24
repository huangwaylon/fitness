// gym.html's early reads (early.ts): the inline script asks for /status and /gym/config with the link's key (the
// hash's, else the tab's, kept there), nothing without one; the page takes each once, for its Worker and key, and
// gives up on it as its signal aborts.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gymEarly, gymEarlyJs, takeEarly } from './early.ts';
import { KEY_RE, TAB } from './linkKey.ts';

const URL_ = 'https://gym.example';
const K = 'ab'.repeat(32);
type W = Parameters<typeof gymEarly>[0];

function win(hash: string, kept: string | null = null) {
  const m = new Map<string, string>(kept ? [[TAB, kept]] : []);
  const fetch = vi.fn(async () => new Response('{}'));
  const w = { location: { hash }, sessionStorage: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }, fetch } as unknown as W;
  return { w, m, fetch };
}

describe('the inline script', () => {
  afterEach(() => delete (globalThis as { __gymEarly?: unknown }).__gymEarly);

  it('asks for both with the hash’s key, kept for the tab', () => {
    const { w, m, fetch } = win(`#${K.toUpperCase()}`);
    gymEarly(w, URL_, TAB, KEY_RE);
    expect(fetch).toHaveBeenCalledWith(`${URL_}/status`, expect.anything());
    expect(fetch).toHaveBeenCalledWith(`${URL_}/gym/config`, expect.objectContaining({ cache: 'no-store', headers: { Authorization: `Bearer ${K}` } }));
    expect(m.get(TAB)).toBe(K);
    expect((w as { __gymEarly?: { k: string } }).__gymEarly?.k).toBe(K);
  });

  it('a reload (no hash) uses the tab’s; no key at all, nothing asked', () => {
    const a = win('', K);
    gymEarly(a.w, URL_, TAB, KEY_RE);
    expect(a.fetch).toHaveBeenCalledTimes(2);
    for (const b of [win(''), win('#nope'), win('', 'nope')]) {
      gymEarly(b.w, URL_, TAB, KEY_RE);
      expect(b.fetch).not.toHaveBeenCalled();
    }
  });

  it('is one plain expression, its URL in it', () => {
    const js = gymEarlyJs(URL_);
    expect(js).not.toMatch(/\n|\/\/ /);
    expect(js).toContain(JSON.stringify(URL_));
    expect(() => new Function(js)).not.toThrow();
  });
});

describe('takeEarly', () => {
  const g = globalThis as { __gymEarly?: unknown };
  afterEach(() => delete g.__gymEarly);
  const res = new Response('{}');

  it('once, for its Worker and its key; the key gone with the config', async () => {
    g.__gymEarly = { u: URL_, k: K, s: Promise.resolve(res), c: Promise.resolve(res) };
    expect(takeEarly('s', 'https://other.example')).toBeNull();
    expect(takeEarly('c', URL_, undefined, 'ff'.repeat(32))).toBeNull();
    expect(await takeEarly('c', URL_, undefined, K)).toBe(res);
    expect(g.__gymEarly).toEqual({ u: URL_, s: expect.any(Promise) });
    expect(takeEarly('c', URL_, undefined, K)).toBeNull();
    expect(await takeEarly('s', URL_)).toBe(res);
    expect(g.__gymEarly).toBeUndefined();
    expect(takeEarly('s', URL_)).toBeNull();
  });

  it('rejects as the signal aborts (its reason)', async () => {
    g.__gymEarly = { u: URL_, s: new Promise(() => {}) };
    const ctl = new AbortController();
    const p = takeEarly('s', URL_, ctl.signal);
    ctl.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });
});
