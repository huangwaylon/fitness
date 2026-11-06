// しずえの しゅうまつ たいかい's window (docs/kikimimi-ux.md §5, §7.1: the hub's banner, Fri 18:00 – Mon 05:00 Tokyo):
// when the weekend tournament is offered, which one an instant or a row's day belongs to (its Friday names it), and the
// days its misses are drawn from (that week's Monday on). Tokyo is UTC+9 with no DST, so fixed offsets are exact. Pure.
import { ZONE_OFFSET_MS, localDateAt } from '../../../contract/tokyo.ts';
import type { LocalDate } from '../../../types.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
/** The window in hours from Monday 00:00 Tokyo: Friday 18:00 (4 days 18 h) to the next Monday 05:00 (7 days 5 h). */
const FROM_H = 4 * 24 + 18;
const UNTIL_H = 7 * 24 + 5;
/** 1970-01-01 was a Thursday: Monday 00:00 of that week is 3 days before. */
const MONDAY0 = -3 * DAY;

export interface TaikaiWindow {
  /** Offered now. */
  open: boolean;
  /** This weekend's window (open), else the next one: its start and end (epoch ms). */
  from: number;
  until: number;
  /** Its Friday (Tokyo), the tournament's name: rows and trophies are filed under it. */
  fri: LocalDate;
}

/** The tournament at `now`: the one under way, else the next. */
export function taikaiAt(now: number): TaikaiWindow {
  const local = now + ZONE_OFFSET_MS;
  // this Tokyo week's Monday 00:00 (as epoch ms), and its window; before Monday 05:00 the last week's is still on
  const monday = Math.floor((local - MONDAY0) / WEEK) * WEEK + MONDAY0 - ZONE_OFFSET_MS;
  const of = (mon: number) => ({ from: mon + FROM_H * HOUR, until: mon + UNTIL_H * HOUR });
  const last = of(monday - WEEK), cur = of(monday);
  const w = now < last.until ? last : cur;
  return { open: now >= w.from && now < w.until, ...w, fri: localDateAt(w.from) };
}

/** Whether the tournament is offered at `now` (the hub's banner). */
export const taikaiOpen = (now: number): boolean => taikaiAt(now).open;

const dayNum = (d: LocalDate): number => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY;
const dayOf = (n: number): LocalDate => new Date(n * DAY).toISOString().slice(0, 10) as LocalDate;

/** The tournament a row's Tokyo day belongs to (its Friday), or null: Friday, Saturday and Sunday are their week's;
 *  Monday the weekend before (its first 5 hours are still in the window); Tuesday to Thursday none. A row has its day,
 *  not its hour, so a Friday row from before 18:00 counts too (rows of the game itself are only written inside it). */
export function taikaiOfDay(d: LocalDate): LocalDate | null {
  const n = dayNum(d), dow = (((n + 3) % 7) + 7) % 7; // 0 Monday … 6 Sunday
  if (dow >= 4) return dayOf(n - (dow - 4));
  return dow === 0 ? dayOf(n - 3) : null;
}

/** The days a tournament's misses come from: its week's Monday through the Monday after (the window's last morning). */
export function taikaiDays(fri: LocalDate): { from: LocalDate; to: LocalDate } {
  const n = dayNum(fri);
  return { from: dayOf(n - 4), to: dayOf(n + 3) };
}
