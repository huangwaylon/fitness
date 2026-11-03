// The user's island as the record has it (2026-11-03: the editor's afternoon, anonymised: the new pieces' ids and the
// times shifted), folded as the phones fold it, and what the 3D island draws of it ("trees or bushes are sometimes
// missing"): every plain oak and every month's bush and hedge stood invisible on the phones (their look's key, `oak`
// and `month-bush-a|b`, has no model: placeObjects made a card of 2D art the 3D island never loads), and the
// decorations' kinds were cards (the brick well floated over the campfire in front of it).
import { describe, expect, test } from 'vitest';
import RECORD from '#lib/layout/record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { buildingOps } from '#lib/layout/buildings.ts';
import { defaultLayout, layoutOf } from '#lib/layout/model.ts';
import { validate } from '#lib/layout/validate.ts';
import { placeObjects } from './objects.ts';
import { phoneDays, undrawn } from './drawCheck.ts';
import { modelBounds } from './models3d.ts';

const entries = (RECORD as Record<string, unknown>[]).map((r) => {
  const { who, ...d } = r;
  const op = layoutOpOf(d);
  return op ? ({ ...op, who } as LayoutEntry) : null;
});
/** The record's island, the museum and the shop put on their free spots once as a member's phone does (layout/buildings.ts). */
const record = () => {
  const m = new Map<string, LayoutEntry>();
  for (const e of entries) if (e) mergeLayout(m, e);
  for (const op of buildingOps(m, 'A', 1.8e12)) mergeLayout(m, { ...op, who: 'A' } as LayoutEntry);
  return layoutOf(m);
};

describe("the record's layout", () => {
  test('every op is well-formed (the kind-less ones are removals) and the fold is what the editor made', () => {
    expect(entries.every(Boolean)).toBe(true);
    const ops = entries as LayoutEntry[];
    expect(ops.filter((e) => e.sc === 'o' && !('k' in e)).every((e) => 'rm' in e && e.rm)).toBe(true);
    const l = record();
    const count = (k: string) => [...l.objects.values()].filter((o) => o.k === k).length;
    expect(l.objects.size).toBe(121); // (the museum and the shop among them, a flower cleared for the museum)
    expect([count('oak'), count('cedar'), count('bush'), count('hedge'), count('flower')]).toEqual([4, 8, 7, 0, 55]);
    expect(validate(l).filter((i) => i.level === 'error')).toEqual([]);
  });

  test('any order folds to the same island (the merge is commutative)', () => {
    const a = layoutOf(entries as LayoutEntry[]), ops = [...(entries as LayoutEntry[])].reverse();
    const b = layoutOf(ops);
    expect([...b.objects.values()].sort((x, y) => (x.id < y.id ? -1 : 1))).toEqual([...a.objects.values()].sort((x, y) => (x.id < y.id ? -1 : 1)));
    expect(b.codes).toEqual(a.codes);
  });

  test("every oak and bush is a model on the phones, in every season (the island's scenery looks passed in)", () => {
    const l = record();
    for (const day of phoneDays(l)) {
      const { insts, standins } = placeObjects(l, day);
      const drawn = new Map(insts.map((i) => [i.id, i.model]));
      for (const o of l.objects.values())
        if (['oak', 'cedar', 'palm', 'bamboo', 'bush', 'hedge', 'flower'].includes(o.k)) {
          expect(drawn.get(o.id), `${o.id} (${o.k}) in ${day.season}`).toBeTruthy();
          expect(modelBounds(drawn.get(o.id)!), `${o.id}'s model`).toBeTruthy();
        }
      // (the bulletin board's card is its own DOM node's model: board.ts)
      expect(standins.map((s) => s.id).filter((id) => id !== 'board')).toEqual([]);
      // an oak in winter is NH's snowy one, the season's otherwise
      expect(drawn.get('oak-m1')).toBe({ spring: 'oak-spring', summer: 'oak-summer', autumn: 'oak-fall', winter: 'trees/oak-winter' }[day.season]);
    }
  });

  test("the brick well and the tanuki are NH's models (no card to float over the campfire in front)", () => {
    const l = record(), { insts } = placeObjects(l, phoneDays(l)[2]);
    const well = [...l.objects.values()].find((o) => o.k === 'brick-well')!;
    expect(insts.find((i) => i.id === well.id)?.model).toBe('decor/brick-well');
    expect(insts.find((i) => i.id === 'm-dfix040')?.model).toBe('decor/tanuki');
  });

  test('the consistency check finds nothing undrawn on it, nor on the default', () => {
    expect(undrawn(record())).toEqual([]);
    expect(undrawn(defaultLayout())).toEqual([]);
  });
});

describe('the consistency check (/editor/?check)', () => {
  test('names a kind it has no idea of, and a card', () => {
    const l = layoutOf([{ sc: 'o', id: 'ogazebo1', at: 1.8e12, k: 'gazebo', x: 8, z: 20, f: 0, who: 'A' }]);
    expect(undrawn(l)).toEqual([expect.objectContaining({ id: 'ogazebo1', why: 'unknown-kind', seasons: ['spring', 'summer', 'autumn', 'winter'] })]);
    // a swap to a look with no model falls back to the kind's own model, never to nothing
    const d = defaultLayout(), oak = [...d.objects.values()].find((o) => o.k === 'oak')!;
    const { insts } = placeObjects(d, { season: 'summer', foliage: 'summer', month: 7, swaps: { [oak.id]: { key: 'trees/no-such-tree', h: 90 } } });
    expect(insts.find((i) => i.id === oak.id)?.model).toBe('oak-summer');
  });
});
