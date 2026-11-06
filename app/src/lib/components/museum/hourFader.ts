// The museum's hour (docs/design.md "The museum"): each wing shows the hour's pick of what's been found (species.ts
// hourOf, onDisplay; bugShow.ts), and as the hour turns what it drops fades out and the new ones in where they're on
// screen, at once where not. One rule for the aquarium (aquarium.ts) and the bug wing (garden.ts).
//   const h = hourWatch(clock)  ·  h.tick(t) → true when the hour turned (the clock read once a second)  ·  h.hour
//   fadeStep(fade, dir, dt, on) → the next fade  ·  fadeMaterial(m, k)  ·  ditherMaterial(m, on)
import type { Material } from 'three';
import { hourOf } from './species.ts';

/** How long a specimen takes to fade out or in as the hour's pick changes (s). */
export const FADE = 1.6;
/** How often the clock is read for a new hour (ms of frame time). */
const HOUR_CHECK_MS = 1000;

/** The hour on `clock` (Tokyo's), watched from the frames. */
export function hourWatch(clock: () => number): { readonly hour: number; tick(t: number): boolean } {
  let hour = hourOf(clock()), checked = -Infinity;
  return {
    get hour() {
      return hour;
    },
    tick(t) {
      if (t - checked < HOUR_CHECK_MS) return false;
      checked = t;
      const h = hourOf(clock());
      if (h === hour) return false;
      hour = h;
      return true;
    }
  };
}

/** A fade (0 gone … 1 there) `dt` ms on, going `dir` (1 in, −1 out): on screen over FADE, off screen over at once. */
export const fadeStep = (fade: number, dir: number, dt: number, on: boolean): number =>
  Math.max(0, Math.min(1, on ? fade + (dir * dt) / 1000 / FADE : dir > 0 ? 1 : 0));

/** A material dithered (alphaHash: still opaque and unsorted) or solid again, recompiled only when that changes. */
export function ditherMaterial(m: Material, on: boolean): void {
  if (m.alphaHash === on) return;
  m.alphaHash = on;
  m.needsUpdate = true;
}

/** A material `k` in: dithered only while it fades, solid again after. */
export function fadeMaterial(m: Material, k: number): void {
  ditherMaterial(m, k < 1);
  m.opacity = k;
}
