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
  BUGS, FRESH, SEA_SWIM, bugPlace, freshAreas, patches, perches, swimPick, swimmable, waterAt,
  type BugId, type BugPlace, type Flight, type Patch, type Swim, type Water
} from '../../world/critters.ts';
import { clamp } from '#lib/math.ts';
import { FLOWERS, layoutNav, surfaceAt, type FreshWhere } from '../../world/world.ts';
import { walkable } from '#lib/layout/nav.ts';
import { FLOWER_U } from './scene.ts';
import { coastOf } from '../../world/coast.ts';
import { site } from './site.svelte.ts';

/** A critter's shared id: its kind, its channel past the first (a water, a coast, the second bug's lane) and the slot
 *  it came in (one a channel at a time, so unique for the day). */
export const critterId = (s: Spawn): string =>
  s.water ? `${s.kind}:${s.water}:${s.slot}` : s.coast ? `${s.kind}:c${s.coast}:${s.slot}` : s.lane ? `${s.kind}:l${s.lane}:${s.slot}` : `${s.kind}:${s.slot}`;

/** A seeded stream of one spawn for one purpose (`salt`): the species pickers keep `spawnRand`'s own. */
const subRand = (seed: number, salt: number): (() => number) => mulberry32((seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0);

const between = (r: () => number, a: number, b: number) => a + r() * (b - a);
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

/** In that water (the island's tiles: critters.ts waterAt), clear of its edge. */
export const inWater = (water: Water, x: number, z: number): boolean => waterAt(x, z, -6) === water;

/** A point of a patch in its water; along a coast (its tiles: coast.ts), one a glide from `from` can reach by sea
 *  (a stretch round a corner of the island never has a shadow swim over the land). */
const swimPoint = (a: Swim, water: Water, r: () => number, from?: { x: number; z: number }): { x: number; z: number } => {
  for (let i = 0; i < 40; i++) {
    const p = swimPick(a, r);
    if (!inWater(water, p.x, p.z)) continue;
    if (from && a.tiles && ((p.x - from.x) ** 2 + (p.z - from.z) ** 2 > GLIDE_U ** 2 || !swimmable(water, from.x, from.z, p.x, p.z))) continue;
    return p;
  }
  return from ?? (a.tiles?.length ? { x: a.tiles[0][0], z: a.tiles[0][1] } : { x: a.cx, z: a.cz });
};
/** A coast shadow's longest glide (u): a long stretch is a wander along it, not a dash across. */
export const GLIDE_U = 150;

interface FishPath {
  area: Swim;
  /** Where it first shows (its node's anchor). */
  start: { x: number; z: number };
  legs: Leg[];
}

/** A shadow's stay in `water` from its seed: its patch (the sea's: its channel's stretch of coast, coast.ts), where
 *  it shows, and its slow wander to new spots in the patch (NH shadows dawdle: 2.5–6 s a glide, 0.6–2.2 s between),
 *  through `stayMs`. */
export function fishPath(seed: number, water: Water, stayMs: number, coast = 0): FishPath | null {
  const r = subRand(seed, 2);
  const areas = water === 'sea' ? [coastOf(coast).area] : freshAreas(water);
  if (!areas.length) return null; // (no such water on this island)
  const area = areas[Math.floor(r() * areas.length) % areas.length];
  const start = swimPoint(area, water, r);
  const legs: Leg[] = [];
  let at = start, t = 400;
  while (t < stayMs) {
    const p = swimPoint(area, water, r, at);
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
export const PACE: Partial<Record<BugId, [number, number, number]>> = {
  'hermit-crab': [30, 450, 700], 'tiger-beetle': [34, 260, 420], snail: [4, 3500, 5000], 'walking-leaf': [6, 3000, 4200],
  stinkbug: [10, 2200, 3200], 'man-faced-stink-bug': [10, 2200, 3200], tarantula: [14, 1800, 2600], scorpion: [16, 1600, 2400],
  // on the water: the pondskater skates in quick glides, the diving beetle paddles, the giant water bug lurks
  pondskater: [12, 260, 420], 'diving-beetle': [8, 900, 1400], 'giant-water-bug': [5, 1800, 2600],
  // the ant scurries by the campfire; the dung beetle rolls its snowball slowly
  ant: [10, 700, 1100], 'dung-beetle': [8, 2200, 3000]
};

/** The ground a place's bugs keep to (the spot's surface). */
export function groundOk(place: BugPlace, x: number, z: number): boolean {
  if (place === 'water') return ((w) => w !== null && w !== 'sea')(waterAt(x, z, -3));
  const s = surfaceAt(x, z);
  if (place === 'beach') return s === 'sand';
  if (place === 'grass' || place === 'under-tree' || place === 'rock') return s === 'grass' || s === 'dirt';
  if (place === 'water-air') return true;
  // (by the campfire: open ground, never under what stands round it, a bench or a lantern put in front of it)
  if (place === 'camp' || place === 'camp-air') return s !== 'sea' && s !== 'water' && ((g) => !g || walkable(g, x, z))(layoutNav());
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

interface BugPath {
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
  /** The other roaming bugs' spots while it's about (ambient.ts bugRivals): never its spot too (another trunk or
   *  flower head, or SPOT_GAP clear of them). */
  taken?: readonly P3[];
}

/** How far a roaming bug keeps from a thing lying to be tapped (u: a present, wood, a dig spot): hovering over one, it
 *  took the finger meant for it (the two roaming lanes made that twice as common). */
export const TAP_CLEAR = 24;
/** A bug's keep (BugOpts.keep) clear of `things` (world x, z) by `r`: its spot and every move of its stay. Both phones
 *  build it from the shared day (its puts, the day's dig spots), so a shared bug keeps the same path on both. */
export const clearOf = (things: readonly { x: number; z: number }[], r = TAP_CLEAR) => (p: P3): boolean =>
  things.every((t) => (t.x - p.x) ** 2 + (t.z - p.z) ** 2 >= r * r);

/** How far a roaming bug's spot keeps from another's (u), where its place has the room (a trunk or a flower head of
 *  its own, a spot of its patch that far off), else at least SPOT_MIN (the rock's little patch: side by side). */
const SPOT_GAP = 40;
export const SPOT_MIN = 12;

/** NH's paces in flight (u/s, at random between; an 80u villager strolls at 90 and runs at 300): a butterfly flutters
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
  // (another roaming bug's spot: a trunk or a head of its own, else SPOT_GAP clear; with nothing else, any)
  const taken = o.taken ?? [];
  const gaps = taken.length ? [SPOT_GAP, SPOT_MIN] : [];
  const clear = (gap: number) => (p: P3) => taken.every((t) => (t.x - p.x) ** 2 + (t.z - p.z) ** 2 >= gap ** 2);
  const free = <T extends P3>(xs: readonly T[]): readonly T[] => {
    for (const gap of gaps) if (xs.some(clear(gap))) return xs.filter(clear(gap));
    return xs;
  };
  if (o.at) {
    // (chosen already)
  } else if (flight === 'perch') {
    const all = free(perches(BUGS[id].tree === 'palm').map((p) => ({ x: p.x + p.dx, z: p.z - 1, lift: p.lift })));
    spot = all.length ? pickOne(all, r) : null;
  } else if (flight === 'flower') {
    const heads = free(id === 'orchid-mantis' && o.white?.length ? flowerHeads().filter((h) => o.white!.includes(h.id)) : flowerHeads());
    const h = pickOne(heads, r);
    if (h) spot = { x: h.x, z: h.z, lift: h.lift };
  } else {
    const list = o.area ? [o.area] : patches(place);
    const order = list.map((a) => [a, r()] as const).sort((a, b) => a[1] - b[1]).map(([a]) => a);
    for (const test of [...gaps.map((gap) => (p: P3) => ok(p) && clear(gap)(p)), ok]) {
      for (const a of order) {
        const p = freeIn(a, test, r);
        if (p) {
          spot = p;
          patch = a;
          break;
        }
      }
      if (spot) break;
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
  const side = spot.x < site.midX ? -1 : 1;
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
  const pace = id === 'honeybee' || id === 'fly' ? FLY_UPS.bee : flight === 'flutter' || flight === 'drift' || flight === 'dart' ? FLY_UPS[flight] : null;
  legs.push(...bugLegs(flight, {
    ok, pace, crawl: PACE[id] ?? CRAWL,
    // NH's butterflies: every few turns it lands on a flower head of its own clump (its patch holds them), rests
    // 2.5–5 s with its wings slowly opening and closing, then lifts off again
    land: flight === 'flutter' && LANDS(id) ? { heads: flowerHeads(), over: 2, rest: [2500, 5000] } : null
  }, r, spot, start, a, stayMs));
  return done;
}

/** A crawler's pace when it has none of its own (PACE). */
const CRAWL = [18, 1600, 2600] as const;

/** How a bug goes about its patch (bugPath's; the museum's garden's too: museum/bugLife.ts). */
export interface Ways {
  /** Where it may be (its ground, clear of what it keeps off). */
  ok: (p: P3) => boolean;
  /** A flier's pace (u/s, at random between); null: it hops or crawls. */
  pace: readonly [number, number] | null;
  /** A flutterer's landing every 3–5 turns: on one of `heads` in its patch, `over` it, for `rest` ms. */
  land: { heads: readonly P3[]; over: number; rest: readonly [number, number] } | null;
  /** A crawler's pace: how far it goes at a time (u) and how long that takes (ms, between). */
  crawl: readonly [number, number, number];
  /** A crawler's rest between goes (ms; else 1200–3200). */
  rest?: readonly [number, number];
  /** A crawler's chance a go is a short flight instead (a hop's arc: a beetle off its bark). */
  flits?: number;
}

/**
 * A bug's moves through `stayMs` from `start` in its patch `a`: a flier flies to its spot, then meanders (a dragonfly
 * darting and hovering, a butterfly landing now and then); a hopper hops along and sits; a crawler goes a little way
 * at its pace and rests.
 */
export function bugLegs(flight: Flight, w: Ways, r: () => number, spot: P3, start: P3, a: Patch, stayMs: number): Leg[] {
  const legs: Leg[] = [];
  let at: P3 = start, t = 60;
  const go = (p: P3, ms: number, extra: Partial<Leg> = {}) => {
    legs.push({ x: p.x, z: p.z, lift: p.lift, t: Math.round(t), ms: Math.round(ms), ...extra });
    at = p;
    t = Math.round(t) + Math.round(ms);
  };
  const same = (p: P3) => at.x === p.x && at.z === p.z && at.lift === p.lift;
  const { ok, pace } = w;
  const flyTo = (p: P3, ups: readonly [number, number], extra: Partial<Leg> = {}) =>
    go(p, Math.max(200, (dist3(at, p) / between(r, ...ups)) * 1000), extra);
  if (pace && !same(spot)) flyTo(spot, pace);
  let heading = r() * Math.PI * 2, flown = 0, landAfter = 3 + Math.floor(r() * 3);
  for (let guard = 0; t < stayMs && guard < 4000; guard++) {
    if (pace) {
      if (flight === 'flutter' && w.land && ++flown > landAfter) {
        const near = w.land.heads.filter((h) => h.x >= a.x0 && h.x <= a.x1 && h.z >= a.z0 && h.z <= a.z1);
        const h = near.length ? pickOne(near, r) : null;
        flown = 0;
        landAfter = 3 + Math.floor(r() * 3);
        if (h) {
          flyTo({ x: h.x, z: h.z, lift: h.lift + w.land.over }, pace, { sat: true });
          t += between(r, ...w.land.rest);
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
    if (w.flits && r() < w.flits) {
      // a short flight to another spot on its ground, its wings out a moment
      go(p, Math.max(500, (dist3(at, p) / 30) * 1000), { hop: true });
      t += between(r, ...(w.rest ?? [1200, 3200]));
      continue;
    }
    // a crawler: a little way along its ground, then a rest (a hermit crab scuttles sideways, a snail barely moves)
    const [reach, m0, m1] = w.crawl;
    const x = clamp(at.x + clamp(p.x - at.x, -reach, reach), a.x0, a.x1);
    const z = clamp(at.z + clamp(p.z - at.z, -reach / 2, reach / 2), a.z0, a.z1);
    // (a step short of the spot that isn't its ground, a bank's corner: on to the spot itself)
    const next = { x, z, lift: p.lift };
    go(ok(next) ? next : p, between(r, m0, m1));
    t += between(r, ...(w.rest ?? [1200, 3200]));
  }
  return legs;
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
export const BOB: Partial<Record<Flight, readonly [number, number]>> = { flutter: [2.5, 560], drift: [2, 1900], dart: [1.2, 800] };

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
    // (each axis inline: no closure or array a frame, the museum's every frame)
    const x0 = in0 ? slope(legs, start, k - 1, 'x') : 0, x1 = on1 ? slope(legs, start, k, 'x') : 0;
    const z0 = in0 ? slope(legs, start, k - 1, 'z') : 0, z1 = on1 ? slope(legs, start, k, 'z') : 0;
    const l0 = in0 ? slope(legs, start, k - 1, 'lift') : 0, l1 = on1 ? slope(legs, start, k, 'lift') : 0;
    out.x = h00 * from.x + h10 * d * x0 + h01 * to.x + h11 * d * x1;
    out.z = h00 * from.z + h10 * d * z0 + h01 * to.z + h11 * d * z1;
    out.lift = h00 * from.lift + h10 * d * l0 + h01 * to.lift + h11 * d * l1 + (s < 1 && to.hop ? Math.sin(Math.PI * s) * 9 : 0);
    out.vx = s < 1 ? (d ? (d00 * (from.x - to.x)) / d : 0) + d10 * x0 + d11 * x1 : 0;
    out.vz = s < 1 ? (d ? (d00 * (from.z - to.z)) / d : 0) + d10 * z0 + d11 * z1 : 0;
    // the bob fades out as it lands on a flower and back in as it lifts off (none while it sits)
    env = s >= 1 ? (to.sat ? 0 : 1) : (to.sat ? 1 - s : 1) * (k > 0 && legs[k - 1].sat ? s : 1);
  }
  const bob = BOB[flight];
  if (bob && env > 0) out.lift += bob[0] * env * Math.sin((2 * Math.PI * ms) / bob[1]);
  return out;
}
