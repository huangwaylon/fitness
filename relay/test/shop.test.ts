// The shop in the record (docs/backend.md#events `sell` / `buy`, contract/shop.ts): a sell only of what the sender's
// pocket holds (their tallies' catches less their sells), at most its price (an older app's lower list); a buy only of a priced piece, its
// stock's day about today, at exactly its price, covered by their かいがら, once; each person's own (the guest's too); an id once.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { sellPrice } from '../../app/src/lib/contract/shop.ts';
import { buyPrice, stockOf } from '../../app/src/lib/contract/stock.ts';
import { BUY } from '../../app/src/lib/contract/buyPrices.ts';
import { TALLY_PAST_DAYS } from '../../app/src/lib/contract/record.ts';
import { memSql, noWallets } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
// 2026-11-04 12:00 Tokyo
const T0 = Date.parse('2026-11-04T03:00:00.000Z');
const D = '2026-11-04';
/** A koi's and a whale shark's price (contract/shopPrices.ts). */
const K = sellPrice('fish:koi')!, W = sellPrice('fish:whale-shark')!;

describe('the shop in the record', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => {} });
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: 'A' | 'B' | 'G', type: string, data: object, id = `e${++n}`) =>
    noWallets(store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100));
  const tally = (who: 'A' | 'B' | 'G', counts: Record<string, number>, date = D) => send(who, 'tally', { date, counts });
  const sell = (who: 'A' | 'B' | 'G', species: string, k: number, v: number, id?: string) => send(who, 'sell', { species, n: k, v }, id);
  const item = stockOf(D)[0];
  const buy = (who: 'A' | 'B' | 'G', it = item, price = buyPrice(it)!, d = D) => send(who, 'buy', { item: it, price, d });
  const refused = (detail?: string) => ({ ok: false, error: 'bad_request', ...(detail ? { detail } : {}) });

  it(`a tally or a give-back dated over ${TALLY_PAST_DAYS} days before the record's day is refused (no pocket stock minted for old days)`, () => {
    expect(tally('A', { 'fish:koi': 9 }, '2026-09-29')).toEqual(refused()); // 36 days back
    expect(send('G', 'tally', { date: '2026-09-29', counts: { 'fish:koi': 9 } })).toEqual(refused());
    expect(tally('A', { 'fish:koi': 9 }, '2026-09-30')).toMatchObject({ ok: true }); // 35: a phone offline for weeks
    expect(send('A', 'tally_back', { date: '2026-09-29', counts: { 'fish:koi': 1 } })).toEqual(refused());
  });

  it('a retry of a buy already kept is a duplicate even once its stock day has passed (not refused)', () => {
    tally('A', { 'fish:koi': Math.ceil(buyPrice(item)! / K) });
    sell('A', 'fish:koi', Math.ceil(buyPrice(item)! / K), Math.ceil(buyPrice(item)! / K) * K);
    expect(send('A', 'buy', { item, price: buyPrice(item)!, d: D }, 'buy-late')).toEqual({ ok: true });
    now += 3 * 86_400_000; // the ack lost; the phone retries three days on
    expect(send('A', 'buy', { item, price: buyPrice(item)!, d: D }, 'buy-late')).toEqual({ ok: true, duplicate: true });
  });

  it('sells what the pocket holds, at its price, and no more', () => {
    expect(tally('A', { 'fish:koi': 2 })).toMatchObject({ ok: true });
    expect(tally('A', { 'fish:koi': 3 })).toMatchObject({ ok: true }); // the day's tally grows (one row)
    expect(tally('A', { 'fish:koi': 1 }, '2026-11-03')).toMatchObject({ ok: true });
    expect(sell('A', 'fish:koi', 3, 3 * K)).toEqual({ ok: true });
    expect(sell('A', 'fish:koi', 2, 2 * K)).toEqual(refused('pocket short')); // 4 caught, 3 sold
    expect(sell('A', 'fish:koi', 1, K)).toEqual({ ok: true });
    expect(sell('A', 'fish:koi', 1, K)).toEqual(refused('pocket short'));
    expect(sell('A', 'bug:tarantula', 1, sellPrice('bug:tarantula')!)).toEqual(refused('pocket short')); // never caught
  });

  it('a catch given back after it was sold costs its かいがら: no wallet from a fish never kept, and a later catch pays it', () => {
    // 2026-11-05 relay review R1: the give-back left the pocket at −n and the sale's かいがら spendable
    const back = (counts: Record<string, number>) => send('A', 'tally_back', { date: D, counts });
    const price = buyPrice(item)!, k = Math.ceil(price / K);
    tally('A', { 'fish:koi': k });
    expect(sell('A', 'fish:koi', k, k * K)).toEqual({ ok: true });
    expect(back({ 'fish:koi': k })).toEqual({ ok: true }); // kept: the race was lost
    expect(buy('A')).toEqual(refused('wallet short')); // the sold koi weren't hers: their かいがら are owed
    expect(sell('A', 'fish:koi', 1, K)).toEqual(refused('pocket short'));
    // k more koi caught that day: the debt paid (her かいがら back), the pocket still empty
    tally('A', { 'fish:koi': 2 * k });
    expect(sell('A', 'fish:koi', 1, K)).toEqual(refused('pocket short'));
    expect(buy('A')).toEqual({ ok: true });
  });

  it('a catch given back (a claim race lost after its tally came in) leaves the pocket, only what that day’s tally holds', () => {
    const back = (who: 'A' | 'B' | 'G', counts: Record<string, number>, date = D, id?: string) => send(who, 'tally_back', { date, counts }, id);
    tally('A', { 'fish:koi': 2, 'bug:ant': 1 });
    expect(back('A', { 'fish:koi': 1 }, D, 'g1')).toEqual({ ok: true });
    expect(back('A', { 'fish:koi': 1 }, D, 'g1')).toEqual({ ok: true, duplicate: true }); // its id once
    expect(sell('A', 'fish:koi', 2, 2 * K)).toEqual(refused('pocket short')); // 2 caught, 1 given back
    expect(sell('A', 'fish:koi', 1, K)).toEqual({ ok: true });
    // more than the day's tally holds, of a key it hasn't, of a day it hasn't: refused
    expect(back('A', { 'fish:koi': 3 })).toEqual(refused('tally short'));
    expect(back('A', { 'bug:moth': 1 })).toEqual(refused('tally short'));
    expect(back('A', { 'fish:koi': 1 }, '2026-11-03')).toEqual(refused('tally short'));
    // a lower one later (a stale send) takes nothing back: the day's row keeps the larger counts
    expect(back('A', { 'bug:ant': 1 })).toEqual({ ok: true });
    expect(back('A', { 'fish:koi': 2, 'bug:ant': 1 })).toEqual({ ok: true });
    expect(sell('A', 'fish:koi', 1, K)).toEqual(refused('pocket short'));
    // the guest gives back its own; a member's never touches another's pocket
    tally('G', { 'fish:koi': 1 });
    expect(back('G', { 'fish:koi': 1 })).toEqual({ ok: true });
    tally('B', { 'fish:koi': 1 });
    expect(sell('B', 'fish:koi', 1, K)).toEqual({ ok: true });
  });

  it('refuses a price over the list, a kind that doesn’t sell (a present’s piece); keeps one under it (an older app’s list)', () => {
    tally('A', { 'fish:koi': 5, 'shell:cowrie': 3, 'item:froggy-chair': 1 });
    expect(sell('A', 'fish:koi', 1, K + 1)).toEqual(refused());
    expect(sell('A', 'fish:koi', 1, 40)).toEqual({ ok: true }); // the list before 2026-11-04's rise: a koi 40
    expect(sell('A', 'item:froggy-chair', 1, 1)).toEqual(refused());
    expect(sell('A', 'fish:nope', 1, 1)).toEqual(refused());
    expect(sell('A', 'fish:koi', 0, 0)).toEqual(refused());
  });

  it('a piece past the old 100,000-Bell cap is bought at the 10,000 cap (2026-11-10): exactly 10,000, never above', () => {
    // the grand piano (NH 1,000,000 Bells) and the golden toilet: out of the shop until 2026-11-10, now 10,000 each
    const piano = 'f1875';
    expect(buyPrice(piano)).toBe(10_000);
    expect(buyPrice('f3472')).toBe(10_000);
    expect(Math.max(...Object.values(BUY))).toBe(10_000);
    const k = Math.ceil(10_000 / W);
    tally('A', { 'fish:whale-shark': k });
    expect(sell('A', 'fish:whale-shark', k, k * W)).toEqual({ ok: true });
    expect(buy('A', piano, 10_001)).toEqual(refused());
    expect(buy('A', piano, 9_999)).toEqual(refused());
    expect(buy('A', piano, 10_000)).toEqual({ ok: true });
    expect(buy('A', piano, 10_000)).toEqual(refused('owned'));
  });

  it('keeps a tally of the goods and sells them, the beach’s finds too, from the pocket (contract/pocket.ts)', () => {
    const wood = sellPrice('goods:wood')!, coral = sellPrice('shell:coral')!, rex = sellPrice('fossil:t-rex-skull')!;
    expect(tally('A', { 'goods:wood': 3, 'goods:tree-branch': 1, 'shell:coral': 2, 'fossil:t-rex-skull': 1 })).toMatchObject({ ok: true });
    expect(tally('A', { 'goods:Wood': 1 })).toEqual(refused()); // not an id
    expect(sell('A', 'goods:wood', 3, 3 * wood)).toEqual({ ok: true });
    expect(sell('A', 'goods:wood', 1, wood)).toEqual(refused('pocket short'));
    expect(sell('A', 'shell:coral', 2, 2 * coral)).toEqual({ ok: true });
    expect(sell('A', 'fossil:t-rex-skull', 1, rex)).toEqual({ ok: true });
    expect(sell('G', 'goods:tree-branch', 1, sellPrice('goods:tree-branch')!)).toEqual(refused('pocket short')); // A's, not the guest's
    // a lower tally of the day after (a second phone's) gives back no wood
    expect(tally('A', { 'goods:wood': 1 })).toMatchObject({ ok: true });
    expect(sell('A', 'goods:wood', 1, wood)).toEqual(refused('pocket short'));
  });

  it('sells the goal trees’ fruit at its own price (contract/pocket.ts GOAL_GOODS): 60 a goal’s, 150 the gold one', () => {
    expect([sellPrice('goods:goal-apple'), sellPrice('goods:gold-fruit')]).toEqual([60, 150]);
    expect(tally('A', { 'goods:goal-apple': 1, 'goods:goal-pear': 1, 'goods:gold-fruit': 1 })).toMatchObject({ ok: true });
    expect(sell('A', 'goods:goal-apple', 1, 61)).toEqual(refused()); // above its price
    expect(sell('A', 'goods:goal-apple', 1, 60)).toEqual({ ok: true });
    expect(sell('A', 'goods:gold-fruit', 1, 150)).toEqual({ ok: true });
    expect(sell('A', 'goods:goal-pear', 1, 60)).toEqual({ ok: true });
  });

  it('the plain fruit picked up before 2026-11-16 is its goal’s (pocketKey): one pocket, 60; an old build’s sale of it at 5 or 60 kept', () => {
    expect(['goods:apple', 'goods:pear', 'goods:peach', 'goods:cherry'].map(sellPrice)).toEqual([60, 60, 60, 60]);
    expect(tally('A', { 'goods:apple': 3, 'goods:goal-apple': 1 })).toMatchObject({ ok: true });
    expect(sell('A', 'goods:apple', 1, 5)).toEqual({ ok: true }); // an old build's list
    expect(sell('A', 'goods:apple', 1, 60)).toEqual({ ok: true });
    expect(sell('A', 'goods:apple', 1, 61)).toEqual(refused());
    expect(sell('A', 'goods:goal-apple', 2, 120)).toEqual({ ok: true }); // the old one and the new one, one pocket
    expect(sell('A', 'goods:apple', 1, 60)).toEqual(refused('pocket short'));
    expect(sell('A', 'goods:goal-apple', 1, 60)).toEqual(refused('pocket short'));
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
  });

  it('an id once: a retry is a duplicate, never sold twice', () => {
    tally('A', { 'fish:koi': 1 });
    expect(sell('A', 'fish:koi', 1, K, 'sell-1')).toEqual({ ok: true });
    expect(sell('A', 'fish:koi', 1, K, 'sell-1')).toEqual({ ok: true, duplicate: true });
    expect(buy('A', 'f3672', 6)).toEqual({ ok: true });
    const rows = (store.handle({ key: KEY_A, action: 'snapshot' }, 10) as unknown as { rows: { events: string[][] } }).rows.events;
    expect(rows.filter((r) => r[3] === 'sell')).toHaveLength(1);
    expect(rows.filter((r) => r[3] === 'buy')).toHaveLength(1);
  });

  it('buys only what かいがら cover, a piece once, from a stock of about today at its price', () => {
    const price = buyPrice(item)!;
    expect(buy('A')).toEqual(refused('wallet short'));
    tally('A', { 'fish:whale-shark': 40 });
    expect(sell('A', 'fish:whale-shark', 40, 40 * W)).toEqual({ ok: true });
    expect(buy('A', item, price + 1)).toEqual(refused());
    expect(buy('A', 'f1', 1)).toEqual(refused()); // never sold
    expect(buy('A', stockOf('2026-11-01')[0], buyPrice(stockOf('2026-11-01')[0])!, '2026-11-01')).toEqual(refused()); // an old day's
    expect(buy('A')).toEqual({ ok: true });
    expect(buy('A')).toEqual(refused('owned'));
    // yesterday's stock still sells (a buy queued over midnight)
    const y = stockOf('2026-11-03').find((c) => c !== item)!;
    expect(buy('A', y, buyPrice(y)!, '2026-11-03')).toEqual({ ok: true });
    // かいがら fall: spend down to the last one
    const left = 40 * W - price - buyPrice(y)!;
    const dear = stockOf(D).filter((c) => c !== item && c !== y).sort((a, b) => buyPrice(b)! - buyPrice(a)!);
    let shells = left;
    for (const c of dear) {
      const r = buy('A', c);
      if (buyPrice(c)! <= shells) {
        expect(r, c).toEqual({ ok: true });
        shells -= buyPrice(c)!;
      } else expect(r, c).toEqual(refused('wallet short'));
    }
  });

  it('a lower tally after a sale (a second phone’s, a queue that waited) takes nothing back: the piece stays bought', () => {
    tally('A', { 'fish:whale-shark': 10, 'bug:moth': 2 });
    expect(sell('A', 'fish:whale-shark', 10, 10 * W)).toEqual({ ok: true });
    expect(buy('A')).toEqual({ ok: true });
    // the other phone's older tally of the day lands after: fewer sharks, a fish this one hadn't sent
    expect(tally('A', { 'fish:whale-shark': 3, 'fish:koi': 1 })).toMatchObject({ ok: true });
    const snap = () => (store.handle({ key: KEY_A, action: 'snapshot' }, 10) as unknown as { rows: { events: string[][] } }).rows.events;
    const tallies = snap().filter((r) => r[3] === 'tally');
    expect(tallies).toHaveLength(1); // still one row of the day: each entry's larger count
    expect(JSON.parse(tallies[0][4])).toEqual({ date: D, counts: { 'fish:whale-shark': 10, 'bug:moth': 2, 'fish:koi': 1 } });
    expect(buy('A')).toEqual(refused('owned')); // still A's
    expect(sell('A', 'fish:whale-shark', 1, W)).toEqual(refused('pocket short')); // all ten sold, none come back
    expect(sell('A', 'fish:koi', 1, K)).toEqual({ ok: true });
    // the wallet: the sale's かいがら less the piece, and the koi's
    const left = 10 * W - buyPrice(item)! + K;
    const dear = Object.keys(BUY).find((c) => stockOf(D).includes(c) && c !== item && buyPrice(c)! > left);
    if (dear) expect(buy('A', dear)).toEqual(refused('wallet short'));
    const cheap = stockOf(D).find((c) => c !== item && buyPrice(c)! <= left)!;
    expect(buy('A', cheap)).toEqual({ ok: true });
  });

  it('an import keeps a tally’s larger counts too', () => {
    store.import({ events: [['2026-11-04T01:00:00.000Z', 'A', 'i1', 'tally', JSON.stringify({ date: D, counts: { 'fish:koi': 5 } })]] });
    store.import({ events: [['2026-11-04T01:05:00.000Z', 'A', 'i2', 'tally', JSON.stringify({ date: D, counts: { 'fish:koi': 2, 'bug:moth': 1 } })]] });
    const rows = (store.handle({ key: KEY_A, action: 'snapshot' }, 10) as unknown as { rows: { events: string[][] } }).rows.events;
    expect(rows.filter((r) => r[3] === 'tally').map((r) => JSON.parse(r[4]).counts)).toEqual([{ 'fish:koi': 5, 'bug:moth': 1 }]);
  });

  it('each person’s own: the guest sells its catches and buys with its own かいがら', () => {
    tally('G', { 'fish:koi': 1 });
    tally('A', { 'fish:koi': 10 });
    expect(sell('B', 'fish:koi', 1, K)).toEqual(refused('pocket short')); // A's catches aren't B's
    expect(sell('G', 'fish:koi', 2, 2 * K)).toEqual(refused('pocket short'));
    expect(sell('G', 'fish:koi', 1, K)).toEqual({ ok: true });
    expect(buy('G', 'f3672', 6)).toEqual({ ok: true }); // the cardboard box
    expect(buy('B', 'f3672', 6)).toEqual(refused('wallet short'));
    expect(buy('A', 'f3672', 6)).toEqual(refused('wallet short')); // caught, not sold yet
  });
});

