// 体重のペース (model/pace.ts): the trend's window and minimum, Theil–Sen against a spike, the line, each state with its
// hysteresis, keep and gain, drawn on the rate as shown, the line without lag, the 速め window, the ETA's month, the progress, the streak, stale, the calculation, the guest.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { addDays } from '#lib/time/dates.ts';
import { inbodyBmr } from '#lib/contract/bodyEst.ts';
import { reduce } from './state.ts';
import { weighIns } from './weight.ts';
import { paceOf, PACE, rateShown, smoothLine, stateOf, streakOf, theilSen, weightLine } from './pace.ts';

// Made-up people only. Today: Saturday 2026-11-21, noon in Tokyo.
const TODAY = '2026-11-21';
const T = Date.parse('2026-11-21T03:00:00.000Z');
const DAY = 86_400_000;
const day = (k: number) => addDays(TODAY, k);
/** A row of day k (07:00 Tokyo). */
const metric = (p: PersonId, k: number, m: MetricRow[3], v: number): MetricRow => [`${day(k - 1)}T22:00:00.000Z`, p, day(k), m, v];
let n = 0;
/** An event of day k (21:00 Tokyo). */
const ev = (p: PersonId | 'G', k: number, type: EventRow[3], data: object): EventRow => [`${day(k)}T12:00:00.000Z`, p, `p${++n}`, type, JSON.stringify(data)];
const goalRow = (p: PersonId, k: number, kg: number) => ev(p, k, 'pref', { key: 'goalWeight', value: kg });
/** Weigh-ins from day `from` to `to` on a straight line: `kg` today, `rate` kg a week. */
const line = (p: PersonId, from: number, to: number, kg: number, rate: number, every = 1): MetricRow[] => {
  const out: MetricRow[] = [];
  for (let k = from; k <= to; k += every) out.push(metric(p, k, 'weight', Math.round((kg + (rate * k) / 7) * 1000) / 1000));
  return out;
};
/** A's pace on a straight line (daily from day −59: past the 速め window) with a goal set on day −60. */
const paceOn = (kg: number, rate: number, goal: number, opts: { from?: number; goalAt?: number; t?: number } = {}) =>
  paceOf(reduce({ metrics: line('A', opts.from ?? -59, 0, kg, rate), events: [goalRow('A', opts.goalAt ?? -60, goal)] }), 'A', opts.t ?? T)!;

describe('the trend: Theil–Sen over the window', () => {
  it('a spike moves the slope and the weight little (a least-squares line would follow it)', () => {
    const ws = Array.from({ length: 10 }, (_, i) => ({ date: day(i - 9), kg: 70 - 0.05 * (i - 9) }));
    ws[4] = { ...ws[4], kg: ws[4].kg + 3 }; // a salty dinner's morning
    const fit = theilSen(ws, TODAY);
    expect(fit.rate).toBeCloseTo(-0.35, 6);
    expect(fit.kg).toBeCloseTo(70, 6);
  });

  it(`needs ${PACE.minWeighIns} weigh-ins spanning ${PACE.minSpan} days in the last ${PACE.window}; older ones don't count`, () => {
    const at = (metrics: MetricRow[]) => paceOf(reduce({ metrics, events: [goalRow('A', -60, 60)] }), 'A', T)!;
    const seven = at(line('A', -18, 0, 70, -0.5, 3)); // 7 weigh-ins over 18 days
    const short = at(line('A', -9, 0, 70, -0.5)); // 10 over 9 days
    const old = at([...line('A', -60, -28, 70, -0.5), ...line('A', -18, 0, 70, -0.5, 3)]); // day −28 is out of the window
    const enough = at(line('A', -21, 0, 70, -0.7, 3)); // 8 over 21 days (0.1 kg a day: the record keeps one decimal)
    expect([seven, short, old, enough].map((p) => [p.rate === null ? null : Math.round(p.rate * 100) / 100, p.need, p.state]))
      .toEqual([[null, { n: 1, unit: 'weighIns' }, null], [null, { n: 5, unit: 'days' }, null], [null, { n: 1, unit: 'weighIns' }, null], [-0.7, null, 'on']]);
  });

  it('the line: a local linear fit, no lag on a steady loss (its mean residual ≈ 0, the last week’s too); one weigh-in its own', () => {
    // −0.4 kg a week with day-to-day water (±0.4, the record's one decimal)
    const metrics = Array.from({ length: 60 }, (_, i) => metric('A', i - 59, 'weight', Math.round((72 - (0.4 * (i - 59)) / 7 + [0.4, -0.3, 0.1, -0.2, 0.3, -0.4, 0.1][i % 7]) * 10) / 10));
    const s = reduce({ metrics, events: [goalRow('A', -90, 66)] });
    const ws = weighIns(s, 'A', T), l = weightLine(s, 'A', T);
    const mean = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
    const res = ws.map((w, i) => w.kg - l[i].kg);
    expect(l).toEqual(smoothLine(ws));
    expect(Math.abs(mean(res))).toBeLessThan(0.03);
    expect(Math.abs(mean(res.slice(-7)))).toBeLessThan(0.1); // 1週: through the middle of the dots, not above them
    // the projection: from the line's end (no step), to the Theil–Sen forecast; the two ends near each other
    const p = paceOf(s, 'A', T)!;
    expect(p.ahead!.from).toEqual(l.at(-1));
    expect(p.ahead!.to.kg).toBeCloseTo(p.kg! + (p.rate! * 28) / 7, 9);
    expect(Math.abs(p.kg! - l.at(-1)!.kg)).toBeLessThan(0.15);
    expect(smoothLine([{ date: TODAY, kg: 70 }])).toEqual([{ date: TODAY, kg: 70 }]);
    expect(smoothLine([])).toEqual([]);
    // a straight line is its own fit, ends included
    const straight = Array.from({ length: 30 }, (_, i) => ({ date: day(i - 29), kg: 80 - 0.05 * i }));
    smoothLine(straight).forEach((w, i) => expect(w.kg).toBeCloseTo(straight[i].kg, 9));
  });
});

