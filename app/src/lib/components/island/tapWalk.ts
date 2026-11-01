// Tap-to-walk (spec §4, docs/design.md "Walking"): what a tap on the ground does with my villager, and the camera
// that keeps it in view. Pure: the scene hands in the projector (roll.ts through camera.svelte.ts) and the scroller;
// nothing here touches the DOM, so every rule is a unit test.
//   A tap → nav.ts snaps it (a building's door, a bank facing the water, the nearest walkable point) and finds the way;
//   my villager runs it at SPEED.run (walkGraph.ts: 200 u/s; idle strolls and visitors 90 u/s). The cream tap ring marks where it
//   ends. The camera follows while the walker or the destination is out of the band [HUD bottom + 80, vh − 90]: each
//   frame it eases (lerp 0.12) toward the camera that keeps the walker in the band and leans as far toward the
//   destination as that allows; snapping is off meanwhile and back 300 ms after arrival; any touch takes the camera
//   back. A far tap (θ > 35°, the target tiny near the horizon) eases the camera at once, whatever the band says.
import { findPath, pathLength, snapTap, type Extra, type Nav, type Snap } from './nav.ts';
import { horizonAhead, unproject, type RollParams } from './roll.ts';
import type { Pt, Surface } from './world.ts';
import { SPEED } from './walkGraph.ts';
import type { Cue } from '#lib/sound/cues.ts';

/** The follow band's margins (px): under the HUD's bottom, above the screen's foot. */
export const BAND_TOP = 80;
export const BAND_BOTTOM = 90;
/** The follow's per-frame ease. */
export const LERP = 0.12;
/** A tap further round the log than this (degrees) is far: the camera eases there first. */
const FAR_DEG = 35;
/** Snapping comes back this long after arrival (ms). */
export const SNAP_BACK_MS = 300;
/** The tap ring's life (ms): a cream ring, 34u, flattened like a shadow, shrinking out (IslandScene's .tap-ring). */
export const RING_MS = 400;

export interface TapPlan {
  /** Where the walk ends (snapped). */
  to: Pt;
  /** The waypoints after the start, ending at `to`. */
  pts: Pt[];
  /** The walk's length (u) and duration (ms) at the run. */
  len: number;
  ms: number;
  /** How the tap was snapped (here, door, bank, near), the building whose door it is, the face on arrival. */
  snap: Snap;
}

/** The walk a tap at world (x, z) starts from `from`, or null when it goes nowhere (nothing walkable near, no way
 *  there, or already there). */
export function planTap(g: Nav, from: Pt, x: number, z: number, extra?: Extra): TapPlan | null {
  const snap = snapTap(g, x, z, extra);
  if (!snap) return null;
  const to: Pt = [Math.round(snap.to[0]), Math.round(snap.to[1])];
  const pts = findPath(g, from, to, extra) ?? findPath(g, from, snap.to, extra);
  if (!pts) return null;
  const len = pathLength(from, pts);
  if (len < 2 && snap.kind !== 'door') return null;
  return { to: pts.at(-1)!, pts, len, ms: Math.round((len / SPEED.run) * 1000), snap };
}

// ---- the camera -------------------------------------------------------------------------------------------------------

/** The screen the follow works in: the projector, the pivot line and size (px), CSS px per unit, the HUD's bottom. */
export interface CamView {
  P: RollParams;
  pivot: number;
  vh: number;
  s: number;
  hudBottom: number;
}

/** The band (px from the scene's top) the walker should stay in. */
export const band = (v: CamView): [number, number] => {
  const top = v.hudBottom + BAND_TOP, bottom = v.vh - BAND_BOTTOM;
  // a very short screen: the band never inverts (its middle)
  return top < bottom ? [top, bottom] : [(top + bottom) / 2, (top + bottom) / 2];
};

/** How far ahead of the camera (world u along z) the ground at screen y lies (negative: behind it, below the pivot);
 *  null above the horizon. */
function aheadAt(v: CamView, sy: number): number | null {
  const w = unproject(0, (v.pivot - sy) / v.s, 0, v.P);
  return w ? w.z : null;
}

/** Whether world z is in the band for a camera at camZ (a point past the horizon isn't). */
export function inBand(v: CamView, camZ: number, z: number): boolean {
  const [top, bottom] = band(v), lo = aheadAt(v, bottom) ?? 0, hi = aheadAt(v, top) ?? horizonAhead(v.P) - 1;
  const d = z - camZ;
  return d >= lo && d <= hi;
}

/** The camera the follow eases toward: the walker kept in the band, leaning toward the destination as far as that
 *  allows (the destination in the band's middle when both fit), clamped to the scroller's range. */
