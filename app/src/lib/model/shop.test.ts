// The shop in the model (model/shop.ts): each person's pocket is what their day tallies caught (each day's latest row)
// less what they sold; かいがら the sells less the buys; a piece once; the guest's its own; a row the record would refuse
// counts for nothing, and a queued sell or buy shows at once (foldEvents).
import { describe, expect, it } from 'vitest';
import { foldEvents, reduce } from './state.ts';
import { shopView } from './shop.ts';
import { weekBells } from './bells.ts';
import { stockOf, buyPrice } from '#lib/contract/shop.ts';
import type { EventRow } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';

const D = '2026-11-04';
const at = (hm: string, date = D) => new Date(`${date}T${hm}:00+09:00`).toISOString();
let n = 0;
const ev = (when: string, person: Who, type: string, data: object): EventRow => [when, person, `e${++n}`, type as EventRow[3], JSON.stringify(data)];
const item = stockOf(D)[0];
const price = buyPrice(item)!;

describe('the pocket and かいがら', () => {
  const events: EventRow[] = [
    ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 1 } }),
    ev(at('09:05'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3, 'bug:tarantula': 2, 'shell:cowrie': 4 } }), // replaces the 09:00 row
    ev(at('12:00', '2026-11-03'), 'A', 'tally', { date: '2026-11-03', counts: { 'fish:koi': 2 } }),
    ev(at('09:10'), 'A', 'sell', { species: 'fish:koi', n: 4, v: 160 }),
    ev(at('09:11'), 'A', 'sell', { species: 'fish:koi', n: 2, v: 80 }), // past the pocket (5 caught, 4 sold): nothing
    ev(at('09:12'), 'A', 'sell', { species: 'bug:tarantula', n: 1, v: 80 }),
    ev(at('09:20'), 'A', 'buy', { item, price, d: D }),
    ev(at('09:21'), 'A', 'buy', { item, price, d: D }), // a piece once
    ev(at('09:22'), 'A', 'buy', { item: 'f3672', price: 999_999, d: D }), // past かいがら
    ev(at('10:00'), 'G', 'tally', { date: D, counts: { 'fish:koi': 1 } }),
    ev(at('10:01'), 'G', 'sell', { species: 'fish:koi', n: 1, v: 40 }),
    ev(at('10:02'), 'B', 'sell', { species: 'fish:koi', n: 1, v: 40 }) // B caught none
  ];
  const s = reduce({ metrics: [], events });

  it('each person’s own: the catches less the sells, the sells less the buys', () => {
    const a = shopView(s, 'A');
    expect([...a.pocket]).toEqual([['fish:koi', 1], ['bug:tarantula', 1]]); // never a shell
    expect(a.shells).toBe(160 + 80 - price);
    expect(a.owned).toEqual([item]);
    expect(shopView(s, 'G')).toEqual({ pocket: new Map(), shells: 40, owned: [] });
    expect(shopView(s, 'B')).toEqual({ pocket: new Map(), shells: 0, owned: [] });
    expect(shopView(s, 'A')).toBe(a); // memoised
  });

  it('a queued sell or buy shows at once', () => {
    const later = foldEvents(s, [ev(at('11:00'), 'A', 'sell', { species: 'fish:koi', n: 1, v: 40 })], null)!;
    expect(shopView(later, 'A').pocket.get('fish:koi')).toBeUndefined();
    expect(shopView(later, 'A').shells).toBe(shopView(s, 'A').shells + 40);
    expect(shopView(s, 'A').pocket.get('fish:koi')).toBe(1); // the base untouched
  });

  it('never moves a ベル', () => {
    const none = reduce({ metrics: [], events: [] });
    expect(weekBells(s, '2026-11-02', Date.parse(at('23:00')))).toEqual(weekBells(none, '2026-11-02', Date.parse(at('23:00'))));
  });
});
