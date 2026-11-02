// A surface's top from its model (scripts/room-models.ts; docs/design.md "The tent", "Table tops"), pure: NH's
// surfaces hold small things on their TOP only (a shelf's inner shelves and a wardrobe's inside are never places), at
// the top's own height, one thing a tile. The game files carry no such data and a model's bounds are no good (the log
// shelves' bounds are their ornaments, a tool shelf's its tools), so the top is found from the geometry the tent
// draws: rays straight down over the footprint (scripts/room-surfaces-page.js), each one's hits from the top.
//   - a column's top is its first hit when that faces up (flat: normal.y ≥ FLAT); the piece's levels are those heights
//     clustered (within MERGE), a level counting when it covers enough (≥ LEVEL_MIN of the largest level and
//     ≥ AREA_MIN of the footprint: a vase or a tool standing on it is no level); the top is the highest that counts
//     (a lower one, a hat table's brim or a sink's basin, holds nothing);
//   - a tile (a slot) holds a thing when the top covers ≥ SLOT_MIN of its core (the middle CORE units across: where a
//     thing stands), so a tile with no top there (a chair's back, a bed's headboard, a kitchen's sink) holds none;
//   - under a roof: a piece whose top is a roof over a working level (the system kitchen's cabinets over its counter,
//     the loft bed over its desk) has its things on that level when it is open in front, clear by ≥ ROOM_MIN above
//     and covers ≥ ROOF_MIN of the footprint (a shelf's inner shelves are too low between, a wardrobe's inside is
//     closed: those keep their top); the roof itself then holds nothing;
//   - the top rectangle: where the chosen levels' samples are, so a thing on a tile whose middle isn't on the top (a
//     mantel narrower than its tile) stands at the nearest point that is.

/** One ray's hits from the top: [y, normal.y]. */
type Hits = readonly (readonly [number, number])[];
export interface Sample {
  /** The rays: [i across][j deep], i at x = −W/2 + (i + ½)·step, j at z = −D/2 + (j + ½)·step. */
  grid: readonly (readonly Hits[])[];
  /** A look from the front at each column and height ((k + ½)·step): the z of the first thing in the way, or null. */
  front: readonly (readonly (number | null)[])[];
}
export interface Top {
  /** The top's height (model units off the floor). */
  sy: number;
  /** The top's rectangle in the piece's own frame (model units, its middle at 0): x0, z0, x1, z1. */
  st: [number, number, number, number];
  /** The tiles that hold a thing (the piece's own footprint, unturned): [sx, sz]. */
  sl: [number, number][];
}

const FLAT = 0.9, MERGE = 0.6, LEVEL_MIN = 0.5, AREA_MIN = 0.03, SLOT_MIN = 0.15, CORE = 6;
const ROOM_MIN = 9, ROOF_MIN = 0.4;
const TILE = 10;
const r1 = (n: number) => Math.round(n * 10) / 10;

