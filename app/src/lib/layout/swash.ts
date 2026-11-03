// NH's waves washing ashore (docs/design.md "World: the sea's wash", docs/island-layout.md "The water"), pure: one
// rhythm for the 3D ground's sand and the sea's shader (world3d/terrain.ts: SWASH_GLSL is this file's maths in GLSL)
// and for what the waves bring in (a shell, the bottle: Finds.svelte rides one up the beach).
//   A point's place on the shore is `s`, how far up the beach from the waterline (u; negative out in the water): the
// land's distance field (fields.ts Ch.land) less WATERLINE. Each wave is a cycle of PERIOD seconds: its foam line comes
// in over the shallows (the last share of the cycle), runs up the sand easing out to its reach, then drains back down,
// faster as it goes (NH's backwash), into the water; the sand it covered stays dark and wet a little while and dries.
// The cycle's phase is the coast's own, from the nearest point on the shoreline (the point less the field's normal
// times its distance): the same all the way up the beach (the front stays a line along the coast), varying smoothly
// along it (several waves along a beach, out of step, travelling along it a little), and the reach varies wave to wave.
// Only low-frequency trig: the GPU's and the CPU's agree (a hash's fract(sin(…)) wouldn't).
import { Ch, type Fields } from './fields.ts';

/** One wave's cycle (s): NH's gentle rhythm; 3600 (the water's clock wraps there, water.ts) is a whole number of them. */
export const PERIOD = 5;
/** The waves in the water's clock's hour: wave i's reach is wave i mod WAVES's, so the hour's wrap carries on the very
 *  wave (and the one before it) where it was. */
const WAVES = 3600 / PERIOD;
/** Where the sea's surface meets the beach, on the land's field (u): the beach rises 0.12 a unit from 0 at dL = 0 and
 *  the seabed falls 0.3 a unit (layout/height.ts), the sea at SEA_Y −0.5. */
export const WATERLINE = 1.7;
/** The cycle's shares: the run-up ends at UP, the backwash at DOWN; then the next wave's foam line comes in. */
const UP = 0.32, DOWN = 0.78;
/** A wave's reach up the sand (u): REACH_MIN … REACH_MIN + REACH_VAR; the backwash drains to DRAIN below the
 *  waterline; the next foam line comes in from APPROACH out. */
const REACH_MIN = 11, REACH_VAR = 11, DRAIN = 3, APPROACH = 16;
/** The wet sand's drying (s, the time constant). */
const DRY = 1.6;

/** The coast's phase at its point (x, z) on the shoreline (0 … 1). */
export const phaseAt = (x: number, z: number): number => {
  const p = 0.0016 * (x * 0.6 + z) + 0.14 * Math.sin(x * 0.019 + 1.3) + 0.12 * Math.sin(z * 0.015 + x * 0.007);
  return p - Math.floor(p);
};
/** Wave `i`'s reach (u) at the coast point (x, z). */
const reachOf = (i: number, x: number, z: number): number =>
  REACH_MIN + REACH_VAR * (0.5 + 0.5 * Math.sin((i - Math.floor(i / WAVES) * WAVES) * 2.4 + x * 0.013 + z * 0.011));

/** The wave front's place `s` (u up the beach from the waterline) at `u` (0 … 1) through a wave reaching `reach`. */
export function frontAt(u: number, reach: number): number {
  if (u < UP) {
    const k = 1 - u / UP;
    return reach * (1 - k * k);
  }
  if (u < DOWN) {
    const v = (u - UP) / (DOWN - UP);
    return reach - (reach + DRAIN) * v * v;
  }
  return -APPROACH + APPROACH * ((u - DOWN) / (1 - DOWN));
}

/** When (a share of the cycle) the backwash drains past `s` (0 ≤ s < reach): the sand there starts drying. */
function drainedAt(s: number, reach: number): number {
  return UP + (DOWN - UP) * Math.sqrt(Math.max(0, (reach - s) / (reach + DRAIN)));
}

/** At `s` (u up the beach), time `t` (s), on the coast point (x, z): the front's place, whether the water covers it
 *  and how wet the sand is (1 just uncovered … 0 dry; 1 while covered). */
export function swash(s: number, t: number, x: number, z: number): { front: number; covered: boolean; wet: number } {
  const c = t / PERIOD + phaseAt(x, z), i = Math.floor(c), u = c - i;
  const reach = reachOf(i, x, z), front = frontAt(u, reach);
  const covered = s >= 0 && s < front;
  let wet = covered ? 1 : 0;
  // the sand this wave covered and left, then the last wave's
  if (!covered && s >= 0 && s < reach && u >= UP) wet = Math.max(wet, Math.exp((-(u - drainedAt(s, reach)) * PERIOD) / DRY));
  const prev = reachOf(i - 1, x, z);
  if (!covered && s >= 0 && s < prev) wet = Math.max(wet, Math.exp((-(u + 1 - drainedAt(s, prev)) * PERIOD) / DRY));
  return { front, covered, wet: Math.min(1, wet) };
}

/** Seconds from `t` until the next wave starts up the sand at the coast point (x, z). */
export function nextRunUp(t: number, x: number, z: number): number {
  const c = t / PERIOD + phaseAt(x, z);
  return (Math.ceil(c) - c) * PERIOD;
}

/** The shore's normal at (x, z): the unit way out to sea (the land field's gradient), or null where the field is flat
 *  (far from any shore). */
