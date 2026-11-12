// しずえの ニュース's round on this phone (NewsPlay, NewsResults): my tier and the choices it shows, a round's grading
// view, a story of the bulletin as a clip sequence of its own (its replay chip), the story being read now. Over
// games/news/def.ts. Its pages' strings come in with it (i18n/kiki-news.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-news.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { rawOf, tierAt } from '#lib/kikimimi/games/listened.ts';
import { newsOpts, shownOf, type NewsCard, type NewsSeg } from '#lib/kikimimi/games/news/def.ts';

/** The choices a card shows me (easy: the answer and its trap), as their authored places. */
export function shownFor(v: Pick<QuizView, 'o'>, c: NewsCard): number[] {
  const o = newsOpts.decode(v.o);
  return shownOf(c, !!o && tierAt(o.ear, o.lv, c.lv) === 'easy');
}

/** Whether an answer (as the view keeps it) is right for a card. */
export const okFor = (c: NewsCard, x: { k: number; a?: unknown } | null | undefined): boolean => rawOf(x as { k: number }) === c.answer;

/** A story of the bulletin (its lines) as an item of its own: its replay. */
export const segItem = (bulletin: NewsCard, s: NewsSeg): Item => ({ ...bulletin, id: `${bulletin.id}-s${s.from}`, lines: bulletin.lines!.slice(s.from, s.to) });

/** The story being read now (its place in `segs`), from the line spoken; -1 none. */
export const segAt = (segs: readonly NewsSeg[], k: number): number => segs.findIndex((s) => k >= s.from && k < s.to);
