// Where the island's critters are, the same on both phones (docs/backend.md#shared-world, "Critters"): a spawn of
// ambient life (ambient.ts: its kind, slot, stay and seed) is placed in the world and walked through its stay from its
// seed alone, never from a phone's camera: which fresh water a shadow is in, its swim patch and every waypoint, a bug's
// spot (a trunk, a flower, a lamp, a patch of grass) and each of its hops, darts, rests and landings, each at a time
// after it came. A phone shows what of that its camera sees (the projector hides the rest) and plays the itinerary from
// wherever in it the clock is (a phone opening mid-stay finds the shadow where the other phone shows it). Interaction
// (a cast, a startle, a net) bends it on the phone that taps; the outcome is shared as a `catch` by the critter's id.
// Pure: no DOM, no clock; integer-free but engine-proof (mulberry32 draws only, no Math.hypot in the choices).
import { mulberry32, pickOne } from '#lib/random.ts';
import type { Spawn } from './ambient.ts';
import {
  BUGS, FRESH, SEA_SWIM, bugPlace, freshAreas, patches, perches, swimAt, waterAt,
  type BugId, type BugPlace, type Flight, type Patch, type Swim, type Water
} from './critters.ts';
import { FLOWERS, surfaceAt, type FreshWhere } from './world.ts';
import { FLOWER_U } from './scene.ts';

/** A critter's shared id: its kind and the slot it came in (one a channel at a time, so unique for the day). */
export const critterId = (s: Spawn): string => (s.water ? `${s.kind}:${s.water}:${s.slot}` : `${s.kind}:${s.slot}`);

