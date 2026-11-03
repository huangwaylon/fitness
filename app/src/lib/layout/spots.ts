// The island's daily spots from the layout (docs/island-layout.md "Derived, never hand-made"): where today's weeds may
// sprout and where today's fossils are buried, drawn from the layout's open grass, seeded by the date and the
// island's seed, so every phone (holding the same layout) picks the same. Open grass: a grass tile (any tier) that
// nothing stands on and nothing's tap area stands over (behind and beside a tree, a bush, a flower: it takes the tap),
// off the paths, the water and the sand, a walker can reach, and not right before a door, a board's front, a named
// spot or the stairs' foot. The picks spread out (farthest first, Mitchell's), each a little off its tile's middle.
import { seeded } from '#lib/random.ts';
import { GRID, TILE, idx, kindOf, onGrid, tileMid } from './grid.ts';
import { doorOf, objTiles, type Layout } from './model.ts';
import { kindDef } from './catalog.ts';
import { navOf, reachable } from './nav.ts';

type Pt = readonly [number, number];

const open = new WeakMap<Layout, [number, number][]>();
/** The layout's open grass tiles. */
export function openGrass(layout: Layout): [number, number][] {
  const had = open.get(layout);
  if (had) return had;
  const taken = new Set<string>();
  const mark = (c: number, r: number) => taken.add(`${c},${r}`);
  for (const o of layout.objects.values()) {
    for (const [c, r] of objTiles(layout, o)) mark(c, r);
    const def = kindDef(o.k);
    // what one walks up to: its door's tiles (a home, a board) and a spot's ring stay clear
    if (o.k === 'home' || def?.front) for (const [c, r] of doorOf(layout, o).tiles) mark(c, r);
    if (o.k === 'spot') for (const [c, r] of objTiles(layout, o)) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) mark(c + i, r + j);
    if (o.k === 'stairs') for (const [c, r] of objTiles(layout, o)) for (let j = -1; j <= 1; j++) mark(c, r + j);
    // a tree's canopy stands over the ground behind it and beside it on screen (its leaves take a tap there), a bush's
    // or a flower's thumb-sized tap area over the tiles round it
    const over = def?.group === 'tree' ? 2 : def?.group === 'bush' || def?.group === 'flower' ? 1 : -1;
    for (const [c, r] of over >= 0 ? objTiles(layout, o) : []) for (let j = 0; j <= over; j++) for (let i = -1; i <= 1; i++) mark(c + i, r + j);
  }
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
      if (reachable(nav, x, z)) out.push([c, r]);
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

const days = new Map<string, { layout: Layout; lawn: Pt[]; dig: Pt[] }>();
/** Today's weed spots (`lawn`, 15) and dig spots (`dig`, 8) on the layout: world points, seeded by the date. */
export function daySpots(layout: Layout, date: string, seed: string): { lawn: Pt[]; dig: Pt[] } {
  const key = `${date}|${seed}`;
  const had = days.get(key);
  if (had && had.layout === layout) return had;
  const tiles = openGrass(layout);
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
