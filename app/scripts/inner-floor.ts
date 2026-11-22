// A bath's inner floor, for its soak (villager3d/seats3d.ts `u` soak; scripts/seat-anchors.ts BATHS): from the rays down
// of scripts/room-surfaces-page.js sample, each ray's hits from the top. A ray into the basin goes through the water (a
// face up, when the tub has any), down to the inner floor (a face up) and out through the tub's bottom (a face down):
// its floor is the deepest face up before the first face down; one on the rim has its floor at the rim. The basin is
// the rays whose floor is well under the rim, its floor their middle's median (the walls' slopes aside), the soaker's
// hips on it toward the back: a long tub's higher end (a claw-foot's sloped back), else its back (−z), facing the other
// way; a narrow, deep one (a drum can) has no room for the legs out: soaked upright, the hips at its floor's middle. Pure: unit-tested (villager3d/innerFloor.test.ts).
import type { Sample } from './room-surfaces.ts';

export interface Soak {
  /** The hips' spot on the inner floor (model units, +z the front), the way it faces (yaw: 0 its front, −π/2 toward −x). */
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** The rim's height (getting in hops over it). */
  rim: number;
  /** Where one gets in from (on the floor in front of it). */
  fx: number;
  fz: number;
  /** Soaked upright (a narrow, deep tub: the knees up, the back straight; villager3d/poses.ts soak), at the middle. */
  upright?: 1;
}

/** A face up (normal y over this), a face down (under minus this). */
const UP = 0.5, DOWN = -0.3;
/** A slab by the rim (a face down this close under the face up over it, that face within RIM_NEAR of the rim): the water
 *  drawn as a closed volume, a goemon-buro's floating board; gone through to the floor under it. */
const THIN = 0.7, RIM_NEAR = 3;
/** The basin: rays whose floor is this far under the rim at least, and over the ground (no hole in the model). */
const DEEP = 1.5, GROUND = 0.2;
/** How far in from the back wall the hips sit (model units), and in front of the tub one steps in from. */
const BACK = 3.2, STEP = 6;
/** A narrow, deep tub (soaked upright): its basin this wide at most either way, its rim this far over its floor at least. */
const NARROW = 9.5, UPRIGHT_DEEP = 8;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A ray's floor: the deepest face up before the first face down that isn't a slab by the `rim` (null: no face up). */
export function rayFloor(hits: readonly (readonly [number, number])[], rim = Infinity): number | null {
  let f: number | null = null, up = -Infinity;
  for (const [y, ny] of hits) {
    if (ny < DOWN) {
      if (up - y < THIN && up > rim - RIM_NEAR) continue;
      break;
    }
    if (ny > UP) f = up = y;
  }
  return f;
}

/** The bath's soak from its sample (`w` × `d` tiles, `step` the rays' spacing), or null: no basin. */
export function innerFloorOf(s: Sample, w: number, d: number, step: number): Soak | null {
  const W = w * 10, D = d * 10, nx = s.grid.length, nz = s.grid[0]?.length ?? 0;
  const tops = s.grid.flat().filter((h) => h.length).map((h) => h[0][0]).sort((a, b) => a - b);
  if (!tops.length) return null;
  // (the rim: the top hits' 90th percentile, a tap or a spout over it aside)
  const rim = tops[Math.floor(tops.length * 0.9)];
  const floor = s.grid.map((col) => col.map((h) => {
    const f = rayFloor(h, rim);
    return f !== null && f < rim - DEEP && f > GROUND ? f : null;
  }));
  const at = (i: number, j: number) => [-W / 2 + (i + 0.5) * step, -D / 2 + (j + 0.5) * step] as const;
  const cells: [number, number][] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if (floor[i][j] !== null) cells.push([i, j]);
  if (cells.length < 9) return null;
  // the core: basin cells whose neighbours two out are basin too (off the walls' slopes)
  const inBasin = (i: number, j: number) => i >= 0 && j >= 0 && i < nx && j < nz && floor[i][j] !== null;
  const core = cells.filter(([i, j]) => [-2, 0, 2].every((di) => [-2, 0, 2].every((dj) => inBasin(i + di, j + dj))));
  const pick = core.length >= 4 ? core : cells;
  const ys = pick.map(([i, j]) => floor[i][j]!).sort((a, b) => a - b);
  const y = ys[Math.floor(ys.length / 2)];
  const xs = cells.map(([i, j]) => at(i, j)[0]), zs = cells.map(([i, j]) => at(i, j)[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (x1 - x0 > 1.3 * (z1 - z0)) {
    // a long tub: its back the end whose rim stands higher (a claw-foot's slope; level, −x)
    const end = (sgn: number) => {
      const hs = s.grid.flatMap((col, i) => col.map((h, j) => ({ h, x: at(i, j)[0] }))).filter((r) => r.h.length && Math.sign(r.x - cx) === sgn && Math.abs(r.x - cx) > (x1 - x0) / 2).map((r) => r.h[0][0]);
      return hs.length ? Math.max(...hs) : 0;
    };
    const back = end(1) > end(-1) + 0.5 ? 1 : -1;
    const sx = back > 0 ? x1 - BACK : x0 + BACK;
    return { x: r2(sx), y: r2(y), z: r2(cz), yaw: back > 0 ? -Math.PI / 2 : Math.PI / 2, rim: r2(rim), fx: r2(sx), fz: r2(D / 2 + STEP) };
  }
  // a narrow, deep one (a drum can): upright at its floor's middle, facing the front
  if (x1 - x0 < NARROW && z1 - z0 < NARROW && rim - y >= UPRIGHT_DEEP) return { x: r2(cx), y: r2(y), z: r2(cz), yaw: 0, rim: r2(rim), fx: r2(cx), fz: r2(D / 2 + STEP), upright: 1 };
  // a square or round one: its back (−z), facing the front
  const sz = Math.min(cz, z0 + BACK);
  return { x: r2(cx), y: r2(y), z: r2(sz), yaw: 0, rim: r2(rim), fx: r2(cx), fz: r2(D / 2 + STEP) };
}
