// Each service worker cache's MB for storage.use (sync/cacheSizes.ts).
import { describe, expect, it } from 'vitest';
import { cacheSizes, fieldOf } from './cacheSizes.ts';
import type { FileStore } from '../../service-worker/blobCache.ts';

/** A CacheStorage of caches by name, each its URLs and bodies (a string's length its bytes). */
function storageOf(caches: Record<string, Record<string, string>>): CacheStorage {
  const open = async (name: string) => {
    const files = caches[name];
    return {
      keys: async () => Object.keys(files).map((u) => new Request(u)),
      match: async (r: Request) => (files[r.url] === undefined ? undefined : new Response(files[r.url])),
      // (a `len:<n>` body: an answer whose Content-Length says n)
      matchAll: async () => Object.values(files).map((b) => (b.startsWith('len:') ? new Response('', { headers: { 'content-length': b.slice(4) } }) : new Response(b)))
    } as unknown as Cache;
  };
  return { keys: async () => Object.keys(caches), open } as unknown as CacheStorage;
}
const MB = 1048576;

describe('cacheSizes', () => {
  it('names each cache by its field; every shell is the shell', () => {
    expect(['island-shell-2026-11-11.abc1234', 'island-room-v1', 'island-villagers-v1', 'island-food-img-v1', 'island-food-v2', 'island-map-meta-v1', 'other-cache'].map(fieldOf))
      .toEqual(['shell', 'room', 'art', 'foodImg', 'food', 'other', 'other']);
  });

  it('MB a cache by its index where it keeps one, else its files counted (a Content-Length, or the body); the shells summed; the entries counted', async () => {
    const s = 'https://x/';
    const sizes = await cacheSizes(storageOf({
      'island-shell-a': { [`${s}a.js`]: 'x'.repeat(MB) },
      'island-shell-b': { [`${s}b.js`]: 'x'.repeat(MB / 4), [`${s}c.js`]: `len:${MB / 4}` },
      // (the index says 30 MB; its files' bodies aren't read)
      'island-room-v1': { [`${s}__room-index`]: JSON.stringify({ [`${s}room/a.glb`]: [20 * MB, 1], [`${s}room/b.pak`]: [10 * MB, 2] }), [`${s}room/a.glb`]: 'tiny' }
    }));
    expect(sizes).toEqual({ shell: 1.5, room: 30, shellN: 3, roomN: 2, shells: 2, ents: 5 });
    expect(await cacheSizes(storageOf({}), null)).toEqual({});
    expect(await cacheSizes(undefined, null)).toEqual({});
  });

  it("counts the room's and the art's IndexedDB stores (service-worker/blobCache.ts) by their index, not in ents", async () => {
    const s = 'https://x/', idx = JSON.stringify({ [`${s}room/a.glb`]: [2 * MB, 1] });
    const store = (m: Record<string, string>) => ({ keys: async () => Object.keys(m).map((url) => ({ url })), match: async (u: string) => (u in m ? new Response(m[u]) : undefined) }) as unknown as FileStore;
    const sizes = await cacheSizes(storageOf({ 'island-shell-a': { [`${s}a.js`]: 'x' } }), { room: store({ [`${s}__room-index`]: idx, [`${s}room/a.glb`]: 'x' }), art: store({}) });
    expect(sizes).toMatchObject({ room: 2, roomN: 2, shellN: 1, ents: 1 });
    expect(sizes.artN).toBeUndefined();
  });
});
