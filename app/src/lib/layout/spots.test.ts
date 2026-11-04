import { describe, expect, test } from 'vitest';
import { defaultLayout, extentOf, layoutOf, objMid, objTiles, withChanges, type Layout } from './model.ts';
import { daySpots, openGrass, stageOf, washedUp } from './spots.ts';
import { navOf, reachable } from './nav.ts';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout } from '#lib/contract/layout.ts';
import { migratedId, migrationOps } from './migrate.ts';
import { codeOf, tileAt } from './grid.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

const l = defaultLayout();
describe('the day’s spots from the layout (spots.ts)', () => {
  test('never under or before a tree’s canopy, nor by a bush, a flower, the rock or a bench (it, or the spot, takes the other’s tap)', () => {
    const near = [...l.objects.values()].filter((o) => ['rock', 'tape-deck', 'park-bench', 'log-bench'].includes(o.k)).flatMap((o) => objTiles(l, o).map((t) => [o.id, ...t] as const));
    for (const [c, r] of openGrass(l)) for (const [id, tc, tr] of near) expect(Math.abs(c - tc) <= 1 && Math.abs(r - tr) <= 1, `${c},${r} by ${id}`).toBe(false);
    const tall = [...l.objects.values()].filter((o) => ['oak', 'cedar', 'palm', 'bamboo', 'goal-tree', 'bush', 'hedge', 'flower'].includes(o.k));
    for (const [c, r] of openGrass(l))
      for (const t of tall) expect(Math.abs(c - t.x) <= 1 && r - t.z >= -1 && r - t.z <= (['bush', 'hedge', 'flower'].includes(t.k) ? 1 : 2), `${c},${r} by ${t.id}`).toBe(false);
  });
  test('the same on every phone for a date, another the next day; on open grass, the dig spots apart from the weeds', () => {
    const a = daySpots(l, '2026-11-04', 'island-fund'), b = daySpots(layoutOf([]), '2026-11-04', 'island-fund');
    expect(b).toEqual(a);
    expect(daySpots(l, '2026-11-05', 'island-fund').lawn).not.toEqual(a.lawn);
    expect(a.lawn).toHaveLength(15);
    expect(a.dig).toHaveLength(8);
    const open = new Set(openGrass(l).map(([c, r]) => `${c},${r}`));
    for (const [x, z] of [...a.lawn, ...a.dig]) expect(open.has(tileAt(x, z).join(','))).toBe(true);
    const digTiles = new Set(a.dig.map(([x, z]) => tileAt(x, z).join(',')));
    for (const [x, z] of a.lawn) expect(digTiles.has(tileAt(x, z).join(','))).toBe(false);
  });
  test('a tile that turns to water or under a new thing is never a spot', () => {
    const [c, r] = openGrass(l)[10];
    const wet = withChanges(l, { tiles: [[c, r, codeOf('pond', l.tier(c, r))]] });
    expect(openGrass(wet).some(([a, b]) => a === c && b === r)).toBe(false);
    const built = withChanges(l, { set: [{ id: 'o1', k: 'brick-well', x: c, z: r, f: 0 }] });
    expect(openGrass(built).some(([a, b]) => a === c && b === r)).toBe(false);
  });
});

