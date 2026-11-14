// Each service worker cache's MB for storage.use (sync/cacheSizes.ts).
import { describe, expect, it } from 'vitest';
import { cacheSizes, fieldOf } from './cacheSizes.ts';

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
    expect(['island-shell-2026-11-11.abc1234', 'island-room-v1', 'island-villagers-v1', 'island-food-img-v1', 'island-food-v1', 'island-stt-v1', 'island-map-meta-v1', 'other-cache'].map(fieldOf))
      .toEqual(['shell', 'room', 'art', 'foodImg', 'food', 'stt', 'other', 'other']);
  });

  it('MB a cache by its index where it keeps one, else its files counted (a Content-Length, or the body); the shells summed; the recogniser only there or not', async () => {
    const s = 'https://x/';
    const sizes = await cacheSizes(storageOf({
      'island-shell-a': { [`${s}a.js`]: 'x'.repeat(MB) },
      'island-shell-b': { [`${s}b.js`]: 'x'.repeat(MB / 4), [`${s}c.js`]: `len:${MB / 4}` },
      // (the index says 30 MB; its files' bodies aren't read)
      'island-room-v1': { [`${s}__room-index`]: JSON.stringify({ [`${s}room/a.glb`]: [20 * MB, 1], [`${s}room/b.pak`]: [10 * MB, 2] }), [`${s}room/a.glb`]: 'tiny' },
      'island-stt-v1': { [`${s}stt/model.onnx`]: 'x' }
    }));
    expect(sizes).toEqual({ shell: 1.5, room: 30, stt: true });
    expect(await cacheSizes(storageOf({}))).toEqual({ stt: false });
    expect(await cacheSizes(undefined)).toEqual({});
  });
});
