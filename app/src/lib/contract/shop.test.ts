// The shop's rules (contract/shop.ts): the price list's scale, a sell's and a buy's shape and price, the day's stock
// (the same on every phone and the record, from the date alone) and the ledger (the pocket, かいがら, a piece once).
import { describe, expect, it } from 'vitest';
import { BASICS, STOCK_N, buyOf, buyPrice, isSellable, sellOf, sellPrice, shopLedger, shopPriced, shopRefusal, stockOf, type ShopRow } from './shop.ts';
import { BUY, SELL } from './shopPrices.ts';
import { ITEMS } from '../components/tent/items.ts';

describe('the price list (scripts/shop-prices.ts)', () => {
  it('sells a catch for NH’s Bells ÷ 100 and prices a piece at NH’s ÷ 20', () => {
    expect(sellPrice('fish:sea-bass')).toBe(4); // 400 Bells
    expect(sellPrice('fish:koi')).toBe(40); // 4,000
    expect(sellPrice('fish:whale-shark')).toBe(130); // 13,000
    expect(sellPrice('bug:tarantula')).toBe(80); // 8,000
    expect(sellPrice('sea:octopus')).toBe(12); // 1,200
    expect(buyPrice('f3672')).toBe(6); // the cardboard box, 120 Bells
    expect(buyPrice('f7047')).toBe(25); // the zen cushion, 500
  });
  it('has every species the island has, and only pieces the rooms can place', () => {
    expect(Object.keys(SELL).length).toBe(194); // 80 fish, 74 bugs, 40 sea creatures
    for (const [k, v] of Object.entries(SELL)) expect(isSellable(k) && Number.isInteger(v) && v >= 1, k).toBe(true);
    for (const [code, v] of Object.entries(BUY)) {
      expect(ITEMS[code], code).toBeDefined();
      expect(ITEMS[code].starter, code).toBeUndefined();
      expect(Number.isInteger(v) && v >= 1 && v <= 5000, code).toBe(true);
    }
    expect(isSellable('shell:cowrie')).toBe(false);
    expect(isSellable('fish:nope')).toBe(false);
    expect(sellPrice('constructor')).toBeUndefined();
    expect(buyPrice('toString')).toBeUndefined();
  });
});

describe('a sell and a buy', () => {
  it('reads their shape, nothing more', () => {
    expect(sellOf({ species: 'fish:koi', n: 2, v: 80 })).toEqual({ species: 'fish:koi', n: 2, v: 80 });
    for (const d of [{}, { species: 'fish:koi', n: 2 }, { species: 'fish:koi', n: 0, v: 0 }, { species: 'fish:koi', n: 1.5, v: 60 }, { species: 'shell:cowrie', n: 1, v: 1 },
      { species: 'fish:koi', n: 1000, v: 40000 }, { species: 'fish:koi', n: 1, v: 40, at: 1 }, { species: 'koi', n: 1, v: 40 }])
      expect(sellOf(d as Record<string, unknown>), JSON.stringify(d)).toBeNull();
    expect(buyOf({ item: 'f3672', price: 6, d: '2026-11-04' })).toEqual({ item: 'f3672', price: 6, d: '2026-11-04' });
    for (const d of [{}, { item: 'w4840', price: 6, d: '2026-11-04' }, { item: 'f3672', price: 0, d: '2026-11-04' }, { item: 'f3672', price: 6, d: '2026-02-30' },
      { item: 'f3672', price: 6 }, { item: 'f3672', price: 6, d: '2026-11-04', x: 1 }])
      expect(buyOf(d as Record<string, unknown>), JSON.stringify(d)).toBeNull();
  });
  it('the record keeps a sell at exactly its price, a buy at exactly its price from a stock of about today', () => {
    const today = '2026-11-04';
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 120 }, today)).toBe(true);
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 121 }, today)).toBe(false);
    expect(shopPriced('sell', { species: 'fish:nope', n: 1, v: 1 }, today)).toBe(false);
    const item = stockOf(today)[0];
    expect(shopPriced('buy', { item, price: buyPrice(item)!, d: today }, today)).toBe(true);
    expect(shopPriced('buy', { item, price: buyPrice(item)! + 1, d: today }, today)).toBe(false);
    // yesterday's stock (a buy queued over midnight) and tomorrow's (a clock ahead), never older or later
    const y = stockOf('2026-11-03')[0], t = stockOf('2026-11-05')[0], old = stockOf('2026-11-02')[0];
    expect(shopPriced('buy', { item: y, price: buyPrice(y)!, d: '2026-11-03' }, today)).toBe(true);
    expect(shopPriced('buy', { item: t, price: buyPrice(t)!, d: '2026-11-05' }, today)).toBe(true);
    expect(shopPriced('buy', { item: old, price: buyPrice(old)!, d: '2026-11-02' }, today)).toBe(false);
    // a piece the day's stock doesn't have
    const not = Object.keys(BUY).find((c) => !stockOf(today).includes(c))!;
    expect(shopPriced('buy', { item: not, price: buyPrice(not)!, d: today }, today)).toBe(false);
  });
});

