// The order of a tap on a plot (island/farmTap.ts, docs/farming.md "Playing").
import { describe, expect, it } from 'vitest';
import { farmTap, waveSpots, type FarmTapIn, type PlotAt } from './farmTap.ts';
import { FARM, type Plot } from '#lib/contract/farm.ts';

const D = '2026-11-07';
const id = (c: number, r: number) => `fd:field-A.${c}.${r}`;
const P = id(1, 1);
/** A tap on the 3 × 3's middle (1, 1); `plants`: the plants by plot. */
const at = (plants: Record<string, Plot> = {}): Pick<FarmTapIn, 'plant' | 'around'> => {
  const around: PlotAt[] = [];
  for (let r = 0; r <= 2; r++) for (let c = 0; c <= 2; c++) around.push({ p: id(c, r), c, r, ...(plants[id(c, r)] ? { plant: plants[id(c, r)] } : {}) });
  return { plant: plants[P], around };
};
const base: FarmTapIn = { me: 'A', plot: { p: P, who: 'A', c: 1, r: 1 }, ...at(), date: D, watered: () => false, seed: null, have: () => 0, mine: 0 };
const ripe = { who: 'A' as const, c: 'tomato' as const, from: D };
/** Two days to ripe: its watering counts today. */
const young = { who: 'A' as const, c: 'carrot' as const, from: '2026-11-09' };
const wet = () => true;
const theirs = (p: Plot): Plot => ({ ...p, who: 'B' });

