// ききみみ クイズ: the noise beds for the speech conditions (docs/kikimimi.md "Conditions"): a café, a street and a
// station, each 24 s, looping without a seam, into scripts/tts/beds/<id>.m4a (committed) with scripts/tts/beds/beds.json
// (how each was made). Silent: it never plays a sound.
//   node scripts/kikimimi-beds.ts [--only cafe,street,station]
// No third-party audio, so no licence to track: every sound is made here. The babble is our own TTS clips (levels 1-3's
// normal clips in static/audio/kikimimi/, spoken by the cast) reversed, started part-way in and layered many deep at
// low levels, so no word is intelligible (whisper is run over each bed to check: it should hear nothing). The rest is
// seeded shaped noise and simple synthesis: cup clinks and spoon taps, a steam wand, footsteps, cars passing, a train
// arriving, air handling hum. A room or hall impulse response (dsp.ts impulse) pushes each bed back. Deterministic: the
// same seed and clips give the same bed.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mulberry32, shuffle } from '../src/lib/random.ts';
import { BEDS, type Bed } from '../src/lib/kikimimi/bank.ts';
import { SR, convolve, filter, gain, impulse, lufs, noise, readPcm, scratch, writeWav } from './tts/dsp.ts';

const APP = join(import.meta.dirname, '..');
const CLIPS = join(APP, 'static/audio/kikimimi');
const OUT = join(import.meta.dirname, 'tts/beds');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const MODEL = process.env.WHISPER_MODEL ?? join(homedir(), '.cache/whisper/ggml-large-v3-turbo.bin');
/** A bed's length (s) and the crossfade that closes its loop. */
const LEN = 24, XF = 1;
/** Every bed's loudness: the conditions set its level against the speech, this only keeps the files alike. */
const BED_LUFS = -30;
const SEED = 2026;

const arg = process.argv.indexOf('--only');
const only = arg > 0 ? process.argv[arg + 1].split(',') : null;

/** Levels 1-3's normal clips, ours: the babble's voices. */
const sources = readdirSync(CLIPS).filter((f) => /^[a-z][1-3]-.*\.m4a$/.test(f) && !f.endsWith('-slow.m4a')).sort();
const decoded = new Map<string, Float32Array>();
const clip = (f: string) => decoded.get(f) ?? decoded.set(f, readPcm(join(CLIPS, f))).get(f)!;

const N = Math.round((LEN + XF) * SR);
const add = (out: Float32Array, src: Float32Array, at: number, g = 1) => {
  for (let i = 0; i < src.length; i++) {
    const j = at + i;
    if (j >= 0 && j < out.length) out[j] += src[i] * g;
  }
};
const db = (x: number) => 10 ** (x / 20);

/** `talkers` voices, each a stream of reversed clips started part-way in, back to back with short pauses. */
function babble(r: () => number, talkers: number, spread: [number, number]): Float32Array {
  const out = new Float32Array(N);
  const pool = shuffle([...sources], r);
  let k = 0;
  for (let v = 0; v < talkers; v++) {
    const g = db(spread[0] + r() * (spread[1] - spread[0]));
    let t = Math.round(-r() * 2 * SR);
    while (t < N) {
      const src = clip(pool[k++ % pool.length]);
      const from = Math.floor(r() * src.length * 0.4);
      const piece = src.slice(from).reverse();
      add(out, piece, t, g);
      t += piece.length + Math.round((0.15 + r() * 0.6) * SR);
    }
  }
  return out;
}

/** Inharmonic struck partials: a cup or a spoon (f the lowest partial, d the decay in s). */
function clink(f: number, d: number, r: () => number): Float32Array {
  const n = Math.round(d * 6 * SR), out = new Float32Array(n);
  const parts = [[1, 1], [1.59 + r() * 0.1, 0.6], [2.63 + r() * 0.2, 0.35], [4.1 + r() * 0.3, 0.2]];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [m, a] of parts) s += a * Math.sin(2 * Math.PI * f * m * t) * Math.exp(-t / (d / m));
    out[i] = s * Math.min(1, t / 0.0015);
  }
  return out;
}

