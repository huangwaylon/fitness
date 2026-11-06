// ききみみ クイズ's スピード はしご (docs/kikimimi.md "スピード はしご", docs/curriculum.md §7 game 2): one line heard at
// rising speeds, a different question at each rung (ladders.ts), the score the rungs climbed in order on the first
// listen. A game is 2 ladders of 4 rungs: the quiz's 8 questions, so the session, the protocol and the relay are the
// quiz's own. The mode rides on the `open`'s seed (bit 1, beside たいせん's bit 0: session.ts isLadder): every phone
// builds the same deck from {seed} as it does a quiz's from {seed, lv}. Pure; the ladders are ladders.ts's (LADDERS), compiled
// into their own chunk (pool.ts ladders); the clips are made by scripts/kikimimi-audio.ts.
import { mulberry32, shuffle } from '#lib/random.ts';
import { shuffleChoices, type Item } from './bank.ts';

/** Each rung's speed, × natural speech (NATURAL_RATE): careful, natural, brisk, fast casual. */
export const SPEEDS = [0.8, 1, 1.2, 1.4] as const;
/** Natural speech at 1.0× (syllables a second: curriculum §3 S1 かわ, 3.8-4.5; 1.4× is 6.0, S4 fast casual). The pipeline
 *  stretches each line's take to SPEEDS × this, whatever pace the engine spoke it at, so a speed means the same on every
 *  ladder (and "the fastest comfortable speed" is a real rate). */
export const NATURAL_RATE = 4.3;
/** Ladders a game (× SPEEDS.length rungs = the quiz's 8 questions). */
export const PER_GAME = 2;
/** A rung climbed (right on the first listen, every rung under it climbed too): flat, never more for a higher rung
 *  (a payout weighted to the top invites guessing; the learning-science review). */
export const RUNG_POINTS = 100;

export interface Ladder {
  id: string;
  /** The line as an item (lv 4): its text, voice, Japanese, note, tags, staging and marks (the audio script speaks it
   *  once; each rung's clip is its take stretched). */
  line: Item;
  /** Its rungs, slowest first: SPEEDS.length items, each with its own question. */
  rungs: readonly Item[];
}

// ---- the deck ----------------------------------------------------------------------------------------------------

/** A ladder game's deck from its seed: PER_GAME ladders (two different speakers, and two voices where the draw
 *  allows), each's rungs in order, slowest first, each rung's choices shuffled. Copies, as deck.ts's: `answer` is the
 *  right choice's index after the shuffle. */
export function ladderDeck(seed: number, all: readonly Ladder[]): Item[] {
  const r = mulberry32((seed ^ 0x5bd1e995) >>> 0);
  const order = shuffle([...all], r);
  const picked: Ladder[] = [];
  for (const pass of [true, false])
    for (const l of order) {
      if (picked.length >= PER_GAME || picked.includes(l)) continue;
      const clash = picked.some((p) => p.line.speaker === l.line.speaker || (pass && p.line.cast === l.line.cast));
      if (!clash) picked.push(l);
    }
  return picked.flatMap((l) => l.rungs.map((it) => shuffleChoices(it, r)));
}

// ---- climbing and scoring ------------------------------------------------------------------------------------------

/** An answer as the climb sees it: right or not, on the first listen or not. Null: none (timed out). */
type Try = { ok: boolean; first: boolean } | null;

/** How high a ladder was climbed: its rungs (in order) right on the first listen, stopping at the first that wasn't
 *  (a miss, a replay, no answer). */
export function climb(tries: readonly Try[]): number {
  let n = 0;
  while (n < tries.length && tries[n]?.ok && tries[n]!.first) n++;
  return n;
}

/** A deck's ladders: each one's first question and its rungs' count, in order. */
export function laddersIn(items: readonly Pick<Item, 'rung'>[]): { ladder: string; from: number; n: number }[] {
  const out: { ladder: string; from: number; n: number }[] = [];
  items.forEach((it, i) => {
    if (!it.rung) return;
    const last = out.at(-1);
    if (last && last.ladder === it.rung.ladder) last.n++;
    else out.push({ ladder: it.rung.ladder, from: i, n: 1 });
  });
  return out;
}

/** Each ladder's climb from a player's answers (question index → choice, replayed). */
export function climbs(items: readonly Item[], answers: ReadonlyMap<number, { k: number; rp: boolean }>): number[] {
  return laddersIn(items).map(({ from, n }) =>
    climb(Array.from({ length: n }, (_, j) => {
      const a = answers.get(from + j);
      return a ? { ok: a.k === items[from + j].answer, first: !a.rp } : null;
    })));
}

/** A player's points (the session's running total, the protocol's `s`): RUNG_POINTS a rung climbed. */
export const ladderPoints = (items: readonly Item[], answers: ReadonlyMap<number, { k: number; rp: boolean }>): number =>
  climbs(items, answers).reduce((s, n) => s + n * RUNG_POINTS, 0);

/** Where question i is on its ladder: its rung (1-based), the ladder's rungs, how high it was climbed before it, and
 *  whether this rung can still be climbed (every rung under it was). */
export function rungState(items: readonly Item[], answers: readonly ({ k: number; rp: boolean } | null)[], i: number): { n: number; of: number; below: number; open: boolean } | null {
  const l = laddersIn(items).find(({ from, n }) => i >= from && i < from + n);
  if (!l) return null;
  const below = climb(Array.from({ length: i - l.from }, (_, j) => {
    const a = answers[l.from + j];
    return a ? { ok: a.k === items[l.from + j].answer, first: !a.rp } : null;
  }));
  return { n: i - l.from + 1, of: l.n, below, open: below === i - l.from };
}

/** The speed a climb reached (0 rungs: none). */
export const speedAt = (rungs: number): number | null => (rungs > 0 ? SPEEDS[Math.min(rungs, SPEEDS.length) - 1] : null);

/** A speed as shown: one decimal (0.8, 1.0, 1.4). */
export const sx = (x: number): string => x.toFixed(1);
