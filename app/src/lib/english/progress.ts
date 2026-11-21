// English Study's progress (docs/english.md "Progress"), pure over the record's `listen` rows (state.listen): mine
// whole, the others' as summaries. Only English Study's rows count (gm 'tv'). A day is a Tokyo day a まとめ was reached
// (`f`); weeks start on Monday. The run of 「3日の週」 grows with each week of 3+ days, holds through a week of 1–2 and
// through one empty week, and ends with two empty weeks in a row.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf, listenSummaryOf } from '#lib/contract/listen.ts';
import { listensOf } from './listens.ts';
import { addDays, daysBetween, weekKeyOf } from '#lib/time/dates.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** The week's target, in days. */
export const WEEK_TARGET = 3;
/** Days away after which the sheet welcomes me back (once). */
const AWAY_DAYS = 7;

type Own = NonNullable<ReturnType<typeof listenOf>>;
type Summary = NonNullable<ReturnType<typeof listenSummaryOf>>;

interface Study {
  /** The days a まとめ was reached. */
  days: Set<LocalDate>;
  /** The clips finished (mine only: the others' summaries carry no clip). */
  clips: Set<string>;
  /** Active study time by week (its Monday), ms. */
  ms: Map<LocalDate, number>;
  /** The latest day with any study row. */
  last: LocalDate | null;
  /** Each clip's plays finished, and the day it was last finished (mine only). */
  plays: Map<string, number>;
  lastOn: Map<string, LocalDate>;
  /** Each clip's items answered or shown, ever (mine only). */
  seen: Map<string, Set<string>>;
  /** The days a clip finished before was finished again (mine only). */
  again: Set<LocalDate>;
}

