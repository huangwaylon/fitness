// Tiny shared UI state (not data): whether a full-screen overlay (the Sunday harvest) is open, so pages hold their
// own toasts until it closes; and the open sheets, newest last (the banner renders inside the topmost one).
class Ui {
  sheets = $state<number[]>([]);
  /** The museum asked for the ずかん: the HUD opens the panel and the panel shows きろく's ずかん, then clears it. A
   *  one-shot ask, not a counter: the HUD and the panel remount on every return to 島 (from ごほうび), and a standing
   *  ask would open the panel again each time. */
  zukan = $state(false);
  /** A building's door asked for the panel (docs/design.md "World"): Resident Services → せってい, Able Sisters → its
   *  むらびと picker, the airport → つうしん. A one-shot ask like `zukan`. */
  door = $state<'settings' | 'villager' | 'sync' | null>(null);
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
