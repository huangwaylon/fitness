// The touch rules the surfaces share (the island, the rooms, the charts, the HUD's exact taps): a finger's slop and a
// tap's length, and the scroll's physics, iOS's: the rubber band past an edge, the fling's decay inside it and past it,
// the speed a fling is over at (the island's scroll, world3d/engine.ts, and the rooms' pan, rooms/pan.ts). Pure.

/** A finger's travel (CSS px: iOS points at any pixel ratio) that makes a drag: the rooms' and the charts'. */
export const SLOP = 10;
/** The island's (world3d/gestures.ts, and the HUD's exact taps over it: ui-state/exactTaps.ts), as it was before the
 *  rooms had their rule: its one-finger scroll starts that much sooner. */
export const ISLAND_SLOP = 8;
/** How long a tap may be (ms: a press held longer and lifted in place is nothing). */
export const TAP_MS = 500;
/** The time of a pointer event (ms, performance.now()'s clock: its own, a made-up event's now): a busy frame between a
 *  press and its lift doesn't make a tap a hold. */
export const whenOf = (e: { timeStamp: number }): number => (e.timeStamp > 0 ? e.timeStamp : performance.now());

/** The rubber band's reach (px: past an edge it gives at most this), the fling's decay (ms: inside, and past an edge)
 *  and the speed a fling is over at (px/ms). */
export const REACH = 160, DECAY_MS = 325, DECAY_OUT_MS = 60, STOP_V = 0.01;
/** Past an edge by `over` px under the finger: shown this far (less and less, never REACH). */
export const rubber = (over: number): number => (over <= 0 ? 0 : (REACH * over) / (over + REACH));
