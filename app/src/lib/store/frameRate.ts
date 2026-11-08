// The 3D engines' full frame rate (docs/design.md "Frame rate"): the island, the rooms and the museum draw at most 30
// a second (half the GPU and CPU work of 60). The ambience stays at ≤ 30 and a still scene draws nothing.

export const FPS = 30;

/** Whether a display frame at `t` (its rAF time, ms) is due at `fps` after the last drawn at `last` (0: none yet). Half
 *  a 60 Hz vsync's slack less than the interval: at 30 on a 60 Hz screen every other vsync, an even cadence (never 2-3);
 *  at 60 every one (a 120 Hz screen: every other). */
export const due = (t: number, last: number, fps: number): boolean => !last || t - last >= 1000 / fps - 6;
