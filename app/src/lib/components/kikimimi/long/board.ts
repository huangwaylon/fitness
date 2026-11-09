// まるごと 聞く's round on this phone (LongPlay, LongResults): the choices a card shows me (my ear), whether an answer is
// right, a line of the piece as an item of its own (its replay), who says a line, the piece's minutes. Over
// games/long/def.ts. Its pages' strings come in with it (i18n/kiki-long.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-long.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { rawOf } from '#lib/kikimimi/games/listened.ts';
import { longOpts, longTier, shownOf, type LongCard, type LongSpeaker } from '#lib/kikimimi/games/long/def.ts';

/** The choices a card shows me (easy: the answer and one wrong one), as their authored places. */
export function shownFor(v: Pick<QuizView, 'o'>, c: LongCard): number[] {
  const o = longOpts.decode(v.o);
  return shownOf(c, o ? longTier(o.ear) : undefined);
}

/** Whether an answer (as the view keeps it) is right for a card. */
export const okFor = (c: Pick<LongCard, 'answer'>, x: { k: number; a?: unknown } | null | undefined): boolean => rawOf(x as { k: number }) === c.answer;

/** Line k of the piece as an item of its own (its clip): its replay. */
export const lineItem = (piece: LongCard, k: number): Item => {
  const l = piece.lines![k];
  return { ...piece, id: l.clip ?? `${piece.long.of}-${k + 1}`, en: l.en, lines: undefined };
};

/** Who says line k (their place among the piece's speakers). */
export const speakerAt = (piece: LongCard, k: number): number => piece.long.speakers.findIndex((s) => s.key === piece.lines?.[k]?.who);

/** A speaker's name as shown: a villager's (the roster's), else the recording's (in Japanese). */
export const nameOf = (s: LongSpeaker, villager: (id: string) => string): string => (s.villager ? villager(s.villager) : (s.ja ?? s.name ?? ''));

/** The piece's length in whole minutes (at least 1), from its play (ms). */
export const minutesOf = (ms: number): number => Math.max(1, Math.round(ms / 60_000));
