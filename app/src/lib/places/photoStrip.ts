// A place's photo strip (components/places/PlacePhotos.svelte, PhotoViewer.svelte): which cells may load and which
// one is shown, from a horizontal scroll-snap strip's scroll position. Only the first loads till it has (a flaky
// network gives it the whole line: it shows as fast as with one photo); then the cells in view plus one ahead, the
// reach only growing (a cell once loaded stays).

/** The last cell to load (an index): 0 till the first is done (loaded or failed); then the last in view (any part,
 *  a gap's sliver aside) plus one, at most n - 1. `step` a cell's width plus the gap. */
export function reachOf(scrollLeft: number, viewW: number, step: number, n: number, firstDone: boolean): number {
  if (!firstDone || n < 1 || step <= 0) return 0;
  const lastInView = Math.floor(Math.max(0, scrollLeft + viewW - 1) / step);
  return Math.min(n - 1, lastInView + 1);
}

/** The shown cell (the dots', the viewer's count): the one the scroll position is nearest, 0 … n - 1. */
export function shownOf(scrollLeft: number, step: number, n: number): number {
  if (n < 1 || step <= 0) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(scrollLeft / step)));
}
