// The shop in the model (model/shop.ts): each person's pocket is what their day tallies caught (each day's latest row)
// less what they sold; かいがら the sells less the buys; a piece once; the guest's its own; a queued row the record would
// refuse counts for nothing, a queued sell or buy shows at once (foldEvents), and a kept one stays whatever a later
// tally says.
import { describe, expect, it } from 'vitest';
import { foldEvents, reduce } from './state.ts';
import { shopView } from './shop.ts';
import { weekBells } from './bells.ts';
import { stockOf, buyPrice } from '#lib/contract/stock.ts';
import { caughtOf, isShopEvent, sellPrice, shopLedger, shopRowOf } from '#lib/contract/shop.ts';
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
    expect(shopView(s, 'G')).toEqual({ pocket: new Map(), shells: 40, owned: [], games: new Set() });
    expect(shopView(s, 'B')).toEqual({ pocket: new Map(), shells: 0, owned: [], games: new Set() });
    expect(shopView(s, 'A')).toBe(a); // memoised
  });

  it('the plain fruit picked up before 2026-11-16 is its goal’s (contract/pocket.ts pocketKey): one row, at 60; a past sale as kept', () => {
    const fruit = reduce({ metrics: [], events: [
      ev(at('09:00', '2026-11-15'), 'A', 'tally', { date: '2026-11-15', counts: { 'goods:apple': 3, 'goods:pear': 1 } }),
      ev(at('09:00', '2026-11-16'), 'A', 'tally', { date: '2026-11-16', counts: { 'goods:goal-apple': 1, 'goods:gold-fruit': 1 } }),
      ev(at('09:10', '2026-11-15'), 'A', 'sell', { species: 'goods:apple', n: 1, v: 5 }) // at the old 5: kept so
    ] });
    const a = shopView(fruit, 'A');
    expect([...a.pocket]).toEqual([['goods:goal-apple', 3], ['goods:goal-pear', 1], ['goods:gold-fruit', 1]]);
    expect(a.shells).toBe(5);
    expect([...a.pocket.keys()].map(sellPrice)).toEqual([60, 60, 150]);
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
    expect(before).toEqual({ pocket: new Map(), shells: 1300 - price, owned: [item], games: new Set() });
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
    expect(shopView(more, 'B')).toEqual({ pocket: new Map(), shells: 1300 - price - 6, owned: [item, 'f3672'], games: new Set() });
  });

  it('never moves a ベル', () => {
    const none = reduce({ metrics: [], events: [] });
    expect(weekBells(s, '2026-11-02', Date.parse(at('23:00')))).toEqual(weekBells(none, '2026-11-02', Date.parse(at('23:00'))));
  });
});

describe('英語すごろく’s reward (sg_reward): its recipients’ かいがら, whoever sent it', () => {
  const R = (g: string, v: number, to: Who[], when = at('20:00'), who: Who = 'B', id?: string) => ev(when, who, 'sg_reward', { g, v, to, d: D }, id);

  it('a recipient’s wallet grows by v; a non-recipient’s (the sender too) doesn’t; never a ベル', () => {
    const s = reduce({ metrics: [], events: [R('sg-game-0001', 500, ['A', 'G'])] });
    expect(shopView(s, 'A')).toEqual({ pocket: new Map(), shells: 500, owned: [], games: new Set(['sg-game-0001']) });
    expect(shopView(s, 'G').shells).toBe(500);
    expect(shopView(s, 'B')).toEqual({ pocket: new Map(), shells: 0, owned: [], games: new Set() });
    const none = reduce({ metrics: [], events: [] });
    expect(weekBells(s, '2026-11-02', Date.parse(at('23:00')))).toEqual(weekBells(none, '2026-11-02', Date.parse(at('23:00'))));
  });

  it('a game pays each once: a second reward of it (another phone’s) adds nothing for those paid, the rest for a new one', () => {
    const s = reduce({ metrics: [], events: [
      R('sg-game-0001', 500, ['A', 'B']),
      R('sg-game-0001', 500, ['A', 'B'], at('20:01'), 'A'),
      R('sg-game-0001', 300, ['B', 'G'], at('20:02'), 'G'), // pays the guest alone
      R('sg-game-0002', 80, ['A'], at('20:03'), 'A')
    ] });
    expect([shopView(s, 'A').shells, shopView(s, 'B').shells, shopView(s, 'G').shells]).toEqual([580, 500, 300]);
  });

  it('a queued reward shows at once; a queued one of a game paid counts for nothing; spends as a sale does', () => {
    const base = reduce({ metrics: [], events: [R('sg-game-0001', 500, ['A'])] });
    const later = foldEvents(base, [R('sg-game-0002', 120, ['A', 'B'], at('21:00'), 'A'), R('sg-game-0001', 500, ['A'], at('21:01'), 'A')], null)!;
    expect([shopView(later, 'A').shells, shopView(later, 'B').shells]).toEqual([620, 120]);
    const queuedToo = reduce({ metrics: [], events: [R('sg-game-0001', 500, ['A']), R('sg-game-0002', 120, ['A', 'B'], at('21:00'), 'A', 'q9')] }, null, new Set(['q9']));
    expect(shopView(queuedToo, 'A').shells).toBe(620);
    const spent = foldEvents(base, [ev(at('21:00'), 'A', 'buy', { item, price, d: D })], null)!;
    expect(shopView(spent, 'A')).toMatchObject({ shells: 500 - price, owned: [item] });
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
    expect(shopView(s, 'A')).toEqual({ pocket: new Map(), shells: 40, owned: [], games: new Set() });
    const later = reduce({ metrics: [], events: [...rows, ev(at('09:30'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3 } })] }, null);
    expect(shopView(later, 'A')).toEqual({ pocket: new Map(), shells: 80, owned: [], games: new Set() });
  });
});

