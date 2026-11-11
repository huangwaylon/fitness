// What the rooms' engines (the tent's and the museum's) share of a walk and of their screen: a walk's legs and where
// it has a villager by now, a room point on the page (the bubbles, the cards, the taps) and the room's box on the
// screen (the two-finger pan's range: rooms/pan.ts). Pure but for three's camera, and no allocation per call (the
// bubbles ask every frame).
import { Vector2, Vector3, type Camera, type Raycaster } from 'three';
import type { PanBox } from './pan.ts';

/** A villager's height in the rooms (model units: a little over a tile and a half, NH's proportions against its beds). */
export const VILLAGER_H = 16;
/** Walking pace (model units a second: four and a half tiles; three before the user's "increase the walk speed of
 *  players by 50%", 2026-11-04). Only a player walks in a room. */
export const PACE = 45;
/** The longest a room's first frame waits for the villagers' models (ms): its engine's holding. */
export const ENTRY_HOLD_MS = 1500;
/** What covers a room's canvas at its top and foot (px): the room fits between. */
export interface Insets { top: number; bottom: number }

type Pt = readonly [number, number];

/** A walk: from `from` through `pts`, over `ms` from `t0` (ms), its legs' lengths and their sum. */
export interface Walk {
  from: Pt;
  pts: Pt[];
  t0: number;
  ms: number;
  lens: number[];
  total: number;
}

/** A walk's legs' lengths (from `from` through `pts`) and their sum. */
export function walkLens(from: Pt, pts: readonly Pt[]): { lens: number[]; total: number } {
  const lens: number[] = [];
  let a = from, total = 0;
  for (const p of pts) {
    const l = Math.hypot(p[0] - a[0], p[1] - a[1]);
    lens.push(l);
    total += l;
    a = p;
  }
  return { lens, total };
}

/** Where a walk has a villager at `t` (ms), which way its leg heads, and whether it's over. (A walk heard before it
 *  sets off, by a clock a little behind: at its start till then.) */
export function along(P: Walk, t: number): { p: [number, number]; d: [number, number]; done: boolean } {
  const k = Math.max(0, Math.min(1, (t - P.t0) / P.ms));
  let d = k * P.total, a: Pt = P.from;
  for (let i = 0; i < P.pts.length; i++) {
    const b = P.pts[i];
    if (d <= P.lens[i] || i === P.pts.length - 1) {
      const f = P.lens[i] ? Math.min(1, d / P.lens[i]) : 1;
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], d: [b[0] - a[0], b[1] - a[1]], done: k >= 1 };
    }
    d -= P.lens[i];
    a = b;
  }
  return { p: [P.from[0], P.from[1]], d: [0, 0], done: true };
}

/** A room's camera on its canvas: a room point on the page, whether it's in view, and a tap's ray. */
export function roomScreen(camera: Camera, canvas: HTMLCanvasElement) {
  const v = new Vector3(), ndc = new Vector2();
  /** The point projected (three's normalised device coordinates, in `v`). */
  const ndcOf = (x: number, y: number, z: number) => v.set(x, y, z).project(camera);
  const onPage = (r: DOMRect): [number, number] => [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  return {
    /** A room point on the page (client px), wherever it is (behind the camera too). */
    client(x: number, y: number, z: number): [number, number] {
      ndcOf(x, y, z);
      return onPage(canvas.getBoundingClientRect());
    },
    /** A room point on the page, or null when it's behind the camera or past its far plane. */
    project(x: number, y: number, z: number): [number, number] | null {
      ndcOf(x, y, z);
      return v.z > 1 || v.z < -1 ? null : onPage(canvas.getBoundingClientRect());
    },
    /** Whether a room point is on screen (a little past its edges counts). */
    inView(x: number, y: number, z: number): boolean {
      ndcOf(x, y, z);
      return v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05;
    },
    /** `ray` from the camera through the page point (cx, cy). */
    aim(ray: Raycaster, cx: number, cy: number): void {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
    }
  };
}

const boxV = new Vector3();
/** The room's points (its floor's and its walls' corners) on a W × H canvas as the camera has them, less the pan as
 *  applied (`panned`, px), and the band between what covers the canvas at its top and foot (rooms/pan.ts PanBox). A
 *  point behind the camera counts for nothing; none in front, the band itself. */
export function panBox(camera: Camera, pts: readonly (readonly [number, number, number])[], W: number, H: number, panned: readonly [number, number], i: Insets): PanBox {
  camera.updateMatrixWorld();
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const [x, y, z] of pts) {
    boxV.set(x, y, z).project(camera);
    if (boxV.z > 1 || boxV.z < -1) continue;
    const px = ((boxV.x + 1) / 2) * W - panned[0], py = ((1 - boxV.y) / 2) * H - panned[1];
    l = Math.min(l, px);
    r = Math.max(r, px);
    t = Math.min(t, py);
    b = Math.max(b, py);
  }
  const band: PanBox['band'] = [0, i.top, W, Math.max(i.top + 1, H - i.bottom)];
  return { room: l <= r ? [l, t, r, b] : band, band };
}
