import { describe, expect, test } from 'vitest';
import { defaultLayout, layoutOf, withChanges } from './model.ts';
import { daySpots, openGrass } from './spots.ts';
import { migratedId, migrationOps } from './migrate.ts';
import { codeOf, tileAt } from './grid.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

const l = defaultLayout();
describe('the day’s spots from the layout (spots.ts)', () => {
  test('the same on every phone for a date, another the next day; on open grass, the dig spots apart from the weeds', () => {
    const a = daySpots(l, '2026-11-04', 'island-fund'), b = daySpots(layoutOf([]), '2026-11-04', 'island-fund');
    expect(b).toEqual(a);
    expect(daySpots(l, '2026-11-05', 'island-fund').lawn).not.toEqual(a.lawn);
    expect(a.lawn).toHaveLength(15);
    expect(a.dig).toHaveLength(6);
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
    expect(-90 + b.z * 30 + 30).toBeGreaterThan(900 + 1000);
    const m = new Map<string, LayoutEntry>([[`o|${migratedId('dabc1234')}`, { ...ops[0], who: 'A' } as LayoutEntry]]);
    expect(migrationOps(m, placed, 'A')).toEqual([]);
    expect(migrationOps(new Map(), placed, 'G')).toEqual([]);
  });
});
