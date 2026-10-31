// The hourly music, from the user's own files to static/audio/music/ (docs/design.md#audio-files). The files are
// user-provided and committed by the user's decision; this script never downloads anything.
//   node scripts/music.ts <source dir> [--dry]
// Source: "1-01. Opening Theme.mp3", then "1-02. 1200 AM (Sunny).mp3" … "1-25. 1100 PM (Sunny).mp3" (one per hour).
// Each OST rip plays its loop about twice and fades out. For each hour: find the loop period (the lag at which the
// track repeats itself longest, from a spectral self-similarity scan, then sample-exact by cross-correlation), cut one
// period from a point where both passes are identical (so `<audio loop>` wraps without a seam), and record where in
// that file the loop begins musically (manifest `start`: playback starts there). The file is that period plus a copy
// of its first TAIL seconds (manifest `end` = where the period ends): the engine's two decks hand over inside the copy,
// where both hold the same samples, instead of relying on `<audio loop>` (WebKit seeks to 0 at the end, which can
// drop out). Then each file's loudness is measured and its `gain` written (see trackGain). Output: AAC-LC 64 kbps
// stereo 44.1 kHz .m4a with +faststart, and the `music.sunny` / `opening` entries of static/audio/manifest.json.
//   node scripts/music.ts --gains    only re-measure the committed files and rewrite their `gain`
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LEVELS } from '../src/lib/sound/mix.ts';

const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
const OUT = join(import.meta.dirname, '../static/audio/music');
const MANIFEST = join(import.meta.dirname, '../static/audio/manifest.json');
const SR = 44100;
/** Analysis rate and frame (≈ 93 ms hop). */
const ASR = 11025, FRAME = 2048, HOP = 1024, BANDS = 32;
const XFADE = Math.round(0.25 * SR);
/** The copy of the period's start after its end (s): room for the engine to line the incoming deck up. */
const TAIL = 3;
/** Loudness: every track to −16 LUFS integrated (EBU R128), unless that would put its true peak, after the gain and
 *  the music bus (LEVELS.music) at full volume, over −1 dBTP. Gains stay within −12…+6 dB. */
const TARGET_LUFS = -16, CEILING_DBTP = -1;
const BUS_DB = 20 * Math.log10(LEVELS.music);

function decode(file: string, rate: number, channels: number): Float32Array {
  const buf = execFileSync(FFMPEG, ['-v', 'error', '-i', file, '-vn', '-ac', String(channels), '-ar', String(rate), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(a * k), wi = Math.sin(a * k);
        const xr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const xi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - xr;
        im[i + k + len / 2] = im[i + k] - xi;
        re[i + k] += xr;
        im[i + k] += xi;
      }
    }
  }
}

/** Unit-length log-band spectra, one per hop. */
function features(x: Float32Array): Float64Array[] {
  const out: Float64Array[] = [];
  const win = Float64Array.from({ length: FRAME }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FRAME));
  // log-spaced bands from 80 Hz to 5 kHz
  const edges = Array.from({ length: BANDS + 1 }, (_, b) => Math.round(((80 * (5000 / 80) ** (b / BANDS)) / ASR) * FRAME));
  for (let s = 0; s + FRAME <= x.length; s += HOP) {
    const re = new Float64Array(FRAME), im = new Float64Array(FRAME);
    for (let i = 0; i < FRAME; i++) re[i] = x[s + i] * win[i];
    fft(re, im);
    const f = new Float64Array(BANDS);
    for (let b = 0; b < BANDS; b++) {
      let e = 0;
      for (let k = edges[b]; k < Math.max(edges[b] + 1, edges[b + 1]); k++) e += re[k] * re[k] + im[k] * im[k];
      f[b] = Math.log(1e-9 + e);
    }
    const mean = f.reduce((a, v) => a + v, 0) / BANDS;
    let norm = 0;
    for (let b = 0; b < BANDS; b++) norm += (f[b] -= mean) ** 2;
    norm = Math.sqrt(norm) || 1;
    for (let b = 0; b < BANDS; b++) f[b] /= norm;
    out.push(f);
  }
  return out;
}

const dot = (a: Float64Array, b: Float64Array) => a.reduce((s, v, i) => s + v * b[i], 0);

interface Loop {
  /** Loop start and period, in analysis frames, and the mean similarity over the matching run. */
  start: number;
  lag: number;
  sim: number;
  run: number;
}

/** For every lag ≥ 20 s: the longest run over which frame t matches frame t + lag (smoothed similarity ≥ thr). A lag is
 *  a loop when that run is at least as long as the lag itself. The largest such lag is the full loop (a smaller
 *  one is usually a phrase that repeats inside it). */
