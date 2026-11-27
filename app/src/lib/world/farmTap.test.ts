// The order of a tap on a plot (world/farmTap.ts, docs/farming.md "Playing").
import { describe, expect, it } from 'vitest';
import { PLANT_RUN_MS, farmTap, leftHM, plantingRun, type FarmTapIn, type PlotAt } from './farmTap.ts';
import { FARM, type Plot } from '#lib/contract/farm.ts';

const NOW = Date.UTC(2026, 10, 7, 3), H = 3600_000;
const id = (c: number, r: number) => `fd:field-1.${c}.${r}`;
const P = id(1, 1);
/** A tap on the 3 × 3's middle (1, 1); `plants`: the plants by plot. */
const at = (plants: Record<string, Plot> = {}): Pick<FarmTapIn, 'plot' | 'around'> => {
  const around: PlotAt[] = [];
  for (let r = 0; r <= 2; r++) for (let c = 0; c <= 2; c++) around.push({ p: id(c, r), c, r, ...(plants[id(c, r)] ? { plant: plants[id(c, r)] } : {}) });
  return { plot: around[4], around };
};
const dry = () => false, wet = () => true;
const base: FarmTapIn = { ...at(), now: NOW, wet: dry, seed: null, kinds: [], have: () => 0 };
const ripe: Plot = { c: 'tomato', t: NOW - 1 };
/** Planted an hour ago: 5 hours to go, not watered. */
const young: Plot = { c: 'carrot', t: NOW + 5 * H };
const watered: Plot = { ...young, w: true };
const tom = { c: 'tomato' as const, src: 'start' as const }, veg = { c: 'carrot' as const, src: 'crop' as const };

