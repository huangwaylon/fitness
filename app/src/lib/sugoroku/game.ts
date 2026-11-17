// 英語すごろく's game (docs/sugoroku.md "Rules"): one phone passed round the table, a pure state the sheet saves after every
// step (localStorage: a game closed half-way resumes). Every random is seeded by the game's seed and a step counter, so
// a saved game replays the same. No ベル, no record: the stars are the game's own.
import type { Who } from '#lib/types.ts';
import { seeded } from '#lib/random.ts';
import { BOARD, GOAL, type SpaceKind } from './board.ts';
import { newBag, refill, scoreOf, spellable, without, type Score } from './tiles.ts';
import { CARDS, type Card } from './cards.ts';

export interface Seat {
  /** A member or the guest (their worn head), else null: a villager friend (`villager`). */
  who: Who | null;
  villager: string | null;
  name: string;
}
export interface Player extends Seat {
  pos: number;
  stars: number;
  rack: string[];
  /** Their place home (0 first), null on the way. */
  home: number | null;
}
/** Something made in the game: a word or a sentence (the recap). */
interface Made {
  p: number;
  kind: 'word' | 'sentence';
  text: string;
  /** Its Japanese, when we have it. */
  ja: string;
  stars: number;
}
type Phase =
  | { k: 'spin' }
  /** The last in stars (2+ behind) spins twice and keeps the better: both shown. */
  | { k: 'word'; mult: number; spun: number }
  | { k: 'sentence'; spun: number }
  | { k: 'event'; card: number; spun: number }
  | { k: 'home'; spun: number; place: number }
  | { k: 'end' };

