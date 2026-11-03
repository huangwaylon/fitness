// A critter's moves frame by frame on the 3D island (Critters.svelte's fish and bugs: docs/design.md "Fishing"): the
// 2D island moves their sprites by CSS transitions (a new target, a duration, a timing function); the 3D island reads
// the same moves here each frame (a world node's `live`), eased by the same curves, so the two agree. A new target
// starts from wherever it is now (never a jump), and its heading turns smoothly toward where it's going. Plain objects,
// rewritten in place: nothing allocated per frame.

export type Ease = (k: number) => number;

/** CSS's cubic-bezier(x1, y1, x2, y2) as a function of the time's share (0 … 1). */
export function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const xs = (s: number) => ((ax * s + bx) * s + cx) * s;
  const dxs = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  return (k) => {
    if (k <= 0) return 0;
    if (k >= 1) return 1;
    // the curve's parameter at this time: Newton's steps, then halving if they wander
    let s = k;
    for (let i = 0; i < 6; i++) {
      const e = xs(s) - k, d = dxs(s);
      if (Math.abs(e) < 1e-5) break;
      if (Math.abs(d) < 1e-6) break;
      s -= e / d;
    }
    if (!(s >= 0 && s <= 1) || Math.abs(xs(s) - k) > 1e-4) {
      let lo = 0, hi = 1;
      s = k;
      for (let i = 0; i < 24; i++) {
        if (xs(s) < k) lo = s;
        else hi = s;
        s = (lo + hi) / 2;
      }
    }
    return ((ay * s + by) * s + cy) * s;
  };
}

/** The 2D island's timing functions (Critters.svelte's CSS), by the move. */
export const EASE = {
  /** a shadow's dawdle (`.mover`) */
  swim: bezier(0.45, 0.05, 0.55, 0.95),
  /** a dart in at the float (`.shadow.spurt`) */
  spurt: bezier(0.2, 0.7, 0.3, 1),
  /** away, scared (`.shadow.dash`) */
  dash: bezier(0.2, 0.7, 0.4, 1),
  /** a bug's flight (the 3D island's own) and a quick lift-off (up first) */
  smooth: (k: number) => k * k * (3 - 2 * k),
  out: bezier(0.3, 0.6, 0.4, 1)
} as const;

/** A move from where it was to a target over `ms`: `at(t)` puts it where it is at `t` (ms: performance.now()). */
export class Glide {
  x = 0; z = 0; l = 0;
  fx = 0; fz = 0; fl = 0;
  tx = 0; tz = 0; tl = 0;
  t0 = 0; ms = 0;
  ease: Ease = EASE.swim;
  /** The height's own curve (a bug lifting off rises first), else the move's. */
  lease: Ease | null = null;
  started = false;

  /** Head for (x, z, l) over `ms` from now (`t`); the same target again changes nothing. The first one: it's there. */
  to(t: number, x: number, z: number, l: number, ms: number, ease: Ease, lease: Ease | null = null): this {
    if (!this.started) {
      this.started = true;
      this.x = this.fx = this.tx = x;
      this.z = this.fz = this.tz = z;
      this.l = this.fl = this.tl = l;
      this.t0 = t;
      this.ms = 0;
      return this;
    }
    if (x === this.tx && z === this.tz && l === this.tl) return this;
    this.at(t);
    this.fx = this.x; this.fz = this.z; this.fl = this.l;
    this.tx = x; this.tz = z; this.tl = l;
    this.t0 = t;
    this.ms = Math.max(0, ms);
    this.ease = ease;
    this.lease = lease;
    return this;
  }

  /** Where it is at `t`. */
  at(t: number): this {
    const k = this.ms > 0 ? Math.min(1, Math.max(0, (t - this.t0) / this.ms)) : 1;
    const q = this.ease(k), ql = this.lease ? this.lease(k) : q;
    this.x = this.fx + (this.tx - this.fx) * q;
    this.z = this.fz + (this.tz - this.fz) * q;
    this.l = this.fl + (this.tl - this.fl) * ql;
    return this;
  }

  /** The share of the move done at `t` (1: there). */
  done(t: number): number {
    return this.ms > 0 ? Math.min(1, Math.max(0, (t - this.t0) / this.ms)) : 1;
  }
}

/** The way (radians, the 3D island's yaw: atan2(dx, −dz) of a world move) turned `cur` toward `want` over `dt` ms, at
 *  a turn's time constant `tau` ms: the short way round. */
export function turn(cur: number, want: number, dt: number, tau: number): number {
  let d = (want - cur) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return cur + d * (1 - Math.exp(-Math.max(0, dt) / tau));
}

/** The yaw of a world move (dx, dz): the 3D island's convention (Island3D's `face: 'move'`). */
export const yawOf = (dx: number, dz: number): number => Math.atan2(dx, -dz);
