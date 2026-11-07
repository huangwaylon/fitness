// The mic's pure signal half (docs/kikimimi-mic.md §3.1, capture.ts uses it): the capture brought to 16 kHz mono as it
// comes (a box-filter decimator), a buffer that never grows past its cap, and the voice activity detector: 20 ms frames,
// their energy (dBFS) against a noise floor that follows the room, their zero-crossing rate (hiss crosses zero at
// nearly every other sample, a voice far less), speech held on through 300 ms gaps (the hang) and "done" once speech
// was heard and then STOP_MS of quiet followed. No time is read: everything counts samples.

export const SR = 16_000;
/** A frame: 20 ms at 16 kHz. */
export const FRAME = 320;
const MS = SR / 1000;

/** Any rate to 16 kHz, a block at a time: each output sample is the mean of the input samples in its span (a box
 *  filter: enough against aliasing for a level, a VAD and a recogniser). */
export class To16k {
  readonly #step: number;
  #acc = 0;
  #n = 0;
  /** The input position (in input samples) where the current output sample's span ends. */
  #edge: number;
  #at = 0;
  constructor(sr: number) {
    this.#step = sr / SR;
    this.#edge = this.#step;
  }
  push(x: Float32Array): Float32Array {
    if (this.#step === 1) return x.slice();
    const out = new Float32Array(Math.ceil((x.length + 1) / this.#step) + 1);
    let k = 0;
    for (let i = 0; i < x.length; i++, this.#at++) {
      if (this.#at >= this.#edge) {
        out[k++] = this.#n ? this.#acc / this.#n : 0;
        this.#acc = this.#n = 0;
        this.#edge += this.#step;
      }
      this.#acc += x[i];
      this.#n++;
    }
    return out.subarray(0, k);
  }
}

/** 16 kHz samples kept up to `max` (the rest dropped: a take never outgrows its cap). */
export class Pcm {
  readonly #buf: Float32Array;
  length = 0;
  constructor(max: number) {
    this.#buf = new Float32Array(max);
  }
  get full(): boolean {
    return this.length >= this.#buf.length;
  }
  push(x: Float32Array): void {
    const n = Math.min(x.length, this.#buf.length - this.length);
    this.#buf.set(x.subarray(0, n), this.length);
    this.length += n;
  }
  /** A copy of samples [from, to). */
  slice(from = 0, to = this.length): Float32Array {
    return this.#buf.slice(Math.max(0, from), Math.min(this.length, to));
  }
}

/** A frame's level in dBFS (RMS; −100 for silence) and its zero-crossing rate (crossings per sample). */
export function frameStats(x: Float32Array): { db: number; zcr: number } {
  let e = 0, z = 0;
  for (let i = 0; i < x.length; i++) {
    e += x[i] * x[i];
    if (i && (x[i] >= 0) !== (x[i - 1] >= 0)) z++;
  }
  const rms = Math.sqrt(e / Math.max(1, x.length));
  return { db: rms > 1e-5 ? 20 * Math.log10(rms) : -100, zcr: z / Math.max(1, x.length - 1) };
}

/** A frame starts speech this far above the floor (dB), and never below ABS_DB; a softer one (a fricative's) only
 *  keeps speech going. */
const START_DB = 12, KEEP_DB = 6, ABS_DB = -50;
/** Above this zero-crossing rate a frame is hiss, not a voice (white noise: ~0.5). */
const HISS_ZCR = 0.42;
/** Speech starts after this many speech frames in a row (40 ms: a click doesn't). */
const ONSET = 2;
export const HANG_MS = 300, STOP_MS = 1000;

export interface VadState {
  /** The last frame's level (dBFS). */
  db: number;
  /** In speech now (held through HANG_MS gaps). */
  speaking: boolean;
  /** Speech was heard in this take. */
  heard: boolean;
  /** Speech heard, then STOP_MS quiet: the take can end. */
  done: boolean;
  /** The speech's first and last sample (16 kHz, from the take's start); -1: none yet. */
  from: number;
  to: number;
}

export class Vad {
  readonly state: VadState = { db: -100, speaking: false, heard: false, done: false, from: -1, to: -1 };
  #floor: number | null = null;
  #run = 0;
  #runFrom = 0;
  /** Samples since the last speech frame. */
  #quiet = 0;
  #at = 0;
  #rest = new Float32Array(0);
  readonly #stop: number;
  constructor(o: { stopMs?: number } = {}) {
    this.#stop = (o.stopMs ?? STOP_MS) * MS;
  }

  /** 16 kHz samples in (any length): the state after. */
  push(x: Float32Array): VadState {
    const all = new Float32Array(this.#rest.length + x.length);
    all.set(this.#rest);
    all.set(x, this.#rest.length);
    let i = 0;
    for (; i + FRAME <= all.length; i += FRAME) this.#frame(all.subarray(i, i + FRAME));
    this.#rest = all.slice(i);
    return this.state;
  }

  #frame(x: Float32Array): void {
    const s = this.state, { db, zcr } = frameStats(x), at = this.#at;
    this.#at += FRAME;
    s.db = db;
    const floor = (this.#floor ??= Math.min(db, -60));
    const voiced = zcr < HISS_ZCR;
    const start = voiced && db > Math.max(floor + START_DB, ABS_DB);
    const keep = s.speaking && voiced && db > Math.max(floor + KEEP_DB, ABS_DB - 6);
    // the floor follows the room: down at once, up slowly (and slower still under speech)
    this.#floor = floor + (db - floor) * (db < floor ? 0.5 : start ? 0.002 : 0.02);
    if (start) {
      if (!this.#run++) this.#runFrom = at;
    } else this.#run = 0;
    if (start && this.#run >= ONSET) {
      if (!s.speaking) {
        s.speaking = true;
        if (!s.heard) s.from = this.#runFrom;
        s.heard = true;
      }
    }
    if (s.speaking && (start || keep)) {
      this.#quiet = 0;
      s.to = at + FRAME;
      return;
    }
    this.#quiet += FRAME;
    if (s.speaking && this.#quiet >= HANG_MS * MS) s.speaking = false;
    if (s.heard && !s.speaking && this.#quiet >= this.#stop) s.done = true;
  }
}

/** The speech's span with a little air around it (150 ms before, 200 ms after), clamped to the take; null: none. */
export function speechSpan(s: { from: number; to: number }, length: number): [number, number] | null {
  if (s.from < 0) return null;
  return [Math.max(0, s.from - 150 * MS), Math.min(length, s.to + 200 * MS)];
}