/** The user's island: the record, then the shop and the museum where they put them (exit.test.ts's). */
function userLayout(): Layout {
  const m = new Map<string, LayoutEntry>();
  const extra = [{ who: 'A', sc: 'o', id: 'shop', at: 1.8e12, k: 'shop', x: 7, z: 49, f: 0 }, { who: 'A', sc: 'o', id: 'museum', at: 1.8e12 + 1, k: 'museum', x: 9, z: 18, f: 0 }];
  for (const { who, ...r } of [...(RECORD as Record<string, unknown>[]), ...extra]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  return layoutOf(m);
}

describe('the visitors’ stage and Gulliver’s beach, from the layout (spots.ts)', () => {
  const villagers = (g: Layout) => [...g.objects.values()].filter((o) => o.k === 'spot' && o.s !== 'stage').map((o) => objMid(g, o));
  for (const [name, g] of [['the default', l], ['the user’s record', userLayout()]] as const)
    test(`${name}: on open, walkable grass with a clear patch round it, near the middle a little behind the villagers (in view as the island opens)`, () => {
      const s = stageOf(g)!, nav = navOf(g);
      expect(s).toBeTruthy();
      expect(reachable(nav, s[0], s[1])).toBe(true);
      expect(openGrass(g).some(([c, r]) => tileAt(s[0], s[1]).join() === `${c},${r}`)).toBe(true);
      // a tile clear each side, behind and in front (the cake): no water, nothing standing there
      const [c, r] = tileAt(s[0], s[1]);
      const taken = new Set([...g.objects.values()].flatMap((o) => objTiles(g, o).map((t) => t.join())));
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) expect(['grass', 'dirt', 'stone', 'brick', 'plank'].includes(g.kind(c + i, r + j)) && !taken.has(`${c + i},${r + j}`), `${c + i},${r + j}`).toBe(true);
      // the middle of the lawn, behind the villagers' spots, well in front of the homes at the back
      const vz = Math.max(...villagers(g).map((p) => p[1]));
      expect(Math.abs(s[0] - 195)).toBeLessThan(120);
      expect(s[1] - vz).toBeGreaterThan(30);
      expect(s[1] - vz).toBeLessThanOrEqual(320);
      for (const v of villagers(g)) expect(Math.hypot(s[0] - v[0], s[1] - v[1])).toBeGreaterThan(60);
      // the same on every phone; the day's weeds and fossils keep off it
      expect(stageOf(g === l ? defaultLayout() : userLayout())).toEqual(s);
      for (const [x, z] of [...daySpots(g, '2026-11-04', 'island-fund').lawn, ...daySpots(g, '2026-11-04', 'island-fund').dig]) expect(Math.hypot(x - s[0], z - s[1])).toBeGreaterThan(30);
    });
  test('it moves with the layout: a well put on it sends the visitors to the next clear patch', () => {
    const s = stageOf(l)!, [c, r] = tileAt(s[0], s[1]);
    const moved = stageOf(withChanges(l, { set: [{ id: 'o1', k: 'brick-well', x: c, z: r, f: 0 }] }))!;
    expect(moved).not.toEqual(s);
    expect(Math.abs(moved[0] - 195)).toBeLessThanOrEqual(150);
    expect(moved[1]).toBeLessThan(800);
  });
  test('Gulliver washes up on the front beach’s sand by the sea, in the middle, somewhere new some days, the same on every phone', () => {
    for (const g of [l, userLayout()]) {
      const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
      const at = days.map((d) => washedUp(g, d, 'island-fund')!);
      expect(new Set(at.map((p) => p.join())).size).toBeGreaterThan(1);
      for (const [i, p] of at.entries()) {
        expect(washedUp(g, days[i], 'island-fund')).toEqual(p);
        expect(g.kind(...tileAt(p[0], p[1] - 1))).toBe('sand');
        expect(Math.abs(p[0] - 195)).toBeLessThanOrEqual(135);
        expect(p[1]).toBeLessThan(extentOf(g).shore + 90);
      }
    }
  });
});

describe('the old decorations into the layout, once (migrate.ts)', () => {
  const placed = [
    { id: 'dabc1234', item: 'tanuki', x: 120, z: 400, f: 1 as const, at: 1_800_000_000_000, who: 'A' as const },
    { id: 'dbbb1234', item: 'brick-well', x: 200, z: 900, f: 0 as const, at: 1_800_000_000_100, who: 'B' as const }
  ];
  test('mine only, on its tile, おく moved back; never twice; never the guest', () => {
    const ops = migrationOps(new Map(), placed, 'A');
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ sc: 'o', id: migratedId('dabc1234'), k: 'tanuki', f: 1 });
    const b = migrationOps(new Map(), placed, 'B')[0] as { z: number };
    expect(-90 + b.z * 30 + 30).toBeGreaterThan(900 + 400);
    const m = new Map<string, LayoutEntry>([[`o|${migratedId('dabc1234')}`, { ...ops[0], who: 'A' } as LayoutEntry]]);
    expect(migrationOps(m, placed, 'A')).toEqual([]);
    expect(migrationOps(new Map(), placed, 'G')).toEqual([]);
  });
});
