// The museum's plan (docs/design.md "The museum"), pure: NH's museum on one floor, in model units (a tile is 10, a
// villager 16 tall: the tent's room's scale, tent/grid.ts), +z toward the camera (the front door):
//   the entrance hall   12 × 12 tiles round the middle, its front door at +z, an opening in each side wall and two in
//                       its back wall, either side of Blathers' desk
//   the bug wing        to the left (NH's: the insects left of the hall), 24 × 20 tiles, a garden under glass
//   the aquarium        to the right, 24 × 20 tiles, its tanks; an opening in its far wall to
//   the sea creatures'  10 × 20 tiles off the aquarium's far end (NH's 海の幸, their tanks)
//   the fossils         behind the hall on the left, 30 × 28 tiles, through a passage behind the bug wing's stub
//   the art gallery     behind the hall on the right, the same, mirrored (NH's is upstairs: here one floor)
// Its rooms (a wing may be two rects: a passage and its room, no wall between), its walls (each side's room, for its
// look), its openings, where one may walk (the floors less the walls and what stands on them) and the walk itself (a
// grid of half-tile cells, A* with its corners pulled straight), read by the engine (engine.ts) and the screen
// (MuseumRoom.svelte), tested on their own (plan.test.ts).

export type Pt = readonly [number, number];
export interface Rect { x0: number; x1: number; z0: number; z1: number }
export type Wing = 'hall' | 'bug' | 'fish' | 'sea' | 'fossil' | 'art';

export const TILE = 10;
export const HALL: Rect = { x0: -60, x1: 60, z0: -50, z1: 70 };
export const BUG_WING: Rect = { x0: -300, x1: -60, z0: -100, z1: 100 };
export const FISH_WING: Rect = { x0: 60, x1: 300, z0: -100, z1: 100 };
export const SEA_WING: Rect = { x0: 300, x1: 400, z0: -100, z1: 100 };
/** The fossils' room and the passage to it from the hall (behind the bug wing's stub, beside the hall's back). */
export const FOSSIL_WING: Rect = { x0: -300, x1: 0, z0: -380, z1: -100 };
export const FOSSIL_PASSAGE: Rect = { x0: -60, x1: 0, z0: -100, z1: -50 };
/** The art gallery and its passage, the fossils' mirrored. */
export const ART_WING: Rect = { x0: 0, x1: 300, z0: -380, z1: -100 };
export const ART_PASSAGE: Rect = { x0: 0, x1: 60, z0: -100, z1: -50 };
/** Every room's floor: a wing's rects (no two overlap; a passage meets its room on an edge with no wall). */
export const ROOMS: readonly { wing: Wing; r: Rect }[] = [
  { wing: 'hall', r: HALL }, { wing: 'bug', r: BUG_WING }, { wing: 'fish', r: FISH_WING }, { wing: 'sea', r: SEA_WING },
  { wing: 'fossil', r: FOSSIL_PASSAGE }, { wing: 'fossil', r: FOSSIL_WING }, { wing: 'art', r: ART_PASSAGE }, { wing: 'art', r: ART_WING }
];
/** The openings in the hall's side walls (z), to the bug wing and the aquarium. */
export const OPENING = { z0: -5, z1: 25 } as const;
/** The openings in the hall's back wall (x, either side of the middle), to the fossils (−) and the art (+). */
export const BACK_OPENING = { x0: 30, x1: 54 } as const;
/** The aquarium's far wall's opening (z), to the sea creatures. */
export const SEA_OPENING = { z0: 60, z1: 92 } as const;
/** A doorway between two rooms: the wall it's in (x = `at` for 'x', z = `at` for 'z'), its span along the wall, the
 *  room it's counted to (the side one comes from: the hall's, the aquarium's) and the room beyond. */
