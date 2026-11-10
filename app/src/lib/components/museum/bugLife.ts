// How the bug wing's bugs live (docs/design.md "The museum", "How the bugs move"), pure: the garden's ground and what
// stands on it (garden.ts draws it), where each kind keeps (its enclosure: a box of air over the flowers or the pond,
// a patch of grass or soil, a trunk's bark, a bush's top, the pond's surface, its glass case) and its moves there by
// the island's own motion (island/critterPath.ts bugLegs and bugAt: NH's paces, meanders, landings, hops, crawls and
// rests; world3d/wings.ts wingBeat), its itinerary drawn a minute at a time from its seed and played on from where
// the last one ended. A bug is kept to its enclosure shrunk by its own size (its wings' reach up included), so it
// never meets a prop, the glass or the ground (bugLife.test.ts).
import { mulberry32, smallHash } from '#lib/random.ts';
import { BUGS, type BugId, type Flight, type Patch } from '../island/critters.ts';
import { BOB, FLY_UPS, PACE, bugAt, bugLegs, type Flying, type Leg, type P3, type Ways } from '../island/critterPath.ts';
import { turn } from '../island/glide.ts';
import { FLAPS, wingBeat, type Beat } from '../world3d/wings.ts';
import W3D from '../world3d/models.json' with { type: 'json' };
import M from './models.json' with { type: 'json' };
import type { Habitat } from './species.ts';
import { BUG_WING, type Pt, type Rect } from './plan.ts';
import { clamp } from '#lib/math.ts';

/** A bug is drawn this much bigger than NH's own (the island's way: a butterfly a hand across). */
export const BUG_S = 1.9;

// ---------- the garden (the bug wing's model units; laid out from its back-left corner, u across, v toward the front) ----------
//   v   0-18   four glass cases along the back wall
//      18-52   the two oaks (the room's hero, framed from the hall's arch), a row of flowers between them
//      52-68   the stone path in from the hall's arch (the right wall) across the room
//      68-200  a path down the middle; left of it a row of flowers, the pond, hydrangeas, cacti, the fallen log and
//              ferns; right of it the rest of the flowers, the flower bed, the bushes, the palm and the fifth case

const GX = BUG_WING.x0, GZ = BUG_WING.z0;
const at = (u: number, v: number): Pt => [GX + u, GZ + v];
const rect = (u0: number, u1: number, v0: number, v1: number): Rect => ({ x0: GX + u0, x1: GX + u1, z0: GZ + v0, z1: GZ + v1 });
/** The stone paths (the long one in two, either side of the cross one: no two pieces overlap). */
export const PATHS: Rect[] = [rect(4, 120, 52, 68), rect(54, 66, 68, 196)];
export const POND: Rect = rect(6, 46, 100, 138);
/** The pond's water level. */
export const POND_Y = 0.6;
export const OAKS: Pt[] = [at(20, 30), at(100, 30)];
export const PALM: Pt = at(90, 166);
export const OAK_S = 1.4, PALM_S = 1.3;
/** The display cases (their middles; each 26 × 14, on a stand): four along the back wall, one in the front corner. */
export const CASES: Pt[] = [at(15, 9), at(44, 9), at(76, 9), at(105, 9), at(105, 189)];
export const CASE = { w: 26, d: 14, stand: 9, h: 15 };
/** A case's agave (off its middle, on its soil) and its scale. */
export const CASE_AGAVE = { dx: -7, dz: -2, s: 0.45 };
/** The flower clumps (NH's own, the island's: a tile each) the flower bugs sit on and the fliers land on: a row along the
 *  path's front (the long row), a row between the oaks (the oak's row), one more by the long row. */
