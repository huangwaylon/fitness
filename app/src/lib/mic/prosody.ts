// まねっこ シャドーイング's comparison (docs/kikimimi-mic.md "まねっこ シャドーイング", "Pitch and timing"): a voice as a track (pitch.ts's frames: the
// melody in semitones from the speaker's own median, so a man and a woman compare fairly; the level; the speech's span;
// the syllable nuclei, de Jong & Wempe's loudness peaks), then the learner's track against the villager's: the timing
// aligned by DTW over the melody and the level (a ±25% band), and the rate, the range, the last 300 ms' direction, the
// three loudest syllables, the pauses and (shadowing) the lag. Those give the feedback codes, praise first, at most two
// (the view's lines, kiki-mane.*): never a score, never 「ちがう」. Pure.
import { frames, medianF0, semitones } from './pitch.ts';

/** Seconds a frame (pitch.ts HOP at 16 kHz). */
export const FRAME_S = 0.01;
/** The speech's span: frames within this of the loudest (dB). */
const SPAN_DB = 25;
/** A nucleus stands this far (dB) above the dips on each side of it, and this many frames from the last. */
const DIP_DB = 2;
const NUCLEUS_GAP = 8;
/** A pause: this many frames of quiet inside the span. */
const PAUSE_FRAMES = 25;

export interface Track {
  /** Semitones from the speaker's median f0, per frame (NaN: unvoiced). */
  st: Float32Array;
  /** The level per frame (dB). */
  db: Float32Array;
  /** The speech's frames [a, b). */
  a: number;
  b: number;
  /** The syllable nuclei (frames), in order. */
  nuclei: number[];
  /** Voiced frames in the span. */
  voiced: number;
}

/** A voice's track from 16 kHz mono samples. */
export function trackOf(pcm: Float32Array): Track {
  const { f0, db } = frames(pcm);
  const st = semitones(f0, medianF0(f0));
  let top = -Infinity;
  for (const x of db) top = Math.max(top, x);
  let a = 0, b = db.length;
  while (a < b && db[a] < top - SPAN_DB) a++;
  while (b > a && db[b - 1] < top - SPAN_DB) b--;
  let voiced = 0;
  for (let k = a; k < b; k++) if (!Number.isNaN(st[k])) voiced++;
  return { st, db, a, b, nuclei: nucleiOf(db, st, a, b, top), voiced };
}

/** The level smoothed over 5 frames (50 ms). */
function smoothDb(db: Float32Array): Float32Array {
  return db.map((_, k) => {
    let s = 0, n = 0;
    for (let j = k - 2; j <= k + 2; j++) if (j >= 0 && j < db.length) (s += db[j]), n++;
    return s / n;
  });
}

/** The syllable nuclei: loudness peaks inside the span, voiced, standing DIP_DB over the dip between each and the one
 *  before (the lower of two without a dip between them dropped), NUCLEUS_GAP frames apart. */
function nucleiOf(db: Float32Array, st: Float32Array, a: number, b: number, top: number): number[] {
  const e = smoothDb(db), out: number[] = [];
  const voicedNear = (k: number) => [k - 1, k, k + 1].some((j) => j >= 0 && j < st.length && !Number.isNaN(st[j]));
  for (let k = Math.max(a, 1); k < Math.min(b, e.length - 1); k++) {
    if (!(e[k] >= e[k - 1] && e[k] > e[k + 1]) || e[k] < top - SPAN_DB || !voicedNear(k)) continue;
    const last = out.at(-1);
    if (last === undefined) {
      out.push(k);
      continue;
    }
    let dip = Infinity;
    for (let j = last; j <= k; j++) dip = Math.min(dip, e[j]);
    const parted = dip <= Math.min(e[last], e[k]) - DIP_DB && k - last >= NUCLEUS_GAP;
    if (parted) out.push(k);
    else if (e[k] > e[last]) out[out.length - 1] = k;
  }
  return out;
}

