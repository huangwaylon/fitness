// NH's table tops (docs/design.md "Table tops"), pure: a surface holds small things on the tiles of its own (unturned)
// footprint that its top covers (a slot each), at its top's height, each thing's middle kept on the top's rectangle.
// Shared by the rooms (components/tent/grid.ts: room tiles) and the island (layout/tops.ts: the island's tiles); each
// turns a piece's own frame into its world its own way. Model units: a tile is 10 (NH's).

/** A surface's top (tent/items.json: scripts/room-surfaces.ts from its model): its footprint (tiles), its height, the
 *  rectangle it covers (its own frame, its middle at 0: x0, z0, x1, z1) and the tiles that hold a thing (none: all). */
export interface Top {
  w: number;
  d: number;
  sy: number;
  st?: readonly [number, number, number, number];
  sl?: readonly (readonly [number, number])[];
}

/** A tile's side (model units). */
const TILE = 10;

/** The tiles of a top's own footprint that hold a thing. */
export function slotsOf(t: Top): [number, number][] {
  if (t.sl) return t.sl.map(([x, z]) => [x, z]);
  const out: [number, number][] = [];
  for (let sx = 0; sx < t.w; sx++) for (let sz = 0; sz < t.d; sz++) out.push([sx, sz]);
  return out;
}
/** The tiles (the top's own) a small thing `kw` × `kd` (as it faces there) on slot (sx, sz) covers. */
export function kidTiles(kw: number, kd: number, sx: number, sz: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < kw; i++) for (let j = 0; j < kd; j++) out.push([sx + i, sz + j]);
  return out;
}
/** Whether a small thing `kw` × `kd` fits on the top at slot (sx, sz): every tile it covers holds a thing. */
export function fitsOn(t: Top, kw: number, kd: number, sx: number, sz: number): boolean {
  const ok = new Set(slotsOf(t).map(([x, z]) => x * 64 + z));
  return kidTiles(kw, kd, sx, sz).every(([x, z]) => ok.has(x * 64 + z));
}
/** Where a small thing `kw` × `kd` on slot (sx, sz) stands in the top's own frame: its middle (x, z, model units, the
 *  piece's middle at 0; on its tiles, kept on the top's rectangle) and how high. */
export function onTop(t: Top, kw: number, kd: number, sx: number, sz: number): [number, number, number] {
  let lx = (sx + kw / 2 - t.w / 2) * TILE, lz = (sz + kd / 2 - t.d / 2) * TILE;
  const st = t.st;
  if (st) {
    // on the top: its middle at least half a small thing in from the top's edges (the middle of a narrower top)
    const keep = (v: number, a: number, b: number, half: number) => (b - a <= 2 * half ? (a + b) / 2 : Math.min(b - half, Math.max(a + half, v)));
    lx = keep(lx, st[0], st[2], Math.min(2.5, (kw * TILE) / 2));
    lz = keep(lz, st[1], st[3], Math.min(2.5, (kd * TILE) / 2));
  }
  return [lx, t.sy, lz];
}
