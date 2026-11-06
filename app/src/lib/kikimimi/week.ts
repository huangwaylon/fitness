// ききみみ's week (docs/kikimimi-ux.md §7.3, §7.4): the stamp card (a day stamped by one finished session, against my
// target of 3, 5 or 7 days; Monday starts a new card with nothing lost and nothing said: never a streak) and ふたりの
// クエスト (the members' minutes heard together this week, one bar, never who added what; the guest's own solo quest).
// Pure.
import type { LocalDate, Who } from '../types.ts';
import { weekDays } from './progress.ts';
import { finished, finishedStory } from './today.ts';

/** The couple quest's minutes (a member's phone) and the guest's solo one. */
const QUEST_MIN = 60;
const SOLO_QUEST_MIN = 30;

export interface WeekCard {
  /** Monday first: a finished session that day. */
  days: boolean[];
  /** Today's place in the week (0 Monday). */
  at: number;
  count: number;
  goal: number;
  met: boolean;
  quest: { minutes: number; of: number; met: boolean; solo: boolean };
}

export function weekCard(o: {
  today: LocalDate;
  me: Who;
  goal: number;
  /** My games: their day, answers and length (a bedtime story: no answers, finished at ≥ 3 min). */
  mine: readonly { d: LocalDate; n: number; ms: number; story?: boolean }[];
  /** The others' summaries: who, their day and length. */
  others: readonly { who: Who; d: LocalDate; ms: number }[];
}): WeekCard {
  const week = weekDays(o.today), inWeek = new Set(week);
  const played = new Set(o.mine.filter((g) => inWeek.has(g.d) && (g.story ? finishedStory(g.ms) : finished(g.n))).map((g) => g.d));
  const days = week.map((d) => played.has(d));
  const count = days.filter(Boolean).length;
  const solo = o.me === 'G';
  const ms = o.mine.filter((g) => inWeek.has(g.d)).reduce((s, g) => s + g.ms, 0)
    + (solo ? 0 : o.others.filter((x) => x.who !== 'G' && x.who !== o.me && inWeek.has(x.d)).reduce((s, x) => s + x.ms, 0));
  const minutes = Math.floor(ms / 60_000), of = solo ? SOLO_QUEST_MIN : QUEST_MIN;
  return { days, at: week.indexOf(o.today), count, goal: o.goal, met: count >= o.goal, quest: { minutes, of, met: minutes >= of, solo } };
}
