// The sky's two clouds move in the island's own frames (Island3D's onFrame), not as running CSS animations: an endless
// one keeps the compositor at the display's rate (Safari's at 60 Hz) while the canvas draws at 12 at rest (review
// 11/10 r1, C2). Their CSS `drift` stays (its keyframes, durations and phases): held, and its time set each frame.
const clouds = new Set<Element>();

/** Step these elements' animations by stepClouds from now on; the release lets them run again. */
export function holdClouds(els: readonly Element[]): () => void {
  for (const el of els) clouds.add(el);
  return () => {
    for (const el of els) {
      clouds.delete(el);
      for (const a of el.getAnimations()) a.play();
    }
  };
}

/** Where the clouds are at `t` (performance.now's clock), as they'd have drifted from the page's start. (Their
 *  animations asked for each time: WebKit makes them only at the first style after the mount.) */
export function stepClouds(t: number): void {
  for (const el of clouds)
    for (const a of el.getAnimations()) {
      if (a.playState !== 'paused') a.pause();
      a.currentTime = t;
    }
}
