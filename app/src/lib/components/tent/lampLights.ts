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

/** The lamps to light, at most `n`, nearest `mid` first: all of them when they're few; else spread over the room (the
 *  nearest the middle, then each the lamp farthest from those chosen), so a large room's far ends aren't left dark
 *  while the lamps round its middle share the lights. */
export function spread<T>(lamps: readonly T[], at: (l: T) => readonly [number, number], mid: readonly [number, number], n: number, key: (l: T) => string): T[] {
  const d = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  // (a tie by its key: the same lights on every phone, whatever order its lamps loaded in)
  const near = [...lamps].sort((a, b) => d(at(a), mid) - d(at(b), mid) || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  if (near.length <= n) return near;
  const out = near.slice(0, 1), gap = near.map((l) => d(at(l), at(out[0])));
  while (out.length < n) {
    let best = -1;
    for (let i = 0; i < near.length; i++) if (gap[i] > 0 && (best < 0 || gap[i] > gap[best])) best = i;
    if (best < 0) break;
    out.push(near[best]);
    for (let i = 0; i < near.length; i++) gap[i] = Math.min(gap[i], d(at(near[i]), at(near[best])));
  }
  return out.sort((a, b) => near.indexOf(a) - near.indexOf(b));
}

/** `k` a frame of `dt` ms toward `to`. */
export const fade = (k: number, to: number, dt: number): number =>
  to > k ? Math.min(to, k + dt / FADE_MS) : Math.max(to, k - dt / FADE_MS);

/** A fade's 0…1 eased (smoothstep): no kink at either end. */
export const eased = (k: number): number => k * k * (3 - 2 * k);
