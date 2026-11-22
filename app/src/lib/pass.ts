// The pieces one walks through (docs/design.md "The tent", Arches), pure: an arch's, a gate's, a torii's way
// through (tent/items.json `pa`, scripts/room-pass.ts from its model: the half-tile cells of its own, unturned footprint
// a villager walks through, its posts' cells not among them). Shared by the rooms (components/tent/grid.ts: room half
// tiles) and the island (layout/nav.ts: its walk grid); each turns a piece's own frame into its world its own way.

/** A way through: half-tile cells [i across, j deep] of a piece's own footprint (2w × 2d of them, j 0 at its back). */
export type Pass = readonly (readonly [number, number])[];

/** Every half-tile cell of a w × d piece: its middle off the piece's middle (tiles, in its own frame: x across, z toward
 *  its front) turned by facing `f` as a room turns its model (three's yaw f · 90°), and whether it is the way through. */
export function cellsOf(w: number, d: number, f: number, pa?: Pass): { x: number; z: number; pass: boolean }[] {
  const a = (((f % 4) + 4) % 4) * (Math.PI / 2), c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
  const way = new Set((pa ?? []).map(([i, j]) => i * 64 + j));
  const out: { x: number; z: number; pass: boolean }[] = [];
  for (let i = 0; i < w * 2; i++) for (let j = 0; j < d * 2; j++) {
    const lx = (i + 0.5) / 2 - w / 2, lz = (j + 0.5) / 2 - d / 2;
    out.push({ x: lx * c + lz * s || 0, z: lz * c - lx * s || 0, pass: way.has(i * 64 + j) });
  }
  return out;
}
