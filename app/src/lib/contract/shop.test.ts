// The shop's rules (contract/shop.ts): the price list's scale, a sell's and a buy's shape and price, the day's stock
// (the same on every phone and the record, from the date alone) and the ledger (the pocket, かいがら, a piece once).
import { describe, expect, it } from 'vitest';
import { addDays, dayNum, dateOfDayNum } from './tokyo.ts';
import { buyOf, isLedgerEvent, isSellable, isShopEvent, rewardOf, rowConcerns, sellOf, sellPrice, shopLedger, shopRefusal, shopRowOf, shopStep, SG_REWARD_MAX, type ShopRow, type ShopRowAt } from './shop.ts';
import { shopPriced } from './shopCheck.ts';
import { STOCK_N, UNITS_FROM, buyPrice, stockOf } from './stock.ts';
import { SELL } from './shopPrices.ts';
import { BUY } from './buyPrices.ts';
import { ITEMS } from '../components/tent/items.ts';
import { FOSSILS, FRAGMENTS, SHELLS } from '#lib/world/beach.ts';
import { GOODS } from './pocket.ts';

describe('the price list (scripts/shop-prices.ts)', () => {
  it('sells a catch and prices a piece at NH’s Bells ÷ 20 (a catch or beach find × 10), nothing selling for under 3', () => {
    expect(sellPrice('fish:sea-bass')).toBe(200); // 400 Bells, × 10
    expect(sellPrice('fish:koi')).toBe(2000); // 4,000
    expect(sellPrice('fish:whale-shark')).toBe(6500); // 13,000
    expect(sellPrice('bug:tarantula')).toBe(4000); // 8,000, × 10
    expect(sellPrice('sea:octopus')).toBe(600); // 1,200, × 10
    expect(sellPrice('fish:bitterling')).toBe(450); // 900
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
      expect(Number.isInteger(v) && v >= 1 && v <= 10_000, code).toBe(true);
    }
    expect(isSellable('item:froggy-chair')).toBe(false); // a present's furniture: もようがえ's, never the pocket's
    expect(isSellable('recipe:log-stool')).toBe(false);
    expect(isSellable('fish:nope')).toBe(false);
    expect(sellPrice('constructor')).toBeUndefined();
    expect(buyPrice('toString')).toBeUndefined();
  });
});