describe('the shop’s running ledger (O5)', () => {
  let now: number;
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => {} });
  });
  let n = 0;
  const batch = (events: { type: string; data: object }[]) =>
    store.handle({ key: KEY_A, action: 'events', events: events.map((e) => ({ id: `r${++n}`, ...e })) }, 100) as { ok: boolean; results: { ok: boolean; detail?: string }[] };
  const day = (i: number) => new Date(Date.parse(`${D}T00:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10);

  it('a sale reads the running ledger, not the history: a year of tallies and sales, then a 20-sale batch', () => {
    // 2026-11-05 relay review O5: each sale refolded every tally and shop row (a year: 153k rows read, 112 ms)
    // (each tally sent while its day is recent: the record takes one dated at most TALLY_PAST_DAYS back)
    for (let i = 365; i >= 1; i -= 30) {
      now = T0 - Math.max(0, i - 29) * 86_400_000;
      batch(Array.from({ length: Math.min(30, i) }, (_, j) => ({ type: 'tally', data: { date: day(i - j), counts: { 'fish:koi': 5, 'bug:ant': 3 } } })));
    }
    now += 60_000;
    for (let i = 0; i < 6; i++) {
      batch(Array.from({ length: 50 }, () => ({ type: 'sell', data: { species: 'fish:koi', n: 1, v: K } })));
      now += 60_000;
    }
    const before = db.reads();
    const r = batch(Array.from({ length: 20 }, () => ({ type: 'sell', data: { species: 'fish:koi', n: 1, v: K } })));
    expect(r.results.every((x) => x.ok)).toBe(true);
    expect(db.reads() - before).toBeLessThan(20 * 10);
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same', A: 'same', B: 'none', G: 'none' });
  });

  it('stays the fold’s through tallies, give-backs, sells, buys and a load; the admin re-check says so and mends', () => {
    const item = stockOf(D)[0];
    batch([{ type: 'tally', data: { date: D, counts: { 'fish:whale-shark': 4, 'fish:koi': 1 } } }]);
    batch([{ type: 'sell', data: { species: 'fish:whale-shark', n: 3, v: 3 * W } }]);
    batch([{ type: 'tally', data: { date: D, counts: { 'fish:whale-shark': 5 } } }]); // merged: the day's larger counts
    batch([{ type: 'tally_back', data: { date: D, counts: { 'fish:whale-shark': 3 } } }]); // 1 of the 3 sold owes
    batch([{ type: 'buy', data: { item, price: buyPrice(item)!, d: D } }, { type: 'buy', data: { item, price: buyPrice(item)!, d: D } }]);
    batch([{ type: 'tally', data: { date: day(1), counts: { 'fish:whale-shark': 2 } } }]); // the debt paid
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
    store.load({ rows: { events: [[new Date(T0 + 9e6).toISOString(), 'A', 'x1', 'tally', JSON.stringify({ date: day(2), counts: { 'fish:koi': 9 } })]] } });
    expect(store.shopCheck()).toMatchObject({ A: { differs: ['stale'] } }); // the pocket let go: the next read folds it again
    expect(batch([{ type: 'sell', data: { species: 'fish:koi', n: 10, v: 10 * K } }]).results[0].ok).toBe(true);
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
    // a pocket gone wrong (by hand) is found and mended by `fix`; a wallet gone wrong is found, never mended by it
    // (the stored number wins): walletset settles it with a correction row
    db.db.prepare("UPDATE meta SET v = replace(replace(v, '\"h\":', '\"h\":1'), '\"c\":[[\"fish:koi\",10]', '\"c\":[[\"fish:koi\",11]') WHERE k = 'shop|A'").run();
    const h = JSON.parse((db.db.prepare(`SELECT v FROM meta WHERE k = 'shop|A'`).get() as { v: string }).v).h as number, fold = Number(String(h).slice(1));
    expect(store.shopCheck()).toMatchObject({ A: { differs: ['h', 'c'], h: [h, fold], c: { 'fish:koi': [11, 10] } } });
    expect(store.shopCheck({ fix: true })).toMatchObject({ A: { differs: ['h', 'c'] } });
    expect(store.shopCheck()).toMatchObject({ A: { differs: ['h'], h: [h, fold] } });
    expect(store.walletSet({ id: 'ws-1', who: 'A', h: fold, note: 'the fold' })).toMatchObject({ ok: true, before: h, after: fold });
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
  });

  it('a ledger kept before the old fruit was its goal’s is folded again (pocketKey), its かいがら as they were', () => {
    batch([{ type: 'tally', data: { date: D, counts: { 'goods:apple': 2, 'fish:koi': 1 } } }]);
    batch([{ type: 'sell', data: { species: 'goods:apple', n: 1, v: 5 } }]);
    // the running ledger as the record kept it before 2026-11-16's conversion: the old fruit under its own key
    db.db.prepare(`UPDATE meta SET v = replace(v, 'goods:goal-apple', 'goods:apple') WHERE k = 'shop|A'`).run();
    expect(store.shopCheck()).toMatchObject({ A: { differs: ['stale'] } }); // (its pocket folded again at the next read)
    expect(batch([{ type: 'sell', data: { species: 'goods:goal-apple', n: 1, v: 60 } }]).results[0].ok).toBe(true);
    expect(batch([{ type: 'sell', data: { species: 'goods:apple', n: 1, v: 60 } }]).results[0]).toMatchObject({ ok: false, detail: 'pocket short' });
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
    expect(JSON.parse((db.db.prepare(`SELECT v FROM meta WHERE k = 'shop|A'`).get() as { v: string }).v).h).toBe(65);
  });
});

// The shop's ぜんぶ かう (store.ts group): the day's pieces in one `events` request, one `group`, all or none.
describe('a group of buys (ぜんぶ かう)', () => {
  let now: number;
  let store: StoreCore;
  let notices = 0;
  beforeEach(() => {
    now = T0;
    notices = 0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => void notices++ });
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  type Result = { id: string; ok: boolean; duplicate?: true; at?: string; error?: string; detail?: string };
  const post = (who: 'A' | 'B' | 'G', events: object[]) =>
    (store.handle({ key: keyOf[who], action: 'events', events }, 100) as unknown as { results: Result[] }).results;
  const pieces = stockOf(D).slice(0, 4);
  const total = pieces.reduce((a, c) => a + buyPrice(c)!, 0);
  const buys = (g: string, list = pieces, who = 'a') => list.map((item, i) => ({ id: `${who}-${g}-${i}`, type: 'buy', group: g, data: { item, price: buyPrice(item)!, d: D } }));
  /** `who`'s かいがら: exactly `v`, from koi sold (a sell may fetch under its list: an older app's). */
  const fund = (who: 'A' | 'B', v: number) => {
    const k = Math.ceil(v / K);
    post(who, [{ id: `t-${who}`, type: 'tally', data: { date: D, counts: { 'fish:koi': k } } }, { id: `s-${who}`, type: 'sell', data: { species: 'fish:koi', n: k, v } }]);
  };
  const owned = (who: 'A' | 'B') => (store.handle({ key: keyOf[who], action: 'snapshot' }, 100) as unknown as { rows: { events: unknown[][] } }).rows.events
    .filter((r) => r[3] === 'buy' && r[1] === who).map((r) => (JSON.parse(r[4] as string) as { item: string }).item);

  it('keeps every piece when the かいがら cover them all, one notice', () => {
    fund('A', total);
    notices = 0;
    const r = post('A', buys('g1'));
    expect(r.map((x) => x.ok)).toEqual([true, true, true, true]);
    expect(r.every((x) => typeof x.at === 'string')).toBe(true);
    expect(notices).toBe(1);
    expect(owned('A').sort()).toEqual([...pieces].sort());
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
  });

  it('keeps none when they don’t: the short one says so, the rest `group`; nothing charged', () => {
    fund('A', total - 1); // all but the last covered
    const r = post('A', buys('g1'));
    expect(r.map((x) => x.detail)).toEqual(['group', 'group', 'group', 'wallet short']);
    expect(r.every((x) => !x.ok && x.error === 'bad_request')).toBe(true);
    expect(owned('A')).toEqual([]);
    // the かいがら are all still there: the first three alone go through
    expect(post('A', buys('g2', pieces.slice(0, 3))).every((x) => x.ok)).toBe(true);
  });

  it('a piece my other phone bought meanwhile is refused `owned` alone and costs nothing; the rest are kept', () => {
    fund('A', total);
    expect(post('A', [{ id: 'other', type: 'buy', data: { item: pieces[1], price: buyPrice(pieces[1])!, d: D } }])[0].ok).toBe(true);
    const r = post('A', buys('g1'));
    expect(r.map((x) => x.ok)).toEqual([true, false, true, true]);
    expect(r[1]).toMatchObject({ error: 'bad_request', detail: 'owned' });
    expect(owned('A').sort()).toEqual([...pieces].sort()); // each once
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
    // charged once for each: nothing left over, nothing owed
    expect(post('A', [{ id: 'more', type: 'buy', data: { item: stockOf(D)[5], price: buyPrice(stockOf(D)[5])!, d: D } }])[0]).toMatchObject({ detail: 'wallet short' });
  });

  it('the partner buying the same piece takes nothing from me: each person’s own', () => {
    fund('A', total);
    fund('B', buyPrice(pieces[0])!);
    expect(post('B', [{ id: 'b0', type: 'buy', data: { item: pieces[0], price: buyPrice(pieces[0])!, d: D } }])[0].ok).toBe(true);
    expect(post('A', buys('g1')).every((x) => x.ok)).toBe(true);
    expect(owned('B')).toEqual([pieces[0]]);
  });

  it('a retry of a group kept is each a duplicate (its ack lost), even the next day', () => {
    fund('A', total);
    expect(post('A', buys('g1')).every((x) => x.ok)).toBe(true);
    now += 86_400_000;
    expect(post('A', buys('g1'))).toEqual(pieces.map((_, i) => ({ id: `a-g1-${i}`, ok: true, duplicate: true })));
    expect(owned('A')).toHaveLength(4);
  });

  it('a group of sells (全部売る): all kept, or none when one is past the pocket (my other phone sold it)', () => {
    post('A', [{ id: 't', type: 'tally', data: { date: D, counts: { 'fish:koi': 3, 'fish:whale-shark': 2 } } }]);
    const sells = (g: string, koi: number) => [
      { id: `${g}-1`, type: 'sell', group: g, data: { species: 'fish:whale-shark', n: 2, v: 2 * W } },
      { id: `${g}-2`, type: 'sell', group: g, data: { species: 'fish:koi', n: koi, v: koi * K } }
    ];
    // the other phone sold a koi: 3 no longer fit, so the shark isn't sold either
    expect(post('A', [{ id: 'other', type: 'sell', data: { species: 'fish:koi', n: 1, v: K } }])[0].ok).toBe(true);
    const r = post('A', sells('g1', 3));
    expect(r.map((x) => x.detail)).toEqual(['group', 'pocket short']);
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
    expect(post('A', sells('g2', 2)).every((x) => x.ok)).toBe(true);
    // all of it gone: the shark's かいがら and the koi's, nothing past the pocket
    expect(post('A', [{ id: 'more', type: 'sell', data: { species: 'fish:whale-shark', n: 1, v: W } }])[0].ok).toBe(false);
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
  });

  it('a group beside other events: only the group is all or none', () => {
    fund('A', buyPrice(pieces[0])!);
    const r = post('A', [
      { id: 'x1', type: 'tally', data: { date: D, counts: { 'fish:koi': 99 } } },
      ...buys('g1', pieces.slice(0, 2)),
      { id: 'x2', type: 'buy', data: { item: pieces[0], price: buyPrice(pieces[0])!, d: D } }
    ]);
    expect(r.map((x) => x.ok)).toEqual([true, false, false, true]);
    expect(r[2].detail).toBe('wallet short');
    expect(owned('A')).toEqual([pieces[0]]);
  });
});

// 英語すごろく's reward (contract/shop.ts `sg_reward`): anyone's, the guest's too; a row of each recipient's ledger
// (its `to`), whoever sent it; a game pays each once; kept while it pays one of them; no daily cap.
describe('英語すごろく’s reward in the record', () => {
  let now: number;
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => {} });
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: 'A' | 'B' | 'G', type: string, data: object, id = `w${++n}`) =>
    noWallets(store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100));
  const reward = (who: 'A' | 'B' | 'G', g: string, v: number, to: string[], d = D, id?: string) => send(who, 'sg_reward', { g, v, to, d }, id);
  const refused = (detail?: string) => ({ ok: false, error: 'bad_request', ...(detail ? { detail } : {}) });
  const item = stockOf(D)[0], price = buyPrice(item)!;
  const buy = (who: 'A' | 'B' | 'G') => send(who, 'buy', { item, price, d: D });
  const ledger = (who: 'A' | 'B' | 'G') => {
    const raw = db.db.prepare('SELECT v FROM meta WHERE k = ?').get(`shop|${who}`) as { v: string } | undefined;
    return raw ? (JSON.parse(raw.v) as { h: number; g: string[]; n: number; t: string }) : null;
  };

  it('keeps one from anyone (the guest too); its かいがら are each recipient’s, spendable at the shop; never the sender’s unnamed', () => {
    expect(reward('G', 'sg-game-0001', price, ['A', 'G'])).toEqual({ ok: true });
    expect(buy('A')).toEqual({ ok: true });
    expect(buy('G')).toEqual({ ok: true });
    expect(buy('B')).toEqual(refused('wallet short'));
    expect(reward('A', 'sg-game-0002', price, ['B'])).toMatchObject({ ok: true }); // A sends, B is paid
    expect(buy('B')).toEqual({ ok: true });
    expect(buy('A')).toEqual(refused('owned'));
    expect(ledger('A')).toMatchObject({ h: 0, g: ['sg-game-0001'] });
    expect(ledger('B')).toMatchObject({ h: 0, g: ['sg-game-0002'] });
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same', A: 'same', B: 'same', G: 'same' });
  });

  it('a game pays each once: a second reward of it (another phone’s) is refused `reward paid`, kept when it pays someone new', () => {
    expect(reward('A', 'sg-game-0001', 500, ['A', 'B'])).toMatchObject({ ok: true });
    expect(reward('B', 'sg-game-0001', 500, ['B', 'A'])).toEqual(refused('reward paid'));
    expect(reward('B', 'sg-game-0001', 700, ['A'])).toEqual(refused('reward paid'));
    expect(reward('G', 'sg-game-0001', 500, ['A', 'G'])).toMatchObject({ ok: true }); // pays the guest alone
    expect([ledger('A')!.h, ledger('B')!.h, ledger('G')!.h]).toEqual([500, 500, 500]);
    // an id once: a retry of the kept one is a duplicate, not a refusal
    expect(reward('A', 'sg-game-0004', 10, ['A'], D, 'same-id')).toMatchObject({ ok: true });
    expect(reward('A', 'sg-game-0004', 10, ['A'], D, 'same-id')).toEqual({ ok: true, duplicate: true });
    expect(ledger('A')!.h).toBe(510);
    expect(store.shopCheck()).toMatchObject({ A: 'same', B: 'same', G: 'same' });
  });

  it('no daily cap: many games a day each pay in full, up to 1000 a recipient', () => {
    for (let i = 0; i < 8; i++) expect(reward('A', `sg-day-game-${i}`, 1000, ['A'])).toMatchObject({ ok: true });
    expect(ledger('A')!.h).toBe(8000);
    expect(reward('A', 'sg-day-game-x', 1001, ['A'])).toEqual(refused());
  });

  it('refuses a bad shape and a day other than the record’s or yesterday', () => {
    expect(reward('A', 'sg-game-0001', 5, ['A'], '2026-11-03')).toMatchObject({ ok: true }); // yesterday
    expect(reward('A', 'sg-game-0002', 5, ['A'], '2026-11-02')).toEqual(refused());
    expect(reward('A', 'sg-game-0003', 5, ['A'], '2026-11-05')).toEqual(refused());
    expect(reward('A', 'sg-game-0004', 5, [])).toEqual(refused());
    expect(reward('A', 'sg-game-0004', 5, ['A', 'A'])).toEqual(refused());
    expect(reward('A', 'sg-game-0004', 5, ['X'])).toEqual(refused());
    expect(reward('A', 'no', 5, ['A'])).toEqual(refused());
    expect(send('A', 'sg_reward', { g: 'sg-game-0004', v: 5, to: ['A'], d: D, extra: 1 })).toEqual(refused());
  });

  it('the ledger folded from the rows fans out the same: after a load, and from a ledger kept before rewards (no `g`)', () => {
    send('A', 'tally', { date: D, counts: { 'fish:koi': 2 } });
    send('A', 'sell', { species: 'fish:koi', n: 2, v: 2 * K });
    reward('B', 'sg-game-0001', 500, ['A', 'B']);
    reward('G', 'sg-game-0002', 40, ['A']);
    const want = ledger('A');
    expect(want).toMatchObject({ h: 2 * K + 540, g: ['sg-game-0001', 'sg-game-0002'] });
    // a running ledger as an older relay kept it (no `g`): folded again, the rewards' rows included
    // (its wallet with it: that relay served the fold of such a one)
    db.db.prepare(`UPDATE meta SET v = '{"c":[],"b":[],"s":[],"v":[],"o":[],"h":0,"w":[]}' WHERE k = 'shop|A'`).run();
    expect(reward('B', 'sg-game-0001', 500, ['A'])).toEqual(refused('reward paid'));
    const { n: _n, t: _t, ...rest } = want!;
    expect(ledger('A')).toMatchObject({ ...rest, n: 0 });
    // a load never moves a wallet (the stored number wins): the rows it brought are the pockets' only, and the
    // check says the wallet and the fold differ by them, for the admin to settle (walletset)
    store.load({ rows: { events: [[new Date(T0 + 9e6).toISOString(), 'B', 'x1', 'sg_reward', JSON.stringify({ g: 'sg-game-0003', v: 7, to: ['A', 'G'], d: D })]] } });
    expect(store.shopCheck()).toMatchObject({ A: { differs: ['stale', 'h'], h: [2 * K + 540, 2 * K + 547] } });
    expect(reward('A', 'sg-game-0004', 1, ['A'])).toMatchObject({ ok: true });
    expect(ledger('A')).toMatchObject({ h: 2 * K + 541, g: ['sg-game-0001', 'sg-game-0002', 'sg-game-0003', 'sg-game-0004'] });
    expect(store.shopCheck()).toMatchObject({ A: { differs: ['h'], h: [2 * K + 541, 2 * K + 548] }, G: 'none' });
    expect(store.walletCheck().drift).toEqual([{ who: 'A', stored: 2 * K + 541, fold: 2 * K + 548, floor: 0 }]);
  });
});

// The admin's correction of someone's かいがら (store.ts adjust / unadjust, contract/shop.ts adjustOf): never a phone's.
describe('a correction (shop_adjust)', () => {
  let now: number;
  let store: StoreCore;
  const notices: { what: string; who: string; at: string; rev: string }[] = [];
  beforeEach(() => {
    now = T0;
    notices.length = 0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: (x) => void notices.push(x as (typeof notices)[number]) });
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: 'A' | 'B' | 'G', type: string, data: object, id = `c${++n}`) =>
    noWallets(store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100));
  const foldOf = (s: StoreCore, who: 'A' | 'B' | 'G'): number => (s as unknown as { shopFold(w: string): { l: { shells: number } } }).shopFold(who).l.shells;
  const shells = (who: 'A' | 'B' | 'G'): number => foldOf(store, who);
  const snap = (who: 'A' | 'B' | 'G', since?: string) =>
    (store.handle({ key: keyOf[who], action: 'snapshot', ...(since ? { since } : {}) }, 100) as unknown as { rows: { events: string[][] } }).rows.events;
  const sellKoi = (who: 'A' | 'B' | 'G', k: number) => {
    send(who, 'tally', { date: D, counts: { 'fish:koi': k } });
    return send(who, 'sell', { species: 'fish:koi', n: k, v: k * K });
  };

  it('is refused from every key, the guest’s included', () => {
    expect(send('A', 'shop_adjust', { v: 100, note: 'x' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('B', 'shop_adjust', { v: 100, note: 'x' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('G', 'shop_adjust', { v: 100, note: 'x' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(snap('A').some((r) => r[3] === 'shop_adjust')).toBe(false);
  });

  it('the admin’s is kept, adds its v to its person’s かいがら only, keeps the running ledger the fold’s, and reaches the phones as a new row', () => {
    sellKoi('A', 3);
    sellKoi('B', 1);
    sellKoi('G', 2);
    expect(store.shopCheck()).toMatchObject({ A: 'same', B: 'same', G: 'same' });
    const before = { A: shells('A'), B: shells('B'), G: shells('G') };
    const since = snap('A').at(-1)![0];
    notices.length = 0;
    expect(store.adjust({ id: 'adj-a', who: 'A', v: 20_000 - 3 * K, note: 'last sale → 20,000' })).toMatchObject({ ok: true, id: 'adj-a' });
    expect(store.adjust({ id: 'adj-g', who: 'G', v: -5, note: 'down' })).toMatchObject({ ok: true });
    expect(shells('A')).toBe(before.A + 20_000 - 3 * K);
    expect(shells('B')).toBe(before.B);
    expect(shells('G')).toBe(before.G - 5);
    expect(store.shopCheck()).toMatchObject({ A: 'same', B: 'same', G: 'same' });
    // (an `ingest` notice each: never skipped as a phone's own; the guest's phone too)
    expect(notices.map((x) => [x.what, x.who])).toEqual([['ingest', 'A'], ['ingest', 'G']]);
    // (incrementally: a phone's next `since` brings it, no new epoch)
    expect(snap('B', since).filter((x) => x[3] === 'shop_adjust').map((x) => [x[1], x[2]])).toEqual([['A', 'adj-a'], ['G', 'adj-g']]);
    expect(snap('G', since).filter((x) => x[3] === 'shop_adjust')).toHaveLength(2);
    // a retry is a duplicate; a bad shape refused
    expect(store.adjust({ id: 'adj-a', who: 'A', v: 1, note: 'again' })).toEqual({ ok: true, duplicate: true });
    for (const bad of [{ v: 0 }, { v: 100_001 }, { v: 1.5 }, { who: 'C' }, { note: '' }, { note: 'x'.repeat(81) }])
      expect(store.adjust({ id: 'adj-x', who: 'B', v: 1, note: 'ok', ...bad })).toEqual({ ok: false, error: 'bad_request' });
    expect(shells('A')).toBe(before.A + 20_000 - 3 * K);
    // the かいがら are spendable: a buy against them is covered
    const item = stockOf(D)[0];
    expect(send('A', 'buy', { item, price: buyPrice(item)!, d: D })).toEqual({ ok: true });
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
  });

  it('unadjust deletes it: the かいがら back as before, the ledger folded again, a new epoch', () => {
    sellKoi('B', 2);
    store.shopCheck();
    const before = shells('B');
    store.adjust({ id: 'adj-b', who: 'B', v: 500, note: 'test' });
    const rev = (store.handle({ key: KEY_A, action: 'snapshot' }, 100) as unknown as { rev: string }).rev;
    const r = store.unadjust({ id: 'adj-b' });
    expect(r).toMatchObject({ ok: true, who: 'B' });
    expect(r.rev).not.toBe(rev);
    expect(shells('B')).toBe(before);
    expect(snap('A').some((x) => x[3] === 'shop_adjust')).toBe(false);
    expect(store.shopCheck()).toMatchObject({ B: 'same' }); // (its wallet less the correction, nothing folded again)
    sellKoi('B', 1);
    expect(store.shopCheck()).toMatchObject({ B: 'same' });
    expect(store.unadjust({ id: 'adj-b' })).toMatchObject({ ok: false });
    // its id stays known: the same correction again needs a new id
    expect(store.adjust({ id: 'adj-b', who: 'B', v: 500, note: 'test' })).toEqual({ ok: true, duplicate: true });
  });

  it('a dump’s row comes back with a load (a restore keeps the correction)', () => {
    store.adjust({ id: 'adj-l', who: 'A', v: 700, note: 'kept' });
    const rows = snap('A');
    const db = memSql();
    const other = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => {} });
    expect(other.load({ rows: { events: rows } })).toMatchObject({ ok: true, events: 1 });
    expect(foldOf(other, 'A')).toBe(700);
  });
});
