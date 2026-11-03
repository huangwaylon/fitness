import { describe, expect, it } from 'vitest';
import { foldEvents, reduce } from './state.ts';
import { foodDay, foodEntries, foodSeries, kcalGoal, proteinGoal, recipes, repeatOn, repeats } from './food.ts';
import { rangeFor, seriesBuckets, seriesStats } from './health.ts';
import { addDays } from '#lib/time/dates.ts';
import { guestRows } from '#lib/contract/guest.ts';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import { foodFold, foodOp } from '#lib/contract/food.ts';
import { foodRows } from '../../../scripts/bench-rows.ts';

const T = Date.parse('2026-11-03T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
const NATTO = { id: 'mext:04046', n: '納豆', k: 190, p: 16.5, fa: 10, c: 12.1, s: null };
let n = 0;
const ev = (who: 'A' | 'B' | 'G', at: number, data: object, type = 'food'): EventRow =>
  [new Date(at).toISOString(), who, `e${++n}`, type as EventRow[3], JSON.stringify(data)];
const set = (who: 'A' | 'B' | 'G', id: string, at: number, extra: object = {}) =>
  ev(who, at, { id, at, d: '2026-11-03', m: 'b', g: 150, f: RICE, ...extra });

describe('foodDay: a day’s meals and their totals', () => {
  it('folds the ops (contract/food.ts foodFold: an edit, a removal) and adds up the day, an unknown nutrient as none', () => {
    const s = reduce({
      metrics: [],
      events: [
        set('A', 'fmeal001', T, { m: 'd' }),
        set('A', 'fmeal002', T + 1000, { f: NATTO, g: 45 }),
        set('A', 'fmeal002', T + 2000, { f: NATTO, g: 50 }), // edited
        set('A', 'fmeal003', T + 3000),
        ev('A', T + 4000, { id: 'fmeal003', at: T + 4000, rm: true }), // removed
        set('A', 'fmeal004', T + 6000, { d: '2026-11-02' }), // another day
        set('B', 'fmeal005', T + 7000)
      ]
    });
    const day = foodDay(s, 'A', '2026-11-03');
    expect(day.entries.map((e) => [e.id, e.m, e.g])).toEqual([['fmeal002', 'b', 50], ['fmeal001', 'd', 150]]);
    // 156 × 1.5 + 190 × 0.5; salt: natto's unknown
    expect(day).toMatchObject({ kcal: 329, p: 12, fa: 5.5, c: 61.7, s: 0 });
    expect(foodDay(s, 'B', '2026-11-03').entries.map((e) => e.id)).toEqual(['fmeal005']);
    expect(foodDay(s, 'G', '2026-11-03')).toEqual({ entries: [], kcal: 0, p: 0, fa: 0, c: 0, s: 0 });
  });

  it('shows a queued op at once (foldEvents), the guest’s own too', () => {
    const base = reduce({ metrics: [], events: [set('G', 'fmeal010', T)] });
    const s = foldEvents(base, [ev('G', T + 1000, { id: 'fmeal010', at: T + 1000, rm: true }), set('G', 'fmeal011', T + 2000, { m: 's' })], null)!;
    expect(foodDay(s, 'G', '2026-11-03').entries.map((e) => e.id)).toEqual(['fmeal011']);
    expect(foodDay(base, 'G', '2026-11-03').entries.map((e) => e.id)).toEqual(['fmeal010']); // the base untouched
  });
});

describe('the fold of raw rows: parsed when read, incremental as rows arrive', () => {
  const rows = foodRows(40).filter((r) => r[3] === 'food');
  /** The record's fold of exactly these rows, straight from contract/food.ts. */
  const reference = (list: EventRow[]) => {
    const ops = [...list].sort((x, y) => Date.parse(x[0]) - Date.parse(y[0])).flatMap((r) => {
      const op = foodOp(JSON.parse(r[4]));
      return op ? [{ ...op, who: r[1] }] : [];
    });
    return foodFold(ops);
  };
  const days = [0, 5, 20, 39].map((d) => addDays('2026-11-02', d));
  const check = (s: ReturnType<typeof reduce>, list: EventRow[]) => {
    const all = reference(list);
    for (const who of ['A', 'B', 'G'] as const) {
      expect(foodEntries(s, who)).toEqual(all.filter((e) => e.who === who).sort((a, b) => b.at - a.at));
      for (const d of days) expect(foodDay(s, who, d).entries).toEqual(all.filter((e) => e.who === who && e.d === d));
    }
  };

  it('gives the record’s fold through extensions (past a step), other row sets, rows out of order and queued ops', () => {
    const lists = [
      rows.slice(0, 300), rows.slice(0, 301), rows.slice(0, 310), rows.slice(0, 900), rows.slice(0, 901),
      [...rows.slice(0, 450), ...rows.slice(451, 901)], // a row gone (compacted away): another row set
      rows.slice(0, 902), [...rows.slice(0, 902)].reverse(), rows.slice(0, 1000), rows
    ];
    for (const list of lists) check(reduce({ metrics: [], events: list }), list);
    // a queued edit and a removal on top, then the rows they became
    const base = reduce({ metrics: [], events: rows.slice(0, 1000) });
    const last = Date.parse(rows[999][0]);
    const mine = foodEntries(base, 'A').slice(0, 2);
    const queued = [
      ev('A', last + 1, { id: mine[0].id, at: last + 1, d: mine[0].d, m: 'l', g: 1, f: RICE }),
      ev('A', last + 2, { id: mine[1].id, at: last + 2, rm: true })
    ];
    check(foldEvents(base, queued, null)!, [...rows.slice(0, 1000), ...queued]);
    check(reduce({ metrics: [], events: [...rows.slice(0, 1000), ...queued.map((r) => [...r] as EventRow)] }), [...rows.slice(0, 1000), ...queued]);
  });

  it('ignores what reduce would: an unreadable or invalid row, one naming a person', () => {
    const s = reduce({ metrics: [], events: [set('A', 'fmeal030', T), ['x', 'A', 'e-x', 'food', '{}'], ev('A', T + 1, { id: 'fmeal031', at: T + 1, d: '2026-11-03', m: 'b', g: 1, f: RICE, person: 'A' }),
      [new Date(T + 2).toISOString(), 'A', 'e-y', 'food', '{'], set('A', 'fmeal032', T + 3, { g: -1 })] });
    expect(foodEntries(s, 'A').map((e) => e.id)).toEqual(['fmeal030']);
  });
});

describe('foodEntries: a person’s entries across days', () => {
  it('lists the live ones, the latest changed first', () => {
    const s = reduce({
      metrics: [],
      events: [set('A', 'fmeal020', T), set('A', 'fmeal021', T + 1000, { d: '2026-11-01' }), set('A', 'fmeal020', T + 2000, { g: 10 }), set('B', 'fmeal022', T + 3000)]
    });
    expect(foodEntries(s, 'A').map((e) => [e.id, e.at])).toEqual([['fmeal020', T + 2000], ['fmeal021', T + 1000]]);
    expect(foodEntries(s, 'G')).toEqual([]);
  });
});

describe('kcalGoal and proteinGoal', () => {
  const pref = (who: 'A' | 'B' | 'G', at: number, data: object) => ev(who, at, data, 'pref');
  it('kcalGoal: the latest valid pref (a member’s for either, the guest’s own), null cleared or unset', () => {
    const s = reduce({
      metrics: [],
      events: [
        pref('B', T, { person: 'A', key: 'kcalGoal', value: 1800 }),
        pref('A', T + 1000, { key: 'kcalGoal', value: 1825 }), // not a whole 50: ignored
        pref('G', T + 2000, { key: 'kcalGoal', value: 2200 }),
        pref('B', T + 3000, { key: 'kcalGoal', value: 2000 }),
        pref('B', T + 4000, { key: 'kcalGoal', value: null })
      ]
    });
    expect([kcalGoal(s, 'A'), kcalGoal(s, 'B'), kcalGoal(s, 'G')]).toEqual([1800, null, 2200]);
  });

  it('proteinGoal: 1.6 g per kg of the latest weigh-in, members only', () => {
    const metrics: MetricRow[] = [
      ['2026-11-01T22:00:00.000Z', 'A', '2026-11-02', 'weight', 70],
      ['2026-11-02T22:00:00.000Z', 'A', '2026-11-03', 'weight', 68.4]
    ];
    const s = reduce({ metrics, events: [] });
    expect(proteinGoal(s, 'A', T)).toBe(109);
    expect(proteinGoal(s, 'A', Date.parse('2026-11-02T03:00:00.000Z'))).toBe(112);
    expect(proteinGoal(s, 'B', T)).toBeNull();
    expect(proteinGoal(s, 'G', T)).toBeNull();
  });
});

describe('repeats: a meal’s items read into the days it fills', () => {
  const rep = (who: 'A' | 'B' | 'G', id: string, at: number, extra: object = {}) =>
    ev(who, at, { id, at, m: 'b', it: [{ g: 150, f: RICE }, { g: 45, f: NATTO }], w: 127, from: '2026-11-02', ...extra }, 'food_repeat');
  const ids = (s: ReturnType<typeof reduce>, who: 'A' | 'B' | 'G', d: string) => foodDay(s, who, d).entries.map((e) => e.id);

  it('fills each day from `from` to `to` on its weekdays (the Tokyo date’s), not the skipped ones', () => {
    // 2026-11-02 is a Monday; 平日 (Mon–Fri), to the 13th, the 4th skipped
    const s = reduce({ metrics: [], events: [rep('A', 'rmeal001', T, { w: 31, to: '2026-11-13', sk: ['2026-11-04'] })] });
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-07', '2026-11-08', '2026-11-13', '2026-11-16'];
    expect(days.filter((d) => ids(s, 'A', d).length)).toEqual(['2026-11-02', '2026-11-03', '2026-11-13']);
    expect(foodDay(s, 'A', '2026-11-02')).toMatchObject({
      entries: [
        { id: 'rmeal001:0', rep: 'rmeal001', who: 'A', at: T, d: '2026-11-02', m: 'b', g: 150, f: RICE },
        { id: 'rmeal001:1', rep: 'rmeal001', d: '2026-11-02', g: 45, f: NATTO }
      ],
      kcal: 320 // counted like real ones: 156 × 1.5 + 190 × 0.45
    });
    expect(ids(s, 'B', '2026-11-02')).toEqual([]); // only its owner’s day
    expect(foodEntries(s, 'A')).toEqual([]); // never a real entry
  });

  it('open-ended fills the future too; a meal’s repeated items come before its real ones', () => {
    const s = reduce({ metrics: [], events: [set('A', 'fmeal010', T, { d: '2027-01-04', m: 'b' }), set('A', 'fmeal011', T, { d: '2027-01-04', m: 'd' }), rep('A', 'rmeal002', T)] });
    expect(ids(s, 'A', '2027-01-04')).toEqual(['rmeal002:0', 'rmeal002:1', 'fmeal010', 'fmeal011']);
  });

  it('a queued op shows at once (foldEvents), the guest’s own too', () => {
    const base = reduce({ metrics: [], events: [rep('G', 'rmeal003', T)] });
    const s = foldEvents(base, [rep('G', 'rmeal003', T + 3000, { sk: ['2026-11-03'] })], null)!;
    expect(ids(s, 'G', '2026-11-03')).toEqual([]);
    expect(ids(base, 'G', '2026-11-03')).toEqual(['rmeal003:0', 'rmeal003:1']); // the base untouched
  });

  it('repeatOn: the repeat that fills that meal that day, or null; repeats keeps the ended ones', () => {
    const s = reduce({ metrics: [], events: [rep('A', 'rmeal005', T, { to: '2026-11-05' }), rep('A', 'rmeal006', T, { from: '2026-11-06', w: 96 }), rep('A', 'rmeal007', T, { m: 'l' })] });
    expect(repeatOn(s, 'A', 'b', '2026-11-05')?.id).toBe('rmeal005');
    expect(repeatOn(s, 'A', 'b', '2026-11-06')).toBeNull(); // a Friday: the new one is 週末 only
    expect(repeatOn(s, 'A', 'b', '2026-11-07')?.id).toBe('rmeal006');
    expect(repeatOn(s, 'A', 'l', '2026-11-07')?.id).toBe('rmeal007');
    expect(repeatOn(s, 'B', 'b', '2026-11-07')).toBeNull();
    expect(repeats(s, 'A').map((r) => r.id)).toEqual(['rmeal005', 'rmeal007', 'rmeal006']);
  });
});

describe('foodSeries: kcal per day for グラフ, by けんこう’s bucket and stat rules', () => {
  const TODAY = '2026-11-03';
  const WATER = { id: 'mext:16103', n: '水', k: 0, p: 0, fa: 0, c: 0, s: 0 };
  // A: 10-28 rice (234), 10-30 natto 50 g (95), 10-29 and 10-31 nothing; a 毎日 breakfast from 11-01 (rice 150 g +
  // natto 45 g = 320), today with a rice more (554); 11-02 a glass of water besides (0 kcal: still the repeat's 320)
  const s = reduce({
    metrics: [],
    events: [
      set('A', 'fmeal100', T, { d: '2026-10-28' }),
      set('A', 'fmeal101', T, { d: '2026-10-30', f: NATTO, g: 50 }),
      ev('A', T, { id: 'rmeal100', at: T, m: 'b', it: [{ g: 150, f: RICE }, { g: 45, f: NATTO }], w: 127, from: '2026-11-01' }, 'food_repeat'),
      set('A', 'fmeal102', T, { d: TODAY, m: 'l' }),
      set('A', 'fmeal103', T, { d: '2026-11-02', m: 's', f: WATER, g: 200 }),
      set('B', 'fmeal104', T, { d: '2026-11-01', f: WATER, g: 200 }),
      ev('B', T, { key: 'kcalGoal', value: 2000 }, 'pref')
    ]
  });

  it('a day’s total from foodDay (repeats included) from the first meal to today; nothing logged is null, 0 kcal is a record', () => {
    const ds = foodSeries(s, 'A', TODAY);
    expect(ds).toMatchObject({ from: '2026-10-28', to: TODAY, first: '2026-10-28', vals: [234, null, 95, null, 320, 320, 554] });
    expect(ds.goal(0)).toBeNull();
    expect(foodSeries(s, 'A', TODAY)).toBe(ds); // memoised
    // one pass over the record, the same totals as foodDay's day by day; the repeat's days after today aren't read
    ds.vals.forEach((v, i) => {
      const day = foodDay(s, 'A', addDays(ds.from, i));
      expect(v).toBe(day.entries.length ? day.kcal : null);
    });
    expect(foodSeries(s, 'A', '2026-11-05').vals.slice(-2)).toEqual([320, 320]);
    const b = foodSeries(s, 'B', TODAY);
    expect(b).toMatchObject({ from: '2026-11-01', vals: [0, null, null] });
    expect(b.goal(2)).toBe(2000);
    expect(foodSeries(s, 'G', TODAY)).toMatchObject({ from: TODAY, vals: [null] }); // nothing yet
  });

  it('1週: a bar per day, today running; the stats over the finished days with a record (today out), 記録なし counted', () => {
    const ds = foodSeries(s, 'A', TODAY);
    const r = rangeFor('week', TODAY);
    expect(seriesBuckets(ds, r).map((x) => [x.v, x.today])).toEqual([
      [234, false], [null, false], [95, false], [null, false], [320, false], [320, false], [554, true]
    ]);
    expect(seriesStats(ds, r.from, r.to)).toMatchObject({ avg: 969 / 4, sum: 969, days: 4, missing: 2 });
    // B's 0 kcal day is a record, its days without one aren't 0s
    const b = foodSeries(s, 'B', TODAY);
    expect(seriesStats(b, r.from, r.to)).toMatchObject({ avg: 0, sum: 0, days: 1, missing: 1 });
    expect(seriesBuckets(b, r).map((x) => x.goal)).toEqual(Array(7).fill(2000));
  });

  it('3か月 and 1年: each bucket the daily average of its days with a record, today out; before the first meal nothing', () => {
    const ds = foodSeries(s, 'A', TODAY);
    const q = seriesBuckets(ds, rangeFor('quarter', TODAY));
    expect(q).toHaveLength(13);
    expect(q.at(-1)).toMatchObject({ v: 969 / 4, days: 4, today: false });
    expect(q.slice(0, -1).every((x) => x.v === null && x.days === 0)).toBe(true);
    const y = seriesBuckets(ds, rangeFor('year', TODAY));
    expect(y.slice(-2).map((x) => [x.v, x.days])).toEqual([[(234 + 95) / 2, 2], [320, 2]]);
    const yr = rangeFor('year', TODAY);
    expect(seriesStats(ds, yr.from, yr.to)).toMatchObject({ avg: 969 / 4, sum: 969, days: 4, missing: 2 });
  });
});

describe('recipes: everyone’s, with totals and a serving’s', () => {
  const rec = (who: 'A' | 'B' | 'G', id: string, at: number, extra: object = {}) =>
    ev(who, at, { id, at, n: '納豆ごはん', sv: 2, it: [{ g: 300, f: RICE }, { g: 90, f: NATTO }], ...extra }, 'food_recipe');

  it('folds the ops (contract/food.ts foodRecipeFold: an edit, a removal), the latest changed first, each with its owner', () => {
    const rows = {
      metrics: [] as MetricRow[],
      events: [
        rec('A', 'crec0001', T),
        rec('B', 'crec0002', T + 1000),
        rec('A', 'crec0001', T + 2000, { sv: 3 }), // edited
        rec('G', 'crec0003', T + 4000),
        ev('B', T + 5000, { id: 'crec0002', at: T + 5000, rm: true }, 'food_recipe'), // removed
        rec('A', 'crec0004', T + 6000, { sv: 0 }) // malformed: ignored
      ]
    };
    const s = reduce(rows);
    expect(recipes(s).map((r) => [r.id, r.who, r.sv])).toEqual([['crec0003', 'G', 2], ['crec0001', 'A', 3]]);
    expect(recipes(s)).toBe(recipes(s)); // memoised
    // the guest's phone gets every recipe too
    expect(recipes(reduce(guestRows(rows))).map((r) => r.id)).toEqual(['crec0003', 'crec0001']);
  });

  it('adds up a recipe and one serving of it; a nutrient no ingredient knows is null', () => {
    const s = reduce({ metrics: [], events: [rec('A', 'crec0010', T), rec('A', 'crec0011', T + 1000, { sv: 1, it: [{ g: 50, f: NATTO }] })] });
    const [one, pot] = recipes(s);
    // 156 × 3 + 190 × 0.9 = 639; salt: rice's 0, natto's unknown
    expect(pot.total).toEqual({ g: 390, kcal: 639, p: 22.4, fa: 9.9, c: 122.2, s: 0 });
    expect(pot.per).toEqual({ g: 195, kcal: 320, p: 11.2, fa: 5, c: 61.1, s: 0 });
    expect(one.total).toMatchObject({ g: 50, kcal: 95, s: null });
  });

  it('shows a queued op at once (foldEvents)', () => {
    const base = reduce({ metrics: [], events: [rec('A', 'crec0020', T)] });
    const s = foldEvents(base, [rec('A', 'crec0020', T + 1000, { n: '朝の納豆ごはん' }), rec('B', 'crec0021', T + 2000)], null)!;
    expect(recipes(s).map((r) => [r.id, r.n])).toEqual([['crec0021', '納豆ごはん'], ['crec0020', '朝の納豆ごはん']]);
    expect(recipes(base).map((r) => r.n)).toEqual(['納豆ごはん']);
  });
});
