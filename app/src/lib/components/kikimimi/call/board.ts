// ようじ でんわ's round on this phone (CallPlay, CallResults): each round's memo rows at a player's tier, my rows (solo
// all, co-op my role's), the team's memo from everyone's answers, the call's basket. Over games/call/def.ts. Its pages'
// strings come in with it (i18n/kiki-call.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-call.ts';
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { listenOpts, tierAt, type ListenOpts } from '#lib/kikimimi/games/listened.ts';
import { callRounds, roundRows, rowsOf, unionOf, type AskedRow, type CallCard, type CallRound } from '#lib/kikimimi/games/call/def.ts';
import { roleOf } from '../listenView.ts';

/** A player's ear (theirs heard, else the game's: mine as I play it). */
const earOf = (v: Pick<QuizView, 'o' | 'tiers'>, who?: Who): { lv: number; ear: number } | null => {
  const o = listenOpts.decode(v.o);
  return o && { lv: o.lv, ear: who ? (v.tiers[who] ?? o.ear) : o.ear };
};

/** A player's round of a card at their tier (the call's length isn't read here). */
export function roundFor(v: Pick<QuizView, 'o' | 'tiers'>, c: CallCard, who?: Who): CallRound {
  const e = earOf(v, who);
  return callRounds([c], { lv: (e?.lv ?? c.lv) as ListenOpts['lv'], ear: e?.ear ?? 1 }, () => 0)[0];
}

/** My rows of a round of n: solo every one, co-op my role's. */
export const myRows = (v: Pick<QuizView, 'players' | 'vs' | 'roles'>, me: Who, n: number): number[] => rowsOf(n, roleOf(v, me));

/** The others' answers heard at each round's reveal (a later reveal no longer has them: the basket's), by game and
 *  round. */
const HEARD = new Map<string, { who: Who; a: readonly number[] }[]>();
const othersOf = (v: Pick<QuizView, 'players'>, me: Who) => v.players.flatMap((p) => (p.who !== me && p.pick && Array.isArray(p.pick.a) ? [{ who: p.who, a: p.pick.a as readonly number[] }] : []));
export function hear(v: Pick<QuizView, 'g' | 'i' | 'phase' | 'players'>, me: Who): void {
  if (v.phase !== 'reveal' || !v.g) return;
  for (const k of HEARD.keys()) if (!k.startsWith(`${v.g}:`)) HEARD.delete(k); // (an earlier game's: let go)
  const got = othersOf(v, me);
  if (got.length) HEARD.set(`${v.g}:${v.i}`, got);
}

/** The team's memo for round i (mine first, then the others': this reveal's, an earlier one's as heard): each memo
 *  row's chip and whether it's right. */
export function teamMemo(v: Pick<QuizView, 'g' | 'i' | 'phase' | 'players' | 'o' | 'tiers' | 'answers'>, cards: readonly CallCard[], i: number, me: Who): Map<number, { chip: string; ok: boolean }> {
  const c = cards[i], mine = v.answers[i]?.a;
  if (!c) return new Map();
  const others = i === v.i && v.phase === 'reveal' ? othersOf(v, me) : (HEARD.get(`${v.g}:${i}`) ?? []);
  return unionOf([
    ...(Array.isArray(mine) ? [{ round: roundFor(v, c), a: mine as readonly number[] }] : []),
    ...others.map((h) => ({ round: roundFor(v, c, h.who), a: h.a }))
  ]);
}

/** The rows a reveal shows: mine, then the others' at their tiers that I wasn't asked (theirs, by their place in the
 *  call), in the call's order. */
export function revealRows(v: Pick<QuizView, 'players' | 'o' | 'tiers'>, c: CallCard, me: Who): AskedRow[] {
  const mine = roundFor(v, c).rows, have = new Set(mine.map((r) => r.n));
  const more = v.players.filter((p) => p.who !== me).flatMap((p) => roundFor(v, c, p.who).rows).filter((r) => !have.has(r.n) && (have.add(r.n), true));
  return [...mine, ...more].sort((a, b) => a.n - b.n);
}

/** A call's basket at round i: every memo row it asks me (both rounds at my tier), each caught (the team's right), missed,
 *  or still to come (round 2's before its reveal); its tag the right chip's Japanese (`cja`), else the chip. */
export interface BasketTag {
  n: number;
  label: string;
  state: 'caught' | 'missed' | 'soon';
  /** Its round is the one just revealed (its tag drops in). */
  fresh?: true;
}
export function basketOf(v: Pick<QuizView, 'g' | 'o' | 'tiers' | 'answers' | 'phase' | 'i' | 'players'>, cards: readonly CallCard[], i: number, me: Who): BasketTag[] {
  const c = cards[i];
  if (!c) return [];
  const first = i - c.call.part, info = c.call.info, o = listenOpts.decode(v.o);
  const rows = roundRows(info, o ? tierAt(o.ear, o.lv) : undefined);
  const authored = new Map(info.memo.flatMap((m) => m.rows).map((r) => [r.n, r]));
  return rows.flatMap((rs, part) => {
    const at = first + part, done = v.phase === 'results' || at < v.i || (at === v.i && v.phase === 'reveal');
    const team = done ? teamMemo(v, cards, at, me) : null;
    return rs.map((r): BasketTag => {
      const a = authored.get(r.n)!;
      return { n: r.n, label: a.cja?.[a.answer] ?? a.options[a.answer], state: !team ? 'soon' : team.get(r.n)?.ok ? 'caught' : 'missed', ...(at === v.i && v.phase === 'reveal' && { fresh: true as const }) };
    });
  });
}

/** A round's 解説: a call with two memo rounds, each its own; one memo split in two, its 解説 at the second. */
export const whyOf = (c: CallCard): string | undefined => {
  const m = c.call.info.memo;
  return m.length > 1 ? m[c.call.part]?.why : c.call.part === 1 ? m[0].why : undefined;
};

/** A memo row's right chip's Japanese, when it reads otherwise than the chip (`cja`: its kanji, a Latin letter's
 *  reading). */
export function rightJa(c: CallCard, n: number): string | null {
  const r = c.call.info.memo.flatMap((m) => m.rows).find((x) => x.n === n);
  const ja = r?.cja?.[r.answer], chip = r?.options[r.answer];
  return ja && chip && ja.replace(/\s/g, '') !== chip.replace(/\s/g, '') ? ja : null;
}
