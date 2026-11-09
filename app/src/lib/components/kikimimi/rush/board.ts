// すうじ ラッシュ's round on this phone (RushPlay, RushResults): a player's ticket at their tier, whose register a
// customer is, what each player picked as authored, the customers served (mine, and the others' as each reveal showed
// them) and the combo. Over games/rush/def.ts. Its pages' strings come in with it (i18n/kiki-rush.ts: kikimimi/ may not
// import i18n).
import '#lib/i18n/kiki-rush.ts';
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { listenOpts } from '#lib/kikimimi/games/listened.ts';
import { questionPoints } from '#lib/kikimimi/games/taikai/def.ts';
import { PASS, bestCombo, comboAt, registerOf, rushRounds, type RushCard, type RushRound } from '#lib/kikimimi/games/rush/def.ts';
import { isCoop, revealMemo } from '../listenView.ts';

type V = Pick<QuizView, 'o' | 'tiers'>;

/** A player's ear (theirs heard, else the game's: mine as I play it) and the deck's level. */
const earOf = (v: V, who?: Who): { lv: number; ear: number } => {
  const o = listenOpts.decode(v.o);
  return { lv: o?.lv ?? 3, ear: who ? (v.tiers[who] ?? o?.ear ?? 1) : (o?.ear ?? 1) };
};

/** A player's round of a card at their tier (the clip's length isn't read here). */
export function roundFor(v: V, c: RushCard, who?: Who): RushRound {
  const e = earOf(v, who);
  return rushRounds([c], { lv: e.lv as 3, ear: e.ear }, () => 0)[0];
}

/** A right ticket's points for me (against my ear's expectation). */
export const ptsFor = (v: V, c: RushCard): number => questionPoints(earOf(v).ear, c.rush.b);

/** Whether customer i comes to my register (solo and しょうぶ: every one). */
export function myTurn(v: Pick<QuizView, 'players' | 'vs' | 'roles'>, me: Who, i: number): boolean {
  return !isCoop(v) || (v.roles[me] ?? 0) === registerOf(i);
}

/** A pick (a chip of the picker's tier) as the authored chip, or null (none, a pass). */
export function authoredPick(v: V, c: RushCard, k: number | undefined | null, who?: Who): number | null {
  if (k === undefined || k === null || k === PASS) return null;
  return roundFor(v, c, who).map[k] ?? null;
}

/** The others' picks heard at each reveal (a later round no longer shows them), by game and round. */
const HEARD = revealMemo<{ who: Who; k: number; ok: boolean }[]>();
export function hear(v: Pick<QuizView, 'g' | 'i' | 'phase' | 'players'>, me: Who): void {
  if (v.phase !== 'reveal' || !v.g) return;
  HEARD.keep(v.g, v.i, picks(v, me));
}
const picks = (v: Pick<QuizView, 'players'>, me: Who) => v.players.flatMap((p) => (p.who !== me && p.pick && p.pick.k !== PASS ? [{ who: p.who, k: p.pick.k, ok: p.pick.ok }] : []));
/** The others' picks of round i (this reveal's, or as heard at its own; null: never seen here). */
export function othersAt(v: Pick<QuizView, 'g' | 'i' | 'phase' | 'players'>, me: Who, i: number): { who: Who; k: number; ok: boolean }[] | null {
  if (i === v.i && v.phase === 'reveal') return picks(v, me);
  return HEARD.at(v.g, i);
}

type ServedView = Pick<QuizView, 'g' | 'i' | 'phase' | 'players' | 'vs' | 'roles' | 'answers' | 'o' | 'tiers'>;

/** Customer i served on the first listen (the combo's): mine right with no replay, co-op the register's right; null
 *  while it's to come (or a partner's I never saw). */
export function servedAt(v: ServedView, cards: readonly RushCard[], me: Who, i: number): boolean | null {
  const c = cards[i];
  const done = v.phase === 'results' || i < v.i || (i === v.i && v.phase === 'reveal');
  if (!c || !done) return null;
  if (myTurn(v, me, i)) {
    const a = v.answers[i];
    return !!a && a.k !== PASS && a.k === roundFor(v, c).answer && !a.rp;
  }
  return othersAt(v, me, i)?.some((o) => o.ok) ?? null;
}

/** The combo now (at round i, its reveal counted) and the game's best. */
export const comboNow = (v: ServedView, cards: readonly RushCard[], me: Who): number => comboAt(Math.min(v.i, cards.length - 1), (i) => servedAt(v, cards, me, i));
export const comboBest = (v: ServedView, cards: readonly RushCard[], me: Who): number => bestCombo(cards.length, (i) => servedAt(v, cards, me, i));
