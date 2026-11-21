// A hike under way, kept on this phone (docs/hiking.md "In-hike map"): which trail, how far along its own route the
// last matched fix was and which way the hiker walks it, and when, so an app the system killed mid-hike (or swiped
// away) opens back in hike mode on the right pass (an out-and-back's way down, not its way up). No position: no
// coordinates, no fix, no track; only this phone's localStorage (DEVICE.hikeNow), never sent, never logged. 終了
// removes it; one older than RESUME_MS is no hike under way (removed whenever read, and at each launch).
import { DEVICE, localKV, readJson, remove, writeJson, type KV } from '#lib/sync/storage.ts';

export interface HikeNow { slug: string; d: number; dir: 1 | -1; t: number }

/** How long a hike is kept after its last fix (a night's sleep makes the next day's another hike). */
export const RESUME_MS = 12 * 3_600_000;

const valid = (x: unknown): x is HikeNow => {
  const h = x as HikeNow | null;
  return !!h && typeof h.slug === 'string' && Number.isFinite(h.d) && h.d >= 0 && (h.dir === 1 || h.dir === -1) && Number.isFinite(h.t);
};

/** The hike under way on this trail, or null (another trail's, none, or too old: an old or broken one removed). */
export function readHike(slug: string, now = Date.now(), kv: KV | null = localKV()): HikeNow | null {
  const h = readJson<unknown>(kv, DEVICE.hikeNow);
  if (h === null) return null;
  if (!valid(h) || !(now - h.t < RESUME_MS)) return (remove(kv, DEVICE.hikeNow), null);
  return h.slug === slug ? h : null;
}

export const writeHike = (h: HikeNow, kv: KV | null = localKV()): boolean => writeJson(kv, DEVICE.hikeNow, { slug: h.slug, d: Math.round(h.d), dir: h.dir, t: h.t });

export const clearHike = (kv: KV | null = localKV()): void => remove(kv, DEVICE.hikeNow);

/** At launch: an old hike's record removed (a trail never opened again keeps none past RESUME_MS). */
export const dropOldHike = (now = Date.now(), kv: KV | null = localKV()): void => void readHike('', now, kv);
