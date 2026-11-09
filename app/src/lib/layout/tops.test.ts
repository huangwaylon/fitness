import { describe, expect, test } from 'vitest';
import { defaultLayout, fromJson, layoutOf, opsBetween, toJson, withChanges, type Layout, type Obj } from './model.ts';
import { kindDef } from './catalog.ts';
import { blockBox, navOf } from './nav.ts';
import { validate } from './validate.ts';
import { carryTops, isSmallKind, isSurfaceKind, kidsOf, parentOf, roomOf, seat, slotAt, surfaceAt, tileOfSlot, topOf, topSpot, topWhy } from './tops.ts';
import { ITEMS } from '../components/tent/items.ts';
import ASSETS from '../components/world3d/assets.json' with { type: 'json' };
import { placeObjects } from '../components/world3d/objects.ts';
import { move, objectAt, remove, rotate } from '../components/editor/edits.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

const T0 = 1_800_000_000_000;
const SURFACES = ['folding-table', 'outdoor-table', 'outdoor-kitchen', 'outdoor-bench', 'utility-wagon', 'log-stool', 'upright-locker', 'iron-table'];
const table: Obj = { id: 'otable', k: 'outdoor-table', x: 5, z: 12, f: 0 };
const kettle: Obj = { id: 'okettle', k: 'kettle', x: 6, z: 12, f: 0, on: 'otable' };
const lantern: Obj = { id: 'olantern', k: 'lantern', x: 5, z: 12, f: 1, on: 'otable' };
const at = (...os: Obj[]): Layout => withChanges(defaultLayout(), { set: os });

