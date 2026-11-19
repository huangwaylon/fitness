// 英語すごろく on several phones (docs/sugoroku.md "Online"): a game is its moves (contract/live-protocol.ts SgIntent),
// each phone folding them in order through the same pure rules (game.ts), so every phone shows the same game. A move
// counts only from whose turn it is (the start and 終了 from anyone at the table); one that changes nothing is a no-op.
// The words, lines and mini-games' content (mini/data.ts) must be in (an everyday word's bonus, a ぶん's line are the fold's too). How the moves are kept
// and heard (the races) is wire.ts's.
import type { Who } from '#lib/types.ts';
import { choose, eventDone, giveLetter, finish, homeDone, newGame, pictureDone, playWord, sentenceAsWord, sentenceDone, spin, swap, tried, type Game, type Length, type Seat } from './game.ts';
import { pickSentence, type Line } from './sentences.ts';
import type { Words } from './words.ts';
import type { MiniData } from './mini/data.ts';
import { layoutKey } from './family.ts';
import { ID_LEN, genOfRules, playsRules, seatsOf, type Move } from './wire.ts';
import { closeMini, openMini, playMini } from './mini/turn.ts';

export { seatsCode, type Move } from './wire.ts';

const LENGTH: Record<'s' | 'n' | 'l', Length> = { s: 'short', n: 'normal', l: 'long' };
export const lengthCode = (l: Length): 's' | 'n' | 'l' => (l === 'short' ? 's' : l === 'long' ? 'l' : 'n');

/** An online game's board: its id is the layout seed, built by its rules' generator (wire.ts genOfRules); an id from
 *  before layouts (6–8 letters) plays the classic. */
const layoutOfId = (g: string, r?: string): string | undefined => (g.length >= ID_LEN ? layoutKey(g, genOfRules(r)) : undefined);

/** The line a ぶん stone gives this seat (the same pick on every phone: its phase's `r`). */
function lineFor(g: Game, lines: readonly Line[]) {
  if (g.phase.k !== 'sentence') return null;
  const used = new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text));
  return pickSentence(lines, g.players[g.turn].level, g.phase.r, used);
}

/** One move on a game (null: the start's, to make one). */
export function applyMove(g: Game | null, m: Move, ctx: { words: Words; lines: readonly Line[]; mini: MiniData; name: (w: Who) => string }): Game | null {
  if (m.a === 'start') {
    // (a start on another build's rules: nothing here, wire.ts otherRules)
    if (g || !m.s || !playsRules(m.r)) return g;
    const seats: Seat[] = seatsOf(m.s).map((x) => ({ who: x.who, name: ctx.name(x.who), level: x.level }));
    return newGame(seats, m.g, LENGTH[m.l ?? 'n'], layoutOfId(m.g, m.r), m.r);
  }
  if (!g) return null;
  if (m.a === 'end') return g.players.some((p) => p.who === m.who) ? finish(g) : g;
  // a mini-game's plays and close: from anyone at the table (mini/turn.ts: a seat not dealt in, nothing)
  if (m.a === 'mp' || m.a === 'mc') {
    if (!g.players.some((p) => p.who === m.who)) return g;
    return m.a === 'mc' ? closeMini(g) : playMini(g, m.who, { ...(m.w !== undefined ? { w: m.w } : {}), ...(m.k !== undefined ? { k: m.k } : {}), ...(m.n !== undefined ? { n: m.n } : {}), ...(m.y ? { y: 1 as const } : {}), ...(m.op !== undefined ? { op: m.op } : {}) }, ctx);
  }
  // everything else: only from whose turn it is
  if (g.players[g.turn].who !== m.who) return g;
  switch (m.a) {
    case 'roll': return spin(g);
    case 'fork': return choose(g, m.b ?? 0);
    case 'word': {
      const w = m.w ?? '';
      if (!ctx.words.has(w)) return g;
      const ja = ctx.words.ja(w);
      return playWord(g, w, { everyday: !!ja, ja, hinted: !!m.h });
    }
    case 'swap': return swap(g);
    case 'gift': return m.ch && m.to ? giveLetter(g, m.ch, m.to) : g;
    case 'sent': {
      const line = lineFor(g, ctx.lines);
      return line ? sentenceDone(g, { misses: m.m ?? 0, unseen: !!m.u, text: line.en, ja: line.ja }) : sentenceAsWord(g);
    }
    case 'noline': return sentenceAsWord(g);
    case 'pic': return pictureDone(g, m.m ?? 0, m.y ?? 0);
    case 'ev': return eventDone(g);
    case 'home': return homeDone(g);
    case 'mg': return openMini(g, m.b ?? 0, m.s ? (m.s.match(/[ABG]/g) as Who[]) : null, ctx);
    case 'try': return tried(g, { ...(m.m !== undefined ? { misses: m.m } : {}), ...(m.h ? { hinted: true } : {}), ...(m.p ? { peeked: true } : {}) });
  }
  return g;
}

type Ctx = Parameters<typeof applyMove>[2];
/** A game from its moves, in order (moves before the start, or a gap, end the fold there; an end is the last: wire.ts
 *  heard). */
export const foldMoves = (moves: readonly Move[], ctx: Ctx): Game | null => folder()(moves, ctx);

/** foldMoves kept up: a log that only grew since the last call (its moves before the same objects, the same words,
 *  lines and seats' names) folds just its new moves; anything else (a move taken back, another game) folds again from
 *  the start. Games are immutable, so the one kept is safe to hand out. */
export function folder(): (moves: readonly Move[], ctx: Ctx) => Game | null {
  let done: Move[] = [], g: Game | null = null, key: unknown[] = [];
  return (moves, ctx) => {
    const k = [ctx.words, ctx.lines, ctx.mini, moves[0], ...seatsOf(moves[0]?.s ?? '').map((x) => ctx.name(x.who))];
    const grew = k.length === key.length && k.every((x, i) => x === key[i]) && done.length <= moves.length && done.every((m, i) => m === moves[i]);
    if (!grew) (done = []), (g = null), (key = k);
    for (let i = done.length; i < moves.length && moves[i].i === i; i++) (g = applyMove(g, moves[i], ctx)), done.push(moves[i]);
    return g;
  };
}
