// The rooms' walker (the tent's and homes', the shop's, the museum's; the island has its own, with level steps:
// layout/nav.ts): A* over a room's cells, 8 ways with no corner cutting past a closed cell, then the corners pulled
// straight where the line is clear. Each room keeps its own cells (their size and origin) and its own `clear`.
// Pure, no three.

/** A cell: its column (x) and row (z). */
export type Cell = readonly [number, number];
/** A room's cells: how many, and whether one can stand in one (never asked of one off the grid). */
export interface Grid { cols: number; rows: number; free(i: number, j: number): boolean }

/**
 * The cells after `start` on the shortest walk to `goal` (the start's own cell is never closed to it: one standing at
 * a piece's edge walks off), `reached` when it gets there; when it can't, the walk to the cell nearest the goal (as the
 * crow flies), [] when that's the start.
 */
export function gridPath(g: Grid, start: Cell, goal: Cell): { cells: [number, number][]; reached: boolean } {
  const { cols, rows } = g, n = cols * rows;
  const at = (i: number, j: number) => j * cols + i;
  const h = (k: number) => Math.hypot((k % cols) - goal[0], Math.floor(k / cols) - goal[1]);
  const cost = new Float64Array(n).fill(Infinity), came = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  const s = at(start[0], start[1]), e = at(goal[0], goal[1]);
  const heap = new Heap();
  cost[s] = 0;
  heap.push(s, h(s));
  let best = s, bestH = h(s);
  while (heap.size) {
    const k = heap.pop();
    if (done[k]) continue;
    done[k] = 1;
    const hk = h(k);
    if (hk < bestH) (bestH = hk), (best = k);
    if (k === e) break;
    const i = k % cols, j = Math.floor(k / cols);
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || !g.free(ni, nj)) continue;
        if (di && dj && (!g.free(ni, j) || !g.free(i, nj))) continue;
        const nk = at(ni, nj), c = cost[k] + (di && dj ? Math.SQRT2 : 1);
        if (c < cost[nk]) {
          cost[nk] = c;
          came[nk] = k;
          heap.push(nk, c + h(nk));
        }
      }
  }
  const reached = done[e] === 1;
  const cells: [number, number][] = [];
  for (let k = reached ? e : best; k !== -1 && k !== s; k = came[k]) cells.push([k % cols, Math.floor(k / cols)]);
  return { cells: cells.reverse(), reached };
}

/** A walk's corners pulled straight: from `from`, on to the farthest of `pts` in plain sight (`clear`), and so on to
 *  the last. */
export function pullStraight<P>(from: P, pts: readonly P[], clear: (a: P, b: P) => boolean): P[] {
  const out: P[] = [];
  let a = from;
  for (let i = 0; i < pts.length; ) {
    let j = pts.length - 1;
    while (j > i && !clear(a, pts[j])) j--;
    out.push(pts[j]);
    a = pts[j];
    i = j + 1;
  }
  return out;
}

/** A binary min-heap of cell indices by their score. */
class Heap {
  private f: number[] = [];
  private k: number[] = [];
  get size(): number { return this.k.length; }
  push(k: number, f: number): void {
    const { f: fs, k: ks } = this;
    let c = ks.length;
    fs.push(f), ks.push(k);
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (fs[p] <= f) break;
      fs[c] = fs[p], ks[c] = ks[p];
      c = p;
    }
    fs[c] = f, ks[c] = k;
  }
  pop(): number {
    const { f: fs, k: ks } = this;
    const top = ks[0], lf = fs.pop()!, lk = ks.pop()!, n = ks.length;
    if (n) {
      let c = 0;
      for (;;) {
        const l = c * 2 + 1, r = l + 1;
        let m = -1, mf = lf;
        if (l < n && fs[l] < mf) (m = l), (mf = fs[l]);
        if (r < n && fs[r] < mf) m = r;
        if (m < 0) break;
        fs[c] = fs[m], ks[c] = ks[m];
        c = m;
      }
      fs[c] = lf, ks[c] = lk;
    }
    return top;
  }
}