export function followTarget(v: CamView, walkerZ: number, destZ: number, camMin: number, camMax: number): number {
  const [top, bottom] = band(v);
  const lo = aheadAt(v, bottom) ?? 0, hi = aheadAt(v, top) ?? horizonAhead(v.P) - 1, mid = aheadAt(v, (top + bottom) / 2) ?? (lo + hi) / 2;
  // the walker at the band's foot … at its top: the cameras that keep it in view
  const camLo = walkerZ - hi, camHi = walkerZ - lo;
  const want = Math.min(camHi, Math.max(camLo, destZ - mid));
  return Math.min(camMax, Math.max(camMin, want));
}

/** One frame of the follow: the next camera (lerp toward the target), or the target itself once within half a unit. */
export function followStep(camZ: number, target: number): number {
  const next = camZ + (target - camZ) * LERP;
  return Math.abs(target - next) < 0.5 ? target : next;
}

/** Whether a walk needs the camera: the walker or the destination out of the band, or the tap far round the log. */
export function needsFollow(v: CamView, camZ: number, walkerZ: number, destZ: number, theta?: number): boolean {
  return isFar(theta) || !inBand(v, camZ, walkerZ) || !inBand(v, camZ, destZ);
}

/** A tap far round the log (θ > 35°): its target is tiny, the camera eases there first. */
export const isFar = (theta: number | undefined): boolean => theta !== undefined && theta > (FAR_DEG * Math.PI) / 180;

/** The follow's lifecycle for one scroller: start on a walk that needs it, a frame each tick while walking, stop on
 *  arrival (snapping back SNAP_BACK_MS later) or on any touch. The scene owns the scroller; this owns the decisions. */
export class Follow {
  private dest: number | null = null;
  private snapTimer: ReturnType<typeof setTimeout> | undefined;
  constructor(private io: {
    /** The camera now, the scroller's range, and the view to project with. */
    cam: () => number;
    range: () => [number, number];
    view: () => CamView;
    /** Move the camera (the scroller's scrollTop) and turn its snapping off / back on. */
    moveTo: (camZ: number) => void;
    snap: (on: boolean) => void;
    /** Ask for frames (the World's kick). */
    kick: () => void;
  }) {}

  get active(): boolean {
    return this.dest !== null;
  }

  /** A walk set off toward destZ from walkerZ (θ: the tap's angle round the log, for the far rule). */
  start(walkerZ: number, destZ: number, theta?: number): boolean {
    if (!needsFollow(this.io.view(), this.io.cam(), walkerZ, destZ, theta)) return false;
    this.dest = destZ;
    clearTimeout(this.snapTimer);
    this.io.snap(false);
    this.io.kick();
    return true;
  }

  /** One frame (the World's tick): `walker` its feet's z now, `walking` whether it is still on the way. True: more
   *  frames wanted. */
  step(walkerZ: number, walking: boolean): boolean {
    if (this.dest === null) return false;
    if (!walking) {
      this.stop();
      return false;
    }
    const [lo, hi] = this.io.range(), cam = this.io.cam();
    const next = followStep(cam, followTarget(this.io.view(), walkerZ, this.dest, lo, hi));
    if (Math.abs(next - cam) > 0.05) this.io.moveTo(next);
    return true;
  }

  /** Arrival or a touch: the camera is the user's again; snapping comes back shortly. */
  stop(): void {
    if (this.dest === null) return;
    this.dest = null;
    clearTimeout(this.snapTimer);
    this.snapTimer = setTimeout(() => this.io.snap(true), SNAP_BACK_MS);
  }

  dispose(): void {
    clearTimeout(this.snapTimer);
    this.dest = null;
  }
}

// ---- footsteps ----------------------------------------------------------------------------------------------------------

/** A footstep's cue by the ground under the walker (world.ts surfaceAt): grass (snow in winter), sand, a dirt path, the
 *  shops' brick, the plaza's and the stone bridge's stone, the log bridge's and the dock's wood; a rainy day splashes
 *  on anything but wood; none in water (a wading frame never happens, but a walker caught at a bank stays silent). */
export function stepCue(surface: Surface, winter: boolean, rain: boolean): Cue | null {
  if (surface === 'sea' || surface === 'water') return null;
  if (surface === 'wood') return 'footstep-wood';
  if (rain) return 'footstep-splash';
  if (winter && (surface === 'grass' || surface === 'dirt')) return 'footstep-snow';
  if (surface === 'sand') return 'footstep-sand';
  if (surface === 'brick') return 'footstep-brick';
  if (surface === 'stone') return 'footstep-stone';
  return 'footstep-grass';
}
