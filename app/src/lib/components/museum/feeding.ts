// The aquarium's feeding (docs/design.md "The museum"), pure: in a tank with a predator on show (PREDATORS: the sharks
// but the whale shark, the big hunters of the sea, the river and the deep), now and then a few little feeder fish come
// in from its top (no ずかん species: generic, never on a card) and swim as a loose school (each to its own spot about
// the school's middle, the way it heads: O(n), no pair of them compared); a predator notices them,
// stalks one, then chases it (its turn bounded as always: boids.ts), the school scattering; at its mouth, a snap (its
// head dipped, a puff of bubbles) and the little one fades away; else it gives up and cruises off. Not every chase
// ends in a bite. A cosmetic, each phone its own (a local seed): nothing shared, nothing allocated in a step, nothing
// stepped while the tank is off screen (the caller's clock), never a feeder in a tank without a predator.
import { CHASE, LUNGE, STALK, endChase, swimBox, type Swimmer } from './boids.ts';
import type { Box } from './tanks.ts';

/** The fish that hunt the feeders (NH's big ones, shadow 4–6, that eat little fish): the sharks (the whale shark a
 *  filter feeder: not), the giant trevally, the tuna, the blue marlin, the mahi-mahi; the river's arapaima, pike, gar,
 *  dorado, stringfish (a taimen), black bass, giant snakehead, arowana; the deep's coelacanth and football fish (an
 *  angler). Not the big grazers and sifters: the ocean sunfish (jellies), the sturgeon, the catfish, the koi, the oarfish. */
export const PREDATORS: ReadonlySet<string> = new Set([
  'great-white-shark', 'hammerhead-shark', 'saw-shark', 'giant-trevally', 'tuna', 'blue-marlin', 'mahi-mahi',
  'arapaima', 'pike', 'gar', 'dorado', 'stringfish', 'black-bass', 'giant-snakehead', 'arowana', 'coelacanth', 'football-fish'
]);
/** The most feeders in a tank at once. */
export const FEEDERS = 12;
/** How many come at a time (at least, at most). */
const SCHOOL = [6, 10];
/** A feeder's half length (u) and its reach from its middle (sideways, up: turned any way, a little pitched). */
export const FEEDER_R = 1.4;
const REACH: [number, number] = [1.5, 0.9];
/** A feeder's cruise and flight (u/s), its turn (rad/s), how near a predator scares it (u). */
const CRUISE = 3.5, FLEE = 4.6, TURN = 3, SCARE = 10;
/** How near (u, and its own length) a predator notices a feeder. */
const NOTICE = 30;
/** How long a hunt's stalk, chase and lunge last at most (s; the whole hunt at most HUNT_S), and the rest after one. */
const STALK_S = 4, CHASE_S = 7, LUNGE_S = 1.2;
export const HUNT_S = STALK_S + CHASE_S + LUNGE_S;
const REST_MIN = 8, REST_MAX = 18;
/** When a school comes (s of the tank on screen): the first soon, then every 30–90 s. A feeder stays at most LIFE s. */
const FIRST = [5, 12], EVERY = [30, 90], LIFE = 80;
/** How often a predator looks for a feeder to hunt (s), resting or not. */
const LOOK = 0.25;
/** Each pool slot's spot in the school (u, about its middle: ahead, across, up), a sunflower's spiral (no two near). */
const SPOT: readonly (readonly [number, number, number])[] = Array.from({ length: FEEDERS }, (_, i) => {
  const r = 2.1 * Math.sqrt(i + 0.5), a = i * 2.39996;
  return [r * Math.cos(a), r * Math.sin(a), ((i % 3) - 1) * 0.9] as const;
});

interface Feeder {
  /** In the water (fading in, swimming, or fading out). */
  alive: boolean;
  p: [number, number, number];
  v: [number, number, number];
  yaw: number;
  /** How much of it shows (0…1: its scale), whether it's eaten (gone in a moment where it was bitten) or leaving (its
   *  time up, or no predator left: up toward the top, fading as it goes). */
  fade: number;
  eaten: boolean;
  leaving: boolean;
  /** When it came (the tank's clock). */
  born: number;
  /** Its burst left (1 fresh … 0 spent: its flight's dash, used up in ~2.5 s, back in ~6 s). */
  dash: number;
}
export interface Feeding {
  feeders: Feeder[];
  /** The tank's own clock (s on screen) and when the next school comes. */
  clock: number;
  next: number;
  /** The hunt: its predator (null: none), its prey (a feeder's index), when its stage ends, the rest until the next. */
  hunter: Swimmer | null;
  prey: number;
  until: number;
  rest: number;
  /** The school's depth (y): it comes in at the top and swims down to it. */
  depth: number;
  /** The last bite's puff: where, and how long ago (s; large: none). */
  puff: [number, number, number];
  puffT: number;
  /** Tallies: hunts begun, bites, escapes. */
  hunts: number;
  bites: number;
  escapes: number;
  /** Its random's state. */
  rnd: number;
  /** When a resting predator next looks for prey (the tank's clock). */
  look: number;
}

