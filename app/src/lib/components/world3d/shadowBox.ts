// The island's shadow box (engine.ts aim): what the sun's shadow camera covers, round a point AHEAD past the pivot, as
// wide as the view. The map is drawn unbent (things.ts lambert), so it needn't redraw as the camera scrolls while the
// box still covers the view; it redraws only when the box moves on. Across, the box moves in steps of STEP (only zoomed
// in: the camera's x); along the island it stays while the pivot is within LEAD of the view's width of where it was
// built, padded to cover the view all the while, and is built again that far ahead in the way the camera goes: one
// redraw a 2 × LEAD of the view's width of scroll (a 40 u step's was one every other frame of a drag). While a gesture
// zooms in, the box built for the wider view still covers the narrower one: it's kept (a pinch crossed ~18 zoom buckets
// each way, 10–16 redraws a second) and built once for the zoom when the gesture ends.

import type { DirectionalLight } from 'three';

/** The box's step across (u), and its play either way the 40 u step's box had along the island too (its padding). */
export const STEP = 40;
const LEAD = 0.15;
/** The box's least half width (u; its reach ahead 1.4 of it, behind 1.1), and its middle ahead of the pivot. */
const MIN = 200;
const AHEAD = 120;
/** Zooming out mid-gesture, the box is built this much further out (two buckets: a third the redraws, ~12 % coarser). */
const OUT = 0.25;

export interface ShadowBox {
  /** The zoom's bucket and the sun it was built for (no key string an aim: a drag's every event). */
  k: number;
  /** Its half width before padding, and the pivot's play along the island (u). */
  half: number;
  lead: number;
  sun: readonly number[];
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

/** The box's half width at a zoom bucket (zoomed right in the low pitch sees further ahead of the pivot than the width:
 *  at least MIN). */
const halfAt = (kq: number, viewW: number, zoomMin: number) => Math.max(MIN, (viewW / Math.max(zoomMin, kq - 0.0625)) * 0.75 + STEP);

/** The box for this camera (`sunAt`: toward the sun, one array a sun; `viewW` the width the camera shows at zoom 1,
 *  `zoomMin` the least zoom; `moving`: a gesture under way): null while `was` still covers the view. */
export function shadowBox(was: ShadowBox | null, camZ: number, camX: number, zoom: number, sunAt: readonly number[], viewW: number, zoomMin: number, moving = false): ShadowBox | null {
  const zq = Math.round(zoom * 8) / 8, x = Math.round(camX / STEP) * STEP, drift = was ? camZ - was.z : 0;
  // (mid-gesture: a wider box holds the one this zoom would build while its pivot is in the wider one's play; past it
  // zooming out, built OUT wider)
  if (moving && was && was.sun === sunAt && zq > was.k && Math.abs(drift) <= was.lead && Math.abs(x - was.x) <= was.half - halfAt(zq, viewW, zoomMin)) return null;
  const kq = moving && was && zq < was.k ? zq - OUT : zq, half = halfAt(kq, viewW, zoomMin);
  const same = !!was && was.k === kq && was.x === x && was.sun === sunAt, lead = (LEAD * viewW) / kq;
  if (same && Math.abs(drift) <= lead) return null;
  (globalThis as any).__sb?.push([moving, zq, was?.k, Math.round(drift), was?.lead, x - (was?.x ?? 0), was ? Math.round(was.half - halfAt(zq, viewW, zoomMin)) : 0, same]);
  const z = same ? camZ + Math.sign(drift) * lead : camZ;
  // (a step's play either way, and the pivot's drift past a 40 u step's along the island as the box sees it: the shadow
  // camera's view of the island's forward, (dx, dy·dz) / |(dx, dz)| of the sun's direction)
  const [sx, sy, sz] = sunAt, across = Math.hypot(sx, sz), pad = lead - STEP / 2;
  const padX = (Math.abs(sx) / across) * pad, padY = (Math.abs(sy * sz) / (across * Math.hypot(sx, sy, sz))) * pad;
  return { k: kq, half, lead, sun: sunAt, x, z, left: -half - padX, right: half + padX, top: half * 1.4 + padY, bottom: -half * 1.1 - padY, target: [x, 0, -z - AHEAD] };
}

/** The sun put on a box: its shadow camera's extents, its target, the sun 700 u off toward `sunAt`. */
export function sunOn(sun: DirectionalLight, box: ShadowBox, sunAt: readonly number[]) {
  const [sx, sy, sz] = sunAt, [tx, ty, tz] = box.target, cam = sun.shadow.camera;
  cam.left = box.left;
  cam.right = box.right;
  cam.top = box.top;
  cam.bottom = box.bottom;
  cam.near = 10;
  cam.far = 1800;
  cam.updateProjectionMatrix();
  sun.position.set(tx + sx * 700, ty + sy * 700, tz + sz * 700);
  sun.target.position.set(tx, ty, tz);
  sun.target.updateMatrixWorld();
}
