import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, LIVE } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { TIP_MAX } from '#lib/contract/grade.ts';
import { cleanGrade, grade, type Grade } from './grade.ts';

const kv = (m: Record<string, string>) => ({ getItem: (k: string) => m[k] ?? null, setItem: (k: string, v: string) => void (m[k] = v), removeItem: (k: string) => void delete m[k] });
const answer = (o: Record<string, unknown> = {}) => ({ ok: true, verdict: 'tip', fixed: 'I like apples.', natural: 'I love apples.', also: '', tip: 'りんご全体の話なら apples だよ', used: true, src: 'ai', aiMs: 900, ...o });
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

  it('sends the sentence and word with the key (no level); the answer checked on the phone', async () => {
    const f = reply(200, { ok: true, verdict: 'tip', fixed: 'I ate an apple.', natural: 'I ate an apple.', also: 'x', tip: 'ate だよ', used: true, src: 'ai', aiMs: 800 });
    paired(f as unknown as typeof fetch);
    const r = await grade('I eated an apple.', 'apple');
    expect(r).toEqual({ ok: true, aiMs: 800, grade: { verdict: 'tip', fixed: 'I ate an apple.', natural: 'I ate an apple.', also: '', tip: 'ate だよ', used: true, src: 'ai' } });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://relay.test/grade');
    expect(JSON.parse(init.body as string)).toEqual({ s: 'I eated an apple.', t: 'apple' });
    await grade('I went to Tokyo.', 'Tokyo');
    expect(JSON.parse((f.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).t).toBe('tokyo');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${'k'.repeat(32)}`);
  });
  it('a refusal, a cap, off, the AI failing or no network: a miss (praise only)', async () => {
    for (const [status, miss] of [[429, 'capped'], [503, 'off'], [502, 'ai'], [401, 'other']] as const) {
      paired(reply(status, { ok: false }) as unknown as typeof fetch);
      expect(await grade('I like apples.', 'apple')).toEqual({ ok: false, miss });
    }
    paired(reply(200, { ok: true, verdict: '??' }) as unknown as typeof fetch);
    expect(await grade('I like apples.', 'apple')).toEqual({ ok: false, miss: 'ai' });
    paired(vi.fn(async () => Promise.reject(new TypeError('offline'))) as unknown as typeof fetch);
    expect(await grade('I like apples.', 'apple')).toEqual({ ok: false, miss: 'network' });
  });
  it('no key here: nothing sent', async () => {
    const f = vi.fn();
    configureStorage({ local: kv({}) });
    vi.stubGlobal('fetch', f);
    expect(await grade('I like apples.', 'apple')).toEqual({ ok: false, miss: 'other' });
    expect(f).not.toHaveBeenCalled();
  });
  it('the relay’s answer checked on the phone: tips with failure words or grammar terms dropped, also only on great', () => {
    expect(cleanGrade(answer(), 'I like apple.')).toEqual<Grade>({ verdict: 'tip', fixed: 'I like apples.', natural: 'I love apples.', also: '', tip: 'りんご全体の話なら apples だよ', used: true, src: 'ai' });
    for (const tip of ['a を忘れないでね', 'これは間違いです', '三人称なら has', 'apples'.repeat(3), 'あ'.repeat(TIP_MAX + 1)])
      expect(cleanGrade(answer({ tip }), 'I like apple.')!.tip, tip).toBe('');
    expect(cleanGrade(answer({ verdict: 'ok', also: 'I love apples.' }), 'I like apples.')!.also).toBe('');
    expect(cleanGrade(answer({ verdict: 'great', also: 'I really like apples.' }), 'I like apples.')!.also).toBe('I really like apples.');
    // a placeholder, an empty or a non-English fix: their own sentence
    for (const fixed of ['I like ...', '', 'りんごが好き', 'x'.repeat(120)]) expect(cleanGrade(answer({ fixed }), 'I like apple.')!.fixed).toBe('I like apple.');
    expect(cleanGrade({ ok: false, error: 'capped' }, 'x')).toBeNull();
    expect(cleanGrade(answer({ verdict: 'wrong' }), 'x')).toBeNull();
    expect(cleanGrade(null, 'x')).toBeNull();
    expect(cleanGrade(answer({ src: 'wasei' }), 'x')!.src).toBe('wasei');
  });
});
