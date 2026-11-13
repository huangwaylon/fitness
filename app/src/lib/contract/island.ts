// An `island` event (docs/backend.md#events, #shared-world): one person's part of one Tokyo day's shared island, the
// record's copy of it for when the relay has nothing (both apps were closed past its day, an outage): what they picked
// up, dug, pulled or opened, what they put down and what their shakes left, the flowers they watered, their wishes on
// shooting stars and where their villager stands. The phone sends all of it again when it grows (held two minutes,
// store/world.svelte.ts); the server keeps one row per person and day (a newer one replaces it, as a tally's), and the
// model reads each person's latest. Shared by the record (relay/src/store.ts) and the model; pure.
import { isLocalDate } from './api.ts';
import { isRec } from './guards.ts';
import type { LocalDate } from '../types.ts';
import { isInt } from './ops.ts';
import { nextDay } from './tokyo.ts';
import { WORLD_X, WORLD_Z } from './layout.ts';

export interface IslandDayData {
  date: LocalDate;
  /** Ids picked up, dug, pulled or opened. */
  taken: string[];
  /** What was put down: [id, what, x, z]. */
  puts: [string, string, number, number][];
  /** Shakes that left something: [tree, drop, t]. */
  shakes: [string, IslandDrop, number][];
  /** The flowers watered (world/world.ts FLOWERS ids: `fl:<x>:<z>`) and the field's plants (`fd:<id>`: contract/farm.ts). */
  watered: string[];
  /** Wishes: the morning each brings its fragment → how many. */
  wishes: Record<string, number>;
  /** Where their villager stands, if they sent it somewhere. */
  at?: [number, number];
}

/** Caps that keep a row well under the event data limit (20,000 characters): a busy day is a few dozen of each. */
export const ISLAND_MAX = { taken: 400, puts: 60, shakes: 120, watered: 160, wishes: 4 } as const;

const ID = /^[\w:.-]{1,32}$/;
const WHAT = /^[a-z][\w:.-]{0,63}$/;
/** What a shake can leave (the relay protocol's drops but `none`). */
const DROPS = ['branch', 'nest', 'bagworm', 'spider', 'coconut'] as const;
type IslandDrop = (typeof DROPS)[number];
/** A world point within the world's extent (the live protocol's: contract/layout.ts). */
const isPt = (p: unknown): p is [number, number] => Array.isArray(p) && p.length === 2 && isInt(p[0], WORLD_X[0], WORLD_X[1]) && isInt(p[1], WORLD_Z[0], WORLD_Z[1]);
const list = (x: unknown, max: number, ok: (v: unknown) => boolean): boolean => Array.isArray(x) && x.length <= max && x.every(ok);

/**
 * The row the record keeps when `sent` replaces `held` (one person's same day, health A8, 2026-11-08): only what can
 * only grow is merged: each morning's wishes their max, the flowers watered both rows' (within ISLAND_MAX), the
 * villager's spot the sent one's, else the held one's. `taken`, `puts` and `shakes` are the sent row's: leaving a
 * claim out is how a phone gives back a race it lost (store/world.svelte.ts #refused), and a row has no list of what
 * it gave back. @public (relay/src/store.ts)
 */
export function mergeIslandDay(held: IslandDayData, sent: IslandDayData): IslandDayData {
  const wishes: Record<string, number> = { ...held.wishes };
  for (const [k, n] of Object.entries(sent.wishes)) wishes[k] = Math.max(wishes[k] ?? 0, n);
  const mornings = Object.keys(wishes).sort().slice(-ISLAND_MAX.wishes);
  const watered = [...held.watered.filter((id) => !sent.watered.includes(id)), ...sent.watered].slice(-ISLAND_MAX.watered);
  const at = sent.at ?? held.at;
  return { ...sent, watered, wishes: Object.fromEntries(mornings.map((k) => [k, wishes[k]])), ...(at ? { at } : {}) };
}

/**
 * An `island`'s data: `{date, taken, puts, shakes, watered, wishes, at?}` and nothing else, a real date (not after
 * tomorrow when `today`, the server's Tokyo date, is given), within ISLAND_MAX, each entry well-formed.
 */
export function isIslandDay(d: Record<string, unknown>, today?: LocalDate): d is Record<string, unknown> & IslandDayData {
  const keys = Object.keys(d);
  if (keys.some((k) => !['date', 'taken', 'puts', 'shakes', 'watered', 'wishes', 'at'].includes(k))) return false;
  if (!isLocalDate(d.date) || (today && d.date > nextDay(today))) return false;
  if (!list(d.taken, ISLAND_MAX.taken, (v) => typeof v === 'string' && ID.test(v))) return false;
  if (!list(d.puts, ISLAND_MAX.puts, (v) => Array.isArray(v) && v.length === 4 && typeof v[0] === 'string' && ID.test(v[0]) && typeof v[1] === 'string' && WHAT.test(v[1]) && isPt([v[2], v[3]]))) return false;
  if (!list(d.shakes, ISLAND_MAX.shakes, (v) => Array.isArray(v) && v.length === 3 && typeof v[0] === 'string' && ID.test(v[0]) && (DROPS as readonly string[]).includes(v[1] as string) && isInt(v[2], 0, 1e14))) return false;
  if (!list(d.watered, ISLAND_MAX.watered, (v) => typeof v === 'string' && ID.test(v))) return false;
  if (!isRec(d.wishes) || Object.keys(d.wishes).length > ISLAND_MAX.wishes) return false;
  for (const [k, n] of Object.entries(d.wishes)) if (!isLocalDate(k) || !isInt(n, 1, 99)) return false;
  return d.at === undefined || isPt(d.at);
}
