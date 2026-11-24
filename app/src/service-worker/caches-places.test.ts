// 保存した場所's vendored details and photos in the service worker (caches.ts PLACE_CACHE): never precached, a
// hash-named shard or sheet cache first and never revalidated, index.json cache-first with the network asked behind
// it (the card never waits on lie-fi), the files a new index no longer names let go, the sheets bounded.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { foodImgEvict, foodImgFetch, isPlaceData, isPlaceImg, isPlacePic, PLACE_CACHE, PLACE_IMG_CAP_BYTES, PLACE_IMG_CAP_N, PLACE_PIC_CAP_BYTES, PLACE_PIC_CAP_N, placeFetch, placeImgEvict, placePicEvict, placePicFetch, placeStale, precachable, type RoomIndex } from './caches.ts';
import { blobCache, configureFiles, STORES } from './blobCache.ts';
import { boundedCache } from './bounded.ts';

const BASE = 'https://x.example/fitness/places/';

describe("保存した場所's vendored files (classifiers, precachable)", () => {
  it('the shards and index.json are data, the sheets img, none precached', () => {
    for (const p of ['/places/index.json', '/fitness/places/index.json', '/places/d/0.abcdef12.json', '/fitness/places/d/12.00000000.json']) expect([isPlaceData(p), isPlaceImg(p), precachable(p)]).toEqual([true, false, false]);
    for (const p of ['/places/img/c0.abcdef12.webp', '/fitness/places/img/t12.00000000.webp']) expect([isPlaceImg(p), isPlaceData(p), precachable(p)]).toEqual([true, false, false]);
    // not a shard: a hash with upper case, a name without one, a deeper folder
    for (const p of ['/places/d/0.ABCDEF12.json', '/places/d/0.json', '/places/x/0.abcdef12.json', '/places/index.json.txt']) expect(isPlaceData(p)).toBe(false);
    // an ordinary file is still precached
    expect(precachable('art/fruit3d/peach.webp')).toBe(true);
  });
});

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
  it('one kept in the place store before their own (11-24) goes at once; the sheets keep their own count', () => {
    const idx: RoomIndex = { [PIC]: [10, 5], [`${BASE}img/a.webp`]: [10, 2], [`${BASE}index.json`]: [10, 0] };
    expect(placeImgEvict(idx, 10, 80_000_000, 1)).toEqual([PIC]);
    expect(placeImgEvict({ [`${BASE}img/a.webp`]: [10, 2], [`${BASE}img/b.webp`]: [10, 3] }, 10, 80_000_000, 1)).toEqual([`${BASE}img/a.webp`]);
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

describe("the place photos' store is their own (blobCache placePic): browsing cards never evicts ごはん's pictures or the sheets", () => {
  beforeEach(() => configureFiles(new IDBFactory()));
  afterEach(() => configureFiles(null));
  const PIC = `https://lh3.googleusercontent.com/grass-cs/${'B'.repeat(40)}=w600-h338-k-no`;
  const FOOD = 'https://x.example/fitness/food-img/s0.11111111.webp', SHEET = `${BASE}img/c0.11111111.webp`;

  it('a store of its own in the database', () => expect(STORES).toContain('placePic'));

  it('350 photos browsed: 300 kept (the oldest out), the food sheet and the place sheet untouched', async () => {
    const pics = blobCache('placePic'), food = blobCache('foodImg'), place = blobCache('place');
    let t = 0;
    const now = () => ++t;
    const opts = { tidyMs: 0, now };
    const picUsed = boundedCache(async () => pics, 'https://x.example/__place-pic-index', (i, n) => placePicEvict(i, n), opts);
    const foodUsed = boundedCache(async () => food, 'https://x.example/__food-img-index', (i, n) => foodImgEvict(i, n), opts);
    const placeUsed = boundedCache(async () => place, 'https://x.example/__place-img-index', (i, n) => placeImgEvict(i, n), opts);
    await foodImgFetch(new Request(FOOD), food, async () => new Response('food'), (p) => void p, undefined, (u, n) => void foodUsed(u, n));
    await new Promise((r) => setTimeout(r, 5));
    await foodUsed.pending();
    await placeFetch(new Request(SHEET), place, async () => new Response('sheet'), (p) => void p, undefined, (u, n) => void placeUsed(u, n));
    await new Promise((r) => setTimeout(r, 5));
    await placeUsed.pending();
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
    expect(await (await place.match(SHEET))!.text()).toBe('sheet');
  });

  it("offline, ごはん's and the vendored sheets missing: a quiet 504 too", async () => {
    const off = async () => Promise.reject(new TypeError('Load failed'));
    expect((await foodImgFetch(new Request(FOOD), blobCache('foodImg'), off, () => {})).status).toBe(504);
    expect((await placeFetch(new Request(SHEET), blobCache('place'), off, () => {})).status).toBe(504);
    // (a shard is no image: its error stands, vendored.ts's fetch catches it)
    await expect(placeFetch(new Request(`${BASE}d/0.aaaaaaaa.json`), blobCache('place'), off, () => {})).rejects.toThrow();
  });
});

describe('placeStale', () => {
  const keys = [`${BASE}index.json`, `${BASE}d/0.aaaaaaaa.json`, `${BASE}d/1.bbbbbbbb.json`, `${BASE}img/c0.11111111.webp`, `${BASE}img/t0.22222222.webp`];
  it('drops a shard or sheet the new index no longer names, keeps the listed ones and index.json', () => {
    const idx = JSON.stringify({ d: ['d/0.aaaaaaaa.json'], sheets: ['c0.11111111.webp'], tsheets: ['t0.22222222.webp'] });
    expect(placeStale(keys, idx)).toEqual([keys[2]]);
    // the arrays' entries by bare file name too
    expect(placeStale(keys, JSON.stringify({ d: ['0.aaaaaaaa.json', '1.bbbbbbbb.json'], sheets: ['c0.11111111.webp'], tsheets: [] }))).toEqual([keys[4]]);
    // every array missing from the index: its files are stale
    expect(placeStale(keys, JSON.stringify({ d: ['0.aaaaaaaa.json'] }))).toEqual([keys[2], keys[3], keys[4]]);
  });
  it('an unreadable index drops nothing', () => {
    expect([placeStale(keys, 'not json'), placeStale(keys, '{}')]).toEqual([[], []]);
  });
});

describe('placeImgEvict (the sheets bounded, the JSON exempt)', () => {
  const MB = 1_000_000;
  it('past PLACE_IMG_CAP_BYTES the least recently used sheets go, never index.json or a shard', () => {
    expect(PLACE_IMG_CAP_BYTES).toBe(80 * MB);
    const idx: RoomIndex = { [`${BASE}index.json`]: [1000, 1], [`${BASE}d/0.aaaaaaaa.json`]: [2000, 2], [`${BASE}img/a.webp`]: [50 * MB, 3], [`${BASE}img/b.webp`]: [40 * MB, 4] };
    expect(placeImgEvict(idx, 10)).toEqual([`${BASE}img/a.webp`]);
    // the JSON alone over the cap: nothing goes
    expect(placeImgEvict({ [`${BASE}index.json`]: [90 * MB, 1] }, 10)).toEqual([]);
  });
  it('and past PLACE_IMG_CAP_N sheets, the least recently used (the JSON not counted)', () => {
    expect(PLACE_IMG_CAP_N).toBe(200);
    const idx: RoomIndex = { [`${BASE}index.json`]: [1000, 1], [`${BASE}d/0.aaaaaaaa.json`]: [2000, 2], [`${BASE}img/a.webp`]: [10, 3], [`${BASE}img/b.webp`]: [10, 4], [`${BASE}img/c.webp`]: [10, 5] };
    expect(placeImgEvict(idx, 10, 80 * MB, 1)).toEqual([`${BASE}img/a.webp`, `${BASE}img/b.webp`]);
  });
});

describe("保存した場所's vendored fetches (placeFetch)", () => {
  class MemCache {
    m = new Map<string, string>();
    key = (r: Request | string) => (typeof r === 'string' ? r : r.url);
    async match(r: Request | string) { const b = this.m.get(this.key(r)); return b === undefined ? undefined : new Response(b); }
    async put(r: Request | string, res: Response) { this.m.set(this.key(r), await res.text()); }
    async delete(r: Request | string) { return this.m.delete(this.key(r)); }
    async keys() { return [...this.m.keys()].map((k) => new Request(k)); }
  }
  let cache: MemCache, bg: Promise<unknown>[], calls: string[], served: Record<string, string>, slow: number, offline: boolean;
  const net = async (r: Request) => {
    calls.push(r.url);
    if (offline) throw new TypeError('offline');
    if (slow) await new Promise((ok) => setTimeout(ok, slow));
    const b = served[r.url];
    return b === undefined ? new Response('', { status: 404 }) : new Response(b);
  };
  const get = async (f: string, used?: (u: string, n?: number) => void) => {
    const res = await placeFetch(new Request(BASE + f), cache as unknown as Cache, net, (p) => bg.push(p), 40, used);
    return res.type === 'error' ? null : await res.text();
  };
  /** The background work done (a late answer's timer run out on the fake clock first). */
  const settled = async () => {
    while (bg.length) {
      await vi.runAllTimersAsync();
      await bg.shift();
    }
  };
  beforeEach(() => {
    cache = new MemCache();
    bg = [];
    calls = [];
    slow = 0;
    offline = false;
    vi.useFakeTimers(); // the network's lateness and the timeout on a fake clock (docs/ops/testing.md "Hermetic")
    served = {
      [`${BASE}index.json`]: JSON.stringify({ d: ['d/0.aaaaaaaa.json'], sheets: ['c0.11111111.webp'], tsheets: [] }),
      [`${BASE}d/0.aaaaaaaa.json`]: '{"name":"a"}',
      [`${BASE}img/c0.11111111.webp`]: 'sheet'
    };
  });
  afterEach(() => vi.useRealTimers());
  /** `p` once `ms` of fake time have passed: it must have answered by then. */
  const by = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
    let done = false;
    void p.then(() => (done = true), () => (done = true));
    await vi.advanceTimersByTimeAsync(ms);
    expect(done).toBe(true);
    return p;
  };

  it('a sheet: the network once, the cache after (no second ask), its use marked; offline before that, a quiet 504 (the card shows its placeholder)', async () => {
    const marks: [string, number | undefined][] = [];
    const used = (u: string, n?: number) => void marks.push([u, n]);
    expect(await get('img/c0.11111111.webp', used)).toBe('sheet');
    await settled();
    expect(await get('img/c0.11111111.webp', used)).toBe('sheet');
    expect(calls).toEqual([`${BASE}img/c0.11111111.webp`]);
    expect(marks).toEqual([[`${BASE}img/c0.11111111.webp`, 5], [`${BASE}img/c0.11111111.webp`, undefined]]);
    offline = true;
    expect(await get('img/c0.11111111.webp')).toBe('sheet');
    // an unviewed card's sheet offline: a clean failure, nothing served
    cache.m.clear();
    expect((await placeFetch(new Request(`${BASE}img/c0.11111111.webp`), cache as unknown as Cache, net, (p) => bg.push(p), 40)).status).toBe(504);
  });

  it('a shard the same: the network once, the cache after, offline too', async () => {
    expect(await get('d/0.aaaaaaaa.json')).toBe('{"name":"a"}');
    await settled();
    expect(await get('d/0.aaaaaaaa.json')).toBe('{"name":"a"}');
    expect(calls).toEqual([`${BASE}d/0.aaaaaaaa.json`]);
    offline = true;
    expect(await get('d/0.aaaaaaaa.json')).toBe('{"name":"a"}');
    // an unviewed card's shard offline: a clean failure
    cache.m.clear();
    await expect(placeFetch(new Request(`${BASE}d/0.aaaaaaaa.json`), cache as unknown as Cache, net, (p) => bg.push(p), 40)).rejects.toThrow('offline');
  });

  it('index.json from the network, stored; a fresh one drops the shards and sheets it no longer names', async () => {
    cache.m.set(`${BASE}d/9.99999999.json`, 'old');
    cache.m.set(`${BASE}img/c9.99999999.webp`, 'old');
    expect(await get('index.json')).toContain('aaaaaaaa');
    await settled();
    expect([...cache.m.keys()]).toEqual([`${BASE}index.json`]);
  });

  it('index.json: a cached copy answers at once, the network asked all the same (lie-fi: the card never waits)', async () => {
    expect(await get('index.json')).toContain('aaaaaaaa');
    await settled();
    slow = 60 * 60_000; // the network never answers in time
    expect(await by(get('index.json'), 5)).toContain('aaaaaaaa');
    expect(calls).toEqual([`${BASE}index.json`, `${BASE}index.json`]);
  });

  it('index.json: the cached copy when the network is slow or gone, the late answer stored after', async () => {
    expect(await get('index.json')).toContain('aaaaaaaa');
    await settled();
    slow = 200;
    served[`${BASE}index.json`] = JSON.stringify({ d: ['d/0.cccccccc.json'], sheets: [], tsheets: [] });
    expect(await by(get('index.json'), 40)).toContain('aaaaaaaa');
    await settled();
    offline = true;
    expect(await get('index.json')).toContain('cccccccc');
    // nothing cached and offline: the network's error
    cache.m.clear();
    expect(await get('index.json')).toBe(null);
  });
});
