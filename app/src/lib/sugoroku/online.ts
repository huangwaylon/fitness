// 英語すごろく on several phones (docs/sugoroku.md "Online"): a game is its moves (contract/live-protocol.ts SgIntent),
// each phone folding them in order through the same pure rules (game.ts), so every phone shows the same game. A move
// counts only from whose turn it is (the start and 終了 from anyone at the table); one that changes nothing is a no-op.
// The words and lines must be in (an everyday word's bonus, a ぶん's line are the fold's too).
import type { SgIntent } from '#lib/contract/live-protocol.ts';
import type { Who } from '#lib/types.ts';
import { choose, eventDone, finish, homeDone, newGame, pictureDone, playWord, sentenceAsWord, sentenceDone, spin, swap, tried, type Game, type Length, type Level, type Seat } from './game.ts';
import { pickSentence, type Line } from './sentences.ts';
import type { Words } from './words.ts';

/** A move as kept: the wire's fields and who sent it. */
export type Move = Omit<SgIntent, 'kind'> & { who: Who };

const LENGTH: Record<'s' | 'n' | 'l', Length> = { s: 'short', n: 'normal', l: 'long' };
export const lengthCode = (l: Length): 's' | 'n' | 'l' => (l === 'short' ? 's' : l === 'long' ? 'l' : 'n');

/** A start's seats ("A2B1G3": who + level, in order). */
export const seatsOf = (s: string): { who: Who; level: Level }[] =>
  (s.match(/[ABG][123]/g) ?? []).map((x) => ({ who: x[0] as Who, level: Number(x[1]) as Level }));
export const seatsCode = (seats: readonly { who: Who; level: Level }[]): string => seats.map((x) => `${x.who}${x.level}`).join('');

/** The line a ぶん stone gives this seat (the same pick on every phone: its phase's `r`). */
function lineFor(g: Game, lines: readonly Line[]) {
  if (g.phase.k !== 'sentence') return null;
  const used = new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text));
  return pickSentence(lines, g.players[g.turn].level, g.phase.r, used);
}

/** One move on a game (null: the start's, to make one). */
export function applyMove(g: Game | null, m: Move, ctx: { words: Words; lines: readonly Line[]; name: (w: Who) => string }): Game | null {
  if (m.a === 'start') {
    if (g || !m.s) return g;
    const seats: Seat[] = seatsOf(m.s).map((x) => ({ who: x.who, villager: null, name: ctx.name(x.who), level: x.level, pair: null }));
    return newGame(seats, m.g, LENGTH[m.l ?? 'n']);
  }
  if (!g) return null;
  if (m.a === 'end') return g.players.some((p) => p.who === m.who) ? finish(g) : g;
  // everything else: only from whose turn it is
  if (g.players[g.turn].who !== m.who) return g;
  switch (m.a) {
    case 'roll': return spin(g, !!m.d);
    case 'fork': return choose(g, m.b ?? 0);
    case 'word': {
      const w = m.w ?? '';
      if (!ctx.words.has(w)) return g;
      const ja = ctx.words.ja(w);
      return playWord(g, w, { everyday: !!ja, ja, hinted: !!m.h, ticket: !!m.k });
    }
    case 'swap': return swap(g);
    case 'sent': {
      const line = lineFor(g, ctx.lines);
      return line ? sentenceDone(g, { misses: m.m ?? 0, unseen: !!m.u, text: line.en, ja: line.ja }) : sentenceAsWord(g);
    }
    case 'noline': return sentenceAsWord(g);
    case 'pic': return pictureDone(g, m.m ?? 0);
    case 'ev': return eventDone(g);
    case 'home': return homeDone(g);
    case 'try': return tried(g, { ...(m.m !== undefined ? { misses: m.m } : {}), ...(m.h ? { hinted: true } : {}), ...(m.p ? { peeked: true } : {}) });
  }
  return g;
}

/** A game from its moves, in order (moves before the start, or a gap, end the fold there). */
export function foldMoves(moves: readonly Move[], ctx: Parameters<typeof applyMove>[2]): Game | null {
  let g: Game | null = null;
  for (const [i, m] of moves.entries()) {
    if (m.i !== i) break;
    g = applyMove(g, m, ctx);
  }
  return g;
}

/** The moves with one more heard: in its place by `i` (a repeat dropped); the log only grows by the next one in order,
 *  later ones wait in `held` till the gap fills. */
export function heard(log: readonly Move[], held: readonly Move[], m: Move): { log: Move[]; held: Move[] } {
  if (m.i < log.length || held.some((x) => x.i === m.i)) return { log: [...log], held: [...held] };
  let next = [...log], wait = [...held, m].sort((a, b) => a.i - b.i);
  while (wait.length && wait[0].i === next.length) next = [...next, wait.shift()!];
  return { log: next, held: wait };
}
