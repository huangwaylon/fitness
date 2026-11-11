import { describe, expect, it } from 'vitest';
import type { ShopRowAt } from '#lib/contract/shop.ts';
import { STOCK_N, UNITS_FROM, buyPrice, stockOf } from '#lib/contract/stock.ts';
import { addDays } from '#lib/contract/tokyo.ts';
import { BUY } from '#lib/contract/buyPrices.ts';
import type { State } from '#lib/model/state.ts';
import { ITEMS } from '../tent/items.ts';
import { MAX_STARTS, foundBefore, packOf, shortBy, startsFill, stockAt } from './stock.ts';

const at = (iso: string) => Date.parse(iso);
const NOW = at('2026-11-09T15:00:00+09:00');
const START = at('2026-11-09T00:00:00+09:00');
const catOf = (code: string) => ITEMS[code].cat!;
type S = Pick<State, 'finds' | 'shop'>;
const find = (code: string, when: number, person: 'A' | 'B' | 'G' = 'A'): S['finds'][number] => ({ at: when, person, kind: 'item', id: catOf(code) });
const buy = (item: string, when: number, person: 'A' | 'B' | 'G' = 'B'): ShopRowAt => ({ type: 'buy', data: { item, price: buyPrice(item)!, d: '2026-11-08' }, at: when, person });

describe('かう’s stock', () => {
  const plain = stockOf('2026-11-09');
  /** The day's ずかん pieces (a balloon's find can be one) and the rest (the shop's alone: NH's whole catalogue). */
  const cats = plain.filter((c) => ITEMS[c].cat), rest = plain.filter((c) => !ITEMS[c].cat);

  it('is 24 pieces, none the island found (anyone’s ずかん finds) or bought (anyone’s) before the day', () => {
    const [f1, f2] = cats, [b1] = rest;
    const s: S = { finds: [find(f1, START - 60_000), find(f2, START - 1, 'G')], shop: [buy(b1, START - 3_600_000)] };
    expect(foundBefore(s, START)).toEqual(new Set([f1, f2, b1]));
    const stock = stockAt(s, NOW);
    expect(stock).toHaveLength(STOCK_N);
    for (const c of [f1, f2, b1]) expect(stock).not.toContain(c);
  });

  it('is the same on both phones all day: a find or a buy today changes nothing till tomorrow', () => {
    const a: S = { finds: [], shop: [] };
    const b: S = { finds: [find(cats[0], START + 3_600_000)], shop: [buy(rest[0], START + 7_200_000)] };
    expect(stockAt(a, NOW)).toEqual(plain);
    expect(stockAt(b, NOW)).toEqual(plain);
    expect(stockAt(b, at('2026-11-10T09:00:00+09:00'))).toEqual(stockOf('2026-11-10', new Set([cats[0], rest[0]])));
  });

  it('a recipe or a catch is no piece; a found piece the shop never sells changes nothing', () => {
    const s: S = { finds: [{ at: START - 1, person: 'A', kind: 'recipe', id: catOf(cats[0]) }, { at: START - 1, person: 'A', kind: 'fish', id: 'koi' }], shop: [] };
    expect(stockAt(s, NOW)).toEqual(plain);
  });

  it('sells out when the island has every piece', () => {
    const s: S = { finds: [], shop: Object.keys(BUY).map((c) => buy(c, START - 1)) };
    expect(stockAt(s, NOW)).toEqual([]);
  });
});

describe('かう’s packs', () => {
  it('a day’s stock is cut from few packs (each fetched whole): about a third of the days before UNITS_FROM', () => {
    const packs = (d: string, unit?: typeof packOf) => new Set(stockOf(d, new Set(), unit).flatMap((c) => packOf(c) ?? [])).size;
    const days = Array.from({ length: 60 }, (_, i) => addDays(UNITS_FROM, i));
    const mean = (f: (d: string) => number) => days.reduce((s, d) => s + f(d), 0) / days.length;
    const old = mean((d) => packs(d)), now = mean((d) => packs(d, packOf));
    expect(old).toBeGreaterThan(11);
    expect(now).toBeLessThan(old / 2.5);
    // (as many packed pieces as before: the same list, its packs' pieces side by side)
    const packed = (unit?: typeof packOf) => mean((d) => stockOf(d, new Set(), unit).filter((c) => packOf(c)).length);
    expect(packed(packOf)).toBeGreaterThan(packed() - 3);
  });
});

describe('かう’s tiles past my かいがら', () => {
  it('say how many short; none at the price or under it', () => {
    expect([shortBy(800, 271), shortBy(271, 271), shortBy(9, 271), shortBy(10_000, 0)]).toEqual([529, 0, 0, 10_000]);
  });
});

describe('苗’s row tap (startsFill): what my free plots still want', () => {
  it('my free plots less the starts I hold and the other crops picked; at least one, at most MAX_STARTS', () => {
    expect(startsFill(38, 0, {}, 'tomato')).toBe(38);
    expect(startsFill(38, 5, {}, 'tomato')).toBe(33);
    expect(startsFill(38, 5, { tomato: 2, wheat: 10 }, 'tomato')).toBe(23);
    expect(startsFill(0, 0, {}, 'tomato')).toBe(1);
    expect(startsFill(10, 30, {}, 'tomato')).toBe(1);
    expect(startsFill(500, 0, {}, 'tomato')).toBe(MAX_STARTS);
  });
});
