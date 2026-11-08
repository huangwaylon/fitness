// The casts on the 3D island (docs/design.md "Fishing"): what each villager's line is doing now (mine, and the others'
// as their phones tell it: "Shared world"), for its 3D villager's rod
// (world3d/villagers.ts: it faces the float, casts, tugs at the bite, reels in) and for the float's own motion
// (floatLift: Critters' bobber node reads it each frame). Critters.svelte, which runs the fishing (its timers are the one
// source of truth: the 2D float's CSS and the 3D float play the same moments), says each step; plain module state, read
// in the island's frames (nothing reactive: the frames poll it).
//   cast   the line flies out (the cast's swing)        wait   the float is on the water (bobbing; a nibble dips it)
//   bite   the float went under (the rod's tip yanked)   reel   reeled in (a catch or nothing): the rod comes up
import { hermite } from '#lib/math.ts';
export type Phase = 'cast' | 'wait' | 'bite' | 'reel';

/** A villager's line: its step, where its float is (world x, z) and a count of steps; when the float landed, its last
 *  nibble and the bite (performance.now() ms; −Infinity: not yet), and the nibbles so far. */
export interface Angling {
  phase: Phase | null; x: number; z: number; n: number;
  landed: number; nibble: number; bite: number; nibbles: number;
}
/** Each villager's line by its slot (`mine`, and the others' as their phones tell it: Critters' `fish` steps). */
const anglers = new Map<string, Angling>();
/** The line of the villager in `slot` (made idle the first time). */
export function anglerOf(slot = 'mine'): Angling {
  let a = anglers.get(slot);
  if (!a) anglers.set(slot, (a = { phase: null, x: 0, z: 0, n: 0, landed: -Infinity, nibble: -Infinity, bite: -Infinity, nibbles: 0 }));
  return a;
}
/** My line. */
export const angling: Angling = anglerOf('mine');

/** The line's step now, and where its float is (world x, z); null: no line out (it got away, or nobody's fishing). */
export function angle(phase: Phase | null, at?: { x: number; z: number }, slot = 'mine'): void {
  const a = anglerOf(slot);
  if (at) {
    a.x = at.x;
    a.z = at.z;
  }
  if (phase === a.phase) return;
  const now = performance.now();
  if (phase === 'wait' && a.phase !== 'wait') a.landed = now;
  if (phase === 'bite') a.bite = now;
  if (phase === 'cast' || phase === null) {
    a.landed = a.nibble = a.bite = -Infinity;
    a.nibbles = 0;
  }
  a.phase = phase;
  a.n++;
  poke?.();
}

let poke: (() => void) | null = null;
/** The 3D island hears each step (a frame for it: the bite's 「！」 pops in at once, the island idle or not); null: gone. */
export function onAngle(fn: (() => void) | null): void {
  poke = fn;
}

/** A nibble (or the line's twitch at an early tap): the float dips. */
export function nibbled(slot = 'mine'): void {
  const a = anglerOf(slot);
  a.nibble = performance.now();
  a.nibbles++;
}

/** The 2D float's moves (Critters.svelte's CSS: bob, the nibble's twitch, plunge), in world units up. */
const BOB_U = 0.6, BOB_MS = 1500, UNDER_U = -7;
/** A nibble's dip and the bite's plunge (ms): the fish's nose bumps the float and lunges onto it on the same beats
 *  (Critters.svelte's 3D shadow). */
export const NIBBLE_MS = 380, PLUNGE_MS = 220;
/** A nibble's dip over its 380 ms: down 0.9u by a quarter, back to −0.2u by 55 %, up (the 2D keyframes). */
function dip(k: number): number {
  if (k < 0.25) return -0.9 * (k / 0.25);
  if (k < 0.55) return -0.9 + 0.7 * ((k - 0.25) / 0.3);
  return -0.2 * (1 - (k - 0.55) / 0.45);
}

/** The float's height over the water at `t` (ms): bobbing gently while it waits, a quick dip at each nibble; at the bite
 *  a little hop and a plunge under (and under it stays). */
export function floatLift(t: number, slot = 'mine'): number {
  const a = anglerOf(slot);
  if (a.phase === 'bite') {
    const k = (t - a.bite) / PLUNGE_MS;
    if (!(k < 1)) return UNDER_U;
    return k < 0.3 ? 1.6 * hermite(k / 0.3) : 1.6 + (UNDER_U - 1.6) * hermite((k - 0.3) / 0.7);
  }
  if (a.phase !== 'wait') return 0;
  const since = t - a.landed;
  // (the bob eases in from the landing: a float at rest when it touches down)
  const bob = since > 0 ? -Math.cos((since / BOB_MS) * Math.PI) * BOB_U * Math.min(1, since / 400) : 0;
  const n = (t - a.nibble) / NIBBLE_MS;
  return bob + (n >= 0 && n < 1 ? dip(n) : 0);
}
