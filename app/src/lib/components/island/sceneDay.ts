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
/** Remember a watered cell today (and tell the beds: their watered flowers glitter for the day). */
export function water(date: string, cell: string): void {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  const cur = g && g.date === date ? g : { date, watered: [], hybrid: null };
  if (!cur.watered.includes(cell)) writeJson(localKV(), SCENE.garden, { ...cur, watered: [...cur.watered, cell] });
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent(WATERED));
}
/** The event `water` sends. */
export const WATERED = 'island:watered';
/** The cells watered on `date` (none on another day). */
export function wateredOn(date: string): string[] {
  const g = readJson<Garden>(localKV(), SCENE.garden);
  return g && g.date === date ? (g.watered ?? []) : [];
}

/** A flower bed cell's shared id: whose bed and the cell in it (`A.0-1`), from this phone's `row-col` (columns 0–1 the
 *  left bed, mine; 2–3 the right, the partner's: each phone has its own bed on the left). */
export function sharedCell(cell: string, me: 'A' | 'B'): string | null {
  const m = /^(\d)-(\d)$/.exec(cell);
  if (!m) return null;
  const c = +m[2];
  return `${c < 2 ? me : me === 'A' ? 'B' : 'A'}.${m[1]}-${c % 2}`;
}
/** This phone's `row-col` of a shared cell id (sharedCell's inverse), or null. */
export function localCell(id: string, me: 'A' | 'B'): string | null {
  const m = /^([AB])\.(\d)-([01])$/.exec(id);
  if (!m) return null;
  return `${m[2]}-${+m[3] + (m[1] === me ? 0 : 2)}`;
}
