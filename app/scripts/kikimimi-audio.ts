// ききみみ クイズ: every bank item spoken into static/audio/kikimimi/ (docs/kikimimi.md "Audio"). Silent: never plays a
// sound itself except `--listen`, which a person runs.
//   node scripts/kikimimi-audio.ts [options]       make what's new or changed (by each clip's source hash), print a report
//     --engine qwen3            the engine (default qwen3); per accent: `qwen3,au=voxcpm2` or `us=kokoro,uk=kokoro,au=qwen3`
//                               qwen3 / voxcpm2 clone each cast voice's reference clip; kokoro uses cast.json `kokoro`
//                               voices (US and UK only); say is the legacy macOS voice (levels 1-3 only, never 4-7)
//     --levels 1,2,3,4,5,6,7    the levels to speak (default all; say: 1-3)
//     --only <regex>            item ids to speak (the rest keep their clips)
//     --out <dir>               a scratch dir instead of static/: clips.json, clips.src.json and report.json land there too
//     --force                   re-speak every selected item
//     --seed 1234               the first take's seed (a re-roll of a weak take: --only <id> --force --seed 2000)
//     --retries 5               the gate: re-roll a clip with the next seed while whisper mishears a content word or
//                               its voice drifts (--min-sim 0.5: ECAPA cosine to the reference)
//     --l1-tempo 0.92           level 1's normal clips gently slowed (atempo); 1 = as spoken
//     --no-mos, --no-sv         skip UTMOS or the speaker-similarity check
//   node scripts/kikimimi-audio.ts --refs [--design-seeds 7,11,23] [--only <regex over cast ids>]
//                               make the cast's missing reference clips (scripts/tts/refs/<id>.m4a, committed); with
//                               --design-seeds the VoiceDesign voices are re-rolled over those seeds and the best by
//                               UTMOS (heard word for word) is kept, its seed written back to cast.json
//   node scripts/kikimimi-audio.ts --list           the listen-through list (each clip with its cast voice and text)
//   node scripts/kikimimi-audio.ts --listen [--only <regex>]   play each clip (afplay) with its text: a person's check
//
// The cast (docs/curriculum.md §9): scripts/tts/cast.json, 12 voices (US 3 a gender; UK and AU 3), each villager one voice
// for good (bank4.ts CAST, speech.ts castOf). Every voice is a reference clip with its exact transcript, cloned for
// every line: US voices designed by Qwen3-TTS VoiceDesign from a text description (no real person), UK voices spoken by
// Phonon's synthetic catalogue voices, AU voices from the VCTK corpus (CC BY 4.0; credited in docs/kikimimi.md).
// Spoken text: speech.ts spokenText (`tts`, else `en` with its numbers written out).
// Each clip: the engine (seeded) → a raw WAV cached by source hash and seed under .cache/tts/raw (the masters) → ffmpeg:
// edge silence trimmed, loudness gain to −16 LUFS (true peak ≤ −1.5 dBTP via a limiter), mono AAC ~48 kbps at 24 kHz,
// +faststart. Levels 1-2 get `<id>-slow.m4a`: the take as spoken time-stretched to 0.75 by ffmpeg atempo (the same take,
// not a re-synthesis; level 1's normal clips are slowed to 0.92 the same way).
// Conditions (docs/kikimimi.md "Conditions", src/lib/kikimimi/conditions.ts): a clip with a speech condition (its `cond`,
// or a phone or PA channel's light one: condOf) is mixed after the clean take passed the gate: a phone band and codec, a
// voicemail's room, a PA hall with its chime, a noise bed (scripts/tts/beds/, scripts/kikimimi-beds.ts) at its SNR. The
// condition (its plan and its bed's file hash) is part of the clip's source hash; the raw take stays cached by the clean
// master's hash, so re-mixing never re-speaks. The strict gate runs on the clean take; the conditioned clip is only
// checked loosely (whisper's WER ≤ the condition's bound, else flagged `cond-wer`), and UTMOS is the clean take's. The
// clean take is kept under .cache/tts/clean/ (with the speech's offset in the mixed clip) for the karaoke's alignment.
// QA: whisper-cli large-v3-turbo hears each clip; a content word wrong (articles and fillers aside; numbers and reductions
// normalised) re-rolls it with the next seed, up to --retries times, then it's flagged. UTMOS (SpeechMOS utmos22) and
// ECAPA cosine to the voice's reference (drift < 0.3 flagged) are measured. scripts/tts/report.json gets every clip's
// numbers, and a summary prints.
// src/lib/kikimimi/clips.json gets {id: {dur, hash, slow?}} (compiled into the levels' chunks: kikimimi-levels.ts, run at
// the end) and scripts/kikimimi-clips.src.json
// {id: src}: `src` hashes the engine, its model, the cast voice and its reference, the text and this pipeline's version.
//
// Python: scripts/tts/tts.py runs in venvs made with uv under .cache/tts/ from scripts/tts/requirements-*.txt, or the
// pythons in KIKIMIMI_TTS_PY (mlx-audio), KIKIMIMI_PHONON_PY (ptts), KIKIMIMI_KOKORO_PY, KIKIMIMI_QA_PY (jiwer,
// whisper-normalizer, torch for UTMOS), KIKIMIMI_SV_PY (speechbrain); KIKIMIMI_TTS_EVAL=/tmp/tts-eval takes the TTS
// evaluation's venvs. whisper-cli and its model (~/.cache/whisper/ggml-large-v3-turbo.bin, or WHISPER_MODEL) are needed;
// the one-time setup is in docs/kikimimi.md "Audio" (a preflight names what's missing).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { clipItems, type Accent, type CastId, type Item } from '../src/lib/kikimimi/bank.ts';
import { BANK as ITEMS } from '../src/lib/kikimimi/source.ts';
import { ROSTER } from '../src/lib/villagers/roster.ts';
import type { Clip } from '../src/lib/kikimimi/clips.ts';
import { CAST_IDS, castOf, spokenText } from '../src/lib/kikimimi/speech.ts';
import { codecArgs, condOf, condPlan, condSource, stepFilter, type CondPlan, type Step } from '../src/lib/kikimimi/conditions.ts';
import type { Bed } from '../src/lib/kikimimi/bank.ts';
import { SR, chime, convolve, filter, gain, impulse, lufs, noise, readPcm, writeWav } from './tts/dsp.ts';
import { fnv1a, mulberry32 } from '../src/lib/random.ts';
import { NATURAL_RATE, SPEEDS } from '../src/lib/kikimimi/ladder.ts';
import { LADDERS as ALL_LADDERS } from '../src/lib/kikimimi/ladders.ts';
import { writeLevels } from './kikimimi-levels.ts';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE ?? 'ffprobe';
const APP = join(import.meta.dirname, '..');
const TTS = join(import.meta.dirname, 'tts');
const CAST_FILE = join(TTS, 'cast.json');
const REFS = join(TTS, 'refs');
const BEDS = join(TTS, 'beds');
const CACHE = resolve(process.env.KIKIMIMI_TTS_CACHE ?? join(APP, '.cache/tts'));
const VCTK = process.env.KIKIMIMI_VCTK_REFS ?? join(CACHE, 'vctk');
const EVAL = process.env.KIKIMIMI_TTS_EVAL;

