// A round game's tallies (docs/kikimimi.md "Co-op and たいせん"): each player's points, the team's tally, the team's
// first listens, who had which round. Pure, from what every phone hears alike (the `join`s and `a`s), so the same on
// every phone (a lost `a` costs that round's credit on that phone only). Never who missed.
import type { Who } from '../../contract/live-protocol.ts';
import { schedule, times } from './schedule.ts';
import type { Game, RoundWindows } from './types.ts';

/** A multiplayer game's team result (co-op, the default), over the rounds revealed so far: `right` those at least one
 *  player got right (the team covers it: 「ふたりで n/8」; a player who left still counts for the ones they answered),
 *  `all` those every player who had the round got right (「そろって せいかい」), `done` the rounds counted. */
export interface Team {
  right: number;
  all: number;
  done: number;
}

/** Whether a player's answer to round i is right. */
export function rightOf(gm: Pick<Game, 'answers' | 'deckFor'>, w: Who, i: number): boolean {
  const a = gm.answers.get(w)?.get(i);
  return !!a && gm.deckFor(w).grade(i, a.a, a.rp).ok;
}

/** A player's points counted here: each answer's grade (100 a right one in the quiz: いっぱつ is a badge, no points), or
 *  the deck's own way (スピード はしご's climb, where a replay is the replayer's own). */
export function sum(gm: Pick<Game, 'answers' | 'deckFor'>, w: Who): number {
  const mine = gm.answers.get(w) ?? new Map();
  const deck = gm.deckFor(w);
  if (deck.score) return deck.score(mine);
  let s = 0;
  for (const [i, a] of mine) s += deck.grade(i, a.a, a.rp).pts;
  return s;
}

/** Whether a player had round i, from what every phone hears alike: they answered it, or they're in the game and were
 *  when its clip began (their `join` heard before it; me too, whatever I sat out: the others can't know). A player who
 *  joined later doesn't hold back the ones before; one who left, the ones they didn't answer. */
function hadRound(gm: Game, w: Who, i: number, win: RoundWindows): boolean {
  if (gm.answers.get(w)?.has(i)) return true;
  return gm.joined.has(w) && times(gm, i, schedule(gm, win)).playAt >= (gm.since.get(w) ?? Infinity);
}

/** The team's tally over rounds 0 … upto − 1, over everyone who has played (a player who left too): right by at least
 *  one player, right by every player who had it. */
export function team(gm: Game, upto: number, win: RoundWindows): Team {
  const t: Team = { right: 0, all: 0, done: 0 };
  const who = [...gm.played];
  for (let i = 0; i < Math.min(upto, gm.n); i++) {
    const oks = who.map((w) => rightOf(gm, w, i));
    t.done++;
    if (!oks.some(Boolean)) continue;
    t.right++;
    if (who.every((w, n) => oks[n] || !hadRound(gm, w, i, win))) t.all++;
  }
  return t;
}

/** The rounds 0 … upto − 1 someone who has played got right on the first listen (no replay): a co-op lesson's `tm`
 *  (docs/curriculum-units.md §10, contract/listen.ts), the same on every phone. */
export function teamFirst(gm: Pick<Game, 'answers' | 'deckFor' | 'played' | 'n'>, upto: number): number {
  const first = (w: Who, i: number) => rightOf(gm, w, i) && !gm.answers.get(w)!.get(i)!.rp;
  let n = 0;
  for (let i = 0; i < Math.min(upto, gm.n); i++) if ([...gm.played].some((w) => first(w, i))) n++;
  return n;
}
