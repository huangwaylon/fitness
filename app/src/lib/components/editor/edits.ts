// The layout editor's edits (docs/island-layout.md "The editor"), pure: each tool's change as a new Layout (model.ts
// withChanges), and undo's revert of one action over whatever the layout is now (a partner's changes since stay). The
// editor sends the ops between the layout and the new one (model.ts opsBetween) through the store, so every phone
// sees it live.
import { codeOf, idx, isWater, kindOf, onGrid, tierOf, TIERS, CHUNKS_X, CHUNKS_Z, chunkString, chunkXZ, CHUNK, GRID, TILE, type Kind } from '#lib/layout/grid.ts';
import { footprintOf, kindDef } from '#lib/layout/catalog.ts';
import { footOf, newObjId, originOf, withChanges, type Layout, type Obj } from '#lib/layout/model.ts';
import { diffLayouts } from '#lib/layout/diff.ts';
import { HOME_IDS, WHO_OF_HOME, type HomeStyle, type Who } from '#lib/layout/homes.ts';
import { validate } from '#lib/layout/validate.ts';
import { isSmallKind, seat } from '#lib/layout/tops.ts';
import { moveInside, resizeEdge, withTiles, type Blocker, type Edge } from '#lib/layout/resize.ts';
import { isCrop, isFence } from '#lib/layout/garden.ts';

type Facing = Obj['f'];

/** The tiles a square brush of `size` covers round (c, r). */
export function brushTiles(c: number, r: number, size: number): [number, number][] {
  const out: [number, number][] = [];
  const lo = -Math.floor((size - 1) / 2), hi = lo + size - 1;
  for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) if (onGrid(c + i, r + j)) out.push([c + i, r + j]);
  return out;
}

/** Paint a kind on tiles (the tier kept; the sea is always tier 0, and land painted on it starts at 0). */
export function paint(l: Layout, tiles: Iterable<[number, number]>, kind: Kind): Layout {
  const set: [number, number, number][] = [];
  for (const [c, r] of tiles) {
    if (!onGrid(c, r)) continue;
    const was = l.codes[idx(c, r)];
    const tier = kind === 'sea' || kindOf(was) === 'sea' ? 0 : tierOf(was);
    const code = codeOf(kind, tier);
    if (code !== was) set.push([c, r, code]);
  }
  return set.length ? withChanges(l, { tiles: set }) : l;
}

/** Raise (+1) or lower (−1) tiles a tier (0…3; the sea stays the sea). */
export function cliff(l: Layout, tiles: Iterable<[number, number]>, dir: 1 | -1): Layout {
  const set: [number, number, number][] = [];
  for (const [c, r] of tiles) {
    if (!onGrid(c, r)) continue;
    const was = l.codes[idx(c, r)], k = kindOf(was);
    if (k === 'sea') continue;
    const t = Math.max(0, Math.min(TIERS - 1, tierOf(was) + dir));
    if (t !== tierOf(was)) set.push([c, r, codeOf(k, t)]);
  }
  return set.length ? withChanges(l, { tiles: set }) : l;
}

/** A new object of a kind at a tile (its footprint's back-left), facing f, its variant s (the kind's first). A kind of
 *  one on the island (a visitors' spot) moves the one there instead. */
export function place(l: Layout, k: string, c: number, r: number, f: Facing, s: string | undefined, at: number): { layout: Layout; id: string } | null {
  const def = kindDef(k);
  if (!def) return null;
  // (the latest of its kind: the one in force, should two phones each have put one down)
  const id = (def.one && [...l.objects.values()].filter((o) => o.k === k).map((o) => o.id).sort().pop()) || newObjId(at);
  const o: Obj = { id, k, x: c, z: r, f: def.turns ? f : (f % 2) as Facing, ...((s ?? def.variants?.[0]) ? { s: s ?? def.variants![0] } : {}) };
  if (!inGrid(l, o)) return null;
  // (a small thing over a table: on its top, layout/tops.ts)
  return { layout: withChanges(l, { set: [seat(l, o)] }), id };
}

