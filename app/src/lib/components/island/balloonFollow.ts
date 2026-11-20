// A speech balloon through a camera move (docs/design.md "Dialogue"): while a scroll, a pinch or a turn moves the camera
// the balloon (Talk.svelte, Says.svelte) stays whole and by its speaker, carried with them by a transform each of the
// camera's frames, and is placed again (placement.ts placeBy) once it settles. Every speaker is a box worked out from
// the camera (a SaySpeaker: a villager's tap area, a visitor's figure, a room's head projected), asked again each frame:
// no layout read. Plain TS.
import type { Side } from './placement.ts';
import type { SaySpeaker } from '#lib/world/say.ts';

type Pt = [number, number];
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The point of the speaker's box the balloon's tail aims at from `side` (Talk's and Says' at()): the head's top centre
 *  from above, the feet's from below, the facing edge's upper part from beside. */
export function aimOf(r: Rect, side: Side): Pt {
  const cx = (r.left + r.right) / 2, upper = r.top + Math.min(24, (r.bottom - r.top) * 0.3);
  if (side === 'top') return [cx, r.top];
  if (side === 'bottom') return [cx, r.bottom];
  return [side === 'left' ? r.left : r.right, upper];
}

/** How a placed balloon follows its speaker through a camera move: `aim` where its tail aimed when placed, `now()` where
 *  that point is in this frame (null: the speaker's gone). */
export function followOf(speaker: SaySpeaker, src: Rect, side: Side): { aim: Pt; now: () => Pt | null } {
  return { aim: aimOf(src, side), now: () => (speaker.isConnected ? aimOf(speaker.getBoundingClientRect(), side) : null) };
}
