// A trip's dates in the reader's locale (the list, a trip's header, the day cards, a row on another date): '2月11日(木) –
// 16日(火)', '10月10日 – 12日'; 'Feb 10'.
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

/** A YYYY-MM-DD `dd` days on (−1, 1), without its weekday: 'Feb 10', '2/10'. */
export const dateOn = (date: string, dd: number, locale: Locale): string => fmt(addDays(date, dd), locale, false);

const parts = (date: string) => date.split('-').map(Number) as [number, number, number];
const WD_JA = ['日', '月', '火', '水', '木', '金', '土'];
const wdOf = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
const enFmt = new Map<string, Intl.DateTimeFormat>();
function en(date: string, o: Intl.DateTimeFormatOptions): string {
  const k = JSON.stringify(o);
  let f = enFmt.get(k);
  if (!f) enFmt.set(k, (f = new Intl.DateTimeFormat('en-US', { ...o, timeZone: 'UTC' })));
  const [y, m, d] = parts(date);
  return f.format(Date.UTC(y, m - 1, d, 12));
}

/** A trip's span in the list: '2月11日(木) – 16日(火)' (the month again when it changes), 'Thu, Feb 11 – Tue, Feb 16'. */
export function listSpan(start: string, end: string, locale: Locale): string {
  if (locale !== 'ja') return `${en(start, { weekday: 'short', month: 'short', day: 'numeric' })} – ${en(end, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  const [y1, m1, d1] = parts(start), [y2, m2, d2] = parts(end);
  return `${m1}月${d1}日(${WD_JA[wdOf(y1, m1, d1)]}) – ${m2 !== m1 ? `${m2}月` : ''}${d2}日(${WD_JA[wdOf(y2, m2, d2)]})`;
}

/** A trip's span in its header: '10月10日 – 12日', 'Oct 10 – 12' (the month again when it changes). */
export function shortSpan(start: string, end: string, locale: Locale): string {
  const [, m1, d1] = parts(start), [, m2, d2] = parts(end);
  if (locale !== 'ja') return `${en(start, { month: 'short', day: 'numeric' })} – ${m2 !== m1 ? en(end, { month: 'short', day: 'numeric' }) : d2}`;
  return `${m1}月${d1}日 – ${m2 !== m1 ? `${m2}月` : ''}${d2}日`;
}

/** A day's date in its card's head: the day of the month, the month ('10月', 'Oct') and the weekday ('土', 'Sat'). */
export function dayParts(date: string, locale: Locale): { d: number; m: string; wd: string } {
  const [y, m, d] = parts(date);
  return locale === 'ja' ? { d, m: `${m}月`, wd: WD_JA[wdOf(y, m, d)] } : { d, m: en(date, { month: 'short' }), wd: en(date, { weekday: 'short' }) };
}
