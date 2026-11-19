// One rule for every tap target the island hit-tests by position (docs/design.md "Taps"): the box of what's drawn
// (its art's visible parts), grown about its middle to at least MIN_HIT px square, so a small thing is a thumb's size
// and a big one is its whole body, base included. The scene's DOM targets (trees, bushes, flowers, villagers, doors)
// are their own elements; these are the ones a module tests itself (a shell, a weed, a bug, the tape deck). `?hit`
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

/** What an item draws (client px): the union of its art (img, svg) under `el`, or its own box; null when nothing has a
 *  size (not drawn). A world node's anchor is a 0 × 0 point at its foot: its art hangs off it. */
export function bodyRect(el: Element | null | undefined): DOMRect | null {
  if (!el) return null;
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  const add = (x: DOMRect) => {
    if (!x.width || !x.height) return;
    l = Math.min(l, x.left), t = Math.min(t, x.top), r = Math.max(r, x.right), b = Math.max(b, x.bottom);
  };
  for (const e of el.querySelectorAll('img, svg')) add(e.getBoundingClientRect());
  if (l === Infinity) add(el.getBoundingClientRect());
  return l === Infinity ? null : new DOMRect(l, t, r - l, b - t);
}

/** What an item draws, BARE px round it (a finger on its edge is on it), as a box (null when not drawn). */
const BARE = 3;
export const bareOf = (el: Element | null | undefined): HitBox | null => {
  const r = bodyRect(el);
  return r && { l: r.left - BARE, t: r.top - BARE, r: r.right + BARE, b: r.bottom + BARE };
};

/** An item's tap box: its drawn body grown to MIN_HIT (null when not drawn). */
export const hitOf = (el: Element | null | undefined, min = MIN_HIT): HitBox | null => {
  const r = bodyRect(el);
  return r && grow(r, min);
};

/** Of the targets under (x, y), the one in front (the smallest world z: nearer the camera), then the nearest middle.
 *  `wet`: the ground under the finger is water: a target with a `body` (what it draws, BARE px round it) takes the tap
 *  only on that, its thumb-size margin over the water the water's (a shell by the sea: a tap on the sea beside it
 *  casts). */
export function pick<T extends { box: HitBox | null; z: number; body?: HitBox | null }>(list: readonly T[], x: number, y: number, wet = false): T | null {
  let best: T | null = null, bd = Infinity;
  for (const it of list) {
    const box = wet && it.body !== undefined ? it.body : it.box;
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

/** Where the boxes a module tests by position come from (R4 step 5): its DOM art (`dom`: what the taps use till the
 *  canvas router) or the 3D island's own (`3d`: a model's silhouette, a figure's spot; no DOM read: the `pick3d`
 *  switch's, world3d/pick3d.ts). */
export type Src = 'dom' | '3d';
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
/** `hitOf` and `bareOf` for a box already had (the 3D island's: drawn3). */
export const hitRect = (r: Rect | null, min = MIN_HIT): HitBox | null => r && grow(r, min);
export const bareRect = (r: Rect | null): HitBox | null => r && { l: r.left - BARE, t: r.top - BARE, r: r.right + BARE, b: r.bottom + BARE };

/** The boxes each module tests by position, for `?hit`'s overlay (each registers a lister while mounted). */
export const hitSources = new Set<() => { box: HitBox; kind: string }[]>();
