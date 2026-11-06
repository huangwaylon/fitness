// A trip's dates in the reader's locale (the boarding pass, the day cards): '10/10(土)', 'Sat, Oct 10'.
type Locale = 'ja' | 'en';

const fmts = new Map<string, Intl.DateTimeFormat>();
/** A YYYY-MM-DD as the reader writes it, with its weekday. */
export function dayLabel(date: string, locale: Locale): string {
  let f = fmts.get(locale);
  if (!f) fmts.set(locale, (f = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', { month: locale === 'ja' ? 'numeric' : 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' })));
  const [y, m, d] = date.split('-').map(Number);
  return f.format(Date.UTC(y, m - 1, d, 12));
}

/** A trip's span: '10/10(土) – 10/12(月)'. */
export const spanLabel = (start: string, end: string, locale: Locale): string => `${dayLabel(start, locale)} – ${dayLabel(end, locale)}`;
