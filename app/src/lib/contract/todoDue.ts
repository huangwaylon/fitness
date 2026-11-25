// やること's due dates and reminders (docs/todo.md "Due dates and reminders"): an item's optional `due` (a Tokyo wall
// clock date, maybe with a time) and `rem` (when its reminder fires), read the same by the record's rules
// (contract/todo.ts), the relay's reminder alarm (relay/src/remind.ts) and the sheet. Pure; all times Tokyo
// (contract/tokyo.ts: UTC+9, no DST).
import type { LocalDate } from '../types.ts';
import { nextDay, prevDay, ZONE_OFFSET_MS } from './tokyo.ts';

/** A reminder: timed due 時刻 `at`, 10分前 `b10`, 1時間前 `b60`; date-only due 当日8時 `am`; either 前日20時 `eve`. */
export type Rem = 'at' | 'b10' | 'b60' | 'eve' | 'am';
/** The reminders a timed due takes, and a date-only one (the form's order). */
export const REMS_TIMED: readonly Rem[] = ['at', 'b10', 'b60', 'eve'];
export const REMS_DATE: readonly Rem[] = ['am', 'eve'];
/** A reminder more than this late (the relay was asleep, the op came late) is skipped, never sent. */
export const LATE_MS = 10 * 60_000;

const DUE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

/** A `due`'s date and time (`HH:MM`, null: date only), or null: not `YYYY-MM-DD` / `YYYY-MM-DDTHH:MM`, not a real
 *  calendar date, a year outside 2024–2099 or a time outside 00:00–23:59. */
export function dueOf(s: unknown): { date: LocalDate; time: string | null } | null {
  if (typeof s !== 'string') return null;
  const m = DUE.exec(s);
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  if (y < 2024 || y > 2099 || mo < 1 || mo > 12 || d < 1 || d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return null;
  if (m[4] !== undefined && (+m[4] > 23 || +m[5] > 59)) return null;
  return { date: s.slice(0, 10), time: m[4] === undefined ? null : `${m[4]}:${m[5]}` };
}

/** Whether `rem` fits the due's kind (REMS_TIMED with a time, REMS_DATE without). */
export const remFits = (due: { time: string | null }, rem: unknown): rem is Rem => (due.time === null ? REMS_DATE : REMS_TIMED).includes(rem as Rem);

/** A Tokyo wall clock as epoch ms. */
const tokyoMs = (date: string, time: string): number => Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), +time.slice(0, 2), +time.slice(3, 5)) - ZONE_OFFSET_MS;

/** When the reminder fires (epoch ms, minute precision): `at` the due's time, `b10`/`b60` that less 10/60 min, `am`
 *  08:00 on the day, `eve` 20:00 the day before. Null: a bad due, or a `rem` that doesn't fit its kind. */
export function fireAt(due: string, rem: Rem): number | null {
  const d = dueOf(due);
  if (!d || !remFits(d, rem)) return null;
  if (rem === 'eve') return tokyoMs(prevDay(d.date), '20:00');
  if (rem === 'am') return tokyoMs(d.date, '08:00');
  const t = tokyoMs(d.date, d.time!);
  return rem === 'b10' ? t - 10 * 60_000 : rem === 'b60' ? t - 60 * 60_000 : t;
}

/** Where a due falls from `today` (Tokyo, `YYYY-MM-DD`): before it, on it, the day after, or later (its time ignored:
 *  a timed due earlier today is still `today`). Null: a bad due. */
export function dayOf(due: string, today: LocalDate): 'past' | 'today' | 'tomorrow' | 'later' | null {
  const d = dueOf(due);
  if (!d) return null;
  return d.date < today ? 'past' : d.date === today ? 'today' : d.date === nextDay(today) ? 'tomorrow' : 'later';
}

/** The HUD disc's number (components/todo/TodoDisc.svelte): the undone items due on or before `today`; `over`: some
 *  before it. */
export function dueCount(items: readonly { done: boolean; due?: string }[], today: LocalDate): { n: number; over: boolean } {
  let n = 0, over = false;
  for (const it of items) {
    const day = !it.done && it.due ? dayOf(it.due, today) : null;
    if (day === 'past') (n++, (over = true));
    else if (day === 'today') n++;
  }
  return { n, over };
}