/** Bump to re-speak everything after a change to the processing below (neural engines; `say` keeps v1's hashes). */
const PIPELINE = 2;
const SLOW = 0.75;
const hasSlow = (it: Item): boolean => it.lv <= 2;

type Engine = 'qwen3' | 'voxcpm2' | 'kokoro' | 'say';
const MODEL: Readonly<Record<Engine | 'design' | 'phonon', string>> = {
  qwen3: 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16',
  voxcpm2: 'mlx-community/VoxCPM2-bf16',
  kokoro: 'mlx-community/Kokoro-82M-bf16',
  say: 'macOS say',
  design: 'mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16',
  phonon: 'gradium/phonon-31m-en'
};
const CLONES = (e: Engine) => e === 'qwen3' || e === 'voxcpm2';

interface CastEntry {
  accent: Accent;
  gender: 'f' | 'm';
  /** design: Qwen3 VoiceDesign from `description`; phonon: a Phonon catalogue voice speaks ref.text; vctk: a corpus clip. */
  source: 'design' | 'phonon' | 'vctk';
  description: string;
  /** The reference's seed (design, phonon). */
  seed: number;
  /** Kokoro's voice for this slot (US and UK). */
  kokoro?: string;
  ref: { text: string; voice?: string; file?: string; origin: string; licence: string; attribution?: string; mos?: number };
}
const CASTS: Record<CastId, CastEntry> = JSON.parse(readFileSync(CAST_FILE, 'utf8'));

// ---- arguments -------------------------------------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string): string | undefined => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
/** The clip seeds: the first try's (--seed), then +1 per re-roll. */
const SEED = Number(opt('--seed') ?? 1234);
/** A person's re-roll kept across runs: the first take's seed of a clip whose default takes were weak (a `--seed` given
 *  on the command line wins). */
const PINNED: Readonly<Record<string, number>> = { 'd4-landlord-3': 2000, 'd4-taxi-street-4': 2000 };
const seedOf = (id: string): number => (opt('--seed') ? SEED : PINNED[id] ?? SEED);
const only = opt('--only') ? new RegExp(opt('--only')!) : null;
const RETRIES = Number(opt('--retries') ?? 5);
/** Level 1's normal clips a touch slower (Qwen speaks L1 lines at ~205 wpm; 0.92 → ~190, `say` v1 was 160): within
 *  §9's ±10%, and atempo leaves UTMOS where it was. 1 = none. */
const L1_TEMPO = Number(opt('--l1-tempo') ?? 0.92);
/** The voice gate: a take whose ECAPA cosine to its reference is under this is re-rolled (under 0.3: flagged drift). */
const MIN_SIM = Number(opt('--min-sim') ?? 0.5);

/** "qwen3" or "kokoro,au=qwen3" or "us=kokoro,uk=kokoro,au=qwen3" → an engine per accent. */
function engines(spec: string): Record<Accent, Engine> {
  const ok = (e: string): Engine => {
    if (!(e in MODEL) || e === 'design' || e === 'phonon') throw new Error(`unknown engine ${e}`);
    return e as Engine;
  };
  let def: Engine | undefined;
  const per: Partial<Record<Accent, Engine>> = {};
  for (const part of spec.split(',')) {
    const [a, e] = part.includes('=') ? part.split('=') : [undefined, part];
    if (a) per[a as Accent] = ok(e);
    else def = ok(e);
  }
  const out = { us: per.us ?? def, uk: per.uk ?? def, au: per.au ?? def };
  for (const [a, e] of Object.entries(out)) if (!e) throw new Error(`--engine: no engine for ${a}`);
  return out as Record<Accent, Engine>;
}
const ENGINE = engines(opt('--engine') ?? 'qwen3');
const SAY = ENGINE.us === 'say';
if (SAY && (ENGINE.uk !== 'say' || ENGINE.au !== 'say')) throw new Error('--engine say is all or nothing');
const LEVELS = (opt('--levels') ?? (SAY ? '1,2,3' : '1,2,3,4,5,6,7')).split(',').map(Number);
if (SAY && LEVELS.some((lv) => lv > 3)) throw new Error('levels 4-7 are never spoken by say (docs/curriculum.md §9)');

const SCRATCH = opt('--out') ? resolve(opt('--out')!) : null;
const OUT = SCRATCH ?? join(APP, 'static/audio/kikimimi');
const CLIPS = SCRATCH ? join(SCRATCH, 'clips.json') : join(APP, 'src/lib/kikimimi/clips.json');
const SRCS = SCRATCH ? join(SCRATCH, 'clips.src.json') : join(import.meta.dirname, 'kikimimi-clips.src.json');
const REPORT = SCRATCH ? join(SCRATCH, 'report.json') : join(TTS, 'report.json');
/** One entry per clip: an item, or each line of a dialogue as its own (bank.ts clipItems: `<item>-<n>`). */
const ALL: readonly Item[] = ITEMS.flatMap(clipItems);
const BANK = ALL.filter((it) => LEVELS.includes(it.lv));
/** スピード はしご (ladder.ts): each ladder's line spoken once (the gate as any clip's), its rungs that take stretched. */
const LADDERS = ALL_LADDERS.filter((l) => LEVELS.includes(l.line.lv));
/** Every rung clip id (`<ladder>-<n>`), made or not. */
const RUNG_IDS = ALL_LADDERS.flatMap((l) => l.rungs.map((r) => r.id));

// ---- small helpers ---------------------------------------------------------------------------------------------------

const sha = (b: string | Buffer, n: number) => createHash('sha256').update(b).digest('hex').slice(0, n);
const dirOf = (...p: string[]) => {
  const d = join(...p);
  mkdirSync(d, { recursive: true });
  return d;
};
const duration = (file: string): number =>
  Math.round(Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' })) * 100) / 100;
const ff = (...a: string[]) => execFileSync(FFMPEG, ['-v', 'error', '-y', ...a]);
const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 1000) / 1000 : null);
const min = (xs: number[]) => (xs.length ? Math.min(...xs) : null);

// ---- python ----------------------------------------------------------------------------------------------------------

