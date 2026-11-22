// What the room engines (tent/engine.ts: the tent, the homes, the shop; museum/engine.ts) run alike: the entry hold,
// the frames' count and cost, the still faces' blink timer, the warm-up's timer (paused while the page is hidden), and
// a 3D villager's pose step and head. Each engine keeps what's its own: what it warms, when a face is due, the walkers.
import { Vector3 } from 'three';
import type { Villager3D } from '../villager3d/villager3d.ts';
import { headLook } from './lookAt.ts';
import { EYE_MARGIN, clampEye, headAnchor, type FirstPerson, type Rect } from './firstPerson.ts';
import { COST_FRAMES, ENTRY_HOLD_MS, type Insets, type Walk } from './view.ts';
import type { Pt } from '#lib/contract/live-protocol.ts';
import type { Who } from '#lib/types.ts';

/** What every room engine (tent/engine.ts Tent, museum/engine.ts Museum) answers alike: its canvas, the villagers'
 *  walks and places, the camera (the room's and my villager's eyes), the frames. `A`: who stands in it (the shop's
 *  twins `n:<id>` too, in a Tent). */
export interface RoomEngine<A extends string = Who> {
  /** The canvas's size changed (or what covers it). */
  resize(insets?: Insets): void;
  /** The camera at rest (no framing or view easing under way): the e2e's taps aim then. */
  still(): boolean;
  /** The model drawn for `who` (person3d's key: `v:<roster id>`, `p:…` a human player), null till one is in. */
  model(who: Who): string | null;
  /** Where a villager stands now (model units). */
  at(who: A): [number, number] | null;
  /** Walk a villager along `pts` from `from` (its spot now when left out), starting `ago` ms ago, at PACE. Returns
   *  the walk's length (ms). */
  walk(who: Who, pts: readonly Pt[], o?: { from?: Pt; ago?: number; ms?: number }): number;
  walking(who: Who): boolean;
  /** A villager turns toward a point (left or right) or hops (a tap on it); `holdMs`: it keeps facing it that long
   *  (a look into a wardrobe, a clock's line) before standing turns it to the camera again. */
  face(who: A, toward: Pt, holdMs?: number): void;
  hop(who: A): void;
  /** The top of a villager's head (model units; null: not in here): a speech balloon's anchor (Says, by way of the
   *  camera). */
  headPoint(who: A): [number, number, number] | null;
  /** A finger's move in the first-person view (px): the head turns. */
  look(dx: number, dy: number): void;
  /** The first-person view now (the e2e): wanted on, fully in, still gliding or easing, where it looks (radians), its
   *  lens (vertical degrees: the eyes' and the camera's now), the eye (model units). */
  fpv(): { on: boolean; inside: boolean; busy: boolean; yaw: number; pitch: number; fov: number; camFov: number; eye: [number, number, number] };
  /** The first person's lens wanted (vertical degrees: rooms/lens.svelte.ts), eased to; `snap`: at once (a room entered). */
  lens(deg: number, snap?: boolean): void;
  /** The characters' heads turned to the camera, or back to their poses (rooms/lookAt.ts カメラめせん; never at the eyes). */
  faceCam(on: boolean): void;
  /** Whether a model point is in front of the camera and on the canvas (a balloon's anchor: not behind the eyes). */
  inView(x: number, y: number, z: number): boolean;
  /** Turn the camera round the room's middle and tilt it (radians), zoom it (a factor: > 1 nearer); all clamped. */
  orbit(dAz: number, dPitch: number): void;
  zoom(f: number): void;
  /** Two fingers (rooms/gesture.ts RoomCam): the zoom about their middle, the pan by its move; and a fling on. */
  pinch(scale: number, dx: number, dy: number, mx: number, my: number): void;
  fling(vx: number, vy: number): void;
  /** Back to NH's view (eased); whether it's there. */
  resetView(): void;
  isDefault(): boolean;
  /** A gesture under way (a lighter pixel ratio while the camera moves). */
  moving(on: boolean): void;
  /** After each frame drawn (the scene's overlays that follow the camera: a speech balloon carried with its speaker). */
  onDrawn(fn: (() => void) | null): void;
  /** 0 day … 1 night: the light, and the lamps on. */
  night(n: number): void;
  /** A model point's client px (the e2e and the overlays). */
  client(x: number, y: number, z: number): [number, number];
  /** The first frame was drawn (the room on screen). */
  ready: Promise<void>;
  dispose(): void;
}

const now = () => performance.now();

/** The first frame waits for the villagers' models asked for by then (`track`), up to ENTRY_HOLD_MS: their programs
 *  (skinned, ~6) compile with the room's in that one frame, behind the door's black; drawn in a frame of their own once
 *  the room showed, they froze it (the iOS Simulator, cold: the tent 1039 ms after its first frame's 654, the museum
 *  768). A frame is asked for once the hold runs out. */
export function entryHold(invalidate: () => void) {
  let pending = 0;
  const born = now(), t = setTimeout(invalidate, ENTRY_HOLD_MS + 20);
  return {
    track<T>(p: Promise<T>): Promise<T> {
      pending++;
      return p.finally(() => pending--);
    },
    holding: (frames: number) => !frames && pending > 0 && now() - born < ENTRY_HOLD_MS,
    dispose: () => clearTimeout(t)
  };
}

/** The frames drawn, the last COST_FRAMES frames' cost (ms: the budget checks), and `ready` once the first is. */
export function frameLog() {
  let readyFn: () => void = () => {};
  const log = {
    frames: 0,
    cost: [] as number[],
    ready: new Promise<void>((r) => (readyFn = r)),
    drew(ms: number) {
      log.cost.push(ms);
      if (log.cost.length > COST_FRAMES) log.cost.shift();
      if (++log.frames === 1) readyFn();
    }
  };
  return log;
}

