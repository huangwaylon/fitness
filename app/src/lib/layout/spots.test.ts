import { describe, expect, test } from 'vitest';
import { defaultLayout, extentOf, layoutOf, objMid, objTiles, withChanges, type Layout } from './model.ts';
import { beachOk, daySpots, markerOf, openGrass, plazaOk, stageOf, washedUp } from './spots.ts';
import { validate } from './validate.ts';
import { frontRows } from './hides.ts';
import { tapCovered } from './clear.ts';
import { navOf, reachable } from './nav.ts';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout } from '#lib/contract/layout.ts';
import { migratedId, migrationOps } from './migrate.ts';
import { codeOf, tileAt, tileMid } from './grid.ts';
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

describe('what one stands before keeps the day’s spots off the ground its art covers behind it (clear.ts tapCovered)', () => {
  // (the board's 60u art, a button, covers the ground to ~88u past its back on screen at every zoom: a dig spot there
  // hid once the camera settled and showed while it moved, flickering behind the board: 2026-11-06 on the user's
  // island. K.K. on his stool stands 75u: four rows, where the board's three left his fourth open)
  for (const [k, rows] of [['board', 3], ['kk-stool', 4]] as const)
    for (const [name, g] of [['the default', l], ['the user’s record', userLayout()]] as const)
      test(`${k}, ${name}: no weed or dig spot within ${rows} rows behind it, nor a tile each side`, () => {
        expect(frontRows(k)).toBe(rows);
        const b = [...g.objects.values()].find((o) => o.k === k)!;
        const tiles = objTiles(g, b), behind = (c: number, r: number) => tiles.some(([bc, br]) => Math.abs(c - bc) <= 1 && r - br >= 1 && r - br <= rows);
        for (const [c, r] of openGrass(g)) expect(behind(c, r), `${c},${r}`).toBe(false);
        for (let d = 1; d <= 61; d++) {
          const date = new Date(Date.UTC(2026, 10, d)).toISOString().slice(0, 10), { dig, lawn } = daySpots(g, date, 'island-fund');
          for (const [x, z] of [...dig, ...lawn]) expect(behind(...tileAt(x, z)), `${date} ${x},${z}`).toBe(false);
        }
      });
  test('K.K. moved onto the open lawn: the fourth row behind him kept clear too (the board’s three left it open)', () => {
    const k = [...l.objects.values()].find((o) => o.k === 'kk-stool')!, m = withChanges(l, { set: [{ ...k, x: 8, z: 8 }] });
    expect(m.kind(8, 12)).toBe('grass');
    for (let i = -1; i <= 1; i++) expect(tapCovered(m).has(`${8 + i},12`), `${8 + i},12`).toBe(true);
    expect(openGrass(m).some(([c, r]) => r === 12 && Math.abs(c - 8) <= 1)).toBe(false);
  });
});

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

