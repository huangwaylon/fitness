// The aquarium's tanks (docs/design.md "The museum"), pure: where each stands in the aquarium (plan.ts FISH_WING,
// model units), its glass box, the water a fish swims in, how big a fish is drawn in it, and its props on its sand.
// NH's three (species.ts tankOf): the great sea tank across the back wall (the room's first sight from the hall's
// arch), the deep-sea tank along the left wall toward the front (clear of the arch: never between the camera and one
// coming in), the river tank low in the front corner (never hiding the great one); the benches face the great tank
// (seats.ts), the sea creatures' reef along the right wall and their tide pool in the middle (seaTanks.ts).
// Each tank's long side is its swimmers' way (they keep mostly along it, as in NH's tanks).
import M from './models.json' with { type: 'json' };
import { reachOf } from './boids.ts';
import type { TankId } from './species.ts';
import { frameOf } from './geometry.ts';

export interface Box { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }
export interface Tank {
  id: TankId;
  /** Its glass box (on the floor). */
  box: Box;
}

/** (Each one's top, its frame's too, well under the wing's ceiling (plan.ts WING_H, the first person's): the great
 *  tank's glass top was the ceiling's plane, the two fighting over it from below.) */
export const TANKS: readonly Tank[] = [
  { id: 'sea', box: { x0: 64, x1: 176, y0: 0, y1: 48, z0: -48, z1: -6 } },
  { id: 'deep', box: { x0: 64, x1: 94, y0: 0, y1: 26, z0: 64, z1: 144 } },
  { id: 'river', box: { x0: 120, x1: 176, y0: 0, y1: 24, z0: 120, z1: 146 } }
];

/** The water inside a tank's glass (its sand below, its surface a little under the rim). */
export function waterOf(t: Tank): Box {
  const b = t.box, glass = 1.2, sand = 4;
  return { x0: b.x0 + glass, x1: b.x1 - glass, y0: b.y0 + sand, y1: b.y1 - 2.5, z0: b.z0 + glass, z1: b.z1 - glass };
}
/** A tank's frame's half thickness (model units). */
const FRAME = 0.9;
/** A tank's static pieces (aquarium.ts draws them): its base (the sand, under its water, a little wider than the glass),
 *  its glass (open below: its floor the sand's top) and its frame (geometry.ts frameOf). */
export function piecesOf(t: Tank): { base: Box; glass: Box; frame: Box[] } {
  const b = t.box, w = waterOf(t);
  return {
    base: { x0: b.x0 - 0.5, x1: b.x1 + 0.5, y0: b.y0, y1: w.y0, z0: b.z0 - 0.5, z1: b.z1 + 0.5 },
    glass: { ...b, y0: w.y0 },
    frame: frameOf(b, b.y0, FRAME)
  };
}
/** Whether a tank's long side runs along x (else z). */
export const alongX = (b: Box): boolean => b.x1 - b.x0 >= b.z1 - b.z0;

/** How much of a tank's water, in from its back across its narrow side, is its props' (NH's: the rocks, kelp and logs
 *  along the back, the fish swimming in front of them). */
const BACK = 0.4;
/** The props' margin to the glass and to the open water (model units). */
const MARGIN = 0.5;
/** A tank's back strip: its props' (all of each inside it). */
export function backOf(t: Tank): Box {
  const w = waterOf(t), k = BACK;
  return alongX(t.box) ? { ...w, z1: w.z0 + (w.z1 - w.z0) * k } : { ...w, x0: w.x1 - (w.x1 - w.x0) * k };
}
/** A tank's open water, in front of its back strip (its swimmers' and walkers': all of each inside it, so none ever
 *  touches a prop). */
export function openOf(t: Tank): Box {
  const w = waterOf(t), b = backOf(t);
  return alongX(t.box) ? { ...w, z0: b.z1 + MARGIN } : { ...w, x1: b.x0 - MARGIN };
}

/** How much of its open water's narrowest side (and its depth) a fish may reach across at most: the rest is its room
 *  to swim, and its tank's six others' (0.8 with five a tank; seven of the biggest drawn 0.85 of that kept as far
 *  apart, a pair's bodies overlapping as rarely as five's did). */
export const FIT = 0.68;
/** The least a fish is drawn long (model units): a little one scaled up to it (NH's tanks show the little ones big). */
const MIN_LEN = 6;
/** NH's fish drawn this much bigger than its own size (a 6 px fish was a speck on a phone), a big one still fitted. */
const DRAWN = 1.3;
/** A fish's body as drawn in a tank: its scale, its model's box's half sizes (across, up, along) and its tail's sway
 *  (model units, at NH's own size), half its length drawn (a walker's spread, if longer), and its reach (reachOf, drawn). */
export interface Body { s: number; half: [number, number, number]; sway: number; r: number; reach: [number, number] }
/** How a fish of this model's box is drawn in a tank: NH's own size (a little one up to MIN_LEN long), a big one scaled
 *  down till all of it (any way it heads, pitched and banked, its tail swaying: reachOf; a walker level, no sway) fits its open
 *  water (openOf: clear of the props) with room to turn. */
export function bodyIn(t: Tank, min: ArrayLike<number>, max: ArrayLike<number>, walker = false): Body {
  const w = openOf(t);
  const half: [number, number, number] = [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2];
  const sway = walker ? 0 : half[2] * 2 * 0.06;
  const [h, v] = reachOf(half[0], half[1], half[2], sway, walker ? 0 : undefined, walker ? 0 : undefined);
  const across = Math.min(w.x1 - w.x0, w.z1 - w.z0), up = w.y1 - w.y0, long = Math.max(half[2], walker ? half[0] : 0);
  const s = Math.min(DRAWN * Math.max(1, MIN_LEN / (2 * long)), (FIT * across) / (2 * h), (FIT * up) / (2 * v));
  return { s, half, sway, r: long * s, reach: [h * s, v * s] };
}

/** The props in each tank: [model, where along its long side (0…1), where in its back strip from the glass (0…1),
 *  scale]. */
const PROPS: Record<TankId, [string, number, number, number][]> = {
  sea: [['kelp-rocks', 0.14, 0.2, 0.55], ['coral', 0.4, 0.3, 0.8], ['kelp-rock', 0.66, 0.22, 0.6], ['coral-2', 0.88, 0.32, 0.8]],
  deep: [['deep-rocks', 0.2, 0.3, 1.1], ['deep-rocks', 0.75, 0.5, 0.9]],
  river: [['mossy-log', 0.18, 0.4, 0.6], ['river-rock', 0.5, 0.25, 0.9], ['water-plants', 0.8, 0.3, 0.4], ['driftwood-rock', 0.95, 0.6, 0.35]]
};
const MODELS = M.models as Record<string, { min: number[]; max: number[] }>;
export interface Placed { name: string; x: number; z: number; y: number; s: number; yaw: number }
/** A tank's props as drawn (engine.ts Kit.prop: the model's box's middle over (x, z), its foot on the sand, turned to
 *  face the front): each scaled down till it fits its back strip (backOf: height and width, a margin to the glass and
 *  to the open water) and moved in as far as it must, so none pokes out of the glass or into the fish's water. */
export function propsOf(t: Tank): Placed[] {
  const w = backOf(t), along = alongX(t.box), m = MARGIN;
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

/** The aquarium's plants in its free corners ([model, x, z, scale]: aquarium.ts; the walk keeps 5 off each). */
export const FISH_PLANTS: readonly [string, number, number, number][] = [['heliconia', 106, 140, 1.8]];
