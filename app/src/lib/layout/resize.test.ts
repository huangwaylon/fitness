// The island's size (layout/resize.ts): an edge pushed out and pulled in a tile at a time; a push then a pull gives the
// island back; a river's mouth runs on, a river along the coast isn't doubled; a cliff's coast keeps its tier; what
// stands in the way listed, the fixed pieces marked and moved inside, never deleted; the grid's edge.
import { describe, expect, it } from 'vitest';
import { codeOf, GRID } from './grid.ts';
import { defaultLayout, toJson, withChanges, type Layout } from './model.ts';
import { validate } from './validate.ts';
import { EDGES, MARGIN, MIN, blockersOf, landSize, moveInside, resizeEdge, withTiles, type Edge } from './resize.ts';

const l0 = defaultLayout();
const resized = (l: Layout, edge: Edge, by: number): Layout => {
  const r = resizeEdge(l, edge, by);
  if (!r.codes) throw new Error(`${edge} ${by}: can't`);
  return withTiles(l, r.codes);
};
const errors = (l: Layout) => validate(l).filter((i) => i.level === 'error').map((i) => `${i.code}:${i.ids.join()}`);

describe('the island’s size (layout/resize.ts)', () => {
  it('the longest: 152 rows of land, twice the 80-row grid’s 76 (the user, 2026-11-10), its back the grid’s edge less the sea', () => {
    expect(GRID.rows).toBe(156);
    const long = resized(l0, 'back', 95);
    expect(landSize(long)).toMatchObject({ cols: 15, rows: 152, r0: 2, r1: 153 });
    expect(resizeEdge(long, 'back', 1)).toEqual({ codes: null, blocked: [] });
    // the default's own rows as they were (the back's coast moved out, the island behind it untouched up to its old cliff)
    for (let i = 0; i < 20 * 50; i++) expect(long.codes[i]).toBe(l0.codes[i]);
    expect(errors(long)).toEqual(errors(l0));
  });
  it('the default: 15 × 57, room to grow the back 95 rows, none at the front or the left (the sea kept round it)', () => {
    expect(landSize(l0)).toMatchObject({ cols: 15, rows: 57, c0: 2, c1: 16, r0: 2, r1: 58 });
    expect(resizeEdge(l0, 'back', GRID.rows - 1 - MARGIN - 58).codes).not.toBeNull();
    expect(resizeEdge(l0, 'back', GRID.rows - MARGIN - 58)).toEqual({ codes: null, blocked: [] });
    expect(resizeEdge(l0, 'front', 1).codes).toBeNull();
    expect(resizeEdge(l0, 'left', 1).codes).toBeNull();
    expect(resizeEdge(l0, 'right', 1).codes).not.toBeNull();
    expect(resizeEdge(l0, 'right', 2).codes).toBeNull();
  });

  it('the back grown its 19 rows: 15 × 76, nothing in the way, validate as clean as the default', () => {
    const r = resizeEdge(l0, 'back', 19);
    expect(r.blocked).toEqual([]);
    const big = withTiles(l0, r.codes!);
    expect(landSize(big)).toMatchObject({ cols: 15, rows: 76, r1: 77 });
    expect(errors(big)).toEqual(errors(l0));
    expect(errors(l0)).toEqual([]);
  });

  it('a push then a pull gives the island back, every edge that can grow; a pull then a push keeps the size', () => {
    for (const [edge, by] of [['back', 1], ['back', 7], ['right', 1]] as const) {
      const out = resized(l0, edge, by);
      expect(toJson(resized(out, edge, -by)).tiles, `${edge} ${by}`).toEqual(toJson(l0).tiles);
    }
    for (const edge of EDGES) {
      const back = resized(resized(l0, edge, -1), edge, 1);
      expect(landSize(back), edge).toMatchObject({ cols: 15, rows: 57 });
    }
  });

  it('the back pushed out: the clifftop’s beach a row further (tier 1), the row it left the lawn inside it', () => {
    const l = resized(l0, 'back', 1);
    for (let c = 4; c <= 14; c++) {
      expect(l.tile(c, 59), `${c}`).toEqual({ kind: 'sand', tier: 1 });
      expect(l.tile(c, 58), `${c}`).toEqual(l0.tile(c, 57));
    }
    // the corners keep their shape: the west beach's column runs on a row
    expect(l.tile(2, 57)).toEqual({ kind: 'sand', tier: 1 });
    expect(l.kind(2, 58)).toBe('sea');
    // the cliff (tier 0 → 1 at row 53) where it was
    for (let c = 3; c <= 14; c++) expect([l.tier(c, 52), l.tier(c, 53)]).toEqual([0, 1]);
  });

  it('a cliff’s coast: grass on the upper tier against the sea moves out as it is, tier and all', () => {
    // the clifftop's beach row painted grass: the coast a cliff's edge
    const cliff = withChanges(l0, { tiles: Array.from({ length: 11 }, (_, i) => [4 + i, 58, codeOf('grass', 1)] as [number, number, number]) });
    const l = resized(cliff, 'back', 2);
    for (let c = 4; c <= 14; c++) for (const r of [58, 59, 60]) expect(l.tile(c, r), `${c},${r}`).toEqual({ kind: 'grass', tier: 1 });
    expect(l.kind(9, 61)).toBe('sea');
  });

  it('a river’s mouth runs on to the moved coast; one along the coast isn’t doubled (the beach widens)', () => {
    // the west mouth (rows 23–24 at column 2): pulled in, then pushed out again, still meets the sea
    const pulled = resized(l0, 'left', -1);
    for (const r of [23, 24]) expect([pulled.kind(2, r), pulled.kind(3, r)]).toEqual(['sea', 'river']);
    const pushed = resized(pulled, 'left', 1);
    for (const r of [23, 24]) expect([pushed.kind(1, r), pushed.kind(2, r)]).toEqual(['sea', 'river']);
    expect(pushed.kind(3, 24)).toBe('river');
    // the east stream runs down column 15 beside the beach: the east pushed out, its beach two wide, the stream one
    const east = resized(l0, 'right', 1);
    for (let r = 28; r <= 52; r++) {
      if (l0.kind(15, r) !== 'river' || l0.kind(14, r) === 'river') continue;
      expect([east.kind(14, r), east.kind(15, r), east.kind(16, r), east.kind(17, r)], `${r}`).toEqual([l0.kind(14, r), 'river', 'sand', 'sand']);
    }
    // a river's mouth reaching the back's coast runs on with it
    const mouth = withChanges(l0, { tiles: [55, 56, 57, 58].map((r) => [10, r, codeOf('river', 1)] as [number, number, number]) });
    const l = resized(mouth, 'back', 3);
    for (let r = 55; r <= 61; r++) expect(l.kind(10, r), `${r}`).toBe('river');
    expect(l.kind(10, 62)).toBe('sea');
  });

  it('pulled in: what the sea takes and what goes wrong is in the way, the fixed pieces marked', () => {
    // the front a row in: the sandcastle (summer's, fixed) on the beach's front row
    expect(resizeEdge(l0, 'front', -1).blocked).toEqual([{ id: 'sandcastle', k: 'sandcastle', fixed: true }]);
    // the back two rows in: the museum (fixed) and a cedar by it
    const back = resizeEdge(l0, 'back', -2).blocked;
    expect(back).toContainEqual({ id: 'museum', k: 'museum', fixed: true });
    expect(back.find((b) => b.id.startsWith('cedar'))?.fixed).toBe(false);
    // the west two columns in: うめ's home and the shop among them
    const west = resizeEdge(l0, 'left', -2).blocked;
    expect(west).toContainEqual({ id: 'home-B', k: 'home', fixed: true });
    expect(west).toContainEqual({ id: 'shop', k: 'shop', fixed: true });
    // and nothing for a push
    expect(resizeEdge(l0, 'back', 1).blocked).toEqual([]);
  });

  it('moved inside: each blocker to a clear tile, the fixed never deleted; one with nowhere to go holds the resize', () => {
    // the east three columns in: the guest's home, the goal tree, the summer pieces moved, nothing stuck
    const r = resizeEdge(l0, 'right', -3);
    const l = withTiles(l0, r.codes!);
    const m = moveInside(l, r.blocked);
    expect(m.stuck).toEqual([]);
    for (const id of ['home-G', 'goal-B', 'beach-chair', 'sandcastle']) expect(m.moved).toContain(id);
    for (const b of r.blocked) if (b.fixed) expect(m.layout.objects.has(b.id), b.id).toBe(true);
    expect(blockersOf(l0, m.layout)).toEqual([]);
    expect(errors(m.layout)).toEqual([]);
    // the back two rows in: the clifftop is too shallow for the museum and its door: stuck, kept where it was
    const b = resizeEdge(l0, 'back', -2);
    const mb = moveInside(withTiles(l0, b.codes!), b.blocked);
    expect(mb.stuck).toEqual(['museum']);
    expect(mb.layout.objects.get('museum')).toEqual(l0.objects.get('museum'));
  });

  it('the least size: an edge pulled in no further than MIN tiles of land', () => {
    let l = l0;
    let n = 0;
    for (;;) {
      const r = resizeEdge(l, 'right', -1);
      if (!r.codes) break;
      l = withTiles(l, r.codes);
      n++;
    }
    expect(landSize(l).cols).toBe(MIN);
    expect(n).toBe(15 - MIN);
  });
});