/** A seeded stream of one spawn for one purpose (`salt`): the species pickers keep `spawnRand`'s own. */
const subRand = (seed: number, salt: number): (() => number) => mulberry32((seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0);

const between = (r: () => number, a: number, b: number) => a + r() * (b - a);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const dist = (ax: number, az: number, bx: number, bz: number) => Math.sqrt((ax - bx) ** 2 + (az - bz) ** 2);

/** A world point and its height above the ground. */
export interface P3 { x: number; z: number; lift: number }

/** One step of an itinerary: it sets off at `t` (ms after the critter came) for (x, z, lift), getting there in `ms`;
 *  `sat` it sits there (a cicada on its trunk, a butterfly on a flower), `hop` a hop, not a glide. */
export interface Leg extends P3 {
  t: number;
  ms: number;
  sat?: boolean;
  hop?: boolean;
}

// ---------- fish ----------

/** The fresh water a fresh-water spawn swims in (the pond, the river, the mouth, the clifftop): its channel's. */
export const freshWater = (s: Spawn): FreshWhere => s.water ?? FRESH[Math.floor(subRand(s.seed, 1)() * FRESH.length) % FRESH.length];

/** In that water, clear of its edge. */
export const inWater = (water: Water, x: number, z: number): boolean =>
  water === 'sea' ? z <= -14 && surfaceAt(x, z) === 'sea' : waterAt(x, z, false, -4) === water;

const swimPoint = (a: Swim, water: Water, r: () => number): { x: number; z: number } => {
  for (let i = 0; i < 40; i++) {
    const p = swimAt(a, between(r, -1, 1), between(r, -1, 1));
    if (inWater(water, p.x, p.z)) return p;
  }
  return { x: a.cx, z: a.cz };
};

export interface FishPath {
  area: Swim;
  /** Where it first shows (its node's anchor). */
  start: { x: number; z: number };
  legs: Leg[];
}

/** A shadow's stay in `water` from its seed: its patch, where it shows, and its slow wander to new spots in the patch
 *  (NH shadows dawdle: 2.5–6 s a glide, 0.6–2.2 s between), through `stayMs`. */
export function fishPath(seed: number, water: Water, stayMs: number): FishPath | null {
  const r = subRand(seed, 2);
  const areas = water === 'sea' ? [SEA_SWIM] : freshAreas(water);
  if (!areas.length) return null; // (no such water on this island)
  const area = areas[Math.floor(r() * areas.length) % areas.length];
  const start = swimPoint(area, water, r);
  const legs: Leg[] = [];
  let at = start, t = 400;
  while (t < stayMs) {
    const p = swimPoint(area, water, r);
    const ms = Math.round(clamp(dist(p.x, p.z, at.x, at.z) * (water === 'sea' ? 110 : 160), 2500, 6000));
    legs.push({ ...p, lift: 0, t, ms });
    t += ms + Math.round(between(r, 600, 2200));
    at = p;
  }
  return { area, start, legs };
}

/** Where a sea creature's bubbles rise (the sea in front of the beach). */
export const bubblesAt = (seed: number): { x: number; z: number } => swimPoint(SEA_SWIM, 'sea', subRand(seed, 4));

/** The leg under way `ms` after the critter came (−1: before the first), and where it is then (mid-glide included). */
export function legAt(legs: readonly Leg[], start: P3, ms: number): { k: number; at: P3 } {
  let k = -1;
  for (let i = 0; i < legs.length && legs[i].t <= ms; i++) k = i;
  if (k < 0) return { k, at: start };
  const to = legs[k], from = k ? legs[k - 1] : start;
  const f = to.ms ? clamp((ms - to.t) / to.ms, 0, 1) : 1;
  return { k, at: { x: from.x + (to.x - from.x) * f, z: from.z + (to.z - from.z) * f, lift: from.lift + (to.lift - from.lift) * f } };
}

// ---------- bugs ----------

/** Bugs that don't fly in: a cicada's shell, a walking stick (they're on their trunk already). */
export const STILL = new Set<BugId>(['cicada-shell', 'walking-stick']);
/** NH's butterflies that land on flowers now and then (the moths, the bee and the mosquito keep flying). */
const LANDS = (id: BugId): boolean => /butterfly|birdwing|bluebottle|emperor/.test(id);
/** A crawler's pace: how far it goes at a time (u) and how long that takes (ms). A hermit crab scuttles, a tiger beetle
 *  runs, a snail or a walking leaf barely moves, a stink bug ambles over the flowers. */
const PACE: Partial<Record<BugId, [number, number, number]>> = {
  'hermit-crab': [30, 450, 700], 'tiger-beetle': [34, 260, 420], snail: [4, 3500, 5000], 'walking-leaf': [6, 3000, 4200],
  stinkbug: [10, 2200, 3200], 'man-faced-stink-bug': [10, 2200, 3200], tarantula: [14, 1800, 2600], scorpion: [16, 1600, 2400],
  // on the water: the pondskater skates in quick glides, the diving beetle paddles, the giant water bug lurks
  pondskater: [12, 260, 420], 'diving-beetle': [8, 900, 1400], 'giant-water-bug': [5, 1800, 2600]
};

/** The ground a place's bugs keep to (the spot's surface). */
export function groundOk(place: BugPlace, x: number, z: number): boolean {
  if (place === 'water') return waterAt(x, z, false, -3) !== null;
  const s = surfaceAt(x, z);
  if (place === 'beach') return s === 'sand';
  if (place === 'grass' || place === 'under-tree' || place === 'rock') return s === 'grass' || s === 'dirt';
  if (place === 'water-air') return true;
  return s !== 'sea';
}

/** The wild flowers' heads (world): where a ladybug or a mantis sits and a butterfly rests (a bloom's head, ~0.84 of
 *  a flower's height). */
export const flowerHeads = (): readonly (P3 & { id: string })[] => FLOWERS.map((f) => ({ id: f.id, x: f.x, z: f.z, lift: Math.round(FLOWER_U * 0.84) }));

function freeIn(a: Patch, ok: (p: P3) => boolean, r: () => number): P3 | null {
  for (let i = 0; i < 48; i++) {
    const p = { x: between(r, a.x0, a.x1), z: between(r, a.z0, a.z1), lift: between(r, a.l0, a.l1) };
    if (ok(p)) return p;
  }
  return null;
}

export interface BugPath {
  id: BugId;
  flight: Flight;
  place: BugPlace;
  /** Its spot (its node's anchor), where it first is, and the patch it keeps to (a point for a perch or a flower). */
  spot: P3;
  start: P3;
  patch: Patch;
  legs: Leg[];
}

export interface BugOpts {
  /** It came from here (a shaken bush, my villager, the rock), keeping to `area`. */
  from?: P3;
  area?: Patch;
  /** The orchid mantis's white flowers (by id), if the season has any. */
  white?: readonly string[];
  /** Ground it keeps off (world boxes: a flea off the villager it hopped from, clear of that villager's button). */
  avoid?: readonly Patch[];
  /** Its spot and the patch it keeps to, chosen already (this phone's own bug, a dev hook's: where its camera sees it). */
  at?: { spot: P3; patch: Patch | null };
  /** Where else it mustn't go (this phone's own: off screen, under a control). */
  keep?: (p: P3) => boolean;
}

/** NH's paces in flight (u/s, at random between; an 80u villager strolls at 90 and runs at 200): a butterfly flutters
 *  by slower than one strolls, a bee a little quicker, a firefly drifts; a dragonfly darts quick and short, then
 *  hovers; a beetle flies in to its trunk. */
export const FLY_UPS = {
  flutter: [14, 26], bee: [22, 36], drift: [5, 11], dart: [60, 100], perch: [40, 55]
} as const satisfies Record<string, readonly [number, number]>;

/**
 * A bug's stay from its seed: where NH keeps it (a trunk, a flower head, a lamp, its patch of ground or air) and every
 * move through `stayMs`, as Critters played them on one phone before: a percher flies in and sits; a hopper hops
 * along the grass and sits a while; a flutterer drifts from spot to spot and (a butterfly) every 2–3 hops lands on a
 * flower head nearby for 2–4 s; a crawler goes a little way at its pace and rests; a dragonfly darts and hovers; a
 * firefly drifts; a mole cricket stays under its mound; one on a flower stays put. Null when the bug has nowhere here.
 */
export function bugPath(id: BugId, seed: number, stayMs: number, o: BugOpts = {}): BugPath | null {
  const r = subRand(seed, 3);
  const flight = BUGS[id].flight, place = bugPlace(id);
  const off = o.avoid ?? [];
  // a percher's trunk and a flower's head are its spot, whatever the ground at its foot
  const ok = flight === 'perch' || flight === 'flower'
    ? () => true
    : (p: P3) => groundOk(place, p.x, p.z) && !off.some((a) => p.x >= a.x0 && p.x <= a.x1 && p.z >= a.z0 && p.z <= a.z1) && (!o.keep || o.keep(p));
  let spot: P3 | null = o.at?.spot ?? null, patch: Patch | null = o.at?.patch ?? null;
  if (o.at) {
    // (chosen already)
  } else if (flight === 'perch') {
    const all = perches(BUGS[id].tree === 'palm');
    const p = all.length ? pickOne(all, r) : null;
    if (p) spot = { x: p.x + p.dx, z: p.z - 1, lift: p.lift };
  } else if (flight === 'flower') {
    const heads = id === 'orchid-mantis' && o.white?.length ? flowerHeads().filter((h) => o.white!.includes(h.id)) : flowerHeads();
    const h = pickOne(heads, r);
    if (h) spot = { x: h.x, z: h.z, lift: h.lift };
  } else {
    const list = o.area ? [o.area] : patches(place);
    const order = list.map((a) => [a, r()] as const).sort((a, b) => a[1] - b[1]).map(([a]) => a);
    for (const a of order) {
      const p = freeIn(a, ok, r);
      if (p) {
        spot = p;
        patch = a;
        break;
      }
    }
    if (!spot && list.length) {
      patch = list[0];
      spot = { x: (patch.x0 + patch.x1) / 2, z: (patch.z0 + patch.z1) / 2, lift: patch.l0 };
    }
  }
  if (!spot) return null;
  if (!patch) patch = { x0: spot.x, x1: spot.x, z0: spot.z, z1: spot.z, l0: spot.lift, l1: spot.lift };
  const inPlace = flight === 'drift' || flight === 'flower' || flight === 'hop' || flight === 'crawl' || flight === 'stalk' || flight === 'burrow' || STILL.has(id);
  // a flier comes in from a little way off on the island's nearer side, at its own pace (fading in as it comes:
  // world3d/things.ts), a percher from above its trunk
  const side = spot.x < 195 ? -1 : 1;
  const start = o.from ?? (inPlace ? spot : flight === 'perch' ? { x: spot.x + side * 90, z: spot.z, lift: spot.lift + 50 } : { x: spot.x + side * 60, z: spot.z, lift: spot.lift + 8 });
  const legs: Leg[] = [];
  let at: P3 = start, t = 60;
  const go = (p: P3, ms: number, extra: Partial<Leg> = {}) => {
    legs.push({ x: p.x, z: p.z, lift: p.lift, t: Math.round(t), ms: Math.round(ms), ...extra });
    at = p;
    t = Math.round(t) + Math.round(ms);
  };
  const same = (p: P3) => at.x === p.x && at.z === p.z && at.lift === p.lift;
  const a = patch;
  const done: BugPath = { id, flight, place, spot, start, patch, legs };
  if (flight === 'burrow') return done; // under its mound, chirping, until it's dug up or done
  if (flight === 'perch' || flight === 'flower') {
    // in to its trunk (it sits there and sings) or, out of a shaken bush, down onto its flower; else it's just there,
    // sitting still (a slow bob), until it's netted, startled or done
    if (flight === 'perch') go(spot, same(spot) ? 0 : (dist3(at, spot) / between(r, ...FLY_UPS.perch)) * 1000, { sat: true });
    else go(spot, same(spot) ? 0 : 1200);
    return done;
  }
  const pace = id === 'honeybee' ? FLY_UPS.bee : flight === 'flutter' || flight === 'drift' || flight === 'dart' ? FLY_UPS[flight] : null;
  const flyTo = (p: P3, ups: readonly [number, number], extra: Partial<Leg> = {}) =>
    go(p, Math.max(200, (dist3(at, p) / between(r, ...ups)) * 1000), extra);
  if (pace && !same(spot)) flyTo(spot, pace);
  let heading = r() * Math.PI * 2, flown = 0, landAfter = 3 + Math.floor(r() * 3);
  for (let guard = 0; t < stayMs && guard < 4000; guard++) {
    if (pace) {
      if (flight === 'flutter' && LANDS(id) && ++flown > landAfter) {
        // NH's butterflies: every few turns it lands on a flower head of its own clump (its patch holds them), rests
        // 2.5–5 s with its wings slowly opening and closing, then lifts off again
        const near = flowerHeads().filter((h) => h.x >= a.x0 && h.x <= a.x1 && h.z >= a.z0 && h.z <= a.z1);
        const h = near.length ? pickOne(near, r) : null;
        flown = 0;
        landAfter = 3 + Math.floor(r() * 3);
        if (h) {
          flyTo({ x: h.x, z: h.z, lift: h.lift + 2 }, pace, { sat: true });
          t += between(r, 2500, 5000);
          continue;
        }
      }
      // the next bit of its meander: a step its way, the heading wandering a little each time, turned back in at the
      // patch's edge
      const m = meander(a, at, heading, flight === 'dart' ? between(r, 24, 56) : flight === 'drift' ? between(r, 8, 16) : between(r, 12, 26), ok, r);
      if (!m) {
        t += 600; // nowhere clear just now: it hovers where it is a while
        continue;
      }
      heading = m.h;
      flyTo(m.p, pace);
      // a dragonfly hovers between darts; a butterfly now and then hangs in the air a moment
      if (flight === 'dart') t += between(r, 900, 2200);
      else if (flight === 'flutter' && r() < 0.2) t += between(r, 300, 900);
      continue;
    }
    const p = freeIn(a, ok, r);
    if (!p) {
      t += 1000; // nowhere else clear just now: it stays where it is a while
      continue;
    }
    if (flight === 'hop') {
      // a short hop along the grass toward a free spot, then a sit (off a villager, or off the ground's kind: straight there)
      const away = at.lift > 0 || !ok({ ...at, lift: 0 });
      const x = away ? p.x : clamp(at.x + Math.sign(p.x - at.x || 1) * Math.min(Math.abs(p.x - at.x), between(r, 14, 30)), a.x0, a.x1);
      const z = away ? p.z : clamp(at.z + between(r, -8, 8), a.z0, a.z1);
      const next = { x, z, lift: 0 };
      if (!away && !ok(next)) {
        t += 600;
        continue;
      }
      go(next, 420, { hop: true });
      t += between(r, 1400, 2800);
      continue;
    }
    // a crawler: a little way along its ground, then a rest (a hermit crab scuttles sideways, a snail barely moves)
    const [reach, m0, m1] = PACE[id] ?? [18, 1600, 2600];
    const x = clamp(at.x + clamp(p.x - at.x, -reach, reach), a.x0, a.x1);
    const z = clamp(at.z + clamp(p.z - at.z, -reach / 2, reach / 2), a.z0, a.z1);
    go({ x, z, lift: p.lift }, between(r, m0, m1));
    t += between(r, 1200, 3200);
  }
  return done;
}

const dist3 = (a: P3, b: P3) => Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2 + (a.lift - b.lift) ** 2);

