// ききみみ クイズ: the spoken clips (docs/kikimimi.md "Audio"). clips.json is written by scripts/kikimimi-audio.ts:
// each item's clip length (`dur`, s: the schedule is computed from it) and its files' content hashes (`?v=`: audio is
// cached first and never revalidated, so a re-spoken clip must be a new URL). Bundled with the game's chunk only.
import raw from './clips.json';
import aligned from './words.json';
import { clipIds, type Item } from './bank.ts';
import { wordSpans } from './marks.ts';

export interface Clip {
  /** The normal clip's length (s). */
  dur: number;
  /** The normal clip's content hash. */
  hash: string;
  /** The slow clip's content hash (levels 1 and 2). */
  slow?: string;
}

export const CLIPS: Readonly<Record<string, Clip>> = raw;

/** The clip's length (s), or undefined if it has none. */
export const clipDur = (id: string): number | undefined => CLIPS[id]?.dur;

/** An item's clip (or its slow clip) as the engine asks for it: the path under audio/ with `?v=` its hash
 *  (`kikimimi/p1-squid.m4a?v=60016cae`), for sound.svelte.ts loadVoice. */
export function clipUrl(id: string, slow = false): string {
  const c = CLIPS[id];
  const v = slow ? c?.slow : c?.hash;
  const path = `kikimimi/${id}${slow ? '-slow' : ''}.m4a`;
  return v ? `${path}?v=${v}` : path;
}

// ---- an item's clips: one, or a dialogue's lines --------------------------------------------------------------------

/** The gap between a dialogue's lines (s): a breath, the next speaker taking the turn. */
export const LINE_GAP = 0.3;

/** Whether every clip of an item exists. */
export const voiced = (it: Pick<Item, 'id' | 'lines'>, clips: Readonly<Record<string, unknown>> = CLIPS): boolean => clipIds(it).every((id) => id in clips);

/** An item's length as played (s): its clip, or a dialogue's lines in turn with LINE_GAP between them (the session's
 *  schedule: kikimimi/session.ts QuizDeck.dur); undefined while a clip is missing. */
export function itemDur(it: Pick<Item, 'id' | 'lines'>, clips: Readonly<Record<string, Pick<Clip, 'dur'>>> = CLIPS): number | undefined {
  const durs = clipIds(it).map((id) => clips[id]?.dur);
  return durs.some((d) => d === undefined) ? undefined : (durs as number[]).reduce((a, b) => a + b, 0) + LINE_GAP * (durs.length - 1);
}

/** A sequence's start times (relay ms) from `at`, its lines' lengths `durs` (s): each LINE_GAP after the one before.
 *  Heard late (`now` past `at`), a line already over is skipped (-1) and one under way plays whole from now, the ones
 *  after it moving on by as much: never two lines at once. */
export function sequenceStarts(durs: readonly number[], at: number, now: number): number[] {
  const out: number[] = [];
  let t = at;
  for (const d of durs) {
    const ms = d * 1000;
    if (t + ms <= now) {
      out.push(-1);
      t += ms + LINE_GAP * 1000;
      continue;
    }
    const start = Math.max(t, now);
    out.push(start);
    t = start + ms + LINE_GAP * 1000;
  }
  return out;
}

// ---- the karaoke's word timings -------------------------------------------------------------------------------------

/** words.json (scripts/kikimimi-words.ts): a clip's words aligned by whisper, `[hash, start…, end]` in centiseconds,
 *  one start per word of its `en` (marks.ts wordSpans); stale (another hash: the clip re-spoken) is ignored. */
const WORDS = aligned as unknown as Readonly<Record<string, readonly [string, ...number[]]>>;

/** Each word's start (s from the clip's start) and the clip's end, one per word of `en` and one more: the aligned
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
