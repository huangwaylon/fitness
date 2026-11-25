// A finger on the editor's plan (the plan's and the river tool's canvases; the mouse keeps its own path): the rooms'
// one rule (rooms/gesture.ts gestures): a tap acts, a one-finger drag is the tool's if it takes it where the finger went
// down (a selected piece moved, a stroke, a knot) or else pans, two fingers pinch the zoom about their middle and pan.
// A pinch cancels the tool's drag (nothing kept); the finger left after it pans. Pure but for the canvas's box.
import { gestures, type Pointer } from '../rooms/gesture.ts';
import { zoomAt, type View } from './plan.ts';

export interface FingerTool {
  /** Client px → the canvas's. */
  local(x: number, y: number): [number, number];
  view(): View;
  setView(v: View): void;
  /** A tap at canvas px. */
  tap(px: number, py: number): void;
  /** A one-finger drag begins (canvas px where it went down): true if the tool takes it, else it pans. */
  grab(px: number, py: number): boolean;
  /** The tool's drag: the finger now (canvas px). */
  drag(px: number, py: number): void;
  /** The tool's drag over: lifted (`done`), or given up to a pinch (undo what it did). */
  release(done: boolean): void;
}

export interface PlanFingers {
  down(e: Pointer): void;
  move(e: Pointer): void;
  up(e: Pointer): void;
  cancel(e: Pointer): void;
}

export function planFingers(t: FingerTool): PlanFingers {
  let mode: 'tool' | 'pan' | 'pinch' | null = null;
  let at: [number, number] = [0, 0], last: [number, number] = [0, 0];
  const g = gestures({
    tap: (x, y) => t.tap(...t.local(x, y)),
    start() {
      if (g.count > 1) mode = 'pinch';
      else mode = t.grab(...at) ? 'tool' : 'pan';
    },
    drag(dx, dy) {
      if (mode === 'tool') t.drag(...last);
      else {
        const v = t.view();
        t.setView({ ...v, ox: v.ox + dx, oy: v.oy + dy });
      }
    },
    pinch(scale, dx, dy, mx, my) {
      if (mode === 'tool') t.release(false);
      mode = 'pinch';
      const v = t.view();
      t.setView(zoomAt({ ...v, ox: v.ox + dx, oy: v.oy + dy }, ...t.local(mx, my), scale));
    },
    end() {
      if (mode === 'tool') t.release(true);
      mode = null;
    }
  });
  return {
    down(e) {
      if (!g.count) at = last = t.local(e.clientX, e.clientY);
      g.down(e);
    },
    move(e) {
      if (g.count === 1) last = t.local(e.clientX, e.clientY);
      g.move(e);
    },
    up: (e) => g.up(e),
    cancel(e) {
      // a cancelled finger (the system took it): the tool's drag undone
      if (mode === 'tool' && g.count === 1) (mode = null), t.release(false);
      g.cancel(e);
    }
  };
}