export interface Opening { axis: 'x' | 'z'; at: number; from: number; to: number; wing: Wing; beyond: Wing }
export const OPENINGS: readonly Opening[] = [
  { axis: 'x', at: HALL.x0, from: OPENING.z0, to: OPENING.z1, wing: 'hall', beyond: 'bug' },
  { axis: 'x', at: HALL.x1, from: OPENING.z0, to: OPENING.z1, wing: 'hall', beyond: 'fish' },
  { axis: 'z', at: HALL.z0, from: -BACK_OPENING.x1, to: -BACK_OPENING.x0, wing: 'hall', beyond: 'fossil' },
  { axis: 'z', at: HALL.z0, from: BACK_OPENING.x0, to: BACK_OPENING.x1, wing: 'hall', beyond: 'art' },
  { axis: 'x', at: FISH_WING.x1, from: SEA_OPENING.z0, to: SEA_OPENING.z1, wing: 'fish', beyond: 'sea' }
];
/** The front door's half width (its gap in the hall's front wall). */
export const DOOR_HALF = 12;
/** Where one comes in (just inside the front door) and the doormat's tap area (a tap there goes back out). */
export const ENTRANCE: Pt = [0, 56];
export const DOORMAT: Rect = { x0: -DOOR_HALF, x1: DOOR_HALF, z0: 60, z1: 70 };
/** Blathers' reception desk at the back of the hall (its green top's extents and its height: engine.ts builds it, the
 *  walk keeps off it; the curator stands behind it, curator.ts AT, clear of it in every pose: curator.test). */
export const DESK: Rect & { h: number } = { x0: -22, x1: 22, z0: -32, z1: -20, h: 8.6 };
/** The walls' heights: the hall's grand, the wings' a little lower. */
export const HALL_H = 64;
export const WING_H = 52;

/** A wall: from a to b (x, z) and its height (each side looks as the room it faces: roomBeside). */
export interface Wall { a: Pt; b: Pt; h: number }
const w = (a: Pt, b: Pt, h: number): Wall => ({ a, b, h });
const BO = BACK_OPENING, F = FOSSIL_WING, A = ART_WING, S = SEA_WING;
/** Every wall. */
export const WALLS: readonly Wall[] = [
  // the hall: its back either side of its two openings (split at the middle, where the fossils' and the art's wall
  // meets it), its front either side of the door, its sides either side of the openings (a wing beyond)
  w([HALL.x1, HALL.z0], [BO.x1, HALL.z0], HALL_H),
  w([BO.x0, HALL.z0], [0, HALL.z0], HALL_H),
  w([0, HALL.z0], [-BO.x0, HALL.z0], HALL_H),
  w([-BO.x1, HALL.z0], [HALL.x0, HALL.z0], HALL_H),
  w([HALL.x0, HALL.z1], [-DOOR_HALF, HALL.z1], HALL_H),
  w([DOOR_HALF, HALL.z1], [HALL.x1, HALL.z1], HALL_H),
  w([HALL.x0, HALL.z0], [HALL.x0, OPENING.z0], HALL_H),
  w([HALL.x0, OPENING.z1], [HALL.x0, HALL.z1], HALL_H),
  w([HALL.x1, OPENING.z0], [HALL.x1, HALL.z0], HALL_H),
  w([HALL.x1, HALL.z1], [HALL.x1, OPENING.z1], HALL_H),
  // the bug wing: round its three outer sides (its back the fossils' front) and the stubs beside the hall (the
  // back one the fossils' passage's side)
  w([BUG_WING.x1, BUG_WING.z0], [BUG_WING.x0, BUG_WING.z0], WING_H),
  w([BUG_WING.x0, BUG_WING.z0], [BUG_WING.x0, BUG_WING.z1], WING_H),
  w([BUG_WING.x0, BUG_WING.z1], [BUG_WING.x1, BUG_WING.z1], WING_H),
  w([BUG_WING.x1, HALL.z0], [BUG_WING.x1, BUG_WING.z0], WING_H),
  w([BUG_WING.x1, BUG_WING.z1], [BUG_WING.x1, HALL.z1], WING_H),
  // the aquarium the same, mirrored (its back the art's front), its far wall either side of the sea creatures' opening
  w([FISH_WING.x0, FISH_WING.z0], [FISH_WING.x1, FISH_WING.z0], WING_H),
  w([FISH_WING.x1, FISH_WING.z1], [FISH_WING.x1, SEA_OPENING.z1], WING_H),
  w([FISH_WING.x1, SEA_OPENING.z0], [FISH_WING.x1, FISH_WING.z0], WING_H),
  w([FISH_WING.x0, FISH_WING.z1], [FISH_WING.x1, FISH_WING.z1], WING_H),
  w([FISH_WING.x0, FISH_WING.z0], [FISH_WING.x0, HALL.z0], WING_H),
  w([FISH_WING.x0, HALL.z1], [FISH_WING.x0, FISH_WING.z1], WING_H),
  // the sea creatures' room: its back and its front (each on in the aquarium's line), its far side
  w([S.x0, S.z0], [S.x1, S.z0], WING_H),
  w([S.x1, S.z0], [S.x1, S.z1], WING_H),
  w([S.x0, S.z1], [S.x1, S.z1], WING_H),
  // the fossils and the art: their back, their outer sides, and the wall between them from the hall's back
  w([0, F.z0], [F.x0, F.z0], WING_H),
  w([F.x0, F.z0], [F.x0, F.z1], WING_H),
  w([A.x1, A.z0], [0, A.z0], WING_H),
  w([A.x1, A.z1], [A.x1, A.z0], WING_H),
  w([0, HALL.z0], [0, F.z0], WING_H)
];
/** How each end of a wall's slab meets the others (its thickness's square at a joint drawn by one slab only, so no two
 *  slabs' faces ever share a plane): +1 it runs on over the joint's square (the joint's tallest, one running on in its
 *  own line before a corner's, then the first), −1 it stops at the slab that does, 0 a free end (a door's, an
 *  opening's: the wall stops at its point). */