/** A flier's next step from `at` along `h` (radians in the ground's plane), `step` u: the heading turned a little at
 *  random (more on a retry), toward the patch's middle when the step would leave it; null when nowhere's clear. */
function meander(a: Patch, at: P3, h: number, step: number, ok: (p: P3) => boolean, r: () => number): { p: P3; h: number } | null {
  const hx = (a.x1 - a.x0) / 2, hz = (a.z1 - a.z0) / 2, cx = a.x0 + hx, cz = a.z0 + hz;
  const s = Math.min(step, Math.max(8, hx, hz));
  for (let i = 0; i < 8; i++) {
    let nh = h + (r() - 0.5) * (1.3 + i * 0.6);
    let x = at.x + Math.cos(nh) * s, z = at.z + Math.sin(nh) * s;
    if (x < a.x0 || x > a.x1 || z < a.z0 || z > a.z1) {
      nh = Math.atan2(cz - at.z, cx - at.x) + (r() - 0.5) * 1.2;
      x = at.x + Math.cos(nh) * s;
      z = at.z + Math.sin(nh) * s;
    }
    const p = { x: clamp(x, a.x0, a.x1), z: clamp(z, a.z0, a.z1), lift: clamp(at.lift + (r() - 0.5) * s * 0.6, a.l0, a.l1) };
    if (ok(p)) return { p, h: nh };
  }
  return null;
}

