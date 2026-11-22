// A room's instrument played outdoors (island/decor.svelte.ts: walked up to, then its riff), this phone's alone as in
// the rooms (tent/TentRoom.svelte actAt): which villager plays what, the 3D island holding its pose (tent/playPose.ts,
// world3d/villagers.ts) till it's over or the villager walks off. Each play numbered, so the renderer starts its clock
// on a new one.
import type { Act } from '../tent/toggles.ts';

export interface Play {
  fam: Act;
  ms: number;
  /** Which way it faces while it plays (three's yaw: toward the instrument, or the camera holding one). */
  yaw: number;
  n: number;
  /** When it started (Date.now): a walk in its first moments is the one that just got there. */
  at: number;
}
const plays: Record<string, Play | undefined> = {};
let n = 0;
/** `slot` plays `fam` for `ms`, facing `yaw`. */
export function startPlay(slot: string, fam: Act, ms: number, yaw: number): void {
  plays[slot] = { fam, ms, yaw, n: ++n, at: Date.now() };
}
/** What `slot` plays (null: nothing, or it walked off since: `walking` ends it). */
export function playOf(slot: string, walking: boolean): Play | null {
  const p = plays[slot];
  if (walking && p && Date.now() - p.at > 300) plays[slot] = undefined;
  return plays[slot] ?? null;
}
/** Its play over (the renderer, at its end). */
export const endPlay = (slot: string, p: Play): void => void (plays[slot] === p && (plays[slot] = undefined));
