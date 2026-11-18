// 英語すごろく's game (docs/sugoroku.md "Rules"): one phone passed round the table, a pure state the sheet saves after every
// step (localStorage: a game closed half-way resumes). Every random is seeded by the game's seed and its step counter
// (every step moves it on), so a saved game replays the same. No ベル, no record: the stars are the game's own.
import type { Who } from '#lib/types.ts';
import { fnv1a, seeded } from '#lib/random.ts';
import { BOARD, GOAL, stepFrom, toGoal } from './board.ts';
import { newBag, refill, scoreOf, spellable, without, type Score } from './tiles.ts';
import { CARDS, type Card } from './cards.ts';
import { PICTURES, PICTURE_STARS } from './pictures.ts';

/** A seat's English: 1 やさしい, 2 ふつう, 3 むずかしい (what its spaces ask, not what they pay: the table stays even). */
export type Level = 1 | 2 | 3;
export const LEVEL: Readonly<Record<Level, { minLen: number; everyday: number; hintHalf: boolean }>> = {
  1: { minLen: 3, everyday: 3, hintHalf: false },
  2: { minLen: 3, everyday: 2, hintHalf: true },
  3: { minLen: 4, everyday: 1, hintHalf: true }
};

/** Someone at the table: a member or the guest, drawn as they look in the island (their own character). */
export interface Seat {
  who: Who;
  name: string;
  level: Level;
}
/** How long a game runs: みじかい ends by round 7, ふつう when someone's home (or MAX_ROUNDS), ながい when everyone's
 *  home (or 20 rounds). */
export type Length = 'short' | 'normal' | 'long';
const ROUND_CAP: Record<Length, (seats: number) => number> = { short: () => 7, normal: (n) => MAX_ROUNDS[n] ?? 14, long: () => 20 };
export interface Player extends Seat {
  pos: number;
  stars: number;
  rack: string[];
  /** Their place home (0 first), null on the way. */
  home: number | null;
  /** The fork's way taken (0 近道, 1 遠回り), null before it. */
  branch: number | null;
}
/** Something made in the game: a word or a sentence (the recap). */
interface Made {
  p: number;
  kind: 'word' | 'sentence' | 'picture';
  text: string;
  /** Its Japanese, when we have it. */
  ja: string;
  stars: number;
}
/** A turn's English so far (kept in the save, so a sheet closed mid-turn resumes it as it was). */
interface Tries {
  misses?: number;
  /** ヒント used (ことば). */
  hinted?: boolean;
  /** 意味を見る opened (むずかしい's ぶん). */
  peeked?: boolean;
}
type Phase =
  | { k: 'spin' }
  /** At the fork with `left` spaces still to walk: 近道 or 遠回り? */
  | { k: 'fork'; spun: number; left: number }
  | ({ k: 'word'; mult: number; spun: number } & Tries)
  /** `r`: the line's pick in [0, 1) among the seat's level's lines not used yet. */
  | ({ k: 'sentence'; spun: number; r: number } & Tries)
  /** `item`: PICTURES' index (none collected yet in this game). */
  | ({ k: 'picture'; item: number; spun: number; r: number } & Tries)
  | { k: 'event'; card: number; spun: number }
  | { k: 'home'; spun: number; place: number }
  | { k: 'end' };

/** The save's shape; CONTENT: the board's, cards' and pictures' build, hashed (a save from another reads as none:
 *  save.ts; the lines are picked afresh by the phase's `r`). */
const V = 5;
// (the structure only: a copy fix or a stone moved on the drawing never drops a game in play)
const CONTENT = fnv1a(JSON.stringify([BOARD.map((b) => [b.kind, b.next]), CARDS.map(({ en: _e, ja: _j, who: _w, ...fx }) => fx), PICTURES.map((p) => p.w)])).toString(36);

