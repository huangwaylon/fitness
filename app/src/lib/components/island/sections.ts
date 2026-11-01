// The island's three sections (docs/design.md "World"): the camera comes to rest only on a section's stop, never in
// between (mandatory snapping, one section a swipe). The stops are world.ts's CAMS, fitted to the screen: the front
// lowered until the sea shows at the foot (its fishing and diving), the back raised until the campsite clears the HUD.
// Pure: the scene hands in the projector.
import { CAMS } from './world.ts';
import { followTarget, inBand, type CamView } from './tapWalk.ts';

type SectionId = keyof typeof CAMS;
export interface Section {
  id: SectionId;
  /** The camera's world z (camZ) at rest. */
  z: number;
}

/** world.ts's stops, front to back. */
export const SECTIONS: readonly Section[] = (Object.entries(CAMS) as [SectionId, number][]).sort((a, b) => a[1] - b[1]).map(([id, z]) => ({ id, z }));

/** The stops for this screen: the front and the back are the scroller's ends (`lo`, `hi`), the rest as world.ts has
 *  them (kept strictly between). */
export function fitted(lo: number, hi: number, base: readonly Section[] = SECTIONS): Section[] {
  return base.map((s, i) => ({ id: s.id, z: i === 0 ? lo : i === base.length - 1 ? hi : Math.min(hi - 1, Math.max(lo + 1, s.z)) }));
}

/** The stop nearest a camera. */
export function nearest(secs: readonly Section[], cam: number): Section {
  let best = secs[0];
  for (const s of secs) if (Math.abs(s.z - cam) < Math.abs(best.z - cam)) best = s;
  return best;
}

/** Where a camera that followed a walk comes to rest: a stop that keeps the walker in the band (the one nearest the
 *  camera now), else the stop nearest the camera that would frame it. */
export function restFor(v: CamView, secs: readonly Section[], cam: number, walkerZ: number): Section {
  const ok = secs.filter((s) => inBand(v, s.z, walkerZ));
  if (ok.length) return nearest(ok, cam);
  return nearest(secs, followTarget(v, walkerZ, walkerZ, secs[0].z, secs[secs.length - 1].z));
}

/** The stop that shows a world point best (a tap on the partner's edge face): one with it in the band, nearest it. */
export function sectionFor(v: CamView, secs: readonly Section[], z: number): Section {
  return restFor(v, secs, z, z);
}

/** The camera at which a monotonic f (the screen y of something, growing as the camera moves back) reaches `want`,
 *  within [lo, hi] (bisection; an end when it's never reached there). */
export function solveCam(f: (cam: number) => number, want: number, lo: number, hi: number): number {
  if (f(lo) >= want) return lo;
  if (f(hi) <= want) return hi;
  let a = lo, b = hi;
  for (let i = 0; i < 40 && b - a > 0.25; i++) {
    const m = (a + b) / 2;
    if (f(m) < want) a = m;
    else b = m;
  }
  return b;
}
