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
export const critterId = (s: Spawn): string => `${s.kind}:${s.slot}`;

/** A seeded stream of one spawn for one purpose (`salt`): the species pickers keep `spawnRand`'s own. */
const subRand = (seed: number, salt: number): (() => number) => mulberry32((seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0);

const between = (r: () => number, a: number, b: number) => a + r() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
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

/** The fresh water a fresh-water spawn swims in (the pond, the river, the mouth, the clifftop): the seed's. */
export const freshWater = (s: Spawn): FreshWhere => FRESH[Math.floor(subRand(s.seed, 1)() * FRESH.length) % FRESH.length];

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
export function fishPath(seed: number, water: Water, stayMs: number): FishPath {
  const r = subRand(seed, 2);
  const areas = water === 'sea' ? [SEA_SWIM] : freshAreas(water);
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
export const LANDS = (id: BugId): boolean => /butterfly|birdwing|bluebottle|emperor/.test(id);
/** A crawler's pace: how far it goes at a time (u) and how long that takes (ms). A hermit crab scuttles, a tiger beetle
 *  runs, a snail or a walking leaf barely moves, a stink bug ambles over the flowers. */
export const PACE: Partial<Record<BugId, [number, number, number]>> = {
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
}

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
    : (p: P3) => groundOk(place, p.x, p.z) && !off.some((a) => p.x >= a.x0 && p.x <= a.x1 && p.z >= a.z0 && p.z <= a.z1);
  let spot: P3 | null = null, patch: Patch | null = null;
  if (flight === 'perch') {
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
  // flyers come in from the island's nearer side (a percher from above its trunk)
  const side = spot.x < 195 ? -1 : 1;
  const start = o.from ?? (inPlace ? spot : { x: spot.x + side * 300, z: spot.z, lift: spot.lift + (flight === 'perch' ? 40 : 0) });
  const legs: Leg[] = [];
  let at: P3 = start, t = 60, hops = 0, rest = 2 + Math.floor(r() * 2), sat = false;
  const go = (p: P3, ms: number, extra: Partial<Leg> = {}) => {
    legs.push({ x: p.x, z: p.z, lift: p.lift, t: Math.round(t), ms: Math.round(ms), ...extra });
    at = p;
  };
  const a = patch;
  for (let guard = 0; t < stayMs && guard < 400; guard++) {
    if (flight === 'burrow') break; // under its mound, chirping, until it's dug up or done
    const p = freeIn(a, ok, r);
    if (!p) {
      t += 1000; // nowhere else clear just now: it stays where it is a while
      continue;
    }
    if (flight === 'perch') {
      // in to the trunk, then it sits there and sings until it's netted, startled or done
      const ms = at.x === p.x && at.lift === p.lift ? 0 : 1500;
      go(p, ms, { sat: true });
      break;
    }
    if (flight === 'flower') {
      // flown in from a shaken bush: down onto its flower; else it's just there, sitting still (a slow bob)
      go(p, at.x === p.x && at.z === p.z && at.lift === p.lift ? 0 : 1200);
      break;
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
      t += 420 + between(r, 1400, 2800);
      continue;
    }
    if (flight === 'flutter' && LANDS(id)) {
      // NH's butterflies: every 2–3 hops it lands on a flower head nearby, rests 2–4 s with its wings slowly opening
      // and closing, then lifts off again
      if (sat) {
        sat = false;
        hops = 0;
        rest = 2 + Math.floor(r() * 2);
      } else if ((hops += 1) > rest) {
        // a flower of its own clump (its patch holds them)
        const near = flowerHeads().filter((h) => h.x >= patch!.x0 && h.x <= patch!.x1 && h.z >= patch!.z0 && h.z <= patch!.z1);
        const h = near.length ? pickOne(near, r) : null;
        if (h) {
          const ms = between(r, 1100, 1600);
          go({ x: h.x, z: h.z, lift: h.lift + 2 }, ms, { sat: true });
          sat = true;
          t += ms + between(r, 2000, 4000);
          continue;
        }
      }
    }
    if (flight === 'crawl' || flight === 'stalk') {
      // a little way along its ground, then a rest: a hermit crab scuttles sideways, a snail barely moves
      const [reach, m0, m1] = PACE[id] ?? [18, 1600, 2600];
      const x = clamp(at.x + clamp(p.x - at.x, -reach, reach), a.x0, a.x1);
      const z = clamp(at.z + clamp(p.z - at.z, -reach / 2, reach / 2), a.z0, a.z1);
      const ms = between(r, m0, m1);
      go({ x, z, lift: p.lift }, ms);
      t += ms + between(r, 1200, 3200);
      continue;
    }
    const ms = flight === 'dart' ? between(r, 240, 380) : flight === 'drift' ? between(r, 2600, 4000) : between(r, 1100, 1800);
    go(p, ms);
    t += ms + (flight === 'dart' ? between(r, 900, 2000) : 0); // a dragonfly hovers between darts
  }
  return { id, flight, place, spot, start, patch, legs };
}
