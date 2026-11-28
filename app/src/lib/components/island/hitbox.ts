// One rule for every tap target the island hit-tests by position (docs/design.md "Taps"): the box of what's drawn
// (its model's silhouette on screen), grown about its middle to at least MIN_HIT px square, so a small thing is a
// thumb's size and a big one is its whole body, base included. The scenery's and the controls' are their tap areas
// (world3d/pick3d.ts); these are the ones a module tests itself (a shell, a weed, a bug, the tape deck). `?hit`
// (HitOverlay) draws both kinds; a module lists its boxes in `hitSources` while it's mounted.

/** The smallest tap target (px), Apple's. */
export const MIN_HIT = 44;
/** A box in client px. */
export interface HitBox { l: number; t: number; r: number; b: number }

/** A rect grown about its middle to at least `min` px each way, plus `pad` round it. */
export function grow(r: { left: number; top: number; width: number; height: number }, min = MIN_HIT, pad = 4): HitBox {
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hw = Math.max(min / 2, r.width / 2 + pad), hh = Math.max(min / 2, r.height / 2 + pad);
  return { l: cx - hw, t: cy - hh, r: cx + hw, b: cy + hh };
}

export const inside = (b: HitBox, x: number, y: number): boolean => x >= b.l && x <= b.r && y >= b.t && y <= b.b;
const centreDist = (b: HitBox, x: number, y: number): number => Math.hypot(x - (b.l + b.r) / 2, y - (b.t + b.b) / 2);

/** What an item draws is this much (px) round it: a finger on its edge is on it. */
const BARE = 3;

/** Of the targets under (x, y), the one in front (the smallest world z: nearer the camera), then the nearest middle.
 *  `bare`: a target with a `body` (what it draws, BARE px round it) takes the tap only on that, not its thumb-size
 *  margin: over water (a shell by the sea: a tap on the sea beside it casts), and SceneTaps' first pass (a weed drawn
 *  under the finger before a dig spot's margin beside it). */
export function pick<T extends { box: HitBox | null; z: number; body?: HitBox | null }>(list: readonly T[], x: number, y: number, bare = false): T | null {
  let best: T | null = null, bd = Infinity;
  for (const it of list) {
    const box = bare && it.body !== undefined ? it.body : it.box;
    if (!box || !inside(box, x, y)) continue;
    const d = centreDist(box, x, y);
    if (!best || it.z < best.z - 1 || (Math.abs(it.z - best.z) <= 1 && d < bd)) (best = it), (bd = d);
  }
  return best;
}

/** Whether a thing at world (x, z) shows at a tap (not hidden by what the tap landed on: a building's body, SceneTaps),
 *  `r` px of it round its middle on screen (a fish's shadow half behind a roof shows): what a module tests by position
 *  answers only for what shows. */
export type Seen = (x: number, z: number, r?: number) => boolean;
export const SHOWN: Seen = () => true;
/** What a building's footprint hides: a thing behind its front line within its width (a thing before it or beside it
 *  stands in front of its body on screen); its model stands a little inside its tiles (NH's museum and shop ~4u each
 *  side), and a thing at its edge (a present dropped by a tree beside it) shows. */
const INSET = 12;
export const notBehind = (f: { x0: number; x1: number; y0: number }) => (x: number, z: number): boolean => z < f.y0 + INSET || x < f.x0 + INSET || x > f.x1 - INSET;

/** What the 3D island draws for model instance `id` (client px: its silhouette's box), or null (none built, or some of
 *  it behind the camera). */
export type Rect = { left: number; top: number; width: number; height: number; right: number; bottom: number };
export function drawn3(w: { three: { outline?(id: string): readonly (readonly [number, number])[] | null } | null; view: { left: number; top: number } }, id: string): Rect | null {
  const pts = w.three?.outline?.(id);
  if (!pts?.length) return null;
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const [x, y] of pts) (l = Math.min(l, x)), (t = Math.min(t, y)), (r = Math.max(r, x)), (b = Math.max(b, y));
  return { left: l + w.view.left, top: t + w.view.top, width: r - l, height: b - t, right: r + w.view.left, bottom: b + w.view.top };
}
/** A drawn box's tap box (the 3D island's: drawn3) grown to MIN_HIT, and what it draws BARE px round it (a finger on its edge is on it). */
export const hitRect = (r: Rect | null, min = MIN_HIT): HitBox | null => r && grow(r, min);
export const bareRect = (r: Rect | null): HitBox | null => r && { l: r.left - BARE, t: r.top - BARE, r: r.right + BARE, b: r.bottom + BARE };

/** The boxes each module tests by position, for `?hit`'s overlay (each registers a lister while mounted). */
export const hitSources = new Set<() => { box: HitBox; kind: string }[]>();
