// 6 数字キャッチ — Number Catch (docs/sugoroku.md "みんなで！"): a number, a time or a price written in words ("forty-five",
// "half past seven", "three dollars fifty") and four to tap, the classic confusions among them (13 / 30, 45 / 54, 7:45
// / 8:15). 30 s, each phone its own stream (seeded by the seat: the same on every phone), by its level: やさしい 1–100;
// ふつう times and prices too; むずかしい "a quarter to", "ten to nine", "twelve ninety-nine", years and thousands.
// One play a seat at the end, its count right (`n`): the first counts; stars by the level's pace (stars.ts raceStars),
// a miss just shows the answer (the sheet's). As なかま分け, a seat that sent none: お休み.
import { seeded, shuffle, weighted } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { raceStars } from './stars.ts';
import type { Deal, Hand, MiniGame, Play, Result } from './types.ts';

/** A seat's stream's length (more than anyone answers in 30 s). */
export const NUMBER_STREAM = 40;

type Kind = 'number' | 'time' | 'price' | 'year' | 'big';
export interface NumberPrompt {
  kind: Kind;
  /** In words, as it's said. */
  text: string;
  /** Four to tap (digits: 45, 7:30, $3.50, 1995, 3,500), the answer among them. */
  choices: string[];
  /** The answer's index. */
  a: number;
}
export interface NumbersState {
  seed: string;
  seats: Hand[];
  counts: Partial<Record<Who, number>>;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** A whole number (0–9,999) in words, American style: "forty-five", "three hundred twenty", "three thousand five hundred". */
export function inWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${inWords(n % 100)}` : ''}`;
  return `${inWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${inWords(n % 1000)}` : ''}`;
}
/** A year as it's said: "nineteen eighty-five", "two thousand eight", "twenty twenty-six". */
export function yearWords(y: number): string {
  if (y >= 2000 && y < 2010) return inWords(y);
  const hi = Math.floor(y / 100), lo = y % 100;
  return `${inWords(hi)} ${lo === 0 ? 'hundred' : lo < 10 ? `oh ${ONES[lo]}` : inWords(lo)}`;
}
/** -teen ↔ -ty (13 ↔ 30 … 19 ↔ 90), else null. */
const teenTy = (n: number): number | null => (n >= 13 && n <= 19 ? (n - 10) * 10 : n >= 30 && n <= 90 && n % 10 === 0 ? n / 10 + 10 : null);
/** The digits swapped (45 → 54), else null. */
const swapped = (n: number): number | null => (n >= 10 && n < 100 && n % 10 && n % 10 !== Math.floor(n / 10) ? (n % 10) * 10 + Math.floor(n / 10) : null);

const clock = (h: number, m: number): string => `${h}:${String(m).padStart(2, '0')}`;
/** 1–12 round the dial. */
const hour = (h: number): number => ((h + 11) % 12) + 1;
const price = (cents: number): string => `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
const thousands = (n: number): string => n.toLocaleString('en-US');

/** The four: the answer, its nearest miss (the first of `near`: the -teen's -ty), two more of `near` (else `more`'s),
 *  shuffled. */
function choose(right: string, near: readonly (string | null)[], more: () => string, r: () => number): Pick<NumberPrompt, 'choices' | 'a'> {
  const out = [right], ok = near.filter((x): x is string => !!x);
  for (const x of [...ok.slice(0, 1), ...shuffle(ok.slice(1), r)]) if (out.length < 4 && !out.includes(x)) out.push(x);
  for (let k = 0; out.length < 4 && k < 50; k++) {
    const x = more();
    if (!out.includes(x)) out.push(x);
  }
  const choices = shuffle(out, r);
  return { choices, a: choices.indexOf(right) };
}

function numberPrompt(r: () => number, lo: number, hi: number): NumberPrompt {
  // (half the time a -teen / -ty or a two-digit one with its swap: the confusions worth the practice)
  const pick = r() < 0.5 ? [13, 14, 15, 16, 17, 18, 19, 30, 40, 50, 60, 70, 80, 90].filter((n) => n >= lo && n <= hi) : [];
  const n = pick.length ? pick[Math.floor(r() * pick.length)] : lo + Math.floor(r() * (hi - lo + 1));
  const near = [teenTy(n), swapped(n), n + 10 <= 100 ? n + 10 : n - 10, n % 10 ? n - (n % 10) : n + 1].map((x) => (x !== null && x >= 1 && x <= 100 && x !== n ? String(x) : null));
  return { kind: 'number', text: inWords(n), ...choose(String(n), near, () => String(1 + Math.floor(r() * 100)), r) };
}

/** A time: ふつう o'clock, thirty, half past, fifteen, a quarter past, forty-five; むずかしい also a quarter to, ten to,
 *  twenty past, five past. */
