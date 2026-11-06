// りょこう's clock (docs/travel.md "The sheet"): where a trip stands against now, in the trip's own time zone (its
// dates and row times are local to `trip.tz`, never Tokyo's): the boarding pass's 「あと 97にち」 / 「いま 2日目」 /
// おもいで, the list's order, the day card open today and the timeline row that is now (NZ's flights cross midnight:
// a row's `dd` puts it on the eve or the morning after its day). Pure: `now` is an instant (ms) handed in.
import type { Day, DayRow, Trip } from '#lib/travel/types.ts';

/** The wall clock of an instant in a zone: `YYYY-MM-DD` and the minutes after midnight. */
export function wallIn(tz: string, ms: number): { date: string; min: number } {
  const p = parts(tz, ms);
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, min: p.h * 60 + p.mi };
}

/** The instant a local wall time in `tz` is (`date` YYYY-MM-DD, `min` minutes after its midnight, may run past 24 h
 *  or below 0). A time skipped by a DST jump lands an hour on; a repeated one takes its first. */
export function instantIn(tz: string, date: string, min: number): number {
  const [y, mo, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, mo - 1, d) + min * 60_000;
  let at = guess - offsetOf(tz, guess);
  at = guess - offsetOf(tz, at);
  return at;
}

/** Whole days from `a` to `b` (YYYY-MM-DD). */
export const daysFrom = (a: string, b: string): number => Math.round((Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))) / 86_400_000);

/** A row's time as written ('06:10', '~12:00', '<21:00', '9:36') in minutes after midnight, or null (none: '' or
 *  a bullet). */
export function rowMin(t: string | undefined): number | null {
  const m = /(\d{1,2}):(\d{2})/.exec(t ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export type Phase =
  /** before the first day: whole days to go (1: tomorrow) */
  | { k: 'soon'; days: number }
  /** on day `day` of the trip (1-based) */
  | { k: 'now'; day: number }
  | { k: 'past' };

/** Where the trip stands on its own calendar today. */
export function phaseOf(trip: Pick<Trip, 'start' | 'end' | 'tz'>, now: number): Phase {
  const today = wallIn(trip.tz, now).date;
  const to = daysFrom(today, trip.start);
  if (to > 0) return { k: 'soon', days: to };
  if (daysFrom(today, trip.end) >= 0) return { k: 'now', day: 1 - to };
  return { k: 'past' };
}

/** The list's order: on now first, then the coming ones soonest first, then the past newest first (おもいで). */
export function sortTrips<T extends Pick<Trip, 'start' | 'end' | 'tz'>>(trips: readonly T[], now: number): { coming: T[]; past: T[] } {
  const coming = trips.filter((t) => phaseOf(t, now).k !== 'past').sort((a, b) => a.start.localeCompare(b.start));
  const past = trips.filter((t) => phaseOf(t, now).k === 'past').sort((a, b) => b.start.localeCompare(a.start));
  return { coming, past };
}

/** A timed row's instant (its day's date, a day before or after with `dd`), or null for an untimed one. */
function rowAt(tz: string, day: Pick<Day, 'date'>, row: Pick<DayRow, 't' | 'dd'>): number | null {
  const m = rowMin(row.t);
  return m === null ? null : instantIn(tz, day.date, m + (row.dd ?? 0) * 1440);
}

/** How long the trip's last row stays "now" when nothing follows it (the flight home: on board). */
const LAST_ROW_MS = 6 * 3_600_000;

/**
 * The timeline row that is now: the latest timed row that has begun, from the trip's first row (the eve's flight
 * out, with `dd: -1`) to the end of its last day (or a while after its last row, past midnight). Null outside that
 * window. `day` is the day's `n`, `i` the row's index in its `rows`.
 */
export function currentRow(trip: Pick<Trip, 'tz' | 'days' | 'end'>, now: number): { day: number; i: number } | null {
  let best: { day: number; i: number; at: number } | null = null;
  let first = Infinity, last = -Infinity;
  for (const d of trip.days)
    for (const [i, r] of d.rows.entries()) {
      const at = rowAt(trip.tz, d, r);
      if (at === null) continue;
      first = Math.min(first, at);
      last = Math.max(last, at);
      if (at <= now && (!best || at >= best.at)) best = { day: d.n, i, at };
    }
  const until = Math.max(instantIn(trip.tz, trip.end, 1440), last + LAST_ROW_MS);
  if (!best || now < first || now >= until) return null;
  return { day: best.day, i: best.i };
}

/** The day card to open: today's on the trip's calendar, or the day whose row is now (the eve's flight out, the
 *  flight home past midnight). Null outside the trip. */
export function todayDay(trip: Pick<Trip, 'tz' | 'days' | 'start' | 'end'>, now: number): number | null {
  const row = currentRow(trip, now);
  if (row) return row.day;
  const today = wallIn(trip.tz, now).date;
  return trip.days.find((d) => d.date === today)?.n ?? null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (s: string): [number, number, number] => {
  const [y, m, d] = s.split('-').map(Number);
  return [y, m - 1, d];
};

const fmts = new Map<string, Intl.DateTimeFormat>();
function parts(tz: string, ms: number): { y: number; mo: number; d: number; h: number; mi: number; s: number } {
  let f = fmts.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    fmts.set(tz, f);
  }
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(ms)) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return { y: o.year, mo: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}
/** The zone's offset from UTC at an instant (ms; Tokyo +9 h). */
function offsetOf(tz: string, ms: number): number {
  const p = parts(tz, ms);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}
