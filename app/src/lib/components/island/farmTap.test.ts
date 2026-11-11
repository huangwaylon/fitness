// The §7 order of a tap on a plot (island/farmTap.ts, docs/farming.md "Playing").
import { describe, expect, it } from 'vitest';
import { farmTap, type FarmTapIn } from './farmTap.ts';
import { FARM } from '#lib/contract/farm.ts';

const D = '2026-11-07';
const P = 'fd:field-A.0.0';
const base: FarmTapIn = { me: 'A', plot: { p: P, who: 'A' }, date: D, watered: () => false, shovel: false, seed: null, have: () => 0, mine: 0 };
const ripe = { who: 'A' as const, c: 'tomato' as const, from: D };
const young = { who: 'A' as const, c: 'carrot' as const, from: '2026-11-09' };

describe('a tap on a plot', () => {
  it('the shovel armed digs my plant, ripe or not; never another’s', () => {
    expect(farmTap({ ...base, plant: ripe, shovel: true })).toEqual({ a: 'dig', c: 'tomato' });
    expect(farmTap({ ...base, plant: { ...young, who: 'B' }, shovel: true })).toEqual({ a: 'water' });
  });

  it('my ripe plant is harvested at its yield; another’s ripe one is watered, then a word', () => {
    expect(farmTap({ ...base, plant: ripe, watered: (_p, d) => d === '2026-11-06' })).toEqual({ a: 'harvest', c: 'tomato', n: 2 });
    expect(farmTap({ ...base, plant: { ...ripe, who: 'B' } })).toEqual({ a: 'water' });
    expect(farmTap({ ...base, plant: { ...ripe, who: 'B' }, watered: () => true })).toEqual({ a: 'about', who: 'B', c: 'tomato', left: 0, watered: true });
  });

  it('a plant not watered today is watered; watered, a word with the days left', () => {
    expect(farmTap({ ...base, plant: young })).toEqual({ a: 'water' });
    expect(farmTap({ ...base, plant: young, watered: () => true })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true });
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

  it('another’s empty plot: whose field it is (only its owner plants)', () => {
    expect(farmTap({ ...base, plot: { p: P, who: 'B' }, seed: { c: 'wheat', src: 'start' }, have: () => 9 })).toEqual({ a: 'about', who: 'B' });
  });
});
