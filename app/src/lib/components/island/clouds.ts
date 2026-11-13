// The island's endless CSS loops, moved in its own frames (Island3D's onFrame, stepHeld), not as running animations:
// an endless one keeps the compositor at the display's rate (Safari's at 60 Hz) while the canvas draws at 12 at rest
// (review 11/10 r1, C2). Their CSS stays (keyframes, durations, phases): held, and their time set by the frame's.
// - The sky's two clouds (holdCloud): their `drift` set each STEP_MS, drifting on under reduced motion.
// - The little loops over the island (holdLoop: the night's twinkling stars, a money tree's glow and glints, the
//   bottle's foam, the tape deck's ♪): set each frame, so they step at its rate (the user's call 2026-11-13, after a
//   side-by-side); held where they were under reduced motion.
// Their Animation objects are kept once the browser has made them: getAnimations() each frame flushed the style, the
// island's largest own cost at rest (8.5-13.6 ms a second at 4x CPU; review 11/10 r2, P5). No playState read either:
// it flushes too, and its check every frame was 6-8 ms a second at 4x CPU, the most at night (r3 L5); each is paused
// once, when it's taken up.
interface Held {
  /** Its animations: empty till the browser makes them (WebKit: at the first style after the mount), or again once
   *  one's cancelled (its element out of the tree a while). */
  anims: Animation[];
  cloud: boolean;
}
const held = new Map<Element, Held>();
/** A cloud's time is set again once the frame's has moved this far (ms): 3.7 px a second, 0.4 px. */
const STEP_MS = 100;
/** A loop without its animations yet is looked for at most this often (ms): getAnimations() flushes the style. */
const ASK_MS = 500;
let setAt = -Infinity, askedAt = -Infinity;
const reduce = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

function hold(el: Element, cloud: boolean): () => void {
  held.set(el, { anims: [], cloud });
  if (cloud) setAt = -Infinity;
  else askedAt = -Infinity;
  return () => {
    held.delete(el);
    for (const a of el.getAnimations()) a.play();
  };
}

/** Hold a cloud (an attachment: `{@attach holdCloud}`), stepped by stepHeld; the release lets it run again. */
export const holdCloud = (el: Element): (() => void) => hold(el, true);
/** Hold one of the island's little loops (`{@attach holdLoop}`); the release lets it run again. */
export const holdLoop = (el: Element): (() => void) => hold(el, false);

/** Take up `el`'s animations, if the browser has made them. */
function takeUp(el: Element, h: Held): void {
  const now = el.getAnimations();
  for (const a of now) {
    a.pause();
    a.addEventListener('cancel', () => void (held.get(el) === h && (h.anims = [])), { once: true });
  }
  h.anims = now;
}

/** Where everything held is at `t` (performance.now's clock), as it'd have run from the page's start: the clouds set
 *  each STEP_MS (asked for at each step while they've no animations), the loops each frame (looked for at most each
 *  ASK_MS) or, under reduced motion (`still`), held where they were taken up. */
export function stepHeld(t: number, still = !!reduce?.matches): void {
  const clouds = Math.abs(t - setAt) >= STEP_MS, ask = t - askedAt >= ASK_MS;
  if (clouds) setAt = t;
  let asked = false;
  for (const [el, h] of held) {
    if (h.cloud ? !clouds : still && !ask) continue;
    if (!h.anims.length && (h.cloud || ask)) {
      takeUp(el, h);
      asked ||= !h.cloud;
    }
    if (h.cloud || !still) for (const a of h.anims) a.currentTime = t;
  }
  if (asked) askedAt = t;
}