describe('the state', () => {
  it('losing: 順調 from 0.2 kg a week, 横ばい under it, 離れ from 0.15 away; 速め past 1 % of W a week', () => {
    expect([-0.5, -0.2, -0.12, 0.1, 0.25, 0.3, -0.9, -0.7].map((r) => paceOn(80, r, 70).state))
      .toEqual(['on', 'on', 'flat', 'flat', 'away', 'away', 'fast', 'on']);
  });

  it('gaining: the same lines toward the goal, never 速め', () => {
    expect([0.3, 1.2, 0.1, -0.2].map((r) => paceOn(50, r, 55).state)).toEqual(['on', 'on', 'flat', 'away']);
  });

  it('inside the goal’s ±1.5 %: キープ under 0.15 kg a week, else a drift up or down', () => {
    expect([0.1, 0.3, -0.3].map((r) => { const p = paceOn(70, r, 70.5); return [p.state, p.drift, p.progress]; }))
      .toEqual([['keep', null, null], ['drift', 'up', null], ['drift', 'down', null]]);
    expect(stateOf(70, -0.14, 70.5, true)).toBe('keep');
  });

  it('drawn on the rate as the card prints it (one decimal, half away from zero): −0.2 shown toward the goal is 順調', () => {
    expect([-0.16, -0.149, 0.149, 0.15, -0.84, -0.86].map((r) => [rateShown(r), stateOf(80, r, 70, true)])).toEqual([
      [-0.2, 'on'], [-0.1, 'flat'], [0.1, 'flat'], [0.2, 'away'], [-0.8, 'on'], [-0.9, 'fast'] // 速め: over 0.8 (1 % of 80)
    ]);
    expect([stateOf(70, 0.149, 70.5, true), stateOf(70, 0.15, 70.5, true), stateOf(70, -0.15, 70.5, true)]).toEqual(['keep', 'drift', 'drift']);
    expect([rateShown(-0.15), rateShown(0.04), rateShown(-0.04)]).toEqual([-0.2, 0, -0]);
  });

  it(`no 速め in the first ${PACE.fastAfter} days of the goal or of the weigh-ins`, () => {
    expect([
      paceOn(80, -1, 70).state, paceOn(80, -1, 70, { goalAt: -20 }).state, paceOn(80, -1, 70, { goalAt: -21 }).state, paceOn(80, -1, 70, { goalAt: -22 }).state,
      paceOn(80, -1, 70, { from: -21 }).state, paceOn(80, -1, 70, { from: -22 }).state
    ]).toEqual(['fast', 'on', 'on', 'fast', 'on', 'fast']); // day 21 is today's, not yesterday's: it shows a day on
  });

  it('a new state shows once it holds on two days: yesterday’s stays until then', () => {
    // −0.5 kg a week into the band (70 ± 1.05): yesterday's W 71.07 was outside it (順調), today's 71.0 inside (a drift)
    const s = reduce({ metrics: line('A', -59, 1, 71, -0.5), events: [goalRow('A', -60, 70)] });
    const today = paceOf(s, 'A', T)!, tomorrow = paceOf(s, 'A', T + DAY)!;
    expect([today.state, today.drift, tomorrow.state, tomorrow.drift]).toEqual(['on', null, 'drift', 'down']);
    // held whole: yesterday's weight outside the band, so its progress and ETA; tomorrow inside, neither
    expect([today.kg! > 71.05, today.progress !== null, today.eta !== null, tomorrow.progress, tomorrow.eta]).toEqual([true, true, true, null, null]);
  });

  it('none without a goal, for the guest, or with no weigh-in for 14 days (the last one’s day said)', () => {
    const stale = reduce({ metrics: line('A', -40, -14, 70, -0.5), events: [goalRow('A', -60, 60)] });
    const fresh = reduce({ metrics: line('A', -40, -13, 70, -0.5), events: [goalRow('A', -60, 60)] });
    const none = reduce({ metrics: line('A', -40, 0, 70, -0.5), events: [] });
    expect({
      stale: [paceOf(stale, 'A', T)!.state, paceOf(stale, 'A', T)!.stale, paceOf(stale, 'A', T)!.last],
      fresh: [paceOf(fresh, 'A', T)!.state, paceOf(fresh, 'A', T)!.stale],
      none: [paceOf(none, 'A', T)!.state, paceOf(none, 'A', T)!.goal, paceOf(none, 'A', T)!.progress, Math.round(paceOf(none, 'A', T)!.rate! * 100) / 100],
      guest: paceOf(fresh, 'G', T),
      empty: paceOf(reduce({ metrics: [], events: [] }), 'B', T)
    }).toEqual({
      stale: [null, true, day(-14)],
      fresh: ['on', false],
      none: [null, null, null, -0.5],
      guest: null,
      empty: { goal: null, last: null, stale: false, kg: null, rate: null, need: { n: PACE.minWeighIns, unit: 'weighIns' }, calc: { rate: null, days: 0 }, state: null, drift: null, eta: null, progress: null, streak: 0, ahead: null }
    });
  });
});