export interface Game {
  v: 1;
  seed: string;
  /** The steps taken (the next random's salt). */
  n: number;
  turn: number;
  /** Rounds begun (every seat had a go). */
  round: number;
  players: Player[];
  bag: string[];
  /** Two letters worth double all game. */
  lucky: string[];
  phase: Phase;
  made: Made[];
  /** Cards already drawn (the deck's order: drawn without repeats till it runs out). */
  cards: number[];
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
/** Home first, second, third… */
export const HOME_BONUS = [6, 3, 1, 0];
/** A sentence in order: first try, after a nudge, after 答えはこれ. */
export const SENTENCE_STARS = [6, 4, 2];
const LUCKY_FROM = [...'bcdfghlmnprstwy'];

const rnd = (g: Game) => seeded(`${g.seed}:${g.n}`);

export function newGame(seats: readonly Seat[], seed: string): Game {
  const r = seeded(seed);
  let bag = newBag(r);
  const players = seats.map((s) => {
    const f = refill([], bag, r);
    bag = f.bag;
    return { ...s, pos: 0, stars: 0, rack: f.rack, home: null };
  });
  const a = LUCKY_FROM[Math.floor(r() * LUCKY_FROM.length)];
  const rest = LUCKY_FROM.filter((l) => l !== a);
  const lucky = [a, rest[Math.floor(r() * rest.length)]];
  return { v: 1, seed, n: 0, turn: 0, round: 1, players, bag, lucky, phase: { k: 'spin' }, made: [], cards: [] };
}

const kindAt = (pos: number): SpaceKind => BOARD[pos].kind;
const homeCount = (g: Game) => g.players.filter((p) => p.home !== null).length;

/** Whether this turn's player spins twice (keeps the better): the catch-up for the last in stars, 2+ behind. */
export function twice(g: Game): boolean {
  const me = g.players[g.turn], others = g.players.filter((_, i) => i !== g.turn);
  return others.every((p) => p.stars >= me.stars + 2);
}

/** Spin (1–6) and move; the space decides what comes next. */
export function spin(g: Game): Game {
  if (g.phase.k !== 'spin') return g;
  const r = rnd(g);
  const a = 1 + Math.floor(r() * 6), b = 1 + Math.floor(r() * 6);
  const spun = twice(g) ? Math.max(a, b) : a;
  const players = g.players.map((p) => ({ ...p }));
  const me = players[g.turn];
  me.pos = Math.min(GOAL, me.pos + spun);
  return land({ ...g, n: g.n + 1, players }, spun, r);
}

function land(g: Game, spun: number, r: () => number): Game {
  const me = g.players[g.turn];
  const kind = kindAt(me.pos);
  if (kind === 'goal') {
    const place = homeCount(g);
    me.home = place;
    me.stars += HOME_BONUS[place] ?? 0;
    return { ...g, phase: { k: 'home', spun, place } };
  }
  if (kind === 'sentence') return { ...g, phase: { k: 'sentence', spun } };
  if (kind === 'event') {
    let cards = g.cards.length >= CARDS.length ? [] : g.cards;
    const left = CARDS.map((_, i) => i).filter((i) => !cards.includes(i));
    const card = left[Math.floor(r() * left.length)];
    cards = [...cards, card];
    return { ...g, cards, phase: { k: 'event', card, spun } };
  }
  return { ...g, phase: { k: 'word', mult: kind === 'double' ? 2 : 1, spun } };
}

/** A word's points here, or null if it can't be spelt from the rack. */
export function wordScore(g: Game, word: string, common: boolean, hinted = false): Score | null {
  if (g.phase.k !== 'word' || word.length < 2 || !spellable(word, g.players[g.turn].rack)) return null;
  return scoreOf(word, { lucky: g.lucky, mult: g.phase.mult, common, hinted });
}

/** Play a word (the caller checked it's a word): its stars, the rack refilled, the turn on. */
export function playWord(g: Game, word: string, info: { common: boolean; ja: string; hinted: boolean }): Game {
  const sc = wordScore(g, word, info.common, info.hinted);
  if (!sc) return g;
  const r = rnd(g);
  const players = g.players.map((p) => ({ ...p }));
  const me = players[g.turn];
  const stars = sc.total;
  me.stars += stars;
  const f = refill(without(me.rack, word), g.bag, r);
  me.rack = f.rack;
  const made = [...g.made, { p: g.turn, kind: 'word' as const, text: word, ja: info.ja, stars }];
  return next({ ...g, n: g.n + 1, players, bag: f.bag, made });
}

/** Swap the whole rack instead of a word (no stars). */
export function swap(g: Game): Game {
  if (g.phase.k !== 'word') return g;
  const r = rnd(g);
  const players = g.players.map((p) => ({ ...p }));
  const me = players[g.turn];
  const f = refill([], [...g.bag, ...me.rack], r);
  me.rack = f.rack;
  return next({ ...g, n: g.n + 1, players, bag: f.bag });
}

/** A sentence put in order after `misses` nudges (2+: after 答えはこれ). */
export function sentenceDone(g: Game, misses: number, text: string, ja: string): Game {
  if (g.phase.k !== 'sentence') return g;
  const stars = SENTENCE_STARS[Math.min(misses, 2)];
  const players = g.players.map((p) => ({ ...p }));
  players[g.turn].stars += stars;
  return next({ ...g, players, made: [...g.made, { p: g.turn, kind: 'sentence', text, ja, stars }] });
}

/** The card's effect, then the turn on (or another spin). */
export function eventDone(g: Game): Game {
  if (g.phase.k !== 'event') return g;
  const c: Card = CARDS[g.phase.card];
  const players = g.players.map((p) => ({ ...p }));
  const me = players[g.turn];
  if (c.stars) me.stars = Math.max(0, me.stars + c.stars);
  if (c.gift) for (const [i, p] of players.entries()) {
    if (i === g.turn) continue;
    const n = Math.min(c.gift, p.stars);
    p.stars -= n;
    me.stars += n;
  }
  if (c.move) me.pos = Math.max(0, Math.min(GOAL - 1, me.pos + c.move));
  const out = { ...g, players };
  return c.again ? { ...out, phase: { k: 'spin' } } : next(out);
}

/** After the home screen. */
export function homeDone(g: Game): Game {
  return g.phase.k === 'home' ? next(g) : g;
}

/** The next seat on the way. The game ends with the round someone got home in (every
 *  seat the same number of turns), or once everyone's home. */
function next(g: Game): Game {
  const players = g.players.map((p) => ({ ...p }));
  const end = { ...g, players, phase: { k: 'end' } as const };
  if (players.every((p) => p.home !== null)) return end;
  let turn = g.turn, round = g.round;
  for (let i = 0; i < players.length * 2; i++) {
    turn = (turn + 1) % players.length;
    if (turn === 0) {
      if (players.some((p) => p.home !== null)) return end;
      round++;
    }
    if (players[turn].home === null) break;
  }
  return { ...g, players, turn, round, phase: { k: 'spin' } };
}

/** End now (終了): whoever's on the way stays where they are. */
export const finish = (g: Game): Game => ({ ...g, phase: { k: 'end' } });

/** The ranking: most stars first (ties: nearer home, then home earlier). */
export function ranking(g: Game): number[] {
  return g.players.map((_, i) => i).sort((a, b) => {
    const A = g.players[a], B = g.players[b];
    return B.stars - A.stars || B.pos - A.pos || (A.home ?? 9) - (B.home ?? 9);
  });
}

/** Whether a saved value is a game this build can play. */
export function isGame(x: unknown): x is Game {
  const g = x as Game;
  return !!g && g.v === 1 && Array.isArray(g.players) && g.players.length >= MIN_PLAYERS && typeof g.phase?.k === 'string'
    && g.players.every((p) => Array.isArray(p.rack) && typeof p.pos === 'number' && p.pos <= GOAL);
}
