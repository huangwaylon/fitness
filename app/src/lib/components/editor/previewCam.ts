// The editor's 3D preview's camera moves (editor/Preview3D.svelte): a pan kept over the island, the phone view's
// drag and zoom. Pure (no three.js): the tests' too.

import { MID_X, midXOf } from '#lib/layout/model.ts';

/** The phone view's middle across the island (engine.ts's: model.ts midXOf, its land's): where it starts and where ⌖
 *  puts it back. */
export const midX = (e: { land: { x0: number; x1: number } }): number => midXOf(e.land);
/** The phone view's spot along the island (world z of its pivot) and its zoom, kept within these. */
export const Z_MIN = -60, Z_MAX = 1260;
export const ZOOM_MIN = 0.6, ZOOM_MAX = 3;
/** The phone view's lens (engine.ts's): this much of the island across the screen at the pivot, at zoom 1 (u). */
const ACROSS_U = 420;

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Where a pan may take the camera's pivot (world u, z into the island): the land's box (extentOf's), a tile's
 *  margin round it, so the island never leaves the view. */
export function panBounds(e: { land: { x0: number; x1: number; z0: number; z1: number } }): { x0: number; x1: number; z0: number; z1: number } {
  const { x0, x1, z0, z1 } = e.land;
  if (x1 <= x0) return { x0: MID_X, x1: MID_X, z0: Z_MIN, z1: Z_MAX };
  return { x0: x0 - 30, x1: x1 + 30, z0: z0 - 30, z1: z1 + 30 };
}

/** A drag of (dx, dy) px on a `width` px wide view at `zoom` as the world's move under the finger (u): across and
 *  along the island (the ground follows the finger: a drag down brings the back of the island into view). The ground
 *  is foreshortened along the island by the camera's pitch. */
export function panBy(dx: number, dy: number, width: number, zoom: number, pitch: number): [number, number] {
  const u = ACROSS_U / Math.max(1, width) / zoom;
  return [dx * u, (dy * u) / Math.max(0.2, Math.sin(pitch))];
}