/** A burst of shaped noise under an envelope (attack, hold, release in s). */
function burst(r: () => number, fc: number, hp: number, a: number, h: number, rel: number): Float32Array {
  const n = Math.round((a + h + rel) * SR), x = noise(n, r, fc, hp);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    x[i] *= t < a ? t / a : t < a + h ? 1 : Math.max(0, 1 - (t - a - h) / rel);
  }
  return x;
}

/** A footstep: a short dull knock. */
const step = (r: () => number) => burst(r, 1800, 120, 0.002, 0.01, 0.05);

/** Events at a rate (per s), each `make` placed at random times over the bed. */
function scatter(out: Float32Array, r: () => number, rate: number, make: () => Float32Array, g: [number, number]) {
  for (let t = -1; t < LEN + XF; t += -Math.log(1 - r()) / rate) add(out, make(), Math.round(t * SR), db(g[0] + r() * (g[1] - g[0])));
}

/** Walkers: runs of 6-12 footsteps ~1.9 a second. */
function walkers(out: Float32Array, r: () => number, n: number, g: [number, number]) {
  for (let w = 0; w < n; w++) {
    let t = -1 + r() * (LEN + XF);
    const steps = 6 + Math.floor(r() * 7), level = db(g[0] + r() * (g[1] - g[0]));
    for (let s = 0; s < steps; s++, t += 0.5 + r() * 0.06) add(out, step(r), Math.round(t * SR), level * (0.7 + r() * 0.3));
  }
}

/** Sum stems, each at its own level (dB, after normalising each to the same RMS-ish loudness). */
function mix(stems: [Float32Array, number][]): Float32Array {
  const out = new Float32Array(N);
  for (const [s, g] of stems) {
    const peak = Math.sqrt(s.reduce((a, x) => a + x * x, 0) / s.length) || 1;
    add(out, s, 0, db(g) / peak);
  }
  return out;
}

/** Close the loop: the tail past LEN crossfaded (equal power) into the head. */
function loop(x: Float32Array): Float32Array {
  const out = x.slice(0, LEN * SR), n = XF * SR;
  for (let i = 0; i < n; i++) {
    const a = Math.sin((Math.PI / 2) * (i / n));
    out[i] = x[i] * a + x[LEN * SR + i] * Math.cos((Math.PI / 2) * (i / n));
  }
  return out;
}

