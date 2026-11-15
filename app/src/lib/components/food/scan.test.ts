import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FoodDb, Item } from '#lib/food/index.ts';
import { toColumns } from '#lib/food/db.ts';
import { forgetShards, JAN_TIMEOUT_MS } from '#lib/food/load.ts';
import { forgetAsked, lookupCode, LOADING_MS, PRODUCTS_WAIT_MS } from './scan.ts';

const counted: string[] = [];
vi.mock('#lib/sync/log.ts', () => ({ count: (k: string) => counted.push(k) }));

const chips: Item = { id: 'off:4901330502881', name: 'ポテトチップス', kcal: 554 };
const upc: Item = { id: 'off:0036000291452', name: 'Imported', kcal: 100 };
const db = { byId: new Map([chips, upc].map((i) => [i.id, i])), wantMore: () => Promise.resolve() } as unknown as FoodDb;
const offItem: Item = { id: 'off:4902102072618', name: 'Coca-Cola', kcal: 45 };

beforeEach(() => {
  counted.length = 0;
  forgetAsked();
  forgetShards();
});

describe('lookupCode: ours, then Open Food Facts, then nothing', () => {
  it('a product of ours by its code (a UPC-A read as 12 digits too), never asking OFF', async () => {
    const ask = vi.fn();
    expect(await lookupCode('4901330502881', db, '?', 'EAN-13', ask)).toEqual({ k: 'ours', item: chips });
    expect(await lookupCode('036000291452', db, '?', 'UPC-A', ask)).toEqual({ k: 'ours', item: upc });
    expect(ask).not.toHaveBeenCalled();
    expect(counted).toEqual(['act:scan.found', 'act:scan.found']);
  });
  it("not ours: OFF's item, asked once a session for a code", async () => {
    const ask = vi.fn(async () => ({ k: 'item' as const, item: offItem }));
    expect(await lookupCode('4902102072618', db, '?', undefined, ask)).toEqual({ k: 'off', item: offItem });
    expect(await lookupCode('4902102072618', db, '?', undefined, ask)).toEqual({ k: 'off', item: offItem });
    expect(ask).toHaveBeenCalledTimes(1);
    expect(ask).toHaveBeenCalledWith('4902102072618');
    expect(counted).toEqual(['act:scan.fallback', 'act:scan.fallback']);
  });
  it('OFF without it: miss; OFF unreached: offline (asked again next time); the catalog not in: OFF straight away', async () => {
    expect(await lookupCode('4902102072618', db, '?', undefined, async () => ({ k: 'none' }))).toEqual({ k: 'miss' });
    const ask = vi.fn(async () => ({ k: 'off' as const }));
    expect(await lookupCode('4902102072618', null, '?', undefined, ask)).toEqual({ k: 'offline' });
    expect(await lookupCode('4902102072618', null, '?', undefined, ask)).toEqual({ k: 'offline' });
    expect(ask).toHaveBeenCalledTimes(2);
    expect(counted).toEqual(['act:scan.miss', 'act:scan.offline', 'act:scan.offline']);
  });
  it('not a code (a wrong check digit): null, nothing asked or counted', async () => {
    const ask = vi.fn();
    expect(await lookupCode('4902102072619', db, '?', undefined, ask)).toBeNull();
    expect(ask).not.toHaveBeenCalled();
    expect(counted).toEqual([]);
  });
});

