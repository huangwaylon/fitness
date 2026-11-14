// The app's short day, `11/4（水）` / `Wed 11/4` (a list's or a heading's day, every sheet's: the long one, `11月4日（水）`, is
// format.ts formatDate), and the bots' times and durations (docs/design.md "Bots": one vocabulary on the three
// pages), Tokyo's clock: today `11:54`, another day `11/4（水）2:41` (a key row's cell may break after the day), a future
// one with ごろ (the caller's words); `4時間12分`, `12分`, `40秒`. The times need bots.* (bots.ts: each bot's lib loads it).
import { t } from './index.ts';
import { ZONE_OFFSET_MS, localDateAt } from '../time/dates.ts';

const tokyo = (ms: number): Date => new Date(ms + ZONE_OFFSET_MS);
/** `2:41`. */
function clockOf(ms: number): string {
  const d = tokyo(ms);
  return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
/** `11/4`. */
export const mdOf = (ms: number): string => `${tokyo(ms).getUTCMonth() + 1}/${tokyo(ms).getUTCDate()}`;
/** `11/4（水）` / `Wed 11/4`. */
export const shortDayAt = (ms: number): string => t('fmt.day', { md: mdOf(ms), wd: t(`weekday.${tokyo(ms).getUTCDay() || 7}`) });
/** A `YYYY-MM-DD` as shortDayAt: `11/22（日）` (the bots' one date form, compact; a heading's month: format.ts monthLabel). */
export const shortDay = (date: string): string => shortDayAt(Date.parse(`${date}T12:00:00+09:00`));
/** `11/4（水）2:41`, always with the day. */
export const whenOf = (ms: number): string => t('bots.fmt.when', { day: shortDayAt(ms), time: clockOf(ms) });
/** `11:54` on `now`'s day (Tokyo), else whenOf. */
export const timeOf = (ms: number, now: number): string => (localDateAt(ms) === localDateAt(now) ? clockOf(ms) : whenOf(ms));

/** `4時間12分`, `12分`, `40秒` (`seconds` false: under a minute is 0分). */
export function durationOf(ms: number, seconds = true): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (seconds && s < 60) return t('bots.dur.s', { s });
  const m = seconds ? Math.floor(s / 60) : Math.round(s / 60);
  return m < 60 ? t('bots.dur.m', { m }) : t('bots.dur.hm', { h: Math.floor(m / 60), m: m % 60 });
}
