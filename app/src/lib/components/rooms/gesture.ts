// A finger on a room's canvas (the tent's, the homes', the shop's, the museum's): a tap walks or acts, a drag turns the
// camera (or, at my villager's eyes, the head: rooms/firstPerson.ts), two fingers pinch the zoom and, moving together,
// pan the view (rooms/pan.ts). The one rule for every room (docs/design.md "The tent"), kept free of three.js
// (the screens load it before their engines); roomCamera() is the rooms' one hook-up to their engine.
//
// One finger down is undecided. Past the slop it's a drag from then until every finger is up: it never walks and never
// ends in a tap. Lifted within the slop and soon, it's a tap (at the lift's point); held longer without moving, nothing.
// A second finger makes it a pinch (never a tap); one finger left after a pinch drags on, and the pinch's middle, if it
// was still moving as a finger lifted, flings the pan on. A cancelled pointer is nothing.

/** A finger's travel (CSS px: iOS points at any pixel ratio) that makes a drag (a touch's slop), and how long a tap may
 *  be (ms: a press held longer and lifted in place is nothing). */
export const SLOP = 10;
export const TAP_MS = 500;
/** A pinch's middle that moved this recently (ms) as a finger lifted flings (the island's). */
const FLING_MS = 80;
/** Past the slop since it went down: a drag (it never turns back into a tap). */
export const isDrag = (dx: number, dy: number): boolean => dx * dx + dy * dy > SLOP * SLOP;
/** Lifted within the slop and soon: a tap. */
export const isTap = (dx: number, dy: number, ms: number): boolean => !isDrag(dx, dy) && ms < TAP_MS;

/** What of a pointer event the rule reads. */
export interface Pointer {
  pointerId: number;
  clientX: number;
  clientY: number;
  timeStamp: number;
  isPrimary: boolean;
}

export interface GestureHandlers {
  /** A tap at client px. */
  tap(x: number, y: number): void;
  /** A drag or a pinch began: the camera moves until end(). */
  start(): void;
  /** One finger dragging: client px since its last move. */
  drag(dx: number, dy: number): void;
  /** Two fingers: their spread's ratio, their middle's px moved since the last move (right, down) and where it is now
   *  (client px). */
  pinch(scale: number, dx: number, dy: number, mx: number, my: number): void;
  /** Two fingers became fewer while their middle moved (px/ms, right and down). */
  fling?(vx: number, vy: number): void;
  /** Every finger up or cancelled after a start(). */
  end(): void;
}

export interface Gestures {
  down(e: Pointer): void;
  move(e: Pointer): void;
  up(e: Pointer): void;
  cancel(e: Pointer): void;
  /** Fingers down. */
  readonly count: number;
  /** One finger down (this one), not yet a drag: where it is (the tent's long press); else null. */
  pending(id: number): { x: number; y: number } | null;
  /** Everything forgotten (a pointer whose up never came; the edit mode took the finger): end() if started, unless
   *  `quiet`. */
  reset(quiet?: boolean): void;
}

/** When the finger did it (the event's own time: a busy frame between the press and the lift doesn't make a tap a long
 *  one; a made-up event, now). */
const whenOf = (e: Pointer) => (e.timeStamp > 0 ? e.timeStamp : performance.now());

