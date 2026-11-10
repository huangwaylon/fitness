// The shop's rules (contract/shop.ts): the price list's scale, a sell's and a buy's shape and price, the day's stock
// (the same on every phone and the record, from the date alone) and the ledger (the pocket, かいがら, a piece once).
import { describe, expect, it } from 'vitest';
import { dayNum, dayOf } from './tokyo.ts';
import { buyOf, isSellable, sellOf, sellPrice, shopLedger, shopPriced, shopRefusal, type ShopRow } from './shop.ts';
import { STOCK_N, buyPrice, stockOf } from './stock.ts';
import { SELL } from './shopPrices.ts';
import { BUY } from './buyPrices.ts';
import { ITEMS } from '../components/tent/items.ts';
import { FOSSILS, FRAGMENTS, SHELLS } from '../components/island/beach.ts';
import { GOODS } from './pocket.ts';

describe('the price list (scripts/shop-prices.ts)', () => {
  it('sells a catch and prices a piece at NH’s Bells ÷ 20, nothing selling for under 3', () => {
    expect(sellPrice('fish:sea-bass')).toBe(20); // 400 Bells
    expect(sellPrice('fish:koi')).toBe(200); // 4,000
    expect(sellPrice('fish:whale-shark')).toBe(650); // 13,000
    expect(sellPrice('bug:tarantula')).toBe(400); // 8,000
    expect(sellPrice('sea:octopus')).toBe(60); // 1,200
    expect(sellPrice('fish:bitterling')).toBe(45); // 900
    expect(Math.min(...Object.values(SELL))).toBe(3);
    expect(buyPrice('f3672')).toBe(6); // the cardboard box, 120 Bells
    expect(buyPrice('f7047')).toBe(25); // the zen cushion, 500
  });
  it('has every species the island has, and only pieces the rooms can place', () => {
    // 80 fish, 80 bugs, 40 sea creatures; 9 shells (the pearl's), 73 fossils, 14 star fragments; 21 goods
    expect(Object.keys(SELL).length).toBe(200 + 9 + 73 + 14 + Object.keys(GOODS).length);
    for (const [k, v] of Object.entries(SELL)) expect(isSellable(k) && Number.isInteger(v) && v >= 1, k).toBe(true);
    for (const [code, v] of Object.entries(BUY)) {
      expect(ITEMS[code], code).toBeDefined();
      expect(ITEMS[code].starter, code).toBeUndefined();
      expect(Number.isInteger(v) && v >= 1 && v <= 5000, code).toBe(true);
    }
    expect(isSellable('item:froggy-chair')).toBe(false); // a present's furniture: もようがえ's, never the pocket's
    expect(isSellable('recipe:log-stool')).toBe(false);
    expect(isSellable('fish:nope')).toBe(false);
    expect(sellPrice('constructor')).toBeUndefined();
    expect(buyPrice('toString')).toBeUndefined();
  });
});

describe('the pocket’s table (contract/pocket.ts)', () => {
  it('prices everything the island lets us keep: every shell, fossil, star fragment and good, at NH’s ÷ 20', () => {
    const keys = [...SHELLS.map(([id]) => `shell:${id}`), 'shell:pearl', ...FOSSILS.map((id) => `fossil:${id}`), ...FRAGMENTS.map((id) => `fragment:${id}`),
      ...Object.keys(GOODS).map((id) => `goods:${id}`)];
    expect(keys.filter((k) => !isSellable(k) || !sellOf({ species: k, n: 1, v: sellPrice(k)! }))).toEqual([]);
    // NH's sell prices ÷ 20: wood 60 Bells (3, the floor), a branch 5 (3), a coral 500, a T. rex skull 6,000, a pearl 10,000
    expect(['goods:wood', 'goods:softwood', 'goods:hardwood', 'goods:tree-branch', 'shell:coral', 'fossil:t-rex-skull', 'shell:pearl', 'goods:apple', 'fragment:star-fragment']
      .map(sellPrice)).toEqual([3, 3, 3, 3, 25, 300, 500, 5, 13]);
  });
});

