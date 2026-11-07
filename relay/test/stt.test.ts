// `POST /stt` (src/sttRoute.ts, docs/kikimimi-mic.md §3.5): auth, CORS, sizes, the WAV check, the day's cap (the log
// object's caps table), the off switch, the model's answer; and nothing of the audio or its text kept or logged.
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { STT_MAX, STT_MODEL, sttRoute, type SttAi, type SttEnv } from '../src/sttRoute.ts';
import { LogCore, type RelayEvent } from '../src/log.ts';
import { keyOwner } from '../src/auth.ts';
import { memSql } from './sqlite.ts';

const KEY_A = '3f9a'.repeat(16), KEY_B = 'b2'.repeat(32);
const keys = { KEY_A, KEY_B };
const T0 = Date.parse('2026-11-07T03:00:00.000Z');
const ORIGIN = 'https://island-fund.pages.dev';
const SAID = 'I would like a large coffee';

/** A WAV of `n` bytes of samples (a header and silence). */
function wav(n = 32_000): Uint8Array {
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const tag = (o: number, s: string) => [...s].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
  tag(0, 'RIFF'); v.setUint32(4, 36 + n, true); tag(8, 'WAVE'); tag(36, 'data'); v.setUint32(40, n, true);
  return b;
}

let now: number;
let logged: RelayEvent[];
let log: LogCore;
let ai: { run: Mock<SttAi['run']> };
const env = (o: Partial<SttEnv> = {}): SttEnv => ({
  allowed: ORIGIN, off: false, roleOf: (k) => keyOwner(k, keys), spend: async (r) => log.spend(`stt:${r}`, 3),
  ai, log: (evs) => logged.push(...evs), now: () => now, ...o
});
const post = (body: BodyInit | null = wav(), h: Record<string, string> = {}) => new Request('https://relay/stt', {
  method: 'POST', body, headers: { Origin: ORIGIN, 'Content-Type': 'audio/wav', Authorization: `Bearer ${KEY_A}`, ...h }
});

beforeEach(() => {
  now = T0;
  logged = [];
  const db = memSql();
  log = new LogCore({ sql: db.sql, tx: db.tx, keys, now: () => now });
  ai = { run: vi.fn<SttAi['run']>(async () => { now += 640; return { text: ` ${SAID}`, segments: [{ words: [{ word: ' I', start: 0.1, end: 0.2 }, { word: 'would', start: 0.2, end: 0.4 }] }] }; }) };
});

describe('POST /stt', () => {
  it('answers the text and word times, the model given only the audio (base64) and the language', async () => {
    const r = await sttRoute(post(), env());
    expect(r.status).toBe(200);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(await r.json()).toEqual({ ok: true, text: SAID, words: [{ w: 'I', t0: 0.1, t1: 0.2 }, { w: 'would', t0: 0.2, t1: 0.4 }] });
    const [model, input] = ai.run.mock.calls[0] as [string, Record<string, unknown>];
    expect(model).toBe(STT_MODEL);
    expect(Object.keys(input).sort()).toEqual(['audio', 'language']);
    expect(atob(input.audio as string).slice(0, 4)).toBe('RIFF');
    expect(logged).toEqual([{ e: 'stt', l: 1, role: 'A', d: { ms: 640, inB: 32_044, model: 'turbo', ok: true } }]);
  });

  it('a preflight is answered; another origin, a missing or wrong key, another method are refused', async () => {
    const pre = await sttRoute(new Request('https://relay/stt', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env());
    expect([pre.status, pre.headers.get('Access-Control-Allow-Headers')]).toEqual([204, 'Authorization, Content-Type']);
    expect((await sttRoute(post(wav(), { Origin: 'https://evil.test' }), env())).status).toBe(403);
    expect((await sttRoute(post(wav(), { Authorization: '' }), env())).status).toBe(401);
    expect((await sttRoute(post(wav(), { Authorization: `Bearer ${'c3'.repeat(32)}` }), env())).status).toBe(401);
    expect((await sttRoute(new Request('https://relay/stt', { headers: { Origin: ORIGIN } }), env())).status).toBe(405);
    expect(ai.run).not.toHaveBeenCalled();
    expect(logged).toEqual([]);
  });

  it('too large is 413, not a WAV 400, both before the model', async () => {
    expect((await sttRoute(post(wav(STT_MAX)), env())).status).toBe(413);
    expect((await sttRoute(post(new TextEncoder().encode(SAID.repeat(4))), env())).status).toBe(400);
    expect(ai.run).not.toHaveBeenCalled();
    expect(logged.map((e) => e.d?.err)).toEqual(['too_large', 'bad_request']);
  });

  it('a body with no Content-Length (streamed) is read no further than STT_MAX: 413', async () => {
    let pulled = 0;
    const chunk = new Uint8Array(64_000);
    const body = new ReadableStream<Uint8Array>({ pull: (c) => void (pulled++ < 100 ? c.enqueue(chunk) : c.close()) });
    const req = new Request('https://relay/stt', { method: 'POST', body, duplex: 'half', headers: { Origin: ORIGIN, Authorization: `Bearer ${KEY_A}` } } as RequestInit);
    expect(req.headers.get('Content-Length')).toBeNull();
    expect((await sttRoute(req, env())).status).toBe(413);
    expect(pulled).toBeLessThan(10);
    expect(ai.run).not.toHaveBeenCalled();
  });

  it('caps a role’s day (429), the other role apart; a new UTC day opens it again', async () => {
    for (let i = 0; i < 3; i++) expect((await sttRoute(post(), env())).status).toBe(200);
    const over = await sttRoute(post(), env());
    expect([over.status, await over.json()]).toEqual([429, { ok: false, error: 'capped' }]);
    expect((await sttRoute(post(wav(), { Authorization: `Bearer ${KEY_B}` }), env())).status).toBe(200);
    now += 86_400_000;
    expect((await sttRoute(post(), env())).status).toBe(200);
    expect(ai.run).toHaveBeenCalledTimes(5);
  });

  it('the off switch (and no binding) is 503, the model failing 502', async () => {
    expect((await sttRoute(post(), env({ off: true }))).status).toBe(503);
    expect((await sttRoute(post(), env({ ai: undefined }))).status).toBe(503);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ai.run.mockRejectedValueOnce(new TypeError(`could not hear "${SAID}"`));
    const r = await sttRoute(post(), env());
    expect([r.status, await r.json()]).toEqual([502, { ok: false, error: 'ai' }]);
    expect(warn).toHaveBeenCalledWith('stt', 'TypeError');
    warn.mockRestore();
  });

  it('nothing of the audio or its text is logged or printed', async () => {
    const spies = (['log', 'warn', 'error', 'info'] as const).map((k) => vi.spyOn(console, k).mockImplementation(() => {}));
    await sttRoute(post(), env());
    const out = JSON.stringify([logged, spies.map((s) => s.mock.calls)]);
    expect(out).not.toMatch(/coffee|would|RIFF|UklGR/);
    spies.forEach((s) => s.mockRestore());
  });
});
