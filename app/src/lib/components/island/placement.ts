// Where the island's overlays may go (docs/design.md "Scene interactions"): the stage's geometry and the UI nothing of
// ours may cover. Shared by the critters, the beach finds, the chats and the visitors: they keep clear of every control
// (the ribbon and its tails, the sync chip, the trees, the fruit rows, the jar and its plate, the villagers), a tree's
// popup and しずえ's box, measured live with getBoundingClientRect.

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

/** The UI nothing of ours may cover, in client px: every control but the balloon, a tree's popup and しずえ's box,
 *  padded 6px (the ribbon 20px across: its folded tails hang 16px outside it). */
function guards(): Box[] {
  const out: Box[] = [];
  for (const el of document.querySelectorAll('button, .detail, .news')) {
    if (el.classList.contains('balloon') || el.closest('[data-fx]:not(.placed)')) continue; // an overlay still being measured
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const px = el.classList.contains('ribbon') ? 20 : 6;
    out.push({ x0: r.left - px, y0: r.top - 6, x1: r.right + px, y1: r.bottom + 6 });
  }
  return out;
}

const hits = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The guards in stage units, grown by `pad` u. */
export function guardsU(g: StageGeo, pad: number): Box[] {
  return guards().map((b) => ({
    x0: (b.x0 - g.r.left) * g.k - pad, x1: (b.x1 - g.r.left) * g.k + pad, y0: (b.y0 - g.r.top) * g.k - pad, y1: (b.y1 - g.r.top) * g.k + pad
  }));
}

/** Whether a box of half-size hw × hh around a stage point (u) stays clear of every guard. */
export const clearAt = (keep: Box[], x: number, y: number, hw = 0, hh = 0): boolean =>
  !keep.some((b) => hits(b, { x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh }));

/** Where a w × h box (client px) centred near (sx, sy) fits: the scene's safe area (under the status bar, above the
 *  bottom band, 8px from the sides), overlapping no guard. Tries above the source first, then below, moving out 4px at
 *  a time; then the same against either side. Null when there's no room. */
export function place(scene: HTMLElement, w: number, h: number, sx: number, sy: number, extra: Box[] = []): { x: number; y: number } | null {
  const s = scene.getBoundingClientRect();
  const top = Math.max(s.top, scene.querySelector('.band')?.getBoundingClientRect().top ?? s.top) + 4;
  const bottom = Math.min(s.bottom, document.querySelector('.below')?.getBoundingClientRect().top ?? s.bottom) - 4;
  const L = s.left + 8 + w / 2, R = s.right - 8 - w / 2;
  if (L > R) return null;
  const keep = [...guards(), ...extra];
  const fits = (x: number, y: number) => {
    const b = { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
    return b.y0 >= top && b.y1 <= bottom && !keep.some((k) => hits(b, k));
  };
  const clamp = (v: number) => Math.min(R, Math.max(L, v));
  for (const x of [clamp(sx), L, R])
    for (let d = 0; d < 600; d += 4)
      for (const y of [sy - h / 2 - 14 - d, sy + h / 2 + 14 + d]) if (fits(x, y)) return { x, y };
  return null;
}
