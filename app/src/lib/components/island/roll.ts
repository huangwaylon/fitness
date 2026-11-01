// The rolling log (docs: /tmp/rolling-log/research.md, option A): NH's island bends away from the camera like a log
// rolling under it. A pure projection from the flat world (x across, z into the island) onto a cylinder of radius R
// whose top touches the ground at the camera's foot (camZ), seen by an orthographic camera pitched `tilt` degrees
// down, plus a mild perspective shrink. Everything on screen goes through `project()`: the ground's bands, each
// sprite's feet, the shadows. No DOM here.
//
//   θ = (z − camZ) / R                      the angle around the log (0 at the camera's foot, + away from us)
//   forward f = R·sin θ, height h = −R·(1 − cos θ)
//   screen up = f + h·cot(tilt)             (normalised so the ground at the pivot has scale 1)
//   ground foreshortening = cos θ − sin θ·cot(tilt)   (cos θ when looking straight down)
//   the horizon: where the ground turns edge-on, θ = tilt, at a constant R·tan(tilt / 2) above the pivot
//
// The parabola (y −= k·z², the shader trick) is kept for the comparison: h = −d² / 2R, horizon at d = R·tan(tilt).

export type Curve = 'cylinder' | 'parabola';

export interface RollParams {
  /** The log's radius (world units; 1 unit = 1 CSS px at 390 wide). */
  R: number;
  /** Camera pitch in degrees below the horizontal (90 = straight down). The horizon sits at θ = tilt. */
  tilt: number;
  /** θ (degrees) where sprites start fading into the haze. */
  fadeStart: number;
  /** θ (degrees) where they are gone (a little past the horizon: they sink behind it meanwhile). */
  fadeEnd: number;
  /** Perspective distance (units): the scale is persp / (persp + depth). Infinity = orthographic. */
  persp: number;
  /** World x at the screen's centre line. */
  cx: number;
  curve: Curve;
  /** How many horizontal bands the ground is cut into. */
  bands: number;
}

export const ROLL_DEFAULTS: RollParams = { R: 730, tilt: 64, fadeStart: 50, fadeEnd: 72, persp: 1600, cx: 195, curve: 'cylinder', bands: 40 };

export interface Projected {
  /** Units right of the screen's centre line. */
  x: number;
  /** Units below the pivot line (negative: above it, toward the horizon). */
  y: number;
  /** Perspective scale (1 at the pivot). Sprites scale by it, upright. */
  scale: number;
  /** Vertical foreshortening of the ground here (1 at the pivot, 0 at the horizon): bands and shadows. */
  ground: number;
  /** Distance from the camera along its view (0 at the pivot, bigger = further): the draw order. */
  depth: number;
  /** The slope angle θ (radians) of the ground here. */
  theta: number;
  /** Worth drawing: in front of the horizon or just past it (a tall sprite still pokes over it). */
  visible: boolean;
  /** Opacity, 1 → 0 between fadeStart and fadeEnd. */
  fade: number;
}

const RAD = Math.PI / 180;
/** Past the horizon a sprite still shows its top for this many degrees (sinking behind it, clipped by the caller). */
const SINK = 24 * RAD;
/** The near side rolls down under the screen's bottom long before this (θ = −80°). */
const NEAR = 80 * RAD;

function surface(d: number, p: RollParams): { f: number; h: number; df: number; dh: number; theta: number } {
  if (p.curve === 'parabola') return { f: d, h: (-d * d) / (2 * p.R), df: 1, dh: -d / p.R, theta: Math.atan(d / p.R) };
  const t = d / p.R;
  return { f: p.R * Math.sin(t), h: -p.R * (1 - Math.cos(t)), df: Math.cos(t), dh: -Math.sin(t), theta: t };
}

/** Where a point of the flat world lands on screen for a camera at camZ. */
export function project(worldX: number, worldZ: number, camZ: number, p: RollParams): Projected {
  const phi = p.tilt * RAD;
  const cot = Math.cos(phi) / Math.sin(phi);
  const { f, h, df, dh, theta } = surface(worldZ - camZ, p);
  const up = f + h * cot;
  const depth = f * Math.cos(phi) - h * Math.sin(phi);
  const scale = Number.isFinite(p.persp) ? p.persp / Math.max(p.persp * 0.25, p.persp + depth) : 1;
  const ground = Math.max(0, df + dh * cot);
  const visible = theta <= phi + SINK && theta >= -NEAR;
  const a = p.fadeStart * RAD, b = p.fadeEnd * RAD;
  const fade = theta <= a ? 1 : theta >= b ? 0 : 1 - (theta - a) / (b - a);
  return { x: (worldX - p.cx) * scale, y: -up, scale, ground, depth, theta, visible, fade };
}

/** The horizon's height above the pivot line (units): constant, whatever the camera. */
export function horizonUp(p: RollParams): number {
  const phi = p.tilt * RAD;
  return p.curve === 'parabola' ? (p.R * Math.tan(phi)) / 2 : p.R * Math.tan(phi / 2);
}

/** The world distance ahead of the camera at which the ground meets the horizon. */
export function horizonAhead(p: RollParams): number {
  const phi = p.tilt * RAD;
  return p.curve === 'parabola' ? p.R * Math.tan(phi) : p.R * phi;
}

/** The R that puts the horizon `up` units above the pivot (so the sky keeps its share on every screen). */
export function radiusFor(up: number, tilt: number, curve: Curve): number {
  const phi = tilt * RAD;
  return curve === 'parabola' ? (2 * up) / Math.tan(phi) : up / Math.tan(phi / 2);
}