type Py = 'gen' | 'phonon' | 'kokoro' | 'qa' | 'sv';
const PY_ENV: Record<Py, [string, string]> = {
  gen: ['KIKIMIMI_TTS_PY', 'fish/venv/bin/python'],
  phonon: ['KIKIMIMI_PHONON_PY', 'phonon/.venv/bin/python'],
  kokoro: ['KIKIMIMI_KOKORO_PY', 'kokoro/bin/python'],
  qa: ['KIKIMIMI_QA_PY', 'scorer/bin/python'],
  sv: ['KIKIMIMI_SV_PY', 'fish/svenv/bin/python']
};
/** The venv each python job runs in: an env var, the TTS evaluation's, or one made here with uv. */
function python(which: Py): string {
  const [env, evalPath] = PY_ENV[which];
  if (process.env[env]) return process.env[env]!;
  if (EVAL) return join(EVAL, evalPath);
  const req = { gen: 'gen', phonon: 'gen', kokoro: 'kokoro', qa: 'qa', sv: 'qa' }[which];
  const dir = join(CACHE, `venv-${req}`), bin = join(dir, 'bin/python');
  if (!existsSync(bin)) {
    console.log(`making ${dir} (uv)…`);
    execFileSync('uv', ['venv', '-q', '-p', '3.12', dir], { stdio: 'inherit' });
    execFileSync('uv', ['pip', 'install', '-q', '--python', bin, '-r', join(TTS, `requirements-${req}.txt`)], { stdio: 'inherit' });
  }
  return bin;
}
let jobN = 0;
/** Run a tts.py subcommand on a job list; its JSON result. */
function py<T>(which: Py, cmd: string, jobs: unknown[], extra: string[] = []): Record<string, T> {
  if (!jobs.length) return {};
  const dir = dirOf(CACHE, 'jobs'), n = `${process.pid}-${jobN++}`;
  const jf = join(dir, `${cmd}-${n}.json`), rf = join(dir, `${cmd}-${n}.out.json`);
  writeFileSync(jf, JSON.stringify(jobs));
  const r = spawnSync(python(which), [join(TTS, 'tts.py'), cmd, ...extra, '--jobs', jf, '--result', rf], {
    stdio: 'inherit', env: { KIKIMIMI_ECAPA: join(CACHE, 'ecapa'), ...process.env }
  });
  if (r.status !== 0) throw new Error(`tts.py ${cmd} failed (${r.status})`);
  const out = JSON.parse(readFileSync(rf, 'utf8'));
  rmSync(jf); rmSync(rf);
  return out;
}

// ---- audio processing ------------------------------------------------------------------------------------------------

