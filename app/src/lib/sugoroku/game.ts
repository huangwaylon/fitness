// 英語すごろく's game (docs/sugoroku.md "Rules"): one phone passed round the table, a pure state the sheet saves after every
// step (localStorage: a game closed half-way resumes). Every random is seeded by the game's seed and its step counter
// (every step moves it on), so a saved game replays the same. No ベル, no record: the stars are the game's own.
import type { Who } from '#lib/types.ts';
import { fnv1a, seeded, weighted } from '#lib/random.ts';
import { CLASSIC, stepFrom, toGoal, type Board, type Ways } from './board.ts';
import { boardOf } from './layout.ts';
import { newBag, refill, scoreOf, without, type Score } from './tiles.ts';
import { CARDS, type Card } from './cards.ts';
import { PICTURES, PICTURE_STARS, TIERS, tierOf } from './pictures.ts';
import { isMiniId, type MiniId } from './mini/registry.ts';
import { QUIZ_STARS, isQuiz, keyOf } from './quiz.ts';
import { forcedHere, offer } from './mini/offer.ts';
import type { MiniState } from './mini/games.ts';

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
  /** The way taken at each fork passed (fork → its `next` index). */
  ways: Ways;
  /** Letters picked up on the way (a letter stone walked over), at most POCKET: tiles to add to any word. */
  pocket: string[];
  /** A letter another player sent: their next word must use it (FORCED_BONUS more if it does). */
  forced: string | null;
}
/** Something made in the game: a word or a sentence (the recap). */
interface Made {
  p: number;
  kind: 'word' | 'sentence' | 'picture';
  text: string;
  /** Its Japanese, when we have it. */
  ja: string;
  stars: number;
  /** Made in a mini-game (mini/). */
  mini?: MiniId;
}
/** A みんなで！ stone's mini-game picked (mini/turn.ts): its id and state, the seats present at the open (only they are
 *  dealt in), and, passed round, when it opened (this phone's clock: online it's the `mg`'s stamp, never the fold's). */
export type MiniOn = MiniState & { here: Who[]; at?: number };
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
  /** At a fork with `left` spaces still to walk: which way? */
  /** `card`: a card's move (its landing plays, an イベント there as ことば). */
  | { k: 'fork'; spun: number; left: number; card?: true }
  /** `rested`: an イベント reached by a card's move, played as ことば (no card chain). */
  | ({ k: 'word'; mult: number; spun: number; rested?: true } & Tries)
  /** `r`: the line's pick in [0, 1) among the seat's level's lines not used yet. */
  | ({ k: 'sentence'; spun: number; r: number } & Tries)
  /** `item`: PICTURES' index (none collected yet in this game). */
  | ({ k: 'picture'; item: number; spun: number; r: number } & Tries)
  /** (RULES '5': a quiz card's misses kept, quiz.ts) */
  | ({ k: 'event'; card: number; spun: number } & Pick<Tries, 'misses'>)
  /** A みんなで！ stone: the two mini-games the lander picks between, then the one picked (`on`). */
  | { k: 'mini'; spun: number; opts: readonly [MiniId, MiniId]; on?: MiniOn }
  | { k: 'home'; spun: number; place: number }
  | { k: 'end' };

/** The save's shape; CONTENT: the board's, cards' and pictures' build, hashed (a save from another reads as none:
 *  save.ts; the lines are picked afresh by the phase's `r`). */
const V = 7;
// (the structure only: a copy fix or a stone moved on the drawing never drops a game in play; a game's own board is its
// `layout`, versioned by layout.ts's key)
const CONTENT = fnv1a(JSON.stringify([CLASSIC.spaces.map((b) => [b.kind, b.next]), CARDS.map(({ en: _e, ja: _j, who: _w, kw: _k, pos: _p, qen: _qe, qja: _qj, ...fx }) => fx), PICTURES.map((p) => p.w)])).toString(36);

