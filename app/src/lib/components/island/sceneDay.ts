// This phone's own record of today's island (docs/design.md "Beach finds"): which day items it picked up, dug or pulled
// (they derive from the date, so both phones see the same ones; each hides what it took), and the wish that brings star
// fragments. In localStorage (sync/storage.ts SCENE): losing it only puts a shell back on the sand.
import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';

interface Day { date: string; picked: string[] }

const read = (date: string): Day => {
  const d = readJson<Day>(localKV(), SCENE.day);
  return d && d.date === date && Array.isArray(d.picked) ? d : { date, picked: [] };
};

/** The uids taken on `date`. */
export const takenOn = (date: string): Set<string> => new Set(read(date).picked);

/** Remember a uid taken on `date` (a new date starts a fresh list). */
export function take(date: string, uid: string): void {
  const d = read(date);
  if (!d.picked.includes(uid)) writeJson(localKV(), SCENE.day, { date, picked: [...d.picked.slice(-199), uid] });
}

/** The date whose morning brings star fragments, or null. */
export const wishDay = (): string | null => readJson<string>(localKV(), SCENE.wish);
export const wishFor = (date: string): void => void writeJson(localKV(), SCENE.wish, date);
