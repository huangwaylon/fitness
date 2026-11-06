// ききみみ クイズ: the small DSP the speech conditions and their noise beds need (docs/kikimimi.md "Conditions"), for
// scripts/kikimimi-audio.ts and scripts/kikimimi-beds.ts. Mono float PCM at 24 kHz; ffmpeg decodes, convolves (afir as a
// plain convolution) and measures loudness. Deterministic: every random draw is seeded. Silent: nothing here plays.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mulberry32 } from '../../src/lib/random.ts';
import { FFMPEG, measureLoudness } from './tools.ts';

export const SR = 24000;

/** Any audio file as mono float PCM at 24 kHz. */
export function readPcm(file: string): Float32Array {
  const b = execFileSync(FFMPEG, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4).slice();
}

/** Mono float PCM as a 32-bit float WAV. */
export function writeWav(file: string, pcm: Float32Array, sr = SR): void {
  const data = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28);
  h.writeUInt16LE(4, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
}

/** A scratch dir for `f`, removed after. */
export function scratch<T>(f: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'kiki-dsp-'));
  try {
    return f(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Run PCM through an ffmpeg filter chain (and optional output args, e.g. a codec round trip). */
export function filter(pcm: Float32Array, af: string, encode: string[] = []): Float32Array {
  return scratch((d) => {
    const i = join(d, 'in.wav'), o = join(d, 'out.wav');
    writeWav(i, pcm);
    if (encode.length) {
      const c = join(d, 'codec.wav');
      execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', i, ...(af ? ['-af', af] : []), ...encode, c]);
      return readPcm(c);
    }
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', i, '-af', af, '-c:a', 'pcm_f32le', o]);
    return readPcm(o);
  });
}

/** Integrated loudness (LUFS) by ffmpeg loudnorm's measuring pass; -70 for silence. */
export function lufs(pcm: Float32Array): number {
  return scratch((d) => {
    const i = join(d, 'in.wav');
    writeWav(i, pcm);
    const v = measureLoudness(i).i;
    return Number.isFinite(v) ? v : -70;
  });
}

export const gain = (pcm: Float32Array, db: number): Float32Array => pcm.map((x) => x * 10 ** (db / 20));

/**
 * A synthetic room or hall impulse response: the direct path (1 at 0), then after `predelay` exponentially decaying
 * noise (−60 dB at `rt60`), a little darker as it decays (a one-pole low-pass sweeping down), its energy scaled to
 * `wet` of the direct path's.
 */
export function impulse(o: { rt60: number; wet: number; predelay: number }, seed = 7): Float32Array {
  const r = mulberry32(seed);
  const n = Math.round((o.predelay + o.rt60 * 1.1) * SR), d0 = Math.round(o.predelay * SR);
  const ir = new Float32Array(n);
  let lp = 0, e = 0;
  for (let i = d0; i < n; i++) {
    const t = (i - d0) / SR;
    const a = Math.exp(-6.91 * (t / o.rt60));
    const k = 0.5 * Math.exp(-t / (o.rt60 * 0.6)) + 0.08; // the low-pass coefficient: bright early, dark late
    lp += k * ((r() * 2 - 1) - lp);
    ir[i] = lp * a;
    e += ir[i] * ir[i];
  }
  const s = Math.sqrt(o.wet / (e || 1));
  for (let i = d0; i < n; i++) ir[i] *= s;
  ir[0] = 1;
  return ir;
}

/** PCM convolved with an impulse response (ffmpeg afir as a plain convolution), its tail kept. */
export function convolve(pcm: Float32Array, ir: Float32Array): Float32Array {
  return scratch((d) => {
    const i = join(d, 'in.wav'), h = join(d, 'ir.wav'), o = join(d, 'out.wav');
    const padded = new Float32Array(pcm.length + ir.length);
    padded.set(pcm);
    writeWav(i, padded);
    writeWav(h, ir);
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', i, '-i', h, '-filter_complex', '[0][1]afir=gtype=none:irnorm=-1:irgain=1', '-c:a', 'pcm_f32le', o]);
    return readPcm(o);
  });
}

/** A struck bell: inharmonic partials with their own decays. */
function bell(out: Float32Array, at: number, f: number, amp: number): void {
  const partials: [number, number, number][] = [[1, 1, 1.4], [2.0, 0.35, 0.9], [3.01, 0.18, 0.6], [4.17, 0.08, 0.35]];
  const start = Math.round(at * SR);
  for (let i = start; i < out.length; i++) {
    const t = (i - start) / SR;
    let s = 0;
    for (const [m, a, d] of partials) s += a * Math.sin(2 * Math.PI * f * m * t) * Math.exp(-t / (d * 0.5));
    out[i] += amp * s * Math.min(1, t / 0.004);
  }
}

/** The chime before a PA announcement: a soft two-tone ding-dong (E6 then C6), 1.5 s with its ring. */
export function chime(): Float32Array {
  const out = new Float32Array(Math.round(1.5 * SR));
  bell(out, 0, 1318.5, 0.3);
  bell(out, 0.42, 1046.5, 0.3);
  // fade the ring out over the last 0.3 s
  for (let i = out.length - Math.round(0.3 * SR), k = 0; i < out.length; i++, k++) out[i] *= 1 - k / (0.3 * SR);
  return out;
}

/** Shaped noise: white through a one-pole low-pass at `fc` (and a high-pass at `hp`), seeded. */
export function noise(n: number, r: () => number, fc: number, hp = 0): Float32Array {
  const out = new Float32Array(n);
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR), b = hp ? 1 - Math.exp((-2 * Math.PI * hp) / SR) : 0;
  let lp = 0, low = 0;
  for (let i = 0; i < n; i++) {
    lp += a * ((r() * 2 - 1) - lp);
    low += b * (lp - low);
    out[i] = lp - (hp ? low : 0);
  }
  return out;
}