export const FLOWERS: [string, number, number][] = (
  [
    ['flowers/red-tulips', 12, 78], ['flowers/yellow-pansies', 24, 81], ['flowers/pink-cosmos', 36, 78], ['flowers/white-lilies', 48, 81],
    ['flowers/purple-hyacinths', 76, 78], ['flowers/orange-cosmos', 88, 81], ['flowers/pink-tulips', 44, 47], ['flowers/blue-pansies', 52, 45],
    ['flowers/orange-lilies', 60, 47], ['flowers/pink-roses', 68, 45], ['flowers/purple-pansies', 76, 47], ['flowers/orange-roses', 100, 79]
  ] as const
).map(([name, u, v]) => [name, ...at(u, v)]);
/** A flower's top (its blooms, NH's flowers' height) and half its spread. */
const FLOWER_TOP = 6.7, FLOWER_HALF = 5;
/** The garden's props: [model, x, z, scale, yaw]. */
export const PROPS: [string, number, number, number, number][] = (
  [['flower-bed', 92, 112, 1, 0], ['bushes', 106, 150, 0.4, 0], ['hydrangeas', 15, 158, 0.8, 0], ['autumn-log', 36, 184, 0.9, 0], ['logs-ferns', 12, 186, 1, 0]] as const
).map(([name, u, v, s, yaw]) => [name, ...at(u, v), s, yaw]);
/** The soil patches drawn on the grass ([x, z], radius): the ground crawlers keep to them (GROUND). */
export const SOIL: [number, number, number][] = ([[40, 162, 9], [112, 82, 7], [8, 23, 7]] as const).map(([u, v, r]) => [...at(u, v), r]);

/** A solid of the garden (world, a box): a prop, a trunk, a canopy, a flower, a case. */
export interface Solid { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; what: string }
const PROP_BOUNDS = (M as unknown as { models: Record<string, { min: number[]; max: number[] }> }).models;
const TREE_BOUNDS = (W3D as unknown as { models: Record<string, { min: number[]; max: number[] }> }).models;
/** A model's box as placed (its middle over x, z, its foot at y, turned by yaw: the turned box's bounds). */
function placed(what: string, b: { min: number[]; max: number[] }, x: number, z: number, s: number, yaw: number, y = 0): Solid {
  const hx = ((b.max[0] - b.min[0]) * s) / 2, hz = ((b.max[2] - b.min[2]) * s) / 2, c = Math.abs(Math.cos(yaw)), n = Math.abs(Math.sin(yaw));
  const ax = c * hx + n * hz, az = n * hx + c * hz;
  return { what, x0: x - ax, x1: x + ax, z0: z - az, z1: z + az, y0: y, y1: y + (b.max[1] - b.min[1]) * s };
}

/** A tree's trunk the perchers keep to (its bark round its middle, r out; y0 … y1 of it bare under the leaves). */
interface Trunk { x: number; z: number; r: number; y0: number; y1: number; h: number }
const OAK_H = TREE_BOUNDS['oak-summer'].max[1] * OAK_S, PALM_H = TREE_BOUNDS.palm.max[1] * PALM_S;
const TRUNKS: Trunk[] = [
  ...OAKS.map(([x, z]) => ({ x, z, r: 2.4 * OAK_S, y0: OAK_H * 0.06, y1: OAK_H * 0.42, h: OAK_H })),
  { x: PALM[0], z: PALM[1], r: 1.6 * PALM_S, y0: 12.5, y1: PALM_H * 0.5, h: PALM_H }
];

/** Everything that stands in the garden (the props, the trunks and canopies, the flowers, the cases). */
export const SOLIDS: readonly Solid[] = [
  ...PROPS.map(([name, x, z, s, yaw]) => placed(name, PROP_BOUNDS[name], x, z, s, yaw)),
  ...TRUNKS.map((t, i) => ({ what: `trunk-${i}`, x0: t.x - t.r, x1: t.x + t.r, z0: t.z - t.r, z1: t.z + t.r, y0: 0, y1: t.h * 0.6 })),
  // the canopies, from the bare trunk's top (an oak's leaves are its model's width across; a palm's fronds high)
  ...OAKS.map(([x, z], i) => ({ what: `canopy-${i}`, x0: x - 13.7 * OAK_S, x1: x + 13.7 * OAK_S, z0: z - 9 * OAK_S, z1: z + 9 * OAK_S, y0: OAK_H * 0.42, y1: OAK_H })),
  { what: 'canopy-2', x0: PALM[0] - 20 * PALM_S, x1: PALM[0] + 20 * PALM_S, z0: PALM[1] - 14 * PALM_S, z1: PALM[1] + 14 * PALM_S, y0: PALM_H * 0.55, y1: PALM_H },
  ...FLOWERS.map(([, x, z]) => ({ what: 'flower', x0: x - FLOWER_HALF, x1: x + FLOWER_HALF, z0: z - FLOWER_HALF, z1: z + FLOWER_HALF, y0: 0, y1: FLOWER_TOP })),
  ...CASES.map(([x, z], i) => ({ what: `case-${i}`, x0: x - CASE.w / 2, x1: x + CASE.w / 2, z0: z - CASE.d / 2, z1: z + CASE.d / 2, y0: 0, y1: CASE.stand + CASE.h })),
  ...CASES.map(([x, z], i) => placed(`case-${i}-agave`, PROP_BOUNDS.agave, x + CASE_AGAVE.dx, z + CASE_AGAVE.dz, CASE_AGAVE.s, 0, CASE.stand + 2)),
  { what: 'pond', x0: POND.x0 - 3, x1: POND.x1 + 3, z0: POND.z0 - 3, z1: POND.z1 + 3, y0: 0, y1: POND_Y }
];
const solid = (what: string) => SOLIDS.find((s) => s.what === what)!;

