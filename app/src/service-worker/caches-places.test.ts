// 保存した場所's vendored details and photos in the service worker (caches.ts PLACE_CACHE): never precached, a
// hash-named shard or sheet cache first and never revalidated, index.json network first with a timeout, the files a
// new index no longer names let go, the sheets bounded.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isPlaceData, isPlaceImg, PLACE_CACHE, PLACE_IMG_CAP_BYTES, PLACE_IMG_CAP_N, placeFetch, placeImgEvict, placeStale, precachable, type RoomIndex } from './caches.ts';

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
    expect(PLACE_IMG_CAP_N).toBe(600);
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

  it('a sheet: the network once, the cache after (no second ask), its use marked; offline before that, the fetch fails (the card shows its placeholder)', async () => {
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
    await expect(placeFetch(new Request(`${BASE}img/c0.11111111.webp`), cache as unknown as Cache, net, (p) => bg.push(p), 40)).rejects.toThrow('offline');
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
