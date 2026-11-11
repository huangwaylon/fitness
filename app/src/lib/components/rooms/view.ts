// What the rooms' engines (the tent's and the museum's) share of a walk and of their screen: a walk's legs and where
// it has a villager by now, a room point on the page (the bubbles, the cards, the taps), the room's box on the screen
// and the two-finger pan on the camera (roomView: rooms/pan.ts's range, offset, way home and the gesture's pixel
// ratio). Pure but for three's camera, and no allocation per call (the bubbles ask every frame).
import { Vector2, Vector3, type Camera, type PerspectiveCamera, type Raycaster } from 'three';
import { roomPan, type PanBox } from './pan.ts';

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
function panBox(camera: Camera, pts: readonly (readonly [number, number, number])[], W: number, H: number, panned: readonly [number, number], i: Insets): PanBox {
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

/** A room's turn, tilt and zoom, as the recentre compares them. */
interface Aim { az: number; pitch: number; k: number }
/** Within this of the default (the turn and tilt in radians, the zoom): at NH's framing. */
const AT_DEF = 0.02;
/** At the default turn, tilt and zoom (the turn the shortest way round), the pan aside. */
export const atAim = (v: Aim, d: Aim) =>
  Math.abs(Math.atan2(Math.sin(v.az - d.az), Math.cos(v.az - d.az))) < AT_DEF && Math.abs(v.pitch - d.pitch) < AT_DEF && Math.abs(v.k - d.k) < AT_DEF;
/** The way home (ms: the recentre button's ease, the turn's and the pan's alike). */
export const HOME_MS = 420;
/** How long after a gesture a room keeps its lighter pixel ratio (ms): one buffer resize at the start and one at the
 *  end of a burst of gestures, not two at each. */
const REST_DPR_MS = 160;
/** The frames' costs a room keeps (stats().cost: the budget checks). */
export const COST_FRAMES = 600;

/** A room's two-finger pan on its camera (the tent's engine and the museum's): the pan (rooms/pan.ts) as the view has
 *  it (`mix()`: the first person's glide, none at the eyes), its range from the room's `corners()` (its floor's and
 *  walls' tops) over the band `insets()` leaves, the view's offset (`shiftY()`: the band's middle under the canvas's),
 *  a pinch's pan, and the pixel ratio while a gesture's under way (`dprMoving`, kept REST_DPR_MS after it; `wake()`:
 *  a frame asked for then). */
export function roomView(camera: PerspectiveCamera, canvas: HTMLCanvasElement, o: {
  mix(): number;
  shiftY(): number;
  insets(): Insets;
  corners(): readonly (readonly [number, number, number])[];
  dprMoving: number;
  wake(): void;
}) {
  const pan = roomPan(), panned: [number, number] = [0, 0];
  /** The canvas's corner, read once a gesture starts (not a layout read each move). */
  let rectAt: DOMRect | null = null, held = false, light = false, rest: ReturnType<typeof setTimeout> | undefined;
  /** The view's offset as the pan has it now. */
  function offset() {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1, k = 1 - o.mix();
    panned[0] = pan.x * k;
    panned[1] = pan.y * k;
    camera.setViewOffset(W, H, -panned[0], o.shiftY() - panned[1], W, H);
    camera.updateProjectionMatrix();
  }
  /** The room on the canvas without the pan, and the band it may use. */
  const box = () => panBox(camera, o.corners(), canvas.clientWidth || 1, canvas.clientHeight || 1, panned, o.insets());
  return {
    pan,
    offset,
    /** Two fingers moved by (dx, dy) px and pinched by `ratio` (the zoom before over after) about (mx, my) client px. */
    pinch(dx: number, dy: number, ratio: number, mx: number, my: number) {
      const r = (rectAt ??= canvas.getBoundingClientRect()), b = box();
      pan.drag(dx, dy, b);
      pan.zoomAbout(ratio, mx - r.left - (canvas.clientWidth || 1) / 2, my - r.top - ((canvas.clientHeight || 1) / 2 - o.shiftY()), b);
      offset();
    },
    /** A frame at `t` (ms): the fling, the ease back inside, the way home (its range again: the view may have moved);
     *  true while it moves on. */
    step(t: number): boolean {
      if (pan.isHome() && !pan.busy()) return false;
      const on = pan.step(t, box());
      offset();
      return on;
    },
    /** Fingers on or lifted: the pan held, the lighter ratio on at once and off REST_DPR_MS after the last lift. */
    hold(on: boolean) {
      clearTimeout(rest);
      pan.hold(on);
      rectAt = null;
      if (on) held = light = true;
      else if (held) (held = false), (rest = setTimeout(() => ((light = false), o.wake()), REST_DPR_MS));
    },
    /** The pixel ratio to draw at (`full` at rest). */
    ratio: (full: number) => (light || pan.busy() ? Math.min(o.dprMoving, full) : full),
    dispose: () => clearTimeout(rest)
  };
}