/** `who`'s English Study rows, read as `me` gets them (mine whole, anyone else's summary). */
export function studyOf(rows: readonly EventRow[], who: Who, me: Who): Study {
  const out: Study = { days: new Set(), clips: new Set(), ms: new Map(), last: null, plays: new Map(), lastOn: new Map(), seen: new Map(), again: new Set() };
  const mine = who === me;
  // (mine whole: a summary and more)
  for (const row of listensOf<Summary>(rows, who, mine ? listenOf : listenSummaryOf)) {
    const own = mine ? (row as Own) : null;
    if (own) {
      const seen = out.seen.get(own.u) ?? new Set<string>();
      for (const [id] of own.r) seen.add(id);
      out.seen.set(own.u, seen);
    }
    if (row.f === 1) {
      out.days.add(row.d);
      if (own) {
        if (out.clips.has(own.u)) out.again.add(row.d);
        out.clips.add(own.u);
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

/**
 * Home's main card: the first clip in the plan (`lib`, the library's order) I haven't finished nor skipped (`skipped`:
 * 別の動画にする), else the first not finished, else (all finished) the one finished longest ago. Today's finished, it's
 * the next: the finished one again is only もう一度's row (reviewOf).
 */
export function dailyOf<C extends { id: string }>(lib: readonly C[], st: Pick<Study, 'clips' | 'lastOn'>, skipped: ReadonlySet<string>): C | undefined {
  const open = (c: C) => !st.clips.has(c.id);
  return lib.find((c) => open(c) && !skipped.has(c.id)) ?? lib.find(open) ?? lib.toSorted((a, b) => ((st.lastOn.get(a.id) ?? '') < (st.lastOn.get(b.id) ?? '') ? -1 : 1))[0];
}

/** Days after a clip's first finish before it's offered again, and after any later one. */
const REVIEW_AFTER = 7, REVIEW_AFTER_2 = 28;

/**
 * The clip home's library card offers again, with new questions (もう一度), or null: at most once a week, on a week
 * that already has a study day and no clip finished again yet; a clip finished REVIEW_AFTER days ago or more
 * (REVIEW_AFTER_2 once it's had two plays), the one with the most items I haven't met first, then the one finished
 * longest ago. Never today's clip (`not`): only a row beside it.
 */
export function reviewOf(st: Study, today: LocalDate, lib: readonly { id: string; items: number }[], not: ReadonlySet<string>): string | null {
  const wk = weekKeyOf(today);
  if (!daysThisWeek(st.days, today) || [...st.again].some((d) => weekKeyOf(d) === wk && d <= today)) return null;
  const unseen = (c: { id: string; items: number }) => Math.max(0, c.items - (st.seen.get(c.id)?.size ?? 0));
  const due = lib.filter((c) => {
    const on = st.lastOn.get(c.id);
    return on && !not.has(c.id) && daysBetween(on, today) >= ((st.plays.get(c.id) ?? 0) >= 2 ? REVIEW_AFTER_2 : REVIEW_AFTER);
  });
  return due.toSorted((a, b) => unseen(b) - unseen(a) || (st.lastOn.get(a.id)! < st.lastOn.get(b.id)! ? -1 : st.lastOn.get(a.id)! > st.lastOn.get(b.id)! ? 1 : 0))[0]?.id ?? null;
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

/** The week's block for `me` (A, B or the guest G), today; `partnerName` the other member's name (members only);
 *  `mine`: my studyOf when the caller has it already. */
export function weekView(rows: readonly EventRow[], me: Who, today: LocalDate, partnerName: string, mine: Study = studyOf(rows, me, me)): WeekView {
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

/** One play of a clip in これまでの記録 (docs/english.md "Progress"): its rows up to its まとめ (`f`). */
export interface Play {
  /** Its first row's event id: a stable key as rows come in. */
  key: string;
  u: string;
  /** The day it was finished (unfinished: its last row's). */
  d: LocalDate;
  /** Its study time, ms. */
  ms: number;
  /** Its answers in the lesson's order (a later row's win: each carries all so far). */
  r: Own['r'];
  /** Its まとめ reached. */
  f: boolean;
  /** Which play of the clip it is (1-based: the finished plays before it + 1). */
  k: number;
}

/**
 * My plays, the latest first, grouped as draw.ts historyOf reads them: a clip's rows up to its `f` row are one play
 * (another clip's between them don't cut it). An empty minutes row after a play's まとめ (the lesson left open there)
 * adds its time to that play, never a play of its own. A play without `f` is unfinished (途中まで). Mine only: anyone
 * else's rows are summaries without a clip.
 */
export function playsOf(rows: readonly EventRow[], me: Who): Play[] {
  const all: { p: Play; end: number }[] = [];
  const open = new Map<string, { p: Play; end: number }>();
  const last = new Map<string, { p: Play; end: number }>();
  rows.forEach((ev, n) => {
    if (ev[1] !== me || ev[3] !== 'listen') return;
    let row: Own | null;
    try {
      row = listenOf(JSON.parse(ev[4]));
    } catch {
      return;
    }
    if (!row) return;
    let x = open.get(row.u);
    const before = last.get(row.u);
    if (!x && row.f !== 1 && !row.r.length && before) return void (before.p.ms += row.ms);
    if (!x) {
      x = { p: { key: ev[2], u: row.u, d: row.d, ms: 0, r: [], f: false, k: (before?.p.k ?? 0) + 1 }, end: n };
      open.set(row.u, x);
      all.push(x);
    }
    const p = x.p;
    x.end = n;
    p.ms += row.ms;
    p.d = row.d;
    if (row.r.length) p.r = [...new Map([...p.r, ...row.r].map((a) => [a[0], a])).values()];
    if (row.f === 1) {
      p.f = true;
      open.delete(row.u);
      last.set(row.u, x);
    }
  });
  return all.sort((a, b) => (a.p.d < b.p.d ? 1 : a.p.d > b.p.d ? -1 : b.end - a.end)).map((x) => x.p);
}

/** A play's scenes to look back on: the answers not heard in full the first time (lesson.ts clean). */
export const missesOf = (p: Pick<Play, 'r'>): string[] => p.r.flatMap((a) => (a[1] ? [] : [a[0]]));

/** これまでの記録's top line: the clips finished, the days studied (a まとめ reached), all the study time (ms). */
export function totalsOf(st: Pick<Study, 'clips' | 'days' | 'ms'>): { clips: number; days: number; ms: number } {
  let ms = 0;
  for (const v of st.ms.values()) ms += v;
  return { clips: st.clips.size, days: st.days.size, ms };
}
