// ★3 みんなで一文 — Sentence Together (docs/sugoroku.md "みんなで！"): a ぶん line's word tiles dealt across the seats
// (hands.ts: 2–3 each, only theirs on their phone, in their colour; the weakest seat its first word, the strongest the
// articles, prepositions and the verb), one shared row on every phone; each taps their own tiles into it in order.
// A tile placed wrong slides back (「おしい！」 and the next word's first letter, the sheet's): a nudge. Two lines in 90 s,
// at the table's lowest seat's level. A line's stars, to everyone present: ぶん's (6, 4 after a nudge, 2 with 答えはこれ:
// `op` 'show'), +2 when no tile came back, +1 at むずかしい (the Japanese only after the line).
// A seat gone quiet: anyone may make its tiles everyone's (`op` 'free', `k` its seat: the sheet's after 15 s).
// The tiles past the opener dealt apart (hands.ts: a word's neighbours in other hands, so the table has to talk), each
// hand shown shuffled and never in the line's order while it holds two (`order`).
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import type { Line } from '../sentences.ts';
import { dealHands } from './hands.ts';
import { capStars } from './stars.ts';
import type { Ctx, Deal, Hand, MiniGame, MiniMade, Play, Result } from './types.ts';

const TOGETHER_LINES = 2;
/** A line's stars: first try, after a nudge, with 答えはこれ; no tile back; むずかしい's (the Japanese unseen). */
const LINE_STARS = [6, 4, 2] as const;
const CLEAN = 2, UNSEEN = 1;
/** The words hard to place, the strongest seat's (articles, prepositions, the common verbs and helpers). */
const HARD = new Set(['a', 'an', 'the', 'to', 'in', 'on', 'at', 'of', 'for', 'with', 'from', 'by', 'about', 'is', 'are', 'am', 'was', 'were', 'be', 'do', 'does', 'did', 'have', 'has', 'can', 'will', 'would', 'should']);

interface TogetherLine {
  en: string; ja: string; words: string[]; owner: Who[];
  /** The tiles as the hands show them (word indices, seat by seat). */
  order: number[];
}
export interface TogetherState {
  seats: Hand[];
  lander: Who;
  lines: TogetherLine[];
  /** The line on (lines.length: both done). */
  l: number;
  /** The tiles placed in the row, in order (the line's word indices). */
  row: number[];
  nudges: number;
  shown: boolean;
  /** Seats whose tiles are everyone's (gone quiet). */
  free: Who[];
  /** The lines done: their nudges, 答えはこれ. */
  results: { nudges: number; shown: boolean }[];
  /** The table's lowest level 3: the Japanese unseen till the end. */
  unseen: boolean;
}

/** The fewest words a line needs for the seats (2 tiles each at 3 seats). */
const minWords = (seats: number): number => (seats >= 3 ? 5 : seats === 2 ? 4 : 3);
const bare = (w: string): string => w.toLowerCase().replace(/[^a-z']/g, '');

/** Each seat's tiles shuffled, its last two (in the line, by word) the other way round: as the tiles go down in order,
 *  what's left of a hand never reads in the line's order while it holds two different words. */
function handOrder(words: readonly string[], owner: readonly Who[], seats: readonly Hand[], r: () => number): number[] {
  return seats.flatMap(({ who }) => {
    const mine = owner.flatMap((o, i) => (o === who ? [i] : []));
    const out = shuffle([...mine], r), last = mine.at(-1)!;
    const before = mine.findLast((i) => words[i] !== words[last]);
    const [b, l] = [out.indexOf(before ?? -1), out.indexOf(last)];
    if (b >= 0 && b < l) [out[b], out[l]] = [last, before!];
    return out;
  });
}

/** The table's lines: the lowest seat's level (then the nearest), long enough for the seats, not used yet. */
function pickLines(lines: readonly Line[], level: number, seats: number, used: ReadonlySet<string>, r: () => number): Line[] {
  const out: Line[] = [];
  for (const need of [minWords(seats), 3]) for (const lv of [level, level === 1 ? 2 : level - 1, 1, 2, 3]) {
    const ok = lines.filter(([en, , l]) => l === lv && !used.has(en) && !out.some((x) => x[0] === en) && en.split(' ').length >= need);
    while (out.length < TOGETHER_LINES && ok.length) out.push(ok.splice(Math.floor(r() * ok.length), 1)[0]);
    if (out.length >= TOGETHER_LINES) return out;
  }
  return out;
}

/** Whether `who` may place tile `k` now: theirs or a freed seat's, not placed yet. */
export const mayPlace = (s: TogetherState, who: Who, k: number): boolean => {
  const line = s.lines[s.l];
  return !!line && k >= 0 && k < line.words.length && !s.row.includes(k) && (line.owner[k] === who || s.free.includes(line.owner[k]));
};
/** The next word to place (its first letter: 「おしい！」's hint), or null. */
export const nextWord = (s: TogetherState): string | null => s.lines[s.l]?.words[s.row.length] ?? null;

function lineStars(res: { nudges: number; shown: boolean }, unseen: boolean): number {
  const base = LINE_STARS[res.shown ? 2 : res.nudges ? 1 : 0];
  return base + (!res.shown && !res.nudges ? CLEAN : 0) + (unseen && !res.shown ? UNSEEN : 0);
}

export const together: MiniGame<TogetherState> = {
  deal(d: Deal, ctx: Ctx): TogetherState {
    const r = seeded(`${d.seed}:together`), level = Math.min(...d.seats.map((s) => s.level));
    const lines = pickLines(ctx.lines, level, d.seats.length, d.used.lines, r).map(([en, ja]): TogetherLine => {
      const words = en.split(' ');
      const hard = words.map((w, i) => (HARD.has(bare(w)) ? i : -1)).filter((i) => i >= 0);
      // (the weakest the first word)
      const owner = dealHands(words.length, d.seats, r, { first: 1, hard });
      return { en, ja, words, owner, order: handOrder(words, owner, d.seats, r) };
    });
    return { seats: [...d.seats], lander: d.lander, lines, l: 0, row: [], nudges: 0, shown: false, free: [], results: [], unseen: level >= 3 };
  },
  play(s, who, p: Play) {
    const line = s.lines[s.l];
    if (!line) return s;
    if (p.op === 'show') return s.shown ? s : { ...s, shown: true };
    if (p.op === 'free') {
      const seat = p.k === undefined ? undefined : s.seats[p.k];
      return seat && !s.free.includes(seat.who) ? { ...s, free: [...s.free, seat.who] } : s;
    }
    if (p.op !== undefined || p.k === undefined || !mayPlace(s, who, p.k)) return s;
    // (equal words in either place count: judged by the word)
    if (line.words[p.k] !== line.words[s.row.length]) return { ...s, nudges: s.nudges + 1 };
    const row = [...s.row, p.k];
    if (row.length < line.words.length) return { ...s, row };
    return { ...s, l: s.l + 1, row: [], nudges: 0, shown: false, results: [...s.results, { nudges: s.nudges, shown: s.shown }] };
  },
  done: (s) => s.l >= s.lines.length,
  close(s): Result {
    const each = s.results.reduce((n, res) => n + lineStars(res, s.unseen), 0);
    const raw = Object.fromEntries(s.seats.map((x) => [x.who, each]));
    const made: MiniMade[] = s.results.map((res, k) => ({ who: s.lander, kind: 'sentence', text: s.lines[k].en, ja: s.lines[k].ja, stars: lineStars(res, s.unseen) }));
    return { stars: capStars(raw, s.seats), made };
  }
};
