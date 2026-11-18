// 英語すごろく's mini-games (docs/sugoroku.md "みんなで！"): the contract every game keeps. A game is a pure state
// machine: `deal` its state from the stone's seed and the seats present, `play` a move from any of them (the same state
// back when it takes nothing), `done` when it ends early, `close` its stars and what it made. The fold (online.ts) and
// the passed-round sheet call the same reducers (turn.ts), so a game folds the same on every phone from the same moves,
// whatever order they raced in: the log's order is the room's. Never time: the end is a move (`mc`, clock.ts).
import type { Who } from '#lib/types.ts';
import type { Level } from '../game.ts';
import type { Words } from '../words.ts';
import type { Line } from '../sentences.ts';

export type { MiniId } from './registry.ts';

/** A play's fields (the wire's `mp`: contract/live-protocol.ts): a word, an index (0–63), a count (0–99), a flag, a
 *  chip or control code (`op`: [a-z0-9]{1,16}). */
export interface Play { w?: string; k?: number; n?: number; y?: 1; op?: string }
/** What a game reads besides its state: the words (accept, everyday Japanese) and the ぶん lines. */
export interface Ctx { words: Words; lines: readonly Line[] }
/** A seat present (in seat order), its English level. */
export interface Hand { who: Who; level: Level }
export interface Deal {
  /** The stone's seed (every random of the deal's from it). */
  seed: string;
  /** The seats present at the open (only they are dealt in; one absent then watches). */
  seats: readonly Hand[];
  /** Who landed (the first giver, the first to play). */
  lander: Who;
  /** The game's pictures and lines already used (not dealt again). */
  used: { pictures: ReadonlySet<string>; lines: ReadonlySet<string> };
}
/** Something a mini-game made, for the results (みんなで覚えたことば, each one's good thing). */
export interface MiniMade { who: Who; kind: 'word' | 'sentence' | 'picture'; text: string; ja: string; stars: number }
export interface Result {
  /** Each seat's stars (never negative; a seat that never played: none). */
  stars: Partial<Record<Who, number>>;
  made: MiniMade[];
}
export interface MiniGame<S> {
  deal(d: Deal, ctx: Ctx): S;
  play(s: S, who: Who, p: Play, ctx: Ctx): S;
  done(s: S): boolean;
  close(s: S): Result;
}
