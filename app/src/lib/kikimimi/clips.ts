// ききみみ クイズ: the spoken clips (docs/kikimimi.md "Audio"). clips.json is written by scripts/kikimimi-audio.ts:
// each item's clip length (`dur`, s: the schedule is computed from it) and its files' content hashes. The clips ship
// in packs (packing.ts: static/audio/listen/<pack>.<hash>.pak, a re-spoken clip a new pack hash). The app never
// imports clips.json whole: each level's chunk (compile.ts) carries its clips (length, hash, and where each is in its
// pack: ChunkClip) and word timings, added here as it loads (pool.ts); components/kikimimi/packs.ts fetches and
// slices the packs.
import { clipIds, type Item } from './bank.ts';
import { wordSpans } from './marks.ts';
import type { PackRef } from './packing.ts';

export interface Clip {
  /** The normal clip's length (s). */
  dur: number;
  /** The normal clip's content hash. */
  hash: string;
  /** The slow clip's content hash (levels 1 and 2). */
  slow?: string;
}

/** A clip as a chunk carries it (compile.ts): its length (cs), hash, and its pack (an index into the chunk's
 *  `packs`), offset and bytes; then its slow take's pack, offset and bytes (levels 1 and 2). */
export type ChunkClip =
  | [dur: number, hash: string, pack: number, offset: number, bytes: number]
  | [dur: number, hash: string, pack: number, offset: number, bytes: number, slowPack: number, slowOffset: number, slowBytes: number];

/** A clip's word timings (words.json): `[hash, start…, end]`, centiseconds. */
export type Words = readonly [string, ...number[]];

/** A loaded clip: its length (s), hash, and where it and its slow take are. */
interface Placed {
  dur: number;
  hash: string;
  at: PackRef;
  slow?: PackRef;
}

/** The clips of the levels loaded so far, and their word timings. */
const CLIPS: Record<string, Placed> = {};
const WORDS: Record<string, Words> = {};

/** A level's chunk loaded (pool.ts): its packs (stems), clips and word timings. */
export function addClips(packs: readonly string[], clips: Readonly<Record<string, ChunkClip>>, words: Readonly<Record<string, Words>>): void {
  for (const [id, [cs, hash, p, offset, bytes, sp, so, sb]] of Object.entries(clips))
    CLIPS[id] = { dur: cs / 100, hash, at: [packs[p], offset, bytes], ...(sp !== undefined && { slow: [packs[sp], so!, sb!] as const }) };
  Object.assign(WORDS, words);
}

/** The clip's length (s), or undefined if it has none. */
export const clipDur = (id: string): number | undefined => CLIPS[id]?.dur;

/** Where a loaded clip (or its slow take) is: its pack's stem, offset and bytes (components/kikimimi/packs.ts). */
export const clipAt = (id: string, slow = false): PackRef | undefined => (slow ? CLIPS[id]?.slow : CLIPS[id]?.at);

// ---- an item's clips: one, or a dialogue's lines --------------------------------------------------------------------

/** The gap between a dialogue's lines (s): a breath, the next speaker taking the turn. */
export const LINE_GAP = 0.3;

/** The offset before each of a dialogue's lines after the first (s): a たちぎき line's `at`, from the previous line's
 *  end (negative: an overlap, played on the audio clock, never baked into a clip, so a line still plays alone), else
 *  LINE_GAP. */
export const lineGaps = (it: Pick<Item, 'lines'>): number[] => ((it.lines ?? []) as readonly { at?: number }[]).slice(1).map((l) => (typeof l.at === 'number' ? l.at : LINE_GAP));

/** Whether every clip of an item exists (in `clips`: clips.json, the compiler's). */
export const voiced = (it: Pick<Item, 'id' | 'lines'>, clips: Readonly<Record<string, unknown>>): boolean => clipIds(it).every((id) => id in clips);

