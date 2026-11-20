// A link's expiry in the visitor's words: '2027/11/20' (日本語), 'Nov 20, 2027' (English), Tokyo's day.
import type { Locale } from '#lib/i18n/index.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';

const EN = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function untilDate(exp: string, locale: Locale): string {
  const ms = Date.parse(exp);
  if (Number.isNaN(ms)) return '';
  const d = localDateAt(ms);
  return locale === 'ja' ? `${d.slice(0, 4)}/${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : EN.format(Date.parse(`${d}T12:00:00Z`));
}
