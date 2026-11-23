// vendored.ts: the guards (a good index and shard pass; each broken field refuses), the shard pick (stable, spread
// over 35 shards), the sprite cells' math, and the loaders (the index and each shard fetched once a session; a 404's
// null kept — a pre-scrape build; a network miss or broken body forgotten at once, the next card asking again: one
// offline open never poisons the session — E4; a missing entry, a missing sheet: null; a k: id asks nothing). Fetch
// stubbed, nothing live.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fnv1a } from '#lib/random.ts';
import { cardCell, shardOf, vendoredIndexOf, vendoredShardOf, type VendoredIndex, type VendoredPlace } from './vendored.ts';

const GRID: [number, number] = [2, 3];
const INDEX: VendoredIndex = {
  v: 1, n: 2, skipped: 1, at: 1763600000,
  d: ['0.a1b2c3d4.json', '1.11223344.json'],
  sheets: ['c0.9f8e7d6c.webp'],
  card: [600, 338], grid: GRID
};
const CID = '16781234567890123456';
const ENTRY: VendoredPlace = {
  at: 1763600000, hours: [{ d: 1, o: 660, c: 1320 }, { d: 5, o: 1080, c: 1560 }],
  web: 'https://example.jp', tel: '+81312345678', desc: '駅前のラーメン屋。', r: 4.3, rn: 512, kind: 'ラーメン店',
  pics: [[0, 1, 0], [0, 0, 2]]
};

describe('the index guard', () => {
  it('accepts a good index', () => {
    expect(vendoredIndexOf(INDEX)).toEqual(INDEX);
    expect(vendoredIndexOf({ ...INDEX, d: [], sheets: [] })).not.toBeNull(); // nothing scraped yet
  });
  it('rejects a broken field', () => {
    for (const j of [null, [], 'x', { ...INDEX, v: 2 }, { ...INDEX, n: -1 }, { ...INDEX, n: 1.5 }, { ...INDEX, skipped: 'x' }, { ...INDEX, at: 'now' }]) {
      expect(vendoredIndexOf(j)).toBeNull();
    }
    for (const d of [['0.a1b2c3d4'], ['0.A1B2C3D4.json'], ['x.a1b2c3d4.json'], ['0.a1b2c3d.json'], [42]]) {
      expect(vendoredIndexOf({ ...INDEX, d })).toBeNull();
    }
    expect(vendoredIndexOf({ ...INDEX, sheets: ['c0.9f8e7d6c.png'] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, sheets: ['0.9f8e7d6c.webp'] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, sheets: ['t0.9f8e7d6c.webp'] })).toBeNull(); // the old thumb class, gone
    expect(vendoredIndexOf({ ...INDEX, card: [600] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, card: [600, 0] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, grid: [2] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, grid: [2, 3, 1] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, grid: [2.5, 3] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, grid: [0, 3] })).toBeNull();
  });
});

describe('the shard guard', () => {
  it('accepts a good shard', () => {
    const p = { [CID]: ENTRY, 'f:0x1a2b:0x3c4d': { at: 1763600000, hours: null }, '1': { at: 1, hours: [] } };
    expect(vendoredShardOf({ v: 1, p }, GRID)).toEqual(p);
    expect(vendoredShardOf({ v: 1, p: {} }, GRID)).toEqual({});
  });
  it('rejects a broken wrapper or key', () => {
    for (const j of [null, [], { v: 2, p: {} }, { v: 1 }, { v: 1, p: [] }]) expect(vendoredShardOf(j, GRID)).toBeNull();
    const e = { at: 1, hours: null };
    for (const id of ['k:abc123', 'abc', 'f:0X1A:0x2', 'f:0x1:0x2:0x3', '12a', 'f:0x:0x2']) {
      expect(vendoredShardOf({ v: 1, p: { [id]: e } }, GRID)).toBeNull();
    }
  });
  it('rejects each broken field', () => {
    const bad = (e: unknown) => vendoredShardOf({ v: 1, p: { [CID]: e } }, GRID);
    expect(bad(null)).toBeNull();
    expect(bad({ ...ENTRY, at: 'x' })).toBeNull();
    expect(bad({ ...ENTRY, hours: undefined })).toBeNull();
    expect(bad({ ...ENTRY, hours: [{ d: 7, o: 0, c: 60 }] })).toBeNull();
    expect(bad({ ...ENTRY, hours: [{ d: 1, o: 660, c: 660 }] })).toBeNull();
    expect(bad({ ...ENTRY, hours: [{ d: 1, o: 1440, c: 1500 }] })).toBeNull();
    expect(bad({ ...ENTRY, hours: [{ d: 1, o: 660, c: 10081 }] })).toBeNull();
    expect(bad({ ...ENTRY, web: 'http://example.jp' })).toBeNull();
    expect(bad({ ...ENTRY, web: 'example.jp' })).toBeNull();
    expect(bad({ ...ENTRY, tel: 'abc' })).toBeNull();
    expect(bad({ ...ENTRY, tel: '1234' })).toBeNull();
    expect(bad({ ...ENTRY, tel: '+81 (0)3-1234-5678 901' })).toBeNull();
    expect(bad({ ...ENTRY, desc: 'x'.repeat(241) })).toBeNull();
    expect(bad({ ...ENTRY, desc: 'a <b> tag' })).toBeNull();
    expect(bad({ ...ENTRY, r: 5.1 })).toBeNull();
    expect(bad({ ...ENTRY, r: -0.1 })).toBeNull();
    expect(bad({ ...ENTRY, r: '4.3' })).toBeNull();
    expect(bad({ ...ENTRY, rn: 1.5 })).toBeNull();
    expect(bad({ ...ENTRY, rn: -1 })).toBeNull();
    expect(bad({ ...ENTRY, kind: '' })).toBeNull();
    expect(bad({ ...ENTRY, kind: 42 })).toBeNull();
    expect(bad({ ...ENTRY, pics: [[0, 2, 0]] })).toBeNull(); // a col off the 2×3 grid
    expect(bad({ ...ENTRY, pics: [[0, 0, 3]] })).toBeNull(); // a row off it
    expect(bad({ ...ENTRY, pics: [[0, 0, -1]] })).toBeNull();
    expect(bad({ ...ENTRY, pics: [[-1, 0, 0]] })).toBeNull();
    expect(bad({ ...ENTRY, pics: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 0]] })).toBeNull(); // a fourth photo
    expect(bad({ ...ENTRY, pics: [[0, 0]] })).toBeNull();
    expect(bad({ ...ENTRY, pics: [[0.5, 0, 0]] })).toBeNull();
  });
});