describe('a sell and a buy', () => {
  it('reads their shape, nothing more', () => {
    expect(sellOf({ species: 'fish:koi', n: 2, v: 80 })).toEqual({ species: 'fish:koi', n: 2, v: 80 });
    for (const d of [{}, { species: 'fish:koi', n: 2 }, { species: 'fish:koi', n: 0, v: 0 }, { species: 'fish:koi', n: 1.5, v: 60 }, { species: 'item:froggy-chair', n: 1, v: 1 },
      { species: 'fish:koi', n: 1000, v: 40000 }, { species: 'fish:koi', n: 1, v: 40, at: 1 }, { species: 'koi', n: 1, v: 40 }])
      expect(sellOf(d as Record<string, unknown>), JSON.stringify(d)).toBeNull();
    expect(buyOf({ item: 'f3672', price: 6, d: '2026-11-04' })).toEqual({ item: 'f3672', price: 6, d: '2026-11-04' });
    for (const d of [{}, { item: 'w4840', price: 6, d: '2026-11-04' }, { item: 'f3672', price: 0, d: '2026-11-04' }, { item: 'f3672', price: 6, d: '2026-02-30' },
      { item: 'f3672', price: 6 }, { item: 'f3672', price: 6, d: '2026-11-04', x: 1 }])
      expect(buyOf(d as Record<string, unknown>), JSON.stringify(d)).toBeNull();
  });
  it('the record keeps a sell at most at its price, a buy at exactly its price from a stock of about today', () => {
    const today = '2026-11-04';
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 600 }, today)).toBe(true);
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 601 }, today)).toBe(false);
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 120 }, today)).toBe(true); // an older app's list (÷ 100)
    expect(shopPriced('sell', { species: 'fish:nope', n: 1, v: 1 }, today)).toBe(false);
    const item = stockOf(today)[0];
    expect(shopPriced('buy', { item, price: buyPrice(item)!, d: today }, today)).toBe(true);
    expect(shopPriced('buy', { item, price: buyPrice(item)! + 1, d: today }, today)).toBe(false);
    // yesterday's stock (a buy queued over midnight) and tomorrow's (a clock ahead), never older or later
    for (const [d, ok] of [['2026-11-03', true], ['2026-11-05', true], ['2026-11-02', false], ['2026-11-06', false]] as const)
      expect(shopPriced('buy', { item, price: buyPrice(item)!, d }, today), d).toBe(ok);
    // the stock hangs on the island's finds, so any priced piece passes (an app from before 2026-11-09 drew its own)
    const not = Object.keys(BUY).find((c) => !stockOf(today).includes(c))!;
    expect(shopPriced('buy', { item: not, price: buyPrice(not)!, d: today }, today)).toBe(true);
    expect(shopPriced('buy', { item: 'f1', price: 1, d: today }, today)).toBe(false); // never sold
  });
});

describe('the buy prices (scripts/shop-prices.ts)', () => {
  it('NH’s buy ÷ 20; a piece NH never sells, 4 × its NH sell ÷ 20 (at least 3); never the starter set, a rug or a critter’s tank', () => {
    expect(buyPrice('f79')).toBe(165); // NH sells it: 3,300 Bells
    // made up: the aluminoid gyroid (NH sell 828: 3,312 ÷ 20), the koi model (Flick's: 12,000), the chandelier (Nook's
    // Cranny's 30,000 ÷ 20, for comparison)
    expect(buyPrice('f14074')).toBe(166);
    expect(buyPrice('f6991')).toBe(2400);
    expect(buyPrice('f13154')).toBe(1500);
    for (const c of ['f4081', 'f12214', 'f2220']) expect(buyPrice(c), c).toBeUndefined();
    // everything the shop sells costs 3 to 5,000 かいがら (the 100,000-Bell cap: dearer pieces never come in)
    const all = Object.values(BUY);
    expect(all.length).toBeGreaterThan(1800);
    expect(Math.min(...all)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...all)).toBeLessThanOrEqual(5000);
  });
});

describe('the day’s stock', () => {
  it('is the date’s and the found set’s alone: the same every time, STOCK_N pieces, another the next day', () => {
    const a = stockOf('2026-11-04');
    expect(a).toEqual(stockOf('2026-11-04', new Set()));
    expect(a).toHaveLength(STOCK_N);
    expect(STOCK_N).toBe(24);
    expect(new Set(a).size).toBe(a.length);
    for (const c of a) expect(buyPrice(c), c).toBeDefined();
    expect(stockOf('2026-11-05')).not.toEqual(a);
    // pinned: a change of the draw or the list changes what a day sold
    expect(a.slice(0, 4)).toEqual(['f12419', 'f3972', 'f13969', 'f287']);
  });
  it('never holds a piece the island has: the next of the day’s order stands in', () => {
    const a = stockOf('2026-11-04');
    const found = new Set(a.slice(0, 5));
    const b = stockOf('2026-11-04', found);
    expect(b).toHaveLength(STOCK_N);
    for (const c of b) expect(found.has(c)).toBe(false);
    expect(b.slice(0, STOCK_N - 5)).toEqual(a.slice(5)); // the rest keep their order
  });
  it('the old いつもの are in the rotation, not always there', () => {
    const basics = ['f3672', 'f7047', 'f4123'];
    for (const c of basics) expect(buyPrice(c), c).toBeDefined();
    const year = Array.from({ length: 365 }, (_, i) => stockOf(dayOf(dayNum('2027-01-01') + i)));
    expect(year.some((day) => !basics.every((c) => day.includes(c)))).toBe(true);
    const seen = new Set(year.flat());
    for (const c of basics) expect(seen.has(c), c).toBe(true);
  });
  it('runs short when the island has nearly all, and sells out when it has all', () => {
    const all = Object.keys(BUY);
    const order = stockOf('2026-11-04', new Set(all.slice(10)));
    expect(order.length).toBe(10);
    expect(stockOf('2026-11-04', new Set(all))).toEqual([]);
  });
  it('turns over: a month of days shows most of the list', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) for (const c of stockOf(`2026-12-${String(d).padStart(2, '0')}`)) seen.add(c);
    expect(seen.size).toBeGreaterThan(450);
  });
});

