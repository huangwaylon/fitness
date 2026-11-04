// The rooms' first-person view (docs/design.md "First person"), shared by the tent's and the museum's engines: the
// camera at my villager's eyes, a finger turning the head (yaw and pitch, clamped, smoothed: the player's alone, a walk
// never turns it), and the short glide between it and the room's own camera. Its math is plain; the camera's blend is three's.
// The engine places the room's camera first (its orbit), then apply() takes it toward the eyes by the blend.
import { Euler, Vector3, type PerspectiveCamera } from 'three';

/** The lens (vertical degrees): a head's, not the rooms' long 32°. */
export const FOV = 70;
/** How far the head tilts up or down (radians): about 60°. */
export const PITCH_LIMIT = (60 * Math.PI) / 180;
/** Looking a little down to start with (the floor to tap on in view). */
export const START_PITCH = (-12 * Math.PI) / 180;
/** A finger's px → radians: a drag across the whole canvas turns the head the lens's 70° (0.18° a px on a 390 px
 *  phone; a narrow canvas counts as 240 px). */
export const lookPerPx = (width: number): number => (FOV * Math.PI) / 180 / Math.max(240, width);
/** The near plane at the eyes (model units: a villager is 16): the eye is kept EYE_MARGIN off anything. */
export const NEAR = 1;
/** How far the eye stays from a wall or a tall thing (model units). */
export const EYE_MARGIN = 3;
/** The glide between the room's camera and the eyes (ms). */
export const BLEND_MS = 450;
/** The head's smoothing (ms: light, no inertia), the eye's following it (ms: across, and up and down: the walk's bob
 *  damped). */
const LOOK_TC = 45, EYE_TC = 40, EYE_TC_Y = 140;

export interface Rect { x0: number; x1: number; z0: number; z1: number }

export const clampPitch = (p: number): number => Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));
export const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * The eye (x, z) kept off what it could see into: out of each `solid` rect grown by `m` (by its nearest side), and in
 * one of the `inside` rects shrunk by `m` (the rooms' floors and the openings between them; none: anywhere), to the
 * nearest point of the nearest when out of all. `out` is written and returned (no allocation in a frame).
 */
export function clampEye(x: number, z: number, inside: readonly Rect[], solid: readonly Rect[], m: number, out: [number, number]): [number, number] {
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const r of solid) {
      const x0 = r.x0 - m, x1 = r.x1 + m, z0 = r.z0 - m, z1 = r.z1 + m;
      if (x <= x0 || x >= x1 || z <= z0 || z >= z1) continue;
      const l = x - x0, rr = x1 - x, n = z - z0, f = z1 - z, k = Math.min(l, rr, n, f);
      if (k === l) x = x0;
      else if (k === rr) x = x1;
      else if (k === n) z = z0;
      else z = z1;
      moved = true;
    }
    if (inside.length) {
      let best = Infinity, bx = x, bz = z;
      for (const r of inside) {
        const cx = Math.max(r.x0 + m, Math.min(r.x1 - m, x)), cz = Math.max(r.z0 + m, Math.min(r.z1 - m, z));
        const d = (cx - x) ** 2 + (cz - z) ** 2;
        if (d < best) (best = d), (bx = cx), (bz = cz);
        if (!d) break;
      }
      if (best > 0) (x = bx), (z = bz), (moved = true);
    }
    if (!moved) break;
  }
  out[0] = x;
  out[1] = z;
  return out;
}

/** How long a villager's head is followed after it last moved (ms: the walk's end into its idle, a sit down), before
 *  the eye is held. */
export const SETTLE_MS = 900;

/**
 * The eye's anchor: the head as posed while my villager walks (or turns, sits, gets up) and for SETTLE_MS after, then
 * held while it stays put, so the idle's breath and sway never move the camera (at rest the eyes draw nothing). `rest`
 * is what it stands as (x, z, yaw, its seat or pose: any number), null while walking; `head` reads the posed head.
 */
export function headAnchor(): (now: number, rest: readonly number[] | null, head: () => Vector3) => Vector3 {
  const held = new Vector3(), key: number[] = [];
  let since = -Infinity, fresh = false;
  return (now, rest, head) => {
    const same = !!rest && fresh && rest.length === key.length && rest.every((v, i) => Math.abs(v - key[i]) < 1e-3);
    if (!same) {
      since = now;
      key.length = 0;
      if (rest) key.push(...rest);
      fresh = !!rest;
    }
    if (!same || now - since < SETTLE_MS) held.copy(head());
    return held;
  };
}

