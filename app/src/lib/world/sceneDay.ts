// This phone's own record of today's island (docs/design.md "Beach finds"): which day items it picked up, dug or pulled
// (they derive from the date, so both phones see the same ones; each hides what it took), and the wish that brings star
// fragments. In localStorage (sync/storage.ts SCENE): losing it only puts a shell back on the sand.
import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
import { addWish, type Wishes } from './stars.ts';

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

/** This phone's wishes on shooting stars: the morning each brings its fragment to → how many (stars.ts). */
export function wishes(): Wishes {
  const w = readJson<Wishes>(localKV(), SCENE.wish);
  return w && typeof w === 'object' ? w : {};
}
/** One more wish, for `day`'s morning (`today`: older mornings are dropped). */
export const wish = (day: string, today: string): void => void writeJson(localKV(), SCENE.wish, addWish(wishes(), day, today));

interface Garden { date: string; watered: string[]; hybrid?: { id: string; flower: string } | null }

/** Today's garden: the flowers watered today (world.ts FLOWERS ids), and the hybrid today shows (worked out once from yesterday's watering, via
 *  `grow`, and kept for the day). */
export function garden(date: string, yesterday: string, grow: (watered: string[]) => Garden['hybrid']): Required<Garden> {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  if (g && g.date === date) return { date, watered: g.watered ?? [], hybrid: g.hybrid ?? null };
  const next = { date, watered: [] as string[], hybrid: (g && g.date === yesterday ? grow(g.watered ?? []) : null) ?? null };
  writeJson(localKV(), SCENE.garden, next);
  return next;
}
/** Remember a flower watered today (and tell the flowers: a watered one glitters for the day). */
export function water(date: string, id: string): void {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  const cur = g && g.date === date ? g : { date, watered: [], hybrid: null };
  if (!cur.watered.includes(id)) writeJson(localKV(), SCENE.garden, { ...cur, watered: [...cur.watered, id] });
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent(WATERED));
}
/** The event `water` sends. */
export const WATERED = 'island:watered';
/** The flowers watered on `date` (none on another day). */
export function wateredOn(date: string): string[] {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  return g && g.date === date ? (g.watered ?? []) : [];
}
