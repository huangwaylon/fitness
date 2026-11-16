// The barcode shards' rules (jan.ts): which codes ship, where one is.
import { describe, expect, it } from 'vitest';
import { janShard, janShips, storeCode, weakName } from './jan.ts';
import type { Item } from './types.ts';

describe('the barcode shards', () => {
  it('a shard is the code’s last 2 digits', () => {
    expect([janShard('4901330502881'), janShard('49012345')]).toEqual(['81', '45']);
  });
  it('a store’s own code (GS1 02, 20–29; an EAN-8’s 2) never ships; a maker’s does', () => {
    expect(['0200858803000', '2012345678901', '2912345678906', '21234567'].map(storeCode)).toEqual([true, true, true, true]);
    expect(['0002963404000', '0123456789012', '4901330502881', '3012345678904', '49012345'].map(storeCode)).toEqual([false, false, false, false, false]);
  });
  it('a weak name (none, under 2 letters: digits and marks alone) never ships', () => {
    expect([undefined, '', 'ア', '1234', '・-・', '100%'].map(weakName)).toEqual([true, true, true, true, true, true]);
    expect(['お茶', 'Kvass', 'C1000 ビタミン'].map(weakName)).toEqual([false, false, false]);
  });
  it('ships a code beyond products.json, of a maker, with a name', () => {
    const it = (jan: string, name = 'Kvass'): Item => ({ id: `off:${jan}`, jan, name, kcal: 27 });
    const have = new Set(['4901330502881']);
    expect([it('4607001771883'), it('4901330502881'), it('0200858803000'), it('4607001771883', '12')].map((x) => janShips(x, have))).toEqual([true, false, false, false]);
  });
});
