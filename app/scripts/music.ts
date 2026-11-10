// The app's music and jingles, from the user's own files to static/audio/ (docs/design.md#audio-files). The files are
// user-provided and committed by the user's decision; this script never downloads anything.
//   node scripts/music.ts <source dir> [--only <regex over manifest keys>] [--dry]
//   node scripts/music.ts --gains    only re-measure the committed files and rewrite their `gain`
//   node scripts/music.ts --hashes   only rewrite every entry's content hash `v` (after replacing a file by hand)
//   node scripts/music.ts --durations   only re-measure the one-shots' lengths `d` (K.K.'s, the events')
// Source: the NH OST rip ("1-02. 1200 AM (Sunny).mp3": disc 1 sunny hours, 2 rain and snow, 3 places, 4 events and
// jingles) and the GameCube / e+ rip ("150 - K.K. Chorale (LIVE).mp3"), each file named by its track number in
// CATALOGUE. Loops: each OST rip plays its loop about twice and fades out. Find the loop period (the lag at which the
// track repeats itself longest, from a spectral self-similarity scan, then sample-exact by cross-correlation), cut one
// period from a point where both passes are identical (so `<audio loop>` wraps without a seam), and record where in
// that file the loop begins musically (manifest `start`: playback starts there). The file is that period plus a copy
// of its first TAIL seconds (manifest `end` = where the period ends): the engine's two decks hand over inside the copy,
// where both hold the same samples, instead of relying on `<audio loop>` (WebKit seeks to 0 at the end, which can
// drop out). One-shots are trimmed of silence; jingles (sfx) also mono, faded at both ends, with their loudness baked
// in (sfx entries have no `gain`). Then each music file's loudness is measured and its `gain` written (trackGain), and
// every entry's `v` (its file's content hash: the app fetches `file?v=`, so a re-cut file under the same name is a new
// URL and /audio/* can be cached as immutable).
// Output: AAC-LC stereo 44.1 kHz .m4a with +faststart at 64 kbps (K.K.'s from the GameCube rip mono at 40), and the
// entries of static/audio/manifest.json and kk.json (K.K.'s; the rest of the files is kept as is).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LEVELS } from '../src/lib/sound/mix.ts';
import { RADIO_HOLIDAYS, RADIO_SLOTS, RADIO_VARIANTS } from '../src/lib/sound/ids.ts';
import type { MusicTrack } from '../src/lib/sound/hourly.ts';

const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE ?? '/opt/homebrew/bin/ffprobe';
const OUT = join(import.meta.dirname, '../static/audio');
const MANIFEST = join(import.meta.dirname, '../static/audio/manifest.json');
/** K.K.'s songs and airchecks: their own file (the app loads it when first needed: src/lib/sound/kk.ts). */
const KK_MANIFEST = join(import.meta.dirname, '../static/audio/kk.json');
const KK_KEYS = ['kk', 'kkAircheck'];

/** Both files as one (`kk`, `kkAircheck` from kk.json). */
function readManifest(): Manifest {
  const kk = JSON.parse(readFileSync(KK_MANIFEST, 'utf8')) as Record<string, unknown>;
  const man = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;
  for (const k of KK_KEYS) if (kk[k] !== undefined) man[k] = kk[k];
  return Object.assign(man, { _kkReadme: kk._readme });
}

/** Split back into the two files. */
function writeManifest(man: Manifest): void {
  const { _kkReadme, ...rest } = man;
  const kk: Record<string, unknown> = { _readme: _kkReadme };
  for (const k of KK_KEYS) {
    kk[k] = rest[k];
    delete rest[k];
  }
  writeFileSync(MANIFEST, JSON.stringify(rest, null, 2) + '\n');
  writeFileSync(KK_MANIFEST, JSON.stringify(kk, null, 2) + '\n');
}
const SR = 44100;
/** Analysis rate and frame (≈ 93 ms hop). */
const ASR = 11025, FRAME = 2048, HOP = 1024, BANDS = 32;
/** The blend at the wrap (s): short where both passes are the same samples, long where the rip's second pass is a
 *  variation (rain at 4 PM: the same phrase, other samples, and no exact repeat in the rip). */
