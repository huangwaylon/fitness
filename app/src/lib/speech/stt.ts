// The speech test's mic and relay (docs/speech-test.md): a take recorded with MediaRecorder (Safari's mp4), decoded and
// resampled to 16 kHz by an OfflineAudioContext, sent as WAV to the relay's /stt with this phone's key (Workers AI
// Whisper; the relay keeps nothing). Each step timed, so both phones can be compared. (Capturing the samples through a
// Web Audio graph instead was tried 2026-11-18: in the iOS Simulator and Playwright's WebKit its context never ran
// outside a real tap, where MediaRecorder's take decoded every time.)
import { keyed } from '#lib/keyed.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { getKey } from '#lib/sync/storage.ts';
import { micMiss, peakOf, relayMiss, wav16k, takeMiss, type MicMiss, type RelayMiss } from './match.ts';

export type Miss = MicMiss | 'empty' | 'silent' | RelayMiss;
export type Heard = { ok: true; text: string; audS: number; kb: number; encMs: number; netMs: number; aiMs: number; totMs: number } | { ok: false; miss: Miss };

/** The longest take (the relay's cap). */
export const MAX_S = 10;

/** A take's samples at 16 kHz (empty: it didn't decode), and what the log says about it: the recording's KB and type,
 *  the loudest sample, a muted track. */
export interface Pcm { pcm: Float32Array; recKB: number; type: string; peak: number; muted: boolean; decoded: boolean }
/** A take in progress: `stop()` ends it and gives its samples. */
export interface Take { stop(): Promise<Pcm>; cancel(): void }
/** The mic refused: why, and getUserMedia's own error (its name and message, for the log). */
export interface Refused { miss: MicMiss; gum: string; msg: string }

/** The mic opened and recording, or why not. getUserMedia is asked for at once, inside the tap, with plain
 *  `{ audio: true }` (WebKit's default already cancels echo; nothing to over-constrain). The audio session must allow
 *  capture first (sound.svelte.ts micFocus). `signal`: the screen left while the permission was pending: the mic is
 *  closed as it arrives (`gum: 'left'`). Every failure stops the stream's tracks. */
export async function record(signal?: AbortSignal): Promise<Take | Refused> {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) return { miss: 'insecure', gum: 'none', msg: '' };
  let stream: MediaStream;
  try {
    stream = await md.getUserMedia({ audio: true });
  } catch (e) {
    const err = e instanceof Error ? e : null;
    return { miss: micMiss(err?.name), gum: err?.name ?? 'other', msg: err?.message ?? '' };
  }
  const close = () => stream.getTracks().forEach((t) => t.stop());
  if (signal?.aborted) return (close(), { miss: 'other', gum: 'left', msg: '' });
  let rec: MediaRecorder;
  try {
    const type = ['audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    rec.start();
  } catch (e) {
    close();
    return { miss: 'other', gum: e instanceof Error ? e.name : 'other', msg: e instanceof Error ? e.message : '' };
  }
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const track = stream.getAudioTracks()[0];
  return {
    // (the last dataavailable comes before stop)
    stop: () => new Promise<Blob>((done) => {
      const muted = !!track?.muted;
      rec.onstop = () => (close(), done(Object.assign(new Blob(parts, { type: rec.mimeType }), { muted })));
      rec.stop();
    }).then(decode),
    cancel: () => {
      rec.onstop = close;
      if (rec.state !== 'inactive') rec.stop();
      else close();
    }
  };
}

/** A recording as 16 kHz samples (decodeAudioData resamples to its context's rate). */
async function decode(blob: Blob & { muted?: boolean }): Promise<Pcm> {
  const at = { recKB: Math.round(blob.size / 102.4) / 10, type: blob.type.split(';')[0] || 'none', muted: !!blob.muted };
  try {
    const buf = await new OfflineAudioContext(1, 16_000, 16_000).decodeAudioData(await blob.arrayBuffer());
    const pcm = buf.getChannelData(0);
    return { ...at, pcm, peak: peakOf(pcm), decoded: true };
  } catch {
    return { ...at, pcm: new Float32Array(0), peak: 0, decoded: false };
  }
}

/** A recorded take (16 kHz) sent: what was heard and each step's time; or why not. `t0`: when 止める was tapped;
 *  `signal`: the upload dropped (the step left). */
export async function transcribe(pcm: Float32Array, t0 = performance.now(), signal?: AbortSignal): Promise<Heard> {
  const bad = takeMiss(pcm);
  if (bad) return { ok: false, miss: bad };
  const audS = Math.min(pcm.length / 16_000, MAX_S);
  const wav = wav16k(pcm, MAX_S);
  const t1 = performance.now();
  const r = await keyed(relayUrl('/stt'), getKey(), { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav as BodyInit, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000) });
  if (!r.ok) return { ok: false, miss: relayMiss(r) };
  const j = (await r.res.json().catch(() => null)) as { ok?: boolean; text?: unknown; aiMs?: unknown } | null;
  const t2 = performance.now();
  if (j?.ok && typeof j.text === 'string') {
    const aiMs = typeof j.aiMs === 'number' ? j.aiMs : 0;
    return { ok: true, text: j.text, audS: Math.round(audS * 10) / 10, kb: Math.round(wav.length / 1024), encMs: Math.round(t1 - t0), netMs: Math.round(t2 - t1 - aiMs), aiMs, totMs: Math.round(t2 - t0) };
  }
  return { ok: false, miss: relayMiss(r) };
}
