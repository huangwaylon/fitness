// The river path editor's core (riverPath.ts): the main river as knots and back, the level designer's rules, the
// paint (old tiles back to land, things moved aside, the bridge re-placed), and the guard for the island's caches (a
// river edit rides the tiles only: the ground's keys change with it, nothing else to invalidate).
import { afterEach, describe, expect, test } from 'vitest';
import { GRID, codeOf, idx, kindOf, tierOf, tileMid } from './grid.ts';
import { Layout, defaultLayout, objTiles, opsBetween, withChanges, type Obj } from './model.ts';
import { validate } from './validate.ts';
import { riverStems } from './river.ts';
import { fieldsKey } from './fieldsCache.ts';
import { meshKeyOf } from './mesh.ts';
import { worldOf } from '#lib/world/layoutWorld.ts';
import * as W from '#lib/world/world.ts';
import { waterAt } from '#lib/world/critterBits.ts';
import { applyPath, pathOf, pullEnd, pullStart, route, type Knot, type RiverIssue, type RiverPath } from './riverPath.ts';

const at = (i: number): [number, number] => [i % GRID.cols, Math.floor(i / GRID.cols)];
const kinds = (is: RiverIssue[], level?: 'red' | 'amber') => is.filter((i) => !level || i.level === level).map((i) => i.kind);
const K = (c: number, r: number, pin?: 'fall'): Knot => ({ c, r, ...(pin ? { pin } : {}) });

/** A plain island: grass on rows 3…56, columns 2…17 (the sea round it), rows `cliff`+ a tier up; river on `river`. */
function island(o: { cliff?: number; river?: [number, number][]; pond?: [number, number][]; objects?: Obj[] } = {}): Layout {
  const codes = new Uint8Array(GRID.cols * GRID.rows);
  for (let r = 3; r <= 56; r++) for (let c = 2; c <= 17; c++) codes[idx(c, r)] = codeOf('grass', o.cliff !== undefined && r >= o.cliff ? 1 : 0);
  const tierAt = (c: number, r: number) => tierOf(codes[idx(c, r)]);
  for (const [c, r] of o.river ?? []) codes[idx(c, r)] = codeOf('river', tierAt(c, r));
  for (const [c, r] of o.pond ?? []) codes[idx(c, r)] = codeOf('pond', tierAt(c, r));
  return new Layout(codes, new Map((o.objects ?? []).map((x) => [x.id, x])), defaultLayout().homes);
}
const line = (c0: number, r0: number, c1: number, r1: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let c = c0, r = r0; ; c += Math.sign(c1 - c0), r += Math.sign(r1 - r0)) {
    out.push([c, r]);
    if (c === c1 && r === r1) return out;
  }
};

describe('the default river, as knots and back', () => {
  const L = defaultLayout();
  const p = pathOf(L)!;
  test('one path from its spring to the sea, its knots both ends and the fall pinned', () => {
    expect(at(p.tiles[0])).toEqual([15, 54]);
    expect(at(p.tiles.at(-1)!)).toEqual([2, 24]);
    expect(p.tiles.length).toBe(44);
    expect(p.knots[0]).toEqual(K(15, 54));
    expect(p.knots.at(-1)).toEqual(K(2, 24));
    expect(p.knots.filter((k) => k.pin)).toEqual([K(15, 53, 'fall'), K(15, 52, 'fall')]);
    expect(p.seg.map((i) => at(p.tiles[i]))).toEqual(p.knots.map((k) => [k.c, k.r]));
  });
  test('round trip: routed untouched and painted, the very same tiles, nothing moved, no issue', () => {
    const r = route(p.knots, p, L);
    expect(r.tiles).toEqual(p.tiles);
    expect(r.issues).toEqual([]);
    const a = applyPath(L, p, r);
    expect([...a.layout.codes]).toEqual([...L.codes]);
    expect(a.moved).toEqual([]);
    expect(a.bridges).toEqual([]);
    expect(opsBetween(L, a.layout, 1)).toEqual([]);
  });
  test('the knots re-routed by spline (no base) still give the same river', () => {
    const r = route(p.knots, null, L, p);
    expect(kinds(r.issues, 'red')).toEqual([]);
    expect(r.tiles.length).toBeGreaterThanOrEqual(40);
  });
});

