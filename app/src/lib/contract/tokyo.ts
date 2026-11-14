// Tokyo's calendar day of an instant, for the record's rules (contract/record.ts) and the app (time/dates.ts re-exports
// it). Asia/Tokyo is UTC+9 with no DST, so a fixed offset is exact. Pure.
import type { LocalDate } from '../types.ts';

export const ZONE_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A UTC date's `YYYY-MM-DD`. */
export function ymd(d: Date): LocalDate {
  const y = String(d.getUTCFullYear()).padStart(4, '0');
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const LOCAL_DAY = new Map<number, LocalDate>();
/** Epoch ms → local date in Asia/Tokyo. */
export function localDateAt(ms: number): LocalDate {
  const day = Math.floor((ms + ZONE_OFFSET_MS) / DAY_MS);
  let d = LOCAL_DAY.get(day);
  if (d === undefined) LOCAL_DAY.set(day, (d = ymd(new Date(day * DAY_MS))));
  return d;
}

/** Epoch ms → the clock in Asia/Tokyo, `HH:MM`. */
export const clockAt = (ms: number): string => new Date(ms + ZONE_OFFSET_MS).toISOString().slice(11, 16);

/** A `YYYY-MM-DD`'s day number (days since 1970-01-01): calendar arithmetic without Date's zone. */
export const dayNum = (d: string): number => Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY_MS);
/** dayNum's inverse. */
export const dayOf = (n: number): LocalDate => new Date(n * DAY_MS).toISOString().slice(0, 10);
/** The calendar day `n` days after `date` (n < 0: before). */
export const addDays = (date: string, n: number): LocalDate => dayOf(dayNum(date) + n);
/** The calendar day after `date`. */
export const nextDay = (date: string): LocalDate => addDays(date, 1);
/** The calendar day before `date`. */
export const prevDay = (date: string): LocalDate => addDays(date, -1);
