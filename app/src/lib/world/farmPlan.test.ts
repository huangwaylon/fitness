// The fields read whole (world/farmPlan.ts), over two 10 × 4 fields.
import { describe, expect, it } from 'vitest';
import { emptyFarm, farmStep, plotOf, type Farm } from '#lib/contract/farm.ts';
import { fieldPlots } from '#lib/layout/field.ts';
import { freePlots, orphans } from './farmPlan.ts';

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
