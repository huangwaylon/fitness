// Where a `pop` sheet grows from (Sheet's variant="pop": the health popup, ごはん, the ずかん, せってい): the middle of
// the HUD control's art, kept here by the button as it's tapped; the sheet sets it on its own dialog as it opens
// (--pop-x / --pop-y, its zoom's origin). Never on the root: a custom property there restyles the whole document, the
// island's 600 elements with it, in the tap's frame (docs/perf-plan.md A6).
let at: readonly [number, number] | null = null;

export function popFrom(el: Element | undefined | null): void {
  const r = el?.getBoundingClientRect();
  if (!r?.width) return;
  at = [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
}

/** The last control's middle (px), or null before any. */
export const popOrigin = (): readonly [number, number] | null => at;
