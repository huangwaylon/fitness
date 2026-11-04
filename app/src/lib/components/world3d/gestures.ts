// The 3D island's finger (docs/design.md "World: the camera"): one finger scrolls along the island with a free fling on
// release (up and down only at the default zoom: its sideways movement is ignored; zoomed in, sideways too, a free 2D
// pan, as far as the camera's sideways room lets it); two fingers pinch the zoom about their middle. A gesture is one thing
// from start to end: once two fingers are down it stays a pinch until every finger is up (a finger left behind never
// scrolls), and a second finger landing just after the first (a pinch starting) takes back the little scroll the first
// made. A short still touch is a tap: it goes on to whatever is under it (the DOM island's buttons and SceneTaps), and
// a drag or a pinch never ends in one (its click is swallowed). Pointer events on the scene, never captured (a capture
// would send the tap's click to the scene instead of its button).
export interface Cam {
  pan(dy: number, dx?: number): void;
  zoom(f: number, sy?: number, sx?: number): void;
  fling(vy: number, vx?: number): void;
  touching(on: boolean): void;
  view(): { camZ: number; zoom: number; camX?: number };
  go(z: number, k?: number, free?: boolean, x?: number): void;
}

/** Movement (px) before a touch is a drag, not a tap. */
const SLOP = 8;
/** A second finger this soon after the first makes the gesture a pinch from its start (the first's scroll undone). */
const PINCH_JOIN_MS = 220;

export function attachGestures(el: HTMLElement, cam: Cam, o: { enabled: () => boolean; top: () => number; left?: () => number }): () => void {
  const pts = new Map<number, { x: number; y: number }>();
  let mode: 'none' | 'tap' | 'pan' | 'pinch' = 'none';
  let t0 = 0, start = { x: 0, y: 0 }, startZ = 0, startK = 1, startX: number | undefined, pinchD = 0;
  let trail: { x: number; y: number; t: number }[] = [];
  let swallowUntil = 0;
  const skip = (e: PointerEvent) => !o.enabled() || (e.target instanceof Element && !!e.target.closest('[data-nopan], input, textarea, select'));

  function down(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!pts.size && skip(e)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      // a new touch is a new gesture: the last drag's click, had it come, came before it (iOS sends none after a drag,
      // so a window left open ate the next real tap: the tap on the water right after a scroll)
      swallowUntil = 0;
      mode = 'tap';
      t0 = e.timeStamp;
      start = { x: e.clientX, y: e.clientY };
      const v = cam.view();
      startZ = v.camZ;
      startK = v.zoom;
      startX = v.camX;
      trail = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
      cam.touching(true);
    } else if (pts.size === 2) {
      // a pinch (from its start, if this finger came just after the first: its scroll undone)
      if (mode === 'pan' && e.timeStamp - t0 < PINCH_JOIN_MS) cam.go(startZ, startK, false, startX);
      mode = 'pinch';
      pinchD = dist();
    }
  }
  const dist = () => {
    const [a, b] = [...pts.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  function move(e: PointerEvent) {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dy = e.clientY - p.y, dx = e.clientX - p.x;
    p.x = e.clientX;
    p.y = e.clientY;
    if (mode === 'pinch') {
      if (pts.size < 2) return;
      const d = dist();
      const [a, b] = [...pts.values()];
      if (pinchD > 0 && d > 0) cam.zoom(d / pinchD, (a.y + b.y) / 2 - o.top(), (a.x + b.x) / 2 - (o.left?.() ?? 0));
      pinchD = d;
      e.preventDefault();
      return;
    }
    if (mode === 'tap') {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < SLOP) return;
      mode = 'pan';
      // (from where the finger is now: no jump by the slop)
      return;
    }
    if (mode !== 'pan') return;
    cam.pan(dy, dx);
    trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    while (trail.length > 2 && trail[0].t < e.timeStamp - 100) trail.shift();
    e.preventDefault();
  }
  function up(e: PointerEvent) {
    if (!pts.delete(e.pointerId)) return;
    if (pts.size) return;
    if (mode === 'pan') {
      const a = trail[0], b = trail[trail.length - 1];
      if (a && b && b !== a && e.timeStamp - b.t < 80) cam.fling((b.y - a.y) / Math.max(1, b.t - a.t), (b.x - a.x) / Math.max(1, b.t - a.t));
    }
    if (mode === 'pan' || mode === 'pinch') swallowUntil = performance.now() + 400;
    mode = 'none';
    cam.touching(false);
  }
  function cancel(e: PointerEvent) {
    if (!pts.delete(e.pointerId) || pts.size) return;
    if (mode === 'pan' || mode === 'pinch') swallowUntil = performance.now() + 400;
    mode = 'none';
    cam.touching(false);
  }
  /** A drag's or a pinch's click (the finger lifted where it went: a mouse's, right after its release) is no tap. */
  function click(e: MouseEvent) {
    if (performance.now() < swallowUntil) {
      swallowUntil = 0;
      e.stopPropagation();
      e.preventDefault();
    }
  }
  /** Safari's own pinch (the page's zoom) never starts over the island. */
  const gesture = (e: Event) => e.preventDefault();
  /** A mouse wheel or a trackpad (desktop, the e2e): scroll, or ⌃ / pinch to zoom. */
  function wheel(e: WheelEvent) {
    if (!o.enabled()) return;
    e.preventDefault();
    if (e.ctrlKey) cam.zoom(Math.exp(-e.deltaY / 200), e.clientY - o.top(), e.clientX - (o.left?.() ?? 0));
    else {
      cam.touching(true);
      cam.pan(-e.deltaY, -e.deltaX);
      cam.touching(false);
    }
  }
  el.addEventListener('pointerdown', down, true);
  window.addEventListener('pointermove', move, { capture: true, passive: false });
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', cancel, true);
  el.addEventListener('click', click, true);
  el.addEventListener('gesturestart', gesture);
  el.addEventListener('wheel', wheel, { passive: false });
  return () => {
    el.removeEventListener('pointerdown', down, true);
    window.removeEventListener('pointermove', move, true);
    window.removeEventListener('pointerup', up, true);
    window.removeEventListener('pointercancel', cancel, true);
    el.removeEventListener('click', click, true);
    el.removeEventListener('gesturestart', gesture);
    el.removeEventListener('wheel', wheel);
  };
}
