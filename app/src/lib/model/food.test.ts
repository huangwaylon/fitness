import { describe, expect, it } from 'vitest';
import { foldEvents, reduce } from './state.ts';
import { copySources, customs, foodDay, foodEntries, foodGoal, foodSeries, foodWeek, mealItems, mealProtein, pfcShare, proteinDefault, recipes, repeatOn, repeats, setGoal } from './food.ts';
import { mealProteinTarget } from './profile.ts';
import { rangeFor, seriesBuckets, seriesStats } from './health.ts';
import { addDays } from '#lib/time/dates.ts';
import { guestRows } from '#lib/contract/guest.ts';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import { customPortions, customSnap, foodFold, foodOp } from '#lib/contract/food.ts';
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
    expect(foodDay(s, 'G', '2026-11-03')).toEqual({ entries: [], kcal: 0, p: 0, fa: 0, c: 0, s: 0, fi: null, al: 0 });
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

describe('the goals: as set, and protein\'s default', () => {
  const pref = (who: 'A' | 'B' | 'G', at: number, data: object) => ev(who, at, data, 'pref');
  it('setGoal: the latest valid pref (a member’s for either, the guest’s own), null cleared or unset', () => {
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
    expect([setGoal(s, 'A', 'k'), setGoal(s, 'B', 'k'), setGoal(s, 'G', 'k')]).toEqual([1800, null, 2200]);
  });

  it('the nutrient goals: each its own pref, in its range and step (salt by 0.5 g), cleared by null', () => {
    const s = reduce({
      metrics: [],
      events: [
        pref('A', T, { key: 'proteinGoal', value: 120 }),
        pref('A', T + 1000, { key: 'proteinGoal', value: 121 }), // not a whole 5: ignored
        pref('B', T + 2000, { person: 'A', key: 'saltGoal', value: 7.5 }),
        pref('A', T + 3000, { key: 'fatGoal', value: 60 }),
        pref('A', T + 4000, { key: 'fatGoal', value: null }),
        pref('G', T + 5000, { key: 'carbsGoal', value: 250 })
      ]
    });
    expect((['p', 'fa', 'c', 's'] as const).map((n) => setGoal(s, 'A', n))).toEqual([120, null, null, 7.5]);
    expect(setGoal(s, 'G', 'c')).toBe(250);
    expect(foodGoal(s, 'A', 'p', T)).toBe(120); // as set, over the default
  });

  it('proteinDefault: 1.6 g per kg of the latest weigh-in, members only; foodGoal falls back to it, the rest to none', () => {
    const metrics: MetricRow[] = [
      ['2026-11-01T22:00:00.000Z', 'A', '2026-11-02', 'weight', 70],
      ['2026-11-02T22:00:00.000Z', 'A', '2026-11-03', 'weight', 68.4]
    ];
    const s = reduce({ metrics, events: [] });
    expect(proteinDefault(s, 'A', T)).toBe(109);
    expect(proteinDefault(s, 'A', Date.parse('2026-11-02T03:00:00.000Z'))).toBe(112);
    expect(proteinDefault(s, 'B', T)).toBeNull();
    expect(proteinDefault(s, 'G', T)).toBeNull();
    expect((['k', 'p', 'fa', 'c', 's'] as const).map((n) => foodGoal(s, 'A', n, T))).toEqual([null, 109, null, null, null]);
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
  const events = [
    set('A', 'fmeal100', T, { d: '2026-10-28' }),
    set('A', 'fmeal101', T, { d: '2026-10-30', f: NATTO, g: 50 }),
    ev('A', T, { id: 'rmeal100', at: T, m: 'b', it: [{ g: 150, f: RICE }, { g: 45, f: NATTO }], w: 127, from: '2026-11-01' }, 'food_repeat'),
    set('A', 'fmeal102', T, { d: TODAY, m: 'l' }),
    set('A', 'fmeal103', T, { d: '2026-11-02', m: 's', f: WATER, g: 200 }),
    set('B', 'fmeal104', T, { d: '2026-11-01', f: WATER, g: 200 }),
    ev('B', T, { key: 'kcalGoal', value: 2000 }, 'pref')
  ];
  const s = reduce({ metrics: [], events });

  it('a day’s total from foodDay (repeats included) from the first meal to today; nothing logged is null, 0 kcal is a record', () => {
    const ds = foodSeries(s, 'A', TODAY);
    expect(ds).toMatchObject({ from: '2026-10-28', to: TODAY, first: '2026-10-28', vals: [234, null, 95, null, 320, 320, 554] });
    expect(ds.goal(0)).toBeNull();
    expect(foodSeries(s, 'A', TODAY).vals).toBe(ds.vals); // memoised
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

  it('a nutrient\'s series: its grams per day as foodDay has them (one decimal), the same days; its goal as set', () => {
    for (const n of ['p', 'fa', 'c', 's'] as const) {
      const ds = foodSeries(s, 'A', TODAY, n);
      expect(ds.from).toBe('2026-10-28');
      ds.vals.forEach((v, i) => {
        const day = foodDay(s, 'A', addDays(ds.from, i));
        expect(v, `${n} ${i}`).toBe(day.entries.length ? day[n] : null);
      });
      expect(ds.goal(0)).toBeNull();
    }
    const withGoal = reduce({ metrics: [], events: [...events, ev('A', T + 1, { key: 'saltGoal', value: 6.5 }, 'pref')] });
    expect(foodSeries(withGoal, 'A', TODAY, 's').goal(0)).toBe(6.5);
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

describe('customs: everyone’s custom foods', () => {
  const cus = (who: 'A' | 'B' | 'G', id: string, at: number, extra: object = {}) =>
    ev(who, at, { id, at, n: '会社の弁当', u: '1個', k: 650, ...extra }, 'food_custom');

  it('keeps the rows raw in reduce; folds them when read (an edit, a removal, someone else’s op), the latest changed first', () => {
    const rows = {
      metrics: [] as MetricRow[],
      events: [
        cus('A', 'mcus0001', T),
        cus('B', 'mcus0002', T + 1000, { n: 'おにぎり', g: 110, k: 180 }),
        cus('A', 'mcus0001', T + 2000, { k: 700 }), // edited
        cus('B', 'mcus0001', T + 2500, { k: 1 }), // not B's: refused
        cus('G', 'mcus0003', T + 4000, { n: 'ゲスト弁当' }),
        ev('B', T + 5000, { id: 'mcus0002', at: T + 5000, rm: true }, 'food_custom'), // removed
        cus('A', 'mcus0004', T + 6000, { k: -1 }), // malformed: ignored
        ev('A', T + 7000, { id: 'mcus0005', at: T + 7000, n: '弁当', u: '1個', k: 1, person: 'B' }, 'food_custom') // a `person`: ignored
      ]
    };
    const s = reduce(rows);
    expect(s.foodCustom).toHaveLength(rows.events.length); // raw, as given
    expect(customs(s).map((c) => [c.id, c.who, c.k])).toEqual([['mcus0003', 'G', 650], ['mcus0001', 'A', 700]]);
    expect(customs(s)).toBe(customs(s)); // memoised
    expect(customs(reduce(guestRows(rows))).map((c) => c.id)).toEqual(['mcus0003', 'mcus0001']);
  });

  it('shows a queued op at once (foldEvents); logged, an ordinary entry that an edit never changes', () => {
    const base = reduce({ metrics: [], events: [cus('A', 'mcus0010', T)] });
    const s = foldEvents(base, [cus('A', 'mcus0010', T + 1000, { n: '弁当' }), cus('B', 'mcus0011', T + 2000, { n: 'おにぎり', g: 110, k: 180 })], null)!;
    expect(customs(s).map((c) => [c.id, c.n])).toEqual([['mcus0011', 'おにぎり'], ['mcus0010', '弁当']]);
    expect(customs(base).map((c) => c.n)).toEqual(['会社の弁当']);
    const [onigiri, bento] = customs(s);
    const logged = foldEvents(s, [
      set('G', 'fcus0001', T + 3000, { g: customPortions(bento)[0].g * 1.5, f: customSnap(bento, '1個') }),
      set('G', 'fcus0002', T + 3001, { g: 110, f: customSnap(onigiri, '1個') }),
      cus('A', 'mcus0010', T + 4000, { k: 2000 })
    ], null)!;
    expect(foodDay(logged, 'G', '2026-11-03')).toMatchObject({ kcal: 975 + 180 });
    expect(foodDay(logged, 'G', '2026-11-03').entries.map((e) => e.f.sv)).toEqual([true, undefined]);
  });
});


describe('the balance views: a meal’s protein, the share of energy, a week’s average', () => {
  const BROC = { id: 'mext:06263', n: 'ブロッコリー', k: 37, p: 5.4, fa: 0.6, c: 6.6, s: 0, fi: 5.1 };
  const BEER = { id: 'mext:16006', n: 'ビール', k: 39, p: 0.3, fa: 0, c: 3.1, s: 0, fi: 0, al: 3.7 };
  it('a meal’s protein (an unknown one as none) and the per-meal target: a third of the day’s, at least 20; none: 25', () => {
    expect([
      mealProtein([{ g: 150, f: RICE }, { g: 50, f: NATTO }, { g: 100, f: { ...RICE, p: null } }]), mealProtein([]),
      mealProteinTarget(null), mealProteinTarget(111), mealProteinTarget(45), mealProteinTarget(60)
    ]).toEqual([12, 0, 25, 37, 20, 20]);
  });
  it('protein, fat and carbs as shares of energy (4/9/4, alcohol 7 its own share), each against the DRI’s range', () => {
    const r = (x: ReturnType<typeof pfcShare>) => x && { p: Math.round(x.p), fa: Math.round(x.fa), c: Math.round(x.c), al: Math.round(x.al), at: x.at };
    expect([
      r(pfcShare({ p: 30, fa: 20, c: 100 })), r(pfcShare({ p: 30, fa: 20, c: 100, al: 20 })), r(pfcShare({ p: 10, fa: 40, c: 50 })),
      pfcShare({ p: 0, fa: 0, c: 0 }), pfcShare({ p: 0, fa: 0, c: 0, al: 10 })?.al
    ]).toEqual([
      { p: 17, fa: 26, c: 57, al: 0, at: { p: 0, fa: 0, c: 0 } },
      { p: 14, fa: 21, c: 48, al: 17, at: { p: 0, fa: 0, c: -1 } },
      { p: 7, fa: 60, c: 33, al: 0, at: { p: -1, fa: 1, c: -1 } },
      null, 100
    ]);
  });
  it('a week’s average: the 7 days to the end given, a day with nothing logged left out, fibre over the days that know it', () => {
    const day = (who: 'A' | 'B', id: string, d: string, f: object, g: number) => ev(who, T, { id, at: T, d, m: 'l', g, f });
    const s = reduce({
      metrics: [],
      events: [
        day('A', 'fwk00001', '2026-10-27', RICE, 500), // the day before the week: out
        day('A', 'fwk00002', '2026-10-28', RICE, 200),
        day('A', 'fwk00003', '2026-11-01', BROC, 200), day('A', 'fwk00004', '2026-11-01', BEER, 200),
        day('A', 'fwk00005', '2026-11-04', RICE, 500), // after its end: out
        day('B', 'fwk00006', '2026-11-01', RICE, 900)
      ]
    });
    // 10-28: 312 kcal, P 5, F 0.6, C 74.2, no fibre known; 11-01: 152 kcal, P 11.4, F 1.2, C 19.4, fibre 10.2, alcohol 7.4
    expect([foodWeek(s, 'A', '2026-11-03'), foodWeek(s, 'A', '2026-10-26'), foodWeek(s, 'B', '2026-11-03')?.days]).toEqual([
      { from: '2026-10-28', to: '2026-11-03', days: 2, kcal: 232, p: 8.2, fa: 0.9, c: 46.8, s: 0, fi: 10.2, al: 3.7 }, null, 1
    ]);
  });
});

describe('copying a meal: mealItems and copySources (きのうと おなじ, 〇〇と おなじ)', () => {
  const rep = (who: 'A' | 'B' | 'G', id: string, at: number) =>
    ev(who, at, { id, at, m: 'l', it: [{ g: 100, f: NATTO }], w: 127, from: '2026-11-01' }, 'food_repeat');
  const s = reduce({
    metrics: [],
    events: [
      set('A', 'fcopy001', T, { d: '2026-11-02', m: 'b' }), // my day before's breakfast
      set('A', 'fcopy002', T + 1, { d: '2026-11-02', m: 'b', f: NATTO, g: 45 }),
      set('A', 'fcopy003', T + 2, { d: '2026-11-01', m: 'd' }), // two days back: not offered
      set('B', 'fcopy004', T + 3, { d: '2026-11-03', m: 'b', g: 200 }), // the partner's same day
      set('B', 'fcopy005', T + 4, { d: '2026-11-02', m: 'd' }), // the partner's day before: not offered
      set('G', 'fcopy006', T + 5, { d: '2026-11-03', m: 'd', g: 120 }), // the guest's dinner
      rep('B', 'rcopy001', T + 6) // the partner's lunch, a いつもの
    ]
  });
  const offer = (me: 'A' | 'B' | 'G', others: ('A' | 'B' | 'G')[], meal: 'b' | 'l' | 'd' | 's') =>
    copySources(s, me, others, '2026-11-03', meal).map((c) => [c.who, c.date, c.items.map((x) => `${x.f.n} ${x.g}`)]);

  it('offers my own meal of the day before, then each other person’s of the same day (a いつもの’s too), only those with something', () => {
    expect([offer('A', ['B', 'G'], 'b'), offer('A', ['B', 'G'], 'l'), offer('A', ['B', 'G'], 'd'), offer('A', ['B', 'G'], 's')]).toEqual([
      [['A', '2026-11-02', ['ごはん 150', '納豆 45']], ['B', '2026-11-03', ['ごはん 200']]],
      [['B', '2026-11-03', ['納豆 100']]],
      [['G', '2026-11-03', ['ごはん 120']]],
      []
    ]);
    // the guest's phone: the members' meals too (everyone sees every meal); me among `others` is skipped
    expect(offer('G', ['A', 'B', 'G'], 'b')).toEqual([['B', '2026-11-03', ['ごはん 200']]]);
    expect(mealItems(s, 'B', '2026-11-04', 'l')).toEqual([{ g: 100, f: NATTO }]); // a repeat's day: its items
  });
});