describe('the end moved to the east coast', () => {
  const L = defaultLayout();
  const p = pathOf(L)!;
  // down column 15 past where it turned, out to the beach at (16, 20)
  const knots = [K(15, 54), K(15, 53, 'fall'), K(15, 52, 'fall'), K(15, 20), K(16, 20)];
  const r = route(knots, p, L);
  const a = applyPath(L, p, r);
  const after = a.layout;
  test('one stem down to the sea, no red, validate no new error', () => {
    expect(kinds(r.issues, 'red')).toEqual([]);
    expect(at(r.tiles.at(-1)!)).toEqual([16, 20]);
    const stems = riverStems(after), covered = new Set(stems.flatMap((s) => s.tiles));
    expect(r.tiles.filter((i) => covered.has(i)).length / r.tiles.length).toBeGreaterThanOrEqual(0.7);
    const errs = (l: Layout) => new Set(validate(l).filter((i) => i.level === 'error').map((i) => `${i.code}|${i.ids.join(',')}`));
    const before = errs(L);
    expect([...errs(after)].filter((e) => !before.has(e))).toEqual([]);
  });
  test('the old tiles back to land: the path across the old ford dirt, the beach sand, the lawn grass', () => {
    expect(kindOf(after.codes[idx(9, 24)])).toBe('dirt');
    expect(kindOf(after.codes[idx(2, 24)])).toBe('sand');
    expect(kindOf(after.codes[idx(5, 24)])).toBe('grass');
    expect(kindOf(after.codes[idx(14, 26)])).toBe('grass');
    // (the broad mouth's extra tiles go with it; the stub at (14, 40) on a kept tile stays)
    expect(kindOf(after.codes[idx(2, 23)])).not.toBe('river');
    expect(kindOf(after.codes[idx(14, 40)])).toBe('river');
    for (const i of r.tiles) expect(kindOf(after.codes[i])).toBe('river');
    // (the tiers never change)
    for (let i = 0; i < L.codes.length; i++) expect(tierOf(after.codes[i])).toBe(tierOf(L.codes[i]));
  });
  test('the bridge moved across the new water, turned', () => {
    expect(a.bridges).toEqual([{ id: 'bridge', x: 14, z: 24, f: 1 }]);
    const b = after.objects.get('bridge')!;
    expect(objTiles(after, b).map(([c, r]) => kindOf(after.codes[idx(c, r)]))).toEqual(['grass', 'river', 'sand']);
    expect(validate(after).filter((i) => i.code === 'bridge')).toEqual([]);
  });
  test('deterministic: the same ops on both phones', () => {
    const again = applyPath(L, pathOf(L)!, route(knots, pathOf(L)!, L)).layout;
    expect(opsBetween(L, again, 500)).toEqual(opsBetween(L, after, 500));
    expect(opsBetween(L, after, 500).every((o) => o.sc === 'c' || o.sc === 'o')).toBe(true);
  });
  describe('for the island (fitness-59): the ground keys follow the tiles, the world reads the new river', () => {
    afterEach(() => W.setWorld(null));
    test('fieldsKey and meshKeyOf change', () => {
      expect(fieldsKey(after, 'code')).not.toBe(fieldsKey(L, 'code'));
      expect(meshKeyOf(after)).not.toBe(meshKeyOf(L));
    });
    test("worldOf's river line on the new tiles; a cast at the new end is the mouth's", () => {
      const g = worldOf(after);
      const [ex, ez] = tileMid(16, 20);
      expect(g.RIVER.some(([x, z]) => Math.hypot(x - ex, z - ez) < 31)).toBe(true);
      expect(g.RIVER.some(([x, z]) => Math.hypot(x - tileMid(5, 24)[0], z - tileMid(5, 24)[1]) < 20)).toBe(false);
      W.setWorld(g);
      expect(waterAt(ex, ez)).toBe('mouth');
    });
  });
});