describe('the island\'s table tops (layout/tops.ts)', () => {
  test('each surface\'s top is its room piece\'s (the same NH model: tent/items.json), its slots all its tiles', () => {
    for (const k of SURFACES) {
      const def = kindDef(k)!, t = topOf(k)!, room = roomOf(k);
      expect(isSurfaceKind(k), k).toBe(true);
      if (room) {
        const m = ITEMS[room];
        expect(m?.s, k).toBe(1);
        expect([m.w, m.d, m.sy, m.st], k).toEqual([def.w, def.d, t.sy, t.st]);
        expect(!m.sl || m.sl.length === m.w * m.d, k).toBe(true);
      } else {
        // (the iron garden table has no room piece: its model's top)
        const b = (ASSETS as unknown as { models: Record<string, { max: number[] }> }).models[`decor/${k}`];
        expect(Math.abs(b.max[1] - t.sy), k).toBeLessThan(0.1);
      }
    }
    // the small things: one tile each, never a surface; the food, the kettles, the lantern, the radio among them
    for (const k of ['bread', 'cookies', 'japanese-meal', 'kettle', 'simple-kettle', 'lantern', 'portable-radio']) expect(isSmallKind(k) && kindDef(k)?.w === 1 && kindDef(k)?.d === 1, k).toBe(true);
    expect(isSmallKind('outdoor-table') || isSurfaceKind('kettle') || isSmallKind('picnic-set')).toBe(false);
  });

  test('a slot is a tile of the surface\'s footprint, turned with it', () => {
    for (const f of [0, 1, 2, 3] as const) {
      const t = { ...table, f }, l = at(t);
      const tiles = [tileOfSlot(l, t, 0, 0), tileOfSlot(l, t, 1, 0)];
      expect(tiles.map(([c, r]) => `${c},${r}`).sort()).toEqual(f % 2 ? ['5,12', '5,13'] : ['5,12', '6,12']);
      for (const [sx, sz] of [[0, 0], [1, 0]] as const) expect(slotAt(l, t, ...tileOfSlot(l, t, sx, sz))).toEqual([sx, sz]);
      expect(slotAt(l, t, 7, 12)).toBeNull();
    }
    // turned half round, its slots swap ends
    expect(tileOfSlot(at({ ...table, f: 2 }), { ...table, f: 2 }, 0, 0)).toEqual([6, 12]);
  });

  test('a thing on a table stands on its top: over its tile, at the top\'s height; its table gone, on the ground', () => {
    const l = at(table, kettle);
    expect(parentOf(l, l.objects.get('okettle')!)?.id).toBe('otable');
    const s = topSpot(l, kettle)!;
    expect(s.lift).toBeCloseTo(7.2 * 3);
    // (its tile's middle, the right one of the table's two: 15u right of the table's middle, on its top's rectangle)
    expect(s.x).toBeCloseTo(-90 + 6 * 30 + 15, 0);
    expect(s.z).toBeCloseTo(-90 + 12 * 30 + 15, 0);
    expect(topSpot(at(kettle), kettle)).toBeNull();
    // a thing that isn't small, or a piece that's no surface, stands on the ground
    expect(parentOf(at(table, { ...kettle, k: 'barbecue' }), { ...kettle, k: 'barbecue' })).toBeNull();
    expect(parentOf(at({ ...table, k: 'barbecue' }, kettle), kettle)).toBeNull();
  });

  test('which top a tap is on, whether its slot is free, and a small thing seated there', () => {
    const l = at(table, kettle);
    expect(surfaceAt(l, 5, 12)?.id).toBe('otable');
    expect(surfaceAt(l, 7, 12)).toBeNull();
    expect(topWhy(l, table, 6, 12, null)).toBe('taken');
    expect(topWhy(l, table, 6, 12, 'okettle')).toBeNull();
    expect(topWhy(l, table, 5, 12, null)).toBeNull();
    expect(seat(l, { id: 'n', k: 'bread', x: 5, z: 12, f: 0 }).on).toBe('otable');
    expect(seat(l, { id: 'n', k: 'bread', x: 6, z: 12, f: 0 }).on).toBeUndefined();
    expect(seat(l, { id: 'n', k: 'barbecue', x: 5, z: 12, f: 0 }).on).toBeUndefined();
    expect(seat(l, { ...kettle, x: 8 }).on).toBeUndefined();
  });

  test('a table moved or turned carries what\'s on it; put away, those go too', () => {
    const l = at(table, kettle, lantern);
    const moved = carryTops(l, move(l, ['otable'], 2, 3));
    expect(moved.objects.get('okettle')).toMatchObject({ x: 8, z: 15, on: 'otable' });
    expect(moved.objects.get('olantern')).toMatchObject({ x: 7, z: 15, on: 'otable' });
    const turned = carryTops(l, rotate(l, ['otable']));
    expect(kidsOf(turned, 'otable').map((k) => [k.x, k.z, k.f]).sort()).toEqual([[5, 12, 2], [5, 13, 1]].sort());
    for (const k of kidsOf(turned, 'otable')) expect(parentOf(turned, k)?.id).toBe('otable');
    const gone = carryTops(l, remove(l, ['otable']));
    expect(gone.objects.has('okettle') || gone.objects.has('olantern')).toBe(false);
    // the table and its things moved together: the same
    expect(carryTops(l, move(l, ['otable', 'okettle', 'olantern'], 2, 3)).objects.get('okettle')).toMatchObject({ x: 8, z: 15 });
    // a thing moved off on its own: on the ground; onto the free tile, on the top
    expect(move(l, ['okettle'], 3, 0).objects.get('okettle')?.on).toBeUndefined();
    const two = at(table, kettle);
    expect(move(two, ['okettle'], -1, 0).objects.get('okettle')).toMatchObject({ x: 5, on: 'otable' });
    // a tap on the table's tile picks what's on it (the topmost), not the table
    expect(objectAt(l, 6, 12)?.id).toBe('okettle');
    expect(objectAt(at(table), 6, 12)?.id).toBe('otable');
  });

  test('what\'s on a top blocks no walk, overlaps nothing; a bench with things on it is no seat', () => {
    const l = at(table, kettle);
    expect(blockBox(l, kettle)).toBeNull();
    expect(validate(l).filter((i) => i.ids.includes('okettle'))).toEqual([]);
    const bench: Obj = { id: 'obench', k: 'outdoor-bench', x: 5, z: 14, f: 0 };
    const seats = (x: Layout) => Object.keys(navOf(x).named).filter((n) => n.startsWith('seat-obench'));
    expect(seats(at(bench)).length).toBe(2);
    expect(seats(at(bench, { id: 'obread', k: 'bread', x: 5, z: 14, f: 0, on: 'obench' }))).toEqual([]);
  });

  test('saved and synced: the ops carry `on`, the record\'s layout and the JSON keep it', () => {
    const l = at(table, kettle);
    const ops = opsBetween(defaultLayout(), l, T0);
    expect(ops.find((o) => o.id === 'okettle')).toMatchObject({ sc: 'o', k: 'kettle', x: 6, z: 12, on: 'otable' });
    const back = layoutOf(ops.map((o) => ({ ...o, who: 'A' }) as LayoutEntry));
    expect(back.objects.get('okettle')?.on).toBe('otable');
    expect(fromJson(JSON.parse(JSON.stringify(toJson(l))))?.objects.get('okettle')?.on).toBe('otable');
    // taken off the top: one op, its `on` gone
    const off = withChanges(l, { set: [{ ...kettle, x: 8, on: undefined }] });
    expect(opsBetween(l, off, T0)).toEqual([{ sc: 'o', id: 'okettle', at: T0, k: 'kettle', x: 8, z: 12, f: 0 }]);
  });

  test('the 3D island draws it on its table\'s top, at the table\'s drawn scale, its light there too', () => {
    const l = at(table, kettle, lantern);
    const { insts } = placeObjects(l, { season: 'autumn', foliage: 'green', month: 11 });
    const t = insts.find((i) => i.id === 'otable')!, k = insts.find((i) => i.id === 'okettle')!, n = insts.find((i) => i.id === 'olantern')!;
    expect(k.lift).toBeCloseTo(7.2 * t.scale);
    expect(n.lift).toBeCloseTo(7.2 * t.scale);
    expect(Math.hypot(k.x - n.x, k.z - n.z)).toBeCloseTo(10 * t.scale, 0);
    // a table of every surface kind: what's on it stands at its top's height, the stool's at its own scale
    for (const sk of SURFACES) {
      const p: Obj = { id: 'op', k: sk, x: 5, z: 12, f: 0 }, b: Obj = { id: 'ob', k: 'bread', x: 5, z: 12, f: 0, on: 'op' };
      const all = placeObjects(at(p, b), { season: 'autumn', foliage: 'green', month: 11 }).insts;
      const pi = all.find((i) => i.id === 'op')!, bi = all.find((i) => i.id === 'ob')!;
      expect(bi.lift, sk).toBeCloseTo(topOf(sk)!.sy * pi.scale);
      expect(pi.scale, sk).toBeGreaterThan(2.5);
    }
  });
});