describe('the ETA, the projection, the progress', () => {
  it('順調 and 速め: the day W reaches the goal at r, within 52 weeks (else far); none for the others', () => {
    const on = paceOn(80, -0.5, 70), fast = paceOn(80, -1, 70), far = paceOn(100, -0.3, 60), flat = paceOn(80, -0.1, 70);
    // 10 kg at 0.5 a week: 20 weeks, 140 days → April; at 1 kg a week 70 days → January
    expect([on.eta, fast.eta, far.eta, flat.eta]).toEqual([day(140), day(70), 'far', null]);
    expect([on.eta, fast.eta].map((d) => (d as string).slice(0, 7))).toEqual(['2027-04', '2027-01']);
  });

  it(`the projection: from the line's end to ${PACE.ahead} days on at r, or to the goal when nearer; none without a verdict`, () => {
    const on = paceOn(80, -0.5, 70), near = paceOn(71.5, -0.5, 70), flat = paceOn(80, -0.1, 70);
    const r = (a: typeof on.ahead) => a && [a.from.date, Math.round(a.from.kg * 10) / 10, a.to.date, Math.round(a.to.kg * 100) / 100];
    expect([r(on.ahead), r(near.ahead), r(flat.ahead), paceOn(80, -0.5, 70, { from: -10 }).ahead])
      .toEqual([[TODAY, 80, day(28), 78], [TODAY, 71.5, day(21), 70], [TODAY, 80, day(28), 79.6], null]);
  });

  it('the progress: from the line on the record’s goalWeightFrom (a later change keeps it), until it’s written the goal’s own day, else the first weigh-in', () => {
    const metrics = line('A', -59, 0, 76, -0.5), from = ev('B', -30, 'pref', { key: 'goalWeightFrom', value: day(-30), person: 'A' });
    const s = reduce({ metrics, events: [goalRow('A', -30, 75), from, goalRow('A', -5, 70)] });
    const p = paceOf(s, 'A', T)!, l = weightLine(s, 'A', T), at = (k: number) => l.find((w) => w.date === day(k))!.kg, start = at(-30);
    expect(p.progress).toEqual({ start, done: p.kg! - start, left: p.kg! - 70, share: (start - p.kg!) / (start - 70) });
    expect([Math.round(p.kg! * 100) / 100, p.progress!.share > 0 && p.progress!.share < 1]).toEqual([76, true]);
    // not written yet (a goal from before the key): the current goal's day, what a phone backfills
    const unwritten = reduce({ metrics, events: [goalRow('A', -30, 75), goalRow('A', -5, 70)] });
    expect([paceOf(unwritten, 'A', T)!.progress!.start, unwritten.prefs.A.goalWeightSet, unwritten.prefs.A.goalWeightFrom]).toEqual([at(-5), day(-5), undefined]);
    // cleared (null) with the goal; before the first weigh-in: the line's first point
    const cleared = reduce({ metrics, events: [goalRow('A', -30, 75), from, ev('A', -6, 'pref', { key: 'goalWeightFrom', value: null }), goalRow('A', -5, 70)] });
    expect(paceOf(cleared, 'A', T)!.progress!.start).toBe(at(-5));
    expect(paceOf(reduce({ metrics, events: [goalRow('A', -90, 70)] }), 'A', T)!.progress!.start).toBe(l[0].kg);
  });
});

