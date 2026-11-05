// The shop in the model (model/shop.ts): each person's pocket is what their day tallies caught (each day's latest row)
// less what they sold; かいがら the sells less the buys; a piece once; the guest's its own; a queued row the record would
// refuse counts for nothing, a queued sell or buy shows at once (foldEvents), and a kept one stays whatever a later
// tally says.
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
const ev = (when: string, person: Who, type: string, data: object, id = `e${++n}`): EventRow => [when, person, id, type as EventRow[3], JSON.stringify(data)];
const item = stockOf(D)[0];
const price = buyPrice(item)!;

describe('the pocket and かいがら', () => {
  const events: EventRow[] = [
    ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 1 } }),
    ev(at('09:05'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3, 'bug:tarantula': 2, 'shell:cowrie': 4, 'item:froggy-chair': 1 } }), // replaces the 09:00 row
    ev(at('12:00', '2026-11-03'), 'A', 'tally', { date: '2026-11-03', counts: { 'fish:koi': 2 } }),
    ev(at('09:10'), 'A', 'sell', { species: 'fish:koi', n: 4, v: 160 }),
    ev(at('09:11'), 'A', 'sell', { species: 'fish:koi', n: 2, v: 80 }, 'q1'), // queued, past the pocket (5 caught, 4 sold): nothing
    ev(at('09:12'), 'A', 'sell', { species: 'bug:tarantula', n: 1, v: 80 }),
    ev(at('09:20'), 'A', 'buy', { item, price, d: D }),
    ev(at('09:21'), 'A', 'buy', { item, price, d: D }), // a piece once
    ev(at('09:22'), 'A', 'buy', { item: 'f3672', price: 999_999, d: D }, 'q2'), // queued, past かいがら
    ev(at('10:00'), 'G', 'tally', { date: D, counts: { 'fish:koi': 1 } }),
    ev(at('10:01'), 'G', 'sell', { species: 'fish:koi', n: 1, v: 40 }),
    ev(at('10:02'), 'B', 'sell', { species: 'fish:koi', n: 1, v: 40 }, 'q3') // queued: B caught none
  ];
  const s = reduce({ metrics: [], events }, null, new Set(['q1', 'q2', 'q3']));

  it('each person’s own: the catches less the sells, the sells less the buys', () => {
    const a = shopView(s, 'A');
    expect([...a.pocket]).toEqual([['fish:koi', 1], ['bug:tarantula', 1], ['shell:cowrie', 4]]); // never a present's piece
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

  it('a queued sell or buy past the pocket or かいがら counts for nothing (foldEvents too)', () => {
    const later = foldEvents(s, [
      ev(at('11:00'), 'A', 'sell', { species: 'fish:koi', n: 9, v: 360 }),
      ev(at('11:01'), 'A', 'buy', { item: 'f7047', price: 999_999, d: D })
    ], null)!;
    expect(shopView(later, 'A')).toEqual(shopView(s, 'A'));
  });

  it('the race: sell, buy, then a lower tally of the day: the piece stays bought, the wallet as it was', () => {
    const race: EventRow[] = [
      ev(at('09:00'), 'B', 'tally', { date: D, counts: { 'fish:whale-shark': 10 } }),
      ev(at('09:10'), 'B', 'sell', { species: 'fish:whale-shark', n: 10, v: 1300 }),
      ev(at('09:20'), 'B', 'buy', { item, price, d: D })
    ];
    const before = shopView(reduce({ metrics: [], events: race }), 'B');
    expect(before).toEqual({ pocket: new Map(), shells: 1300 - price, owned: [item] });
    // the other phone's older tally lands after the sale: with the earlier row still cached, and once compaction (or a
    // record from before it kept each day's larger counts) leaves only the lower one
    const lower = ev(at('09:30'), 'B', 'tally', { date: D, counts: { 'fish:whale-shark': 2 } });
    for (const events of [[...race, lower], [race[1], race[2], lower]]) {
      const v = shopView(reduce({ metrics: [], events }), 'B');
      expect(v.owned).toEqual([item]);
      expect(v.shells).toBe(1300 - price);
      expect(v.pocket.size).toBe(0); // never a negative pocket
    }
    // queued over it: a sell of what isn't there is refused, a buy the wallet covers counts
    const base = reduce({ metrics: [], events: [race[1], race[2], lower] });
    const more = foldEvents(base, [
      ev(at('10:00'), 'B', 'sell', { species: 'fish:whale-shark', n: 1, v: 130 }),
      ev(at('10:01'), 'B', 'buy', { item: 'f3672', price: 6, d: D })
    ], null)!;
    expect(shopView(more, 'B')).toEqual({ pocket: new Map(), shells: 1300 - price - 6, owned: [item, 'f3672'] });
  });

  it('never moves a ベル', () => {
    const none = reduce({ metrics: [], events: [] });
    expect(weekBells(s, '2026-11-02', Date.parse(at('23:00')))).toEqual(weekBells(none, '2026-11-02', Date.parse(at('23:00'))));
  });
});

describe('a catch given back (tally_back: a claim race lost after its tally came in)', () => {
  it('leaves the pocket and the ずかん’s count; a lower one later takes nothing more; one without its tally counts for nothing', async () => {
    const { tallyTotals } = await import('./tally.ts');
    const s = reduce({
      metrics: [],
      events: [
        ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3, 'bug:tarantula': 1 } }),
        ev(at('09:01'), 'A', 'tally_back', { date: D, counts: { 'fish:koi': 2 } }),
        ev(at('09:02'), 'A', 'tally_back', { date: D, counts: { 'fish:koi': 1 } }), // a stale lower send: the day keeps 2
        ev(at('09:03'), 'B', 'tally_back', { date: D, counts: { 'bug:tarantula': 1 } }) // B has no tally that day
      ]
    }, null);
    expect([...shopView(s, 'A').pocket]).toEqual([['fish:koi', 1], ['bug:tarantula', 1]]);
    expect([...shopView(s, 'B').pocket]).toEqual([]);
    const t = tallyTotals(s.tallies);
    expect([t.all.get('fish:koi'), t.by.A.get('fish:koi'), t.all.get('bug:tarantula'), t.by.B.has('bug:tarantula')]).toEqual([1, 1, 1, false]);
  });

  it('after a sale, costs the sold catch’s かいがら (the record’s rule): the wallet as if never sold; a later catch pays it', () => {
    // 2026-11-05 relay review R1
    const rows = [
      ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 2 } }),
      ev(at('09:01'), 'A', 'sell', { species: 'fish:koi', n: 2, v: 80 }),
      ev(at('09:02'), 'A', 'tally_back', { date: D, counts: { 'fish:koi': 1 } })
    ];
    const s = reduce({ metrics: [], events: rows }, null);
    expect(shopView(s, 'A')).toEqual({ pocket: new Map(), shells: 40, owned: [] });
    const later = reduce({ metrics: [], events: [...rows, ev(at('09:30'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3 } })] }, null);
    expect(shopView(later, 'A')).toEqual({ pocket: new Map(), shells: 80, owned: [] });
  });
});