describe('a tap on a plot', () => {
  it('my ripe plant: every ripe plant of mine in its 3 × 3 is harvested, it first, then the nearest; never the partner’s', () => {
    const plants = { [P]: ripe, [id(0, 0)]: { ...ripe, c: 'wheat' as const }, [id(1, 0)]: { ...ripe, c: 'carrot' as const }, [id(2, 1)]: theirs(ripe), [id(1, 2)]: young };
    expect(farmTap({ ...base, ...at(plants), watered: wet })).toEqual({
      a: 'harvest',
      ops: [{ p: P, c: 'tomato', n: 3 }, { p: id(1, 0), c: 'carrot', n: 3 }, { p: id(0, 0), c: 'wheat', n: 3 }]
    });
    // at its own yield: none watered, 1 each
    expect(farmTap({ ...base, ...at({ [P]: ripe }) })).toEqual({ a: 'harvest', ops: [{ p: P, c: 'tomato', n: 1 }] });
    // even beside a plant to water: a harvest can't misfire
    expect(farmTap({ ...base, ...at({ [P]: ripe, [id(0, 1)]: young }) })).toEqual({ a: 'harvest', ops: [{ p: P, c: 'tomato', n: 1 }] });
  });

  it('nh-04: a growing plant’s tap beside a ripe row waters it, never harvests', () => {
    const row = { [id(0, 0)]: ripe, [id(1, 0)]: ripe, [id(2, 0)]: ripe };
    expect(farmTap({ ...base, ...at({ ...row, [P]: young, [id(0, 1)]: young }) })).toEqual({ a: 'water', ids: [id(0, 1), P] });
    // watered already: then the row's harvest (a miss)
    expect(farmTap({ ...base, ...at({ ...row, [P]: young }), watered: (p) => p === P }).a).toBe('harvest');
  });

  it('the can waters only plants whose watering counts: never a ripe one (mine or the partner’s)', () => {
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 1)]: theirs(young), [id(2, 1)]: theirs(ripe) }) })).toEqual({ a: 'water', ids: [id(0, 1), P] });
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 1)]: young }), watered: (p) => p === P })).toEqual({ a: 'water', ids: [id(0, 1)] });
    // the partner's ripe one alone: nothing to water, a word
    expect(farmTap({ ...base, ...at({ [P]: theirs(ripe) }) })).toEqual({ a: 'about', who: 'B', c: 'tomato', left: 0, watered: false });
  });

  it('a miss on my empty plot, or a watered or another’s plant, harvests my ripe ones there, the nearest first', () => {
    const seed = { c: 'wheat' as const, src: 'start' as const };
    expect(farmTap({ ...base, ...at({ [id(2, 2)]: ripe, [id(1, 2)]: { ...ripe, c: 'potato' } }), seed, have: () => 1 })).toEqual({
      a: 'harvest',
      ops: [{ p: id(1, 2), c: 'potato', n: 1 }, { p: id(2, 2), c: 'tomato', n: 1 }]
    });
    expect(farmTap({ ...base, ...at({ [P]: young, [id(1, 0)]: ripe }), watered: wet })).toEqual({ a: 'harvest', ops: [{ p: id(1, 0), c: 'tomato', n: 3 }] });
    expect(farmTap({ ...base, ...at({ [P]: theirs(ripe), [id(1, 0)]: ripe }) })).toEqual({ a: 'harvest', ops: [{ p: id(1, 0), c: 'tomato', n: 1 }] });
  });

  it('another’s empty plot waters the plants around it; mine plants instead', () => {
    const other = { ...base, plot: { p: P, who: 'B' as const, c: 1, r: 1 } };
    expect(farmTap({ ...other, ...at({ [id(0, 0)]: theirs(young) }) })).toEqual({ a: 'water', ids: [id(0, 0)] });
    const seed = { c: 'wheat' as const, src: 'start' as const };
    expect(farmTap({ ...base, ...at({ [id(0, 0)]: young }), seed, have: () => 1 })).toEqual({ a: 'plant', c: 'wheat', src: 'start' });
  });

  it('all watered and unripe: a word with the days left, and who watered it today', () => {
    expect(farmTap({ ...base, ...at({ [P]: young }), watered: wet })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true });
    expect(farmTap({ ...base, ...at({ [P]: young }), watered: wet, by: 'B' })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true, by: 'B' });
    expect(farmTap({ ...base, ...at({ [P]: theirs(ripe) }), watered: wet, by: 'G' })).toEqual({ a: 'about', who: 'B', c: 'tomato', left: 0, watered: true, by: 'G' });
  });

  it('my empty plot: the cap first; nothing held, the picker, and its pick plants it; none left, the picker again', () => {
    const seed = { c: 'wheat' as const, src: 'start' as const };
    const have = (k: string) => (k === 'goods:wheat-start' ? 1 : 0);
    expect(farmTap({ ...base, have, mine: FARM.cap })).toEqual({ a: 'cap' });
    expect(farmTap({ ...base, seed, have, mine: FARM.cap })).toEqual({ a: 'cap' });
    // the pick → the same plot's tap again (SceneTaps) plants it
    expect(farmTap({ ...base, have })).toEqual({ a: 'pick' });
    expect(farmTap({ ...base, seed, have })).toEqual({ a: 'plant', c: 'wheat', src: 'start' });
    expect(farmTap({ ...base, seed: { c: 'wheat', src: 'crop' }, have })).toEqual({ a: 'pick', out: 'wheat' });
    expect(farmTap({ ...base, seed })).toEqual({ a: 'pick', out: 'wheat' });
  });

  it('another’s empty plot with nothing to water: whose field it is (only its owner plants)', () => {
    expect(farmTap({ ...base, plot: { p: P, who: 'B', c: 1, r: 1 }, seed: { c: 'wheat', src: 'start' }, have: () => 9 })).toEqual({ a: 'about', who: 'B' });
  });
});

describe("the 畑 sheet's wave", () => {
  it('at most 8 plots, spread evenly left to right, the ends kept; fewer as they are', () => {
    const row = Array.from({ length: 30 }, (_, i) => ({ c: 29 - i, r: i % 2 }));
    const w = waveSpots(row);
    expect(w.map((t) => t.c)).toEqual([0, 4, 8, 12, 17, 21, 25, 29]);
    expect(waveSpots(row.slice(0, 3)).map((t) => t.c)).toEqual([27, 28, 29]);
    expect(waveSpots([])).toEqual([]);
  });
});