export interface Band {
  /** Units below the pivot of the band's near (bottom) edge. */
  y: number;
  /** Its height on screen (units) once foreshortened. */
  span: number;
  /** Vertical scale: span over the band's depth. */
  scaleY: number;
  /** Horizontal (perspective) scale at its near and far edges (a trapezoid: quadMatrix). */
  scaleNear: number;
  scaleFar: number;
  visible: boolean;
}

/** One horizontal band of ground, world z0 (near) to z1 (far): squashed between its projected edges. A band across
 *  the horizon is squashed into what is left below it; one past it is not drawn. */
export function band(z0: number, z1: number, camZ: number, p: RollParams): Band {
  const zh = camZ + horizonAhead(p);
  const near = project(p.cx, z0, camZ, p);
  if (z0 >= zh || !near.visible) return { y: near.y, span: 0, scaleY: 0, scaleNear: near.scale, scaleFar: near.scale, visible: false };
  const far = project(p.cx, Math.min(z1, zh), camZ, p);
  const span = Math.max(0, near.y - far.y);
  return { y: near.y, span, scaleY: span / (z1 - z0), scaleNear: near.scale, scaleFar: far.scale, visible: span > 0 };
}

/** The CSS matrix3d (16 numbers, column-major) taking a w × h box onto a quad: [top-left, top-right, bottom-right,
 *  bottom-left] as x, y pairs (a projective map, Heckbert's square-to-quad). One flat transform on one element, no
 *  preserve-3d: a band becomes a trapezoid, so the perspective narrows the ground smoothly instead of in steps. */
export function quadMatrix(w: number, h: number, q: readonly number[]): number[] {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = det ? (dx3 * dy2 - dx2 * dy3) / det : 0;
  const k = det ? (dx1 * dy3 - dx3 * dy1) / det : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
}

/** The camera for a scroll position: the scroller's top is the back of the island, its bottom the front (a drag
 *  down pulls the island toward you, as walking up does in NH). `px` = CSS px per world unit. */
export function camAt(scrollTop: number, camMin: number, camMax: number, px: number): number {
  return camMax - scrollTop / px;
}

/** The scroll position that puts the camera at camZ (camAt's inverse). */
export function scrollFor(camZ: number, camMax: number, px: number): number {
  return (camMax - camZ) * px;
}

/** z-index from the feet: the projected depth is monotonic in world z on the log (d depth / dz = cos(θ − tilt) > 0
 *  everywhere in view), so the order is the world's and only changes when something moves, never on a scroll. Ties
 *  by x (left first), as a y-sort does. */
export function zIndexAt(z: number, x: number, zMax: number): number {
  const row = Math.max(0, Math.round((zMax - z) * 4));
  const col = Math.min(1023, Math.max(0, Math.round(x + 300)));
  return 10 + row * 1024 + col;
}

/** How much of a sprite (in its own unscaled units) has sunk behind the horizon: 0 until its feet pass it (θ > tilt),
 *  then the drop of its feet below the horizon line. */
export function sinkBelow(at: Projected, p: RollParams): number {
  return at.theta > p.tilt * RAD ? Math.max(0, (at.y + horizonUp(p)) / at.scale) : 0;
}

/** The world point under a screen point (the inverse of project()): `dx` = units right of the screen's centre line, `up`
 *  = units above the pivot line. Solves up(θ) = R·sin θ − R(1 − cos θ)·cot(tilt) for θ in [−80°, tilt − 1°] (monotonic
 *  there: up' = R·ground > 0) with Newton steps and a bisection fallback, then z = camZ + R·θ and x = cx + dx / scale.
 *  Null above the horizon (a tap in the sky) or below the near limit. */
export function unproject(dx: number, up: number, camZ: number, p: RollParams): { x: number; z: number; theta: number } | null {
  const phi = p.tilt * RAD;
  const cot = Math.cos(phi) / Math.sin(phi);
  const para = p.curve === 'parabola';
  // the parabola is parameterised by the distance d = R·tan θ (surface()'s theta = atan(d / R))
  const upAt = (t: number) => {
    if (para) {
      const d = p.R * Math.tan(t);
      return d - ((d * d) / (2 * p.R)) * cot;
    }
    return p.R * Math.sin(t) - p.R * (1 - Math.cos(t)) * cot;
  };
  const slope = (t: number) => (para ? (p.R * (1 - Math.tan(t) * cot)) / Math.cos(t) ** 2 : p.R * (Math.cos(t) - Math.sin(t) * cot));
  let lo = -NEAR, hi = phi - RAD;
  if (up > upAt(hi) || up < upAt(lo)) return null;
  let t = Math.max(lo, Math.min(hi, up / p.R));
  for (let i = 0; i < 40; i++) {
    const v = upAt(t) - up;
    if (Math.abs(v) < 1e-7) break;
    if (v > 0) hi = t;
    else lo = t;
    const d = slope(t);
    let n = d > 1e-9 ? t - v / d : NaN;
    if (!(n > lo && n < hi)) n = (lo + hi) / 2; // Newton left the bracket: bisect
    t = n;
  }
  const z = camZ + (para ? p.R * Math.tan(t) : p.R * t);
  return { x: p.cx + dx / project(p.cx, z, camZ, p).scale, z, theta: t };
}

/** The camera at which a monotonic f (the screen y of something, growing as the camera moves back) reaches `want`,
 *  within [lo, hi] (bisection; an end when it's never reached there): the scroller's two ends are fitted with it. */
export function solveCam(f: (cam: number) => number, want: number, lo: number, hi: number): number {
  if (f(lo) >= want) return lo;
  if (f(hi) <= want) return hi;
  let a = lo, b = hi;
  for (let i = 0; i < 40 && b - a > 0.25; i++) {
    const m = (a + b) / 2;
    if (f(m) < want) a = m;
    else b = m;
  }
  return b;
}
