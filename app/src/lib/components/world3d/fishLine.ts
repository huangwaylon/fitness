// A fishing line on the 3D island (docs/world3d-assets.md "Fishing"), pure: the curve from the rod's tip to the float
// at any length (the user: "I want to be able to fish from anywhere": a float across the island). One quadratic, its
// middle offset `lift` off the straight line between its ends: it sags under its own weight by its length (6u for a
// short one, as NH's; 4% of a long one), lifted only as much as it takes to clear what's under it (the ground, the
// water, the cliffs, a house, a tree: obstacles from the layout, their drawn height), so a long line never runs as a
// straight laser nor through the island. World space, bent with the island like everything else (engine.ts add:
// bend.ts on its material), so enough points that it bends smoothly: one every SEG_U, at most LINE_MAX.
import { footOf, originOf, type Layout } from '#lib/layout/model.ts';
import { TILE, tileX, tileZ } from '#lib/layout/grid.ts';
import { kindDef } from '#lib/layout/catalog.ts';

export type P3 = readonly [number, number, number];
/** A box standing on the island: its plan (world x, z) and its top (world y). */
export interface Block { x0: number; x1: number; z0: number; z1: number; top: number }

/** A line's most points (the buffer's size) and its fewest; a point every SEG_U along it in between. */
export const LINE_MAX = 64, LINE_MIN = 12;
const SEG_U = 16;
/** How far over what's under it the line keeps (u). */
const CLEAR_U = 4;
/** What's within this of either end (u, in plan) isn't in its way: the bank it stands on, the seat it's on. */
const END_U = 24;

/** How many points a line `len` long is drawn with. */
export const pointsFor = (len: number): number => Math.min(LINE_MAX, Math.max(LINE_MIN, Math.ceil(len / SEG_U) + 1));

/** The middle's offset off the straight line by length alone (u, up: negative, its sag): 6u for a short line, 4% of
 *  a long one (the two meet at 150u). */
export const baseLift = (len: number): number => -Math.max(6 * Math.min(1, len / 100), len * 0.04);

/** The blocks on a layout: every object that stands in the way (its tiles, its drawn height over the ground there). */
export function blocksOf(layout: Layout, heightAt: (x: number, z: number) => number): Block[] {
  const out: Block[] = [];
  for (const o of layout.objects.values()) {
    const def = kindDef(o.k);
    if (!def?.block) continue;
    const [w, d] = footOf(layout, o), [c, r] = originOf(layout, o), nx = o.n?.[0] ?? 0, nz = o.n?.[1] ?? 0;
    const x0 = tileX(c) + nx, z0 = tileZ(r) + nz, x1 = x0 + w * TILE, z1 = z0 + d * TILE;
    out.push({ x0, x1, z0, z1, top: heightAt((x0 + x1) / 2, (z0 + z1) / 2) + def.h });
  }
  return out;
}

/** The line's middle offset (u, up) from `a` (the rod's tip) to `b` (the float): its length's sag, or less (or lifted
 *  into an arc), as much as keeps it CLEAR_U over `ground` (the land or the water's surface) and the blocks under it
 *  (bar near its ends), at most 0.6 of its length. */
export function liftOf(a: P3, b: P3, ground: (x: number, z: number) => number, blocks: readonly Block[]): number {
  const plan = Math.hypot(b[0] - a[0], b[2] - a[2]), len = Math.hypot(plan, b[1] - a[1]);
  let lift = baseLift(len);
  if (plan <= END_U * 2) return lift;
  // (only the blocks the line's plan passes near: a few of the island's)
  const bx0 = Math.min(a[0], b[0]), bx1 = Math.max(a[0], b[0]), bz0 = Math.min(a[2], b[2]), bz1 = Math.max(a[2], b[2]);
  const near = blocks.filter((k) => k.x1 >= bx0 && k.x0 <= bx1 && k.z1 >= bz0 && k.z0 <= bz1);
  const n = Math.ceil(plan / 6);
  for (let i = 1; i < n; i++) {
    const k = i / n, s = k * plan;
    if (s < END_U || plan - s < END_U) continue;
    const x = a[0] + (b[0] - a[0]) * k, z = a[2] + (b[2] - a[2]) * k;
    let top = ground(x, z);
    for (const q of near) if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && q.top > top) top = q.top;
    const need = (top + CLEAR_U - (a[1] + (b[1] - a[1]) * k)) / (4 * k * (1 - k));
    if (need > lift) lift = need;
  }
  return Math.min(lift, len * 0.6);
}

/** The line's points into `out` (x, y, z world, y up), `n` of them from `a` to `b`, its middle `lift` off straight. */
export function linePoints(out: Float32Array, n: number, a: P3, b: P3, lift: number): void {
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), o = 4 * k * (1 - k) * lift;
    out[i * 3] = a[0] + (b[0] - a[0]) * k;
    out[i * 3 + 1] = a[1] + (b[1] - a[1]) * k + o;
    out[i * 3 + 2] = a[2] + (b[2] - a[2]) * k;
  }
}
