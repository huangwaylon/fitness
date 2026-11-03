// Where a balloon's present lands (docs/design.md "Balloon"), pure: chosen before it falls, then the fall is steered
// to it (balloonFlight.ts fallAt), so it never lands where it can't be seen or tapped. NH drops it on the ground under
// the balloon; ours lands in the FRONT of the view, wherever the balloon burst (over the back of the island it drifts
// forward):
//   the ground: walkable sand or grass all round it (the layout's walk grid: not the sea, a river or a pond, not a
//               cliff's edge or the stairs, not under any object's footprint), clear of what lies there (finds,
//               weeds, another present);
//   the screen: inside the view, in its lower part (nearer the camera, big enough to tap), clear of every control
//               (the HUD, the bottom controls, the catch stack, the villagers' and the trees' tap areas).
// Each rule gives way a little (a short screen's front is mostly trees and villagers) before none is found.
import { walkable, type LayoutNav } from '#lib/layout/nav.ts';
import { GRID, TILE, tileX, tileZ } from '#lib/layout/grid.ts';
import { footOf, originOf, type Layout } from '#lib/layout/model.ts';
import type { Box } from './geom.ts';

type Pt = readonly [number, number];
type Surface = 'sea' | 'sand' | 'grass' | 'dirt' | 'stone' | 'water';

/** How far round its spot the ground must be open (u): the present's half (it lies 30u across) and a little. */
const RING = 14;
/** How far a footprint keeps it (u). */
const FOOT_PAD = 4;
const CELL = TILE / 2, COLS = GRID.cols * 2, ROWS = GRID.rows * 2;

/** The walk grid's level at (x, z) (its tier; a ramp's in between), or NaN off it. */
function levelAt(nav: LayoutNav, x: number, z: number): number {
  const i = Math.floor((x - GRID.x0) / CELL), j = Math.floor((z - GRID.z0) / CELL);
  return i >= 0 && j >= 0 && i < COLS && j < ROWS ? nav.level[j * COLS + i] : NaN;
}

/** Every object's footprint on the layout (u: its tiles, nudged as it stands), padded. */
export function footprints(layout: Layout): Box[] {
  return [...layout.objects.values()].map((o) => {
    const [w, d] = footOf(layout, o), [c, r] = originOf(layout, o), nx = o.n?.[0] ?? 0, nz = o.n?.[1] ?? 0;
    return { x0: tileX(c) + nx - FOOT_PAD, x1: tileX(c + w) + nx + FOOT_PAD, y0: tileZ(r) + nz - FOOT_PAD, y1: tileZ(r + d) + nz + FOOT_PAD };
  });
}

/** Whether a present may lie at (x, z): open sand or grass all round it, one level (no cliff's edge, no stairs), off
 *  every footprint. */
export function openGround(nav: LayoutNav, surface: (x: number, z: number) => Surface, feet: readonly Box[]): (x: number, z: number) => boolean {
  const D = RING * Math.SQRT1_2;
  const ring: Pt[] = [[0, 0], [RING, 0], [-RING, 0], [0, RING], [0, -RING], [D, D], [-D, D], [D, -D], [-D, -D]];
  return (x, z) => {
    const lv = levelAt(nav, x, z);
    if (!Number.isInteger(lv)) return false;
    for (const [dx, dz] of ring) {
      const px = x + dx, pz = z + dz, s = surface(px, pz);
      if ((s !== 'grass' && s !== 'sand') || !walkable(nav, px, pz) || levelAt(nav, px, pz) !== lv) return false;
    }
    return !feet.some((b) => x > b.x0 && x < b.x1 && z > b.y0 && z < b.y1);
  };
}

/** The view a present lands in. Px from the scene's top-left. */
export interface LandView {
  /** A ground point on screen, or null behind the horizon. */
  screen(x: number, z: number): readonly [number, number] | null;
  /** What of the screen the island shows uncovered: its sides, the top (the HUD's foot, or the horizon if lower) and
   *  the bottom (the scene's, or the bottom controls' top). */
  box: { x0: number; x1: number; y0: number; y1: number };
  /** The controls (px boxes) it keeps clear of. */
  guards: readonly Box[];
  /** The ground in view (world): x across, z from the screen's foot to the horizon. */
  xs: readonly [number, number];
  zs: readonly [number, number];
}

/** The rules from strict to lenient: how far into the screen's lower part (a share down from its top), from the
 *  screen's edges and the controls (px), and from what lies on the ground (u). */
const TIERS = [
  { front: 0.4, edge: 40, guard: 40, gap: 28 },
  { front: 0.25, edge: 28, guard: 22, gap: 22 },
  { front: 0.1, edge: 22, guard: 10, gap: 16 },
  { front: 0, edge: 22, guard: 0, gap: 0 }
] as const;
/** The search's step (u). */
const STEP = 10;

/** Where the present lands (world x, z), or null when no open ground is in view at all. `open`: openGround's test;
 *  `lying`: what lies on the ground (world points); `sx`: the burst's screen x (it lands under it if it can, and low
 *  on the screen: the front, near the camera). */
export function chooseLanding(view: LandView, open: (x: number, z: number) => boolean, lying: readonly Pt[], sx: number): Pt | null {
  const { box } = view, H = box.y1 - box.y0;
  if (H <= 0) return null;
  const want = box.y0 + H * 0.66, bx = Math.max(box.x0, Math.min(box.x1, sx));
  // the candidates once: open ground on screen
  const cands: { p: Pt; s: readonly [number, number] }[] = [];
  for (let z = Math.ceil(view.zs[0] / STEP) * STEP; z <= view.zs[1]; z += STEP)
    for (let x = Math.ceil(view.xs[0] / STEP) * STEP; x <= view.xs[1]; x += STEP) {
      const s = view.screen(x, z);
      if (!s || s[0] < box.x0 || s[0] > box.x1 || s[1] < box.y0 || s[1] > box.y1 || !open(x, z)) continue;
      cands.push({ p: [x, z], s });
    }
  for (const t of TIERS) {
    let best: Pt | null = null, bestD = Infinity;
    for (const { p, s } of cands) {
      const [px, py] = s;
      if (py < box.y0 + H * t.front || px < box.x0 + t.edge || px > box.x1 - t.edge || py > box.y1 - t.edge) continue;
      if (view.guards.some((b) => px > b.x0 - t.guard && px < b.x1 + t.guard && py > b.y0 - t.guard && py < b.y1 + t.guard)) continue;
      if (lying.some(([lx, lz]) => Math.hypot(lx - p[0], lz - p[1]) < t.gap)) continue;
      const d = Math.abs(px - bx) + Math.abs(py - want) * 0.8;
      if (d < bestD) [best, bestD] = [p, d];
    }
    if (best) return best;
  }
  return null;
}
