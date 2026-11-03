// The museum's plan (docs/design.md "The museum"), pure: NH's museum as three rooms on one floor, in model units (a
// tile is 10, a villager 16 tall: the tent's room's scale, tent/grid.ts), +z toward the camera (the front door):
//   the entrance hall   12 × 12 tiles round the middle, its front door at +z, an opening in each side wall
//   the bug wing        to the left (NH's: the insects left of the hall), 24 × 20 tiles, a garden under glass
//   the aquarium        to the right, 24 × 20 tiles, its tanks
// Its walls (each side's room, for its look), where one may walk (the floors less what stands on them) and the walk
// itself (a grid of half-tile cells, A* with its corners pulled straight), read by the engine (engine.ts) and the
// screen (MuseumRoom.svelte), tested on their own (plan.test.ts).

export type Pt = readonly [number, number];
export interface Rect { x0: number; x1: number; z0: number; z1: number }
export type Wing = 'hall' | 'bug' | 'fish';

export const TILE = 10;
export const HALL: Rect = { x0: -60, x1: 60, z0: -50, z1: 70 };
export const BUG_WING: Rect = { x0: -300, x1: -60, z0: -100, z1: 100 };
export const FISH_WING: Rect = { x0: 60, x1: 300, z0: -100, z1: 100 };
/** The openings in the hall's side walls (z), to the wings. */
export const OPENING = { z0: -5, z1: 25 } as const;
/** The front door's half width (its gap in the hall's front wall). */
export const DOOR_HALF = 12;
/** Where one comes in (just inside the front door) and the doormat's tap area (a tap there goes back out). */
export const ENTRANCE: Pt = [0, 56];
export const DOORMAT: Rect = { x0: -DOOR_HALF, x1: DOOR_HALF, z0: 60, z1: 70 };
/** The walls' heights: the hall's grand, the wings' a little lower. */
export const HALL_H = 64;
export const WING_H = 52;

/** A wall: from a to b (x, z) and its height (each side looks as the room it faces: roomBeside). */
export interface Wall { a: Pt; b: Pt; h: number }
const w = (a: Pt, b: Pt, h: number): Wall => ({ a, b, h });
/** Every wall. */
export const WALLS: readonly Wall[] = [
  // the hall: its back, its front either side of the door, its sides either side of the openings (a wing beyond)
  w([HALL.x1, HALL.z0], [HALL.x0, HALL.z0], HALL_H),
  w([HALL.x0, HALL.z1], [-DOOR_HALF, HALL.z1], HALL_H),
  w([DOOR_HALF, HALL.z1], [HALL.x1, HALL.z1], HALL_H),
  w([HALL.x0, HALL.z0], [HALL.x0, OPENING.z0], HALL_H),
  w([HALL.x0, OPENING.z1], [HALL.x0, HALL.z1], HALL_H),
  w([HALL.x1, OPENING.z0], [HALL.x1, HALL.z0], HALL_H),
  w([HALL.x1, HALL.z1], [HALL.x1, OPENING.z1], HALL_H),
  // the bug wing: round its three outer sides and the stubs beside the hall
  w([BUG_WING.x1, BUG_WING.z0], [BUG_WING.x0, BUG_WING.z0], WING_H),
  w([BUG_WING.x0, BUG_WING.z0], [BUG_WING.x0, BUG_WING.z1], WING_H),
  w([BUG_WING.x0, BUG_WING.z1], [BUG_WING.x1, BUG_WING.z1], WING_H),
  w([BUG_WING.x1, HALL.z0], [BUG_WING.x1, BUG_WING.z0], WING_H),
  w([BUG_WING.x1, BUG_WING.z1], [BUG_WING.x1, HALL.z1], WING_H),
  // the aquarium the same, mirrored
  w([FISH_WING.x0, FISH_WING.z0], [FISH_WING.x1, FISH_WING.z0], WING_H),
  w([FISH_WING.x1, FISH_WING.z1], [FISH_WING.x1, FISH_WING.z0], WING_H),
  w([FISH_WING.x0, FISH_WING.z1], [FISH_WING.x1, FISH_WING.z1], WING_H),
  w([FISH_WING.x0, FISH_WING.z0], [FISH_WING.x0, HALL.z0], WING_H),
  w([FISH_WING.x0, HALL.z1], [FISH_WING.x0, FISH_WING.z1], WING_H)
];

export const inRect = (r: Rect, x: number, z: number, pad = 0): boolean => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;
/** The room a point is in (null: outside, or in a wall). */
export function roomAt(x: number, z: number): Wing | null {
  if (inRect(HALL, x, z)) return 'hall';
  if (inRect(BUG_WING, x, z)) return 'bug';
  if (inRect(FISH_WING, x, z)) return 'fish';
  return null;
}
/** Which wing an x belongs to (the openings count as the hall's). */
export function wingAt(x: number): Wing {
  if (x < HALL.x0 - 4) return 'bug';
  if (x > HALL.x1 + 4) return 'fish';
  return 'hall';
}

// ---- the walk ------------------------------------------------------------------------------------------------------

/** A walk cell's side (model units). */
export const CELL = 5;
/** How far a walker keeps from a wall or a thing (its body's half width). */
const BODY = 6;
const X0 = BUG_WING.x0, Z0 = BUG_WING.z0;
const COLS = (FISH_WING.x1 - BUG_WING.x0) / CELL, ROWS = (BUG_WING.z1 - BUG_WING.z0) / CELL;

export interface Nav {
  readonly open: Uint8Array;
  readonly cols: number;
  readonly rows: number;
}
const cellMid = (i: number, j: number): Pt => [X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL];
const cellOf = (x: number, z: number): [number, number] => [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)];

/** The walk grid: the three floors and the openings, less what stands there (each a rect, padded by a body). */
export function navOf(blocks: readonly Rect[] = []): Nav {
  const open = new Uint8Array(COLS * ROWS);
  const floors: Rect[] = [HALL, BUG_WING, FISH_WING, { x0: HALL.x0 - 10, x1: HALL.x0 + 10, z0: OPENING.z0, z1: OPENING.z1 }, { x0: HALL.x1 - 10, x1: HALL.x1 + 10, z0: OPENING.z0, z1: OPENING.z1 }];
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const [x, z] = cellMid(i, j);
      // the floors, a body in from their walls (an opening's floor runs through the wall)
      const onFloor = floors.slice(0, 3).some((r) => inRect(r, x, z, BODY)) || floors.slice(3).some((r) => inRect(r, x, z) && z > r.z0 + BODY && z < r.z1 - BODY);
      open[j * COLS + i] = onFloor && !blocks.some((b) => inRect({ x0: b.x0 - BODY, x1: b.x1 + BODY, z0: b.z0 - BODY, z1: b.z1 + BODY }, x, z)) ? 1 : 0;
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