/** The melody with its unvoiced gaps bridged (the line between the voiced frames either side), for the alignment. */
function bridged(t: Track): Float32Array {
  const out = new Float32Array(t.b - t.a);
  let last = NaN;
  for (let k = t.a; k < t.b; k++) {
    if (!Number.isNaN(t.st[k])) {
      const v = t.st[k];
      if (Number.isNaN(last)) out.fill(v, 0, k - t.a);
      else {
        let g = k - 1;
        while (g >= t.a && Number.isNaN(t.st[g])) g--;
        for (let j = g + 1; j < k; j++) out[j - t.a] = last + ((v - last) * (j - g)) / (k - g);
      }
      out[k - t.a] = v;
      last = v;
    } else if (!Number.isNaN(last)) out[k - t.a] = last;
  }
  return out;
}

/** Each value's z-score. */
function z(x: Float32Array): Float32Array {
  let m = 0;
  for (const v of x) m += v;
  m /= x.length || 1;
  let s = 0;
  for (const v of x) s += (v - m) ** 2;
  const sd = Math.sqrt(s / (x.length || 1)) || 1;
  return x.map((v) => (v - m) / sd);
}

/** DTW over [melody z, level z] of two spans (frames from each's `a`), a band of ±25% around the diagonal: for each
 *  frame of the first, the frame of the second it's matched to. */
function align(ref: Track, you: Track): Int32Array {
  const n = ref.b - ref.a, m = you.b - you.a, map = new Int32Array(Math.max(0, n));
  if (!n || !m) return map;
  const p1 = z(bridged(ref)), e1 = z(ref.db.slice(ref.a, ref.b)), p2 = z(bridged(you)), e2 = z(you.db.slice(you.a, you.b));
  const band = Math.ceil(0.25 * Math.max(n, m)) + 2;
  const INF = Number.POSITIVE_INFINITY, cost = new Float64Array(n * m).fill(INF), from = new Uint8Array(n * m);
  for (let i = 0; i < n; i++) {
    const c = Math.round((i * (m - 1)) / Math.max(1, n - 1)), lo = Math.max(0, c - band), hi = Math.min(m - 1, c + band);
    for (let j = lo; j <= hi; j++) {
      const d = Math.abs(p1[i] - p2[j]) + Math.abs(e1[i] - e2[j]);
      if (!i && !j) {
        cost[0] = d;
        continue;
      }
      const up = i ? cost[(i - 1) * m + j] : INF, left = j ? cost[i * m + j - 1] : INF, diag = i && j ? cost[(i - 1) * m + j - 1] : INF;
      const best = Math.min(diag, up, left);
      cost[i * m + j] = best + d;
      from[i * m + j] = best === diag ? 0 : best === up ? 1 : 2;
    }
  }
  // back from the corner: each reference frame's first match
  let i = n - 1, j = m - 1;
  map.fill(-1);
  while (i >= 0 && j >= 0) {
    map[i] = j;
    if (!i && !j) break;
    const f = from[i * m + j];
    if (f === 0) i--, j--;
    else if (f === 1) i--;
    else j--;
  }
  for (let k = 1; k < n; k++) if (map[k] < 0) map[k] = map[k - 1];
  return map;
}

/** The melody's spread over the span: p90 − p10 (semitones; 0: too little voiced). */
export function rangeOf(t: Track): number {
  const v: number[] = [];
  for (let k = t.a; k < t.b; k++) if (!Number.isNaN(t.st[k])) v.push(t.st[k]);
  if (v.length < 10) return 0;
  v.sort((x, y) => x - y);
  return v[Math.floor(v.length * 0.9)] - v[Math.floor(v.length * 0.1)];
}

type Direction = 'rise' | 'fall' | 'flat';
/** The last 300 ms voiced: rising, falling or level (more than 1.5 semitones across, by a least-squares line). */
export function finalOf(t: Track): Direction {
  const xs: number[] = [], ys: number[] = [];
  for (let k = t.b - 1; k >= t.a && xs.length < 30; k--) if (!Number.isNaN(t.st[k])) xs.push(k), ys.push(t.st[k]);
  if (xs.length < 6) return 'flat';
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => ((sxy += (x - mx) * (ys[i] - my)), (sxx += (x - mx) ** 2)));
  const across = sxx ? (sxy / sxx) * (Math.max(...xs) - Math.min(...xs)) : 0;
  return across > 1.5 ? 'rise' : across < -1.5 ? 'fall' : 'flat';
}

