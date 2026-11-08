// A voice's pitch and loudness, frame by frame (docs/kikimimi-mic.md "Pitch and timing"): YIN's f0 (de Cheveigné & Kawahara 2002)
// over a 32 ms window every 10 ms, 70–400 Hz, threshold 0.15 (none under it: the deepest dip if under 0.4, as our
// compressed clips need); each frame's level in dB; then a 5-point median and the
// octave jumps folded back toward the speaker's median. The same code reads the take (16 kHz) and the villager's clip
// (any rate, brought to 16 kHz by vad.ts's decimator: `monoOf`). Pure.
import { SR, To16k } from './vad.ts';

/** A frame every HOP samples (10 ms at 16 kHz), WIN samples long (32 ms). */
const HOP = 160;
const WIN = 512;
const FMIN = 70, FMAX = 400, THRESHOLD = 0.15, FALLBACK = 0.4;
/** Below the loudest frame by more than this (dB), a frame is silence (never voiced). */
const QUIET_DB = 30;

/** Per frame (10 ms): f0 in Hz (0: unvoiced) and the level in dB. */
export interface Frames {
  f0: Float32Array;
  db: Float32Array;
}

/** A decoded clip as mono 16 kHz samples (its channels averaged). */
export function monoOf(buf: { numberOfChannels: number; sampleRate: number; length: number; getChannelData(c: number): Float32Array }): Float32Array {
  const m = new Float32Array(buf.length);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < m.length; i++) m[i] += d[i] / buf.numberOfChannels;
  }
  return new To16k(buf.sampleRate).push(m);
}

/** One frame's f0 by YIN (0: no period under the threshold). `d` is scratch of tauMax + 1. */
function yinFrame(x: Float32Array, s: number, d: Float32Array, tauMin: number, tauMax: number): number {
  const w = WIN - tauMax;
  // the difference function, then its cumulative mean normalised form, in place
  d[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let acc = 0;
    for (let j = 0; j < w; j++) {
      const v = x[s + j] - x[s + j + tau];
      acc += v * v;
    }
    run += acc;
    d[tau] = run > 0 ? (acc * tau) / run : 1;
  }
  // the first dip under the threshold; none: the deepest, if periodic enough (YIN's step 4, capped: hiss stays unvoiced)
  let pick = -1, best = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (best < 0 || d[tau] < d[best]) best = tau;
    if (d[tau] >= THRESHOLD) continue;
    while (tau + 1 <= tauMax && d[tau + 1] < d[tau]) tau++;
    pick = tau;
    break;
  }
  if (pick < 0 && best >= 0 && d[best] < FALLBACK) pick = best;
  if (pick < 0) return 0;
  // the parabola through the dip and its neighbours: a period between samples
  const a = d[pick - 1], b = d[pick], c = pick + 1 <= tauMax ? d[pick + 1] : b;
  const den = a - 2 * b + c, shift = den > 0 ? (0.5 * (a - c)) / den : 0;
  return SR / (pick + Math.max(-1, Math.min(1, shift)));
}

/** The median of a few numbers. */
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The speaker's median f0 over the voiced frames (0: none). */
export function medianF0(f0: Float32Array): number {
  const v: number[] = [];
  for (const f of f0) if (f > 0) v.push(f);
  return v.length ? median(v) : 0;
}

/** f0 and the level per 10 ms of 16 kHz samples: quiet frames unvoiced, an octave jump folded back, voiced runs under
 *  30 ms dropped, a 5-point median over each run. */
export function frames(x: Float32Array): Frames {
  const n = x.length >= WIN ? Math.floor((x.length - WIN) / HOP) + 1 : 0;
  const f0 = new Float32Array(n), db = new Float32Array(n);
  const tauMin = Math.floor(SR / FMAX), tauMax = Math.ceil(SR / FMIN), d = new Float32Array(tauMax + 1);
  let top = -Infinity;
  for (let k = 0; k < n; k++) {
    const s = k * HOP;
    let e = 0;
    for (let j = 0; j < WIN; j++) e += x[s + j] * x[s + j];
    db[k] = 10 * Math.log10(e / WIN + 1e-12);
    top = Math.max(top, db[k]);
  }
  for (let k = 0; k < n; k++) f0[k] = db[k] < top - QUIET_DB || db[k] < -60 ? 0 : yinFrame(x, k * HOP, d, tauMin, tauMax);
  repairOctaves(f0);
  dropShort(f0, 3);
  smooth(f0);
  return { f0, db };
}

/** A frame an octave off the speaker's median (a period doubled or halved) folded back into its range. */
function repairOctaves(f0: Float32Array): void {
  const m = medianF0(f0);
  if (!m) return;
  for (let k = 0; k < f0.length; k++) {
    const f = f0[k];
    if (f > m * 1.7 && f / 2 >= FMIN) f0[k] = f / 2;
    else if (f && f < m / 1.7 && f * 2 <= FMAX) f0[k] = f * 2;
  }
}

/** Voiced runs shorter than `min` frames unvoiced (a click, a breath). */
function dropShort(f0: Float32Array, min: number): void {
  let k = 0;
  while (k < f0.length) {
    if (!f0[k]) {
      k++;
      continue;
    }
    let e = k;
    while (e < f0.length && f0[e]) e++;
    if (e - k < min) f0.fill(0, k, e);
    k = e;
  }
}

/** A 5-point median over each voiced frame's voiced neighbours. */
function smooth(f0: Float32Array): void {
  const was = Float32Array.from(f0);
  for (let k = 0; k < f0.length; k++) {
    if (!was[k]) continue;
    const near: number[] = [];
    for (let j = k - 2; j <= k + 2; j++) if (j >= 0 && j < was.length && was[j]) near.push(was[j]);
    f0[k] = median(near);
  }
}

/** f0 in semitones from `ref` (NaN: unvoiced). */
export function semitones(f0: Float32Array, ref: number): Float32Array {
  return f0.map((f) => (f > 0 && ref > 0 ? 12 * Math.log2(f / ref) : NaN));
}