describe('a tap on a plot', () => {
  it('ripe plants in its 3 × 3 are harvested first, P first, then the nearest, at their yield', () => {
    const plants = { [P]: ripe, [id(0, 0)]: { ...ripe, c: 'wheat' as const }, [id(1, 0)]: { ...ripe, c: 'carrot' as const, w: true as const }, [id(1, 2)]: young };
    expect(farmTap({ ...base, ...at(plants) })).toEqual({
      a: 'harvest',
      ops: [{ p: P, c: 'tomato', n: 1 }, { p: id(1, 0), c: 'carrot', n: FARM.maxYield }, { p: id(0, 0), c: 'wheat', n: 1 }]
    });
    // a wet day: every one at the most
    expect(farmTap({ ...base, ...at({ [P]: ripe }), wet })).toEqual({ a: 'harvest', ops: [{ p: P, c: 'tomato', n: FARM.maxYield }] });
    // a miss: on a growing plant, or an empty plot I'd plant
    expect(farmTap({ ...base, ...at({ [P]: young, [id(2, 2)]: ripe }) })).toEqual({ a: 'harvest', ops: [{ p: id(2, 2), c: 'tomato', n: 1 }] });
    expect(farmTap({ ...base, ...at({ [id(2, 2)]: ripe }), kinds: [tom], have: () => 9 }).a).toBe('harvest');
  });

  it('a plant’s tap waters the 3 × 3’s growing, unwatered plants: never a ripe or watered one', () => {
    expect(farmTap({ ...base, ...at({ [P]: young, [id(0, 1)]: young, [id(2, 1)]: watered }) })).toEqual({ a: 'water', ps: [id(0, 1), P] });
    // a harvested plant growing back needs it again
    expect(farmTap({ ...base, ...at({ [P]: watered, [id(0, 0)]: { c: 'wheat', t: NOW + FARM.growMs, r: true } }) })).toEqual({ a: 'water', ps: [id(0, 0)] });
  });

  it('an empty plot never waters, it plants', () => {
    expect(farmTap({ ...base, ...at({ [id(0, 0)]: young }), kinds: [tom], have: () => 1 })).toEqual({ a: 'plant', ps: [P], c: 'tomato', src: 'start' });
  });

  it('all watered: a word with the time to ripe', () => {
    expect(farmTap({ ...base, ...at({ [P]: watered }) })).toEqual({ a: 'about', c: 'carrot', left: 5 * H });
  });

  it('planting is a 3 × 3’s empty plots, the tapped one first, then the nearest, up to what I hold and one event', () => {
    const kinds = [tom], plants = { [id(2, 0)]: watered, [id(0, 0)]: watered, [id(0, 1)]: watered, [id(0, 2)]: watered };
    expect(farmTap({ ...base, ...at(plants), seed: tom, kinds, have: () => 9 })).toEqual({ a: 'plant', ps: [P, id(1, 0), id(2, 1), id(1, 2), id(2, 2)], c: 'tomato', src: 'start' });
    expect(farmTap({ ...base, ...at(plants), seed: tom, kinds, have: () => 2 })).toMatchObject({ ps: [P, id(1, 0)] });
    expect(farmTap({ ...base, seed: tom, kinds, have: () => 99 })).toMatchObject({ ps: { length: 9 } });
  });

  it('decision 8: the crop is the pick (or this run’s); else one kind of start held plants at once, a vegetable or two kinds the picker, none a word', () => {
    const have = (k: string) => (k === 'goods:tomato-start' ? 2 : k === 'goods:carrot' ? 5 : 0);
    expect(farmTap({ ...base, kinds: [tom], have })).toMatchObject({ a: 'plant', c: 'tomato', src: 'start' });
    // only vegetables: never planted unasked (they may be for the shop), the picker
    expect(farmTap({ ...base, kinds: [veg], have })).toEqual({ a: 'pick' });
    expect(farmTap({ ...base, kinds: [veg], seed: veg, have })).toMatchObject({ a: 'plant', c: 'carrot', src: 'crop', ps: [P, id(1, 0), id(0, 1), id(2, 1), id(1, 2)] });
    expect(farmTap({ ...base, kinds: [tom, veg], have })).toEqual({ a: 'pick' });
    expect(farmTap({ ...base, kinds: [tom, veg], seed: veg, have })).toMatchObject({ a: 'plant', c: 'carrot', src: 'crop' });
    // the run's crop gone: the picker saying so, never a silent switch (even to the one start left)
    expect(farmTap({ ...base, kinds: [tom], seed: { c: 'wheat', src: 'start' }, have })).toEqual({ a: 'pick', out: 'wheat' });
    // nothing held at all
    expect(farmTap({ ...base })).toEqual({ a: 'none' });
    expect(farmTap({ ...base, seed: tom })).toEqual({ a: 'none' });
  });

  it('a mixed 3 × 3: an empty plot’s tap harvests, then plants; a plant’s tap then waters', () => {
    const kinds = [tom], have = () => 9;
    const plants: Record<string, Plot> = { [id(0, 0)]: ripe, [id(2, 2)]: watered };
    expect(farmTap({ ...base, ...at(plants), kinds, have })).toEqual({ a: 'harvest', ops: [{ p: id(0, 0), c: 'tomato', n: 1 }] });
    const after = { ...plants, [id(0, 0)]: { c: 'tomato' as const, t: NOW + FARM.growMs, r: true as const } };
    expect(farmTap({ ...base, ...at(after), kinds, have })).toEqual({ a: 'plant', ps: [P, id(1, 0), id(0, 1), id(2, 1), id(1, 2), id(2, 0), id(0, 2)], c: 'tomato', src: 'start' });
    const { around } = at(after);
    expect(farmTap({ ...base, plot: around[8], around, kinds, have })).toEqual({ a: 'water', ps: [id(0, 0)] });
  });
});

describe('leftHM', () => {
  it('hours and minutes, rounded up to ten minutes', () => {
    expect(leftHM(6 * H)).toEqual({ h: 6, m: 0 });
    expect(leftHM(5 * H + 1)).toEqual({ h: 5, m: 10 });
    expect(leftHM(25 * 60_000)).toEqual({ h: 0, m: 30 });
    expect(leftHM(55 * 60_000)).toEqual({ h: 1, m: 0 });
    expect(leftHM(1000)).toEqual({ h: 0, m: 10 });
  });
});

describe('the planting run', () => {
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
    const plain = { ok: true };
    expect(run.planted(tom, 0, plain)).toBe(plain);
  });
});
