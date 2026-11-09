// Small formatters shared by the きろく screens (the day title, numbers, kcal); dates: i18n/format.ts.
import { formatNum, t } from '#lib/i18n/index.ts';
import { weekdayOf } from '#lib/i18n/format.ts';

export const dayTitle = (d: string) => t('kiroku.dayTitle', { m: Number(d.slice(5, 7)), d: Number(d.slice(8, 10)), w: weekdayOf(d) });

export const num = (n: number | null) => (n === null ? '–' : formatNum(n));

/** Calories: `1,234 kcal`. */
export const kcalText = (n: number): string => t('kiroku.kcal', { n: formatNum(n) });

