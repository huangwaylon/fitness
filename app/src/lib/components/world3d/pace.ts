// What keeps the 3D island's frames coming for the island's own life drawn by its models' `live` positions (a critter
// swimming, darting, fading: Critters.svelte), read by the effects' frame (effects.ts) each frame: `ambient` > 0 the
// ambient rate at least (a shadow drifting: the engine's 30 a second), `full` > 0 the full rate (a dart, a fade, a
// nibble). `slow`: a slow move (under SLOW_PX on screen) or one off screen may be ambience (Island3D: not where the
// ambience is a software renderer's few frames). Plain values, no dependencies (the island's chunk imports this, not three.js).
export const pace = { ambient: 0, full: 0, slow: true };
/** A move slower than this on screen (px/s) is ambience: drawn at the ambient rate, not the full one. */
export const SLOW_PX = 60;

/** A point on screen (px from the scene's top-left) and whether it's in front of the camera. */
interface OnScreen { sx: number; sy: number; visible: boolean }
/** Whether a move is drawn at the full rate: one with no model to start from, no time, or that fled (a startled bug),
 *  else one with an end on screen (an 80 px margin) going at least SLOW_PX a second there (`from`: where its model is
 *  now, `to`: where it goes, in `ms`). A dart or a hop is judged by its speed too: these never pause, and forced to the
 *  full rate they held the resting island at 30 frames a second, not 12-20, while most crossed under 60 px a second. */
export function moveFast(ms: number, fled: boolean, from: OnScreen | null, to: OnScreen, view: { vw: number; vh: number }): boolean {
  if (!from || ms <= 0 || fled) return true;
  const on = (s: OnScreen) => s.visible && s.sx > -80 && s.sx < view.vw + 80 && s.sy > -80 && s.sy < view.vh + 80;
  return (on(from) || on(to)) && (Math.hypot(from.sx - to.sx, from.sy - to.sy) / ms) * 1000 >= SLOW_PX;
}

/** The display frames the pacers have asked for, all told (the log's perf.rest: wake-ups a second at rest). */
export const wakes = { n: 0 };
/** Half a 60 Hz vsync's slack (ms): a display frame this early is on time. */
const SLACK = 6;
/** What the pacer runs on (the page's; a test's own clock). */
export interface PaceClock {
  raf(fn: (t: number) => void): number;
  caf(id: number): void;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  now(): number;
}
const PAGE: PaceClock = {
  raf: (fn) => requestAnimationFrame(fn),
  caf: (id) => cancelAnimationFrame(id),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  now: () => performance.now()
};
/** A 3D engine's frames (the island's, the tent's, the museum's and the small stages': docs/design.md "Frame rate"). `kick()`: a frame at
 *  the next display frame (a change from outside; something moving: the full rate's next, checked by `due`). `later(fps)`:
 *  the ambience's next, `1000 / fps` after the last ambient one was due: a timer to just before, then the display frame
 *  it's due on; no display frames woken in between. In the frame, `due(vsync, fps)` says whether to draw on this
 *  display frame (else the next is asked for): a kick at `fps` after the last drawn (0: at once), a later() at its own
 *  time. The ambience's times run on from each other, not from the frame drawn: a page with nothing else drawing has
 *  its rAF at once after the timer, not at a vsync, so frames timed from the last drawn came 27-30 ms apart (the
 *  museum drew 33.5 a second, not 30); timed from the last one's due time they average the rate exactly. */
export function pacer(frame: (vsync: number) => void, clock: PaceClock = PAGE) {
  let raf = 0, timer: unknown = 0, last = 0, paced = false;
  /** When the next ambient frame is due, and when the last one was (its due time, not its vsync). */
  let target = 0, anchor = 0, period = 0;
  const tick = (vsync: number) => {
    raf = 0;
    frame(vsync);
  };
  const ask = () => {
    if (raf) return;
    raf = clock.raf(tick);
    wakes.n++;
  };
  const unTime = () => {
    if (timer) clock.clearTimeout(timer);
    timer = 0;
  };
  return {
    kick() {
      paced = false;
      unTime();
      ask();
    },
    later(fps: number) {
      if (raf || timer) return;
      period = 1000 / fps;
      // (from the last due time when the last frame was the ambience's own and on time, else from the last drawn)
      target = Math.max(anchor + period, last + period - SLACK);
      paced = true;
      // (the timer a little inside the slack: a rAF at once after it is due on it, one at a vsync on the vsync due; 10 ms
      // early, the rAF at once came before the slack and asked for another: two wake-ups an ambient frame)
      const ms = target - clock.now() - (SLACK - 1);
      if (ms <= 4) ask();
      else timer = clock.setTimeout(() => {
        timer = 0;
        ask();
      }, ms);
    },
    due(vsync: number, fps: number): boolean {
      const ok = paced ? vsync >= target - SLACK : !fps || !last || vsync - last >= 1000 / fps - SLACK;
      if (!ok) {
        ask();
        return false;
      }
      // (an ambient frame late by over half its period starts the times afresh: after a pause, a busy main thread)
      anchor = paced && vsync - target < period / 2 ? target : vsync;
      paced = false;
      last = vsync;
      return true;
    },
    /** A display frame is asked for by a change (a kick, or one put off by `due`), not the ambience's own (its timer, or
     *  the display frame it's due on: a slow frame's ambience at 30 a second asks for the next at once, and the museum,
     *  only its tanks moving, never read as still in WebKit drawn). */
    asked: () => !!raf && !paced,
    /** A frame of either kind is coming. */
    queued: () => !!raf || !!timer,
    stop() {
      if (raf) clock.caf(raf);
      raf = 0;
      unTime();
    }
  };
}
