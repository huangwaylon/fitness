// vendored.ts: the guards (a good index and shard pass; each broken field refuses), the shard pick (stable, spread
// over 35 shards), the sprite cells' math, and the loaders (the index and each shard fetched once a session; a 404,
// a broken body, a missing entry, a missing sheet: null; a k: id asks nothing). Fetch stubbed, nothing live.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fnv1a } from '#lib/random.ts';
import { cardCell, shardOf, thumbCell, vendoredIndexOf, vendoredShardOf, type VendoredIndex, type VendoredPlace } from './vendored.ts';

const INDEX: VendoredIndex = {
  v: 1, n: 2, skipped: 1, at: 1763600000,
  d: ['0.a1b2c3d4.json', '1.11223344.json'],
  sheets: ['c0.9f8e7d6c.webp'],
  tsheets: ['t0.55667788.webp'],
  card: [800, 450], thumb: [192, 192]
};
const CID = '16781234567890123456';
const ENTRY: VendoredPlace = {
  at: 1763600000, hours: [{ d: 1, o: 660, c: 1320 }, { d: 5, o: 1080, c: 1560 }],
  web: 'https://example.jp', tel: '+81312345678', desc: '駅前のラーメン屋。', r: 4.3, rn: 512, kind: 'ラーメン店',
  pics: [[0, 1, 0], [0, 2, 3]], t: [0, 3, 4]
};

describe('the index guard', () => {
  it('accepts a good index', () => {
    expect(vendoredIndexOf(INDEX)).toEqual(INDEX);
    expect(vendoredIndexOf({ ...INDEX, d: [], sheets: [], tsheets: [] })).not.toBeNull(); // nothing scraped yet
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
    expect(vendoredIndexOf({ ...INDEX, tsheets: ['x0.9f8e7d6c.webp'] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, card: [800] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, card: [800, 0] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, thumb: [192, 192, 1] })).toBeNull();
    expect(vendoredIndexOf({ ...INDEX, thumb: [192.5, 192] })).toBeNull();
  });
});

describe('the shard guard', () => {
  it('accepts a good shard', () => {
    const p = { [CID]: ENTRY, 'f:0x1a2b:0x3c4d': { at: 1763600000, hours: null }, '1': { at: 1, hours: [] } };
    expect(vendoredShardOf({ v: 1, p })).toEqual(p);
    expect(vendoredShardOf({ v: 1, p: {} })).toEqual({});
  });
  it('rejects a broken wrapper or key', () => {
    for (const j of [null, [], { v: 2, p: {} }, { v: 1 }, { v: 1, p: [] }]) expect(vendoredShardOf(j)).toBeNull();
    const e = { at: 1, hours: null };
    for (const id of ['k:abc123', 'abc', 'f:0X1A:0x2', 'f:0x1:0x2:0x3', '12a', 'f:0x:0x2']) {
      expect(vendoredShardOf({ v: 1, p: { [id]: e } })).toBeNull();
    }
  });
  it('rejects each broken field', () => {
    const bad = (e: unknown) => vendoredShardOf({ v: 1, p: { [CID]: e } });
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
    expect(bad({ ...ENTRY, pics: [[0, 4, 0]] })).toBeNull(); // a col off the 4×4 card grid
    expect(bad({ ...ENTRY, pics: [[0, 0, -1]] })).toBeNull();
    expect(bad({ ...ENTRY, pics: [[-1, 0, 0]] })).toBeNull();
    expect(bad({ ...ENTRY, pics: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]] })).toBeNull(); // a fourth card
    expect(bad({ ...ENTRY, pics: [[0, 0]] })).toBeNull();
    expect(bad({ ...ENTRY, t: [0, 10, 0] })).toBeNull(); // a col off the 10×10 thumb grid
    expect(bad({ ...ENTRY, t: [0, 0, 0, 0] })).toBeNull();
    expect(bad({ ...ENTRY, t: [0.5, 0, 0] })).toBeNull();
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
  it('is random.ts\'s fnv1a mod n (the scraper packs by it)', () => {
    for (const id of [CID, 'f:0x1a2b:0x3c4d', '1', '99999999999999999999']) {
      for (const n of [2, 35, 88]) expect(shardOf(id, n)).toBe(fnv1a(id) % n);
    }
  });
});

