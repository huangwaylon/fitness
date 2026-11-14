// A cache bounded by bytes (the room's, caches.ts roomEvict; ききみみ's packs', listenEvict; the art's, the photos', the
// tiles', ごはん's pictures'): its index (each file's bytes and last use) in memory while the worker runs, written to the
// cache itself a moment after a change (one write for a burst of files), with the files it lets go deleted then. Read
// back the first time the cache is asked for, and matched to the cache's files: one put as the worker was stopped, or a
// write that never ran, is counted then (its bytes read, used "now" in the cache's order), one deleted dropped. So a
// lost write costs only some files' last use, never a file kept past the bound for good.
// A use resolves once it is marked in memory, not at the write: a fetch event waiting on the write held the worker
// busy for TIDY_MS after its last fetch, and a deploy's new worker activates only once the old one is idle (its
// skipWaiting waits for the events in flight): a launch's reload came ~2 s late, under the player (launch 2026-11-14).
import type { RoomIndex } from './caches.ts';

/** The index written and the bound applied this long after the first use of a burst (ms). */
export const TIDY_MS = 2000;

const sizeOf = async (res: Response): Promise<number> => (await res.blob()).size;

export interface Bounded {
  /** A file used (and its bytes, when it was just stored): resolves once marked; the write follows on its own. */
  (url: string, bytes?: number): Promise<void>;
  /** The pending write, if any (tests). */
  pending(): Promise<void> | null;
}

export function boundedCache(open: () => Promise<Cache>, indexUrl: string, evict: (idx: RoomIndex, now: number) => string[], { tidyMs = TIDY_MS, now = Date.now }: { tidyMs?: number; now?: () => number } = {}): Bounded {
  let index: Promise<RoomIndex> | null = null;
  const indexOf = (cache: Cache): Promise<RoomIndex> =>
    (index ??= (async () => {
      let idx: RoomIndex = {};
      try {
        const kept = await cache.match(indexUrl);
        if (kept) idx = (await kept.json()) as RoomIndex;
      } catch {
        idx = {};
      }
      const urls = (await cache.keys()).map((k) => k.url).filter((u) => u !== indexUrl);
      const have = new Set(urls), t = now();
      for (const u of Object.keys(idx)) if (!have.has(u)) delete idx[u];
      for (let i = 0; i < urls.length; i++) {
        if (idx[urls[i]]) continue;
        const res = await cache.match(urls[i]);
        idx[urls[i]] = [res ? await sizeOf(res).catch(() => 0) : 0, t - urls.length + i];
      }
      return idx;
    })().catch((e: unknown) => {
      index = null;
      throw e;
    }));
  let tidy: Promise<void> | null = null;
  const used = (async (url: string, bytes?: number) => {
    const cache = await open();
    const idx = await indexOf(cache);
    idx[url] = [bytes ?? idx[url]?.[0] ?? 0, now()];
    tidy ??= new Promise((r) => setTimeout(r, tidyMs)).then(async () => {
      tidy = null;
      for (const u of evict(idx, now())) {
        await cache.delete(u);
        delete idx[u];
      }
      await cache.put(indexUrl, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } }));
    }).catch(() => {
      tidy = null; // (kept on the next use's write; a lost one is counted again at the next read: above)
    });
  }) as Bounded;
  used.pending = () => tidy;
  return used;
}
