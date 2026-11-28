// 聞き取りチャレンジ (docs/english.md "Catch the line"), pure: a short real line heard, its chunks tapped in the order
// heard. A tile out of order bounces back (never "wrong"), and the next one is placed for the learner with the line
// again at 0.75×; complete, the line plays at full speed with its chunks lit in time. How it was caught (slowed, tiles
// placed for them, taps out of order) goes on the shelf (shelf.ts). Also which lines a lesson offers.
import { fnv1a } from '#lib/random.ts';
import type { CatchLine } from './types.ts';

/** Lines a lesson offers, at most. */
export const PER_LESSON = 2;
/** The speed after a tile out of order. */
export const SLOW = 0.75;

/** A line being caught. */
export interface Catching {
  /** The tiles shown: the line's chunks then its distractors (`line.tiles` ++ `line.x`). */
  all: readonly string[];
  /** Their order on screen (indexes into `all`, seeded). */
  order: readonly number[];
  /** The tiles placed so far, in the line's order (indexes into `all`). */
  used: readonly number[];
  /** The places in `used` the learner was given (a hint each). */
  given: readonly number[];
  /** Taps out of order. */
  miss: number;
  /** Heard at SLOW since a miss. */
  slow: boolean;
}

/** How a line was caught: at SLOW or not, tiles given, taps out of order. */
export interface How {
  slow: boolean;
  hints: number;
  miss: number;
}

/** A line to catch, its tiles in a seeded order (never the line's own order when another exists). */
export function catching(line: CatchLine, seed: string): Catching {
  const all = [...line.tiles, ...line.x];
  let order = all.map((_, i) => i).sort((a, b) => fnv1a(`${seed}:${all[a]}:${a}`) - fnv1a(`${seed}:${all[b]}:${b}`) || a - b);
  if (order.every((x, i) => x === i)) order = [...order.slice(1), order[0]];
  return { all, order, used: [], given: [], miss: 0, slow: false };
}

/** Every chunk placed. */
export const done = (c: Catching, line: CatchLine): boolean => c.used.length >= line.tiles.length;

/** The next chunk's tile: an unused chunk's with its text (a chunk said twice: either). */
function nextTile(c: Catching, line: CatchLine): number {
  const want = line.tiles[c.used.length];
  return line.tiles.findIndex((t, i) => t === want && !c.used.includes(i));
}

/** A tile tapped: placed when it's the next chunk ('placed', or 'done' with the last); else it bounces back and the
 *  next chunk is placed for them ('hint': the caller replays the line at SLOW; 'done' when that was the last). A tile
 *  already placed, or any tap once done: nothing. */
export function tap(c: Catching, line: CatchLine, i: number): { c: Catching; what: 'placed' | 'hint' | 'done' | 'none' } {
  if (done(c, line) || c.used.includes(i) || i < 0 || i >= c.all.length) return { c, what: 'none' };
  if (c.all[i] === line.tiles[c.used.length]) {
    const next = { ...c, used: [...c.used, i] };
    return { c: next, what: done(next, line) ? 'done' : 'placed' };
  }
  const k = nextTile(c, line);
  const next = { ...c, miss: c.miss + 1, slow: true, used: [...c.used, k], given: [...c.given, c.used.length] };
  return { c: next, what: done(next, line) ? 'done' : 'hint' };
}

/** How the line was caught. */
export const howOf = (c: Catching): How => ({ slow: c.slow, hints: c.given.length, miss: c.miss });

/** Caught first try at full speed with no tile given: what counts as 聞けた on a return. */
export const clean = (h: How): boolean => !h.slow && !h.hints && !h.miss;

/** The chunk lit at `time` (s into the video) in the reward's replay: the last begun (−1 before the first). */
export function litAt(line: CatchLine, time: number): number {
  let k = -1;
  line.t.forEach((t, i) => time + 0.05 >= t && (k = i));
  return k;
}

/** A lesson's lines: those not on the shelf (`has`), ones whose question this play didn't draw first (`drawn`: fresh
 *  ears), then seeded; PER_LESSON at most, in clip order. */
export function lessonLines(lines: readonly CatchLine[] | undefined, has: (q: string) => boolean, drawn: ReadonlySet<string>, seed: string): CatchLine[] {
  return (lines ?? [])
    .filter((l) => !has(l.q))
    .sort((a, b) => +drawn.has(a.q) - +drawn.has(b.q) || fnv1a(`${seed}:${a.q}`) - fnv1a(`${seed}:${b.q}`))
    .slice(0, PER_LESSON)
    .sort((a, b) => a.seg[0] - b.seg[0]);
}
