// The island's daily spots from the layout (docs/island-layout.md "Derived, never hand-made"): where today's weeds may
// sprout and where today's fossils are buried, drawn from the layout's open grass, seeded by the date and the
// island's seed, so every phone (holding the same layout) picks the same. Open grass: a grass tile (any tier) that
// nothing stands on and nothing's tap area stands over (behind and beside a tree, a bush, a flower: it takes the tap),
// off the paths, the water and the sand, a walker can reach, and not right before a door, a board's front, a named
// spot or the stairs' foot. The picks spread out (farthest first, Mitchell's), each a little off its tile's middle.
import { seeded } from '#lib/random.ts';
import { GRID, PATHS, TILE, idx, kindOf, onGrid, tileAt, tileMid, tileX, tileZ } from './grid.ts';
import { doorOf, extentOf, footOf, objMid, objTiles, originOf, type Layout, type Obj } from './model.ts';
import { isMarker, kindDef } from './catalog.ts';
import { navOf, reachable } from './nav.ts';
import { onBuilding, tapCovered } from './clear.ts';

type Pt = readonly [number, number];

const open = new WeakMap<Layout, [number, number][]>();
/** The layout's open grass tiles. */
export function openGrass(layout: Layout): [number, number][] {
  const had = open.get(layout);
  if (had) return had;
  const taken = tapCovered(layout);
  const nav = navOf(layout);
  const out: [number, number][] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      if (!onGrid(c, r) || kindOf(layout.codes[idx(c, r)]) !== 'grass' || taken.has(`${c},${r}`)) continue;
      // never at a bank or a cliff's lip: its four neighbours dry land of its tier
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => {
        const k = layout.kind(c + dc, r + dr);
        return k === 'sea' || k === 'river' || k === 'pond' || layout.tier(c + dc, r + dr) !== layout.tier(c, r);
      })) continue;
      const [x, z] = tileMid(c, r);
      // (nor on a building's ground: its door's step, the strip behind it its model hides: clear.ts)
      if (reachable(nav, x, z) && !onBuilding(nav, x, z)) out.push([c, r]);
    }
  open.set(layout, out);
  return out;
}

/** `n` tiles of `from`, spread out (each the farthest of a few seeded candidates from those already picked), avoiding
 *  `away` (tiles taken already). */
function spread(from: readonly [number, number][], n: number, rand: () => number, away: readonly [number, number][] = []): [number, number][] {
  const out: [number, number][] = [];
  const pool = from.filter(([c, r]) => !away.some(([a, b]) => a === c && b === r));
  for (let k = 0; k < n && pool.length; k++) {
    let best = -1, bestD = -1;
    for (let t = 0; t < 12; t++) {
      const i = Math.floor(rand() * pool.length);
      const [c, r] = pool[i];
      const d = Math.min(Infinity, ...[...out, ...away].map(([a, b]) => Math.hypot(a - c, b - r)));
      if (d > bestD) [best, bestD] = [i, d];
    }
    out.push(pool[best]);
    pool.splice(best, 1);
  }
  return out;
}

/** How far behind the villagers' spots the visitors' stage is looked for (u): mid-screen as the island opens (the
 *  camera's first stop frames the villagers a little below the middle). */
const STAGE_BACK = 200;
/** How far in front of a thing (u, a share of its height) it hides what stands behind it on screen, and how far behind
 *  it a figure's head reaches over it: the camera looks down at 58°, a card stands taller than its model. */
const HIDES = 1.1, OVER = 60;
/** A villager standing at its spot: its height (u). */
const VILLAGER_H = 70;
const stages = new WeakMap<Layout, Pt | null>();
type Box = { x0: number; x1: number; z0: number; z1: number; h: number };
type Ground = { patch(c: number, r: number, back: number, front: number): boolean; seen(c: number, r: number): boolean };
const grounds = new WeakMap<Layout, Ground>();
/** The stage's checks on a layout: `patch`, a clear patch round a tile (`back` rows behind it, `front` before it, a tile
 *  each side: grass or a path of its tier that nothing stands on, no water, no door); `seen`, nothing tall in front of a
 *  figure there on screen (a tree, a home, a villager at its spot: nor anything one taps right behind it, a flower or a
 *  rock, whose tap area its head would cover). The visitors' spots (marks) stand on nothing. */