describe('the visitors’ spots: the members’ marks (spots.ts markerSpot)', () => {
  const auto = stageOf(l)!, [ac, ar] = tileAt(auto[0], auto[1]);
  // a tile the plaza may go on, well away from the usual spot; one more for a move
  const ok = openGrass(l).filter(([c, r]) => plazaOk(l, c, r) && Math.hypot(c - ac, r - ar) > 4);
  const [pc, pr] = ok[0], [qc, qr] = ok.find(([c, r]) => Math.hypot(c - pc, r - pr) > 4)!;
  const mark = (g: Layout, id: string, k: string, x: number, z: number) => withChanges(g, { set: [{ id, k, x, z, f: 0 }] });
  test('the plaza: they stand on it, it moves them, the day’s weeds and fossils keep off it; a mark gone, or nobody able to stand there, the usual spot', () => {
    const bad: string[] = [];
    const want = (what: string, got: unknown, exp: unknown) => JSON.stringify(got) === JSON.stringify(exp) || bad.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(exp)}`);
    const marked = mark(l, 'o1', 'plaza', pc, pr);
    want('on it', stageOf(marked), tileMid(pc, pr));
    want('every phone', stageOf(mark(defaultLayout(), 'o1', 'plaza', pc, pr)), tileMid(pc, pr));
    want('moved', stageOf(mark(marked, 'o1', 'plaza', qc, qr)), tileMid(qc, qr));
    want('gone', stageOf(withChanges(marked, { remove: ['o1'] })), auto);
    want('takes no ground', openGrass(marked), openGrass(l));
    want('no issue', validate(marked).filter((i) => i.code === 'visitor-spot').length, 0);
    for (const [x, z] of [...daySpots(marked, '2026-11-04', 'island-fund').lawn, ...daySpots(marked, '2026-11-04', 'island-fund').dig])
      if (Math.hypot(x - tileMid(pc, pr)[0], z - tileMid(pc, pr)[1]) <= 30) bad.push(`a weed or a fossil at ${x},${z}`);
    // a well put on it, or beside it: the usual spot (of the layout with the well), and the editor's warning
    for (const [dx, why] of [[0, 'on it'], [1, 'beside it']] as const) {
      const walled = mark(marked, 'o2', 'brick-well', pc + dx, pr);
      want(`a well ${why}`, stageOf(walled), stageOf(withChanges(walled, { remove: ['o1'] })));
      want(`a well ${why}: the warning`, validate(walled).filter((i) => i.code === 'visitor-spot').map((i) => [i.level, i.ids]), [['warn', ['o1']]]);
      want(`a well ${why}: no overlap`, validate(walled).filter((i) => i.code === 'overlap').length, 0);
    }
    // on the water, on sand: never
    for (const [c, r] of [[pc, pr], [pc, pr + 1]] as const) if (plazaOk(withChanges(l, { tiles: [[c, r, codeOf('pond', l.tier(c, r))]] }), pc, pr)) bad.push(`water at ${c},${r}`);
    // two put down at once (two phones): the later one
    want('the later', markerOf(mark(marked, 'o0', 'plaza', qc, qr), 'plaza')?.id, 'o1');
    expect(bad).toEqual([]);
  });
  test('Gulliver’s: he lies on it every day, the dated pick when it’s gone or off the sand', () => {
    const bad: string[] = [];
    const sand: [number, number][] = [];
    for (let r = 0; r < 60; r++) for (let c = 0; c < 20; c++) if (beachOk(l, c, r)) sand.push([c, r]);
    const [bc, br] = sand[0] ?? [-1, -1];
    const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
    const g = mark(l, 'o3', 'beach-spot', bc, br);
    for (const d of days) {
      if (JSON.stringify(washedUp(g, d, 'island-fund')) !== JSON.stringify(tileMid(bc, br))) bad.push(`${d}: not on it`);
      // on the grass (the plaza's tile): the dated pick, as without it
      if (JSON.stringify(washedUp(mark(l, 'o3', 'beach-spot', pc, pr), d, 'island-fund')) !== JSON.stringify(washedUp(l, d, 'island-fund'))) bad.push(`${d}: off the sand`);
    }
    // the plaza is the others': it never moves him, his never moves them
    if (JSON.stringify(stageOf(g)) !== JSON.stringify(auto)) bad.push('his moved the stage');
    expect([sand.length > 0, bad]).toEqual([true, []]);
  });
  test('an op of the new kinds passes the contract as it is (no relay change; an older app keeps it as a thing it doesn’t know)', () => {
    expect([layoutOpOf({ sc: 'o', id: 'o1', at: 1.8e12, k: 'plaza', x: 9, z: 30, f: 0 }), layoutOpOf({ sc: 'o', id: 'o2', at: 1.8e12, k: 'beach-spot', x: 9, z: 3, f: 0 })].map((o) => (o && 'k' in o ? o.k : null))).toEqual(['plaza', 'beach-spot']);
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
