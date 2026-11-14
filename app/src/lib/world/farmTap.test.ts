// The order of a tap on a plot (world/farmTap.ts, docs/farming.md "Playing").
import { describe, expect, it } from 'vitest';
import { PLANT_RUN_MS, farmTap, plantingRun, type FarmTapIn, type PlotAt } from './farmTap.ts';
import { FARM, type Plot } from '#lib/contract/farm.ts';

const D = '2026-11-07';
const id = (c: number, r: number) => `fd:field-A.${c}.${r}`;
const P = id(1, 1);
/** A tap on the 3 × 3's middle (1, 1); `plants`: the plants by plot; `who`: whose plot (A's unless said). */
const at = (plants: Record<string, Plot> = {}, who: (c: number, r: number) => 'A' | 'B' = () => 'A'): Pick<FarmTapIn, 'plant' | 'around'> => {
  const around: PlotAt[] = [];
  for (let r = 0; r <= 2; r++) for (let c = 0; c <= 2; c++) around.push({ p: id(c, r), who: who(c, r), c, r, ...(plants[id(c, r)] ? { plant: plants[id(c, r)] } : {}) });
  return { plant: plants[P], around };
};
const base: FarmTapIn = { me: 'A', plot: { p: P, who: 'A', c: 1, r: 1 }, ...at(), date: D, watered: () => false, seed: null, kinds: [], have: () => 0, mine: 0 };
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

  it('a run of harvest taps: my plant picked today, with ripe ones of mine around it, harvests them, never the can', () => {
    const picked = { ...ripe, from: '2026-11-10', r: true as const };
    const plants = { [P]: picked, [id(0, 1)]: picked, [id(2, 1)]: ripe, [id(2, 2)]: { ...ripe, c: 'carrot' as const } };
    expect(farmTap({ ...base, ...at(plants) })).toEqual({ a: 'harvest', ops: [{ p: id(2, 1), c: 'tomato', n: 1 }, { p: id(2, 2), c: 'carrot', n: 1 }] });
    // none ripe left: the can waters the picked ones (the harvest day counts)
    expect(farmTap({ ...base, ...at({ [P]: picked, [id(0, 1)]: picked }) })).toEqual({ a: 'water', ids: [id(0, 1), P] });
    // a regrowing plant picked another day is growing: the can first, as nh-04
    expect(farmTap({ ...base, ...at({ [P]: { ...picked, from: '2026-11-09' }, [id(2, 1)]: ripe }) })).toEqual({ a: 'water', ids: [P] });
    // the partner's plant picked today is no run of mine: the can
    expect(farmTap({ ...base, ...at({ [P]: theirs(picked), [id(2, 1)]: ripe }) })).toEqual({ a: 'water', ids: [P] });
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

  it('another’s empty plot waters the plants around it; mine never waters, it plants', () => {
    const other = { ...base, plot: { p: P, who: 'B' as const, c: 1, r: 1 } };
    expect(farmTap({ ...other, ...at({ [id(0, 0)]: theirs(young) }) })).toEqual({ a: 'water', ids: [id(0, 0)] });
    const seed = { c: 'wheat' as const, src: 'start' as const };
    expect(farmTap({ ...base, ...at({ [id(0, 0)]: young }), seed, kinds: [seed], have: () => 1 })).toEqual({ a: 'plant', ps: [P], c: 'wheat', src: 'start' });
  });

  it('all watered and unripe: a word with the days left, and who watered it today; my own plant offers ほる', () => {
    expect(farmTap({ ...base, ...at({ [P]: young }), watered: wet })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true, dig: true });
    expect(farmTap({ ...base, ...at({ [P]: young }), watered: wet, by: 'B' })).toEqual({ a: 'about', who: 'A', c: 'carrot', left: 2, watered: true, by: 'B', dig: true });
    expect(farmTap({ ...base, ...at({ [P]: theirs(ripe) }), watered: wet, by: 'G' })).toEqual({ a: 'about', who: 'B', c: 'tomato', left: 0, watered: true, by: 'G' });
    // never on the first tap while there's water or a harvest to do
    expect(farmTap({ ...base, ...at({ [P]: young }) }).a).toBe('water');
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 0)]: ripe }), watered: wet }).a).toBe('harvest');
  });

  it('planting is a 3 × 3: my empty plots only, the tapped one first, then the nearest, up to what I hold, the cap and one event', () => {
    const seed = { c: 'tomato' as const, src: 'start' as const }, kinds = [seed];
    // the left column the partner's field (plotsAround reaches into any field), one plot of mine planted
    const plants = { [id(2, 0)]: young };
    const mixed = at(plants, (c) => (c === 0 ? 'B' : 'A'));
    expect(farmTap({ ...base, ...mixed, seed, kinds, have: () => 9 })).toEqual({ a: 'plant', ps: [P, id(1, 0), id(2, 1), id(1, 2), id(2, 2)], c: 'tomato', src: 'start' });
    // two held: the tapped plot and its nearest
    expect(farmTap({ ...base, ...mixed, seed, kinds, have: () => 2 })).toMatchObject({ ps: [P, id(1, 0)] });
    // the cap leaves room for 3
    expect(farmTap({ ...base, ...at(), seed, kinds, have: () => 9, mine: FARM.cap - 3 })).toMatchObject({ ps: [P, id(1, 0), id(0, 1)] });
    expect(farmTap({ ...base, ...at(), seed, kinds, have: () => 99 })).toMatchObject({ ps: { length: 9 } });
  });

  it('decision 8: the crop is the pick (or this run’s); else one kind of start held plants at once, a vegetable or two kinds the picker, none a word', () => {
    const tom = { c: 'tomato' as const, src: 'start' as const }, veg = { c: 'carrot' as const, src: 'crop' as const };
    const have = (k: string) => (k === 'goods:tomato-start' ? 2 : k === 'goods:carrot' ? 5 : 0);
    // one kind of start: planted without asking
    expect(farmTap({ ...base, kinds: [tom], have })).toMatchObject({ a: 'plant', c: 'tomato', src: 'start' });
    // only vegetables: never planted unasked (they may be for the shop), the picker
    expect(farmTap({ ...base, kinds: [veg], have })).toEqual({ a: 'pick' });
    expect(farmTap({ ...base, kinds: [veg], seed: veg, have })).toMatchObject({ a: 'plant', c: 'carrot', src: 'crop', ps: [P, id(1, 0), id(0, 1), id(2, 1), id(1, 2)] });
    // a start and a vegetable are two kinds: the picker, never an unasked vegetable
    expect(farmTap({ ...base, kinds: [tom, veg], have })).toEqual({ a: 'pick' });
    // the pick (the picker's, forced, or this run's) plants
    expect(farmTap({ ...base, kinds: [tom, veg], seed: veg, have })).toMatchObject({ a: 'plant', c: 'carrot', src: 'crop' });
    // the run's crop gone: the picker saying so, never a silent switch (even to the one start left)
    expect(farmTap({ ...base, kinds: [veg], seed: tom, have: (k) => (k === 'goods:carrot' ? 5 : 0) })).toEqual({ a: 'pick', out: 'tomato' });
    expect(farmTap({ ...base, kinds: [tom], seed: { c: 'wheat', src: 'start' }, have })).toEqual({ a: 'pick', out: 'wheat' });
    expect(farmTap({ ...base, kinds: [tom, veg], seed: { c: 'wheat', src: 'start' }, have })).toEqual({ a: 'pick', out: 'wheat' });
    // nothing held at all
    expect(farmTap({ ...base })).toEqual({ a: 'none' });
    expect(farmTap({ ...base, seed: tom })).toEqual({ a: 'none' });
  });

  it('my empty plot at the cap: says so, whatever I hold', () => {
    const seed = { c: 'wheat' as const, src: 'start' as const };
    expect(farmTap({ ...base, kinds: [seed], have: () => 1, mine: FARM.cap })).toEqual({ a: 'cap' });
    expect(farmTap({ ...base, mine: FARM.cap })).toEqual({ a: 'cap' });
  });

  it('a mixed 3 × 3: a tap on my empty plot harvests first, the next one plants; a tap on a plant waters', () => {
    const seed = { c: 'wheat' as const, src: 'start' as const }, kinds = [seed], have = () => 9;
    const plants: Record<string, Plot> = { [id(0, 0)]: ripe, [id(2, 2)]: young };
    // the empty middle: my ripe one first (a miss forgiven)
    expect(farmTap({ ...base, ...at(plants), kinds, have })).toEqual({ a: 'harvest', ops: [{ p: id(0, 0), c: 'tomato', n: 1 }] });
    // harvested: it regrows (picked today); the empty middle plants its empty plots now, never waters
    const after = { ...plants, [id(0, 0)]: { ...ripe, from: '2026-11-10', r: true as const } };
    expect(farmTap({ ...base, ...at(after), kinds, have })).toEqual({ a: 'plant', ps: [P, id(1, 0), id(0, 1), id(2, 1), id(1, 2), id(2, 0), id(0, 2)], c: 'wheat', src: 'start' });
    // a tap on a plant waters the 3 × 3's dry ones
    expect(farmTap({ ...base, plot: { p: id(2, 2), who: 'A', c: 2, r: 2 }, ...at(after), plant: young, kinds, have })).toEqual({ a: 'water', ids: [id(0, 0), id(2, 2)] });
  });

  it('another’s empty plot with nothing to water: whose field it is (only its owner plants)', () => {
    const seed = { c: 'wheat' as const, src: 'start' as const };
    expect(farmTap({ ...base, plot: { p: P, who: 'B', c: 1, r: 1 }, seed, kinds: [seed], have: () => 9 })).toEqual({ a: 'about', who: 'B' });
  });
});

describe('the planting run', () => {
  const tom = { c: 'tomato' as const, src: 'start' as const };
  it('its crop lasts PLANT_RUN_MS from the last plant, each plant extending it', () => {
    const run = plantingRun();
    expect(run.crop(0)).toBeNull();
    run.planted(tom, 1000, { ok: true });
    expect(run.crop(1000 + PLANT_RUN_MS)).toEqual(tom);
    expect(run.crop(1001 + PLANT_RUN_MS)).toBeNull();
    run.planted(tom, 50_000, { ok: true });
    expect(run.crop(50_000 + PLANT_RUN_MS)).toEqual(tom);
  });
  it('a planting taken back ends it; an undo that failed (sent already) doesn’t', () => {
    const run = plantingRun();
    let can = true;
    const r = run.planted(tom, 0, { ok: true, undo: () => can });
    can = false;
    expect(r.undo!()).toBe(false);
    expect(run.crop(10)).toEqual(tom);
    can = true;
    expect(r.undo!()).toBe(true);
    expect(run.crop(10)).toBeNull();
    // (no undo: handed back as it was)
    const plain = { ok: true };
    expect(run.planted(tom, 0, plain)).toBe(plain);
  });
});
