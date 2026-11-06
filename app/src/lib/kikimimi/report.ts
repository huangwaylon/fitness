// ききみみ クイズ's きろく in one fold (docs/kikimimi.md "Progress & feedback"): the `listen` rows this phone holds
// (mine whole, the partner's as summaries) → my games, stats, cards, advice, trend, week and the couple summary; and
// にがて れんしゅう's deck and a game's feedback from it. Pure.
import type { EventRow } from '../contract/api.ts';
import type { LocalDate, Who } from '../types.ts';
import type { Item, Level } from './bank.ts';
import { ENTRIES, itemOf, loadIds } from './pool.ts';
import { answersOf, daysPlayed, gamesOf, recentOf, speedOf, statsOf, together, trendOf, weekDays, type Game, type OtherGame, type Speed, type Stats, type StoryGame } from './progress.ts';
import { cardsOf, dueOf, practicePicks, type Focus } from './srs.ts';
import { feedback, recommend, type Feedback, type Rec } from './advice.ts';
import type { Recent } from './recent.ts';

export interface Report {
  today: LocalDate;
  games: Game[];
  others: OtherGame[];
  /** My bedtime stories (no answers: their minutes only). */
  stories: StoryGame[];
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
  /** スピード はしご's measure: the fastest comfortable speed. */
  speed: Speed;
}

/** The report of `me`'s rows as of `today`, the levels this phone offers (the advice's level nudge and tries) and
 *  whether it offers スピード はしご. */
export function reportOf(rows: readonly EventRow[], me: Who, today: LocalDate, levels: readonly Level[], ladder = false): Report {
  const { mine, others, stories } = gamesOf(rows, me);
  const answers = answersOf(mine);
  const stats = statsOf(answers, today);
  const due = dueOf(cardsOf(answers), today).items.length;
  const week = new Set(weekDays(today));
  const speed = speedOf(mine);
  return {
    today, games: mine, others, stories, stats, due, speed,
    recs: recommend({ stats, games: mine, dueItems: due, levels, bank: ENTRIES, speed, ladder }),
    trend: trendOf(mine), recent: recentOf(mine), days: daysPlayed(mine, today),
    together: together(mine, others, today),
    minutes: Math.round([...mine, ...stories].filter((g) => week.has(g.d)).reduce((s, g) => s + g.ms, 0) / 60_000)
  };
}

/** にがて れんしゅう's deck for this report (a recommendation's focus, or every weak spot): picked from the index, dealt
 *  once the picks' levels are loaded. */
export async function practiceFor(r: Report, levels: readonly Level[], seed: number, focus: Focus = null, recent: Recent = []): Promise<Item[]> {
  const picks = practicePicks({ answers: answersOf(r.games), stats: r.stats, today: r.today, seed, levels, focus, recent });
  await loadIds(picks.ids);
  return picks.deal(itemOf);
}

/** Game `g`'s feedback: the stats without it and with it, and the advice after it (null: not in the report). */
export function feedbackFor(r: Report, g: string): Feedback | null {
  const game = r.games.find((x) => x.g === g);
  if (!game) return null;
  const before = statsOf(answersOf(r.games.filter((x) => x !== game)), r.today);
  return feedback({ game, before, after: r.stats, recs: r.recs });
}
