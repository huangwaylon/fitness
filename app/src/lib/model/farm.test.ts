// The field as the phones show it (model/farm.ts farmOfState): the relay's stored field and this phone's unsent farm
// rows stepped on it as the record will (judged at each row's `at`, the wet days the State's); an acknowledged row is
// the stored field's already.
import { describe, expect, it } from 'vitest';
import { FARM, fieldJson, type FarmData, type Plot } from '#lib/contract/farm.ts';
import type { FieldWire } from '#lib/contract/ledger.ts';
import type { Who } from '#lib/types.ts';
import { farmOfState, wetOf, type FarmRow } from './farm.ts';

const T = Date.UTC(2026, 10, 4, 3); // 2026-11-04 12:00 Tokyo
const H = 3_600_000;
const P = 'fd:f.0.0', Q = 'fd:f.1.0', R = 'fd:f.2.0';
const wire = (plots: [string, Plot][], seq = 1): FieldWire => ({ seq, at: new Date(T).toISOString(), v: plots });
const row = (at: number, ops: FarmData['ops'], unsent = true, person: Who = 'A'): FarmRow => ({ at, person, data: { ops }, queued: true, ...(unsent ? { unsent } : {}) });

describe('farmOfState', () => {
  // P ripe at T + 1 h (planted 5 h before T), Q ripe already, R empty
  const field = wire([[P, { c: 'tomato', t: T + H }], [Q, { c: 'carrot', t: T - H }]]);
  const none: FarmRow[] = [], dry: string[] = [];

  it('the stored field’s plots, no pocket changes; none heard: an empty field', () => {
    const f = farmOfState({ farm: none, wet: dry, field });
    expect(fieldJson(f)).toEqual(field.v);
    expect(f.net).toEqual({});
    expect(farmOfState({ farm: none, wet: dry }).plots.size).toBe(0);
  });

  it('an unsent row stepped on it at its `at`: a plant, a watering, a harvest at its yield, the pocket’s changes; a refused op dropped', () => {
    const rows = [
      row(T, [{ o: 'plant', p: R, c: 'wheat', src: 'start' }, { o: 'water', p: P }, { o: 'harvest', p: Q, n: 3 }]),
      // (P not ripe yet at T + 30 min: no harvest)
      row(T + H / 2, [{ o: 'harvest', p: P, n: 3 }])
    ];
    const f = farmOfState({ farm: rows, wet: dry, field });
    expect(f.plots.get(R)).toEqual({ c: 'wheat', t: T + FARM.growMs });
    expect(f.plots.get(P)).toEqual({ c: 'tomato', t: T + H, w: true });
    expect(f.plots.get(Q)).toEqual({ c: 'carrot', t: T + FARM.growMs, r: true });
    expect([...f.net.A!]).toEqual([['goods:wheat-start', -1], ['goods:carrot', 1]]);
    // (the stored field left as it was)
    expect(fieldJson(farmOfState({ farm: none, wet: dry, field }))).toEqual(field.v);
  });

  it('a harvest yields the most on a wet day (the State’s `wet` rows) or watered', () => {
    const harvest = [row(T, [{ o: 'harvest', p: Q, n: 1 }])];
    expect(farmOfState({ farm: harvest, wet: ['2026-11-04'], field }).net.A?.get('goods:carrot')).toBe(FARM.maxYield);
    const watered = wire([[Q, { c: 'carrot', t: T - H, w: true }]], 2);
    expect(farmOfState({ farm: harvest, wet: dry, field: watered }).net.A?.get('goods:carrot')).toBe(FARM.maxYield);
  });

  it('an acknowledged row is the stored field’s to say: never stepped again', () => {
    const f = farmOfState({ farm: [row(T, [{ o: 'dig', p: P }], false), row(T, [{ o: 'dig', p: Q }], true, 'B')], wet: dry, field });
    expect([...f.plots.keys()]).toEqual([P]);
    expect([...f.net.B!]).toEqual([['goods:carrot-start', 1]]);
    expect(f.net.A).toBeUndefined();
  });

  it('memoised per State lists: the same field again; with no unsent row, the stored one itself', () => {
    const rows = [row(T, [{ o: 'water', p: P }])];
    const a = farmOfState({ farm: rows, wet: dry, field });
    expect(farmOfState({ farm: rows, wet: dry, field })).toBe(a);
    expect(farmOfState({ farm: [...rows], wet: dry, field })).not.toBe(a);
    const kept = [row(T, [{ o: 'water', p: P }], false)];
    expect(farmOfState({ farm: kept, wet: dry, field })).toBe(farmOfState({ farm: none, wet: dry, field }));
  });

  it('an older relay’s field (not a plot list): an empty one', () => {
    expect(farmOfState({ farm: none, wet: dry, field: { seq: 9, at: field.at, v: { p: [], n: {} } } }).plots.size).toBe(0);
  });
});

describe('wetOf', () => {
  it('the wet days of the list, memoised per list', () => {
    const wet = ['2026-11-04'];
    const w = wetOf({ wet });
    expect([w('2026-11-04'), w('2026-11-05')]).toEqual([true, false]);
    expect(wetOf({ wet })).toBe(w);
  });
});
