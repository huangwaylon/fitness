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
const young = { who: 'A' as const, c: 'carrot' as const, from: '2026-11-09' };
const wet = () => true;

describe('a tap on a plot', () => {
  it('my ripe plant is harvested at its yield; another’s ripe one is watered, then a word', () => {
    expect(farmTap({ ...base, ...at({ [P]: ripe }), watered: (_p, d) => d === '2026-11-06' })).toEqual({ a: 'harvest', p: P, c: 'tomato', n: 2 });
    expect(farmTap({ ...base, ...at({ [P]: { ...ripe, who: 'B' } }) })).toEqual({ a: 'water', ids: [P] });
    expect(farmTap({ ...base, ...at({ [P]: { ...ripe, who: 'B' } }), watered: wet })).toEqual({ a: 'about', who: 'B', c: 'tomato', left: 0, watered: true });
  });

  it('a row’s miss: the nearest ripe plant of mine in the 3 × 3 is harvested, never the partner’s', () => {
    // the tapped plot growing, a ripe one of mine a row behind and one on the diagonal: the row's
    expect(farmTap({ ...base, ...at({ [P]: young, [id(1, 0)]: ripe, [id(0, 0)]: { ...ripe, c: 'wheat' } }), watered: wet })).toEqual({ a: 'harvest', p: id(1, 0), c: 'tomato', n: 3 });
    // an empty plot of mine by a ripe one: the harvest first
    expect(farmTap({ ...base, ...at({ [id(2, 2)]: ripe }), seed: { c: 'wheat', src: 'start' }, have: () => 1 })).toEqual({ a: 'harvest', p: id(2, 2), c: 'tomato', n: 1 });
    // the partner's ripe neighbour: mine is watered, theirs left be
    expect(farmTap({ ...base, ...at({ [P]: young, [id(1, 2)]: { ...ripe, who: 'B' } }), watered: wet })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true });
  });

  it('a plant with one in its 3 × 3 not watered today: those are watered; all watered and unripe, a word with the days left', () => {
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 1)]: { ...young, who: 'B' } }) })).toEqual({ a: 'water', ids: [id(0, 1), P] });
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 1)]: young }), watered: (p) => p === P })).toEqual({ a: 'water', ids: [id(0, 1)] });
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 1)]: young }), watered: wet })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true });
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
    // an empty plot by a plant not watered: planted, not watered
    expect(farmTap({ ...base, ...at({ [id(0, 0)]: young }), seed, have })).toEqual({ a: 'plant', c: 'wheat', src: 'start' });
  });

  it('another’s empty plot: whose field it is (only its owner plants)', () => {
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
