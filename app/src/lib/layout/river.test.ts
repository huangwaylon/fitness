// The river's turns (river.ts): its straights drawn exactly straight on their tiles' middles, a staircase between two
// straights one circular arc tangent to both (the user, 2026-11-03: "the 45 degree down to be a quarter circle"), a
// plain L a small fillet, and the drawn water on its own tiles near enough (EDGE_TOL).
import { describe, expect, test } from 'vitest';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, type LayoutEntry } from '#lib/contract/layout.ts';
import { GRID, TILE, codeOf, idx, kindOf, onGrid, tileMid } from './grid.ts';
import { Layout, defaultLayout, layoutOf } from './model.ts';
import { EDGE_TOL, riverStems, type Stem } from './river.ts';

/** An island of grass (rows 3…56, columns 2…17) in the sea, with river on `tiles`. */
function island(tiles: [number, number][]): Layout {
  const codes = new Uint8Array(GRID.cols * GRID.rows);
  for (let r = 3; r <= 56; r++) for (let c = 2; c <= 17; c++) codes[idx(c, r)] = codeOf('grass', 0);
  for (const [c, r] of tiles) codes[idx(c, r)] = codeOf('river', 0);
  return new Layout(codes, new Map(), defaultLayout().homes);
}
/** A run of tiles from (c, r) `n` steps of (dc, dr), (c, r) itself left out. */
const run = (c: number, r: number, dc: number, dr: number, n: number): [number, number][] => Array.from({ length: n }, (_, i) => [c + dc * (i + 1), r + dr * (i + 1)]);

// down column 15 (from row 45 to row 30), a staircase down and left to (12, 27), then left along row 27 to the sea
const STAIR: [number, number][] = [[15, 45], ...run(15, 45, 0, -1, 15), [14, 30], [14, 29], [13, 29], [13, 28], [12, 28], [12, 27], ...run(12, 27, -1, 0, 10)];
// down column 15 to row 27, then left along it: a plain L
const ELL: [number, number][] = [[15, 45], ...run(15, 45, 0, -1, 18), ...run(15, 27, -1, 0, 13)];
const X15 = tileMid(15, 0)[0], Z27 = tileMid(0, 27)[1];

/** Whether (x, z) is within `tol` of a water tile (the river's, a pond, the sea). */
function wetNear(l: Layout, x: number, z: number, tol: number): boolean {
  for (let r = Math.floor((z - tol - GRID.z0) / TILE); r <= Math.floor((z + tol - GRID.z0) / TILE); r++)
    for (let c = Math.floor((x - tol - GRID.x0) / TILE); c <= Math.floor((x + tol - GRID.x0) / TILE); c++) {
      const k = onGrid(c, r) ? kindOf(l.codes[idx(c, r)]) : 'sea';
      if (k === 'river' || k === 'pond' || k === 'sea') return true;
    }
  return false;
}
/** Every sample's banks (the band's edges either side) within EDGE_TOL of water, its middle on it. */
function onTiles(l: Layout, s: Stem): void {
  for (let i = 0; i < s.x.length; i++) {
    const nx = -s.fz[i], nz = s.fx[i];
    expect(wetNear(l, s.x[i], s.z[i], 1)).toBe(true);
    expect(wetNear(l, s.x[i] + nx * s.hw[i], s.z[i] + nz * s.hw[i], EDGE_TOL)).toBe(true);
    expect(wetNear(l, s.x[i] - nx * s.hw[i], s.z[i] - nz * s.hw[i], EDGE_TOL)).toBe(true);
  }
}
const onArc = (s: Stem, i: number) => s.arcs.some((a) => Math.abs(Math.hypot(s.x[i] - a.cx, s.z[i] - a.cz) - a.r) < 1e-2);

