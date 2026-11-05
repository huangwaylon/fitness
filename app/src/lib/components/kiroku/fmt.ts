// Small formatters shared by the きろく screens (the day title, numbers, kcal, a month); dates: i18n/format.ts.
import { formatNum, i18n, t } from '#lib/i18n/index.ts';
import { weekdayOf } from '#lib/i18n/format.ts';

export const dayTitle = (d: string) => t('kiroku.dayTitle', { m: Number(d.slice(5, 7)), d: Number(d.slice(8, 10)), w: weekdayOf(d) });

export const num = (n: number | null) => (n === null ? '–' : formatNum(n));

/** Calories: `1,234 kcal`. */
export const kcalText = (n: number): string => t('kiroku.kcal', { n: formatNum(n) });

/** A month, for a projected goal date: `2027年3月` / `Mar 2027`. */
export function monthText(d: string): string {
  if (i18n.locale === 'ja') return `${d.slice(0, 4)}年${Number(d.slice(5, 7))}月`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
}
