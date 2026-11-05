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
import { createHash } from 'node:crypto';
import { channelOf, type Bed, type Cond, type Item } from './bank.ts';

/** Bump to re-mix every conditioned clip after a change to how the steps are carried out (not their numbers: those
 *  are in each clip's plan, so changing one re-mixes only the clips it touches). */
const COND_VERSION = 1;

/** A bed's SNR (dB, speech over noise) by level: curriculum §5.3's noise lever, steps 1-2 (S1-S2). */
export const SNR: Readonly<Record<Cond['level'], number>> = { light: 15, heavy: 10 };

/** The loose check on a conditioned clip (the clean take passed the strict gate): whisper's WER over it may be up to
 *  this (noise is the point; above it the clip is flagged for a person). */
export const COND_MAX_WER: Readonly<Record<Cond['level'], number>> = { light: 0.2, heavy: 0.3 };

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
  | { op: 'hiss'; snr: number };

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
  const bedOnly = c.kind === 'cafe' || c.kind === 'street' || c.kind === 'station';
  const bedId: Bed | undefined = bedOnly ? (c.kind as Bed) : c.bed;
  if (bedOnly && c.bed && c.bed !== c.kind) throw new Error(`kikimimi: ${key}: a bed condition has no other bed`);
  const steps = c.kind === 'phone' ? PHONE[c.level] : c.kind === 'voicemail' ? [ROOM, ...PHONE[c.level]] : c.kind === 'pa' ? HALL[c.level] : [];
  return {
    key, steps, chime: c.kind === 'pa',
    bed: bedId ? { id: bedId, snr: SNR[c.level], at: c.kind === 'phone' || c.kind === 'voicemail' ? 'source' : 'listener' } : null,
    pre: bedId ? 0.5 : 0, post: bedId ? 0.35 : 0,
    maxWer: COND_MAX_WER[c.level]
  };
}

/** A clip's condition: its own; else a phone or PA channel's light one (a voicemail's when its conditions say so);
 *  else none (studio clean; a video call stays clean). */
export function condOf(it: Pick<Item, 'cond' | 'channel' | 'tags'>): Cond | null {
  if (it.cond) return it.cond;
  const ch = channelOf(it);
  if (ch === 'phone') return { kind: it.tags?.conditions?.includes('voicemail') ? 'voicemail' : 'phone', level: 'light' };
  if (ch === 'pa') return { kind: 'pa', level: 'light' };
  return null;
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