describe('the day’s stock', () => {
  it('is the date’s alone: the same every time, STOCK_N pieces and the basics, another the next day', () => {
    const a = stockOf('2026-11-04');
    expect(a).toEqual(stockOf('2026-11-04'));
    expect(a).toHaveLength(STOCK_N + BASICS.length);
    expect(new Set(a).size).toBe(a.length);
    expect(a.slice(STOCK_N)).toEqual(BASICS);
    for (const c of a) expect(buyPrice(c), c).toBeDefined();
    expect(stockOf('2026-11-05')).not.toEqual(a);
    // pinned: a change of the draw or the list changes what a day sold (a relay deploy first)
    expect(stockOf('2026-11-04').slice(0, STOCK_N)).toEqual(['f3947', 'f1092', 'f2556', 'f1243', 'f9700', 'f4753', 'f2020', 'f4338']);
  });
  it('turns over: a month of days shows most of the list', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) for (const c of stockOf(`2026-12-${String(d).padStart(2, '0')}`)) seen.add(c);
    expect(seen.size).toBeGreaterThan(150);
  });
});

describe('the ledger', () => {
  const caught = new Map([['fish:koi', 3], ['bug:tarantula', 1]]);
  const sell = (species: string, n: number): ShopRow => ({ type: 'sell', data: { species, n, v: n * sellPrice(species)! } });
  const buy = (item: string, price = buyPrice(item)!): ShopRow => ({ type: 'buy', data: { item, price, d: '2026-11-04' } });
  it('the pocket is the catches less the sells; かいがら the sells less the buys', () => {
    const l = shopLedger(caught, [sell('fish:koi', 2), sell('bug:tarantula', 1), buy('f3672')]);
    expect(l.sold).toEqual(new Map([['fish:koi', 2], ['bug:tarantula', 1]]));
    expect(l.shells).toBe(80 + 80 - 6);
    expect(l.owned).toEqual(['f3672']);
  });
  it('refuses selling past the pocket, buying past かいがら, a piece twice; a refused row counts for nothing', () => {
    const l = shopLedger(caught, [sell('fish:koi', 3)]);
    expect(shopRefusal(l, caught, sell('fish:koi', 1))).toBe('pocket');
    expect(shopRefusal(l, caught, sell('fish:sea-bass', 1))).toBe('pocket');
    expect(shopRefusal(l, caught, buy('f3672', 121))).toBe('wallet');
    expect(shopRefusal(l, caught, buy('f3672', 120))).toBeNull();
    const l2 = shopLedger(caught, [sell('fish:koi', 3), buy('f3672'), buy('f3672'), sell('fish:koi', 1), buy('f7047', 999)]);
    expect(l2.owned).toEqual(['f3672']);
    expect(l2.shells).toBe(120 - 6);
    expect(shopRefusal(l2, caught, buy('f3672'))).toBe('owned');
  });
});
