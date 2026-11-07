// ききみみ クイズ: the speech conditions mixed offline over a clip's clean take (docs/kikimimi.md "Conditions",
// docs/curriculum.md §5.3 and §9). Pure: what each condition does (its steps, its bed and SNR, its chime) and the source
// hash it gives a clip. scripts/kikimimi-audio.ts carries the steps out with ffmpeg; used by it and the tests only,
// never by the game (its clips are mixed already), so nothing in the client bundle imports this.
//   A phone line: band-passed 300-3400 Hz, lightly compressed, through G.711 µ-law at 8 kHz (the codec's grit); heavy, a
// narrower band, harder compression, G.726 at 24 kbps and a little line hiss. A voicemail: the caller's small room first,
// then the phone line. A PA: a horn's band, compressed, in a hall (a synthetic impulse response: exponentially decaying
// noise, RT60 1.0 s light, 1.6 s heavy), after a two-tone chime. A noise bed (café, street, station: scripts/tts/beds/,
// made by scripts/kikimimi-beds.ts) at a target SNR (light +15 dB, heavy +10: curriculum §5.3's steps 1-2, fair for
// levels 4-5; +5 dB waits for S3), its loudness against the speech's (integrated LUFS), starting before the speech
// and ending after it, so the noise is there before the first word. A channel's bed sits at the source for a call (the
// caller's café, before the phone line) and at the listener for a PA (the platform, after the hall).
//   A line breaking up (`signal`: a call's line that trails off, "the back wheel's... and"): the phone band, then
// dropouts (silences, and packet-loss stutters: the 20 ms before repeated, fading), then G.726 at 24 kbps (heavy: 16 kbps,
// with hiss) for the codec's warble. The party bed (reversed talkers of our own clips, glasses, a groove in the next
// room) under a たちぎき's lines sits under the speech only (`under`: no lead-in or tail), so the lines' offsets hold.
import { createHash } from 'node:crypto';
import { seeded } from '#lib/random.ts';
import { channelOf, type Bed, type Cond, type Item } from './bank.ts';

/** Bump to re-mix every conditioned clip after a change to how the steps are carried out (not their numbers: those
 *  are in each clip's plan, so changing one re-mixes only the clips it touches). */
const COND_VERSION = 1;

/** A bed's SNR (dB, speech over noise) by level: curriculum §5.3's noise lever, steps 1-2 (S1-S2). */
export const SNR: Readonly<Record<Cond['level'], number>> = { light: 15, heavy: 10 };

/** The loose check on a conditioned clip (the clean take passed the strict gate): whisper's WER over it may be up to
 *  this (noise is the point; above it the clip is flagged for a person). */
export const COND_MAX_WER: Readonly<Record<Cond['level'], number>> = { light: 0.2, heavy: 0.3 };
/** A line breaking up loses words by design: its looser bound. */
export const SIGNAL_MAX_WER: Readonly<Record<Cond['level'], number>> = { light: 0.5, heavy: 0.6 };

/** One step of a channel, in order. */
export type Step =
  /** A room or hall: the speech convolved with a synthetic impulse response (the dry path kept at 1). */
  | { op: 'room'; rt60: number; wet: number; predelay: number }
  /** A band-pass: `poles`× high-pass at `lo` and low-pass at `hi` (Hz). */
  | { op: 'band'; lo: number; hi: number; poles: number }
  /** A compressor (ffmpeg acompressor). */
  | { op: 'comp'; threshold: number; ratio: number; attack: number; release: number; makeup: number }
  /** A codec round trip at 8 kHz: G.711 µ-law, or G.726 ADPCM at `kbps`. */
  | { op: 'codec'; codec: 'mulaw' | 'g726'; kbps?: number }
  /** Line hiss under the speech at `snr` dB. */
  | { op: 'hiss'; snr: number }
  /** Dropouts: one every `every` s on average, each `ms` long (min, max), a `stutter` share of them a packet-loss
   *  stutter, the rest silence (dropGaps, dropOut). */
  | { op: 'drop'; every: number; ms: readonly [number, number]; stutter: number };

