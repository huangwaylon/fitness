// Small formatters shared by the きろく screens (numbers, kcal); dates: i18n/when.ts (a day title), i18n/format.ts.
import { formatNum, t } from '#lib/i18n/index.ts';

export const num = (n: number | null) => (n === null ? '–' : formatNum(n));

/** Calories: `1,234 kcal`. */
export const kcalText = (n: number): string => t('kiroku.kcal', { n: formatNum(n) });