describe('the ledger', () => {
  const caught = new Map([['fish:koi', 3], ['bug:tarantula', 1]]);
  const sell = (species: string, n: number): ShopRow => ({ type: 'sell', data: { species, n, v: n * sellPrice(species)! } });
  const buy = (item: string, price = buyPrice(item)!): ShopRow => ({ type: 'buy', data: { item, price, d: '2026-11-04' } });
  /** Three koi's かいがら. */
  const KOI3 = 3 * sellPrice('fish:koi')!;
  it('the pocket is the catches less the sells; かいがら the sells less the buys', () => {
    const l = shopLedger(caught, [sell('fish:koi', 2), sell('bug:tarantula', 1), buy('f3672')]);
    expect(l.sold).toEqual(new Map([['fish:koi', 2], ['bug:tarantula', 1]]));
    expect(l.shells).toBe(2 * sellPrice('fish:koi')! + sellPrice('bug:tarantula')! - 6);
    expect(l.owned).toEqual(['f3672']);
  });
  const queued = (r: ShopRow): ShopRow => ({ ...r, queued: true });
  it('refuses selling past the pocket, buying past かいがら, a piece twice; a refused queued row counts for nothing', () => {
    const l = shopLedger(caught, [sell('fish:koi', 3)]);
    expect(shopRefusal(l, caught, sell('fish:koi', 1))).toBe('pocket');
    expect(shopRefusal(l, caught, sell('fish:sea-bass', 1))).toBe('pocket');
    expect(shopRefusal(l, caught, buy('f3672', KOI3 + 1))).toBe('wallet');
    expect(shopRefusal(l, caught, buy('f3672', KOI3))).toBeNull();
    const l2 = shopLedger(caught, [sell('fish:koi', 3), buy('f3672'), queued(buy('f3672')), queued(sell('fish:koi', 1)), queued(buy('f7047', 999))]);
    expect(l2.owned).toEqual(['f3672']);
    expect(l2.shells).toBe(KOI3 - 6);
    expect(shopRefusal(l2, caught, buy('f3672'))).toBe('owned');
  });
  it('a kept row counts whatever the tallies say now: a lower tally never takes back a sale or a piece', () => {
    // sold 3 koi, bought a piece with them; then the koi read as 1 (a stale tally)
    const rows = [sell('fish:koi', 3), buy('f3672')];
    const l = shopLedger(new Map([['fish:koi', 1]]), rows);
    expect(l).toEqual(shopLedger(caught, rows));
    expect(l.owned).toEqual(['f3672']);
    expect(l.shells).toBe(KOI3 - 6);
    expect(shopLedger(caught, [buy('f3672'), buy('f3672')]).owned).toEqual(['f3672']); // still a piece once
  });
  it('a sold catch given back costs what it fetched; a stale low tally still owes nothing; a later catch pays it', () => {
    // 2026-11-05 relay review R1: sold, then given back (a claim race lost): the pocket at −n, the かいがら spendable
    const K = sellPrice('fish:koi')!;
    const rows = [sell('fish:koi', 3), buy('f3672')];
    // 3 caught, 2 given back (caught is already less them): 2 of the 3 sold weren't hers
    const l = shopLedger(new Map([['fish:koi', 1]]), rows, new Map([['fish:koi', 2]]));
    expect(l.owed).toEqual(new Map([['fish:koi', 2 * K]]));
    expect(l.shells).toBe(K - 6);
    expect(shopRefusal(l, new Map([['fish:koi', 1]]), buy('f7047', K - 5))).toBe('wallet');
    expect(shopRefusal(l, new Map([['fish:koi', 1]]), sell('fish:koi', 1))).toBe('pocket');
    // more given back than sold beyond the pocket: only the sold ones owe
    expect(shopLedger(new Map([['fish:koi', 0]]), [sell('fish:koi', 1)], new Map([['fish:koi', 3]])).shells).toBe(0);
    // two more caught since: the sale covered again, nothing owed
    expect(shopLedger(new Map([['fish:koi', 3]]), rows, new Map([['fish:koi', 2]])).shells).toBe(KOI3 - 6);
    // at what they fetched (an older app's lower price), not today's list
    expect(shopLedger(new Map([['fish:koi', 0]]), [{ type: 'sell', data: { species: 'fish:koi', n: 2, v: 2 * K - 2 } }], new Map([['fish:koi', 2]])).shells).toBe(0);
  });
});