/** A bug's moment on its way (bugAt): where it is (world, its lift with its bob) and its velocity over the ground (u/ms). */
export interface Flying extends P3 { vx: number; vz: number }

/** A flier's bob (u, period ms): a butterfly's wingbeats, a firefly's slow float, a dragonfly's hover. */
const BOB: Partial<Record<Flight, readonly [number, number]>> = { flutter: [2.5, 560], drift: [2, 1900], dart: [1.2, 800] };

/** Whether leg `i` flows on into the next (no rest, sit or hop between): the curve keeps going through its end. */
const flows = (legs: readonly Leg[], i: number) => {
  const a = legs[i], b = legs[i + 1];
  return !!b && !a.sat && !a.hop && !b.hop && b.t <= a.t + a.ms + 1;
};
/** The curve's slope at the end of leg `i` where it flows on (u/ms on `axis`): from where the leg set off to where
 *  the next one ends, over that time. */
function slope(legs: readonly Leg[], start: P3, i: number, axis: 'x' | 'z' | 'lift'): number {
  const from = i ? legs[i - 1] : start, next = legs[i + 1];
  return (next[axis] - from[axis]) / Math.max(1, next.t + next.ms - legs[i].t);
}

/**
 * Where a bug is `ms` after it came: on a smooth curve through its legs' ends (a cubic in time on each axis) that
 * slows to a stop only where it rests, sits or hops and flows on through every other point, so a butterfly's meander
 * is a curve, never a run of straight lines; plus a flier's bob and a hop's arc. Written into `out`.
 */
