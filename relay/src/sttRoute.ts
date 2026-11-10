// `POST /stt` (docs/kikimimi-mic.md "The relay endpoint"): one utterance to text through Workers AI, for ききみみ's mic (the probe's step
// 6; later the relay backend). Free of the Workers runtime, so it is unit-testable (test/stt.test.ts).
// - Auth: a person's key in `Authorization: Bearer <key>` (never in the URL); CORS for our origins, preflight answered
//   (audio/wav is not a simple request).
// - Body: a WAV (16 kHz 16-bit mono, ≤ 10 s), at most STT_MAX bytes; else 413.
// - Caps: STT_DAY_MAX calls a role a UTC day (the log object's `caps` table), then 429. `off`: 503 (the STT_OFF switch).
// - **Nothing kept:** the audio and its text are never written anywhere (no Durable Object, R2, KV, log or console);
//   they live for the request only. The log's `stt` event carries sizes, the time, the model and the outcome.
// - The recogniser is never given the sentence the user was asked to say (no `initial_prompt`).
import { originAllowed } from './auth.ts';
import { errName, type RelayEvent } from './log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

/** 10 s of 16 kHz 16-bit mono and its header, with room. */
export const STT_MAX = 340_000;
export const STT_MODEL = '@cf/openai/whisper-large-v3-turbo';

/** What the route needs from Workers AI (the `AI` binding). */
export interface SttAi {
  run(model: string, input: { audio: string; language?: string }): Promise<unknown>;
}

export interface SttEnv {
  allowed: string;
  off: boolean;
  /** The key's owner (auth.ts keyOwner), or null. */
  roleOf(key: string): Who | null;
  /** One of the role's calls today (log.ts spend), or false when spent. */
  spend(role: Who): Promise<boolean>;
  ai: SttAi | undefined;
  log(evs: RelayEvent[]): void;
  now(): number;
}

type Err = 'off' | 'too_large' | 'bad_request' | 'capped' | 'ai';

/** Base64 of bytes, in slices (a spread of 340 KB would overflow the stack). */
function base64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

/** The body's bytes, read no further than `max` (a body without Content-Length, chunked, is cut off there: null). */
async function readCapped(req: Request, max: number): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader(), parts: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > max) {
      void reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(n);
  let at = 0;
  for (const p of parts) out.set(p, (at += p.length) - p.length);
  return out;
}

const isWav = (b: Uint8Array): boolean => b.length > 44 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WAVE';

/** The model's answer as `{text, words?}` (its segments' word times, seconds). */
function heard(out: unknown): { text: string; words?: { w: string; t0: number; t1: number }[] } | null {
  const o = out as { text?: unknown; segments?: { words?: { word?: unknown; start?: unknown; end?: unknown }[] }[] } | null;
  if (!o || typeof o.text !== 'string') return null;
  const words = (Array.isArray(o.segments) ? o.segments : []).flatMap((s) => (Array.isArray(s?.words) ? s.words : []))
    .filter((w) => typeof w?.word === 'string' && typeof w.start === 'number' && typeof w.end === 'number')
    .map((w) => ({ w: (w.word as string).trim(), t0: w.start as number, t1: w.end as number }));
  return { text: o.text.trim(), ...(words.length ? { words } : {}) };
}

export async function sttRoute(req: Request, env: SttEnv): Promise<Response> {
  const origin = req.headers.get('Origin');
  if (origin && !originAllowed(origin, env.allowed)) return new Response('forbidden', { status: 403 });
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}) };
  const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } });
  if (env.off || !env.ai) return json({ ok: false, error: 'off' }, 503);
  const auth = req.headers.get('Authorization') ?? '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const role = env.roleOf(key);
  if (!role) return json({ ok: false, error: 'unauthorized' }, 401);
  const t0 = env.now();
  // only a person's calls are logged (a stranger's flood never spends the log's requests)
  const done = (st: number, inB: number, err?: Err, body: object = { ok: false, error: err }) => {
    env.log([{ e: 'stt', l: err && err !== 'capped' ? 2 : 1, role, d: { ms: env.now() - t0, inB, model: 'turbo', ok: !err, ...(err ? { err } : {}) } }]);
    return json(body, st);
  };
  if (Number(req.headers.get('Content-Length') ?? 0) > STT_MAX) return done(413, Number(req.headers.get('Content-Length')), 'too_large');
  const bytes = await readCapped(req, STT_MAX);
  if (!bytes) return done(413, STT_MAX + 1, 'too_large');
  if (!isWav(bytes)) return done(400, bytes.length, 'bad_request');
  if (!(await env.spend(role).catch(() => false))) return done(429, bytes.length, 'capped');
  try {
    const out = heard(await env.ai.run(STT_MODEL, { audio: base64(bytes), language: 'en' }));
    if (!out) return done(502, bytes.length, 'ai');
    return done(200, bytes.length, undefined, { ok: true, ...out });
  } catch (e) {
    // its class only: never a message (it could quote the input)
    console.warn('stt', errName(e));
    return done(502, bytes.length, 'ai');
  }
}
