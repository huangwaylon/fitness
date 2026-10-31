// Where the island's overlays may go (docs/design.md "Scene interactions", "Dialogue"): the stage's geometry and the
// UI nothing of ours may cover. Shared by the critters, the beach finds, the chats and the visitors: they keep clear of
// every control (the ribbon and its tails, the jar beside it, the sync chip, the trees, the fruit rows, the villagers),
// a tree's popup and しずえ's box, measured live with getBoundingClientRect. A speech balloon stands by its speaker
// (placeBy: NH's rule, nearness first); a plate or a caption by the point it's about (place).

export interface Box { x0: number; x1: number; y0: number; y1: number }


/** The stage's box, the px → u factor and what of the stage is on screen (u). */
export function stageGeo(scene: HTMLElement | undefined) {
  const stage = scene?.querySelector<HTMLElement>('.stage');
  if (!scene || !stage) return null;
  const r = stage.getBoundingClientRect(), s = scene.getBoundingClientRect();
  const k = 390 / r.width;
  return { r, k, left: (s.left - r.left) * k, right: (s.right - r.left) * k, bottom: (s.bottom - r.top) * k, w: s.width * k };
}
export type StageGeo = NonNullable<ReturnType<typeof stageGeo>>;

/** What a balloon never covers, whatever else gives way: the HUD (every control outside the stage: the ribbon, the
 *  jar, the sync chip, the panel's), しずえ's box, a tree's popup, what a villager holds up, and another overlay that
 *  is showing (a catch plate). */
const hard = (el: Element): boolean => !el.closest('.stage') || el.matches('.news, .detail, [data-guard]') || !!el.closest('[data-fx].placed');

/** The UI nothing of ours may cover, in client px: every control but the balloon, a tree's popup and しずえ's box,
 *  padded 6px (the ribbon 20px across: its folded tails hang 16px outside it). `skip`: leave some out. */
