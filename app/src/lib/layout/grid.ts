// The island's tile grid (docs/island-layout.md "The grid"), pure: one tile = one NH tile = 30 world units (10 model
// units of NH's furniture at the island's scale, world.ts DECOR_U), the tent's tile too. Tile (c, r) covers x
// X0 + 30c … +30, z Z0 + 30r … +30; r grows into the island (away from the camera), as world z does. Off the grid is
// sea. Each tile is one kind and one tier, one character in a chunk op: (kind × 4 + tier) in base 36.

import { CHUNK, GRID_X0, GRID_Z0, TILE } from '#lib/contract/layout.ts';

/** A tile's side (world units). */
export { TILE };
/** The grid: 20 × 156 tiles, x −90…510, z −90…4590 (the long island: まえ, the homes' middle, おく; a ring of sea, and
 *  sea behind it for the island to grow back into: 152 rows of land at most, twice the 80-row grid's 76, 2026-11-10). */
export const GRID = { cols: 20, rows: 156, x0: GRID_X0, z0: GRID_Z0 } as const;
/** A chunk's side (tiles): the unit of a terrain op and of a terrain rebuild. */
export { CHUNK };
export const CHUNKS_X = Math.ceil(GRID.cols / CHUNK);
export const CHUNKS_Z = Math.ceil(GRID.rows / CHUNK);

/** The terrain kinds, in their code's order (never reorder: the record holds the codes). */
export const KINDS = ['sea', 'grass', 'sand', 'dirt', 'stone', 'brick', 'plank', 'river', 'pond'] as const;
export type Kind = (typeof KINDS)[number];
/** The path kinds (NH's custom paths: a walkable ground of its own look). */
/** @public (the editor's brushes) */
export const PATHS: readonly Kind[] = ['dirt', 'stone', 'brick', 'plank'];
/** The cliff tiers: 0 the ground the beach and the lawn are on, each tier TIER_H higher. */
export const TIERS = 4;
export const TIER_H = 40;

export interface Tile {
  kind: Kind;
  tier: number;
}

export const isWater = (k: Kind): boolean => k === 'river' || k === 'pond' || k === 'sea';

/** A tile's code (0…35) and its character. */
export const codeOf = (kind: Kind, tier: number): number => KINDS.indexOf(kind) * TIERS + Math.max(0, Math.min(TIERS - 1, tier));
export const kindOf = (code: number): Kind => KINDS[Math.floor(code / TIERS)] ?? 'sea';
export const tierOf = (code: number): number => code % TIERS;
export const charOf = (code: number): string => code.toString(36);
export const codeOfChar = (ch: string): number => {
  const n = parseInt(ch, 36);
  return Number.isFinite(n) && n >= 0 && n < KINDS.length * TIERS ? n : 0;
};
export const SEA = 0;

/** Whether (c, r) is on the grid. */
export const onGrid = (c: number, r: number): boolean => c >= 0 && r >= 0 && c < GRID.cols && r < GRID.rows;
/** A tile's index in a row-major array. */
export const idx = (c: number, r: number): number => r * GRID.cols + c;

/** The tile a world point is on (may be off the grid). */
export const tileAt = (x: number, z: number): [number, number] => [Math.floor((x - GRID.x0) / TILE), Math.floor((z - GRID.z0) / TILE)];
/** A tile's back-left corner and middle (world units). */
export const tileX = (c: number): number => GRID.x0 + c * TILE;
export const tileZ = (r: number): number => GRID.z0 + r * TILE;
export const tileMid = (c: number, r: number): [number, number] => [tileX(c) + TILE / 2, tileZ(r) + TILE / 2];

/** A chunk's id (`c<cx>x<cz>`) and the chunk a tile is in. */
export const chunkId = (cx: number, cz: number): string => `c${cx}x${cz}`;
export const chunkOf = (c: number, r: number): number => Math.floor(r / CHUNK) * CHUNKS_X + Math.floor(c / CHUNK);
export const chunkXZ = (i: number): [number, number] => [i % CHUNKS_X, Math.floor(i / CHUNKS_X)];
export function chunkIndex(id: string): number | null {
  const m = /^c(\d{1,2})x(\d{1,2})$/.exec(id);
  if (!m) return null;
  const cx = +m[1], cz = +m[2];
  return cx < CHUNKS_X && cz < CHUNKS_Z ? cz * CHUNKS_X + cx : null;
}

/** A chunk's 64 tiles from the grid's codes, row by row (off the grid: sea). */
export function chunkString(codes: ArrayLike<number>, i: number): string {
  const [cx, cz] = chunkXZ(i);
  let s = '';
  for (let j = 0; j < CHUNK; j++)
    for (let k = 0; k < CHUNK; k++) {
      const c = cx * CHUNK + k, r = cz * CHUNK + j;
      s += charOf(onGrid(c, r) ? codes[idx(c, r)] : SEA);
    }
  return s;
}

/** Write a chunk's 64 tiles into the grid's codes (off the grid: dropped). */
export function writeChunk(codes: Uint8Array, i: number, g: string): void {
  const [cx, cz] = chunkXZ(i);
  for (let j = 0; j < CHUNK; j++)
    for (let k = 0; k < CHUNK; k++) {
      const c = cx * CHUNK + k, r = cz * CHUNK + j;
      if (onGrid(c, r)) codes[idx(c, r)] = codeOfChar(g[j * CHUNK + k] ?? '0');
    }
}