describe('the pocket’s table (contract/pocket.ts)', () => {
  it('prices everything the island lets us keep: every shell, fossil, star fragment and good, at NH’s ÷ 20 (× 10 but the goods)', () => {
    const keys = [...SHELLS.map(([id]) => `shell:${id}`), 'shell:pearl', ...FOSSILS.map((id) => `fossil:${id}`), ...FRAGMENTS.map((id) => `fragment:${id}`),
      ...Object.keys(GOODS).map((id) => `goods:${id}`)];
    expect(keys.filter((k) => !isSellable(k) || !sellOf({ species: k, n: 1, v: sellPrice(k)! }))).toEqual([]);
    // NH's sell prices ÷ 20: wood 60 Bells (3, the floor), a branch 5 (3), a coconut 250; × 10: a coral 500, a T. rex skull 6,000, a pearl 10,000, a star fragment 250
    expect(['goods:wood', 'goods:softwood', 'goods:hardwood', 'goods:tree-branch', 'shell:coral', 'fossil:t-rex-skull', 'shell:pearl', 'goods:coconut', 'fragment:star-fragment']
      .map(sellPrice)).toEqual([3, 3, 3, 3, 250, 3000, 5000, 13, 130]);
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
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 6000 }, today)).toBe(true);
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 6001 }, today)).toBe(false);
    expect(shopPriced('sell', { species: 'fish:koi', n: 3, v: 600 }, today)).toBe(true); // an older app's list (before the fish × 10)
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
    // starts at exactly n × FARM.startBuy
    expect(shopPriced('buy_starts', { crop: 'tomato', n: 3, v: 42 }, today)).toBe(true);
    expect(shopPriced('buy_starts', { crop: 'tomato', n: 3, v: 41 }, today)).toBe(false);
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
    // everything the shop sells costs 1 to 10,000 かいがら: a dearer piece costs the cap (2026-11-10: every piece
    // buyable; the grand piano and the golden toilet were out under the old 100,000-Bell cap)
    expect(buyPrice('f1875')).toBe(10_000);
    expect(buyPrice('f3472')).toBe(10_000);
    const all = Object.values(BUY);
    expect(all.length).toBeGreaterThan(1900);
    expect(Math.min(...all)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...all)).toBe(10_000);
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
    expect(a.slice(0, 4)).toEqual(['f12830', 'f1326', 'f13476', 'f14831']);
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
    const year = Array.from({ length: 365 }, (_, i) => stockOf(dateOfDayNum(dayNum('2027-01-01') + i)));
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
  it('from UNITS_FROM goes by units: a unit’s pieces together, the days before as they were', () => {
    const unit = (c: string) => (Number(c.slice(1)) % 3 ? `u${Number(c.slice(1)) % 97}` : undefined); // (a third alone)
    const before = addDays(UNITS_FROM, -1);
    expect(stockOf(before, new Set(), unit)).toEqual(stockOf(before));
    const day = stockOf(UNITS_FROM, new Set(), unit);
    expect(day).toHaveLength(STOCK_N);
    expect(new Set(day).size).toBe(STOCK_N);
    expect(day).not.toEqual(stockOf(UNITS_FROM));
    // each unit's run unbroken, and fewer runs than pieces
    const runs: string[] = [];
    for (const c of day) if (runs.at(-1) !== (unit(c) ?? c)) runs.push(unit(c) ?? c);
    expect(new Set(runs).size).toBe(runs.length);
    expect(runs.length).toBeLessThan(STOCK_N);
    // a found piece's unit mates still come; the day's other pieces keep their order
    const found = new Set([day[0]]);
    expect(stockOf(UNITS_FROM, found, unit).slice(0, STOCK_N - 1)).toEqual(day.slice(1));
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
    const l2 = shopLedger(caught, [sell('fish:koi', 3), buy('f3672'), queued(buy('f3672')), queued(sell('fish:koi', 1)), queued(buy('f7047', KOI3))]);
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

describe('英語すごろく’s reward (sg_reward)', () => {
  const R = { g: 'sg-20261118-abc', v: 12, to: ['A', 'G'], d: '2026-11-18' };
  const reward = (o: Partial<typeof R> = {}, queued = false): ShopRow => ({ type: 'reward', data: rewardOf({ ...R, ...o })!, ...(queued ? { queued: true as const } : {}) });
  const none = new Map<string, number>();

  it('its shape: a game id, 1–1000 per recipient, a unique non-empty set of A/B/G, a date; nothing more', () => {
    expect(rewardOf(R)).toEqual(R);
    expect(shopRowOf('sg_reward', R)).toEqual({ type: 'reward', data: R });
    expect(rewardOf({ ...R, g: 'abc:1.2-3' })).not.toBeNull();
    expect(rewardOf({ ...R, to: ['A', 'B', 'G'], v: SG_REWARD_MAX })).not.toBeNull();
    for (const bad of [
      { g: 'abc' }, { g: 'a'.repeat(41) }, { g: 'SG-UPPER-1' }, { g: 'sg game 1' }, { g: 7 },
      { v: 0 }, { v: 1001 }, { v: 1.5 }, { v: '5' },
      { to: [] }, { to: ['A', 'A'] }, { to: ['C'] }, { to: 'A' }, { to: ['A', 'B', 'G', 'A'] },
      { d: '2026-02-30' }, { d: 20261118 }
    ]) expect(rewardOf({ ...R, ...bad }), JSON.stringify(bad)).toBeNull();
    expect(rewardOf({ ...R, extra: 1 })).toBeNull();
    const { d: _d, ...noDay } = R;
    expect(rewardOf(noDay)).toBeNull();
    // apart from the shop's own events (their price check, the sender's ledger), one of the ledger's
    expect(isShopEvent('sg_reward')).toBe(false);
    expect(isLedgerEvent('sg_reward') && isLedgerEvent('sell')).toBe(true);
  });

  it('adds to かいがら like a sale; a game pays a ledger once (kept or queued)', () => {
    const l = shopLedger(none, [reward(), reward({ v: 20 }), reward({ g: 'sg-other-game', v: 5 })]);
    expect(l.shells).toBe(12 + 5);
    expect(l.games).toEqual(new Set(['sg-20261118-abc', 'sg-other-game']));
    expect(shopRefusal(l, none, reward())).toBe('paid');
    expect(shopRefusal(l, none, reward({ g: 'sg-third-game' }))).toBeNull();
    expect(shopLedger(none, [reward({}, true), reward({}, true)]).shells).toBe(12);
    // the same rows kept or queued fold alike: the phone shows what the record will keep
    expect(shopLedger(none, [reward(), reward({ g: 'sg-other-game' }, true)])).toEqual(shopLedger(none, [reward(), reward({ g: 'sg-other-game' })]));
  });

  it('no daily cap: any number of games a day each pay in full', () => {
    const rows = Array.from({ length: 10 }, (_, i) => reward({ g: `sg-game-${i}`, v: 600 }));
    expect(shopLedger(none, rows).shells).toBe(6000);
  });

  it('spends like a sale: a buy covered by rewards is kept, never past them', () => {
    const buy = (price: number): ShopRow => ({ type: 'buy', data: { item: 'f3672', price, d: '2026-11-18' } });
    const l = shopLedger(none, [reward({ v: 6 })]);
    expect(shopRefusal(l, none, buy(6))).toBeNull();
    expect(shopRefusal(l, none, buy(7))).toBe('wallet');
    shopStep(l, none, none, buy(6));
    expect(l.shells).toBe(0);
  });

  it('fans out: a row of each recipient’s ledger, whoever sent it; never a non-recipient sender’s', () => {
    const row: ShopRowAt = { ...reward(), at: 1, person: 'B' };
    expect(rowConcerns(row, 'A')).toBe(true);
    expect(rowConcerns(row, 'G')).toBe(true);
    expect(rowConcerns(row, 'B')).toBe(false); // sent it, not named
    const sale: ShopRowAt = { type: 'sell', data: { species: 'fish:koi', n: 1, v: 1 }, at: 2, person: 'B' };
    expect(rowConcerns(sale, 'B')).toBe(true);
    expect(rowConcerns(sale, 'A')).toBe(false);
  });
});