function guards(skip?: (el: Element) => boolean): Box[] {
  const out: Box[] = [];
  // [data-guard]: what a villager holds up over its head
  for (const el of document.querySelectorAll('button, .detail, .news, [data-guard]')) {
    if (el.classList.contains('balloon') || el.closest('[data-fx]:not(.placed)')) continue; // an overlay still being measured
    if (skip?.(el)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const px = el.classList.contains('ribbon') ? 20 : 6;
    out.push({ x0: r.left - px, y0: r.top - 6, x1: r.right + px, y1: r.bottom + 6 });
  }
  return out;
}

/** The UI nothing of ours may cover (client px): every control (the fireworks keep their bursts off it). */
export const uiBoxes = (): Box[] => guards();

const hits = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The guards in stage units, grown by `pad` u (`skip`: leave some out). */
export function guardsU(g: StageGeo, pad: number, skip?: (el: Element) => boolean): Box[] {
  return guards(skip).map((b) => ({
    x0: (b.x0 - g.r.left) * g.k - pad, x1: (b.x1 - g.r.left) * g.k + pad, y0: (b.y0 - g.r.top) * g.k - pad, y1: (b.y1 - g.r.top) * g.k + pad
  }));
}

/** Whether a box of half-size hw × hh around a stage point (u) stays clear of every guard. */
export const clearAt = (keep: Box[], x: number, y: number, hw = 0, hh = 0): boolean =>
  !keep.some((b) => hits(b, { x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh }));

/** Which side of its speaker a balloon stands on (its tail points the other way, at the speaker). */
export type Side = 'top' | 'left' | 'right' | 'bottom';
/** The space between a balloon and its speaker: its tail (9px) and a breath. */
export const GAP = 12;
/** How far a balloon may stand off its speaker (px, beyond GAP) before something else gives way. */
export const NEAR = 40;
/** How far it may stand off to keep clear of every control (or of all but the museum) before the island's things may
 *  sit under it instead: a breath, so the tail stays at the speaker. */
export const SNUG = 16;
/** The boxes a balloon keeps clear of, and (optionally) how far off it may stand for that. */
export type Tier = Box[] | { keep: Box[]; reach: number };
/** The tail keeps this far from a balloon's corners (px). */
export const TAIL_IN = 20;

/** Offsets 0, +step, −step, +2·step … within [lo, hi]; when 0 is outside, from the nearer end inwards. */
function slides(lo: number, hi: number, step: number): number[] {
  if (lo > hi) return [];
  if (lo > 0 || hi < 0) {
    const out: number[] = [];
    if (lo > 0) for (let v = lo; v <= hi; v += step) out.push(v);
    else for (let v = hi; v >= lo; v -= step) out.push(v);
    return out;
  }
  const out = [0];
  for (let d = step; d <= Math.max(-lo, hi); d += step) {
    if (d <= hi) out.push(d);
    if (-d >= lo) out.push(-d);
  }
  if (hi > 0 && !out.includes(hi)) out.push(hi);
  if (lo < 0 && !out.includes(lo)) out.push(lo);
  return out;
}

/** Where a w × h box (client px, a balloon's tail not included) stands by `from` (its speaker), pure: the first spot,
 *  side by side in `sides` order and, for each side, tier by tier (`tiers`: the boxes kept clear, the strictest first),
 *  moving out 4px at a time up to `reach` px beyond GAP (or the tier's own), inside `area`, with the tail able to point at the speaker (its
 *  head from above or below: `from`'s top centre; from either side, its upper part). `free`: any spot along the side
 *  will do (no tail). Null when nothing fits. */
export function spotBy(w: number, h: number, from: Box, area: Box, tiers: readonly Tier[],
  o: { sides?: readonly Side[]; reach?: number; free?: boolean } = {}): { x: number; y: number; side: Side } | null {
  const reach = o.reach ?? NEAR, sides = o.sides ?? (['top', 'left', 'right', 'bottom'] as const);
  const L = area.x0 + w / 2, R = area.x1 - w / 2, T = area.y0 + h / 2, B = area.y1 - h / 2;
  if (L > R || T > B) return null;
  const cx = (from.x0 + from.x1) / 2, ty = from.y0 + Math.min(24, (from.y1 - from.y0) * 0.3);
  const inX = o.free ? Infinity : w / 2 - TAIL_IN, inY = o.free ? Infinity : h / 2 - TAIL_IN;
  const xs = slides(Math.max(L, cx - inX) - cx, Math.min(R, cx + inX) - cx, 8).map((d) => cx + d);
  const ys = slides(Math.max(T, ty - inY) - ty, Math.min(B, ty + inY) - ty, 8).map((d) => ty + d);
  const clear = (keep: Box[], x: number, y: number) => {
    if (y < T - 0.5 || y > B + 0.5 || x < L - 0.5 || x > R + 0.5) return false;
    const b = { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
    return !keep.some((k) => hits(b, k));
  };
  for (const side of sides)
    for (const t of tiers) {
      const [keep, far] = Array.isArray(t) ? [t, reach] : [t.keep, t.reach];
      for (let d = 0; d <= far; d += 4) {
        const at: [number, number][] = side === 'top' ? xs.map((x) => [x, from.y0 - GAP - d - h / 2])
          : side === 'bottom' ? xs.map((x) => [x, from.y1 + GAP + d + h / 2])
          : ys.map((y) => [side === 'left' ? from.x0 - GAP - d - w / 2 : from.x1 + GAP + d + w / 2, y]);
        for (const [x, y] of at) if (clear(keep, x, y)) return { x, y, side };
      }
    }
  return null;
}

/** The scene's safe area (client px): under the status bar, 4px inside its foot, 8px from the sides. (It used to stop
 *  at a `.below` band that no longer exists: the only `.below` left was a balloon under its speaker, which then cut the
 *  area short for the next balloon or plate.) */
function safeArea(scene: HTMLElement): Box {
  const s = scene.getBoundingClientRect();
  return {
    x0: s.left + 8, x1: s.right - 8,
    y0: Math.max(s.top, scene.querySelector('.band')?.getBoundingClientRect().top ?? s.top) + 4,
    y1: s.bottom - 4
  };
}

/** Where a speech balloon goes (docs/design.md "Dialogue"), NH's rule for every speaker: by the speaker, its tail at
 *  them, at most NEAR px off: above the head when there's room, else beside it, else below the feet. Room gives way
 *  step by step, nearness doesn't: clear of every control, else over the museum (a building that is also a control),
 *  both only within SNUG px so the tail stays at the speaker; else over the island's things (the trees, the fruit rows)
 *  but not the villagers; else over the villagers too. Never over the HUD, しずえ's box, a tree's popup or another
 *  overlay showing, nor `extra` (the speaker itself, its emote); never off the safe area. Only when nothing near fits does it stand further off (clear of the HUD). `own`: the
 *  balloon's own layer (left out, as it moves to follow its speaker). */
export function placeBy(scene: HTMLElement, w: number, h: number, from: Box, extra: Box[] = [], own?: Element): { x: number; y: number; side: Side } | null {
  const area = safeArea(scene);
  const g = (skip: (el: Element) => boolean) => [...guards((el) => !!own?.contains(el) || skip(el)), ...extra];
  const hud = g((el) => !hard(el));
  const tiers = [{ keep: g(() => false), reach: SNUG }, { keep: g((el) => el.hasAttribute('data-scenery')), reach: SNUG }, g((el) => !hard(el) && !el.matches('.vil')), hud];
  return spotBy(w, h, from, area, tiers) ?? spotBy(w, h, from, area, [hud], { reach: 600 });
}

/** Where a w × h box (client px) centred near (sx, sy) fits (a plate, a caption by what it's about): the scene's safe
 *  area, clear of every control, above the point first, then below, as close as it can, sliding along; failing that
 *  near, over the museum (`data-scenery`, a building that is also a control); only then further off. Null when there's
 *  no room. */
export function place(scene: HTMLElement, w: number, h: number, sx: number, sy: number, extra: Box[] = []): { x: number; y: number } | null {
  const area = safeArea(scene);
  const from = { x0: sx, x1: sx, y0: sy - 2, y1: sy + 2 }; // its middle 14px off the point
  const tiers = [[...guards(), ...extra], [...guards((el) => el.hasAttribute('data-scenery')), ...extra]];
  const o = { sides: ['top', 'bottom'] as const, free: true };
  return spotBy(w, h, from, area, tiers, o) ?? spotBy(w, h, from, area, tiers, { ...o, reach: 600 });
}
