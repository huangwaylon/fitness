// Calendar helpers. Asia/Tokyo is UTC+9 with no DST, so a fixed offset is exact (SE round 3 §2).
import type { LocalDate, WeekKey } from '#lib/types.ts';

const ZONE_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse an ISO instant or a compact-offset timestamp (`2026-11-02 07:15:00 +0900`) to epoch ms. */
export function parseInstant(ts: string): number {
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

/** LocalDate → epoch ms at UTC midnight (used only for calendar arithmetic). */
function dateMs(date: LocalDate): number {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`Invalid LocalDate: ${date}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** ISO timestamp (with offset) → local date in Asia/Tokyo. */
export function toLocalDate(iso: string): LocalDate {
  return ymd(new Date(parseInstant(iso) + ZONE_OFFSET_MS));
}

export function addDays(date: LocalDate, n: number): LocalDate {
  return ymd(new Date(dateMs(date) + n * DAY_MS));
}

/** Monday of the week containing `date`. */
export function weekKeyOf(date: LocalDate): WeekKey {
  const dow = new Date(dateMs(date)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
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
