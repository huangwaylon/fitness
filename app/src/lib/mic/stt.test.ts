// The recogniser's rules (lib/mic/stt.ts and its backends) against fakes: a take captures then recognises, every way it
// ends gives one outcome (no speech, refused, cancelled mid-recognition: aborted, the signal let go), one take at a
// time; the stub plays its script in turn; the relay's answers (429, 503, 401, a timeout) become misses.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Got, Take as MicTake } from './session.ts';
import type { VadState } from './vad.ts';

vi.mock('#lib/sound/sound.svelte.ts', () => ({ audioCtx: () => null, micSession: () => {} }));
const { capturing, isMiss } = await import('./stt.ts');
const { level01 } = await import('./level.ts');
const { stubRecogniser } = await import('./backends/stub.ts');
const { postWav, relayRecogniser, relayReady } = await import('./backends/relay.ts');
const { configureTransport } = await import('#lib/sync/transport.ts');
const { configureStorage, LIVE } = await import('#lib/sync/storage.ts');

type TakeFn = Parameters<typeof capturing>[0];

/** A fake session.ts take: opened at once (or refused), ended by the test. */
function fakeTake(o: { refuse?: string } = {}) {
  const log: string[] = [];
  let end!: (g: Got | null) => void, frame: ((v: VadState) => void) | undefined;
  const take: TakeFn = async (op = {}) => {
    frame = op.frame;
    log.push(`open ${op.maxS ?? '-'}`);
    if (o.refuse) throw new DOMException('no', o.refuse);
    const done = new Promise<Got | null>((r) => (end = r));
    const t: MicTake = { done, stop: () => (log.push('stop'), end({ pcm: new Float32Array(16_000), s: 1 })), cancel: () => (log.push('cancel'), end(null)) };
    return t;
  };
  return { take, log, end: (g: Got | null) => end(g), frame: (db: number) => frame?.({ db, speaking: true, heard: true, done: false, from: 0, to: 0 }) };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const speech: Got = { pcm: new Float32Array(16_000), s: 1 };

describe('capturing', () => {
  it('recognises what the take kept, with its level meanwhile', async () => {
    const f = fakeTake(), seen: number[] = [];
    const t = capturing(f.take)('whisper', { maxS: 5 }, async (g) => (seen.push(g.s), { text: 'hi', ms: 3, be: 'whisper' }));
    await tick();
    f.frame(-37.5);
    expect(t.level).toBe(0.5);
    f.end(speech);
    expect(await t.heard).toEqual({ text: 'hi', ms: 3, be: 'whisper' });
    expect([seen, f.log, t.level]).toEqual([[1], ['open 5'], 0]);
  });

  it('no speech is none; a refused mic is denied; a failing recogniser is other', async () => {
    const f = fakeTake();
    const t = capturing(f.take)('relay', {}, async () => ({ text: 'x', ms: 1, be: 'relay' }));
    await tick();
    f.end(null);
    expect(await t.heard).toEqual({ miss: 'none', be: 'relay' });
    expect(await capturing(fakeTake({ refuse: 'NotAllowedError' }).take)('relay', {}, async () => ({ text: '', ms: 0, be: 'relay' })).heard).toEqual({ miss: 'denied', be: 'relay' });
    const g = fakeTake();
    const u = capturing(g.take)('whisper', {}, async () => Promise.reject(new Error('boom')));
    await tick();
    g.end(speech);
    expect(await u.heard).toEqual({ miss: 'other', be: 'whisper' });
  });

  it('stop ends the take and gives what was heard, even asked while the mic opens', async () => {
    const f = fakeTake();
    const t = capturing(f.take)('stub', {}, async () => ({ text: 'ok', ms: 1, be: 'stub' }));
    expect(await t.stop()).toEqual({ text: 'ok', ms: 1, be: 'stub' });
    expect(f.log).toEqual(['open -', 'stop']);
  });

  it('cancel mid-recognition is aborted at once, the signal let go', async () => {
    const f = fakeTake();
    let sig: AbortSignal | null = null;
    const t = capturing(f.take)('relay', {}, (_g, s) => ((sig = s), new Promise(() => {})));
    await tick();
    f.end(speech);
    await tick();
    t.cancel();
    expect(await t.heard).toEqual({ miss: 'aborted', be: 'relay' });
    expect(sig!.aborted).toBe(true);
  });

  it('cancel while listening releases the mic', async () => {
    const f = fakeTake();
    const t = capturing(f.take)('whisper', {}, async () => ({ text: 'no', ms: 1, be: 'whisper' }));
    await tick();
    t.cancel();
    expect(await t.heard).toEqual({ miss: 'aborted', be: 'whisper' });
    expect(f.log).toEqual(['open -', 'cancel']);
  });

  it('maps a level in dBFS to the ring', () => {
    expect([level01(-80), level01(-60), level01(-15), level01(0)]).toEqual([0, 0, 1, 1]);
  });
});

function memStore(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), clear: () => m.clear(), key: () => null, get length() { return m.size; } };
}

