import { describe, expect, it } from 'vitest';
import type { Visit, WeekPromise, Workout } from '#lib/types.ts';
import { checkPromise, promisedDays } from '#lib/scoring/promise.ts';

const WK = '2026-11-02'; // Mon 2 … Sun 8
const SUN = '2026-11-08';
const MON = 1, TUE = 2, WED = 4, THU = 8, FRI = 16, SAT = 32, SUNB = 64;

let n = 0;
const w = (date: string, type: string, durationMin: number, includesStrength: boolean | null = null): Workout => ({
  extId: `w${n++}`, date, type, startAt: `${date}T07:00:00+09:00`, endAt: `${date}T08:00:00+09:00`, durationMin, avgHr: null, includesStrength
});
const v = (date: string, autoStrength = false): Visit => ({
  placeKey: autoStrength ? 'pt' : 'gym', date, arriveAt: '', leaveAt: '', dwellMin: 60, autoStrength, confirmed: null
});
const p = (daysMask: number, kind: WeekPromise['kind']): WeekPromise => ({ daysMask, kind });
const check = (pr: WeekPromise, ws: Workout[], vs: Visit[] = [], cozy: string[] = [], today = SUN) => checkPromise(pr, WK, ws, vs, cozy, today);

describe('promisedDays', () => {
  it('maps Mon=1 … Sun=64', () => {
    expect(promisedDays(MON | WED | SUNB, WK)).toEqual(['2026-11-02', '2026-11-04', '2026-11-08']);
    expect(promisedDays(0, WK)).toEqual([]);
  });
});

describe('checkPromise', () => {
  it('kept on the day, or ±1 day; open beyond that', () => {
    expect(check(p(WED, 'gym'), [w('2026-11-04', 'Traditional Strength Training', 40)])).toBe('kept');
    expect(check(p(WED, 'gym'), [w('2026-11-03', 'Traditional Strength Training', 40)])).toBe('kept');
    expect(check(p(WED, 'gym'), [w('2026-11-05', 'Traditional Strength Training', 40)])).toBe('kept');
    expect(check(p(WED, 'gym'), [w('2026-11-06', 'Traditional Strength Training', 40)])).toBe('open');
    expect(check(p(WED, 'gym'), [w('2026-11-02', 'Traditional Strength Training', 40)])).toBe('open');
  });
  it('±1 day reaches across the week boundary', () => {
    expect(check(p(MON, 'any'), [w('2026-11-01', 'Running', 30)])).toBe('kept');
  });
  it('each activity satisfies only one promised day', () => {
    expect(check(p(TUE | WED, 'gym'), [w('2026-11-03', 'Pilates', 30)])).toBe('open');
    expect(check(p(TUE | WED, 'gym'), [w('2026-11-03', 'Pilates', 30), w('2026-11-04', 'Pilates', 30)])).toBe('kept');
    // Greedy by date: Tue takes Mon's workout, Wed takes Thu's.
    expect(check(p(TUE | WED, 'gym'), [w('2026-11-05', 'Pilates', 30), w('2026-11-02', 'Pilates', 30)])).toBe('kept');
    // Tue/Thu/Sat with activities Wed, Fri, Sun
    expect(check(p(TUE | THU | SAT, 'any'), [w('2026-11-04', 'Running', 20), w('2026-11-06', 'Running', 20), w(SUN, 'Running', 20)])).toBe('kept');
  });
  it('gym: any visit or a strength workout', () => {
    expect(check(p(TUE, 'gym'), [], [v('2026-11-03')])).toBe('kept');
    expect(check(p(TUE, 'gym'), [w('2026-11-03', 'Yoga', 40, true)])).toBe('kept');
    expect(check(p(TUE, 'gym'), [w('2026-11-03', 'Yoga', 40, null)])).toBe('open');
    expect(check(p(TUE, 'gym'), [w('2026-11-03', 'Running', 60)])).toBe('open');
  });
  it('pt: autoStrength visit or strength workout, not a plain gym visit', () => {
    expect(check(p(WED, 'pt'), [], [v('2026-11-04', true)])).toBe('kept');
    expect(check(p(WED, 'pt'), [], [v('2026-11-04', false)])).toBe('open');
    expect(check(p(WED, 'pt'), [w('2026-11-04', 'Functional Strength Training', 30)])).toBe('kept');
  });
  it('walk: Walking/Hiking workout, or any workout ≥ 30 min; visits do not count', () => {
    expect(check(p(SAT, 'walk'), [w('2026-11-07', 'Walking', 10)])).toBe('kept');
    expect(check(p(SAT, 'walk'), [w('2026-11-07', 'Hiking', 120)])).toBe('kept');
    expect(check(p(SAT, 'walk'), [w('2026-11-07', 'Cycling', 30)])).toBe('kept');
    expect(check(p(SAT, 'walk'), [w('2026-11-07', 'Cycling', 29)])).toBe('open');
    expect(check(p(SAT, 'walk'), [], [v('2026-11-07')])).toBe('open');
  });
  it('any: workout ≥ 15 min or any visit', () => {
    expect(check(p(FRI, 'any'), [w('2026-11-06', 'Dance', 15)])).toBe('kept');
    expect(check(p(FRI, 'any'), [w('2026-11-06', 'Dance', 14)])).toBe('open');
    expect(check(p(FRI, 'any'), [], [v('2026-11-06')])).toBe('kept');
  });
  it('paused when any promised day is a cozy day, even if otherwise kept', () => {
    expect(check(p(TUE | THU, 'any'), [w('2026-11-03', 'Running', 30)], [], ['2026-11-05'])).toBe('paused');
    expect(check(p(TUE, 'any'), [w('2026-11-03', 'Running', 30)], [], ['2026-11-04'])).toBe('kept'); // cozy on a non-promised day
  });
  it('ignores activities after today; empty promise is open', () => {
    expect(check(p(TUE, 'any'), [w('2026-11-04', 'Running', 30)], [], [], '2026-11-03')).toBe('open');
    expect(check(p(TUE, 'any'), [w('2026-11-04', 'Running', 30)], [], [], '2026-11-04')).toBe('kept');
    expect(check(p(0, 'any'), [w('2026-11-04', 'Running', 30)])).toBe('open');
  });
});