export interface CondPlan {
  /** The condition as written ("pa:heavy+station"). */
  key: string;
  /** The channel's steps, in order (none: a bed only). */
  steps: readonly Step[];
  /** A two-tone chime before it (a PA). */
  chime: boolean;
  /** A noise bed: which, its SNR, and where it sits (`source`: before the channel, the caller's; `listener`: after it). */
  bed: { id: Bed; snr: number; at: 'source' | 'listener' } | null;
  /** The bed's lead-in before the speech and its tail after (s). */
  pre: number;
  post: number;
  /** The loose check's WER bound. */
  maxWer: number;
}

const PHONE: Readonly<Record<Cond['level'], readonly Step[]>> = {
  light: [
    { op: 'band', lo: 300, hi: 3400, poles: 2 },
    { op: 'comp', threshold: -22, ratio: 3, attack: 5, release: 80, makeup: 2 },
    { op: 'codec', codec: 'mulaw' }
  ],
  heavy: [
    { op: 'band', lo: 350, hi: 3200, poles: 2 },
    { op: 'comp', threshold: -26, ratio: 4, attack: 3, release: 60, makeup: 3 },
    { op: 'hiss', snr: 32 },
    { op: 'codec', codec: 'g726', kbps: 24 }
  ]
};
const SIGNAL: Readonly<Record<Cond['level'], readonly Step[]>> = {
  light: [PHONE.light[0], PHONE.light[1], { op: 'drop', every: 1.4, ms: [120, 320], stutter: 0.4 }, { op: 'codec', codec: 'g726', kbps: 24 }],
  heavy: [PHONE.heavy[0], PHONE.heavy[1], PHONE.heavy[2], { op: 'drop', every: 0.9, ms: [150, 450], stutter: 0.5 }, { op: 'codec', codec: 'g726', kbps: 16 }]
};
const ROOM: Step = { op: 'room', rt60: 0.35, wet: 0.18, predelay: 0.004 };
const HALL: Readonly<Record<Cond['level'], readonly Step[]>> = {
  light: [
    { op: 'band', lo: 250, hi: 6000, poles: 2 },
    { op: 'comp', threshold: -20, ratio: 3, attack: 5, release: 100, makeup: 2 },
    { op: 'room', rt60: 1.0, wet: 0.28, predelay: 0.02 }
  ],
  heavy: [
    { op: 'band', lo: 300, hi: 5000, poles: 2 },
    { op: 'comp', threshold: -22, ratio: 4, attack: 5, release: 100, makeup: 2 },
    { op: 'room', rt60: 1.6, wet: 0.4, predelay: 0.03 }
  ]
};

/** What a condition does: its channel's steps, its chime, its bed. */
export function condPlan(c: Cond): CondPlan {
  const key = `${c.kind}:${c.level}${c.bed ? `+${c.bed}` : ''}`;
  const bedOnly = c.kind === 'cafe' || c.kind === 'street' || c.kind === 'station' || c.kind === 'party';
  const bedId: Bed | undefined = bedOnly ? (c.kind as Bed) : c.bed;
  if (bedOnly && c.bed && c.bed !== c.kind) throw new Error(`kikimimi: ${key}: a bed condition has no other bed`);
  const call = c.kind === 'phone' || c.kind === 'signal' || c.kind === 'voicemail';
  const steps = c.kind === 'phone' ? PHONE[c.level] : c.kind === 'signal' ? SIGNAL[c.level] : c.kind === 'voicemail' ? [ROOM, ...PHONE[c.level]] : c.kind === 'pa' ? HALL[c.level] : [];
  const lead = bedId && !c.under;
  return {
    key, steps, chime: c.kind === 'pa',
    bed: bedId ? { id: bedId, snr: SNR[c.level], at: call ? 'source' : 'listener' } : null,
    pre: lead ? 0.5 : 0, post: lead ? 0.35 : 0,
    maxWer: (c.kind === 'signal' ? SIGNAL_MAX_WER : COND_MAX_WER)[c.level]
  };
}

/** A line that breaks off ("the back wheel's... and"): on a `signal` call, the one breaking up. Authored so the memo's
 *  answer is said again after it ("Sorry, you broke up there"): a dropout never falls on an answer. */
const BREAKS = /\.\.\.|…/;

/** A clip's condition: its own; else a phone or PA channel's light one (a voicemail's when its conditions say so; on
 *  a `signal` call, `signal` for a line that breaks off); else a listening file's `party`, under the speech (a
 *  たちぎき's lines); else none (studio clean; a video call stays clean). */
