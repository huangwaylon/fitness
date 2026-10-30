// Date and time formatting, one place for each shape (round 8). Dates are `YYYY-MM-DD` strings (calendar days, read
// in UTC so they never shift); stamps (sync, workouts, edits) are shown in Tokyo time.
import { i18n, t, type Locale } from './index.ts';
import { addDays, dateMs } from '#lib/time/dates.ts';
import { jst } from '#lib/time/clock.ts';

/** ISO weekday of a `YYYY-MM-DD`: 1 = Monday … 7 = Sunday. */
const isoWeekday = (d: string): number => new Date(dateMs(d)).getUTCDay() || 7;
/** `水` / `Wed`. */
export const weekdayOf = (d: string, locale: Locale = i18n.locale): string => t(`weekday.${isoWeekday(d)}`, undefined, locale);
/** `10/28`. */
const md = (d: string): string => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
/** A week from its Monday: `10/26–11/1`. */
export const weekRange = (wk: string): string => t('kiroku.range', { a: md(wk), b: md(addDays(wk, 6)) });

/** `10月28日(水)` / `Wed, Oct 28`. */
export function formatDate(d: string, locale: Locale = i18n.locale): string {
  if (locale === 'ja') return `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日(${weekdayOf(d, 'ja')})`;
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(dateMs(d)));
}

/** The device clock (HUD, しまフォン status row): `9:05`. */
export const clockTime = (d: Date): string => {
  const { hour, minute } = jst(d);
  return `${hour}:${String(minute).padStart(2, '0')}`;
};

const ZONE = 'Asia/Tokyo';
const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONE });
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }); // YYYY-MM-DD
/** A stamp's 24 h Tokyo time: `21:04`. */
export const timeOf = (at: number | string | Date): string => hm.format(new Date(at));
/** `10/22 21:04` (Tokyo). */
export const stampOf = (at: number): string => `${md(ymd.format(new Date(at)))} ${timeOf(at)}`;

/** A sync time: 24 h Tokyo, prefixed with the date when it isn't `today`. */
export function formatSyncTime(iso: string | Date | null, today?: string, locale: Locale = i18n.locale): string {
  if (!iso) return t('sync.never');
  const dt = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(dt.getTime())) return t('sync.never');
  const day = ymd.format(dt);
  if (!today || day === today) return timeOf(dt);
  return `${formatDate(day, locale)} ${timeOf(dt)}`;
}

const ordinal = new Intl.PluralRules('en-US', { type: 'ordinal' });
const ORD_SUFFIX: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'st', two: 'nd', few: 'rd' };
/** An escalating treat's count this week: 「こんしゅう 2かいめ」 / "2nd this week". */
export const nthThisWeek = (n: number): string => t('menu.nth', { n, ord: `${n}${ORD_SUFFIX[ordinal.select(n)] ?? 'th'}` });
