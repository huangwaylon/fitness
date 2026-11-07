// ことば タイル's round on this phone (TilePlay, TileResults): each round's board at a player's tier, my slots (solo all,
// co-op my role's), the team's board from everyone's answers. Over games/tile/def.ts. Its pages' strings come in with it
// (i18n/kiki-tile.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-tile.ts';
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { EMPTY, boardOf, slotsOf, tierAt, tileOpts, unionOf, type TileCard } from '#lib/kikimimi/games/tile/def.ts';

/** Co-op: several players, not たいせん (ことば タイル has none). */
export const isCoop = (v: Pick<QuizView, 'players' | 'vs'>): boolean => v.players.length > 1 && !v.vs;

/** A player's board for a card: at their ear (theirs heard, else the game's: mine as I play it). */
export function boardFor(v: Pick<QuizView, 'o' | 'seed' | 'tiers'>, c: TileCard, who?: Who): string[] {
  const o = tileOpts.decode(v.o);
  if (!o) return [...c.tile.tiles];
  const ear = who ? (v.tiers[who] ?? o.ear) : o.ear;
  return boardOf(c.tile, v.seed, tierAt(ear, o.lv));
}

/** Whether I'm on an easy board (one decoy, my first slot placed for me). */
export function easy(v: Pick<QuizView, 'o'>): boolean {
  const o = tileOpts.decode(v.o);
  return !!o && tierAt(o.ear, o.lv) === 'easy';
}

/** My slots of a sentence of n: solo every one, co-op my role's. */
export const mySlots = (v: Pick<QuizView, 'players' | 'vs' | 'roles'>, me: Who, n: number): number[] => slotsOf(n, isCoop(v) ? (v.roles[me] ?? 0) : null);

/** An empty answer (every slot EMPTY). */
export const blank = (n: number): number[] => Array.from({ length: n }, () => EMPTY);

/** The team's sentence at a reveal: each slot from whoever filled it (mine first), its word or null. */
export function teamWords(v: Pick<QuizView, 'o' | 'seed' | 'tiers' | 'players'>, c: TileCard, me: Who, mine: readonly number[] | null): (string | null)[] {
  const boards = [
    ...(mine ? [{ board: boardFor(v, c), a: mine }] : []),
    ...v.players.flatMap((p) => (p.who !== me && p.pick && Array.isArray(p.pick.a) ? [{ board: boardFor(v, c, p.who), a: p.pick.a as readonly number[] }] : []))
  ];
  return unionOf(boards, c.tile.tiles.length);
}
