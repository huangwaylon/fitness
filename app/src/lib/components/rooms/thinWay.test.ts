// A walk's corners thinned for the relay (thinWay.ts): within VIA_MAX as it is; over it, the corners a straight line
// past would cross a wall kept, so the other phone's villager never walks through one; the message within MAX_BYTES.
import { describe, expect, it } from 'vitest';
import { MAX_BYTES, VIA_MAX, parseClient, type Pt } from '#lib/contract/live-protocol.ts';
import { WORLD_X, WORLD_Z } from '#lib/contract/layout.ts';
import { walkIntent } from './roomLife.ts';
import { thinWay } from './thinWay.ts';

/** A comb: bars at x 20, 40, 60, 80 (2 wide), the odd ones from the bottom (z 0–90), the even from the top (10–100). */
const BARS = [1, 2, 3, 4].map((i) => ({ x0: 20 * i - 1, x1: 20 * i + 1, z0: i % 2 ? 0 : 10, z1: i % 2 ? 90 : 100 }));
const inBar = (x: number, z: number) => BARS.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);
/** A straight walk crosses no bar (sampled every 0.25). */
const clear = (a: Pt, b: Pt) => {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
  for (let s = 0; s <= n; s++) if (inBar(a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n)) return false;
  return true;
};
/** The way round the comb: its 8 corners, each straight run cut in `k` (as a grid's A* gives, cell by cell). */
function serpentine(k: number): { from: Pt; pts: Pt[] } {
  const from: Pt = [10, 5];
  const corners: Pt[] = [[10, 95], [30, 95], [30, 5], [50, 5], [50, 95], [70, 95], [70, 5], [90, 5]];
  const pts: Pt[] = [];
  let at = from;
  for (const c of corners) {
    for (let s = 1; s <= k; s++) pts.push([at[0] + ((c[0] - at[0]) * s) / k, at[1] + ((c[1] - at[1]) * s) / k]);
    at = c;
  }
  return { from, pts };
}
const segs = (from: Pt, way: readonly Pt[]) => way.map((p, i) => [i ? way[i - 1] : from, p] as const);

describe('a walk’s corners for the relay', () => {
  it('within VIA_MAX: as it is, rounded', () => {
    expect(thinWay([0.4, 0], [[10.4, 0.6], [20, 20.2]])).toEqual([[10, 1], [20, 20]]);
    expect(thinWay([0, 0], [])).toEqual([]);
  });

  it('over it: never a straight line through a wall, the corners round each bar kept, the end the end', () => {
    for (const k of [2, 4, 7]) {
      const { from, pts } = serpentine(k);
      expect(pts.length).toBeGreaterThan(VIA_MAX + 1);
      const way = thinWay(from, pts, clear);
      expect(way.length).toBeLessThanOrEqual(VIA_MAX + 1);
      expect(way.at(-1)).toEqual([90, 5]);
      expect(segs(from, way).filter(([a, b]) => !clear(a, b))).toEqual([]);
    }
  });

  it('every k-th corner (the old thinning) would have cut through a bar: the check matters', () => {
    const { from, pts } = serpentine(7);
    const k = Math.ceil((pts.length - 1) / VIA_MAX), kth: Pt[] = [];
    for (let i = k - 1; i < pts.length - 1; i += k) kth.push(pts[i]);
    const old = [...kth.slice(0, VIA_MAX), pts[pts.length - 1]];
    expect(segs(from, old).some(([a, b]) => !clear(a, b))).toBe(true);
  });

  it('with more corners needed than it may carry: still VIA_MAX, cutting as little as it can', () => {
    const zig: Pt[] = Array.from({ length: 30 }, (_, i) => [i * 10, i % 2 ? 40 : 0]);
    const way = thinWay([0, 0], zig, () => false);
    expect(way.length).toBe(VIA_MAX + 1);
    expect(way.at(-1)).toEqual(zig.at(-1));
    // (no check: the least moved corners go)
    const flat: Pt[] = Array.from({ length: 30 }, (_, i) => [i * 10, i === 15 ? 50 : 0]);
    expect(thinWay([0, 0], flat)).toContainEqual([150, 50]);
  });

  it('the island’s walk at the world’s far corners with VIA_MAX waypoints fits the relay’s message', () => {
    const far = (i: number): Pt => [i % 2 ? WORLD_X[0] : WORLD_X[1], i % 3 ? WORLD_Z[0] : WORLD_Z[1]];
    const msg = { v: 3, c: 99_999_999, kind: 'walk', to: far(1), from: far(2), via: Array.from({ length: VIA_MAX }, (_, i) => far(i)), s: 1_893_456_000_000, ms: 60_000, f: 'home' };
    const raw = JSON.stringify(msg);
    expect(raw.length).toBeLessThanOrEqual(MAX_BYTES);
    expect(parseClient(raw)).not.toBeNull();
  });

  it('a room’s walk (walkIntent) keeps its last corners and its end: thinned, not cut off', () => {
    const via: Pt[] = Array.from({ length: 14 }, (_, i) => [-40 + i * 5, i % 2 ? -10 : 10]);
    const t = walkIntent({ from: [-45, 0], via, to: [35, 0], s: 1000, ms: 5000 }, [-45, 0], 2000, 50);
    expect(t.via!.length).toBeLessThanOrEqual(VIA_MAX);
    expect(t.to).toEqual([35, 0]);
    // the old slice(0, 10) dropped the corners after the tenth: the last one now stays
    expect(t.via!.at(-1)![0]).toBeGreaterThan(via[9][0]);
    expect(parseClient(JSON.stringify({ v: 3, ...t }))).not.toBeNull();
  });
});