// ---------- where each kind keeps (each a box clear of every solid but what it's on) ----------

const box = (x0: number, x1: number, z0: number, z1: number, l0: number, l1 = l0): Patch => ({ x0, x1, z0, z1, l0, l1 });
/** A box from the garden's corner (u, v as the plan above). */
const lbox = (u0: number, u1: number, v0: number, v1: number, l0: number, l1 = l0): Patch => box(GX + u0, GX + u1, GZ + v0, GZ + v1, l0, l1);
/** The fliers' air: over the long row of flowers, over the row by the oak, over the flower bed (its flowers 17 high). */
const AIR: Patch[] = [lbox(6, 106, 70, 87, 12, 24), lbox(40, 80, 34, 50, 12, 24), lbox(62, 100, 94, 130, 24, 30)];
/** Over the pond (its water, inside its bank). */
const POND_AIR = box(POND.x0, POND.x1, POND.z0, POND.z1, 10, 22);
const POND_LOW = box(POND.x0, POND.x1, POND.z0, POND.z1, 4, 16);
/** The grass the hoppers keep to, between the beds, the paths and the props. */
const GRASS: Patch[] = [lbox(32, 52, 147, 155, 0), lbox(68, 88, 134, 166, 0), lbox(40, 80, 17, 32, 0)];
/** The soil by the log, by the long row's end and in the far corner under the first oak: the ground crawlers'. */
const GROUND: Patch[] = [lbox(28, 52, 160, 167, 0), lbox(106, 118, 72, 92, 0), lbox(2, 14, 18, 28, 0)];
/** The bushes' tops (the leaf crawlers': the snail, the walking leaf). */
const LEAVES: { on: string; at: Patch }[] = [{ on: 'bushes', at: lbox(100, 112, 146, 154, 0) }, { on: 'hydrangeas', at: lbox(9, 21, 154, 162, 0) }];
for (const l of LEAVES) l.at.l0 = l.at.l1 = solid(l.on).y1 - 0.6;
/** The row by the oak's flower heads (the stink bugs amble over them). */
const ROW = lbox(42, 78, 44, 48, FLOWER_TOP);
/** The flower bed's blooms (its top) the fliers over it land on. */
const BED_HEADS: P3[] = [[78, 104], [88, 112], [82, 120], [94, 100], [92, 124]].map(([u, v]) => ({ x: GX + u, z: GZ + v, lift: solid('flower-bed').y1 }));
/** How far a bug on its bark turns from heading straight up or down it (rad). */
const TILT = 0.5;
/** How far out from a flower a flier comes down to land on it (u past its own reach). */
const DOWN = 6;
/** A half of the pond (`i` 0 the west, 1 the east): two bugs over it or on it, one each, never meet. */
const half = (a: Patch, i: number): Patch => {
  const mid = (a.x0 + a.x1) / 2;
  return i % 2 ? { ...a, x0: mid } : { ...a, x1: mid };
};
/** The flowers a ladybug or a mantis sits on (FLOWERS' indices: clear of the props round them, a flower apart). */
const SITS = [0, 2, 4, 6, 10];
/** The spots a box over the garden takes: the sitting flowers under it (a flier lands there), the stink bugs' row. */
const under = (a: Patch): string[] => [
  ...SITS.filter((f) => {
    const [, x, z] = FLOWERS[f];
    return x + FLOWER_HALF > a.x0 && x - FLOWER_HALF < a.x1 && z + FLOWER_HALF > a.z0 && z - FLOWER_HALF < a.z1;
  }).map((f) => `fl${f}`),
  ...(ROW.x1 > a.x0 && ROW.x0 < a.x1 && ROW.z1 > a.z0 && ROW.z0 < a.z1 ? ['row'] : [])
];
/** A case's floor clear of its agave (its soil's top). */
const caseFloor = ([x, z]: Pt): Patch => box(x - 3.2, x + CASE.w / 2 - 0.8, z - CASE.d / 2 + 0.8, z + CASE.d / 2 - 0.8, CASE.stand + 2);