function timePrompt(r: () => number, hard: boolean): NumberPrompt {
  const h = 1 + Math.floor(r() * 12);
  const styles: [string, number][] = [
    [`${inWords(h)} o’clock`, 0], [`${inWords(h)} thirty`, 30], [`half past ${inWords(h)}`, 30], [`${inWords(h)} fifteen`, 15],
    [`a quarter past ${inWords(h)}`, 15], [`${inWords(h)} forty-five`, 45]
  ];
  if (hard) styles.push([`a quarter to ${inWords(hour(h + 1))}`, 45], [`ten to ${inWords(hour(h + 1))}`, 50], [`twenty past ${inWords(h)}`, 20], [`five past ${inWords(h)}`, 5]);
  // (むずかしい: the to / past ones mostly)
  const [text, m] = hard && r() < 0.6 ? styles[6 + Math.floor(r() * 4)] : styles[Math.floor(r() * (hard ? styles.length : 6))];
  // near: the next hour (a quarter to eight → 8:15, 8:45), the minutes mirrored (15 ↔ 45), an hour off
  const near = [clock(hour(h + 1), m), clock(hour(h + 1), (60 - m) % 60), clock(h, (60 - m) % 60), clock(hour(h - 1), m), clock(h, (m + 30) % 60)];
  return { kind: 'time', text, ...choose(clock(h, m), near, () => clock(1 + Math.floor(r() * 12), [0, 15, 30, 45][Math.floor(r() * 4)]), r) };
}

/** A price: "five dollars", "three dollars fifty"; むずかしい also "twelve ninety-nine" (dollars and cents said bare). */
function pricePrompt(r: () => number, hard: boolean): NumberPrompt {
  const d = hard ? 1 + Math.floor(r() * 49) : 1 + Math.floor(r() * 19);
  const c = [0, 50, 25, 75, 15, 40, 99, 30, 60, 80][Math.floor(r() * (hard ? 10 : 6))];
  const text = c === 0 ? `${inWords(d)} dollar${d === 1 ? '' : 's'}` : hard && r() < 0.5 && d > 1 ? `${inWords(d)} ${inWords(c)}` : `${inWords(d)} dollar${d === 1 ? '' : 's'} ${inWords(c)}`;
  const cents = d * 100 + c, tc = teenTy(c), td = teenTy(d);
  const near = [tc !== null && tc < 100 ? d * 100 + tc : null, td !== null ? td * 100 + c : null, c ? d * 100 + (100 - c) % 100 : null, (d + 10) * 100 + c, d > 1 ? (d - 1) * 100 + c : null]
    .map((x) => (x !== null && x > 0 && x !== cents ? price(x) : null));
  return { kind: 'price', text, ...choose(price(cents), near, () => price((1 + Math.floor(r() * 30)) * 100 + [0, 50][Math.floor(r() * 2)]), r) };
}

function yearPrompt(r: () => number): NumberPrompt {
  const y = 1950 + Math.floor(r() * 81);
  const lo = y % 100, base = y - lo, tl = teenTy(lo), sl = swapped(lo);
  const near = [tl !== null ? base + tl : null, sl !== null ? base + sl : null, y + 10 <= 2030 ? y + 10 : y - 10, y - 100].map((x) => (x !== null && x !== y ? String(x) : null));
  return { kind: 'year', text: yearWords(y), ...choose(String(y), near, () => String(1950 + Math.floor(r() * 81)), r) };
}

/** Thousands: 1,100–9,900 by hundreds. */
function bigPrompt(r: () => number): NumberPrompt {
  const a = 1 + Math.floor(r() * 9), b = 1 + Math.floor(r() * 9), n = a * 1000 + b * 100;
  const near = [a !== b ? b * 1000 + a * 100 : null, a * 1000 + b * 10, (a + 10) * 1000 + b * 100, a * 100 + b * 1000 + 1000].map((x) => (x !== null && x !== n ? thousands(x) : null));
  return { kind: 'big', text: inWords(n), ...choose(thousands(n), near, () => thousands((1 + Math.floor(r() * 9)) * 1000 + Math.floor(r() * 10) * 100), r) };
}

/** What each level draws, by weight. */
const MIX: Readonly<Record<1 | 2 | 3, readonly (readonly [Kind, number])[]>> = {
  1: [['number', 1]],
  2: [['number', 4], ['time', 3], ['price', 3]],
  3: [['number', 1], ['time', 3], ['price', 2], ['year', 2], ['big', 2]]
};

/** A seat's prompts, in order: the same on every phone for the seat, its level's mix. */
export function numberStream(s: NumbersState, who: Who): NumberPrompt[] {
  const seat = s.seats.find((x) => x.who === who);
  if (!seat) return [];
  const r = seeded(`${s.seed}:numbers:${who}`), out: NumberPrompt[] = [];
  while (out.length < NUMBER_STREAM) {
    const kind = weighted(MIX[seat.level], r), hard = seat.level >= 3;
    const p = kind === 'number' ? numberPrompt(r, hard ? 13 : 1, hard ? 99 : 100) : kind === 'time' ? timePrompt(r, hard) : kind === 'price' ? pricePrompt(r, hard) : kind === 'year' ? yearPrompt(r) : bigPrompt(r);
    // (never the same one twice running)
    if (out.at(-1)?.text !== p.text) out.push(p);
  }
  return out;
}

export const numbers: MiniGame<NumbersState> = {
  deal: (d: Deal) => ({ seed: d.seed, seats: [...d.seats], counts: {} }),
  play(s, who, p: Play) {
    if (p.n === undefined || !s.seats.some((x) => x.who === who) || s.counts[who] !== undefined) return s;
    return { ...s, counts: { ...s.counts, [who]: Math.min(p.n, NUMBER_STREAM) } };
  },
  done: (s) => s.seats.every((x) => s.counts[x.who] !== undefined),
  close(s): Result {
    const stars: Partial<Record<Who, number>> = {};
    for (const x of s.seats) {
      const n = s.counts[x.who];
      if (n !== undefined && raceStars(n, x.level) > 0) stars[x.who] = raceStars(n, x.level);
    }
    return { stars, made: [] };
  }
};
