// The island's size (docs/island-layout.md "The island's size"), pure: an edge of the land pushed out or pulled in a
// tile at a time (the editor's しまの おおきさ: まえ, おく, ひだり, みぎ). Along each line across that edge (a column for
// まえ / おく, a row for ひだり / みぎ) the outermost land tile (the beach, a cliff's edge, a river's mouth) moves one tile
// out and the tile it leaves takes the kind and tier of the one inside it (a river reaching the coast runs on to it; one
// running along the coast isn't doubled: the beach widens there instead); pulled in, the outermost tile moves in over
// the one inside it and the sea takes its place, so a push then a pull gives the island back as it was. The grid stays
// (20 × 80, grid.ts): the land keeps MARGIN tiles of sea round it, and at least MIN tiles across and along. What stands
// in the way (on a tile the sea takes, or wrong on its new ground: validate's new issues) is listed, the fixed pieces
// (a home, the museum, the shop, K.K.'s stool, the board, a goal tree: catalog `fixed`) marked: the editor moves them
// inside (moveInside: resolve.ts clearTile), never deletes a fixed one.
import { GRID, SEA, TILE, idx, kindOf, onGrid } from './grid.ts';
import { extentOf, objTiles, withChanges, type Layout, type Obj } from './model.ts';
import { kindDef } from './catalog.ts';
import { validate, type Issue } from './validate.ts';
import { clearTile } from './resolve.ts';

export type Edge = 'front' | 'back' | 'left' | 'right';
/** The edges in the editor's order (まえ, おく, ひだり, みぎ). */
export const EDGES: readonly Edge[] = ['front', 'back', 'left', 'right'];
/** The sea kept round the land on the grid (tiles): the beach's waves and the fields have room to fade. */
export const MARGIN = 2;
/** The land's least size across and along (tiles). */
export const MIN = 6;

export interface Blocker {
  id: string;
  k: string;
  /** Never deleted (catalog `fixed`): moved inside, or the resize waits. */
  fixed: boolean;
}
export interface Resized {
  /** The grid's new codes; null: the land can't go that way (the grid's edge, or the least size). */
  codes: Uint8Array | null;
  blocked: Blocker[];
}

/** The land's box in tiles (columns c0…c1, rows r0…r1, inclusive) and its size, cols × rows. */
export function landSize(l: Layout): { c0: number; c1: number; r0: number; r1: number; cols: number; rows: number } {
  const b = extentOf(l).land;
  if (b.x1 <= b.x0) return { c0: 0, c1: -1, r0: 0, r1: -1, cols: 0, rows: 0 };
  const c0 = Math.round((b.x0 - GRID.x0) / TILE), c1 = Math.round((b.x1 - GRID.x0) / TILE) - 1;
  const r0 = Math.round((b.z0 - GRID.z0) / TILE), r1 = Math.round((b.z1 - GRID.z0) / TILE) - 1;
  return { c0, c1, r0, r1, cols: c1 - c0 + 1, rows: r1 - r0 + 1 };
}

/** An edge's lines: `n` of them, each `len` tiles from the far side (t 0) out to the edge (t len − 1). */
function axis(edge: Edge): { n: number; len: number; at: (i: number, t: number) => [number, number] } {
  switch (edge) {
    case 'back': return { n: GRID.cols, len: GRID.rows, at: (i, t) => [i, t] };
    case 'front': return { n: GRID.cols, len: GRID.rows, at: (i, t) => [i, GRID.rows - 1 - t] };
    case 'right': return { n: GRID.rows, len: GRID.cols, at: (i, t) => [t, i] };
    case 'left': return { n: GRID.rows, len: GRID.cols, at: (i, t) => [GRID.cols - 1 - t, i] };
  }
}

const fresh = (code: number) => {
  const k = kindOf(code);
  return k === 'river' || k === 'pond';
};

