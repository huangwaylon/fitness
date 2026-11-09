// A board post's date as its note shows it: NH's month/day (Tokyo's).
import { md } from '#lib/i18n/format.ts';
import { localDateAt } from '#lib/time/dates.ts';

export const postDate = (ms: number): string => md(localDateAt(ms));