export function gestures(h: GestureHandlers): Gestures {
  const ptrs = new Map<number, { x: number; y: number }>();
  let kind: 'maybe' | 'drag' | 'pinch' | null = null, started = false;
  let x0 = 0, y0 = 0, t0 = 0, lx = 0, ly = 0, d = 0, mx = 0, my = 0;
  /** The pinch's middle's last moves (client px, ms): a fling's speed. */
  let trail: [number, number, number][] = [];
  const two = () => {
    const it = ptrs.values(), a = it.next().value!, b = it.next().value!;
    d = Math.hypot(a.x - b.x, a.y - b.y);
    mx = (a.x + b.x) / 2;
    my = (a.y + b.y) / 2;
  };
  /** The pinch's middle as a finger lifts: a fling if it moved in the last FLING_MS. */
  function flung(t: number) {
    const a = trail[0], b = trail[trail.length - 1];
    trail = [];
    if (a && b && a !== b && t - b[2] < FLING_MS) h.fling?.((b[0] - a[0]) / Math.max(1, b[2] - a[2]), (b[1] - a[1]) / Math.max(1, b[2] - a[2]));
  }
  const begin = () => {
    if (!started) (started = true), h.start();
  };
  const finish = () => {
    kind = null;
    if (started) (started = false), h.end();
  };
  /** A finger gone (lifted or cancelled): the rest go on. */
  function gone(e: Pointer, lifted: boolean) {
    if (!ptrs.delete(e.pointerId)) return;
    if (kind === 'maybe' && lifted && isTap(e.clientX - x0, e.clientY - y0, whenOf(e) - t0)) h.tap(e.clientX, e.clientY);
    if (kind === 'pinch' && ptrs.size === 1 && lifted) flung(whenOf(e));
    if (!ptrs.size) return finish();
    if (kind === 'pinch' && ptrs.size === 1) {
      // one finger left: it drags on from where it is
      const p = ptrs.values().next().value!;
      kind = 'drag';
      lx = p.x;
      ly = p.y;
    } else if (ptrs.size >= 2) two();
  }
  return {
    get count() {
      return ptrs.size;
    },
    down(e) {
      if (e.isPrimary) this.reset();
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        kind = 'maybe';
        x0 = lx = e.clientX;
        y0 = ly = e.clientY;
        t0 = whenOf(e);
      } else if (ptrs.size === 2) {
        kind = 'pinch';
        two();
        trail = [[mx, my, whenOf(e)]];
        begin();
      }
    },
    move(e) {
      const p = ptrs.get(e.pointerId);
      if (!p || !kind) return;
      p.x = e.clientX;
      p.y = e.clientY;
      if (kind === 'maybe') {
        if (!isDrag(e.clientX - x0, e.clientY - y0)) return;
        kind = 'drag';
        begin();
        // (the slop's travel turns too: the finger's whole way is the drag)
      }
      if (kind === 'drag') {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
        if (dx || dy) h.drag(dx, dy);
      } else if (ptrs.size === 2) {
        const pd = d, px = mx, py = my, t = whenOf(e);
        two();
        trail.push([mx, my, t]);
        while (trail.length > 2 && trail[0][2] < t - 100) trail.shift();
        h.pinch(pd > 0 ? d / pd : 1, mx - px, my - py, mx, my);
      }
    },
    up: (e) => gone(e, true),
    cancel: (e) => gone(e, false),
    pending(id) {
      const p = kind === 'maybe' && ptrs.size === 1 ? ptrs.get(id) : undefined;
      return p ? { x: p.x, y: p.y } : null;
    },
    reset(quiet = false) {
      ptrs.clear();
      if (quiet) (kind = null), (started = false);
      else finish();
    }
  };
}

/** What of a room's engine the fingers move (the tent's: the tent, the homes, the shop; the museum's). */
export interface RoomCam {
  /** One finger at my villager's eyes: the head turns (rooms/firstPerson.ts). */
  look(dx: number, dy: number): void;
  orbit(dAz: number, dPitch: number): void;
  /** Two fingers: the zoom by their spread about their middle (client px), the pan by its move (rooms/pan.ts). */
  pinch(scale: number, dx: number, dy: number, mx: number, my: number): void;
  fling(vx: number, vy: number): void;
  /** The wheel's zoom (about the room's middle). */
  zoom(f: number): void;
  isDefault(): boolean;
}
/** A room's camera under the finger, the same in every room: one finger turns round the room (at the eyes, the head);
 *  two pinch the zoom and pan the view, together in one gesture (not at the eyes: there the view is the head's); the
 *  wheel zooms (desktop). `turned` hears whether the view is off NH's after each move (the home button shows). The
 *  canvas takes `attach` (Safari's own pinch, the page's zoom, never starts over it). */
export function roomCamera(cam: () => RoomCam | null | undefined, fpv: () => boolean, turned: (off: boolean) => void) {
  const noPageZoom = (e: Event) => e.preventDefault();
  return {
    fingers: {
      drag(dx: number, dy: number) {
        const c = cam();
        if (!c) return;
        if (fpv()) c.look(dx, dy);
        else c.orbit(-dx * 0.0085, dy * 0.005);
        turned(!c.isDefault());
      },
      pinch(scale: number, dx: number, dy: number, mx: number, my: number) {
        const c = cam();
        if (!c || fpv()) return;
        c.pinch(scale, dx, dy, mx, my);
        turned(!c.isDefault());
      },
      fling(vx: number, vy: number) {
        if (!fpv()) cam()?.fling(vx, vy);
      }
    } satisfies Partial<GestureHandlers>,
    wheel(e: WheelEvent) {
      const c = cam();
      if (!c) return;
      e.preventDefault();
      if (fpv()) return;
      c.zoom(Math.exp(-e.deltaY * 0.0015));
      turned(!c.isDefault());
    },
    attach(el: HTMLElement) {
      el.addEventListener('gesturestart', noPageZoom);
      el.addEventListener('gesturechange', noPageZoom);
      return () => {
        el.removeEventListener('gesturestart', noPageZoom);
        el.removeEventListener('gesturechange', noPageZoom);
      };
    }
  };
}
