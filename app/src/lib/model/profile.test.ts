import { describe, expect, it } from 'vitest';
import { reduce } from './state.ts';
import { foodGoal, proteinDefault } from './food.ts';
import { activeKcal, ageAt, ageOn, bmiCategory, energyOf, heightCm, heightFrom, kcalDefault, lowKcal, mifflinStJeor, PAL_FALLBACK, profileOf, saltDefault, fibreDefault, fibreTarget } from './profile.ts';
import { addDays } from '#lib/time/dates.ts';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import { isBirth, latestBirth, PROFILE_KEYS } from '#lib/contract/profile.ts';
import { PREF_KEYS, PROFILE_PREF_KEYS } from '#lib/contract/api.ts';
import { GOALS } from '#lib/contract/goals.ts';

// Made-up people only (the real profiles live on the record, never here).
const T = Date.parse('2026-11-03T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-03
let n = 0;
const pref = (who: 'A' | 'B' | 'G', at: number, data: object): EventRow => [new Date(at).toISOString(), who, `e${++n}`, 'pref', JSON.stringify(data)];
const at = (date: string) => `${addDays(date, -1)}T22:00:00.000Z`; // 07:00 Tokyo that day
const m = (p: 'A' | 'B', date: string, metric: MetricRow[3], v: number): MetricRow => [at(date), p, date, metric, v];
/** `days` days of Move before 2026-11-03, `kcal` each. */
const moves = (p: 'A' | 'B', days: number, kcal: number) => Array.from({ length: days }, (_, i) => m(p, addDays('2026-11-03', -1 - i), 'move_kcal', kcal));

describe('the profile: age, height, energy, the BMI category, the defaults', () => {
  it('ageOn: a year more on the birthday (the day before, on, after), a 29 February’s on 1 March; ageAt by the Tokyo day', () => {
    const got = [
      ageOn('1990-10-06', '2020-10-05'), ageOn('1990-10-06', '2020-10-06'), ageOn('1990-10-06', '2020-10-07'),
      ageOn('1990-10-06', '2021-01-01'), ageOn('2000-02-29', '2021-02-28'), ageOn('2000-02-29', '2021-03-01'), ageOn('2000-02-29', '2024-02-29'),
      ageOn('1990-01-01', '1990-01-01')
    ];
    const s = reduce({ metrics: [], events: [pref('A', T, { key: 'birth', value: '1990-11-03' })] });
    // 2026-11-02T15:00Z is 00:00 on 11-03 in Tokyo: the birthday has come there
    const tokyo = [ageAt(s, 'A', Date.parse('2026-11-02T14:59:00.000Z')), ageAt(s, 'A', Date.parse('2026-11-02T15:00:00.000Z')), ageAt(s, 'B', T)];
    expect({ got, tokyo }).toEqual({ got: [29, 30, 30, 30, 20, 21, 24, 0], tokyo: [35, 36, null] });
  });

  it('the contract’s literal key lists agree; the registry names the computed defaults', () => {
    expect({
      keys: [...PROFILE_PREF_KEYS], inPrefs: PROFILE_KEYS.every((k) => PREF_KEYS.includes(k)),
      derived: (['k', 'p', 'fa', 'c', 's'] as const).map((n) => GOALS[n].derived ?? null)
    }).toEqual({ keys: [...PROFILE_KEYS], inPrefs: true, derived: ['energy', 'protein', null, null, 'salt'] });
  });

  it('a birth date may be 1900 to 10 years before the day (a 29 February’s day: the 28th of that year)', () => {
    expect({
      latest: [latestBirth('2026-11-05'), latestBirth('2028-02-29')],
      ok: ['1900-01-01', '2016-11-05', '1999-02-28'].map((v) => isBirth(v, '2026-11-05')),
      no: ['1899-12-31', '2016-11-06', '1999-02-29', '2000-1-01', null].map((v) => isBirth(v, '2026-11-05'))
    }).toEqual({ latest: ['2016-11-05', '2018-02-28'], ok: [true, true, true], no: [false, false, false, false, false] });
  });

  it('Mifflin–St Jeor against its worked examples; the height from a weight and the BMI it came with', () => {
    expect({
      bmr: [mifflinStJeor('m', 80, 180, 30), mifflinStJeor('f', 60, 165, 25), mifflinStJeor('m', 70, 175, 40), mifflinStJeor('f', 55, 160, 50)],
      cm: [heightFrom(70, 22.9), heightFrom(52.3, 20.4), heightFrom(80, 24.7)]
    }).toEqual({ bmr: [1780, 1345.25, 1598.75, 1139], cm: [174.8, 160.1, 180] });
  });

  it('bmiCategory: asia (23, 25) against who (25, 30), 18.5 under in both', () => {
    const bmis = [18.4, 18.5, 22.9, 23, 24.9, 25, 29.9, 30];
    expect({ asia: bmis.map((b) => bmiCategory(b, 'asia')), who: bmis.map((b) => bmiCategory(b, 'who')) }).toEqual({
      asia: ['under', 'normal', 'normal', 'over', 'over', 'obese', 'obese', 'obese'],
      who: ['under', 'normal', 'normal', 'normal', 'normal', 'over', 'over', 'obese']
    });
  });

  it('reads the profile prefs (either member’s by either, cleared by null, a bad value ignored; the guest’s own)', () => {
    const s = reduce({
      metrics: [],
      events: [
        pref('A', T, { key: 'sex', value: 'm' }),
        pref('B', T + 1, { key: 'birth', value: '1990-05-12', person: 'A' }),
        pref('A', T + 2, { key: 'sex', value: 'x' }), // ignored: the previous stays
        pref('B', T + 3, { key: 'sex', value: 'f' }),
        pref('B', T + 4, { key: 'bmiStd', value: 'who' }),
        pref('B', T + 5, { key: 'bmiStd', value: null }),
        pref('G', T + 6, { key: 'sex', value: 'f' })
      ]
    });
    expect([profileOf(s, 'A'), profileOf(s, 'B'), profileOf(s, 'G')]).toEqual([
      { sex: 'm', birth: '1990-05-12', bmiStd: 'asia' },
      { sex: 'f', birth: null, bmiStd: 'asia' },
      { sex: 'f', birth: null, bmiStd: 'asia' }
    ]);
  });

  it('energy: the height from the latest day with both, the Move averaged (7+ days of the last 28), else × 1.4; the defaults', () => {
    const profile = [
      pref('A', T - 9e8, { key: 'sex', value: 'm' }), pref('A', T - 9e8, { key: 'birth', value: '1990-05-12' }),
      pref('B', T - 9e8, { key: 'sex', value: 'f' }), pref('B', T - 9e8, { key: 'birth', value: '1994-08-20' })
    ];
    const metrics: MetricRow[] = [
      m('A', '2026-10-20', 'weight', 72), m('A', '2026-10-20', 'bmi', 23.8),
      m('A', '2026-11-02', 'weight', 70), m('A', '2026-11-02', 'bmi', 22.9), m('A', '2026-11-03', 'weight', 69.6), // no BMI today
      m('B', '2026-11-01', 'weight', 52.3), m('B', '2026-11-01', 'bmi', 20.4),
      ...moves('A', 10, 500), ...moves('B', 6, 300)
    ];
    const s = reduce({ metrics, events: profile });
    const a = energyOf(s, 'A', T)!, b = energyOf(s, 'B', T)!;
    const bmrA = 10 * 69.6 + 6.25 * 174.8 - 5 * 36 + 5, bmrB = 10 * 52.3 + 6.25 * 160.1 - 5 * 32 - 161;
    const losing = reduce({ metrics, events: [...profile, pref('A', T - 1, { key: 'goalWeight', value: 65 })] });
    const set = reduce({ metrics, events: [...profile, pref('A', T - 1, { key: 'kcalGoal', value: 2600 }), pref('B', T - 1, { key: 'saltGoal', value: 8 })] });
    expect({
      cm: [heightCm(s, 'A', T), heightCm(s, 'B', T)],
      active: [activeKcal(s, 'A', T), activeKcal(s, 'B', T)],
      a, b: [b.bmr, b.tdee, b.active],
      kcal: [kcalDefault(s, 'A', T), kcalDefault(s, 'B', T), kcalDefault(losing, 'A', T)],
      salt: [saltDefault(s, 'A', T), saltDefault(s, 'B', T), saltDefault(s, 'G', T)],
      // fibre: the 目標量 by sex and age (A 36: 22; B: 18; the guest: no profile); alcohol 20 g for everyone until set
      fibre: [fibreDefault(s, 'A', T), fibreDefault(s, 'B', T), fibreDefault(s, 'G', T), foodGoal(s, 'B', 'fi', T)],
      fibreAges: [fibreTarget('m', 29), fibreTarget('m', 30), fibreTarget('m', 64), fibreTarget('m', 65), fibreTarget('m', null), fibreTarget('f', 40)],
      alcohol: [foodGoal(s, 'A', 'al', T), foodGoal(s, 'G', 'al', T), foodGoal(reduce({ metrics, events: [...profile, pref('A', T - 1, { key: 'alcoholGoal', value: 10 })] }), 'A', 'al', T)],
      // a goal that's set always wins over the default; none set: the default
      goals: [foodGoal(set, 'A', 'k', T), foodGoal(set, 'B', 's', T), foodGoal(set, 'B', 'k', T), foodGoal(s, 'A', 's', T), foodGoal(s, 'A', 'fa', T)],
      protein: [proteinDefault(s, 'A', T), proteinDefault(s, 'B', T)]
    }).toEqual({
      cm: [174.8, 160.1],
      active: [500, null],
      a: { kg: 69.6, cm: 174.8, age: 36, sex: 'm', bmr: Math.round(bmrA), tdee: Math.round(bmrA + 500), active: 500 },
      b: [Math.round(bmrB), Math.round(bmrB * PAL_FALLBACK), null],
      // A: the daily energy up to a 50 (2,114 → 2,150); B: 1,684 → 1,700; A losing: 2,114 × 0.85 = 1,797 → 1,800
      kcal: [2150, 1700, 1800],
      salt: [7.5, 6.5, null],
      fibre: [22, 18, null, 18],
      fibreAges: [20, 22, 22, 20, 20, 18],
      alcohol: [20, 20, 10],
      goals: [2600, 8, 1700, 7.5, null],
      // 1.6 g per kg (69.6 → 111), never under the 推奨量 (B: 84 over 50)
      protein: [111, 84]
    });
  });

  it('the TDEE’s Move: only days with the Watch worn (a 0/0/0 day is no data, not a day at rest; partial wear counts)', () => {
    const profile = [pref('A', T - 9e8, { key: 'sex', value: 'm' }), pref('A', T - 9e8, { key: 'birth', value: '1990-05-12' })];
    const body = [m('A', '2026-11-02', 'weight', 70), m('A', '2026-11-02', 'bmi', 22.9)];
    /** Day i back from yesterday with the given Move, Exercise and Stand (and the phone's steps). */
    const wd = (i: number, kcal: number, ex: number, stand: number) => {
      const d = addDays('2026-11-03', -1 - i);
      return [m('A', d, 'steps', 3000), m('A', d, 'move_kcal', kcal), m('A', d, 'exercise_min', ex), m('A', d, 'stand_min', stand)];
    };
    // the live shape: 27 of 28 days 0/0/0 (no Watch), one worn: too few Move days, so × 1.4, not pinned at 1.2
    const live = reduce({ metrics: [...body, ...Array.from({ length: 27 }, (_, i) => wd(i, 0, 0, 0)).flat(), ...wd(27, 600, 40, 100)], events: profile });
    // 8 worn days (one of them Move 0 with Stand 9: worn, a real 0) and 20 without the Watch
    const mixed = reduce({
      metrics: [...body, ...Array.from({ length: 7 }, (_, i) => wd(i, 560, 30, 120)).flat(), ...wd(7, 0, 0, 9), ...Array.from({ length: 20 }, (_, i) => wd(8 + i, 0, 0, 0)).flat()],
      events: profile
    });
    const bmr = energyOf(live, 'A', T)!.bmr;
    expect({ active: [activeKcal(live, 'A', T), activeKcal(mixed, 'A', T)], tdee: [energyOf(live, 'A', T)!.tdee, energyOf(mixed, 'A', T)!.tdee] })
      .toEqual({ active: [null, (7 * 560) / 8], tdee: [Math.round(bmr * PAL_FALLBACK), Math.round(energyOf(mixed, 'A', T)!.bmr + 490)] });
  });

  it('lowKcal ("warn, allow"): under the resting energy with a profile, else under the floor (men 1,500, women and unknown 1,200)', () => {
    const profile = [pref('A', T - 9e8, { key: 'sex', value: 'm' }), pref('A', T - 9e8, { key: 'birth', value: '1990-05-12' }), pref('B', T - 9e8, { key: 'sex', value: 'f' })];
    const s = reduce({ metrics: [m('A', '2026-11-02', 'weight', 70), m('A', '2026-11-02', 'bmi', 22.9)], events: profile });
    const bmr = energyOf(s, 'A', T)!.bmr; // 1,650 (70 kg, 174.8 cm, 36)
    const none = reduce({ metrics: [], events: [] });
    expect({
      a: [lowKcal(s, 'A', T, bmr - 50), lowKcal(s, 'A', T, bmr), lowKcal(s, 'A', T, 2200)],
      // B: a sex but no weigh-in or height: her floor only; the guest and a blank profile: the generic 1,200
      b: [lowKcal(s, 'B', T, 1150), lowKcal(s, 'B', T, 1200)],
      blank: [lowKcal(none, 'A', T, 1199), lowKcal(none, 'A', T, 1400), lowKcal(s, 'G', T, 1100)]
    }).toEqual({
      a: [{ why: 'bmr', kcal: bmr }, null, null],
      b: [{ why: 'floor', kcal: 1200 }, null],
      blank: [{ why: 'floor', kcal: 1200 }, null, { why: 'floor', kcal: 1200 }]
    });
  });

  it('no default without a sex, a birth date, a weigh-in or a height; kcal never under the resting energy or the floor', () => {
    const none = reduce({ metrics: [m('A', '2026-11-02', 'weight', 70), m('A', '2026-11-02', 'bmi', 22.9)], events: [pref('A', T - 9, { key: 'sex', value: 'm' })] });
    const noBmi = reduce({ metrics: [m('A', '2026-11-02', 'weight', 70)], events: [pref('A', T - 9, { key: 'sex', value: 'm' }), pref('A', T - 8, { key: 'birth', value: '1990-05-12' })] });
    // a light woman losing: 0.85 × her daily energy would go under 1,200
    const light = reduce({
      metrics: [m('B', '2026-11-02', 'weight', 42), m('B', '2026-11-02', 'bmi', 17.5)],
      events: [pref('B', T - 9, { key: 'sex', value: 'f' }), pref('B', T - 8, { key: 'birth', value: '1960-01-01' }), pref('B', T - 7, { key: 'goalWeight', value: 40 })]
    });
    const e = energyOf(light, 'B', T)!;
    expect({
      none: [energyOf(none, 'A', T), kcalDefault(none, 'A', T), energyOf(noBmi, 'A', T), kcalDefault(reduce({ metrics: [], events: [] }), 'B', T)],
      light: [e.tdee * 0.85 < 1200, kcalDefault(light, 'B', T), proteinDefault(light, 'B', T)]
    }).toEqual({ none: [null, null, null, null], light: [true, 1200, 67] });
  });
});
