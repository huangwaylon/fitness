import { describe, expect, it } from 'vitest';
import { BOARD } from '#lib/sugoroku/board.ts';
import { GRID, TILE, kindOf, tileAt } from '#lib/layout/grid.ts';
import { keyModel, modelBounds } from '../world3d/models3d.ts';
import { BOARD_AT, HOMES, K, LAND, RIVER_Y0, TILE_P, boardCodes, bridgePlaces, clear, decoPlan, homeBox, kindAt, toLayout } from './islandPlan.ts';
import { RIVER_HALF, riverY, toWorld } from './plan.ts';

const codes = boardCodes();
/** The tile kind under plan point (x, y). */
const kindUnder = (x: number, y: number) => {
  const [c, r] = tileAt(...toLayout(x, y));
  return kindOf(codes[r * GRID.cols + c]);
};
const boundsOf = (m: string) => modelBounds(m) ?? (keyModel(m) ? modelBounds(keyModel(m)!.m) : null);

describe("the board's island", () => {
  it('puts the board group where the layout has the plan (board units × K)', () => {
    for (const sp of BOARD) {
      const [bx, bz] = toWorld(sp.x, sp.y), [lx, lz] = toLayout(sp.x, sp.y);
      expect(K * bx + BOARD_AT.x).toBeCloseTo(lx, 6);
      expect(K * bz + BOARD_AT.z).toBeCloseTo(-lz, 6);
    }
    expect(TILE / K).toBe(TILE_P);
  });

  it('has every stone on the dirt path or the beach, never in the water', () => {
    for (const sp of BOARD) expect(['dirt', 'sand']).toContain(kindUnder(sp.x, sp.y));
  });

  it('runs the river across from sea to sea on its row, the sea all round the land', () => {
    const r = tileAt(...toLayout(10, RIVER_Y0 + 1))[1];
    const row = Array.from({ length: GRID.cols }, (_, c) => kindAt(c, r));
    expect(row[0]).toBe('sea');
    expect(row.at(-1)).toBe('sea');
    expect(row.slice(1, -1).every((k) => k === 'river')).toBe(true);
    expect(riverY(0) - RIVER_HALF).toBe(RIVER_Y0);
    // (the grid's edges are sea: the sea's shallows read the land's field inside the grid)
    for (let c = 0; c < GRID.cols; c++) expect([kindAt(c, 0), kindAt(c, GRID.rows - 1)]).toEqual(['sea', 'sea']);
    for (let r = 0; r < GRID.rows; r++) expect([kindAt(0, r), kindAt(GRID.cols - 1, r)]).toEqual(['sea', 'sea']);
    expect(LAND.x1 - LAND.x0).toBe(18 * TILE);
  });

  it('crosses the river on a bridge at each crossing, along the route', () => {
    const b = bridgePlaces();
    expect(b.length).toBe(2);
    for (const p of b) {
      expect(p.length).toBeGreaterThan(40);
      expect(p.length).toBeLessThanOrEqual(80);
      expect(Math.abs(p.z - toLayout(0, riverY(0))[1])).toBeLessThan(1);
    }
  });
});

describe('what stands about', () => {
  const deco = decoPlan(boundsOf);

  it('has the island’s museum and shop, trees, bushes and flowers', () => {
    const ids = deco.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['museum', 'shop', 'board']));
    expect(deco.filter((d) => d.id.startsWith('tree-')).length).toBeGreaterThanOrEqual(10);
    expect(deco.filter((d) => d.id.startsWith('flower-')).length).toBeGreaterThanOrEqual(30);
    expect(deco.filter((d) => d.id.startsWith('bush-')).length).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size).toBe(ids.length);
    // (a few models: one draw a model and material)
    expect(new Set(deco.map((d) => d.m)).size).toBeLessThanOrEqual(18);
  });

  it('never hides a stone from the camera, the homes neither', () => {
    for (const d of deco) expect(clear(d.box, d.tall), d.id).toBe(true);
    for (const h of HOMES) expect(clear(homeBox(h).box, homeBox(h).tall), h.who).toBe(true);
  });

  it('stands off the path and the river, on the land', () => {
    for (const d of deco) expect(['grass', 'sand'], d.id).toContain(kindUnder(d.x, d.y));
  });

  it('is the same board every time', () => {
    expect(decoPlan(boundsOf)).toEqual(deco);
  });
});
