import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FoodDb, Item } from '#lib/food/index.ts';
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