describe('the sprite cells', () => {
  it('card and thumb math', () => {
    expect(cardCell(INDEX, ENTRY, 0)).toEqual({ url: '/places/img/c0.9f8e7d6c.webp', x: 800, y: 0, w: 800, h: 450 });
    expect(cardCell(INDEX, ENTRY, 1)).toEqual({ url: '/places/img/c0.9f8e7d6c.webp', x: 1600, y: 1350, w: 800, h: 450 });
    expect(cardCell(INDEX, ENTRY, 2)).toBeNull(); // no third photo
    expect(thumbCell(INDEX, ENTRY)).toEqual({ url: '/places/img/t0.55667788.webp', x: 576, y: 768, w: 192, h: 192 });
    expect(thumbCell(INDEX, { at: 1, hours: null })).toBeNull();
  });
  it('a cell naming a sheet the index lacks is null', () => {
    expect(cardCell(INDEX, { at: 1, hours: null, pics: [[9, 0, 0]] }, 0)).toBeNull();
    expect(thumbCell(INDEX, { at: 1, hours: null, t: [3, 0, 0] })).toBeNull();
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

  it('a 404 index is null, fetched once', async () => {
    const { loadVendoredIndex } = await import('./vendored.ts');
    const calls = stub({});
    expect(await loadVendoredIndex()).toBeNull();
    expect(await loadVendoredIndex()).toBeNull();
    expect(calls).toEqual(['/places/index.json']);
  });

  it('a broken index body is null', async () => {
    const { loadVendoredIndex } = await import('./vendored.ts');
    stub({ '/places/index.json': () => new Response('not json', { status: 200 }) });
    expect(await loadVendoredIndex()).toBeNull();
    vi.resetModules();
    const again = await import('./vendored.ts');
    stub({ '/places/index.json': () => Response.json({ v: 2 }) });
    expect(await again.loadVendoredIndex()).toBeNull();
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
    const full = { v: 1, p: { [CID]: ENTRY, 'f:0x1a2b:0x3c4d': { at: 2, hours: null, t: [0, 0, 0] } } };
    const calls = stub({
      '/places/index.json': () => Response.json(INDEX),
      [`/places/d/${INDEX.d[s]}`]: () => Response.json(full),
      [`/places/d/${INDEX.d[1 - s]}`]: () => Response.json({ v: 1, p: {} })
    });
    expect(await loadPlaceDetail(CID)).toEqual(ENTRY);
    expect(await loadPlaceDetail(CID)).toEqual(ENTRY); // the shard is kept
    expect(await loadPlaceDetail('f:0x1a2b:0x3c4d')).toEqual({ at: 2, hours: null, t: [0, 0, 0] });
    expect(calls).toEqual(['/places/index.json', `/places/d/${INDEX.d[s]}`]);
    // a missing entry: null, its shard fetched once and kept
    const miss = '99999999999999999999';
    expect(await loadPlaceDetail(miss)).toBeNull();
    const n = calls.length;
    expect(await loadPlaceDetail(miss)).toBeNull();
    expect(calls.length).toBe(n);
    expect(calls.length).toBeLessThanOrEqual(3); // at most the index and both shards
  });

  it('a missing or broken shard is null', async () => {
    const { loadPlaceDetail } = await import('./vendored.ts');
    stub({
      '/places/index.json': () => Response.json(INDEX),
      '/places/d/0.a1b2c3d4.json': () => Response.json({ v: 1, p: { 'k:x': { at: 1, hours: null } } }),
      '/places/d/1.11223344.json': () => new Response('gone', { status: 500 })
    });
    expect(await loadPlaceDetail(CID)).toBeNull();
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
