// A room's two-finger pan (docs/design.md "The tent"), one for every room (the tent's engine: the tent, the
// homes, the shop; the museum's): the picture slid across the screen (css px, + right and down), NH's framing its home.
// Screen space, so nothing of the camera's turn, tilt, zoom or follow changes: the engines add it to their view offset
// (three's setViewOffset), and a tap's ray, a bubble's point and the culling all follow it. Held so that at least KEEP of
// the room (or of the screen, a room bigger than it) stays in view; past that under the fingers it gives as the island's
// scroll does (a rubber band) and eases back when they lift; a lift on the move flings on with the island's deceleration.
// Never moved by anything but a finger and the home button (no recentring: the user's rule). Pure, no three.
import { cubicOut } from '#lib/math.ts';

/** What of the room shows in the view, without the pan (css px on the canvas: the room's left, top, right, bottom) and
 *  the band of it the room may use (its x0, y0, x1, y1: the canvas less what covers it at its top and foot). */
export interface PanBox { room: [number, number, number, number]; band: [number, number, number, number] }
/** The share of the room (or of the band, a room wider or taller than it) kept in view. */
export const KEEP = 0.5;
/** The rubber band's reach (px), the fling's decay (ms: inside the room, past its edge) and the ease back (ms): the
 *  island's (world3d/engine.ts). */
const REACH = 160, DECAY = 325, DECAY_OUT = 60, BACK = 90;
/** A fling slower than this (px/ms) is over. */
const STOP_V = 0.01;

/** The pan's room along one axis: the offsets that keep KEEP of [lo, hi] over [b0, b1] (0 always: the home). */
export function panRange(lo: number, hi: number, b0: number, b1: number): [number, number] {
  const keep = KEEP * Math.min(hi - lo, b1 - b0);
  return [Math.min(0, b0 + keep - hi), Math.max(0, b1 - keep - lo)];
}
/** Past an edge it gives less and less (iOS's rubber band), and back. */
const rubber = (over: number) => (REACH * over) / (over + REACH);
const unrubber = (s: number) => (REACH * s) / (REACH - Math.min(s, REACH - 1e-6));
/** A raw offset as shown (within its range, else a rubber band past it), and a shown one's raw. */
const shownOf = (v: number, [lo, hi]: [number, number]) => (v < lo ? lo - rubber(lo - v) : v > hi ? hi + rubber(v - hi) : v);
const rawOf = (s: number, [lo, hi]: [number, number]) => (s < lo ? lo - unrubber(lo - s) : s > hi ? hi + unrubber(s - hi) : s);

interface RoomPan {
  /** The offset as shown (px). */
  readonly x: number;
  readonly y: number;
  /** Fingers on (a gesture under way: no fling, no ease back) or lifted. A touch stops a fling. */
  hold(on: boolean): void;
  /** Two fingers' middle moved by (dx, dy) px. */
  drag(dx: number, dy: number, box: PanBox): void;
  /** The picture scaled by `ratio` about its target's point (a pinch's zoom): the point at (fx, fy) (px from where the
   *  target sits unpanned) kept under the fingers. */
  zoomAbout(ratio: number, fx: number, fy: number, box: PanBox): void;
  /** The fingers lifted moving at (vx, vy) px/ms. */
  fling(vx: number, vy: number): void;
  /** Back home, eased over `ms` (the home button). */
  home(t: number, ms: number): void;
  /** Home at once (a museum room changed: its framing starts again). */
  clear(): void;
  /** A frame at `t` (ms): the fling, the ease back, the way home; true while it moves on. */
  step(t: number, box: PanBox): boolean;
  /** Anything to do at the next frame (a fling, an ease, off home: its range may have moved under it). */
  busy(): boolean;
  /** At NH's framing. */
  isHome(): boolean;
}

export function roomPan(): RoomPan {
  let rx = 0, ry = 0, sx = 0, sy = 0, vx = 0, vy = 0, held = false, lastT = 0;
  /** Shown past an edge (the last look). */
  let out = false;
  let homing: { t0: number; ms: number; x: number; y: number } | null = null;
  const ranges = (b: PanBox) => [panRange(b.room[0], b.room[2], b.band[0], b.band[2]), panRange(b.room[1], b.room[3], b.band[1], b.band[3])] as const;
  /** The raw offsets shown, in these ranges. */
  const show = (b: PanBox) => {
    const [ax, ay] = ranges(b);
    sx = shownOf(rx, ax);
    sy = shownOf(ry, ay);
    out = rx < ax[0] || rx > ax[1] || ry < ay[0] || ry > ay[1];
  };
  /** The shown offsets made raw, in these ranges. */
  const unshow = (b: PanBox) => {
    const [ax, ay] = ranges(b);
    rx = rawOf(sx, ax);
    ry = rawOf(sy, ay);
  };
  function move(t: number, dt: number, b: PanBox): boolean {
    if (homing) {
      const k = Math.min(1, (t - homing.t0) / homing.ms), e = 1 - cubicOut(k);
      sx = homing.x * e;
      sy = homing.y * e;
      unshow(b);
      if (k >= 1) (homing = null), (rx = ry = sx = sy = 0), (out = false);
      return !!homing;
    }
    show(b);
    if (held) return false;
    const [ax, ay] = ranges(b);
    if (vx || vy) {
      rx += vx * dt;
      ry += vy * dt;
      const past = (v: number, [lo, hi]: [number, number]) => v < lo || v > hi;
      vx *= Math.exp(-dt / (past(rx, ax) ? DECAY_OUT : DECAY));
      vy *= Math.exp(-dt / (past(ry, ay) ? DECAY_OUT : DECAY));
      if (Math.abs(vx) < STOP_V) vx = 0;
      if (Math.abs(vy) < STOP_V) vy = 0;
      show(b);
      return true;
    }
    if (!out) return false;
    // (still and past an edge: back inside, eased, the island's spring)
    const e = 1 - Math.exp(-dt / BACK), back = (s: number, [lo, hi]: [number, number]) => {
      const to = Math.min(hi, Math.max(lo, s));
      return Math.abs(to - s) > 0.05 ? s + (to - s) * e : to;
    };
    sx = back(sx, ax);
    sy = back(sy, ay);
    unshow(b);
    show(b);
    return out;
  }
  return {
    get x() {
      return sx;
    },
    get y() {
      return sy;
    },
    hold(on) {
      held = on;
      if (on) (vx = vy = 0), (homing = null);
    },
    drag(dx, dy, b) {
      homing = null;
      rx += dx;
      ry += dy;
      show(b);
    },
    zoomAbout(ratio, fx, fy, b) {
      if (!(ratio > 0) || ratio === 1) return;
      homing = null;
      sx = fx - ratio * (fx - sx);
      sy = fy - ratio * (fy - sy);
      unshow(b);
      show(b);
    },
    fling(x, y) {
      if (homing) return;
      vx = Math.abs(x) > STOP_V ? x : 0;
      vy = Math.abs(y) > STOP_V ? y : 0;
      lastT = 0;
    },
    home(t, ms) {
      vx = vy = 0;
      homing = sx || sy ? { t0: t, ms, x: sx, y: sy } : null;
    },
    clear() {
      rx = ry = sx = sy = vx = vy = 0;
      homing = null;
    },
    step(t, b) {
      const dt = lastT ? Math.min(50, t - lastT) : 16;
      lastT = t;
      const on = move(t, dt, b);
      if (!on) lastT = 0;
      return on;
    },
    busy: () => !!homing || !!vx || !!vy || (!held && out),
    isHome: () => Math.abs(sx) < 0.5 && Math.abs(sy) < 0.5
  };
}