const BUILD: Record<Bed, { what: string; make: (r: () => number) => Float32Array }> = {
  cafe: {
    what: '12 reversed talkers of our own TTS clips in a small room (RT60 0.6 s); cup clinks and spoon taps; a steam wand; air handling',
    make: (r) => {
      const talk = filter(convolve(babble(r, 12, [-9, 0]), impulse({ rt60: 0.6, wet: 0.9, predelay: 0.01 }, 11)), 'lowpass=f=4500,highpass=f=120').slice(0, N);
      const clatter = new Float32Array(N);
      scatter(clatter, r, 0.9, () => clink(1900 + r() * 1400, 0.05 + r() * 0.06, r), [-14, -4]);
      scatter(clatter, r, 0.35, () => {
        const s = new Float32Array(Math.round(0.6 * SR));
        for (let k = 0, t = 0; k < 3 + r() * 3; k++, t += 0.07 + r() * 0.05) add(s, clink(3100 + r() * 900, 0.025, r), Math.round(t * SR), 0.6);
        return s;
      }, [-16, -8]);
      const room = convolve(clatter, impulse({ rt60: 0.5, wet: 0.5, predelay: 0.006 }, 12)).slice(0, N);
      const steam = new Float32Array(N);
      add(steam, burst(r, 6000, 1500, 0.3, 2.2, 0.6), Math.round((4 + r() * 12) * SR));
      return mix([[talk, 0], [room, -9], [steam, -20], [noise(N, r, 180, 30), -24]]);
    }
  },
  street: {
    what: 'traffic rumble and 6 cars passing (shaped noise under swells); 4 far reversed talkers; walkers; city hum',
    make: (r) => {
      const cars = new Float32Array(N);
      for (let c = 0; c < 6; c++) {
        const w = 1.2 + r() * 2, at = -1 + r() * (LEN + XF), n = Math.round(w * 4 * SR), x = noise(n, r, 900 + r() * 700, 60);
        for (let i = 0; i < n; i++) x[i] *= Math.exp(-(((i / SR - w * 2) / w) ** 2) * 2);
        add(cars, x, Math.round((at - w * 2) * SR), db(-6 + r() * 6));
      }
      const far = filter(babble(r, 4, [-6, 0]), 'lowpass=f=2500,highpass=f=200').slice(0, N);
      const feet = new Float32Array(N);
      walkers(feet, r, 7, [-12, -2]);
      return mix([[noise(N, r, 350, 25), -2], [cars, -1], [far, -14], [feet, -16], [noise(N, r, 2500, 400), -22]]);
    }
  },
  station: {
    what: '14 reversed talkers of our own TTS clips in a hall (RT60 2.0 s); walkers; a train arriving (a low swell); air handling hum',
    make: (r) => {
      const crowd = babble(r, 14, [-10, 0]);
      const feet = new Float32Array(N);
      walkers(feet, r, 12, [-10, 0]);
      const hall = convolve(mix([[crowd, 0], [feet, -10]]), impulse({ rt60: 2.0, wet: 2.5, predelay: 0.03 }, 13)).slice(0, N);
      const train = noise(N, r, 160, 20), whine = noise(N, r, 700, 250);
      const t0 = 3 + r() * 10, w = 7;
      for (let i = 0; i < N; i++) {
        const e = Math.exp(-(((i / SR - t0 - w) / w) ** 2) * 3);
        train[i] *= 0.25 + e;
        whine[i] *= e;
      }
      return mix([[filter(hall, 'lowpass=f=3500,highpass=f=100').slice(0, N), 0], [train, -4], [whine, -16], [noise(N, r, 250, 40), -14]]);
    }
  }
};

mkdirSync(OUT, { recursive: true });
const manifest: Record<string, unknown> = {};
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex').slice(0, 10);
for (const [k, id] of BEDS.entries()) {
  if (only && !only.includes(id)) continue;
  const r = mulberry32(SEED + k);
  const raw = loop(BUILD[id].make(r));
  const out = gain(raw, BED_LUFS - lufs(raw));
  const file = join(OUT, `${id}.m4a`);
  scratch((d) => {
    const w = join(d, `${id}.wav`);
    writeWav(w, out);
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', w, '-ac', '1', '-ar', String(SR), '-c:a', 'aac', '-b:a', '40k', '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', file]);
  });
  // whisper over the bed: no words should come through
  let heard = '';
  if (spawnSync('whisper-cli', ['-h'], { stdio: 'ignore' }).error === undefined) {
    heard = scratch((d) => {
      const w = join(d, 'b.wav');
      execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', file, '-ar', '16000', '-ac', '1', w]);
      execFileSync('whisper-cli', ['-m', MODEL, '-l', 'en', '-np', '-nt', '-otxt', '-f', w], { stdio: 'ignore' });
      return readFileSync(`${w}.txt`, 'utf8').split(/\s+/).join(' ').trim();
    });
  }
  manifest[id] = {
    seconds: LEN, seed: SEED + k, lufs: BED_LUFS, made: BUILD[id].what,
    voices: `${sources.length} of our own level 1-3 clips (static/audio/kikimimi, ${sha(sources.join())}), reversed`,
    licence: 'ours: synthesised by scripts/kikimimi-beds.ts from seeded noise and the project\'s own TTS clips; no third-party audio',
    whisper: heard, kb: Math.round(statSync(file).size / 1024)
  };
  console.log(`${id}: ${(statSync(file).size / 1024).toFixed(0)} KB, whisper heard ${JSON.stringify(heard)}`);
}
const path = join(OUT, 'beds.json');
const prev = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
writeFileSync(path, JSON.stringify({ ...prev, ...manifest }, null, 1) + '\n');
