// The aquarium's tanks (docs/design.md "The museum"), pure: where each stands in the aquarium wing (plan.ts FISH_WING,
// model units), its glass box, the water a fish swims in, how big a fish is drawn in it, and its props on its sand.
// NH's three (species.ts tankOf): the great sea tank along the back wall, the deep-sea tank on the far wall (across
// from the opening, on its line), the river tank as an island in front; the sea's and the river's middles in one line,
// an aisle between them from the opening to the deep's glass, two benches in it facing the great tank, a plant in each
// corner. Each tank's long side is its swimmers' way (they keep mostly along it, as in NH's tanks).
import M from './models.json' with { type: 'json' };
import { reachOf } from './boids.ts';
import type { TankId } from './species.ts';

export interface Box { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }
export interface Tank {
  id: TankId;
  /** Its glass box (on the floor). */
  box: Box;
}

export const TANKS: readonly Tank[] = [
  { id: 'sea', box: { x0: 72, x1: 248, y0: 0, y1: 52, z0: -98, z1: -46 } },
  { id: 'deep', box: { x0: 256, x1: 296, y0: 0, y1: 48, z0: -30, z1: 58 } },
  { id: 'river', box: { x0: 110, x1: 210, y0: 0, y1: 24, z0: 30, z1: 66 } }
];

/** The water inside a tank's glass (its sand below, its surface a little under the rim). */
export function waterOf(t: Tank): Box {
  const b = t.box, glass = 1.2, sand = 4;
  return { x0: b.x0 + glass, x1: b.x1 - glass, y0: b.y0 + sand, y1: b.y1 - 2.5, z0: b.z0 + glass, z1: b.z1 - glass };
}
/** Whether a tank's long side runs along x (else z). */
export const alongX = (b: Box): boolean => b.x1 - b.x0 >= b.z1 - b.z0;

/** How much of its water's narrowest side (and its depth) a fish may reach across at most: the rest is its room to swim. */
const FIT = 0.8;
/** The least a fish is drawn long (model units): a little one scaled up to it (NH's tanks show the little ones big). */
const MIN_LEN = 6;
/** A fish's body as drawn in a tank: its scale, its model's box's half sizes (across, up, along) and its tail's sway
 *  (model units, at NH's own size), half its length drawn (a walker's spread, if longer), and its reach (reachOf, drawn). */
export interface Body { s: number; half: [number, number, number]; sway: number; r: number; reach: [number, number] }
/** How a fish of this model's box is drawn in a tank: NH's own size (a little one up to MIN_LEN long), a big one scaled
 *  down till all of it (any way it heads, pitched, its tail swaying: reachOf; a walker level, no sway) fits with room
 *  to turn. */
export function bodyIn(t: Tank, min: ArrayLike<number>, max: ArrayLike<number>, walker = false): Body {
  const w = waterOf(t);
  const half: [number, number, number] = [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2];
  const sway = walker ? 0 : half[2] * 2 * 0.06;
  const [h, v] = reachOf(half[0], half[1], half[2], sway, walker ? 0 : undefined);
  const across = Math.min(w.x1 - w.x0, w.z1 - w.z0), up = w.y1 - w.y0, long = Math.max(half[2], walker ? half[0] : 0);
  const s = Math.min(Math.max(1, MIN_LEN / (2 * long)), (FIT * across) / (2 * h), (FIT * up) / (2 * v));
  return { s, half, sway, r: long * s, reach: [h * s, v * s] };
}

/** The props in each tank: [model, where along its long side (0…1), where in from its back (0…1), scale]. */
const PROPS: Record<TankId, [string, number, number, number][]> = {
  sea: [['kelp-rocks', 0.14, 0.2, 0.55], ['coral', 0.4, 0.3, 0.8], ['kelp-rock', 0.66, 0.22, 0.6], ['coral-2', 0.88, 0.32, 0.8], ['diver', 0.52, 0.6, 0.5]],
  deep: [['deep-rocks', 0.2, 0.3, 1.1], ['deep-rocks', 0.75, 0.5, 0.9]],
  river: [['mossy-log', 0.18, 0.4, 0.6], ['river-rock', 0.5, 0.25, 0.9], ['water-plants', 0.8, 0.3, 0.4], ['driftwood-rock', 0.95, 0.6, 0.35]]
};
const MODELS = M.models as Record<string, { min: number[]; max: number[] }>;
export interface Placed { name: string; x: number; z: number; y: number; s: number; yaw: number }
/** A tank's props as drawn (engine.ts Kit.prop: the model's box's middle over (x, z), its foot on the sand, turned to
 *  face the front): each scaled down till it fits its water (height and width, a margin to the glass) and moved in
 *  from the glass as far as it must, so none pokes out. */
export function propsOf(t: Tank): Placed[] {
  const w = waterOf(t), along = alongX(t.box), m = 0.5;
  return PROPS[t.id].map(([name, u, v, s0]) => {
    const b = MODELS[name];
    const sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
    // (turned a quarter in a tank along z: its width then lies along z)
    const [ex, ez] = along ? [sx, sz] : [sz, sx];
    const s = Math.min(s0, (w.x1 - w.x0 - 2 * m) / ex, (w.z1 - w.z0 - 2 * m) / ez, (w.y1 - w.y0 - m) / sy);
    const hx = (ex * s) / 2 + m, hz = (ez * s) / 2 + m;
    const x0 = along ? w.x0 + (w.x1 - w.x0) * u : w.x1 - (w.x1 - w.x0) * v;
    const z0 = along ? w.z0 + (w.z1 - w.z0) * v : w.z0 + (w.z1 - w.z0) * u;
    return { name, x: Math.min(w.x1 - hx, Math.max(w.x0 + hx, x0)), z: Math.min(w.z1 - hz, Math.max(w.z0 + hz, z0)), y: w.y0, s, yaw: along ? 0 : -Math.PI / 2 };
  });
}