describe('the streak', () => {
  // the line by hand: Sundays end the weeks (10-18, 10-25, 11-01, 11-08, 11-15); this week (from 11-16) isn't finished
  const l = [
    { date: '2026-10-11', kg: 80 }, { date: '2026-10-14', kg: 80.02 }, // week of 10-12: the wrong way
    { date: '2026-10-20', kg: 79.9 }, // 10-19: −0.12
    // 10-26: no weigh-in, passed over
    { date: '2026-11-05', kg: 79.8 }, { date: '2026-11-12', kg: 79.7 }, // 11-02, 11-09: −0.1 each
    { date: '2026-11-18', kg: 79 } // this week
  ];
  it('finished weeks in a row toward the goal by 0.05 kg; a week without a weigh-in neither counts nor breaks', () => {
    expect([streakOf(l, 70, TODAY), streakOf(l.slice(0, 5), 70, TODAY), streakOf([...l.slice(0, 4), { date: '2026-11-12', kg: 79.77 }], 70, TODAY)]).toEqual([3, 3, 0]);
  });
  it('inside the band: each week that stayed in it; none for a goal the other way', () => {
    expect([streakOf(l, 79.75, TODAY), streakOf(l, 90, TODAY), streakOf([], 70, TODAY)]).toEqual([4, 0, 0]);
  });
});

describe('the calculation (計算, the ⓘ)', () => {
  /** Two main meals of `kcal` in all on day k (500 kcal a 100 g). */
  const meals = (p: PersonId, k: number, kcal: number, ms: ('b' | 'l' | 'd')[] = ['l', 'd']) => ms.map((m, i) => {
    const id = `fp${String(++n).padStart(6, '0')}`, at = Date.parse(`${day(k)}T03:00:00.000Z`) + i;
    return ev(p, k, 'food', { id, at, d: day(k), m, g: kcal / ms.length / 5, f: { id: 'mext:x', n: 'テスト', k: 500, p: 10, fa: 10, c: 50, s: 1 } });
  }).filter(Boolean);
  const lean = 50, bmr = inbodyBmr(lean); // 1,450
  const base = [metric('A', -3, 'lean_kg', lean), ...line('A', -2, 0, 70, 0)];
  const moves = (ks: number[], kcal = 500) => ks.map((k) => metric('A', k, 'move_kcal', kcal));

  it('the complete days of the last 7 (two meals, the Watch worn, enough eaten): (BMR + Move − intake) ÷ 7,200 a week', () => {
    const s = reduce({
      metrics: [...base, ...moves([-1, -2, -3, -4, -5, -6, 0]), metric('A', -7, 'move_kcal', 0)],
      events: [
        ...[-1, -2, -3, -4].flatMap((k) => meals('A', k, 1450)),
        ...meals('A', -5, 700), // under max(800, 0.6 × BMR): left out
        ...meals('A', -6, 1450, ['l']), // one meal: not a recorded day
        ...meals('A', -7, 1450), // no Watch
        ...meals('A', 0, 4000) // today: not yet
      ]
    });
    const p = paceOf(s, 'A', T)!;
    expect([p.calc.days, p.rate, p.state]).toEqual([4, null, null]);
    expect(p.calc.rate).toBeCloseTo((-(bmr + 500 - 1450) * 7) / 7200, 9);
  });

  it(`fewer than ${PACE.minDays} complete days: none (the days counted); Move clipped to 1.2–2.2 × BMR`, () => {
    const few = reduce({ metrics: [...base, ...moves([-1, -2, -3])], events: [-1, -2, -3].flatMap((k) => meals('A', k, 1500)) });
    const big = reduce({ metrics: [...base, ...moves([-1, -2, -3, -4], 5000)], events: [-1, -2, -3, -4].flatMap((k) => meals('A', k, 2000)) });
    expect(paceOf(few, 'A', T)!.calc).toEqual({ rate: null, days: 3 });
    expect(paceOf(big, 'A', T)!.calc.rate).toBeCloseTo((-(2.2 * bmr - 2000) * 7) / 7200, 9);
  });
});
