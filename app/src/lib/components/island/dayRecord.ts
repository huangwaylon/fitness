// This phone's small per-day records of the island (sync/storage.ts SCENE): a record of a Tokyo date reads blank on any
// other day, so a new day starts fresh with nothing to clean up. Losing one only replays a flourish.
import { localKV, readJson, writeJson } from '#lib/sync/storage.ts';

/** A record kept for one day under `key`: `read(date)` (blank on another day) and `patch(date, fields)`. */
export function dayRecord<T extends object>(key: string, blank: T) {
  const read = (date: string): T & { date: string } => {
    const d = readJson<Partial<T> & { date?: string }>(localKV(), key);
    return d && d.date === date ? { ...blank, ...d, date } : { ...blank, date };
  };
  return { read, patch: (date: string, p: Partial<T>): void => void writeJson(localKV(), key, { ...read(date), ...p }) };
}

/** True the first time this is asked on `date` on this phone (it then remembers the date under `key`). */
export function firstOn(key: string, date: string): boolean {
  if (readJson<string>(localKV(), key) === date) return false;
  writeJson(localKV(), key, date);
  return true;
}