export function wallEnds(walls: readonly Wall[], i: number): [number, number] {
  const at = (p: Pt) => walls.map((w, k) => ({ w, k })).filter(({ w }) => same(w.a, p) || same(w.b, p));
  const dir = (w: Wall, p: Pt) => (same(w.a, p) ? [w.b[0] - w.a[0], w.b[1] - w.a[1]] : [w.a[0] - w.b[0], w.a[1] - w.b[1]]);
  const end = (p: Pt): number => {
    const here = at(p);
    if (here.length < 2) return 0;
    // (in its own line: another wall at the joint runs on the other way)
    const through = (w: Wall) => here.some(({ w: o }) => o !== w && cross(dir(w, p), dir(o, p)) === 0);
    const owner = [...here].sort((x, y) => y.w.h - x.w.h || +through(y.w) - +through(x.w) || x.k - y.k)[0];
    return owner.k === i ? 1 : -1;
  };
  return [end(walls[i].a), end(walls[i].b)];
}
const same = (p: Pt, q: Pt) => p[0] === q[0] && p[1] === q[1];
const cross = (u: number[], v: number[]) => u[0] * v[1] - u[1] * v[0];

export const inRect = (r: Rect, x: number, z: number, pad = 0): boolean => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;
/** The room a point is in (null: outside, or in a wall). */
export function roomAt(x: number, z: number): Wing | null {
  for (const { wing, r } of ROOMS) if (inRect(r, x, z)) return wing;
  return null;
}
/** Whether (x, z) is in a doorway: within its span, `band` either side of its wall's line. */
export const inOpening = (o: Opening, x: number, z: number, band: number): boolean => {
  const [along, across] = o.axis === 'x' ? [z, x] : [x, z];
  return along >= o.from && along <= o.to && Math.abs(across - o.at) <= band;
};
/** Which wing a point belongs to (a doorway, and a little past it, the room it's counted to: the hall's, the
 *  aquarium's; a wall or outside, the hall). */