function groundOf(layout: Layout): Ground {
  const had = grounds.get(layout);
  if (had) return had;
  const used = new Set<number>();
  // what one taps or sees: its box on the ground (u) and its height
  const things: Box[] = [];
  for (const o of layout.objects.values()) {
    if (isMarker(o.k)) continue;
    for (const [c, r] of objTiles(layout, o)) used.add(idx(c, r));
    if (o.k === 'home' || o.k === 'museum' || o.k === 'shop' || kindDef(o.k)?.front) for (const [c, r] of doorOf(layout, o).tiles) used.add(idx(c, r));
    const def = kindDef(o.k), villager = o.k === 'spot' && o.s !== 'stage', h = villager ? VILLAGER_H : (def?.h ?? 0);
    // (everything one taps: a short thing hides nothing, but a figure standing just in front covers its tap area)
    if (o.k === 'spot' && !villager || o.k === 'bridge' || o.k === 'stairs' || o.k === 'pond') continue;
    const [w, d] = footOf(layout, o), [c0, r0] = originOf(layout, o), mid = tileX(c0) + (w * TILE) / 2;
    // (a tree's canopy, and its tap area, is wider than its tile)
    const hw = def?.group === 'tree' ? 50 : villager ? 18 : (w * TILE) / 2;
    things.push({ x0: mid - hw, x1: mid + hw, z0: tileZ(r0), z1: tileZ(r0 + d), h });
  }
  // (round it: ground of its tier, a path beside it too, that nothing stands on)
  const clear = (c: number, r: number, tier: number) => onGrid(c, r) && (layout.kind(c, r) === 'grass' || PATHS.includes(layout.kind(c, r))) && layout.tier(c, r) === tier && !used.has(idx(c, r));
  const g: Ground = {
    patch(c, r, back, front) {
      const t = layout.tier(c, r);
      for (let j = -front; j <= back; j++) for (let i = -1; i <= 1; i++) if (!clear(c + i, r + j, t)) return false;
      return true;
    },
    // (nothing over a figure there on screen, nor under it: its half width 30, Reese and Cyrus side by side)
    seen(c, r) {
      const [x, z] = tileMid(c, r);
      return !things.some((b) => x + 30 > b.x0 && x - 30 < b.x1 && z > b.z0 - OVER && z < b.z1 + b.h * HIDES);
    }
  };
  grounds.set(layout, g);
  return g;
}

type MarkerKind = 'plaza' | 'beach-spot';
/** A visitors' spot of a kind on the layout (catalog.ts `plaza`, `beach-spot`): the latest put down (two phones may
 *  each have put one down at once: a new one's id is its time's), or null. */
export function markerOf(layout: Layout, k: MarkerKind): Obj | null {
  let best: Obj | null = null;
  for (const o of layout.objects.values()) if (o.k === k && (!best || o.id > best.id)) best = o;
  return best;
}

/** Whether the visitors may stand on a tile (the plaza's mark there): grass or a path, a clear patch round it (a tile
 *  each side, one behind for the wedding's arch, one in front for a birthday's cake) and a walker reaches it. What
 *  stands in front of it on screen is the members' choice (the derived stage keeps clear of that too). */
export function plazaOk(layout: Layout, c: number, r: number): boolean {
  if (!onGrid(c, r) || !groundOf(layout).patch(c, r, 1, 1)) return false;
  const [x, z] = tileMid(c, r);
  return reachable(navOf(layout), x, z);
}

const beachTaken = new WeakMap<Layout, Set<number>>();
/** The tiles round what stands on the layout (a tile each side, three behind, one in front), the marks aside. */
function beachUsed(layout: Layout): Set<number> {
  const had = beachTaken.get(layout);
  if (had) return had;
  const used = new Set<number>();
  for (const o of layout.objects.values()) if (!isMarker(o.k)) for (const [c, r] of objTiles(layout, o)) for (let i = -1; i <= 1; i++) for (let j = -3; j <= 1; j++) used.add(idx(c + i, r + j));
  beachTaken.set(layout, used);
  return used;
}
/** Whether Gulliver may lie on a tile (his mark there): sand, sand each side (he lies across), nothing standing a tile
 *  round it nor a few tiles behind (awake, he stands as tall as a villager), and a walker reaches it. */
export function beachOk(layout: Layout, c: number, r: number): boolean {
  if (!onGrid(c, r) || layout.kind(c, r) !== 'sand' || layout.kind(c - 1, r) !== 'sand' || layout.kind(c + 1, r) !== 'sand' || beachUsed(layout).has(idx(c, r))) return false;
  const [x, z] = tileMid(c, r);
  return reachable(navOf(layout), x, z);
}

/** A visitors' spot on the layout (null: none put down): its id and where they stand by it (`at` null: they can't
 *  now, something's in the way, so the island's own spot instead). The same on every phone (the layout's alone). */
export function markerSpot(layout: Layout, k: MarkerKind): { id: string; at: Pt | null } | null {
  const o = markerOf(layout, k);
  if (!o) return null;
  return { id: o.id, at: (k === 'plaza' ? plazaOk : beachOk)(layout, o.x, o.z) ? tileMid(o.x, o.z) : null };
}