/** Whether an object's footprint lies on the grid. */
function inGrid(l: Layout, o: Obj): boolean {
  const [w, d] = footOf(l, o), [x, z] = originOf(l, o);
  return x >= 0 && z >= 0 && x + w <= GRID.cols && z + d <= GRID.rows;
}

/** Move objects by whole tiles (each kept on the grid: a move that would take one off it is clamped for all). */
export function move(l: Layout, ids: Iterable<string>, dc: number, dr: number): Layout {
  const os = [...ids].map((id) => l.objects.get(id)).filter((o): o is Obj => !!o);
  if (!os.length || (!dc && !dr)) return l;
  // clamp the step so every footprint stays on the grid
  for (const o of os) {
    const [w, d] = footOf(l, o), [x, z] = originOf(l, o);
    dc = Math.max(-x, Math.min(GRID.cols - w - x, dc));
    dr = Math.max(-z, Math.min(GRID.rows - d - z, dr));
  }
  if (!dc && !dr) return l;
  const next = withChanges(l, { set: os.map((o) => ({ id: o.id, k: o.k, x: o.x + dc, z: o.z + dr, f: o.f, ...(o.s ? { s: o.s } : {}), ...(o.on ? { on: o.on } : {}) })) });
  return settle(next, os.map((o) => o.id));
}

/** The small things among `ids` that moved without their table: on the top they're over now, else on the ground
 *  (layout/tops.ts seat); one moved with its table stays on it (the editor's commit carries it: carryTops). */
function settle(l: Layout, ids: readonly string[]): Layout {
  const set: Obj[] = [];
  for (const id of ids) {
    const o = l.objects.get(id);
    if (!o || !isSmallKind(o.k) || (o.on && ids.includes(o.on))) continue;
    const s = seat(l, o);
    if (s.on !== o.on) set.push(s);
  }
  return set.length ? withChanges(l, { set }) : l;
}

/** Turn objects a quarter (clockwise seen from above: f + 1), each about its footprint's back-left tile. */
/** Turn objects a quarter (f + 1), each about its footprint's back-left tile; a home about its door, and only `me`'s
 *  own (its facing is its owner's look: model.ts layoutOf), and never so its door or footprint goes wrong. */
export function rotate(l: Layout, ids: Iterable<string>, by = 1, me?: Who): Layout {
  const set: Obj[] = [];
  const homes: Partial<Record<Who, HomeStyle>> = {};
  for (const id of ids) {
    const o = l.objects.get(id);
    if (!o) continue;
    const owner = WHO_OF_HOME[id];
    if (owner) {
      if (owner !== me) continue;
      homes[owner] = { ...l.homes[owner], f: ((((o.f + by) % 4) + 4) % 4) as Facing };
      continue;
    }
    const next: Obj = { id, k: o.k, x: o.x, z: o.z, f: (((o.f + by) % 4) + 4) % 4 as Facing, ...(o.s ? { s: o.s } : {}), ...(o.on ? { on: o.on } : {}) };
    if (o.n) Object.assign(next, { n: o.n });
    if (inGrid(l, next)) set.push(next);
  }
  if (!set.length && !Object.keys(homes).length) return l;
  const out = withChanges(l, { set, homes });
  // a home turned only where its door stays reachable and its footprint clear
  for (const who of Object.keys(homes) as Who[]) if (homeBroken(out, who)) return rotate(l, [...ids].filter((i) => i !== HOME_IDS[who]), by, me);
  return out;
}

/** Whether a home's footprint or its door is wrong on this layout (validate.ts's errors about it). */
function homeBroken(l: Layout, who: Who): string | null {
  const id = HOME_IDS[who];
  const bad = validate(l).find((i) => i.level === 'error' && i.ids.includes(id) && ['overlap', 'off-land', 'on-water', 'split', 'door'].includes(i.code));
  return bad?.ja ?? null;
}

/** A variant for an object (a bush's species, a lantern's colour). */
export function restyle(l: Layout, id: string, s: string): Layout {
  const o = l.objects.get(id);
  if (!o || o.s === s) return l;
  return withChanges(l, { set: [{ ...o, s }] });
}