export interface Game {
  v: typeof V;
  content: string;
  seed: string;
  /** The board's layout key (layout.ts boardOf); none: the classic board (a game from before layouts). */
  layout?: string;
  /** The rules it started on (wire.ts RULES: the mini-games' deal goes by them); none: a game from before '3'. */
  rules?: string;
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
  /** The letter stones still holding a letter: stone → its letter (picked up by whoever walks over it first). */
  letters: Record<number, string>;
  /** The みんなで！ stones played (each then a ことば for the rest of the game), their mini-games and stars; none yet:
   *  absent (a board without them, a game from before them). */
  minis?: { stone: number; id: MiniId; stars: Partial<Record<Who, number>> }[];
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 3;
/** The last round, by seats (the round someone gets home in ends it earlier: about 11). */
export const MAX_ROUNDS: Readonly<Record<number, number>> = { 2: 16, 3: 14, 4: 12 };
/** The team's goal: stars a seat by the length (about two-thirds of what a game of best words makes: reachable,
 *  not given). */
const GOAL_PER_SEAT: Record<Length, number> = { short: 45, normal: 60, long: 65 };
export const teamGoal = (g: Game): number => g.players.length * GOAL_PER_SEAT[g.length];
export const teamStars = (g: Game): number => g.players.reduce((n, p) => n + p.stars, 0);

/** かいがら for playing (store/actions.ts rewardGame: everyone at the table the same, a game once): a game played (someone
 *  home, or 3 rounds) pays REWARD, the team's goal reached REWARD_GOAL more. */
export const REWARD = 500;
export const REWARD_GOAL = 250;
export const rewardOf = (g: Game): number =>
  g.players.some((p) => p.home !== null) || g.round >= 3 ? REWARD + (teamStars(g) >= teamGoal(g) ? REWARD_GOAL : 0) : 0;

/** あがり: everyone the same (a team game: the order home never matters). */
export const HOME_BONUS = 4;
/** A line in order: first try, after a nudge, after 答えはこれ; むずかしい's without its Japanese +2. */
const SENTENCE_STARS = [6, 4, 2];
export const UNSEEN_BONUS = 2;
/** Letters a pocket holds; letter stones a game has; a sent letter used: its bonus. */
export const POCKET = 3;
const LETTER_STONES = 10;
export const FORCED_BONUS = 3;
/** The letters the stones hold: the ones that score (2–5 points), a rare one now and then. */
const STONE_LETTERS: readonly (readonly [string, number])[] = [['b', 3], ['c', 3], ['d', 3], ['g', 3], ['h', 3], ['m', 3], ['p', 3], ['f', 2], ['w', 2], ['y', 2], ['v', 1], ['k', 2], ['j', 1], ['x', 1], ['z', 1]];
/** The lucky letters come from the common consonants (a rare one was often in no rack: a dead bonus). */
const LUCKY_FROM = [...'dghlmnprst'];

const rnd = (g: Game) => seeded(`${g.seed}:${g.n}`);
/** The game's board. */
export const boardFor = (g: Pick<Game, 'layout'>): Board => boardOf(g.layout) ?? CLASSIC;
const copy = (g: Game) => g.players.map((p) => ({ ...p }));

/** A new game; `layout` its board's key (layout.ts layoutKey; none: the classic board), `rules` wire.ts's. */
export function newGame(seats: readonly Seat[], seed: string, length: Length = 'normal', layout?: string, rules?: string): Game {
  const r = seeded(seed), board = boardOf(layout) ?? CLASSIC;
  let bag = newBag(r);
  const players = seats.map((s) => {
    const f = refill([], bag, r);
    bag = f.bag;
    return { ...s, pos: 0, stars: 0, rack: f.rack, home: null, ways: {}, pocket: [], forced: null };
  });
  // the letter stones: LETTER_STONES of the ことば stones, each a letter
  const words = board.spaces.map((b, i) => ({ b, i })).filter(({ b }) => (b.kind === 'word' || b.kind === 'double') && !b.mini).map(({ i }) => i);
  const letters: Record<number, string> = {};
  for (let k = 0; k < LETTER_STONES && words.length; k++) {
    const i = words.splice(Math.floor(r() * words.length), 1)[0];
    letters[i] = weighted(STONE_LETTERS, r);
  }
  const a = LUCKY_FROM[Math.floor(r() * LUCKY_FROM.length)];
  const rest = LUCKY_FROM.filter((l) => l !== a);
  const lucky = [a, rest[Math.floor(r() * rest.length)]];
  return { v: V, content: CONTENT, seed, ...(layout ? { layout } : {}), ...(rules ? { rules } : {}), length, n: 0, turn: 0, round: 1, players, bag, lucky, phase: { k: 'spin' }, made: [], cards: [], letters };
}

/** How far ahead on the route a lead counts as too far (steps to あがり). */
const GAP = 6;
/** This turn's dice, keeping the table together on the route: `fast` (two dice, the higher) for the one well behind
 *  (GAP+ steps behind whoever's furthest on), `slow` (two dice, the lower) for the one well ahead (GAP+ steps ahead of
 *  whoever's furthest back), else one die. */
export function rollMode(g: Game): 'fast' | 'slow' | 'even' {
  const me = g.players[g.turn], others = g.players.filter((_, i) => i !== g.turn && g.players[i].home === null);
  if (!others.length) return 'even';
  const b = boardFor(g), left = (p: Player) => toGoal(b, p.pos, p.ways);
  const mine = left(me);
  if (mine - Math.min(...others.map(left)) >= GAP) return 'fast';
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

/** At a fork: take its way 0 or 1 and walk on. */
export function choose(g: Game, way: 0 | 1): Game {
  if (g.phase.k !== 'fork') return g;
  const players = copy(g), me = players[g.turn];
  me.ways = { ...me.ways, [me.pos]: way };
  return walk({ ...g, n: g.n + 1, players }, g.phase.spun, g.phase.left, rnd(g), !!g.phase.card);
}

/** Walk `left` spaces (the players already copied), then land. `card`: a card's move (an イベント landed on plays as ことば). */
function walk(g: Game, spun: number, left: number, r: () => number, card = false): Game {
  const me = g.players[g.turn], b = boardFor(g);
  g = { ...g };
  for (; left > 0; left--) {
    const n = stepFrom(b, me.pos, me.ways);
    if (n === null) {
      if (me.pos === b.goal) break;
      return { ...g, phase: { k: 'fork', spun, left, ...(card ? { card: true as const } : {}) } };
    }
    me.pos = n;
    // a letter stone walked over (or landed on): its letter to my pocket, while there's room
    const l = g.letters[n];
    if (l && me.pocket.length < POCKET) {
      me.pocket = [...me.pocket, l];
      const { [n]: _gone, ...rest } = g.letters;
      g = { ...g, letters: rest };
    }
    if (n === b.goal) break;
  }
  return land(g, spun, r, card);
}

function land(g: Game, spun: number, r: () => number, card = false): Game {
  const me = g.players[g.turn];
  const sp = boardFor(g).spaces[me.pos], kind = sp.kind;
  // a card's move ending on an イベント: no second card, a ことば instead
  if (card && kind === 'event') return { ...g, phase: { k: 'word', mult: 1, spun, rested: true } };
  // a みんなで！ not played yet: the lander picks a mini-game (played: its ことば); a test's forced one anywhere
  if ((sp.mini && !g.minis?.some((m) => m.stone === me.pos)) || forcedHere(g.minis)) return { ...g, phase: { k: 'mini', spun, opts: offer((g.minis ?? []).map((m) => m.id), r, g.rules) } };
  if (kind === 'goal') {
    const place = g.players.filter((p) => p.home !== null).length;
    me.home = place;
    me.stars += HOME_BONUS;
    return { ...g, phase: { k: 'home', spun, place } };
  }
  if (kind === 'sentence') return { ...g, phase: { k: 'sentence', spun, r: r() } };
  if (kind === 'picture') {
    // (each picture once a game)
    const taken = new Set(g.made.filter((m) => m.kind === 'picture').map((m) => m.text));
    const left = PICTURES.map((_, i) => i).filter((i) => !taken.has(PICTURES[i].w));
    // its tier by the seat's level (pictures.ts TIERS), a tier with none left: any
    const tier = weighted(TIERS[me.level], r);
    const pool = left.filter((i) => tierOf(PICTURES[i]) === tier);
    const from = pool.length ? pool : left;
    if (from.length) return { ...g, phase: { k: 'picture', item: from[Math.floor(r() * from.length)], spun, r: r() } };
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
  if (ph.k === 'event') return isQuiz(g.rules, ph.card) && t.misses !== undefined ? { ...g, phase: { ...ph, misses: t.misses } } : g;
  return ph.k === 'word' || ph.k === 'sentence' || ph.k === 'picture' ? { ...g, phase: { ...ph, ...t } } : g;
}

/** A word's points here for this seat, or null if it can't be spelt from the rack or is under the seat's length. */
export function wordScore(g: Game, word: string, everyday: boolean, hinted = false): Score | null {
  const me = g.players[g.turn], lv = LEVEL[me.level];
  if (g.phase.k !== 'word' || word.length < lv.minLen) return null;
  const use = tilesFor(me, word);
  if (!use) return null;
  const sc = scoreOf(word, { lucky: g.lucky, mult: g.phase.mult, everyday: everyday ? lv.everyday : 0, half: hinted && lv.hintHalf });
  return use.forced ? { ...sc, forced: FORCED_BONUS, total: sc.total + FORCED_BONUS } : sc;
}

/** The tiles a word takes from a player: the sent letter first (it must be in the word), then the rack, then the
 *  pocket; null if the word can't be made so (or leaves the sent letter out). */
export function tilesFor(p: Pick<Player, 'rack' | 'pocket' | 'forced'>, word: string): { rack: string[]; pocket: string[]; forced: boolean } | null {
  let rest = word;
  if (p.forced) {
    if (!rest.includes(p.forced)) return null;
    rest = rest.replace(p.forced, '');
  }
  const rack = [...p.rack], pocket = [...p.pocket], fromRack: string[] = [], fromPocket: string[] = [];
  for (const l of rest) {
    const i = rack.indexOf(l);
    if (i >= 0) (rack.splice(i, 1), fromRack.push(l));
    else {
      const j = pocket.indexOf(l);
      if (j < 0) return null;
      pocket.splice(j, 1);
      fromPocket.push(l);
    }
  }
  return { rack: fromRack, pocket: fromPocket, forced: !!p.forced };
}

/** Send a pocket letter to another player (at the start of my turn): their next word must use it. One at a time a
 *  player: none to someone who already has one. */
export function giveLetter(g: Game, letter: string, to: Who): Game {
  if (g.phase.k !== 'spin') return g;
  const players = copy(g), me = players[g.turn], k = players.findIndex((p) => p.who === to);
  if (k < 0 || k === g.turn || players[k].forced || players[k].home !== null || !me.pocket.includes(letter)) return g;
  const i = me.pocket.indexOf(letter);
  me.pocket = [...me.pocket.slice(0, i), ...me.pocket.slice(i + 1)];
  players[k] = { ...players[k], forced: letter };
  return { ...g, n: g.n + 1, players };
}

/** Play a word (the caller checked it's a word): its stars, the rack refilled, the turn on. */
export function playWord(g: Game, word: string, info: { everyday: boolean; ja: string; hinted: boolean }): Game {
  const sc = wordScore(g, word, info.everyday, info.hinted);
  if (!sc) return g;
  const r = rnd(g);
  const players = copy(g);
  const me = players[g.turn];
  me.stars += sc.total;
  const use = tilesFor(me, word)!;
  let pocket = [...me.pocket];
  for (const l of use.pocket) pocket.splice(pocket.indexOf(l), 1);
  me.pocket = pocket;
  me.forced = null;
  const f = refill(without(me.rack, use.rack.join('')), g.bag, r);
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
  // (a sent letter goes with the swap: never a penalty)
  me.forced = null;
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

/** The speaking step after a 絵 (docs/sugoroku.md "Speaking"): off until the real-phone checks pass; `?speak=1` turns it
 *  on for a page (the tests, a trial). Off, the game is as it was. */
const SPEAK = false;
export const speakOn = (search: string): boolean => SPEAK || new URLSearchParams(search).get('speak') === '1';

/** The most a spoken sentence about the picture adds (on-task +2, said again after a tip +1: speak.ts). */
const SAID_MAX = 3;

/** A picture spelt: its stars, and `said` more for a sentence spoken about it (the speaking step, at most SAID_MAX). */
export function pictureDone(g: Game, misses: number, said = 0): Game {
  if (g.phase.k !== 'picture') return g;
  const pic = PICTURES[g.phase.item];
  const players = copy(g), me = players[g.turn];
  const stars = pictureStars(misses) + Math.max(0, Math.min(Math.floor(said) || 0, SAID_MAX));
  me.stars += stars;
  return next({ ...g, n: g.n + 1, players, made: [...g.made, { p: g.turn, kind: 'picture', text: pic.w, ja: pic.ja, stars }] });
}

/** The card's effect, then the turn on (or another spin); a move walks on and plays the stone it lands on. RULES '5':
 *  a quiz card (quiz.ts) its stars by the `misses` (2: after 答えはこれ) instead, its key word kept, no gift. */
export function eventDone(g: Game, misses = 0): Game {
  if (g.phase.k !== 'event') return g;
  const c: Card = CARDS[g.phase.card];
  const players = copy(g);
  const me = players[g.turn];
  if (isQuiz(g.rules, g.phase.card)) {
    const stars = QUIZ_STARS[Math.max(0, Math.min(Math.floor(misses) || 0, 2))];
    me.stars += stars;
    return next({ ...g, n: g.n + 1, players, made: [...g.made, { p: g.turn, kind: 'word', text: keyOf(c).toLowerCase(), ja: c.kw!, stars }] });
  }
  if (c.stars) me.stars += c.stars;
  if (c.gift) for (const [i, p] of players.entries()) {
    if (i === g.turn) continue;
    const n = Math.min(c.gift, p.stars);
    p.stars -= n;
    me.stars += n;
  }
  const out = { ...g, n: g.n + 1, players };
  // a move: walked like a roll (letters picked up, the fork asks), and the stone it lands on is played: same turn
  if (c.move) return walk(out, c.move, c.move, rnd(g), true);
  return c.again ? { ...out, phase: { k: 'spin' } } : next(out);
}

/** After the home screen. */
export const homeDone = (g: Game): Game => (g.phase.k === 'home' ? next({ ...g, n: g.n + 1 }) : g);

/** The next seat on the way. The game ends with the round someone got home in (every seat the same number of turns;
 *  ながい: once everyone's home), after the length's last round, or once everyone's home. */
export function next(g: Game): Game {
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

/** Whether a saved value is a game this build can play (its shape, version and content). */
export function isGame(x: unknown): x is Game {
  const g = x as Game;
  const b = !!g && (g.layout === undefined || typeof g.layout === 'string') ? boardOf(g.layout) : null;
  return !!b && g.v === V && g.content === CONTENT && (g.rules === undefined || typeof g.rules === 'string') && (g.length === 'short' || g.length === 'normal' || g.length === 'long') && Array.isArray(g.players) && g.players.length >= MIN_PLAYERS && typeof g.phase?.k === 'string'
    && Number.isInteger(g.turn) && g.turn >= 0 && g.turn < g.players.length && Array.isArray(g.bag) && Array.isArray(g.made) && Array.isArray(g.cards) && typeof g.letters === 'object' && !!g.letters
    && g.players.every((p) => (p.who === 'A' || p.who === 'B' || p.who === 'G') && Array.isArray(p.rack) && Array.isArray(p.pocket) && typeof p.pos === 'number' && p.pos >= 0
      && p.pos <= b.goal && p.level >= 1 && p.level <= 3 && !!p.ways && typeof p.ways === 'object' && Object.keys(p.ways).every((f) => b.forks.includes(Number(f))))
    && (g.phase.k !== 'event' || !!CARDS[g.phase.card]) && (g.phase.k !== 'picture' || !!PICTURES[g.phase.item])
    && (g.minis === undefined || (Array.isArray(g.minis) && g.minis.every((m) => isMiniId(m?.id))))
    && (g.phase.k !== 'mini' || (Array.isArray(g.phase.opts) && g.phase.opts.length === 2 && g.phase.opts.every(isMiniId)
      && (!g.phase.on || (g.phase.opts.includes(g.phase.on.id) && Array.isArray(g.phase.on.here) && !!g.phase.on.s && typeof g.phase.on.s === 'object'))));
}

/** A saved game this build can play, or null; a save from before layouts (the classic board, one fork's `branch`)
 *  read as the ways it took; one from before mini-games (v6: no `minis`, no `mini` phase) as this shape's. */
export function revive(x: unknown): Game | null {
  type Old = Omit<Player, 'ways'> & { ways?: Ways; branch?: number | null };
  const g = (x && typeof x === 'object' && (x as { v?: unknown }).v === 6 ? { ...x, v: V } : x) as Omit<Game, 'players'> & { players?: Old[] };
  if (g && typeof g === 'object' && !g.layout && Array.isArray(g.players))
    g.players = g.players.map(({ branch, ...p }) => (p.ways ? p : { ...p, ways: branch === 0 || branch === 1 ? { [CLASSIC.forks[0]]: branch } : {} }));
  return isGame(g) ? g : null;
}