/** Where the visitors stand (docs/design.md "Visitors"), NH's plaza on our island: the plaza's mark when the members
 *  have put one down and it can be used (plazaOk), else the island's own: the open grass tile nearest a point on the
 *  island's middle line a little behind the villagers' spots (where the camera opens), with a clear patch round it (a
 *  tile each side, one behind, one in front for a birthday’s cake: groundOf's patch; itself off the paths) and nothing
 *  tall in front of it on screen (groundOf's seen), else with only the tiles beside it clear, else the nearest open
 *  grass. A function of the layout alone, so every phone holding it puts them in the same place, and a もようがえ moves
 *  them with it. Null: no open grass at all. */
export function stageOf(layout: Layout): Pt | null {
  if (stages.has(layout)) return stages.get(layout)!;
  let best: Pt | null = markerSpot(layout, 'plaza')?.at ?? null;
  if (!best) {
    const tiles = openGrass(layout), { patch, seen } = groundOf(layout);
    const ext = extentOf(layout), spots = [...layout.objects.values()].filter((o) => o.k === 'spot' && o.s !== 'stage').map((o) => objMid(layout, o));
    const ax = (ext.land.x0 + ext.land.x1) / 2;
    const az = (spots.length ? spots.reduce((s, p) => s + p[1], 0) / spots.length : ext.shore + 255) + STAGE_BACK;
    const cost = ([c, r]: [number, number]) => {
      const [x, z] = tileMid(c, r);
      return Math.hypot((x - ax) * 1.5, z - az);
    };
    for (const ok of [(c: number, r: number) => patch(c, r, 1, 1) && seen(c, r), (c: number, r: number) => patch(c, r, 0, 0) && seen(c, r), () => true]) {
      let bc = Infinity;
      // (row by row, left to right: a tie goes the same way on every phone)
      for (const t of tiles) if (ok(t[0], t[1]) && cost(t) < bc) [bc, best] = [cost(t), tileMid(t[0], t[1])];
      if (best) break;
    }
  }
  stages.set(layout, best);
  return best;
}

/** Where Gulliver lies washed up on a date (NH: face down on the beach): at his mark's tile's middle when the members
 *  have put one down and it can be used (beachOk), else a sand tile two in from the sea, a tile of
 *  free sand each side (he lies across), nothing standing there, a walker reaches it, within the middle 270u (in view
 *  as the camera opens), picked by the date and the island's seed; at that tile's landward edge. Null: no such sand. */
export function washedUp(layout: Layout, date: string, seed: string): Pt | null {
  const marked = markerSpot(layout, 'beach-spot')?.at;
  if (marked) return marked;
  // (nothing round him, nor a few tiles behind: awake, he stands as tall as a villager and his head would cover its tap)
  const used = beachUsed(layout);
  const ext = extentOf(layout), mid = (ext.land.x0 + ext.land.x1) / 2, nav = navOf(layout);
  const sand = (c: number, r: number) => onGrid(c, r) && layout.kind(c, r) === 'sand' && !used.has(idx(c, r));
  const out: Pt[] = [];
  for (let r = 1; r < GRID.rows; r++)
    for (let c = 1; c < GRID.cols - 1; c++) {
      // (his tile clear of everything a tile round it, the sand beside it for his length)
      if (layout.kind(c, r - 2) !== 'sea' || layout.kind(c, r - 1) !== 'sand' || !sand(c, r) || layout.kind(c - 1, r) !== 'sand' || layout.kind(c + 1, r) !== 'sand') continue;
      const [x, z] = tileMid(c, r);
      if (Math.abs(x - mid) <= 135 && reachable(nav, x, z + TILE / 2)) out.push([x, z + TILE / 2]);
    }
  return out.length ? out[Math.floor(seeded(`${seed}|${date}|washed-up`)() * out.length)] : null;
}

const days = new Map<string, { layout: Layout; lawn: Pt[]; dig: Pt[] }>();
/** Today's weed spots (`lawn`, 15) and dig spots (`dig`, 8) on the layout: world points, seeded by the date. */
export function daySpots(layout: Layout, date: string, seed: string): { lawn: Pt[]; dig: Pt[] } {
  const key = `${date}|${seed}`;
  const had = days.get(key);
  if (had && had.layout === layout) return had;
  // (the visitors' stage and the tiles round it stay clear, and a few behind it: a figure there covers their tap)
  const st = stageOf(layout), [sc, sr] = st ? tileAt(st[0], st[1]) : [-9, -9];
  const tiles = openGrass(layout).filter(([c, r]) => Math.abs(c - sc) > 1 || r - sr > 3 || sr - r > 2);
  const rand = seeded(`${seed}|${date}|layout-spots`);
  const jit = (t: [number, number]): Pt => {
    const [x, z] = tileMid(t[0], t[1]);
    return [Math.round(x + (rand() - 0.5) * TILE * 0.4), Math.round(z + (rand() - 0.5) * TILE * 0.4)];
  };
  const dig = spread(tiles, 8, rand);
  const lawn = spread(tiles, 15, rand, dig);
  const day = { layout, dig: dig.map(jit), lawn: lawn.map(jit) };
  if (days.size > 6) days.clear();
  days.set(key, day);
  return day;
}
