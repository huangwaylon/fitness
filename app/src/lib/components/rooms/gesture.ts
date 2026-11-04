// A finger on a room's canvas (the tent's, the homes', the museum's): a tap walks or acts, a drag turns the camera (or,
// at my villager's eyes, the head: rooms/firstPerson.ts), two fingers pinch. The one rule for both rooms
// (docs/design.md "First person"), kept free of three.js (the screens load it before their engines).
//
// One finger down is undecided. Past the slop it's a drag from then until every finger is up: it never walks and never
// ends in a tap. Lifted within the slop and soon, it's a tap (at the lift's point); held longer without moving, nothing.
// A second finger makes it a pinch (never a tap); one finger left after a pinch drags on. A cancelled pointer is
// nothing.

/** A finger's travel (CSS px: iOS points at any pixel ratio) that makes a drag (a touch's slop), and how long a tap may
 *  be (ms: a press held longer and lifted in place is nothing). */
export const SLOP = 10;
export const TAP_MS = 500;
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
  /** Two fingers: their spread's ratio and their middle's px down since the last move. */
  pinch(scale: number, dy: number): void;
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
  let x0 = 0, y0 = 0, t0 = 0, lx = 0, ly = 0, d = 0, my = 0;
  const two = () => {
    const it = ptrs.values(), a = it.next().value!, b = it.next().value!;
    d = Math.hypot(a.x - b.x, a.y - b.y);
    my = (a.y + b.y) / 2;
  };
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
        const pd = d, pm = my;
        two();
        h.pinch(pd > 0 ? d / pd : 1, my - pm);
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