describe('shardOf', () => {
  it('is stable and spreads', () => {
    const N = 35, counts = new Array<number>(N).fill(0);
    for (let i = 0; i < 10_000; i++) {
      const id = `1678123456789012${String(i).padStart(4, '0')}`;
      const s = shardOf(id, N);
      expect(s).toBe(shardOf(id, N));
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(N);
      counts[s]++;
    }
    const mean = 10_000 / N;
    for (const c of counts) {
      expect(c).toBeGreaterThan(mean * 0.6);
      expect(c).toBeLessThan(mean * 1.4);
    }
  });
  it("is random.ts's fnv1a mod n (the scraper packs by it)", () => {
    for (const id of [CID, 'f:0x1a2b:0x3c4d', '1', '99999999999999999999']) {
      for (const n of [2, 35, 88]) expect(shardOf(id, n)).toBe(fnv1a(id) % n);
    }
  });
});

describe('the sprite cells', () => {
  it('card math', () => {
    expect(cardCell(INDEX, ENTRY, 0)).toEqual({ url: '/places/img/c0.9f8e7d6c.webp', x: 600, y: 0, w: 600, h: 338 });
    expect(cardCell(INDEX, ENTRY, 1)).toEqual({ url: '/places/img/c0.9f8e7d6c.webp', x: 0, y: 676, w: 600, h: 338 });
    expect(cardCell(INDEX, ENTRY, 2)).toBeNull(); // no third photo
  });
  it('a cell naming a sheet the index lacks is null', () => {
    expect(cardCell(INDEX, { at: 1, hours: null, pics: [[9, 0, 0]] }, 0)).toBeNull();
  });
});