// ---------- the places: one bug on show each ----------

/** A place one bug on show keeps to: its habitat's `i`-th enclosure (bugLife's `slot`) and the garden's spots it takes
 *  (an air box, a flower, a half of the pond, a patch, a case, a trunk). No two bugs on show take one spot (bugShow.ts),
 *  so none stacks on another or comes into its room: a flier's air takes the flowers it lands on, the stink bugs' row
 *  its flowers. */
export interface Slot { i: number; takes: readonly string[] }
const each = (n: number, k: string): Slot[] => Array.from({ length: n }, (_, i) => ({ i, takes: [`${k}${i}`] }));
/** The places a bug of `id` in `hab` may keep to, in the order they're taken. */
export function slotsOf(id: string, hab: Habitat): readonly Slot[] {
  switch (hab) {
    case 'fly': return AIR.map((a, i) => ({ i, takes: [`air${i}`, ...under(a)] }));
    case 'flower': return BUGS[id as BugId]?.flight === 'crawl' ? [{ i: 0, takes: under(ROW) }] : SITS.map((f, i) => ({ i, takes: [`fl${f}`] }));
    // (a dragonfly and the firefly share the pond's air: a half each)
    case 'dart': case 'drift': return each(2, 'pond');
    case 'water': return each(2, 'water');
    // (the patch by the log's soil the log's crawlers' too)
    case 'hop': return GRASS.map((_, i) => ({ i, takes: [`grass${i}`, ...(i === 0 ? ['soil0'] : [])] }));
    // (the spider, a big one, and the dung beetle, wider still, its wings out, only on the log's big patch: on a little
    // one they would hardly move)
    case 'ground': return each(GROUND.length, 'soil').filter((s) => s.i === 0 || (id !== 'dung-beetle' && id !== 'spider'));
    case 'leaf': return each(LEAVES.length, 'leaf');
    case 'terrarium': return each(CASES.length, 'case');
    case 'trunk': return each(OAKS.length, 'oak');
    case 'palm': return each(1, 'palm');
    case 'dangle': return each(OAKS.length, 'branch');
  }
}

// ---------- a bug's life ----------

/** A bug's own seed (by its id: the same each visit). */
export const bugSeed: (id: string) => number = smallHash;

/** A bug's size as drawn (its model's box × BUG_S): across (x), along (z), its height. */
export interface Size { w: number; l: number; h: number }

/** Where a bug is this frame: its foot (x, y, z), its head's way (f) and its back's (u), its wings' angle, and whether
 *  it's sat (on a flower, its trunk, resting). */
export interface Pose {
  x: number; y: number; z: number;
  fx: number; fy: number; fz: number;
  ux: number; uy: number; uz: number;
  flap: number;
  sat: boolean;
}
export const pose = (): Pose => ({ x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 1, ux: 0, uy: 1, uz: 0, flap: 0, sat: false });

export interface Life {
  /** Where it keeps (its enclosure: its patch, in its own space for a trunk's bark), and what it's on (a solid's). */
  readonly area: Patch;
  readonly on: readonly string[];
  /** All the room it takes, in the world (x, y, z, radius): the camera culls by it (off screen it rests). */
  readonly sphere: readonly [number, number, number, number];
  /** It at `ms` (the museum's clock), `dt` ms after the last frame: into `out`. */
  at(ms: number, dt: number, out: Pose): Pose;
}

/** An itinerary's length (ms): a new one drawn from where the last ended. */
const CHUNK_MS = 60_000;
/** A flier's bob's reach (critterPath's BOB): kept clear of its enclosure's floor and ceiling. */
const bobOf = (f: Flight): number => BOB[f]?.[0] ?? 0;
/** NH's museum: its butterflies and moths both land on the flowers (the island's moths keep to the lamps). */
const LANDS = /butterfly|birdwing|bluebottle|emperor|moth/;
const CICADA = /cicada/;

