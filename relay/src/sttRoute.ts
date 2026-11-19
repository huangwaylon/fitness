// `POST /stt` (docs/speech-test.md): one utterance to text through Workers AI, for the speech test. Free of the Workers runtime, so it is unit-testable (test/stt.test.ts).
// - Auth: a person's key in `Authorization: Bearer <key>` (never in the URL); CORS for our origins, preflight answered
//   (audio/wav is not a simple request).
// - Body: a WAV (16 kHz 16-bit mono, ≤ 10 s), at most STT_MAX bytes; else 413. An empty body is a warm-up (the speech
//   page and すごろく's speaking step as they open: the connection and the preflight ready before the take): 204, after
//   the key's check, never logged or counted.
// - Caps: STT_DAY_MAX calls a role a UTC day (the log object's `caps` table), then 429. `off`: 503 (the STT_OFF switch).
// - **Nothing kept:** the audio and its text are never written anywhere (no Durable Object, R2, KV, log or console);
//   they live for the request only. The log's `stt` event carries sizes, the time, the model and the outcome.
// - The recogniser is never given the sentence the user was asked to say (no `initial_prompt`).
import { aiRoute, type AiEnv } from './aiRoute.ts';
import { readCapped } from './body.ts';
import { errName } from './log.ts';

/** 10 s of 16 kHz 16-bit mono and its header, with room. */
export const STT_MAX = 340_000;
export const STT_MODEL = '@cf/openai/whisper-large-v3-turbo';

/** What the route needs from Workers AI (the `AI` binding). */
export interface SttAi {
  run(model: string, input: { audio: string; language?: string }): Promise<unknown>;
}

export type SttEnv = AiEnv<SttAi>;

/** Base64 of bytes, in slices (a spread of 340 KB would overflow the stack). */
function base64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
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

export function sttRoute(req: Request, env: SttEnv): Promise<Response> {
  return aiRoute(req, env, 'stt', async ({ ai, role, done, warm }) => {
    const log = (st: number, inB: number, err?: Parameters<typeof done>[2], body?: object) => done(st, { inB, model: 'turbo' }, err, body);
    if (Number(req.headers.get('Content-Length') ?? 0) > STT_MAX) return log(413, Number(req.headers.get('Content-Length')), 'too_large');
    const bytes = await readCapped(req, STT_MAX);
    if (!bytes) return log(413, STT_MAX + 1, 'too_large');
    if (!bytes.length) return warm();
    if (!isWav(bytes)) return log(400, bytes.length, 'bad_request');
    if (!(await env.spend(role).catch(() => false))) return log(429, bytes.length, 'capped');
    try {
      const a0 = env.now();
      const out = heard(await ai.run(STT_MODEL, { audio: base64(bytes), language: 'en' }));
      if (!out) return log(502, bytes.length, 'ai');
      // (aiMs: the model's own time, so a phone can tell it from the network's)
      return log(200, bytes.length, undefined, { ok: true, ...out, aiMs: env.now() - a0 });
    } catch (e) {
      // its class only: never a message (it could quote the input)
      console.warn('stt', errName(e));
      return log(502, bytes.length, 'ai');
    }
  });
}
