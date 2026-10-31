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

interface Garden { date: string; watered: string[]; hybrid?: { cell: string; flower: string } | null }

/** Today's garden: the cells watered today, and the hybrid today shows (worked out once from yesterday's watering, via
 *  `grow`, and kept for the day). */
export function garden(date: string, yesterday: string, grow: (watered: string[]) => Garden['hybrid']): Required<Garden> {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  if (g && g.date === date) return { date, watered: g.watered ?? [], hybrid: g.hybrid ?? null };
  const next = { date, watered: [] as string[], hybrid: (g && g.date === yesterday ? grow(g.watered ?? []) : null) ?? null };
  writeJson(localKV(), SCENE.garden, next);
  return next;
}
/** Remember a watered cell today. */
export function water(date: string, cell: string): void {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  const cur = g && g.date === date ? g : { date, watered: [], hybrid: null };
  if (!cur.watered.includes(cell)) writeJson(localKV(), SCENE.garden, { ...cur, watered: [...cur.watered, cell] });
}