export function topOf(s: Sample, w: number, d: number, step: number): Top | null {
  const nx = s.grid.length, nz = s.grid[0]?.length ?? 0, n = nx * nz;
  if (!n) return null;
  const W = w * TILE, D = d * TILE;
  const xOf = (i: number) => -W / 2 + (i + 0.5) * step, zOf = (j: number) => -D / 2 + (j + 0.5) * step;
  // each column's first hit, when flat and facing up
  const first: (number | null)[][] = s.grid.map((col) => col.map((h) => (h[0] && h[0][1] >= FLAT ? h[0][0] : null)));
  // the levels: the first hits' heights clustered
  // (the top only: the highest level that counts; a lower one, a hat table's brim, a sink's basin, holds nothing)
  const levels = cluster(first.flat().filter((y): y is number => y !== null), n).slice(0, 1);
  if (!levels.length) return null;
  // under a roof: a level below the top, open in front, clear above, over enough of the footprint
  const under = new Map<string, number>();
  {
    const found: { i: number; j: number; y: number }[] = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const hits = s.grid[i][j];
      for (let k = 1; k < hits.length; k++) {
        const [y, ny] = hits[k];
        if (ny < FLAT) continue;
        // the nearest thing above it (an underside or a face more than a hair over it)
        const above = hits.slice(0, k).reverse().find(([ya]) => ya > y + 0.15);
        if (!above || above[0] - y < ROOM_MIN) continue;
        // open in front: a look from the front a little over it reaches it
        const open = [2, 5].every((dy) => {
          const k2 = Math.floor((y + dy) / step), z = s.front[i]?.[k2];
          return z === undefined || z === null || z <= zOf(j) + 0.5;
        });
        if (open) found.push({ i, j, y });
        break;
      }
    }
    const roofLevels = cluster(found.map((f) => f.y), n).filter((l) => l.cover >= ROOF_MIN);
    for (const f of found) {
      const l = roofLevels.find((l) => Math.abs(l.y - f.y) <= MERGE);
      if (l) under.set(`${f.i},${f.j}`, l.y);
    }
  }
  // each column's level (under a roof, its working level only: the roof is no place for things)
  const roofed = under.size > 0;
  const at = (i: number, j: number): number | null => {
    if (roofed) return under.get(`${i},${j}`) ?? null;
    const y = first[i][j];
    if (y === null) return null;
    const l = levels.find((l) => Math.abs(l.y - y) <= MERGE);
    return l ? l.y : null;
  };
  // the slots: each tile's highest level over enough of its core
  const sl: [number, number][] = [];
  const used: [number, number][] = [];
  let sy = 0;
  for (let sx = 0; sx < w; sx++) for (let sz = 0; sz < d; sz++) {
    const cx = -W / 2 + (sx + 0.5) * TILE, cz = -D / 2 + (sz + 0.5) * TILE;
    const count = new Map<number, number>();
    let all = 0;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      if (Math.abs(xOf(i) - cx) > CORE / 2 || Math.abs(zOf(j) - cz) > CORE / 2) continue;
      all++;
      const y = at(i, j);
      if (y !== null) count.set(y, (count.get(y) ?? 0) + 1);
    }
    const best = [...count].filter(([, c]) => c / all >= SLOT_MIN).sort((a, b) => b[0] - a[0])[0];
    if (!best) continue;
    sl.push([sx, sz]);
    sy = Math.max(sy, best[0]);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      if (Math.abs(xOf(i) - cx) > TILE / 2 || Math.abs(zOf(j) - cz) > TILE / 2) continue;
      const y = at(i, j);
      if (y !== null && Math.abs(y - best[0]) <= MERGE) used.push([xOf(i), zOf(j)]);
    }
  }
  if (!sl.length) return null;
  const xs = used.map((p) => p[0]), zs = used.map((p) => p[1]);
  const st: [number, number, number, number] = [
    r1(Math.min(...xs) - step / 2), r1(Math.min(...zs) - step / 2), r1(Math.max(...xs) + step / 2), r1(Math.max(...zs) + step / 2)
  ];
  return { sy: r1(sy), st, sl };
}

/** Heights clustered (each within MERGE of its neighbour), the ones that count: their height (the most common) and
 *  how much of the footprint (n samples) they cover. */
function cluster(ys: readonly number[], n: number): { y: number; cover: number }[] {
  const sorted = [...ys].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const y of sorted) {
    const g = groups[groups.length - 1];
    if (g && y - g[g.length - 1] <= MERGE / 2) g.push(y);
    else groups.push([y]);
  }
  const out = groups.map((g) => {
    // the height most of it is at (a table's top, not its rim): the median
    return { y: g[Math.floor(g.length / 2)], cover: g.length / n };
  });
  const big = Math.max(0, ...out.map((l) => l.cover));
  return out.filter((l) => l.cover >= AREA_MIN && l.cover >= LEVEL_MIN * big).sort((a, b) => b.y - a.y);
}
