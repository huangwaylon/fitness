// The 3D island's critters, frame by frame (Critters.svelte; glide.ts): the 2D sprites move by CSS transitions, and
// the 3D models read the same moves here each frame (their nodes' `live`), by the same curves: smooth from wherever
// they are (never a jump), turning toward where they go. A fish's model stands by its nose (assets.json shadow/*: the
// body trails behind it), so the middle the game moves is set half a body behind it. While it plays with my line its
// nose meets the float: backed off a little, each nibble a bump on it with the float's dip (fishing3d.ts), the bite a
// lunge onto it as it plunges; scared, it darts off with a quick tail wiggle. The models fade in and out
// (world3d/things.ts: never popped). No DOM; the component's state comes in through `Motion3Deps`.
import { untrack } from 'svelte';
import { NIBBLE_MS, PLUNGE_MS, angling } from '../world3d/fishing3d.ts';
import { wingBeat } from '../world3d/wings.ts';
import { EASE, Glide, turn, yawOf } from './glide.ts';
import { bugAt, type Flying, type Leg } from './critterPath.ts';
import { shadowLen, type Flight } from './critters.ts';
import type { Line as MyLine } from './fishing.ts';
import type { Bug, Fish, P3 } from './critterTypes.ts';

/** The dung beetle's snowball: across (u: assets.json's `h`), and its middle ahead of the beetle's (its head's 8.6u, then
 *  the ball's radius). */
const BALL_U = 14;
const BALL_AHEAD = 15.6;

/** What the frame reads of the component: my line, my line's fish nose to the float (from `at`, for line `n`), the
 *  line's number now, the relay's clock (the shared itineraries'), and a plain copy of a state proxy's value. */
export interface Motion3Deps {
  line(): MyLine | null;
  nose(): { f: Fish; at: number; n: number } | null;
  lineN(): number;
  relayNow(): number;
  snapshot<T>(v: T): T;
}

