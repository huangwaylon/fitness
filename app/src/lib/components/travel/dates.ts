// A trip's dates in the reader's locale (the boarding pass, the day cards, a row on another date): '10/10(土)',
// 'Sat, Oct 10'; 'Feb 10'.
import type { Locale } from '#lib/i18n/index.ts';
import { addDays } from '#lib/time/dates.ts';

const fmts = new Map<string, Intl.DateTimeFormat>();
function fmt(date: string, locale: Locale, weekday: boolean): string {
  const k = `${locale}${weekday ? 'w' : ''}`;
  let f = fmts.get(k);
  if (!f) fmts.set(k, (f = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', { month: locale === 'ja' ? 'numeric' : 'short', day: 'numeric', weekday: weekday ? 'short' : undefined, timeZone: 'UTC' })));
  const [y, m, d] = date.split('-').map(Number);
  return f.format(Date.UTC(y, m - 1, d, 12));
}

/** A YYYY-MM-DD as the reader writes it, with its weekday. */
export const dayLabel = (date: string, locale: Locale): string => fmt(date, locale, true);

/** A YYYY-MM-DD `dd` days on (−1, 1), without its weekday: 'Feb 10', '2/10'. */
export const dateOn = (date: string, dd: number, locale: Locale): string => fmt(addDays(date, dd), locale, false);

/** A trip's span: '10/10(土) – 10/12(月)'. */
export const spanLabel = (start: string, end: string, locale: Locale): string => `${dayLabel(start, locale)} – ${dayLabel(end, locale)}`;
