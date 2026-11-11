// A trip's dates in the reader's locale (the list, a trip's photo, the day cards and chips, a row on another date):
// '2月11日(木) – 16日(火)'; 'Feb 10'; '2/11'.
import type { Locale } from '#lib/i18n/index.ts';
import { addDays } from '#lib/time/dates.ts';
import { weekdayOf } from '#lib/i18n/format.ts';

const parts = (date: string) => date.split('-').map(Number) as [number, number, number];
const fmts = new Map<string, Intl.DateTimeFormat>();
/** `date` (noon UTC) in `locale` with `o`, each formatter made once. */
function fmt(date: string, locale: Locale, o: Intl.DateTimeFormatOptions): string {
  const k = locale + JSON.stringify(o);
  let f = fmts.get(k);
  if (!f) fmts.set(k, (f = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', { ...o, timeZone: 'UTC' })));
  const [y, m, d] = parts(date);
  return f.format(Date.UTC(y, m - 1, d, 12));
}
const en = (date: string, o: Intl.DateTimeFormatOptions): string => fmt(date, 'en', o);

/** A YYYY-MM-DD `dd` days on (−1, 1), without its weekday: 'Feb 10', '2/10'. */
export const dateOn = (date: string, dd: number, locale: Locale): string => fmt(addDays(date, dd), locale, { month: locale === 'ja' ? 'numeric' : 'short', day: 'numeric' });

/** A trip's span in the list: '2月11日(木)〜16日(火)' (the month again when it changes), 'Thu, Feb 11 – Tue, Feb 16'. */
export function listSpan(start: string, end: string, locale: Locale): string {
  if (locale !== 'ja') return `${en(start, { weekday: 'short', month: 'short', day: 'numeric' })} – ${en(end, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  const [, m1, d1] = parts(start), [, m2, d2] = parts(end);
  return `${m1}月${d1}日(${weekdayOf(start, 'ja')})〜${m2 !== m1 ? `${m2}月` : ''}${d2}日(${weekdayOf(end, 'ja')})`;
}

/** A day's date in its card's head: the day of the month, the month ('10月', 'Oct') and the weekday ('土', 'Sat'). */
export function dayParts(date: string, locale: Locale): { d: number; m: string; wd: string } {
  const [, m, d] = parts(date);
  return locale === 'ja' ? { d, m: `${m}月`, wd: weekdayOf(date, 'ja') } : { d, m: en(date, { month: 'short' }), wd: en(date, { weekday: 'short' }) };
}
