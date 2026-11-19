// 5 しりとり — Word Chain (docs/sugoroku.md "みんなで！"): a start word (an everyday picture's), then each seat in turn
// (the lander first) adds a word starting with the chain's last letter (x, z, q: the one before), CHAIN_TURN_MS each,
// 60 s in all; the chain one ribbon on every phone. A word: any real word (accept.txt), the seat's level's minLen to
// 8 letters (the wire's), not in the chain yet; only from the seat whose turn it is. Stuck: パス (`op` 'pass': no cost,
// the next seat goes on from the same letter) or ヒント (`op` 'hint': the first two letters of a familiar word, on every
// phone; free at やさしい, else that word's everyday +1 goes). The turn's timer: anyone's `next` for its stage skips the
// seat (gone, or just slow). A whole round of passes: a new start word. Stars: 1 a link, +1 an everyday word, each
// maker's own (CHAIN_SEAT_MAX a seat at most); the chain's longest word the results'.
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { LEVEL } from '../game.ts';
import { PICTURES, tierOf } from '../pictures.ts';
import { isStage } from './hands.ts';
import { capStars } from './stars.ts';
import type { Ctx, Deal, Hand, MiniGame, Play, Result } from './types.ts';

/** A turn's time (the sheet's timer sends the stage's `next` after it). */
export const CHAIN_TURN_MS = 10_000;
/** The longest word (the wire's SG_WORD). */
export const CHAIN_MAX_LEN = 8;
/** A seat's stars at most (a quick seat doesn't take the whole chain's). */
export const CHAIN_SEAT_MAX = 10;
/** Endings no one can follow at A1–A2: the letter before. */
const NO_END = new Set(['x', 'z', 'q']);

interface ChainLink {
  /** null: a start word. */
  who: Who | null;
  w: string;
  /** Its Japanese, when it's an everyday word (or the start's picture). */
  ja: string;
  pts: number;
}
export interface ChainState {
  seed: string;
  /** In turn order, the lander first. */
  seats: Hand[];
  chain: ChainLink[];
  /** Whose turn (seats' index). */
  at: number;
  /** The turn's control stage (hands.ts isStage): one more at each turn. */
  stage: number;
  /** ヒント shown this turn. */
  hinted: boolean;
  /** Turns passed (or skipped) in a row. */
  passes: number;
  /** Start words dealt. */
  starts: number;
}

/** The start words: everyday pictures, 3–8 letters, ending on a letter one can follow. */
const START = PICTURES.filter((p) => tierOf(p) === 1 && /^[a-z]{3,8}$/.test(p.w) && !NO_END.has(p.w.at(-1)!));

/** The letter the next word starts with: the word's last (x z q: the one before; none such: its first). */
export function chainLetter(w: string): string {
  for (let i = w.length - 1; i >= 0; i--) if (!NO_END.has(w[i])) return w[i];
  return w[0];
}
/** The chain's letter now. */
export const letterOf = (s: ChainState): string => chainLetter(s.chain.at(-1)!.w);
/** Whose turn it is. */
export const chainTurn = (s: ChainState): Who => s.seats[s.at].who;

function startLink(s: Pick<ChainState, 'seed' | 'starts' | 'chain'>): ChainLink {
  const r = seeded(`${s.seed}:chain:${s.starts}`), left = START.filter((p) => !s.chain.some((l) => l.w === p.w));
  const p = left[Math.floor(r() * left.length)] ?? START[0];
  return { who: null, w: p.w, ja: p.ja, pts: 0 };
}

/** Why `who`'s word isn't taken (the sheet's soft note), or null when it is: not their turn, not the letter, too
 *  short for their level or too long, not a word, in the chain already. */
export function chainCheck(s: ChainState, who: Who, w: string, ctx: Ctx): 'turn' | 'letter' | 'short' | 'long' | 'word' | 'used' | null {
  const seat = s.seats[s.at];
  if (seat.who !== who) return 'turn';
  if (!w.startsWith(letterOf(s))) return 'letter';
  if (w.length < LEVEL[seat.level].minLen) return 'short';
  if (w.length > CHAIN_MAX_LEN) return 'long';
  if (!/^[a-z]+$/.test(w) || !ctx.words.has(w)) return 'word';
  return s.chain.some((l) => l.w === w) ? 'used' : null;
}

