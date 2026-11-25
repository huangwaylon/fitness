// The island's camera, NH's (docs/decisions.md "The island in 3D"): a long lens, high, its pitch lowering as it zooms
// in, the pivot (the ground it looks at) a little below the screen's middle, the haze to the log's horizon and the
// ground's far bands culled. One place for the island (engine.ts) and the editor's phone view (editor/Preview3D.svelte),
// so a zoomed phone view in the editor is what the phone shows.
import { Vector3, type Fog, type Mesh, type PerspectiveCamera } from 'three';
import { bendU } from './bend.ts';
import { PITCH } from '#lib/layout/hides.ts';
import { SEA_X } from '#lib/layout/model.ts';

/** The vertical field of view (°). */
export const FOV = 30;
/** The zoom: the default (1) the island opens at; fully in (the user: "increase the maximum zoom level", 1.8 before)
 *  close enough for a villager's face and a flower: the camera ~420u off, its near plane 20. Out past the default as far
 *  as zoomOutOf (the user, 2026-11-25: the whole land's width; a pinch past that gives and springs back). */
export const ZOOM = { def: 1, max: 3.2 } as const;
/** The width the camera shows at the pivot at zoom 1 (u): the land is 450–480 (its beaches just off the sides). */
export const VIEW_W = 420;
/** The widest zoom for a land `landW` across (u): the whole land and SEA_X of sea either side at the pivot (530 u for
 *  the record's 480: 0.79), never closer than the default (a narrow island). */
export const zoomOutOf = (landW: number): number => Math.min(ZOOM.def, VIEW_W / (Math.max(0, landW) + 2 * SEA_X));
/** How far past a limit a pinch may go (eased back on release), as a factor: in past the end ZOOM_OVER, out past the
 *  widest ZOOM_UNDER. */
const ZOOM_OVER = 1.12, ZOOM_UNDER = 1.1;
/** A pinch's raw zoom `k` as shown, the widest `lo`: itself from the widest to fully in (between the widest and the
 *  default it rests where it's left: the user, 2026-11-25), stretched with a felt resistance past either end. */
export function stretchZoom(k: number, lo: number, hi: number = ZOOM.max): number {
  if (k < lo) return lo / (1 + (ZOOM_UNDER - 1) * (1 - 1 / ((lo / k - 1) * 4 + 1)));
  if (k > hi) return hi * (1 + (ZOOM_OVER - 1) * (1 - 1 / ((k / hi - 1) * 4 + 1)));
  return k;
}
/** The terrain lift's blur (u either side along the island): a cliff's 40 u step eases in over ~2 × this of scroll. */
export const LIFT_BLUR = 150;
/** The lift's profile step along the island (u), and its samples across the land a step. */
const LIFT_STEP = 10, LIFT_COLS = 32;
/** The terrain's lift under the view (the user, 2026-11-25: the camera backs off with the ground's height): the land's
 *  mean height across (sea, river beds as 0) a LIFT_STEP row, blurred along the island over ±LIFT_BLUR (a Hann
 *  window), read between rows linearly: a function of the pivot's z only, continuous (no jump at a cliff's edge, no
 *  move of its own once the finger stops). */
export function liftProfile(heightAt: (x: number, z: number) => number, land: { x0: number; x1: number; z0: number; z1: number }): (z: number) => number {
  if (!(land.x1 > land.x0 && land.z1 > land.z0)) return () => 0;
  const pad = LIFT_BLUR + LIFT_STEP, z0 = land.z0 - pad, n = Math.ceil((land.z1 + pad - z0) / LIFT_STEP) + 1;
  const row = new Float64Array(n), dx = (land.x1 - land.x0) / LIFT_COLS;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let c = 0; c < LIFT_COLS; c++) s += Math.max(0, heightAt(land.x0 + (c + 0.5) * dx, z0 + i * LIFT_STEP));
    row[i] = s / LIFT_COLS;
  }
  const r = Math.round(LIFT_BLUR / LIFT_STEP), w: number[] = [];
  for (let j = -r; j <= r; j++) w.push(Math.cos((j / (r + 1)) * (Math.PI / 2)) ** 2);
  const sum = w.reduce((a, b) => a + b, 0), blur = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = -r; j <= r; j++) s += w[j + r] * row[Math.max(0, Math.min(n - 1, i + j))];
    blur[i] = s / sum;
  }
  return (z) => {
    const f = Math.max(0, Math.min(n - 1, (z - z0) / LIFT_STEP)), i = Math.min(n - 2, Math.floor(f));
    return blur[i] + (blur[i + 1] - blur[i]) * (f - i);
  };
}
/** The camera's distance from the pivot (on the sea's level) for a zoom `k`, its back at zoom 1 `d0`, the ground `lift`
 *  up there: backed off along its own line of sight by the lift's share, so the ground `lift` high where that line
 *  meets it is VIEW_W / k across (the same width on a cliff top as below it), the screen's middle on the same ground. */
