// The one banner (NookPhone notification): its text, icon, optional undo, and its life. ToastHost renders `toasts.current`
// (in the layout, or inside the topmost open sheet: round 7 F1). Split out of the week store (round 8).
import type { PersonId } from '#lib/types.ts';

export interface Toast {
  text: string;
  id: number;
  /** A button on the banner, e.g. 取り消す (undo). */
  action?: { label: string; run: () => void };
  /** Official reaction icon on the banner (`reactions/<id>`). */
  reaction?: string;
  /** A partner event: that person's villager on the left instead of しずえ. */
  person?: PersonId;
  /** What happened, for code that reacts to a banner (never match on the translated text; review P9). */
  code?: 'save-failed';
  /** The banner was paused (`null`) or resumed with `ms` left: keep the action's undo window in step (returns the ms granted). */
  hold?: (ms: number | null) => number;
  /** Sliding out; dropped right after (round 7 F2: never left to a transition). */
  leaving?: boolean;
}

export type ToastOptions = Pick<Toast, 'action' | 'reaction' | 'person' | 'code' | 'hold'>;

/** The banner's slide-out before it is dropped. */
export const TOAST_OUT_MS = 240;
/** After hover/focus leaves, the banner stays at least this long. */
export const RESUME_MIN_MS = 2000;

let seq = 0;

export class Toasts {
  current = $state<Toast | null>(null);
  #timer: ReturnType<typeof setTimeout> | null = null;
  #paused = false;
  #endsAt = 0;

  show(text: string, ms = 2600, opts: ToastOptions = {}): void {
    if (this.#paused) this.current?.hold?.(0); // its banner is gone, so its undo is too: send it
    const toast: Toast = { text, id: ++seq, ...opts };
    this.current = toast;
    this.#paused = false;
    this.#arm(toast, ms);
  }

  #arm(toast: Toast, ms: number): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#endsAt = Date.now() + ms;
    this.#timer = setTimeout(() => this.#end(toast.id), ms);
  }

  /** Slide the banner out, then drop it (its undo window is over, so its held action goes out). */
  #end(id: number): void {
    if (this.current?.id !== id) return;
    this.current.leaving = true;
    this.#paused = false;
    this.#timer = setTimeout(() => {
      if (this.current?.id === id) this.current = null;
    }, TOAST_OUT_MS);
  }

  /**
   * Hold the banner while it is hovered or focused (WCAG 2.2.1, review r2 N7): its undo stays available as long
   * as the person is on it. With an undo it also holds back the send (the undo window is the banner's life).
   */
  pause(): void {
    const toast = this.current;
    if (!toast || toast.leaving || this.#paused) return;
    this.#paused = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    // With an undo the hold is capped (HOLD_MAX_MS, and before the week's lock): the banner ends when its send does.
    const granted = toast.hold?.(null);
    if (granted !== undefined) this.#timer = setTimeout(() => this.#end(toast.id), granted);
  }

  /** Resume after hover/focus leaves: at least 2 s more, so it never vanishes the moment you look away. */
  resume(): void {
    const toast = this.current;
    if (!toast || !this.#paused) return;
    this.#paused = false;
    const ms = Math.max(RESUME_MIN_MS, this.#endsAt - Date.now());
    const granted = toast.hold?.(ms);
    this.#arm(toast, granted === undefined ? ms : Math.min(ms, granted));
  }

  dismiss(): void {
    if (this.#timer) clearTimeout(this.#timer);
    if (this.#paused) this.current?.hold?.(0); // dismissed while held: it's accepted, send it now
    this.#paused = false;
    this.current = null;
  }
}

export const toasts = new Toasts();
