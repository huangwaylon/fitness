// What the listening games' pages share (ことば タイル, たちぎき, ようじ でんわ: games/listened.ts): whether it's co-op,
// my role, whether I'm on easy, an empty answer, もういっかい, what was seen at each round's reveal.
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import type { GameId } from '#lib/kikimimi/round/types.ts';
import type { QuizGame } from './game.svelte.ts';
import { EMPTY, listenOpts, tierAt } from '#lib/kikimimi/games/listened.ts';

/** The results' しずえ line's key for `made` of `n` (`prefix`.all / .some, half or more / .few). */
export const hostLine = (prefix: string, made: number, n: number): string => `${prefix}.${n && made >= n ? 'all' : made * 2 >= n ? 'some' : 'few'}`;

/** Co-op: several players, not たいせん (the listening games have none). */
export const isCoop = (v: Pick<QuizView, 'players' | 'vs'>): boolean => v.players.length > 1 && !v.vs;

/** My role (co-op), else null. */
export const roleOf = (v: Pick<QuizView, 'players' | 'vs' | 'roles'>, me: Who): number | null => (isCoop(v) ? (v.roles[me] ?? 0) : null);

/** Whether I'm on easy (my ear below the deck's place). */
export function easy(v: Pick<QuizView, 'o'>): boolean {
  const o = listenOpts.decode(v.o);
  return !!o && tierAt(o.ear, o.lv) === 'easy';
}

/** An empty answer (every slot or row EMPTY). */
export const blank = (n: number): number[] => Array.from({ length: n }, () => EMPTY);

/** もういっかい: a new deal of this game at its place (the host's; solo it starts at once; another back to the invite). */
export function playAgain(game: Pick<QuizGame, 'view' | 'setGame' | 'go'>, gm: GameId, onagain: () => void): void {
  const v = game.view, host = v.amHost, solo = v.local, lv = v.lv, timer = v.timer;
  onagain();
  if (!host) return;
  game.setGame(gm, { lv, timer });
  if (solo) game.go();
}

/** What this phone saw of each round of the current game (a reveal's others' picks, a turn's ✓): kept by round, let go
 *  when another game's is kept. */
export function revealMemo<T>(): { keep(g: string, i: number, x: T): void; at(g: string | null | undefined, i: number): T | null } {
  const by = new Map<number, T>();
  let game = '';
  return {
    keep(g, i, x) {
      if (g !== game) by.clear();
      game = g;
      by.set(i, x);
    },
    at: (g, i) => (g === game ? (by.get(i) ?? null) : null)
  };
}