/** ヒント's word for the turn (its first two letters shown): a familiar word with the letter, long enough for the seat,
 *  not in the chain, everyday first (the same on every phone), or null. */
export function chainHint(s: ChainState, ctx: Ctx): string | null {
  const seat = s.seats[s.at];
  const ok = (ctx.words.starting?.(letterOf(s)) ?? []).filter((w) => w.length >= Math.max(3, LEVEL[seat.level].minLen) && w.length <= CHAIN_MAX_LEN && !s.chain.some((l) => l.w === w));
  return ok.length ? ok[s.stage % Math.min(ok.length, 8)] : null;
}

/** A turn's letter tiles after its fixed first letter. */
export const CHAIN_RACK = 8;
/** The turn's tiles (the sheet's, UI only: any real word from the letter counts): ヒント's word's letters after its first
 *  (so one always fits), the rest common letters, shuffled by the turn (the same on every phone) and never reading the
 *  hint's word in order. */
export function chainRack(s: ChainState, ctx: Ctx): string[] {
  const r = seeded(`${s.seed}:rack:${s.stage}`), h = chainHint(s, ctx) ?? '';
  const tiles = [...h.slice(1)];
  while (tiles.length < CHAIN_RACK) tiles.push((tiles.length % 2 ? 'aeiou' : 'tnrslhdm')[Math.floor(r() * (tiles.length % 2 ? 5 : 8))]);
  for (let k = 0; k < 6; k++) if (!shuffle(tiles, r).join('').startsWith(h.slice(1))) break;
  return tiles;
}

/** The turn over: the next seat's, its stage on; a whole round passed, a new start word. */
function nextTurn(s: ChainState, passed: boolean): ChainState {
  const passes = passed ? s.passes + 1 : 0;
  const base = { ...s, at: (s.at + 1) % s.seats.length, stage: s.stage + 1, hinted: false, passes };
  if (passes < s.seats.length) return base;
  return { ...base, passes: 0, starts: s.starts + 1, chain: [...s.chain, startLink({ ...s, starts: s.starts })] };
}

export const chain: MiniGame<ChainState> = {
  deal(d: Deal): ChainState {
    const from = Math.max(0, d.seats.findIndex((x) => x.who === d.lander));
    const seats = d.seats.map((_, k) => d.seats[(from + k) % d.seats.length]);
    const s0 = { seed: d.seed, starts: 0, chain: [] };
    return { seed: d.seed, seats, chain: [startLink(s0)], at: 0, stage: 0, hinted: false, passes: 0, starts: 1 };
  },
  play(s, who, p: Play, ctx) {
    if (p.op === 'next') return isStage(p, s.stage) ? nextTurn(s, true) : s;
    if (chainTurn(s) !== who) return s;
    if (p.op === 'pass') return nextTurn(s, true);
    if (p.op === 'hint') return s.hinted || !chainHint(s, ctx) ? s : { ...s, hinted: true };
    if (p.op !== undefined || !p.w || chainCheck(s, who, p.w, ctx)) return s;
    const seat = s.seats[s.at], ja = ctx.words.ja(p.w);
    const pts = 1 + (ja && !(s.hinted && seat.level > 1) ? 1 : 0);
    return nextTurn({ ...s, chain: [...s.chain, { who, w: p.w, ja, pts }] }, false);
  },
  done: () => false,
  close(s): Result {
    const raw: Partial<Record<Who, number>> = {};
    for (const l of s.chain) if (l.who) raw[l.who] = Math.min(CHAIN_SEAT_MAX, (raw[l.who] ?? 0) + l.pts);
    const longest = s.chain.reduce<ChainLink | null>((a, l) => (l.who && (!a || l.w.length > a.w.length) ? l : a), null);
    return { stars: capStars(raw, s.seats), made: longest?.who ? [{ who: longest.who, kind: 'word', text: longest.w, ja: longest.ja, stars: longest.pts }] : [] };
  }
};