/** A tank's feeding, seeded (its own on each phone: a cosmetic). */
export function feedingOf(seed: number): Feeding {
  const feeders: Feeder[] = [];
  for (let i = 0; i < FEEDERS; i++) feeders.push({ alive: false, p: [0, 0, 0], v: [0, 0, 0], yaw: 0, fade: 0, eaten: false, leaving: false, born: 0, dash: 1 });
  const f: Feeding = { feeders, clock: 0, next: 0, depth: 0, hunter: null, prey: -1, until: 0, rest: 0, puff: [0, 0, 0], puffT: 99, hunts: 0, bites: 0, escapes: 0, rnd: seed >>> 0 || 1, look: 0 };
  f.next = FIRST[0] + (FIRST[1] - FIRST[0]) * rand(f);
  f.rest = REST_MIN * rand(f);
  return f;
}
/** mulberry32 */
function rand(f: Feeding): number {
  let t = (f.rnd = (f.rnd + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const box: Box = { x0: 0, x1: 0, y0: 0, y1: 0, z0: 0, z1: 0 };
/** How many feeders are in (alive). */
export function feedersIn(f: Feeding): number {
  let n = 0;
  for (const x of f.feeders) if (x.alive) n++;
  return n;
}

/** One step of a tank's feeding (dt s on screen; its swimmers already stepped, `predators` those of them that hunt). */
export function stepFeeding(f: Feeding, predators: readonly Swimmer[], water: Box, dt: number): void {
  const h = Math.min(0.1, Math.max(0, dt));
  f.clock += h;
  f.puffT += h;
  const b = swimBox(water, REACH, box), along = b.x1 - b.x0 >= b.z1 - b.z0;
  // (its hunter gone from the tank: the hunt over)
  if (f.hunter && predators.indexOf(f.hunter) < 0) {
    f.hunter = null;
    f.prey = -1;
  }
  // a school in, from the top near an end, while a predator's here
  if (!predators.length) {
    for (const x of f.feeders) if (x.alive) x.leaving = true;
    f.next = Math.max(f.next, f.clock + FIRST[0]);
  } else if (f.clock >= f.next) {
    f.next = f.clock + EVERY[0] + (EVERY[1] - EVERY[0]) * rand(f);
    const n = SCHOOL[0] + Math.floor(rand(f) * (SCHOOL[1] - SCHOOL[0] + 1)), end = rand(f) < 0.5;
    f.depth = b.y0 + (b.y1 - b.y0) * (0.25 + 0.45 * rand(f));
    const lx = along ? (end ? b.x0 + (b.x1 - b.x0) * 0.15 : b.x1 - (b.x1 - b.x0) * 0.15) : (b.x0 + b.x1) / 2;
    const lz = along ? (b.z0 + b.z1) / 2 : end ? b.z0 + (b.z1 - b.z0) * 0.15 : b.z1 - (b.z1 - b.z0) * 0.15;
    const yaw = along ? (end ? Math.PI / 2 : -Math.PI / 2) : end ? 0 : Math.PI;
    let k = 0;
    for (const x of f.feeders) {
      if (x.alive || k >= n) continue;
      k++;
      x.alive = true;
      x.eaten = false;
      x.leaving = false;
      x.fade = 0;
      x.born = f.clock;
      x.dash = 1;
      x.p[0] = Math.min(b.x1, Math.max(b.x0, lx + (rand(f) - 0.5) * 9));
      x.p[1] = b.y1 - rand(f) * 2;
      x.p[2] = Math.min(b.z1, Math.max(b.z0, lz + (rand(f) - 0.5) * 9));
      x.yaw = yaw + (rand(f) - 0.5) * 0.6;
      x.v[0] = Math.sin(x.yaw) * CRUISE;
      x.v[1] = -1;
      x.v[2] = Math.cos(x.yaw) * CRUISE;
    }
  }
  stepHunt(f, predators, water);
  stepFeeders(f, b, h);
}

/** The hunt: a predator picks the nearest feeder (after its rest), stalks it, then chases it; a bite at its mouth, or
 *  it gives up when its chase runs out. */
function stepHunt(f: Feeding, predators: readonly Swimmer[], water: Box): void {
  const fs = f.feeders;
  if (!f.hunter) {
    if (f.clock < f.rest || f.clock < f.look || !predators.length) return;
    // (a look a quarter second: the pairs aren't scanned each frame)
    f.look = f.clock + LOOK;
    // (the nearest pair of a predator and a feeder fully in, and in its reach: not up by the glass, where it can't go)
    let best = Infinity, who: Swimmer | null = null, prey = -1;
    for (const s of predators) {
      const sb = swimBox(water, s.reach, reachBox), far = NOTICE + s.r * 2;
      for (let i = 0; i < fs.length; i++) {
        const x = fs[i];
        if (!x.alive || x.eaten || x.leaving || x.fade < 1) continue;
        const ox = x.p[0] - s.p[0], oy = x.p[1] - s.p[1], oz = x.p[2] - s.p[2], d2 = ox * ox + oy * oy + oz * oz;
        if (d2 < best && d2 < far * far && inReach(s, x, sb)) {
          best = d2;
          who = s;
          prey = i;
        }
      }
    }
    if (!who) return;
    f.hunter = who;
    f.prey = prey;
    f.until = f.clock + STALK_S * (0.5 + 0.5 * rand(f));
    who.chase = STALK;
    f.hunts++;
  }
  const s = f.hunter, x = fs[f.prey];
  if (!s) return;
  // (its prey gone, or slipped off by the glass where it can't follow: away)
  if (!x || !x.alive || x.eaten || x.leaving || !inReach(s, x, swimBox(water, s.reach, reachBox), 1.4)) return over(f, s, water, false);
  // after it: a little ahead of where it's going
  s.goal[0] = x.p[0] + x.v[0] * 0.3;
  s.goal[1] = x.p[1];
  s.goal[2] = x.p[2] + x.v[2] * 0.3;
  const ox = x.p[0] - s.p[0], oy = x.p[1] - s.p[1], oz = x.p[2] - s.p[2], d = Math.sqrt(ox * ox + oy * oy + oz * oz);
  if (s.chase === STALK) {
    if (f.clock >= f.until || d < s.r * 2 + 8) {
      s.chase = CHASE;
      f.until = f.clock + CHASE_S;
    }
    return;
  }
  // its mouth: its nose's end
  const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), mx = s.p[0] + fx * s.r * 0.85, mz = s.p[2] + fz * s.r * 0.85;
  const nx = x.p[0] - mx, nz = x.p[2] - mz;
  if (nx * nx + nz * nz < mouthOf(s) ** 2 && Math.abs(x.p[1] - s.p[1]) < mouthOf(s) * 0.6 + s.r * 0.15) {
    x.eaten = true;
    f.puff[0] = x.p[0];
    f.puff[1] = x.p[1];
    f.puff[2] = x.p[2];
    f.puffT = 0;
    s.snap = 1;
    return over(f, s, water, true);
  }
  // close, and its prey just ahead: the lunge (a burst, LUNGE_S at most; missed, the little one's away)
  if (s.chase === CHASE && d < s.r * 0.85 + mouthOf(s) + 5 && ((x.p[0] - s.p[0]) * fx + (x.p[2] - s.p[2]) * fz) > d * 0.8) {
    s.chase = LUNGE;
    f.until = f.clock + LUNGE_S;
  }
  if (f.clock >= f.until) over(f, s, water, false);
}
/** How near its nose a feeder's caught (u). */
const mouthOf = (s: Swimmer): number => FEEDER_R + 1.2 + s.r * 0.4;
/** How far v is outside [a, c]. */
const out = (v: number, a: number, c: number): number => (v < a ? a - v : v > c ? v - c : 0);
const reachBox: Box = { x0: 0, x1: 0, y0: 0, y1: 0, z0: 0, z1: 0 };
/** Whether a predator's mouth can get to a feeder where it is: its middle's box (`b`: boids.ts swimBox, its water less
 *  its reach) no further off it, up, down or across, than k of its mouth's reach (along, its nose reaches past; a hunt
 *  begun at 0.7, given up past 1.4). */
function inReach(s: Swimmer, x: Feeder, b: Box, k = 0.7): boolean {
  const along = b.x1 - b.x0 >= b.z1 - b.z0, C = along ? 2 : 0;
  const lo = C ? b.z0 : b.x0, hi = C ? b.z1 : b.x1, a = out(x.p[C], lo, hi), c = out(x.p[1], b.y0, b.y1), m = mouthOf(s) * k;
  return a * a + c * c < m * m;
}
/** A hunt over: a bite or an escape, its predator back to cruising, a rest before the next. */
function over(f: Feeding, s: Swimmer, water: Box, bit: boolean): void {
  endChase(s, water, f.clock);
  if (bit) f.bites++;
  else f.escapes++;
  f.hunter = null;
  f.prey = -1;
  f.rest = f.clock + REST_MIN + (REST_MAX - REST_MIN) * rand(f);
}

/** The feeders: a loose school (each to its own spot about the school's middle, turned the way it heads: together, the
 *  same way, apart, and no pair compared), off the glass, away from any predator near (scattering, quick, from the
 *  hunter); fading in, and out when eaten or their time's up. */
function stepFeeders(f: Feeding, b: Box, h: number): void {
  const fs = f.feeders, hunter = f.hunter;
  let n = 0, cx = 0, cy = 0, cz = 0, ax = 0, az = 0;
  for (const x of fs) {
    if (!x.alive || x.eaten) continue;
    n++;
    cx += x.p[0];
    cy += x.p[1];
    cz += x.p[2];
    ax += x.v[0];
    az += x.v[2];
  }
  // (the school's heading: its mean way, else straight on)
  let hx = 0, hz = 1;
  if (n) {
    cx /= n;
    cy /= n;
    cz /= n;
    ax /= n * CRUISE;
    az /= n * CRUISE;
    const a = Math.sqrt(ax * ax + az * az);
    if (a > 1e-3) {
      hx = ax / a;
      hz = az / a;
    }
  }
  for (let i = 0; i < fs.length; i++) {
    const x = fs[i];
    if (!x.alive) continue;
    if (x.eaten) {
      // (eaten: gone in 0.4 s, where it was)
      x.fade -= h / 0.4;
      const k = Math.max(0, 1 - h * 3);
      x.v[0] *= k;
      x.v[1] *= k;
      x.v[2] *= k;
      if (x.fade <= 0) {
        x.alive = false;
        x.fade = 0;
      }
      continue;
    }
    if (f.clock - x.born > LIFE) x.leaving = true;
    x.fade = x.leaving ? x.fade - h / 2 : Math.min(1, x.fade + h);
    if (x.fade <= 0) {
      x.alive = false;
      x.fade = 0;
      continue;
    }
    const fx = Math.sin(x.yaw), fz = Math.cos(x.yaw);
    // together, the same way, apart: to its own spot in the school (ahead along its heading, across it, up)
    const sp0 = SPOT[i], tx = cx + hx * sp0[0] + hz * sp0[1], tz = cz + hz * sp0[0] - hx * sp0[1];
    let dx = fx + (tx - x.p[0]) * 0.06 + ax * 0.5, dz = fz + (tz - x.p[2]) * 0.06 + az * 0.5;
    let dy = x.leaving ? 2 : (cy + sp0[2] - x.p[1]) * 0.05 + (f.depth - x.p[1]) * 0.08;
    // away from a predator near (from the hunter, wherever it is in its chase)
    let fear = 0;
    if (hunter) {
      const ox = x.p[0] - hunter.p[0], oy = x.p[1] - hunter.p[1], oz = x.p[2] - hunter.p[2], d = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
      const reach = hunter.chase !== STALK ? SCARE + hunter.r : hunter.r * 1.2;
      if (d < reach) {
        fear = 1 - d / reach;
        dx += (ox / d) * fear * 4;
        dz += (oz / d) * fear * 4;
        dy += (oy / d) * fear * 2;
      }
    }
    // the glass ahead, softly
    const qx = x.p[0] + fx * 3, qz = x.p[2] + fz * 3;
    dx += soft(qx - b.x0) - soft(b.x1 - qx);
    dz += soft(qz - b.z0) - soft(b.z1 - qz);
    let err = Math.atan2(dx, dz) - x.yaw;
    err = Math.atan2(Math.sin(err), Math.cos(err));
    x.yaw += Math.max(-TURN * h, Math.min(TURN * h, err * 3 * h));
    const sp = Math.sqrt(x.v[0] * x.v[0] + x.v[2] * x.v[2]), want = CRUISE + (FLEE - CRUISE) * Math.min(1, fear * 2) * x.dash;
    x.dash = fear > 0 ? Math.max(0, x.dash - h / 2.5) : Math.min(1, x.dash + h / 6);
    const u = sp + Math.max(-6 * h, Math.min(12 * h, want - sp));
    x.v[0] = Math.sin(x.yaw) * u;
    x.v[2] = Math.cos(x.yaw) * u;
    x.v[1] += (Math.max(-2.5, Math.min(2.5, dy * 2)) - x.v[1]) * Math.min(1, h * 2);
    x.p[0] = Math.min(b.x1, Math.max(b.x0, x.p[0] + x.v[0] * h));
    x.p[1] = Math.min(b.y1, Math.max(b.y0, x.p[1] + x.v[1] * h));
    x.p[2] = Math.min(b.z1, Math.max(b.z0, x.p[2] + x.v[2] * h));
  }
}
/** The glass's soft push on a feeder's look-ahead d from it (within 4 u). */
const soft = (d: number): number => (d < 4 ? ((4 - d) / 4) * 2 : 0);
/** The box a feeder's middle keeps to (all of it in the water). */
export const feederBox = (water: Box, out?: Box): Box => swimBox(water, REACH, out);
