// Tiny homegrown i18n: two flat catalogs, `{param}` interpolation, yen formatting (dates and times: format.ts).
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

/**
 * しずえ's (the host's) line. The model picks the key (`host.*`); bare keys work too. Unknown keys fall back to `host.default`. `{rung}` / `{fruit}` ids and `{yen}` amounts
 * are formatted.
 */
export function hostLine(key: string, params?: Params): string {
  const full = `host.${key.replace(/^host\./, '')}`;
  if (!has(full)) return t('host.default');
  const p = { ...params };
  if (typeof p.rung === 'string') p.rung = t(`rung.${p.rung}`);
  if (typeof p.activity === 'string') p.activity = t(`fruit.${p.activity}`);
  if (typeof p.fruit === 'string') p.fruit = t(`fruit.${p.fruit}.name`);
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
