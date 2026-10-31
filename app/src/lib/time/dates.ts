// Calendar helpers. Asia/Tokyo is UTC+9 with no DST, so a fixed offset is exact.
import type { LocalDate, WeekKey } from '#lib/types.ts';
import { DATE_RE } from '../contract/api.ts';

export const ZONE_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse an ISO instant or a compact-offset timestamp (`2026-11-02 07:15:00 +0900`) to epoch ms. Without an offset
 * (a hand-pasted cell, `?date=`) it is Tokyo wall-clock time, a bare date Tokyo midnight (never UTC, as `Date.parse`
 * reads a bare date).
 */
export function parseInstant(ts: string): number {
  // Fast path: the server's own `at` (`2026-11-02T07:15:00.000Z`), nearly everything the model parses.
  const fast = serverAt(ts);
  if (fast !== null) return fast;
  let s = ts.trim();
  // "YYYY-MM-DD HH:MM:SS +HHMM" → "YYYY-MM-DDTHH:MM:SS+HH:MM"
  const compact = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\s*([+-])(\d{2}):?(\d{2})$/.exec(s);
  if (compact) {
    s = `${compact[1]}T${compact[2]}${compact[3]}${compact[4]}:${compact[5]}`;
  } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    // No offset at all: treat as Tokyo wall-clock time (never the server's zone).
    s = `${s.replace(' ', 'T')}+09:00`;
  } else if (DATE_RE.test(s)) {
    s = `${s}T00:00:00+09:00`;
  } else if (/^\d{4}-\d{2}-\d{2} /.test(s)) {
    s = s.replace(' ', 'T');
  }
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw new Error(`Unparseable timestamp: ${ts}`);
  return ms;
}

const digit = (s: string, i: number): number => s.charCodeAt(i) - 48;
const two = (s: string, i: number): number => digit(s, i) * 10 + digit(s, i + 1);
/** `YYYY-MM-DDTHH:MM:SS.sssZ` with every field in range: its epoch ms without `Date.parse` (4× faster); else null. */
function serverAt(s: string): number | null {
  if (s.length !== 24 || s[4] !== '-' || s[7] !== '-' || s[10] !== 'T' || s[13] !== ':' || s[16] !== ':' || s[19] !== '.' || s[23] !== 'Z') return null;
  for (const i of SERVER_AT_DIGITS) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) return null;
  }
  const y = two(s, 0) * 100 + two(s, 2), m = two(s, 5), d = two(s, 8), h = two(s, 11), mi = two(s, 14), sec = two(s, 17);
  // Days 29–31 are left to Date.parse (month lengths); the rest is exact.
  if (m < 1 || m > 12 || d < 1 || d > 28 || h > 23 || mi > 59 || sec > 59) return null;
  // Days from 1970-01-01 of a proleptic Gregorian date (H. Hinnant's days_from_civil).
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1;
  const days = era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
  return days * DAY_MS + ((h * 60 + mi) * 60 + sec) * 1000 + digit(s, 20) * 100 + two(s, 21);
}
const SERVER_AT_DIGITS = [0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 22];

/** `parseInstant`, or null for an empty or unreadable value (a hand-edited cell). */
export function instantOrNull(v: unknown): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  try {
    return parseInstant(s);
  } catch {
    return null;
  }
}

function ymd(d: Date): LocalDate {
  const y = String(d.getUTCFullYear()).padStart(4, '0');
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// The model does calendar arithmetic on the same few thousand dates over and over (weeks × days × cutoffs): memoize
// the pure date → ms and date → week steps. Bounded by the dates the app ever sees.
const DATE_MS = new Map<string, number>();
const WEEK_OF = new Map<string, WeekKey>();

/** LocalDate → epoch ms at UTC midnight (for calendar arithmetic; format the result in UTC). */
export function dateMs(date: LocalDate): number {
  let ms = DATE_MS.get(date);
  if (ms === undefined) {
    if (!DATE_RE.test(date)) throw new Error(`Invalid LocalDate: ${date}`);
    const [y, m, d] = date.split('-').map(Number);
    DATE_MS.set(date, (ms = Date.UTC(y, m - 1, d)));
  }
  return ms;
}

const LOCAL_DAY = new Map<number, LocalDate>();
/** Epoch ms → local date in Asia/Tokyo. */
export function localDateAt(ms: number): LocalDate {
  const day = Math.floor((ms + ZONE_OFFSET_MS) / DAY_MS);
  let d = LOCAL_DAY.get(day);
  if (d === undefined) LOCAL_DAY.set(day, (d = ymd(new Date(day * DAY_MS))));
  return d;
}

/** ISO timestamp (with offset) → local date in Asia/Tokyo. */
export function toLocalDate(iso: string): LocalDate {
  return localDateAt(parseInstant(iso));
}

export function addDays(date: LocalDate, n: number): LocalDate {
  return ymd(new Date(dateMs(date) + n * DAY_MS));
}

/** Monday of the week containing `date`. */
export function weekKeyOf(date: LocalDate): WeekKey {
  let wk = WEEK_OF.get(date);
  if (wk === undefined) {
    const dow = new Date(dateMs(date)).getUTCDay(); // 0 = Sunday
    WEEK_OF.set(date, (wk = addDays(date, -((dow + 6) % 7))));
  }
  return wk;
}

/** The seven dates Mon..Sun of a week. */
export function weekDays(weekKey: WeekKey): LocalDate[] {
  const monday = weekKeyOf(weekKey);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Epoch ms of a Tokyo wall-clock time on `date`. */
export function jstMs(date: LocalDate, hour: number, minute: number): number {
  return dateMs(date) - ZONE_OFFSET_MS + (hour * 60 + minute) * 60_000;
}

/** Whole days from `a` to `b`. */
export const daysBetween = (a: LocalDate, b: LocalDate): number => Math.round((dateMs(b) - dateMs(a)) / DAY_MS);

/** Whether a date's `MM-DD` falls in [from, to] (inclusive), handling ranges that wrap past New Year. */
export function inMonthDayRange(date: LocalDate, from: string, to: string): boolean {
  const md = date.slice(5);
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}