describe('the stub', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('answers its script in turn, whatever the capture got; a cancel stays aborted', async () => {
    const ls = memStore();
    configureStorage({ local: ls });
    ls.setItem('e2e.stt', JSON.stringify(['rice', { text: '', cand: [-0.2, -2] }, { miss: 'capped' }]));
    const f = fakeTake(), r = stubRecogniser(capturing(f.take));
    expect(await r.ready()).toBe(true);
    const a = r.listen();
    await tick();
    f.end(speech);
    expect(await a.heard).toEqual({ text: 'rice', ms: 1, be: 'stub' });
    const b = r.listen();
    await tick();
    f.end(null);
    expect(await b.heard).toEqual({ text: '', cand: [-0.2, -2], ms: 1, be: 'stub' });
    expect(await r.listen().stop()).toEqual({ miss: 'capped', be: 'stub' });
    const c = r.listen();
    await tick();
    c.cancel();
    const o = await c.heard;
    expect(isMiss(o) && o.miss).toBe('aborted');
  });
});

describe('the relay', () => {
  const KEY = 'a'.repeat(64);
  afterEach(() => {
    vi.unstubAllGlobals();
    configureTransport({ url: '' });
  });
  function rig(res: () => Response | Promise<Response>) {
    const kv = memStore();
    kv.setItem(LIVE.key, KEY);
    configureStorage({ local: kv });
    configureTransport({ url: 'https://relay.test/api' });
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => (calls.push({ url, init }), res()));
    return calls;
  }
  const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status });

  it('POSTs the WAV with the key and reads the text and word times', async () => {
    const calls = rig(() => json({ ok: true, text: 'Feed my cat.', words: [{ w: 'Feed', t0: 0, t1: 0.3 }] }));
    expect(relayReady()).toBe(true);
    const r = await postWav(new Uint8Array(100));
    expect(r).toMatchObject({ ok: true, text: 'Feed my cat.', words: [{ w: 'Feed', t0: 0, t1: 0.3 }] });
    expect(calls[0].url).toBe('https://relay.test/stt');
    expect(calls[0].init.headers).toEqual({ 'Content-Type': 'audio/wav', Authorization: `Bearer ${KEY}` });
  });

  it('turns 429, 503, 401 and failures into misses', async () => {
    for (const [res, miss] of [[json({ ok: false, error: 'capped' }, 429), 'capped'], [json({ ok: false, error: 'off' }, 503), 'off'],
      [json({ ok: false, error: 'unauthorized' }, 401), 'unpaired'], [json({ ok: false, error: 'ai' }, 502), 'network'], [new Response('x', { status: 400 }), 'other']] as const) {
      rig(() => res);
      expect(await postWav(new Uint8Array(100))).toEqual({ ok: false, miss });
    }
    rig(() => Promise.reject(new TypeError('offline')));
    expect(await postWav(new Uint8Array(100))).toEqual({ ok: false, miss: 'network' });
    rig(() => Promise.reject(new DOMException('t', 'TimeoutError')));
    expect(await postWav(new Uint8Array(100))).toEqual({ ok: false, miss: 'timeout' });
  });

  it('is unpaired without a key, and caps a take at 10 s of WAV', async () => {
    configureStorage({ local: memStore() });
    configureTransport({ url: 'https://relay.test/api' });
    expect(relayReady()).toBe(false);
    expect(await postWav(new Uint8Array(100))).toEqual({ ok: false, miss: 'unpaired' });
    const calls = rig(() => json({ ok: true, text: 'long' }));
    const f = fakeTake(), r = relayRecogniser(capturing(f.take));
    const t = r.listen({ maxS: 15 });
    await tick();
    f.end({ pcm: new Float32Array(16_000 * 12), s: 12 });
    expect(await t.heard).toMatchObject({ text: 'long', be: 'relay' });
    expect(f.log[0]).toBe('open 10');
    expect((calls[0].init.body as Uint8Array).length).toBe(44 + 16_000 * 10 * 2);
  });
});

describe('recogniser', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is the stub under the script, one at a time, one take at a time', async () => {
    const ls = memStore();
    configureStorage({ local: ls });
    ls.setItem('e2e.stt', JSON.stringify(['one', 'two']));
    const { recogniser, release, sttBackend } = await import('./stt.ts');
    expect(await sttBackend()).toBe('stub');
    const r = await recogniser();
    expect(r?.be).toBe('stub');
    expect(await recogniser()).toBe(r);
    const a = r!.listen(), b = r!.listen();
    expect(await a.heard).toEqual({ miss: 'aborted', be: 'stub' });
    expect(await b.heard).toEqual({ text: 'one', ms: 1, be: 'stub' });
    release();
    expect(await recogniser('stub')).not.toBe(r);
    release();
  });

  it('is none with the mic off (no script)', async () => {
    configureStorage({ local: memStore() });
    const { recogniser, sttBackend } = await import('./stt.ts');
    expect(await sttBackend()).toBe(null);
    expect(await recogniser()).toBe(null);
  });
});
