// Tiny shared UI state (not data): whether a full-screen overlay (the Sunday harvest) is open, so pages hold their
// own toasts until it closes; a pending きろく entry for the しまフォン; and the open sheets, newest last (the
// banner renders inside the topmost one).
type PhoneEntry = { tab: 'body' | 'money'; week?: string };

class Ui {
  phoneEntry = $state<PhoneEntry | null>(null);
  sheets = $state<number[]>([]);
  #overlay: () => boolean = () => false;
  /** The harvest overlay is up (read straight from the layout's state: no mirroring effect). */
  get overlay(): boolean {
    return this.#overlay();
  }
  /** The layout says where `overlay` comes from (once, at init). */
  provideOverlay(fn: () => boolean): void {
    this.#overlay = fn;
  }
}

export const ui = new Ui();

/** Open the しまフォン straight into きろく (today's ベル ribbon → this week, jar total → お金). */
export function openKiroku(entry: PhoneEntry): void {
  ui.phoneEntry = entry;
}
