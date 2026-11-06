// Calendar days for the wedding board, and the only place a zone is resolved: ported from the old board's
// `src/lib/time.js` (~/Documents/other/wedding), its rules unchanged (its display formatters not: the sheet words its
// days through i18n, components/wedding/format.ts and i18n/format.ts formatDate, over these validated day strings).
//
// A task's `due` is a wall-clock day ('2027-04-18', no time, no offset: the contract's isLocalDate, never the old
// Sheet's '2027-04-18T00:00'). It means that date at the wedding, so whether it has passed is decided against the
// board's configured IANA zone, never the device's: the zone decides one thing, what today's date is (`todayIn`).
// Everything downstream compares two day strings (time/dates.ts daysBetween for the days between).

/** Used when the board has no `tz` setting and by every default. */
const FALLBACK_TIME_ZONE = 'Asia/Tokyo';

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
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

/** 'YYYY-MM' of a day ('' for none: it groups with the undated rows). */
export const monthOf = (day: string): string => day.slice(0, 7);

/** Today's date in the board's zone (`en-CA` yields YYYY-MM-DD). `nowMs` is passed in (the relay's clock). */
export function todayIn(timeZone: unknown, nowMs: number): string {
  return dayFormatter(resolveTimeZone(timeZone)).format(new Date(nowMs));
}

const HOUR_MS = 3_600_000;
const clockFormatters = new Map<string, Intl.DateTimeFormat>();

/** Ms from `nowMs` to the next midnight in the board's zone, at most an hour (a day a clock change shortens or
 *  lengthens: the caller looks again, todayIn deciding). */
export function untilMidnight(timeZone: unknown, nowMs: number): number {
  const tz = resolveTimeZone(timeZone);
  let f = clockFormatters.get(tz);
  if (!f) clockFormatters.set(tz, (f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' })));
  const [h, m, s] = f.format(new Date(nowMs)).split(':').map(Number);
  const into = ((h * 60 + m) * 60 + s) * 1000 + (((nowMs % 1000) + 1000) % 1000);
  return Math.max(1, Math.min(24 * HOUR_MS - into, HOUR_MS));
}