describe('the phone and the record agree (contract/shop.ts caughtOf: one fold, no floor on either side)', () => {
  /** The record's fold of these rows (relay/src/store.ts shopFold): a slot a person's day (its largest counts:
   *  tallyKept), Σ tallies − give-backs then the field's net (none here), the shop rows in order. */
  const recordOf = (rows: EventRow[], who: Who) => {
    const days = new Map<string, { back: boolean; counts: Record<string, number> }>();
    for (const [, p, , type, raw] of rows) {
      if (p !== who || (type !== 'tally' && type !== 'tally_back')) continue;
      const d = JSON.parse(raw) as { date: string; counts: Record<string, number> };
      const k = `${type}|${d.date}`, held = days.get(k)?.counts ?? {};
      const counts = { ...held };
      for (const [c, n] of Object.entries(d.counts)) counts[c] = Math.max(n, held[c] ?? 0);
      days.set(k, { back: type === 'tally_back', counts });
    }
    const { caught, back } = caughtOf(days.values());
    const shop = rows.flatMap(([, p, , type, raw]) => (p === who && isShopEvent(type) ? [shopRowOf(type, JSON.parse(raw) as Record<string, unknown>)!] : []));
    return shopLedger(caught, shop, back).shells;
  };
  it('a give-back the phone holds before its day\'s tally (a cache mid-sync): the same かいがら as the record\'s fold of the same rows', () => {
    const rows = [
      ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 2 } }),
      ev(at('09:01'), 'A', 'sell', { species: 'fish:koi', n: 2, v: 80 }),
      // (the next day's give-back in, its tally not yet: koi 2 − 3 = −1)
      ev(at('09:02', '2026-11-05'), 'A', 'tally_back', { date: '2026-11-05', counts: { 'fish:koi': 3 } })
    ];
    const s = reduce({ metrics: [], events: rows }, null);
    expect(shopView(s, 'A').shells).toBe(recordOf(rows, 'A'));
    expect([...shopView(s, 'A').pocket]).toEqual([]);
  });
  it('every person, over the rows of this file\'s other cases', () => {
    const cases: EventRow[][] = [
      [ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 3, 'bug:tarantula': 1 } }), ev(at('09:01'), 'A', 'tally_back', { date: D, counts: { 'fish:koi': 2 } }),
        ev(at('09:02'), 'A', 'sell', { species: 'fish:koi', n: 1, v: 40 }), ev(at('09:03'), 'B', 'tally_back', { date: D, counts: { 'bug:tarantula': 1 } })],
      [ev(at('09:00'), 'G', 'tally', { date: D, counts: { 'shell:cowrie': 4 } }), ev(at('09:01'), 'G', 'sell', { species: 'shell:cowrie', n: 4, v: 40 }),
        ev(at('09:02'), 'G', 'buy_starts', { crop: 'tomato', n: 1, v: 14 }), ev(at('09:03'), 'G', 'tally_back', { date: D, counts: { 'shell:cowrie': 1 } })]
    ];
    for (const rows of cases) {
      const s = reduce({ metrics: [], events: rows }, null);
      for (const who of ['A', 'B', 'G'] as const) expect(shopView(s, who).shells, who).toBe(recordOf(rows, who));
    }
  });
});

describe('the fields in the pocket (contract/farm.ts)', () => {
  const P = 'fd:field-A.0.0', Q = 'fd:field-A.1.0';
  const D3 = '2026-11-07';
  const rows: EventRow[] = [
    ev(at('09:00'), 'A', 'tally', { date: D, counts: { 'fish:koi': 2 } }),
    ev(at('09:01'), 'A', 'sell', { species: 'fish:koi', n: 2, v: 80 }),
    ev(at('09:02'), 'A', 'buy_starts', { crop: 'tomato', n: 3, v: 42 }),
    ev(at('09:03'), 'A', 'farm', { d: D, ops: [{ o: 'plant', p: P, c: 'tomato', src: 'start' }, { o: 'plant', p: Q, c: 'tomato', src: 'start' }] }),
    ev(at('09:04'), 'B', 'island', { date: D, taken: [], puts: [], shakes: [], watered: [P], wishes: {} }), // P's plant day
    ev(at('09:05', D3), 'A', 'farm', { d: D3, ops: [{ o: 'harvest', p: P, n: 2 }] }),
    ev(at('09:06', D3), 'A', 'sell', { species: 'goods:tomato', n: 1, v: 18 })
  ];

  it('bought starts in, planted ones out, a harvest’s vegetables in, sold like any catch', () => {
    const s = reduce({ metrics: [], events: rows }, null);
    const a = shopView(s, 'A');
    expect(Object.fromEntries(a.pocket)).toEqual({ 'goods:tomato': 1, 'goods:tomato-start': 1 });
    expect(a.shells).toBe(80 - 42 + 18);
  });

  it('a queued harvest at the yield the record will give (the waterings), a plant on another’s plant refused', () => {
    const s = reduce({ metrics: [], events: rows.slice(0, 5) }, null);
    const later = foldEvents(s, [
      ev(at('09:05', D3), 'A', 'farm', { d: D3, ops: [{ o: 'harvest', p: P, n: 3 }, { o: 'harvest', p: Q, n: 3 }] }),
      ev(at('09:06', D3), 'B', 'farm', { d: D3, ops: [{ o: 'plant', p: P, c: 'carrot', src: 'start' }] })
    ], null)!;
    expect(shopView(later, 'A').pocket.get('goods:tomato')).toBe(3 + 1);
    expect(shopView(later, 'B').pocket.size).toBe(0);
    expect(later.farm.at(-1)?.queued).toBe(true);
  });
});