export interface Game {
  v: typeof V;
  content: string;
  seed: string;
  length: Length;
  /** The steps taken (the next random's salt). */
  n: number;
  turn: number;
  /** Rounds begun (every seat had a go). */
  round: number;
  players: Player[];
  bag: string[];
  /** Two letters worth +2 all game. */
  lucky: string[];
  phase: Phase;
  made: Made[];
  /** Cards already drawn (drawn without repeats till they run out). */
  cards: number[];
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 3;
/** The last round, by seats (the round someone gets home in ends it earlier: about 11). */
export const MAX_ROUNDS: Readonly<Record<number, number>> = { 2: 16, 3: 14, 4: 12 };
/** Home first, second, third… */
export const HOME_BONUS = [6, 3, 1, 0];
/** A line in order: first try, after a nudge, after 答えはこれ; むずかしい's without its Japanese +2. */
const SENTENCE_STARS = [6, 4, 2];
export const UNSEEN_BONUS = 2;
/** The lucky letters come from the common consonants (a rare one was often in no rack: a dead bonus). */
const LUCKY_FROM = [...'dghlmnprst'];

const rnd = (g: Game) => seeded(`${g.seed}:${g.n}`);
const copy = (g: Game) => g.players.map((p) => ({ ...p }));

export function newGame(seats: readonly Seat[], seed: string, length: Length = 'normal'): Game {
  const r = seeded(seed);
  let bag = newBag(r);
  const players = seats.map((s) => {
    const f = refill([], bag, r);
    bag = f.bag;
    return { ...s, pos: 0, stars: 0, rack: f.rack, home: null, branch: null };
  });
  const a = LUCKY_FROM[Math.floor(r() * LUCKY_FROM.length)];
  const rest = LUCKY_FROM.filter((l) => l !== a);
  const lucky = [a, rest[Math.floor(r() * rest.length)]];
  return { v: V, content: CONTENT, seed, length, n: 0, turn: 0, round: 1, players, bag, lucky, phase: { k: 'spin' }, made: [], cards: [] };
}

/** How far ahead on the route a lead counts as too far (steps to あがり). */
const GAP = 6;
/** This turn's dice, keeping the table together: `fast` (two dice, the higher) for the one well behind on the route
 *  (GAP+ steps behind whoever's furthest on) or last in stars (2+ behind everyone), `slow` (two dice, the lower) for the
 *  one well ahead (GAP+ steps ahead of whoever's furthest back), else one die. */
export function rollMode(g: Game): 'fast' | 'slow' | 'even' {
  const me = g.players[g.turn], others = g.players.filter((_, i) => i !== g.turn && g.players[i].home === null);
  if (!others.length) return 'even';
  const left = (p: Player) => toGoal(p.pos, p.branch);
  const mine = left(me);
  if (mine - Math.min(...others.map(left)) >= GAP || others.every((p) => p.stars >= me.stars + 2)) return 'fast';
  if (Math.max(...others.map(left)) - mine >= GAP) return 'slow';
  return 'even';
}

/** Roll (1–6) and walk; the fork stops the walk for a choice; the space decides what comes next. */
export function spin(g: Game): Game {
  if (g.phase.k !== 'spin') return g;
  const players = copy(g);
  const r = rnd(g);
  const a = 1 + Math.floor(r() * 6), b = 1 + Math.floor(r() * 6);
  const mode = rollMode(g);
  const spun = mode === 'fast' ? Math.max(a, b) : mode === 'slow' ? Math.min(a, b) : a;
  return walk({ ...g, n: g.n + 1, players }, spun, spun, r);
}

/** At the fork: take 近道 (0) or 遠回り (1) and walk on. */
export function choose(g: Game, branch: 0 | 1): Game {
  if (g.phase.k !== 'fork') return g;
  const players = copy(g);
  players[g.turn].branch = branch;
  return walk({ ...g, n: g.n + 1, players }, g.phase.spun, g.phase.left, rnd(g));
}

/** Walk `left` spaces (the players already copied), then land. */
function walk(g: Game, spun: number, left: number, r: () => number): Game {
  const me = g.players[g.turn];
  for (; left > 0; left--) {
    const n = stepFrom(me.pos, me.branch);
    if (n === null) {
      if (me.pos === GOAL) break;
      return { ...g, phase: { k: 'fork', spun, left } };
    }
    me.pos = n;
    if (n === GOAL) break;
  }
  return land(g, spun, r);
}

function land(g: Game, spun: number, r: () => number): Game {
  const me = g.players[g.turn];
  const kind = BOARD[me.pos].kind;
  if (kind === 'goal') {
    const place = g.players.filter((p) => p.home !== null).length;
    me.home = place;
    me.stars += HOME_BONUS[place] ?? 0;
    return { ...g, phase: { k: 'home', spun, place } };
  }
  if (kind === 'sentence') return { ...g, phase: { k: 'sentence', spun, r: r() } };
  if (kind === 'picture') {
    // (each picture once a game)
    const taken = new Set(g.made.filter((m) => m.kind === 'picture').map((m) => m.text));
    const left = PICTURES.map((_, i) => i).filter((i) => !taken.has(PICTURES[i].w));
    if (left.length) return { ...g, phase: { k: 'picture', item: left[Math.floor(r() * left.length)], spun, r: r() } };
  }
  if (kind === 'event') {
    let cards = g.cards.length >= CARDS.length ? [] : g.cards;
    const left = CARDS.map((_, i) => i).filter((i) => !cards.includes(i));
    const card = left[Math.floor(r() * left.length)];
    cards = [...cards, card];
    return { ...g, cards, phase: { k: 'event', card, spun } };
  }
  return { ...g, phase: { k: 'word', mult: kind === 'double' ? 2 : 1, spun } };
}

/** A turn's English so far, kept (a miss, ヒント, 意味を見る). */
export function tried(g: Game, t: Tries): Game {
  const ph = g.phase;
  return ph.k === 'word' || ph.k === 'sentence' || ph.k === 'picture' ? { ...g, phase: { ...ph, ...t } } : g;
}

/** A word's points here for this seat, or null if it can't be spelt from the rack or is under the seat's length. */
export function wordScore(g: Game, word: string, everyday: boolean, hinted = false): Score | null {
  const me = g.players[g.turn], lv = LEVEL[me.level];
  if (g.phase.k !== 'word' || word.length < lv.minLen || !spellable(word, me.rack)) return null;
  return scoreOf(word, { lucky: g.lucky, mult: g.phase.mult, everyday: everyday ? lv.everyday : 0, half: hinted && lv.hintHalf });
}

/** Play a word (the caller checked it's a word): its stars, the rack refilled, the turn on. */
export function playWord(g: Game, word: string, info: { everyday: boolean; ja: string; hinted: boolean }): Game {
  const sc = wordScore(g, word, info.everyday, info.hinted);
  if (!sc) return g;
  const r = rnd(g);
  const players = copy(g);
  const me = players[g.turn];
  me.stars += sc.total;
  const f = refill(without(me.rack, word), g.bag, r);
  me.rack = f.rack;
  const made = [...g.made, { p: g.turn, kind: 'word' as const, text: word, ja: info.ja, stars: sc.total }];
  return next({ ...g, n: g.n + 1, players, bag: f.bag, made });
}

/** Swap the whole rack instead of a word (no stars). */
export function swap(g: Game): Game {
  if (g.phase.k !== 'word') return g;
  const r = rnd(g);
  const players = copy(g);
  const me = players[g.turn];
  const f = refill([], [...g.bag, ...me.rack], r);
  me.rack = f.rack;
  return next({ ...g, n: g.n + 1, players, bag: f.bag });
}

/** The stars for a line put in order after `misses` nudges (2: after 答えはこれ), `unseen` without its Japanese. */
export const sentenceStars = (misses: number, unseen: boolean): number => SENTENCE_STARS[Math.min(misses, 2)] + (unseen && misses < 2 ? UNSEEN_BONUS : 0);

export function sentenceDone(g: Game, o: { misses: number; unseen: boolean; text: string; ja: string }): Game {
  if (g.phase.k !== 'sentence') return g;
  const stars = sentenceStars(o.misses, o.unseen);
  const players = copy(g);
  players[g.turn].stars += stars;
  return next({ ...g, n: g.n + 1, players, made: [...g.made, { p: g.turn, kind: 'sentence', text: o.text, ja: o.ja, stars }] });
}

/** No line to give (none left for the level, or not loaded): the space plays as ことば. */
export const sentenceAsWord = (g: Game): Game => (g.phase.k === 'sentence' ? { ...g, n: g.n + 1, phase: { k: 'word', mult: 1, spun: g.phase.spun } } : g);

/** The stars for a picture spelt after `misses` nudges (2: after 答えはこれ). */
export const pictureStars = (misses: number): number => PICTURE_STARS[Math.min(misses, 2)];

/** A picture spelt: its stars. */
export function pictureDone(g: Game, misses: number): Game {
  if (g.phase.k !== 'picture') return g;
  const pic = PICTURES[g.phase.item];
  const players = copy(g), me = players[g.turn];
  const stars = pictureStars(misses);
  me.stars += stars;
  return next({ ...g, n: g.n + 1, players, made: [...g.made, { p: g.turn, kind: 'picture', text: pic.w, ja: pic.ja, stars }] });
}

/** The card's effect, then the turn on (or another spin). A move stops at the fork and plays no space. */
export function eventDone(g: Game): Game {
  if (g.phase.k !== 'event') return g;
  const c: Card = CARDS[g.phase.card];
  const players = copy(g);
  const me = players[g.turn];
  if (c.stars) me.stars += c.stars;
  if (c.gift) for (const [i, p] of players.entries()) {
    if (i === g.turn) continue;
    const n = Math.min(c.gift, p.stars);
    p.stars -= n;
    me.stars += n;
  }
  for (let k = 0; k < (c.move ?? 0); k++) {
    const n = stepFrom(me.pos, me.branch);
    if (n === null || n === GOAL) break;
    me.pos = n;
  }
  const out = { ...g, n: g.n + 1, players };
  return c.again ? { ...out, phase: { k: 'spin' } } : next(out);
}

/** After the home screen. */
export const homeDone = (g: Game): Game => (g.phase.k === 'home' ? next({ ...g, n: g.n + 1 }) : g);

/** The next seat on the way. The game ends with the round someone got home in (every seat the same number of turns;
 *  ながい: once everyone's home), after the length's last round, or once everyone's home. */
function next(g: Game): Game {
  const players = g.players.map((p) => ({ ...p }));
  const end = { ...g, players, phase: { k: 'end' } as const };
  if (players.every((p) => p.home !== null)) return end;
  let turn = g.turn, round = g.round;
  for (let i = 0; i < players.length * 2; i++) {
    turn = (turn + 1) % players.length;
    if (turn === 0) {
      if ((g.length !== 'long' && players.some((p) => p.home !== null)) || round >= ROUND_CAP[g.length](players.length)) return end;
      round++;
    }
    if (players[turn].home === null) break;
  }
  return { ...g, players, turn, round, phase: { k: 'spin' } };
}

/** Whether this round is the last (someone's home, or the rounds are up). */
export const lastRound = (g: Game): boolean =>
  (g.length !== 'long' && g.players.some((p) => p.home !== null)) || g.round >= ROUND_CAP[g.length](g.players.length);

/** End now (終了): whoever's on the way stays where they are. */
export const finish = (g: Game): Game => ({ ...g, phase: { k: 'end' } });

/** The ranking: most stars first (ties: nearer home, then home earlier). */
export function ranking(g: Game): number[] {
  return g.players.map((_, i) => i).sort((a, b) => {
    const A = g.players[a], B = g.players[b];
    return B.stars - A.stars || toGoal(A.pos, A.branch) - toGoal(B.pos, B.branch) || (A.home ?? 9) - (B.home ?? 9);
  });
}

/** Whether a saved value is a game this build can play (its shape, version and content). */
export function isGame(x: unknown): x is Game {
  const g = x as Game;
  return !!g && g.v === V && g.content === CONTENT && (g.length === 'short' || g.length === 'normal' || g.length === 'long') && Array.isArray(g.players) && g.players.length >= MIN_PLAYERS && typeof g.phase?.k === 'string'
    && Number.isInteger(g.turn) && g.turn >= 0 && g.turn < g.players.length && Array.isArray(g.bag) && Array.isArray(g.made) && Array.isArray(g.cards)
    && g.players.every((p) => (p.who === 'A' || p.who === 'B' || p.who === 'G') && Array.isArray(p.rack) && typeof p.pos === 'number' && p.pos >= 0
      && p.pos <= GOAL && p.level >= 1 && p.level <= 3)
    && (g.phase.k !== 'event' || !!CARDS[g.phase.card]) && (g.phase.k !== 'picture' || !!PICTURES[g.phase.item]);
}
