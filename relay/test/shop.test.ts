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
