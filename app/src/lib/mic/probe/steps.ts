// ききみみ's mic probe, the pure half (docs/kikimimi-mic.md "The probe"): the pinned sentences, the input's class from its label,
// levels in dB, a click's onset (the round trip), a take as a 16 kHz WAV, the closed sets of the log's `mic.*` events.
// The label, the heard text and the audio never leave these functions' callers: only numbers and closed sets do.

/** The 3 sentences: clean US clips from the ladders' 1.0× rung, the same on both phones (no digits: the WER reads words). */
export const SENTENCES = [
  { clip: 'sp-cat-2', ladder: 'sp-cat' },
  { clip: 'sp-half-nine-2', ladder: 'sp-half-nine' },
  { clip: 'sp-onions-2', ladder: 'sp-onions' }
] as const;

export type Inp = 'builtin' | 'bluetooth' | 'wired' | 'other';
export type Ear = 'none' | 'wired' | 'bluetooth';
export type Loud = 'none' | 'quiet' | 'ok';
export type SttErr = 'not-allowed' | 'service-not-allowed' | 'network' | 'no-speech' | 'aborted' | 'audio-capture' | 'oom' | 'timeout' | 'other';

/** An input device's class from its label (read on the phone, never logged). */
export function inputClass(label: string): Inp {
  const l = label.toLowerCase();
  if (/airpods|bluetooth|beats|buds|hands-?free|headset/.test(l)) return 'bluetooth';
  if (/iphone|built-?in|内蔵|default|マイク$/.test(l) || l === '') return 'builtin';
  if (/headphone|earpod|wired|usb|lightning|ヘッドフォン|イヤホン/.test(l)) return 'wired';
  return 'other';
}

/** A speech recogniser's (or a fetch's) failure as the log's closed set. */
export function sttErr(code: unknown): SttErr {
  const c = String(code ?? '');
  const known: readonly SttErr[] = ['not-allowed', 'service-not-allowed', 'network', 'no-speech', 'aborted', 'audio-capture', 'timeout'];
  return (known as readonly string[]).includes(c) ? (c as SttErr) : 'other';
}

/** RMS level in dBFS (−120 for silence). */
export function dbfs(x: Float32Array, from = 0, to = x.length): number {
  let s = 0;
  const n = Math.max(1, to - from);
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.max(-120, 10 * Math.log10(s / n || 1e-12));
}

/** The first sample at or after `from` louder than `floor` dBFS + 20 dB (a click picked up), or −1. */
export function onset(x: Float32Array, from: number, floorDb: number): number {
  const thr = 10 ** ((floorDb + 20) / 20);
  for (let i = Math.max(0, from); i < x.length; i++) if (Math.abs(x[i]) > thr) return i;
  return -1;
}

/** Mono PCM averaged down from `sr` to 16 kHz (whisper's input; the relay's WAV). */
export function to16k(x: Float32Array, sr: number): Float32Array {
  const step = sr / 16000, n = Math.floor(x.length / step), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * step), b = Math.max(a + 1, Math.floor((i + 1) * step));
    let s = 0;
    for (let j = a; j < b; j++) s += x[j] ?? 0;
    out[i] = s / (b - a);
  }
  return out;
}

/** A take as 16 kHz 16-bit mono WAV bytes (averaged down from `sr`). */
export function wav16k(x: Float32Array, sr: number): Uint8Array {
  const y = to16k(x, sr), n = y.length;
  const out = new Uint8Array(44 + n * 2), v = new DataView(out.buffer);
  const tag = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); tag(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, y[i])) * 32767), true);
  return out;
}

/** End of speech: true once a take has had speech (−45 dBFS a frame) and then `hangMs` of quiet. Feed it frames. */
export function silenceAfterSpeech(hangMs = 1200): (db: number, ms: number) => boolean {
  let spoke = false, quiet = 0;
  return (db, ms) => {
    if (db > -45) return (spoke = true), (quiet = 0), false;
    quiet += ms;
    return spoke && quiet >= hangMs;
  };
}

/** A WER as the log carries it: a percentage (the log keeps 0.1). */
export const werPct = (w: number): number => Math.round(w * 1000) / 10;
