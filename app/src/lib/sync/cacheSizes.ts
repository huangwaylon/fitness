// What each of the service worker's caches holds, for storage.use (once a Tokyo day, sync/persist.ts): MB a cache, by
// its index where it keeps one (`__<name>-index`: each URL's bytes and last use; the room, ききみみ's packs, the art,
// the photos, the tiles, the food images), else its files' bodies counted (the shells, the fonts, the audio, the food
// data: a few MB); the recogniser's (~67 MB, the mic's) only whether it's there, its parts never read for this. Loaded
// only then (not in the first load). Never rejects: a cache it can't read is left out.

/** A cache's log field: its name less the `island-` prefix and the `-v<n>` suffix (every `island-shell-<version>` is
 *  `shell`), camelCased; one it doesn't know is `other`. */
const FIELDS: Record<string, string> = { shell: 'shell', room: 'room', listen: 'listen', villagers: 'art', photos: 'photos', tiles: 'tiles', 'food-img': 'foodImg', food: 'food', fonts: 'fonts', audio: 'audio' };
export function fieldOf(name: string): string | 'stt' {
  if (name.startsWith('island-shell-')) return 'shell';
  const m = /^island-(.+?)-v\d+$/.exec(name);
  if (m?.[1] === 'stt') return 'stt';
  return (m && FIELDS[m[1]]) || 'other';
}

const INDEX = /\/__[\w-]+-index$/;

async function bytesOf(cache: Cache): Promise<number> {
  const keys = await cache.keys();
  const index = keys.find((k) => INDEX.test(new URL(k.url).pathname));
  if (index) {
    const idx = (await (await cache.match(index))?.json()) as Record<string, [number, number]> | undefined;
    if (idx) return Object.values(idx).reduce((a, [b]) => a + (Number(b) || 0), 0);
  }
  let n = 0;
  for (const k of keys) n += (await (await cache.match(k))?.blob())?.size ?? 0;
  return n;
}

/** Each cache's MB (0.1), by field, and whether the recogniser is kept (`stt`). */
export async function cacheSizes(cs: CacheStorage | undefined = globalThis.caches): Promise<Record<string, number | boolean>> {
  const out: Record<string, number | boolean> = {};
  if (!cs) return out;
  for (const name of await cs.keys().catch(() => [] as string[])) {
    const f = fieldOf(name);
    try {
      const cache = await cs.open(name);
      if (f === 'stt') out.stt = (await cache.keys()).length > 0;
      else out[f] = Math.round((Number(out[f] ?? 0) + (await bytesOf(cache)) / 1048576) * 10) / 10;
    } catch {
      /* left out */
    }
  }
  out.stt ??= false;
  return out;
}
