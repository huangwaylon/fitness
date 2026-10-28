// Tiny homegrown i18n: two flat catalogs, `{param}` interpolation, yen + date formatting.
import ja from './ja.json';
import en from './en.json';
import { i18n, setLocale, type Locale } from './state.svelte.ts';

export { i18n, setLocale, type Locale };

type Catalog = Record<string, string>;
const catalogs: Record<Locale, Catalog> = { ja, en };

export type Params = Record<string, string | number | null | undefined>;

function interpolate(msg: string, params?: Params): string {
  if (!params) return msg.replace(/\{\w+\}/g, '');
  return msg.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

/** True when the key exists in the current (or default) catalog. */
export function has(key: string, locale: Locale = i18n.locale): boolean {
  return key in catalogs[locale] || key in catalogs.ja;
}

/** Translate `key`; falls back to Japanese, then to the key itself. */
export function t(key: string, params?: Params, locale: Locale = i18n.locale): string {
  const msg = catalogs[locale][key] ?? catalogs.ja[key];
  if (msg === undefined) return key;
  return interpolate(msg, params);
}

/** Juniper's line: the server picks the key; unknown keys fall back to `juniper.default`. */
export function juniperLine(key: string, params?: Params): string {
  const full = key.startsWith('juniper.') ? key : `juniper.${key}`;
  if (!has(full)) return t('juniper.default');
  const p = { ...params };
  if (typeof p.rung === 'string') p.rung = t(`rung.${p.rung}`);
  if (typeof p.yen === 'number') p.yen = formatYen(p.yen);
  return t(full, p);
}

/** `¥128,000` with a half-width yen sign (Intl ja-JP yields full-width ￥). */
export function formatYen(amount: number): string {
  const s = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
  return s.replace(/￥/g, '¥');
}

/** Plain grouped number (no currency). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(n);
}

/** Parse `YYYY-MM-DD` as a calendar date (UTC midnight, formatted in UTC so it never shifts). */
export function parseLocalDate(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

/** ISO weekday 1 (Mon) … 7 (Sun) of a `YYYY-MM-DD`. */
export function isoWeekday(d: string): number {
  const wd = parseLocalDate(d).getUTCDay();
  return wd === 0 ? 7 : wd;
}

export function addDays(d: string, n: number): string {
  const dt = parseLocalDate(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** `10月28日(水)` / `Wed, Oct 28`. */
export function formatDate(d: string, locale: Locale = i18n.locale): string {
  const dt = parseLocalDate(d);
  if (locale === 'ja') {
    return `${dt.getUTCMonth() + 1}月${dt.getUTCDate()}日(${t('weekday.' + isoWeekday(d), undefined, 'ja')})`;
  }
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(dt);
}

/** Short weekday label for a date (`水` / `Wed`). */
export function weekdayShort(d: string): string {
  return t('weekday.' + isoWeekday(d));
}

const ZONE = 'Asia/Tokyo';

/** 24 h JST time; prefixed with the date when it isn't today. */
export function formatSyncTime(iso: string | Date | null, today?: string, locale: Locale = i18n.locale): string {
  if (!iso) return t('sync.never');
  const dt = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(dt.getTime())) return t('sync.never');
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONE }).format(dt);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(dt); // YYYY-MM-DD
  if (!today || day === today) return time;
  return `${formatDate(day, locale)} ${time}`;
}
