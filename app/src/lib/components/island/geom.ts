// Stage geometry shared by the island's placement searches (an axis-aligned box and its overlap test) and by its
// projector (camera.svelte.ts: the DOM's stacking order, a solid's outline).

/** A box (stage units or client px, as the caller uses it): x0 ≤ x1, y0 ≤ y1. */
export interface Box { x0: number; x1: number; y0: number; y1: number }

/** Whether two boxes overlap (touching edges don't). */
export const hits = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The DOM's stacking order from the feet (world z, x): nearer in front. The camera looks into +z, so the order is the
 *  world's and only changes when something moves, never on a camera move; ties by x (left first), as a y-sort does. */
export function zIndexAt(z: number, x: number, zMax: number): number {
  const row = Math.max(0, Math.round((zMax - z) * 4));
  const col = Math.min(1023, Math.max(0, Math.round(x + 300)));
  return 10 + row * 1024 + col;
}

/** The convex hull of points (x, y pairs), counter-clockwise on screen from the leftmost (Andrew's monotone chain): a
 *  solid's outline from its corners (camera.svelte.ts `body`: a building's tap area, its box as the camera sees it). */
export function hull(pts: readonly (readonly [number, number])[]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p.map(([x, y]) => [x, y]);
  const cross = (o: readonly number[], a: readonly number[], b: readonly number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: readonly (readonly [number, number])[]) => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push([q[0], q[1]]);
    }
    return out.slice(0, -1);
  };
  return [...half(p), ...half([...p].reverse())];
}