/** Pauses inside the span: runs of PAUSE_FRAMES quiet frames (below the span's threshold). */
export function pausesOf(t: Track): number {
  let top = -Infinity;
  for (let k = t.a; k < t.b; k++) top = Math.max(top, t.db[k]);
  let n = 0, run = 0;
  for (let k = t.a; k < t.b; k++) {
    if (t.db[k] < top - SPAN_DB) run++;
    else {
      if (run >= PAUSE_FRAMES) n++;
      run = 0;
    }
  }
  return n;
}

/** The comparison of a take with the villager's line. */
export interface Outcome {
  /** Any voice heard (0.2 s voiced). */
  heard: boolean;
  /** The villager's speech length over yours (> 1: you're faster). */
  rate: number;
  /** Your melody's range over theirs. */
  range: number;
  final: { ref: Direction; you: Direction };
  /** Of the line's 3 loudest syllables, how many you stressed in step (a nucleus of yours within 0.1 s of where the
   *  alignment puts it), of how many. */
  stress: { hit: number; of: number };
  /** Your pauses more than the villager's. */
  extraPauses: number;
  /** Shadowing: how far behind the villager you started (s); undefined: repeating after. */
  lag?: number;
}

export function compare(ref: Track, you: Track, lag?: number): Outcome {
  const heard = you.voiced >= 20 && you.b > you.a;
  const map = heard ? align(ref, you) : new Int32Array(0);
  const top3 = [...ref.nuclei].sort((x, y) => ref.db[y] - ref.db[x]).slice(0, 3);
  const hit = heard ? top3.filter((k) => {
    const at = you.a + (map[k - ref.a] ?? -1e9);
    return you.nuclei.some((j) => Math.abs(j - at) <= 10);
  }).length : 0;
  const rr = rangeOf(ref);
  return {
    heard,
    rate: heard ? (ref.b - ref.a) / (you.b - you.a) : 1,
    range: heard && rr > 0 ? rangeOf(you) / rr : 1,
    final: { ref: finalOf(ref), you: heard ? finalOf(you) : 'flat' },
    stress: { hit, of: top3.length },
    extraPauses: heard ? Math.max(0, pausesOf(you) - pausesOf(ref)) : 0,
    ...(lag !== undefined && { lag })
  };
}

/** A feedback line's code (kiki-mane's `kiki.mane.fb.<code>`): praise, then one thing to try. */
const PRAISE = ['keep', 'final', 'stress', 'pace', 'melody', 'voice'] as const;
const TIPS = ['flat', 'fast', 'slow', 'late', 'pause', 'finalTry', 'stressTry'] as const;
export type Code = (typeof PRAISE)[number] | (typeof TIPS)[number] | 'quiet';

/** The rate within which the pace is the villager's. */
const FAST = 1.25, SLOW = 0.75;
/** Shadowing: keeping up under this lag (s), falling behind over LATE. */
const KEEP = 0.6, LATE = 1.0;

/** At most two lines, praise first (the first that holds), then the tip that matters most (none: a second praise). */
export function feedback(o: Outcome): Code[] {
  if (!o.heard) return ['quiet'];
  const holds: Record<(typeof PRAISE)[number], boolean> = {
    final: o.final.ref !== 'flat' && o.final.you === o.final.ref,
    stress: o.stress.of >= 2 && o.stress.hit >= Math.min(2, o.stress.of),
    keep: o.lag !== undefined && o.lag <= KEEP,
    pace: o.rate >= SLOW && o.rate <= FAST,
    melody: o.range >= 0.85,
    voice: true
  };
  const tips: Record<(typeof TIPS)[number], boolean> = {
    flat: o.range < 0.6,
    fast: o.rate > FAST,
    slow: o.rate < SLOW,
    late: o.lag !== undefined && o.lag > LATE,
    pause: o.extraPauses > 2,
    finalTry: o.final.ref !== 'flat' && o.final.you !== o.final.ref,
    stressTry: o.stress.of >= 2 && o.stress.hit <= 1
  };
  const praise = PRAISE.filter((c) => holds[c]);
  const tip = TIPS.find((c) => tips[c]);
  return tip ? [praise[0], tip] : praise.slice(0, 2);
}

/** The villager's reaction: そっくり with nothing to try, else いい かんじ (the view's spaced-kana lines). */
export const reaction = (codes: readonly Code[]): 'close' | 'good' | 'quiet' =>
  codes[0] === 'quiet' ? 'quiet' : codes.some((c) => (TIPS as readonly string[]).includes(c)) ? 'good' : 'close';