export function wingAt(x: number, z: number): Wing {
  for (const o of OPENINGS) if (inOpening(o, x, z, 4)) return o.wing;
  return roomAt(x, z) ?? 'hall';
}
/** The wing a player is in, sticky at the openings (its music: sound/places.ts): another wing only once (x, z) is
 *  `band` past the doorway's line, so standing in the doorway keeps the room one came from. */
export function wingHeld(prev: Wing, x: number, z: number, band = 6): Wing {
  const a = wingAt(x - band, z), b = wingAt(x + band, z), c = wingAt(x, z - band), d = wingAt(x, z + band);
  return a === b && b === c && c === d ? a : prev;
}

/** The wings near (x, z): the one it's in and any whose doorway is within `reach` (a wing built only once woken, its
 *  models fetched as my villager comes up to it: exhibits.ts LAZY). */
export function nearWings(x: number, z: number, reach = 70): Wing[] {
  const out = new Set<Wing>();
  const w = roomAt(x, z);
  if (w) out.add(w);
  for (const o of OPENINGS) {
    const m = (o.from + o.to) / 2, [ox, oz] = o.axis === 'x' ? [o.at, m] : [m, o.at];
    if (Math.hypot(x - ox, z - oz) < reach) out.add(o.beyond);
  }
  return [...out];
}

// ---- the walk ------------------------------------------------------------------------------------------------------

/** A walk cell's side (model units). */
export const CELL = 5;
/** How far a walker keeps from a wall or a thing (its body's half width). */
const BODY = 6;
const X0 = BUG_WING.x0, Z0 = FOSSIL_WING.z0;
const COLS = (SEA_WING.x1 - X0) / CELL, ROWS = (BUG_WING.z1 - Z0) / CELL;

export interface Nav {
  readonly open: Uint8Array;
  readonly cols: number;
  readonly rows: number;
}
const cellMid = (i: number, j: number): Pt => [X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL];
const cellOf = (x: number, z: number): [number, number] => [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)];

/** How far (x, z) is from a wall's line (its segment). */
export function wallDistance(wl: Wall, x: number, z: number): number {
  const dx = wl.b[0] - wl.a[0], dz = wl.b[1] - wl.a[1], l2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((x - wl.a[0]) * dx + (z - wl.a[1]) * dz) / l2));
  return Math.hypot(x - wl.a[0] - dx * t, z - wl.a[1] - dz * t);
}
/** The front door, shut to the walk (a tap on the doormat goes out). */
const DOOR: Wall = { a: [-DOOR_HALF, HALL.z1], b: [DOOR_HALF, HALL.z1], h: 0 };
/** The floors' cells a body clear of every wall (the rooms' and the doorways' through their walls), made once. */
let floorCells: Uint8Array | null = null;
function floorsOpen(): Uint8Array {
  if (floorCells) return floorCells;
  const open = new Uint8Array(COLS * ROWS);
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const [x, z] = cellMid(i, j);
      const onFloor = !!roomAt(x, z) || OPENINGS.some((o) => inOpening(o, x, z, 10));
      open[j * COLS + i] = onFloor && [...WALLS, DOOR].every((wl) => wallDistance(wl, x, z) > BODY) ? 1 : 0;
    }
  return (floorCells = open);
}

/** The walk grid: the floors and the openings, a body clear of the walls, less what stands there (each a rect, padded
 *  by a body). */
export function navOf(blocks: readonly Rect[] = []): Nav {
  const open = floorsOpen().slice();
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const k = j * COLS + i;
      if (!open[k]) continue;
      const [x, z] = cellMid(i, j);
      if (blocks.some((b) => inRect({ x0: b.x0 - BODY, x1: b.x1 + BODY, z0: b.z0 - BODY, z1: b.z1 + BODY }, x, z))) open[k] = 0;
    }
  return { open, cols: COLS, rows: ROWS };
}

export const walkable = (g: Nav, x: number, z: number): boolean => {
  const [i, j] = cellOf(x, z);
  return i >= 0 && j >= 0 && i < g.cols && j < g.rows && g.open[j * g.cols + i] === 1;
};