/** An item's length as played (s): its clip, or a dialogue's lines in turn, each its offset after the one before
 *  (lineGaps), to the last one's end (the session's schedule: components/kikimimi/decks.ts, a round's `play`);
 *  undefined while a clip is missing. */
export function itemDur(it: Pick<Item, 'id' | 'lines'>, clips: Readonly<Record<string, Pick<Clip, 'dur'>>> = CLIPS): number | undefined {
  const durs = clipIds(it).map((id) => clips[id]?.dur);
  if (durs.some((d) => d === undefined)) return undefined;
  const starts = sequenceStarts(durs as number[], 0, 0, lineGaps(it));
  return Math.max(...starts.map((s, k) => s + (durs[k] as number) * 1000)) / 1000;
}

/** A sequence's start times (relay ms) from `at`, its lines' lengths `durs` (s): each its gap (s, `gaps[k - 1]`, else
 *  LINE_GAP) after the end of the one before. Heard late (`now` past `at`), a line already over is skipped (-1) and
 *  one under way plays whole from now, the ones after it moving on by as much. */
export function sequenceStarts(durs: readonly number[], at: number, now: number, gaps: readonly number[] = []): number[] {
  const out: number[] = [];
  let t = at;
  for (const [k, d] of durs.entries()) {
    const ms = d * 1000;
    if (k > 0) t += (gaps[k - 1] ?? LINE_GAP) * 1000;
    if (t + ms <= now) {
      out.push(-1);
      t += ms;
      continue;
    }
    const start = Math.max(t, now);
    out.push(start);
    t = start + ms;
  }
  return out;
}

// ---- a bed under a sequence ------------------------------------------------------------------------------------------

/** A bed under a whole conversation (a たちぎき at a party: components/kikimimi/clipPlayer.svelte.ts) starts this long
 *  (s) before its first line and ends this long after its last, as a mixed clip's bed (conditions.ts condPlan). */
export const BED_LEAD = 0.5;
export const BED_TAIL = 0.35;
/** Its fades in and out (s). */
const BED_FADE = 0.25;

/** `n` samples of a bed from its loop (seamless: each loop's end crossfaded into its start, scripts/kikimimi-beds.ts),
 *  from `offset` (any int: wrapped), at `gain`, faded in and out over BED_FADE. */
export function bedSamples(loop: Float32Array, n: number, rate: number, gain: number, offset: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(n), len = loop.length, fade = Math.max(1, Math.min(Math.round(BED_FADE * rate), Math.floor(n / 2)));
  if (!len) return out;
  for (let j = 0, p = ((offset % len) + len) % len; j < n; j++, p = p + 1 === len ? 0 : p + 1) out[j] = loop[p] * gain * Math.min(1, j / fade, (n - 1 - j) / fade);
  return out;
}

// ---- the karaoke's word timings -------------------------------------------------------------------------------------

/** words.json (scripts/kikimimi-words.ts): a clip's words aligned by whisper, `[hash, start…, end]` in centiseconds,
 *  one start per word of its `en` (marks.ts wordSpans); stale (another hash: the clip re-spoken) is ignored.
 *  Each word's start (s from the clip's start) and the clip's end, one per word of `en` and one more: the aligned
 *  timings where they're for this clip, else the clip's length spread over the words by their letters (a pause after
 *  a comma or a full stop). */
export function wordTimes(id: string, en: string): number[] {
  const words = wordSpans(en).map(([a, b]) => en.slice(a, b));
  const a = WORDS[id];
  if (a && a[0] === CLIPS[id]?.hash && a.length === words.length + 2) return (a.slice(1) as number[]).map((cs) => cs / 100);
  const dur = CLIPS[id]?.dur ?? 2;
  const weight = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1 + (/[,.?!:;…—]$/.test(w) ? 2 : 0));
  const total = weight.reduce((x, y) => x + y, 0) || 1;
  const out: number[] = [];
  let t = 0;
  for (const w of weight) {
    out.push(Math.round(t * 100) / 100);
    t += (w / total) * dur;
  }
  out.push(dur);
  return out;
}