function findLoop(f: Float64Array[], thr = 0.8): Loop | null {
  const n = f.length;
  const minLag = Math.round((20 * ASR) / HOP);
  const loops: Loop[] = [];
  for (let lag = minLag; lag < n - minLag / 2; lag++) {
    const sims = Array.from({ length: n - lag }, (_, t) => dot(f[t], f[t + lag]));
    const W = 10;
    let best: Loop | null = null;
    let runStart = -1, acc = 0;
    for (let t = 0; t <= sims.length; t++) {
      let m = 0;
      if (t < sims.length) {
        const lo = Math.max(0, t - W), hi = Math.min(sims.length, t + W + 1);
        for (let k = lo; k < hi; k++) m += sims[k];
        m /= hi - lo;
      }
      if (t < sims.length && m >= thr) {
        if (runStart < 0) (runStart = t), (acc = 0);
        acc += sims[t];
      } else if (runStart >= 0) {
        const run = t - runStart;
        if (!best || run > best.run) best = { start: runStart, lag, sim: acc / run, run };
        runStart = -1;
      }
    }
    if (best && best.run >= lag + 8) loops.push(best);
  }
  if (!loops.length) return null;
  const maxLag = Math.max(...loops.map((l) => l.lag));
  // the best-matching lag within 1 s of the largest valid one
  return loops.filter((l) => l.lag >= maxLag - ASR / HOP).sort((a, b) => b.sim - a.sim)[0];
}

/** Sample-exact period: the lag (within ±150 ms of `approx`) that best lines up 1 s of audio at `at` with the audio
 *  one period later, and how well (1 = identical: the rip's loops are bit-for-bit repeats once past the first pass's
 *  opening, which lacks the reverb that spills over from the loop's end). */
function refine(x: Float32Array, at: number, approx: number): [number, number] {
  const N = SR, span = Math.round(0.15 * SR);
  let best = approx, bestC = -Infinity;
  for (let d = -span; d <= span; d++) {
    let c = 0, e1 = 0, e2 = 0;
    for (let i = 0; i < N; i += 3) {
      const a = x[at + i], b = x[at + approx + d + i];
      c += a * b;
      e1 += a * a;
      e2 += b * b;
    }
    c /= Math.sqrt(e1 * e2) || 1;
    if (c > bestC) (bestC = c), (best = approx + d);
  }
  return [best, bestC];
}

/** First sample louder than −40 dBFS. */
const onset = (x: Float32Array) => Math.max(0, x.findIndex((v) => Math.abs(v) > 0.01));