/** One tile out (`grow`) or in, on `codes` in place; false when the land can't go that way. */
function step(codes: Uint8Array, edge: Edge, grow: boolean): boolean {
  const { n, len, at } = axis(edge);
  const get = (i: number, t: number) => {
    if (t < 0) return SEA;
    const [c, r] = at(i, t);
    return onGrid(c, r) ? codes[idx(c, r)] : SEA;
  };
  const set = (i: number, t: number, code: number) => {
    const [c, r] = at(i, t);
    if (onGrid(c, r)) codes[idx(c, r)] = code;
  };
  // each line's outermost land tile (−1: none)
  const ends: number[] = [];
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) {
    let e = -1;
    for (let t = len - 1; t >= 0; t--)
      if (kindOf(get(i, t)) !== 'sea') {
        e = t;
        break;
      }
    ends.push(e);
    if (e >= 0) {
      hi = Math.max(hi, e);
      for (let t = 0; t <= e; t++)
        if (kindOf(get(i, t)) !== 'sea') {
          lo = Math.min(lo, t);
          break;
        }
    }
  }
  if (hi < 0) return false;
  if (grow ? hi + 1 > len - 1 - MARGIN : hi - lo + 1 - 1 < MIN) return false;
  for (let i = 0; i < n; i++) {
    const e = ends[i];
    if (e < 0) continue;
    const coast = get(i, e), inner = get(i, e - 1);
    if (grow) {
      set(i, e + 1, coast);
      // the tile left behind: the inner one's ground (a river along the coast isn't doubled: the coast's there)
      const fill = kindOf(inner) === 'sea' || (fresh(inner) && !fresh(coast)) ? coast : inner;
      set(i, e, fill);
    } else {
      if (kindOf(inner) !== 'sea') set(i, e - 1, coast);
      set(i, e, SEA);
    }
  }
  return true;
}

const issueKey = (i: Issue) => `${i.code}|${[...i.ids].sort().join(',')}`;

/** What stands in the way of `next` (the layout with the new codes) that stood fine on `l`. */
export function blockersOf(l: Layout, next: Layout): Blocker[] {
  const ids = new Set<string>();
  for (const o of next.objects.values())
    if (objTiles(next, o).some(([c, r]) => next.kind(c, r) === 'sea' && l.kind(c, r) !== 'sea')) ids.add(o.id);
  const was = new Set(validate(l).map(issueKey));
  for (const i of validate(next)) if (!was.has(issueKey(i))) for (const id of i.ids) if (next.objects.has(id)) ids.add(id);
  return [...ids].sort().map((id) => {
    const o = next.objects.get(id)!;
    return { id, k: o.k, fixed: !!kindDef(o.k)?.fixed };
  });
}

/** An edge pushed out (`by` > 0) or pulled in (< 0) by |by| tiles: the new codes (null: it can't go that far) and what
 *  stands in the way. */
export function resizeEdge(l: Layout, edge: Edge, by: number): Resized {
  const codes = l.codes.slice();
  for (let k = 0; k < Math.abs(by); k++) if (!step(codes, edge, by > 0)) return { codes: null, blocked: [] };
  if (!by) return { codes, blocked: [] };
  return { codes, blocked: blockersOf(l, withTiles(l, codes)) };
}

/** A layout with these codes (the objects as they are). */
export function withTiles(l: Layout, codes: Uint8Array): Layout {
  const tiles: [number, number, number][] = [];
  for (let i = 0; i < codes.length; i++) if (codes[i] !== l.codes[i]) tiles.push([i % GRID.cols, Math.floor(i / GRID.cols), codes[i]]);
  return withChanges(l, { tiles });
}

/**
 * The blockers moved inside on `l` (the resized layout): each to its nearest clear tile (resolve.ts clearTile), the
 * fixed and the biggest first; one with nowhere near put away unless it's fixed (`stuck`: then the resize waits).
 */
export function moveInside(l: Layout, blocked: readonly Blocker[]): { layout: Layout; moved: string[]; removed: string[]; stuck: string[] } {
  const size = (b: Blocker) => objTiles(l, l.objects.get(b.id)!).length;
  const order = [...blocked].filter((b) => l.objects.has(b.id)).sort((a, b) => +b.fixed - +a.fixed || size(b) - size(a) || (a.id < b.id ? -1 : 1));
  let now = l;
  const moved: string[] = [], removed: string[] = [], stuck: string[] = [];
  for (const b of order) {
    const to = clearTile(now, b.id);
    const o = now.objects.get(b.id)!;
    if (to) {
      const next: Obj = { ...o, x: to[0], z: to[1] };
      delete (next as { n?: unknown }).n;
      now = withChanges(now, { set: [next] });
      moved.push(b.id);
    } else if (!b.fixed) {
      now = withChanges(now, { remove: [b.id] });
      removed.push(b.id);
    } else stuck.push(b.id);
  }
  return { layout: now, moved, removed, stuck };
}
