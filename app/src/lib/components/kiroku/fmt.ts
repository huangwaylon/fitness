// Small formatters shared by the きろく screens (the day title, numbers, the change-log line); dates: i18n/format.ts.
import type { EditLog } from '#lib/model/history.ts';
import { workoutLabel } from '#lib/model/labels.ts';
import { i18n, t } from '#lib/i18n/index.ts';
import { weekdayOf } from '#lib/i18n/format.ts';

export const dayTitle = (d: string) => t('kiroku.dayTitle', { m: Number(d.slice(5, 7)), d: Number(d.slice(8, 10)), w: weekdayOf(d) });

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
