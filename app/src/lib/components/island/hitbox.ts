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

/** An item's tap box: its drawn body grown to MIN_HIT (null when not drawn). */
export const hitOf = (el: Element | null | undefined, min = MIN_HIT): HitBox | null => {
  const r = bodyRect(el);
  return r && grow(r, min);
};

/** Of the targets under (x, y), the one in front (the smallest world z: nearer the camera), then the nearest middle. */
export function pick<T extends { box: HitBox | null; z: number }>(list: readonly T[], x: number, y: number): T | null {
  let best: T | null = null, bd = Infinity;
  for (const it of list) {
    if (!it.box || !inside(it.box, x, y)) continue;
    const d = centreDist(it.box, x, y);
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

/** The boxes each module tests by position, for `?hit`'s overlay (each registers a lister while mounted). */
export const hitSources = new Set<() => { box: HitBox; kind: string }[]>();
