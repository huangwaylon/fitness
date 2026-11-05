// ききみみ クイズ's きろく in one fold (docs/kikimimi.md "Progress & feedback"): the `listen` rows this phone holds
// (mine whole, the partner's as summaries) → my games, stats, cards, advice, trend, week and the couple summary; and
// にがて れんしゅう's deck and a game's feedback from it. Pure.
import type { EventRow } from '../contract/api.ts';
import type { LocalDate, Who } from '../types.ts';
import { BANK, type Item, type Level } from './bank.ts';
import { answersOf, daysPlayed, gamesOf, recentOf, statsOf, together, trendOf, weekDays, type Game, type OtherGame, type Stats } from './progress.ts';
import { cardsOf, dueOf, practiceDeck, type Focus } from './srs.ts';
import { feedback, recommend, type Feedback, type Rec } from './advice.ts';

export interface Report {
  today: LocalDate;
  games: Game[];
  others: OtherGame[];
  stats: Stats;
  /** Item cards due today. */
  due: number;
  recs: Rec[];
  trend: number[];
  recent: { now: number | null; delta: number | null };
  days: boolean[];
  together: { games: number; minutes: number; partner: boolean };
  /** Minutes I listened this week. */
  minutes: number;
}

/** The report of `me`'s rows as of `today`, the levels this phone offers (the advice's level nudge and tries). The
 *  guest's has no couple summary. */
export function reportOf(rows: readonly EventRow[], me: Who, today: LocalDate, levels: readonly Level[]): Report {
  const { mine, others } = gamesOf(rows, me);
  const answers = answersOf(mine);
  const stats = statsOf(answers, today);
  const due = dueOf(cardsOf(answers), today).items.length;
  const week = new Set(weekDays(today));
  return {
    today, games: mine, others, stats, due,
    recs: recommend({ stats, games: mine, dueItems: due, levels, bank: BANK }),
    trend: trendOf(mine), recent: recentOf(mine), days: daysPlayed(mine, today),
    together: together(mine, me === 'G' ? [] : others, today),
    minutes: Math.round(mine.filter((g) => week.has(g.d)).reduce((s, g) => s + g.ms, 0) / 60_000)
  };
}

/** にがて れんしゅう's deck for this report (a recommendation's focus, or every weak spot). */
export function practiceFor(r: Report, levels: readonly Level[], seed: number, focus: Focus = null): Item[] {
  return practiceDeck({ answers: answersOf(r.games), stats: r.stats, today: r.today, seed, levels, focus });
}

/** Game `g`'s feedback: the stats without it and with it, and the advice after it (null: not in the report). */
export function feedbackFor(r: Report, g: string): Feedback | null {
  const game = r.games.find((x) => x.g === g);
  if (!game) return null;
  const before = statsOf(answersOf(r.games.filter((x) => x !== game)), r.today);
  return feedback({ game, before, after: r.stats, recs: r.recs });
}
