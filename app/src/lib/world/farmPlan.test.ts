// The fields read whole (world/farmPlan.ts), over two 10 × 4 fields.
import { describe, expect, it } from 'vitest';
import { emptyFarm, FARM, farmStep, plotOf, type Farm } from '#lib/contract/farm.ts';
import { fieldPlots } from '#lib/layout/field.ts';
import { freePlots, orphans, plantsLeft } from './farmPlan.ts';
import { Layout } from '#lib/layout/model.ts';

const T = Date.UTC(2026, 10, 4, 3);
const ONE = fieldPlots({ id: 'field-1', x: 10, z: 17, s: 'f-10x4' }), TWO = fieldPlots({ id: 'field-2', x: 10, z: 22, s: 'b-10x4' });
const PLOTS = [...ONE, ...TWO];
const plant = (ps: readonly string[]) => ({ ops: ps.map((p) => ({ o: 'plant' as const, p, c: 'tomato' as const, src: 'start' as const })) });
/** A farm with the first `n` plots of field-1 planted by A and `m` of field-2's by B. */
function farmOf(n: number, m = 0): Farm {
  const f = emptyFarm();
  if (n) farmStep(f, 'A', plant(ONE.slice(0, n).map((t) => t.p)), T);
  if (m) farmStep(f, 'B', plant(TWO.slice(0, m).map((t) => t.p)), T);
  return f;
}

describe('freePlots', () => {
  it('every field’s empty plots, whoever planted the rest (an old variant’s owner ignored)', () => {
    expect(freePlots(PLOTS, emptyFarm())).toBe(80);
    expect(freePlots(PLOTS, farmOf(40, 3))).toBe(37);
    expect(freePlots(fieldPlots({ id: 'small', x: 0, z: 0, s: 'f-2x2' }), emptyFarm())).toBe(4);
  });
});

describe('orphans', () => {
  it('any plant no field covers', () => {
    const f = farmOf(2, 1);
    farmStep(f, 'A', plant([plotOf('gone', 0, 0)]), T);
    farmStep(f, 'B', plant([plotOf('gone', 1, 0)]), T);
    expect(orphans(f, PLOTS)).toEqual([plotOf('gone', 0, 0), plotOf('gone', 1, 0)]);
    expect(orphans(f, [])).toHaveLength(5);
  });
});

describe('plantsLeft', () => {
  const one = { id: 'field-1', k: 'field', x: 10, z: 17, f: 0 as const, s: 'f-10x4' }, two = { id: 'field-2', k: 'field', x: 10, z: 22, f: 0 as const, s: 'b-10x4' };
  const L = (...os: object[]) => ({ objects: new Map(os.map((o) => [(o as { id: string }).id, o])) }) as unknown as Pick<Layout, 'objects'>;
  // field-1: 12 plants (its first row and two of the second), 2 of them ripe; field-2: 2, ripe
  const f = farmOf(12, 2), now = T + FARM.growMs;
  for (const p of [ONE[0].p, ONE[11].p]) f.plots.set(p, { ...f.plots.get(p)!, t: now - 1 });
  for (const p of ONE.slice(1, 11).map((t) => t.p)) f.plots.set(p, { ...f.plots.get(p)!, t: now + 1 });
  it('a field deleted: all its plants, the ripe ones counted', () => {
    expect(plantsLeft(L(one, two), L(two), f, now)).toEqual({ n: 12, ripe: 2, fields: 1, gone: true });
    expect(plantsLeft(L(one, two), L(), f, now)).toEqual({ n: 14, ripe: 4, fields: 2, gone: true });
  });
  it('a field made smaller: the plants on the plots it gives up', () => {
    // 10 × 4 → 10 × 1: the second row's two (one ripe)
    expect(plantsLeft(L(one), L({ ...one, s: 'f-10x1' }), f, now)).toEqual({ n: 2, ripe: 1, fields: 1, gone: false });
    // 10 × 4 → 5 × 4: the first row's columns 5–9
    expect(plantsLeft(L(one), L({ ...one, s: 'f-5x4' }), f, now)).toEqual({ n: 5, ripe: 0, fields: 1, gone: false });
  });
  it('a move, a turn or a grow leaves none; no plants, none', () => {
    expect(plantsLeft(L(one), L({ ...one, x: 2, z: 3, f: 1 }), f, now).n).toBe(0);
    expect(plantsLeft(L(one), L({ ...one, s: 'f-12x6' }), f, now).n).toBe(0);
    expect(plantsLeft(L(one), L(), emptyFarm(), now).n).toBe(0);
  });
});