/** The critters' 3D moves: each one's glide and heading (`mos`, by its id), and the frame's readers. */
export function critterMotion3d(d: Motion3Deps) {
  interface Mo { g: Glide; yaw: number; out: number; t: number; off: number; xyz: [number, number, number]; ph: number; flap: number }
  const mos = new Map<string, Mo>();
  const moOf = (id: string, yaw: number): Mo => {
    let m = mos.get(id);
    if (!m) mos.set(id, (m = { g: new Glide(), yaw, out: yaw, t: performance.now(), off: 0, xyz: [0, 0, 0], ph: 0, flap: 0 }));
    return m;
  };
  const fishId = (f: Fish) => `fish-${f.water}-${f.n}`;
  const bugId = (b: Bug) => `bug-${b.n}`;
  /** Its 3D shadow's length (u: the model's, as assets.json scales shadow/*). */
  const len3 = (f: Fish) => (f.shape === 'fin' ? 64 : shadowLen(f.size, f.shape));
  /** Backed off from the float between nibbles (u, nose to float). */
  const NOSE_GAP = 2.4;
  /** A 3D model's fade out at the end of its leave (world3d/things.ts FADE_OUT_MS). */
  const FADE3_MS = 600;
  /** The shadow's middle now (the 2D sprite's, by its transition's curve). */
  const fishGlide = (id: string, f: Pick<Fish, 'x' | 'z' | 'ms' | 'flip' | 'dash' | 'spurt'>, t: number) =>
    moOf(id, yawOf(f.flip ? 1 : -1, 0)).g.to(t, f.x, f.z, 0, f.ms, f.dash ? EASE.dash : f.spurt ? EASE.spurt : EASE.swim).at(t);
  // What the 3D frame reads of a fish or a bug each frame (fish3, bug3, the yaw, flap and fade getters), mirrored off
  // its state proxy by an attachment (re-run as they change: {@attach mirrorFish(f)}): a proxy's every read boxes its
  // number and builds no plain field (~10 KB a frame, Chromium's heap sampling), read here from plain fields.
  interface FishSrc { id: string; x: number; z: number; ms: number; flip: boolean; dash: boolean; spurt: boolean; len: number }
  interface BugSrc {
    id: string; x: number; z: number; lift: number; ms: number; flip: boolean; gone: boolean; goneAt: number; fled: boolean; held: boolean;
    flight: Flight; legs: Leg[] | undefined; start: P3 | undefined; t0: number | undefined; perched: boolean; quick: boolean; rear: boolean; sat: boolean;
  }
  const fishSrc = new WeakMap<Fish, FishSrc>(), bugSrc = new WeakMap<Bug, BugSrc>();
  function mirrorFishNow(f: Fish): FishSrc {
    const o = fishSrc.get(f) ?? ({} as FishSrc);
    Object.assign(o, { id: fishId(f), x: f.x, z: f.z, ms: f.ms, flip: f.flip, dash: f.dash, spurt: !!f.spurt, len: len3(f) });
    fishSrc.set(f, o);
    return o;
  }
  function mirrorBugNow(b: Bug): BugSrc {
    const o = bugSrc.get(b) ?? ({} as BugSrc);
    Object.assign(o, {
      id: bugId(b), x: b.x, z: b.z, lift: b.lift, ms: b.ms, flip: b.flip, gone: b.gone, goneAt: b.goneAt ?? 0, fled: !!b.fled, held: !!b.held,
      flight: b.flight, legs: b.legs && d.snapshot(b.legs), start: b.start && d.snapshot(b.start), t0: b.t0,
      perched: b.sat && (b.place === 'trunk' || b.place === 'palm'), quick: b.id === 'honeybee' || b.flight === 'dart', rear: b.stalk === 'rear', sat: b.sat
    });
    bugSrc.set(b, o);
    return o;
  }
  const mirrorFish = (f: Fish) => () => void mirrorFishNow(f);
  const mirrorBug = (b: Bug) => () => void mirrorBugNow(b);
  // (before its attachment has run: read once, untracked, so the reader's own effect doesn't follow its fields)
  const srcFish = (f: Fish) => fishSrc.get(f) ?? untrack(() => mirrorFishNow(f));
  const srcBug = (b: Bug) => bugSrc.get(b) ?? untrack(() => mirrorBugNow(b));
  /** A nibble's bump of the nose on the float (0 … 1, at its height with the float's dip, a quarter in). */
  const bump = (n: number) => (n < 0.25 ? EASE.smooth(n / 0.25) : n < 0.6 ? 1 - EASE.smooth((n - 0.25) / 0.35) : 0);
  /** The 3D shadow's spot this frame (its nose: world x, z, lift) and its yaw (`out`). */
  function fish3(f: Fish): [number, number, number] {
    const s = srcFish(f), t = performance.now(), m = moOf(s.id, yawOf(s.flip ? 1 : -1, 0)), g = fishGlide(s.id, s, t);
    const dt = Math.min(100, Math.max(0, t - m.t));
    m.t = t;
    const c = d.line(), mine = !!c && c.fish === s.id, nose = d.nose();
    // its heading: at the float while it plays with my line (backing off, it never turns tail), else the way it swims
    // (kept while it's still)
    let want = m.yaw;
    if (c && mine) {
      if (Math.hypot(c.x - g.x, c.z - g.z) > 0.5) want = yawOf(c.x - g.x, c.z - g.z);
    } else if (g.done(t) < 1 && Math.hypot(g.tx - g.fx, g.tz - g.fz) > 0.5) want = yawOf(g.tx - g.fx, g.tz - g.fz);
    m.yaw = turn(m.yaw, want, dt, s.dash ? 80 : s.spurt ? 110 : 280);
    const hx = Math.sin(m.yaw), hz = -Math.cos(m.yaw), half = s.len / 2;
    if (c && mine && nose && nose.f === f && nose.n === d.lineN() && t >= nose.at) {
      // nose to the float: backed off NOSE_GAP, each nibble a bump onto it, the bite a lunge over it
      const gap = Math.hypot(c.x - g.x, c.z - g.z) - half;
      let off = (gap - NOSE_GAP) * EASE.smooth(Math.min(1, (t - nose.at) / 300));
      const n = (t - angling.nibble) / NIBBLE_MS;
      if (angling.nibble >= nose.at && n >= 0 && n < 1) off += NOSE_GAP * bump(n);
      if (c.phase === 'bite') off += (gap + half * 0.35 - off) * EASE.smooth(Math.min(1, (t - angling.bite) / PLUNGE_MS));
      m.off = off;
    } else m.off *= Math.exp(-dt / 140);
    // its tail: a quick wiggle darting off, a slow wag swimming
    const wag = s.dash ? Math.sin((t / 1000) * Math.PI * 2 * 7) * 0.42 : Math.sin((t / 1300) * Math.PI * 2) * (g.done(t) < 1 ? 0.07 : 0.035);
    m.out = m.yaw + wag;
    m.xyz[0] = g.x + hx * (half + m.off);
    m.xyz[1] = g.z + hz * (half + m.off);
    m.xyz[2] = -2.5;
    return m.xyz;
  }
  const fishYaw = (f: Fish) => ((s) => mos.get(s.id)?.out ?? yawOf(s.flip ? 1 : -1, 0))(srcFish(f));
  /** The 3D bug's spot this frame (world x, z, lift): on its itinerary, the itinerary's own curve (critterPath.ts bugAt:
   *  a butterfly's meander and bob, a hop's arc), turned the way it flies; off it (startled, leaving), its moves by
   *  the 3D island's curves, a lift-off rising first; netted, it holds still. */
  const flying: Flying = { x: 0, z: 0, lift: 0, vx: 0, vz: 0 };
  function bug3(bp: Bug): [number, number, number] {
    const b = srcBug(bp), t = performance.now(), m = moOf(b.id, b.flip ? Math.PI : 0);
    const dt = Math.min(100, Math.max(0, t - m.t));
    m.t = t;
    if (b.held && m.g.started) return m.xyz;
    let want = b.flip ? Math.PI : 0, ups = b.fled || b.gone ? 80 : 0;
    if (b.legs && b.start && b.t0 !== undefined) {
      const p = bugAt(b.flight, b.legs, b.start, d.relayNow() - b.t0, flying);
      ups = Math.hypot(p.vx, p.vz) * 1000;
      // (NH's models face their +z, as the fish's: yawOf)
      if (!b.perched) want = ups > 4 ? yawOf(p.vx, p.vz) : m.yaw;
      m.g.set(t, p.x, p.z, p.lift);
    } else {
      const g = m.g.to(t, b.x, b.z, b.lift, b.ms, b.fled || b.flight === 'dart' ? EASE.out : EASE.smooth, b.gone ? EASE.out : null).at(t);
      const dx = g.tx - g.fx, dz = g.tz - g.fz;
      if (!b.perched) want = g.done(t) < 1 && Math.hypot(dx, dz) > 0.5 ? yawOf(dx, dz) : m.yaw;
    }
    const g = m.g;
    m.out = m.yaw = turn(m.yaw, want, dt, 90);
    m.xyz[0] = g.x;
    m.xyz[1] = g.z;
    m.xyz[2] = g.l + (b.rear ? 3 : 0);
    // its wings (world3d/wings.ts wingBeat)
    wingBeat(m, dt, b.quick, b.sat, ups);
    return m.xyz;
  }
  const bugYaw = (bp: Bug) => ((b) => mos.get(b.id)?.out ?? (b.flip ? Math.PI : 0))(srcBug(bp));
  /** The dung beetle's snowball (NH: it rolls one; assets.json critters/dung-beetle-ball, BALL_U across): just before
   *  its head, its middle a radius up, rolled by the way it's gone (`roll`, radians about its axle, for the node's
   *  pitch). */
  const balls = new Map<string, { xyz: [number, number, number]; roll: number; x: number; z: number }>();
  function ball3(bp: Bug): [number, number, number] {
    const b = srcBug(bp), m = mos.get(b.id);
    let o = balls.get(b.id);
    if (!o) balls.set(b.id, (o = { xyz: [bp.ax, bp.az, BALL_U / 2], roll: 0, x: NaN, z: NaN }));
    if (!m) return o.xyz;
    const x = m.xyz[0] + Math.sin(m.yaw) * BALL_AHEAD, z = m.xyz[1] - Math.cos(m.yaw) * BALL_AHEAD;
    if (!Number.isNaN(o.x)) o.roll += Math.hypot(x - o.x, z - o.z) / (BALL_U / 2);
    [o.x, o.z] = [x, z];
    o.xyz[0] = x;
    o.xyz[1] = z;
    return o.xyz;
  }
  const ballRoll = (bp: Bug) => balls.get(srcBug(bp).id)?.roll ?? 0;
  /** The snowball's out of sight with its beetle: netted (held up) or leaving. */
  const ballOff = (bp: Bug) => srcBug(bp).held || bugOff(bp);
  /** Hidden in 3D: once it's leaving, over its leave's last FADE3_MS (it fades out as it goes). */
  const bugOff = (bp: Bug) => ((b) => b.gone && performance.now() >= b.goneAt + b.ms - FADE3_MS)(srcBug(bp));

  return { mos, fishId, bugId, len3, fishGlide, mirrorFish, mirrorBug, srcBug, fish3, fishYaw, bug3, bugYaw, bugOff, ball3, ballRoll, ballOff };
}
