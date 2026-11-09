// The island's shadow box (engine.ts aim): what the sun's shadow camera covers, round a point AHEAD past the pivot, as
// wide as the view. The map is drawn unbent (things.ts lambert), so it needn't redraw as the camera scrolls while the
// box still covers the view; it redraws only when the box moves on. Across, the box moves in steps of STEP (only zoomed
// in: the camera's x); along the island it stays while the pivot is within LEAD of the view's width of where it was
// built, padded to cover the view all the while, and is built again that far ahead in the way the camera goes: one
// redraw a 2 × LEAD of the view's width of scroll (a 40 u step's was one every other frame of a drag).

/** The box's step across (u), and its play either way the 40 u step's box had along the island too (its padding). */
export const STEP = 40;
const LEAD = 0.15;
/** The box's least half width (u; its reach ahead 1.4 of it, behind 1.1), and its middle ahead of the pivot. */
const MIN = 200;
const AHEAD = 120;

export interface ShadowBox {
  key: string;
  /** Its middle's x, and the pivot's z it was built round (three's −z; the middle AHEAD further). */
  x: number;
  z: number;
  /** The shadow camera's extents (its own space) and target (three's space, the sun 700 u off along sunAt). */
  left: number;
  right: number;
  top: number;
  bottom: number;
  target: [number, number, number];
}

/** The box for this camera (`sunAt`: toward the sun; `viewW` the width the camera shows at zoom 1, `zoomMin` the least
 *  zoom): null while `was` still covers the view. */
export function shadowBox(was: ShadowBox | null, camZ: number, camX: number, zoom: number, sunAt: readonly number[], viewW: number, zoomMin: number): ShadowBox | null {
  const kq = Math.round(zoom * 8) / 8, x = Math.round(camX / STEP) * STEP;
  const key = `${kq}:${x}:${sunAt}`, lead = (LEAD * viewW) / kq, drift = was ? camZ - was.z : 0;
  if (was?.key === key && Math.abs(drift) <= lead) return null;
  const z = was?.key === key ? camZ + Math.sign(drift) * lead : camZ;
  // (zoomed right in the low pitch sees further ahead of the pivot than the width: at least MIN; a step's play either
  // way, and the pivot's drift past a 40 u step's along the island as the box sees it: the shadow camera's view of the
  // island's forward, (dx, dy·dz) / |(dx, dz)| of the sun's direction)
  const [sx, sy, sz] = sunAt, across = Math.hypot(sx, sz), pad = lead - STEP / 2;
  const padX = (Math.abs(sx) / across) * pad, padY = (Math.abs(sy * sz) / (across * Math.hypot(sx, sy, sz))) * pad;
  const half = Math.max(MIN, (viewW / Math.max(zoomMin, kq - 0.0625)) * 0.75 + STEP);
  return { key, x, z, left: -half - padX, right: half + padX, top: half * 1.4 + padY, bottom: -half * 1.1 - padY, target: [x, 0, -z - AHEAD] };
}
