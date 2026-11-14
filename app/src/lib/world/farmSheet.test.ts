// My fields read whole (world/farmSheet.ts), over a 10 × 4 field of mine and one of the partner's.
import { describe, expect, it } from 'vitest';
import { FARM, emptyFarm, farmStep, plotOf, type Farm } from '#lib/contract/farm.ts';
import { fieldPlots } from '#lib/layout/field.ts';
import { fillPlan, orphans } from './farmSheet.ts';

const D = '2026-11-04';
const MINE = fieldPlots({ id: 'field-A', x: 10, z: 17, s: 'a-10x4' }), HERS = fieldPlots({ id: 'field-B', x: 10, z: 22, s: 'b-10x4' });
const PLOTS = [...MINE, ...HERS];
/** A farm with `n` of my plots planted on `d` (reading order) and `m` of hers. */
function farmOf(n: number, m = 0, d = D): Farm {
  const f = emptyFarm();
  const plant = (ts: typeof MINE, k: number) => ts.slice(0, k).map((t) => ({ o: 'plant' as const, p: t.p, c: 'tomato' as const, src: 'start' as const }));
  if (n) farmStep(f, 'A', { d, ops: plant(MINE, n) });
  if (m) farmStep(f, 'B', { d, ops: plant(HERS, m) });
  return f;
}

describe('fillPlan', () => {
  const at = (c: number, r: number) => plotOf('field-A', c, r);
  it('my empty plots as the map reads them: each field’s back row first (its top), left to right, as many as I hold', () => {
    expect(fillPlan(PLOTS, emptyFarm(), 'A', 4)).toEqual([at(0, 3), at(1, 3), at(2, 3), at(3, 3)]);
    // the row below follows the back row's last column
    const f = emptyFarm();
    farmStep(f, 'A', { d: D, ops: Array.from({ length: 9 }, (_, i) => ({ o: 'plant' as const, p: at(i, 3), c: 'tomato' as const, src: 'start' as const })) });
    expect(fillPlan(PLOTS, f, 'A', 2)).toEqual([at(9, 3), at(0, 2)]);
    // the front row (row 0, nearest the beach) last
    expect(fillPlan(PLOTS, farmOf(3), 'A', 99).slice(-7)).toEqual([3, 4, 5, 6, 7, 8, 9].map((c) => at(c, 0)));
    expect(fillPlan(PLOTS, farmOf(3), 'A', 0)).toEqual([]);
  });
  it('up to the cap (counting plants off the field), never past the field', () => {
    expect(fillPlan(PLOTS, farmOf(FARM.cap), 'A', 99)).toEqual([]);
    expect(fillPlan(PLOTS, farmOf(0), 'A', 99)).toHaveLength(FARM.cap);
    expect(FARM.cap).toBeLessThanOrEqual(FARM.batchMax);
    const f = farmOf(30);
    farmStep(f, 'A', { d: D, ops: Array.from({ length: 8 }, (_, i) => ({ o: 'plant' as const, p: plotOf('gone', i, 0), c: 'carrot' as const, src: 'start' as const })) });
    expect(fillPlan(PLOTS, f, 'A', 99)).toEqual(MINE.slice(30, 32).map((t) => t.p));
    // a small field: its plots, no more
    expect(fillPlan(fieldPlots({ id: 'small', x: 0, z: 0, s: 'a-2x2' }), emptyFarm(), 'A', 99)).toHaveLength(4);
  });
  it('the partner’s field is never mine to plant', () => {
    expect(fillPlan(HERS, emptyFarm(), 'A', 9)).toEqual([]);
  });
});

describe('orphans', () => {
  it('my plants no field covers; the partner’s and the covered ones aren’t', () => {
    const f = farmOf(2, 1);
    farmStep(f, 'A', { d: D, ops: [{ o: 'plant', p: plotOf('gone', 0, 0), c: 'carrot', src: 'start' }] });
    farmStep(f, 'B', { d: D, ops: [{ o: 'plant', p: plotOf('gone', 1, 0), c: 'carrot', src: 'start' }] });
    expect(orphans(f, 'A', PLOTS)).toEqual([plotOf('gone', 0, 0)]);
    expect(orphans(f, 'A', [])).toHaveLength(3);
  });
});