/** A shrunk patch: its sides in by `r`, its ceiling down by `top` (never past its middle). */
function inset(a: Patch, r: number, top: number): Patch {
  const cx = (a.x0 + a.x1) / 2, cz = (a.z0 + a.z1) / 2;
  return { x0: Math.min(cx, a.x0 + r), x1: Math.max(cx, a.x1 - r), z0: Math.min(cz, a.z0 + r), z1: Math.max(cz, a.z1 - r), l0: a.l0, l1: Math.max(a.l0, a.l1 - top) };
}

/**
 * A bug's life in the garden: `id` in `hab`, in the `slot`-th of its habitat's places (slotsOf: which air, flower,
 * half of the pond, patch, case or trunk), from
 * `seed`, `size` as drawn. Its moves are the island's (bugLegs, bugAt), kept to its enclosure, played a minute at a
 * time; its head turns the way it goes (smoothly), its wings beat as the island's do.
 */
export function bugLife(id: string, hab: Habitat, slot: number, seed: number, size: Size): Life {
  const bug = BUGS[id as BugId];
  // (its reach out from its middle, turned any way)
  const r = Math.hypot(size.w, size.l) / 2;
  const fly = hab === 'fly' || hab === 'dart' || hab === 'drift';
  // (a flier's wings beat up past its back by half its span)
  const reach = fly ? size.h + size.w * 0.5 : size.h;
  let flight: Flight = bug?.flight ?? 'crawl';
  let area: Patch, on: string[] = [];
  let ways: Ways = { ok: () => true, pace: null, land: null, crawl: PACE[id as BugId] ?? [12, 1600, 2600] };
  /** On a trunk: its bark's space (x up the trunk, z round it, lift out of it). */
  let trunk: Trunk | null = null, around = 0;
  switch (hab) {
    case 'fly': {
      const air = AIR[slot % AIR.length], bob = bobOf('flutter');
      area = inset(air, r, reach + bob);
      area.l0 += bob;
      flight = 'flutter';
      // (a flower it can come down on with no wing in a prop, nor one under its way down: the cacti by the long row)
      const clear = (h: P3) => !SOLIDS.some((s) => {
        const m = r + (s.y1 < air.l0 ? DOWN : 0);
        return s.what !== 'flower' && s.what !== 'flower-bed' && h.x - m < s.x1 && h.x + m > s.x0 && h.z - m < s.z1 && h.z + m > s.z0 && h.lift < s.y1 && h.lift + reach + 1 > s.y0;
      });
      const heads = [...FLOWERS.map(([, x, z]) => ({ x, z, lift: FLOWER_TOP })), ...BED_HEADS].filter(clear);
      ways = {
        ...ways, pace: id === 'honeybee' ? FLY_UPS.bee : FLY_UPS.flutter,
        // a bee buzzes from flower to flower, a moment over each; a butterfly or a moth lands for a while
        land: id === 'honeybee' ? { heads, over: 3, rest: [600, 1400] } : LANDS.test(id) ? { heads, over: 0.3, rest: [2500, 5000] } : null
      };
      break;
    }
    case 'dart': case 'drift': {
      const bob = bobOf(hab);
      area = inset(half(hab === 'dart' ? POND_AIR : POND_LOW, slot), r + 1, reach + bob);
      area.l0 += bob;
      flight = hab;
      ways = { ...ways, pace: FLY_UPS[hab] };
      break;
    }
    case 'hop':
      area = inset(GRASS[slot % GRASS.length], r, 0);
      flight = 'hop';
      break;
    case 'ground': {
      area = inset(GROUND[slot % GROUND.length], r, 0);
      flight = 'crawl';
      break;
    }
    case 'leaf': {
      const l = LEAVES[slot % LEAVES.length];
      area = inset(l.at, r * 0.3, 0);
      on = [l.on];
      flight = 'crawl';
      break;
    }
    case 'water': {
      // the pondskater on the water, the diving beetle and the giant water bug down in it a little (it dips under)
      const dive = id === 'pondskater' ? 0 : size.h * (id === 'diving-beetle' ? 0.8 : 0.4);
      area = inset(half(box(POND.x0, POND.x1, POND.z0, POND.z1, POND_Y - dive, POND_Y - dive * 0.3), slot), r + 0.5, 0);
      on = ['pond'];
      flight = 'crawl';
      if (id === 'diving-beetle') ways = { ...ways, rest: [600, 2400] };
      break;
    }
    case 'terrarium': {
      const i = slot % CASES.length;
      area = inset(caseFloor(CASES[i]), r, 0);
      on = [`case-${i}`];
      flight = 'crawl';
      // (the mole cricket digs about; the tarantula and the scorpion stalk, still a long while)
      if (bug?.flight === 'stalk') ways = { ...ways, rest: [2500, 6000] };
      break;
    }
    case 'flower': {
      if (bug?.flight === 'crawl') {
        area = inset(ROW, 0, 0);
        on = ['flower'];
        break;
      }
      // a ladybug, a mantis on a bloom of its own, turning there now and then
      const [, x, z] = FLOWERS[SITS[slot % SITS.length]];
      area = box(x, x, z, z, FLOWER_TOP);
      on = ['flower'];
      flight = 'flower';
      break;
    }
    case 'trunk': case 'palm': {
      // its bark: up the trunk (x), round it (z, from its own side), out of it (lift)
      // (one bug a trunk: slotsOf's two oaks, the palm)
      trunk = TRUNKS[hab === 'palm' ? OAKS.length : slot % OAKS.length];
      // (on the camera's side of its trunk, each its own way round)
      const way = ((seed % 7) * 0.1) % 1;
      around = hab === 'palm' ? -0.9 - way * 0.8 : (way - 0.5) * 3.2;
      const arc = trunk.r * (hab === 'palm' ? 0.4 : 0.9);
      // (its head kept within TILT of up or down: its reach up and down the bark)
      const e = size.l / 2 + (size.w / 2) * Math.sin(TILT);
      area = inset(box(trunk.y0, trunk.y1, -arc, arc, 0), 0, 0);
      area.x0 = Math.min((trunk.y0 + trunk.y1) / 2, trunk.y0 + e);
      area.x1 = Math.max((trunk.y0 + trunk.y1) / 2, trunk.y1 - e);
      on = [`trunk-${TRUNKS.indexOf(trunk)}`];
      flight = 'crawl';
      // a cicada clings, now and then shuffling; a beetle crawls slowly and now and then flies a short hop
      ways = CICADA.test(id) ? { ...ways, crawl: [3, 1400, 2200], rest: [5000, 11000] }
        : id === 'walking-stick' ? { ...ways, crawl: [4, 3000, 4200], rest: [3000, 7000] }
        : { ...ways, crawl: [7, 1800, 2800], rest: [1500, 4500], flits: hab === 'palm' ? 0 : 0.12 };
      break;
    }
    default: {
      // dangle: on its thread from an oak's branch, bobbing
      // (one bug a branch: slotsOf's two oaks)
      const o = OAKS[slot % OAKS.length];
      area = box(o[0] + 10, o[0] + 10, o[1] + 6, o[1] + 6, 24);
      on = [`canopy-${slot % OAKS.length}`];
      flight = 'dangle';
    }
  }
  const still = flight === 'flower' || flight === 'dangle' || id === 'cicada-shell';
  const rand = mulberry32(seed >>> 0);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const spot: P3 = { x: between(area.x0, area.x1), z: between(area.z0, area.z1), lift: between(area.l0, area.l1) };
  // its itinerary now: from t0 (the museum's clock), and where it set off
  let legs: Leg[] = [], start: P3 = spot, t0 = -1, end = 0, k = 0;
  const draw = (from: P3, at: number) => {
    start = from;
    t0 = at;
    k = 0;
    legs = still ? [] : bugLegs(flight, ways, rand, from, from, area, CHUNK_MS);
    const last = legs[legs.length - 1];
    end = Math.max(CHUNK_MS, last ? last.t + last.ms : 0);
  };
  const fl: Flying = { x: 0, z: 0, lift: 0, vx: 0, vz: 0 };
  const beat: Beat = { ph: seed % 7, flap: 0 };
  const buzz = id === 'honeybee' || hab === 'dart';
  const flaps = FLAPS.test(`critters/bugs/${id}`);
  // (on its bark head up; in its case along it)
  let yaw = trunk ? 0 : hab === 'terrarium' ? Math.PI / 2 : (seed % 628) / 100, rest = yaw;
  const stalks = bug?.flight === 'stalk';
  // (its floor: its air's, coming down to a flower's top only by one it lands on)
  const floor = area.l0 - bobOf(flight), hi = area.l1 + bobOf(flight), heads = ways.land?.heads ?? [];
  const lo = (x: number, z: number) => {
    let d = Infinity, top = floor;
    for (const h of heads) {
      const e = Math.hypot(h.x - x, h.z - z);
      if (e < d) (d = e), (top = h.lift);
    }
    const k = clamp((r + DOWN - d) / DOWN, 0, 1);
    return floor - (floor - top - 0.3) * k * k * (3 - 2 * k);
  };
  // (its room: its area and its own reach round it, a hop's or a bob's arc above; on a trunk, round the trunk)
  const span = Math.hypot(area.x1 - area.x0, area.z1 - area.z0, area.l1 - area.l0) / 2 + r + reach + 10;
  const sphere: [number, number, number, number] = trunk
    ? [trunk.x, (area.x0 + area.x1) / 2, trunk.z, trunk.r + span]
    : [(area.x0 + area.x1) / 2, (area.l0 + area.l1) / 2, (area.z0 + area.z1) / 2, span];
  return {
    area, on, sphere,
    at(ms, dt, out) {
      if (t0 < 0) draw(spot, ms);
      // past this itinerary's end: the next from where it ended (long after, as though it had gone on)
      if (ms - t0 >= end) {
        const at = bugAt(flight, legs, start, end, fl);
        draw({ x: at.x, z: at.z, lift: legs.length ? legs[legs.length - 1].lift : start.lift }, ms - t0 >= end + CHUNK_MS ? ms : t0 + end);
      }
      const local = ms - t0;
      const p = bugAt(flight, legs, start, local, fl);
      // (the curve between two points can bow past them: kept in)
      const x = clamp(p.x, area.x0, area.x1), z = clamp(p.z, area.z0, area.z1), lift = clamp(p.lift, heads.length ? lo(x, z) : floor, hi);
      while (k + 1 < legs.length && legs[k + 1].t <= local) k++;
      const leg = legs[k];
      const resting = !leg || local < leg.t || local >= leg.t + leg.ms;
      out.sat = resting && (!leg || !!leg.sat || !fly);
      const ups = Math.hypot(p.vx, p.vz) * 1000;
      if (flight === 'flower') {
        // turning on its bloom now and then
        const want = (seed % 6) + Math.floor(ms / 4000 + (seed % 3)) * 1.2;
        yaw = turn(yaw, want, dt, 400);
      } else if (ups > 4) {
        // (on its bark its head kept up within TILT: it backs down)
        yaw = trunk ? turn(yaw, clamp(Math.atan2(p.vz, Math.abs(p.vx)), -TILT, TILT), dt, 300) : turn(yaw, Math.atan2(p.vx, p.vz), dt, 90);
        rest = yaw;
      } else if (stalks && out.sat) yaw = turn(yaw, rest + Math.sin(ms / 5000 + seed) * 0.5, dt, 900); // (a stalker turns about, watching)
      if (trunk) {
        // on its bark: up it is its x, round it its z; its back out from it, its head the way it crawls (up at rest)
        const a = around + z / trunk.r, nx = Math.sin(a), nz = Math.cos(a);
        // a cicada sings in bouts, shivering
        const sing = CICADA.test(id) && id !== 'cicada-shell' && Math.floor(ms / 3500 + (seed % 5)) % 3 === 0 ? Math.sin(ms * 0.9) * 0.15 : 0;
        const out0 = trunk.r + lift + sing;
        out.x = trunk.x + nx * out0;
        out.z = trunk.z + nz * out0;
        out.y = x;
        out.ux = nx;
        out.uy = 0;
        out.uz = nz;
        // (its heading in the bark's plane: 0 up, ± round)
        const c = Math.cos(yaw), s = Math.sin(yaw);
        out.fx = nz * s;
        out.fy = c;
        out.fz = -nx * s;
      } else {
        out.x = x;
        out.z = z;
        out.y = flight === 'dangle' ? lift + Math.sin(ms / 1100 + seed) * 3 : lift;
        out.ux = 0;
        out.uy = 1;
        out.uz = 0;
        const h = id === 'hermit-crab' ? yaw + Math.PI / 2 : flight === 'dangle' ? ms / 2500 + seed : yaw;
        out.fx = Math.sin(h);
        out.fy = 0;
        out.fz = Math.cos(h);
      }
      if (flaps) wingBeat(beat, dt, buzz, out.sat && !buzz, ups);
      out.flap = flaps ? beat.flap : 0;
      return out;
    }
  };
}