/** Whether an object may be removed (the goal trees, the homes, the named spots and the island's one-offs may not). */
export const removable = (o: Obj): boolean => !kindDef(o.k)?.fixed;

/** Remove objects (the fixed ones stay). */
export function remove(l: Layout, ids: Iterable<string>): Layout {
  const gone = [...ids].filter((id) => {
    const o = l.objects.get(id);
    return o && removable(o);
  });
  return gone.length ? withChanges(l, { remove: gone }) : l;
}

/** A copy of objects (their kinds, variants, facings and places relative to the first's tile). */
export interface Clip {
  items: { k: string; s?: string; f: Facing; dx: number; dz: number }[];
}
export function copy(l: Layout, ids: Iterable<string>): Clip | null {
  const os = [...ids].map((id) => l.objects.get(id)).filter((o): o is Obj => !!o && removable(o));
  if (!os.length) return null;
  const x0 = Math.min(...os.map((o) => o.x)), z0 = Math.min(...os.map((o) => o.z));
  return { items: os.map((o) => ({ k: o.k, ...(o.s ? { s: o.s } : {}), f: o.f, dx: o.x - x0, dz: o.z - z0 })) };
}
/** Paste a copy with its back-left at (c, r): new objects (new ids), those that fit on the grid. */
export function paste(l: Layout, clip: Clip, c: number, r: number, at: number): { layout: Layout; ids: string[] } {
  const set: Obj[] = [];
  clip.items.forEach((it, i) => {
    const o: Obj = { id: newObjId(at + i), k: it.k, x: c + it.dx, z: r + it.dz, f: it.f, ...(it.s ? { s: it.s } : {}) };
    if (inGrid(l, o)) set.push(o);
  });
  const ids = set.map((o) => o.id);
  return { layout: set.length ? settle(withChanges(l, { set }), ids) : l, ids };
}

/** The objects whose footprints a tile box (inclusive) touches. */
export function inBox(l: Layout, c0: number, r0: number, c1: number, r1: number): string[] {
  const [a, b] = [Math.min(c0, c1), Math.max(c0, c1)], [p, q] = [Math.min(r0, r1), Math.max(r0, r1)];
  const out: string[] = [];
  for (const o of l.objects.values()) {
    const [w, d] = footOf(l, o), [x, z] = originOf(l, o);
    if (x <= b && x + w - 1 >= a && z <= q && z + d - 1 >= p) out.push(o.id);
  }
  return out;
}

/** The object at a tile (the topmost: a small thing over a big one, a thing on a table's top over it), or null. With
 *  the point `at` (u) a thing on a top is taken only near its middle, its table by the rest of the tile. */
export function objectAt(l: Layout, c: number, r: number, at?: readonly [number, number]): Obj | null {
  let best: Obj | null = null, area = Infinity;
  for (const o of l.objects.values()) {
    const [w, d] = footOf(l, o), [x, z] = originOf(l, o);
    // (a thing on a table's top over its table)
    if (c >= x && c < x + w && r >= z && r < z + d && (w * d < area || (w * d === area && o.on && !best?.on))) {
      best = o;
      area = w * d;
    }
  }
  if (best?.on && at && Math.max(Math.abs(at[0] - (GRID.x0 + (c + 0.5) * TILE)), Math.abs(at[1] - (GRID.z0 + (r + 0.5) * TILE))) > TILE * 0.3) return l.objects.get(best.on) ?? best;
  return best;
}

/** The island's edge pushed out or pulled in (layout/resize.ts), one action: the new layout, or null with what's in the
 *  way (`blocked`, each a piece to select; `moveIn`: those moved inside, the ones with nowhere near put away, never a
 *  fixed one: one of those stuck leaves it null). */
