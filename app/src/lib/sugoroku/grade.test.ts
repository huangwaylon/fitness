import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, LIVE } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { grade } from './grade.ts';

const kv = (m: Record<string, string>) => ({ getItem: (k: string) => m[k] ?? null, setItem: (k: string, v: string) => void (m[k] = v), removeItem: (k: string) => void delete m[k] });
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('the speaking step’s /grade', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    configureStorage({ local: null });
  });
  const paired = (f: typeof fetch) => {
    configureStorage({ local: kv({ [LIVE.key]: 'k'.repeat(32) }) });
    configureTransport({ url: 'https://relay.test/api' });
    vi.stubGlobal('fetch', f);
  };

  it('sends the sentence, word and level with the key; the answer checked on the phone', async () => {
    const f = reply(200, { ok: true, verdict: 'tip', fixed: 'I ate an apple.', natural: 'I ate an apple.', also: 'x', tip: 'ate だよ', used: true, src: 'ai', aiMs: 800 });
    paired(f as unknown as typeof fetch);
    const r = await grade('I eated an apple.', 'apple', 1);
    expect(r).toEqual({ ok: true, aiMs: 800, grade: { verdict: 'tip', fixed: 'I ate an apple.', natural: 'I ate an apple.', also: '', tip: 'ate だよ', used: true, src: 'ai' } });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://relay.test/grade');
    expect(JSON.parse(init.body as string)).toEqual({ s: 'I eated an apple.', t: 'apple', lv: 1 });
    await grade('I went to Tokyo.', 'Tokyo', 2);
    expect(JSON.parse((f.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).t).toBe('tokyo');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${'k'.repeat(32)}`);
  });
  it('a refusal, a cap, off, the AI failing or no network: a miss (praise only)', async () => {
    for (const [status, miss] of [[429, 'capped'], [503, 'off'], [502, 'ai'], [401, 'other']] as const) {
      paired(reply(status, { ok: false }) as unknown as typeof fetch);
      expect(await grade('I like apples.', 'apple', 2)).toEqual({ ok: false, miss });
    }
    paired(reply(200, { ok: true, verdict: '??' }) as unknown as typeof fetch);
    expect(await grade('I like apples.', 'apple', 2)).toEqual({ ok: false, miss: 'ai' });
    paired(vi.fn(async () => Promise.reject(new TypeError('offline'))) as unknown as typeof fetch);
    expect(await grade('I like apples.', 'apple', 2)).toEqual({ ok: false, miss: 'network' });
  });
  it('no key here: nothing sent', async () => {
    const f = vi.fn();
    configureStorage({ local: kv({}) });
    vi.stubGlobal('fetch', f);
    expect(await grade('I like apples.', 'apple', 2)).toEqual({ ok: false, miss: 'other' });
    expect(f).not.toHaveBeenCalled();
  });
});