export const backFor = (d0: number, k: number, lift: number, pitch: number): number => d0 / k + lift / Math.sin(pitch);

/** The scroll's ends (the pivot's z) at a zoom `k`: what must show at an end grows on screen zoomed in, so each zoom
 *  has its own (the user, 2026-11-25: zoomed in, the back's trees were past the far end). */
export interface ZoomEnds { k: number; min: number; max: number }
/** The zooms the ends are fitted at (the widest `lo` … fully in), read between linearly. */
export const endZooms = (lo: number): number[] => [...new Set([lo, ZOOM.def, 1.5, 2.2, ZOOM.max])];
/** The ends at a zoom: between the fitted zooms' linearly, the nearest's past them. */
export function endsAt(ends: readonly ZoomEnds[], k: number): { min: number; max: number } {
  let i = 0;
  while (i < ends.length - 2 && k > ends[i + 1].k) i++;
  const a = ends[i], b = ends[i + 1] ?? a, t = b.k > a.k ? Math.max(0, Math.min(1, (k - a.k) / (b.k - a.k))) : 0;
  return { min: a.min + (b.min - a.min) * t, max: a.max + (b.max - a.max) * t };
}
/** What each end shows (world points: x, z, the height above the ground there), and the screen (px). */
export interface EndMarks {
  midX: number;
  /** The land's front edge (its ground SHORE_AT down the screen). */
  shore: number;
  /** The front's tree whose top clears the HUD, and ウェイ's home (its door half way down, its top clear): at the
   *  default zoom and wider only (zoomed in, the shore and the back's edge come first). */
  canopy: readonly [number, number, number];
  home: readonly [number, number, number];
  /** The land's last row, on its highest ground: its ground EDGE_AT down, and its tall things' tops (a tree's height)
   *  clear of the HUD with a little sky (SKY_AT) over them. */
  edge: readonly [number, number, number];
  /** The HUD's bottom and the screen's height (px). */
  hud: number;
  H: number;
}
const SHORE_AT = 0.83, HOME_AT = 0.5, EDGE_AT = 0.42, CLEAR = 16, SKY_AT = 0.04;
/** The ends fitted at each zoom of `ks`: `sy(camZ, k, x, z, lift)` the screen y (px) of the point `lift` over the
 *  ground at (x, z) with the pivot at camZ, zoom k (larger as camZ grows: the point lower down the screen), the
 *  search within lo … hi. */
export function fitZoomEnds(sy: (camZ: number, k: number, x: number, z: number, lift: number) => number, m: EndMarks, ks: readonly number[], lo: number, hi: number): ZoomEnds[] {
  // (searched near the point: a point far past the log's horizon shows lower again, behind it)
  const solve = (k: number, [x, z, h]: readonly [number, number, number], target: number) => {
    let a = Math.max(lo, z - 900), b = Math.min(hi, z + 400);
    for (let i = 0; i < 18; i++) {
      const mid = (a + b) / 2;
      if (sy(mid, k, x, z, h) < target) a = mid;
      else b = mid;
    }
    return Math.round((a + b) / 2);
  };
  const top = m.hud + CLEAR;
  return ks.map((k) => {
    const wide = k <= ZOOM.def;
    let min = solve(k, [m.midX, m.shore, 0], m.H * SHORE_AT);
    if (wide) min = Math.max(min, solve(k, m.canopy, top));
    const [ex, ez] = m.edge;
    let max = Math.max(solve(k, [ex, ez, 0], Math.max(top, m.H * EDGE_AT)), solve(k, m.edge, top + m.H * SKY_AT));
    if (wide) max = Math.max(max, solve(k, [m.home[0], m.home[1], 0], m.H * HOME_AT), solve(k, m.home, top));
    return { k, min, max: Math.max(min, max) };
  });
}
/** How far below the screen's middle the pivot sits (a share of the height). */
export const PIVOT_DROP = 0.16;
/** The haze's start and end, as shares of the horizon's view depth: only what stands by the horizon fades a little. */
const LAND_HAZE = [0.8, 1.35] as const;
/** The day's sun (toward it, three's space: engine.ts TOD; the editor's light). */
export const DAY_SUN = [-0.55, 1, 0.75] as const;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

/** The pitch at a zoom (radians): layout/hides.ts PITCH's, lower zoomed in (what a tall thing hides by it). */
export function pitchAt(k: number): number {
  const kk = Math.max(ZOOM.def, Math.min(ZOOM.max, k));
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
