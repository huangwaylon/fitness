// The island's buildings on an island that's already been arranged (docs/island-layout.md "The island's buildings"),
// pure: a building new to the catalogue (the museum) comes in the default layout at its default spot, as every default
// piece does; on an island the members have arranged since, that spot may be taken (their own trees, a path's lamp).
// Then, once, a member's phone puts it on the free spot nearest its default (facing the camera if it can): one `o` op
// of its id, as the editor's move would be, so it stays put from then on and every phone holds it. The guest never
// sends one (the record refuses its outdoor ops anyway); an island where it already has an op (moved, or placed here
// before) is left as it is.
import { isVoid, resetAt, type LayoutEntry, type LayoutOp } from '#lib/contract/layout.ts';
import { KIND_LIST } from './catalog.ts';
import { GRID, PATHS, isWater, kindOf, tierOf, idx, onGrid } from './grid.ts';
import { defaultLayout, doorOf, layoutOf, objMid, objTiles, withChanges, type Layout, type Obj } from './model.ts';
import { validate } from './validate.ts';

type Facing = Obj['f'];
/** A turned spot costs this much more than one facing the camera (u): the camera's way first, nearby. */
const TURN_COST = 90;
/** How many of the nearest spots the full check (validate.ts: the walk, the doors) looks at, at most. */
const TRIES = 40;

/** Whether the building has an error of its own here (overlapping, off the land, its door walled in). */
const wrong = (l: Layout, id: string): boolean => validate(l).some((i) => i.level === 'error' && i.ids.includes(id));

/** A spot for a building: its tile and facing, and the flowers it clears (their ids). */
interface Spot { x: number; z: number; f: Facing; clear: string[] }
/** A flower cleared costs this much more (u): an empty spot first, then the one that clears fewest, nearby. */
const FLOWER_COST = 60;
/** At most this many flowers cleared for one building. */
const FLOWERS_MAX = 12;

/**
 * The free spot nearest `o`'s own for it (its tile and facing), or null when nowhere fits. With `flowers`, a spot may
 * stand where flowers grow (and only flowers: the island's own trees, bushes, furniture and paths stay), clearing them:
 * an island planted edge to edge (the record's of 2026-11-04, flower borders down both sides) has no 7 × 4 spot clear.
 */
function freeSpot(l: Layout, o: Obj, flowers = false): Spot | null {
  const without = withChanges(l, { remove: [o.id] });
  // the tiles something stands on (a flower too, unless it may be cleared: none may stand in a building), and the
  // ground's kind and tier
  const taken = new Set<string>();
  const bloom = new Map<string, string>();
  for (const p of without.objects.values()) {
    if (p.k === 'spot') continue;
    for (const [c, r] of objTiles(without, p)) (flowers && p.k === 'flower' ? bloom.set(`${c},${r}`, p.id) : taken.add(`${c},${r}`));
  }
  const ground = (c: number, r: number) => (onGrid(c, r) ? l.codes[idx(c, r)] : -1);
  const [ox, oz] = objMid(l, o);
  const cands: (Spot & { cost: number })[] = [];
  for (let f = 0; f < 4; f++)
    for (let z = 0; z < GRID.rows; z++)
      for (let x = 0; x < GRID.cols; x++) {
        const c = { ...o, x, z, f: f as Facing };
        const tiles = objTiles(without, c);
        const t0 = ground(tiles[0][0], tiles[0][1]);
        if (t0 < 0) continue;
        const tier = tierOf(t0);
        const clear = new Set<string>();
        const ok = (cc: number, rr: number) => {
          const g = ground(cc, rr);
          const id = bloom.get(`${cc},${rr}`);
          if (id) clear.add(id);
          return g >= 0 && !isWater(kindOf(g)) && kindOf(g) !== 'sea' && tierOf(g) === tier && !taken.has(`${cc},${rr}`);
        };
        // (clearing flowers, never over a path either: its door may open onto one)
        const off = (cc: number, rr: number) => ok(cc, rr) && !(flowers && PATHS.includes(kindOf(ground(cc, rr))));
        if (!tiles.every(([cc, rr]) => off(cc, rr)) || !doorOf(without, c).tiles.every(([cc, rr]) => ok(cc, rr)) || clear.size > FLOWERS_MAX) continue;
        const [mx, mz] = objMid(without, c);
        cands.push({ x, z, f: f as Facing, clear: [...clear], cost: Math.hypot(mx - ox, mz - oz) + (f ? TURN_COST : 0) + clear.size * FLOWER_COST });
      }
  cands.sort((a, b) => a.cost - b.cost);
  // nothing wrong of its own, and nothing else made wrong by it (a named spot it would wall in: the shop after the museum)
  const errors = (x: Layout) => validate(x).filter((i) => i.level === 'error').length;
  const before = errors(without);
  for (const c of cands.slice(0, TRIES)) {
    const at = withChanges(l, { set: [{ ...o, x: c.x, z: c.z, f: c.f }], remove: c.clear });
    if (!wrong(at, o.id) && errors(at) <= before) return { x: c.x, z: c.z, f: c.f, clear: c.clear };
  }
  return null;
}

/** The ops that move the default's buildings that stand wrong on this island (and have no op of their own yet) to the
 *  free spot nearest their default, at `at` on (each its own time). */
export function buildingOps(merged: ReadonlyMap<string, LayoutEntry>, me: 'A' | 'B' | 'G', at: number): LayoutOp[] {
  if (me === 'G') return [];
  const reset = resetAt(merged);
  const out: LayoutOp[] = [];
  let l: Layout | null = null;
  let t = Math.max(at, reset + 1);
  for (const def of KIND_LIST) {
    if (!def.door) continue;
    for (const d of defaultLayout().objects.values()) {
      if (d.k !== def.k) continue;
      const e = merged.get(`o|${d.id}`);
      if (e && !isVoid(e, reset)) continue;
      l ??= layoutOf(new Map(merged));
      const o = l.objects.get(d.id);
      if (!o || !wrong(l, o.id)) continue;
      const s = freeSpot(l, o) ?? freeSpot(l, o, true);
      if (!s) continue;
      // the flowers it clears go first (each a removal, as the editor's), then the building
      for (const id of s.clear) out.push({ sc: 'o', id, at: t++, rm: true });
      out.push({ sc: 'o', id: o.id, at: t++, k: o.k, x: s.x, z: s.z, f: s.f });
      l = withChanges(l, { set: [{ ...o, x: s.x, z: s.z, f: s.f }], remove: s.clear });
    }
  }
  return out;
}
