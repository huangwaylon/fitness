// Tiny homegrown i18n: two flat catalogs, `{param}` interpolation, ベル formatting (dates and times: format.ts).
// Japanese is bundled; English is its own chunk, loaded the first time it's asked for.
import ja from './ja.json';
import { applyLocale, i18n, type Locale } from './state.svelte.ts';
import { swallowed } from '#lib/quiet.ts';

export { i18n, type Locale };

type Catalog = Record<string, string>;
const catalogs: Record<Locale, Catalog> = { ja, en: {} };

type English = () => Promise<{ default: Catalog }>;
/** The lazily loaded parts' English strings (addStrings), each a chunk of its own. */
const parts: English[] = [];
const partEnglish = (load: English): Promise<void> =>
  load().then((m) => {
    Object.assign(catalogs.en, m.default);
    i18n.rev++;
  });

let english: Promise<void> | null = null;
/** Load the English catalog (once), and every part's loaded so far. Lazily loaded parts may have added their English
 *  strings already: they stay. */
export const loadEnglish = (): Promise<void> =>
  (english ??= Promise.all([import('./en.json').then((m) => void (catalogs.en = { ...m.default, ...catalogs.en })), ...parts.map(partEnglish)]).then(
    () => {},
    (e: unknown) => {
      english = null;
      throw e;
    }
  ));

let wanted: Locale = 'ja';
/** Switch the language: Japanese at once, English once its catalog is in (until then the strings stay Japanese). */
export function setLocale(locale: Locale): void {
  wanted = locale;
  if (locale === 'ja') return applyLocale('ja');
  void loadEnglish().then(() => wanted === 'en' && applyLocale('en'), () => swallowed('i18n.en'));
}

type Params = Record<string, string | number | null | undefined>;

/** Strings merged in as they are (the tent's and the catalogue's names: their own loaders, one language each). */
export function addCatalog(extra: Record<Locale, Catalog>): void {
  Object.assign(catalogs.ja, extra.ja);
  Object.assign(catalogs.en, extra.en);
}

/** A lazily loaded part's own strings (kenkou.ts), merged in once its chunk loads: its Japanese at once, its English
 *  (`en`, a chunk of its own) fetched only once English is wanted (now, or at the switch); Japanese meanwhile. */
export function addStrings(ja: Catalog, en: English): void {
  Object.assign(catalogs.ja, ja);
  parts.push(en);
  if (english) void english.then(() => partEnglish(en)).catch(() => swallowed('i18n.en'));
}

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

/** The key whose string `text` is (in either language), or null: the log names a sheet by its title's key, never its
 *  text (sync/log.ts `use`). A walk over the catalog, once per sheet opened. */
export function keyOfText(text: string): string | null {
  for (const c of [catalogs.ja, catalogs.en]) for (const k in c) if (c[k] === text) return k;
  return null;
}

/** Translate `key`; falls back to Japanese, then to the key itself. */
export function t(key: string, params?: Params, locale: Locale = i18n.locale): string {
  void i18n.rev;
  const msg = catalogs[locale][key] ?? catalogs.ja[key];
  if (msg === undefined) return key;
  return interpolate(msg, params);
}

/**
 * しずえ's (the host's) line. The model picks the key (`host.*`); bare keys work too. Unknown keys fall back to
 * `host.default`. `{bells}` amounts are formatted.
 */
export function hostLine(key: string, params?: Params): string {
  const full = `host.${key.replace(/^host\./, '')}`;
  if (!has(full)) return t('host.default');
  const p = { ...params };
  if (typeof p.bells === 'number') p.bells = formatBells(p.bells);
  return t(full, p);
}

/** One formatter for every tile and row (making one is the cost). */
const NUM = new Intl.NumberFormat('en-US');

/** `1,234 ベル` / `1,234 Bells` (play money). `signed`: `+620 ベル` (a gain; a loss is always `−`). */
export function formatBells(amount: number, opts: { signed?: boolean } = {}): string {
  const n = Math.round(amount);
  const digits = NUM.format(Math.abs(n));
  const sign = n < 0 ? '−' : opts.signed && n > 0 ? '+' : '';
  return t('bells.amount', { n: sign + digits });
}

/** Just the digits with separators: `1,234` (when the unit is drawn apart, e.g. a big total). */
export const formatNum = (n: number): string => NUM.format(Math.round(n));

