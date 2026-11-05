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
