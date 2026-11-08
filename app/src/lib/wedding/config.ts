// The wedding board's settings as the board reads them: the record's (contract/wedding.ts wedConfig) over the
// defaults, as the old board's `config.js` mergeConfig (a setting never set, or cleared, is its default; the categories
// cleared are the starter list again: contract/wedCats.ts, in Japanese; an old English starter name read in Japanese).
import type { WConfKey } from '#lib/contract/wedding.ts';
import { resolveTimeZone } from '#lib/time/zone.ts';
import { CATEGORIES, catNames } from '#lib/contract/wedCats.ts';

export interface BoardConfig {
  /** The two names ('' : not set). */
  p1: string;
  p2: string;
  /** The wedding day, 'YYYY-MM-DD' or ''. */
  date: string;
  /** Its time, 'HH:MM' or ''. */
  time: string;
  venue: string;
  /** The zone the board's today is read in (a valid IANA name: an unknown one is the default). */
  tz: string;
  cats: string[];
}

export function boardConfig(raw: Partial<Record<WConfKey, string | string[]>>): BoardConfig {
  const text = (k: WConfKey): string => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const cats = Array.isArray(raw.cats) && raw.cats.length ? catNames(raw.cats) : [...CATEGORIES];
  return { p1: text('p1'), p2: text('p2'), date: text('date'), time: text('time'), venue: text('venue'), tz: resolveTimeZone(raw.tz), cats };
}
