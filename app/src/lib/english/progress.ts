// English Study's progress (docs/english.md "Progress"), pure over the record's `listen` rows (state.listen): mine
// whole, the others' as summaries. Only English Study's rows count (gm 'tv'). A day is a Tokyo day a まとめ was reached
// (`f`); weeks start on Monday. The run of 「3日の週」 grows with each week of 3+ days, holds through a week of 1–2 and
// through one empty week, and ends with two empty weeks in a row.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf, listenSummaryOf } from '#lib/contract/listen.ts';
import { addDays, daysBetween, weekKeyOf } from '#lib/time/dates.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** The week's target, in days. */
export const WEEK_TARGET = 3;
/** Days away after which the sheet welcomes me back (once). */
const AWAY_DAYS = 7;

interface Study {
  /** The days a まとめ was reached. */
  days: Set<LocalDate>;
  /** The clips finished (mine only: the others' summaries carry no clip). */
  clips: Set<string>;
  /** Active study time by week (its Monday), ms. */
  ms: Map<LocalDate, number>;
  /** The latest day with any study row. */
  last: LocalDate | null;
  /** Each day's last clip finished (mine only). */
  byDay: Map<LocalDate, string>;
  /** Each clip's plays finished, and the day it was last finished (mine only). */
  plays: Map<string, number>;
  lastOn: Map<string, LocalDate>;
}

/** `who`'s English Study rows, read as `me` gets them (mine whole, anyone else's summary). */
export function studyOf(rows: readonly EventRow[], who: Who, me: Who): Study {
  const out: Study = { days: new Set(), clips: new Set(), ms: new Map(), last: null, byDay: new Map(), plays: new Map(), lastOn: new Map() };
  for (const r of rows) {
    if (r[1] !== who || r[3] !== 'listen') continue;
    let d: unknown;
    try {
      d = JSON.parse(r[4]);
    } catch {
      continue;
    }
    const own = who === me ? listenOf(d) : null, row = who === me ? own : listenSummaryOf(d);
    if (!row) continue;
    if (row.f === 1) {
      out.days.add(row.d);
      if (own) {
        out.clips.add(own.u);
        out.byDay.set(row.d, own.u);
        out.plays.set(own.u, (out.plays.get(own.u) ?? 0) + 1);
        if ((out.lastOn.get(own.u) ?? '') < row.d) out.lastOn.set(own.u, row.d);
      }
    }
    const wk = weekKeyOf(row.d);
    out.ms.set(wk, (out.ms.get(wk) ?? 0) + row.ms);
    if (!out.last || row.d > out.last) out.last = row.d;
  }
  return out;
}

/** Days studied in `today`'s week. */
export const daysThisWeek = (days: ReadonlySet<LocalDate>, today: LocalDate): number => {
  const wk = weekKeyOf(today);
  let n = 0;
  for (const d of days) if (weekKeyOf(d) === wk && d <= today) n++;
  return n;
};

/**
 * The run of 3-day weeks now, and how many there have been in all. The weeks before this one are judged whole (at the
 * Monday rollover): 3+ days the run +1; 1–2 it holds; an empty week it holds once, a second in a row ends it (0). This
 * week counts once it has its 3 days (it can't lose them).
 */
export function runOf(days: ReadonlySet<LocalDate>, today: LocalDate): { run: number; ever: number } {
  const per = new Map<LocalDate, number>();
  let first: LocalDate | null = null;
  for (const d of days) {
    if (d > today) continue;
    const wk = weekKeyOf(d);
    per.set(wk, (per.get(wk) ?? 0) + 1);
    if (!first || wk < first) first = wk;
  }
  let run = 0, ever = 0, empty = 0;
  const now = weekKeyOf(today);
  for (let wk = first; wk && wk <= now; wk = addDays(wk, 7)) {
    const n = per.get(wk) ?? 0;
    if (n >= WEEK_TARGET) {
      run++;
      ever++;
      empty = 0;
    } else if (wk === now) break;
    else if (n > 0) empty = 0;
    else if (++empty >= 2) run = 0;
  }
  return { run, ever };
}

/** Minutes shown for a week's ms: rounded to 5 (0 shows nothing). */
export const roundedMinutes = (ms: number): number => Math.round(ms / 300_000) * 5;

/** Whether the sheet says おかえりなさい: the last study day `AWAY_DAYS` or more before today. */
export const away = (last: LocalDate | null, today: LocalDate): boolean => last !== null && daysBetween(last, today) >= AWAY_DAYS;

/** What the week's block shows (WeekProgress). */
export interface WeekView {
  /** Days this week. */
  days: number;
  /** Today is a Monday and nothing's studied yet this week. */
  fresh: boolean;
  run: number;
  ever: number;
  /** Clips finished, ever. */
  clips: number;
  /** This week's minutes, rounded to 5. */
  minutes: number;
  /** The partner (a member's only): their today and their week; null for the guest. */
  partner: { name: string; today: boolean; days: number } | null;
  /** Both members have their 3 days this week. */
  both: boolean;
}

/** The week's block for `me` (A, B or the guest G), today; `partnerName` the other member's name (members only). */
export function weekView(rows: readonly EventRow[], me: Who, today: LocalDate, partnerName: string): WeekView {
  const mine = studyOf(rows, me, me);
  const days = daysThisWeek(mine.days, today);
  const { run, ever } = runOf(mine.days, today);
  const other: Who | null = me === 'A' ? 'B' : me === 'B' ? 'A' : null;
  const theirs = other ? studyOf(rows, other, me) : null;
  const theirDays = theirs ? daysThisWeek(theirs.days, today) : 0;
  return {
    days, fresh: days === 0 && weekKeyOf(today) === today, run, ever, clips: mine.clips.size, minutes: roundedMinutes(mine.ms.get(weekKeyOf(today)) ?? 0),
    partner: theirs ? { name: partnerName, today: theirs.days.has(today), days: theirDays } : null,
    both: !!theirs && days >= WEEK_TARGET && theirDays >= WEEK_TARGET
  };
}