export function bugAt(flight: Flight, legs: readonly Leg[], start: P3, ms: number, out: Flying = { x: 0, z: 0, lift: 0, vx: 0, vz: 0 }): Flying {
  let k = -1;
  for (let i = 0; i < legs.length && legs[i].t <= ms; i++) k = i;
  let env = 1;
  if (k < 0) {
    out.x = start.x;
    out.z = start.z;
    out.lift = start.lift;
    out.vx = out.vz = 0;
  } else {
    const to = legs[k], from = k ? legs[k - 1] : start, d = to.ms;
    const s = d ? clamp((ms - to.t) / d, 0, 1) : 1;
    const in0 = k > 0 && flows(legs, k - 1), on1 = flows(legs, k);
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = 3 * s2 - 2 * s3, h11 = s3 - s2;
    const d00 = 6 * s2 - 6 * s, d10 = 3 * s2 - 4 * s + 1, d11 = 3 * s2 - 2 * s;
    const pos = (axis: 'x' | 'z' | 'lift', m0: number, m1: number) => h00 * from[axis] + h10 * d * m0 + h01 * to[axis] + h11 * d * m1;
    const vel = (axis: 'x' | 'z', m0: number, m1: number) => (d ? (d00 * (from[axis] - to[axis])) / d : 0) + d10 * m0 + d11 * m1;
    const m = (axis: 'x' | 'z' | 'lift') => [in0 ? slope(legs, start, k - 1, axis) : 0, on1 ? slope(legs, start, k, axis) : 0] as const;
    const [x0, x1] = m('x'), [z0, z1] = m('z'), [l0, l1] = m('lift');
    out.x = pos('x', x0, x1);
    out.z = pos('z', z0, z1);
    out.lift = pos('lift', l0, l1) + (s < 1 && to.hop ? Math.sin(Math.PI * s) * 9 : 0);
    out.vx = s < 1 ? vel('x', x0, x1) : 0;
    out.vz = s < 1 ? vel('z', z0, z1) : 0;
    // the bob fades out as it lands on a flower and back in as it lifts off (none while it sits)
    env = s >= 1 ? (to.sat ? 0 : 1) : (to.sat ? 1 - s : 1) * (k > 0 && legs[k - 1].sat ? s : 1);
  }
  const bob = BOB[flight];
  if (bob && env > 0) out.lift += bob[0] * env * Math.sin((2 * Math.PI * ms) / bob[1]);
  return out;
}
