// The island's buildings on an arranged island (layout/buildings.ts): the museum, new to the catalogue, moved once to
// the free spot nearest its default when its default spot is taken.
import { describe, expect, test } from 'vitest';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { buildingOps } from './buildings.ts';
import { defaultLayout, layoutOf } from './model.ts';
import { validate } from './validate.ts';

const merged = (extra: LayoutEntry[] = []) => {
  const m = new Map<string, LayoutEntry>();
  for (const { who, ...r } of RECORD as Record<string, unknown>[]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  for (const e of extra) mergeLayout(m, e);
  return m;
};
const AT = 1.8e12;

describe('the museum on an arranged island', () => {
  test('the default holds it at the back, on the clifftop, with no op needed', () => {
    const l = defaultLayout();
    expect(l.objects.get('museum')).toMatchObject({ k: 'museum', x: 6, z: 54, f: 0 });
    expect(validate(l).filter((i) => i.level === 'error')).toEqual([]);
    expect(buildingOps(new Map(), 'A', AT)).toEqual([]);
  });
  test('on the record’s island (its own cedars on the clifftop) one op puts it on the nearest free spot, valid', () => {
    const m = merged();
    expect(validate(layoutOf(m)).some((i) => i.ids.includes('museum'))).toBe(true);
    const ops = buildingOps(m, 'B', AT);
    expect(ops).toEqual([{ sc: 'o', id: 'museum', at: AT, k: 'museum', x: 8, z: 46, f: 0 }]);
    for (const op of ops) mergeLayout(m, { ...op, who: 'B' } as LayoutEntry);
    expect(validate(layoutOf(m)).filter((i) => i.level === 'error')).toEqual([]);
    // once is enough: its op is there now
    expect(buildingOps(m, 'B', AT + 10)).toEqual([]);
  });
  test('never from the guest; never over a move of its own (even one that stands wrong)', () => {
    expect(buildingOps(merged(), 'G', AT)).toEqual([]);
    const moved = { sc: 'o', id: 'museum', at: AT, k: 'museum', x: 0, z: 0, f: 0, who: 'A' } as LayoutEntry;
    expect(buildingOps(merged([moved]), 'A', AT + 1)).toEqual([]);
  });
});
