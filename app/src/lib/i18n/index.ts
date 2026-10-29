// Tiny homegrown i18n: two flat catalogs, `{param}` interpolation, yen + date formatting.
import ja from './ja.json';
import en from './en.json';
import { i18n, setLocale, type Locale } from './state.svelte.ts';
import { dateMs } from '#lib/scoring/dates.ts';

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
function has(key: string, locale: Locale = i18n.locale): boolean {
  return key in catalogs[locale] || key in catalogs.ja;
}

/** Translate `key`; falls back to Japanese, then to the key itself. */
export function t(key: string, params?: Params, locale: Locale = i18n.locale): string {
  const msg = catalogs[locale][key] ?? catalogs.ja[key];
  if (msg === undefined) return key;
  return interpolate(msg, params);
}

/**
 * しずえ's (the host's) line. The server picks the key and still sends `juniper.*`; `host.*` and bare
 * keys work too. Unknown keys fall back to `host.default`. `{rung}` / `{fruit}` ids and `{yen}` amounts
 * are formatted; `n === 1` picks a `.one` variant when the catalog has one (en plurals).
 */
export function hostLine(key: string, params?: Params): string {
  const full = `host.${key.replace(/^(juniper|host)\./, '')}`;
  if (!has(full)) return t('host.default');
  const p = { ...params };
  if (typeof p.rung === 'string') p.rung = t(`rung.${p.rung}`);
  if (typeof p.activity === 'string') p.activity = t(`fruit.${p.activity}`);
  if (typeof p.fruit === 'string') p.fruit = t(`fruit.${p.fruit}.name`);
  if (typeof p.yen === 'number') p.yen = formatYen(p.yen);
  return t(p.n === 1 && has(`${full}.one`) ? `${full}.one` : full, p);
}

/** `¥128,000` with a half-width yen sign (Intl ja-JP yields full-width ￥). */
export function formatYen(amount: number): string {
  const s = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
  return s.replace(/￥/g, '¥');
}

/** `10月28日(水)` / `Wed, Oct 28`. */
export function formatDate(d: string, locale: Locale = i18n.locale): string {
  const dt = new Date(dateMs(d)); // UTC midnight, formatted in UTC so it never shifts
  if (locale === 'ja') {
    return `${dt.getUTCMonth() + 1}月${dt.getUTCDate()}日(${t('weekday.' + (dt.getUTCDay() || 7), undefined, 'ja')})`;
  }
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(dt);
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