export function resize(l: Layout, edge: Edge, by: number, moveIn = false): { layout: Layout | null; blocked: Blocker[]; stuck: string[]; removed: string[] } {
  const r = resizeEdge(l, edge, by);
  if (!r.codes) return { layout: null, blocked: [], stuck: [], removed: [] };
  const next = withTiles(l, r.codes);
  if (!r.blocked.length) return { layout: next, blocked: [], stuck: [], removed: [] };
  if (!moveIn) return { layout: null, blocked: r.blocked, stuck: [], removed: [] };
  const m = moveInside(next, r.blocked);
  return { layout: m.stuck.length ? null : m.layout, blocked: r.blocked, stuck: m.stuck, removed: m.removed };
}

/** Undo one action (before → after) over the layout as it is now: the chunks and the objects the action touched go
 *  back to how they were before it; anything else (a partner's change since) stays. */
export function revert(now: Layout, before: Layout, after: Layout): Layout {
  const d = diffLayouts(before, after);
  const tiles: [number, number, number][] = [];
  for (const i of d.chunks) {
    const [cx, cz] = chunkXZ(i);
    for (let j = 0; j < CHUNK; j++)
      for (let k = 0; k < CHUNK; k++) {
        const c = cx * CHUNK + k, r = cz * CHUNK + j;
        if (onGrid(c, r)) tiles.push([c, r, before.codes[idx(c, r)]]);
      }
  }
  const ids = new Set([...d.objects.add.map((o) => o.id), ...d.objects.move.map((o) => o.id), ...d.objects.remove]);
  const set: Obj[] = [], gone: string[] = [];
  for (const id of ids) {
    const o = before.objects.get(id);
    if (o) set.push(o);
    else gone.push(id);
  }
  const homes = d.homes.length ? Object.fromEntries(d.homes.map((w) => [w, before.homes[w]])) : undefined;
  return withChanges(now, { tiles, set, remove: gone, ...(homes ? { homes } : {}) });
}

/** Whether two layouts are the same island (the tiles, the objects, the homes' looks). */
export function sameLayout(a: Layout, b: Layout): boolean {
  if (a === b) return true;
  for (let i = 0; i < CHUNKS_X * CHUNKS_Z; i++) if (chunkString(a.codes, i) !== chunkString(b.codes, i)) return false;
  const d = diffLayouts(a, b);
  return !d.objects.add.length && !d.objects.move.length && !d.objects.remove.length && !d.homes.length;
}

/** A tile is water (for a ghost's quick check). */
export const wetAt = (l: Layout, c: number, r: number): boolean => isWater(l.kind(c, r));
/** A kind's footprint in a facing (for a ghost). */
export const ghostFoot = (k: string, f: number): [number, number] => {
  const def = kindDef(k);
  return def ? footprintOf(def, f) : [1, 1];
};

/** A kind put down in a run, a drag across tiles (the garden's: a fence, a crop; layout/garden.ts): one tile at a time. */
export const runs = (k: string): boolean => isFence(k) || isCrop(k);

/** The tiles a drag crosses from tile a to b, four-connected (each beside the last: a fence's run joins), a's not
 *  among them: across first, then along. */
export function runTiles(a: readonly [number, number], b: readonly [number, number]): [number, number][] {
  const out: [number, number][] = [];
  let [c, r] = a;
  while (c !== b[0]) out.push([(c += Math.sign(b[0] - c)), r]);
  while (r !== b[1]) out.push([c, (r += Math.sign(b[1] - r))]);
  return out;
}

/** A run's next pieces: one of the kind on each of `tiles` that's free (on land, nothing standing on it), facing f. */
export function placeRun(l: Layout, k: string, tiles: readonly (readonly [number, number])[], f: Facing, s: string | undefined, at: number): { layout: Layout; ids: string[] } {
  const ids: string[] = [];
  for (const [c, r] of tiles) {
    if (!onGrid(c, r) || isWater(l.kind(c, r)) || l.kind(c, r) === 'sea' || objectAt(l, c, r)) continue;
    const p = place(l, k, c, r, f, s, at + ids.length);
    if (!p) continue;
    l = p.layout;
    ids.push(p.id);
  }
  return { layout: l, ids };
}
