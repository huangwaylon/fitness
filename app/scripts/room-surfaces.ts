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

// ---- seats and beds (scripts/seat-anchors.ts → villager3d/seats3d.json): where a villager sits or lies on a piece ----
//   From the same rays down. A seat is the piece's widest flat level under SEAT_MAX (the seat's top: a chair's, a
//   sofa's cushions, a stool's, a bench's boards; its back and arms are higher and smaller), its rectangle the samples
//   at that level; its back what stands over it behind the seat's middle. A sofa's or a bench's seats split it across.
//   A bed's mattress is its widest flat level (a little looser: a futon's, a hammock's cloth sags), lain along its
//   longer side, the head at the end that is higher (the pillow, the headboard), the −1 end when it can't tell; a double
//   bed's two lie side by side.

export interface SeatShape {
  k: 's';
  /** The seat's top (model units off the floor), its middles across (x), its back edge and front edge (z), how high
   *  its back stands over it (0: none, a stool, a bench without one). */
  y: number;
  x: number[];
  z0: number;
  z1: number;
  back: number;
}
export interface BedShape {
  k: 'l';
  /** The mattress's top; lain along x or z, the head at −1 or +1 of that axis; from s0 to s1 along it; the middles
   *  across (one a sleeper); how much higher the pillow end is. */
  y: number;
  a: 'x' | 'z';
  head: -1 | 1;
  s: [number, number];
  c: number[];
  py: number;
}

const SEAT_FLAT = 0.6, BED_FLAT = 0.45, SEAT_MAX = 13, BAND = 0.4;
const quant = (v: readonly number[], q: number) => {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))];
};
const med = (v: readonly number[]) => quant(v, 0.5);

/** The most common height of `ys` (bands BAND tall, merged with their neighbours). */
function widest(ys: readonly number[]): number | null {
  if (!ys.length) return null;
  const s = [...ys].sort((a, b) => a - b), groups: number[][] = [];
  for (const y of s) {
    const g = groups[groups.length - 1];
    if (g && y - g[g.length - 1] <= BAND) g.push(y);
    else groups.push([y]);
  }
  return med(groups.sort((a, b) => b.length - a.length)[0]);
}

type Cell = { x: number; z: number; top: number; flat: boolean };
function cellsOf(s: Sample, w: number, d: number, step: number, flat: number): Cell[] {
  const W = w * TILE, D = d * TILE, out: Cell[] = [];
  s.grid.forEach((col, i) => col.forEach((h, j) => {
    if (h[0]) out.push({ x: -W / 2 + (i + 0.5) * step, z: -D / 2 + (j + 0.5) * step, top: h[0][0], flat: h[0][1] >= flat });
  }));
  return out;
}

export function seatOf(s: Sample, w: number, d: number, step: number, n: number): SeatShape | null {
  const cells = cellsOf(s, w, d, step, SEAT_FLAT);
  const y = widest(cells.filter((c) => c.flat && c.top >= 0.5 && c.top <= SEAT_MAX).map((c) => c.top));
  if (y === null) return null;
  const seat = cells.filter((c) => c.flat && Math.abs(c.top - y) <= 0.8);
  const x0 = quant(seat.map((c) => c.x), 0.03), x1 = quant(seat.map((c) => c.x), 0.97);
  const z0 = quant(seat.map((c) => c.z), 0.05), z1 = quant(seat.map((c) => c.z), 0.97), zm = (z0 + z1) / 2;
  // its back: over the seat's width, behind its middle, a good deal higher
  const backs = cells.filter((c) => c.x >= x0 && c.x <= x1 && c.z < zm && c.top > y + 2.5);
  const cols = new Set(backs.map((c) => Math.round(c.x / step))).size, across = Math.max(1, Math.round((x1 - x0) / step));
  const back = cols >= across * 0.4 ? r1(med(backs.map((c) => c.top)) - y) : 0;
  const x = Array.from({ length: n }, (_, k) => r1(x0 + ((k + 0.5) / n) * (x1 - x0)));
  return { k: 's', y: r1(y), x, z0: r1(z0), z1: r1(z1), back };
}

export function bedOf(s: Sample, w: number, d: number, step: number, n: number, h: number): BedShape | null {
  const cells = cellsOf(s, w, d, step, BED_FLAT);
  const y = widest(cells.filter((c) => c.flat && c.top >= 0.3 && c.top <= Math.max(1, h * 0.85)).map((c) => c.top));
  if (y === null) return null;
  const bed = cells.filter((c) => c.flat && Math.abs(c.top - y) <= 1.2);
  const xs = bed.map((c) => c.x), zs = bed.map((c) => c.z);
  const ex = [quant(xs, 0.03), quant(xs, 0.97)], ez = [quant(zs, 0.03), quant(zs, 0.97)];
  const a: 'x' | 'z' = ex[1] - ex[0] >= ez[1] - ez[0] ? 'x' : 'z';
  const [s0, s1] = a === 'x' ? ex : ez, [c0, c1] = a === 'x' ? ez : ex;
  const along = (c: Cell) => (a === 'x' ? c.x : c.z), acrossOf = (c: Cell) => (a === 'x' ? c.z : c.x);
  // each end's rise over the mattress (its fifth along the bed, over the bed's width)
  const rise = (lo: number, hi: number) => {
    const v = cells.filter((c) => along(c) >= lo && along(c) <= hi && acrossOf(c) >= c0 && acrossOf(c) <= c1 && c.top <= y + 6).map((c) => c.top - y);
    return v.length ? v.reduce((p, q) => p + q, 0) / v.length : 0;
  };
  const L = s1 - s0, lo = rise(s0, s0 + L * 0.22), hi = rise(s1 - L * 0.22, s1);
  const head: -1 | 1 = Math.abs(lo - hi) < 0.25 || lo > hi ? -1 : 1;
  const c = Array.from({ length: n }, (_, k) => r1(c0 + ((k + 0.5) / n) * (c1 - c0)));
  return { k: 'l', y: r1(y), a, head, s: [r1(s0), r1(s1)], c, py: r1(Math.max(0, Math.min(3, Math.max(lo, hi)))) };
}