function encode(pcm: Float32Array, out: string): void {
  const raw = join(tmpdir(), `music-${process.pid}.f32`);
  writeFileSync(raw, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw,
    '-c:a', 'aac', '-b:a', '64k', '-ar', String(SR), '-movflags', '+faststart', out], { stdio: 'inherit' });
  rmSync(raw);
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${out}`);
}

/** Integrated loudness (LUFS) and true peak (dBTP) of a file, from ffmpeg's loudnorm analysis pass. */
function loudness(file: string): { i: number; tp: number } {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const json = r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1);
  const m = JSON.parse(json) as { input_i: string; input_tp: string };
  return { i: Number(m.input_i), tp: Number(m.input_tp) };
}

/** The gain (dB, 0.1 steps) that brings a track to the target, held under the true-peak ceiling. */
function trackGain({ i, tp }: { i: number; tp: number }): number {
  const g = Math.min(TARGET_LUFS - i, CEILING_DBTP - BUS_DB - tp);
  return Math.round(Math.min(6, Math.max(-12, g)) * 10) / 10;
}

type Entry = { file: string; start: number; end?: number; gain?: number };

/** Measure every music file in the manifest and write its `gain`. */
function writeGains(man: { opening?: string | Entry | null; music?: Record<string, Record<string, Entry>> }): void {
  const entries: [string, Entry][] = Object.entries(man.music ?? {}).flatMap(([w, hours]) => Object.entries(hours).map(([h, e]) => [`${w}/${h}`, e] as [string, Entry]));
  if (man.opening) {
    const o: Entry = typeof man.opening === 'string' ? { file: man.opening, start: 0 } : man.opening;
    man.opening = o;
    entries.unshift(['opening', o]);
  }
  for (const [name, e] of entries) {
    const l = loudness(join(OUT, '..', e.file));
    e.gain = trackGain(l);
    console.log(`${name.padEnd(9)} ${l.i.toFixed(1)} LUFS  ${l.tp >= 0 ? '+' : ''}${l.tp.toFixed(1)} dBTP  → gain ${e.gain >= 0 ? '+' : ''}${e.gain.toFixed(1)} dB` +
      `  (${(l.i + e.gain).toFixed(1)} LUFS)`);
  }
}

function main(): void {
  const [src, ...flags] = process.argv.slice(2);
  if (src === '--gains') {
    const man = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    writeGains(man);
    writeFileSync(MANIFEST, JSON.stringify(man, null, 2) + '\n');
    return;
  }
  if (!src) throw new Error('usage: node scripts/music.ts <source dir> [--dry] | --gains');
  const dry = flags.includes('--dry');
  mkdirSync(OUT, { recursive: true });
  const files = readdirSync(src).filter((f) => f.endsWith('.mp3')).sort();
  const hours: Record<string, Entry> = {};
  let opening = false;
  for (const file of files) {
    const path = join(src, file);
    const m = file.match(/^\d+-(\d+)\. /);
    const idx = m ? Number(m[1]) : NaN;
    if (idx === 1) {
      // the opening theme is a one-shot: as is, minus trailing silence
      if (!dry) {
        execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', path, '-vn', '-af', 'areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse',
          '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', String(SR), '-movflags', '+faststart', join(OUT, 'opening.m4a')]);
      }
      opening = true;
      console.log(`opening       ${file}`);
      continue;
    }
    const hour = idx - 2;
    if (!(hour >= 0 && hour < 24)) continue;
    const loop = findLoop(features(decode(path, ASR, 1)));
    if (!loop) throw new Error(`${file}: no repeat found; cut it by hand`);
    const mono = decode(path, SR, 1);
    // The musical start of the loop: the first sound when the loop begins within 3 s of it (no intro), else where
    // the repeat begins (after an intro).
    const runAt = Math.round((loop.start * HOP * SR) / ASR);
    const first = onset(mono);
    const musical = runAt - first < 3 * SR ? Math.min(first, runAt) : runAt;
    // Cut one period from a point where both passes are identical (≥ 8 s into the loop), so the wrap is seamless.
    let cut = 0, period = 0, corr = -1;
    for (const off of [8, 12, 16, 20]) {
      const at = runAt + off * SR;
      const [p, c] = refine(mono, at, Math.round((loop.lag * HOP * SR) / ASR));
      if (c > corr) [cut, period, corr] = [at, p, c];
      if (c > 0.995) break;
    }
    if (corr < 0.98) console.warn(`  ! ${file}: best loop match only ${corr.toFixed(4)}`);
    const st = decode(path, SR, 2);
    const tail = TAIL * SR;
    const pcm = new Float32Array((period + tail) * 2);
    for (let i = 0; i < period; i++) {
      const j = i - (period - XFADE);
      // equal-power blend of the tail into the audio just before the cut's first sample (a safety net: with an exact
      // period both are the same samples)
      const w = j >= 0 ? Math.sin((Math.PI / 2) * (j / XFADE)) : 0;
      const k = Math.cos((Math.PI / 2) * (j >= 0 ? j / XFADE : 0));
      for (let c = 0; c < 2; c++) pcm[i * 2 + c] = k * st[(cut + i) * 2 + c] + (w ? w * st[(cut + i - period) * 2 + c] : 0);
    }
    // the copy of the period's start: the same samples the loop wraps to
    pcm.copyWithin(period * 2, 0, tail * 2);
    // Where to start playing in the file: the loop's musical start, as heard on the second pass.
    const start = (musical + period - cut) / SR;
    const name = `hour-${String(hour).padStart(2, '0')}.m4a`;
    if (!dry) encode(pcm, join(OUT, name));
    const kb = dry ? 0 : Math.round(statSync(join(OUT, name)).size / 1024);
    hours[String(hour).padStart(2, '0')] = { file: `music/${name}`, start: Math.round(start * 1000) / 1000, end: Math.round((period / SR) * 1e6) / 1e6 };
    console.log(`${name}  ${file}  ${(mono.length / SR).toFixed(1)}s → period ${(period / SR).toFixed(3)}s cut at ${(cut / SR).toFixed(2)}s ` +
      `(match ${corr.toFixed(4)}), plays from ${start.toFixed(2)}s` + (dry ? '' : `  ${kb} KB`));
  }
  if (dry) return;
  // static/audio/manifest.json: the sunny hours and the opening (the rest of the file is kept as is)
  const man = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  man.music = { ...man.music, sunny: hours };
  if (opening) man.opening = { file: 'music/opening.m4a', start: 0 };
  writeGains(man);
  writeFileSync(MANIFEST, JSON.stringify(man, null, 2) + '\n');
}

main();
