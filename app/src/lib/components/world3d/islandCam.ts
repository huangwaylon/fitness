// The island's camera, NH's (docs/decisions.md "The island in 3D"): a long lens, high, its pitch lowering as it zooms
// in, the pivot (the ground it looks at) a little below the screen's middle, the haze to the log's horizon and the
// ground's far bands culled. One place for the island (engine.ts) and the editor's phone view (editor/Preview3D.svelte),
// so a zoomed phone view in the editor is what the phone shows.
import { Vector3, type Fog, type Mesh, type PerspectiveCamera } from 'three';
import { bendU } from './bend.ts';
import { PITCH } from '#lib/layout/hides.ts';

/** The vertical field of view (°). */
export const FOV = 30;
/** The zoom's range: the default (1) is the widest the island rests at (the user: zoomed out past it, a pinch gives
 *  rubber-band resistance and springs back); fully in (the user: "increase the maximum zoom level", 1.8 before) close
 *  enough for a villager's face and a flower: the camera ~420u off, its near plane 20. */
export const ZOOM = { min: 1, max: 3.2 } as const;
/** The width the camera shows at the pivot at zoom 1 (u): the land is 470 (its beaches just off the sides). */
export const VIEW_W = 420;
/** How far below the screen's middle the pivot sits (a share of the height). */
export const PIVOT_DROP = 0.16;
/** The haze's start and end, as shares of the horizon's view depth: only what stands by the horizon fades a little. */
const LAND_HAZE = [0.8, 1.35] as const;
/** The day's sun (toward it, three's space: engine.ts TOD; the editor's light). */
export const DAY_SUN = [-0.55, 1, 0.75] as const;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

/** The pitch at a zoom (radians): layout/hides.ts PITCH's, lower zoomed in (what a tall thing hides by it). */
export function pitchAt(k: number): number {
  const kk = Math.max(ZOOM.min, Math.min(ZOOM.max, k));
  return ((PITCH.def + (PITCH.near - PITCH.def) * ((kk - 1) / (ZOOM.max - 1))) * Math.PI) / 180;
}
/** How far back from the pivot the camera stands at zoom 1 for the screen's aspect (VIEW_W across at the pivot). */
export const backAt = (aspect: number): number => VIEW_W / (2 * TAN * aspect);
/** The pixels across the screen's height a unit is at depth 1 (a screen point's scale: focal / depth). */
export const focalOf = (h: number): number => h / 2 / TAN;

/** The camera looking at (x, y, three's −z) from `back` u away at `pitch` (it never turns sideways). */
export function pose(camera: PerspectiveCamera, x: number, y: number, z: number, back: number, pitch: number) {
  camera.position.set(x, y + back * Math.sin(pitch), -z + back * Math.cos(pitch));
  camera.lookAt(x, y, -z);
  camera.updateMatrixWorld();
}
/** The pivot `drop` of the height below the screen's middle (a W × H screen): more island ahead, the horizon high. */
export function dropPivot(camera: PerspectiveCamera, w: number, h: number, drop = PIVOT_DROP) {
  camera.setViewOffset(w, h, 0, -drop * h, w, h);
  camera.updateProjectionMatrix();
}

/** The log's far horizon from the camera (pivot `camZ`): the tangent's point (three's y, z), into `out`. */
export function horizonAt(camera: PerspectiveCamera, camZ: number, out: Float64Array) {
  const R = bendU.uBendR.value + 3, oy = -bendU.uBendR.value, oz = -camZ;
  const cy = camera.position.y - oy, cz = camera.position.z - oz, L = Math.hypot(cy, cz);
  const base = Math.atan2(cy, cz), a = Math.acos(Math.min(1, R / L));
  const t1 = base + a, t2 = base - a, z1 = oz + R * Math.cos(t1), z2 = oz + R * Math.cos(t2);
  out[0] = oy + R * Math.sin(z1 < z2 ? t1 : t2);
  out[1] = Math.min(z1, z2);
}
const far = new Float64Array(2), v = new Vector3();
/** NH's haze: the far sea (and what stands far off) fades into the sky's horizon colour, all of it by the log's
 *  horizon, so the sea meets the sky in one soft line at every scroll and zoom (no hard band of open sea). */
export function haze(fog: Fog, camera: PerspectiveCamera, camZ: number) {
  horizonAt(camera, camZ, far);
  const depth = Math.max(100, -v.set(camera.position.x, far[0], far[1]).applyMatrix4(camera.matrixWorldInverse).z);
  fog.near = depth * LAND_HAZE[0];
  fog.far = depth * LAND_HAZE[1];
}
/** Whether a band (world z0…z1) is in reach of a pivot at `camZ` (the bend drops the far ones behind the horizon). */
export const bandInView = (b: { z0: number; z1: number }, camZ: number): boolean => b.z1 > camZ - 700 && b.z0 < camZ + 1500;
/** The ground's bands in reach of a pivot at `camZ` shown, the rest hidden. */
export function cullBands(bands: readonly { z0: number; z1: number; meshes: Mesh[] }[], camZ: number) {
  for (const b of bands) {
    const on = bandInView(b, camZ);
    for (const m of b.meshes) m.visible = on;
  }
}
