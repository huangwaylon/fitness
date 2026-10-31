// A chart's own gestures (けんこう): a tap picks the bar under the finger; a horizontal drag pulls the chart along and,
// past a threshold, turns the page (right = older, left = newer). Vertical drags are the panel's: the chart is
// `touch-action: pan-y`, so the browser scrolls and cancels our pointer. Mouse drags work the same.
interface Opts {
  /** A tap at x (px from the chart's left). */
  tap: (x: number) => void;
  /** -1 = older, +1 = newer (with nothing that way, the chart just springs back). */
  swipe: (dir: -1 | 1) => void;
  /** The drag offset while dragging (0 when let go). */
  drag: (dx: number) => void;
}

const SLOP = 10;
const TURN = 48;

export function chartGestures(node: HTMLElement, opts: Opts) {
  let o = opts;
  let id: number | null = null;
  let x0 = 0, y0 = 0, dragging = false;
  const down = (e: PointerEvent) => {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    id = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    dragging = false;
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (!dragging && Math.abs(dx) > SLOP && Math.abs(dx) > Math.abs(dy)) {
      dragging = true;
      node.setPointerCapture?.(e.pointerId);
    }
    if (dragging) o.drag(dx);
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    const dx = e.clientX - x0;
    if (dragging) {
      dragging = false;
      if (Math.abs(dx) >= TURN) o.swipe(dx > 0 ? -1 : 1);
      o.drag(0);
      return;
    }
    if (Math.abs(e.clientY - y0) <= SLOP) o.tap(e.clientX - node.getBoundingClientRect().left);
  };
  const cancel = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    dragging = false;
    o.drag(0);
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', cancel);
  return {
    update(next: Opts) {
      o = next;
    },
    destroy() {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    }
  };
}
