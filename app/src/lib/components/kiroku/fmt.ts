// Small formatters shared by the きろく screens (dates in Tokyo, the change-log line).
import type { EditLog } from '#lib/model/history.ts';
import { addDays } from '#lib/scoring/index.ts';
import { workoutLabel } from '#lib/model/labels.ts';
import { i18n, t } from '#lib/i18n/index.ts';

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
export const weekRange = (wk: string) => t('kiroku.range', { a: md(wk), b: md(addDays(wk, 6)) });
export const weekdayOf = (d: string) => {
  const w = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))).getUTCDay() || 7;
  return t(`weekday.${w}`);
};
export const dayTitle = (d: string) => t('kiroku.dayTitle', { m: Number(d.slice(5, 7)), d: Number(d.slice(8, 10)), w: weekdayOf(d) });

const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' });
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
export const timeOf = (t: number | string) => hm.format(new Date(t));
/** `10/22 21:04` (Tokyo). */
export const stampOf = (t: number) => `${md(ymd.format(new Date(t)))} ${timeOf(t)}`;

export const num = (n: number | null) => (n === null ? '–' : n.toLocaleString('en-US'));
export const typeLabel = (type: string) => workoutLabel(type, i18n.locale);

/** Lock countdown for an open week: days (or hours on the last day). */
export function leftLabel(lockAt: number, now: number): string {
  const h = Math.max(0, Math.ceil((lockAt - now) / 3600_000));
  return h >= 24 ? t('kiroku.daysLeft', { n: Math.floor(h / 24) }) : t('kiroku.hoursLeft', { n: h });
}

/** One change-log line: field, before → after. */
export function editText(e: EditLog): { field: string; before: string; after: string } {
  const subject = e.field === 'checkin' ? t(`habit.${e.subject}`) : e.subject ? typeLabel(e.subject) : '';
  const field = t(`kiroku.field.${e.field}`, { subject });
  const v = (x: number | boolean | null): string => {
    if (x === null) return '–';
    if (typeof x === 'number') return e.field === 'steps' ? num(x) : t('kiroku.min', { n: x });
    if (e.field === 'workout_strength') return t(x ? 'kiroku.val.yes' : 'kiroku.val.no');
    if (e.field === 'workout_excluded') return t(x ? 'kiroku.val.out' : 'kiroku.val.in');
    return t(x ? 'kiroku.val.done' : 'kiroku.val.undone');
  };
  return { field, before: v(e.before), after: v(e.after) };
}
