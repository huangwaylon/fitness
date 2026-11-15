import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FoodDb, Item } from '#lib/food/index.ts';
import { toColumns } from '#lib/food/db.ts';
import { forgetShards } from '#lib/food/load.ts';
import { forgetAsked, lookupCode } from './scan.ts';

const counted: string[] = [];
vi.mock('#lib/sync/log.ts', () => ({ count: (k: string) => counted.push(k) }));

const chips: Item = { id: 'off:4901330502881', name: 'ポテトチップス', kcal: 554 };
const upc: Item = { id: 'off:0036000291452', name: 'Imported', kcal: 100 };
const db = { byId: new Map([chips, upc].map((i) => [i.id, i])) } as unknown as FoodDb;
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
  const withJan = { ...db, jan: 'j1' } as unknown as FoodDb;
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
    expect(await lookupCode('4607001771883', withJan, '?', 'EAN-13', ask)).toEqual({ k: 'ours', item: { ...kvass, jan: '4607001771883' } });
    expect(await lookupCode('4607001771883', withJan, '?', 'EAN-13', ask)).toMatchObject({ k: 'ours' });
    expect(asked.map((h) => h.replace(/^.*\/food\//, ''))).toEqual(['jan/883.json?v=j1']);
    expect(ask).not.toHaveBeenCalled();
    expect(counted).toEqual(['act:scan.found.jan', 'act:scan.found.jan']);
  });
  it('products.json first: a code in both is the products’, no shard fetched', async () => {
    const asked = serve(async () => new Response(shard));
    expect(await lookupCode('4901330502881', withJan, '?', 'EAN-13', vi.fn())).toEqual({ k: 'ours', item: chips });
    expect([asked, counted]).toEqual([[], ['act:scan.found']]);
  });
  it('not in its shard (or no shard, 404), or the shard unreachable: OFF asked', async () => {
    serve(async () => new Response(null, { status: 404 }));
    const ask = vi.fn(async () => ({ k: 'none' as const }));
    expect(await lookupCode('4902102072618', withJan, '?', undefined, ask)).toEqual({ k: 'miss' });
    serve(async () => { throw new TypeError('offline'); });
    expect(await lookupCode('4607001771883', withJan, '?', undefined, async () => ({ k: 'off' }))).toEqual({ k: 'offline' });
    expect(counted).toEqual(['act:scan.miss', 'act:scan.offline']);
  });
});
