// The speech test's mic and relay (docs/speech-test.md): a take recorded with MediaRecorder (Safari's mp4), decoded and
// resampled to 16 kHz by an OfflineAudioContext, sent as WAV to the relay's /stt with this phone's key (Workers AI
// Whisper; the relay keeps nothing). Each step timed, so both phones can be compared.
import { keyed } from '#lib/keyed.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { getKey } from '#lib/sync/storage.ts';
import { wav16k } from './match.ts';

export type Miss = 'denied' | 'off' | 'capped' | 'network' | 'ai' | 'other';
export type Heard = { ok: true; text: string; audS: number; kb: number; encMs: number; netMs: number; aiMs: number; totMs: number } | { ok: false; miss: Miss };

/** The longest take (the relay's cap). */
export const MAX_S = 10;

/** A take in progress: `stop()` ends it and gives its audio. */
export interface Take { stop(): Promise<Blob>; cancel(): void }

/** The mic opened and recording (null: refused or none). */
export async function record(): Promise<Take | null> {
  const stream = await navigator.mediaDevices?.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } }).catch(() => null);
  if (!stream) return null;
  const type = ['audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const close = () => stream.getTracks().forEach((t) => t.stop());
  rec.start();
  return {
    stop: () => new Promise((done) => {
      rec.onstop = () => (close(), done(new Blob(parts, { type: rec.mimeType })));
      rec.stop();
    }),
    cancel: () => {
      rec.onstop = close;
      if (rec.state !== 'inactive') rec.stop();
      else close();
    }
  };
}

/** A recorded take, resampled and sent: what was heard and each step's time; or why not. */
export async function transcribe(blob: Blob, t0 = performance.now()): Promise<Heard> {
  let wav: Uint8Array, audS: number;
  try {
    // (decodeAudioData resamples to its context's rate: 16 kHz here)
    const pcm = await new OfflineAudioContext(1, 16_000, 16_000).decodeAudioData(await blob.arrayBuffer());
    audS = Math.min(pcm.duration, MAX_S);
    wav = wav16k(pcm.getChannelData(0), MAX_S);
  } catch {
    return { ok: false, miss: 'other' };
  }
  const t1 = performance.now();
  const r = await keyed(relayUrl('/stt'), getKey(), { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav as BodyInit, signal: AbortSignal.timeout(20_000) });
  if (!r.ok && !r.res) return { ok: false, miss: 'network' };
  const res = r.res!;
  const j = (await res.json().catch(() => null)) as { ok?: boolean; text?: unknown; aiMs?: unknown; error?: unknown } | null;
  const t2 = performance.now();
  if (res.ok && j?.ok && typeof j.text === 'string') {
    const aiMs = typeof j.aiMs === 'number' ? j.aiMs : 0;
    return { ok: true, text: j.text, audS: Math.round(audS * 10) / 10, kb: Math.round(wav.length / 1024), encMs: Math.round(t1 - t0), netMs: Math.round(t2 - t1 - aiMs), aiMs, totMs: Math.round(t2 - t0) };
  }
  return { ok: false, miss: res.status === 429 ? 'capped' : res.status === 503 ? 'off' : res.status === 502 ? 'ai' : 'other' };
}
