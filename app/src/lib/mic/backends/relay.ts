// ききみみ's relay recogniser (docs/kikimimi-mic.md "The Recogniser", "The relay endpoint"): a take as 16 kHz 16-bit WAV (≤ 10 s, ≤ 340 KB) POSTed
// to the relay's `/stt` with this phone's key (Workers AI; the relay keeps nothing and logs sizes and times only). Used
// only when picked by hand in せってい, after its disclosure. Its answers: 429 the day's calls spent (「今日は ここまで」),
// 503 switched off (STT_OFF), 401 not paired here; a timeout of 20 s, and cancel aborts the request.
import { relayUrl } from '#lib/sync/transport.ts';
import { keyed } from '#lib/keyed.ts';
import { getKey } from '#lib/sync/storage.ts';
import { wav16k } from '../probe/steps.ts';
import type { Capture, Heard, Miss, Recogniser } from '../stt.ts';
import { quiet } from '#lib/quiet.ts';

/** The relay's cap: 10 s of 16 kHz 16-bit mono (its STT_MAX is 340 000 bytes). */
const RELAY_S = 10;
const TIMEOUT_MS = 20_000;

/** The relay's `/stt`, or '' when the build has no relay. */
const sttUrl = (): string => relayUrl('/stt');
/** Whether this phone can use the relay (a relay configured, paired). */
export const relayReady = (): boolean => !!sttUrl() && !!getKey();

type Posted = { ok: true; text: string; words?: Heard['words']; ms: number } | { ok: false; miss: Miss };

/** A WAV to the relay's `/stt`: the text (and word times) and the round trip; or why not. */
export async function postWav(body: Uint8Array, signal?: AbortSignal): Promise<Posted> {
  const t0 = performance.now();
  const r = await keyed(sttUrl(), getKey(), {
    method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: body as BodyInit,
    // (the reply's body too, not only its headers)
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!r.ok && !r.res) return { ok: false, miss: r.why === 'unpaired' || r.why === 'timeout' || r.why === 'aborted' ? r.why : 'network' };
  const res = r.res!;
  const j = (await quiet(res.json(), 'stt.reply', null)) as { ok?: boolean; text?: unknown; words?: unknown; error?: unknown } | null;
  if (res.ok && j?.ok && typeof j.text === 'string') {
    return { ok: true, text: j.text, ...(Array.isArray(j.words) ? { words: j.words as Heard['words'] } : {}), ms: Math.round(performance.now() - t0) };
  }
  const miss: Miss = res.status === 429 ? 'capped' : res.status === 503 || j?.error === 'off' ? 'off' : res.status === 401 ? 'unpaired' : res.status >= 500 ? 'network' : 'other';
  return { ok: false, miss };
}

export function relayRecogniser(cap: Capture): Recogniser {
  return {
    be: 'relay',
    ready: async () => relayReady(),
    listen: (h = {}) => cap('relay', { ...h, maxS: Math.min(h.maxS ?? RELAY_S, RELAY_S) }, async (got, signal) => {
      const r = await postWav(wav16k(got.pcm.subarray(0, RELAY_S * 16_000), 16_000), signal);
      return r.ok ? { text: r.text, ...(r.words ? { words: r.words } : {}), ms: r.ms, be: 'relay' } : { miss: r.miss, be: 'relay' };
    }),
    dispose() {}
  };
}