/** The walkable point nearest (x, z) (itself when it is one). */
export function nearestOpen(g: Nav, x: number, z: number): Pt | null {
  if (walkable(g, x, z)) return [x, z];
  const [ci, cj] = cellOf(x, z);
  let best: Pt | null = null, bd = Infinity;
  for (let r = 1; r < 40 && !best; r++)
    for (let j = cj - r; j <= cj + r; j++)
      for (let i = ci - r; i <= ci + r; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || i < 0 || j < 0 || i >= g.cols || j >= g.rows || !g.open[j * g.cols + i]) continue;
        const m = cellMid(i, j), d = Math.hypot(m[0] - x, m[1] - z);
        if (d < bd) (bd = d), (best = m);
      }
  return best;
}

/** Whether a straight walk from a to b keeps to open cells. */
function clear(g: Nav, a: Pt, b: Pt): boolean {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL / 2));
  for (let k = 0; k <= n; k++) {
    const t = n ? k / n : 0;
    if (!walkable(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
  }
  return true;
}

/** A walk from `from` to `to` (snapped to the nearest open point): its points after `from`, its corners pulled
 *  straight; [] when there's none (or nowhere to go). */
export function walkPath(g: Nav, from: Pt, to: Pt): Pt[] {
  const end = nearestOpen(g, to[0], to[1]), start = nearestOpen(g, from[0], from[1]);
  if (!end || !start) return [];
  if (Math.hypot(end[0] - from[0], end[1] - from[1]) < 0.5) return [];
  if (clear(g, start, end)) return [...(start[0] !== from[0] || start[1] !== from[1] ? [start] : []), end];
  const [si, sj] = cellOf(start[0], start[1]), [ei, ej] = cellOf(end[0], end[1]);
  const N = g.cols * g.rows, s = sj * g.cols + si, e = ej * g.cols + ei;
  const gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap: [number, number][] = [];
  const push = (k: number, f: number) => {
    heap.push([f, k]);
    let c = heap.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (heap[p][0] <= heap[c][0]) break;
      [heap[p], heap[c]] = [heap[c], heap[p]];
      c = p;
    }
  };
  const pop = (): number => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let c = 0;
      for (;;) {
        const l = c * 2 + 1, r = l + 1;
        let m = c;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === c) break;
        [heap[m], heap[c]] = [heap[c], heap[m]];
        c = m;
      }
    }
    return top[1];
  };
  const h = (k: number) => Math.hypot((k % g.cols) - ei, Math.floor(k / g.cols) - ej);
  gs[s] = 0;
  push(s, h(s));
  while (heap.length) {
    const k = pop();
    if (done[k]) continue;
    done[k] = 1;
    if (k === e) break;
    const i = k % g.cols, j = Math.floor(k / g.cols);
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= g.cols || nj >= g.rows) continue;
        const nk = nj * g.cols + ni;
        // (no cutting a corner past a closed cell)
        if (!g.open[nk] || (di && dj && (!g.open[j * g.cols + ni] || !g.open[nj * g.cols + i]))) continue;
        const ng = gs[k] + (di && dj ? Math.SQRT2 : 1);
        if (ng < gs[nk]) {
          gs[nk] = ng;
          came[nk] = k;
          push(nk, ng + h(nk));
        }
      }
  }
  if (!done[e]) return [];
  const cells: Pt[] = [];
  for (let k = e; k !== -1 && k !== s; k = came[k]) cells.push(cellMid(k % g.cols, Math.floor(k / g.cols)));
  cells.reverse();
  cells[cells.length - 1] = end;
  // the corners pulled straight: from each point, on to the farthest one in plain sight
  const out: Pt[] = [];
  let at: Pt = start;
  let i = 0;
  if (start[0] !== from[0] || start[1] !== from[1]) out.push(start);
  while (i < cells.length) {
    let far = i;
    for (let k = cells.length - 1; k > i; k--) if (clear(g, at, cells[k])) { far = k; break; }
    out.push(cells[far]);
    at = cells[far];
    i = far + 1;
  }
  return out;
}