export function shoreNormal(f: Fields, x: number, z: number): [number, number] | null {
  const h = 2.5;
  const gx = f.at(Ch.land, x + h, z) - f.at(Ch.land, x - h, z), gz = f.at(Ch.land, x, z + h) - f.at(Ch.land, x, z - h);
  const l = Math.hypot(gx, gz);
  return l < 1e-3 ? null : [gx / l, gz / l];
}

/** Where a thing at (x, z) on the beach comes ashore from: the point `out` u past the waterline straight out to sea
 *  from it (walked out along the shore's normal: the field is clamped at FAR, a find may lie further up), the coast
 *  point it's on (the shoreline there) and how far it slides up the beach (u); null in the sea or away from a shore. */
export function washFrom(f: Fields, x: number, z: number, out = 2): { from: [number, number]; coast: [number, number]; dist: number } | null {
  if (f.at(Ch.land, x, z) >= 0) return null;
  const goal = WATERLINE + out;
  let px = x, pz = z, coast: [number, number] | null = null;
  for (let i = 0; i < 80; i++) {
    const d = f.at(Ch.land, px, pz);
    if (d >= 0 && !coast) coast = [px, pz];
    if (d >= goal - 0.05) return { from: [px, pz], coast: coast ?? [px, pz], dist: Math.hypot(px - x, pz - z) };
    const n = shoreNormal(f, px, pz);
    if (!n) return null;
    const step = Math.min(10, Math.max(0.5, goal - d));
    // (just short of the shoreline: on to it exactly, so the coast point is on it)
    const k = d < 0 && d + step > 0 ? -d : step;
    px += n[0] * k;
    pz += n[1] * k;
  }
  return null;
}

/** A thing washing in: from `from` to `to` (world x, z), starting at `t0` (ms), over `ms`; reduced motion: it fades in
 *  where it lies. */
export interface WashIn {
  from: [number, number];
  to: [number, number];
  t0: number;
  ms: number;
}
/** How long a wash-in slides (ms): ~1 s, longer the further up the beach (1.5 s at most). */
export const washMs = (dist: number): number => Math.round(1000 + Math.min(500, Math.max(0, dist - 10) * 6));
/** A wash-in at `t` (ms): where it is (eased out: it slows as it comes to rest), and its opacity (it fades in over the
 *  first 45%); done once it lies at its spot. */
export function washAt(w: WashIn, t: number): { x: number; z: number; a: number; done: boolean } {
  const k = Math.min(1, Math.max(0, (t - w.t0) / w.ms));
  const q = 1 - (1 - k) ** 3;
  const a = t < w.t0 ? 0 : Math.min(1, k / 0.45);
  return { x: w.from[0] + (w.to[0] - w.from[0]) * q, z: w.from[1] + (w.to[1] - w.from[1]) * q, a: a * a * (3 - 2 * a), done: k >= 1 };
}

/** The same maths for the shaders (uTime: the water's clock, s). `swashFront(c, t)`: the front's place, the wave's
 *  reach and its share through the cycle at coast point c; `swashWet(s, c, t)`: the wet sand at s (1 while covered). */
export const SWASH_GLSL = /* glsl */ `
const float SW_PERIOD = ${PERIOD.toFixed(1)}, SW_WATERLINE = ${WATERLINE};
const float SW_UP = ${UP}, SW_DOWN = ${DOWN};
const float SW_DRAIN = ${DRAIN.toFixed(1)}, SW_APPROACH = ${APPROACH.toFixed(1)}, SW_DRY = ${DRY}, SW_WAVES = ${WAVES.toFixed(1)};
float swPhase(vec2 c) {
  return fract(0.0016 * (c.x * 0.6 + c.y) + 0.14 * sin(c.x * 0.019 + 1.3) + 0.12 * sin(c.y * 0.015 + c.x * 0.007));
}
float swReach(float i, vec2 c) { return ${REACH_MIN.toFixed(1)} + ${REACH_VAR.toFixed(1)} * (0.5 + 0.5 * sin(mod(i, SW_WAVES) * 2.4 + c.x * 0.013 + c.y * 0.011)); }
float swFrontAt(float u, float reach) {
  if (u < SW_UP) { float k = 1.0 - u / SW_UP; return reach * (1.0 - k * k); }
  if (u < SW_DOWN) { float v = (u - SW_UP) / (SW_DOWN - SW_UP); return reach - (reach + SW_DRAIN) * v * v; }
  return -SW_APPROACH + SW_APPROACH * ((u - SW_DOWN) / (1.0 - SW_DOWN));
}
float swDrained(float s, float reach) { return SW_UP + (SW_DOWN - SW_UP) * sqrt(max(0.0, (reach - s) / (reach + SW_DRAIN))); }
/** (front, reach, u) */
vec3 swashFront(vec2 c, float t) {
  float cy = t / SW_PERIOD + swPhase(c), i = floor(cy), u = cy - i, reach = swReach(i, c);
  return vec3(swFrontAt(u, reach), reach, u);
}
float swashWet(float s, vec2 c, float t, vec3 fr) {
  if (s < 0.0) return 0.0;
  if (s < fr.x) return 1.0;
  float i = floor(t / SW_PERIOD + swPhase(c));
  float w = 0.0;
  if (s < fr.y && fr.z >= SW_UP) w = exp(-(fr.z - swDrained(s, fr.y)) * SW_PERIOD / SW_DRY);
  float prev = swReach(i - 1.0, c);
  if (s < prev) w = max(w, exp(-(fr.z + 1.0 - swDrained(s, prev)) * SW_PERIOD / SW_DRY));
  return min(1.0, w);
}
`;
