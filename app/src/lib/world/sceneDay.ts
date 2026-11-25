// This phone's own record of today's island (docs/design.md "Beach finds"): which day items it picked up, dug or pulled
// (they derive from the date, so both phones see the same ones; each hides what it took), and the wish that brings star
// fragments, the flowers it watered today and the hybrid it last greeted. In localStorage (sync/storage.ts SCENE): losing it only puts a shell back on the sand.
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

/** Greet `key` (today's hybrid: `date|id|flower`, flowers.svelte.ts) once on this phone: `show` it unless it was
 *  already; it counts as greeted once `show` says it was shown. True: greeted (now or before). */
export function greetOnce(key: string, show: () => boolean): boolean {
  if (readJson<string>(localKV(), SCENE.hybrid) === key) return true;
  if (!show()) return false;
  writeJson(localKV(), SCENE.hybrid, key);
  return true;
}

/** This phone's wishes on shooting stars: the morning each brings its fragment to → how many (stars.ts). */
export function wishes(): Wishes {
  const w = readJson<Wishes>(localKV(), SCENE.wish);
  return w && typeof w === 'object' ? w : {};
}
/** One more wish, for `day`'s morning (`today`: older mornings are dropped). */
export const wish = (day: string, today: string): void => void writeJson(localKV(), SCENE.wish, addWish(wishes(), day, today));

interface Garden { date: string; watered: string[] }

/** Remember a flower watered today (and tell the flowers: a watered one glitters for the day). */
export function water(date: string, id: string): void {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  const watered = g && g.date === date ? (g.watered ?? []) : [];
  // (an older build's `hybrid` beside them is dropped: today's hybrid is the shared day's, IslandScene)
  if (!watered.includes(id)) writeJson(localKV(), SCENE.garden, { date, watered: [...watered, id] });
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent(WATERED));
}
/** The event `water` sends. */
export const WATERED = 'island:watered';
/** The flowers watered on `date` (none on another day). */
export function wateredOn(date: string): string[] {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  return g && g.date === date ? (g.watered ?? []) : [];
}
