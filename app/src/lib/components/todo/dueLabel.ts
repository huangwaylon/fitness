// やること's due dates in words (docs/todo.md "The sheet"): the row's chip, the peek's rows, the form's default time and
// its 「… に通知」 line. All Tokyo wall clock (contract/todoDue.ts); dates as the app writes them, 11/24（月）.
// Pure over `today` (Tokyo `YYYY-MM-DD`) and the strings (todo.*).
import { dayOf, dueOf, fireAt, type Rem } from '#lib/contract/todoDue.ts';
import { clockAt, localDateAt } from '#lib/contract/tokyo.ts';
import { md, weekdayOf } from '#lib/i18n/format.ts';
import { t } from '#lib/i18n/index.ts';
import type { TodoItemView } from '#lib/contract/todo.ts';

/** `11/24（月）` / `11/24 (Mon)`. */
export const dayLabel = (date: string): string => t('todo.md', { md: md(date), w: weekdayOf(date) });

/** A clock without its leading zero: `9:30`, `15:00`. */
const clock = (hm: string): string => hm.replace(/^0(\d)/, '$1');
/** A day and a time: 「今日 15:00」, 「11/24（月）9:00」 (no space after a closing bracket). */
const withTime = (day: string, hm: string): string => `${day}${day.endsWith('）') ? '' : ' '}${clock(hm)}`;

/** The row's chip: 「今日 15:00」 「明日」 「11/24（月）9:00」 (a past one as a later one: its date). */
export function dueLabel(due: string, today: string): string {
  const d = dueOf(due);
  if (!d) return '';
  const k = dayOf(due, today);
  const day = k === 'today' ? t('todo.today') : k === 'tomorrow' ? t('todo.tomorrow') : dayLabel(d.date);
  return d.time ? withTime(day, d.time) : day;
}

/** The form's time when one is switched on: the next full hour on `today` (23:xx: 23:59, never the next day's 00:00),
 *  else 9:00. `nowMs`: the scene clock. */
export function defaultTime(date: string, today: string, nowMs: number): string {
  if (date !== today) return '09:00';
  const h = Number(clockAt(nowMs).slice(0, 2)) + 1;
  return h > 23 ? '23:59' : `${String(h).padStart(2, '0')}:00`;
}

/** The 通知 line: 「11/23（日）20:00 に通知」, or that it's already past. */
export function fireLine(due: string, rem: Rem, nowMs: number): string {
  const at = fireAt(due, rem);
  if (at === null) return '';
  const when = withTime(dayLabel(localDateAt(at)), clockAt(at));
  return t(at <= nowMs ? 'todo.firePast' : 'todo.fireAt', { when });
}

/** A row of the HUD's peek (TodoPeek): an item due before today, today or tomorrow. */
export interface DueRow { id: string; text: string; due: string; done: boolean; day: 'past' | 'today' | 'tomorrow' }
export interface PeekData { past: DueRow[]; today: DueRow[]; tomorrow: DueRow[] }

/** The peek's rows (docs/todo.md "The disc and the peek"): undone items due before today, today and tomorrow, and done
 *  ones in `kept` (ticked while it's open: struck through till it shuts); the past oldest first, each day timed first
 *  by time, then untimed, ties in list order. Undated never. */
export function peekOf(items: readonly TodoItemView[], today: string, kept: ReadonlySet<string> = new Set()): PeekData {
  const out: PeekData = { past: [], today: [], tomorrow: [] };
  for (const it of items) {
    if (!it.due || (it.done && !kept.has(it.id))) continue;
    const day = dayOf(it.due, today);
    if (day && day !== 'later') out[day].push({ id: it.id, text: it.text, due: it.due, done: it.done, day });
  }
  const key = (r: DueRow) => (r.day === 'past' ? r.due : (dueOf(r.due)?.time ?? '99:99'));
  for (const rows of [out.past, out.today, out.tomorrow]) rows.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  return out;
}

/** The peek's short when: a past one's date (11/2), else its time (15:00), else nothing. */
export function peekWhen(r: DueRow): string {
  const d = dueOf(r.due);
  if (!d) return '';
  if (r.day === 'past') return md(d.date);
  return d.time ? clock(d.time) : '';
}
