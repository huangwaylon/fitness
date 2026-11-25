// 保存した場所's photos in the service worker (Google's lh3 links: caches.ts isPlacePic, placePicFetch): kept on view in
// a store of their own (blobCache placePic), bounded on their own, offline with none kept a quiet 504.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { foodImgEvict, foodImgFetch, isPlacePic, PLACE_PIC_CAP_BYTES, PLACE_PIC_CAP_N, placePicEvict, placePicFetch, type RoomIndex } from './caches.ts';
import { blobCache, configureFiles, STORES } from './blobCache.ts';
import { boundedCache } from './bounded.ts';

describe("保存した場所's photos (Google's lh3 links: isPlacePic, placePicFetch)", () => {
  const PIC = `https://lh3.googleusercontent.com/grass-cs/${'A'.repeat(40)}=w600-h338-k-no`;
  it('only the grass-cs path of lh3', () => {
    expect(isPlacePic(new URL(PIC))).toBe(true);
    for (const u of ['https://lh3.googleusercontent.com/a/x', 'https://lh4.googleusercontent.com/grass-cs/x', 'https://x.example/grass-cs/x']) expect(isPlacePic(new URL(u))).toBe(false);
  });
  it('kept once seen (counted with its size), the kept one served without the network; a refusal or an opaque answer never kept', async () => {
    const m = new Map<string, Response>();
    const cache = { match: async (u: RequestInfo | URL) => m.get(String(u))?.clone(), put: async (u: RequestInfo | URL, r: Response) => void m.set(String(u), r) };
    const bg: Promise<unknown>[] = [], used: [string, number | undefined][] = [];
    let calls = 0;
    const net = async () => (calls++, new Response('jpeg', { status: 200 }));
    const r1 = await placePicFetch(new Request(PIC), cache, net, (p) => bg.push(p), (u, n) => used.push([u, n]));
    await Promise.all(bg);
    expect([await r1.text(), calls, m.has(PIC), used]).toEqual(['jpeg', 1, true, [[PIC, 4]]]);
    expect(await (await placePicFetch(new Request(PIC), cache, net, (p) => bg.push(p), (u, n) => used.push([u, n]))).text()).toBe('jpeg');
    expect([calls, used.at(-1)]).toEqual([1, [PIC, undefined]]);
    const gone = `${PIC}x`;
    expect((await placePicFetch(new Request(gone), cache, async () => new Response('', { status: 403 }), (p) => bg.push(p))).status).toBe(403);
    const opaque = { ok: true, type: 'opaque', clone: () => opaque } as unknown as Response;
    await placePicFetch(new Request(`${PIC}y`), cache, async () => opaque, (p) => bg.push(p));
    await Promise.all(bg);
    expect([m.has(gone), m.has(`${PIC}y`)]).toEqual([false, false]);
  });
  it('offline with none kept: a quiet 504 (the <img> onerror, no rejected respondWith)', async () => {
    const m = new Map<string, Response>();
    const cache = { match: async (u: RequestInfo | URL) => m.get(String(u)), put: async (u: RequestInfo | URL, r: Response) => void m.set(String(u), r) };
    const res = await placePicFetch(new Request(PIC), cache, async () => Promise.reject(new TypeError('Load failed')), () => {});
    expect([res.status, res.ok, m.size]).toEqual([504, false, 0]);
  });
  it('their own bound: past PLACE_PIC_CAP_N or PLACE_PIC_CAP_BYTES, the least recently used', () => {
    expect([PLACE_PIC_CAP_N, PLACE_PIC_CAP_BYTES]).toEqual([300, 40_000_000]);
    const pic = (i: number) => `${PIC}${i}`;
    const idx: RoomIndex = Object.fromEntries(Array.from({ length: 303 }, (_, i) => [pic(i), [45_000, 1000 + ((i * 7) % 303)] as [number, number]]));
    const out = placePicEvict(idx, 5000);
    expect(out.length).toBe(3);
    expect(out.map((u) => idx[u][1]).sort()).toEqual([1000, 1001, 1002]);
    // by bytes: three of 15 MB over 40 MB, the oldest out
    expect(placePicEvict({ [pic(1)]: [15e6, 3], [pic(2)]: [15e6, 1], [pic(3)]: [15e6, 2] }, 10)).toEqual([pic(2)]);
  });
});

describe("the place photos' store is their own (blobCache placePic): browsing cards never evicts ごはん's pictures", () => {
  beforeEach(() => configureFiles(new IDBFactory()));
  afterEach(() => configureFiles(null));
  const PIC = `https://lh3.googleusercontent.com/grass-cs/${'B'.repeat(40)}=w600-h338-k-no`;
  const FOOD = 'https://x.example/fitness/food-img/s0.11111111.webp';

  it('a store of its own in the database', () => expect(STORES).toContain('placePic'));

  it('350 photos browsed: 300 kept (the oldest out), the food sheet untouched', async () => {
    const pics = blobCache('placePic'), food = blobCache('foodImg');
    let t = 0;
    const now = () => ++t;
    const opts = { tidyMs: 0, now };
    const picUsed = boundedCache(async () => pics, 'https://x.example/__place-pic-index', (i, n) => placePicEvict(i, n), opts);
    const foodUsed = boundedCache(async () => food, 'https://x.example/__food-img-index', (i, n) => foodImgEvict(i, n), opts);
    await foodImgFetch(new Request(FOOD), food, async () => new Response('food'), (p) => void p, undefined, (u, n) => void foodUsed(u, n));
    await new Promise((r) => setTimeout(r, 5));
    await foodUsed.pending();
    for (let i = 0; i < 350; i++) {
      const bg: Promise<unknown>[] = [];
      await placePicFetch(new Request(`${PIC}${i}`), pics, async () => new Response('jpeg'), (p) => bg.push(p), (u, n) => void picUsed(u, n));
      await Promise.all(bg);
    }
    // (EVICT_MAX a write: tidy till settled)
    for (let k = 0; k < 4; k++) {
      await picUsed(`${PIC}349`);
      await new Promise((r) => setTimeout(r, 5));
      await picUsed.pending();
    }
    const kept = (await pics.keys()).map((k) => k.url).filter((u) => !u.endsWith('-index'));
    expect(kept.length).toBe(300);
    expect(kept).not.toContain(`${PIC}0`);
    expect(kept).toContain(`${PIC}349`);
    expect(await (await food.match(FOOD))!.text()).toBe('food');
  });

  it("offline, ごはん's sheet missing: a quiet 504 too", async () => {
    const off = async () => Promise.reject(new TypeError('Load failed'));
    expect((await foodImgFetch(new Request(FOOD), blobCache('foodImg'), off, () => {})).status).toBe(504);
  });
});
