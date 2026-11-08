// The shop in the record (docs/backend.md#events `sell` / `buy`, contract/shop.ts): a sell only of what the sender's
// pocket holds (their tallies' catches less their sells), at most its price (an older app's lower list); a buy only of a piece in a stock of
// about today, at exactly its price, covered by their かいがら, once; each person's own (the guest's too); an id once.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { buyPrice, sellPrice, stockOf } from '../../app/src/lib/contract/shop.ts';
import { BUY } from '../../app/src/lib/contract/shopPrices.ts';
import { memSql } from './sqlite.ts';

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
    store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100) as Record<string, unknown>;
  const tally = (who: 'A' | 'B' | 'G', counts: Record<string, number>, date = D) => send(who, 'tally', { date, counts });
  const sell = (who: 'A' | 'B' | 'G', species: string, k: number, v: number, id?: string) => send(who, 'sell', { species, n: k, v }, id);
  const item = stockOf(D)[0];
  const buy = (who: 'A' | 'B' | 'G', it = item, price = buyPrice(it)!, d = D) => send(who, 'buy', { item: it, price, d });
  const refused = (detail?: string) => ({ ok: false, error: 'bad_request', ...(detail ? { detail } : {}) });

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

  it('an id once: a retry is a duplicate, never sold twice', () => {
    tally('A', { 'fish:koi': 1 });
    expect(sell('A', 'fish:koi', 1, K, 'sell-1')).toEqual({ ok: true });
    expect(sell('A', 'fish:koi', 1, K, 'sell-1')).toEqual({ ok: true, duplicate: true });
    expect(buy('A', 'f3672', 6)).toEqual({ ok: true });
    const rows = (store.handle({ key: KEY_A, action: 'snapshot' }, 10) as unknown as { rows: { events: string[][] } }).rows.events;
    expect(rows.filter((r) => r[3] === 'sell')).toHaveLength(1);
    expect(rows.filter((r) => r[3] === 'buy')).toHaveLength(1);
  });

  it('buys only what かいがら cover, a piece once, from the day’s stock at its price', () => {
    const price = buyPrice(item)!;
    expect(buy('A')).toEqual(refused('wallet short'));
    tally('A', { 'fish:whale-shark': 40 });
    expect(sell('A', 'fish:whale-shark', 40, 40 * W)).toEqual({ ok: true });
    expect(buy('A', item, price + 1)).toEqual(refused());
    const not = Object.keys(BUY).find((c) => !['2026-11-03', D, '2026-11-05'].some((d) => stockOf(d).includes(c)))!;
    expect(buy('A', not)).toEqual(refused()); // not in the stock
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
    expect(buy('G', 'f3672', 6)).toEqual({ ok: true }); // the cardboard box, always in stock
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
    for (let i = 365; i >= 1; i -= 50) {
      batch(Array.from({ length: Math.min(50, i) }, (_, j) => ({ type: 'tally', data: { date: day(i - j), counts: { 'fish:koi': 5, 'bug:ant': 3 } } })));
      now += 60_000;
    }
    for (let i = 0; i < 6; i++) {
      batch(Array.from({ length: 50 }, () => ({ type: 'sell', data: { species: 'fish:koi', n: 1, v: K } })));
      now += 60_000;
    }
    const before = db.reads();
    const r = batch(Array.from({ length: 20 }, () => ({ type: 'sell', data: { species: 'fish:koi', n: 1, v: K } })));
    expect(r.results.every((x) => x.ok)).toBe(true);
    expect(db.reads() - before).toBeLessThan(20 * 10);
    expect(store.shopCheck()).toEqual({ ok: true, A: 'same', B: 'none', G: 'none' });
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
    expect(store.shopCheck()).toMatchObject({ A: 'none' }); // let go: the next sale folds again
    expect(batch([{ type: 'sell', data: { species: 'fish:koi', n: 10, v: 10 * K } }]).results[0].ok).toBe(true);
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
    // a ledger gone wrong (by hand) is found and mended
    db.db.prepare("UPDATE meta SET v = replace(v, '\"h\":', '\"h\":1') WHERE k = 'shop|A'").run();
    expect(store.shopCheck()).toMatchObject({ A: 'differs' });
    expect(store.shopCheck({ fix: true })).toMatchObject({ A: 'differs' });
    expect(store.shopCheck()).toMatchObject({ A: 'same' });
  });
});
