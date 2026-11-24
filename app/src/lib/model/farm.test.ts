// The fields as the phones fold them (model/farm.ts farmOfState): the State's farm rows by contract/farm.ts farmStep, a
// kept row as kept, a queued one judged. A list that starts with the rows the last fold had folds on from them (a tap,
// a poll), with the same field as a fold from the start.
import { describe, expect, it, vi } from 'vitest';
import { emptyFarm, farmJson, type FarmData, type FarmOp } from '#lib/contract/farm.ts';
import type { Who } from '#lib/types.ts';
import type { FarmRow } from './farm.ts';

const steps = vi.hoisted(() => ({ n: 0 }));
vi.mock('#lib/contract/farm.ts', async (orig) => {
  const m = await orig<typeof import('#lib/contract/farm.ts')>();
  return { ...m, farmStep: (...a: Parameters<typeof m.farmStep>) => (steps.n++, m.farmStep(...a)) };
});
const { farmStep } = await import('#lib/contract/farm.ts');
const { farmOfState } = await import('./farm.ts');

const islandDays = [{ data: { date: '2026-11-05', watered: ['fd:f.0.0', 'fd:f.1.0'] } }], wet = ['2026-11-09'], farmWater: { p: string; date: string }[] = [];
/** The fold from the start, as farmOfState did before it kept one. */
function whole(rows: readonly FarmRow[]) {
  const f = emptyFarm();
  const watered = (p: string, d: string) => wet.includes(d) || islandDays.some((x) => x.data.date === d && x.data.watered.includes(p));
  for (const r of rows) farmStep(f, r.person, r.data, r.queued ? { watered, pocket: () => Infinity } : undefined);
  return farmJson(f);
}

/** Seeded rows: plants, harvests and digs on 6 plots by two people over days from 2026-11-01. */
function rowsOf(n: number, seed = 7): FarmRow[] {
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  return Array.from({ length: n }, (_, i): FarmRow => {
    const d = `2026-11-${String(1 + Math.floor(i / 3)).padStart(2, '0')}`;
    const ops = Array.from({ length: 1 + Math.floor(rand() * 3) }, (): FarmOp => {
      const p = `fd:f.${Math.floor(rand() * 6)}.0`, k = rand();
      return k < 0.5 ? { o: 'plant', p, c: 'tomato', src: 'start' } : k < 0.8 ? { o: 'harvest', p, n: 2 } : { o: 'dig', p };
    });
    return { at: i, person: (rand() < 0.5 ? 'A' : 'B') as Who, data: { d, ops } as FarmData };
  });
}

describe('farmOfState', () => {
  it('folds on from the rows it last folded: a tap folds its queued row only, a poll its new rows; the field as a whole fold', () => {
    const all = rowsOf(60);
    const queued = (k: number): FarmRow => ({ at: 100 + k, person: 'A', data: { d: '2026-11-21', ops: [{ o: 'plant', p: `fd:f.${k % 6}.0`, c: 'tomato', src: 'start' }] }, queued: true });
    for (let k = 1; k <= all.length; k += 7) {
      const kept = all.slice(0, k);
      for (const list of [kept, [...kept, queued(k)], [...kept, queued(k + 1)]]) {
        steps.n = 0;
        const got = farmJson(farmOfState({ farm: list, islandDays, wet, farmWater }));
        const folded = steps.n;
        expect(got).toEqual(whole(list));
        // (k > 1: the kept rows up to the last list's folded already; each list here a new array)
        if (k > 1) expect(folded).toBe(list === kept ? 7 : list.length - k);
      }
    }
  });

  it('a list of other rows (a whole reduce, another person) folds from the start', () => {
    const a = rowsOf(30, 1), b = rowsOf(30, 2);
    farmOfState({ farm: a, islandDays, wet, farmWater });
    // and the same rows as new objects (a reduce of the same sheet)
    for (const list of [b, b.map((r) => ({ ...r }))]) {
      steps.n = 0;
      const got = farmJson(farmOfState({ farm: list, islandDays, wet, farmWater }));
      expect(steps.n).toBe(30);
      expect(got).toEqual(whole(b));
    }
  });

  it('never changes the field it folded on from (a later fold of a longer list leaves the earlier result as it was)', () => {
    const all = rowsOf(40, 3);
    const first = farmOfState({ farm: all.slice(0, 20), islandDays, wet, farmWater });
    const before = farmJson(first);
    farmOfState({ farm: all, islandDays, wet, farmWater });
    farmOfState({ farm: [...all.slice(0, 20), { ...all[20], queued: true }], islandDays, wet, farmWater });
    expect(farmJson(first)).toEqual(before);
  });

  it('a kept harvest stays at its kept n; a queued one is reckoned by the watering rule (its plant day watered)', () => {
    // planted 11-05 (watered that day: islandDays), ripe 11-06
    const plant: FarmRow = { at: 1, person: 'A', data: { d: '2026-11-05', ops: [{ o: 'plant', p: 'fd:f.0.0', c: 'carrot', src: 'start' }] } };
    const harvest = (queued?: true): FarmRow => ({ at: 2, person: 'A', data: { d: '2026-11-06', ops: [{ o: 'harvest', p: 'fd:f.0.0', n: 1 }] }, ...(queued && { queued }) });
    expect(farmOfState({ farm: [plant, harvest()], islandDays, wet, farmWater }).net.A?.get('goods:carrot')).toBe(1);
    expect(farmOfState({ farm: [plant, harvest(true)], islandDays, wet, farmWater }).net.A?.get('goods:carrot')).toBe(3);
  });

  it('a plot\'s farm_water stands for its island day once that is gone (the record keeps only yesterday\'s and today\'s)', () => {
    // planted 11-07, ripe 11-08, harvested (queued) 11-20: no island day of 11-07 left
    const plant: FarmRow = { at: 1, person: 'A', data: { d: '2026-11-07', ops: [{ o: 'plant', p: 'fd:f.2.0', c: 'carrot', src: 'start' }] } };
    const harvest: FarmRow = { at: 2, person: 'A', data: { d: '2026-11-20', ops: [{ o: 'harvest', p: 'fd:f.2.0', n: 1 }] }, queued: true };
    const n = (fw: { p: string; date: string }[]) => farmOfState({ farm: [plant, harvest], islandDays: [], wet: [], farmWater: fw }).net.A?.get('goods:carrot');
    expect(n([])).toBe(1);
    expect(n([{ p: 'fd:f.2.0', date: '2026-11-07' }])).toBe(3);
    // another plot's, or the plot's of another day (an earlier plant's): no
    expect(n([{ p: 'fd:f.3.0', date: '2026-11-07' }, { p: 'fd:f.2.0', date: '2026-11-06' }])).toBe(1);
  });
});
