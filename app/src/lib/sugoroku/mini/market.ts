// ★1 ことばの市場 — Word Market (docs/sugoroku.md "みんなで！"): every phone the same 9 tiles round a 6–7 letter word,
// 60 s, everyone making as many different words as they can. A word anyone found is theirs on every phone (the log's
// first finder: the same everywhere); the same word again is nothing (「もう出てるよ」, the sheet's). Points as a ことば's
// (tiles.ts scoreOf, the level's everyday bonus), the team's ÷ 4 as stars, each finder's own share, a 7+ letter word
// +3; the longest word the results'.
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { LEVEL } from '../game.ts';
import { newBag, scoreOf, spellable } from '../tiles.ts';
import seeds from '../seeds.json';
import { capStars } from './stars.ts';
import type { Ctx, Deal, Hand, MiniGame, Play, Result } from './types.ts';

export const MARKET_TILES = 9;
/** A seat's finds at most (a fast typist's cap: ~15 a minute is a lot; the room's rows stay few). */
export const MARKET_FINDS = 20;
const LONG_WORD = 7;
export const LONG_BONUS = 3;

export interface MarketState {
  seats: Hand[];
  rack: string[];
  /** The word the rack was drawn round (the results' word if no one found a longer). */
  base: string;
  /** In the log's order: its Japanese when it's an everyday word. */
  found: { who: Who; w: string; pts: number; ja: string }[];
}

const SEEDS = seeds as { e: number; w: string[] };

/** The rack: a 6–7 letter common word (an everyday one 6 times in 10) and letters from a fresh bag to MARKET_TILES,
 *  shuffled. */
function rackOf(r: () => number): { rack: string[]; base: string } {
  const pool = (r() < 0.6 ? SEEDS.w.slice(0, SEEDS.e) : SEEDS.w).filter((w) => w.length === 6 || w.length === 7);
  const base = pool[Math.floor(r() * pool.length)];
  const bag = newBag(r);
  for (const l of base) bag.splice(bag.indexOf(l), 1);
  return { rack: shuffle([...base, ...bag.slice(0, MARKET_TILES - base.length)], r), base };
}

/** A word's points for a seat: as a ことば's (no lucky letters, no ×2), the seat's level's everyday bonus. */
const pointsOf = (w: string, level: Hand['level'], ctx: Ctx): number => scoreOf(w, { lucky: [], mult: 1, everyday: ctx.words.ja(w) ? LEVEL[level].everyday : 0 }).total;

/** Why a seat's word isn't taken (the sheet's note), or null when it is: not on the rack, too short for the level,
 *  not a word, found already, the seat's finds full. */
export function marketCheck(s: MarketState, who: Who, w: string, ctx: Ctx): 'tiles' | 'short' | 'word' | 'found' | 'full' | null {
  const seat = s.seats.find((x) => x.who === who);
  if (!seat || !spellable(w, s.rack)) return 'tiles';
  if (w.length < LEVEL[seat.level].minLen) return 'short';
  if (!ctx.words.has(w)) return 'word';
  if (s.found.some((f) => f.w === w)) return 'found';
  return s.found.filter((f) => f.who === who).length >= MARKET_FINDS ? 'full' : null;
}

/** やさしい's ヒント (every 15 s, the sheet's): the first letters of the `k`th everyday word the rack makes that no one
 *  found yet (long enough for the seat), or null. */
export function marketHint(s: MarketState, who: Who, k: number, ctx: Ctx): string | null {
  const seat = s.seats.find((x) => x.who === who);
  if (!seat) return null;
  const left = ctx.words.from(s.rack, (w) => pointsOf(w, seat.level, ctx))
    .filter((w) => ctx.words.ja(w) && w.length >= LEVEL[seat.level].minLen && !s.found.some((f) => f.w === w));
  const w = left[k % Math.max(1, left.length)];
  return w ? w.slice(0, 2) : null;
}

export const market: MiniGame<MarketState> = {
  deal(d: Deal): MarketState {
    return { seats: [...d.seats], ...rackOf(seeded(`${d.seed}:market`)), found: [] };
  },
  play(s, who, p: Play, ctx) {
    const w = p.w;
    if (!w || marketCheck(s, who, w, ctx)) return s;
    const seat = s.seats.find((x) => x.who === who)!;
    return { ...s, found: [...s.found, { who, w, pts: pointsOf(w, seat.level, ctx), ja: ctx.words.ja(w) }] };
  },
  done: () => false,
  close(s): Result {
    const raw: Partial<Record<Who, number>> = {};
    for (const { who } of s.seats) {
      const mine = s.found.filter((f) => f.who === who);
      if (!mine.length) continue;
      // (a find at all: a star at least)
      raw[who] = Math.max(1, Math.round(mine.reduce((n, f) => n + f.pts, 0) / 4) + LONG_BONUS * mine.filter((f) => f.w.length >= LONG_WORD).length);
    }
    const longest = s.found.reduce<MarketState['found'][number] | null>((a, f) => (!a || f.w.length > a.w.length ? f : a), null);
    return { stars: capStars(raw, s.seats), made: longest ? [{ who: longest.who, kind: 'word', text: longest.w, ja: longest.ja, stars: Math.round(longest.pts / 4) }] : [] };
  }
};
