// Tiny shared UI state (not data): whether a full-screen overlay (the Sunday harvest) is open, so pages hold their
// own toasts until it closes; and the open sheets, newest last (the banner renders inside the topmost one).
class Ui {
  sheets = $state<number[]>([]);
  /** The full-height sheets (panel, pop, full) open with their first frame out: nothing of the island shows, so it is
   *  hidden then, not in the tap's frame (IslandScene's data-sheet). */
  up = $state<number[]>([]);
  /** The island's camera when the tent was entered (its world z): the island opens there again on the way out. */
  islandZ: number | null = null;
  /** My villager just came out of a building's door (island/doorOut.ts): where it steps out (world u) and its facing,
   *  once. */
  outAt: { at: readonly [number, number]; face: 'home' | 'l' | 'r' } | null = null;
  takeOutAt(): { at: readonly [number, number]; face: 'home' | 'l' | 'r' } | null {
    const p = this.outAt;
    this.outAt = null;
    return p;
  }
  /** The camera to come back to, once (then null). */
  takeIslandZ(): number | null {
    const z = this.islandZ;
    this.islandZ = null;
    return z;
  }
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
