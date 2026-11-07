// たちぎき's round on this phone (TachiPlay, TachiResults): my role and the faces I place, my tier, a round's grading
// view, one line of a conversation as a clip of its own. Over games/tachi/def.ts. Its pages' strings come in with it
// (i18n/kiki-tachi.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-tachi.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import type { Who } from '#lib/types.ts';
import { EMPTY, SHARED, givenClaim, rawOf, tachiOk, tachiOpts, type TachiCard } from '#lib/kikimimi/games/tachi/def.ts';
import { tierAt } from '#lib/kikimimi/games/tile/def.ts';

/** Co-op: several players, not たいせん (たちぎき has none). */
export const isCoop = (v: Pick<QuizView, 'players' | 'vs'>): boolean => v.players.length > 1 && !v.vs;

/** My role (co-op), else null. */
export const roleOf = (v: Pick<QuizView, 'players' | 'vs' | 'roles'>, me: Who): number | null => (isCoop(v) ? (v.roles[me] ?? 0) : null);

/** A speaker's part for me in co-op: the one I follow, the shared one, my partner's (solo: none). */
export const partOf = (role: number | null, face: number): 'mine' | 'shared' | 'theirs' | null =>
  role === null ? null : face === SHARED ? 'shared' : face === role % 2 ? 'mine' : 'theirs';

/** Whether I'm on easy (the third speaker's claim placed for me). */
export function easy(v: Pick<QuizView, 'o'>): boolean {
  const o = tachiOpts.decode(v.o);
  return !!o && tierAt(o.ear, o.lv) === 'easy';
}

/** An opinions round's answer before any tap: none placed but, on easy, the third speaker's claim. */
export function fresh(c: TachiCard, given: boolean): number[] {
  const a = [EMPTY, EMPTY, EMPTY];
  if (given) a[givenClaim(c.tachi.answer as readonly number[])] = SHARED;
  return a;
}

/** Whether an answer (as the view keeps it) is right for a card. */
export const okFor = (c: TachiCard, x: { k: number; a?: readonly number[] | number } | null | undefined): boolean => {
  const a = rawOf(x);
  return a !== null && tachiOk({ type: c.tachi.type, answer: c.tachi.answer }, a);
};

/** Line k of a conversation as a clip of its own (a one-line replay: its bed under it too). */
export const lineItem = (c: TachiCard, k: number): Item => {
  const l = c.lines[k];
  return { ...c, id: `${c.id}-${k + 1}`, lines: undefined, en: l.en, ja: l.ja, speaker: l.who };
};
