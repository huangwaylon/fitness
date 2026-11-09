import { describe, expect, it } from 'vitest';
import type { ShopRowAt } from '#lib/contract/shop.ts';
import { STOCK_N, buyPrice, stockOf } from '#lib/contract/stock.ts';
import { BUY } from '#lib/contract/buyPrices.ts';
import type { State } from '#lib/model/state.ts';
import { ITEMS } from '../tent/items.ts';
import { foundBefore, stockAt } from './stock.ts';

const at = (iso: string) => Date.parse(iso);
const NOW = at('2026-11-09T15:00:00+09:00');
const START = at('2026-11-09T00:00:00+09:00');
const catOf = (code: string) => ITEMS[code].cat!;
type S = Pick<State, 'finds' | 'shop'>;
const find = (code: string, when: number, person: 'A' | 'B' | 'G' = 'A'): S['finds'][number] => ({ at: when, person, kind: 'item', id: catOf(code) });
const buy = (item: string, when: number, person: 'A' | 'B' | 'G' = 'B'): ShopRowAt => ({ type: 'buy', data: { item, price: buyPrice(item)!, d: '2026-11-08' }, at: when, person });

describe('かう’s stock', () => {
  const plain = stockOf('2026-11-09');

  it('is 24 pieces, none the island found (anyone’s ずかん finds) or bought (anyone’s) before the day', () => {
    const [f1, f2, b1] = plain;
    const s: S = { finds: [find(f1, START - 60_000), find(f2, START - 1, 'G')], shop: [buy(b1, START - 3_600_000)] };
    expect(foundBefore(s, START)).toEqual(new Set([f1, f2, b1]));
    const stock = stockAt(s, NOW);
    expect(stock).toHaveLength(STOCK_N);
    for (const c of [f1, f2, b1]) expect(stock).not.toContain(c);
  });

  it('is the same on both phones all day: a find or a buy today changes nothing till tomorrow', () => {
    const a: S = { finds: [], shop: [] };
    const b: S = { finds: [find(plain[0], START + 3_600_000)], shop: [buy(plain[1], START + 7_200_000)] };
    expect(stockAt(a, NOW)).toEqual(plain);
    expect(stockAt(b, NOW)).toEqual(plain);
    expect(stockAt(b, at('2026-11-10T09:00:00+09:00'))).toEqual(stockOf('2026-11-10', new Set([plain[0], plain[1]])));
  });

  it('a recipe or a catch is no piece; a found piece the shop never sells changes nothing', () => {
    const s: S = { finds: [{ at: START - 1, person: 'A', kind: 'recipe', id: catOf(plain[0]) }, { at: START - 1, person: 'A', kind: 'fish', id: 'koi' }], shop: [] };
    expect(stockAt(s, NOW)).toEqual(plain);
  });

  it('sells out when the island has every piece', () => {
    const s: S = { finds: [], shop: Object.keys(BUY).map((c) => buy(c, START - 1)) };
    expect(stockAt(s, NOW)).toEqual([]);
  });
});