describe('the loaders', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  /** fetch stubbed by URL: the calls in order, a route absent a 404. */
  const stub = (routes: Record<string, () => Response>): string[] => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn((u: RequestInfo | URL) => {
      const url = String(u);
      calls.push(url);
      return Promise.resolve(routes[url]?.() ?? new Response('not found', { status: 404 }));
    }));
    return calls;
  };

  it('a 404 index is null, fetched once, re-asked past the TTL (a later deploy shows up)', async () => {
    vi.useFakeTimers();
    const { loadVendoredIndex } = await import('./vendored.ts');
    const routes: Record<string, () => Response> = {};
    const calls = stub(routes);
    expect(await loadVendoredIndex()).toBeNull();
    expect(await loadVendoredIndex()).toBeNull();
    expect(calls).toEqual(['/places/index.json']);
    vi.setSystemTime(Date.now() + 16 * 60_000); // past the 15 min TTL
    routes['/places/index.json'] = () => Response.json(INDEX);
    expect(await loadVendoredIndex()).toEqual(INDEX);
    expect(calls).toEqual(['/places/index.json', '/places/index.json']);
    vi.useRealTimers();
  });

  it('a 500 or broken index is null, the next ask retried (E4)', async () => {
    const { loadVendoredIndex } = await import('./vendored.ts');
    const routes: Record<string, () => Response> = { '/places/index.json': () => new Response('oops', { status: 500 }) };
    const calls = stub(routes);
    expect(await loadVendoredIndex()).toBeNull();
    expect(await loadVendoredIndex()).toBeNull();
    expect(calls).toEqual(['/places/index.json', '/places/index.json']); // every ask retried
    routes['/places/index.json'] = () => Response.json(INDEX);
    expect(await loadVendoredIndex()).toEqual(INDEX);
    expect(calls).toEqual(['/places/index.json', '/places/index.json', '/places/index.json']);
  });

  it('a broken index body is null and retried', async () => {
    const { loadVendoredIndex } = await import('./vendored.ts');
    const routes: Record<string, () => Response> = { '/places/index.json': () => new Response('not json', { status: 200 }) };
    const calls = stub(routes);
    expect(await loadVendoredIndex()).toBeNull();
    routes['/places/index.json'] = () => Response.json({ v: 2 });
    expect(await loadVendoredIndex()).toBeNull();
    routes['/places/index.json'] = () => Response.json(INDEX);
    expect(await loadVendoredIndex()).toEqual(INDEX);
    expect(calls.length).toBe(3);
  });

  it('the index is fetched once a session', async () => {
    const { loadVendoredIndex } = await import('./vendored.ts');
    const calls = stub({ '/places/index.json': () => Response.json(INDEX) });
    expect(await loadVendoredIndex()).toEqual(INDEX);
    expect(await loadVendoredIndex()).toEqual(INDEX);
    expect(calls).toEqual(['/places/index.json']);
  });

  it('a detail: the index and its shard once each, the entry or null', async () => {
    const { loadPlaceDetail } = await import('./vendored.ts');
    const s = shardOf(CID, 2);
    expect(shardOf('f:0x1a2b:0x3c4d', 2)).toBe(s); // the same shard: one fetch for both
    const full = { v: 1, p: { [CID]: ENTRY, 'f:0x1a2b:0x3c4d': { at: 2, hours: null } } };
    const calls = stub({
      '/places/index.json': () => Response.json(INDEX),
      [`/places/d/${INDEX.d[s]}`]: () => Response.json(full),
      [`/places/d/${INDEX.d[1 - s]}`]: () => Response.json({ v: 1, p: {} })
    });
    expect(await loadPlaceDetail(CID)).toEqual(ENTRY);
    expect(await loadPlaceDetail(CID)).toEqual(ENTRY); // the shard is kept
    expect(await loadPlaceDetail('f:0x1a2b:0x3c4d')).toEqual({ at: 2, hours: null });
    expect(calls).toEqual(['/places/index.json', `/places/d/${INDEX.d[s]}`]);
    // a missing entry: null, its shard fetched once and kept
    const miss = '99999999999999999999';
    expect(await loadPlaceDetail(miss)).toBeNull();
    const n = calls.length;
    expect(await loadPlaceDetail(miss)).toBeNull();
    expect(calls.length).toBe(n);
    expect(calls.length).toBeLessThanOrEqual(3); // at most the index and both shards
  });

  it('a missing or broken shard is null, the next ask retried', async () => {
    const { loadPlaceDetail } = await import('./vendored.ts');
    const routes: Record<string, () => Response> = {
      '/places/index.json': () => Response.json(INDEX),
      '/places/d/0.a1b2c3d4.json': () => Response.json({ v: 1, p: { 'k:x': { at: 1, hours: null } } }),
      '/places/d/1.11223344.json': () => new Response('gone', { status: 500 })
    };
    const calls = stub(routes);
    expect(await loadPlaceDetail(CID)).toBeNull();
    const s = shardOf(CID, 2);
    routes[`/places/d/${INDEX.d[s]}`] = () => Response.json({ v: 1, p: { [CID]: ENTRY } });
    expect(await loadPlaceDetail(CID)).toEqual(ENTRY);
    expect(calls.filter((u) => u.startsWith('/places/d/'))).toEqual([`/places/d/${INDEX.d[s]}`, `/places/d/${INDEX.d[s]}`]);
  });

  it('a 404 shard is null, re-asked past the TTL', async () => {
    vi.useFakeTimers();
    const { loadPlaceDetail } = await import('./vendored.ts');
    const s = shardOf(CID, 2);
    const routes: Record<string, () => Response> = { '/places/index.json': () => Response.json(INDEX) };
    const calls = stub(routes);
    expect(await loadPlaceDetail(CID)).toBeNull();
    vi.setSystemTime(Date.now() + 16 * 60_000);
    routes[`/places/d/${INDEX.d[s]}`] = () => Response.json({ v: 1, p: { [CID]: ENTRY } });
    expect(await loadPlaceDetail(CID)).toEqual(ENTRY);
    expect(calls.filter((u) => u.startsWith('/places/d/'))).toEqual([`/places/d/${INDEX.d[s]}`, `/places/d/${INDEX.d[s]}`]);
    vi.useRealTimers();
  });

  it('no index, no shard fetch', async () => {
    const { loadPlaceDetail } = await import('./vendored.ts');
    const calls = stub({});
    expect(await loadPlaceDetail(CID)).toBeNull();
    expect(calls).toEqual(['/places/index.json']);
  });

  it('a k: id is never looked up', async () => {
    const { loadPlaceDetail } = await import('./vendored.ts');
    const calls = stub({});
    expect(await loadPlaceDetail('k:abc123')).toBeNull();
    expect(await loadPlaceDetail('f:0X1A:0x2')).toBeNull();
    expect(calls).toEqual([]);
  });
});