/** One timer to the next time a still face changes (a blink's start or end, a snore: villager3d nextBlink), `fire` then:
 *  not a check at a frame rate for as long as they stand. */
export function blinkTimer(fire: () => void) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return {
    /** In `next` ms (Infinity: none), the one before dropped. */
    soon(next: number) {
      clearTimeout(t);
      t = next < Infinity ? setTimeout(() => ((t = undefined), fire()), next + 2) : undefined;
    },
    clear: () => clearTimeout(t)
  };
}

/** The warm-up's timer: `run` `ms` after the last `soon` (while `can`: drawing, not disposed); `later` its steps on the
 *  same timer. Hidden mid-way, a step `hold`s: taken up again when shown (`resume`), not a timer every few ms the whole
 *  time (a frame asked for while hidden never comes). */
export function warmer(ms: number, run: () => void, can: () => boolean) {
  let t: ReturnType<typeof setTimeout> | undefined, held = false;
  const w = {
    /** Whether it's due. */
    soon(): boolean {
      clearTimeout(t);
      if (!can()) return false;
      t = setTimeout(run, ms);
      return true;
    },
    later(fn: () => void, after: number) {
      t = setTimeout(fn, after);
    },
    hold() {
      held = true;
    },
    resume() {
      if (held) (held = false), w.soon();
    },
    dispose: () => clearTimeout(t)
  };
  return w;
}

/** `fn` each time the page is shown again; the listener's removal. */
export function onShown(fn: () => void): () => void {
  const f = () => void (!document.hidden && fn());
  document.addEventListener('visibilitychange', f);
  return () => document.removeEventListener('visibilitychange', f);
}

/** What a room's walker has that the core's steps read. */
interface Stepped {
  pos: [number, number];
  was: [number, number];
  path: Walk | null;
  posing: boolean;
}

/** How far a walker went since the last frame (its `was` then moved on). */
export function stride(w: Stepped): number {
  const moved = Math.hypot(w.pos[0] - w.was[0], w.pos[1] - w.was[1]);
  w.was = [w.pos[0], w.pos[1]];
  return moved;
}

/** A 3D villager's state (a change: posed till it settles). */
export function stateTo(v: Villager3D, w: Stepped, state: Parameters<Villager3D['set']>[0]): void {
  if (v.state() !== state) w.posing = true;
  v.set(state);
}

/** A 3D villager's frame: posed while it moves (`busy`: a walk, a turn, a hop), settles (a state's crossfade, an action,
 *  once more after it stops) or the camera moves, its stride in its own units (`scale`: the room's units over the
 *  island's); else only its face (a blink). `cam`: the camera's place its head turns to (lookAt.ts カメラめせん; null:
 *  its pose's own, eased back; asleep, always). True while it wants frames. */
export function poseStep(v: Villager3D, w: Stepped, t: number, dt: number, moved: number, scale: number, busy: boolean, camMoved: boolean, cam: Vector3 | null = null): boolean {
  const posed = busy || w.posing || camMoved;
  if (posed) {
    const going = v.step(t, moved / scale, w.path ? (moved / scale / Math.max(1, dt)) * 1000 : 0);
    w.posing = busy || going;
  } else v.blink(t);
  const st = v.state();
  return headLook(v, st === 'nap' || st === 'doze' || st === 'prone' ? null : cam, dt, posed) || (posed && w.posing);
}

const headV = new Vector3();
/** Over a 3D villager's head bone as it moves now, `up` above it (NH's head joint is at the head's base), or null:
 *  no model, or none with a head. */
export function modelHead(v: Villager3D | null | undefined, up: number): [number, number, number] | null {
  const hb = v?.head();
  if (!hb) return null;
  v!.group.updateMatrixWorld(true);
  const p = hb.getWorldPosition(headV);
  return [p.x, p.y + up, p.z];
}

/** The first person's eye at a villager's: its model's eyes, else `guess` (written into the vector it's given), held
 *  once it's still (headAnchor: `rest` its still state's key, null walking: its idle never moves the camera), kept
 *  off the walls (`floors`: the eye stays over them) and what stands in its way (`solids`). One vector, reused. */
export function eyeFollow() {
  const eye = new Vector3(), xz: [number, number] = [0, 0], anchor = headAnchor();
  const head = (v3: Villager3D | null, guess: (out: Vector3) => Vector3) => {
    if (v3) {
      v3.group.updateMatrixWorld(true);
      if (v3.eyes(eye)) return eye;
    }
    return guess(eye);
  };
  return (t: number, rest: readonly number[] | null, v3: Villager3D | null, guess: (out: Vector3) => Vector3, floors: readonly Rect[], solids: readonly Rect[]): Vector3 => {
    eye.copy(anchor(t, rest, () => head(v3, guess)));
    clampEye(eye.x, eye.z, floors, solids, EYE_MARGIN, xz);
    eye.x = xz[0];
    eye.z = xz[1];
    return eye;
  };
}

/** The first-person view now (the e2e's `fpv`). */
export const fpvOf = (fp: FirstPerson, camera: { fov: number }) => ({ on: fp.on, inside: fp.inside(), busy: fp.busy(), yaw: fp.yaw, pitch: fp.pitch, fov: fp.fov, camFov: camera.fov, eye: [fp.eye.x, fp.eye.y, fp.eye.z] as [number, number, number] });
