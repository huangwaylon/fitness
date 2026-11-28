// Money as whole yen and shares as basis points (contract/finance.ts), ported from the shared-expense app's money.js:
// reading what a person types (an amount, a share), showing yen, summing. One currency, so nothing takes one: no scale
// to guess, no 100× error to make. Functions taking yen throw rather than let NaN reach a balance; only the readers of
// human input answer null. The split itself is the contract's (finSplit), shared with the record's nightly check.
// Pure.
import { FIN_BP } from '#lib/contract/finance.ts';

/** Blank space (NBSP and the thin spaces too) and any currency sign. */
const NOISE = /[\s\u00a0\u202f\u2009]|\p{Sc}/gu;
const NUMERIC_ONLY = /^[0-9.,]+$/;
/** An integer part's digits at most: inside Number.MAX_SAFE_INTEGER. */
const MAX_INT_DIGITS = 13;
/** A share, its trailing `%` off: digits with at most one dot, nothing else. */
const SHARE_TEXT = /^\d*\.?\d+$/;

function assertYen(yen: number, name = 'yen'): number {
  if (!Number.isInteger(yen)) throw new TypeError(`${name} must be an integer number of yen, got ${String(yen)}`);
  return yen;
}

/**
 * Which separator, if any, is the decimal point (-1: none). Both kinds: the last, so "1,234.56" and "1.234,56" are
 * both 1234.56. Commas only: decimal unless exactly three digits follow (grouping: "42,10" is 42.10, "1,234" is 1234).
 * Dots only: one is decimal, repeated ones group.
 */
function decimalSeparatorIndex(s: string): number {
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot < 0 && lastComma < 0) return -1;
  const last = Math.max(lastDot, lastComma);
  const bothKinds = lastDot >= 0 && lastComma >= 0;
  const sep = s[last];
  const repeated = sep === '.' ? s.indexOf('.') !== lastDot : s.indexOf(',') !== lastComma;
  const groupingOnly = !bothKinds && s.length - last - 1 === 3 && (sep === ',' || repeated);
  return groupingOnly ? -1 : last;
}

/**
 * Whatever a person types on a phone (or a bank's CSV prints: "1400.000000") as whole yen, a decimal part rounded half
 * up on its first digit (in digits, so exact). An amount is a magnitude (the payer is the direction): null, never NaN,
 * for junk, malformed grouping, a sign, exponents, or past 13 digits. 0 reads as 0 (the forms refuse it: isFinYen).
 */
export function parseYen(input: unknown): number | null {
  let raw: string;
  if (typeof input === 'string') raw = input;
  else if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null;
    raw = String(input);
    if (/e/i.test(raw)) return null;
  } else return null;

  const cleaned = raw.replace(NOISE, '');
  if (!cleaned || cleaned[0] === '-' || cleaned[0] === '\u2212') return null;
  const body = cleaned[0] === '+' ? cleaned.slice(1) : cleaned;
  if (!NUMERIC_ONLY.test(body)) return null;

  const dec = decimalSeparatorIndex(body);
  const intPart = dec < 0 ? body : body.slice(0, dec);
  const fracPart = dec < 0 ? '' : body.slice(dec + 1);
  if (!/^\d*$/.test(fracPart)) return null;

  // grouping: the first group free, every later one exactly three digits
  const groups = intPart.length ? intPart.split(/[.,]/) : [];
  if (groups.length > 1 && groups[0] === '') return null;
  if (!groups.every((g, i) => (i === 0 ? /^\d*$/ : /^\d{3}$/).test(g))) return null;

  const digits = groups.join('');
  if (!digits.length && !fracPart.length) return null;
  if (digits.replace(/^0+/, '').length > MAX_INT_DIGITS) return null;
  const yen = Number(digits || '0') + (Number(fracPart[0] ?? '0') >= 5 ? 1 : 0);
  return Number.isSafeInteger(yen) ? yen : null;
}

/** Formatters by locale (the currency and its zero fraction digits fixed): one per amount on screen is costly. */
const FORMATTERS = new Map<string, Intl.NumberFormat>();

/** Whole yen as "¥1,250" in `locale` (never the device's: an en-NZ phone would show "JP¥"). For people, never stored. */
export function formatYen(yen: number, locale = 'ja'): string {
  let f = FORMATTERS.get(locale);
  // the fraction digits stated, not left to ICU: what a person reads mustn't vary with its version
  if (!f) FORMATTERS.set(locale, (f = new Intl.NumberFormat(locale, { style: 'currency', currency: 'JPY', minimumFractionDigits: 0, maximumFractionDigits: 0 })));
  return f.format(assertYen(yen));
}

/**
 * A share a person or a spreadsheet wrote, as a fraction in [0, 1], or null for junk (so the caller's default wins).
 * Above 1 is a percentage, as is anything with a trailing `%` (`1%` a hundredth, `80` and `80%` 0.8); past 100 %
 * clamps. The whole string must be a number (`0,5` is refused, never read as 0: the payer covering nothing).
 */
export function parseShare(value: unknown): number | null {
  let raw: number;
  let percent = false;
  if (typeof value === 'number') raw = value;
  else if (typeof value === 'string') {
    const t = value.trim();
    percent = t.endsWith('%');
    const text = percent ? t.slice(0, -1) : t;
    if (!SHARE_TEXT.test(text)) return null;
    raw = Number(text);
  } else return null;
  if (!Number.isFinite(raw) || raw < 0) return null;
  return Math.min(1, Math.max(0, percent || raw > 1 ? raw / 100 : raw));
}

/** A fraction in [0, 1] as basis points (the nearest), and whether that's exactly the fraction: 0.8 → 8000 exact,
 *  1/3 → 3333 not (the import reports each row that isn't). Throws outside [0, 1]. */
export function shareToBp(fraction: number): { bp: number; exact: boolean } {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new TypeError(`a share is a fraction in [0, 1], got ${String(fraction)}`);
  const bp = Math.round(fraction * FIN_BP);
  return { bp, exact: bp / FIN_BP === fraction };
}

/** A share a person typed (parseShare) as basis points, rounded to the nearest; null for junk. */
export function parseShareBp(value: unknown): number | null {
  const f = parseShare(value);
  return f === null ? null : shareToBp(f).bp;
}

/** Whole yen summed (0 for none); throws on a non-integer or past the safe range rather than answer NaN. */
export function sumYen(list: readonly number[]): number {
  let total = 0;
  list.forEach((y, i) => (total += assertYen(y, `sumYen[${i}]`)));
  if (!Number.isSafeInteger(total)) throw new RangeError('sumYen overflowed the safe integer range');
  return total;
}
