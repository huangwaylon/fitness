// A speech balloon through a camera move (docs/design.md "Dialogue"): while a scroll, a pinch or a turn moves the camera
// the balloon (Talk.svelte, Says.svelte) stays whole and by its speaker, carried with them by a transform each of the
// camera's frames, and is placed again (placement.ts placeBy) once it settles. No layout read in the frame: the
// speaker's point comes from the camera. On the island a speaker is an element inside a world node (camera.svelte.ts
// World.frameOf: the node's origin and scale on screen, worked out from the 3D camera); a point measured in it once is
// carried by the node's map. A room's speaker (a SaySpeaker box, its villager's head projected) is asked again.
// Plain TS.
import type { Side } from './placement.ts';
import type { SaySpeaker } from '#lib/world/say.ts';

type Pt = [number, number];
/** A world node's map on screen: its origin in client px and its scale across and up (translate(x, y) scale(kx, ky)). */
export interface NodeFrame {
  x: number;
  y: number;
  kx: number;
  ky: number;
}
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

/** A point measured in a node's element while it stood at `f0`, where it is at `f1`. */
export function carry(p: Pt, f0: NodeFrame, f1: NodeFrame): Pt {
  return [f1.x + ((p[0] - f0.x) * f1.kx) / (f0.kx || 1), f1.y + ((p[1] - f0.y) * f1.ky) / (f0.ky || 1)];
}

/** How a placed balloon follows its speaker through a camera move: `aim` where its tail aimed when placed, `now()` where
 *  that point is in this frame (null: it can't say). Null altogether when the speaker can't be followed without a layout
 *  read (an element outside every world node): such a balloon steps aside till the camera settles. */
export function followOf(speaker: SaySpeaker, src: Rect, side: Side, frameOf?: (el: Element) => (() => NodeFrame | null) | null): { aim: Pt; now: () => Pt | null } | null {
  const aim = aimOf(src, side);
  if (typeof Element !== 'undefined' && speaker instanceof Element) {
    const frame = frameOf?.(speaker), f0 = frame?.();
    if (!frame || !f0) return null;
    return { aim, now: () => ((f) => f && carry(aim, f0, f))(frame()) };
  }
  // (a room's speaker: its box is worked out from the camera each time)
  return { aim, now: () => (speaker.isConnected ? aimOf(speaker.getBoundingClientRect(), side) : null) };
}
