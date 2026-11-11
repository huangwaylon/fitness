// The sky's two clouds move in the island's own frames (Island3D's onFrame), not as running CSS animations: an endless
// one keeps the compositor at the display's rate (Safari's at 60 Hz) while the canvas draws at 12 at rest (review
// 11/10 r1, C2). Their CSS `drift` stays (its keyframes, durations and phases): held, and its time set each STEP_MS.
// Their Animation objects are kept once the browser has made them: getAnimations() each frame flushed the style, the
// island's largest own cost at rest (8.5-13.6 ms a second at 4x CPU; review 11/10 r2, P5).
/** Each held cloud and its animations (empty till the browser makes them, or again once one's cancelled). */
const clouds = new Map<Element, Animation[]>();
/** A cloud's time is set again once the frame's has moved this far (ms): 3.7 px a second, 0.4 px. */
const STEP_MS = 100;
let setAt = -Infinity;

/** Step these elements' animations by stepClouds from now on; the release lets them run again. */
export function holdClouds(els: readonly Element[]): () => void {
  for (const el of els) clouds.set(el, []);
  setAt = -Infinity;
  return () => {
    for (const el of els) {
      clouds.delete(el);
      for (const a of el.getAnimations()) a.play();
    }
  };
}

/** Where the clouds are at `t` (performance.now's clock), as they'd have drifted from the page's start. (Their
 *  animations asked for while there are none: WebKit makes them only at the first style after the mount.) */
export function stepClouds(t: number): void {
  let fresh = false;
  for (const [el, anims] of clouds)
    if (!anims.length || anims.some((a) => a.playState === 'idle')) {
      const now = el.getAnimations();
      clouds.set(el, now);
      fresh ||= now.length > 0;
    }
  if (!fresh && Math.abs(t - setAt) < STEP_MS) return;
  setAt = t;
  for (const anims of clouds.values())
    for (const a of anims) {
      if (a.playState !== 'paused') a.pause();
      a.currentTime = t;
    }
}
