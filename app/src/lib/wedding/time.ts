// Calendar days for the wedding board, and the only place a zone is resolved: ported from the old board's
// `src/lib/time.js` (~/Documents/other/wedding), its rules unchanged.
//
// A task's `due` is a wall-clock day ('2027-04-18', no time, no offset). It means that date at the wedding, so whether
// it has passed is decided against the board's configured IANA zone, never the device's.
//   - Never `new Date('2027-04-18')`: it parses as UTC midnight and renders as the 17th west of Greenwich. Every Date
//     here is built from explicit parts.
//   - To format a day, build the instant from its parts as if they were UTC and format with `timeZone: 'UTC'`.
//   - The zone decides one thing: what today's date is (`todayIn`). Everything downstream compares two day strings.

/** The stored shape. */
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Used when the board has no `tz` setting and by every default. @public (the board's settings) */
export const FALLBACK_TIME_ZONE = 'Asia/Tokyo';

const MS_PER_DAY = 86_400_000;

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const displayFormatters = new Map<string, Intl.DateTimeFormat>();
/** Zone-name validity, memoised (`new Intl.DateTimeFormat` costs tens of microseconds). */
const zoneValidity = new Map<string, boolean>();

export function isValidTimeZone(name: unknown): name is string {
  if (!name || typeof name !== 'string') return false;
  const hit = zoneValidity.get(name);
  if (hit !== undefined) return hit;
  let valid = false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    valid = true;
  } catch {
    valid = false;
  }
  zoneValidity.set(name, valid);
  return valid;
}

export function resolveTimeZone(name: unknown): string {
  return isValidTimeZone(name) ? name : FALLBACK_TIME_ZONE;
}

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let format = dayFormatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    dayFormatters.set(timeZone, format);
  }
  return format;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export interface DayParts { year: number; month: number; day: number }

/** Parse and calendar-validate ('2027-02-31' matches the pattern and is not a date). */
export function parseDay(day: unknown): DayParts | null {
  const match = DAY_PATTERN.exec(String(day ?? ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (date < 1 || date > daysInMonth(year, month)) return null;
  return { year, month, day: date };
}

export function isValidDay(day: unknown): boolean {
  return parseDay(day) !== null;
}

/** What a person or a long-lived row might hold, in the stored shape ('' when it isn't a day). The `slice(0, 10)` is
 *  load-bearing: a cell the Sheets UI made a Date reached the old board as '2027-04-18T00:00'. */
export function normalizeDay(text: unknown): string {
  const raw = String(text ?? '').trim().slice(0, 10);
  return isValidDay(raw) ? raw : '';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** A day's parts, tolerating a clock time. */
function partsOf(day: unknown): DayParts | null {
  return parseDay(normalizeDay(day));
}

/** 'YYYY-MM' ('' for anything unusable: it groups with the undated rows). */
export function monthOf(day: unknown): string {
  const normalized = normalizeDay(day);
  return normalized ? normalized.slice(0, 7) : '';
}

/** The day of the month (0 if unusable). @public (the board's rows) */
export function dayOfMonth(day: unknown): number {
  return partsOf(day)?.day ?? 0;
}

/** A 'YYYY-MM' key back to a real day ('' if unusable). @public (the board's month headings) */
export function firstOfMonth(monthKey: unknown): string {
  const candidate = `${String(monthKey ?? '').trim()}-01`;
  return isValidDay(candidate) ? candidate : '';
}

/** Calendar-day arithmetic, zone-free ('' for an unusable day). @public (the board's settings) */
export function addDays(day: unknown, days: number): string {
  const parts = partsOf(day);
  if (!parts) return '';
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Whole calendar days from `from` to `to`, signed (null when either is unusable). */
export function daysBetween(from: unknown, to: unknown): number | null {
  const a = partsOf(from);
  const b = partsOf(to);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / MS_PER_DAY);
}

/** Today's date in the board's zone (`en-CA` yields YYYY-MM-DD). `nowMs` is passed in (the relay's clock). */
export function todayIn(timeZone: unknown, nowMs: number): string {
  return dayFormatter(resolveTimeZone(timeZone)).format(new Date(nowMs));
}

// ------------------------------------------------------------------ display

function asUtcDate(day: unknown): Date | null {
  const parts = partsOf(day);
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)) : null;
}

function displayFormatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const cacheKey = `${locale}|${JSON.stringify(options)}`;
  let format = displayFormatters.get(cacheKey);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options });
    displayFormatters.set(cacheKey, format);
  }
  return format;
}

function formatted(day: unknown, locale: string | undefined, options: Intl.DateTimeFormatOptions): string {
  const date = asUtcDate(day);
  return date ? displayFormatter(locale, options).format(date) : '';
}

/** 'Apr 18' / '4月18日'. @public (the board's rows) */
export function formatDay(day: unknown, { locale, year = false }: { locale?: string; year?: boolean } = {}): string {
  return formatted(day, locale, { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) });
}

/** 'Sat, 18 April 2027' / '2027年4月18日(土)': an open row. @public (the board's rows) */
export function formatDayLong(day: unknown, { locale }: { locale?: string } = {}): string {
  return formatted(day, locale, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

/** 'Oct' / '10月': a row's date column. @public (the board's rows) */
export function formatMonth(day: unknown, { locale }: { locale?: string } = {}): string {
  return formatted(day, locale, { month: 'short' });
}

/** The calendar year (null for anything unusable). @public (the board's rows) */
export function yearOf(day: unknown): number | null {
  return partsOf(day)?.year ?? null;
}

/** 'April 2027' / '2027年4月': the list's group headings. @public (the board's month headings) */
export function formatDayMonth(day: unknown, { locale }: { locale?: string } = {}): string {
  return formatted(day, locale, { year: 'numeric', month: 'long' });
}
