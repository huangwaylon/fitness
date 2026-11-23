// A map's long press (docs/places.md "Map": 保存した場所 drops a pin): the finger down and still for HOLD_MS (moved
// SLOP px: a pan, not a press), or a mouse's right click; the point under it. DOM only; no MapLibre value imported.
import type { Map as GLMap } from 'maplibre-gl';
import type { LL } from './geojson.ts';

const HOLD_MS = 500, SLOP = 10;

/** `cb` with the point long-pressed on `map` (its container `el`). `cancel` drops a press under way (a camera move);
 *  `destroy` with the map. */
export function longPress(map: GLMap, el: HTMLElement, cb: (at: LL) => void): { cancel(): void; destroy(): void } {
  let hold: ReturnType<typeof setTimeout> | undefined, start: { x: number; y: number } | null = null;
  const cancel = () => (clearTimeout(hold), (start = null));
  const canvas = map.getCanvasContainer();
  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) return cancel();
    const r = el.getBoundingClientRect();
    start = { x: e.clientX - r.left, y: e.clientY - r.top };
    clearTimeout(hold);
    hold = setTimeout(() => {
      if (!start) return;
      const ll = map.unproject([start.x, start.y]);
      start = null;
      cb([ll.lng, ll.lat]);
    }, HOLD_MS);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!start) return;
    const r = el.getBoundingClientRect();
    if (Math.hypot(e.clientX - r.left - start.x, e.clientY - r.top - start.y) > SLOP) cancel();
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave'] as const) canvas.addEventListener(t, cancel);
  // (a mouse's only: a touch's long press is the timer's, and Chromium's own contextmenu after it pinned twice)
  map.on('contextmenu', (e) => {
    if ((e.originalEvent as PointerEvent).pointerType === 'touch') return;
    cancel();
    cb([e.lngLat.lng, e.lngLat.lat]);
  });
  return { cancel, destroy: cancel };
}
