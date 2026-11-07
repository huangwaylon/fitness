// What the listening games' pages share (ことば タイル, たちぎき, ようじ でんわ: games/listened.ts): whether it's co-op,
// my role, whether I'm on easy, an empty answer.
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { EMPTY, listenOpts, tierAt } from '#lib/kikimimi/games/listened.ts';

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
