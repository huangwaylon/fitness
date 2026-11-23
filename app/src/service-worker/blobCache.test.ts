import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { blobCache, configureFiles, moveCache, storeCounts } from './blobCache.ts';
import { boundedCache } from './bounded.ts';

const U = 'https://x.example/fitness/room/world3d/palm.glb?v=1';

describe("the room's and the art's files in IndexedDB (blobCache.ts)", () => {
  beforeEach(() => configureFiles(new IDBFactory()));

  it('answers what was put, as a Cache would: its bytes, type and status; a miss undefined; deleted, gone', async () => {
    const room = blobCache('room');
    expect(await room.match(U)).toBeUndefined();
    await room.put(new Request(U), new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'model/gltf-binary' } }));
    const got = await room.match(new Request(U));
    expect(new Uint8Array(await got!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect([got!.status, got!.headers.get('content-type')]).toEqual([200, 'model/gltf-binary']);
    expect((await room.keys()).map((k) => k.url)).toEqual([U]);
    // (the art's store is its own)
    expect(await blobCache('art').match(U)).toBeUndefined();
    expect(await room.delete(U)).toBe(true);
    expect(await room.match(U)).toBeUndefined();
  });

  it('reads asked together in one go, each answered (the same one twice too)', async () => {
    const room = blobCache('room');
    for (let i = 0; i < 5; i++) await room.put(`${U}${i}`, new Response(String(i)));
    const got = await Promise.all([0, 1, 2, 3, 4, 2, 9].map((i) => room.match(`${U}${i}`).then((r) => r?.text())));
    expect(got).toEqual(['0', '1', '2', '3', '4', '2', undefined]);
    expect(await storeCounts()).toEqual({ room: 5, art: 0 });
  });

  it('is a bounded store as a Cache was (its index among its files)', async () => {
    const room = blobCache('room');
    await room.put(U, new Response('abcd'));
    const used = boundedCache(async () => room, 'https://x.example/__idx', () => [], { tidyMs: 0 });
    await used(U, 4);
    await used.pending();
    expect(await (await room.match('https://x.example/__idx'))!.json()).toMatchObject({ [U]: [4, expect.any(Number)] });
  });

  it('with no IndexedDB: every match a miss, every put dropped, nothing thrown', async () => {
    configureFiles(null);
    const room = blobCache('room');
    await room.put(U, new Response('x'));
    expect(await room.match(U)).toBeUndefined();
    expect(await room.keys()).toEqual([]);
  });

  it("moves an old Cache API cache's files in, then deletes it", async () => {
    const files = new Map<string, Response>([[U, new Response('a')], [`${U}b`, new Response('b')], [`${U}c`, new Response('gone', { status: 404 })]]);
    let deleted = false;
    const old = {
      keys: async () => [...files.keys()].map((u) => ({ url: u })),
      match: async (k: { url: string }) => files.get(k.url),
      delete: async (k: { url: string }) => files.delete(k.url)
    };
    const cs = { has: async () => !deleted, open: async () => old, delete: async () => ((deleted = true), true) } as unknown as CacheStorage;
    const room = blobCache('room');
    await moveCache('island-room-v1', room, { chunk: 2, gapMs: 0, cs });
    expect([files.size, deleted]).toEqual([0, true]);
    expect(await (await room.match(U))!.text()).toBe('a');
    expect(await (await room.match(`${U}b`))!.text()).toBe('b');
    expect(await room.match(`${U}c`)).toBeUndefined();
    // (none left: nothing to do)
    await moveCache('island-room-v1', room, { cs });
  });
});
