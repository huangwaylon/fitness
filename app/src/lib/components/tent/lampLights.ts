// The rooms' few real lamp lights (tent/engine.ts lights): a fixed set of point lights (the programs compile once, for
// that count) handed to the lamps that want one, each faded in and out, never popped (decisions "Lights in depth").

/** A point light's fade in or out (ms). */
export const FADE_MS = 400;

/** A point light: whose lamp it is (kept after it fades out, till another takes it), how lit it is, where it's going. */
export interface Slot {
  id: string | null;
  k: number;
  to: number;
}

/** Give the lights to the lamps in `want` (nearest first, at most one a light): a light keeps its lamp while that's
 *  wanted (back up from where it is, if it was fading out); a lamp new to the set takes a dark one (faded out, or never
 *  lit); the others fade out first, so a light never jumps lit from one lamp to another. */
export function assign(slots: Slot[], want: readonly string[]): void {
  const wanted = new Set(want);
  for (const s of slots) s.to = s.id !== null && wanted.has(s.id) ? 1 : 0;
  const held = new Set(slots.filter((s) => s.to).map((s) => s.id));
  for (const id of want) {
    if (held.has(id)) continue;
    const dark = slots.find((s) => !s.to && !s.k);
    if (!dark) break;
    dark.id = id;
    dark.to = 1;
  }
}

/** `k` a frame of `dt` ms toward `to`. */
export const fade = (k: number, to: number, dt: number): number =>
  to > k ? Math.min(to, k + dt / FADE_MS) : Math.max(to, k - dt / FADE_MS);

/** A fade's 0…1 eased (smoothstep): no kink at either end. */
export const eased = (k: number): number => k * k * (3 - 2 * k);
