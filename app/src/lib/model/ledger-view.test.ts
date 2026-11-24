// The shop and the ずかん from the relay's stored ledger (docs/backend.md#the-ledger, model/shop.ts storedView,
// model/tally.ts zukanTotals): the parts as the record keeps them, this phone's unsent ops on top as the record will
// step them (a refused one nothing), an acked one already in the parts; a person without parts, and a State without
// ledgers (an older relay), from the rows.
import { describe, expect, it } from 'vitest';
import { foldEvents, reduce, type State } from './state.ts';
import { shopView } from './shop.ts';
import { zukanTotals } from './tally.ts';
import { sellPrice } from '#lib/contract/shop.ts';
import type { Ledgers } from '#lib/contract/ledger.ts';
import type { EventRow } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';

const D = '2026-11-04';
const at = (hm: string) => new Date(`${D}T${hm}:00+09:00`).toISOString();
let n = 0;
const ev = (when: string, person: Who, type: string, data: object, id = `e${++n}`): EventRow => [when, person, id, type as EventRow[3], JSON.stringify(data)];
const K = sellPrice('fish:koi')!;
const part = (v: unknown, seq = 1) => ({ seq, at: at('08:00'), v });

describe('the shop and the ずかん from the stored ledger', () => {
  // (the record's rows: a day's tally of A's; the parts say A has 1 koi left after a sale, 5000 かいがら, a piece)
  const rows: EventRow[] = [ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3, 'item:froggy-chair': 1 } })];
  const ledgers: Ledgers = {
    A: { hp: part({ h: 5000, p: [['fish:koi', 1]] }), w: part([['f3672', 1000]]), g: part([['sg-game-0001', D]]), z: part([['fish:koi', 3], ['item:froggy-chair', 1]]) }
  };
  const base = { ...reduce({ metrics: [], events: rows }), ledgers } as State;

  it('reads the parts: the pocket, かいがら, pieces with their time, games; never the rows’ fold', () => {
    const a = shopView(base, 'A');
    expect([...a.pocket]).toEqual([['fish:koi', 1]]);
    expect(a.shells).toBe(5000);
    expect(a.owned).toEqual(['f3672']);
    expect([...a.ownedAt]).toEqual([['f3672', 1000]]);
    expect([...a.games]).toEqual(['sg-game-0001']);
    expect(shopView(base, 'A')).toBe(a);
    // (B has no parts: the rows' fold, nothing)
    expect(shopView(base, 'B')).toMatchObject({ shells: 0, owned: [] });
  });

  it('steps the unsent ops on top as the record will: a sell, a buy, a tally’s growth over the day held; a refused one nothing', () => {
    const unsent = new Set(['u1', 'u2', 'u3', 'u4']);
    const later = foldEvents(base, [
      ev(at('10:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 5, 'item:froggy-chair': 1 } }, 'u1'),
      ev(at('10:01'), 'A', 'sell', { species: 'fish:koi', n: 2, v: 2 * K }, 'u2'),
      ev(at('10:02'), 'A', 'sell', { species: 'fish:koi', n: 9, v: 9 * K }, 'u3'),
      ev(at('10:03'), 'A', 'buy', { item: 'f7047', price: 25, d: D }, 'u4')
    ], null, unsent)!;
    const a = shopView(later, 'A');
    // 1 + (5 − 3) − 2: the refused sale of 9 counts for nothing
    expect([...a.pocket]).toEqual([['fish:koi', 1]]);
    expect(a.shells).toBe(5000 + 2 * K - 25);
    expect(a.owned).toEqual(['f3672', 'f7047']);
    expect(zukanTotals(later).by.A.get('fish:koi')).toBe(5);
    expect(zukanTotals(later).all.get('item:froggy-chair')).toBe(1);
  });

  it('an acked op (not unsent) is the parts’ already: never stepped twice', () => {
    const later = foldEvents(base, [ev(at('10:01'), 'A', 'sell', { species: 'fish:koi', n: 1, v: K }, 'acked')], null, new Set())!;
    expect(shopView(later, 'A').shells).toBe(5000);
    expect([...shopView(later, 'A').pocket]).toEqual([['fish:koi', 1]]);
  });

  it('the ずかん: each person’s totals as the record keeps them, everyone’s their sum; one without from the rows', () => {
    const withB = { ...base, ledgers: { ...ledgers, B: { hp: part({ h: 0, p: [] }), z: part([['fish:koi', 2]]) } } } as State;
    const t = zukanTotals(withB);
    expect(t.by.A.get('fish:koi')).toBe(3);
    expect(t.by.B.get('fish:koi')).toBe(2);
    expect(t.all.get('fish:koi')).toBe(5);
    // (without ledgers: the rows)
    expect(zukanTotals({ tallies: base.tallies }).by.A.get('fish:koi')).toBe(3);
  });
});