export interface FirstPerson {
  /** Wanted on (the glide may be under way). */
  readonly on: boolean;
  /** 0 the room's camera … 1 at the eyes. */
  readonly mix: number;
  /** Where the head looks (radians: yaw as a villager's, its forward (sin, cos); pitch up +). */
  readonly yaw: number;
  readonly pitch: number;
  /** The eye where the camera stands (once on). */
  readonly eye: Vector3;
  /** On or off; `yaw` the way to look on (the villager's facing); `snap`: there at once (coming in through the door). */
  set(on: boolean, now: number, yaw: number, snap?: boolean): void;
  /** A finger's move (px, on a canvas `width` px wide): the head turns (drag the world: right turns left, down looks
   *  up). Once on, the only thing that turns it. */
  look(dx: number, dy: number, width: number): void;
  /** One frame: the glide, the head eased to where it's wanted, the eye toward `eye` (already kept off the walls; a
   *  walk moves the eye, never turns the head). True while the camera moves (a frame wanted). */
  step(now: number, dt: number, eye: Vector3): boolean;
  /** Fully at the eyes (the walls all stand, the ceilings show). */
  inside(): boolean;
  /** The glide or the head still easing. */
  busy(): boolean;
  /** The room's camera (as its engine placed it, looking at `target`, lens `fov`, near plane `near`) taken toward the
   *  eyes by the blend: its place eased to the eye, what it looks at to where the eyes look (the room stays in view on
   *  the way), its lens and its near plane with them. */
  apply(camera: PerspectiveCamera, fov: number, near: number, target: Vector3): void;
}

const smooth = (k: number) => k * k * (3 - 2 * k);
/** How far ahead of the eyes the glide's camera looks (model units: about the room's middle from a wall). */
const LOOK_AT = 30;

export function firstPerson(): FirstPerson {
  let on = false, mix = 0, from = 0, t0 = 0, yaw = 0, pitch = START_PITCH, wantYaw = 0, wantPitch = START_PITCH;
  let placed = false, easing = false;
  const eye = new Vector3();
  const e = new Euler(0, 0, 0, 'YXZ'), at = new Vector3();
  return {
    get on() {
      return on;
    },
    get mix() {
      return mix;
    },
    get yaw() {
      return yaw;
    },
    get pitch() {
      return pitch;
    },
    eye,
    set(v, now, y, snap = false) {
      if (v && !on) {
        yaw = wantYaw = wrapAngle(y);
        pitch = wantPitch = START_PITCH;
        if (mix === 0) placed = false;
      }
      on = v;
      from = mix;
      t0 = now;
      if (snap) mix = from = v ? 1 : 0;
    },
    look(dx, dy, width) {
      if (!on) return;
      const k = lookPerPx(width);
      wantYaw = wrapAngle(wantYaw + dx * k);
      wantPitch = clampPitch(wantPitch + dy * k);
      easing = true;
    },
    step(now, dt, to) {
      let moved = false;
      const goal = on ? 1 : 0;
      if (mix !== goal) {
        const k = Math.min(1, (now - t0) / (BLEND_MS * Math.max(0.2, Math.abs(goal - from))));
        mix = k >= 1 ? goal : from + (goal - from) * k;
        moved = true;
      }
      if (!on && !mix) return moved;
      if (easing) {
        const a = 1 - Math.exp(-dt / LOOK_TC), dy = wrapAngle(wantYaw - yaw), dp = wantPitch - pitch;
        if (Math.abs(dy) < 1e-4 && Math.abs(dp) < 1e-4) {
          yaw = wantYaw;
          pitch = wantPitch;
          easing = false;
        } else {
          yaw = wrapAngle(yaw + dy * a);
          pitch += dp * a;
        }
        moved = true;
      }
      if (!placed) {
        eye.copy(to);
        placed = moved = true;
      } else {
        const dx = to.x - eye.x, dy = to.y - eye.y, dz = to.z - eye.z;
        if (dx * dx + dy * dy + dz * dz > 1e-4) {
          const a = 1 - Math.exp(-dt / EYE_TC), b = 1 - Math.exp(-dt / EYE_TC_Y);
          eye.x += dx * a;
          eye.y += dy * b;
          eye.z += dz * a;
          moved = true;
        } else eye.copy(to);
      }
      return moved;
    },
    inside: () => on && mix >= 1,
    busy: () => mix !== (on ? 1 : 0) || easing,
    apply(camera, fov, near, target) {
      const k = smooth(mix);
      if (k >= 1) {
        camera.position.copy(eye);
        camera.quaternion.setFromEuler(e.set(pitch, yaw + Math.PI, 0));
      } else if (k > 0) {
        // (where the eyes look: LOOK_AT ahead of them)
        const c = Math.cos(pitch);
        at.set(eye.x + Math.sin(yaw) * c * LOOK_AT, eye.y + Math.sin(pitch) * LOOK_AT, eye.z + Math.cos(yaw) * c * LOOK_AT);
        camera.position.lerp(eye, k);
        camera.lookAt(at.sub(target).multiplyScalar(k).add(target));
      }
      camera.fov = fov + (FOV - fov) * k;
      // (the near plane comes in geometrically: halfway down, still far enough for the depth's precision)
      camera.near = near ** (1 - k) * NEAR ** k;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
    }
  };
}

/** The camera's heading about the up axis (the rooms' az: it looks along −(sin, cos)), for what turns to face it. */
export function camAz(camera: PerspectiveCamera, tmp: Vector3): number {
  camera.getWorldDirection(tmp);
  return Math.atan2(-tmp.x, -tmp.z);
}
