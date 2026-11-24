// What each of the service worker's caches holds, for storage.use (once a Tokyo day, sync/persist.ts): MB a cache, by
// its index where it keeps one (`__<name>-index`: each URL's bytes and last use; the room, the art,
// the photos, the tiles, the food images), else its files counted (their Content-Length, else their bodies: the
// shells, the fonts, the audio, the food data); and each one's entries (`<field>N`), the shells kept (`shells`) and all
// the entries (`ents`): a cold worker's first cache read grows with the origin's entries (review c1 r3 W1). The room's,
// the art's, the tiles', the photos', ごはん's pictures' and 保存した場所's files are in IndexedDB (service-worker/blobCache.ts
// STORES): their MB and entries under the store's name (`room`/`roomN` … `place`/`placeN`), not in `ents` (no Cache API
// entry). Loaded only
// then (not in the first load). Never rejects: a cache it can't read is left out.
import { blobCache, STORES, type FileStore, type StoreName } from '../../service-worker/blobCache.ts';

/** A cache's log field: its name less the `island-` prefix and the `-v<n>` suffix (every `island-shell-<version>` is
 *  `shell`), camelCased; one it doesn't know is `other`. */
const FIELDS: Record<string, string> = { shell: 'shell', room: 'room', villagers: 'art', photos: 'photos', tiles: 'tiles', 'food-img': 'foodImg', food: 'food', fonts: 'fonts', audio: 'audio' };
export function fieldOf(name: string): string {
  if (name.startsWith('island-shell-')) return 'shell';
  const m = /^island-(.+?)-v\d+$/.exec(name);
  return (m && FIELDS[m[1]]) || 'other';
}

const INDEX = /\/__[\w-]+-index$/;

/** A cache's bytes and its entries. */
async function sizeOf(cache: Cache): Promise<[number, number]> {
  const keys = await cache.keys();
  return [await bytesOf(cache, keys), keys.length];
}
const defaultFiles = () => (typeof indexedDB === 'undefined' ? null : Object.fromEntries(STORES.map((n) => [n, blobCache(n)])));
async function bytesOf(cache: Cache, keys: readonly Request[]): Promise<number> {
  const index = keys.find((k) => INDEX.test(new URL(k.url).pathname));
  if (index) {
    const idx = (await (await cache.match(index))?.json()) as Record<string, [number, number]> | undefined;
    if (idx) return Object.values(idx).reduce((a, [b]) => a + (Number(b) || 0), 0);
  }
  // (every answer at once, its Content-Length where it says one, else its body read: one call, not a match and a read
  // for each of a shell's ~700 files, one after another)
  let n = 0;
  for (const res of await cache.matchAll()) n += Number(res.headers.get('content-length')) || ((await res.blob()).size);
  return n;
}

/** Each cache's MB (0.1) and entries (`<field>N`), by field; the shells (`shells`) and all the entries (`ents`). */
export async function cacheSizes(cs: CacheStorage | undefined = globalThis.caches, files: Partial<Record<StoreName, FileStore>> | null = defaultFiles()): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const [name, store] of Object.entries(files ?? {}) as [StoreName, FileStore][]) {
    try {
      const keys = await store.keys();
      if (!keys.length) continue;
      const index = keys.find((k) => INDEX.test(new URL(k.url).pathname));
      const idx = index ? ((await (await store.match(index.url))?.json()) as Record<string, [number, number]> | undefined) : undefined;
      const bytes = idx ? Object.values(idx).reduce((a, [b]) => a + (Number(b) || 0), 0) : 0;
      out[name] = Math.round(((out[name] ?? 0) + bytes / 1048576) * 10) / 10;
      out[`${name}N`] = (out[`${name}N`] ?? 0) + keys.length;
    } catch {
      /* left out */
    }
  }
  if (!cs) return out;
  let ents = 0, shells = 0;
  for (const name of await cs.keys().catch(() => [] as string[])) {
    const f = fieldOf(name);
    try {
      const [bytes, n] = await sizeOf(await cs.open(name));
      out[f] = Math.round(((out[f] ?? 0) + bytes / 1048576) * 10) / 10;
      out[`${f}N`] = (out[`${f}N`] ?? 0) + n;
      ents += n;
      if (f === 'shell') shells++;
    } catch {
      /* left out */
    }
  }
  if (ents) Object.assign(out, { shells, ents });
  return out;
}