describe("the river's turns", () => {
  test('its straights stay exactly straight, on their tiles\' middles, one breadth', () => {
    const [s] = riverStems(island(STAIR));
    const a = s.arcs[0];
    let down = 0, across = 0;
    for (let i = 0; i < s.x.length; i++) {
      if (onArc(s, i)) continue;
      // off the arc: on column 15's middle (above the arc) or row 27's (before it), nowhere else
      if (s.z[i] >= a.z1 - 1e-3) expect(s.x[i]).toBeCloseTo(X15, 4), down++;
      else expect(s.z[i]).toBeCloseTo(Z27, 4), across++;
      if (s.x[i] > tileMid(3, 0)[0]) expect(s.hw[i]).toBe(13.5);
    }
    expect(down).toBeGreaterThan(100);
    expect(across).toBeGreaterThan(60);
  });

  test('down, a staircase down and left, then left: one quarter circle tangent to both straights', () => {
    const [s] = riverStems(island(STAIR));
    expect(s.arcs).toHaveLength(1);
    const a = s.arcs[0];
    expect(a.deg).toBeCloseTo(90, 3);
    // tangent: it leaves row 27's line square to its radius and meets column 15's the same
    expect(a.z0).toBeCloseTo(Z27, 3);
    expect(a.cx).toBeCloseTo(a.x0, 3);
    expect(a.x1).toBeCloseTo(X15, 3);
    expect(a.cz).toBeCloseTo(a.z1, 3);
    // one radius all the way round, big enough to go through the staircase's middle (not a corner's fillet)
    const on = [...s.x.keys()].filter((i) => onArc(s, i));
    expect(on.length).toBeGreaterThan(20);
    for (const i of on) expect(Math.hypot(s.x[i] - a.cx, s.z[i] - a.cz)).toBeCloseTo(a.r, 2);
    expect(a.r).toBeGreaterThan(TILE * 4);
    // through the staircase: the middle of the arc on its middle tile's diagonal, (13, 28)…(14, 29)
    const [mx, mz] = [a.cx + a.r * Math.SQRT1_2, a.cz - a.r * Math.SQRT1_2];
    const [c, r] = [Math.floor((mx - GRID.x0) / TILE), Math.floor((mz - GRID.z0) / TILE)];
    expect(STAIR.some(([sc, sr]) => sc === c && sr === r)).toBe(true);
    // the flow turns smoothly through it: no kink between samples
    for (let i = 1; i < s.x.length; i++) expect(s.fx[i] * s.fx[i - 1] + s.fz[i] * s.fz[i - 1]).toBeGreaterThan(0.99);
  });

  test('a plain L corner gets a small fillet', () => {
    const [s] = riverStems(island(ELL));
    expect(s.arcs).toHaveLength(1);
    expect(s.arcs[0].deg).toBeCloseTo(90, 3);
    expect(s.arcs[0].r).toBeGreaterThan(10);
    expect(s.arcs[0].r).toBeLessThan(TILE);
    onTiles(island(ELL), s);
  });

  test('a long staircase: an arc at each end, a straight diagonal between', () => {
    const steps: [number, number][] = [];
    for (let k = 0; k < 6; k++) steps.push([14 - k, 34 - k], [14 - k, 33 - k]);
    const l = island([[15, 45], ...run(15, 45, 0, -1, 11), ...steps, ...run(9, 28, -1, 0, 7)]);
    const [s] = riverStems(l);
    expect(s.arcs).toHaveLength(2);
    for (const a of s.arcs) expect(a.deg).toBeCloseTo(45, 3);
    const diag = [...s.x.keys()].filter((i) => !onArc(s, i) && Math.abs(Math.abs(s.fx[i]) - Math.SQRT1_2) < 1e-3);
    expect(diag.length).toBeGreaterThan(10);
    onTiles(l, s);
  });

  test('the drawn edge stays within EDGE_TOL of the tiles (the staircase, the L, the default, the record)', () => {
    const entries = (RECORD as Record<string, unknown>[]).map((r) => {
      const { who, ...d } = r;
      const op = layoutOpOf(d);
      return op ? ({ ...op, who } as LayoutEntry) : null;
    });
    const record = layoutOf(entries.filter((e): e is LayoutEntry => !!e));
    for (const l of [island(STAIR), island(ELL), defaultLayout(), record]) {
      const stems = riverStems(l);
      expect(stems.length).toBeGreaterThan(0);
      for (const s of stems) onTiles(l, s);
    }
    // the record's stream: its staircase one quarter circle
    expect(riverStems(record)[0].arcs.map((a) => Math.round(a.deg))).toEqual([90]);
  });
});