export function condOf(it: Pick<Item, 'cond' | 'channel' | 'tags'> & { en?: string }): Cond | null {
  if (it.cond) return it.cond;
  const ch = channelOf(it), conds: readonly string[] = it.tags?.conditions ?? [];
  if (ch === 'phone') return { kind: conds.includes('voicemail') ? 'voicemail' : conds.includes('signal') && BREAKS.test(it.en ?? '') ? 'signal' : 'phone', level: 'light' };
  if (ch === 'pa') return { kind: 'pa', level: 'light' };
  if (conds.includes('party')) return { kind: 'party', level: 'light', under: true };
  return null;
}

/** One dropout of a `drop` step: its start and length (samples), and whether it's a stutter (else silence). */
export interface Gap { at: number; len: number; stutter: boolean }

/** Where a `drop` step's dropouts fall over `n` samples at `sr`, seeded by the clip's id: none in the first 0.3 s or
 *  the last 0.2 s (the line is heard starting and ending), at least 0.25 s apart. */
export function dropGaps(n: number, sr: number, s: Extract<Step, { op: 'drop' }>, id: string): Gap[] {
  const r = seeded(`${id}:drop`), out: Gap[] = [], end = n - 0.2 * sr;
  const next = () => Math.round((0.25 + -Math.log(1 - r()) * Math.max(0, s.every - 0.25)) * sr);
  for (let t = Math.round(0.3 * sr) + next(); ; ) {
    const len = Math.round(((s.ms[0] + r() * (s.ms[1] - s.ms[0])) / 1000) * sr), stutter = r() < s.stutter;
    if (t + len > end) return out;
    out.push({ at: t, len, stutter });
    t += len + next();
  }
}

/** The speech with its dropouts: each gap silent, or a stutter (the 20 ms before it over and over, each time 0.7× the
 *  last), the speech ramped 4 ms into and out of each so no gap clicks. */
export function dropOut(x: Float32Array, gaps: readonly Gap[], sr: number): Float32Array {
  const y = x.slice(), frame = Math.round(0.02 * sr), ramp = Math.round(0.004 * sr);
  for (const g of gaps) {
    for (let i = 0; i < g.len; i++)
      y[g.at + i] = g.stutter && g.at >= frame ? x[g.at - frame + (i % frame)] * 0.7 ** (1 + Math.floor(i / frame)) : 0;
    for (let i = 1; i <= ramp; i++) {
      const k = i / (ramp + 1);
      if (g.at - i >= 0) y[g.at - i] *= k;
      if (g.at + g.len - 1 + i < y.length) y[g.at + g.len - 1 + i] *= k;
    }
  }
  return y;
}

/** The ffmpeg filter of a band or compressor step. */
export function stepFilter(s: Step): string {
  if (s.op === 'band') return [...Array(s.poles)].flatMap(() => [`highpass=f=${s.lo}`, `lowpass=f=${s.hi}`]).join(',');
  if (s.op === 'comp') return `acompressor=threshold=${s.threshold}dB:ratio=${s.ratio}:attack=${s.attack}:release=${s.release}:makeup=${s.makeup}`;
  throw new Error(`kikimimi: ${s.op} isn't a filter step`);
}

/** The ffmpeg encoder arguments of a codec step (an 8 kHz WAV of it). */
export function codecArgs(s: Extract<Step, { op: 'codec' }>): string[] {
  return s.codec === 'mulaw' ? ['-ar', '8000', '-c:a', 'pcm_mulaw'] : ['-ar', '8000', '-c:a', 'adpcm_g726', '-b:a', `${s.kbps ?? 32}k`];
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 10);

/**
 * A clip's source hash: the clean master's (`master`: the engine, voice, text, seed and pipeline) as it is when the
 * clip has no condition (so a clean clip keeps its hash), else hashed with the condition's plan, the hashes of the
 * assets it uses (`assets`: its bed's file, the chime's) and COND_VERSION. The raw take stays cached by `master`.
 */
export function condSource(master: string, plan: CondPlan | null, assets: Readonly<Record<string, string>> = {}): string {
  if (!plan) return master;
  return sha(JSON.stringify([master, plan, Object.keys(assets).sort().map((k) => [k, assets[k]]), COND_VERSION]));
}