describe('lookupCode: the barcode shards between ours and Open Food Facts', () => {
  const kvass: Item = { id: 'off:4607001771883', name: 'Kvass', kcal: 27, p: 0, f: 0, c: 6.5, salt: 0 };
  const shardDb = { ...db, jan: 'j1' } as unknown as FoodDb;
  const shard = JSON.stringify(toColumns({ source: 'off', items: [kvass, { ...chips, name: 'not this one' }] }));
  const serve = (res: () => Promise<Response>) => {
    const asked: string[] = [];
    vi.stubGlobal('fetch', async (href: string) => (asked.push(href), res()));
    return asked;
  };
  afterEach(() => vi.unstubAllGlobals());

  it('a code beyond the products: its shard (jan/<last 3>.json under the index’s jan), fetched once, OFF never asked', async () => {
    const asked = serve(async () => new Response(shard));
    const ask = vi.fn();
    expect(await lookupCode('4607001771883', shardDb, '?', 'EAN-13', ask)).toEqual({ k: 'ours', item: { ...kvass, jan: '4607001771883' } });
    expect(await lookupCode('4607001771883', shardDb, '?', 'EAN-13', ask)).toMatchObject({ k: 'ours' });
    expect(asked.map((h) => h.replace(/^.*\/food\//, ''))).toEqual(['jan/883.json?v=j1']);
    expect(ask).not.toHaveBeenCalled();
    expect(counted).toEqual(['act:scan.found.jan', 'act:scan.found.jan']);
  });
  it('products.json first: a code in both is the products’, no shard fetched', async () => {
    const asked = serve(async () => new Response(shard));
    expect(await lookupCode('4901330502881', shardDb, '?', 'EAN-13', vi.fn())).toEqual({ k: 'ours', item: chips });
    expect([asked, counted]).toEqual([[], ['act:scan.found']]);
  });
  it('not in its shard (or no shard, 404), or the shard unreachable: OFF asked', async () => {
    serve(async () => new Response(null, { status: 404 }));
    const ask = vi.fn(async () => ({ k: 'none' as const }));
    expect(await lookupCode('4902102072618', shardDb, '?', undefined, ask)).toEqual({ k: 'miss' });
    serve(async () => { throw new TypeError('offline'); });
    expect(await lookupCode('4607001771883', shardDb, '?', undefined, async () => ({ k: 'off' }))).toEqual({ k: 'offline' });
    expect(counted).toEqual(['act:scan.miss', 'act:scan.offline']);
  });
  it('a shard that never answers: given up past JAN_TIMEOUT_MS, OFF asked; asked again next time', async () => {
    vi.useFakeTimers();
    try {
      // (AbortSignal.timeout on the faked clock; a fetch that settles only on its signal's abort, as a stalled network's)
      vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
        const ac = new AbortController();
        setTimeout(() => ac.abort(new DOMException('late', 'TimeoutError')), ms);
        return ac.signal;
      });
      const asked: string[] = [];
      vi.stubGlobal('fetch', (href: string, o: RequestInit) => (asked.push(href), new Promise((_, no) => o.signal!.addEventListener('abort', () => no(o.signal!.reason)))));
      const ask = vi.fn(async () => ({ k: 'off' as const }));
      let hit: unknown;
      void lookupCode('4607001771883', shardDb, '?', undefined, ask).then((h) => (hit = h));
      await vi.advanceTimersByTimeAsync(JAN_TIMEOUT_MS - 1);
      expect([hit, ask.mock.calls.length]).toEqual([undefined, 0]);
      await vi.advanceTimersByTimeAsync(1);
      expect(hit).toEqual({ k: 'offline' });
      expect(ask).toHaveBeenCalledTimes(1);
      void lookupCode('4607001771883', shardDb, '?', undefined, ask);
      await vi.advanceTimersByTimeAsync(0);
      expect(asked).toHaveLength(2);
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});

describe('lookupCode: our products (lazy) waited for before anything else', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  /** A catalog whose products come in `ms` after they're asked for: listed in `sets` at once (as addDataset lists a
   *  dataset before its slices are indexed), their items in byId only when wantMore settles. */
  const slowDb = (ms: number) => {
    const byId = new Map<string, Item>();
    let p: Promise<void> | undefined;
    const wantMore = vi.fn(() => (p ??= new Promise<void>((ok) => setTimeout(() => (byId.set(chips.id, chips), ok()), ms))));
    return { sets: [{ source: 'off' }], byId, wantMore } as unknown as FoodDb & { wantMore: typeof wantMore };
  };

  it('a read while the products load: it waits (読み込み中 past LOADING_MS), then finds ours; no shard or OFF asked', async () => {
    const d = slowDb(5000);
    const ask = vi.fn();
    const loading = vi.fn();
    let hit: unknown;
    void lookupCode('4901330502881', d, '?', 'EAN-13', ask, loading).then((h) => (hit = h));
    await vi.advanceTimersByTimeAsync(LOADING_MS - 1);
    expect([hit, loading.mock.calls.length]).toEqual([undefined, 0]);
    await vi.advanceTimersByTimeAsync(1);
    expect(loading).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(hit).toEqual({ k: 'ours', item: chips });
    expect(d.wantMore).toHaveBeenCalledWith(['off']);
    expect(ask).not.toHaveBeenCalled();
    expect(counted).toEqual(['act:scan.found']);
  });
  it('the products already in: no 読み込み中', async () => {
    const loading = vi.fn();
    expect(await lookupCode('4901330502881', db, '?', 'EAN-13', vi.fn(), loading)).toEqual({ k: 'ours', item: chips });
    await vi.advanceTimersByTimeAsync(LOADING_MS * 2);
    expect(loading).not.toHaveBeenCalled();
  });
  it('the products past PRODUCTS_WAIT_MS: on to OFF; its item found, else `late`, never `offline` or `miss`', async () => {
    const offs = vi.fn(async () => ({ k: 'off' as const }));
    const late = lookupCode('4901330502881', slowDb(PRODUCTS_WAIT_MS * 2), '?', 'EAN-13', offs);
    await vi.advanceTimersByTimeAsync(PRODUCTS_WAIT_MS - 1);
    expect(offs).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(await late).toEqual({ k: 'late' });
    const none = lookupCode('4901330502881', slowDb(PRODUCTS_WAIT_MS * 2), '?', 'EAN-13', async () => ({ k: 'none' as const }));
    await vi.advanceTimersByTimeAsync(PRODUCTS_WAIT_MS);
    expect(await none).toEqual({ k: 'late' });
    const found = lookupCode('4902102072618', slowDb(PRODUCTS_WAIT_MS * 2), '?', undefined, async () => ({ k: 'item' as const, item: offItem }));
    await vi.advanceTimersByTimeAsync(PRODUCTS_WAIT_MS);
    expect(await found).toEqual({ k: 'off', item: offItem });
    expect(counted).toEqual(['act:scan.late', 'act:scan.late', 'act:scan.fallback']);
  });
  it('the products failed to load (wantMore settles without them): no wait, OFF unreached is offline', async () => {
    const failed = { byId: new Map(), wantMore: () => Promise.resolve() } as unknown as FoodDb;
    expect(await lookupCode('4901330502881', failed, '?', 'EAN-13', async () => ({ k: 'off' }))).toEqual({ k: 'offline' });
  });
});
