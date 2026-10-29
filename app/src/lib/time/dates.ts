// Calendar helpers. Asia/Tokyo is UTC+9 with no DST, so a fixed offset is exact.
import type { LocalDate, WeekKey } from '#lib/types.ts';
import { DATE_RE } from '../contract/api.ts';

const ZONE_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse an ISO instant or a compact-offset timestamp (`2026-11-02 07:15:00 +0900`) to epoch ms. */
export function parseInstant(ts: string): number {
  // Fast path: the server's own `at` (`2026-11-02T07:15:00.000Z`), most of what the model parses.
  if (ts.length === 24 && ts.charCodeAt(23) === 90 && ts.charCodeAt(10) === 84) {
    const ms = Date.parse(ts);
    if (!Number.isNaN(ms)) return ms;
  }
  let s = ts.trim();
  // "YYYY-MM-DD HH:MM:SS +HHMM" → "YYYY-MM-DDTHH:MM:SS+HH:MM"
  const compact = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\s*([+-])(\d{2}):?(\d{2})$/.exec(s);
  if (compact) {
    s = `${compact[1]}T${compact[2]}${compact[3]}${compact[4]}:${compact[5]}`;
  } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    // No offset at all: treat as Tokyo wall-clock time (never the server's zone).
    s = `${s.replace(' ', 'T')}+09:00`;
  } else if (/^\d{4}-\d{2}-\d{2} /.test(s)) {
    s = s.replace(' ', 'T');
  }
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw new Error(`Unparseable timestamp: ${ts}`);
  return ms;
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
export function localDateOfMs(ms: number): LocalDate {
  const day = Math.floor((ms + ZONE_OFFSET_MS) / DAY_MS);
  let d = LOCAL_DAY.get(day);
  if (d === undefined) LOCAL_DAY.set(day, (d = ymd(new Date(day * DAY_MS))));
  return d;
}

/** ISO timestamp (with offset) → local date in Asia/Tokyo. */
export function toLocalDate(iso: string): LocalDate {
  return localDateOfMs(parseInstant(iso));
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

/** Current local date/time parts in Asia/Tokyo (weekday 0 = Sunday). */
export function nowInZone(now: Date = new Date()): { date: LocalDate; weekday: number; hour: number; minute: number } {
  const t = new Date(now.getTime() + ZONE_OFFSET_MS);
  return { date: ymd(t), weekday: t.getUTCDay(), hour: t.getUTCHours(), minute: t.getUTCMinutes() };
}

/** Whether a date's `MM-DD` falls in [from, to] (inclusive), handling ranges that wrap past New Year. */
export function inMonthDayRange(date: LocalDate, from: string, to: string): boolean {
  const md = date.slice(5);
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}
