// りょこう's clock (docs/design.md §Trips): where a trip stands against now, in the trip's own time zone (its
// dates and row times are local to `trip.tz`; a row with its own `tz`, Narita's departure, on that zone's clock): the
// boarding pass's 「あと 97にち」 / 「いま 2日目」 / おもいで, the list's order, the day card open today and the timeline
// row that is now (NZ's flights cross midnight: a row's `dd` puts it on the eve or the morning after its day). Pure:
// `now` is an instant (ms) handed in.
import { daysBetween } from '#lib/time/dates.ts';
import { instantIn, wallIn } from '#lib/time/zone.ts';
import type { Day, DayRow, Trip } from '#lib/travel/types.ts';

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

type Clock = Pick<Trip, 'start' | 'end' | 'tz' | 'days'>;

/** Where the trip stands: on its own calendar, or on a row that is now outside it (the eve's flight out, the flight
 *  home past midnight: the trip is on while they are). */
export function phaseOf(trip: Clock, now: number): Phase {
  const today = wallIn(trip.tz, now).date;
  const to = daysBetween(today, trip.start);
  if (to <= 0 && daysBetween(today, trip.end) >= 0) return { k: 'now', day: 1 - to };
  const row = rowNow(trip, now);
  if (row && !row.next) return { k: 'now', day: row.day };
  return to > 0 ? { k: 'soon', days: to } : { k: 'past' };
}

/** The list's order: on now first, then the coming ones soonest first, then the past newest first (おもいで). */
export function sortTrips<T extends Clock>(trips: readonly T[], now: number): { coming: T[]; past: T[] } {
  const coming = trips.filter((t) => phaseOf(t, now).k !== 'past').sort((a, b) => a.start.localeCompare(b.start));
  const past = trips.filter((t) => phaseOf(t, now).k === 'past').sort((a, b) => b.start.localeCompare(a.start));
  return { coming, past };
}

/** A timed row's instant (its day's date, a day before or after with `dd`, on its own zone's clock or the trip's),
 *  or null for an untimed one. */
function rowAt(tz: string, day: Pick<Day, 'date'>, row: Pick<DayRow, 't' | 'dd' | 'tz'>): number | null {
  const m = rowMin(row.t);
  return m === null ? null : instantIn(row.tz ?? tz, day.date, m + (row.dd ?? 0) * 1440);
}

/** How long the trip's last row stays "now" when nothing follows it (the flight home: on board). */
const LAST_ROW_MS = 6 * 3_600_000;

/**
 * The timeline row to mark: the latest timed row that has begun (`next` false), from the trip's first row (the
 * eve's flight out) on. A row is now until the next one begins; a day's last row till its day's midnight (the trip's
 * last, a while after it: the flight home). Between, on a day of the trip: that day's first row to come (`next`:
 * 「つぎ 03:10」). Null outside all that. `day` is the day's `n`, `i` the row's index in its `rows`.
 */
export function rowNow(trip: Clock, now: number): { day: number; i: number; next: boolean } | null {
  const rows = timed(trip);
  const k = rows.findLastIndex((r) => r.at <= now);
  const r = rows[k];
  if (r) {
    const lastOfDay = rows[k + 1]?.d !== r.d;
    const end = instantIn(trip.tz, r.d.date, 1440);
    const until = !lastOfDay ? Infinity : k === rows.length - 1 ? Math.max(end, r.at + LAST_ROW_MS) : end;
    if (now < until) return { day: r.d.n, i: r.i, next: false };
  }
  const today = wallIn(trip.tz, now).date;
  const up = rows.find((x) => x.at > now && x.d.date === today);
  return up ? { day: up.d.n, i: up.i, next: true } : null;
}

/** The next timed row to begin (Orville's 「つぎは …」), or null: none left. */
export function nextRow(trip: Clock, now: number): { day: number; i: number } | null {
  const r = timed(trip).find((x) => x.at > now);
  return r ? { day: r.d.n, i: r.i } : null;
}

/** The trip's timed rows with their instants, in time order. */
const timed = (trip: Clock) =>
  trip.days
    .flatMap((d) =>
      d.rows.flatMap((r, i) => {
        const at = rowAt(trip.tz, d, r);
        return at === null ? [] : [{ d, i, at }];
      })
    )
    .sort((a, b) => a.at - b.at);

/** The day card to open: today's on the trip's calendar, else the day whose row is now (the eve's flight out, the
 *  flight home past midnight). Null outside the trip. */
export function todayDay(trip: Clock, now: number): number | null {
  const today = wallIn(trip.tz, now).date;
  return trip.days.find((d) => d.date === today)?.n ?? rowNow(trip, now)?.day ?? null;
}