const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05';
/** Raw engine output → mono 24 kHz float WAV, edge silence trimmed. */
function trim(raw: string, out: string): void {
  ff('-i', raw, '-af', `highpass=f=50,${TRIM},areverse,${TRIM},areverse`, '-ac', '1', '-ar', '24000', '-c:a', 'pcm_f32le', out);
}
/** Integrated loudness and true peak (ffmpeg loudnorm's measuring pass). */
function loudness(wav: string): { i: number; tp: number } {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const j = JSON.parse(r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)![0]);
  return { i: Number(j.input_i), tp: Number(j.input_tp) };
}
/** A trimmed WAV → the shipped m4a: a gain to −16 LUFS (a limiter holds the true peak under −1.5 dBTP), a 60 ms tail. */
function finish(wav: string, out: string): void {
  const { i, tp } = loudness(wav);
  const gain = Number.isFinite(i) ? -16 - i : 0;
  const limit = tp + gain > -1.5 ? `,alimiter=limit=${(10 ** (-1.6 / 20)).toFixed(3)}:attack=2:release=40:level=0` : '';
  ff('-i', wav, '-af', `volume=${gain.toFixed(2)}dB${limit},apad=pad_dur=0.06`,
    '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '48k', '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', out);
}
/** ffmpeg atempo (WSOLA): in the pilot it kept UTMOS (0.92: 4.36 vs 4.37 unstretched; 0.75: 4.31), where rubberband
 *  cost 0.7 (R3) to 1.9 (R2). */
const STRETCH = 'atempo';
/** A trimmed WAV at another tempo (0.75: three quarters the speed), the pitch kept. */
function stretch(wav: string, tempo: number, out: string): void {
  ff('-i', wav, '-af', `atempo=${tempo}`, '-c:a', 'pcm_f32le', out);
}

// ---- speech conditions (conditions.ts: what each does; here, how) -----------------------------------------------------

const bedPcm = new Map<Bed, Float32Array>();
/** A stretch of a bed `n` samples long from an offset picked by the clip's id (the bed loops), faded in and out. */
function bedSegment(b: Bed, n: number, id: string): Float32Array {
  if (!bedPcm.has(b)) bedPcm.set(b, readPcm(bedFile(b)));
  const bed = bedPcm.get(b)!, at = fnv1a(id) % bed.length, out = new Float32Array(n), f = Math.round(0.25 * SR);
  for (let i = 0; i < n; i++) out[i] = bed[(at + i) % bed.length] * Math.min(1, i / f, (n - 1 - i) / f);
  return out;
}
/** Speech over its bed: the bed from `pre` before it to `post` after, at `snr` dB under the speech's loudness `ref`. */
function withBed(x: Float32Array, plan: CondPlan, id: string, ref: number): Float32Array {
  const pre = Math.round(plan.pre * SR), post = Math.round(plan.post * SR);
  const seg = bedSegment(plan.bed!.id, pre + x.length + post, id);
  const out = gain(seg, ref - plan.bed!.snr - lufs(seg));
  for (let i = 0; i < x.length; i++) out[pre + i] += x[i];
  return out;
}
/** A channel's steps over the speech: band and compressor steps as one ffmpeg chain, a room by convolution, a codec
 *  round trip at 8 kHz, line hiss at its SNR. */
function channel(x: Float32Array, steps: readonly Step[], id: string): Float32Array {
  let y = x;
  for (let i = 0; i < steps.length; ) {
    const s = steps[i];
    if (s.op === 'band' || s.op === 'comp') {
      const run: Step[] = [];
      while (i < steps.length && (steps[i].op === 'band' || steps[i].op === 'comp')) run.push(steps[i++]);
      y = filter(y, run.map(stepFilter).join(','));
      continue;
    }
    if (s.op === 'room') y = convolve(y, impulse(s, Math.round(s.rt60 * 100)));
    else if (s.op === 'codec') y = filter(y, '', codecArgs(s));
    else if (s.op === 'hiss') {
      const h = noise(y.length, mulberry32(fnv1a(`${id}:hiss`)), 6000, 200);
      const g = 10 ** ((lufs(y) - s.snr - lufs(h)) / 20);
      y = y.map((v, k) => v + h[k] * g);
    }
    i++;
  }
  return y;
}
/** The clean take (a trimmed WAV) under its condition into `out` (a WAV); the speech's offset in it (s): the chime and
 *  the bed's lead-in. */
function condition(wav: string, plan: CondPlan, id: string, out: string): number {
  let x: Float32Array = readPcm(wav);
  const ref = lufs(x);
  let lead = 0, head = 0;
  if (plan.chime) {
    const c = chime(), cg = gain(c, ref - 3 - lufs(c)), gap = Math.round(0.35 * SR);
    const y = new Float32Array(cg.length + gap + x.length);
    y.set(cg);
    y.set(x, cg.length + gap);
    x = y;
    head = cg.length + gap;
    lead += head / SR;
  }
  if (plan.bed?.at === 'source') {
    x = withBed(x, plan, id, ref);
    lead += plan.pre;
  }
  x = channel(x, plan.steps, id);
  if (plan.bed?.at === 'listener') {
    x = withBed(x, plan, id, lufs(x.subarray(head)));
    lead += plan.pre;
  }
  writeWav(out, x);
  return Math.round(lead * 1000) / 1000;
}
// ---- スピード はしご: a line's take at each rung's speed -------------------------------------------------------------

/** Bump to re-make every rung clip after a change below (a line's take is re-spoken only when its own source changes). */
const LADDER_V = 1;
/** A rung's tempo is kept within this (atempo measured on 24 level-4 takes, UTMOS: 0.8× 4.29, 1.0× 4.30, 1.15× 4.18,
 *  1.25× 4.12, 1.4× 3.93, 1.55× 3.73; whisper still heard them word for word): past it a line's rung is off its speed
 *  (the report's `clamped`). */
const TEMPO_MIN = 0.7, TEMPO_MAX = 1.6;
/** Syllables in spoken English, roughly (vowel groups, a silent final e aside): the pace's measure. */
function syllables(text: string): number {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).reduce((s, w) => {
    const v = w.replace(/'/g, '').replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]).replace(/^y/, '');
    return s + Math.max(1, v.match(/[aeiouy]+/g)?.length ?? 0);
  }, 0);
}
/** A ladder line's source hash for rung n (its take's source, the rung's speed, the rate it's stretched to). */
const rungSrc = (lineSrc: string, n: number) => sha(JSON.stringify([lineSrc, n, SPEEDS[n - 1], NATURAL_RATE, TEMPO_MIN, TEMPO_MAX, LADDER_V]), 10);

// ---- the cast's reference clips --------------------------------------------------------------------------------------

const refM4a = (id: CastId) => join(REFS, `${id}.m4a`);
/** The reference as the engines take it (24 kHz mono WAV, cached; made from the committed m4a when missing). */
function refWav(id: CastId): string {
  const wav = join(dirOf(CACHE, 'refs'), `${id}.wav`);
  if (!existsSync(wav)) {
    if (!existsSync(refM4a(id))) throw new Error(`no reference for ${id}: run with --refs`);
    ff('-i', refM4a(id), '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', wav);
  }
  return wav;
}
const refHash = (id: CastId) => sha(readFileSync(refM4a(id)), 10);
/** Commit-sized reference: mono AAC 64 kbps (a 15 s clip ~120 KB). */
const encodeRef = (wav: string, id: CastId) =>
  ff('-i', wav, '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '64k', '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', refM4a(id));

function makeRefs(): void {
  const seeds = opt('--design-seeds')?.split(',').map(Number);
  const ids = CAST_IDS.filter((id) => (!only || only.test(id)) && (!existsSync(refM4a(id)) || (seeds && CASTS[id].source === 'design')));
  const tmp = dirOf(CACHE, 'refs/cand');
  const cands: { id: CastId; seed: number; wav: string }[] = [];
  const design = ids.filter((id) => CASTS[id].source === 'design');
  // candidates cached by their description and text (a re-run re-scores without re-speaking)
  const designJobs = design.flatMap((id) => (seeds ?? [CASTS[id].seed]).map((seed) =>
    ({ out: join(tmp, `${id}_s${seed}-${sha(CASTS[id].description + CASTS[id].ref.text, 6)}.wav`), text: CASTS[id].ref.text, seed, instruct: CASTS[id].description })));
  py('gen', 'synth', designJobs.filter((j) => !existsSync(j.out)), ['--engine', 'qwen3-design', '--model', MODEL.design]);
  for (const j of designJobs) cands.push({ id: j.out.match(/([a-z]{2}-[fm]\d)_s/)![1] as CastId, seed: j.seed, wav: j.out });
  const phonon = ids.filter((id) => CASTS[id].source === 'phonon')
    .map((id) => ({ out: join(tmp, `${id}_s${CASTS[id].seed}.wav`), text: CASTS[id].ref.text, seed: CASTS[id].seed, voice: CASTS[id].ref.voice, id }));
  py('phonon', 'synth', phonon, ['--engine', 'phonon']);
  for (const j of phonon) cands.push({ id: j.id, seed: j.seed, wav: j.out });
  for (const id of ids.filter((id) => CASTS[id].source === 'vctk')) {
    const src = join(VCTK, CASTS[id].ref.file!);
    if (!existsSync(src)) throw new Error(`${id}: ${src} missing (KIKIMIMI_VCTK_REFS)`);
    const wav = join(tmp, `${id}_s0.wav`);
    ff('-i', src, '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', wav);
    cands.push({ id, seed: 0, wav });
  }
  if (!cands.length) return console.log('every cast voice has its reference');
  const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', cands.map((c) => ({ wav: c.wav, refs: [CASTS[c.id].ref.text] })));
  const mos = flag('--no-mos') ? {} : py<number>('qa', 'mos', cands.map((c) => c.wav));
  for (const id of new Set(cands.map((c) => c.id))) {
    const mine = cands.filter((c) => c.id === id)
      .map((c) => ({ ...c, mos: mos[c.wav] ?? 0, content: heard[c.wav].content, hyp: heard[c.wav].hyp }))
      .sort((a, b) => a.content - b.content || b.mos - a.mos);
    for (const c of mine) console.log(`  ${id} seed ${c.seed}: UTMOS ${c.mos.toFixed(2)}, ${c.content} content errors${c.content ? `: "${c.hyp}"` : ''}`);
    const best = mine[0];
    copyFileSync(best.wav, join(dirOf(CACHE, 'refs'), `${id}.wav`));
    encodeRef(best.wav, id);
    CASTS[id].seed = best.seed;
    if (mos[best.wav]) CASTS[id].ref.mos = mos[best.wav];
    console.log(`${id}: seed ${best.seed} kept (${(statSync(refM4a(id)).size / 1024).toFixed(0)} KB)`);
  }
  writeFileSync(CAST_FILE, JSON.stringify(CASTS, null, 1) + '\n');
}

// ---- legacy: macOS say (levels 1-3) ----------------------------------------------------------------------------------

const RATE: Readonly<Record<number, number>> = { 1: 160, 2: 175, 3: 185 };
const SAY_SLOW = 0.7;
/** Best first; the last of each is the stock fallback. */
const VOICES: Record<Accent, Record<'f' | 'm', string[]>> = {
  us: {
    f: ['Ava (Premium)', 'Zoe (Premium)', 'Ava (Enhanced)', 'Zoe (Enhanced)', 'Allison (Enhanced)', 'Susan (Enhanced)', 'Samantha (Enhanced)', 'Samantha'],
    m: ['Evan (Premium)', 'Nathan (Premium)', 'Evan (Enhanced)', 'Nathan (Enhanced)', 'Tom (Enhanced)', 'Alex', 'Samantha']
  },
  uk: {
    f: ['Serena (Premium)', 'Serena (Enhanced)', 'Kate (Enhanced)', 'Stephanie (Enhanced)', 'Daniel'],
    m: ['Jamie (Premium)', 'Oliver (Enhanced)', 'Daniel (Enhanced)', 'Arthur (Enhanced)', 'Daniel']
  },
  au: {
    f: ['Matilda (Premium)', 'Karen (Premium)', 'Karen (Enhanced)', 'Catherine (Enhanced)', 'Karen'],
    m: ['Lee (Premium)', 'Lee (Enhanced)', 'Gordon (Enhanced)', 'Karen']
  }
};
const NEVER = /^(Eddy|Reed|Rocko|Flo|Shelley|Sandy|Grandma|Grandpa|Fred|Ralph|Albert|Kathy|Junior)\b/;
let installed: Set<string> | undefined;
function sayVoice(it: Item): string {
  /** Installed voices by name; macOS adds " (English (UK))" to a name it has in more than one language or variant. */
  installed ??= new Set(execFileSync('say', ['-v', '?'], { encoding: 'utf8' }).split('\n')
    .map((l) => l.split(/\s{2,}|\s+[a-z]{2}_[A-Z]{2}\s/)[0].trim().replace(/ \(English \([^)]*\)\)$/, '')).filter(Boolean));
  const gender = ROSTER[it.speaker].gender;
  const name = VOICES[it.voice][gender].find((v) => installed!.has(v) && !NEVER.test(v));
  if (!name) throw new Error(`no ${it.voice} voice installed (wanted one of ${VOICES[it.voice][gender].join(', ')})`);
  return name;
}
function sayRender(text: string, voice: string, rate: number, out: string): void {
  const aiff = join(dirOf(CACHE, 'say'), 'say.aiff'), wav = join(CACHE, 'say', 'say.wav');
  execFileSync('say', ['-v', voice, '-r', String(rate), '-o', aiff, text]);
  trim(aiff, wav);
  finish(wav, out);
}

// ---- the plan: what each item is spoken with ------------------------------------------------------------------------

interface Plan {
  it: Item;
  cast: CastId;
  engine: Engine;
  text: string;
  /** The clean master's hash: the raw takes are cached by it. */
  master: string;
  /** The speech condition mixed over the clean take (null: clean). */
  cond: CondPlan | null;
  /** The clip's source hash: the master's, with its condition's. */
  src: string;
}
const bedFile = (b: Bed) => join(BEDS, `${b}.m4a`);
/** The assets a condition uses (its bed's file), by hash: part of the clip's source. */
const condAssets = (c: CondPlan): Record<string, string> => (c.bed ? { [`bed:${c.bed.id}`]: sha(readFileSync(bedFile(c.bed.id)), 10) } : {});
function planOf(it: Item): Plan {
  const cast = castOf(it), engine = ENGINE[it.voice], entry = CASTS[cast];
  if (!entry) throw new Error(`${it.id}: no cast.json entry for ${cast}`);
  if (engine === 'say') {
    // v1's hash, so a say run keeps the shipped clips
    const text = it.tts ?? it.en, voice = sayVoice(it);
    const src = sha(JSON.stringify([text, voice, RATE[it.lv], hasSlow(it) && SAY_SLOW, 1]), 10);
    return { it, cast, engine, text, master: src, cond: null, src };
  }
  if (engine === 'kokoro' && !entry.kokoro) throw new Error(`${it.id}: kokoro has no ${cast} voice (no Australian voices: --engine kokoro,au=qwen3)`);
  const text = spokenText(it);
  const voice = CLONES(engine) ? [cast, refHash(cast), entry.ref.text] : [entry.kokoro];
  const tempo = it.lv === 1 ? L1_TEMPO : 1;
  const master = sha(JSON.stringify([engine, MODEL[engine], voice, text, seedOf(it.id), hasSlow(it) && [SLOW, STRETCH], tempo !== 1 && [tempo, STRETCH], PIPELINE]), 10);
  const c = condOf(it), cond = c && condPlan(c);
  if (cond && hasSlow(it)) throw new Error(`${it.id}: no conditions at levels 1-2 (their slow clip is the clean take)`);
  return { it, cast, engine, text, master, cond, src: condSource(master, cond, cond ? condAssets(cond) : {}) };
}

interface Take {
  seed: number;
  raw: string;
  wav: string;
  m4a: string;
  gen?: number;
  rawDur?: number;
  hyp?: string;
  wer?: number;
  content?: number;
  sim?: number;
}
interface Row {
  src: string;
  cast: CastId;
  engine: Engine;
  text: string;
  dur: number;
  /** Words a minute (the normal clip, its 60 ms tail aside). */
  wpm: number;
  seed: number;
  /** Takes spoken (1 + re-rolls). */
  tries: number;
  hyp?: string;
  wer?: number;
  content?: number;
  mos?: number;
  sim?: number;
  rtf?: number;
  /** The condition mixed over it ("pa:light"), and what whisper heard of the mixed clip (the loose check). */
  cond?: string;
  condHyp?: string;
  condWer?: number;
  /** A rung clip's (スピード はしご): its speed, the tempo its line's take was stretched by, its pace (syllables a
   *  second) and whether the tempo was clamped (off its speed). */
  speed?: number;
  tempo?: number;
  rate?: number;
  clamped?: boolean;
  flags: string[];
}

/** A take's rank, lowest best: content words misheard plus drift (another voice, similarity under 0.3, counts as one),
 *  then off-voice (under MIN_SIM), then WER, then the higher similarity. */
const rank = (t: Take): number => {
  const sim = t.sim ?? 1;
  return (t.content! + (sim < 0.3 ? 1 : 0)) * 1000 + (sim < MIN_SIM ? 100 : 0) + t.wer! * 10 + (1 - sim);
};
/** How many takes each item got. */
const takesOf = new Map<string, number>();

/** Speak `plans` with their engines: takes re-rolled with the next seed while whisper mishears a content word or the
 *  voice drifts from its reference (ECAPA cosine under MIN_SIM); the best take each. */
function speak(plans: Plan[]): Map<string, Take> {
  const work = dirOf(CACHE, 'work'), raws = dirOf(CACHE, 'raw');
  const best = new Map<string, Take>();
  let todo = plans;
  for (let k = 0; k <= RETRIES && todo.length; k++) {
    const takes = new Map<string, Take>();
    for (const p of todo) {
      const seed = seedOf(p.it.id) + k;
      takesOf.set(p.it.id, k + 1);
      takes.set(p.it.id, { seed, raw: join(raws, `${p.master}-s${seed}.wav`), wav: join(work, `${p.it.id}-${k}.wav`), m4a: join(work, `${p.it.id}-${k}.m4a`) });
    }
    for (const engine of ['qwen3', 'voxcpm2', 'kokoro'] as const) {
      const jobs = todo.filter((p) => p.engine === engine && !existsSync(takes.get(p.it.id)!.raw)).map((p) => {
        const t = takes.get(p.it.id)!, e = CASTS[p.cast];
        return CLONES(engine)
          ? { out: t.raw, text: p.text, seed: t.seed, ref_audio: refWav(p.cast), ref_text: e.ref.text }
          : { out: t.raw, text: p.text, seed: t.seed, voice: e.kokoro };
      });
      if (jobs.length) console.log(`${engine}: ${jobs.length} clips (try ${k + 1})`);
      const res = py<{ gen: number; dur: number }>(engine === 'kokoro' ? 'kokoro' : 'gen', 'synth', jobs, ['--engine', engine, '--model', MODEL[engine]]);
      for (const [raw, r] of Object.entries(res)) writeFileSync(`${raw}.json`, JSON.stringify(r)); // the master's timing, for RTF
    }
    for (const p of todo) {
      const t = takes.get(p.it.id)!, meta = `${t.raw}.json`;
      if (existsSync(meta)) {
        const r = JSON.parse(readFileSync(meta, 'utf8'));
        Object.assign(t, { gen: r.gen, rawDur: r.dur });
      }
    }
    for (const p of todo) {
      const t = takes.get(p.it.id)!;
      trim(t.raw, t.wav);
      // the slow clip is made from t.wav (the take as spoken), the normal one maybe gently stretched (L1)
      if (p.it.lv === 1 && L1_TEMPO !== 1) {
        const s = t.wav.replace(/\.wav$/, '-t.wav');
        stretch(t.wav, L1_TEMPO, s);
        finish(s, t.m4a);
      } else finish(t.wav, t.m4a);
    }
    const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', todo.map((p) => ({ wav: takes.get(p.it.id)!.m4a, refs: [p.it.en, p.text] })));
    const cloned = todo.filter((p) => CLONES(p.engine));
    const sim = flag('--no-sv') ? {} : py<number>('sv', 'sv', cloned.map((p) => ({ wav: takes.get(p.it.id)!.m4a, ref: refWav(p.cast) })));
    const again: Plan[] = [];
    for (const p of todo) {
      const t = takes.get(p.it.id)!, h = heard[t.m4a];
      Object.assign(t, { hyp: h.hyp, wer: h.wer, content: h.content, sim: sim[t.m4a] });
      const b = best.get(p.it.id);
      if (!b || rank(t) < rank(b)) best.set(p.it.id, t);
      if (h.content > 0 || (t.sim ?? 1) < MIN_SIM) again.push(p);
    }
    if (again.length) console.log(`gate: ${again.length} misheard or off-voice${k < RETRIES ? ', re-rolling' : ''}: ${again.map((p) => p.it.id).join(' ')}`);
    todo = again;
  }
  return best;
}

function listen(): void {
  for (const it of BANK) {
    if (only && !only.test(it.id)) continue;
    console.log(`\n${it.id}  [${castOf(it)}, ${ROSTER[it.speaker].nameEn}]\n  ${it.en}\n  ${it.ja}`);
    spawnSync('afplay', [join(OUT, `${it.id}.m4a`)], { stdio: 'inherit' });
    if (hasSlow(it)) spawnSync('afplay', [join(OUT, `${it.id}-slow.m4a`)], { stdio: 'inherit' });
  }
}

function printList(c: Record<string, Clip>): void {
  console.log('\nListen-through list (each clip, then its slow one at levels 1-2; `--listen` plays them in order):');
  let lv = 0;
  for (const it of [...BANK].sort((a, b) => a.lv - b.lv || a.id.localeCompare(b.id))) {
    if (it.lv !== lv) console.log(`\n== level ${(lv = it.lv)} ==`);
    const d = c[it.id]?.dur.toFixed(2) ?? '  ?  ';
    const cond = condOf(it);
    console.log(`[ ] ${it.id.padEnd(18)} ${d}s  ${castOf(it)}${cond ? `  (${condPlan(cond).key})` : ''}  ${it.en}`);
  }
  console.log('\n== スピード はしご (each rung: the line at its speed) ==');
  for (const l of LADDERS) console.log(`[ ] ${l.id.padEnd(18)} ${l.rungs.map((r) => `${c[r.id]?.dur.toFixed(2) ?? '?'}s`).join(' ')}  ${castOf(l.line)}  ${l.line.en}`);
}

function run(): void {
  const t0 = Date.now();
  mkdirSync(OUT, { recursive: true });
  const old: Record<string, Clip> = existsSync(CLIPS) ? JSON.parse(readFileSync(CLIPS, 'utf8')) : {};
  const oldSrc: Record<string, string> = existsSync(SRCS) ? JSON.parse(readFileSync(SRCS, 'utf8')) : {};
  const clips: Record<string, Clip> = { ...old }, srcs: Record<string, string> = { ...oldSrc };
  const fileOf = (id: string, slow = false) => join(OUT, `${id}${slow ? '-slow' : ''}.m4a`);
  const plans = BANK.filter((it) => !only || only.test(it.id)).map(planOf);
  const todo = plans.filter((p) => {
    const files = [fileOf(p.it.id), ...(hasSlow(p.it) ? [fileOf(p.it.id, true)] : [])];
    return flag('--force') || !old[p.it.id] || oldSrc[p.it.id] !== p.src || !files.every((f) => existsSync(f));
  });
  // スピード はしご: a ladder whose rung clips are missing or out of date has its line spoken (a take already made, a
  // level-4 line's own included, comes from the raw cache) and every rung made again from it
  const ladderPlans = SAY ? [] : LADDERS.filter((l) => !only || only.test(l.id)).map((l) => ({ l, p: planOf(l.line) }));
  const ladderTodo = ladderPlans.filter(({ l, p }) => l.rungs.some((r) =>
    flag('--force') || !old[r.id] || oldSrc[r.id] !== rungSrc(p.master, r.rung!.n) || !existsSync(fileOf(r.id))));
  console.log(`${plans.length} items selected, ${todo.length} to speak (engine ${JSON.stringify(ENGINE)}, slow by ${STRETCH}); ${ladderPlans.length} ladders, ${ladderTodo.length} to make`);
  const rows: Record<string, Row> = {};
  const record = (p: Plan, normal: string, slowWav: string | null, extra: Partial<Row>) => {
    const out = fileOf(p.it.id);
    copyFileSync(normal, out);
    if (slowWav) {
      const s = join(CACHE, 'work', `${p.it.id}-slow.wav`);
      stretch(slowWav, SLOW, s);
      finish(s, fileOf(p.it.id, true));
    } else rmSync(fileOf(p.it.id, true), { force: true });
    clips[p.it.id] = { dur: duration(out), hash: sha(readFileSync(out), 8), ...(slowWav && { slow: sha(readFileSync(fileOf(p.it.id, true)), 8) }) };
    srcs[p.it.id] = p.src;
    const dur = clips[p.it.id].dur, words = p.text.match(/[A-Za-z']+/g)?.length ?? 0;
    rows[p.it.id] = { src: p.src, cast: p.cast, engine: p.engine, text: p.text, dur, wpm: Math.round((words / Math.max(dur - 0.06, 0.1)) * 60), seed: seedOf(p.it.id), tries: 1, flags: [], ...extra };
  };
  if (SAY) {
    for (const p of todo) {
      const voice = sayVoice(p.it);
      sayRender(p.text, voice, RATE[p.it.lv], fileOf(p.it.id));
      if (hasSlow(p.it)) sayRender(p.text, voice, Math.round(RATE[p.it.lv] * SAY_SLOW), fileOf(p.it.id, true));
      else rmSync(fileOf(p.it.id, true), { force: true });
      const f = fileOf(p.it.id);
      clips[p.it.id] = { dur: duration(f), hash: sha(readFileSync(f), 8), ...(hasSlow(p.it) && { slow: sha(readFileSync(fileOf(p.it.id, true)), 8) }) };
      srcs[p.it.id] = p.src;
      process.stdout.write(`\r${Object.keys(srcs).length} spoken: ${p.it.id.padEnd(24)}`);
    }
  } else {
    const best = speak([...todo, ...ladderTodo.map((x) => x.p)]);
    // the conditions over the clean takes that passed the gate, then whisper's loose check of the mixed clips
    const conds = todo.filter((p) => p.cond);
    const mixed = new Map<string, string>(), leads = new Map<string, number>();
    if (conds.length) console.log(`conditions: ${conds.length} clips`);
    for (const p of conds) {
      const t = best.get(p.it.id)!, w = t.wav.replace(/\.wav$/, '-c.wav'), m = t.m4a.replace(/\.m4a$/, '-c.m4a');
      leads.set(p.it.id, condition(t.wav, p.cond!, p.it.id, w));
      finish(w, m);
      mixed.set(p.it.id, m);
    }
    const loose = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', conds.map((p) => ({ wav: mixed.get(p.it.id)!, refs: [p.it.en, p.text] })));
    const cleanDir = dirOf(CACHE, 'clean');
    for (const p of todo) {
      const t = best.get(p.it.id)!;
      const flags = [...(t.content ? ['misheard'] : []), ...(t.sim === undefined ? [] : t.sim < 0.3 ? ['drift'] : t.sim < MIN_SIM ? ['low-sim'] : [])];
      const m = mixed.get(p.it.id), h = m ? loose[m] : undefined;
      if (h && h.wer > p.cond!.maxWer) flags.push('cond-wer');
      record(p, m ?? t.m4a, hasSlow(p.it) ? t.wav : null, {
        seed: t.seed, tries: takesOf.get(p.it.id) ?? 1, hyp: t.hyp, wer: t.wer, content: t.content, sim: t.sim, flags,
        ...(t.gen !== undefined && t.rawDur && { rtf: Math.round((t.gen / t.rawDur) * 1000) / 1000 }),
        ...(p.cond && h && { cond: p.cond.key, condHyp: h.hyp, condWer: h.wer,
          wpm: Math.round(((p.text.match(/[A-Za-z']+/g)?.length ?? 0) / Math.max(duration(t.m4a) - 0.06, 0.1)) * 60) })
      });
      // the clean take beside the mixed clip (the karaoke aligns on it: kikimimi-words.ts), or none for a clean clip
      if (m) {
        copyFileSync(t.m4a, join(cleanDir, `${p.it.id}.m4a`));
        writeFileSync(join(cleanDir, `${p.it.id}.json`), JSON.stringify({ hash: clips[p.it.id].hash, lead: leads.get(p.it.id) }));
      } else for (const x of ['m4a', 'json']) rmSync(join(cleanDir, `${p.it.id}.${x}`), { force: true });
    }
    // each ladder's rungs: its take (trimmed, as spoken) stretched to each rung's speed × NATURAL_RATE, then finished
    // as any clip; whisper hears every rung (the report's QA at speed; a mishearing at 1.4× is flagged, never re-rolled:
    // the take passed the gate at its own pace)
    const rungs: { id: string; p: Plan; n: number; tempo: number; rate: number; clamped: boolean }[] = [];
    for (const { l, p } of ladderTodo) {
      const t = best.get(p.it.id)!;
      const rate = syllables(p.text) / Math.max(0.5, duration(t.wav));
      for (const r of l.rungs) {
        const n = r.rung!.n, want = (SPEEDS[n - 1] * NATURAL_RATE) / rate;
        const tempo = Math.round(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, want)) * 1000) / 1000;
        const wav = join(CACHE, 'work', `${r.id}-rung.wav`);
        stretch(t.wav, tempo, wav);
        finish(wav, fileOf(r.id));
        clips[r.id] = { dur: duration(fileOf(r.id)), hash: sha(readFileSync(fileOf(r.id)), 8) };
        srcs[r.id] = rungSrc(p.master, n);
        rungs.push({ id: r.id, p, n, tempo, rate: Math.round((rate * tempo) * 100) / 100, clamped: Math.abs(tempo - want) > 0.005 });
      }
    }
    if (rungs.length) {
      const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', rungs.map((r) => ({ wav: fileOf(r.id), refs: [r.p.it.en, r.p.text] })));
      for (const r of rungs) {
        const t = best.get(r.p.it.id)!, h = heard[fileOf(r.id)], dur = clips[r.id].dur, words = r.p.text.match(/[A-Za-z']+/g)?.length ?? 0;
        rows[r.id] = {
          src: srcs[r.id], cast: r.p.cast, engine: r.p.engine, text: r.p.text, dur, wpm: Math.round((words / Math.max(dur - 0.06, 0.1)) * 60),
          seed: t.seed, tries: takesOf.get(r.p.it.id) ?? 1, hyp: h.hyp, wer: h.wer, content: h.content, sim: t.sim,
          speed: SPEEDS[r.n - 1], tempo: r.tempo, rate: r.rate, clamped: r.clamped,
          flags: [...(h.content ? ['misheard'] : []), ...(r.clamped ? ['clamped'] : []), ...(t.content ? ['take-misheard'] : [])]
        };
      }
    }
    const made = [...todo.map((p) => p.it.id), ...rungs.map((r) => r.id)];
    if (!flag('--no-mos')) {
      // a mixed clip's UTMOS is its clean take's (noise is the point)
      const fileFor = (id: string) => (mixed.has(id) ? best.get(id)!.m4a : fileOf(id));
      const mos = py<number>('qa', 'mos', made.map(fileFor));
      for (const id of made) {
        rows[id].mos = mos[fileFor(id)];
        if (rows[id].mos! < 3.5) rows[id].flags.push('low-mos');
      }
    }
  }
  // clips of items no longer in the bank (a whole run into static/ only)
  const ids = new Set([...ALL.map((it) => it.id), ...RUNG_IDS]);
  for (const id of Object.keys(clips)) if (!ids.has(id)) { delete clips[id]; delete srcs[id]; }
  if (!SCRATCH && !only) {
    const want = new Set([...ALL.filter((it) => clips[it.id]).flatMap((it) => [`${it.id}.m4a`, ...(hasSlow(it) ? [`${it.id}-slow.m4a`] : [])]),
      ...RUNG_IDS.filter((id) => clips[id]).map((id) => `${id}.m4a`)]);
    for (const f of readdirSync(OUT).filter((f) => !want.has(f))) rmSync(join(OUT, f));
  }
  const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  writeFileSync(CLIPS, JSON.stringify(sorted(clips), null, 1).replace(/\n  +/g, ' ').replace(/\n \}/g, ' }') + '\n');
  writeFileSync(SRCS, JSON.stringify(sorted(srcs), null, 1) + '\n');
  if (!SCRATCH) writeLevels(true); // the levels' chunks with the new clips (docs/kikimimi.md "Loading")
  const files = readdirSync(OUT).filter((f) => f.endsWith('.m4a'));
  const bytes = files.reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
  if (SAY) return console.log(`\n${todo.length} items spoken by say; ${files.length} files, ${(bytes / 1024).toFixed(0)} KB`);

  // the report covers every clip made by this pipeline: earlier runs' rows kept while their clip is unchanged
  const prev: Record<string, Row> = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')).items ?? {} : {};
  for (const [id, r] of Object.entries(prev)) if (!rows[id] && r.src && srcs[id] === r.src && clips[id]) rows[id] = r;
  const R = Object.values(rows);
  const num = (k: 'mos' | 'sim' | 'rtf' | 'wer') => R.map((r) => r[k]).filter((x): x is number => typeof x === 'number');
  const perVoice = Object.fromEntries([...new Set(R.map((r) => r.cast))].sort().map((c) => {
    const rs = R.filter((r) => r.cast === c);
    const f = (k: 'mos' | 'sim') => rs.map((r) => r[k]).filter((x): x is number => typeof x === 'number');
    return [c, { n: rs.length, mos: mean(f('mos')), mosMin: min(f('mos')), sim: mean(f('sim')), simMin: min(f('sim')), misheard: rs.filter((r) => r.content).length }];
  }));
  const lvOf = new Map(ALL.map((it) => [it.id, it.lv]));
  const wpm = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((lv) => [lv, mean(Object.entries(rows).filter(([id]) => lvOf.get(id) === lv).map(([, r]) => r.wpm))]));
  const summary = {
    engine: ENGINE, models: Object.fromEntries([...new Set(Object.values(ENGINE))].map((e) => [e, MODEL[e]])), pipeline: PIPELINE,
    slow: { tempo: SLOW, by: STRETCH }, l1Tempo: L1_TEMPO, at: new Date().toISOString(), wallSeconds: Math.round((Date.now() - t0) / 1000),
    spokenNow: todo.length, clips: R.length, perfect: R.filter((r) => r.wer === 0).length, contentClean: R.filter((r) => !r.content).length,
    rerolled: R.filter((r) => r.tries > 1).length, conditioned: R.filter((r) => r.cond).length,
    condWer: mean(R.map((r) => r.condWer).filter((x): x is number => typeof x === 'number')), flagged: Object.keys(rows).filter((k) => rows[k].flags.length).sort(),
    mos: mean(num('mos')), mosMin: min(num('mos')), sim: mean(num('sim')), simMin: min(num('sim')), rtf: mean(num('rtf')), wer: mean(num('wer')),
    wpm, files: files.length, kb: Math.round(bytes / 1024), perVoice,
    ladders: Object.fromEntries(SPEEDS.map((speed) => {
      const rs = R.filter((r) => r.speed === speed);
      const f = (k: 'mos' | 'rate' | 'tempo') => rs.map((r) => r[k]).filter((x): x is number => typeof x === 'number');
      return [`${speed}x`, { n: rs.length, mos: mean(f('mos')), mosMin: min(f('mos')), rate: mean(f('rate')), tempoMin: min(f('tempo')),
        tempoMax: f('tempo').length ? Math.max(...f('tempo')) : null, clamped: rs.filter((r) => r.clamped).length, misheard: rs.filter((r) => r.content).length }];
    }))
  };
  writeFileSync(REPORT, JSON.stringify({ summary, items: sorted(rows) }, null, 1) + '\n');
  console.log(`\n${todo.length} spoken in ${summary.wallSeconds}s. All ${R.length} clips: whisper word for word ${summary.perfect}, content clean ${summary.contentClean}, re-rolled ${summary.rerolled}`);
  console.log(`UTMOS mean ${summary.mos} (min ${summary.mosMin}); similarity to the ref mean ${summary.sim} (min ${summary.simMin}); RTF ${summary.rtf}; wpm by level ${JSON.stringify(wpm)}`);
  for (const [x, v] of Object.entries(summary.ladders)) if (v.n) console.log(`  rungs ${x}: ${v.n} clips, UTMOS ${v.mos} (min ${v.mosMin}), ${v.rate} syl/s, tempo ${v.tempoMin}-${v.tempoMax}, clamped ${v.clamped}, misheard ${v.misheard}`);
  for (const [c, v] of Object.entries(perVoice)) console.log(`  ${c}: ${v.n} clips, UTMOS ${v.mos} (min ${v.mosMin}), sim ${v.sim} (min ${v.simMin})${v.misheard ? `, ${v.misheard} misheard` : ''}`);
  if (summary.conditioned) console.log(`conditions: ${summary.conditioned} clips mixed, whisper's WER over them mean ${summary.condWer}`);
  for (const [id, r] of Object.entries(rows)) if (r.flags.length) console.log(`  FLAG ${id} [${r.flags.join(', ')}] said "${r.text}", heard "${r.hyp}"${r.cond ? ` (${r.cond}: "${r.condHyp}")` : ''}`);
  console.log(`${files.length} files in ${OUT}, ${(bytes / 1024).toFixed(0)} KB; report ${REPORT}`);
}

/** The tools a run needs, checked before minutes of synthesis (the one-time setup: docs/kikimimi.md "Audio"). */
function preflight(): void {
  const missing = [FFMPEG, FFPROBE, 'whisper-cli', 'uv'].filter((b) => spawnSync(b, ['-h'], { stdio: 'ignore' }).error);
  const model = process.env.WHISPER_MODEL ?? join(process.env.HOME ?? '', '.cache/whisper/ggml-large-v3-turbo.bin');
  if (!existsSync(model)) missing.push(model);
  if (missing.length) throw new Error(`missing ${missing.join(', ')}: see the one-time setup in docs/kikimimi.md "Audio"`);
}

if (flag('--refs')) { preflight(); makeRefs(); }
else if (flag('--listen')) listen();
else if (flag('--list')) printList(existsSync(CLIPS) ? JSON.parse(readFileSync(CLIPS, 'utf8')) : {});
else { preflight(); run(); }