describe('the rules: red blocks the save', () => {
  test('a straight fall down a cliff: fine', () => {
    const l = island({ cliff: 40 });
    const r = route([K(10, 50), K(10, 34), K(10, 30), K(2, 30)], null, l);
    expect(r.issues).toEqual([]);
  });
  test('uphill', () => {
    const l = island({ cliff: 40, pond: [[10, 52]] });
    const r = route([K(2, 30), K(10, 30), K(10, 51)], null, l);
    expect(kinds(r.issues, 'red')).toContain('uphill');
  });
  test('a fall slanted across its cliff', () => {
    const l = island({ cliff: 40 });
    const r = route([K(12, 46), K(12, 40), K(8, 40), K(8, 39), K(2, 39)], null, l);
    expect(kinds(r.issues, 'red')).toContain('fall');
  });
  test('along a cliff edge', () => {
    const l = island({ cliff: 40 });
    const r = route([K(15, 46), K(15, 40), K(6, 40), K(6, 39, 'fall'), K(6, 38, 'fall'), K(6, 30), K(2, 30)], null, l);
    expect(kinds(r.issues, 'red')).toContain('cliff-edge');
  });
  test('touching itself', () => {
    const l = island();
    const r = route([K(5, 30), K(5, 12), K(6, 12), K(6, 29), K(17, 29)], null, l);
    expect(kinds(r.issues, 'red')).toContain('self');
  });
  test('inner tiles by the sea or a pond', () => {
    const coast = route([K(2, 40), K(2, 20), K(6, 20)], null, island());
    expect(kinds(coast.issues, 'red')).toContain('water');
    const l = island({ pond: [[8, 20]] });
    const r = route([K(9, 30), K(9, 10), K(2, 10)], null, l);
    expect(r.issues.find((i) => i.kind === 'water')?.tiles).toEqual([idx(9, 20)]);
  });
  test('through a fixed thing or a field', () => {
    const rock: Obj = { id: 'rock1', k: 'rock', x: 9, z: 20, f: 0 };
    const field: Obj = { id: 'field1', k: 'field', x: 8, z: 14, f: 0, s: 'a-3x2' };
    const l = island({ objects: [rock, field] });
    const r = route([K(9, 30), K(9, 10), K(2, 10)], null, l);
    const b = r.issues.find((i) => i.kind === 'blocked')!;
    expect(b.level).toBe('red');
    expect(b.ids.sort()).toEqual(['field1', 'rock1']);
  });
  test('too short; no outlet at the end', () => {
    expect(kinds(route([K(5, 5), K(5, 6)], null, island()).issues, 'red')).toContain('length');
    expect(kinds(route([K(9, 30), K(9, 20)], null, island()).issues, 'red')).toContain('end');
  });
});

describe('amber: noted, and done for you', () => {
  test('a tree on the path moves to the nearest clear tile', () => {
    const oak: Obj = { id: 'oak1', k: 'oak', x: 9, z: 20, f: 0 };
    const l = island({ objects: [oak] });
    const r = route([K(9, 30), K(9, 10), K(2, 10)], null, l);
    expect(r.issues.find((i) => i.kind === 'moved')).toMatchObject({ level: 'amber', ids: ['oak1'] });
    const a = applyPath(l, null, r);
    expect(a.moved).toHaveLength(1);
    const o = a.layout.objects.get('oak1')!;
    expect(kindOf(a.layout.codes[idx(o.x, o.z)])).toBe('grass');
    expect(Math.abs(o.x - 9) + Math.abs(o.z - 20)).toBeLessThanOrEqual(2);
  });
  test('a bridge with no straight run to go on stays, noted (validate keeps its own error)', () => {
    const was = line(12, 30, 2, 30);
    const l = island({ river: was, objects: [{ id: 'br', k: 'bridge', x: 7, z: 29, f: 0 }] });
    const p = pathOf(l)!;
    // four tiles with a turn: no three in a line two from either end
    const r = route([K(4, 33), K(4, 32), K(2, 32)], p, l);
    expect(kinds(r.issues, 'red')).toEqual([]);
    const a = applyPath(l, p, r);
    expect(a.bridges).toEqual([]);
    expect(a.issues.find((i) => i.kind === 'bridge')).toMatchObject({ level: 'amber', ids: ['br'] });
    expect(a.layout.objects.get('br')).toMatchObject({ x: 7, z: 29 });
    expect(validate(a.layout).some((i) => i.code === 'bridge')).toBe(true);
  });
  test('an end in a pond where it met the sea: the mouth fish note', () => {
    const l = island({ river: line(12, 30, 2, 30), pond: [[12, 20]] });
    const p: RiverPath = pathOf(l)!;
    const r = route([K(12, 34), K(12, 21)], p, l);
    expect(kinds(r.issues, 'red')).toEqual([]);
    expect(kinds(r.issues, 'amber')).toContain('fish-mouth');
  });
});

describe('the handles pull to what they join', () => {
  const L = defaultLayout();
  test('the end to the coast within two tiles, the start to a pond within one', () => {
    expect(pullEnd(L, 14, 21)).toEqual([16, 21]);
    expect(pullEnd(L, 10, 30)).toEqual([10, 30]);
    expect(pullStart(L, 4, 40)).toEqual([4, 41]);
    expect(pullStart(L, 4, 38)).toEqual([4, 38]);
  });
});

test('the old tiles take their neighbours’ kind', () => {
  const l = withChanges(island({ river: line(12, 30, 2, 30) }), { tiles: [[7, 29, codeOf('sand', 0)], [7, 31, codeOf('sand', 0)], [8, 31, codeOf('dirt', 0)]] });
  const p = pathOf(l)!;
  const a = applyPath(l, p, route([K(12, 30), K(12, 40), K(2, 40)], null, l, p));
  expect(kindOf(a.layout.codes[idx(7, 30)])).toBe('sand');
  expect(kindOf(a.layout.codes[idx(4, 30)])).toBe('grass');
});
