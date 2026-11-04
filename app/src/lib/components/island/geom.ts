// Stage geometry shared by the island's placement searches (an axis-aligned box and its overlap test) and by its
// projector (camera.svelte.ts: a ground quad's matrix, the DOM's stacking order).

/** A box (stage units or client px, as the caller uses it): x0 ≤ x1, y0 ≤ y1. */
export interface Box { x0: number; x1: number; y0: number; y1: number }

/** Whether two boxes overlap (touching edges don't). */
export const hits = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The CSS matrix3d (16 numbers, column-major) taking a w × h box onto a quad: [top-left, top-right, bottom-right,
 *  bottom-left] as x, y pairs (a projective map, Heckbert's square-to-quad). One flat transform on one element, no
 *  preserve-3d: a world node's ground quad (camera.svelte.ts `quad`) laid onto the 3D camera's ground. */
export function quadMatrix(w: number, h: number, q: readonly number[]): number[] {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = det ? (dx3 * dy2 - dx2 * dy3) / det : 0;
  const k = det ? (dx1 * dy3 - dx3 * dy1) / det : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
}

/** The DOM's stacking order from the feet (world z, x): nearer in front. The camera looks into +z, so the order is the
 *  world's and only changes when something moves, never on a camera move; ties by x (left first), as a y-sort does. */
export function zIndexAt(z: number, x: number, zMax: number): number {
  const row = Math.max(0, Math.round((zMax - z) * 4));
  const col = Math.min(1023, Math.max(0, Math.round(x + 300)));
  return 10 + row * 1024 + col;
}