const XFADE_S = 0.25, XFADE_VARIED_S = 2;
/** The copy of the period's start after its end (s): room for the engine to line the incoming deck up. */
const TAIL = 3;
/** Stung by Bees is heard once: its first pass (the intro and one 10.3 s loop), faded out. */
const STUNG_S = 11.5;
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
function findLoop(f: Float64Array[], thr = 0.8, minLagS = 20): Loop | null {
  const n = f.length;
  const minLag = Math.round((minLagS * ASR) / HOP);
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

/** How alike 1 s of audio at `at` is to the audio `lag` samples later (normalised correlation: 1 = identical). */
function match(x: Float32Array, at: number, lag: number): number {
  let c = 0, e1 = 0, e2 = 0;
  for (let i = 0; i < SR; i += 3) {
    const a = x[at + i], b = x[at + lag + i];
    c += a * b;
    e1 += a * a;
    e2 += b * b;
  }
  return c / (Math.sqrt(e1 * e2) || 1);
}

/** Sample-exact period: the lag (within ±150 ms of `approx`) that best lines up 1 s of audio at `at` with the audio
 *  one period later, and how well (1 = identical: the rip's loops are bit-for-bit repeats once past the first pass's
 *  opening, which lacks the reverb that spills over from the loop's end). */
function refine(x: Float32Array, at: number, approx: number): [number, number] {
  const span = Math.round(0.15 * SR);
  let best = approx, bestC = -Infinity;
  for (let d = -span; d <= span; d++) {
    const c = match(x, at, approx + d);
    if (c > bestC) (bestC = c), (best = approx + d);
  }
  return [best, bestC];
}

/** First sample louder than −40 dBFS. */
const onset = (x: Float32Array) => Math.max(0, x.findIndex((v) => Math.abs(v) > 0.01));

function encode(pcm: Float32Array, out: string, kbps = 64): void {
  const raw = join(tmpdir(), `music-${process.pid}.f32`);
  writeFileSync(raw, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw,
    '-c:a', 'aac', '-b:a', `${kbps}k`, '-ar', String(SR), '-movflags', '+faststart', out], { stdio: 'inherit' });
  rmSync(raw);
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${out}`);
}

/** One loop period of an OST rip, written to static/audio/<name>: the period plus a copy of its first TAIL s,
 *  and its manifest entry (`start` where the loop begins musically, `end` where the period ends). `minLagS`: the
 *  shortest loop to look for (the wasps' chase loops in seconds). `periodS`: the period, known (a rain or snow hour
 *  has its sunny hour's: their rips hold one pass and a few seconds of the next, too little to find it in). */
function looped(path: string, file: string, row: Row, dry: boolean, periodS = row.periodS): Entry {
  const { file: name, minLagS = 20, kbps = 64 } = row;
  const mono = decode(path, SR, 1);
  const first = onset(mono);
  if (row.whole) {
    // the piece itself, from its first sound to its last, then again from the top
    const last = mono.findLastIndex((v) => Math.abs(v) > 0.001) + 1;
    const st = decode(path, SR, 2).subarray(first * 2, last * 2);
    const pcm = new Float32Array(st.length + TAIL * SR * 2);
    pcm.set(st);
    pcm.set(st.subarray(0, TAIL * SR * 2), st.length);
    if (!dry) encode(pcm, join(OUT, name), kbps);
    console.log(`${name}  ${file}  the whole piece, ${((last - first) / SR).toFixed(3)}s`);
    return { file: name, start: 0, end: Math.round(((last - first) / SR) * 1e6) / 1e6 };
  }
  let runAt: number, lag: number;
  if (periodS) {
    // the loop begins where the audio first matches itself one period later
    lag = Math.round(periodS * SR);
    runAt = first;
    for (let t = first; t + lag + 1.2 * SR < mono.length; t += SR / 2) if (refine(mono, t, lag)[1] >= 0.95) (runAt = t), (t = Infinity);
  } else {
    const loop = findLoop(features(decode(path, ASR, 1)), 0.8, minLagS);
    if (!loop) throw new Error('no repeat found; cut it by hand');
    runAt = Math.round((loop.start * HOP * SR) / ASR);
    lag = Math.round((loop.lag * HOP * SR) / ASR);
  }
  // The musical start of the loop: the first sound when the loop begins within 3 s of it (no intro), else where
  // the repeat begins (after an intro).
  const musical = runAt - first < 3 * SR ? Math.min(first, runAt) : runAt;
  // Cut one period from a point where both passes are identical on both sides (the wrap blends the second pass's
  // last moments into the first's just before the cut), so the wrap is seamless: the first second that does, else the best.
  let cut = 0, period = 0, corr = -1;
  for (let off = 1; off <= (minLagS >= 20 ? 120 : 4); off++) {
    const at = runAt + off * SR;
    if (at + lag + 1.2 * SR > mono.length) break;
    const [p, c] = refine(mono, at, lag);
    const m = Math.min(c, match(mono, at - SR, p));
    if (m > corr) [cut, period, corr] = [at, p, m];
    if (m > 0.995) break;
  }
  if (corr < 0.98) console.warn(`  ! ${file}: best loop match only ${corr.toFixed(4)}: a ${XFADE_VARIED_S} s blend`);
  // no repeat at all (a room's generative texture): keep the known period, on the music's beat
  if (periodS && corr < 0.9) period = lag;
  const XFADE = Math.round((corr < 0.98 ? XFADE_VARIED_S : XFADE_S) * SR);
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
  const start = ((((musical - cut) % period) + period) % period) / SR;
  if (!dry) encode(pcm, join(OUT, name), kbps);
  const kb = dry ? 0 : Math.round(statSync(join(OUT, name)).size / 1024);
  console.log(`${name}  ${file}  ${(mono.length / SR).toFixed(1)}s → period ${(period / SR).toFixed(3)}s cut at ${(cut / SR).toFixed(2)}s ` +
    `(match ${corr.toFixed(4)}), plays from ${start.toFixed(2)}s` + (dry ? '' : `  ${kb} KB`));
  return { file: name, start: Math.round(start * 1000) / 1000, end: Math.round((period / SR) * 1e6) / 1e6 };
}


const TRIM = 'silenceremove=start_periods=1:start_threshold=-60dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse';

/** A one-shot (the opening, an event's jingle, a K.K. song): as is, minus the silence at both ends; `seconds` keeps
 *  only that long, faded out over its last 1.5 s. */
function oneShot(path: string, out: string, dry: boolean, kbps: number, seconds?: number, channels = 2): void {
  const cut = seconds ? `,atrim=0:${seconds},afade=t=out:st=${seconds - 1.5}:d=1.5` : '';
  if (dry) return;
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', path, '-vn', '-af', TRIM + cut,
    '-c:a', 'aac', '-b:a', `${kbps}k`, '-ac', String(channels), '-ar', String(SR), '-movflags', '+faststart', out]);
}

/** A jingle as an effect file: trimmed, 10 ms in and 80 ms out, mono, its loudness gain applied to the samples.
 *  `seconds` keeps only that long (a fanfare before the bed its OST track loops under it), faded over its last
 *  quarter (1.5 s at most). */
function jingle(path: string, out: string, dry: boolean, seconds?: number): void {
  if (dry) return;
  const wav = join(tmpdir(), `jingle-${process.pid}.wav`);
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', path, '-vn', '-af', TRIM + (seconds ? `,atrim=0:${seconds}` : ''), '-ac', '1', '-ar', String(SR), wav]);
  const s = statSync(wav).size / 2 / SR; // 16-bit mono
  const fade = seconds ? Math.min(1.5, s / 4) : 0.08;
  const g = trackGain(loudness(wav));
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', wav, '-af', `volume=${g}dB,afade=t=in:d=0.01,afade=t=out:st=${s - fade}:d=${fade}`,
    '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', out]);
  rmSync(wav);
}

type Kind = 'loop' | 'once' | 'sfx';
/** A manifest entry to build: its dotted key (`music.rain.07`, `events.halloween`, `sfx.get-fanfare`), its file under
 *  static/audio/, and how. `minLagS`: the shortest loop to look for (the wasps' chase loops in seconds); `seconds`:
 *  a one-shot cut to that long; `kbps`: the bitrate (64); a loop's period when the rip is too short to find it in,
 *  known (`periodS`, measured once) or an entry's whose period it shares (`periodOf`); `whole`: a piece that doesn't
 *  loop in its rip, looped whole. */
interface Row {
  key: string; file: string; kind: Kind;
  minLagS?: number; seconds?: number; kbps?: number; periodS?: number; periodOf?: string; whole?: boolean;
  /** A one-shot in one channel; a K.K. song's titles (`kk.<id>`). */
  mono?: boolean; ja?: string; en?: string;
}

/** K.K.'s songs in NH's order: id, NH's official titles (the game's text: ja, en), and the source's track numbers of
 *  the live version and the aircheck (the GameCube rip 150-207 and 208-262, e+'s 517-531 and 532-546). The first
 *  nine's live files came from the user's NH rip (null: kept as they are). */
const KK: [id: string, ja: string, en: string, live: string | null, aircheck: string | null][] = [
  ['kk-chorale', 'けけさんびか', 'K.K. Chorale', null, '208'],
  ['kk-march', 'けけマーチ', 'K.K. March', null, '209'],
  ['kk-waltz', 'けけワルツ', 'K.K. Waltz', null, '210'],
  ['kk-swing', 'けけスウィング', 'K.K. Swing', null, '211'],
  ['kk-jazz', 'けけジャズ', 'K.K. Jazz', '154', '212'],
  ['kk-fusion', 'けけフュージョン', 'K.K. Fusion', '155', '213'],
  ['kk-etude', 'けけのエチュード', 'K.K. Étude', '156', '214'],
  ['kk-lullaby', 'けけララバイ', 'K.K. Lullaby', '157', '215'],
  ['kk-aria', 'けけマリア', 'K.K. Aria', '158', '216'],
  ['kk-samba', 'けけサンバ', 'K.K. Samba', '159', '217'],
  ['kk-bossa', 'けけボッサ', 'K.K. Bossa', null, '218'],
  ['kk-calypso', 'けけカリプソ', 'K.K. Calypso', '161', '219'],
  ['kk-salsa', 'けけサルサ', 'K.K. Salsa', null, '220'],
  ['kk-mambo', 'けけマンボ', 'K.K. Mambo', '163', '221'],
  ['kk-reggae', 'けけレゲエ', 'K.K. Reggae', null, '222'],
  ['kk-ska', 'けけスカ', 'K.K. Ska', '165', '223'],
  ['kk-tango', 'けけタンゴ', 'K.K. Tango', '166', '224'],
  ['kk-faire', 'ハイサイけけ', 'K.K. Faire', '167', '225'],
  ['kk-aloha', 'アロハけけ', 'Aloha K.K.', '168', '226'],
  ['kk-lucky', 'アイリッシュそんぐ', 'Lucky K.K.', '169', '227'],
  ['kk-condor', 'ペルーのうた', 'K.K. Condor', '170', '228'],
  ['kk-steppe', 'コサックそんぐ', 'K.K. Steppe', '171', '229'],
  ['kk-imperial', 'けけチャイナ', 'Imperial K.K.', '172', '230'],
  ['kk-casbah', 'トルコそんぐ', 'K.K. Casbah', '173', '231'],
  ['kk-safari', 'けけアフロ', 'K.K. Safari', '174', '232'],
  ['kk-folk', 'けけみんよう', 'K.K. Folk', '175', '233'],
  ['kk-rock', 'けけロック', 'K.K. Rock', null, '234'],
  ['kk-rockin', 'けけのロケンロール', "Rockin' K.K.", null, '235'],
  ['kk-ragtime', 'ラグタイム', 'K.K. Ragtime', '178', '236'],
  ['kk-gumbo', 'ニューオリンズそんぐ', 'K.K. Gumbo', '179', '237'],
  ['kk-funk', 'けけファンク', 'The K. Funk', '180', '238'],
  ['kk-blues', 'けけブルース', 'K.K. Blues', '181', '239'],
  ['kk-soulful', 'けけゴスペル', 'Soulful K.K.', '182', '240'],
  ['kk-soul', 'けけソウル', 'K.K. Soul', '183', '241'],
  ['kk-cruisin', 'アーバンけけ', "K.K. Cruisin'", '184', '242'],
  ['kk-love-song', 'けけラヴソング', 'K.K. Love Song', '185', '243'],
  ['kk-dnb', 'ドラムンベース', 'K.K. D&B', '186', '244'],
  ['kk-technopop', 'テクノビート', 'K.K. Technopop', '187', '245'],
  ['kk-dj', 'ユーロビート', 'DJ K.K.', '188', '246'],
  ['kk-only-me', 'オンリーミー', 'Only Me', '189', '247'],
  ['kk-country', 'けけカントリー', 'K.K. Country', '190', '248'],
  ['kk-surfin', 'エレキそんぐ', "Surfin' K.K.", '191', '249'],
  ['kk-ballad', 'けけバラッド', 'K.K. Ballad', '192', '250'],
  ['kk-comrade', 'しょうわけけかよう', 'Comrade K.K.', '193', '251'],
  ['kk-lament', 'けけえんか', 'K.K. Lament', '194', '252'],
  ['kk-go-rider', 'ゆけ!けけライダー', 'Go K.K. Rider', '195', '253'],
  ['kk-dirge', 'こわいうた', 'K.K. Dirge', '196', '254'],
  ['kk-western', 'けけウェスタン', 'K.K. Western', '197', '255'],
  ['kk-mr', 'けけせんせい', 'Mr. K.K.', '198', '256'],
  ['kk-cafe', 'けけパリ', 'Café K.K.', '199', '257'],
  ['kk-parade', 'けけパレード', 'K.K. Parade', '200', '258'],
  ['kk-mariachi', 'セニョールけけ', 'K.K. Mariachi', '201', '259'],
  ['kk-song', 'けけソング', 'K.K. Song', '202', '260'],
  ['kk-i-love-you', 'だいすき', 'I Love You', '203', '261'],
  ['kk-two-days-ago', 'おととい', 'Two Days Ago', '204', '262'],
  // the GameCube's "Not My Bag" songs (an unknown request): each one song
  ['kk-my-place', 'ぼくのばしょ', 'My Place', '205', '532'],
  ['kk-forest-life', 'もりのせいかつ', 'Forest Life', '206', '533'],
  ['kk-to-the-edge', 'ナミナミ', 'To the Edge', '207', '534'],
  ['kk-pondering', 'かんがえちゅう', 'Pondering', '517', '535'],
  ['kk-dixie', 'けけディキシー', 'K.K. Dixie', '518', '536'],
  ['kk-marathon', 'けけガムラン', 'K.K. Marathon', '519', '537'],
  ['kk-king', 'けけだいみょう', 'King K.K.', '520', '538'],
  ['kk-mountain-song', 'アルペンそんぐ', 'Mountain Song', '521', '539'],
  ['kk-marine-song-2001', 'ふなうた2001', 'Marine Song 2001', '522', '540'],
  ['kk-neapolitan', 'ナポリタン', 'Neapolitan', '523', '541'],
  ['kk-steep-hill', 'にだんざか', 'Steep Hill', '524', '542'],
  ['kk-rockabilly', 'けけビリー', 'K.K. Rockabilly', '525', '543'],
  ['kk-agent', 'けけけいじ', 'Agent K.K.', '526', '544'],
  ['kk-rally', 'けけおんど', 'K.K. Rally', '527', '545'],
  ['kk-metal', 'けけメタル', 'K.K. Metal', '528', '546'],
  // e+'s "Not My Bag" songs: no aircheck in the rip
  ['kk-stale-cupcakes', 'ブルーおにぎり', 'Stale Cupcakes', '529', null],
  ['kk-spring-blossoms', 'はるのこもれび', 'Spring Blossoms', '530', null],
  ['kk-wandering', 'ほうろう', 'Wandering', '531', null]
];

/** K.K.'s rip is all but mono (side −26 dB under mid live, −20 / −42 dB the GameCube's / e+'s airchecks): mono at
 *  40 kbps measures as close to the source as stereo at 48, for a sixth less. */
const KK_KBPS = 40;
/** The rip plays e+'s Marine Song 2001 aircheck twice: the first pass. */
const KK_SECONDS: Record<string, number> = { '540': 214.35 };

const hh = (h: number) => String(h).padStart(2, '0');
/** A disc's 24 hours, 00..23 from track `first` (rain and snow loop with the sunny hour's period). */
const hours = (disc: number, first: number, weather: string, name: (h: string) => string): [string, Row][] =>
  Array.from({ length: 24 }, (_, h) => [`${disc}-${hh(first + h)}`, {
    key: `music.${weather}.${hh(h)}`, file: name(hh(h)), kind: 'loop', periodOf: weather === 'sunny' ? undefined : `music.sunny.${hh(h)}`
  }]);

/** Every file the app ships, by the source's track number ("2-01", "516"). Loops where NH loops them, one-shots
 *  otherwise. NH's Chased by Bees loops for as long as the wasps chase; Stung by Bees is heard once after the sting
 *  (its first pass: intro and one loop, `seconds`). */
const CATALOGUE = new Map<string, Row>([
  ['1-01', { key: 'opening', file: 'music/opening.m4a', kind: 'once' }],
  ...hours(1, 2, 'sunny', (h) => `music/hour-${h}.m4a`),
  ...hours(2, 1, 'rain', (h) => `music/rain-${h}.m4a`),
  ...hours(2, 25, 'snow', (h) => `music/snow-${h}.m4a`),
  // the rooms (src/lib/sound/places.ts) the app has: the museum's hall, fish, insect, fossil and art rooms, the shop. The hall's
  // rip has one pass and most of the next; the fish and insect rooms are a texture with no exact repeat (three of the
  // hall's 23.2 s phrases, blended at the wrap).
  ['3-04', { key: 'places.museum-hall', file: 'places/museum-hall.m4a', kind: 'loop', periodS: 23.2258 }],
  ['3-05', { key: 'places.museum-fish', file: 'places/museum-fish.m4a', kind: 'loop', periodS: 3 * 23.2258 }],
  ['3-06', { key: 'places.museum-bugs', file: 'places/museum-bugs.m4a', kind: 'loop', periodS: 3 * 23.2258 }],
  ['3-07', { key: 'places.museum-fossils', file: 'places/museum-fossils.m4a', kind: 'loop', periodS: 3 * 23.2258 }],
  ['3-08', { key: 'places.museum-art', file: 'places/museum-art.m4a', kind: 'loop', periodS: 2 * 23.2258 }],
  ['3-12', { key: 'places.shop', file: 'places/shop.m4a', kind: 'loop' }],
  // the events (src/lib/sound/events.ts). Bunny Day's and Festivale's second passes are variations (no exact repeat:
  // blended); Reese & Cyrus's loop is two 63 s halves, 128 s in all (at 56 kbps: under 1 MB)
  ['4-03', { key: 'events.bunny-day', file: 'music/bunny-day.m4a', kind: 'loop', periodS: 61.714 }],
  ['4-04', { key: 'events.wedding', file: 'music/wedding.m4a', kind: 'loop', periodS: 127.826, kbps: 56 }],
  ['4-05', { key: 'events.wedding-party', file: 'music/wedding-party.m4a', kind: 'loop' }],
  ['4-06', { key: 'events.fireworks-show', file: 'music/fireworks-show.m4a', kind: 'loop' }],
  ['4-07', { key: 'events.halloween', file: 'music/halloween.m4a', kind: 'loop' }],
  ['4-08', { key: 'events.turkey-day', file: 'music/turkey-day.m4a', kind: 'loop' }],
  ['4-09', { key: 'events.turkey-cooking-start', file: 'music/turkey-cooking-start.m4a', kind: 'once' }],
  ['4-10', { key: 'events.turkey-cooking-done', file: 'music/turkey-cooking-done.m4a', kind: 'once' }],
  ['4-11', { key: 'events.toy-day-snow', file: 'music/toy-day-snow.m4a', kind: 'loop' }],
  ['4-12', { key: 'events.toy-day', file: 'music/toy-day.m4a', kind: 'loop' }],
  // NH's 11:55 runs on to midnight; here a loop, as the app may open at any minute of it
  ['4-13', { key: 'events.countdown-2300', file: 'music/countdown-2300.m4a', kind: 'loop' }],
  ['4-14', { key: 'events.countdown-2330', file: 'music/countdown-2330.m4a', kind: 'loop' }],
  ['4-15', { key: 'events.countdown-2350', file: 'music/countdown-2350.m4a', kind: 'loop' }],
  ['4-16', { key: 'events.countdown-2355', file: 'music/countdown-2355.m4a', kind: 'loop' }],
  ['4-17', { key: 'events.happy-new-year', file: 'music/happy-new-year.m4a', kind: 'once' }],
  ['4-18', { key: 'events.new-year-0am', file: 'music/new-year-0am.m4a', kind: 'loop' }],
  ['4-19', { key: 'events.new-year-2am', file: 'music/new-year-2am.m4a', kind: 'loop' }],
  ['4-20', { key: 'events.new-years-day', file: 'music/new-years-day.m4a', kind: 'loop' }],
  ['4-21', { key: 'events.festivale', file: 'music/festivale.m4a', kind: 'loop', periodS: 50.323 }],
  ['4-36', { key: 'events.bee-chase', file: 'music/bee-chase.m4a', kind: 'loop', minLagS: 4 }],
  ['4-37', { key: 'events.bee-stung', file: 'music/bee-stung.m4a', kind: 'once', seconds: STUNG_S }],
  // the GameCube rip: the radio exercise for the group stretch, e+'s birthday song
  ['106', { key: 'events.aerobics', file: 'music/aerobics.m4a', kind: 'loop', whole: true }],
  ['516', { key: 'events.happy-birthday', file: 'music/happy-birthday.m4a', kind: 'once' }],
  // jingles (ids.ts): the fanfares only to the bed their tracks loop under them; the radio jingles 4-41 … 4-64 in
  // ids.ts's order (the times of day's six each, then the holidays')
  ['4-39', { key: 'sfx.get-fanfare', file: 'sfx/get-fanfare.m4a', kind: 'sfx', seconds: 1.8 }],
  ['4-40', { key: 'sfx.complete-fanfare', file: 'sfx/complete-fanfare.m4a', kind: 'sfx', seconds: 1.7 }],
  ...[...RADIO_SLOTS.flatMap((part) => RADIO_VARIANTS.map((n) => `${part}-${n}`)), ...RADIO_HOLIDAYS].map((id, i): [string, Row] =>
    [`4-${41 + i}`, { key: `sfx.radio-${id}`, file: `sfx/radio-${id}.m4a`, kind: 'sfx' }]),
  // K.K.: the live songs (his Saturday show) and the airchecks (the stereo's recordings), one-shots
  ...KK.flatMap(([id, ja, en, live, air]): [string, Row][] => [
    ...(live ? [[live, { key: `kk.${id}`, file: `kk/${id}.m4a`, kind: 'once', kbps: KK_KBPS, mono: true, ja, en }] as [string, Row]] : []),
    ...(air ? [[air, { key: `kkAircheck.${id}`, file: `kk/aircheck/${id}.m4a`, kind: 'once', kbps: KK_KBPS, mono: true, seconds: KK_SECONDS[air] }] as [string, Row]] : [])
  ])
]);

/** A manifest entry as written: the app's MusicTrack plus its file's content hash and a one-shot's length (s). */
type Entry = MusicTrack & { v?: string; d?: number };
type Manifest = Record<string, unknown> & { kk?: (Entry & { id: string; ja?: string; en?: string })[] };

/** Put an entry at a dotted key (`kk.<id>`: that song in the list, with its titles, in KK's order); the entry kept. */
function put(man: Manifest, key: string, value: Entry | string, row?: Row): Entry | string {
  const [top, ...rest] = key.split('.');
  if (top === 'kk') {
    const song = { id: rest[0], ja: row?.ja, en: row?.en, ...(value as Entry) };
    const order = KK.map(([id]) => id);
    man.kk = [...(man.kk ?? []).filter((s) => s.id !== song.id), song].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return song;
  }
  if (!rest.length) return (man[top] = value);
  let o = (man[top] ??= {}) as Record<string, unknown>;
  for (const p of rest.slice(0, -1)) o = (o[p] ??= {}) as Record<string, unknown>;
  return (o[rest.at(-1)!] = value);
}

/** Build the catalogue's files found in `src` whose key matches `only`, and write their manifest entries. */
function build(src: string, only: RegExp, dry: boolean): void {
  const man = readManifest();
  const built: Entry[] = [];
  for (const file of readdirSync(src).filter((f) => f.endsWith('.mp3')).sort()) {
    const num = file.match(/^(\d+-\d+)\. |^(\d+) - /);
    const row = CATALOGUE.get(num?.[1] ?? num?.[2] ?? '');
    if (!row || !only.test(row.key)) continue;
    const path = join(src, file), out = join(OUT, row.file);
    mkdirSync(join(out, '..'), { recursive: true });
    try {
      if (row.kind === 'sfx') {
        jingle(path, out, dry, row.seconds);
        put(man, row.key, { file: row.file } as Entry);
        console.log(`${row.file}  ${file}  jingle`);
        continue;
      }
      let e: Entry;
      if (row.kind === 'loop') {
        const shared = row.periodOf?.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], man) as Entry | undefined;
        e = looped(path, file, row, dry, shared?.end ?? row.periodS);
      }
      else {
        oneShot(path, out, dry, row.kbps ?? 64, row.seconds, row.mono ? 1 : 2);
        e = { file: row.file, start: 0 };
        console.log(`${row.file}  ${file}  one-shot`);
      }
      built.push(put(man, row.key, e, row) as Entry);
    } catch (err) {
      console.warn(`  ! ${file}: ${(err as Error).message}; skipped`);
    }
  }
  if (dry) return;
  for (const e of built) e.gain = gainOf(e.file).gain;
  writeDurations(man);
  writeHashes(man);
  writeManifest(man);
}

/** Integrated loudness (LUFS) and true peak (dBTP) of a file, from ffmpeg's loudnorm analysis pass. A mono file is
 *  measured as heard, from both speakers (dual mono: +3 LU over its one channel). */
function loudness(file: string): { i: number; tp: number } {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=print_format=json:dual_mono=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const json = r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1);
  const m = JSON.parse(json) as { input_i: string; input_tp: string };
  return { i: Number(m.input_i), tp: Number(m.input_tp) };
}

/** The gain (dB, 0.1 steps) that brings a track to the target, held under the true-peak ceiling. */
function trackGain({ i, tp }: { i: number; tp: number }): number {
  const g = Math.min(TARGET_LUFS - i, CEILING_DBTP - BUS_DB - tp);
  return Math.round(Math.min(6, Math.max(-12, g)) * 10) / 10;
}

/** Every entry in the manifest: the objects with a `file`, at any depth (`music` only the music: no sfx, whose
 *  loudness is baked into the file). */
function entries(o: unknown, music = false, at = ''): [string, Entry][] {
  if (!o || typeof o !== 'object') return [];
  if (typeof (o as Entry).file === 'string') return [[at, o as Entry]];
  return Object.entries(o).flatMap(([k, v]) => (music && !at && k === 'sfx' ? [] : entries(v, music, at ? `${at}.${k}` : k)));
}

/** A file's content hash, short (the `?v=` the app fetches it under). */
const hashOf = (file: string): string => createHash('sha256').update(readFileSync(join(OUT, file))).digest('hex').slice(0, 8);

/** Write every entry's `v` (an effect's plain path becomes `{ file, v }`). */
function writeHashes(man: Manifest): void {
  for (const k of ['sfx', 'ambient']) {
    const m = (man[k] ?? {}) as Record<string, unknown>;
    for (const [id, v] of Object.entries(m)) if (typeof v === 'string') m[id] = { file: v };
  }
  let n = 0;
  for (const [, e] of entries(man)) {
    const v = hashOf(e.file);
    if (e.v !== v) (e.v = v), n++;
  }
  console.log(`hashes: ${n} changed`);
}

/** A file's loudness and the gain that brings it to the target. */
function gainOf(file: string): { gain: number; i: number; tp: number } {
  const l = loudness(join(OUT, file));
  return { ...l, gain: trackGain(l) };
}

/** A file's length (s, 0.1 steps), from ffprobe. */
function durationOf(file: string): number {
  const out = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(OUT, file)], { encoding: 'utf8' });
  return Math.round(Number(out.trim()) * 10) / 10;
}

/** Write `d`, its length in seconds, on every one-shot (no `end`) a shared stage may play (docs/sound-sync.md: K.K.'s
 *  songs and airchecks, the events' cut-ins): every phone knows when it ends without hearing it. */
function writeDurations(man: Manifest): void {
  for (const k of ['kk', 'kkAircheck', 'events']) {
    for (const [name, e] of entries(man[k], false, k)) {
      if (e.end !== undefined) continue;
      e.d = durationOf(e.file);
      console.log(`${name.padEnd(28)} ${e.d} s`);
    }
  }
}

/** Measure every music file in the manifest and write its `gain`. */
function writeGains(man: Manifest): void {
  for (const [name, e] of entries(man, true)) {
    const { gain, ...l } = gainOf(e.file);
    e.gain = gain;
    console.log(`${name.padEnd(24)} ${l.i.toFixed(1)} LUFS  ${l.tp >= 0 ? '+' : ''}${l.tp.toFixed(1)} dBTP  → gain ${e.gain >= 0 ? '+' : ''}${e.gain.toFixed(1)} dB` +
      `  (${(l.i + e.gain).toFixed(1)} LUFS)`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args[0] === '--gains' || args[0] === '--hashes' || args[0] === '--durations') {
    const man = readManifest();
    if (args[0] === '--gains') writeGains(man);
    if (args[0] === '--durations') writeDurations(man);
    writeHashes(man);
    writeManifest(man);
    return;
  }
  const [src] = args;
  if (!src || src.startsWith('--')) throw new Error('usage: node scripts/music.ts <source dir> [--only <regex>] [--dry] | --gains | --hashes | --durations');
  const only = args.indexOf('--only');
  build(src, new RegExp(only > 0 ? args[only + 1] : '.'), args.includes('--dry'));
}

main();
